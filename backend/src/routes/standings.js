import express from 'express';
import { dbQuery } from '../database/dbAdapter.js';
import { updateStandings, updateStandingsInDB } from '../services/standingsUpdater.js';

const router = express.Router();

const ADMIN_PASSWORD = 'hunter';
const checkAdmin = (req, res, next) => {
  const password = req.headers['x-admin-password'] || req.body?.password;
  if (password !== ADMIN_PASSWORD) {
    return res.status(401).json({ error: 'Unauthorized - Invalid password' });
  }
  next();
};

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

// GET /api/standings/last-updated - Get timestamp of last standings update
router.get('/last-updated', async (req, res) => {
  try {
    const result = await dbQuery.get(`
      SELECT MAX(last_updated) as last_updated
      FROM standings
    `);
    
    if (result && result.last_updated) {
      res.json({
        lastUpdated: result.last_updated,
        timestamp: result.last_updated,
      });
    } else {
      res.json({
        lastUpdated: null,
        timestamp: null,
        message: 'No standings data found',
      });
    }
  } catch (error) {
    console.error('Error fetching last updated timestamp:', error);
    res.status(500).json({ 
      error: 'Failed to fetch last updated timestamp',
      details: error.message 
    });
  }
});

// POST /api/standings/update-now - Manually trigger standings update (admin or cron)
// Accepts optional body.standings (array of { team, gp, w, l, otl, pts }) so the client
// can fetch from NHL API (works from browser) and send data — avoids Vercel serverless fetch limits.
router.post('/update-now', checkAdmin, async (req, res) => {
  try {
    const providedStandings = req.body?.standings;
    let result;

    if (Array.isArray(providedStandings) && providedStandings.length > 0) {
      // Client provided standings (e.g. fetched in browser from NHL API)
      const valid = providedStandings.every(
        (s) => s && typeof s.team === 'string' && typeof s.gp === 'number' && typeof s.pts === 'number'
      );
      if (!valid) {
        return res.status(400).json({
          success: false,
          error: 'Invalid standings format. Need array of { team, gp, w, l, otl, pts }.',
        });
      }
      console.log('🔄 Standings update from client-provided data');
      await updateStandingsInDB(providedStandings);
      result = { success: true, updated: providedStandings.length };
    } else {
      // Server-side fetch (may fail on Vercel due to NHL API unreachable)
      console.log('🔄 Manual standings update (server fetch)');
      result = await updateStandings();
    }

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

