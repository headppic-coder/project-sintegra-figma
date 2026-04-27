-- Inventory Schema Tables
-- Migration: Create inventory management tables

-- Inventory: Stock Locations/Warehouses
CREATE TABLE inventory.warehouses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(200) NOT NULL,
  address TEXT,
  manager_id UUID REFERENCES auth.users(id),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Inventory: Stock (current stock levels)
CREATE TABLE inventory.stock (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  material_id UUID REFERENCES master.materials(id) NOT NULL,
  warehouse_id UUID REFERENCES inventory.warehouses(id) NOT NULL,
  quantity DECIMAL(15,3) NOT NULL DEFAULT 0,
  reserved_quantity DECIMAL(15,3) DEFAULT 0, -- quantity allocated to work orders
  available_quantity DECIMAL(15,3) GENERATED ALWAYS AS (quantity - reserved_quantity) STORED,
  unit VARCHAR(20) NOT NULL,
  min_stock_level DECIMAL(15,3),
  max_stock_level DECIMAL(15,3),
  reorder_point DECIMAL(15,3),
  last_restock_date DATE,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(material_id, warehouse_id)
);

-- Inventory: Stock Transactions
CREATE TABLE inventory.stock_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_number VARCHAR(50) UNIQUE NOT NULL,
  material_id UUID REFERENCES master.materials(id) NOT NULL,
  warehouse_id UUID REFERENCES inventory.warehouses(id) NOT NULL,
  transaction_type VARCHAR(50) NOT NULL, -- 'purchase', 'production', 'adjustment', 'transfer', 'waste'
  transaction_date DATE DEFAULT CURRENT_DATE,
  quantity DECIMAL(15,3) NOT NULL,
  unit VARCHAR(20) NOT NULL,
  unit_cost DECIMAL(15,2),
  total_cost DECIMAL(15,2),
  reference_type VARCHAR(50), -- 'purchase_order', 'work_order', 'adjustment', etc
  reference_id UUID,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- Inventory: Purchase Orders
CREATE TABLE inventory.purchase_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  po_number VARCHAR(50) UNIQUE NOT NULL,
  supplier_name VARCHAR(200) NOT NULL,
  supplier_contact TEXT,
  order_date DATE DEFAULT CURRENT_DATE,
  expected_delivery_date DATE,
  actual_delivery_date DATE,
  total_amount DECIMAL(15,2),
  status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'confirmed', 'partial', 'received', 'cancelled'
  payment_status VARCHAR(50) DEFAULT 'unpaid', -- 'unpaid', 'partial', 'paid'
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id)
);

-- Inventory: Purchase Order Items
CREATE TABLE inventory.purchase_order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  purchase_order_id UUID REFERENCES inventory.purchase_orders(id) ON DELETE CASCADE,
  material_id UUID REFERENCES master.materials(id) NOT NULL,
  item_number INTEGER NOT NULL,
  quantity DECIMAL(15,3) NOT NULL,
  received_quantity DECIMAL(15,3) DEFAULT 0,
  unit VARCHAR(20) NOT NULL,
  unit_price DECIMAL(15,2) NOT NULL,
  subtotal DECIMAL(15,2) NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Inventory: Stock Adjustments
CREATE TABLE inventory.stock_adjustments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  adjustment_number VARCHAR(50) UNIQUE NOT NULL,
  adjustment_date DATE DEFAULT CURRENT_DATE,
  adjustment_type VARCHAR(50) NOT NULL, -- 'increase', 'decrease', 'correction'
  reason VARCHAR(200) NOT NULL,
  notes TEXT,
  approved_by UUID REFERENCES auth.users(id),
  approved_at TIMESTAMPTZ,
  status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- Inventory: Stock Adjustment Items
CREATE TABLE inventory.stock_adjustment_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  adjustment_id UUID REFERENCES inventory.stock_adjustments(id) ON DELETE CASCADE,
  material_id UUID REFERENCES master.materials(id) NOT NULL,
  warehouse_id UUID REFERENCES inventory.warehouses(id) NOT NULL,
  old_quantity DECIMAL(15,3) NOT NULL,
  new_quantity DECIMAL(15,3) NOT NULL,
  difference DECIMAL(15,3) GENERATED ALWAYS AS (new_quantity - old_quantity) STORED,
  unit VARCHAR(20) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_stock_material ON inventory.stock(material_id);
CREATE INDEX idx_stock_warehouse ON inventory.stock(warehouse_id);
CREATE INDEX idx_stock_transactions_material ON inventory.stock_transactions(material_id);
CREATE INDEX idx_stock_transactions_date ON inventory.stock_transactions(transaction_date);
CREATE INDEX idx_purchase_orders_status ON inventory.purchase_orders(status);
CREATE INDEX idx_purchase_orders_date ON inventory.purchase_orders(order_date);

-- Enable RLS
ALTER TABLE inventory.warehouses ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory.stock ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory.stock_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory.purchase_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory.purchase_order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory.stock_adjustments ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory.stock_adjustment_items ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Allow authenticated users to read warehouses" ON inventory.warehouses
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated users to read stock" ON inventory.stock
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated users to read stock transactions" ON inventory.stock_transactions
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated users to read purchase orders" ON inventory.purchase_orders
  FOR SELECT TO authenticated USING (true);

-- Grant permissions
GRANT SELECT ON ALL TABLES IN SCHEMA inventory TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA inventory TO service_role;
