import type { HubRole, HubSession } from '../types';
import { apiRequest, sessionStore } from './apiClient';

export interface DemoUserOption {
  userId: string;
  displayName: string;
  area: string;
  role: HubRole;
}

export const sessionService = {
  /** POST /api/session/login — solo se envía el userId; el rol lo determina el backend. */
  async login(userId: string): Promise<HubSession> {
    const session = await apiRequest<HubSession>('POST', '/api/session/login', { userId });
    sessionStore.set(session.sessionId);
    return session;
  },

  /** POST /api/session/logout */
  async logout(): Promise<void> {
    try {
      await apiRequest('POST', '/api/session/logout');
    } finally {
      sessionStore.clear();
    }
  },

  /** GET /api/session */
  async getSession(): Promise<HubSession | null> {
    if (!sessionStore.get()) return null;
    return apiRequest<HubSession>('GET', '/api/session', undefined, 150);
  },

  async listDemoUsers(): Promise<DemoUserOption[]> {
    return apiRequest<DemoUserOption[]>('GET', '/api/session/demo-users', undefined, 200);
  },

  currentSessionId(): string | null {
    return sessionStore.get();
  }
};
