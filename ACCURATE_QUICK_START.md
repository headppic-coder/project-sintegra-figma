# Quick Start: Integrasi Accurate Online

## ✅ Credentials Sudah Siap!

Anda sudah memiliki:
- ✅ API Token
- ✅ Signature Secret
- ✅ Database ID: 717557

## 🚀 Langkah Setup (5 Menit)

### 1. Copy Environment Variables

```bash
# File .env.accurate sudah dibuat dengan credentials Anda
# Copy ke .env.local:
cp .env.accurate .env.local
```

Atau tambahkan manual ke `.env.local`:
```env
VITE_ACCURATE_API_TOKEN=aat.NTA.eyJ2Ijo...
VITE_ACCURATE_SIGNATURE_SECRET=0CcWutA9rEbx...
VITE_ACCURATE_API_BASE_URL=https://public-api.accurate.id/api
VITE_ACCURATE_DATABASE_ID=717557
```

### 2. Install Dependencies

```bash
pnpm install axios crypto-js
pnpm install -D @types/crypto-js
```

### 3. Test Connection

Buka aplikasi → **System → Integrasi Accurate**

Atau langsung ke: `http://localhost:5173/system/accurate-integration`

Klik tombol **"Test Connection"**

✅ Jika berhasil akan muncul: "Koneksi Berhasil"

## 🎯 Cara Pakai

### Test Connection (Wajib Pertama Kali)

1. Buka **System → Integrasi Accurate**
2. Klik **"Test Connection"**
3. Tunggu sampai muncul status koneksi

### Sync Customer ke Accurate

**Opsi 1: Sync Semua**
1. Buka **System → Integrasi Accurate**
2. Klik **"Sync All Customers"**
3. Tunggu proses selesai

**Opsi 2: Sync Per Customer** (Coming Soon)
- Di halaman Customer List
- Klik tombol "Sync to Accurate" per customer

### Import Customer dari Accurate

1. Buka **System → Integrasi Accurate**
2. Klik **"Import Customers"**
3. Customer baru dari Accurate akan masuk ke ERP

## 📝 Yang Sudah Dibuat

### Files Created:

1. ✅ `.env.accurate` - Credentials Anda
2. ✅ `src/services/accurate-api.ts` - API Client
3. ✅ `src/services/accurate-sync.ts` - Sync Service
4. ✅ `src/app/pages/system/accurate-integration.tsx` - UI Page
5. ✅ `docs/ACCURATE_INTEGRATION.md` - Full Documentation
6. ✅ `.gitignore` - Protect credentials

### Features Ready:

- ✅ Test Connection
- ✅ Sync All Customers (Push to Accurate)
- ✅ Import Customers (Pull from Accurate)
- ⏳ Sync Sales Orders (Coming Soon)
- ⏳ Sync Items/Products (Coming Soon)

## 🔍 Troubleshooting

### Tidak bisa Test Connection?

**Cek**:
1. File `.env.local` sudah ada?
2. Token sudah benar di `.env.local`?
3. Restart dev server: `pnpm dev`

### Error "Module not found: crypto-js"?

**Fix**:
```bash
pnpm install crypto-js @types/crypto-js
```

### Token Expired?

**Generate token baru**:
1. Login ke Accurate Online
2. Settings → API
3. Generate new token
4. Copy ke `.env.local`

## 📚 Dokumentasi Lengkap

Lihat: `docs/ACCURATE_INTEGRATION.md`

## 🎯 Next Steps

**Setelah Test Connection Berhasil**:

1. ✅ Sync 1-2 customer dulu (test)
2. ✅ Cek di Accurate Online apakah customer masuk
3. ✅ Jika OK, sync semua customer
4. 🔄 Implementasi sync untuk Sales Order
5. 🔄 Implementasi sync untuk Items/Products

## ⚠️ Important

- ❌ **JANGAN commit** `.env.accurate` atau `.env.local` ke Git
- ✅ File sudah di `.gitignore`
- ✅ Token harus dijaga kerahasiaannya
- ✅ Backup data sebelum sync pertama kali

---

**Pertanyaan?** Lihat dokumentasi lengkap di `docs/ACCURATE_INTEGRATION.md`
