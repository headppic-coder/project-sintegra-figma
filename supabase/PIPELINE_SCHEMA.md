# Pipeline Schema Documentation

## Tabel: sales.pipeline

Tabel utama untuk menyimpan data pipeline sales dari lead hingga closing.

### Informasi Tabel

- **Schema**: `sales`
- **Nama Tabel**: `pipeline`
- **Primary Key**: `id` (UUID)
- **Migration File**: `20260413000015_create_sales_extended_tables.sql`

---

## Struktur Kolom

### Primary Key & Foreign Keys

| Kolom | Tipe | Nullable | Constraint | Deskripsi |
|-------|------|----------|------------|-----------|
| `id` | UUID | NO | PRIMARY KEY | Primary key, auto-generated |
| `customer_id` | UUID | YES | FK → sales.customers(id) | Referensi ke customer yang sudah terdaftar (NULL jika masih calon customer) |
| `created_by` | UUID | YES | FK → auth.users(id) | User yang membuat pipeline |
| `updated_by` | UUID | YES | FK → auth.users(id) | User yang terakhir mengupdate |

### Informasi Dasar Pipeline

| Kolom | Tipe | Nullable | Default | Deskripsi |
|-------|------|----------|---------|-----------|
| `tanggal` | DATE | NO | CURRENT_DATE | Tanggal pipeline dibuat/diinput |
| `customer` | VARCHAR(200) | NO | - | Nama customer/calon customer |
| `order_type` | VARCHAR(50) | NO | 'New' | Jenis order: 'New' (Baru) atau 'Repeat' (Repeat Order) |
| `stage` | VARCHAR(50) | NO | 'Lead' | Stage pipeline: Lead, Qualifikasi, Presentasi, Proposal, Negosiasi, Closing, Lost |

### Informasi Kontak Customer

| Kolom | Tipe | Nullable | Deskripsi |
|-------|------|----------|-----------|
| `alamat` | TEXT | YES | Alamat lengkap customer (termasuk kota dan provinsi) |
| `nomor_telepon` | VARCHAR(50) | YES | Nomor telepon kontak customer |

### Informasi Sales

| Kolom | Tipe | Nullable | Deskripsi |
|-------|------|----------|-----------|
| `aktivitas_sales` | VARCHAR(200) | YES | Aktivitas sales yang dilakukan (Cold Call, Meeting, Presentasi, dll) |
| `pic_sales` | VARCHAR(200) | YES | Nama PIC Sales yang menangani pipeline ini |
| `sumber_lead` | VARCHAR(200) | YES | Sumber lead (Referral, Website, Social Media, Cold Call, Event, Iklan, dll) |

### Kebutuhan Customer

| Kolom | Tipe | Nullable | Deskripsi |
|-------|------|----------|-----------|
| `segmen` | VARCHAR(100) | YES | Segmen customer (Food & Beverage, Pharmaceutical, Cosmetic, Industrial, dll) |
| `perkiraan_jumlah` | VARCHAR(100) | YES | Perkiraan jumlah/range quantity (contoh: "1000-5000", "5000-10000") |
| `estimasi_harga` | NUMERIC(15,2) | YES | Estimasi harga/nilai deal dalam Rupiah |
| `product_types` | UUID[] | YES | Array UUID jenis produk yang diminati (referensi ke master.product_types) |

### Hasil & Catatan

| Kolom | Tipe | Nullable | Deskripsi |
|-------|------|----------|-----------|
| `hasil` | TEXT | YES | Hasil dari aktivitas sales yang dilakukan |
| `catatan` | TEXT | YES | Catatan tambahan terkait pipeline |

### Metadata

| Kolom | Tipe | Nullable | Deskripsi |
|-------|------|----------|-----------|
| `created_at` | TIMESTAMPTZ | NO | Tanggal dan waktu record dibuat (default: NOW()) |
| `updated_at` | TIMESTAMPTZ | NO | Tanggal dan waktu record terakhir diupdate |

---

## Enum Values

### order_type
- `New` - Customer baru (perorangan)
- `Repeat` - Repeat order dari customer existing

### stage (Pipeline Stages)
- `Lead` - Tahap awal, baru mendapat lead
- `Qualifikasi` - Sedang kualifikasi kebutuhan
- `Presentasi` - Melakukan presentasi produk
- `Proposal` - Mengirim proposal penawaran
- `Negosiasi` - Tahap negosiasi harga/terms
- `Closing` - Deal closing, menjadi order
- `Lost` - Pipeline gagal/hilang

