import React, { useEffect, useState, useCallback } from 'react';
import AppLayout from '../components/Layout/AppLayout';
import Modal from '../components/UI/Modal';
import api from '../api/axios';

export default function Inventario() {
  const [movimientos, setMovimientos] = useState([]);
  const [stockBajo, setStockBajo] = useState([]);
  const [productos, setProductos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [form, setForm] = useState({ productoId: '', tipoMovimiento: 'ENTRADA', cantidad: '', motivo: '' });
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState(null);

  const cargarTodo = useCallback(() => {
    setCargando(true);
    Promise.all([
      api.get('/inventario/movimientos'),
      api.get('/inventario/stock-bajo'),
      api.get('/productos'),
    ])
      .then(([mov, bajo, prod]) => {
        setMovimientos(mov.data);
        setStockBajo(bajo.data);
        setProductos(prod.data);
      })
      .catch(() => setMensaje({ tipo: 'error', texto: 'No se pudo cargar la información de inventario.' }))
      .finally(() => setCargando(false));
  }, []);

  useEffect(() => { cargarTodo(); }, [cargarTodo]);

  useEffect(() => {
    if (!mensaje) return;
    const t = setTimeout(() => setMensaje(null), 3500);
    return () => clearTimeout(t);
  }, [mensaje]);

  function abrirModal(productoId) {
    setForm({ productoId: productoId || '', tipoMovimiento: 'ENTRADA', cantidad: '', motivo: '' });
    setModalAbierto(true);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setGuardando(true);
    try {
      await api.post('/inventario/movimientos', {
        productoId: parseInt(form.productoId, 10),
        tipoMovimiento: form.tipoMovimiento,
        cantidad: parseInt(form.cantidad, 10),
        motivo: form.motivo,
      });
      setMensaje({ tipo: 'success', texto: 'Movimiento registrado correctamente.' });
      setModalAbierto(false);
      cargarTodo();
    } catch (err) {
      setMensaje({ tipo: 'error', texto: err.response?.data?.mensaje || 'No se pudo registrar el movimiento.' });
    } finally {
      setGuardando(false);
    }
  }

  return (
    <AppLayout
      title="Inventario"
     
      actions={<button className="btn btn-primary" onClick={() => abrirModal('')}>+ Registrar movimiento</button>}
    >
      {stockBajo.length > 0 && (
        <div className="card" style={{ padding: 18, marginBottom: 20, borderColor: 'var(--danger)' }}>
          <h3 style={{ fontSize: 15, color: 'var(--danger)', marginBottom: 10 }}>⚠ Productos con stock bajo o en riesgo de desabastecimiento</h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {stockBajo.map((p) => (
              <button
                key={p.ProductoId}
                className="badge badge-danger"
                style={{ border: 'none', cursor: 'pointer' }}
                onClick={() => abrirModal(p.ProductoId)}
                title="Registrar entrada para este producto"
              >
                {p.Nombre} — {p.StockActual}/{p.StockMinimo}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="card" style={{ overflowX: 'auto' }}>
        <div style={{ padding: '16px 18px 4px' }}>
          <h3 style={{ fontSize: 16 }}>Historial de movimientos</h3>
        </div>
        {cargando ? (
          <div className="empty-state"><div className="spinner" style={{ margin: '0 auto' }} /></div>
        ) : movimientos.length === 0 ? (
          <div className="empty-state">Todavía no hay movimientos de inventario registrados.</div>
        ) : (
          <table>
            <thead>
              <tr><th>Fecha</th><th>Producto</th><th>Tipo</th><th>Cantidad</th><th>Stock resultante</th><th>Motivo</th><th>Usuario</th></tr>
            </thead>
            <tbody>
              {movimientos.map((m) => (
                <tr key={m.MovimientoId}>
                  <td>{new Date(m.FechaMovimiento).toLocaleString('es-GT', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'UTC' })}</td>
                  <td>{m.ProductoNombre} <span style={{ color: 'var(--espresso-soft)', fontSize: 12 }}>({m.ProductoCodigo})</span></td>
                  <td>
                    {m.TipoMovimiento === 'ENTRADA'
                      ? <span className="badge badge-success">Entrada</span>
                      : <span className="badge badge-danger">Salida</span>}
                  </td>
                  <td>{m.Cantidad}</td>
                  <td>{m.StockNuevo}</td>
                  <td>{m.Motivo || '—'}</td>
                  <td>{m.UsuarioNombre}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <Modal open={modalAbierto} onClose={() => setModalAbierto(false)} title="Registrar movimiento de inventario">
        <form onSubmit={handleSubmit}>
          <div className="form-field">
            <label>Producto</label>
            <select value={form.productoId} onChange={(e) => setForm({ ...form, productoId: e.target.value })} required>
              <option value="">Selecciona un producto</option>
              {productos.map((p) => (
                <option key={p.ProductoId} value={p.ProductoId}>{p.Nombre} — stock actual: {p.StockActual}</option>
              ))}
            </select>
          </div>

          <div className="form-field">
            <label>Tipo de movimiento</label>
            <select value={form.tipoMovimiento} onChange={(e) => setForm({ ...form, tipoMovimiento: e.target.value })}>
              <option value="ENTRADA">Entrada (ingreso de mercancía)</option>
              <option value="SALIDA">Salida (ajuste, merma, etc.)</option>
            </select>
          </div>

          <div className="form-field">
            <label>Cantidad</label>
            <input type="number" min="1" value={form.cantidad} onChange={(e) => setForm({ ...form, cantidad: e.target.value })} required />
          </div>

          <div className="form-field">
            <label>Motivo (opcional)</label>
            <input value={form.motivo} onChange={(e) => setForm({ ...form, motivo: e.target.value })} placeholder="Ej. Compra a proveedor, ajuste por daño…" />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 8 }}>
            <button type="button" className="btn btn-secondary" onClick={() => setModalAbierto(false)}>Cancelar</button>
            <button type="submit" className="btn btn-primary" disabled={guardando}>
              {guardando ? 'Guardando…' : 'Registrar movimiento'}
            </button>
          </div>
        </form>
      </Modal>

      {mensaje && <div className={`toast ${mensaje.tipo}`}>{mensaje.texto}</div>}
    </AppLayout>
  );
}
