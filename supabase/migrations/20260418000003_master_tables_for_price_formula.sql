-- =====================================================
-- MASTER TABLES FOR PRICE FORMULA
-- =====================================================
-- Master tables pendukung untuk 1 tabel price_formulas
-- yang sudah ada di sales schema
-- =====================================================

-- =====================================================
-- 1. MASTER: JENIS BAHAN (MATERIAL TYPES)
-- =====================================================
CREATE TABLE IF NOT EXISTS master.material_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(200) NOT NULL,
  category VARCHAR(50) NOT NULL, -- 'plastik', 'karton', 'tinta', 'lem', 'kertas'

  -- Unit & Price
  unit VARCHAR(50) NOT NULL, -- 'kg', 'meter', 'liter', 'pcs'
  standard_price DECIMAL(15,2), -- Harga standar per unit

  -- Properties (JSONB untuk fleksibilitas)
  properties JSONB, -- {"ketebalan_mikron": [60, 80, 100], "warna": ["putih", "transparan"]}

  -- Description
  description TEXT,

  -- Status
  is_active BOOLEAN DEFAULT true,

  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id)
);

-- Index
CREATE INDEX idx_material_types_category ON master.material_types(category);
CREATE INDEX idx_material_types_active ON master.material_types(is_active);
CREATE INDEX idx_material_types_code ON master.material_types(code);

-- =====================================================
-- 2. MASTER: UKURAN STANDAR
-- =====================================================
CREATE TABLE IF NOT EXISTS master.standard_sizes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(200) NOT NULL,

  -- Dimensions
  width DECIMAL(10,2), -- cm
  length DECIMAL(10,2), -- cm
  height DECIMAL(10,2), -- cm (untuk boks)

  -- Category
  category VARCHAR(50), -- 'kantong', 'boks', 'lembaran', 'roll'

  -- Common usage
  common_usage TEXT,

  -- Status
  is_active BOOLEAN DEFAULT true,

  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index
CREATE INDEX idx_standard_sizes_category ON master.standard_sizes(category);
CREATE INDEX idx_standard_sizes_active ON master.standard_sizes(is_active);

-- =====================================================
-- 3. MASTER: PROSES PRODUKSI
-- =====================================================
CREATE TABLE IF NOT EXISTS master.production_processes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(200) NOT NULL,
  category VARCHAR(50) NOT NULL, -- 'cetak', 'potong', 'lipat', 'lem', 'finishing'

  -- Cost calculation
  unit VARCHAR(50) NOT NULL, -- 'jam', 'meter', 'pcs', 'setup', 'sqm'
  cost_per_unit DECIMAL(15,2),

  -- Machine & capacity
  machine_required VARCHAR(200),
  capacity_per_hour INTEGER,

  -- Applicable to
  applicable_product_types VARCHAR[] DEFAULT ARRAY['polos', 'offset', 'boks', 'roto'],

  -- Description
  description TEXT,

  -- Status
  is_active BOOLEAN DEFAULT true,

  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id)
);

-- Index
CREATE INDEX idx_production_processes_category ON master.production_processes(category);
CREATE INDEX idx_production_processes_active ON master.production_processes(is_active);

