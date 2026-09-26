import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Login.css';

// Iconos de ojo abierto/cerrado dibujados a mano (sin dependencias nuevas)
// para el botón de mostrar/ocultar contraseña.
function IconEye() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function IconEyeOff() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.94 10.94 0 0 1 12 19c-7 0-11-7-11-7a20.6 20.6 0 0 1 5.06-5.94M9.9 4.24A10.94 10.94 0 0 1 12 5c7 0 11 7 11 7a20.6 20.6 0 0 1-2.16 3.19M14.12 14.12a3 3 0 1 1-4.24-4.24" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  );
}

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [correo, setCorreo] = useState('admin@glorita.com');
  const [contrasena, setContrasena] = useState('');
  const [mostrarContrasena, setMostrarContrasena] = useState(false);
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
      <div className="login-glow" />
      <div className="login-panel">
        <div className="login-brand login-fade-in">
          <img src="/logo-glorita.png" alt="Exclusivos Glorita" className="brand-logo-lg" />
          <h1>Exclusivos Glorita</h1>
        </div>

        <form
          className={`login-form card login-fade-in${error ? ' login-error-shake' : ''}`}
          onSubmit={handleSubmit}
        >
          <h2 style={{ fontSize: 18, marginBottom: 18 }}>Iniciar sesión</h2>

          <div className="form-field">
            <label htmlFor="correo">Correo electrónico</label>
            <input
              id="correo"
              type="email"
              value={correo}
              onChange={(e) => setCorreo(e.target.value)}
              autoComplete="username"
              required
              autoFocus
            />
          </div>

          <div className="form-field">
            <label htmlFor="contrasena">Contraseña</label>
            <div className="password-field-wrapper">
              <input
                id="contrasena"
                type={mostrarContrasena ? 'text' : 'password'}
                value={contrasena}
                onChange={(e) => setContrasena(e.target.value)}
                autoComplete="current-password"
                required
              />
              <button
                type="button"
                className="password-toggle-btn"
                onClick={() => setMostrarContrasena((v) => !v)}
                aria-label={mostrarContrasena ? 'Ocultar contraseña' : 'Mostrar contraseña'}
              >
                {mostrarContrasena ? <IconEyeOff /> : <IconEye />}
              </button>
            </div>
          </div>

          {error && (
            <div className="badge badge-danger" style={{ width: '100%', padding: '10px 12px', marginBottom: 14 }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', justifyContent: 'center', padding: '11px 16px', gap: 8 }}
            disabled={cargando}
          >
            {cargando && <span className="spinner spinner-light" style={{ width: 14, height: 14, borderWidth: 2 }} />}
            {cargando ? 'Ingresando...' : 'Ingresar'}
          </button>
        </form>

        <p className="login-fade-in" style={{ fontSize: 11, color: '#C9B79E', marginTop: 20, textAlign: 'center' }}>
          © {new Date().getFullYear()} Nery Orlando Martin Vasquez. Todos los derechos reservados.
        </p>
      </div>
    </div>
  );
}
