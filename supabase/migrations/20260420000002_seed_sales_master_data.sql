-- Migration: Seed Sales Master Data
-- Description: Insert initial data untuk master tables sales
-- Created: 2026-04-20

-- =====================================================
-- SALES: PIPELINE STAGES
-- =====================================================

INSERT INTO sales.pipeline_stages (stage_code, stage_name, stage_order, probability_percentage, color, is_active) VALUES
('LEAD', 'Lead', 1, 10, '#6B7280', true),
('QUALIFIED', 'Qualified', 2, 25, '#3B82F6', true),
('PROPOSAL', 'Proposal', 3, 50, '#8B5CF6', true),
('NEGOTIATION', 'Negotiation', 4, 75, '#F59E0B', true),
('CLOSED_WON', 'Closed Won', 5, 100, '#10B981', true),
('CLOSED_LOST', 'Closed Lost', 6, 0, '#EF4444', true)
ON CONFLICT (stage_code) DO NOTHING;

-- =====================================================
-- SALES: LEAD SOURCES
-- =====================================================

INSERT INTO sales.lead_sources (source_code, source_name, source_type, description, is_active) VALUES
('LS-WEB', 'Website', 'website', 'Lead dari website company', true),
('LS-REF', 'Referral', 'referral', 'Lead dari referensi customer/partner', true),
('LS-SOCMED', 'Social Media', 'social_media', 'Lead dari social media (Instagram, Facebook, LinkedIn)', true),
('LS-EVENT', 'Event/Exhibition', 'event', 'Lead dari event atau exhibition', true),
('LS-DIRECT', 'Direct Contact', 'direct', 'Lead dari direct contact (call, walk-in)', true),
('LS-TELP', 'Telemarketing', 'telemarketing', 'Lead dari aktivitas telemarketing', true),
('LS-EMAIL', 'Email Marketing', 'email', 'Lead dari email marketing campaign', true),
('LS-ADS', 'Online Ads', 'ads', 'Lead dari iklan online (Google Ads, FB Ads)', true),
('LS-PARTNER', 'Partner', 'partner', 'Lead dari channel partner', true),
('LS-OTHER', 'Other', 'other', 'Lead dari sumber lainnya', true)
ON CONFLICT (source_code) DO NOTHING;

-- =====================================================
-- SALES: INDUSTRY CATEGORIES
-- =====================================================

INSERT INTO sales.industry_categories (category_code, category_name, description, is_active) VALUES
('IND-FOOD', 'Food & Beverage', 'Industri makanan dan minuman', true),
('IND-RETAIL', 'Retail', 'Industri retail dan distribution', true),
('IND-FMCG', 'FMCG', 'Fast Moving Consumer Goods', true),
('IND-PHARMA', 'Pharmaceutical', 'Industri farmasi dan kesehatan', true),
('IND-COSM', 'Cosmetics & Personal Care', 'Industri kosmetik dan perawatan pribadi', true),
('IND-APPAREL', 'Apparel & Fashion', 'Industri fashion dan garment', true),
('IND-ELEC', 'Electronics', 'Industri elektronik', true),
('IND-AUTO', 'Automotive', 'Industri otomotif', true),
('IND-CHEM', 'Chemical', 'Industri kimia', true),
('IND-AGRI', 'Agriculture', 'Industri pertanian dan agribisnis', true),
('IND-BUILD', 'Building & Construction', 'Industri konstruksi dan bangunan', true),
('IND-PRINT', 'Printing & Publishing', 'Industri percetakan dan penerbitan', true),
('IND-HOSP', 'Hospitality', 'Industri perhotelan dan pariwisata', true),
('IND-EDU', 'Education', 'Industri pendidikan', true),
('IND-OTHER', 'Other', 'Industri lainnya', true)
ON CONFLICT (category_code) DO NOTHING;

-- =====================================================
-- SALES: REGIONS
-- =====================================================

INSERT INTO sales.regions (region_code, region_name, province, coverage_area, is_active) VALUES
('REG-JKT', 'Jakarta', 'DKI Jakarta',
  ARRAY['Jakarta Pusat', 'Jakarta Utara', 'Jakarta Selatan', 'Jakarta Barat', 'Jakarta Timur', 'Kepulauan Seribu'],
  true),
('REG-BDG', 'Bandung', 'Jawa Barat',
  ARRAY['Bandung', 'Cimahi', 'Bandung Barat'],
  true),
('REG-JBR', 'Jabodetabek', 'Jawa Barat/Banten',
  ARRAY['Bogor', 'Depok', 'Tangerang', 'Bekasi', 'Tangerang Selatan'],
  true),
