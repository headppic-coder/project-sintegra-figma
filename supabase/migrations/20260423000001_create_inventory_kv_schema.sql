-- =====================================================
-- INVENTORY KV SCHEMA FOR ERP SYSTEM WITH FIFO
-- Using kv_store_6a7942bb table
-- =====================================================

-- This migration creates structured data in kv_store_6a7942bb for:
-- 1. Master Jenis Persediaan (Inventory Types)
-- 2. Master Jenis Barang (Item Types)
-- 3. Master Sub-Jenis Barang (Item Subtypes)
-- 4. Master Items/Barang
-- 5. Stock Batches (untuk FIFO)
-- 6. Stock Movements (transaksi)
-- 7. Stock Summary

-- =====================================================
-- 1. MASTER JENIS PERSEDIAAN (INVENTORY TYPES)
-- Key pattern: inventory_type:{id}
-- =====================================================
-- Menentukan apakah item ada stocknya, jasa, dll

INSERT INTO public.kv_store_6a7942bb (key, value) VALUES
('inventory_type:1', '{
  "id": "1",
  "code": "STOCK",
  "name": "Barang dengan Stock",
  "has_stock": true,
  "has_fifo": true,
  "description": "Barang fisik yang memiliki persediaan dan menggunakan metode FIFO",
  "is_active": true,
  "created_at": "2026-04-23T00:00:00Z"
}'::jsonb),

('inventory_type:2', '{
  "id": "2",
  "code": "NON_STOCK",
  "name": "Barang Non-Stock",
  "has_stock": false,
  "has_fifo": false,
  "description": "Barang yang tidak memiliki persediaan fisik (misal: barang konsinyasi, titipan)",
  "is_active": true,
  "created_at": "2026-04-23T00:00:00Z"
}'::jsonb),

('inventory_type:3', '{
  "id": "3",
  "code": "SERVICE",
  "name": "Jasa/Layanan",
  "has_stock": false,
  "has_fifo": false,
  "description": "Layanan atau jasa yang tidak memiliki persediaan",
  "is_active": true,
  "created_at": "2026-04-23T00:00:00Z"
}'::jsonb),

('inventory_type:4', '{
  "id": "4",
  "code": "CONSIGNMENT",
  "name": "Konsinyasi",
  "has_stock": true,
  "has_fifo": true,
  "description": "Barang konsinyasi yang ada di gudang tetapi bukan milik",
  "is_active": true,
  "created_at": "2026-04-23T00:00:00Z"
}'::jsonb);

-- Index untuk inventory types
INSERT INTO public.kv_store_6a7942bb (key, value) VALUES
('inventory_type:index', '{
  "ids": ["1", "2", "3", "4"],
  "updated_at": "2026-04-23T00:00:00Z"
}'::jsonb);


-- =====================================================
-- 2. MASTER JENIS BARANG (ITEM TYPES)
-- Key pattern: item_type:{id}
-- =====================================================
-- Klasifikasi utama barang: bahan baku, bahan pembantu, sparepart, aset, barang jadi, WIP

INSERT INTO public.kv_store_6a7942bb (key, value) VALUES
('item_type:1', '{
  "id": "1",
  "code": "RAW_MATERIAL",
  "name": "Bahan Baku",
  "inventory_type_id": "1",
  "description": "Bahan mentah yang digunakan untuk produksi",
  "is_active": true,
  "has_subtypes": true,
  "created_at": "2026-04-23T00:00:00Z"
}'::jsonb),

('item_type:2', '{
  "id": "2",
  "code": "AUXILIARY_MATERIAL",
  "name": "Bahan Pembantu",
  "inventory_type_id": "1",
  "description": "Bahan pendukung dalam proses produksi",
  "is_active": true,
  "has_subtypes": true,
  "created_at": "2026-04-23T00:00:00Z"
}'::jsonb),

