import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import { Loader2, RotateCcw, Send } from 'lucide-react';
import { useChat } from '../context/ChatContext';
import { useSession } from '../context/SessionContext';
import { SUGGESTED_QUESTIONS } from '../mocks/chatResponses';
import { DOMAIN_LABELS } from '../mocks/permissions';
import { ChatMessage } from './ChatMessage';

const MAX_LENGTH = 500;

export function ChatWindow({ compact = false }: { compact?: boolean }) {
  const { messages, sending, send, reset, reportContext, setReportContext } = useChat();
  const { permissions } = useSession();
  const [text, setText] = useState('');
  const listRef = useRef<HTMLDivElement>(null);

  const suggestions = useMemo(() => {
    const allowed = permissions?.allowedDomains ?? [];
    return SUGGESTED_QUESTIONS.filter((q) => q.domain === null || allowed.includes(q.domain)).slice(0, compact ? 3 : 8);
  }, [permissions, compact]);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, sending]);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const value = text;
    setText('');
    void send(value);
  };

  return (
    <div className={`chat ${compact ? 'chat-compact' : ''}`}>
      {reportContext && (
        <div className="chat-context">
          Contexto del reporte: <strong>{reportContext.reportId}</strong> ({DOMAIN_LABELS[reportContext.domain]})
          <button type="button" className="link-btn" onClick={() => setReportContext(null)}>
            Quitar
          </button>
        </div>
      )}
      <div className="chat-messages" ref={listRef} aria-live="polite" aria-label="Conversación con el asistente">
        {messages.map((m) => (
          <ChatMessage key={m.id} message={m} compact={compact} />
        ))}
        {sending && (
          <div className="msg msg-assistant" role="status">
            <span className="msg-avatar msg-avatar-bot" aria-hidden>
              <Loader2 size={16} className="spin" />
            </span>
            <div className="msg-bubble typing">
              Validando sesión, dominio y agente autorizado…
            </div>
          </div>
        )}
      </div>

      {messages.length <= 1 && suggestions.length > 0 && (
        <div className="chat-suggestions" aria-label="Preguntas sugeridas">
          {suggestions.map((q) => (
            <button key={q.text} type="button" className="chip" disabled={sending} onClick={() => void send(q.text)}>
              {q.text}
            </button>
          ))}
        </div>
      )}
      {permissions && permissions.allowedDomains.length === 0 && (
        <p className="chat-note">Tu rol no tiene dominios de datos habilitados: el backend denegará las consultas de negocio.</p>
      )}

      <form className="chat-input" onSubmit={submit}>
        <label htmlFor={compact ? 'chat-input-compact' : 'chat-input-full'} className="sr-only">
          Escribe tu pregunta
        </label>
        <textarea
          id={compact ? 'chat-input-compact' : 'chat-input-full'}
          value={text}
          maxLength={MAX_LENGTH}
          rows={compact ? 2 : 3}
          placeholder="Escribe una pregunta sobre tus reportes…"
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              e.currentTarget.form?.requestSubmit();
            }
          }}
        />
        <div className="chat-input-actions">
          <span className="muted small">{text.length}/{MAX_LENGTH}</span>
          <button type="button" className="btn btn-ghost" onClick={reset} title="Nueva conversación">
            <RotateCcw size={16} aria-hidden /> <span className={compact ? 'sr-only' : ''}>Nueva conversación</span>
          </button>
          <button type="submit" className="btn btn-primary" disabled={sending || !text.trim()}>
            <Send size={16} aria-hidden /> Enviar
          </button>
        </div>
      </form>
    </div>
  );
}
