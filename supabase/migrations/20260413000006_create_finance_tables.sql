-- Finance Schema Tables
-- Migration: Create finance and accounting tables

-- Finance: Invoices
CREATE TABLE finance.invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_number VARCHAR(50) UNIQUE NOT NULL,
  customer_id UUID REFERENCES sales.customers(id) NOT NULL,
  order_id UUID REFERENCES sales.orders(id),
  invoice_date DATE DEFAULT CURRENT_DATE,
  due_date DATE,
  subtotal DECIMAL(15,2) NOT NULL,
  discount_percentage DECIMAL(5,2) DEFAULT 0,
  discount_amount DECIMAL(15,2) DEFAULT 0,
  tax_percentage DECIMAL(5,2) DEFAULT 11,
  tax_amount DECIMAL(15,2),
  total_amount DECIMAL(15,2) NOT NULL,
  paid_amount DECIMAL(15,2) DEFAULT 0,
  outstanding_amount DECIMAL(15,2) GENERATED ALWAYS AS (total_amount - paid_amount) STORED,
  status VARCHAR(50) DEFAULT 'unpaid', -- 'unpaid', 'partial', 'paid', 'overdue', 'cancelled'
  payment_terms INTEGER DEFAULT 30, -- days
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id)
);

-- Finance: Invoice Items
CREATE TABLE finance.invoice_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID REFERENCES finance.invoices(id) ON DELETE CASCADE,
  item_number INTEGER NOT NULL,
  description TEXT NOT NULL,
  quantity DECIMAL(15,3) NOT NULL,
  unit_price DECIMAL(15,2) NOT NULL,
  subtotal DECIMAL(15,2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Finance: Payments
CREATE TABLE finance.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_number VARCHAR(50) UNIQUE NOT NULL,
  invoice_id UUID REFERENCES finance.invoices(id),
  customer_id UUID REFERENCES sales.customers(id) NOT NULL,
  payment_date DATE DEFAULT CURRENT_DATE,
  amount DECIMAL(15,2) NOT NULL,
  payment_method VARCHAR(50) NOT NULL, -- 'cash', 'transfer', 'check', 'credit_card', 'giro'
  reference_number VARCHAR(100), -- check number, transfer reference, etc
  bank_name VARCHAR(100),
  notes TEXT,
  status VARCHAR(50) DEFAULT 'confirmed', -- 'pending', 'confirmed', 'cancelled'
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- Finance: Expenses
CREATE TABLE finance.expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  expense_number VARCHAR(50) UNIQUE NOT NULL,
  expense_date DATE DEFAULT CURRENT_DATE,
  category VARCHAR(100) NOT NULL, -- 'materials', 'utilities', 'salaries', 'maintenance', etc
  description TEXT NOT NULL,
  amount DECIMAL(15,2) NOT NULL,
  payment_method VARCHAR(50),
  vendor_name VARCHAR(200),
  reference_number VARCHAR(100),
  status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'approved', 'paid', 'rejected'
  approved_by UUID REFERENCES auth.users(id),
  approved_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- Finance: Accounts (Chart of Accounts)
CREATE TABLE finance.accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_code VARCHAR(50) UNIQUE NOT NULL,
  account_name VARCHAR(200) NOT NULL,
  account_type VARCHAR(50) NOT NULL, -- 'asset', 'liability', 'equity', 'revenue', 'expense'
  parent_account_id UUID REFERENCES finance.accounts(id),
  level INTEGER DEFAULT 1,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Finance: Journal Entries
CREATE TABLE finance.journal_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entry_number VARCHAR(50) UNIQUE NOT NULL,
  entry_date DATE DEFAULT CURRENT_DATE,
  description TEXT NOT NULL,
  reference_type VARCHAR(50), -- 'invoice', 'payment', 'expense', 'adjustment'
  reference_id UUID,
  status VARCHAR(50) DEFAULT 'draft', -- 'draft', 'posted', 'cancelled'
  posted_at TIMESTAMPTZ,
  posted_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- Finance: Journal Entry Lines
CREATE TABLE finance.journal_entry_lines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  journal_entry_id UUID REFERENCES finance.journal_entries(id) ON DELETE CASCADE,
  line_number INTEGER NOT NULL,
  account_id UUID REFERENCES finance.accounts(id) NOT NULL,
  debit_amount DECIMAL(15,2) DEFAULT 0,
  credit_amount DECIMAL(15,2) DEFAULT 0,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_invoices_customer ON finance.invoices(customer_id);
CREATE INDEX idx_invoices_order ON finance.invoices(order_id);
CREATE INDEX idx_invoices_status ON finance.invoices(status);
CREATE INDEX idx_invoices_date ON finance.invoices(invoice_date);
CREATE INDEX idx_payments_invoice ON finance.payments(invoice_id);
CREATE INDEX idx_payments_customer ON finance.payments(customer_id);
CREATE INDEX idx_payments_date ON finance.payments(payment_date);
CREATE INDEX idx_expenses_category ON finance.expenses(category);
CREATE INDEX idx_expenses_date ON finance.expenses(expense_date);

-- Enable RLS
ALTER TABLE finance.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE finance.invoice_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE finance.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE finance.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE finance.accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE finance.journal_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE finance.journal_entry_lines ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Allow authenticated users to read invoices" ON finance.invoices
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated users to read payments" ON finance.payments
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated users to read expenses" ON finance.expenses
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated users to read accounts" ON finance.accounts
  FOR SELECT TO authenticated USING (true);

-- Grant permissions
GRANT SELECT ON ALL TABLES IN SCHEMA finance TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA finance TO service_role;
