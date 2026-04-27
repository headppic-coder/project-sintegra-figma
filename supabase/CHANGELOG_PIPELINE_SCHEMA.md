# Pipeline Schema Change Log

Dokumen ini mencatat semua perubahan pada schema tabel `sales.pipeline` dan tabel terkait.

---

## 📅 Version 1.2 - 2026-04-14

### ✅ Penambahan Kolom Baru

#### Tabel: `sales.pipeline`

| Kolom | Tipe | Nullable | Deskripsi | Alasan Penambahan |
|-------|------|----------|-----------|-------------------|
| `nomor_telepon` | VARCHAR(50) | YES | Nomor telepon kontak customer | Memudahkan komunikasi dan follow-up dengan customer |
| `estimasi_harga` | NUMERIC(15,2) | YES | Estimasi nilai deal dalam Rupiah | Untuk proyeksi revenue dan nilai pipeline |

**Migration SQL:**
```sql
ALTER TABLE sales.pipeline
ADD COLUMN nomor_telepon VARCHAR(50),
ADD COLUMN estimasi_harga NUMERIC(15,2);

COMMENT ON COLUMN sales.pipeline.nomor_telepon IS 'Nomor telepon kontak customer untuk follow-up';
COMMENT ON COLUMN sales.pipeline.estimasi_harga IS 'Estimasi nilai deal/transaksi dalam Rupiah';
```

### 🔄 Auto-Sync Data Customer ke Pipeline

**Fitur Baru:**
Ketika customer dilengkapi melalui tombol "Lengkapi Data Customer" di detail pipeline, data customer akan **otomatis tersinkronkan** ke pipeline.

**Field yang Disinkronkan:**

| Field Pipeline | Sumber Data Customer | Kondisi |
|----------------|---------------------|---------|
| `nomor_telepon` | `companyPhone` | Jika tersedia |
| `alamat` | `billingAddress.fullAddress` | Jika tersedia |
| `segmen` | `industryCategory` | Jika tersedia |

**Flow Process:**
```
1. User klik "Lengkapi Data Customer" di detail pipeline
   ↓
2. Isi form customer dengan data lengkap
   ↓
3. Submit form customer
   ↓
4. Customer tersimpan di database
   ↓
5. Pipeline diupdate dengan:
   - customer_id: Link ke customer
   - customer: Nama customer
   - nomor_telepon: Dari companyPhone
   - alamat: Dari billingAddress
   - segmen: Dari industryCategory
   - stage: Auto-update ke "Qualifikasi" (jika dari Lead)
   ↓
6. Toast notification: "Pipeline berhasil dihubungkan dengan customer dan data berhasil disinkronkan"
```

**Code Implementation:**
```typescript
// Di customer-form.tsx - handleSubmit
if (from === 'pipeline' && pipelineId && newCustomer) {
  await api.updatePipeline(pipelineId, {
    ...pipeline,
    customerId: newCustomer.id,
    customer: formData.customerName,
    stage: newStage,
    // Auto-sync data customer
    nomorTelepon: formData.companyPhone || pipeline.nomorTelepon,
    alamat: formData.billingAddress?.fullAddress || pipeline.alamat,
    segmen: formData.industryCategory || pipeline.segmen,
  });
}
```

**Benefits:**
- ✅ Data konsisten antara customer dan pipeline
- ✅ Menghindari manual update data di dua tempat
- ✅ Nomor telepon otomatis terisi untuk follow-up
- ✅ Alamat otomatis terisi untuk site visit
- ✅ Segmen otomatis terisi untuk analisis

**Testing Checklist:**
- [x] Lengkapi data customer dari pipeline
- [x] Check nomor telepon tersinkron
- [x] Check alamat tersinkron
- [x] Check segmen tersinkron
- [x] Check log histori mencatat perubahan

### 🔄 Perubahan Layout Detail Informasi Pipeline

#### Section 1: Detail Informasi Pipeline

