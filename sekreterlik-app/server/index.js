const express = require('express');
const cors = require('cors');
const path = require('path');
const compression = require('compression');
const Sentry = require('@sentry/node');
const { spawn } = require('child_process');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Import routes
console.log('Importing routes...');
const authRouter = require('./routes/auth');
console.log('Auth router imported');
const membersRouter = require('./routes/members');
console.log('Members router imported');
const meetingsRouter = require('./routes/meetings');
console.log('Meetings router imported');
const regionsRouter = require('./routes/regions');
console.log('Regions router imported');
const positionsRouter = require('./routes/positions');
console.log('Positions router imported');
const tasksRouter = require('./routes/tasks');
console.log('Tasks router imported');
const memberRegistrationsRouter = require('./routes/memberRegistrations');
console.log('Member registrations router imported');
const archiveRouter = require('./routes/archive');
console.log('Archive router imported');
const eventsRouter = require('./routes/events');
console.log('Events router imported');
const personalDocumentsRouter = require('./routes/personalDocuments');
console.log('Personal documents router imported');
const districtsRouter = require('./routes/districts');
console.log('Districts router imported');
const townsRouter = require('./routes/towns');
console.log('Towns router imported');
const neighborhoodsRouter = require('./routes/neighborhoods');
console.log('Neighborhoods router imported');
const villagesRouter = require('./routes/villages');
console.log('Villages router imported');
const stksRouter = require('./routes/stks');
console.log('STKs router imported');
const mosquesRouter = require('./routes/mosques');
console.log('Mosques router imported');
const eventCategoriesRouter = require('./routes/eventCategories');
console.log('Event categories router imported');
const neighborhoodRepresentativesRouter = require('./routes/neighborhoodRepresentatives');
console.log('Neighborhood representatives router imported');
const villageRepresentativesRouter = require('./routes/villageRepresentatives');
console.log('Village representatives router imported');
const neighborhoodSupervisorsRouter = require('./routes/neighborhoodSupervisors');
console.log('Neighborhood supervisors router imported');
const villageSupervisorsRouter = require('./routes/villageSupervisors');
console.log('Village supervisors router imported');
const districtOfficialsRouter = require('./routes/districtOfficials');
console.log('District officials router imported');
const townOfficialsRouter = require('./routes/townOfficials');
console.log('Town officials router imported');
const visitsRouter = require('./routes/visits');
console.log('Visits router imported');
const districtDeputyInspectorsRouter = require('./routes/districtDeputyInspectors');
console.log('District deputy inspectors router imported');
const townDeputyInspectorsRouter = require('./routes/townDeputyInspectors');
console.log('Town deputy inspectors router imported');
const districtManagementMembersRouter = require('./routes/districtManagementMembers');
console.log('District management members router imported');
const townManagementMembersRouter = require('./routes/townManagementMembers');
console.log('Town management members router imported');
const ballotBoxesRouter = require('./routes/ballotBoxes');
console.log('Ballot boxes router imported');
const ballotBoxObserversRouter = require('./routes/ballotBoxObservers');
console.log('Ballot box observers router imported');
const messagesRouter = require('./routes/messages');
console.log('Messages router imported');
const mongoMessagesRouter = require('./routes/mongoMessages');
console.log('MongoDB messages router imported');
const permissionsRouter = require('./routes/permissions');
console.log('Permissions router imported');

// Import middleware
const { authenticateToken } = require('./middleware/auth');
const { recordRequest, renderMetrics } = require('./utils/metrics');
const { rateLimit, createRateLimiter } = require('./middleware/rateLimit');
const { cache } = require('./middleware/cache');

// Import MongoDB connection
const { connectToMongoDB } = require('./config/mongodb');

// Import models
const Admin = require('./models/Admin');
const MemberUser = require('./models/MemberUser');
const PersonalDocument = require('./models/PersonalDocument');
const PositionPermission = require('./models/PositionPermission');

const app = express();
const PORT = process.env.PORT || 5000;

console.log('Starting server setup');

// Initialize database models and MongoDB
Promise.all([
  Admin.init(),
  MemberUser.init(),
  PersonalDocument.init(),
  PositionPermission.init(),
  connectToMongoDB()
]).then(() => {
  console.log('All models and MongoDB initialized');
}).catch((err) => {
  console.error('Error initializing models:', err);
});

