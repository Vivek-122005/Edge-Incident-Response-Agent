export interface Incident {
  id: string;
  detected_at: string;
  status: 'investigating' | 'resolved';
  endpoint: string;
  error_rate: number;
  total_errors: number;
  root_cause: string | null;
  summary: string | null;
  severity: 'low' | 'medium' | 'high' | 'critical' | null;
  resolved_at: string | null;
}

export interface LiveStep {
  incidentId: string;
  step: string;
  timestamp: string;
  type: 'step' | 'resolved' | 'state';
}
