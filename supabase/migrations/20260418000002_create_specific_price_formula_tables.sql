-- =====================================================
-- FORMULA HARGA - SPECIFIC TABLES PER PRODUCT TYPE
-- =====================================================
-- Schema terpisah untuk setiap jenis produk:
-- 1. Formula Harga Polos
-- 2. Formula Harga Offset
-- 3. Formula Harga Boks
-- 4. Formula Harga Roto
-- Plus master tables yang mendukung
-- =====================================================

-- =====================================================
-- MASTER TABLES
-- =====================================================

-- Master: Jenis Bahan (Material Types)
CREATE TABLE IF NOT EXISTS master.material_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(200) NOT NULL,
  category VARCHAR(50) NOT NULL, -- 'plastik', 'tinta', 'kertas', 'karton', 'lem'

  -- Specifications
  description TEXT,
  unit VARCHAR(50) NOT NULL, -- 'kg', 'meter', 'pcs', 'liter'
  standard_price DECIMAL(15,2), -- Harga standar per unit

  -- Properties (JSONB untuk fleksibilitas)
  properties JSONB, -- {"ketebalan_mikron": [60, 80, 100], "warna": ["putih", "transparan"]}

  -- Status
  is_active BOOLEAN DEFAULT true,

  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id)
);

-- Master: Ukuran Standar
CREATE TABLE IF NOT EXISTS master.standard_sizes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(200) NOT NULL,

  -- Dimensions
  width DECIMAL(10,2), -- cm
  length DECIMAL(10,2), -- cm
  height DECIMAL(10,2), -- cm (untuk boks)

  -- Category
  category VARCHAR(50), -- 'kantong', 'boks', 'lembaran'

  -- Common usage
  common_usage TEXT,

  -- Status
  is_active BOOLEAN DEFAULT true,

  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Master: Proses Produksi
CREATE TABLE IF NOT EXISTS master.production_processes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(200) NOT NULL,
  category VARCHAR(50) NOT NULL, -- 'cetak', 'potong', 'lipat', 'lem', 'finishing'

  -- Cost calculation
  unit VARCHAR(50) NOT NULL, -- 'jam', 'meter', 'pcs', 'setup'
  cost_per_unit DECIMAL(15,2),

  -- Machine & capacity
  machine_required VARCHAR(200),
  capacity_per_hour INTEGER,

  -- Applicable to
  applicable_product_types VARCHAR[] DEFAULT ARRAY['polos', 'offset', 'boks', 'roto'],

  -- Status
  is_active BOOLEAN DEFAULT true,

  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id)
);

