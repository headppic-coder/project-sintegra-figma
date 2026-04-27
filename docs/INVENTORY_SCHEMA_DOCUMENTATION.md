# Dokumentasi Database Schema Inventory Management dengan FIFO

## Overview

Database schema ini dirancang untuk sistem ERP dengan fitur inventory management menggunakan metode FIFO (First In First Out). Semua data disimpan dalam tabel `kv_store_6a7942bb` dengan struktur key-value menggunakan JSONB.

---

## Struktur Tabel Master

### 1. Master Jenis Persediaan (Inventory Types)

**Key Pattern:** `inventory_type:{id}`

**Tujuan:** Menentukan apakah item memiliki stock, menggunakan FIFO, atau merupakan jasa.

**Fields:**
- `id` - ID unik
- `code` - Kode jenis persediaan (STOCK, NON_STOCK, SERVICE, CONSIGNMENT)
- `name` - Nama jenis persediaan
- `has_stock` - Boolean, apakah ada persediaan fisik
- `has_fifo` - Boolean, apakah menggunakan metode FIFO
- `description` - Deskripsi
- `is_active` - Status aktif

**Jenis yang Tersedia:**
1. **STOCK** - Barang dengan stock (FIFO aktif)
2. **NON_STOCK** - Barang tanpa stock (misal: konsinyasi, titipan)
3. **SERVICE** - Jasa/layanan
4. **CONSIGNMENT** - Barang konsinyasi di gudang

**Query Example:**
```sql
-- Ambil semua inventory types
SELECT value FROM kv_store_6a7942bb WHERE key = 'inventory_type:index';

-- Ambil detail inventory type tertentu
SELECT value FROM kv_store_6a7942bb WHERE key = 'inventory_type:1';
```

---

### 2. Master Jenis Barang (Item Types)

**Key Pattern:** `item_type:{id}`

**Tujuan:** Klasifikasi utama barang dalam sistem ERP.

**Fields:**
- `id` - ID unik
- `code` - Kode jenis barang
- `name` - Nama jenis barang
- `inventory_type_id` - Referensi ke inventory type
- `description` - Deskripsi
- `is_active` - Status aktif
- `has_subtypes` - Boolean, apakah memiliki sub-jenis

**Jenis yang Tersedia:**
1. **RAW_MATERIAL** - Bahan Baku (ada subtypes)
2. **AUXILIARY_MATERIAL** - Bahan Pembantu (ada subtypes)
3. **SPARE_PART** - Sparepart (ada subtypes)
4. **ASSET** - Aset (ada subtypes)
5. **FINISHED_GOOD** - Barang Jadi
6. **WIP** - Work in Process
7. **PACKAGING** - Kemasan (ada subtypes)
8. **CONSUMABLE** - Barang Habis Pakai (ada subtypes)

**Query Example:**
```sql
-- Ambil semua item types
SELECT value FROM kv_store_6a7942bb WHERE key = 'item_type:index';

-- Ambil item type Bahan Baku
SELECT value FROM kv_store_6a7942bb WHERE key = 'item_type:1';
```

---

### 3. Master Sub-Jenis Barang (Item Subtypes)

**Key Pattern:** `item_subtype:{id}`

**Tujuan:** Klasifikasi turunan dari jenis barang.

**Fields:**
- `id` - ID unik
- `code` - Kode sub-jenis
- `name` - Nama sub-jenis
- `item_type_id` - Referensi ke item type
- `description` - Deskripsi
- `is_active` - Status aktif

**Sub-types untuk Bahan Baku (item_type_id: 1):**
- RAW_PAPER - Kertas
- RAW_PLASTIC - Plastik/Film
- RAW_METALIC - Metalis
- RAW_FOIL - Aluminium Foil
- RAW_ZIPPER - Zipper/Resleting
- RAW_BASE - Alas/Bottom
- RAW_INK - Tinta/Ink
- RAW_ADHESIVE - Perekat/Adhesive

**Sub-types untuk Bahan Pembantu (item_type_id: 2):**
- AUX_CHEMICAL - Bahan Kimia
- AUX_SOLVENT - Pelarut/Solvent
- AUX_COATING - Coating/Pelapis

