import React, { useEffect, useState } from 'react';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../context/AuthContext';
import Layout from '../components/Layout';

const ConfiguracionPage = () => {
  const { usuario } = useAuth();
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [config, setConfig] = useState({
    puntos_por_peso: 1,
    niveles_visibles: true,
    progreso_visible: true,
    niveles: {
      bronce: { min: 0, nombre: 'Bronce' },
      oro: { min: 1000, nombre: 'Oro' },
      platino: { min: 5000, nombre: 'Platino' },
    },
    bonos: {
      bienvenida: { activo: true, puntos: 50 },
      primera_compra: { activo: true, puntos: 100, monto_minimo: 15 },
      cumpleanos: { activo: true, puntos: 150, vencimiento_dias: 30 },
    },
    referidos: {
      activo: true,
      puntos_referidor: 100,
      puntos_referido: 50,
      monto_minimo_primera_compra: 15,
    },
    vencimiento_puntos: {
      activo: false,
      dias_inactividad: 180,
    },
    modo_canje: 'cajero',
  });

  useEffect(() => {
    const cargar = async () => {
      try {
        const snap = await getDoc(doc(db, 'config', 'general'));
        if (snap.exists()) {
          setConfig(prev => ({ ...prev, ...snap.data() }));
        }
      } catch (e) {
        console.error(e);
      } finally {
        setCargando(false);
      }
    };
    cargar();
  }, []);

  const guardar = async () => {
    setGuardando(true);
    try {
      await setDoc(doc(db, 'config', 'general'), {
        ...config,
        actualizado_en: serverTimestamp(),
        actualizado_por: usuario?.uid,
      });
      alert('Configuración guardada correctamente');
    } catch (e) {
      alert('Error al guardar: ' + e.message);
    } finally {
      setGuardando(false);
    }
  };

  const updateConfig = (path, value) => {
    const keys = path.split('.');
    setConfig(prev => {
      const next = { ...prev };
      let obj = next;
      for (let i = 0; i < keys.length - 1; i++) {
        obj[keys[i]] = { ...obj[keys[i]] };
        obj = obj[keys[i]];
      }
      obj[keys[keys.length - 1]] = value;
      return next;
    });
  };

  if (cargando) return <Layout titulo="Configuración"><div style={styles.loading}>Cargando...</div></Layout>;

  return (
    <Layout titulo="Configuración">

      {/* Puntos */}
      <div style={styles.section}>
        <h2 style={styles.sectionTitulo}>💰 Puntos por compra</h2>
        <div style={styles.card}>
          <div style={styles.campo}>
            <label style={styles.label}>Puntos por cada $1 de compra</label>
            <input
              type="number"
              style={styles.inputSmall}
              value={config.puntos_por_peso}
              onChange={e => updateConfig('puntos_por_peso', parseFloat(e.target.value))}
            />
            <span style={styles.hint}>Actualmente: $1 = {config.puntos_por_peso} punto(s)</span>
          </div>
        </div>
      </div>

      {/* Niveles */}
      <div style={styles.section}>
        <h2 style={styles.sectionTitulo}>🏆 Niveles de lealtad</h2>
        <div style={styles.card}>
          <div style={styles.nivelesGrid}>
            {['bronce', 'oro', 'platino'].map(nivel => (
              <div key={nivel} style={styles.nivelCard}>
                <div style={styles.nivelEmoji}>
                  {nivel === 'bronce' ? '🥉' : nivel === 'oro' ? '⭐' : '💎'}
                </div>
                <div style={styles.campo}>
                  <label style={styles.label}>Nombre</label>
                  <input
                    style={styles.inputSmall}
                    value={config.niveles[nivel].nombre}
                    onChange={e => updateConfig(`niveles.${nivel}.nombre`, e.target.value)}
                  />
                </div>
                <div style={styles.campo}>
                  <label style={styles.label}>Puntos mínimos</label>
                  <input
                    type="number"
                    style={styles.inputSmall}
                    value={config.niveles[nivel].min}
                    onChange={e => updateConfig(`niveles.${nivel}.min`, parseInt(e.target.value))}
                    disabled={nivel === 'bronce'}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Visibilidad de niveles */}
      <div style={styles.section}>
        <h2 style={styles.sectionTitulo}>👁 Visibilidad de niveles para el cliente</h2>
        <div style={styles.card}>
          <p style={{ fontSize: 13, color: '#6B6B6B', marginTop: 0, marginBottom: 16 }}>
            Controla si los clientes pueden ver su nivel de lealtad en la app.
          </p>
          <div style={styles.bonoRow}>
            <div style={styles.bonoInfo}>
              <div style={styles.bonoTitulo}>Mostrar niveles al cliente</div>
              <div style={styles.bonoDesc}>El cliente puede ver si es Bronce, Oro o Platino en su perfil</div>
            </div>
            <div style={styles.bonoControls}>
              <label style={styles.toggleLabel}>
                <input
                  type="checkbox"
                  checked={config.niveles_visibles !== false}
                  onChange={e => updateConfig('niveles_visibles', e.target.checked)}
                />
                {config.niveles_visibles !== false ? 'Visible' : 'Oculto'}
              </label>
            </div>
          </div>
          <div style={styles.divider} />
          <div style={styles.bonoRow}>
            <div style={styles.bonoInfo}>
              <div style={styles.bonoTitulo}>Mostrar barra de progreso</div>
              <div style={styles.bonoDesc}>El cliente puede ver cuántos puntos le faltan para el siguiente nivel</div>
            </div>
            <div style={styles.bonoControls}>
              <label style={styles.toggleLabel}>
                <input
                  type="checkbox"
                  checked={config.progreso_visible !== false}
                  onChange={e => updateConfig('progreso_visible', e.target.checked)}
                />
                {config.progreso_visible !== false ? 'Visible' : 'Oculto'}
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* Bonos */}
      <div style={styles.section}>
        <h2 style={styles.sectionTitulo}>🎁 Bonos automáticos</h2>
        <div style={styles.card}>
          <div style={styles.bonoRow}>
            <div style={styles.bonoInfo}>
              <div style={styles.bonoTitulo}>🎉 Bono de bienvenida</div>
              <div style={styles.bonoDesc}>Se entrega al crear una cuenta nueva</div>
            </div>
            <div style={styles.bonoControls}>
              <label style={styles.toggleLabel}>
                <input type="checkbox" checked={config.bonos.bienvenida.activo} onChange={e => updateConfig('bonos.bienvenida.activo', e.target.checked)} />
                Activo
              </label>
              <div style={styles.campo}>
                <label style={styles.label}>Puntos</label>
                <input type="number" style={styles.inputSmall} value={config.bonos.bienvenida.puntos} onChange={e => updateConfig('bonos.bienvenida.puntos', parseInt(e.target.value))} />
              </div>
            </div>
          </div>

          <div style={styles.divider} />

          <div style={styles.bonoRow}>
            <div style={styles.bonoInfo}>
              <div style={styles.bonoTitulo}>🛒 Bono primera compra</div>
              <div style={styles.bonoDesc}>Se entrega una sola vez en la primera compra</div>
            </div>
            <div style={styles.bonoControls}>
              <label style={styles.toggleLabel}>
                <input type="checkbox" checked={config.bonos.primera_compra.activo} onChange={e => updateConfig('bonos.primera_compra.activo', e.target.checked)} />
                Activo
              </label>
              <div style={styles.campo}>
                <label style={styles.label}>Puntos</label>
                <input type="number" style={styles.inputSmall} value={config.bonos.primera_compra.puntos} onChange={e => updateConfig('bonos.primera_compra.puntos', parseInt(e.target.value))} />
              </div>
              <div style={styles.campo}>
                <label style={styles.label}>Compra mínima ($)</label>
                <input type="number" style={styles.inputSmall} value={config.bonos.primera_compra.monto_minimo} onChange={e => updateConfig('bonos.primera_compra.monto_minimo', parseFloat(e.target.value))} />
              </div>
            </div>
          </div>

          <div style={styles.divider} />

          <div style={styles.bonoRow}>
            <div style={styles.bonoInfo}>
              <div style={styles.bonoTitulo}>🎂 Bono de cumpleaños</div>
              <div style={styles.bonoDesc}>Se entrega el día del cumpleaños del cliente</div>
            </div>
            <div style={styles.bonoControls}>
              <label style={styles.toggleLabel}>
                <input type="checkbox" checked={config.bonos.cumpleanos.activo} onChange={e => updateConfig('bonos.cumpleanos.activo', e.target.checked)} />
                Activo
              </label>
              <div style={styles.campo}>
                <label style={styles.label}>Puntos</label>
                <input type="number" style={styles.inputSmall} value={config.bonos.cumpleanos.puntos} onChange={e => updateConfig('bonos.cumpleanos.puntos', parseInt(e.target.value))} />
              </div>
              <div style={styles.campo}>
                <label style={styles.label}>Vencimiento (días)</label>
                <input type="number" style={styles.inputSmall} value={config.bonos.cumpleanos.vencimiento_dias} onChange={e => updateConfig('bonos.cumpleanos.vencimiento_dias', parseInt(e.target.value))} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Referidos */}
      <div style={styles.section}>
        <h2 style={styles.sectionTitulo}>👥 Programa de referidos</h2>
        <div style={styles.card}>
          <div style={styles.bonoRow}>
            <div style={styles.bonoInfo}>
              <div style={styles.bonoTitulo}>Referidos activo</div>
              <div style={styles.bonoDesc}>Permite a los clientes ganar puntos refiriendo amigos</div>
            </div>
            <div style={styles.bonoControls}>
              <label style={styles.toggleLabel}>
                <input type="checkbox" checked={config.referidos.activo} onChange={e => updateConfig('referidos.activo', e.target.checked)} />
                Activo
              </label>
              <div style={styles.campo}>
                <label style={styles.label}>Pts para referidor</label>
                <input type="number" style={styles.inputSmall} value={config.referidos.puntos_referidor} onChange={e => updateConfig('referidos.puntos_referidor', parseInt(e.target.value))} />
              </div>
              <div style={styles.campo}>
                <label style={styles.label}>Pts para referido</label>
                <input type="number" style={styles.inputSmall} value={config.referidos.puntos_referido} onChange={e => updateConfig('referidos.puntos_referido', parseInt(e.target.value))} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Vencimiento */}
      <div style={styles.section}>
        <h2 style={styles.sectionTitulo}>⏰ Vencimiento de puntos</h2>
        <div style={styles.card}>
          <div style={styles.bonoRow}>
            <div style={styles.bonoInfo}>
              <div style={styles.bonoTitulo}>Vencimiento activo</div>
              <div style={styles.bonoDesc}>Los puntos vencen si el cliente no compra en X días</div>
            </div>
            <div style={styles.bonoControls}>
              <label style={styles.toggleLabel}>
                <input type="checkbox" checked={config.vencimiento_puntos.activo} onChange={e => updateConfig('vencimiento_puntos.activo', e.target.checked)} />
                Activo
              </label>
              {config.vencimiento_puntos.activo && (
                <div style={styles.campo}>
                  <label style={styles.label}>Días de inactividad</label>
                  <input type="number" style={styles.inputSmall} value={config.vencimiento_puntos.dias_inactividad} onChange={e => updateConfig('vencimiento_puntos.dias_inactividad', parseInt(e.target.value))} />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modo canje */}
      <div style={styles.section}>
        <h2 style={styles.sectionTitulo}>🎁 Modo de canje en caja</h2>
        <div style={styles.card}>
          <div style={styles.campo}>
            <label style={styles.label}>Modo de canje</label>
            <select style={styles.inputSmall} value={config.modo_canje} onChange={e => updateConfig('modo_canje', e.target.value)}>
              <option value="cajero">Cajero ejecuta directamente</option>
              <option value="cliente_confirma_cajero">Cliente selecciona y cajero confirma</option>
            </select>
          </div>
        </div>
      </div>

      <button onClick={guardar} disabled={guardando} style={styles.btnGuardar}>
        {guardando ? 'Guardando...' : 'Guardar configuración'}
      </button>

    </Layout>
  );
};

