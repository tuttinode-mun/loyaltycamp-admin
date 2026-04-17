import React, { useEffect, useState } from 'react';
import {
  collection, getDocs, query, orderBy, where,
  doc, updateDoc, setDoc, serverTimestamp
} from 'firebase/firestore';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth, db } from '../../firebase';
import { COLECCIONES } from '../../constants';
import Layout from '../../components/Layout';
import { useAuth } from '../../context/AuthContext';

const PERMISOS_LISTA = [
  { key: 'sumar_puntos', label: 'Sumar puntos', desc: 'Registrar compras y sumar puntos al cliente' },
  { key: 'ver_canjes', label: 'Ver canjes', desc: 'Ver los premios disponibles del cliente' },
  { key: 'ejecutar_canjes', label: 'Ejecutar canjes', desc: 'Procesar canjes de premios' },
  { key: 'editar_cliente', label: 'Editar cliente', desc: 'Modificar datos del perfil del cliente' },
  { key: 'ajuste_manual', label: 'Ajuste manual de puntos', desc: 'Agregar o quitar puntos manualmente' },
  { key: 'ver_historial', label: 'Ver historial', desc: 'Ver transacciones anteriores' },
];

const PERMISOS_DEFAULT = {
  sumar_puntos: true, ver_canjes: true, ejecutar_canjes: true,
  editar_cliente: false, ajuste_manual: false, ver_historial: true,
};

