# Edge Incident Response Agent

> Autonomous AI agent that detects, investigates & resolves API incidents at the edge.

## Project Description

A stateful AI agent that monitors your APIs in real-time, detects anomalies, autonomously investigates them (by browsing logs and querying databases), and alerts humans — all running at the edge with zero servers.

This project is built as an end-to-end incident response system on Cloudflare:
- Ingress monitoring + anomaly detection at the edge
- Stateful AI investigation using Durable Objects + Agents SDK
- Retrieval-augmented context from historical incidents
- Automated incident summary generation in under 60 seconds
- Live incident feed in a React dashboard over WebSocket

## The Problem Statement

When an API goes down or gets attacked, engineers spend 15–30 minutes manually correlating logs, checking dashboards, and writing incident reports. This is slow, expensive, and error-prone. Current monitoring tools (Datadog, PagerDuty) alert you — but they don't investigate for you.

This project solves that gap with an autonomous edge agent that detects, investigates, and summarizes incidents in under 60 seconds — without a single centralized server.

## High-Level Architecture

```text
API Traffic → Workers (Ingress Monitor)
↓ anomaly detected
Agents SDK + Durable Objects (IncidentAgent)
↓ investigation tools
┌───────────┼───────────┬───────────┐
D1          Vectorize   Workers AI   KV
(logs)       (RAG)      (Llama 3.1) (config)
↓ report written
WebSocket → CF Pages Dashboard
```

```text
                    ┌─────────────────────────────────┐
                    │        Cloudflare Edge          │
                    │                                 │
  API Traffic ─────▶│  [Worker] Ingress Monitor       │
                    │       ↓ anomaly detected        │
                    │  [Agents SDK + Durable Object]  │◀── WebSocket (live UI)
                    │    IncidentAgent                │
                    │       ↓ spawns tasks            │
                    │  ┌────┴──────────────────────┐  │
                    │  │ Tool 1: Query D1 logs     │  │
                    │  │ Tool 2: Vectorize (RAG)   │  │
                    │  │ Tool 3: Workers AI LLM    │  │
                    │  └───────────────────────────-┘  │
                    │       ↓ writes summary           │
                    │  [D1] incidents table            │
                    └──────────────────────────────────┘
                              ↓
                    [CF Pages] React Dashboard
                    (live incident feed via WebSocket)
```

## Cloudflare Services

| Service | Purpose |
|---|---|
| Workers | Ingress monitor, anomaly detection, API routing |
| Agents SDK | Stateful IncidentAgent orchestration |
| Durable Objects | Per-incident state and memory |
| Workers AI | LLM inference (Llama 3.1 8B) |
| D1 | Request logs and incident records |
| Vectorize | Semantic search over past incidents (RAG) |
| KV | Config, blocklist, incident report storage |
| Pages | React dashboard with live WebSocket feed |

## Live Demo

- **Dashboard**: https://incident-dashboard.pages.dev
- **Worker**: https://incident-response-agent.vivek-23csai.workers.dev

## Local Development

Prerequisites: Node.js 18+, Wrangler CLI, Cloudflare account

```bash
# Install dependencies
npm install

# Terminal 1 — run Worker locally
npx wrangler dev

# Terminal 2 — run dashboard
npm run dev:frontend

# Terminal 3 — trigger demo incident
node simulate.js
```

## Deployment

```bash
# Deploy Worker
wrangler deploy

# Deploy dashboard
npm run build
wrangler pages deploy dist --project-name=incident-dashboard
```

## Database Setup

```bash
# Create D1 database
wrangler d1 create incident-db

# Apply schema
wrangler d1 execute incident-db --remote --file=schema.sql

# Create KV namespace
wrangler kv namespace create incident-kv

# Create Vectorize index
wrangler vectorize create incident-vectors \
  --dimensions=768 --metric=cosine
```

## How It Works

1. Worker monitors every API request and logs to D1
2. When error rate exceeds 40% in a 2-minute window, agent triggers
3. Durable Object instantiates at nearest Cloudflare PoP
4. Agent queries D1 for recent error logs (Phase A)
5. Agent searches Vectorize for similar past incidents (Phase B)
6. Agent calls Workers AI for root cause analysis (Phase C)
7. Report written to D1, embedding stored in Vectorize (Phase D)
8. WebSocket broadcasts each step to live dashboard
9. Full investigation completes in under 60 seconds

## Key Design Decisions

**Why Durable Objects?**  
Normal Workers are stateless. Each incident needs an agent that remembers what it queried, what the AI said, and its current investigation phase. Durable Objects provide co-located compute and storage — state reads take microseconds, not milliseconds.

**Why Workers AI over OpenAI?**  
The AI inference never leaves Cloudflare's network. No external API round trips, no credentials to manage, no egress costs.

**Why Vectorize?**  
Past incident summaries stored as embeddings enable semantic search. The agent finds the 3 most similar past incidents and gives them to the LLM as context — RAG without a separate service.

## Impact

| Metric | Value |
|---|---|
| Detection latency | < 30 seconds |
| Investigation time (manual) | 15–30 minutes |
| Investigation time (automated) | < 60 seconds |
| Edge coverage | 300+ Cloudflare PoPs |
| Servers required | Zero |

---

Built for Cloudflare placement — Phase 2 submission.
