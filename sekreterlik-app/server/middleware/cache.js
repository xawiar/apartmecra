// Very simple in-memory cache for idempotent GET requests
// Keyed by originalUrl, with TTL in seconds

const store = new Map();

function cache(ttlSeconds = 60) {
  return (req, res, next) => {
    if (req.method !== 'GET') return next();

    const key = req.originalUrl;
    const now = Date.now();
    const hit = store.get(key);
    if (hit && (now - hit.ts) < ttlSeconds * 1000) {
      res.setHeader('X-Cache', 'HIT');
      return res.status(hit.status).set(hit.headers).send(hit.body);
    }

    const originalJson = res.json.bind(res);
    const originalSend = res.send.bind(res);
    const originalStatus = res.status.bind(res);

    let statusCode = 200;
    res.status = (code) => { statusCode = code; return originalStatus(code); };

    // Capture JSON responses
    res.json = (data) => {
      try {
        store.set(key, { ts: Date.now(), body: data, headers: {}, status: statusCode });
        res.setHeader('X-Cache', 'MISS');
      } catch (_) {}
      return originalJson(data);
    };

    // Capture text responses
    res.send = (data) => {
      try {
        store.set(key, { ts: Date.now(), body: data, headers: {}, status: statusCode });
        res.setHeader('X-Cache', 'MISS');
      } catch (_) {}
      return originalSend(data);
    };

    next();
  };
}

module.exports = { cache };

// Invalidate cached entries by URL prefix
function invalidate(prefix) {
  try {
    const keys = Array.from(store.keys());
    let deleted = 0;
    for (const k of keys) {
      if (k.startsWith(prefix)) {
        store.delete(k);
        deleted++;
      }
    }
    console.log(`[Cache] Invalidated ${deleted} entries for prefix: ${prefix}`);
  } catch (error) {
    console.error('[Cache] Error invalidating cache:', error);
  }
}

// Clear all cache
function clearAll() {
  store.clear();
  console.log('[Cache] All cache cleared');
}

module.exports.invalidate = invalidate;
module.exports.clearAll = clearAll;


