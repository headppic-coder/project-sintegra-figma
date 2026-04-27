# 📊 Diagram Relationships - Database Schema

## Overview Relationship Map

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         SALES MODULE FLOW                                │
└─────────────────────────────────────────────────────────────────────────┘

┌──────────────────┐
│  Lead Sources    │───┐
│ (Sumber Lead)    │   │
└──────────────────┘   │
                       │    ┌────────────────────────┐
┌──────────────────┐   ├───▶│ Prospective Customers  │
│    Regions       │───┤    │   (Calon Customer)     │
│   (Wilayah)      │   │    └────────┬───────────────┘
└──────────────────┘   │             │
                       │             │ Convert
┌──────────────────┐   │             │
│    Segments      │───┘             ▼
│   (Segmen)       │           ┌────────────┐
└──────────────────┘           │ Customers  │◀───┐
                               │            │    │
                               └──────┬─────┘    │
                                      │          │
                                      ▼          │
                         ┌────────────────────┐  │
                         │     Pipeline       │  │
                         │ (Sales Opportunity)│──┘
                         └─────────┬──────────┘
                                   │
                                   ├─────┐
                                   │     │
                    ┌──────────────▼┐   ┌▼──────────────────┐
                    │ Pipeline      │   │ Pipeline          │
                    │ Activities    │   │ Stages            │
                    │ (Follow-up)   │   │ (Stage Pipeline)  │
                    └───────────────┘   └───────────────────┘
```

---

## Detailed Table Relationships

### 1. Prospective Customers (Calon Customer)

```sql
┌─────────────────────────────────┐
│ sales.prospective_customers     │
├─────────────────────────────────┤
│ • id (PK)                       │
│ • prospect_number               │
│ • company_name                  │
│ • lead_source_id (FK) ─────────┼───▶ sales.lead_sources
│ • region_id (FK) ──────────────┼───▶ sales.regions
│ • segment_id (FK) ─────────────┼───▶ sales.segments
│ • sales_person_id (FK) ────────┼───▶ auth.users
│ • customer_id (FK) ────────────┼───▶ sales.customers (when converted)
│ • status                        │
│ • created_at                    │
└─────────────────────────────────┘
```

**Query Example:**
```sql
SELECT 
  pc.*,
  ls.source_name,
  r.region_name,
  s.segment_name,
  c.name as customer_name
FROM sales.prospective_customers pc
LEFT JOIN sales.lead_sources ls ON pc.lead_source_id = ls.id
LEFT JOIN sales.regions r ON pc.region_id = r.id
LEFT JOIN sales.segments s ON pc.segment_id = s.id
LEFT JOIN sales.customers c ON pc.customer_id = c.id;
```

---

### 2. Customers

```sql
┌─────────────────────────────────┐
│ sales.customers                 │
├─────────────────────────────────┤
│ • id (PK)                       │
│ • code                          │
│ • name                          │
│ • region_id (FK) ──────────────┼───▶ sales.regions
│ • segment_id (FK) ─────────────┼───▶ sales.segments
│ • sales_person_id (FK) ────────┼───▶ auth.users
│ • created_at                    │
└─────────────────────────────────┘
        │
        │ Referenced by:
        ├───▶ sales.pipeline
        ├───▶ sales.orders
        ├───▶ sales.quotations
        └───▶ design.design_requests
```

---

### 3. Pipeline (Sales Opportunities)

```sql
┌─────────────────────────────────┐
│ sales.pipeline                  │
├─────────────────────────────────┤
│ • id (PK)                       │
│ • opportunity_number            │
│ • customer_id (FK) ────────────┼───▶ sales.customers
│ • stage_id (FK) ───────────────┼───▶ sales.pipeline_stages
│ • lead_source_id (FK) ─────────┼───▶ sales.lead_sources
│ • sales_person_id (FK) ────────┼───▶ auth.users
│ • estimated_value               │
│ • status                        │
└─────────────────────────────────┘
        │
        └───▶ sales.pipeline_activities (1:N)
```

**Complete Pipeline Query:**
```sql
SELECT 
  p.*,
  c.name as customer_name,
  ps.stage_name,
  ps.stage_order,
  ps.probability_percentage,
  ls.source_name,
  COUNT(pa.id) as activities_count
