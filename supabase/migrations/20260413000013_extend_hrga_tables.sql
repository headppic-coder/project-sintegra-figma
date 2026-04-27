-- Extended HRGA Schema Tables
-- Migration: Add missing HRGA (Human Resources & General Affairs) tables

-- Create hrga schema if not exists
CREATE SCHEMA IF NOT EXISTS hrga;
COMMENT ON SCHEMA hrga IS 'Human Resources and General Affairs';

GRANT USAGE ON SCHEMA hrga TO authenticated;
GRANT ALL ON SCHEMA hrga TO service_role;

-- HRGA: Employees (extend with more fields)
CREATE TABLE hrga.employees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_number VARCHAR(50) UNIQUE NOT NULL,
  user_id UUID REFERENCES auth.users(id) UNIQUE,
  full_name VARCHAR(200) NOT NULL,
  nickname VARCHAR(100),
  national_id VARCHAR(50) UNIQUE,
  email VARCHAR(200),
  phone VARCHAR(50),
  date_of_birth DATE,
  place_of_birth VARCHAR(100),
  gender VARCHAR(20),
  marital_status VARCHAR(50),
  address TEXT,
  city VARCHAR(100),
  postal_code VARCHAR(20),
  emergency_contact_name VARCHAR(200),
  emergency_contact_phone VARCHAR(50),
  emergency_contact_relation VARCHAR(50),
  company_id UUID,
  department_id UUID,
  position_id UUID,
  division_id UUID,
  sub_division_id UUID,
  employment_status VARCHAR(50), -- 'permanent', 'contract', 'probation', 'intern'
  join_date DATE,
  end_date DATE,
  education_level VARCHAR(50),
  bank_name VARCHAR(100),
  bank_account_number VARCHAR(50),
  tax_id VARCHAR(50),
  insurance_number VARCHAR(50),
  photo_url TEXT,
  is_active BOOLEAN DEFAULT true,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- HRGA: Master Companies
CREATE TABLE hrga.master_companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_code VARCHAR(50) UNIQUE NOT NULL,
  company_name VARCHAR(200) NOT NULL,
  legal_name VARCHAR(200),
  tax_id VARCHAR(50),
  business_type VARCHAR(100),
  address TEXT,
  city VARCHAR(100),
  postal_code VARCHAR(20),
  phone VARCHAR(50),
  email VARCHAR(200),
  website VARCHAR(200),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- HRGA: Master Departments
CREATE TABLE hrga.master_departments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  department_code VARCHAR(50) UNIQUE NOT NULL,
  department_name VARCHAR(200) NOT NULL,
  company_id UUID REFERENCES hrga.master_companies(id),
  manager_id UUID REFERENCES hrga.employees(id),
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- HRGA: Master Positions
CREATE TABLE hrga.master_positions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  position_code VARCHAR(50) UNIQUE NOT NULL,
  position_name VARCHAR(200) NOT NULL,
  department_id UUID REFERENCES hrga.master_departments(id),
  level VARCHAR(50), -- 'staff', 'supervisor', 'manager', 'director'
  job_description TEXT,
  requirements TEXT,
  min_salary DECIMAL(15,2),
  max_salary DECIMAL(15,2),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- HRGA: Divisions
