-- Extended Procurement Schema Tables
-- Migration: Add missing procurement tables from routes

-- Create procurement schema if not exists
CREATE SCHEMA IF NOT EXISTS procurement;
COMMENT ON SCHEMA procurement IS 'Procurement and supplier management';

GRANT USAGE ON SCHEMA procurement TO authenticated;
GRANT ALL ON SCHEMA procurement TO service_role;

-- Procurement: Vendors/Suppliers (Main supplier registry)
CREATE TABLE procurement.suppliers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_code VARCHAR(50) UNIQUE NOT NULL,
  supplier_name VARCHAR(200) NOT NULL,
  legal_name VARCHAR(200),
  supplier_type VARCHAR(50), -- 'material', 'service', 'both'
  business_type VARCHAR(100),
  tax_id VARCHAR(50),
  address TEXT,
  city VARCHAR(100),
  postal_code VARCHAR(20),
  country VARCHAR(100) DEFAULT 'Indonesia',
  phone VARCHAR(50),
  email VARCHAR(200),
  website VARCHAR(200),
  contact_person VARCHAR(200),
  contact_phone VARCHAR(50),
  contact_email VARCHAR(200),
  payment_terms INTEGER DEFAULT 30, -- days
  currency VARCHAR(10) DEFAULT 'IDR',
  bank_name VARCHAR(100),
  bank_account_number VARCHAR(50),
  bank_account_holder VARCHAR(200),
  registration_date DATE DEFAULT CURRENT_DATE,
  status VARCHAR(50) DEFAULT 'active', -- 'active', 'inactive', 'blacklist'
  rating DECIMAL(3,2), -- 1.00 - 5.00
  is_verified BOOLEAN DEFAULT false,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- Procurement: Vendor Registration (Pendaftaran vendor baru)
