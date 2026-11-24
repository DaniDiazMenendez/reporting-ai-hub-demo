import { Bot, CheckCircle2, Database, KeyRound, Layers, ShieldCheck, XCircle } from 'lucide-react';
import { FlowDiagram, type FlowNode } from '../components/FlowDiagram';
import { Badge, Callout, Card, CodeBlock, PageHeader } from '../components/ui';

const SESSION_EXAMPLE = JSON.stringify(
  { userId: 'USR-2048', displayName: 'Usuario Demo', role: 'OPERATIONS', allowedDomains: ['operations', 'production'] },
  null,
  2
);

const ROLE_MATRIX: Array<[string, string[]]> = [
  ['Ejecutivo', ['Indicadores ejecutivos', 'Comercial', 'Operaciones', 'Producción']],
  ['Finanzas', ['Costos operacionales', 'Indicadores financieros']],
  ['Operaciones', ['Producción', 'Inventario', 'Mantenimiento']],
  ['Comercial', ['Ventas', 'Clientes', 'Cumplimiento de metas']],
  ['Administrador', ['Catálogo', 'Configuración', 'Auditoría', 'Administración de roles']]
];

const FUNCTION_CHECKS = [
  'Que la sesión exista.',
  'Que la sesión no esté vencida.',
  'Que el rol sea válido.',
  'Que el dominio solicitado esté autorizado.',
  'Que el reporte solicitado esté permitido.',
  'Que no se envíen instrucciones administrativas desde el navegador.',
  'Que la cantidad de consultas no exceda el límite.',
  'Que el contenido no incluya datos no autorizados.'
];

const MI_FLOW: FlowNode[] = [
  { label: 'Azure Function', detail: 'Managed Identity', icon: <KeyRound /> },
  { label: 'Foundry Agent', icon: <Bot /> },
  { label: 'Data Agents controlados', icon: <Database /> },
  { label: 'Modelos de datos limitados', icon: <Layers /> }
];

export const SECURITY_PRINCIPLES = [
  'Nunca llamar a Foundry directamente desde el navegador.',
  'Nunca confiar en el rol enviado por el frontend.',
  'El backend debe reconstruir los permisos desde la sesión.',
  'No usar prompts como mecanismo único de seguridad.',
  'Aplicar mínimo privilegio a la Managed Identity.',
  'Separar Data Agents por dominio.',
  'No entregar al agente datos que el dominio no necesita.',
  'Registrar auditoría.',
  'Aplicar rate limiting.',
  'Incluir expiración de sesión.',
  'Evitar una identidad técnica con acceso global.',
  'Ocultar un botón no reemplaza la autorización del backend.',
  'El frontend no puede elegir arbitrariamente un agente.',
  'La Azure Function debe mantener un allowlist de agentes y dominios.'
];

export function SecurityPage() {
  return (
    <>
      <PageHeader title="Seguridad y permisos" subtitle="Capas de control de la arquitectura actual adaptada." badge={<Badge tone="blue">Actual</Badge>} />

      <section className="layer">
        <h2 className="section-title">
          <span className="step-number">1</span> Sesión del Hub
        </h2>
        <div className="grid grid-2">
          <CodeBlock label="Sesión del Hub (ejemplo)">{SESSION_EXAMPLE}</CodeBlock>
          <Card>
            <ul className="check-list">
              <li>Esta sesión es administrada por la aplicación.</li>
              <li>No es un token de Microsoft Entra ID.</li>
              <li>No otorga permisos en Fabric.</li>
              <li>Solo sirve para autorizar funciones dentro del Hub.</li>
            </ul>
          </Card>
        </div>
      </section>

      <section className="layer">
        <h2 className="section-title">
          <span className="step-number">2</span> Roles del Hub
        </h2>
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th scope="col">Rol</th>
                <th scope="col">Puede consultar</th>
              </tr>
            </thead>
            <tbody>
              {ROLE_MATRIX.map(([role, items]) => (
                <tr key={role}>
                  <th scope="row">{role}</th>
                  <td>
                    <div className="badge-row">
                      {items.map((i) => (
                        <Badge key={i}>{i}</Badge>
                      ))}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="layer">
        <h2 className="section-title">
          <span className="step-number">3</span> Validaciones de la Azure Function
        </h2>
        <div className="grid grid-2">
          <Card title="La Azure Function valida">
            <ul className="check-list">
              {FUNCTION_CHECKS.map((c) => (
                <li key={c}>{c}</li>
              ))}
            </ul>
          </Card>
          <Card title="Ejemplo">
            <dl className="meta-list meta-list-stacked">
              <div>
                <dt>Pregunta</dt>
                <dd>¿Cuánto fue el costo operacional?</dd>
              </div>
              <div>
                <dt>Usuario</dt>
                <dd>Rol Operaciones</dd>
              </div>
              <div>
                <dt>Resultado</dt>
                <dd>
                  <span className="result-denied">
                    <XCircle size={16} aria-hidden /> Acceso denegado. Este dominio requiere el rol Finanzas o Ejecutivo.
                  </span>
                </dd>
              </div>
            </dl>
          </Card>
        </div>
      </section>

      <section className="layer">
        <h2 className="section-title">
          <span className="step-number">4</span> Managed Identity y mínimo privilegio
        </h2>
        <FlowDiagram nodes={MI_FLOW} variant="current" ariaLabel="Cadena de acceso de la Managed Identity" />
        <Callout tone="warning">
          La Managed Identity debe aplicar mínimo privilegio. No conviene conectar un único agente técnico a todos los modelos sensibles.
        </Callout>
      </section>

      <h2 className="section-title">Alternativas de diseño</h2>
      <div className="grid grid-cards">
        <Card title="Alternativa A: un Data Agent por dominio" className="alt alt-recommended">
          <Badge tone="green">Recomendado para la POC actual.</Badge>
          <ul className="check-list">
            <li>Data Agent Comercial</li>
            <li>Data Agent Finanzas</li>
            <li>Data Agent Operaciones</li>
            <li>Data Agent Producción</li>
          </ul>
        </Card>
        <Card title="Alternativa B: un Foundry Agent por nivel de acceso" className="alt">
          <Badge tone="blue">Mayor aislamiento, pero más administración.</Badge>
          <ul className="check-list">
            <li>Agente Ejecutivo</li>
            <li>Agente Finanzas</li>
            <li>Agente Operaciones</li>
            <li>Agente Comercial</li>
          </ul>
        </Card>
        <Card title="Alternativa C: un único agente con acceso global" className="alt alt-rejected">
          <Badge tone="red">No recomendado.</Badge>
          <ul className="x-list">
            <li>Depende demasiado del prompt.</li>
            <li>Aumenta el riesgo de acceso indebido.</li>
            <li>Dificulta la auditoría.</li>
            <li>Puede exponer información entre dominios.</li>
          </ul>
        </Card>
      </div>

      <Card title="Principios de seguridad" icon={<ShieldCheck size={18} aria-hidden />}>
        <ul className="principles">
          {SECURITY_PRINCIPLES.map((p) => (
            <li key={p}>
              <CheckCircle2 size={16} aria-hidden /> {p}
            </li>
          ))}
        </ul>
      </Card>
    </>
  );
}
