import React, { useState } from 'react';
import Modal from './Modal';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import { redimensionarImagen } from '../../utils/redimensionarImagen';

export default function PerfilModal({ open, onClose }) {
  const { usuario, actualizarFotoLocal } = useAuth();

  // --- Foto de perfil ---
  const [previaFoto, setPreviaFoto] = useState(null);
  const [subiendoFoto, setSubiendoFoto] = useState(false);
  const [mensajeFoto, setMensajeFoto] = useState(null);

  // --- Cambio de contraseña ---
  const [actual, setActual] = useState('');
  const [nueva, setNueva] = useState('');
  const [confirmar, setConfirmar] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');
  const [exito, setExito] = useState(false);

  function cerrar() {
    setActual(''); setNueva(''); setConfirmar(''); setError(''); setExito(false);
    setPreviaFoto(null); setMensajeFoto(null);
    onClose();
  }

  async function handleSeleccionarFoto(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setMensajeFoto({ tipo: 'error', texto: 'Elegí un archivo de imagen (jpg, png…).' });
      return;
    }
    try {
      const dataUrl = await redimensionarImagen(file);
      setPreviaFoto(dataUrl);
      setMensajeFoto(null);
    } catch (err) {
      setMensajeFoto({ tipo: 'error', texto: 'No se pudo leer esa imagen.' });
    }
  }

  async function handleGuardarFoto() {
    if (!previaFoto) return;
    setSubiendoFoto(true);
    setMensajeFoto(null);
    try {
      await api.put('/auth/foto', { fotoBase64: previaFoto });
      actualizarFotoLocal(previaFoto);
      setMensajeFoto({ tipo: 'success', texto: 'Foto actualizada.' });
      setPreviaFoto(null);
    } catch (err) {
      setMensajeFoto({ tipo: 'error', texto: err.response?.data?.mensaje || 'No se pudo guardar la foto.' });
    } finally {
      setSubiendoFoto(false);
    }
  }

  async function handleSubmitPassword(e) {
    e.preventDefault();
    setError('');
    if (nueva !== confirmar) {
      setError('La confirmación no coincide con la contraseña nueva.');
      return;
    }
    setGuardando(true);
    try {
      await api.put('/auth/password', { actual, nueva });
      setExito(true);
      setActual(''); setNueva(''); setConfirmar('');
    } catch (err) {
      setError(err.response?.data?.mensaje || 'No se pudo cambiar la contraseña.');
    } finally {
      setGuardando(false);
    }
  }

  const fotoAMostrar = previaFoto || usuario?.fotoUrl;

  return (
    <Modal open={open} onClose={cerrar} title="Mi perfil" width={420}>
      {/* ---------- Foto de perfil ---------- */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, marginBottom: 24, paddingBottom: 22, borderBottom: '1px solid var(--border)' }}>
        <div style={{
          width: 88, height: 88, borderRadius: '50%', overflow: 'hidden',
          background: 'var(--saddle-light)', display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 30, fontWeight: 700, color: 'var(--saddle-dark)', border: '3px solid var(--surface-muted)',
        }}>
          {fotoAMostrar
            ? <img src={fotoAMostrar} alt="Foto de perfil" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            : (usuario?.nombre?.charAt(0) || '?')}
        </div>

        <label className="btn btn-secondary" style={{ cursor: 'pointer' }}>
          Elegir foto…
          <input type="file" accept="image/*" onChange={handleSeleccionarFoto} style={{ display: 'none' }} />
        </label>

        {previaFoto && (
          <button className="btn btn-primary" onClick={handleGuardarFoto} disabled={subiendoFoto}>
            {subiendoFoto ? 'Guardando…' : 'Guardar foto'}
          </button>
        )}

        {mensajeFoto && (
          <div className={`badge ${mensajeFoto.tipo === 'error' ? 'badge-danger' : 'badge-success'}`} style={{ width: '100%', justifyContent: 'center', padding: '8px 12px' }}>
            {mensajeFoto.texto}
          </div>
        )}
      </div>

      {/* ---------- Cambiar contraseña ---------- */}
      <h4 style={{ fontSize: 14, marginBottom: 12, color: 'var(--espresso-soft)', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
        Cambiar contraseña
      </h4>

      {exito ? (
        <div className="badge badge-success" style={{ width: '100%', padding: '12px 14px', justifyContent: 'center' }}>
          Contraseña actualizada correctamente
        </div>
      ) : (
        <form onSubmit={handleSubmitPassword} autoComplete="on">
          <input type="text" name="username" autoComplete="username" value={usuario?.correo || ''} readOnly hidden />

          <div className="form-field">
            <label>Contraseña actual</label>
            <input type="password" autoComplete="current-password" value={actual} onChange={(e) => setActual(e.target.value)} required />
          </div>
          <div className="form-field">
            <label>Contraseña nueva</label>
            <input type="password" autoComplete="new-password" value={nueva} onChange={(e) => setNueva(e.target.value)} required minLength={6} />
          </div>
          <div className="form-field">
            <label>Confirmar contraseña nueva</label>
            <input type="password" autoComplete="new-password" value={confirmar} onChange={(e) => setConfirmar(e.target.value)} required minLength={6} />
          </div>
          {error && (
            <div className="badge badge-danger" style={{ width: '100%', padding: '10px 12px', marginBottom: 14 }}>{error}</div>
          )}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 8 }}>
            <button type="button" className="btn btn-secondary" onClick={cerrar}>Cerrar</button>
            <button type="submit" className="btn btn-primary" disabled={guardando}>{guardando ? 'Guardando…' : 'Cambiar contraseña'}</button>
          </div>
        </form>
      )}
    </Modal>
  );
}
