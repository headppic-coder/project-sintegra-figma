-- =====================================================
-- TEST DATA & EXAMPLES FOR INVENTORY FIFO SYSTEM
-- =====================================================
-- This migration contains test scenarios to demonstrate FIFO functionality

-- =====================================================
-- SCENARIO 1: Penerimaan Barang dari Purchase Order
-- =====================================================

-- PO #1: Terima 1000 KG Film BOPP @ Rp 45,000
SELECT complete_stock_in_transaction(
  'ITM00001',           -- item_id: Film BOPP
  'WH003',              -- warehouse_id: Gudang Bahan Baku
  1000,                 -- quantity: 1000 KG
  'KG',                 -- unit
  45000,                -- unit_cost: Rp 45,000/KG
  'IN_PURCHASE',        -- transaction_type
  'purchase_order',     -- reference_type
  'PO-2026-001',        -- reference_id
  'RCV-2026-001',       -- movement_number
  NULL,                 -- batch_number (auto-generated)
  'Penerimaan dari Supplier ABC - PO #001',
  NULL                  -- created_by
) as result_po1;

-- PO #2: Terima 2000 KG Film BOPP @ Rp 46,000 (harga naik)
SELECT complete_stock_in_transaction(
  'ITM00001',
  'WH003',
  2000,
  'KG',
  46000,
  'IN_PURCHASE',
  'purchase_order',
  'PO-2026-002',
  'RCV-2026-002',
  NULL,
  'Penerimaan dari Supplier ABC - PO #002',
  NULL
) as result_po2;

-- PO #3: Terima 500 KG Tinta Cyan @ Rp 85,000
SELECT complete_stock_in_transaction(
  'ITM00002',
  'WH003',
  500,
  'KG',
  85000,
  'IN_PURCHASE',
  'purchase_order',
  'PO-2026-003',
  'RCV-2026-003',
  NULL,
  'Penerimaan Tinta Cyan dari Supplier XYZ',
  NULL
) as result_po3;

-- PO #4: Terima 20 PCS Bearing @ Rp 35,000
SELECT complete_stock_in_transaction(
  'ITM00003',
  'WH003',
  20,
  'PCS',
  35000,
  'IN_PURCHASE',
  'purchase_order',
  'PO-2026-004',
  'RCV-2026-004',
  NULL,
  'Penerimaan Bearing 6205 ZZ',
  NULL
) as result_po4;


-- =====================================================
-- CEK STOCK SETELAH PENERIMAAN
-- =====================================================

-- Lihat Stock Summary
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

-- Lihat Active Batches (urutan FIFO)
SELECT
  item_code,
  batch_number,
  receipt_date,
  quantity_remaining,
  unit,
  unit_cost
FROM v_active_batches
ORDER BY item_code, receipt_date;


-- =====================================================
-- SCENARIO 2: Pengeluaran Barang untuk Produksi (FIFO)
-- =====================================================

-- Work Order #1: Pakai 800 KG Film BOPP
-- Seharusnya ambil dari BATCH00001 (tertua) @ Rp 45,000
SELECT complete_stock_out_transaction(
  'ITM00001',
  'WH003',
  800,                  -- quantity: 800 KG
  'OUT_PRODUCTION',     -- transaction_type
  'work_order',         -- reference_type
  'WO-2026-001',        -- reference_id
  'OUT-2026-001',       -- movement_number
  'Pemakaian untuk Work Order #001',
  NULL
) as result_wo1;

-- Cek stock setelah WO #1
SELECT
  item_code,
  batch_number,
  receipt_date,
  quantity_remaining,
  unit_cost
FROM v_active_batches
WHERE item_code = 'FILM-BOPP-001'
ORDER BY receipt_date;

/*
Expected Result:
- BATCH00001: 200 KG tersisa (dari 1000 KG) @ Rp 45,000
- BATCH00002: 2000 KG utuh @ Rp 46,000
*/


-- Work Order #2: Pakai 1500 KG Film BOPP
-- Seharusnya:
-- - Ambil 200 KG dari BATCH00001 @ Rp 45,000 (habis)
-- - Ambil 1300 KG dari BATCH00002 @ Rp 46,000
-- Total Cost: (200 × 45,000) + (1,300 × 46,000) = 9,000,000 + 59,800,000 = 68,800,000
-- Average Cost: 68,800,000 / 1,500 = Rp 45,867
SELECT complete_stock_out_transaction(
  'ITM00001',
  'WH003',
  1500,
  'OUT_PRODUCTION',
  'work_order',
  'WO-2026-002',
  'OUT-2026-002',
  'Pemakaian untuk Work Order #002',
  NULL
) as result_wo2;

-- Cek stock setelah WO #2
SELECT
  item_code,
  batch_number,
  receipt_date,
  quantity_remaining,
  unit_cost
FROM v_active_batches
WHERE item_code = 'FILM-BOPP-001'
ORDER BY receipt_date;