**Sub-types untuk Sparepart (item_type_id: 3):**
- SP_MECHANICAL - Sparepart Mekanik (bearing, gear, belt, dll)
- SP_ELECTRICAL - Sparepart Elektrik (motor, switch, sensor, dll)
- SP_PNEUMATIC - Sparepart Pneumatik (valve, cylinder, dll)
- SP_HYDRAULIC - Sparepart Hidrolik

**Sub-types untuk Aset (item_type_id: 4):**
- ASSET_MACHINE - Mesin Produksi
- ASSET_VEHICLE - Kendaraan
- ASSET_EQUIPMENT - Peralatan
- ASSET_FURNITURE - Furniture

**Sub-types untuk Kemasan (item_type_id: 7):**
- PKG_BOX - Kardus/Box
- PKG_POUCH - Pouch/Kantong
- PKG_LABEL - Label/Sticker

**Sub-types untuk Barang Habis Pakai (item_type_id: 8):**
- CON_OFFICE - ATK/Kantor
- CON_CLEANING - Kebersihan
- CON_SAFETY - Safety/K3

**Query Example:**
```sql
-- Ambil semua subtypes untuk Bahan Baku (item_type_id: 1)
SELECT value FROM kv_store_6a7942bb WHERE key = 'item_subtype:by_item_type:1';

-- Ambil detail subtype Plastik
SELECT value FROM kv_store_6a7942bb WHERE key = 'item_subtype:2';
```

---

### 4. Master Items/Barang

**Key Pattern:** `item:{id}`

**Tujuan:** Master data barang/item dengan informasi lengkap.

**Fields:**
- `id` - ID unik (format: ITM00001)
- `code` - Kode barang (custom, misal: FILM-BOPP-001)
- `name` - Nama barang
- `inventory_type_id` - Referensi ke inventory type
- `item_type_id` - Referensi ke item type
- `item_subtype_id` - Referensi ke item subtype
- `description` - Deskripsi barang
- `unit` - Unit utama (KG, PCS, ROLL, dll)
- `unit_alt` - Unit alternatif (optional)
- `conversion_factor` - Faktor konversi antar unit
- `specifications` - JSONB untuk spesifikasi teknis
- `pricing` - JSONB untuk data harga
  - `standard_cost` - Harga standar
  - `average_cost` - Harga rata-rata (auto-calculated)
  - `last_purchase_price` - Harga pembelian terakhir
  - `selling_price` - Harga jual
- `stock_control` - JSONB untuk kontrol stock
  - `min_stock` - Minimum stock
  - `max_stock` - Maximum stock
  - `reorder_point` - Titik pemesanan ulang
  - `lead_time_days` - Lead time pembelian (hari)
- `supplier_info` - JSONB untuk info supplier
- `is_active` - Status aktif
- `created_at`, `created_by`, `updated_at` - Audit fields

**Query Example:**
```sql
-- Ambil semua items
SELECT value FROM kv_store_6a7942bb WHERE key = 'item:index';

-- Ambil detail item tertentu
SELECT value FROM kv_store_6a7942bb WHERE key = 'item:ITM00001';

-- Cari item berdasarkan kode (requires JSONB query)
SELECT key, value FROM kv_store_6a7942bb 
WHERE key LIKE 'item:%' 
  AND value->>'code' = 'FILM-BOPP-001';

-- Cari semua items dengan item_type Bahan Baku
SELECT key, value FROM kv_store_6a7942bb 
WHERE key LIKE 'item:%' 
  AND value->>'item_type_id' = '1';
```

---

### 5. Master Gudang (Warehouses)

**Key Pattern:** `warehouse:{id}`

**Fields:**
- `id` - ID unik
- `code` - Kode gudang
- `name` - Nama gudang
- `address` - Alamat
- `type` - Jenis gudang (main, raw_material, finished_goods)
- `is_active` - Status aktif

**Query Example:**
```sql
SELECT value FROM kv_store_6a7942bb WHERE key = 'warehouse:WH001';
```