CREATE TABLE hrga.divisions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  division_code VARCHAR(50) UNIQUE NOT NULL,
  division_name VARCHAR(200) NOT NULL,
  department_id UUID REFERENCES hrga.master_departments(id),
  head_id UUID REFERENCES hrga.employees(id),
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- HRGA: Sub Divisions
CREATE TABLE hrga.sub_divisions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sub_division_code VARCHAR(50) UNIQUE NOT NULL,
  sub_division_name VARCHAR(200) NOT NULL,
  division_id UUID REFERENCES hrga.divisions(id),
  head_id UUID REFERENCES hrga.employees(id),
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- HRGA: Organization Structure (hierarchy)
CREATE TABLE hrga.organization_structure (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID REFERENCES hrga.employees(id) NOT NULL,
  reports_to UUID REFERENCES hrga.employees(id),
  position_id UUID REFERENCES hrga.master_positions(id),
  level INTEGER DEFAULT 1,
  effective_date DATE DEFAULT CURRENT_DATE,
  end_date DATE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- HRGA: KPI (Key Performance Indicators)
CREATE TABLE hrga.kpi (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kpi_code VARCHAR(50) UNIQUE NOT NULL,
  kpi_name VARCHAR(200) NOT NULL,
  employee_id UUID REFERENCES hrga.employees(id),
  position_id UUID REFERENCES hrga.master_positions(id),
  period_year INTEGER NOT NULL,
  period_month INTEGER, -- null for annual KPIs
  target_value DECIMAL(15,2),
  actual_value DECIMAL(15,2),
  achievement_percentage DECIMAL(5,2) GENERATED ALWAYS AS ((actual_value / NULLIF(target_value, 0)) * 100) STORED,
  weight_percentage DECIMAL(5,2),
  score DECIMAL(10,2),
  rating VARCHAR(20), -- 'excellent', 'good', 'average', 'poor'
  notes TEXT,
  evaluated_by UUID REFERENCES auth.users(id),
  evaluated_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- HRGA: Master Shift
CREATE TABLE hrga.master_shift (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shift_code VARCHAR(50) UNIQUE NOT NULL,
  shift_name VARCHAR(100) NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  duration_hours DECIMAL(10,2),
  break_duration_minutes INTEGER DEFAULT 60,
  is_night_shift BOOLEAN DEFAULT false,
  overtime_rate_percentage DECIMAL(5,2) DEFAULT 100,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- HRGA: Recruitment
CREATE TABLE hrga.recruitment (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recruitment_number VARCHAR(50) UNIQUE NOT NULL,
  position_id UUID REFERENCES hrga.master_positions(id) NOT NULL,
  department_id UUID REFERENCES hrga.master_departments(id),
  quantity_needed INTEGER DEFAULT 1,
  request_date DATE DEFAULT CURRENT_DATE,
  required_date DATE,
  employment_type VARCHAR(50), -- 'permanent', 'contract', 'intern'
  job_description TEXT,
  requirements TEXT,
  salary_range_min DECIMAL(15,2),
  salary_range_max DECIMAL(15,2),
  requested_by UUID REFERENCES auth.users(id),
  status VARCHAR(50) DEFAULT 'open', -- 'open', 'in_progress', 'interview', 'offer', 'hired', 'cancelled', 'closed'
  priority VARCHAR(20) DEFAULT 'normal',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- HRGA: Recruitment Candidates
CREATE TABLE hrga.recruitment_candidates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recruitment_id UUID REFERENCES hrga.recruitment(id) ON DELETE CASCADE,
  full_name VARCHAR(200) NOT NULL,
  email VARCHAR(200),
  phone VARCHAR(50),
  cv_file_url TEXT,
  application_date DATE DEFAULT CURRENT_DATE,
  status VARCHAR(50) DEFAULT 'applied', -- 'applied', 'screening', 'interview', 'test', 'offered', 'accepted', 'rejected'
  interview_date DATE,
  interview_notes TEXT,
  test_score DECIMAL(5,2),
  rating VARCHAR(20),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- HRGA: Warning Letters
CREATE TABLE hrga.warning_letters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  letter_number VARCHAR(50) UNIQUE NOT NULL,
  employee_id UUID REFERENCES hrga.employees(id) NOT NULL,
  letter_type VARCHAR(50) NOT NULL, -- 'sp1', 'sp2', 'sp3', 'termination'
  issue_date DATE DEFAULT CURRENT_DATE,
  violation_type VARCHAR(100) NOT NULL,
  violation_description TEXT NOT NULL,
  evidence TEXT,
  corrective_action_required TEXT,
  valid_until DATE,
  issued_by UUID REFERENCES auth.users(id),
  acknowledged_by_employee BOOLEAN DEFAULT false,
  acknowledgement_date DATE,
  status VARCHAR(50) DEFAULT 'active', -- 'active', 'resolved', 'expired', 'cancelled'
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- HRGA: Document Management
CREATE TABLE hrga.document_management (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_number VARCHAR(50) UNIQUE NOT NULL,
  document_type VARCHAR(50) NOT NULL, -- 'contract', 'policy', 'sop', 'form', 'certificate', etc
  document_name VARCHAR(200) NOT NULL,
  category VARCHAR(100),
  employee_id UUID REFERENCES hrga.employees(id),
  department_id UUID REFERENCES hrga.master_departments(id),
  file_url TEXT NOT NULL,
  file_type VARCHAR(20),
  issue_date DATE DEFAULT CURRENT_DATE,
  expiry_date DATE,
  version VARCHAR(20),
  status VARCHAR(50) DEFAULT 'active', -- 'draft', 'active', 'expired', 'archived'
  uploaded_by UUID REFERENCES auth.users(id),
  approved_by UUID REFERENCES auth.users(id),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- HRGA: Security Reports
CREATE TABLE hrga.security_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_number VARCHAR(50) UNIQUE NOT NULL,
  report_date DATE DEFAULT CURRENT_DATE,
  report_time TIME DEFAULT CURRENT_TIME,
  shift_type VARCHAR(50),
  security_officer_id UUID REFERENCES hrga.employees(id),
  incident_type VARCHAR(100), -- 'visitor', 'vehicle', 'incident', 'patrol', 'alarm'
  location VARCHAR(200),
  description TEXT NOT NULL,
  action_taken TEXT,
  follow_up_required BOOLEAN DEFAULT false,
  status VARCHAR(50) DEFAULT 'open', -- 'open', 'in_progress', 'resolved', 'closed'
  resolved_by UUID REFERENCES auth.users(id),
  resolved_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- HRGA: Janitor Reports
CREATE TABLE hrga.janitor_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_number VARCHAR(50) UNIQUE NOT NULL,
  report_date DATE DEFAULT CURRENT_DATE,
  shift_type VARCHAR(50),
  janitor_id UUID REFERENCES hrga.employees(id),
  area_cleaned TEXT[] NOT NULL, -- array of areas
  cleaning_tasks JSONB, -- checklist of tasks
  supplies_used JSONB,
  issues_found TEXT,
  maintenance_needed TEXT,
  supervisor_id UUID REFERENCES auth.users(id),
  verified_by UUID REFERENCES auth.users(id),
  verified_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- HRGA: Assets (Company Assets)
CREATE TABLE hrga.assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_code VARCHAR(50) UNIQUE NOT NULL,
  asset_name VARCHAR(200) NOT NULL,
  asset_type VARCHAR(50) NOT NULL, -- 'furniture', 'electronics', 'vehicle', 'building', etc
  category VARCHAR(100),
  brand VARCHAR(100),
  model VARCHAR(100),
  serial_number VARCHAR(100),
  purchase_date DATE,
  purchase_price DECIMAL(15,2),
  current_value DECIMAL(15,2),
  depreciation_rate DECIMAL(5,2),
  location VARCHAR(200),
  assigned_to UUID REFERENCES hrga.employees(id),
  condition VARCHAR(50) DEFAULT 'good', -- 'new', 'good', 'fair', 'poor', 'damaged', 'disposed'
  warranty_until DATE,
  last_maintenance_date DATE,
  next_maintenance_date DATE,
  status VARCHAR(50) DEFAULT 'active', -- 'active', 'maintenance', 'disposed', 'lost'
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- HRGA: Asset Repair/Maintenance
CREATE TABLE hrga.asset_repair (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  repair_number VARCHAR(50) UNIQUE NOT NULL,
  asset_id UUID REFERENCES hrga.assets(id) NOT NULL,
  request_date DATE DEFAULT CURRENT_DATE,
  requested_by UUID REFERENCES auth.users(id),
  problem_description TEXT NOT NULL,
  repair_type VARCHAR(50), -- 'preventive', 'corrective', 'emergency'
  priority VARCHAR(20) DEFAULT 'normal',
  assigned_to VARCHAR(200), -- technician/vendor name
  scheduled_date DATE,
  start_date DATE,
  completion_date DATE,
  repair_actions TEXT,
  parts_replaced TEXT,
  cost DECIMAL(15,2),
  status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'scheduled', 'in_progress', 'completed', 'cancelled'
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- HRGA: Office Supply Requests
CREATE TABLE hrga.office_supply_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_number VARCHAR(50) UNIQUE NOT NULL,
  request_date DATE DEFAULT CURRENT_DATE,
  requested_by UUID REFERENCES auth.users(id),
  department_id UUID REFERENCES hrga.master_departments(id),
  status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'approved', 'rejected', 'fulfilled'
  approved_by UUID REFERENCES auth.users(id),
  approved_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- HRGA: Office Supply Request Items
CREATE TABLE hrga.office_supply_request_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID REFERENCES hrga.office_supply_requests(id) ON DELETE CASCADE,
  item_number INTEGER NOT NULL,
  item_name VARCHAR(200) NOT NULL,
  quantity INTEGER NOT NULL,
  unit VARCHAR(20),
  purpose TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add foreign key constraints to employees table (after other tables exist)
ALTER TABLE hrga.employees ADD CONSTRAINT fk_employees_company
  FOREIGN KEY (company_id) REFERENCES hrga.master_companies(id);
ALTER TABLE hrga.employees ADD CONSTRAINT fk_employees_department
  FOREIGN KEY (department_id) REFERENCES hrga.master_departments(id);
ALTER TABLE hrga.employees ADD CONSTRAINT fk_employees_position
  FOREIGN KEY (position_id) REFERENCES hrga.master_positions(id);
ALTER TABLE hrga.employees ADD CONSTRAINT fk_employees_division
  FOREIGN KEY (division_id) REFERENCES hrga.divisions(id);
ALTER TABLE hrga.employees ADD CONSTRAINT fk_employees_sub_division
  FOREIGN KEY (sub_division_id) REFERENCES hrga.sub_divisions(id);

-- Create indexes
CREATE INDEX idx_employees_number ON hrga.employees(employee_number);
CREATE INDEX idx_employees_department ON hrga.employees(department_id);
CREATE INDEX idx_employees_position ON hrga.employees(position_id);
CREATE INDEX idx_master_departments_company ON hrga.master_departments(company_id);
CREATE INDEX idx_kpi_employee ON hrga.kpi(employee_id);
CREATE INDEX idx_kpi_period ON hrga.kpi(period_year, period_month);
CREATE INDEX idx_recruitment_position ON hrga.recruitment(position_id);
CREATE INDEX idx_recruitment_status ON hrga.recruitment(status);
CREATE INDEX idx_warning_letters_employee ON hrga.warning_letters(employee_id);
CREATE INDEX idx_document_management_employee ON hrga.document_management(employee_id);
CREATE INDEX idx_security_reports_date ON hrga.security_reports(report_date);
CREATE INDEX idx_janitor_reports_date ON hrga.janitor_reports(report_date);
CREATE INDEX idx_assets_code ON hrga.assets(asset_code);
CREATE INDEX idx_assets_assigned ON hrga.assets(assigned_to);
CREATE INDEX idx_asset_repair_asset ON hrga.asset_repair(asset_id);

-- Enable RLS
ALTER TABLE hrga.employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE hrga.master_companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE hrga.master_departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE hrga.master_positions ENABLE ROW LEVEL SECURITY;
ALTER TABLE hrga.divisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE hrga.sub_divisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE hrga.organization_structure ENABLE ROW LEVEL SECURITY;
ALTER TABLE hrga.kpi ENABLE ROW LEVEL SECURITY;
ALTER TABLE hrga.master_shift ENABLE ROW LEVEL SECURITY;
ALTER TABLE hrga.recruitment ENABLE ROW LEVEL SECURITY;
ALTER TABLE hrga.recruitment_candidates ENABLE ROW LEVEL SECURITY;
ALTER TABLE hrga.warning_letters ENABLE ROW LEVEL SECURITY;
ALTER TABLE hrga.document_management ENABLE ROW LEVEL SECURITY;
ALTER TABLE hrga.security_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE hrga.janitor_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE hrga.assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE hrga.asset_repair ENABLE ROW LEVEL SECURITY;
ALTER TABLE hrga.office_supply_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE hrga.office_supply_request_items ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Allow authenticated users to read employees" ON hrga.employees
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated users to read master companies" ON hrga.master_companies
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated users to read master departments" ON hrga.master_departments
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated users to read master positions" ON hrga.master_positions
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated users to read divisions" ON hrga.divisions
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated users to read sub divisions" ON hrga.sub_divisions
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated users to read organization structure" ON hrga.organization_structure
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated users to read kpi" ON hrga.kpi
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated users to read master shift" ON hrga.master_shift
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated users to read recruitment" ON hrga.recruitment
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated users to read document management" ON hrga.document_management
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated users to read assets" ON hrga.assets
  FOR SELECT TO authenticated USING (true);

-- Grant permissions
GRANT SELECT ON ALL TABLES IN SCHEMA hrga TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA hrga TO service_role;

-- Triggers for updated_at
CREATE TRIGGER update_employees_updated_at BEFORE UPDATE ON hrga.employees
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_master_companies_updated_at BEFORE UPDATE ON hrga.master_companies
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_master_departments_updated_at BEFORE UPDATE ON hrga.master_departments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_master_positions_updated_at BEFORE UPDATE ON hrga.master_positions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_divisions_updated_at BEFORE UPDATE ON hrga.divisions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sub_divisions_updated_at BEFORE UPDATE ON hrga.sub_divisions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_kpi_updated_at BEFORE UPDATE ON hrga.kpi
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_master_shift_updated_at BEFORE UPDATE ON hrga.master_shift
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_recruitment_updated_at BEFORE UPDATE ON hrga.recruitment
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_recruitment_candidates_updated_at BEFORE UPDATE ON hrga.recruitment_candidates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_warning_letters_updated_at BEFORE UPDATE ON hrga.warning_letters
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_document_management_updated_at BEFORE UPDATE ON hrga.document_management
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_assets_updated_at BEFORE UPDATE ON hrga.assets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_asset_repair_updated_at BEFORE UPDATE ON hrga.asset_repair
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_office_supply_requests_updated_at BEFORE UPDATE ON hrga.office_supply_requests
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
