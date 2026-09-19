import React, { useEffect, useState } from 'react';
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  BarChart, Bar, LabelList,
} from 'recharts';
import AppLayout from '../components/Layout/AppLayout';
import StatCard from '../components/UI/StatCard';
import api from '../api/axios';

function formatearMoneda(valor) {
  return new Intl.NumberFormat('es-GT', { style: 'currency', currency: 'GTQ' }).format(valor || 0);
}

// Formato compacto para los ticks del eje Y (Q1.2K en vez de Q1,200.00) —
// el detalle exacto ya lo lleva el tooltip al pasar el mouse.
function formatearMonedaCompacta(valor) {
  const abs = Math.abs(valor || 0);
  if (abs >= 1000) {
    return `Q${(valor / 1000).toLocaleString('es-GT', { maximumFractionDigits: 1 })}K`;
  }
  return `Q${Math.round(valor || 0)}`;
}

function formatearFechaCorta(fecha) {
  return new Date(fecha).toLocaleDateString('es-GT', { day: '2-digit', month: 'short', timeZone: 'UTC' });
}

// Tooltip a medida: el valor va primero y con más peso visual que la
// etiqueta (el lector ya sabe qué serie es, quiere el número), y usa los
// mismos tokens de color que el resto de la app para respetar el tema
// claro/oscuro activo.
function TooltipVentas({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div
      style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 8,
        padding: '8px 12px',
        boxShadow: 'var(--shadow-md)',
      }}
    >
      <div style={{ fontSize: 11.5, color: 'var(--espresso-soft)', marginBottom: 2 }}>{label}</div>
      <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--espresso)' }}>
        {formatearMoneda(payload[0].value)}
      </div>
    </div>
  );
}

function TooltipProductos({ active, payload }) {
  if (!active || !payload?.length) return null;
  const item = payload[0];
  return (
    <div
      style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 8,
        padding: '8px 12px',
        boxShadow: 'var(--shadow-md)',
      }}
    >
      <div style={{ fontSize: 11.5, color: 'var(--espresso-soft)', marginBottom: 2 }}>{item.payload.nombreCompleto}</div>
      <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--espresso)' }}>
        {item.value} {item.value === 1 ? 'unidad' : 'unidades'}
      </div>
    </div>
  );
}

// Punto activo del área con anillo de 2px en el color de superficie, para
// que se lea con nitidez incluso sobre el degradado del relleno.
function PuntoActivoVentas(props) {
  const { cx, cy } = props;
  return (
    <circle cx={cx} cy={cy} r={5} fill="var(--saddle)" stroke="var(--surface)" strokeWidth={2} />
  );
}

