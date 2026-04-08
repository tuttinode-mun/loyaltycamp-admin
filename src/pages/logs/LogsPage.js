import React, { useEffect, useState } from 'react';
import { collection, getDocs, query, orderBy, limit, where } from 'firebase/firestore';
import { db } from '../../firebase';
import Layout from '../../components/Layout';
import { useAuth } from '../../context/AuthContext';

const LogsPage = () => {
  const { tenantId } = useAuth();
  const [logs, setLogs] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [filtroNivel, setFiltroNivel] = useState('');
  const [filtroOrigen, setFiltroOrigen] = useState('');
  const [filtroTipo, setFiltroTipo] = useState('');

  useEffect(() => {
    if (!tenantId) return;
    cargarLogs();
  }, [tenantId]);

  const cargarLogs = async () => {
    try {
      const q = query(
        collection(db, 'logs'),
        where('tenant_id', '==', tenantId),
        orderBy('creado_en', 'desc'),
        limit(200)
      );
      const snap = await getDocs(q);
      setLogs(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (e) {
      console.error(e);
    } finally {
      setCargando(false);
    }
  };

  const logsFiltrados = logs.filter(log => {
    if (filtroNivel && log.nivel !== filtroNivel) return false;
    if (filtroOrigen && log.origen !== filtroOrigen) return false;
    if (filtroTipo && log.tipo !== filtroTipo) return false;
    return true;
  });

  const formatearFecha = (ts) => {
    if (!ts) return '—';
    const fecha = ts.toDate ? ts.toDate() : new Date(ts);
    return fecha.toLocaleDateString('es-CA', {
      day: 'numeric', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit', second: '2-digit'
    });
  };

  const getNivelColor = (nivel) => {
    const colores = { info: '#3b82f6', warning: '#f59e0b', error: '#C8102E' };
    return colores[nivel] || '#6B6B6B';
  };

  const getNivelBg = (nivel) => {
    const bgs = { info: '#eff6ff', warning: '#fffbeb', error: '#fef2f4' };
    return bgs[nivel] || '#f5f5f5';
  };

  const getOrigenEmoji = (origen) => {
    const emojis = { app_cliente: '📱', cajero: '🧾', admin: '💻' };
    return emojis[origen] || '❓';
  };

  return (
    <Layout titulo="Log de actividad">
      <div style={styles.toolbar}>
        <div style={styles.filtros}>
          <select style={styles.filtro} value={filtroNivel} onChange={e => setFiltroNivel(e.target.value)}>
            <option value="">Todos los niveles</option>
            <option value="info">Info</option>
            <option value="warning">Warning</option>
            <option value="error">Error</option>
          </select>
          <select style={styles.filtro} value={filtroOrigen} onChange={e => setFiltroOrigen(e.target.value)}>
            <option value="">Todos los orígenes</option>
            <option value="app_cliente">App cliente</option>
            <option value="cajero">Cajero</option>
            <option value="admin">Admin</option>
          </select>
          <select style={styles.filtro} value={filtroTipo} onChange={e => setFiltroTipo(e.target.value)}>
            <option value="">Todos los tipos</option>
            <option value="login_cliente">Login cliente</option>
            <option value="login_cajero">Login cajero</option>
            <option value="logout">Logout</option>
            <option value="registro_cliente">Registro cliente</option>
            <option value="suma_puntos">Suma puntos</option>
            <option value="canje_premio">Canje premio</option>
            <option value="canje_fallido">Canje fallido</option>
            <option value="error_auth">Error auth</option>
            <option value="error_transaccion">Error transacción</option>
            <option value="error_general">Error general</option>
          </select>
          <button onClick={cargarLogs} style={styles.btnRefresh}>🔄 Refrescar</button>
        </div>
        <span style={styles.contador}>{logsFiltrados.length} registros</span>
      </div>

      <div style={styles.card}>
        {cargando ? (
          <div style={styles.loading}>Cargando logs...</div>
        ) : logsFiltrados.length === 0 ? (
          <div style={styles.loading}>No hay registros con esos filtros</div>
        ) : (
          <table style={styles.tabla}>
            <thead>
              <tr>
                <th style={styles.th}>Nivel</th>
                <th style={styles.th}>Origen</th>
                <th style={styles.th}>Tipo</th>
                <th style={styles.th}>Mensaje</th>
                <th style={styles.th}>Usuario</th>
                <th style={styles.th}>Fecha</th>
              </tr>
            </thead>
            <tbody>
              {logsFiltrados.map(log => (
                <tr key={log.id} style={styles.tr}>
                  <td style={styles.td}>
                    <span style={{
                      ...styles.nivelPill,
                      background: getNivelBg(log.nivel),
                      color: getNivelColor(log.nivel),
                    }}>
                      {log.nivel || 'info'}
                    </span>
                  </td>
                  <td style={styles.td}>
                    <span style={styles.origenCell}>
                      {getOrigenEmoji(log.origen)} {log.origen}
                    </span>
                  </td>
                  <td style={styles.td}>
                    <span style={styles.tipoBadge}>{log.tipo}</span>
                  </td>
                  <td style={styles.td}>
                    <div style={styles.mensajeCell}>{log.mensaje}</div>
                    {log.datos && Object.keys(log.datos).length > 0 && (
                      <div style={styles.datosCell}>
                        {JSON.stringify(log.datos).slice(0, 100)}
                        {JSON.stringify(log.datos).length > 100 ? '...' : ''}
                      </div>
                    )}
                  </td>
                  <td style={styles.td}>
                    <div style={styles.usuarioCell}>{log.usuario_email || '—'}</div>
                  </td>
                  <td style={{ ...styles.td, whiteSpace: 'nowrap', fontSize: 11 }}>
                    {formatearFecha(log.creado_en)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </Layout>
  );
};

const styles = {
  toolbar: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 10 },
  filtros: { display: 'flex', gap: 10, flexWrap: 'wrap' },
  filtro: { padding: '8px 12px', fontSize: 13, borderRadius: 8, border: '1.5px solid rgba(0,0,0,0.1)', background: 'white', outline: 'none', cursor: 'pointer' },
  btnRefresh: { padding: '8px 14px', background: '#F5F3F0', color: '#0F0F0F', border: '1px solid rgba(0,0,0,0.1)', borderRadius: 8, fontSize: 13, cursor: 'pointer' },
  contador: { fontSize: 13, color: '#6B6B6B', whiteSpace: 'nowrap' },
  card: { background: 'white', borderRadius: 14, overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' },
  loading: { textAlign: 'center', padding: 40, color: '#6B6B6B' },
  tabla: { width: '100%', borderCollapse: 'collapse' },
  th: { textAlign: 'left', padding: '10px 14px', fontSize: 11, fontWeight: 600, color: '#6B6B6B', background: '#F5F3F0', borderBottom: '1px solid rgba(0,0,0,0.08)', textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' },
  tr: { borderBottom: '1px solid rgba(0,0,0,0.06)' },
  td: { padding: '10px 14px', fontSize: 12, color: '#0F0F0F', verticalAlign: 'top' },
  nivelPill: { padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700 },
  origenCell: { fontSize: 12, color: '#6B6B6B' },
  tipoBadge: { fontFamily: 'monospace', fontSize: 11, background: '#F5F3F0', padding: '2px 6px', borderRadius: 4 },
  mensajeCell: { fontSize: 13, color: '#0F0F0F', marginBottom: 2 },
  datosCell: { fontSize: 10, color: '#6B6B6B', fontFamily: 'monospace' },
  usuarioCell: { fontSize: 12, color: '#6B6B6B' },
};

export default LogsPage;