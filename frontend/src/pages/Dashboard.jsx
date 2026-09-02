import React, { useEffect, useState } from 'react';
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  BarChart, Bar,
} from 'recharts';
import AppLayout from '../components/Layout/AppLayout';
import StatCard from '../components/UI/StatCard';
import api from '../api/axios';

function formatearMoneda(valor) {
  return new Intl.NumberFormat('es-GT', { style: 'currency', currency: 'GTQ' }).format(valor || 0);
}

function formatearFechaCorta(fecha) {
  return new Date(fecha).toLocaleDateString('es-GT', { day: '2-digit', month: 'short', timeZone: 'UTC' });
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
                  <AreaChart data={ventasChart}>
                    <defs>
                      <linearGradient id="colorMonto" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#C97C46" stopOpacity={0.35} />
                        <stop offset="95%" stopColor="#C97C46" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E7E0D3" />
                    <XAxis dataKey="fecha" stroke="#6B5C4D" fontSize={12} />
                    <YAxis stroke="#6B5C4D" fontSize={12} />
                    <Tooltip formatter={(v) => formatearMoneda(v)} contentStyle={{ borderRadius: 8, border: '1px solid #E7E0D3' }} />
                    <Area type="monotone" dataKey="monto" stroke="#C97C46" strokeWidth={2} fill="url(#colorMonto)" />
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
                  <BarChart data={topProductosChart} layout="vertical" margin={{ left: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E7E0D3" horizontal={false} />
                    <XAxis type="number" stroke="#6B5C4D" fontSize={12} />
                    <YAxis dataKey="nombre" type="category" stroke="#6B5C4D" fontSize={11.5} width={100} />
                    <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #E7E0D3' }} />
                    <Bar dataKey="unidades" fill="#21808A" radius={[0, 4, 4, 0]} />
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
