# Fitur Sortable Table (Urutan Kolom)

## 🎯 Deskripsi

Semua tabel di sistem sekarang mendukung **sorting** (pengurutan) untuk setiap kolom. Default urutan adalah **tanggal terbaru di atas** (descending order).

---

## ✨ Fitur

### 1. **Sortable Columns**

Semua kolom dapat diurutkan dengan klik pada header kolom.

**Visual Indicator:**
- Icon **↕** (ArrowUpDown) - Kolom dapat di-sort, belum aktif
- Icon **↑** (ArrowUp) - Sorting ascending (A-Z, 1-9, lama ke baru)
- Icon **↓** (ArrowDown) - Sorting descending (Z-A, 9-1, baru ke lama)

### 2. **Default Sort**

**Default:** Tanggal **terbaru** di **paling atas** (descending)

Sistem otomatis mendeteksi kolom tanggal:
- `createdAt`
- `created_at`
- `tanggal`
- `date`
- `updatedAt`
- `updated_at`

Jika ada kolom dengan nama di atas, otomatis jadi default sort column.

### 3. **Smart Sorting**

Sistem otomatis mendeteksi tipe data:

| Tipe Data | Sort Method |
|-----------|-------------|
| **Tanggal** | Parse ke Date, compare timestamp |
| **Angka** | Parse ke Number, compare numeric |
| **String** | Lowercase, localeCompare |
| **Null/Undefined** | Pindah ke akhir list |

---

## 🎬 Cara Kerja

### User Action

1. **Klik header kolom** → Sort descending
2. **Klik lagi** → Sort ascending
3. **Klik kolom lain** → Sort kolom baru (auto detect asc/desc)

### Behavior

**Kolom Tanggal:**
- First click → Descending (terbaru di atas) ⬇️
- Second click → Ascending (terlama di atas) ⬆️

**Kolom String/Angka:**
- First click → Ascending (A-Z, 1-9) ⬆️
- Second click → Descending (Z-A, 9-1) ⬇️

---

## 🔧 Implementation

### DataTable Component

**Props Baru:**

```typescript
interface DataTableProps {
  // ... existing props
  defaultSortColumn?: string; // Default column untuk sort
  defaultSortDirection?: 'asc' | 'desc'; // Default direction
}

interface Column {
  key: string;
  label: string;
  render?: (value: any, row: any) => React.ReactNode;
  sortable?: boolean; // Default true
  sortKey?: string; // Custom sort key
}
```

---

## 📝 Usage Examples

### Example 1: Default Behavior (Auto-detect Date Column)

```tsx
<DataTable
  columns={[
    { key: 'tanggal', label: 'Tanggal' },
    { key: 'customer', label: 'Customer' },
    { key: 'amount', label: 'Jumlah' }
  ]}
  data={pipelines}
  onEdit={handleEdit}
/>
```

**Result:**
- Auto sort by `tanggal` descending (terbaru di atas)
- User bisa klik kolom manapun untuk sort

---

### Example 2: Custom Default Sort

```tsx
<DataTable
  columns={[
    { key: 'name', label: 'Nama' },
    { key: 'price', label: 'Harga' },
    { key: 'stock', label: 'Stock' }
  ]}
  data={products}
  defaultSortColumn="name"
  defaultSortDirection="asc"
  onEdit={handleEdit}
/>
```

**Result:**
- Sort by `name` ascending (A-Z) as default
- User bisa override dengan klik header

---

### Example 3: Disable Sort on Specific Column

```tsx
<DataTable
  columns={[
    { key: 'id', label: 'ID', sortable: false }, // No sort
    { key: 'name', label: 'Nama' }, // Sortable
    { key: 'status', label: 'Status' } // Sortable
  ]}
  data={users}
/>
```

**Result:**
- Column "ID" tidak bisa di-sort (no icon, no onClick)
- Columns "Nama" dan "Status" bisa di-sort

---

### Example 4: Custom Sort Key

Berguna saat data structure nested atau perlu custom sort logic:

```tsx
<DataTable
  columns={[
    { 
      key: 'customer', 
      label: 'Customer',
      render: (val, row) => row.customer.name,
      sortKey: 'customer.name' // Sort by nested field
    },
    { key: 'total', label: 'Total' }
  ]}
  data={orders}
/>
```

---

## 🎨 Visual Design

### Header dengan Sort Icon

```
┌─────────────────────────────────────────────┐
│ Aksi  │ Tanggal ↓  │ Customer ↕  │ Jumlah ↕ │
├─────────────────────────────────────────────┤
│  👁   │ 15 Apr 26  │ PT ABC      │ 1000000  │
│  👁   │ 14 Apr 26  │ PT XYZ      │ 500000   │
│  👁   │ 13 Apr 26  │ CV Maju     │ 750000   │
└─────────────────────────────────────────────┘
```

**Icons:**
- `↕` - Bisa di-sort, belum aktif (opacity 30%)
- `↓` - Sort descending aktif
- `↑` - Sort ascending aktif

**Hover Effect:**
- Cursor pointer
- Text color → primary
- Smooth transition

---

## 🔍 Contoh Penggunaan di Halaman

### 1. **Pipeline Page**

**Default:** Sort by `tanggal` descending

```tsx
// src/app/pages/sales/pipeline.tsx
<DataTable
  columns={[
    { key: 'tanggal', label: 'Tanggal' },
    { key: 'customer', label: 'Customer' },
    { key: 'stage', label: 'Stage' },
    { key: 'perkiraanJumlah', label: 'Estimasi' }
  ]}
  data={pipelines}
  onEdit={handleEdit}
  onDelete={handleDelete}
/>
```