**Kolom Kiri:**
1. Nama
2. Industri
3. Jenis Customer
4. Status
5. **Catatan**
6. **Hasil** ← **BARU (ditambahkan)**

**Kolom Kanan:**
1. **Kontak Customer** ← **DIUPDATE (menampilkan nomor_telepon)**
2. Alamat Customer
3. **PIC Sales** ← **DIPINDAH (dari kolom kiri)**

**Perubahan yang Dilakukan:**
- ✅ Kolom "Hasil" ditambahkan di kolom kiri bawah "Catatan"
- ✅ Kolom "PIC Sales" dipindah ke kolom kanan di bawah "Alamat Customer"
- ✅ Kolom "Kontak Customer" sekarang menampilkan `nomor_telepon` dengan icon 📞
- ❌ Kolom "Segmen" dihapus dari section ini (dipindah ke Kebutuhan Awal Customer)

#### Section 2: Kebutuhan Awal Customer

**Kolom Kiri:**
1. Jumlah
2. **Segmen** ← **DIPINDAH (dari Detail Informasi Pipeline)**
3. **Estimasi Harga** ← **BARU (ditambahkan)**

**Kolom Kanan:**
1. Kota
2. **Sumber Lead** ← **BARU (ditambahkan)**
3. Jenis Produk

**Perubahan yang Dilakukan:**
- ✅ Kolom "Estimasi Harga" ditambahkan dengan format Rupiah
- ✅ Kolom "Sumber Lead" ditambahkan dengan badge ungu
- ✅ Kolom "Segmen" dipindah dari section Detail Informasi
- ❌ Kolom "Catatan" dihapus dari section ini

**Display Format:**
```
Estimasi Harga: Rp 5.000.000 (hijau, bold)
Sumber Lead: [Referral] (badge ungu)
```

### 🎨 UI/UX Improvements

**Kolom Kontak Customer:**
- Format baru dengan icon: `📞 021-12345678`
- Warna icon: merah (`text-red-600`)
- Auto-fill dari data pipeline saat input

**Kolom Estimasi Harga:**
- Format: `Rp 5.000.000` (dengan separator ribuan)
- Warna: hijau bold (`text-green-700 font-semibold`)
- Input type: numeric di form

**Kolom Sumber Lead:**
- Badge dengan background ungu muda (`bg-purple-100`)
- Text ungu tua (`text-purple-700`)
- Border ungu (`border-purple-300`)

### 📝 Form Updates

#### Form Pipeline (Tambah/Edit)

**Section Detail Pipeline:**
```
┌─────────────────────────────────────────────┐
│ Tanggal             Segmen                  │
│ Nama Customer       Perkiraan Jumlah        │
│ Kontak Customer     Estimasi Harga   ← BARU │
│ Alamat Customer     Jenis Produk            │
└─────────────────────────────────────────────┘
```

**Field Baru di Form:**
1. **Nomor Telepon** - Input text, format: 021-xxx atau 08xx-xxx
2. **Estimasi Harga** - Input number, placeholder: "Masukkan estimasi harga"

**Auto-fill Behavior:**
- Saat pilih customer dari dropdown → auto-fill nomor telepon dari `customers.company_phone`
- Saat pilih calon customer → auto-fill nomor telepon dari `prospective_customers.phone`

### 📊 Log Histori

**Field yang Tercatat:**
```typescript
{
  nomorTelepon: {
    old: "021-111111",
    new: "021-222222"
  },
  estimasiHarga: {
    old: "5000000",
    new: "7500000"
  }
}
```

**Format Display di Log:**
```
✏️ Diperbarui - 14 Apr 2026, 10:30
Detail Perubahan:
• Nomor Telepon: "021-111111" → "021-222222"
• Estimasi Harga: "Rp 5.000.000" → "Rp 7.500.000"
```

### 🔌 API Changes

**GET /api/pipelines/:id Response:**
```json
{
  "id": "uuid",
  "customer": "PT Maju Jaya",
  "nomorTelepon": "021-12345678",  // ← BARU
  "estimasiHarga": "5000000",      // ← BARU
  "stage": "Presentasi",
  "picSales": "John Doe",
  "sumberLead": "Referral",
  ...
}
```

