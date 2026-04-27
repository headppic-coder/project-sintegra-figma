-- Consolidated Master Reference Tables
-- Migration: Konsolidasi tabel-tabel master dan referensi yang sering digunakan
-- Note: Beberapa tabel sudah dibuat di migration sebelumnya, file ini sebagai referensi

-- =====================================================
-- SALES MODULE - Master Tables
-- =====================================================

-- Sales: Sumber Lead (Lead Sources)
-- Already created in migration 15, reference here
-- CREATE TABLE sales.lead_sources (
--   id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
--   source_code VARCHAR(50) UNIQUE NOT NULL,
--   source_name VARCHAR(200) NOT NULL,
--   source_type VARCHAR(50),
--   description TEXT,
--   is_active BOOLEAN DEFAULT true,
--   created_at TIMESTAMPTZ DEFAULT NOW(),
--   updated_at TIMESTAMPTZ DEFAULT NOW()
-- );

-- Sales: Wilayah (Regions)
-- Already created in migration 15
-- CREATE TABLE sales.regions (
--   id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
--   region_code VARCHAR(50) UNIQUE NOT NULL,
--   region_name VARCHAR(200) NOT NULL,
--   province VARCHAR(100),
--   coverage_area TEXT[],
--   sales_person_id UUID REFERENCES auth.users(id),
--   is_active BOOLEAN DEFAULT true,
--   created_at TIMESTAMPTZ DEFAULT NOW(),
--   updated_at TIMESTAMPTZ DEFAULT NOW()
-- );

-- Sales: Segmen Customer (Customer Segments)
-- Already created in migration 15
-- CREATE TABLE sales.segments (
--   id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
--   segment_code VARCHAR(50) UNIQUE NOT NULL,
--   segment_name VARCHAR(200) NOT NULL,
--   criteria JSONB,
--   description TEXT,
--   is_active BOOLEAN DEFAULT true,
--   created_at TIMESTAMPTZ DEFAULT NOW(),
--   updated_at TIMESTAMPTZ DEFAULT NOW()
-- );

-- Sales: Stage Pipeline
-- Already created in migration 15
-- CREATE TABLE sales.pipeline_stages (
--   id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
--   stage_code VARCHAR(50) UNIQUE NOT NULL,
--   stage_name VARCHAR(200) NOT NULL,
--   stage_order INTEGER NOT NULL,
--   probability_percentage DECIMAL(5,2),
--   is_active BOOLEAN DEFAULT true,
--   color VARCHAR(20),
--   created_at TIMESTAMPTZ DEFAULT NOW(),
--   updated_at TIMESTAMPTZ DEFAULT NOW()
-- );

-- Sales: Calon Customer (Prospective Customers)
-- Already created in migration 15
-- CREATE TABLE sales.prospective_customers (
--   id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
--   prospect_number VARCHAR(50) UNIQUE NOT NULL,
--   company_name VARCHAR(200) NOT NULL,
--   industry_category_id UUID REFERENCES sales.industry_categories(id),
--   contact_person VARCHAR(200),
--   phone VARCHAR(50),
--   email VARCHAR(200),
--   address TEXT,
--   lead_source_id UUID REFERENCES sales.lead_sources(id),
--   region_id UUID REFERENCES sales.regions(id),
--   segment_id UUID REFERENCES sales.segments(id),
--   sales_person_id UUID REFERENCES auth.users(id),
--   status VARCHAR(50) DEFAULT 'new',
--   created_at TIMESTAMPTZ DEFAULT NOW()
-- );

-- Sales: Customer
-- Already created in migration 03
-- CREATE TABLE sales.customers (
--   id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
--   code VARCHAR(50) UNIQUE NOT NULL,
--   name VARCHAR(200) NOT NULL,
--   contact_person VARCHAR(200),
--   phone VARCHAR(50),
--   email VARCHAR(200),
--   address TEXT,
--   sales_person_id UUID REFERENCES auth.users(id),
--   is_active BOOLEAN DEFAULT true,
--   created_at TIMESTAMPTZ DEFAULT NOW()
-- );

