import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import usersRouter from './routes/users.js';
import standingsRouter from './routes/standings.js';
import predictionsRouter from './routes/predictions.js';
import deadlineRouter from './routes/deadline.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';
const NODE_ENV = process.env.NODE_ENV || 'development';

// Middleware - CORS configuration
console.log(`🌐 CORS Configuration - NODE_ENV: ${NODE_ENV}, FRONTEND_URL: ${FRONTEND_URL}`);

const corsOptions = {
  origin: function (origin, callback) {
    // Log the origin for debugging
    console.log(`📡 CORS request from origin: ${origin}`);
    
    // In production, allow the configured FRONTEND_URL
    if (NODE_ENV === 'production') {
      if (!FRONTEND_URL) {
        console.error('⚠️ WARNING: FRONTEND_URL not set in production! Allowing all origins.');
        callback(null, true);
      } else {
        // Allow exact match
        if (origin === FRONTEND_URL) {
          callback(null, true);
        } else if (!origin) {
          // Allow requests with no origin (like Postman, curl, etc.)
          callback(null, true);
        } else {
          // For Vercel, also allow preview deployments (they have different subdomains)
          if (FRONTEND_URL.includes('vercel.app') && origin.includes('vercel.app')) {
            console.log(`✅ Allowing Vercel origin: ${origin}`);
            callback(null, true);
          } else {
            console.warn(`❌ CORS blocked origin: ${origin}. Expected: ${FRONTEND_URL}`);
            // Temporarily allow for debugging - remove this in production
            callback(null, true);
          }
        }
      }
    } else {
      // In development, allow all localhost origins
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

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Database initialization endpoint (for production setup)
// Accepts both GET and POST for easy browser access
const initDbHandler = async (req, res) => {
  try {
    const fs = await import('fs');
    const path = await import('path');
    const { fileURLToPath } = await import('url');
    const { dbQuery } = await import('./database/dbAdapter.js');
    
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    
    // Use PostgreSQL schema in production, SQLite schema in development
    const usePostgres = process.env.DATABASE_URL && process.env.NODE_ENV === 'production';
    
    let schemaPath;
    if (usePostgres) {
      // PostgreSQL schema is in src/database/
      schemaPath = path.join(__dirname, 'database', 'schemaPostgres.sql');
    } else {
      // SQLite schema is in backend/database/
      // Resolve relative to backend root (go up from src/ to backend/)
      schemaPath = path.resolve(__dirname, '..', 'database', 'schema.sql');
    }
    
    const schema = fs.readFileSync(schemaPath, 'utf8');
    console.log(`📄 Loading schema from: ${schemaPath}`);
    console.log(`🗄️  Database type: ${usePostgres ? 'PostgreSQL' : 'SQLite'}`);
    console.log(`📏 Schema length: ${schema.length} characters`);
    
    if (usePostgres) {
      // For PostgreSQL, split into individual statements and execute each one
      // Remove comment-only lines first, then split by semicolon
      const cleanedSchema = schema
        .split('\n')
        .filter(line => !line.trim().startsWith('--'))
        .join('\n');
      
      const statements = cleanedSchema
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0);
      
      console.log(`📝 Found ${statements.length} SQL statements`);
      
      // Use a client connection for better control
      const dbModule = await import('./database/db.js');
      const dbPool = dbModule.default;
      const client = await dbPool.connect();
      
      try {
        await client.query('BEGIN');
        
        for (let i = 0; i < statements.length; i++) {
          const statement = statements[i];
          if (statement.length > 0) {
            try {
              console.log(`  Executing statement ${i + 1}/${statements.length}: ${statement.substring(0, 50)}...`);
              await client.query(statement);
              console.log(`  ✅ Statement ${i + 1} completed`);
            } catch (error) {
              // Log but continue for statements that might fail (like ON CONFLICT)
              if (error.message.includes('already exists') || 
                  error.message.includes('duplicate') ||
                  error.message.includes('does not exist')) {
                console.log(`  ⚠️  Statement ${i + 1} warning (expected): ${error.message}`);
              } else {
                console.error(`  ❌ Statement ${i + 1} error:`, error.message);
                console.error(`  Full statement:`, statement);
                throw error;
              }
            }
          }
        }
        
        await client.query('COMMIT');
        console.log('✅ All statements executed successfully');
        
        // Verify tables were created
        const result = await client.query(`
          SELECT table_name 
          FROM information_schema.tables 
          WHERE table_schema = 'public'
          ORDER BY table_name
        `);
        console.log('📊 Tables in database:', result.rows.map(r => r.table_name).join(', '));
        
      } catch (error) {
        await client.query('ROLLBACK');
        console.error('❌ Transaction rolled back:', error);
        throw error;
      } finally {
        client.release();
      }
    } else {
      // For SQLite, split into statements
      const statements = schema
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0 && !s.startsWith('--'));
      
      for (const statement of statements) {
        try {
          await dbQuery.exec([statement]);
        } catch (error) {
          // Ignore errors for statements that might already exist
          if (!error.message.includes('already exists') && !error.message.includes('duplicate')) {
            console.warn('Schema statement warning:', error.message);
          }
        }
      }
    }
    
    res.json({ success: true, message: 'Database initialized successfully' });
  } catch (error) {
    console.error('Database initialization error:', error);
    res.status(500).json({ error: error.message });
  }
};

app.get('/api/init-db', initDbHandler);
app.post('/api/init-db', initDbHandler);

// Error handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

app.listen(PORT, () => {
  console.log(`🚀 Backend server running on http://localhost:${PORT}`);
  console.log(`📊 Accepting requests from ${FRONTEND_URL}`);
});

