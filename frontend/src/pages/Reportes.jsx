import React, { useEffect, useState } from 'react';
import AppLayout from '../components/Layout/AppLayout';
import StatCard from '../components/UI/StatCard';
import api from '../api/axios';
import { exportarExcel } from '../utils/exportarExcel';

function formatearMoneda(valor) {
  return new Intl.NumberFormat('es-GT', { style: 'currency', currency: 'GTQ' }).format(valor || 0);
}

const TABS = [
  { id: 'ventas', label: 'Reporte de ventas' },
  { id: 'inventario', label: 'Reporte de inventario' },
  { id: 'top', label: 'Productos más vendidos' },
];

function BotonExportar({ onClick, disabled }) {
  return (
    <button className="btn btn-secondary" onClick={onClick} disabled={disabled}>
      ⬇ Exportar a Excel
    </button>
  );
}

export default function Reportes() {
  const [tab, setTab] = useState('ventas');
  const [desde, setDesde] = useState('');
  const [hasta, setHasta] = useState('');
  const [reporteVentas, setReporteVentas] = useState(null);
  const [reporteInventario, setReporteInventario] = useState(null);
  const [topProductos, setTopProductos] = useState([]);
  const [cargando, setCargando] = useState(true);

  function cargarVentas() {
    setCargando(true);
    api.get('/reportes/ventas', { params: { desde: desde || undefined, hasta: hasta || undefined } })
      .then((res) => setReporteVentas(res.data))
      .finally(() => setCargando(false));
  }

  function cargarInventario() {
    setCargando(true);
    api.get('/reportes/inventario').then((res) => setReporteInventario(res.data)).finally(() => setCargando(false));
  }

  function cargarTop() {
    setCargando(true);
    api.get('/reportes/productos-mas-vendidos').then((res) => setTopProductos(res.data)).finally(() => setCargando(false));
  }

  useEffect(() => {
    if (tab === 'ventas') cargarVentas();
    if (tab === 'inventario') cargarInventario();
    if (tab === 'top') cargarTop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  function exportarVentas() {
    exportarExcel('reporte_ventas', [
      { titulo: 'Fecha', valor: (d) => new Date(d.Fecha).toLocaleDateString('es-GT', { timeZone: 'UTC' }), formato: 'texto' },
      { titulo: 'Cantidad de ventas', valor: (d) => d.CantidadVentas, formato: 'entero' },
      { titulo: 'Monto del día (Q)', valor: (d) => Number(d.MontoDia), formato: 'moneda' },
    ], reporteVentas.porDia, { nombreHoja: 'Ventas', titulo: 'Reporte de ventas' })
      .catch(() => setMensaje({ tipo: 'error', texto: 'No se pudo generar el archivo de Excel.' }));
  }

  function exportarInventario() {
    exportarExcel('reporte_inventario', [
      { titulo: 'Código', valor: (p) => p.Codigo, formato: 'texto' },
      { titulo: 'Producto', valor: (p) => p.Nombre, formato: 'texto' },
      { titulo: 'Categoría', valor: (p) => p.Categoria || '', formato: 'texto' },
      { titulo: 'Talla', valor: (p) => p.Talla || '', formato: 'texto' },
      { titulo: 'Stock actual', valor: (p) => p.StockActual, formato: 'entero' },
      { titulo: 'Stock mínimo', valor: (p) => p.StockMinimo, formato: 'entero' },
      { titulo: 'Costo unitario (Q)', valor: (p) => Number(p.PrecioCosto), formato: 'moneda' },
      { titulo: 'Valor en costo (Q)', valor: (p) => Number(p.ValorInventarioCosto), formato: 'moneda' },
    ], reporteInventario.productos, { nombreHoja: 'Inventario', titulo: 'Reporte de inventario' })
      .catch(() => setMensaje({ tipo: 'error', texto: 'No se pudo generar el archivo de Excel.' }));
  }

  function exportarTop() {
    exportarExcel('productos_mas_vendidos', [
      { titulo: 'Código', valor: (p) => p.Codigo, formato: 'texto' },
      { titulo: 'Producto', valor: (p) => p.Nombre, formato: 'texto' },
      { titulo: 'Unidades vendidas', valor: (p) => p.UnidadesVendidas, formato: 'entero' },
      { titulo: 'Total vendido (Q)', valor: (p) => Number(p.TotalVendido), formato: 'moneda' },
    ], topProductos, { nombreHoja: 'Top productos', titulo: 'Productos más vendidos' })
      .catch(() => setMensaje({ tipo: 'error', texto: 'No se pudo generar el archivo de Excel.' }));
  }

  return (
    <AppLayout title="Reportes" subtitle="Ventas, inventario y desempeño de productos para apoyar la toma de decisiones">
      <div style={{ display: 'flex', gap: 8, marginBottom: 20, borderBottom: '1px solid var(--border)' }}>
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            style={{
              background: 'none', border: 'none', padding: '10px 4px', marginRight: 20,
              fontWeight: 600, fontSize: 14,
              color: tab === t.id ? 'var(--saddle)' : 'var(--espresso-soft)',
              borderBottom: tab === t.id ? '2px solid var(--saddle)' : '2px solid transparent',
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {cargando && <div className="empty-state"><div className="spinner" style={{ margin: '0 auto' }} /></div>}

      {!cargando && tab === 'ventas' && reporteVentas && (
        <>
          <div className="card" style={{ padding: 16, marginBottom: 18, display: 'flex', gap: 12, alignItems: 'flex-end', flexWrap: 'wrap', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end', flexWrap: 'wrap' }}>
              <div className="form-field" style={{ marginBottom: 0 }}>
                <label>Desde</label>
                <input type="date" value={desde} onChange={(e) => setDesde(e.target.value)} />
              </div>
              <div className="form-field" style={{ marginBottom: 0 }}>
                <label>Hasta</label>
                <input type="date" value={hasta} onChange={(e) => setHasta(e.target.value)} />
              </div>
              <button className="btn btn-primary" onClick={cargarVentas}>Filtrar</button>
            </div>
            <BotonExportar onClick={exportarVentas} disabled={reporteVentas.porDia.length === 0} />
          </div>

          <div style={{ display: 'flex', gap: 16, marginBottom: 20, flexWrap: 'wrap' }}>
            <StatCard label="Total de ventas" value={reporteVentas.resumen.TotalVentas} />
            <StatCard label="Monto total" value={formatearMoneda(reporteVentas.resumen.MontoTotal)} />
            <StatCard label="Ticket promedio" value={formatearMoneda(reporteVentas.resumen.TicketPromedio)} />
          </div>

          <div className="card" style={{ overflowX: 'auto' }}>
            {reporteVentas.porDia.length === 0 ? (
              <div className="empty-state">No hay ventas en el período seleccionado.</div>
            ) : (
              <table>
                <thead><tr><th>Fecha</th><th>Cantidad de ventas</th><th>Monto del día</th></tr></thead>
                <tbody>
                  {reporteVentas.porDia.map((d) => (
                    <tr key={d.Fecha}>
                      <td>{new Date(d.Fecha).toLocaleDateString('es-GT', { dateStyle: 'long', timeZone: 'UTC' })}</td>
                      <td>{d.CantidadVentas}</td>
                      <td>{formatearMoneda(d.MontoDia)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}

      {!cargando && tab === 'inventario' && reporteInventario && (
        <>
          <div style={{ marginBottom: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 12 }}>
            <StatCard label="Valor total del inventario (a costo)" value={formatearMoneda(reporteInventario.valorTotalInventario)} />
            <BotonExportar onClick={exportarInventario} disabled={reporteInventario.productos.length === 0} />
          </div>
          <div className="card" style={{ overflowX: 'auto' }}>
            <table>
              <thead>
                <tr><th>Código</th><th>Producto</th><th>Categoría</th><th>Talla</th><th>Stock</th><th>Costo unit.</th><th>Valor en costo</th></tr>
              </thead>
              <tbody>
                {reporteInventario.productos.map((p) => (
                  <tr key={p.Codigo}>
                    <td>{p.Codigo}</td>
                    <td>{p.Nombre}</td>
                    <td>{p.Categoria || '—'}</td>
                    <td>{p.Talla || '—'}</td>
                    <td>{p.StockActual <= p.StockMinimo ? <span className="badge badge-danger">{p.StockActual}</span> : p.StockActual}</td>
                    <td>{formatearMoneda(p.PrecioCosto)}</td>
                    <td>{formatearMoneda(p.ValorInventarioCosto)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {!cargando && tab === 'top' && (
        <>
          <div style={{ marginBottom: 14, display: 'flex', justifyContent: 'flex-end' }}>
            <BotonExportar onClick={exportarTop} disabled={topProductos.length === 0} />
          </div>
          <div className="card" style={{ overflowX: 'auto' }}>
            {topProductos.length === 0 ? (
              <div className="empty-state">Aún no hay ventas para generar este reporte.</div>
            ) : (
              <table>
                <thead><tr><th>#</th><th>Código</th><th>Producto</th><th>Unidades vendidas</th><th>Total vendido</th></tr></thead>
                <tbody>
                  {topProductos.map((p, idx) => (
                    <tr key={p.ProductoId}>
                      <td>{idx + 1}</td>
                      <td>{p.Codigo}</td>
                      <td>{p.Nombre}</td>
                      <td>{p.UnidadesVendidas}</td>
                      <td>{formatearMoneda(p.TotalVendido)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}
    </AppLayout>
  );
}
