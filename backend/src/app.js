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

    let schemaPath;
    if (usePostgres) {
      schemaPath = path.join(__dirname, 'database', 'schemaPostgres.sql');
    } else {
      schemaPath = path.resolve(__dirname, '..', 'database', 'schema.sql');
    }

    const schema = fs.readFileSync(schemaPath, 'utf8');
    if (typeof console !== 'undefined') {
      console.log(`📄 Loading schema from: ${schemaPath}`);
      console.log(`🗄️  Database type: ${usePostgres ? 'PostgreSQL' : 'SQLite'}`);
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

// Error handling
app.use((err, req, res, next) => {
  if (typeof console !== 'undefined') console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

export default app;
