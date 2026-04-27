# 🔐 Cara Kerja Sistem Roles & Permissions

## 📊 Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    SISTEM PERMISSION                         │
└─────────────────────────────────────────────────────────────┘

1. USER LOGIN
   ┌──────────┐
   │  User    │ username: johndoe
   │ (johndoe)│ password: ******
   └────┬─────┘ role: sales-manager
        │
        ▼

2. LOAD USER ROLE
   ┌──────────────────┐
   │   kv_store       │
   │   type: user     │
   │   key: user:john │
   │   data: {        │
   │     role: "sales-manager"
   │   }              │
   └────┬─────────────┘
        │
        ▼

3. GET ROLE PERMISSIONS
   ┌──────────────────────────────┐
   │   kv_store                   │
   │   type: role                 │
   │   key: role:sales-manager    │
   │   data: {                    │
   │     permissions: [           │
   │       "view-customer",       │
   │       "create-customer",     │
   │       "edit-customer",       │
   │       "delete-customer"      │
   │     ]                        │
   │   }                          │
   └────┬─────────────────────────┘
        │
        ▼

4. LOAD TO PERMISSION CONTEXT
   ┌──────────────────────────────┐
   │  PermissionContext           │
   │  permissions: [              │
   │    "view-customer",          │
   │    "create-customer",        │
   │    "edit-customer",          │
   │    "delete-customer"         │
   │  ]                           │
   └────┬─────────────────────────┘
        │
        ▼

5. PERMISSION CHECK
   ┌──────────────────────────────────────────┐
   │  UI Component                            │
   │                                          │
   │  <Can permission="delete-customer">      │
   │    <Button>Delete</Button>               │
   │  </Can>                                  │
   │                                          │
   │  ✅ User HAS "delete-customer"          │
   │  → Button RENDERED                       │
   └──────────────────────────────────────────┘
```

---

## 🎯 Konsep Sederhana

### 1. Permission (Hak Akses)
**Apa itu?** Izin untuk melakukan aksi tertentu.

**Contoh:**
```
create-customer  → Boleh buat customer baru
edit-pipeline    → Boleh edit pipeline
delete-quotation → Boleh hapus quotation
```

### 2. Role (Peran)
**Apa itu?** Kumpulan permissions.

**Contoh:**
```
Role: sales-manager
Permissions:
  ✅ view-customer
  ✅ create-customer
  ✅ edit-customer
  ✅ delete-customer
  ✅ view-pipeline
  ✅ create-pipeline
```

### 3. User
**Apa itu?** User yang punya 1 role.

**Contoh:**
```
User: johndoe
Role: sales-manager
Dapat permissions dari role tersebut
```

---

## 🔄 Alur Kerja Detail

### Saat User Login

```javascript
// 1. User login
await api.simpleLogin('johndoe', 'password123');

// 2. System load user data dari kv_store
const user = {
  username: 'johndoe',
  role: 'sales-manager'
};

// 3. PermissionProvider otomatis load permissions
const permissions = await api.getUserPermissions('johndoe');
// Result: ['view-customer', 'create-customer', 'edit-customer', ...]

// 4. Permissions tersimpan di Context
PermissionContext.permissions = permissions;
```

### Saat Check Permission di UI

```tsx
// Component render
<Can permission="delete-customer">
  <Button>Delete</Button>
</Can>

// Proses:
// 1. Can component ambil permissions dari PermissionContext
const { permissions } = usePermission();
// permissions = ['view-customer', 'create-customer', 'edit-customer', 'delete-customer']

// 2. Check apakah 'delete-customer' ada di array
const hasPermission = permissions.includes('delete-customer');
// hasPermission = true

// 3. Render children karena permission ada
return <Button>Delete</Button>;
```

### Saat Check Permission di Logic

```tsx
const { hasPermission } = usePermission();

