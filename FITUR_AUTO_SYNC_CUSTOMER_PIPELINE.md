# Fitur Auto-Sync Customer ke Pipeline

## 🎯 Deskripsi

Fitur ini memastikan bahwa setiap kali data customer diubah/diperbarui, semua pipeline yang terhubung dengan customer tersebut akan **otomatis ter-update** dengan data customer terbaru.

---

## ✨ Cara Kerja

### 1. Saat Membuat Customer Baru

Tidak ada auto-sync karena customer baru belum memiliki pipeline terkait.

### 2. Saat Mengubah/Edit Data Customer

**Alur:**
1. User edit data customer (misal: ubah nama, alamat, telepon)
2. User klik **"Simpan"**
3. System update data customer di database ✅
4. System **otomatis mencari** semua pipeline yang terhubung dengan customer ini (berdasarkan `customerId`)
5. System **otomatis update** data customer di setiap pipeline terkait:
   - Nama customer (`customer`)
   - Alamat (`alamat`)
   - Nomor telepon (`nomorTelepon`)
6. Notifikasi sukses ditampilkan:
   - Jika ada pipeline terkait: *"Customer dan X pipeline terkait berhasil diperbarui"*
   - Jika tidak ada pipeline: *"Customer berhasil diperbarui"*

---

## 📊 Data Yang Di-Sync

Data customer yang otomatis ter-update di pipeline:

| Field Customer | → | Field Pipeline | Sumber |
|----------------|---|----------------|--------|
| `customerName` | → | `customer` | Nama customer |
| `billingAddress.fullAddress` atau `billingAddress.city` | → | `alamat` | Alamat customer |
| `companyPhone` atau `contacts[0].phone` | → | `nomorTelepon` | Nomor telepon |

**Catatan:** Field lain di pipeline (seperti `stage`, `aktivitasSales`, `hasil`, dll) **TIDAK** berubah.

---

## 🔍 Contoh Skenario

### Skenario 1: Update Nama Customer

**Before:**
- Customer: `PT Maju Jaya`
- Pipeline terkait: 3 pipeline

**User Action:**
- Edit customer
- Ubah nama jadi `PT Maju Jaya Sentosa`
- Klik "Simpan"

**After:**
- Customer: `PT Maju Jaya Sentosa` ✅
- 3 Pipeline: nama customer otomatis berubah jadi `PT Maju Jaya Sentosa` ✅
- Notifikasi: *"Customer dan 3 pipeline terkait berhasil diperbarui"*

---

### Skenario 2: Update Alamat & Telepon

**Before:**
- Customer: `PT ABC`
  - Alamat: `Jakarta Selatan`
  - Telepon: `021-1234567`
- Pipeline terkait: 1 pipeline

**User Action:**
- Edit customer
- Ubah alamat jadi `Jakarta Pusat, Jl. Sudirman No. 123`
- Ubah telepon jadi `021-9876543`
- Klik "Simpan"

**After:**
- Customer: alamat & telepon terupdate ✅
- 1 Pipeline: `alamat` dan `nomorTelepon` otomatis terupdate ✅
- Notifikasi: *"Customer dan 1 pipeline terkait berhasil diperbarui"*

---

### Skenario 3: Customer Tanpa Pipeline

**Before:**
- Customer: `PT XYZ`
- Pipeline terkait: 0 (tidak ada)

**User Action:**
- Edit customer
- Ubah data apapun
- Klik "Simpan"

**After:**
- Customer: data terupdate ✅
- Tidak ada pipeline yang di-sync
- Notifikasi: *"Customer berhasil diperbarui"*

---

## 🔗 Hubungan Customer - Pipeline

Pipeline terhubung dengan customer melalui field `customerId`:

```typescript
// Data Pipeline
{
  id: "pipeline:123",
  customer: "PT Maju Jaya",      // Nama customer (denormalized)
  customerId: "customer:456",     // ID customer (foreign key)
  alamat: "Jakarta",              // Alamat customer (denormalized)
  nomorTelepon: "021-1234567",    // Telepon customer (denormalized)
  // ... field pipeline lainnya
}
```

**Kenapa denormalisasi?**
- Untuk performa: bisa langsung tampilkan nama customer tanpa join
- Auto-sync memastikan data denormalized selalu sinkron dengan data customer asli

---

## 🛠️ Technical Implementation

### API Function

**File:** `src/app/lib/api.ts`

