import { Link } from 'react-router-dom';
import { Activity, BarChart3, Bot, Clock, MessageSquare, RefreshCw, Star } from 'lucide-react';
import { useRequiredSession } from '../context/SessionContext';
import { reportService } from '../services/reportService';
import { permissionService } from '../services/permissionService';
import { useApi } from '../hooks/useApi';
import { RECENT_ACTIVITY, type ActivityItem } from '../mocks/auditEvents';
import { Badge, Callout, Card, EmptyState, ErrorState, PageHeader, SkeletonGrid, StatCard, formatDateTime } from '../components/ui';

const ACTIVITY_ICON: Record<ActivityItem['kind'], JSX.Element> = {
  report: <BarChart3 size={16} />,
  chat: <MessageSquare size={16} />,
  favorite: <Star size={16} />,
  refresh: <RefreshCw size={16} />
};

export const EXECUTIVE_MESSAGE =
  'El enfoque actual permite incorporar un asistente de IA al Hub existente sin rediseñar inmediatamente el acceso de los usuarios. La Azure Function actúa como puerta de seguridad y selecciona los agentes y dominios permitidos según los roles del Hub. Para una evolución productiva con información sensible y permisos individuales, la arquitectura ideal incorpora Microsoft Entra ID e identity passthrough.';

export function HomePage() {
  const { session, permissions, favorites } = useRequiredSession();
  const reports = useApi(() => reportService.list(), [session.sessionId]);
  const status = useApi(() => permissionService.getServiceStatus());

  const visibleFavorites = reports.data?.reports.filter((r) => favorites.includes(r.id)) ?? [];
  const lastUpdate = reports.data?.reports.map((r) => r.lastUpdated).sort().at(-1);

  return (
    <>
      <PageHeader
        title={`Hola, ${session.displayName.split(' ')[0]}`}
        subtitle="Resumen de tus reportes y del asistente de IA según los permisos de tu rol en el Hub."
      />

      <Callout tone="info" title="Mensaje ejecutivo">
        {EXECUTIVE_MESSAGE}
      </Callout>

      {reports.loading ? (
        <SkeletonGrid count={5} />
      ) : reports.error ? (
        <ErrorState message={reports.error.message} onRetry={reports.reload} />
      ) : (
        <div className="grid grid-stats">
          <StatCard icon={<BarChart3 />} label="Reportes disponibles" value={reports.data?.reports.length ?? 0} hint={`${reports.data?.hiddenCount ?? 0} no habilitados para tu rol`} />
          <StatCard icon={<Star />} label="Reportes favoritos" value={visibleFavorites.length} />
          <StatCard icon={<Clock />} label="Última actualización" value={lastUpdate ? formatDateTime(lastUpdate) : '—'} />
          <StatCard
            icon={<Bot />}
            label="Consultas al asistente"
            value={`${permissions.queriesUsedLastHour}/${permissions.queriesPerHour}`}
            hint="Última hora (límite por rol)"
          />
          <StatCard
            icon={<Activity />}
            label="Estado del servicio de IA"
            value={
              status.loading ? (
                '…'
              ) : status.data?.aiService === 'operational' ? (
                <Badge tone="green">Operativo</Badge>
              ) : (
                <Badge tone="red">No disponible</Badge>
              )
            }
          />
        </div>
      )}

      <div className="grid grid-2">
        <Card title="Actividad reciente" icon={<Activity size={18} aria-hidden />}>
          <ul className="activity-list">
            {RECENT_ACTIVITY.map((a) => (
              <li key={a.id}>
                <span className="activity-icon" aria-hidden>
                  {ACTIVITY_ICON[a.kind]}
                </span>
                <span>{a.text}</span>
                <time className="muted small" dateTime={a.when}>
                  {formatDateTime(a.when)}
                </time>
              </li>
            ))}
          </ul>
        </Card>
        <Card title="Tus favoritos" icon={<Star size={18} aria-hidden />}>
          {visibleFavorites.length === 0 ? (
            <EmptyState
              title="Aún no tienes favoritos"
              description="Marca la estrella de un reporte en el catálogo para verlo aquí."
              action={<Link className="btn btn-secondary" to="/reportes">Ir al catálogo</Link>}
            />
          ) : (
            <ul className="link-list">
              {visibleFavorites.map((r) => (
                <li key={r.id}>
                  <Link to={`/reportes/${r.id}`}>{r.name}</Link>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </>
  );
}
