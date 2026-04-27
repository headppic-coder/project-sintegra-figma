# Database Schema - Formula Harga (Specific per Product Type)

## 📋 Overview

Schema database terpisah untuk setiap jenis produk kemasan plastik dengan kolom-kolom yang spesifik sesuai karakteristik produknya.

## 🎯 Mengapa Schema Terpisah?

Setiap jenis produk memiliki:
- **Spesifikasi yang berbeda** (polos = 2D, boks = 3D)
- **Proses produksi yang berbeda** (polos = simple, roto = complex)
- **Komponen biaya yang berbeda** (polos = material+handle, boks = material+lem+lipat)
- **Perhitungan yang berbeda** (roto = per roll & per pcs)

Dengan tabel terpisah:
✅ Kolom lebih spesifik dan jelas
✅ Validasi data lebih mudah
✅ Query lebih cepat
✅ Perhitungan lebih akurat

---

## 📊 Struktur Database

```
master
├── material_types          (Master bahan: plastik, karton, tinta)
├── standard_sizes          (Master ukuran standar)
├── production_processes    (Master proses produksi & biaya)
└── finishing_options       (Master finishing & harga)

sales
├── price_formulas_polos    (Formula kantong plastik polos)
├── price_formulas_offset   (Formula kantong plastik offset/cetak)
├── price_formulas_boks     (Formula boks/kemasan karton)
└── price_formulas_roto     (Formula rotogravure/flexo roll)
```

---

## 🗂️ MASTER TABLES

### 1. **master.material_types**
Master jenis bahan dengan properties JSONB

**Kolom:**
| Kolom | Tipe | Deskripsi |
|-------|------|-----------|
| code | VARCHAR(50) | Kode unik (MAT-PE-001) |
| name | VARCHAR(200) | Nama material |
| category | VARCHAR(50) | 'plastik', 'karton', 'tinta', 'lem' |
| unit | VARCHAR(50) | Satuan (kg, meter, liter) |
| standard_price | DECIMAL(15,2) | Harga standar |
| properties | JSONB | Spesifikasi tambahan |

**Contoh Properties:**
```json
{
  "ketebalan_mikron": [60, 80, 100, 120],
  "warna": ["bening", "putih susu", "hitam"],
  "finishing": ["glossy", "matte"]
}
```

**Seed Data:**
```
MAT-PE-001    - Plastik PE           - Rp 25,000/kg
MAT-PP-001    - Plastik PP           - Rp 28,000/kg
MAT-OPP-001   - Plastik OPP          - Rp 32,000/kg
MAT-DUPLEX-001 - Karton Duplex       - Rp 15,000/kg
MAT-IVORY-001  - Karton Ivory        - Rp 18,000/kg
INK-CMYK-001   - Tinta Offset CMYK   - Rp 150,000/kg
INK-ROTO-001   - Tinta Roto Solvent  - Rp 180,000/kg
```

---

### 2. **master.standard_sizes**
Master ukuran standar produk

**Kolom:**
| Kolom | Tipe | Deskripsi |
|-------|------|-----------|
| code | VARCHAR(50) | Kode ukuran |
| name | VARCHAR(200) | Nama ukuran |
| width | DECIMAL(10,2) | Lebar (cm) |
| length | DECIMAL(10,2) | Panjang (cm) |
| height | DECIMAL(10,2) | Tinggi (cm, untuk boks) |
| category | VARCHAR(50) | 'kantong', 'boks', 'lembaran' |

**Seed Data:**
```
SIZE-K-001 - Kantong Kecil 15x20
SIZE-K-002 - Kantong Sedang 20x30
SIZE-K-003 - Kantong Besar 30x40
SIZE-B-001 - Boks Kecil 10x10x10
SIZE-B-002 - Boks Sedang 20x20x15
```

---

### 3. **master.production_processes**
Master proses produksi dengan biaya

