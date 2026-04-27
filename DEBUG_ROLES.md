# Debug Role Issues - Quotation Approval

## Masalah
User dengan role "sales-manager" atau "manager sales" tidak bisa menyetujui penawaran (tombol Setuju/Tolak tidak muncul).

## Cara Debug

### 1. Buka Browser Console (F12)

### 2. Periksa Semua User dan Role Mereka

```javascript
const api = await import('/src/app/lib/api.ts').then(m => m.api);
const users = await api.getSimpleUsers();

console.table(users.map(u => ({
  username: u.username,
  nama: u.nama_user,
  role: u.role,
  role_length: u.role?.length,
  role_type: typeof u.role
})));
```

### 3. Periksa User Spesifik (ganti 'yudiyanto' dengan username Anda)

```javascript
const api = await import('/src/app/lib/api.ts').then(m => m.api);
const users = await api.getSimpleUsers();
const user = users.find(u => u.username === 'yudiyanto');

console.log('User Object:', user);
console.log('Role (raw):', user.role);
console.log('Role (stringified):', JSON.stringify(user.role));
console.log('Role length:', user.role?.length);
console.log('Role charCodes:', [...(user.role || '')].map(c => c.charCodeAt(0)));
```

### 4. Fix Role untuk User Tertentu

```javascript
const api = await import('/src/app/lib/api.ts').then(m => m.api);

// Update role - pilih salah satu format yang benar:
await api.assignRoleToUser('yudiyanto', 'manager_sales');

console.log('✅ Role updated! Logout dan login lagi untuk melihat perubahan.');
```

### 5. Format Role yang BENAR (Gunakan salah satu):

✅ **BENAR:**
- `manager_sales` (recommended)
- `sales_manager`
- `direktur`
- `director`
- `admin`
- `super-admin`

❌ **SALAH:**
- `Manager Sales` (ada spasi)
- `sales-manager` (pakai dash, seharusnya underscore)
- `MANAGER_SALES` (huruf kapital)
- ` manager_sales ` (ada whitespace di awal/akhir)

### 6. Test Permission Check Secara Manual

```javascript
const user = { role: 'sales-manager' }; // ganti dengan role yang ingin di-test

const userRole = user?.role?.toLowerCase().replace(/\s+/g, '_').replace(/-/g, '_');

const canApprove = 
  userRole === 'manager_sales' ||
  userRole === 'sales_manager' ||
  userRole === 'direktur' ||
  userRole === 'admin' ||
  userRole === 'super_admin';

console.log('Original role:', user.role);
console.log('Normalized role:', userRole);
console.log('Can approve:', canApprove);
```

## Solusi Cepat

### Jika Anda adalah user yang terpengaruh:

1. Buka halaman "Persetujuan Penawaran"
2. Lihat card "Status Akses Persetujuan" di atas
3. Jika status "✗ Tidak Bisa Menyetujui", lihat role Anda
4. Gunakan card "Role Tidak Sesuai?" untuk update role
5. Pilih role yang benar dari dropdown
6. Klik "Update Role"
7. Halaman akan refresh otomatis

### Jika Anda adalah admin yang ingin fix user lain:

```javascript
const api = await import('/src/app/lib/api.ts').then(m => m.api);

// List semua user
const users = await api.getSimpleUsers();
console.table(users.map(u => ({ username: u.username, role: u.role })));

// Fix role untuk user tertentu
await api.assignRoleToUser('USERNAME_DISINI', 'manager_sales');
```

## Catatan Penting

1. **Setelah update role**, user HARUS:
   - Logout dan login lagi, ATAU
   - Refresh halaman jika localStorage sudah diupdate

2. **Format role harus konsisten:**
   - Gunakan lowercase
   - Gunakan underscore untuk pemisah
   - Tidak ada spasi di awal/akhir

3. **Cek console log** saat buka halaman Persetujuan Penawaran:
   - Akan ada log detail tentang permission check
   - Lihat apakah role ter-normalize dengan benar

## Troubleshooting

### Role sudah benar tapi masih tidak bisa approve?

1. Pastikan logout dan login lagi
2. Clear localStorage:
   ```javascript
   localStorage.clear();
   location.reload();
   ```
3. Periksa console log untuk error

### Role berubah terus ke format lama?

Kemungkinan ada kode lain yang override role. Cari di codebase:
```bash
grep -r "role.*=" src/app/lib/api.ts
```
