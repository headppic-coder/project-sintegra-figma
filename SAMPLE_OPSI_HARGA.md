# Cara Menambahkan Opsi Harga ke Formula Harga

## Struktur Data Opsi Harga

Field `opsiHarga` pada formula harga memiliki struktur:

```json
{
  "opsiHarga": [
    {
      "label": "Qty 1000 pcs",
      "harga": 5000
    },
    {
      "label": "Qty 5000 pcs", 
      "harga": 4500
    },
    {
      "label": "Qty 10000 pcs",
      "harga": 4000
    }
  ]
}
```

## Cara Menambahkan via Console Browser

1. Buka halaman **Master Formula Harga** (Offset/Roto/Boks/Polos)
2. Buka **Developer Console** browser (F12 atau Ctrl+Shift+I)
3. Jalankan script berikut untuk menambahkan sample data:

```javascript
// Contoh: Tambahkan opsi harga ke formula offset
async function addOpsiHargaToFormula() {
  // Import API
  const { api } = await import('./lib/api.ts');
  
  // Ambil semua formula offset
  const formulas = await api.getPriceFormulasOffset();
  
  if (formulas.length > 0) {
    // Pilih formula pertama sebagai contoh
    const formula = formulas[0];
    
    // Tambahkan opsi harga
    formula.opsiHarga = [
      { label: "Qty 1.000 pcs", harga: 5000 },
      { label: "Qty 5.000 pcs", harga: 4500 },
      { label: "Qty 10.000 pcs", harga: 4000 },
      { label: "Qty 20.000 pcs", harga: 3800 },
      { label: "Qty 50.000 pcs", harga: 3500 }
    ];
    
    // Update formula
    await api.updatePriceFormulaOffset(formula.id, formula);
    
    console.log('✅ Opsi harga berhasil ditambahkan ke formula:', formula.labelKode);
  }
}

// Jalankan fungsi
addOpsiHargaToFormula();
```

## Cara Manual via Supabase Dashboard

1. Buka **Supabase Dashboard**
2. Pilih tabel **kv_store_6a7942bb**
3. Cari row dengan key yang dimulai dengan:
   - `price_formula_offset:` untuk formula offset
   - `price_formula_roto:` untuk formula roto
   - `price_formula_boks:` untuk formula boks
   - `price_formula_polos:` untuk formula polos
4. Edit kolom `value` (format JSONB)
5. Tambahkan field `opsiHarga` dengan struktur array seperti contoh di atas
6. Save changes

## Contoh Complete Value JSONB

```json
{
  "id": "price_formula_offset:1234567890",
  "labelKode": "FO-2026-001",
  "namaBarang": "Standing Pouch 12x20 cm",
  "customer": "PT CONTOH INDONESIA",
  "hargaJual": 5000,
  "type": "offset",
  "bahan": "Papermetal",
  "alas": "Polos",
  "opsiHarga": [
    {
      "label": "Qty 1.000 pcs",
      "harga": 5000
    },
    {
      "label": "Qty 5.000 pcs",
      "harga": 4500
    },
    {
      "label": "Qty 10.000 pcs",
      "harga": 4000
    }
  ],
  "createdAt": "2026-04-22T10:00:00.000Z"
}
```

## Testing

Setelah menambahkan data opsi harga:

1. Buka halaman **Tambah Penawaran**
2. Klik **Tambah Item**
3. Pilih **Jenis Kemasan** (contoh: Flexibel)
4. Pilih **Formula Harga** yang sudah ditambahkan opsi harga
5. Field **Opsi Harga** akan muncul di bawah Formula Harga
6. Pilih salah satu opsi harga
7. **Harga Satuan** otomatis terupdate sesuai opsi yang dipilih
8. **Total Harga** akan ter-calculate otomatis

## Catatan

- Field opsi harga **opsional** (tidak wajib diisi di semua formula)
- Jika formula tidak memiliki opsi harga, field tetap muncul tapi menampilkan "Tidak ada opsi harga tersedia"
- Harga satuan akan otomatis terupdate ketika opsi harga dipilih
- Jika formula diganti, opsi harga akan di-reset
