import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const handleLogout = () => { logout(); navigate('/login'); };

  const nav = [
    { to: '/log',      label: "Today's Log", icon: '📋' },
    { to: '/progress', label: 'Progress',    icon: '📈' },
    { to: '/profile',  label: 'Profile',     icon: '👤' },
  ];

  const linkStyle = (active) => ({
    fontFamily: 'Syne, sans-serif',
    fontWeight: 600,
    fontSize: '13px',
    letterSpacing: '0.04em',
    padding: '6px 16px',
    borderRadius: '8px',
    textDecoration: 'none',
    background: active ? 'var(--lime-dim)' : 'transparent',
    color: active ? 'var(--lime)' : 'var(--muted)',
    transition: 'all 0.18s',
  });

  return (
    <nav style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border)', position: 'sticky', top: 0, zIndex: 100 }}>
      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '0 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '60px' }}>

        {/* Logo */}
        <span style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: '17px', letterSpacing: '-0.02em' }}>
          <span style={{ color: 'var(--lime)' }}>Health</span>Partner
          {user?.name && <span style={{ color: 'var(--muted)', fontSize: '12px', fontWeight: 400, marginLeft: '10px' }}>{user.name}</span>}
        </span>

        {/* Desktop links */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          {nav.map((n) => (
            <NavLink key={n.to} to={n.to} style={({ isActive }) => linkStyle(isActive)}>
              {n.icon} {n.label}
            </NavLink>
          ))}
          <button onClick={handleLogout} className="btn-ghost" style={{ padding: '6px 14px', fontSize: '13px', marginLeft: '8px' }}>
            Sign out
          </button>
        </div>

        {/* Mobile hamburger */}
        <button
          onClick={() => setOpen((o) => !o)}
          style={{ display: 'none', background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}
          aria-label="Toggle menu"
        >
          {[0,1,2].map((i) => (
            <div key={i} style={{ width: 20, height: 2, background: 'var(--muted)', borderRadius: 1, marginBottom: i < 2 ? 4 : 0 }} />
          ))}
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <div style={{ background: 'var(--surface)', borderTop: '1px solid var(--border)', padding: '12px 20px' }}>
          {nav.map((n) => (
            <NavLink key={n.to} to={n.to} onClick={() => setOpen(false)}
              style={({ isActive }) => ({ ...linkStyle(isActive), display: 'block', marginBottom: '4px' })}>
              {n.icon} {n.label}
            </NavLink>
          ))}
          <button onClick={handleLogout} className="btn-ghost" style={{ marginTop: '8px', width: '100%', textAlign: 'left' }}>
            Sign out
          </button>
        </div>
      )}
    </nav>
  );
}
