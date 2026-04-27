-- =====================================================
-- INVENTORY FIFO HELPER FUNCTIONS
-- Migration: Create helper functions for FIFO operations
-- =====================================================

-- Drop existing functions if they exist
DROP FUNCTION IF EXISTS get_next_counter(TEXT);
DROP FUNCTION IF EXISTS create_stock_batch(TEXT, TEXT, TEXT, NUMERIC, TEXT, NUMERIC, TEXT, TEXT, TEXT, DATE, TEXT);
DROP FUNCTION IF EXISTS get_active_batches(TEXT, TEXT);
DROP FUNCTION IF EXISTS process_fifo_out(TEXT, TEXT, NUMERIC, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT);
DROP FUNCTION IF EXISTS process_stock_in(TEXT, TEXT, NUMERIC, TEXT, NUMERIC, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, DATE, TEXT);
DROP FUNCTION IF EXISTS update_stock_summary(TEXT, TEXT);
DROP FUNCTION IF EXISTS complete_stock_in_transaction(TEXT, TEXT, NUMERIC, TEXT, NUMERIC, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT);
DROP FUNCTION IF EXISTS complete_stock_out_transaction(TEXT, TEXT, NUMERIC, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT);
DROP VIEW IF EXISTS v_stock_summary;
DROP VIEW IF EXISTS v_active_batches;


-- =====================================================
-- 1. Get Next Counter
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

  SELECT
    (value->>'current')::INTEGER,
    value->>'prefix'
  INTO current_value, prefix
  FROM kv_store_6a7942bb
  WHERE key = counter_key;

  current_value := current_value + 1;

  UPDATE kv_store_6a7942bb
  SET value = jsonb_set(
    jsonb_set(value, '{current}', to_jsonb(current_value)),
    '{updated_at}', to_jsonb(NOW())
  )
  WHERE key = counter_key;

  next_id := prefix || LPAD(current_value::TEXT, 5, '0');

  RETURN next_id;
END;
$$ LANGUAGE plpgsql;


-- =====================================================
-- 2. Create Stock Batch
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
  v_batch_id := get_next_counter('stock_batch');
  v_total_cost := p_quantity * p_unit_cost;

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

  UPDATE kv_store_6a7942bb
  SET value = jsonb_set(
    value,
    '{ids}',
    COALESCE(value->'ids', '[]'::jsonb) || to_jsonb(ARRAY[v_batch_id])
  )
  WHERE key = 'stock_batch:index';

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


-- =====================================================
-- 3. Get Active Batches (FIFO Order)
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


-- =====================================================
-- 4. Process FIFO Out
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
  v_movement_suffix INTEGER := 1;
