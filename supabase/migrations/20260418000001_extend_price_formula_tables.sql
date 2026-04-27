-- =====================================================
-- FORMULA HARGA (PRICE FORMULA) - EXTENDED SCHEMA
-- =====================================================
-- Database schema untuk sistem formula harga manufacturing ERP
-- Mendukung 4 jenis produk: Polos, Offset, Boks, Roto
-- =====================================================

-- Tabel utama price_formulas sudah ada di 20260413000003_create_sales_tables.sql
-- File ini menambahkan tabel-tabel pendukung untuk formula harga

-- =====================================================
-- 1. FORMULA TEMPLATES (Master Formula/Template)
-- =====================================================
-- Menyimpan template formula yang bisa digunakan berulang
CREATE TABLE IF NOT EXISTS sales.price_formula_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_name VARCHAR(200) NOT NULL,
  product_type VARCHAR(50) NOT NULL, -- 'polos', 'offset', 'boks', 'roto'
  description TEXT,

  -- Default specifications template
  default_specifications JSONB,

  -- Formula configuration
  formula_config JSONB, -- stores calculation formulas

  -- Cost component references
  default_material_costs JSONB,
  default_process_costs JSONB,

  -- Default margins
  default_margin_percentage DECIMAL(5,2) DEFAULT 20.00,

  -- Status
  is_active BOOLEAN DEFAULT true,

  -- Audit fields
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id)
);

-- Index untuk searching template
CREATE INDEX idx_formula_templates_product_type ON sales.price_formula_templates(product_type);
CREATE INDEX idx_formula_templates_active ON sales.price_formula_templates(is_active);

-- =====================================================
-- 2. COST COMPONENTS (Komponen Biaya)
-- =====================================================
-- Menyimpan daftar komponen biaya yang bisa digunakan dalam formula
CREATE TABLE IF NOT EXISTS sales.cost_components (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  component_code VARCHAR(50) UNIQUE NOT NULL,
  component_name VARCHAR(200) NOT NULL,
  component_category VARCHAR(50) NOT NULL, -- 'material', 'process', 'overhead', 'labor'

  -- Unit of measurement
  uom VARCHAR(50), -- 'kg', 'meter', 'pcs', 'jam', etc.

  -- Default cost
  unit_cost DECIMAL(15,2),

  -- Applicable product types
  applicable_product_types VARCHAR[] DEFAULT ARRAY['polos', 'offset', 'boks', 'roto'],

  -- Description
  description TEXT,
  notes TEXT,

  -- Status
  is_active BOOLEAN DEFAULT true,

  -- Audit fields
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id)
);

-- Indexes
CREATE INDEX idx_cost_components_category ON sales.cost_components(component_category);
CREATE INDEX idx_cost_components_active ON sales.cost_components(is_active);
CREATE INDEX idx_cost_components_code ON sales.cost_components(component_code);

-- =====================================================
-- 3. FORMULA REVISIONS (Riwayat Revisi)
-- =====================================================
-- Menyimpan riwayat perubahan formula harga
CREATE TABLE IF NOT EXISTS sales.price_formula_revisions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  formula_id UUID REFERENCES sales.price_formulas(id) ON DELETE CASCADE,
  revision_number INTEGER NOT NULL,

  -- Snapshot of formula at this revision
  revision_data JSONB NOT NULL, -- stores complete formula snapshot

  -- What changed
  changes_description TEXT,
  change_reason VARCHAR(200),

  -- Previous values (for comparison)
  previous_selling_price DECIMAL(15,2),
  new_selling_price DECIMAL(15,2),
  previous_margin DECIMAL(5,2),
  new_margin DECIMAL(5,2),

  -- Approval
  approved_by UUID REFERENCES auth.users(id),
  approved_at TIMESTAMPTZ,

  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- Indexes
CREATE INDEX idx_formula_revisions_formula_id ON sales.price_formula_revisions(formula_id);
CREATE INDEX idx_formula_revisions_created_at ON sales.price_formula_revisions(created_at DESC);

-- Constraint: unique revision number per formula
CREATE UNIQUE INDEX idx_unique_revision_per_formula
  ON sales.price_formula_revisions(formula_id, revision_number);

-- =====================================================
-- 4. FORMULA APPROVALS (Persetujuan Formula)
-- =====================================================
-- Menyimpan workflow approval untuk formula harga
CREATE TABLE IF NOT EXISTS sales.price_formula_approvals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  formula_id UUID REFERENCES sales.price_formulas(id) ON DELETE CASCADE,

  -- Approval workflow
  approval_level INTEGER NOT NULL, -- 1, 2, 3 (multi-level approval)
  approver_id UUID REFERENCES auth.users(id) NOT NULL,
  approver_role VARCHAR(100), -- 'sales_manager', 'finance_manager', 'director'

  -- Decision
  status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
  decision_notes TEXT,
  decided_at TIMESTAMPTZ,

  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_formula_approvals_formula_id ON sales.price_formula_approvals(formula_id);
CREATE INDEX idx_formula_approvals_status ON sales.price_formula_approvals(status);
CREATE INDEX idx_formula_approvals_approver ON sales.price_formula_approvals(approver_id);

