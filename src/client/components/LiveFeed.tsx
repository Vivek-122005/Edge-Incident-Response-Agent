import { LiveStep } from '../types';

interface Props {
  steps: LiveStep[];
  connected: boolean;
}

export function LiveFeed({ steps, connected }: Props) {
  return (
    <div style={{
      background: '#fff', border: '1px solid #e5e7eb',
      borderRadius: 10, display: 'flex',
      flexDirection: 'column', height: 600, overflow: 'hidden',
    }}>
      <div style={{
        padding: '12px 16px', borderBottom: '1px solid #f3f4f6',
        display: 'flex', justifyContent: 'space-between',
        alignItems: 'center',
      }}>
        <span style={{ fontSize: 12, fontWeight: 600, color: '#374151',
          textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          Live Agent Feed
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {connected && (
            <span style={{ width: 5, height: 5, borderRadius: '50%',
              background: '#16a34a',
              boxShadow: '0 0 6px #16a34a' }} />
          )}
          <span style={{ fontSize: 11, color: '#9ca3af' }}>
            {steps.length} events
          </span>
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '8px 0' }}>
        {steps.length === 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            height: '100%', gap: 8 }}>
            <span style={{ fontSize: 24 }}>⚡</span>
            <span style={{ fontSize: 13, color: '#6b7280',
              fontWeight: 500 }}>
              Waiting for agent activity
            </span>
            <span style={{ fontSize: 12, color: '#9ca3af',
              textAlign: 'center', maxWidth: 200 }}>
              Trigger an error spike to see the agent work
            </span>
          </div>
        ) : (
          steps.map((s, i) => (
            <div key={i} style={{
              padding: '7px 16px',
              display: 'flex', gap: 10, alignItems: 'flex-start',
              background: i === 0 ? '#fafafa' : 'transparent',
              borderBottom: '1px solid #f9fafb',
            }}>
              <span style={{ fontSize: 10, color: '#9ca3af',
                fontFamily: 'monospace', marginTop: 2, flexShrink: 0 }}>
                {new Date(s.timestamp).toLocaleTimeString('en-US',
                  { hour12: false, hour: '2-digit',
                    minute: '2-digit', second: '2-digit' })}
              </span>
              <span style={{
                width: 4, height: 4, borderRadius: '50%',
                marginTop: 6, flexShrink: 0,
                background: s.type === 'resolved' ? '#16a34a'
                  : s.step?.toLowerCase().includes('ai') ? '#7c3aed'
                  : s.step?.toLowerCase().includes('vectorize') ? '#2563eb'
                  : '#f6821f',
              }} />
              <span style={{
                fontSize: 12, lineHeight: 1.5, wordBreak: 'break-word',
                color: s.type === 'resolved' ? '#16a34a'
                  : s.step?.toLowerCase().includes('ai') ? '#7c3aed'
                  : s.step?.toLowerCase().includes('vectorize') ? '#2563eb'
                  : '#374151',
              }}>
                {s.step}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