**User Experience:**
1. Page load → Sorted by tanggal DESC (terbaru di atas) ✅
2. User klik "Customer" → Sort by customer ASC (A-Z)
3. User klik "Customer" lagi → Sort by customer DESC (Z-A)
4. User klik "Tanggal" → Kembali sort by tanggal DESC

---

### 2. **Customer Page**

**Default:** Sort by `createdAt` descending

```tsx
// src/app/pages/sales/customers.tsx
<DataTable
  columns={[
    { key: 'customerName', label: 'Nama Customer' },
    { key: 'email', label: 'Email' },
    { key: 'phone', label: 'Telepon' },
    { key: 'createdAt', label: 'Terdaftar' }
  ]}
  data={customers}
  onEdit={handleEdit}
/>
```

**User Experience:**
- Default: Customer terbaru registered di atas
- Klik "Nama Customer" → Sort alphabetically
- Klik "Email" → Sort by email

---

### 3. **Prospective Customers**

**Default:** Sort by `createdAt` descending

```tsx
// src/app/pages/sales/prospective-customers.tsx
<DataTable
  columns={[
    { key: 'customerName', label: 'Nama' },
    { key: 'phone', label: 'Telepon' },
    { key: 'leadSource', label: 'Sumber Lead' },
    { key: 'createdAt', label: 'Tanggal' }
  ]}
  data={prospectiveCustomers}
  onEdit={handleEdit}
/>
```

---

## 🧠 Smart Detection Logic

### Date Column Detection

```typescript
const detectDateColumn = () => {
  const dateColumns = [
    'createdAt', 
    'created_at', 
    'tanggal', 
    'date', 
    'updatedAt', 
    'updated_at'
  ];
  
  for (const col of columns) {
    if (dateColumns.includes(col.key) || 
        dateColumns.includes(col.sortKey || '')) {
      return col.key;
    }
  }
  
  return columns[0]?.key; // Fallback to first column
};
```

### Sort Type Detection

```typescript
// 1. Check if Date
if (isDate) {
  const dateA = new Date(aValue).getTime();
  const dateB = new Date(bValue).getTime();
  return sortDirection === 'asc' ? dateA - dateB : dateB - dateA;
}

// 2. Check if Number
if (!isNaN(numA) && !isNaN(numB)) {
  return sortDirection === 'asc' ? numA - numB : numB - numA;
}

// 3. Fallback to String
return sortDirection === 'asc' 
  ? strA.localeCompare(strB) 
  : strB.localeCompare(strA);
```

---

## 🎯 Benefits

### 1. **Better UX**

- User bisa cepat menemukan data terbaru
- User bisa sort sesuai kebutuhan (alphabetically, by amount, dll)
- Visual feedback jelas (icon arrow)

### 2. **Consistency**

- Semua tabel di sistem punya behavior yang sama
- Default behavior konsisten (terbaru di atas)

### 3. **Performance**

- Client-side sorting (instant, no API call)
- useMemo untuk optimize re-render
- Only re-sort saat data, sortColumn, atau sortDirection berubah

---

## ⚙️ Technical Details

### State Management

```typescript
const [sortColumn, setSortColumn] = useState<string>(initialSortColumn);
const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
```

### Memoization

```typescript
const sortedData = useMemo(() => {
  // Sorting logic
}, [data, sortColumn, sortDirection, columns]);
```

**Benefit:** Data hanya di-sort ulang jika dependencies berubah.

---

## 🐛 Troubleshooting

### Sorting Tidak Bekerja

**Check:**
1. Apakah column key benar?
2. Apakah data ada value untuk key tersebut?
3. Check browser console untuk error

### Tanggal Tidak Urut Dengan Benar

**Possible Causes:**
1. Format tanggal tidak valid (harus parseable by `new Date()`)
2. Data string bukan date

**Fix:**
```typescript
// Pastikan format tanggal valid
createdAt: "2026-04-15T10:30:00.000Z" ✅
createdAt: "15/04/2026" ✅
createdAt: "invalid date" ❌
```

### Default Sort Tidak Detect Date Column

**Fix:**
Specify manually:
```tsx
<DataTable
  defaultSortColumn="createdAt"
  defaultSortDirection="desc"
  // ...
/>
```

---

## 📚 API Reference

### DataTableProps

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `defaultSortColumn` | `string` | Auto-detect | Column key untuk default sort |
| `defaultSortDirection` | `'asc' \| 'desc'` | `'desc'` | Default sort direction |

### Column Interface

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `sortable` | `boolean` | `true` | Enable/disable sort untuk column ini |
| `sortKey` | `string` | `key` | Custom key untuk sorting (nested field support) |

---

## 🔄 Migration

Tidak perlu migration! Fitur ini **backward compatible**.

Semua existing `<DataTable>` components akan:
- ✅ Auto-detect date column
- ✅ Default sort descending
- ✅ Enable sorting pada semua kolom

**Optional Improvements:**

```tsx
// Before (masih works)
<DataTable columns={columns} data={data} />

// After (explicit control)
<DataTable 
  columns={columns} 
  data={data}
  defaultSortColumn="createdAt"
  defaultSortDirection="desc"
/>
```

---

**Version:** 1.0  
**Last Updated:** April 2026  
**Feature Status:** ✅ Active  
**Applies To:** All DataTable components system-wide
