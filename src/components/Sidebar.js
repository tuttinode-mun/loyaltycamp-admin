import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const menuItems = [
  { path: '/', label: 'Dashboard', emoji: '📊' },
  { path: '/clientes', label: 'Clientes', emoji: '👥' },
  { path: '/premios', label: 'Premios', emoji: '🎁' },
  { path: '/promociones', label: 'Promociones', emoji: '🏷️' },
  { path: '/cajeros', label: 'Cajeros', emoji: '👨‍💼' },
];

const Sidebar = () => {
  const { cerrarSesion } = useAuth();
  const location = useLocation();

  return (
    <div style={styles.sidebar}>
      {/* Logo */}
      <div style={styles.logoWrap}>
        <div style={styles.logoIcon}>☀️</div>
        <div>
          <div style={styles.logoNombre}>LoyaltyCamp</div>
          <div style={styles.logoSub}>Panel Admin</div>
        </div>
      </div>

      {/* Menu */}
      <nav style={styles.nav}>
        {menuItems.map(item => (
          <Link
            key={item.path}
            to={item.path}
            style={{
              ...styles.menuItem,
              ...(location.pathname === item.path ? styles.menuItemActive : {}),
            }}
          >
            <span style={styles.menuEmoji}>{item.emoji}</span>
            <span>{item.label}</span>
          </Link>
        ))}
      </nav>

      {/* Cerrar sesión */}
      <button onClick={cerrarSesion} style={styles.btnCerrar}>
        🚪 Cerrar sesión
      </button>
    </div>
  );
};

const styles = {
  sidebar: {
    width: 220,
    minHeight: '100vh',
    background: '#9e0a22',
    display: 'flex',
    flexDirection: 'column',
    padding: '20px 0',
    flexShrink: 0,
  },
  logoWrap: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '0 20px 24px',
    borderBottom: '1px solid rgba(255,255,255,0.1)',
    marginBottom: 16,
  },
  logoIcon: { fontSize: 32 },
  logoNombre: { color: 'white', fontSize: 15, fontWeight: 800 },
  logoSub: { color: 'rgba(255,255,255,0.6)', fontSize: 11 },
  nav: { flex: 1, padding: '0 12px' },
  menuItem: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '10px 12px',
    borderRadius: 10,
    color: 'rgba(255,255,255,0.75)',
    textDecoration: 'none',
    fontSize: 14,
    fontWeight: 500,
    marginBottom: 4,
    transition: 'all 0.15s',
  },
  menuItemActive: {
    background: 'rgba(255,255,255,0.15)',
    color: 'white',
    fontWeight: 700,
  },
  menuEmoji: { fontSize: 18 },
  btnCerrar: {
    margin: '0 12px',
    padding: '10px 12px',
    background: 'rgba(255,255,255,0.1)',
    border: 'none',
    borderRadius: 10,
    color: 'rgba(255,255,255,0.75)',
    fontSize: 14,
    cursor: 'pointer',
    textAlign: 'left',
  },
};

export default Sidebar;