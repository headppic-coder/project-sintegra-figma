# Inventory Master UI - Setup & Usage

## 🎯 Overview

Sistem inventory management memiliki 3 menu master untuk mengelola kategori dan klasifikasi barang:

1. **Master Jenis Barang** - Jenis persediaan (Stock/Non-Stock/Jasa/Konsinyasi)
2. **Master Kategori Barang** - Kategori barang (Bahan Baku, Sparepart, Aset, dll)
3. **Master Sub-Kategori Barang** - Sub-kategori (Kertas, Plastik, Mekanik, Elektrik, dll)

## 📋 URL Menu

Semua menu berada di bawah prefix `/master/`:

- **Jenis Barang**: `/master/jenis-barang`
- **Kategori Barang**: `/master/kategori-barang`  
- **Sub-Kategori Barang**: `/master/sub-kategori-barang`

## 🚀 Setup Awal

### 1. Install Master Data

Sebelum menggunakan menu UI, pastikan master data sudah diinstall:

```sql
-- Jalankan di Supabase SQL Editor
-- File: docs/SETUP_INVENTORY_DIRECT.sql
```

Atau copy-paste isi file `SETUP_INVENTORY_DIRECT.sql` ke Supabase SQL Editor dan run.

### 2. Akses Menu

Setelah login, akses menu melalui URL:
- `http://localhost:5173/master/jenis-barang`
- `http://localhost:5173/master/kategori-barang`
- `http://localhost:5173/master/sub-kategori-barang`

## 📱 Cara Menggunakan

### Menu Jenis Barang

**Fungsi**: Mengelola jenis persediaan (ada stock/tidak, FIFO/tidak, dll)

**Fitur**:
- ✅ List semua jenis barang
- ✅ Search berdasarkan kode/nama
- ✅ Tambah jenis barang baru
- ✅ Edit jenis barang existing
- ✅ Hapus jenis barang
- ✅ Toggle status aktif/non-aktif

**Field**:
- `Kode` - Kode unik jenis barang (contoh: STOCK, NON_STOCK)
- `Nama` - Nama jenis barang
- `Deskripsi` - Deskripsi detail
- `Ada Stock` - Toggle untuk menandai apakah ada persediaan
- `FIFO` - Toggle untuk menggunakan metode FIFO
- `Status Aktif` - Toggle status aktif

**Contoh Data**:
```
Kode: STOCK
Nama: Barang dengan Stock
Ada Stock: Ya
FIFO: Ya
Deskripsi: Barang fisik yang memiliki persediaan dan menggunakan metode FIFO
```

### Menu Kategori Barang

**Fungsi**: Mengelola kategori barang (Bahan Baku, Sparepart, Aset, dll)

**Fitur**:
- ✅ List semua kategori barang
- ✅ Search berdasarkan kode/nama
- ✅ Filter berdasarkan jenis barang (otomatis dari dropdown)
- ✅ Tambah kategori baru
- ✅ Edit kategori existing
- ✅ Hapus kategori
- ✅ Toggle status aktif/non-aktif

**Field**:
- `Kode` - Kode unik kategori (contoh: RAW_MATERIAL, SPARE_PART)
- `Nama` - Nama kategori
- `Jenis Barang` - Dropdown pilih jenis barang (dari master jenis barang)
- `Deskripsi` - Deskripsi detail
- `Punya Sub-Kategori` - Toggle untuk menandai apakah ada sub-kategori
- `Status Aktif` - Toggle status aktif

**Contoh Data**:
```
Kode: RAW_MATERIAL
Nama: Bahan Baku
Jenis Barang: Barang dengan Stock
Punya Sub-Kategori: Ya
Deskripsi: Bahan mentah yang digunakan untuk produksi
```

### Menu Sub-Kategori Barang

**Fungsi**: Mengelola sub-kategori barang (Kertas, Plastik, Mekanik, Elektrik, dll)

