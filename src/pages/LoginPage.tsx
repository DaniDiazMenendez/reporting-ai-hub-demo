import { useState } from 'react';
import { LogIn } from 'lucide-react';
import { useSession } from '../context/SessionContext';
import { sessionService } from '../services/sessionService';
import { useApi } from '../hooks/useApi';
import { ROLE_DEFINITIONS } from '../mocks/permissions';
import { Badge, Callout, ErrorState, LoadingState } from '../components/ui';
import { ApiError } from '../services/apiClient';

/** Pantalla de ingreso simulada: representa el mecanismo de acceso actual del Hub (no Entra ID). */
export function LoginPage() {
  const { login, notice } = useSession();
  const users = useApi(() => sessionService.listDemoUsers());
  const [pending, setPending] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const onLogin = async (userId: string) => {
    setPending(userId);
    setError(null);
    try {
      await login(userId);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'No fue posible iniciar la sesión.');
    } finally {
      setPending(null);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-brand">
          <span className="brand-title">Reporting &amp; AI Hub</span>
          <Badge tone="copper">Demo POC</Badge>
        </div>
        <h1>Ingreso al Hub</h1>
        <p className="muted">
          Selecciona un usuario simulado. En la demo esto representa el mecanismo de acceso actual del Hub; la sesión es
          propia de la aplicación y el rol se obtiene en el backend.
        </p>
        {notice && <Callout tone="warning" title="Sesión finalizada">{notice}</Callout>}
        {error && <Callout tone="danger">{error}</Callout>}
        {users.loading && <LoadingState label="Cargando usuarios de la demo…" />}
        {users.error && <ErrorState message={users.error.message} onRetry={users.reload} />}
        {users.data && (
          <ul className="login-users">
            {users.data.map((u) => (
              <li key={u.userId}>
                <button type="button" className="login-user" disabled={pending !== null} onClick={() => void onLogin(u.userId)}>
                  <span className="avatar avatar-dark" aria-hidden>
                    {u.displayName
                      .split(' ')
                      .map((p) => p[0])
                      .slice(0, 2)
                      .join('')}
                  </span>
                  <span className="login-user-info">
                    <strong>{u.displayName}</strong>
                    <span className="muted small">
                      {u.userId} · {u.area}
                    </span>
                  </span>
                  <Badge tone="blue">{ROLE_DEFINITIONS[u.role].label}</Badge>
                  {pending === u.userId ? <span className="small">Ingresando…</span> : <LogIn size={18} aria-hidden />}
                </button>
              </li>
            ))}
          </ul>
        )}
        <p className="muted small">Datos ficticios. No se conecta ningún servicio real ni se almacenan credenciales.</p>
      </div>
    </div>
  );
}
