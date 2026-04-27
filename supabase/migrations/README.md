# Database Migrations

## Overview
Folder ini berisi migration files untuk membuat dan mengelola database schema Supabase.

## Migration Files (Urutan Eksekusi)

| File | Deskripsi |
|------|-----------|
| `20260413000001_create_schemas.sql` | Membuat schemas: master, sales, production, inventory, finance |
| `20260413000002_create_master_tables.sql` | Tabel master: materials, process_costs, categories, dll |
| `20260413000003_create_sales_tables.sql` | Tabel sales: customers, price_formulas, quotations, orders |
| `20260413000004_create_production_tables.sql` | Tabel production: work_orders, process_steps, machines, dll |
| `20260413000005_create_inventory_tables.sql` | Tabel inventory: stock, warehouses, purchase_orders, dll |
| `20260413000006_create_finance_tables.sql` | Tabel finance: invoices, payments, expenses, accounts |
| `20260413000007_create_functions_triggers.sql` | Functions & triggers untuk automation |
| `20260413000008_seed_data.sql` | Data awal/sample untuk testing |
| `20260413000009_create_design_tables.sql` | Tabel design: design requests, library, cylinders, plates |
| `20260413000010_create_ppic_tables.sql` | Tabel PPIC: production plans, schedules, material monitoring |
| `20260413000011_extend_production_tables.sql` | Extend production: shift plans, downtime, productivity |
| `20260413000012_extend_inventory_tables.sql` | Extend inventory: item requests/receipts, tools, min/max stock |
| `20260413000013_extend_hrga_tables.sql` | Tabel HRGA: employees, departments, recruitment, assets |
| `20260413000014_extend_procurement_tables.sql` | Tabel procurement: suppliers, evaluations, quotations, returns |
| `20260413000015_create_additional_sales_tables.sql` | Additional sales: pipeline, prospects, deliveries, activities |

## Cara Menggunakan

### Opsi 1: Menggunakan Supabase CLI (Recommended)

1. **Install Supabase CLI**
   ```bash
   npm install -g supabase
   ```

2. **Login ke Supabase**
   ```bash
   supabase login
   ```

3. **Link ke Project**
   ```bash
   supabase link --project-ref your-project-ref
   ```
   
   *Project ref bisa dilihat di Supabase Dashboard → Settings → General → Reference ID*

4. **Apply Migrations**
   ```bash
   # Apply semua migrations yang belum dijalankan
   supabase db push
   
   # Atau reset database dan apply semua migrations dari awal
   supabase db reset
   ```

5. **Verify**
   ```bash
   # Check status migrations
   supabase migration list
   ```

### Opsi 2: Manual via Supabase Dashboard

1. Buka Supabase Dashboard
2. Pilih project Anda
3. Klik **SQL Editor**
4. Run setiap file migration secara berurutan (001 → 008):
   - Copy isi file migration
   - Paste ke SQL Editor
   - Klik **Run**
   - Ulangi untuk file berikutnya

### Opsi 3: Menggunakan psql (Database Client)

```bash
# Connect ke database
psql "postgresql://postgres:[YOUR-PASSWORD]@[YOUR-PROJECT-REF].supabase.co:5432/postgres"

# Run migrations
\i supabase/migrations/20260413000001_create_schemas.sql
\i supabase/migrations/20260413000002_create_master_tables.sql
\i supabase/migrations/20260413000003_create_sales_tables.sql
\i supabase/migrations/20260413000004_create_production_tables.sql
\i supabase/migrations/20260413000005_create_inventory_tables.sql
\i supabase/migrations/20260413000006_create_finance_tables.sql
\i supabase/migrations/20260413000007_create_functions_triggers.sql
\i supabase/migrations/20260413000008_seed_data.sql
```

## Membuat Migration Baru

### Menggunakan Supabase CLI

```bash
# Generate migration file baru
supabase migration new your_migration_name

# File akan dibuat di: supabase/migrations/[timestamp]_your_migration_name.sql
```

### Manual

Buat file baru dengan format: `[timestamp]_description.sql`

Contoh: `20260414000001_add_new_feature.sql`

## Testing Migrations

### Local Development

1. **Start Supabase Local**
   ```bash
   supabase start
   ```

2. **Test migrations locally**
   ```bash
   supabase db reset
   ```

3. **Verify hasil**
   ```bash
   # Check tables
   supabase db dump --schema public master sales production inventory finance
   ```

### Production

**⚠️ PERHATIAN:** Selalu test di development environment dulu!

1. Backup database production
2. Test di staging environment
3. Apply ke production dengan hati-hati

## Rollback Migration

### Menggunakan CLI

```bash
# Reset ke migration tertentu
supabase db reset --version [migration-timestamp]
```

### Manual

Buat migration baru untuk undo changes. Contoh:

```sql
-- File: 20260414000002_rollback_feature.sql

-- Drop table yang dibuat di migration sebelumnya
DROP TABLE IF EXISTS schema_name.table_name CASCADE;

-- Restore schema lama jika perlu
-- ... SQL untuk restore
```

## Migration Best Practices

1. ✅ **Selalu backup database sebelum migration di production**
2. ✅ **Test migrations di local/staging dulu**
3. ✅ **Gunakan transactions** (BEGIN; ... COMMIT;) untuk migration yang kompleks
4. ✅ **Buat migrations yang idempotent** (bisa dijalankan berulang kali)
   ```sql
   CREATE TABLE IF NOT EXISTS ...
   CREATE INDEX IF NOT EXISTS ...
   ```
5. ✅ **Dokumentasikan setiap migration** dengan comments
6. ✅ **Jangan edit migration yang sudah di-apply** - buat migration baru
7. ✅ **Gunakan descriptive names** untuk migration files

## Troubleshooting

### Error: "relation already exists"
**Solution:** Migration sudah pernah dijalankan. Skip atau gunakan `IF NOT EXISTS`

### Error: "permission denied"
**Solution:** Pastikan user memiliki permissions yang cukup. Gunakan `service_role` key untuk admin operations.

### Error: "schema does not exist"
**Solution:** Run migrations secara berurutan. Schema harus dibuat dulu (file 001).

### Error: "foreign key constraint violation"
**Solution:** Pastikan referensi table sudah ada sebelum membuat foreign key.

## Monitoring

### Check migration status
```bash
supabase migration list
```

### View migration history
```sql
SELECT * FROM supabase_migrations.schema_migrations ORDER BY version;
```

### Check table counts
```sql
SELECT 
  schemaname, 
  tablename, 
  n_live_tup as row_count
FROM pg_stat_user_tables
WHERE schemaname IN ('master', 'sales', 'production', 'inventory', 'finance')
ORDER BY schemaname, tablename;
```

## Support

- Supabase CLI Docs: https://supabase.com/docs/guides/cli
- Migration Guide: https://supabase.com/docs/guides/cli/managing-migrations
- Database Structure: Lihat `../DATABASE_STRUCTURE.md`
