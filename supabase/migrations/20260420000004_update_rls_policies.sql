-- Migration: Update RLS Policies
-- Description: Update dan standardize RLS policies untuk semua tabel
-- Created: 2026-04-20

-- =====================================================
-- SALES SCHEMA POLICIES
-- =====================================================

-- Customers
DROP POLICY IF EXISTS "Allow authenticated users to read customers" ON sales.customers;
DROP POLICY IF EXISTS "Allow authenticated users to manage customers" ON sales.customers;

CREATE POLICY "Allow authenticated users to read customers" ON sales.customers
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated users to insert customers" ON sales.customers
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update customers" ON sales.customers
  FOR UPDATE TO authenticated USING (true);

-- Price Formulas
DROP POLICY IF EXISTS "Allow authenticated users to read price formulas" ON sales.price_formulas;
DROP POLICY IF EXISTS "Allow authenticated users to manage their price formulas" ON sales.price_formulas;
DROP POLICY IF EXISTS "Allow authenticated users to manage price formulas" ON sales.price_formulas;

CREATE POLICY "Allow authenticated users to read price formulas" ON sales.price_formulas
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated users to insert price formulas" ON sales.price_formulas
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update price formulas" ON sales.price_formulas
  FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Allow authenticated users to delete price formulas" ON sales.price_formulas
  FOR DELETE TO authenticated USING (true);

-- Quotations
DROP POLICY IF EXISTS "Allow authenticated users to read quotations" ON sales.quotations;
DROP POLICY IF EXISTS "Allow authenticated users to manage quotations" ON sales.quotations;

CREATE POLICY "Allow authenticated users to read quotations" ON sales.quotations
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated users to insert quotations" ON sales.quotations
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update quotations" ON sales.quotations
  FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Allow authenticated users to delete quotations" ON sales.quotations
  FOR DELETE TO authenticated USING (true);

-- Quotation Items
DROP POLICY IF EXISTS "Allow authenticated users to read quotation items" ON sales.quotation_items;
DROP POLICY IF EXISTS "Allow authenticated users to manage quotation items" ON sales.quotation_items;

CREATE POLICY "Allow authenticated users to read quotation items" ON sales.quotation_items
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated users to insert quotation items" ON sales.quotation_items
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update quotation items" ON sales.quotation_items
  FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Allow authenticated users to delete quotation items" ON sales.quotation_items
  FOR DELETE TO authenticated USING (true);

-- Pipeline
DROP POLICY IF EXISTS "Allow authenticated users to read pipeline" ON sales.pipeline;
DROP POLICY IF EXISTS "Allow authenticated users to manage pipeline" ON sales.pipeline;

CREATE POLICY "Allow authenticated users to read pipeline" ON sales.pipeline
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated users to insert pipeline" ON sales.pipeline
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update pipeline" ON sales.pipeline
  FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Allow authenticated users to delete pipeline" ON sales.pipeline
  FOR DELETE TO authenticated USING (true);

-- Pipeline Activities
DROP POLICY IF EXISTS "Allow authenticated users to manage pipeline activities" ON sales.pipeline_activities;

CREATE POLICY "Allow authenticated users to read pipeline activities" ON sales.pipeline_activities
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated users to insert pipeline activities" ON sales.pipeline_activities
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update pipeline activities" ON sales.pipeline_activities
  FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Allow authenticated users to delete pipeline activities" ON sales.pipeline_activities
  FOR DELETE TO authenticated USING (true);

-- Orders
DROP POLICY IF EXISTS "Allow authenticated users to read orders" ON sales.orders;
DROP POLICY IF EXISTS "Allow authenticated users to manage orders" ON sales.orders;

CREATE POLICY "Allow authenticated users to read orders" ON sales.orders
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated users to insert orders" ON sales.orders
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update orders" ON sales.orders
  FOR UPDATE TO authenticated USING (true);

-- =====================================================
-- MASTER SCHEMA POLICIES
-- =====================================================

-- Material Types
DROP POLICY IF EXISTS "Allow authenticated users to read material types" ON master.material_types;
DROP POLICY IF EXISTS "Allow authenticated users to manage material types" ON master.material_types;

ALTER TABLE master.material_types ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated users to read material types" ON master.material_types
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated users to insert material types" ON master.material_types
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update material types" ON master.material_types
  FOR UPDATE TO authenticated USING (true);

-- Standard Sizes
DROP POLICY IF EXISTS "Allow authenticated users to read standard sizes" ON master.standard_sizes;
DROP POLICY IF EXISTS "Allow authenticated users to manage standard sizes" ON master.standard_sizes;

ALTER TABLE master.standard_sizes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated users to read standard sizes" ON master.standard_sizes
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated users to insert standard sizes" ON master.standard_sizes
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update standard sizes" ON master.standard_sizes
  FOR UPDATE TO authenticated USING (true);

-- Production Processes
DROP POLICY IF EXISTS "Allow authenticated users to read production processes" ON master.production_processes;
DROP POLICY IF EXISTS "Allow authenticated users to manage production processes" ON master.production_processes;

ALTER TABLE master.production_processes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated users to read production processes" ON master.production_processes
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated users to insert production processes" ON master.production_processes
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update production processes" ON master.production_processes
  FOR UPDATE TO authenticated USING (true);

-- Finishing Options
DROP POLICY IF EXISTS "Allow authenticated users to read finishing options" ON master.finishing_options;
DROP POLICY IF EXISTS "Allow authenticated users to manage finishing options" ON master.finishing_options;

ALTER TABLE master.finishing_options ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated users to read finishing options" ON master.finishing_options
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated users to insert finishing options" ON master.finishing_options
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update finishing options" ON master.finishing_options
  FOR UPDATE TO authenticated USING (true);

-- =====================================================
-- GRANT PERMISSIONS
-- =====================================================

-- Sales schema
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA sales TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA sales TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA sales TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA sales TO service_role;

-- Master schema
GRANT SELECT, INSERT, UPDATE ON ALL TABLES IN SCHEMA master TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA master TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA master TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA master TO service_role;
