-- =====================================================
-- HELPER FUNCTIONS FOR INVENTORY FIFO OPERATIONS
-- =====================================================

-- =====================================================
-- 1. FUNCTION: Get Next Counter
-- =====================================================
CREATE OR REPLACE FUNCTION get_next_counter(entity_type TEXT)
RETURNS TEXT AS $$
DECLARE
  counter_key TEXT;
  current_value INTEGER;
  prefix TEXT;
  next_id TEXT;
BEGIN
  counter_key := 'counter:' || entity_type;

  -- Get current counter
  SELECT
    (value->>'current')::INTEGER,
    value->>'prefix'
  INTO current_value, prefix
  FROM kv_store_6a7942bb
  WHERE key = counter_key;

  -- Increment
  current_value := current_value + 1;

  -- Update counter
  UPDATE kv_store_6a7942bb
  SET value = jsonb_set(
    jsonb_set(value, '{current}', to_jsonb(current_value)),
    '{updated_at}', to_jsonb(NOW())
  )
  WHERE key = counter_key;

  -- Generate ID
  next_id := prefix || LPAD(current_value::TEXT, 5, '0');

  RETURN next_id;
END;
$$ LANGUAGE plpgsql;

-- Usage: SELECT get_next_counter('item'); -- Returns: ITM00001


-- =====================================================
-- 2. FUNCTION: Create Stock Batch
-- =====================================================
CREATE OR REPLACE FUNCTION create_stock_batch(
  p_item_id TEXT,
  p_warehouse_id TEXT,
  p_batch_number TEXT,
  p_quantity NUMERIC,
  p_unit TEXT,
  p_unit_cost NUMERIC,
  p_reference_type TEXT,
  p_reference_id TEXT,
  p_created_by TEXT DEFAULT NULL,
  p_expiry_date DATE DEFAULT NULL,
  p_lot_number TEXT DEFAULT NULL
)
RETURNS TEXT AS $$
DECLARE
  v_batch_id TEXT;
  v_total_cost NUMERIC;
BEGIN
  -- Get next ID
  v_batch_id := get_next_counter('stock_batch');

  -- Calculate total cost
  v_total_cost := p_quantity * p_unit_cost;

  -- Insert batch
  INSERT INTO kv_store_6a7942bb (key, value) VALUES
  ('stock_batch:' || v_batch_id, jsonb_build_object(
    'id', v_batch_id,
    'item_id', p_item_id,
    'warehouse_id', p_warehouse_id,
    'batch_number', p_batch_number,
    'receipt_date', CURRENT_DATE,
    'quantity_in', p_quantity,
    'quantity_remaining', p_quantity,
    'unit', p_unit,
    'unit_cost', p_unit_cost,
    'total_cost', v_total_cost,
    'reference_type', p_reference_type,
    'reference_id', p_reference_id,
    'expiry_date', p_expiry_date,
    'lot_number', p_lot_number,
    'status', 'active',
    'created_at', NOW(),
    'created_by', p_created_by
  ));

  -- Update index
  UPDATE kv_store_6a7942bb
  SET value = jsonb_set(
    value,
    '{ids}',
    COALESCE(value->'ids', '[]'::jsonb) || to_jsonb(ARRAY[v_batch_id])
  )
  WHERE key = 'stock_batch:index';

  -- Update item-specific index
  INSERT INTO kv_store_6a7942bb (key, value) VALUES
  ('stock_batch:by_item:' || p_item_id, jsonb_build_object(
    'item_id', p_item_id,
    'batch_ids', jsonb_build_array(v_batch_id),
    'updated_at', NOW()
  ))
  ON CONFLICT (key) DO UPDATE
  SET value = jsonb_set(
    kv_store_6a7942bb.value,
    '{batch_ids}',
    COALESCE(kv_store_6a7942bb.value->'batch_ids', '[]'::jsonb) || to_jsonb(ARRAY[v_batch_id])
  );

  RETURN v_batch_id;
END;
$$ LANGUAGE plpgsql;

