import express from 'express';
import { dbQuery } from '../database/dbAdapter.js';
import { updateStandingsInDB } from '../services/standingsUpdater.js';

const router = express.Router();

const ADMIN_PASSWORD = 'hunter';
const checkAdmin = (req, res, next) => {
  const password = req.headers['x-admin-password'] || req.body?.password;
  if (password !== ADMIN_PASSWORD) {
    return res.status(401).json({ error: 'Unauthorized - Invalid password' });
  }
  next();
};

// For GitHub Actions (or any external cron): Bearer token must match STANDINGS_INGEST_SECRET
const checkIngestSecret = (req, res, next) => {
  const secret = process.env.STANDINGS_INGEST_SECRET;
  if (!secret) {
    return res.status(503).json({ error: 'STANDINGS_INGEST_SECRET not configured' });
  }
  const auth = req.headers.authorization;
  const token = auth && auth.startsWith('Bearer ') ? auth.slice(7) : '';
  if (token !== secret) {
    return res.status(401).json({ error: 'Unauthorized' });
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

// POST /api/standings/ingest - For GitHub Actions: Bearer STANDINGS_INGEST_SECRET, body { standings }
router.post('/ingest', checkIngestSecret, async (req, res) => {
  try {
    const standings = req.body?.standings;
    if (!Array.isArray(standings) || standings.length === 0) {
      return res.status(400).json({ error: 'standings array required' });
    }
    const valid = standings.every(
      (s) => s && typeof s.team === 'string' && typeof s.gp === 'number' && typeof s.pts === 'number'
    );
    if (!valid) {
      return res.status(400).json({ error: 'Invalid standings format' });
    }
    await updateStandingsInDB(standings);
    res.json({ success: true, updated: standings.length });
  } catch (error) {
    console.error('Standings ingest error:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST /api/standings/update-now - Save standings (client must send body.standings)
// Server does not fetch NHL API (unreachable from Vercel). Use Admin page "Update NHL standings" button.
router.post('/update-now', checkAdmin, async (req, res) => {
  try {
    const standings = req.body?.standings;
    if (!Array.isArray(standings) || standings.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Standings must be provided. Use the Admin page "Update NHL standings" button.',
      });
    }
    const valid = standings.every(
      (s) => s && typeof s.team === 'string' && typeof s.gp === 'number' && typeof s.pts === 'number'
    );
    if (!valid) {
      return res.status(400).json({
        success: false,
        error: 'Invalid standings format. Need array of { team, gp, w, l, otl, pts }.',
      });
    }
    await updateStandingsInDB(standings);
    res.json({
      success: true,
      message: 'Standings updated successfully',
      updated: standings.length,
    });
  } catch (error) {
    console.error('Error saving standings:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;