**Kolom:**
| Kolom | Tipe | Deskripsi |
|-------|------|-----------|
| code | VARCHAR(50) | Kode proses |
| name | VARCHAR(200) | Nama proses |
| category | VARCHAR(50) | 'cetak', 'potong', 'lipat', 'lem', 'finishing' |
| unit | VARCHAR(50) | Satuan (jam, meter, pcs, setup) |
| cost_per_unit | DECIMAL(15,2) | Biaya per satuan |
| machine_required | VARCHAR(200) | Mesin yang dibutuhkan |
| capacity_per_hour | INTEGER | Kapasitas per jam |
| applicable_product_types | VARCHAR[] | Jenis produk yang bisa |

**Seed Data:**
```
PROC-PRINT-001 - Printing Offset 1 Warna    - Rp 200,000/jam
PROC-PRINT-002 - Printing Offset 4 CMYK     - Rp 500,000/jam
PROC-PRINT-004 - Printing Rotogravure       - Rp 800,000/jam
PROC-CUT-003   - Die Cutting                - Rp 250,000/jam
PROC-GLUE-002  - Lem Mesin (Folder Gluer)   - Rp 200,000/jam
```

---

### 4. **master.finishing_options**
Master opsi finishing dengan harga

**Kolom:**
| Kolom | Tipe | Deskripsi |
|-------|------|-----------|
| code | VARCHAR(50) | Kode finishing |
| name | VARCHAR(200) | Nama finishing |
| category | VARCHAR(50) | 'laminating', 'emboss', 'spot_uv', 'handle' |
| cost_type | VARCHAR(50) | 'per_sqm', 'per_pcs', 'per_setup', 'percentage' |
| cost_value | DECIMAL(15,2) | Nilai biaya |

**Seed Data:**
```
FIN-LAMI-001   - Laminating Glossy      - Rp 5,000/m²
FIN-UV-001     - Spot UV                - Rp 8,000/m²
FIN-EMBOSS-001 - Emboss                 - Rp 500,000/setup
FIN-HOTST-001  - Hot Stamping Gold      - Rp 15,000/m²
FIN-PLONG-001  - Plong Handle Tengah    - Rp 150,000/1000pcs
```

---

## 📦 FORMULA TABLES

## 1️⃣ **price_formulas_polos**

**Untuk:** Kantong plastik polos (tanpa cetak atau cetak simple)

### Spesifikasi Unik:
```
✓ Ukuran 2D (lebar x panjang)
✓ Gusset (lipatan samping) opsional
✓ Material: PE, PP, OPP
✓ Ketebalan: mikron
✓ Handle: Plong, Tarik, Pita
✓ Printing: 0-2 warna (biasanya tanpa cetak)
```

### Kolom Spesifik:

#### **Spesifikasi Produk**
| Kolom | Tipe | Deskripsi |
|-------|------|-----------|
| width | DECIMAL(10,2) | Lebar kantong (cm) |
| length | DECIMAL(10,2) | Panjang kantong (cm) |
| gusset | DECIMAL(10,2) | Lipatan samping (cm, opsional) |
| material_name | VARCHAR(200) | PE, PP, OPP |
| material_thickness | DECIMAL(10,2) | Ketebalan (mikron) |
| material_color | VARCHAR(100) | Bening, Putih Susu, Hitam |
| handle_type | VARCHAR(100) | Plong, Tarik, Pita, Tanpa |
| handle_position | VARCHAR(100) | Tengah, Samping |
| has_printing | BOOLEAN | Ada cetak atau tidak |
| printing_colors | INTEGER | 0-2 warna |

#### **Perhitungan Biaya Material**
| Kolom | Tipe | Deskripsi |
|-------|------|-----------|
| area_per_pcs | DECIMAL(15,4) | Luas per pcs (m²) |
| material_weight_per_pcs | DECIMAL(15,4) | Berat material per pcs (kg) |
| material_price_per_kg | DECIMAL(15,2) | Harga material per kg |
| material_cost_per_pcs | DECIMAL(15,2) | Biaya material per pcs |
| waste_percentage | DECIMAL(5,2) | % waste (default 5%) |
| total_material_cost | DECIMAL(15,2) | Total biaya material + waste |

