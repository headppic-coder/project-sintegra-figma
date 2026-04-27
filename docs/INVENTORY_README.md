# Sistem Inventory Management dengan FIFO

## 📋 Overview

Sistem inventory management lengkap untuk ERP yang menggunakan metode FIFO (First In First Out) untuk perhitungan biaya persediaan. Semua data disimpan dalam tabel `kv_store_6a7942bb` dengan struktur key-value menggunakan PostgreSQL JSONB.

## 🎯 Fitur Utama

✅ **Master Data Lengkap**
- Jenis Persediaan (Stock/Non-Stock/Jasa/Konsinyasi)
- Jenis Barang (Bahan Baku, Bahan Pembantu, Sparepart, Aset, Barang Jadi, WIP, dll)
- Sub-Jenis Barang (Kertas, Plastik, Metalis, Foil, Zipper, Mekanik, Elektrik, dll)
- Master Items dengan spesifikasi lengkap
- Master Gudang
- Jenis Transaksi

✅ **FIFO Implementation**
- Automatic batch tracking untuk setiap penerimaan
- First In First Out untuk pengeluaran barang
- Weighted average cost calculation
- Batch status tracking (active/depleted/expired)

✅ **Stock Management**
- Penerimaan barang (Purchase, Production, Return, Adjustment)
- Pengeluaran barang (Sales, Production Usage, Waste, Adjustment)
- Transfer antar gudang
- Stock reservation
- Real-time stock summary

✅ **Reporting**
- Stock summary per item per gudang
- Active batches dengan FIFO order
- Stock card dengan running balance
- Stock valuation
- Low stock alerts

## 📁 File Structure

```
supabase/migrations/
├── 20260423000001_create_inventory_kv_schema.sql    # Schema & master data
├── 20260423000002_create_inventory_fifo_functions.sql # Helper functions
└── 20260423000003_test_inventory_fifo.sql           # Test scenarios

docs/
├── INVENTORY_README.md                    # This file
├── INVENTORY_SCHEMA_DOCUMENTATION.md      # Dokumentasi lengkap
└── INVENTORY_FIFO_FUNCTIONS.sql          # Function reference
```

## 🚀 Quick Start

### 1. Apply Migrations

```bash
# Via Supabase CLI
supabase db reset

# Atau manual via psql
psql -h YOUR_HOST -U postgres -d YOUR_DB -f supabase/migrations/20260423000001_create_inventory_kv_schema.sql
psql -h YOUR_HOST -U postgres -d YOUR_DB -f supabase/migrations/20260423000002_create_inventory_fifo_functions.sql
```

### 2. Test the System (Optional)

```bash
# Jalankan test scenarios
psql -h YOUR_HOST -U postgres -d YOUR_DB -f supabase/migrations/20260423000003_test_inventory_fifo.sql
```

### 3. Verify Installation

```sql
-- Cek master data
SELECT COUNT(*) FROM kv_store_6a7942bb WHERE key LIKE 'inventory_type:%';
-- Expected: 5 rows (4 types + 1 index)

SELECT COUNT(*) FROM kv_store_6a7942bb WHERE key LIKE 'item_type:%';
-- Expected: 9 rows (8 types + 1 index)

SELECT COUNT(*) FROM kv_store_6a7942bb WHERE key LIKE 'item_subtype:%';
-- Expected: 32 rows (25 subtypes + 1 main index + 6 by_item_type indexes)

-- Cek functions
SELECT routine_name FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name LIKE '%stock%'
ORDER BY routine_name;
-- Expected: 8 functions

-- Cek views
SELECT table_name FROM information_schema.views
WHERE table_schema = 'public'
  AND table_name LIKE 'v_%'
ORDER BY table_name;
-- Expected: v_active_batches, v_stock_summary
```

## 📚 Usage Examples

### Penerimaan Barang (Stock IN)