('item_type:3', '{
  "id": "3",
  "code": "SPARE_PART",
  "name": "Sparepart",
  "inventory_type_id": "1",
  "description": "Suku cadang untuk mesin dan peralatan",
  "is_active": true,
  "has_subtypes": true,
  "created_at": "2026-04-23T00:00:00Z"
}'::jsonb),

('item_type:4', '{
  "id": "4",
  "code": "ASSET",
  "name": "Aset",
  "inventory_type_id": "1",
  "description": "Aset perusahaan (mesin, peralatan, kendaraan, dll)",
  "is_active": true,
  "has_subtypes": true,
  "created_at": "2026-04-23T00:00:00Z"
}'::jsonb),

('item_type:5', '{
  "id": "5",
  "code": "FINISHED_GOOD",
  "name": "Barang Jadi",
  "inventory_type_id": "1",
  "description": "Produk hasil produksi yang siap dijual",
  "is_active": true,
  "has_subtypes": false,
  "created_at": "2026-04-23T00:00:00Z"
}'::jsonb),

('item_type:6', '{
  "id": "6",
  "code": "WIP",
  "name": "Work in Process (WIP)",
  "inventory_type_id": "1",
  "description": "Barang setengah jadi yang masih dalam proses produksi",
  "is_active": true,
  "has_subtypes": false,
  "created_at": "2026-04-23T00:00:00Z"
}'::jsonb),

('item_type:7', '{
  "id": "7",
  "code": "PACKAGING",
  "name": "Kemasan",
  "inventory_type_id": "1",
  "description": "Bahan kemasan dan packaging",
  "is_active": true,
  "has_subtypes": true,
  "created_at": "2026-04-23T00:00:00Z"
}'::jsonb),

('item_type:8', '{
  "id": "8",
  "code": "CONSUMABLE",
  "name": "Barang Habis Pakai",
  "inventory_type_id": "1",
  "description": "Barang habis pakai untuk operasional",
  "is_active": true,
  "has_subtypes": true,
  "created_at": "2026-04-23T00:00:00Z"
}'::jsonb);

-- Index untuk item types
INSERT INTO public.kv_store_6a7942bb (key, value) VALUES
('item_type:index', '{
  "ids": ["1", "2", "3", "4", "5", "6", "7", "8"],
  "updated_at": "2026-04-23T00:00:00Z"
}'::jsonb);


-- =====================================================
-- 3. MASTER SUB-JENIS BARANG (ITEM SUBTYPES)
-- Key pattern: item_subtype:{id}
-- =====================================================
-- Turunan dari jenis barang (misal: kertas, plastik, metalis, foil untuk bahan baku)

-- Sub-types untuk Bahan Baku (RAW_MATERIAL)
INSERT INTO public.kv_store_6a7942bb (key, value) VALUES
('item_subtype:1', '{
  "id": "1",
  "code": "RAW_PAPER",
  "name": "Kertas",
  "item_type_id": "1",
  "description": "Bahan baku jenis kertas",
  "is_active": true,
  "created_at": "2026-04-23T00:00:00Z"
}'::jsonb),

('item_subtype:2', '{
  "id": "2",
  "code": "RAW_PLASTIC",
  "name": "Plastik",
  "item_type_id": "1",
  "description": "Bahan baku jenis plastik/film",
  "is_active": true,
  "created_at": "2026-04-23T00:00:00Z"
}'::jsonb),

('item_subtype:3', '{
  "id": "3",
  "code": "RAW_METALIC",
  "name": "Metalis",
  "item_type_id": "1",
  "description": "Bahan baku jenis metalis/metalik",
  "is_active": true,
  "created_at": "2026-04-23T00:00:00Z"
}'::jsonb),

('item_subtype:4', '{
  "id": "4",
  "code": "RAW_FOIL",
  "name": "Foil",
  "item_type_id": "1",
  "description": "Bahan baku jenis aluminium foil",
  "is_active": true,
  "created_at": "2026-04-23T00:00:00Z"
}'::jsonb),

