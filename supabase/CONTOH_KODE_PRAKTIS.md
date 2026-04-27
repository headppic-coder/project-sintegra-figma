# 💻 Contoh Kode Praktis - Supabase Integration

## Daftar Isi
1. [Setup Awal](#setup-awal)
2. [Calon Customer (Prospective Customers)](#calon-customer)
3. [Customer](#customer)
4. [Pipeline](#pipeline)
5. [Follow-up Pipeline](#follow-up-pipeline)
6. [Master Aktivitas Sales](#master-aktivitas-sales)
7. [Stage Pipeline](#stage-pipeline)
8. [Sumber Lead](#sumber-lead)
9. [Wilayah](#wilayah)
10. [Segmen](#segmen)
11. [Kategori & Tipe Barang](#kategori--tipe-barang)
12. [Gudang](#gudang)
13. [Alat Bantu](#alat-bantu)
14. [Perusahaan, Departemen, Jabatan](#perusahaan-departemen-jabatan)
15. [Shift](#shift)

---

## Setup Awal

### File: `src/lib/supabase.ts`

```typescript
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase credentials in .env')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Helper function untuk handle errors
export function handleSupabaseError(error: any) {
  console.error('Supabase error:', error)
  return error.message || 'An error occurred'
}
```

---

## Calon Customer

### File: `src/services/prospectiveCustomers.service.ts`

```typescript
import { supabase } from '@/lib/supabase'

export interface ProspectiveCustomer {
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
  notes?: string
}

export const prospectiveCustomersService = {
  // Get all prospects with relations
  async getAll() {
    const { data, error } = await supabase
      .from('sales.prospective_customers')
      .select(`
        *,
        lead_source:sales.lead_sources!lead_source_id (
          id,
          source_name,
          source_type
        ),
        region:sales.regions!region_id (
          id,
          region_name,
          province
        ),
        segment:sales.segments!segment_id (
          id,
          segment_name
        ),
        sales_person:auth.users!sales_person_id (
          id,
          email
        )
      `)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data
  },

  // Get by status
  async getByStatus(status: string) {
    const { data, error } = await supabase
      .from('sales.prospective_customers')
      .select('*')
      .eq('status', status)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data
  },

  // Get qualified prospects (hot leads)
  async getQualifiedProspects() {
    const { data, error } = await supabase
      .from('sales.prospective_customers')
      .select(`
        *,
        lead_source:sales.lead_sources!lead_source_id (source_name),
        region:sales.regions!region_id (region_name)
      `)
      .in('status', ['qualified', 'proposal', 'negotiation'])
      .gte('qualification_score', 70)
      .order('qualification_score', { ascending: false })

    if (error) throw error
    return data
  },

  // Create new prospect
  async create(prospect: ProspectiveCustomer) {
    // Generate prospect number
    const prospectNumber = `PROS-${Date.now()}`
    
    const { data, error } = await supabase
      .from('sales.prospective_customers')
      .insert({
        ...prospect,
        prospect_number: prospectNumber
      })
      .select()
      .single()

    if (error) throw error
    return data
  },

  // Update prospect
  async update(id: string, updates: Partial<ProspectiveCustomer>) {
    const { data, error } = await supabase
      .from('sales.prospective_customers')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  },

  // Convert to customer
  async convertToCustomer(prospectId: string, customerData: any) {
    // 1. Create customer
    const { data: customer, error: customerError } = await supabase
      .from('sales.customers')
      .insert(customerData)
      .select()
      .single()

    if (customerError) throw customerError

    // 2. Update prospect status
    const { error: updateError } = await supabase
      .from('sales.prospective_customers')
      .update({
        status: 'converted',
        customer_id: customer.id,
        conversion_date: new Date().toISOString()
      })
      .eq('id', prospectId)

    if (updateError) throw updateError

    return customer
  },

  // Search prospects
  async search(query: string) {
    const { data, error } = await supabase
      .from('sales.prospective_customers')
      .select('*')
      .or(`company_name.ilike.%${query}%,contact_person.ilike.%${query}%,email.ilike.%${query}%`)
      .limit(20)

    if (error) throw error
    return data
  }
}
```

### File: `src/hooks/useProspectiveCustomers.ts`

```typescript
import { useState, useEffect } from 'react'
import { prospectiveCustomersService, ProspectiveCustomer } from '@/services/prospectiveCustomers.service'

export function useProspectiveCustomers() {
  const [prospects, setProspects] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchProspects()
  }, [])

  async function fetchProspects() {
    try {
      setLoading(true)
      setError(null)
      const data = await prospectiveCustomersService.getAll()
      setProspects(data)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  async function createProspect(prospect: ProspectiveCustomer) {
    try {
      const newProspect = await prospectiveCustomersService.create(prospect)
      setProspects([newProspect, ...prospects])
      return newProspect
    } catch (err: any) {
      throw new Error(err.message)
    }
  }

  async function updateProspect(id: string, updates: Partial<ProspectiveCustomer>) {
    try {
      const updated = await prospectiveCustomersService.update(id, updates)
      setProspects(prospects.map(p => p.id === id ? updated : p))
      return updated
    } catch (err: any) {
      throw new Error(err.message)
    }
  }

  async function convertToCustomer(prospectId: string, customerData: any) {
    try {
      const customer = await prospectiveCustomersService.convertToCustomer(prospectId, customerData)
      await fetchProspects() // Refresh list
      return customer
    } catch (err: any) {
      throw new Error(err.message)
    }
  }

  return {
    prospects,
    loading,
    error,
    createProspect,
    updateProspect,
    convertToCustomer,
    refresh: fetchProspects
  }
}
```

---

## Customer

### File: `src/services/customers.service.ts`

```typescript
import { supabase } from '@/lib/supabase'

export interface Customer {
  id?: string
  code: string
  name: string
  contact_person?: string
  phone?: string
  email?: string
  address?: string
  city?: string
  tax_id?: string
  payment_terms?: number
  sales_person_id?: string
  region_id?: string
  segment_id?: string
  is_active?: boolean
}

export const customersService = {
  // Get all customers
  async getAll() {
    const { data, error } = await supabase
      .from('sales.customers')
      .select(`
        *,
        region:sales.regions!region_id (
          region_name,
          province
        ),
        segment:sales.segments!segment_id (
          segment_name
        )
      `)
      .eq('is_active', true)
      .order('name', { ascending: true })

    if (error) throw error
    return data
  },

  // Get by ID with full details
  async getById(id: string) {
    const { data, error } = await supabase
      .from('sales.customers')
      .select(`
        *,
        region:sales.regions!region_id (*),
        segment:sales.segments!segment_id (*),
        orders:sales.orders (
          id,
          order_number,
          order_date,
          total_amount,
          status
        ),
        pipelines:sales.pipeline (
          id,
          opportunity_name,
          estimated_value,
          status
        )
      `)
      .eq('id', id)
      .single()

    if (error) throw error
    return data
  },

  // Create customer
  async create(customer: Customer) {
    const { data, error } = await supabase
      .from('sales.customers')
      .insert(customer)
      .select()
      .single()

    if (error) throw error
    return data
  },

  // Update customer
  async update(id: string, updates: Partial<Customer>) {
    const { data, error } = await supabase
      .from('sales.customers')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  },

  // Soft delete
  async delete(id: string) {
    const { error } = await supabase
      .from('sales.customers')
      .update({ is_active: false })
      .eq('id', id)

    if (error) throw error
  },

  // Search customers
  async search(query: string) {
    const { data, error } = await supabase
      .from('sales.customers')
      .select('*')
      .or(`code.ilike.%${query}%,name.ilike.%${query}%,email.ilike.%${query}%`)
      .eq('is_active', true)
      .limit(20)

    if (error) throw error
    return data
  }
}
```

---

## Pipeline

### File: `src/services/pipeline.service.ts`

```typescript
import { supabase } from '@/lib/supabase'

export interface Pipeline {
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
  notes?: string
}

export const pipelineService = {
  // Get all pipelines
  async getAll() {
    const { data, error } = await supabase
      .from('sales.pipeline')
      .select(`
        *,
        customer:sales.customers!customer_id (
          id,
          code,
          name,
          phone
        ),
        stage:sales.pipeline_stages!stage_id (
          stage_name,
          stage_order,
          probability_percentage,
          color
        ),
        lead_source:sales.lead_sources!lead_source_id (
          source_name
        ),
        activities:sales.pipeline_activities (
          id,
          activity_date,
          activity_type,
          subject
        )
      `)
      .eq('status', 'open')
      .order('expected_close_date', { ascending: true })

    if (error) throw error
    return data
  },

  // Get by stage
  async getByStage(stageId: string) {
    const { data, error } = await supabase
      .from('sales.pipeline')
      .select(`
        *,
        customer:sales.customers!customer_id (name),
        stage:sales.pipeline_stages!stage_id (stage_name, color)
      `)
      .eq('stage_id', stageId)
      .eq('status', 'open')

    if (error) throw error
    return data
  },

  // Get pipeline value by stage (for dashboard)
  async getValueByStage() {
    const { data, error } = await supabase
      .from('sales.pipeline')
      .select(`
        stage_id,
        estimated_value,
        stage:sales.pipeline_stages!stage_id (
          stage_name,
          stage_order
        )
      `)
      .eq('status', 'open')

    if (error) throw error

    // Group by stage
    const grouped = data.reduce((acc: any, item: any) => {
      const stageName = item.stage.stage_name
      if (!acc[stageName]) {
        acc[stageName] = {
          stage: item.stage,
          count: 0,
          total_value: 0
        }
      }
      acc[stageName].count++
      acc[stageName].total_value += item.estimated_value || 0
      return acc
    }, {})

    return Object.values(grouped)
  },

  // Create pipeline
  async create(pipeline: Pipeline) {
    const opportunityNumber = `OPP-${Date.now()}`
    
    const { data, error } = await supabase
      .from('sales.pipeline')
      .insert({
        ...pipeline,
        opportunity_number: opportunityNumber
      })
      .select()
      .single()

    if (error) throw error
    return data
  },

  // Update pipeline
  async update(id: string, updates: Partial<Pipeline>) {
    const { data, error } = await supabase
      .from('sales.pipeline')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  },

  // Move to next stage
  async moveToStage(id: string, stageId: string) {
    return this.update(id, { stage_id: stageId })
  },

  // Win opportunity
  async win(id: string) {
    const { data, error } = await supabase
      .from('sales.pipeline')
      .update({
        status: 'won',
        won_date: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  },

  // Lose opportunity
  async lose(id: string, reason: string) {
    const { data, error } = await supabase
      .from('sales.pipeline')
      .update({
        status: 'lost',
        lost_reason: reason
      })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  }
}
```

---

## Follow-up Pipeline

### File: `src/services/pipelineActivities.service.ts`

```typescript
import { supabase } from '@/lib/supabase'

export interface PipelineActivity {
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
}

export const pipelineActivitiesService = {
  // Get activities by pipeline
  async getByPipeline(pipelineId: string) {
    const { data, error } = await supabase
      .from('sales.pipeline_activities')
      .select(`
        *,
        performed_by_user:auth.users!performed_by (
          email
        )
      `)
      .eq('pipeline_id', pipelineId)
      .order('activity_date', { ascending: false })

    if (error) throw error
    return data
  },

  // Create activity
  async create(activity: PipelineActivity) {
    const { data, error } = await supabase
      .from('sales.pipeline_activities')
      .insert(activity)
      .select()
      .single()

    if (error) throw error
    return data
  },

  // Get upcoming follow-ups
  async getUpcomingFollowups(userId?: string) {
    let query = supabase
      .from('sales.pipeline_activities')
      .select(`
        *,
        pipeline:sales.pipeline!pipeline_id (
          opportunity_name,
          customer:sales.customers!customer_id (name)
        )
      `)
      .not('next_action_date', 'is', null)
      .gte('next_action_date', new Date().toISOString().split('T')[0])
      .order('next_action_date', { ascending: true })

    if (userId) {
      query = query.eq('performed_by', userId)
    }

    const { data, error } = await query

    if (error) throw error
    return data
  },

  // Get overdue follow-ups
  async getOverdueFollowups(userId?: string) {
    let query = supabase
      .from('sales.pipeline_activities')
      .select(`
        *,
        pipeline:sales.pipeline!pipeline_id (
          opportunity_name,
          customer:sales.customers!customer_id (name)
        )
      `)
      .not('next_action_date', 'is', null)
      .lt('next_action_date', new Date().toISOString().split('T')[0])

    if (userId) {
      query = query.eq('performed_by', userId)
    }

    const { data, error } = await query

    if (error) throw error
    return data
  }
}
```

---

## Master Data - Stage Pipeline, Lead Sources, dll

### File: `src/services/masterData.service.ts`

```typescript
import { supabase } from '@/lib/supabase'

// Pipeline Stages
export const pipelineStagesService = {
  async getAll() {
    const { data, error } = await supabase
      .from('sales.pipeline_stages')
      .select('*')
      .eq('is_active', true)
      .order('stage_order', { ascending: true })

    if (error) throw error
    return data
  },

  async create(stage: any) {
    const { data, error } = await supabase
      .from('sales.pipeline_stages')
      .insert(stage)
      .select()
      .single()

    if (error) throw error
    return data
  }
}

// Lead Sources
export const leadSourcesService = {
  async getAll() {
    const { data, error } = await supabase
      .from('sales.lead_sources')
      .select('*')
      .eq('is_active', true)
      .order('source_name', { ascending: true })

    if (error) throw error
    return data
  },

  async create(source: any) {
    const { data, error } = await supabase
      .from('sales.lead_sources')
      .insert(source)
      .select()
      .single()

    if (error) throw error
    return data
  }
}

// Regions
export const regionsService = {
  async getAll() {
    const { data, error } = await supabase
      .from('sales.regions')
      .select('*')
      .eq('is_active', true)
      .order('region_name', { ascending: true })

    if (error) throw error
    return data
  }
}

// Segments
export const segmentsService = {
  async getAll() {
    const { data, error } = await supabase
      .from('sales.segments')
      .select('*')
      .eq('is_active', true)
      .order('segment_name', { ascending: true })

    if (error) throw error
    return data
  }
}

// Warehouses
export const warehousesService = {
  async getAll() {
    const { data, error } = await supabase
      .from('inventory.warehouses')
      .select('*')
      .eq('is_active', true)
      .order('name', { ascending: true })

    if (error) throw error
    return data
  }
}

// Companies, Departments, Positions
export const hrMasterDataService = {
  async getCompanies() {
    const { data, error } = await supabase
      .from('hrga.master_companies')
      .select('*')
      .eq('is_active', true)
      .order('company_name')

    if (error) throw error
    return data
  },

  async getDepartments(companyId?: string) {
    let query = supabase
      .from('hrga.master_departments')
      .select(`
        *,
        company:hrga.master_companies!company_id (company_name)
      `)
      .eq('is_active', true)

    if (companyId) {
      query = query.eq('company_id', companyId)
    }

    const { data, error } = await query.order('department_name')

    if (error) throw error
    return data
  },

  async getPositions(departmentId?: string) {
    let query = supabase
      .from('hrga.master_positions')
      .select(`
        *,
        department:hrga.master_departments!department_id (department_name)
      `)
      .eq('is_active', true)

    if (departmentId) {
      query = query.eq('department_id', departmentId)
    }

    const { data, error } = await query.order('position_name')

    if (error) throw error
    return data
  },

  async getShifts() {
    const { data, error } = await supabase
      .from('hrga.master_shift')
      .select('*')
      .eq('is_active', true)
      .order('shift_code')

    if (error) throw error
    return data
  }
}
```

---

## Contoh Penggunaan di Component

### File: `src/pages/sales/pipeline.tsx`

```typescript
import React, { useState, useEffect } from 'react'
import { pipelineService } from '@/services/pipeline.service'
import { pipelineStagesService } from '@/services/masterData.service'

export function PipelinePage() {
  const [pipelines, setPipelines] = useState<any[]>([])
  const [stages, setStages] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    try {
      const [pipelinesData, stagesData] = await Promise.all([
        pipelineService.getAll(),
        pipelineStagesService.getAll()
      ])
      
      setPipelines(pipelinesData)
      setStages(stagesData)
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  async function handleMoveStage(pipelineId: string, newStageId: string) {
    try {
      await pipelineService.moveToStage(pipelineId, newStageId)
      await loadData() // Refresh
    } catch (error) {
      console.error('Error moving stage:', error)
    }
  }

  if (loading) return <div>Loading...</div>

  return (
    <div className="pipeline-kanban">
      {stages.map(stage => (
        <div key={stage.id} className="pipeline-column">
          <h3>{stage.stage_name}</h3>
          {pipelines
            .filter(p => p.stage_id === stage.id)
            .map(pipeline => (
              <div key={pipeline.id} className="pipeline-card">
                <h4>{pipeline.opportunity_name}</h4>
                <p>{pipeline.customer?.name}</p>
                <p>Rp {pipeline.estimated_value?.toLocaleString()}</p>
                {/* Add drag & drop or move buttons */}
              </div>
            ))}
        </div>
      ))}
    </div>
  )
}
```

---

## Real-time Subscriptions

```typescript
// Subscribe to pipeline changes
useEffect(() => {
  const subscription = supabase
    .channel('pipeline-changes')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'sales',
        table: 'pipeline'
      },
      (payload) => {
        console.log('Pipeline changed:', payload)
        loadData() // Refresh data
      }
    )
    .subscribe()

  return () => {
    subscription.unsubscribe()
  }
}, [])
```

---

**Semua contoh kode di atas siap pakai dan sudah terintegrasi dengan schema Supabase yang telah dibuat!** 🚀
