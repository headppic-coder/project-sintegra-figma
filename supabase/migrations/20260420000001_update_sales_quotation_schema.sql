-- Migration: Update Sales Quotation Schema
-- Description: Update tabel quotations dan quotation_items untuk mendukung form penawaran baru
-- Created: 2026-04-20

-- Update customers table - add accurate_id if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'sales'
    AND table_name = 'customers'
    AND column_name = 'accurate_id'
  ) THEN
    ALTER TABLE sales.customers ADD COLUMN accurate_id VARCHAR(50);
    CREATE INDEX idx_customers_accurate_id ON sales.customers(accurate_id);
  END IF;
END $$;

-- Update quotations table - add additional fields
DO $$
BEGIN
  -- Add sales_person field if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'sales'
    AND table_name = 'quotations'
    AND column_name = 'sales_person'
  ) THEN
    ALTER TABLE sales.quotations ADD COLUMN sales_person VARCHAR(200);
  END IF;

  -- Add catatan field if not exists (separate from notes)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'sales'
    AND table_name = 'quotations'
    AND column_name = 'catatan'
  ) THEN
    ALTER TABLE sales.quotations ADD COLUMN catatan TEXT;
  END IF;

  -- Add job_type field if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'sales'
    AND table_name = 'quotations'
    AND column_name = 'job_type'
  ) THEN
    ALTER TABLE sales.quotations ADD COLUMN job_type VARCHAR(50) DEFAULT 'Order';
  END IF;

  -- Add npwp field if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'sales'
    AND table_name = 'quotations'
    AND column_name = 'npwp'
  ) THEN
    ALTER TABLE sales.quotations ADD COLUMN npwp VARCHAR(50);
  END IF;

  -- Add dp_percentage field if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'sales'
    AND table_name = 'quotations'
    AND column_name = 'dp_percentage'
  ) THEN
    ALTER TABLE sales.quotations ADD COLUMN dp_percentage DECIMAL(5,2) DEFAULT 0;
  END IF;

  -- Add pembayaran field if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'sales'
    AND table_name = 'quotations'
    AND column_name = 'pembayaran'
  ) THEN
    ALTER TABLE sales.quotations ADD COLUMN pembayaran VARCHAR(100);
  END IF;

  -- Add ppn_type field if not exists (Inc/Exc)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'sales'
    AND table_name = 'quotations'
    AND column_name = 'ppn_type'
  ) THEN
    ALTER TABLE sales.quotations ADD COLUMN ppn_type VARCHAR(10) DEFAULT 'Inc';
  END IF;

  -- Add mode_alamat field if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'sales'
    AND table_name = 'quotations'
    AND column_name = 'mode_alamat'
  ) THEN
    ALTER TABLE sales.quotations ADD COLUMN mode_alamat VARCHAR(50);
  END IF;

  -- Add alamat_manual field if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'sales'
    AND table_name = 'quotations'
    AND column_name = 'alamat_manual'
  ) THEN
    ALTER TABLE sales.quotations ADD COLUMN alamat_manual TEXT;
  END IF;

  -- Add jenis_order field if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'sales'
    AND table_name = 'quotations'
    AND column_name = 'jenis_order'
  ) THEN
    ALTER TABLE sales.quotations ADD COLUMN jenis_order VARCHAR(50);
  END IF;

  -- Add biaya_lain field if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'sales'
    AND table_name = 'quotations'
    AND column_name = 'biaya_lain'
  ) THEN
    ALTER TABLE sales.quotations ADD COLUMN biaya_lain DECIMAL(15,2) DEFAULT 0;
  END IF;
END $$;

-- Update quotation_items table - restructure for new form
DO $$
BEGIN
  -- Add nama_item field if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'sales'
    AND table_name = 'quotation_items'
    AND column_name = 'nama_item'
  ) THEN
    ALTER TABLE sales.quotation_items ADD COLUMN nama_item VARCHAR(200);
  END IF;

  -- Add deskripsi field if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'sales'
    AND table_name = 'quotation_items'
    AND column_name = 'deskripsi'
  ) THEN
    ALTER TABLE sales.quotation_items ADD COLUMN deskripsi TEXT;
  END IF;

  -- Add qty field if not exists (different from quantity)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'sales'
    AND table_name = 'quotation_items'
    AND column_name = 'qty'
  ) THEN
    ALTER TABLE sales.quotation_items ADD COLUMN qty INTEGER;
  END IF;

  -- Add satuan field if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'sales'
    AND table_name = 'quotation_items'
    AND column_name = 'satuan'
  ) THEN
    ALTER TABLE sales.quotation_items ADD COLUMN satuan VARCHAR(50);
  END IF;

  -- Add harga_satuan field if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'sales'
    AND table_name = 'quotation_items'
    AND column_name = 'harga_satuan'
  ) THEN
    ALTER TABLE sales.quotation_items ADD COLUMN harga_satuan DECIMAL(15,2);
  END IF;

  -- Add diskon field if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'sales'
    AND table_name = 'quotation_items'
    AND column_name = 'diskon'
  ) THEN
    ALTER TABLE sales.quotation_items ADD COLUMN diskon DECIMAL(15,2) DEFAULT 0;
  END IF;

  -- Add total_harga field if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'sales'
    AND table_name = 'quotation_items'
    AND column_name = 'total_harga'
  ) THEN
    ALTER TABLE sales.quotation_items ADD COLUMN total_harga DECIMAL(15,2);
  END IF;