('REG-SBY', 'Surabaya', 'Jawa Timur',
  ARRAY['Surabaya', 'Sidoarjo', 'Gresik'],
  true),
('REG-SMG', 'Semarang', 'Jawa Tengah',
  ARRAY['Semarang', 'Salatiga', 'Kendal'],
  true),
('REG-YGY', 'Yogyakarta', 'DI Yogyakarta',
  ARRAY['Yogyakarta', 'Sleman', 'Bantul'],
  true),
('REG-MDN', 'Medan', 'Sumatera Utara',
  ARRAY['Medan', 'Deli Serdang', 'Binjai'],
  true),
('REG-BKS', 'Batam', 'Kepulauan Riau',
  ARRAY['Batam', 'Tanjung Pinang'],
  true),
('REG-PLG', 'Palembang', 'Sumatera Selatan',
  ARRAY['Palembang', 'Prabumulih'],
  true),
('REG-MKS', 'Makassar', 'Sulawesi Selatan',
  ARRAY['Makassar', 'Gowa', 'Maros'],
  true),
('REG-DPS', 'Denpasar', 'Bali',
  ARRAY['Denpasar', 'Badung', 'Gianyar'],
  true),
('REG-BPN', 'Balikpapan', 'Kalimantan Timur',
  ARRAY['Balikpapan', 'Samarinda'],
  true)
ON CONFLICT (region_code) DO NOTHING;

-- =====================================================
-- SALES: SEGMENTS
-- =====================================================

INSERT INTO sales.segments (segment_code, segment_name, criteria, description, is_active) VALUES
('SEG-CORP', 'Corporate',
  '{"size": "large", "revenue_min": 50000000000, "employee_min": 500}'::jsonb,
  'Perusahaan besar dengan revenue > 50M',
  true),
('SEG-SME', 'SME (Small Medium Enterprise)',
  '{"size": "medium", "revenue_min": 5000000000, "revenue_max": 50000000000}'::jsonb,
  'Perusahaan menengah dengan revenue 5M - 50M',
  true),
('SEG-SOHO', 'SOHO (Small Office Home Office)',
  '{"size": "small", "revenue_max": 5000000000, "employee_max": 50}'::jsonb,
  'Bisnis kecil dengan revenue < 5M',
  true),
('SEG-RETAIL', 'Retail',
  '{"type": "retail", "channel": ["store", "online"]}'::jsonb,
  'Customer retail (toko, online shop)',
  true),
('SEG-WHOLES', 'Wholesale',
  '{"type": "wholesale", "channel": "distribution"}'::jsonb,
  'Customer grosir dan distributor',
  true),
('SEG-EXPORT', 'Export',
  '{"market": "international"}'::jsonb,
  'Customer eksport luar negeri',
  true)
ON CONFLICT (segment_code) DO NOTHING;

-- =====================================================
-- ADD COMMENTS
-- =====================================================

COMMENT ON TABLE sales.pipeline_stages IS 'Master tahapan pipeline sales dengan probability';
COMMENT ON TABLE sales.lead_sources IS 'Master sumber lead/prospek customer';
COMMENT ON TABLE sales.industry_categories IS 'Master kategori industri customer';
COMMENT ON TABLE sales.regions IS 'Master wilayah sales coverage';
COMMENT ON TABLE sales.segments IS 'Master segmentasi customer';

-- =====================================================
-- ENABLE RLS IF NOT ENABLED
-- =====================================================

DO $$
BEGIN
  -- Check if RLS policies exist, if not create them
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'sales'
    AND tablename = 'pipeline_stages'
  ) THEN
    CREATE POLICY "Allow authenticated users to manage pipeline stages"
      ON sales.pipeline_stages FOR ALL TO authenticated USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'sales'
    AND tablename = 'lead_sources'
  ) THEN
    CREATE POLICY "Allow authenticated users to manage lead sources"
      ON sales.lead_sources FOR ALL TO authenticated USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'sales'
    AND tablename = 'industry_categories'
  ) THEN
    CREATE POLICY "Allow authenticated users to manage industry categories"
      ON sales.industry_categories FOR ALL TO authenticated USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'sales'
    AND tablename = 'regions'
  ) THEN
    CREATE POLICY "Allow authenticated users to manage regions"
      ON sales.regions FOR ALL TO authenticated USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'sales'
    AND tablename = 'segments'
  ) THEN
    CREATE POLICY "Allow authenticated users to manage segments"
      ON sales.segments FOR ALL TO authenticated USING (true);
  END IF;
END $$;
