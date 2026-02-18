import express from 'express';
import { dbQuery } from '../database/dbAdapter.js';
import db from '../database/dbAdapter.js';

const router = express.Router();

// Password for admin access
const ADMIN_PASSWORD = 'hunter';

// Middleware to check password
const checkPassword = (req, res, next) => {
  const password = req.headers['x-admin-password'] || req.body.password;
  
  if (password !== ADMIN_PASSWORD) {
    return res.status(401).json({ error: 'Unauthorized - Invalid password' });
  }
  
  next();
};

// POST /api/admin/auth - Validate password
router.post('/auth', (req, res) => {
  const { password } = req.body;
  
  if (password === ADMIN_PASSWORD) {
    res.json({ success: true, message: 'Password validated' });
  } else {
    res.status(401).json({ success: false, error: 'Invalid password' });
  }
});

// GET /api/admin/database - Get database information
router.get('/database', checkPassword, async (req, res) => {
  try {
    const usePostgres = process.env.DATABASE_URL && process.env.NODE_ENV === 'production';
    const isPostgres = typeof db.query === 'function';
    
    // Get database type and connection status
    let connectionStatus = 'unknown';
    let dbName = 'unknown';
    
    try {
      if (isPostgres) {
        const result = await db.query('SELECT current_database() as dbname');
        dbName = result.rows[0]?.dbname || 'postgres';
        connectionStatus = 'connected';
      } else {
        dbName = 'SQLite';
        // Test SQLite connection
        db.prepare('SELECT 1').get();
        connectionStatus = 'connected';
      }
    } catch (error) {
      connectionStatus = 'disconnected';
      console.error('Database connection test failed:', error.message);
    }
    
    // Get list of tables
    let tables = [];
    
    try {
      if (isPostgres) {
        // PostgreSQL: Get tables from information_schema
        const tablesResult = await db.query(`
          SELECT table_name 
          FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_type = 'BASE TABLE'
          ORDER BY table_name
        `);
        tables = tablesResult.rows.map(row => row.table_name);
      } else {
        // SQLite: Get tables from sqlite_master
        const tablesResult = db.prepare(`
          SELECT name 
          FROM sqlite_master 
          WHERE type='table' 
          AND name NOT LIKE 'sqlite_%'
          ORDER BY name
        `).all();
        tables = tablesResult.map(row => row.name);
      }
    } catch (error) {
      console.error('Error fetching tables:', error.message);
      tables = [];
    }
    
    // Get table schemas and row counts
    const tableInfo = [];
    
    for (const tableName of tables) {
      try {
        let columns = [];
        let rowCount = 0;
        
        if (isPostgres) {
          // Get columns
          const columnsResult = await db.query(`
            SELECT 
              column_name,
              data_type,
              is_nullable,
              column_default
            FROM information_schema.columns
            WHERE table_name = $1
            ORDER BY ordinal_position
          `, [tableName]);
          columns = columnsResult.rows.map(col => ({
            name: col.column_name,
            type: col.data_type,
            nullable: col.is_nullable === 'YES',
            default: col.column_default,
          }));
          
          // Get row count
          const countResult = await db.query(`SELECT COUNT(*) as count FROM ${tableName}`);
          rowCount = parseInt(countResult.rows[0].count);
        } else {
          // SQLite: Get columns using PRAGMA
          const columnsResult = db.prepare(`PRAGMA table_info(${tableName})`).all();
          columns = columnsResult.map(col => ({
            name: col.name,
            type: col.type,
            nullable: col.notnull === 0,
            default: col.dflt_value,
          }));
          
          // Get row count
          const countResult = db.prepare(`SELECT COUNT(*) as count FROM ${tableName}`).get();
          rowCount = countResult.count;
        }
        
        tableInfo.push({
          name: tableName,
          columns,
          rowCount,
        });
      } catch (error) {
        console.error(`Error fetching info for table ${tableName}:`, error.message);
        tableInfo.push({
          name: tableName,
          columns: [],
          rowCount: 0,
          error: error.message,
        });
      }
    }
    
    res.json({
      databaseType: usePostgres ? 'PostgreSQL' : 'SQLite',
      connectionStatus,
      databaseName: dbName,
      tables: tableInfo,
    });
  } catch (error) {
    console.error('Error fetching database info:', error);
    res.status(500).json({ 
      error: 'Failed to fetch database information',
      details: error.message 
    });
  }
});

// POST /api/admin/predictions - Save a user's predictions (bypasses deadline)
router.post('/predictions', checkPassword, async (req, res) => {
  try {
    const { userId, predictions } = req.body;
    if (!userId) return res.status(400).json({ error: 'userId required' });
    if (!predictions || !Array.isArray(predictions) || predictions.length !== 8) {
      return res.status(400).json({ error: 'predictions must be an array of 8 items with team and rank' });
    }
    const teams = predictions.map((p) => p.team);
    if (new Set(teams).size !== 8) return res.status(400).json({ error: 'All 8 teams must be unique' });
    const ranks = predictions.map((p) => p.rank).sort((a, b) => a - b);
    const expected = [1, 2, 3, 4, 5, 6, 7, 8];
    if (JSON.stringify(ranks) !== JSON.stringify(expected)) {
      return res.status(400).json({ error: 'Ranks must be 1 through 8' });
    }
    const now = new Date().toISOString();
    await dbQuery.run(
      `INSERT INTO predictions (user_id, predictions, submitted_at, last_updated)
       VALUES ($1, $2, $3, $4)`,
      [userId, JSON.stringify(predictions), now, now]
    );
    res.json({ success: true, message: 'Predictions saved', submittedAt: now });
  } catch (error) {
    console.error('Admin save predictions error:', error);
    res.status(500).json({ error: error.message || 'Failed to save predictions' });
  }
});

// GET /api/admin/database/:table - Get data from specific table
router.get('/database/:table', checkPassword, async (req, res) => {
  try {
    const { table } = req.params;
    const limit = parseInt(req.query.limit) || 100;
    const offset = parseInt(req.query.offset) || 0;
    
    // Sanitize table name to prevent SQL injection
    if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(table)) {
      return res.status(400).json({ error: 'Invalid table name' });
    }
    
    const isPostgres = typeof db.query === 'function';
    
    let data = [];
    let totalCount = 0;
    
    try {
      if (isPostgres) {
        // Get total count
        const countResult = await db.query(`SELECT COUNT(*) as count FROM ${table}`);
        totalCount = parseInt(countResult.rows[0].count);
        
        // Get paginated data
        const dataResult = await db.query(
          `SELECT * FROM ${table} ORDER BY id LIMIT $1 OFFSET $2`,
          [limit, offset]
        );
        data = dataResult.rows;
      } else {
        // SQLite
        const countResult = db.prepare(`SELECT COUNT(*) as count FROM ${table}`).get();
        totalCount = countResult.count;
        
        // Get paginated data
        data = db.prepare(
          `SELECT * FROM ${table} ORDER BY id LIMIT ? OFFSET ?`
        ).all(limit, offset);
      }
      
      res.json({
        table,
        data,
        totalCount,
        limit,
        offset,
        hasMore: offset + limit < totalCount,
      });
    } catch (error) {
      // If table doesn't exist or query fails
      res.status(404).json({ 
        error: `Table '${table}' not found or inaccessible`,
        details: error.message 
      });
    }
  } catch (error) {
    console.error('Error fetching table data:', error);
    res.status(500).json({ 
      error: 'Failed to fetch table data',
      details: error.message 
    });
  }
});

export default router;

