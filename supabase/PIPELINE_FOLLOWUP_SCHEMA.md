# Pipeline Follow-up Schema Documentation

## Tabel: sales.pipeline_follow_ups

Tabel untuk menyimpan semua aktivitas follow-up dari pipeline sales.

### Informasi Tabel

- **Schema**: `sales`
- **Nama Tabel**: `pipeline_follow_ups`
- **Primary Key**: `id` (UUID)
- **Migration File**: `20260413000017_create_pipeline_followup_table.sql`

---

## Struktur Kolom

### Primary Key & Foreign Keys

| Kolom | Tipe | Nullable | Constraint | Deskripsi |
|-------|------|----------|------------|-----------|
| `id` | UUID | NO | PRIMARY KEY | Primary key, auto-generated |
| `pipeline_id` | UUID | NO | FK → sales.pipeline(id) | Referensi ke pipeline yang di-follow-up |
| `sales_person_id` | UUID | YES | FK → auth.users(id) | PIC Sales yang melakukan follow-up |
| `created_by` | UUID | YES | FK → auth.users(id) | User yang membuat record |

### Informasi Follow-up

| Kolom | Tipe | Nullable | Deskripsi |
|-------|------|----------|-----------|
| `follow_up_number` | VARCHAR(50) | YES | Nomor follow-up unik (Format: FU-YYYYMMDD-XXXX) |
| `tanggal` | DATE | NO | Tanggal aktivitas follow-up dilakukan |
| `aktivitas` | VARCHAR(200) | NO | Jenis aktivitas (Cold Call, Meeting, Presentasi, Follow Up, Kirim Proposal, Negosiasi Harga, Closing Deal, Site Visit) |
| `stage` | VARCHAR(50) | YES | Stage pipeline saat follow-up (Lead, Qualifikasi, Presentasi, Proposal, Negosiasi, Closing, Lost) |

### Informasi Customer

| Kolom | Tipe | Nullable | Deskripsi |
|-------|------|----------|-----------|
| `alamat` | TEXT | YES | Alamat customer yang dikunjungi |
| `contact_person` | VARCHAR(200) | YES | Nama kontak person yang ditemui |
| `phone` | VARCHAR(50) | YES | Nomor telepon kontak |

### Hasil & Catatan

| Kolom | Tipe | Nullable | Deskripsi |
|-------|------|----------|-----------|
| `hasil` | TEXT | YES | Hasil dari aktivitas follow-up (positif, negatif, netral) |
| `catatan` | TEXT | YES | Catatan tambahan mengenai follow-up |
| `status` | VARCHAR(50) | NO | Status follow-up (completed, pending, cancelled) |

### Follow-up Berikutnya

| Kolom | Tipe | Nullable | Deskripsi |
|-------|------|----------|-----------|
| `next_follow_up_date` | DATE | YES | Tanggal rencana follow-up berikutnya |
| `next_follow_up_notes` | TEXT | YES | Catatan untuk follow-up berikutnya |

### Metadata

| Kolom | Tipe | Nullable | Deskripsi |
|-------|------|----------|-----------|
| `created_at` | TIMESTAMPTZ | NO | Tanggal record dibuat (default: NOW()) |
| `updated_at` | TIMESTAMPTZ | NO | Tanggal record terakhir diupdate |

---

## Indexes

Untuk performa query yang optimal, tabel ini memiliki indexes berikut:

1. **idx_pipeline_follow_ups_pipeline_id** - Index pada `pipeline_id` untuk lookup follow-up berdasarkan pipeline
2. **idx_pipeline_follow_ups_tanggal** - Index DESC pada `tanggal` untuk sorting kronologis
3. **idx_pipeline_follow_ups_sales_person** - Index pada `sales_person_id` untuk filter by sales person
4. **idx_pipeline_follow_ups_status** - Index pada `status` untuk filter by status
5. **idx_pipeline_follow_ups_next_date** - Partial index pada `next_follow_up_date` (hanya untuk yang tidak NULL)

---

## Relasi Foreign Key

```sql
sales.pipeline_follow_ups.pipeline_id 
  → sales.pipeline.id (ON DELETE CASCADE)

sales.pipeline_follow_ups.sales_person_id 
  → auth.users.id

sales.pipeline_follow_ups.created_by 
  → auth.users.id
```

### Cascade Delete

- Jika pipeline dihapus, semua follow-up terkait akan **otomatis terhapus** (CASCADE)
- Ini memastikan tidak ada orphan records

---

## Fungsi & Trigger

### 1. Auto-generate Follow-up Number

**Function**: `sales.generate_follow_up_number()`

Secara otomatis men-generate nomor follow-up dengan format:
```
FU-YYYYMMDD-XXXX
```

**Contoh**: 
- `FU-20260413-0001` - Follow-up pertama pada 13 April 2026
- `FU-20260413-0002` - Follow-up kedua pada 13 April 2026

