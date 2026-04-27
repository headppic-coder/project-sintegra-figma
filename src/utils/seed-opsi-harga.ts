/**
 * Helper Script: Seed Opsi Harga to Price Formulas
 *
 * Cara menggunakan:
 * 1. Buka Developer Console di browser (F12)
 * 2. Copy dan paste script ini
 * 3. Jalankan fungsi sesuai kebutuhan
 */

import { api } from '../app/lib/api';

// Sample opsi harga berdasarkan quantity tiers
const SAMPLE_OPSI_HARGA = {
  // Untuk kemasan flexibel/offset - harga per 1000 pcs
  flexibel: [
    { label: "Qty 1.000 pcs", harga: 5000 },
    { label: "Qty 5.000 pcs", harga: 4500 },
    { label: "Qty 10.000 pcs", harga: 4000 },
    { label: "Qty 20.000 pcs", harga: 3800 },
    { label: "Qty 50.000 pcs", harga: 3500 },
  ],

  // Untuk kemasan roto - harga per roll
  roto: [
    { label: "10 Roll", harga: 250000 },
    { label: "50 Roll", harga: 240000 },
    { label: "100 Roll", harga: 230000 },
    { label: "200 Roll", harga: 220000 },
    { label: "500 Roll", harga: 210000 },
  ],

  // Untuk kemasan boks - harga per unit
  boks: [
    { label: "Qty 500 unit", harga: 8000 },
    { label: "Qty 1.000 unit", harga: 7500 },
    { label: "Qty 5.000 unit", harga: 7000 },
    { label: "Qty 10.000 unit", harga: 6500 },
  ],

  // Untuk kemasan polos - harga per kg
  polos: [
    { label: "10 Kg", harga: 45000 },
    { label: "50 Kg", harga: 43000 },
    { label: "100 Kg", harga: 41000 },
    { label: "500 Kg", harga: 39000 },
    { label: "1.000 Kg", harga: 37000 },
  ],
};

/**
 * Tambahkan opsi harga ke semua formula offset
 */
export async function seedOpsiHargaOffset() {
  try {
    console.log('🔄 Menambahkan opsi harga ke formula offset...');

    const formulas = await api.getPriceFormulasOffset();
    let updated = 0;

    for (const formula of formulas) {
      // Skip jika sudah ada opsi harga
      if (formula.opsiHarga && formula.opsiHarga.length > 0) {
        console.log(`⏭️ Skip ${formula.labelKode || formula.id} - sudah ada opsi harga`);
        continue;
      }

      // Tambahkan opsi harga
      await api.updatePriceFormulaOffset(formula.id, {
        ...formula,
        opsiHarga: SAMPLE_OPSI_HARGA.flexibel
      });

      console.log(`✅ ${formula.labelKode || formula.id} - opsi harga ditambahkan`);
      updated++;
    }

    console.log(`\n✨ Selesai! ${updated} formula offset berhasil diupdate`);
    return { success: true, updated };
  } catch (error) {
    console.error('❌ Error:', error);
    return { success: false, error };
  }
}

/**
 * Tambahkan opsi harga ke semua formula roto
 */
export async function seedOpsiHargaRoto() {
  try {
    console.log('🔄 Menambahkan opsi harga ke formula roto...');

    const formulas = await api.getPriceFormulasRoto();
    let updated = 0;

    for (const formula of formulas) {
      if (formula.opsiHarga && formula.opsiHarga.length > 0) {
        console.log(`⏭️ Skip ${formula.labelKode || formula.id} - sudah ada opsi harga`);
        continue;
      }

      await api.updatePriceFormulaRoto(formula.id, {
        ...formula,
        opsiHarga: SAMPLE_OPSI_HARGA.roto
      });

      console.log(`✅ ${formula.labelKode || formula.id} - opsi harga ditambahkan`);
      updated++;
    }

    console.log(`\n✨ Selesai! ${updated} formula roto berhasil diupdate`);
    return { success: true, updated };
  } catch (error) {
    console.error('❌ Error:', error);
    return { success: false, error };
  }
}

/**
 * Tambahkan opsi harga ke semua formula boks
 */
export async function seedOpsiHargaBoks() {
  try {
    console.log('🔄 Menambahkan opsi harga ke formula boks...');

    const formulas = await api.getPriceFormulasBoks();
    let updated = 0;

    for (const formula of formulas) {
      if (formula.opsiHarga && formula.opsiHarga.length > 0) {
        console.log(`⏭️ Skip ${formula.labelKode || formula.id} - sudah ada opsi harga`);
        continue;
      }

      await api.updatePriceFormulaBoks(formula.id, {
        ...formula,
        opsiHarga: SAMPLE_OPSI_HARGA.boks
      });

      console.log(`✅ ${formula.labelKode || formula.id} - opsi harga ditambahkan`);
      updated++;
    }

    console.log(`\n✨ Selesai! ${updated} formula boks berhasil diupdate`);
    return { success: true, updated };
  } catch (error) {
    console.error('❌ Error:', error);
    return { success: false, error };
  }
}

