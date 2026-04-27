# Setup Database Supabase

## Masalah: Database tidak tersambung ke kv_store_6a7942bb

Aplikasi ini menggunakan Supabase sebagai database backend. Tabel `kv_store_6a7942bb` diperlukan untuk menyimpan semua data aplikasi.

## Langkah-langkah Setup

### Opsi 1: Menggunakan Supabase CLI (Recommended)

1. **Install Supabase CLI** (jika belum):
   ```bash
   npm install -g supabase
   ```

2. **Login ke Supabase**:
   ```bash
   supabase login
   ```

3. **Link project ke Supabase**:
   ```bash
   supabase link --project-ref xbzxxzwisotukyvwpqql
   ```

4. **Push migrations ke Supabase**:
   ```bash
   supabase db push
   ```

### Opsi 2: Manual via Supabase Dashboard

1. **Buka Supabase Dashboard**:
   - Pergi ke: https://supabase.com/dashboard/project/xbzxxzwisotukyvwpqql
   - Login dengan akun Anda

2. **Buka SQL Editor**:
   - Klik menu "SQL Editor" di sidebar kiri
   - Atau klik: https://supabase.com/dashboard/project/xbzxxzwisotukyvwpqql/sql

3. **Jalankan SQL Migration**:
   - Copy semua isi file: `supabase/migrations/20260414000002_create_kv_store_table.sql`
   - Paste ke SQL Editor
   - Klik tombol "Run" atau tekan Ctrl+Enter

4. **Verifikasi Tabel Berhasil Dibuat**:
   - Klik menu "Table Editor" di sidebar
   - Cari tabel `kv_store_6a7942bb`
   - Tabel harus sudah muncul dengan kolom: key, value, created_at, updated_at

### Opsi 3: Quick Copy-Paste SQL

Copy dan jalankan SQL ini di Supabase SQL Editor:

```sql
-- Create KV Store table
CREATE TABLE IF NOT EXISTS public.kv_store_6a7942bb (
    key TEXT PRIMARY KEY,
    value JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index
CREATE INDEX IF NOT EXISTS idx_kv_store_created_at ON public.kv_store_6a7942bb(created_at);

-- Enable RLS
ALTER TABLE public.kv_store_6a7942bb ENABLE ROW LEVEL SECURITY;

-- Allow public access (untuk development)
CREATE POLICY "Allow all operations" ON public.kv_store_6a7942bb
    FOR ALL
    USING (true)
    WITH CHECK (true);

-- Trigger untuk update timestamp
CREATE OR REPLACE FUNCTION update_kv_store_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER kv_store_update_timestamp
    BEFORE UPDATE ON public.kv_store_6a7942bb
    FOR EACH ROW
    EXECUTE FUNCTION update_kv_store_updated_at();
```

## Migrasi Lainnya

Setelah tabel `kv_store_6a7942bb` berhasil dibuat, jalankan juga migrasi berikut (opsional):

### 1. Master Product Types
File: `supabase/migrations/20260414000001_create_product_types_table.sql`

```sql
-- Create product_types table in master schema
CREATE SCHEMA IF NOT EXISTS master;

CREATE TABLE IF NOT EXISTS master.product_types (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL UNIQUE,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ DEFAULT NULL
);

CREATE INDEX idx_product_types_code ON master.product_types(code);
CREATE INDEX idx_product_types_name ON master.product_types(name);
CREATE INDEX idx_product_types_deleted_at ON master.product_types(deleted_at) WHERE deleted_at IS NULL;

ALTER TABLE master.product_types ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all operations for authenticated users" ON master.product_types
    FOR ALL
    USING (auth.role() = 'authenticated')
    WITH CHECK (auth.role() = 'authenticated');

-- Trigger untuk update timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_product_types_updated_at
    BEFORE UPDATE ON master.product_types
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
```

### 2. Pipeline Follow-ups
File: `supabase/migrations/20260413000017_create_pipeline_followup_table.sql`

Lihat file tersebut untuk SQL lengkapnya.

## Verifikasi Koneksi

Setelah menjalankan migrasi, refresh halaman aplikasi. Console browser seharusnya menampilkan:

```
✅ Supabase Connected
```

Jika masih ada error, cek:

1. **Project ID dan API Key sudah benar**:
   - File: `utils/supabase/info.tsx`
   - Project ID: `xbzxxzwisotukyvwpqql`

2. **RLS Policy sudah dibuat**:
   - Untuk development, gunakan policy yang allow public access
   - Untuk production, sesuaikan dengan kebutuhan security

3. **Network/Internet connection**:
   - Pastikan ada koneksi internet
   - Cek firewall atau proxy yang mungkin memblokir akses ke Supabase

## Troubleshooting

### Error: "relation does not exist"
- Tabel belum dibuat, jalankan migration SQL di atas

### Error: "Failed to fetch"
- Tidak ada koneksi internet
- Supabase project sedang down
- Firewall memblokir akses

### Error: "permission denied"
- RLS policy belum dibuat atau terlalu ketat
- Jalankan policy "Allow all operations" untuk development

## Support

Jika masih ada masalah, hubungi tim development atau buka issue di repository.
