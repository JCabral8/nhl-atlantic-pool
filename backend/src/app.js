import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import usersRouter from './routes/users.js';
import standingsRouter from './routes/standings.js';
import predictionsRouter from './routes/predictions.js';
import deadlineRouter from './routes/deadline.js';
import adminRouter from './routes/admin.js';

dotenv.config();

const app = express();
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';
const NODE_ENV = process.env.NODE_ENV || 'development';

// Middleware - CORS configuration
if (typeof console !== 'undefined') {
  console.log(`🌐 CORS Configuration - NODE_ENV: ${NODE_ENV}, FRONTEND_URL: ${FRONTEND_URL}`);
}

const corsOptions = {
  origin: function (origin, callback) {
    if (typeof console !== 'undefined') {
      console.log(`📡 CORS request from origin: ${origin}`);
    }
    if (NODE_ENV === 'production') {
      if (!FRONTEND_URL) {
        if (typeof console !== 'undefined') console.error('⚠️ WARNING: FRONTEND_URL not set in production! Allowing all origins.');
        callback(null, true);
      } else {
        if (origin === FRONTEND_URL) {
          callback(null, true);
        } else if (!origin) {
          callback(null, true);
        } else {
          if (FRONTEND_URL.includes('vercel.app') && origin.includes('vercel.app')) {
            if (typeof console !== 'undefined') console.log(`✅ Allowing Vercel origin: ${origin}`);
            callback(null, true);
          } else {
            if (typeof console !== 'undefined') console.warn(`❌ CORS blocked origin: ${origin}. Expected: ${FRONTEND_URL}`);
            callback(null, true);
          }
        }
      }
    } else {
      callback(null, true);
    }
  },
  credentials: true,
};

app.use(cors(corsOptions));
app.use(express.json());

// Routes
app.use('/api/users', usersRouter);
app.use('/api/standings', standingsRouter);
app.use('/api/predictions', predictionsRouter);
app.use('/api/deadline', deadlineRouter);
app.use('/api/admin', adminRouter);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Debug: confirm DATABASE_URL is set (does not reveal the value)
app.get('/api/status', (req, res) => {
  res.json({
    ok: true,
    databaseConfigured: !!process.env.DATABASE_URL,
    nodeEnv: process.env.NODE_ENV || 'development',
  });
});

// No-DB ping (verify API is reachable)
app.get('/api/ping', (req, res) => {
  res.json({ pong: true });
});

// Test endpoint to verify routing works
app.get('/api/test', (req, res) => {
  res.json({ 
    ok: true, 
    path: req.url,
    originalUrl: req.originalUrl,
    method: req.method,
    timestamp: new Date().toISOString()
  });
});

// Proxy for NHL standings (fallback if dedicated api/nhl-standings-proxy.js not hit)
app.get('/api/nhl-standings-proxy', async (req, res) => {
  const nhlUrl = 'https://statsapi.web.nhl.com/api/v1/standings';
  const urls = [
    `https://corsproxy.io/?${encodeURIComponent(nhlUrl)}`,
    `https://api.allorigins.win/raw?url=${encodeURIComponent(nhlUrl)}`,
  ];
  let lastErr;
  for (const proxyUrl of urls) {
    try {
      const proxyRes = await fetch(proxyUrl, { headers: { Accept: 'application/json' } });
      if (!proxyRes.ok) throw new Error(`Proxy ${proxyRes.status}`);
      const data = await proxyRes.json();
      if (data && data.records) return res.json(data);
    } catch (e) {
      lastErr = e;
    }
  }
  console.error('NHL standings proxy error:', lastErr?.message);
  res.status(502).json({ error: 'Could not load NHL standings', details: lastErr?.message || 'Proxy failed' });
});

// Database initialization endpoint (for production setup)
const initDbHandler = async (req, res) => {
  try {
    const fs = await import('fs');
    const path = await import('path');
    const { fileURLToPath } = await import('url');
    const { dbQuery } = await import('./database/dbAdapter.js');

    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);

    const usePostgres = !!process.env.DATABASE_URL;

    let schema;
    if (usePostgres) {
      // Use inlined schema so serverless (Vercel) works without .sql files in the bundle
      const { schemaPostgres } = await import('./database/schemaPostgresInline.js');
      schema = schemaPostgres;
      if (typeof console !== 'undefined') console.log('🗄️  Database type: PostgreSQL (inline schema)');
    } else {
      const schemaPath = path.resolve(__dirname, '..', 'database', 'schema.sql');
      schema = fs.readFileSync(schemaPath, 'utf8');
      if (typeof console !== 'undefined') console.log(`📄 Loading schema from: ${schemaPath}`);
    }

    if (usePostgres) {
      const cleanedSchema = schema
        .split('\n')
        .filter(line => !line.trim().startsWith('--'))
        .join('\n');

      const statements = cleanedSchema
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0);

      const dbModule = await import('./database/db.js');
      const dbPool = dbModule.default;
      const client = await dbPool.connect();

      try {
        await client.query('BEGIN');
        for (let i = 0; i < statements.length; i++) {
          const statement = statements[i];
          if (statement.length > 0) {
            try {
              await client.query(statement);
            } catch (error) {
              if (error.message.includes('already exists') || error.message.includes('duplicate') || error.message.includes('does not exist')) {
                // expected for idempotent init
              } else {
                await client.query('ROLLBACK');
                throw error;
              }
            }
          }
        }
        await client.query('COMMIT');
        const result = await client.query(`SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name`);
        if (typeof console !== 'undefined') console.log('📊 Tables:', result.rows.map(r => r.table_name).join(', '));
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally {
        client.release();
      }
    } else {
      const statements = schema.split(';').map(s => s.trim()).filter(s => s.length > 0 && !s.startsWith('--'));
      for (const statement of statements) {
        try {
          await dbQuery.exec([statement]);
        } catch (error) {
          if (!error.message.includes('already exists') && !error.message.includes('duplicate')) {
            throw error;
          }
        }
      }
    }

    res.json({ success: true, message: 'Database initialized successfully' });
  } catch (error) {
    if (typeof console !== 'undefined') console.error('Database initialization error:', error);
    res.status(500).json({ error: error.message });
  }
};

