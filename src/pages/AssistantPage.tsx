import { Bot, Database, ShieldCheck } from 'lucide-react';
import { useRequiredSession } from '../context/SessionContext';
import { ChatWindow } from '../components/ChatWindow';
import { Badge, Card, DomainBadge, PageHeader } from '../components/ui';
import { ORCHESTRATOR_AGENT } from '../mocks/permissions';

export function AssistantPage() {
  const { permissions } = useRequiredSession();
  return (
    <>
      <PageHeader
        title="Data Assistant"
        subtitle="Cada pregunta pasa por la API protegida del Hub; el navegador nunca llama directamente a Microsoft Foundry."
      />
      <div className="assistant-layout">
        <ChatWindow />
        <aside className="assistant-side" aria-label="Permisos aplicados">
          <Card title="Permisos de tu sesión" icon={<ShieldCheck size={18} aria-hidden />}>
            <p className="small">
              Rol del Hub: <strong>{permissions.roleLabel}</strong>
            </p>
            <p className="small muted">Dominios habilitados</p>
            <div className="badge-row">
              {permissions.allowedDomains.length === 0 ? <span className="muted small">Ninguno</span> : permissions.allowedDomains.map((d) => <DomainBadge key={d} domain={d} />)}
            </div>
            <p className="small muted">
              Consultas: {permissions.queriesUsedLastHour}/{permissions.queriesPerHour} en la última hora
            </p>
          </Card>
          <Card title="Agentes" icon={<Bot size={18} aria-hidden />}>
            <p className="small">
              Orquestador: <strong>{ORCHESTRATOR_AGENT}</strong>
            </p>
            <ul className="agent-list">
              {permissions.availableDataAgents.map((a) => (
                <li key={a.id}>
                  <Database size={14} aria-hidden /> {a.name} <Badge tone="green">Disponible</Badge>
                </li>
              ))}
              {permissions.unavailableDataAgents.map((a) => (
                <li key={a.id} className="muted">
                  <Database size={14} aria-hidden /> {a.name} <Badge tone="neutral">No habilitado</Badge>
                </li>
              ))}
            </ul>
            <p className="small muted">La Azure Function selecciona el agente desde su allowlist. El navegador no puede elegirlo.</p>
          </Card>
        </aside>
      </div>
    </>
  );
}
