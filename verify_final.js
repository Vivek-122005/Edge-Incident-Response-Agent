const WORKER = "https://incident-response-agent.vivek-23csai.workers.dev";
const PAGES = "https://6c1e5463.incident-dashboard-907.pages.dev";

async function check(label, fn) {
  try {
    const result = await fn();
    console.log(`✅ ${label}: ${result}`);
    return true;
  } catch (e) {
    console.log(`❌ ${label}: FAILED — ${e.message}`);
    return false;
  }
}

async function run() {
  console.log("\n=== FINAL DEPLOYMENT VERIFICATION ===\n");

  let passed = 0;
  let total = 0;

  async function test(label, fn) {
    total += 1;
    if (await check(label, fn)) passed += 1;
  }

  await test("Worker health check", async () => {
    const r = await fetch(`${WORKER}/`);
    const d = await r.json();
    if (!d.status) throw new Error("No status field");
    return `HTTP ${r.status}`;
  });

  await test("Worker /incidents returns array", async () => {
    const r = await fetch(`${WORKER}/incidents`);
    const d = await r.json();
    if (!Array.isArray(d)) throw new Error("Not array");
    return `${d.length} incidents`;
  });

  await test("Incidents have AI-generated content", async () => {
    const r = await fetch(`${WORKER}/incidents`);
    const d = await r.json();
    const resolved = d.filter((i) => i.status === "resolved" && i.root_cause && i.root_cause.length > 10);
    if (!resolved.length) throw new Error("No resolved incidents with root_cause");
    return `${resolved.length} with AI content`;
  });

  await test("Normal request returns 200", async () => {
    const r = await fetch(`${WORKER}/api/checkout`);
    if (r.status !== 200) throw new Error(`Got ${r.status}`);
    return "HTTP 200";
  });

  await test("Break request returns 500", async () => {
    const r = await fetch(`${WORKER}/api/checkout?break=true`);
    if (r.status !== 500) throw new Error(`Got ${r.status}`);
    return "HTTP 500";
  });

  await test("Pages dashboard is live", async () => {
    const r = await fetch(PAGES);
    if (r.status !== 200) throw new Error(`Got ${r.status}`);
    const text = await r.text();
    if (!text.includes("Incident")) throw new Error("Dashboard content not found");
    return `HTTP ${r.status}`;
  });

  await test("CORS headers present on /incidents", async () => {
    const r = await fetch(`${WORKER}/incidents`);
    const cors = r.headers.get("access-control-allow-origin");
    if (!cors) throw new Error("No CORS header");
    return `CORS: ${cors}`;
  });

  console.log(`\n=== RESULTS: ${passed}/${total} checks passed ===`);

  if (passed === total) {
    console.log("\n🎉 ALL CHECKS PASSED — Project is demo ready!\n");
    console.log(`Worker:    ${WORKER}`);
    console.log(`Dashboard: ${PAGES}`);
    console.log("\nNext: Run node simulate.js for the full demo\n");
  } else {
    console.log("\n⚠ Some checks failed. Fix before demo.\n");
  }
}

run().catch(console.error);
