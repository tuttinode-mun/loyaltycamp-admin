import React, { useEffect, useState } from 'react';
import {
  collection, getDocs, query, orderBy, where,
  doc, updateDoc, addDoc, serverTimestamp
} from 'firebase/firestore';
import { db } from '../../firebase';
import { COLECCIONES } from '../../constants';
import Layout from '../../components/Layout';
import { useAuth } from '../../context/AuthContext';

const FORM_DEFAULT = {
  nombre: '', nombre_completo: '', direccion: '',
  telefono: '', es_principal: false,
};

const SucursalesPage = () => {
  const { tenantId } = useAuth();
  const [sucursales, setSucursales] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [mostrarForm, setMostrarForm] = useState(false);
  const [editando, setEditando] = useState(null);
  const [form, setForm] = useState({ ...FORM_DEFAULT });

  // eslint-disable-next-line react-hooks/exhaustive-deps
    useEffect(() => {
    if (!tenantId) return;
    cargarSucursales();
  }, [tenantId]);

  const cargarSucursales = async () => {
    try {
      const q = query(
        collection(db, COLECCIONES.SUCURSALES),
        where('tenant_id', '==', tenantId),
        orderBy('nombre', 'asc')
      );
      const snap = await getDocs(q);
      setSucursales(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (e) {
      console.error(e);
    } finally {
      setCargando(false);
    }
  };

  const toggleActivo = async (sucursal) => {
    try {
      await updateDoc(doc(db, COLECCIONES.SUCURSALES, sucursal.id), { activo: !sucursal.activo });
      setSucursales(prev => prev.map(s => s.id === sucursal.id ? { ...s, activo: !s.activo } : s));
    } catch (e) {
      console.error(e);
    }
  };

  const abrirEditar = (sucursal) => {
    setForm({
      nombre: sucursal.nombre || '',
      nombre_completo: sucursal.nombre_completo || '',
      direccion: sucursal.direccion || '',
      telefono: sucursal.telefono || '',
      es_principal: sucursal.es_principal || false,
    });
    setEditando(sucursal);
    setMostrarForm(true);
  };

  const cancelar = () => {
    setMostrarForm(false);
    setEditando(null);
    setForm({ ...FORM_DEFAULT });
  };

  const handleGuardar = async (e) => {
    e.preventDefault();
    const datos = {
      tenant_id: tenantId,
      nombre: form.nombre,
      nombre_completo: form.nombre_completo || form.nombre,
      direccion: form.direccion,
      telefono: form.telefono,
      es_principal: form.es_principal,
    };

    try {
      if (editando) {
        await updateDoc(doc(db, COLECCIONES.SUCURSALES, editando.id), datos);
        setSucursales(prev => prev.map(s => s.id === editando.id ? { ...s, ...datos } : s));
        alert('Sucursal actualizada correctamente');
      } else {
        await addDoc(collection(db, COLECCIONES.SUCURSALES), {
          ...datos,
          horario: {
            lunes:     { abre: '09:00', cierra: '19:00', cerrado: false },
            martes:    { abre: '09:00', cierra: '19:00', cerrado: false },
            miercoles: { abre: '09:00', cierra: '19:00', cerrado: false },
            jueves:    { abre: '09:00', cierra: '21:00', cerrado: false },
            viernes:   { abre: '09:00', cierra: '21:00', cerrado: false },
            sabado:    { abre: '09:00', cierra: '19:00', cerrado: false },
            domingo:   { abre: '09:00', cierra: '19:00', cerrado: false },
          },
          activo: true,
          creado_en: serverTimestamp(),
        });
        cargarSucursales();
        alert('Sucursal creada correctamente');
      }
      cancelar();
    } catch (e) {
      console.error(e);
      alert('Error al guardar sucursal');
    }
  };

  return (
    <Layout titulo="Sucursales">
      <div style={styles.toolbar}>
        <span style={styles.contador}>{sucursales.length} sucursales</span>
        {!mostrarForm && (
          <button onClick={() => setMostrarForm(true)} style={styles.btnNuevo}>+ Nueva sucursal</button>
        )}
      </div>

      {mostrarForm && (
        <div style={styles.formCard}>
          <h3 style={styles.formTitulo}>{editando ? 'Editar sucursal' : 'Nueva sucursal'}</h3>
          <form onSubmit={handleGuardar}>
            <div style={styles.formGrid}>
              <div style={styles.campo}>
                <label style={styles.label}>Nombre corto</label>
                <input style={styles.input} value={form.nombre} onChange={e => setForm({...form, nombre: e.target.value})} placeholder="St-Hubert" required />
              </div>
              <div style={styles.campo}>
                <label style={styles.label}>Nombre completo</label>
                <input style={styles.input} value={form.nombre_completo} onChange={e => setForm({...form, nombre_completo: e.target.value})} placeholder="St-Hubert (principal)" />
              </div>
              <div style={styles.campo}>
                <label style={styles.label}>Dirección</label>
                <input style={styles.input} value={form.direccion} onChange={e => setForm({...form, direccion: e.target.value})} placeholder="6955 Rue St-Hubert, Montréal" required />
              </div>
              <div style={styles.campo}>
                <label style={styles.label}>Teléfono</label>
                <input style={styles.input} value={form.telefono} onChange={e => setForm({...form, telefono: e.target.value})} placeholder="(514) 277-4130" />
              </div>
              <div style={styles.campo}>
                <label style={styles.label}>
                  <input type="checkbox" checked={form.es_principal} onChange={e => setForm({...form, es_principal: e.target.checked})} style={{ marginRight: 8 }} />
                  Es sucursal principal
                </label>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button type="submit" style={styles.btnGuardar}>
                {editando ? 'Guardar cambios' : 'Crear sucursal'}
              </button>
              <button type="button" onClick={cancelar} style={styles.btnCancelar}>Cancelar</button>
            </div>
          </form>
        </div>
      )}

      {cargando ? (
        <div style={styles.loading}>Cargando sucursales...</div>
      ) : sucursales.length === 0 ? (
        <div style={styles.emptyCard}>
          <div style={styles.emptyEmoji}>🏪</div>
          <div style={styles.emptyTitulo}>No hay sucursales registradas</div>
        </div>
      ) : (
        <div style={styles.sucursalesGrid}>
          {sucursales.map(suc => (
            <div key={suc.id} style={styles.sucCard}>
              <div style={styles.sucHeader}>
                <div style={styles.sucIcon}>🏪</div>
                <div style={styles.sucInfo}>
                  <div style={styles.sucNombre}>
                    {suc.nombre_completo || suc.nombre}
                    {suc.es_principal && <span style={styles.principalBadge}>Principal</span>}
                  </div>
                  <div style={styles.sucDir}>{suc.direccion}</div>
                </div>
                <span style={{
                  ...styles.estadoPill,
                  background: suc.activo ? '#dcfce7' : '#f5f5f5',
                  color: suc.activo ? '#15803d' : '#6B6B6B',
                }}>
                  {suc.activo ? 'Activa' : 'Inactiva'}
                </span>
              </div>

              {suc.telefono && (
                <div style={styles.sucDetalle}>
                  <span style={styles.sucDetalleLabel}>📞 Teléfono</span>
                  <span>{suc.telefono}</span>
                </div>
              )}

              {suc.horario && (
                <div style={styles.horarioWrap}>
                  <div style={styles.horarioTitulo}>Horario</div>
                  <div style={styles.horarioGrid}>
                    {Object.entries(suc.horario).map(([dia, h]) => (
                      <div key={dia} style={styles.horarioDia}>
                        <span style={styles.diaLabel}>{dia.charAt(0).toUpperCase() + dia.slice(1, 3)}</span>
                        <span style={styles.diaHoras}>
                          {h.cerrado ? 'Cerrado' : `${h.abre} - ${h.cierra}`}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div style={styles.sucBtns}>
                <button onClick={() => abrirEditar(suc)} style={styles.btnEditar}>Editar</button>
                <button
                  onClick={() => toggleActivo(suc)}
                  style={{
                    ...styles.btnToggle,
                    background: suc.activo ? '#fef2f4' : '#dcfce7',
                    color: suc.activo ? '#C8102E' : '#15803d',
                  }}
                >
                  {suc.activo ? 'Desactivar' : 'Activar'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
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
  btnGuardar: { padding: '11px 24px', background: '#C8102E', color: 'white', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: 'pointer' },
  btnCancelar: { padding: '11px 24px', background: '#F5F3F0', color: '#6B6B6B', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: 'pointer' },
  loading: { textAlign: 'center', padding: 40, color: '#6B6B6B' },
  emptyCard: { background: 'white', borderRadius: 14, padding: 60, textAlign: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' },
  emptyEmoji: { fontSize: 48, marginBottom: 12 },
  emptyTitulo: { fontSize: 16, fontWeight: 700, color: '#0F0F0F' },
  sucursalesGrid: { display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16 },
  sucCard: { background: 'white', borderRadius: 14, padding: 18, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' },
  sucHeader: { display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 12 },
  sucIcon: { fontSize: 28, flexShrink: 0 },
  sucInfo: { flex: 1 },
  sucNombre: { fontSize: 14, fontWeight: 700, color: '#0F0F0F', display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' },
  sucDir: { fontSize: 11, color: '#6B6B6B', marginTop: 3 },
  principalBadge: { background: '#fef9e7', color: '#c89c20', fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 20 },
  estadoPill: { padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, flexShrink: 0 },
  sucDetalle: { display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#0F0F0F', marginBottom: 10 },
  sucDetalleLabel: { color: '#6B6B6B' },
  horarioWrap: { background: '#F5F3F0', borderRadius: 10, padding: 10, marginBottom: 12 },
  horarioTitulo: { fontSize: 11, fontWeight: 700, color: '#6B6B6B', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 },
  horarioGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4 },
  horarioDia: { display: 'flex', justifyContent: 'space-between', fontSize: 11 },
  diaLabel: { color: '#6B6B6B', fontWeight: 600 },
  diaHoras: { color: '#0F0F0F' },
  sucBtns: { display: 'flex', gap: 8 },
  btnEditar: { flex: 1, padding: '8px', background: '#eff6ff', color: '#3b82f6', border: 'none', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer' },
  btnToggle: { flex: 1, padding: '8px', borderRadius: 8, border: 'none', fontSize: 12, fontWeight: 600, cursor: 'pointer' },
};

export default SucursalesPage;