export default function Dashboard() {
  const [datos, setDatos] = useState(null);
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    api.get('/dashboard/resumen')
      .then((res) => setDatos(res.data))
      .catch((err) => setError(err.response?.data?.mensaje || 'No se pudo cargar el panel general.'))
      .finally(() => setCargando(false));
  }, []);

  const ventasChart = (datos?.ventasUltimos7Dias || []).map((d) => ({
    fecha: formatearFechaCorta(d.Fecha),
    monto: Number(d.Monto),
  }));

  const topProductosChart = (datos?.topProductos || []).map((p) => ({
    nombre: p.Nombre.length > 16 ? `${p.Nombre.slice(0, 16)}…` : p.Nombre,
    nombreCompleto: p.Nombre,
    unidades: p.UnidadesVendidas,
  }));

  return (
    <AppLayout title="Panel general" subtitle="Resumen del negocio en tiempo real">
      {cargando && <div className="empty-state"><div className="spinner" style={{ margin: '0 auto' }} /></div>}

      {error && (
        <div className="card" style={{ padding: 18, color: 'var(--danger)' }}>
          {error}. Verifica que el backend esté corriendo y conectado a SQL Server.
        </div>
      )}

      {datos && (
        <>
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 24 }}>
            <StatCard label="Ventas de hoy" value={datos.VentasHoy} hint={formatearMoneda(datos.MontoVentasHoy)} />
            <StatCard label="Ventas del mes" value={formatearMoneda(datos.MontoVentasMes)} />
            <StatCard label="Productos activos" value={datos.TotalProductos} hint={`${datos.TotalUnidadesStock} unidades en stock`} />
            <StatCard
              label="Stock bajo"
              value={datos.ProductosStockBajo}
              hint="productos bajo el mínimo"
              tone={datos.ProductosStockBajo > 0 ? 'danger' : 'success'}
            />
          </div>

          <div className="dashboard-charts-grid" style={{ gap: 20, marginBottom: 20 }}>
            <div className="card" style={{ padding: 22 }}>
              <h3 style={{ fontSize: 16, marginBottom: 16 }}>Ventas — últimos 7 días</h3>
              {ventasChart.length === 0 ? (
                <div className="empty-state">Aún no hay ventas registradas en este período.</div>
              ) : (
                <ResponsiveContainer width="100%" height={240}>
                  <AreaChart data={ventasChart} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorMonto" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--saddle)" stopOpacity={0.28} />
                        <stop offset="95%" stopColor="var(--saddle)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="none" stroke="var(--border)" vertical={false} />
                    <XAxis
                      dataKey="fecha"
                      stroke="var(--border)"
                      tick={{ fill: 'var(--espresso-soft)', fontSize: 12 }}
                      tickLine={false}
                      axisLine={{ stroke: 'var(--border)' }}
                    />
                    <YAxis
                      stroke="var(--border)"
                      tick={{ fill: 'var(--espresso-soft)', fontSize: 12 }}
                      tickLine={false}
                      axisLine={false}
                      width={54}
                      tickFormatter={formatearMonedaCompacta}
                    />
                    <Tooltip
                      content={<TooltipVentas />}
                      cursor={{ stroke: 'var(--saddle)', strokeWidth: 1, strokeDasharray: '3 3' }}
                    />
                    <Area
                      type="monotone"
                      dataKey="monto"
                      stroke="var(--saddle)"
                      strokeWidth={2}
                      fill="url(#colorMonto)"
                      dot={false}
                      activeDot={<PuntoActivoVentas />}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>

            <div className="card" style={{ padding: 22 }}>
              <h3 style={{ fontSize: 16, marginBottom: 16 }}>Productos más vendidos</h3>
              {topProductosChart.length === 0 ? (
                <div className="empty-state">Sin datos de ventas todavía.</div>
              ) : (
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart
                    data={topProductosChart}
                    layout="vertical"
                    margin={{ top: 4, right: 28, left: 10, bottom: 4 }}
                    barCategoryGap={10}
                  >
                    <CartesianGrid strokeDasharray="none" stroke="var(--border)" horizontal={false} />
                    <XAxis
                      type="number"
                      stroke="var(--border)"
                      tick={{ fill: 'var(--espresso-soft)', fontSize: 12 }}
                      tickLine={false}
                      axisLine={false}
                      allowDecimals={false}
                    />
                    <YAxis
                      dataKey="nombre"
                      type="category"
                      stroke="var(--border)"
                      tick={{ fill: 'var(--espresso-soft)', fontSize: 11.5 }}
                      tickLine={false}
                      axisLine={false}
                      width={100}
                    />
                    <Tooltip content={<TooltipProductos />} cursor={{ fill: 'var(--surface-muted)' }} />
                    <Bar dataKey="unidades" fill="var(--info)" radius={[0, 4, 4, 0]} maxBarSize={22}>
                      <LabelList
                        dataKey="unidades"
                        position="right"
                        style={{ fill: 'var(--espresso-soft)', fontSize: 12, fontWeight: 600 }}
                      />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          <div className="card" style={{ padding: 22 }}>
            <h3 style={{ fontSize: 16, marginBottom: 14 }}>Alertas de stock bajo</h3>
            {datos.stockBajo.length === 0 ? (
              <div className="empty-state">Todos los productos tienen stock suficiente.</div>
            ) : (
              <table>
                <thead>
                  <tr><th>Producto</th><th>Stock actual</th><th>Stock mínimo</th></tr>
                </thead>
                <tbody>
                  {datos.stockBajo.map((p) => (
                    <tr key={p.Nombre}>
                      <td>{p.Nombre}</td>
                      <td><span className="badge badge-danger">{p.StockActual}</span></td>
                      <td>{p.StockMinimo}</td>
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