-- =====================================================
-- 5. FORMULA COMPARISONS (Perbandingan Formula)
-- =====================================================
-- Untuk menyimpan perbandingan beberapa formula (competitive analysis)
CREATE TABLE IF NOT EXISTS sales.price_formula_comparisons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  comparison_name VARCHAR(200) NOT NULL,
  customer_id UUID REFERENCES sales.customers(id),
  product_type VARCHAR(50) NOT NULL,

  -- Formulas being compared
  formula_ids UUID[] NOT NULL, -- array of formula IDs

  -- Comparison notes
  comparison_notes TEXT,
  recommended_formula_id UUID REFERENCES sales.price_formulas(id),

  -- Decision
  decision_status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'decided', 'closed'
  final_decision_notes TEXT,
  decided_by UUID REFERENCES auth.users(id),
  decided_at TIMESTAMPTZ,

  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id)
);

-- Index
CREATE INDEX idx_formula_comparisons_customer ON sales.price_formula_comparisons(customer_id);
CREATE INDEX idx_formula_comparisons_status ON sales.price_formula_comparisons(decision_status);

-- =====================================================
-- 6. PRICING RULES (Aturan Pricing)
-- =====================================================
-- Menyimpan aturan otomatis untuk pricing (volume discount, seasonal, dll)
CREATE TABLE IF NOT EXISTS sales.pricing_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rule_name VARCHAR(200) NOT NULL,
  rule_type VARCHAR(50) NOT NULL, -- 'volume_discount', 'seasonal', 'customer_tier', 'product_category'

  -- Applicability
  product_types VARCHAR[], -- applicable product types
  customer_categories VARCHAR[], -- applicable customer categories

  -- Rule conditions (stored as JSONB for flexibility)
  conditions JSONB NOT NULL, -- e.g., {"min_quantity": 1000, "max_quantity": 5000}

  -- Rule actions
  discount_type VARCHAR(50), -- 'percentage', 'fixed_amount'
  discount_value DECIMAL(10,2),

  -- Priority (for multiple rules)
  priority INTEGER DEFAULT 0,

  -- Date range
  valid_from DATE,
  valid_until DATE,

  -- Status
  is_active BOOLEAN DEFAULT true,

  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id)
);

-- Indexes
CREATE INDEX idx_pricing_rules_type ON sales.pricing_rules(rule_type);
CREATE INDEX idx_pricing_rules_active ON sales.pricing_rules(is_active);
CREATE INDEX idx_pricing_rules_dates ON sales.pricing_rules(valid_from, valid_until);

-- =====================================================
-- 7. TRIGGERS
-- =====================================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to all new tables
CREATE TRIGGER update_price_formula_templates_updated_at
  BEFORE UPDATE ON sales.price_formula_templates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_cost_components_updated_at
  BEFORE UPDATE ON sales.cost_components
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_formula_comparisons_updated_at
  BEFORE UPDATE ON sales.price_formula_comparisons
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_pricing_rules_updated_at
  BEFORE UPDATE ON sales.pricing_rules
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_formula_approvals_updated_at
  BEFORE UPDATE ON sales.price_formula_approvals
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 8. AUTO-CREATE REVISION ON FORMULA UPDATE
-- =====================================================

CREATE OR REPLACE FUNCTION create_formula_revision()
RETURNS TRIGGER AS $$
DECLARE
  v_revision_number INTEGER;