('item_subtype:5', '{
  "id": "5",
  "code": "RAW_ZIPPER",
  "name": "Zipper/Resleting",
  "item_type_id": "1",
  "description": "Bahan baku zipper untuk kemasan",
  "is_active": true,
  "created_at": "2026-04-23T00:00:00Z"
}'::jsonb),

('item_subtype:6', '{
  "id": "6",
  "code": "RAW_BASE",
  "name": "Alas/Bottom",
  "item_type_id": "1",
  "description": "Bahan baku untuk alas kemasan",
  "is_active": true,
  "created_at": "2026-04-23T00:00:00Z"
}'::jsonb),

('item_subtype:7', '{
  "id": "7",
  "code": "RAW_INK",
  "name": "Tinta/Ink",
  "item_type_id": "1",
  "description": "Bahan baku tinta untuk printing",
  "is_active": true,
  "created_at": "2026-04-23T00:00:00Z"
}'::jsonb),

('item_subtype:8', '{
  "id": "8",
  "code": "RAW_ADHESIVE",
  "name": "Perekat/Adhesive",
  "item_type_id": "1",
  "description": "Bahan baku perekat/lem",
  "is_active": true,
  "created_at": "2026-04-23T00:00:00Z"
}'::jsonb);

-- Sub-types untuk Bahan Pembantu (AUXILIARY_MATERIAL)
INSERT INTO public.kv_store_6a7942bb (key, value) VALUES
('item_subtype:9', '{
  "id": "9",
  "code": "AUX_CHEMICAL",
  "name": "Bahan Kimia",
  "item_type_id": "2",
  "description": "Bahan kimia pembantu produksi",
  "is_active": true,
  "created_at": "2026-04-23T00:00:00Z"
}'::jsonb),

('item_subtype:10', '{
  "id": "10",
  "code": "AUX_SOLVENT",
  "name": "Pelarut/Solvent",
  "item_type_id": "2",
  "description": "Pelarut untuk produksi",
  "is_active": true,
  "created_at": "2026-04-23T00:00:00Z"
}'::jsonb),

('item_subtype:11', '{
  "id": "11",
  "code": "AUX_COATING",
  "name": "Coating/Pelapis",
  "item_type_id": "2",
  "description": "Bahan pelapis",
  "is_active": true,
  "created_at": "2026-04-23T00:00:00Z"
}'::jsonb);

-- Sub-types untuk Sparepart
INSERT INTO public.kv_store_6a7942bb (key, value) VALUES
('item_subtype:12', '{
  "id": "12",
  "code": "SP_MECHANICAL",
  "name": "Sparepart Mekanik",
  "item_type_id": "3",
  "description": "Suku cadang mekanik (bearing, gear, belt, dll)",
  "is_active": true,
  "created_at": "2026-04-23T00:00:00Z"
}'::jsonb),

('item_subtype:13', '{
  "id": "13",
  "code": "SP_ELECTRICAL",
  "name": "Sparepart Elektrik",
  "item_type_id": "3",
  "description": "Suku cadang elektrik (motor, switch, sensor, dll)",
  "is_active": true,
  "created_at": "2026-04-23T00:00:00Z"
}'::jsonb),

('item_subtype:14', '{
  "id": "14",
  "code": "SP_PNEUMATIC",
  "name": "Sparepart Pneumatik",
  "item_type_id": "3",
  "description": "Suku cadang pneumatik (valve, cylinder, dll)",
  "is_active": true,
  "created_at": "2026-04-23T00:00:00Z"
}'::jsonb),

('item_subtype:15', '{
  "id": "15",
  "code": "SP_HYDRAULIC",
  "name": "Sparepart Hidrolik",
  "item_type_id": "3",
  "description": "Suku cadang hidrolik",
  "is_active": true,
  "created_at": "2026-04-23T00:00:00Z"
}'::jsonb);

-- Sub-types untuk Aset
INSERT INTO public.kv_store_6a7942bb (key, value) VALUES
('item_subtype:16', '{
  "id": "16",
  "code": "ASSET_MACHINE",
  "name": "Mesin Produksi",
  "item_type_id": "4",
  "description": "Mesin untuk produksi",
  "is_active": true,
  "created_at": "2026-04-23T00:00:00Z"
}'::jsonb),