-- Sales: Pipeline (Sales Opportunities)
-- Already created in migration 15
-- CREATE TABLE sales.pipeline (
--   id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
--   opportunity_number VARCHAR(50) UNIQUE NOT NULL,
--   opportunity_name VARCHAR(200) NOT NULL,
--   customer_id UUID REFERENCES sales.customers(id),
--   stage_id UUID REFERENCES sales.pipeline_stages(id) NOT NULL,
--   estimated_value DECIMAL(15,2),
--   expected_close_date DATE,
--   sales_person_id UUID REFERENCES auth.users(id),
--   status VARCHAR(50) DEFAULT 'open',
--   created_at TIMESTAMPTZ DEFAULT NOW()
-- );

-- Sales: Follow-up Pipeline (Pipeline Activities)
-- Already created in migration 15
-- CREATE TABLE sales.pipeline_activities (
--   id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
--   pipeline_id UUID REFERENCES sales.pipeline(id) ON DELETE CASCADE,
--   activity_date TIMESTAMPTZ DEFAULT NOW(),
--   activity_type VARCHAR(50) NOT NULL,
--   subject VARCHAR(200),
--   description TEXT,
--   next_action TEXT,
--   next_action_date DATE,
--   performed_by UUID REFERENCES auth.users(id),
--   created_at TIMESTAMPTZ DEFAULT NOW()
-- );

-- Sales: Master Aktivitas Sales
-- Already created in migration 15
-- CREATE TABLE sales.sales_activities (
--   id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
--   activity_number VARCHAR(50) UNIQUE NOT NULL,
--   activity_date DATE DEFAULT CURRENT_DATE,
--   activity_type VARCHAR(50) NOT NULL,
--   customer_id UUID REFERENCES sales.customers(id),
--   sales_person_id UUID REFERENCES auth.users(id) NOT NULL,
--   subject VARCHAR(200) NOT NULL,
--   description TEXT,
--   status VARCHAR(50) DEFAULT 'completed',
--   created_at TIMESTAMPTZ DEFAULT NOW()
-- );

-- =====================================================
-- MASTER DATA - Kategori & Tipe Barang
-- =====================================================

-- Master: Kategori Barang
-- Already created in migration 02
-- CREATE TABLE master.categories (
--   id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
--   name VARCHAR(100) NOT NULL,
--   type VARCHAR(50) NOT NULL,
--   description TEXT,
--   is_active BOOLEAN DEFAULT true,
--   created_at TIMESTAMPTZ DEFAULT NOW()
-- );

-- Master: Tipe Barang (Product Types)
-- Already created in migration 02
-- CREATE TABLE master.product_types (
--   id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
--   code VARCHAR(50) UNIQUE NOT NULL,
--   name VARCHAR(200) NOT NULL,
--   category VARCHAR(50) NOT NULL,
--   default_specs JSONB,
--   is_active BOOLEAN DEFAULT true,
--   created_at TIMESTAMPTZ DEFAULT NOW()
-- );

-- =====================================================
-- INVENTORY MODULE
-- =====================================================

-- Inventory: Gudang (Warehouses)
-- Already created in migration 05
-- CREATE TABLE inventory.warehouses (
--   id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
--   code VARCHAR(50) UNIQUE NOT NULL,
--   name VARCHAR(200) NOT NULL,
--   address TEXT,
--   manager_id UUID REFERENCES auth.users(id),
--   is_active BOOLEAN DEFAULT true,
--   created_at TIMESTAMPTZ DEFAULT NOW()
-- );

