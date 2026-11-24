import { useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import { useRequiredSession } from '../context/SessionContext';
import { reportService } from '../services/reportService';
import { useApi } from '../hooks/useApi';
import { ReportCard } from '../components/ReportCard';
import { AccessDenied, Callout, EmptyState, ErrorState, PageHeader, SkeletonGrid } from '../components/ui';
import { DOMAIN_LABELS, requiredRolesForDomain } from '../mocks/permissions';
import type { DataDomain } from '../types';

function ReportGrid({ domain }: { domain?: DataDomain }) {
  const { session, favorites, toggleFavorite } = useRequiredSession();
  const { data, loading, error, reload } = useApi(() => reportService.list(), [session.sessionId]);
  const [query, setQuery] = useState('');
  const [onlyFavorites, setOnlyFavorites] = useState(false);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (data?.reports ?? []).filter(
      (r) =>
        (!domain || r.domain === domain) &&
        (!onlyFavorites || favorites.includes(r.id)) &&
        (!q || r.name.toLowerCase().includes(q) || r.description.toLowerCase().includes(q))
    );
  }, [data, domain, query, onlyFavorites, favorites]);

  if (loading) return <SkeletonGrid count={4} />;
  if (error) return <ErrorState message={error.message} onRetry={reload} />;

  return (
    <>
      <div className="toolbar">
        <label className="search">
          <Search size={16} aria-hidden />
          <span className="sr-only">Buscar reportes</span>
          <input type="search" placeholder="Buscar reportes…" value={query} onChange={(e) => setQuery(e.target.value)} />
        </label>
        <label className="checkbox">
          <input type="checkbox" checked={onlyFavorites} onChange={(e) => setOnlyFavorites(e.target.checked)} /> Solo favoritos
        </label>
      </div>
      {!domain && data && data.hiddenCount > 0 && (
        <Callout tone="info">
          Hay {data.hiddenCount} reportes que no están habilitados para tu rol. El backend los excluye de la respuesta; no se ocultan solo en la
          interfaz.
        </Callout>
      )}
      {filtered.length === 0 ? (
        <EmptyState title="No hay reportes para mostrar" description="Ajusta la búsqueda o los filtros." />
      ) : (
        <div className="grid grid-cards">
          {filtered.map((r) => (
            <ReportCard key={r.id} report={r} favorite={favorites.includes(r.id)} onToggleFavorite={() => toggleFavorite(r.id)} />
          ))}
        </div>
      )}
    </>
  );
}

export function ReportsPage() {
  return (
    <>
      <PageHeader title="Catálogo de reportes" subtitle="Reportes de Power BI habilitados para tu rol en el Hub." />
      <ReportGrid />
    </>
  );
}

export function DomainReportsPage({ domain }: { domain: DataDomain }) {
  const { permissions } = useRequiredSession();
  const label = DOMAIN_LABELS[domain];
  if (!permissions.allowedDomains.includes(domain)) {
    return (
      <>
        <PageHeader title={label} />
        <AccessDenied
          message={`No tienes permisos para consultar el dominio ${label} desde el Hub.`}
          requiredRoles={requiredRolesForDomain(domain)}
          code="FORBIDDEN_DOMAIN"
        />
      </>
    );
  }
  return (
    <>
      <PageHeader title={label} subtitle={`Reportes del dominio ${label}.`} />
      <ReportGrid domain={domain} />
    </>
  );
}