**Trigger**: `trigger_generate_follow_up_number`
- Dijalankan BEFORE INSERT
- Hanya jika `follow_up_number` IS NULL

### 2. Auto-update Timestamp

**Trigger**: `update_pipeline_follow_ups_updated_at`
- Dijalankan BEFORE UPDATE
- Otomatis update kolom `updated_at` dengan timestamp sekarang

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

### 1. Get All Follow-ups untuk Pipeline Tertentu

```sql
SELECT 
  f.id,
  f.follow_up_number,
  f.tanggal,
  f.aktivitas,
  f.stage,
  f.hasil,
  f.next_follow_up_date,
  u.full_name as sales_person
FROM sales.pipeline_follow_ups f
LEFT JOIN auth.users u ON f.sales_person_id = u.id
WHERE f.pipeline_id = 'uuid-pipeline-id'
ORDER BY f.tanggal DESC;
```

### 2. Get Follow-ups dengan Next Action Pending

```sql
SELECT 
  f.*,
  p.customer_name,
  p.estimated_value
FROM sales.pipeline_follow_ups f
INNER JOIN sales.pipeline p ON f.pipeline_id = p.id
WHERE f.next_follow_up_date IS NOT NULL
  AND f.next_follow_up_date >= CURRENT_DATE
ORDER BY f.next_follow_up_date ASC;
```

### 3. Insert New Follow-up

```sql
INSERT INTO sales.pipeline_follow_ups (
  pipeline_id,
  sales_person_id,
  tanggal,
  aktivitas,
  stage,
  alamat,
  hasil,
  catatan,
  next_follow_up_date,
  status,
  created_by
) VALUES (
  'pipeline-uuid',
  'user-uuid',
  '2026-04-13',
  'Meeting',
  'Presentasi',
  'Jakarta',
  'Customer tertarik dengan produk X',
  'Perlu kirim sample',
  '2026-04-20',
  'completed',
  'user-uuid'
);
-- follow_up_number akan di-generate otomatis: FU-20260413-0001
```

### 4. Count Follow-ups per Pipeline

```sql
SELECT 
  p.id,
  p.customer_name,
  COUNT(f.id) as total_follow_ups,
  MAX(f.tanggal) as last_follow_up_date
FROM sales.pipeline p
LEFT JOIN sales.pipeline_follow_ups f ON p.id = f.pipeline_id
GROUP BY p.id, p.customer_name
ORDER BY total_follow_ups DESC;
```

---

## Integrasi dengan Frontend

### Interface TypeScript

```typescript
interface PipelineFollowUp {
  id: string;
  pipelineId: string;
  salesPersonId?: string;
  followUpNumber?: string;
  tanggal: string;
  aktivitas: string;
  stage?: string;
  alamat?: string;
  contactPerson?: string;
  phone?: string;
  hasil?: string;
  catatan?: string;
  nextFollowUpDate?: string;
  nextFollowUpNotes?: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
}
```

### API Endpoints

- `GET /api/pipeline-follow-ups?pipeline_id={id}` - List follow-ups
- `POST /api/pipeline-follow-ups` - Create follow-up
- `PATCH /api/pipeline-follow-ups/{id}` - Update follow-up
- `DELETE /api/pipeline-follow-ups/{id}` - Delete follow-up

---

## Best Practices

1. **Selalu isi tanggal dan aktivitas** - Keduanya required untuk tracking yang akurat
2. **Update stage jika berubah** - Sync stage dengan pipeline utama
3. **Catat hasil dengan jelas** - Membantu analisis efektivitas follow-up
4. **Set next_follow_up_date** - Reminder untuk follow-up berikutnya
5. **Gunakan aktivitas yang konsisten** - Pilih dari dropdown yang sudah didefinisikan

---

## Maintenance

### Backup Recommendation

```sql
-- Backup follow-ups older than 1 year to archive table
CREATE TABLE sales.pipeline_follow_ups_archive (LIKE sales.pipeline_follow_ups);

INSERT INTO sales.pipeline_follow_ups_archive
SELECT * FROM sales.pipeline_follow_ups
WHERE created_at < NOW() - INTERVAL '1 year';
```

### Performance Monitoring

```sql
-- Check table size
SELECT 
  pg_size_pretty(pg_total_relation_size('sales.pipeline_follow_ups')) as total_size,
  pg_size_pretty(pg_relation_size('sales.pipeline_follow_ups')) as table_size,
  pg_size_pretty(pg_indexes_size('sales.pipeline_follow_ups')) as indexes_size;

-- Check number of records
SELECT COUNT(*) FROM sales.pipeline_follow_ups;
```

---

## Change Log

| Version | Date | Description |
|---------|------|-------------|
| 1.0 | 2026-04-13 | Initial creation of pipeline_follow_ups table |
