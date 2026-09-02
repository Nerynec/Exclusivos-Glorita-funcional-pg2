import React, { Suspense, lazy } from 'react';
import { Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { CarritoProvider } from './context/CarritoContext';
import ProtectedRoute from './components/Layout/ProtectedRoute';

// Cada página se carga solo cuando el usuario entra a esa sección, en vez
// de descargar todo el sistema de una sola vez al abrir la app. Esto hace
// que el login y la primera carga sean bastante más rápidos.
const Login = lazy(() => import('./pages/Login'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Productos = lazy(() => import('./pages/Productos'));
const Inventario = lazy(() => import('./pages/Inventario'));
const Ventas = lazy(() => import('./pages/Ventas'));
const Reportes = lazy(() => import('./pages/Reportes'));
const Usuarios = lazy(() => import('./pages/Usuarios'));

function CargandoPagina() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
      <div className="spinner" />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <CarritoProvider>
        <Suspense fallback={<CargandoPagina />}>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/productos" element={<ProtectedRoute><Productos /></ProtectedRoute>} />
            <Route path="/inventario" element={<ProtectedRoute soloAdmin><Inventario /></ProtectedRoute>} />
            <Route path="/ventas" element={<ProtectedRoute><Ventas /></ProtectedRoute>} />
            <Route path="/reportes" element={<ProtectedRoute soloAdmin><Reportes /></ProtectedRoute>} />
            <Route path="/usuarios" element={<ProtectedRoute soloAdmin><Usuarios /></ProtectedRoute>} />
          </Routes>
        </Suspense>
      </CarritoProvider>
    </AuthProvider>
  );
}
