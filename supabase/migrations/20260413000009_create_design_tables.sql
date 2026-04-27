-- Design Schema Tables
-- Migration: Create design and prepress management tables

-- Create design schema if not exists
CREATE SCHEMA IF NOT EXISTS design;
COMMENT ON SCHEMA design IS 'Design management, artwork, cylinder, and prepress';

GRANT USAGE ON SCHEMA design TO authenticated;
GRANT ALL ON SCHEMA design TO service_role;

-- Design: Design Requests
CREATE TABLE design.design_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_number VARCHAR(50) UNIQUE NOT NULL,
  customer_id UUID REFERENCES sales.customers(id),
  order_id UUID REFERENCES sales.orders(id),
  request_date DATE DEFAULT CURRENT_DATE,
  product_name VARCHAR(200) NOT NULL,
  product_type VARCHAR(50), -- 'polos', 'offset', 'boks', 'roto'
  quantity INTEGER,
  requested_by UUID REFERENCES auth.users(id),
  designer_id UUID REFERENCES auth.users(id),
  deadline DATE,
  priority VARCHAR(20) DEFAULT 'normal', -- 'low', 'normal', 'high', 'urgent'
  status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'in_progress', 'review', 'revision', 'approved', 'rejected'
  design_notes TEXT,
  reference_files JSONB, -- array of file URLs/paths
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- Design: Design Process/Workflow
CREATE TABLE design.design_process (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  design_request_id UUID REFERENCES design.design_requests(id) ON DELETE CASCADE,
  process_step VARCHAR(100) NOT NULL, -- 'concept', 'draft', 'revision', 'final', 'approval'
  step_number INTEGER NOT NULL,
  assigned_to UUID REFERENCES auth.users(id),
  status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'in_progress', 'completed', 'skipped'
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  notes TEXT,
  attachments JSONB, -- array of file URLs
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Design: Design Library/Assets
CREATE TABLE design.design_library (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_code VARCHAR(50) UNIQUE NOT NULL,
  asset_name VARCHAR(200) NOT NULL,
  asset_type VARCHAR(50) NOT NULL, -- 'logo', 'pattern', 'template', 'illustration', 'photo'
  category VARCHAR(100),
  file_url TEXT NOT NULL,
  file_format VARCHAR(20), -- 'ai', 'psd', 'pdf', 'jpg', 'png'
  file_size_kb INTEGER,
  dimensions VARCHAR(50), -- e.g., '2000x3000'
  color_mode VARCHAR(20), -- 'RGB', 'CMYK', 'Grayscale'
  description TEXT,
  tags TEXT[], -- array of tags for search
  customer_id UUID REFERENCES sales.customers(id),
  is_public BOOLEAN DEFAULT false,
  usage_count INTEGER DEFAULT 0,
  thumbnail_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- Design: Design Layout/Plates
CREATE TABLE design.design_layouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  layout_code VARCHAR(50) UNIQUE NOT NULL,
  design_request_id UUID REFERENCES design.design_requests(id),
  layout_name VARCHAR(200) NOT NULL,
  product_type VARCHAR(50),
  width_mm DECIMAL(10,2),
  height_mm DECIMAL(10,2),
  colors INTEGER, -- number of colors
  color_list TEXT[], -- ['Cyan', 'Magenta', 'Yellow', 'Black', 'Pantone 123']
  layout_file_url TEXT,
  proof_file_url TEXT,
  layout_notes TEXT,
  status VARCHAR(50) DEFAULT 'draft', -- 'draft', 'approved', 'archived'
  approved_by UUID REFERENCES auth.users(id),
  approved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- Design: Layout Job List
CREATE TABLE design.layout_joblist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_number VARCHAR(50) UNIQUE NOT NULL,
  layout_id UUID REFERENCES design.design_layouts(id),
  order_id UUID REFERENCES sales.orders(id),
  job_date DATE DEFAULT CURRENT_DATE,
  assigned_to UUID REFERENCES auth.users(id),
  deadline DATE,
  status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'in_progress', 'completed', 'cancelled'
  priority VARCHAR(20) DEFAULT 'normal',
  job_type VARCHAR(50), -- 'new_layout', 'revision', 'color_separation', 'proofing'
  notes TEXT,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- Design: Cylinder Registry
CREATE TABLE design.cylinder_registry (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cylinder_code VARCHAR(50) UNIQUE NOT NULL,
  cylinder_number VARCHAR(50) UNIQUE NOT NULL,
  customer_id UUID REFERENCES sales.customers(id),
  product_name VARCHAR(200),
  diameter_mm DECIMAL(10,2),
  length_mm DECIMAL(10,2),
  circumference_mm DECIMAL(10,2),
  repeat_length_mm DECIMAL(10,2),
  colors INTEGER,
  color_details JSONB, -- details per color
  production_date DATE,
  engraving_supplier VARCHAR(200),
  location VARCHAR(100), -- storage location
  condition VARCHAR(50) DEFAULT 'good', -- 'good', 'fair', 'worn', 'damaged'
  usage_count INTEGER DEFAULT 0,
  last_used_date DATE,
  maintenance_date DATE,
  notes TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Design: Plate Registry
CREATE TABLE design.plate_registry (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plate_code VARCHAR(50) UNIQUE NOT NULL,
  plate_number VARCHAR(50) UNIQUE NOT NULL,
  customer_id UUID REFERENCES sales.customers(id),
  product_name VARCHAR(200),
  plate_type VARCHAR(50), -- 'offset', 'flexo'
  width_mm DECIMAL(10,2),
  height_mm DECIMAL(10,2),
  thickness_mm DECIMAL(10,2),
  colors INTEGER,
  color_details JSONB,
  production_date DATE,
  supplier VARCHAR(200),
  location VARCHAR(100),
  condition VARCHAR(50) DEFAULT 'good',
  usage_count INTEGER DEFAULT 0,
  last_used_date DATE,
  notes TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Design: Artwork Specification
CREATE TABLE design.artwork_specifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  spec_code VARCHAR(50) UNIQUE NOT NULL,
  design_request_id UUID REFERENCES design.design_requests(id),
  customer_id UUID REFERENCES sales.customers(id),
  product_name VARCHAR(200) NOT NULL,
  product_type VARCHAR(50),
  dimensions JSONB NOT NULL, -- {width, height, depth}
  material_specs JSONB, -- material specifications
  color_specs JSONB, -- color details, pantone, CMYK values
  text_content TEXT,
  barcode_specs JSONB,
  finishing_specs JSONB, -- lamination, embossing, etc
  special_requirements TEXT,
  customer_artwork_file TEXT, -- URL to customer's file
  final_artwork_file TEXT, -- URL to final approved file
  status VARCHAR(50) DEFAULT 'draft', -- 'draft', 'submitted', 'approved', 'archived'
  approved_by UUID REFERENCES auth.users(id),
  approved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- Design: Prepress Checklist
CREATE TABLE design.prepress_checklist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  checklist_number VARCHAR(50) UNIQUE NOT NULL,
  design_request_id UUID REFERENCES design.design_requests(id),
  layout_id UUID REFERENCES design.design_layouts(id),
  order_id UUID REFERENCES sales.orders(id),
  checked_by UUID REFERENCES auth.users(id),
  check_date DATE DEFAULT CURRENT_DATE,
  check_items JSONB NOT NULL, -- array of checklist items with status
  -- Common checks: color separation, trapping, resolution, bleed, fonts, etc
  color_separation_ok BOOLEAN DEFAULT false,
  trapping_ok BOOLEAN DEFAULT false,
  resolution_ok BOOLEAN DEFAULT false,
  bleed_ok BOOLEAN DEFAULT false,
  fonts_ok BOOLEAN DEFAULT false,
  registration_marks_ok BOOLEAN DEFAULT false,
  crop_marks_ok BOOLEAN DEFAULT false,
  barcode_ok BOOLEAN DEFAULT false,
  text_proofing_ok BOOLEAN DEFAULT false,
  overall_status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'passed', 'failed', 'conditional'
  issues_found TEXT,
  corrective_actions TEXT,
  approved_by UUID REFERENCES auth.users(id),
  approved_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_design_requests_customer ON design.design_requests(customer_id);
CREATE INDEX idx_design_requests_status ON design.design_requests(status);
CREATE INDEX idx_design_requests_deadline ON design.design_requests(deadline);
CREATE INDEX idx_design_library_type ON design.design_library(asset_type);
CREATE INDEX idx_design_library_customer ON design.design_library(customer_id);
CREATE INDEX idx_design_layouts_status ON design.design_layouts(status);
CREATE INDEX idx_cylinder_registry_customer ON design.cylinder_registry(customer_id);
CREATE INDEX idx_cylinder_registry_code ON design.cylinder_registry(cylinder_code);
CREATE INDEX idx_plate_registry_customer ON design.plate_registry(customer_id);
CREATE INDEX idx_plate_registry_code ON design.plate_registry(plate_code);

-- Enable RLS
ALTER TABLE design.design_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE design.design_process ENABLE ROW LEVEL SECURITY;
ALTER TABLE design.design_library ENABLE ROW LEVEL SECURITY;
ALTER TABLE design.design_layouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE design.layout_joblist ENABLE ROW LEVEL SECURITY;
ALTER TABLE design.cylinder_registry ENABLE ROW LEVEL SECURITY;
ALTER TABLE design.plate_registry ENABLE ROW LEVEL SECURITY;
ALTER TABLE design.artwork_specifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE design.prepress_checklist ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Allow authenticated users to read design requests" ON design.design_requests
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated users to read design library" ON design.design_library
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated users to read design layouts" ON design.design_layouts
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated users to read cylinder registry" ON design.cylinder_registry
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated users to read plate registry" ON design.plate_registry
  FOR SELECT TO authenticated USING (true);

-- Grant permissions
GRANT SELECT ON ALL TABLES IN SCHEMA design TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA design TO service_role;

-- Triggers for updated_at
CREATE TRIGGER update_design_requests_updated_at BEFORE UPDATE ON design.design_requests
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_design_library_updated_at BEFORE UPDATE ON design.design_library
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_design_layouts_updated_at BEFORE UPDATE ON design.design_layouts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_cylinder_registry_updated_at BEFORE UPDATE ON design.cylinder_registry
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_plate_registry_updated_at BEFORE UPDATE ON design.plate_registry
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_artwork_specifications_updated_at BEFORE UPDATE ON design.artwork_specifications
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
