import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function ProtectedRoute({ children, soloAdmin = false }) {
  const { usuario, esAdministrador } = useAuth();
  if (!usuario) {
    return <Navigate to="/login" replace />;
  }
  if (soloAdmin && !esAdministrador) {
    return <Navigate to="/" replace />;
  }
  return children;
}
