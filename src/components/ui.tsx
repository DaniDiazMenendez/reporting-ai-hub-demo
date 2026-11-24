import type { ReactNode } from 'react';
import { AlertTriangle, Ban, Inbox, Info, Loader2, Lock, RefreshCw, ShieldAlert, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { AccessLevel, DataDomain, HubRole } from '../types';
import { DOMAIN_LABELS, ROLE_DEFINITIONS } from '../mocks/permissions';

export function PageHeader({
  title,
  subtitle,
  badge,
  actions
}: {
  title: string;
  subtitle?: ReactNode;
  badge?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <header className="page-header">
      <div>
        <h1>
          {title} {badge}
        </h1>
        {subtitle && <p className="page-subtitle">{subtitle}</p>}
      </div>
      {actions && <div className="page-actions">{actions}</div>}
    </header>
  );
}

type BadgeTone = 'neutral' | 'blue' | 'green' | 'amber' | 'red' | 'copper' | 'teal';

export function Badge({ children, tone = 'neutral', title }: { children: ReactNode; tone?: BadgeTone; title?: string }) {
  return (
    <span className={`badge badge-${tone}`} title={title}>
      {children}
    </span>
  );
}

const ACCESS_TONE: Record<AccessLevel, BadgeTone> = { Interno: 'blue', Restringido: 'amber', Confidencial: 'red' };

export function AccessBadge({ level }: { level: AccessLevel }) {
  return (
    <Badge tone={ACCESS_TONE[level]}>
      <Lock size={12} aria-hidden /> {level}
    </Badge>
  );
}

export function DomainBadge({ domain }: { domain: DataDomain }) {
  return <Badge tone="copper">{DOMAIN_LABELS[domain]}</Badge>;
}

export function RoleBadge({ role }: { role: HubRole }) {
  return (
    <Badge tone="blue" title="Rol de aplicación del Hub">
      {ROLE_DEFINITIONS[role].label}
    </Badge>
  );
}

export function Card({ children, className = '', title, icon }: { children: ReactNode; className?: string; title?: ReactNode; icon?: ReactNode }) {
  return (
    <section className={`card ${className}`}>
      {title && (
        <h2 className="card-title">
          {icon}
          {title}
        </h2>
      )}
      {children}
    </section>
  );
}

export function StatCard({ label, value, hint, icon }: { label: string; value: ReactNode; hint?: string; icon?: ReactNode }) {
  return (
    <div className="stat-card">
      <div className="stat-icon" aria-hidden>
        {icon}
      </div>
      <div>
        <div className="stat-value">{value}</div>
        <div className="stat-label">{label}</div>
        {hint && <div className="stat-hint">{hint}</div>}
      </div>
    </div>
  );
}

type CalloutTone = 'info' | 'warning' | 'danger' | 'success' | 'future';

const CALLOUT_ICON: Record<CalloutTone, ReactNode> = {
  info: <Info size={18} />,
  warning: <AlertTriangle size={18} />,
  danger: <ShieldAlert size={18} />,
  success: <ShieldCheck size={18} />,
  future: <ShieldCheck size={18} />
};

export function Callout({ tone = 'info', title, children }: { tone?: CalloutTone; title?: string; children: ReactNode }) {
  return (
    <div className={`callout callout-${tone}`} role={tone === 'danger' || tone === 'warning' ? 'note' : undefined}>
      <span className="callout-icon" aria-hidden>
        {CALLOUT_ICON[tone]}
      </span>
      <div>
        {title && <strong className="callout-title">{title}</strong>}
        <div>{children}</div>
      </div>
    </div>
  );
}

export function LoadingState({ label = 'Cargando…' }: { label?: string }) {
  return (
    <div className="state state-loading" role="status" aria-live="polite">
      <Loader2 className="spin" size={22} aria-hidden />
      <span>{label}</span>
    </div>
  );
}

export function SkeletonGrid({ count = 3 }: { count?: number }) {
  return (
    <div className="grid grid-cards" aria-hidden>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="skeleton-card">
          <div className="skeleton skeleton-line w60" />
          <div className="skeleton skeleton-line" />
          <div className="skeleton skeleton-line w80" />
        </div>
      ))}
    </div>
  );
}

export function EmptyState({ title, description, action }: { title: string; description?: string; action?: ReactNode }) {
  return (
    <div className="state state-empty">
      <Inbox size={28} aria-hidden />
      <strong>{title}</strong>
      {description && <p>{description}</p>}
      {action}
    </div>
  );
}

export function ErrorState({ title = 'Ocurrió un error', message, onRetry }: { title?: string; message: string; onRetry?: () => void }) {
  return (
    <div className="state state-error" role="alert">
      <AlertTriangle size={28} aria-hidden />
      <strong>{title}</strong>
      <p>{message}</p>
      {onRetry && (
        <button type="button" className="btn btn-secondary" onClick={onRetry}>
          <RefreshCw size={16} aria-hidden /> Reintentar
        </button>
      )}
    </div>
  );
}

export function AccessDenied({
  message,
  requiredRoles,
  code
}: {
  message: string;
  requiredRoles?: HubRole[];
  code?: string;
}) {
  return (
    <div className="state state-denied" role="alert">
      <Ban size={32} aria-hidden />
      <strong>Acceso denegado {code && <code className="inline-code">{code}</code>}</strong>
      <p>{message}</p>
      {requiredRoles && requiredRoles.length > 0 && (
        <p>
          Requiere rol: {requiredRoles.map((r) => ROLE_DEFINITIONS[r].label).join(' o ')}.
        </p>
      )}
      <p className="muted small">
        La decisión la tomó el backend a partir de la sesión del Hub. Ocultar un botón en la interfaz no reemplaza esta validación.
      </p>
      <Link className="btn btn-secondary" to="/reportes">
        Volver al catálogo
      </Link>
    </div>
  );
}

export function CodeBlock({ children, label }: { children: string; label?: string }) {
  return (
    <figure className="code-block">
      {label && <figcaption>{label}</figcaption>}
      <pre tabIndex={0}>
        <code>{children}</code>
      </pre>
    </figure>
  );
}

export function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString('es-CL', { dateStyle: 'medium', timeStyle: 'short' });
}
