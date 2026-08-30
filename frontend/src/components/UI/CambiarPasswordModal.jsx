import React, { useState } from 'react';
import Modal from './Modal';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';

export default function CambiarPasswordModal({ open, onClose }) {
  const { usuario } = useAuth();
  const [actual, setActual] = useState('');
  const [nueva, setNueva] = useState('');
  const [confirmar, setConfirmar] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');
  const [exito, setExito] = useState(false);

  function cerrar() {
    setActual(''); setNueva(''); setConfirmar(''); setError(''); setExito(false);
    onClose();
  }

  async function handleSubmit(e) {
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
      setTimeout(cerrar, 1600);
    } catch (err) {
      setError(err.response?.data?.mensaje || 'No se pudo cambiar la contraseña.');
    } finally {
      setGuardando(false);
    }
  }

  return (
    <Modal open={open} onClose={cerrar} title="Cambiar mi contraseña" width={420}>
      {exito ? (
        <div className="badge badge-success" style={{ width: '100%', padding: '12px 14px', justifyContent: 'center' }}>
          Contraseña actualizada correctamente
        </div>
      ) : (
        <form onSubmit={handleSubmit} autoComplete="on">
          {/* Campo oculto para que el gestor de contraseñas del navegador
              asocie correctamente el formulario con el usuario (evita que
              muestre su propio globo de sugerencias fuera de lugar). */}
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
            <button type="button" className="btn btn-secondary" onClick={cerrar}>Cancelar</button>
            <button type="submit" className="btn btn-primary" disabled={guardando}>{guardando ? 'Guardando…' : 'Cambiar contraseña'}</button>
          </div>
        </form>
      )}
    </Modal>
  );
}
