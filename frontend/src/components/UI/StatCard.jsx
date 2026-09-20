import React, { Suspense, lazy } from 'react';

// Carga diferida: `recharts` solo se descarga en el momento en que una
// StatCard realmente recibe la prop `tendencia` (hoy, solo en el Panel
// general), no cada vez que se usa StatCard en cualquier otra página.
const Sparkline = lazy(() => import('./Sparkline'));

export default function StatCard({ label, value, hint, tone = 'default', tendencia }) {
  const toneColor = {
    default: 'var(--saddle)',
    danger: 'var(--danger)',
    success: 'var(--success)',
  }[tone];

  // "tendencia" es un arreglo corto de números (p. ej. ventas de los
  // últimos 7 días) para dibujar una mini-línea de contexto junto al
  // valor principal, igual que los "sparklines" de tableros de datos.
  const tieneTendencia = Array.isArray(tendencia) && tendencia.length > 1;
  const datosSpark = tieneTendencia ? tendencia.map((v, i) => ({ i, v })) : [];

  return (
    <div className="card" style={{ padding: '20px 22px', flex: 1, minWidth: 180 }}>
      <div style={{ fontSize: 12.5, color: 'var(--espresso-soft)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.03em' }}>
        {label}
      </div>
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 10 }}>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 30, fontWeight: 600, color: toneColor, marginTop: 6 }}>
          {value}
        </div>
        {tieneTendencia && (
          <div style={{ width: 64, height: 28, flexShrink: 0, marginBottom: 4 }}>
            <Suspense fallback={null}>
              <Sparkline data={datosSpark} color={toneColor} />
            </Suspense>
          </div>
        )}
      </div>
      {hint && <div style={{ fontSize: 12.5, color: 'var(--espresso-soft)', marginTop: 4 }}>{hint}</div>}
    </div>
  );
}
