import { Link } from 'react-router-dom';
import { BarChart3, Clock, Database, Sparkles, Star, User } from 'lucide-react';
import type { Report } from '../types';
import { useChat } from '../context/ChatContext';
import { AccessBadge, DomainBadge, formatDateTime } from './ui';

export function ReportCard({
  report,
  favorite,
  onToggleFavorite
}: {
  report: Report;
  favorite: boolean;
  onToggleFavorite: () => void;
}) {
  const { setReportContext, setPanelOpen } = useChat();
  const onAskAi = () => {
    setReportContext({ reportId: report.id, domain: report.domain });
    setPanelOpen(true);
  };
  return (
    <article className="report-card">
      <div className="report-card-top">
        <span className="report-icon" aria-hidden>
          <BarChart3 size={20} />
        </span>
        <button
          type="button"
          className={`icon-btn ${favorite ? 'is-favorite' : ''}`}
          aria-pressed={favorite}
          aria-label={favorite ? `Quitar ${report.name} de favoritos` : `Agregar ${report.name} a favoritos`}
          onClick={onToggleFavorite}
        >
          <Star size={18} aria-hidden fill={favorite ? 'currentColor' : 'none'} />
        </button>
      </div>
      <h3>{report.name}</h3>
      <p className="muted">{report.description}</p>
      <div className="badge-row">
        <DomainBadge domain={report.domain} />
        <AccessBadge level={report.accessLevel} />
      </div>
      <dl className="meta-list">
        <div>
          <dt><User size={14} aria-hidden /> Responsable</dt>
          <dd>{report.owner}</dd>
        </div>
        <div>
          <dt><Database size={14} aria-hidden /> Fuente</dt>
          <dd>{report.dataSource}</dd>
        </div>
        <div>
          <dt><Clock size={14} aria-hidden /> Actualización</dt>
          <dd>{formatDateTime(report.lastUpdated)}</dd>
        </div>
      </dl>
      <div className="card-actions">
        <Link className="btn btn-primary" to={`/reportes/${report.id}`}>
          Abrir reporte
        </Link>
        <button type="button" className="btn btn-secondary" onClick={onAskAi}>
          <Sparkles size={16} aria-hidden /> Consultar con IA
        </button>
      </div>
    </article>
  );
}
