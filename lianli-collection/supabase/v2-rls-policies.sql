-- ============================================================
-- 无色笺 v2 — RLS Write Policies
-- Run this in Supabase SQL Editor
-- ============================================================

-- Moments: allow anonymous CRUD (protected by password gate)
CREATE POLICY "Anon insert moments" ON moments FOR INSERT WITH CHECK (true);
CREATE POLICY "Anon update moments" ON moments FOR UPDATE USING (true);
CREATE POLICY "Anon delete moments" ON moments FOR DELETE USING (true);

-- Love Notes: allow anonymous CRUD
CREATE POLICY "Anon insert love_notes" ON love_notes FOR INSERT WITH CHECK (true);
CREATE POLICY "Anon update love_notes" ON love_notes FOR UPDATE USING (true);
CREATE POLICY "Anon delete love_notes" ON love_notes FOR DELETE USING (true);

-- Habits: allow anonymous CRUD
CREATE POLICY "Anon insert habits" ON habits FOR INSERT WITH CHECK (true);
CREATE POLICY "Anon update habits" ON habits FOR UPDATE USING (true);
CREATE POLICY "Anon delete habits" ON habits FOR DELETE USING (true);

-- Scroll content: allow anonymous update (for refreshing yearly summary)
CREATE POLICY "Anon update scroll" ON scroll_content FOR UPDATE USING (true);

-- Storage: allow anonymous upload
CREATE POLICY "Anon upload images" ON storage.objects
    FOR INSERT WITH CHECK (bucket_id = 'moments-images');
CREATE POLICY "Anon upload audio" ON storage.objects
    FOR INSERT WITH CHECK (bucket_id = 'voice-recordings');
CREATE POLICY "Anon update storage" ON storage.objects
    FOR UPDATE USING (bucket_id IN ('moments-images', 'voice-recordings'));
CREATE POLICY "Anon delete storage" ON storage.objects
    FOR DELETE USING (bucket_id IN ('moments-images', 'voice-recordings'));
