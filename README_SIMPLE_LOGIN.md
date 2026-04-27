# Simple Login System - Complete Guide

## 📋 Overview

Sistem login sederhana menggunakan `kv_store_6a7942bb` tanpa Supabase Auth dan tanpa enkripsi password.

**⚠️ WARNING:** Password disimpan dalam **plain text** - **TIDAK AMAN** untuk production!

---

## 🚀 Quick Start

### 1. Setup Database

Jalankan SQL untuk create admin user:

```bash
# Buka Supabase Dashboard → SQL Editor
# Copy paste dan run: SEED_ADMIN_USER.sql
```

Atau biarkan aplikasi auto-create saat pertama kali load.

### 2. Login

```
URL: http://localhost:5173/login
Username: admin
Password: admin123
```

---

## 📁 File Structure

```
src/app/
├── contexts/
│   └── simple-auth-context.tsx       # Auth context (localStorage based)
├── components/
│   └── simple-protected-route.tsx    # Protected route wrapper
├── pages/
│   └── simple-login.tsx              # Login page dengan Tabs
└── lib/
    └── api.ts                        # API functions (login, register, dll)

Database Schema:
├── DATABASE_SCHEMA_SIMPLE_LOGIN.md   # Schema documentation
├── SEED_ADMIN_USER.sql               # SQL seed admin user
└── SIMPLE_LOGIN_IMPLEMENTATION.md    # Implementation guide
```

---

## 🔧 Implementasi

### Step 1: Update App.tsx

```tsx
import { SimpleAuthProvider } from './contexts/simple-auth-context';

function App() {
  return (
    <SimpleAuthProvider>
      <ThemeProvider>
        <Toaster />
        <RouterProvider router={router} />
      </ThemeProvider>
    </SimpleAuthProvider>
  );
}
```

### Step 2: Update routes.tsx

```tsx
import { SimpleProtectedRoute } from "./components/simple-protected-route";
import { SimpleLogin } from "./pages/simple-login";

export const router = createBrowserRouter([
  {
    path: "/login",
    element: <SimpleLogin />,
  },
  {
    path: "/",
    element: (
      <SimpleProtectedRoute>
        <MainLayout />
      </SimpleProtectedRoute>
    ),
    children: [/* ... */],
  },
]);
```

### Step 3: Update MainLayout.tsx

```tsx
import { useSimpleAuth } from '../contexts/simple-auth-context';

export function MainLayout() {
  const { user, signOut } = useSimpleAuth();

  // Use: user.nama_user, user.email, user.role, etc.
}
```

**Done!** Aplikasi sekarang menggunakan simple login system.

---

## 👤 User Management

### Create User via UI

1. Buka `/login`
2. Klik tab **"Daftar"**
3. Isi form:
   - Nama Lengkap
   - Username
   - Email
   - Password
   - Konfirmasi Password
4. Klik **"Daftar"**
5. Login dengan username/password baru

### Create User via API

```javascript
await api.createSimpleUser({
  username: 'yudi',
  email: 'yudi@erp.com',
  password: 'yudi123',
  nama_user: 'Yudi Setiawan',
  employee_id: 'karyawan:123', // optional
  role: 'manager' // optional, default: 'staff'
});
```

### Update User

```javascript
await api.updateSimpleUser('user:1234567890', {
  nama_user: 'Yudi S. Updated',
  password: 'newpassword',
  role: 'admin'
});
```

### Link User to Employee

```javascript
await api.updateSimpleUser('user:1234567890', {
  employee_id: 'karyawan:987654321'
});
```

### Delete User (Soft Delete)

```javascript
await api.deleteSimpleUser('user:1234567890');
// Sets is_active: false
```

### Get All Users

```javascript
const users = await api.getSimpleUsers();
// Returns array of users (without password field)
```

---

## 🔐 Roles & Permissions

### Available Roles

