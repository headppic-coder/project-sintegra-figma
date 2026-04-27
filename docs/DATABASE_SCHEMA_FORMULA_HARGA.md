# Database Schema - Formula Harga (Price Formula)

## Overview
Sistem database untuk mengelola formula perhitungan harga produk kemasan plastik dengan 4 jenis produk: Polos, Offset, Boks, dan Roto.

## 📊 Entity Relationship Diagram

```
┌─────────────────────┐
│  price_formulas     │◄──────┐
│  (Tabel Utama)      │       │
└─────────────────────┘       │
         │                     │
         │ 1:N                 │ 1:N
         ▼                     │
┌─────────────────────┐       │
│ formula_revisions   │       │
│ (Riwayat Revisi)    │       │
└─────────────────────┘       │
                               │
┌─────────────────────┐       │
│ formula_approvals   │───────┘
│ (Workflow Approval) │
└─────────────────────┘

┌─────────────────────┐       ┌─────────────────────┐
│ formula_templates   │       │  cost_components    │
│ (Master Template)   │       │  (Master Biaya)     │
└─────────────────────┘       └─────────────────────┘

┌─────────────────────┐       ┌─────────────────────┐
│ formula_comparisons │       │   pricing_rules     │
│ (Perbandingan)      │       │   (Aturan Harga)    │
└─────────────────────┘       └─────────────────────┘
```

---

## 🗃️ Struktur Tabel

### 1. **price_formulas** (Tabel Utama)

**Lokasi**: `sales.price_formulas`  
**Fungsi**: Menyimpan data formula perhitungan harga untuk setiap produk

#### Kolom Utama:
| Kolom | Tipe | Deskripsi |
|-------|------|-----------|
| `id` | UUID | Primary key |
| `code` | VARCHAR(50) | Kode unik formula (contoh: PF-2024-001) |
| `customer_id` | UUID | Referensi ke customer |
| `product_type` | VARCHAR(50) | Jenis produk: 'polos', 'offset', 'boks', 'roto' |
| `product_name` | VARCHAR(200) | Nama produk |
| `specifications` | JSONB | Spesifikasi lengkap produk (ukuran, bahan, dll) |
| `material_costs` | JSONB | Breakdown biaya material |
| `process_costs` | JSONB | Breakdown biaya proses |
| `total_cost` | DECIMAL(15,2) | Total biaya |
| `hpp_production` | DECIMAL(15,2) | HPP Produksi |
| `hpp_production_ppn` | DECIMAL(15,2) | HPP Produksi + PPN |
| `hpp_jual` | DECIMAL(15,2) | HPP Jual |
| `hpp_jual_ppn` | DECIMAL(15,2) | HPP Jual + PPN |
| `selling_price` | DECIMAL(15,2) | Harga jual final |
| `margin_percentage` | DECIMAL(5,2) | Persentase margin keuntungan |
| `quantity` | INTEGER | Jumlah order |
| `estimated_result` | INTEGER | Estimasi hasil produksi |
| `status` | VARCHAR(50) | Status: 'draft', 'approved', 'sent', 'closed' |
| `valid_until` | DATE | Berlaku sampai tanggal |

#### Contoh Data Specifications (JSONB):
```json
{
  "ukuran": "30x40 cm",
  "bahan": "Plastik PE",
  "ketebalan": "80 mikron",
  "warna": "CMYK Full Color",
  "finishing": "Laminating Glossy",
  "handle": "Plong Handle"
}
```

#### Contoh Data Material Costs (JSONB):
```json
{
  "plastik_pe": {
    "quantity": 50,
    "unit": "kg",
    "unit_price": 25000,
    "total": 1250000
  },
  "tinta": {
    "quantity": 2,
    "unit": "kg",
    "unit_price": 150000,
    "total": 300000
  }
}
```

---

### 2. **price_formula_templates** (Template Formula)

**Lokasi**: `sales.price_formula_templates`  
**Fungsi**: Menyimpan template formula yang bisa digunakan berulang

