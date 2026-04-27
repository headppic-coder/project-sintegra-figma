# Inventory System - Quick Guide (Tanpa Migration)

## 🚀 Setup Cepat

### 1. Install Master Data

Jalankan file ini di Supabase SQL Editor:

```bash
# Copy isi file SETUP_INVENTORY_DIRECT.sql
# Paste ke Supabase SQL Editor > Run
```

Atau langsung dari psql:
```bash
psql -h YOUR_HOST -U postgres -d YOUR_DB -f docs/SETUP_INVENTORY_DIRECT.sql
```

### 2. Verifikasi

```sql
-- Cek master data sudah ada
SELECT key, value->>'name' as name 
FROM kv_store_6a7942bb 
WHERE key LIKE 'inventory_type:%' 
  AND key != 'inventory_type:index'
ORDER BY key;

-- Cek total data
SELECT 
  'Inventory Types' as type, COUNT(*) as total FROM kv_store_6a7942bb WHERE key LIKE 'inventory_type:%' AND key != '%:index'
UNION ALL
SELECT 
  'Item Types' as type, COUNT(*) as total FROM kv_store_6a7942bb WHERE key LIKE 'item_type:%' AND key != '%:index'
UNION ALL
SELECT 
  'Item Subtypes' as type, COUNT(*) as total FROM kv_store_6a7942bb WHERE key LIKE 'item_subtype:%' AND key != '%:index' AND key NOT LIKE '%:by_%'
UNION ALL
SELECT 
  'Warehouses' as type, COUNT(*) as total FROM kv_store_6a7942bb WHERE key LIKE 'warehouse:%' AND key != '%:index';
```

---

## 📝 Menambah Schema Baru

### Tambah Jenis Barang Baru

```sql
-- 1. Insert item type baru
INSERT INTO kv_store_6a7942bb (key, value) VALUES
('item_type:9', '{
  "id": "9",
  "code": "TOOLS",
  "name": "Peralatan Kerja",
  "inventory_type_id": "1",
  "description": "Peralatan kerja dan tools",
  "is_active": true,
  "has_subtypes": true,
  "created_at": "2026-04-23T00:00:00Z"
}'::jsonb)
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;

-- 2. Update index
UPDATE kv_store_6a7942bb 
SET value = jsonb_set(
  value,
  '{ids}',
  (value->'ids')::jsonb || '["9"]'::jsonb
),
value = jsonb_set(value, '{updated_at}', to_jsonb(NOW()))
WHERE key = 'item_type:index';
```

### Tambah Sub-Jenis Barang

```sql
-- 1. Insert subtype
INSERT INTO kv_store_6a7942bb (key, value) VALUES
('item_subtype:26', '{
  "id": "26",
  "code": "TOOLS_HAND",
  "name": "Hand Tools",
  "item_type_id": "9",
  "description": "Peralatan tangan manual",
  "is_active": true,
  "created_at": "2026-04-23T00:00:00Z"
}'::jsonb)
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;

-- 2. Update main index
UPDATE kv_store_6a7942bb 
SET value = jsonb_set(
  value,
  '{ids}',
  (value->'ids')::jsonb || '["26"]'::jsonb
),
value = jsonb_set(value, '{updated_at}', to_jsonb(NOW()))
WHERE key = 'item_subtype:index';

-- 3. Update atau insert index per item_type
INSERT INTO kv_store_6a7942bb (key, value) VALUES
('item_subtype:by_item_type:9', '{
  "item_type_id": "9",
  "subtype_ids": ["26"],
  "updated_at": "2026-04-23T00:00:00Z"
}'::jsonb)
ON CONFLICT (key) DO UPDATE 
SET value = jsonb_set(
  kv_store_6a7942bb.value,
  '{subtype_ids}',
  (kv_store_6a7942bb.value->'subtype_ids')::jsonb || '["26"]'::jsonb
);
```

### Tambah Gudang Baru

```sql
-- Insert warehouse baru
INSERT INTO kv_store_6a7942bb (key, value) VALUES
('warehouse:WH004', '{
  "id": "WH004",
  "code": "GD-WIP",
  "name": "Gudang WIP",
  "address": "Jl. Industri No. 126",
  "type": "wip",
  "is_active": true,
  "created_at": "2026-04-23T00:00:00Z"
}'::jsonb)
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;

-- Update index
UPDATE kv_store_6a7942bb 
SET value = jsonb_set(
  value,
  '{ids}',
  (value->'ids')::jsonb || '["WH004"]'::jsonb
)
WHERE key = 'warehouse:index';
```

