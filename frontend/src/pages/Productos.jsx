import React, { useEffect, useState, useCallback } from 'react';
import AppLayout from '../components/Layout/AppLayout';
import Modal from '../components/UI/Modal';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { useCarrito } from '../context/CarritoContext';
import { redimensionarImagen } from '../utils/redimensionarImagen';

const PRODUCTO_VACIO = {
  codigo: '', nombre: '', descripcion: '', categoriaId: '', marca: '', talla: '',
  precioCosto: '', precioVenta: '', stockActual: '', stockMinimo: '5', imagenUrl: '',
};

function IconoCuero() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.6">
      <path d="M7 3.5h10a2 2 0 0 1 2 2V17a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V5.5a2 2 0 0 1 2-2Z" />
      <path d="M9 8h6M9 12h6M9 16h3" />
    </svg>
  );
}

export default function Productos() {
  const { esAdministrador } = useAuth();
  const { agregarProducto } = useCarrito();
  const [productos, setProductos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [buscar, setBuscar] = useState('');
  const [categoriaFiltro, setCategoriaFiltro] = useState('');
  const [cargando, setCargando] = useState(true);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [editando, setEditando] = useState(null);
  const [form, setForm] = useState(PRODUCTO_VACIO);
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState(null);
  const [modalCategorias, setModalCategorias] = useState(false);
  const [nuevaCategoria, setNuevaCategoria] = useState({ nombre: '', descripcion: '' });
  const [editandoCategoria, setEditandoCategoria] = useState(null);
  const [guardandoCategoria, setGuardandoCategoria] = useState(false);

  const cargarCategorias = useCallback(() => {
    api.get('/categorias').then((res) => setCategorias(res.data)).catch(() => {});
  }, []);

  const cargarProductos = useCallback(() => {
    setCargando(true);
    const params = {};
    if (buscar) params.buscar = buscar;
    if (categoriaFiltro) params.categoria = categoriaFiltro;
    api.get('/productos', { params })
      .then((res) => setProductos(res.data))
      .catch(() => setMensaje({ tipo: 'error', texto: 'No se pudieron cargar los productos.' }))
      .finally(() => setCargando(false));
  }, [buscar, categoriaFiltro]);

  useEffect(() => {
    cargarCategorias();
  }, [cargarCategorias]);

  useEffect(() => {
    const timeout = setTimeout(cargarProductos, 300); // debounce de búsqueda
    return () => clearTimeout(timeout);
  }, [cargarProductos]);

  function abrirNuevo() {
    setEditando(null);
    setForm(PRODUCTO_VACIO);
    setModalAbierto(true);
  }

  function abrirEditar(producto) {
    setEditando(producto);
    setForm({
      codigo: producto.Codigo,
      nombre: producto.Nombre,
      descripcion: producto.Descripcion || '',
      categoriaId: producto.CategoriaId || '',
      marca: producto.Marca || '',
      talla: producto.Talla || '',
      precioCosto: producto.PrecioCosto,
      precioVenta: producto.PrecioVenta,
      stockActual: producto.StockActual,
      stockMinimo: producto.StockMinimo,
      imagenUrl: producto.ImagenUrl || '',
    });
    setModalAbierto(true);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setGuardando(true);
    try {
      const payload = {
        ...form,
        categoriaId: form.categoriaId || null,
        precioCosto: parseFloat(form.precioCosto) || 0,
        precioVenta: parseFloat(form.precioVenta) || 0,
        stockActual: parseInt(form.stockActual, 10) || 0,
        stockMinimo: parseInt(form.stockMinimo, 10) || 0,
      };
      if (editando) {
        await api.put(`/productos/${editando.ProductoId}`, payload);
        setMensaje({ tipo: 'success', texto: 'Producto actualizado correctamente.' });
      } else {
        await api.post('/productos', payload);
        setMensaje({ tipo: 'success', texto: 'Producto creado correctamente.' });
      }
      setModalAbierto(false);
      cargarProductos();
    } catch (err) {
      setMensaje({ tipo: 'error', texto: err.response?.data?.mensaje || 'No se pudo guardar el producto.' });
    } finally {
      setGuardando(false);
    }
  }

  function handleAgregarCarrito(producto) {
    if (producto.StockActual <= 0) {
      setMensaje({ tipo: 'error', texto: `"${producto.Nombre}" no tiene stock disponible.` });
      return;
    }
    agregarProducto(producto, 1);
    setMensaje({ tipo: 'success', texto: `"${producto.Nombre}" agregado al carrito.` });
  }

  async function handleEliminar(producto) {
    if (!window.confirm(`¿Eliminar "${producto.Nombre}"? Si tiene movimientos asociados, se desactivará en su lugar.`)) return;
    try {
      await api.delete(`/productos/${producto.ProductoId}`);
      cargarProductos();
    } catch (err) {
      setMensaje({ tipo: 'error', texto: err.response?.data?.mensaje || 'No se pudo eliminar el producto.' });
    }
  }

  async function handleGuardarCategoria(e) {
    e.preventDefault();
    setGuardandoCategoria(true);
    try {
      if (editandoCategoria) {
        await api.put(`/categorias/${editandoCategoria.CategoriaId}`, nuevaCategoria);
        setMensaje({ tipo: 'success', texto: 'Categoría actualizada.' });
      } else {
        await api.post('/categorias', nuevaCategoria);
        setMensaje({ tipo: 'success', texto: 'Categoría creada.' });
      }
      setNuevaCategoria({ nombre: '', descripcion: '' });
      setEditandoCategoria(null);
      cargarCategorias();
    } catch (err) {
      setMensaje({ tipo: 'error', texto: err.response?.data?.mensaje || 'No se pudo guardar la categoría.' });
    } finally {
      setGuardandoCategoria(false);
    }
  }

  function iniciarEdicionCategoria(c) {
    setEditandoCategoria(c);
    setNuevaCategoria({ nombre: c.Nombre, descripcion: c.Descripcion || '' });
  }

  async function handleEliminarCategoria(c) {
    if (!window.confirm(`¿Eliminar la categoría "${c.Nombre}"?`)) return;
    try {
      await api.delete(`/categorias/${c.CategoriaId}`);
      cargarCategorias();
    } catch (err) {
      setMensaje({ tipo: 'error', texto: err.response?.data?.mensaje || 'No se pudo eliminar la categoría.' });
    }
  }

  async function handleArchivoImagen(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setMensaje({ tipo: 'error', texto: 'Elegí un archivo de imagen (jpg, png…).' });
      return;
    }
    try {
      const dataUrl = await redimensionarImagen(file, 640);
      setForm((prev) => ({ ...prev, imagenUrl: dataUrl }));
    } catch (err) {
      setMensaje({ tipo: 'error', texto: 'No se pudo leer esa imagen.' });
    } finally {
      e.target.value = ''; // permite volver a elegir el mismo archivo si hace falta
    }
  }

  useEffect(() => {
    if (!mensaje) return;
    const t = setTimeout(() => setMensaje(null), 3500);
    return () => clearTimeout(t);
  }, [mensaje]);

  return (
    <AppLayout
      title="Productos"
     
      actions={esAdministrador && (
        <>
          <button className="btn btn-secondary" onClick={() => setModalCategorias(true)}>Categorías</button>
          <button className="btn btn-primary" onClick={abrirNuevo}>+ Nuevo producto</button>
        </>
      )}
    >
      <div className="card" style={{ padding: 16, marginBottom: 18, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <input
          placeholder="Buscar por nombre, código, marca o talla…"
          value={buscar}
          onChange={(e) => setBuscar(e.target.value)}
          style={{ flex: 1, minWidth: 220, padding: '9px 12px', border: '1px solid var(--border)', borderRadius: 8 }}
        />
        <select
          value={categoriaFiltro}
          onChange={(e) => setCategoriaFiltro(e.target.value)}
          style={{ padding: '9px 12px', border: '1px solid var(--border)', borderRadius: 8, minWidth: 180 }}
        >
          <option value="">Todas las categorías</option>
          {categorias.map((c) => <option key={c.CategoriaId} value={c.CategoriaId}>{c.Nombre}</option>)}
        </select>
      </div>

      <div className={cargando || productos.length === 0 ? 'card' : ''} style={cargando || productos.length === 0 ? { overflowX: 'auto' } : undefined}>
        {cargando ? (
          <div className="empty-state"><div className="spinner" style={{ margin: '0 auto' }} /></div>
        ) : productos.length === 0 ? (
          <div className="empty-state">No se encontraron productos con esos criterios.</div>
        ) : (
          <div className="product-grid">
            {productos.map((p) => (
              <div className="product-card" key={p.ProductoId}>
                <div className="product-card-image">
                  {p.StockBajo && <span className="product-badge">Stock bajo</span>}
                  {p.ImagenUrl
                    ? <img src={p.ImagenUrl} alt={p.Nombre} onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }} />
                    : null}
                  <div className="product-image-placeholder" style={{ display: p.ImagenUrl ? 'none' : 'flex' }}>
                    <IconoCuero />
                  </div>
                </div>
                <div className="product-card-body">
                  {p.Marca && <div className="product-brand">{p.Marca}</div>}
                  <div className="product-name">{p.Nombre}</div>
                  {p.Talla && <div className="product-talla">Talla: <strong>{p.Talla}</strong></div>}
                  <div className="product-price">Q {Number(p.PrecioVenta).toFixed(2)}</div>
                  {p.StockBajo
                    ? <span className="badge badge-danger">Stock bajo · {p.StockActual}</span>
                    : <span className="badge badge-success">{p.StockActual} disponibles</span>}
                  <button
                    className="btn btn-primary"
                    style={{ marginTop: 8, justifyContent: 'center' }}
                    onClick={() => handleAgregarCarrito(p)}
                    disabled={p.StockActual <= 0}
                  >
                    🛒 Agregar al carrito
                  </button>
                  {esAdministrador && (
                    <div className="product-card-actions">
                      <button className="btn btn-secondary" onClick={() => abrirEditar(p)}>Editar</button>
                      <button className="btn btn-danger" onClick={() => handleEliminar(p)}>Eliminar</button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Modal open={modalAbierto} onClose={() => setModalAbierto(false)} title={editando ? 'Editar producto' : 'Nuevo producto'} width={520}>
        <form onSubmit={handleSubmit}>
          <div className="form-grid-2col">
            <div className="form-field">
              <label>Código</label>
              <input value={form.codigo} onChange={(e) => setForm({ ...form, codigo: e.target.value })} required disabled={!!editando} />
            </div>
            <div className="form-field">
              <label>Marca</label>
              <input value={form.marca} onChange={(e) => setForm({ ...form, marca: e.target.value })} />
            </div>
          </div>

          <div className="form-field">
            <label>Nombre</label>
            <input value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} required />
          </div>

          <div className="form-field">
            <label>Talla (opcional)</label>
            <input
              value={form.talla}
              onChange={(e) => setForm({ ...form, talla: e.target.value })}
              placeholder="Ej. S, M, L, XL, 32, 42…"
            />
          </div>

          <div className="form-field">
            <label>Descripción</label>
            <textarea rows={2} value={form.descripcion} onChange={(e) => setForm({ ...form, descripcion: e.target.value })} />
          </div>

          <div className="form-field">
            <label>Foto del producto (opcional)</label>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 10 }}>
              <div className="thumb thumb-lg">
                {form.imagenUrl
                  ? <img src={form.imagenUrl} alt="Vista previa" onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }} />
                  : null}
                <div className="thumb-placeholder" style={{ display: form.imagenUrl ? 'none' : 'flex' }}><IconoCuero /></div>
              </div>
              <input
                style={{ flex: 1 }}
                value={form.imagenUrl?.startsWith('data:') ? '' : form.imagenUrl}
                onChange={(e) => setForm({ ...form, imagenUrl: e.target.value })}
                placeholder="Pegá un link de imagen…"
              />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <label className="btn btn-secondary" style={{ cursor: 'pointer', fontSize: 12.5, padding: '7px 12px' }}>
                📁 Subir desde mi computadora…
                <input type="file" accept="image/*" onChange={handleArchivoImagen} style={{ display: 'none' }} />
              </label>
              {form.imagenUrl?.startsWith('data:') && (
                <span style={{ fontSize: 11.5, color: 'var(--espresso-soft)' }}>✓ Foto cargada desde tu equipo</span>
              )}
            </div>
          </div>

          <div className="form-field">
            <label>Categoría</label>
            <select value={form.categoriaId} onChange={(e) => setForm({ ...form, categoriaId: e.target.value })}>
              <option value="">Sin categoría</option>
              {categorias.map((c) => <option key={c.CategoriaId} value={c.CategoriaId}>{c.Nombre}</option>)}
            </select>
          </div>

          <div className="form-grid-2col">
            <div className="form-field">
              <label>Precio de costo (Q)</label>
              <input type="number" step="0.01" min="0" value={form.precioCosto} onChange={(e) => setForm({ ...form, precioCosto: e.target.value })} required />
            </div>
            <div className="form-field">
              <label>Precio de venta (Q)</label>
              <input type="number" step="0.01" min="0" value={form.precioVenta} onChange={(e) => setForm({ ...form, precioVenta: e.target.value })} required />
            </div>
          </div>

          <div className="form-grid-2col">
            <div className="form-field">
              <label>Stock inicial</label>
              <input type="number" min="0" value={form.stockActual} onChange={(e) => setForm({ ...form, stockActual: e.target.value })} required disabled={!!editando} />
            </div>
            <div className="form-field">
              <label>Stock mínimo</label>
              <input type="number" min="0" value={form.stockMinimo} onChange={(e) => setForm({ ...form, stockMinimo: e.target.value })} required />
            </div>
          </div>

          {editando && (
            <p style={{ fontSize: 12, color: 'var(--espresso-soft)', marginTop: -6, marginBottom: 14 }}>
              Para ajustar el stock existente usa el módulo de Inventario.
            </p>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 8 }}>
            <button type="button" className="btn btn-secondary" onClick={() => setModalAbierto(false)}>Cancelar</button>
            <button type="submit" className="btn btn-primary" disabled={guardando}>
              {guardando ? 'Guardando…' : 'Guardar producto'}
            </button>
          </div>
        </form>
      </Modal>

      <Modal
        open={modalCategorias}
        onClose={() => { setModalCategorias(false); setEditandoCategoria(null); setNuevaCategoria({ nombre: '', descripcion: '' }); }}
        title="Gestionar categorías"
        width={480}
      >
        <form onSubmit={handleGuardarCategoria} style={{ marginBottom: 18 }}>
          <div className="form-field">
            <label>{editandoCategoria ? 'Editar nombre' : 'Nueva categoría'}</label>
            <input
              value={nuevaCategoria.nombre}
              onChange={(e) => setNuevaCategoria({ ...nuevaCategoria, nombre: e.target.value })}
              placeholder="Ej. Carteras, Fajas…"
              required
            />
          </div>
          <div className="form-field">
            <label>Descripción (opcional)</label>
            <input
              value={nuevaCategoria.descripcion}
              onChange={(e) => setNuevaCategoria({ ...nuevaCategoria, descripcion: e.target.value })}
            />
          </div>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            {editandoCategoria && (
              <button type="button" className="btn btn-secondary" onClick={() => { setEditandoCategoria(null); setNuevaCategoria({ nombre: '', descripcion: '' }); }}>
                Cancelar edición
              </button>
            )}
            <button type="submit" className="btn btn-primary" disabled={guardandoCategoria}>
              {guardandoCategoria ? 'Guardando…' : editandoCategoria ? 'Actualizar' : 'Agregar'}
            </button>
          </div>
        </form>

        <div style={{ borderTop: '1px solid var(--border)', paddingTop: 14 }}>
          {categorias.length === 0 ? (
            <p style={{ color: 'var(--espresso-soft)', fontSize: 13 }}>Todavía no hay categorías.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {categorias.map((c) => (
                <div key={c.CategoriaId} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 10px', border: '1px solid var(--border)', borderRadius: 8 }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 13.5 }}>{c.Nombre}</div>
                    {c.Descripcion && <div style={{ fontSize: 11.5, color: 'var(--espresso-soft)' }}>{c.Descripcion}</div>}
                  </div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button className="btn btn-secondary" style={{ padding: '4px 10px', fontSize: 12 }} onClick={() => iniciarEdicionCategoria(c)}>Editar</button>
                    <button className="btn btn-danger" style={{ padding: '4px 10px', fontSize: 12 }} onClick={() => handleEliminarCategoria(c)}>Eliminar</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </Modal>

      {mensaje && <div className={`toast ${mensaje.tipo}`}>{mensaje.texto}</div>}
    </AppLayout>
  );
}