**Fitur**:
- ✅ List semua sub-kategori barang
- ✅ Search berdasarkan kode/nama
- ✅ Filter berdasarkan kategori barang (dropdown)
- ✅ Tambah sub-kategori baru
- ✅ Edit sub-kategori existing
- ✅ Hapus sub-kategori
- ✅ Toggle status aktif/non-aktif

**Field**:
- `Kode` - Kode unik sub-kategori (contoh: RAW_PAPER, SP_MECHANICAL)
- `Nama` - Nama sub-kategori
- `Kategori Barang` - Dropdown pilih kategori (dari master kategori barang)
- `Deskripsi` - Deskripsi detail
- `Status Aktif` - Toggle status aktif

**Contoh Data**:
```
Kode: RAW_PAPER
Nama: Kertas
Kategori Barang: Bahan Baku
Deskripsi: Bahan baku jenis kertas
```

## 🎨 Screenshots

### Menu Jenis Barang
```
┌─────────────────────────────────────────────────────────┐
│ Master Jenis Barang                                     │
│ Kelola jenis persediaan (Stock, Non-Stock, Jasa, dll)   │
├─────────────────────────────────────────────────────────┤
│ [Search] [Cari jenis barang...]    [+ Tambah Jenis]     │
├──────┬──────────────┬─────────┬──────┬─────────────────┤
│ Kode │ Nama         │ Stock   │ FIFO │ Status    │ Aksi│
├──────┼──────────────┼─────────┼──────┼───────────┼─────┤
│STOCK │Barang dg     │ ✓ Ya    │ ✓ Ya │ [Aktif]   │✏️ 🗑️│
│      │Stock         │         │      │           │     │
├──────┼──────────────┼─────────┼──────┼───────────┼─────┤
│NON_  │Barang Non-   │   Tidak │ Tidak│ [Aktif]   │✏️ 🗑️│
│STOCK │Stock         │         │      │           │     │
└──────┴──────────────┴─────────┴──────┴───────────┴─────┘
```

### Menu Kategori Barang
```
┌─────────────────────────────────────────────────────────┐
│ Master Kategori Barang                                  │
│ Kelola kategori (Bahan Baku, Sparepart, Aset, dll)     │
├─────────────────────────────────────────────────────────┤
│ [Search] [Cari...]    [+ Tambah Kategori]               │
├──────────┬──────────────┬──────────────┬────────────────┤
│ Kode     │ Nama         │ Jenis Barang │ Sub    │ Aksi  │
├──────────┼──────────────┼──────────────┼────────┼───────┤
│RAW_      │Bahan Baku    │Barang dg     │ ✓ Ya   │✏️ 🗑️ │
│MATERIAL  │              │Stock         │        │       │
├──────────┼──────────────┼──────────────┼────────┼───────┤
│SPARE_    │Sparepart     │Barang dg     │ ✓ Ya   │✏️ 🗑️ │
│PART      │              │Stock         │        │       │
└──────────┴──────────────┴──────────────┴────────┴───────┘
```

### Menu Sub-Kategori Barang
```
┌─────────────────────────────────────────────────────────┐
│ Master Sub-Kategori Barang                              │
│ Kelola sub-kategori (Kertas, Plastik, Mekanik, dll)    │
├─────────────────────────────────────────────────────────┤
│ [Search] [Cari...] [Filter: Bahan Baku ▼] [+ Tambah]   │
├──────────┬──────────────┬──────────────┬────────────────┤
│ Kode     │ Nama         │ Kategori     │ Status  │ Aksi │
├──────────┼──────────────┼──────────────┼─────────┼──────┤
│RAW_PAPER │Kertas        │Bahan Baku    │[Aktif]  │✏️ 🗑️│
├──────────┼──────────────┼──────────────┼─────────┼──────┤
│RAW_      │Plastik       │Bahan Baku    │[Aktif]  │✏️ 🗑️│
│PLASTIC   │              │              │         │      │
└──────────┴──────────────┴──────────────┴─────────┴──────┘
```

## 🔧 Technical Details

### Database Structure

Semua data disimpan di tabel `kv_store_6a7942bb` dengan key pattern:
- Jenis Barang: `inventory_type:{id}`
- Kategori Barang: `item_type:{id}`
- Sub-Kategori: `item_subtype:{id}`