('item_subtype:17', '{
  "id": "17",
  "code": "ASSET_VEHICLE",
  "name": "Kendaraan",
  "item_type_id": "4",
  "description": "Kendaraan operasional",
  "is_active": true,
  "created_at": "2026-04-23T00:00:00Z"
}'::jsonb),

('item_subtype:18', '{
  "id": "18",
  "code": "ASSET_EQUIPMENT",
  "name": "Peralatan",
  "item_type_id": "4",
  "description": "Peralatan pendukung",
  "is_active": true,
  "created_at": "2026-04-23T00:00:00Z"
}'::jsonb),

('item_subtype:19', '{
  "id": "19",
  "code": "ASSET_FURNITURE",
  "name": "Furniture",
  "item_type_id": "4",
  "description": "Mebel dan furniture kantor",
  "is_active": true,
  "created_at": "2026-04-23T00:00:00Z"
}'::jsonb);

-- Sub-types untuk Kemasan
INSERT INTO public.kv_store_6a7942bb (key, value) VALUES
('item_subtype:20', '{
  "id": "20",
  "code": "PKG_BOX",
  "name": "Kardus/Box",
  "item_type_id": "7",
  "description": "Kemasan jenis kardus",
  "is_active": true,
  "created_at": "2026-04-23T00:00:00Z"
}'::jsonb),

('item_subtype:21', '{
  "id": "21",
  "code": "PKG_POUCH",
  "name": "Pouch/Kantong",
  "item_type_id": "7",
  "description": "Kemasan jenis pouch",
  "is_active": true,
  "created_at": "2026-04-23T00:00:00Z"
}'::jsonb),

('item_subtype:22', '{
  "id": "22",
  "code": "PKG_LABEL",
  "name": "Label/Sticker",
  "item_type_id": "7",
  "description": "Label dan sticker",
  "is_active": true,
  "created_at": "2026-04-23T00:00:00Z"
}'::jsonb);

-- Sub-types untuk Barang Habis Pakai
INSERT INTO public.kv_store_6a7942bb (key, value) VALUES
('item_subtype:23', '{
  "id": "23",
  "code": "CON_OFFICE",
  "name": "ATK/Kantor",
  "item_type_id": "8",
  "description": "Alat tulis kantor",
  "is_active": true,
  "created_at": "2026-04-23T00:00:00Z"
}'::jsonb),

('item_subtype:24', '{
  "id": "24",
  "code": "CON_CLEANING",
  "name": "Kebersihan",
  "item_type_id": "8",
  "description": "Bahan kebersihan",
  "is_active": true,
  "created_at": "2026-04-23T00:00:00Z"
}'::jsonb),

('item_subtype:25', '{
  "id": "25",
  "code": "CON_SAFETY",
  "name": "Safety/K3",
  "item_type_id": "8",
  "description": "Perlengkapan keselamatan kerja",
  "is_active": true,
  "created_at": "2026-04-23T00:00:00Z"
}'::jsonb);

-- Index untuk item subtypes
INSERT INTO public.kv_store_6a7942bb (key, value) VALUES
('item_subtype:index', '{
  "ids": ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12", "13", "14", "15", "16", "17", "18", "19", "20", "21", "22", "23", "24", "25"],
  "updated_at": "2026-04-23T00:00:00Z"
}'::jsonb);

-- Index per item type
INSERT INTO public.kv_store_6a7942bb (key, value) VALUES
('item_subtype:by_item_type:1', '{
  "item_type_id": "1",
  "subtype_ids": ["1", "2", "3", "4", "5", "6", "7", "8"],
  "updated_at": "2026-04-23T00:00:00Z"
}'::jsonb),

('item_subtype:by_item_type:2', '{
  "item_type_id": "2",
  "subtype_ids": ["9", "10", "11"],
  "updated_at": "2026-04-23T00:00:00Z"
}'::jsonb),

