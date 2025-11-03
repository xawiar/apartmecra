// Minimal API smoke tests: health, members, events
// Run with: node scripts/smoke-tests.js

async function run() {
  const base = process.env.API_URL || 'http://localhost:5000/api';
  const results = [];
  try {
    const healthRes = await fetch(`${base}/health`);
    results.push({ name: 'health', status: healthRes.status });
    try { await healthRes.json(); } catch (_) {}
  } catch (e) {
    results.push({ name: 'health', error: e.message });
  }

  try {
    const membersRes = await fetch(`${base}/members?page=1&limit=1`);
    const ok = membersRes.ok; const data = ok ? await membersRes.json() : null;
    results.push({ name: 'members', status: membersRes.status, count: Array.isArray(data?.data) ? data.data.length : Array.isArray(data) ? data.length : 0 });
  } catch (e) {
    results.push({ name: 'members', error: e.message });
  }

  try {
    const eventsRes = await fetch(`${base}/events?page=1&limit=1`);
    const ok = eventsRes.ok; const data = ok ? await eventsRes.json() : null;
    results.push({ name: 'events', status: eventsRes.status, count: Array.isArray(data?.data) ? data.data.length : Array.isArray(data) ? data.length : 0 });
  } catch (e) {
    results.push({ name: 'events', error: e.message });
  }

  console.log(JSON.stringify({ results }, null, 2));
}

run();


