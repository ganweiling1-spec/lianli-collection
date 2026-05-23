-- ============================================================
-- 无色笺 — 一键创建 Buckets + RLS 策略 + Schema 修复
-- 在 Supabase SQL Editor 中运行此文件
-- https://supabase.com/dashboard/project/dstvhnsoxbltzloiwbqv
-- ============================================================

-- ==========================================
-- 第零步：创建 Storage Buckets（关键！）
-- ==========================================
-- 如果 buckets 已存在则跳过
INSERT INTO storage.buckets (id, name, public, file_size_limit)
SELECT 'moments-images', 'moments-images', true, 10485760
WHERE NOT EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'moments-images');

INSERT INTO storage.buckets (id, name, public, file_size_limit)
SELECT 'voice-recordings', 'voice-recordings', true, 10485760
WHERE NOT EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'voice-recordings');

-- 确保已有 bucket 也是 public
UPDATE storage.buckets SET public = true WHERE id IN ('moments-images', 'voice-recordings');

-- ==========================================
-- 第一步：表级 RLS 写入策略
-- ==========================================
DO $$ BEGIN
    CREATE POLICY "Anon insert moments" ON moments FOR INSERT WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
    CREATE POLICY "Anon update moments" ON moments FOR UPDATE USING (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
    CREATE POLICY "Anon delete moments" ON moments FOR DELETE USING (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE POLICY "Anon insert love_notes" ON love_notes FOR INSERT WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
    CREATE POLICY "Anon update love_notes" ON love_notes FOR UPDATE USING (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
    CREATE POLICY "Anon delete love_notes" ON love_notes FOR DELETE USING (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE POLICY "Anon insert habits" ON habits FOR INSERT WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
    CREATE POLICY "Anon update habits" ON habits FOR UPDATE USING (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
    CREATE POLICY "Anon delete habits" ON habits FOR DELETE USING (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ==========================================
-- 第二步：Storage RLS 策略
-- ==========================================
DO $$ BEGIN
    CREATE POLICY "Anon upload images" ON storage.objects
        FOR INSERT TO anon WITH CHECK (bucket_id = 'moments-images');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
    CREATE POLICY "Anon upload audio" ON storage.objects
        FOR INSERT TO anon WITH CHECK (bucket_id = 'voice-recordings');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
    CREATE POLICY "Anon select images" ON storage.objects
        FOR SELECT TO anon USING (bucket_id IN ('moments-images', 'voice-recordings'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
    CREATE POLICY "Anon update storage" ON storage.objects
        FOR UPDATE TO anon USING (bucket_id IN ('moments-images', 'voice-recordings'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
    CREATE POLICY "Anon delete storage" ON storage.objects
        FOR DELETE TO anon USING (bucket_id IN ('moments-images', 'voice-recordings'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ==========================================
-- 第三步：Schema 修复
-- ==========================================
ALTER TABLE moments ADD COLUMN IF NOT EXISTS image_orientation TEXT DEFAULT 'landscape';
ALTER TABLE love_notes ADD COLUMN IF NOT EXISTS title TEXT;
ALTER TABLE love_notes ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();
ALTER TABLE habits ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- ==========================================
-- 验证
-- ==========================================
SELECT '--- Buckets ---' AS info;
SELECT name, public FROM storage.buckets;

SELECT '--- Table RLS Policies ---' AS info;
SELECT tablename, policyname, cmd FROM pg_policies WHERE tablename IN ('moments', 'love_notes', 'habits');

SELECT '--- Storage RLS Policies ---' AS info;
SELECT policyname, cmd FROM pg_policies WHERE tablename = 'objects' AND schemaname = 'storage';
