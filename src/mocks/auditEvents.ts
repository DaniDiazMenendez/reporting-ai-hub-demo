import type { AuditEvent } from '../types';

/** Eventos iniciales ficticios. No incluyen secretos, credenciales ni respuestas con datos. */
export const SEED_AUDIT_EVENTS: AuditEvent[] = [
  {
    id: 'evt-0001',
    eventType: 'chat',
    userId: 'USR-1001',
    sessionId: 'hub-session-seed-01',
    role: 'EXECUTIVE',
    timestamp: '2026-11-20T08:12:00-03:00',
    question: 'Resume los indicadores ejecutivos consolidados.',
    requestedDomain: 'executive',
    selectedAgent: 'Fabric Data Agent - Ejecutivo',
    authorizationResult: 'AUTHORIZED',
    relatedReport: 'executive-kpis',
    responseStatus: 200
  },
  {
    id: 'evt-0002',
    eventType: 'chat',
    userId: 'USR-2048',
    sessionId: 'hub-session-seed-02',
    role: 'OPERATIONS',
    timestamp: '2026-11-20T09:05:00-03:00',
    question: '¿Cuánto fue el costo operacional?',
    requestedDomain: 'finance',
    selectedAgent: null,
    authorizationResult: 'DENIED',
    relatedReport: null,
    responseStatus: 403,
    detail: 'FORBIDDEN_DOMAIN'
  },
  {
    id: 'evt-0003',
    eventType: 'chat',
    userId: 'USR-3110',
    sessionId: 'hub-session-seed-03',
    role: 'COMMERCIAL',
    timestamp: '2026-11-20T10:41:00-03:00',
    question: 'Resume los principales indicadores comerciales.',
    requestedDomain: 'commercial',
    selectedAgent: 'Fabric Data Agent - Comercial',
    authorizationResult: 'AUTHORIZED',
    relatedReport: 'commercial-performance',
    responseStatus: 200
  }
];

export interface ActivityItem {
  id: string;
  text: string;
  when: string;
  kind: 'report' | 'chat' | 'favorite' | 'refresh';
}

export const RECENT_ACTIVITY: ActivityItem[] = [
  { id: 'act-1', text: 'Se consultó el reporte de producción.', when: '2026-11-20T11:20:00-03:00', kind: 'report' },
  { id: 'act-2', text: 'Se realizó una pregunta al asistente.', when: '2026-11-20T10:58:00-03:00', kind: 'chat' },
  { id: 'act-3', text: 'Se agregó un reporte a favoritos.', when: '2026-11-20T09:47:00-03:00', kind: 'favorite' },
  { id: 'act-4', text: 'Se actualizó el semantic model de operaciones.', when: '2026-11-20T05:45:00-03:00', kind: 'refresh' }
];