('item_subtype:by_item_type:3', '{
  "item_type_id": "3",
  "subtype_ids": ["12", "13", "14", "15"],
  "updated_at": "2026-04-23T00:00:00Z"
}'::jsonb),

('item_subtype:by_item_type:4', '{
  "item_type_id": "4",
  "subtype_ids": ["16", "17", "18", "19"],
  "updated_at": "2026-04-23T00:00:00Z"
}'::jsonb),

('item_subtype:by_item_type:7', '{
  "item_type_id": "7",
  "subtype_ids": ["20", "21", "22"],
  "updated_at": "2026-04-23T00:00:00Z"
}'::jsonb),

('item_subtype:by_item_type:8', '{
  "item_type_id": "8",
  "subtype_ids": ["23", "24", "25"],
  "updated_at": "2026-04-23T00:00:00Z"
}'::jsonb);


-- =====================================================
-- 4. COUNTER FOR AUTO-INCREMENT IDs
-- Key pattern: counter:{entity_type}
-- =====================================================

INSERT INTO public.kv_store_6a7942bb (key, value) VALUES
('counter:item', '{
  "current": 0,
  "prefix": "ITM",
  "updated_at": "2026-04-23T00:00:00Z"
}'::jsonb),

('counter:stock_batch', '{
  "current": 0,
  "prefix": "BATCH",
  "updated_at": "2026-04-23T00:00:00Z"
}'::jsonb),

('counter:stock_movement', '{
  "current": 0,
  "prefix": "MOV",
  "updated_at": "2026-04-23T00:00:00Z"
}'::jsonb);


-- =====================================================
-- 5. EXAMPLE: MASTER ITEMS/BARANG
-- Key pattern: item:{id}
-- =====================================================
-- Contoh beberapa items

INSERT INTO public.kv_store_6a7942bb (key, value) VALUES
('item:ITM00001', '{
  "id": "ITM00001",
  "code": "FILM-BOPP-001",
  "name": "Film BOPP 20 Micron Transparant",
  "inventory_type_id": "1",
  "item_type_id": "1",
  "item_subtype_id": "2",
  "description": "Film BOPP untuk kemasan, ketebalan 20 micron",
  "unit": "KG",
  "unit_alt": "ROLL",
  "conversion_factor": 100,
  "specifications": {
    "thickness": "20 micron",
    "width": "1000 mm",
    "color": "Transparant",
    "material": "BOPP"
  },
  "pricing": {
    "standard_cost": 45000,
    "average_cost": 0,
    "last_purchase_price": 0,
    "selling_price": 0
  },
  "stock_control": {
    "min_stock": 500,
    "max_stock": 5000,
    "reorder_point": 1000,
    "lead_time_days": 14
  },
  "supplier_info": {
    "primary_supplier_id": null,
    "secondary_supplier_id": null
  },
  "is_active": true,
  "created_at": "2026-04-23T00:00:00Z",
  "created_by": null,
  "updated_at": "2026-04-23T00:00:00Z"
}'::jsonb),

('item:ITM00002', '{
  "id": "ITM00002",
  "code": "INK-CYAN-001",
  "name": "Tinta Cyan untuk Printing",
  "inventory_type_id": "1",
  "item_type_id": "1",
  "item_subtype_id": "7",
  "description": "Tinta warna cyan untuk mesin printing flexo",
  "unit": "KG",
  "unit_alt": null,
  "conversion_factor": 1,
  "specifications": {
    "color": "Cyan",
    "type": "Solvent Based",
    "viscosity": "15-20 sec"
  },
  "pricing": {
    "standard_cost": 85000,
    "average_cost": 0,
    "last_purchase_price": 0,
    "selling_price": 0
  },
  "stock_control": {
    "min_stock": 50,
    "max_stock": 500,
    "reorder_point": 100,
    "lead_time_days": 7
  },
  "supplier_info": {
    "primary_supplier_id": null,
    "secondary_supplier_id": null
  },
  "is_active": true,
  "created_at": "2026-04-23T00:00:00Z",
  "created_by": null,
  "updated_at": "2026-04-23T00:00:00Z"
}'::jsonb),