---

## 🛠️ Operasi Inventory

### Tambah Item/Barang Baru

```sql
-- 1. Get next ID
SELECT get_next_counter('item'); 
-- Returns: ITM00001

-- 2. Insert item
INSERT INTO kv_store_6a7942bb (key, value) VALUES
('item:ITM00001', '{
  "id": "ITM00001",
  "code": "FILM-BOPP-001",
  "name": "Film BOPP 20 Micron Transparant",
  "inventory_type_id": "1",
  "item_type_id": "1",
  "item_subtype_id": "2",
  "description": "Film BOPP untuk kemasan",
  "unit": "KG",
  "unit_alt": "ROLL",
  "conversion_factor": 100,
  "specifications": {
    "thickness": "20 micron",
    "width": "1000 mm",
    "color": "Transparant"
  },
  "pricing": {
    "standard_cost": 45000,
    "average_cost": 0,
    "last_purchase_price": 0
  },
  "stock_control": {
    "min_stock": 500,
    "max_stock": 5000,
    "reorder_point": 1000,
    "lead_time_days": 14
  },
  "is_active": true,
  "created_at": "2026-04-23T00:00:00Z"
}'::jsonb)
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;

-- 3. Update index
UPDATE kv_store_6a7942bb 
SET value = jsonb_set(
  value,
  '{ids}',
  (value->'ids')::jsonb || '["ITM00001"]'::jsonb
)
WHERE key = 'item:index';
```

### Penerimaan Barang (IN)

```sql
-- Gunakan function helper
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
  NULL                  -- created_by
);
```

### Pengeluaran Barang (OUT dengan FIFO)

```sql
-- Gunakan function helper
SELECT complete_stock_out_transaction(
  'ITM00001',           -- item_id
  'WH003',              -- warehouse_id
  500,                  -- quantity
  'OUT_PRODUCTION',     -- transaction_type
  'work_order',         -- reference_type
  'WO-2026-001',        -- reference_id
  'OUT-2026-001',       -- movement_number
  'Pemakaian untuk produksi',
  NULL                  -- created_by
);
```

---

## 📊 Query Data

### Lihat Master Data

```sql
-- List semua inventory types
SELECT 
  value->>'code' as code,
  value->>'name' as name,
  value->>'has_stock' as has_stock,
  value->>'has_fifo' as has_fifo
FROM kv_store_6a7942bb 
WHERE key LIKE 'inventory_type:%' 
  AND key != 'inventory_type:index'
ORDER BY value->>'code';

-- List semua item types
SELECT 
  value->>'code' as code,
  value->>'name' as name,
  value->>'has_subtypes' as has_subtypes
FROM kv_store_6a7942bb 
WHERE key LIKE 'item_type:%'
  AND key != 'item_type:index'
ORDER BY value->>'id';

-- List subtypes untuk item_type tertentu
SELECT 
  s.value->>'code' as code,
  s.value->>'name' as name
FROM kv_store_6a7942bb idx,
LATERAL jsonb_array_elements_text(idx.value->'subtype_ids') AS subtype_id
JOIN kv_store_6a7942bb s ON s.key = 'item_subtype:' || subtype_id
WHERE idx.key = 'item_subtype:by_item_type:1'  -- Item Type ID
ORDER BY s.value->>'code';
```

### Lihat Stock

```sql
-- Stock summary semua item
SELECT 
  item_code,
  item_name,
  warehouse_name,
  quantity_on_hand,
  unit,
  average_cost,
  total_value
FROM v_stock_summary
ORDER BY item_code;

-- Active batches (FIFO order)
SELECT 
  item_code,
  batch_number,
  receipt_date,
  quantity_remaining,
  unit_cost
FROM v_active_batches
WHERE item_code = 'FILM-BOPP-001'
ORDER BY receipt_date;
```

### Kartu Stock

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

---

## 🔧 Edit/Update Data

### Update Master Data

```sql
-- Update item type
UPDATE kv_store_6a7942bb
SET value = jsonb_set(
  value,
  '{name}',
  '"Bahan Baku Produksi"'
),
value = jsonb_set(value, '{updated_at}', to_jsonb(NOW()))
WHERE key = 'item_type:1';

-- Update item
UPDATE kv_store_6a7942bb
SET value = jsonb_set(
  value,
  '{pricing,standard_cost}',
  '46000'
),
value = jsonb_set(value, '{updated_at}', to_jsonb(NOW()))
WHERE key = 'item:ITM00001';
```

