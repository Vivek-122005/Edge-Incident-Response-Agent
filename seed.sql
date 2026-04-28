-- Seed data for demo

-- Normal traffic logs (200 OK responses)
INSERT INTO api_logs (timestamp, endpoint, status_code, latency_ms, ip, method, path, user_agent, api_key)
VALUES
  ('2026-04-28T10:00:00Z', '/api/checkout', 200, 45, '192.168.1.100', 'POST', '/api/checkout', 'Mozilla/5.0', 'demo-key-123'),
  ('2026-04-28T10:00:05Z', '/api/checkout', 200, 52, '192.168.1.101', 'POST', '/api/checkout', 'Mozilla/5.0', 'demo-key-123'),
  ('2026-04-28T10:00:10Z', '/api/checkout', 200, 48, '192.168.1.102', 'POST', '/api/checkout', 'Mozilla/5.0', 'demo-key-123'),
  ('2026-04-28T10:00:15Z', '/api/checkout', 200, 50, '192.168.1.103', 'POST', '/api/checkout', 'Mozilla/5.0', 'demo-key-123'),
  ('2026-04-28T10:00:20Z', '/api/checkout', 200, 46, '192.168.1.104', 'POST', '/api/checkout', 'Mozilla/5.0', 'demo-key-123'),
  ('2026-04-28T10:00:25Z', '/api/checkout', 200, 51, '192.168.1.105', 'POST', '/api/checkout', 'Mozilla/5.0', 'demo-key-123'),
  ('2026-04-28T10:00:30Z', '/api/checkout', 200, 49, '192.168.1.106', 'POST', '/api/checkout', 'Mozilla/5.0', 'demo-key-123'),
  ('2026-04-28T10:00:35Z', '/api/checkout', 200, 47, '192.168.1.107', 'POST', '/api/checkout', 'Mozilla/5.0', 'demo-key-123'),
  ('2026-04-28T10:00:40Z', '/api/checkout', 200, 53, '192.168.1.108', 'POST', '/api/checkout', 'Mozilla/5.0', 'demo-key-123'),
  ('2026-04-28T10:00:45Z', '/api/checkout', 200, 50, '192.168.1.109', 'POST', '/api/checkout', 'Mozilla/5.0', 'demo-key-123');

-- Error traffic logs (500 Internal Server Error - simulating anomaly)
INSERT INTO api_logs (timestamp, endpoint, status_code, latency_ms, ip, method, path, user_agent, api_key)
VALUES
  ('2026-04-28T10:01:00Z', '/api/checkout', 500, 1200, '192.168.1.110', 'POST', '/api/checkout', 'Mozilla/5.0', 'demo-key-123'),
  ('2026-04-28T10:01:05Z', '/api/checkout', 500, 1150, '192.168.1.111', 'POST', '/api/checkout', 'Mozilla/5.0', 'demo-key-123'),
  ('2026-04-28T10:01:10Z', '/api/checkout', 500, 1300, '192.168.1.112', 'POST', '/api/checkout', 'Mozilla/5.0', 'demo-key-123'),
  ('2026-04-28T10:01:15Z', '/api/checkout', 500, 1100, '192.168.1.113', 'POST', '/api/checkout', 'Mozilla/5.0', 'demo-key-123'),
  ('2026-04-28T10:01:20Z', '/api/checkout', 500, 1250, '192.168.1.114', 'POST', '/api/checkout', 'Mozilla/5.0', 'demo-key-123');
