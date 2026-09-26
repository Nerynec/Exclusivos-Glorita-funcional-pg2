import React, { useState, useEffect, useRef } from 'react';
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

// Ícono de sobre (correo) para el paso de verificación en dos pasos.
function IconCorreo() {
  return (
    <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="4" width="20" height="16" rx="2" />
      <path d="m22 6-10 7L2 6" />
    </svg>
  );
}

const COOLDOWN_REENVIO_SEGUNDOS = 30;

export default function Login() {
  const { iniciarLogin, reenviarCodigo, verificarCodigo } = useAuth();
  const navigate = useNavigate();

  // 'credenciales' -> 'codigo' -> listo
  const [paso, setPaso] = useState('credenciales');

  const [correo, setCorreo] = useState('admin@glorita.com');
  const [contrasena, setContrasena] = useState('');
  const [mostrarContrasena, setMostrarContrasena] = useState(false);

  const [codigo, setCodigo] = useState('');
  const [correoOculto, setCorreoOculto] = useState('');

  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const codigoInputRef = useRef(null);

  useEffect(() => {
    if (cooldown <= 0) return undefined;
    const t = setInterval(() => setCooldown((v) => Math.max(0, v - 1)), 1000);
    return () => clearInterval(t);
  }, [cooldown]);

  useEffect(() => {
    if (paso === 'codigo') codigoInputRef.current?.focus();
  }, [paso]);

  async function handleCredencialesSubmit(e) {
    e.preventDefault();
    setError('');
    setCargando(true);
    try {
      const data = await iniciarLogin(correo, contrasena);
      setCorreoOculto(data.correoOculto || '');
      setCooldown(COOLDOWN_REENVIO_SEGUNDOS);
      setPaso('codigo');
    } catch (err) {
      setError(err.response?.data?.mensaje || 'No se pudo iniciar sesión. Verifica tu conexión con la API.');
    } finally {
      setCargando(false);
    }
  }

  async function handleCodigoSubmit(e) {
    e.preventDefault();
    setError('');
    setCargando(true);
    try {
      await verificarCodigo(codigo);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.mensaje || 'No se pudo verificar el código.');
    } finally {
      setCargando(false);
    }
  }

  async function handleReenviar() {
    if (cooldown > 0) return;
    setError('');
    try {
      const data = await reenviarCodigo();
      setCorreoOculto(data.correoOculto || correoOculto);
      setCooldown(COOLDOWN_REENVIO_SEGUNDOS);
    } catch (err) {
      setError(err.response?.data?.mensaje || 'No se pudo reenviar el código.');
    }
  }

  function volverAInicio() {
    setError('');
    setContrasena('');
    setCodigo('');
    setPaso('credenciales');
  }

  return (
    <div className="login-page">
      <div className="login-glow" />
      <div className="login-panel">
        <div className="login-brand login-fade-in">
          <img src="/logo-glorita.png" alt="Exclusivos Glorita" className="brand-logo-lg" />
          <h1>Exclusivos Glorita</h1>
        </div>

        {paso === 'credenciales' && (
          <form
            className={`login-form card login-fade-in${error ? ' login-error-shake' : ''}`}
            onSubmit={handleCredencialesSubmit}
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
        )}

        {paso === 'codigo' && (
          <form
            className={`login-form card login-fade-in${error ? ' login-error-shake' : ''}`}
            onSubmit={handleCodigoSubmit}
          >
            <div className="login-2fa-icon"><IconCorreo /></div>
            <h2 style={{ fontSize: 18, marginBottom: 6, textAlign: 'center' }}>Ingresá el código</h2>
            <p style={{ fontSize: 13, color: 'var(--espresso-soft)', textAlign: 'center', marginBottom: 18 }}>
              Enviamos un código de 6 dígitos a tu correo <strong>{correoOculto}</strong>.
            </p>

            <div className="form-field">
              <label htmlFor="codigo">Código de verificación</label>
              <input
                id="codigo"
                ref={codigoInputRef}
                type="text"
                inputMode="numeric"
                pattern="[0-9]{6}"
                maxLength={6}
                placeholder="000000"
                className="login-codigo-input"
                value={codigo}
                onChange={(e) => setCodigo(e.target.value.replace(/\D/g, '').slice(0, 6))}
                autoComplete="one-time-code"
                required
                autoFocus
              />
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
              disabled={cargando || codigo.length !== 6}
            >
              {cargando && <span className="spinner spinner-light" style={{ width: 14, height: 14, borderWidth: 2 }} />}
              {cargando ? 'Verificando...' : 'Verificar e ingresar'}
            </button>

            <button
              type="button"
              className="login-link-btn"
              onClick={handleReenviar}
              disabled={cooldown > 0}
            >
              {cooldown > 0 ? `Reenviar código (${cooldown}s)` : 'Reenviar código'}
            </button>
            <button type="button" className="login-link-btn" onClick={volverAInicio}>
              Volver
            </button>
          </form>
        )}

        <p className="login-fade-in" style={{ fontSize: 11, color: '#C9B79E', marginTop: 20, textAlign: 'center' }}>
          © {new Date().getFullYear()} Nery Orlando Martin Vasquez. Todos los derechos reservados.
        </p>
      </div>
    </div>
  );
}
