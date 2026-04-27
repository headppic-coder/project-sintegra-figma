# Cara Menjalankan Migration ke Supabase

## Langkah-langkah

### 1. Buka Supabase Dashboard
- Login ke https://supabase.com
- Pilih project Anda

### 2. Buka SQL Editor
- Di sidebar kiri, klik **SQL Editor**
- Klik **New Query**

### 3. Copy File Migration
- Buka file `APPLY_MIGRATIONS.sql` di folder `supabase/`
- Copy semua isi file tersebut (Ctrl+A, Ctrl+C)

### 4. Paste dan Run
- Paste ke SQL Editor di Supabase
- Klik **Run** atau tekan Ctrl+Enter

### 5. Tunggu Sampai Selesai
- Query akan memakan waktu beberapa detik
- Tunggu sampai muncul pesan "Success"

### 6. Refresh Database Schema
- Kembali ke halaman **Database Schema** atau **Table Editor**
- Klik tombol **Refresh** atau reload halaman
- Sekarang tabel `quotations` dan `quotation_items` sudah memiliki field-field baru

## Verifikasi

Setelah menjalankan migration, pastikan:

### Tabel `sales.quotations` memiliki field:
- ✓ quotation_number
- ✓ customer_id
- ✓ quotation_date
- ✓ valid_until
- ✓ **sales_person** (NEW)
- ✓ **catatan** (NEW)
- ✓ **job_type** (NEW)
- ✓ **npwp** (NEW)
- ✓ **dp_percentage** (NEW)
- ✓ **pembayaran** (NEW)
- ✓ **ppn_type** (NEW)
- ✓ **mode_alamat** (NEW)
- ✓ **alamat_manual** (NEW)
- ✓ **jenis_order** (NEW)
- ✓ **biaya_lain** (NEW)

### Tabel `sales.quotation_items` memiliki field:
- ✓ id
- ✓ quotation_id
- ✓ item_number
- ✓ **nama_item** (NEW)
- ✓ **deskripsi** (NEW)
- ✓ **qty** (NEW)
- ✓ **satuan** (NEW)
- ✓ **harga_satuan** (NEW)
- ✓ **diskon** (NEW)
- ✓ **total_harga** (NEW)

### Tabel `sales.customers` memiliki field:
- ✓ **accurate_id** (NEW)

### Function & Trigger
- ✓ Function `sales.generate_quotation_number()` sudah dibuat
- ✓ Trigger auto-generate quotation number aktif

## Test Data (Opsional)

Jika ingin test insert data quotation, jalankan query berikut:

```sql
-- Insert test quotation
INSERT INTO sales.quotations (
  customer_id,
  quotation_date,
  valid_until,
  sales_person,
  catatan,
  job_type,
  ppn_type,
  jenis_order,
  status
) VALUES (
  (SELECT id FROM sales.customers LIMIT 1),
  CURRENT_DATE,
  CURRENT_DATE + INTERVAL '30 days',
  'Test Sales Person',
  'Test catatan penawaran',
  'Order',
  'Inc',
  'Offset',
  'Draft'
);

-- Cek hasilnya
SELECT * FROM sales.quotations ORDER BY created_at DESC LIMIT 1;
```

Quotation number akan otomatis di-generate dengan format: `SQ.2026.04.00001`

## Troubleshooting

### Error: "relation does not exist"
- Pastikan tabel `sales.quotations` dan `sales.quotation_items` sudah ada
- Cek apakah migration sebelumnya (`20260413000003_create_sales_tables.sql`) sudah dijalankan

### Error: "permission denied"
- Pastikan Anda login sebagai database owner atau service_role
- Coba gunakan SQL Editor dengan service_role key

### Field tidak muncul setelah migration
- Hard refresh browser (Ctrl+F5)
- Clear cache browser
- Logout dan login kembali ke Supabase

### Quotation number tidak auto-generate
- Cek apakah trigger sudah aktif dengan query:
```sql
SELECT * FROM pg_trigger WHERE tgname = 'trigger_generate_quotation_number';
```

## Support

Jika masih ada masalah, hubungi tim development atau cek dokumentasi di `DATABASE_SCHEMA.md`.
