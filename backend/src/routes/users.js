import express from 'express';
import { dbQuery } from '../database/dbAdapter.js';

const router = express.Router();

// GET /api/users - Get all users
router.get('/', async (req, res) => {
  try {
    const users = await dbQuery.all('SELECT * FROM users');
    res.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// GET /api/users/:id/avatar - Get user avatar preferences
router.get('/:id/avatar', async (req, res) => {
  try {
    const { id } = req.params;
    const user = await dbQuery.get('SELECT avatar_preferences FROM users WHERE id = $1', [id]);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const preferences = user.avatar_preferences 
      ? JSON.parse(user.avatar_preferences) 
      : null;
    
    res.json({ preferences });
  } catch (error) {
    console.error('Error fetching avatar preferences:', error);
    res.status(500).json({ error: 'Failed to fetch avatar preferences' });
  }
});

// PUT /api/users/:id/avatar - Update user avatar preferences
router.put('/:id/avatar', async (req, res) => {
  try {
    const { id } = req.params;
    const { preferences } = req.body;
    
    if (!preferences) {
      return res.status(400).json({ error: 'Preferences are required' });
    }
    
    const preferencesJson = JSON.stringify(preferences);
    const result = await dbQuery.run(
      'UPDATE users SET avatar_preferences = $1 WHERE id = $2',
      [preferencesJson, id]
    );
    
    if (result.changes === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json({ success: true, preferences });
  } catch (error) {
    console.error('Error updating avatar preferences:', error);
    res.status(500).json({ error: 'Failed to update avatar preferences' });
  }
});

export default router;

