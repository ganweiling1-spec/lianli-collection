-- ============================================================
-- 无色笺 — 一键修复：Buckets + RLS + Schema
-- 在 Supabase SQL Editor 中完整运行此文件
-- https://supabase.com/dashboard/project/dstvhnsoxbltzloiwbqv/sql/new
-- ============================================================

-- ==========================================
-- 第〇步：确保 anon 角色有 storage schema 权限
-- ==========================================
GRANT USAGE ON SCHEMA storage TO anon;
GRANT USAGE ON SCHEMA storage TO authenticated;

-- ==========================================
-- 第一步：创建 Storage Buckets
-- ==========================================
-- 如果 bucket 已存在不会报错（ON CONFLICT 静默跳过）
INSERT INTO storage.buckets (id, name, public, file_size_limit, owner)
VALUES ('moments-images', 'moments-images', true, 10485760, NULL)
ON CONFLICT (id) DO UPDATE SET public = true, file_size_limit = 10485760;

INSERT INTO storage.buckets (id, name, public, file_size_limit, owner)
VALUES ('voice-recordings', 'voice-recordings', true, 10485760, NULL)
ON CONFLICT (id) DO UPDATE SET public = true, file_size_limit = 10485760;

-- 确认 bucket 已创建
SELECT '>>> Buckets 创建结果' AS status;
SELECT id, name, public, file_size_limit FROM storage.buckets WHERE id IN ('moments-images', 'voice-recordings');

-- ==========================================
-- 第二步：表级 RLS 写入策略（public schema）
-- ==========================================
DO $$ BEGIN
    CREATE POLICY "Anon insert moments" ON moments FOR INSERT TO anon WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
    CREATE POLICY "Anon update moments" ON moments FOR UPDATE TO anon USING (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
    CREATE POLICY "Anon delete moments" ON moments FOR DELETE TO anon USING (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE POLICY "Anon insert love_notes" ON love_notes FOR INSERT TO anon WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
    CREATE POLICY "Anon update love_notes" ON love_notes FOR UPDATE TO anon USING (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
    CREATE POLICY "Anon delete love_notes" ON love_notes FOR DELETE TO anon USING (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE POLICY "Anon insert habits" ON habits FOR INSERT TO anon WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
    CREATE POLICY "Anon update habits" ON habits FOR UPDATE TO anon USING (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
    CREATE POLICY "Anon delete habits" ON habits FOR DELETE TO anon USING (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 确认表级策略
SELECT '>>> 表级 RLS 策略' AS status;
SELECT tablename, policyname, cmd FROM pg_policies WHERE tablename IN ('moments', 'love_notes', 'habits') ORDER BY tablename, cmd;

-- ==========================================
-- 第三步：Storage RLS 策略（storage schema）
-- ==========================================
-- 先删除可能冲突的旧策略
DO $$ BEGIN
    DROP POLICY IF EXISTS "Anon upload images" ON storage.objects;
    DROP POLICY IF EXISTS "Anon upload audio" ON storage.objects;
    DROP POLICY IF EXISTS "Anon select images" ON storage.objects;
    DROP POLICY IF EXISTS "Anon update storage" ON storage.objects;
    DROP POLICY IF EXISTS "Anon delete storage" ON storage.objects;
END $$;

-- 允许 anon 上传到指定 bucket
CREATE POLICY "Anon upload images" ON storage.objects
    FOR INSERT TO anon WITH CHECK (bucket_id = 'moments-images');

CREATE POLICY "Anon upload audio" ON storage.objects
    FOR INSERT TO anon WITH CHECK (bucket_id = 'voice-recordings');

-- 允许 anon 读取指定 bucket 中的文件（公开访问）
CREATE POLICY "Anon select images" ON storage.objects
    FOR SELECT TO anon USING (bucket_id IN ('moments-images', 'voice-recordings'));

-- 允许 anon 更新/删除自己上传的文件
CREATE POLICY "Anon update storage" ON storage.objects
    FOR UPDATE TO anon USING (bucket_id IN ('moments-images', 'voice-recordings'));

CREATE POLICY "Anon delete storage" ON storage.objects
    FOR DELETE TO anon USING (bucket_id IN ('moments-images', 'voice-recordings'));

-- 确认 storage 策略
SELECT '>>> Storage RLS 策略' AS status;
SELECT policyname, cmd, roles FROM pg_policies WHERE tablename = 'objects' AND schemaname = 'storage' ORDER BY policyname;

-- ==========================================
-- 第四步：Schema 修复
-- ==========================================
ALTER TABLE moments ADD COLUMN IF NOT EXISTS image_orientation TEXT DEFAULT 'landscape';
ALTER TABLE love_notes ADD COLUMN IF NOT EXISTS title TEXT;
ALTER TABLE love_notes ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();
ALTER TABLE habits ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- ==========================================
-- 最终验证
-- ==========================================
SELECT '>>> 修复完成！请确认以下输出合理 <<<' AS result;

-- 检查 buckets
SELECT 'Buckets:' AS check_item;
SELECT name, public FROM storage.buckets;

-- 检查 RLS 是否启用（应该显示 on）
SELECT 'RLS enabled on tables:' AS check_item;
SELECT tablename, rowsecurity FROM pg_tables
WHERE schemaname = 'public' AND tablename IN ('moments', 'love_notes', 'habits');

-- 检查所有策略总数
SELECT 'Policy counts:' AS check_item;
SELECT schemaname, tablename, count(*) AS policies
FROM pg_policies
WHERE tablename IN ('moments', 'love_notes', 'habits', 'objects')
GROUP BY schemaname, tablename;
