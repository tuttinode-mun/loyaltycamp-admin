import React, { useEffect, useState } from 'react';
import { collection, getDocs, query, orderBy, doc, updateDoc, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebase';
import { COLECCIONES } from '../../constants';
import Layout from '../../components/Layout';

const PremiosPage = () => {
  const [premios, setPremios] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [mostrarForm, setMostrarForm] = useState(false);
  const [form, setForm] = useState({
    nombre: '',
    emoji: '🎁',
    tipo: 'descuento',
    costo_puntos: '',
    valor_descuento: '',
    niveles_habilitados: ['bronce', 'oro', 'platino'],
    sucursales: 'todas',
    stock_limitado: false,
    stock_disponible: '',
  });

  useEffect(() => {
    cargarPremios();
  }, []);

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

  const toggleActivo = async (premio) => {
    try {
      await updateDoc(doc(db, COLECCIONES.PREMIOS, premio.id), { activo: !premio.activo });
      setPremios(prev => prev.map(p => p.id === premio.id ? { ...p, activo: !p.activo } : p));
    } catch (e) {
      console.error(e);
    }
  };

  const toggleNivel = (nivel) => {
    const niveles = form.niveles_habilitados;
    if (niveles.includes(nivel)) {
      setForm({ ...form, niveles_habilitados: niveles.filter(n => n !== nivel) });
    } else {
      setForm({ ...form, niveles_habilitados: [...niveles, nivel] });
    }
  };

  const handleCrear = async (e) => {
    e.preventDefault();
    if (form.niveles_habilitados.length === 0) {
      alert('Selecciona al menos un nivel habilitado');
      return;
    }
    try {
      await addDoc(collection(db, COLECCIONES.PREMIOS), {
        nombre: form.nombre,
        emoji: form.emoji,
        tipo: form.tipo,
        costo_puntos: parseInt(form.costo_puntos),
        valor_descuento: form.tipo === 'descuento' ? parseFloat(form.valor_descuento) : null,
        niveles_habilitados: form.niveles_habilitados,
        sucursales: [form.sucursales],
        stock_limitado: form.stock_limitado,
        stock_disponible: form.stock_limitado ? parseInt(form.stock_disponible) : null,
        activo: true,
        total_canjeado: 0,
        creado_en: serverTimestamp(),
      });
      setMostrarForm(false);
      setForm({
        nombre: '', emoji: '🎁', tipo: 'descuento',
        costo_puntos: '', valor_descuento: '',
        niveles_habilitados: ['bronce', 'oro', 'platino'],
        sucursales: 'todas', stock_limitado: false, stock_disponible: '',
      });
      cargarPremios();
    } catch (e) {
      console.error(e);
      alert('Error al crear premio');
    }
  };

  return (
    <Layout titulo="Premios">
      <div style={styles.toolbar}>
        <span style={styles.contador}>{premios.length} premios</span>
        <button onClick={() => setMostrarForm(!mostrarForm)} style={styles.btnNuevo}>
          {mostrarForm ? 'Cancelar' : '+ Nuevo premio'}
        </button>
      </div>

      {/* Formulario */}
      {mostrarForm && (
        <div style={styles.formCard}>
          <h3 style={styles.formTitulo}>Nuevo premio</h3>
          <form onSubmit={handleCrear}>
            <div style={styles.formGrid}>
              <div style={styles.campo}>
                <label style={styles.label}>Nombre del premio</label>
                <input style={styles.input} value={form.nombre} onChange={e => setForm({...form, nombre: e.target.value})} placeholder="Descuento $5" required />
              </div>
              <div style={styles.campo}>
                <label style={styles.label}>Emoji</label>
                <input style={styles.input} value={form.emoji} onChange={e => setForm({...form, emoji: e.target.value})} placeholder="🎁" />
              </div>
              <div style={styles.campo}>
                <label style={styles.label}>Tipo</label>
                <select style={styles.input} value={form.tipo} onChange={e => setForm({...form, tipo: e.target.value})}>
                  <option value="descuento">Descuento en $</option>
                  <option value="producto">Producto gratis</option>
                </select>
              </div>
              <div style={styles.campo}>
                <label style={styles.label}>Costo en puntos</label>
                <input style={styles.input} type="number" value={form.costo_puntos} onChange={e => setForm({...form, costo_puntos: e.target.value})} placeholder="500" required />
              </div>
              {form.tipo === 'descuento' && (
                <div style={styles.campo}>
                  <label style={styles.label}>Valor del descuento ($)</label>
                  <input style={styles.input} type="number" step="0.01" value={form.valor_descuento} onChange={e => setForm({...form, valor_descuento: e.target.value})} placeholder="5.00" />
                </div>
              )}
              <div style={styles.campo}>
                <label style={styles.label}>Sucursal</label>
                <select style={styles.input} value={form.sucursales} onChange={e => setForm({...form, sucursales: e.target.value})}>
                  <option value="todas">Todas las sucursales</option>
                  <option value="st-hubert">St-Hubert</option>
                  <option value="st-laurent">St-Laurent</option>
                  <option value="brossard">Brossard</option>
                </select>
              </div>
            </div>

            {/* Niveles habilitados */}
            <div style={styles.campo}>
              <label style={styles.label}>Niveles que pueden canjear</label>
              <div style={styles.nivelesRow}>
                {['bronce', 'oro', 'platino'].map(nivel => (
                  <button
                    key={nivel}
                    type="button"
                    onClick={() => toggleNivel(nivel)}
                    style={{
                      ...styles.nivelBtn,
                      background: form.niveles_habilitados.includes(nivel) ? '#C8102E' : '#F5F3F0',
                      color: form.niveles_habilitados.includes(nivel) ? 'white' : '#6B6B6B',
                    }}
                  >
                    {nivel.charAt(0).toUpperCase() + nivel.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {/* Stock limitado */}
            <div style={{ ...styles.campo, marginBottom: 16 }}>
              <label style={styles.label}>
                <input
                  type="checkbox"
                  checked={form.stock_limitado}
                  onChange={e => setForm({...form, stock_limitado: e.target.checked})}
                  style={{ marginRight: 8 }}
                />
                Stock limitado
              </label>
              {form.stock_limitado && (
                <input
                  style={{ ...styles.input, marginTop: 8, width: 200 }}
                  type="number"
                  value={form.stock_disponible}
                  onChange={e => setForm({...form, stock_disponible: e.target.value})}
                  placeholder="Cantidad disponible"
                />
              )}
            </div>

            <button type="submit" style={styles.btnGuardar}>Crear premio</button>
          </form>
        </div>
      )}

      {/* Tabla */}
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
                <th style={styles.th}>Niveles</th>
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
                  <td style={styles.td}>
                    <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                      {premio.niveles_habilitados?.map(n => (
                        <span key={n} style={styles.nivelPill}>{n}</span>
                      ))}
                    </div>
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
  toolbar: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  contador: { fontSize: 13, color: '#6B6B6B' },
  btnNuevo: { padding: '10px 20px', background: '#C8102E', color: 'white', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: 'pointer' },
  formCard: { background: 'white', borderRadius: 14, padding: 24, marginBottom: 16, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' },
  formTitulo: { fontSize: 16, fontWeight: 700, color: '#0F0F0F', marginBottom: 16, marginTop: 0 },
  formGrid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginBottom: 16 },
  campo: { marginBottom: 12 },
  label: { display: 'block', fontSize: 12, fontWeight: 600, color: '#6B6B6B', marginBottom: 5 },
  input: { width: '100%', padding: '9px 12px', fontSize: 14, borderRadius: 8, border: '1.5px solid rgba(0,0,0,0.1)', background: '#F5F3F0', boxSizing: 'border-box', outline: 'none' },
  nivelesRow: { display: 'flex', gap: 8, marginTop: 6 },
  nivelBtn: { padding: '8px 16px', borderRadius: 8, border: 'none', fontSize: 13, fontWeight: 600, cursor: 'pointer' },
  btnGuardar: { padding: '11px 24px', background: '#C8102E', color: 'white', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: 'pointer' },
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
  nivelPill: { padding: '2px 8px', borderRadius: 20, fontSize: 10, fontWeight: 600, background: '#F5F3F0', color: '#6B6B6B' },
  estadoPill: { padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700 },
  btnToggle: { padding: '6px 14px', borderRadius: 8, border: 'none', fontSize: 12, fontWeight: 600, cursor: 'pointer' },
};

export default PremiosPage;