```typescript
// Update customer
async updateCustomer(id: string, data: any) {
  const existing = await kvGet(id);
  if (!existing) throw new Error('Customer not found');
  await kvSet(id, { ...existing, ...data, updatedAt: new Date().toISOString() });
  return { success: true };
}

// Sync customer data ke semua pipeline terkait
async syncCustomerToPipelines(customerId: string, customerData: any) {
  const pipelines = await this.getPipelines();

  // Find pipelines dengan customerId yang sama
  const relatedPipelines = pipelines.filter(
    (p: any) => p.customerId === customerId
  );

  // Update setiap pipeline
  for (const pipeline of relatedPipelines) {
    const updatedPipeline = {
      ...pipeline,
      customer: customerData.customerName,
      alamat: customerData.billingAddress?.fullAddress || customerData.billingAddress?.city || pipeline.alamat,
      nomorTelepon: customerData.companyPhone || customerData.contacts?.[0]?.phone || pipeline.nomorTelepon,
      lastSyncedAt: new Date().toISOString()
    };

    await kvSet(pipeline.id, updatedPipeline);
  }

  return { success: true, syncedCount: relatedPipelines.length };
}
```

### Frontend Integration

**File:** `src/app/pages/sales/customer-form.tsx`

```typescript
if (isEdit && id) {
  await api.updateCustomer(id, payload);
  newCustomer = { id, ...payload };

  // Auto-sync ke pipeline
  try {
    const syncResult = await api.syncCustomerToPipelines(id, payload);
    if (syncResult.syncedCount > 0) {
      toast.success(`Customer dan ${syncResult.syncedCount} pipeline terkait berhasil diperbarui`);
    } else {
      toast.success('Customer berhasil diperbarui');
    }
  } catch (error) {
    console.error('Error syncing to pipelines:', error);
    toast.success('Customer berhasil diperbarui');
  }
}
```

---

## ⚠️ Catatan Penting

### 1. **Field Yang Tidak Di-Sync**

Field pipeline berikut **TIDAK** berubah saat customer di-update:
- `stage` (tahapan pipeline)
- `aktivitasSales` (aktivitas sales)
- `hasil` (hasil aktivitas)
- `catatan` (catatan pipeline)
- `perkiraanJumlah` (estimasi nilai)
- `segmen` (segmen customer)
- `sumberLead` (sumber lead)
- `picSales` (PIC sales)

**Alasan:** Data ini spesifik untuk pipeline, bukan data customer.

### 2. **Error Handling**

Jika sync gagal:
- Customer tetap ter-update ✅
- Error di-log di console
- User tetap dapat notifikasi "Customer berhasil diperbarui"
- Pipeline tidak ter-update (data lama tetap ada)

**Solusi:** Cek browser console untuk error detail, atau sync manual.

### 3. **Performance**

Untuk customer dengan banyak pipeline (misal 100+):
- Sync bisa memakan waktu beberapa detik
- User mungkin perlu menunggu sedikit lebih lama
- Loading indicator akan ditampilkan

---

## 🧪 Testing

### Manual Test

1. **Setup:**
   - Buat customer baru: "PT Test Customer"
   - Buat 2 pipeline, hubungkan dengan customer ini

2. **Test Update Nama:**
   - Edit customer, ubah nama jadi "PT Test Customer Updated"
   - Klik Simpan
   - Expected: Notifikasi "Customer dan 2 pipeline terkait berhasil diperbarui"
   - Verify: Buka halaman Pipeline, cek nama customer sudah berubah

3. **Test Update Alamat:**
   - Edit customer, ubah alamat
   - Klik Simpan
   - Verify: Buka halaman Pipeline, cek alamat sudah berubah

4. **Test Update Telepon:**
   - Edit customer, ubah nomor telepon
   - Klik Simpan
   - Verify: Pipeline menampilkan nomor baru (jika kolom nomorTelepon ada)

### Console Log

Saat auto-sync berjalan, cek browser console (F12):

```
🔄 Auto-sync customer ke pipeline terkait... {customerId: "customer:123"}
🔄 Syncing customer to 2 pipelines...
✅ Synced pipeline pipeline:456
✅ Synced pipeline pipeline:789
```

---

## 🔧 Troubleshooting

### Pipeline Tidak Ter-Update

**Check:**
1. Apakah pipeline memiliki `customerId`?
   - Buka browser console: `await supabase.from('kv_store_6a7942bb').select('*').like('key', 'pipeline:%')`
   - Cek apakah `value.customerId` ada

2. Apakah `customerId` sama dengan ID customer yang di-edit?

3. Check console log saat save customer, apakah ada error?

**Fix:**
- Jika pipeline tidak punya `customerId`: Edit pipeline, pilih customer dari dropdown
- Jika ada error di console: Screenshot dan laporkan ke IT Support

---

## 📚 Related Features

- **Pipeline → Customer:** Saat buat customer dari pipeline, pipeline otomatis ter-link
- **Customer List:** Bisa lihat berapa pipeline terkait per customer (future feature)
- **Bulk Update:** Update banyak customer sekaligus (future feature)

---

**Version:** 1.0  
**Last Updated:** April 2026  
**Feature Status:** ✅ Active
