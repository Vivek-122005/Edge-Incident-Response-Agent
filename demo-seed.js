const { execSync } = require('child_process');
const crypto = require('crypto');

console.log('Seeding demo data into D1 Database...');

const endpoints = ['/api/checkout', '/api/login', '/api/search', '/api/payment'];
const rootCauses = [
  'Database connection pool exhausted',
  'Third-party payment gateway timeout',
  'Redis cache eviction caused DB spike',
  'Invalid JSON payload parsing error',
  'Rate limit exceeded by specific IP'
];

async function run() {
  let valuesStr = '';
  
  for (let i = 0; i < 100; i++) {
    const id = crypto.randomUUID();
    const endpoint = endpoints[Math.floor(Math.random() * endpoints.length)];
    const rootCause = rootCauses[Math.floor(Math.random() * rootCauses.length)];
    
    // Spread incidents out over the last 24 hours
    const hoursAgo = Math.floor(Math.random() * 24);
    const minutesAgo = Math.floor(Math.random() * 60);
    const detectedAt = `datetime('now', '-${hoursAgo} hours', '-${minutesAgo} minutes')`;
    const resolvedAt = `datetime('now', '-${hoursAgo} hours', '-${minutesAgo - 5} minutes')`; // Resolved 5 mins later
    
    // Randomize severity
    const severity = Math.random() > 0.8 ? 'high' : (Math.random() > 0.5 ? 'medium' : 'low');
    
    // Random error rate between 0.2 and 0.9
    const errorRate = (Math.random() * 0.7 + 0.2).toFixed(2);
    
    const summary = `Automated resolution for ${endpoint} failure. Diagnosed as: ${rootCause}.`;

    // Append to query string
    valuesStr += `('${id}', ${detectedAt}, 'resolved', '${endpoint}', ${errorRate}, 50, '${rootCause}', '${summary}', '${severity}', ${resolvedAt}),\n`;
  }
  
  // Remove last comma
  valuesStr = valuesStr.slice(0, -2);

  const query = `INSERT INTO incidents (id, detected_at, status, endpoint, error_rate, total_errors, root_cause, summary, severity, resolved_at) VALUES ${valuesStr};`;
  
  try {
    console.log('Executing D1 insert...');
    // We use wrangler d1 execute to run the raw SQL
    execSync(`npx wrangler d1 execute incident-db --remote --command="${query}"`, { stdio: 'inherit' });
    console.log('✅ Successfully seeded 100 incidents for your demo!');
    console.log('Refresh your dashboard to see the metrics update.');
  } catch (error) {
    console.error('Failed to seed database:', error.message);
  }
}

run();
