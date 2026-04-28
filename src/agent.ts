import { Agent } from "agents";
import { Env, IncidentState, IncidentStatus } from "./types";

export class IncidentAgent extends Agent<Env, IncidentState> {
  private readonly waitCtx: DurableObjectState;
  private lastEmittedStep = "";

  constructor(state: DurableObjectState, env: Env) {
    super(state, env);
    this.waitCtx = state;
    this.setState({
      incidentId: "",
      endpoint: "",
      status: "investigating" as IncidentStatus,
      steps: [],
      currentStep: "idle",
      isInvestigating: false,
      summary: "",
      rootCause: "",
      severity: "low",
      errorRate: 0,
      detectedAt: new Date().toISOString()
    });
  }

  private broadcastStep(step: string): void {
    this.broadcast(JSON.stringify({
      type: 'step',
      step,
      incidentId: this.state.incidentId,
      timestamp: new Date().toISOString(),
    }));
  }

  private addStep(step: string, message: string): void {
    if (this.lastEmittedStep === step) return;
    this.lastEmittedStep = step;
    
    this.setState({
      ...this.state,
      currentStep: step,
      steps: [...this.state.steps, message]
    });

    this.broadcastStep(message);
    
    console.log(JSON.stringify({
      type: "state",
      incidentId: this.state.incidentId,
      currentStep: step,
      message,
      state: this.state
    }));
  }

  private parseAIJson(text: string): { rootCause: string; summary: string; severity: string; recommendation: string } | null {
    try {
      const direct = JSON.parse(text.trim());
      if (direct.rootCause && direct.summary) return direct;
    } catch (_) {}

    try {
      const match = text.match(/\{[\s\S]*?\}/);
      if (match) {
        const parsed = JSON.parse(match[0]);
        if (parsed.rootCause && parsed.summary) return parsed;
      }
    } catch (_) {}

    return null;
  }

  private async queryRecentLogs(path: string): Promise<string> {
    const { results } = await this.env.DB.prepare(
      `SELECT status_code, ip, user_agent
       FROM api_logs
       WHERE path = ? AND timestamp >= datetime('now', '-2 minutes')
       ORDER BY timestamp DESC
       LIMIT 20`
    )
      .bind(path)
      .all<{ status_code: number; ip: string; user_agent: string | null }>();

    const grouped = new Map<string, number>();
    for (const row of results ?? []) {
      const key = `Status ${row.status_code}, IP: ${row.ip}, UserAgent: ${row.user_agent ?? "unknown"}`;
      grouped.set(key, (grouped.get(key) ?? 0) + 1);
    }

    return Array.from(grouped.entries())
      .map(([line, count]) => `${line} seen ${count} times`)
      .join("\n");
  }

  private async findSimilarIncidents(endpoint: string, currentSummary: string): Promise<any[]> {
    try {
      const queryText = `${endpoint} errors and failures`;

      const embeddingResponse = await this.env.AI.run("@cf/baai/bge-base-en-v1.5" as any, {
        text: [queryText]
      });
      const vector = (embeddingResponse as any)?.data?.[0];
      if (!vector || !Array.isArray(vector)) return [];

      const results = await this.env.VECTORIZE.query(vector, {
        topK: 3,
        returnMetadata: "all"
      });

      const matches = (results.matches ?? []).filter((m: any) => m.metadata?.endpoint === endpoint);
      console.log(`Phase B found ${matches.length} similar incidents for ${endpoint}`);
      return matches;
    } catch (e) {
      console.warn("Vectorize query failed:", e);
      return [];
    }
  }

