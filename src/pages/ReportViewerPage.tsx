import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, BarChart3, Sparkles, Star } from 'lucide-react';
import { useRequiredSession } from '../context/SessionContext';
import { useChat } from '../context/ChatContext';
import { reportService } from '../services/reportService';
import { useApi } from '../hooks/useApi';
import { AccessBadge, AccessDenied, Card, DomainBadge, ErrorState, LoadingState, PageHeader, formatDateTime } from '../components/ui';

export function ReportViewerPage() {
  const { reportId = '' } = useParams();
  const { session, favorites, toggleFavorite } = useRequiredSession();
  const { setReportContext, setPanelOpen } = useChat();
  const { data: report, loading, error, reload } = useApi(() => reportService.get(reportId), [reportId, session.sessionId]);

  const back = (
    <Link className="btn btn-ghost" to="/reportes">
      <ArrowLeft size={16} aria-hidden /> Volver al catálogo
    </Link>
  );

  if (loading) return <LoadingState label="Validando acceso al reporte…" />;
  if (error?.status === 403 || error?.status === 404) {
    return (
      <>
        <PageHeader title="Reporte" actions={back} />
        {error.status === 403 ? (
          <AccessDenied message={error.message} requiredRoles={error.body.requiredRoles} code={error.body.error} />
        ) : (
          <ErrorState title="Reporte no encontrado" message={error.message} />
        )}
      </>
    );
  }
  if (error || !report) return <ErrorState message={error?.message ?? 'No se pudo cargar el reporte.'} onRetry={reload} />;

  const favorite = favorites.includes(report.id);
  return (
    <>
      <PageHeader
        title={report.name}
        subtitle={report.description}
        actions={
          <>
            {back}
            <button type="button" className="btn btn-secondary" aria-pressed={favorite} onClick={() => toggleFavorite(report.id)}>
              <Star size={16} aria-hidden fill={favorite ? 'currentColor' : 'none'} /> {favorite ? 'Quitar de favoritos' : 'Agregar a favoritos'}
            </button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => {
                setReportContext({ reportId: report.id, domain: report.domain });
                setPanelOpen(true);
              }}
            >
              <Sparkles size={16} aria-hidden /> Consultar con IA
            </button>
          </>
        }
      />
      <div className="viewer">
        <div className="viewer-frame" role="img" aria-label={`Espacio reservado para el reporte ${report.name}`}>
          <BarChart3 size={48} aria-hidden />
          <strong>Power BI Embedded Report</strong>
          <span className="muted small">Marcador de posición. En la solución real el reporte se incrusta mediante la Azure Function existente.</span>
          <div className="fake-chart" aria-hidden>
            {[62, 80, 45, 90, 70, 55, 84, 66].map((h, i) => (
              <span key={i} style={{ height: `${h}%` }} />
            ))}
          </div>
        </div>
        <Card title="Detalle del reporte" className="viewer-side">
          <dl className="meta-list meta-list-stacked">
            <div>
              <dt>Nombre</dt>
              <dd>{report.name}</dd>
            </div>
            <div>
              <dt>Dominio</dt>
              <dd>
                <DomainBadge domain={report.domain} />
              </dd>
            </div>
            <div>
              <dt>Responsable</dt>
              <dd>{report.owner}</dd>
            </div>
            <div>
              <dt>Fuente de datos</dt>
              <dd>{report.dataSource}</dd>
            </div>
            <div>
              <dt>Última actualización</dt>
              <dd>{formatDateTime(report.lastUpdated)}</dd>
            </div>
            <div>
              <dt>Nivel de acceso requerido</dt>
              <dd>
                <AccessBadge level={report.accessLevel} />
              </dd>
            </div>
          </dl>
        </Card>
      </div>
    </>
  );
}
