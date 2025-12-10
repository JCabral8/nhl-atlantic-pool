import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Check if we should use PostgreSQL or SQLite
const usePostgres = process.env.DATABASE_URL && process.env.NODE_ENV === 'production';

if (usePostgres) {
  // Initialize PostgreSQL database
  const { Pool } = await import('pg');
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });

  const schemaPath = path.join(__dirname, '../database/schemaPostgres.sql');
  const schema = fs.readFileSync(schemaPath, 'utf8');
  
  try {
    await pool.query(schema);
    console.log('✅ PostgreSQL database initialized successfully!');
  } catch (error) {
    console.error('❌ PostgreSQL initialization error:', error);
    throw error;
  } finally {
    await pool.end();
  }
} else {
  // Initialize SQLite database
  const Database = (await import('better-sqlite3')).default;
  
  const dbDir = path.join(__dirname, '../../database');
  const dbPath = path.join(dbDir, 'nhl_pool.db');
  const schemaPath = path.join(dbDir, 'schema.sql');

  // Ensure database directory exists
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }

  // Create database connection
  const db = new Database(dbPath);
  db.pragma('foreign_keys = ON');

  // Read and execute schema
  const schema = fs.readFileSync(schemaPath, 'utf8');
  db.exec(schema);

  console.log('✅ SQLite database initialized successfully!');
  console.log('Database location:', dbPath);

  db.close();
}