const handleDelete = () => {
  // 1. Check permission
  if (!hasPermission('delete-customer')) {
    // 2. Jika TIDAK punya permission
    toast.error('No permission to delete');
    return; // Stop
  }

  // 3. Jika PUNYA permission, lanjutkan
  deleteCustomer();
};
```

---

## 💾 Struktur Data di Database

### Table: kv_store_6a7942bb

#### Data Permission
```json
{
  "key": "permission:create-customer",
  "type": "permission",
  "data": {
    "name": "create-customer",
    "display_name": "Create Customer",
    "description": "Dapat membuat customer baru",
    "module": "sales"
  }
}
```

#### Data Role
```json
{
  "key": "role:sales-manager",
  "type": "role",
  "data": {
    "name": "sales-manager",
    "display_name": "Sales Manager",
    "description": "Can manage all sales data",
    "permissions": [
      "view-customer",
      "create-customer",
      "edit-customer",
      "delete-customer"
    ]
  }
}
```

#### Data User
```json
{
  "key": "user:johndoe",
  "type": "user",
  "data": {
    "username": "johndoe",
    "email": "john@example.com",
    "nama_user": "John Doe",
    "role": "sales-manager",  ← Role user
    "is_active": true
  }
}
```

---

## 🔍 Query Flow

### Query 1: Get User Role
```sql
SELECT data->>'role' as user_role
FROM kv_store_6a7942bb
WHERE key = 'user:johndoe' AND type = 'user';

-- Result: 'sales-manager'
```

### Query 2: Get Role Permissions
```sql
SELECT data->'permissions' as permissions
FROM kv_store_6a7942bb
WHERE key = 'role:sales-manager' AND type = 'role';

-- Result: ["view-customer", "create-customer", "edit-customer", "delete-customer"]
```

### Query 3: Check Specific Permission
```sql
-- Gabungan query 1 & 2
WITH user_role AS (
  SELECT data->>'role' as role_name
  FROM kv_store_6a7942bb
  WHERE type = 'user' AND key = 'user:johndoe'
),
role_permissions AS (
  SELECT data->'permissions' as permissions
  FROM kv_store_6a7942bb
  WHERE type = 'role' AND key = 'role:' || (SELECT role_name FROM user_role)
)
SELECT
  CASE
    WHEN (SELECT permissions FROM role_permissions)::jsonb ? 'delete-customer'
    THEN 'YES'
    ELSE 'NO'
  END as has_permission;

-- Result: 'YES'
```

---

## 🛠️ API Functions

### Frontend API

```tsx
// 1. Get user's permissions
const permissions = await api.getUserPermissions('johndoe');
// Returns: ['view-customer', 'create-customer', ...]

// 2. Check single permission
const canDelete = await api.checkPermission('johndoe', 'delete-customer');
// Returns: true or false

// 3. Get all roles
const roles = await api.getRoles();
// Returns: [{ name: 'admin', permissions: [...] }, ...]

// 4. Assign role to user
await api.assignRoleToUser('johndoe', 'sales-manager');
```

### React Hooks

```tsx
const {
  permissions,        // Array semua permissions user
  hasPermission,      // Function check 1 permission
  hasAnyPermission,   // Function check multiple (ANY)
  hasAllPermissions,  // Function check multiple (ALL)
  loading,            // Loading state
  refreshPermissions  // Reload permissions
} = usePermission();

// Usage:
hasPermission('create-customer')           // → true/false
hasAnyPermission(['edit', 'delete'])       // → true/false
hasAllPermissions(['edit', 'delete'])      // → true/false
```

---

## 🎨 Component Usage

### 1. `<Can>` Component

**Tujuan:** Conditional rendering berdasarkan permission

```tsx
// Render jika punya permission
<Can permission="create-customer">
  <Button>Add Customer</Button>
</Can>

// Render jika TIDAK punya permission (fallback)
<Can 
  permission="create-customer"
  fallback={<div>No access</div>}
>
  <Button>Add Customer</Button>
</Can>

// Multiple permissions (ANY)
<Can permissions={["edit-customer", "delete-customer"]}>
  <div>Edit or Delete Available</div>
</Can>

// Multiple permissions (ALL)
<Can permissions={["edit-customer", "delete-customer"]} requireAll={true}>
  <div>Full Access Required</div>