-- Inventory: Alat Bantu (Tool Registry)
-- Already created in migration 12
-- CREATE TABLE inventory.tool_registry (
--   id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
--   tool_code VARCHAR(50) UNIQUE NOT NULL,
--   tool_name VARCHAR(200) NOT NULL,
--   tool_type VARCHAR(50),
--   warehouse_id UUID REFERENCES inventory.warehouses(id),
--   condition VARCHAR(50) DEFAULT 'good',
--   is_available BOOLEAN DEFAULT true,
--   created_at TIMESTAMPTZ DEFAULT NOW()
-- );

-- =====================================================
-- HRGA MODULE
-- =====================================================

-- HRGA: Perusahaan (Companies)
-- Already created in migration 13
-- CREATE TABLE hrga.master_companies (
--   id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
--   company_code VARCHAR(50) UNIQUE NOT NULL,
--   company_name VARCHAR(200) NOT NULL,
--   address TEXT,
--   phone VARCHAR(50),
--   is_active BOOLEAN DEFAULT true,
--   created_at TIMESTAMPTZ DEFAULT NOW()
-- );

-- HRGA: Departemen (Departments)
-- Already created in migration 13
-- CREATE TABLE hrga.master_departments (
--   id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
--   department_code VARCHAR(50) UNIQUE NOT NULL,
--   department_name VARCHAR(200) NOT NULL,
--   company_id UUID REFERENCES hrga.master_companies(id),
--   is_active BOOLEAN DEFAULT true,
--   created_at TIMESTAMPTZ DEFAULT NOW()
-- );

-- HRGA: Jabatan (Positions)
-- Already created in migration 13
-- CREATE TABLE hrga.master_positions (
--   id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
--   position_code VARCHAR(50) UNIQUE NOT NULL,
--   position_name VARCHAR(200) NOT NULL,
--   department_id UUID REFERENCES hrga.master_departments(id),
--   level VARCHAR(50),
--   is_active BOOLEAN DEFAULT true,
--   created_at TIMESTAMPTZ DEFAULT NOW()
-- );

-- HRGA: Shift
-- Already created in migration 13
-- CREATE TABLE hrga.master_shift (
--   id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
--   shift_code VARCHAR(50) UNIQUE NOT NULL,
--   shift_name VARCHAR(100) NOT NULL,
--   start_time TIME NOT NULL,
--   end_time TIME NOT NULL,
--   duration_hours DECIMAL(10,2),
--   is_active BOOLEAN DEFAULT true,
--   created_at TIMESTAMPTZ DEFAULT NOW()
-- );

-- =====================================================
-- SUMMARY & RELATIONSHIPS
-- =====================================================

/*
RELATIONSHIP DIAGRAM:

1. SALES FLOW:
   sales.lead_sources → sales.prospective_customers → sales.customers
                                                          ↓
   sales.pipeline_stages → sales.pipeline ← sales.customers
                               ↓
                    sales.pipeline_activities
                    sales.sales_activities

2. ORGANIZATION:
   hrga.master_companies → hrga.master_departments → hrga.master_positions
                                                           ↓
                                                    hrga.employees

3. INVENTORY:
   inventory.warehouses → inventory.tool_registry
                       → inventory.stock

4. MASTER DATA:
   master.categories → master.materials
                    → master.product_types
*/

-- =====================================================
-- NOTES
-- =====================================================

-- Semua tabel di atas sudah dibuat di migration files sebelumnya:
-- - Migration 02: master.categories, master.product_types
-- - Migration 03: sales.customers
-- - Migration 05: inventory.warehouses
-- - Migration 12: inventory.tool_registry
-- - Migration 13: hrga.master_companies, master_departments, master_positions, master_shift
-- - Migration 15: sales.prospective_customers, pipeline, pipeline_stages, lead_sources, regions, segments

-- File ini adalah REFERENSI untuk melihat struktur tabel yang saling berhubungan
-- Tidak perlu di-run jika semua migration 01-15 sudah di-apply

-- Untuk melihat detail lengkap setiap tabel, lihat migration file yang sesuai
-- Untuk tutorial koneksi Supabase, lihat: SUPABASE_SETUP_TUTORIAL.md
