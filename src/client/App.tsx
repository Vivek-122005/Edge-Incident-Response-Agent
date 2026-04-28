import { useIncidents } from './hooks/useIncidents';
import { useAgentSocket } from './hooks/useAgentSocket';
import { Header } from './components/Header';
import { HeroBanner } from './components/HeroBanner';
import { MetricsBar } from './components/MetricsBar';
import { IncidentCard } from './components/IncidentCard';
import { LiveFeed } from './components/LiveFeed';

export default function App() {
  const { incidents, loading, error } = useIncidents(3000);
  const { steps, connected } = useAgentSocket();

  const active   = incidents.filter(i => i.status === 'investigating');
  const resolved = incidents.filter(i => i.status === 'resolved');

  return (
    <div style={{ minHeight: '100vh', background: '#f8f9fb',
      fontFamily: "'Inter', -apple-system, sans-serif" }}>
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(4px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      <Header wsConnected={connected} totalIncidents={incidents.length} />
      <HeroBanner />
      <MetricsBar incidents={incidents} />

      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 360px',
        gap: 20,
        padding: '0 32px 40px',
        maxWidth: 1400,
        margin: '0 auto',
      }}>
        {/* Left: incidents */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between',
            alignItems: 'center', marginBottom: 4 }}>
            <span style={{ fontSize: 13, fontWeight: 600,
              color: '#374151', textTransform: 'uppercase',
              letterSpacing: '0.06em' }}>
              Incidents
            </span>
            <span style={{ fontSize: 12, color: '#9ca3af' }}>
              Refreshes every 3s
            </span>
          </div>

          {loading && (
            <div style={{ padding: 20, color: '#9ca3af', fontSize: 13 }}>
              Loading incidents...
            </div>
          )}
          {error && (
            <div style={{ background: '#fef2f2', border: '1px solid #fecaca',
              borderRadius: 10, padding: '12px 16px',
              fontSize: 13, color: '#dc2626' }}>
              ⚠ {error} — make sure wrangler dev is running
            </div>
          )}

          {active.length > 0 && (
            <>
              <span style={{ fontSize: 11, color: '#dc2626', fontWeight: 600,
                textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                ● Active ({active.length})
              </span>
              {active.map(i => <IncidentCard key={i.id} incident={i} />)}
            </>
          )}

          {resolved.length > 0 && (
            <>
              <span style={{ fontSize: 11, color: '#9ca3af', fontWeight: 600,
                textTransform: 'uppercase', letterSpacing: '0.06em',
                marginTop: active.length > 0 ? 12 : 0 }}>
                Resolved ({resolved.length})
              </span>
              {resolved.map(i => <IncidentCard key={i.id} incident={i} />)}
            </>
          )}

          {!loading && !error && incidents.length === 0 && (
            <div style={{ background: '#fff', border: '1px solid #e5e7eb',
              borderRadius: 12, padding: '48px 24px',
              textAlign: 'center' }}>
              <div style={{ fontSize: 32, marginBottom: 12 }}>✦</div>
              <div style={{ fontSize: 14, color: '#374151',
                fontWeight: 500, marginBottom: 6 }}>
                No incidents yet
              </div>
              <div style={{ fontSize: 13, color: '#9ca3af',
                marginBottom: 16 }}>
                Run the traffic simulator to see the agent work
              </div>
              <code style={{ fontSize: 12, background: '#f3f4f6',
                border: '1px solid #e5e7eb', borderRadius: 6,
                padding: '6px 14px', color: '#374151' }}>
                node simulate.js
              </code>
            </div>
          )}
        </div>

        {/* Right: live feed */}
        <LiveFeed steps={steps} connected={connected} />
      </div>
    </div>
  );
}
