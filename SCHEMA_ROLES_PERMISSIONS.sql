-- ============================================
-- SCHEMA ROLES & PERMISSIONS
-- Menggunakan tabel kv_store_6a7942bb yang sudah ada
-- ============================================

-- Struktur data roles dan permissions akan disimpan dalam format JSON
-- di kolom 'data' dengan 'type' yang berbeda

-- 1. ROLES
-- Menyimpan daftar role yang tersedia
-- Format key: 'role:{role_name}'
-- Format data:
-- {
--   "name": "admin",
--   "display_name": "Administrator",
--   "description": "Full access to all features",
--   "permissions": ["create-customer", "edit-customer", "delete-customer", ...]
-- }

-- 2. PERMISSIONS
-- Menyimpan daftar permission yang tersedia
-- Format key: 'permission:{permission_name}'
-- Format data:
-- {
--   "name": "create-customer",
--   "display_name": "Create Customer",
--   "description": "Ability to create new customers",
--   "module": "sales" -- Grouping: sales, hrga, master, system
-- }

-- 3. USER ROLES
-- Data user sudah ada di kv_store dengan kolom 'data'
-- Tambahkan field 'role' ke dalam JSON data user
-- Format user data:
-- {
--   "nama_user": "Admin User",
--   "username": "admin",
--   "email": "admin@example.com",
--   "password": "admin123",
--   "role": "admin", -- Role yang dimiliki user
--   "is_active": true
-- }

-- ============================================
-- SEED DEFAULT ROLES & PERMISSIONS
-- ============================================

-- Insert default permissions
INSERT INTO kv_store_6a7942bb (key, value)
VALUES
  -- Sales Permissions
  ('permission:view-customer', '{"name":"view-customer","display_name":"View Customer","description":"Dapat melihat data customer","module":"sales"}'),
  ('permission:create-customer', '{"name":"create-customer","display_name":"Create Customer","description":"Dapat membuat customer baru","module":"sales"}'),
  ('permission:edit-customer', '{"name":"edit-customer","display_name":"Edit Customer","description":"Dapat mengedit data customer","module":"sales"}'),
  ('permission:delete-customer', '{"name":"delete-customer","display_name":"Delete Customer","description":"Dapat menghapus customer","module":"sales"}'),

  ('permission:view-pipeline', '{"name":"view-pipeline","display_name":"View Pipeline","description":"Dapat melihat data pipeline","module":"sales"}'),
  ('permission:create-pipeline', '{"name":"create-pipeline","display_name":"Create Pipeline","description":"Dapat membuat pipeline baru","module":"sales"}'),
  ('permission:edit-pipeline', '{"name":"edit-pipeline","display_name":"Edit Pipeline","description":"Dapat mengedit data pipeline","module":"sales"}'),
  ('permission:delete-pipeline', '{"name":"delete-pipeline","display_name":"Delete Pipeline","description":"Dapat menghapus pipeline","module":"sales"}'),

  ('permission:view-quotation', '{"name":"view-quotation","display_name":"View Quotation","description":"Dapat melihat data quotation","module":"sales"}'),
  ('permission:create-quotation', '{"name":"create-quotation","display_name":"Create Quotation","description":"Dapat membuat quotation baru","module":"sales"}'),
  ('permission:edit-quotation', '{"name":"edit-quotation","display_name":"Edit Quotation","description":"Dapat mengedit data quotation","module":"sales"}'),
  ('permission:delete-quotation', '{"name":"delete-quotation","display_name":"Delete Quotation","description":"Dapat menghapus quotation","module":"sales"}'),

  -- HRGA Permissions
  ('permission:view-employee', '{"name":"view-employee","display_name":"View Employee","description":"Dapat melihat data karyawan","module":"hrga"}'),
  ('permission:create-employee', '{"name":"create-employee","display_name":"Create Employee","description":"Dapat membuat karyawan baru","module":"hrga"}'),
  ('permission:edit-employee', '{"name":"edit-employee","display_name":"Edit Employee","description":"Dapat mengedit data karyawan","module":"hrga"}'),
  ('permission:delete-employee', '{"name":"delete-employee","display_name":"Delete Employee","description":"Dapat menghapus karyawan","module":"hrga"}'),

  -- Master Data Permissions
  ('permission:manage-master-data', '{"name":"manage-master-data","display_name":"Manage Master Data","description":"Dapat mengelola data master","module":"master"}'),

  -- System Permissions
  ('permission:manage-users', '{"name":"manage-users","display_name":"Manage Users","description":"Dapat mengelola user dan akses","module":"system"}'),
  ('permission:manage-roles', '{"name":"manage-roles","display_name":"Manage Roles","description":"Dapat mengelola roles dan permissions","module":"system"}'),
  ('permission:view-logs', '{"name":"view-logs","display_name":"View Logs","description":"Dapat melihat log sistem","module":"system"}')

