import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import api from '../api/axios';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(() => {
    const stored = localStorage.getItem('glorita_usuario');
    return stored ? JSON.parse(stored) : null;
  });

  // El token de "pre-autenticación" (segundo factor pendiente) vive solo
  // en memoria, nunca en localStorage: es de corta duración (10 min) y no
  // tiene sentido que sobreviva a un refresco de página — si eso pasa, la
  // persona simplemente vuelve a iniciar sesión desde cero.
  const preAuthTokenRef = useRef(null);

  // Paso 1 del login: valida correo y contraseña. El backend manda el
  // código de verificación al correo del usuario — nunca entrega la
  // sesión completa en este paso, porque el doble factor de autenticación
  // es obligatorio para todos.
  const iniciarLogin = useCallback(async (correo, contrasena) => {
    const { data } = await api.post('/auth/login', { correo, contrasena });
    if (data.preAuthToken) preAuthTokenRef.current = data.preAuthToken;
    return data;
  }, []);

  const reenviarCodigo = useCallback(async () => {
    const { data } = await api.post(
      '/auth/reenviar-codigo',
      {},
      { headers: { Authorization: `Bearer ${preAuthTokenRef.current}` } },
    );
    return data;
  }, []);

  // Último paso: si el código de 6 dígitos es correcto, acá sí se entrega
  // la sesión completa (token normal + datos del usuario).
  const verificarCodigo = useCallback(async (codigo) => {
    const { data } = await api.post(
      '/auth/verificar-codigo',
      { codigo },
      { headers: { Authorization: `Bearer ${preAuthTokenRef.current}` } },
    );
    preAuthTokenRef.current = null;
    localStorage.setItem('glorita_token', data.token);
    localStorage.setItem('glorita_usuario', JSON.stringify(data.usuario));
    setUsuario(data.usuario);
    return data.usuario;
  }, []);

  const logout = useCallback(async () => {
    try {
      // Avisamos al backend para que invalide este token de inmediato del
      // lado del servidor (no solo borrarlo del navegador). Si esta
      // petición falla (sin internet, servidor caído, etc.) igual
      // cerramos la sesión localmente para no dejar a la persona
      // "trabada" sin poder salir.
      await api.post('/auth/logout');
    } catch {
      // Se ignora: el cierre de sesión local sigue adelante de todas formas.
    } finally {
      localStorage.removeItem('glorita_token');
      localStorage.removeItem('glorita_usuario');
      setUsuario(null);
    }
  }, []);

  // Actualiza la foto de perfil en memoria y en localStorage sin necesidad
  // de volver a iniciar sesión.
  const actualizarFotoLocal = useCallback((fotoUrl) => {
    setUsuario((prev) => {
      const actualizado = { ...prev, fotoUrl };
      localStorage.setItem('glorita_usuario', JSON.stringify(actualizado));
      return actualizado;
    });
  }, []);

  const esAdministrador = usuario?.rol === 'Administrador';

  return (
    <AuthContext.Provider
      value={{
        usuario, logout, esAdministrador, actualizarFotoLocal,
        iniciarLogin, reenviarCodigo, verificarCodigo,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
