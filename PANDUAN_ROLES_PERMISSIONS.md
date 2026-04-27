# 📋 Panduan Lengkap: Roles & Permissions System

## 📖 Daftar Isi
1. [Konsep Dasar](#konsep-dasar)
2. [Struktur Database](#struktur-database)
3. [Default Roles & Permissions](#default-roles--permissions)
4. [Setup & Instalasi](#setup--instalasi)
5. [Cara Penggunaan](#cara-penggunaan)
6. [API Reference](#api-reference)
7. [Component Reference](#component-reference)
8. [Contoh Implementasi](#contoh-implementasi)
9. [Best Practices](#best-practices)
10. [Troubleshooting](#troubleshooting)

---

## 🎯 Konsep Dasar

Sistem Roles & Permissions ini didesain mirip dengan **Spatie Laravel Permission**, tetapi menggunakan **Supabase** dan **React** dengan storage di tabel `kv_store_6a7942bb`.

### Konsep Utama

1. **Permission (Hak Akses)**
   - Unit terkecil dari hak akses
   - Contoh: `create-customer`, `edit-pipeline`, `delete-quotation`
   - Mewakili aksi spesifik yang dapat dilakukan user

2. **Role (Peran)**
   - Kumpulan dari beberapa permissions
   - Contoh: `admin`, `sales-manager`, `sales-staff`
   - Memudahkan pengelompokan permissions

3. **User**
   - Setiap user memiliki 1 role
   - Permissions user ditentukan oleh role yang dimiliki
   - User inherit semua permissions dari role-nya

### Alur Kerja

```
User → memiliki → Role → memiliki → Permissions
```

**Contoh:**
- User "John" memiliki role `sales-staff`
- Role `sales-staff` memiliki permissions: `["view-customer", "create-customer", "edit-customer"]`
- Maka John dapat: melihat, membuat, dan edit customer
- John TIDAK dapat delete customer karena permission `delete-customer` tidak ada di role-nya

---

## 💾 Struktur Database

Semua data disimpan di tabel **`kv_store_6a7942bb`** dengan struktur:

| Column | Type | Description |
|--------|------|-------------|
| key | text | Primary key (format: `type:name`) |
| type | text | Tipe data: `user`, `role`, `permission` |
| data | json | Data detail dalam format JSON |
| created_at | timestamp | Waktu dibuat |
| updated_at | timestamp | Waktu diupdate |

### Format Data

#### 1. Permission
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

#### 2. Role
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
      "delete-customer",
      "view-pipeline",
      "create-pipeline"
    ]
  }
}
```

#### 3. User
```json
{
  "key": "user:johndoe",
  "type": "user",
  "data": {
    "username": "johndoe",
    "email": "john@example.com",
    "password": "hashed_password",
    "nama_user": "John Doe",
    "role": "sales-manager",
    "is_active": true
  }
}
```

---

## 🔐 Default Roles & Permissions

### Default Permissions (Grouped by Module)

#### Sales Module
- `view-customer` - Melihat data customer
- `create-customer` - Membuat customer baru
- `edit-customer` - Edit data customer
- `delete-customer` - Hapus customer
- `view-pipeline` - Melihat data pipeline
- `create-pipeline` - Membuat pipeline baru
- `edit-pipeline` - Edit data pipeline
- `delete-pipeline` - Hapus pipeline
- `view-quotation` - Melihat quotation
- `create-quotation` - Membuat quotation
- `edit-quotation` - Edit quotation
- `delete-quotation` - Hapus quotation

#### HRGA Module
- `view-employee` - Melihat data karyawan
- `create-employee` - Membuat karyawan baru
- `edit-employee` - Edit data karyawan
- `delete-employee` - Hapus karyawan

#### Master Data Module
- `manage-master-data` - Kelola data master

#### System Module
- `manage-users` - Kelola user dan akses
- `manage-roles` - Kelola roles dan permissions
- `view-logs` - Melihat log sistem

### Default Roles

#### 1. Super Admin
**Role Name:** `super-admin`
**Permissions:** Semua permissions (Full Access)
**Use Case:** System administrator, Owner

#### 2. Admin
**Role Name:** `admin`
**Permissions:** Hampir semua, kecuali manage-roles
**Use Case:** Manager tingkat atas

#### 3. Sales Manager
**Role Name:** `sales-manager`
**Permissions:** Semua permissions sales (CRUD)
**Use Case:** Manager sales

#### 4. Sales Staff
**Role Name:** `sales-staff`
**Permissions:** View, Create, Edit sales data (tidak ada Delete)
**Use Case:** Staff sales

#### 5. HRGA Manager
**Role Name:** `hrga-manager`
**Permissions:** CRUD employee data
**Use Case:** Manager HRGA

#### 6. Viewer
**Role Name:** `viewer`
**Permissions:** Hanya View (Read-only)
**Use Case:** Auditor, Observer

---

## ⚙️ Setup & Instalasi

### Langkah 1: Run SQL Schema

Jalankan file SQL untuk membuat struktur dan seed data:

```bash
# Di Supabase SQL Editor atau psql
psql -h your-db-host -U postgres -d your-database -f SCHEMA_ROLES_PERMISSIONS.sql
```

Atau copy-paste isi `SCHEMA_ROLES_PERMISSIONS.sql` ke Supabase SQL Editor.

### Langkah 2: Wrap App dengan PermissionProvider

Edit `src/app/App.tsx`:

```tsx
import { SimpleAuthProvider } from './contexts/simple-auth-context';
import { PermissionProvider } from './contexts/permission-context';

function App() {
  return (
    <SimpleAuthProvider>
      <PermissionProvider>
        {/* Your app routes */}
      </PermissionProvider>
    </SimpleAuthProvider>
  );
}
```

**PENTING:** `PermissionProvider` harus di dalam `SimpleAuthProvider` karena membutuhkan user context.

### Langkah 3: Verifikasi

Login sebagai admin default:
- Username: `admin`
- Password: `admin123`
- Role: `super-admin` (full access)

---

## 🚀 Cara Penggunaan

### A. Di Component (UI Level)

#### 1. Menggunakan Component `<Can>`

**Conditional rendering berdasarkan permission:**

```tsx
import { Can } from '../components/can';

function CustomerPage() {
  return (
    <div>
      <h1>Customer List</h1>

      {/* Show button only if user has permission */}
      <Can permission="create-customer">
        <Button onClick={handleCreate}>
          Add Customer
        </Button>
      </Can>

      {/* Show edit/delete only if has permission */}
      <Can permission="edit-customer">
        <Button onClick={handleEdit}>Edit</Button>
      </Can>

      <Can permission="delete-customer">
        <Button onClick={handleDelete}>Delete</Button>
      </Can>
    </div>
  );
}
```

**Multiple permissions (ANY):**
```tsx
{/* Show jika punya salah satu permission */}
<Can permissions={["edit-customer", "delete-customer"]}>
  <div>Edit or Delete Actions</div>
</Can>
```

**Multiple permissions (ALL):**
```tsx
{/* Show hanya jika punya SEMUA permissions */}
<Can permissions={["edit-customer", "delete-customer"]} requireAll={true}>
  <div>Full Access Actions</div>
</Can>
```

**With Fallback:**
```tsx
<Can 
  permission="view-customer" 
  fallback={<div>You don't have access</div>}
>
  <CustomerList />
</Can>
```

#### 2. Menggunakan Hook `usePermission`

**Check permission dalam logic:**

```tsx
import { usePermission } from '../contexts/permission-context';

function CustomerActions() {
  const { hasPermission, hasAnyPermission, permissions } = usePermission();

  const handleAction = () => {
    if (!hasPermission('delete-customer')) {
      toast.error('You do not have permission to delete');
      return;
    }

    // Proceed with delete
    deleteCustomer();
  };

  return (
    <div>
      <Button 
        onClick={handleAction}
        disabled={!hasPermission('delete-customer')}
      >
        Delete
      </Button>

      {/* Check multiple permissions */}
      {hasAnyPermission(['edit-customer', 'delete-customer']) && (
        <div>Edit or Delete Available</div>
      )}

      {/* Show all permissions user has */}
      <div>
        Your permissions: {permissions.join(', ')}
      </div>
    </div>
  );
}
```

### B. Di Route Level

#### Menggunakan `<PermissionProtectedRoute>`

**Protect entire page:**

```tsx
import { PermissionProtectedRoute } from '../components/permission-protected-route';

// In routes.tsx or route config
{
  path: '/sales/customers',
  element: (
    <PermissionProtectedRoute permission="view-customer">
      <CustomerPage />
    </PermissionProtectedRoute>
  )
}
```

**With multiple permissions:**
```tsx
{
  path: '/admin/settings',
  element: (
    <PermissionProtectedRoute 
      permissions={["manage-users", "manage-roles"]}
      requireAll={true}
    >
      <AdminSettingsPage />
    </PermissionProtectedRoute>
  )
}
```

**Custom redirect:**
```tsx
<PermissionProtectedRoute 
  permission="view-reports"
  redirectTo="/dashboard"
>
  <ReportsPage />
</PermissionProtectedRoute>
```

### C. Di API Level

**Check permission before API call:**

```tsx
const handleDelete = async (id: string) => {
  // Check permission via API
  const hasPermission = await api.checkPermission(
    user.username, 
    'delete-customer'
  );

  if (!hasPermission) {
    toast.error('No permission to delete');
    return;
  }

  await api.deleteCustomer(id);
};
```

---

## 📚 API Reference

### Permission API

#### `api.getRoles()`
Get semua roles yang tersedia.

```tsx
const roles = await api.getRoles();
// Returns: [{ id: 'role:admin', name: 'admin', display_name: 'Administrator', ... }]
```

#### `api.getRole(roleName: string)`
Get detail role tertentu.

```tsx
const role = await api.getRole('sales-manager');
// Returns: { id: 'role:sales-manager', name: 'sales-manager', permissions: [...], ... }
```

#### `api.getPermissions()`
Get semua permissions yang tersedia.

```tsx
const permissions = await api.getPermissions();
// Returns: [{ id: 'permission:create-customer', name: 'create-customer', ... }]
```

#### `api.getPermissionsByModule()`
Get permissions grouped by module.

```tsx
const grouped = await api.getPermissionsByModule();
// Returns: { sales: [...], hrga: [...], master: [...], system: [...] }
```

#### `api.checkPermission(username: string, permission: string)`
Check apakah user punya permission tertentu.

```tsx
const canDelete = await api.checkPermission('johndoe', 'delete-customer');
// Returns: true atau false
```

#### `api.getUserPermissions(username: string)`
Get semua permissions yang dimiliki user.

```tsx
const userPerms = await api.getUserPermissions('johndoe');
// Returns: ['view-customer', 'create-customer', 'edit-customer']
```

#### `api.assignRoleToUser(username: string, roleName: string)`
Assign role ke user.

```tsx
await api.assignRoleToUser('johndoe', 'sales-manager');
```

#### `api.createRole(roleData: object)`
Buat role baru.

```tsx
await api.createRole({
  name: 'custom-role',
  display_name: 'Custom Role',
  description: 'Custom role description',
  permissions: ['view-customer', 'edit-customer']
});
```

#### `api.updateRole(roleName: string, roleData: object)`
Update role yang sudah ada.

```tsx
await api.updateRole('sales-staff', {
  name: 'sales-staff',
  display_name: 'Sales Staff',
  permissions: ['view-customer', 'create-customer', 'edit-customer', 'delete-customer']
});
```

#### `api.deleteRole(roleName: string)`
Hapus role.

```tsx
await api.deleteRole('custom-role');
```

---

## 🧩 Component Reference

### `<Can>` Component

```tsx
<Can 
  permission="create-customer"           // Single permission
  permissions={["edit", "delete"]}        // Multiple permissions
  requireAll={false}                      // Require ALL or ANY (default: false/ANY)
  fallback={<div>No access</div>}        // Fallback component
>
  {children}
</Can>
```

### `<Cannot>` Component

Kebalikan dari `<Can>`, render children jika user TIDAK punya permission.

```tsx
<Cannot permission="delete-customer">
  <div>You cannot delete customers</div>
</Cannot>
```

### `<PermissionProtectedRoute>` Component

```tsx
<PermissionProtectedRoute
  permission="view-customer"              // Single permission
  permissions={["edit", "delete"]}        // Multiple permissions
  requireAll={false}                      // Require ALL or ANY
  redirectTo="/dashboard"                 // Custom redirect path
  fallback={<CustomAccessDenied />}       // Custom fallback
>
  {children}
</PermissionProtectedRoute>
```

### `usePermission()` Hook

```tsx
const {
  permissions,          // Array of user's permissions
  hasPermission,        // (permission: string) => boolean
  hasAnyPermission,     // (permissions: string[]) => boolean
  hasAllPermissions,    // (permissions: string[]) => boolean
  loading,              // boolean
  refreshPermissions    // () => Promise<void>
} = usePermission();
```

---

## 💡 Contoh Implementasi

### Contoh 1: Customer Page dengan Permission Check

```tsx
import { Can } from '../components/can';
import { usePermission } from '../contexts/permission-context';

export function CustomersPage() {
  const { hasPermission } = usePermission();

  const handleDelete = async (id: string) => {
    if (!hasPermission('delete-customer')) {
      toast.error('No permission to delete');
      return;
    }

    if (confirm('Delete customer?')) {
      await api.deleteCustomer(id);
      toast.success('Customer deleted');
    }
  };

  return (
    <div>
      <PageHeader title="Customers">
        <Can permission="create-customer">
          <Button onClick={() => navigate('/customers/new')}>
            Add Customer
          </Button>
        </Can>
      </PageHeader>

      <DataTable
        data={customers}
        columns={columns}
        onEdit={
          hasPermission('edit-customer') 
            ? handleEdit 
            : undefined
        }
        onDelete={
          hasPermission('delete-customer')
            ? handleDelete
            : undefined
        }
      />
    </div>
  );
}
```

### Contoh 2: Route Protection

```tsx
// routes.tsx
import { PermissionProtectedRoute } from './components/permission-protected-route';

export const routes = [
  {
    path: '/sales/customers',
    element: (
      <PermissionProtectedRoute permission="view-customer">
        <CustomersPage />
      </PermissionProtectedRoute>
    )
  },
  {
    path: '/sales/customers/new',
    element: (
      <PermissionProtectedRoute permission="create-customer">
        <CustomerForm />
      </PermissionProtectedRoute>
    )
  },
  {
    path: '/admin/users',
    element: (
      <PermissionProtectedRoute 
        permissions={["manage-users", "manage-roles"]}
        requireAll={true}
      >
        <UserManagement />
      </PermissionProtectedRoute>
    )
  }
];
```

### Contoh 3: Role Management Page

```tsx
export function RoleManagement() {
  const [roles, setRoles] = useState([]);
  const [permissions, setPermissions] = useState([]);

  useEffect(() => {
    fetchRoles();
    fetchPermissions();
  }, []);

  const fetchRoles = async () => {
    const data = await api.getRoles();
    setRoles(data);
  };

  const fetchPermissions = async () => {
    const grouped = await api.getPermissionsByModule();
    setPermissions(grouped);
  };

  const handleAssignRole = async (username: string, roleName: string) => {
    await api.assignRoleToUser(username, roleName);
    toast.success('Role assigned');
  };

  return (
    <PermissionProtectedRoute permission="manage-roles">
      <div>
        <h1>Role Management</h1>
        
        {/* List roles */}
        {roles.map(role => (
          <Card key={role.id}>
            <h3>{role.display_name}</h3>
            <p>{role.description}</p>
            <div>
              Permissions: {role.permissions.length}
            </div>
          </Card>
        ))}

        {/* Permissions by module */}
        {Object.entries(permissions).map(([module, perms]) => (
          <div key={module}>
            <h3>{module}</h3>
            {perms.map(perm => (
              <div key={perm.name}>{perm.display_name}</div>
            ))}
          </div>
        ))}
      </div>
    </PermissionProtectedRoute>
  );
}
```

---

## ✅ Best Practices

### 1. Naming Convention

**Permissions:**
- Format: `{action}-{resource}`
- Contoh: `create-customer`, `edit-pipeline`, `delete-quotation`
- Gunakan lowercase dengan dash separator

**Roles:**
- Format: `{department}-{level}` atau descriptive name
- Contoh: `sales-manager`, `admin`, `viewer`
- Gunakan lowercase dengan dash separator

### 2. Granularity

**DO:**
- Buat permissions yang spesifik: `create-customer`, `edit-customer`
- Group permissions di role

**DON'T:**
- Buat permissions terlalu general: `manage-everything`
- Langsung assign banyak permissions ke user

### 3. Security

**Always check permissions di:**
1. **UI Level** - Hide buttons/features user tidak boleh akses
2. **Route Level** - Protect entire pages
3. **API Level** - Final validation di backend

```tsx
// ✅ Good: Multi-layer protection
<Can permission="delete-customer">
  <Button onClick={handleDelete}>Delete</Button>
</Can>

const handleDelete = async (id: string) => {
  // Extra check
  if (!hasPermission('delete-customer')) return;
  
  await api.deleteCustomer(id); // API juga harus check
};
```

### 4. User Experience

**Loading State:**
```tsx
const { loading } = usePermission();

if (loading) {
  return <LoadingSpinner />;
}
```

**Informative Messages:**
```tsx
<Can 
  permission="create-customer"
  fallback={
    <div className="text-muted-foreground">
      You need permission to create customers. Contact your admin.
    </div>
  }
>
  <CreateButton />
</Can>
```

### 5. Module Organization

Group permissions by module untuk kemudahan maintenance:

```
sales: view-customer, create-customer, edit-customer, delete-customer
hrga: view-employee, create-employee, edit-employee, delete-employee
master: manage-master-data
system: manage-users, manage-roles, view-logs
```

---

## 🐛 Troubleshooting

### Problem 1: Permissions tidak ter-load

**Symptom:** Component `<Can>` selalu hide, `hasPermission()` selalu return false

**Solution:**
1. Check apakah `PermissionProvider` sudah wrap App
2. Check apakah user sudah login
3. Check apakah user punya role
4. Check di Network tab apakah API call berhasil

```tsx
// Debug di console
const { permissions, loading } = usePermission();
console.log('Permissions:', permissions);
console.log('Loading:', loading);
```

### Problem 2: User role tidak tersimpan

**Symptom:** Setelah login, user.role = undefined

**Solution:**
1. Check database, pastikan user punya field `role` di data JSON
2. Update user dengan role:

```sql
UPDATE kv_store_6a7942bb
SET data = jsonb_set(data::jsonb, '{role}', '"sales-staff"'::jsonb)::json
WHERE key = 'user:johndoe' AND type = 'user';
```

### Problem 3: Permission check selalu return false

**Symptom:** `hasPermission('create-customer')` return false padahal role sudah benar

**Solution:**
1. Check nama permission harus EXACT match (case-sensitive)
2. Check di database apakah permission ada di array permissions role

```sql
-- Check role permissions
SELECT data->'permissions' 
FROM kv_store_6a7942bb 
WHERE key = 'role:sales-staff' AND type = 'role';
```

### Problem 4: RLS Policy blocking access

**Symptom:** Error "permission denied for table kv_store_6a7942bb"

**Solution:**
Pastikan RLS policies sudah di-set untuk authenticated users:

```sql
-- Enable RLS
ALTER TABLE kv_store_6a7942bb ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Allow authenticated users to read kv_store"
ON kv_store_6a7942bb FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Allow authenticated users to write kv_store"
ON kv_store_6a7942bb FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update kv_store"
ON kv_store_6a7942bb FOR UPDATE
TO authenticated
USING (true);

CREATE POLICY "Allow authenticated users to delete kv_store"
ON kv_store_6a7942bb FOR DELETE
TO authenticated
USING (true);
```

---

## 🎓 Kesimpulan

Sistem Roles & Permissions ini memberikan:
- ✅ Kontrol akses yang fleksibel
- ✅ Easy to maintain dan scale
- ✅ Simple implementation
- ✅ Konsisten dengan best practices

**Quick Start Checklist:**
- [ ] Run SQL schema
- [ ] Wrap app dengan PermissionProvider
- [ ] Protect routes dengan PermissionProtectedRoute
- [ ] Use `<Can>` component di UI
- [ ] Use `usePermission()` hook di logic
- [ ] Test dengan different roles

**Next Steps:**
1. Buat role sesuai struktur organisasi
2. Assign permissions ke roles
3. Assign roles ke users
4. Implement permission checks di semua pages
5. Test dengan berbagai roles

Selamat menggunakan! 🚀
