import React from 'react';
import Sidebar from './Sidebar';

const Layout = ({ children, titulo }) => {
  return (
    <div style={styles.container}>
      <Sidebar />
      <div style={styles.main}>
        {titulo && (
          <div style={styles.header}>
            <h1 style={styles.titulo}>{titulo}</h1>
          </div>
        )}
        <div style={styles.content}>
          {children}
        </div>
      </div>
    </div>
  );
};

const styles = {
  container: {
    display: 'flex',
    minHeight: '100vh',
    background: '#F5F3F0',
  },
  main: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    overflow: 'auto',
  },
  header: {
    background: 'white',
    padding: '16px 24px',
    borderBottom: '1px solid rgba(0,0,0,0.08)',
    position: 'sticky',
    top: 0,
    zIndex: 10,
  },
  titulo: {
    fontSize: 20,
    fontWeight: 800,
    color: '#0F0F0F',
    margin: 0,
  },
  content: {
    padding: 24,
    flex: 1,
  },
};

export default Layout;