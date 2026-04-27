# Fix untuk Masalah Delete Data

## Diagnosa

Jika Anda tidak dapat menghapus data, kemungkinan besar penyebabnya adalah **RLS (Row Level Security)** di Supabase yang memblokir operasi DELETE.

## Cara Mengecek Masalah

1. Buka **Browser Console** (tekan F12)
2. Coba hapus data
3. Lihat pesan error di console:
   - Jika muncul `🚫 PERMISSION DENIED: RLS is blocking DELETE` → Ikuti solusi di bawah
   - Jika muncul error lain → Screenshot dan tanyakan

## Solusi 1: Disable RLS (Recommended untuk Development)

Jalankan SQL berikut di Supabase SQL Editor:

```sql
-- Disable RLS untuk table kv_store
ALTER TABLE kv_store_6a7942bb DISABLE ROW LEVEL SECURITY;
```

## Solusi 2: Tambah RLS Policy untuk DELETE (Recommended untuk Production)

Jika Anda ingin tetap menggunakan RLS, tambahkan policy DELETE:

```sql
-- Buat policy untuk allow DELETE
CREATE POLICY "Allow DELETE for authenticated users"
ON kv_store_6a7942bb
FOR DELETE
TO authenticated
USING (true);

-- ATAU untuk allow semua user (termasuk anonymous)
CREATE POLICY "Allow DELETE for all users"
ON kv_store_6a7942bb
FOR DELETE
TO anon, authenticated
USING (true);
```

## Solusi 3: Check Existing Policies

Lihat policy yang ada di table:

```sql
-- Lihat semua policies di table
SELECT * FROM pg_policies WHERE tablename = 'kv_store_6a7942bb';
```

## Cara Menjalankan SQL di Supabase

1. Buka Supabase Dashboard: https://supabase.com/dashboard
2. Pilih project Anda
3. Klik **SQL Editor** di sidebar kiri
4. Paste SQL command di atas
5. Klik **Run** atau tekan `Ctrl+Enter`

## Test Delete Setelah Fix

Setelah menjalankan SQL di atas:

1. Refresh halaman aplikasi (F5)
2. Coba hapus data lagi
3. Check browser console untuk konfirmasi:
   - `✅ Delete successful` → Berhasil!
   - Masih error → Screenshot console dan tanyakan

## Notes

- **RLS** adalah security feature di Supabase yang mengontrol siapa yang bisa read/write/delete data
- Untuk development, biasanya lebih mudah disable RLS
- Untuk production, sebaiknya gunakan RLS dengan policies yang proper
