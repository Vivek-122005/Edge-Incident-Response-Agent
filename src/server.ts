import { Hono } from "hono";
import { routeAgentRequest } from "agents";
import { Env } from "./types";

const app = new Hono<{ Bindings: Env }>();
let lastIncidentTriggered = 0;

function getIncidentDebounceMs(env: Env): number {
  const parsed = Number(env.INCIDENT_DEBOUNCE_MS ?? "60000");
  if (!Number.isFinite(parsed) || parsed < 0) return 60000;
  return parsed;
}

async function detectAnomaly(env: Env, endpoint: string): Promise<{ shouldTrigger: boolean; errorRate: number }> {
  const result = await env.DB.prepare(
    `SELECT
      COUNT(*) as total,
      SUM(CASE WHEN status_code >= 500 THEN 1 ELSE 0 END) as errors
    FROM api_logs
    WHERE endpoint = ?
    AND timestamp >= datetime('now', '-2 minutes')`
  )
    .bind(endpoint)
    .first<{ total: number; errors: number | null }>();

  const total = Number(result?.total ?? 0);
  const errors = Number(result?.errors ?? 0);
  const errorRate = total > 0 ? errors / total : 0;
  console.log(`[detectAnomaly] endpoint=${endpoint} total=${total} errors=${errors} rate=${errorRate}`);

  if (!result || total < 5) return { shouldTrigger: false, errorRate };
  if (errorRate < 0.4) return { shouldTrigger: false, errorRate };

  const active = await env.incident_kv.get(`active_incident:${endpoint}`);
  if (active) return { shouldTrigger: false, errorRate };

  return { shouldTrigger: true, errorRate };
}

async function triggerIncident(env: Env, path: string): Promise<void> {
  const incidentId = crypto.randomUUID();

  await env.DB.prepare(
    "INSERT INTO incidents (id, detected_at, status, endpoint, error_rate, total_errors, root_cause, summary, severity, resolved_at) VALUES (?, datetime('now'), 'investigating', ?, NULL, NULL, NULL, NULL, NULL, NULL)"
  )
    .bind(incidentId, path)
    .run();

  await env.incident_kv.put(`active_incident:${path}`, incidentId, {
    expirationTtl: 300
  });

  const id = env.IncidentAgent.idFromName("live");
  try {
    const stub = env.IncidentAgent.get(id);
    await stub.fetch("http://agent/start", {
      method: "POST",
      body: JSON.stringify({ path, incidentId })
    });
  } catch (error) {
    console.error("IncidentAgent trigger failed:", error);
  }
}

async function checkAndTriggerAgent(env: Env, endpoint: string, errorRate: number): Promise<void> {
  await env.DB.prepare(
    `UPDATE incidents
     SET status = 'resolved',
         root_cause = 'Auto-resolved: investigation timed out',
         summary = 'Incident investigation exceeded 10 minute threshold. Marked as stale.',
         severity = 'low',
         resolved_at = datetime('now')
     WHERE status = 'investigating'
     AND detected_at < datetime('now', '-10 minutes')`
  )
    .bind()
    .run();

  const existing = await env.DB.prepare(
    `SELECT id FROM incidents
     WHERE endpoint = ?
     AND status = 'investigating'
     AND detected_at >= datetime('now', '-10 minutes')`
  )
    .bind(endpoint)
    .first();

  if (existing) {
    console.log(`[triggerAgent] Open incident already exists for endpoint=${endpoint}, skipping`);
    return;
  }

  console.log(`[triggerAgent] Triggering IncidentAgent for endpoint=${endpoint} errorRate=${errorRate}`);
  await triggerIncident(env, endpoint);
}

app.use("*", async (c, next) => {
  const env = c.env as Env;
  const start = Date.now();
  const method = c.req.method;
  const path = c.req.path;
  const ip = c.req.header("cf-connecting-ip") ?? "unknown";
  const userAgent = c.req.header("user-agent") ?? "unknown";

  const blocked = await env.incident_kv.get(`blocklist:${ip}`);
  if (blocked) {
    return c.json({ status: "forbidden" }, 403);
  }

  await next();

  const latency = Date.now() - start;
  const statusCode = c.res.status;
  const apiKey = c.req.header("x-api-key") ?? null;

  const logPromise = env.DB.prepare(
    "INSERT INTO api_logs (endpoint, status_code, latency_ms, ip, method, path, user_agent, api_key) VALUES (?, ?, ?, ?, ?, ?, ?, ?)"
  )
    .bind(path, statusCode, latency, ip, method, path, userAgent, apiKey)
    .run();

  const anomalyPromise = (async () => {
    const debounceMs = getIncidentDebounceMs(env);
    if (Date.now() - lastIncidentTriggered < debounceMs) return;
    const { shouldTrigger, errorRate } = await detectAnomaly(env, path);
    if (!shouldTrigger) return;
    lastIncidentTriggered = Date.now();
    await checkAndTriggerAgent(env, path, errorRate);
  })();

  const ctx = c.executionCtx;
  if (ctx) {
    ctx.waitUntil(logPromise);
    ctx.waitUntil(anomalyPromise);
  } else {
    void logPromise;
    void anomalyPromise;
  }
});

app.get("/", (c) => {
  return c.json({
    status: "ok",
    message: "Edge Incident Response Agent is live"
  });
});

app.get("/api/checkout", async (c) => {
  const isBreaking = c.req.query("break") === "true";
  if (isBreaking) {
    return c.json({ status: "error", message: "Simulated Crash" }, 500);
  }
  return c.json({ status: "ok", message: "Checkout successful" });
});

app.get("/incidents", async (c) => {
  const { results } = await c.env.DB.prepare(
    "SELECT * FROM incidents ORDER BY detected_at DESC LIMIT 10"
  ).all();
  return c.json(results);
});

app.get("/api/test-db", async (c) => {
  try {
    const env = c.env as Env;
    const result = await env.DB.prepare(
      "SELECT COUNT(*) as total FROM api_logs"
    ).first<{ total: number }>();
    await env.incident_kv.put("test-key", "connection-ok");

    return c.json({
      status: "ok",
      message: "D1 and KV connection successful",
      logsCount: result?.total ?? 0,
      kvWriteSuccess: true
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return c.json(
      {
        status: "error",
        message: "D1 and KV connection test failed",
        error: errorMessage
      },
      500
    );
  }
});

export { IncidentAgent } from "./agent";

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext) {
    const agentResponse = await routeAgentRequest(request, env);
    if (agentResponse) return agentResponse;

    return app.fetch(request, env, ctx);
  }
};
