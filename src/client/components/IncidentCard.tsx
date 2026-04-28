import { Incident } from '../types';
import { StatusBadge } from './StatusBadge';

interface Props {
  incident: Incident;
}

function timeAgo(dateStr: string) {
  const d = new Date(dateStr);
  const now = new Date();
  const diffSec = Math.floor((now.getTime() - d.getTime()) / 1000);
  if (diffSec < 60) return `${diffSec}s ago`;
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHrs = Math.floor(diffMin / 60);
  return `${diffHrs}h ago`;
}

function resolutionTime(startStr: string, endStr: string) {
  const start = new Date(startStr);
  const end = new Date(endStr);
  const diffSec = Math.floor((end.getTime() - start.getTime()) / 1000);
  if (diffSec < 60) return `${diffSec}s`;
  const diffMin = Math.floor(diffSec / 60);
  return `${diffMin}m ${diffSec % 60}s`;
}

export function IncidentCard({ incident }: Props) {
  const isActive = incident.status === 'investigating';

  return (
    <div style={{
      background: '#fff',
      border: `1px solid ${isActive ? '#fecaca' : '#e5e7eb'}`,
      borderRadius: 10,
      padding: '16px 20px',
      display: 'flex', flexDirection: 'column', gap: 10,
      animation: 'fadeIn 0.2s ease',
    }}>
      {/* Row 1: ID + badges */}
      <div style={{ display:'flex', justifyContent:'space-between',
        alignItems:'center' }}>
        <span style={{ fontSize: 11, color: '#9ca3af',
          fontFamily: 'monospace' }}>
          #{incident.id.slice(0, 8)}
        </span>
        <div style={{ display: 'flex', gap: 6 }}>
          {incident.severity && (
            <StatusBadge status={incident.severity} size="sm" />
          )}
          <StatusBadge status={incident.status} size="sm" />
        </div>
      </div>

      {/* Row 2: endpoint + stats */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <code style={{
          fontSize: 12, background: '#f3f4f6',
          border: '1px solid #e5e7eb', padding: '2px 8px',
          borderRadius: 4, color: '#f6821f', fontWeight: 500,
        }}>
          {incident.endpoint}
        </code>
        {incident.total_errors && (
          <span style={{ fontSize: 12, color: '#6b7280' }}>
            {incident.total_errors} failures detected
          </span>
        )}
      </div>

      {/* Row 3: root cause */}
      {incident.root_cause && (
        <div style={{
          background: '#fafafa', borderRadius: 6,
          padding: '10px 12px',
          borderLeft: '3px solid #f6821f',
        }}>
          <div style={{ fontSize: 10, color: '#9ca3af',
            textTransform: 'uppercase', letterSpacing: '0.08em',
            marginBottom: 4, fontWeight: 600 }}>
            Root Cause
          </div>
          <div style={{ fontSize: 13, color: '#374151',
            lineHeight: 1.5 }}>
            {incident.root_cause}
          </div>
        </div>
      )}

      {/* Row 4: summary */}
      {incident.summary && (
        <div style={{ fontSize: 13, color: '#6b7280', lineHeight: 1.6 }}>
          {incident.summary}
        </div>
      )}

      {/* Row 5: footer */}
      <div style={{
        display: 'flex', justifyContent: 'space-between',
        paddingTop: 8, borderTop: '1px solid #f3f4f6',
      }}>
        <span style={{ fontSize: 11, color: '#9ca3af' }}>
          Detected {timeAgo(incident.detected_at)}
        </span>
        {incident.resolved_at && (
          <span style={{ fontSize: 11, color: '#16a34a', fontWeight: 500 }}>
            ✓ Resolved in {resolutionTime(incident.detected_at, incident.resolved_at)}
          </span>
        )}
      </div>
    </div>
  );
}
