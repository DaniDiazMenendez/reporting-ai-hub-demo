import { useEffect, useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import {
  BarChart3,
  Bot,
  Factory,
  FlaskConical,
  Home,
  Landmark,
  LogOut,
  Menu,
  Network,
  Settings,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  Wrench,
  X
} from 'lucide-react';
import { useSession } from '../context/SessionContext';
import { ROLE_DEFINITIONS } from '../mocks/permissions';
import { FloatingChat } from './FloatingChat';
import { Badge } from './ui';
import type { DataDomain } from '../types';

interface NavItem {
  to: string;
  label: string;
  icon: JSX.Element;
  domain?: DataDomain;
  adminOnly?: boolean;
}

const NAV: Array<{ section: string; items: NavItem[] }> = [
  {
    section: 'Hub',
    items: [
      { to: '/', label: 'Inicio', icon: <Home size={18} /> },
      { to: '/reportes', label: 'Reportes', icon: <BarChart3 size={18} /> },
      { to: '/comercial', label: 'Comercial', icon: <TrendingUp size={18} />, domain: 'commercial' },
      { to: '/finanzas', label: 'Finanzas', icon: <Landmark size={18} />, domain: 'finance' },
      { to: '/operaciones', label: 'Operaciones', icon: <Wrench size={18} />, domain: 'operations' },
      { to: '/produccion', label: 'Producción', icon: <Factory size={18} />, domain: 'production' },
      { to: '/asistente', label: 'Asistente de IA', icon: <Bot size={18} /> }
    ]
  },
  {
    section: 'Arquitectura y seguridad',
    items: [
      { to: '/arquitectura-actual', label: 'Arquitectura actual', icon: <Network size={18} /> },
      { to: '/arquitectura-ideal', label: 'Arquitectura ideal', icon: <Sparkles size={18} /> },
      { to: '/seguridad', label: 'Seguridad y permisos', icon: <ShieldCheck size={18} /> },
      { to: '/simulador', label: 'Simulador de permisos', icon: <FlaskConical size={18} /> },
      { to: '/administracion', label: 'Administración', icon: <Settings size={18} />, adminOnly: true }
    ]
  }
];

function minutesLeft(expiresAt: string) {
  return Math.max(0, Math.round((new Date(expiresAt).getTime() - Date.now()) / 60000));
}

export function Layout() {
  const { session, permissions, logout } = useSession();
  const [menuOpen, setMenuOpen] = useState(false);
  const [, tick] = useState(0);
  const location = useLocation();

  useEffect(() => setMenuOpen(false), [location.pathname]);
  useEffect(() => {
    const t = setInterval(() => tick((n) => n + 1), 30000);
    return () => clearInterval(t);
  }, []);

  if (!session || !permissions) return null;
  const role = ROLE_DEFINITIONS[session.role];

  return (
    <div className="app-shell">
      <a
        href="#main"
        className="skip-link"
        onClick={(e) => {
          e.preventDefault();
          document.getElementById('main')?.focus();
        }}
      >
        Saltar al contenido
      </a>
      <header className="topbar">
        <button
          type="button"
          className="icon-btn menu-toggle"
          aria-label={menuOpen ? 'Cerrar menú' : 'Abrir menú'}
          aria-expanded={menuOpen}
          aria-controls="sidebar"
          onClick={() => setMenuOpen(!menuOpen)}
        >
          {menuOpen ? <X size={22} aria-hidden /> : <Menu size={22} aria-hidden />}
        </button>
        <div className="brand">
          <span className="brand-title">Reporting &amp; AI Hub</span>
          <Badge tone="copper">Demo POC</Badge>
        </div>
        <div className="topbar-user">
          <div className="user-info">
            <span className="user-name">{session.displayName}</span>
            <span className="user-meta">
              Rol: {role.label} · Identificado por el sistema del Hub · expira en {minutesLeft(session.expiresAt)} min
            </span>
          </div>
          <span className="avatar" aria-hidden>
            {session.displayName
              .split(' ')
              .map((p) => p[0])
              .slice(0, 2)
              .join('')}
          </span>
          <button type="button" className="btn btn-ghost-light" onClick={() => void logout()}>
            <LogOut size={16} aria-hidden /> <span className="hide-sm">Salir</span>
          </button>
        </div>
      </header>

      <div className="app-body">
        <nav id="sidebar" className={`sidebar ${menuOpen ? 'is-open' : ''}`} aria-label="Navegación principal">
          {NAV.map((group) => (
            <div key={group.section} className="nav-group">
              <span className="nav-section">{group.section}</span>
              <ul>
                {group.items.map((item) => {
                  const locked =
                    (item.domain && !permissions.allowedDomains.includes(item.domain)) || (item.adminOnly && !permissions.adminAccess);
                  return (
                    <li key={item.to}>
                      <NavLink to={item.to} end={item.to === '/'} className={({ isActive }) => `nav-link ${isActive ? 'active' : ''} ${locked ? 'locked' : ''}`}>
                        <span aria-hidden>{item.icon}</span>
                        {item.label}
                        {locked && <span className="nav-lock" title="Sin permiso para tu rol (el backend lo valida igualmente)">🔒</span>}
                      </NavLink>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
          <p className="sidebar-note">Modo demo · datos ficticios · sin servicios reales conectados.</p>
        </nav>
        {menuOpen && <div className="backdrop" onClick={() => setMenuOpen(false)} aria-hidden />}
        <main id="main" className="content" tabIndex={-1}>
          <Outlet />
        </main>
      </div>
      <FloatingChat />
    </div>
  );
}