---

### 6. Master Jenis Transaksi (Transaction Types)

**Key Pattern:** `transaction_type:{code}`

**Fields:**
- `code` - Kode transaksi
- `name` - Nama transaksi
- `direction` - Arah (IN/OUT/TRANSFER)
- `affects_fifo` - Boolean, apakah mempengaruhi FIFO
- `description` - Deskripsi

**Jenis Transaksi:**
- **IN_PURCHASE** - Pembelian
- **IN_PRODUCTION** - Hasil Produksi
- **IN_RETURN** - Retur dari Customer
- **IN_ADJUSTMENT** - Penyesuaian Tambah
- **OUT_SALES** - Penjualan
- **OUT_PRODUCTION** - Pemakaian Produksi
- **OUT_WASTE** - Waste/Scrap
- **OUT_ADJUSTMENT** - Penyesuaian Kurang
- **TRANSFER** - Transfer Antar Gudang

---

## Struktur Tabel Transaksi

### 7. Stock Batches (untuk FIFO)

**Key Pattern:** `stock_batch:{id}`

**Tujuan:** Mencatat setiap batch penerimaan barang untuk implementasi FIFO.

**Fields:**
- `id` - ID unik (format: BATCH00001)
- `item_id` - Referensi ke item
- `warehouse_id` - Referensi ke warehouse
- `batch_number` - Nomor batch (bisa dari supplier atau internal)
- `receipt_date` - Tanggal penerimaan
- `quantity_in` - Jumlah awal masuk
- `quantity_remaining` - Jumlah tersisa (berkurang saat ada pengeluaran)
- `unit` - Satuan
- `unit_cost` - Harga per unit pada batch ini
- `total_cost` - Total nilai batch
- `reference_type` - Jenis dokumen (purchase_order, production_order, dll)
- `reference_id` - ID dokumen referensi
- `expiry_date` - Tanggal kadaluarsa (optional)
- `lot_number` - Nomor lot (optional)
- `status` - Status (active, depleted, expired)
- `created_at`, `created_by` - Audit fields

**Index:**
- `stock_batch:index` - Semua batch IDs
- `stock_batch:by_item:{item_id}` - Batch IDs per item
- `stock_batch:by_warehouse:{warehouse_id}` - Batch IDs per warehouse

**Contoh Insert Batch Baru:**
```sql
-- 1. Get next counter
SELECT value->>'current' FROM kv_store_6a7942bb WHERE key = 'counter:stock_batch';

-- 2. Insert batch baru
INSERT INTO kv_store_6a7942bb (key, value) VALUES
('stock_batch:BATCH00001', '{
  "id": "BATCH00001",
  "item_id": "ITM00001",
  "warehouse_id": "WH003",
  "batch_number": "PO-2026-001-001",
  "receipt_date": "2026-04-23",
  "quantity_in": 1000,
  "quantity_remaining": 1000,
  "unit": "KG",
  "unit_cost": 45000,
  "total_cost": 45000000,
  "reference_type": "purchase_order",
  "reference_id": "PO-2026-001",
  "status": "active",
  "created_at": "2026-04-23T10:30:00Z",
  "created_by": "user-123"
}'::jsonb);

-- 3. Update counter
UPDATE kv_store_6a7942bb 
SET value = jsonb_set(value, '{current}', '1')
WHERE key = 'counter:stock_batch';

-- 4. Update index
UPDATE kv_store_6a7942bb 
SET value = jsonb_set(
  value, 
  '{ids}', 
  (value->'ids')::jsonb || '["BATCH00001"]'::jsonb
)
WHERE key = 'stock_batch:index';
```

---

### 8. Stock Movements (Transaksi Stock)

**Key Pattern:** `stock_movement:{id}`

**Tujuan:** Mencatat setiap transaksi keluar-masuk barang.

