import { useState } from 'react';
import { Pencil, Save, X } from 'lucide-react';
import { useRequiredSession } from '../context/SessionContext';
import { permissionService } from '../services/permissionService';
import { auditService } from '../services/auditService';
import { ApiError } from '../services/apiClient';
import { useApi } from '../hooks/useApi';
import { ALL_DOMAINS, ALL_ROLES, DOMAIN_LABELS, ROLE_DEFINITIONS } from '../mocks/permissions';
import { REPORTS } from '../mocks/reports';
import {
  AccessDenied,
  Badge,
  Callout,
  Card,
  DomainBadge,
  EmptyState,
  ErrorState,
  LoadingState,
  PageHeader,
  RoleBadge,
  formatDateTime
} from '../components/ui';
import type { DataDomain, HubRole, HubUser } from '../types';

interface Draft {
  role: HubRole;
  allowedDomains: DataDomain[];
  allowedReportIds: string[];
}

const toggle = <T,>(list: T[], v: T) => (list.includes(v) ? list.filter((x) => x !== v) : [...list, v]);

export function AdminPage() {
  const { permissions } = useRequiredSession();
  if (!permissions.adminAccess) {
    return (
      <AccessDenied
        code="FORBIDDEN"
        message="La administración solo está disponible para el rol Administrador. La validación la realiza el backend, no solo el menú."
        requiredRoles={['ADMIN']}
      />
    );
  }
  return <AdminContent />;
}

