# ⚡ Quick Fix - Supabase Connection Error

## TL;DR

Error `Failed to fetch` terjadi karena **table belum dibuat** di Supabase.

## 🚀 Fix dalam 2 Menit:

### 1. Login ke Supabase
https://supabase.com → Project: `xbzxxzwisotukyvwpqql`

### 2. Buka SQL Editor
Dashboard → **SQL Editor** (sidebar kiri) → **New query**

### 3. Jalankan Query Ini:

```sql
-- Copy-paste dan Run (Ctrl+Enter)
CREATE TABLE IF NOT EXISTS kv_store_6a7942bb (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL
);

ALTER TABLE kv_store_6a7942bb ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public access" ON kv_store_6a7942bb
  FOR ALL USING (true) WITH CHECK (true);
```

### 4. Reload Aplikasi

Refresh browser → Error hilang ✅

---

## Jika Masih Error:

**Disable RLS temporary** (testing only):

```sql
ALTER TABLE kv_store_6a7942bb DISABLE ROW LEVEL SECURITY;
```

Reload aplikasi → Seharusnya sudah bisa.

**Jangan lupa enable kembali setelah testing!**

---

## Verifikasi Berhasil:

1. Console (F12) harus muncul: `✅ Supabase Connected`
2. Atau kunjungi: `/system-status` → Semua test PASS
3. Aplikasi load normal tanpa loading spinner forever

---

**Untuk setup lengkap & production-ready**, lihat file `SETUP_SUPABASE.sql` dan jalankan semua query di dalamnya.
