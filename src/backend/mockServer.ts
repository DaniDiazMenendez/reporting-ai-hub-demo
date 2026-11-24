import type {
  ApiErrorBody,
  AuditEvent,
  ChatRequest,
  DataDomain,
  HubRole,
  HubUser,
  PermissionsView,
  ServiceStatus
} from '../types';
import { REPORTS } from '../mocks/reports';
import {
  ALL_DOMAINS,
  ALL_ROLES,
  DATA_AGENT_ALLOWLIST,
  ROLE_DEFINITIONS,
  SESSION_DURATION_MINUTES
} from '../mocks/permissions';
import { buildSession, validateSession } from './auth';
import { getAuthorizedAgentForDomain, processChatRequest, queriesUsedLastHour, type BackendResult } from './processChatRequest';
import { getState, newId, resetState, saveState } from './state';

/**
 * Router que simula la API protegida del Hub + Azure Function.
 * El frontend solo conoce rutas HTTP; nunca importa este módulo directamente salvo a través de apiClient.
 */
export interface MockRequest {
  method: 'GET' | 'POST' | 'PUT';
  path: string;
  sessionId: string | null;
  body?: unknown;
}

const ok = <T>(body: T, status = 200): BackendResult<T> => ({ status, body });
const err = (status: number, error: ApiErrorBody['error'], message: string): BackendResult<never> => ({
  status,
  body: { error, message }
});

function audit(event: Omit<AuditEvent, 'id' | 'timestamp'>) {
  const state = getState();
  state.audit.unshift({ ...event, id: newId('evt'), timestamp: new Date().toISOString() });
  state.audit = state.audit.slice(0, 300);
}

function requireSession(sessionId: string | null) {
  const check = validateSession(sessionId);
  return check;
}

function permissionsFor(user: HubUser, sessionReports: string[]): PermissionsView {
  const def = ROLE_DEFINITIONS[user.role];
  const agents = user.allowedDomains
    .map((d) => getAuthorizedAgentForDomain(user.role, d))
    .filter((a): a is NonNullable<typeof a> => a !== null);
  const deniedDomains = ALL_DOMAINS.filter((d) => !user.allowedDomains.includes(d));
  const primaryUnavailable = deniedDomains
    .map((d) => DATA_AGENT_ALLOWLIST.find((a) => a.id === getState().domainAgents[d]))
    .filter((a): a is NonNullable<typeof a> => a !== undefined);
  return {
    role: user.role,
    roleLabel: def.label,
    allowedDomains: [...user.allowedDomains],
    deniedDomains,
    allowedReportIds: sessionReports,
    availableDataAgents: agents,
    unavailableDataAgents: primaryUnavailable,
    queriesPerHour: def.queriesPerHour,
    queriesUsedLastHour: queriesUsedLastHour(user.userId),
    adminAccess: def.adminAccess
  };
}