```sql
-- Terima 1000 KG Film BOPP @ Rp 45,000 dari PO-2026-001
SELECT complete_stock_in_transaction(
  'ITM00001',           -- item_id
  'WH003',              -- warehouse_id
  1000,                 -- quantity
  'KG',                 -- unit
  45000,                -- unit_cost
  'IN_PURCHASE',        -- transaction_type
  'purchase_order',     -- reference_type
  'PO-2026-001',        -- reference_id
  'RCV-2026-001',       -- movement_number
  NULL,                 -- batch_number (auto)
  'Penerimaan dari Supplier ABC',
  'user-123'            -- created_by
);
```

### Pengeluaran Barang (Stock OUT dengan FIFO)

```sql
-- Pakai 800 KG Film BOPP untuk produksi
SELECT complete_stock_out_transaction(
  'ITM00001',           -- item_id
  'WH003',              -- warehouse_id
  800,                  -- quantity
  'OUT_PRODUCTION',     -- transaction_type
  'work_order',         -- reference_type
  'WO-2026-001',        -- reference_id
  'OUT-2026-001',       -- movement_number
  'Pemakaian untuk Work Order #001',
  'user-123'            -- created_by
);
```

### Lihat Stock Summary

```sql
SELECT
  item_code,
  item_name,
  warehouse_name,
  quantity_on_hand,
  unit,
  average_cost,
  total_value
FROM v_stock_summary
WHERE item_code = 'FILM-BOPP-001';
```

### Lihat Active Batches (FIFO Order)

```sql
SELECT
  batch_number,
  receipt_date,
  quantity_remaining,
  unit_cost,
  reference_id
FROM v_active_batches
WHERE item_code = 'FILM-BOPP-001'
  AND warehouse_id = 'WH003'
ORDER BY receipt_date;
```

### Kartu Stock (Stock Card)

```sql
WITH movements AS (
  SELECT
    (value->>'movement_date')::DATE as date,
    value->>'movement_number' as doc_no,
    value->>'transaction_type' as type,
    (value->>'quantity')::NUMERIC as qty,
    (value->>'unit_cost')::NUMERIC as cost,
    value->>'created_at' as created_at
  FROM kv_store_6a7942bb
  WHERE key LIKE 'stock_movement:%'
    AND value->>'item_id' = 'ITM00001'
  ORDER BY value->>'movement_date', value->>'created_at'
)
SELECT
  date,
  doc_no,
  type,
  CASE WHEN qty > 0 THEN qty ELSE 0 END as qty_in,
  CASE WHEN qty < 0 THEN ABS(qty) ELSE 0 END as qty_out,
  cost,
  SUM(qty) OVER (ORDER BY date, created_at) as balance
FROM movements;
```

## 📊 Master Data Available

### Inventory Types
- **STOCK** - Barang dengan stock (FIFO aktif)
- **NON_STOCK** - Barang tanpa stock
- **SERVICE** - Jasa/layanan
- **CONSIGNMENT** - Barang konsinyasi

### Item Types
1. **RAW_MATERIAL** - Bahan Baku
2. **AUXILIARY_MATERIAL** - Bahan Pembantu
3. **SPARE_PART** - Sparepart
4. **ASSET** - Aset
5. **FINISHED_GOOD** - Barang Jadi
6. **WIP** - Work in Process
7. **PACKAGING** - Kemasan
8. **CONSUMABLE** - Barang Habis Pakai

### Item Subtypes (Contoh)

**Bahan Baku:**
- Kertas, Plastik, Metalis, Foil, Zipper, Alas, Tinta, Perekat

**Sparepart:**
- Mekanik, Elektrik, Pneumatik, Hidrolik

**Aset:**
- Mesin, Kendaraan, Peralatan, Furniture

### Transaction Types
- **IN_PURCHASE** - Pembelian
- **IN_PRODUCTION** - Hasil Produksi
- **IN_RETURN** - Retur dari Customer
- **IN_ADJUSTMENT** - Penyesuaian Tambah
- **OUT_SALES** - Penjualan
- **OUT_PRODUCTION** - Pemakaian Produksi
- **OUT_WASTE** - Waste/Scrap
- **OUT_ADJUSTMENT** - Penyesuaian Kurang
- **TRANSFER** - Transfer Antar Gudang