CREATE TABLE procurement.vendor_registration (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  registration_number VARCHAR(50) UNIQUE NOT NULL,
  registration_date DATE DEFAULT CURRENT_DATE,
  company_name VARCHAR(200) NOT NULL,
  business_type VARCHAR(100),
  address TEXT,
  city VARCHAR(100),
  phone VARCHAR(50),
  email VARCHAR(200),
  contact_person VARCHAR(200),
  contact_phone VARCHAR(50),
  tax_id VARCHAR(50),
  product_services_offered TEXT,
  business_license_file TEXT,
  tax_file TEXT,
  bank_reference_file TEXT,
  other_documents JSONB,
  registration_status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'review', 'approved', 'rejected'
  reviewed_by UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMPTZ,
  approved_by UUID REFERENCES auth.users(id),
  approved_at TIMESTAMPTZ,
  rejection_reason TEXT,
  supplier_id UUID REFERENCES procurement.suppliers(id),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Procurement: Supplier Evaluation
CREATE TABLE procurement.supplier_evaluation (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  evaluation_number VARCHAR(50) UNIQUE NOT NULL,
  supplier_id UUID REFERENCES procurement.suppliers(id) NOT NULL,
  evaluation_date DATE DEFAULT CURRENT_DATE,
  evaluation_period_start DATE,
  evaluation_period_end DATE,
  evaluator_id UUID REFERENCES auth.users(id),
  criteria JSONB NOT NULL, -- array of criteria with scores
  -- Common criteria: quality, delivery, price, service, documentation
  quality_score DECIMAL(5,2),
  delivery_score DECIMAL(5,2),
  price_score DECIMAL(5,2),
  service_score DECIMAL(5,2),
  documentation_score DECIMAL(5,2),
  total_score DECIMAL(5,2),
  rating VARCHAR(20), -- 'excellent', 'good', 'average', 'poor'
  strengths TEXT,
  weaknesses TEXT,
  recommendations TEXT,
  follow_up_required BOOLEAN DEFAULT false,
  status VARCHAR(50) DEFAULT 'completed',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Procurement: Supplier Quotations (RFQ - Request for Quotation)
CREATE TABLE procurement.supplier_quotations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quotation_number VARCHAR(50) UNIQUE NOT NULL,
  rfq_number VARCHAR(50),
  supplier_id UUID REFERENCES procurement.suppliers(id) NOT NULL,
  quotation_date DATE DEFAULT CURRENT_DATE,
  valid_until DATE,
  requested_by UUID REFERENCES auth.users(id),
  total_amount DECIMAL(15,2),
  currency VARCHAR(10) DEFAULT 'IDR',
  payment_terms INTEGER DEFAULT 30,
  delivery_terms VARCHAR(200),
  delivery_time_days INTEGER,
  notes TEXT,
  quotation_file_url TEXT,
  status VARCHAR(50) DEFAULT 'received', -- 'received', 'under_review', 'approved', 'rejected', 'expired'
  reviewed_by UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Procurement: Supplier Quotation Items
CREATE TABLE procurement.supplier_quotation_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quotation_id UUID REFERENCES procurement.supplier_quotations(id) ON DELETE CASCADE,
  item_number INTEGER NOT NULL,
  material_id UUID REFERENCES master.materials(id),
  item_description TEXT NOT NULL,
  quantity DECIMAL(15,3) NOT NULL,
  unit VARCHAR(20) NOT NULL,
  unit_price DECIMAL(15,2) NOT NULL,
  discount_percentage DECIMAL(5,2) DEFAULT 0,
  discount_amount DECIMAL(15,2) DEFAULT 0,
  subtotal DECIMAL(15,2) NOT NULL,
  tax_percentage DECIMAL(5,2),
  tax_amount DECIMAL(15,2),
  total DECIMAL(15,2),
  delivery_time_days INTEGER,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Procurement: Purchase Orders (extend existing table from inventory)
-- Note: This is already in inventory schema, but we'll add procurement-specific fields
-- We'll create a view instead to avoid duplication

-- Procurement: Purchase Returns (Retur Pembelian)
CREATE TABLE procurement.purchase_returns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  return_number VARCHAR(50) UNIQUE NOT NULL,
  return_date DATE DEFAULT CURRENT_DATE,
  purchase_order_id UUID REFERENCES inventory.purchase_orders(id),
  supplier_id UUID REFERENCES procurement.suppliers(id) NOT NULL,
  return_reason VARCHAR(100) NOT NULL, -- 'defective', 'wrong_item', 'excess', 'expired'
  return_type VARCHAR(50) DEFAULT 'full', -- 'full', 'partial'
  total_amount DECIMAL(15,2),
  return_status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'approved', 'shipped', 'completed', 'rejected'
  approved_by UUID REFERENCES auth.users(id),
  approved_at TIMESTAMPTZ,
  shipped_date DATE,
  received_by_supplier DATE,
  refund_status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'processed', 'completed'
  refund_amount DECIMAL(15,2),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- Procurement: Purchase Return Items
CREATE TABLE procurement.purchase_return_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  return_id UUID REFERENCES procurement.purchase_returns(id) ON DELETE CASCADE,
  item_number INTEGER NOT NULL,
  material_id UUID REFERENCES master.materials(id) NOT NULL,
  quantity_returned DECIMAL(15,3) NOT NULL,
  unit VARCHAR(20) NOT NULL,
  unit_price DECIMAL(15,2),
  subtotal DECIMAL(15,2),
  defect_description TEXT,
  batch_number VARCHAR(50),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Procurement: Purchase Payments (Pembayaran ke Supplier)
CREATE TABLE procurement.purchase_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_number VARCHAR(50) UNIQUE NOT NULL,
  payment_date DATE DEFAULT CURRENT_DATE,
  purchase_order_id UUID REFERENCES inventory.purchase_orders(id),
  supplier_id UUID REFERENCES procurement.suppliers(id) NOT NULL,
  invoice_number VARCHAR(50),
  invoice_date DATE,
  invoice_amount DECIMAL(15,2),
  payment_amount DECIMAL(15,2) NOT NULL,
  payment_method VARCHAR(50) NOT NULL, -- 'cash', 'transfer', 'check', 'credit_card', 'giro'
  reference_number VARCHAR(100),
  bank_name VARCHAR(100),
  payment_due_date DATE,
  discount_amount DECIMAL(15,2) DEFAULT 0,
  tax_amount DECIMAL(15,2),
  total_amount DECIMAL(15,2),
  currency VARCHAR(10) DEFAULT 'IDR',
  exchange_rate DECIMAL(15,4) DEFAULT 1,
  status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'approved', 'paid', 'cancelled'
  approved_by UUID REFERENCES auth.users(id),
  approved_at TIMESTAMPTZ,
  paid_by UUID REFERENCES auth.users(id),
  paid_at TIMESTAMPTZ,
  notes TEXT,
  payment_proof_file TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- Procurement: Supplier Performance Metrics (auto-calculated)
CREATE TABLE procurement.supplier_performance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_id UUID REFERENCES procurement.suppliers(id) NOT NULL,
  period_year INTEGER NOT NULL,
  period_month INTEGER, -- null for annual metrics
  total_orders INTEGER DEFAULT 0,
  total_amount DECIMAL(15,2) DEFAULT 0,
  on_time_delivery_count INTEGER DEFAULT 0,
  late_delivery_count INTEGER DEFAULT 0,
  on_time_delivery_rate DECIMAL(5,2) GENERATED ALWAYS AS (
    CASE WHEN (on_time_delivery_count + late_delivery_count) > 0
    THEN (on_time_delivery_count::DECIMAL / (on_time_delivery_count + late_delivery_count)) * 100
    ELSE 0 END
  ) STORED,
  quality_pass_count INTEGER DEFAULT 0,
  quality_fail_count INTEGER DEFAULT 0,
  quality_pass_rate DECIMAL(5,2) GENERATED ALWAYS AS (
    CASE WHEN (quality_pass_count + quality_fail_count) > 0
    THEN (quality_pass_count::DECIMAL / (quality_pass_count + quality_fail_count)) * 100
    ELSE 0 END
  ) STORED,
  return_count INTEGER DEFAULT 0,
  average_rating DECIMAL(3,2),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(supplier_id, period_year, period_month)
);

-- Create indexes
CREATE INDEX idx_suppliers_code ON procurement.suppliers(supplier_code);
CREATE INDEX idx_suppliers_name ON procurement.suppliers(supplier_name);
CREATE INDEX idx_suppliers_status ON procurement.suppliers(status);
CREATE INDEX idx_vendor_registration_status ON procurement.vendor_registration(registration_status);
CREATE INDEX idx_supplier_evaluation_supplier ON procurement.supplier_evaluation(supplier_id);
CREATE INDEX idx_supplier_evaluation_date ON procurement.supplier_evaluation(evaluation_date);
CREATE INDEX idx_supplier_quotations_supplier ON procurement.supplier_quotations(supplier_id);
CREATE INDEX idx_supplier_quotations_date ON procurement.supplier_quotations(quotation_date);
CREATE INDEX idx_purchase_returns_supplier ON procurement.purchase_returns(supplier_id);
CREATE INDEX idx_purchase_returns_status ON procurement.purchase_returns(return_status);
CREATE INDEX idx_purchase_payments_supplier ON procurement.purchase_payments(supplier_id);
CREATE INDEX idx_purchase_payments_date ON procurement.purchase_payments(payment_date);
CREATE INDEX idx_purchase_payments_status ON procurement.purchase_payments(status);
CREATE INDEX idx_supplier_performance_supplier ON procurement.supplier_performance(supplier_id);
CREATE INDEX idx_supplier_performance_period ON procurement.supplier_performance(period_year, period_month);

-- Enable RLS
ALTER TABLE procurement.suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE procurement.vendor_registration ENABLE ROW LEVEL SECURITY;
ALTER TABLE procurement.supplier_evaluation ENABLE ROW LEVEL SECURITY;
ALTER TABLE procurement.supplier_quotations ENABLE ROW LEVEL SECURITY;
ALTER TABLE procurement.supplier_quotation_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE procurement.purchase_returns ENABLE ROW LEVEL SECURITY;
ALTER TABLE procurement.purchase_return_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE procurement.purchase_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE procurement.supplier_performance ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Allow authenticated users to read suppliers" ON procurement.suppliers
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated users to read vendor registration" ON procurement.vendor_registration
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated users to read supplier evaluation" ON procurement.supplier_evaluation
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated users to read supplier quotations" ON procurement.supplier_quotations
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated users to read purchase returns" ON procurement.purchase_returns
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated users to read purchase payments" ON procurement.purchase_payments
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated users to read supplier performance" ON procurement.supplier_performance
  FOR SELECT TO authenticated USING (true);

-- Grant permissions
GRANT SELECT ON ALL TABLES IN SCHEMA procurement TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA procurement TO service_role;

-- Triggers for updated_at
CREATE TRIGGER update_suppliers_updated_at BEFORE UPDATE ON procurement.suppliers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_vendor_registration_updated_at BEFORE UPDATE ON procurement.vendor_registration
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_supplier_evaluation_updated_at BEFORE UPDATE ON procurement.supplier_evaluation
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_supplier_quotations_updated_at BEFORE UPDATE ON procurement.supplier_quotations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_purchase_returns_updated_at BEFORE UPDATE ON procurement.purchase_returns
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_purchase_payments_updated_at BEFORE UPDATE ON procurement.purchase_payments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_supplier_performance_updated_at BEFORE UPDATE ON procurement.supplier_performance
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
