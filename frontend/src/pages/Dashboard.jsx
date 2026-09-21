import React, { useEffect, useState } from 'react';
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  BarChart, Bar, LabelList, PieChart, Pie, Cell,
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

function formatearFechaHora(fecha) {
  return new Date(fecha).toLocaleString('es-GT', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'UTC' });
}

// El resumen de productos de una venta puede ser largo si llevó varios
// artículos distintos; se recorta para que la tabla no se deforme, igual
// que ya se hace con los nombres del gráfico de productos más vendidos.
function truncarResumen(texto, limite = 42) {
  if (!texto) return '';
  return texto.length > limite ? `${texto.slice(0, limite)}…` : texto;
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

function TooltipSalud({ active, payload }) {
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
      <div style={{ fontSize: 11.5, color: 'var(--espresso-soft)', marginBottom: 2 }}>{item.name}</div>
      <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--espresso)' }}>
        {item.value} {item.value === 1 ? 'producto' : 'productos'}
      </div>
    </div>
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
    nombre: p.Nombre.length > 13 ? `${p.Nombre.slice(0, 13)}…` : p.Nombre,
    nombreCompleto: p.Nombre,
    unidades: p.UnidadesVendidas,
  }));

  // Con "|| []" por si el backend desplegado todavía no tiene estos dos
  // campos (por ejemplo, si el frontend se actualizó antes que el backend):
  // así la página se ve con esas secciones vacías en vez de romperse por
  // completo con una pantalla en blanco.
  const alertasInventario = datos?.alertasInventario || [];
  const ultimasVentas = datos?.ultimasVentas || [];

  // Salud de inventario: qué proporción del catálogo activo está en cada
  // situación de stock. Se distinguen tres estados en vez de dos, para que
  // coincida con las tarjetas "Stock bajo" y "Agotados" de arriba (antes
  // "agotado" quedaba mezclado dentro de "stock bajo").
  const totalProductos = datos?.TotalProductos || 0;
  const stockBajoCount = datos?.ProductosStockBajo || 0;
  const agotadosCount = datos?.ProductosAgotados || 0;
  const stockSaludable = Math.max(totalProductos - stockBajoCount - agotadosCount, 0);
  const pctSaludable = totalProductos > 0 ? Math.round((stockSaludable / totalProductos) * 100) : 100;
  const saludData = [
    { name: 'Stock saludable', value: stockSaludable, color: 'var(--success)' },
    { name: 'Stock bajo', value: stockBajoCount, color: 'var(--warning)' },
    { name: 'Agotado', value: agotadosCount, color: 'var(--danger)' },
  ].filter((d) => d.value > 0);

  // Variación de ventas vs. el mes anterior: la métrica que realmente
  // ayuda a decidir (¿vamos mejor o peor que el mes pasado?), no solo el
  // monto absoluto. Sin mes anterior con ventas no hay una variación
  // porcentual honesta que mostrar, así que en ese caso se omite el badge
  // en vez de inventar un "+100%" sin base de comparación real.
  const montoMes = Number(datos?.MontoVentasMes || 0);
  const montoMesAnterior = Number(datos?.MontoVentasMesAnterior || 0);
  const variacionMes = montoMesAnterior > 0 ? ((montoMes - montoMesAnterior) / montoMesAnterior) * 100 : null;
  const ticketPromedioMes = Number(datos?.TicketPromedioMes || 0);

  return (
    <AppLayout title="Panel general" subtitle="Resumen del negocio en tiempo real">
      {cargando && (
        <div aria-busy="true" aria-label="Cargando panel general">
          <div
            className="dashboard-stats-row"
            style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16, marginBottom: 24 }}
          >
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="card" style={{ padding: '20px 22px' }}>
                <div className="skeleton" style={{ width: '60%', height: 11, marginBottom: 14 }} />
                <div className="skeleton" style={{ width: '45%', height: 28, marginBottom: 10 }} />
                <div className="skeleton" style={{ width: '70%', height: 11 }} />
              </div>
            ))}
          </div>

          <div className="dashboard-charts-grid" style={{ gap: 20, marginBottom: 20 }}>
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="card" style={{ padding: 22 }}>
                <div className="skeleton" style={{ width: '50%', height: 14, marginBottom: 18 }} />
                <div className="skeleton" style={{ width: '100%', height: 190 }} />
              </div>
            ))}
          </div>

          <div className="dashboard-bottom-grid" style={{ gap: 20 }}>
            {Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="card" style={{ padding: 22 }}>
                <div className="skeleton" style={{ width: '40%', height: 14, marginBottom: 16 }} />
                {Array.from({ length: 4 }).map((__, j) => (
                  <div key={j} className="skeleton" style={{ width: '100%', height: 34, marginBottom: 8, borderRadius: 6 }} />
                ))}
              </div>
            ))}
          </div>
        </div>
      )}

      {error && (
        <div className="card" style={{ padding: 18, color: 'var(--danger)' }}>
          {error}. Verifica que el backend esté corriendo y conectado a SQL Server.
        </div>
      )}

      {datos && (
        <>
          <div
            className="dashboard-stats-row"
            style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16, marginBottom: 24 }}
          >
            <StatCard
              label="Ventas de hoy"
              value={datos.VentasHoy}
              hint={formatearMoneda(datos.MontoVentasHoy)}
              tendencia={ventasChart.map((d) => d.monto)}
            />
            <StatCard
              label="Ventas del mes"
              value={formatearMoneda(datos.MontoVentasMes)}
              tone={variacionMes === null ? 'default' : variacionMes >= 0 ? 'success' : 'danger'}
              hint={
                variacionMes === null ? (
                  'sin datos del mes anterior'
                ) : (
                  <>
                    {variacionMes >= 0 ? '▲' : '▼'} {Math.abs(variacionMes).toFixed(1)}% vs. mes anterior
                  </>
                )
              }
            />
            <StatCard
              label="Ticket promedio"
              value={formatearMoneda(ticketPromedioMes)}
              hint="por venta, este mes"
            />
            <StatCard label="Productos activos" value={datos.TotalProductos} hint={`${datos.TotalUnidadesStock} unidades en stock`} />
            <StatCard
              label="Stock bajo"
              value={datos.ProductosStockBajo}
              hint="por debajo del mínimo"
              tone={datos.ProductosStockBajo > 0 ? 'danger' : 'success'}
            />
            <StatCard
              label="Agotados"
              value={datos.ProductosAgotados}
              hint="sin unidades disponibles"
              tone={datos.ProductosAgotados > 0 ? 'danger' : 'success'}
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
                  <BarChart data={topProductosChart} margin={{ top: 22, right: 8, left: 24, bottom: 28 }} barCategoryGap={18}>
                    <defs>
                      <linearGradient id="colorProductos" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="var(--info)" stopOpacity={0.95} />
                        <stop offset="100%" stopColor="var(--info)" stopOpacity={0.45} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="none" stroke="var(--border)" vertical={false} />
                    <XAxis
                      dataKey="nombre"
                      stroke="var(--border)"
                      tick={{ fill: 'var(--espresso-soft)', fontSize: 10.5 }}
                      tickLine={false}
                      axisLine={{ stroke: 'var(--border)' }}
                      interval={0}
                      angle={-35}
                      textAnchor="end"
                      height={50}
                    />
                    <YAxis hide allowDecimals={false} />
                    <Tooltip content={<TooltipProductos />} cursor={{ fill: 'var(--surface-muted)' }} />
                    <Bar dataKey="unidades" fill="url(#colorProductos)" radius={[4, 4, 0, 0]} maxBarSize={34}>
                      <LabelList
                        dataKey="unidades"
                        position="top"
                        style={{ fill: 'var(--espresso-soft)', fontSize: 12, fontWeight: 600 }}
                      />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>

            <div className="card" style={{ padding: 22 }}>
              <h3 style={{ fontSize: 16, marginBottom: 16 }}>Salud de inventario</h3>
              {totalProductos === 0 ? (
                <div className="empty-state">Aún no hay productos registrados.</div>
              ) : (
                <>
                  <div style={{ position: 'relative' }}>
                    <ResponsiveContainer width="100%" height={190}>
                      <PieChart>
                        <Pie
                          data={saludData}
                          dataKey="value"
                          nameKey="name"
                          innerRadius={58}
                          outerRadius={78}
                          startAngle={90}
                          endAngle={-270}
                          paddingAngle={saludData.length > 1 ? 3 : 0}
                          stroke="var(--surface)"
                          strokeWidth={2}
                          isAnimationActive={false}
                        >
                          {saludData.map((d) => (
                            <Cell key={d.name} fill={d.color} />
                          ))}
                        </Pie>
                        <Tooltip content={<TooltipSalud />} />
                      </PieChart>
                    </ResponsiveContainer>
                    <div
                      style={{
                        position: 'absolute', inset: 0, top: -10, display: 'flex', flexDirection: 'column',
                        alignItems: 'center', justifyContent: 'center', pointerEvents: 'none',
                      }}
                    >
                      <div style={{ fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 600, color: 'var(--espresso)' }}>
                        {pctSaludable}%
                      </div>
                      <div style={{ fontSize: 11.5, color: 'var(--espresso-soft)' }}>saludable</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'center', gap: 18, marginTop: 4, flexWrap: 'wrap' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12.5, color: 'var(--espresso-soft)' }}>
                      <span style={{ width: 9, height: 9, borderRadius: '50%', background: 'var(--success)', display: 'inline-block' }} />
                      Saludable: {stockSaludable}
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12.5, color: 'var(--espresso-soft)' }}>
                      <span style={{ width: 9, height: 9, borderRadius: '50%', background: 'var(--warning)', display: 'inline-block' }} />
                      Bajo: {stockBajoCount}
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12.5, color: 'var(--espresso-soft)' }}>
                      <span style={{ width: 9, height: 9, borderRadius: '50%', background: 'var(--danger)', display: 'inline-block' }} />
                      Agotado: {agotadosCount}
                    </span>
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="dashboard-bottom-grid" style={{ gap: 20 }}>
            <div className="card" style={{ padding: 22 }}>
              <h3 style={{ fontSize: 16, marginBottom: 14 }}>Alertas de inventario</h3>
              {alertasInventario.length === 0 ? (
                <div className="empty-state">Todos los productos tienen stock suficiente.</div>
              ) : (
                <table>
                  <thead>
                    <tr><th>Producto</th><th>Estado</th><th>Stock actual</th><th>Stock mínimo</th></tr>
                  </thead>
                  <tbody>
                    {alertasInventario.map((p) => (
                      <tr key={p.Nombre}>
                        <td>{p.Nombre}</td>
                        <td>
                          <span className={`badge ${p.TipoAlerta === 'Agotado' ? 'badge-danger' : 'badge-warning'}`}>
                            {p.TipoAlerta}
                          </span>
                        </td>
                        <td style={{ fontVariantNumeric: 'tabular-nums' }}>{p.StockActual}</td>
                        <td style={{ fontVariantNumeric: 'tabular-nums' }}>{p.StockMinimo}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            <div className="card" style={{ padding: 22 }}>
              <h3 style={{ fontSize: 16, marginBottom: 14 }}>Últimas ventas</h3>
              {ultimasVentas.length === 0 ? (
                <div className="empty-state">Aún no hay ventas registradas.</div>
              ) : (
                <table>
                  <thead>
                    <tr><th>Venta</th><th>Fecha</th><th>Productos</th><th>Cant.</th><th>Total</th></tr>
                  </thead>
                  <tbody>
                    {ultimasVentas.map((v) => (
                      <tr key={v.VentaId}>
                        <td>{v.NumeroVenta}</td>
                        <td>{formatearFechaHora(v.FechaVenta)}</td>
                        <td title={v.ResumenProductos}>{truncarResumen(v.ResumenProductos)}</td>
                        <td style={{ fontVariantNumeric: 'tabular-nums' }}>{v.CantidadTotal}</td>
                        <td style={{ fontVariantNumeric: 'tabular-nums' }}>{formatearMoneda(v.Total)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </>
      )}
    </AppLayout>
  );
}
