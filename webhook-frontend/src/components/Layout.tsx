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
        className={`sidebar-link${active ? ' active' : ''}`}
      >
        {label}
      </button>
    );
  };

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div
          className="sidebar-logo"
          onClick={() => navigate('/webhooks')}
          style={{ cursor: 'pointer' }}
        >
          Webhook System
        </div>
        <nav className="sidebar-nav">
          {navItem('Webhooks', '/webhooks')}
          {navItem('Activity', '/activity')}
        </nav>
        <div className="sidebar-footer">
          <button
            className="sidebar-link"
            onClick={handleLogout}
          >
            Sign Out
          </button>
        </div>
      </aside>
      <main className="main-content">{children}</main>
    </div>
  );
}