BEGIN
  -- Get next revision number
  SELECT COALESCE(MAX(revision_number), 0) + 1
  INTO v_revision_number
  FROM sales.price_formula_revisions
  WHERE formula_id = NEW.id;

  -- Create revision record (only if selling_price or margin changed)
  IF (OLD.selling_price IS DISTINCT FROM NEW.selling_price)
     OR (OLD.margin_percentage IS DISTINCT FROM NEW.margin_percentage) THEN

    INSERT INTO sales.price_formula_revisions (
      formula_id,
      revision_number,
      revision_data,
      changes_description,
      previous_selling_price,
      new_selling_price,
      previous_margin,
      new_margin,
      created_by
    ) VALUES (
      NEW.id,
      v_revision_number,
      row_to_json(NEW)::jsonb,
      'Auto-generated revision on update',
      OLD.selling_price,
      NEW.selling_price,
      OLD.margin_percentage,
      NEW.margin_percentage,
      NEW.updated_by
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_create_formula_revision
  AFTER UPDATE ON sales.price_formulas
  FOR EACH ROW
  WHEN (OLD.* IS DISTINCT FROM NEW.*)
  EXECUTE FUNCTION create_formula_revision();

-- =====================================================
-- 9. VIEWS FOR REPORTING
-- =====================================================

-- View: Formula dengan approval status
CREATE OR REPLACE VIEW sales.vw_formula_with_approval_status AS
SELECT
  pf.id,
  pf.code,
  pf.product_name,
  pf.product_type,
  pf.customer_id,
  c.customer_name,
  pf.selling_price,
  pf.margin_percentage,
  pf.status as formula_status,
  pf.valid_until,

  -- Approval status
  CASE
    WHEN EXISTS (
      SELECT 1 FROM sales.price_formula_approvals
      WHERE formula_id = pf.id AND status = 'rejected'
    ) THEN 'rejected'
    WHEN NOT EXISTS (
      SELECT 1 FROM sales.price_formula_approvals
      WHERE formula_id = pf.id
    ) THEN 'no_approval_required'
    WHEN EXISTS (
      SELECT 1 FROM sales.price_formula_approvals
      WHERE formula_id = pf.id AND status = 'pending'
    ) THEN 'pending_approval'
    ELSE 'approved'
  END as approval_status,

  -- Latest revision
  (
    SELECT revision_number
    FROM sales.price_formula_revisions
    WHERE formula_id = pf.id
    ORDER BY revision_number DESC
    LIMIT 1
  ) as latest_revision,

  pf.created_at,
  pf.updated_at
FROM sales.price_formulas pf
LEFT JOIN sales.customers c ON pf.customer_id = c.id;

-- View: Cost analysis per formula
CREATE OR REPLACE VIEW sales.vw_formula_cost_analysis AS
SELECT
  id,
  code,
  product_name,
  product_type,

  -- Costs
  total_cost,
  hpp_production,
  hpp_jual,
  selling_price,

  -- Margins
  margin_percentage,
  (selling_price - hpp_jual) as margin_amount,

  -- Markup calculation
  CASE
    WHEN hpp_jual > 0 THEN
      ROUND(((selling_price - hpp_jual) / hpp_jual * 100)::numeric, 2)
    ELSE 0
  END as markup_percentage,

  quantity,
  estimated_result,

  -- Total revenue & profit
  (selling_price * quantity) as total_revenue,
  ((selling_price - hpp_jual) * quantity) as total_profit,

  created_at,
  updated_at
FROM sales.price_formulas;

-- =====================================================
-- 10. SEED DATA - COST COMPONENTS
-- =====================================================

-- Insert common cost components
INSERT INTO sales.cost_components (component_code, component_name, component_category, uom, unit_cost, applicable_product_types) VALUES
-- Materials
('MAT_PLASTIC_PE', 'Plastik PE (Polyethylene)', 'material', 'kg', 25000, ARRAY['polos', 'offset', 'roto']),
('MAT_PLASTIC_PP', 'Plastik PP (Polypropylene)', 'material', 'kg', 28000, ARRAY['polos', 'offset', 'boks']),
('MAT_INK_CMYK', 'Tinta CMYK', 'material', 'kg', 150000, ARRAY['offset', 'roto']),
('MAT_ADHESIVE', 'Lem/Perekat', 'material', 'kg', 45000, ARRAY['boks']),
('MAT_CARDBOARD', 'Kardus/Karton', 'material', 'kg', 12000, ARRAY['boks']),

-- Process costs
('PROC_PRINTING', 'Biaya Cetak', 'process', 'jam', 50000, ARRAY['offset', 'roto']),
('PROC_CUTTING', 'Biaya Potong', 'process', 'jam', 30000, ARRAY['polos', 'offset', 'boks']),
('PROC_FOLDING', 'Biaya Lipat', 'process', 'jam', 25000, ARRAY['boks']),
('PROC_GLUING', 'Biaya Lem', 'process', 'jam', 20000, ARRAY['boks']),

-- Labor
('LABOR_OPERATOR', 'Upah Operator', 'labor', 'jam', 15000, ARRAY['polos', 'offset', 'boks', 'roto']),
('LABOR_SUPERVISOR', 'Upah Supervisor', 'labor', 'jam', 25000, ARRAY['polos', 'offset', 'boks', 'roto']),

-- Overhead
('OH_ELECTRICITY', 'Listrik', 'overhead', 'kwh', 1500, ARRAY['polos', 'offset', 'boks', 'roto']),
('OH_MAINTENANCE', 'Maintenance Mesin', 'overhead', 'unit', 50000, ARRAY['polos', 'offset', 'boks', 'roto'])
ON CONFLICT (component_code) DO NOTHING;

-- =====================================================
-- COMMENTS
-- =====================================================

COMMENT ON TABLE sales.price_formula_templates IS 'Template master untuk formula harga yang bisa digunakan berulang';
COMMENT ON TABLE sales.cost_components IS 'Master komponen biaya (material, proses, overhead, labor)';
COMMENT ON TABLE sales.price_formula_revisions IS 'Riwayat revisi perubahan formula harga';
COMMENT ON TABLE sales.price_formula_approvals IS 'Workflow approval untuk formula harga (multi-level)';
COMMENT ON TABLE sales.price_formula_comparisons IS 'Perbandingan beberapa formula untuk analisis competitive';
COMMENT ON TABLE sales.pricing_rules IS 'Aturan otomatis pricing (volume discount, seasonal, dll)';

COMMENT ON VIEW sales.vw_formula_with_approval_status IS 'View formula harga dengan status approval';
COMMENT ON VIEW sales.vw_formula_cost_analysis IS 'View analisis biaya dan margin per formula';
