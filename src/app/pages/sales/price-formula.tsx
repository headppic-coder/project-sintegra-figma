import { useState, useEffect } from 'react';
import { Search, RotateCcw, Eye, Check, ChevronsUpDown } from 'lucide-react';
import { PageHeader } from '../../components/page-header';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Card, CardContent } from '../../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { Badge } from '../../components/ui/badge';
import { Textarea } from '../../components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../../components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../../components/ui/dropdown-menu';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '../../components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '../../components/ui/popover';
import { toast } from 'sonner';
import { api } from '../../lib/api';
import { formatDate, cn } from '../../components/ui/utils';
import { useSimpleAuth } from '../../contexts/simple-auth-context';

interface PriceFormula {
  id: string;
  type: string; // polos, flexibel, boks, roto, master
  customer: string;
  namaBarang: string;
  jenisKemasan: string;
  jumlah: number;
  ukuranLebar: number;
  ukuranTinggi: number;
  jmlMata: string;
  bahan: string;
  alas: string;
  ziplock: string;
  layoutLebar: number;
  layoutPanjang: number;
  jmlPotong: number;
  ukuranKertas: string;
  labelKode: string;
  qty: number;
  hpp: number;
  hargaJual: number;
  opsiYangDipilih?: string; // Opsi 1, Opsi 2, Opsi 3
  status: string; // draft, approved, rejected
  catatan: string;
  catatanApprover: string;
  salesPerson: string;
  tanggal: string;
  createdAt: string;
}

interface MasterData {
  id: string;
  kode: string;
  proses: string;
  cost: number;
  keterangan: string;
  category: string; // biaya_proses, bahan, finishing, etc.
  // Fields for 'bahan' category
  kategoriBahan?: string;
  tipeBahan?: string;
  jenisProses?: string;
  kodeBarang?: string;
  namaBarang?: string;
  satuan?: string;
  jumlahStock?: number;
  harga?: number;
}

const JML_MATA_OPTIONS = ['1', '2', '4', '6', '8'];

const BAHAN_OPTIONS = [
  'Papermetal',
  'Paperfoil',
  'Papercpp',
];

// Bahan options khusus untuk tab Polos
const BAHAN_POLOS_OPTIONS = [
  'Alufoil 67mic',
  'Metalize 37mic',
  'Metalize 92mic',
];

const ALAS_OPTIONS = ['Polos', 'Warna', 'Putih'];

const ZIPLOCK_OPTIONS = ['Zipper', 'Non Zipper'];

const UKURAN_KERTAS_OPTIONS = [
  'Tidak ada kertas muat',
  'A4 (21 x 29.7 cm)',
  'A3 (29.7 x 42 cm)',
  'Custom',
];

// Boks specific options
const LAMINASI_OPTIONS = ['Glossy', 'Doff', 'Tanpa Laminasi'];
const WARNA_OPTIONS = ['1 Warna', '2 Warna', '3 Warna', '4 Warna', 'Full Color'];
const MESIN_OPTIONS = ['34', '52', '72', '102'];
const KETERANGAN_WARNA_OPTIONS = ['Standar', 'Khusus'];
const CETAK_2_SISI_OPTIONS = ['Ya', 'Tidak'];
const JENIS_KERTAS_OPTIONS = ['Art Paper', 'Art Carton', 'Ivory', 'Duplex', 'Kraft'];
const GRAMASI_OPTIONS = ['210 gsm', '230 gsm', '260 gsm', '310 gsm'];
const DESAIN_BARU_OPTIONS = ['Ya', 'Tidak'];
const LEM_SAMPING_OPTIONS = ['Dengan Lem', 'Tanpa Lem'];
const YA_TIDAK_OPTIONS = ['Ya', 'Tidak'];

// Roto specific options
const BENTUK_OPTIONS = ['Standing Pouch', 'Flat Pouch', 'Roll', 'Custom'];
const POSISI_OPTIONS = ['Portrait', 'Landscape'];
const MATERIAL_OPTIONS = ['BOPP', 'PET', 'PE', 'LLDPE', 'Metalized PET', 'Aluminum Foil'];
const ROLL_DRY_OPTIONS = ['9 mm', '12 mm', '15 mm', '20 mm'];
const CYLINDER_OPTIONS = ['Tidak include', 'Include', 'Custom'];

