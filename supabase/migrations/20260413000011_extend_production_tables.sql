-- Extended Production Schema Tables
-- Migration: Add missing production tables from routes

-- Production: Process Units (Unit/Area Produksi)
CREATE TABLE production.process_units (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  unit_code VARCHAR(50) UNIQUE NOT NULL,
  unit_name VARCHAR(200) NOT NULL,
  department VARCHAR(100),
  unit_type VARCHAR(50), -- 'printing', 'laminating', 'slitting', 'packing', etc
  supervisor_id UUID REFERENCES auth.users(id),
  location VARCHAR(200),
  capacity_per_shift DECIMAL(15,2),
  capacity_unit VARCHAR(20),
  is_active BOOLEAN DEFAULT true,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Production: Shift Plan
CREATE TABLE production.shift_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_date DATE NOT NULL,
  shift_type VARCHAR(50) NOT NULL, -- 'shift_1', 'shift_2', 'shift_3', 'overtime'
  shift_start_time TIME NOT NULL,
  shift_end_time TIME NOT NULL,
  process_unit_id UUID REFERENCES production.process_units(id),
  supervisor_id UUID REFERENCES auth.users(id),
  planned_capacity DECIMAL(15,2),
  capacity_unit VARCHAR(20),
  status VARCHAR(50) DEFAULT 'planned', -- 'planned', 'active', 'completed', 'cancelled'
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(plan_date, shift_type, process_unit_id)
);

