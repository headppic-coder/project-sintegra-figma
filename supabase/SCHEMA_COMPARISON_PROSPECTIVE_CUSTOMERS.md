# ⚠️ Schema Comparison: Prospective Customers

## Perbedaan Schema Tampilan vs Database

### ❌ **TIDAK SAMA** - Ada perbedaan signifikan!

---

## 📊 Perbandingan Detail

### Database Schema (Migration File)
**File:** `20260413000015_create_additional_sales_tables.sql`

```sql
CREATE TABLE sales.prospective_customers (
  -- Identity & Basic Info
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prospect_number VARCHAR(50) UNIQUE NOT NULL,
  company_name VARCHAR(200) NOT NULL,
  
  -- Contact Info
  contact_person VARCHAR(200),
  title_position VARCHAR(100),
  phone VARCHAR(50),
  mobile VARCHAR(50),
  email VARCHAR(200),
  
  -- Address
  address TEXT,
  city VARCHAR(100),
  postal_code VARCHAR(20),
  website VARCHAR(200),
  
  -- Relations (Foreign Keys)
  industry_category_id UUID REFERENCES sales.industry_categories(id),
  lead_source_id UUID REFERENCES sales.lead_sources(id),
  region_id UUID REFERENCES sales.regions(id),
  segment_id UUID REFERENCES sales.segments(id),
  sales_person_id UUID REFERENCES auth.users(id),
  
  -- Sales Info
  estimated_potential DECIMAL(15,2),
  status VARCHAR(50) DEFAULT 'new',
  qualification_score INTEGER, -- 1-100
  
  -- Conversion
  conversion_date DATE,
  customer_id UUID REFERENCES sales.customers(id),
  lost_reason TEXT,
  
  -- Additional
  notes TEXT,
  
  -- Audit Trail
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);
```

**Total Fields:** 27 fields

---

### Frontend Interface (Current)
**File:** `src/app/pages/sales/prospective-customers.tsx`

```typescript
interface ProspectiveCustomer {
  id: string;
  customerName: string;      // ❌ Should be: company_name
  phone: string;              // ✅ OK
  address: string;            // ✅ OK
  city: string;               // ✅ OK
  leadSource: string;         // ❌ Should be: lead_source_id (UUID)
  salesPic: string;           // ❌ Should be: sales_person_id (UUID)
  notes: string;              // ✅ OK
  createdAt: string;          // ❌ Should be: created_at
}
```

**Total Fields:** 9 fields

---

## 🔍 Masalah yang Ditemukan

### 1. **Field Names Tidak Match**

| Frontend (Current) | Database (Should be) | Status |
|-------------------|---------------------|--------|
| `customerName` | `company_name` | ❌ Beda |
| `leadSource` | `lead_source_id` | ❌ Beda (type juga beda) |
| `salesPic` | `sales_person_id` | ❌ Beda (type juga beda) |
| `createdAt` | `created_at` | ❌ Beda |

### 2. **Missing Fields di Frontend**

Fields penting yang ada di database tapi tidak ada di frontend:

- ❌ `prospect_number` - Nomor unik prospect
- ❌ `contact_person` - Nama kontak person
- ❌ `title_position` - Jabatan kontak person
- ❌ `mobile` - Nomor HP
- ❌ `email` - Email
- ❌ `postal_code` - Kode pos
- ❌ `website` - Website perusahaan
- ❌ `industry_category_id` - Kategori industri
- ❌ `region_id` - Wilayah
- ❌ `segment_id` - Segmen customer
- ❌ `estimated_potential` - Estimasi nilai potensial
- ❌ `status` - Status (new, contacted, qualified, dll)
- ❌ `qualification_score` - Skor kualifikasi (1-100)
- ❌ `conversion_date` - Tanggal konversi
- ❌ `customer_id` - ID customer (saat sudah convert)
- ❌ `lost_reason` - Alasan kalah/lost
- ❌ `updated_at` - Tanggal update terakhir
- ❌ `created_by` - Dibuat oleh siapa

### 3. **Data Type Issues**

| Field | Frontend Type | Database Type | Issue |
|-------|--------------|---------------|-------|
| `leadSource` | string (nama) | UUID (reference) | ❌ Harus simpan ID, bukan nama |
| `salesPic` | string (nama) | UUID (reference) | ❌ Harus simpan user ID, bukan nama |

---

## ✅ Solusi: Update Frontend Interface

### Recommended New Interface

```typescript
interface ProspectiveCustomer {
  // Identity & Basic Info
  id: string
  prospect_number: string
  company_name: string
  
  // Contact Info
  contact_person?: string
  title_position?: string
  phone?: string
  mobile?: string
  email?: string
  
  // Address
  address?: string
  city?: string
  postal_code?: string
  website?: string
  
  // Relations (Foreign Keys)
  industry_category_id?: string
  lead_source_id?: string
  region_id?: string
  segment_id?: string
  sales_person_id?: string
  
  // Sales Info
  estimated_potential?: number
  status: 'new' | 'contacted' | 'qualified' | 'proposal' | 'negotiation' | 'converted' | 'lost'
  qualification_score?: number // 1-100
  
  // Conversion
  conversion_date?: string
  customer_id?: string
  lost_reason?: string
  
  // Additional
  notes?: string
  
  // Audit Trail
  created_at: string
  updated_at: string
  created_by?: string
  
  // Populated fields (from joins) - optional
  lead_source?: {
    id: string
    source_name: string
    source_type: string
  }
  region?: {
    id: string
    region_name: string
    province: string
  }
  segment?: {
    id: string
    segment_name: string
  }
  industry_category?: {
    id: string
    category_name: string
  }
}
```