// Middleware
// Sentry init (optional)
if (process.env.SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV || 'development',
    tracesSampleRate: 0.1,
  });
  app.use(Sentry.Handlers.requestHandler());
}
// CORS - allow only known dev origins by default, fallback to * if not matched
const envOrigins = (process.env.CORS_ALLOWED_ORIGINS || '').split(',').map(s => s.trim()).filter(Boolean);
const defaultOrigins = [
  'http://localhost:5180',
  'http://localhost:5181',
  'http://localhost:5182',
  'http://127.0.0.1:5180',
  'http://127.0.0.1:5181',
  'http://127.0.0.1:5182',
  // common vite ports
  'http://localhost:5173',
  'http://127.0.0.1:5173',
];
const allowedOrigins = new Set([...(envOrigins.length ? envOrigins : defaultOrigins)]);
app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (allowedOrigins.has(origin)) return callback(null, true);
    if (process.env.NODE_ENV === 'production') {
      return callback(new Error('Not allowed by CORS'));
    }
    return callback(null, true);
  },
}));
// Basic security headers including a minimal CSP
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('Referrer-Policy', 'no-referrer');
  const isProd = process.env.NODE_ENV === 'production';
  const connectSrc = isProd ? "'self'" : ["'self'", 'http://localhost:5000', 'http://127.0.0.1:5000'].join(' ');
  const imgSrc = "'self' data: blob:";
  const csp = [
    "default-src 'self'",
    `img-src ${imgSrc}`,
    "style-src 'self' 'unsafe-inline'",
    `connect-src ${connectSrc}`,
  ].join('; ');
  res.setHeader('Content-Security-Policy', csp);
  next();
});
// Gzip compression for JSON/text responses (threshold 1KB)
app.use(compression({
  threshold: 1024,
  filter: (req, res) => {
    if (req.headers['x-no-compression']) return false;
    return compression.filter(req, res);
  },
}));
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true }));
// Basic rate limiting (apply to all APIs)
app.use('/api', rateLimit);
// Stricter login limiter: 10 req / 5 minutes per IP
const loginLimiter = createRateLimiter({ windowMs: 5 * 60 * 1000, max: 10 });

// Correlation ID and request timing
app.use((req, res, next) => {
  const start = Date.now();
  const correlationId = (
    Math.random().toString(36).slice(2, 10) + Math.random().toString(36).slice(2, 10)
  ).slice(0, 16);
  req.correlationId = correlationId;
  res.setHeader('X-Request-ID', correlationId);

  res.on('finish', () => {
    const durationMs = Date.now() - start;
    const routeBase = (req.baseUrl || req.path || '/').split('?')[0];
    const isError = res.statusCode >= 500;
    recordRequest(req.method, routeBase, durationMs, isError);
    try {
      console.log(
        JSON.stringify({
          level: 'info',
          msg: 'http_request',
          method: req.method,
          path: req.originalUrl,
          route: routeBase,
          status: res.statusCode,
          durationMs,
          requestId: correlationId,
        })
      );
    } catch (_) {}
  });

  next();
});

console.log('Middleware configured');

// Register API routes
console.log('Registering API routes');

