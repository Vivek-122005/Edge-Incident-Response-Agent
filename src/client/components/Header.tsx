interface Props {
  wsConnected: boolean;
  totalIncidents: number;
}

export function Header({ wsConnected, totalIncidents }: Props) {
  return (
    <header style={{
      background: '#fff',
      borderBottom: '1px solid #e5e7eb',
      padding: '0 32px',
      height: 56,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      position: 'sticky', top: 0, zIndex: 100,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ width: 28, height: 28, borderRadius: 8,
          background: '#fff7ed', border: '1px solid #fed7aa',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 14 }}>
          ⚡
        </div>
        <span style={{ fontSize: 15, fontWeight: 600, color: '#111827' }}>
          Incident Response
        </span>
        <span style={{ fontSize: 11, color: '#9ca3af',
          background: '#f3f4f6', border: '1px solid #e5e7eb',
          padding: '2px 8px', borderRadius: 4 }}>
          Edge Agent · Cloudflare
        </span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
        <span style={{ fontSize: 13, color: '#6b7280' }}>
          {totalIncidents} incidents tracked
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6,
          background: wsConnected ? '#f0fdf4' : '#f9fafb',
          border: `1px solid ${wsConnected ? '#bbf7d0' : '#e5e7eb'}`,
          borderRadius: 20, padding: '4px 10px' }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%',
            background: wsConnected ? '#16a34a' : '#9ca3af',
            ...(wsConnected ? {} : {}) }} />
          <span style={{ fontSize: 12,
            color: wsConnected ? '#15803d' : '#6b7280', fontWeight: 500 }}>
            {wsConnected ? 'Live' : 'Connecting...'}
          </span>
        </div>
      </div>
    </header>
  );
}
