import { useState, useEffect, useRef } from 'react';
import { LiveStep } from '../types';

const WORKER_BASE = 
  'incident-response-agent.vivek-23csai.workers.dev';

export function useAgentSocket() {
  const [steps, setSteps] = useState<LiveStep[]>([]);
  const [connected, setConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const attemptRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    let cancelled = false;

    function connect() {
      if (cancelled) return;

      // Clear any existing connection
      if (wsRef.current) {
        wsRef.current.onclose = null;
        wsRef.current.onerror = null;
        wsRef.current.close();
      }

      const protocol = window.location.protocol === 'https:' 
        ? 'wss' : 'ws';
      
      // In production (Pages), always use wss to Worker
      const wsUrl = window.location.hostname.includes('pages.dev')
        ? `wss://${WORKER_BASE}/agents/IncidentAgent/global`
        : window.location.hostname === 'localhost'
          ? `ws://localhost:8787/agents/IncidentAgent/global`
          : `wss://${WORKER_BASE}/agents/IncidentAgent/global`;

      console.log('[WS] Connecting to:', wsUrl, 'attempt:', attemptRef.current);

      try {
        const ws = new WebSocket(wsUrl);
        wsRef.current = ws;

        ws.onopen = () => {
          if (cancelled) return;
          console.log('[WS] Open state reached');
          setConnected(true);
          attemptRef.current = 0;
        };

        ws.onmessage = (event) => {
          if (cancelled) return;
          console.log('[WS] Raw message:', event.data);
          try {
            const msg = JSON.parse(event.data);
            const stepText = 
              msg.step ?? 
              msg.message ?? 
              msg.currentStep ?? 
              (msg.type === 'resolved' ? `✅ Resolved: ${msg.rootCause}` : null) ??
              JSON.stringify(msg);

            if (stepText && ['step','resolved','state'].includes(msg.type)) {
              const newStep: LiveStep = {
                incidentId: msg.incidentId ?? '',
                step: stepText,
                timestamp: new Date().toISOString(),
                type: msg.type,
              };
              setSteps(prev => [newStep, ...prev].slice(0, 50));
            }
          } catch (e) {
            console.warn('[WS] Parse error:', e);
          }
        };

        ws.onclose = (event) => {
          if (cancelled) return;
          console.error('[WS] Connection closed:', {
            code: event.code,
            reason: event.reason,
            wasClean: event.wasClean
          });
          setConnected(false);
          wsRef.current = null;
          // Exponential backoff: 1s, 2s, 4s, 8s, max 10s
          const delay = Math.min(
            1000 * Math.pow(2, attemptRef.current), 
            10000
          );
          console.log(`[WS] Reconnecting in ${delay}ms`);
          attemptRef.current++;
          timerRef.current = setTimeout(connect, delay);
        };

        ws.onerror = (error) => {
          console.error('[WS] Error:', error);
          // onclose will fire after onerror, which handles reconnect
        };

      } catch (error) {
        console.error('[WS] Failed to create WebSocket:', error);
        if (!cancelled) {
          const delay = Math.min(
            1000 * Math.pow(2, attemptRef.current),
            10000
          );
          attemptRef.current++;
          timerRef.current = setTimeout(connect, delay);
        }
      }
    }

    connect();

    return () => {
      cancelled = true;
      clearTimeout(timerRef.current);
      if (wsRef.current) {
        wsRef.current.onclose = null;
        wsRef.current.onerror = null;
        wsRef.current.close();
      }
    };
  }, []);

  return { steps, connected };
}
