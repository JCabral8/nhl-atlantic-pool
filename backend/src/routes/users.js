import express from 'express';
import { dbQuery } from '../database/dbAdapter.js';

const router = express.Router();

// GET /api/users - Get all users
router.get('/', async (req, res) => {
  try {
    const users = await dbQuery.all('SELECT * FROM users');
    console.log(`✅ Fetched ${users.length} users`);
    res.json(users);
  } catch (error) {
    console.error('❌ Error fetching users:', error);
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      stack: error.stack
    });
    
    // Check if it's a "table doesn't exist" error
    if (error.message && error.message.includes('does not exist')) {
      res.status(500).json({ 
        error: 'Database not initialized. Please visit /api/init-db to initialize the database.',
        details: error.message
      });
    } else {
      res.status(500).json({ 
        error: 'Failed to fetch users',
        details: error.message
      });
    }
  }
});

// GET /api/users/:id/avatar - Get user avatar preferences
// Accepts either numeric ID or user name (e.g., 'nick', 'justin', 'chris'); name lookup is case-insensitive
router.get('/:id/avatar', async (req, res) => {
  try {
    const { id } = req.params;
    const isNumeric = /^\d+$/.test(id);
    const query = isNumeric 
      ? 'SELECT avatar_preferences FROM users WHERE id = $1'
      : 'SELECT avatar_preferences FROM users WHERE LOWER(name) = LOWER($1)';
    const user = await dbQuery.get(query, [id]);
    
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
// Accepts either numeric ID or user name (e.g., 'nick', 'justin', 'chris')
router.put('/:id/avatar', async (req, res) => {
  try {
    const { id } = req.params;
    const { preferences } = req.body;
    
    if (!preferences) {
      return res.status(400).json({ error: 'Preferences are required' });
    }
    
    const preferencesJson = JSON.stringify(preferences);
    const isNumeric = /^\d+$/.test(id);
    const query = isNumeric
      ? 'UPDATE users SET avatar_preferences = $1 WHERE id = $2'
      : 'UPDATE users SET avatar_preferences = $1 WHERE LOWER(name) = LOWER($2)';
    const result = await dbQuery.run(query, [preferencesJson, id]);
    
    if (result.changes === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json({ success: true, preferences });
  } catch (error) {
    console.error('Error updating avatar preferences:', error);
    res.status(500).json({ error: 'Failed to update avatar preferences' });
  }
});

// GET /api/users/:id/waiver - Check if user has accepted waiver
router.get('/:id/waiver', async (req, res) => {
  try {
    const { id } = req.params;
    const isNumeric = /^\d+$/.test(id);
    const query = isNumeric ? 'SELECT waiver_accepted FROM users WHERE id = $1' : 'SELECT waiver_accepted FROM users WHERE LOWER(name) = LOWER($1)';
    const user = await dbQuery.get(query, [id]);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // If column doesn't exist, waiver_accepted will be undefined - treat as not accepted
    const waiverAccepted = user.waiver_accepted === 1 || user.waiver_accepted === true;
    res.json({ waiverAccepted });
  } catch (error) {
    console.error('Error fetching waiver status:', error);
    // If column doesn't exist, return false (not accepted)
    if (error.message && (error.message.includes('no such column') || error.message.includes('does not exist'))) {
      return res.json({ waiverAccepted: false });
    }
    res.status(500).json({ error: 'Failed to fetch waiver status', details: error.message });
  }
});

// PUT /api/users/:id/waiver - Accept waiver (id can be numeric or name, case-insensitive)
router.put('/:id/waiver', async (req, res) => {
  try {
    const { id } = req.params;
    const isNumeric = /^\d+$/.test(id);
    const updateQuery = isNumeric
      ? 'UPDATE users SET waiver_accepted = 1 WHERE id = $1'
      : 'UPDATE users SET waiver_accepted = 1 WHERE LOWER(name) = LOWER($1)';
    
    try {
      const result = await dbQuery.run(updateQuery, [id]);
      if (result.changes === 0) return res.status(404).json({ error: 'User not found' });
      res.json({ success: true, waiverAccepted: true });
    } catch (error) {
      if (error.message && (error.message.includes('no such column') || error.message.includes('does not exist'))) {
        console.log('Waiver column does not exist, attempting to add it...');
        try {
          await dbQuery.run('ALTER TABLE users ADD COLUMN waiver_accepted INTEGER DEFAULT 0');
          const result = await dbQuery.run(updateQuery, [id]);
          if (result.changes === 0) return res.status(404).json({ error: 'User not found' });
          res.json({ success: true, waiverAccepted: true, message: 'Column added and waiver accepted' });
        } catch (migrationError) {
          if (migrationError.message && migrationError.message.includes('duplicate column')) {
            const result = await dbQuery.run(updateQuery, [id]);
            if (result.changes === 0) return res.status(404).json({ error: 'User not found' });
            res.json({ success: true, waiverAccepted: true });
          } else {
            throw migrationError;
          }
        }
      } else {
        throw error;
      }
    }
  } catch (error) {
    console.error('Error updating waiver status:', error);
    res.status(500).json({ 
      error: 'Failed to update waiver status', 
      details: error.message,
      hint: 'You may need to run /api/migrate to add the waiver_accepted column'
    });
  }
});

export default router;

