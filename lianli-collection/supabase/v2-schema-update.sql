-- ============================================================
-- 无色笺 v2 — Schema Updates
-- Run this in Supabase SQL Editor
-- ============================================================

-- 1. Add title column to love_notes (for letter mode)
ALTER TABLE love_notes ADD COLUMN IF NOT EXISTS title TEXT;
ALTER TABLE love_notes ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- 2. Add updated_at to habits
ALTER TABLE habits ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- 3. Add image_orientation to moments (portrait/landscape/square)
ALTER TABLE moments ADD COLUMN IF NOT EXISTS image_orientation TEXT DEFAULT 'landscape';
