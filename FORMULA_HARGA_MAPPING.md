# Formula Harga - Mapping Tab ke Database

## Struktur Penyimpanan

Setiap tab Formula Harga menyimpan data ke collection/prefix database yang berbeda dengan kode unik.

| Tab | Database Collection | Kode Formula | Prefix DB |
|-----|-------------------|--------------|-----------|
| **Polos** | `price_formula_polos:` | **FP**-YYYY-NNNN | FP (Formula Polos) |
| **Flexibel** | `price_formula_offset:` | **FF**-YYYY-NNNN | FF (Formula Flexibel) |
| **Boks** | `price_formula_boks:` | **FB**-YYYY-NNNN | FB (Formula Boks) |
| **Roto** | `price_formula_roto:` | **FR**-YYYY-NNNN | FR (Formula Roto) |

## Format Kode Formula

Format: `PREFIX-YYYY-NNNN`

**Contoh:**
- `FP-2026-0001` - Formula Polos pertama tahun 2026
- `FF-2026-0001` - Formula Flexibel pertama tahun 2026
- `FB-2026-0001` - Formula Boks pertama tahun 2026
- `FR-2026-0001` - Formula Roto pertama tahun 2026

## API Routing

### Create Formula

```typescript
// Frontend mengirim
{
  type: 'flexibel', // atau 'polos', 'boks', 'roto'
  labelKode: 'FF-2026-0001',
  // ... data lainnya
}

// API routing
switch(type) {
  case 'polos':
    → createPriceFormulaPolos() → price_formula_polos:timestamp
  case 'flexibel':
  case 'offset': // backward compatibility
    → createPriceFormulaOffset() → price_formula_offset:timestamp
  case 'boks':
    → createPriceFormulaBoks() → price_formula_boks:timestamp
  case 'roto':
    → createPriceFormulaRoto() → price_formula_roto:timestamp
}
```

### Fetch Formula

```typescript
// Get by type
api.getPriceFormulasPolos()   → price_formula_polos:*
api.getPriceFormulasOffset()  → price_formula_offset:* (Flexibel)
api.getPriceFormulasBoks()    → price_formula_boks:*
api.getPriceFormulasRoto()    → price_formula_roto:*

// Get all
api.getPriceFormulas() → gabungan semua type
```

## Generate Kode Formula

Kode di-generate di **frontend** saat simpan formula:

```typescript
generateLabelKode(tabType) {
  const currentYear = new Date().getFullYear();
  let prefix = 'FP'; // default
  
  if (tabType === 'flexibel') prefix = 'FF';
  else if (tabType === 'boks') prefix = 'FB';
  else if (tabType === 'roto') prefix = 'FR';
  else if (tabType === 'polos') prefix = 'FP';
  
  // Cari nomor terakhir tahun ini
  const maxNumber = findMaxNumber(prefix, currentYear);
  const nextNumber = maxNumber + 1;
  
  return `${prefix}-${currentYear}-${nextNumber.padStart(4, '0')}`;
}
```

## Backward Compatibility

### Type Field

Data lama mungkin punya `type: 'offset'`, data baru punya `type: 'flexibel'`.

**Solusi:** Filter menerima kedua value:

```typescript
if (activeTab === 'flexibel') {
  return f.type === 'flexibel' || f.type === 'offset';
}
```

### Quotation Form

Saat pilih jenis kemasan di quotation form:

```typescript
if (jenisKemasan === 'flexibel') {
  fetchFormulasOffset(); // Fetch dari price_formula_offset
  // Filter hanya status: final atau approved
}
```

## Data Storage

### Supabase KV Store

```
kv_store_6a7942bb
├── key: price_formula_polos:1234567890
│   └── value: { labelKode: 'FP-2026-0001', type: 'polos', ... }
├── key: price_formula_offset:1234567891
│   └── value: { labelKode: 'FF-2026-0001', type: 'flexibel', ... }
├── key: price_formula_boks:1234567892
│   └── value: { labelKode: 'FB-2026-0001', type: 'boks', ... }
└── key: price_formula_roto:1234567893
    └── value: { labelKode: 'FR-2026-0001', type: 'roto', ... }
```

## Verifikasi

### Test Create Formula

1. Buka tab **Polos** → Simpan formula → Cek kode **FP-YYYY-NNNN**
2. Buka tab **Flexibel** → Simpan formula → Cek kode **FF-YYYY-NNNN**
3. Buka tab **Boks** → Simpan formula → Cek kode **FB-YYYY-NNNN**
4. Buka tab **Roto** → Simpan formula → Cek kode **FR-YYYY-NNNN**

### Test Filter di Quotation

1. Tambah Penawaran → Tambah Item
2. Pilih Jenis Kemasan: **Flexibel**
3. Dropdown Formula Harga hanya tampil formula dari tab **Flexibel** dengan kode **FF-***
4. Pilih Jenis Kemasan: **Boks**
5. Dropdown Formula Harga hanya tampil formula dari tab **Boks** dengan kode **FB-***

### Cek Database

```javascript
// Console browser
const { api } = await import('./lib/api.ts');

// Lihat semua formula Flexibel
const flexibel = await api.getPriceFormulasOffset();
console.log(flexibel.map(f => ({ kode: f.labelKode, type: f.type })));

// Lihat semua formula Polos
const polos = await api.getPriceFormulasPolos();
console.log(polos.map(f => ({ kode: f.labelKode, type: f.type })));
```

## Troubleshooting

### Formula tidak muncul di tab yang benar

**Kemungkinan:** Field `type` tidak sesuai

**Solusi:** Cek field `type` di database, pastikan:
- Polos → `type: 'polos'`
- Flexibel → `type: 'flexibel'` atau `'offset'`
- Boks → `type: 'boks'`
- Roto → `type: 'roto'`

### Kode formula tidak sesuai

**Kemungkinan:** Generate kode di API (lama) masih aktif

**Solusi:** Sudah diperbaiki, kode sekarang di-generate di frontend dengan prefix yang benar.

### Formula lama (kode FO-) tidak muncul

**Kemungkinan:** Filter terlalu strict

**Solusi:** Sudah ditambahkan backward compatibility untuk menerima `type: 'offset'` di tab Flexibel.
