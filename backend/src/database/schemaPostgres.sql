-- PostgreSQL version of schema
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
  id SERIAL PRIMARY KEY,
  user_id TEXT NOT NULL,
  predictions TEXT NOT NULL,
  submitted_at TEXT NOT NULL,
  last_updated TEXT NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Standings table
CREATE TABLE IF NOT EXISTS standings (
  id SERIAL PRIMARY KEY,
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
INSERT INTO users (id, name, avatar_url) VALUES
  ('nick', 'Nick', '/avatars/nick.png'),
  ('justin', 'Justin', '/avatars/justin.png'),
  ('chris', 'Chris', '/avatars/chris.png')
ON CONFLICT (id) DO NOTHING;

-- Insert current standings (as of Dec 10, 2025)
INSERT INTO standings (team, gp, w, l, otl, pts, last_updated) VALUES
  ('Tampa Bay Lightning', 30, 17, 11, 2, 36, NOW()::TEXT),
  ('Boston Bruins', 31, 18, 13, 0, 36, NOW()::TEXT),
  ('Detroit Red Wings', 30, 16, 11, 3, 35, NOW()::TEXT),
  ('Montreal Canadiens', 29, 15, 11, 3, 33, NOW()::TEXT),
  ('Toronto Maple Leafs', 29, 14, 11, 4, 32, NOW()::TEXT),
  ('Florida Panthers', 28, 14, 12, 2, 30, NOW()::TEXT),
  ('Ottawa Senators', 29, 13, 12, 4, 30, NOW()::TEXT),
  ('Buffalo Sabres', 30, 12, 14, 4, 28, NOW()::TEXT)
ON CONFLICT DO NOTHING;

-- Insert deadline
INSERT INTO config (key, value) VALUES
  ('deadline', '2025-12-15T23:59:59-05:00')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;

