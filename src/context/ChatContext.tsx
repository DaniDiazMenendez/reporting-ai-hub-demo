import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { ApiErrorBody, ChatResponse, ReportContext } from '../types';
import { chatService } from '../services/chatService';
import { ApiError } from '../services/apiClient';
import { WELCOME_MESSAGE } from '../mocks/chatResponses';
import { useSession } from './SessionContext';

export type ChatMessageModel =
  | { id: string; kind: 'user'; text: string; timestamp: string }
  | { id: string; kind: 'welcome'; text: string; timestamp: string }
  | { id: string; kind: 'assistant'; response: ChatResponse }
  | { id: string; kind: 'error'; status: number; error: ApiErrorBody; timestamp: string };

interface ChatContextValue {
  messages: ChatMessageModel[];
  sending: boolean;
  panelOpen: boolean;
  setPanelOpen: (open: boolean) => void;
  reportContext: ReportContext | null;
  setReportContext: (ctx: ReportContext | null) => void;
  send: (text: string) => Promise<void>;
  reset: () => void;
}

const ChatContext = createContext<ChatContextValue | null>(null);

let counter = 0;
const msgId = () => `msg-${Date.now()}-${counter++}`;

const welcome = (): ChatMessageModel => ({
  id: msgId(),
  kind: 'welcome',
  text: WELCOME_MESSAGE,
  timestamp: new Date().toISOString()
});

export function ChatProvider({ children }: { children: ReactNode }) {
  const { session, handleSessionError, refresh } = useSession();
  const [messages, setMessages] = useState<ChatMessageModel[]>(() => [welcome()]);
  const [conversationId, setConversationId] = useState<string | undefined>();
  const [sending, setSending] = useState(false);
  const [panelOpen, setPanelOpen] = useState(false);
  const [reportContext, setReportContext] = useState<ReportContext | null>(null);

  const reset = useCallback(() => {
    setMessages([welcome()]);
    setConversationId(undefined);
  }, []);

  // Cada sesión inicia una conversación nueva: no se comparten historiales entre usuarios.
  useEffect(() => {
    reset();
  }, [session?.sessionId, reset]);

  const send = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || sending) return;
      setMessages((prev) => [...prev, { id: msgId(), kind: 'user', text: trimmed, timestamp: new Date().toISOString() }]);
      setSending(true);
      try {
        const response = await chatService.send(trimmed, {
          conversationId,
          reportContext: reportContext ?? undefined
        });
        setConversationId(response.conversationId);
        setMessages((prev) => [...prev, { id: msgId(), kind: 'assistant', response }]);
        refresh().catch(() => undefined);
      } catch (error) {
        if (handleSessionError(error)) return;
        const apiError =
          error instanceof ApiError
            ? error
            : new ApiError(500, { error: 'AI_SERVICE_UNAVAILABLE', message: 'Ocurrió un error inesperado al consultar el asistente.' });
        setMessages((prev) => [
          ...prev,
          { id: msgId(), kind: 'error', status: apiError.status, error: apiError.body, timestamp: new Date().toISOString() }
        ]);
      } finally {
        setSending(false);
      }
    },
    [conversationId, reportContext, sending, handleSessionError, refresh]
  );

  const value = useMemo(
    () => ({ messages, sending, panelOpen, setPanelOpen, reportContext, setReportContext, send, reset }),
    [messages, sending, panelOpen, reportContext, send, reset]
  );

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}

export function useChat(): ChatContextValue {
  const ctx = useContext(ChatContext);
  if (!ctx) throw new Error('useChat debe usarse dentro de ChatProvider');
  return ctx;
}
