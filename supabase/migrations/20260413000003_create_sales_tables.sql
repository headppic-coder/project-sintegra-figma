-- Sales Schema Tables
-- Migration: Create sales management tables

-- Sales: Customers
CREATE TABLE sales.customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(200) NOT NULL,
  contact_person VARCHAR(200),
  phone VARCHAR(50),
  email VARCHAR(200),
  address TEXT,
  city VARCHAR(100),
  postal_code VARCHAR(20),
  tax_id VARCHAR(50),
  payment_terms INTEGER DEFAULT 30, -- days
  credit_limit DECIMAL(15,2),
  customer_type VARCHAR(50), -- 'regular', 'vip', 'wholesale', etc
  sales_person_id UUID REFERENCES auth.users(id),
  notes TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id)
);

-- Sales: Price Formulas (Polos, Offset, Boks, Roto)
CREATE TABLE sales.price_formulas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(50) UNIQUE NOT NULL,
  customer_id UUID REFERENCES sales.customers(id),
  product_type VARCHAR(50) NOT NULL, -- 'polos', 'offset', 'boks', 'roto'
  product_name VARCHAR(200) NOT NULL,
  specifications JSONB NOT NULL, -- all form fields stored as JSON
  material_costs JSONB, -- breakdown of material costs
  process_costs JSONB, -- breakdown of process costs
  total_cost DECIMAL(15,2),
  hpp_production DECIMAL(15,2),
  hpp_production_ppn DECIMAL(15,2),
  hpp_jual DECIMAL(15,2),
  hpp_jual_ppn DECIMAL(15,2),
  selling_price DECIMAL(15,2),
  margin_percentage DECIMAL(5,2),
  quantity INTEGER,
  estimated_result INTEGER,
  notes TEXT,
  status VARCHAR(50) DEFAULT 'draft', -- 'draft', 'approved', 'sent', 'closed'
  valid_until DATE,
  sales_person_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id)
);

-- Sales: Quotations
CREATE TABLE sales.quotations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quotation_number VARCHAR(50) UNIQUE NOT NULL,
  customer_id UUID REFERENCES sales.customers(id) NOT NULL,
  quotation_date DATE DEFAULT CURRENT_DATE,
  valid_until DATE,
  total_amount DECIMAL(15,2),
  discount_percentage DECIMAL(5,2) DEFAULT 0,
  discount_amount DECIMAL(15,2) DEFAULT 0,
  tax_percentage DECIMAL(5,2) DEFAULT 11,
  tax_amount DECIMAL(15,2),
  grand_total DECIMAL(15,2),
  status VARCHAR(50) DEFAULT 'draft', -- 'draft', 'sent', 'approved', 'rejected', 'converted'
  notes TEXT,
  terms_conditions TEXT,
  sales_person_id UUID REFERENCES auth.users(id),
  approved_by UUID REFERENCES auth.users(id),
  approved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id)
);

-- Sales: Quotation Items
CREATE TABLE sales.quotation_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quotation_id UUID REFERENCES sales.quotations(id) ON DELETE CASCADE,
  price_formula_id UUID REFERENCES sales.price_formulas(id),
  item_number INTEGER NOT NULL,
  product_name VARCHAR(200) NOT NULL,
  description TEXT,
  quantity INTEGER NOT NULL,
  unit_price DECIMAL(15,2) NOT NULL,
  subtotal DECIMAL(15,2) NOT NULL,
  specifications JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Sales: Orders
CREATE TABLE sales.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number VARCHAR(50) UNIQUE NOT NULL,
  quotation_id UUID REFERENCES sales.quotations(id),
  customer_id UUID REFERENCES sales.customers(id) NOT NULL,
  order_date DATE DEFAULT CURRENT_DATE,
  delivery_date DATE,
  total_amount DECIMAL(15,2),
  status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'confirmed', 'production', 'completed', 'cancelled'
  payment_status VARCHAR(50) DEFAULT 'unpaid', -- 'unpaid', 'partial', 'paid'
  notes TEXT,
  sales_person_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id)
);

-- Create indexes
CREATE INDEX idx_customers_code ON sales.customers(code);
CREATE INDEX idx_customers_name ON sales.customers(name);
CREATE INDEX idx_price_formulas_customer ON sales.price_formulas(customer_id);
CREATE INDEX idx_price_formulas_type ON sales.price_formulas(product_type);
CREATE INDEX idx_price_formulas_status ON sales.price_formulas(status);
CREATE INDEX idx_quotations_customer ON sales.quotations(customer_id);
CREATE INDEX idx_quotations_status ON sales.quotations(status);
CREATE INDEX idx_quotations_date ON sales.quotations(quotation_date);
CREATE INDEX idx_orders_customer ON sales.orders(customer_id);
CREATE INDEX idx_orders_status ON sales.orders(status);

-- Enable RLS
ALTER TABLE sales.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales.price_formulas ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales.quotations ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales.quotation_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales.orders ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Allow authenticated users to read customers" ON sales.customers
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated users to read price formulas" ON sales.price_formulas
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated users to manage their price formulas" ON sales.price_formulas
  FOR ALL TO authenticated USING (created_by = auth.uid());

CREATE POLICY "Allow authenticated users to read quotations" ON sales.quotations
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated users to read orders" ON sales.orders
  FOR SELECT TO authenticated USING (true);

-- Grant permissions
GRANT SELECT ON ALL TABLES IN SCHEMA sales TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA sales TO service_role;
