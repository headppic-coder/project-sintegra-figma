-- Create schemas for organizing tables by feature
-- Migration: Create database schemas

-- Sales schema - for customer management, orders, and sales operations
CREATE SCHEMA IF NOT EXISTS sales;
COMMENT ON SCHEMA sales IS 'Sales management, customers, orders, and quotations';

-- Production schema - for manufacturing processes and formulas
CREATE SCHEMA IF NOT EXISTS production;
COMMENT ON SCHEMA production IS 'Production management, work orders, and manufacturing processes';

-- Inventory schema - for materials and stock management
CREATE SCHEMA IF NOT EXISTS inventory;
COMMENT ON SCHEMA inventory IS 'Inventory management, materials, and stock tracking';

-- Master schema - for master data and configurations
CREATE SCHEMA IF NOT EXISTS master;
COMMENT ON SCHEMA master IS 'Master data, categories, settings, and configurations';

-- Finance schema - for financial transactions and accounting
CREATE SCHEMA IF NOT EXISTS finance;
COMMENT ON SCHEMA finance IS 'Financial management, invoicing, and payments';

-- Grant usage permissions on schemas
GRANT USAGE ON SCHEMA sales TO authenticated;
GRANT USAGE ON SCHEMA production TO authenticated;
GRANT USAGE ON SCHEMA inventory TO authenticated;
GRANT USAGE ON SCHEMA master TO authenticated;
GRANT USAGE ON SCHEMA finance TO authenticated;

-- Grant permissions to service_role
GRANT ALL ON SCHEMA sales TO service_role;
GRANT ALL ON SCHEMA production TO service_role;
GRANT ALL ON SCHEMA inventory TO service_role;
GRANT ALL ON SCHEMA master TO service_role;
GRANT ALL ON SCHEMA finance TO service_role;