**Fields:**
- `id` - ID unik (format: MOV00001)
- `movement_number` - Nomor transaksi (bisa dari dokumen)
- `transaction_type` - Jenis transaksi (IN_PURCHASE, OUT_SALES, dll)
- `item_id` - Referensi ke item
- `warehouse_id` - Referensi ke warehouse (dari/ke)
- `warehouse_dest_id` - Warehouse tujuan (untuk TRANSFER)
- `quantity` - Jumlah (positif untuk IN, negatif untuk OUT)
- `unit` - Satuan
- `unit_cost` - Harga per unit
- `total_cost` - Total nilai transaksi
- `batch_id` - Referensi ke batch (untuk OUT menggunakan FIFO)
- `batch_ids` - Array batch IDs (jika pengeluaran menggunakan multiple batches)
- `reference_type` - Jenis dokumen (purchase_order, sales_order, work_order, dll)
- `reference_id` - ID dokumen referensi
- `movement_date` - Tanggal transaksi
- `notes` - Catatan
- `created_at`, `created_by` - Audit fields

**Index:**
- `stock_movement:index` - Semua movement IDs
- `stock_movement:by_item:{item_id}` - Movement IDs per item
- `stock_movement:by_date:{YYYY-MM}` - Movement IDs per bulan

**Contoh Insert Movement (Penerimaan):**
```sql
INSERT INTO kv_store_6a7942bb (key, value) VALUES
('stock_movement:MOV00001', '{
  "id": "MOV00001",
  "movement_number": "RCV-2026-001",
  "transaction_type": "IN_PURCHASE",
  "item_id": "ITM00001",
  "warehouse_id": "WH003",
  "quantity": 1000,
  "unit": "KG",
  "unit_cost": 45000,
  "total_cost": 45000000,
  "batch_id": "BATCH00001",
  "reference_type": "purchase_order",
  "reference_id": "PO-2026-001",
  "movement_date": "2026-04-23",
  "notes": "Penerimaan dari supplier XYZ",
  "created_at": "2026-04-23T10:30:00Z",
  "created_by": "user-123"
}'::jsonb);
```

**Contoh Insert Movement (Pengeluaran dengan FIFO):**
```sql
-- Saat mengeluarkan 500 KG, sistem harus:
-- 1. Cari batch tertua yang masih aktif (quantity_remaining > 0)
-- 2. Ambil dari batch tersebut
-- 3. Update quantity_remaining di batch
-- 4. Catat movement dengan batch_id

INSERT INTO kv_store_6a7942bb (key, value) VALUES
('stock_movement:MOV00002', '{
  "id": "MOV00002",
  "movement_number": "OUT-2026-001",
  "transaction_type": "OUT_PRODUCTION",
  "item_id": "ITM00001",
  "warehouse_id": "WH003",
  "quantity": -500,
  "unit": "KG",
  "unit_cost": 45000,
  "total_cost": 22500000,
  "batch_id": "BATCH00001",
  "reference_type": "work_order",
  "reference_id": "WO-2026-001",
  "movement_date": "2026-04-23",
  "notes": "Pemakaian untuk produksi",
  "created_at": "2026-04-23T14:00:00Z",
  "created_by": "user-123"
}'::jsonb);

-- Update batch: kurangi quantity_remaining
UPDATE kv_store_6a7942bb 
SET value = jsonb_set(
  value, 
  '{quantity_remaining}', 
  to_jsonb((value->>'quantity_remaining')::numeric - 500)
)
WHERE key = 'stock_batch:BATCH00001';
```

---

### 9. Stock Summary (Ringkasan Stock)

**Key Pattern:** `stock_summary:{item_id}:{warehouse_id}`

**Tujuan:** Ringkasan stock per item per gudang (untuk query cepat).

**Fields:**
- `item_id` - ID item
- `warehouse_id` - ID warehouse
- `quantity_on_hand` - Total quantity di gudang
- `quantity_reserved` - Quantity yang sudah dialokasi/reserved
- `quantity_available` - Quantity tersedia (on_hand - reserved)
- `average_cost` - Harga rata-rata tertimbang
- `total_value` - Total nilai stock (quantity × average_cost)
- `last_movement_date` - Tanggal transaksi terakhir
- `last_movement_id` - ID transaksi terakhir
- `updated_at` - Tanggal update terakhir