FROM sales.pipeline p
LEFT JOIN sales.customers c ON p.customer_id = c.id
LEFT JOIN sales.pipeline_stages ps ON p.stage_id = ps.id
LEFT JOIN sales.lead_sources ls ON p.lead_source_id = ls.id
LEFT JOIN sales.pipeline_activities pa ON p.id = pa.pipeline_id
GROUP BY p.id, c.name, ps.stage_name, ps.stage_order, ps.probability_percentage, ls.source_name;
```

---

### 4. Pipeline Activities (Follow-up)

```sql
┌─────────────────────────────────┐
│ sales.pipeline_activities       │
├─────────────────────────────────┤
│ • id (PK)                       │
│ • pipeline_id (FK) ────────────┼───▶ sales.pipeline
│ • activity_type                 │
│ • subject                       │
│ • next_action_date              │
│ • performed_by (FK) ───────────┼───▶ auth.users
└─────────────────────────────────┘
```

---

### 5. Master Data Relationships

```sql
┌──────────────────┐
│ lead_sources     │       ┌──────────────────┐
│                  │◀──────│ prospective_     │
└──────────────────┘       │ customers        │
                           └──────────────────┘
┌──────────────────┐              │
│ regions          │◀─────────────┤
│                  │              │
└──────────────────┘              │
                                  │
┌──────────────────┐              │
│ segments         │◀─────────────┤
│                  │              │
└──────────────────┘              │
                                  ▼
┌──────────────────┐       ┌──────────────────┐
│ pipeline_stages  │◀──────│ customers        │
│                  │       │                  │
└──────────────────┘       └──────────────────┘
         ▲                        │
         │                        ▼
         │                 ┌──────────────────┐
         └─────────────────│ pipeline         │
                           └──────────────────┘
```

---

### 6. Inventory Module

```sql
┌────────────────────────────────────────┐
│ inventory.warehouses (Gudang)          │
├────────────────────────────────────────┤
│ • id (PK)                              │
│ • code                                 │
│ • name                                 │
└────────────────────────────────────────┘
        │
        │ Referenced by:
        ├───▶ inventory.stock
        ├───▶ inventory.tool_registry (Alat Bantu)
        └───▶ inventory.item_receipts

┌────────────────────────────────────────┐
│ inventory.tool_registry (Alat Bantu)   │
├────────────────────────────────────────┤
│ • id (PK)                              │
│ • tool_code                            │
│ • tool_name                            │
│ • warehouse_id (FK) ───────────────────┼───▶ inventory.warehouses
│ • assigned_to (FK) ────────────────────┼───▶ auth.users
└────────────────────────────────────────┘
```

---

### 7. Master Categories & Types

```sql
┌────────────────────────────────────────┐
│ master.categories (Kategori Barang)    │
├────────────────────────────────────────┤
│ • id (PK)                              │
│ • name                                 │
│ • type ('product', 'material')         │
└────────────────────────────────────────┘
        │
        └───▶ master.materials
        └───▶ master.product_types

┌────────────────────────────────────────┐
│ master.product_types (Tipe Barang)     │
├────────────────────────────────────────┤
│ • id (PK)                              │
│ • code                                 │
│ • name                                 │
│ • category                             │
└────────────────────────────────────────┘
```

---

### 8. HRGA Module

```sql
┌─────────────────┐
│ master_companies│
│ (Perusahaan)    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ master_         │
│ departments     │
│ (Departemen)    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ master_         │
│ positions       │
│ (Jabatan)       │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ employees       │
│                 │
└─────────────────┘

┌─────────────────┐
│ master_shift    │
│ (Shift)         │
└─────────────────┘
         │
         └───▶ production.shift_plans
         └───▶ production.shift_assignments
```

**Complete HR Query:**
```sql
SELECT 
  e.*,
  c.company_name,
  d.department_name,
  p.position_name,
  p.level