app.get('/api/init-db', initDbHandler);
app.post('/api/init-db', initDbHandler);

const resetDbHandler = async (req, res) => {
  try {
    const { dbQuery } = await import('./database/dbAdapter.js');
    await dbQuery.run('DELETE FROM predictions');
    try {
      await dbQuery.run('UPDATE users SET waiver_accepted = 0');
    } catch (error) {
      if (!error.message?.includes('does not exist') && !error.message?.includes('no such column')) throw error;
    }
    await dbQuery.run('UPDATE users SET avatar_preferences = NULL');
    res.json({ success: true, message: 'Database reset successfully. All predictions, waivers, and avatar preferences have been cleared.' });
  } catch (error) {
    if (typeof console !== 'undefined') console.error('Database reset error:', error);
    res.status(500).json({ error: error.message });
  }
};

app.get('/api/reset', resetDbHandler);
app.post('/api/reset', resetDbHandler);

const migrateDbHandler = async (req, res) => {
  try {
    const fs = await import('fs');
    const path = await import('path');
    const { fileURLToPath } = await import('url');
    const { dbQuery } = await import('./database/dbAdapter.js');

    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    const usePostgres = !!process.env.DATABASE_URL;

    let migrationPath;
    if (usePostgres) {
      migrationPath = path.join(__dirname, 'database', 'migrations', '001_add_waiver_accepted.sql');
    } else {
      migrationPath = path.resolve(__dirname, '..', 'database', 'migrations', '001_add_waiver_accepted.sql');
    }

    if (!fs.existsSync(migrationPath)) {
      return res.status(404).json({ error: 'Migration file not found' });
    }

    const migration = fs.readFileSync(migrationPath, 'utf8');

    if (usePostgres) {
      const statements = migration.split(';').map(s => s.trim()).filter(s => s.length > 0 && !s.startsWith('--'));
      const dbModule = await import('./database/db.js');
      const dbPool = dbModule.default;
      const client = await dbPool.connect();
      try {
        await client.query('BEGIN');
        for (const statement of statements) {
          if (statement.length > 0) {
            try {
              await client.query(statement);
            } catch (error) {
              if (!error.message.includes('already exists') && !error.message.includes('duplicate column')) throw error;
            }
          }
        }
        await client.query('COMMIT');
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally {
        client.release();
      }
    } else {
      const statements = migration.split(';').map(s => s.trim()).filter(s => s.length > 0 && !s.startsWith('--'));
      for (const statement of statements) {
        try {
          await dbQuery.exec([statement]);
        } catch (error) {
          if (!error.message.includes('duplicate column') && !error.message.includes('already exists')) throw error;
        }
      }
    }

    res.json({ success: true, message: 'Migration completed successfully' });
  } catch (error) {
    if (typeof console !== 'undefined') console.error('Migration error:', error);
    res.status(500).json({ error: error.message });
  }
};

app.get('/api/migrate', migrateDbHandler);
app.post('/api/migrate', migrateDbHandler);

// Cron status endpoint
app.get('/api/cron/status', (req, res) => {
  const timestamp = new Date().toISOString();
  const cronSecretSet = !!process.env.CRON_SECRET;
  const cronSecretLength = process.env.CRON_SECRET ? process.env.CRON_SECRET.length : 0;
  
  res.json({
    configured: cronSecretSet,
    cronSecretLength,
    timestamp,
    message: cronSecretSet 
      ? 'CRON_SECRET is configured' 
      : 'CRON_SECRET is not set. Add it in Vercel environment variables.',
    schedule: 'Daily at 8:00 UTC (configured in vercel.json)',
    endpoint: '/api/cron/standings',
  });
});

app.post('/api/cron/status', async (req, res) => {
  const timestamp = new Date().toISOString();
  const ADMIN_PASSWORD = 'hunter';
  const password = req.headers['x-admin-password'] || req.body?.password;
  
  if (password !== ADMIN_PASSWORD) {
    return res.status(401).json({ 
      success: false,
      error: 'Unauthorized - Invalid admin password',
      timestamp 
    });
  }
  
  if (!process.env.CRON_SECRET) {
    return res.status(500).json({
      success: false,
      error: 'CRON_SECRET not configured. Set it in Vercel environment variables.',
      timestamp,
    });
  }
  
  // Server cannot reach NHL API from Vercel. Standings are updated only via Admin page (browser fetch).
  res.json({
    success: true,
    message: 'Standings are updated from the Admin page only (use "Update NHL standings" button). Server cannot reach NHL API.',
    timestamp,
  });
});

// Error handling
app.use((err, req, res, next) => {
  if (typeof console !== 'undefined') console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

export default app;
