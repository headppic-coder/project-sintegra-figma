# 🚀 Quick Reference - Supabase Database

## Table of Contents
- [Connection Strings](#connection-strings)
- [Common Queries](#common-queries)
- [Table Names Quick Reference](#table-names-quick-reference)
- [TypeScript Type Examples](#typescript-type-examples)
- [Common Patterns](#common-patterns)
- [Troubleshooting](#troubleshooting)

---

## Connection Strings

### Environment Variables
```bash
# .env.local
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc... # Server-side only!
```

### Supabase Client
```typescript
import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.VITE_SUPABASE_ANON_KEY!
)
```

---

## Common Queries

### Calon Customer (Prospective Customers)

```typescript
// Get all with relations
const { data } = await supabase
  .from('sales.prospective_customers')
  .select(`
    *,
    lead_source:sales.lead_sources!lead_source_id(source_name),
    region:sales.regions!region_id(region_name)
  `)

// Get qualified prospects
const { data } = await supabase
  .from('sales.prospective_customers')
  .select('*')
  .in('status', ['qualified', 'proposal'])
  .gte('qualification_score', 70)

// Convert to customer
const { data: customer } = await supabase
  .from('sales.customers')
  .insert({ /* customer data */ })
  .select()
  .single()

await supabase
  .from('sales.prospective_customers')
  .update({ 
    status: 'converted',
    customer_id: customer.id 
  })
  .eq('id', prospectId)
```

### Customer

```typescript
// Get all active customers
const { data } = await supabase
  .from('sales.customers')
  .select('*')
  .eq('is_active', true)
  .order('name')

// Get with region and segment
const { data } = await supabase
  .from('sales.customers')
  .select(`
    *,
    region:sales.regions!region_id(*),
    segment:sales.segments!segment_id(*)
  `)

// Search by name/code
const { data } = await supabase
  .from('sales.customers')
  .select('*')
  .or(`code.ilike.%${query}%,name.ilike.%${query}%`)
```

### Pipeline

```typescript
// Get all open pipelines
const { data } = await supabase
  .from('sales.pipeline')
  .select(`
    *,
    customer:sales.customers!customer_id(name),
    stage:sales.pipeline_stages!stage_id(stage_name, color)
  `)
  .eq('status', 'open')

// Get by stage
const { data } = await supabase
  .from('sales.pipeline')
  .select('*')
  .eq('stage_id', stageId)

// Move to next stage
await supabase
  .from('sales.pipeline')
  .update({ stage_id: newStageId })
  .eq('id', pipelineId)

// Win opportunity
await supabase
  .from('sales.pipeline')
  .update({ 
    status: 'won',
    won_date: new Date().toISOString()
  })
  .eq('id', pipelineId)
```

### Pipeline Activities (Follow-up)

```typescript
// Add activity
await supabase
  .from('sales.pipeline_activities')
  .insert({
    pipeline_id: pipelineId,
    activity_type: 'call',
    subject: 'Follow-up call',
    description: 'Discussed pricing',
    next_action: 'Send proposal',
    next_action_date: '2026-04-20'
  })

// Get upcoming follow-ups
const { data } = await supabase
  .from('sales.pipeline_activities')
  .select(`
    *,
    pipeline:sales.pipeline!pipeline_id(
      opportunity_name,
      customer:sales.customers!customer_id(name)
    )
  `)
  .gte('next_action_date', new Date().toISOString().split('T')[0])
  .order('next_action_date')
```

### Master Data

```typescript
// Get all lead sources
const { data } = await supabase
  .from('sales.lead_sources')
  .select('*')
  .eq('is_active', true)

// Get all regions
const { data } = await supabase
  .from('sales.regions')
  .select('*')
  .order('region_name')

// Get all pipeline stages
const { data } = await supabase
  .from('sales.pipeline_stages')
  .select('*')
  .order('stage_order')

// Get all segments
const { data } = await supabase
  .from('sales.segments')
  .select('*')

// Get warehouses
const { data } = await supabase
  .from('inventory.warehouses')
  .select('*')
  .eq('is_active', true)

// Get companies
const { data } = await supabase
  .from('hrga.master_companies')
  .select('*')

// Get departments
const { data } = await supabase
  .from('hrga.master_departments')
  .select(`
    *,
    company:hrga.master_companies!company_id(company_name)
  `)

// Get positions
const { data } = await supabase
  .from('hrga.master_positions')
  .select(`
    *,
    department:hrga.master_departments!department_id(department_name)
  `)

// Get shifts
const { data } = await supabase
  .from('hrga.master_shift')
  .select('*')
  .order('shift_code')
```

---

## Table Names Quick Reference

### Sales Module
```typescript
'sales.prospective_customers'   // Calon Customer
'sales.customers'               // Customer
'sales.pipeline'                // Pipeline (Opportunities)
'sales.pipeline_activities'     // Follow-up Pipeline
'sales.sales_activities'        // Master Aktivitas Sales
'sales.pipeline_stages'         // Stage Pipeline
'sales.lead_sources'            // Sumber Lead
'sales.regions'                 // Wilayah
'sales.segments'                // Segmen
'sales.industry_categories'     // Kategori Industri
'sales.quotations'              // Penawaran
'sales.orders'                  // Sales Order
```

### Master Data
```typescript
'master.categories'             // Kategori Barang
'master.product_types'          // Tipe Barang
'master.materials'              // Data Material
'master.process_costs'          // Biaya Proses
'master.settings'               // Pengaturan
```

### Inventory
```typescript
'inventory.warehouses'          // Gudang
'inventory.tool_registry'       // Alat Bantu
'inventory.stock'               // Stock
'inventory.item_requests'       // Permintaan Barang
'inventory.item_receipts'       // Penerimaan Barang
```

### HRGA
```typescript
'hrga.master_companies'         // Perusahaan
'hrga.master_departments'       // Departemen
'hrga.master_positions'         // Jabatan
'hrga.master_shift'             // Shift
'hrga.employees'                // Karyawan
'hrga.recruitment'              // Rekrutmen
'hrga.assets'                   // Asset Perusahaan
```

---

## TypeScript Type Examples

### Prospective Customer
```typescript
interface ProspectiveCustomer {
  id?: string
  prospect_number: string
  company_name: string
  contact_person?: string
  phone?: string
  email?: string
  address?: string
  lead_source_id?: string
  region_id?: string
  segment_id?: string
  sales_person_id?: string
  estimated_potential?: number
  status: 'new' | 'contacted' | 'qualified' | 'proposal' | 'negotiation' | 'converted' | 'lost'
  qualification_score?: number
  customer_id?: string
  created_at?: string
  updated_at?: string
}
```

### Customer
```typescript
interface Customer {
  id?: string
  code: string
  name: string
  contact_person?: string
  phone?: string
  email?: string
  address?: string
  city?: string
  region_id?: string
  segment_id?: string
  sales_person_id?: string
  is_active?: boolean
  created_at?: string
  updated_at?: string
}
```

### Pipeline
```typescript
interface Pipeline {
  id?: string
  opportunity_number: string
  opportunity_name: string
  customer_id?: string
  stage_id: string
  estimated_value?: number
  probability_percentage?: number
  expected_close_date?: string
  lead_source_id?: string
  sales_person_id?: string
  status: 'open' | 'won' | 'lost' | 'cancelled'
  won_date?: string
  lost_reason?: string
  notes?: string
  created_at?: string
  updated_at?: string
}
```

### Pipeline Activity
```typescript
interface PipelineActivity {
  id?: string
  pipeline_id: string
  activity_date?: string
  activity_type: 'call' | 'email' | 'meeting' | 'presentation' | 'proposal' | 'follow_up'
  subject: string
  description?: string
  outcome?: string
  next_action?: string
  next_action_date?: string
  performed_by?: string
  created_at?: string
}
```

---

## Common Patterns

### Pagination
```typescript
const pageSize = 10
const page = 1

const { data, count } = await supabase
  .from('sales.customers')
  .select('*', { count: 'exact' })
  .range((page - 1) * pageSize, page * pageSize - 1)

const totalPages = Math.ceil((count || 0) / pageSize)
```

### Filtering
```typescript
// Single filter
.eq('is_active', true)
.neq('status', 'cancelled')
.gt('estimated_value', 1000000)
.gte('created_at', '2026-01-01')
.lt('probability', 50)
.lte('score', 100)

// Multiple filters (AND)
.eq('is_active', true)
.eq('status', 'open')

// OR filters
.or('status.eq.won,status.eq.open')
.or(`name.ilike.%${query}%,email.ilike.%${query}%`)

// IN filter
.in('status', ['new', 'contacted', 'qualified'])

// IS NULL / NOT NULL
.is('customer_id', null)
.not('customer_id', 'is', null)
```

### Sorting
```typescript
.order('created_at', { ascending: false })
.order('name', { ascending: true })

// Multiple sorts
.order('status', { ascending: true })
.order('created_at', { ascending: false })
```

### Joins (Relations)
```typescript
// One-to-One / Many-to-One
.select(`
  *,
  region:sales.regions!region_id(*)
`)

// One-to-Many
.select(`
  *,
  activities:sales.pipeline_activities(*)
`)

// Multiple relations
.select(`
  *,
  customer:sales.customers!customer_id(name, phone),
  stage:sales.pipeline_stages!stage_id(stage_name, color),
  activities:sales.pipeline_activities(
    activity_date,
    activity_type,
    subject
  )
`)
```

### Counting
```typescript
// Count all
const { count } = await supabase
  .from('sales.customers')
  .select('*', { count: 'exact', head: true })

// Count with filter
const { count } = await supabase
  .from('sales.pipeline')
  .select('*', { count: 'exact', head: true })
  .eq('status', 'open')
```

### Aggregations
```typescript
// Sum, avg, etc using views or functions
const { data } = await supabase
  .rpc('get_pipeline_value_by_stage')

// Or manually aggregate in JS
const pipelines = await supabase
  .from('sales.pipeline')
  .select('estimated_value, stage_id')
  .eq('status', 'open')

const totalValue = pipelines.data?.reduce(
  (sum, p) => sum + (p.estimated_value || 0), 
  0
)
```

### Upsert (Insert or Update)
```typescript
await supabase
  .from('sales.customers')
  .upsert({
    code: 'CUST-001',
    name: 'PT. Example',
    // ... other fields
  }, {
    onConflict: 'code' // column to check for conflicts
  })
```

### Batch Operations
```typescript
// Bulk insert
const { data, error } = await supabase
  .from('sales.lead_sources')
  .insert([
    { source_code: 'WEB', source_name: 'Website' },
    { source_code: 'REF', source_name: 'Referral' },
    { source_code: 'EVT', source_name: 'Event' }
  ])

// Bulk update
const { data, error } = await supabase
  .from('sales.pipeline')
  .update({ stage_id: newStageId })
  .in('id', [id1, id2, id3])
```

### Transactions
```typescript
// Use RPC for complex transactions
await supabase.rpc('convert_prospect_to_customer', {
  prospect_id: prospectId,
  customer_data: customerData
})

// Or handle in application code
try {
  // Step 1
  const { data: customer } = await supabase
    .from('sales.customers')
    .insert(customerData)
    .select()
    .single()

  // Step 2
  await supabase
    .from('sales.prospective_customers')
    .update({ 
      status: 'converted',
      customer_id: customer.id 
    })
    .eq('id', prospectId)

  return customer
} catch (error) {
  // Handle error
  throw error
}
```

### Real-time Subscriptions
```typescript
// Subscribe to changes
const subscription = supabase
  .channel('pipeline-changes')
  .on(
    'postgres_changes',
    {
      event: 'INSERT',
      schema: 'sales',
      table: 'pipeline'
    },
    (payload) => {
      console.log('New pipeline:', payload.new)
    }
  )
  .subscribe()

// Unsubscribe
subscription.unsubscribe()
```

---

## Troubleshooting

### Error: "relation does not exist"
```typescript
// ❌ Wrong
.from('customers')

// ✅ Correct
.from('sales.customers')
```

### Error: "permission denied"
```sql
-- Check RLS policies
SELECT * FROM pg_policies WHERE tablename = 'customers';

-- Grant permissions
GRANT SELECT ON sales.customers TO authenticated;
```

### Error: "foreign key violation"
```typescript
// Ensure referenced record exists
const { data: customer } = await supabase
  .from('sales.customers')
  .select('id')
  .eq('id', customerId)
  .single()

if (!customer) {
  throw new Error('Customer not found')
}
```

### No data returned
```typescript
// Check if you're authenticated
const { data: { user } } = await supabase.auth.getUser()
console.log('Current user:', user)

// Check RLS policies
// Try with service_role key (server-side only)
```

---

## CLI Commands Cheat Sheet

```bash
# Login
supabase login

# Link project
supabase link --project-ref xxxxx

# Check status
supabase status

# List migrations
supabase migration list

# Create new migration
supabase migration new my_migration_name

# Apply migrations
supabase db push

# Reset database (local)
supabase db reset

# Generate TypeScript types
supabase gen types typescript --linked > src/types/database.types.ts

# Start local dev
supabase start

# Stop local dev
supabase stop
```

---

## Performance Tips

1. **Always use indexes on foreign keys**
   ```sql
   CREATE INDEX idx_pipeline_customer ON sales.pipeline(customer_id);
   ```

2. **Select only needed columns**
   ```typescript
   // ❌ Slow
   .select('*')
   
   // ✅ Fast
   .select('id, name, email')
   ```

3. **Use pagination for large datasets**
   ```typescript
   .range(0, 49) // First 50 items
   ```

4. **Use `.single()` when expecting one result**
   ```typescript
   .eq('id', customerId)
   .single()
   ```

5. **Batch operations instead of loops**
   ```typescript
   // ❌ Slow
   for (const id of ids) {
     await supabase.from('...').update(...).eq('id', id)
   }
   
   // ✅ Fast
   await supabase.from('...').update(...).in('id', ids)
   ```

---

**Happy Coding! 🚀**

For more details, see:
- `SUPABASE_SETUP_TUTORIAL.md` - Complete tutorial
- `CONTOH_KODE_PRAKTIS.md` - Practical examples
- `DIAGRAM_RELATIONSHIPS.md` - Table relationships
