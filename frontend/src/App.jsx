import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { CarritoProvider } from './context/CarritoContext';
import ProtectedRoute from './components/Layout/ProtectedRoute';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Productos from './pages/Productos';
import Inventario from './pages/Inventario';
import Ventas from './pages/Ventas';
import Reportes from './pages/Reportes';
import Usuarios from './pages/Usuarios';

export default function App() {
  return (
    <AuthProvider>
      <CarritoProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/productos" element={<ProtectedRoute><Productos /></ProtectedRoute>} />
          <Route path="/inventario" element={<ProtectedRoute soloAdmin><Inventario /></ProtectedRoute>} />
          <Route path="/ventas" element={<ProtectedRoute><Ventas /></ProtectedRoute>} />
          <Route path="/reportes" element={<ProtectedRoute soloAdmin><Reportes /></ProtectedRoute>} />
          <Route path="/usuarios" element={<ProtectedRoute soloAdmin><Usuarios /></ProtectedRoute>} />
        </Routes>
      </CarritoProvider>
    </AuthProvider>
  );
}
