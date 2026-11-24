import type { DataDomain } from '../types';

export interface MockAnswer {
  id: string;
  domain: DataDomain;
  keywords: string[];
  answer: string;
  relatedReportId: string;
}

/** Respuestas ficticias. Las cifras son ilustrativas y no representan datos reales. */
export const MOCK_ANSWERS: MockAnswer[] = [
  {
    id: 'prod-last-month',
    domain: 'production',
    keywords: ['ultimo mes', 'produccion total', 'produccion del'],
    answer:
      'La producción total del último mes fue de 12.480 t, un 4,5 % más que el período anterior. La Planta Norte explica la mayor parte del aumento (+7,2 %).',
    relatedReportId: 'production-report'
  },
  {
    id: 'prod-variation',
    domain: 'production',
    keywords: ['variacion', 'planta'],
    answer:
      'La Planta Sur registró la mayor variación: −6,1 % respecto del período anterior, asociada a una detención programada de horno. Planta Norte (+7,2 %) y Planta Centro (+1,8 %) compensaron parcialmente la baja.',
    relatedReportId: 'production-report'
  },
  {
    id: 'prod-attention',
    domain: 'production',
    keywords: ['atencion', 'alerta'],
    answer:
      'En Producción requieren atención: rendimiento de la Planta Sur (−6,1 %) y el índice de rechazo de piezas (2,9 %, sobre la meta de 2,5 %).',
    relatedReportId: 'production-report'
  },
  {
    id: 'ops-inventory',
    domain: 'operations',
    keywords: ['inventario', 'stock', 'cobertura'],
    answer:
      'El inventario actual de producto terminado es de 3.215 t, equivalente a 18 días de cobertura. Dos insumos críticos están bajo el stock de seguridad.',
    relatedReportId: 'inventory'
  },
  {
    id: 'ops-maintenance',
    domain: 'operations',
    keywords: ['mantenimiento', 'disponibilidad', 'equipos'],
    answer:
      'El cumplimiento del plan de mantenimiento preventivo es de 92 % y la disponibilidad promedio de equipos críticos alcanza 95,4 %.',
    relatedReportId: 'maintenance'
  },
  {
    id: 'ops-attention',
    domain: 'operations',
    keywords: ['atencion', 'alerta'],
    answer:
      'En Operaciones requieren atención: dos insumos críticos bajo stock de seguridad y 14 órdenes de mantenimiento preventivo atrasadas.',
    relatedReportId: 'inventory'
  },
  {
    id: 'fin-costs',
    domain: 'finance',
    keywords: ['costo', 'costos', 'gasto'],
    answer:
      'Los costos operacionales aumentaron 2,8 % en el trimestre. El principal factor fue energía (+5,4 %), parcialmente compensado por eficiencias en insumos (−1,2 %).',
    relatedReportId: 'operational-costs'
  },
  {
    id: 'fin-attention',
    domain: 'finance',
    keywords: ['atencion', 'alerta'],
    answer: 'En Finanzas requieren atención: costo de energía (+5,4 %) y desviación presupuestaria del centro de costo de fundición (+3,1 %).',
    relatedReportId: 'operational-costs'
  },
  {
    id: 'com-kpis',
    domain: 'commercial',
    keywords: ['indicadores comerciales', 'resume', 'resumen', 'principales'],
    answer:
      'Indicadores comerciales: ventas acumuladas al 104 % de la meta anual, margen comercial de 21,3 % (+0,6 pp) y tasa de conversión de oportunidades de 34 %.',
    relatedReportId: 'commercial-performance'
  },
  {
    id: 'com-sales',
    domain: 'commercial',
    keywords: ['venta', 'ventas', 'region'],
    answer: 'Las ventas del mes crecieron 3,9 %. La región Andina lidera el crecimiento (+8,1 %), mientras que la región Sur cae 2,4 %.',
    relatedReportId: 'regional-sales'
  },
  {
    id: 'com-goals',
    domain: 'commercial',
    keywords: ['meta', 'metas', 'cumplimiento'],
    answer: 'El cumplimiento de metas del trimestre es de 97 %. Tres de cinco regiones superan la meta.',
    relatedReportId: 'goals-compliance'
  },
  {
    id: 'com-attention',
    domain: 'commercial',
    keywords: ['atencion', 'alerta'],
    answer: 'En Comercial requieren atención: caída de ventas en la región Sur (−2,4 %) y dos clientes clave con pedidos bajo lo proyectado.',
    relatedReportId: 'regional-sales'
  },
  {
    id: 'exec-kpis',
    domain: 'executive',
    keywords: ['ejecutiv', 'consolidad', 'kpi'],
    answer:
      'Resumen ejecutivo: producción +4,5 %, ventas al 104 % de la meta, costos operacionales +2,8 % y disponibilidad de equipos de 95,4 %.',
    relatedReportId: 'executive-kpis'
  },
  {
    id: 'exec-attention',
    domain: 'executive',
    keywords: ['atencion', 'alerta'],
    answer: 'A nivel ejecutivo requieren atención: costo de energía, rendimiento de la Planta Sur y caída comercial en la región Sur.',
    relatedReportId: 'executive-kpis'
  }
];

export const DOMAIN_MAIN_REPORT: Record<DataDomain, string> = {
  production: 'production-report',
  operations: 'inventory',
  finance: 'operational-costs',
  commercial: 'commercial-performance',
  executive: 'executive-kpis'
};

export interface SuggestedQuestion {
  text: string;
  /** null = pregunta genérica, se resuelve con el contexto del reporte o el dominio principal del rol. */
  domain: DataDomain | null;
}

export const SUGGESTED_QUESTIONS: SuggestedQuestion[] = [
  { text: '¿Cuál fue la producción del último mes?', domain: 'production' },
  { text: '¿Qué planta tuvo mayor variación?', domain: 'production' },
  { text: 'Resume los principales indicadores comerciales.', domain: 'commercial' },
  { text: '¿Cómo evolucionaron los costos operacionales?', domain: 'finance' },
  { text: '¿Cuál es el nivel actual de inventario?', domain: 'operations' },
  { text: 'Resume los indicadores ejecutivos consolidados.', domain: 'executive' },
  { text: 'Muéstrame el reporte relacionado.', domain: null },
  { text: '¿Qué indicadores requieren atención?', domain: null }
];

export const WELCOME_MESSAGE =
  'Hola, soy Data Assistant. Puedo responder preguntas sobre los dominios habilitados para tu rol del Hub. Todas las consultas pasan por la API protegida del Hub y la Azure Function antes de llegar al agente.';