-- Master: Finishing Options
CREATE TABLE IF NOT EXISTS master.finishing_options (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(200) NOT NULL,
  category VARCHAR(50) NOT NULL, -- 'laminating', 'emboss', 'spot_uv', 'die_cut', 'handle'

  -- Cost
  cost_type VARCHAR(50), -- 'per_sqm', 'per_pcs', 'per_setup', 'percentage'
  cost_value DECIMAL(15,2),

  -- Description
  description TEXT,

  -- Applicable to
  applicable_product_types VARCHAR[] DEFAULT ARRAY['polos', 'offset', 'boks', 'roto'],

  -- Status
  is_active BOOLEAN DEFAULT true,

  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 1. FORMULA HARGA POLOS
-- =====================================================
CREATE TABLE IF NOT EXISTS sales.price_formulas_polos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(50) UNIQUE NOT NULL,

  -- Reference
  customer_id UUID REFERENCES sales.customers(id),
  sales_person_id UUID REFERENCES auth.users(id),

  -- Product Info
  product_name VARCHAR(200) NOT NULL,

  -- SPESIFIKASI POLOS
  -- Ukuran
  width DECIMAL(10,2) NOT NULL, -- cm (lebar)
  length DECIMAL(10,2) NOT NULL, -- cm (panjang)
  gusset DECIMAL(10,2), -- cm (lipatan samping, opsional)

  -- Bahan
  material_type_id UUID REFERENCES master.material_types(id),
  material_name VARCHAR(200), -- PE, PP, OPP, dll
  material_thickness DECIMAL(10,2), -- mikron
  material_color VARCHAR(100), -- Bening, Putih Susu, Hitam, dll

  -- Handle/Pegangan
  handle_type VARCHAR(100), -- 'Plong', 'Tarik', 'Pita', 'Tanpa Handle'
  handle_position VARCHAR(100), -- 'Tengah', 'Samping'

  -- Printing (untuk polos biasanya tidak ada cetak, tapi bisa logo simple)
  has_printing BOOLEAN DEFAULT false,
  printing_colors INTEGER DEFAULT 0, -- 0 untuk polos murni
  printing_area VARCHAR(100), -- 'Depan', 'Belakang', 'Depan-Belakang'

  -- Finishing
  finishing_options VARCHAR[], -- ['Laminating', 'Plong Handle']

  -- PERHITUNGAN BIAYA MATERIAL
  -- Luas per pcs
  area_per_pcs DECIMAL(15,4), -- m² per pcs (dihitung dari ukuran)

  -- Berat material
  material_weight_per_pcs DECIMAL(15,4), -- kg per pcs
  material_price_per_kg DECIMAL(15,2),
  material_cost_per_pcs DECIMAL(15,2),

  -- Waste
  waste_percentage DECIMAL(5,2) DEFAULT 5.00,
  waste_cost DECIMAL(15,2),

  -- Total material cost
  total_material_cost DECIMAL(15,2),

  -- PERHITUNGAN BIAYA PROSES
  -- Setup
  setup_cost DECIMAL(15,2) DEFAULT 0,

  -- Proses Produksi
  production_time_per_1000pcs DECIMAL(10,2), -- jam per 1000 pcs
  production_cost_per_hour DECIMAL(15,2),
  total_production_cost DECIMAL(15,2),

  -- Handle/Plong
  handle_cost_per_pcs DECIMAL(15,2) DEFAULT 0,

  -- Finishing costs
  finishing_cost DECIMAL(15,2) DEFAULT 0,

  -- TOTAL COST & PRICING
  total_process_cost DECIMAL(15,2),
  total_cost_per_pcs DECIMAL(15,2), -- material + process

  -- Overhead
  overhead_percentage DECIMAL(5,2) DEFAULT 15.00,
  overhead_cost DECIMAL(15,2),

  -- HPP
  hpp_per_pcs DECIMAL(15,2), -- total cost + overhead

  -- Quantity & Total
  quantity INTEGER NOT NULL,
  total_hpp DECIMAL(15,2),

  -- Margin & Selling Price
  margin_percentage DECIMAL(5,2) DEFAULT 20.00,
  margin_amount DECIMAL(15,2),
  selling_price_per_pcs DECIMAL(15,2),
  total_selling_price DECIMAL(15,2),

  -- PPN
  ppn_percentage DECIMAL(5,2) DEFAULT 11.00,
  ppn_amount DECIMAL(15,2),
  grand_total DECIMAL(15,2),

  -- Business Info
  estimated_production_days INTEGER,
  notes TEXT,

  -- Status & Validity
  status VARCHAR(50) DEFAULT 'draft', -- 'draft', 'pending_approval', 'approved', 'sent', 'rejected', 'closed'
  valid_until DATE,

  -- Approval
  approved_by UUID REFERENCES auth.users(id),
  approved_at TIMESTAMPTZ,

  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id)
);

