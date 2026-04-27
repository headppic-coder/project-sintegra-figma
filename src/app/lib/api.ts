import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { projectId, publicAnonKey } from '../../../utils/supabase/info';

// Singleton pattern to avoid multiple GoTrueClient instances
let supabaseInstance: SupabaseClient | null = null;

// Check if instance already exists in window
if (typeof window !== 'undefined' && (window as any).__SUPABASE_CLIENT__) {
  supabaseInstance = (window as any).__SUPABASE_CLIENT__;
}

function getSupabase() {
  if (!supabaseInstance) {
    const supabaseUrl = `https://${projectId}.supabase.co`;

    supabaseInstance = createClient(
      supabaseUrl,
      publicAnonKey,
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
          detectSessionInUrl: false,
          storage: undefined,
        },
        global: {
          headers: {
            'x-client-info': 'erp-manufacturing-client',
          },
        },
        db: {
          schema: 'public',
        },
      }
    );

    // Store in window to prevent multiple instances
    if (typeof window !== 'undefined') {
      (window as any).__SUPABASE_CLIENT__ = supabaseInstance;
      (window as any).__SUPABASE_URL__ = supabaseUrl;
    }
  }
  return supabaseInstance;
}

const supabase = getSupabase();

// Export supabase for direct usage
export { supabase };

// KV Store table name
const KV_TABLE = 'kv_store_6a7942bb';

// Track connection status
let connectionChecked = false;
let connectionPromise: Promise<void> | null = null;

// Health check on first load - completely non-blocking and optional
async function checkConnection() {
  if (connectionChecked) return;
  connectionChecked = true;

  try {
    // Simple ping to check if table exists
    const { error } = await supabase
      .from(KV_TABLE)
      .select('key')
      .limit(1);

    // Any of these error codes are acceptable for health check:
    // - PGRST116: no rows (table exists but empty)
    // - 42P01: table doesn't exist (need to create it)
    // - PGRST301: table not found
    const acceptableErrors = ['PGRST116', '42P01', 'PGRST301'];

    if (!error || acceptableErrors.includes(error.code || '')) {
      console.log('✅ Supabase Connected');
      (window as any).__SUPABASE_CONNECTED__ = true;
      (window as any).__SUPABASE_ERROR__ = null;

      // If table doesn't exist, log instructions
      if (error?.code === '42P01' || error?.code === 'PGRST301') {
        console.warn('⚠️ Table kv_store_6a7942bb belum dibuat. Buat table dulu di Supabase.');
        console.log('%c📝 SOLUSI: Lihat file QUICK_FIX.md atau README_DATABASE_SETUP.md', 'color: #f59e0b; font-weight: bold; font-size: 14px;');
        console.log('SQL: CREATE TABLE kv_store_6a7942bb (key TEXT PRIMARY KEY, value JSONB);');
      }
    } else {
      // Check if it's a network error (Failed to fetch)
      if (error.message?.includes('Failed to fetch') || !error.code) {
        // Silently handle network errors - don't spam console
        (window as any).__SUPABASE_ERROR__ = 'Network error';
        (window as any).__SUPABASE_CONNECTED__ = false;
      } else {
        console.warn('⚠️ Supabase Warning:', error.message, `(Code: ${error.code})`);
        (window as any).__SUPABASE_ERROR__ = error.message;
        (window as any).__SUPABASE_CONNECTED__ = false;
      }
    }
  } catch (error: any) {
    // Network errors are non-fatal - silently handle them
    if (error.message?.includes('Failed to fetch') || error.name === 'TypeError') {
      // Silently set error state without logging
      (window as any).__SUPABASE_ERROR__ = 'Network error';
      (window as any).__SUPABASE_CONNECTED__ = false;
    } else {
      // Only log non-network errors
      console.warn('⚠️ Network warning (non-blocking):', error.message);
      console.log('%c📝 FIX: Lihat file README_DATABASE_SETUP.md untuk setup database', 'color: #3b82f6; font-weight: bold; font-size: 14px;');
      console.log('%c⚡ Quick Fix: Buat table di Supabase SQL Editor → Lihat QUICK_FIX.md', 'color: #10b981; font-size: 12px;');
      (window as any).__SUPABASE_ERROR__ = error.message;
      (window as any).__SUPABASE_CONNECTED__ = false;
    }
  }
}

// Run health check asynchronously - completely decoupled from app startup
if (typeof window !== 'undefined') {
  // Defer to idle callback or after a short delay
  if ('requestIdleCallback' in window) {
    (window as any).requestIdleCallback(() => {
      connectionPromise = checkConnection();
    });
  } else {
    setTimeout(() => {
      connectionPromise = checkConnection();
    }, 100);
  }
}

// KV Store helpers - Supabase only with production-ready error handling
async function kvGet(key: string) {
  try {
    const { data, error } = await supabase
      .from(KV_TABLE)
      .select('value')
      .eq('key', key)
      .maybeSingle();

    if (error) {
      // Gracefully handle table not found or connection errors - silently
      if (error.code === '42P01' || error.code === 'PGRST301' || error.message?.includes('Failed to fetch') || !error.code) {
        return null;
      }
      console.error('❌ kvGet error:', error);
      throw error;
    }

    return data?.value;
  } catch (error: any) {
    // Network errors should fail gracefully - silently
    if (error.message?.includes('Failed to fetch') || error.name === 'TypeError') {
      return null;
    }
    console.error('❌ kvGet exception:', error);
    throw error;
  }
}

async function kvSet(key: string, value: any) {
  try {
    const { error } = await supabase
      .from(KV_TABLE)
      .upsert({ key, value }, { onConflict: 'key' });

    if (error) {
      // Gracefully handle table not found or connection errors - silently
      if (error.code === '42P01' || error.code === 'PGRST301' || error.message?.includes('Failed to fetch') || !error.code) {
        return; // Silently fail
      }
      console.error('❌ kvSet error:', error);
      throw error;
    }
  } catch (error: any) {
    // Network errors should fail gracefully - silently
    if (error.message?.includes('Failed to fetch') || error.name === 'TypeError') {
      return; // Silently fail
    }
    console.error('❌ kvSet exception:', error);
    throw error;
  }
}

async function kvDel(key: string) {
  try {
    console.log('🗑️ Attempting to delete key:', key);

    const { data, error } = await supabase
      .from(KV_TABLE)
      .delete()
      .eq('key', key)
      .select();

    if (error) {
      console.error('❌ kvDel error:', {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint
      });

      // Check for RLS/Permission errors
      if (error.code === '42501') {
        console.error('🚫 PERMISSION DENIED: RLS (Row Level Security) is blocking DELETE operation');
        console.error('💡 SOLUSI: Disable RLS atau tambahkan policy DELETE di Supabase');
        console.error('SQL Command:');
        console.error(`ALTER TABLE ${KV_TABLE} DISABLE ROW LEVEL SECURITY;`);
        throw new Error('Permission denied: Row Level Security is blocking DELETE. Check Supabase RLS policies.');
      }

      // Gracefully handle table not found or connection errors
      if (error.code === '42P01' || error.code === 'PGRST301') {
        console.warn('⚠️ Table not found or not accessible');
        throw new Error('Table not found. Please create the table first.');
      }

      if (error.message?.includes('Failed to fetch') || !error.code) {
        console.warn('⚠️ Network error during delete');
        throw new Error('Network error: Cannot connect to database');
      }

      throw new Error(`Failed to delete: ${error.message} (Code: ${error.code})`);
    }

    if (!data || data.length === 0) {
      console.warn('⚠️ Delete executed but no rows were deleted. Key may not exist:', key);
    } else {
      console.log('✅ Delete successful. Rows deleted:', data.length, 'Data:', data);
    }
  } catch (error: any) {
    console.error('❌ kvDel exception:', error);
    throw error;
  }
}

async function kvGetByPrefix(prefix: string) {
  try {
    const { data, error } = await supabase
      .from(KV_TABLE)
      .select('value')
      .like('key', `${prefix}%`);

    if (error) {
      // Check if it's a table not found error or connection error - silently handle
      if (error.code === '42P01' || error.code === 'PGRST301' || error.message?.includes('Failed to fetch') || !error.code) {
        // Return empty array instead of throwing - graceful degradation
        return [];
      }
      console.error('❌ kvGetByPrefix error:', error);
      throw error;
    }

    return data?.map(d => d.value) || [];
  } catch (error: any) {
    // Network errors should fail gracefully - silently
    if (error.message?.includes('Failed to fetch') || error.name === 'TypeError') {
      return [];
    }
    console.error('❌ kvGetByPrefix exception:', error);
    throw error;
  }
}