app.use('/api/auth', (req, res, next) => {
  if (req.path === '/login') return loginLimiter(req, res, next);
  return next();
}, authRouter);
app.use('/api/members', cache(60), membersRouter);
app.use('/api/meetings', cache(60), meetingsRouter);
app.use('/api/regions', cache(10), regionsRouter);
app.use('/api/positions', cache(10), positionsRouter);
app.use('/api/tasks', tasksRouter);
app.use('/api/member-registrations', memberRegistrationsRouter);
app.use('/api/archive', archiveRouter);
app.use('/api/events', cache(60), eventsRouter);
app.use('/api/personal-documents', personalDocumentsRouter);
app.use('/api/districts', cache(10), districtsRouter);
app.use('/api/towns', cache(10), townsRouter);
app.use('/api/neighborhoods', neighborhoodsRouter);
app.use('/api/villages', villagesRouter);
app.use('/api/stks', stksRouter);
app.use('/api/mosques', mosquesRouter);
app.use('/api/event-categories', eventCategoriesRouter);
app.use('/api/neighborhood-representatives', neighborhoodRepresentativesRouter);
app.use('/api/village-representatives', villageRepresentativesRouter);
app.use('/api/neighborhood-supervisors', neighborhoodSupervisorsRouter);
app.use('/api/village-supervisors', villageSupervisorsRouter);
app.use('/api/district-officials', districtOfficialsRouter);
app.use('/api/town-officials', townOfficialsRouter);
app.use('/api/visits', visitsRouter);
app.use('/api/district-deputy-inspectors', districtDeputyInspectorsRouter);
app.use('/api/town-deputy-inspectors', townDeputyInspectorsRouter);
app.use('/api/district-management-members', districtManagementMembersRouter);
app.use('/api/town-management-members', townManagementMembersRouter);
app.use('/api/ballot-boxes', ballotBoxesRouter);
app.use('/api/ballot-box-observers', ballotBoxObserversRouter);
app.use('/api/messages', messagesRouter);
app.use('/api/mongo-messages', mongoMessagesRouter);
app.use('/api/permissions', permissionsRouter);

console.log('API routes registered');

// Serve static files (photos) with cache headers
app.use('/uploads', express.static(path.join(__dirname, 'uploads'), {
  etag: true,
  maxAge: '7d',
}));

// Main page route
app.get('/', (req, res) => {
  res.json({ 
    message: 'Sekreterlik Uygulaması API Server',
    version: '1.0.0',
    endpoints: {
      health: '/api/health',
      test: '/api/test',
      auth: '/api/auth',
      members: '/api/members',
      meetings: '/api/meetings',
      events: '/api/events',
      tasks: '/api/tasks'
    }
  });
});

// Test routes at the very end
app.get('/test', (req, res) => {
  console.log('Simple test route called');
  res.json({ message: 'Simple test route working!' });
});

app.get('/api/health', async (req, res) => {
  try {
    const db = require('./config/database');
    const start = Date.now();
    let dbOk = true;
    let dbLatencyMs = null;
    try {
      await db.all('SELECT 1 as ok LIMIT 1');
      dbLatencyMs = Date.now() - start;
    } catch (_) {
      dbOk = false;
      dbLatencyMs = Date.now() - start;
    }
    const mem = process.memoryUsage();
    res.json({
      message: 'Server is running!',
      db: dbOk ? 'ok' : 'error',
      dbLatencyMs,
      uptimeSec: Math.round(process.uptime()),
      rssMB: Math.round(mem.rss / 1024 / 1024),
    });
  } catch (e) {
    res.status(500).json({ message: 'Server is running, DB check failed', error: e.message });
  }
});

// Prometheus metrics endpoint
app.get('/api/metrics', (req, res) => {
  res.setHeader('Content-Type', 'text/plain; version=0.0.4');
  res.send(renderMetrics());
});

app.get('/api/test', (req, res) => {
  console.log('Test route called');
  res.json({ message: 'Test route working!' });
});

// 404 handler (after all routes)
app.use((req, res) => {
  res.status(404).json({ message: 'Bulunamadı', code: 'NOT_FOUND' });
});

// Global error handling middleware
app.use((err, req, res, next) => {
  console.error('Global error handler:', err);
  if (process.env.SENTRY_DSN) {
    Sentry.captureException(err);
  }
  res.status(500).json({ message: 'Sunucu hatası', error: err.message });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  // Optional DB maintenance
  if ((process.env.ENABLE_DB_MAINTENANCE || 'true') === 'true') {
    try {
      const db = require('./config/database');
      // Weekly VACUUM (7 days)
      setInterval(() => {
        db.run('VACUUM');
      }, 7 * 24 * 60 * 60 * 1000);
      // Daily backup using script
      setInterval(() => {
        try {
          const proc = spawn('node', ['scripts/backup-sqlite.js'], {
            cwd: __dirname,
            stdio: 'ignore'
          });
          proc.unref();
        } catch (_) {}
      }, 24 * 60 * 60 * 1000);
    } catch (e) {
      console.warn('DB maintenance scheduling failed:', e.message);
    }
  }
});