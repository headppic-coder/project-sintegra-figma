# Setup Manager Sales untuk Approval Workflow

## Masalah
Role manager sales tidak bisa menyetujui penawaran penjualan.

## Solusi yang Diterapkan

### 1. Permission Check yang Fleksibel
Sistem sekarang menerima berbagai format role:
- `manager_sales`, `sales_manager`
- `direktur`, `director`
- `admin`, `administrator`, `super-admin`, `superadmin`

Role akan dinormalisasi otomatis:
- Spasi → underscore
- Dash → underscore  
- Semua lowercase

### 2. Debugging Tools
- Console logging untuk melihat role user
- Debug card di development mode
- Info detail di halaman akses terbatas

### 3. Helper untuk Membuat Manager Sales
Tersedia di halaman Persetujuan Penawaran untuk admin/super-admin.

## Cara Membuat User Manager Sales

### Option 1: Via Browser Console (Tercepat)
```javascript
const api = await import('/src/app/lib/api.ts').then(m => m.api);

await api.createSimpleUser({
  username: 'manager1',
  email: 'manager1@example.com',
  password: 'password123',
  nama_user: 'Manager Sales 1',
  role: 'manager_sales'
});
```

### Option 2: Via UI Helper
1. Login sebagai super-admin
2. Buka halaman "Persetujuan Penawaran"
3. Klik tombol "Buat Manager Sales"
4. Isi form dan submit

### Option 3: Update Role User Existing
```javascript
const api = await import('/src/app/lib/api.ts').then(m => m.api);
await api.assignRoleToUser('username_user', 'manager_sales');
```

## Testing
1. Buat user dengan role `manager_sales`
2. Login dengan user tersebut
3. Buka halaman "Persetujuan Penawaran"
4. Pastikan muncul debug info yang menunjukkan "✓ Dapat Menyetujui"
5. Coba setujui penawaran yang berstatus Pending

## Format Role yang Benar
Gunakan salah satu dari:
- `manager_sales` (recommended)
- `sales_manager`
- `direktur`
- `admin`
- `super-admin`

JANGAN gunakan:
- Spasi di role name
- Huruf kapital
- Format inkonsisten
