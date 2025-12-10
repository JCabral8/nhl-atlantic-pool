import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Use PostgreSQL in production if DATABASE_URL is set, otherwise use SQLite
const usePostgres = process.env.DATABASE_URL && process.env.NODE_ENV === 'production';

let db;

if (usePostgres) {
  // Use PostgreSQL
  const { Pool } = await import('pg');
  db = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });
  
  // Test connection
  try {
    await db.query('SELECT NOW()');
    console.log('✅ Connected to PostgreSQL');
  } catch (error) {
    console.error('❌ PostgreSQL connection error:', error);
    throw error;
  }
} else {
  // Use SQLite for local development
  const dbPath = process.env.DATABASE_PATH || path.join(__dirname, '../../database/nhl_pool.db');
  db = new Database(dbPath);
  db.pragma('foreign_keys = ON');
  console.log('✅ Connected to SQLite');
}

export default db;

