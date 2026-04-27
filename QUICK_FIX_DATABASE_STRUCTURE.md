# Quick Fix: Database Structure Error

## Error
```
column kv_store_6a7942bb.type does not exist
```

## Root Cause
The `kv_store_6a7942bb` table in your Supabase database has the **wrong column structure**. Your code expects:
- ✅ `key` (TEXT)
- ✅ `value` (JSONB)

But the table might have:
- ❌ `key`, `type`, `data`, `created_at`, `updated_at` (old structure)

## Solution (Choose ONE method)

### Method 1: Automatic Fix (Recommended)
Run this SQL script in Supabase SQL Editor:

**File:** `FIX_KV_STORE_STRUCTURE.sql`

This script will:
1. ✅ Backup your existing data
2. ✅ Drop the old table
3. ✅ Create new table with correct structure
4. ✅ Migrate all your data
5. ✅ Set up proper indexes and policies

**Steps:**
1. Go to Supabase Dashboard
2. Click **SQL Editor** in left sidebar
3. Click **New Query**
4. Copy and paste the contents of `FIX_KV_STORE_STRUCTURE.sql`
5. Click **Run** (or press Ctrl+Enter)
6. Wait for "Success" message
7. Refresh your app - errors should be gone!

---

### Method 2: Manual Fix (If you want to do it yourself)

#### Step 1: Backup your data
```sql
CREATE TABLE kv_store_backup AS
SELECT * FROM kv_store_6a7942bb;
```

#### Step 2: Drop old table
```sql
DROP TABLE kv_store_6a7942bb CASCADE;
```

#### Step 3: Create new table
```sql
CREATE TABLE kv_store_6a7942bb (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL
);
```

#### Step 4: Migrate data
```sql
-- If old table had 'data' column:
INSERT INTO kv_store_6a7942bb (key, value)
SELECT key, data::jsonb FROM kv_store_backup;

-- OR if old table had 'value' column:
INSERT INTO kv_store_6a7942bb (key, value)
SELECT key, value::jsonb FROM kv_store_backup;
```

#### Step 5: Enable RLS
```sql
ALTER TABLE kv_store_6a7942bb ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all" ON kv_store_6a7942bb FOR ALL USING (true) WITH CHECK (true);
```

---

## After Fixing the Table Structure

Once the table has the correct structure, run the roles & permissions seeding script:

**File:** `SCHEMA_ROLES_PERMISSIONS.sql`

This will:
- ✅ Create 20+ default permissions
- ✅ Create 6 default roles (super-admin, admin, sales-manager, etc.)
- ✅ Assign super-admin role to admin user

---

## Verification

After running the fix, verify it worked:

```sql
-- 1. Check table structure (should only show key and value)
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'kv_store_6a7942bb';

-- 2. Check roles were created
SELECT key, value->'display_name' as role_name
FROM kv_store_6a7942bb
WHERE key LIKE 'role:%';

-- 3. Check permissions were created
SELECT COUNT(*) as permission_count
FROM kv_store_6a7942bb
WHERE key LIKE 'permission:%';
```

Expected results:
- ✅ Table has 2 columns: `key` (text) and `value` (jsonb)
- ✅ At least 6 roles found
- ✅ At least 20 permissions found

---

## Troubleshooting

### Still getting errors?
1. **Clear browser cache** and refresh
2. **Check Supabase logs**: Dashboard → Logs → Check for errors
3. **Verify RLS policies**: Make sure "Allow all" policy exists
4. **Check connection**: `console.log()` in browser should NOT show connection errors

### Data not migrating?
If data didn't migrate, manually check the backup table structure:
```sql
SELECT column_name FROM information_schema.columns
WHERE table_name = 'kv_store_backup';
```

Then adjust the INSERT statement to use the correct column name.

---

## Summary

The error happens because:
1. ❌ Old code expected `(key, type, data)` columns
2. ✅ New code expects `(key, value)` columns
3. ❌ Your database still has the old structure

**Solution:** Run `FIX_KV_STORE_STRUCTURE.sql` to migrate to the new structure. ✅

---

## Need Help?
If you're still having issues after following this guide, check:
- Supabase connection is working
- You're using the correct Supabase project
- The anon key and project URL are correct in your code