('item:ITM00003', '{
  "id": "ITM00003",
  "code": "SP-BEARING-001",
  "name": "Bearing 6205 ZZ",
  "inventory_type_id": "1",
  "item_type_id": "3",
  "item_subtype_id": "12",
  "description": "Bearing untuk motor mesin printing",
  "unit": "PCS",
  "unit_alt": null,
  "conversion_factor": 1,
  "specifications": {
    "size": "6205 ZZ",
    "type": "Deep Groove Ball Bearing",
    "bore_diameter": "25 mm",
    "outer_diameter": "52 mm"
  },
  "pricing": {
    "standard_cost": 35000,
    "average_cost": 0,
    "last_purchase_price": 0,
    "selling_price": 0
  },
  "stock_control": {
    "min_stock": 10,
    "max_stock": 50,
    "reorder_point": 15,
    "lead_time_days": 10
  },
  "supplier_info": {
    "primary_supplier_id": null,
    "secondary_supplier_id": null
  },
  "is_active": true,
  "created_at": "2026-04-23T00:00:00Z",
  "created_by": null,
  "updated_at": "2026-04-23T00:00:00Z"
}'::jsonb);

-- Index untuk items
INSERT INTO public.kv_store_6a7942bb (key, value) VALUES
('item:index', '{
  "ids": ["ITM00001", "ITM00002", "ITM00003"],
  "updated_at": "2026-04-23T00:00:00Z"
}'::jsonb);


-- =====================================================
-- 6. STOCK BATCHES (untuk FIFO)
-- Key pattern: stock_batch:{id}
-- =====================================================
-- Setiap pembelian/penerimaan barang membuat batch baru untuk FIFO

-- Contoh: tidak ada data awal, akan diisi saat ada pembelian

INSERT INTO public.kv_store_6a7942bb (key, value) VALUES
('stock_batch:index', '{
  "ids": [],
  "updated_at": "2026-04-23T00:00:00Z"
}'::jsonb);

-- Index per item
INSERT INTO public.kv_store_6a7942bb (key, value) VALUES
('stock_batch:by_item:ITM00001', '{
  "item_id": "ITM00001",
  "batch_ids": [],
  "updated_at": "2026-04-23T00:00:00Z"
}'::jsonb);


-- =====================================================
-- 7. STOCK MOVEMENTS (Transaksi Stock)
-- Key pattern: stock_movement:{id}
-- =====================================================
-- Semua transaksi keluar-masuk barang

INSERT INTO public.kv_store_6a7942bb (key, value) VALUES
('stock_movement:index', '{
  "ids": [],
  "updated_at": "2026-04-23T00:00:00Z"
}'::jsonb);


-- =====================================================
-- 8. STOCK SUMMARY (Ringkasan Stock per Item per Warehouse)
-- Key pattern: stock_summary:{item_id}:{warehouse_id}
-- =====================================================

-- Contoh: tidak ada data awal

INSERT INTO public.kv_store_6a7942bb (key, value) VALUES
('stock_summary:index', '{
  "keys": [],
  "updated_at": "2026-04-23T00:00:00Z"
}'::jsonb);


-- =====================================================
-- 9. MASTER WAREHOUSES (Gudang)
-- Key pattern: warehouse:{id}
-- =====================================================

INSERT INTO public.kv_store_6a7942bb (key, value) VALUES
('warehouse:WH001', '{
  "id": "WH001",
  "code": "GD-UTAMA",
  "name": "Gudang Utama",
  "address": "Jl. Raya Industri No. 123",
  "type": "main",
  "is_active": true,
  "created_at": "2026-04-23T00:00:00Z"
}'::jsonb),

('warehouse:WH002', '{
  "id": "WH002",
  "code": "GD-FG",
  "name": "Gudang Barang Jadi",
  "address": "Jl. Raya Industri No. 125",
  "type": "finished_goods",
  "is_active": true,
  "created_at": "2026-04-23T00:00:00Z"
}'::jsonb),