function AdminContent() {
  const { refresh, handleSessionError } = useRequiredSession();
  const config = useApi(() => permissionService.getAdminConfig(), []);
  const audit = useApi(() => auditService.list(), []);
  const [editing, setEditing] = useState<string | null>(null);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [feedback, setFeedback] = useState<{ tone: 'success' | 'danger'; text: string } | null>(null);
  const [saving, setSaving] = useState(false);

  const startEdit = (u: HubUser) => {
    setEditing(u.userId);
    setDraft({ role: u.role, allowedDomains: [...u.allowedDomains], allowedReportIds: [...u.allowedReportIds] });
    setFeedback(null);
  };

  const onError = (e: unknown) => {
    if (handleSessionError(e)) return;
    setFeedback({ tone: 'danger', text: e instanceof ApiError ? e.message : 'No fue posible guardar los cambios.' });
  };

  const save = async (userId: string) => {
    if (!draft) return;
    setSaving(true);
    try {
      await permissionService.updateUser(userId, draft);
      setFeedback({ tone: 'success', text: 'Permisos del usuario actualizados. Se registró un evento de auditoría.' });
      setEditing(null);
      config.reload();
      audit.reload();
      void refresh();
    } catch (e) {
      onError(e);
    } finally {
      setSaving(false);
    }
  };

  const changeAgent = async (domain: DataDomain, agentId: string) => {
    try {
      await permissionService.updateDomainAgent(domain, agentId);
      setFeedback({ tone: 'success', text: `Agente del dominio ${DOMAIN_LABELS[domain]} actualizado.` });
      config.reload();
      audit.reload();
    } catch (e) {
      onError(e);
    }
  };

  return (
    <>
      <PageHeader
        title="Administración"
        subtitle="Gestión de roles, dominios, reportes y agentes permitidos del Hub."
        badge={<Badge tone="copper">Solo administradores</Badge>}
      />
      <Callout tone="warning" title="Importante">
        Los cambios realizados aquí afectan los permisos de la aplicación, pero no modifican los permisos de Microsoft Fabric.
      </Callout>
      {feedback && (
        <div role="status">
          <Callout tone={feedback.tone}>{feedback.text}</Callout>
        </div>
      )}

      {config.loading && !config.data && <LoadingState label="Cargando configuración…" />}
      {config.error && <ErrorState message={config.error.message} onRetry={config.reload} />}

      {config.data && (
        <>
          <h2 className="section-title">Usuarios</h2>
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th scope="col">Usuario</th>
                  <th scope="col">Rol</th>
                  <th scope="col">Dominios</th>
                  <th scope="col">Reportes</th>
                  <th scope="col">
                    <span className="sr-only">Acciones</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {config.data.users.map((u) =>
                  editing === u.userId && draft ? (
                    <tr key={u.userId} className="row-editing">
                      <td>
                        <strong>{u.displayName}</strong>
                        <div className="small muted">{u.userId}</div>
                      </td>
                      <td>
                        <label className="sr-only" htmlFor={`role-${u.userId}`}>
                          Rol
                        </label>
                        <select
                          id={`role-${u.userId}`}
                          value={draft.role}
                          onChange={(e) => {
                            const role = e.target.value as HubRole;
                            setDraft({ ...draft, role, allowedDomains: [...ROLE_DEFINITIONS[role].defaultDomains] });
                          }}
                        >
                          {ALL_ROLES.map((r) => (
                            <option key={r} value={r}>
                              {ROLE_DEFINITIONS[r].label}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td>
                        <fieldset className="check-group">
                          <legend className="sr-only">Dominios</legend>
                          {ALL_DOMAINS.map((d) => (
                            <label key={d} className="checkbox">
                              <input
                                type="checkbox"
                                checked={draft.allowedDomains.includes(d)}
                                onChange={() => setDraft({ ...draft, allowedDomains: toggle(draft.allowedDomains, d) })}
                              />
                              {DOMAIN_LABELS[d]}
                            </label>
                          ))}
                        </fieldset>
                      </td>
                      <td>
                        <fieldset className="check-group">
                          <legend className="sr-only">Reportes</legend>
                          {REPORTS.map((r) => (
                            <label key={r.id} className="checkbox">
                              <input
                                type="checkbox"
                                checked={draft.allowedReportIds.includes(r.id)}
                                onChange={() => setDraft({ ...draft, allowedReportIds: toggle(draft.allowedReportIds, r.id) })}
                              />
                              {r.name}
                            </label>
                          ))}
                        </fieldset>
                      </td>
                      <td>
                        <div className="card-actions">
                          <button type="button" className="btn btn-primary" disabled={saving} onClick={() => void save(u.userId)}>
                            <Save size={14} aria-hidden /> Guardar
                          </button>
                          <button type="button" className="btn btn-ghost" onClick={() => setEditing(null)}>
                            <X size={14} aria-hidden /> Cancelar
                          </button>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    <tr key={u.userId}>
                      <td>
                        <strong>{u.displayName}</strong>
                        <div className="small muted">
                          {u.userId} · {u.area}
                        </div>
                      </td>
                      <td>
                        <RoleBadge role={u.role} />
                      </td>
                      <td>
                        <div className="badge-row">
                          {u.allowedDomains.length === 0 ? <span className="small muted">Ninguno</span> : u.allowedDomains.map((d) => <DomainBadge key={d} domain={d} />)}
                        </div>
                      </td>
                      <td className="small">
                        {u.allowedReportIds.length} de {REPORTS.length}
                      </td>
                      <td>
                        <button type="button" className="btn btn-ghost" onClick={() => startEdit(u)} aria-label={`Editar permisos de ${u.displayName}`}>
                          <Pencil size={14} aria-hidden /> Editar
                        </button>
                      </td>
                    </tr>
                  )
                )}
              </tbody>
            </table>
          </div>

          <div className="grid grid-2">
            <Card title="Dominio → Data Agent">
              <p className="small muted">
                Solo se pueden asignar agentes del allowlist de la Azure Function que pertenezcan al mismo dominio.
              </p>
              <div className="form-rows">
                {ALL_DOMAINS.map((d) => {
                  const options = config.data!.agentAllowlist.filter((a) => a.domain === d);
                  return (
                    <div key={d} className="form-row">
                      <label htmlFor={`agent-${d}`}>{DOMAIN_LABELS[d]}</label>
                      <select id={`agent-${d}`} value={config.data!.domainAgents[d]} onChange={(e) => void changeAgent(d, e.target.value)}>
                        {options.map((a) => (
                          <option key={a.id} value={a.id}>
                            {a.name} ({a.id})
                          </option>
                        ))}
                      </select>
                    </div>
                  );
                })}
              </div>
            </Card>
            <Card title="Límites por rol">
              <div className="table-wrap">
                <table className="table">
                  <thead>
                    <tr>
                      <th scope="col">Rol</th>
                      <th scope="col">Consultas / hora</th>
                      <th scope="col">Administración</th>
                    </tr>
                  </thead>
                  <tbody>
                    {config.data.roles.map((r) => (
                      <tr key={r.role}>
                        <td>{r.label}</td>
                        <td>{r.queriesPerHour}</td>
                        <td>{r.adminAccess ? 'Sí' : 'No'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        </>
      )}

      <h2 className="section-title">Auditoría reciente</h2>
      {audit.loading && !audit.data && <LoadingState label="Cargando auditoría…" />}
      {audit.error && <ErrorState message={audit.error.message} onRetry={audit.reload} />}
      {audit.data && audit.data.events.length === 0 && <EmptyState title="Sin eventos" description="Aún no hay eventos de auditoría registrados." />}
      {audit.data && audit.data.events.length > 0 && (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th scope="col">Fecha</th>
                <th scope="col">Usuario</th>
                <th scope="col">Rol</th>
                <th scope="col">Tipo</th>
                <th scope="col">Dominio / agente</th>
                <th scope="col">Resultado</th>
                <th scope="col">HTTP</th>
              </tr>
            </thead>
            <tbody>
              {audit.data.events.slice(0, 25).map((e) => (
                <tr key={e.id}>
                  <td className="small">{formatDateTime(e.timestamp)}</td>
                  <td className="small">{e.userId}</td>
                  <td className="small">{e.role}</td>
                  <td className="small">
                    {e.eventType}
                    {e.question && <div className="muted">“{e.question}”</div>}
                    {e.detail && <div className="muted">{e.detail}</div>}
                  </td>
                  <td className="small">
                    {e.requestedDomain ? DOMAIN_LABELS[e.requestedDomain] : '—'}
                    {e.selectedAgent && <div className="muted">{e.selectedAgent}</div>}
                  </td>
                  <td>
                    <Badge tone={e.authorizationResult === 'AUTHORIZED' ? 'green' : e.authorizationResult === 'DENIED' ? 'red' : 'neutral'}>
                      {e.authorizationResult}
                    </Badge>
                  </td>
                  <td className="small">{e.responseStatus}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