-- =====================================================
-- 2. FORMULA HARGA OFFSET
-- =====================================================
CREATE TABLE IF NOT EXISTS sales.price_formulas_offset (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(50) UNIQUE NOT NULL,

  -- Reference
  customer_id UUID REFERENCES sales.customers(id),
  sales_person_id UUID REFERENCES auth.users(id),

  -- Product Info
  product_name VARCHAR(200) NOT NULL,

  -- SPESIFIKASI OFFSET (Full Color Printing)
  -- Ukuran
  width DECIMAL(10,2) NOT NULL, -- cm
  length DECIMAL(10,2) NOT NULL, -- cm
  gusset DECIMAL(10,2), -- cm (lipatan samping)

  -- Bahan
  material_type_id UUID REFERENCES master.material_types(id),
  material_name VARCHAR(200), -- PE, PP, OPP, BOPP
  material_thickness DECIMAL(10,2), -- mikron
  material_color VARCHAR(100), -- Biasanya putih untuk offset

  -- PRINTING SPECIFICATION
  printing_method VARCHAR(100) DEFAULT 'Offset', -- Offset, Flexo
  printing_colors INTEGER NOT NULL, -- 1-6 warna (CMYK = 4)
  printing_type VARCHAR(100), -- 'CMYK Full Color', '2 Warna', '3 Warna'

  -- Print area
  print_side VARCHAR(100), -- '1 Sisi (Depan)', '2 Sisi (Depan-Belakang)'
  print_area_width DECIMAL(10,2), -- cm
  print_area_length DECIMAL(10,2), -- cm
  print_coverage_percentage DECIMAL(5,2), -- % area yang dicetak

  -- Design
  has_logo BOOLEAN DEFAULT true,
  has_photo BOOLEAN DEFAULT false,
  has_barcode BOOLEAN DEFAULT false,
  design_complexity VARCHAR(50), -- 'Simple', 'Medium', 'Complex'

  -- Plat/Film
  plat_cost DECIMAL(15,2), -- Biaya plat cetak
  plat_size VARCHAR(100),
  number_of_plats INTEGER,

  -- Handle
  handle_type VARCHAR(100),
  handle_position VARCHAR(100),

  -- Finishing
  finishing_options VARCHAR[], -- ['Laminating Glossy', 'Laminating Doff', 'Spot UV', 'Emboss']

  -- PERHITUNGAN BIAYA MATERIAL
  area_per_pcs DECIMAL(15,4), -- m²
  material_weight_per_pcs DECIMAL(15,4), -- kg
  material_price_per_kg DECIMAL(15,2),
  material_cost_per_pcs DECIMAL(15,2),

  -- Tinta
  ink_type VARCHAR(100), -- 'Water Based', 'Solvent', 'UV'
  ink_consumption_per_sqm DECIMAL(10,4), -- kg per m²
  ink_price_per_kg DECIMAL(15,2),
  total_ink_cost DECIMAL(15,2),

  -- Waste
  waste_percentage DECIMAL(5,2) DEFAULT 8.00, -- Lebih tinggi untuk offset
  waste_cost DECIMAL(15,2),

  -- Total material
  total_material_cost DECIMAL(15,2),

  -- PERHITUNGAN BIAYA PROSES
  -- Setup & Plat
  setup_cost DECIMAL(15,2),
  plat_making_cost DECIMAL(15,2),

  -- Printing
  printing_time_per_1000pcs DECIMAL(10,2), -- jam
  printing_cost_per_hour DECIMAL(15,2),
  total_printing_cost DECIMAL(15,2),

  -- Potong & Lipat
  cutting_cost DECIMAL(15,2),
  folding_cost DECIMAL(15,2) DEFAULT 0,

  -- Handle
  handle_cost_per_pcs DECIMAL(15,2) DEFAULT 0,

  -- Finishing (Laminating, UV, dll)
  laminating_cost DECIMAL(15,2) DEFAULT 0,
  other_finishing_cost DECIMAL(15,2) DEFAULT 0,

  -- Total Process
  total_process_cost DECIMAL(15,2),

  -- TOTAL COST & PRICING
  total_cost_per_pcs DECIMAL(15,2),
  overhead_percentage DECIMAL(5,2) DEFAULT 15.00,
  overhead_cost DECIMAL(15,2),
  hpp_per_pcs DECIMAL(15,2),

  -- Quantity
  quantity INTEGER NOT NULL,
  total_hpp DECIMAL(15,2),

  -- Margin & Price
  margin_percentage DECIMAL(5,2) DEFAULT 25.00, -- Lebih tinggi untuk offset
  margin_amount DECIMAL(15,2),
  selling_price_per_pcs DECIMAL(15,2),
  total_selling_price DECIMAL(15,2),

  -- PPN
  ppn_percentage DECIMAL(5,2) DEFAULT 11.00,
  ppn_amount DECIMAL(15,2),
  grand_total DECIMAL(15,2),

  -- Business Info
  estimated_production_days INTEGER,
  notes TEXT,

  -- Status & Validity
  status VARCHAR(50) DEFAULT 'draft',
  valid_until DATE,
  approved_by UUID REFERENCES auth.users(id),
  approved_at TIMESTAMPTZ,

  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id)
);