  private async analyzeWithAI(
    endpoint: string,
    logs: any[],
    similarIncidents: any[]
  ): Promise<{ rootCause: string; summary: string; severity: string; recommendation: string }> {
    const logSummary = logs
      .slice(0, 30)
      .map((l: any) => `[${l.timestamp}] ${l.status_code} - ${l.latency_ms}ms from ${l.ip}`)
      .join("\n");

    const similarContext = similarIncidents.length > 0
      ? similarIncidents
          .map((m: any) => `Past incident: ${m.metadata?.summary ?? "unknown"}`)
          .join("\n")
      : "No similar past incidents found.";

    const prompt = `You are an incident response AI agent. Analyze these API logs.

Endpoint under investigation: ${endpoint}

Similar past incidents for context:
${similarContext}

Recent request logs:
${logSummary}

Respond ONLY with a valid JSON object. No markdown. No explanation. Just JSON:
{
  "rootCause": "one sentence describing the root cause",
  "summary": "2-3 sentence incident summary for the engineering team",
  "severity": "low|medium|high|critical",
  "recommendation": "one actionable fix recommendation"
}`;

    try {
      const response = await this.env.AI.run("@cf/meta/llama-3.1-8b-instruct" as any, {
        prompt,
        max_tokens: 512
      });
      const text = (response as any)?.response ?? "";
      console.log("[AI] Raw response length:", text.length);
      const parsed = this.parseAIJson(text);
      if (parsed) {
        console.log("[AI] Successfully parsed response");
        return parsed;
      }
      console.warn("[AI] Could not parse JSON from response, using fallback");
    } catch (e) {
      console.error("[AI] Workers AI call failed:", e);
    }

    return {
      rootCause: `Elevated error rate detected on ${endpoint}`,
      summary: `Automated investigation complete for ${endpoint}. Error spike detected and logged. Manual review recommended.`,
      severity: "high",
      recommendation: "Check origin server health and review recent deployments."
    };
  }

  private async storeIncidentEmbedding(
    incidentId: string,
    endpoint: string,
    summary: string,
    rootCause: string,
    severity: string
  ): Promise<void> {
    console.log("-> Attempting Vectorize storage for incident:", incidentId);
    try {
      const textToEmbed = `${endpoint}: ${rootCause}. ${summary}`;
      const embeddingResponse = await this.env.AI.run("@cf/baai/bge-base-en-v1.5" as any, {
        text: [textToEmbed]
      });
      const vector = (embeddingResponse as any)?.data?.[0];
      if (!vector || !Array.isArray(vector)) {
        console.warn("Embedding generation returned no vector, skipping Vectorize store");
        return;
      }

      try {
        await (this.env.VECTORIZE as any).insert([
          {
            id: incidentId,
            values: vector,
            metadata: {
              endpoint,
              summary,
              rootCause,
              severity,
              resolvedAt: new Date().toISOString()
            }
          }
        ]);
        console.log("-> Incident stored in Vectorize memory");
      } catch (vectorizeError) {
        console.error("Vectorize insert error:", vectorizeError);
        throw vectorizeError;
      }

      console.log(`Stored embedding for incident ${incidentId} in Vectorize`);
    } catch (e) {
      console.error("Failed to store Vectorize embedding:", e);
    }
  }

  private async queryRecentLogsForAI(path: string): Promise<any[]> {
    const { results } = await this.env.DB.prepare(
      `SELECT timestamp, status_code, latency_ms, ip
       FROM api_logs
       WHERE path = ? AND timestamp >= datetime('now', '-2 minutes')
       ORDER BY timestamp DESC
       LIMIT 50`
    )
      .bind(path)
      .all<{ timestamp: string; status_code: number; latency_ms: number; ip: string }>();

    return results ?? [];
  }

  private normalizeSeverity(value: string): "low" | "medium" | "high" | "critical" {
    if (value === "low" || value === "medium" || value === "high" || value === "critical") {
      return value;
    }
    if (value === "med") return "medium";
    return "high";
  }

