import type {
  ApiErrorBody,
  ApiErrorCode,
  AuditEvent,
  ChatRequest,
  ChatResponse,
  DataAgentConfig,
  DataDomain,
  HubRole,
  TraceStep
} from '../types';
import { REPORTS } from '../mocks/reports';
import { DOMAIN_MAIN_REPORT, MOCK_ANSWERS } from '../mocks/chatResponses';
import {
  DATA_AGENT_ALLOWLIST,
  DOMAIN_LABELS,
  ORCHESTRATOR_AGENT,
  ROLE_DEFINITIONS,
  requiredRolesForDomain
} from '../mocks/permissions';
import { containsAdministrativeInstruction, detectDomain, normalize } from './domainDetection';
import { validateSession } from './auth';
import { getState, newId, saveState } from './state';

export interface BackendResult<T> {
  status: number;
  body: T | ApiErrorBody;
}

const ALLOWED_REQUEST_FIELDS = new Set(['message', 'conversationId', 'sessionId', 'reportContext']);
const MAX_MESSAGE_LENGTH = 500;
const RATE_WINDOW_MS = 60 * 60 * 1000;

/** Resuelve el Data Agent autorizado usando el allowlist del backend. */
export function getAuthorizedAgentForDomain(role: HubRole, domain: DataDomain): DataAgentConfig | null {
  if (!ROLE_DEFINITIONS[role]) return null;
  const agentId = getState().domainAgents[domain];
  const agent = DATA_AGENT_ALLOWLIST.find((a) => a.id === agentId && a.domain === domain);
  return agent ?? null;
}

export function queriesUsedLastHour(userId: string): number {
  const now = Date.now();
  return (getState().usage[userId] ?? []).filter((t) => now - t < RATE_WINDOW_MS).length;
}

function buildAnswer(message: string, domain: DataDomain, contextReportId?: string) {
  const text = normalize(message);
  if (text.includes('reporte relacionado') || text.includes('muestrame el reporte')) {
    const reportId = contextReportId ?? DOMAIN_MAIN_REPORT[domain];
    const report = REPORTS.find((r) => r.id === reportId);
    return {
      answer: `El reporte relacionado con tu consulta es "${report?.name}". Puedes abrirlo desde el enlace de esta respuesta.`,
      relatedReportId: reportId
    };
  }
  const candidates = MOCK_ANSWERS.filter((a) => a.domain === domain);
  const match = candidates.find((a) => a.keywords.some((k) => text.includes(k))) ?? candidates[0];
  return { answer: match.answer, relatedReportId: match.relatedReportId };
}

/**
 * Simula la lógica de la Azure Function para POST /api/chat.
 * 1. Obtener sessionId · 2. Validar sesión · 3. Obtener rol · 4. Identificar dominio ·
 * 5. Validar acceso · 6. Seleccionar Data Agent · 7. Auditar · 8. Generar respuesta · 9. Devolver fuentes.
 */