const CajerosPage = () => {
  const { tenantId, usuario } = useAuth();
  const [cajeros, setCajeros] = useState([]);
  const [sucursales, setSucursales] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [mostrarForm, setMostrarForm] = useState(false);
  const [creando, setCreando] = useState(false);
  const [editandoPermisos, setEditandoPermisos] = useState(null);
  const [editandoPin, setEditandoPin] = useState(null);
  const [nuevoPin, setNuevoPin] = useState('');
  const [form, setForm] = useState({
    nombre: '', apellido: '', email: '', password: '', pin: '',
    sucursal_id: '',
    permisos: { ...PERMISOS_DEFAULT },
  });

  useEffect(() => {
    if (!tenantId) return;
    cargarCajeros();
    cargarSucursales();
  }, [tenantId]);

  const cargarCajeros = async () => {
    try {
      const q = query(
        collection(db, COLECCIONES.CAJEROS),
        where('tenant_id', '==', tenantId),
        orderBy('creado_en', 'desc')
      );
      const snap = await getDocs(q);
      setCajeros(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (e) {
      console.error(e);
    } finally {
      setCargando(false);
    }
  };

  const cargarSucursales = async () => {
    try {
      const q = query(collection(db, COLECCIONES.SUCURSALES), where('tenant_id', '==', tenantId));
      const snap = await getDocs(q);
      setSucursales(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (e) {
      console.error(e);
    }
  };

  const toggleActivo = async (cajero) => {
    try {
      await updateDoc(doc(db, COLECCIONES.CAJEROS, cajero.id), { activo: !cajero.activo });
      setCajeros(prev => prev.map(c => c.id === cajero.id ? { ...c, activo: !c.activo } : c));
    } catch (e) {
      console.error(e);
    }
  };

  const guardarPermisos = async (cajeroId, permisos) => {
    try {
      await updateDoc(doc(db, COLECCIONES.CAJEROS, cajeroId), { permisos });
      setCajeros(prev => prev.map(c => c.id === cajeroId ? { ...c, permisos } : c));
      setEditandoPermisos(null);
    } catch (e) {
      console.error(e);
    }
  };

  const guardarPin = async () => {
    if (!nuevoPin || nuevoPin.length < 4) {
      alert('El PIN debe tener al menos 4 dígitos');
      return;
    }
    try {
      await updateDoc(doc(db, COLECCIONES.CAJEROS, editandoPin.id), { pin: nuevoPin });
      setCajeros(prev => prev.map(c => c.id === editandoPin.id ? { ...c, pin: nuevoPin } : c));
      setEditandoPin(null);
      setNuevoPin('');
      alert('PIN actualizado correctamente');
    } catch (e) {
      console.error(e);
      alert('Error al actualizar PIN');
    }
  };

  const handleCrear = async (e) => {
    e.preventDefault();
    if (!form.pin || form.pin.length < 4) {
      alert('El PIN debe tener al menos 4 dígitos');
      return;
    }
    setCreando(true);
    try {
      const credencial = await createUserWithEmailAndPassword(auth, form.email, form.password);
      const uid = credencial.user.uid;

      await setDoc(doc(db, 'usuarios_roles', uid), {
        uid, rol: 'cajero', tenant_id: tenantId, creado_en: serverTimestamp(),
      });

      await setDoc(doc(db, COLECCIONES.CAJEROS, uid), {
        uid, tenant_id: tenantId,
        email: form.email,
        nombre: form.nombre,
        apellido: form.apellido,
        sucursal_id: form.sucursal_id,
        pin: form.pin,
        permisos: form.permisos,
        activo: true,
        ultimo_acceso: null,
        creado_en: serverTimestamp(),
        creado_por: usuario?.uid,
      });

      setMostrarForm(false);
      setForm({ nombre: '', apellido: '', email: '', password: '', pin: '', sucursal_id: '', permisos: { ...PERMISOS_DEFAULT } });
      cargarCajeros();
      alert(`✅ Cajero creado.\n\nCredenciales:\nEmail: ${form.email}\nContraseña: ${form.password}\nPIN: ${form.pin}`);
    } catch (e) {
      alert('Error: ' + e.message);
    } finally {
      setCreando(false);
    }
  };

  return (
    <Layout titulo="Cajeros">
      <div style={styles.toolbar}>
        <span style={styles.contador}>{cajeros.length} cajeros</span>
        <button onClick={() => setMostrarForm(!mostrarForm)} style={styles.btnNuevo}>
          {mostrarForm ? 'Cancelar' : '+ Nuevo cajero'}
        </button>
      </div>

      {mostrarForm && (
        <div style={styles.formCard}>
          <h3 style={styles.formTitulo}>Crear nuevo cajero</h3>
          <form onSubmit={handleCrear}>
            <div style={styles.formGrid}>
              <div style={styles.campo}>
                <label style={styles.label}>Nombre</label>
                <input style={styles.input} value={form.nombre} onChange={e => setForm({...form, nombre: e.target.value})} placeholder="Juan" required />
              </div>
              <div style={styles.campo}>
                <label style={styles.label}>Apellido</label>
                <input style={styles.input} value={form.apellido} onChange={e => setForm({...form, apellido: e.target.value})} placeholder="Pérez" required />
              </div>
              <div style={styles.campo}>
                <label style={styles.label}>Correo</label>
                <input style={styles.input} type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} placeholder="cajero@empresa.com" required />
              </div>
              <div style={styles.campo}>
                <label style={styles.label}>Contraseña</label>
                <input style={styles.input} type="password" value={form.password} onChange={e => setForm({...form, password: e.target.value})} placeholder="Mínimo 6 caracteres" required />
              </div>
              <div style={styles.campo}>
                <label style={styles.label}>PIN (4-6 dígitos)</label>
                <input
                  style={styles.input}
                  type="text"
                  value={form.pin}
                  onChange={e => setForm({...form, pin: e.target.value.replace(/\D/g, '').slice(0, 6)})}
                  placeholder="1234"
                  maxLength={6}
                  required
                />
              </div>
              <div style={styles.campo}>
                <label style={styles.label}>Sucursal</label>
                <select style={styles.input} value={form.sucursal_id} onChange={e => setForm({...form, sucursal_id: e.target.value})}>
                  <option value="">Seleccionar sucursal</option>
                  {sucursales.map(s => (
                    <option key={s.id} value={s.nombre || s.id}>{s.nombre_completo || s.nombre}</option>
                  ))}
                </select>
              </div>
            </div>

            <div style={styles.permisosSection}>
              <div style={styles.permisosTitulo}>Permisos del cajero</div>
              <div style={styles.permisosGrid}>
                {PERMISOS_LISTA.map(p => (
                  <label key={p.key} style={styles.permisoItem}>
                    <input
                      type="checkbox"
                      checked={form.permisos[p.key]}
                      onChange={e => setForm({ ...form, permisos: { ...form.permisos, [p.key]: e.target.checked } })}
                      style={styles.checkbox}
                    />
                    <div>
                      <div style={styles.permisoLabel}>{p.label}</div>
                      <div style={styles.permisoDesc}>{p.desc}</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <button type="submit" style={styles.btnGuardar} disabled={creando}>
              {creando ? 'Creando...' : 'Crear cajero'}
            </button>
          </form>
        </div>
      )}

      {/* Modal editar permisos */}
      {editandoPermisos && (
        <div style={styles.modalOverlay} onClick={() => setEditandoPermisos(null)}>
          <div style={styles.modal} onClick={e => e.stopPropagation()}>
            <h3 style={styles.modalTitulo}>
              Editar permisos — {editandoPermisos.nombre} {editandoPermisos.apellido}
            </h3>
            <div style={styles.permisosGrid}>
              {PERMISOS_LISTA.map(p => (
                <label key={p.key} style={styles.permisoItem}>
                  <input
                    type="checkbox"
                    checked={editandoPermisos.permisos?.[p.key] || false}
                    onChange={e => setEditandoPermisos({
                      ...editandoPermisos,
                      permisos: { ...editandoPermisos.permisos, [p.key]: e.target.checked }
                    })}
                    style={styles.checkbox}
                  />
                  <div>
                    <div style={styles.permisoLabel}>{p.label}</div>
                    <div style={styles.permisoDesc}>{p.desc}</div>
                  </div>
                </label>
              ))}
            </div>
            <div style={styles.modalBtns}>
              <button onClick={() => setEditandoPermisos(null)} style={styles.btnCancelar}>Cancelar</button>
              <button onClick={() => guardarPermisos(editandoPermisos.id, editandoPermisos.permisos)} style={styles.btnGuardar}>
                Guardar permisos
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal editar PIN */}
      {editandoPin && (
        <div style={styles.modalOverlay} onClick={() => { setEditandoPin(null); setNuevoPin(''); }}>
          <div style={styles.modal} onClick={e => e.stopPropagation()}>
            <h3 style={styles.modalTitulo}>
              Cambiar PIN — {editandoPin.nombre} {editandoPin.apellido}
            </h3>
            <p style={{ fontSize: 13, color: '#6B6B6B', marginBottom: 16 }}>
              PIN actual: {editandoPin.pin ? '****' : 'No asignado'}
            </p>
            <div style={styles.campo}>
              <label style={styles.label}>Nuevo PIN (4-6 dígitos)</label>
              <input
                style={{ ...styles.input, width: 150, fontSize: 24, textAlign: 'center', letterSpacing: 8 }}
                type="text"
                value={nuevoPin}
                onChange={e => setNuevoPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="1234"
                maxLength={6}
                autoFocus
              />
            </div>
            <div style={styles.modalBtns}>
              <button onClick={() => { setEditandoPin(null); setNuevoPin(''); }} style={styles.btnCancelar}>Cancelar</button>
              <button onClick={guardarPin} style={styles.btnGuardar}>Guardar PIN</button>
            </div>
          </div>
        </div>
      )}

      <div style={styles.card}>
        {cargando ? (
          <div style={styles.loading}>Cargando cajeros...</div>
        ) : cajeros.length === 0 ? (
          <div style={styles.loading}>No hay cajeros registrados</div>
        ) : (
          <table style={styles.tabla}>
            <thead>
              <tr>
                <th style={styles.th}>Cajero</th>
                <th style={styles.th}>Correo</th>
                <th style={styles.th}>Sucursal</th>
                <th style={styles.th}>PIN</th>
                <th style={styles.th}>Permisos activos</th>
                <th style={styles.th}>Estado</th>
                <th style={styles.th}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {cajeros.map(cajero => (
                <tr key={cajero.id} style={styles.tr}>
                  <td style={styles.td}>
                    <div style={styles.cajeroCell}>
                      <div style={styles.avatar}>
                        {cajero.nombre?.charAt(0)}{cajero.apellido?.charAt(0)}
                      </div>
                      <div style={styles.cajeroNombre}>{cajero.nombre} {cajero.apellido}</div>
                    </div>
                  </td>
                  <td style={styles.td}>{cajero.email}</td>
                  <td style={styles.td}>{cajero.sucursal_id}</td>
                  <td style={styles.td}>
                    {cajero.pin
                      ? <span style={styles.pinPill}>✓ Asignado</span>
                      : <span style={{ color: '#C8102E', fontSize: 12 }}>Sin PIN</span>
                    }
                  </td>
                  <td style={styles.td}>
                    <div style={styles.permisosWrap}>
                      {PERMISOS_LISTA.filter(p => cajero.permisos?.[p.key]).map(p => (
                        <span key={p.key} style={styles.permisoPill}>{p.label}</span>
                      ))}
                    </div>
                  </td>
                  <td style={styles.td}>
                    <span style={{
                      ...styles.estadoPill,
                      background: cajero.activo ? '#dcfce7' : '#f5f5f5',
                      color: cajero.activo ? '#15803d' : '#6B6B6B',
                    }}>
                      {cajero.activo ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td style={styles.td}>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      <button onClick={() => setEditandoPermisos({ ...cajero })} style={styles.btnEditar}>Permisos</button>
                      <button onClick={() => { setEditandoPin(cajero); setNuevoPin(''); }} style={{ ...styles.btnEditar, background: '#fef9e7', color: '#c89c20' }}>PIN</button>
                      <button
                        onClick={() => toggleActivo(cajero)}
                        style={{
                          ...styles.btnToggle,
                          background: cajero.activo ? '#fef2f4' : '#dcfce7',
                          color: cajero.activo ? '#C8102E' : '#15803d',
                        }}
                      >
                        {cajero.activo ? 'Desactivar' : 'Activar'}
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
  permisosSection: { background: '#F5F3F0', borderRadius: 12, padding: 16, marginBottom: 16 },
  permisosTitulo: { fontSize: 13, fontWeight: 700, color: '#0F0F0F', marginBottom: 12 },
  permisosGrid: { display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 10 },
  permisoItem: { display: 'flex', alignItems: 'flex-start', gap: 10, cursor: 'pointer', background: 'white', borderRadius: 10, padding: 12 },
  checkbox: { marginTop: 2, width: 16, height: 16, accentColor: '#C8102E', flexShrink: 0 },
  permisoLabel: { fontSize: 13, fontWeight: 600, color: '#0F0F0F' },
  permisoDesc: { fontSize: 11, color: '#6B6B6B', marginTop: 2 },
  btnGuardar: { padding: '11px 24px', background: '#C8102E', color: 'white', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: 'pointer' },
  btnCancelar: { padding: '11px 24px', background: '#F5F3F0', color: '#6B6B6B', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: 'pointer' },
  modalOverlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 100 },
  modal: { background: 'white', borderRadius: 16, padding: 28, width: 560, maxWidth: '90vw' },
  modalTitulo: { fontSize: 16, fontWeight: 700, color: '#0F0F0F', marginBottom: 16, marginTop: 0 },
  modalBtns: { display: 'flex', gap: 10, marginTop: 16, justifyContent: 'flex-end' },
  card: { background: 'white', borderRadius: 14, overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' },
  loading: { textAlign: 'center', padding: 40, color: '#6B6B6B' },
  tabla: { width: '100%', borderCollapse: 'collapse' },
  th: { textAlign: 'left', padding: '10px 14px', fontSize: 11, fontWeight: 600, color: '#6B6B6B', background: '#F5F3F0', borderBottom: '1px solid rgba(0,0,0,0.08)', textTransform: 'uppercase', letterSpacing: '0.05em' },
  tr: { borderBottom: '1px solid rgba(0,0,0,0.06)' },
  td: { padding: '12px 14px', fontSize: 13, color: '#0F0F0F', verticalAlign: 'middle' },
  cajeroCell: { display: 'flex', alignItems: 'center', gap: 10 },
  avatar: { width: 36, height: 36, borderRadius: '50%', background: '#9e0a22', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 800, flexShrink: 0 },
  cajeroNombre: { fontSize: 13, fontWeight: 600 },
  pinPill: { padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, background: '#dcfce7', color: '#15803d' },
  permisosWrap: { display: 'flex', flexWrap: 'wrap', gap: 4 },
  permisoPill: { padding: '2px 8px', borderRadius: 20, fontSize: 10, fontWeight: 600, background: '#F5F3F0', color: '#6B6B6B' },
  estadoPill: { padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700 },
  btnEditar: { padding: '6px 12px', background: '#eff6ff', color: '#3b82f6', border: 'none', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer' },
  btnToggle: { padding: '6px 12px', borderRadius: 8, border: 'none', fontSize: 12, fontWeight: 600, cursor: 'pointer' },
};

export default CajerosPage;