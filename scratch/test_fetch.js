const WORKER = 'https://incident-response-agent.vivek-23csai.workers.dev';

async function test() {
  console.log(`Testing ${WORKER}...`);
  try {
    const res = await fetch(WORKER);
    console.log(`Status: ${res.status}`);
    const text = await res.text();
    console.log(`Body: ${text}`);
  } catch (e) {
    console.error('Fetch failed:', e);
  }
}

test();
