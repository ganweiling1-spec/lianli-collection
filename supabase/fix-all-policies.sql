-- ============================================================
-- 无色笺 — 一键修复 RLS + Storage 策略
-- 在 Supabase SQL Editor 中运行此文件
-- https://supabase.com/dashboard/project/dstvhnsoxbltzloiwbqv
-- ============================================================

-- 1. 表级 RLS 写入策略（如果尚未创建则创建）
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

-- 2. Storage 写入策略
DO $$ BEGIN
    CREATE POLICY "Anon upload images" ON storage.objects
        FOR INSERT WITH CHECK (bucket_id = 'moments-images');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
    CREATE POLICY "Anon upload audio" ON storage.objects
        FOR INSERT WITH CHECK (bucket_id = 'voice-recordings');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
    CREATE POLICY "Anon update storage" ON storage.objects
        FOR UPDATE USING (bucket_id IN ('moments-images', 'voice-recordings'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
    CREATE POLICY "Anon delete storage" ON storage.objects
        FOR DELETE USING (bucket_id IN ('moments-images', 'voice-recordings'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 3. 确认 buckets 存在（需在 Supabase Dashboard > Storage 中手动创建）
-- bucket 名称: moments-images (Public)
-- bucket 名称: voice-recordings (Public)

-- 4. 确认 image_orientation 列存在
ALTER TABLE moments ADD COLUMN IF NOT EXISTS image_orientation TEXT DEFAULT 'landscape';

-- 5. 验证结果
SELECT 'Table policies:' AS check_point;
SELECT tablename, policyname, cmd FROM pg_policies WHERE tablename IN ('moments', 'love_notes', 'habits');

SELECT 'Storage policies:' AS check_point;
SELECT policyname, cmd FROM pg_policies WHERE tablename = 'objects' AND schemaname = 'storage';
