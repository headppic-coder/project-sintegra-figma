# 📘 Tutorial Setup Supabase - Complete Guide

## Daftar Isi
1. [Setup Supabase Project](#1-setup-supabase-project)
2. [Setup Local Development](#2-setup-local-development)
3. [Cara Membuat Schema & Tables](#3-cara-membuat-schema--tables)
4. [Menghubungkan Tables dengan Foreign Keys](#4-menghubungkan-tables-dengan-foreign-keys)
5. [Connect dari React/TypeScript](#5-connect-dari-reacttypescript)
6. [CRUD Operations Examples](#6-crud-operations-examples)
7. [Row Level Security (RLS)](#7-row-level-security-rls)
8. [Best Practices](#8-best-practices)

---

## 1. Setup Supabase Project

### Step 1.1: Buat Project di Supabase

1. Buka [supabase.com](https://supabase.com)
2. Klik **"Start your project"** atau **"New Project"**
3. Login dengan GitHub/Email
4. Pilih Organization atau buat baru
5. Isi form project:
   ```
   Name: packaging-management
   Database Password: [buat password kuat]
   Region: Singapore (Southeast Asia)
   Pricing Plan: Free (untuk development)
   ```
6. Klik **"Create new project"**
7. Tunggu ~2 menit sampai project ready

### Step 1.2: Copy Project Credentials

Setelah project ready, copy credentials dari **Settings** → **API**:

```bash
Project URL: https://xxxxx.supabase.co
anon/public key: eyJhbGc...
service_role key: eyJhbGc... (jangan share!)
Project Reference ID: xxxxx
```

---

## 2. Setup Local Development

### Step 2.1: Install Supabase CLI

```bash
# Install Supabase CLI
npm install -g supabase

# Verify installation
supabase --version
```

### Step 2.2: Login & Link Project

```bash
# Login ke Supabase
supabase login

# Link ke project (dari root project folder)
cd /workspaces/default/code
supabase link --project-ref xxxxx

# xxxxx = Project Reference ID dari dashboard
```

### Step 2.3: Setup Environment Variables

Buat file `.env.local` di root project:

```bash
# .env.local
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGc...

# JANGAN commit service_role key ke git!
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...
```

Tambahkan ke `.gitignore`:
```
.env.local
.env*.local
```

---

## 3. Cara Membuat Schema & Tables

### Method 1: Menggunakan Migrations (Recommended)

**Cara ini sudah dilakukan dengan 15 migration files yang sudah dibuat!**

```bash
# Apply semua migrations ke Supabase
supabase db push

# Check status migrations
supabase migration list

# Create new migration
supabase migration new add_new_feature
```

### Method 2: Menggunakan SQL Editor di Dashboard

1. Buka Supabase Dashboard
2. Klik **SQL Editor** di sidebar
3. Klik **"New query"**
4. Paste SQL code:

```sql
-- Contoh: Membuat schema baru
CREATE SCHEMA IF NOT EXISTS sales;

-- Membuat table di schema sales
CREATE TABLE sales.customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(200) NOT NULL,
  phone VARCHAR(50),
  email VARCHAR(200),
  address TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Buat index
CREATE INDEX idx_customers_code ON sales.customers(code);
CREATE INDEX idx_customers_name ON sales.customers(name);

-- Enable RLS
ALTER TABLE sales.customers ENABLE ROW LEVEL SECURITY;

-- Create RLS Policy
CREATE POLICY "Allow authenticated users to read customers"
  ON sales.customers
  FOR SELECT
  TO authenticated
  USING (true);
```

5. Klik **"Run"** atau tekan `Ctrl+Enter`

### Method 3: Menggunakan Supabase Studio (GUI)

1. Buka Supabase Dashboard
2. Klik **Table Editor** di sidebar
3. Klik **"New table"**
4. Isi form:
   ```
   Schema: sales (pilih atau buat baru)
   Name: customers
   Description: Customer data
   Enable RLS: ✓
   ```
5. Tambahkan columns dengan klik **"Add column"**:
   ```
   name: id | type: uuid | default: gen_random_uuid() | primary: ✓
   name: code | type: varchar | unique: ✓
   name: name | type: varchar
   name: created_at | type: timestamptz | default: now()
   ```
6. Klik **"Save"**

---

## 4. Menghubungkan Tables dengan Foreign Keys

### Cara 1: Via SQL

```sql
-- Contoh: Menghubungkan pipeline ke customers

-- 1. Buat table pipeline
CREATE TABLE sales.pipeline (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  opportunity_number VARCHAR(50) UNIQUE NOT NULL,
  opportunity_name VARCHAR(200) NOT NULL,
  
  -- Foreign Key ke customers
  customer_id UUID REFERENCES sales.customers(id),
  
  estimated_value DECIMAL(15,2),
  status VARCHAR(50) DEFAULT 'open',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Tambah foreign key ke table yang sudah ada
ALTER TABLE sales.pipeline 
  ADD CONSTRAINT fk_pipeline_customer
  FOREIGN KEY (customer_id) 
  REFERENCES sales.customers(id)
  ON DELETE SET NULL;  -- atau CASCADE, RESTRICT

-- 3. Buat index untuk foreign key (performance)
CREATE INDEX idx_pipeline_customer ON sales.pipeline(customer_id);
```

### Cara 2: Via Supabase Studio

1. Buka **Table Editor**
2. Pilih table **pipeline**
3. Klik column **customer_id**
4. Di panel kanan, scroll ke **Foreign Key Relation**
5. Isi:
   ```
   Related table: sales.customers
   Related column: id
   On delete: SET NULL
   ```
6. Klik **"Save"**

### Contoh Relationship Lengkap:

```sql
-- Lead Sources → Prospective Customers
CREATE TABLE sales.lead_sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_name VARCHAR(200) NOT NULL
);

CREATE TABLE sales.prospective_customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name VARCHAR(200) NOT NULL,
  lead_source_id UUID REFERENCES sales.lead_sources(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Regions → Prospective Customers
CREATE TABLE sales.regions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  region_name VARCHAR(200) NOT NULL
);

ALTER TABLE sales.prospective_customers 
  ADD COLUMN region_id UUID REFERENCES sales.regions(id);

-- Prospective Customers → Customers (conversion)
ALTER TABLE sales.prospective_customers 
  ADD COLUMN customer_id UUID REFERENCES sales.customers(id);

-- Pipeline Stages → Pipeline
CREATE TABLE sales.pipeline_stages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stage_name VARCHAR(200) NOT NULL,
  stage_order INTEGER NOT NULL
);

ALTER TABLE sales.pipeline 
  ADD COLUMN stage_id UUID REFERENCES sales.pipeline_stages(id) NOT NULL;

-- Pipeline → Pipeline Activities (One-to-Many)
CREATE TABLE sales.pipeline_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pipeline_id UUID REFERENCES sales.pipeline(id) ON DELETE CASCADE,
  activity_date TIMESTAMPTZ DEFAULT NOW(),
  activity_type VARCHAR(50) NOT NULL,
  description TEXT
);
```

---

## 5. Connect dari React/TypeScript

### Step 5.1: Install Supabase Client

```bash
npm install @supabase/supabase-js
```

### Step 5.2: Setup Supabase Client

Buat file `src/lib/supabase.ts`:

```typescript
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Optional: Type definitions
export type Database = {
  sales: {
    customers: {
      Row: {
        id: string
        code: string
        name: string
        phone: string | null
        email: string | null
        address: string | null
        is_active: boolean
        created_at: string
        updated_at: string
      }
      Insert: {
        id?: string
        code: string
        name: string
        phone?: string | null
        email?: string | null
        address?: string | null
        is_active?: boolean
        created_at?: string
        updated_at?: string
      }
      Update: {
        id?: string
        code?: string
        name?: string
        phone?: string | null
        email?: string | null
        address?: string | null
        is_active?: boolean
        updated_at?: string
      }
    }
    pipeline: {
      Row: {
        id: string
        opportunity_number: string
        opportunity_name: string
        customer_id: string | null
        stage_id: string
        estimated_value: number | null
        status: string
        created_at: string
      }
      // ... Insert & Update types
    }
  }
}
```

### Step 5.3: Generate TypeScript Types (Auto)

```bash
# Generate types dari database schema
supabase gen types typescript --linked > src/types/database.types.ts

# Atau untuk specific project
supabase gen types typescript --project-id xxxxx > src/types/database.types.ts
```

Gunakan generated types:

```typescript
import { Database } from './types/database.types'
import { createClient } from '@supabase/supabase-js'

export const supabase = createClient<Database>(
  supabaseUrl,
  supabaseAnonKey
)
```

---

## 6. CRUD Operations Examples

### 6.1: Create (Insert)

```typescript
// Single insert
const { data, error } = await supabase
  .from('sales.customers')
  .insert({
    code: 'CUST-001',
    name: 'PT. Contoh Indonesia',
    phone: '021-1234567',
    email: 'info@contoh.com',
    address: 'Jakarta'
  })
  .select()

if (error) console.error('Error:', error)
else console.log('Created:', data)

// Multiple insert
const { data, error } = await supabase
  .from('sales.lead_sources')
  .insert([
    { source_code: 'WEB', source_name: 'Website' },
    { source_code: 'REF', source_name: 'Referral' },
    { source_code: 'EVT', source_name: 'Event' }
  ])
  .select()
```

### 6.2: Read (Select)

```typescript
// Get all
const { data, error } = await supabase
  .from('sales.customers')
  .select('*')

// Get with filter
const { data, error } = await supabase
  .from('sales.customers')
  .select('*')
  .eq('is_active', true)
  .order('name', { ascending: true })

// Get with joins (foreign keys)
const { data, error } = await supabase
  .from('sales.pipeline')
  .select(`
    *,
    customer:customer_id (
      id,
      name,
      phone
    ),
    stage:stage_id (
      stage_name,
      stage_order
    )
  `)

// Get with pagination
const { data, error, count } = await supabase
  .from('sales.customers')
  .select('*', { count: 'exact' })
  .range(0, 9) // 10 items (0-9)

// Search
const { data, error } = await supabase
  .from('sales.customers')
  .select('*')
  .ilike('name', '%packaging%')
```

### 6.3: Update

```typescript
// Update single
const { data, error } = await supabase
  .from('sales.customers')
  .update({ 
    phone: '021-9999999',
    updated_at: new Date().toISOString()
  })
  .eq('id', customerId)
  .select()

// Update multiple
const { data, error } = await supabase
  .from('sales.customers')
  .update({ is_active: false })
  .eq('city', 'Jakarta')
  .select()
```

### 6.4: Delete

```typescript
// Soft delete (recommended)
const { data, error } = await supabase
  .from('sales.customers')
  .update({ is_active: false })
  .eq('id', customerId)

// Hard delete
const { data, error } = await supabase
  .from('sales.customers')
  .delete()
  .eq('id', customerId)
```

### 6.5: Complex Queries

```typescript
// Pipeline dengan customer dan activities
const { data, error } = await supabase
  .from('sales.pipeline')
  .select(`
    *,
    customer:sales.customers!customer_id (
      id,
      code,
      name,
      phone,
      email
    ),
    stage:sales.pipeline_stages!stage_id (
      stage_name,
      stage_order,
      probability_percentage
    ),
    activities:sales.pipeline_activities (
      id,
      activity_date,
      activity_type,
      subject,
      description
    )
  `)
  .eq('status', 'open')
  .order('expected_close_date', { ascending: true })

// Prospective customers dengan lead source dan region
const { data, error } = await supabase
  .from('sales.prospective_customers')
  .select(`
    *,
    lead_source:sales.lead_sources!lead_source_id (
      source_name,
      source_type
    ),
    region:sales.regions!region_id (
      region_name,
      province
    ),
    segment:sales.segments!segment_id (
      segment_name
    )
  `)
  .eq('status', 'qualified')
```

---

## 7. Row Level Security (RLS)

### Enable RLS

```sql
-- Enable RLS pada table
ALTER TABLE sales.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales.pipeline ENABLE ROW LEVEL SECURITY;
```

### Create Policies

```sql
-- Policy 1: Anyone authenticated can read
CREATE POLICY "authenticated_read_customers"
  ON sales.customers
  FOR SELECT
  TO authenticated
  USING (true);

-- Policy 2: Users can only update their own data
CREATE POLICY "users_update_own_pipeline"
  ON sales.pipeline
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = sales_person_id);

-- Policy 3: Specific role can do everything
CREATE POLICY "admins_all_access"
  ON sales.customers
  FOR ALL
  TO authenticated
  USING (
    auth.jwt() ->> 'role' = 'admin'
  );

-- Policy 4: Users can only see their region's data
CREATE POLICY "sales_see_own_region"
  ON sales.prospective_customers
  FOR SELECT
  TO authenticated
  USING (
    region_id IN (
      SELECT region_id 
      FROM sales.regions 
      WHERE sales_person_id = auth.uid()
    )
  );
```

### Bypass RLS (untuk service operations)

```typescript
// Use service_role key (server-side only!)
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  supabaseUrl,
  process.env.SUPABASE_SERVICE_ROLE_KEY!, // Server-side only!
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

// Admin client bypasses RLS
const { data } = await supabaseAdmin
  .from('sales.customers')
  .select('*') // Gets ALL data, ignoring RLS
```

---

## 8. Best Practices

### 8.1: Database Design

✅ **DO:**
- Gunakan UUID untuk primary keys
- Gunakan schemas untuk organisasi (sales, inventory, hrga, dll)
- Buat indexes untuk foreign keys dan frequently queried columns
- Gunakan TIMESTAMPTZ untuk timestamps
- Gunakan JSONB untuk flexible/dynamic data
- Buat audit trail (created_at, updated_at, created_by)

❌ **DON'T:**
- Jangan gunakan auto-increment IDs di distributed systems
- Jangan simpan data sensitif tanpa encryption
- Jangan skip foreign key constraints
- Jangan lupa enable RLS

### 8.2: Migrations

✅ **DO:**
- Gunakan migrations untuk semua schema changes
- Test migrations di local dulu
- Backup database sebelum migrate di production
- Buat migrations yang idempotent (`IF NOT EXISTS`, dll)
- Document setiap migration dengan comments

❌ **DON'T:**
- Jangan edit migration yang sudah di-apply
- Jangan skip migration order
- Jangan commit sensitive data di migrations

### 8.3: Queries

✅ **DO:**
- Gunakan `select()` untuk specify columns yang dibutuhkan
- Gunakan pagination untuk large datasets
- Gunakan indexes
- Batch operations ketika possible
- Handle errors properly

❌ **DON'T:**
- Jangan select `*` jika tidak perlu semua columns
- Jangan fetch semua data tanpa limit
- Jangan loop untuk individual queries (use batch)
- Jangan expose service_role key di client

### 8.4: Security

✅ **DO:**
- Enable RLS di semua tables
- Gunakan prepared statements
- Validate input di client & server
- Use authentication
- Implement proper policies

❌ **DON'T:**
- Jangan expose service_role key
- Jangan trust client-side validation saja
- Jangan hardcode credentials
- Jangan skip input sanitization

---

## 9. Contoh Lengkap: Customer Management

### Frontend Component

```typescript
// src/hooks/useCustomers.ts
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

export function useCustomers() {
  const [customers, setCustomers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchCustomers()
  }, [])

  async function fetchCustomers() {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('sales.customers')
        .select(`
          *,
          region:region_id (region_name),
          segment:segment_id (segment_name)
        `)
        .eq('is_active', true)
        .order('name', { ascending: true })

      if (error) throw error
      setCustomers(data || [])
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  async function createCustomer(customer: any) {
    const { data, error } = await supabase
      .from('sales.customers')
      .insert(customer)
      .select()

    if (error) throw error
    await fetchCustomers() // Refresh list
    return data[0]
  }

  async function updateCustomer(id: string, updates: any) {
    const { data, error } = await supabase
      .from('sales.customers')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()

    if (error) throw error
    await fetchCustomers()
    return data[0]
  }

  async function deleteCustomer(id: string) {
    const { error } = await supabase
      .from('sales.customers')
      .update({ is_active: false })
      .eq('id', id)

    if (error) throw error
    await fetchCustomers()
  }

  return {
    customers,
    loading,
    error,
    createCustomer,
    updateCustomer,
    deleteCustomer,
    refresh: fetchCustomers
  }
}
```

### Usage in Component

```typescript
// src/pages/sales/customers.tsx
import { useCustomers } from '@/hooks/useCustomers'

export function CustomersPage() {
  const { 
    customers, 
    loading, 
    error, 
    createCustomer, 
    updateCustomer 
  } = useCustomers()

  const handleSubmit = async (formData: any) => {
    try {
      await createCustomer({
        code: formData.code,
        name: formData.name,
        phone: formData.phone,
        email: formData.email,
        address: formData.address
      })
      // Show success message
    } catch (err) {
      // Show error
    }
  }

  if (loading) return <div>Loading...</div>
  if (error) return <div>Error: {error}</div>

  return (
    <div>
      {customers.map(customer => (
        <div key={customer.id}>
          {customer.name} - {customer.region?.region_name}
        </div>
      ))}
    </div>
  )
}
```

---

## 10. Troubleshooting

### Error: "permission denied for schema"
**Solution:** Grant permissions atau enable RLS policies

```sql
GRANT USAGE ON SCHEMA sales TO authenticated;
GRANT SELECT ON ALL TABLES IN SCHEMA sales TO authenticated;
```

### Error: "relation does not exist"
**Solution:** Pastikan schema name benar di query

```typescript
// ❌ Wrong
.from('customers')

// ✅ Correct
.from('sales.customers')
```

### Error: "foreign key constraint"
**Solution:** Pastikan referenced record exists

```sql
-- Check if customer exists before creating pipeline
SELECT EXISTS (
  SELECT 1 FROM sales.customers WHERE id = 'xxx'
);
```

---

## Resources

- **Supabase Docs**: https://supabase.com/docs
- **Supabase JS Client**: https://supabase.com/docs/reference/javascript
- **PostgreSQL Docs**: https://www.postgresql.org/docs/
- **Row Level Security**: https://supabase.com/docs/guides/auth/row-level-security

---

**Happy Coding! 🚀**