export function processChatRequest(request: ChatRequest): BackendResult<ChatResponse> {
  const state = getState();
  const trace: TraceStep[] = [];
  const audit: AuditEvent = {
    id: newId('evt'),
    eventType: 'chat',
    userId: 'UNKNOWN',
    sessionId: typeof request?.sessionId === 'string' ? request.sessionId : 'N/A',
    role: 'UNKNOWN',
    timestamp: new Date().toISOString(),
    question: typeof request?.message === 'string' ? request.message.slice(0, 140) : undefined,
    requestedDomain: null,
    selectedAgent: null,
    authorizationResult: 'NOT_EVALUATED',
    relatedReport: null,
    responseStatus: 0
  };

  const fail = (status: number, error: ApiErrorCode, message: string, extra: Partial<ApiErrorBody> = {}) => {
    audit.responseStatus = status;
    audit.detail = error;
    if (audit.authorizationResult === 'NOT_EVALUATED' && (status === 403 || status === 400)) {
      audit.authorizationResult = 'DENIED';
    }
    trace.push({ step: '7. Registrar auditoría', status: 'ok', detail: `Evento ${audit.id} registrado (${error}).` });
    state.audit.unshift(audit);
    saveState();
    return { status, body: { error, message, ...extra, trace } };
  };

  // 1. Obtener sessionId y validar la forma de la solicitud
  const extraFields = Object.keys(request ?? {}).filter((k) => !ALLOWED_REQUEST_FIELDS.has(k));
  if (extraFields.length > 0) {
    trace.push({
      step: '1. Obtener sessionId',
      status: 'fail',
      detail: `Campos no permitidos desde el navegador: ${extraFields.join(', ')}.`
    });
    return fail(
      400,
      'CLIENT_OVERRIDE_REJECTED',
      'La solicitud incluye campos que el navegador no puede definir (rol, agente o permisos). El backend determina estos valores desde la sesión.'
    );
  }
  if (typeof request.message !== 'string' || request.message.trim().length === 0) {
    trace.push({ step: '1. Obtener sessionId', status: 'fail', detail: 'Mensaje vacío.' });
    return fail(400, 'BAD_REQUEST', 'La pregunta no puede estar vacía.');
  }
  if (request.message.length > MAX_MESSAGE_LENGTH) {
    trace.push({ step: '1. Obtener sessionId', status: 'fail', detail: 'Mensaje excede el largo máximo.' });
    return fail(400, 'BAD_REQUEST', `La pregunta supera los ${MAX_MESSAGE_LENGTH} caracteres permitidos.`);
  }
  trace.push({ step: '1. Obtener sessionId', status: 'ok', detail: `sessionId recibido (${String(request.sessionId).slice(0, 18)}…).` });

  // 2. Validar la sesión
  const check = validateSession(request.sessionId);
  if (!check.ok) {
    trace.push({ step: '2. Validar la sesión', status: 'fail', detail: check.message });
    return fail(401, check.code, check.message);
  }
  const { session, user } = check;
  audit.userId = session.userId;
  audit.role = session.role;
  trace.push({ step: '2. Validar la sesión', status: 'ok', detail: `Sesión vigente hasta ${new Date(session.expiresAt).toLocaleTimeString('es-CL')}.` });

  // 3. Obtener el rol (desde el registro del Hub) y aplicar límite de uso
  const roleDef = ROLE_DEFINITIONS[session.role];
  const used = queriesUsedLastHour(user.userId);
  if (used >= roleDef.queriesPerHour) {
    trace.push({ step: '3. Obtener el rol', status: 'fail', detail: `Límite de ${roleDef.queriesPerHour} consultas/hora alcanzado.` });
    return fail(429, 'RATE_LIMITED', `Alcanzaste el límite de ${roleDef.queriesPerHour} consultas por hora para tu rol. Intenta más tarde.`);
  }
  state.usage[user.userId] = [...(state.usage[user.userId] ?? []), Date.now()];
  trace.push({
    step: '3. Obtener el rol',
    status: 'ok',
    detail: `Rol ${roleDef.label} obtenido del registro del Hub. Consultas: ${used + 1}/${roleDef.queriesPerHour} por hora.`
  });

  if (containsAdministrativeInstruction(request.message)) {
    trace.push({ step: '4. Identificar el dominio', status: 'fail', detail: 'Se detectaron instrucciones administrativas en la pregunta.' });
    return fail(400, 'PROMPT_POLICY', 'La pregunta contiene instrucciones administrativas que no se aceptan desde el chat. Los permisos se administran en el backend.');
  }

  // 4. Identificar el dominio
  const conversation =
    request.conversationId && state.conversations[request.conversationId]?.sessionId === session.sessionId
      ? state.conversations[request.conversationId]
      : null;
  const conversationId = conversation ? (request.conversationId as string) : newId('conv');
  const detected = detectDomain(request.message);
  const contextDomain = request.reportContext?.domain;
  const domain: DataDomain | null =
    detected ?? contextDomain ?? conversation?.lastDomain ?? session.allowedDomains[0] ?? null;
  const domainOrigin = detected
    ? 'detectado en la pregunta'
    : contextDomain
      ? 'tomado del reporte abierto'
      : conversation?.lastDomain
        ? 'heredado de la conversación'
        : 'dominio principal del rol';
  audit.requestedDomain = domain;
  if (!domain) {
    trace.push({ step: '4. Identificar el dominio', status: 'fail', detail: 'No hay dominio identificable ni dominios habilitados.' });
    return fail(403, 'FORBIDDEN_DOMAIN', 'Tu rol del Hub no tiene dominios de datos habilitados para el asistente.', { requiredRoles: [] });
  }
  trace.push({ step: '4. Identificar el dominio', status: 'ok', detail: `Dominio ${DOMAIN_LABELS[domain]} (${domainOrigin}).` });

  // 5. Validar acceso al dominio y al reporte de contexto
  if (!session.allowedDomains.includes(domain)) {
    const requiredRoles = requiredRolesForDomain(domain);
    audit.authorizationResult = 'DENIED';
    trace.push({ step: '5. Validar acceso al dominio', status: 'fail', detail: `El rol ${roleDef.label} no incluye ${DOMAIN_LABELS[domain]}.` });
    return fail(403, 'FORBIDDEN_DOMAIN', `No tienes permisos para consultar el dominio ${DOMAIN_LABELS[domain]} desde el Hub.`, { requiredRoles });
  }
  if (request.reportContext) {
    const ctxReport = REPORTS.find((r) => r.id === request.reportContext?.reportId);
    if (!ctxReport || !session.allowedReportIds.includes(ctxReport.id) || ctxReport.domain !== request.reportContext.domain) {
      audit.authorizationResult = 'DENIED';
      trace.push({ step: '5. Validar acceso al dominio', status: 'fail', detail: 'El reporte de contexto no está autorizado para la sesión.' });
      return fail(403, 'FORBIDDEN_REPORT', 'El reporte indicado como contexto no está permitido para tu usuario.');
    }
  }
  audit.authorizationResult = 'AUTHORIZED';
  trace.push({ step: '5. Validar acceso al dominio', status: 'ok', detail: `Rol ${roleDef.label} autorizado para ${DOMAIN_LABELS[domain]}.` });

  // 6. Seleccionar el Data Agent autorizado (allowlist del backend)
  const agent = getAuthorizedAgentForDomain(session.role, domain);
  if (!agent) {
    trace.push({ step: '6. Seleccionar Data Agent', status: 'fail', detail: 'No hay un agente en el allowlist para el dominio.' });
    return fail(403, 'FORBIDDEN', 'No existe un Data Agent autorizado para este dominio.');
  }
  audit.selectedAgent = agent.name;
  trace.push({ step: '6. Seleccionar Data Agent', status: 'ok', detail: `${agent.name} (allowlist del backend).` });

  // 8 (previo a auditar el resultado). Simular la llamada al agente de Foundry con Managed Identity
  if (state.demo.aiUnavailable) {
    trace.push({ step: '8. Generar respuesta', status: 'fail', detail: 'Microsoft Foundry no respondió (simulado).' });
    return fail(503, 'AI_SERVICE_UNAVAILABLE', 'El servicio de IA no está disponible en este momento. Intenta nuevamente en unos minutos.');
  }

  const built = buildAnswer(request.message, domain, request.reportContext?.reportId);
  const relatedId = session.allowedReportIds.includes(built.relatedReportId) ? built.relatedReportId : null;
  const related = relatedId ? REPORTS.find((r) => r.id === relatedId) ?? null : null;
  audit.relatedReport = related?.id ?? null;
  audit.responseStatus = 200;
  state.audit.unshift(audit);
  state.conversations[conversationId] = { sessionId: session.sessionId, lastDomain: domain };
  saveState();
  trace.push({ step: '7. Registrar auditoría', status: 'ok', detail: `Evento ${audit.id} registrado (sin datos de la respuesta).` });
  trace.push({ step: '8. Generar respuesta', status: 'ok', detail: `${ORCHESTRATOR_AGENT} respondió vía ${agent.name}.` });
  trace.push({ step: '9. Devolver fuentes y reporte', status: 'ok', detail: `${agent.sources.length} fuente(s), reporte: ${related?.name ?? 'no disponible'}.` });

  return {
    status: 200,
    body: {
      answer: built.answer,
      conversationId,
      agent: ORCHESTRATOR_AGENT,
      dataAgent: agent.name,
      domain,
      authorization: { authorized: true, authorizationSource: 'Hub application role', role: session.role },
      sources: agent.sources,
      relatedReport: related ? { id: related.id, name: related.name } : null,
      timestamp: new Date().toISOString(),
      accessLevelApplied: `Rol ${roleDef.label}`,
      trace
    }
  };
}
