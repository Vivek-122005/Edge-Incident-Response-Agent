const BASE_URL = "https://incident-response-agent.vivek-23csai.workers.dev";

async function runSimulation() {
  console.log("Starting incident simulation against production...");

  for (let i = 1; i <= 20; i += 1) {
    try {
      await fetch(`${BASE_URL}/api/checkout?break=true`);
      process.stdout.write(`sent ${i}\n`);
    } catch (error) {
      console.error(`failed ${i}:`, error);
    }
    await new Promise((resolve) => setTimeout(resolve, 120));
  }

  console.log("Simulation complete.");
}

runSimulation().catch((error) => {
  console.error("Simulation crashed:", error);
  process.exit(1);
});
