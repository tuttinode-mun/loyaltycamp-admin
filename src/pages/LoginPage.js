import React, { useState } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebase';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setCargando(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err) {
      setError('Correo o contraseña incorrectos');
    } finally {
      setCargando(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.logo}>☀️</div>
        <h1 style={styles.titulo}>LoyaltyCamp</h1>
        <p style={styles.subtitulo}>Panel de Administración</p>

        <form onSubmit={handleLogin} style={styles.form}>
          <div style={styles.campo}>
            <label style={styles.label}>Correo electrónico</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="admin@loyaltycamp.com"
              style={styles.input}
              required
            />
          </div>

          <div style={styles.campo}>
            <label style={styles.label}>Contraseña</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              style={styles.input}
              required
            />
          </div>

          {error && <p style={styles.error}>{error}</p>}

          <button
            type="submit"
            style={styles.btn}
            disabled={cargando}
          >
            {cargando ? 'Iniciando sesión...' : 'Iniciar sesión'}
          </button>
        </form>
      </div>
    </div>
  );
};

const styles = {
  container: {
    minHeight: '100vh',
    background: '#C8102E',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  card: {
    background: 'white',
    borderRadius: 20,
    padding: 40,
    width: '100%',
    maxWidth: 400,
    textAlign: 'center',
    boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
  },
  logo: { fontSize: 60, marginBottom: 12 },
  titulo: { fontSize: 28, fontWeight: 800, color: '#0F0F0F', margin: '0 0 4px' },
  subtitulo: { fontSize: 14, color: '#6B6B6B', margin: '0 0 32px' },
  form: { textAlign: 'left' },
  campo: { marginBottom: 16 },
  label: { display: 'block', fontSize: 13, fontWeight: 600, color: '#6B6B6B', marginBottom: 6 },
  input: {
    width: '100%',
    padding: '12px 14px',
    fontSize: 15,
    borderRadius: 12,
    border: '1.5px solid rgba(0,0,0,0.1)',
    background: '#F5F3F0',
    color: '#0F0F0F',
    boxSizing: 'border-box',
    outline: 'none',
  },
  error: { color: '#C8102E', fontSize: 13, marginBottom: 12, textAlign: 'center' },
  btn: {
    width: '100%',
    padding: '14px',
    background: '#C8102E',
    color: 'white',
    border: 'none',
    borderRadius: 12,
    fontSize: 16,
    fontWeight: 800,
    cursor: 'pointer',
    marginTop: 8,
  },
};

export default LoginPage;