### Non-aktifkan Data

```sql
-- Non-aktifkan item type
UPDATE kv_store_6a7942bb
SET value = jsonb_set(value, '{is_active}', 'false')
WHERE key = 'item_type:9';

-- Non-aktifkan item
UPDATE kv_store_6a7942bb
SET value = jsonb_set(value, '{is_active}', 'false')
WHERE key = 'item:ITM00001';
```

---

## 🗑️ Hapus Data

### Hapus dari Index

```sql
-- Hapus dari item_type:index
UPDATE kv_store_6a7942bb
SET value = jsonb_set(
  value,
  '{ids}',
  (
    SELECT jsonb_agg(id)
    FROM jsonb_array_elements_text(value->'ids') AS id
    WHERE id != '9'
  )
)
WHERE key = 'item_type:index';

-- Hapus record
DELETE FROM kv_store_6a7942bb WHERE key = 'item_type:9';
```

---

## 📋 Template Insert

### Template Item Type Baru

```sql
INSERT INTO kv_store_6a7942bb (key, value) VALUES
('item_type:NEW_ID', '{
  "id": "NEW_ID",
  "code": "YOUR_CODE",
  "name": "Your Name",
  "inventory_type_id": "1",
  "description": "Description here",
  "is_active": true,
  "has_subtypes": true,
  "created_at": "2026-04-23T00:00:00Z"
}'::jsonb)
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;
```

### Template Item Subtype Baru

```sql
INSERT INTO kv_store_6a7942bb (key, value) VALUES
('item_subtype:NEW_ID', '{
  "id": "NEW_ID",
  "code": "YOUR_CODE",
  "name": "Your Name",
  "item_type_id": "PARENT_ID",
  "description": "Description here",
  "is_active": true,
  "created_at": "2026-04-23T00:00:00Z"
}'::jsonb)
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;
```

### Template Item Baru

```sql
INSERT INTO kv_store_6a7942bb (key, value) VALUES
('item:ITEM_ID', '{
  "id": "ITEM_ID",
  "code": "ITEM-CODE-001",
  "name": "Item Name",
  "inventory_type_id": "1",
  "item_type_id": "1",
  "item_subtype_id": "1",
  "description": "Item description",
  "unit": "KG",
  "unit_alt": null,
  "conversion_factor": 1,
  "specifications": {},
  "pricing": {
    "standard_cost": 0,
    "average_cost": 0,
    "last_purchase_price": 0,
    "selling_price": 0
  },
  "stock_control": {
    "min_stock": 0,
    "max_stock": 0,
    "reorder_point": 0,
    "lead_time_days": 0
  },
  "supplier_info": {},
  "is_active": true,
  "created_at": "2026-04-23T00:00:00Z"
}'::jsonb)
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;
```

---

## 🎯 Best Practices

1. **Selalu gunakan `ON CONFLICT (key) DO UPDATE`** untuk insert yang bisa diulang
2. **Update index setelah insert** master data baru
3. **Gunakan functions helper** untuk transaksi stock (complete_stock_in_transaction, complete_stock_out_transaction)
4. **Backup data** sebelum delete atau update massal
5. **Validate data** sebelum insert (cek ID sudah unique, reference ID exists, dll)

---

## 🚨 Troubleshooting

### ID Counter tidak increment
```sql
-- Cek counter
SELECT value FROM kv_store_6a7942bb WHERE key = 'counter:item';

-- Reset counter (hati-hati!)
UPDATE kv_store_6a7942bb
SET value = jsonb_set(value, '{current}', '0')
WHERE key = 'counter:item';
```

### Index tidak sinkron
```sql
-- Rebuild index dari data aktual
UPDATE kv_store_6a7942bb
SET value = jsonb_build_object(
  'ids', (
    SELECT jsonb_agg(REPLACE(key, 'item:', ''))
    FROM kv_store_6a7942bb
    WHERE key LIKE 'item:ITM%'
    ORDER BY key
  ),
  'updated_at', NOW()
)
WHERE key = 'item:index';
```

---

## 📚 Resources

- Dokumentasi lengkap: `INVENTORY_SCHEMA_DOCUMENTATION.md`
- Function reference: `INVENTORY_FIFO_FUNCTIONS.sql`
- Setup script: `SETUP_INVENTORY_DIRECT.sql`
