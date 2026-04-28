import { useState, useEffect } from 'react';
import { Incident } from '../types';

const WORKER_URL = import.meta.env.DEV
  ? ''
  : 'https://incident-response-agent.vivek-23csai.workers.dev';

export function useIncidents(pollIntervalMs = 3000) {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function fetchIncidents() {
      try {
        const res = await fetch(`${WORKER_URL}/incidents`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json() as Incident[];
        if (mounted) {
          setIncidents(data);
          setError(null);
        }
      } catch (err) {
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
