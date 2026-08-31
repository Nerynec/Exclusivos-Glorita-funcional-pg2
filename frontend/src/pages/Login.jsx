import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Login.css';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [correo, setCorreo] = useState('admin@glorita.com');
  const [contrasena, setContrasena] = useState('');
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setCargando(true);
    try {
      await login(correo, contrasena);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.mensaje || 'No se pudo iniciar sesión. Verifica tu conexión con la API.');
    } finally {
      setCargando(false);
    }
  }

  return (
    <div className="login-page">
      <div className="login-panel">
        <div className="login-brand">
          <img src="/logo-glorita.png" alt="Exclusivos Glorita" className="brand-logo-lg" />
          <h1>Exclusivos Glorita San Lucas Toliman Solola</h1>
        </div>

        <form className="login-form card" onSubmit={handleSubmit}>
          <h2 style={{ fontSize: 18, marginBottom: 18 }}>Iniciar sesión</h2>

          <div className="form-field">
            <label htmlFor="correo">Correo electrónico</label>
            <input
              id="correo"
              type="email"
              value={correo}
              onChange={(e) => setCorreo(e.target.value)}
              required
              autoFocus
            />
          </div>

          <div className="form-field">
            <label htmlFor="contrasena">Contraseña</label>
            <input
              id="contrasena"
              type="password"
              value={contrasena}
              onChange={(e) => setContrasena(e.target.value)}
              required
            />
          </div>

          {error && (
            <div className="badge badge-danger" style={{ width: '100%', padding: '10px 12px', marginBottom: 14 }}>
              {error}
            </div>
          )}

          <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '11px 16px' }} disabled={cargando}>
            {cargando ? 'Ingresando...' : 'Ingresar'}
          </button>

          <p style={{ fontSize: 12.5, color: 'var(--espresso-soft)', marginTop: 16, textAlign: 'center' }}>
            Usuario de prueba: <strong>admin@glorita.com</strong> · Contraseña: <strong>Glorita2026*</strong>
          </p>
        </form>
      </div>
    </div>
  );
}
