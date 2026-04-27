-- Migration: Create Pipeline Follow-up Table
-- Description: Tabel untuk menyimpan aktivitas follow-up pipeline sales
-- Schema: sales
-- Created: 2026-04-13

-- Create pipeline_follow_ups table
CREATE TABLE IF NOT EXISTS sales.pipeline_follow_ups (
  -- Primary Key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Foreign Keys
  pipeline_id UUID NOT NULL REFERENCES sales.pipeline(id) ON DELETE CASCADE,
  sales_person_id UUID REFERENCES auth.users(id),

  -- Follow-up Information
  follow_up_number VARCHAR(50) UNIQUE,
  tanggal DATE NOT NULL,
  aktivitas VARCHAR(200) NOT NULL,
  stage VARCHAR(50),

  -- Customer Information
  alamat TEXT,
  contact_person VARCHAR(200),
  phone VARCHAR(50),

  -- Result & Notes
  hasil TEXT,
  catatan TEXT,

  -- Next Follow-up
  next_follow_up_date DATE,
  next_follow_up_notes TEXT,

  -- Status
  status VARCHAR(50) DEFAULT 'completed',

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- Create indexes for better query performance
CREATE INDEX idx_pipeline_follow_ups_pipeline_id ON sales.pipeline_follow_ups(pipeline_id);
CREATE INDEX idx_pipeline_follow_ups_tanggal ON sales.pipeline_follow_ups(tanggal DESC);
CREATE INDEX idx_pipeline_follow_ups_sales_person ON sales.pipeline_follow_ups(sales_person_id);
CREATE INDEX idx_pipeline_follow_ups_status ON sales.pipeline_follow_ups(status);
CREATE INDEX idx_pipeline_follow_ups_next_date ON sales.pipeline_follow_ups(next_follow_up_date) WHERE next_follow_up_date IS NOT NULL;

-- Add comments
COMMENT ON TABLE sales.pipeline_follow_ups IS 'Tabel untuk menyimpan aktivitas follow-up dari pipeline sales';
COMMENT ON COLUMN sales.pipeline_follow_ups.id IS 'Primary key UUID';
COMMENT ON COLUMN sales.pipeline_follow_ups.pipeline_id IS 'Foreign key ke tabel pipeline';
COMMENT ON COLUMN sales.pipeline_follow_ups.follow_up_number IS 'Nomor follow-up unik';
COMMENT ON COLUMN sales.pipeline_follow_ups.tanggal IS 'Tanggal aktivitas follow-up dilakukan';
COMMENT ON COLUMN sales.pipeline_follow_ups.aktivitas IS 'Jenis aktivitas (Cold Call, Meeting, Presentasi, dll)';
COMMENT ON COLUMN sales.pipeline_follow_ups.stage IS 'Stage pipeline saat follow-up';
COMMENT ON COLUMN sales.pipeline_follow_ups.hasil IS 'Hasil dari aktivitas follow-up';
COMMENT ON COLUMN sales.pipeline_follow_ups.next_follow_up_date IS 'Tanggal rencana follow-up berikutnya';

-- Enable Row Level Security
ALTER TABLE sales.pipeline_follow_ups ENABLE ROW LEVEL SECURITY;

-- Create RLS Policies
CREATE POLICY "Enable read access for authenticated users" ON sales.pipeline_follow_ups
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Enable insert for authenticated users" ON sales.pipeline_follow_ups
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable update for authenticated users" ON sales.pipeline_follow_ups
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Enable delete for authenticated users" ON sales.pipeline_follow_ups
  FOR DELETE USING (auth.role() = 'authenticated');

-- Create trigger for updated_at
CREATE TRIGGER update_pipeline_follow_ups_updated_at
  BEFORE UPDATE ON sales.pipeline_follow_ups
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to generate follow-up number
CREATE OR REPLACE FUNCTION sales.generate_follow_up_number()
RETURNS TRIGGER AS $$
DECLARE
  new_number VARCHAR(50);
  current_date_str VARCHAR(8);
  sequence_num INTEGER;
BEGIN
  -- Format: FU-YYYYMMDD-XXXX
  current_date_str := TO_CHAR(NEW.tanggal, 'YYYYMMDD');

  -- Get the next sequence number for today
  SELECT COALESCE(MAX(CAST(SUBSTRING(follow_up_number FROM 13) AS INTEGER)), 0) + 1
  INTO sequence_num
  FROM sales.pipeline_follow_ups
  WHERE follow_up_number LIKE 'FU-' || current_date_str || '-%';

  -- Generate the new number
  new_number := 'FU-' || current_date_str || '-' || LPAD(sequence_num::TEXT, 4, '0');

  NEW.follow_up_number := new_number;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-generate follow-up number
CREATE TRIGGER trigger_generate_follow_up_number
  BEFORE INSERT ON sales.pipeline_follow_ups
  FOR EACH ROW
  WHEN (NEW.follow_up_number IS NULL)
  EXECUTE FUNCTION sales.generate_follow_up_number();
