-- Seed Data
-- Migration: Insert initial/sample data

-- Master: Categories
INSERT INTO master.categories (name, type, description) VALUES
  ('Film Plastik', 'material', 'Various types of plastic films'),
  ('Adhesive', 'material', 'Adhesive materials for lamination'),
  ('Tinta', 'material', 'Printing inks'),
  ('Biaya Proses', 'process', 'Production process costs'),
  ('Biaya Overhead', 'process', 'Overhead costs'),
  ('Packaging Product', 'product', 'Finished packaging products');

-- Master: Process Costs
INSERT INTO master.process_costs (code, process_name, category, cost_per_unit, unit, description) VALUES
  ('PROC-001', 'Printing - 4 Warna', 'BIAYA PROSES', 150000, 'job', 'Biaya printing untuk 4 warna'),
  ('PROC-002', 'Printing - 6 Warna', 'BIAYA PROSES', 200000, 'job', 'Biaya printing untuk 6 warna'),
  ('PROC-003', 'Laminating', 'BIAYA PROSES', 100000, 'job', 'Biaya laminating'),
  ('PROC-004', 'Slitting', 'BIAYA PROSES', 75000, 'job', 'Biaya slitting/potong'),
  ('PROC-005', 'Sealing', 'BIAYA PROSES', 50000, 'job', 'Biaya sealing'),
  ('PROC-006', 'Quality Check', 'BIAYA PROSES', 25000, 'job', 'Biaya quality control'),
  ('OVHD-001', 'Listrik', 'BIAYA OVERHEAD', 500000, 'bulan', 'Biaya listrik per bulan'),
  ('OVHD-002', 'Maintenance Mesin', 'BIAYA OVERHEAD', 300000, 'bulan', 'Biaya maintenance mesin'),
  ('OVHD-003', 'Gaji Operator', 'BIAYA OVERHEAD', 5000000, 'bulan', 'Biaya gaji operator');

-- Master: Materials (Sample materials)
INSERT INTO master.materials (code, name, category_id, type, unit, specification, standard_cost) VALUES
  ('MAT-FILM-001', 'BOPP Film 20 Micron', (SELECT id FROM master.categories WHERE name = 'Film Plastik'), 'film', 'meter', '{"micron": 20, "width": 1000}', 15000),
  ('MAT-FILM-002', 'BOPP Film 30 Micron', (SELECT id FROM master.categories WHERE name = 'Film Plastik'), 'film', 'meter', '{"micron": 30, "width": 1000}', 18000),
  ('MAT-FILM-003', 'PET Film 12 Micron', (SELECT id FROM master.categories WHERE name = 'Film Plastik'), 'film', 'meter', '{"micron": 12, "width": 1000}', 22000),
  ('MAT-FILM-004', 'PE Film 50 Micron', (SELECT id FROM master.categories WHERE name = 'Film Plastik'), 'film', 'meter', '{"micron": 50, "width": 1000}', 12000),
  ('MAT-ADH-001', 'Adhesive Solvent', (SELECT id FROM master.categories WHERE name = 'Adhesive'), 'adhesive', 'kg', '{"type": "solvent"}', 85000),
  ('MAT-ADH-002', 'Adhesive Solventless', (SELECT id FROM master.categories WHERE name = 'Adhesive'), 'adhesive', 'kg', '{"type": "solventless"}', 95000),
  ('MAT-ADH-003', 'Adhesive Water Base', (SELECT id FROM master.categories WHERE name = 'Adhesive'), 'adhesive', 'kg', '{"type": "water_base"}', 75000),
  ('MAT-INK-001', 'Tinta Cyan', (SELECT id FROM master.categories WHERE name = 'Tinta'), 'ink', 'kg', '{"color": "cyan"}', 120000),
  ('MAT-INK-002', 'Tinta Magenta', (SELECT id FROM master.categories WHERE name = 'Tinta'), 'ink', 'kg', '{"color": "magenta"}', 120000),
  ('MAT-INK-003', 'Tinta Yellow', (SELECT id FROM master.categories WHERE name = 'Tinta'), 'ink', 'kg', '{"color": "yellow"}', 120000),
  ('MAT-INK-004', 'Tinta Black', (SELECT id FROM master.categories WHERE name = 'Tinta'), 'ink', 'kg', '{"color": "black"}', 120000);

-- Master: Product Types
INSERT INTO master.product_types (code, name, category, default_specs) VALUES
  ('PROD-POLOS', 'Kemasan Plastik Polos', 'polos', '{"has_zipper": false, "layers": 1}'),
  ('PROD-OFFSET', 'Kemasan Plastik Offset Print', 'offset', '{"print_colors": 4, "layers": 1}'),
  ('PROD-BOKS', 'Kemasan Plastik Boks', 'boks', '{"has_zipper": false, "layers": 1}'),
  ('PROD-ROTO', 'Kemasan Plastik Roto Print', 'roto', '{"print_colors": 6, "layers": 2}');

-- Master: Settings
INSERT INTO master.settings (key, value, description, category) VALUES
  ('default_tax_rate', '11', 'Default PPN rate in percentage', 'pricing'),
  ('default_margin', '{"min": 15, "max": 30}', 'Default margin range in percentage', 'pricing'),
  ('currency', '"IDR"', 'Default currency', 'general'),
  ('company_name', '"PT. Packaging Indonesia"', 'Company name', 'general'),
  ('company_address', '"Jl. Industri No. 123, Jakarta"', 'Company address', 'general');