('warehouse:WH003', '{
  "id": "WH003",
  "code": "GD-RM",
  "name": "Gudang Bahan Baku",
  "address": "Jl. Raya Industri No. 124",
  "type": "raw_material",
  "is_active": true,
  "created_at": "2026-04-23T00:00:00Z"
}'::jsonb);

INSERT INTO public.kv_store_6a7942bb (key, value) VALUES
('warehouse:index', '{
  "ids": ["WH001", "WH002", "WH003"],
  "updated_at": "2026-04-23T00:00:00Z"
}'::jsonb);


-- =====================================================
-- 10. TRANSACTION TYPES (Jenis Transaksi Stock)
-- Key pattern: transaction_type:{code}
-- =====================================================

INSERT INTO public.kv_store_6a7942bb (key, value) VALUES
('transaction_type:IN_PURCHASE', '{
  "code": "IN_PURCHASE",
  "name": "Pembelian (Purchase Order)",
  "direction": "IN",
  "affects_fifo": true,
  "description": "Penerimaan barang dari pembelian",
  "is_active": true
}'::jsonb),

('transaction_type:IN_PRODUCTION', '{
  "code": "IN_PRODUCTION",
  "name": "Hasil Produksi",
  "direction": "IN",
  "affects_fifo": true,
  "description": "Barang jadi hasil produksi",
  "is_active": true
}'::jsonb),

('transaction_type:IN_RETURN', '{
  "code": "IN_RETURN",
  "name": "Retur dari Customer",
  "direction": "IN",
  "affects_fifo": true,
  "description": "Barang retur dari customer",
  "is_active": true
}'::jsonb),

('transaction_type:IN_ADJUSTMENT', '{
  "code": "IN_ADJUSTMENT",
  "name": "Penyesuaian Tambah",
  "direction": "IN",
  "affects_fifo": true,
  "description": "Penyesuaian stock (tambah)",
  "is_active": true
}'::jsonb),

('transaction_type:OUT_SALES', '{
  "code": "OUT_SALES",
  "name": "Penjualan",
  "direction": "OUT",
  "affects_fifo": true,
  "description": "Pengiriman barang untuk penjualan",
  "is_active": true
}'::jsonb),

('transaction_type:OUT_PRODUCTION', '{
  "code": "OUT_PRODUCTION",
  "name": "Pemakaian Produksi",
  "direction": "OUT",
  "affects_fifo": true,
  "description": "Pemakaian bahan baku untuk produksi",
  "is_active": true
}'::jsonb),

('transaction_type:OUT_WASTE', '{
  "code": "OUT_WASTE",
  "name": "Waste/Scrap",
  "direction": "OUT",
  "affects_fifo": false,
  "description": "Barang rusak/reject/waste",
  "is_active": true
}'::jsonb),

('transaction_type:OUT_ADJUSTMENT', '{
  "code": "OUT_ADJUSTMENT",
  "name": "Penyesuaian Kurang",
  "direction": "OUT",
  "affects_fifo": true,
  "description": "Penyesuaian stock (kurang)",
  "is_active": true
}'::jsonb),

('transaction_type:TRANSFER', '{
  "code": "TRANSFER",
  "name": "Transfer Antar Gudang",
  "direction": "TRANSFER",
  "affects_fifo": true,
  "description": "Pemindahan barang antar gudang",
  "is_active": true
}'::jsonb);

INSERT INTO public.kv_store_6a7942bb (key, value) VALUES
('transaction_type:index', '{
  "codes": ["IN_PURCHASE", "IN_PRODUCTION", "IN_RETURN", "IN_ADJUSTMENT", "OUT_SALES", "OUT_PRODUCTION", "OUT_WASTE", "OUT_ADJUSTMENT", "TRANSFER"],
  "updated_at": "2026-04-23T00:00:00Z"
}'::jsonb);


-- =====================================================
-- 11. DOKUMENTASI STRUKTUR DATA
-- Key pattern: schema:documentation
-- =====================================================

