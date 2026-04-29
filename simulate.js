#!/usr/bin/env node
/**
 * Edge Incident Response Agent - Demo Traffic Simulator
 *
 * Usage:
 *   node simulate.js           -> full demo (normal + spike)
 *   node simulate.js --spike   -> error spike only
 *   node simulate.js --normal  -> normal traffic only
 */

const WORKER_URL = "https://incident-response-agent.vivek-23csai.workers.dev";
const DASHBOARD_URL = "https://incident-dashboard.pages.dev";

const args = process.argv.slice(2);
const SPIKE_ONLY = args.includes("--spike");
const NORMAL_ONLY = args.includes("--normal");

async function hit(shouldBreak = false, endpoint = "/api/checkout") {
  try {
    const url = `${WORKER_URL}${endpoint}${shouldBreak ? "?break=true" : ""}`;
    const res = await fetch(url);
    return res.status;
  } catch (_) {
    return 0;
  }
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function log(msg, color = "") {
  const colors = {
    green: "\x1b[32m",
    red: "\x1b[31m",
    yellow: "\x1b[33m",
    blue: "\x1b[34m",
    orange: "\x1b[38;5;208m",
    reset: "\x1b[0m"
  };
  const c = colors[color] || "";
  console.log(`${c}${msg}${colors.reset}`);
}

async function runNormalTraffic(count = 8) {
  log(`\nPhase 1: Sending ${count} normal requests...`, "blue");
  for (let i = 0; i < count; i += 1) {
    const status = await hit(false);
    process.stdout.write(`  Request ${i + 1}/${count} -> ${status}\r`);
    await sleep(300);
  }
  console.log("");
  log("  Normal traffic phase complete", "green");
}

async function runErrorSpike(count = 20) {
  log(`\nPhase 2: Sending ${count} error requests (spike)...`, "red");
  log("  Watch your dashboard - agent should trigger shortly", "yellow");
  for (let i = 0; i < count; i += 1) {
    const status = await hit(true);
    process.stdout.write(`  Request ${i + 1}/${count} -> ${status}\r`);
    await sleep(150);
  }
  console.log("");
  log("  Error spike complete", "red");
}

async function waitForResolution() {
  log("\nWaiting for agent to investigate...", "yellow");
  log("  (This takes 10-30 seconds)", "yellow");

  for (let attempt = 0; attempt < 12; attempt += 1) {
    await sleep(5000);
    try {
      const res = await fetch(`${WORKER_URL}/incidents`);
      const incidents = await res.json();
      const latest = incidents[0];

      if (latest?.status === "resolved" && latest?.root_cause) {
        log("\nINCIDENT RESOLVED!", "green");
        log(`  ID: ${latest.id}`, "green");
        log(`  Root cause: ${latest.root_cause}`, "green");
        log(`  Severity: ${latest.severity}`, "green");
        log(`  Summary: ${latest.summary?.slice(0, 100)}...`, "green");
        return true;
      } else if (latest?.status === "investigating") {
        process.stdout.write(`  Agent investigating... (${(attempt + 1) * 5}s elapsed)\r`);
      }
    } catch (_) {}
  }

  log("\nAgent took longer than expected. Check wrangler tail.", "yellow");
  return false;
}

async function main() {
  log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━", "orange");
  log("  Edge Incident Response Agent - Demo", "orange");
  log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━", "orange");
  log(`\n  Worker:    ${WORKER_URL}`);
  log(`  Dashboard: ${DASHBOARD_URL}`);
  log("\n  Open your dashboard now before running!");
  log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━", "orange");

  if (!SPIKE_ONLY) {
    await runNormalTraffic(8);
    await sleep(2000);
  }

  if (!NORMAL_ONLY) {
    await runErrorSpike(20);
    await waitForResolution();
  }

  log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━", "orange");
  log("  Demo complete!", "green");
  log(`\n  View incidents: ${WORKER_URL}/incidents`);
  log(`  Dashboard:      ${DASHBOARD_URL}`);
  log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n", "orange");
}

main().catch(console.error);
