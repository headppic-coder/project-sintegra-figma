-- ========================================
-- SETUP SUPABASE DATABASE
-- ========================================
-- Jalankan script ini di Supabase SQL Editor
-- Dashboard → SQL Editor → New Query → Paste script ini → Run

-- 1. CREATE TABLE
-- ========================================
CREATE TABLE IF NOT EXISTS kv_store_6a7942bb (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. CREATE INDEX untuk performance
-- ========================================
CREATE INDEX IF NOT EXISTS idx_kv_store_created_at
  ON kv_store_6a7942bb(created_at DESC);

-- 3. ENABLE ROW LEVEL SECURITY (RLS)
-- ========================================
ALTER TABLE kv_store_6a7942bb ENABLE ROW LEVEL SECURITY;

-- 4. CREATE RLS POLICIES - Allow Public Access
-- ========================================
-- IMPORTANT: Untuk production, ganti dengan auth policies yang lebih ketat!
-- Policy ini mengizinkan semua orang read/write untuk development

-- Allow SELECT (read)
DROP POLICY IF EXISTS "Allow public read access" ON kv_store_6a7942bb;
CREATE POLICY "Allow public read access"
  ON kv_store_6a7942bb
  FOR SELECT
  USING (true);

-- Allow INSERT (create)
DROP POLICY IF EXISTS "Allow public insert access" ON kv_store_6a7942bb;
CREATE POLICY "Allow public insert access"
  ON kv_store_6a7942bb
  FOR INSERT
  WITH CHECK (true);

-- Allow UPDATE (update)
DROP POLICY IF EXISTS "Allow public update access" ON kv_store_6a7942bb;
CREATE POLICY "Allow public update access"
  ON kv_store_6a7942bb
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- Allow DELETE (delete)
DROP POLICY IF EXISTS "Allow public delete access" ON kv_store_6a7942bb;
CREATE POLICY "Allow public delete access"
  ON kv_store_6a7942bb
  FOR DELETE
  USING (true);

-- 5. CREATE FUNCTION untuk auto-update updated_at
-- ========================================
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 6. CREATE TRIGGER
-- ========================================
DROP TRIGGER IF EXISTS update_kv_store_modtime ON kv_store_6a7942bb;
CREATE TRIGGER update_kv_store_modtime
  BEFORE UPDATE ON kv_store_6a7942bb
  FOR EACH ROW
  EXECUTE FUNCTION update_modified_column();

-- ========================================
-- VERIFICATION QUERIES
-- ========================================
-- Jalankan queries ini untuk verifikasi setup berhasil:

-- Check table exists
SELECT
  schemaname,
  tablename,
  tableowner
FROM pg_tables
WHERE tablename = 'kv_store_6a7942bb';

-- Check RLS is enabled
SELECT
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables
WHERE tablename = 'kv_store_6a7942bb';

-- Check policies
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  cmd
FROM pg_policies
WHERE tablename = 'kv_store_6a7942bb';

-- Test insert
INSERT INTO kv_store_6a7942bb (key, value)
VALUES ('test:setup', '{"message": "Setup successful!", "timestamp": "' || NOW() || '"}');

-- Test select
SELECT * FROM kv_store_6a7942bb WHERE key = 'test:setup';

-- Clean up test data (optional)
-- DELETE FROM kv_store_6a7942bb WHERE key = 'test:setup';

-- ========================================
-- PRODUCTION SECURITY NOTES
-- ========================================
/*
⚠️ IMPORTANT untuk Production:

1. Ganti RLS policies dengan authentication:
   - Gunakan auth.uid() untuk user-specific data
   - Restrict berdasarkan user roles
   - Implementasi proper authorization

2. Contoh policy dengan auth:

   CREATE POLICY "Users can read own data"
     ON kv_store_6a7942bb
     FOR SELECT
     USING (auth.uid()::text = (value->>'user_id')::text);

3. Enable SSL/TLS di production
4. Set up database backups
5. Monitor query performance
6. Implement rate limiting
*/