#### **Perhitungan Biaya Proses**
| Kolom | Tipe | Deskripsi |
|-------|------|-----------|
| setup_cost | DECIMAL(15,2) | Biaya setup mesin |
| production_time_per_1000pcs | DECIMAL(10,2) | Waktu produksi per 1000pcs (jam) |
| production_cost_per_hour | DECIMAL(15,2) | Biaya produksi per jam |
| total_production_cost | DECIMAL(15,2) | Total biaya produksi |
| handle_cost_per_pcs | DECIMAL(15,2) | Biaya plong handle per pcs |
| finishing_cost | DECIMAL(15,2) | Biaya finishing |
| total_process_cost | DECIMAL(15,2) | Total biaya proses |

#### **Total Cost & Pricing**
| Kolom | Tipe | Deskripsi |
|-------|------|-----------|
| total_cost_per_pcs | DECIMAL(15,2) | Material + Process per pcs |
| overhead_percentage | DECIMAL(5,2) | % overhead (default 15%) |
| overhead_cost | DECIMAL(15,2) | Biaya overhead |
| hpp_per_pcs | DECIMAL(15,2) | HPP per pcs |
| quantity | INTEGER | Jumlah order |
| total_hpp | DECIMAL(15,2) | Total HPP |
| margin_percentage | DECIMAL(5,2) | % margin (default 20%) |
| selling_price_per_pcs | DECIMAL(15,2) | Harga jual per pcs |
| total_selling_price | DECIMAL(15,2) | Total harga jual |
| ppn_percentage | DECIMAL(5,2) | % PPN (default 11%) |
| ppn_amount | DECIMAL(15,2) | Nilai PPN |
| grand_total | DECIMAL(15,2) | Grand total |

### Contoh Perhitungan:
```
Kantong Plastik PE 30x40 cm, 80 mikron, Plong Handle
─────────────────────────────────────────────────────
Lebar: 30 cm, Panjang: 40 cm
Area per pcs: 0.12 m²
Berat per pcs: 0.012 kg (PE 80 mikron)

Material Cost:
  Material: PE @ Rp 25,000/kg
  Berat: 0.012 kg x 25,000 = Rp 300
  Waste 5%: Rp 15
  Total Material: Rp 315/pcs

Process Cost:
  Setup: Rp 100,000 / 5,000 pcs = Rp 20/pcs
  Produksi: 2 jam @ Rp 150,000/jam / 5,000 = Rp 60/pcs
  Plong Handle: Rp 150,000/1000 = Rp 150/pcs
  Total Process: Rp 230/pcs

Total Cost: Rp 545/pcs
Overhead 15%: Rp 82/pcs
HPP: Rp 627/pcs
Margin 20%: Rp 125/pcs
Selling Price: Rp 752/pcs

Quantity: 5,000 pcs
Total Selling: Rp 3,760,000
PPN 11%: Rp 413,600
Grand Total: Rp 4,173,600
```

---

## 2️⃣ **price_formulas_offset**

**Untuk:** Kantong plastik offset (full color printing)

### Spesifikasi Unik:
```
✓ Printing CMYK full color
✓ Plat cetak (cylinder)
✓ Tinta offset water/solvent based
✓ Laminating options
✓ Kompleksitas design
```

### Kolom Spesifik (Tambahan dari Polos):

#### **Printing Specification**
| Kolom | Tipe | Deskripsi |
|-------|------|-----------|
| printing_method | VARCHAR(100) | Offset, Flexo |
| printing_colors | INTEGER | 1-6 warna (CMYK = 4) |
| printing_type | VARCHAR(100) | CMYK Full Color, 2 Warna, 3 Warna |
| print_side | VARCHAR(100) | 1 Sisi, 2 Sisi |
| print_area_width | DECIMAL(10,2) | Lebar area cetak (cm) |
| print_area_length | DECIMAL(10,2) | Panjang area cetak (cm) |
| print_coverage_percentage | DECIMAL(5,2) | % area yang dicetak |
| has_logo | BOOLEAN | Ada logo |
| has_photo | BOOLEAN | Ada foto |
| has_barcode | BOOLEAN | Ada barcode |
| design_complexity | VARCHAR(50) | Simple, Medium, Complex |

