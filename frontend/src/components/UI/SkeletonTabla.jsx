import React from 'react';

// Filas de relleno con la forma de una tabla real, para reemplazar el
// spinner genérico en las páginas que cargan una tabla (Ventas,
// Inventario, Usuarios, Reportes). "columnas" son anchos relativos, para
// que cada columna se vea creíble en vez de que todas las celdas midan
// lo mismo.
export default function SkeletonTabla({ columnas = ['70%', '55%', '40%', '30%'], filas = 5 }) {
  return (
    <div style={{ padding: 18 }} aria-busy="true" aria-label="Cargando datos">
      {Array.from({ length: filas }).map((_, i) => (
        <div
          key={i}
          style={{
            display: 'flex', gap: 24, padding: '10px 0',
            borderBottom: i < filas - 1 ? '1px solid var(--border)' : 'none',
          }}
        >
          {columnas.map((w, j) => (
            <div key={j} className="skeleton" style={{ height: 13, width: w, flexShrink: 0 }} />
          ))}
        </div>
      ))}
    </div>
  );
}
