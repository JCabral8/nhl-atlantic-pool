-- Migration 001: Add waiver_accepted column to users table
-- PostgreSQL version
ALTER TABLE users ADD COLUMN IF NOT EXISTS waiver_accepted INTEGER DEFAULT 0;

