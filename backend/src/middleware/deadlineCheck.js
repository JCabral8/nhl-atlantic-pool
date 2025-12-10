import { dbQuery } from '../database/dbAdapter.js';

export const checkDeadline = async (req, res, next) => {
  try {
    const config = await dbQuery.get('SELECT value FROM config WHERE key = $1', ['deadline']);
    if (!config) {
      return res.status(500).json({ error: 'Deadline not configured' });
    }
    
    const deadline = new Date(config.value);
    const now = new Date();

    if (now > deadline) {
      return res.status(403).json({
        error: 'Deadline has passed',
        message: 'Predictions can no longer be submitted after the deadline.',
        deadline: deadline.toISOString(),
      });
    }

    next();
  } catch (error) {
    console.error('Deadline check error:', error);
    res.status(500).json({ error: 'Server error checking deadline' });
  }
};