### aktivitas_sales (Sales Activities)
- `Cold Call` - Telepon ke prospek baru
- `Meeting` - Pertemuan dengan customer
- `Presentasi Produk` - Presentasi produk/capability
- `Follow Up` - Follow up komunikasi
- `Kirim Proposal` - Mengirim proposal harga
- `Negosiasi Harga` - Negosiasi harga dan terms
- `Closing Deal` - Closing deal
- `Site Visit` - Kunjungan ke lokasi customer

### sumber_lead (Lead Sources)
- `Referral` - Dari referensi/rekomendasi
- `Website` - Dari website perusahaan
- `Social Media` - Dari media sosial
- `Cold Call` - Dari cold calling
- `Event/Pameran` - Dari event atau pameran
- `Iklan` - Dari iklan
- `Lainnya` - Sumber lain

---

## Indexes

Untuk performa query yang optimal, tabel ini memiliki indexes berikut:

1. **idx_pipeline_customer_id** - Index pada `customer_id` untuk join ke customers
2. **idx_pipeline_stage** - Index pada `stage` untuk filter by stage
3. **idx_pipeline_tanggal** - Index DESC pada `tanggal` untuk sorting kronologis
4. **idx_pipeline_pic_sales** - Index pada `pic_sales` untuk filter by sales person
5. **idx_pipeline_order_type** - Index pada `order_type` untuk filter by order type

---

## Relasi Foreign Key

```sql
sales.pipeline.customer_id 
  → sales.customers.id (ON DELETE SET NULL)

sales.pipeline.created_by 
  → auth.users.id

sales.pipeline.updated_by 
  → auth.users.id
```

### Cascade Behavior

- Jika customer dihapus, `customer_id` akan **di-set NULL** (SET NULL)
- Pipeline tetap ada sebagai data historis dengan nama customer tersimpan di field `customer`

---

## Relasi ke Tabel Lain

### 1. Relasi ke sales.pipeline_follow_ups

```sql
sales.pipeline.id ← sales.pipeline_follow_ups.pipeline_id
```

Setiap pipeline dapat memiliki **banyak follow-up** (one-to-many).

### 2. Relasi ke sales.pipeline_logs

```sql
sales.pipeline.id ← sales.pipeline_logs.pipeline_id
```

Setiap pipeline memiliki **log histori perubahan** (one-to-many).

### 3. Relasi ke sales.customers

```sql
sales.pipeline.customer_id → sales.customers.id
```

Pipeline dapat ter-link ke **customer terdaftar** (many-to-one, optional).

### 4. Relasi ke master.product_types

```sql
sales.pipeline.product_types[] → master.product_types.id[]
```

Pipeline dapat memiliki **multiple jenis produk** (many-to-many via array).

---

## Fungsi & Trigger

### 1. Auto-update Timestamp

**Trigger**: `update_pipeline_updated_at`
- Dijalankan BEFORE UPDATE
- Otomatis update kolom `updated_at` dengan timestamp sekarang

### 2. Auto-create Log Histori

**Trigger**: `trigger_pipeline_changes_log`
- Dijalankan AFTER INSERT dan AFTER UPDATE
- Otomatis mencatat perubahan ke tabel `sales.pipeline_logs`
- Mencatat field apa saja yang berubah dengan nilai lama dan baru

---

## Row Level Security (RLS)

RLS diaktifkan dengan policies berikut:

| Policy | Operation | Kondisi |
|--------|-----------|---------|
| Enable read access | SELECT | Authenticated users |
| Enable insert | INSERT | Authenticated users |
| Enable update | UPDATE | Authenticated users |
| Enable delete | DELETE | Authenticated users |

---

## Contoh Query

### 1. Get Pipeline dengan Join ke Customer

```sql
SELECT 
  p.id,
  p.tanggal,
  p.customer,
  p.stage,
  p.estimasi_harga,
  p.pic_sales,
  c.customer_name as customer_registered_name,
  c.industry_category,
  c.customer_category
FROM sales.pipeline p
LEFT JOIN sales.customers c ON p.customer_id = c.id
ORDER BY p.tanggal DESC;
```

### 2. Get Pipeline dengan Product Types

```sql
SELECT 
  p.id,
  p.customer,
  p.stage,
  ARRAY_AGG(pt.name) as product_type_names
FROM sales.pipeline p
LEFT JOIN UNNEST(p.product_types) WITH ORDINALITY AS pt_id ON TRUE
LEFT JOIN master.product_types pt ON pt.id = pt_id
GROUP BY p.id, p.customer, p.stage;
```