#### **Plat/Film**
| Kolom | Tipe | Deskripsi |
|-------|------|-----------|
| plat_cost | DECIMAL(15,2) | Biaya plat cetak |
| plat_size | VARCHAR(100) | Ukuran plat |
| number_of_plats | INTEGER | Jumlah plat |

#### **Biaya Tinta**
| Kolom | Tipe | Deskripsi |
|-------|------|-----------|
| ink_type | VARCHAR(100) | Water Based, Solvent, UV |
| ink_consumption_per_sqm | DECIMAL(10,4) | Konsumsi tinta per m² (kg) |
| ink_price_per_kg | DECIMAL(15,2) | Harga tinta per kg |
| total_ink_cost | DECIMAL(15,2) | Total biaya tinta |

#### **Proses Tambahan**
| Kolom | Tipe | Deskripsi |
|-------|------|-----------|
| plat_making_cost | DECIMAL(15,2) | Biaya pembuatan plat |
| printing_time_per_1000pcs | DECIMAL(10,2) | Waktu cetak per 1000pcs |
| printing_cost_per_hour | DECIMAL(15,2) | Biaya cetak per jam |
| total_printing_cost | DECIMAL(15,2) | Total biaya cetak |
| cutting_cost | DECIMAL(15,2) | Biaya potong |
| laminating_cost | DECIMAL(15,2) | Biaya laminating |

### Default Values:
```
waste_percentage: 8% (lebih tinggi dari polos)
margin_percentage: 25% (lebih tinggi karena value-added)
```

---

## 3️⃣ **price_formulas_boks**

**Untuk:** Boks/kemasan karton

### Spesifikasi Unik:
```
✓ Ukuran 3D (panjang x lebar x tinggi)
✓ Material karton: Duplex, Ivory, Kraft, Corrugated
✓ Proses lem & lipat
✓ Die cutting
✓ Optional window
```

### Kolom Spesifik:

#### **Spesifikasi 3 Dimensi**
| Kolom | Tipe | Deskripsi |
|-------|------|-----------|
| width | DECIMAL(10,2) | Lebar boks (cm) |
| length | DECIMAL(10,2) | Panjang boks (cm) |
| height | DECIMAL(10,2) | Tinggi boks (cm) |
| box_type | VARCHAR(100) | RSC, Die Cut, Mailer, Tuck Top |
| box_style | VARCHAR(100) | Single Wall, Double Wall, Triple Wall |

#### **Bahan Karton**
| Kolom | Tipe | Deskripsi |
|-------|------|-----------|
| material_name | VARCHAR(200) | Duplex, Ivory, Kraft, Corrugated |
| material_grade | VARCHAR(100) | B Flute, C Flute, E Flute |
| material_thickness | DECIMAL(10,2) | Gramasi (gsm) atau mm |
| material_color | VARCHAR(100) | Putih, Coklat, dll |

#### **Window (Opsional)**
| Kolom | Tipe | Deskripsi |
|-------|------|-----------|
| has_window | BOOLEAN | Ada jendela transparan |
| window_size | VARCHAR(100) | Ukuran jendela |
| window_film_cost | DECIMAL(15,2) | Biaya film jendela |

#### **Sheet Calculation**
| Kolom | Tipe | Deskripsi |
|-------|------|-----------|
| sheet_width | DECIMAL(10,2) | Lebar lembaran karton (cm) |
| sheet_length | DECIMAL(10,2) | Panjang lembaran karton (cm) |
| sheet_area | DECIMAL(15,4) | Luas lembaran (m²) |
| sheet_weight_per_pcs | DECIMAL(15,4) | Berat lembaran per pcs (kg) |

#### **Adhesive/Lem**
| Kolom | Tipe | Deskripsi |
|-------|------|-----------|
| adhesive_type | VARCHAR(100) | Lem Kertas, Lem Fox, Tape |
| adhesive_cost_per_pcs | DECIMAL(15,2) | Biaya lem per pcs |