export default function PriceFormula() {
  const { user } = useSimpleAuth();
  const [activeTab, setActiveTab] = useState('polos');
  const [formulas, setFormulas] = useState<PriceFormula[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSales, setFilterSales] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [saveModalData, setSaveModalData] = useState({
    labelKode: '',
    salesPerson: '',
    namaCustomer: '',
    namaBarang: '',
    hargaJualPcs: 0,
    opsiYangDipilih: 'Opsi 1',
    catatan: '',
    status: 'draft',
  });
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedFormula, setSelectedFormula] = useState<PriceFormula | null>(null);

  // Master data states
  const [masterData, setMasterData] = useState<MasterData[]>([]);
  const [masterCategory, setMasterCategory] = useState('biaya_proses');
  const [masterSearch, setMasterSearch] = useState('');
  const [showMasterModal, setShowMasterModal] = useState(false);
  const [editingMaster, setEditingMaster] = useState<MasterData | null>(null);
  const [masterFormData, setMasterFormData] = useState({
    kategoriBahan: '',
    tipeBahan: '',
    jenisProses: '',
    kodeBarang: '',
    namaBarang: '',
    satuan: '',
    jumlahStock: 0,
    harga: 0,
    keterangan: '',
  });
  const [productTypes, setProductTypes] = useState<any[]>([]);
  
  // Customer states for combobox
  const [customers, setCustomers] = useState<any[]>([]);
  const [openCustomerCombobox, setOpenCustomerCombobox] = useState(false);
  const [customerSearchValue, setCustomerSearchValue] = useState('');
  
  // Barang states for combobox
  const [barangs, setBarangs] = useState<any[]>([]);
  const [openBarangCombobox, setOpenBarangCombobox] = useState(false);
  const [barangSearchValue, setBarangSearchValue] = useState('');

  // Form data
  const [formData, setFormData] = useState({
    customer: '',
    namaBarang: '',
    jenisKemasan: '',
    jumlah: '',
    ukuranLebar: '',
    ukuranTinggi: '',
    jmlMata: '',
    bahan: '',
    alas: '',
    ziplock: '',
    layoutLebar: '',
    layoutPanjang: '',
    jmlPotong: '',
    ukuranKertas: '',
    // Boks specific
    areaDesainPanjang: '',
    areaDesainLebar: '',
    laminasi: '',
    mata: '',
    warna: '',
    mesin: '',
    keteranganWarna: '',
    cetak2Sisi: '',
    cetak2SisiWarna: '',
    jenisKertas: '',
    gramasi: '',
    kertasManual: '',
    hargaPisau: '',
    desainBaru: '',
    lemSamping: '',
    panjangLem: '',
    hotfoil: '',
    hotfoilPanjang: '',
    hotfoilLebar: '',
    emboss: '',
    embossPanjang: '',
    embossLebar: '',
    spotUV: '',
    spotUVPanjang: '',
    spotUVLebar: '',
    // Roto specific
    bentuk: '',
    toleransiOrder: '',
    up: '',
    pitch: '',
    posisi: '',
    adhesive: '',
    jmlWarna: '',
    ukuranUp: '',
    ukuranPitch: '',
    lebarImage: '',
    rollDry: '',
    lebarBahan: '',
    cylinder: '',
    jmlWarnaCylinder: '',
    jumlahLayer: '1',
    layer1Material: '',
    layer1Micron: '',
    layer1Lebar: '',
    layer1Panjang: '',
    layer2Material: '',
    layer2Micron: '',
    layer2Lebar: '',
    layer2Panjang: '',
    layer3Material: '',
    layer3Micron: '',
    layer3Lebar: '',
    layer3Panjang: '',
    layer4Material: '',
    layer4Micron: '',
    layer4Lebar: '',
    layer4Panjang: '',
  });

  // Summary/Ringkasan
  const [summary, setSummary] = useState({
    produk: '',
    ukuran: '',
    kertas: '',
    hargaPM: 0,
    hargaPF: 0,
    jumlah: 0,
  });

  // Hasil Perhitungan (for Polos)
  const [hasilPerhitungan, setHasilPerhitungan] = useState({
    hppPerPcs: 0,
    totalCost: 0,
    qty: 0,
    opsi1: { perPcs: 0, ppn: 0, total: 0 },
    opsi2: { perPcs: 0, ppn: 0, total: 0 },
    opsi3: { perPcs: 0, ppn: 0, total: 0 },
  });

  useEffect(() => {
    fetchFormulas();
    fetchProductTypes();
    fetchCustomers();
    fetchBarangs();
  }, [activeTab]);

  const fetchProductTypes = async () => {
    try {
      const types = await api.getProductTypes();
      setProductTypes(types || []);
    } catch (error) {
      console.error('Error fetching product types:', error);
    }
  };

  const fetchCustomers = async () => {
    try {
      const result = await api.getCustomers();
      setCustomers(result || []);
    } catch (error) {
      console.error('Error fetching customers:', error);
      setCustomers([]);
    }
  };

  const fetchBarangs = async () => {
    try {
      const result = await api.getBarangs();
      setBarangs(result || []);
    } catch (error) {
      console.error('Error fetching barangs:', error);
      setBarangs([]);
    }
  };

  useEffect(() => {
    // Initialize master data with mock data
    const initialMasterData: MasterData[] = [
      { id: '1', kode: 'CYL', proses: 'LEBAR CYLINDER', cost: 1000, keterangan: '', category: 'biaya_proses' },
      { id: '2', kode: 'INDEXCYL', proses: 'INDEX CYLINDER', cost: 500, keterangan: '', category: 'biaya_proses' },
      { id: '3', kode: 'PLATB58', proses: 'PLAT BOKS MESIN 58', cost: 24000, keterangan: '', category: 'biaya_proses' },
      { id: '4', kode: 'PLATB52', proses: 'PLAT BOKS MESIN 52', cost: 18000, keterangan: '', category: 'biaya_proses' },
      { id: '5', kode: 'OPB58', proses: 'OVER PRINT BOKS MESIN CETAK 58', cost: 80, keterangan: '', category: 'biaya_proses' },
      { id: '6', kode: 'OPB52', proses: 'OVER PRINT BOKS MESIN CETAK 52', cost: 60, keterangan: '', category: 'biaya_proses' },
      { id: '7', kode: 'INK', proses: 'INDEX INK', cost: 1000, keterangan: '', category: 'biaya_proses' },
      { id: '8', kode: 'OPB74', proses: 'OVER PRINT BOKS MESIN CETAK 74', cost: 90, keterangan: '', category: 'biaya_proses' },
      { id: '9', kode: 'SHIPMENT', proses: 'SHIPMENT', cost: 2000, keterangan: '', category: 'biaya_proses' },
      { id: '10', kode: 'ZIP', proses: 'ZIPPER', cost: 8, keterangan: '', category: 'biaya_proses' },
      { id: '11', kode: 'BMR', proses: 'BM ROTO', cost: 200, keterangan: '', category: 'biaya_proses' },
      { id: '12', kode: 'LAMI', proses: 'INDEX LAMI', cost: 500, keterangan: '', category: 'biaya_proses' },
      { id: '13', kode: 'DESIGN', proses: 'DESAIN', cost: 75000, keterangan: '', category: 'biaya_proses' },
      // Bahan data
      {
        id: 'b1',
        kode: '',
        proses: '',
        cost: 0,
        keterangan: 'Bahan plastik premium',
        category: 'bahan',
        kategoriBahan: 'Plastik',
        tipeBahan: 'PE',
        jenisProses: 'Offset',
        kodeBarang: 'BHN-001',
        namaBarang: 'PE Film 80 Micron',
        satuan: 'Kg',
        jumlahStock: 150,
        harga: 25000
      },
      {
        id: 'b2',
        kode: '',
        proses: '',
        cost: 0,
        keterangan: 'Bahan plastik standar',
        category: 'bahan',
        kategoriBahan: 'Plastik',
        tipeBahan: 'PP',
        jenisProses: 'Roto',
        kodeBarang: 'BHN-002',
        namaBarang: 'PP Film 60 Micron',
        satuan: 'Kg',
        jumlahStock: 200,
        harga: 22000
      },
      {
        id: 'b3',
        kode: '',
        proses: '',
        cost: 0,
        keterangan: 'Kertas kraft berkualitas',
        category: 'bahan',
        kategoriBahan: 'Kertas',
        tipeBahan: 'Kraft',
        jenisProses: 'Offset',
        kodeBarang: 'BHN-003',
        namaBarang: 'Kertas Kraft 120gsm',
        satuan: 'Rim',
        jumlahStock: 50,
        harga: 85000
      },
    ];
    setMasterData(initialMasterData);
  }, []);

  const fetchFormulas = async () => {
    try {
      setLoading(true);
      const result = await api.getPriceFormulas();
      // Filter berdasarkan type dengan backward compatibility untuk 'offset' → 'flexibel'
      const filtered = result?.filter((f: PriceFormula) => {
        if (activeTab === 'flexibel') {
          return f.type === 'flexibel' || f.type === 'offset'; // Backward compatibility
        }
        return f.type === activeTab;
      }) || [];
      setFormulas(filtered);
    } catch (error) {
      console.error('Error fetching formulas:', error);
      setFormulas([]);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleHitungEstimasi = () => {
    // Logika perhitungan estimasi
    const jumlah = parseFloat(formData.jumlah) || 0;
    const lebar = parseFloat(formData.ukuranLebar) || 0;
    const tinggi = parseFloat(formData.ukuranTinggi) || 0;

    if (activeTab === 'polos') {
      // Placeholder calculation for Polos
      const hppPerPcs = 0; // Will be calculated based on formula
      const totalCost = hppPerPcs * jumlah;

      // Calculate 3 price options with different margins
      const opsi1PerPcs = 0;
      const opsi2PerPcs = 0;
      const opsi3PerPcs = 0;

      setHasilPerhitungan({
        hppPerPcs,
        totalCost,
        qty: jumlah,
        opsi1: {
          perPcs: opsi1PerPcs,
          ppn: opsi1PerPcs * 0.11,
          total: opsi1PerPcs + (opsi1PerPcs * 0.11),
        },
        opsi2: {
          perPcs: opsi2PerPcs,
          ppn: opsi2PerPcs * 0.11,
          total: opsi2PerPcs + (opsi2PerPcs * 0.11),
        },
        opsi3: {
          perPcs: opsi3PerPcs,
          ppn: opsi3PerPcs * 0.11,
          total: opsi3PerPcs + (opsi3PerPcs * 0.11),
        },
      });
    } else {
      // Placeholder calculation for other tabs
      const hargaPM = jumlah * 1876;
      const hargaPF = jumlah * 1500;

      setSummary({
        produk: formData.namaBarang || 'PM',
        ukuran: lebar && tinggi ? `${lebar} x ${tinggi} cm` : '-',
        kertas: formData.ukuranKertas || '-',
        hargaPM,
        hargaPF,
        jumlah,
      });
    }

    toast.success('Estimasi berhasil dihitung');
  };

  const generateLabelKode = (tabType: string = 'polos') => {
    const currentYear = new Date().getFullYear();
    let prefix = 'FP'; // Default Formula Polos
    
    // Set prefix based on tab type
    if (tabType === 'flexibel') {
      prefix = 'FF'; // Formula Flexibel
    } else if (tabType === 'boks') {
      prefix = 'FB'; // Formula Boks
    } else if (tabType === 'roto') {
      prefix = 'FR'; // Formula Roto
    }

    // Filter formulas by current year and type
    const currentYearFormulas = formulas.filter(f => {
      if (!f.labelKode) return false;
      return f.labelKode.startsWith(`${prefix}-${currentYear}`);
    });

    // Get the highest number
    let maxNumber = 0;
    currentYearFormulas.forEach(f => {
      const parts = f.labelKode.split('-');
      if (parts.length === 3) {
        const num = parseInt(parts[2], 10);
        if (!isNaN(num) && num > maxNumber) {
          maxNumber = num;
        }
      }
    });

    const nextNumber = maxNumber + 1;
    const paddedNumber = String(nextNumber).padStart(4, '0');
    return `${prefix}-${currentYear}-${paddedNumber}`;
  };

  const getOpsiYangDipilih = () => {
    const opsi: string[] = [];
    if (formData.bahan) opsi.push(`Bahan: ${formData.bahan}`);
    if (formData.ziplock) opsi.push(`Ziplock: ${formData.ziplock}`);
    if (formData.alas) opsi.push(`Alas: ${formData.alas}`);
    if (formData.jenisKemasan) opsi.push(`Jenis: ${formData.jenisKemasan}`);
    if (formData.jmlMata) opsi.push(`Mata: ${formData.jmlMata}`);
    return opsi.join(', ');
  };

  const handleSimpanFormula = () => {
    if (!formData.customer || !formData.namaBarang) {
      toast.error('Nama Customer dan Nama Barang harus diisi');
      return;
    }

    // Generate label kode based on active tab
    const labelKode = generateLabelKode(activeTab);

    // Populate modal data with auto-filled values
    setSaveModalData({
      labelKode: labelKode,
      salesPerson: user?.nama_user || user?.username || '',
      namaCustomer: formData.customer,
      namaBarang: formData.namaBarang,
      hargaJualPcs: hasilPerhitungan.opsi1.perPcs || 0,
      opsiYangDipilih: 'Opsi 1',
      catatan: '',
      status: 'draft',
    });
    setCustomerSearchValue('');
    setBarangSearchValue('');
    setShowSaveModal(true);
  };

  const handleConfirmSave = async () => {
    try {
      const data = {
        ...formData,
        type: activeTab,
        customer: saveModalData.namaCustomer,
        namaBarang: saveModalData.namaBarang,
        labelKode: saveModalData.labelKode,
        salesPerson: saveModalData.salesPerson,
        catatan: saveModalData.catatan,
        status: saveModalData.status,
        hargaJual: saveModalData.hargaJualPcs,
        opsiYangDipilih: saveModalData.opsiYangDipilih,
        tanggal: new Date().toISOString().split('T')[0],
      };

      await api.createPriceFormula(data);
      toast.success('Formula berhasil disimpan');
      setShowSaveModal(false);
      fetchFormulas();
      handleKosongkanInput();
    } catch (error) {
      console.error('Error saving formula:', error);
      toast.error('Gagal menyimpan formula');
    }
  };

  const handleKosongkanInput = () => {
    setFormData({
      customer: '',
      namaBarang: '',
      jenisKemasan: '',
      jumlah: '',
      ukuranLebar: '',
      ukuranTinggi: '',
      jmlMata: '',
      bahan: '',
      alas: '',
      ziplock: '',
      layoutLebar: '',
      layoutPanjang: '',
      jmlPotong: '',
      ukuranKertas: '',
      // Boks specific
      areaDesainPanjang: '',
      areaDesainLebar: '',
      laminasi: '',
      mata: '',
      warna: '',
      mesin: '',
      keteranganWarna: '',
      cetak2Sisi: '',
      cetak2SisiWarna: '',
      jenisKertas: '',
      gramasi: '',
      kertasManual: '',
      hargaPisau: '',
      desainBaru: '',
      lemSamping: '',
      panjangLem: '',
      hotfoil: '',
      hotfoilPanjang: '',
      hotfoilLebar: '',
      emboss: '',
      embossPanjang: '',
      embossLebar: '',
      spotUV: '',
      spotUVPanjang: '',
      spotUVLebar: '',
      // Roto specific
      bentuk: '',
      toleransiOrder: '',
      up: '',
      pitch: '',
      posisi: '',
      adhesive: '',
      jmlWarna: '',
      ukuranUp: '',
      ukuranPitch: '',
      lebarImage: '',
      rollDry: '',
      lebarBahan: '',
      cylinder: '',
      jmlWarnaCylinder: '',
      jumlahLayer: '1',
      layer1Material: '',
      layer1Micron: '',
      layer1Lebar: '',
      layer1Panjang: '',
      layer2Material: '',
      layer2Micron: '',
      layer2Lebar: '',
      layer2Panjang: '',
      layer3Material: '',
      layer3Micron: '',
      layer3Lebar: '',
      layer3Panjang: '',
      layer4Material: '',
      layer4Micron: '',
      layer4Lebar: '',
      layer4Panjang: '',
    });
    setSummary({
      produk: '',
      ukuran: '',
      kertas: '',
      hargaPM: 0,
      hargaPF: 0,
      jumlah: 0,
    });
    setHasilPerhitungan({
      hppPerPcs: 0,
      totalCost: 0,
      qty: 0,
      opsi1: { perPcs: 0, ppn: 0, total: 0 },
      opsi2: { perPcs: 0, ppn: 0, total: 0 },
      opsi3: { perPcs: 0, ppn: 0, total: 0 },
    });
  };

  const handleReset = () => {
    setSearchTerm('');
    setFilterSales('all');
    setFilterStatus('all');
  };

  const handleViewDetail = (formula: PriceFormula) => {
    setSelectedFormula(formula);
    setShowDetailModal(true);
  };

  const handleEditFormula = (formula: PriceFormula) => {
    toast.info(`Mengedit formula: ${formula.labelKode}`);
    // TODO: Implementasi edit formula
  };

  const handleDeleteFormula = async (formula: PriceFormula) => {
    if (!confirm(`Apakah Anda yakin ingin menghapus formula ${formula.labelKode}?`)) {
      return;
    }
    try {
      await api.deletePriceFormula(formula.id);
      toast.success('Formula berhasil dihapus');
      fetchFormulas();
    } catch (error) {
      console.error('Error deleting formula:', error);
      toast.error('Gagal menghapus formula');
    }
  };

  const handleAjukanFormula = async (formula: PriceFormula) => {
    // Validasi role: Staff Sales, Admin, atau Super Admin bisa mengajukan
    const userRole = user?.role?.toLowerCase() || '';
    const isAdmin = userRole === 'super-admin' || userRole === 'admin';
    const isStaff = userRole.includes('staff') && userRole.includes('sales');

    if (!isAdmin && !isStaff) {
      toast.error('Hanya Staff Sales, Admin, atau Super Admin yang dapat mengajukan formula');
      return;
    }

    if (formula.status !== 'draft') {
      toast.error('Hanya formula dengan status Draft yang dapat diajukan');
      return;
    }

    try {
      await api.updatePriceFormula(formula.id, {
        status: 'pending',
        updatedAt: new Date().toISOString()
      });
      toast.success('Formula berhasil diajukan untuk persetujuan');
      fetchFormulas();
    } catch (error) {
      console.error('Error submitting formula:', error);
      toast.error('Gagal mengajukan formula');
    }
  };

  const handleSetujuiFormula = async (formula: PriceFormula) => {
    // Validasi role: SPV Sales, Manager Sales, Admin, atau Super Admin bisa menyetujui
    const userRole = user?.role?.toLowerCase() || '';
    const isAdmin = userRole === 'super-admin' || userRole === 'admin';
    const canApprove = userRole.includes('spv') || userRole.includes('supervisor') ||
                       userRole.includes('manager');

    if (!isAdmin && (!canApprove || !userRole.includes('sales'))) {
      toast.error('Hanya SPV Sales, Manager Sales, Admin, atau Super Admin yang dapat menyetujui formula');
      return;
    }

    if (formula.status !== 'pending') {
      toast.error('Hanya formula dengan status Pending yang dapat disetujui');
      return;
    }

    try {
      await api.updatePriceFormula(formula.id, {
        status: 'approved',
        approvedBy: user?.nama_user || user?.username || '',
        approvedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
      toast.success('Formula berhasil disetujui');
      fetchFormulas();
    } catch (error) {
      console.error('Error approving formula:', error);
      toast.error('Gagal menyetujui formula');
    }
  };

  const handleTolakFormula = async (formula: PriceFormula) => {
    // Validasi role: SPV Sales, Manager Sales, Admin, atau Super Admin bisa menolak
    const userRole = user?.role?.toLowerCase() || '';
    const isAdmin = userRole === 'super-admin' || userRole === 'admin';
    const canReject = userRole.includes('spv') || userRole.includes('supervisor') ||
                      userRole.includes('manager');

    if (!isAdmin && (!canReject || !userRole.includes('sales'))) {
      toast.error('Hanya SPV Sales, Manager Sales, Admin, atau Super Admin yang dapat menolak formula');
      return;
    }

    if (formula.status !== 'pending') {
      toast.error('Hanya formula dengan status Pending yang dapat ditolak');
      return;
    }

    const alasan = prompt('Masukkan alasan penolakan:');
    if (!alasan) return;

    try {
      await api.updatePriceFormula(formula.id, {
        status: 'rejected',
        catatanApprover: alasan,
        rejectedBy: user?.nama_user || user?.username || '',
        rejectedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
      toast.success('Formula ditolak');
      fetchFormulas();
    } catch (error) {
      console.error('Error rejecting formula:', error);
      toast.error('Gagal menolak formula');
    }
  };

  const handleFinalkanFormula = async (formula: PriceFormula) => {
    if (formula.status !== 'approved') {
      toast.error('Hanya formula dengan status Approved yang dapat difinalkan');
      return;
    }
    try {
      await api.updatePriceFormula(formula.id, { status: 'final' });
      toast.success('Formula berhasil difinalkan');
      fetchFormulas();
    } catch (error) {
      console.error('Error finalizing formula:', error);
      toast.error('Gagal memfinalkan formula');
    }
  };

  const handlePakaiRumus = (formula: PriceFormula) => {
    // Populate form with formula data
    setFormData({
      customer: formula.customer,
      namaBarang: formula.namaBarang,
      jenisKemasan: formula.jenisKemasan,
      jumlah: formula.jumlah.toString(),
      ukuranLebar: formula.ukuranLebar.toString(),
      ukuranTinggi: formula.ukuranTinggi.toString(),
      jmlMata: formula.jmlMata,
      bahan: formula.bahan,
      alas: formula.alas,
      ziplock: formula.ziplock,
      layoutLebar: formula.layoutLebar.toString(),
      layoutPanjang: formula.layoutPanjang.toString(),
      jmlPotong: formula.jmlPotong.toString(),
      ukuranKertas: formula.ukuranKertas,
      // Keep other fields as they are
      areaDesainPanjang: '',
      areaDesainLebar: '',
      laminasi: '',
      mata: '',
      warna: '',
      mesin: '',
      keteranganWarna: '',
      cetak2Sisi: '',
      cetak2SisiWarna: '',
      jenisKertas: '',
      gramasi: '',
      kertasManual: '',
      hargaPisau: '',
      desainBaru: '',
      lemSamping: '',
      panjangLem: '',
      hotfoil: '',
      hotfoilPanjang: '',
      hotfoilLebar: '',
      emboss: '',
      embossPanjang: '',
      embossLebar: '',
      spotUV: '',
      spotUVPanjang: '',
      spotUVLebar: '',
      bentuk: '',
      toleransiOrder: '',
      up: '',
      pitch: '',
      posisi: '',
      adhesive: '',
      jmlWarna: '',
      ukuranUp: '',
      ukuranPitch: '',
      lebarImage: '',
      rollDry: '',
      lebarBahan: '',
      cylinder: '',
      jmlWarnaCylinder: '',
      jumlahLayer: '1',
      layer1Material: '',
      layer1Micron: '',
      layer1Lebar: '',
      layer1Panjang: '',
      layer2Material: '',
      layer2Micron: '',
      layer2Lebar: '',
      layer2Panjang: '',
      layer3Material: '',
      layer3Micron: '',
      layer3Lebar: '',
      layer3Panjang: '',
      layer4Material: '',
      layer4Micron: '',
      layer4Lebar: '',
      layer4Panjang: '',
    });
    toast.success(`Rumus formula ${formula.labelKode} berhasil dimuat ke form`);
  };

  const handleArsipkanFormula = async (formula: PriceFormula) => {
    if (!confirm(`Apakah Anda yakin ingin mengarsipkan formula ${formula.labelKode}?`)) {
      return;
    }
    try {
      await api.updatePriceFormula(formula.id, { status: 'archived' });
      toast.success('Formula berhasil diarsipkan');
      fetchFormulas();
    } catch (error) {
      console.error('Error archiving formula:', error);
      toast.error('Gagal mengarsipkan formula');
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, string> = {
      draft: 'bg-gray-100 text-gray-700 hover:bg-gray-200',
      pending: 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200',
      final: 'bg-purple-100 text-purple-700 hover:bg-purple-200',
      approved: 'bg-green-100 text-green-700 hover:bg-green-200',
      rejected: 'bg-red-100 text-red-700 hover:bg-red-200',
      archived: 'bg-slate-100 text-slate-700 hover:bg-slate-200',
    };
    return variants[status] || 'bg-gray-100 text-gray-700 hover:bg-gray-200';
  };

  const getStatusIconColor = (status: string) => {
    const variants: Record<string, string> = {
      draft: 'bg-gray-500 hover:bg-gray-600',
      pending: 'bg-yellow-500 hover:bg-yellow-600',
      final: 'bg-purple-500 hover:bg-purple-600',
      approved: 'bg-green-500 hover:bg-green-600',
      rejected: 'bg-red-500 hover:bg-red-600',
      archived: 'bg-slate-500 hover:bg-slate-600',
    };
    return variants[status] || 'bg-gray-500 hover:bg-gray-600';
  };

  // Helper functions untuk role-based access
  const isAdminOrSuperAdmin = () => {
    const userRole = user?.role?.toLowerCase() || '';
    return userRole === 'super-admin' || userRole === 'admin';
  };

  const isStaffSales = () => {
    if (isAdminOrSuperAdmin()) return true;
    const userRole = user?.role?.toLowerCase() || '';
    return userRole.includes('staff') && userRole.includes('sales');
  };

  const isApprover = () => {
    if (isAdminOrSuperAdmin()) return true;
    const userRole = user?.role?.toLowerCase() || '';
    return (userRole.includes('spv') || userRole.includes('supervisor') || userRole.includes('manager')) &&
           userRole.includes('sales');
  };

  const canAjukan = (formula: PriceFormula) => {
    return isStaffSales() && formula.status === 'draft';
  };

  const canSetujui = (formula: PriceFormula) => {
    return isApprover() && formula.status === 'pending';
  };

  const canTolak = (formula: PriceFormula) => {
    return isApprover() && formula.status === 'pending';
  };

  const canFinalkan = (formula: PriceFormula) => {
    // Admin dan Super Admin bisa finalkan, atau siapa saja jika formula sudah approved
    return (isAdminOrSuperAdmin() || formula.status === 'approved') && formula.status === 'approved';
  };

  const filteredFormulas = formulas.filter((formula) => {
    const matchSearch =
      formula.customer?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      formula.namaBarang?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      formula.labelKode?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchSales = filterSales === 'all' || formula.salesPerson === filterSales;
    const matchStatus = filterStatus === 'all' || formula.status === filterStatus;

    return matchSearch && matchSales && matchStatus;
  });

  const filteredMasterData = masterData.filter((item) => {
    const matchCategory = item.category === masterCategory;

    let matchSearch = false;
    if (masterCategory === 'bahan') {
      matchSearch =
        (item.kodeBarang?.toLowerCase().includes(masterSearch.toLowerCase()) || false) ||
        (item.namaBarang?.toLowerCase().includes(masterSearch.toLowerCase()) || false) ||
        (item.kategoriBahan?.toLowerCase().includes(masterSearch.toLowerCase()) || false) ||
        (item.tipeBahan?.toLowerCase().includes(masterSearch.toLowerCase()) || false);
    } else {
      matchSearch =
        item.kode.toLowerCase().includes(masterSearch.toLowerCase()) ||
        item.proses.toLowerCase().includes(masterSearch.toLowerCase());
    }

    return matchCategory && matchSearch;
  });

  const handleAddMasterData = () => {
    setEditingMaster(null);
    setMasterFormData({
      kategoriBahan: '',
      tipeBahan: '',
      jenisProses: '',
      kodeBarang: '',
      namaBarang: '',
      satuan: '',
      jumlahStock: 0,
      harga: 0,
      keterangan: '',
    });
    setShowMasterModal(true);
  };

  const handleEditMasterData = (item: MasterData) => {
    setEditingMaster(item);
    setMasterFormData({
      kategoriBahan: item.kategoriBahan || '',
      tipeBahan: item.tipeBahan || '',
      jenisProses: item.jenisProses || '',
      kodeBarang: item.kodeBarang || '',
      namaBarang: item.namaBarang || '',
      satuan: item.satuan || '',
      jumlahStock: item.jumlahStock || 0,
      harga: item.harga || 0,
      keterangan: item.keterangan || '',
    });
    setShowMasterModal(true);
  };

  const handleSaveMasterData = () => {
    if (masterCategory === 'bahan') {
      if (!masterFormData.namaBarang || !masterFormData.kodeBarang) {
        toast.error('Nama barang dan kode barang harus diisi');
        return;
      }

      if (editingMaster) {
        // Update existing
        setMasterData(masterData.map(item =>
          item.id === editingMaster.id
            ? {
                ...item,
                ...masterFormData,
                kode: '',
                proses: '',
                cost: 0,
              }
            : item
        ));
        toast.success('Data bahan berhasil diperbarui');
      } else {
        // Add new
        const newData: MasterData = {
          id: `b${Date.now()}`,
          kode: '',
          proses: '',
          cost: 0,
          category: 'bahan',
          ...masterFormData,
        };
        setMasterData([...masterData, newData]);
        toast.success('Data bahan berhasil ditambahkan');
      }

      setShowMasterModal(false);
    }
  };

  const handleDeleteMasterData = (item: MasterData) => {
    if (confirm('Apakah Anda yakin ingin menghapus data ini?')) {
      setMasterData(masterData.filter(data => data.id !== item.id));
      toast.success('Data berhasil dihapus');
    }
  };

  return (
    <div className="space-y-1">
      <PageHeader
        title="Formula Harga"
        breadcrumbs={[
          { label: 'Dashboard', href: '/' },
          { label: 'Sales' },
          { label: 'Formula Harga' },
        ]}
      />

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-5">
          <TabsTrigger value="polos">Polos</TabsTrigger>
          <TabsTrigger value="flexibel">Flexibel</TabsTrigger>
          <TabsTrigger value="boks">Boks</TabsTrigger>
          <TabsTrigger value="roto">Roto</TabsTrigger>
          <TabsTrigger value="master">Master</TabsTrigger>
        </TabsList>

        {/* Tab Content for Polos */}
        <TabsContent value="polos" className="mt-2">
          {/* Spesifikasi Produk & Hasil Perhitungan */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-2">
            {/* Spesifikasi Produk */}
            <Card>
              <CardContent className="p-2">
                <h3 className="text-sm font-semibold mb-2">Spesifikasi Produk</h3>

                <div className="space-y-1">
                  {/* Nama Customer */}
                  <div className="grid grid-cols-[140px_1fr] gap-1 items-center">
                    <Label htmlFor="customer" className="text-sm">Nama Customer</Label>
                    <Input
                      id="customer"
                      value={formData.customer}
                      onChange={(e) => handleInputChange('customer', e.target.value)}
                      placeholder=""
                      className="h-6 text-sm"
                    />
                  </div>

                  {/* Nama Barang */}
                  <div className="grid grid-cols-[140px_1fr] gap-1 items-center">
                    <Label htmlFor="namaBarang" className="text-sm">Nama Barang</Label>
                    <Input
                      id="namaBarang"
                      value={formData.namaBarang}
                      onChange={(e) => handleInputChange('namaBarang', e.target.value)}
                      placeholder=""
                      className="h-6 text-sm"
                    />
                  </div>

                  {/* Jenis Bentuk */}
                  <div className="grid grid-cols-[140px_1fr] gap-1 items-center">
                    <Label htmlFor="jenisKemasan" className="text-sm">Jenis Bentuk</Label>
                    <Select value={formData.jenisKemasan} onValueChange={(value) => handleInputChange('jenisKemasan', value)}>
                      <SelectTrigger id="jenisKemasan" size="xs" className="text-sm">
                        <SelectValue placeholder="- Pilih -" />
                      </SelectTrigger>
                      <SelectContent>
                        {productTypes.filter(t => t.name && typeof t.name === 'string' && t.name.trim() !== '').map((type) => (
                          <SelectItem key={type.id} value={type.name}>
                            {type.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Ziplock */}
                  <div className="grid grid-cols-[140px_1fr] gap-1 items-center">
                    <Label htmlFor="ziplock" className="text-sm">Ziplock</Label>
                    <Select value={formData.ziplock} onValueChange={(value) => handleInputChange('ziplock', value)}>
                      <SelectTrigger id="ziplock" size="xs" className="text-sm">
                        <SelectValue placeholder="Pilih ziplock" />
                      </SelectTrigger>
                      <SelectContent>
                        {ZIPLOCK_OPTIONS.map((option) => (
                          <SelectItem key={option} value={option}>
                            {option}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Bahan */}
                  <div className="grid grid-cols-[140px_1fr] gap-1 items-center">
                    <Label htmlFor="bahan" className="text-sm">Bahan</Label>
                    <Select value={formData.bahan} onValueChange={(value) => handleInputChange('bahan', value)}>
                      <SelectTrigger id="bahan" size="xs" className="text-sm">
                        <SelectValue placeholder="Pilih bahan" />
                      </SelectTrigger>
                      <SelectContent>
                        {BAHAN_POLOS_OPTIONS.map((option) => (
                          <SelectItem key={option} value={option}>
                            {option}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Qty (pcs) */}
                  <div className="grid grid-cols-[140px_1fr] gap-1 items-center">
                    <Label htmlFor="jumlah" className="text-sm">Qty (pcs)</Label>
                    <Input
                      id="jumlah"
                      type="number"
                      value={formData.jumlah}
                      onChange={(e) => handleInputChange('jumlah', e.target.value)}
                      placeholder=""
                      className="h-6 text-sm"
                    />
                  </div>

                  {/* Lebar x Tinggi */}
                  <div className="grid grid-cols-[140px_1fr] gap-1 items-center">
                    <Label className="text-sm">Lebar x Tinggi (cm)</Label>
                    <div className="grid grid-cols-2 gap-1">
                      <Input
                        type="number"
                        value={formData.ukuranLebar}
                        onChange={(e) => handleInputChange('ukuranLebar', e.target.value)}
                        placeholder="0"
                        className="h-6 text-sm"
                      />
                      <Input
                        type="number"
                        value={formData.ukuranTinggi}
                        onChange={(e) => handleInputChange('ukuranTinggi', e.target.value)}
                        placeholder="0"
                        className="h-6 text-sm"
                      />
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-1 mt-2">
                  <Button onClick={handleHitungEstimasi} className="flex-1 text-sm py-1 h-6 bg-blue-600 hover:bg-blue-700">
                    Hitung Estimasi
                  </Button>
                  <Button onClick={handleSimpanFormula} className="flex-1 text-sm py-1 h-6 bg-green-600 hover:bg-green-700">
                    Simpan Formula
                  </Button>
                  <Button onClick={handleKosongkanInput} variant="outline" className="flex-1 text-sm py-1 h-6">
                    Kosongkan Input
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Hasil Perhitungan */}
            <Card>
              <CardContent className="p-2">
                <h3 className="text-sm font-semibold mb-2">Hasil Perhitungan</h3>

                <div className="space-y-1">
                  {/* HPP Summary */}
                  <div className="flex justify-between items-center pb-1 border-b">
                    <span className="text-sm font-medium">HPP per Pcs</span>
                    <span className="text-sm font-bold text-blue-600">
                      Rp {hasilPerhitungan.hppPerPcs.toLocaleString('id-ID')}
                    </span>
                  </div>
                  <div className="flex justify-between items-center pb-1 border-b">
                    <span className="text-sm text-muted-foreground">
                      Total Cost ({hasilPerhitungan.qty} pcs)
                    </span>
                    <span className="text-sm font-medium">
                      Rp {hasilPerhitungan.totalCost.toLocaleString('id-ID')}
                    </span>
                  </div>

                  {/* Price Options Table */}
                  <div className="border rounded-lg overflow-hidden mt-2">
                    <table className="w-full text-sm">
                      <thead className="bg-muted">
                        <tr>
                          <th className="p-1.5 text-left font-medium">OPSI</th>
                          <th className="p-1.5 text-right font-medium">PER PCS</th>
                          <th className="p-1.5 text-right font-medium text-blue-600">+ PPN 11%</th>
                          <th className="p-1.5 text-right font-medium">TOTAL</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        <tr>
                          <td className="p-1.5">Opsi 1</td>
                          <td className="p-1.5 text-right">
                            Rp {hasilPerhitungan.opsi1.perPcs.toLocaleString('id-ID')}
                          </td>
                          <td className="p-1.5 text-right text-blue-600">
                            Rp {hasilPerhitungan.opsi1.ppn.toLocaleString('id-ID')}
                          </td>
                          <td className="p-1.5 text-right font-medium">
                            Rp {hasilPerhitungan.opsi1.total.toLocaleString('id-ID')}
                          </td>
                        </tr>
                        <tr>
                          <td className="p-1.5">Opsi 2</td>
                          <td className="p-1.5 text-right">
                            Rp {hasilPerhitungan.opsi2.perPcs.toLocaleString('id-ID')}
                          </td>
                          <td className="p-1.5 text-right text-blue-600">
                            Rp {hasilPerhitungan.opsi2.ppn.toLocaleString('id-ID')}
                          </td>
                          <td className="p-1.5 text-right font-medium">
                            Rp {hasilPerhitungan.opsi2.total.toLocaleString('id-ID')}
                          </td>
                        </tr>
                        <tr>
                          <td className="p-1.5 text-red-600 font-medium">Opsi 3</td>
                          <td className="p-1.5 text-right">
                            Rp {hasilPerhitungan.opsi3.perPcs.toLocaleString('id-ID')}
                          </td>
                          <td className="p-1.5 text-right text-blue-600">
                            Rp {hasilPerhitungan.opsi3.ppn.toLocaleString('id-ID')}
                          </td>
                          <td className="p-1.5 text-right font-medium text-red-600">
                            Rp {hasilPerhitungan.opsi3.total.toLocaleString('id-ID')}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Formula Tersimpan */}
          <Card>
            <CardContent className="p-2">
              <h3 className="text-sm font-semibold mb-2">
                Formula {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Tersimpan
              </h3>

              {/* Search and Filters */}
              <div className="flex gap-1 mb-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Cari formula..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9"
                  />
                </div>

                <Select value={filterSales} onValueChange={setFilterSales}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Semua Sales" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem key="sales-all" value="all">Semua Sales</SelectItem>
                    <SelectItem key="sales-1" value="sales1">Sales 1</SelectItem>
                    <SelectItem key="sales-2" value="sales2">Sales 2</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Semua Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem key="status-all" value="all">Semua Status</SelectItem>
                    <SelectItem key="status-draft" value="draft">Draft</SelectItem>
                    <SelectItem key="status-final" value="final">Final</SelectItem>
                    <SelectItem key="status-approved" value="approved">Approved</SelectItem>
                  </SelectContent>
                </Select>

                <Button variant="outline" onClick={handleReset} className="bg-gray-600 text-white hover:bg-gray-700 hover:text-white">
                  Reset
                </Button>
              </div>

              {/* Table */}
              <div className="border rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead className="bg-muted">
                    <tr className="text-left text-xs uppercase">
                      <th className="p-2 font-medium w-12">#</th>
                      <th className="p-2 font-medium w-16">Aksi</th>
                      <th className="p-2 font-medium">Customer<br/>Sales | Tanggal</th>
                      <th className="p-2 font-medium">Nama Barang</th>
                      <th className="p-2 font-medium">Label Kode</th>
                      <th className="p-2 font-medium text-right">HPP</th>
                      <th className="p-2 font-medium text-right">Harga Jual<br/>Opsi</th>
                      <th className="p-2 font-medium">Status</th>
                      <th className="p-2 font-medium">Catatan</th>
                      <th className="p-2 font-medium">Catatan<br/>Approver</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {loading ? (
                      <tr>
                        <td colSpan={10} className="p-2 text-center text-muted-foreground">
                          Memuat data...
                        </td>
                      </tr>
                    ) : filteredFormulas.length === 0 ? (
                      <tr>
                        <td colSpan={10} className="p-2 text-center text-muted-foreground">
                          Belum ada formula tersimpan
                        </td>
                      </tr>
                    ) : (
                      filteredFormulas.map((formula, index) => (
                        <tr key={formula.id} className="text-sm hover:bg-muted/50">
                          <td className="p-2 text-center">{index + 1}</td>
                          <td className="p-2">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm" className={`h-8 w-8 p-0 rounded text-white hover:text-white ${getStatusIconColor(formula.status)}`}>
                                  <Eye className="w-4 h-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => handleViewDetail(formula)}>
                                  Detail
                                </DropdownMenuItem>
                                {formula.status === 'draft' && (
                                  <DropdownMenuItem onClick={() => handleEditFormula(formula)}>
                                    Edit
                                  </DropdownMenuItem>
                                )}
                                <DropdownMenuItem onClick={() => handlePakaiRumus(formula)}>
                                  Pakai Rumus
                                </DropdownMenuItem>
                                {canAjukan(formula) && (
                                  <DropdownMenuItem onClick={() => handleAjukanFormula(formula)} className="text-blue-600">
                                    Ajukan untuk Persetujuan
                                  </DropdownMenuItem>
                                )}
                                {canSetujui(formula) && (
                                  <DropdownMenuItem onClick={() => handleSetujuiFormula(formula)} className="text-green-600">
                                    Setujui
                                  </DropdownMenuItem>
                                )}
                                {canTolak(formula) && (
                                  <DropdownMenuItem onClick={() => handleTolakFormula(formula)} className="text-orange-600">
                                    Tolak
                                  </DropdownMenuItem>
                                )}
                                {canFinalkan(formula) && (
                                  <DropdownMenuItem onClick={() => handleFinalkanFormula(formula)}>
                                    Finalkan
                                  </DropdownMenuItem>
                                )}
                                <DropdownMenuItem onClick={() => handleArsipkanFormula(formula)}>
                                  Arsipkan
                                </DropdownMenuItem>
                                {formula.status === 'draft' && (
                                  <DropdownMenuItem onClick={() => handleDeleteFormula(formula)} className="text-red-600">
                                    Hapus
                                  </DropdownMenuItem>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </td>
                          <td className="p-2">
                            <div className="font-medium">{formula.customer || '-'}</div>
                            <div className="text-xs text-muted-foreground">
                              {formula.salesPerson || '-'} | {formatDate(formula.tanggal)}
                            </div>
                          </td>
                          <td className="p-2">{formula.namaBarang || '-'}</td>
                          <td className="p-2">
                            <div className="font-medium text-blue-600">{formula.labelKode || '-'}</div>
                          </td>
                          <td className="p-2 text-right font-medium">Rp {(formula.hpp || 0).toLocaleString('id-ID')}</td>
                          <td className="p-2 text-right">
                            <div className="font-medium">Rp {(formula.hargaJual || 0).toLocaleString('id-ID')}</div>
                            {formula.opsiYangDipilih && (
                              <div className="text-xs text-muted-foreground mt-0.5">{formula.opsiYangDipilih}</div>
                            )}
                          </td>
                          <td className="p-2">
                            <Badge className={getStatusBadge(formula.status)}>
                              {formula.status.toUpperCase()}
                            </Badge>
                          </td>
                          <td className="p-2 text-muted-foreground">{formula.catatan || '-'}</td>
                          <td className="p-2 text-muted-foreground">{formula.catatanApprover || '-'}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab Content for Flexibel */}
        <TabsContent value="flexibel" className="mt-2">
          {/* Spesifikasi Produk & Ringkasan */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-2">
            {/* Spesifikasi Produk */}
            <Card className="lg:col-span-2">
              <CardContent className="p-2">
                <h3 className="text-sm font-semibold mb-2">Spesifikasi Produk</h3>

                <div className="grid grid-cols-2 gap-2">
                  {/* Column 1 */}
                  <div className="space-y-1">
                    {/* Nama Customer */}
                    <div className="grid grid-cols-[140px_1fr] gap-1 items-center">
                      <Label htmlFor="customer-offset" className="text-sm">Nama Customer</Label>
                      <Input
                        id="customer-offset"
                        value={formData.customer}
                        onChange={(e) => handleInputChange('customer', e.target.value)}
                        placeholder=""
                        className="h-6 text-sm"
                      />
                    </div>

                    {/* Nama Barang */}
                    <div className="grid grid-cols-[140px_1fr] gap-1 items-center">
                      <Label htmlFor="namaBarang-offset" className="text-sm">Nama Barang</Label>
                      <Input
                        id="namaBarang-offset"
                        value={formData.namaBarang}
                        onChange={(e) => handleInputChange('namaBarang', e.target.value)}
                        placeholder=""
                        className="h-6 text-sm"
                      />
                    </div>

                    {/* Jenis Bentuk */}
                    <div className="grid grid-cols-[140px_1fr] gap-1 items-center">
                      <Label htmlFor="jenisKemasan-offset" className="text-sm">Jenis Bentuk</Label>
                      <Select value={formData.jenisKemasan} onValueChange={(value) => handleInputChange('jenisKemasan', value)}>
                        <SelectTrigger id="jenisKemasan-offset" size="xs" className="text-sm">
                          <SelectValue placeholder="- Pilih -" />
                        </SelectTrigger>
                        <SelectContent>
                          {productTypes.map((type) => (
                            <SelectItem key={`offset-jenis-${type.id}`} value={type.name}>
                              {type.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Jumlah */}
                    <div className="grid grid-cols-[140px_1fr] gap-1 items-center">
                      <Label htmlFor="jumlah-offset" className="text-sm">Jumlah</Label>
                      <Input
                        id="jumlah-offset"
                        type="number"
                        value={formData.jumlah}
                        onChange={(e) => handleInputChange('jumlah', e.target.value)}
                        placeholder=""
                        className="h-6 text-sm"
                      />
                    </div>

                    {/* Ukuran (cm) */}
                    <div className="grid grid-cols-[140px_1fr] gap-1 items-center">
                      <Label className="text-sm">Ukuran (cm)</Label>
                      <div className="grid grid-cols-2 gap-1">
                        <Input
                          type="number"
                          value={formData.ukuranLebar}
                          onChange={(e) => handleInputChange('ukuranLebar', e.target.value)}
                          placeholder="Lebar"
                          className="h-6 text-sm"
                        />
                        <Input
                          type="number"
                          value={formData.ukuranTinggi}
                          onChange={(e) => handleInputChange('ukuranTinggi', e.target.value)}
                          placeholder="Tinggi"
                          className="h-6 text-sm"
                        />
                      </div>
                    </div>

                    {/* Jml Mata */}
                    <div className="grid grid-cols-[140px_1fr] gap-1 items-center">
                      <Label htmlFor="jmlMata-offset" className="text-sm">Jml Mata</Label>
                      <Select value={formData.jmlMata} onValueChange={(value) => handleInputChange('jmlMata', value)}>
                        <SelectTrigger id="jmlMata-offset" size="xs" className="text-sm">
                          <SelectValue placeholder="- Pilih -" />
                        </SelectTrigger>
                        <SelectContent>
                          {JML_MATA_OPTIONS.map((option) => (
                            <SelectItem key={`offset-mata-${option}`} value={option}>
                              {option}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Column 2 */}
                  <div className="space-y-1">
                    {/* Bahan */}
                    <div className="grid grid-cols-[140px_1fr] gap-1 items-center">
                      <Label htmlFor="bahan-offset" className="text-sm">Bahan</Label>
                      <Select value={formData.bahan} onValueChange={(value) => handleInputChange('bahan', value)}>
                        <SelectTrigger id="bahan-offset" size="xs" className="text-sm">
                          <SelectValue placeholder="Paper Metal" />
                        </SelectTrigger>
                        <SelectContent>
                          {BAHAN_OPTIONS.map((option) => (
                            <SelectItem key={`offset-bahan-${option}`} value={option}>
                              {option}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Alas */}
                    <div className="grid grid-cols-[140px_1fr] gap-1 items-center">
                      <Label htmlFor="alas-offset" className="text-sm">Alas</Label>
                      <Select value={formData.alas} onValueChange={(value) => handleInputChange('alas', value)}>
                        <SelectTrigger id="alas-offset" size="xs" className="text-sm">
                          <SelectValue placeholder="Polos" />
                        </SelectTrigger>
                        <SelectContent>
                          {ALAS_OPTIONS.map((option) => (
                            <SelectItem key={`offset-alas-${option}`} value={option}>
                              {option}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Ziplock */}
                    <div className="grid grid-cols-[140px_1fr] gap-1 items-center">
                      <Label htmlFor="ziplock-offset" className="text-sm">Ziplock</Label>
                      <Select value={formData.ziplock} onValueChange={(value) => handleInputChange('ziplock', value)}>
                        <SelectTrigger id="ziplock-offset" size="xs" className="text-sm">
                          <SelectValue placeholder="Pilih ziplock" />
                        </SelectTrigger>
                        <SelectContent>
                          {ZIPLOCK_OPTIONS.map((option) => (
                            <SelectItem key={`offset-ziplock-${option}`} value={option}>
                              {option}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Ukuran Layout (cm) */}
                    <div className="grid grid-cols-[140px_1fr] gap-1 items-center">
                      <Label className="text-sm">Ukuran Layout (cm)</Label>
                      <div className="grid grid-cols-2 gap-1">
                        <Input
                          type="number"
                          value={formData.layoutLebar}
                          onChange={(e) => handleInputChange('layoutLebar', e.target.value)}
                          placeholder="Lebar"
                          className="h-6 text-sm"
                        />
                        <Input
                          type="number"
                          value={formData.layoutPanjang}
                          onChange={(e) => handleInputChange('layoutPanjang', e.target.value)}
                          placeholder="Panjang"
                          className="h-6 text-sm"
                        />
                      </div>
                    </div>

                    {/* Jml Potong */}
                    <div className="grid grid-cols-[140px_1fr] gap-1 items-center">
                      <Label htmlFor="jmlPotong-offset" className="text-sm">Jml Potong</Label>
                      <Input
                        id="jmlPotong-offset"
                        type="number"
                        value={formData.jmlPotong}
                        onChange={(e) => handleInputChange('jmlPotong', e.target.value)}
                        placeholder=""
                        className="h-6 text-sm"
                      />
                    </div>

                    {/* Ukuran Kertas */}
                    <div className="grid grid-cols-[140px_1fr] gap-1 items-center">
                      <Label htmlFor="ukuranKertas-offset" className="text-sm">Ukuran Kertas</Label>
                      <Select value={formData.ukuranKertas} onValueChange={(value) => handleInputChange('ukuranKertas', value)}>
                        <SelectTrigger id="ukuranKertas-offset" size="xs" className="text-sm">
                          <SelectValue placeholder="Tidak ada kertas muat" />
                        </SelectTrigger>
                        <SelectContent>
                          {UKURAN_KERTAS_OPTIONS.map((option) => (
                            <SelectItem key={`offset-kertas-${option}`} value={option}>
                              {option}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-1 mt-2">
                  <Button onClick={handleHitungEstimasi} className="flex-1 text-sm py-1 h-6 bg-blue-600 hover:bg-blue-700">
                    Hitung Estimasi
                  </Button>
                  <Button onClick={handleSimpanFormula} className="flex-1 text-sm py-1 h-6 bg-green-600 hover:bg-green-700">
                    Simpan Formula
                  </Button>
                  <Button onClick={handleKosongkanInput} variant="outline" className="flex-1 text-sm py-1 h-6">
                    Kosongkan Input
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Hasil Perhitungan */}
            <Card>
              <CardContent className="p-2">
                <h3 className="text-sm font-semibold mb-2">Hasil Perhitungan</h3>

                <div className="space-y-1">
                  {/* HPP Summary */}
                  <div className="flex justify-between items-center pb-1 border-b">
                    <span className="text-sm font-medium">HPP per Pcs</span>
                    <span className="text-sm font-bold text-blue-600">
                      Rp {hasilPerhitungan.hppPerPcs.toLocaleString('id-ID')}
                    </span>
                  </div>
                  <div className="flex justify-between items-center pb-1 border-b">
                    <span className="text-sm text-muted-foreground">
                      Total Cost ({hasilPerhitungan.qty} pcs)
                    </span>
                    <span className="text-sm font-medium">
                      Rp {hasilPerhitungan.totalCost.toLocaleString('id-ID')}
                    </span>
                  </div>

                  {/* Price Options Table */}
                  <div className="border rounded-lg overflow-hidden mt-2">
                    <table className="w-full text-sm">
                      <thead className="bg-muted">
                        <tr>
                          <th className="p-1.5 text-left font-medium">OPSI</th>
                          <th className="p-1.5 text-right font-medium">PER PCS</th>
                          <th className="p-1.5 text-right font-medium text-blue-600">+ PPN 11%</th>
                          <th className="p-1.5 text-right font-medium">TOTAL</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        <tr>
                          <td className="p-1.5">Opsi 1</td>
                          <td className="p-1.5 text-right">
                            Rp {hasilPerhitungan.opsi1.perPcs.toLocaleString('id-ID')}
                          </td>
                          <td className="p-1.5 text-right text-blue-600">
                            Rp {hasilPerhitungan.opsi1.ppn.toLocaleString('id-ID')}
                          </td>
                          <td className="p-1.5 text-right font-medium">
                            Rp {hasilPerhitungan.opsi1.total.toLocaleString('id-ID')}
                          </td>
                        </tr>
                        <tr>
                          <td className="p-1.5">Opsi 2</td>
                          <td className="p-1.5 text-right">
                            Rp {hasilPerhitungan.opsi2.perPcs.toLocaleString('id-ID')}
                          </td>
                          <td className="p-1.5 text-right text-blue-600">
                            Rp {hasilPerhitungan.opsi2.ppn.toLocaleString('id-ID')}
                          </td>
                          <td className="p-1.5 text-right font-medium">
                            Rp {hasilPerhitungan.opsi2.total.toLocaleString('id-ID')}
                          </td>
                        </tr>
                        <tr>
                          <td className="p-1.5 text-red-600 font-medium">Opsi 3</td>
                          <td className="p-1.5 text-right">
                            Rp {hasilPerhitungan.opsi3.perPcs.toLocaleString('id-ID')}
                          </td>
                          <td className="p-1.5 text-right text-blue-600">
                            Rp {hasilPerhitungan.opsi3.ppn.toLocaleString('id-ID')}
                          </td>
                          <td className="p-1.5 text-right font-medium text-red-600">
                            Rp {hasilPerhitungan.opsi3.total.toLocaleString('id-ID')}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Formula Flexibel Tersimpan */}
          <Card>
            <CardContent className="p-2">
              <h3 className="text-sm font-semibold mb-2">Formula Flexibel Tersimpan</h3>

              {/* Search and Filters */}
              <div className="flex gap-1 mb-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Cari formula..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9"
                  />
                </div>

                <Select value={filterSales} onValueChange={setFilterSales}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Semua Sales" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem key="sales-all-offset" value="all">Semua Sales</SelectItem>
                    <SelectItem key="sales-1-offset" value="sales1">Sales 1</SelectItem>
                    <SelectItem key="sales-2-offset" value="sales2">Sales 2</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Semua Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem key="status-all-offset" value="all">Semua Status</SelectItem>
                    <SelectItem key="status-draft-offset" value="draft">Draft</SelectItem>
                    <SelectItem key="status-final-offset" value="final">Final</SelectItem>
                    <SelectItem key="status-approved-offset" value="approved">Approved</SelectItem>
                  </SelectContent>
                </Select>

                <Button variant="outline" onClick={handleReset} className="bg-gray-600 text-white hover:bg-gray-700 hover:text-white">
                  Reset
                </Button>
              </div>

              {/* Table */}
              <div className="border rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead className="bg-muted">
                    <tr className="text-left text-xs uppercase">
                      <th className="p-2 font-medium w-12">#</th>
                      <th className="p-2 font-medium w-16">Aksi</th>
                      <th className="p-2 font-medium">Customer<br/>Sales | Tanggal</th>
                      <th className="p-2 font-medium">Nama Barang</th>
                      <th className="p-2 font-medium">Label Kode</th>
                      <th className="p-2 font-medium text-right">QTY</th>
                      <th className="p-2 font-medium text-right">HPP</th>
                      <th className="p-2 font-medium text-right">Harga Jual<br/>Opsi</th>
                      <th className="p-2 font-medium">Status</th>
                      <th className="p-2 font-medium">Catatan</th>
                      <th className="p-2 font-medium">Catatan<br/>Approver</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {loading ? (
                      <tr>
                        <td colSpan={11} className="p-2 text-center text-muted-foreground">
                          Memuat data...
                        </td>
                      </tr>
                    ) : filteredFormulas.length === 0 ? (
                      <tr>
                        <td colSpan={11} className="p-2 text-center text-muted-foreground">
                          Belum ada formula tersimpan
                        </td>
                      </tr>
                    ) : (
                      filteredFormulas.map((formula, index) => (
                        <tr key={formula.id} className="text-sm hover:bg-muted/50">
                          <td className="p-2 text-center">{index + 1}</td>
                          <td className="p-2">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm" className={`h-8 w-8 p-0 rounded text-white hover:text-white ${getStatusIconColor(formula.status)}`}>
                                  <Eye className="w-4 h-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => handleViewDetail(formula)}>
                                  Detail
                                </DropdownMenuItem>
                                {formula.status === 'draft' && (
                                  <DropdownMenuItem onClick={() => handleEditFormula(formula)}>
                                    Edit
                                  </DropdownMenuItem>
                                )}
                                <DropdownMenuItem onClick={() => handlePakaiRumus(formula)}>
                                  Pakai Rumus
                                </DropdownMenuItem>
                                {canAjukan(formula) && (
                                  <DropdownMenuItem onClick={() => handleAjukanFormula(formula)} className="text-blue-600">
                                    Ajukan untuk Persetujuan
                                  </DropdownMenuItem>
                                )}
                                {canSetujui(formula) && (
                                  <DropdownMenuItem onClick={() => handleSetujuiFormula(formula)} className="text-green-600">
                                    Setujui
                                  </DropdownMenuItem>
                                )}
                                {canTolak(formula) && (
                                  <DropdownMenuItem onClick={() => handleTolakFormula(formula)} className="text-orange-600">
                                    Tolak
                                  </DropdownMenuItem>
                                )}
                                {canFinalkan(formula) && (
                                  <DropdownMenuItem onClick={() => handleFinalkanFormula(formula)}>
                                    Finalkan
                                  </DropdownMenuItem>
                                )}
                                <DropdownMenuItem onClick={() => handleArsipkanFormula(formula)}>
                                  Arsipkan
                                </DropdownMenuItem>
                                {formula.status === 'draft' && (
                                  <DropdownMenuItem onClick={() => handleDeleteFormula(formula)} className="text-red-600">
                                    Hapus
                                  </DropdownMenuItem>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </td>
                          <td className="p-2">
                            <div className="font-medium">{formula.customer || '-'}</div>
                            <div className="text-xs text-muted-foreground">
                              {formula.salesPerson || '-'} | {formatDate(formula.tanggal)}
                            </div>
                          </td>
                          <td className="p-2">{formula.namaBarang || '-'}</td>
                          <td className="p-2">
                            <div className="font-medium text-blue-600">{formula.labelKode || '-'}</div>
                          </td>
                          <td className="p-2 text-right">{(formula.qty || 0).toLocaleString('id-ID')}</td>
                          <td className="p-2 text-right font-medium">Rp {(formula.hpp || 0).toLocaleString('id-ID')}</td>
                          <td className="p-2 text-right">
                            <div className="font-medium">Rp {(formula.hargaJual || 0).toLocaleString('id-ID')}</div>
                            {formula.opsiYangDipilih && (
                              <div className="text-xs text-muted-foreground mt-0.5">{formula.opsiYangDipilih}</div>
                            )}
                          </td>
                          <td className="p-2">
                            <Badge className={getStatusBadge(formula.status)}>
                              {formula.status.toUpperCase()}
                            </Badge>
                          </td>
                          <td className="p-2 text-muted-foreground">{formula.catatan || '-'}</td>
                          <td className="p-2 text-muted-foreground">{formula.catatanApprover || '-'}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab Content for Boks */}
        <TabsContent value="boks" className="mt-2">
          {/* Spesifikasi Produk & Hasil Perhitungan */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-2">
            {/* Spesifikasi Produk */}
            <Card className="lg:col-span-2">
              <CardContent className="p-2">
                <h3 className="text-sm font-semibold mb-2">Spesifikasi Produk</h3>

                <div className="grid grid-cols-2 gap-2">
                  {/* Column 1 */}
                  <div className="space-y-1">
                    {/* Nama Customer */}
                    <div className="grid grid-cols-[140px_1fr] gap-1 items-center">
                      <Label htmlFor="customer-boks" className="text-sm">Nama Customer</Label>
                      <Input
                        id="customer-boks"
                        value={formData.customer}
                        onChange={(e) => handleInputChange('customer', e.target.value)}
                        placeholder=""
                        className="h-6 text-sm"
                      />
                    </div>

                    {/* Nama Barang */}
                    <div className="grid grid-cols-[140px_1fr] gap-1 items-center">
                      <Label htmlFor="namaBarang-boks" className="text-sm">Nama Barang</Label>
                      <Input
                        id="namaBarang-boks"
                        value={formData.namaBarang}
                        onChange={(e) => handleInputChange('namaBarang', e.target.value)}
                        placeholder=""
                        className="h-6 text-sm"
                      />
                    </div>

                    {/* Area Desain Terbuka */}
                    <div className="grid grid-cols-[140px_1fr] gap-1 items-center">
                      <Label className="text-sm">Area Desain Terbuka</Label>
                      <div className="grid grid-cols-2 gap-1">
                        <Input
                          type="number"
                          value={formData.areaDesainPanjang}
                          onChange={(e) => handleInputChange('areaDesainPanjang', e.target.value)}
                          placeholder="Panjang (cm)"
                          className="h-6 text-sm"
                        />
                        <Input
                          type="number"
                          value={formData.areaDesainLebar}
                          onChange={(e) => handleInputChange('areaDesainLebar', e.target.value)}
                          placeholder="Lebar (cm)"
                          className="h-6 text-sm"
                        />
                      </div>
                    </div>

                    {/* Laminasi */}
                    <div className="grid grid-cols-[140px_1fr] gap-1 items-center">
                      <Label htmlFor="laminasi-boks" className="text-sm">Laminasi</Label>
                      <Select value={formData.laminasi} onValueChange={(value) => handleInputChange('laminasi', value)}>
                        <SelectTrigger id="laminasi-boks" size="xs" className="text-sm">
                          <SelectValue placeholder="- Pilih -" />
                        </SelectTrigger>
                        <SelectContent>
                          {LAMINASI_OPTIONS.map((option) => (
                            <SelectItem key={`boks-laminasi-${option}`} value={option}>
                              {option}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Jumlah / Mata */}
                    <div className="grid grid-cols-[140px_1fr] gap-1 items-center">
                      <Label className="text-sm">Jumlah / Mata</Label>
                      <div className="grid grid-cols-2 gap-1">
                        <Input
                          type="number"
                          value={formData.jumlah}
                          onChange={(e) => handleInputChange('jumlah', e.target.value)}
                          placeholder="1000"
                          className="h-6 text-sm"
                        />
                        <Input
                          type="number"
                          value={formData.mata}
                          onChange={(e) => handleInputChange('mata', e.target.value)}
                          placeholder="1"
                          className="h-6 text-sm"
                        />
                      </div>
                    </div>

                    {/* Warna / Mesin */}
                    <div className="grid grid-cols-[140px_1fr] gap-1 items-center">
                      <Label className="text-sm">Warna / Mesin</Label>
                      <div className="grid grid-cols-2 gap-1">
                        <Select value={formData.warna} onValueChange={(value) => handleInputChange('warna', value)}>
                          <SelectTrigger size="xs" className="text-sm">
                            <SelectValue placeholder="4 Warna" />
                          </SelectTrigger>
                          <SelectContent>
                            {WARNA_OPTIONS.map((option) => (
                              <SelectItem key={`boks-warna-${option}`} value={option}>
                                {option}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Select value={formData.mesin} onValueChange={(value) => handleInputChange('mesin', value)}>
                          <SelectTrigger size="xs" className="text-sm">
                            <SelectValue placeholder="52" />
                          </SelectTrigger>
                          <SelectContent>
                            {MESIN_OPTIONS.map((option) => (
                              <SelectItem key={`boks-mesin-${option}`} value={option}>
                                {option}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {/* Keterangan Warna */}
                    <div className="grid grid-cols-[140px_1fr] gap-1 items-center">
                      <Label htmlFor="keteranganWarna-boks" className="text-sm">Keterangan Warna</Label>
                      <Select value={formData.keteranganWarna} onValueChange={(value) => handleInputChange('keteranganWarna', value)}>
                        <SelectTrigger id="keteranganWarna-boks" size="xs" className="text-sm">
                          <SelectValue placeholder="Standar" />
                        </SelectTrigger>
                        <SelectContent>
                          {KETERANGAN_WARNA_OPTIONS.map((option) => (
                            <SelectItem key={`boks-ket-warna-${option}`} value={option}>
                              {option}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Cetak 2 Sisi / Warna */}
                    <div className="grid grid-cols-[140px_1fr] gap-1 items-center">
                      <Label className="text-sm">Cetak 2 Sisi / Warna</Label>
                      <div className="grid grid-cols-2 gap-1">
                        <Select value={formData.cetak2Sisi} onValueChange={(value) => handleInputChange('cetak2Sisi', value)}>
                          <SelectTrigger size="xs" className="text-sm">
                            <SelectValue placeholder="Tidak" />
                          </SelectTrigger>
                          <SelectContent>
                            {CETAK_2_SISI_OPTIONS.map((option) => (
                              <SelectItem key={`boks-cetak2sisi-${option}`} value={option}>
                                {option}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Select value={formData.cetak2SisiWarna} onValueChange={(value) => handleInputChange('cetak2SisiWarna', value)}>
                          <SelectTrigger size="xs" className="text-sm">
                            <SelectValue placeholder="Tanpa" />
                          </SelectTrigger>
                          <SelectContent>
                            {WARNA_OPTIONS.map((option) => (
                              <SelectItem key={`boks-cetak2sisi-warna-${option}`} value={option}>
                                {option}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {/* Jenis Kertas */}
                    <div className="grid grid-cols-[140px_1fr] gap-1 items-center">
                      <Label htmlFor="jenisKertas-boks" className="text-sm">Jenis Kertas</Label>
                      <Select value={formData.jenisKertas} onValueChange={(value) => handleInputChange('jenisKertas', value)}>
                        <SelectTrigger id="jenisKertas-boks" size="xs" className="text-sm">
                          <SelectValue placeholder="- Pilih -" />
                        </SelectTrigger>
                        <SelectContent>
                          {JENIS_KERTAS_OPTIONS.map((option) => (
                            <SelectItem key={`boks-jenis-kertas-${option}`} value={option}>
                              {option}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Gramasi */}
                    <div className="grid grid-cols-[140px_1fr] gap-1 items-center">
                      <Label htmlFor="gramasi-boks" className="text-sm">Gramasi</Label>
                      <Select value={formData.gramasi} onValueChange={(value) => handleInputChange('gramasi', value)}>
                        <SelectTrigger id="gramasi-boks" size="xs" className="text-sm">
                          <SelectValue placeholder="- Semua Gramasi -" />
                        </SelectTrigger>
                        <SelectContent>
                          {GRAMASI_OPTIONS.map((option) => (
                            <SelectItem key={`boks-gramasi-${option}`} value={option}>
                              {option}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Kertas (Manual) */}
                    <div className="grid grid-cols-[140px_1fr] gap-1 items-center">
                      <Label htmlFor="kertasManual-boks" className="text-sm">Kertas (Manual)</Label>
                      <Select value={formData.kertasManual} onValueChange={(value) => handleInputChange('kertasManual', value)}>
                        <SelectTrigger id="kertasManual-boks" size="xs" className="text-sm">
                          <SelectValue placeholder="Pilih Jenis Kertas" />
                        </SelectTrigger>
                        <SelectContent>
                          {JENIS_KERTAS_OPTIONS.map((option) => (
                            <SelectItem key={`boks-kertas-manual-${option}`} value={option}>
                              {option}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Column 2 */}
                  <div className="space-y-1">
                    {/* Harga Pisau */}
                    <div className="grid grid-cols-[140px_1fr] gap-1 items-center">
                      <Label htmlFor="hargaPisau-boks" className="text-sm">Harga Pisau</Label>
                      <Input
                        id="hargaPisau-boks"
                        value={formData.hargaPisau}
                        onChange={(e) => handleInputChange('hargaPisau', e.target.value)}
                        placeholder="Pisau"
                        className="h-6 text-sm"
                      />
                    </div>

                    {/* Desain Baru */}
                    <div className="grid grid-cols-[140px_1fr] gap-1 items-center">
                      <Label htmlFor="desainBaru-boks" className="text-sm">Desain Baru</Label>
                      <Select value={formData.desainBaru} onValueChange={(value) => handleInputChange('desainBaru', value)}>
                        <SelectTrigger id="desainBaru-boks" size="xs" className="text-sm">
                          <SelectValue placeholder="Tidak" />
                        </SelectTrigger>
                        <SelectContent>
                          {DESAIN_BARU_OPTIONS.map((option) => (
                            <SelectItem key={`boks-desain-${option}`} value={option}>
                              {option}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Lem Samping */}
                    <div className="grid grid-cols-[140px_1fr] gap-1 items-center">
                      <Label htmlFor="lemSamping-boks" className="text-sm">Lem Samping</Label>
                      <Select value={formData.lemSamping} onValueChange={(value) => handleInputChange('lemSamping', value)}>
                        <SelectTrigger id="lemSamping-boks" size="xs" className="text-sm">
                          <SelectValue placeholder="Tanpa Lem" />
                        </SelectTrigger>
                        <SelectContent>
                          {LEM_SAMPING_OPTIONS.map((option) => (
                            <SelectItem key={`boks-lem-${option}`} value={option}>
                              {option}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Panjang Lem */}
                    <div className="grid grid-cols-[140px_1fr] gap-1 items-center">
                      <Label htmlFor="panjangLem-boks" className="text-sm">Panjang Lem</Label>
                      <Input
                        id="panjangLem-boks"
                        type="number"
                        value={formData.panjangLem}
                        onChange={(e) => handleInputChange('panjangLem', e.target.value)}
                        placeholder="Lebar (cm)"
                        className="h-6 text-sm"
                      />
                    </div>

                    {/* Hotfoil */}
                    <div className="grid grid-cols-[140px_1fr] gap-1 items-center">
                      <Label htmlFor="hotfoil-boks" className="text-sm">Hotfoil</Label>
                      <Select value={formData.hotfoil} onValueChange={(value) => handleInputChange('hotfoil', value)}>
                        <SelectTrigger id="hotfoil-boks" size="xs" className="text-sm">
                          <SelectValue placeholder="Tidak" />
                        </SelectTrigger>
                        <SelectContent>
                          {YA_TIDAK_OPTIONS.map((option) => (
                            <SelectItem key={`boks-hotfoil-${option}`} value={option}>
                              {option}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Ukuran Hotfoil */}
                    <div className="grid grid-cols-[140px_1fr] gap-1 items-center">
                      <Label className="text-sm">Ukuran Hotfoil</Label>
                      <div className="grid grid-cols-2 gap-1">
                        <Input
                          type="number"
                          value={formData.hotfoilPanjang}
                          onChange={(e) => handleInputChange('hotfoilPanjang', e.target.value)}
                          placeholder="Panjang (cm)"
                          className="h-6 text-sm"
                        />
                        <Input
                          type="number"
                          value={formData.hotfoilLebar}
                          onChange={(e) => handleInputChange('hotfoilLebar', e.target.value)}
                          placeholder="Lebar (cm)"
                          className="h-6 text-sm"
                        />
                      </div>
                    </div>

                    {/* Emboss */}
                    <div className="grid grid-cols-[140px_1fr] gap-1 items-center">
                      <Label htmlFor="emboss-boks" className="text-sm">Emboss</Label>
                      <Select value={formData.emboss} onValueChange={(value) => handleInputChange('emboss', value)}>
                        <SelectTrigger id="emboss-boks" size="xs" className="text-sm">
                          <SelectValue placeholder="Tidak" />
                        </SelectTrigger>
                        <SelectContent>
                          {YA_TIDAK_OPTIONS.map((option) => (
                            <SelectItem key={`boks-emboss-${option}`} value={option}>
                              {option}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Ukuran Emboss */}
                    <div className="grid grid-cols-[140px_1fr] gap-1 items-center">
                      <Label className="text-sm">Ukuran Emboss</Label>
                      <div className="grid grid-cols-2 gap-1">
                        <Input
                          type="number"
                          value={formData.embossPanjang}
                          onChange={(e) => handleInputChange('embossPanjang', e.target.value)}
                          placeholder="Panjang (cm)"
                          className="h-6 text-sm"
                        />
                        <Input
                          type="number"
                          value={formData.embossLebar}
                          onChange={(e) => handleInputChange('embossLebar', e.target.value)}
                          placeholder="Lebar (cm)"
                          className="h-6 text-sm"
                        />
                      </div>
                    </div>

                    {/* Spot UV */}
                    <div className="grid grid-cols-[140px_1fr] gap-1 items-center">
                      <Label htmlFor="spotUV-boks" className="text-sm">Spot UV</Label>
                      <Select value={formData.spotUV} onValueChange={(value) => handleInputChange('spotUV', value)}>
                        <SelectTrigger id="spotUV-boks" size="xs" className="text-sm">
                          <SelectValue placeholder="Tidak" />
                        </SelectTrigger>
                        <SelectContent>
                          {YA_TIDAK_OPTIONS.map((option) => (
                            <SelectItem key={`boks-spotuv-${option}`} value={option}>
                              {option}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Ukuran Spot UV */}
                    <div className="grid grid-cols-[140px_1fr] gap-1 items-center">
                      <Label className="text-sm">Ukuran Spot UV</Label>
                      <div className="grid grid-cols-2 gap-1">
                        <Input
                          type="number"
                          value={formData.spotUVPanjang}
                          onChange={(e) => handleInputChange('spotUVPanjang', e.target.value)}
                          placeholder="Panjang (cm)"
                          className="h-6 text-sm"
                        />
                        <Input
                          type="number"
                          value={formData.spotUVLebar}
                          onChange={(e) => handleInputChange('spotUVLebar', e.target.value)}
                          placeholder="Lebar (cm)"
                          className="h-6 text-sm"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-1 mt-2">
                  <Button onClick={handleHitungEstimasi} className="flex-1 text-sm py-1 h-6 bg-blue-600 hover:bg-blue-700">
                    Hitung Estimasi
                  </Button>
                  <Button onClick={handleSimpanFormula} className="flex-1 text-sm py-1 h-6 bg-green-600 hover:bg-green-700">
                    Simpan Formula
                  </Button>
                  <Button onClick={handleKosongkanInput} variant="outline" className="flex-1 text-sm py-1 h-6">
                    Kosongkan Input
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Hasil Perhitungan */}
            <Card>
              <CardContent className="p-2">
                <h3 className="text-sm font-semibold mb-2">Simpan Formula Harga</h3>

                <div className="space-y-1">
                  {/* HPP Summary */}
                  <div className="flex justify-between items-center pb-1 border-b">
                    <span className="text-sm font-medium">HPP per Pcs</span>
                    <span className="text-sm font-bold text-blue-600">
                      Rp {hasilPerhitungan.hppPerPcs.toLocaleString('id-ID')}
                    </span>
                  </div>
                  <div className="flex justify-between items-center pb-1 border-b">
                    <span className="text-sm text-muted-foreground">
                      Total Cost ({hasilPerhitungan.qty} pcs)
                    </span>
                    <span className="text-sm font-medium">
                      Rp {hasilPerhitungan.totalCost.toLocaleString('id-ID')}
                    </span>
                  </div>

                  {/* Price Options Table */}
                  <div className="border rounded-lg overflow-hidden mt-2">
                    <table className="w-full text-sm">
                      <thead className="bg-muted">
                        <tr>
                          <th className="p-1.5 text-left font-medium">OPSI</th>
                          <th className="p-1.5 text-right font-medium">PER PCS</th>
                          <th className="p-1.5 text-right font-medium text-blue-600">+ PPN 11%</th>
                          <th className="p-1.5 text-right font-medium">TOTAL</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        <tr>
                          <td className="p-1.5">Opsi 1</td>
                          <td className="p-1.5 text-right">
                            Rp {hasilPerhitungan.opsi1.perPcs.toLocaleString('id-ID')}
                          </td>
                          <td className="p-1.5 text-right text-blue-600">
                            Rp {hasilPerhitungan.opsi1.ppn.toLocaleString('id-ID')}
                          </td>
                          <td className="p-1.5 text-right font-medium">
                            Rp {hasilPerhitungan.opsi1.total.toLocaleString('id-ID')}
                          </td>
                        </tr>
                        <tr>
                          <td className="p-1.5">Opsi 2</td>
                          <td className="p-1.5 text-right">
                            Rp {hasilPerhitungan.opsi2.perPcs.toLocaleString('id-ID')}
                          </td>
                          <td className="p-1.5 text-right text-blue-600">
                            Rp {hasilPerhitungan.opsi2.ppn.toLocaleString('id-ID')}
                          </td>
                          <td className="p-1.5 text-right font-medium">
                            Rp {hasilPerhitungan.opsi2.total.toLocaleString('id-ID')}
                          </td>
                        </tr>
                        <tr>
                          <td className="p-1.5 text-red-600 font-medium">Opsi 3</td>
                          <td className="p-1.5 text-right">
                            Rp {hasilPerhitungan.opsi3.perPcs.toLocaleString('id-ID')}
                          </td>
                          <td className="p-1.5 text-right text-blue-600">
                            Rp {hasilPerhitungan.opsi3.ppn.toLocaleString('id-ID')}
                          </td>
                          <td className="p-1.5 text-right font-medium text-red-600">
                            Rp {hasilPerhitungan.opsi3.total.toLocaleString('id-ID')}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Formula Boks Tersimpan */}
          <Card>
            <CardContent className="p-2">
              <h3 className="text-sm font-semibold mb-2">Formula Boks Tersimpan</h3>

              {/* Search and Filters */}
              <div className="flex gap-1 mb-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Cari: kode / label / customer / item..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9"
                  />
                </div>

                <Select value={filterSales} onValueChange={setFilterSales}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Semua Sales" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem key="sales-all-boks" value="all">Semua Sales</SelectItem>
                    <SelectItem key="sales-1-boks" value="sales1">Sales 1</SelectItem>
                    <SelectItem key="sales-2-boks" value="sales2">Sales 2</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Semua Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem key="status-all-boks" value="all">Semua Status</SelectItem>
                    <SelectItem key="status-draft-boks" value="draft">Draft</SelectItem>
                    <SelectItem key="status-final-boks" value="final">Final</SelectItem>
                    <SelectItem key="status-approved-boks" value="approved">Approved</SelectItem>
                  </SelectContent>
                </Select>

                <Button variant="outline" onClick={handleReset} className="bg-gray-600 text-white hover:bg-gray-700 hover:text-white">
                  Reset
                </Button>
              </div>

              {/* Table */}
              <div className="border rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead className="bg-muted">
                    <tr className="text-left text-xs uppercase">
                      <th className="p-2 font-medium w-12">#</th>
                      <th className="p-2 font-medium w-16">Aksi</th>
                      <th className="p-2 font-medium">Customer<br/>Sales | Tanggal</th>
                      <th className="p-2 font-medium">Nama Barang</th>
                      <th className="p-2 font-medium">Label Kode</th>
                      <th className="p-2 font-medium text-right">QTY</th>
                      <th className="p-2 font-medium text-right">HPP</th>
                      <th className="p-2 font-medium text-right">Harga Jual<br/>Opsi</th>
                      <th className="p-2 font-medium">Status</th>
                      <th className="p-2 font-medium">Catatan</th>
                      <th className="p-2 font-medium">Catatan<br/>Approver</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {loading ? (
                      <tr>
                        <td colSpan={11} className="p-2 text-center text-muted-foreground">
                          Memuat data...
                        </td>
                      </tr>
                    ) : filteredFormulas.length === 0 ? (
                      <tr>
                        <td colSpan={11} className="p-2 text-center text-muted-foreground">
                          Belum ada formula tersimpan
                        </td>
                      </tr>
                    ) : (
                      filteredFormulas.map((formula, index) => (
                        <tr key={formula.id} className="text-sm hover:bg-muted/50">
                          <td className="p-2 text-center">{index + 1}</td>
                          <td className="p-2">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm" className={`h-8 w-8 p-0 rounded text-white hover:text-white ${getStatusIconColor(formula.status)}`}>
                                  <Eye className="w-4 h-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => handleViewDetail(formula)}>
                                  Detail
                                </DropdownMenuItem>
                                {formula.status === 'draft' && (
                                  <DropdownMenuItem onClick={() => handleEditFormula(formula)}>
                                    Edit
                                  </DropdownMenuItem>
                                )}
                                <DropdownMenuItem onClick={() => handlePakaiRumus(formula)}>
                                  Pakai Rumus
                                </DropdownMenuItem>
                                {canAjukan(formula) && (
                                  <DropdownMenuItem onClick={() => handleAjukanFormula(formula)} className="text-blue-600">
                                    Ajukan untuk Persetujuan
                                  </DropdownMenuItem>
                                )}
                                {canSetujui(formula) && (
                                  <DropdownMenuItem onClick={() => handleSetujuiFormula(formula)} className="text-green-600">
                                    Setujui
                                  </DropdownMenuItem>
                                )}
                                {canTolak(formula) && (
                                  <DropdownMenuItem onClick={() => handleTolakFormula(formula)} className="text-orange-600">
                                    Tolak
                                  </DropdownMenuItem>
                                )}
                                {canFinalkan(formula) && (
                                  <DropdownMenuItem onClick={() => handleFinalkanFormula(formula)}>
                                    Finalkan
                                  </DropdownMenuItem>
                                )}
                                <DropdownMenuItem onClick={() => handleArsipkanFormula(formula)}>
                                  Arsipkan
                                </DropdownMenuItem>
                                {formula.status === 'draft' && (
                                  <DropdownMenuItem onClick={() => handleDeleteFormula(formula)} className="text-red-600">
                                    Hapus
                                  </DropdownMenuItem>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </td>
                          <td className="p-2">
                            <div className="font-medium">{formula.customer || '-'}</div>
                            <div className="text-xs text-muted-foreground">
                              {formula.salesPerson || '-'} | {formatDate(formula.tanggal)}
                            </div>
                          </td>
                          <td className="p-2">{formula.namaBarang || '-'}</td>
                          <td className="p-2">
                            <div className="font-medium text-blue-600">{formula.labelKode || '-'}</div>
                          </td>
                          <td className="p-2 text-right">{(formula.qty || 0).toLocaleString('id-ID')}</td>
                          <td className="p-2 text-right font-medium">Rp {(formula.hpp || 0).toLocaleString('id-ID')}</td>
                          <td className="p-2 text-right">
                            <div className="font-medium">Rp {(formula.hargaJual || 0).toLocaleString('id-ID')}</div>
                            {formula.opsiYangDipilih && (
                              <div className="text-xs text-muted-foreground mt-0.5">{formula.opsiYangDipilih}</div>
                            )}
                          </td>
                          <td className="p-2">
                            <Badge className={getStatusBadge(formula.status)}>
                              {formula.status.toUpperCase()}
                            </Badge>
                          </td>
                          <td className="p-2 text-muted-foreground">{formula.catatan || '-'}</td>
                          <td className="p-2 text-muted-foreground">{formula.catatanApprover || '-'}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab Content for Roto */}
        <TabsContent value="roto" className="mt-2">
          <div className="grid grid-cols-[1fr_400px] gap-2">
            {/* Card 1: Spesifikasi Roto */}
            <Card>
            <CardContent className="p-2">
              <h4 className="text-sm font-semibold mb-2">Spesifikasi Roto</h4>
              <div className="grid grid-cols-2 gap-2">
                {/* Column 1: Form Fields */}
                <div className="space-y-1">

                  {/* Nama Customer */}
                  <div className="grid grid-cols-[140px_1fr] gap-1 items-center">
                    <Label htmlFor="customer-roto" className="text-sm">Nama Customer</Label>
                    <Input
                      id="customer-roto"
                      value={formData.customer}
                      onChange={(e) => handleInputChange('customer', e.target.value)}
                      placeholder=""
                      className="h-6 text-sm"
                    />
                  </div>

                  {/* Nama Barang */}
                  <div className="grid grid-cols-[140px_1fr] gap-1 items-center">
                    <Label htmlFor="namaBarang-roto" className="text-sm">Nama Barang</Label>
                    <Input
                      id="namaBarang-roto"
                      value={formData.namaBarang}
                      onChange={(e) => handleInputChange('namaBarang', e.target.value)}
                      placeholder=""
                      className="h-6 text-sm"
                    />
                  </div>

                  {/* Jenis Bentuk */}
                  <div className="grid grid-cols-[140px_1fr] gap-1 items-center">
                    <Label htmlFor="jenisKemasan-roto" className="text-sm">Jenis Bentuk</Label>
                    <Select value={formData.jenisKemasan} onValueChange={(value) => handleInputChange('jenisKemasan', value)}>
                      <SelectTrigger id="jenisKemasan-roto" size="xs" className="text-sm">
                        <SelectValue placeholder="- Pilih -" />
                      </SelectTrigger>
                      <SelectContent>
                        {productTypes.map((type) => (
                          <SelectItem key={`roto-jenis-${type.id}`} value={type.name}>
                            {type.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Zipper */}
                  <div className="grid grid-cols-[140px_1fr] gap-1 items-center">
                    <Label htmlFor="ziplock-roto" className="text-sm">Zipper</Label>
                    <Select value={formData.ziplock} onValueChange={(value) => handleInputChange('ziplock', value)}>
                      <SelectTrigger size="xs" className="text-sm" id="ziplock-roto">
                        <SelectValue placeholder="Pilih ziplock" />
                      </SelectTrigger>
                      <SelectContent>
                        {ZIPLOCK_OPTIONS.map((option) => (
                          <SelectItem key={`roto-ziplock-${option}`} value={option}>
                            {option}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Toleransi Order (%) */}
                  <div className="grid grid-cols-[140px_1fr] gap-1 items-center">
                    <Label htmlFor="toleransiOrder-roto" className="text-sm">Toleransi Order (%)</Label>
                    <div className="relative">
                      <Input
                        id="toleransiOrder-roto"
                        type="number"
                        value={formData.toleransiOrder}
                        onChange={(e) => handleInputChange('toleransiOrder', e.target.value)}
                        placeholder="10"
                        className="h-6 text-sm pr-8"
                      />
                      <span className="absolute right-2 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">%</span>
                    </div>
                  </div>

                  {/* Lebar x Tinggi (cm) */}
                  <div className="grid grid-cols-[140px_1fr] gap-1 items-center">
                    <Label className="text-sm">Lebar x Tinggi (cm)</Label>
                    <div className="grid grid-cols-2 gap-1">
                      <Input className="h-6 text-sm"
                        type="number"
                        value={formData.ukuranLebar}
                        onChange={(e) => handleInputChange('ukuranLebar', e.target.value)}
                        placeholder="0"
                      />
                      <Input className="h-6 text-sm"
                        type="number"
                        value={formData.ukuranTinggi}
                        onChange={(e) => handleInputChange('ukuranTinggi', e.target.value)}
                        placeholder="0"
                      />
                    </div>
                  </div>

                  {/* Up | Pitch */}
                  <div className="grid grid-cols-[140px_1fr] gap-1 items-center">
                    <Label className="text-sm">Up | Pitch</Label>
                    <div className="grid grid-cols-2 gap-1">
                      <Input className="h-6 text-sm"
                        type="number"
                        value={formData.up}
                        onChange={(e) => handleInputChange('up', e.target.value)}
                        placeholder="Up"
                      />
                      <Input className="h-6 text-sm"
                        type="number"
                        value={formData.pitch}
                        onChange={(e) => handleInputChange('pitch', e.target.value)}
                        placeholder="Pitch"
                      />
                    </div>
                  </div>

                  {/* Posisi */}
                  <div className="grid grid-cols-[140px_1fr] gap-1 items-center">
                    <Label htmlFor="posisi-roto" className="text-sm">Posisi</Label>
                    <Select value={formData.posisi} onValueChange={(value) => handleInputChange('posisi', value)}>
                      <SelectTrigger size="xs" className="text-sm" id="posisi-roto">
                        <SelectValue placeholder="Portrait" />
                      </SelectTrigger>
                      <SelectContent>
                        {POSISI_OPTIONS.map((option) => (
                          <SelectItem key={`roto-posisi-${option}`} value={option}>
                            {option}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Qty (pcs) */}
                  <div className="grid grid-cols-[140px_1fr] gap-1 items-center">
                    <Label htmlFor="jumlah-roto" className="text-sm">Qty (pcs)</Label>
                    <Input className="h-6 text-sm"
                      id="jumlah-roto"
                      type="number"
                      value={formData.jumlah}
                      onChange={(e) => handleInputChange('jumlah', e.target.value)}
                      placeholder="1000"
                    />
                  </div>

                  {/* Perkiraan Kebutuhan Bahan */}
                  <div className="grid grid-cols-[140px_1fr] gap-1 items-center">
                    <Label className="text-sm font-semibold text-red-600 whitespace-nowrap">Perkiraan Kebutuhan Bahan</Label>
                    <div className="text-sm text-red-600 font-semibold text-right">0 meter</div>
                  </div>

                  {/* Adhesive */}
                  <div className="grid grid-cols-[140px_1fr] gap-1 items-center">
                    <Label htmlFor="adhesive-roto" className="text-sm">Adhesive</Label>
                    <Select value={formData.adhesive} onValueChange={(value) => handleInputChange('adhesive', value)}>
                      <SelectTrigger size="xs" className="text-sm" id="adhesive-roto">
                        <SelectValue placeholder="- Pilih -" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="alu">alu</SelectItem>
                        <SelectItem value="general">general</SelectItem>
                        <SelectItem value="retort">retort</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Jml Warna */}
                  <div className="grid grid-cols-[140px_1fr] gap-1 items-center">
                    <Label htmlFor="jmlWarna-roto" className="text-sm">Jml Warna</Label>
                    <Input className="h-6 text-sm"
                      id="jmlWarna-roto"
                      type="number"
                      value={formData.jmlWarna}
                      onChange={(e) => handleInputChange('jmlWarna', e.target.value)}
                      placeholder=""
                    />
                  </div>

                  {/* Ukuran Up */}
                  <div className="grid grid-cols-[140px_1fr] gap-1 items-center">
                    <Label htmlFor="ukuranUp-roto" className="text-sm">Ukuran Up</Label>
                    <div className="relative">
                      <Input
                        id="ukuranUp-roto"
                        type="number"
                        value={formData.ukuranUp}
                        onChange={(e) => handleInputChange('ukuranUp', e.target.value)}
                        placeholder="0"
                        className="h-6 text-sm pr-10"
                      />
                      <span className="absolute right-2 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">mm</span>
                    </div>
                  </div>

                  {/* Ukuran Pitch */}
                  <div className="grid grid-cols-[140px_1fr] gap-1 items-center">
                    <Label htmlFor="ukuranPitch-roto" className="text-sm">Ukuran Pitch</Label>
                    <div className="relative">
                      <Input
                        id="ukuranPitch-roto"
                        type="number"
                        value={formData.ukuranPitch}
                        onChange={(e) => handleInputChange('ukuranPitch', e.target.value)}
                        placeholder="0"
                        className="h-6 text-sm pr-10"
                      />
                      <span className="absolute right-2 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">mm</span>
                    </div>
                  </div>

                  {/* Lebar Image */}
                  <div className="grid grid-cols-[140px_1fr] gap-1 items-center">
                    <Label htmlFor="lebarImage-roto" className="text-sm">Lebar Image</Label>
                    <div className="relative">
                      <Input
                        id="lebarImage-roto"
                        type="number"
                        value={formData.lebarImage}
                        onChange={(e) => handleInputChange('lebarImage', e.target.value)}
                        placeholder="0"
                        className="h-6 text-sm pr-10"
                      />
                      <span className="absolute right-2 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">mm</span>
                    </div>
                  </div>

                  {/* Roll Dry */}
                  <div className="grid grid-cols-[140px_1fr] gap-1 items-center">
                    <Label htmlFor="rollDry-roto" className="text-sm">Roll Dry</Label>
                    <div>
                      <Select value={formData.rollDry} onValueChange={(value) => handleInputChange('rollDry', value)}>
                        <SelectTrigger size="xs" className="text-sm" id="rollDry-roto">
                          <SelectValue placeholder="- Pilih Roll Dry -" />
                        </SelectTrigger>
                        <SelectContent>
                          {ROLL_DRY_OPTIONS.map((option) => (
                            <SelectItem key={`roto-rollDry-${option}`} value={option}>
                              {option}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <p className="text-sm text-muted-foreground mt-0.5">Min: 9 mm</p>
                    </div>
                  </div>

                  {/* Lebar Bahan */}
                  <div className="grid grid-cols-[140px_1fr] gap-1 items-center">
                    <Label htmlFor="lebarBahan-roto" className="text-sm">Lebar Bahan</Label>
                    <div className="relative">
                      <Input
                        id="lebarBahan-roto"
                        type="number"
                        value={formData.lebarBahan}
                        onChange={(e) => handleInputChange('lebarBahan', e.target.value)}
                        placeholder="0"
                        className="h-6 text-sm pr-10"
                      />
                      <span className="absolute right-2 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">mm</span>
                    </div>
                  </div>

                  {/* Cylinder */}
                  <div className="grid grid-cols-[140px_1fr] gap-1 items-center">
                    <Label htmlFor="cylinder-roto" className="text-sm">Cylinder</Label>
                    <Select value={formData.cylinder} onValueChange={(value) => handleInputChange('cylinder', value)}>
                      <SelectTrigger size="xs" className="text-sm" id="cylinder-roto">
                        <SelectValue placeholder="Tidak Include" />
                      </SelectTrigger>
                      <SelectContent>
                        {CYLINDER_OPTIONS.map((option) => (
                          <SelectItem key={`roto-cylinder-${option}`} value={option}>
                            {option}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Jml Warna Cylinder */}
                  <div className="grid grid-cols-[140px_1fr] gap-1 items-center">
                    <Label htmlFor="jmlWarnaCylinder-roto" className="text-sm">Jml Warna Cylinder</Label>
                    <Input className="h-6 text-sm"
                      id="jmlWarnaCylinder-roto"
                      type="number"
                      value={formData.jmlWarnaCylinder}
                      onChange={(e) => handleInputChange('jmlWarnaCylinder', e.target.value)}
                      placeholder="0"
                    />
                  </div>
                </div>

                {/* Column 2: Jumlah Layer & Layer Forms */}
                <div className="space-y-1">
                  <h4 className="text-sm font-semibold mb-1">Jumlah Layer</h4>
                  <div className="grid grid-cols-4 gap-1 mb-1">
                    {['1', '2', '3', '4'].map((num) => (
                      <Button
                        key={`layer-${num}`}
                        type="button"
                        variant={formData.jumlahLayer === num ? 'default' : 'outline'}
                        size="sm"
                        className={`text-sm py-1 h-6 ${formData.jumlahLayer === num ? 'bg-blue-600 hover:bg-blue-700' : ''}`}
                        onClick={() => handleInputChange('jumlahLayer', num)}
                      >
                        {num}
                      </Button>
                    ))}
                  </div>

                {/* Layer Forms */}
                <div className="space-y-1">
                  {/* Layer 1 */}
                  {parseInt(formData.jumlahLayer) >= 1 && (
                    <div className="space-y-1">
                      <h4 className="text-sm font-semibold">Layer 1</h4>
                      <div className="space-y-1">
                        <Select value={formData.layer1Material} onValueChange={(value) => handleInputChange('layer1Material', value)}>
                          <SelectTrigger size="xs" className="text-sm">
                            <SelectValue placeholder="- Pilih Material -" />
                          </SelectTrigger>
                          <SelectContent>
                            {MATERIAL_OPTIONS.map((option) => (
                              <SelectItem key={`layer1-mat-${option}`} value={option}>
                                {option}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Input className="h-6 text-sm"
                          type="number"
                          value={formData.layer1Micron}
                          onChange={(e) => handleInputChange('layer1Micron', e.target.value)}
                          placeholder="Micron"
                        />
                        <Input className="h-6 text-sm"
                          type="number"
                          value={formData.layer1Lebar}
                          onChange={(e) => handleInputChange('layer1Lebar', e.target.value)}
                          placeholder="Lebar (mm)"
                        />
                        <Input className="h-6 text-sm"
                          type="number"
                          value={formData.layer1Panjang}
                          onChange={(e) => handleInputChange('layer1Panjang', e.target.value)}
                          placeholder="Panjang (m)"
                        />
                      </div>
                    </div>
                  )}

                  {/* Layer 2 */}
                  {parseInt(formData.jumlahLayer) >= 2 && (
                    <div className="space-y-1 border-t pt-1 mt-1">
                      <h4 className="text-sm font-semibold">Layer 2</h4>
                      <div className="space-y-1">
                        <Select value={formData.layer2Material} onValueChange={(value) => handleInputChange('layer2Material', value)}>
                          <SelectTrigger size="xs" className="text-sm">
                            <SelectValue placeholder="- Pilih Material -" />
                          </SelectTrigger>
                          <SelectContent>
                            {MATERIAL_OPTIONS.map((option) => (
                              <SelectItem key={`layer2-mat-${option}`} value={option}>
                                {option}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Input className="h-6 text-sm"
                          type="number"
                          value={formData.layer2Micron}
                          onChange={(e) => handleInputChange('layer2Micron', e.target.value)}
                          placeholder="Micron"
                        />
                        <Input className="h-6 text-sm"
                          type="number"
                          value={formData.layer2Lebar}
                          onChange={(e) => handleInputChange('layer2Lebar', e.target.value)}
                          placeholder="Lebar (mm)"
                        />
                        <Input className="h-6 text-sm"
                          type="number"
                          value={formData.layer2Panjang}
                          onChange={(e) => handleInputChange('layer2Panjang', e.target.value)}
                          placeholder="Panjang (m)"
                        />
                      </div>
                    </div>
                  )}

                  {/* Layer 3 */}
                  {parseInt(formData.jumlahLayer) >= 3 && (
                    <div className="space-y-1 border-t pt-1 mt-1">
                      <h4 className="text-sm font-semibold">Layer 3</h4>
                      <div className="space-y-1">
                        <Select value={formData.layer3Material} onValueChange={(value) => handleInputChange('layer3Material', value)}>
                          <SelectTrigger size="xs" className="text-sm">
                            <SelectValue placeholder="- Pilih Material -" />
                          </SelectTrigger>
                          <SelectContent>
                            {MATERIAL_OPTIONS.map((option) => (
                              <SelectItem key={`layer3-mat-${option}`} value={option}>
                                {option}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Input className="h-6 text-sm"
                          type="number"
                          value={formData.layer3Micron}
                          onChange={(e) => handleInputChange('layer3Micron', e.target.value)}
                          placeholder="Micron"
                        />
                        <Input className="h-6 text-sm"
                          type="number"
                          value={formData.layer3Lebar}
                          onChange={(e) => handleInputChange('layer3Lebar', e.target.value)}
                          placeholder="Lebar (mm)"
                        />
                        <Input className="h-6 text-sm"
                          type="number"
                          value={formData.layer3Panjang}
                          onChange={(e) => handleInputChange('layer3Panjang', e.target.value)}
                          placeholder="Panjang (m)"
                        />
                      </div>
                    </div>
                  )}

                  {/* Layer 4 */}
                  {parseInt(formData.jumlahLayer) >= 4 && (
                    <div className="space-y-1 border-t pt-1 mt-1">
                      <h4 className="text-sm font-semibold">Layer 4</h4>
                      <div className="space-y-1">
                        <Select value={formData.layer4Material} onValueChange={(value) => handleInputChange('layer4Material', value)}>
                          <SelectTrigger size="xs" className="text-sm">
                            <SelectValue placeholder="- Pilih Material -" />
                          </SelectTrigger>
                          <SelectContent>
                            {MATERIAL_OPTIONS.map((option) => (
                              <SelectItem key={`layer4-mat-${option}`} value={option}>
                                {option}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Input className="h-6 text-sm"
                          type="number"
                          value={formData.layer4Micron}
                          onChange={(e) => handleInputChange('layer4Micron', e.target.value)}
                          placeholder="Micron"
                        />
                        <Input className="h-6 text-sm"
                          type="number"
                          value={formData.layer4Lebar}
                          onChange={(e) => handleInputChange('layer4Lebar', e.target.value)}
                          placeholder="Lebar (mm)"
                        />
                        <Input className="h-6 text-sm"
                          type="number"
                          value={formData.layer4Panjang}
                          onChange={(e) => handleInputChange('layer4Panjang', e.target.value)}
                          placeholder="Panjang (m)"
                        />
                      </div>
                    </div>
                  )}
                </div>

                  {/* Perkiraan Hasil */}
                  <div className="grid grid-cols-[140px_1fr] gap-1 items-center border-t pt-1 mt-1">
                    <Label className="text-sm font-semibold text-red-600 whitespace-nowrap">Perkiraan Hasil</Label>
                    <div className="text-sm font-bold text-red-600 text-right">0 pcs</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

            {/* Card 2: Simpan Formula Harga */}
            <Card>
            <CardContent className="p-2">
              <h4 className="text-xs font-semibold mb-2">Simpan Formula Harga</h4>

              {/* Cost Summary */}
              <div className="space-y-1 mb-2">
                <div className="flex justify-between items-center text-xs">
                  <span>Total Cost (Produksi)</span>
                  <span className="font-medium">0</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span>HPP Produksi / pcs</span>
                  <span className="font-medium">0</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span>HPP Produksi + PPN 11%</span>
                  <span className="font-medium">0</span>
                </div>
                <div className="flex justify-between items-center text-xs border-t pt-1 mt-1">
                  <span>HPP Jual / pcs</span>
                  <span className="font-medium text-blue-600">0</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span>HPP Jual + PPN 11%</span>
                  <span className="font-medium">0</span>
                </div>
              </div>

              {/* Price Table */}
              <div className="border rounded-lg overflow-hidden">
                <table className="w-full text-xs">
                  <thead className="bg-muted">
                    <tr>
                      <th className="p-1 text-left font-medium">OPSI</th>
                      <th className="p-1 text-right font-medium">/ PCS</th>
                      <th className="p-1 text-right font-medium">TOTAL</th>
                      <th className="p-1 text-right font-medium">MARGIN</th>
                      <th className="p-1 text-right font-medium">INCL PPN 11%</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-t">
                      <td className="p-1 bg-yellow-100">Custom</td>
                      <td className="p-1 text-right">
                        <Input
                          type="number"
                          placeholder="Harga jual / pcs"
                          className="h-6 text-right text-xs"
                        />
                      </td>
                      <td className="p-1 text-right">0</td>
                      <td className="p-1 text-right">0</td>
                      <td className="p-1 text-right">0</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-3 gap-1 mt-2">
            <Button onClick={handleHitungEstimasi} className="bg-blue-600 hover:bg-blue-700 text-sm py-1 h-6">
              Hitung Estimasi
            </Button>
            <Button onClick={handleSimpanFormula} className="bg-green-600 hover:bg-green-700 text-sm py-1 h-6">
              Simpan Formula
            </Button>
            <Button onClick={handleKosongkanInput} variant="outline" className="text-sm py-1 h-6">
              Reset Input
            </Button>
          </div>

          {/* Formula Roto Tersimpan */}
          <Card>
            <CardContent className="p-2">
              <h3 className="text-sm font-semibold mb-2">Formula Roto Tersimpan</h3>

              {/* Search and Filters */}
              <div className="flex gap-1 mb-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Cari kode, label, customer, sales, bentuk, catatan..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="h-6 text-sm pl-9"
                  />
                </div>

                <Select value={filterSales} onValueChange={setFilterSales}>
                  <SelectTrigger className="w-48 h-6 text-sm">
                    <SelectValue placeholder="Semua Sales" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem key="sales-all-roto" value="all">Semua Sales</SelectItem>
                    <SelectItem key="sales-1-roto" value="sales1">Sales 1</SelectItem>
                    <SelectItem key="sales-2-roto" value="sales2">Sales 2</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="w-48 h-6 text-sm">
                    <SelectValue placeholder="- Semua Status -" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem key="status-all-roto" value="all">Semua Status</SelectItem>
                    <SelectItem key="status-draft-roto" value="draft">Draft</SelectItem>
                    <SelectItem key="status-diajukan-roto" value="diajukan">Diajukan</SelectItem>
                    <SelectItem key="status-approved-roto" value="approved">Approved</SelectItem>
                  </SelectContent>
                </Select>

                <Button variant="outline" onClick={handleReset} className="bg-gray-600 text-white hover:bg-gray-700 hover:text-white">
                  Reset
                </Button>
              </div>

              {/* Table */}
              <div className="border rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead className="bg-muted">
                    <tr className="text-left text-xs uppercase">
                      <th className="p-2 font-medium w-12">#</th>
                      <th className="p-2 font-medium w-16">Aksi</th>
                      <th className="p-2 font-medium">Customer<br/>Sales | Tanggal</th>
                      <th className="p-2 font-medium">Nama Barang</th>
                      <th className="p-2 font-medium">Label Kode</th>
                      <th className="p-2 font-medium text-right">QTY</th>
                      <th className="p-2 font-medium text-right">HPP</th>
                      <th className="p-2 font-medium text-right">Harga Jual<br/>Opsi</th>
                      <th className="p-2 font-medium">Status</th>
                      <th className="p-2 font-medium">Catatan</th>
                      <th className="p-2 font-medium">Catatan<br/>Approver</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {loading ? (
                      <tr>
                        <td colSpan={11} className="p-2 text-center text-muted-foreground">
                          Memuat data...
                        </td>
                      </tr>
                    ) : filteredFormulas.length === 0 ? (
                      <tr>
                        <td colSpan={11} className="p-2 text-center text-muted-foreground">
                          Belum ada formula tersimpan
                        </td>
                      </tr>
                    ) : (
                      filteredFormulas.map((formula, index) => (
                        <tr key={formula.id} className="text-sm hover:bg-muted/50">
                          <td className="p-2 text-center">{index + 1}</td>
                          <td className="p-2">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded bg-yellow-600 text-white hover:bg-yellow-700 hover:text-white">
                                  <Eye className="w-4 h-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => handleViewDetail(formula)}>
                                  Detail
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleEditFormula(formula)}>
                                  Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handlePakaiRumus(formula)}>
                                  Pakai Rumus
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleAjukanFormula(formula)}>
                                  Ajukan
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleSetujuiFormula(formula)}>
                                  Setujui
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleFinalkanFormula(formula)}>
                                  Finalkan
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleArsipkanFormula(formula)}>
                                  Arsipkan
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleDeleteFormula(formula)} className="text-red-600">
                                  Hapus
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </td>
                          <td className="p-2">
                            <div className="font-medium">{formula.customer || '-'}</div>
                            <div className="text-xs text-muted-foreground">
                              {formula.salesPerson || '-'} | {formatDate(formula.tanggal)}
                            </div>
                          </td>
                          <td className="p-2">{formula.namaBarang || '-'}</td>
                          <td className="p-2">
                            <div className="font-medium text-blue-600">{formula.labelKode || '-'}</div>
                          </td>
                          <td className="p-2 text-right">{(formula.qty || 0).toLocaleString('id-ID')}</td>
                          <td className="p-2 text-right font-medium">Rp {(formula.hpp || 0).toLocaleString('id-ID')}</td>
                          <td className="p-2 text-right">
                            <div className="font-medium">Rp {(formula.hargaJual || 0).toLocaleString('id-ID')}</div>
                            {formula.opsiYangDipilih && (
                              <div className="text-xs text-muted-foreground mt-0.5">{formula.opsiYangDipilih}</div>
                            )}
                          </td>
                          <td className="p-2">
                            <Badge className={getStatusBadge(formula.status)}>
                              {formula.status.toUpperCase()}
                            </Badge>
                          </td>
                          <td className="p-2 text-muted-foreground">{formula.catatan || '-'}</td>
                          <td className="p-2 text-muted-foreground">{formula.catatanApprover || '-'}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Master Tab */}
        <TabsContent value="master" className="mt-2">
          <Card>
            <CardContent className="p-2">
              {/* Header Section */}
              <div className="flex items-center gap-2 mb-2">
                {/* Category Dropdown */}
                <Select value={masterCategory} onValueChange={setMasterCategory}>
                  <SelectTrigger className="w-64">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="biaya_proses">BIAYA PROSES</SelectItem>
                    <SelectItem value="bahan">BAHAN</SelectItem>
                    <SelectItem value="finishing">FINISHING</SelectItem>
                    <SelectItem value="lainnya">LAINNYA</SelectItem>
                  </SelectContent>
                </Select>

                {/* Add Data Button */}
                <Button
                  className="bg-blue-600 hover:bg-blue-700"
                  onClick={handleAddMasterData}
                >
                  + Tambah Data
                </Button>

                {/* Spacer */}
                <div className="flex-1" />

                {/* Search */}
                <div className="relative w-80">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Cari Kode atau Nama..."
                    value={masterSearch}
                    onChange={(e) => setMasterSearch(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>

              {/* Table */}
              <div className="border rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead className="bg-muted">
                    <tr className="text-left text-xs uppercase text-muted-foreground">
                      {masterCategory === 'bahan' ? (
                        <>
                          <th className="p-2 font-medium w-16">NO</th>
                          <th className="p-2 font-medium">KATEGORI BARANG</th>
                          <th className="p-2 font-medium">TIPE BARANG</th>
                          <th className="p-2 font-medium">JENIS PROSES</th>
                          <th className="p-2 font-medium">KODE BARANG</th>
                          <th className="p-2 font-medium">NAMA BARANG</th>
                          <th className="p-2 font-medium">SATUAN</th>
                          <th className="p-2 font-medium">JUMLAH STOCK</th>
                          <th className="p-2 font-medium">HARGA</th>
                          <th className="p-2 font-medium">KETERANGAN</th>
                          <th className="p-2 font-medium text-right w-32">AKSI</th>
                        </>
                      ) : (
                        <>
                          <th className="p-2 font-medium w-16">NO</th>
                          <th className="p-2 font-medium">KODE</th>
                          <th className="p-2 font-medium">PROSES</th>
                          <th className="p-2 font-medium">COST</th>
                          <th className="p-2 font-medium">KETERANGAN</th>
                          <th className="p-2 font-medium text-right w-48">AKSI</th>
                        </>
                      )}
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {filteredMasterData.length === 0 ? (
                      <tr>
                        <td colSpan={masterCategory === 'bahan' ? 11 : 6} className="p-2 text-center text-muted-foreground">
                          Tidak ada data
                        </td>
                      </tr>
                    ) : (
                      filteredMasterData.map((item, index) => (
                        <tr key={item.id} className="hover:bg-muted/50">
                          {masterCategory === 'bahan' ? (
                            <>
                              <td className="p-2 text-sm text-blue-600">{index + 1}</td>
                              <td className="p-2 text-sm">{item.kategoriBahan || '-'}</td>
                              <td className="p-2 text-sm">{item.tipeBahan || '-'}</td>
                              <td className="p-2 text-sm">{item.jenisProses || '-'}</td>
                              <td className="p-2 text-sm text-muted-foreground">{item.kodeBarang || '-'}</td>
                              <td className="p-2 text-sm font-medium text-blue-900">{item.namaBarang || '-'}</td>
                              <td className="p-2 text-sm">{item.satuan || '-'}</td>
                              <td className="p-2 text-sm text-right">{item.jumlahStock?.toLocaleString('id-ID') || '0'}</td>
                              <td className="p-2 text-sm">Rp {(item.harga || 0).toLocaleString('id-ID')}</td>
                              <td className="p-2 text-sm text-muted-foreground">{item.keterangan || '-'}</td>
                              <td className="p-2">
                                <div className="flex gap-1 justify-end">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="text-green-600 border-green-600 hover:bg-green-50 hover:text-green-700"
                                    onClick={() => handleEditMasterData(item)}
                                  >
                                    Edit
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="text-red-600 border-red-600 hover:bg-red-50 hover:text-red-700"
                                    onClick={() => handleDeleteMasterData(item)}
                                  >
                                    Delete
                                  </Button>
                                </div>
                              </td>
                            </>
                          ) : (
                            <>
                              <td className="p-2 text-sm text-blue-600">{index + 1}</td>
                              <td className="p-2 text-sm text-muted-foreground">{item.kode}</td>
                              <td className="p-2 text-sm font-medium text-blue-900">{item.proses}</td>
                              <td className="p-2 text-sm">Rp {item.cost.toLocaleString('id-ID')}</td>
                              <td className="p-2 text-sm text-muted-foreground">{item.keterangan || '-'}</td>
                              <td className="p-2">
                                <div className="flex gap-1 justify-end">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="text-green-600 border-green-600 hover:bg-green-50 hover:text-green-700"
                                  >
                                    Edit
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="text-red-600 border-red-600 hover:bg-red-50 hover:text-red-700"
                                  >
                                    Delete
                                  </Button>
                                </div>
                              </td>
                            </>
                          )}
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Save Formula Modal */}
      <Dialog open={showSaveModal} onOpenChange={setShowSaveModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Simpan Formula Harga</DialogTitle>
          </DialogHeader>

          <div className="space-y-3">
            <div className="grid grid-cols-[180px_1fr] gap-4 items-center">
              <Label htmlFor="salesPersonModal" className="text-right">Sales Person</Label>
              <Input
                id="salesPersonModal"
                value={saveModalData.salesPerson}
                readOnly
                className="bg-muted"
              />
            </div>

            <div className="grid grid-cols-[180px_1fr] gap-4 items-center">
              <Label className="text-right">Nama Customer</Label>
              <Popover open={openCustomerCombobox} onOpenChange={setOpenCustomerCombobox}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={openCustomerCombobox}
                    className="justify-between font-normal"
                  >
                    {saveModalData.namaCustomer || "Pilih atau ketik customer..."}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[400px] p-0" align="start">
                  <Command>
                    <CommandInput 
                      placeholder="Cari atau ketik nama customer..." 
                      value={customerSearchValue}
                      onValueChange={setCustomerSearchValue}
                    />
                    <CommandList>
                      <CommandEmpty>
                        <div className="p-2 text-sm">
                          <p className="mb-2">Customer tidak ditemukan.</p>
                          <Button
                            size="sm"
                            onClick={() => {
                              if (customerSearchValue.trim()) {
                                setSaveModalData({ ...saveModalData, namaCustomer: customerSearchValue });
                                setOpenCustomerCombobox(false);
                                setCustomerSearchValue('');
                              }
                            }}
                            className="w-full"
                          >
                            Gunakan "{customerSearchValue}"
                          </Button>
                        </div>
                      </CommandEmpty>
                      <CommandGroup>
                        {customers.map((customer) => (
                          <CommandItem
                            key={customer.id}
                            value={customer.nama_customer}
                            onSelect={(currentValue) => {
                              setSaveModalData({ 
                                ...saveModalData, 
                                namaCustomer: customer.nama_customer 
                              });
                              setOpenCustomerCombobox(false);
                              setCustomerSearchValue('');
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                saveModalData.namaCustomer === customer.nama_customer ? "opacity-100" : "opacity-0"
                              )}
                            />
                            <div className="flex flex-col">
                              <span className="font-medium">{customer.nama_customer}</span>
                              {customer.kode_customer && (
                                <span className="text-xs text-muted-foreground">
                                  Kode: {customer.kode_customer}
                                </span>
                              )}
                            </div>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>

            <div className="grid grid-cols-[180px_1fr] gap-4 items-center">
              <Label className="text-right">Nama Barang</Label>
              <Popover open={openBarangCombobox} onOpenChange={setOpenBarangCombobox}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={openBarangCombobox}
                    className="justify-between font-normal"
                  >
                    {saveModalData.namaBarang || "Pilih atau ketik barang..."}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[400px] p-0" align="start">
                  <Command>
                    <CommandInput 
                      placeholder="Cari atau ketik nama barang..." 
                      value={barangSearchValue}
                      onValueChange={setBarangSearchValue}
                    />
                    <CommandList>
                      <CommandEmpty>
                        <div className="p-2 text-sm">
                          <p className="mb-2">Barang tidak ditemukan.</p>
                          <Button
                            size="sm"
                            onClick={() => {
                              if (barangSearchValue.trim()) {
                                setSaveModalData({ ...saveModalData, namaBarang: barangSearchValue });
                                setOpenBarangCombobox(false);
                                setBarangSearchValue('');
                              }
                            }}
                            className="w-full"
                          >
                            Gunakan "{barangSearchValue}"
                          </Button>
                        </div>
                      </CommandEmpty>
                      <CommandGroup>
                        {barangs.map((barang) => (
                          <CommandItem
                            key={barang.id}
                            value={barang.nama_barang}
                            onSelect={(currentValue) => {
                              setSaveModalData({ 
                                ...saveModalData, 
                                namaBarang: barang.nama_barang 
                              });
                              setOpenBarangCombobox(false);
                              setBarangSearchValue('');
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                saveModalData.namaBarang === barang.nama_barang ? "opacity-100" : "opacity-0"
                              )}
                            />
                            <div className="flex flex-col">
                              <span className="font-medium">{barang.nama_barang}</span>
                              {barang.kode_barang && (
                                <span className="text-xs text-muted-foreground">
                                  Kode: {barang.kode_barang}
                                </span>
                              )}
                            </div>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>

            <div className="grid grid-cols-[180px_1fr] gap-4 items-center">
              <Label htmlFor="hargaJualPcsModal" className="text-right">Harga Jual (Pcs)</Label>
              <Input
                id="hargaJualPcsModal"
                type="number"
                value={saveModalData.hargaJualPcs}
                onChange={(e) => setSaveModalData({ ...saveModalData, hargaJualPcs: parseFloat(e.target.value) || 0 })}
                placeholder="0"
              />
            </div>

            <div className="grid grid-cols-[180px_1fr] gap-4 items-center">
              <Label htmlFor="opsiYangDipilihModal" className="text-right">Opsi yang Dipilih</Label>
              <Select
                value={saveModalData.opsiYangDipilih}
                onValueChange={(value) => setSaveModalData({ ...saveModalData, opsiYangDipilih: value })}
              >
                <SelectTrigger id="opsiYangDipilihModal">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Opsi 1">Opsi 1</SelectItem>
                  <SelectItem value="Opsi 2">Opsi 2</SelectItem>
                  <SelectItem value="Opsi 3">Opsi 3</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-[180px_1fr] gap-4 items-start">
              <Label htmlFor="catatanModal" className="text-right pt-2">Catatan</Label>
              <Textarea
                id="catatanModal"
                value={saveModalData.catatan}
                onChange={(e) => setSaveModalData({ ...saveModalData, catatan: e.target.value })}
                placeholder="Masukkan catatan tambahan"
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSaveModal(false)}>
              Batal
            </Button>
            <Button onClick={handleConfirmSave}>
              Simpan Formula
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Detail Formula Modal */}
      <Dialog open={showDetailModal} onOpenChange={setShowDetailModal}>
        <DialogContent className="!w-[90vw] sm:!max-w-[70vw] md:!max-w-[70vw] lg:!max-w-[70vw] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              <div className="flex items-center gap-2">
                <span>Detail Formula</span>
                <Badge className="bg-blue-600 text-white">
                  {selectedFormula?.labelKode || '-'}
                </Badge>
                <span className="text-sm text-muted-foreground font-normal">
                  {selectedFormula?.jenisKemasan || ''} {selectedFormula?.jmlMata || ''}
                </span>
              </div>
            </DialogTitle>
          </DialogHeader>

          {selectedFormula && selectedFormula.type === 'flexibel' ? (
            <div className="grid grid-cols-[320px_1fr] gap-6">
              {/* Left Column */}
              <div className="space-y-4">
                {/* Informasi Umum */}
                <div className="bg-muted/20 p-4 rounded-lg border">
                  <h3 className="font-semibold text-sm mb-3 text-blue-600">Informasi Umum</h3>
                  <div className="space-y-2.5 text-xs">
                    <div className="grid grid-cols-[100px_1fr] gap-2 items-center">
                      <span className="text-muted-foreground">Sales</span>
                      <span className="font-medium">{selectedFormula.salesPerson || '-'}</span>
                    </div>
                    <div className="grid grid-cols-[100px_1fr] gap-2 items-center">
                      <span className="text-muted-foreground">Customer</span>
                      <span className="font-medium">{selectedFormula.customer || '-'}</span>
                    </div>
                    <div className="grid grid-cols-[100px_1fr] gap-2 items-center">
                      <span className="text-muted-foreground">Item Barang</span>
                      <span className="font-medium">{selectedFormula.namaBarang || '-'}</span>
                    </div>
                    <div className="grid grid-cols-[100px_1fr] gap-2 items-center">
                      <span className="text-muted-foreground">Status</span>
                      <Badge className={getStatusBadge(selectedFormula.status || 'draft')}>
                        {selectedFormula.status?.toUpperCase() || 'DRAFT'}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-[100px_1fr] gap-2 items-center">
                      <span className="text-muted-foreground">Tanggal</span>
                      <span className="font-medium">{formatDate(selectedFormula.tanggal)}</span>
                    </div>
                  </div>
                </div>

                {/* Spesifikasi Produk */}
                <div className="bg-muted/20 p-4 rounded-lg border">
                  <h3 className="font-semibold text-sm mb-3 text-blue-600">Spesifikasi Produk</h3>
                  <div className="space-y-2.5 text-xs">
                    <div className="grid grid-cols-[100px_1fr] gap-2 items-center">
                      <span className="text-muted-foreground">Jenis Bentuk</span>
                      <span className="font-medium">{selectedFormula.jenisKemasan || '-'}</span>
                    </div>
                    <div className="grid grid-cols-[100px_1fr] gap-2 items-center">
                      <span className="text-muted-foreground">Material</span>
                      <span className="font-medium">{selectedFormula.bahan || '-'}</span>
                    </div>
                    <div className="grid grid-cols-[100px_1fr] gap-2 items-center">
                      <span className="text-muted-foreground">Ziplock</span>
                      <span className="font-medium">{selectedFormula.ziplock || 'Tidak'}</span>
                    </div>
                    <div className="grid grid-cols-[100px_1fr] gap-2 items-center">
                      <span className="text-muted-foreground">Ukuran</span>
                      <span className="font-medium">{selectedFormula.ukuranLebar} x {selectedFormula.ukuranTinggi} cm</span>
                    </div>
                    <div className="grid grid-cols-[100px_1fr] gap-2 items-center">
                      <span className="text-muted-foreground">Jml Mata</span>
                      <span className="font-medium">{selectedFormula.jmlMata || '-'}</span>
                    </div>
                    <div className="grid grid-cols-[100px_1fr] gap-2 items-center">
                      <span className="text-muted-foreground">Qty</span>
                      <span className="font-medium">{(selectedFormula.jumlah || 0).toLocaleString('id-ID')} pcs</span>
                    </div>
                    <div className="grid grid-cols-[100px_1fr] gap-2 items-center">
                      <span className="text-muted-foreground">Alas</span>
                      <span className="font-medium">{selectedFormula.alas || '-'}</span>
                    </div>
                    <div className="grid grid-cols-[100px_1fr] gap-2 items-center">
                      <span className="text-muted-foreground">Layout</span>
                      <span className="font-medium">{selectedFormula.layoutLebar} x {selectedFormula.layoutPanjang} cm</span>
                    </div>
                    <div className="grid grid-cols-[100px_1fr] gap-2 items-center">
                      <span className="text-muted-foreground">Kertas</span>
                      <span className="font-medium text-xs">{selectedFormula.ukuranKertas || '-'}</span>
                    </div>
                    <div className="grid grid-cols-[100px_1fr] gap-2 items-center">
                      <span className="text-muted-foreground">Harga Plano</span>
                      <span className="font-medium">Rp {(1667).toLocaleString('id-ID')}</span>
                    </div>
                    <div className="grid grid-cols-[100px_1fr] gap-2 items-center">
                      <span className="text-muted-foreground">Jml Potong</span>
                      <span className="font-medium">{selectedFormula.jmlPotong || '-'}</span>
                    </div>
                    <div className="grid grid-cols-[100px_1fr] gap-2 items-center">
                      <span className="text-muted-foreground">Jumlah Cetak</span>
                      <span className="font-medium">850 lbr (Naik 1x)</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column */}
              <div className="space-y-4">
                {/* HPP / Laminasi and Harga Jual */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-purple-50 dark:bg-purple-950 p-3 rounded-lg border border-purple-200 dark:border-purple-800">
                    <h4 className="text-xs font-semibold mb-2.5 text-purple-700 dark:text-purple-300">HPP / Laminasi</h4>
                    <div className="space-y-1.5 text-xs">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Metalis Glossy</span>
                        <span className="font-semibold">Rp {(563).toLocaleString('id-ID')}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Foil Glossy</span>
                        <span className="font-semibold">Rp {(686).toLocaleString('id-ID')}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Foil Doff</span>
                        <span className="font-semibold">Rp {(679).toLocaleString('id-ID')}</span>
                      </div>
                    </div>
                  </div>
                  <div className="bg-green-50 dark:bg-green-950 p-3 rounded-lg border border-green-200 dark:border-green-800">
                    <h4 className="text-xs font-semibold mb-2.5 text-green-700 dark:text-green-300">Harga Jual - PM</h4>
                    <div className="space-y-1.5 text-xs">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Opsi 1</span>
                        <span className="font-semibold">Rp {(638).toLocaleString('id-ID')}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Opsi 2</span>
                        <span className="font-semibold">Rp {(744).toLocaleString('id-ID')}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Opsi 3</span>
                        <span className="font-semibold">Rp {(876).toLocaleString('id-ID')}</span>
                      </div>
                    </div>
                  </div>
                  <div className="bg-blue-50 dark:bg-blue-950 p-3 rounded-lg border border-blue-200 dark:border-blue-800">
                    <h4 className="text-xs font-semibold mb-2.5 text-blue-700 dark:text-blue-300">Harga Jual - PF</h4>
                    <div className="space-y-1.5 text-xs">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Opsi 1</span>
                        <span className="font-semibold">Rp {(755).toLocaleString('id-ID')}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Opsi 2</span>
                        <span className="font-semibold">Rp {(878).toLocaleString('id-ID')}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Opsi 3</span>
                        <span className="font-semibold">Rp {(950).toLocaleString('id-ID')}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Rincian Breakdown Detail */}
                <div className="border rounded-lg p-4 bg-muted/10">
                  <h3 className="font-semibold text-sm text-center mb-4 text-blue-600">Rincian Breakdown Detail</h3>

                  <div className="grid grid-cols-2 gap-4">
                    {/* TARIF DASAR & PROSES */}
                    <div className="space-y-2">
                      <div className="bg-blue-600 text-white px-3 py-1.5 rounded text-xs font-semibold text-center">
                        TARIF DASAR
                      </div>
                      <div className="bg-muted/50 p-2 rounded">
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <span className="font-semibold">Paper Standard Cost</span>
                          <span className="text-right font-semibold">Rp {(1667).toLocaleString('id-ID')}</span>
                        </div>
                      </div>

                      <div className="bg-muted/50 px-3 py-1.5 rounded text-xs font-semibold text-center">
                        PROSES
                      </div>
                      <div className="border rounded overflow-hidden">
                        <div className="grid grid-cols-2 text-xs">
                          {/* Column 1 */}
                          <div>
                            <div className="bg-muted p-1.5 font-semibold border-b grid grid-cols-2 text-xs">
                              <span>PROSES</span>
                              <span className="text-right">TARIF</span>
                            </div>
                            <div className="divide-y">
                              {[
                                ['OC', 180000],
                                ['OP', 60],
                                ['PLAT', 76000],
                                ['LG', 0.21],
                                ['LD', 0.24],
                                ['METAL', 0.72],
                                ['FOIL', 1],
                                ['POND', 60],
                                ['BMO', 80],
                                ['ALAS', 0],
                                ['JSAL', 8]
                              ].map(([label, value], idx) => (
                                <div key={idx} className="grid grid-cols-2 p-1.5 hover:bg-muted/30">
                                  <span className="text-muted-foreground text-xs">{label}</span>
                                  <span className="text-right font-medium text-xs">
                                    Rp {typeof value === 'number' ? value.toLocaleString('id-ID') : value}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Column 2 */}
                          <div className="border-l">
                            <div className="bg-muted p-1.5 font-semibold border-b grid grid-cols-2 text-xs">
                              <span>PROSES</span>
                              <span className="text-right">TARIF</span>
                            </div>
                            <div className="divide-y">
                              {[
                                ['RAWZIP', 9],
                                ['PSZIP', 50],
                                ['PRESSZIP', 35],
                                ['INDEKSZIP', 1],
                                ['POTKRTS', 15],
                                ['QC', 25],
                                ['SISIR', 10],
                                ['VCUT', 5],
                                ['OCINC', 8],
                                ['PISAU', 8],
                                ['PACKING', 11]
                              ].map(([label, value], idx) => (
                                <div key={idx} className="grid grid-cols-2 p-1.5 hover:bg-muted/30">
                                  <span className="text-muted-foreground text-xs">{label}</span>
                                  <span className="text-right font-medium text-xs">
                                    Rp {typeof value === 'number' ? value.toLocaleString('id-ID') : value}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* TOTAL BIAYA */}
                    <div className="space-y-2">
                      <div className="bg-green-600 text-white px-3 py-1.5 rounded text-xs font-semibold text-center">
                        TOTAL BIAYA
                      </div>
                      <div className="space-y-1 text-xs">
                        {[
                          ['Kertas (Paper)', 157439],
                          ['OC + Plat', 256000],
                          ['Pond', 51000],
                          ['BM (Sealer)', 267300],
                          ['Alas', 0],
                          ['Zipper', 0],
                          ['Cutting', 12750],
                          ['QC', 75000],
                          ['Sisir', 30000],
                          ['V-Cut', 15000],
                          ['Incoming QC', 6800],
                          ['Pisau Pond', 24000],
                          ['Packing', 33000],
                          ['OH', 76500]
                        ].map(([label, value], idx) => (
                          <div key={idx} className="flex justify-between p-1.5 bg-muted/30 rounded hover:bg-muted/50">
                            <span className="text-muted-foreground">{label}</span>
                            <span className="font-semibold">Rp {typeof value === 'number' ? value.toLocaleString('id-ID') : value}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Detail Laminasi & Komponen HPP */}
                  <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t">
                    <div>
                      <div className="bg-blue-600 text-white px-3 py-1.5 rounded text-xs font-semibold text-center mb-2">
                        Detail Laminasi (Total)
                      </div>
                      <div className="space-y-1 text-xs">
                        {[
                          ['Gloss', 154626],
                          ['Doff', 176715],
                          ['Metalis', 530145],
                          ['Foil', 876212]
                        ].map(([label, value], idx) => (
                          <div key={idx} className="flex justify-between p-1.5 bg-blue-50 dark:bg-blue-950 rounded border border-blue-100 dark:border-blue-900">
                            <span className="text-muted-foreground">{label}</span>
                            <span className="font-semibold">Rp {typeof value === 'number' ? value.toLocaleString('id-ID') : value}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div>
                      <div className="bg-purple-600 text-white px-3 py-1.5 rounded text-xs font-semibold text-center mb-2">
                        Komponen HPP
                      </div>
                      <div className="space-y-1 text-xs">
                        {[
                          ['Metalis + Doff', 571],
                          ['Metalis + Glossy', 563],
                          ['Foil + Doff', 686],
                          ['Foil + Glossy', 679]
                        ].map(([label, value], idx) => (
                          <div key={idx} className="flex justify-between p-1.5 bg-purple-50 dark:bg-purple-950 rounded border border-purple-100 dark:border-purple-900">
                            <span className="text-muted-foreground">{label}</span>
                            <span className="font-semibold text-blue-600">Rp {typeof value === 'number' ? value.toLocaleString('id-ID') : value}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : selectedFormula ? (
            <div className="space-y-4">
              {/* Original view for non-flexibel types */}
              <div className="bg-muted/30 p-4 rounded-lg">
                <h3 className="text-lg font-semibold text-blue-600 mb-2">
                  {selectedFormula.namaBarang || '-'}
                </h3>
                <p className="text-sm text-muted-foreground mb-3">
                  Bentuk: {selectedFormula.jenisKemasan || '-'} · {selectedFormula.ziplock === 'Ya' ? 'Zipper' : 'Non Zipper'} · Material: {selectedFormula.bahan || '-'}
                </p>

                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <div className="text-muted-foreground mb-1">Customer</div>
                    <div className="font-medium">{selectedFormula.customer || '-'}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground mb-1">Nama Barang</div>
                    <div className="font-medium">{selectedFormula.namaBarang || '-'}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground mb-1">Sales</div>
                    <div className="font-medium">{selectedFormula.salesPerson || '-'}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground mb-1">Ukuran</div>
                    <div className="font-medium">
                      {selectedFormula.ukuranLebar || '-'} x {selectedFormula.ukuranTinggi || '-'} cm
                    </div>
                  </div>
                  <div>
                    <div className="text-muted-foreground mb-1">Quantity</div>
                    <div className="font-medium">{(selectedFormula.jumlah || 0).toLocaleString('id-ID')} pcs</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground mb-1">Terakhir Update</div>
                    <div className="font-medium">{formatDate(selectedFormula.tanggal)}</div>
                  </div>
                </div>
              </div>

              {/* Summary Cards */}
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg text-center">
                  <div className="text-sm text-muted-foreground mb-1">HPP /pcs</div>
                  <div className="text-xl font-semibold text-blue-600">
                    Rp {(selectedFormula.hpp || 0).toLocaleString('id-ID')}
                  </div>
                </div>
                <div className="bg-green-50 dark:bg-green-950 p-4 rounded-lg text-center">
                  <div className="text-sm text-muted-foreground mb-1">Jual /pcs</div>
                  <div className="text-xl font-semibold text-green-600">
                    Rp {(selectedFormula.hargaJual || 0).toLocaleString('id-ID')}
                  </div>
                  {selectedFormula.opsiYangDipilih && (
                    <div className="text-xs text-muted-foreground mt-1">
                      {selectedFormula.opsiYangDipilih}
                    </div>
                  )}
                </div>
                <div className="bg-purple-50 dark:bg-purple-950 p-4 rounded-lg text-center">
                  <div className="text-sm text-muted-foreground mb-1">Margin (%)</div>
                  <div className="text-xl font-semibold text-purple-600">
                    {selectedFormula.margin ? `${selectedFormula.margin.toFixed(2)}%` : '0.00%'}
                  </div>
                </div>
              </div>

              <div className="border-t pt-4">
                <h4 className="text-sm font-semibold text-center text-muted-foreground mb-4">
                  DETAIL PERHITUNGAN
                </h4>

                <div className="grid grid-cols-2 gap-4">
                  {/* Biaya BM */}
                  <div className="border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                    <h5 className="text-base font-semibold text-blue-600 mb-3">Biaya BM</h5>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Qty + Toleransi</span>
                        <span className="font-medium">{(selectedFormula.jumlah || 0).toLocaleString('id-ID')}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Uk. Terbuka</span>
                        <span className="font-medium">
                          {selectedFormula.layoutLebar || '-'} x {selectedFormula.layoutPanjang || '-'} cm
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Harga /pcs</span>
                        <span className="font-medium">Rp {((selectedFormula.hpp || 0) * 0.6).toLocaleString('id-ID')}</span>
                      </div>
                      <div className="flex justify-between pt-2 border-t">
                        <span className="font-semibold">Total BM</span>
                        <span className="font-semibold text-blue-600">
                          Rp {((selectedFormula.hpp || 0) * (selectedFormula.jumlah || 0) * 0.6).toLocaleString('id-ID')}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Biaya Material */}
                  <div className="border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                    <h5 className="text-base font-semibold text-blue-600 mb-3">Biaya Material</h5>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Harga Material</span>
                        <span className="font-medium">
                          {selectedFormula.bahan ? '0.7' : '-'}
                        </span>
                      </div>
                      <div className="flex justify-between pt-2 border-t mt-8">
                        <span className="font-semibold">Total Material</span>
                        <span className="font-semibold text-blue-600">
                          Rp {((selectedFormula.hpp || 0) * (selectedFormula.jumlah || 0) * 0.3).toLocaleString('id-ID')}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Biaya Zipper */}
                  <div className="border border-orange-200 dark:border-orange-800 rounded-lg p-4">
                    <h5 className="text-base font-semibold text-orange-600 mb-3">Biaya Zipper</h5>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Zipper?</span>
                        <span className="font-medium">{selectedFormula.ziplock || 'Tidak'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Ukuran Zip</span>
                        <span className="font-medium">- cm</span>
                      </div>
                      <div className="flex justify-between pt-2 border-t">
                        <span className="font-semibold">Total Zip</span>
                        <span className="font-semibold text-orange-600">Rp 0</span>
                      </div>
                    </div>
                  </div>

                  {/* Grand Total */}
                  <div className="bg-muted/50 rounded-lg p-4 flex flex-col justify-center">
                    <div className="space-y-3 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Grand Total</span>
                        <span className="font-semibold">
                          Rp {((selectedFormula.hpp || 0) * (selectedFormula.jumlah || 0)).toLocaleString('id-ID')}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-semibold">HPP Final</span>
                        <span className="text-xl font-bold text-blue-600">
                          Rp {(selectedFormula.hpp || 0).toLocaleString('id-ID')}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Opsi Margin Snapshot */}
              <div className="border-t pt-4">
                <h4 className="text-sm font-semibold mb-3">Opsi Margin Snapshot</h4>
                <div className="border rounded-lg overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-muted">
                      <tr>
                        <th className="p-3 text-left font-medium">OPSI</th>
                        <th className="p-3 text-center font-medium">MARGIN</th>
                        <th className="p-3 text-right font-medium">HARGA / PCS</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      <tr>
                        <td className="p-3">Opsi 1</td>
                        <td className="p-3 text-center">15,0%</td>
                        <td className="p-3 text-right font-medium">
                          Rp {((selectedFormula.hpp || 0) * 1.15).toLocaleString('id-ID')}
                        </td>
                      </tr>
                      <tr>
                        <td className="p-3">Opsi 2</td>
                        <td className="p-3 text-center">20,0%</td>
                        <td className="p-3 text-right font-medium">
                          Rp {((selectedFormula.hpp || 0) * 1.20).toLocaleString('id-ID')}
                        </td>
                      </tr>
                      <tr>
                        <td className="p-3">Opsi 3</td>
                        <td className="p-3 text-center">25,0%</td>
                        <td className="p-3 text-right font-medium">
                          Rp {((selectedFormula.hpp || 0) * 1.25).toLocaleString('id-ID')}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Catatan */}
              {(selectedFormula.catatan || selectedFormula.catatanApprover) && (
                <div className="border-t pt-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    {selectedFormula.catatan && (
                      <div>
                        <div className="text-muted-foreground mb-1 font-medium">Catatan</div>
                        <div className="p-3 bg-muted/30 rounded border">
                          {selectedFormula.catatan}
                        </div>
                      </div>
                    )}
                    {selectedFormula.catatanApprover && (
                      <div>
                        <div className="text-muted-foreground mb-1 font-medium">Catatan Approver</div>
                        <div className="p-3 bg-muted/30 rounded border">
                          {selectedFormula.catatanApprover}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center text-muted-foreground py-8">
              Tidak ada data formula yang dipilih
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDetailModal(false)}
              className="w-full bg-slate-600 text-white hover:bg-slate-700 hover:text-white"
            >
              Tutup
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Tambah/Edit Bahan */}
      <Dialog open={showMasterModal} onOpenChange={setShowMasterModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingMaster ? 'Edit Bahan' : 'Tambah Bahan'}</DialogTitle>
          </DialogHeader>

          <div className="space-y-3">
            <div className="grid grid-cols-[180px_1fr] gap-4 items-center">
              <Label htmlFor="kategoriBahan" className="text-right">Kategori Barang *</Label>
              <Input
                id="kategoriBahan"
                value={masterFormData.kategoriBahan}
                onChange={(e) => setMasterFormData({ ...masterFormData, kategoriBahan: e.target.value })}
                placeholder="Contoh: Plastik, Kertas, dll"
              />
            </div>

            <div className="grid grid-cols-[180px_1fr] gap-4 items-center">
              <Label htmlFor="tipeBahan" className="text-right">Tipe Barang *</Label>
              <Input
                id="tipeBahan"
                value={masterFormData.tipeBahan}
                onChange={(e) => setMasterFormData({ ...masterFormData, tipeBahan: e.target.value })}
                placeholder="Contoh: PE, PP, Kraft, dll"
              />
            </div>

            <div className="grid grid-cols-[180px_1fr] gap-4 items-center">
              <Label htmlFor="jenisProses" className="text-right">Jenis Proses *</Label>
              <Input
                id="jenisProses"
                value={masterFormData.jenisProses}
                onChange={(e) => setMasterFormData({ ...masterFormData, jenisProses: e.target.value })}
                placeholder="Contoh: Offset, Roto, dll"
              />
            </div>

            <div className="grid grid-cols-[180px_1fr] gap-4 items-center">
              <Label htmlFor="kodeBarang" className="text-right">Kode Barang *</Label>
              <Input
                id="kodeBarang"
                value={masterFormData.kodeBarang}
                onChange={(e) => setMasterFormData({ ...masterFormData, kodeBarang: e.target.value })}
                placeholder="Contoh: BHN-001"
              />
            </div>

            <div className="grid grid-cols-[180px_1fr] gap-4 items-center">
              <Label htmlFor="namaBarang" className="text-right">Nama Barang *</Label>
              <Input
                id="namaBarang"
                value={masterFormData.namaBarang}
                onChange={(e) => setMasterFormData({ ...masterFormData, namaBarang: e.target.value })}
                placeholder="Contoh: PE Film 80 Micron"
              />
            </div>

            <div className="grid grid-cols-[180px_1fr] gap-4 items-center">
              <Label htmlFor="satuan" className="text-right">Satuan *</Label>
              <Input
                id="satuan"
                value={masterFormData.satuan}
                onChange={(e) => setMasterFormData({ ...masterFormData, satuan: e.target.value })}
                placeholder="Contoh: Kg, Rim, Meter, dll"
              />
            </div>

            <div className="grid grid-cols-[180px_1fr] gap-4 items-center">
              <Label htmlFor="jumlahStock" className="text-right">Jumlah Stock</Label>
              <Input
                id="jumlahStock"
                type="number"
                value={masterFormData.jumlahStock}
                onChange={(e) => setMasterFormData({ ...masterFormData, jumlahStock: parseFloat(e.target.value) || 0 })}
                placeholder="0"
                min="0"
              />
            </div>

            <div className="grid grid-cols-[180px_1fr] gap-4 items-center">
              <Label htmlFor="harga" className="text-right">Harga *</Label>
              <Input
                id="harga"
                type="number"
                value={masterFormData.harga}
                onChange={(e) => setMasterFormData({ ...masterFormData, harga: parseFloat(e.target.value) || 0 })}
                placeholder="0"
                min="0"
              />
            </div>

            <div className="grid grid-cols-[180px_1fr] gap-4 items-center">
              <Label htmlFor="keteranganBahan" className="text-right">Keterangan</Label>
              <Textarea
                id="keteranganBahan"
                value={masterFormData.keterangan}
                onChange={(e) => setMasterFormData({ ...masterFormData, keterangan: e.target.value })}
                placeholder="Keterangan tambahan"
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowMasterModal(false)}
            >
              Batal
            </Button>
            <Button
              className="bg-blue-600 hover:bg-blue-700"
              onClick={handleSaveMasterData}
            >
              {editingMaster ? 'Update' : 'Simpan'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
