# 🔧 Fix Supabase Connection Error

## Error yang Muncul:
```
⚠️ Supabase Connection Warning: TypeError: Failed to fetch
```

## 🎯 Penyebab Error:

Error ini terjadi karena salah satu dari:

1. **Table belum dibuat** di Supabase database
2. **RLS (Row Level Security)** memblokir akses
3. **Supabase project** sedang paused/tidak aktif
4. **Network/CORS** issue

## ✅ Solusi Lengkap (Step by Step):

### Step 1: Verifikasi Supabase Project Aktif

1. Login ke https://supabase.com
2. Buka project: `xbzxxzwisotukyvwpqql`
3. Pastikan status project adalah **Active** (tidak paused)
4. Jika paused, klik **Resume** atau **Restore**

### Step 2: Buat Table di Supabase

1. Di Supabase Dashboard, klik **SQL Editor** di sidebar kiri
2. Klik **New query**
3. Copy-paste semua isi file `SETUP_SUPABASE.sql`
4. Klik **Run** atau tekan `Ctrl + Enter`
5. Tunggu hingga muncul pesan "Success"

### Step 3: Verifikasi Table Berhasil Dibuat

Jalankan query ini di SQL Editor:

```sql
SELECT * FROM kv_store_6a7942bb LIMIT 5;
```

Jika muncul table (walaupun kosong), berarti berhasil!

### Step 4: Test Connection dari Aplikasi

1. Reload aplikasi di browser
2. Tekan `F12` untuk buka Console
3. Lihat log:
   - ✅ **Success**: `✅ Supabase Connected`
   - ❌ **Still error**: Lanjut ke Step 5

### Step 5: Jika Masih Error - Check RLS Policies

Jalankan query ini untuk disable RLS temporarily (testing only!):

```sql
ALTER TABLE kv_store_6a7942bb DISABLE ROW LEVEL SECURITY;
```

**⚠️ PENTING**: Jangan lupa enable kembali setelah testing:
```sql
ALTER TABLE kv_store_6a7942bb ENABLE ROW LEVEL SECURITY;
```

### Step 6: Verifikasi Credentials

File: `utils/supabase/info.tsx`

Pastikan isi file ini match dengan Supabase project:

```typescript
export const projectId = "xbzxxzwisotukyvwpqql"
export const publicAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

Cross-check dengan:
- Supabase Dashboard → Settings → API
- Project URL harus: `https://xbzxxzwisotukyvwpqql.supabase.co`
- anon/public key harus sama

### Step 7: Check CORS (Jika di Production)

Jika error masih muncul di published site:

1. Supabase Dashboard → Settings → API
2. Scroll ke **CORS**
3. Pastikan allowed origins include:
   - `https://*.figma.com` (untuk Figma Make)
   - `*` (untuk allow all - testing only)

## 🧪 Quick Test Commands

Buka Console (F12) dan jalankan:

```javascript
// Test 1: Check connection status
console.log('Connected:', window.__SUPABASE_CONNECTED__);
console.log('Error:', window.__SUPABASE_ERROR__);

// Test 2: Test direct query
window.__SUPABASE_CLIENT__
  .from('kv_store_6a7942bb')
  .select('*')
  .limit(1)
  .then(result => console.log('Query Result:', result));

// Test 3: Test insert
window.__SUPABASE_CLIENT__
  .from('kv_store_6a7942bb')
  .insert({ key: 'test:manual', value: { test: true } })
  .then(result => console.log('Insert Result:', result));
```

## 📊 Expected Results

### ✅ Sukses:
```javascript
Connected: true
Error: null
Query Result: { data: [...], error: null }
```

### ❌ Masih Error:

#### Error: "relation does not exist"
→ Table belum dibuat, jalankan `SETUP_SUPABASE.sql`

#### Error: "permission denied"
→ RLS blocking, check policies atau disable RLS temporary

#### Error: "Failed to fetch" / "Network error"
→ Supabase project paused, CORS issue, atau network problem

## 🔍 Advanced Troubleshooting

### Check Supabase Logs:
1. Dashboard → Logs → Postgres Logs
2. Lihat error messages untuk detail

### Check Network Tab:
1. F12 → Network tab
2. Filter: XHR/Fetch
3. Cari request ke `xbzxxzwisotukyvwpqql.supabase.co`
4. Check status code:
   - 200 = OK
   - 401 = Auth error
   - 403 = Permission denied
   - 404 = Table not found
   - 500 = Server error

### Enable Verbose Logging:

Tambahkan di Console:
```javascript
localStorage.setItem('supabase.debug', 'true');
```
Reload page untuk lihat detailed logs.

## 💡 Tips

1. **Gunakan `/system-status`** page untuk cek semua system health
2. **Check Supabase status**: https://status.supabase.com
3. **Join Supabase Discord** untuk bantuan: https://discord.supabase.com

## ✅ Checklist Sebelum Production

- [ ] Table `kv_store_6a7942bb` sudah dibuat
- [ ] RLS policies sudah di-setup
- [ ] Connection test berhasil (green check di console)
- [ ] CRUD operations berfungsi (create, read, update, delete)
- [ ] `/system-status` page shows all tests passed
- [ ] No errors di Console (F12)

## 🆘 Masih Belum Bisa?

Jika sudah coba semua step di atas tapi masih error:

1. Screenshot error message lengkap (dari Console)
2. Screenshot Supabase project status
3. Screenshot hasil query `SELECT * FROM kv_store_6a7942bb`
4. Share untuk troubleshooting lebih lanjut

---

**Note**: Error ini NON-BLOCKING. Aplikasi tetap akan load dan berfungsi, hanya database features yang tidak available sampai connection berhasil.
