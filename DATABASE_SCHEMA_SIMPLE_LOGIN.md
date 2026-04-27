# Database Schema - Simple Login System

## Overview

Sistem login sederhana menggunakan tabel `kv_store_6a7942bb` untuk menyimpan data user tanpa enkripsi password.

---

## Table: kv_store_6a7942bb

### User Records

**Key Pattern:** `user:{timestamp}`

**Value Structure:**
```json
{
  "id": "user:1234567890",
  "username": "yudi",
  "email": "yudi@gmail.com",
  "password": "password123",
  "nama_user": "Yudi Setiawan",
  "employee_id": "karyawan:987654321",
  "role": "admin",
  "is_active": true,
  "created_at": "2026-04-15T10:30:00.000Z",
  "updated_at": "2026-04-15T10:30:00.000Z"
}
```

### Field Descriptions

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string | Yes | Unique identifier (key di kv_store) |
| `username` | string | Yes | Username untuk login (unique) |
| `email` | string | Yes | Email address (unique) |
| `password` | string | Yes | Password plain text (tidak dienkripsi) |
| `nama_user` | string | Yes | Nama lengkap user |
| `employee_id` | string | No | Foreign key ke employee record |
| `role` | string | No | Role user (admin, manager, staff) |
| `is_active` | boolean | Yes | Status aktif user (default: true) |
| `created_at` | string | Yes | Timestamp created |
| `updated_at` | string | Yes | Timestamp last update |

---

## Employee Link

### Foreign Key

`employee_id` → `karyawan:{id}`

**Example:**
```json
{
  "id": "user:1234567890",
  "username": "yudi",
  "employee_id": "karyawan:987654321"
}
```

**Query employee data:**
```javascript
const user = await kvGet('user:1234567890');
if (user.employee_id) {
  const employee = await kvGet(user.employee_id);
  // employee: { full_name, email, employee_code, ... }
}
```

---

## Login Flow

### 1. User Input

```
Input: username/email + password
```

### 2. Validation

```javascript
// Cari user berdasarkan username atau email
const users = await kvGetByPrefix('user:');
const user = users.find(u => 
  (u.username === identifier || u.email === identifier) &&
  u.password === password &&
  u.is_active === true
);

if (user) {
  // Login berhasil
  localStorage.setItem('currentUser', JSON.stringify(user));
} else {
  // Login gagal
}
```

### 3. Session Management

**Storage:** `localStorage`

**Key:** `currentUser`

**Value:**
```json
{
  "id": "user:1234567890",
  "username": "yudi",
  "email": "yudi@gmail.com",
  "nama_user": "Yudi Setiawan",
  "employee_id": "karyawan:987654321",
  "role": "admin"
}
```

**Note:** Password TIDAK disimpan di localStorage

---

## API Functions

### 1. Get All Users

```typescript
async getUsers() {
  return await kvGetByPrefix('user:');
}
```

### 2. Create User

```typescript
async createUser(data: {
  username: string;
  email: string;
  password: string;
  nama_user: string;
  employee_id?: string;
  role?: string;
}) {
  // Check duplicate username
  const users = await kvGetByPrefix('user:');
  const existingUser = users.find(u => 
    u.username === data.username || u.email === data.email
  );
  
  if (existingUser) {
    throw new Error('Username atau email sudah digunakan');
  }

  const id = `user:${Date.now()}`;
  await kvSet(id, {
    ...data,
    id,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  });
  
  return { success: true, id };
}
```

### 3. Login / Validate Credentials

```typescript
async login(identifier: string, password: string) {
  const users = await kvGetByPrefix('user:');
  const user = users.find(u =>
    (u.username === identifier || u.email === identifier) &&
    u.password === password &&
    u.is_active === true
  );

  if (!user) {
    return { success: false, error: 'Username atau password salah' };
  }

  // Fetch employee data if linked
  let employeeData = null;
  if (user.employee_id) {
    employeeData = await kvGet(user.employee_id);
  }

  return {
    success: true,
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
      nama_user: user.nama_user,
      employee_id: user.employee_id,
      role: user.role,
      employee_code: employeeData?.employee_code,
      full_name: employeeData?.full_name
    }
  };
}
```

### 4. Update User

```typescript
async updateUser(id: string, data: Partial<User>) {
  const existing = await kvGet(id);
  if (!existing) throw new Error('User not found');

  await kvSet(id, {
    ...existing,
    ...data,
    updated_at: new Date().toISOString()
  });

  return { success: true };
}
```

### 5. Delete User (Soft Delete)

