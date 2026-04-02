import React, { useEffect, useState } from 'react';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '../../firebase';
import { COLECCIONES } from '../../constants';
import Layout from '../../components/Layout';

const ClientesPage = () => {
  const [clientes, setClientes] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [busqueda, setBusqueda] = useState('');
  const [filtroNivel, setFiltroNivel] = useState('');

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
    const b = busqueda.toLowerCase().trim();
    const cumpleBusqueda = !b || (
      c.nombre_completo?.includes(b) ||
      c.telefono?.includes(b) ||
      c.email?.toLowerCase().includes(b) ||
      c.codigo?.toLowerCase().includes(b)
    );
    const cumpleNivel = !filtroNivel || c.nivel === filtroNivel;
    return cumpleBusqueda && cumpleNivel;
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
    if (!timestamp) return '—';
    const fecha = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return fecha.toLocaleDateString('es-CA', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const exportarCSV = () => {
    if (clientesFiltrados.length === 0) return;
    const headers = ['Código', 'Nombre', 'Apellido', 'Email', 'Teléfono', 'Nivel', 'Puntos vigentes', 'Puntos totales', 'Visitas', 'Última compra', 'Registro'];
    const rows = clientesFiltrados.map(c => [
      c.codigo, c.nombre, c.apellido, c.email, c.telefono,
      c.nivel, c.puntos_vigentes || 0, c.puntos_totales || 0,
      c.total_visitas || 0,
      formatearFecha(c.ultima_compra),
      formatearFecha(c.creado_en),
    ]);
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `clientes_${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
  };

  return (
    <Layout titulo="Clientes">
      {/* Barra de herramientas */}
      <div style={styles.toolbar}>
        <div style={styles.toolbarLeft}>
          <div style={styles.searchWrap}>
            <span style={styles.searchIcon}>🔍</span>
            <input
              type="text"
              placeholder="Buscar por nombre, teléfono, correo o código SL..."
              value={busqueda}
              onChange={e => setBusqueda(e.target.value)}
              style={styles.buscador}
            />
            {busqueda && (
              <button onClick={() => setBusqueda('')} style={styles.clearBtn}>✕</button>
            )}
          </div>
          <select
            style={styles.filtroNivel}
            value={filtroNivel}
            onChange={e => setFiltroNivel(e.target.value)}
          >
            <option value="">Todos los niveles</option>
            <option value="bronce">Bronce</option>
            <option value="oro">Oro</option>
            <option value="platino">Platino</option>
          </select>
        </div>
        <div style={styles.toolbarRight}>
          <span style={styles.contador}>{clientesFiltrados.length} clientes</span>
          <button onClick={exportarCSV} style={styles.btnExportar}>↓ Exportar CSV</button>
        </div>
      </div>

      {/* Tabla */}
      <div style={styles.card}>
        {cargando ? (
          <div style={styles.loading}>Cargando clientes...</div>
        ) : clientesFiltrados.length === 0 ? (
          <div style={styles.loading}>No se encontraron clientes con ese criterio</div>
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
                <th style={styles.th}>Última compra</th>
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
                  <td style={{ ...styles.td, color: cliente.ultima_compra ? '#0F0F0F' : '#aaa' }}>
                    {formatearFecha(cliente.ultima_compra)}
                  </td>
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
  toolbar: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, gap: 12, flexWrap: 'wrap' },
  toolbarLeft: { display: 'flex', gap: 10, flex: 1 },
  toolbarRight: { display: 'flex', alignItems: 'center', gap: 12 },
  searchWrap: { flex: 1, position: 'relative', display: 'flex', alignItems: 'center' },
  searchIcon: { position: 'absolute', left: 10, fontSize: 14 },
  buscador: { width: '100%', padding: '10px 36px 10px 32px', fontSize: 14, borderRadius: 10, border: '1.5px solid rgba(0,0,0,0.1)', background: 'white', outline: 'none' },
  clearBtn: { position: 'absolute', right: 10, background: 'none', border: 'none', cursor: 'pointer', color: '#6B6B6B', fontSize: 14 },
  filtroNivel: { padding: '10px 12px', fontSize: 14, borderRadius: 10, border: '1.5px solid rgba(0,0,0,0.1)', background: 'white', outline: 'none', cursor: 'pointer' },
  contador: { fontSize: 13, color: '#6B6B6B', whiteSpace: 'nowrap' },
  btnExportar: { padding: '10px 16px', background: '#C8102E', color: 'white', border: 'none', borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' },
  card: { background: 'white', borderRadius: 14, overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' },
  loading: { textAlign: 'center', padding: 40, color: '#6B6B6B' },
  tabla: { width: '100%', borderCollapse: 'collapse' },
  th: { textAlign: 'left', padding: '10px 14px', fontSize: 11, fontWeight: 600, color: '#6B6B6B', background: '#F5F3F0', borderBottom: '1px solid rgba(0,0,0,0.08)', textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' },
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