ON CONFLICT (key) DO UPDATE
SET value = EXCLUDED.value;

-- Insert default roles
INSERT INTO kv_store_6a7942bb (key, value)
VALUES
  -- Super Admin Role (Full Access)
  ('role:super-admin', '{"name":"super-admin","display_name":"Super Administrator","description":"Full access to all features","permissions":["view-customer","create-customer","edit-customer","delete-customer","view-pipeline","create-pipeline","edit-pipeline","delete-pipeline","view-quotation","create-quotation","edit-quotation","delete-quotation","view-employee","create-employee","edit-employee","delete-employee","manage-master-data","manage-users","manage-roles","view-logs"]}'),

  -- Admin Role (Most Features)
  ('role:admin', '{"name":"admin","display_name":"Administrator","description":"Access to most features","permissions":["view-customer","create-customer","edit-customer","delete-customer","view-pipeline","create-pipeline","edit-pipeline","delete-pipeline","view-quotation","create-quotation","edit-quotation","delete-quotation","view-employee","create-employee","edit-employee","manage-master-data","view-logs"]}'),

  -- Sales Manager Role
  ('role:sales-manager', '{"name":"sales-manager","display_name":"Sales Manager","description":"Can manage all sales data","permissions":["view-customer","create-customer","edit-customer","delete-customer","view-pipeline","create-pipeline","edit-pipeline","delete-pipeline","view-quotation","create-quotation","edit-quotation","delete-quotation"]}'),

  -- Sales Staff Role
  ('role:sales-staff', '{"name":"sales-staff","display_name":"Sales Staff","description":"Can create and edit sales data","permissions":["view-customer","create-customer","edit-customer","view-pipeline","create-pipeline","edit-pipeline","view-quotation","create-quotation","edit-quotation"]}'),

  -- HRGA Manager Role
  ('role:hrga-manager', '{"name":"hrga-manager","display_name":"HRGA Manager","description":"Can manage employee data","permissions":["view-employee","create-employee","edit-employee","delete-employee","manage-master-data"]}'),

  -- Viewer Role (Read Only)
  ('role:viewer', '{"name":"viewer","display_name":"Viewer","description":"Can only view data, no editing","permissions":["view-customer","view-pipeline","view-quotation","view-employee"]}')

ON CONFLICT (key) DO UPDATE
SET value = EXCLUDED.value;

-- Update existing admin user to have super-admin role
UPDATE kv_store_6a7942bb
SET value = jsonb_set(value::jsonb, '{role}', '"super-admin"'::jsonb)::json
WHERE key = 'user:admin';

-- ============================================
-- QUERIES UNTUK TESTING
-- ============================================

-- 1. Melihat semua roles
SELECT key, value
FROM kv_store_6a7942bb
WHERE key LIKE 'role:%'
ORDER BY key;

-- 2. Melihat semua permissions
SELECT key, value
FROM kv_store_6a7942bb
WHERE key LIKE 'permission:%'
ORDER BY key;

-- 3. Melihat role dari user tertentu
SELECT key, value->>'role' as user_role
FROM kv_store_6a7942bb
WHERE key = 'user:admin';

-- 4. Melihat permissions dari role tertentu
SELECT value->'permissions' as role_permissions
FROM kv_store_6a7942bb
WHERE key = 'role:admin';

-- 5. Check apakah user memiliki permission tertentu
-- Contoh: Check apakah user 'admin' memiliki permission 'create-customer'
WITH user_role AS (
  SELECT value->>'role' as role_name
  FROM kv_store_6a7942bb
  WHERE key = 'user:admin'
),
role_permissions AS (
  SELECT value->'permissions' as permissions
  FROM kv_store_6a7942bb
  WHERE key = 'role:' || (SELECT role_name FROM user_role)
)
SELECT
  CASE
    WHEN (SELECT permissions FROM role_permissions)::jsonb ? 'create-customer'
    THEN 'YES - User has permission'
    ELSE 'NO - User does not have permission'
  END as has_permission;
