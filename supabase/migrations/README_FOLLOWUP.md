# Pipeline Follow-up Migration

## File: 20260413000017_create_pipeline_followup_table.sql

### Deskripsi
Migration ini membuat tabel `sales.pipeline_follow_ups` untuk menyimpan semua aktivitas follow-up dari pipeline sales.

### Tabel yang Dibuat

#### sales.pipeline_follow_ups

Tabel utama untuk tracking aktivitas follow-up pipeline:

- **18 kolom** dengan berbagai tipe data (UUID, VARCHAR, DATE, TEXT, TIMESTAMPTZ)
- **4 foreign keys** ke tabel lain (pipeline, users)
- **5 indexes** untuk optimasi performa query
- **RLS enabled** dengan 4 policies (SELECT, INSERT, UPDATE, DELETE)
- **2 triggers**:
  1. Auto-generate follow-up number (format: FU-YYYYMMDD-XXXX)
  2. Auto-update timestamp

### Fitur Utama

#### 1. Auto-Generated Follow-up Number
Setiap follow-up mendapat nomor unik otomatis:
```
FU-20260413-0001
FU-20260413-0002
FU-20260414-0001
```

Format: `FU-[YYYYMMDD]-[Sequential Number]`

#### 2. Relasi ke Pipeline
- `ON DELETE CASCADE` - Jika pipeline dihapus, follow-up ikut terhapus
- Mencegah orphan records

#### 3. Tracking Next Follow-up
- Field `next_follow_up_date` untuk jadwal follow-up berikutnya
- Field `next_follow_up_notes` untuk catatan reminder

#### 4. Comprehensive Activity Tracking
- Tanggal aktivitas
- Jenis aktivitas (Meeting, Call, Presentasi, dll)
- Stage pipeline saat follow-up
- Hasil dan catatan detail

### Cara Menjalankan Migration

```bash
# Via Supabase CLI
supabase db push

# Atau apply manual
psql -h your-host -d your-database -f 20260413000017_create_pipeline_followup_table.sql
```

### Verifikasi

Setelah migration, verifikasi dengan query:

```sql
-- Cek tabel sudah dibuat
SELECT table_name, table_schema 
FROM information_schema.tables 
WHERE table_name = 'pipeline_follow_ups';

-- Cek struktur kolom
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'pipeline_follow_ups'
ORDER BY ordinal_position;

-- Cek indexes
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename = 'pipeline_follow_ups';

-- Cek RLS policies
SELECT policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename = 'pipeline_follow_ups';
```

### Rollback

Jika perlu rollback migration:

```sql
-- Drop table (akan drop semua yang terkait)
DROP TABLE IF EXISTS sales.pipeline_follow_ups CASCADE;

-- Drop function
DROP FUNCTION IF EXISTS sales.generate_follow_up_number() CASCADE;
```

### Dependencies

Migration ini memerlukan:
1. ✅ Schema `sales` sudah ada (dari migration 01)
2. ✅ Table `sales.pipeline` sudah ada (dari migration 03 atau 15)
3. ✅ Function `update_updated_at_column()` sudah ada (dari migration 07)

### Testing

Contoh insert untuk testing:

```sql
-- Test insert follow-up
INSERT INTO sales.pipeline_follow_ups (
  pipeline_id,
  tanggal,
  aktivitas,
  stage,
  hasil,
  status
) VALUES (
  (SELECT id FROM sales.pipeline LIMIT 1), -- Ambil pipeline ID pertama
  CURRENT_DATE,
  'Meeting',
  'Presentasi',
  'Customer tertarik',
  'completed'
);

-- Cek auto-generated number
SELECT follow_up_number, tanggal, aktivitas 
FROM sales.pipeline_follow_ups 
ORDER BY created_at DESC 
LIMIT 1;
```

### Integration dengan Frontend

File yang perlu update:
- ✅ `src/app/pages/sales/pipeline-detail.tsx` - Sudah menggunakan interface PipelineFollowUp
- ✅ `src/app/lib/api.ts` - Sudah ada functions: createPipelineFollowUp, getPipelineFollowUps, updatePipelineFollowUp
- ✅ `src/app/pages/master/database-schema.tsx` - Sudah ditambahkan dokumentasi tabel

### Notes

- Follow-up number di-generate otomatis, tidak perlu diisi manual
- Gunakan `next_follow_up_date` untuk reminder follow-up berikutnya
- Field `hasil` dan `catatan` penting untuk tracking efektivitas sales
- Stage bisa berbeda dengan pipeline utama (menunjukkan progress/perubahan)
