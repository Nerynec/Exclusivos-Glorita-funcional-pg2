import React from 'react';
import { ResponsiveContainer, LineChart, Line } from 'recharts';

// Componente separado a propósito: así `recharts` solo se descarga cuando
// StatCard realmente necesita dibujar una mini-tendencia (hoy, únicamente
// en el Panel general), en vez de quedar arrastrado a otras páginas que
// también usan StatCard (como Reportes) pero nunca piden "tendencia".
export default function Sparkline({ data, color }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data} margin={{ top: 2, right: 2, bottom: 2, left: 2 }}>
        <Line type="monotone" dataKey="v" stroke={color} strokeWidth={2} dot={false} isAnimationActive={false} />
      </LineChart>
    </ResponsiveContainer>
  );
}
