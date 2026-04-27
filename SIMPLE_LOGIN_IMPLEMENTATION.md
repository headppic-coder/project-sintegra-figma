## Implementasi Simple Login System

Sistem login sederhana sudah dibuat. Untuk mengaktifkannya:

### 1. Update App.tsx

Ganti `AuthProvider` dengan `SimpleAuthProvider`:

**File:** `src/app/App.tsx`

```tsx
// BEFORE (Supabase Auth)
import { AuthProvider } from './contexts/auth-context';

function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        {/* ... */}
      </ThemeProvider>
    </AuthProvider>
  );
}

// AFTER (Simple Auth)
import { SimpleAuthProvider } from './contexts/simple-auth-context';

function App() {
  return (
    <SimpleAuthProvider>
      <ThemeProvider>
        {/* ... */}
      </ThemeProvider>
    </SimpleAuthProvider>
  );
}
```

---

### 2. Update routes.tsx

Ganti import dan component:

**File:** `src/app/routes.tsx`

```tsx
// BEFORE
import { ProtectedRoute } from "./components/protected-route";
import { Login } from "./pages/login";

export const router = createBrowserRouter([
  {
    path: "/login",
    element: <Login />,
  },
  {
    path: "/",
    element: (
      <ProtectedRoute>
        <MainLayout />
      </ProtectedRoute>
    ),
    // ...
  },
]);

// AFTER
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
    // ...
  },
]);
```

---

### 3. Update MainLayout.tsx

Ganti import `useAuth` dengan `useSimpleAuth`:

**File:** `src/app/layouts/main-layout.tsx`

```tsx
// BEFORE
import { useAuth } from '../contexts/auth-context';

export function MainLayout() {
  const { userData, signOut } = useAuth();
  // ...
}

// AFTER
import { useSimpleAuth } from '../contexts/simple-auth-context';

export function MainLayout() {
  const { user, signOut } = useSimpleAuth();
  
  // Update references dari userData menjadi user
  // userData.nama_user → user.nama_user
  // userData.email → user.email
  // dst...
}
```

---

### 4. Default Login Credentials

Setelah implementasi, login dengan:

```
Username: admin
Password: admin123
```

User admin otomatis dibuat saat pertama kali load aplikasi.

---

### 5. Membuat User Baru

Ada 2 cara:

#### A. Via Registrasi (UI)
1. Buka halaman login
2. Klik tab "Daftar"
3. Isi form registrasi
4. Klik "Daftar"
5. Login dengan username/email dan password yang baru dibuat

#### B. Via API / Console
```javascript
await api.createSimpleUser({
  username: 'yudi',
  email: 'yudi@gmail.com',
  password: 'yudi123',
  nama_user: 'Yudi Setiawan',
  employee_id: 'karyawan:123', // optional
  role: 'manager' // optional, default: 'staff'
});
```

---

### 6. Menghubungkan User dengan Karyawan

```javascript
// Get user ID
const users = await api.getSimpleUsers();
const yudi = users.find(u => u.username === 'yudi');

// Update dengan employee_id
await api.updateSimpleUser(yudi.id, {
  employee_id: 'karyawan:987654321'
});
```

Atau edit manual di Supabase Dashboard:
```sql
UPDATE kv_store_6a7942bb
SET value = jsonb_set(value, '{employee_id}', '"karyawan:987654321"')
WHERE key = 'user:1234567890';
```

---

### 7. Testing

1. Buka aplikasi
2. Harus redirect ke `/login`
3. Login dengan admin/admin123
4. Redirect ke dashboard
5. User info tampil di header
6. Logout berfungsi
7. Setelah logout, redirect ke login lagi

---

### 8. Data Structure

User disimpan di `kv_store_6a7942bb` dengan key pattern `user:{id}`:

```json
{
  "id": "user:1234567890",
  "username": "yudi",
  "email": "yudi@gmail.com",
  "password": "yudi123",
  "nama_user": "Yudi Setiawan",
  "employee_id": "karyawan:987654321",
  "role": "manager",
  "is_active": true,
  "created_at": "2026-04-15T10:30:00.000Z",
  "updated_at": "2026-04-15T10:30:00.000Z"
}
```

---

### 9. Troubleshooting

**Login gagal terus:**
- Check browser console untuk error
- Pastikan admin user sudah dibuat: `await api.seedDefaultAdmin()`
- Check di Supabase: `SELECT * FROM kv_store_6a7942bb WHERE key = 'user:admin'`

**Redirect loop:**
- Clear localStorage: `localStorage.clear()`
- Clear browser cache
- Reload halaman

**User tidak muncul di header:**
- Check `user` state di `useSimpleAuth()`
- Pastikan `MainLayout` sudah update dari `userData` ke `user`

---

### 10. Security Warning

⚠️ **PENTING:**

Sistem ini menggunakan **plain text password** - TIDAK AMAN untuk production!

**Hanya gunakan untuk:**
- Development
- Internal testing
- Prototype/PoC

**JANGAN gunakan untuk:**
- Production app
- Public-facing application
- Data sensitif

**Untuk production, gunakan:**
- Supabase Auth (sudah ter-implement di sistem lama)
- bcrypt/argon2 untuk hash password
- 2FA, rate limiting, etc.

---

## Perbandingan: Simple Login vs Supabase Auth

| Feature | Simple Login | Supabase Auth |
|---------|--------------|---------------|
| Setup | ✅ Mudah | ⚠️ Butuh config |
| Security | ❌ Plain text password | ✅ Encrypted |
| Session | localStorage | JWT + refresh token |
| Email verify | ❌ Tidak ada | ✅ Ada |
| Password reset | ❌ Manual | ✅ Email reset |
| 2FA | ❌ Tidak ada | ✅ Bisa implement |
| Production ready | ❌ NO | ✅ YES |

---

**Version:** 1.0  
**Created:** April 2026
