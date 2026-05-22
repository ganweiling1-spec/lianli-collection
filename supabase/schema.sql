-- ============================================================
-- 无色笺 (Lianli Collection) — Database Schema
-- ============================================================

-- Enable pgcrypto for SHA-256 hashing
CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;

-- ------------------------------------------------------------
-- Table 1: Password hash storage (single row, never directly exposed)
-- ------------------------------------------------------------
CREATE TABLE site_password (
    id            SMALLINT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
    password_hash TEXT NOT NULL,
    updated_at    TIMESTAMPTZ DEFAULT now()
);

-- ------------------------------------------------------------
-- Table 2: Travel moments / 展齿苍苔
-- ------------------------------------------------------------
CREATE TABLE moments (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title         TEXT NOT NULL DEFAULT '',
    description   TEXT DEFAULT '',
    image_url     TEXT,
    recorded_date DATE NOT NULL,
    solar_term    TEXT,
    location      TEXT DEFAULT '',
    created_at    TIMESTAMPTZ DEFAULT now(),
    updated_at    TIMESTAMPTZ DEFAULT now(),
    sort_order    INT DEFAULT 0
);

-- ------------------------------------------------------------
-- Table 3: Love notes / 春水温澜
-- ------------------------------------------------------------
CREATE TABLE love_notes (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    content     TEXT NOT NULL,
    speaker     TEXT NOT NULL CHECK (speaker IN ('her', 'him')),
    has_voice   BOOLEAN DEFAULT false,
    voice_url   TEXT,
    created_at  TIMESTAMPTZ DEFAULT now(),
    sort_order  INT DEFAULT 0
);

-- ------------------------------------------------------------
-- Table 4: Habits / 冷暖共知
-- ------------------------------------------------------------
CREATE TABLE habits (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    person      TEXT NOT NULL CHECK (person IN ('her', 'him')),
    category    TEXT NOT NULL,
    content     TEXT NOT NULL,
    icon_name   TEXT DEFAULT 'default',
    note        TEXT DEFAULT '',
    created_at  TIMESTAMPTZ DEFAULT now(),
    sort_order  INT DEFAULT 0
);

-- ------------------------------------------------------------
-- Table 5: Voice play tracking
-- ------------------------------------------------------------
CREATE TABLE voice_play_log (
    id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    note_id   UUID REFERENCES love_notes(id) ON DELETE CASCADE,
    played_at TIMESTAMPTZ DEFAULT now()
);

-- ------------------------------------------------------------
-- Table 6: Easter egg scroll content (single row)
-- ------------------------------------------------------------
CREATE TABLE scroll_content (
    id         SMALLINT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
    title      TEXT NOT NULL DEFAULT '岁序无言，纸短情长',
    summary    TEXT NOT NULL,
    cover_date TEXT NOT NULL DEFAULT '乙巳年 夏',
    seal_text  TEXT NOT NULL DEFAULT '无色笺',
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- Indexes
-- ============================================================
CREATE INDEX idx_moments_date       ON moments(recorded_date DESC);
CREATE INDEX idx_moments_term       ON moments(solar_term);
CREATE INDEX idx_love_notes_speaker ON love_notes(speaker);
CREATE INDEX idx_love_notes_order   ON love_notes(sort_order);
CREATE INDEX idx_habits_person      ON habits(person, category);
CREATE INDEX idx_voice_play_note    ON voice_play_log(note_id);

-- ============================================================
-- Row Level Security (RLS)
-- ============================================================
ALTER TABLE site_password   ENABLE ROW LEVEL SECURITY;
ALTER TABLE moments         ENABLE ROW LEVEL SECURITY;
ALTER TABLE love_notes      ENABLE ROW LEVEL SECURITY;
ALTER TABLE habits          ENABLE ROW LEVEL SECURITY;
ALTER TABLE voice_play_log  ENABLE ROW LEVEL SECURITY;
ALTER TABLE scroll_content  ENABLE ROW LEVEL SECURITY;

-- Public read policies
CREATE POLICY "Public read moments"    ON moments       FOR SELECT USING (true);
CREATE POLICY "Public read love_notes" ON love_notes    FOR SELECT USING (true);
CREATE POLICY "Public read habits"     ON habits        FOR SELECT USING (true);
CREATE POLICY "Public read scroll"     ON scroll_content FOR SELECT USING (true);
CREATE POLICY "Public read play_log"   ON voice_play_log FOR SELECT USING (true);

-- Public insert for voice play tracking only
CREATE POLICY "Public insert play_log" ON voice_play_log FOR INSERT WITH CHECK (true);

-- Note: No SELECT policy on site_password — it is only accessible via RPC

-- ============================================================
-- RPC Functions (SECURITY DEFINER bypasses RLS)
-- ============================================================

-- Password verification
CREATE OR REPLACE FUNCTION verify_password(input_password TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
    stored_hash TEXT;
BEGIN
    SELECT password_hash INTO stored_hash
    FROM site_password
    WHERE id = 1;

    IF stored_hash IS NULL THEN
        RETURN false;
    END IF;

    RETURN stored_hash = encode(extensions.digest(input_password, 'sha256'), 'hex');
END;
$$;

-- Get voice play count
CREATE OR REPLACE FUNCTION get_voice_play_count(note_id UUID)
RETURNS INT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
    RETURN (SELECT COUNT(*) FROM voice_play_log WHERE voice_play_log.note_id = note_id);
END;
$$;

-- Record voice play
CREATE OR REPLACE FUNCTION record_voice_play(note_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
    INSERT INTO voice_play_log (note_id) VALUES (note_id);
END;
$$;

-- ============================================================
-- Storage Buckets (run via Supabase Dashboard > SQL Editor)
-- ============================================================
-- Buckets are created via the Supabase dashboard UI or API,
-- not via SQL. After creating buckets, apply these policies:

-- For each bucket (moments-images, voice-recordings, site-assets):
-- CREATE POLICY "Public read storage" ON storage.objects
--     FOR SELECT USING (bucket_id IN ('moments-images', 'voice-recordings', 'site-assets'));
