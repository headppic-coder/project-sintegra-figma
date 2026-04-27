# Fitur Auto-Uppercase Nama Customer

## 🎯 Deskripsi

Fitur ini memastikan bahwa **semua nama customer** selalu tersimpan dalam format **UPPERCASE** (huruf besar semua), meskipun user menginput dengan huruf kecil atau campuran.

---

## ✨ Cara Kerja

### 1. **Real-time Uppercase Saat Input**

Saat user mengetik nama customer, teks akan **otomatis berubah menjadi uppercase** secara real-time.

**Contoh:**
- User ketik: `pt maju jaya`
- Yang tampil di input: `PT MAJU JAYA` ✅

### 2. **Validasi Sebelum Simpan**

Sebelum data disimpan ke database, sistem akan **memastikan** nama customer di-uppercase di API level.

**Flow:**
```
User Input → Frontend Auto-Uppercase → API Validation → Database (UPPERCASE)
```

---

## 📍 Lokasi Implementasi

### 1. **Form Customer** (`customer-form.tsx`)

**Input Manual:**
```tsx
<Input
  value={formData.customerName}
  onChange={(e) => setFormData({
    ...formData,
    customerName: e.target.value.toUpperCase()
  })}
  style={{ textTransform: 'uppercase' }}
/>
```

**Ambil dari Prospective Customer:**
```tsx
customerName: prospect.customerName.toUpperCase()
```

**Ambil dari Pipeline:**
```tsx
customerName: pipeline.customer.toUpperCase()
```

---

### 2. **Form Calon Customer** (`prospective-customers.tsx`)

```tsx
<Input
  value={formData.customerName}
  onChange={(e) => setFormData({
    ...formData,
    customerName: e.target.value.toUpperCase()
  })}
  style={{ textTransform: 'uppercase' }}
/>
```

---

### 3. **Form Pipeline** (`pipeline-form.tsx`)

**Input Manual Customer:**
```tsx
<Input
  value={formData.customer}
  onChange={(e) => setFormData({
    ...formData,
    customer: e.target.value.toUpperCase()
  })}
  style={{ textTransform: 'uppercase' }}
/>
```

**Pilih dari Existing Customer:**
```tsx
customer: customer.customerName.toUpperCase()
```

**Input Calon Customer Baru di Modal:**
```tsx
<Input
  value={prospectForm.customerName}
  onChange={(e) => setProspectForm({
    ...prospectForm,
    customerName: e.target.value.toUpperCase()
  })}
  style={{ textTransform: 'uppercase' }}
/>
```

**Pilih dari Existing Prospective Customer:**
```tsx
customerName: prospect.customerName.toUpperCase()
```

---

### 4. **API Level** (`api.ts`)

#### Customer API

```typescript
async createCustomer(data: any) {
  const normalizedData = {
    ...data,
    customerName: data.customerName ? data.customerName.toUpperCase() : data.customerName
  };
  await kvSet(id, { ...normalizedData, id, createdAt: new Date().toISOString() });
}

async updateCustomer(id: string, data: any) {
  const normalizedData = {
    ...data,
    customerName: data.customerName ? data.customerName.toUpperCase() : data.customerName
  };
  await kvSet(id, { ...existing, ...normalizedData, updatedAt: new Date().toISOString() });
}
```

#### Prospective Customer API

```typescript
async createProspectiveCustomer(data: any) {
  const normalizedData = {
    ...data,
    customerName: data.customerName ? data.customerName.toUpperCase() : data.customerName
  };
  // ...
}

async updateProspectiveCustomer(id: string, data: any) {
  const normalizedData = {
    ...data,
    customerName: data.customerName ? data.customerName.toUpperCase() : data.customerName
  };
  // ...
}
```

#### Pipeline API

```typescript
async createPipeline(data: any) {
  const normalizedData = {
    ...data,
    customer: data.customer ? data.customer.toUpperCase() : data.customer
  };
  // ...
}

async updatePipeline(id: string, data: any) {
  const normalizedData = {
    ...data,
    customer: data.customer ? data.customer.toUpperCase() : data.customer
  };
  // ...
}
```

#### Sync Customer to Pipelines

```typescript
async syncCustomerToPipelines(customerId: string, customerData: any) {
  const updatedPipeline = {
    ...pipeline,
    customer: customerData.customerName ? customerData.customerName.toUpperCase() : customerData.customerName,
    // ...
  };
}
```

---

## 🔍 Contoh Penggunaan

### Skenario 1: Input Manual Customer

**User Action:**
1. Buka form Customer
2. Ketik nama: `pt sentosa abadi`
3. Saat mengetik, otomatis berubah: `PT SENTOSA ABADI`
4. Klik "Simpan"

**Result:**
- Database: `customerName: "PT SENTOSA ABADI"` ✅

---

### Skenario 2: Buat Customer dari Pipeline

**User Action:**
1. Buka form Pipeline
2. Input manual customer: `cv maju terus`
3. Otomatis uppercase: `CV MAJU TERUS`
4. Klik "Lengkapi Customer"
5. Form customer terbuka dengan nama: `CV MAJU TERUS`

**Result:**
- Database customer: `customerName: "CV MAJU TERUS"` ✅
- Database pipeline: `customer: "CV MAJU TERUS"` ✅

---

### Skenario 3: Update Nama Customer

**Before:**
- Customer: `PT ABC` (sudah uppercase)

**User Action:**
1. Edit customer
2. Ubah nama jadi: `pt abc indonesia`
3. Otomatis uppercase: `PT ABC INDONESIA`
4. Klik "Simpan"