### Index Management

Setiap entity punya index untuk tracking:
- Main index: `{entity}:index` - berisi array semua IDs
- Relational index: `item_subtype:by_item_type:{item_type_id}` - untuk filtering

### Data Flow

1. **Create**: Generate ID → Insert record → Update index
2. **Update**: Update record (no index change)
3. **Delete**: Delete record → Update index (remove ID)

## 🐛 Troubleshooting

### Error: "Gagal memuat data"
**Solusi**: 
1. Cek koneksi Supabase
2. Pastikan tabel `kv_store_6a7942bb` ada
3. Pastikan master data sudah diinstall

### Error: "Gagal menyimpan data"
**Solusi**:
1. Cek semua field required sudah diisi
2. Cek koneksi database
3. Lihat console browser untuk error detail

### Data tidak muncul di dropdown
**Solusi**:
1. Pastikan parent data sudah ada (misal: Jenis Barang harus ada sebelum buat Kategori)
2. Cek status `is_active` di parent data
3. Refresh halaman

### Search tidak bekerja
**Solusi**:
- Search case-insensitive dan real-time
- Cari di field `name` dan `code`
- Pastikan ketik minimal 1 karakter

## 📝 Best Practices

1. **Penamaan Kode**: Gunakan UPPERCASE dengan underscore (contoh: RAW_MATERIAL, SPARE_PART)
2. **Hierarki Data**: Buat dari atas ke bawah (Jenis → Kategori → Sub-Kategori)
3. **Status Aktif**: Jangan hapus data, cukup set `is_active = false`
4. **Deskripsi**: Isi deskripsi yang jelas untuk memudahkan pemahaman
5. **Konsistensi**: Gunakan naming convention yang konsisten

## 🎯 Workflow Rekomendasi

### Setup Baru
1. Install master data dari `SETUP_INVENTORY_DIRECT.sql`
2. Review data di Menu Jenis Barang (sudah terisi otomatis)
3. Review data di Menu Kategori Barang (sudah terisi otomatis)
4. Review data di Menu Sub-Kategori Barang (sudah terisi otomatis)
5. Tambah/edit sesuai kebutuhan

### Tambah Kategori Baru
1. Buka Menu Kategori Barang
2. Klik "Tambah Kategori Barang"
3. Isi form:
   - Kode (unik, UPPERCASE)
   - Nama (deskriptif)
   - Pilih Jenis Barang (dari dropdown)
   - Deskripsi
   - Toggle "Punya Sub-Kategori" jika perlu
4. Klik "Simpan"
5. Jika punya sub-kategori, lanjut ke Menu Sub-Kategori

### Tambah Sub-Kategori Baru
1. Pastikan Kategori Barang sudah ada
2. Buka Menu Sub-Kategori Barang
3. Klik "Tambah Sub-Kategori"
4. Isi form:
   - Kode (unik, UPPERCASE)
   - Nama (deskriptif)
   - Pilih Kategori Barang (dari dropdown)
   - Deskripsi
5. Klik "Simpan"

## 🔗 Related Documentation

- [INVENTORY_SCHEMA_DOCUMENTATION.md](./INVENTORY_SCHEMA_DOCUMENTATION.md) - Schema lengkap
- [INVENTORY_QUICK_GUIDE.md](./INVENTORY_QUICK_GUIDE.md) - Query & SQL guide
- [SETUP_INVENTORY_DIRECT.sql](./SETUP_INVENTORY_DIRECT.sql) - Setup script
- [inventory-helpers.ts](./inventory-helpers.ts) - TypeScript helpers

## 🎓 Next Steps

Setelah setup master data, lanjut ke:
1. **Master Items/Barang** - Buat master barang dengan kategori yang sudah dibuat
2. **Gudang** - Setup warehouse/gudang
3. **Stock Operations** - Mulai transaksi penerimaan/pengeluaran barang

---

**Version**: 1.0.0  
**Last Updated**: 2026-04-23  
**Author**: Development Team
