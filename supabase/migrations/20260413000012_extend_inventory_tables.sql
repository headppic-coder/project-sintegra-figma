-- Extended Inventory/Warehouse Schema Tables
-- Migration: Add missing warehouse/inventory tables from routes

-- Inventory: Item Requests (Permintaan Barang dari Gudang)
CREATE TABLE inventory.item_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_number VARCHAR(50) UNIQUE NOT NULL,
  request_date DATE DEFAULT CURRENT_DATE,
  requested_by UUID REFERENCES auth.users(id) NOT NULL,
  department VARCHAR(100),
  request_type VARCHAR(50) DEFAULT 'production', -- 'production', 'maintenance', 'office', 'sample'
  work_order_id UUID REFERENCES production.work_orders(id),
  required_date DATE,
  priority VARCHAR(20) DEFAULT 'normal',
  status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'approved', 'rejected', 'prepared', 'issued', 'completed', 'cancelled'
  approved_by UUID REFERENCES auth.users(id),
  approved_at TIMESTAMPTZ,
  prepared_by UUID REFERENCES auth.users(id),
  issued_by UUID REFERENCES auth.users(id),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Inventory: Item Request Details
CREATE TABLE inventory.item_request_details (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID REFERENCES inventory.item_requests(id) ON DELETE CASCADE,
  item_number INTEGER NOT NULL,
  material_id UUID REFERENCES master.materials(id) NOT NULL,
  warehouse_id UUID REFERENCES inventory.warehouses(id),
  quantity_requested DECIMAL(15,3) NOT NULL,
  quantity_approved DECIMAL(15,3),
  quantity_issued DECIMAL(15,3),
  unit VARCHAR(20) NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Inventory: Item Receipts (Penerimaan Barang ke Gudang)
CREATE TABLE inventory.item_receipts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  receipt_number VARCHAR(50) UNIQUE NOT NULL,
  receipt_date DATE DEFAULT CURRENT_DATE,
  receipt_type VARCHAR(50) NOT NULL, -- 'purchase', 'production', 'return', 'transfer', 'adjustment'
  warehouse_id UUID REFERENCES inventory.warehouses(id) NOT NULL,
  purchase_order_id UUID REFERENCES inventory.purchase_orders(id),
  supplier_name VARCHAR(200),
  delivery_note_number VARCHAR(50),
  received_by UUID REFERENCES auth.users(id),
  inspected_by UUID REFERENCES auth.users(id),
  inspection_status VARCHAR(50), -- 'pending', 'passed', 'failed', 'partial'
  status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'inspected', 'stored', 'rejected'
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Inventory: Item Receipt Details
CREATE TABLE inventory.item_receipt_details (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  receipt_id UUID REFERENCES inventory.item_receipts(id) ON DELETE CASCADE,
  item_number INTEGER NOT NULL,
  material_id UUID REFERENCES master.materials(id) NOT NULL,
  quantity_received DECIMAL(15,3) NOT NULL,
  quantity_accepted DECIMAL(15,3),
  quantity_rejected DECIMAL(15,3),
  unit VARCHAR(20) NOT NULL,
  batch_number VARCHAR(50),
  expiry_date DATE,
  inspection_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Inventory: Material Preparation (Persiapan Material untuk Produksi)
CREATE TABLE inventory.material_preparation (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  preparation_number VARCHAR(50) UNIQUE NOT NULL,
  preparation_date DATE DEFAULT CURRENT_DATE,
  work_order_id UUID REFERENCES production.work_orders(id) NOT NULL,
  warehouse_id UUID REFERENCES inventory.warehouses(id) NOT NULL,
  prepared_by UUID REFERENCES auth.users(id),
  status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'in_progress', 'completed', 'cancelled'
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Inventory: Material Preparation Details
CREATE TABLE inventory.material_preparation_details (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  preparation_id UUID REFERENCES inventory.material_preparation(id) ON DELETE CASCADE,
  item_number INTEGER NOT NULL,
  material_id UUID REFERENCES master.materials(id) NOT NULL,
  quantity_required DECIMAL(15,3) NOT NULL,
  quantity_prepared DECIMAL(15,3),
  unit VARCHAR(20) NOT NULL,
  batch_number VARCHAR(50),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Inventory: Production Outgoing (Pengeluaran Material ke Produksi)
CREATE TABLE inventory.production_outgoing (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  outgoing_number VARCHAR(50) UNIQUE NOT NULL,
  outgoing_date DATE DEFAULT CURRENT_DATE,
  warehouse_id UUID REFERENCES inventory.warehouses(id) NOT NULL,
  work_order_id UUID REFERENCES production.work_orders(id) NOT NULL,
  process_unit_id UUID REFERENCES production.process_units(id),
  issued_by UUID REFERENCES auth.users(id),
  received_by UUID REFERENCES auth.users(id),
  status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'issued', 'received', 'cancelled'
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Inventory: Production Outgoing Details
CREATE TABLE inventory.production_outgoing_details (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  outgoing_id UUID REFERENCES inventory.production_outgoing(id) ON DELETE CASCADE,
  item_number INTEGER NOT NULL,
  material_id UUID REFERENCES master.materials(id) NOT NULL,
  quantity_issued DECIMAL(15,3) NOT NULL,
  unit VARCHAR(20) NOT NULL,
  batch_number VARCHAR(50),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Inventory: Production Incoming (Penerimaan Hasil Produksi ke Gudang)
CREATE TABLE inventory.production_incoming (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  incoming_number VARCHAR(50) UNIQUE NOT NULL,
  incoming_date DATE DEFAULT CURRENT_DATE,
  warehouse_id UUID REFERENCES inventory.warehouses(id) NOT NULL,
  work_order_id UUID REFERENCES production.work_orders(id) NOT NULL,
  product_name VARCHAR(200),
  quantity_produced INTEGER NOT NULL,
  quantity_good INTEGER NOT NULL,
  quantity_reject INTEGER,
  delivered_by UUID REFERENCES auth.users(id),
  received_by UUID REFERENCES auth.users(id),
  status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'received', 'stored'
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Inventory: Tool Registry (Alat/Tools Management)
CREATE TABLE inventory.tool_registry (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tool_code VARCHAR(50) UNIQUE NOT NULL,
  tool_name VARCHAR(200) NOT NULL,
  tool_type VARCHAR(50), -- 'cutting', 'measuring', 'hand_tool', 'power_tool', etc
  brand VARCHAR(100),
  model VARCHAR(100),
  serial_number VARCHAR(100),
  purchase_date DATE,
  purchase_price DECIMAL(15,2),
  warehouse_id UUID REFERENCES inventory.warehouses(id),
  location VARCHAR(200),
  condition VARCHAR(50) DEFAULT 'good', -- 'good', 'fair', 'worn', 'damaged', 'lost'
  calibration_due_date DATE,
  maintenance_schedule VARCHAR(100),
  assigned_to UUID REFERENCES auth.users(id),
  is_available BOOLEAN DEFAULT true,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Inventory: Min/Max Stock Settings
CREATE TABLE inventory.min_max_stock (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  material_id UUID REFERENCES master.materials(id) NOT NULL,
  warehouse_id UUID REFERENCES inventory.warehouses(id) NOT NULL,
  min_stock DECIMAL(15,3) NOT NULL,
  max_stock DECIMAL(15,3) NOT NULL,
  reorder_point DECIMAL(15,3) NOT NULL,
  reorder_quantity DECIMAL(15,3),
  lead_time_days INTEGER,
  safety_stock DECIMAL(15,3),
  unit VARCHAR(20) NOT NULL,
  is_active BOOLEAN DEFAULT true,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(material_id, warehouse_id)
);

-- Create indexes
CREATE INDEX idx_item_requests_date ON inventory.item_requests(request_date);
CREATE INDEX idx_item_requests_status ON inventory.item_requests(status);
CREATE INDEX idx_item_requests_work_order ON inventory.item_requests(work_order_id);
CREATE INDEX idx_item_receipts_date ON inventory.item_receipts(receipt_date);
CREATE INDEX idx_item_receipts_warehouse ON inventory.item_receipts(warehouse_id);
CREATE INDEX idx_item_receipts_po ON inventory.item_receipts(purchase_order_id);
CREATE INDEX idx_material_preparation_work_order ON inventory.material_preparation(work_order_id);
CREATE INDEX idx_production_outgoing_work_order ON inventory.production_outgoing(work_order_id);
CREATE INDEX idx_production_outgoing_date ON inventory.production_outgoing(outgoing_date);
CREATE INDEX idx_production_incoming_work_order ON inventory.production_incoming(work_order_id);
CREATE INDEX idx_production_incoming_date ON inventory.production_incoming(incoming_date);
CREATE INDEX idx_tool_registry_code ON inventory.tool_registry(tool_code);
CREATE INDEX idx_tool_registry_assigned ON inventory.tool_registry(assigned_to);

-- Enable RLS
ALTER TABLE inventory.item_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory.item_request_details ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory.item_receipts ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory.item_receipt_details ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory.material_preparation ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory.material_preparation_details ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory.production_outgoing ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory.production_outgoing_details ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory.production_incoming ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory.tool_registry ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory.min_max_stock ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Allow authenticated users to read item requests" ON inventory.item_requests
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated users to read item receipts" ON inventory.item_receipts
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated users to read material preparation" ON inventory.material_preparation
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated users to read production outgoing" ON inventory.production_outgoing
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated users to read production incoming" ON inventory.production_incoming
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated users to read tool registry" ON inventory.tool_registry
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated users to read min max stock" ON inventory.min_max_stock
  FOR SELECT TO authenticated USING (true);

-- Grant permissions
GRANT SELECT ON ALL TABLES IN SCHEMA inventory TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA inventory TO service_role;

-- Triggers for updated_at
CREATE TRIGGER update_item_requests_updated_at BEFORE UPDATE ON inventory.item_requests
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_item_receipts_updated_at BEFORE UPDATE ON inventory.item_receipts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_material_preparation_updated_at BEFORE UPDATE ON inventory.material_preparation
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_production_outgoing_updated_at BEFORE UPDATE ON inventory.production_outgoing
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_production_incoming_updated_at BEFORE UPDATE ON inventory.production_incoming
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tool_registry_updated_at BEFORE UPDATE ON inventory.tool_registry
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_min_max_stock_updated_at BEFORE UPDATE ON inventory.min_max_stock
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