**Contoh:**
```sql
INSERT INTO kv_store_6a7942bb (key, value) VALUES
('stock_summary:ITM00001:WH003', '{
  "item_id": "ITM00001",
  "warehouse_id": "WH003",
  "quantity_on_hand": 500,
  "quantity_reserved": 0,
  "quantity_available": 500,
  "average_cost": 45000,
  "total_value": 22500000,
  "last_movement_date": "2026-04-23",
  "last_movement_id": "MOV00002",
  "updated_at": "2026-04-23T14:00:00Z"
}'::jsonb);
```

**Query Stock Summary:**
```sql
-- Stock per item di semua gudang
SELECT key, value FROM kv_store_6a7942bb 
WHERE key LIKE 'stock_summary:ITM00001:%';

-- Stock semua item di gudang tertentu
SELECT key, value FROM kv_store_6a7942bb 
WHERE key LIKE 'stock_summary:%:WH003';

-- Total stock value per gudang
SELECT 
  value->>'warehouse_id' as warehouse_id,
  SUM((value->>'total_value')::numeric) as total_stock_value
FROM kv_store_6a7942bb 
WHERE key LIKE 'stock_summary:%'
GROUP BY value->>'warehouse_id';
```

---

## Implementasi Logika FIFO

### Algoritma FIFO untuk Pengeluaran Barang

Ketika ada pengeluaran barang (OUT), sistem harus:

1. **Query batch aktif yang tersedia**, diurutkan dari yang tertua:
```sql
SELECT key, value FROM kv_store_6a7942bb 
WHERE key LIKE 'stock_batch:%'
  AND value->>'item_id' = 'ITM00001'
  AND value->>'warehouse_id' = 'WH003'
  AND value->>'status' = 'active'
  AND (value->>'quantity_remaining')::numeric > 0
ORDER BY value->>'receipt_date' ASC;
```

2. **Ambil dari batch tertua sampai quantity terpenuhi:**

Misal: butuh pengeluaran 1500 KG
- Batch 1: tersisa 1000 KG (receipt_date: 2026-04-01)
- Batch 2: tersisa 800 KG (receipt_date: 2026-04-15)

Maka:
- Ambil 1000 KG dari Batch 1 → Batch 1 habis (status: depleted)
- Ambil 500 KG dari Batch 2 → Batch 2 tersisa 300 KG

3. **Catat movement untuk setiap batch yang diambil:**
```sql
-- Movement dari Batch 1
INSERT INTO kv_store_6a7942bb (key, value) VALUES
('stock_movement:MOV00003', '{
  "id": "MOV00003",
  "transaction_type": "OUT_PRODUCTION",
  "item_id": "ITM00001",
  "quantity": -1000,
  "batch_id": "BATCH00001",
  "unit_cost": 45000
  ...
}'::jsonb);

-- Movement dari Batch 2
INSERT INTO kv_store_6a7942bb (key, value) VALUES
('stock_movement:MOV00004', '{
  "id": "MOV00004",
  "transaction_type": "OUT_PRODUCTION",
  "item_id": "ITM00001",
  "quantity": -500,
  "batch_id": "BATCH00002",
  "unit_cost": 46000
  ...
}'::jsonb);
```

4. **Update batch quantity_remaining dan status:**
```sql
-- Batch 1 habis
UPDATE kv_store_6a7942bb 
SET value = jsonb_set(
  jsonb_set(value, '{quantity_remaining}', '0'),
  '{status}', '"depleted"'
)
WHERE key = 'stock_batch:BATCH00001';

-- Batch 2 tersisa 300
UPDATE kv_store_6a7942bb 
SET value = jsonb_set(value, '{quantity_remaining}', '300')
WHERE key = 'stock_batch:BATCH00002';
```

5. **Update stock summary:**
```sql
-- Hitung ulang quantity_on_hand dan average_cost
-- Average cost = weighted average dari semua batch aktif
```

---

## Contoh Lengkap: Flow Transaksi

### A. Penerimaan Barang dari Pembelian

**Skenario:** Terima 2000 KG Film BOPP dari PO-2026-002

