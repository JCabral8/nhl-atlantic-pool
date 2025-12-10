import express from 'express';
import { dbQuery } from '../database/dbAdapter.js';

const router = express.Router();

// GET /api/standings - Get current standings
router.get('/', async (req, res) => {
  try {
    const standings = await dbQuery.all(`
      SELECT team, gp, w, l, otl, pts, last_updated
      FROM standings
      ORDER BY pts DESC, w DESC
    `);
    
    res.json(standings);
  } catch (error) {
    console.error('Error fetching standings:', error);
    res.status(500).json({ error: 'Failed to fetch standings' });
  }
});

export default router;

