-- Additional Sales Schema Tables
-- Migration: Add missing sales support tables from routes

-- Sales: Industry Categories
CREATE TABLE sales.industry_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_code VARCHAR(50) UNIQUE NOT NULL,
  category_name VARCHAR(200) NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Sales: Lead Sources
CREATE TABLE sales.lead_sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_code VARCHAR(50) UNIQUE NOT NULL,
  source_name VARCHAR(200) NOT NULL,
  source_type VARCHAR(50), -- 'website', 'referral', 'event', 'social_media', 'direct', etc
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Sales: Regions
CREATE TABLE sales.regions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  region_code VARCHAR(50) UNIQUE NOT NULL,
  region_name VARCHAR(200) NOT NULL,
  province VARCHAR(100),
  coverage_area TEXT[], -- array of cities/areas
  sales_person_id UUID REFERENCES auth.users(id),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Sales: Segments (Customer Segments)
CREATE TABLE sales.segments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  segment_code VARCHAR(50) UNIQUE NOT NULL,
  segment_name VARCHAR(200) NOT NULL,
  criteria JSONB, -- segmentation criteria
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Sales: Pipeline Stages
CREATE TABLE sales.pipeline_stages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stage_code VARCHAR(50) UNIQUE NOT NULL,
  stage_name VARCHAR(200) NOT NULL,
  stage_order INTEGER NOT NULL,
  probability_percentage DECIMAL(5,2), -- probability of winning
  is_active BOOLEAN DEFAULT true,
  color VARCHAR(20), -- for UI display
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Sales: Pipeline (Sales Opportunities)
CREATE TABLE sales.pipeline (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  opportunity_number VARCHAR(50) UNIQUE NOT NULL,
  opportunity_name VARCHAR(200) NOT NULL,
  customer_id UUID REFERENCES sales.customers(id),
  prospective_customer_id UUID, -- if not yet a customer
  contact_person VARCHAR(200),
  contact_email VARCHAR(200),
  contact_phone VARCHAR(50),
  stage_id UUID REFERENCES sales.pipeline_stages(id) NOT NULL,
  estimated_value DECIMAL(15,2),
  probability_percentage DECIMAL(5,2),
  expected_close_date DATE,
  lead_source_id UUID REFERENCES sales.lead_sources(id),
  product_interest TEXT,
  description TEXT,
  sales_person_id UUID REFERENCES auth.users(id),
  status VARCHAR(50) DEFAULT 'open', -- 'open', 'won', 'lost', 'cancelled'
  won_date DATE,
  lost_reason TEXT,
  competitor VARCHAR(200),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- Sales: Pipeline Activities (History/Log of activities)
CREATE TABLE sales.pipeline_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pipeline_id UUID REFERENCES sales.pipeline(id) ON DELETE CASCADE,
  activity_date TIMESTAMPTZ DEFAULT NOW(),
  activity_type VARCHAR(50) NOT NULL, -- 'call', 'email', 'meeting', 'presentation', 'proposal', 'follow_up'
  subject VARCHAR(200),
  description TEXT,
  outcome VARCHAR(200),
  next_action TEXT,
  next_action_date DATE,
  performed_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Sales: Sales Activities (General sales activities tracking)
CREATE TABLE sales.sales_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  activity_number VARCHAR(50) UNIQUE NOT NULL,
  activity_date DATE DEFAULT CURRENT_DATE,
  activity_type VARCHAR(50) NOT NULL, -- 'visit', 'call', 'presentation', 'negotiation', 'follow_up'
  customer_id UUID REFERENCES sales.customers(id),
  pipeline_id UUID REFERENCES sales.pipeline(id),
  sales_person_id UUID REFERENCES auth.users(id) NOT NULL,
  subject VARCHAR(200) NOT NULL,
  description TEXT,
  location VARCHAR(200),
  duration_minutes INTEGER,
  attendees TEXT,
  outcome VARCHAR(200),
  next_action TEXT,
  next_action_date DATE,
  status VARCHAR(50) DEFAULT 'completed', -- 'planned', 'in_progress', 'completed', 'cancelled'
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Sales: Prospective Customers (Calon Customer)
CREATE TABLE sales.prospective_customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prospect_number VARCHAR(50) UNIQUE NOT NULL,
  company_name VARCHAR(200) NOT NULL,
  industry_category_id UUID REFERENCES sales.industry_categories(id),
  contact_person VARCHAR(200),
  title_position VARCHAR(100),
  phone VARCHAR(50),
  mobile VARCHAR(50),
  email VARCHAR(200),
  address TEXT,
  city VARCHAR(100),
  postal_code VARCHAR(20),
  website VARCHAR(200),
  lead_source_id UUID REFERENCES sales.lead_sources(id),
  region_id UUID REFERENCES sales.regions(id),
  segment_id UUID REFERENCES sales.segments(id),
  sales_person_id UUID REFERENCES auth.users(id),
  estimated_potential DECIMAL(15,2),
  status VARCHAR(50) DEFAULT 'new', -- 'new', 'contacted', 'qualified', 'proposal', 'negotiation', 'converted', 'lost'
  qualification_score INTEGER, -- 1-100
  conversion_date DATE,
  customer_id UUID REFERENCES sales.customers(id), -- when converted
  lost_reason TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- Sales: Delivery Requests (Permintaan Pengiriman)
CREATE TABLE sales.delivery_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_number VARCHAR(50) UNIQUE NOT NULL,
  request_date DATE DEFAULT CURRENT_DATE,
  order_id UUID REFERENCES sales.orders(id) NOT NULL,
  customer_id UUID REFERENCES sales.customers(id) NOT NULL,
  delivery_address TEXT NOT NULL,
  delivery_city VARCHAR(100),
  delivery_postal_code VARCHAR(20),
  contact_person VARCHAR(200),
  contact_phone VARCHAR(50),
  requested_delivery_date DATE,
  delivery_type VARCHAR(50), -- 'regular', 'express', 'pickup'
  shipping_instructions TEXT,
  status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'approved', 'scheduled', 'in_transit', 'delivered', 'cancelled'
  approved_by UUID REFERENCES auth.users(id),
  approved_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- Sales: Delivery Request Items
CREATE TABLE sales.delivery_request_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID REFERENCES sales.delivery_requests(id) ON DELETE CASCADE,
  item_number INTEGER NOT NULL,
  product_name VARCHAR(200) NOT NULL,
  quantity INTEGER NOT NULL,
  unit VARCHAR(20),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Sales: Delivery Notes (Surat Jalan)
CREATE TABLE sales.delivery_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  delivery_note_number VARCHAR(50) UNIQUE NOT NULL,
  delivery_note_date DATE DEFAULT CURRENT_DATE,
  delivery_request_id UUID REFERENCES sales.delivery_requests(id),
  order_id UUID REFERENCES sales.orders(id) NOT NULL,
  customer_id UUID REFERENCES sales.customers(id) NOT NULL,
  delivery_address TEXT NOT NULL,
  contact_person VARCHAR(200),
  contact_phone VARCHAR(50),
  vehicle_number VARCHAR(20),
  driver_name VARCHAR(200),
  driver_phone VARCHAR(50),
  actual_delivery_date DATE,
  delivery_time TIME,
  received_by VARCHAR(200),
  received_signature TEXT, -- signature image URL
  status VARCHAR(50) DEFAULT 'created', -- 'created', 'dispatched', 'in_transit', 'delivered', 'returned'
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- Sales: Delivery Note Items
CREATE TABLE sales.delivery_note_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  delivery_note_id UUID REFERENCES sales.delivery_notes(id) ON DELETE CASCADE,
  item_number INTEGER NOT NULL,
  product_name VARCHAR(200) NOT NULL,
  quantity_ordered INTEGER,
  quantity_delivered INTEGER NOT NULL,
  unit VARCHAR(20),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Sales: Delivery Recap (Rekap Pengiriman)
CREATE TABLE sales.delivery_recap (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recap_number VARCHAR(50) UNIQUE NOT NULL,
  recap_date DATE DEFAULT CURRENT_DATE,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  total_deliveries INTEGER DEFAULT 0,
  total_on_time INTEGER DEFAULT 0,
  total_late INTEGER DEFAULT 0,
  on_time_percentage DECIMAL(5,2),
  total_quantity_delivered INTEGER DEFAULT 0,
  summary JSONB, -- detailed summary stats
  prepared_by UUID REFERENCES auth.users(id),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add foreign key to customers table for additional fields
ALTER TABLE sales.customers ADD COLUMN industry_category_id UUID REFERENCES sales.industry_categories(id);
ALTER TABLE sales.customers ADD COLUMN region_id UUID REFERENCES sales.regions(id);
ALTER TABLE sales.customers ADD COLUMN segment_id UUID REFERENCES sales.segments(id);
ALTER TABLE sales.customers ADD COLUMN lead_source_id UUID REFERENCES sales.lead_sources(id);

-- Create indexes
CREATE INDEX idx_industry_categories_code ON sales.industry_categories(category_code);
CREATE INDEX idx_lead_sources_code ON sales.lead_sources(source_code);
CREATE INDEX idx_regions_code ON sales.regions(region_code);
CREATE INDEX idx_segments_code ON sales.segments(segment_code);
CREATE INDEX idx_pipeline_stages_order ON sales.pipeline_stages(stage_order);
CREATE INDEX idx_pipeline_customer ON sales.pipeline(customer_id);
CREATE INDEX idx_pipeline_stage ON sales.pipeline(stage_id);
CREATE INDEX idx_pipeline_status ON sales.pipeline(status);
CREATE INDEX idx_pipeline_sales_person ON sales.pipeline(sales_person_id);
CREATE INDEX idx_sales_activities_date ON sales.sales_activities(activity_date);
CREATE INDEX idx_sales_activities_customer ON sales.sales_activities(customer_id);
CREATE INDEX idx_prospective_customers_status ON sales.prospective_customers(status);
CREATE INDEX idx_prospective_customers_sales_person ON sales.prospective_customers(sales_person_id);
CREATE INDEX idx_delivery_requests_order ON sales.delivery_requests(order_id);
CREATE INDEX idx_delivery_requests_status ON sales.delivery_requests(status);
CREATE INDEX idx_delivery_notes_order ON sales.delivery_notes(order_id);
CREATE INDEX idx_delivery_notes_date ON sales.delivery_notes(delivery_note_date);

-- Enable RLS
ALTER TABLE sales.industry_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales.lead_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales.regions ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales.segments ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales.pipeline_stages ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales.pipeline ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales.pipeline_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales.sales_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales.prospective_customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales.delivery_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales.delivery_request_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales.delivery_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales.delivery_note_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales.delivery_recap ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Allow authenticated users to read industry categories" ON sales.industry_categories
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated users to read lead sources" ON sales.lead_sources
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated users to read regions" ON sales.regions
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated users to read segments" ON sales.segments
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated users to read pipeline stages" ON sales.pipeline_stages
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated users to read pipeline" ON sales.pipeline
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated users to read sales activities" ON sales.sales_activities
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated users to read prospective customers" ON sales.prospective_customers
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated users to read delivery requests" ON sales.delivery_requests
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated users to read delivery notes" ON sales.delivery_notes
  FOR SELECT TO authenticated USING (true);

-- Grant permissions
GRANT SELECT ON ALL TABLES IN SCHEMA sales TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA sales TO service_role;

-- Triggers for updated_at
CREATE TRIGGER update_industry_categories_updated_at BEFORE UPDATE ON sales.industry_categories
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_lead_sources_updated_at BEFORE UPDATE ON sales.lead_sources
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_regions_updated_at BEFORE UPDATE ON sales.regions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_segments_updated_at BEFORE UPDATE ON sales.segments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_pipeline_stages_updated_at BEFORE UPDATE ON sales.pipeline_stages
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_pipeline_updated_at BEFORE UPDATE ON sales.pipeline
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sales_activities_updated_at BEFORE UPDATE ON sales.sales_activities
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_prospective_customers_updated_at BEFORE UPDATE ON sales.prospective_customers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_delivery_requests_updated_at BEFORE UPDATE ON sales.delivery_requests
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_delivery_notes_updated_at BEFORE UPDATE ON sales.delivery_notes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