-- Production: Shift Assignments (Employee per Shift)
CREATE TABLE production.shift_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shift_plan_id UUID REFERENCES production.shift_plans(id) ON DELETE CASCADE,
  employee_id UUID REFERENCES auth.users(id) NOT NULL,
  role VARCHAR(100), -- 'operator', 'helper', 'qc', 'supervisor'
  machine_id UUID REFERENCES production.machines(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Production: Production Realization
CREATE TABLE production.production_realization (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  realization_number VARCHAR(50) UNIQUE NOT NULL,
  work_order_id UUID REFERENCES production.work_orders(id) NOT NULL,
  shift_plan_id UUID REFERENCES production.shift_plans(id),
  realization_date DATE DEFAULT CURRENT_DATE,
  shift_type VARCHAR(50),
  process_unit_id UUID REFERENCES production.process_units(id),
  machine_id UUID REFERENCES production.machines(id),
  operator_id UUID REFERENCES auth.users(id),
  start_time TIMESTAMPTZ,
  end_time TIMESTAMPTZ,
  quantity_target INTEGER,
  quantity_produced INTEGER,
  quantity_good INTEGER,
  quantity_reject INTEGER,
  quantity_rework INTEGER,
  production_speed DECIMAL(10,2), -- units per hour
  downtime_minutes INTEGER DEFAULT 0,
  status VARCHAR(50) DEFAULT 'in_progress', -- 'in_progress', 'completed', 'paused', 'stopped'
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- Production: Realization Monitoring (Real-time tracking)
CREATE TABLE production.realization_monitoring (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  realization_id UUID REFERENCES production.production_realization(id) ON DELETE CASCADE,
  monitor_timestamp TIMESTAMPTZ DEFAULT NOW(),
  cumulative_quantity INTEGER,
  current_speed DECIMAL(10,2),
  status_update VARCHAR(50),
  issue_detected VARCHAR(200),
  monitored_by UUID REFERENCES auth.users(id),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Production: Productivity Tracking
CREATE TABLE production.productivity (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tracking_date DATE NOT NULL,
  shift_type VARCHAR(50),
  process_unit_id UUID REFERENCES production.process_units(id),
  machine_id UUID REFERENCES production.machines(id),
  operator_id UUID REFERENCES auth.users(id),
  work_order_id UUID REFERENCES production.work_orders(id),
  standard_output INTEGER, -- expected output
  actual_output INTEGER,
  productivity_percentage DECIMAL(5,2) GENERATED ALWAYS AS ((actual_output::DECIMAL / NULLIF(standard_output, 0)) * 100) STORED,
  working_hours DECIMAL(10,2),
  downtime_hours DECIMAL(10,2),
  efficiency_percentage DECIMAL(5,2),
  oee_percentage DECIMAL(5,2), -- Overall Equipment Effectiveness
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Production: Downtime Tracking
CREATE TABLE production.downtime (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  downtime_number VARCHAR(50) UNIQUE NOT NULL,
  machine_id UUID REFERENCES production.machines(id) NOT NULL,
  process_unit_id UUID REFERENCES production.process_units(id),
  work_order_id UUID REFERENCES production.work_orders(id),
  downtime_date DATE DEFAULT CURRENT_DATE,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ,
  duration_minutes INTEGER,
  downtime_category VARCHAR(50) NOT NULL, -- 'breakdown', 'maintenance', 'setup', 'material_wait', 'power_failure', etc
  downtime_reason TEXT NOT NULL,
  impact_quantity INTEGER, -- quantity loss due to downtime
  reported_by UUID REFERENCES auth.users(id),
  resolved_by UUID REFERENCES auth.users(id),
  corrective_action TEXT,
  preventive_action TEXT,
  status VARCHAR(50) DEFAULT 'active', -- 'active', 'resolved', 'pending'
  priority VARCHAR(20) DEFAULT 'normal',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Production: Real-time Production Status
CREATE TABLE production.production_realtime (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  machine_id UUID REFERENCES production.machines(id) NOT NULL,
  process_unit_id UUID REFERENCES production.process_units(id),
  work_order_id UUID REFERENCES production.work_orders(id),
  current_status VARCHAR(50) NOT NULL, -- 'running', 'idle', 'maintenance', 'breakdown', 'setup'
  current_speed DECIMAL(10,2),
  target_speed DECIMAL(10,2),
  current_product VARCHAR(200),
  quantity_produced_today INTEGER DEFAULT 0,
  last_update_time TIMESTAMPTZ DEFAULT NOW(),
  operator_id UUID REFERENCES auth.users(id),
  temperature DECIMAL(10,2),
  pressure DECIMAL(10,2),
  other_parameters JSONB, -- flexible field for machine-specific parameters
  alerts JSONB, -- array of active alerts
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(machine_id)
);

-- Production: Overtime Requests
CREATE TABLE production.overtime_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_number VARCHAR(50) UNIQUE NOT NULL,
  request_date DATE DEFAULT CURRENT_DATE,
  overtime_date DATE NOT NULL,
  process_unit_id UUID REFERENCES production.process_units(id),
  work_order_id UUID REFERENCES production.work_orders(id),
  requested_by UUID REFERENCES auth.users(id),
  employees JSONB NOT NULL, -- array of employee IDs
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  total_hours DECIMAL(10,2),
  reason TEXT NOT NULL,
  justification TEXT,
  approved_by UUID REFERENCES auth.users(id),
  approved_at TIMESTAMPTZ,
  status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'approved', 'rejected', 'completed'
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_process_units_code ON production.process_units(unit_code);
CREATE INDEX idx_shift_plans_date ON production.shift_plans(plan_date);
CREATE INDEX idx_shift_plans_unit ON production.shift_plans(process_unit_id);
CREATE INDEX idx_production_realization_work_order ON production.production_realization(work_order_id);
CREATE INDEX idx_production_realization_date ON production.production_realization(realization_date);
CREATE INDEX idx_productivity_date ON production.productivity(tracking_date);
CREATE INDEX idx_productivity_machine ON production.productivity(machine_id);
CREATE INDEX idx_downtime_machine ON production.downtime(machine_id);
CREATE INDEX idx_downtime_date ON production.downtime(downtime_date);
CREATE INDEX idx_downtime_status ON production.downtime(status);
CREATE INDEX idx_production_realtime_machine ON production.production_realtime(machine_id);
CREATE INDEX idx_overtime_requests_date ON production.overtime_requests(overtime_date);

-- Enable RLS
ALTER TABLE production.process_units ENABLE ROW LEVEL SECURITY;
ALTER TABLE production.shift_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE production.shift_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE production.production_realization ENABLE ROW LEVEL SECURITY;
ALTER TABLE production.realization_monitoring ENABLE ROW LEVEL SECURITY;
ALTER TABLE production.productivity ENABLE ROW LEVEL SECURITY;
ALTER TABLE production.downtime ENABLE ROW LEVEL SECURITY;
ALTER TABLE production.production_realtime ENABLE ROW LEVEL SECURITY;
ALTER TABLE production.overtime_requests ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Allow authenticated users to read process units" ON production.process_units
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated users to read shift plans" ON production.shift_plans
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated users to read production realization" ON production.production_realization
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated users to read productivity" ON production.productivity
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated users to read downtime" ON production.downtime
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated users to read production realtime" ON production.production_realtime
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated users to read overtime requests" ON production.overtime_requests
  FOR SELECT TO authenticated USING (true);

-- Grant permissions
GRANT SELECT ON ALL TABLES IN SCHEMA production TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA production TO service_role;

-- Triggers for updated_at
CREATE TRIGGER update_process_units_updated_at BEFORE UPDATE ON production.process_units
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_shift_plans_updated_at BEFORE UPDATE ON production.shift_plans
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_production_realization_updated_at BEFORE UPDATE ON production.production_realization
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_downtime_updated_at BEFORE UPDATE ON production.downtime
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_production_realtime_updated_at BEFORE UPDATE ON production.production_realtime
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_overtime_requests_updated_at BEFORE UPDATE ON production.overtime_requests
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
