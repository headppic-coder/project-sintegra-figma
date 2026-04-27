# Pipeline Auto Stage Documentation

## Fitur Otomatis Stage Pipeline

Sistem ini memiliki fitur otomatis untuk mengatur stage pipeline berdasarkan jenis dan status customer. Hal ini membantu sales team untuk memiliki konsistensi dalam proses penjualan.

---

## 🎯 Kondisi Auto-Set Stage

### Kondisi 1: Customer Baru → Stage "Lead"

**Trigger:**
- Saat membuat pipeline baru dengan **input manual** (⌨️ Input Manual)
- Saat membuat pipeline baru dengan **menambah calon customer** (tombol + )

**Behavior:**
```
User Action: Pilih "Input Manual" atau klik tombol "+"
           ↓
Auto-set: stage = "Lead"
Auto-set: orderType = "New"
```

**Notifikasi:**
- Toast: "Stage otomatis diset ke Lead untuk customer baru"
- Help text: "🎯 Stage otomatis: Lead (Customer Baru / Calon Customer)"

**Alasan:**
Lead adalah stage awal untuk customer yang belum terdaftar di sistem. Customer ini masih dalam tahap prospecting dan perlu diqualifikasi.

---

### Kondisi 2: Customer Terdaftar → Stage "Qualifikasi"

**Trigger:**
- Saat membuat pipeline baru dengan **memilih customer dari database**

**Behavior:**
```
User Action: Pilih customer dari dropdown
           ↓
Auto-set: stage = "Qualifikasi"
Auto-set: orderType = "Repeat Order"
Auto-fill: alamat, nomorTelepon dari data customer
```

**Notifikasi:**
- Toast: "Stage otomatis diset ke Qualifikasi karena customer sudah terdaftar"
- Help text: "✅ Stage otomatis: Qualifikasi (Customer Terdaftar)"

**Alasan:**
Customer yang sudah terdaftar di database berarti sudah pernah melalui proses Lead sebelumnya. Untuk opportunity baru, langsung dimulai dari stage Qualifikasi.

---

### Kondisi 3: Lead → Qualifikasi (Saat Melengkapi Data)

**Trigger:**
- Pipeline dengan stage "Lead"
- Sales melengkapi data customer melalui tombol "Lengkapi Data Customer"
- Customer diisi **Kategori Industri**

**Behavior:**
```
Pipeline State: stage = "Lead"
             ↓
User Action: Lengkapi Data Customer
             + Isi Kategori Industri
             ↓
Auto-update: stage = "Qualifikasi"
Auto-update: customerId = (customer ID yang baru dibuat)
```

**Notifikasi:**
- Toast: "✅ Pipeline berhasil dihubungkan dengan customer dan stage diupdate ke Qualifikasi"

**Alasan:**
Mengisi kategori industri menunjukkan bahwa customer sudah diqualifikasi. Sales sudah memahami profil dan kebutuhan customer, sehingga pipeline siap pindah ke tahap berikutnya.

---

## 📊 Flow Diagram

```
┌─────────────────────┐
│  Tambah Pipeline    │
└──────────┬──────────┘
           │
           ├─────────────────────┐
           │                     │
    ┌──────▼──────┐       ┌─────▼──────┐
    │ Input Manual│       │ Pilih dari │
    │     atau    │       │  Database  │
    │  Klik "+"   │       │  Customer  │
    └──────┬──────┘       └─────┬──────┘
           │                    │
    ┌──────▼──────┐      ┌─────▼──────┐
    │ Stage: Lead │      │   Stage:   │
    │ Type: New   │      │Qualifikasi │
    └──────┬──────┘      │ Type:Repeat│
           │             └─────┬──────┘
           │                   │
    ┌──────▼──────────────┐    │
    │ Lengkapi Data       │    │
    │ + Kategori Industri │    │
    └──────┬──────────────┘    │
           │                   │
    ┌──────▼───────┐           │
    │   Stage:     │           │
    │ Qualifikasi  │           │
    └──────┬───────┘           │
           │                   │
           └───────┬───────────┘
                   │
           ┌───────▼───────┐
           │   Continue    │
           │    Sales      │
           │    Process    │
           └───────────────┘
```

---

## 🔄 Stage Progression

### Normal Flow

```
Lead → Qualifikasi → Presentasi → Proposal → Negosiasi → Closing
                                                             │
                                                         ┌───┴───┐
                                                         │  Won  │
                                                         └───────┘
```

### Dengan Auto-Stage

**Scenario A: Customer Baru**
```
1. Input Manual/Calon Customer
   └─ AUTO: Lead

2. Lengkapi Data Customer + Kategori Industri
   └─ AUTO: Qualifikasi

3. Manual progression
   └─ Presentasi → Proposal → Negosiasi → Closing
```

**Scenario B: Customer Terdaftar**
```
1. Pilih dari Database
   └─ AUTO: Qualifikasi

2. Manual progression
   └─ Presentasi → Proposal → Negosiasi → Closing
```

---

## 💻 Implementation Details

### File yang Terlibat

1. **src/app/pages/sales/pipeline-form.tsx**
   - `handleCustomerChange()` - Set stage ke "Qualifikasi" saat pilih customer
   - `handleManualInput()` - Set stage ke "Lead" saat input manual
   - `handleSaveProspect()` - Set stage ke "Lead" saat tambah calon customer