/**
 * Tambahkan opsi harga ke semua formula polos
 */
export async function seedOpsiHargaPolos() {
  try {
    console.log('🔄 Menambahkan opsi harga ke formula polos...');

    const formulas = await api.getPriceFormulasPolos();
    let updated = 0;

    for (const formula of formulas) {
      if (formula.opsiHarga && formula.opsiHarga.length > 0) {
        console.log(`⏭️ Skip ${formula.labelKode || formula.id} - sudah ada opsi harga`);
        continue;
      }

      await api.updatePriceFormulaPolos(formula.id, {
        ...formula,
        opsiHarga: SAMPLE_OPSI_HARGA.polos
      });

      console.log(`✅ ${formula.labelKode || formula.id} - opsi harga ditambahkan`);
      updated++;
    }

    console.log(`\n✨ Selesai! ${updated} formula polos berhasil diupdate`);
    return { success: true, updated };
  } catch (error) {
    console.error('❌ Error:', error);
    return { success: false, error };
  }
}

/**
 * Tambahkan opsi harga ke SEMUA formula (offset, roto, boks, polos)
 */
export async function seedAllOpsiHarga() {
  console.log('🚀 Memulai seed opsi harga untuk semua jenis formula...\n');

  const results = {
    offset: await seedOpsiHargaOffset(),
    roto: await seedOpsiHargaRoto(),
    boks: await seedOpsiHargaBoks(),
    polos: await seedOpsiHargaPolos(),
  };

  console.log('\n📊 Summary:');
  console.log(`- Offset: ${results.offset.updated || 0} updated`);
  console.log(`- Roto: ${results.roto.updated || 0} updated`);
  console.log(`- Boks: ${results.boks.updated || 0} updated`);
  console.log(`- Polos: ${results.polos.updated || 0} updated`);
  console.log(`\n✅ Total: ${(results.offset.updated || 0) + (results.roto.updated || 0) + (results.boks.updated || 0) + (results.polos.updated || 0)} formula berhasil diupdate`);

  return results;
}

/**
 * Tambahkan opsi harga kustom ke formula tertentu
 */
export async function addCustomOpsiHarga(
  formulaId: string,
  opsiHarga: Array<{ label: string; harga: number }>
) {
  try {
    // Deteksi tipe formula dari ID
    let updateFunction;

    if (formulaId.startsWith('price_formula_offset:')) {
      updateFunction = api.updatePriceFormulaOffset;
    } else if (formulaId.startsWith('price_formula_roto:')) {
      updateFunction = api.updatePriceFormulaRoto;
    } else if (formulaId.startsWith('price_formula_boks:')) {
      updateFunction = api.updatePriceFormulaBoks;
    } else if (formulaId.startsWith('price_formula_polos:')) {
      updateFunction = api.updatePriceFormulaPolos;
    } else {
      throw new Error('Formula ID tidak valid atau tipe tidak dikenali');
    }

    // Get existing formula
    const allFormulas = await api.getPriceFormulas();
    const formula = allFormulas.find((f: any) => f.id === formulaId);

    if (!formula) {
      throw new Error('Formula tidak ditemukan');
    }

    // Update dengan opsi harga baru
    await updateFunction(formulaId, {
      ...formula,
      opsiHarga
    });

    console.log(`✅ Opsi harga berhasil ditambahkan ke ${formula.labelKode || formulaId}`);
    return { success: true };
  } catch (error) {
    console.error('❌ Error:', error);
    return { success: false, error };
  }
}

// Export untuk digunakan di console
if (typeof window !== 'undefined') {
  (window as any).seedOpsiHarga = {
    offset: seedOpsiHargaOffset,
    roto: seedOpsiHargaRoto,
    boks: seedOpsiHargaBoks,
    polos: seedOpsiHargaPolos,
    all: seedAllOpsiHarga,
    custom: addCustomOpsiHarga,
    samples: SAMPLE_OPSI_HARGA,
  };

  console.log('📦 Seed Opsi Harga Helper loaded!');
  console.log('💡 Gunakan: window.seedOpsiHarga.all() untuk seed semua formula');
  console.log('💡 Atau: window.seedOpsiHarga.offset() untuk offset saja');
}
