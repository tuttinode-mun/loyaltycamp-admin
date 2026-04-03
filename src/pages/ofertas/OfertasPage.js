import React, { useEffect, useState } from 'react';
import {
  collection, getDocs, query, orderBy,
  doc, updateDoc, addDoc, serverTimestamp, Timestamp
} from 'firebase/firestore';
import { db } from '../../firebase';
import Layout from '../../components/Layout';

const FORM_DEFAULT = {
  nombre: '',
  descripcion: '',
  multiplicador: 2,
  fecha_inicio: '',
  fecha_fin: '',
  hora_inicio: '',
  hora_fin: '',
  todos_los_dias: true,
  dias: {
    lunes: true, martes: true, miercoles: true,
    jueves: true, viernes: true, sabado: true, domingo: true,
  },
  sucursales: 'todas',
  niveles: ['bronce', 'oro', 'platino'],
};

const OfertasPage = () => {
  const [ofertas, setOfertas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [mostrarForm, setMostrarForm] = useState(false);
  const [editando, setEditando] = useState(null);
  const [form, setForm] = useState({ ...FORM_DEFAULT });

  useEffect(() => {
    cargarOfertas();
  }, []);

  const cargarOfertas = async () => {
    try {
      const q = query(collection(db, 'ofertas_puntos'), orderBy('fecha_inicio', 'desc'));
      const snap = await getDocs(q);
      setOfertas(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (e) {
      console.error(e);
    } finally {
      setCargando(false);
    }
  };

  const toggleActivo = async (oferta) => {
    try {
      await updateDoc(doc(db, 'ofertas_puntos', oferta.id), { activo: !oferta.activo });
      setOfertas(prev => prev.map(o => o.id === oferta.id ? { ...o, activo: !o.activo } : o));
    } catch (e) {
      console.error(e);
    }
  };

  const toggleNivel = (nivel) => {
    const niveles = form.niveles;
    if (niveles.includes(nivel)) {
      setForm({ ...form, niveles: niveles.filter(n => n !== nivel) });
    } else {
      setForm({ ...form, niveles: [...niveles, nivel] });
    }
  };

  const toggleDia = (dia) => {
    setForm({ ...form, dias: { ...form.dias, [dia]: !form.dias[dia] } });
  };

  const abrirEditar = (oferta) => {
    const fechaInicio = oferta.fecha_inicio?.toDate ? oferta.fecha_inicio.toDate() : new Date(oferta.fecha_inicio);
    const fechaFin = oferta.fecha_fin?.toDate ? oferta.fecha_fin.toDate() : new Date(oferta.fecha_fin);
    setForm({
      nombre: oferta.nombre || '',
      descripcion: oferta.descripcion || '',
      multiplicador: oferta.multiplicador || 2,
      fecha_inicio: fechaInicio.toISOString().slice(0, 10),
      fecha_fin: fechaFin.toISOString().slice(0, 10),
      hora_inicio: oferta.hora_inicio || '',
      hora_fin: oferta.hora_fin || '',
      todos_los_dias: oferta.todos_los_dias !== false,
      dias: oferta.dias || FORM_DEFAULT.dias,
      sucursales: oferta.sucursales?.[0] || 'todas',
      niveles: oferta.niveles || ['bronce', 'oro', 'platino'],
    });
    setEditando(oferta);
    setMostrarForm(true);
  };

  const cancelar = () => {
    setMostrarForm(false);
    setEditando(null);
    setForm({ ...FORM_DEFAULT });
  };

  const handleGuardar = async (e) => {
    e.preventDefault();
    if (!form.nombre || !form.fecha_inicio || !form.fecha_fin) {
      alert('Por favor completa los campos obligatorios');
      return;
    }
    if (form.niveles.length === 0) {
      alert('Selecciona al menos un nivel');
      return;
    }

    const datos = {
      nombre: form.nombre,
      descripcion: form.descripcion,
      multiplicador: parseFloat(form.multiplicador),
      fecha_inicio: Timestamp.fromDate(new Date(form.fecha_inicio)),
      fecha_fin: Timestamp.fromDate(new Date(form.fecha_fin)),
      hora_inicio: form.hora_inicio || null,
      hora_fin: form.hora_fin || null,
      todos_los_dias: form.todos_los_dias,
      dias: form.todos_los_dias ? FORM_DEFAULT.dias : form.dias,
      sucursales: [form.sucursales],
      niveles: form.niveles,
      activo: true,
    };

    try {
      if (editando) {
        await updateDoc(doc(db, 'ofertas_puntos', editando.id), datos);
        setOfertas(prev => prev.map(o => o.id === editando.id ? { ...o, ...datos } : o));
        alert('Oferta actualizada correctamente');
      } else {
        await addDoc(collection(db, 'ofertas_puntos'), {
          ...datos, creado_en: serverTimestamp(),
        });
        cargarOfertas();
        alert('Oferta creada correctamente');
      }
      cancelar();
    } catch (e) {
      console.error(e);
      alert('Error al guardar oferta');
    }
  };

  const formatearFecha = (ts) => {
    if (!ts) return '—';
    const fecha = ts.toDate ? ts.toDate() : new Date(ts);
    return fecha.toLocaleDateString('es-CA', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const DIAS_LABELS = {
    lunes: 'Lun', martes: 'Mar', miercoles: 'Mié',
    jueves: 'Jue', viernes: 'Vie', sabado: 'Sáb', domingo: 'Dom',
  };

  return (
    <Layout titulo="Ofertas de puntos">
      <div style={styles.toolbar}>
        <span style={styles.contador}>{ofertas.length} ofertas</span>
        {!mostrarForm && (
          <button onClick={() => setMostrarForm(true)} style={styles.btnNuevo}>+ Nueva oferta</button>
        )}
      </div>

      {mostrarForm && (
        <div style={styles.formCard}>
          <h3 style={styles.formTitulo}>{editando ? 'Editar oferta' : 'Nueva oferta de puntos'}</h3>
          <form onSubmit={handleGuardar}>
            <div style={styles.formGrid}>
              <div style={styles.campo}>
                <label style={styles.label}>Nombre de la oferta *</label>
                <input style={styles.input} value={form.nombre} onChange={e => setForm({...form, nombre: e.target.value})} placeholder="Doble puntos fin de semana" required />
              </div>
              <div style={styles.campo}>
                <label style={styles.label}>Descripción</label>
                <input style={styles.input} value={form.descripcion} onChange={e => setForm({...form, descripcion: e.target.value})} placeholder="Gana el doble de puntos en todas tus compras" />
              </div>
              <div style={styles.campo}>
                <label style={styles.label}>Multiplicador de puntos *</label>
                <select style={styles.input} value={form.multiplicador} onChange={e => setForm({...form, multiplicador: parseFloat(e.target.value)})}>
                  <option value={1.5}>×1.5 — 50% más puntos</option>
                  <option value={2}>×2 — Doble puntos</option>
                  <option value={3}>×3 — Triple puntos</option>
                  <option value={5}>×5 — 5x puntos</option>
                </select>
              </div>
              <div style={styles.campo}>
                <label style={styles.label}>Fecha inicio *</label>
                <input style={styles.input} type="date" value={form.fecha_inicio} onChange={e => setForm({...form, fecha_inicio: e.target.value})} required />
              </div>
              <div style={styles.campo}>
                <label style={styles.label}>Fecha fin *</label>
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

            {/* Horario */}
            <div style={styles.seccion}>
              <div style={styles.seccionTitulo}>Horario de la oferta</div>
              <div style={{ display: 'flex', gap: 14, marginBottom: 12 }}>
                <div style={styles.campo}>
                  <label style={styles.label}>Hora inicio (opcional)</label>
                  <input style={{ ...styles.input, width: 140 }} type="time" value={form.hora_inicio} onChange={e => setForm({...form, hora_inicio: e.target.value})} />
                </div>
                <div style={styles.campo}>
                  <label style={styles.label}>Hora fin (opcional)</label>
                  <input style={{ ...styles.input, width: 140 }} type="time" value={form.hora_fin} onChange={e => setForm({...form, hora_fin: e.target.value})} />
                </div>
              </div>
              <p style={{ fontSize: 12, color: '#6B6B6B', margin: '0 0 12px' }}>
                Si no defines horario la oferta aplica todo el día.
              </p>
            </div>

            {/* Días */}
            <div style={styles.seccion}>
              <div style={styles.seccionTitulo}>Días de la semana</div>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, marginBottom: 10, cursor: 'pointer' }}>
                <input type="checkbox" checked={form.todos_los_dias} onChange={e => setForm({...form, todos_los_dias: e.target.checked})} />
                Todos los días
              </label>
              {!form.todos_los_dias && (
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {Object.entries(DIAS_LABELS).map(([dia, label]) => (
                    <button key={dia} type="button" onClick={() => toggleDia(dia)}
                      style={{
                        ...styles.diaBtn,
                        background: form.dias[dia] ? '#C8102E' : '#F5F3F0',
                        color: form.dias[dia] ? 'white' : '#6B6B6B',
                      }}>
                      {label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Niveles */}
            <div style={styles.seccion}>
              <div style={styles.seccionTitulo}>Niveles habilitados</div>
              <div style={{ display: 'flex', gap: 8 }}>
                {['bronce', 'oro', 'platino'].map(nivel => (
                  <button key={nivel} type="button" onClick={() => toggleNivel(nivel)}
                    style={{
                      ...styles.nivelBtn,
                      background: form.niveles.includes(nivel) ? '#C8102E' : '#F5F3F0',
                      color: form.niveles.includes(nivel) ? 'white' : '#6B6B6B',
                    }}>
                    {nivel.charAt(0).toUpperCase() + nivel.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <button type="submit" style={styles.btnGuardar}>
                {editando ? 'Guardar cambios' : 'Crear oferta'}
              </button>
              <button type="button" onClick={cancelar} style={styles.btnCancelar}>Cancelar</button>
            </div>
          </form>
        </div>
      )}

      {/* Tabla */}
      <div style={styles.card}>
        {cargando ? (
          <div style={styles.loading}>Cargando ofertas...</div>
        ) : ofertas.length === 0 ? (
          <div style={styles.loading}>No hay ofertas creadas</div>
        ) : (
          <table style={styles.tabla}>
            <thead>
              <tr>
                <th style={styles.th}>Nombre</th>
                <th style={styles.th}>Multiplicador</th>
                <th style={styles.th}>Fechas</th>
                <th style={styles.th}>Horario</th>
                <th style={styles.th}>Días</th>
                <th style={styles.th}>Sucursal</th>
                <th style={styles.th}>Niveles</th>
                <th style={styles.th}>Estado</th>
                <th style={styles.th}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {ofertas.map(oferta => (
                <tr key={oferta.id} style={styles.tr}>
                  <td style={styles.td}>
                    <div style={{ fontWeight: 600 }}>{oferta.nombre}</div>
                    {oferta.descripcion && <div style={{ fontSize: 11, color: '#6B6B6B' }}>{oferta.descripcion}</div>}
                  </td>
                  <td style={styles.td}>
                    <span style={styles.multPill}>×{oferta.multiplicador}</span>
                  </td>
                  <td style={styles.td}>
                    <div style={{ fontSize: 12 }}>{formatearFecha(oferta.fecha_inicio)}</div>
                    <div style={{ fontSize: 12, color: '#6B6B6B' }}>→ {formatearFecha(oferta.fecha_fin)}</div>
                  </td>
                  <td style={styles.td}>
                    {oferta.hora_inicio && oferta.hora_fin
                      ? <span style={{ fontSize: 12 }}>{oferta.hora_inicio} - {oferta.hora_fin}</span>
                      : <span style={{ fontSize: 12, color: '#aaa' }}>Todo el día</span>
                    }
                  </td>
                  <td style={styles.td}>
                    {oferta.todos_los_dias
                      ? <span style={{ fontSize: 12 }}>Todos</span>
                      : <span style={{ fontSize: 12 }}>
                          {Object.entries(oferta.dias || {}).filter(([,v]) => v).map(([d]) => DIAS_LABELS[d]).join(', ')}
                        </span>
                    }
                  </td>
                  <td style={styles.td}>{oferta.sucursales?.join(', ')}</td>
                  <td style={styles.td}>
                    <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                      {oferta.niveles?.map(n => (
                        <span key={n} style={styles.nivelPill}>{n}</span>
                      ))}
                    </div>
                  </td>
                  <td style={styles.td}>
                    <span style={{
                      ...styles.estadoPill,
                      background: oferta.activo ? '#dcfce7' : '#f5f5f5',
                      color: oferta.activo ? '#15803d' : '#6B6B6B',
                    }}>
                      {oferta.activo ? 'Activa' : 'Inactiva'}
                    </span>
                  </td>
                  <td style={styles.td}>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button onClick={() => abrirEditar(oferta)} style={styles.btnEditar}>Editar</button>
                      <button
                        onClick={() => toggleActivo(oferta)}
                        style={{
                          ...styles.btnToggle,
                          background: oferta.activo ? '#fef2f4' : '#dcfce7',
                          color: oferta.activo ? '#C8102E' : '#15803d',
                        }}
                      >
                        {oferta.activo ? 'Desactivar' : 'Activar'}
                      </button>
                    </div>
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
  formGrid: { display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14, marginBottom: 16 },
  campo: { marginBottom: 12 },
  label: { display: 'block', fontSize: 12, fontWeight: 600, color: '#6B6B6B', marginBottom: 5 },
  input: { width: '100%', padding: '9px 12px', fontSize: 14, borderRadius: 8, border: '1.5px solid rgba(0,0,0,0.1)', background: '#F5F3F0', boxSizing: 'border-box', outline: 'none' },
  seccion: { marginBottom: 16 },
  seccionTitulo: { fontSize: 13, fontWeight: 700, color: '#0F0F0F', marginBottom: 8 },
  diaBtn: { padding: '8px 12px', borderRadius: 8, border: 'none', fontSize: 12, fontWeight: 600, cursor: 'pointer' },
  nivelBtn: { padding: '8px 16px', borderRadius: 8, border: 'none', fontSize: 13, fontWeight: 600, cursor: 'pointer' },
  btnGuardar: { padding: '11px 24px', background: '#C8102E', color: 'white', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: 'pointer' },
  btnCancelar: { padding: '11px 24px', background: '#F5F3F0', color: '#6B6B6B', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: 'pointer' },
  card: { background: 'white', borderRadius: 14, overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' },
  loading: { textAlign: 'center', padding: 40, color: '#6B6B6B' },
  tabla: { width: '100%', borderCollapse: 'collapse' },
  th: { textAlign: 'left', padding: '10px 14px', fontSize: 11, fontWeight: 600, color: '#6B6B6B', background: '#F5F3F0', borderBottom: '1px solid rgba(0,0,0,0.08)', textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' },
  tr: { borderBottom: '1px solid rgba(0,0,0,0.06)' },
  td: { padding: '12px 14px', fontSize: 13, color: '#0F0F0F', verticalAlign: 'middle' },
  multPill: { padding: '4px 12px', borderRadius: 20, fontSize: 13, fontWeight: 800, background: '#fef9e7', color: '#c89c20' },
  nivelPill: { padding: '2px 8px', borderRadius: 20, fontSize: 10, fontWeight: 600, background: '#F5F3F0', color: '#6B6B6B' },
  estadoPill: { padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700 },
  btnEditar: { padding: '6px 12px', background: '#eff6ff', color: '#3b82f6', border: 'none', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer' },
  btnToggle: { padding: '6px 12px', borderRadius: 8, border: 'none', fontSize: 12, fontWeight: 600, cursor: 'pointer' },
};

export default OfertasPage;