-- =====================================================
-- 3. FORMULA HARGA BOKS
-- =====================================================
CREATE TABLE IF NOT EXISTS sales.price_formulas_boks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(50) UNIQUE NOT NULL,

  -- Reference
  customer_id UUID REFERENCES sales.customers(id),
  sales_person_id UUID REFERENCES auth.users(id),

  -- Product Info
  product_name VARCHAR(200) NOT NULL,

  -- SPESIFIKASI BOKS
  -- Ukuran (3 Dimensi)
  width DECIMAL(10,2) NOT NULL, -- cm (lebar)
  length DECIMAL(10,2) NOT NULL, -- cm (panjang)
  height DECIMAL(10,2) NOT NULL, -- cm (tinggi)

  -- Tipe Boks
  box_type VARCHAR(100), -- 'Regular Slotted Container (RSC)', 'Die Cut', 'Mailer Box', 'Tuck Top', dll
  box_style VARCHAR(100), -- 'Single Wall', 'Double Wall', 'Triple Wall'

  -- Bahan Karton
  material_type_id UUID REFERENCES master.material_types(id),
  material_name VARCHAR(200), -- 'Duplex', 'Ivory', 'Kraft', 'Corrugated'
  material_grade VARCHAR(100), -- 'B Flute', 'C Flute', 'E Flute' (untuk corrugated)
  material_thickness DECIMAL(10,2), -- gsm atau mm
  material_color VARCHAR(100),

  -- PRINTING
  has_printing BOOLEAN DEFAULT false,
  printing_colors INTEGER DEFAULT 0,
  printing_method VARCHAR(100), -- 'Offset', 'Flexo', 'Digital'
  print_side VARCHAR(100), -- 'Luar', 'Dalam', 'Luar-Dalam'

  -- Design
  has_logo BOOLEAN DEFAULT false,
  has_window BOOLEAN DEFAULT false, -- Jendela transparan
  window_size VARCHAR(100),

  -- Plat (jika ada cetak)
  plat_cost DECIMAL(15,2) DEFAULT 0,

  -- Finishing
  finishing_options VARCHAR[], -- ['Laminating', 'Spot UV', 'Emboss', 'Hot Stamping']

  -- PERHITUNGAN BIAYA MATERIAL
  -- Luas permukaan (sheet size)
  sheet_width DECIMAL(10,2), -- cm (lembaran sebelum dipotong)
  sheet_length DECIMAL(10,2), -- cm
  sheet_area DECIMAL(15,4), -- m²

  -- Berat karton
  sheet_weight_per_pcs DECIMAL(15,4), -- kg
  material_price_per_kg DECIMAL(15,2),
  material_cost_per_pcs DECIMAL(15,2),

  -- Lem/Adhesive
  adhesive_type VARCHAR(100), -- 'Lem Kertas', 'Lem Fox', 'Tape'
  adhesive_cost_per_pcs DECIMAL(15,2) DEFAULT 0,

  -- Window film (jika ada)
  window_film_cost DECIMAL(15,2) DEFAULT 0,

  -- Waste
  waste_percentage DECIMAL(5,2) DEFAULT 10.00, -- Lebih tinggi untuk boks
  waste_cost DECIMAL(15,2),

  -- Total Material
  total_material_cost DECIMAL(15,2),

  -- PERHITUNGAN BIAYA PROSES
  -- Die Cutting/Setup
  die_cutting_cost DECIMAL(15,2) DEFAULT 0,
  setup_cost DECIMAL(15,2),

  -- Printing (jika ada)
  printing_cost DECIMAL(15,2) DEFAULT 0,

  -- Potong & Pond (Scoring)
  cutting_cost DECIMAL(15,2),
  scoring_cost DECIMAL(15,2), -- Garis lipat

  -- Lem & Assembly
  gluing_time_per_1000pcs DECIMAL(10,2), -- jam
  gluing_cost_per_hour DECIMAL(15,2),
  total_gluing_cost DECIMAL(15,2),

  -- Lipat (jika knock-down)
  folding_cost DECIMAL(15,2) DEFAULT 0,

  -- Finishing
  laminating_cost DECIMAL(15,2) DEFAULT 0,
  other_finishing_cost DECIMAL(15,2) DEFAULT 0,

  -- Packing
  packing_cost_per_pcs DECIMAL(15,2) DEFAULT 0,

  -- Total Process
  total_process_cost DECIMAL(15,2),

  -- TOTAL COST & PRICING
  total_cost_per_pcs DECIMAL(15,2),
  overhead_percentage DECIMAL(5,2) DEFAULT 15.00,
  overhead_cost DECIMAL(15,2),
  hpp_per_pcs DECIMAL(15,2),

  -- Quantity
  quantity INTEGER NOT NULL,
  total_hpp DECIMAL(15,2),

  -- Margin & Price
  margin_percentage DECIMAL(5,2) DEFAULT 30.00, -- Lebih tinggi untuk boks
  margin_amount DECIMAL(15,2),
  selling_price_per_pcs DECIMAL(15,2),
  total_selling_price DECIMAL(15,2),

  -- PPN
  ppn_percentage DECIMAL(5,2) DEFAULT 11.00,
  ppn_amount DECIMAL(15,2),
  grand_total DECIMAL(15,2),

  -- Business Info
  estimated_production_days INTEGER,
  is_knockdown BOOLEAN DEFAULT false, -- Boks lipat/bongkar pasang
  notes TEXT,

  -- Status & Validity
  status VARCHAR(50) DEFAULT 'draft',
  valid_until DATE,
  approved_by UUID REFERENCES auth.users(id),
  approved_at TIMESTAMPTZ,

  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id)
);

