# 🚨 START HERE - Fix "Failed to fetch" Error

## Anda Melihat Error Ini?
```
⚠️ Supabase Connection Warning: TypeError: Failed to fetch
```

## ✅ Solusi (Ikuti Step by Step):

---

### Step 1: Login ke Supabase
🔗 **https://supabase.com**

- Login dengan akun Anda
- Pilih project: **xbzxxzwisotukyvwpqql**

---

### Step 2: Pastikan Project Aktif

Di dashboard, check status project:
- ✅ Status harus: **Active** (hijau)
- ❌ Jika **Paused**: Klik tombol **Resume** atau **Restore**

---

### Step 3: Buka SQL Editor

Di sidebar sebelah kiri:
1. Klik **SQL Editor**
2. Klik tombol **+ New query**

---

### Step 4: Jalankan Query Setup

Copy-paste query ini ke SQL Editor:

```sql
-- COPY MULAI DARI SINI --

-- 1. Buat table
CREATE TABLE IF NOT EXISTS kv_store_6a7942bb (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Disable RLS untuk testing (temporary)
ALTER TABLE kv_store_6a7942bb DISABLE ROW LEVEL SECURITY;

-- 3. Test insert
INSERT INTO kv_store_6a7942bb (key, value)
VALUES ('test:setup', '{"status": "success", "message": "Database ready!"}');

-- 4. Verify
SELECT * FROM kv_store_6a7942bb WHERE key = 'test:setup';

-- COPY SAMPAI SINI --
```

**Klik tombol RUN** atau tekan `Ctrl + Enter`

---

### Step 5: Verifikasi Hasil

Setelah query berhasil, Anda akan melihat:
```
✅ Success. No rows returned
```
atau
```
✅ Success. Rows: 1
```

Jika ada **error merah**, baca pesan errornya:
- "already exists" → **Baik**, table sudah dibuat sebelumnya
- Error lain → Lihat `FIX_SUPABASE_ERROR.md` untuk troubleshooting

---

### Step 6: Reload Aplikasi

Kembali ke aplikasi → **Refresh browser** (F5 atau Ctrl+R)

---

## ✅ Berhasil Jika:

1. **Console (F12)** menampilkan:
   ```
   ✅ Supabase Connected
   ```

2. **Aplikasi load normal** (tidak stuck di loading spinner)

3. **Kunjungi `/system-status`** → Semua test PASS

---

## ❌ Masih Error?

### Troubleshooting Cepat:

#### 1. Check Table di Supabase
Dashboard → **Table Editor** → Cari table `kv_store_6a7942bb`
- ✅ Jika ada: Bagus!
- ❌ Jika tidak ada: Ulangi Step 4

#### 2. Check RLS Policies
Table Editor → `kv_store_6a7942bb` → **RLS** tab
- Pastikan RLS = **DISABLED** (untuk testing)
- Atau pastikan ada policies yang allow public access

#### 3. Check Console Errors
F12 → Console tab → Lihat error detail
- Copy error message
- Lihat file `FIX_SUPABASE_ERROR.md` untuk solusi

#### 4. Test Manual Query
Console (F12) → Paste command ini:
```javascript
window.__SUPABASE_CLIENT__
  .from('kv_store_6a7942bb')
  .select('*')
  .limit(1)
  .then(result => console.log('Test Result:', result));
```

Expected result:
```javascript
{ data: [...], error: null }
```

---

## 📚 Dokumentasi Lengkap:

- **QUICK_FIX.md** - Solusi ringkas 2 menit
- **FIX_SUPABASE_ERROR.md** - Troubleshooting detail
- **SETUP_SUPABASE.sql** - Setup production-ready lengkap
- **PRODUCTION_READY.md** - Panduan production deployment

---

## 🆘 Need Help?

Jika sudah coba semua step tapi masih error:

1. **Screenshot** pesan error lengkap (dari Console)
2. **Screenshot** Supabase project status
3. **Screenshot** table `kv_store_6a7942bb` di Table Editor
4. Share untuk troubleshooting lebih lanjut

---

## 💡 Tips:

- Error ini **normal** untuk first-time setup
- Aplikasi **tetap berfungsi** tanpa database (UI only)
- Setelah database setup, **semua fitur akan aktif**
- RLS disabled hanya untuk **testing**, enable kembali untuk **production**

---

**🎯 Goal**: Lihat `✅ Supabase Connected` di Console → Setup berhasil!