BEGIN
  v_remaining_qty := p_quantity;

  FOR v_batch IN
    SELECT * FROM get_active_batches(p_item_id, p_warehouse_id)
  LOOP
    EXIT WHEN v_remaining_qty <= 0;

    v_take_qty := LEAST(v_remaining_qty, v_batch.quantity_remaining);
    v_movement_id := get_next_counter('stock_movement');

    INSERT INTO kv_store_6a7942bb (key, value) VALUES
    ('stock_movement:' || v_movement_id, jsonb_build_object(
      'id', v_movement_id,
      'movement_number', p_movement_number || '-' || v_movement_suffix,
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

    UPDATE kv_store_6a7942bb
    SET value = jsonb_set(
      value,
      '{quantity_remaining}',
      to_jsonb(v_batch.quantity_remaining - v_take_qty)
    )
    WHERE key = 'stock_batch:' || v_batch.batch_id;

    IF v_batch.quantity_remaining - v_take_qty = 0 THEN
      UPDATE kv_store_6a7942bb
      SET value = jsonb_set(value, '{status}', '"depleted"')
      WHERE key = 'stock_batch:' || v_batch.batch_id;
    END IF;

    v_movements := v_movements || jsonb_build_object(
      'movement_id', v_movement_id,
      'batch_id', v_batch.batch_id,
      'quantity', v_take_qty,
      'cost', v_take_qty * v_batch.unit_cost
    );

    v_total_cost := v_total_cost + (v_take_qty * v_batch.unit_cost);
    v_remaining_qty := v_remaining_qty - v_take_qty;
    v_movement_suffix := v_movement_suffix + 1;
  END LOOP;

  IF v_remaining_qty > 0 THEN
    RAISE EXCEPTION 'Insufficient stock. Short by: %', v_remaining_qty;
  END IF;

  UPDATE kv_store_6a7942bb
  SET value = jsonb_set(
    value,
    '{ids}',
    COALESCE(value->'ids', '[]'::jsonb) ||
    (SELECT jsonb_agg(value->>'movement_id') FROM jsonb_array_elements(v_movements))
  )
  WHERE key = 'stock_movement:index';

  RETURN jsonb_build_object(
    'success', true,
    'quantity_out', p_quantity,
    'total_cost', v_total_cost,
    'average_cost', v_total_cost / p_quantity,
    'movements', v_movements
  );
END;
$$ LANGUAGE plpgsql;


-- =====================================================
-- 5. Process Stock In
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
  v_batch_number := COALESCE(p_batch_number, p_reference_id || '-' || to_char(NOW(), 'YYYYMMDD-HH24MISS'));

  v_batch_id := create_stock_batch(
    p_item_id, p_warehouse_id, v_batch_number,
    p_quantity, p_unit, p_unit_cost,
    p_reference_type, p_reference_id,
    p_created_by, p_expiry_date, p_lot_number
  );

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


-- =====================================================
-- 6. Update Stock Summary
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

  IF v_total_qty > 0 THEN
    v_average_cost := v_total_value / v_total_qty;
  END IF;

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


-- =====================================================
-- 7. Complete Stock IN Transaction
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
  v_result := process_stock_in(
    p_item_id, p_warehouse_id, p_quantity, p_unit, p_unit_cost,
    p_transaction_type, p_reference_type, p_reference_id,
    p_movement_number, p_batch_number, p_notes, p_created_by
  );

  PERFORM update_stock_summary(p_item_id, p_warehouse_id);

  RETURN v_result;
END;
$$ LANGUAGE plpgsql;


-- =====================================================
-- 8. Complete Stock OUT Transaction
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
  v_result := process_fifo_out(
    p_item_id, p_warehouse_id, p_quantity,
    p_transaction_type, p_reference_type, p_reference_id,
    p_movement_number, p_notes, p_created_by
  );

  PERFORM update_stock_summary(p_item_id, p_warehouse_id);

  RETURN v_result;
END;
$$ LANGUAGE plpgsql;


-- =====================================================
-- 9. VIEW: Stock Summary
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
-- 10. VIEW: Active Batches
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


-- Grant permissions
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO service_role;
GRANT SELECT ON v_stock_summary TO authenticated;
GRANT SELECT ON v_active_batches TO authenticated;

-- Add comments
COMMENT ON FUNCTION get_next_counter IS 'Generate next ID for entity type using counter';
COMMENT ON FUNCTION create_stock_batch IS 'Create new stock batch for FIFO';
COMMENT ON FUNCTION get_active_batches IS 'Get active batches for item in FIFO order';
COMMENT ON FUNCTION process_fifo_out IS 'Process stock out using FIFO method';
COMMENT ON FUNCTION process_stock_in IS 'Process stock in and create batch';
COMMENT ON FUNCTION update_stock_summary IS 'Update stock summary for item/warehouse';
COMMENT ON FUNCTION complete_stock_in_transaction IS 'Complete stock IN transaction with summary update';
COMMENT ON FUNCTION complete_stock_out_transaction IS 'Complete stock OUT transaction with FIFO and summary update';
COMMENT ON VIEW v_stock_summary IS 'View for stock summary with item and warehouse details';
COMMENT ON VIEW v_active_batches IS 'View for active batches with details';
