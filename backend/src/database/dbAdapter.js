// Database adapter that works with both SQLite and PostgreSQL
import db from './db.js';

// Check if we're using PostgreSQL (has query method) or SQLite (has prepare method)
const isPostgres = typeof db.query === 'function';

// Convert PostgreSQL-style parameters ($1, $2) to SQLite-style (?) if needed
const convertQuery = (query, params) => {
  if (!isPostgres) {
    // Convert $1, $2, etc. to ? for SQLite
    let convertedQuery = query;
    for (let i = 1; i <= params.length; i++) {
      convertedQuery = convertedQuery.replace(new RegExp(`\\$${i}\\b`, 'g'), '?');
    }
    return convertedQuery;
  }
  return query;
};

// Helper to execute queries in a unified way
export const dbQuery = {
  // Execute a SELECT query and return all results
  all: async (query, params = []) => {
    const convertedQuery = convertQuery(query, params);
    if (isPostgres) {
      const result = await db.query(convertedQuery, params);
      return result.rows;
    } else {
      return db.prepare(convertedQuery).all(...params);
    }
  },

  // Execute a SELECT query and return first result
  get: async (query, params = []) => {
    const convertedQuery = convertQuery(query, params);
    if (isPostgres) {
      const result = await db.query(convertedQuery, params);
      return result.rows[0] || null;
    } else {
      return db.prepare(convertedQuery).get(...params) || null;
    }
  },

  // Execute an INSERT/UPDATE/DELETE query
  run: async (query, params = []) => {
    const convertedQuery = convertQuery(query, params);
    if (isPostgres) {
      const result = await db.query(convertedQuery, params);
      return {
        changes: result.rowCount || 0,
        lastInsertRowid: null, // PostgreSQL doesn't have this in the same way
      };
    } else {
      return db.prepare(convertedQuery).run(...params);
    }
  },

  // Execute multiple queries in a transaction
  exec: async (queries) => {
    if (isPostgres) {
      // PostgreSQL transaction
      const client = await db.connect();
      try {
        await client.query('BEGIN');
        for (const query of queries) {
          await client.query(query);
        }
        await client.query('COMMIT');
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally {
        client.release();
      }
    } else {
      // SQLite transaction
      const transaction = db.transaction((queries) => {
        for (const query of queries) {
          db.exec(query);
        }
      });
      transaction(queries);
    }
  },
};

// Export the db instance for direct access if needed
export default db;

