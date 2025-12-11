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

// Middleware
app.use(cors({
  origin: NODE_ENV === 'production' 
    ? [FRONTEND_URL, process.env.FRONTEND_URL] // Allow both configured and env URLs
    : FRONTEND_URL,
  credentials: true,
}));
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
    const schemaFile = usePostgres ? 'schemaPostgres.sql' : 'schema.sql';
    const schemaPath = path.join(__dirname, '../../database', schemaFile);
    
    const schema = fs.readFileSync(schemaPath, 'utf8');
    
    if (usePostgres) {
      // For PostgreSQL, execute the entire schema as-is
      await dbQuery.exec([schema]);
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

