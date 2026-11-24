import { HashRouter, Route, Routes } from 'react-router-dom';
import { SessionProvider, useSession } from './context/SessionContext';
import { ChatProvider } from './context/ChatContext';
import { Layout } from './components/Layout';
import { LoadingState } from './components/ui';
import { LoginPage } from './pages/LoginPage';
import { HomePage } from './pages/HomePage';
import { DomainReportsPage, ReportsPage } from './pages/ReportsPage';
import { ReportViewerPage } from './pages/ReportViewerPage';
import { AssistantPage } from './pages/AssistantPage';
import { CurrentArchitecturePage } from './pages/CurrentArchitecturePage';
import { IdealArchitecturePage } from './pages/IdealArchitecturePage';
import { SecurityPage } from './pages/SecurityPage';
import { SimulatorPage } from './pages/SimulatorPage';
import { AdminPage } from './pages/AdminPage';
import { NotFoundPage } from './pages/NotFoundPage';

function AppRoutes() {
  const { session, permissions, loading } = useSession();

  if (loading) {
    return (
      <div className="boot">
        <LoadingState label="Validando sesión del Hub…" />
      </div>
    );
  }
  if (!session || !permissions) return <LoginPage />;

  return (
    <ChatProvider key={session.sessionId}>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<HomePage />} />
          <Route path="reportes" element={<ReportsPage />} />
          <Route path="reportes/:reportId" element={<ReportViewerPage />} />
          <Route path="comercial" element={<DomainReportsPage key="commercial" domain="commercial" />} />
          <Route path="finanzas" element={<DomainReportsPage key="finance" domain="finance" />} />
          <Route path="operaciones" element={<DomainReportsPage key="operations" domain="operations" />} />
          <Route path="produccion" element={<DomainReportsPage key="production" domain="production" />} />
          <Route path="asistente" element={<AssistantPage />} />
          <Route path="arquitectura-actual" element={<CurrentArchitecturePage />} />
          <Route path="arquitectura-ideal" element={<IdealArchitecturePage />} />
          <Route path="seguridad" element={<SecurityPage />} />
          <Route path="simulador" element={<SimulatorPage />} />
          <Route path="administracion" element={<AdminPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </ChatProvider>
  );
}

export default function App() {
  return (
    <HashRouter>
      <SessionProvider>
        <AppRoutes />
      </SessionProvider>
    </HashRouter>
  );
}