```sql
-- 1. Buat stock batch baru
INSERT INTO kv_store_6a7942bb (key, value) VALUES
('stock_batch:BATCH00002', '{
  "id": "BATCH00002",
  "item_id": "ITM00001",
  "warehouse_id": "WH003",
  "batch_number": "PO-2026-002-001",
  "receipt_date": "2026-04-24",
  "quantity_in": 2000,
  "quantity_remaining": 2000,
  "unit": "KG",
  "unit_cost": 46000,
  "total_cost": 92000000,
  "reference_type": "purchase_order",
  "reference_id": "PO-2026-002",
  "status": "active",
  "created_at": "2026-04-24T09:00:00Z"
}'::jsonb);

-- 2. Catat stock movement
INSERT INTO kv_store_6a7942bb (key, value) VALUES
('stock_movement:MOV00005', '{
  "id": "MOV00005",
  "movement_number": "RCV-2026-002",
  "transaction_type": "IN_PURCHASE",
  "item_id": "ITM00001",
  "warehouse_id": "WH003",
  "quantity": 2000,
  "unit": "KG",
  "unit_cost": 46000,
  "total_cost": 92000000,
  "batch_id": "BATCH00002",
  "reference_type": "purchase_order",
  "reference_id": "PO-2026-002",
  "movement_date": "2026-04-24",
  "created_at": "2026-04-24T09:00:00Z"
}'::jsonb);

-- 3. Update stock summary
-- Misal sebelumnya: 500 KG @ Rp 45,000 = Rp 22,500,000
-- Sekarang tambah: 2000 KG @ Rp 46,000 = Rp 92,000,000
-- Total: 2500 KG, Total Value: Rp 114,500,000
-- Average Cost: Rp 114,500,000 / 2500 = Rp 45,800

UPDATE kv_store_6a7942bb 
SET value = '{
  "item_id": "ITM00001",
  "warehouse_id": "WH003",
  "quantity_on_hand": 2500,
  "quantity_reserved": 0,
  "quantity_available": 2500,
  "average_cost": 45800,
  "total_value": 114500000,
  "last_movement_date": "2026-04-24",
  "last_movement_id": "MOV00005",
  "updated_at": "2026-04-24T09:00:00Z"
}'::jsonb
WHERE key = 'stock_summary:ITM00001:WH003';
```

### B. Pengeluaran Barang untuk Produksi

**Skenario:** Pakai 1800 KG Film BOPP untuk Work Order WO-2026-005