**POST/PATCH /api/pipelines Request Body:**
```json
{
  "customer": "PT Maju Jaya",
  "nomorTelepon": "021-12345678",  // ← BARU
  "estimasiHarga": 5000000,        // ← BARU (numeric)
  "stage": "Lead",
  ...
}
```

### 📈 Impact Analysis

**Database:**
- ✅ 2 kolom baru ditambahkan (nullable, tidak break existing data)
- ✅ Tidak ada perubahan foreign key
- ✅ Tidak perlu migrasi data existing

**Frontend:**
- ✅ Form tambah/edit pipeline diupdate
- ✅ Detail view pipeline diupdate
- ✅ Log histori support field baru
- ✅ Interface TypeScript diupdate

**Backend/API:**
- ✅ Field baru otomatis tersupport
- ✅ Log histori otomatis track perubahan
- ✅ Tidak ada breaking change

---

## 📅 Version 1.1 - 2026-04-13

### ❌ Penghapusan Kolom

| Kolom | Tipe | Alasan Penghapusan |
|-------|------|-------------------|
| `pic_pipeline` | VARCHAR(200) | Redundant dengan `pic_sales` |
| `pic_customer` | VARCHAR(200) | Tidak diperlukan, sudah ada di tabel customers |
| `estimasi_nilai` | VARCHAR(100) | Diganti dengan `estimasi_harga` (numeric, lebih akurat) |

### ✅ Penambahan Kolom

| Kolom | Tipe | Nullable | Deskripsi |
|-------|------|----------|-----------|
| `product_types` | UUID[] | YES | Array UUID jenis produk yang diminati |

**Migration SQL:**
```sql
ALTER TABLE sales.pipeline
DROP COLUMN pic_pipeline,
DROP COLUMN pic_customer,
DROP COLUMN estimasi_nilai,
ADD COLUMN product_types UUID[];

COMMENT ON COLUMN sales.pipeline.product_types IS 'Array UUID jenis produk dari master.product_types';
```

### 🔗 Relasi Baru

**Foreign Key Array:**
```sql
-- product_types[] references master.product_types(id)
-- Many-to-many via array
```

### 📊 Log Histori Feature

**Tabel Baru: `sales.pipeline_logs`**

| Kolom | Tipe | Deskripsi |
|-------|------|-----------|
| `id` | UUID | Primary key |
| `pipeline_id` | UUID | FK ke sales.pipeline |
| `action` | VARCHAR(50) | 'Create' atau 'Update' |
| `changes` | TEXT[] | Array perubahan |
| `changed_by` | VARCHAR(200) | User yang mengubah |
| `description` | TEXT | Deskripsi perubahan |
| `created_at` | TIMESTAMPTZ | Waktu perubahan |

**Trigger Auto-logging:**
```sql
CREATE TRIGGER trigger_pipeline_changes_log
AFTER INSERT OR UPDATE ON sales.pipeline
FOR EACH ROW
EXECUTE FUNCTION log_pipeline_changes();
```

**Fitur:**
- ✅ Auto-record setiap INSERT
- ✅ Auto-record setiap UPDATE dengan detail field yang berubah
- ✅ Tombol "Log Histori" di detail pipeline
- ✅ Modal dengan timeline perubahan

---

## 📅 Version 1.0 - 2026-04-13

### ✅ Initial Creation

**Tabel: `sales.pipeline`**

Kolom awal yang dibuat:
- `id` (UUID, PK)
- `tanggal` (DATE)
- `customer` (VARCHAR 200)
- `customer_id` (UUID, FK nullable)
- `order_type` (VARCHAR 50)
- `stage` (VARCHAR 50)
- `aktivitas_sales` (VARCHAR 200)
- `alamat` (TEXT)
- `segmen` (VARCHAR 100)
- `perkiraan_jumlah` (VARCHAR 100)
- `pic_sales` (VARCHAR 200)
- `sumber_lead` (VARCHAR 200)
- `hasil` (TEXT)
- `catatan` (TEXT)
- `created_at` (TIMESTAMPTZ)
- `updated_at` (TIMESTAMPTZ)
- `created_by` (UUID, FK)
- `updated_by` (UUID, FK)

