# Database Structure Documentation

## Overview
Database ini menggunakan **PostgreSQL** dengan organisasi **schema-based** untuk memisahkan tabel berdasarkan fitur/modul aplikasi.

## Database Schemas

### 1. **master** - Master Data & Configurations
Menyimpan data master yang digunakan oleh seluruh sistem.

**Tables:**
- `categories` - Kategori untuk produk, material, dan proses
- `materials` - Data material (film, adhesive, tinta, dll)
- `process_costs` - Biaya proses produksi standar
- `product_types` - Template tipe produk
- `settings` - Konfigurasi sistem

**Use Cases:**
- Manajemen master data material
- Konfigurasi biaya proses
- Pengaturan aplikasi

---

### 2. **sales** - Sales & Customer Management
Mengelola data customer, quotation, dan penjualan.

**Tables:**
- `customers` - Data customer/pelanggan
- `prospective_customers` - Data calon customer/prospek
- `pipeline` - Pipeline sales dari lead hingga closing
- `pipeline_follow_ups` - Aktivitas follow-up pipeline
- `pipeline_logs` - Log histori perubahan pipeline
- `price_formulas` - Formula harga (Polos, Offset, Boks, Roto)
- `quotations` - Penawaran harga ke customer
- `quotation_items` - Item detail quotation
- `orders` - Sales order dari customer
- `delivery_requests` - Permintaan pengiriman
- `delivery_notes` - Surat jalan pengiriman
- `lead_sources` - Master sumber lead
- `regions` - Master wilayah
- `segments` - Master segmen customer
- `industry_categories` - Master kategori industri
- `sales_activities` - Master aktivitas sales
- `pipeline_stages` - Master stage pipeline

**Use Cases:**
- Manajemen customer & prospek
- Pipeline management & follow-up tracking
- Log histori perubahan data pipeline
- Perhitungan formula harga
- Pembuatan quotation
- Proses sales order
- Manajemen pengiriman

**Key Features:**
- Pipeline dengan auto-logging setiap perubahan data
- Formula harga tersimpan dengan semua spesifikasi di field JSONB
- Tracking status quotation: draft → sent → approved/rejected → converted
- Hubungan quotation → order
- Link pipeline ke customer terdaftar
- Multiple product types per pipeline
- Estimasi harga dan kontak customer
- Follow-up tracking dengan reminder

---

### 3. **production** - Manufacturing & Production
Mengelola work order, proses produksi, dan quality control.

**Tables:**
- `work_orders` - Work order produksi
- `process_steps` - Langkah-langkah proses per work order
- `material_usage` - Pemakaian material aktual
- `quality_checks` - Quality control/inspection
- `machines` - Data mesin produksi
- `machine_usage` - Log pemakaian mesin

**Use Cases:**
- Manajemen work order
- Tracking proses produksi
- Quality control
- Monitoring penggunaan mesin

**Key Features:**
- Work order terhubung ke sales order
- Multi-step process tracking
- Actual vs planned comparison
- Quality check dengan defect tracking

---

### 4. **inventory** - Inventory & Warehouse Management
Mengelola stock, warehouse, dan purchase order.

**Tables:**
- `warehouses` - Data gudang/lokasi penyimpanan
- `stock` - Stock level per material per warehouse
- `stock_transactions` - Log transaksi stock
- `purchase_orders` - Purchase order ke supplier
- `purchase_order_items` - Item PO
- `stock_adjustments` - Penyesuaian stock
- `stock_adjustment_items` - Detail adjustment

**Use Cases:**
- Manajemen warehouse
- Stock tracking real-time
- Purchase order management
- Stock adjustment/opname

**Key Features:**
- Reserved quantity untuk work order
- Auto-calculation available quantity
- Min/max stock level alerts
- Stock transaction history
- Auto-update stock dari transactions

---

### 5. **finance** - Finance & Accounting
Mengelola invoice, payment, expenses, dan accounting.

**Tables:**
- `invoices` - Invoice ke customer
- `invoice_items` - Item detail invoice
- `payments` - Pembayaran dari customer
- `expenses` - Pengeluaran/biaya
- `accounts` - Chart of accounts
- `journal_entries` - Jurnal umum
- `journal_entry_lines` - Detail jurnal

**Use Cases:**
- Invoice management
- Payment tracking
- Expense recording
- Basic accounting

**Key Features:**
- Auto-calculate invoice total (subtotal - discount + tax)
- Auto-update invoice status based on payments
- Chart of accounts untuk accounting
- Journal entry system

---

## Database Features

### 1. **Auto-Updated Timestamps**
Semua tabel memiliki trigger untuk auto-update `updated_at` field saat data berubah.