#### Kolom Utama:
| Kolom | Tipe | Deskripsi |
|-------|------|-----------|
| `id` | UUID | Primary key |
| `template_name` | VARCHAR(200) | Nama template |
| `product_type` | VARCHAR(50) | Jenis produk |
| `default_specifications` | JSONB | Spesifikasi default |
| `formula_config` | JSONB | Konfigurasi formula perhitungan |
| `default_material_costs` | JSONB | Default biaya material |
| `default_process_costs` | JSONB | Default biaya proses |
| `default_margin_percentage` | DECIMAL(5,2) | Default margin (%) |
| `is_active` | BOOLEAN | Status aktif |

**Use Case**: 
- Mempercepat pembuatan formula baru dengan menggunakan template
- Standardisasi perhitungan untuk produk sejenis

---

### 3. **cost_components** (Master Komponen Biaya)

**Lokasi**: `sales.cost_components`  
**Fungsi**: Master data komponen biaya yang digunakan dalam formula

#### Kolom Utama:
| Kolom | Tipe | Deskripsi |
|-------|------|-----------|
| `id` | UUID | Primary key |
| `component_code` | VARCHAR(50) | Kode komponen (contoh: MAT_PLASTIC_PE) |
| `component_name` | VARCHAR(200) | Nama komponen |
| `component_category` | VARCHAR(50) | Kategori: 'material', 'process', 'overhead', 'labor' |
| `uom` | VARCHAR(50) | Satuan: 'kg', 'meter', 'pcs', 'jam' |
| `unit_cost` | DECIMAL(15,2) | Harga per unit |
| `applicable_product_types` | VARCHAR[] | Array jenis produk yang applicable |
| `is_active` | BOOLEAN | Status aktif |

#### Kategori Biaya:
1. **Material**: Bahan baku (plastik, tinta, kertas)
2. **Process**: Biaya proses produksi (cetak, potong, lipat)
3. **Labor**: Upah tenaga kerja (operator, supervisor)
4. **Overhead**: Biaya overhead (listrik, maintenance)

#### Data Seed (Contoh):
```sql
MAT_PLASTIC_PE    - Plastik PE        - 25,000/kg
MAT_PLASTIC_PP    - Plastik PP        - 28,000/kg
MAT_INK_CMYK      - Tinta CMYK        - 150,000/kg
PROC_PRINTING     - Biaya Cetak       - 50,000/jam
LABOR_OPERATOR    - Upah Operator     - 15,000/jam
OH_ELECTRICITY    - Listrik           - 1,500/kwh
```

---

### 4. **price_formula_revisions** (Riwayat Revisi)

**Lokasi**: `sales.price_formula_revisions`  
**Fungsi**: Tracking semua perubahan pada formula harga

#### Kolom Utama:
| Kolom | Tipe | Deskripsi |
|-------|------|-----------|
| `id` | UUID | Primary key |
| `formula_id` | UUID | Referensi ke price_formulas |
| `revision_number` | INTEGER | Nomor revisi (auto-increment per formula) |
| `revision_data` | JSONB | Snapshot lengkap formula |
| `changes_description` | TEXT | Deskripsi perubahan |
| `change_reason` | VARCHAR(200) | Alasan perubahan |
| `previous_selling_price` | DECIMAL(15,2) | Harga lama |
| `new_selling_price` | DECIMAL(15,2) | Harga baru |
| `previous_margin` | DECIMAL(5,2) | Margin lama |
| `new_margin` | DECIMAL(5,2) | Margin baru |
| `approved_by` | UUID | User yang approve |

**Trigger**: Otomatis membuat revisi setiap ada perubahan selling_price atau margin_percentage

---

### 5. **price_formula_approvals** (Workflow Approval)

**Lokasi**: `sales.price_formula_approvals`  
**Fungsi**: Multi-level approval workflow untuk formula harga

#### Kolom Utama:
| Kolom | Tipe | Deskripsi |
|-------|------|-----------|
| `id` | UUID | Primary key |
| `formula_id` | UUID | Referensi ke price_formulas |
| `approval_level` | INTEGER | Level approval (1, 2, 3) |
| `approver_id` | UUID | User approver |
| `approver_role` | VARCHAR(100) | Role: 'sales_manager', 'finance_manager', 'director' |
| `status` | VARCHAR(50) | Status: 'pending', 'approved', 'rejected' |
| `decision_notes` | TEXT | Catatan keputusan |
| `decided_at` | TIMESTAMPTZ | Waktu keputusan |