export const api = {
  // Documentation System
  async getDocumentation() {
    let docs = await kvGetByPrefix('documentation:');
    if (docs.length === 0) {
      // Initialize with comprehensive system documentation
      const systemDocs = [
        {
          id: 'documentation:sales:prospective-customers',
          module: 'Sales',
          moduleIcon: 'Users',
          feature: 'Calon Customer',
          featureIcon: 'UserPlus',
          slug: 'prospective-customers',
          description: 'Modul untuk mengelola data calon pelanggan (leads) yang potensial menjadi customer aktif',
          purpose: 'Tracking dan nurturing leads dari berbagai sumber untuk dikonversi menjadi customer',
          fields: [
            { name: 'Nama Perusahaan', type: 'text', required: true, description: 'Nama lengkap perusahaan calon customer' },
            { name: 'Kontak Person', type: 'text', required: true, description: 'Nama PIC yang dapat dihubungi' },
            { name: 'Email', type: 'email', required: true, description: 'Email untuk komunikasi' },
            { name: 'Telepon', type: 'phone', required: true, description: 'Nomor telepon/HP yang dapat dihubungi' },
            { name: 'Sumber Lead', type: 'select', required: true, description: 'Dari mana lead ini didapat (Referensi, Website, Pameran, dll)' },
            { name: 'Status', type: 'select', required: true, description: 'Status prospek: New Lead, Contacted, Qualified, Proposal Sent' },
            { name: 'Catatan', type: 'textarea', required: false, description: 'Informasi tambahan tentang prospek' },
          ],
          usage: [
            'Klik tombol "Tambah Calon Customer" untuk input lead baru',
            'Isi semua field yang wajib (bertanda *)',
            'Pilih sumber lead untuk tracking efektivitas channel',
            'Update status secara berkala sesuai progress follow-up',
            'Gunakan kolom Aksi untuk Edit atau Hapus data',
          ],
          tips: [
            'Selalu update status lead setelah setiap interaksi',
            'Gunakan field catatan untuk mencatat detail penting',
            'Review leads dengan status "New Lead" secara rutin',
            'Konversi ke Customer setelah closing deal',
          ],
          relatedFeatures: [
            { name: 'Customer', path: '/sales/customers', description: 'Konversi dari Calon Customer' },
            { name: 'Pipeline', path: '/sales/pipeline', description: 'Track progress sales' },
            { name: 'Master Sumber Lead', path: '/sales/lead-sources', description: 'Kelola sumber lead' },
          ],
        },
        {
          id: 'documentation:hrga:departments',
          module: 'HRGA',
          moduleIcon: 'Building2',
          feature: 'Master Departemen',
          featureIcon: 'Building',
          slug: 'departments',
          description: 'Modul untuk mengelola struktur departemen perusahaan dengan hierarki multi-level',
          purpose: 'Mengorganisir struktur organisasi perusahaan dan hubungan antar departemen',
          fields: [
            { name: 'Kode', type: 'text', required: true, description: 'Kode unik departemen (auto-generate: DEP-XXX)' },
            { name: 'Nama', type: 'text', required: true, description: 'Nama departemen' },
            { name: 'Kode Perusahaan', type: 'select', required: true, description: 'Perusahaan induk departemen' },
            { name: 'Parent/Atasan', type: 'select', required: false, description: 'Departemen atasan (untuk sub-departemen)' },
            { name: 'Level', type: 'badge', required: true, description: 'Level hierarki (L1, L2, L3) - auto-calculated' },
            { name: 'Kepala Departemen', type: 'text', required: false, description: 'Nama kepala/manager departemen' },
            { name: 'Jumlah Karyawan', type: 'number', required: false, description: 'Total headcount di departemen' },
            { name: 'Status', type: 'select', required: true, description: 'Active atau Inactive' },
          ],
          usage: [
            'Klik "Tambah Departemen" untuk membuat departemen baru',
            'Untuk departemen utama (L1), kosongkan Parent/Atasan',
            'Untuk sub-departemen (L2, L3), pilih Parent yang sesuai',
            'Level akan otomatis ter-calculate berdasarkan parent',
            'Badge berwarna menunjukkan level: L1 (Biru), L2 (Hijau), L3 (Kuning)',
          ],
          tips: [
            'Buat struktur L1 (departemen utama) terlebih dahulu',
            'Gunakan kode yang konsisten dan mudah diingat',
            'Update jumlah karyawan secara berkala',
            'Struktur hierarki max 3 level untuk efisiensi',
          ],
          relatedFeatures: [
            { name: 'Master Perusahaan', path: '/hrga/companies', description: 'Data induk perusahaan' },
            { name: 'Master Posisi/Jabatan', path: '/hrga/positions', description: 'Posisi terkait departemen' },
            { name: 'Data Karyawan', path: '/hrga/employees', description: 'Karyawan per departemen' },
          ],
        },
        {
          id: 'documentation:hrga:positions',
          module: 'HRGA',
          moduleIcon: 'Building2',
          feature: 'Master Posisi/Jabatan',
          featureIcon: 'Briefcase',
          slug: 'positions',
          description: 'Modul untuk mengelola master posisi/jabatan dengan hierarki dan level karyawan',
          purpose: 'Mendefinisikan struktur jabatan dengan hierarki parent-child untuk sistem kepegawaian',
          fields: [
            { name: 'Kode', type: 'text', required: true, description: 'Kode unik posisi (auto-generate: POS-XXX)' },
            { name: 'Nama', type: 'text', required: true, description: 'Nama jabatan/posisi' },
            { name: 'Departemen', type: 'select', required: false, description: 'Departemen terkait (dengan hierarki)' },
            { name: 'Parent Jabatan', type: 'select', required: false, description: 'Jabatan atasan untuk membuat hierarki' },
            { name: 'Level', type: 'select', required: true, description: 'Level posisi: 1 (C-Level), 2 (Manager), 3 (Supervisor), 4 (Staff), 5 (Operator)' },
            { name: 'Persyaratan', type: 'textarea', required: false, description: 'Kualifikasi dan persyaratan jabatan' },
            { name: 'Status', type: 'select', required: true, description: 'Active atau Inactive' },
          ],
          usage: [
            'Pastikan Master Departemen sudah dibuat terlebih dahulu',
            'Klik "Tambah Posisi" untuk membuat jabatan baru',
            'Pilih departemen yang sesuai (menampilkan hierarki)',
            'Pilih parent jabatan untuk membuat struktur organisasi',
            'Tentukan level: 1=C-Level, 2=Manager, 3=Supervisor, 4=Staff, 5=Operator',
            'Sistem akan menampilkan hierarki parent-child di tabel',
          ],
          tips: [
            'Level 1-2 untuk managerial, 3-5 untuk operational',
            'Buat posisi puncak (tanpa parent) terlebih dahulu',
            'Gunakan parent jabatan untuk membuat struktur reporting',
            'Isi persyaratan detail untuk recruitment reference',
          ],
          relatedFeatures: [
            { name: 'Master Departemen', path: '/hrga/departments', description: 'Struktur departemen' },
            { name: 'Data Karyawan', path: '/hrga/employees', description: 'Assignment posisi ke karyawan' },
            { name: 'Struktur Organisasi', path: '/hrga/organization-structure', description: 'Visualisasi hierarki' },
          ],
        },
        {
          id: 'documentation:sales:customers',
          module: 'Sales',
          moduleIcon: 'Users',
          feature: 'Customer',
          featureIcon: 'UsersRound',
          slug: 'customers',
          description: 'Modul untuk mengelola data customer aktif yang sudah closing deal',
          purpose: 'Database customer untuk transaksi penjualan, order, dan delivery',
          fields: [
            { name: 'Kode Customer', type: 'text', required: true, description: 'Kode unik customer (auto-generate)' },
            { name: 'Nama Perusahaan', type: 'text', required: true, description: 'Nama resmi perusahaan' },
            { name: 'Alamat', type: 'textarea', required: true, description: 'Alamat lengkap untuk pengiriman' },
            { name: 'Kota', type: 'text', required: true, description: 'Kota lokasi customer' },
            { name: 'Kontak Person', type: 'text', required: true, description: 'PIC untuk komunikasi' },
            { name: 'Email', type: 'email', required: true, description: 'Email customer' },
            { name: 'Telepon', type: 'phone', required: true, description: 'Nomor telepon' },
            { name: 'Tipe', type: 'select', required: true, description: 'Distributor, Retailer, End User' },
            { name: 'Status', type: 'select', required: true, description: 'Active atau Inactive' },
          ],
          usage: [
            'Customer baru biasanya dikonversi dari Calon Customer',
            'Klik "Tambah Customer" untuk input manual',
            'Pastikan data alamat lengkap untuk delivery',
            'Pilih tipe customer untuk segmentasi',
            'Customer aktif dapat membuat Sales Order',
          ],
          tips: [
            'Verifikasi data kontak sebelum menyimpan',
            'Update status jika customer tidak aktif lagi',
            'Gunakan kode customer untuk referensi order',
            'Link dengan Pipeline untuk tracking history',
          ],
          relatedFeatures: [
            { name: 'Calon Customer', path: '/sales/prospective-customers', description: 'Sumber konversi' },
            { name: 'Pesanan Penjualan', path: '/sales/sales-orders', description: 'Buat order dari customer' },
            { name: 'Pipeline', path: '/sales/pipeline', description: 'History sales process' },
          ],
        },
        {
          id: 'documentation:design:design-requests',
          module: 'Design',
          moduleIcon: 'Palette',
          feature: 'Permintaan Desain',
          featureIcon: 'PenTool',
          slug: 'design-requests',
          description: 'Modul untuk mengelola permintaan desain dari customer atau sales',
          purpose: 'Workflow management untuk proses desain artwork packaging',
          fields: [
            { name: 'No. Permintaan', type: 'text', required: true, description: 'Nomor unik permintaan (auto-generate: DR-XXX)' },
            { name: 'Customer', type: 'select', required: true, description: 'Customer yang request desain' },
            { name: 'Produk', type: 'text', required: true, description: 'Nama produk yang akan didesain' },
            { name: 'Tanggal Permintaan', type: 'date', required: true, description: 'Tanggal request masuk' },
            { name: 'Target Selesai', type: 'date', required: true, description: 'Deadline penyelesaian desain' },
            { name: 'Status', type: 'badge', required: true, description: 'On Progress, Review, Approved, Rejected' },
            { name: 'Designer', type: 'select', required: false, description: 'Designer yang ditugaskan' },
            { name: 'Catatan', type: 'textarea', required: false, description: 'Brief dan requirement desain' },
          ],
          usage: [
            'Sales/Customer submit permintaan desain baru',
            'Tim Design assign designer ke request',
            'Designer update status progress secara berkala',
            'Upload draft untuk review customer',
            'Approve setelah revisi selesai',
          ],
          tips: [
            'Brief yang jelas mempercepat proses desain',
            'Set target realistis sesuai kompleksitas',
            'Komunikasi rutin dengan customer untuk feedback',
            'Arsipkan approved design di Design Library',
          ],
          relatedFeatures: [
            { name: 'Proses Desain', path: '/design/design-process', description: 'Workflow tracking' },
            { name: 'Perpustakaan Desain', path: '/design/design-library', description: 'Arsip design files' },
            { name: 'Layout Desain', path: '/design/design-layout', description: 'Layout artwork' },
          ],
        },
        {
          id: 'documentation:ppic:production-plans',
          module: 'PPIC',
          moduleIcon: 'ClipboardCheck',
          feature: 'Rencana Produksi',
          featureIcon: 'ClipboardCheck',
          slug: 'production-plans',
          description: 'Modul untuk membuat rencana produksi berdasarkan sales order',
          purpose: 'Planning dan scheduling produksi untuk memenuhi order customer',
          fields: [
            { name: 'No. Rencana', type: 'text', required: true, description: 'Nomor unik plan (auto-generate: PP-XXX)' },
            { name: 'Sales Order', type: 'select', required: true, description: 'SO yang akan diproduksi' },
            { name: 'Produk', type: 'text', required: true, description: 'Nama produk dari SO' },
            { name: 'Qty Rencana', type: 'number', required: true, description: 'Jumlah yang akan diproduksi' },
            { name: 'Tanggal Mulai', type: 'date', required: true, description: 'Start date produksi' },
            { name: 'Tanggal Selesai', type: 'date', required: true, description: 'Target completion date' },
            { name: 'Status', type: 'badge', required: true, description: 'Planned, In Progress, Completed, Cancelled' },
            { name: 'Catatan', type: 'textarea', required: false, description: 'Catatan produksi' },
          ],
          usage: [
            'Pilih Sales Order yang akan diproduksi',
            'Tentukan quantity sesuai kapasitas produksi',
            'Set tanggal mulai dan selesai realistis',
            'Koordinasi dengan tim Produksi untuk eksekusi',
            'Monitor progress di Monitoring Jadwal Produksi',
          ],
          tips: [
            'Buffer time untuk unexpected delay',
            'Cek ketersediaan material sebelum planning',
            'Koordinasi dengan Gudang untuk raw material',
            'Update status real-time untuk visibility',
          ],
          relatedFeatures: [
            { name: 'Rencana Jadwal Produksi', path: '/ppic/production-schedule', description: 'Detail scheduling' },
            { name: 'Monitoring Jadwal', path: '/ppic/schedule-monitoring', description: 'Progress tracking' },
            { name: 'Monitoring Material', path: '/ppic/material-monitoring', description: 'Material availability' },
          ],
        },
        {
          id: 'documentation:production:realizations',
          module: 'Produksi',
          moduleIcon: 'Factory',
          feature: 'Realisasi Produksi',
          featureIcon: 'Activity',
          slug: 'production-realizations',
          description: 'Modul untuk mencatat hasil aktual produksi harian',
          purpose: 'Recording dan monitoring output produksi vs rencana',
          fields: [
            { name: 'Tanggal Produksi', type: 'date', required: true, description: 'Tanggal realisasi produksi' },
            { name: 'Mesin', type: 'select', required: true, description: 'Mesin yang digunakan' },
            { name: 'Shift', type: 'select', required: true, description: 'Shift kerja (Pagi/Siang/Malam)' },
            { name: 'Produk', type: 'text', required: true, description: 'Produk yang diproduksi' },
            { name: 'Qty OK', type: 'number', required: true, description: 'Jumlah produk bagus' },
            { name: 'Qty NG', type: 'number', required: true, description: 'Jumlah produk reject' },
            { name: 'Downtime', type: 'number', required: false, description: 'Waktu downtime (menit)' },
            { name: 'Operator', type: 'text', required: true, description: 'Nama operator produksi' },
            { name: 'Catatan', type: 'textarea', required: false, description: 'Issue atau catatan penting' },
          ],
          usage: [
            'Input realisasi produksi setiap akhir shift',
            'Pilih mesin dan shift yang sesuai',
            'Catat qty OK (good) dan NG (reject) secara akurat',
            'Input downtime jika ada untuk analisis',
            'Data digunakan untuk laporan efisiensi produksi',
          ],
          tips: [
            'Input segera setelah shift untuk akurasi data',
            'Catat penyebab NG di kolom catatan',
            'Record downtime untuk improvement analysis',
            'Data ini mempengaruhi inventory dan costing',
          ],
          relatedFeatures: [
            { name: 'Master Mesin', path: '/production/machines', description: 'Data mesin produksi' },
            { name: 'Monitoring Produksi', path: '/production/monitoring', description: 'Dashboard produksi' },
            { name: 'Laporan Produksi', path: '/reports/production', description: 'Analisis output' },
          ],
        },
        {
          id: 'documentation:warehouse:items',
          module: 'Gudang',
          moduleIcon: 'Package',
          feature: 'Master Item/Produk',
          featureIcon: 'PackageOpen',
          slug: 'items',
          description: 'Modul untuk mengelola master data item (raw material & finished goods)',
          purpose: 'Database produk untuk inventory, purchasing, dan production',
          fields: [
            { name: 'Kode Item', type: 'text', required: true, description: 'Kode unik item (auto-generate: ITM-XXX)' },
            { name: 'Nama Item', type: 'text', required: true, description: 'Nama lengkap item' },
            { name: 'Kategori', type: 'select', required: true, description: 'Raw Material, Packaging, Finished Goods, Spare Part' },
            { name: 'Satuan', type: 'select', required: true, description: 'Unit of Measure (Kg, Meter, Roll, Pcs, dll)' },
            { name: 'Stok Minimum', type: 'number', required: true, description: 'Minimum stock level untuk reorder' },
            { name: 'Stok Maksimum', type: 'number', required: true, description: 'Maximum stock level' },
            { name: 'Harga Beli', type: 'number', required: false, description: 'Harga pembelian terakhir' },
            { name: 'Supplier Utama', type: 'select', required: false, description: 'Default supplier' },
            { name: 'Status', type: 'select', required: true, description: 'Active atau Inactive' },
          ],
          usage: [
            'Buat master item untuk semua material dan produk',
            'Pilih kategori yang tepat untuk klasifikasi',
            'Set min/max stock untuk auto reorder alert',
            'Update harga beli untuk costing accuracy',
            'Link dengan supplier untuk PO automation',
          ],
          tips: [
            'Gunakan naming convention yang konsisten',
            'Set min stock berdasarkan lead time supplier',
            'Review dan update master item secara berkala',
            'Inactive item yang sudah tidak digunakan',
          ],
          relatedFeatures: [
            { name: 'Stock Opname', path: '/warehouse/stock-opname', description: 'Physical count' },
            { name: 'Mutasi Stock', path: '/warehouse/stock-movements', description: 'Stock transactions' },
            { name: 'Laporan Stock', path: '/reports/inventory', description: 'Inventory reports' },
          ],
        },
        {
          id: 'documentation:procurement:suppliers',
          module: 'Procurement',
          moduleIcon: 'ShoppingCart',
          feature: 'Master Supplier',
          featureIcon: 'Store',
          slug: 'suppliers',
          description: 'Modul untuk mengelola data supplier/vendor bahan baku dan material',
          purpose: 'Database supplier untuk procurement dan purchasing process',
          fields: [
            { name: 'Kode Supplier', type: 'text', required: true, description: 'Kode unik supplier (auto-generate: SUP-XXX)' },
            { name: 'Nama Perusahaan', type: 'text', required: true, description: 'Nama resmi supplier' },
            { name: 'Alamat', type: 'textarea', required: true, description: 'Alamat lengkap supplier' },
            { name: 'Kota', type: 'text', required: true, description: 'Kota supplier' },
            { name: 'Kontak Person', type: 'text', required: true, description: 'PIC supplier' },
            { name: 'Email', type: 'email', required: true, description: 'Email untuk PO' },
            { name: 'Telepon', type: 'phone', required: true, description: 'Nomor telepon' },
            { name: 'Tipe Material', type: 'select', required: true, description: 'Raw Material, Packaging, Chemical, dll' },
            { name: 'Payment Term', type: 'select', required: false, description: 'COD, Net 30, Net 45, dll' },
            { name: 'Rating', type: 'select', required: false, description: 'A (Excellent), B (Good), C (Fair)' },
            { name: 'Status', type: 'select', required: true, description: 'Active atau Inactive' },
          ],
          usage: [
            'Klik "Tambah Supplier" untuk vendor baru',
            'Isi data lengkap untuk komunikasi PO',
            'Set tipe material untuk klasifikasi',
            'Tentukan payment term untuk finance planning',
            'Rating supplier untuk vendor evaluation',
          ],
          tips: [
            'Maintain minimal 2 supplier per material (backup)',
            'Update rating based on delivery performance',
            'Verifikasi NPWP untuk legal compliance',
            'Regular review untuk supplier consolidation',
          ],
          relatedFeatures: [
            { name: 'Purchase Order', path: '/procurement/purchase-orders', description: 'Buat PO ke supplier' },
            { name: 'Penerimaan Barang', path: '/procurement/goods-receipts', description: 'Receive dari supplier' },
            { name: 'Master Item', path: '/warehouse/items', description: 'Link item ke supplier' },
          ],
        },
      ];

      for (const doc of systemDocs) {
        await kvSet(doc.id, { ...doc, createdAt: new Date().toISOString() });
      }
      docs = await kvGetByPrefix('documentation:');
    }
    return docs;
  },

  async getDocumentationBySlug(slug: string) {
    const docs = await kvGetByPrefix('documentation:');
    return docs.find((doc: any) => doc.slug === slug);
  },

  async createDocumentation(data: any) {
    const id = `documentation:${data.module}:${data.slug}`;
    await kvSet(id, { ...data, id, createdAt: new Date().toISOString() });
    return { success: true, id };
  },

  async updateDocumentation(id: string, data: any) {
    const existing = await kvGet(id);
    if (!existing) throw new Error('Documentation not found');
    await kvSet(id, { ...existing, ...data, updatedAt: new Date().toISOString() });
    return { success: true };
  },

  async deleteDocumentation(id: string) {
    await kvDel(id);
    return { success: true };
  },

  // Prospective Customers
  async getProspectiveCustomers() {
    return await kvGetByPrefix('prospective_customer:');
  },
  
  async createProspectiveCustomer(data: any) {
    const id = `prospective_customer:${Date.now()}`;
    // Ensure customer name is always uppercase
    const normalizedData = {
      ...data,
      customerName: data.customerName ? data.customerName.toUpperCase() : data.customerName
    };
    await kvSet(id, { ...normalizedData, id, createdAt: new Date().toISOString() });
    return { success: true, id };
  },

  async updateProspectiveCustomer(id: string, data: any) {
    const existing = await kvGet(id);
    if (!existing) throw new Error('Not found');
    // Ensure customer name is always uppercase
    const normalizedData = {
      ...data,
      customerName: data.customerName ? data.customerName.toUpperCase() : data.customerName
    };
    await kvSet(id, { ...normalizedData, id, createdAt: existing.createdAt });
    return { success: true };
  },
  
  async deleteProspectiveCustomer(id: string) {
    await kvDel(id);
    return { success: true };
  },

  // Lead Sources
  async getLeadSources() {
    return await kvGetByPrefix('lead_source:');
  },
  
  async createLeadSource(data: any) {
    const id = `lead_source:${Date.now()}`;
    await kvSet(id, { ...data, id, createdAt: new Date().toISOString() });
    return { success: true, id };
  },

  // Segments
  async getSegments() {
    return await kvGetByPrefix('segment:');
  },

  async createSegment(data: any) {
    const id = `segment:${Date.now()}`;
    await kvSet(id, { ...data, id, createdAt: new Date().toISOString() });
    return { success: true, id };
  },

  async updateSegment(id: string, data: any) {
    const existing = await kvGet(id);
    if (!existing) throw new Error('Segment not found');
    await kvSet(id, { ...existing, ...data, updatedAt: new Date().toISOString() });
    return { success: true };
  },

  async deleteSegment(id: string) {
    await kvDel(id);
    return { success: true };
  },

  // Product Types
  async getProductTypes() {
    const allTypes = await kvGetByPrefix('product_type:');
    // Filter out soft-deleted items (where deleted_at is not null)
    return allTypes.filter((type: any) => !type.deleted_at);
  },

  async createProductType(data: any) {
    const id = `product_type:${Date.now()}`;
    await kvSet(id, {
      ...data,
      id,
      createdAt: new Date().toISOString(),
      deleted_at: null
    });
    return { success: true, id };
  },

  async updateProductType(id: string, data: any) {
    const existing = await kvGet(id);
    if (!existing) throw new Error('Product type not found');
    await kvSet(id, { ...existing, ...data, updatedAt: new Date().toISOString() });
    return { success: true };
  },

  async deleteProductType(id: string) {
    // Soft delete: set deleted_at timestamp instead of hard delete
    const existing = await kvGet(id);
    if (!existing) throw new Error('Product type not found');
    await kvSet(id, { ...existing, deleted_at: new Date().toISOString() });
    return { success: true };
  },

  // Price Formulas - 4 Separate Types

  // 1. Formula Harga Polos
  async getPriceFormulasPolos() {
    return await kvGetByPrefix('price_formula_polos:');
  },

  async createPriceFormulaPolos(data: any) {
    const id = `price_formula_polos:${Date.now()}`;
    // labelKode di-generate di frontend dengan format: FP-YYYY-NNNN
    await kvSet(id, { ...data, id, type: 'polos', createdAt: new Date().toISOString() });
    return { success: true, id };
  },

  async updatePriceFormulaPolos(id: string, data: any) {
    const existing = await kvGet(id);
    if (!existing) throw new Error('Price formula polos not found');
    await kvSet(id, { ...existing, ...data, updatedAt: new Date().toISOString() });
    return { success: true };
  },

  async deletePriceFormulaPolos(id: string) {
    await kvDel(id);
    return { success: true };
  },

  // 2. Formula Harga Offset
  async getPriceFormulasOffset() {
    return await kvGetByPrefix('price_formula_offset:');
  },

  async createPriceFormulaOffset(data: any) {
    const id = `price_formula_offset:${Date.now()}`;
    // labelKode di-generate di frontend dengan format: FF-YYYY-NNNN (Formula Flexibel)
    await kvSet(id, { ...data, id, type: 'flexibel', createdAt: new Date().toISOString() });
    return { success: true, id };
  },

  async updatePriceFormulaOffset(id: string, data: any) {
    const existing = await kvGet(id);
    if (!existing) throw new Error('Price formula offset not found');
    await kvSet(id, { ...existing, ...data, updatedAt: new Date().toISOString() });
    return { success: true };
  },

  async deletePriceFormulaOffset(id: string) {
    await kvDel(id);
    return { success: true };
  },

  // 3. Formula Harga Boks
  async getPriceFormulasBoks() {
    return await kvGetByPrefix('price_formula_boks:');
  },

  async createPriceFormulaBoks(data: any) {
    const id = `price_formula_boks:${Date.now()}`;
    // labelKode di-generate di frontend dengan format: FB-YYYY-NNNN (Formula Boks)
    await kvSet(id, { ...data, id, type: 'boks', createdAt: new Date().toISOString() });
    return { success: true, id };
  },

  async updatePriceFormulaBoks(id: string, data: any) {
    const existing = await kvGet(id);
    if (!existing) throw new Error('Price formula boks not found');
    await kvSet(id, { ...existing, ...data, updatedAt: new Date().toISOString() });
    return { success: true };
  },

  async deletePriceFormulaBoks(id: string) {
    await kvDel(id);
    return { success: true };
  },

  // 4. Formula Harga Roto
  async getPriceFormulasRoto() {
    return await kvGetByPrefix('price_formula_roto:');
  },

  async createPriceFormulaRoto(data: any) {
    const id = `price_formula_roto:${Date.now()}`;
    // labelKode di-generate di frontend dengan format: FR-YYYY-NNNN (Formula Roto)
    await kvSet(id, { ...data, id, type: 'roto', createdAt: new Date().toISOString() });
    return { success: true, id };
  },

  async updatePriceFormulaRoto(id: string, data: any) {
    const existing = await kvGet(id);
    if (!existing) throw new Error('Price formula roto not found');
    await kvSet(id, { ...existing, ...data, updatedAt: new Date().toISOString() });
    return { success: true };
  },

  async deletePriceFormulaRoto(id: string) {
    await kvDel(id);
    return { success: true };
  },

  // Legacy: Get all price formulas (combined from all 4 types)
  async getPriceFormulas() {
    const polos = await this.getPriceFormulasPolos();
    const offset = await this.getPriceFormulasOffset();
    const boks = await this.getPriceFormulasBoks();
    const roto = await this.getPriceFormulasRoto();
    return [...polos, ...offset, ...boks, ...roto];
  },

  async createPriceFormula(data: any) {
    const type = data.type || 'polos';

    switch(type) {
      case 'polos':
        return await this.createPriceFormulaPolos(data);
      case 'flexibel':
      case 'offset':
        return await this.createPriceFormulaOffset(data);
      case 'boks':
        return await this.createPriceFormulaBoks(data);
      case 'roto':
        return await this.createPriceFormulaRoto(data);
      default:
        return await this.createPriceFormulaPolos(data);
    }
  },

  async updatePriceFormula(id: string, data: any) {
    // Determine type from id prefix
    if (id.startsWith('price_formula_polos:')) {
      return await this.updatePriceFormulaPolos(id, data);
    } else if (id.startsWith('price_formula_offset:')) {
      return await this.updatePriceFormulaOffset(id, data);
    } else if (id.startsWith('price_formula_boks:')) {
      return await this.updatePriceFormulaBoks(id, data);
    } else if (id.startsWith('price_formula_roto:')) {
      return await this.updatePriceFormulaRoto(id, data);
    }
    throw new Error('Unknown price formula type');
  },

  async deletePriceFormula(id: string) {
    // Determine type from id prefix
    if (id.startsWith('price_formula_polos:')) {
      return await this.deletePriceFormulaPolos(id);
    } else if (id.startsWith('price_formula_offset:')) {
      return await this.deletePriceFormulaOffset(id);
    } else if (id.startsWith('price_formula_boks:')) {
      return await this.deletePriceFormulaBoks(id);
    } else if (id.startsWith('price_formula_roto:')) {
      return await this.deletePriceFormulaRoto(id);
    }
    throw new Error('Unknown price formula type');
  },

  // Customers
  async getCustomers() {
    return await kvGetByPrefix('customer:');
  },
  
  async createCustomer(data: any) {
    const id = `customer:${Date.now()}`;
    // Ensure customer name is always uppercase
    const normalizedData = {
      ...data,
      customerName: data.customerName ? data.customerName.toUpperCase() : data.customerName
    };
    await kvSet(id, { ...normalizedData, id, createdAt: new Date().toISOString() });
    return { success: true, id };
  },

  async updateCustomer(id: string, data: any) {
    const existing = await kvGet(id);
    if (!existing) throw new Error('Customer not found');
    // Ensure customer name is always uppercase
    const normalizedData = {
      ...data,
      customerName: data.customerName ? data.customerName.toUpperCase() : data.customerName
    };
    await kvSet(id, { ...existing, ...normalizedData, updatedAt: new Date().toISOString() });
    return { success: true };
  },

  // Barangs (Custom Products)
  async getBarangs() {
    return await kvGetByPrefix('barang_custom:');
  },
  
  async createBarang(data: any) {
    const id = `barang_custom:${Date.now()}`;
    await kvSet(id, { ...data, id, createdAt: new Date().toISOString() });
    return { success: true, id };
  },

  async updateBarang(id: string, data: any) {
    const existing = await kvGet(id);
    await kvSet(id, { ...existing, ...data, updatedAt: new Date().toISOString() });
    return { success: true };
  },

  async deleteBarang(id: string) {
    await kvDel(id);
    return { success: true };
  },

  // Sync customer data to all related pipelines
  async syncCustomerToPipelines(customerId: string, customerData: any) {
    try {
      const pipelines = await this.getPipelines();

      // Find all pipelines linked to this customer
      const relatedPipelines = pipelines.filter(
        (p: any) => p.customerId === customerId
      );

      console.log(`🔄 Syncing customer to ${relatedPipelines.length} pipelines...`);

      // Update each pipeline with latest customer data
      for (const pipeline of relatedPipelines) {
        const updatedPipeline = {
          ...pipeline,
          customer: customerData.customerName ? customerData.customerName.toUpperCase() : customerData.customerName,
          alamat: customerData.billingAddress?.fullAddress || customerData.billingAddress?.city || pipeline.alamat,
          nomorTelepon: customerData.companyPhone || customerData.contacts?.[0]?.phone || pipeline.nomorTelepon,
          // Update other relevant fields
          lastSyncedAt: new Date().toISOString()
        };

        await kvSet(pipeline.id, updatedPipeline);
        console.log(`✅ Synced pipeline ${pipeline.id}`);
      }

      return { success: true, syncedCount: relatedPipelines.length };
    } catch (error) {
      console.error('❌ Error syncing customer to pipelines:', error);
      throw error;
    }
  },

  // Regions (Wilayah)
  async getRegions() {
    return await kvGetByPrefix('region:');
  },

  async createRegion(data: any) {
    const id = `region:${Date.now()}`;
    await kvSet(id, { ...data, id, createdAt: new Date().toISOString() });
    return { success: true, id };
  },

  async updateRegion(id: string, data: any) {
    const existing = await kvGet(id);
    if (!existing) throw new Error('Region not found');
    await kvSet(id, { ...existing, ...data, updatedAt: new Date().toISOString() });
    return { success: true };
  },

  async deleteRegion(id: string) {
    await kvDel(id);
    return { success: true };
  },

  // Pipelines
  async getPipelines() {
    return await kvGetByPrefix('pipeline:');
  },
  
  async createPipeline(data: any) {
    const id = `pipeline:${Date.now()}`;
    // Ensure customer name is always uppercase
    const normalizedData = {
      ...data,
      customer: data.customer ? data.customer.toUpperCase() : data.customer
    };
    await kvSet(id, { ...normalizedData, id, createdAt: new Date().toISOString() });
    return { success: true, id };
  },

  async updatePipeline(id: string, data: any) {
    const existing = await kvGet(id);
    if (!existing) throw new Error('Pipeline not found');
    // Ensure customer name is always uppercase
    const normalizedData = {
      ...data,
      customer: data.customer ? data.customer.toUpperCase() : data.customer
    };
    await kvSet(id, { ...existing, ...normalizedData });
    return { success: true };
  },

  async deletePipeline(id: string) {
    await kvDel(id);
    return { success: true };
  },

  // Pipeline Follow-ups
  async getPipelineFollowUps() {
    return await kvGetByPrefix('pipeline_followup:');
  },

  async createPipelineFollowUp(data: any) {
    const id = `pipeline_followup:${Date.now()}`;
    await kvSet(id, { ...data, id, createdAt: new Date().toISOString() });
    return { success: true, id };
  },

  async updatePipelineFollowUp(id: string, data: any) {
    const existing = await kvGet(id);
    if (!existing) throw new Error('Follow-up not found');
    await kvSet(id, { ...existing, ...data });
    return { success: true };
  },

  async deletePipelineFollowUp(id: string) {
    await kvDel(id);
    return { success: true };
  },

  // Pipeline Log Histori
  async getPipelineLogs(pipelineId: string) {
    const allLogs = await kvGetByPrefix('pipeline_log:');
    return allLogs.filter((log: any) => log.pipelineId === pipelineId)
      .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },

  async getAllPipelineLogs() {
    return await kvGetByPrefix('pipeline_log:');
  },

  async createPipelineLog(data: any) {
    const id = `pipeline_log:${Date.now()}`;
    await kvSet(id, { ...data, id, createdAt: new Date().toISOString() });
    return { success: true, id };
  },

  // Sales Activities
  async getSalesActivities() {
    return await kvGetByPrefix('sales_activity:');
  },

  async createSalesActivity(data: any) {
    const id = `sales_activity:${Date.now()}`;
    await kvSet(id, { ...data, id, createdAt: new Date().toISOString() });
    return { success: true, id };
  },

  async updateSalesActivity(id: string, data: any) {
    const existing = await kvGet(id);
    if (!existing) throw new Error('Sales activity not found');
    await kvSet(id, { ...existing, ...data });
    return { success: true };
  },

  async deleteSalesActivity(id: string) {
    await kvDel(id);
    return { success: true };
  },

  // Custom Items
  async getCustomItems() {
    return await kvGetByPrefix('custom_item:');
  },

  async createCustomItem(data: any) {
    const id = `custom_item:${Date.now()}`;
    await kvSet(id, { ...data, id, createdAt: new Date().toISOString() });
    return { success: true, id };
  },

  async updateCustomItem(id: string, data: any) {
    const existing = await kvGet(id);
    if (!existing) throw new Error('Custom item not found');
    await kvSet(id, { ...existing, ...data, updatedAt: new Date().toISOString() });
    return { success: true };
  },

  async deleteCustomItem(id: string) {
    await kvDel(id);
    return { success: true };
  },

  // Quotations
  async getQuotations() {
    return await kvGetByPrefix('quotation:');
  },

  async createQuotation(data: any) {
    const id = `quotation:${Date.now()}`;
    
    // Generate quotation number with format: SQ.YYYY.MM.NNNNN
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    
    // Get all quotations directly from storage to determine the next sequence number
    const allQuotations = await kvGetByPrefix('quotation:');
    const prefix = `SQ.${year}.${month}.`;
    const quotationsThisMonth = allQuotations.filter((q: any) => 
      q.quotationNumber && q.quotationNumber.startsWith(prefix)
    );
    
    // Find the highest sequence number
    let maxSequence = 0;
    quotationsThisMonth.forEach((q: any) => {
      const parts = q.quotationNumber.split('.');
      if (parts.length === 4) {
        const seq = parseInt(parts[3], 10);
        if (!isNaN(seq) && seq > maxSequence) {
          maxSequence = seq;
        }
      }
    });
    
    const nextSequence = String(maxSequence + 1).padStart(5, '0');
    const quotationNumber = `${prefix}${nextSequence}`;
    
    // Save quotation
    await kvSet(id, {
      ...data,
      id,
      quotationNumber,
      createdAt: new Date().toISOString(),
      status: data.status || 'Draft'
    });
    
    // Save quotation items as separate records
    if (data.items && Array.isArray(data.items)) {
      const timestamp = Date.now();
      for (let i = 0; i < data.items.length; i++) {
        const item = data.items[i];
        const itemId = `quotation_item:${timestamp}_${i}_${Math.random().toString(36).substr(2, 9)}`;
        await kvSet(itemId, {
          ...item,
          id: itemId,
          quotationId: id,
          quotationNumber: quotationNumber,
          itemNumber: i + 1,
          createdAt: new Date().toISOString()
        });
      }
    }
    
    return { success: true, id, quotationNumber };
  },

  async updateQuotation(id: string, data: any) {
    const existing = await kvGet(id);
    if (!existing) throw new Error('Quotation not found');

    // Preserve status and approval fields - they should only be changed through workflow methods
    const preservedFields = {
      status: existing.status,
      submittedBy: existing.submittedBy,
      submittedAt: existing.submittedAt,
      submittedByRole: existing.submittedByRole,
      approvedBy: existing.approvedBy,
      approvedAt: existing.approvedAt,
      rejectedBy: existing.rejectedBy,
      rejectedAt: existing.rejectedAt,
      rejectionReason: existing.rejectionReason,
    };

    // Update quotation
    await kvSet(id, { ...existing, ...data, ...preservedFields });
    
    // Delete old quotation items
    const allItems = await this.getQuotationItems();
    const oldItems = allItems.filter((item: any) => item.quotationId === id);
    for (const oldItem of oldItems) {
      await kvDel(oldItem.id);
    }
    
    // Save new quotation items as separate records
    if (data.items && Array.isArray(data.items)) {
      const timestamp = Date.now();
      for (let i = 0; i < data.items.length; i++) {
        const item = data.items[i];
        const itemId = `quotation_item:${timestamp}_${i}_${Math.random().toString(36).substr(2, 9)}`;
        await kvSet(itemId, {
          ...item,
          id: itemId,
          quotationId: id,
          quotationNumber: existing.quotationNumber,
          itemNumber: i + 1,
          createdAt: new Date().toISOString()
        });
      }
    }
    
    return { success: true };
  },

  async deleteQuotation(id: string) {
    // Delete quotation items first
    const allItems = await this.getQuotationItems();
    const quotationItems = allItems.filter((item: any) => item.quotationId === id);
    for (const item of quotationItems) {
      await kvDel(item.id);
    }
    
    // Delete quotation
    await kvDel(id);
    return { success: true };
  },

  async getQuotationItems() {
    return await kvGetByPrefix('quotation_item:');
  },

  async getQuotationItemsByQuotationId(quotationId: string) {
    const allItems = await this.getQuotationItems();
    return allItems.filter((item: any) => item.quotationId === quotationId)
      .sort((a: any, b: any) => (a.itemNumber || 0) - (b.itemNumber || 0));
  },

  async approveQuotation(id: string, approvalData: { approvedBy: string; approvedAt: string }) {
    const existing = await kvGet(id);
    if (!existing) throw new Error('Quotation not found');

    await kvSet(id, {
      ...existing,
      status: 'Approved',
      approvedBy: approvalData.approvedBy,
      approvedAt: approvalData.approvedAt,
    });

    return { success: true };
  },

  async rejectQuotation(id: string, rejectionData: { rejectedBy: string; rejectedAt: string; rejectionReason: string }) {
    const existing = await kvGet(id);
    if (!existing) throw new Error('Quotation not found');

    await kvSet(id, {
      ...existing,
      status: 'Rejected',
      rejectedBy: rejectionData.rejectedBy,
      rejectedAt: rejectionData.rejectedAt,
      rejectionReason: rejectionData.rejectionReason,
    });

    return { success: true };
  },

  async submitQuotationForApproval(id: string, submissionData: { submittedBy: string; submittedAt: string; submittedByRole: string }) {
    const existing = await kvGet(id);
    if (!existing) throw new Error('Quotation not found');

    await kvSet(id, {
      ...existing,
      status: 'Pending',
      submittedBy: submissionData.submittedBy,
      submittedAt: submissionData.submittedAt,
      submittedByRole: submissionData.submittedByRole,
    });

    return { success: true };
  },

  async acceptQuotation(id: string, acceptData: { acceptedBy: string; acceptedAt: string }) {
    const existing = await kvGet(id);
    if (!existing) throw new Error('Quotation not found');

    await kvSet(id, {
      ...existing,
      status: 'Accept',
      acceptedBy: acceptData.acceptedBy,
      acceptedAt: acceptData.acceptedAt,
    });

    return { success: true };
  },

  async sendQuotationWithPO(id: string, sentData: { sentBy: string; sentAt: string; nomorPO: string }) {
    const existing = await kvGet(id);
    if (!existing) throw new Error('Quotation not found');

    await kvSet(id, {
      ...existing,
      status: 'Sent',
      sentBy: sentData.sentBy,
      sentAt: sentData.sentAt,
      nomorPO: sentData.nomorPO,
    });

    return { success: true };
  },

  async createQuotationItem(data: any) {
    const id = `quotation_item:${Date.now()}`;
    await kvSet(id, {
      ...data,
      id,
      createdAt: new Date().toISOString()
    });
    return { success: true, id };
  },

  async updateQuotationItem(id: string, data: any) {
    const existing = await kvGet(id);
    if (!existing) throw new Error('Quotation item not found');
    await kvSet(id, { ...existing, ...data });
    return { success: true };
  },

  async deleteQuotationItem(id: string) {
    await kvDel(id);
    return { success: true };
  },

  // Sales Orders
  async getSalesOrders() {
    let orders = await kvGetByPrefix('sales_order:');

    // Seed data if empty
    if (orders.length === 0) {
      const seedData = [
        {
          orderNumber: 'SO-001',
          orderDate: '2026-04-10',
          customerName: 'PT Unilever Indonesia',
          salesPerson: 'Budi Santoso',
          totalAmount: 125000000,
          notes: 'Pesanan untuk kemasan sabun lifebuoy',
          itemQty: 3,
          status: 'Completed'
        },
        {
          orderNumber: 'SO-002',
          orderDate: '2026-04-11',
          customerName: 'PT Indofood CBP',
          salesPerson: 'Siti Nurhaliza',
          totalAmount: 87500000,
          notes: 'Kemasan untuk produk indomie',
          itemQty: 2,
          status: 'On Progress'
        },
        {
          orderNumber: 'SO-003',
          orderDate: '2026-04-11',
          customerName: 'PT Mayora Indah',
          salesPerson: 'Ahmad Rifai',
          totalAmount: 65000000,
          notes: 'Packaging untuk biskuit roma',
          itemQty: 4,
          status: 'Preparing'
        },
        {
          orderNumber: 'SO-004',
          orderDate: '2026-04-12',
          customerName: 'PT Wings Group',
          salesPerson: 'Dewi Lestari',
          totalAmount: 98000000,
          notes: 'Kemasan detergen so klin',
          itemQty: 3,
          status: 'On Progress'
        },
        {
          orderNumber: 'SO-005',
          orderDate: '2026-04-12',
          customerName: 'PT Nestle Indonesia',
          salesPerson: 'Budi Santoso',
          totalAmount: 110000000,
          notes: 'Packaging untuk produk milo',
          itemQty: 2,
          status: 'Completed'
        },
        {
          orderNumber: 'SO-006',
          orderDate: '2026-04-12',
          customerName: 'PT Frisian Flag',
          salesPerson: 'Siti Nurhaliza',
          totalAmount: 145000000,
          notes: 'Kemasan susu UHT',
          itemQty: 5,
          status: 'Preparing'
        },
        {
          orderNumber: 'SO-007',
          orderDate: '2026-04-13',
          customerName: 'PT Garudafood',
          salesPerson: 'Ahmad Rifai',
          totalAmount: 72000000,
          notes: 'Packaging untuk kacang garuda',
          itemQty: 3,
          status: 'Draft'
        },
        {
          orderNumber: 'SO-008',
          orderDate: '2026-04-13',
          customerName: 'PT ABC President',
          salesPerson: 'Dewi Lestari',
          totalAmount: 95000000,
          notes: 'Kemasan kecap ABC',
          itemQty: 2,
          status: 'On Progress'
        },
      ];

      for (const data of seedData) {
        await this.createSalesOrder(data);
      }

      orders = await kvGetByPrefix('sales_order:');
    }

    return orders;
  },
  
  async createSalesOrder(data: any) {
    const id = `sales_order:${Date.now()}`;
    await kvSet(id, {
      ...data,
      id,
      orderNumber: `SO-${Date.now()}`,
      createdAt: new Date().toISOString(),
      status: 'Draft'
    });
    return { success: true, id };
  },

  // Delivery Notes
  async getDeliveryNotes() {
    return await kvGetByPrefix('delivery_note:');
  },
  
  async createDeliveryNote(data: any) {
    const id = `delivery_note:${Date.now()}`;
    await kvSet(id, {
      ...data,
      id,
      noteNumber: `DN-${Date.now()}`,
      createdAt: new Date().toISOString()
    });
    return { success: true, id };
  },

  // Design Requests
  async getDesignRequests() {
    return await kvGetByPrefix('design_request:');
  },
  
  async createDesignRequest(data: any) {
    const id = `design_request:${Date.now()}`;
    await kvSet(id, {
      ...data,
      id,
      requestNumber: `DR-${Date.now()}`,
      createdAt: new Date().toISOString(),
      status: 'On Progress'
    });
    return { success: true, id };
  },

  // Production Plans
  async getProductionPlans() {
    return await kvGetByPrefix('production_plan:');
  },
  
  async createProductionPlan(data: any) {
    const id = `production_plan:${Date.now()}`;
    await kvSet(id, {
      ...data,
      id,
      planNumber: `PP-${Date.now()}`,
      createdAt: new Date().toISOString(),
      status: 'Planned'
    });
    return { success: true, id };
  },

  // Production Realizations
  async getProductionRealizations() {
    return await kvGetByPrefix('production_realization:');
  },
  
  async createProductionRealization(data: any) {
    const id = `production_realization:${Date.now()}`;
    await kvSet(id, {
      ...data,
      id,
      createdAt: new Date().toISOString()
    });
    return { success: true, id };
  },

  // Machines
  async getMachines() {
    return await kvGetByPrefix('machine:');
  },
  
  async createMachine(data: any) {
    const id = `machine:${Date.now()}`;
    await kvSet(id, {
      ...data,
      id,
      createdAt: new Date().toISOString(),
      status: 'Active'
    });
    return { success: true, id };
  },

  // Items
  async getItems() {
    return await kvGetByPrefix('item:');
  },
  
  async createItem(data: any) {
    const id = `item:${Date.now()}`;
    await kvSet(id, {
      ...data,
      id,
      itemCode: `ITM-${Date.now()}`,
      createdAt: new Date().toISOString()
    });
    return { success: true, id };
  },

  // Stock Movements
  async getStockMovements() {
    return await kvGetByPrefix('stock_movement:');
  },
  
  async createStockMovement(data: any) {
    const id = `stock_movement:${Date.now()}`;
    await kvSet(id, {
      ...data,
      id,
      createdAt: new Date().toISOString()
    });
    return { success: true, id };
  },

  // Employees
  async getEmployees() {
    return await kvGetByPrefix('employee:');
  },
  
  async createEmployee(data: any) {
    const id = `employee:${Date.now()}`;
    await kvSet(id, {
      ...data,
      id,
      employee_code: data.employee_code || `EMP-${Date.now()}`,
      created_at: new Date().toISOString(),
    });
    return { success: true, id };
  },

  async updateEmployee(id: string, data: any) {
    const existing = await kvGet(id);
    if (!existing) {
      throw new Error('Employee not found');
    }
    await kvSet(id, {
      ...existing,
      ...data,
      id,
      updated_at: new Date().toISOString(),
    });
    return { success: true, id };
  },

  // Divisions
  async getDivisions() {
    return await kvGetByPrefix('division:');
  },
  
  async createDivision(data: any) {
    const id = `division:${Date.now()}`;
    await kvSet(id, { ...data, id, createdAt: new Date().toISOString() });
    return { success: true, id };
  },

  // Companies
  async getCompanies() {
    return await kvGetByPrefix('company:');
  },
  
  async createCompany(data: any) {
    const id = `company:${data.code || Date.now()}`;
    await kvSet(id, { ...data, id, createdAt: new Date().toISOString() });
    return { success: true, id };
  },

  // Departments
  async getDepartments() {
    return await kvGetByPrefix('department:');
  },
  
  async createDepartment(data: any) {
    const id = `department:${data.code || Date.now()}`;
    await kvSet(id, { ...data, id, createdAt: new Date().toISOString() });
    return { success: true, id };
  },

  // Positions
  async getPositions() {
    return await kvGetByPrefix('position:');
  },
  
  async createPosition(data: any) {
    const id = `position:${data.code || Date.now()}`;
    await kvSet(id, { ...data, id, createdAt: new Date().toISOString() });
    return { success: true, id };
  },

  async updatePosition(id: string, data: any) {
    const existing = await kvGet(id);
    if (!existing) throw new Error('Position not found');
    await kvSet(id, { ...existing, ...data, updatedAt: new Date().toISOString() });
    return { success: true };
  },

  async deletePosition(id: string) {
    await kvDel(id);
    return { success: true };
  },

  // Suppliers
  async getSuppliers() {
    return await kvGetByPrefix('supplier:');
  },
  
  async createSupplier(data: any) {
    const id = `supplier:${Date.now()}`;
    await kvSet(id, {
      ...data,
      id,
      supplierCode: `SUP-${Date.now()}`,
      createdAt: new Date().toISOString(),
      status: 'Active'
    });
    return { success: true, id };
  },

  // Purchase Orders
  async getPurchaseOrders() {
    return await kvGetByPrefix('purchase_order:');
  },
  
  async createPurchaseOrder(data: any) {
    const id = `purchase_order:${Date.now()}`;
    await kvSet(id, {
      ...data,
      id,
      poNumber: `PO-${Date.now()}`,
      createdAt: new Date().toISOString(),
      status: 'Draft'
    });
    return { success: true, id };
  },

  // Generic operations
  async update(id: string, data: any) {
    const existing = await kvGet(id);
    if (!existing) throw new Error('Not found');
    await kvSet(id, { ...existing, ...data, updatedAt: new Date().toISOString() });
    return { success: true };
  },

  async delete(id: string) {
    console.log('🗑️ API delete called for id:', id);
    try {
      await kvDel(id);
      console.log('✅ Delete completed successfully for id:', id);
      return { success: true };
    } catch (error) {
      console.error('❌ Delete failed for id:', id, error);
      throw error;
    }
  },

  // Legacy compatibility
  async get(endpoint: string) {
    // Map old endpoint calls to new methods
    if (endpoint === 'prospective-customers') return { success: true, data: await this.getProspectiveCustomers() };
    if (endpoint === 'lead-sources') return { success: true, data: await this.getLeadSources() };
    if (endpoint === 'segments') return { success: true, data: await this.getSegments() };
    if (endpoint === 'product-types') return { success: true, data: await this.getProductTypes() };
    if (endpoint === 'regions') return { success: true, data: await this.getRegions() };
    if (endpoint === 'customers') return { success: true, data: await this.getCustomers() };
    if (endpoint === 'pipelines') return { success: true, data: await this.getPipelines() };
    if (endpoint === 'sales-orders') return { success: true, data: await this.getSalesOrders() };
    if (endpoint === 'delivery-notes') return { success: true, data: await this.getDeliveryNotes() };
    if (endpoint === 'design-requests') return { success: true, data: await this.getDesignRequests() };
    if (endpoint === 'production-plans') return { success: true, data: await this.getProductionPlans() };
    if (endpoint === 'production-realizations') return { success: true, data: await this.getProductionRealizations() };
    if (endpoint === 'machines') return { success: true, data: await this.getMachines() };
    if (endpoint === 'items') return { success: true, data: await this.getItems() };
    if (endpoint === 'stock-movements') return { success: true, data: await this.getStockMovements() };
    if (endpoint === 'employees') return { success: true, data: await this.getEmployees() };
    if (endpoint === 'divisions') return { success: true, data: await this.getDivisions() };
    if (endpoint === 'companies') return await this.getCompanies();
    if (endpoint === 'departments') return await this.getDepartments();
    if (endpoint === 'positions') return await this.getPositions();
    if (endpoint === 'suppliers') return { success: true, data: await this.getSuppliers() };
    if (endpoint === 'purchase-orders') return { success: true, data: await this.getPurchaseOrders() };
    return { success: false, data: [] };
  },

  async post(endpoint: string, body: any) {
    // Map old endpoint calls to new methods
    if (endpoint === 'prospective-customers') return await this.createProspectiveCustomer(body);
    if (endpoint === 'lead-sources') return await this.createLeadSource(body);
    if (endpoint === 'segments') return await this.createSegment(body);
    if (endpoint === 'product-types') return await this.createProductType(body);
    if (endpoint === 'regions') return await this.createRegion(body);
    if (endpoint === 'customers') return await this.createCustomer(body);
    if (endpoint === 'pipelines') return await this.createPipeline(body);
    if (endpoint === 'sales-orders') return await this.createSalesOrder(body);
    if (endpoint === 'delivery-notes') return await this.createDeliveryNote(body);
    if (endpoint === 'design-requests') return await this.createDesignRequest(body);
    if (endpoint === 'production-plans') return await this.createProductionPlan(body);
    if (endpoint === 'production-realizations') return await this.createProductionRealization(body);
    if (endpoint === 'machines') return await this.createMachine(body);
    if (endpoint === 'items') return await this.createItem(body);
    if (endpoint === 'stock-movements') return await this.createStockMovement(body);
    if (endpoint === 'employees') return await this.createEmployee(body);
    if (endpoint === 'divisions') return await this.createDivision(body);
    if (endpoint === 'companies') return await this.createCompany(body);
    if (endpoint === 'departments') return await this.createDepartment(body);
    if (endpoint === 'positions') return await this.createPosition(body);
    if (endpoint === 'suppliers') return await this.createSupplier(body);
    if (endpoint === 'purchase-orders') return await this.createPurchaseOrder(body);
    return { success: false };
  },

  async put(endpoint: string, body: any) {
    const id = endpoint.split('/').pop();
    if (!id) return { success: false };
    return await this.update(id, body);
  },

  // KV Store direct access (for system status page)
  async getKV(key: string) {
    return await kvGet(key);
  },

  async setKV(key: string, value: any) {
    return await kvSet(key, value);
  },

  async deleteKV(key: string) {
    return await kvDel(key);
  },

  // ========================================
  // SIMPLE LOGIN SYSTEM (No Supabase Auth)
  // ========================================

  // Get all users
  async getSimpleUsers() {
    const users = await kvGetByPrefix('user:');
    // Don't return passwords in list
    return users.map((u: any) => ({
      id: u.id,
      username: u.username,
      email: u.email,
      nama_user: u.nama_user,
      employee_id: u.employee_id,
      role: u.role,
      is_active: u.is_active,
      created_at: u.created_at,
      updated_at: u.updated_at
    }));
  },

  // Create new user
  async createSimpleUser(data: {
    username: string;
    email: string;
    password: string;
    nama_user: string;
    employee_id?: string;
    role?: string;
  }) {
    // Check duplicate username or email
    const users = await kvGetByPrefix('user:');
    const existingUser = users.find((u: any) =>
      u.username === data.username || u.email === data.email
    );

    if (existingUser) {
      throw new Error('Username atau email sudah digunakan');
    }

    const id = `user:${Date.now()}`;
    const userData = {
      id,
      username: data.username,
      email: data.email,
      password: data.password, // Plain text - NOT ENCRYPTED
      nama_user: data.nama_user,
      employee_id: data.employee_id || null,
      role: data.role || 'staff',
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    await kvSet(id, userData);
    return { success: true, id };
  },

  // Login validation
  async simpleLogin(identifier: string, password: string) {
    try {
      const users = await kvGetByPrefix('user:');
      const user = users.find((u: any) =>
        (u.username.toLowerCase() === identifier.toLowerCase() || u.email.toLowerCase() === identifier.toLowerCase()) &&
        u.password === password &&
        u.is_active === true
      );

      if (!user) {
        return { success: false, error: 'Username atau password salah' };
      }

      // Fetch employee data if linked
      let employeeData = null;
      if (user.employee_id) {
        try {
          employeeData = await kvGet(user.employee_id);
        } catch (error) {
          console.warn('Employee data not found:', user.employee_id);
        }
      }

      return {
        success: true,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          nama_user: user.nama_user,
          employee_id: user.employee_id,
          role: (user.role || '').trim(), // Trim role to avoid whitespace issues
          employee_code: employeeData?.employee_code,
          full_name: employeeData?.full_name
        }
      };
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: 'Terjadi kesalahan saat login' };
    }
  },

  // Update user
  async updateSimpleUser(id: string, data: any) {
    const existing = await kvGet(id);
    if (!existing) throw new Error('User not found');

    // Check duplicate username/email if changed
    if (data.username || data.email) {
      const users = await kvGetByPrefix('user:');
      const duplicateUser = users.find((u: any) =>
        u.id !== id &&
        ((data.username && u.username === data.username) ||
          (data.email && u.email === data.email))
      );

      if (duplicateUser) {
        throw new Error('Username atau email sudah digunakan');
      }
    }

    await kvSet(id, {
      ...existing,
      ...data,
      updated_at: new Date().toISOString()
    });

    return { success: true };
  },

  // Soft delete user
  async deleteSimpleUser(id: string) {
    const existing = await kvGet(id);
    if (!existing) throw new Error('User not found');

    await kvSet(id, {
      ...existing,
      is_active: false,
      updated_at: new Date().toISOString()
    });

    return { success: true };
  },

  // Seed default admin user
  async seedDefaultAdmin() {
    try {
      const users = await kvGetByPrefix('user:');
      const adminExists = users.some((u: any) => u.username === 'admin');

      if (!adminExists) {
        const adminUser = {
          id: 'user:admin',
          username: 'admin',
          email: 'admin@erp.com',
          password: 'admin123',
          nama_user: 'Administrator',
          employee_id: null,
          role: 'super-admin',
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };

        await kvSet('user:admin', adminUser);
        console.log('✅ Default admin user created');
        return { success: true, message: 'Admin user created' };
      }

      return { success: true, message: 'Admin user already exists' };
    } catch (error) {
      console.error('Error seeding admin:', error);
      return { success: false, error };
    }
  },

  // Get all users
  async getUsers() {
    try {
      const users = await kvGetByPrefix('user:');
      return users.filter((u: any) => u.is_active !== false); // Filter out inactive users
    } catch (error) {
      console.error('Error fetching users:', error);
      return [];
    }
  },

  // ============================================
  // ROLES & PERMISSIONS API
  // ============================================

  // Get all roles
  async getRoles() {
    try {
      const roles = await kvGetByPrefix('role:');
      return roles.map((role: any) => ({
        id: role.id || `role:${role.name}`,
        ...role
      }));
    } catch (error) {
      console.error('Error fetching roles:', error);
      return [];
    }
  },

  // Get single role by name
  async getRole(roleName: string) {
    try {
      const key = `role:${roleName}`;
      const role = await kvGet(key);
      return role ? { id: key, ...role } : null;
    } catch (error) {
      console.error('Error fetching role:', error);
      return null;
    }
  },

  // Create new role
  async createRole(roleData: any) {
    try {
      const key = `role:${roleData.name}`;
      await kvSet(key, {
        ...roleData,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
      return { success: true };
    } catch (error) {
      console.error('Error creating role:', error);
      throw error;
    }
  },

  // Update role
  async updateRole(roleName: string, roleData: any) {
    try {
      const key = `role:${roleName}`;
      await kvSet(key, {
        ...roleData,
        updated_at: new Date().toISOString()
      });
      return { success: true };
    } catch (error) {
      console.error('Error updating role:', error);
      throw error;
    }
  },

  // Delete role
  async deleteRole(roleName: string) {
    try {
      const key = `role:${roleName}`;
      await kvDel(key);
      return { success: true };
    } catch (error) {
      console.error('Error deleting role:', error);
      throw error;
    }
  },

  // Get all permissions
  async getPermissions() {
    try {
      const permissions = await kvGetByPrefix('permission:');
      return permissions.map((perm: any) => ({
        id: perm.id || `permission:${perm.name}`,
        ...perm
      }));
    } catch (error) {
      console.error('Error fetching permissions:', error);
      return [];
    }
  },

  // Get permissions grouped by module
  async getPermissionsByModule() {
    try {
      const permissions = await this.getPermissions();
      const grouped: Record<string, any[]> = {};

      permissions.forEach((perm: any) => {
        const module = perm.module || 'other';
        if (!grouped[module]) {
          grouped[module] = [];
        }
        grouped[module].push(perm);
      });

      return grouped;
    } catch (error) {
      console.error('Error grouping permissions:', error);
      return {};
    }
  },

  // Create new permission
  async createPermission(permissionData: any) {
    try {
      const key = `permission:${permissionData.name}`;
      await kvSet(key, {
        ...permissionData,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
      return { success: true };
    } catch (error) {
      console.error('Error creating permission:', error);
      throw error;
    }
  },

  // Check if user has permission
  async checkPermission(username: string, permissionName: string): Promise<boolean> {
    try {
      // Get user data
      const userKey = `user:${username}`;
      const userData = await kvGet(userKey);
      if (!userData) return false;

      const userRole = userData.role;
      if (!userRole) return false;

      // Get role data
      const roleKey = `role:${userRole}`;
      const roleData = await kvGet(roleKey);
      if (!roleData) return false;

      // Check if permission exists in role's permissions array
      const permissions = roleData.permissions || [];
      return permissions.includes(permissionName);
    } catch (error) {
      console.error('Error checking permission:', error);
      return false;
    }
  },

  // Get user permissions
  async getUserPermissions(username: string): Promise<string[]> {
    try {
      // Get user data
      const userKey = `user:${username}`;
      const userData = await kvGet(userKey);
      if (!userData) return [];

      const userRole = userData.role;
      if (!userRole) return [];

      // Get role data
      const roleKey = `role:${userRole}`;
      const roleData = await kvGet(roleKey);
      if (!roleData) return [];

      return roleData.permissions || [];
    } catch (error) {
      console.error('Error getting user permissions:', error);
      return [];
    }
  },

  // Assign role to user
  async assignRoleToUser(username: string, roleName: string) {
    try {
      // Get all users and find by username
      const users = await kvGetByPrefix('user:');
      const userData = users.find((u: any) => u.username === username);

      if (!userData) throw new Error('User not found');

      // Trim and clean the role name to avoid whitespace issues
      const cleanedRole = roleName.trim();

      // Update user with new role using their actual ID
      await kvSet(userData.id, {
        ...userData,
        role: cleanedRole,
        updated_at: new Date().toISOString()
      });

      console.log(`✅ Role updated for user ${username}:`, cleanedRole);

      return { success: true };
    } catch (error) {
      console.error('Error assigning role:', error);
      throw error;
    }
  },

  // Database Statistics
  async getDatabaseStats() {
    try {
      const { data, error } = await supabase
        .from(KV_TABLE)
        .select('key, value');

      if (error) {
        console.error('Error fetching database stats:', error);
        return {
          totalRecords: 0,
          collections: [],
          storageSize: 0,
          error: error.message
        };
      }

      if (!data || data.length === 0) {
        return {
          totalRecords: 0,
          collections: [],
          storageSize: 0
        };
      }

      // Group by prefix (collection type)
      const collections: Record<string, { count: number; size: number; keys: string[] }> = {};
      let totalSize = 0;

      data.forEach((row) => {
        const key = row.key;
        const value = row.value;
        const prefix = key.split(':')[0];

        // Calculate approximate size (JSON stringified)
        const itemSize = JSON.stringify(value).length;
        totalSize += itemSize;

        if (!collections[prefix]) {
          collections[prefix] = { count: 0, size: 0, keys: [] };
        }

        collections[prefix].count++;
        collections[prefix].size += itemSize;
        collections[prefix].keys.push(key);
      });

      // Format collections for display
      const collectionsArray = Object.entries(collections).map(([name, stats]) => ({
        name,
        count: stats.count,
        size: stats.size,
        sizeFormatted: this.formatBytes(stats.size),
      })).sort((a, b) => b.count - a.count);

      return {
        totalRecords: data.length,
        collections: collectionsArray,
        storageSize: totalSize,
        storageSizeFormatted: this.formatBytes(totalSize),
      };
    } catch (error) {
      console.error('Error in getDatabaseStats:', error);
      return {
        totalRecords: 0,
        collections: [],
        storageSize: 0,
        error: 'Failed to fetch database statistics'
      };
    }
  },

  formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  },

  // Get all keys from KV store
  async getAllKeys(): Promise<string[]> {
    try {
      const { data, error } = await supabase
        .from(KV_TABLE)
        .select('key');

      if (error) {
        // Graceful degradation for table not found or network errors
        if (error.code === '42P01' || error.code === 'PGRST301' || error.message?.includes('Failed to fetch') || !error.code) {
          return [];
        }
        console.error('❌ getAllKeys error:', error);
        return [];
      }

      return data?.map(d => d.key) || [];
    } catch (error: any) {
      if (error.message?.includes('Failed to fetch') || error.name === 'TypeError') {
        return [];
      }
      console.error('❌ getAllKeys exception:', error);
      return [];
    }
  },

  // Get data by prefix (generic method)
  async getByPrefix(prefix: string): Promise<any[]> {
    return await kvGetByPrefix(prefix + ':');
  },
};