</Can>
```

### 2. `<PermissionProtectedRoute>` Component

**Tujuan:** Protect entire page

```tsx
// Protect page dengan single permission
<PermissionProtectedRoute permission="view-customer">
  <CustomerPage />
</PermissionProtectedRoute>

// Protect page dengan multiple permissions
<PermissionProtectedRoute 
  permissions={["manage-users", "manage-roles"]}
  requireAll={true}
>
  <AdminPage />
</PermissionProtectedRoute>

// Custom redirect jika no permission
<PermissionProtectedRoute 
  permission="view-reports"
  redirectTo="/dashboard"
>
  <ReportsPage />
</PermissionProtectedRoute>
```

---

## 🔐 Multi-Layer Security

Sistem ini menggunakan **3-layer protection**:

### Layer 1: UI Level (Hide/Show)
```tsx
<Can permission="delete-customer">
  <Button>Delete</Button>
</Can>
```
**Tujuan:** User tidak lihat fitur yang tidak boleh diakses

### Layer 2: Logic Level (Validation)
```tsx
const handleDelete = () => {
  if (!hasPermission('delete-customer')) {
    toast.error('No permission');
    return;
  }
  deleteCustomer();
};
```
**Tujuan:** Prevent user dari manually trigger action

### Layer 3: API Level (Backend)
```tsx
// Di API endpoint (idealnya)
app.delete('/api/customers/:id', async (req, res) => {
  const hasPermission = await checkUserPermission(
    req.user.username, 
    'delete-customer'
  );
  
  if (!hasPermission) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  
  // Proceed with delete
});
```
**Tujuan:** Final validation di server-side

---

## 📝 Contoh Lengkap: Customer Page

```tsx
import { Can } from '../components/can';
import { usePermission } from '../contexts/permission-context';
import { PermissionProtectedRoute } from '../components/permission-protected-route';

function CustomerPage() {
  const { hasPermission } = usePermission();

  const handleDelete = async (id: string) => {
    // Layer 2: Logic check
    if (!hasPermission('delete-customer')) {
      toast.error('No permission to delete');
      return;
    }

    if (confirm('Delete customer?')) {
      await api.deleteCustomer(id); // Layer 3: API check
      toast.success('Deleted');
    }
  };

  return (
    <div>
      <h1>Customers</h1>

      {/* Layer 1: UI check */}
      <Can permission="create-customer">
        <Button onClick={() => navigate('/customers/new')}>
          Add Customer
        </Button>
      </Can>

      <DataTable
        data={customers}
        columns={columns}
        onEdit={hasPermission('edit-customer') ? handleEdit : undefined}
        onDelete={hasPermission('delete-customer') ? handleDelete : undefined}
      />
    </div>
  );
}

// Protect entire page
export default function () {
  return (
    <PermissionProtectedRoute permission="view-customer">
      <CustomerPage />
    </PermissionProtectedRoute>
  );
}
```

---

## ✅ Checklist Implementation

- [ ] ✅ SQL schema sudah dijalankan
- [ ] ✅ PermissionProvider sudah wrap App
- [ ] ✅ Default roles & permissions sudah ada
- [ ] 🔄 Implement `<Can>` di UI components
- [ ] 🔄 Implement `<PermissionProtectedRoute>` di routes
- [ ] 🔄 Implement permission checks di logic
- [ ] 🔄 Test dengan berbagai roles

---

## 🎓 Key Takeaways

1. **Permission = Hak akses spesifik** (create-customer, edit-pipeline)
2. **Role = Kumpulan permissions** (sales-manager, admin)
3. **User punya 1 role** → dapat semua permissions dari role tersebut
4. **3-layer protection** → UI + Logic + API
5. **Simple to use** → `<Can>`, `usePermission()`, `<PermissionProtectedRoute>`

**Dokumentasi Lengkap:** 
- `PANDUAN_ROLES_PERMISSIONS.md` - Panduan detail
- `QUICK_START_PERMISSIONS.md` - Quick start guide
- `SCHEMA_ROLES_PERMISSIONS.sql` - Database schema

Selamat mengimplementasikan! 🚀
