-- Create KV Store table for application data storage
CREATE TABLE IF NOT EXISTS public.kv_store_6a7942bb (
    key TEXT PRIMARY KEY,
    value JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index on created_at for performance
CREATE INDEX IF NOT EXISTS idx_kv_store_created_at ON public.kv_store_6a7942bb(created_at);

-- Enable RLS (Row Level Security)
ALTER TABLE public.kv_store_6a7942bb ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all operations for authenticated users
CREATE POLICY "Allow all operations for authenticated users" ON public.kv_store_6a7942bb
    FOR ALL
    USING (true)
    WITH CHECK (true);

-- Create policy to allow anonymous access (for public data)
CREATE POLICY "Allow public read access" ON public.kv_store_6a7942bb
    FOR SELECT
    USING (true);

CREATE POLICY "Allow public write access" ON public.kv_store_6a7942bb
    FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Allow public update access" ON public.kv_store_6a7942bb
    FOR UPDATE
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Allow public delete access" ON public.kv_store_6a7942bb
    FOR DELETE
    USING (true);

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_kv_store_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER kv_store_update_timestamp
    BEFORE UPDATE ON public.kv_store_6a7942bb
    FOR EACH ROW
    EXECUTE FUNCTION update_kv_store_updated_at();

-- Add comments
COMMENT ON TABLE public.kv_store_6a7942bb IS 'Key-Value store for application data';
COMMENT ON COLUMN public.kv_store_6a7942bb.key IS 'Unique key identifier';
COMMENT ON COLUMN public.kv_store_6a7942bb.value IS 'JSON value data';
COMMENT ON COLUMN public.kv_store_6a7942bb.created_at IS 'Timestamp when record was created';
COMMENT ON COLUMN public.kv_store_6a7942bb.updated_at IS 'Timestamp when record was last updated';
