# Aturan Validasi Customer & Calon Customer

## Aturan Unik (Unique Constraints)

Untuk menjaga integritas data dan mencegah duplikasi, sistem menerapkan aturan berikut:

---

## 1. Calon Customer (Prospective Customers)

### Field yang Harus Unik:

#### ✅ Nama Customer
- **Field:** `customerName`
- **Aturan:** 
  1. Tidak boleh ada nama yang sama di **Calon Customer** (case-insensitive)
  2. Tidak boleh menggunakan nama yang sudah ada di **Customer**
- **Validasi:** Cek saat create dan update
- **Error Message:** 
  - "Nama '[nama]' sudah terdaftar sebagai calon customer"
  - "Nama '[nama]' sudah terdaftar sebagai customer. Tidak dapat menambahkan ke calon customer."

**Contoh:**
```
Skenario 1: Duplikat di Calon Customer
❌ TIDAK BOLEH:
- PT MAJU JAYA (sudah ada di calon customer)
- Tambah lagi: PT Maju Jaya → DITOLAK

Skenario 2: Sudah Ada di Customer
❌ TIDAK BOLEH:
- PT INDO PRIMA (sudah terdaftar sebagai customer)
- Tambah ke calon customer: PT Indo Prima → DITOLAK
  Alasan: Customer sudah terdaftar, tidak perlu jadi calon customer

✅ BOLEH:
- PT MAJU JAYA SEJAHTERA (nama berbeda, belum ada di manapun)
- CV MAJU JAYA (nama berbeda, belum ada di manapun)
```

#### ✅ Nomor Telepon
- **Field:** `phone`
- **Aturan:** 
  1. Tidak boleh ada nomor yang sama di **Calon Customer**
  2. Tidak boleh menggunakan nomor yang sudah ada di **Customer** (companyPhone)
- **Format:** Menggunakan format standar (6281234567890)
- **Validasi:** Cek saat create dan update
- **Error Message:** 
  - "Nomor telepon '[nomor]' sudah terdaftar sebagai calon customer"
  - "Nomor telepon '[nomor]' sudah terdaftar sebagai customer. Tidak dapat menambahkan ke calon customer."

**Contoh:**
```
Skenario 1: Duplikat di Calon Customer
❌ TIDAK BOLEH:
- 6281234567890 (sudah ada di calon customer)
- Tambah lagi: 6281234567890 → DITOLAK

Skenario 2: Sudah Ada di Customer
❌ TIDAK BOLEH:
- 6281234567890 (sudah digunakan customer A)
- Tambah ke calon customer: 6281234567890 → DITOLAK
  Alasan: Nomor ini sudah dipakai customer terdaftar

✅ BOLEH:
- 6281234567891 (nomor berbeda, belum ada di manapun)
```

---

## 2. Customer (Registered Customers)

### Field yang Harus Unik:

#### ✅ Nama Customer
- **Field:** `customerName`
- **Aturan:** Tidak boleh ada nama yang sama (case-insensitive)
- **Validasi:** Cek saat create dan update
- **Error Message:** "Nama customer '[nama]' sudah terdaftar"

**Contoh:**
```
❌ TIDAK BOLEH:
- PT INDO PRIMA (sudah ada)
- Tambah lagi: PT Indo Prima → DITOLAK
- Tambah lagi: pt indo prima → DITOLAK (case-insensitive)

✅ BOLEH:
- PT INDO PRIMA JAYA (nama berbeda)
- PT PRIMA INDONESIA (nama berbeda)
```

#### ✅ Nomor Telepon Perusahaan
- **Field:** `companyPhone`
- **Aturan:** Tidak boleh ada nomor yang sama
- **Format:** Menggunakan format standar (6281234567890)
- **Validasi:** Cek saat create dan update (hanya jika nomor tidak kosong)
- **Error Message:** "Nomor telepon perusahaan '[nomor]' sudah terdaftar"

**Catatan:** Nomor telepon contact person (`contacts[].phone`) **TIDAK** dibatasi unik, karena satu orang bisa menjadi contact person di beberapa perusahaan.

---

## Kapan Validasi Dijalankan?

### Saat Create (Tambah Baru):
- ✅ Cek duplikat nama customer
- ✅ Cek duplikat nomor telepon
- ❌ Tolak jika ditemukan duplikat

### Saat Update (Edit):
- ✅ Cek duplikat nama customer **kecuali** record yang sedang di-edit
- ✅ Cek duplikat nomor telepon **kecuali** record yang sedang di-edit
- ❌ Tolak jika ditemukan duplikat di record lain

**Contoh Update:**
```
Customer A: PT MAJU JAYA, Phone: 6281234567890

Edit Customer A:
- Ubah nama jadi: PT MAJU SEJAHTERA → ✅ BOLEH (nama baru unik)
- Ubah phone jadi: 6289876543210 → ✅ BOLEH (nomor baru unik)
- Tetap: PT MAJU JAYA → ✅ BOLEH (nama sama dengan dirinya sendiri)
- Tetap: 6281234567890 → ✅ BOLEH (nomor sama dengan dirinya sendiri)

Tapi jika Customer B sudah ada dengan nama "PT SUKSES ABADI":
- Ubah nama Customer A jadi: PT Sukses Abadi → ❌ DITOLAK (duplikat dengan Customer B)
```

---

## Flow Validasi