-- =====================================================
-- 4. FORMULA HARGA ROTO
-- =====================================================
CREATE TABLE IF NOT EXISTS sales.price_formulas_roto (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(50) UNIQUE NOT NULL,

  -- Reference
  customer_id UUID REFERENCES sales.customers(id),
  sales_person_id UUID REFERENCES auth.users(id),

  -- Product Info
  product_name VARCHAR(200) NOT NULL,

  -- SPESIFIKASI ROTO (Rotogravure/Flexo Roll)
  -- Ukuran
  width DECIMAL(10,2) NOT NULL, -- cm (lebar roll)
  length DECIMAL(10,2), -- cm (panjang per pcs/potong)
  roll_length DECIMAL(15,2), -- meter (total panjang roll)

  -- Bahan Film
  material_type_id UUID REFERENCES master.material_types(id),
  material_name VARCHAR(200), -- 'PE', 'PP', 'PET', 'BOPP', 'BOPET'
  material_structure VARCHAR(200), -- '2 Layer (PE/PE)', '3 Layer (PET/AL/PE)'
  material_thickness DECIMAL(10,2), -- mikron

  -- Layer structure (untuk multi-layer)
  layer_1_material VARCHAR(100),
  layer_1_thickness DECIMAL(10,2),
  layer_2_material VARCHAR(100),
  layer_2_thickness DECIMAL(10,2),
  layer_3_material VARCHAR(100),
  layer_3_thickness DECIMAL(10,2),

  -- PRINTING SPECIFICATION (High Quality)
  printing_method VARCHAR(100) DEFAULT 'Rotogravure', -- 'Rotogravure', 'Flexography'
  printing_colors INTEGER NOT NULL, -- 1-8 warna (biasanya 4-6 untuk roto)
  printing_type VARCHAR(100), -- 'Full Color', 'Spot Color'

  -- Cylinder/Roll
  cylinder_size VARCHAR(100), -- '600mm', '800mm', '1000mm'
  cylinder_cost DECIMAL(15,2), -- Biaya cylinder cetak
  number_of_cylinders INTEGER,

  -- Print repeat (panjang gambar berulang)
  print_repeat_length DECIMAL(10,2), -- cm

  -- Design
  design_complexity VARCHAR(50), -- 'Simple', 'Medium', 'Complex'
  has_gradient BOOLEAN DEFAULT false,
  has_photo BOOLEAN DEFAULT false,

  -- Finishing
  finishing_options VARCHAR[], -- ['Laminating', 'Metalized', 'Hologram']

  -- PERHITUNGAN BIAYA MATERIAL
  -- Material cost
  material_weight_per_sqm DECIMAL(10,4), -- kg/m²
  total_area DECIMAL(15,4), -- m² (roll_length * width)
  total_material_weight DECIMAL(15,4), -- kg
  material_price_per_kg DECIMAL(15,2),
  total_material_cost DECIMAL(15,2),

  -- Tinta
  ink_type VARCHAR(100), -- 'Solvent', 'Water Based'
  ink_consumption_per_sqm DECIMAL(10,4), -- kg/m²
  ink_price_per_kg DECIMAL(15,2),
  total_ink_cost DECIMAL(15,2),

  -- Solvent (untuk tinta solvent)
  solvent_consumption DECIMAL(15,4), -- liter
  solvent_price_per_liter DECIMAL(15,2),
  total_solvent_cost DECIMAL(15,2) DEFAULT 0,

  -- Adhesive (untuk laminating)
  adhesive_consumption DECIMAL(15,4), -- kg
  adhesive_price_per_kg DECIMAL(15,2),
  total_adhesive_cost DECIMAL(15,2) DEFAULT 0,

  -- Waste
  waste_percentage DECIMAL(5,2) DEFAULT 12.00, -- Tinggi untuk roto
  waste_cost DECIMAL(15,2),

  -- Total Material
  total_material_cost_with_waste DECIMAL(15,2),

  -- PERHITUNGAN BIAYA PROSES
  -- Setup & Cylinder
  setup_cost DECIMAL(15,2),
  cylinder_making_cost DECIMAL(15,2),

  -- Printing
  machine_speed_mpm DECIMAL(10,2), -- meter per minute
  printing_time_hours DECIMAL(10,2),
  printing_cost_per_hour DECIMAL(15,2),
  total_printing_cost DECIMAL(15,2),

  -- Laminating (jika multi-layer)
  laminating_cost DECIMAL(15,2) DEFAULT 0,

  -- Slitting (potong roll)
  slitting_cost DECIMAL(15,2),

  -- Finishing
  other_finishing_cost DECIMAL(15,2) DEFAULT 0,

  -- Total Process
  total_process_cost DECIMAL(15,2),

  -- TOTAL COST & PRICING
  total_cost_per_roll DECIMAL(15,2),

  -- Jika dihitung per pcs
  pcs_per_roll INTEGER, -- Berapa potong per roll
  cost_per_pcs DECIMAL(15,2),

  -- Overhead
  overhead_percentage DECIMAL(5,2) DEFAULT 15.00,
  overhead_cost DECIMAL(15,2),

  -- HPP
  hpp_per_roll DECIMAL(15,2),
  hpp_per_pcs DECIMAL(15,2),

  -- Quantity
  quantity_rolls INTEGER,
  quantity_pcs INTEGER,
  total_hpp DECIMAL(15,2),

  -- Margin & Price
  margin_percentage DECIMAL(5,2) DEFAULT 25.00,
  margin_amount DECIMAL(15,2),
  selling_price_per_roll DECIMAL(15,2),
  selling_price_per_pcs DECIMAL(15,2),
  total_selling_price DECIMAL(15,2),

  -- PPN
  ppn_percentage DECIMAL(5,2) DEFAULT 11.00,
  ppn_amount DECIMAL(15,2),
  grand_total DECIMAL(15,2),

  -- Business Info
  estimated_production_days INTEGER,
  minimum_order_quantity INTEGER, -- MOQ
  notes TEXT,

  -- Status & Validity
  status VARCHAR(50) DEFAULT 'draft',
  valid_until DATE,
  approved_by UUID REFERENCES auth.users(id),
  approved_at TIMESTAMPTZ,

  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id)
);