```typescript
async deleteUser(id: string) {
  const existing = await kvGet(id);
  if (!existing) throw new Error('User not found');

  await kvSet(id, {
    ...existing,
    is_active: false,
    updated_at: new Date().toISOString()
  });

  return { success: true };
}
```

---

## Initial Data / Seed Users

### Admin User

```json
{
  "id": "user:admin",
  "username": "admin",
  "email": "admin@erp.com",
  "password": "admin123",
  "nama_user": "Administrator",
  "employee_id": null,
  "role": "admin",
  "is_active": true,
  "created_at": "2026-04-15T00:00:00.000Z",
  "updated_at": "2026-04-15T00:00:00.000Z"
}
```

**Insert SQL:**
```sql
INSERT INTO kv_store_6a7942bb (key, value)
VALUES (
  'user:admin',
  '{"id":"user:admin","username":"admin","email":"admin@erp.com","password":"admin123","nama_user":"Administrator","employee_id":null,"role":"admin","is_active":true,"created_at":"2026-04-15T00:00:00.000Z","updated_at":"2026-04-15T00:00:00.000Z"}'::jsonb
);
```

---

## Indexes (Optional)

Tidak ada index khusus karena menggunakan kv_store. Query dilakukan dengan `kvGetByPrefix('user:')` dan filter di aplikasi.

**Performance Note:**
- Untuk <1000 users: acceptable
- Untuk >1000 users: pertimbangkan membuat tabel terpisah dengan index

---

## Security Considerations

⚠️ **WARNING: Plain Text Password**

Sistem ini menggunakan **plain text password** (tidak dienkripsi). Ini **TIDAK AMAN** untuk production!

**Risiko:**
1. Jika database breach, semua password terbaca
2. Tidak memenuhi standar keamanan (OWASP, ISO 27001)
3. Melanggar GDPR jika ada data EU

**Rekomendasi untuk Production:**
1. Gunakan bcrypt/argon2 untuk hash password
2. Gunakan Supabase Auth atau NextAuth
3. Implement 2FA (Two-Factor Authentication)
4. Rate limiting untuk prevent brute force
5. Password complexity requirements

**Use Case yang Sesuai:**
- ✅ Development/Testing
- ✅ Internal tools (non-sensitive)
- ✅ Prototype/PoC
- ❌ Production app dengan data sensitif
- ❌ Public-facing application

---

## Migration dari Supabase Auth (Opsional)

Jika sebelumnya menggunakan Supabase Auth, data user bisa di-migrate:

```sql
-- Export existing users dari auth.users ke kv_store
INSERT INTO kv_store_6a7942bb (key, value)
SELECT 
  'user:' || id,
  jsonb_build_object(
    'id', 'user:' || id,
    'username', raw_user_meta_data->>'username',
    'email', email,
    'password', 'changeme123',  -- Set default password
    'nama_user', raw_user_meta_data->>'nama_user',
    'employee_id', null,
    'role', 'staff',
    'is_active', true,
    'created_at', created_at,
    'updated_at', NOW()
  )
FROM auth.users;
```

**Note:** Password perlu di-reset karena di auth.users sudah encrypted.

---

## Query Examples

### 1. Get All Active Users

```javascript
const users = await api.getUsers();
const activeUsers = users.filter(u => u.is_active);
```

### 2. Get User by Username

```javascript
const users = await api.getUsers();
const user = users.find(u => u.username === 'yudi');
```

### 3. Get Users with Employee Data

```javascript
const users = await api.getUsers();
const usersWithEmployee = await Promise.all(
  users.map(async (user) => {
    if (user.employee_id) {
      const employee = await kvGet(user.employee_id);
      return { ...user, employee };
    }
    return user;
  })
);
```

### 4. Change Password

```javascript
await api.updateUser('user:1234567890', {
  password: 'newpassword123'
});
```

### 5. Link User to Employee

```javascript
await api.updateUser('user:1234567890', {
  employee_id: 'karyawan:987654321'
});
```

---

## Backup & Recovery

### Backup All Users

```sql
-- Export to JSON
COPY (
  SELECT key, value
  FROM kv_store_6a7942bb
  WHERE key LIKE 'user:%'
) TO '/tmp/users_backup.csv' WITH CSV HEADER;
```

### Restore Users

```sql
-- Import from backup
COPY kv_store_6a7942bb (key, value)
FROM '/tmp/users_backup.csv' WITH CSV HEADER;
```

---

**Version:** 1.0  
**Last Updated:** April 2026  
**Security Level:** ⚠️ LOW (Plain Text Password)
