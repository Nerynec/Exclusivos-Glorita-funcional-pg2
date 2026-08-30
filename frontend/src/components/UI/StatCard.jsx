import React from 'react';

export default function StatCard({ label, value, hint, tone = 'default' }) {
  const toneColor = {
    default: 'var(--saddle)',
    danger: 'var(--danger)',
    success: 'var(--success)',
  }[tone];

  return (
    <div className="card" style={{ padding: '20px 22px', flex: 1, minWidth: 180 }}>
      <div style={{ fontSize: 12.5, color: 'var(--espresso-soft)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.03em' }}>
        {label}
      </div>
      <div style={{ fontFamily: 'var(--font-display)', fontSize: 30, fontWeight: 600, color: toneColor, marginTop: 6 }}>
        {value}
      </div>
      {hint && <div style={{ fontSize: 12.5, color: 'var(--espresso-soft)', marginTop: 4 }}>{hint}</div>}
    </div>
  );
}