-- =====================================================
-- INDEXES
-- =====================================================

-- Master Tables Indexes
CREATE INDEX idx_material_types_category ON master.material_types(category);
CREATE INDEX idx_material_types_active ON master.material_types(is_active);
CREATE INDEX idx_standard_sizes_category ON master.standard_sizes(category);
CREATE INDEX idx_production_processes_category ON master.production_processes(category);
CREATE INDEX idx_finishing_options_category ON master.finishing_options(category);

-- Price Formula Polos
CREATE INDEX idx_pf_polos_customer ON sales.price_formulas_polos(customer_id);
CREATE INDEX idx_pf_polos_status ON sales.price_formulas_polos(status);
CREATE INDEX idx_pf_polos_sales_person ON sales.price_formulas_polos(sales_person_id);
CREATE INDEX idx_pf_polos_created ON sales.price_formulas_polos(created_at DESC);

-- Price Formula Offset
CREATE INDEX idx_pf_offset_customer ON sales.price_formulas_offset(customer_id);
CREATE INDEX idx_pf_offset_status ON sales.price_formulas_offset(status);
CREATE INDEX idx_pf_offset_sales_person ON sales.price_formulas_offset(sales_person_id);
CREATE INDEX idx_pf_offset_created ON sales.price_formulas_offset(created_at DESC);

-- Price Formula Boks
CREATE INDEX idx_pf_boks_customer ON sales.price_formulas_boks(customer_id);
CREATE INDEX idx_pf_boks_status ON sales.price_formulas_boks(status);
CREATE INDEX idx_pf_boks_sales_person ON sales.price_formulas_boks(sales_person_id);
CREATE INDEX idx_pf_boks_created ON sales.price_formulas_boks(created_at DESC);

-- Price Formula Roto
CREATE INDEX idx_pf_roto_customer ON sales.price_formulas_roto(customer_id);
CREATE INDEX idx_pf_roto_status ON sales.price_formulas_roto(status);
CREATE INDEX idx_pf_roto_sales_person ON sales.price_formulas_roto(sales_person_id);
CREATE INDEX idx_pf_roto_created ON sales.price_formulas_roto(created_at DESC);

-- =====================================================
-- TRIGGERS
-- =====================================================

-- Auto-update updated_at
CREATE TRIGGER update_material_types_updated_at
  BEFORE UPDATE ON master.material_types
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_production_processes_updated_at
  BEFORE UPDATE ON master.production_processes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_pf_polos_updated_at
  BEFORE UPDATE ON sales.price_formulas_polos
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_pf_offset_updated_at
  BEFORE UPDATE ON sales.price_formulas_offset
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_pf_boks_updated_at
  BEFORE UPDATE ON sales.price_formulas_boks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_pf_roto_updated_at
  BEFORE UPDATE ON sales.price_formulas_roto
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- SEED DATA - MASTER TABLES
-- =====================================================

