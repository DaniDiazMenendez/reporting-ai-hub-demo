import type { DataAgentConfig, DataDomain, HubRole } from '../types';

export const ORCHESTRATOR_AGENT = 'Reporting Assistant';

export const DOMAIN_LABELS: Record<DataDomain, string> = {
  executive: 'Ejecutivo',
  commercial: 'Comercial',
  finance: 'Finanzas',
  operations: 'Operaciones',
  production: 'Producción'
};

export const ALL_DOMAINS: DataDomain[] = ['executive', 'commercial', 'finance', 'operations', 'production'];

export interface RoleDefinition {
  label: string;
  description: string;
  defaultDomains: DataDomain[];
  capabilities: string[];
  queriesPerHour: number;
  adminAccess: boolean;
}

/** Matriz de roles de la aplicación (no son grupos de Entra ID ni permisos de Fabric). */
export const ROLE_DEFINITIONS: Record<HubRole, RoleDefinition> = {
  EXECUTIVE: {
    label: 'Ejecutivo',
    description: 'Visión consolidada de la compañía.',
    defaultDomains: ['executive', 'commercial', 'operations', 'production', 'finance'],
    capabilities: ['Indicadores ejecutivos', 'Comercial', 'Operaciones', 'Producción', 'Finanzas consolidadas (lectura)'],
    queriesPerHour: 60,
    adminAccess: false
  },
  FINANCE: {
    label: 'Finanzas',
    description: 'Costos e indicadores financieros.',
    defaultDomains: ['finance'],
    capabilities: ['Costos operacionales', 'Indicadores financieros'],
    queriesPerHour: 40,
    adminAccess: false
  },
  OPERATIONS: {
    label: 'Operaciones',
    description: 'Producción, inventario y mantenimiento.',
    defaultDomains: ['operations', 'production'],
    capabilities: ['Producción', 'Inventario', 'Mantenimiento'],
    queriesPerHour: 40,
    adminAccess: false
  },
  COMMERCIAL: {
    label: 'Comercial',
    description: 'Ventas, clientes y metas comerciales.',
    defaultDomains: ['commercial'],
    capabilities: ['Ventas', 'Clientes', 'Cumplimiento de metas'],
    queriesPerHour: 40,
    adminAccess: false
  },
  ADMIN: {
    label: 'Administrador',
    description: 'Administra el Hub. No consulta datos de negocio.',
    defaultDomains: [],
    capabilities: ['Catálogo', 'Configuración', 'Auditoría', 'Administración de roles'],
    queriesPerHour: 10,
    adminAccess: true
  }
};

export const ALL_ROLES: HubRole[] = ['EXECUTIVE', 'FINANCE', 'OPERATIONS', 'COMMERCIAL', 'ADMIN'];

export function requiredRolesForDomain(domain: DataDomain): HubRole[] {
  return ALL_ROLES.filter((r) => ROLE_DEFINITIONS[r].defaultDomains.includes(domain)).sort((a, b) =>
    a === 'EXECUTIVE' ? 1 : b === 'EXECUTIVE' ? -1 : 0
  );
}

/** Allowlist de Data Agents que la Azure Function puede invocar. El frontend nunca elige el agente. */
export const DATA_AGENT_ALLOWLIST: DataAgentConfig[] = [
  {
    id: 'da-commercial',
    name: 'Fabric Data Agent - Comercial',
    domain: 'commercial',
    sources: [{ name: 'Semantic Model Comercial', type: 'Power BI Semantic Model' }],
    description: 'Ventas, clientes y metas comerciales.'
  },
  {
    id: 'da-commercial-summary',
    name: 'Fabric Data Agent - Comercial (resumen)',
    domain: 'commercial',
    sources: [{ name: 'Semantic Model Comercial Resumen', type: 'Power BI Semantic Model' }],
    description: 'Vista agregada sin detalle por cliente.'
  },
  {
    id: 'da-finance',
    name: 'Fabric Data Agent - Finanzas',
    domain: 'finance',
    sources: [{ name: 'Semantic Model Finanzas', type: 'Power BI Semantic Model' }],
    description: 'Costos operacionales e indicadores financieros.'
  },
  {
    id: 'da-operations',
    name: 'Fabric Data Agent - Operaciones',
    domain: 'operations',
    sources: [
      { name: 'Semantic Model Operaciones', type: 'Power BI Semantic Model' },
      { name: 'Lakehouse Operaciones', type: 'Fabric Lakehouse' }
    ],
    description: 'Inventario y mantenimiento.'
  },
  {
    id: 'da-production',
    name: 'Fabric Data Agent - Producción',
    domain: 'production',
    sources: [{ name: 'Semantic Model Producción', type: 'Power BI Semantic Model' }],
    description: 'Producción por planta y variaciones.'
  },
  {
    id: 'da-production-agg',
    name: 'Fabric Data Agent - Producción (agregado)',
    domain: 'production',
    sources: [{ name: 'Warehouse Producción Agregada', type: 'Fabric Warehouse' }],
    description: 'Producción mensual agregada, sin detalle de turno.'
  },
  {
    id: 'da-executive',
    name: 'Fabric Data Agent - Ejecutivo',
    domain: 'executive',
    sources: [{ name: 'Semantic Model Ejecutivo (agregado)', type: 'Power BI Semantic Model' }],
    description: 'KPIs corporativos consolidados.'
  }
];

export const DEFAULT_DOMAIN_AGENTS: Record<DataDomain, string> = {
  commercial: 'da-commercial',
  finance: 'da-finance',
  operations: 'da-operations',
  production: 'da-production',
  executive: 'da-executive'
};

export const SESSION_DURATION_MINUTES = 30;