### Calon Customer:
```
User Submit Form
↓
Normalize Data (phone → format standar)
↓
Check Duplicate Name di Calon Customer
├─ Found? → ❌ Error "sudah terdaftar sebagai calon customer" & Stop
└─ Not Found? → Continue
↓
Check Duplicate Phone di Calon Customer
├─ Found? → ❌ Error "sudah terdaftar sebagai calon customer" & Stop
└─ Not Found? → Continue
↓
Check Name Already Exists di Customer
├─ Found? → ❌ Error "sudah terdaftar sebagai customer" & Stop
└─ Not Found? → Continue
↓
Check Phone Already Exists di Customer
├─ Found? → ❌ Error "sudah terdaftar sebagai customer" & Stop
└─ Not Found? → Continue
↓
💾 Save to Database
↓
✅ Success!
```

### Customer:
```
User Submit Form
↓
Normalize Data (phone → format standar)
↓
Check Duplicate Name di Customer
├─ Found? → ❌ Error "nama sudah terdaftar" & Stop
└─ Not Found? → Continue
↓
Check Duplicate Phone di Customer
├─ Found? → ❌ Error "nomor sudah terdaftar" & Stop
└─ Not Found? → Continue
↓
💾 Save to Database
↓
✅ Success!
```

---

## Cross-Validation: Calon Customer ↔ Customer

### Mengapa Ada Cross-Validation?

**Alasan:** Jika seseorang/perusahaan sudah terdaftar sebagai **Customer**, maka tidak perlu lagi menjadi **Calon Customer**.

### Aturan:
1. ✅ Calon Customer bisa **dikonversi** menjadi Customer
2. ❌ Calon Customer **tidak boleh** menggunakan nama/nomor yang sudah ada di Customer
3. ✅ Customer **tidak perlu** di-check ke Calon Customer (one-way validation)

### Contoh Kasus:

**Kasus 1: Normal Flow**
```
1. Tambah Calon Customer: PT MAJU JAYA → ✅ BERHASIL
2. Konversi ke Customer: PT MAJU JAYA → ✅ BERHASIL
3. Tambah Calon Customer lagi: PT MAJU JAYA → ❌ DITOLAK
   Error: "Nama sudah terdaftar sebagai customer"
```

**Kasus 2: Direct Customer**
```
1. Tambah Customer langsung: PT INDO PRIMA → ✅ BERHASIL
2. Tambah Calon Customer: PT INDO PRIMA → ❌ DITOLAK
   Error: "Nama sudah terdaftar sebagai customer"
```

**Kasus 3: Different Names**
```
1. Customer: PT MAJU JAYA
2. Calon Customer: PT MAJU SEJAHTERA → ✅ BERHASIL (nama berbeda)
```

### Benefit:
- 🚫 Mencegah duplikasi data
- 🎯 Calon Customer fokus pada leads yang belum closing
- ✅ Customer hanya berisi customer aktif/terdaftar
- 🔄 Konversi flow tetap jelas: Calon → Customer (one-way)

---

## Error Messages

### Calon Customer:
- **Nama Duplikat:** 
  ```
  Nama "PT MAJU JAYA" sudah terdaftar sebagai calon customer
  ```

- **Phone Duplikat:**
  ```
  Nomor telepon "6281234567890" sudah terdaftar
  ```

### Customer:
- **Nama Duplikat:**
  ```
  Nama customer "PT MAJU JAYA" sudah terdaftar
  ```

- **Phone Duplikat:**
  ```
  Nomor telepon perusahaan "6281234567890" sudah terdaftar
  ```

---

## Exceptions & Special Cases

### ✅ Boleh Sama:
1. **Contact Person Phone** - Nomor telepon contact person boleh sama antar customer
2. **Empty Phone** - Jika nomor telepon kosong, tidak di-check duplikat
3. **Edit Record Sendiri** - Saat edit, boleh menggunakan nama/phone yang sama dengan record yang sedang di-edit

### ❌ Tidak Boleh Sama:
1. **Customer Name** - Harus selalu unik (case-insensitive)
2. **Company Phone** - Harus unik jika diisi

---

## Technical Implementation

### File Locations:
- **Calon Customer:** `src/app/pages/sales/prospective-customers.tsx`
- **Customer:** `src/app/pages/sales/customer-form.tsx`

### Validation Logic:
```typescript
// Check duplicate name (case-insensitive)
const duplicateName = allData.find(
  item =>
    item.customerName.toLowerCase() === newName.toLowerCase() &&
    (!isEdit || item.id !== currentId)
);

// Check duplicate phone
const duplicatePhone = allData.find(
  item =>
    item.phone === newPhone &&
    (!isEdit || item.id !== currentId)
);
```

---

## FAQ

### Q: Mengapa nama harus unik?
**A:** Untuk mencegah duplikasi data customer yang sama. Jika ada perusahaan dengan nama mirip tapi berbeda (misalnya PT ABC vs PT ABC Jaya), mereka tetap dianggap berbeda.

### Q: Mengapa nomor telepon harus unik?
**A:** Satu nomor telepon perusahaan biasanya hanya digunakan oleh satu perusahaan. Jika ada duplikat nomor, kemungkinan besar itu adalah data duplikat yang tidak sengaja.

### Q: Bagaimana jika perusahaan pindah dan nomor lama dipakai perusahaan baru?
**A:** Edit customer lama dan hapus/ubah nomor teleponnya terlebih dahulu, baru nomor tersebut bisa digunakan untuk customer baru.

### Q: Apakah pengecekan nama case-sensitive?
**A:** Tidak. "PT MAJU JAYA" dianggap sama dengan "pt maju jaya" atau "Pt Maju Jaya".

### Q: Apakah nomor contact person harus unik?
**A:** Tidak. Satu orang bisa menjadi contact person di beberapa perusahaan berbeda.

---

**Update:** April 2026  
**Version:** 1.0  
**Status:** ✅ Implemented