### 3. Get Pipeline by Stage dengan Count Follow-ups

```sql
SELECT 
  p.id,
  p.customer,
  p.stage,
  p.estimasi_harga,
  COUNT(f.id) as total_follow_ups,
  MAX(f.tanggal) as last_follow_up_date
FROM sales.pipeline p
LEFT JOIN sales.pipeline_follow_ups f ON p.id = f.pipeline_id
WHERE p.stage = 'Presentasi'
GROUP BY p.id, p.customer, p.stage, p.estimasi_harga
ORDER BY last_follow_up_date DESC;
```

### 4. Insert New Pipeline

```sql
INSERT INTO sales.pipeline (
  tanggal,
  customer,
  order_type,
  stage,
  alamat,
  nomor_telepon,
  aktivitas_sales,
  pic_sales,
  sumber_lead,
  segmen,
  perkiraan_jumlah,
  estimasi_harga,
  product_types,
  hasil,
  catatan,
  created_by
) VALUES (
  '2026-04-14',
  'PT Maju Jaya',
  'New',
  'Lead',
  'Jl. Sudirman No. 123, Jakarta Pusat, DKI Jakarta',
  '021-12345678',
  'Cold Call',
  'John Doe',
  'Referral',
  'Food & Beverage',
  '5000-10000',
  5000000,
  ARRAY['uuid-product-type-1', 'uuid-product-type-2']::uuid[],
  'Customer tertarik dengan produk pouch',
  'Follow up minggu depan',
  'user-uuid'
);
```

### 5. Update Pipeline Stage

```sql
UPDATE sales.pipeline
SET 
  stage = 'Proposal',
  updated_by = 'user-uuid'
WHERE id = 'pipeline-uuid';
-- Log histori akan otomatis tercatat
```

### 6. Link Pipeline ke Customer Terdaftar

```sql
UPDATE sales.pipeline
SET 
  customer_id = 'customer-uuid',
  updated_by = 'user-uuid'
WHERE id = 'pipeline-uuid';
```

### 7. Get Pipeline Statistics by Stage

```sql
SELECT 
  stage,
  COUNT(*) as total_pipeline,
  SUM(estimasi_harga) as total_value,
  AVG(estimasi_harga) as avg_value
FROM sales.pipeline
WHERE tanggal >= DATE_TRUNC('month', CURRENT_DATE)
GROUP BY stage
ORDER BY 
  CASE stage
    WHEN 'Lead' THEN 1
    WHEN 'Qualifikasi' THEN 2
    WHEN 'Presentasi' THEN 3
    WHEN 'Proposal' THEN 4
    WHEN 'Negosiasi' THEN 5
    WHEN 'Closing' THEN 6
    WHEN 'Lost' THEN 7
  END;
```

---

## Integrasi dengan Frontend

### Interface TypeScript

```typescript
interface Pipeline {
  id: string;
  tanggal: string;
  customer: string;
  customerId?: string;
  orderType: string; // 'New' | 'Repeat'
  stage: string; // 'Lead' | 'Qualifikasi' | 'Presentasi' | 'Proposal' | 'Negosiasi' | 'Closing' | 'Lost'
  aktivitasSales: string;
  alamat: string;
  nomorTelepon?: string;
  segmen: string;
  perkiraanJumlah: string;
  estimasiHarga?: string;
  picSales: string;
  sumberLead: string;
  hasil: string;
  catatan: string;
  productTypes?: string[];
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
  updatedBy?: string;
}
```

### API Endpoints

- `GET /api/pipelines` - List all pipelines
- `GET /api/pipelines/{id}` - Get pipeline by ID
- `POST /api/pipelines` - Create new pipeline
- `PATCH /api/pipelines/{id}` - Update pipeline
- `DELETE /api/pipelines/{id}` - Delete pipeline
- `GET /api/pipelines/stats` - Get pipeline statistics

---

## Best Practices

1. **Selalu isi PIC Sales** - Untuk tracking siapa yang menangani pipeline
2. **Update stage secara berkala** - Agar pipeline funnel akurat
3. **Catat nomor telepon** - Memudahkan follow-up
4. **Isi estimasi harga** - Untuk proyeksi revenue
5. **Link ke customer terdaftar** - Begitu customer sudah dilengkapi data
6. **Gunakan product_types** - Untuk analisis produk yang paling diminati
7. **Tambahkan hasil dan catatan** - Dokumentasi proses sales
8. **Gunakan fitur "Lengkapi Data Customer"** - Data akan otomatis tersinkronkan (nomor telepon, alamat, segmen)

