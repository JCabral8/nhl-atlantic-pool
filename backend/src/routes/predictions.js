import express from 'express';
import { dbQuery } from '../database/dbAdapter.js';
import { checkDeadline } from '../middleware/deadlineCheck.js';

const router = express.Router();

// GET /api/predictions/all - Get all users' predictions with user info
router.get('/all', async (req, res) => {
  try {
    // Get all users
    const users = await dbQuery.all('SELECT id, name, avatar_preferences FROM users');
    
    // Get most recent prediction for each user
    const result = [];
    for (const user of users) {
      const prediction = await dbQuery.get(`
        SELECT predictions, submitted_at, last_updated
        FROM predictions
        WHERE user_id = $1
        ORDER BY last_updated DESC
        LIMIT 1
      `, [user.id]);
      
      if (prediction) {
        result.push({
          userId: user.id,
          userName: user.name,
          avatarPreferences: user.avatar_preferences ? JSON.parse(user.avatar_preferences) : null,
          predictions: JSON.parse(prediction.predictions),
          submittedAt: prediction.submitted_at,
          lastUpdated: prediction.last_updated,
        });
      }
    }
    
    res.json(result);
  } catch (error) {
    console.error('Error fetching all predictions:', error);
    res.status(500).json({ error: 'Failed to fetch all predictions' });
  }
});

// GET /api/predictions/:userId - Get user's predictions
router.get('/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Get the most recent prediction for this user
    const prediction = await dbQuery.get(`
      SELECT predictions, submitted_at, last_updated
      FROM predictions
      WHERE user_id = $1
      ORDER BY last_updated DESC
      LIMIT 1
    `, [userId]);
    
    if (!prediction) {
      return res.json({ predictions: null });
    }
    
    res.json({
      predictions: JSON.parse(prediction.predictions),
      submittedAt: prediction.submitted_at,
      lastUpdated: prediction.last_updated,
    });
  } catch (error) {
    console.error('Error fetching predictions:', error);
    res.status(500).json({ error: 'Failed to fetch predictions' });
  }
});

// POST /api/predictions/:userId - Save predictions
router.post('/:userId', checkDeadline, async (req, res) => {
  try {
    const { userId } = req.params;
    const { predictions } = req.body;
    
    // Validate predictions
    if (!predictions || !Array.isArray(predictions) || predictions.length !== 8) {
      return res.status(400).json({ error: 'Invalid predictions format. Must be an array of 8 teams.' });
    }
    
    // Check for duplicates
    const teams = predictions.map(p => p.team);
    const uniqueTeams = new Set(teams);
    if (uniqueTeams.size !== 8) {
      return res.status(400).json({ error: 'Duplicate teams detected. Each team must be unique.' });
    }
    
    // Validate all ranks 1-8 are present
    const ranks = predictions.map(p => p.rank).sort();
    const expectedRanks = [1, 2, 3, 4, 5, 6, 7, 8];
    if (JSON.stringify(ranks) !== JSON.stringify(expectedRanks)) {
      return res.status(400).json({ error: 'All ranks 1-8 must be assigned.' });
    }
    
    const now = new Date().toISOString();
    
    // Insert new prediction
    await dbQuery.run(`
      INSERT INTO predictions (user_id, predictions, submitted_at, last_updated)
      VALUES ($1, $2, $3, $4)
    `, [userId, JSON.stringify(predictions), now, now]);
    
    res.json({
      success: true,
      message: 'Predictions saved successfully',
      submittedAt: now,
    });
  } catch (error) {
    console.error('Error saving predictions:', error);
    res.status(500).json({ error: 'Failed to save predictions' });
  }
});

export default router;

