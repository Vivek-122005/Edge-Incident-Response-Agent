export function HeroBanner() {
  return (
    <div style={{
      background: '#fff',
      borderBottom: '1px solid #e5e7eb',
      padding: '20px 32px',
      maxWidth: 1400,
      margin: '0 auto',
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start',
        justifyContent: 'space-between', gap: 32 }}>

        {/* Left: project description */}
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center',
            gap: 8, marginBottom: 6 }}>
            <span style={{ fontSize: 16, fontWeight: 600,
              color: '#111827' }}>
              Autonomous Edge-Native AI Incident Response Agent
            </span>
            <span style={{ fontSize: 11, background: '#fff7ed',
              color: '#f6821f', border: '1px solid #fed7aa',
              padding: '2px 8px', borderRadius: 4, fontWeight: 500 }}>
              Cloudflare · Zero Servers
            </span>
          </div>
          <p style={{ fontSize: 13, color: '#6b7280',
            lineHeight: 1.6, maxWidth: 600, margin: 0 }}>
            When APIs fail, engineers spend 15–30 min manually 
            correlating logs. This agent detects anomalies at the 
            edge, spawns a stateful AI investigator, and produces 
            a full incident report in under 60 seconds — autonomously.
          </p>
        </div>

        {/* Right: services used pills */}
        <div style={{ flexShrink: 0 }}>
          <div style={{ fontSize: 11, color: '#9ca3af',
            marginBottom: 6, textTransform: 'uppercase',
            letterSpacing: '0.06em' }}>
            Powered by
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap',
            gap: 6, maxWidth: 320 }}>
            {[
              'Workers', 'Agents SDK', 'Durable Objects',
              'Workers AI', 'AI Gateway', 'D1', 'Vectorize',
              'KV', 'Pages'
            ].map(s => (
              <span key={s} style={{
                fontSize: 11, color: '#374151',
                background: '#f3f4f6',
                border: '1px solid #e5e7eb',
                padding: '3px 8px', borderRadius: 4,
                fontWeight: 500,
              }}>
                {s}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