```sql
-- 1. Query batch aktif (FIFO - tertua dulu)
-- Didapat:
-- - BATCH00001: 500 KG @ Rp 45,000 (2026-04-23)
-- - BATCH00002: 2000 KG @ Rp 46,000 (2026-04-24)

-- 2a. Ambil 500 KG dari BATCH00001 (habis)
INSERT INTO kv_store_6a7942bb (key, value) VALUES
('stock_movement:MOV00006', '{
  "id": "MOV00006",
  "movement_number": "OUT-2026-002-1",
  "transaction_type": "OUT_PRODUCTION",
  "item_id": "ITM00001",
  "warehouse_id": "WH003",
  "quantity": -500,
  "unit": "KG",
  "unit_cost": 45000,
  "total_cost": 22500000,
  "batch_id": "BATCH00001",
  "reference_type": "work_order",
  "reference_id": "WO-2026-005",
  "movement_date": "2026-04-25",
  "created_at": "2026-04-25T10:00:00Z"
}'::jsonb);

-- Update BATCH00001
UPDATE kv_store_6a7942bb 
SET value = jsonb_set(
  jsonb_set(value, '{quantity_remaining}', '0'),
  '{status}', '"depleted"'
)
WHERE key = 'stock_batch:BATCH00001';

-- 2b. Ambil 1300 KG dari BATCH00002 (sisa 700)
INSERT INTO kv_store_6a7942bb (key, value) VALUES
('stock_movement:MOV00007', '{
  "id": "MOV00007",
  "movement_number": "OUT-2026-002-2",
  "transaction_type": "OUT_PRODUCTION",
  "item_id": "ITM00001",
  "warehouse_id": "WH003",
  "quantity": -1300,
  "unit": "KG",
  "unit_cost": 46000,
  "total_cost": 59800000,
  "batch_id": "BATCH00002",
  "reference_type": "work_order",
  "reference_id": "WO-2026-005",
  "movement_date": "2026-04-25",
  "created_at": "2026-04-25T10:00:00Z"
}'::jsonb);

-- Update BATCH00002
UPDATE kv_store_6a7942bb 
SET value = jsonb_set(value, '{quantity_remaining}', '700')
WHERE key = 'stock_batch:BATCH00002';

-- 3. Update stock summary
-- Total cost keluar: Rp 22,500,000 + Rp 59,800,000 = Rp 82,300,000
-- Stock tersisa: 700 KG
-- Value tersisa: Rp 114,500,000 - Rp 82,300,000 = Rp 32,200,000
-- Average cost: Rp 32,200,000 / 700 = Rp 46,000 (karena semua dari BATCH00002)

UPDATE kv_store_6a7942bb 
SET value = '{
  "item_id": "ITM00001",
  "warehouse_id": "WH003",
  "quantity_on_hand": 700,
  "quantity_reserved": 0,
  "quantity_available": 700,
  "average_cost": 46000,
  "total_value": 32200000,
  "last_movement_date": "2026-04-25",
  "last_movement_id": "MOV00007",
  "updated_at": "2026-04-25T10:00:00Z"
}'::jsonb
WHERE key = 'stock_summary:ITM00001:WH003';
```

---

## Query Umum

### 1. Lihat Stock per Item di Semua Gudang
```sql
SELECT 
  value->>'warehouse_id' as warehouse,
  value->>'quantity_on_hand' as qty,
  value->>'unit' as unit,
  value->>'average_cost' as avg_cost,
  value->>'total_value' as value
FROM kv_store_6a7942bb 
WHERE key LIKE 'stock_summary:ITM00001:%';
```

### 2. Lihat Batch Aktif untuk Item Tertentu
```sql
SELECT 
  value->>'id' as batch_id,
  value->>'batch_number' as batch_no,
  value->>'receipt_date' as date,
  value->>'quantity_remaining' as qty,
  value->>'unit_cost' as cost
FROM kv_store_6a7942bb 
WHERE key LIKE 'stock_batch:%'
  AND value->>'item_id' = 'ITM00001'
  AND value->>'status' = 'active'
ORDER BY value->>'receipt_date' ASC;
```

### 3. Laporan Stock Opname
```sql
SELECT 
  i.value->>'code' as item_code,
  i.value->>'name' as item_name,
  s.value->>'warehouse_id' as warehouse,
  s.value->>'quantity_on_hand' as quantity,
  i.value->>'unit' as unit,
  s.value->>'average_cost' as avg_cost,
  s.value->>'total_value' as total_value
FROM kv_store_6a7942bb s
JOIN kv_store_6a7942bb i ON i.key = 'item:' || (s.value->>'item_id')
WHERE s.key LIKE 'stock_summary:%'
ORDER BY i.value->>'code';
```

### 4. History Transaksi Item
```sql
SELECT 
  value->>'movement_number' as trx_no,
  value->>'transaction_type' as type,
  value->>'movement_date' as date,
  value->>'quantity' as qty,
  value->>'unit_cost' as cost,
  value->>'reference_type' as ref_type,
  value->>'reference_id' as ref_id
FROM kv_store_6a7942bb 
WHERE key LIKE 'stock_movement:%'
  AND value->>'item_id' = 'ITM00001'
ORDER BY value->>'movement_date' DESC, value->>'created_at' DESC
LIMIT 50;
```

