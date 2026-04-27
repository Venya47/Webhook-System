import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Layout({ children }: { children: React.ReactNode }) {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItem = (label: string, path: string) => {
    const active = location.pathname.startsWith(path);
    return (
      <button
        onClick={() => navigate(path)}
        style={{
          background: active ? 'var(--accent-dim)' : 'transparent',
          border: active ? '1px solid rgba(91,91,214,0.3)' : '1px solid transparent',
          color: active ? 'var(--accent)' : 'var(--text-secondary)',
          borderRadius: 6,
          padding: '5px 14px',
          fontSize: 13,
          fontWeight: 600,
          cursor: 'pointer',
          fontFamily: 'var(--font-display)',
          transition: 'all 0.15s',
        }}
      >
        {label}
      </button>
    );
  };

  return (
    <div className="app-shell">
      <nav className="topbar">
        <div
          className="topbar-logo"
          onClick={() => navigate('/webhooks')}
          style={{ cursor: 'pointer' }}
        >
          
          Webhook System
        </div>
        <div className="topbar-nav">
          {navItem('Webhooks', '/webhooks')}
          {navItem('Activity', '/activity')}
          <button
            className="btn btn-ghost"
            onClick={handleLogout}
            style={{ fontSize: 12, marginLeft: 8 }}
          >
            Sign Out
          </button>
        </div>
      </nav>
      <main style={{ flex: 1 }}>{children}</main>
    </div>
  );
}