-- Material Types
INSERT INTO master.material_types (code, name, category, unit, standard_price, properties) VALUES
-- Plastik
('MAT-PE-001', 'Plastik PE (Polyethylene)', 'plastik', 'kg', 25000, '{"ketebalan_mikron": [60, 80, 100, 120], "warna": ["bening", "putih susu", "hitam"]}'::jsonb),
('MAT-PP-001', 'Plastik PP (Polypropylene)', 'plastik', 'kg', 28000, '{"ketebalan_mikron": [60, 80, 100], "warna": ["bening", "putih"]}'::jsonb),
('MAT-OPP-001', 'Plastik OPP (Oriented Polypropylene)', 'plastik', 'kg', 32000, '{"ketebalan_mikron": [20, 30, 40], "finishing": ["glossy", "matte"]}'::jsonb),
('MAT-BOPP-001', 'BOPP (Biaxially Oriented Polypropylene)', 'plastik', 'kg', 35000, '{"ketebalan_mikron": [20, 25, 30], "tipe": ["transparent", "white", "metalized"]}'::jsonb),
('MAT-PET-001', 'PET (Polyethylene Terephthalate)', 'plastik', 'kg', 45000, '{"ketebalan_mikron": [12, 15, 20, 25]}'::jsonb),

-- Karton/Kertas
('MAT-DUPLEX-001', 'Karton Duplex', 'karton', 'kg', 15000, '{"gramasi": [250, 300, 350, 400], "tipe": ["grey back", "white back"]}'::jsonb),
('MAT-IVORY-001', 'Karton Ivory', 'karton', 'kg', 18000, '{"gramasi": [230, 250, 310, 400]}'::jsonb),
('MAT-KRAFT-001', 'Karton Kraft', 'karton', 'kg', 12000, '{"gramasi": [150, 200, 250, 300], "warna": ["brown", "white"]}'::jsonb),
('MAT-CORR-001', 'Corrugated Board', 'karton', 'kg', 10000, '{"flute": ["B", "C", "E", "BC"], "wall": ["single", "double"]}'::jsonb),

-- Tinta
('INK-CMYK-001', 'Tinta Offset CMYK', 'tinta', 'kg', 150000, '{"tipe": ["sheet fed", "web"]}'::jsonb),
('INK-FLEXO-001', 'Tinta Flexo Water Based', 'tinta', 'kg', 120000, '{"series": ["economical", "premium"]}'::jsonb),
('INK-ROTO-001', 'Tinta Rotogravure Solvent', 'tinta', 'kg', 180000, '{"tipe": ["surface", "lamination"]}'::jsonb),

-- Lem
('ADH-PAPER-001', 'Lem Kertas (Starch)', 'lem', 'kg', 15000, NULL),
('ADH-FOX-001', 'Lem Fox (PVAc)', 'lem', 'kg', 25000, NULL),
('ADH-LAMINATE-001', 'Adhesive Laminating', 'lem', 'kg', 85000, '{"tipe": ["solvent", "solventless", "water based"]}'::jsonb)
ON CONFLICT (code) DO NOTHING;

-- Standard Sizes
INSERT INTO master.standard_sizes (code, name, width, length, height, category, common_usage) VALUES
-- Kantong Plastik
('SIZE-K-001', 'Kantong Kecil 15x20', 15, 20, NULL, 'kantong', 'Kantong snack, aksesoris kecil'),
('SIZE-K-002', 'Kantong Sedang 20x30', 20, 30, NULL, 'kantong', 'Kantong baju, makanan'),
('SIZE-K-003', 'Kantong Besar 30x40', 30, 40, NULL, 'kantong', 'Kantong shopping, pakaian'),
('SIZE-K-004', 'Kantong Jumbo 40x50', 40, 50, NULL, 'kantong', 'Kantong grosir, kemasan besar'),

-- Boks
('SIZE-B-001', 'Boks Kecil 10x10x10', 10, 10, 10, 'boks', 'Boks produk kecil, kosmetik'),
('SIZE-B-002', 'Boks Sedang 20x20x15', 20, 20, 15, 'boks', 'Boks makanan, elektronik kecil'),
('SIZE-B-003', 'Boks Besar 30x30x20', 30, 30, 20, 'boks', 'Boks sepatu, produk medium'),
('SIZE-B-004', 'Boks Jumbo 40x40x30', 40, 40, 30, 'boks', 'Boks pengiriman, produk besar')
ON CONFLICT (code) DO NOTHING;

