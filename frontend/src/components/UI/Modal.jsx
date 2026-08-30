import React from 'react';
import { createPortal } from 'react-dom';

export default function Modal({ open, onClose, title, children, width = 480 }) {
  if (!open) return null;

  // Se monta con un Portal directo en <body>, fuera del árbol normal de
  // componentes. Así el modal nunca queda "atrapado" dentro del contexto de
  // apilamiento (stacking context) de un ancestro con position: sticky/fixed
  // u otras propiedades que puedan hacer que otros elementos (como el
  // tooltip de una gráfica) se dibujen por encima y bloqueen los clics.
  return createPortal(
    <div
      style={{
        position: 'fixed', inset: 0, background: 'rgba(46,32,24,0.45)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
        padding: 20,
      }}
      onClick={onClose}
    >
      <div
        className="card"
        style={{ width, maxWidth: '100%', maxHeight: '88vh', overflowY: 'auto', padding: 24 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
          <h3 style={{ fontSize: 18 }}>{title}</h3>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', fontSize: 20, color: 'var(--espresso-soft)', lineHeight: 1 }}
            aria-label="Cerrar"
          >
            ×
          </button>
        </div>
        {children}
      </div>
    </div>,
    document.body,
  );
}