END $$;

-- Add comments for new fields
COMMENT ON COLUMN sales.customers.accurate_id IS 'ID customer dari sistem Accurate';
COMMENT ON COLUMN sales.quotations.sales_person IS 'Nama sales person yang handle penawaran';
COMMENT ON COLUMN sales.quotations.catatan IS 'Catatan tambahan untuk penawaran';
COMMENT ON COLUMN sales.quotations.job_type IS 'Tipe pekerjaan: Order atau Quotation';
COMMENT ON COLUMN sales.quotations.npwp IS 'Nomor NPWP customer';
COMMENT ON COLUMN sales.quotations.dp_percentage IS 'Persentase DP yang diminta';
COMMENT ON COLUMN sales.quotations.pembayaran IS 'Metode pembayaran';
COMMENT ON COLUMN sales.quotations.ppn_type IS 'Tipe PPN: Inc (inclusive) atau Exc (exclusive)';
COMMENT ON COLUMN sales.quotations.mode_alamat IS 'Mode alamat pengiriman: Manual atau Auto';
COMMENT ON COLUMN sales.quotations.alamat_manual IS 'Alamat pengiriman manual';
COMMENT ON COLUMN sales.quotations.jenis_order IS 'Jenis order: Offset, Polos, Boks, Roto';
COMMENT ON COLUMN sales.quotations.biaya_lain IS 'Biaya tambahan lain-lain';

COMMENT ON COLUMN sales.quotation_items.nama_item IS 'Nama item produk';
COMMENT ON COLUMN sales.quotation_items.deskripsi IS 'Deskripsi detail item';
COMMENT ON COLUMN sales.quotation_items.qty IS 'Quantity item';
COMMENT ON COLUMN sales.quotation_items.satuan IS 'Satuan item (Pcs, Box, Kg, dll)';
COMMENT ON COLUMN sales.quotation_items.harga_satuan IS 'Harga per satuan';
COMMENT ON COLUMN sales.quotation_items.diskon IS 'Nominal diskon untuk item';
COMMENT ON COLUMN sales.quotation_items.total_harga IS 'Total harga setelah diskon';

-- Create function to auto-generate quotation number
CREATE OR REPLACE FUNCTION sales.generate_quotation_number()
RETURNS TRIGGER AS $$
DECLARE
  new_number VARCHAR(50);
  current_year VARCHAR(4);
  current_month VARCHAR(2);
  sequence_num INTEGER;
BEGIN
  -- Format: SQ.YYYY.MM.XXXXX
  current_year := TO_CHAR(CURRENT_DATE, 'YYYY');
  current_month := TO_CHAR(CURRENT_DATE, 'MM');

  -- Get the next sequence number for current month
  SELECT COALESCE(MAX(CAST(SUBSTRING(quotation_number FROM 12) AS INTEGER)), 0) + 1
  INTO sequence_num
  FROM sales.quotations
  WHERE quotation_number LIKE 'SQ.' || current_year || '.' || current_month || '.%';

  -- Generate the new number
  new_number := 'SQ.' || current_year || '.' || current_month || '.' || LPAD(sequence_num::TEXT, 5, '0');

  NEW.quotation_number := new_number;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-generate quotation number if not provided
DROP TRIGGER IF EXISTS trigger_generate_quotation_number ON sales.quotations;
CREATE TRIGGER trigger_generate_quotation_number
  BEFORE INSERT ON sales.quotations
  FOR EACH ROW
  WHEN (NEW.quotation_number IS NULL OR NEW.quotation_number = '')
  EXECUTE FUNCTION sales.generate_quotation_number();

-- Add check constraints
ALTER TABLE sales.quotations DROP CONSTRAINT IF EXISTS check_ppn_type;
ALTER TABLE sales.quotations ADD CONSTRAINT check_ppn_type
  CHECK (ppn_type IN ('Inc', 'Exc'));

ALTER TABLE sales.quotations DROP CONSTRAINT IF EXISTS check_mode_alamat;
ALTER TABLE sales.quotations ADD CONSTRAINT check_mode_alamat
  CHECK (mode_alamat IN ('Manual', 'Auto') OR mode_alamat IS NULL);

ALTER TABLE sales.quotations DROP CONSTRAINT IF EXISTS check_jenis_order;
ALTER TABLE sales.quotations ADD CONSTRAINT check_jenis_order
  CHECK (jenis_order IN ('Offset', 'Polos', 'Boks', 'Roto') OR jenis_order IS NULL);

-- Grant permissions
GRANT SELECT, INSERT, UPDATE ON sales.quotations TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON sales.quotation_items TO authenticated;