#### Workflow Example:
```
Level 1: Sales Manager      → Approve
Level 2: Finance Manager    → Approve
Level 3: Director           → Approve
→ Formula Status: APPROVED
```

---

### 6. **price_formula_comparisons** (Perbandingan Formula)

**Lokasi**: `sales.price_formula_comparisons`  
**Fungsi**: Membandingkan beberapa formula untuk customer yang sama

#### Kolom Utama:
| Kolom | Tipe | Deskripsi |
|-------|------|-----------|
| `id` | UUID | Primary key |
| `comparison_name` | VARCHAR(200) | Nama perbandingan |
| `customer_id` | UUID | Customer yang dibandingkan |
| `product_type` | VARCHAR(50) | Jenis produk |
| `formula_ids` | UUID[] | Array ID formula yang dibandingkan |
| `recommended_formula_id` | UUID | Formula yang direkomendasikan |
| `decision_status` | VARCHAR(50) | Status: 'pending', 'decided', 'closed' |

**Use Case**: 
- Membandingkan 3 pilihan formula dengan margin berbeda
- Analisis competitive pricing

---

### 7. **pricing_rules** (Aturan Pricing Otomatis)

**Lokasi**: `sales.pricing_rules`  
**Fungsi**: Aturan otomatis untuk pricing (discount, seasonal)

#### Kolom Utama:
| Kolom | Tipe | Deskripsi |
|-------|------|-----------|
| `id` | UUID | Primary key |
| `rule_name` | VARCHAR(200) | Nama aturan |
| `rule_type` | VARCHAR(50) | Tipe: 'volume_discount', 'seasonal', 'customer_tier' |
| `product_types` | VARCHAR[] | Jenis produk yang applicable |
| `customer_categories` | VARCHAR[] | Kategori customer |
| `conditions` | JSONB | Kondisi aturan |
| `discount_type` | VARCHAR(50) | Tipe diskon: 'percentage', 'fixed_amount' |
| `discount_value` | DECIMAL(10,2) | Nilai diskon |
| `priority` | INTEGER | Prioritas (jika ada multiple rules) |
| `valid_from` | DATE | Berlaku dari |
| `valid_until` | DATE | Berlaku sampai |

#### Contoh Rules:

**Volume Discount Rule:**
```json
{
  "rule_name": "Volume Discount 1000+ pcs",
  "rule_type": "volume_discount",
  "conditions": {
    "min_quantity": 1000,
    "max_quantity": 5000
  },
  "discount_type": "percentage",
  "discount_value": 5.00
}
```

**Seasonal Discount:**
```json
{
  "rule_name": "Promo Akhir Tahun",
  "rule_type": "seasonal",
  "valid_from": "2024-12-01",
  "valid_until": "2024-12-31",
  "discount_type": "percentage",
  "discount_value": 10.00
}
```

---

## 📈 Views (Reporting)

### 1. **vw_formula_with_approval_status**

Menampilkan formula dengan status approval

```sql
SELECT * FROM sales.vw_formula_with_approval_status;
```

**Kolom Output**:
- Formula details (code, product_name, selling_price)
- `approval_status`: 'approved', 'pending_approval', 'rejected', 'no_approval_required'
- `latest_revision`: Nomor revisi terakhir
- Customer information

### 2. **vw_formula_cost_analysis**

Analisis biaya dan margin per formula

```sql
SELECT * FROM sales.vw_formula_cost_analysis;
```

**Kolom Output**:
- Cost breakdown (total_cost, hpp_production, hpp_jual)
- Margin analysis (margin_percentage, margin_amount, markup_percentage)
- Revenue & profit calculation (total_revenue, total_profit)

---

## 🔄 Triggers & Functions

### 1. **Auto-Update Timestamp**
```sql
update_updated_at_column()
```
Otomatis update kolom `updated_at` saat record diupdate

### 2. **Auto-Create Revision**
```sql
create_formula_revision()
```
Otomatis membuat record revisi saat ada perubahan `selling_price` atau `margin_percentage`

---

## 📝 Contoh Query

