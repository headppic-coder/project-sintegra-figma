# Entity Relationship Diagram - Formula Harga

## 🗂️ Complete ERD with Relationships

```
                                    ┌─────────────────────────────────────┐
                                    │        auth.users                   │
                                    │  ─────────────────────────────      │
                                    │  + id: UUID                         │
                                    │  + username: VARCHAR                │
                                    │  + email: VARCHAR                   │
                                    │  + role: VARCHAR                    │
                                    └──────────────┬──────────────────────┘
                                                   │
                      ┌────────────────────────────┼──────────────────────────┐
                      │                            │                          │
                      │                            │                          │
        ┌─────────────▼─────────────┐ ┌───────────▼───────────┐ ┌───────────▼───────────┐
        │   sales.customers         │ │  cost_components      │ │  formula_templates    │
        │  ─────────────────────    │ │  ─────────────────    │ │  ─────────────────    │
        │  + id: UUID               │ │  + id: UUID           │ │  + id: UUID           │
        │  + customer_name          │ │  + component_code     │ │  + template_name      │
        │  + customer_category      │ │  + component_name     │ │  + product_type       │
        │  + industry_category      │ │  + category           │ │  + default_specs      │
        └─────────────┬─────────────┘ │  + uom                │ │  + formula_config     │
                      │               │  + unit_cost          │ │  + default_costs      │
                      │               │  + applicable_types[] │ └───────────────────────┘
                      │               └───────────────────────┘
                      │
                      │ 1:N
                      │
        ┌─────────────▼────────────────────────────────────────────────────────┐
        │                    sales.price_formulas (CORE TABLE)                 │
        │  ────────────────────────────────────────────────────────────────    │
        │  + id: UUID [PK]                                                     │
        │  + code: VARCHAR(50) [UNIQUE]                                        │
        │  + customer_id: UUID [FK → customers]                                │
        │  + product_type: VARCHAR(50) ['polos','offset','boks','roto']        │
        │  + product_name: VARCHAR(200)                                        │
        │                                                                      │
        │  📋 SPECIFICATIONS & COSTS (JSONB):                                  │
        │  + specifications: JSONB                                             │
        │  + material_costs: JSONB                                             │
        │  + process_costs: JSONB                                              │
        │                                                                      │
        │  💰 PRICING CALCULATIONS:                                            │
        │  + total_cost: DECIMAL(15,2)                                         │
        │  + hpp_production: DECIMAL(15,2)                                     │
        │  + hpp_production_ppn: DECIMAL(15,2)                                 │
        │  + hpp_jual: DECIMAL(15,2)                                           │
        │  + hpp_jual_ppn: DECIMAL(15,2)                                       │
        │  + selling_price: DECIMAL(15,2)                                      │
        │  + margin_percentage: DECIMAL(5,2)                                   │
        │                                                                      │
        │  📊 BUSINESS DATA:                                                   │
        │  + quantity: INTEGER                                                 │
        │  + estimated_result: INTEGER                                         │
        │  + notes: TEXT                                                       │
        │  + status: VARCHAR(50) ['draft','approved','sent','closed']          │
        │  + valid_until: DATE                                                 │
        │  + sales_person_id: UUID [FK → users]                                │
        │                                                                      │
        │  📅 AUDIT FIELDS:                                                    │
        │  + created_at: TIMESTAMPTZ                                           │
        │  + updated_at: TIMESTAMPTZ                                           │
        │  + created_by: UUID [FK → users]                                     │
        │  + updated_by: UUID [FK → users]                                     │
        └──────────┬──────────────┬──────────────┬─────────────────────────────┘
                   │              │              │
                   │ 1:N          │ 1:N          │ 1:N
                   │              │              │
     ┌─────────────▼─────────┐   │   ┌──────────▼──────────┐   ┌──────────────▼───────────┐
     │ formula_revisions     │   │   │ formula_approvals   │   │ formula_comparisons      │
     │ ───────────────────   │   │   │ ─────────────────   │   │ ──────────────────────   │
     │ + id: UUID            │   │   │ + id: UUID          │   │ + id: UUID               │
     │ + formula_id: UUID ──────┘   │ + formula_id: UUID ──────┘ + comparison_name        │
     │ + revision_number     │       │ + approval_level    │     │ + customer_id: UUID    │
     │ + revision_data:JSONB │       │ + approver_id: UUID │     │ + product_type         │
     │ + changes_description │       │ + approver_role     │     │ + formula_ids: UUID[]  │
     │ + change_reason       │       │ + status            │     │ + recommended_id       │
     │ + previous_price      │       │ + decision_notes    │     │ + decision_status      │
     │ + new_price           │       │ + decided_at        │     │ + final_decision       │
     │ + previous_margin     │       └─────────────────────┘     │ + decided_by: UUID     │
     │ + new_margin          │                                   └──────────────────────────┘
     │ + approved_by: UUID   │
     │ + created_at          │
     └───────────────────────┘

                                    ┌──────────────────────────────┐
                                    │     pricing_rules            │
                                    │  ──────────────────────────  │
                                    │  + id: UUID                  │
                                    │  + rule_name                 │
                                    │  + rule_type                 │
                                    │  + product_types[]           │
                                    │  + customer_categories[]     │
                                    │  + conditions: JSONB         │
                                    │  + discount_type             │
                                    │  + discount_value            │
                                    │  + priority                  │
                                    │  + valid_from: DATE          │
                                    │  + valid_until: DATE         │
                                    │  + is_active: BOOLEAN        │
                                    └──────────────────────────────┘
```