-- =====================================================
-- 4. MASTER: FINISHING OPTIONS
-- =====================================================
CREATE TABLE IF NOT EXISTS master.finishing_options (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(200) NOT NULL,
  category VARCHAR(50) NOT NULL, -- 'laminating', 'emboss', 'spot_uv', 'die_cut', 'handle'

  -- Cost
  cost_type VARCHAR(50), -- 'per_sqm', 'per_pcs', 'per_setup', 'percentage', 'per_1000pcs'
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

-- Index
CREATE INDEX idx_finishing_options_category ON master.finishing_options(category);
CREATE INDEX idx_finishing_options_active ON master.finishing_options(is_active);

-- =====================================================
-- TRIGGERS
-- =====================================================

-- Create update_updated_at_column function if not exists
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Auto-update updated_at
CREATE TRIGGER update_material_types_updated_at
  BEFORE UPDATE ON master.material_types
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_production_processes_updated_at
  BEFORE UPDATE ON master.production_processes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_standard_sizes_updated_at
  BEFORE UPDATE ON master.standard_sizes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_finishing_options_updated_at
  BEFORE UPDATE ON master.finishing_options
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- SEED DATA
-- =====================================================

-- ==================== MATERIAL TYPES ====================

INSERT INTO master.material_types (code, name, category, unit, standard_price, properties, description) VALUES

-- PLASTIK
('MAT-PE-001', 'Plastik PE (Polyethylene)', 'plastik', 'kg', 25000,
  '{"ketebalan_mikron": [60, 80, 100, 120], "warna": ["bening", "putih susu", "hitam"], "density": "LDPE/HDPE"}'::jsonb,
  'Plastik PE untuk kantong plastik standar'),

('MAT-PP-001', 'Plastik PP (Polypropylene)', 'plastik', 'kg', 28000,
  '{"ketebalan_mikron": [60, 80, 100], "warna": ["bening", "putih"], "kekuatan": "lebih kuat dari PE"}'::jsonb,
  'Plastik PP untuk kantong dengan kekuatan lebih tinggi'),

('MAT-OPP-001', 'Plastik OPP (Oriented Polypropylene)', 'plastik', 'kg', 32000,
  '{"ketebalan_mikron": [20, 30, 40], "finishing": ["glossy", "matte"], "kejernihan": "sangat jernih"}'::jsonb,
  'Plastik OPP untuk kemasan dengan tampilan premium'),

('MAT-BOPP-001', 'BOPP (Biaxially Oriented Polypropylene)', 'plastik', 'kg', 35000,
  '{"ketebalan_mikron": [20, 25, 30], "tipe": ["transparent", "white", "metalized"], "barrier": "oksigen, air"}'::jsonb,
  'BOPP untuk kemasan makanan dengan barrier properties'),

('MAT-PET-001', 'PET (Polyethylene Terephthalate)', 'plastik', 'kg', 45000,
  '{"ketebalan_mikron": [12, 15, 20, 25], "transparansi": "excellent", "barrier": "gas, moisture"}'::jsonb,
  'PET untuk kemasan dengan barrier properties tinggi'),

-- KARTON
('MAT-DUPLEX-001', 'Karton Duplex', 'karton', 'kg', 15000,
  '{"gramasi": [250, 300, 350, 400], "tipe": ["grey back", "white back"], "permukaan": "coated"}'::jsonb,
  'Karton duplex untuk boks dengan permukaan yang bisa dicetak'),

('MAT-IVORY-001', 'Karton Ivory', 'karton', 'kg', 18000,
  '{"gramasi": [230, 250, 310, 400], "warna": "putih ivory", "kualitas": "premium"}'::jsonb,
  'Karton ivory berkualitas premium untuk boks high-end'),

('MAT-KRAFT-001', 'Karton Kraft', 'karton', 'kg', 12000,
  '{"gramasi": [150, 200, 250, 300], "warna": ["brown", "white"], "natural": "eco-friendly"}'::jsonb,
  'Karton kraft natural untuk boks dengan kesan eco-friendly'),

('MAT-CORR-001', 'Corrugated Board', 'karton', 'kg', 10000,
  '{"flute": ["B", "C", "E", "BC"], "wall": ["single", "double"], "kekuatan": "sangat kuat"}'::jsonb,
  'Corrugated board untuk boks dengan proteksi maksimal'),

-- TINTA
('INK-OFFSET-001', 'Tinta Offset CMYK', 'tinta', 'kg', 150000,
  '{"tipe": ["sheet fed", "web"], "warna": ["cyan", "magenta", "yellow", "black"], "basis": "oil/water"}'::jsonb,
  'Tinta untuk mesin cetak offset 4 warna'),

('INK-FLEXO-001', 'Tinta Flexo Water Based', 'tinta', 'kg', 120000,
  '{"series": ["economical", "premium"], "basis": "water", "drying": "fast"}'::jsonb,
  'Tinta flexo berbasis air untuk cetak kantong plastik'),

('INK-ROTO-001', 'Tinta Rotogravure Solvent', 'tinta', 'kg', 180000,
  '{"tipe": ["surface", "lamination"], "basis": "solvent", "brilliance": "high"}'::jsonb,
  'Tinta rotogravure untuk cetak berkualitas tinggi'),

-- LEM
('ADH-PAPER-001', 'Lem Kertas (Starch)', 'lem', 'kg', 15000,
  '{"tipe": "starch based", "aplikasi": "boks karton", "drying": "medium"}'::jsonb,
  'Lem berbasis starch untuk perekatan karton'),

('ADH-FOX-001', 'Lem Fox (PVAc)', 'lem', 'kg', 25000,
  '{"tipe": "PVAc", "kekuatan": "strong", "drying": "fast"}'::jsonb,
  'Lem fox untuk perekatan karton kekuatan tinggi'),

('ADH-LAMINATE-001', 'Adhesive Laminating', 'lem', 'kg', 85000,
  '{"tipe": ["solvent", "solventless", "water based"], "aplikasi": "laminating film"}'::jsonb,
  'Adhesive untuk proses laminating multi-layer')

ON CONFLICT (code) DO NOTHING;

-- ==================== STANDARD SIZES ====================

INSERT INTO master.standard_sizes (code, name, width, length, height, category, common_usage) VALUES

-- KANTONG PLASTIK
('SIZE-K-001', 'Kantong Kecil 15x20', 15, 20, NULL, 'kantong', 'Kantong snack, aksesoris kecil, kemasan retail'),
('SIZE-K-002', 'Kantong Sedang 20x30', 20, 30, NULL, 'kantong', 'Kantong baju, makanan, produk sedang'),
('SIZE-K-003', 'Kantong Besar 30x40', 30, 40, NULL, 'kantong', 'Kantong shopping, pakaian, kemasan umum'),
('SIZE-K-004', 'Kantong Jumbo 40x50', 40, 50, NULL, 'kantong', 'Kantong grosir, kemasan besar, industrial'),
('SIZE-K-005', 'Kantong Mini 10x15', 10, 15, NULL, 'kantong', 'Kantong perhiasan, aksesoris sangat kecil'),

-- BOKS KARTON
('SIZE-B-001', 'Boks Kecil 10x10x10', 10, 10, 10, 'boks', 'Boks produk kecil, kosmetik, perhiasan'),
('SIZE-B-002', 'Boks Sedang 20x20x15', 20, 20, 15, 'boks', 'Boks makanan, elektronik kecil, produk retail'),
('SIZE-B-003', 'Boks Besar 30x30x20', 30, 30, 20, 'boks', 'Boks sepatu, produk medium, gift box'),
('SIZE-B-004', 'Boks Jumbo 40x40x30', 40, 40, 30, 'boks', 'Boks pengiriman, produk besar, industrial'),
('SIZE-B-005', 'Boks Pizza 30x30x5', 30, 30, 5, 'boks', 'Boks pizza, makanan datar'),

-- ROLL
('SIZE-R-001', 'Roll Kecil 20cm', 20, NULL, NULL, 'roll', 'Roll film lebar 20cm untuk produk kecil'),
('SIZE-R-002', 'Roll Sedang 40cm', 40, NULL, NULL, 'roll', 'Roll film lebar 40cm untuk produk standard'),
('SIZE-R-003', 'Roll Besar 60cm', 60, NULL, NULL, 'roll', 'Roll film lebar 60cm untuk produk besar')

ON CONFLICT (code) DO NOTHING;

-- ==================== PRODUCTION PROCESSES ====================

INSERT INTO master.production_processes (code, name, category, unit, cost_per_unit, machine_required, capacity_per_hour, applicable_product_types, description) VALUES

-- CETAK
('PROC-PRINT-001', 'Printing Offset 1 Warna', 'cetak', 'jam', 200000, 'Mesin Offset 1 Warna', 5000, ARRAY['offset'],
  'Cetak offset 1 warna untuk desain simple'),

('PROC-PRINT-002', 'Printing Offset 2 Warna', 'cetak', 'jam', 350000, 'Mesin Offset 2 Warna', 4000, ARRAY['offset'],
  'Cetak offset 2 warna untuk desain dengan 2 warna spot'),

('PROC-PRINT-003', 'Printing Offset 4 Warna CMYK', 'cetak', 'jam', 500000, 'Mesin Offset 4 Warna', 3000, ARRAY['offset'],
  'Cetak offset full color CMYK untuk desain kompleks'),

('PROC-PRINT-004', 'Printing Flexo', 'cetak', 'jam', 300000, 'Mesin Flexo', 8000, ARRAY['polos', 'offset'],
  'Cetak flexo untuk kantong plastik dengan volume tinggi'),

('PROC-PRINT-005', 'Printing Rotogravure', 'cetak', 'jam', 800000, 'Mesin Rotogravure', 10000, ARRAY['roto'],
  'Cetak rotogravure berkualitas tinggi untuk volume besar'),

-- POTONG
('PROC-CUT-001', 'Potong Manual', 'potong', 'jam', 100000, 'Manual/Gunting', 2000, ARRAY['polos', 'offset', 'boks'],
  'Potong manual untuk volume kecil'),

('PROC-CUT-002', 'Potong Mesin', 'potong', 'jam', 150000, 'Mesin Potong Otomatis', 5000, ARRAY['polos', 'offset', 'boks'],
  'Potong dengan mesin otomatis untuk efisiensi'),

('PROC-CUT-003', 'Die Cutting', 'potong', 'jam', 250000, 'Mesin Die Cut', 3000, ARRAY['boks'],
  'Die cutting untuk boks dengan bentuk khusus'),

('PROC-CUT-004', 'Slitting (Potong Roll)', 'potong', 'jam', 200000, 'Mesin Slitting', 5000, ARRAY['roto'],
  'Slitting untuk memotong roll menjadi lebar yang diinginkan'),

-- LIPAT & LEM
('PROC-FOLD-001', 'Lipat Manual', 'lipat', 'jam', 80000, 'Manual', 1000, ARRAY['boks'],
  'Lipat manual untuk boks volume kecil'),

('PROC-FOLD-002', 'Lipat Mesin', 'lipat', 'jam', 120000, 'Mesin Folder Gluer', 3000, ARRAY['boks'],
  'Lipat dengan mesin untuk efisiensi tinggi'),

('PROC-GLUE-001', 'Lem Manual', 'lem', 'jam', 100000, 'Manual', 1500, ARRAY['boks'],
  'Perekatan manual untuk boks custom'),

('PROC-GLUE-002', 'Lem Mesin (Folder Gluer)', 'lem', 'jam', 200000, 'Folder Gluer', 5000, ARRAY['boks'],
  'Perekatan otomatis dengan folder gluer'),

-- FINISHING
('PROC-LAMI-001', 'Laminating Glossy', 'finishing', 'sqm', 5000, 'Mesin Laminating', 500, ARRAY['offset', 'boks', 'roto'],
  'Laminating glossy untuk tampilan mengkilap'),

('PROC-LAMI-002', 'Laminating Doff', 'finishing', 'sqm', 5500, 'Mesin Laminating', 500, ARRAY['offset', 'boks', 'roto'],
  'Laminating doff untuk tampilan elegant'),

('PROC-PLONG-001', 'Plong Handle', 'finishing', '1000pcs', 150000, 'Mesin Plong', 3000, ARRAY['polos', 'offset'],
  'Plong untuk membuat handle pada kantong'),

('PROC-SCORING-001', 'Scoring (Garis Lipat)', 'finishing', 'jam', 100000, 'Mesin Scoring', 4000, ARRAY['boks'],
  'Scoring untuk membuat garis lipat pada boks')

ON CONFLICT (code) DO NOTHING;

-- ==================== FINISHING OPTIONS ====================

INSERT INTO master.finishing_options (code, name, category, cost_type, cost_value, applicable_product_types, description) VALUES

-- LAMINATING
('FIN-LAMI-001', 'Laminating Glossy', 'laminating', 'per_sqm', 5000, ARRAY['offset', 'boks', 'roto'],
  'Laminating glossy untuk permukaan mengkilap'),

('FIN-LAMI-002', 'Laminating Doff/Matte', 'laminating', 'per_sqm', 5500, ARRAY['offset', 'boks', 'roto'],
  'Laminating doff untuk permukaan matte elegant'),

('FIN-LAMI-003', 'Laminating Soft Touch', 'laminating', 'per_sqm', 8000, ARRAY['offset', 'boks'],
  'Laminating soft touch untuk tekstur lembut premium'),

-- SPOT UV
('FIN-UV-001', 'Spot UV', 'spot_uv', 'per_sqm', 8000, ARRAY['offset', 'boks'],
  'Spot UV untuk efek mengkilap pada area tertentu'),

('FIN-UV-002', 'Full UV Coating', 'spot_uv', 'per_sqm', 6000, ARRAY['offset', 'boks'],
  'UV coating penuh untuk proteksi dan kilap'),

-- EMBOSS
('FIN-EMBOSS-001', 'Emboss', 'emboss', 'per_setup', 500000, ARRAY['offset', 'boks'],
  'Emboss untuk efek timbul pada logo/teks'),

('FIN-DEBOSS-001', 'Deboss', 'emboss', 'per_setup', 500000, ARRAY['offset', 'boks'],
  'Deboss untuk efek cekungan pada logo/teks'),

-- HOT STAMPING
('FIN-HOTST-001', 'Hot Stamping Gold', 'hot_stamping', 'per_sqm', 15000, ARRAY['offset', 'boks'],
  'Hot stamping foil emas untuk kesan mewah'),

('FIN-HOTST-002', 'Hot Stamping Silver', 'hot_stamping', 'per_sqm', 12000, ARRAY['offset', 'boks'],
  'Hot stamping foil silver untuk kesan premium'),

('FIN-HOTST-003', 'Hot Stamping Hologram', 'hot_stamping', 'per_sqm', 20000, ARRAY['offset', 'boks'],
  'Hot stamping hologram untuk anti-pemalsuan'),

-- HANDLE/PLONG
('FIN-PLONG-001', 'Plong Handle Tengah', 'handle', 'per_1000pcs', 150000, ARRAY['polos', 'offset'],
  'Plong handle di posisi tengah kantong'),

('FIN-PLONG-002', 'Plong Handle Samping', 'handle', 'per_1000pcs', 180000, ARRAY['polos', 'offset'],
  'Plong handle di posisi samping kantong'),

('FIN-HANDLE-001', 'Handle Tarik Pita', 'handle', 'per_1000pcs', 200000, ARRAY['polos', 'offset'],
  'Handle tarik dengan pita'),

-- DIE CUT
('FIN-DIECUT-001', 'Die Cut Custom', 'die_cut', 'per_setup', 800000, ARRAY['boks'],
  'Die cut custom untuk bentuk boks khusus'),

('FIN-WINDOW-001', 'Window PVC Transparan', 'die_cut', 'per_1000pcs', 300000, ARRAY['boks'],
  'Jendela PVC transparan pada boks')

ON CONFLICT (code) DO NOTHING;

-- =====================================================
-- COMMENTS
-- =====================================================

COMMENT ON TABLE master.material_types IS 'Master jenis bahan (plastik, karton, tinta, lem) dengan properties JSONB';
COMMENT ON TABLE master.standard_sizes IS 'Master ukuran standar produk kemasan (kantong, boks, roll)';
COMMENT ON TABLE master.production_processes IS 'Master proses produksi dengan biaya per unit dan kapasitas mesin';
COMMENT ON TABLE master.finishing_options IS 'Master opsi finishing dengan berbagai tipe biaya';

COMMENT ON COLUMN master.material_types.properties IS 'JSONB properties untuk fleksibilitas spesifikasi material';
COMMENT ON COLUMN master.production_processes.applicable_product_types IS 'Array jenis produk yang bisa menggunakan proses ini';
COMMENT ON COLUMN master.finishing_options.cost_type IS 'Tipe biaya: per_sqm, per_pcs, per_setup, percentage, per_1000pcs';