/*
Expected Result:
- BATCH00001: DEPLETED (habis)
- BATCH00002: 700 KG tersisa @ Rp 46,000
*/

-- Cek Summary
SELECT
  item_code,
  quantity_on_hand,
  average_cost,
  total_value
FROM v_stock_summary
WHERE item_code = 'FILM-BOPP-001';

/*
Expected:
- quantity_on_hand: 700 KG
- average_cost: Rp 46,000
- total_value: 32,200,000
*/


-- =====================================================
-- SCENARIO 3: Pengeluaran Tinta untuk Produksi
-- =====================================================

SELECT complete_stock_out_transaction(
  'ITM00002',
  'WH003',
  150,
  'OUT_PRODUCTION',
  'work_order',
  'WO-2026-003',
  'OUT-2026-003',
  'Pemakaian Tinta Cyan untuk printing',
  NULL
) as result_wo3;


-- =====================================================
-- SCENARIO 4: Penerimaan Lagi (Setelah Pengeluaran)
-- =====================================================

-- PO #5: Terima 1500 KG Film BOPP @ Rp 47,000 (harga naik lagi)
SELECT complete_stock_in_transaction(
  'ITM00001',
  'WH003',
  1500,
  'KG',
  47000,
  'IN_PURCHASE',
  'purchase_order',
  'PO-2026-005',
  'RCV-2026-005',
  NULL,
  'Penerimaan dari Supplier ABC - PO #005',
  NULL
) as result_po5;

-- Cek Batches setelah PO #5
SELECT
  item_code,
  batch_number,
  receipt_date,
  quantity_remaining,
  unit_cost
FROM v_active_batches
WHERE item_code = 'FILM-BOPP-001'
ORDER BY receipt_date;

/*
Expected:
- BATCH00002: 700 KG @ Rp 46,000 (dari PO-2026-002)
- BATCH00003: 1,500 KG @ Rp 47,000 (dari PO-2026-005) -- BARU
Total: 2,200 KG
*/

-- Cek Summary
SELECT
  item_code,
  quantity_on_hand,
  average_cost,
  total_value
FROM v_stock_summary
WHERE item_code = 'FILM-BOPP-001';

/*
Expected:
- quantity_on_hand: 2,200 KG
- total_value: (700 × 46,000) + (1,500 × 47,000) = 32,200,000 + 70,500,000 = 102,700,000
- average_cost: 102,700,000 / 2,200 = Rp 46,682
*/


-- =====================================================
-- SCENARIO 5: Test FIFO dengan Pengeluaran Besar
-- =====================================================

-- Work Order #4: Pakai 2000 KG Film BOPP
-- Seharusnya:
-- - Ambil 700 KG dari BATCH00002 @ Rp 46,000 (habis)
-- - Ambil 1,300 KG dari BATCH00003 @ Rp 47,000
SELECT complete_stock_out_transaction(
  'ITM00001',
  'WH003',
  2000,
  'OUT_PRODUCTION',
  'work_order',
  'WO-2026-004',
  'OUT-2026-004',
  'Pemakaian besar untuk Work Order #004',
  NULL
) as result_wo4;

-- Cek Final Stock
SELECT
  item_code,
  batch_number,
  receipt_date,
  quantity_remaining,
  unit_cost
FROM v_active_batches
WHERE item_code = 'FILM-BOPP-001'
ORDER BY receipt_date;

/*
Expected:
- BATCH00003: 200 KG tersisa @ Rp 47,000
Total: 200 KG
*/


-- =====================================================
-- SCENARIO 6: Stock Adjustment
-- =====================================================

-- Adjustment: Tambah stock karena salah hitung
SELECT complete_stock_in_transaction(
  'ITM00001',
  'WH003',
  50,
  'KG',
  47000,  -- Pakai harga batch terakhir
  'IN_ADJUSTMENT',
  'stock_adjustment',
  'ADJ-2026-001',
  'ADJ-IN-001',
  'ADJ-2026-001-BATCH',
  'Penyesuaian stock - Selisih stock opname',
  NULL
) as result_adj1;


-- =====================================================
-- SCENARIO 7: Test Insufficient Stock (Should Fail)
-- =====================================================

-- Coba keluarkan 500 KG padahal hanya ada 250 KG
-- Expected: ERROR
DO $$
BEGIN
  PERFORM complete_stock_out_transaction(
    'ITM00001',
    'WH003',
    500,
    'OUT_PRODUCTION',
    'work_order',
    'WO-2026-999',
    'OUT-2026-999',
    'Test insufficient stock',
    NULL
  );
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'ERROR (Expected): %', SQLERRM;
END;
$$;


-- =====================================================
-- LAPORAN AKHIR
-- =====================================================

-- 1. Stock Summary All Items
SELECT
  item_code,
  item_name,
  warehouse_name,
  quantity_on_hand,
  unit,
  average_cost,
  total_value,
  last_movement_date
