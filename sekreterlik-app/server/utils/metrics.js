// Simple in-memory metrics in Prometheus exposition format

const metrics = {
  startTimeMs: Date.now(),
  httpRequestsTotal: 0,
  httpRequestsByMethod: {}, // method -> count
  httpRequestsByRoute: {}, // route path (originalUrl base) -> count
  httpRequestDurationMsBucket: {}, // le -> count
  httpRequestsErrorsTotal: 0,
  dbQueryDurationMsBucket: {}, // le -> count
};

const durationBuckets = [50, 100, 200, 300, 500, 750, 1000, 2000, 5000, 10000];

function observeDuration(ms) {
  for (const b of durationBuckets) {
    const key = b.toString();
    if (!metrics.httpRequestDurationMsBucket[key]) metrics.httpRequestDurationMsBucket[key] = 0;
    if (ms <= b) metrics.httpRequestDurationMsBucket[key] += 1;
  }
  if (!metrics.httpRequestDurationMsBucket['+Inf']) metrics.httpRequestDurationMsBucket['+Inf'] = 0;
  metrics.httpRequestDurationMsBucket['+Inf'] += 1;
}

function recordRequest(method, routePath, durationMs, isError) {
  metrics.httpRequestsTotal += 1;
  const m = method.toUpperCase();
  metrics.httpRequestsByMethod[m] = (metrics.httpRequestsByMethod[m] || 0) + 1;
  const routeKey = routePath || 'unknown';
  metrics.httpRequestsByRoute[routeKey] = (metrics.httpRequestsByRoute[routeKey] || 0) + 1;
  observeDuration(durationMs);
  if (isError) metrics.httpRequestsErrorsTotal += 1;
}

const dbDurationBuckets = [1, 2, 5, 10, 20, 50, 100, 200, 500, 1000];
function observeDbDuration(ms) {
  for (const b of dbDurationBuckets) {
    const key = b.toString();
    if (!metrics.dbQueryDurationMsBucket[key]) metrics.dbQueryDurationMsBucket[key] = 0;
    if (ms <= b) metrics.dbQueryDurationMsBucket[key] += 1;
  }
  if (!metrics.dbQueryDurationMsBucket['+Inf']) metrics.dbQueryDurationMsBucket['+Inf'] = 0;
  metrics.dbQueryDurationMsBucket['+Inf'] += 1;
}

function recordDbQuery(durationMs) {
  observeDbDuration(durationMs);
}

function renderMetrics() {
  const lines = [];
  // Uptime
  const uptimeSeconds = Math.floor((Date.now() - metrics.startTimeMs) / 1000);
  lines.push('# TYPE app_uptime_seconds counter');
  lines.push(`app_uptime_seconds ${uptimeSeconds}`);

  // Total requests
  lines.push('# TYPE http_requests_total counter');
  lines.push(`http_requests_total ${metrics.httpRequestsTotal}`);

  // Requests by method
  lines.push('# TYPE http_requests_by_method_total counter');
  for (const [method, count] of Object.entries(metrics.httpRequestsByMethod)) {
    lines.push(`http_requests_by_method_total{method="${method}"} ${count}`);
  }

  // Requests by route (basic labeling)
  lines.push('# TYPE http_requests_by_route_total counter');
  for (const [route, count] of Object.entries(metrics.httpRequestsByRoute)) {
    const safeRoute = route.replace(/"/g, '');
    lines.push(`http_requests_by_route_total{route="${safeRoute}"} ${count}`);
  }

  // Errors
  lines.push('# TYPE http_requests_errors_total counter');
  lines.push(`http_requests_errors_total ${metrics.httpRequestsErrorsTotal}`);

  // Duration histogram (manual buckets)
  lines.push('# TYPE http_request_duration_ms histogram');
  let cumCount = 0;
  for (const b of durationBuckets) {
    const key = b.toString();
    const c = metrics.httpRequestDurationMsBucket[key] || 0;
    cumCount = Math.max(cumCount, c); // bucket counts already cumulative via observeDuration loop
    lines.push(`http_request_duration_ms_bucket{le="${key}"} ${c}`);
  }
  const infCount = metrics.httpRequestDurationMsBucket['+Inf'] || 0;
  lines.push(`http_request_duration_ms_bucket{le="+Inf"} ${infCount}`);
  lines.push(`http_request_duration_ms_count ${infCount}`);
  // Sum is not tracked precisely; omit or approximate using average if needed.

  // DB query duration histogram
  lines.push('# TYPE db_query_duration_ms histogram');
  for (const b of dbDurationBuckets) {
    const key = b.toString();
    const c = metrics.dbQueryDurationMsBucket[key] || 0;
    lines.push(`db_query_duration_ms_bucket{le="${key}"} ${c}`);
  }
  const dbInf = metrics.dbQueryDurationMsBucket['+Inf'] || 0;
  lines.push(`db_query_duration_ms_bucket{le="+Inf"} ${dbInf}`);
  lines.push(`db_query_duration_ms_count ${dbInf}`);

  return lines.join('\n') + '\n';
}

module.exports = { recordRequest, recordDbQuery, renderMetrics };


