import React, { useEffect, useState } from 'react';
import {
  collection, getDocs, query, orderBy,
  doc, updateDoc, setDoc, serverTimestamp
} from 'firebase/firestore';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth, db } from '../../firebase';
import { COLECCIONES } from '../../constants';
import Layout from '../../components/Layout';

const CajerosPage = () => {
  const [cajeros, setCajeros] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [mostrarForm, setMostrarForm] = useState(false);
  const [creando, setCreando] = useState(false);
  const [form, setForm] = useState({
    nombre: '',
    apellido: '',
    email: '',
    password: '',
    sucursal_id: 'st-hubert',
  });

  useEffect(() => {
    cargarCajeros();
  }, []);

  const cargarCajeros = async () => {
    try {
      const q = query(collection(db, COLECCIONES.CAJEROS), orderBy('creado_en', 'desc'));
      const snap = await getDocs(q);
      setCajeros(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (e) {
      console.error(e);
    } finally {
      setCargando(false);
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

  const handleCrear = async (e) => {
    e.preventDefault();
    setCreando(true);
    try {
      // Crear usuario en Firebase Auth
      const credencial = await createUserWithEmailAndPassword(auth, form.email, form.password);
      const uid = credencial.user.uid;

      // Crear rol
      await setDoc(doc(db, 'usuarios_roles', uid), {
        uid,
        rol: 'cajero',
        creado_en: serverTimestamp(),
      });

      // Crear perfil cajero
      await setDoc(doc(db, COLECCIONES.CAJEROS, uid), {
        uid,
        email: form.email,
        nombre: form.nombre,
        apellido: form.apellido,
        sucursal_id: form.sucursal_id,
        permisos: {
          sumar_puntos: true,
          ver_canjes: true,
          ejecutar_canjes: true,
          editar_cliente: false,
          ajuste_manual: false,
          ver_historial: true,
        },
        activo: true,
        ultimo_acceso: null,
        creado_en: serverTimestamp(),
        creado_por: auth.currentUser?.uid,
      });

      setMostrarForm(false);
      setForm({ nombre: '', apellido: '', email: '', password: '', sucursal_id: 'st-hubert' });
      cargarCajeros();
      alert('Cajero creado exitosamente');
    } catch (e) {
      console.error(e);
      alert('Error al crear cajero: ' + e.message);
    } finally {
      setCreando(false);
    }
  };

  const getSucursalLabel = (id) => {
    const sucursales = { 'st-hubert': 'St-Hubert', 'st-laurent': 'St-Laurent', 'brossard': 'Brossard' };
    return sucursales[id] || id;
  };

  return (
    <Layout titulo="Cajeros">
      <div style={styles.toolbar}>
        <span style={styles.contador}>{cajeros.length} cajeros</span>
        <button onClick={() => setMostrarForm(!mostrarForm)} style={styles.btnNuevo}>
          {mostrarForm ? 'Cancelar' : '+ Nuevo cajero'}
        </button>
      </div>

      {/* Formulario */}
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
                <label style={styles.label}>Correo electrónico</label>
                <input style={styles.input} type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} placeholder="cajero.juan@loyaltycamp.com" required />
              </div>
              <div style={styles.campo}>
                <label style={styles.label}>Contraseña</label>
                <input style={styles.input} type="password" value={form.password} onChange={e => setForm({...form, password: e.target.value})} placeholder="Mínimo 6 caracteres" required />
              </div>
              <div style={styles.campo}>
                <label style={styles.label}>Sucursal</label>
                <select style={styles.input} value={form.sucursal_id} onChange={e => setForm({...form, sucursal_id: e.target.value})}>
                  <option value="st-hubert">St-Hubert</option>
                  <option value="st-laurent">St-Laurent</option>
                  <option value="brossard">Brossard</option>
                </select>
              </div>
            </div>
            <button type="submit" style={styles.btnGuardar} disabled={creando}>
              {creando ? 'Creando...' : 'Crear cajero'}
            </button>
          </form>
        </div>
      )}

      {/* Tabla */}
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
                <th style={styles.th}>Permisos</th>
                <th style={styles.th}>Estado</th>
                <th style={styles.th}>Acción</th>
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
                      <div>
                        <div style={styles.cajeroNombre}>{cajero.nombre} {cajero.apellido}</div>
                      </div>
                    </div>
                  </td>
                  <td style={styles.td}>{cajero.email}</td>
                  <td style={styles.td}>{getSucursalLabel(cajero.sucursal_id)}</td>
                  <td style={styles.td}>
                    <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                      {cajero.permisos?.sumar_puntos && <span style={styles.permisoPill}>Sumar pts</span>}
                      {cajero.permisos?.ejecutar_canjes && <span style={styles.permisoPill}>Canjes</span>}
                      {cajero.permisos?.ver_historial && <span style={styles.permisoPill}>Historial</span>}
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
  btnGuardar: { padding: '11px 24px', background: '#C8102E', color: 'white', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: 'pointer' },
  card: { background: 'white', borderRadius: 14, overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' },
  loading: { textAlign: 'center', padding: 40, color: '#6B6B6B' },
  tabla: { width: '100%', borderCollapse: 'collapse' },
  th: { textAlign: 'left', padding: '10px 14px', fontSize: 11, fontWeight: 600, color: '#6B6B6B', background: '#F5F3F0', borderBottom: '1px solid rgba(0,0,0,0.08)', textTransform: 'uppercase', letterSpacing: '0.05em' },
  tr: { borderBottom: '1px solid rgba(0,0,0,0.06)' },
  td: { padding: '12px 14px', fontSize: 13, color: '#0F0F0F' },
  cajeroCell: { display: 'flex', alignItems: 'center', gap: 10 },
  avatar: { width: 36, height: 36, borderRadius: '50%', background: '#9e0a22', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 800, flexShrink: 0 },
  cajeroNombre: { fontSize: 13, fontWeight: 600, color: '#0F0F0F' },
  permisoPill: { padding: '2px 8px', borderRadius: 20, fontSize: 10, fontWeight: 600, background: '#F5F3F0', color: '#6B6B6B' },
  estadoPill: { padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700 },
  btnToggle: { padding: '6px 14px', borderRadius: 8, border: 'none', fontSize: 12, fontWeight: 600, cursor: 'pointer' },
};

export default CajerosPage;