-- Usage:
-- SELECT create_stock_batch(
--   'ITM00001', 'WH003', 'PO-2026-001-001',
--   1000, 'KG', 45000,
--   'purchase_order', 'PO-2026-001',
--   'user-123'
-- );


-- =====================================================
-- 3. FUNCTION: Get Active Batches (FIFO Order)
-- =====================================================
CREATE OR REPLACE FUNCTION get_active_batches(
  p_item_id TEXT,
  p_warehouse_id TEXT
)
RETURNS TABLE (
  batch_id TEXT,
  batch_number TEXT,
  receipt_date DATE,
  quantity_remaining NUMERIC,
  unit_cost NUMERIC,
  unit TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    (value->>'id')::TEXT,
    (value->>'batch_number')::TEXT,
    (value->>'receipt_date')::DATE,
    (value->>'quantity_remaining')::NUMERIC,
    (value->>'unit_cost')::NUMERIC,
    (value->>'unit')::TEXT
  FROM kv_store_6a7942bb
  WHERE key LIKE 'stock_batch:%'
    AND value->>'item_id' = p_item_id
    AND value->>'warehouse_id' = p_warehouse_id
    AND value->>'status' = 'active'
    AND (value->>'quantity_remaining')::NUMERIC > 0
  ORDER BY (value->>'receipt_date')::DATE ASC, value->>'created_at' ASC;
END;
$$ LANGUAGE plpgsql;

-- Usage:
-- SELECT * FROM get_active_batches('ITM00001', 'WH003');


-- =====================================================
-- 4. FUNCTION: Process FIFO Out (Complex)
-- =====================================================
CREATE OR REPLACE FUNCTION process_fifo_out(
  p_item_id TEXT,
  p_warehouse_id TEXT,
  p_quantity NUMERIC,
  p_transaction_type TEXT,
  p_reference_type TEXT,
  p_reference_id TEXT,
  p_movement_number TEXT,
  p_notes TEXT DEFAULT NULL,
  p_created_by TEXT DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
  v_remaining_qty NUMERIC;
  v_batch RECORD;
  v_take_qty NUMERIC;
  v_movement_id TEXT;
  v_movements JSONB := '[]'::jsonb;
  v_total_cost NUMERIC := 0;
BEGIN
  v_remaining_qty := p_quantity;

  -- Loop through batches in FIFO order
  FOR v_batch IN
    SELECT * FROM get_active_batches(p_item_id, p_warehouse_id)
  LOOP
    EXIT WHEN v_remaining_qty <= 0;

    -- Determine how much to take from this batch
    v_take_qty := LEAST(v_remaining_qty, v_batch.quantity_remaining);

    -- Create movement record
    v_movement_id := get_next_counter('stock_movement');

    INSERT INTO kv_store_6a7942bb (key, value) VALUES
    ('stock_movement:' || v_movement_id, jsonb_build_object(
      'id', v_movement_id,
      'movement_number', p_movement_number || '-' || v_movement_id,
      'transaction_type', p_transaction_type,
      'item_id', p_item_id,
      'warehouse_id', p_warehouse_id,
      'quantity', -v_take_qty,
      'unit', v_batch.unit,
      'unit_cost', v_batch.unit_cost,
      'total_cost', v_take_qty * v_batch.unit_cost,
      'batch_id', v_batch.batch_id,
      'reference_type', p_reference_type,
      'reference_id', p_reference_id,
      'movement_date', CURRENT_DATE,
      'notes', p_notes,
      'created_at', NOW(),
      'created_by', p_created_by
    ));

    -- Update batch quantity
    UPDATE kv_store_6a7942bb
    SET value = jsonb_set(
      value,
      '{quantity_remaining}',
      to_jsonb(v_batch.quantity_remaining - v_take_qty)
    )
    WHERE key = 'stock_batch:' || v_batch.batch_id;

    -- If batch is depleted, update status
    IF v_batch.quantity_remaining - v_take_qty = 0 THEN
      UPDATE kv_store_6a7942bb
      SET value = jsonb_set(value, '{status}', '"depleted"')
      WHERE key = 'stock_batch:' || v_batch.batch_id;
    END IF;

    -- Track movements
    v_movements := v_movements || jsonb_build_object(
      'movement_id', v_movement_id,
      'batch_id', v_batch.batch_id,
      'quantity', v_take_qty,
      'cost', v_take_qty * v_batch.unit_cost
    );

    v_total_cost := v_total_cost + (v_take_qty * v_batch.unit_cost);
    v_remaining_qty := v_remaining_qty - v_take_qty;
  END LOOP;

  -- Check if we have enough stock
  IF v_remaining_qty > 0 THEN
    RAISE EXCEPTION 'Insufficient stock. Short by: %', v_remaining_qty;
  END IF;

  -- Update movement index
  UPDATE kv_store_6a7942bb
  SET value = jsonb_set(
    value,
    '{ids}',
    COALESCE(value->'ids', '[]'::jsonb) ||
    (SELECT jsonb_agg(value->>'movement_id') FROM jsonb_array_elements(v_movements))
  )
  WHERE key = 'stock_movement:index';

  -- Return summary
  RETURN jsonb_build_object(
    'success', true,
    'quantity_out', p_quantity,
    'total_cost', v_total_cost,
    'average_cost', v_total_cost / p_quantity,
    'movements', v_movements
  );
END;
$$ LANGUAGE plpgsql;

-- Usage:
-- SELECT process_fifo_out(
--   'ITM00001', 'WH003', 1500,
--   'OUT_PRODUCTION', 'work_order', 'WO-2026-001',
--   'OUT-2026-001', 'Pemakaian untuk produksi', 'user-123'
-- );


-- =====================================================
-- 5. FUNCTION: Process Stock In
-- =====================================================
CREATE OR REPLACE FUNCTION process_stock_in(
  p_item_id TEXT,
  p_warehouse_id TEXT,
  p_quantity NUMERIC,
  p_unit TEXT,
  p_unit_cost NUMERIC,
  p_transaction_type TEXT,
  p_reference_type TEXT,
  p_reference_id TEXT,
  p_movement_number TEXT,
  p_batch_number TEXT DEFAULT NULL,
  p_notes TEXT DEFAULT NULL,
  p_created_by TEXT DEFAULT NULL,
  p_expiry_date DATE DEFAULT NULL,
  p_lot_number TEXT DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
  v_batch_id TEXT;
  v_movement_id TEXT;
  v_batch_number TEXT;
BEGIN
  -- Generate batch number if not provided
  v_batch_number := COALESCE(p_batch_number, p_reference_id || '-' || to_char(NOW(), 'YYYYMMDD-HH24MISS'));

  -- Create batch
  v_batch_id := create_stock_batch(
    p_item_id, p_warehouse_id, v_batch_number,
    p_quantity, p_unit, p_unit_cost,
    p_reference_type, p_reference_id,
    p_created_by, p_expiry_date, p_lot_number
  );

  -- Create movement
  v_movement_id := get_next_counter('stock_movement');

  INSERT INTO kv_store_6a7942bb (key, value) VALUES
  ('stock_movement:' || v_movement_id, jsonb_build_object(
    'id', v_movement_id,
    'movement_number', p_movement_number,
    'transaction_type', p_transaction_type,
    'item_id', p_item_id,
    'warehouse_id', p_warehouse_id,
    'quantity', p_quantity,
    'unit', p_unit,
    'unit_cost', p_unit_cost,
    'total_cost', p_quantity * p_unit_cost,
    'batch_id', v_batch_id,
    'reference_type', p_reference_type,
    'reference_id', p_reference_id,
    'movement_date', CURRENT_DATE,
    'notes', p_notes,
    'created_at', NOW(),
    'created_by', p_created_by
  ));

  -- Update movement index
  UPDATE kv_store_6a7942bb
  SET value = jsonb_set(
    value,
    '{ids}',
    COALESCE(value->'ids', '[]'::jsonb) || to_jsonb(ARRAY[v_movement_id])
  )
  WHERE key = 'stock_movement:index';

  RETURN jsonb_build_object(
    'success', true,
    'batch_id', v_batch_id,
    'movement_id', v_movement_id,
    'quantity_in', p_quantity,
    'total_cost', p_quantity * p_unit_cost
  );
END;
$$ LANGUAGE plpgsql;

-- Usage:
-- SELECT process_stock_in(
--   'ITM00001', 'WH003', 2000, 'KG', 46000,
--   'IN_PURCHASE', 'purchase_order', 'PO-2026-002',
--   'RCV-2026-002', NULL, 'Penerimaan dari supplier XYZ', 'user-123'
-- );


-- =====================================================
-- 6. FUNCTION: Update Stock Summary
-- =====================================================
CREATE OR REPLACE FUNCTION update_stock_summary(
  p_item_id TEXT,
  p_warehouse_id TEXT
)
RETURNS JSONB AS $$
DECLARE
  v_total_qty NUMERIC := 0;
  v_total_value NUMERIC := 0;
  v_average_cost NUMERIC := 0;
  v_last_movement_date DATE;
  v_last_movement_id TEXT;
  v_summary_key TEXT;
BEGIN
  v_summary_key := 'stock_summary:' || p_item_id || ':' || p_warehouse_id;

  -- Calculate from active batches
  SELECT
    COALESCE(SUM((value->>'quantity_remaining')::NUMERIC), 0),
    COALESCE(SUM((value->>'quantity_remaining')::NUMERIC * (value->>'unit_cost')::NUMERIC), 0)
  INTO v_total_qty, v_total_value
  FROM kv_store_6a7942bb
  WHERE key LIKE 'stock_batch:%'
    AND value->>'item_id' = p_item_id
    AND value->>'warehouse_id' = p_warehouse_id
    AND value->>'status' = 'active'
    AND (value->>'quantity_remaining')::NUMERIC > 0;

  -- Calculate average cost
  IF v_total_qty > 0 THEN
    v_average_cost := v_total_value / v_total_qty;
  END IF;

  -- Get last movement
  SELECT
    (value->>'movement_date')::DATE,
    value->>'id'
  INTO v_last_movement_date, v_last_movement_id
  FROM kv_store_6a7942bb
  WHERE key LIKE 'stock_movement:%'
    AND value->>'item_id' = p_item_id
    AND value->>'warehouse_id' = p_warehouse_id
  ORDER BY value->>'movement_date' DESC, value->>'created_at' DESC
  LIMIT 1;

  -- Upsert summary
  INSERT INTO kv_store_6a7942bb (key, value) VALUES
  (v_summary_key, jsonb_build_object(
    'item_id', p_item_id,
    'warehouse_id', p_warehouse_id,
    'quantity_on_hand', v_total_qty,
    'quantity_reserved', 0,
    'quantity_available', v_total_qty,
    'average_cost', v_average_cost,
    'total_value', v_total_value,
    'last_movement_date', v_last_movement_date,
    'last_movement_id', v_last_movement_id,
    'updated_at', NOW()
  ))
  ON CONFLICT (key) DO UPDATE
  SET value = jsonb_build_object(
    'item_id', p_item_id,
    'warehouse_id', p_warehouse_id,
    'quantity_on_hand', v_total_qty,
    'quantity_reserved', COALESCE((kv_store_6a7942bb.value->>'quantity_reserved')::NUMERIC, 0),
    'quantity_available', v_total_qty - COALESCE((kv_store_6a7942bb.value->>'quantity_reserved')::NUMERIC, 0),
    'average_cost', v_average_cost,
    'total_value', v_total_value,
    'last_movement_date', v_last_movement_date,
    'last_movement_id', v_last_movement_id,
    'updated_at', NOW()
  );

  -- Update summary index
  INSERT INTO kv_store_6a7942bb (key, value) VALUES
  ('stock_summary:index', jsonb_build_object(
    'keys', jsonb_build_array(v_summary_key),
    'updated_at', NOW()
  ))
  ON CONFLICT (key) DO UPDATE
  SET value = jsonb_set(
    kv_store_6a7942bb.value,
    '{keys}',
    CASE
      WHEN kv_store_6a7942bb.value->'keys' @> to_jsonb(ARRAY[v_summary_key])
      THEN kv_store_6a7942bb.value->'keys'
      ELSE COALESCE(kv_store_6a7942bb.value->'keys', '[]'::jsonb) || to_jsonb(ARRAY[v_summary_key])
    END
  );

  RETURN jsonb_build_object(
    'item_id', p_item_id,
    'warehouse_id', p_warehouse_id,
    'quantity_on_hand', v_total_qty,
    'average_cost', v_average_cost,
    'total_value', v_total_value
  );
END;
$$ LANGUAGE plpgsql;

-- Usage:
-- SELECT update_stock_summary('ITM00001', 'WH003');


-- =====================================================
-- 7. FUNCTION: Complete Stock Transaction (IN)
-- =====================================================
CREATE OR REPLACE FUNCTION complete_stock_in_transaction(
  p_item_id TEXT,
  p_warehouse_id TEXT,
  p_quantity NUMERIC,
  p_unit TEXT,
  p_unit_cost NUMERIC,
  p_transaction_type TEXT,
  p_reference_type TEXT,
  p_reference_id TEXT,
  p_movement_number TEXT,
  p_batch_number TEXT DEFAULT NULL,
  p_notes TEXT DEFAULT NULL,
  p_created_by TEXT DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
  v_result JSONB;
BEGIN
  -- Process stock in
  v_result := process_stock_in(
    p_item_id, p_warehouse_id, p_quantity, p_unit, p_unit_cost,
    p_transaction_type, p_reference_type, p_reference_id,
    p_movement_number, p_batch_number, p_notes, p_created_by
  );

  -- Update summary
  PERFORM update_stock_summary(p_item_id, p_warehouse_id);

  RETURN v_result;
END;
$$ LANGUAGE plpgsql;


-- =====================================================
-- 8. FUNCTION: Complete Stock Transaction (OUT)
-- =====================================================
CREATE OR REPLACE FUNCTION complete_stock_out_transaction(
  p_item_id TEXT,
  p_warehouse_id TEXT,
  p_quantity NUMERIC,
  p_transaction_type TEXT,
  p_reference_type TEXT,
  p_reference_id TEXT,
  p_movement_number TEXT,
  p_notes TEXT DEFAULT NULL,
  p_created_by TEXT DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
  v_result JSONB;
BEGIN
  -- Process FIFO out
  v_result := process_fifo_out(
    p_item_id, p_warehouse_id, p_quantity,
    p_transaction_type, p_reference_type, p_reference_id,
    p_movement_number, p_notes, p_created_by
  );

  -- Update summary
  PERFORM update_stock_summary(p_item_id, p_warehouse_id);

  RETURN v_result;
END;
$$ LANGUAGE plpgsql;


-- =====================================================
-- 9. VIEW: Stock Summary View
-- =====================================================
CREATE OR REPLACE VIEW v_stock_summary AS
SELECT
  s.value->>'item_id' as item_id,
  i.value->>'code' as item_code,
  i.value->>'name' as item_name,
  s.value->>'warehouse_id' as warehouse_id,
  w.value->>'name' as warehouse_name,
  (s.value->>'quantity_on_hand')::NUMERIC as quantity_on_hand,
  (s.value->>'quantity_reserved')::NUMERIC as quantity_reserved,
  (s.value->>'quantity_available')::NUMERIC as quantity_available,
  i.value->>'unit' as unit,
  (s.value->>'average_cost')::NUMERIC as average_cost,
  (s.value->>'total_value')::NUMERIC as total_value,
  (s.value->>'last_movement_date')::DATE as last_movement_date,
  s.value->>'updated_at' as updated_at
FROM kv_store_6a7942bb s
LEFT JOIN kv_store_6a7942bb i ON i.key = 'item:' || (s.value->>'item_id')
LEFT JOIN kv_store_6a7942bb w ON w.key = 'warehouse:' || (s.value->>'warehouse_id')
WHERE s.key LIKE 'stock_summary:%';


-- =====================================================
-- 10. VIEW: Active Batches View
-- =====================================================
CREATE OR REPLACE VIEW v_active_batches AS
SELECT
  b.value->>'id' as batch_id,
  b.value->>'batch_number' as batch_number,
  b.value->>'item_id' as item_id,
  i.value->>'code' as item_code,
  i.value->>'name' as item_name,
  b.value->>'warehouse_id' as warehouse_id,
  w.value->>'name' as warehouse_name,
  (b.value->>'receipt_date')::DATE as receipt_date,
  (b.value->>'quantity_in')::NUMERIC as quantity_in,
  (b.value->>'quantity_remaining')::NUMERIC as quantity_remaining,
  i.value->>'unit' as unit,
  (b.value->>'unit_cost')::NUMERIC as unit_cost,
  (b.value->>'total_cost')::NUMERIC as total_cost,
  b.value->>'reference_type' as reference_type,
  b.value->>'reference_id' as reference_id,
  b.value->>'status' as status
FROM kv_store_6a7942bb b
LEFT JOIN kv_store_6a7942bb i ON i.key = 'item:' || (b.value->>'item_id')
LEFT JOIN kv_store_6a7942bb w ON w.key = 'warehouse:' || (b.value->>'warehouse_id')
WHERE b.key LIKE 'stock_batch:%'
  AND b.value->>'status' = 'active'
  AND (b.value->>'quantity_remaining')::NUMERIC > 0
ORDER BY (b.value->>'receipt_date')::DATE ASC;


-- =====================================================
-- USAGE EXAMPLES
-- =====================================================

/*

-- 1. Penerimaan Barang dari Purchase Order
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
  'PO-2026-001-BATCH1', -- batch_number (optional)
  'Penerimaan dari Supplier XYZ', -- notes
  'user-123'            -- created_by
);


-- 2. Pengeluaran Barang untuk Produksi (FIFO)
SELECT complete_stock_out_transaction(
  'ITM00001',           -- item_id
  'WH003',              -- warehouse_id
  500,                  -- quantity
  'OUT_PRODUCTION',     -- transaction_type
  'work_order',         -- reference_type
  'WO-2026-001',        -- reference_id
  'OUT-2026-001',       -- movement_number
  'Pemakaian untuk WO-2026-001', -- notes
  'user-123'            -- created_by
);


-- 3. Lihat Stock Summary
SELECT * FROM v_stock_summary
WHERE item_code = 'FILM-BOPP-001';


-- 4. Lihat Active Batches untuk Item
SELECT * FROM v_active_batches
WHERE item_code = 'FILM-BOPP-001'
  AND warehouse_id = 'WH003';


-- 5. Kartu Stock (Stock Card)
SELECT
  m.value->>'movement_date' as date,
  m.value->>'movement_number' as doc_no,
  m.value->>'transaction_type' as type,
  (m.value->>'quantity')::NUMERIC as qty,
  (m.value->>'unit_cost')::NUMERIC as cost,
  (m.value->>'total_cost')::NUMERIC as value
FROM kv_store_6a7942bb m
WHERE m.key LIKE 'stock_movement:%'
  AND m.value->>'item_id' = 'ITM00001'
  AND m.value->>'warehouse_id' = 'WH003'
ORDER BY
  (m.value->>'movement_date')::DATE DESC,
  m.value->>'created_at' DESC
LIMIT 50;


-- 6. Stock Opname Report
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


-- 7. Low Stock Report (dibawah reorder point)
SELECT
  i.value->>'code' as item_code,
  i.value->>'name' as item_name,
  s.warehouse_name,
  s.quantity_on_hand,
  (i.value->'stock_control'->>'reorder_point')::NUMERIC as reorder_point,
  (i.value->'stock_control'->>'min_stock')::NUMERIC as min_stock
FROM v_stock_summary s
JOIN kv_store_6a7942bb i ON i.key = 'item:' || s.item_id
WHERE s.quantity_on_hand <= (i.value->'stock_control'->>'reorder_point')::NUMERIC
ORDER BY s.warehouse_name, i.value->>'code';

*/
