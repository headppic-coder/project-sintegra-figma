# 🗄️ Database Setup Required

## ⚠️ Muncul Error "Failed to fetch"?

Aplikasi ini menggunakan Supabase sebagai database. Sebelum aplikasi bisa berfungsi penuh, Anda perlu **setup database table** terlebih dahulu.

## ⚡ Quick Start (2 Menit):

### 1️⃣ Buka Supabase Dashboard
👉 https://supabase.com

Login → Project: **xbzxxzwisotukyvwpqql**

### 2️⃣ Buka SQL Editor
Sidebar → **SQL Editor** → **New query**

### 3️⃣ Copy-Paste & Run:

```sql
CREATE TABLE IF NOT EXISTS kv_store_6a7942bb (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL
);

ALTER TABLE kv_store_6a7942bb DISABLE ROW LEVEL SECURITY;
```

Klik **RUN** atau tekan `Ctrl + Enter`

### 4️⃣ Reload Aplikasi
Refresh browser → ✅ Done!

---

## 📚 File Penting:

| File | Keterangan |
|------|------------|
| `QUICK_FIX.md` | Solusi cepat 2 menit |
| `SETUP_SUPABASE.sql` | Setup lengkap production-ready |
| `FIX_SUPABASE_ERROR.md` | Troubleshooting detail |
| `PRODUCTION_READY.md` | Panduan production deployment |
| `TEST_PRODUCTION.md` | Cara test aplikasi di production |

---

## 🎯 Verifikasi Setup Berhasil:

1. **Console (F12)**: Muncul `✅ Supabase Connected`
2. **Test Page**: Kunjungi `/system-status` → All tests PASS
3. **Aplikasi**: Load normal, tidak stuck di loading spinner

---

## 💡 Quick Commands (Console F12):

```javascript
// Check connection
console.log(window.__SUPABASE_CONNECTED__);

// Test query
window.__SUPABASE_CLIENT__
  .from('kv_store_6a7942bb')
  .select('*')
  .limit(1)
  .then(r => console.log(r));
```

---

## 🆘 Masih Error?

1. Pastikan Supabase project **tidak paused**
2. Pastikan table sudah dibuat (cek di Table Editor)
3. Lihat `FIX_SUPABASE_ERROR.md` untuk troubleshooting lengkap
4. Check https://status.supabase.com untuk downtime

---

**Note**: Error ini normal untuk first-time setup. Setelah table dibuat, aplikasi akan berfungsi 100% normal.
