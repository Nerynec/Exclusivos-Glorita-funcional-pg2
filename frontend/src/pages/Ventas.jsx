import React, { useEffect, useState, useCallback } from 'react';
import AppLayout from '../components/Layout/AppLayout';
import Modal from '../components/UI/Modal';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { useCarrito } from '../context/CarritoContext';
import { generarComprobantePDF } from '../utils/generarComprobantePDF';

export default function Ventas() {
  const { esAdministrador } = useAuth();
  const { items: carrito, agregarProducto, quitarProducto, actualizarCantidad, vaciarCarrito, total } = useCarrito();
  const [ventas, setVentas] = useState([]);
  const [productos, setProductos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [clienteNombre, setClienteNombre] = useState('');
  const [productoSeleccionado, setProductoSeleccionado] = useState('');
  const [cantidad, setCantidad] = useState('1');
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState(null);
  const [detalleVenta, setDetalleVenta] = useState(null);
  const [cargandoDetalle, setCargandoDetalle] = useState(false);
  const [anulando, setAnulando] = useState(false);
  const [generandoPDF, setGenerandoPDF] = useState(false);

  const cargarVentas = useCallback(() => {
    setCargando(true);
    api.get('/ventas')
      .then((res) => setVentas(res.data))
      .catch(() => setMensaje({ tipo: 'error', texto: 'No se pudieron cargar las ventas.' }))
      .finally(() => setCargando(false));
  }, []);

  useEffect(() => { cargarVentas(); }, [cargarVentas]);
  useEffect(() => {
    api.get('/productos').then((res) => setProductos(res.data.filter((p) => p.StockActual > 0))).catch(() => {});
  }, [modalAbierto]);

  useEffect(() => {
    if (!mensaje) return;
    const t = setTimeout(() => setMensaje(null), 3500);
    return () => clearTimeout(t);
  }, [mensaje]);

  function abrirModal() {
    setClienteNombre('');
    setProductoSeleccionado('');
    setCantidad('1');
    setModalAbierto(true);
  }

  function agregarAlCarrito() {
    const producto = productos.find((p) => p.ProductoId === parseInt(productoSeleccionado, 10));
    const cant = parseInt(cantidad, 10);
    if (!producto || !cant || cant <= 0) return;
    if (cant > producto.StockActual) {
      setMensaje({ tipo: 'error', texto: `Solo hay ${producto.StockActual} unidades disponibles de "${producto.Nombre}".` });
      return;
    }
    agregarProducto(producto, cant);
    setProductoSeleccionado('');
    setCantidad('1');
  }

  async function confirmarVenta() {
    if (carrito.length === 0) return;
    setGuardando(true);
    try {
      const res = await api.post('/ventas', {
        clienteNombre: clienteNombre || 'Consumidor final',
        items: carrito.map((i) => ({ productoId: i.productoId, cantidad: i.cantidad })),
      });
      setMensaje({ tipo: 'success', texto: 'Venta registrada correctamente.' });
      setModalAbierto(false);
      vaciarCarrito();
      cargarVentas();
      abrirDetalle(res.data.ventaId); // muestra el comprobante recién generado, listo para imprimir
    } catch (err) {
      setMensaje({ tipo: 'error', texto: err.response?.data?.mensaje || 'No se pudo registrar la venta.' });
    } finally {
      setGuardando(false);
    }
  }

  async function abrirDetalle(ventaId) {
    setCargandoDetalle(true);
    setDetalleVenta({ VentaId: ventaId }); // abre el modal ya, mostrando el spinner
    try {
      const res = await api.get(`/ventas/${ventaId}`);
      setDetalleVenta(res.data);
    } catch (err) {
      setMensaje({ tipo: 'error', texto: 'No se pudo cargar el detalle de la venta.' });
      setDetalleVenta(null);
    } finally {
      setCargandoDetalle(false);
    }
  }

  async function descargarComprobante() {
    setGenerandoPDF(true);
    try {
      await generarComprobantePDF(detalleVenta);
    } catch (err) {
      setMensaje({ tipo: 'error', texto: 'No se pudo generar el PDF del comprobante.' });
    } finally {
      setGenerandoPDF(false);
    }
  }

  async function handleAnular() {
    if (!window.confirm(`¿Anular la venta ${detalleVenta.NumeroVenta}? Esto devuelve el stock de los productos.`)) return;
    setAnulando(true);
    try {
      await api.post(`/ventas/${detalleVenta.VentaId}/anular`);
      setMensaje({ tipo: 'success', texto: 'Venta anulada y stock restituido.' });
      setDetalleVenta(null);
      cargarVentas();
    } catch (err) {
      setMensaje({ tipo: 'error', texto: err.response?.data?.mensaje || 'No se pudo anular la venta.' });
    } finally {
      setAnulando(false);
    }
  }

  return (
    <AppLayout
      title="Ventas"
      subtitle="Registro de ventas y actualización automática de inventario"
      actions={<button className="btn btn-primary" onClick={abrirModal}>+ Nueva venta{carrito.length > 0 ? ` (${carrito.length})` : ''}</button>}
    >
      <div className="card" style={{ overflowX: 'auto' }}>
        {cargando ? (
          <div className="empty-state"><div className="spinner" style={{ margin: '0 auto' }} /></div>
        ) : ventas.length === 0 ? (
          <div className="empty-state">Todavía no hay ventas registradas.</div>
        ) : (
          <table>
            <thead>
              <tr><th>No. Venta</th><th>Fecha</th><th>Cliente</th><th>Vendedor</th><th>Total</th><th>Estado</th></tr>
            </thead>
            <tbody>
              {ventas.map((v) => (
                <tr key={v.VentaId} onClick={() => abrirDetalle(v.VentaId)} style={{ cursor: 'pointer', opacity: v.Estado === 'ANULADA' ? 0.55 : 1 }}>
                  <td>{v.NumeroVenta}</td>
                  <td>{new Date(v.FechaVenta).toLocaleString('es-GT', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'UTC' })}</td>
                  <td>{v.ClienteNombre}</td>
                  <td>{v.VendedorNombre}</td>
                  <td style={{ fontWeight: 600, textDecoration: v.Estado === 'ANULADA' ? 'line-through' : 'none' }}>Q {Number(v.Total).toFixed(2)}</td>
                  <td>
                    {v.Estado === 'ANULADA'
                      ? <span className="badge badge-neutral">Anulada</span>
                      : <span className="badge badge-success">Completada</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <Modal open={modalAbierto} onClose={() => setModalAbierto(false)} title="Nueva venta" width={560}>
        <div className="form-field">
          <label>Cliente (opcional)</label>
          <input value={clienteNombre} onChange={(e) => setClienteNombre(e.target.value)} placeholder="Consumidor final" />
        </div>

        <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end', marginBottom: 16 }}>
          <div className="form-field" style={{ flex: 1, marginBottom: 0 }}>
            <label>Producto</label>
            <select value={productoSeleccionado} onChange={(e) => setProductoSeleccionado(e.target.value)}>
              <option value="">Selecciona un producto</option>
              {productos.map((p) => (
                <option key={p.ProductoId} value={p.ProductoId}>{p.Nombre}{p.Talla ? ` (Talla ${p.Talla})` : ''} — Q{Number(p.PrecioVenta).toFixed(2)} (stock: {p.StockActual})</option>
              ))}
            </select>
          </div>
          <div className="form-field" style={{ width: 90, marginBottom: 0 }}>
            <label>Cant.</label>
            <input type="number" min="1" value={cantidad} onChange={(e) => setCantidad(e.target.value)} />
          </div>
          <button type="button" className="btn btn-secondary" onClick={agregarAlCarrito}>Agregar</button>
        </div>

        {carrito.length > 0 && (
          <div style={{ border: '1px solid var(--border)', borderRadius: 8, marginBottom: 16 }}>
            <table>
              <thead><tr><th>Producto</th><th>Cant.</th><th>Subtotal</th><th></th></tr></thead>
              <tbody>
                {carrito.map((i) => (
                  <tr key={i.productoId}>
                    <td>{i.nombre}{i.talla ? ` (Talla ${i.talla})` : ''}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <button type="button" onClick={() => (i.cantidad <= 1 ? quitarProducto(i.productoId) : actualizarCantidad(i.productoId, i.cantidad - 1))} className="btn btn-secondary" style={{ padding: '2px 9px', fontSize: 14 }}>−</button>
                        <span style={{ minWidth: 18, textAlign: 'center' }}>{i.cantidad}</span>
                        <button type="button" onClick={() => actualizarCantidad(i.productoId, i.cantidad + 1)} className="btn btn-secondary" style={{ padding: '2px 9px', fontSize: 14 }}>+</button>
                      </div>
                    </td>
                    <td>Q {(i.precioVenta * i.cantidad).toFixed(2)}</td>
                    <td>
                      <button type="button" onClick={() => quitarProducto(i.productoId)} style={{ background: 'none', border: 'none', color: 'var(--danger)' }}>
                        Quitar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
          <span style={{ fontSize: 14, color: 'var(--espresso-soft)' }}>Total</span>
          <span style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 600 }}>Q {total.toFixed(2)}</span>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
          <button type="button" className="btn btn-secondary" onClick={() => setModalAbierto(false)}>Cancelar</button>
          <button type="button" className="btn btn-primary" onClick={confirmarVenta} disabled={guardando || carrito.length === 0}>
            {guardando ? 'Registrando…' : 'Confirmar venta'}
          </button>
        </div>
      </Modal>

      <Modal open={!!detalleVenta} onClose={() => setDetalleVenta(null)} title={detalleVenta ? `Venta ${detalleVenta.NumeroVenta || ''}` : ''} width={520}>
        {cargandoDetalle || !detalleVenta?.detalle ? (
          <div className="empty-state"><div className="spinner" style={{ margin: '0 auto' }} /></div>
        ) : (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
              <span style={{ color: 'var(--espresso-soft)', fontSize: 13 }}>Cliente</span>
              <span style={{ fontWeight: 600 }}>{detalleVenta.ClienteNombre}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
              <span style={{ color: 'var(--espresso-soft)', fontSize: 13 }}>Vendedor</span>
              <span>{detalleVenta.VendedorNombre}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 14 }}>
              <span style={{ color: 'var(--espresso-soft)', fontSize: 13 }}>Fecha</span>
              <span>{new Date(detalleVenta.FechaVenta).toLocaleString('es-GT', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'UTC' })}</span>
            </div>

            <div style={{ border: '1px solid var(--border)', borderRadius: 8, marginBottom: 16 }}>
              <table>
                <thead><tr><th>Producto</th><th>Cant.</th><th>Precio</th><th>Subtotal</th></tr></thead>
                <tbody>
                  {detalleVenta.detalle.map((d) => (
                    <tr key={d.DetalleVentaId}>
                      <td>{d.ProductoNombre}{d.ProductoTalla ? ` (Talla ${d.ProductoTalla})` : ''}</td>
                      <td>{d.Cantidad}</td>
                      <td>Q {Number(d.PrecioUnitario).toFixed(2)}</td>
                      <td>Q {Number(d.Subtotal).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
              <span style={{ fontSize: 14, color: 'var(--espresso-soft)' }}>Total</span>
              <span style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 600 }}>Q {Number(detalleVenta.Total).toFixed(2)}</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              {detalleVenta.Estado === 'ANULADA'
                ? <span className="badge badge-neutral">Esta venta está anulada</span>
                : <span className="badge badge-success">Venta completada</span>}
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="btn btn-secondary" onClick={descargarComprobante} disabled={generandoPDF}>
                  {generandoPDF ? 'Generando…' : '⬇ Descargar comprobante PDF'}
                </button>
                {esAdministrador && detalleVenta.Estado !== 'ANULADA' && (
                  <button className="btn btn-danger" onClick={handleAnular} disabled={anulando}>
                    {anulando ? 'Anulando…' : 'Anular venta'}
                  </button>
                )}
              </div>
            </div>
          </>
        )}
      </Modal>

      {mensaje && <div className={`toast ${mensaje.tipo}`}>{mensaje.texto}</div>}
    </AppLayout>
  );
}