export function handleRequest(req: MockRequest): BackendResult<unknown> {
  const state = getState();
  const { method, path } = req;
  const route = `${method} ${path.split('?')[0]}`;

  // ---------- Sesión ----------
  if (route === 'POST /api/session/login') {
    const body = (req.body ?? {}) as Record<string, unknown>;
    // Cualquier rol enviado por el navegador se ignora: el rol se obtiene del registro del usuario.
    const user = state.users.find((u) => u.userId === body.userId && u.active);
    if (!user) return err(401, 'SESSION_NOT_FOUND', 'Usuario no reconocido por el Hub.');
    const now = Date.now();
    const stored = {
      sessionId: newId('hub-session'),
      userId: user.userId,
      createdAt: new Date(now).toISOString(),
      expiresAt: new Date(now + SESSION_DURATION_MINUTES * 60_000).toISOString()
    };
    state.sessions[stored.sessionId] = stored;
    audit({
      eventType: 'session',
      userId: user.userId,
      sessionId: stored.sessionId,
      role: user.role,
      authorizationResult: 'AUTHORIZED',
      responseStatus: 200,
      detail: 'LOGIN'
    });
    saveState();
    return ok(buildSession(stored, user));
  }

  if (route === 'POST /api/session/logout') {
    const check = requireSession(req.sessionId);
    if (req.sessionId && state.sessions[req.sessionId]) {
      const stored = state.sessions[req.sessionId];
      const user = state.users.find((u) => u.userId === stored.userId);
      delete state.sessions[req.sessionId];
      audit({
        eventType: 'session',
        userId: stored.userId,
        sessionId: stored.sessionId,
        role: user?.role ?? 'UNKNOWN',
        authorizationResult: check.ok ? 'AUTHORIZED' : 'NOT_EVALUATED',
        responseStatus: 200,
        detail: 'LOGOUT'
      });
      saveState();
    }
    return ok({ loggedOut: true });
  }

  if (route === 'GET /api/session') {
    const check = requireSession(req.sessionId);
    if (!check.ok) return err(401, check.code, check.message);
    return ok(check.session);
  }

  // Rutas públicas de la pantalla de ingreso simulada
  if (route === 'GET /api/session/demo-users') {
    return ok(
      state.users
        .filter((u) => u.active)
        .map((u) => ({ userId: u.userId, displayName: u.displayName, area: u.area, role: u.role }))
    );
  }

  if (route === 'GET /api/status') {
    const status: ServiceStatus = {
      aiService: state.demo.aiUnavailable ? 'unavailable' : 'operational',
      lastCheck: new Date().toISOString()
    };
    return ok(status);
  }

  // ---------- A partir de aquí todo requiere sesión válida ----------
  const check = requireSession(req.sessionId);
  if (!check.ok) return err(401, check.code, check.message);
  const { session, user } = check;
  const isAdmin = ROLE_DEFINITIONS[session.role].adminAccess;

  if (route === 'GET /api/reports') {
    const visible = REPORTS.filter((r) => session.allowedReportIds.includes(r.id));
    return ok({ reports: visible, hiddenCount: REPORTS.length - visible.length });
  }

  const reportMatch = path.match(/^\/api\/reports\/([\w-]+)$/);
  if (method === 'GET' && reportMatch) {
    const report = REPORTS.find((r) => r.id === reportMatch[1]);
    if (!report) return err(404, 'NOT_FOUND', 'El reporte solicitado no existe.');
    if (!session.allowedReportIds.includes(report.id)) {
      audit({
        eventType: 'report',
        userId: session.userId,
        sessionId: session.sessionId,
        role: session.role,
        requestedDomain: report.domain,
        authorizationResult: 'DENIED',
        relatedReport: report.id,
        responseStatus: 403,
        detail: 'FORBIDDEN_REPORT'
      });
      saveState();
      return err(403, 'FORBIDDEN_REPORT', 'Tu rol del Hub no permite abrir este reporte.');
    }
    audit({
      eventType: 'report',
      userId: session.userId,
      sessionId: session.sessionId,
      role: session.role,
      requestedDomain: report.domain,
      authorizationResult: 'AUTHORIZED',
      relatedReport: report.id,
      responseStatus: 200,
      detail: 'OPEN_REPORT'
    });
    saveState();
    return ok(report);
  }

  if (route === 'GET /api/permissions') {
    return ok(permissionsFor(user, session.allowedReportIds));
  }

  if (route === 'POST /api/chat') {
    const body = { ...((req.body ?? {}) as ChatRequest), sessionId: req.sessionId ?? '' };
    return processChatRequest(body);
  }

  if (route === 'GET /api/audit') {
    const events = isAdmin ? state.audit : state.audit.filter((e) => e.userId === session.userId);
    return ok({ scope: isAdmin ? 'all' : 'own', events: events.slice(0, 100) });
  }

  // ---------- Administración (solo rol ADMIN, validado en backend) ----------
  if (path.startsWith('/api/admin')) {
    if (!isAdmin) {
      audit({
        eventType: 'admin',
        userId: session.userId,
        sessionId: session.sessionId,
        role: session.role,
        authorizationResult: 'DENIED',
        responseStatus: 403,
        detail: `${method} ${path}`
      });
      saveState();
      return err(403, 'FORBIDDEN', 'Solo el rol Administrador puede acceder a la administración del Hub.');
    }

    if (route === 'GET /api/admin/config') {
      return ok({
        users: state.users,
        roles: ALL_ROLES.map((r) => ({ role: r, ...ROLE_DEFINITIONS[r] })),
        domainAgents: state.domainAgents,
        agentAllowlist: DATA_AGENT_ALLOWLIST
      });
    }

    const userMatch = path.match(/^\/api\/admin\/users\/([\w-]+)$/);
    if (method === 'PUT' && userMatch) {
      const target = state.users.find((u) => u.userId === userMatch[1]);
      if (!target) return err(404, 'NOT_FOUND', 'Usuario no encontrado.');
      const body = (req.body ?? {}) as Partial<Pick<HubUser, 'role' | 'allowedDomains' | 'allowedReportIds'>>;
      if (body.role && !ALL_ROLES.includes(body.role as HubRole)) return err(400, 'BAD_REQUEST', 'Rol inválido.');
      const domains = (body.allowedDomains ?? target.allowedDomains).filter((d): d is DataDomain => ALL_DOMAINS.includes(d));
      const reports = (body.allowedReportIds ?? target.allowedReportIds).filter((id) =>
        REPORTS.some((r) => r.id === id && domains.includes(r.domain))
      );
      target.role = (body.role as HubRole) ?? target.role;
      target.allowedDomains = domains;
      target.allowedReportIds = reports;
      audit({
        eventType: 'admin',
        userId: session.userId,
        sessionId: session.sessionId,
        role: session.role,
        authorizationResult: 'AUTHORIZED',
        responseStatus: 200,
        detail: `Permisos actualizados para ${target.userId}`
      });
      saveState();
      return ok(target);
    }

    if (route === 'PUT /api/admin/domain-agents') {
      const body = (req.body ?? {}) as { domain?: DataDomain; agentId?: string };
      const agent = DATA_AGENT_ALLOWLIST.find((a) => a.id === body.agentId);
      if (!body.domain || !agent || agent.domain !== body.domain) {
        return err(400, 'BAD_REQUEST', 'El agente no pertenece al allowlist del dominio indicado.');
      }
      state.domainAgents[body.domain] = agent.id;
      audit({
        eventType: 'admin',
        userId: session.userId,
        sessionId: session.sessionId,
        role: session.role,
        authorizationResult: 'AUTHORIZED',
        responseStatus: 200,
        detail: `Dominio ${body.domain} → ${agent.name}`
      });
      saveState();
      return ok(state.domainAgents);
    }
  }

  return err(404, 'NOT_FOUND', `Ruta no encontrada: ${route}`);
}

/** Controles exclusivos de la demo (no existen en un backend productivo). */
export const demoControls = {
  expireSession(sessionId: string | null) {
    const state = getState();
    if (sessionId && state.sessions[sessionId]) {
      state.sessions[sessionId].expiresAt = new Date(Date.now() - 1000).toISOString();
      saveState();
    }
  },
  exhaustRateLimit(sessionId: string | null) {
    const state = getState();
    const stored = sessionId ? state.sessions[sessionId] : undefined;
    const user = stored ? state.users.find((u) => u.userId === stored.userId) : undefined;
    if (!user) return;
    const limit = ROLE_DEFINITIONS[user.role].queriesPerHour;
    state.usage[user.userId] = Array.from({ length: limit }, () => Date.now());
    saveState();
  },
  resetRateLimit(sessionId: string | null) {
    const state = getState();
    const stored = sessionId ? state.sessions[sessionId] : undefined;
    if (stored) {
      state.usage[stored.userId] = [];
      saveState();
    }
  },
  setAiUnavailable(value: boolean) {
    getState().demo.aiUnavailable = value;
    saveState();
  },
  isAiUnavailable() {
    return getState().demo.aiUnavailable;
  },
  resetAll() {
    resetState();
  }
};
