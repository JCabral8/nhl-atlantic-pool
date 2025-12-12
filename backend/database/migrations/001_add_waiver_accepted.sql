-- Migration 001: Add waiver_accepted column to users table
-- SQLite version
ALTER TABLE users ADD COLUMN waiver_accepted INTEGER DEFAULT 0;

