# Database Schema Documentation

## Overview
Database ini menggunakan PostgreSQL dengan schema organization untuk memisahkan concerns berbeda dalam aplikasi.

## Schemas

### 1. Sales Schema
Schema untuk manajemen sales, customer, dan quotation.

#### Tables:

**sales.customers**
- Master data customer dengan informasi lengkap
- Fields: code, name, contact_person, phone, email, address, accurate_id, dll
- Mendukung categorization: industry_category, region, segment, lead_source

**sales.price_formulas**
- Formula harga untuk produk (Polos, Offset, Boks, Roto)
- Menyimpan specifications, material costs, process costs dalam JSONB
- Auto-generate code: FO (Offset), FB (Boks), FR (Roto), FP (Polos)

**sales.quotations**
- Penawaran harga ke customer
- Auto-generate quotation_number: SQ.YYYY.MM.XXXXX
- Fields: tanggal, valid_until, sales_person, catatan, job_type, npwp, dll
- Support PPN Inc/Exc, DP percentage, biaya lain

**sales.quotation_items**
- Item detail dari quotation
- Fields: nama_item, deskripsi, qty, satuan, harga_satuan, diskon, total_harga

**sales.pipeline**
- Sales pipeline/opportunities tracking
- Terintegrasi dengan pipeline_stages dan pipeline_activities
- Support follow-up tracking

**sales.pipeline_follow_ups**
- Follow-up activities untuk pipeline
- Auto-generate follow_up_number: FU-YYYYMMDD-XXXX
- Track: aktivitas, hasil, next follow-up

**sales.pipeline_stages**
- Master tahapan pipeline dengan probability
- Default stages: Lead (10%), Qualified (25%), Proposal (50%), Negotiation (75%), Closed Won (100%), Closed Lost (0%)

**sales.orders**
- Sales orders dari quotation yang diapprove
- Support payment tracking dan delivery

### 2. Master Schema
Schema untuk master data dan configurations.

#### Tables:

**master.product_types**
- Master jenis produk: Polos, Offset, Boks, Roto
- Extended types: Kantong PE, Kantong PP, Standing Pouch, dll

**master.material_types**
- Master jenis bahan dengan properties JSONB
- Categories: plastik, karton, tinta, lem, kertas
- Properties: ketebalan_mikron, warna, density, dll

**master.standard_sizes**
- Master ukuran standar produk
- Dimensions: width, length, height
- Categories: kantong, boks, lembaran, roll

**master.production_processes**
- Master proses produksi dengan cost per unit
- Categories: cetak, potong, lipat, lem, finishing
- Support machine & capacity info

**master.finishing_options**
- Master opsi finishing dengan berbagai tipe biaya
- Categories: laminating, emboss, spot_uv, die_cut, handle
- Cost types: per_sqm, per_pcs, per_setup, percentage, per_1000pcs

**master.industry_categories**
- Kategori industri customer
- Examples: Food & Beverage, Retail, FMCG, Pharmaceutical, dll

**master.lead_sources**
- Sumber lead/prospek
- Types: website, referral, event, social_media, direct, telemarketing, dll

**master.regions**
- Wilayah sales coverage
- Dengan coverage_area (array of cities)

**master.segments**
- Segmentasi customer
- With JSONB criteria for flexibility

### 3. Production Schema
Schema untuk manufacturing processes (not detailed in this doc).

### 4. Inventory Schema
Schema untuk materials dan stock management (not detailed in this doc).

### 5. Finance Schema
Schema untuk financial transactions (not detailed in this doc).

## Auto-Generated Codes

### Quotation Number
Format: `SQ.YYYY.MM.XXXXX`
- SQ = Sales Quotation
- YYYY = Year
- MM = Month
- XXXXX = Sequential number per month (padded to 5 digits)

### Price Formula Code
Format: `FX-YYYY-XXXX`
- FO = Formula Offset
- FB = Formula Boks
- FR = Formula Roto
- FP = Formula Polos
- YYYY = Year
- XXXX = Sequential number per year per type

### Follow-up Number
Format: `FU-YYYYMMDD-XXXX`
- FU = Follow Up
- YYYYMMDD = Date
- XXXX = Sequential number per day

## Migrations

Migrations ada di folder `supabase/migrations/` dengan naming convention:
`YYYYMMDDHHMMSS_description.sql`

### Migration History:
1. `20260413000001_create_schemas.sql` - Create base schemas
2. `20260413000002_create_master_tables.sql` - Master tables
3. `20260413000003_create_sales_tables.sql` - Sales tables
4. `20260413000015_create_additional_sales_tables.sql` - Additional sales tables
5. `20260413000017_create_pipeline_followup_table.sql` - Pipeline follow-ups
6. `20260418000003_master_tables_for_price_formula.sql` - Price formula master data
7. `20260420000001_update_sales_quotation_schema.sql` - Update quotation schema
8. `20260420000002_seed_sales_master_data.sql` - Seed master data
9. `20260420000003_seed_product_types.sql` - Seed product types
10. `20260420000004_update_rls_policies.sql` - Update RLS policies

## Row Level Security (RLS)

Semua tabel menggunakan RLS untuk security.

### Policies:
- **Authenticated users**: Can read all records
- **Authenticated users**: Can insert/update/delete their own records
- **Service role**: Full access to all tables

## Triggers

### Auto-update `updated_at`
Function: `update_updated_at_column()`
- Auto-update timestamp saat record di-update

### Auto-generate Numbers
- `generate_quotation_number()` - Auto-generate quotation number
- `generate_follow_up_number()` - Auto-generate follow-up number
- Price formula code di-generate di application layer

## Indexes

Indexes dibuat untuk:
- Foreign keys
- Frequently queried columns (status, dates, codes)
- Search fields (name, code)

## JSONB Fields

JSONB digunakan untuk flexibility:

1. **price_formulas.specifications** - All form fields
2. **price_formulas.material_costs** - Breakdown of material costs
3. **price_formulas.process_costs** - Breakdown of process costs
4. **material_types.properties** - Material properties (ketebalan, warna, dll)
5. **segments.criteria** - Segmentation criteria

## Best Practices

1. Always use UUID for primary keys
2. Use soft delete (`deleted_at`) when applicable
3. Track audit info (`created_by`, `updated_by`, `created_at`, `updated_at`)
4. Use JSONB for flexible/dynamic data
5. Create indexes for frequently queried columns
6. Use proper constraints (UNIQUE, NOT NULL, CHECK)
7. Write descriptive comments for tables and columns

## Environment Variables

Required for connection:
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (for admin operations)

## Development Workflow

1. Create migration file in `supabase/migrations/`
2. Test migration locally
3. Apply to development database
4. Review and test
5. Deploy to production

## Support

For issues or questions about database schema, contact development team.
