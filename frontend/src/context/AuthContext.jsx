import React, { createContext, useContext, useState, useCallback } from 'react';
import api from '../api/axios';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(() => {
    const stored = localStorage.getItem('glorita_usuario');
    return stored ? JSON.parse(stored) : null;
  });

  const login = useCallback(async (correo, contrasena) => {
    const { data } = await api.post('/auth/login', { correo, contrasena });
    localStorage.setItem('glorita_token', data.token);
    localStorage.setItem('glorita_usuario', JSON.stringify(data.usuario));
    setUsuario(data.usuario);
    return data.usuario;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('glorita_token');
    localStorage.removeItem('glorita_usuario');
    setUsuario(null);
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
    <AuthContext.Provider value={{ usuario, login, logout, esAdministrador, actualizarFotoLocal }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