---

## 📊 Detailed Table Relationships

### 1️⃣ **price_formulas** (Core)
**Primary Relationships:**
- `customer_id` → `sales.customers.id` (N:1)
- `sales_person_id` → `auth.users.id` (N:1)
- `created_by` → `auth.users.id` (N:1)
- `updated_by` → `auth.users.id` (N:1)

**Dependent Tables:**
- `formula_revisions` (1:N)
- `formula_approvals` (1:N)
- Referenced by `formula_comparisons.formula_ids[]` (N:N)

---

### 2️⃣ **formula_revisions** (History Tracking)
**Relationships:**
- `formula_id` → `price_formulas.id` (N:1) [CASCADE DELETE]
- `created_by` → `auth.users.id` (N:1)
- `approved_by` → `auth.users.id` (N:1)

**Unique Constraint:**
- `(formula_id, revision_number)` - ensures unique revision numbering per formula

**Auto-Generated:**
- Trigger `create_formula_revision()` creates new revision on price/margin change

---

### 3️⃣ **formula_approvals** (Workflow)
**Relationships:**
- `formula_id` → `price_formulas.id` (N:1) [CASCADE DELETE]
- `approver_id` → `auth.users.id` (N:1)

**Workflow Levels:**
```
Level 1: Sales Manager     (approver_role: 'sales_manager')
Level 2: Finance Manager   (approver_role: 'finance_manager')
Level 3: Director          (approver_role: 'director')
```

**Status Flow:**
```
pending → approved
        ↘ rejected
```

---

### 4️⃣ **formula_comparisons** (Analysis)
**Relationships:**
- `customer_id` → `sales.customers.id` (N:1)
- `formula_ids[]` → `price_formulas.id` (N:N via array)
- `recommended_formula_id` → `price_formulas.id` (N:1)
- `created_by` → `auth.users.id` (N:1)
- `updated_by` → `auth.users.id` (N:1)
- `decided_by` → `auth.users.id` (N:1)

**Use Case:**
```
Comparison: "Opsi Harga untuk PT ABC"
├── Formula A: Margin 15% → Rp 2,300,000
├── Formula B: Margin 20% → Rp 2,500,000
└── Formula C: Margin 25% → Rp 2,700,000
    ↓ Recommended
```

---

### 5️⃣ **cost_components** (Master Data)
**Relationships:**
- `created_by` → `auth.users.id` (N:1)
- `updated_by` → `auth.users.id` (N:1)

**Referenced By:**
- `price_formulas.material_costs` (via JSONB reference)
- `price_formulas.process_costs` (via JSONB reference)
- `formula_templates.default_material_costs` (via JSONB reference)

**Categories:**
```
material   → Bahan baku (plastik, tinta, kertas)
process    → Proses produksi (cetak, potong, lipat)
labor      → Tenaga kerja (operator, supervisor)
overhead   → Overhead (listrik, maintenance)
```

---

### 6️⃣ **formula_templates** (Templates)
**Relationships:**
- `created_by` → `auth.users.id` (N:1)
- `updated_by` → `auth.users.id` (N:1)

**Referenced By:**
- Used when creating new `price_formulas` from template

---

### 7️⃣ **pricing_rules** (Auto-Pricing)
**Relationships:**
- `created_by` → `auth.users.id` (N:1)
- `updated_by` → `auth.users.id` (N:1)