#### **Proses Khusus Boks**
| Kolom | Tipe | Deskripsi |
|-------|------|-----------|
| die_cutting_cost | DECIMAL(15,2) | Biaya die cutting |
| scoring_cost | DECIMAL(15,2) | Biaya pond/garis lipat |
| gluing_time_per_1000pcs | DECIMAL(10,2) | Waktu lem per 1000pcs (jam) |
| gluing_cost_per_hour | DECIMAL(15,2) | Biaya lem per jam |
| total_gluing_cost | DECIMAL(15,2) | Total biaya lem |
| folding_cost | DECIMAL(15,2) | Biaya lipat (knock-down) |
| packing_cost_per_pcs | DECIMAL(15,2) | Biaya packing |

#### **Business Info**
| Kolom | Tipe | Deskripsi |
|-------|------|-----------|
| is_knockdown | BOOLEAN | Boks lipat/bongkar pasang |

### Default Values:
```
waste_percentage: 10% (paling tinggi)
margin_percentage: 30% (paling tinggi, produk premium)
```

### Contoh Perhitungan:
```
Boks Karton Duplex 20x20x15 cm, Full Color
───────────────────────────────────────────
Ukuran: 20x20x15 cm
Sheet size: 50x40 cm
Material: Duplex 350gsm

Material Cost:
  Sheet area: 0.20 m²
  Sheet weight: 0.070 kg (350gsm)
  Karton @ Rp 15,000/kg: Rp 1,050
  Lem: Rp 50
  Waste 10%: Rp 110
  Total Material: Rp 1,210/pcs

Process Cost:
  Setup: Rp 200,000 / 1,000 = Rp 200/pcs
  Printing 4C: 3 jam @ Rp 500,000 / 1,000 = Rp 1,500/pcs
  Die Cutting: Rp 300/pcs
  Scoring: Rp 100/pcs
  Lem & Lipat: Rp 400/pcs
  Laminating: Rp 500/pcs
  Total Process: Rp 3,000/pcs

Total Cost: Rp 4,210/pcs
Overhead 15%: Rp 632/pcs
HPP: Rp 4,842/pcs
Margin 30%: Rp 1,453/pcs
Selling Price: Rp 6,295/pcs

Quantity: 1,000 pcs
Total Selling: Rp 6,295,000
PPN 11%: Rp 692,450
Grand Total: Rp 6,987,450
```

---

## 4️⃣ **price_formulas_roto**

**Untuk:** Produk rotogravure/flexo roll (high quality, high volume)

### Spesifikasi Unik:
```
✓ Printing rotogravure (8 warna)
✓ Multi-layer film
✓ Cylinder cetak
✓ Roll panjang (meter)
✓ Laminating multi-layer
✓ MOQ tinggi
```

### Kolom Spesifik:

#### **Ukuran Roll**
| Kolom | Tipe | Deskripsi |
|-------|------|-----------|
| width | DECIMAL(10,2) | Lebar roll (cm) |
| length | DECIMAL(10,2) | Panjang per pcs/potong (cm) |
| roll_length | DECIMAL(15,2) | Total panjang roll (meter) |

#### **Multi-Layer Film**
| Kolom | Tipe | Deskripsi |
|-------|------|-----------|
| material_structure | VARCHAR(200) | 2 Layer (PE/PE), 3 Layer (PET/AL/PE) |
| layer_1_material | VARCHAR(100) | Material layer 1 |
| layer_1_thickness | DECIMAL(10,2) | Ketebalan layer 1 (mikron) |
| layer_2_material | VARCHAR(100) | Material layer 2 |
| layer_2_thickness | DECIMAL(10,2) | Ketebalan layer 2 (mikron) |
| layer_3_material | VARCHAR(100) | Material layer 3 (opsional) |
| layer_3_thickness | DECIMAL(10,2) | Ketebalan layer 3 (mikron) |

