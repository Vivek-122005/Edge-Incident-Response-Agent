import { Incident } from '../types';

interface Props {
  incidents: Incident[];
}

export function MetricsBar({ incidents }: Props) {
  const active   = incidents.filter(i => i.status === 'investigating').length;
  const resolved = incidents.filter(i => i.status === 'resolved').length;
  const critical = incidents.filter(
    i => i.severity === 'critical' || i.severity === 'high'
  ).length;
  const avgRate = incidents.length > 0
    ? Math.round(
        incidents.reduce((s, i) => s + (i.error_rate ?? 0), 0)
        / incidents.length * 100
      )
    : 0;

  const cards = [
    { label: 'Active Incidents', value: active,
      color: active > 0 ? '#dc2626' : '#16a34a',
      bg: active > 0 ? '#fef2f2' : '#f0fdf4',
      border: active > 0 ? '#fecaca' : '#bbf7d0' },
    { label: 'Resolved',         value: resolved,
      color: '#16a34a', bg: '#f0fdf4', border: '#bbf7d0' },
    { label: 'High Severity',    value: critical,
      color: critical > 0 ? '#d97706' : '#6b7280',
      bg: critical > 0 ? '#fffbeb' : '#f9fafb',
      border: critical > 0 ? '#fde68a' : '#e5e7eb' },
    { label: 'Avg Error Rate',   value: `${avgRate}%`,
      color: '#f6821f', bg: '#fff7ed', border: '#fed7aa' },
  ];

  return (
    <div style={{
      display: 'grid', gridTemplateColumns: 'repeat(4,1fr)',
      gap: 16, padding: '20px 32px',
      maxWidth: 1400, margin: '0 auto',
    }}>
      {cards.map(c => (
        <div key={c.label} style={{
          background: '#fff',
          border: `1px solid ${c.border}`,
          borderRadius: 10, padding: '16px 20px',
        }}>
          <div style={{ fontSize: 11, color: '#9ca3af',
            textTransform: 'uppercase', letterSpacing: '0.08em',
            marginBottom: 8 }}>
            {c.label}
          </div>
          <div style={{ fontSize: 28, fontWeight: 700,
            color: c.color, lineHeight: 1 }}>
            {c.value}
          </div>
        </div>
      ))}
    </div>
  );
}
