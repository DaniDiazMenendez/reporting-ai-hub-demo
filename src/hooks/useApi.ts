import { useCallback, useEffect, useRef, useState } from 'react';
import { ApiError } from '../services/apiClient';
import { useSession } from '../context/SessionContext';

export interface ApiState<T> {
  data: T | null;
  loading: boolean;
  error: ApiError | null;
  reload: () => void;
}

/** Ejecuta una llamada a la API con estados de carga y error. Un 401 cierra la sesión local. */
export function useApi<T>(fn: () => Promise<T>, deps: unknown[] = []): ApiState<T> {
  const { handleSessionError } = useSession();
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<ApiError | null>(null);
  const [nonce, setNonce] = useState(0);
  const fnRef = useRef(fn);
  fnRef.current = fn;

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    fnRef
      .current()
      .then((result) => {
        if (!cancelled) setData(result);
      })
      .catch((e: unknown) => {
        if (cancelled || handleSessionError(e)) return;
        setData(null);
        setError(e instanceof ApiError ? e : new ApiError(500, { error: 'BAD_REQUEST', message: 'Error inesperado.' }));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [nonce, handleSessionError, ...deps]); // eslint-disable-line react-hooks/exhaustive-deps

  const reload = useCallback(() => setNonce((n) => n + 1), []);
  return { data, loading, error, reload };
}
