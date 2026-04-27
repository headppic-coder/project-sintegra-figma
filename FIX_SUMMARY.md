# Fix Summary: Roles & Permissions Database Errors

## Problem
```
Error: column kv_store_6a7942bb.type does not exist
```

## Root Cause
Your Supabase database table `kv_store_6a7942bb` was created with **old column structure**:
- ❌ Old: `key`, `type`, `data`, `created_at`, `updated_at`
- ✅ New: `key`, `value` (only these 2 columns needed)

All code has been updated to use the new structure, but your **database table structure hasn't been updated yet**.

---

## Solution: 3 Simple Steps

### Step 1: Fix Table Structure
**Run this file in Supabase SQL Editor:**
```
FIX_KV_STORE_STRUCTURE.sql
```

This will:
- ✅ Backup your current data
- ✅ Drop and recreate table with correct structure
- ✅ Migrate all existing data
- ✅ Set up indexes and RLS policies

### Step 2: Seed Roles & Permissions
**Run this file in Supabase SQL Editor:**
```
SCHEMA_ROLES_PERMISSIONS.sql
```

This will:
- ✅ Create 20+ default permissions
- ✅ Create 6 default roles
- ✅ Assign super-admin to admin user

### Step 3: Refresh Your App
- Clear browser cache (Ctrl+Shift+R)
- Reload the page
- Navigate to: **System → Pengaturan Akses**
- ✅ No more errors!

---

## Files Created/Updated

### Fixed Files
✅ `src/app/lib/api.ts` - All API functions now use kvGet, kvSet, kvGetByPrefix, kvDel
✅ `SCHEMA_ROLES_PERMISSIONS.sql` - Updated to use (key, value) structure
✅ All code updated to use correct table structure

### New Files
📄 `FIX_KV_STORE_STRUCTURE.sql` - Migration script to fix table
📄 `QUICK_FIX_DATABASE_STRUCTURE.md` - Detailed fix guide
📄 `FIX_SUMMARY.md` - This file

### Documentation
📖 `ROLES_PERMISSIONS_FIX.md` - Complete explanation of the fix
📖 `PANDUAN_ROLES_PERMISSIONS.md` - Comprehensive guide
📖 `QUICK_START_PERMISSIONS.md` - 5-minute quick start

---

## How to Run SQL in Supabase

1. Go to: https://supabase.com/dashboard
2. Select your project
3. Click **SQL Editor** in left sidebar (icon looks like `>_`)
4. Click **New Query** button
5. Copy the entire contents of `FIX_KV_STORE_STRUCTURE.sql`
6. Paste into the editor
7. Click **Run** button (or Ctrl+Enter)
8. Wait for "Success. No rows returned" message
9. Repeat for `SCHEMA_ROLES_PERMISSIONS.sql`
10. Done! ✅

---

## Expected Results

After running both SQL files, you should see:

### In Supabase
```sql
-- Table structure (only 2 columns)
key     | text
value   | jsonb

-- Sample data
SELECT COUNT(*) FROM kv_store_6a7942bb WHERE key LIKE 'role:%';
-- Result: 6 rows (6 roles)

SELECT COUNT(*) FROM kv_store_6a7942bb WHERE key LIKE 'permission:%';
-- Result: 20+ rows (20+ permissions)
```

### In Your App
- ✅ Access Settings page loads without errors
- ✅ Shows 6 default roles
- ✅ Shows 20+ permissions grouped by module
- ✅ Can create/edit/delete roles
- ✅ Can assign roles to users
- ✅ Admin user has super-admin role with all permissions

---

## Why This Happened

**Timeline:**
1. Initial code was designed for table structure: `(key, type, data, created_at, updated_at)`
2. Supabase table was created with that structure
3. Code was updated to use simpler structure: `(key, value)`
4. Your database still has the old structure ❌
5. Code tries to query `value` but table has `type` and `data` columns instead
6. Result: "column type does not exist" error ❌

**The Fix:**
- Update database table to match new code structure ✅
- All existing data is preserved and migrated ✅
- Future updates will use the simpler, cleaner structure ✅

---

## What Changed in the Code

### Before (OLD - using type and data columns)
```typescript
// ❌ Old way - direct Supabase queries with type/data
const { data } = await supabase
  .from(KV_TABLE)
  .select('data')
  .eq('type', 'role');
```

### After (NEW - using key and value columns)
```typescript
// ✅ New way - helper functions with key/value
const roles = await kvGetByPrefix('role:');
// Queries: SELECT value FROM kv_store WHERE key LIKE 'role:%'
```

### Benefits of New Structure
- ✅ Simpler: Only 2 columns instead of 5
- ✅ Flexible: All data in JSON format
- ✅ Consistent: Same pattern for all data types
- ✅ Faster: Fewer columns to scan
- ✅ Cleaner: No timestamp management needed

---

## Support

If you need help:
1. Check `QUICK_FIX_DATABASE_STRUCTURE.md` for detailed steps
2. Check `ROLES_PERMISSIONS_FIX.md` for technical explanation
3. Verify table structure with verification queries
4. Check browser console for any connection errors

---

## Quick Verification Checklist

After running the fix, verify:

- [ ] Supabase table has only `key` and `value` columns
- [ ] At least 6 roles exist in database
- [ ] At least 20 permissions exist in database
- [ ] Admin user has `super-admin` role
- [ ] Access Settings page loads without errors
- [ ] Can view roles list
- [ ] Can view permissions list
- [ ] Can view users list
- [ ] No "column type does not exist" errors in browser console
- [ ] Can create new role without errors

If all checkboxes are ✅, you're done! The system is working correctly.

---

**Last Updated:** April 16, 2026
**Status:** Ready to deploy
**Next Step:** Run `FIX_KV_STORE_STRUCTURE.sql` in Supabase SQL Editor