**Applied To:**
- `price_formulas` (via rule engine, not direct FK)

**Rule Types:**
```
volume_discount  → Diskon berdasarkan quantity
seasonal        → Diskon berdasarkan periode
customer_tier   → Diskon berdasarkan kategori customer
product_category → Diskon berdasarkan jenis produk
```

---

## 🔄 Data Flow Diagram

### Create New Formula Flow
```
START
  ↓
[1] Sales selects product_type
  ↓
[2] Optional: Load from template
  ↓                     ↓
[3a] Manual Input       [3b] Template auto-fills
  ↓                     ↓
[4] Input specifications (ukuran, bahan, etc.)
  ↓
[5] System calculates costs from cost_components
  ↓
[6] Sales reviews & adjusts margin
  ↓
[7] Check applicable pricing_rules
  ↓                     ↓
[8a] Apply discount    [8b] No discount
  ↓                     ↓
[9] Calculate final selling_price
  ↓
[10] Save as 'draft' status in price_formulas
  ↓
[11] Submit for approval
  ↓
[12] Create approval records (Level 1, 2, 3)
  ↓
[13] Approvers review & approve/reject
  ↓                     ↓
[14a] All approved     [14b] Any rejected
  ↓                     ↓
[15a] Status='approved' [15b] Back to draft
  ↓
[16] Formula ready to be sent to customer
END
```

### Revision Flow
```
START (Formula exists in 'approved' status)
  ↓
[1] Sales opens formula for revision
  ↓
[2] Modify selling_price or margin_percentage
  ↓
[3] TRIGGER: create_formula_revision()
  ↓
[4] System auto-creates revision record
    - revision_number = last + 1
    - revision_data = full snapshot
    - previous_price & new_price logged
  ↓
[5] Status remains 'approved' OR changed to 'draft'
  ↓
[6] If significant change → Re-approval required
END
```

---

## 📈 View Relationships

### vw_formula_with_approval_status
```sql
price_formulas (pf)
    LEFT JOIN customers (c) ON pf.customer_id = c.id
    ╔══════════════════════════════════════════════════════╗
    ║ Subquery: Check formula_approvals                   ║
    ║   - Has any rejected? → 'rejected'                  ║
    ║   - No approvals exist? → 'no_approval_required'    ║
    ║   - Has pending? → 'pending_approval'               ║
    ║   - All approved? → 'approved'                      ║
    ╚══════════════════════════════════════════════════════╝
    ╔══════════════════════════════════════════════════════╗
    ║ Subquery: Get latest revision number                ║
    ╚══════════════════════════════════════════════════════╝
```

### vw_formula_cost_analysis
```sql
price_formulas
    ╔══════════════════════════════════════════════════════╗
    ║ Calculate derived fields:                           ║
    ║   - margin_amount = selling_price - hpp_jual        ║
    ║   - markup_percentage = (margin/hpp_jual) * 100     ║
    ║   - total_revenue = selling_price * quantity        ║
    ║   - total_profit = margin_amount * quantity         ║
    ╚══════════════════════════════════════════════════════╝
```

---

## 🔐 Row Level Security (RLS) Schema

```
price_formulas
    ├── Policy: sales_own_formulas
    │   └── USING: sales_person_id = auth.uid()
    │       → Sales hanya bisa CRUD formula mereka sendiri
    │
    ├── Policy: manager_team_formulas
    │   └── USING: user.role = 'sales_manager'
    │       → Manager bisa SELECT semua formula di teamnya
    │
    └── Policy: finance_all_formulas
        └── USING: user.role IN ('finance_manager', 'director')
            → Finance & Director bisa SELECT semua formula

formula_approvals
    ├── Policy: approver_can_view
    │   └── USING: approver_id = auth.uid()
    │       → Approver hanya bisa lihat approval mereka
    │
    └── Policy: approver_can_update
        └── USING: approver_id = auth.uid() AND status = 'pending'
            → Approver hanya bisa update pending approvals

formula_revisions
    └── Policy: view_own_formula_revisions
        └── USING: EXISTS (
                SELECT 1 FROM price_formulas
                WHERE id = formula_id
                AND sales_person_id = auth.uid()
            )
            → Sales bisa lihat revisi formula mereka

cost_components
    ├── Policy: all_can_view
    │   └── USING: is_active = true
    │       → Semua user bisa view active components
    │
    └── Policy: admin_can_manage
        └── USING: user.role = 'admin'
            → Hanya admin yang bisa CRUD components

formula_templates
    ├── Policy: all_can_view
    │   └── USING: is_active = true
    │       → Semua user bisa view active templates
    │
    └── Policy: manager_can_manage
        └── USING: user.role IN ('sales_manager', 'admin')
            → Manager & admin bisa CRUD templates

pricing_rules
    ├── Policy: all_can_view
    │   └── USING: is_active = true
    │       → Semua user bisa view active rules
    │
    └── Policy: finance_can_manage
        └── USING: user.role IN ('finance_manager', 'director')
            → Finance bisa CRUD pricing rules
```