| Role | Description | Access Level |
|------|-------------|--------------|
| `admin` | Administrator | Full access |
| `manager` | Manager | Department access |
| `staff` | Staff | Limited access |

**Note:** Role-based access control (RBAC) belum diimplementasikan secara penuh. Semua role bisa akses semua menu.

### Implementing RBAC

```typescript
// Example: Check role in component
const { user } = useSimpleAuth();

if (user?.role === 'admin') {
  // Show admin-only features
}
```

---

## 🗄️ Database Schema

### User Data Structure

**Table:** `kv_store_6a7942bb`  
**Key:** `user:{timestamp}`

```json
{
  "id": "user:1234567890",
  "username": "yudi",
  "email": "yudi@erp.com",
  "password": "yudi123",
  "nama_user": "Yudi Setiawan",
  "employee_id": "karyawan:987654321",
  "role": "manager",
  "is_active": true,
  "created_at": "2026-04-15T10:30:00Z",
  "updated_at": "2026-04-15T10:30:00Z"
}
```

### Query Examples

```sql
-- Get all users
SELECT * FROM kv_store_6a7942bb WHERE key LIKE 'user:%';

-- Get specific user
SELECT * FROM kv_store_6a7942bb WHERE key = 'user:admin';

-- Change password
UPDATE kv_store_6a7942bb
SET value = jsonb_set(value, '{password}', '"newpassword"')
WHERE key = 'user:admin';

-- Link to employee
UPDATE kv_store_6a7942bb
SET value = jsonb_set(value, '{employee_id}', '"karyawan:123"')
WHERE key = 'user:yudi';

-- Deactivate user
UPDATE kv_store_6a7942bb
SET value = jsonb_set(value, '{is_active}', 'false')
WHERE key = 'user:staff1';
```

---

## 🔄 Session Management

### How it Works

1. User login → credentials validated
2. If valid → user data saved to `localStorage`
3. On page load → check `localStorage` for session
4. On logout → clear `localStorage`

### Storage Key

```javascript
localStorage.getItem('currentUser')
// Returns: {"id":"user:123","username":"yudi",...}
```

### Auto-Login

Session persists across page refreshes via localStorage.

### Logout

```javascript
const { signOut } = useSimpleAuth();
signOut(); // Clears localStorage and redirects to login
```

---

## 🧪 Testing

### Test Case 1: Login dengan Admin

```
1. Buka /login
2. Username: admin
3. Password: admin123
4. Klik "Masuk"
5. Expected: Redirect ke dashboard
```

### Test Case 2: Login Gagal

```
1. Username: admin
2. Password: wrongpassword
3. Expected: Error "Username atau password salah"
```

### Test Case 3: Register User Baru

```
1. Klik tab "Daftar"
2. Isi form lengkap
3. Klik "Daftar"
4. Expected: Success message + redirect ke tab Login
5. Login dengan username/password baru
6. Expected: Berhasil login
```

### Test Case 4: Session Persistence

```
1. Login
2. Refresh page (F5)
3. Expected: Tetap login, tidak redirect ke login page
```

### Test Case 5: Logout

```
1. Login
2. Klik user menu → Logout
3. Expected: Redirect ke /login, localStorage cleared
```

---

## 🐛 Troubleshooting

### Login Gagal Terus

**Check:**
1. Apakah admin user sudah ada di database?
   ```sql
   SELECT * FROM kv_store_6a7942bb WHERE key = 'user:admin';
   ```
2. Run seed script: `SEED_ADMIN_USER.sql`
3. Atau panggil di console:
   ```javascript
   await api.seedDefaultAdmin();
   ```

### Redirect Loop

**Fix:**
1. Clear localStorage:
   ```javascript
   localStorage.clear();
   ```
2. Clear browser cache
3. Reload page

### User Data Tidak Muncul di Header

**Check:**
1. Console log user state:
   ```javascript
   const { user } = useSimpleAuth();
   console.log('User:', user);
   ```
