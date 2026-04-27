# 🔒 FIX: Row Level Security Error di Supabase

## ❌ Error Message
```
new row violates row-level security policy for table "kv_store_6a7942bb"
```

## 🎯 Penyebab
Tabel `kv_store_6a7942bb` memiliki Row Level Security (RLS) yang aktif, tetapi tidak ada policy yang mengizinkan operasi INSERT, UPDATE, dan DELETE untuk anonymous users.

## ✅ SOLUSI 1: Tambahkan RLS Policy (RECOMMENDED)

### Langkah-langkah:

1. **Buka Supabase Dashboard**
   - Login ke https://supabase.com
   - Pilih project: `ejowxcykyvbenowcsayv`

2. **Buka SQL Editor**
   - Klik menu "SQL Editor" di sidebar kiri
   - Klik "New query"

3. **Copy-paste SQL berikut dan EXECUTE:**

```sql
-- Hapus policy lama jika ada
DROP POLICY IF EXISTS "Allow all operations for anonymous users" ON kv_store_6a7942bb;

-- Buat policy baru yang mengizinkan semua operasi
CREATE POLICY "Allow all operations for anonymous users"
ON kv_store_6a7942bb
FOR ALL
TO anon
USING (true)
WITH CHECK (true);

-- Pastikan RLS tetap aktif
ALTER TABLE kv_store_6a7942bb ENABLE ROW LEVEL SECURITY;
```

4. **Klik tombol "RUN"** atau tekan `Ctrl + Enter`

5. **Refresh aplikasi ERP** dan coba tambah data lagi

---

## ✅ SOLUSI 2: Disable RLS (Kurang Aman, untuk Development Only)

⚠️ **WARNING**: Hanya gunakan untuk development! Jangan gunakan di production!

```sql
-- Disable RLS untuk development
ALTER TABLE kv_store_6a7942bb DISABLE ROW LEVEL SECURITY;
```

---

## ✅ SOLUSI 3: Buat Tabel Baru dengan Policy yang Benar

Jika tabel `kv_store_6a7942bb` tidak bisa dimodifikasi, buat tabel baru:

```sql
-- Buat tabel baru
CREATE TABLE IF NOT EXISTS kv_store_erp_v2 (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE kv_store_erp_v2 ENABLE ROW LEVEL SECURITY;

-- Buat policy yang mengizinkan semua operasi
CREATE POLICY "Allow all operations"
ON kv_store_erp_v2
FOR ALL
TO anon, authenticated
USING (true)
WITH CHECK (true);

-- Buat index untuk performa
CREATE INDEX IF NOT EXISTS idx_kv_store_erp_v2_key ON kv_store_erp_v2(key);
CREATE INDEX IF NOT EXISTS idx_kv_store_erp_v2_key_pattern ON kv_store_erp_v2(key text_pattern_ops);

-- Copy data dari tabel lama (jika ada)
INSERT INTO kv_store_erp_v2 (key, value)
SELECT key, value FROM kv_store_6a7942bb
ON CONFLICT (key) DO NOTHING;
```

Setelah menjalankan SQL di atas, update nama tabel di kode aplikasi dari `kv_store_6a7942bb` ke `kv_store_erp_v2`.

---

## 🔍 Cara Mengecek Policy Sudah Benar

Jalankan query ini untuk melihat policy yang aktif:

```sql
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'kv_store_6a7942bb';
```

Anda harus melihat policy dengan:
- **roles**: `{anon}` atau `{anon, authenticated}`
- **cmd**: `ALL`
- **qual**: `true`
- **with_check**: `true`

---

## 🚀 Setelah Fix

1. Refresh aplikasi ERP
2. Data default akan otomatis dibuat:
   - ✅ Employees (6 sample data)
   - ✅ Companies (2 sample data)
   - ✅ Departments (5 sample data)
   - ✅ Positions (5 sample data)
   - ✅ Lead Sources (7 sample data)
3. Anda bisa mulai menambah customer, pipeline, dll.

---

## 💡 Penjelasan RLS

**Row Level Security (RLS)** adalah fitur keamanan Supabase/PostgreSQL yang membatasi akses ke baris data berdasarkan kondisi tertentu.

- **Policy**: Aturan yang menentukan siapa bisa akses data
- **anon**: Role untuk user yang tidak login (menggunakan anon key)
- **authenticated**: Role untuk user yang sudah login
- **USING (true)**: Kondisi untuk SELECT (selalu true = bisa baca semua)
- **WITH CHECK (true)**: Kondisi untuk INSERT/UPDATE/DELETE (selalu true = bisa tulis semua)

---

## 📞 Butuh Bantuan?

Jika masih error setelah menjalankan SQL di atas, cek:
1. Apakah SQL berhasil dijalankan tanpa error?
2. Apakah tabel `kv_store_6a7942bb` sudah ada di database?
3. Cek console browser untuk error message terbaru
