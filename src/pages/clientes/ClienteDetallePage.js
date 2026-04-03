import React, { useEffect, useState } from 'react';
import { doc, getDoc, collection, getDocs, query, where, orderBy } from 'firebase/firestore';
import { db } from '../../firebase';
import { COLECCIONES } from '../../constants';

const ClienteDetallePage = ({ clienteId, onCerrar }) => {
  const [cliente, setCliente] = useState(null);
  const [transacciones, setTransacciones] = useState([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    const cargar = async () => {
      try {
        const clienteSnap = await getDoc(doc(db, COLECCIONES.CLIENTES, clienteId));
        if (clienteSnap.exists()) setCliente({ id: clienteSnap.id, ...clienteSnap.data() });

        const q = query(
          collection(db, COLECCIONES.TRANSACCIONES),
          where('cliente_id', '==', clienteId),
          orderBy('creado_en', 'desc')
        );
        const transSnap = await getDocs(q);
        setTransacciones(transSnap.docs.map(d => ({ id: d.id, ...d.data() })));
      } catch (e) {
        console.error(e);
      } finally {
        setCargando(false);
      }
    };
    cargar();
  }, [clienteId]);

  const formatearFecha = (ts) => {
    if (!ts) return '—';
    const fecha = ts.toDate ? ts.toDate() : new Date(ts);
    return fecha.toLocaleDateString('es-CA', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const getNivelColor = (nivel) => {
    const colores = { bronce: '#cd7f32', oro: '#c89c20', platino: '#5b3f8a' };
    return colores[nivel] || '#6B6B6B';
  };

  const getNivelBg = (nivel) => {
    const bgs = { bronce: '#f5e6d3', oro: '#fef9e7', platino: '#ede8f5' };
    return bgs[nivel] || '#f5f5f5';
  };

  if (cargando) return (
    <div style={styles.overlay}>
      <div style={styles.modal}>
        <div style={styles.loading}>Cargando perfil...</div>
      </div>
    </div>
  );

  if (!cliente) return null;

  return (
    <div style={styles.overlay} onClick={onCerrar}>
      <div style={styles.modal} onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div style={styles.header}>
          <div style={styles.headerLeft}>
            <div style={styles.avatar}>
              {cliente.nombre?.charAt(0)}{cliente.apellido?.charAt(0)}
            </div>
            <div>
              <div style={styles.nombre}>{cliente.nombre} {cliente.apellido}</div>
              <div style={styles.codigo}>{cliente.codigo}</div>
              <span style={{
                ...styles.nivelPill,
                background: getNivelBg(cliente.nivel),
                color: getNivelColor(cliente.nivel),
              }}>
                {cliente.nivel?.charAt(0).toUpperCase() + cliente.nivel?.slice(1)}
              </span>
            </div>
          </div>
          <button onClick={onCerrar} style={styles.btnCerrar}>✕</button>
        </div>

        <div style={styles.body}>

          {/* Stats de puntos */}
          <div style={styles.statsGrid}>
            <div style={styles.statCard}>
              <div style={styles.statVal}>{(cliente.puntos_vigentes || 0).toLocaleString()}</div>
              <div style={styles.statLabel}>Puntos vigentes</div>
            </div>
            <div style={styles.statCard}>
              <div style={styles.statVal}>{(cliente.puntos_canjeados || 0).toLocaleString()}</div>
              <div style={styles.statLabel}>Puntos canjeados</div>
            </div>
            <div style={styles.statCard}>
              <div style={styles.statVal}>{(cliente.puntos_totales || 0).toLocaleString()}</div>
              <div style={styles.statLabel}>Puntos totales</div>
            </div>
            <div style={styles.statCard}>
              <div style={styles.statVal}>{cliente.total_visitas || 0}</div>
              <div style={styles.statLabel}>Visitas</div>
            </div>
          </div>

          {/* Datos del registro */}
          <div style={styles.seccion}>
            <div style={styles.seccionTitulo}>Datos del registro</div>
            <div style={styles.datosGrid}>
              <div style={styles.datoRow}>
                <span style={styles.datoLabel}>Email</span>
                <span style={styles.datoVal}>{cliente.email}</span>
              </div>
              <div style={styles.datoRow}>
                <span style={styles.datoLabel}>Teléfono</span>
                <span style={styles.datoVal}>{cliente.telefono}</span>
              </div>
              <div style={styles.datoRow}>
                <span style={styles.datoLabel}>Fecha nacimiento</span>
                <span style={styles.datoVal}>{cliente.fecha_nacimiento || '—'}</span>
              </div>
              <div style={styles.datoRow}>
                <span style={styles.datoLabel}>Sucursal registro</span>
                <span style={styles.datoVal}>{cliente.sucursal_registro || '—'}</span>
              </div>
              <div style={styles.datoRow}>
                <span style={styles.datoLabel}>Referido por</span>
                <span style={styles.datoVal}>{cliente.referido_por || '—'}</span>
              </div>
              <div style={styles.datoRow}>
                <span style={styles.datoLabel}>Registro</span>
                <span style={styles.datoVal}>{formatearFecha(cliente.creado_en)}</span>
              </div>
              <div style={styles.datoRow}>
                <span style={styles.datoLabel}>Última compra</span>
                <span style={styles.datoVal}>{formatearFecha(cliente.ultima_compra)}</span>
              </div>
              <div style={styles.datoRow}>
                <span style={styles.datoLabel}>Total comprado</span>
                <span style={styles.datoVal}>${(cliente.total_comprado || 0).toFixed(2)}</span>
              </div>
              <div style={styles.datoRow}>
                <span style={styles.datoLabel}>Sucursal favorita</span>
                <span style={styles.datoVal}>{cliente.sucursal_favorita || '—'}</span>
              </div>
            </div>
          </div>

          {/* Preferencias de comunicación */}
          <div style={styles.seccion}>
            <div style={styles.seccionTitulo}>Preferencias de comunicación</div>
            <div style={styles.datosGrid}>
              <div style={styles.datoRow}>
                <span style={styles.datoLabel}>📱 SMS</span>
                <span style={{
                  ...styles.datoVal,
                  color: cliente.acepta_sms !== false ? '#15803d' : '#C8102E',
                  fontWeight: 700,
                }}>
                  {cliente.acepta_sms !== false ? '✓ Activo' : '✗ No acepta'}
                </span>
              </div>
              <div style={styles.datoRow}>
                <span style={styles.datoLabel}>📧 Correo electrónico</span>
                <span style={{
                  ...styles.datoVal,
                  color: cliente.acepta_email_marketing !== false ? '#15803d' : '#C8102E',
                  fontWeight: 700,
                }}>
                  {cliente.acepta_email_marketing !== false ? '✓ Activo' : '✗ No acepta'}
                </span>
              </div>
              <div style={{ ...styles.datoRow, borderBottomWidth: 0 }}>
                <span style={styles.datoLabel}>🔔 Notificaciones push</span>
                <span style={{
                  ...styles.datoVal,
                  color: cliente.acepta_push !== false ? '#15803d' : '#C8102E',
                  fontWeight: 700,
                }}>
                  {cliente.acepta_push !== false ? '✓ Activo' : '✗ No acepta'}
                </span>
              </div>
            </div>
          </div>

          {/* Transacciones */}
          <div style={styles.seccion}>
            <div style={styles.seccionTitulo}>
              Transacciones ({transacciones.length})
            </div>
            {transacciones.length === 0 ? (
              <div style={styles.emptyTrans}>Sin transacciones registradas</div>
            ) : (
              <div style={styles.transList}>
                {transacciones.map(tx => (
                  <div key={tx.id} style={styles.txRow}>
                    <div style={{
                      ...styles.txIcon,
                      background: tx.puntos_cantidad > 0 ? '#dcfce7' : '#fef2f4',
                    }}>
                      {tx.tipo === 'compra' ? '🛒' : '🎁'}
                    </div>
                    <div style={styles.txInfo}>
                      <div style={styles.txTipo}>
                        {tx.tipo === 'compra' ? 'Compra en tienda' : `Canje — ${tx.premio_nombre}`}
                      </div>
                      <div style={styles.txFecha}>{formatearFecha(tx.creado_en)}</div>
                      {tx.monto_compra && <div style={styles.txMonto}>${tx.monto_compra.toFixed(2)}</div>}
                    </div>
                    <div style={{
                      ...styles.txPts,
                      color: tx.puntos_cantidad > 0 ? '#15803d' : '#C8102E',
                    }}>
                      {tx.puntos_cantidad > 0 ? '+' : ''}{tx.puntos_cantidad} pts
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
};

const styles = {
  overlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'flex-end', zIndex: 200 },
  modal: { background: 'white', width: 580, maxWidth: '95vw', height: '100vh', overflow: 'auto', display: 'flex', flexDirection: 'column' },
  loading: { textAlign: 'center', padding: 40, color: '#6B6B6B' },
  header: { background: '#C8102E', padding: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexShrink: 0 },
  headerLeft: { display: 'flex', gap: 14, alignItems: 'center' },
  avatar: { width: 56, height: 56, borderRadius: '50%', background: 'rgba(255,255,255,0.2)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 800, flexShrink: 0 },
  nombre: { color: 'white', fontSize: 18, fontWeight: 800, marginBottom: 2 },
  codigo: { color: 'rgba(255,255,255,0.75)', fontSize: 12, marginBottom: 6, fontFamily: 'monospace' },
  nivelPill: { padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700 },
  btnCerrar: { background: 'rgba(255,255,255,0.2)', border: 'none', color: 'white', width: 32, height: 32, borderRadius: '50%', cursor: 'pointer', fontSize: 14, fontWeight: 700 },
  body: { padding: 20, flex: 1 },
  statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10, marginBottom: 20 },
  statCard: { background: '#F5F3F0', borderRadius: 12, padding: 14, textAlign: 'center' },
  statVal: { fontSize: 22, fontWeight: 800, color: '#C8102E', marginBottom: 4 },
  statLabel: { fontSize: 11, color: '#6B6B6B' },
  seccion: { marginBottom: 20 },
  seccionTitulo: { fontSize: 13, fontWeight: 700, color: '#6B6B6B', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 10 },
  datosGrid: { background: '#F5F3F0', borderRadius: 12, overflow: 'hidden' },
  datoRow: { display: 'flex', justifyContent: 'space-between', padding: '10px 14px', borderBottom: '1px solid rgba(0,0,0,0.06)' },
  datoLabel: { fontSize: 13, color: '#6B6B6B' },
  datoVal: { fontSize: 13, color: '#0F0F0F', fontWeight: 500, flex: 1, textAlign: 'right' },
  emptyTrans: { textAlign: 'center', padding: 20, color: '#6B6B6B', fontSize: 13 },
  transList: { display: 'flex', flexDirection: 'column', gap: 8 },
  txRow: { display: 'flex', alignItems: 'center', gap: 12, background: '#F5F3F0', borderRadius: 10, padding: 12 },
  txIcon: { width: 36, height: 36, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0 },
  txInfo: { flex: 1 },
  txTipo: { fontSize: 13, fontWeight: 600, color: '#0F0F0F' },
  txFecha: { fontSize: 11, color: '#6B6B6B', marginTop: 2 },
  txMonto: { fontSize: 11, color: '#6B6B6B', marginTop: 1 },
  txPts: { fontSize: 14, fontWeight: 800, flexShrink: 0 },
};

export default ClienteDetallePage;