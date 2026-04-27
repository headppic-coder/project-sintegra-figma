-- Migration: Seed Product Types
-- Description: Insert initial data untuk product types
-- Created: 2026-04-20

-- =====================================================
-- MASTER: PRODUCT TYPES
-- =====================================================

INSERT INTO master.product_types (code, name, notes) VALUES
('POLOS', 'Polos', 'Produk kemasan polos tanpa cetak atau dengan cetak minimal'),
('OFFSET', 'Offset', 'Produk dengan cetak offset (kantong dengan cetak, dll)'),
('BOKS', 'Boks', 'Produk kemasan boks/karton'),
('ROTO', 'Roto', 'Produk dengan cetak rotogravure (roll, standing pouch, dll)')
ON CONFLICT (code) DO NOTHING;

-- Add more detailed product types for better categorization
INSERT INTO master.product_types (code, name, notes) VALUES
('KANTONG-PE', 'Kantong PE', 'Kantong plastik PE (Polyethylene) standar'),
('KANTONG-PP', 'Kantong PP', 'Kantong plastik PP (Polypropylene)'),
('KANTONG-OPP', 'Kantong OPP', 'Kantong plastik OPP (Oriented Polypropylene)'),
('STANDING-POUCH', 'Standing Pouch', 'Standing pouch dengan berbagai material'),
('BOKS-KARTON', 'Boks Karton', 'Boks dari bahan karton (duplex, ivory, kraft)'),
('BOKS-CORRUGATED', 'Boks Corrugated', 'Boks dari corrugated board'),
('ROLL-FILM', 'Roll Film', 'Roll film plastik untuk packaging')
ON CONFLICT (code) DO NOTHING;

COMMENT ON TABLE master.product_types IS 'Master jenis produk untuk formula harga dan quotation';