#### **Rotogravure Printing**
| Kolom | Tipe | Deskripsi |
|-------|------|-----------|
| printing_method | VARCHAR(100) | Rotogravure, Flexography |
| printing_colors | INTEGER | 1-8 warna |
| cylinder_size | VARCHAR(100) | 600mm, 800mm, 1000mm |
| cylinder_cost | DECIMAL(15,2) | Biaya cylinder cetak |
| number_of_cylinders | INTEGER | Jumlah cylinder |
| print_repeat_length | DECIMAL(10,2) | Panjang repeat (cm) |
| has_gradient | BOOLEAN | Ada gradasi warna |
| has_photo | BOOLEAN | Ada foto |

#### **Biaya Material Lengkap**
| Kolom | Tipe | Deskripsi |
|-------|------|-----------|
| material_weight_per_sqm | DECIMAL(10,4) | Berat material per m² (kg) |
| total_area | DECIMAL(15,4) | Total luas (m²) |
| total_material_weight | DECIMAL(15,4) | Total berat (kg) |
| material_price_per_kg | DECIMAL(15,2) | Harga per kg |
| total_material_cost | DECIMAL(15,2) | Total biaya material |

#### **Tinta & Solvent**
| Kolom | Tipe | Deskripsi |
|-------|------|-----------|
| ink_type | VARCHAR(100) | Solvent, Water Based |
| ink_consumption_per_sqm | DECIMAL(10,4) | Konsumsi tinta (kg/m²) |
| ink_price_per_kg | DECIMAL(15,2) | Harga tinta per kg |
| total_ink_cost | DECIMAL(15,2) | Total biaya tinta |
| solvent_consumption | DECIMAL(15,4) | Konsumsi solvent (liter) |
| solvent_price_per_liter | DECIMAL(15,2) | Harga solvent per liter |
| total_solvent_cost | DECIMAL(15,2) | Total biaya solvent |

#### **Adhesive (Laminating)**
| Kolom | Tipe | Deskripsi |
|-------|------|-----------|
| adhesive_consumption | DECIMAL(15,4) | Konsumsi adhesive (kg) |
| adhesive_price_per_kg | DECIMAL(15,2) | Harga adhesive per kg |
| total_adhesive_cost | DECIMAL(15,2) | Total biaya adhesive |

#### **Proses Produksi**
| Kolom | Tipe | Deskripsi |
|-------|------|-----------|
| cylinder_making_cost | DECIMAL(15,2) | Biaya pembuatan cylinder |
| machine_speed_mpm | DECIMAL(10,2) | Kecepatan mesin (meter/menit) |
| printing_time_hours | DECIMAL(10,2) | Total waktu cetak (jam) |
| printing_cost_per_hour | DECIMAL(15,2) | Biaya cetak per jam |
| total_printing_cost | DECIMAL(15,2) | Total biaya cetak |
| laminating_cost | DECIMAL(15,2) | Biaya laminating |
| slitting_cost | DECIMAL(15,2) | Biaya potong roll (slitting) |

#### **Perhitungan Roll & Pcs**
| Kolom | Tipe | Deskripsi |
|-------|------|-----------|
| total_cost_per_roll | DECIMAL(15,2) | Biaya per roll |
| pcs_per_roll | INTEGER | Jumlah pcs per roll |
| cost_per_pcs | DECIMAL(15,2) | Biaya per pcs |
| hpp_per_roll | DECIMAL(15,2) | HPP per roll |
| hpp_per_pcs | DECIMAL(15,2) | HPP per pcs |
| quantity_rolls | INTEGER | Jumlah roll |
| quantity_pcs | INTEGER | Jumlah pcs |
| total_hpp | DECIMAL(15,2) | Total HPP |
| selling_price_per_roll | DECIMAL(15,2) | Harga jual per roll |
| selling_price_per_pcs | DECIMAL(15,2) | Harga jual per pcs |

#### **Business Info**
| Kolom | Tipe | Deskripsi |
|-------|------|-----------|
| minimum_order_quantity | INTEGER | MOQ (biasanya tinggi) |

### Default Values:
```
waste_percentage: 12% (paling tinggi)
margin_percentage: 25%
```

