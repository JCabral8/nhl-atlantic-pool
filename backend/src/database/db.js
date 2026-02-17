import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Use PostgreSQL if DATABASE_URL is set (production or local testing); otherwise SQLite
// Set DATABASE_URL locally to avoid building better-sqlite3 on Windows (e.g. use Railway Postgres URL)
const usePostgres = !!process.env.DATABASE_URL;

let db;

if (usePostgres) {
  // Use PostgreSQL (required on Vercel; optional locally)
  const { Pool } = await import('pg');
  db = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });

  // Test connection without crashing the serverless function (cold start timeouts can fail)
  try {
    await db.query('SELECT NOW()');
    console.log('✅ Connected to PostgreSQL');
  } catch (error) {
    console.error('❌ PostgreSQL connection error (non-fatal):', error.message);
    // Do not throw: allow the function to load; first real request will get a proper error
  }
} else {
  // SQLite only for local dev; on Vercel/production, no DATABASE_URL = stub so app can load and return clear errors
  if (process.env.VERCEL || process.env.NODE_ENV === 'production') {
    const err = new Error('DATABASE_URL must be set on Vercel. Add it in Settings → Environment Variables for Production and Preview, then redeploy.');
    db = {
      query: () => Promise.reject(err),
      connect: () => Promise.reject(err),
      end: () => Promise.resolve(),
    };
  } else {
  try {
    const Database = (await import('better-sqlite3')).default;
    const dbPath = process.env.DATABASE_PATH || path.join(__dirname, '../../database/nhl_pool.db');
    db = new Database(dbPath);
    db.pragma('foreign_keys = ON');
    console.log('✅ Connected to SQLite');
  } catch (err) {
    console.error('\n❌ Could not start SQLite (better-sqlite3 not built).');
    console.error('   To run the backend locally, add your PostgreSQL URL to backend/.env:\n');
    console.error('   DATABASE_URL=postgresql://...  (copy from Railway: Project → PostgreSQL → Connect)\n');
    console.error('   Then restart: npm run dev\n');
    throw err;
  }
  }
}

export default db;

