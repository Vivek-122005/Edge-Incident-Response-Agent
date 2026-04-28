import { useState, useEffect, useRef } from 'react';
import { LiveStep } from '../types';

const WS_URL = import.meta.env.DEV
  ? `ws://${window.location.host}/agents/IncidentAgent/global`
  : 'wss://incident-response-agent.vivek-23csai.workers.dev/agents/IncidentAgent/global';

export function useAgentSocket() {
  const [steps, setSteps] = useState<LiveStep[]>([]);
  const [connected, setConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const attemptRef = useRef(0);

  useEffect(() => {
    let cancelled = false;

    function connect() {
      if (cancelled) return;
      
      try {
        const ws = new WebSocket(WS_URL);
        wsRef.current = ws;

        ws.onopen = () => {
          if (!cancelled) {
            setConnected(true);
            attemptRef.current = 0;
          }
        };

        ws.onmessage = (e) => {
          if (cancelled) return;
          try {
            const msg = JSON.parse(e.data);
            if (['step','resolved','state'].includes(msg.type)) {
              setSteps(prev => [{
                incidentId: msg.incidentId ?? '',
                step: msg.step ?? msg.message ?? msg.currentStep ?? '',
                timestamp: new Date().toISOString(),
                type: msg.type,
              }, ...prev].slice(0, 50));
            }
          } catch (_) {}
        };

        ws.onclose = () => {
          if (!cancelled) {
            setConnected(false);
            const delay = Math.min(1000 * 2 ** attemptRef.current, 10000);
            attemptRef.current++;
            setTimeout(connect, delay);
          }
        };

        ws.onerror = () => ws.close();
      } catch (_) {
        const delay = Math.min(1000 * 2 ** attemptRef.current, 10000);
        attemptRef.current++;
        setTimeout(connect, delay);
      }
    }

    connect();
    return () => {
      cancelled = true;
      wsRef.current?.close();
    };
  }, []);

  return { steps, connected };
}
