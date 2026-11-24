import { BarChart3, Bot, Cloud, Database, Fingerprint, Globe, ServerCog, User } from 'lucide-react';
import { FlowDiagram, type FlowNode } from '../components/FlowDiagram';
import { DecisionDiagram } from '../components/DecisionDiagram';
import { Badge, Callout, Card, PageHeader } from '../components/ui';

const FLOW: FlowNode[] = [
  { label: 'Usuario corporativo', icon: <User /> },
  { label: 'Microsoft Entra ID', icon: <Fingerprint />, highlight: true },
  { label: 'Hub autenticado', icon: <Globe /> },
  { label: 'Azure Function', icon: <ServerCog /> },
  { label: 'Microsoft Foundry Agent', icon: <Bot /> },
  { label: 'Fabric IQ / Data Agents', icon: <Database /> },
  { label: 'Microsoft Fabric', icon: <Cloud /> },
  { label: 'Power BI', icon: <BarChart3 /> }
];

const CONCEPTS = [
  'SSO',
  'MFA',
  'Conditional Access',
  'Grupos de seguridad',
  'Tokens individuales',
  'Identity passthrough',
  'Permisos individuales',
  'Auditoría por usuario',
  'Seguridad en Power BI y Fabric',
  'RLS y OLS',
  'Acceso B2B para invitados'
];

const GROUPS = [
  ['CORP-AI-HUB-USERS', 'Acceso general al Hub y al asistente.'],
  ['CORP-DATA-COMERCIAL', 'Datos comerciales.'],
  ['CORP-DATA-FINANZAS', 'Datos financieros.'],
  ['CORP-DATA-OPERACIONES', 'Datos de operaciones y producción.'],
  ['CORP-DATA-EXECUTIVE', 'Indicadores ejecutivos consolidados.'],
  ['CORP-AI-HUB-ADMINS', 'Administración del Hub.']
];

const COMPARISON: Array<[string, string, string]> = [
  ['Identidad', 'Sesión propia del Hub', 'Microsoft Entra ID'],
  ['Permisos', 'Roles de aplicación', 'Grupos y roles corporativos'],
  ['Acceso a Foundry', 'Managed Identity del backend', 'Token del usuario y autorización del endpoint'],
  ['Acceso a Fabric', 'Identidad técnica', 'Identidad individual / passthrough'],
  ['Seguridad', 'Por dominio y agente', 'Por usuario, grupo, RLS y OLS'],
  ['Uso recomendado', 'POC controlada o datos comunes', 'Producción y datos sensibles']
];

export function IdealArchitecturePage() {
  return (
    <div className="theme-ideal">
      <PageHeader
        title="Arquitectura ideal con identidad corporativa y seguridad individual"
        subtitle="Evolución recomendada para producción con información sensible. No forma parte del flujo actual de la demo."
        badge={<Badge tone="teal">Futuro</Badge>}
      />
      <Callout tone="future" title="Arquitectura objetivo">
        Esta pestaña describe una evolución futura. La demo no implementa autenticación con Microsoft Entra ID.
      </Callout>

      <Card title="Flujo ideal">
        <FlowDiagram nodes={FLOW} variant="ideal" ariaLabel="Flujo de la arquitectura ideal" />
      </Card>

      <div className="grid grid-2">
        <Card title="Capacidades">
          <div className="badge-row">
            {CONCEPTS.map((c) => (
              <Badge key={c} tone="teal">
                {c}
              </Badge>
            ))}
          </div>
        </Card>
        <Card title="Grupos de seguridad sugeridos">
          <ul className="group-list">
            {GROUPS.map(([g, d]) => (
              <li key={g}>
                <code className="inline-code">{g}</code>
                <span className="muted small">{d}</span>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      <Card title="Comparación">
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th scope="col">Aspecto</th>
                <th scope="col">
                  Arquitectura actual <Badge tone="blue">Actual</Badge>
                </th>
                <th scope="col">
                  Arquitectura ideal <Badge tone="teal">Futuro</Badge>
                </th>
              </tr>
            </thead>
            <tbody>
              {COMPARISON.map(([a, cur, ideal]) => (
                <tr key={a}>
                  <th scope="row">{a}</th>
                  <td>{cur}</td>
                  <td>{ideal}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Card title="Diagrama de decisión">
        <DecisionDiagram />
      </Card>
    </div>
  );
}