### Membuat Formula Baru
```sql
INSERT INTO sales.price_formulas (
  code,
  customer_id,
  product_type,
  product_name,
  specifications,
  selling_price,
  margin_percentage,
  quantity,
  status
) VALUES (
  'PF-2024-001',
  'uuid-customer-id',
  'offset',
  'Kantong Plastik Logo CMYK 30x40',
  '{"ukuran": "30x40cm", "bahan": "PE 80 mikron"}'::jsonb,
  2500000,
  25.00,
  5000,
  'draft'
);
```

### Mendapatkan Formula dengan Approval
```sql
SELECT 
  code,
  product_name,
  selling_price,
  approval_status,
  latest_revision
FROM sales.vw_formula_with_approval_status
WHERE customer_id = 'uuid-customer-id'
  AND approval_status = 'approved'
ORDER BY created_at DESC;
```

### Analisis Margin per Product Type
```sql
SELECT 
  product_type,
  COUNT(*) as total_formulas,
  AVG(margin_percentage) as avg_margin,
  AVG(markup_percentage) as avg_markup,
  SUM(total_revenue) as total_revenue,
  SUM(total_profit) as total_profit
FROM sales.vw_formula_cost_analysis
WHERE status = 'approved'
GROUP BY product_type
ORDER BY total_revenue DESC;
```

### Cek Formula yang Perlu Approval
```sql
SELECT 
  pf.code,
  pf.product_name,
  pf.selling_price,
  COUNT(pfa.id) FILTER (WHERE pfa.status = 'pending') as pending_approvals,
  COUNT(pfa.id) FILTER (WHERE pfa.status = 'approved') as approved_levels
FROM sales.price_formulas pf
LEFT JOIN sales.price_formula_approvals pfa ON pf.id = pfa.formula_id
WHERE pf.status = 'draft'
GROUP BY pf.id, pf.code, pf.product_name, pf.selling_price
HAVING COUNT(pfa.id) FILTER (WHERE pfa.status = 'pending') > 0;
```

---

## 🎯 Use Cases

### 1. **Perhitungan Formula Harga Standard**
1. Sales pilih product_type
2. Input spesifikasi produk
3. Sistem hitung otomatis dari cost_components
4. Sales review dan adjust margin
5. Submit untuk approval

### 2. **Quick Formula dari Template**
1. Sales pilih template yang sesuai
2. Template auto-fill specifications & costs
3. Sales modify sesuai kebutuhan
4. Submit untuk approval

### 3. **Revisi Harga**
1. Buka formula existing
2. Update selling_price atau margin
3. Sistem otomatis create revision record
4. Submit approval jika diperlukan

### 4. **Comparison Analysis**
1. Buat 3 formula dengan margin berbeda (15%, 20%, 25%)
2. Buat comparison record
3. Bandingkan margin vs competitive
4. Pilih recommended formula
5. Submit yang dipilih untuk approval

### 5. **Volume Pricing**
1. Buat pricing_rule untuk volume discount
2. Saat create formula, sistem cek applicable rules
3. Auto-apply discount berdasarkan quantity
4. Tampilkan harga sebelum & sesudah discount

---

## 🔐 Permissions & Security

### Row Level Security (RLS)
```sql
-- Sales hanya bisa lihat formula mereka sendiri
CREATE POLICY sales_own_formulas ON sales.price_formulas
  FOR ALL
  USING (sales_person_id = auth.uid());

-- Manager bisa lihat semua formula di team mereka
CREATE POLICY manager_team_formulas ON sales.price_formulas
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE id = auth.uid()
      AND role = 'sales_manager'
    )
  );
```

---

## 📊 Performance Indexes

Semua index penting sudah dibuat:
- `idx_formula_templates_product_type`
- `idx_cost_components_category`
- `idx_formula_revisions_formula_id`
- `idx_formula_approvals_status`
- `idx_pricing_rules_active`

---

## 🚀 Migration

File migration sudah tersedia:
```
supabase/migrations/20260418000001_extend_price_formula_tables.sql
```

Jalankan migration:
```bash
supabase db push
```

---

## 📚 Referensi

- Tabel customer: `sales.customers`
- Tabel users: `auth.users`
- Product types: `master.product_types`
- Segments: `master.segments`

---

**Last Updated**: 2026-04-18  
**Version**: 1.0