---

## 🎯 Indexes Strategy

### High Priority (Query Performance)
```sql
-- Formula lookups
CREATE INDEX idx_price_formulas_customer ON price_formulas(customer_id);
CREATE INDEX idx_price_formulas_status ON price_formulas(status);
CREATE INDEX idx_price_formulas_product_type ON price_formulas(product_type);
CREATE INDEX idx_price_formulas_valid_until ON price_formulas(valid_until);
CREATE INDEX idx_price_formulas_sales_person ON price_formulas(sales_person_id);

-- Approval workflow
CREATE INDEX idx_formula_approvals_formula ON formula_approvals(formula_id);
CREATE INDEX idx_formula_approvals_status ON formula_approvals(status);
CREATE INDEX idx_formula_approvals_approver ON formula_approvals(approver_id);

-- Revision history
CREATE INDEX idx_formula_revisions_formula ON formula_revisions(formula_id);
CREATE INDEX idx_formula_revisions_created ON formula_revisions(created_at DESC);

-- Cost components
CREATE INDEX idx_cost_components_category ON cost_components(component_category);
CREATE INDEX idx_cost_components_active ON cost_components(is_active);
CREATE INDEX idx_cost_components_code ON cost_components(component_code);

-- Pricing rules
CREATE INDEX idx_pricing_rules_active ON pricing_rules(is_active);
CREATE INDEX idx_pricing_rules_dates ON pricing_rules(valid_from, valid_until);
```

---

## 📦 JSONB Structure Examples

### specifications (JSONB)
```json
{
  "ukuran": {
    "panjang": 30,
    "lebar": 40,
    "unit": "cm"
  },
  "bahan": "Plastik PE",
  "ketebalan": {
    "value": 80,
    "unit": "mikron"
  },
  "warna": "CMYK Full Color",
  "finishing": ["Laminating Glossy", "Plong Handle"],
  "handle": {
    "type": "Plong",
    "position": "Tengah"
  },
  "print_area": {
    "depan": true,
    "belakang": true,
    "samping": false
  }
}
```

### material_costs (JSONB)
```json
{
  "components": [
    {
      "component_id": "uuid-component-1",
      "component_code": "MAT_PLASTIC_PE",
      "component_name": "Plastik PE",
      "quantity": 50,
      "unit": "kg",
      "unit_price": 25000,
      "total": 1250000
    },
    {
      "component_id": "uuid-component-2",
      "component_code": "MAT_INK_CMYK",
      "component_name": "Tinta CMYK",
      "quantity": 2,
      "unit": "kg",
      "unit_price": 150000,
      "total": 300000
    }
  ],
  "subtotal": 1550000,
  "waste_percentage": 5,
  "waste_amount": 77500,
  "total_with_waste": 1627500
}
```

### process_costs (JSONB)
```json
{
  "components": [
    {
      "component_id": "uuid-process-1",
      "component_code": "PROC_PRINTING",
      "component_name": "Biaya Cetak",
      "quantity": 8,
      "unit": "jam",
      "unit_price": 50000,
      "total": 400000
    },
    {
      "component_id": "uuid-process-2",
      "component_code": "PROC_CUTTING",
      "component_name": "Biaya Potong",
      "quantity": 4,
      "unit": "jam",
      "unit_price": 30000,
      "total": 120000
    }
  ],
  "subtotal": 520000
}
```

### formula_config (JSONB in templates)
```json
{
  "calculation_method": "standard",
  "formulas": {
    "hpp_production": "total_cost + (total_cost * overhead_percentage)",
    "hpp_jual": "hpp_production + (hpp_production * margin_percentage)",
    "selling_price": "hpp_jual * (1 + ppn_percentage)"
  },
  "default_values": {
    "overhead_percentage": 0.15,
    "margin_percentage": 0.20,
    "ppn_percentage": 0.11
  }
}
```

---

**Last Updated**: 2026-04-18  
**Version**: 1.0