---

## 🔄 Relationships

```
master.material_types
    ↓ (material_type_id)
price_formulas_[polos/offset/boks/roto]
    ↓ (customer_id)
sales.customers

auth.users
    ↓ (sales_person_id, approved_by)
price_formulas_[polos/offset/boks/roto]
```

---

## 📈 Query Examples

### Mendapatkan semua formula untuk customer tertentu
```sql
-- Semua formula polos untuk customer
SELECT * FROM sales.price_formulas_polos
WHERE customer_id = 'uuid-customer'
ORDER BY created_at DESC;

-- Gabungan semua jenis formula untuk customer
SELECT 
  'polos' as type, id, code, product_name, 
  selling_price_per_pcs, quantity, grand_total, 
  status, created_at
FROM sales.price_formulas_polos
WHERE customer_id = 'uuid-customer'

UNION ALL

SELECT 
  'offset' as type, id, code, product_name,
  selling_price_per_pcs, quantity, grand_total,
  status, created_at
FROM sales.price_formulas_offset
WHERE customer_id = 'uuid-customer'

UNION ALL

SELECT 
  'boks' as type, id, code, product_name,
  selling_price_per_pcs, quantity, grand_total,
  status, created_at
FROM sales.price_formulas_boks
WHERE customer_id = 'uuid-customer'

UNION ALL

SELECT 
  'roto' as type, id, code, product_name,
  selling_price_per_pcs, quantity_pcs as quantity, grand_total,
  status, created_at
FROM sales.price_formulas_roto
WHERE customer_id = 'uuid-customer'

ORDER BY created_at DESC;
```

### Analisis margin per produk type
```sql
-- Average margin per product type
SELECT 
  'polos' as product_type,
  COUNT(*) as total_formulas,
  AVG(margin_percentage) as avg_margin,
  SUM(grand_total) as total_revenue
FROM sales.price_formulas_polos
WHERE status = 'approved'

UNION ALL

SELECT 'offset', COUNT(*), AVG(margin_percentage), SUM(grand_total)
FROM sales.price_formulas_offset WHERE status = 'approved'

UNION ALL

SELECT 'boks', COUNT(*), AVG(margin_percentage), SUM(grand_total)
FROM sales.price_formulas_boks WHERE status = 'approved'

UNION ALL

SELECT 'roto', COUNT(*), AVG(margin_percentage), SUM(grand_total)
FROM sales.price_formulas_roto WHERE status = 'approved';
```

### Material usage report
```sql
-- Material paling banyak digunakan (polos)
SELECT 
  material_name,
  COUNT(*) as usage_count,
  AVG(material_thickness) as avg_thickness,
  SUM(quantity * material_weight_per_pcs) as total_weight_kg
FROM sales.price_formulas_polos
WHERE status IN ('approved', 'sent')
  AND created_at >= NOW() - INTERVAL '30 days'
GROUP BY material_name
ORDER BY usage_count DESC;
```

---

## 🚀 Migration

```bash
# Run migration
cd /workspaces/default/code
supabase db push
```

Verify:
```sql
-- Check tables
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'sales' 
  AND table_name LIKE 'price_formulas_%';

-- Check master data
SELECT COUNT(*) FROM master.material_types;
SELECT COUNT(*) FROM master.standard_sizes;
SELECT COUNT(*) FROM master.production_processes;
SELECT COUNT(*) FROM master.finishing_options;
```

---

## 📝 Notes

1. **Waste Percentage Guidelines:**
   - Polos: 5% (simple production)
   - Offset: 8% (printing adds waste)
   - Boks: 10% (complex die cutting)
   - Roto: 12% (highest waste, cylinder setup)

2. **Margin Guidelines:**
   - Polos: 20% (commodity)
   - Offset: 25% (value-added printing)
   - Boks: 30% (premium packaging)
   - Roto: 25% (volume business)

3. **Overhead Default:** 15% untuk semua jenis

4. **PPN Default:** 11%

---

**Last Updated:** 2026-04-18  
**Version:** 2.0 (Specific Tables)
