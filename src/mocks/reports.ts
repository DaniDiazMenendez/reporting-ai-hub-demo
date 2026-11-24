import type { Report } from '../types';

/** Catálogo ficticio. No contiene IDs ni URLs reales de Power BI. */
export const REPORTS: Report[] = [
  {
    id: 'production-report',
    name: 'Producción por planta',
    description: 'Toneladas producidas por planta, línea y período, con variación respecto del período anterior.',
    domain: 'production',
    owner: 'Gerencia de Producción',
    dataSource: 'Semantic Model Producción',
    lastUpdated: '2026-11-20T07:30:00-03:00',
    accessLevel: 'Interno'
  },
  {
    id: 'operational-costs',
    name: 'Costos operacionales',
    description: 'Evolución de costos por centro de costo, energía, insumos y mano de obra.',
    domain: 'finance',
    owner: 'Gerencia de Finanzas',
    dataSource: 'Semantic Model Finanzas',
    lastUpdated: '2026-11-19T22:00:00-03:00',
    accessLevel: 'Confidencial'
  },
  {
    id: 'regional-sales',
    name: 'Ventas regionales',
    description: 'Ventas por región, familia de producto y canal comercial.',
    domain: 'commercial',
    owner: 'Gerencia Comercial',
    dataSource: 'Semantic Model Comercial',
    lastUpdated: '2026-11-20T06:00:00-03:00',
    accessLevel: 'Restringido'
  },
  {
    id: 'inventory',
    name: 'Inventario',
    description: 'Stock de productos terminados e insumos críticos, cobertura en días y rotación.',
    domain: 'operations',
    owner: 'Gerencia de Operaciones',
    dataSource: 'Semantic Model Operaciones',
    lastUpdated: '2026-11-20T05:45:00-03:00',
    accessLevel: 'Interno'
  },
  {
    id: 'executive-kpis',
    name: 'Indicadores ejecutivos',
    description: 'Tablero consolidado con los KPIs corporativos clave de la compañía.',
    domain: 'executive',
    owner: 'Gerencia General',
    dataSource: 'Semantic Model Ejecutivo (agregado)',
    lastUpdated: '2026-11-20T08:00:00-03:00',
    accessLevel: 'Confidencial'
  },
  {
    id: 'maintenance',
    name: 'Mantenimiento',
    description: 'Cumplimiento del plan preventivo, órdenes de trabajo y disponibilidad de equipos.',
    domain: 'operations',
    owner: 'Gerencia de Operaciones',
    dataSource: 'Lakehouse Operaciones',
    lastUpdated: '2026-11-19T18:20:00-03:00',
    accessLevel: 'Interno'
  },
  {
    id: 'goals-compliance',
    name: 'Cumplimiento de metas',
    description: 'Avance de metas comerciales por ejecutivo, región y trimestre.',
    domain: 'commercial',
    owner: 'Gerencia Comercial',
    dataSource: 'Semantic Model Comercial',
    lastUpdated: '2026-11-18T21:10:00-03:00',
    accessLevel: 'Restringido'
  },
  {
    id: 'commercial-performance',
    name: 'Desempeño comercial',
    description: 'Margen comercial, cartera de clientes y tasa de conversión de oportunidades.',
    domain: 'commercial',
    owner: 'Gerencia Comercial',
    dataSource: 'Semantic Model Comercial',
    lastUpdated: '2026-11-19T09:00:00-03:00',
    accessLevel: 'Restringido'
  }
];

export const ALL_REPORT_IDS = REPORTS.map((r) => r.id);
