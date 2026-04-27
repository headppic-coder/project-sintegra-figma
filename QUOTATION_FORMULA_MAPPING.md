# Mapping Formula Harga di Quotation Form

## Cara Kerja

Ketika user memilih **Jenis Kemasan** di form Tambah Item Penawaran, dropdown **Formula Harga** otomatis menampilkan formula yang sesuai dengan jenis kemasan yang dipilih.

## Mapping Jenis Kemasan → Formula Harga

| Jenis Kemasan | API Method | Database | Kode Formula | Filter Status |
|--------------|------------|----------|--------------|---------------|
| **Polos** | `getPriceFormulasPolos()` | `price_formula_polos:*` | **FP**-YYYY-NNNN | Final / Approved |
| **Flexibel** | `getPriceFormulasOffset()` | `price_formula_offset:*` | **FF**-YYYY-NNNN | Final / Approved |
| **Boks** | `getPriceFormulasBoks()` | `price_formula_boks:*` | **FB**-YYYY-NNNN | Final / Approved |
| **Roto** | `getPriceFormulasRoto()` | `price_formula_roto:*` | **FR**-YYYY-NNNN | Final / Approved |

## Flow Diagram

```
User pilih Jenis Kemasan
         ↓
    useEffect trigger
         ↓
  fetchPriceFormulas(jenisKemasan)
         ↓
    Switch berdasarkan jenisKemasan.toLowerCase()
         ↓
┌────────┴────────┬────────┬────────┐
│                 │        │        │
polos         flexibel   boks     roto
│                 │        │        │
getPriceFormulas getPrice getPrice getPrice
Polos()          Offset() Boks()   Roto()
│                 │        │        │
└────────┬────────┴────────┴────────┘
         ↓
Filter: status === 'final' || status === 'approved'
         ↓
   setPriceFormulas(filtered)
         ↓
  Dropdown Formula Harga terupdate
```

## Auto-Reset Behavior

Ketika user **ganti Jenis Kemasan**, field-field berikut otomatis di-reset:

```typescript
if (field === 'jenisKemasan') {
  formulaHarga = '';    // Reset pilihan formula
  opsiHarga = '';       // Reset pilihan opsi
  unitPrice = 0;        // Reset harga satuan
}
```

## Debug Console Logs

Saat memilih jenis kemasan, akan muncul log di console:

```
Fetching formulas for jenis kemasan: polos → polos
Fetched Polos formulas: 5
Filtered formulas (final/approved): 3
```

### Interpretasi Log

1. **Fetching formulas for...** → Konfirmasi jenis kemasan yang dipilih
2. **Fetched X formulas** → Total formula yang di-fetch dari database
3. **Filtered Y formulas** → Formula yang lolos filter status (final/approved)

## Contoh Penggunaan

### Skenario 1: Tambah Item Kemasan Polos

**Steps:**
1. Buka **Penawaran Penjualan** → **Tambah Penawaran**
2. Klik **Tambah Item**
3. Pilih **Jenis Kemasan: Polos**

**Result:**
- Console: `Fetching formulas for jenis kemasan: polos → polos`
- Dropdown **Formula Harga** hanya menampilkan formula dengan kode **FP-***
- Contoh: FP-2026-0001, FP-2026-0002, FP-2026-0003

### Skenario 2: Ganti ke Kemasan Flexibel

**Steps:**
1. (Lanjutan dari skenario 1)
2. Pilih formula: FP-2026-0001
3. Ganti **Jenis Kemasan: Flexibel**

**Result:**
- Field **Formula Harga** otomatis kosong (reset)
- Field **Opsi Harga** otomatis kosong
- Field **Harga Satuan** otomatis 0
- Console: `Fetching formulas for jenis kemasan: flexibel → flexibel`
- Dropdown **Formula Harga** sekarang hanya menampilkan formula **FF-***

### Skenario 3: Formula Tidak Muncul

**Problem:** Dropdown Formula Harga kosong

**Penyebab Umum:**
1. Belum ada formula untuk jenis kemasan tersebut
2. Formula masih berstatus Draft atau Pending (belum Final/Approved)
3. Formula tersimpan di database/tab yang salah

**Solusi:**
1. Buka **Formula Harga** → Tab yang sesuai (Polos/Flexibel/Boks/Roto)
2. Buat formula baru atau ubah status formula yang ada
3. Pastikan status: **Final** atau **Approved**
4. Refresh halaman penawaran dan coba lagi

## Technical Details

### Switch Statement (Exact Match)

```typescript
const jenisLower = jenisKemasan?.toLowerCase().trim() || '';

switch (jenisLower) {
  case 'flexibel':
    formulas = await api.getPriceFormulasOffset();
    break;
  case 'roto':
    formulas = await api.getPriceFormulasRoto();
    break;
  case 'boks':
    formulas = await api.getPriceFormulasBoks();
    break;
  case 'polos':
    formulas = await api.getPriceFormulasPolos();
    break;
  default:
    formulas = [];
}
```

### Status Filter

```typescript
const filteredFormulas = (formulas || []).filter((f: any) =>
  f.status === 'final' || f.status === 'approved'
);
```

## Troubleshooting

### Formula Harga tidak muncul setelah pilih Jenis Kemasan

**Cek:**
1. Buka Developer Console (F12)
2. Lihat log: `Fetched X formulas` → Berapa formula yang ter-fetch?
3. Lihat log: `Filtered Y formulas` → Berapa yang lolos filter?

**Jika Fetched = 0:**
- Tidak ada formula di database untuk jenis tersebut
- Buat formula baru di tab Formula Harga yang sesuai

**Jika Fetched > 0 tapi Filtered = 0:**
- Semua formula masih Draft/Pending
- Ubah status formula ke Final atau Approved

### Formula dari jenis lain muncul (salah mapping)

**Cek:**
1. Lihat console log: `Fetching formulas for jenis kemasan: X → Y`
2. Pastikan Y sesuai dengan yang dipilih
3. Cek field `type` di database:
   ```javascript
   const formulas = await api.getPriceFormulasPolos();
   console.log(formulas.map(f => ({ kode: f.labelKode, type: f.type })));
   ```

**Expected:**
- Formula Polos → `type: 'polos'`
- Formula Flexibel → `type: 'flexibel'` atau `'offset'` (backward compatibility)
- Formula Boks → `type: 'boks'`
- Formula Roto → `type: 'roto'`

### Dropdown tidak update setelah ganti Jenis Kemasan

**Cek:**
1. Console log menunjukkan fetch baru? 
2. Jika ya tapi UI tidak update → Bug React state
3. Solusi temporary: Refresh page
4. Jika masalah persisten → Report bug

## Related Documentation

- `FORMULA_HARGA_MAPPING.md` - Mapping tab Formula Harga ke database
- `/tmp/test_formula_mapping.md` - Test scenarios lengkap

## Verification Checklist

✅ **Switch statement** menggunakan exact match (tidak case sensitive)  
✅ **Filter status** hanya Final dan Approved  
✅ **Auto-reset** fields saat ganti jenis kemasan  
✅ **Console logs** untuk debugging  
✅ **Empty state** handling ketika tidak ada formula  
✅ **useEffect** trigger saat jenisKemasan berubah  

---

**Last Updated:** 2026-04-22  
**Version:** 1.0
