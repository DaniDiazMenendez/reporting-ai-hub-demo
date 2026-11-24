import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { HubSession, PermissionsView } from '../types';
import { sessionService } from '../services/sessionService';
import { permissionService } from '../services/permissionService';
import { favoritesStore } from '../services/reportService';
import { ApiError } from '../services/apiClient';

interface SessionContextValue {
  session: HubSession | null;
  permissions: PermissionsView | null;
  loading: boolean;
  /** Mensaje mostrado en la pantalla de ingreso (p. ej. sesión expirada). */
  notice: string | null;
  login: (userId: string) => Promise<void>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
  /** Se llama cuando una llamada a la API devuelve 401. */
  handleSessionError: (error: unknown) => boolean;
  favorites: string[];
  toggleFavorite: (reportId: string) => void;
}

const SessionContext = createContext<SessionContextValue | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<HubSession | null>(null);
  const [permissions, setPermissions] = useState<PermissionsView | null>(null);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState<string | null>(null);
  const [favorites, setFavorites] = useState<string[]>([]);

  const clearLocal = useCallback((message: string | null) => {
    setSession(null);
    setPermissions(null);
    setNotice(message);
  }, []);

  const load = useCallback(async () => {
    try {
      const s = await sessionService.getSession();
      if (!s) {
        clearLocal(null);
        return;
      }
      const p = await permissionService.getPermissions();
      setSession(s);
      setPermissions(p);
      setFavorites(favoritesStore.get(s.userId));
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        sessionService.logout().catch(() => undefined);
        clearLocal(error.body.message);
      } else {
        clearLocal('No fue posible validar la sesión del Hub.');
      }
    }
  }, [clearLocal]);

  useEffect(() => {
    load().finally(() => setLoading(false));
  }, [load]);

  const login = useCallback(
    async (userId: string) => {
      await sessionService.login(userId);
      setNotice(null);
      await load();
    },
    [load]
  );

  const logout = useCallback(async () => {
    await sessionService.logout().catch(() => undefined);
    clearLocal(null);
  }, [clearLocal]);

  const handleSessionError = useCallback(
    (error: unknown) => {
      if (error instanceof ApiError && error.status === 401) {
        sessionService.logout().catch(() => undefined);
        clearLocal(error.body.message);
        return true;
      }
      return false;
    },
    [clearLocal]
  );

  const toggleFavorite = useCallback(
    (reportId: string) => {
      if (!session) return;
      setFavorites((prev) => {
        const next = prev.includes(reportId) ? prev.filter((id) => id !== reportId) : [...prev, reportId];
        favoritesStore.set(session.userId, next);
        return next;
      });
    },
    [session]
  );

  const value = useMemo(
    () => ({ session, permissions, loading, notice, login, logout, refresh: load, handleSessionError, favorites, toggleFavorite }),
    [session, permissions, loading, notice, login, logout, load, handleSessionError, favorites, toggleFavorite]
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession(): SessionContextValue {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error('useSession debe usarse dentro de SessionProvider');
  return ctx;
}

/** Variante para páginas protegidas: la sesión siempre existe allí. */
export function useRequiredSession() {
  const ctx = useSession();
  if (!ctx.session || !ctx.permissions) throw new Error('Sesión requerida');
  return { ...ctx, session: ctx.session, permissions: ctx.permissions };
}
