# Integrasi Accurate Online API

Dokumentasi lengkap untuk integrasi ERP Manufacturing dengan Accurate Online.

## 📋 Daftar Isi

1. [Setup & Konfigurasi](#setup--konfigurasi)
2. [Cara Penggunaan](#cara-penggunaan)
3. [API Reference](#api-reference)
4. [Sync Service](#sync-service)
5. [Contoh Implementasi](#contoh-implementasi)
6. [Troubleshooting](#troubleshooting)

---

## 🚀 Setup & Konfigurasi

### 1. Credentials yang Anda Miliki

Anda sudah memiliki credentials Accurate:
- ✅ **ACCURATE_API_TOKEN** (AAT)
- ✅ **ACCURATE_SIGNATURE_SECRET**
- ✅ **Database ID**: 717557

### 2. Setup Environment Variables

File `.env.accurate` sudah dibuat dengan credentials Anda. 

**PENTING**: Jangan commit file ini ke Git!

```bash
# Copy ke .env atau .env.local
cp .env.accurate .env.local
```

Atau tambahkan ke environment variables:
```env
VITE_ACCURATE_API_TOKEN=aat.NTA.eyJ2Ijo...
VITE_ACCURATE_SIGNATURE_SECRET=0CcWutA9rEbx9fCFsczjOErdEVc830lK...
VITE_ACCURATE_API_BASE_URL=https://public-api.accurate.id/api
VITE_ACCURATE_DATABASE_ID=717557
```

### 3. Install Dependencies

```bash
pnpm install axios crypto-js
pnpm install -D @types/crypto-js
```

---

## 💡 Cara Penggunaan

### Test Connection

Cek apakah koneksi ke Accurate berhasil:

```typescript
import { accurateSyncService } from '@/services/accurate-sync';

// Test koneksi
const isConnected = await accurateSyncService.testConnection();
// ✅ Koneksi ke Accurate Online berhasil!
```

### Sync Customer ke Accurate

```typescript
import { accurateSyncService } from '@/services/accurate-sync';

// Sync single customer
const success = await accurateSyncService.syncCustomerToAccurate(customerId);

// Sync semua customers
const result = await accurateSyncService.syncAllCustomersToAccurate();
// Result: { success: 10, failed: 0 }
```

### Import Customer dari Accurate

```typescript
// Pull customers dari Accurate ke ERP
const imported = await accurateSyncService.pullCustomersFromAccurate();
// 5 customer baru diimport dari Accurate
```

### Create Sales Invoice di Accurate

```typescript
// Create invoice dari Sales Order
const success = await accurateSyncService.createSalesInvoiceInAccurate(orderId);
// Sales Invoice SI-2024-001 berhasil dibuat di Accurate
```

---

## 📚 API Reference

### accurateService

Direct API untuk Accurate Online.

#### Customer API

```typescript
import accurateService from '@/services/accurate-api';

// Get all customers
const response = await accurateService.getCustomers({ 
  page: 1, 
  pageSize: 50 
});

// Get customer by ID
const customer = await accurateService.getCustomer(123);

// Create customer
const result = await accurateService.createCustomer({
  name: 'PT Contoh Indonesia',
  email: 'info@contoh.com',
  mobilePhone: '08123456789',
  address: 'Jl. Contoh No. 123',
  city: 'Jakarta',
});

// Update customer
await accurateService.updateCustomer(123, {
  email: 'new-email@contoh.com'
});

// Delete customer
await accurateService.deleteCustomer(123);
```

#### Sales Invoice API

```typescript
// Get all sales invoices
const invoices = await accurateService.getSalesInvoices({ 
  page: 1, 
  pageSize: 50 
});

// Get invoice by ID
const invoice = await accurateService.getSalesInvoice(456);

// Create sales invoice
const result = await accurateService.createSalesInvoice({
  transDate: '2026-04-17',
  customerNo: 'C-001',
  description: 'Sales Invoice April 2026',
  detailItem: [
    {
      itemNo: 'ITEM-001',
      quantity: 100,
      unitPrice: 50000,
      discount: 0,
    }
  ]
});
```

#### Item API

```typescript
// Get all items
const items = await accurateService.getItems({ 
  page: 1, 
  pageSize: 50 
});

// Create item
const result = await accurateService.createItem({
  name: 'Standing Pouch 1kg',
  itemType: 'INVENTORY',
  unitPrice: 5000,
  unit: 'PCS',
});
```

---

## 🔄 Sync Service

### accurateSyncService

Service untuk sinkronisasi data antara ERP dan Accurate.

#### Methods

```typescript
// Test connection
await accurateSyncService.testConnection();

// Sync single customer
await accurateSyncService.syncCustomerToAccurate(customerId);

// Sync all customers
await accurateSyncService.syncAllCustomersToAccurate();

// Pull customers from Accurate
await accurateSyncService.pullCustomersFromAccurate();

// Create invoice in Accurate
await accurateSyncService.createSalesInvoiceInAccurate(orderId);

// Get sync status
const status = await accurateSyncService.getCustomerSyncStatus(customerId);
// { synced: true, accurateId: 123, accurateNo: 'C-001', lastSyncedAt: '...' }
```

---

## 🎯 Contoh Implementasi

### 1. Tambah Button Sync di Customer Page

```tsx
// src/app/pages/sales/customers.tsx
import { accurateSyncService } from '@/services/accurate-sync';

function Customers() {
  const handleSyncCustomer = async (customerId: string) => {
    const success = await accurateSyncService.syncCustomerToAccurate(customerId);
    if (success) {
      // Refresh data
      fetchCustomers();
    }
  };

  return (
    <DataTable
      columns={columns}
      data={customers}
      actions={(row) => (
        <>
          <Button onClick={() => handleSyncCustomer(row.id)}>
            Sync to Accurate
          </Button>
        </>
      )}
    />
  );
}
```

### 2. Auto-Sync on Customer Create

```typescript
// src/app/lib/api.ts
async createCustomer(data: any) {
  const id = `customer:${Date.now()}`;
  const customerData = { ...data, id, createdAt: new Date().toISOString() };
  
  await kvSet(id, customerData);
  
  // Auto-sync to Accurate (optional)
  try {
    await accurateSyncService.syncCustomerToAccurate(id);
  } catch (error) {
    console.warn('Failed to sync to Accurate:', error);
  }
  
  return { success: true, id };
}
```

### 3. Show Sync Status Badge

```tsx
// Customer list dengan status sync
<Badge 
  className={customer.syncedToAccurate ? 'bg-green-600' : 'bg-gray-400'}
>
  {customer.syncedToAccurate 
    ? `Synced - ${customer.accurateCustomerNo}` 
    : 'Not Synced'
  }
</Badge>
```

### 4. Batch Sync dengan Progress

```tsx
async function handleBatchSync() {
  setLoading(true);
  const result = await accurateSyncService.syncAllCustomersToAccurate();
  setLoading(false);
  
  alert(`Sync Complete:\n${result.success} berhasil\n${result.failed} gagal`);
}
```

---

## 🔧 Troubleshooting

### Error: "Failed to fetch"

**Penyebab**: Token expired atau invalid

**Solusi**: 
1. Generate token baru di Accurate Online
2. Update `.env.accurate` dengan token baru

### Error: "Customer not found in Accurate"

**Penyebab**: Customer belum di-sync ke Accurate

**Solusi**:
```typescript
// Sync customer terlebih dahulu
await accurateSyncService.syncCustomerToAccurate(customerId);
```

### Error: "Signature validation failed"

**Penyebab**: ACCURATE_SIGNATURE_SECRET salah atau tidak sesuai

**Solusi**:
1. Cek di Accurate Online > Settings > API
2. Copy ulang Signature Secret
3. Update di `.env.accurate`

### Error: "Item not found"

**Penyebab**: Item belum ada di Accurate

**Solusi**:
```typescript
// Create item dulu di Accurate
await accurateService.createItem({
  name: 'Standing Pouch 1kg',
  itemType: 'INVENTORY',
  unitPrice: 5000,
});
```

---

## 📊 Data Mapping

### ERP Customer → Accurate Customer

| ERP Field | Accurate Field | Notes |
|-----------|---------------|-------|
| customerName | name | Required |
| companyPhone | mobilePhone | - |
| billingAddress.fullAddress | address | - |
| billingAddress.city | city | - |
| billingAddress.province | province | - |
| contacts[0].email | email | - |

### ERP Sales Order → Accurate Sales Invoice

| ERP Field | Accurate Field | Notes |
|-----------|---------------|-------|
| orderDate | transDate | Format: YYYY-MM-DD |
| customerName | customerNo | Must sync customer first |
| notes | description | - |
| items | detailItem | Array of items |
| totalAmount | unitPrice | Per item |

---

## 🎯 Next Steps

### Recommended Implementation Order:

1. ✅ **Setup & Test Connection** (Done)
2. 🔄 **Sync Customers** (Next)
   - Add sync button di Customer page
   - Auto-sync on create customer
3. 🔄 **Sync Items/Products**
   - Sync product master to Accurate Item
4. 🔄 **Create Sales Invoices**
   - Button "Create Invoice in Accurate" di Sales Order
5. 🔄 **Pull Data from Accurate**
   - Scheduled job untuk pull data
6. 🔄 **Purchase Invoices**
   - Sync Purchase Order to Accurate

### Advanced Features:

- ⏰ **Scheduled Sync**: Cron job sync otomatis setiap hari
- 📊 **Sync Dashboard**: Monitor sync status semua data
- 🔔 **Webhook**: Real-time sync dengan Accurate webhook
- 📝 **Sync Log**: History semua aktivitas sync

---

## 🔐 Security Notes

⚠️ **PENTING**:
- ❌ Jangan commit `.env.accurate` ke Git
- ❌ Jangan share API Token ke orang lain
- ✅ Token sudah di `.gitignore`
- ✅ Gunakan environment variables untuk production

---

## 📞 Support

- **Accurate API Docs**: https://accurate.id/api-myob-accurate-online
- **Accurate Support**: support@accurate.id
- **ERP Support**: [Your contact]

---

**Last Updated**: 17 April 2026
