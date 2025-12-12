import express from 'express';
import { dbQuery } from '../database/dbAdapter.js';
import { updateStandings } from '../services/standingsUpdater.js';

const router = express.Router();

// GET /api/standings - Get current standings
router.get('/', async (req, res) => {
  try {
    const standings = await dbQuery.all(`
      SELECT team, gp, w, l, otl, pts, last_updated
      FROM standings
      ORDER BY pts DESC, w DESC
    `);
    
    // Deduplicate by team name (keep first occurrence)
    const seen = new Set();
    const uniqueStandings = standings.filter(standing => {
      if (seen.has(standing.team)) {
        return false;
      }
      seen.add(standing.team);
      return true;
    });
    
    res.json(uniqueStandings);
  } catch (error) {
    console.error('Error fetching standings:', error);
    res.status(500).json({ error: 'Failed to fetch standings' });
  }
});

// POST /api/standings/update-now - Manually trigger standings update (for testing)
router.post('/update-now', async (req, res) => {
  try {
    console.log('🔄 Manual standings update triggered');
    const result = await updateStandings();
    
    if (result.success) {
      res.json({
        success: true,
        message: 'Standings updated successfully',
        ...result,
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Standings update failed',
        ...result,
      });
    }
  } catch (error) {
    console.error('Error in manual standings update:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

export default router;

