import type { HubUser } from '../types';
import { REPORTS } from './reports';
import { ROLE_DEFINITIONS } from './permissions';

const reportsFor = (domains: string[]) => REPORTS.filter((r) => domains.includes(r.domain)).map((r) => r.id);

/** Usuarios ficticios registrados en el Hub (no son cuentas de Entra ID). */
export const HUB_USERS: HubUser[] = [
  {
    userId: 'USR-1001',
    displayName: 'Andrea Rojas',
    area: 'Gerencia General',
    role: 'EXECUTIVE',
    allowedDomains: [...ROLE_DEFINITIONS.EXECUTIVE.defaultDomains],
    allowedReportIds: reportsFor(ROLE_DEFINITIONS.EXECUTIVE.defaultDomains),
    active: true
  },
  {
    userId: 'USR-1302',
    displayName: 'Martín Fuentes',
    area: 'Finanzas',
    role: 'FINANCE',
    allowedDomains: [...ROLE_DEFINITIONS.FINANCE.defaultDomains],
    allowedReportIds: reportsFor(ROLE_DEFINITIONS.FINANCE.defaultDomains),
    active: true
  },
  {
    userId: 'USR-2048',
    displayName: 'Usuario Demo',
    area: 'Operaciones',
    role: 'OPERATIONS',
    allowedDomains: ['operations', 'production'],
    allowedReportIds: reportsFor(['operations', 'production']),
    active: true
  },
  {
    userId: 'USR-3110',
    displayName: 'Valentina Soto',
    area: 'Comercial',
    role: 'COMMERCIAL',
    allowedDomains: [...ROLE_DEFINITIONS.COMMERCIAL.defaultDomains],
    allowedReportIds: reportsFor(ROLE_DEFINITIONS.COMMERCIAL.defaultDomains),
    active: true
  },
  {
    userId: 'USR-0001',
    displayName: 'Administrador Hub',
    area: 'TI / Más Analytics',
    role: 'ADMIN',
    allowedDomains: [],
    allowedReportIds: [],
    active: true
  },
  {
    userId: 'USR-2077',
    displayName: 'Jorge Paredes',
    area: 'Planta Norte',
    role: 'OPERATIONS',
    allowedDomains: ['production'],
    allowedReportIds: ['production-report'],
    active: true
  }
];

/** Usuario utilizado por el simulador para cada rol. */
export const DEMO_USER_BY_ROLE = {
  EXECUTIVE: 'USR-1001',
  FINANCE: 'USR-1302',
  OPERATIONS: 'USR-2048',
  COMMERCIAL: 'USR-3110',
  ADMIN: 'USR-0001'
} as const;
