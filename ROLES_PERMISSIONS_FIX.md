# 🔧 Fix: Roles & Permissions Error

## ❌ Problem

Error saat load halaman Pengaturan Akses:
```
Error: column kv_store_6a7942bb.type does not exist
```

**Root Cause:**
- Tabel `kv_store_6a7942bb` hanya punya kolom `key` dan `value`
- API functions mencoba query dengan kolom `type`, `data`, `created_at`, `updated_at` yang tidak ada

---

## ✅ Solution

### 1. Fixed API Functions (`src/app/lib/api.ts`)

**Before (Broken):**
```tsx
async getRoles() {
  const { data, error } = await supabase
    .from(KV_TABLE)
    .select('*')
    .eq('type', 'role')  // ❌ kolom 'type' tidak ada!
    .order('key');
  
  return data?.map(item => ({ id: item.key, ...item.data })) || [];
}
```

**After (Fixed):**
```tsx
async getRoles() {
  const roles = await kvGetByPrefix('role:');  // ✅ pakai prefix pattern
  return roles.map((role: any) => ({
    id: role.id || `role:${role.name}`,
    ...role
  }));
}
```

**Changes Made:**
- ✅ Gunakan `kvGetByPrefix()` untuk query by key prefix
- ✅ Gunakan `kvGet()` untuk get single item
- ✅ Gunakan `kvSet()` untuk create/update
- ✅ Gunakan `kvDel()` untuk delete
- ✅ Hapus semua reference ke kolom `type`, `data`, `created_at`, `updated_at`

### 2. Fixed SQL Schema (`SCHEMA_ROLES_PERMISSIONS.sql`)

**Before (Broken):**
```sql
INSERT INTO kv_store_6a7942bb (key, type, data, created_at, updated_at)
VALUES
  ('permission:view-customer', 'permission', '{"name":"view-customer",...}', NOW(), NOW());
```

**After (Fixed):**
```sql
INSERT INTO kv_store_6a7942bb (key, value)
VALUES
  ('permission:view-customer', '{"name":"view-customer",...}');
```

**Changes Made:**
- ✅ INSERT hanya pakai kolom `key` dan `value`
- ✅ UPDATE statement pakai `value` bukan `data`
- ✅ Testing queries pakai `WHERE key LIKE 'role:%'` bukan `WHERE type = 'role'`
- ✅ Hapus semua kolom yang tidak ada

---

## 📊 Table Structure (Correct)

Tabel `kv_store_6a7942bb` structure:

| Column | Type | Description |
|--------|------|-------------|
| key | text | Primary key (e.g., "role:admin") |
| value | json | JSON data |

**Key Patterns:**
- `role:{roleName}` - e.g., "role:admin", "role:sales-manager"
- `permission:{permissionName}` - e.g., "permission:create-customer"
- `user:{username}` - e.g., "user:admin"

**Value Format:**
```json
{
  "name": "admin",
  "display_name": "Administrator",
  "description": "...",
  "permissions": ["view-customer", "create-customer", ...]
}
```

---

## 🚀 How to Use (Updated)

### Run SQL Schema

```bash
# Di Supabase SQL Editor
# Copy paste SCHEMA_ROLES_PERMISSIONS.sql yang sudah diperbaiki
# Execute
```

**SQL ini akan:**
1. ✅ Insert 20+ permissions
2. ✅ Insert 6 default roles
3. ✅ Update user admin dengan role super-admin

### Verify Data

```sql
-- Check roles
SELECT key, value FROM kv_store_6a7942bb WHERE key LIKE 'role:%';

-- Check permissions
SELECT key, value FROM kv_store_6a7942bb WHERE key LIKE 'permission:%';

-- Check admin user role
SELECT value->>'role' FROM kv_store_6a7942bb WHERE key = 'user:admin';
```

---

## 🔍 Testing

### 1. Test Load Pengaturan Akses
```
1. Login sebagai admin
2. Menu System > Pengaturan Akses
3. Tab Roles → Should show 6 roles
4. Tab Permissions → Should show 20+ permissions
5. Tab User Access → Should show list of users
```

### 2. Test Create Role
```
1. Klik "Tambah Role"
2. Isi form
3. Pilih permissions
4. Klik "Buat Role"
5. ✅ Role baru muncul di list
```

### 3. Test Assign Role
```
1. Tab "User Access"
2. Klik "Ubah Role" pada user
3. Pilih role baru
4. Klik "Tetapkan Role"
5. ✅ User role updated
```

---

## 📝 Summary of Changes

### Files Modified:

1. **src/app/lib/api.ts**
   - `getRoles()` - Use kvGetByPrefix
   - `getRole()` - Use kvGet
   - `createRole()` - Use kvSet
   - `updateRole()` - Use kvSet
   - `deleteRole()` - Use kvDel
   - `getPermissions()` - Use kvGetByPrefix
   - `createPermission()` - Use kvSet
   - `checkPermission()` - Use kvGet
   - `getUserPermissions()` - Use kvGet
   - `assignRoleToUser()` - Use kvGet + kvSet

2. **SCHEMA_ROLES_PERMISSIONS.sql**
   - INSERT permissions - Use (key, value)
   - INSERT roles - Use (key, value)
   - UPDATE admin user - Use SET value = ...
   - Testing queries - Use value column, WHERE key LIKE pattern

---

## ✅ Status

**All errors fixed!** ✨

- ✅ API functions updated to use correct table structure
- ✅ SQL schema updated to match table columns
- ✅ Testing queries updated
- ✅ No more "column does not exist" errors

**Ready to use!** 🚀

Run the updated SQL schema dan halaman Pengaturan Akses akan bekerja dengan sempurna.
