# Complete Schema Mapping - Menu to Database Tables

## Overview
Dokumen ini memetakan semua menu/fitur aplikasi ke tabel-tabel database yang sesuai.

---

## 📊 Sales Module

### Menu → Database Tables

| Menu | Tables | Schema | Migration File |
|------|--------|--------|----------------|
| **Prospective Customers** | `sales.prospective_customers` | sales | 15 |
| **Customers** | `sales.customers` | sales | 03 |
| **Pipeline** | `sales.pipeline`<br>`sales.pipeline_follow_ups`<br>`sales.pipeline_logs` | sales | 15, 17 |
| **Price Formula** | `sales.price_formulas` | sales | 03 |
| **Quotations** | `sales.quotations`<br>`sales.quotation_items` | sales | 03 |
| **Sales Orders** | `sales.orders` | sales | 03 |
| **Sales Order Items** | _(part of orders)_ | sales | 03 |
| **Delivery Requests** | `sales.delivery_requests`<br>`sales.delivery_request_items` | sales | 15 |
| **Delivery Notes** | `sales.delivery_notes`<br>`sales.delivery_note_items` | sales | 15 |
| **Delivery Recap** | `sales.delivery_recap` | sales | 15 |
| **Lead Sources** | `sales.lead_sources` | sales | 15 |
| **Regions** | `sales.regions` | sales | 15 |
| **Pipeline Stages** | `sales.pipeline_stages` | sales | 15 |
| **Sales Activities** | `sales.sales_activities` | sales | 15 |
| **Segments** | `sales.segments` | sales | 15 |
| **Industry Categories** | `sales.industry_categories` | sales | 15 |

**Total Tables: 18 main tables + 7 detail tables = 25 tables**

**Pipeline Tables Detail:**
- `sales.pipeline` - Main pipeline data (v1.2: added nomor_telepon, estimasi_harga)
- `sales.pipeline_follow_ups` - Follow-up activities
- `sales.pipeline_logs` - Auto-generated change history log

---

## 🎨 Design Module

### Menu → Database Tables

| Menu | Tables | Schema | Migration File |
|------|--------|--------|----------------|
| **Design Requests** | `design.design_requests` | design | 09 |
| **Design Process** | `design.design_process` | design | 09 |
| **Design Library** | `design.design_library` | design | 09 |
| **Design Layout** | `design.design_layouts` | design | 09 |
| **Layout Joblist** | `design.layout_joblist` | design | 09 |
| **Cylinder Registry** | `design.cylinder_registry` | design | 09 |
| **Plate Registry** | `design.plate_registry` | design | 09 |
| **Artwork Specification** | `design.artwork_specifications` | design | 09 |
| **Prepress Checklist** | `design.prepress_checklist` | design | 09 |

**Total Tables: 9 tables**

---

## 📅 PPIC Module

### Menu → Database Tables

| Menu | Tables | Schema | Migration File |
|------|--------|--------|----------------|
| **Process Stages** | `ppic.process_stages` | ppic | 10 |
| **Production Plans** | `ppic.production_plans` | ppic | 10 |
| **Production Schedule** | `ppic.production_schedule` | ppic | 10 |
| **Planning Capacity** | `ppic.planning_capacity` | ppic | 10 |
| **Schedule Monitoring** | `ppic.schedule_monitoring` | ppic | 10 |
| **Material Monitoring** | `ppic.material_monitoring` | ppic | 10 |
| **Material Usage Monitoring** | `ppic.material_usage_monitoring` | ppic | 10 |
| **Production Completion** | `ppic.production_completion` | ppic | 10 |
| **Completion List** | `ppic.completion_items` | ppic | 10 |

**Total Tables: 9 tables**

---

## 🏭 Production Module

### Menu → Database Tables

| Menu | Tables | Schema | Migration File |
|------|--------|--------|----------------|
| **Process Units** | `production.process_units` | production | 11 |
| **Shift Plan** | `production.shift_plans`<br>`production.shift_assignments` | production | 11 |
| **Production Realization** | `production.production_realization` | production | 11 |
| **Realization Monitoring** | `production.realization_monitoring` | production | 11 |
| **Productivity** | `production.productivity` | production | 11 |
| **Downtime** | `production.downtime` | production | 11 |
| **Production Realtime** | `production.production_realtime` | production | 11 |
| **Machines** | `production.machines` | production | 04 |
| **Machine Maintenance** | `production.machine_usage` | production | 04 |
| **Overtime Request** | `production.overtime_requests` | production | 11 |
| **QC Process** | `production.quality_checks` | production | 04 |
| **QC Incoming** | _(part of quality_checks)_ | production | 04 |
| **QC Outgoing** | _(part of quality_checks)_ | production | 04 |
| **Work Orders** | `production.work_orders` | production | 04 |
| **Process Steps** | `production.process_steps` | production | 04 |
| **Material Usage** | `production.material_usage` | production | 04 |

