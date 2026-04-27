-- Production Schema Tables
-- Migration: Create production management tables

-- Production: Work Orders
CREATE TABLE production.work_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  work_order_number VARCHAR(50) UNIQUE NOT NULL,
  order_id UUID REFERENCES sales.orders(id),
  product_name VARCHAR(200) NOT NULL,
  product_type VARCHAR(50) NOT NULL, -- 'polos', 'offset', 'boks', 'roto'
  quantity_ordered INTEGER NOT NULL,
  quantity_produced INTEGER DEFAULT 0,
  specifications JSONB NOT NULL,
  formula_id UUID REFERENCES sales.price_formulas(id),
  planned_start_date DATE,
  planned_end_date DATE,
  actual_start_date DATE,
  actual_end_date DATE,
  status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'in_progress', 'completed', 'on_hold', 'cancelled'
  priority VARCHAR(20) DEFAULT 'normal', -- 'low', 'normal', 'high', 'urgent'
  notes TEXT,
  supervisor_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id)
);

-- Production: Process Steps (for each work order)
CREATE TABLE production.process_steps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  work_order_id UUID REFERENCES production.work_orders(id) ON DELETE CASCADE,
  step_number INTEGER NOT NULL,
  process_name VARCHAR(200) NOT NULL,
  process_cost_id UUID REFERENCES master.process_costs(id),
  description TEXT,
  planned_duration INTEGER, -- in minutes
  actual_duration INTEGER,
  status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'in_progress', 'completed', 'skipped'
  operator_id UUID REFERENCES auth.users(id),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Production: Material Usage (actual materials used in production)
CREATE TABLE production.material_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  work_order_id UUID REFERENCES production.work_orders(id) ON DELETE CASCADE,
  material_id UUID REFERENCES master.materials(id),
  planned_quantity DECIMAL(15,3),
  actual_quantity DECIMAL(15,3),
  unit VARCHAR(20),
  cost_per_unit DECIMAL(15,2),
  total_cost DECIMAL(15,2),
  usage_date DATE DEFAULT CURRENT_DATE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- Production: Quality Control
CREATE TABLE production.quality_checks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  work_order_id UUID REFERENCES production.work_orders(id) ON DELETE CASCADE,
  check_date DATE DEFAULT CURRENT_DATE,
  check_type VARCHAR(50) NOT NULL, -- 'incoming', 'in_process', 'final'
  inspector_id UUID REFERENCES auth.users(id),
  result VARCHAR(50) NOT NULL, -- 'pass', 'fail', 'conditional'
  defect_quantity INTEGER DEFAULT 0,
  defect_description TEXT,
  corrective_action TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Production: Machine/Equipment
CREATE TABLE production.machines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(200) NOT NULL,
  type VARCHAR(50) NOT NULL, -- 'printing', 'laminating', 'slitting', etc
  capacity DECIMAL(15,2),
  capacity_unit VARCHAR(20),
  hourly_rate DECIMAL(15,2),
  status VARCHAR(50) DEFAULT 'available', -- 'available', 'in_use', 'maintenance', 'broken'
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Production: Machine Usage Log
CREATE TABLE production.machine_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  work_order_id UUID REFERENCES production.work_orders(id) ON DELETE CASCADE,
  machine_id UUID REFERENCES production.machines(id),
  started_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ,
  duration_minutes INTEGER,
  cost DECIMAL(15,2),
  operator_id UUID REFERENCES auth.users(id),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_work_orders_number ON production.work_orders(work_order_number);
CREATE INDEX idx_work_orders_order ON production.work_orders(order_id);
CREATE INDEX idx_work_orders_status ON production.work_orders(status);
CREATE INDEX idx_work_orders_dates ON production.work_orders(planned_start_date, planned_end_date);
CREATE INDEX idx_process_steps_work_order ON production.process_steps(work_order_id);
CREATE INDEX idx_material_usage_work_order ON production.material_usage(work_order_id);
CREATE INDEX idx_quality_checks_work_order ON production.quality_checks(work_order_id);
CREATE INDEX idx_machines_code ON production.machines(code);
CREATE INDEX idx_machine_usage_work_order ON production.machine_usage(work_order_id);

-- Enable RLS
ALTER TABLE production.work_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE production.process_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE production.material_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE production.quality_checks ENABLE ROW LEVEL SECURITY;
ALTER TABLE production.machines ENABLE ROW LEVEL SECURITY;
ALTER TABLE production.machine_usage ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Allow authenticated users to read work orders" ON production.work_orders
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated users to read process steps" ON production.process_steps
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated users to read material usage" ON production.material_usage
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated users to read quality checks" ON production.quality_checks
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated users to read machines" ON production.machines
  FOR SELECT TO authenticated USING (true);

-- Grant permissions
GRANT SELECT ON ALL TABLES IN SCHEMA production TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA production TO service_role;
