import React, { useEffect, useState, useCallback } from 'react';
import AppLayout from '../components/Layout/AppLayout';
import Modal from '../components/UI/Modal';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

const USUARIO_VACIO = { nombreCompleto: '', correo: '', contrasena: '', roleId: '' };

export default function Usuarios() {
  const { usuario: sesion } = useAuth();
  const [usuarios, setUsuarios] = useState([]);
  const [roles, setRoles] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [editando, setEditando] = useState(null);
  const [form, setForm] = useState(USUARIO_VACIO);
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState(null);
  const [modalReset, setModalReset] = useState(null);
  const [passwordNueva, setPasswordNueva] = useState('');

  const cargarTodo = useCallback(() => {
    setCargando(true);
    Promise.all([api.get('/usuarios'), api.get('/usuarios/roles')])
      .then(([u, r]) => { setUsuarios(u.data); setRoles(r.data); })
      .catch(() => setMensaje({ tipo: 'error', texto: 'No se pudieron cargar los usuarios.' }))
      .finally(() => setCargando(false));
  }, []);

  useEffect(() => { cargarTodo(); }, [cargarTodo]);
  useEffect(() => {
    if (!mensaje) return;
    const t = setTimeout(() => setMensaje(null), 3500);
    return () => clearTimeout(t);
  }, [mensaje]);

  function abrirNuevo() {
    setEditando(null);
    setForm(USUARIO_VACIO);
    setModalAbierto(true);
  }

  function abrirEditar(u) {
    setEditando(u);
    setForm({ nombreCompleto: u.NombreCompleto, correo: u.Correo, contrasena: '', roleId: u.RoleId });
    setModalAbierto(true);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setGuardando(true);
    try {
      if (editando) {
        await api.put(`/usuarios/${editando.UsuarioId}`, {
          nombreCompleto: form.nombreCompleto, roleId: parseInt(form.roleId, 10), activo: editando.Activo,
        });
        setMensaje({ tipo: 'success', texto: 'Usuario actualizado correctamente.' });
      } else {
        await api.post('/usuarios', { ...form, roleId: parseInt(form.roleId, 10) });
        setMensaje({ tipo: 'success', texto: 'Usuario creado correctamente.' });
      }
      setModalAbierto(false);
      cargarTodo();
    } catch (err) {
      setMensaje({ tipo: 'error', texto: err.response?.data?.mensaje || 'No se pudo guardar el usuario.' });
    } finally {
      setGuardando(false);
    }
  }

  async function toggleActivo(u) {
    try {
      await api.put(`/usuarios/${u.UsuarioId}`, {
        nombreCompleto: u.NombreCompleto, roleId: u.RoleId, activo: !u.Activo,
      });
      cargarTodo();
    } catch (err) {
      setMensaje({ tipo: 'error', texto: err.response?.data?.mensaje || 'No se pudo cambiar el estado.' });
    }
  }

  async function handleResetPassword(e) {
    e.preventDefault();
    setGuardando(true);
    try {
      await api.put(`/usuarios/${modalReset.UsuarioId}/reset-password`, { contrasenaNueva: passwordNueva });
      setMensaje({ tipo: 'success', texto: `Contraseña restablecida para ${modalReset.NombreCompleto}.` });
      setModalReset(null);
      setPasswordNueva('');
    } catch (err) {
      setMensaje({ tipo: 'error', texto: err.response?.data?.mensaje || 'No se pudo restablecer la contraseña.' });
    } finally {
      setGuardando(false);
    }
  }

  return (
    <AppLayout
      title="Usuarios"
      subtitle="Administradores y empleados con acceso al sistema"
      actions={<button className="btn btn-primary" onClick={abrirNuevo}>+ Nuevo usuario</button>}
    >
      <div className="card" style={{ overflowX: 'auto' }}>
        {cargando ? (
          <div className="empty-state"><div className="spinner" style={{ margin: '0 auto' }} /></div>
        ) : (
          <table>
            <thead>
              <tr><th></th><th>Nombre</th><th>Correo</th><th>Rol</th><th>Estado</th><th></th></tr>
            </thead>
            <tbody>
              {usuarios.map((u) => (
                <tr key={u.UsuarioId}>
                  <td style={{ width: 44 }}>
                    <div style={{
                      width: 32, height: 32, borderRadius: '50%', overflow: 'hidden',
                      background: 'var(--saddle-light)', color: 'var(--saddle-dark)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 13,
                    }}>
                      {u.FotoUrl ? <img src={u.FotoUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : u.NombreCompleto?.charAt(0)}
                    </div>
                  </td>
                  <td style={{ fontWeight: 600 }}>{u.NombreCompleto}{u.UsuarioId === sesion?.id && <span style={{ fontWeight: 400, color: 'var(--espresso-soft)' }}> (vos)</span>}</td>
                  <td>{u.Correo}</td>
                  <td>{u.NombreRol}</td>
                  <td>{u.Activo ? <span className="badge badge-success">Activo</span> : <span className="badge badge-neutral">Inactivo</span>}</td>
                  <td>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      <button className="btn btn-secondary" style={{ padding: '6px 12px' }} onClick={() => abrirEditar(u)}>Editar</button>
                      <button className="btn btn-secondary" style={{ padding: '6px 12px' }} onClick={() => setModalReset(u)}>Restablecer clave</button>
                      {u.UsuarioId !== sesion?.id && (
                        <button className="btn btn-danger" style={{ padding: '6px 12px' }} onClick={() => toggleActivo(u)}>
                          {u.Activo ? 'Desactivar' : 'Activar'}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <Modal open={modalAbierto} onClose={() => setModalAbierto(false)} title={editando ? 'Editar usuario' : 'Nuevo usuario'}>
        <form onSubmit={handleSubmit}>
          <div className="form-field">
            <label>Nombre completo</label>
            <input value={form.nombreCompleto} onChange={(e) => setForm({ ...form, nombreCompleto: e.target.value })} required />
          </div>
          <div className="form-field">
            <label>Correo electrónico</label>
            <input type="email" value={form.correo} onChange={(e) => setForm({ ...form, correo: e.target.value })} required disabled={!!editando} />
          </div>
          {!editando && (
            <div className="form-field">
              <label>Contraseña inicial</label>
              <input type="password" value={form.contrasena} onChange={(e) => setForm({ ...form, contrasena: e.target.value })} required minLength={6} />
            </div>
          )}
          <div className="form-field">
            <label>Rol</label>
            <select value={form.roleId} onChange={(e) => setForm({ ...form, roleId: e.target.value })} required>
              <option value="">Selecciona un rol</option>
              {roles.map((r) => <option key={r.RoleId} value={r.RoleId}>{r.NombreRol}</option>)}
            </select>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 8 }}>
            <button type="button" className="btn btn-secondary" onClick={() => setModalAbierto(false)}>Cancelar</button>
            <button type="submit" className="btn btn-primary" disabled={guardando}>{guardando ? 'Guardando…' : 'Guardar'}</button>
          </div>
        </form>
      </Modal>

      <Modal open={!!modalReset} onClose={() => setModalReset(null)} title={`Restablecer clave de ${modalReset?.NombreCompleto || ''}`}>
        <form onSubmit={handleResetPassword}>
          <div className="form-field">
            <label>Contraseña nueva</label>
            <input type="password" value={passwordNueva} onChange={(e) => setPasswordNueva(e.target.value)} required minLength={6} />
          </div>
          <p style={{ fontSize: 12.5, color: 'var(--espresso-soft)', marginTop: -6 }}>
            Compartísela a la persona para que inicie sesión con esta clave nueva.
          </p>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 8 }}>
            <button type="button" className="btn btn-secondary" onClick={() => setModalReset(null)}>Cancelar</button>
            <button type="submit" className="btn btn-primary" disabled={guardando}>{guardando ? 'Guardando…' : 'Restablecer'}</button>
          </div>
        </form>
      </Modal>

      {mensaje && <div className={`toast ${mensaje.tipo}`}>{mensaje.texto}</div>}
    </AppLayout>
  );
}