FROM hrga.employees e
LEFT JOIN hrga.master_companies c ON e.company_id = c.id
LEFT JOIN hrga.master_departments d ON e.department_id = d.id
LEFT JOIN hrga.master_positions p ON e.position_id = p.id
WHERE e.is_active = true;
```

---

## Complete Data Flow Diagram

```
USER INPUT (Frontend)
    │
    ▼
┌────────────────────┐
│ Prospective        │
│ Customers Form     │
└─────────┬──────────┘
          │
          ├─ Select Lead Source ──▶ sales.lead_sources
          ├─ Select Region ───────▶ sales.regions
          ├─ Select Segment ──────▶ sales.segments
          └─ Assign Sales Person ─▶ auth.users
          │
          ▼
    [Create Record]
          │
          ▼
┌────────────────────┐
│ Prospective        │◀──┐
│ Customers Table    │   │ Track Activities
└─────────┬──────────┘   │
          │              │
          │ [Qualify]    │
          ▼              │
┌────────────────────┐   │
│ Pipeline           │   │
│ (Opportunity)      │───┘
└─────────┬──────────┘
          │
          ├─ Select Stage ────────▶ sales.pipeline_stages
          ├─ Link Customer ───────▶ sales.customers
          └─ Add Activities ──────▶ sales.pipeline_activities
          │
          ▼
     [Win/Lose]
          │
          ├─ Win ──▶ Create Order ──▶ sales.orders
          └─ Lose ─▶ Update Status
```

---

## Foreign Key Cascade Rules

### ON DELETE Rules

```sql
-- CASCADE: Delete child records when parent is deleted
sales.pipeline_activities
  REFERENCES sales.pipeline(id) ON DELETE CASCADE
  -- When pipeline deleted → activities deleted automatically

-- SET NULL: Set to null when parent is deleted  
sales.pipeline
  REFERENCES sales.customers(id) ON DELETE SET NULL
  -- When customer deleted → pipeline.customer_id = null

-- RESTRICT: Prevent deletion if child exists
sales.customers
  REFERENCES sales.regions(id) ON DELETE RESTRICT
  -- Cannot delete region if customers exist
```

---

## Index Strategy

### Indexes Created for Performance

```sql
-- Primary Keys (automatic indexes)
sales.customers(id)
sales.pipeline(id)
sales.prospective_customers(id)

-- Foreign Keys (should always have indexes)
CREATE INDEX idx_pipeline_customer ON sales.pipeline(customer_id);
CREATE INDEX idx_pipeline_stage ON sales.pipeline(stage_id);
CREATE INDEX idx_prospects_lead_source ON sales.prospective_customers(lead_source_id);
CREATE INDEX idx_prospects_region ON sales.prospective_customers(region_id);

-- Frequently Queried Columns
CREATE INDEX idx_customers_code ON sales.customers(code);
CREATE INDEX idx_customers_name ON sales.customers(name);
CREATE INDEX idx_pipeline_status ON sales.pipeline(status);
CREATE INDEX idx_pipeline_close_date ON sales.pipeline(expected_close_date);

-- Composite Indexes (for common queries)
CREATE INDEX idx_pipeline_status_stage 
  ON sales.pipeline(status, stage_id);
  
CREATE INDEX idx_prospects_status_sales_person 
  ON sales.prospective_customers(status, sales_person_id);
```

---

## Summary

**Total Tables dalam diagram:**
- Sales: 10 tables (customers, pipeline, prospective_customers, dll)
- Master: 8 tables (lead_sources, regions, segments, categories, dll)
- Inventory: 2 tables (warehouses, tool_registry)
- HRGA: 5 tables (companies, departments, positions, employees, shift)

**Total Foreign Keys:** ~30 relationships

**Semua tabel terhubung melalui:**
1. Foreign Keys (FK) untuk data integrity
2. Indexes untuk query performance
3. RLS Policies untuk security
4. Triggers untuk auto-updates

---

**Dokumentasi lengkap ada di:**
- `SUPABASE_SETUP_TUTORIAL.md` - Tutorial setup
- `CONTOH_KODE_PRAKTIS.md` - Code examples
- `DATABASE_STRUCTURE.md` - Full schema docs
- `COMPLETE_SCHEMA_MAPPING.md` - Menu to table mapping