2. Pastikan `MainLayout` menggunakan `useSimpleAuth()` bukan `useAuth()`
3. Check localStorage:
   ```javascript
   console.log(localStorage.getItem('currentUser'));
   ```

### Password Reset Lupa

**Manual Reset via SQL:**
```sql
UPDATE kv_store_6a7942bb
SET value = jsonb_set(value, '{password}', '"newpassword123"')
WHERE key = 'user:admin';
```

---

## ⚠️ Security Warnings

### 🔴 Critical Issues

1. **Plain Text Password**
   - Password **TIDAK DIENKRIPSI**
   - Siapa saja yang akses database bisa lihat password
   - **JANGAN** gunakan untuk data sensitif!

2. **No Password Hashing**
   - Jika database breach, semua password terbaca
   - Tidak memenuhi standar security (OWASP, ISO 27001)

3. **localStorage Session**
   - Session bisa di-steal via XSS attack
   - Tidak ada token expiration
   - Tidak ada refresh token

4. **No Rate Limiting**
   - Rentan terhadap brute force attack
   - Tidak ada captcha atau login attempt limit

5. **No Email Verification**
   - Siapa saja bisa register dengan email apapun
   - Tidak ada konfirmasi email

### 🟡 Recommendations

**Untuk Development:**
- ✅ OK untuk development/testing
- ✅ OK untuk internal tools non-sensitive
- ✅ OK untuk prototype/PoC

**Untuk Production:**
- ❌ Jangan pakai simple login
- ✅ Gunakan Supabase Auth (sudah ada implementasi sebelumnya)
- ✅ Atau implement bcrypt/argon2 untuk hash password
- ✅ Implement 2FA
- ✅ Add rate limiting
- ✅ Add email verification
- ✅ Use httpOnly cookies untuk session

---

## 🔄 Migration

### From Simple Login → Supabase Auth

1. Backup existing users:
   ```sql
   COPY (
     SELECT * FROM kv_store_6a7942bb WHERE key LIKE 'user:%'
   ) TO '/tmp/users_backup.json';
   ```

2. Create auth users:
   ```javascript
   const users = await api.getSimpleUsers();
   for (const user of users) {
     await supabase.auth.signUp({
       email: user.email,
       password: 'changeme123', // Users need to reset
       options: {
         data: {
           nama_user: user.nama_user,
           username: user.username
         }
       }
     });
   }
   ```

3. Update aplikasi pakai Supabase Auth (see: old implementation)

### From Supabase Auth → Simple Login

See: `DATABASE_SCHEMA_SIMPLE_LOGIN.md` section "Migration"

---

## 📚 API Reference

### Login

```typescript
api.simpleLogin(identifier: string, password: string)
// Returns: { success: boolean, user?: UserData, error?: string }
```

### Register

```typescript
api.createSimpleUser({
  username: string,
  email: string,
  password: string,
  nama_user: string,
  employee_id?: string,
  role?: string
})
// Returns: { success: boolean, id: string }
```

### Get Users

```typescript
api.getSimpleUsers()
// Returns: UserData[] (without passwords)
```

### Update User

```typescript
api.updateSimpleUser(id: string, data: Partial<UserData>)
// Returns: { success: boolean }
```

### Delete User

```typescript
api.deleteSimpleUser(id: string)
// Returns: { success: boolean }
```

### Seed Admin

```typescript
api.seedDefaultAdmin()
// Returns: { success: boolean, message: string }
```

---

## 📞 Support

Jika mengalami masalah:

1. Check dokumentasi ini
2. Check `DATABASE_SCHEMA_SIMPLE_LOGIN.md`
3. Check `SIMPLE_LOGIN_IMPLEMENTATION.md`
4. Debug dengan browser console
5. Check database langsung di Supabase

---

**Version:** 1.0  
**Created:** April 2026  
**Security Level:** ⚠️ LOW (Development Only)  
**Production Ready:** ❌ NO
