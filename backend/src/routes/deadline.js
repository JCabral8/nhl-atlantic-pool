import express from 'express';
import { dbQuery } from '../database/dbAdapter.js';

const router = express.Router();

// GET /api/deadline - Get deadline status
router.get('/', async (req, res) => {
  try {
    const config = await dbQuery.get('SELECT value FROM config WHERE key = $1', ['deadline']);
    if (!config) {
      return res.status(404).json({ error: 'Deadline not configured' });
    }
    
    const deadline = new Date(config.value);
    const now = new Date();
    
    const isActive = now < deadline;
    const timeRemaining = deadline - now;
    
    res.json({
      deadline: deadline.toISOString(),
      isActive,
      timeRemaining: Math.max(0, timeRemaining),
      currentTime: now.toISOString(),
    });
  } catch (error) {
    console.error('Error fetching deadline:', error);
    res.status(500).json({ error: 'Failed to fetch deadline' });
  }
});

export default router;