const styles = {
  loading: { textAlign: 'center', padding: 40, color: '#6B6B6B' },
  section: { marginBottom: 20 },
  sectionTitulo: { fontSize: 16, fontWeight: 700, color: '#0F0F0F', marginBottom: 10, marginTop: 0 },
  card: { background: 'white', borderRadius: 14, padding: 20, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' },
  nivelesGrid: { display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16 },
  nivelCard: { background: '#F5F3F0', borderRadius: 12, padding: 14 },
  nivelEmoji: { fontSize: 28, marginBottom: 10 },
  bonoRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 20 },
  bonoInfo: { flex: 1 },
  bonoTitulo: { fontSize: 14, fontWeight: 700, color: '#0F0F0F', marginBottom: 4 },
  bonoDesc: { fontSize: 12, color: '#6B6B6B' },
  bonoControls: { display: 'flex', gap: 14, alignItems: 'flex-end', flexWrap: 'wrap' },
  divider: { height: 1, background: 'rgba(0,0,0,0.06)', margin: '16px 0' },
  campo: {},
  label: { display: 'block', fontSize: 11, fontWeight: 600, color: '#6B6B6B', marginBottom: 4 },
  inputSmall: { padding: '8px 10px', fontSize: 14, borderRadius: 8, border: '1.5px solid rgba(0,0,0,0.1)', background: '#F5F3F0', outline: 'none', width: 100 },
  toggleLabel: { display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#0F0F0F', cursor: 'pointer' },
  hint: { fontSize: 11, color: '#6B6B6B', marginLeft: 8 },
  btnGuardar: { width: '100%', padding: 16, background: '#C8102E', color: 'white', border: 'none', borderRadius: 12, fontSize: 16, fontWeight: 700, cursor: 'pointer', marginTop: 8 },
};

export default ConfiguracionPage;