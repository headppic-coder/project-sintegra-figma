-- ================================================================
-- SEED DEFAULT ADMIN USER FOR SIMPLE LOGIN SYSTEM
-- ================================================================
-- Tabel: kv_store_6a7942bb
-- Key: user:admin
-- Credentials: admin / admin123
-- ================================================================

-- 1. CHECK IF ADMIN USER EXISTS
-- ================================================================
SELECT
  CASE
    WHEN EXISTS (
      SELECT 1 FROM kv_store_6a7942bb
      WHERE key = 'user:admin'
    ) THEN '✅ Admin user already exists'
    ELSE '❌ Admin user does not exist - will be created'
  END AS status;

-- 2. INSERT ADMIN USER (jika belum ada)
-- ================================================================
-- IMPORTANT: Run this only once!
INSERT INTO kv_store_6a7942bb (key, value)
SELECT
  'user:admin',
  jsonb_build_object(
    'id', 'user:admin',
    'username', 'admin',
    'email', 'admin@erp.com',
    'password', 'admin123',
    'nama_user', 'Administrator',
    'employee_id', NULL,
    'role', 'admin',
    'is_active', true,
    'created_at', NOW(),
    'updated_at', NOW()
  )
WHERE NOT EXISTS (
  SELECT 1 FROM kv_store_6a7942bb
  WHERE key = 'user:admin'
);

-- 3. VERIFY ADMIN USER CREATED
-- ================================================================
SELECT
  key,
  value->>'username' AS username,
  value->>'email' AS email,
  value->>'password' AS password,
  value->>'nama_user' AS nama_user,
  value->>'role' AS role,
  value->>'is_active' AS is_active
FROM kv_store_6a7942bb
WHERE key = 'user:admin';

-- Expected result:
-- key          | username | email          | password  | nama_user      | role  | is_active
-- -------------|----------|----------------|-----------|----------------|-------|----------
-- user:admin   | admin    | admin@erp.com  | admin123  | Administrator  | admin | true

-- 4. CREATE ADDITIONAL USERS (OPTIONAL)
-- ================================================================

-- User: yudi (Manager Sales)
INSERT INTO kv_store_6a7942bb (key, value)
SELECT
  'user:yudi',
  jsonb_build_object(
    'id', 'user:yudi',
    'username', 'yudi',
    'email', 'yudi@erp.com',
    'password', 'yudi123',
    'nama_user', 'Yudi Setiawan',
    'employee_id', NULL, -- Update dengan employee_id jika ada
    'role', 'manager',
    'is_active', true,
    'created_at', NOW(),
    'updated_at', NOW()
  )
WHERE NOT EXISTS (
  SELECT 1 FROM kv_store_6a7942bb
  WHERE key = 'user:yudi'
);

-- User: staff1 (Staff)
INSERT INTO kv_store_6a7942bb (key, value)
SELECT
  'user:staff1',
  jsonb_build_object(
    'id', 'user:staff1',
    'username', 'staff1',
    'email', 'staff1@erp.com',
    'password', 'staff123',
    'nama_user', 'Staff User',
    'employee_id', NULL,
    'role', 'staff',
    'is_active', true,
    'created_at', NOW(),
    'updated_at', NOW()
  )
WHERE NOT EXISTS (
  SELECT 1 FROM kv_store_6a7942bb
  WHERE key = 'user:staff1'
);

-- 5. LIST ALL USERS
-- ================================================================
SELECT
  key,
  value->>'username' AS username,
  value->>'email' AS email,
  value->>'password' AS password,
  value->>'nama_user' AS nama,
  value->>'role' AS role,
  value->>'is_active' AS active
FROM kv_store_6a7942bb
WHERE key LIKE 'user:%'
ORDER BY key;

-- 6. UPDATE USER PASSWORD (if needed)
-- ================================================================
-- Example: Change admin password
-- UPDATE kv_store_6a7942bb
-- SET value = jsonb_set(value, '{password}', '"newpassword123"')
-- WHERE key = 'user:admin';

-- 7. LINK USER TO EMPLOYEE
-- ================================================================
-- Example: Link yudi user to employee
-- First, find employee ID:
-- SELECT key, value->>'full_name' FROM kv_store_6a7942bb WHERE key LIKE 'karyawan:%' LIMIT 5;

-- Then update user:
-- UPDATE kv_store_6a7942bb
-- SET value = jsonb_set(value, '{employee_id}', '"karyawan:1234567890"')
-- WHERE key = 'user:yudi';

-- 8. SOFT DELETE USER (deactivate)
-- ================================================================
-- Example: Deactivate staff1
-- UPDATE kv_store_6a7942bb
-- SET value = jsonb_set(value, '{is_active}', 'false')
-- WHERE key = 'user:staff1';

-- 9. HARD DELETE USER (permanent)
-- ================================================================
-- ⚠️ WARNING: This will permanently delete the user!
-- DELETE FROM kv_store_6a7942bb WHERE key = 'user:staff1';

-- ================================================================
-- CREDENTIALS SUMMARY
-- ================================================================
-- Admin:
--   Username: admin
--   Password: admin123
--   Role: admin
--
-- Yudi (Manager):
--   Username: yudi
--   Password: yudi123
--   Role: manager
--
-- Staff1:
--   Username: staff1
--   Password: staff123
--   Role: staff
-- ================================================================

-- ================================================================
-- NOTES
-- ================================================================
-- 1. Password stored as PLAIN TEXT - NOT ENCRYPTED!
-- 2. For production, use Supabase Auth or encrypt passwords
-- 3. Default admin user has full access to all modules
-- 4. Users can be linked to employees via employee_id field
-- 5. Session stored in localStorage on client side
-- ================================================================