---

## 🔧 Action Items

### 1. Update TypeScript Interface
```typescript
// File: src/types/prospective-customers.types.ts
export interface ProspectiveCustomer {
  // Use schema above
}
```

### 2. Update Form Fields

Tambahkan field yang missing:

```typescript
const [formData, setFormData] = useState({
  prospect_number: '',        // Auto-generate
  company_name: '',           // ✅ Rename from customerName
  contact_person: '',         // ✅ Add
  title_position: '',         // ✅ Add
  phone: '',
  mobile: '',                 // ✅ Add
  email: '',                  // ✅ Add
  address: '',
  city: '',
  postal_code: '',            // ✅ Add
  website: '',                // ✅ Add
  industry_category_id: '',   // ✅ Add
  lead_source_id: '',         // ✅ Change from leadSource
  region_id: '',              // ✅ Add
  segment_id: '',             // ✅ Add
  sales_person_id: '',        // ✅ Change from salesPic
  estimated_potential: 0,     // ✅ Add
  status: 'new',              // ✅ Add
  qualification_score: 0,     // ✅ Add
  notes: ''
})
```

### 3. Update DataTable Columns

```typescript
const columns = [
  { key: 'prospect_number', label: 'No. Prospect' },
  { key: 'company_name', label: 'Nama Perusahaan' },
  { key: 'contact_person', label: 'Kontak Person' },
  { key: 'phone', label: 'Telepon' },
  { key: 'email', label: 'Email' },
  { key: 'city', label: 'Kota' },
  { 
    key: 'lead_source', 
    label: 'Sumber Lead',
    render: (value: any) => value?.source_name || '-'
  },
  { 
    key: 'status', 
    label: 'Status',
    render: (value: string) => {
      const statusMap: any = {
        'new': 'Baru',
        'contacted': 'Dihubungi',
        'qualified': 'Qualified',
        'proposal': 'Proposal',
        'negotiation': 'Negosiasi',
        'converted': 'Converted',
        'lost': 'Lost'
      }
      return statusMap[value] || value
    }
  },
  { 
    key: 'qualification_score', 
    label: 'Score',
    render: (value: number) => value ? `${value}/100` : '-'
  },
  {
    key: 'created_at',
    label: 'Tanggal',
    render: (value: string) => new Date(value).toLocaleDateString('id-ID')
  }
]
```

### 4. Update API Calls

```typescript
// Get with relations
const fetchData = async () => {
  const { data, error } = await supabase
    .from('sales.prospective_customers')
    .select(`
      *,
      lead_source:sales.lead_sources!lead_source_id(
        id,
        source_name,
        source_type
      ),
      region:sales.regions!region_id(
        id,
        region_name,
        province
      ),
      segment:sales.segments!segment_id(
        id,
        segment_name
      ),
      industry_category:sales.industry_categories!industry_category_id(
        id,
        category_name
      ),
      sales_person:auth.users!sales_person_id(
        id,
        email
      )
    `)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data
}
```

---

## 📋 Summary

| Aspect | Current | Should Be |
|--------|---------|-----------|
| Field Count | 9 fields | 27 fields |
| Naming Convention | camelCase | snake_case |
| Foreign Keys | Stored as names (string) | Stored as IDs (UUID) |
| Status Field | ❌ Missing | ✅ Should have |
| Prospect Number | ❌ Missing | ✅ Should have |
| Relations | ❌ Not properly linked | ✅ Should use FK |
| Completeness | ~33% | 100% |

---

## ⚡ Quick Fix Priority

**Priority 1 (Critical):**
1. ✅ Rename `customerName` → `company_name`
2. ✅ Change `leadSource` → `lead_source_id` (UUID)
3. ✅ Change `salesPic` → `sales_person_id` (UUID)
4. ✅ Add `prospect_number` field
5. ✅ Add `status` field

**Priority 2 (Important):**
6. ✅ Add `contact_person`, `title_position`
7. ✅ Add `email`, `mobile`
8. ✅ Add `region_id`, `segment_id`
9. ✅ Add `estimated_potential`
10. ✅ Add `qualification_score`

**Priority 3 (Nice to have):**
11. ✅ Add `industry_category_id`
12. ✅ Add `postal_code`, `website`
13. ✅ Add `conversion_date`, `customer_id`
14. ✅ Add `lost_reason`

---

## 🎯 Conclusion

**Status:** ❌ **TIDAK SAMA**

Frontend interface hanya menggunakan **33% dari fields** yang tersedia di database. Perlu update signifikan untuk match dengan database schema yang sudah dibuat.

**Recommendation:** Update frontend interface sesuai dengan database schema untuk memanfaatkan semua fitur yang sudah tersedia.
