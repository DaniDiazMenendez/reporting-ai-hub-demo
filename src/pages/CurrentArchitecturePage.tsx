import { AlertTriangle, Bot, Cloud, Database, Globe, KeyRound, Layers, Lock, Server, ShieldCheck, User, UserCheck } from 'lucide-react';
import type { ReactNode } from 'react';
import { FlowDiagram, type FlowNode } from '../components/FlowDiagram';
import { Badge, Callout, Card, CodeBlock, PageHeader } from '../components/ui';

const EXISTING_FLOW: FlowNode[] = [
  { label: 'Usuario del Hub', icon: <User /> },
  { label: 'Página web del Hub', icon: <Globe /> },
  { label: 'Azure Function', icon: <Server /> },
  { label: 'Power BI', icon: <Layers /> }
];

const PROPOSED_FLOW: FlowNode[] = [
  { label: 'Usuario del Hub', icon: <User /> },
  { label: 'Página web del Hub', icon: <Globe /> },
  { label: 'API protegida del Hub', icon: <Lock />, highlight: true },
  { label: 'Azure Function', detail: 'Puerta de seguridad', icon: <ShieldCheck />, highlight: true },
  { label: 'Microsoft Foundry Agent', icon: <Bot /> },
  { label: 'Fabric IQ / Data Agents', icon: <Database /> },
  { label: 'Microsoft Fabric', icon: <Cloud /> },
  { label: 'Semantic Models / Lakehouse / Warehouse', icon: <Layers /> }
];

interface Component {
  n: number;
  title: string;
  icon: ReactNode;
  text?: string;
  items?: string[];
  note?: string;
}

const COMPONENTS: Component[] = [
  {
    n: 1,
    title: 'Usuario del Hub',
    icon: <User size={18} />,
    text: 'El usuario ingresa mediante el mecanismo de acceso actualmente implementado por Más Analytics. No se asume autenticación con Microsoft Entra ID.'
  },
  { n: 2, title: 'Página web del Hub', icon: <Globe size={18} />, text: 'Presenta el catálogo de reportes de Power BI y el componente de chat.' },
  {
    n: 3,
    title: 'Control de sesión del Hub',
    icon: <UserCheck size={18} />,
    text: 'La aplicación mantiene una sesión propia y asocia al usuario con un rol funcional.',
    items: ['Ejecutivo', 'Finanzas', 'Operaciones', 'Comercial', 'Administrador']
  },
  {
    n: 4,
    title: 'API protegida del Hub',
    icon: <Lock size={18} />,
    text: 'Todas las preguntas del chat pasan por el backend. El navegador nunca llama directamente al endpoint de Microsoft Foundry.'
  },
  {
    n: 5,
    title: 'Azure Function',
    icon: <ShieldCheck size={18} />,
    items: [
      'Validar la sesión del Hub',
      'Validar el rol funcional',
      'Autorizar el dominio solicitado',
      'Aplicar límites de uso',
      'Filtrar información de contexto',
      'Registrar auditoría',
      'Administrar conversationId',
      'Llamar al agente de Microsoft Foundry',
      'Eliminar información sensible de la respuesta',
      'Devolver una respuesta segura a la web'
    ]
  },
  {
    n: 6,
    title: 'Managed Identity',
    icon: <KeyRound size={18} />,
    text: 'La Azure Function utiliza su Managed Identity para autenticarse como carga de trabajo frente a los servicios de Azure y Microsoft Foundry.',
    note: 'Esta identidad representa al backend, no al usuario final. Para consultar los Fabric Data Agents (que no admiten Managed Identity) se usa un service principal por dominio con certificado en Key Vault.'
  },
  {
    n: 7,
    title: 'Microsoft Foundry Agent — Reporting Assistant',
    icon: <Bot size={18} />,
    items: [
      'Interpretar la pregunta',
      'Determinar el dominio',
      'Seleccionar la herramienta o Data Agent',
      'Redactar una respuesta',
      'Devolver fuentes y reportes relacionados'
    ]
  },
  {
    n: 8,
    title: 'Fabric IQ / Data Agents',
    icon: <Database size={18} />,
    items: ['Data Agent Comercial', 'Data Agent Finanzas', 'Data Agent Operaciones', 'Data Agent Producción'],
    note: 'En la arquitectura actual adaptada, los Data Agents son consumidos mediante una identidad técnica controlada. No reciben automáticamente la identidad individual del usuario.'
  },
  { n: 9, title: 'Microsoft Fabric', icon: <Cloud size={18} />, items: ['OneLake', 'Lakehouse', 'Warehouse', 'Semantic Models', 'Power BI'] }
];

const LIMITATIONS = [
  'El backend controla qué dominio puede consultar cada rol.',
  'La identidad técnica solo debe tener acceso al conjunto mínimo de datos.',
  'No se debe confiar únicamente en instrucciones de prompt para aplicar seguridad.',
  'Los datos sensibles deben separarse físicamente o mediante modelos específicos.',
  'El agente no debe consultar modelos con más información de la necesaria.',
  'Si una identidad técnica puede ver todos los datos, existe riesgo de que usuarios del Hub accedan a información que no les corresponde.',
  'Esta arquitectura es apropiada para una POC controlada o para información común.',
  'No es el modelo ideal para información altamente sensible o seguridad individual detallada.'
];

