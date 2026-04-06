import React, { useEffect, useState } from 'react';
import { collection, getDocs, query, orderBy, limit, where } from 'firebase/firestore';
import { db } from '../firebase';
import { COLECCIONES } from '../constants';
import Layout from '../components/Layout';
import { useAuth } from '../context/AuthContext';

const StatCard = ({ titulo, valor, emoji, color }) => (
  <div style={{ ...styles.statCard, borderLeft: `4px solid ${color}` }}>
    <div style={styles.statEmoji}>{emoji}</div>
    <div style={styles.statVal}>{valor}</div>
    <div style={styles.statTitulo}>{titulo}</div>
  </div>
);

const DashboardPage = () => {
  const { tenantId } = useAuth();
  const [stats, setStats] = useState({
    totalClientes: 0,
    totalTransacciones: 0,
    totalPuntos: 0,
    clientesHoy: 0,
  });
  const [transRecientes, setTransRecientes] = useState([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    if (!tenantId) return;
    const cargarDatos = async () => {
      try {
        // Clientes
        const clientesSnap = await getDocs(
          query(collection(db, COLECCIONES.CLIENTES), where('tenant_id', '==', tenantId))
        );
        const clientes = clientesSnap.docs.map(d => d.data());
        const totalPuntos = clientes.reduce((acc, c) => acc + (c.puntos_vigentes || 0), 0);

        // Transacciones
        const transSnap = await getDocs(
          query(collection(db, COLECCIONES.TRANSACCIONES), where('tenant_id', '==', tenantId))
        );

        // Transacciones recientes
        const transRecientesSnap = await getDocs(
          query(
            collection(db, COLECCIONES.TRANSACCIONES),
            where('tenant_id', '==', tenantId),
            orderBy('creado_en', 'desc'),
            limit(10)
          )
        );

        setStats({
          totalClientes: clientes.length,
          totalTransacciones: transSnap.size,
          totalPuntos,
          clientesHoy: clientes.filter(c => {
            if (!c.creado_en) return false;
            const fecha = c.creado_en.toDate ? c.creado_en.toDate() : new Date(c.creado_en);
            const hoy = new Date();
            return fecha.toDateString() === hoy.toDateString();
          }).length,
        });

        setTransRecientes(transRecientesSnap.docs.map(d => ({ id: d.id, ...d.data() })));
      } catch (e) {
        console.error(e);
      } finally {
        setCargando(false);
      }
    };
    cargarDatos();
  }, [tenantId]);

  const formatearFecha = (timestamp) => {
    if (!timestamp) return '';
    const fecha = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return fecha.toLocaleDateString('es-CA', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
  };

  return (
    <Layout titulo="Dashboard">
      {cargando ? (
        <div style={styles.loading}>Cargando datos...</div>
      ) : (
        <>
          {/* Stats */}
          <div style={styles.statsGrid}>
            <StatCard titulo="Total clientes" valor={stats.totalClientes} emoji="👥" color="#C8102E" />
            <StatCard titulo="Transacciones" valor={stats.totalTransacciones} emoji="💳" color="#3b82f6" />
            <StatCard titulo="Puntos en circulación" valor={stats.totalPuntos.toLocaleString()} emoji="⭐" color="#F5C842" />
            <StatCard titulo="Nuevos hoy" valor={stats.clientesHoy} emoji="🆕" color="#10b981" />
          </div>

          {/* Transacciones recientes */}
          <div style={styles.card}>
            <h2 style={styles.cardTitulo}>Transacciones recientes</h2>
            <table style={styles.tabla}>
              <thead>
                <tr>
                  <th style={styles.th}>Tipo</th>
                  <th style={styles.th}>Cliente ID</th>
                  <th style={styles.th}>Puntos</th>
                  <th style={styles.th}>Monto</th>
                  <th style={styles.th}>Fecha</th>
                </tr>
              </thead>
              <tbody>
                {transRecientes.map(tx => (
                  <tr key={tx.id} style={styles.tr}>
                    <td style={styles.td}>
                      <span style={{
                        ...styles.tipoPill,
                        background: tx.tipo === 'compra' ? '#dcfce7' : '#fef2f4',
                        color: tx.tipo === 'compra' ? '#15803d' : '#C8102E',
                      }}>
                        {tx.tipo === 'compra' ? '🛒 Compra' : '🎁 Canje'}
                      </span>
                    </td>
                    <td style={styles.td}>{tx.cliente_id?.slice(0, 8)}...</td>
                    <td style={{ ...styles.td, fontWeight: 700, color: tx.puntos_cantidad > 0 ? '#15803d' : '#C8102E' }}>
                      {tx.puntos_cantidad > 0 ? '+' : ''}{tx.puntos_cantidad}
                    </td>
                    <td style={styles.td}>{tx.monto_compra ? `$${tx.monto_compra.toFixed(2)}` : '—'}</td>
                    <td style={styles.td}>{formatearFecha(tx.creado_en)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </Layout>
  );
};

const styles = {
  loading: { textAlign: 'center', padding: 40, color: '#6B6B6B' },
  statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 },
  statCard: { background: 'white', borderRadius: 14, padding: 20, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' },
  statEmoji: { fontSize: 28, marginBottom: 8 },
  statVal: { fontSize: 28, fontWeight: 800, color: '#0F0F0F', marginBottom: 4 },
  statTitulo: { fontSize: 13, color: '#6B6B6B' },
  card: { background: 'white', borderRadius: 14, padding: 20, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' },
  cardTitulo: { fontSize: 16, fontWeight: 700, color: '#0F0F0F', marginBottom: 16, marginTop: 0 },
  tabla: { width: '100%', borderCollapse: 'collapse' },
  th: { textAlign: 'left', padding: '8px 12px', fontSize: 12, fontWeight: 600, color: '#6B6B6B', background: '#F5F3F0', borderBottom: '1px solid rgba(0,0,0,0.08)', textTransform: 'uppercase', letterSpacing: '0.05em' },
  tr: { borderBottom: '1px solid rgba(0,0,0,0.06)' },
  td: { padding: '12px', fontSize: 13, color: '#0F0F0F' },
  tipoPill: { padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600 },
};

export default DashboardPage;