### 5. Kartu Stock (Stock Card)
```sql
WITH movements AS (
  SELECT 
    value->>'movement_date' as date,
    value->>'movement_number' as doc_no,
    value->>'transaction_type' as type,
    (value->>'quantity')::numeric as qty,
    (value->>'unit_cost')::numeric as cost,
    value->>'created_at' as created_at
  FROM kv_store_6a7942bb 
  WHERE key LIKE 'stock_movement:%'
    AND value->>'item_id' = 'ITM00001'
    AND value->>'warehouse_id' = 'WH003'
  ORDER BY value->>'movement_date', value->>'created_at'
)
SELECT 
  date,
  doc_no,
  type,
  CASE WHEN qty > 0 THEN qty ELSE 0 END as qty_in,
  CASE WHEN qty < 0 THEN ABS(qty) ELSE 0 END as qty_out,
  SUM(qty) OVER (ORDER BY date, created_at) as balance
FROM movements;
```

---

## Best Practices

### 1. Transaksi Atomik
Selalu gunakan transaksi database untuk operasi yang melibatkan multiple tables/keys:
```sql
BEGIN;
  -- Insert batch
  -- Insert movement
  -- Update stock summary
  -- Update counters
COMMIT;
```

### 2. Update Average Cost
Setiap kali ada IN/OUT, hitung ulang average cost menggunakan weighted average:
```
New Average Cost = Total Stock Value / Total Quantity
```

### 3. Reserved Quantity
Untuk Work Order atau Sales Order yang sudah dikonfirmasi tapi belum dikeluarkan, update `quantity_reserved` di stock summary.

### 4. Audit Trail
Selalu isi `created_at`, `created_by`, `updated_at` untuk audit trail.

### 5. Batch Status
Update status batch:
- `active` - Masih ada stock
- `depleted` - Sudah habis
- `expired` - Kadaluarsa (jika ada expiry_date)

### 6. Index Management
Selalu update index setelah insert/delete data:
- `{entity}:index`
- `{entity}:by_{parent}:{parent_id}`

---

## Migration & Setup

### Jalankan Migration
```bash
# Apply migration
supabase db reset

# Atau manual
psql -h localhost -U postgres -d postgres -f supabase/migrations/20260423000001_create_inventory_kv_schema.sql
```

### Verifikasi Data
```sql
-- Cek semua inventory types
SELECT key, value FROM kv_store_6a7942bb WHERE key LIKE 'inventory_type:%' ORDER BY key;

-- Cek semua item types
SELECT key, value FROM kv_store_6a7942bb WHERE key LIKE 'item_type:%' ORDER BY key;

-- Cek semua subtypes
SELECT key, value FROM kv_store_6a7942bb WHERE key LIKE 'item_subtype:%' ORDER BY key;

-- Cek dokumentasi
SELECT value FROM kv_store_6a7942bb WHERE key = 'schema:documentation';
```

---

## Extending the Schema

### Menambah Jenis Barang Baru
```sql
-- 1. Insert item type baru
INSERT INTO kv_store_6a7942bb (key, value) VALUES
('item_type:9', '{
  "id": "9",
  "code": "TOOLS",
  "name": "Peralatan Kerja",
  ...
}'::jsonb);

-- 2. Update index
UPDATE kv_store_6a7942bb 
SET value = jsonb_set(
  value, 
  '{ids}', 
  (value->'ids')::jsonb || '["9"]'::jsonb
)
WHERE key = 'item_type:index';
```

### Menambah Sub-Jenis Baru
```sql
-- Insert subtype
INSERT INTO kv_store_6a7942bb (key, value) VALUES
('item_subtype:26', '{
  "id": "26",
  "code": "RAW_RUBBER",
  "name": "Karet",
  "item_type_id": "1",
  ...
}'::jsonb);

-- Update indexes
-- ... (sama seperti di atas)
```

---

## Kesimpulan

Database schema ini menyediakan struktur lengkap untuk:

✅ **Master Data** yang terstruktur dan fleksibel
✅ **FIFO Implementation** yang akurat untuk stock costing
✅ **Audit Trail** lengkap untuk semua transaksi
✅ **Scalable** dengan key-value pattern
✅ **Query Performance** dengan proper indexing
✅ **Flexible** dengan JSONB untuk specifications dan metadata

Sistem ini siap digunakan untuk ERP dengan kebutuhan inventory management yang kompleks.