**Total Tables: 16 tables**

---

## 📦 Warehouse Module

### Menu → Database Tables

| Menu | Tables | Schema | Migration File |
|------|--------|--------|----------------|
| **Item Requests** | `inventory.item_requests`<br>`inventory.item_request_details` | inventory | 12 |
| **Item Receipts** | `inventory.item_receipts`<br>`inventory.item_receipt_details` | inventory | 12 |
| **Material Preparation** | `inventory.material_preparation`<br>`inventory.material_preparation_details` | inventory | 12 |
| **Production Outgoing** | `inventory.production_outgoing`<br>`inventory.production_outgoing_details` | inventory | 12 |
| **Production Incoming** | `inventory.production_incoming` | inventory | 12 |
| **Items** | `master.materials` | master | 02 |
| **Item Categories** | `master.categories` | master | 02 |
| **Item Types** | _(part of categories)_ | master | 02 |
| **Warehouses** | `inventory.warehouses` | inventory | 05 |
| **Stock Card** | `inventory.stock` | inventory | 05 |
| **Stock Movements** | `inventory.stock_transactions` | inventory | 05 |
| **Stock Adjustment** | `inventory.stock_adjustments`<br>`inventory.stock_adjustment_items` | inventory | 05 |
| **Tool Registry** | `inventory.tool_registry` | inventory | 12 |
| **Min Max Stock** | `inventory.min_max_stock` | inventory | 12 |
| **Stock Report** | _(views from stock tables)_ | inventory | 05 |

**Total Tables: 14 main tables + 7 detail tables = 21 tables**

---

## 👥 HRGA Module

### Menu → Database Tables

| Menu | Tables | Schema | Migration File |
|------|--------|--------|----------------|
| **Employees** | `hrga.employees` | hrga | 13 |
| **Master Companies** | `hrga.master_companies` | hrga | 13 |
| **Master Departments** | `hrga.master_departments` | hrga | 13 |
| **Master Positions** | `hrga.master_positions` | hrga | 13 |
| **Organization Structure** | `hrga.organization_structure` | hrga | 13 |
| **Divisions** | `hrga.divisions` | hrga | 13 |
| **Sub Divisions** | `hrga.sub_divisions` | hrga | 13 |
| **KPI** | `hrga.kpi` | hrga | 13 |
| **Master Shift** | `hrga.master_shift` | hrga | 13 |
| **Recruitment** | `hrga.recruitment`<br>`hrga.recruitment_candidates` | hrga | 13 |
| **Warning Letters** | `hrga.warning_letters` | hrga | 13 |
| **Document Management** | `hrga.document_management` | hrga | 13 |
| **Security Reports** | `hrga.security_reports` | hrga | 13 |
| **Janitor Reports** | `hrga.janitor_reports` | hrga | 13 |
| **Assets** | `hrga.assets` | hrga | 13 |
| **Asset Repair** | `hrga.asset_repair` | hrga | 13 |
| **Office Supply Request** | `hrga.office_supply_requests`<br>`hrga.office_supply_request_items` | hrga | 13 |

**Total Tables: 17 main tables + 3 detail tables = 20 tables**

---

## 🛒 Procurement Module

### Menu → Database Tables

| Menu | Tables | Schema | Migration File |
|------|--------|--------|----------------|
| **Vendor Registration** | `procurement.vendor_registration` | procurement | 14 |
| **Purchase Orders** | `inventory.purchase_orders`<br>`inventory.purchase_order_items` | inventory | 05 |
| **Suppliers** | `procurement.suppliers` | procurement | 14 |
| **Supplier Evaluation** | `procurement.supplier_evaluation` | procurement | 14 |
| **Purchase Returns** | `procurement.purchase_returns`<br>`procurement.purchase_return_items` | procurement | 14 |
| **Purchase Payments** | `procurement.purchase_payments` | procurement | 14 |
| **Supplier Quotations** | `procurement.supplier_quotations`<br>`procurement.supplier_quotation_items` | procurement | 14 |
| **Supplier Performance** | `procurement.supplier_performance` | procurement | 14 |

**Total Tables: 6 main tables + 4 detail tables = 10 tables**

---

## 📁 Master Data Module

### Master Tables (Used Across Modules)

| Purpose | Tables | Schema | Migration File |
|---------|--------|--------|----------------|
| **Materials/Items** | `master.materials` | master | 02 |
| **Categories** | `master.categories` | master | 02 |
| **Process Costs** | `master.process_costs` | master | 02 |
| **Product Types** | `master.product_types` | master | 02 |
| **Settings** | `master.settings` | master | 02 |

**Total Tables: 5 tables**

---

## 💰 Finance Module

### Tables

