import { useState, useEffect } from 'react';
import { Incident } from '../types';

const WORKER_URL = import.meta.env.DEV
  ? ''
  : 'https://incident-response-agent.vivek-23csai.workers.dev';

console.log('DEBUG: useIncidents WORKER_URL=', WORKER_URL);

export function useIncidents(pollIntervalMs = 3000) {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function fetchIncidents() {
      try {
        const url = `${WORKER_URL}/incidents`;
        console.log('DEBUG: Fetching incidents from', url);
        const res = await fetch(url);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json() as Incident[];
        console.log('DEBUG: Received incidents', data.length);
        if (mounted) {
          setIncidents(data);
          setError(null);
        }
      } catch (err) {
        console.error('DEBUG: Fetch error', err);
        if (mounted) {
          setError(err instanceof Error ? err.message : 'Unknown error');
        }
      } finally {
        if (mounted) setLoading(false);
      }
    }

    fetchIncidents();
    const timer = setInterval(fetchIncidents, pollIntervalMs);
    return () => {
      mounted = false;
      clearInterval(timer);
    };
  }, [pollIntervalMs]);

  return { incidents, loading, error };
}