2. **src/app/pages/sales/customer-form.tsx**
   - `handleSubmit()` - Update stage pipeline dari "Lead" ke "Qualifikasi" saat melengkapi data

### State Management

```typescript
// Pipeline Form
const [formData, setFormData] = useState({
  stage: 'Lead',  // Default stage
  orderType: '',
  customer: '',
  // ... other fields
});

const [selectedCustomerId, setSelectedCustomerId] = useState('');
```

### API Calls

```typescript
// Update pipeline stage saat melengkapi customer
await api.updatePipeline(pipelineId, {
  ...pipeline,
  customerId: newCustomer.id,
  customer: formData.customerName,
  stage: newStage, // "Qualifikasi" jika dari "Lead"
});
```

---

## ✅ Checklist Implementasi

- [x] Kondisi 1: Input Manual → Lead
- [x] Kondisi 1: Tambah Calon Customer (+) → Lead
- [x] Kondisi 2: Pilih dari Database → Qualifikasi
- [x] Kondisi 3: Lead + Kategori Industri → Qualifikasi
- [x] Toast notifications untuk setiap kondisi
- [x] Visual indicators (help text) di UI
- [x] Auto-fill alamat dan telepon dari customer database

---

## 🧪 Testing Scenarios

### Test 1: Input Manual

1. Buka form tambah pipeline
2. Pilih "⌨️ Input Manual" dari dropdown
3. **Expected:**
   - Stage auto-set ke "Lead"
   - OrderType auto-set ke "New"
   - Toast notification muncul

### Test 2: Tambah Calon Customer

1. Buka form tambah pipeline
2. Klik tombol "+"
3. Isi form calon customer
4. Klik Simpan
5. **Expected:**
   - Calon customer tersimpan
   - Nama customer auto-fill di pipeline form
   - Stage auto-set ke "Lead"
   - OrderType auto-set ke "New"

### Test 3: Pilih dari Database

1. Buka form tambah pipeline
2. Pilih customer dari dropdown
3. **Expected:**
   - Stage auto-set ke "Qualifikasi"
   - OrderType auto-set ke "Repeat Order"
   - Alamat dan telepon auto-fill

### Test 4: Upgrade dari Lead ke Qualifikasi

1. Buat pipeline dengan stage "Lead" (gunakan input manual)
2. Dari detail pipeline, klik "Lengkapi Data Customer"
3. Isi form customer dengan **Kategori Industri**
4. Simpan customer
5. **Expected:**
   - Customer tersimpan
   - Pipeline stage berubah dari "Lead" ke "Qualifikasi"
   - customerId di pipeline ter-update
   - Toast notification konfirmasi stage update

---

## 📝 Notes

### Stage Manual Override

Meskipun stage di-set otomatis, user **tetap bisa mengubah** stage secara manual jika diperlukan. Sistem tidak akan memaksa stage tertentu.

### Kategori Industri sebagai Trigger

Kategori Industri dipilih sebagai trigger untuk kondisi 3 karena:
- Menunjukkan customer sudah diqualifikasi
- Sales sudah memahami industri/bisnis customer
- Data penting untuk segmentasi dan analisis

### Backward Compatibility

Pipeline yang sudah ada tidak akan terpengaruh oleh fitur auto-stage ini. Hanya berlaku untuk pipeline baru atau update manual.

---

## 🔮 Future Enhancements

Beberapa ide untuk pengembangan fitur ini:

1. **Auto-progression Reminder**
   - Reminder otomatis jika pipeline stuck di satu stage terlalu lama
   - Notifikasi untuk follow-up

2. **Stage Validation**
   - Validasi field yang harus diisi sebelum bisa pindah stage
   - Contoh: Stage "Proposal" harus ada quotation

3. **Analytics Dashboard**
   - Conversion rate per stage
   - Average time di setiap stage
   - Bottleneck identification

4. **Stage Automation Rules**
   - Custom rules untuk auto-stage berdasarkan kriteria lain
   - Contoh: Estimated value > 100jt → langsung ke stage "Presentasi"

---

## 🆘 Troubleshooting

### Stage tidak berubah otomatis

**Problem:** Stage tetap di "Lead" setelah lengkapi data customer

**Solution:**
- Pastikan Kategori Industri sudah diisi
- Check console untuk error API
- Verify pipeline ID di URL parameter benar

### Customer tidak ter-link ke pipeline

**Problem:** customerId tidak terisi di pipeline

**Solution:**
- Pastikan customer berhasil disimpan (check toast notification)
- Verify query parameter `from=pipeline&id={pipelineId}` ada
- Check API response dari createCustomer()

### Toast notification tidak muncul

**Problem:** Tidak ada notifikasi saat stage berubah

**Solution:**
- Check import `toast` from 'sonner'
- Verify Toaster component ada di root layout
- Clear browser cache dan reload

---

## 📚 Related Documentation

- [Pipeline Schema](./supabase/PIPELINE_FOLLOWUP_SCHEMA.md)
- [Database Schema UI](./src/app/pages/master/database-schema.tsx)
- [Customer Form Integration](./src/app/pages/sales/customer-form.tsx)
- [Pipeline Form](./src/app/pages/sales/pipeline-form.tsx)