**Tabel Terkait: `sales.pipeline_follow_ups`**

Untuk tracking aktivitas follow-up dari setiap pipeline.

---

## 🔄 Migration Path

### Dari Version 1.1 ke 1.2

**Step 1: Backup Data**
```sql
-- Backup tabel pipeline
CREATE TABLE sales.pipeline_backup_20260414 AS 
SELECT * FROM sales.pipeline;
```

**Step 2: Add New Columns**
```sql
ALTER TABLE sales.pipeline
ADD COLUMN IF NOT EXISTS nomor_telepon VARCHAR(50),
ADD COLUMN IF NOT EXISTS estimasi_harga NUMERIC(15,2);
```

**Step 3: Migrate Data (Optional)**
```sql
-- Auto-fill nomor telepon dari customers
UPDATE sales.pipeline p
SET nomor_telepon = c.company_phone
FROM sales.customers c
WHERE p.customer_id = c.id
  AND p.nomor_telepon IS NULL
  AND c.company_phone IS NOT NULL;
```

**Step 4: Update Frontend**
- Deploy updated form components
- Deploy updated detail view
- Deploy updated log histori
- Update TypeScript interfaces

**Step 5: Test**
- Test create new pipeline dengan field baru
- Test edit existing pipeline
- Test log histori dengan field baru
- Test auto-fill nomor telepon

### Rollback Plan

```sql
-- Jika perlu rollback
ALTER TABLE sales.pipeline
DROP COLUMN IF EXISTS nomor_telepon,
DROP COLUMN IF EXISTS estimasi_harga;

-- Restore dari backup
TRUNCATE sales.pipeline;
INSERT INTO sales.pipeline 
SELECT * FROM sales.pipeline_backup_20260414;
```

---

## 📋 Testing Checklist

### Database Level
- [x] Kolom `nomor_telepon` bisa menyimpan format telepon Indonesia
- [x] Kolom `estimasi_harga` bisa menyimpan angka besar (15 digit)
- [x] Existing data tidak corrupt
- [x] Trigger log histori masih berfungsi

### Application Level
- [x] Form tambah pipeline: field baru muncul
- [x] Form edit pipeline: field baru bisa diupdate
- [x] Auto-fill nomor telepon dari customer
- [x] Detail view: kolom baru tampil di posisi yang benar
- [x] Log histori: perubahan field baru tercatat
- [x] Format Rupiah tampil dengan benar
- [x] Badge sumber lead tampil dengan warna yang benar

### Integration Testing
- [x] Create pipeline → check nomor_telepon tersimpan
- [x] Update pipeline → check log histori
- [x] Delete pipeline → cascade delete log histori
- [x] Link ke customer → auto-fill nomor telepon

---

## 📚 Documentation References

- **Main Schema**: `/supabase/PIPELINE_SCHEMA.md`
- **Follow-up Schema**: `/supabase/PIPELINE_FOLLOWUP_SCHEMA.md`
- **Complete Mapping**: `/supabase/COMPLETE_SCHEMA_MAPPING.md`
- **Database Structure**: `/supabase/DATABASE_STRUCTURE.md`

---

## 👥 Contributors

- **Developer**: ERP Development Team
- **Last Updated By**: AI Assistant
- **Date**: 2026-04-14
- **Version**: 1.2

---

## 📞 Support

Jika ada pertanyaan atau issue terkait perubahan schema:
1. Check dokumentasi di `/supabase/PIPELINE_SCHEMA.md`
2. Review changelog ini untuk history perubahan
3. Test di development environment dulu
4. Contact development team jika ada breaking changes

---

**Status**: ✅ Production Ready  
**Approved**: Yes  
**Applied**: 2026-04-14