INSERT INTO public.kv_store_6a7942bb (key, value) VALUES
('schema:documentation', '{
  "version": "1.0.0",
  "created_at": "2026-04-23T00:00:00Z",
  "description": "Inventory Management System dengan FIFO untuk ERP",
  "entities": {
    "inventory_type": {
      "description": "Master jenis persediaan (stock/non-stock/jasa)",
      "key_pattern": "inventory_type:{id}",
      "fields": ["id", "code", "name", "has_stock", "has_fifo", "description", "is_active"]
    },
    "item_type": {
      "description": "Master jenis barang (bahan baku, sparepart, dll)",
      "key_pattern": "item_type:{id}",
      "fields": ["id", "code", "name", "inventory_type_id", "description", "is_active", "has_subtypes"]
    },
    "item_subtype": {
      "description": "Master sub-jenis barang (kertas, plastik, mekanik, elektrik, dll)",
      "key_pattern": "item_subtype:{id}",
      "fields": ["id", "code", "name", "item_type_id", "description", "is_active"]
    },
    "item": {
      "description": "Master barang/item",
      "key_pattern": "item:{id}",
      "fields": ["id", "code", "name", "inventory_type_id", "item_type_id", "item_subtype_id", "description", "unit", "specifications", "pricing", "stock_control", "is_active"]
    },
    "stock_batch": {
      "description": "Batch stock untuk FIFO (setiap penerimaan membuat batch baru)",
      "key_pattern": "stock_batch:{id}",
      "fields": ["id", "item_id", "warehouse_id", "batch_number", "receipt_date", "quantity_in", "quantity_remaining", "unit_cost", "reference_type", "reference_id", "expiry_date", "status"]
    },
    "stock_movement": {
      "description": "Transaksi keluar-masuk barang",
      "key_pattern": "stock_movement:{id}",
      "fields": ["id", "movement_number", "transaction_type", "item_id", "warehouse_id", "quantity", "unit", "unit_cost", "total_cost", "batch_id", "reference_type", "reference_id", "movement_date", "notes", "created_by"]
    },
    "stock_summary": {
      "description": "Ringkasan stock per item per gudang",
      "key_pattern": "stock_summary:{item_id}:{warehouse_id}",
      "fields": ["item_id", "warehouse_id", "quantity_on_hand", "quantity_reserved", "quantity_available", "average_cost", "total_value", "last_movement_date"]
    },
    "warehouse": {
      "description": "Master gudang",
      "key_pattern": "warehouse:{id}",
      "fields": ["id", "code", "name", "address", "type", "is_active"]
    },
    "transaction_type": {
      "description": "Jenis transaksi stock",
      "key_pattern": "transaction_type:{code}",
      "fields": ["code", "name", "direction", "affects_fifo", "description", "is_active"]
    }
  },
  "fifo_logic": {
    "description": "Sistem menggunakan metode FIFO (First In First Out)",
    "rules": [
      "Setiap penerimaan barang (IN) membuat stock_batch baru",
      "Setiap pengeluaran barang (OUT) mengurangi dari batch tertua terlebih dahulu",
      "Jika quantity pada batch habis, lanjut ke batch berikutnya",
      "Unit cost untuk pengeluaran diambil dari unit_cost batch yang diambil",
      "Stock summary menghitung total quantity dan average cost dari semua batch aktif"
    ]
  },
  "index_patterns": {
    "entity_index": "{entity_type}:index - berisi array semua IDs",
    "by_parent": "{entity_type}:by_{parent_type}:{parent_id} - berisi array IDs yang terkait dengan parent",
    "counter": "counter:{entity_type} - untuk auto-increment ID"
  }
}'::jsonb);

-- Add comment to the migration
COMMENT ON TABLE public.kv_store_6a7942bb IS 'Key-Value store untuk Inventory Management System dengan FIFO. Struktur: inventory_type, item_type, item_subtype, item, stock_batch, stock_movement, stock_summary, warehouse, transaction_type';
