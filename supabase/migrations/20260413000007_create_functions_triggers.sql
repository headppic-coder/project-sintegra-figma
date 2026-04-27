-- Database Functions and Triggers
-- Migration: Create utility functions and triggers

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at on all tables with that column

-- Master schema triggers
CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON master.categories
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_materials_updated_at BEFORE UPDATE ON master.materials
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_process_costs_updated_at BEFORE UPDATE ON master.process_costs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_product_types_updated_at BEFORE UPDATE ON master.product_types
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_settings_updated_at BEFORE UPDATE ON master.settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Sales schema triggers
CREATE TRIGGER update_customers_updated_at BEFORE UPDATE ON sales.customers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_price_formulas_updated_at BEFORE UPDATE ON sales.price_formulas
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_quotations_updated_at BEFORE UPDATE ON sales.quotations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON sales.orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Production schema triggers
CREATE TRIGGER update_work_orders_updated_at BEFORE UPDATE ON production.work_orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_process_steps_updated_at BEFORE UPDATE ON production.process_steps
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_machines_updated_at BEFORE UPDATE ON production.machines
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Inventory schema triggers
CREATE TRIGGER update_warehouses_updated_at BEFORE UPDATE ON inventory.warehouses
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_stock_updated_at BEFORE UPDATE ON inventory.stock
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_purchase_orders_updated_at BEFORE UPDATE ON inventory.purchase_orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Finance schema triggers
CREATE TRIGGER update_invoices_updated_at BEFORE UPDATE ON finance.invoices
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to update stock from transactions
CREATE OR REPLACE FUNCTION update_stock_from_transaction()
RETURNS TRIGGER AS $$
BEGIN
  -- Update stock quantity based on transaction
  INSERT INTO inventory.stock (material_id, warehouse_id, quantity, unit)
  VALUES (NEW.material_id, NEW.warehouse_id, NEW.quantity, NEW.unit)
  ON CONFLICT (material_id, warehouse_id)
  DO UPDATE SET
    quantity = inventory.stock.quantity + NEW.quantity,
    updated_at = NOW();

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update stock when transaction is created
CREATE TRIGGER update_stock_on_transaction
  AFTER INSERT ON inventory.stock_transactions
  FOR EACH ROW
  EXECUTE FUNCTION update_stock_from_transaction();

-- Function to generate sequential numbers
CREATE OR REPLACE FUNCTION generate_sequence_number(prefix TEXT, schema_name TEXT, table_name TEXT, column_name TEXT)
RETURNS TEXT AS $$
DECLARE
  next_number INTEGER;
  formatted_number TEXT;
BEGIN
  EXECUTE format('SELECT COALESCE(MAX(SUBSTRING(%I FROM ''\d+$'')::INTEGER), 0) + 1 FROM %I.%I WHERE %I LIKE %L',
    column_name, schema_name, table_name, column_name, prefix || '%')
  INTO next_number;

  formatted_number := prefix || LPAD(next_number::TEXT, 6, '0');
  RETURN formatted_number;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate invoice total
CREATE OR REPLACE FUNCTION calculate_invoice_total()
RETURNS TRIGGER AS $$
BEGIN
  NEW.tax_amount := (NEW.subtotal - COALESCE(NEW.discount_amount, 0)) * (NEW.tax_percentage / 100);
  NEW.total_amount := NEW.subtotal - COALESCE(NEW.discount_amount, 0) + NEW.tax_amount;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for invoice total calculation
CREATE TRIGGER calculate_invoice_total_trigger
  BEFORE INSERT OR UPDATE ON finance.invoices
  FOR EACH ROW
  EXECUTE FUNCTION calculate_invoice_total();

-- Function to update invoice status based on payments
CREATE OR REPLACE FUNCTION update_invoice_payment_status()
RETURNS TRIGGER AS $$
DECLARE
  total_paid DECIMAL(15,2);
  invoice_total DECIMAL(15,2);
BEGIN
  -- Get total paid and invoice total
  SELECT COALESCE(SUM(amount), 0) INTO total_paid
  FROM finance.payments
  WHERE invoice_id = COALESCE(NEW.invoice_id, OLD.invoice_id) AND status = 'confirmed';

  SELECT total_amount INTO invoice_total
  FROM finance.invoices
  WHERE id = COALESCE(NEW.invoice_id, OLD.invoice_id);

  -- Update invoice status
  UPDATE finance.invoices
  SET
    paid_amount = total_paid,
    status = CASE
      WHEN total_paid = 0 THEN 'unpaid'
      WHEN total_paid >= invoice_total THEN 'paid'
      ELSE 'partial'
    END
  WHERE id = COALESCE(NEW.invoice_id, OLD.invoice_id);

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Trigger to update invoice status on payment
CREATE TRIGGER update_invoice_on_payment
  AFTER INSERT OR UPDATE OR DELETE ON finance.payments
  FOR EACH ROW
  EXECUTE FUNCTION update_invoice_payment_status();

-- Create view for stock with material details
CREATE OR REPLACE VIEW inventory.stock_with_details AS
SELECT
  s.id,
  s.material_id,
  m.code AS material_code,
  m.name AS material_name,
  m.type AS material_type,
  s.warehouse_id,
  w.code AS warehouse_code,
  w.name AS warehouse_name,
  s.quantity,
  s.reserved_quantity,
  s.available_quantity,
  s.unit,
  s.min_stock_level,
  s.max_stock_level,
  s.reorder_point,
  CASE
    WHEN s.available_quantity <= s.reorder_point THEN 'low'
    WHEN s.available_quantity <= s.min_stock_level THEN 'critical'
    ELSE 'normal'
  END AS stock_status,
  s.last_restock_date,
  s.updated_at
FROM inventory.stock s
JOIN master.materials m ON s.material_id = m.id
JOIN inventory.warehouses w ON s.warehouse_id = w.id;

-- Grant access to view
GRANT SELECT ON inventory.stock_with_details TO authenticated;

COMMENT ON FUNCTION update_updated_at_column() IS 'Automatically update updated_at timestamp';
COMMENT ON FUNCTION generate_sequence_number(TEXT, TEXT, TEXT, TEXT) IS 'Generate sequential numbers with prefix for document numbers';
COMMENT ON FUNCTION calculate_invoice_total() IS 'Calculate invoice total including tax and discount';
COMMENT ON VIEW inventory.stock_with_details IS 'Stock view with material and warehouse details including stock status';
