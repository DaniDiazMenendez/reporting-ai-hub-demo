import type { AuditEvent, DataDomain, HubUser } from '../types';
import { HUB_USERS } from '../mocks/users';
import { SEED_AUDIT_EVENTS } from '../mocks/auditEvents';
import { DEFAULT_DOMAIN_AGENTS } from '../mocks/permissions';

/**
 * Estado del "backend" simulado. En producción esto viviría en la Azure Function
 * (sesiones en un store seguro, auditoría en Application Insights / Log Analytics).
 * Aquí se persiste en localStorage solo para que la demo sobreviva a recargas.
 */
export interface StoredSession {
  sessionId: string;
  userId: string;
  createdAt: string;
  expiresAt: string;
}

export interface BackendState {
  users: HubUser[];
  sessions: Record<string, StoredSession>;
  domainAgents: Record<DataDomain, string>;
  audit: AuditEvent[];
  usage: Record<string, number[]>;
  conversations: Record<string, { sessionId: string; lastDomain: DataDomain | null }>;
  demo: { aiUnavailable: boolean };
}

const STORAGE_KEY = 'reporting-hub-mock-backend-v1';

function initialState(): BackendState {
  return {
    users: structuredClone(HUB_USERS),
    sessions: {},
    domainAgents: { ...DEFAULT_DOMAIN_AGENTS },
    audit: structuredClone(SEED_AUDIT_EVENTS),
    usage: {},
    conversations: {},
    demo: { aiUnavailable: false }
  };
}

let state: BackendState | null = null;

export function getState(): BackendState {
  if (state) return state;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    state = raw ? { ...initialState(), ...(JSON.parse(raw) as BackendState) } : initialState();
  } catch {
    state = initialState();
  }
  return state;
}

export function saveState(): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(getState()));
  } catch {
    // Almacenamiento no disponible: la demo continúa solo en memoria.
  }
}

export function resetState(): void {
  state = initialState();
  saveState();
}

export function newId(prefix: string): string {
  const rand = Math.random().toString(36).slice(2, 8);
  return `${prefix}-${Date.now().toString(36)}-${rand}`;
}
