# 🚀 Quick Start: Roles & Permissions

## Langkah-langkah Setup (5 Menit)

### 1️⃣ Jalankan SQL Schema (1 menit)

Buka **Supabase SQL Editor** dan jalankan:

```sql
-- Copy seluruh isi file SCHEMA_ROLES_PERMISSIONS.sql
-- Paste dan Execute
```

File ini akan:
- ✅ Seed 20+ default permissions
- ✅ Seed 6 default roles (super-admin, admin, sales-manager, dll)
- ✅ Update user admin menjadi super-admin

### 2️⃣ Test Login (30 detik)

Login dengan akun default:
```
Username: admin
Password: admin123
Role: super-admin (full access)
```

### 3️⃣ Wrap App dengan Provider (Sudah dilakukan!)

File `src/app/App.tsx` sudah diupdate dengan `PermissionProvider`:

```tsx
<SimpleAuthProvider>
  <PermissionProvider>  {/* ✅ Sudah ada */}
    <App />
  </PermissionProvider>
</SimpleAuthProvider>
```

---

## 🎯 Cara Pakai (3 Contoh Praktis)

### Contoh 1: Hide Button Berdasarkan Permission

```tsx
import { Can } from './components/can';

function CustomerPage() {
  return (
    <div>
      <h1>Customers</h1>
      
      {/* Button ini hanya muncul jika user punya permission */}
      <Can permission="create-customer">
        <Button>Add Customer</Button>
      </Can>
      
      <Can permission="delete-customer">
        <Button variant="destructive">Delete</Button>
      </Can>
    </div>
  );
}
```

### Contoh 2: Protect Entire Page

```tsx
import { PermissionProtectedRoute } from './components/permission-protected-route';

// Di routes.tsx
{
  path: '/admin/settings',
  element: (
    <PermissionProtectedRoute permission="manage-users">
      <AdminSettingsPage />
    </PermissionProtectedRoute>
  )
}

// Jika user tidak punya permission, akan muncul "Access Denied"
```

### Contoh 3: Check Permission di Logic

```tsx
import { usePermission } from './contexts/permission-context';

function CustomerActions() {
  const { hasPermission } = usePermission();

  const handleDelete = () => {
    if (!hasPermission('delete-customer')) {
      toast.error('You do not have permission');
      return;
    }

    // Lanjutkan delete
    deleteCustomer();
  };

  return <Button onClick={handleDelete}>Delete</Button>;
}
```

---

## 📋 Default Roles & Permissions

### Available Roles

| Role | Description | Use Case |
|------|-------------|----------|
| `super-admin` | Full access to everything | System Administrator |
| `admin` | Access to most features | Manager |
| `sales-manager` | Manage all sales data (CRUD) | Sales Manager |
| `sales-staff` | Create & Edit sales data | Sales Staff |
| `hrga-manager` | Manage employee data | HRGA Manager |
| `viewer` | Read-only access | Auditor, Observer |

### Available Permissions

**Sales:**
- `view-customer`, `create-customer`, `edit-customer`, `delete-customer`
- `view-pipeline`, `create-pipeline`, `edit-pipeline`, `delete-pipeline`
- `view-quotation`, `create-quotation`, `edit-quotation`, `delete-quotation`

**HRGA:**
- `view-employee`, `create-employee`, `edit-employee`, `delete-employee`

**Master:**
- `manage-master-data`

**System:**
- `manage-users`, `manage-roles`, `view-logs`

---

## 🔧 Common Tasks

### Assign Role ke User

**Via SQL:**
```sql
UPDATE kv_store_6a7942bb
SET data = jsonb_set(data::jsonb, '{role}', '"sales-manager"'::jsonb)::json
WHERE key = 'user:johndoe' AND type = 'user';
```

**Via API:**
```tsx
await api.assignRoleToUser('johndoe', 'sales-manager');
```

### Check User's Permissions

**Via SQL:**
```sql
-- 1. Cek role user
SELECT data->>'role' as user_role
FROM kv_store_6a7942bb
WHERE key = 'user:johndoe' AND type = 'user';

-- 2. Cek permissions dari role tersebut
SELECT data->'permissions' as permissions
FROM kv_store_6a7942bb
WHERE key = 'role:sales-manager' AND type = 'role';
```

**Via API:**
```tsx
const permissions = await api.getUserPermissions('johndoe');
console.log(permissions);
// Output: ['view-customer', 'create-customer', 'edit-customer', ...]
```

### Buat Role Baru

```tsx
await api.createRole({
  name: 'accountant',
  display_name: 'Accountant',
  description: 'Can view financial data',
  permissions: [
    'view-customer',
    'view-quotation',
    'view-employee'
  ]
});
```

### Update Role Permissions

```tsx
await api.updateRole('sales-staff', {
  name: 'sales-staff',
  display_name: 'Sales Staff',
  permissions: [
    'view-customer',
    'create-customer',
    'edit-customer',
    'delete-customer' // ← Tambah permission baru
  ]
});
```

---

## 🧪 Test Different Roles

### Test Scenario 1: Sales Staff (Limited Access)

1. Buat user baru dengan role `sales-staff`
2. Login sebagai user tersebut
3. Coba akses:
   - ✅ Customer page → BOLEH (view, create, edit)
   - ❌ Delete customer → TIDAK BOLEH
   - ❌ Admin settings → TIDAK BOLEH

### Test Scenario 2: Viewer (Read Only)

1. Buat user dengan role `viewer`
2. Login sebagai user tersebut
3. Coba akses:
   - ✅ View customer, pipeline, quotation → BOLEH
   - ❌ Create, edit, delete → TIDAK BOLEH

---

## 📊 Visual Permission Check

Tambahkan debug panel untuk melihat permissions user:

```tsx
import { usePermission } from './contexts/permission-context';

function DebugPanel() {
  const { permissions } = usePermission();

  return (
    <div className="fixed bottom-4 right-4 bg-white shadow-lg p-4 rounded">
      <h3 className="font-bold">My Permissions:</h3>
      <ul className="text-xs">
        {permissions.map(perm => (
          <li key={perm}>✅ {perm}</li>
        ))}
      </ul>
    </div>
  );
}
```

---

## ⚠️ Important Notes

1. **Multi-Layer Protection**
   - Always check di UI level (hide buttons)
   - Always check di Route level (protect pages)
   - Always check di API level (final validation)

2. **Permission Naming**
   - Format: `{action}-{resource}`
   - Contoh: `create-customer`, `delete-pipeline`
   - Gunakan lowercase dengan dash

3. **Role Assignment**
   - Setiap user HANYA boleh punya 1 role
   - Permissions didapat dari role tersebut
   - Untuk multiple permissions, update role-nya

---

## 📚 Next Steps

1. ✅ Setup sudah selesai
2. 📖 Baca [PANDUAN_ROLES_PERMISSIONS.md](PANDUAN_ROLES_PERMISSIONS.md) untuk detail lengkap
3. 🛠️ Implementasi permission checks di pages yang ada
4. 🎨 Customize roles sesuai kebutuhan organisasi
5. 👥 Buat user dengan berbagai roles untuk testing

**Dokumentasi Lengkap:** `PANDUAN_ROLES_PERMISSIONS.md`

**Need Help?** Check Troubleshooting section di dokumentasi lengkap.

---

Selamat mencoba! 🎉
