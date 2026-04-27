# Update: Approval Workflow di Halaman Utama

## Perubahan yang Dilakukan

### ❌ Dihapus:
- Halaman terpisah "Persetujuan Penawaran" (`/sales/quotation-approvals`)
- Menu navigasi "Persetujuan Penawaran" di sidebar

### ✅ Ditambahkan:
- Tombol **"Setujui"** dan **"Tolak"** langsung di dropdown aksi kolom pada halaman "Penawaran Penjualan"
- Dialog konfirmasi untuk approval dan rejection
- Permission check otomatis (hanya Manager Sales, Direktur, Admin yang bisa)
- Status card untuk menunjukkan apakah user bisa menyetujui atau tidak

## Cara Kerja Workflow Baru

### 1. **Buat Draft**
- User (Staff Sales, Manager, Direktur, Admin) membuat penawaran
- Status: **Draft**
- Aksi tersedia: Edit, Hapus, Ajukan

### 2. **Ajukan untuk Persetujuan**
- Klik tombol **"Ajukan"** di kolom aksi
- Status berubah menjadi: **Pending**
- Aksi tersedia untuk yang punya permission: Setujui, Tolak

### 3. **Setujui atau Tolak**
**Hanya untuk Manager Sales, Direktur, atau Admin:**
- Klik tombol **"Setujui"** → Status menjadi **Approved**
- Klik tombol **"Tolak"** → Wajib isi alasan → Status menjadi **Rejected**

### 4. **Cetak**
- Tombol **"Cetak"** hanya muncul untuk penawaran yang sudah **Approved**

## Permission Check

### Yang Dapat Menyetujui/Menolak:
Role yang diterima (case-insensitive, auto-normalize):
- `manager_sales`
- `sales_manager`
- `direktur`
- `director`
- `admin`
- `administrator`
- `super-admin` / `super_admin`
- `superadmin`

### Normalisasi Role:
Sistem otomatis mengubah:
- Spasi → underscore
- Dash → underscore
- Huruf besar → huruf kecil

Contoh:
- "Manager Sales" → `manager_sales` ✓
- "sales-manager" → `sales_manager` ✓
- "DIREKTUR" → `direktur` ✓

## UI/UX

### Status Card (Muncul jika ada Pending):
Menampilkan:
- Nama user
- Role user
- Status: "✓ Dapat Menyetujui" atau "✗ Tidak Bisa Menyetujui"
- Peringatan jika user tidak punya permission

### Info Card (Kuning):
- Jumlah penawaran yang menunggu persetujuan
- Instruksi untuk menyetujui/menolak

### Tombol di Dropdown Aksi:

#### Untuk Draft:
- ✉️ Ajukan
- ✏️ Edit
- 🗑️ Hapus

#### Untuk Pending (hanya jika user punya permission):
- ✓ Setujui
- ✗ Tolak

#### Untuk Approved:
- 🖨️ Cetak

## Dialog Konfirmasi

### Dialog Setujui:
- Menampilkan nomor penawaran
- Nama customer
- Total nilai
- Tombol: "Batal" atau "Ya, Setujui"

### Dialog Tolak:
- Menampilkan nomor penawaran
- **Field wajib**: Alasan penolakan
- Tombol: "Batal" atau "Ya, Tolak"

## Testing

### 1. Sebagai Staff Sales:
- Buat penawaran → Status Draft ✓
- Klik "Ajukan" → Status Pending ✓
- Tidak melihat tombol Setujui/Tolak ✓

### 2. Sebagai Manager Sales:
- Lihat penawaran Pending ✓
- Klik "Setujui" → Status Approved ✓
- Atau klik "Tolak" → Isi alasan → Status Rejected ✓

### 3. Sebagai User Biasa:
- Tidak melihat tombol Setujui/Tolak pada penawaran Pending ✓
- Melihat peringatan "Tidak Bisa Menyetujui" di status card ✓

## Troubleshooting

### Tombol Setujui/Tolak tidak muncul?
1. Pastikan status penawaran adalah **Pending**
2. Cek role user di status card
3. Pastikan role adalah salah satu dari: `manager_sales`, `direktur`, `admin`, dll
4. Jika role sudah benar tapi format salah, update role dengan format yang benar

### Cara Update Role:
```javascript
const api = await import('/src/app/lib/api.ts').then(m => m.api);
await api.assignRoleToUser('username', 'manager_sales');
// Logout dan login lagi
```
