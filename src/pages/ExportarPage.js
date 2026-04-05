import React, { useState } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { COLECCIONES } from '../constants';
import Layout from '../components/Layout';

const ExportarPage = () => {
  const [cargando, setCargando] = useState(false);
  const [filtros, setFiltros] = useState({
    nivel: '',
    puntos_min: '',
    puntos_max: '',
    fecha_registro_desde: '',
    fecha_registro_hasta: '',
    fecha_compra_desde: '',
    fecha_compra_hasta: '',
    sucursal: '',
    con_canjes: false,
    sin_compras: false,
  });
  const [preview, setPreview] = useState(null);

  const updateFiltro = (key, value) => {
    setFiltros(prev => ({ ...prev, [key]: value }));
    setPreview(null);
  };

  const filtrosActivos = Object.entries(filtros).filter(([k, v]) => {
    if (typeof v === 'boolean') return v;
    return v !== '' && v !== null;
  });

  const formatearTimestamp = (ts) => {
    if (!ts) return '';
    const fecha = ts.toDate ? ts.toDate() : new Date(ts);
    return fecha.toLocaleDateString('es-CA');
  };

  const aplicarFiltros = (clientes) => {
    return clientes.filter(c => {
      // Nivel
      if (filtros.nivel && c.nivel !== filtros.nivel) return false;

      // Puntos mínimos
      if (filtros.puntos_min && (c.puntos_vigentes || 0) < parseInt(filtros.puntos_min)) return false;

      // Puntos máximos
      if (filtros.puntos_max && (c.puntos_vigentes || 0) > parseInt(filtros.puntos_max)) return false;

      // Sucursal
      if (filtros.sucursal && c.sucursal_favorita !== filtros.sucursal && c.sucursal_registro !== filtros.sucursal) return false;

      // Sin compras
      if (filtros.sin_compras && (c.total_visitas || 0) > 0) return false;

      // Con canjes
      if (filtros.con_canjes && (c.puntos_canjeados || 0) === 0) return false;

      // Fecha registro desde
      if (filtros.fecha_registro_desde && c.creado_en) {
        const fecha = c.creado_en.toDate ? c.creado_en.toDate() : new Date(c.creado_en);
        if (fecha < new Date(filtros.fecha_registro_desde)) return false;
      }

      // Fecha registro hasta
      if (filtros.fecha_registro_hasta && c.creado_en) {
        const fecha = c.creado_en.toDate ? c.creado_en.toDate() : new Date(c.creado_en);
        if (fecha > new Date(filtros.fecha_registro_hasta)) return false;
      }

      // Fecha última compra desde
      if (filtros.fecha_compra_desde && c.ultima_compra) {
        const fecha = c.ultima_compra.toDate ? c.ultima_compra.toDate() : new Date(c.ultima_compra);
        if (fecha < new Date(filtros.fecha_compra_desde)) return false;
      }

      // Fecha última compra hasta
      if (filtros.fecha_compra_hasta && c.ultima_compra) {
        const fecha = c.ultima_compra.toDate ? c.ultima_compra.toDate() : new Date(c.ultima_compra);
        if (fecha > new Date(filtros.fecha_compra_hasta)) return false;
      }

      return true;
    });
  };

  const cargarYFiltrar = async () => {
    setCargando(true);
    try {
      const snap = await getDocs(collection(db, COLECCIONES.CLIENTES));
      const todos = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      return aplicarFiltros(todos);
    } finally {
      setCargando(false);
    }
  };

  const handlePreview = async () => {
    const resultado = await cargarYFiltrar();
    setPreview(resultado);
  };

  const exportarCSV = (datos, nombreArchivo) => {
    if (datos.length === 0) {
      alert('No hay datos para exportar con los filtros seleccionados');
      return;
    }
    const headers = Object.keys(datos[0]);
    const csv = [
      headers.join(','),
      ...datos.map(row =>
        headers.map(h => {
          const val = row[h];
          if (val === null || val === undefined) return '';
          if (typeof val === 'object') return JSON.stringify(val).replace(/,/g, ';');
          return String(val).replace(/,/g, ';');
        }).join(',')
      )
    ].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${nombreArchivo}_${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportar = async () => {
    const resultado = await cargarYFiltrar();
    const datos = resultado.map(c => ({
      codigo: c.codigo,
      nombre: c.nombre,
      apellido: c.apellido,
      email: c.email,
      telefono: c.telefono,
      nivel: c.nivel,
      puntos_vigentes: c.puntos_vigentes || 0,
      puntos_totales: c.puntos_totales || 0,
      puntos_canjeados: c.puntos_canjeados || 0,
      total_comprado: c.total_comprado || 0,
      total_visitas: c.total_visitas || 0,
      sucursal_favorita: c.sucursal_favorita || '',
      creado_en: formatearTimestamp(c.creado_en),
      ultima_compra: formatearTimestamp(c.ultima_compra),
    }));
    exportarCSV(datos, 'clientes_filtrado');
  };

  const limpiarFiltros = () => {
    setFiltros({
      nivel: '', puntos_min: '', puntos_max: '',
      fecha_registro_desde: '', fecha_registro_hasta: '',
      fecha_compra_desde: '', fecha_compra_hasta: '',
      sucursal: '', con_canjes: false, sin_compras: false,
    });
    setPreview(null);
  };

  return (
    <Layout titulo="Exportar datos">

      {/* Filtros */}
      <div style={styles.card}>
        <div style={styles.cardHeader}>
          <h3 style={styles.cardTitulo}>🔍 Filtros de exportación</h3>
          <div style={styles.filtrosActivos}>
            {filtrosActivos.length > 0 && (
              <>
                <span style={styles.filtrosCount}>{filtrosActivos.length} filtro(s) activo(s)</span>
                <button onClick={limpiarFiltros} style={styles.btnLimpiar}>Limpiar todo</button>
              </>
            )}
          </div>
        </div>

        <div style={styles.filtrosGrid}>

          {/* Nivel */}
          <div style={styles.campo}>
            <label style={styles.label}>Nivel de lealtad</label>
            <select style={styles.input} value={filtros.nivel} onChange={e => updateFiltro('nivel', e.target.value)}>
              <option value="">Todos los niveles</option>
              <option value="bronce">Bronce</option>
              <option value="oro">Oro</option>
              <option value="platino">Platino</option>
            </select>
          </div>

          {/* Sucursal */}
          <div style={styles.campo}>
            <label style={styles.label}>Sucursal favorita</label>
            <select style={styles.input} value={filtros.sucursal} onChange={e => updateFiltro('sucursal', e.target.value)}>
              <option value="">Todas las sucursales</option>
              <option value="st-hubert">St-Hubert</option>
              <option value="st-laurent">St-Laurent</option>
              <option value="brossard">Brossard</option>
            </select>
          </div>

          {/* Puntos min */}
          <div style={styles.campo}>
            <label style={styles.label}>Puntos vigentes mínimos</label>
            <input
              type="number"
              style={styles.input}
              placeholder="Ej: 500"
              value={filtros.puntos_min}
              onChange={e => updateFiltro('puntos_min', e.target.value)}
            />
          </div>

          {/* Puntos max */}
          <div style={styles.campo}>
            <label style={styles.label}>Puntos vigentes máximos</label>
            <input
              type="number"
              style={styles.input}
              placeholder="Ej: 5000"
              value={filtros.puntos_max}
              onChange={e => updateFiltro('puntos_max', e.target.value)}
            />
          </div>

          {/* Fecha registro desde */}
          <div style={styles.campo}>
            <label style={styles.label}>Registro desde</label>
            <input
              type="date"
              style={styles.input}
              value={filtros.fecha_registro_desde}
              onChange={e => updateFiltro('fecha_registro_desde', e.target.value)}
            />
          </div>

          {/* Fecha registro hasta */}
          <div style={styles.campo}>
            <label style={styles.label}>Registro hasta</label>
            <input
              type="date"
              style={styles.input}
              value={filtros.fecha_registro_hasta}
              onChange={e => updateFiltro('fecha_registro_hasta', e.target.value)}
            />
          </div>

          {/* Última compra desde */}
          <div style={styles.campo}>
            <label style={styles.label}>Última compra desde</label>
            <input
              type="date"
              style={styles.input}
              value={filtros.fecha_compra_desde}
              onChange={e => updateFiltro('fecha_compra_desde', e.target.value)}
            />
          </div>

          {/* Última compra hasta */}
          <div style={styles.campo}>
            <label style={styles.label}>Última compra hasta</label>
            <input
              type="date"
              style={styles.input}
              value={filtros.fecha_compra_hasta}
              onChange={e => updateFiltro('fecha_compra_hasta', e.target.value)}
            />
          </div>

        </div>

        {/* Filtros booleanos */}
        <div style={styles.booleanos}>
          <label style={styles.checkLabel}>
            <input
              type="checkbox"
              checked={filtros.con_canjes}
              onChange={e => updateFiltro('con_canjes', e.target.checked)}
            />
            Solo clientes que han canjeado puntos
          </label>
          <label style={styles.checkLabel}>
            <input
              type="checkbox"
              checked={filtros.sin_compras}
              onChange={e => updateFiltro('sin_compras', e.target.checked)}
            />
            Solo clientes sin compras (registrados pero no han comprado)
          </label>
        </div>

        {/* Filtros activos como pills */}
        {filtrosActivos.length > 0 && (
          <div style={styles.pillsRow}>
            {filtros.nivel && <span style={styles.pill}>Nivel: {filtros.nivel}</span>}
            {filtros.sucursal && <span style={styles.pill}>Sucursal: {filtros.sucursal}</span>}
            {filtros.puntos_min && <span style={styles.pill}>Pts ≥ {filtros.puntos_min}</span>}
            {filtros.puntos_max && <span style={styles.pill}>Pts ≤ {filtros.puntos_max}</span>}
            {filtros.fecha_registro_desde && <span style={styles.pill}>Registro desde: {filtros.fecha_registro_desde}</span>}
            {filtros.fecha_registro_hasta && <span style={styles.pill}>Registro hasta: {filtros.fecha_registro_hasta}</span>}
            {filtros.fecha_compra_desde && <span style={styles.pill}>Compra desde: {filtros.fecha_compra_desde}</span>}
            {filtros.fecha_compra_hasta && <span style={styles.pill}>Compra hasta: {filtros.fecha_compra_hasta}</span>}
            {filtros.con_canjes && <span style={styles.pill}>Con canjes</span>}
            {filtros.sin_compras && <span style={styles.pill}>Sin compras</span>}
          </div>
        )}

        {/* Acciones */}
        <div style={styles.acciones}>
          <button onClick={handlePreview} disabled={cargando} style={styles.btnPreview}>
            {cargando ? 'Cargando...' : '👁 Ver preview'}
          </button>
          <button onClick={handleExportar} disabled={cargando} style={styles.btnExportar}>
            {cargando ? 'Exportando...' : '↓ Exportar CSV'}
          </button>
        </div>
      </div>

      {/* Preview */}
      {preview && (
        <div style={styles.previewCard}>
          <div style={styles.previewHeader}>
            <span style={styles.previewTitulo}>Vista previa</span>
            <span style={styles.previewCount}>{preview.length} registros encontrados</span>
          </div>
          <div style={styles.tableWrap}>
            <table style={styles.tabla}>
              <thead>
                <tr>
                  <th style={styles.th}>Código</th>
                  <th style={styles.th}>Nombre</th>
                  <th style={styles.th}>Email</th>
                  <th style={styles.th}>Nivel</th>
                  <th style={styles.th}>Pts vigentes</th>
                  <th style={styles.th}>Visitas</th>
                  <th style={styles.th}>Última compra</th>
                </tr>
              </thead>
              <tbody>
                {preview.slice(0, 10).map(c => (
                  <tr key={c.id} style={styles.tr}>
                    <td style={styles.td}><span style={styles.codigo}>{c.codigo}</span></td>
                    <td style={styles.td}>{c.nombre} {c.apellido}</td>
                    <td style={styles.td}>{c.email}</td>
                    <td style={styles.td}>{c.nivel}</td>
                    <td style={{ ...styles.td, fontWeight: 700 }}>{(c.puntos_vigentes || 0).toLocaleString()}</td>
                    <td style={styles.td}>{c.total_visitas || 0}</td>
                    <td style={styles.td}>{formatearTimestamp(c.ultima_compra)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {preview.length > 10 && (
            <div style={styles.previewMas}>
              Mostrando 10 de {preview.length} registros · El CSV incluirá todos
            </div>
          )}
        </div>
      )}

    </Layout>
  );
};

const styles = {
  card: { background: 'white', borderRadius: 14, padding: 20, boxShadow: '0 2px 8px rgba(0,0,0,0.06)', marginBottom: 16 },
  cardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  cardTitulo: { fontSize: 16, fontWeight: 700, color: '#0F0F0F', margin: 0 },
  filtrosActivos: { display: 'flex', alignItems: 'center', gap: 10 },
  filtrosCount: { fontSize: 12, color: '#C8102E', fontWeight: 600 },
  btnLimpiar: { padding: '5px 12px', background: '#fef2f4', color: '#C8102E', border: 'none', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer' },
  filtrosGrid: { display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 14 },
  campo: {},
  label: { display: 'block', fontSize: 11, fontWeight: 600, color: '#6B6B6B', marginBottom: 4 },
  input: { width: '100%', padding: '8px 10px', fontSize: 13, borderRadius: 8, border: '1.5px solid rgba(0,0,0,0.1)', background: '#F5F3F0', boxSizing: 'border-box', outline: 'none' },
  booleanos: { display: 'flex', gap: 20, marginBottom: 14 },
  checkLabel: { display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#0F0F0F', cursor: 'pointer' },
  pillsRow: { display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 14 },
  pill: { background: '#C8102E', color: 'white', fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 20 },
  acciones: { display: 'flex', gap: 10 },
  btnPreview: { padding: '10px 20px', background: '#F5F3F0', color: '#0F0F0F', border: '1px solid rgba(0,0,0,0.1)', borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: 'pointer' },
  btnExportar: { padding: '10px 20px', background: '#C8102E', color: 'white', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: 'pointer' },
  previewCard: { background: 'white', borderRadius: 14, overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' },
  previewHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', background: '#F5F3F0', borderBottom: '1px solid rgba(0,0,0,0.08)' },
  previewTitulo: { fontSize: 13, fontWeight: 700, color: '#0F0F0F' },
  previewCount: { fontSize: 13, color: '#C8102E', fontWeight: 600 },
  tableWrap: { overflowX: 'auto' },
  tabla: { width: '100%', borderCollapse: 'collapse' },
  th: { textAlign: 'left', padding: '8px 12px', fontSize: 11, fontWeight: 600, color: '#6B6B6B', background: '#F5F3F0', borderBottom: '1px solid rgba(0,0,0,0.08)', textTransform: 'uppercase', letterSpacing: '0.04em', whiteSpace: 'nowrap' },
  tr: { borderBottom: '1px solid rgba(0,0,0,0.06)' },
  td: { padding: '10px 12px', fontSize: 12, color: '#0F0F0F', whiteSpace: 'nowrap' },
  codigo: { fontFamily: 'monospace', fontSize: 11, background: '#F5F3F0', padding: '2px 6px', borderRadius: 4 },
  previewMas: { padding: '10px 16px', fontSize: 12, color: '#6B6B6B', textAlign: 'center', background: '#F5F3F0' },
};

export default ExportarPage;