### 2. **Audit Trail**
Hampir semua tabel memiliki:
- `created_at` - Kapan data dibuat
- `updated_at` - Kapan data terakhir diupdate
- `created_by` - Siapa yang membuat (reference ke auth.users)
- `updated_by` - Siapa yang mengupdate

### 3. **Row Level Security (RLS)**
Semua tabel memiliki RLS enabled dengan policies:
- Authenticated users: dapat membaca semua data
- Service role: full access
- Custom policies untuk write operations

### 4. **JSONB Fields untuk Flexibility**
Beberapa tabel menggunakan JSONB untuk data yang struktur nya fleksibel:
- `sales.price_formulas.specifications` - Semua field formula harga
- `master.materials.specification` - Spesifikasi material
- `master.settings.value` - Nilai konfigurasi

### 5. **Generated Columns**
- `inventory.stock.available_quantity` - Auto calculated: quantity - reserved_quantity
- `finance.invoices.outstanding_amount` - Auto calculated: total_amount - paid_amount

### 6. **Useful Views**
- `inventory.stock_with_details` - Stock dengan info material dan warehouse, plus stock status (normal/low/critical)

---

## Database Functions

### 1. **update_updated_at_column()**
Automatically update `updated_at` timestamp pada BEFORE UPDATE

### 2. **generate_sequence_number(prefix, schema, table, column)**
Generate nomor urut dengan prefix untuk document numbers
```sql
SELECT generate_sequence_number('INV-', 'finance', 'invoices', 'invoice_number');
-- Returns: INV-000001, INV-000002, dst
```

### 3. **calculate_invoice_total()**
Auto-calculate invoice total including tax and discount

### 4. **update_invoice_payment_status()**
Auto-update invoice status (unpaid/partial/paid) based on payments

### 5. **update_stock_from_transaction()**
Auto-update stock level when stock transaction is created

---

## Migration Files

1. `20260413000001_create_schemas.sql` - Create all schemas
2. `20260413000002_create_master_tables.sql` - Master schema tables
3. `20260413000003_create_sales_tables.sql` - Sales schema tables
4. `20260413000004_create_production_tables.sql` - Production schema tables
5. `20260413000005_create_inventory_tables.sql` - Inventory schema tables
6. `20260413000006_create_finance_tables.sql` - Finance schema tables
7. `20260413000007_create_functions_triggers.sql` - Functions & triggers
8. `20260413000008_seed_data.sql` - Initial sample data

---

## How to Apply Migrations

### Using Supabase CLI:
```bash
# Link to your Supabase project
supabase link --project-ref your-project-ref

# Push migrations to Supabase
supabase db push

# Or reset database and apply all migrations
supabase db reset
```

### Manual SQL:
Run each migration file in order (001 → 008) di Supabase SQL Editor.

---

## Database Diagram (Simplified)

```
┌─────────────────┐
│  auth.users     │ (Supabase Auth)
└────────┬────────┘
         │
         ├─────────────────────────────────────────┐
         │                                         │
┌────────▼────────┐                      ┌────────▼────────┐
│  sales          │                      │  production     │
├─────────────────┤                      ├─────────────────┤
│ customers       │──┐                   │ work_orders     │
│ price_formulas  │  │                   │ process_steps   │
│ quotations      │  │                   │ material_usage  │
│ orders          │  │                   │ machines        │
└────────┬────────┘  │                   └────────┬────────┘
         │           │                            │
         │           │    ┌─────────────┐         │
         │           └────▶  master     ◀─────────┘
         │                │ materials   │
         │                │ categories  │
         │                │ process_costs│
         │                └──────┬──────┘
         │                       │
┌────────▼────────┐     ┌────────▼────────┐
│  finance        │     │  inventory      │
├─────────────────┤     ├─────────────────┤
│ invoices        │     │ stock           │
│ payments        │     │ warehouses      │
│ expenses        │     │ purchase_orders │
│ accounts        │     │ stock_trans...  │
└─────────────────┘     └─────────────────┘
```

---

## Best Practices

1. **Always use schemas untuk query:**
   ```sql
   SELECT * FROM sales.customers;  -- ✅ Good
   SELECT * FROM customers;         -- ❌ Ambiguous
   ```

2. **Gunakan UUIDs untuk primary keys** - Lebih aman dan scalable

3. **Manfaatkan JSONB** untuk data yang struktur nya bisa berubah

4. **Gunakan transactions** untuk operasi yang melibatkan multiple tables

5. **Set proper indexes** - Sudah dibuat di migration files

6. **Enable RLS** - Sudah enabled di semua tabel

---

## Support & Documentation

- Supabase Docs: https://supabase.com/docs
- PostgreSQL Docs: https://www.postgresql.org/docs/
- Schema Design Best Practices: https://supabase.com/docs/guides/database/tables