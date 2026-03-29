import React, { useEffect, useState } from 'react';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '../../firebase';
import { COLECCIONES } from '../../constants';
import Layout from '../../components/Layout';

const ClientesPage = () => {
  const [clientes, setClientes] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [busqueda, setBusqueda] = useState('');

  useEffect(() => {
    const cargarClientes = async () => {
      try {
        const q = query(collection(db, COLECCIONES.CLIENTES), orderBy('creado_en', 'desc'));
        const snap = await getDocs(q);
        setClientes(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      } catch (e) {
        console.error(e);
      } finally {
        setCargando(false);
      }
    };
    cargarClientes();
  }, []);

  const clientesFiltrados = clientes.filter(c => {
    const b = busqueda.toLowerCase();
    return (
      c.nombre_completo?.includes(b) ||
      c.telefono?.includes(b) ||
      c.email?.includes(b) ||
      c.codigo?.toLowerCase().includes(b)
    );
  });

  const getNivelColor = (nivel) => {
    const colores = { bronce: '#cd7f32', oro: '#c89c20', platino: '#5b3f8a' };
    return colores[nivel] || '#6B6B6B';
  };

  const getNivelBg = (nivel) => {
    const bgs = { bronce: '#f5e6d3', oro: '#fef9e7', platino: '#ede8f5' };
    return bgs[nivel] || '#f5f5f5';
  };

  const formatearFecha = (timestamp) => {
    if (!timestamp) return '';
    const fecha = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return fecha.toLocaleDateString('es-CA', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  return (
    <Layout titulo="Clientes">
      {/* Barra de búsqueda */}
      <div style={styles.toolbar}>
        <input
          type="text"
          placeholder="Buscar por nombre, teléfono, correo o código..."
          value={busqueda}
          onChange={e => setBusqueda(e.target.value)}
          style={styles.buscador}
        />
        <div style={styles.contador}>{clientesFiltrados.length} clientes</div>
      </div>

      {/* Tabla */}
      <div style={styles.card}>
        {cargando ? (
          <div style={styles.loading}>Cargando clientes...</div>
        ) : (
          <table style={styles.tabla}>
            <thead>
              <tr>
                <th style={styles.th}>Cliente</th>
                <th style={styles.th}>Teléfono</th>
                <th style={styles.th}>Código</th>
                <th style={styles.th}>Nivel</th>
                <th style={styles.th}>Puntos</th>
                <th style={styles.th}>Visitas</th>
                <th style={styles.th}>Registro</th>
              </tr>
            </thead>
            <tbody>
              {clientesFiltrados.map(cliente => (
                <tr key={cliente.id} style={styles.tr}>
                  <td style={styles.td}>
                    <div style={styles.clienteCell}>
                      <div style={styles.avatar}>
                        {cliente.nombre?.charAt(0)}{cliente.apellido?.charAt(0)}
                      </div>
                      <div>
                        <div style={styles.clienteNombre}>{cliente.nombre} {cliente.apellido}</div>
                        <div style={styles.clienteEmail}>{cliente.email}</div>
                      </div>
                    </div>
                  </td>
                  <td style={styles.td}>{cliente.telefono}</td>
                  <td style={styles.td}>
                    <span style={styles.codigo}>{cliente.codigo}</span>
                  </td>
                  <td style={styles.td}>
                    <span style={{
                      ...styles.nivelPill,
                      background: getNivelBg(cliente.nivel),
                      color: getNivelColor(cliente.nivel),
                    }}>
                      {cliente.nivel?.charAt(0).toUpperCase() + cliente.nivel?.slice(1)}
                    </span>
                  </td>
                  <td style={{ ...styles.td, fontWeight: 700 }}>
                    {(cliente.puntos_vigentes || 0).toLocaleString()}
                  </td>
                  <td style={styles.td}>{cliente.total_visitas || 0}</td>
                  <td style={styles.td}>{formatearFecha(cliente.creado_en)}</td>
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
  toolbar: { display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16 },
  buscador: {
    flex: 1, padding: '10px 14px', fontSize: 14, borderRadius: 10,
    border: '1.5px solid rgba(0,0,0,0.1)', background: 'white', outline: 'none',
  },
  contador: { fontSize: 13, color: '#6B6B6B', whiteSpace: 'nowrap' },
  card: { background: 'white', borderRadius: 14, overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' },
  loading: { textAlign: 'center', padding: 40, color: '#6B6B6B' },
  tabla: { width: '100%', borderCollapse: 'collapse' },
  th: { textAlign: 'left', padding: '10px 14px', fontSize: 11, fontWeight: 600, color: '#6B6B6B', background: '#F5F3F0', borderBottom: '1px solid rgba(0,0,0,0.08)', textTransform: 'uppercase', letterSpacing: '0.05em' },
  tr: { borderBottom: '1px solid rgba(0,0,0,0.06)', cursor: 'pointer' },
  td: { padding: '12px 14px', fontSize: 13, color: '#0F0F0F' },
  clienteCell: { display: 'flex', alignItems: 'center', gap: 10 },
  avatar: { width: 36, height: 36, borderRadius: '50%', background: '#C8102E', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 800, flexShrink: 0 },
  clienteNombre: { fontSize: 13, fontWeight: 600, color: '#0F0F0F' },
  clienteEmail: { fontSize: 11, color: '#6B6B6B', marginTop: 1 },
  codigo: { fontFamily: 'monospace', fontSize: 12, background: '#F5F3F0', padding: '2px 8px', borderRadius: 6 },
  nivelPill: { padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700 },
};

export default ClientesPage;