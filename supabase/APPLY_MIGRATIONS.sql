-- =====================================================
-- APPLY ALL MIGRATIONS FOR QUOTATION FEATURE
-- =====================================================
-- File ini menggabungkan semua migration yang diperlukan
-- untuk fitur quotation form baru
--
-- CARA MENGGUNAKAN:
-- 1. Buka Supabase Dashboard
-- 2. Pilih SQL Editor
-- 3. Copy paste semua isi file ini
-- 4. Run query
-- =====================================================

-- =====================================================
-- PART 1: UPDATE CUSTOMERS TABLE
-- =====================================================

-- Add accurate_id field to customers table
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
    COMMENT ON COLUMN sales.customers.accurate_id IS 'ID customer dari sistem Accurate';
  END IF;
END $$;

-- =====================================================
-- PART 2: UPDATE QUOTATIONS TABLE
-- =====================================================

-- Add sales_person field
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'sales' AND table_name = 'quotations' AND column_name = 'sales_person'
  ) THEN
    ALTER TABLE sales.quotations ADD COLUMN sales_person VARCHAR(200);
    COMMENT ON COLUMN sales.quotations.sales_person IS 'Nama sales person yang handle penawaran';
  END IF;
END $$;

-- Add catatan field
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'sales' AND table_name = 'quotations' AND column_name = 'catatan'
  ) THEN
    ALTER TABLE sales.quotations ADD COLUMN catatan TEXT;
    COMMENT ON COLUMN sales.quotations.catatan IS 'Catatan tambahan untuk penawaran';
  END IF;
END $$;

-- Add job_type field
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'sales' AND table_name = 'quotations' AND column_name = 'job_type'
  ) THEN
    ALTER TABLE sales.quotations ADD COLUMN job_type VARCHAR(50) DEFAULT 'Order';
    COMMENT ON COLUMN sales.quotations.job_type IS 'Tipe pekerjaan: Order atau Quotation';
  END IF;
END $$;

-- Add npwp field
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'sales' AND table_name = 'quotations' AND column_name = 'npwp'
  ) THEN
    ALTER TABLE sales.quotations ADD COLUMN npwp VARCHAR(50);
    COMMENT ON COLUMN sales.quotations.npwp IS 'Nomor NPWP customer';
  END IF;
END $$;

-- Add dp_percentage field
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'sales' AND table_name = 'quotations' AND column_name = 'dp_percentage'
  ) THEN
    ALTER TABLE sales.quotations ADD COLUMN dp_percentage DECIMAL(5,2) DEFAULT 0;
    COMMENT ON COLUMN sales.quotations.dp_percentage IS 'Persentase DP yang diminta';
  END IF;
END $$;

-- Add pembayaran field
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'sales' AND table_name = 'quotations' AND column_name = 'pembayaran'
  ) THEN
    ALTER TABLE sales.quotations ADD COLUMN pembayaran VARCHAR(100);
    COMMENT ON COLUMN sales.quotations.pembayaran IS 'Metode pembayaran';
  END IF;
END $$;

-- Add ppn_type field
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'sales' AND table_name = 'quotations' AND column_name = 'ppn_type'
  ) THEN
    ALTER TABLE sales.quotations ADD COLUMN ppn_type VARCHAR(10) DEFAULT 'Inc';
    COMMENT ON COLUMN sales.quotations.ppn_type IS 'Tipe PPN: Inc (inclusive) atau Exc (exclusive)';
  END IF;
END $$;

-- Add mode_alamat field
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'sales' AND table_name = 'quotations' AND column_name = 'mode_alamat'
  ) THEN
    ALTER TABLE sales.quotations ADD COLUMN mode_alamat VARCHAR(50);
    COMMENT ON COLUMN sales.quotations.mode_alamat IS 'Mode alamat pengiriman: Manual atau Auto';
  END IF;
END $$;

-- Add alamat_manual field
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'sales' AND table_name = 'quotations' AND column_name = 'alamat_manual'
  ) THEN
    ALTER TABLE sales.quotations ADD COLUMN alamat_manual TEXT;
    COMMENT ON COLUMN sales.quotations.alamat_manual IS 'Alamat pengiriman manual';
  END IF;
END $$;

-- Add jenis_order field
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'sales' AND table_name = 'quotations' AND column_name = 'jenis_order'
  ) THEN
    ALTER TABLE sales.quotations ADD COLUMN jenis_order VARCHAR(50);
    COMMENT ON COLUMN sales.quotations.jenis_order IS 'Jenis order: Offset, Polos, Boks, Roto';
  END IF;
END $$;

-- Add biaya_lain field
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'sales' AND table_name = 'quotations' AND column_name = 'biaya_lain'
  ) THEN
    ALTER TABLE sales.quotations ADD COLUMN biaya_lain DECIMAL(15,2) DEFAULT 0;
    COMMENT ON COLUMN sales.quotations.biaya_lain IS 'Biaya tambahan lain-lain';
  END IF;
END $$;

-- =====================================================
-- PART 3: UPDATE QUOTATION_ITEMS TABLE
-- =====================================================

-- Add nama_item field
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'sales' AND table_name = 'quotation_items' AND column_name = 'nama_item'
  ) THEN
    ALTER TABLE sales.quotation_items ADD COLUMN nama_item VARCHAR(200);
    COMMENT ON COLUMN sales.quotation_items.nama_item IS 'Nama item produk';
  END IF;
END $$;

-- Add deskripsi field
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'sales' AND table_name = 'quotation_items' AND column_name = 'deskripsi'
  ) THEN
    ALTER TABLE sales.quotation_items ADD COLUMN deskripsi TEXT;
    COMMENT ON COLUMN sales.quotation_items.deskripsi IS 'Deskripsi detail item';
  END IF;
