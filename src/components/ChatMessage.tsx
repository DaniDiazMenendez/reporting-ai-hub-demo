import { Link } from 'react-router-dom';
import { AlertTriangle, Ban, Bot, Clock, ShieldCheck, User } from 'lucide-react';
import type { ChatMessageModel } from '../context/ChatContext';
import { DOMAIN_LABELS, ROLE_DEFINITIONS } from '../mocks/permissions';
import { formatDateTime } from './ui';

const DENIED_CODES = new Set(['FORBIDDEN_DOMAIN', 'FORBIDDEN_REPORT', 'FORBIDDEN', 'CLIENT_OVERRIDE_REJECTED', 'PROMPT_POLICY']);

export function ChatMessage({ message, compact = false }: { message: ChatMessageModel; compact?: boolean }) {
  if (message.kind === 'user') {
    return (
      <div className="msg msg-user">
        <div className="msg-bubble">
          <span className="sr-only">Tú: </span>
          {message.text}
        </div>
        <span className="msg-avatar" aria-hidden>
          <User size={16} />
        </span>
      </div>
    );
  }

  if (message.kind === 'welcome') {
    return (
      <div className="msg msg-assistant">
        <span className="msg-avatar msg-avatar-bot" aria-hidden>
          <Bot size={16} />
        </span>
        <div className="msg-bubble">{message.text}</div>
      </div>
    );
  }

  if (message.kind === 'error') {
    const denied = DENIED_CODES.has(message.error.error);
    return (
      <div className={`msg msg-assistant ${denied ? 'msg-denied' : 'msg-error'}`} role="alert">
        <span className="msg-avatar msg-avatar-bot" aria-hidden>
          {denied ? <Ban size={16} /> : <AlertTriangle size={16} />}
        </span>
        <div className="msg-bubble">
          <strong>{denied ? 'Consulta denegada' : 'No fue posible responder'}</strong>
          <p>{message.error.message}</p>
          {message.error.requiredRoles && message.error.requiredRoles.length > 0 && (
            <p className="small">Este dominio requiere el rol {message.error.requiredRoles.map((r) => ROLE_DEFINITIONS[r].label).join(' o ')}.</p>
          )}
          <div className="msg-meta">
            <span>HTTP {message.status}</span>
            <code className="inline-code">{message.error.error}</code>
            <span>{formatDateTime(message.timestamp)}</span>
          </div>
        </div>
      </div>
    );
  }

  const r = message.response;
  return (
    <div className="msg msg-assistant">
      <span className="msg-avatar msg-avatar-bot" aria-hidden>
        <Bot size={16} />
      </span>
      <div className="msg-bubble">
        <p>{r.answer}</p>
        {r.relatedReport && (
          <p>
            <Link to={`/reportes/${r.relatedReport.id}`}>Abrir reporte: {r.relatedReport.name}</Link>
          </p>
        )}
        <dl className={`msg-details ${compact ? 'is-compact' : ''}`}>
          <div><dt>Dominio</dt><dd>{DOMAIN_LABELS[r.domain]}</dd></div>
          <div><dt>Agente</dt><dd>{r.agent}</dd></div>
          <div><dt>Data Agent</dt><dd>{r.dataAgent}</dd></div>
          {!compact && <div><dt>Fuente</dt><dd>{r.sources.map((s) => `${s.name} (${s.type})`).join(', ')}</dd></div>}
          {!compact && <div><dt>Reporte relacionado</dt><dd>{r.relatedReport?.name ?? '—'}</dd></div>}
          <div><dt>Acceso aplicado</dt><dd>{r.accessLevelApplied}</dd></div>
        </dl>
        <div className="msg-meta">
          <span><ShieldCheck size={12} aria-hidden /> Autorizado por rol del Hub: {ROLE_DEFINITIONS[r.authorization.role].label}</span>
          <span><Clock size={12} aria-hidden /> {formatDateTime(r.timestamp)}</span>
        </div>
      </div>
    </div>
  );
}
