interface Props {
  status: string;
  size?: 'sm' | 'md';
}

const config: Record<string, { label: string; color: string; bg: string; border: string }> = {
  investigating: { label:'Investigating', color:'#dc2626', bg:'#fef2f2', border:'#fecaca' },
  resolved:      { label:'Resolved',      color:'#16a34a', bg:'#f0fdf4', border:'#bbf7d0' },
  critical:      { label:'Critical',      color:'#dc2626', bg:'#fef2f2', border:'#fecaca' },
  high:          { label:'High',          color:'#d97706', bg:'#fffbeb', border:'#fde68a' },
  medium:        { label:'Medium',        color:'#d97706', bg:'#fffbeb', border:'#fde68a' },
  low:           { label:'Low',           color:'#16a34a', bg:'#f0fdf4', border:'#bbf7d0' },
};

export function StatusBadge({ status, size = 'md' }: Props) {
  const c = config[status] ?? config.low;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      padding: size === 'sm' ? '2px 7px' : '3px 10px',
      borderRadius: 999,
      background: c.bg, color: c.color,
      fontSize: size === 'sm' ? 11 : 12,
      fontWeight: 500, letterSpacing: '0.02em',
      border: `1px solid ${c.border}`,
    }}>
      <span style={{
        width: 5, height: 5, borderRadius: '50%',
        background: c.color,
        animation: status === 'investigating'
          ? 'pulse 1.5s ease-in-out infinite' : 'none',
      }} />
      {c.label}
    </span>
  );
}