END $$;

-- Add qty field
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'sales' AND table_name = 'quotation_items' AND column_name = 'qty'
  ) THEN
    ALTER TABLE sales.quotation_items ADD COLUMN qty INTEGER;
    COMMENT ON COLUMN sales.quotation_items.qty IS 'Quantity item';
  END IF;
END $$;

-- Add satuan field
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'sales' AND table_name = 'quotation_items' AND column_name = 'satuan'
  ) THEN
    ALTER TABLE sales.quotation_items ADD COLUMN satuan VARCHAR(50);
    COMMENT ON COLUMN sales.quotation_items.satuan IS 'Satuan item (Pcs, Box, Kg, dll)';
  END IF;
END $$;

-- Add harga_satuan field
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'sales' AND table_name = 'quotation_items' AND column_name = 'harga_satuan'
  ) THEN
    ALTER TABLE sales.quotation_items ADD COLUMN harga_satuan DECIMAL(15,2);
    COMMENT ON COLUMN sales.quotation_items.harga_satuan IS 'Harga per satuan';
  END IF;
END $$;

-- Add diskon field
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'sales' AND table_name = 'quotation_items' AND column_name = 'diskon'
  ) THEN
    ALTER TABLE sales.quotation_items ADD COLUMN diskon DECIMAL(15,2) DEFAULT 0;
    COMMENT ON COLUMN sales.quotation_items.diskon IS 'Nominal diskon untuk item';
  END IF;
END $$;

-- Add total_harga field
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'sales' AND table_name = 'quotation_items' AND column_name = 'total_harga'
  ) THEN
    ALTER TABLE sales.quotation_items ADD COLUMN total_harga DECIMAL(15,2);
    COMMENT ON COLUMN sales.quotation_items.total_harga IS 'Total harga setelah diskon';
  END IF;
END $$;

-- =====================================================
-- PART 4: CREATE AUTO-GENERATE QUOTATION NUMBER FUNCTION
-- =====================================================

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

-- Drop existing trigger if exists
DROP TRIGGER IF EXISTS trigger_generate_quotation_number ON sales.quotations;

-- Create trigger to auto-generate quotation number
CREATE TRIGGER trigger_generate_quotation_number
  BEFORE INSERT ON sales.quotations
  FOR EACH ROW
  WHEN (NEW.quotation_number IS NULL OR NEW.quotation_number = '')
  EXECUTE FUNCTION sales.generate_quotation_number();

-- =====================================================
-- PART 5: ADD CHECK CONSTRAINTS
-- =====================================================

ALTER TABLE sales.quotations DROP CONSTRAINT IF EXISTS check_ppn_type;
ALTER TABLE sales.quotations ADD CONSTRAINT check_ppn_type
  CHECK (ppn_type IN ('Inc', 'Exc') OR ppn_type IS NULL);

ALTER TABLE sales.quotations DROP CONSTRAINT IF EXISTS check_mode_alamat;
ALTER TABLE sales.quotations ADD CONSTRAINT check_mode_alamat
  CHECK (mode_alamat IN ('Manual', 'Auto') OR mode_alamat IS NULL);

ALTER TABLE sales.quotations DROP CONSTRAINT IF EXISTS check_jenis_order;
ALTER TABLE sales.quotations ADD CONSTRAINT check_jenis_order
  CHECK (jenis_order IN ('Offset', 'Polos', 'Boks', 'Roto') OR jenis_order IS NULL);

-- =====================================================
-- PART 6: UPDATE RLS POLICIES
-- =====================================================

-- Drop existing policies
DROP POLICY IF EXISTS "Allow authenticated users to read quotations" ON sales.quotations;
DROP POLICY IF EXISTS "Allow authenticated users to manage quotations" ON sales.quotations;
DROP POLICY IF EXISTS "Allow authenticated users to insert quotations" ON sales.quotations;
DROP POLICY IF EXISTS "Allow authenticated users to update quotations" ON sales.quotations;
DROP POLICY IF EXISTS "Allow authenticated users to delete quotations" ON sales.quotations;

-- Create new policies
CREATE POLICY "Allow authenticated users to read quotations" ON sales.quotations
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated users to insert quotations" ON sales.quotations
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update quotations" ON sales.quotations
  FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Allow authenticated users to delete quotations" ON sales.quotations
  FOR DELETE TO authenticated USING (true);

-- Quotation Items policies
DROP POLICY IF EXISTS "Allow authenticated users to read quotation items" ON sales.quotation_items;
DROP POLICY IF EXISTS "Allow authenticated users to manage quotation items" ON sales.quotation_items;
DROP POLICY IF EXISTS "Allow authenticated users to insert quotation items" ON sales.quotation_items;
DROP POLICY IF EXISTS "Allow authenticated users to update quotation items" ON sales.quotation_items;
DROP POLICY IF EXISTS "Allow authenticated users to delete quotation items" ON sales.quotation_items;

CREATE POLICY "Allow authenticated users to read quotation items" ON sales.quotation_items
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated users to insert quotation items" ON sales.quotation_items
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update quotation items" ON sales.quotation_items
  FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Allow authenticated users to delete quotation items" ON sales.quotation_items
  FOR DELETE TO authenticated USING (true);

-- =====================================================
-- PART 7: GRANT PERMISSIONS
-- =====================================================

GRANT SELECT, INSERT, UPDATE, DELETE ON sales.quotations TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON sales.quotation_items TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA sales TO authenticated;

-- =====================================================
-- DONE!
-- =====================================================
-- Migration selesai! Refresh halaman Database Schema untuk melihat perubahan.