const PSEUDOCODE = `async function callFoundryAgent(hubSession, question, conversationId) {
  // 1. La sesión y el rol se reconstruyen en el backend (nunca desde el navegador)
  const domain = detectDomain(question, hubSession);
  authorizeDomain(hubSession.role, domain);          // 403 si el rol no lo permite

  // 2. El agente sale de la allowlist de la Azure Function
  const agent = getAuthorizedAgentForDomain(domain);

  // 3. Credencial de la carga de trabajo (Managed Identity del backend)
  const credential = getManagedIdentityCredential();

  // 4. Llamada al endpoint del proyecto de Foundry
  return callFoundryProjectEndpoint({
    endpoint: process.env.FOUNDRY_PROJECT_ENDPOINT,
    agentName: agent.name,
    credential,
    conversationId,
    input: question
  });
}`;

const ENDPOINTS = [
  ['POST', '/api/session/login', 'Inicia la sesión propia del Hub (simulada).'],
  ['POST', '/api/session/logout', 'Cierra la sesión.'],
  ['GET', '/api/session', 'Devuelve la sesión vigente.'],
  ['GET', '/api/reports', 'Reportes autorizados para el rol.'],
  ['GET', '/api/reports/:id', 'Detalle; 403 si el rol no tiene acceso.'],
  ['GET', '/api/permissions', 'Permisos efectivos reconstruidos desde la sesión.'],
  ['POST', '/api/chat', 'Pregunta al asistente a través de la Azure Function.'],
  ['GET', '/api/audit', 'Eventos de auditoría (propios o todos para Administrador).'],
  ['GET', '/api/admin/config', 'Configuración de roles y agentes (solo Administrador).']
];

const ENV_VARS = [
  'VITE_API_BASE_URL',
  'HUB_SESSION_SECRET',
  'FOUNDRY_PROJECT_ENDPOINT',
  'FOUNDRY_AGENT_NAME',
  'FOUNDRY_OPERATIONS_AGENT_NAME',
  'FOUNDRY_FINANCE_AGENT_NAME',
  'FOUNDRY_COMMERCIAL_AGENT_NAME',
  'FOUNDRY_PRODUCTION_AGENT_NAME',
  'APPLICATION_INSIGHTS_CONNECTION_STRING'
];

export function CurrentArchitecturePage() {
  return (
    <>
      <PageHeader
        title="Arquitectura actual adaptada"
        subtitle="Cómo se incorpora el asistente de IA al Hub existente sin cambiar el mecanismo de acceso."
        badge={<Badge tone="blue">Actual</Badge>}
      />
      <Callout tone="info" title="Sin autenticación Microsoft Entra ID">
        En la arquitectura actual los usuarios del Hub <strong>no</strong> se autentican con Microsoft Entra ID. El acceso lo administra el
        mecanismo propio del Hub y los permisos se derivan del rol funcional de la sesión.
      </Callout>

      <Card title="Flujo existente">
        <FlowDiagram nodes={EXISTING_FLOW} variant="current" ariaLabel="Flujo existente del Hub" />
      </Card>
      <Card title="Flujo propuesto con asistente de IA">
        <FlowDiagram nodes={PROPOSED_FLOW} variant="current" ariaLabel="Flujo propuesto con asistente de IA" />
      </Card>

      <h2 className="section-title">Componentes</h2>
      <div className="grid grid-cards">
        {COMPONENTS.map((c) => (
          <Card
            key={c.n}
            title={
              <>
                <span className="step-number">{c.n}</span> {c.title}
              </>
            }
            icon={c.icon}
          >
            {c.text && <p>{c.text}</p>}
            {c.items && (
              <ul className="check-list">
                {c.items.map((i) => (
                  <li key={i}>{i}</li>
                ))}
              </ul>
            )}
            {c.note && <p className="note">{c.note}</p>}
          </Card>
        ))}
      </div>

      <section className="limitation" aria-labelledby="limitation-title">
        <div className="limitation-head">
          <AlertTriangle size={22} aria-hidden />
          <h2 id="limitation-title">Tener un rol en el Hub no equivale a tener permisos individuales en Microsoft Fabric.</h2>
          <Badge tone="amber">Limitación conocida</Badge>
        </div>
        <ul>
          {LIMITATIONS.map((l) => (
            <li key={l}>{l}</li>
          ))}
        </ul>
        <p className="small">Se trata de una limitación conocida del enfoque, no de un error técnico.</p>
      </section>

      <div className="grid grid-2">
        <Card title="Pseudocódigo de la Azure Function">
          <CodeBlock label="callFoundryAgent">{PSEUDOCODE}</CodeBlock>
          <p className="note">
            La Managed Identity autentica a la Azure Function frente a Foundry. Los permisos del usuario se controlan previamente mediante la sesión
            y los roles del Hub.
          </p>
        </Card>
        <div>
          <Card title="Endpoints de la API protegida (simulados)">
            <ul className="endpoint-list">
              {ENDPOINTS.map(([m, p, d]) => (
                <li key={`${m} ${p}`}>
                  <span className={`method method-${m.toLowerCase()}`}>{m}</span> <code className="inline-code">{p}</code>
                  <span className="muted small">{d}</span>
                </li>
              ))}
            </ul>
          </Card>
          <Card title="Variables de entorno (solo nombres)">
            <ul className="env-list">
              {ENV_VARS.map((v) => (
                <li key={v}>
                  <code className="inline-code">{v}</code>
                </li>
              ))}
            </ul>
            <p className="small muted">Los valores reales no se incluyen en la demo.</p>
          </Card>
        </div>
      </div>
    </>
  );
}