## 🔧 Helper Functions

| Function | Deskripsi |
|----------|-----------|
| `get_next_counter(entity_type)` | Generate ID berikutnya |
| `create_stock_batch(...)` | Buat batch baru untuk FIFO |
| `get_active_batches(item_id, warehouse_id)` | Ambil batch aktif (FIFO order) |
| `process_stock_in(...)` | Proses penerimaan barang |
| `process_fifo_out(...)` | Proses pengeluaran dengan FIFO |
| `update_stock_summary(...)` | Update ringkasan stock |
| `complete_stock_in_transaction(...)` | Transaksi IN lengkap |
| `complete_stock_out_transaction(...)` | Transaksi OUT lengkap dengan FIFO |

## 📈 Reports & Queries

### Stock Opname
```sql
SELECT
  item_code,
  item_name,
  warehouse_name,
  quantity_on_hand,
  unit,
  average_cost,
  total_value
FROM v_stock_summary
WHERE quantity_on_hand > 0
ORDER BY warehouse_name, item_code;
```

### Low Stock Alert
```sql
SELECT
  i.value->>'code' as item_code,
  i.value->>'name' as item_name,
  s.warehouse_name,
  s.quantity_on_hand,
  (i.value->'stock_control'->>'reorder_point')::NUMERIC as reorder_point
FROM v_stock_summary s
JOIN kv_store_6a7942bb i ON i.key = 'item:' || s.item_id
WHERE s.quantity_on_hand <= (i.value->'stock_control'->>'reorder_point')::NUMERIC
ORDER BY s.warehouse_name, i.value->>'code';
```

### Total Stock Value
```sql
SELECT
  warehouse_name,
  COUNT(DISTINCT item_id) as item_count,
  SUM(total_value) as total_value
FROM v_stock_summary
GROUP BY warehouse_name;
```

## 🎓 Learn More

Untuk dokumentasi lengkap, lihat:
- **[INVENTORY_SCHEMA_DOCUMENTATION.md](./INVENTORY_SCHEMA_DOCUMENTATION.md)** - Penjelasan detail struktur database, field, dan contoh penggunaan
- **[INVENTORY_FIFO_FUNCTIONS.sql](./INVENTORY_FIFO_FUNCTIONS.sql)** - Reference lengkap semua functions dengan contoh

## 🔐 Security

- Semua tabel menggunakan Row Level Security (RLS)
- Authenticated users dapat membaca semua data
- Write operations dikontrol melalui functions
- Audit trail: created_at, created_by, updated_at di setiap record

## ⚠️ Important Notes

1. **Transaksi Atomik**: Gunakan transactions untuk operasi yang melibatkan multiple records
2. **Average Cost**: Dihitung ulang setiap kali ada IN/OUT menggunakan weighted average
3. **Batch Status**: Otomatis berubah menjadi "depleted" ketika quantity_remaining = 0
4. **FIFO Logic**: Pengeluaran SELALU mengambil dari batch tertua terlebih dahulu
5. **Reserved Quantity**: Untuk allocation (belum dikeluarkan) gunakan field `quantity_reserved`

## 🐛 Troubleshooting

### Error: "Insufficient stock"
Cek stock available:
```sql
SELECT * FROM v_stock_summary WHERE item_id = 'ITM00001';
SELECT * FROM v_active_batches WHERE item_id = 'ITM00001';
```

### Summary tidak match dengan batches
Jalankan ulang update:
```sql
SELECT update_stock_summary('ITM00001', 'WH003');
```

### Counter tidak increment
Reset counter:
```sql
UPDATE kv_store_6a7942bb
SET value = jsonb_set(value, '{current}', '0')
WHERE key = 'counter:stock_batch';
```

## 📞 Support

Untuk pertanyaan atau issue, silakan buka issue di repository atau hubungi tim development.

---

**Version:** 1.0.0  
**Last Updated:** 2026-04-23  
**Author:** Development Team
