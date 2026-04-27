-- ============================================
-- FIX KV STORE TABLE STRUCTURE
-- ============================================
-- This script fixes the kv_store_6a7942bb table structure
-- to match the expected schema (key, value) instead of (key, type, data, created_at, updated_at)
--
-- ⚠️ IMPORTANT: Run this in Supabase SQL Editor
-- Dashboard → SQL Editor → New Query → Paste script → Run

-- Step 1: Check current table structure
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'kv_store_6a7942bb'
ORDER BY ordinal_position;

-- Step 2: Backup existing data to a temporary table
CREATE TABLE IF NOT EXISTS kv_store_backup_temp AS
SELECT * FROM kv_store_6a7942bb;

SELECT COUNT(*) as backed_up_rows FROM kv_store_backup_temp;

-- Step 3: Drop the old table
DROP TABLE IF EXISTS kv_store_6a7942bb CASCADE;

-- Step 4: Create the new table with correct structure
CREATE TABLE kv_store_6a7942bb (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL
);

-- Step 5: Migrate data from backup
-- Try to detect which column contains the data and migrate it

-- Option A: If backup has 'value' column (newer structure)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'kv_store_backup_temp' AND column_name = 'value'
  ) THEN
    INSERT INTO kv_store_6a7942bb (key, value)
    SELECT key, value::jsonb
    FROM kv_store_backup_temp
    ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;

    RAISE NOTICE 'Migrated data from value column';
  END IF;
END $$;

-- Option B: If backup has 'data' column (old structure with type, data columns)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'kv_store_backup_temp' AND column_name = 'data'
    AND table_name = 'kv_store_backup_temp' AND column_name = 'type'
  ) THEN
    INSERT INTO kv_store_6a7942bb (key, value)
    SELECT key, data::jsonb
    FROM kv_store_backup_temp
    ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;

    RAISE NOTICE 'Migrated data from data column';
  END IF;
END $$;

-- Step 6: Create index for performance
CREATE INDEX IF NOT EXISTS idx_kv_store_key_pattern
ON kv_store_6a7942bb(key text_pattern_ops);

-- Step 7: Enable Row Level Security
ALTER TABLE kv_store_6a7942bb ENABLE ROW LEVEL SECURITY;

-- Step 8: Create RLS Policies (allow all for development)
DROP POLICY IF EXISTS "Allow public read access" ON kv_store_6a7942bb;
CREATE POLICY "Allow public read access"
  ON kv_store_6a7942bb
  FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Allow public insert access" ON kv_store_6a7942bb;
CREATE POLICY "Allow public insert access"
  ON kv_store_6a7942bb
  FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public update access" ON kv_store_6a7942bb;
CREATE POLICY "Allow public update access"
  ON kv_store_6a7942bb
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public delete access" ON kv_store_6a7942bb;
CREATE POLICY "Allow public delete access"
  ON kv_store_6a7942bb
  FOR DELETE
  USING (true);

-- Step 9: Verify migration
SELECT
  'Original rows' as source,
  COUNT(*) as count
FROM kv_store_backup_temp
UNION ALL
SELECT
  'Migrated rows' as source,
  COUNT(*) as count
FROM kv_store_6a7942bb;

-- Step 10: Show new table structure
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'kv_store_6a7942bb'
ORDER BY ordinal_position;

-- Step 11: Show sample data
SELECT key, value
FROM kv_store_6a7942bb
LIMIT 5;

-- ============================================
-- CLEANUP (Run this ONLY after verifying migration succeeded)
-- ============================================
-- DROP TABLE IF EXISTS kv_store_backup_temp;

-- ============================================
-- WHAT THIS SCRIPT DOES:
-- ============================================
-- 1. Backs up your existing data
-- 2. Drops the old table with wrong structure
-- 3. Creates new table with correct structure: (key TEXT, value JSONB)
-- 4. Migrates all data from backup
-- 5. Sets up proper indexes and RLS policies
-- 6. Verifies everything worked correctly
--
-- After running this, your table will have the correct structure
-- and all API calls should work without the "type does not exist" error.
