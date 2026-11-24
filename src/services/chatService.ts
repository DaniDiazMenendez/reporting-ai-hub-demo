import type { ChatResponse, ReportContext } from '../types';
import { apiRequest } from './apiClient';
import { sessionStore } from './apiClient';

export interface SendChatOptions {
  conversationId?: string;
  reportContext?: ReportContext;
  /** Solo para el simulador: campos que un navegador manipulado intentaría inyectar. */
  tamperedFields?: Record<string, unknown>;
}

export const chatService = {
  /** POST /api/chat — el navegador envía la pregunta; el backend decide dominio, agente y permisos. */
  send(message: string, options: SendChatOptions = {}): Promise<ChatResponse> {
    const body = {
      message,
      conversationId: options.conversationId,
      sessionId: sessionStore.get(),
      ...(options.reportContext ? { reportContext: options.reportContext } : {}),
      ...(options.tamperedFields ?? {})
    };
    return apiRequest<ChatResponse>('POST', '/api/chat', body, 900 + Math.random() * 700);
  }
};
