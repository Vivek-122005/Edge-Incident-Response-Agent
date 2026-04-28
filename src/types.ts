import { D1Database, DurableObjectNamespace, KVNamespace, Ai, VectorizeIndex } from "@cloudflare/workers-types";
import type { IncidentAgent } from "./agent";

export type IncidentStatus = "investigating" | "resolved" | "escalated";

export interface IncidentState {
  incidentId: string;
  endpoint: string;
  status: IncidentStatus;
  steps: string[];
  currentStep: string;
  isInvestigating: boolean;
  summary: string;
  rootCause: string;
  severity: "low" | "medium" | "high" | "critical";
  errorRate: number;
  detectedAt: string;
}

export interface ApiLog {
  id: number;
  timestamp: string;
  endpoint: string;
  status_code: number;
  latency_ms: number;
  ip: string;
  method?: string;
  path?: string;
  user_agent?: string;
  api_key?: string;
}

export interface Incident {
  id: string;
  detected_at: string;
  status: IncidentStatus;
  endpoint: string;
  error_rate: number | null;
  total_errors: number | null;
  root_cause: string | null;
  summary: string | null;
  severity: string | null;
  resolved_at: string | null;
}

export interface Env {
  DB: D1Database;
  incident_kv: KVNamespace;
  AI: Ai;
  VECTORIZE: VectorizeIndex;
  IncidentAgent: DurableObjectNamespace<IncidentAgent>;
  CF_API_TOKEN: string;
  AI_GATEWAY_SLUG: string;
  CF_ACCOUNT_ID: string;
  MISTRAL_API_KEY: string;
  INCIDENT_DEBOUNCE_MS?: string;
}
