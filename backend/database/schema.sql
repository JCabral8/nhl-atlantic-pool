-- Users table
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  avatar_url TEXT,
  avatar_preferences TEXT,
  waiver_accepted INTEGER DEFAULT 0
);

-- Predictions table
CREATE TABLE IF NOT EXISTS predictions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  predictions TEXT NOT NULL,
  submitted_at TEXT NOT NULL,
  last_updated TEXT NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Standings table
CREATE TABLE IF NOT EXISTS standings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  team TEXT NOT NULL,
  gp INTEGER,
  w INTEGER,
  l INTEGER,
  otl INTEGER,
  pts INTEGER,
  last_updated TEXT NOT NULL
);

-- Deadline configuration
CREATE TABLE IF NOT EXISTS config (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

-- Insert default users
INSERT OR IGNORE INTO users (id, name, avatar_url) VALUES
  ('nick', 'Nick', '/avatars/nick.png'),
  ('justin', 'Justin', '/avatars/justin.png'),
  ('chris', 'Chris', '/avatars/chris.png');

-- Insert current standings (as of Dec 10, 2025)
INSERT OR REPLACE INTO standings (id, team, gp, w, l, otl, pts, last_updated) VALUES
  (1, 'Tampa Bay Lightning', 30, 17, 11, 2, 36, datetime('now')),
  (2, 'Boston Bruins', 31, 18, 13, 0, 36, datetime('now')),
  (3, 'Detroit Red Wings', 30, 16, 11, 3, 35, datetime('now')),
  (4, 'Montreal Canadiens', 29, 15, 11, 3, 33, datetime('now')),
  (5, 'Toronto Maple Leafs', 29, 14, 11, 4, 32, datetime('now')),
  (6, 'Florida Panthers', 28, 14, 12, 2, 30, datetime('now')),
  (7, 'Ottawa Senators', 29, 13, 12, 4, 30, datetime('now')),
  (8, 'Buffalo Sabres', 30, 12, 14, 4, 28, datetime('now'));

-- Insert deadline
INSERT OR REPLACE INTO config (key, value) VALUES
  ('deadline', '2025-12-14T23:59:59-05:00');