---

## Perubahan Schema (Change Log)

### Version 1.2 - 2026-04-14

**Penambahan Kolom:**
- ✅ `nomor_telepon` (VARCHAR 50) - Nomor telepon kontak customer
- ✅ `estimasi_harga` (NUMERIC 15,2) - Estimasi nilai deal

**Perubahan Display:**
- ✅ Kolom "Segmen" dipindah ke section "Kebutuhan Awal Customer"
- ✅ Kolom "PIC Sales" dipindah ke kolom kanan bawah "Alamat Customer"
- ✅ Kolom "Hasil" ditambahkan di detail informasi pipeline
- ✅ Kolom "Kontak Customer" menampilkan nomor telepon
- ✅ Kolom "Sumber Lead" ditambahkan di detail kebutuhan customer

**Fitur Baru:**
- ✅ Log histori otomatis untuk semua perubahan data
- ✅ Tombol "Log Histori" di detail pipeline
- ✅ Auto-fill nomor telepon dari customer/calon customer

### Version 1.1 - 2026-04-13

**Kolom yang Dihapus:**
- ❌ `pic_pipeline` - Dihapus karena redundant dengan pic_sales
- ❌ `pic_customer` - Tidak diperlukan
- ❌ `estimasi_nilai` - Diganti dengan estimasi_harga

**Penambahan:**
- ✅ `product_types` (UUID[]) - Array jenis produk
- ✅ Integration dengan master.product_types

### Version 1.0 - 2026-04-13

**Initial Creation:**
- ✅ Struktur dasar tabel pipeline
- ✅ Foreign key ke customers
- ✅ Basic fields untuk pipeline management

---

## Maintenance

### Cleanup Old Lost Pipelines

```sql
-- Archive pipelines lost > 6 months
CREATE TABLE sales.pipeline_archive (LIKE sales.pipeline);

INSERT INTO sales.pipeline_archive
SELECT * FROM sales.pipeline
WHERE stage = 'Lost' 
  AND updated_at < NOW() - INTERVAL '6 months';

DELETE FROM sales.pipeline
WHERE stage = 'Lost' 
  AND updated_at < NOW() - INTERVAL '6 months';
```

### Performance Monitoring

```sql
-- Check table size
SELECT 
  pg_size_pretty(pg_total_relation_size('sales.pipeline')) as total_size,
  pg_size_pretty(pg_relation_size('sales.pipeline')) as table_size,
  pg_size_pretty(pg_indexes_size('sales.pipeline')) as indexes_size;

-- Check number of records by stage
SELECT 
  stage,
  COUNT(*) as total
FROM sales.pipeline
GROUP BY stage
ORDER BY total DESC;
```

---

## Diagram ER

```
┌─────────────────────────┐
│   sales.customers       │
│─────────────────────────│
│ • id (PK)              │
│   customer_name         │
│   industry_category     │
└─────────────────────────┘
           ↑
           │ customer_id (FK, nullable)
           │
┌─────────────────────────┐
│   sales.pipeline        │
│─────────────────────────│
│ • id (PK)              │
│   tanggal               │
│   customer              │
│   customer_id (FK)      │
│   order_type            │
│   stage                 │
│   alamat                │
│   nomor_telepon         │──┐
│   aktivitas_sales       │  │
│   pic_sales             │  │
│   sumber_lead           │  │
│   segmen                │  │
│   perkiraan_jumlah      │  │
│   estimasi_harga        │  │ Informasi
│   product_types[]       │  │ Lengkap
│   hasil                 │  │ Pipeline
│   catatan               │  │
│   created_at            │  │
│   updated_at            │──┘
└─────────────────────────┘
           │
           ├─────────────────────────────┐
           │                             │
           ↓                             ↓
┌──────────────────────────┐  ┌──────────────────────┐
│ pipeline_follow_ups      │  │ pipeline_logs        │
│──────────────────────────│  │──────────────────────│
│ • id (PK)               │  │ • id (PK)           │
│   pipeline_id (FK)       │  │   pipeline_id (FK)   │
│   tanggal                │  │   action             │
│   aktivitas              │  │   changes[]          │
│   stage                  │  │   changed_by         │
│   hasil                  │  │   description        │
│   next_follow_up_date    │  │   created_at         │
└──────────────────────────┘  └──────────────────────┘
```

---

**Last Updated**: 2026-04-14  
**Maintained by**: ERP Development Team  
**Status**: ✅ Active - Production Ready