FROM v_stock_summary
ORDER BY item_code;


-- 2. All Active Batches
SELECT
  item_code,
  batch_number,
  receipt_date,
  quantity_in,
  quantity_remaining,
  unit_cost,
  reference_id
FROM v_active_batches
ORDER BY item_code, receipt_date;


-- 3. Stock Card untuk Film BOPP
SELECT
  m.value->>'movement_date' as date,
  m.value->>'movement_number' as doc_no,
  m.value->>'transaction_type' as type,
  (m.value->>'quantity')::NUMERIC as qty,
  (m.value->>'unit_cost')::NUMERIC as cost,
  (m.value->>'total_cost')::NUMERIC as value,
  m.value->>'reference_id' as ref
FROM kv_store_6a7942bb m
WHERE m.key LIKE 'stock_movement:%'
  AND m.value->>'item_id' = 'ITM00001'
ORDER BY
  (m.value->>'movement_date')::DATE,
  m.value->>'created_at';


-- 4. Kartu Stock dengan Running Balance
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
    AND value->>'warehouse_id' = 'WH003'
  ORDER BY value->>'movement_date', value->>'created_at'
)
SELECT
  date,
  doc_no,
  type,
  CASE WHEN qty > 0 THEN qty ELSE 0 END as qty_in,
  CASE WHEN qty < 0 THEN ABS(qty) ELSE 0 END as qty_out,
  cost,
  SUM(qty) OVER (ORDER BY date, created_at ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW) as balance
FROM movements;


-- 5. Total Stock Value per Warehouse
SELECT
  warehouse_name,
  COUNT(DISTINCT item_id) as item_count,
  SUM(quantity_on_hand) as total_quantity,
  SUM(total_value) as total_value
FROM v_stock_summary
GROUP BY warehouse_name
ORDER BY warehouse_name;


-- =====================================================
-- VALIDASI FIFO
-- =====================================================

-- Cek bahwa semua movements dari batch yang sama memiliki unit_cost yang sama
SELECT
  m.value->>'batch_id' as batch_id,
  COUNT(*) as movement_count,
  COUNT(DISTINCT (m.value->>'unit_cost')) as distinct_costs,
  MIN((m.value->>'unit_cost')::NUMERIC) as min_cost,
  MAX((m.value->>'unit_cost')::NUMERIC) as max_cost
FROM kv_store_6a7942bb m
WHERE m.key LIKE 'stock_movement:%'
  AND m.value->>'batch_id' IS NOT NULL
GROUP BY m.value->>'batch_id'
HAVING COUNT(DISTINCT (m.value->>'unit_cost')) > 1;
-- Expected: 0 rows (semua movement dari batch yang sama harus punya cost yang sama)


-- Cek bahwa summary match dengan sum dari batches
SELECT
  s.value->>'item_id' as item_id,
  s.value->>'warehouse_id' as warehouse_id,
  (s.value->>'quantity_on_hand')::NUMERIC as summary_qty,
  (
    SELECT COALESCE(SUM((value->>'quantity_remaining')::NUMERIC), 0)
    FROM kv_store_6a7942bb
    WHERE key LIKE 'stock_batch:%'
      AND value->>'item_id' = s.value->>'item_id'
      AND value->>'warehouse_id' = s.value->>'warehouse_id'
      AND value->>'status' = 'active'
  ) as batch_total_qty,
  (s.value->>'total_value')::NUMERIC as summary_value,
  (
    SELECT COALESCE(SUM((value->>'quantity_remaining')::NUMERIC * (value->>'unit_cost')::NUMERIC), 0)
    FROM kv_store_6a7942bb
    WHERE key LIKE 'stock_batch:%'
      AND value->>'item_id' = s.value->>'item_id'
      AND value->>'warehouse_id' = s.value->>'warehouse_id'
      AND value->>'status' = 'active'
  ) as batch_total_value
FROM kv_store_6a7942bb s
WHERE s.key LIKE 'stock_summary:%';
-- Expected: summary_qty = batch_total_qty AND summary_value = batch_total_value


-- =====================================================
-- CLEANUP (Optional - untuk reset test data)
-- =====================================================

/*
-- Uncomment untuk reset semua test data

DELETE FROM kv_store_6a7942bb
WHERE key LIKE 'stock_batch:BATCH%'
   OR key LIKE 'stock_movement:MOV%'
   OR key LIKE 'stock_summary:ITM%';

UPDATE kv_store_6a7942bb
SET value = jsonb_set(value, '{current}', '0')
WHERE key IN ('counter:stock_batch', 'counter:stock_movement');

UPDATE kv_store_6a7942bb
SET value = jsonb_set(value, '{ids}', '[]'::jsonb)
WHERE key IN ('stock_batch:index', 'stock_movement:index', 'stock_summary:index');
*/