-- Production Processes
INSERT INTO master.production_processes (code, name, category, unit, cost_per_unit, machine_required, capacity_per_hour, applicable_product_types) VALUES
-- Cetak
('PROC-PRINT-001', 'Printing Offset 1 Warna', 'cetak', 'jam', 200000, 'Mesin Offset', 5000, ARRAY['offset']),
('PROC-PRINT-002', 'Printing Offset 4 Warna CMYK', 'cetak', 'jam', 500000, 'Mesin Offset 4 Warna', 3000, ARRAY['offset']),
('PROC-PRINT-003', 'Printing Flexo', 'cetak', 'jam', 300000, 'Mesin Flexo', 8000, ARRAY['polos', 'offset']),
('PROC-PRINT-004', 'Printing Rotogravure', 'cetak', 'jam', 800000, 'Mesin Rotogravure', 10000, ARRAY['roto']),

-- Potong
('PROC-CUT-001', 'Potong Manual', 'potong', 'jam', 100000, 'Manual', 2000, ARRAY['polos', 'offset', 'boks']),
('PROC-CUT-002', 'Potong Mesin', 'potong', 'jam', 150000, 'Mesin Potong', 5000, ARRAY['polos', 'offset', 'boks']),
('PROC-CUT-003', 'Die Cutting', 'potong', 'jam', 250000, 'Mesin Die Cut', 3000, ARRAY['boks']),

-- Lipat & Lem
('PROC-FOLD-001', 'Lipat Manual', 'lipat', 'jam', 80000, 'Manual', 1000, ARRAY['boks']),
('PROC-FOLD-002', 'Lipat Mesin', 'lipat', 'jam', 120000, 'Mesin Folder Gluer', 3000, ARRAY['boks']),
('PROC-GLUE-001', 'Lem Manual', 'lem', 'jam', 100000, 'Manual', 1500, ARRAY['boks']),
('PROC-GLUE-002', 'Lem Mesin (Folder Gluer)', 'lem', 'jam', 200000, 'Folder Gluer', 5000, ARRAY['boks']),

-- Finishing
('PROC-LAMI-001', 'Laminating Glossy', 'finishing', 'meter', 5000, 'Mesin Laminating', 500, ARRAY['offset', 'boks', 'roto']),
('PROC-LAMI-002', 'Laminating Doff', 'finishing', 'meter', 5500, 'Mesin Laminating', 500, ARRAY['offset', 'boks', 'roto']),
('PROC-PLONG-001', 'Plong Handle', 'finishing', '1000pcs', 150000, 'Mesin Plong', 3000, ARRAY['polos', 'offset'])
ON CONFLICT (code) DO NOTHING;

-- Finishing Options
INSERT INTO master.finishing_options (code, name, category, cost_type, cost_value, applicable_product_types) VALUES
('FIN-LAMI-001', 'Laminating Glossy', 'laminating', 'per_sqm', 5000, ARRAY['offset', 'boks', 'roto']),
('FIN-LAMI-002', 'Laminating Doff/Matte', 'laminating', 'per_sqm', 5500, ARRAY['offset', 'boks', 'roto']),
('FIN-UV-001', 'Spot UV', 'spot_uv', 'per_sqm', 8000, ARRAY['offset', 'boks']),
('FIN-EMBOSS-001', 'Emboss', 'emboss', 'per_setup', 500000, ARRAY['offset', 'boks']),
('FIN-HOTST-001', 'Hot Stamping Gold', 'hot_stamping', 'per_sqm', 15000, ARRAY['offset', 'boks']),
('FIN-HOTST-002', 'Hot Stamping Silver', 'hot_stamping', 'per_sqm', 12000, ARRAY['offset', 'boks']),
('FIN-PLONG-001', 'Plong Handle Tengah', 'handle', 'per_1000pcs', 150000, ARRAY['polos', 'offset']),
('FIN-PLONG-002', 'Plong Handle Samping', 'handle', 'per_1000pcs', 180000, ARRAY['polos', 'offset'])
ON CONFLICT (code) DO NOTHING;

-- =====================================================
-- COMMENTS
-- =====================================================

COMMENT ON TABLE master.material_types IS 'Master jenis bahan (plastik, karton, tinta, lem)';
COMMENT ON TABLE master.standard_sizes IS 'Master ukuran standar produk';
COMMENT ON TABLE master.production_processes IS 'Master proses produksi dengan biaya per unit';
COMMENT ON TABLE master.finishing_options IS 'Master opsi finishing dengan harga';

COMMENT ON TABLE sales.price_formulas_polos IS 'Formula harga untuk kantong plastik polos (tanpa cetak atau cetak simple)';
COMMENT ON TABLE sales.price_formulas_offset IS 'Formula harga untuk kantong plastik offset (full color printing)';
COMMENT ON TABLE sales.price_formulas_boks IS 'Formula harga untuk boks/kemasan karton';
COMMENT ON TABLE sales.price_formulas_roto IS 'Formula harga untuk produk rotogravure/flexo roll';
