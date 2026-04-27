-- PPIC Schema Tables
-- Migration: Create PPIC (Production Planning and Inventory Control) tables

-- Create ppic schema if not exists
CREATE SCHEMA IF NOT EXISTS ppic;
COMMENT ON SCHEMA ppic IS 'Production Planning and Inventory Control';

GRANT USAGE ON SCHEMA ppic TO authenticated;
GRANT ALL ON SCHEMA ppic TO service_role;

-- PPIC: Process Stages (Master)
CREATE TABLE ppic.process_stages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stage_code VARCHAR(50) UNIQUE NOT NULL,
  stage_name VARCHAR(200) NOT NULL,
  stage_order INTEGER NOT NULL,
  department VARCHAR(100),
  standard_duration_hours DECIMAL(10,2),
  is_active BOOLEAN DEFAULT true,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- PPIC: Production Plans
CREATE TABLE ppic.production_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_number VARCHAR(50) UNIQUE NOT NULL,
  plan_date DATE DEFAULT CURRENT_DATE,
  plan_period_start DATE NOT NULL,
  plan_period_end DATE NOT NULL,
  order_id UUID REFERENCES sales.orders(id),
  product_name VARCHAR(200) NOT NULL,
  product_type VARCHAR(50),
  quantity_planned INTEGER NOT NULL,
  target_completion_date DATE,
  planned_by UUID REFERENCES auth.users(id),
  status VARCHAR(50) DEFAULT 'draft', -- 'draft', 'approved', 'in_progress', 'completed', 'cancelled'
  priority VARCHAR(20) DEFAULT 'normal',
  notes TEXT,
  approved_by UUID REFERENCES auth.users(id),
  approved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- PPIC: Production Schedule
