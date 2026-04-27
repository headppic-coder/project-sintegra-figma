# Setup Integrasi Accurate Online

## ⚠️ Dependencies Required

Halaman Accurate Integration sudah dibuat, tapi memerlukan dependencies tambahan.

## 🚀 Langkah Install (5 Menit)

### Step 1: Install Dependencies

```bash
# Install axios dan crypto-js
pnpm install axios crypto-js

# Install type definitions
pnpm install -D @types/crypto-js
```

### Step 2: Setup Environment Variables

```bash
# Copy credentials ke .env.local
cp .env.accurate .env.local
```

Atau buat file `.env.local` dengan isi:

```env
VITE_ACCURATE_API_TOKEN=aat.NTA.eyJ2Ijo...
VITE_ACCURATE_SIGNATURE_SECRET=0CcWutA9rEbx...
VITE_ACCURATE_API_BASE_URL=https://public-api.accurate.id/api
VITE_ACCURATE_DATABASE_ID=717557
```

### Step 3: Restart Dev Server

```bash
# Stop server (Ctrl+C)
# Start again
pnpm dev
```

### Step 4: Test

1. Buka browser: `http://localhost:5173/system/accurate-integration`
2. Klik **"Test Connection"**
3. Seharusnya muncul ✅ **"Koneksi Berhasil"**

## 📁 Files yang Sudah Dibuat

```
src/
├── services/
│   ├── accurate-api.ts         ← API Client (commented imports)
│   └── accurate-sync.ts        ← Sync Service (commented imports)
├── app/pages/system/
│   └── accurate-integration.tsx ← UI (commented imports)
.env.accurate                    ← Your credentials
```

## 🔓 Uncomment Imports

Setelah dependencies terinstall, uncomment imports di:

**1. `src/app/pages/system/accurate-integration.tsx`:**

```typescript
// BEFORE:
// import { accurateSyncService } from '../../../services/accurate-sync';
// import accurateService from '../../../services/accurate-api';

// AFTER:
import { accurateSyncService } from '../../../services/accurate-sync';
import accurateService from '../../../services/accurate-api';
```

Juga uncomment di dalam functions:
- `handleTestConnection()`
- `handleSyncAllCustomers()`  
- `handlePullCustomers()`

## ✅ Verification

Setelah install dan uncomment, test:

```bash
# Should show no errors
pnpm build
```

Buka app, klik "Test Connection" → Harus berhasil!

## 📚 Next

Lihat dokumentasi lengkap: `docs/ACCURATE_INTEGRATION.md`
