import { useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Maximize2, MessageSquare, X } from 'lucide-react';
import { useChat } from '../context/ChatContext';
import { ChatWindow } from './ChatWindow';

export function FloatingChat() {
  const { panelOpen, setPanelOpen } = useChat();
  const location = useLocation();

  useEffect(() => {
    if (!panelOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setPanelOpen(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [panelOpen, setPanelOpen]);

  if (location.pathname === '/asistente') return null;

  return (
    <>
      {panelOpen && (
        <aside className="floating-panel" role="dialog" aria-label="Asistente de IA">
          <header className="floating-header">
            <strong>Data Assistant</strong>
            <div>
              <Link to="/asistente" className="icon-btn" aria-label="Abrir asistente en página completa" onClick={() => setPanelOpen(false)}>
                <Maximize2 size={16} aria-hidden />
              </Link>
              <button type="button" className="icon-btn" aria-label="Cerrar asistente" onClick={() => setPanelOpen(false)}>
                <X size={18} aria-hidden />
              </button>
            </div>
          </header>
          <ChatWindow compact />
        </aside>
      )}
      <button
        type="button"
        className="floating-button"
        aria-expanded={panelOpen}
        aria-label={panelOpen ? 'Cerrar asistente de IA' : 'Abrir asistente de IA'}
        onClick={() => setPanelOpen(!panelOpen)}
      >
        {panelOpen ? <X size={22} aria-hidden /> : <MessageSquare size={22} aria-hidden />}
      </button>
    </>
  );
}
