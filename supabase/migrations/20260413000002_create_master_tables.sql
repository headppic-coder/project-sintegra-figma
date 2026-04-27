-- Master Schema Tables
-- Migration: Create master data tables

-- Master: Categories for products/materials
CREATE TABLE master.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  type VARCHAR(50) NOT NULL, -- 'product', 'material', 'process'
  description TEXT,
  parent_id UUID REFERENCES master.categories(id),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id)
);

-- Master: Materials (for production)
CREATE TABLE master.materials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(200) NOT NULL,
  category_id UUID REFERENCES master.categories(id),
  type VARCHAR(50) NOT NULL, -- 'film', 'adhesive', 'ink', etc
  unit VARCHAR(20) NOT NULL, -- 'meter', 'kg', 'liter', etc
  specification JSONB, -- flexible field for specs like micron, width, etc
  standard_cost DECIMAL(15,2),
  supplier_info JSONB,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id)
);

-- Master: Process costs
CREATE TABLE master.process_costs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(50) UNIQUE NOT NULL,
  process_name VARCHAR(200) NOT NULL,
  category VARCHAR(50) NOT NULL, -- 'BIAYA PROSES', 'BIAYA OVERHEAD', etc
  cost_per_unit DECIMAL(15,2) NOT NULL,
  unit VARCHAR(20) NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id)
);

-- Master: Product types/templates
CREATE TABLE master.product_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(200) NOT NULL,
  category VARCHAR(50) NOT NULL, -- 'polos', 'offset', 'boks', 'roto'
  default_specs JSONB, -- default specifications
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Master: Settings/Configurations
CREATE TABLE master.settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key VARCHAR(100) UNIQUE NOT NULL,
  value JSONB NOT NULL,
  description TEXT,
  category VARCHAR(50), -- 'general', 'pricing', 'production', etc
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  updated_by UUID REFERENCES auth.users(id)
);

-- Create indexes
CREATE INDEX idx_materials_code ON master.materials(code);
CREATE INDEX idx_materials_type ON master.materials(type);
CREATE INDEX idx_materials_category ON master.materials(category_id);
CREATE INDEX idx_process_costs_code ON master.process_costs(code);
CREATE INDEX idx_process_costs_category ON master.process_costs(category);

-- Enable RLS
ALTER TABLE master.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE master.materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE master.process_costs ENABLE ROW LEVEL SECURITY;
ALTER TABLE master.product_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE master.settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies (allow authenticated users to read, only admins to write)
CREATE POLICY "Allow authenticated users to read categories" ON master.categories
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated users to read materials" ON master.materials
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated users to read process costs" ON master.process_costs
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated users to read product types" ON master.product_types
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated users to read settings" ON master.settings
  FOR SELECT TO authenticated USING (true);

-- Grant permissions
GRANT SELECT ON ALL TABLES IN SCHEMA master TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA master TO service_role;