  private async investigate(incidentId: string, path: string): Promise<void> {
    try {
      const alreadyExists = await this.env.DB.prepare(
        `SELECT status FROM incidents WHERE id = ?`
      )
        .bind(incidentId)
        .first<{ status: string }>();

      if (alreadyExists?.status === "resolved") return;

      this.setState({
        ...this.state,
        incidentId,
        endpoint: path,
        status: "investigating",
        isInvestigating: true
      });

      this.addStep("A", "Phase A: harvesting recent logs");
      const logs = await this.queryRecentLogs(path);
      const logsForAI = await this.queryRecentLogsForAI(path);

      this.addStep("B", "Phase B: retrieving similar incidents");
      const similarIncidents = await this.findSimilarIncidents(path, logs);

      this.addStep("C", "Phase C: reasoning with AI");
      const analysis = await this.analyzeWithAI(path, logsForAI, similarIncidents);

      this.addStep("D", "Phase D: resolving incident in D1");
      const normalizedSeverity = this.normalizeSeverity(analysis.severity);

      await this.env.DB.prepare(
        `UPDATE incidents
         SET status = 'resolved',
             root_cause = ?,
             summary = ?,
             severity = ?,
             resolved_at = datetime('now')
         WHERE id = ?`
      )
        .bind(analysis.rootCause, analysis.summary, normalizedSeverity, incidentId)
        .run();

      this.waitCtx.waitUntil(
        this.storeIncidentEmbedding(
          incidentId,
          path,
          analysis.summary,
          analysis.rootCause,
          analysis.severity
        )
      );

      await this.env.incident_kv.delete(`active_incident:${path}`);

      await this.env.incident_kv.put(
        `incident:${incidentId}`,
        JSON.stringify({
          incidentId,
          endpoint: path,
          rootCause: analysis.rootCause,
          summary: analysis.summary,
          severity: normalizedSeverity,
          recommendation: analysis.recommendation,
          resolvedAt: new Date().toISOString(),
          logCount: logs.split("\n").filter(Boolean).length
        }),
        { expirationTtl: 604800 }
      );

      this.setState({
        ...this.state,
        status: "resolved",
        rootCause: analysis.rootCause,
        summary: analysis.summary,
        severity: normalizedSeverity,
        isInvestigating: false
      });

      this.broadcast(JSON.stringify({
        type: "resolved",
        incidentId,
        summary: analysis.summary,
        rootCause: analysis.rootCause,
        timestamp: new Date().toISOString(),
      }));
    } catch (error) {
      console.warn("Incident investigation failed:", error);
      this.setState({ ...this.state, isInvestigating: false, status: "escalated" });
      this.broadcast(JSON.stringify({
        type: "error",
        incidentId,
        error: error instanceof Error ? error.message : String(error),
        timestamp: new Date().toISOString(),
      }));
    }
  }

  async fetch(request: Request): Promise<Response> {
    console.log("AGENT_WAKEUP");
    const url = new URL(request.url);

    if (url.pathname === "/start" && request.method === "POST") {
      if (this.state.isInvestigating) {
        return new Response(
          JSON.stringify({ status: "ok", message: "Incident already being investigated" }),
          { headers: { "Content-Type": "application/json" } }
        );
      }

      const body = (await request.json().catch(() => ({}))) as {
        path?: string;
        incidentId?: string;
      };
      const path = body.path ?? url.searchParams.get("path") ?? "unknown";
      const incidentId = body.incidentId ?? url.searchParams.get("incidentId") ?? crypto.randomUUID();

      this.setState({
        ...this.state,
        incidentId,
        endpoint: path,
        isInvestigating: true,
        currentStep: "starting"
      });
      this.broadcast(JSON.stringify({ type: "state", incidentId, currentStep: "starting", state: this.state }));

      this.waitCtx.waitUntil(this.investigate(incidentId, path));

      return new Response(
        JSON.stringify({ status: "ok", message: "Investigation started", incidentId }),
        { headers: { "Content-Type": "application/json" } }
      );
    }

    return super.fetch(request);
  }

  async onAlarm(): Promise<void> {
    // Placeholder for alarm handler
  }
}
