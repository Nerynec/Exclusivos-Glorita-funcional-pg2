
import React from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import { useCarrito } from '../../context/CarritoContext';

function BotonCarrito() {
  const { cantidadTotal } = useCarrito();
  const navigate = useNavigate();

  return (
    <button
      onClick={() => navigate('/ventas')}
      className="btn btn-secondary cart-button"
      title="Ver carrito de ventas"
      style={{ position: 'relative' }}
    >
      🛒 Carrito
      {cantidadTotal > 0 && (
        <span className="cart-badge">{cantidadTotal}</span>
      )}
    </button>
  );
}

export default function AppLayout({ title, subtitle, actions, children }) {
  return (
    <div
      className="app-layout"
      style={{
        display: 'flex',
        minHeight: '100vh',
        width: '100%',
      }}
    >
      <Sidebar />

      <main
        className="app-main"
        style={{
          flex: 1,
          padding: '32px 40px',
          maxWidth: '100%',
          overflowX: 'hidden',
          minWidth: 0,
          boxSizing: 'border-box',
        }}
      >
        {(title || actions) && (
          <div
            className="page-header"
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              marginBottom: 28,
              flexWrap: 'wrap',
              gap: 12,
            }}
          >
            <div className="page-header-info">
              {title && (
                <h1
                  style={{
                    fontSize: 24,
                    margin: 0,
                  }}
                >
                  {title}
                </h1>
              )}

              {subtitle && (
                <p
                  style={{
                    color: 'var(--espresso-soft)',
                    margin: 0,
                    fontSize: 14,
                  }}
                >
                  {subtitle}
                </p>
              )}
            </div>

            <div
              className="page-actions"
              style={{
                display: 'flex',
                gap: 10,
                alignItems: 'center',
                flexWrap: 'wrap',
              }}
            >
              <BotonCarrito />
              {actions}
            </div>
          </div>
        )}

        <div className="page-content">
          {children}
        </div>
      </main>
    </div>
  );
}

