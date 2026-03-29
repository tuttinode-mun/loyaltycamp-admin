import React, { useEffect, useState } from 'react';
import { collection, getDocs, query, orderBy, doc, updateDoc, addDoc, serverTimestamp, Timestamp } from 'firebase/firestore';
import { db } from '../../firebase';
import { COLECCIONES } from '../../constants';
import Layout from '../../components/Layout';

const PromocionesPage = () => {
  const [promociones, setPromociones] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [mostrarForm, setMostrarForm] = useState(false);
  const [form, setForm] = useState({
    nombre: '', marca: '', tipo: 'precio',
    precio_normal: '', precio_promo: '',
    fecha_fin: '', sucursales: 'todas',
  });

  useEffect(() => {
    cargarPromociones();
  }, []);

  const cargarPromociones = async () => {
    try {
      const q = query(collection(db, COLECCIONES.PROMOCIONES), orderBy('fecha_fin', 'asc'));
      const snap = await getDocs(q);
      setPromociones(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (e) {
      console.error(e);
    } finally {
      setCargando(false);
    }
  };

  const toggleActivo = async (promo) => {
    try {
      await updateDoc(doc(db, COLECCIONES.PROMOCIONES, promo.id), { activo: !promo.activo });
      setPromociones(prev => prev.map(p => p.id === promo.id ? { ...p, activo: !p.activo } : p));
    } catch (e) {
      console.error(e);
    }
  };

  const handleCrear = async (e) => {
    e.preventDefault();
    try {
      const pNormal = parseFloat(form.precio_normal);
      const pPromo = parseFloat(form.precio_promo);
      const pct = pNormal > 0 ? Math.round(((pNormal - pPromo) / pNormal) * 100) : 0;
      const fechaFin = Timestamp.fromDate(new Date(form.fecha_fin));

      await addDoc(collection(db, COLECCIONES.PROMOCIONES), {
        nombre: form.nombre,
        marca: form.marca,
        tipo: form.tipo,
        precio_normal: pNormal,
        precio_promo: pPromo,
        porcentaje_descuento: pct,
        fecha_inicio: serverTimestamp(),
        fecha_fin: fechaFin,
        sucursales: [form.sucursales],
        activo: true,
        creado_en: serverTimestamp(),
      });

      setMostrarForm(false);
      setForm({ nombre: '', marca: '', tipo: 'precio', precio_normal: '', precio_promo: '', fecha_fin: '', sucursales: 'todas' });
      cargarPromociones();
    } catch (e) {
      console.error(e);
      alert('Error al crear promoción');
    }
  };

  const formatearFecha = (timestamp) => {
    if (!timestamp) return '';
    const fecha = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return fecha.toLocaleDateString('es-CA', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const getDiasRestantes = (timestamp) => {
    if (!timestamp) return null;
    const fin = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const diff = Math.ceil((fin - new Date()) / (1000 * 60 * 60 * 24));
    return diff;
  };

  return (
    <Layout titulo="Promociones">
      <div style={styles.toolbar}>
        <span style={styles.contador}>{promociones.length} promociones</span>
        <button onClick={() => setMostrarForm(!mostrarForm)} style={styles.btnNueva}>
          {mostrarForm ? 'Cancelar' : '+ Nueva promoción'}
        </button>
      </div>

      {/* Formulario */}
      {mostrarForm && (
        <div style={styles.formCard}>
          <h3 style={styles.formTitulo}>Nueva promoción</h3>
          <form onSubmit={handleCrear}>
            <div style={styles.formGrid}>
              <div style={styles.campo}>
                <label style={styles.label}>Nombre del producto</label>
                <input style={styles.input} value={form.nombre} onChange={e => setForm({...form, nombre: e.target.value})} placeholder="Leche Alpina UHT" required />
              </div>
              <div style={styles.campo}>
                <label style={styles.label}>Marca</label>
                <input style={styles.input} value={form.marca} onChange={e => setForm({...form, marca: e.target.value})} placeholder="Alpina" />
              </div>
              <div style={styles.campo}>
                <label style={styles.label}>Tipo</label>
                <select style={styles.input} value={form.tipo} onChange={e => setForm({...form, tipo: e.target.value})}>
                  <option value="precio">Precio especial</option>
                  <option value="2x1">2×1</option>
                  <option value="especial">Oferta especial</option>
                </select>
              </div>
              <div style={styles.campo}>
                <label style={styles.label}>Precio normal ($)</label>
                <input style={styles.input} type="number" step="0.01" value={form.precio_normal} onChange={e => setForm({...form, precio_normal: e.target.value})} placeholder="3.29" required />
              </div>
              <div style={styles.campo}>
                <label style={styles.label}>Precio promo ($)</label>
                <input style={styles.input} type="number" step="0.01" value={form.precio_promo} onChange={e => setForm({...form, precio_promo: e.target.value})} placeholder="2.49" required />
              </div>
              <div style={styles.campo}>
                <label style={styles.label}>Válido hasta</label>
                <input style={styles.input} type="date" value={form.fecha_fin} onChange={e => setForm({...form, fecha_fin: e.target.value})} required />
              </div>
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
            <button type="submit" style={styles.btnGuardar}>Crear promoción</button>
          </form>
        </div>
      )}

      {/* Tabla */}
      <div style={styles.card}>
        {cargando ? (
          <div style={styles.loading}>Cargando promociones...</div>
        ) : (
          <table style={styles.tabla}>
            <thead>
              <tr>
                <th style={styles.th}>Producto</th>
                <th style={styles.th}>Precio normal</th>
                <th style={styles.th}>Precio promo</th>
                <th style={styles.th}>Descuento</th>
                <th style={styles.th}>Válido hasta</th>
                <th style={styles.th}>Sucursal</th>
                <th style={styles.th}>Estado</th>
                <th style={styles.th}>Acción</th>
              </tr>
            </thead>
            <tbody>
              {promociones.map(promo => {
                const dias = getDiasRestantes(promo.fecha_fin);
                return (
                  <tr key={promo.id} style={styles.tr}>
                    <td style={styles.td}>
                      <div style={styles.promoNombre}>{promo.nombre}</div>
                      <div style={styles.promoMarca}>{promo.marca}</div>
                    </td>
                    <td style={styles.td}>${promo.precio_normal?.toFixed(2)}</td>
                    <td style={{ ...styles.td, fontWeight: 700, color: '#C8102E' }}>${promo.precio_promo?.toFixed(2)}</td>
                    <td style={styles.td}>
                      <span style={styles.pctPill}>−{promo.porcentaje_descuento}%</span>
                    </td>
                    <td style={styles.td}>
                      <div>{formatearFecha(promo.fecha_fin)}</div>
                      {dias !== null && (
                        <div style={{ fontSize: 11, color: dias <= 5 ? '#C8102E' : '#15803d', fontWeight: 600 }}>
                          {dias} días
                        </div>
                      )}
                    </td>
                    <td style={styles.td}>{promo.sucursales?.join(', ')}</td>
                    <td style={styles.td}>
                      <span style={{
                        ...styles.estadoPill,
                        background: promo.activo ? '#dcfce7' : '#f5f5f5',
                        color: promo.activo ? '#15803d' : '#6B6B6B',
                      }}>
                        {promo.activo ? 'Activa' : 'Inactiva'}
                      </span>
                    </td>
                    <td style={styles.td}>
                      <button
                        onClick={() => toggleActivo(promo)}
                        style={{
                          ...styles.btnToggle,
                          background: promo.activo ? '#fef2f4' : '#dcfce7',
                          color: promo.activo ? '#C8102E' : '#15803d',
                        }}
                      >
                        {promo.activo ? 'Desactivar' : 'Activar'}
                      </button>
                    </td>
                  </tr>
                );
              })}
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
  btnNueva: { padding: '10px 20px', background: '#C8102E', color: 'white', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: 'pointer' },
  formCard: { background: 'white', borderRadius: 14, padding: 24, marginBottom: 16, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' },
  formTitulo: { fontSize: 16, fontWeight: 700, color: '#0F0F0F', marginBottom: 16, marginTop: 0 },
  formGrid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginBottom: 16 },
  campo: {},
  label: { display: 'block', fontSize: 12, fontWeight: 600, color: '#6B6B6B', marginBottom: 5 },
  input: { width: '100%', padding: '9px 12px', fontSize: 14, borderRadius: 8, border: '1.5px solid rgba(0,0,0,0.1)', background: '#F5F3F0', boxSizing: 'border-box', outline: 'none' },
  btnGuardar: { padding: '11px 24px', background: '#C8102E', color: 'white', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: 'pointer' },
  card: { background: 'white', borderRadius: 14, overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' },
  loading: { textAlign: 'center', padding: 40, color: '#6B6B6B' },
  tabla: { width: '100%', borderCollapse: 'collapse' },
  th: { textAlign: 'left', padding: '10px 14px', fontSize: 11, fontWeight: 600, color: '#6B6B6B', background: '#F5F3F0', borderBottom: '1px solid rgba(0,0,0,0.08)', textTransform: 'uppercase', letterSpacing: '0.05em' },
  tr: { borderBottom: '1px solid rgba(0,0,0,0.06)' },
  td: { padding: '12px 14px', fontSize: 13, color: '#0F0F0F' },
  promoNombre: { fontSize: 13, fontWeight: 600 },
  promoMarca: { fontSize: 11, color: '#6B6B6B', marginTop: 2 },
  pctPill: { padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, background: '#fef2f4', color: '#C8102E' },
  estadoPill: { padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700 },
  btnToggle: { padding: '6px 14px', borderRadius: 8, border: 'none', fontSize: 12, fontWeight: 600, cursor: 'pointer' },
};

export default PromocionesPage;