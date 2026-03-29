import React, { useEffect, useState } from 'react';
import { collection, getDocs, query, orderBy, doc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { COLECCIONES } from '../../constants';
import Layout from '../../components/Layout';

const PremiosPage = () => {
  const [premios, setPremios] = useState([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    const cargarPremios = async () => {
      try {
        const q = query(collection(db, COLECCIONES.PREMIOS), orderBy('costo_puntos', 'asc'));
        const snap = await getDocs(q);
        setPremios(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      } catch (e) {
        console.error(e);
      } finally {
        setCargando(false);
      }
    };
    cargarPremios();
  }, []);

  const toggleActivo = async (premio) => {
    try {
      await updateDoc(doc(db, COLECCIONES.PREMIOS, premio.id), {
        activo: !premio.activo,
      });
      setPremios(prev => prev.map(p => p.id === premio.id ? { ...p, activo: !p.activo } : p));
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <Layout titulo="Premios">
      <div style={styles.card}>
        {cargando ? (
          <div style={styles.loading}>Cargando premios...</div>
        ) : (
          <table style={styles.tabla}>
            <thead>
              <tr>
                <th style={styles.th}>Premio</th>
                <th style={styles.th}>Tipo</th>
                <th style={styles.th}>Costo en puntos</th>
                <th style={styles.th}>Canjeados</th>
                <th style={styles.th}>Estado</th>
                <th style={styles.th}>Acción</th>
              </tr>
            </thead>
            <tbody>
              {premios.map(premio => (
                <tr key={premio.id} style={styles.tr}>
                  <td style={styles.td}>
                    <div style={styles.premioCell}>
                      <span style={styles.premioEmoji}>{premio.emoji || '🎁'}</span>
                      <span style={styles.premioNombre}>{premio.nombre}</span>
                    </div>
                  </td>
                  <td style={styles.td}>
                    <span style={{
                      ...styles.tipoPill,
                      background: premio.tipo === 'descuento' ? '#fef2f4' : '#e8f5e9',
                      color: premio.tipo === 'descuento' ? '#C8102E' : '#15803d',
                    }}>
                      {premio.tipo === 'descuento' ? 'Descuento' : 'Producto'}
                    </span>
                  </td>
                  <td style={{ ...styles.td, fontWeight: 700 }}>
                    {(premio.costo_puntos || 0).toLocaleString()} pts
                  </td>
                  <td style={styles.td}>{premio.total_canjeado || 0}</td>
                  <td style={styles.td}>
                    <span style={{
                      ...styles.estadoPill,
                      background: premio.activo ? '#dcfce7' : '#f5f5f5',
                      color: premio.activo ? '#15803d' : '#6B6B6B',
                    }}>
                      {premio.activo ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td style={styles.td}>
                    <button
                      onClick={() => toggleActivo(premio)}
                      style={{
                        ...styles.btnToggle,
                        background: premio.activo ? '#fef2f4' : '#dcfce7',
                        color: premio.activo ? '#C8102E' : '#15803d',
                      }}
                    >
                      {premio.activo ? 'Desactivar' : 'Activar'}
                    </button>
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
  card: { background: 'white', borderRadius: 14, overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' },
  loading: { textAlign: 'center', padding: 40, color: '#6B6B6B' },
  tabla: { width: '100%', borderCollapse: 'collapse' },
  th: { textAlign: 'left', padding: '10px 14px', fontSize: 11, fontWeight: 600, color: '#6B6B6B', background: '#F5F3F0', borderBottom: '1px solid rgba(0,0,0,0.08)', textTransform: 'uppercase', letterSpacing: '0.05em' },
  tr: { borderBottom: '1px solid rgba(0,0,0,0.06)' },
  td: { padding: '12px 14px', fontSize: 13, color: '#0F0F0F' },
  premioCell: { display: 'flex', alignItems: 'center', gap: 10 },
  premioEmoji: { fontSize: 24 },
  premioNombre: { fontSize: 13, fontWeight: 600 },
  tipoPill: { padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700 },
  estadoPill: { padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700 },
  btnToggle: { padding: '6px 14px', borderRadius: 8, border: 'none', fontSize: 12, fontWeight: 600, cursor: 'pointer' },
};

export default PremiosPage;