-- Inventory: Warehouses
INSERT INTO inventory.warehouses (code, name, address) VALUES
  ('WH-01', 'Gudang Utama', 'Jl. Raya Industri No. 1, Jakarta'),
  ('WH-02', 'Gudang Bahan Baku', 'Jl. Raya Industri No. 2, Jakarta'),
  ('WH-03', 'Gudang Finished Goods', 'Jl. Raya Industri No. 3, Jakarta');

-- Inventory: Initial Stock (sample)
INSERT INTO inventory.stock (material_id, warehouse_id, quantity, unit, min_stock_level, max_stock_level, reorder_point) VALUES
  ((SELECT id FROM master.materials WHERE code = 'MAT-FILM-001'), (SELECT id FROM inventory.warehouses WHERE code = 'WH-02'), 5000, 'meter', 1000, 10000, 2000),
  ((SELECT id FROM master.materials WHERE code = 'MAT-FILM-002'), (SELECT id FROM inventory.warehouses WHERE code = 'WH-02'), 3000, 'meter', 1000, 8000, 1500),
  ((SELECT id FROM master.materials WHERE code = 'MAT-FILM-003'), (SELECT id FROM inventory.warehouses WHERE code = 'WH-02'), 2000, 'meter', 500, 5000, 1000),
  ((SELECT id FROM master.materials WHERE code = 'MAT-FILM-004'), (SELECT id FROM inventory.warehouses WHERE code = 'WH-02'), 4000, 'meter', 1000, 10000, 2000),
  ((SELECT id FROM master.materials WHERE code = 'MAT-ADH-001'), (SELECT id FROM inventory.warehouses WHERE code = 'WH-02'), 500, 'kg', 100, 1000, 200),
  ((SELECT id FROM master.materials WHERE code = 'MAT-ADH-002'), (SELECT id FROM inventory.warehouses WHERE code = 'WH-02'), 400, 'kg', 100, 1000, 200),
  ((SELECT id FROM master.materials WHERE code = 'MAT-INK-001'), (SELECT id FROM inventory.warehouses WHERE code = 'WH-02'), 200, 'kg', 50, 500, 100),
  ((SELECT id FROM master.materials WHERE code = 'MAT-INK-002'), (SELECT id FROM inventory.warehouses WHERE code = 'WH-02'), 200, 'kg', 50, 500, 100),
  ((SELECT id FROM master.materials WHERE code = 'MAT-INK-003'), (SELECT id FROM inventory.warehouses WHERE code = 'WH-02'), 200, 'kg', 50, 500, 100),
  ((SELECT id FROM master.materials WHERE code = 'MAT-INK-004'), (SELECT id FROM inventory.warehouses WHERE code = 'WH-02'), 250, 'kg', 50, 500, 100);

-- Production: Machines
INSERT INTO production.machines (code, name, type, capacity, capacity_unit, hourly_rate, status) VALUES
  ('MACH-001', 'Mesin Printing Rotogravure 1', 'printing', 1000, 'meter/hour', 500000, 'available'),
  ('MACH-002', 'Mesin Printing Offset 1', 'printing', 800, 'meter/hour', 400000, 'available'),
  ('MACH-003', 'Mesin Laminating 1', 'laminating', 1200, 'meter/hour', 350000, 'available'),
  ('MACH-004', 'Mesin Slitting 1', 'slitting', 1500, 'meter/hour', 250000, 'available'),
  ('MACH-005', 'Mesin Sealing 1', 'sealing', 2000, 'pcs/hour', 200000, 'available');

-- Finance: Chart of Accounts (Basic)
INSERT INTO finance.accounts (account_code, account_name, account_type, level) VALUES
  ('1000', 'ASET', 'asset', 1),
  ('1100', 'Kas dan Bank', 'asset', 2),
  ('1200', 'Piutang Usaha', 'asset', 2),
  ('1300', 'Persediaan', 'asset', 2),
  ('2000', 'LIABILITAS', 'liability', 1),
  ('2100', 'Hutang Usaha', 'liability', 2),
  ('2200', 'Hutang Pajak', 'liability', 2),
  ('3000', 'EKUITAS', 'equity', 1),
  ('3100', 'Modal', 'equity', 2),
  ('4000', 'PENDAPATAN', 'revenue', 1),
  ('4100', 'Pendapatan Penjualan', 'revenue', 2),
  ('5000', 'BEBAN', 'expense', 1),
  ('5100', 'Harga Pokok Penjualan', 'expense', 2),
  ('5200', 'Biaya Operasional', 'expense', 2);

-- Update parent_account_id
UPDATE finance.accounts SET parent_account_id = (SELECT id FROM finance.accounts WHERE account_code = '1000') WHERE account_code IN ('1100', '1200', '1300');
UPDATE finance.accounts SET parent_account_id = (SELECT id FROM finance.accounts WHERE account_code = '2000') WHERE account_code IN ('2100', '2200');
UPDATE finance.accounts SET parent_account_id = (SELECT id FROM finance.accounts WHERE account_code = '3000') WHERE account_code = '3100';
UPDATE finance.accounts SET parent_account_id = (SELECT id FROM finance.accounts WHERE account_code = '4000') WHERE account_code = '4100';
UPDATE finance.accounts SET parent_account_id = (SELECT id FROM finance.accounts WHERE account_code = '5000') WHERE account_code IN ('5100', '5200');

COMMENT ON TABLE master.categories IS 'Seed data: Categories for organizing materials, products, and processes';
COMMENT ON TABLE master.materials IS 'Seed data: Sample materials with specifications and costs';
COMMENT ON TABLE master.process_costs IS 'Seed data: Standard process costs for manufacturing';
COMMENT ON TABLE inventory.warehouses IS 'Seed data: Default warehouses';
COMMENT ON TABLE production.machines IS 'Seed data: Production machines with capacity and rates';