| Purpose | Tables | Schema | Migration File |
|---------|--------|--------|----------------|
| **Invoices** | `finance.invoices`<br>`finance.invoice_items` | finance | 06 |
| **Payments** | `finance.payments` | finance | 06 |
| **Expenses** | `finance.expenses` | finance | 06 |
| **Chart of Accounts** | `finance.accounts` | finance | 06 |
| **Journal Entries** | `finance.journal_entries`<br>`finance.journal_entry_lines` | finance | 06 |

**Total Tables: 5 main tables + 2 detail tables = 7 tables**

---

## 📊 Summary Statistics

### Total Tables by Schema

| Schema | Main Tables | Detail Tables | Total | Migration Files |
|--------|-------------|---------------|-------|-----------------|
| **sales** | 18 | 7 | **25** | 03, 15, 17 |
| **design** | 9 | 0 | **9** | 09 |
| **ppic** | 9 | 0 | **9** | 10 |
| **production** | 16 | 0 | **16** | 04, 11 |
| **inventory** | 14 | 7 | **21** | 05, 12 |
| **hrga** | 17 | 3 | **20** | 13 |
| **procurement** | 6 | 4 | **10** | 14 |
| **master** | 5 | 0 | **5** | 02 |
| **finance** | 5 | 2 | **7** | 06 |
| **TOTAL** | **99** | **21** | **120** | **15 files** |

---

## 🗂️ Database Schemas

### Schema Organization

```
packaging_management_db/
├── master/          (5 tables)   - Master data
├── sales/           (25 tables)  - Sales & CRM
├── design/          (9 tables)   - Design & Prepress
├── ppic/            (9 tables)   - Production Planning
├── production/      (16 tables)  - Manufacturing
├── inventory/       (21 tables)  - Warehouse & Stock
├── hrga/            (20 tables)  - HR & General Affairs
├── procurement/     (10 tables)  - Purchasing & Suppliers
└── finance/         (7 tables)   - Accounting & Finance
```

---

## 📝 Migration Files Overview

### Chronological Order

1. **00001** - Create Schemas (9 schemas)
2. **00002** - Master Tables (5 tables)
3. **00003** - Sales Core Tables (5 tables)
4. **00004** - Production Core Tables (6 tables)
5. **00005** - Inventory Core Tables (7 tables)
6. **00006** - Finance Tables (7 tables)
7. **00007** - Functions & Triggers
8. **00008** - Seed Data
9. **00009** - Design Tables (9 tables)
10. **00010** - PPIC Tables (9 tables)
11. **00011** - Extend Production (10 tables)
12. **00012** - Extend Inventory (14 tables)
13. **00013** - HRGA Tables (20 tables)
14. **00014** - Procurement Tables (10 tables)
15. **00015** - Additional Sales Tables (18 tables)
16. **00017** - Extend Sales (7 tables)

---

## 🔗 Key Relationships

### Cross-Schema Foreign Keys

```
auth.users (Supabase Auth)
  ├─> sales.customers (created_by, sales_person_id)
  ├─> sales.orders (created_by)
  ├─> production.work_orders (created_by, supervisor_id)
  ├─> inventory.stock_transactions (created_by)
  ├─> hrga.employees (user_id)
  └─> finance.invoices (created_by)

sales.customers
  ├─> sales.quotations
  ├─> sales.orders
  ├─> design.design_requests
  └─> finance.invoices

sales.orders
  ├─> production.work_orders
  ├─> ppic.production_plans
  ├─> sales.delivery_requests
  └─> finance.invoices

production.work_orders
  ├─> ppic.production_schedule
  ├─> production.material_usage
  ├─> inventory.item_requests
  └─> ppic.production_completion

master.materials
  ├─> inventory.stock
  ├─> production.material_usage
  ├─> ppic.material_monitoring
  └─> inventory.purchase_order_items
```

---

## ✅ Verification Checklist

- [x] Semua menu memiliki tabel database
- [x] Semua tabel memiliki RLS enabled
- [x] Semua tabel memiliki timestamps (created_at, updated_at)
- [x] Semua tabel memiliki audit trail (created_by, updated_by)
- [x] Foreign keys sudah di-set dengan proper cascade
- [x] Indexes dibuat untuk query optimization
- [x] Functions & triggers untuk automation
- [x] Seed data untuk testing

---

## 🚀 Next Steps

### Untuk Development

1. Apply all migrations ke database
2. Test setiap endpoint/query
3. Implement TypeScript types dari schema
4. Create API endpoints untuk setiap table
5. Build frontend forms berdasarkan schema

### Untuk Production

1. Review & optimize indexes
2. Set up backup strategy
3. Configure RLS policies sesuai role
4. Set up monitoring & alerts
5. Document API endpoints

---

**Last Updated:** April 13, 2026  
**Total Migrations:** 15 files  
**Total Tables:** 120 tables (99 main + 21 detail)  
**Total Schemas:** 9 schemas