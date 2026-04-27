-- Create product_types table in master schema
CREATE TABLE IF NOT EXISTS master.product_types (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL UNIQUE,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ DEFAULT NULL
);

-- Create index on code and name for faster searches
CREATE INDEX idx_product_types_code ON master.product_types(code);
CREATE INDEX idx_product_types_name ON master.product_types(name);

-- Create index on deleted_at for soft delete queries
CREATE INDEX idx_product_types_deleted_at ON master.product_types(deleted_at) WHERE deleted_at IS NULL;

-- Enable RLS
ALTER TABLE master.product_types ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all operations for authenticated users
CREATE POLICY "Allow all operations for authenticated users" ON master.product_types
    FOR ALL
    USING (auth.role() = 'authenticated')
    WITH CHECK (auth.role() = 'authenticated');

-- Add trigger to update updated_at timestamp
CREATE TRIGGER update_product_types_updated_at
    BEFORE UPDATE ON master.product_types
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Add comment to table
COMMENT ON TABLE master.product_types IS 'Master data for product types/categories';
COMMENT ON COLUMN master.product_types.id IS 'Primary key';
COMMENT ON COLUMN master.product_types.code IS 'Product type code (unique)';
COMMENT ON COLUMN master.product_types.name IS 'Product type name (unique)';
COMMENT ON COLUMN master.product_types.notes IS 'Additional notes about the product type';
COMMENT ON COLUMN master.product_types.deleted_at IS 'Soft delete timestamp (NULL = active, NOT NULL = deleted)';
