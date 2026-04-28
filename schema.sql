-- api_logs table: raw request logs for anomaly detection
CREATE TABLE IF NOT EXISTS api_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  timestamp TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  endpoint TEXT NOT NULL,
  status_code INTEGER NOT NULL,
  latency_ms INTEGER NOT NULL,
  ip TEXT DEFAULT 'unknown',
  method TEXT DEFAULT 'GET',
  path TEXT,
  user_agent TEXT,
  api_key TEXT
);

-- incidents table: detected incidents and their investigation status
CREATE TABLE IF NOT EXISTS incidents (
  id TEXT PRIMARY KEY,
  detected_at TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'investigating',
  endpoint TEXT NOT NULL,
  error_rate REAL,
  total_errors INTEGER,
  root_cause TEXT,
  summary TEXT,
  severity TEXT,
  resolved_at TEXT
);

-- Indexes for fast queries
CREATE INDEX IF NOT EXISTS idx_logs_endpoint_time ON api_logs(endpoint, timestamp);
CREATE INDEX IF NOT EXISTS idx_logs_status ON api_logs(status_code);
CREATE INDEX IF NOT EXISTS idx_incidents_status ON incidents(status);
CREATE INDEX IF NOT EXISTS idx_incidents_endpoint ON incidents(endpoint);