CREATE TABLE ppic.production_schedule (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  schedule_number VARCHAR(50) UNIQUE NOT NULL,
  production_plan_id UUID REFERENCES ppic.production_plans(id),
  work_order_id UUID REFERENCES production.work_orders(id),
  process_stage_id UUID REFERENCES ppic.process_stages(id),
  machine_id UUID REFERENCES production.machines(id),
  scheduled_date DATE NOT NULL,
  scheduled_start_time TIME,
  scheduled_end_time TIME,
  estimated_duration_hours DECIMAL(10,2),
  shift VARCHAR(50), -- 'shift_1', 'shift_2', 'shift_3'
  operator_id UUID REFERENCES auth.users(id),
  status VARCHAR(50) DEFAULT 'scheduled', -- 'scheduled', 'in_progress', 'completed', 'delayed', 'cancelled'
  actual_start_time TIMESTAMPTZ,
  actual_end_time TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- PPIC: Planning Capacity (Machine/Resource Capacity Planning)
CREATE TABLE ppic.planning_capacity (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  capacity_date DATE NOT NULL,
  resource_type VARCHAR(50) NOT NULL, -- 'machine', 'labor', 'material'
  resource_id UUID, -- references to machine, employee, or material
  resource_name VARCHAR(200) NOT NULL,
  available_capacity DECIMAL(15,2) NOT NULL, -- hours, units, etc
  allocated_capacity DECIMAL(15,2) DEFAULT 0,
  remaining_capacity DECIMAL(15,2) GENERATED ALWAYS AS (available_capacity - allocated_capacity) STORED,
  capacity_unit VARCHAR(20) NOT NULL, -- 'hours', 'units', 'kg', etc
  utilization_percentage DECIMAL(5,2) GENERATED ALWAYS AS ((allocated_capacity / NULLIF(available_capacity, 0)) * 100) STORED,
  shift VARCHAR(50),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(capacity_date, resource_type, resource_id, shift)
);

-- PPIC: Schedule Monitoring
CREATE TABLE ppic.schedule_monitoring (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  schedule_id UUID REFERENCES ppic.production_schedule(id) ON DELETE CASCADE,
  monitor_timestamp TIMESTAMPTZ DEFAULT NOW(),
  monitored_by UUID REFERENCES auth.users(id),
  status_update VARCHAR(50), -- 'on_time', 'delayed', 'ahead', 'issue'
  progress_percentage DECIMAL(5,2),
  quantity_completed INTEGER,
  delay_reason TEXT,
  corrective_action TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- PPIC: Material Monitoring (Material Requirements Planning)
CREATE TABLE ppic.material_monitoring (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  production_plan_id UUID REFERENCES ppic.production_plans(id),
  work_order_id UUID REFERENCES production.work_orders(id),
  material_id UUID REFERENCES master.materials(id) NOT NULL,
  required_quantity DECIMAL(15,3) NOT NULL,
  available_quantity DECIMAL(15,3),
  reserved_quantity DECIMAL(15,3),
  shortage_quantity DECIMAL(15,3) GENERATED ALWAYS AS (GREATEST(required_quantity - COALESCE(available_quantity, 0), 0)) STORED,
  required_date DATE,
  unit VARCHAR(20) NOT NULL,
  status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'available', 'shortage', 'ordered', 'ready'
  procurement_status VARCHAR(50), -- 'not_needed', 'requested', 'in_process', 'received'
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- PPIC: Material Usage Monitoring
CREATE TABLE ppic.material_usage_monitoring (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  work_order_id UUID REFERENCES production.work_orders(id),
  material_id UUID REFERENCES master.materials(id),
  monitor_date DATE DEFAULT CURRENT_DATE,
  planned_quantity DECIMAL(15,3),
  actual_quantity DECIMAL(15,3),
  variance_quantity DECIMAL(15,3) GENERATED ALWAYS AS (actual_quantity - planned_quantity) STORED,
  variance_percentage DECIMAL(5,2),
  unit VARCHAR(20),
  waste_quantity DECIMAL(15,3),
  waste_reason TEXT,
  efficiency_percentage DECIMAL(5,2),
  monitored_by UUID REFERENCES auth.users(id),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- PPIC: Production Completion
CREATE TABLE ppic.production_completion (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  completion_number VARCHAR(50) UNIQUE NOT NULL,
  work_order_id UUID REFERENCES production.work_orders(id) NOT NULL,
  production_plan_id UUID REFERENCES ppic.production_plans(id),
  completion_date DATE DEFAULT CURRENT_DATE,
  completed_by UUID REFERENCES auth.users(id),
  quantity_produced INTEGER NOT NULL,
  quantity_good INTEGER NOT NULL,
  quantity_reject INTEGER DEFAULT 0,
  quantity_rework INTEGER DEFAULT 0,
  reject_reason TEXT,
  yield_percentage DECIMAL(5,2) GENERATED ALWAYS AS ((quantity_good::DECIMAL / NULLIF(quantity_produced, 0)) * 100) STORED,
  production_notes TEXT,
  quality_notes TEXT,
  approved_by UUID REFERENCES auth.users(id),
  approved_at TIMESTAMPTZ,
  status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- PPIC: Completion List (Detail Items)
CREATE TABLE ppic.completion_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  completion_id UUID REFERENCES ppic.production_completion(id) ON DELETE CASCADE,
  item_number INTEGER NOT NULL,
  process_stage VARCHAR(100),
  operator_id UUID REFERENCES auth.users(id),
  start_time TIMESTAMPTZ,
  end_time TIMESTAMPTZ,
  duration_hours DECIMAL(10,2),
  quantity_processed INTEGER,
  defect_type VARCHAR(100),
  defect_quantity INTEGER,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_production_plans_order ON ppic.production_plans(order_id);
CREATE INDEX idx_production_plans_status ON ppic.production_plans(status);
CREATE INDEX idx_production_plans_period ON ppic.production_plans(plan_period_start, plan_period_end);
CREATE INDEX idx_production_schedule_plan ON ppic.production_schedule(production_plan_id);
CREATE INDEX idx_production_schedule_date ON ppic.production_schedule(scheduled_date);
CREATE INDEX idx_production_schedule_machine ON ppic.production_schedule(machine_id);
CREATE INDEX idx_planning_capacity_date ON ppic.planning_capacity(capacity_date);
CREATE INDEX idx_material_monitoring_plan ON ppic.material_monitoring(production_plan_id);
CREATE INDEX idx_material_monitoring_material ON ppic.material_monitoring(material_id);
CREATE INDEX idx_material_monitoring_status ON ppic.material_monitoring(status);
CREATE INDEX idx_production_completion_work_order ON ppic.production_completion(work_order_id);
CREATE INDEX idx_production_completion_date ON ppic.production_completion(completion_date);

-- Enable RLS
ALTER TABLE ppic.process_stages ENABLE ROW LEVEL SECURITY;
ALTER TABLE ppic.production_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE ppic.production_schedule ENABLE ROW LEVEL SECURITY;
ALTER TABLE ppic.planning_capacity ENABLE ROW LEVEL SECURITY;
ALTER TABLE ppic.schedule_monitoring ENABLE ROW LEVEL SECURITY;
ALTER TABLE ppic.material_monitoring ENABLE ROW LEVEL SECURITY;
ALTER TABLE ppic.material_usage_monitoring ENABLE ROW LEVEL SECURITY;
ALTER TABLE ppic.production_completion ENABLE ROW LEVEL SECURITY;
ALTER TABLE ppic.completion_items ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Allow authenticated users to read process stages" ON ppic.process_stages
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated users to read production plans" ON ppic.production_plans
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated users to read production schedule" ON ppic.production_schedule
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated users to read planning capacity" ON ppic.planning_capacity
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated users to read material monitoring" ON ppic.material_monitoring
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated users to read production completion" ON ppic.production_completion
  FOR SELECT TO authenticated USING (true);

-- Grant permissions
GRANT SELECT ON ALL TABLES IN SCHEMA ppic TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA ppic TO service_role;

-- Triggers for updated_at
CREATE TRIGGER update_process_stages_updated_at BEFORE UPDATE ON ppic.process_stages
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_production_plans_updated_at BEFORE UPDATE ON ppic.production_plans
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_production_schedule_updated_at BEFORE UPDATE ON ppic.production_schedule
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_planning_capacity_updated_at BEFORE UPDATE ON ppic.planning_capacity
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_material_monitoring_updated_at BEFORE UPDATE ON ppic.material_monitoring
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
