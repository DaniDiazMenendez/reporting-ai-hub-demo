import type { HubSession, HubUser } from '../types';
import { REPORTS } from '../mocks/reports';
import { getState, type StoredSession } from './state';

export type SessionCheck =
  | { ok: true; session: HubSession; user: HubUser; stored: StoredSession }
  | { ok: false; code: 'SESSION_NOT_FOUND' | 'SESSION_EXPIRED'; message: string };

/**
 * Reconstruye los permisos desde el registro del usuario en el backend en CADA solicitud.
 * Nunca se usa un rol o dominio enviado por el navegador.
 */
export function buildSession(stored: StoredSession, user: HubUser): HubSession {
  const allowedReportIds = user.allowedReportIds.filter((id) => {
    const report = REPORTS.find((r) => r.id === id);
    return report !== undefined && user.allowedDomains.includes(report.domain);
  });
  return {
    sessionId: stored.sessionId,
    userId: user.userId,
    displayName: user.displayName,
    role: user.role,
    allowedDomains: [...user.allowedDomains],
    allowedReportIds,
    expiresAt: stored.expiresAt
  };
}

export function validateSession(sessionId: unknown): SessionCheck {
  if (typeof sessionId !== 'string' || sessionId.length === 0) {
    return { ok: false, code: 'SESSION_NOT_FOUND', message: 'No existe una sesión activa del Hub.' };
  }
  const state = getState();
  const stored = state.sessions[sessionId];
  if (!stored) {
    return { ok: false, code: 'SESSION_NOT_FOUND', message: 'La sesión no existe o fue cerrada.' };
  }
  if (new Date(stored.expiresAt).getTime() <= Date.now()) {
    return { ok: false, code: 'SESSION_EXPIRED', message: 'La sesión del Hub expiró. Vuelve a ingresar.' };
  }
  const user = state.users.find((u) => u.userId === stored.userId);
  if (!user || !user.active) {
    return { ok: false, code: 'SESSION_NOT_FOUND', message: 'El usuario de la sesión no está activo en el Hub.' };
  }
  return { ok: true, session: buildSession(stored, user), user, stored };
}