**Result:**
- Database customer: `customerName: "PT ABC INDONESIA"` ✅
- Semua pipeline terkait: `customer: "PT ABC INDONESIA"` ✅ (via auto-sync)

---

### Skenario 4: Calon Customer → Customer

**User Action:**
1. Buat Calon Customer: ketik `pt xyz`
2. Tersimpan: `PT XYZ` ✅
3. Konversi ke Customer
4. Nama otomatis terisi: `PT XYZ`

**Result:**
- Prospective Customer: `customerName: "PT XYZ"` ✅
- Customer: `customerName: "PT XYZ"` ✅

---

## 🛡️ Safety & Validation

### 1. **Null/Undefined Handling**

```typescript
customerName: data.customerName ? data.customerName.toUpperCase() : data.customerName
```

**Penjelasan:**
- Jika `customerName` null/undefined → tidak error, tetap null/undefined
- Jika `customerName` ada → di-uppercase

### 2. **CSS `textTransform: 'uppercase'`**

```tsx
style={{ textTransform: 'uppercase' }}
```

**Fungsi:**
- Memastikan tampilan visual selalu uppercase
- User tidak bingung karena langsung melihat uppercase saat mengetik

### 3. **Multi-Layer Validation**

**Layer 1:** Frontend `onChange` → `toUpperCase()`  
**Layer 2:** Frontend `style` → `textTransform: 'uppercase'`  
**Layer 3:** API level → `toUpperCase()` sebelum save

**Benefit:**
- Jika user bypass frontend (misal via API call langsung), tetap ter-uppercase di API level

---

## ⚙️ Technical Details

### CSS `textTransform` vs JavaScript `toUpperCase()`

| Method | Fungsi | Scope |
|--------|--------|-------|
| `style={{ textTransform: 'uppercase' }}` | Visual saja (tampilan UI) | Client-side |
| `e.target.value.toUpperCase()` | Mengubah value sebenarnya | Client-side |
| API `data.customerName.toUpperCase()` | Validasi final sebelum save | Server-side |

**Best Practice:**
Gunakan **ketiganya** untuk keamanan maksimal.

---

## 🧪 Testing

### Test Case 1: Input Lowercase

**Input:** `pt maju jaya sentosa`  
**Expected:** `PT MAJU JAYA SENTOSA`

### Test Case 2: Input Mixed Case

**Input:** `Pt MaJu JaYa`  
**Expected:** `PT MAJU JAYA`

### Test Case 3: Input Already Uppercase

**Input:** `PT MAJU JAYA`  
**Expected:** `PT MAJU JAYA` (tetap sama)

### Test Case 4: Input dengan Angka & Simbol

**Input:** `pt abc 123 - indonesia`  
**Expected:** `PT ABC 123 - INDONESIA`

### Test Case 5: Copy-Paste Lowercase

**Action:** Copy `pt sentosa` → Paste di input  
**Expected:** `PT SENTOSA`

### Test Case 6: Empty/Null

**Input:** `` (kosong)  
**Expected:** Tidak error, tetap kosong

---

## 🎨 User Experience

### Feedback Visual

User akan langsung melihat teks berubah uppercase saat mengetik:

```
User ketik: p → Tampil: P
User ketik: t → Tampil: PT
User ketik:   → Tampil: PT 
User ketik: m → Tampil: PT M
User ketik: a → Tampil: PT MA
```

**Benefit:**
- User tahu bahwa sistem akan menyimpan dalam uppercase
- Tidak ada surprise saat data tersimpan

---

## 📝 Catatan

### Field yang Di-Uppercase

✅ **Customer Name** (`customerName` di Customer & Prospective Customer)  
✅ **Customer di Pipeline** (`customer` di Pipeline)

### Field yang TIDAK Di-Uppercase

❌ Alamat (`address`, `billingAddress`, `shippingAddress`)  
❌ Email (`email`)  
❌ Telepon (`phone`, `companyPhone`)  
❌ Catatan (`notes`)  
❌ Nama PIC (`contacts.pic`)

**Alasan:** Field tersebut lebih natural dalam mixed case.

---

## 🔧 Maintenance

### Jika Perlu Update Logic

**File yang harus diubah:**

1. Frontend forms:
   - `src/app/pages/sales/customer-form.tsx`
   - `src/app/pages/sales/prospective-customers.tsx`
   - `src/app/pages/sales/pipeline-form.tsx`

2. API functions:
   - `src/app/lib/api.ts`
     - `createCustomer()`
     - `updateCustomer()`
     - `createProspectiveCustomer()`
     - `updateProspectiveCustomer()`
     - `createPipeline()`
     - `updatePipeline()`
     - `syncCustomerToPipelines()`

---

## 🆘 Troubleshooting

### Masalah: Data tersimpan lowercase

**Check:**
1. Apakah `onChange` sudah ada `.toUpperCase()`?
2. Apakah API sudah ada normalisasi uppercase?
3. Clear cache browser dan test ulang

**Fix:**
Pastikan semua 3 layer (onChange, CSS, API) sudah implement uppercase.

---

### Masalah: Tidak bisa ketik huruf kecil

**Expected Behavior:**
User **BISA** ketik huruf kecil, tapi **otomatis berubah** jadi uppercase.

**Jika benar-benar tidak bisa ketik:**
Check apakah ada JavaScript error di browser console.

---

## 📚 Related Features

- **Auto-Sync Customer to Pipeline:** Nama customer yang di-update otomatis sync ke pipeline (sudah uppercase)
- **Data Validation:** Semua nama customer konsisten uppercase di seluruh sistem
- **Search & Filter:** Lebih mudah search karena format konsisten

---

**Version:** 1.0  
**Last Updated:** April 2026  
**Feature Status:** ✅ Active
