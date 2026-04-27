# Workflow Penawaran Penjualan - Updated

## Alur Workflow Baru

```
Draft → Pending → Accept → Sent → Approved
  ↓        ↓         ↓       ↓
  └────────┴─────────┴───────┴────→ Rejected
```

## Detail Setiap Status

### 1. **Draft** (Abu-abu)
- **Deskripsi**: Penawaran baru dibuat, masih dalam tahap penyusunan
- **Yang dapat melakukan**: Staff Sales, Manager Sales, Direktur, Admin
- **Aksi tersedia**: 
  - ✏️ Edit
  - 🗑️ Hapus
  - 📤 Ajukan (ke Pending)

---

### 2. **Pending** (Kuning)
- **Deskripsi**: Penawaran sudah diajukan oleh Staff Sales, menunggu persetujuan pertama
- **Yang mengajukan**: Staff Sales
- **Yang dapat menyetujui**: Supervisor Sales, Manager Sales, Admin
- **Aksi tersedia**:
  - ✅ Terima (ke Accept) - oleh Supervisor/Manager
  - ❌ Tolak (ke Rejected) - oleh Supervisor/Manager

---

### 3. **Accept** (Biru)
- **Deskripsi**: Penawaran sudah diterima oleh Supervisor/Manager Sales (approval pertama)
- **Yang menerima**: Supervisor Sales atau Manager Sales
- **Yang dapat melanjutkan**: Staff Sales
- **Aksi tersedia**:
  - 📮 Kirim + PO (ke Sent) - oleh Staff Sales, wajib isi Nomor PO
  - ❌ Tolak (ke Rejected) - oleh Supervisor/Manager

---

### 4. **Sent** (Ungu)
- **Deskripsi**: Penawaran sudah dikirim dengan Nomor PO, menunggu persetujuan final
- **Yang mengirim**: Staff Sales
- **Yang dapat menyetujui**: Manager Sales, Admin
- **Data tambahan**: Nomor PO Customer
- **Aksi tersedia**:
  - ✅ Setujui (ke Approved) - oleh Manager Sales (approval kedua)
  - ❌ Tolak (ke Rejected) - oleh Manager Sales

---

### 5. **Approved** (Hijau)
- **Deskripsi**: Penawaran sudah disetujui final oleh Manager Sales
- **Yang menyetujui**: Manager Sales
- **Aksi tersedia**:
  - 🖨️ Cetak - semua user

---

### 6. **Rejected** (Merah)
- **Deskripsi**: Penawaran ditolak (bisa dari tahap mana saja)
- **Yang menolak**: Supervisor/Manager/Admin (tergantung tahap)
- **Data tambahan**: Alasan penolakan (wajib)
- **Aksi tersedia**: Tidak ada (final state)

---

## Warna Status

| Status | Warna Badge | Warna Icon |
|--------|-------------|------------|
| Draft | Abu-abu | `bg-gray-400` |
| Pending | Kuning | `bg-yellow-500` |
| Accept | Biru | `bg-blue-500` |
| Sent | Ungu | `bg-purple-500` |
| Approved | Hijau | `bg-green-500` |
| Rejected | Merah | `bg-red-500` |

---

## Role & Permission

### Staff Sales
- Dapat membuat Draft
- Dapat mengajukan Draft → Pending
- Dapat mengirim Accept → Sent (wajib isi Nomor PO)

### Supervisor Sales
- Dapat menerima Pending → Accept
- Dapat menolak Pending / Accept → Rejected

### Manager Sales
- Dapat menerima Pending → Accept
- Dapat menyetujui Sent → Approved (approval final)
- Dapat menolak di semua tahap

### Admin
- Semua permission seperti Manager Sales

---

## Contoh Skenario

### Skenario Normal (Approved):
1. Staff Sales buat penawaran → **Draft**
2. Staff Sales klik "Ajukan" → **Pending**
3. Supervisor Sales klik "Terima" → **Accept**
4. Staff Sales klik "Kirim + PO", isi nomor PO "PO-12345" → **Sent**
5. Manager Sales klik "Setujui" → **Approved**
6. Semua user bisa cetak penawaran

### Skenario Ditolak di Tahap Pending:
1. Staff Sales buat penawaran → **Draft**
2. Staff Sales klik "Ajukan" → **Pending**
3. Supervisor Sales klik "Tolak", isi alasan → **Rejected**

### Skenario Ditolak di Tahap Sent:
1. Draft → Pending → Accept → Sent
2. Manager Sales review, klik "Tolak", isi alasan → **Rejected**

---

## Field Tambahan

### Quotation Object:
```typescript
{
  status: 'Draft' | 'Pending' | 'Accept' | 'Sent' | 'Approved' | 'Rejected',
  nomorPO?: string,
  acceptedBy?: string,
  acceptedAt?: string,
  sentBy?: string,
  sentAt?: string,
  approvedBy?: string,
  approvedAt?: string,
  rejectedBy?: string,
  rejectedAt?: string,
  rejectionReason?: string
}
```

---

## API Endpoints Baru

### 1. Accept Quotation
```typescript
api.acceptQuotation(id, {
  acceptedBy: string,
  acceptedAt: string
})
```

### 2. Send with PO
```typescript
api.sendQuotationWithPO(id, {
  sentBy: string,
  sentAt: string,
  nomorPO: string
})
```

### 3. Approve (Final)
```typescript
api.approveQuotation(id, {
  approvedBy: string,
  approvedAt: string
})
```

### 4. Reject
```typescript
api.rejectQuotation(id, {
  rejectedBy: string,
  rejectedAt: string,
  rejectionReason: string
})
```

---

## Format Role yang Diterima

Sistem akan auto-normalize role:

**Staff Sales:**
- `staff_sales`, `sales_staff`, `staff`

**Supervisor Sales:**
- `supervisor_sales`, `sales_supervisor`, `spv_sales`, `spv`

**Manager Sales:**
- `manager_sales`, `sales_manager`

**Admin:**
- `admin`, `administrator`, `super_admin`, `superadmin`

---

## Testing Checklist

- [ ] Draft dapat dibuat oleh Staff Sales
- [ ] Draft dapat diajukan menjadi Pending
- [ ] Pending dapat diterima (Accept) oleh Supervisor
- [ ] Pending dapat diterima (Accept) oleh Manager
- [ ] Accept dapat dikirim (Sent) oleh Staff Sales dengan Nomor PO
- [ ] Sent dapat disetujui (Approved) oleh Manager
- [ ] Penawaran dapat ditolak di setiap tahap dengan alasan
- [ ] Approved dapat dicetak oleh semua user
- [ ] Warna status badge sesuai
- [ ] Warna icon aksi sesuai status
- [ ] Permission check berfungsi dengan benar
