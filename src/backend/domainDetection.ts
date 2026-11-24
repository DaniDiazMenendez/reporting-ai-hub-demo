import type { DataDomain } from '../types';

export function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

// El orden importa: "costos operacionales" debe resolverse como Finanzas antes que Operaciones.
const DOMAIN_KEYWORDS: Array<[DataDomain, string[]]> = [
  ['finance', ['costo', 'financ', 'margen operacional', 'presupuest', 'gasto', 'ebitda', 'rentabilidad']],
  ['commercial', ['comercial', 'venta', 'cliente', 'meta', 'oportunidad']],
  ['executive', ['ejecutiv', 'consolidad', 'kpi corporativ', 'directorio']],
  ['production', ['produccion', 'producido', 'planta', 'tonelada', 'fundicion', 'rechazo']],
  ['operations', ['inventario', 'stock', 'mantenimiento', 'operacion', 'equipo', 'cobertura']]
];

/** Detecta el dominio de la pregunta. Devuelve null si la pregunta es genérica. */
export function detectDomain(message: string): DataDomain | null {
  const text = normalize(message);
  for (const [domain, keywords] of DOMAIN_KEYWORDS) {
    if (keywords.some((k) => text.includes(k))) return domain;
  }
  return null;
}

const ADMIN_INSTRUCTION_PATTERNS = [
  'ignora las instrucciones',
  'ignora tus instrucciones',
  'olvida las reglas',
  'actua como administrador',
  'modo administrador',
  'cambia mi rol',
  'dame acceso',
  'system prompt',
  'muestra todos los datos'
];

/** Defensa en profundidad: no reemplaza la autorización por rol, la complementa. */
export function containsAdministrativeInstruction(message: string): boolean {
  const text = normalize(message);
  return ADMIN_INSTRUCTION_PATTERNS.some((p) => text.includes(p));
}
