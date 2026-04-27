import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router';
import { ChevronLeft, Plus, Trash2, Save, Check, ChevronsUpDown } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { DatePicker } from '../../components/ui/date-picker';
import { PageHeader } from '../../components/page-header';
import { Card } from '../../components/ui/card';
import { Checkbox } from '../../components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../../components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { Separator } from '../../components/ui/separator';
import { Popover, PopoverContent, PopoverTrigger } from '../../components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '../../components/ui/command';
import { toast } from 'sonner';
import { api } from '../../lib/api';

// Helper function to format date
const formatDate = (dateString: string) => {
  if (!dateString) return '-';
  const date = new Date(dateString);
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
};

// Helper function to extract pipeline number from ID
const getPipelineNumber = (id: string) => {
  if (!id) return '-';
  // ID format: "pipeline:timestamp"
  const parts = id.split(':');
  return parts.length > 1 ? parts[1] : id;
};

// Helper function to generate Kode Item Penawaran (DI.YYYY.MM.NNNNN)
const generateKodeItemPenawaran = (currentItemCount: number) => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const sequence = String(currentItemCount + 1).padStart(5, '0'); // Sequential number starting from 00001
  return `DI.${year}.${month}.${sequence}`;
};

interface QuotationItem {
  kodeItemPenawaran?: string;
  tanggalItem?: Date | null;
  itemCode: string;
  itemName: string;
  description: string;
  jenisOrder: string;
  jenisKemasan: string;
  formulaHarga?: string;
  opsiHarga?: string;
  customItemId?: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  diskon: number;
  diskonType: 'percentage' | 'nominal';
  pajakPPN: boolean;
  totalPrice: number;
  // Spesifikasi
  material?: string;
  size?: string;
  color?: string;
  finishing?: string;
  notes?: string;
  // Spesifikasi Flexibel
  ziplock?: string;
  toleransi?: string;
  laminasi?: string;
  bahan?: string;
  jenisAlas?: string;
  vCut?: string;
  sudut?: string;
  posisiVCut?: string;
  sisiBuka?: string;
  hole?: string;
  aksesoris?: string;
  statusDesign?: string;
  tanggalStatusDesign?: Date | null;
  acuanKonten?: string;
  tanggalAcuanKonten?: Date | null;
  acuanWarna?: string;
  tanggalAcuanWarna?: Date | null;
  lebar?: string;
  tinggi?: string;
  panjang?: string;
  lipatan?: string;
  jenisBentuk?: string;
  // Spesifikasi Flexibel - Layout
  kertas?: string;
  jmlMata?: string;
  jmlPotong?: string;
  ukuranLayoutLebar?: string;
  ukuranLayoutPanjang?: string;
  // Spesifikasi Roto
  ukuran?: string;
  jumlahLayer?: string;
  layer1?: string;
  layer2?: string;
  layer3?: string;
  layer4?: string;
  // Bahan Roto
  jumlahUp?: string;
  jumlahPitch?: string;
  ukuranUp?: string;
  ukuranPitch?: string;
  posisi?: string;
  lebarImage?: string;
  rollDry?: string;
  lebarBahan?: string;
  ukuranAlas?: string;
  ukuranZiplock?: string;
  adhesive?: string;
  jumlahWarna?: string;
  cylinder?: string;
  // Spesifikasi Boks
  pisau?: string;
  lem?: string;
  hotfoil?: string;
  kliseHotfoil?: string;
  jumlahTitikHotfoil?: string;
  ukuranHotfoil?: string;
  warnaHotfoil?: string;
  emboss?: string;
  kliseEmboss?: string;
  jumlahTitikEmboss?: string;
  ukuranEmboss?: string;
  spotUv?: string;
  jumlahTitikSpotUv?: string;
  ukuranSpotUv?: string;
  desainSpotUv?: string;
}

interface PriceFormula {
  id: string;
  labelKode: string;
  namaBarang: string;
  customer: string;
  hargaJual: number;
  type: string;
  bahan?: string;
  alas?: string;
  jenisBentuk?: string;
  ziplock?: string;
  ukuranLebar?: number;
  ukuranTinggi?: number;
  ukuranPanjang?: number;
  lipatan?: number;
  toleransi?: string;
  laminasi?: string;
  vCut?: string;
  sudut?: string;
  posisiVCut?: string;
  sisiBuka?: string;
  hole?: string;
  aksesoris?: string;
  jmlMata?: string;
  jmlPotong?: number;
  ukuranKertas?: string;
  layoutPanjang?: number;
  layoutLebar?: number;
  opsiHarga?: Array<{label: string; harga: number}>;
}

interface Customer {
  id: string;
  customerName: string;
  billingAddress?: {
    fullAddress?: string;
  };
  shippingAddress?: {
    fullAddress?: string;
  };
}

interface Employee {
  id: string;
  full_name: string;
  position_name: string;
}

interface User {
  id: string;
  username: string;
  email: string;
  nama_user: string;
  employee_id?: string;
  role?: string;
  is_active: boolean;
}

interface CustomItem {
  id: string;
  kodeBarang: string;
  namaBarang: string;
  jenisOrder: string;
  jenisKemasan: string;
  jenisProses?: string;
  bentuk?: string;
  satuan: string;
  ziplock?: string;
  dimensi?: {
    lebar?: string;
    tinggi?: string;
    panjang?: string;
    gusset?: string;
  };
  lebar?: string;
  tinggi?: string;
  panjang?: string;
  createdAt?: string;
}

interface Pipeline {
  id: string;
  tanggal: string;
  customer: string;
  stage: string;
  picSales?: string;
  sumberLead?: string;
  perkiraanJumlah?: number;
  alamat?: string;
  customerId?: string;
  nomorTelepon?: string;
  createdAt?: string;
}

interface PipelineFollowUp {
  id: string;
  pipelineId: string;
  tanggal: string;
  aktivitas: string;
  stage?: string;
  hasil?: string;
  catatan?: string;
  customerName?: string; // Enriched from pipeline
  createdAt?: string;
}

export function QuotationForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = !!id;

  const [loading, setLoading] = useState(false);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [salesEmployees, setSalesEmployees] = useState<Employee[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [customItems, setCustomItems] = useState<CustomItem[]>([]);
  const [productTypes, setProductTypes] = useState<any[]>([]);
  const [priceFormulas, setPriceFormulas] = useState<PriceFormula[]>([]);
  const [pipelines, setPipelines] = useState<Pipeline[]>([]);
  const [followups, setFollowups] = useState<PipelineFollowUp[]>([]);
  const [useCustomerAddress, setUseCustomerAddress] = useState(false);
  const [pipelineSearch, setPipelineSearch] = useState('');
  const [showPipelineSuggestions, setShowPipelineSuggestions] = useState(false);
  const [showItemModal, setShowItemModal] = useState(false);
  const [editingItemIndex, setEditingItemIndex] = useState<number | null>(null);
  const [itemModalTab, setItemModalTab] = useState('info');
  const [showItemSuggestions, setShowItemSuggestions] = useState(false);
  const [filteredItems, setFilteredItems] = useState<CustomItem[]>([]);
  const [showJenisKemasanSuggestions, setShowJenisKemasanSuggestions] = useState(false);
  const [showZiplockSuggestions, setShowZiplockSuggestions] = useState(false);
  const [showJenisBentukSuggestions, setShowJenisBentukSuggestions] = useState(false);
  const [showOpsiHargaSuggestions, setShowOpsiHargaSuggestions] = useState(false);
  const [previousQuotationItems, setPreviousQuotationItems] = useState<QuotationItem[]>([]);
  const [selectedPreviousItem, setSelectedPreviousItem] = useState<string>('');
  const [openPreviousItemCombobox, setOpenPreviousItemCombobox] = useState(false);
  const [tempItem, setTempItem] = useState<QuotationItem>({
    kodeItemPenawaran: generateKodeItemPenawaran(0),
    tanggalItem: new Date(),
    itemCode: '',
    itemName: '',
    description: '',
    jenisOrder: '',
    jenisKemasan: 'Flexibel',
    formulaHarga: '',
    opsiHarga: '',
    customItemId: '',
    quantity: 1,
    unit: 'Pcs',
    unitPrice: 0,
    diskon: 0,
    diskonType: 'percentage',
    pajakPPN: false,
    totalPrice: 0,
    material: '',
    size: '',
    color: '',
    finishing: '',
    notes: '',
    ziplock: '',
    toleransi: '10',
    laminasi: '',
    bahan: '',
    jenisAlas: '',
    vCut: '',
    sudut: '',
    posisiVCut: '',
    sisiBuka: '',
    hole: '',
    aksesoris: '',
    statusDesign: '',
    tanggalStatusDesign: null,
    acuanKonten: '',
    tanggalAcuanKonten: null,
    acuanWarna: '',
    tanggalAcuanWarna: null,
    lebar: '',
    tinggi: '',
    panjang: '',
    lipatan: '',
    jenisBentuk: '',
    kertas: '',
    jmlMata: '',
    jmlPotong: '',
    ukuranLayoutLebar: '',
    ukuranLayoutPanjang: '',
  });

  const [formData, setFormData] = useState<{
    tanggal: Date;
    customerName: string;
    validUntil: Date | undefined;
    pipelineId: string;
    alamatCustomer: string;
    salesPerson: string;
    syaratPembayaran: string;
    kenaPajak: boolean;
    totalTermasukFaktur: boolean;
    notes: string;
    items: QuotationItem[];
  }>({
    tanggal: new Date(),
    customerName: '',
    validUntil: undefined,
    pipelineId: '',
    alamatCustomer: '',
    salesPerson: '',
    syaratPembayaran: '',
    kenaPajak: false,
    totalTermasukFaktur: false,
    notes: '',
    items: [] as QuotationItem[],
  });

  useEffect(() => {
    fetchCustomers();
    fetchSalesEmployees();
    fetchUsers();
    fetchCustomItems();
    fetchProductTypes();
    fetchPipelines();
    fetchFollowups();
    fetchPreviousQuotationItems();
    if (isEdit && id) {
      fetchQuotationData(id);
    }

    // Check for pipelineId in URL query parameter
    const urlParams = new URLSearchParams(window.location.search);
    const pipelineIdFromUrl = urlParams.get('pipelineId');
    if (pipelineIdFromUrl && !isEdit) {
      setFormData(prev => ({ ...prev, pipelineId: pipelineIdFromUrl }));
    }
  }, [id, isEdit]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('#modal-itemName') && !target.closest('.absolute.z-50')) {
        setShowItemSuggestions(false);
      }
      if (!target.closest('#modal-jenisKemasan') && !target.closest('.jenis-kemasan-dropdown')) {
        setShowJenisKemasanSuggestions(false);
      }
      if (!target.closest('#modal-ziplock-bahan') && !target.closest('#modal-ziplock-bahan-roto') && !target.closest('.ziplock-dropdown')) {
        setShowZiplockSuggestions(false);
      }
      if (!target.closest('#modal-jenisBentuk') && !target.closest('#modal-jenisBentuk-roto') && !target.closest('.jenis-bentuk-dropdown')) {
        setShowJenisBentukSuggestions(false);
      }
      if (!target.closest('#modal-opsiHarga') && !target.closest('.opsi-harga-dropdown')) {
        setShowOpsiHargaSuggestions(false);
      }
      if (!target.closest('#pipeline-combobox') && !target.closest('.pipeline-dropdown')) {
        setShowPipelineSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  useEffect(() => {
    const validJenisKemasan = ['Flexibel', 'Boks', 'Roto', 'Polos'];
    const jenisLower = tempItem.jenisKemasan?.toLowerCase().trim();
    const isValid = validJenisKemasan.some(jenis => jenis.toLowerCase() === jenisLower);

    if (tempItem.jenisKemasan && isValid) {
      fetchPriceFormulas(tempItem.jenisKemasan);
    } else {
      // Clear formulas jika jenis kemasan kosong atau tidak valid
      setPriceFormulas([]);
    }
  }, [tempItem.jenisKemasan]);

  useEffect(() => {
    if (formData.pipelineId && pipelines.length > 0 && followups.length > 0) {
      const displayText = getPipelineDisplayText(formData.pipelineId);
      if (displayText && displayText !== pipelineSearch) {
        setPipelineSearch(displayText);
      }
    }
  }, [formData.pipelineId, pipelines, followups]);

  const fetchCustomers = async () => {
    try {
      const result = await api.getCustomers();
      setCustomers(result || []);
    } catch (error) {
      console.error('Error fetching customers:', error);
    }
  };

  const fetchSalesEmployees = async () => {
    try {
      const employees = await api.getEmployees();
      setSalesEmployees(employees || []);
    } catch (error) {
      console.error('Error fetching sales employees:', error);
    }
  };

  const fetchUsers = async () => {
    try {
      const result = await api.getUsers();
      setUsers(result || []);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const fetchCustomItems = async () => {
    try {
      const result = await api.getCustomItems();
      setCustomItems(result || []);
    } catch (error) {
      console.error('Error fetching custom items:', error);
    }
  };

  const fetchProductTypes = async () => {
    try {
      const result = await api.getProductTypes();
      setProductTypes(result || []);
    } catch (error) {
      console.error('Error fetching product types:', error);
    }
  };

  const fetchPipelines = async () => {
    try {
      const result = await api.getPipelines();
      // Sort by tanggal descending (newest first)
      const sortedPipelines = (result || []).sort((a: Pipeline, b: Pipeline) => {
        const dateA = new Date(a.tanggal).getTime();
        const dateB = new Date(b.tanggal).getTime();
        return dateB - dateA;
      });
      setPipelines(sortedPipelines);
    } catch (error) {
      console.error('Error fetching pipelines:', error);
    }
  };

  const fetchFollowups = async () => {
    try {
      const [followupsResult, pipelinesResult] = await Promise.all([
        api.getPipelineFollowUps(),
        api.getPipelines()
      ]);

      // Enrich followups with customer name from pipeline
      const enrichedFollowups = (followupsResult || []).map((followup: PipelineFollowUp) => {
        const relatedPipeline = (pipelinesResult || []).find((p: Pipeline) => p.id === followup.pipelineId);
        return {
          ...followup,
          customerName: relatedPipeline?.customer || '-'
        };
      });

      // Sort by tanggal descending (newest first)
      const sortedFollowups = enrichedFollowups.sort((a: PipelineFollowUp, b: PipelineFollowUp) => {
        const dateA = new Date(a.tanggal).getTime();
        const dateB = new Date(b.tanggal).getTime();
        return dateB - dateA;
      });

      setFollowups(sortedFollowups);
    } catch (error) {
      console.error('Error fetching followups:', error);
    }
  };

  const fetchPreviousQuotationItems = async () => {
    try {
      const quotations = await api.getQuotations();
      // Ambil semua items dari semua quotations
      const allItems: QuotationItem[] = [];
      (quotations || []).forEach((quotation: any) => {
        if (quotation.items && Array.isArray(quotation.items)) {
          quotation.items.forEach((item: QuotationItem, itemIndex: number) => {
            // Tambahkan informasi quotation ke item
            allItems.push({
              ...item,
              // Gunakan quotationNumber (format SQ.2026...) atau fallback ke id
              _quotationNumber: quotation.quotationNumber || quotation.nomorPenawaran || `QT-${quotation.id?.slice(-8) || 'UNKNOWN'}`,
              _quotationDate: quotation.tanggal,
              _quotationId: quotation.id,
              _uniqueKey: `${quotation.id}-${itemIndex}-${item.kodeItemPenawaran || Math.random()}`,
            });
          });
        }
      });
      // Sort by newest first based on tanggalItem or kodeItemPenawaran
      const sortedItems = allItems.sort((a, b) => {
        const dateA = a.tanggalItem ? new Date(a.tanggalItem).getTime() : 0;
        const dateB = b.tanggalItem ? new Date(b.tanggalItem).getTime() : 0;
        return dateB - dateA;
      });
      setPreviousQuotationItems(sortedItems);
    } catch (error) {
      console.error('Error fetching previous quotation items:', error);
    }
  };

  const fetchPriceFormulas = async (jenisKemasan: string) => {
    try {
      let formulas: any[] = [];

      // Fetch formulas berdasarkan jenis kemasan yang sesuai dengan tab di Formula Harga
      const jenisLower = jenisKemasan?.toLowerCase().trim() || '';

      console.log('Fetching formulas for jenis kemasan:', jenisKemasan, '→', jenisLower);

      // Exact match untuk setiap jenis kemasan
      switch (jenisLower) {
        case 'flexibel':
          // Tab: Flexibel (Offset)
          formulas = await api.getPriceFormulasOffset();
          console.log('Fetched Flexibel formulas:', formulas.length);
          break;
        case 'roto':
          // Tab: Roto
          formulas = await api.getPriceFormulasRoto();
          console.log('Fetched Roto formulas:', formulas.length);
          break;
        case 'boks':
          // Tab: Boks
          formulas = await api.getPriceFormulasBoks();
          console.log('Fetched Boks formulas:', formulas.length);
          break;
        case 'polos':
          // Tab: Polos
          formulas = await api.getPriceFormulasPolos();
          console.log('Fetched Polos formulas:', formulas.length);
          break;
        default:
          // Jenis kemasan tidak valid, kembalikan array kosong
          formulas = [];
      }

      // Filter hanya formula dengan status final atau approved
      const filteredFormulas = (formulas || []).filter((f: any) =>
        f.status === 'final' || f.status === 'approved'
      );

      console.log('Filtered formulas (final/approved):', filteredFormulas.length);
      setPriceFormulas(filteredFormulas);
    } catch (error) {
      console.error('Error fetching price formulas:', error);
      setPriceFormulas([]);
    }
  };

  const fetchQuotationData = async (quotationId: string) => {
    try {
      setLoading(true);
      const quotations = await api.getQuotations();
      const result = quotations.find((q: any) => q.id === quotationId);

      if (result) {
        setFormData({
          tanggal: result.tanggal ? new Date(result.tanggal) : new Date(),
          customerName: result.customerName || '',
          validUntil: result.validUntil ? new Date(result.validUntil) : undefined,
          alamatCustomer: result.alamatCustomer || '',
          salesPerson: result.salesPerson || '',
          syaratPembayaran: result.syaratPembayaran || '',
          kenaPajak: result.kenaPajak || false,
          totalTermasukFaktur: result.totalTermasukFaktur || false,
          notes: result.notes || '',
          items: result.items || [],
        });
      }
    } catch (error) {
      console.error('Error fetching quotation data:', error);
      toast.error('Gagal memuat data penawaran');
    } finally {
      setLoading(false);
    }
  };

  const addItem = () => {
    setTempItem({
      kodeItemPenawaran: generateKodeItemPenawaran(formData.items.length),
      tanggalItem: new Date(),
      itemCode: '',
      itemName: '',
      description: '',
      jenisOrder: '',
      jenisKemasan: 'Flexibel',
      formulaHarga: '',
      opsiHarga: '',
      customItemId: '',
      quantity: 1,
      unit: 'Pcs',
      unitPrice: 0,
      diskon: 0,
      diskonType: 'percentage',
      pajakPPN: false,
      totalPrice: 0,
      material: '',
      size: '',
      color: '',
      finishing: '',
      notes: '',
      ziplock: '',
      toleransi: '10',
      laminasi: '',
      bahan: '',
      jenisAlas: '',
      vCut: '',
      sudut: '',
      posisiVCut: '',
      sisiBuka: '',
      hole: '',
      aksesoris: '',
      statusDesign: '',
      tanggalStatusDesign: null,
      acuanKonten: '',
      tanggalAcuanKonten: null,
      acuanWarna: '',
      tanggalAcuanWarna: null,
      lebar: '',
      tinggi: '',
      panjang: '',
      lipatan: '',
      jenisBentuk: '',
      kertas: '',
      jmlMata: '',
      jmlPotong: '',
      ukuranLayoutLebar: '',
      ukuranLayoutPanjang: '',
    });
    setEditingItemIndex(null);
    setItemModalTab('info');
    setShowItemModal(true);
  };

  const editItem = (index: number) => {
    const item = formData.items[index];
    setTempItem({ ...item });
    setEditingItemIndex(index);
    setItemModalTab('info');
    setShowItemModal(true);
  };

  const removeItem = (index: number) => {
    const newItems = formData.items.filter((_, i) => i !== index);
    setFormData({ ...formData, items: newItems });
    toast.success('Item berhasil dihapus');
  };

  const selectPreviousItem = (kodeItemPenawaran: string) => {
    const selectedItem = previousQuotationItems.find(item => item.kodeItemPenawaran === kodeItemPenawaran);
    if (selectedItem) {
      // Copy semua field dari item yang dipilih ke tempItem
      const itemCopy = { ...selectedItem };
      // Generate kode item penawaran baru dan tanggal baru untuk item yang di-copy
      itemCopy.kodeItemPenawaran = generateKodeItemPenawaran(formData.items.length);
      itemCopy.tanggalItem = new Date();
      // Hapus field internal yang tidak perlu
      delete (itemCopy as any)._quotationNumber;

      setTempItem(itemCopy);
      setSelectedPreviousItem(''); // Reset selection
      setOpenPreviousItemCombobox(false); // Tutup popover
      setEditingItemIndex(null);
      setItemModalTab('info');
      setShowItemModal(true);
      toast.success('Item berhasil dimuat dari penawaran sebelumnya');
    }
  };

  const saveItem = () => {
    if (!tempItem.itemName) {
      toast.error('Nama item wajib diisi');
      return;
    }

    // Calculate total price
    const subtotal = tempItem.quantity * tempItem.unitPrice;
    let total = subtotal;

    // Apply discount
    if (tempItem.diskon > 0) {
      if (tempItem.diskonType === 'percentage') {
        total = subtotal - (subtotal * tempItem.diskon / 100);
      } else {
        total = subtotal - tempItem.diskon;
      }
    }

    // Apply PPN 12% if checked
    if (tempItem.pajakPPN) {
      total = total + (total * 0.12);
    }

    const calculatedItem = {
      ...tempItem,
      totalPrice: total,
    };

    if (editingItemIndex !== null) {
      // Edit existing item
      const newItems = [...formData.items];
      newItems[editingItemIndex] = calculatedItem;
      setFormData({ ...formData, items: newItems });
      toast.success('Item berhasil diperbarui');
    } else {
      // Add new item
      setFormData({
        ...formData,
        items: [...formData.items, calculatedItem],
      });
      toast.success('Item berhasil ditambahkan');
    }

    setShowItemModal(false);
  };

  const updateTempItem = (field: keyof QuotationItem, value: any) => {
    const updatedItem: any = { ...tempItem, [field]: value };

    // Reset formula harga, opsi harga, dan custom item ketika jenis kemasan berubah
    if (field === 'jenisKemasan') {
      updatedItem.formulaHarga = '';
      updatedItem.opsiHarga = '';
      updatedItem.customItemId = '';
      updatedItem.unitPrice = 0;
    }

    // Auto-fill Acuan Konten dan Acuan Warna when Status Design is selected
    if (field === 'statusDesign' && value) {
      updatedItem.acuanKonten = value;
      updatedItem.acuanWarna = value;
    }

    // Auto-fill Tanggal Acuan Konten dan Tanggal Acuan Warna when Tanggal Status Design is selected
    if (field === 'tanggalStatusDesign' && value) {
      updatedItem.tanggalAcuanKonten = value;
      updatedItem.tanggalAcuanWarna = value;
    }

    setTempItem(updatedItem);

    // Filter custom items when typing item name
    if (field === 'itemName' && typeof value === 'string') {
      if (value.length > 0) {
        const filtered = customItems.filter(item =>
          item.namaBarang.toLowerCase().includes(value.toLowerCase()) ||
          item.kodeBarang.toLowerCase().includes(value.toLowerCase())
        );
        setFilteredItems(filtered.slice(0, 10)); // Limit to 10 suggestions
        setShowItemSuggestions(filtered.length > 0);
      } else {
        setShowItemSuggestions(false);
        setFilteredItems([]);
      }
    }
  };

  const selectCustomItem = (item: CustomItem) => {
    setTempItem({
      ...tempItem,
      itemName: item.namaBarang,
      customItemId: item.id,
    });
    setShowItemSuggestions(false);
    setFilteredItems([]);
  };

  const selectPriceFormula = (formulaId: string) => {
    const formula = priceFormulas.find(f => f.id === formulaId);
    if (formula) {
      setTempItem({
        ...tempItem,
        formulaHarga: formulaId,
        opsiHarga: '', // Reset opsi harga when formula changes
      });
    }
  };

  const selectOpsiHarga = (opsiLabel: string) => {
    const formula = priceFormulas.find(f => f.id === tempItem.formulaHarga);
    const updatedItem: any = {
      ...tempItem,
      opsiHarga: opsiLabel,
    };

    if (formula?.opsiHarga) {
      const selectedOpsi = formula.opsiHarga.find(opsi => opsi.label === opsiLabel);
      if (selectedOpsi) {
        updatedItem.unitPrice = selectedOpsi.harga;
      }
    }

    setTempItem(updatedItem);
  };

  const copyFromFormula = () => {
    if (!tempItem.formulaHarga) {
      toast.error('Pilih formula harga terlebih dahulu');
      return;
    }

    const formula = priceFormulas.find(f => f.id === tempItem.formulaHarga);
    if (!formula) {
      toast.error('Formula tidak ditemukan');
      return;
    }

    // Copy all available specification fields from formula
    const updatedItem: Partial<QuotationItem> = {
      ...tempItem,
    };

    // Copy common fields
    if (formula.bahan) updatedItem.bahan = formula.bahan;
    if (formula.alas) updatedItem.jenisAlas = formula.alas;
    if (formula.jenisBentuk) updatedItem.jenisBentuk = formula.jenisBentuk;
    if (formula.ziplock) updatedItem.ziplock = formula.ziplock;
    if (formula.toleransi) updatedItem.toleransi = formula.toleransi;
    if (formula.laminasi) updatedItem.laminasi = formula.laminasi;
    if (formula.vCut) updatedItem.vCut = formula.vCut;
    if (formula.sudut) updatedItem.sudut = formula.sudut;
    if (formula.posisiVCut) updatedItem.posisiVCut = formula.posisiVCut;
    if (formula.sisiBuka) updatedItem.sisiBuka = formula.sisiBuka;
    if (formula.hole) updatedItem.hole = formula.hole;
    if (formula.aksesoris) updatedItem.aksesoris = formula.aksesoris;

    // Copy layout fields (Flexibel specific)
    if (formula.jmlMata) updatedItem.jmlMata = formula.jmlMata;
    if (formula.jmlPotong) updatedItem.jmlPotong = formula.jmlPotong.toString();
    if (formula.ukuranKertas) updatedItem.kertas = formula.ukuranKertas;
    if (formula.layoutPanjang) updatedItem.ukuranLayoutPanjang = formula.layoutPanjang.toString();
    if (formula.layoutLebar) updatedItem.ukuranLayoutLebar = formula.layoutLebar.toString();

    // Copy dimensions
    if (formula.ukuranLebar) updatedItem.lebar = formula.ukuranLebar.toString();
    if (formula.ukuranTinggi) updatedItem.tinggi = formula.ukuranTinggi.toString();
    if (formula.ukuranPanjang) updatedItem.panjang = formula.ukuranPanjang.toString();
    if (formula.lipatan) updatedItem.lipatan = formula.lipatan.toString();

    // Copy harga jual ke unit price jika tidak ada opsi harga atau jika opsi harga belum dipilih
    if (formula.hargaJual && (!tempItem.opsiHarga || tempItem.opsiHarga === '')) {
      updatedItem.unitPrice = formula.hargaJual;
    }

    setTempItem(updatedItem as QuotationItem);
    toast.success('Data berhasil disalin dari formula');
  };

  const copyFromNameItem = () => {
    if (!tempItem.customItemId) {
      toast.error('Pilih nama item dari daftar autocomplete terlebih dahulu');
      return;
    }

    const customItem = customItems.find(item => item.id === tempItem.customItemId);
    if (!customItem) {
      toast.error('Barang custom tidak ditemukan');
      return;
    }

    // Copy data from custom item to tempItem
    const updatedItem: Partial<QuotationItem> = {
      ...tempItem,
      itemCode: customItem.kodeBarang || tempItem.itemCode,
      itemName: customItem.namaBarang || tempItem.itemName,
      jenisOrder: customItem.jenisOrder || tempItem.jenisOrder,
      jenisKemasan: customItem.jenisKemasan || tempItem.jenisKemasan,
      unit: customItem.satuan || tempItem.unit,
    };

    // Copy specifications
    if (customItem.ziplock) updatedItem.ziplock = customItem.ziplock;
    if (customItem.bentuk) updatedItem.jenisBentuk = customItem.bentuk;

    // Copy dimensions from dimensi object or direct fields
    if (customItem.dimensi) {
      if (customItem.dimensi.lebar) updatedItem.lebar = customItem.dimensi.lebar;
      if (customItem.dimensi.tinggi) updatedItem.tinggi = customItem.dimensi.tinggi;
      if (customItem.dimensi.panjang) updatedItem.panjang = customItem.dimensi.panjang;
    } else {
      if (customItem.lebar) updatedItem.lebar = customItem.lebar;
      if (customItem.tinggi) updatedItem.tinggi = customItem.tinggi;
      if (customItem.panjang) updatedItem.panjang = customItem.panjang;
    }

    setTempItem(updatedItem as QuotationItem);
    toast.success('Data berhasil disalin dari nama item');
  };

  const getCustomerNamesFromPipelines = () => {
    const customerNames = new Set<string>();

    // Get all customer names from pipelines
    pipelines.forEach(pipeline => {
      if (pipeline.customer && pipeline.customer.trim() !== '') {
        customerNames.add(pipeline.customer);
      }
    });

    // Get all customer names from followups
    followups.forEach(followup => {
      if (followup.customerName && followup.customerName.trim() !== '') {
        customerNames.add(followup.customerName);
      }
    });

    // IMPORTANT: Jika formData.customerName sudah terisi (dari auto-fill pipeline),
    // pastikan masuk ke dalam list agar dropdown bisa menampilkannya
    if (formData.customerName && formData.customerName.trim() !== '') {
      customerNames.add(formData.customerName);
    }

    // Convert to sorted array
    const result = Array.from(customerNames).sort();
    return result;
  };

  const getCustomerAddressFromPipeline = (customerName: string) => {
    // Cari pipeline dengan customer name yang sama (cari yang terbaru)
    const matchedPipeline = pipelines
      .filter(p => p.customer === customerName)
      .sort((a, b) => new Date(b.tanggal).getTime() - new Date(a.tanggal).getTime())[0];

    if (matchedPipeline?.alamat) {
      return matchedPipeline.alamat;
    }

    // Jika tidak ada di pipeline, coba cari di followup
    const matchedFollowup = followups
      .filter(f => f.customerName === customerName)
      .sort((a, b) => new Date(b.tanggal).getTime() - new Date(a.tanggal).getTime())[0];

    if (matchedFollowup) {
      const relatedPipeline = pipelines.find(p => p.id === matchedFollowup.pipelineId);
      if (relatedPipeline?.alamat) {
        return relatedPipeline.alamat;
      }
    }

    return '';
  };

  const getFilteredPipelines = () => {
    if (!pipelineSearch) return { pipelines, followups };

    const searchLower = pipelineSearch.toLowerCase();

    const filteredPipelines = pipelines.filter((p) => {
      const displayText = `${formatDate(p.tanggal)} ${getPipelineNumber(p.id)} ${p.customer} ${p.stage}`.toLowerCase();
      return displayText.includes(searchLower);
    });

    const filteredFollowups = followups.filter((f) => {
      const displayText = `${formatDate(f.tanggal)} ${getPipelineNumber(f.id)} ${f.customerName} ${f.aktivitas || f.stage || ''}`.toLowerCase();
      return displayText.includes(searchLower);
    });

    return { pipelines: filteredPipelines, followups: filteredFollowups };
  };

  const getPipelineDisplayText = (id: string) => {
    if (!id) return '';

    const pipeline = pipelines.find(p => p.id === id);
    if (pipeline) {
      return `${formatDate(pipeline.tanggal)} - ${getPipelineNumber(pipeline.id)} - ${pipeline.customer} - ${pipeline.stage}`;
    }

    const followup = followups.find(f => f.id === id);
    if (followup) {
      return `[F/U] ${formatDate(followup.tanggal)} - ${getPipelineNumber(followup.id)} - ${followup.customerName} - ${followup.aktivitas || followup.stage || '-'}`;
    }

    return '';
  };

  const handlePipelineSelect = (id: string) => {
    const pipeline = pipelines.find(p => p.id === id);
    const followup = followups.find(f => f.id === id);

    let updatedData = { ...formData, pipelineId: id };

    // Set default values
    updatedData.syaratPembayaran = 'Pembayaran langsung';
    updatedData.kenaPajak = true;
    updatedData.totalTermasukFaktur = true;

    if (pipeline) {
      // Auto-fill customer name dari pipeline.customer
      if (pipeline.customer) {
        updatedData.customerName = pipeline.customer;
      }

      // Auto-fill alamat customer dari pipeline.alamat
      if (pipeline.alamat) {
        updatedData.alamatCustomer = pipeline.alamat;
      }

      // Auto-fill sales person dari pipeline.picSales
      if (pipeline.picSales) {
        updatedData.salesPerson = pipeline.picSales;
      }
    } else if (followup) {
      // Auto-fill customer name dari followup.customerName
      if (followup.customerName) {
        updatedData.customerName = followup.customerName;
      }

      // Find the related pipeline for followup untuk data lainnya
      const relatedPipeline = pipelines.find(p => p.id === followup.pipelineId);

      if (relatedPipeline) {
        // Jika belum ada customer name dari followup, ambil dari pipeline
        if (!updatedData.customerName && relatedPipeline.customer) {
          updatedData.customerName = relatedPipeline.customer;
        }

        // Auto-fill alamat customer dari related pipeline
        if (relatedPipeline.alamat) {
          updatedData.alamatCustomer = relatedPipeline.alamat;
        }

        // Auto-fill sales person dari related pipeline
        if (relatedPipeline.picSales) {
          updatedData.salesPerson = relatedPipeline.picSales;
        }
      }
    }
    setFormData(updatedData);
    setPipelineSearch(getPipelineDisplayText(id));
    setShowPipelineSuggestions(false);
  };

  const handlePipelineSearchChange = (value: string) => {
    setPipelineSearch(value);
    if (value.length > 0) {
      setShowPipelineSuggestions(true);
    } else {
      setShowPipelineSuggestions(false);
      setFormData({ ...formData, pipelineId: '' });
    }
  };

  const calculateGrandTotal = () => {
    return formData.items.reduce((sum, item) => sum + item.totalPrice, 0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.customerName || !formData.validUntil) {
      toast.error('Customer dan Valid Hingga wajib diisi');
      return;
    }

    if (formData.items.length === 0) {
      toast.error('Minimal harus ada 1 item');
      return;
    }

    try {
      setLoading(true);
      const payload = {
        ...formData,
        tanggal: formData.tanggal instanceof Date ? formData.tanggal.toISOString().split('T')[0] : formData.tanggal,
        validUntil: formData.validUntil instanceof Date ? formData.validUntil.toISOString().split('T')[0] : formData.validUntil,
        totalAmount: calculateGrandTotal(),
        createdAt: new Date().toISOString(),
      };

      let createdQuotation;
      if (isEdit && id) {
        await api.updateQuotation(id, payload);
        toast.success('Penawaran berhasil diperbarui');
      } else {
        createdQuotation = await api.createQuotation(payload);
        console.log('✅ Quotation created:', createdQuotation);
        toast.success('Penawaran berhasil dibuat');
      }

      // Check if we need to return to follow-up
      const urlParams = new URLSearchParams(window.location.search);
      const returnToFollowUp = urlParams.get('returnToFollowUp');
      console.log('🔍 Check return to follow-up:', { returnToFollowUp, createdQuotation, isEdit });

      if (returnToFollowUp === 'true' && !isEdit) {
        // Save the quotation number to localStorage
        const quotationNumber = createdQuotation?.quotationNumber || createdQuotation?.nomorPenawaran || payload.quotationNumber || payload.nomorPenawaran || `QT-${Date.now()}`;
        console.log('💾 Saving quotation number to localStorage:', quotationNumber);
        localStorage.setItem('newQuotationNumber', quotationNumber);

        // Verify localStorage saved
        const savedNumber = localStorage.getItem('newQuotationNumber');
        console.log('✔️ Verified localStorage:', savedNumber);

        // Navigate back to pipeline detail
        const pipelineId = formData.pipelineId;
        console.log('🔙 Navigating back to pipeline:', pipelineId);

        if (pipelineId) {
          // Add a small delay to ensure localStorage is saved before navigation
          setTimeout(() => {
            navigate(`/sales/pipeline/detail/${pipelineId}`);
          }, 100);
        } else {
          console.warn('⚠️ No pipeline ID found, navigating to quotations list');
          navigate('/sales/quotations');
        }
      } else {
        console.log('📄 Normal flow - navigating to quotations list');
        navigate('/sales/quotations');
      }
    } catch (error) {
      console.error('Error saving quotation:', error);
      toast.error('Gagal menyimpan data');
    } finally {
      setLoading(false);
    }
  };

  if (loading && isEdit) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="text-lg font-medium">Memuat data...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-4">
      <PageHeader
        title={isEdit ? 'Edit Penawaran' : 'Buat Penawaran Baru'}
        description={isEdit ? 'Perbarui data penawaran' : 'Buat penawaran harga baru untuk customer'}
        breadcrumbs={[
          { label: 'Dashboard', href: '/' },
          { label: 'Sales' },
          { label: 'Penawaran', href: '/sales/quotations' },
          { label: isEdit ? 'Edit' : 'Buat Baru' },
        ]}
        actions={
          <Button variant="outline" onClick={() => navigate('/sales/quotations')}>
            <ChevronLeft className="w-4 h-4 mr-2" />
            Kembali
          </Button>
        }
      />

      <form onSubmit={handleSubmit}>
        <div className="space-y-6">
          {/* Header Information */}
          <Card className="p-6">
            <h3 className="font-semibold text-base border-b pb-2 mb-4">Informasi Penawaran</h3>
            <div className="space-y-3">
              {/* Pipeline - Full Width Row */}
              <div className="grid grid-cols-[120px_1fr] items-center gap-1">
                <Label htmlFor="pipelineId">Pipeline</Label>
                <div className="relative" id="pipeline-combobox">
                  <Input
                    type="text"
                    placeholder="Ketik untuk mencari atau pilih pipeline..."
                    value={pipelineSearch}
                    onChange={(e) => handlePipelineSearchChange(e.target.value)}
                    onFocus={() => {
                      if (pipelineSearch.length > 0 || pipelines.length > 0) {
                        setShowPipelineSuggestions(true);
                      }
                    }}
                    className="w-full"
                    autoComplete="off"
                  />
                  {showPipelineSuggestions && (
                    <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border rounded-md shadow-lg max-h-60 overflow-auto pipeline-dropdown">
                      <div
                        className="px-3 py-2 hover:bg-muted cursor-pointer border-b"
                        onClick={() => {
                          setFormData({ ...formData, pipelineId: '' });
                          setPipelineSearch('');
                          setShowPipelineSuggestions(false);
                        }}
                      >
                        <div className="text-sm text-muted-foreground">Tidak Ada</div>
                      </div>
                      {getFilteredPipelines().pipelines.map((pipeline, index) => (
                        <div
                          key={pipeline.id || `pipeline-${index}`}
                          className="px-3 py-2 hover:bg-muted cursor-pointer border-b last:border-b-0"
                          onClick={() => handlePipelineSelect(pipeline.id)}
                        >
                          <div className="text-sm">
                            {formatDate(pipeline.tanggal)} - {getPipelineNumber(pipeline.id)} - {pipeline.customer} - {pipeline.stage}
                          </div>
                        </div>
                      ))}
                      {getFilteredPipelines().followups.map((followup, index) => (
                        <div
                          key={followup.id || `followup-${index}`}
                          className="px-3 py-2 hover:bg-muted cursor-pointer border-b last:border-b-0"
                          onClick={() => handlePipelineSelect(followup.id)}
                        >
                          <div className="text-sm">
                            [F/U] {formatDate(followup.tanggal)} - {getPipelineNumber(followup.id)} - {followup.customerName} - {followup.aktivitas || followup.stage || '-'}
                          </div>
                        </div>
                      ))}
                      {getFilteredPipelines().pipelines.length === 0 && getFilteredPipelines().followups.length === 0 && pipelineSearch && (
                        <div className="px-3 py-2 text-sm text-muted-foreground text-center">
                          Tidak ada hasil ditemukan
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Two Column Layout for Other Fields */}
              <div className="grid grid-cols-2 gap-1">
                <div className="grid grid-cols-[120px_1fr] items-center gap-1">
                  <Label htmlFor="tanggal">Tanggal *</Label>
                  <DatePicker
                    value={formData.tanggal}
                    onChange={(date) => setFormData({ ...formData, tanggal: date || new Date() })}
                    placeholder="Pilih tanggal"
                    className="w-full"
                  />
                </div>

                <div className="grid grid-cols-[120px_1fr] items-center gap-1">
                  <Label htmlFor="validUntil">Valid Hingga *</Label>
                  <DatePicker
                    value={formData.validUntil}
                    onChange={(date) => setFormData({ ...formData, validUntil: date })}
                    placeholder="Pilih tanggal berakhir"
                    className="w-full"
                  />
                </div>

                <div className="grid grid-cols-[120px_1fr] items-center gap-1">
                  <Label htmlFor="customerName">Customer *</Label>
                  <Select
                    value={formData.customerName || ''}
                    onValueChange={(value) => {
                      // Ambil alamat dari pipeline (bukan dari tabel customer)
                      const customerAddress = getCustomerAddressFromPipeline(value);

                      setFormData({
                        ...formData,
                        customerName: value,
                        alamatCustomer: customerAddress || formData.alamatCustomer
                      });
                    }}
                  >
                    <SelectTrigger id="customerName">
                      <SelectValue placeholder="Pilih customer" />
                    </SelectTrigger>
                    <SelectContent>
                      {getCustomerNamesFromPipelines().map((customerName) => (
                        <SelectItem key={customerName} value={customerName}>
                          {customerName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-[120px_1fr] items-center gap-1">
                  <Label htmlFor="salesPerson">Sales Person</Label>
                  <Select
                    value={formData.salesPerson}
                    onValueChange={(value) => setFormData({ ...formData, salesPerson: value })}
                  >
                    <SelectTrigger id="salesPerson">
                      <SelectValue placeholder="Pilih sales person" />
                    </SelectTrigger>
                    <SelectContent>
                      {users.filter(u => u.username && typeof u.username === 'string' && u.username.trim() !== '').map((user, index) => (
                        <SelectItem key={user.id || `user-${index}`} value={user.username}>
                          {user.username}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="col-span-2 grid grid-cols-[120px_1fr] items-start gap-1">
                  <Label htmlFor="alamatCustomer" className="pt-2">Alamat Customer</Label>
                  <div className="space-y-2">
                    <div className="flex items-center gap-1">
                      <Checkbox
                        id="useCustomerAddress"
                        checked={useCustomerAddress}
                        onCheckedChange={(checked) => {
                          setUseCustomerAddress(checked as boolean);
                          if (checked) {
                            const selectedCustomer = customers.find(c => c.customerName === formData.customerName);
                            if (selectedCustomer) {
                              const customerAddress = selectedCustomer.shippingAddress?.fullAddress || selectedCustomer.billingAddress?.fullAddress || '';
                              setFormData({ ...formData, alamatCustomer: customerAddress });
                            }
                          }
                        }}
                      />
                      <Label htmlFor="useCustomerAddress" className="text-sm font-normal cursor-pointer">
                        Sesuaikan dengan data customer
                      </Label>
                    </div>
                    <Textarea
                      id="alamatCustomer"
                      value={formData.alamatCustomer}
                      onChange={(e) => setFormData({ ...formData, alamatCustomer: e.target.value })}
                      placeholder="Alamat lengkap customer"
                      rows={3}
                      disabled={useCustomerAddress}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-[120px_1fr] items-center gap-1">
                  <Label htmlFor="syaratPembayaran">Syarat Pembayaran</Label>
                  <Select
                    value={formData.syaratPembayaran}
                    onValueChange={(value) => setFormData({ ...formData, syaratPembayaran: value })}
                  >
                    <SelectTrigger id="syaratPembayaran">
                      <SelectValue placeholder="Pilih syarat pembayaran" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Pembayaran langsung">Pembayaran langsung</SelectItem>
                      <SelectItem value="Net 15">Net 15</SelectItem>
                      <SelectItem value="Net 30">Net 30</SelectItem>
                      <SelectItem value="Net 45">Net 45</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-[120px_1fr] items-center gap-1">
                  <Label>Pajak</Label>
                  <div className="flex gap-4">
                    <div className="flex items-center gap-1">
                      <Checkbox
                        id="kenaPajak"
                        checked={formData.kenaPajak}
                        onCheckedChange={(checked) => setFormData({ ...formData, kenaPajak: checked as boolean })}
                      />
                      <Label htmlFor="kenaPajak" className="text-sm font-normal cursor-pointer">
                        Kena Pajak
                      </Label>
                    </div>
                    <div className="flex items-center gap-1">
                      <Checkbox
                        id="totalTermasukFaktur"
                        checked={formData.totalTermasukFaktur}
                        onCheckedChange={(checked) => setFormData({ ...formData, totalTermasukFaktur: checked as boolean })}
                      />
                      <Label htmlFor="totalTermasukFaktur" className="text-sm font-normal cursor-pointer">
                        Total Termasuk Faktur
                      </Label>
                    </div>
                  </div>
                </div>

                <div className="col-span-2 grid grid-cols-[120px_1fr] items-start gap-1">
                  <Label htmlFor="notes" className="pt-2">Catatan</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="Catatan tambahan untuk penawaran ini"
                    rows={2}
                  />
                </div>
              </div>
            </div>
          </Card>

          {/* Items */}
          <Card className="p-6">
            <div className="flex justify-between items-center border-b pb-2 mb-4">
              <h3 className="font-semibold text-base">Item Penawaran</h3>
              <div className="flex gap-2 items-center">
                <Popover open={openPreviousItemCombobox} onOpenChange={setOpenPreviousItemCombobox}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={openPreviousItemCombobox}
                      className="w-[400px] h-9 justify-between font-normal"
                    >
                      <span className="truncate">
                        {selectedPreviousItem
                          ? (() => {
                              const item = previousQuotationItems.find((item) => item.kodeItemPenawaran === selectedPreviousItem);
                              if (!item) return "Pilih item penawaran sebelumnya";
                              const quotationNum = (item as any)._quotationNumber || item.kodeItemPenawaran;
                              const quotationDate = (item as any)._quotationDate ? ` - ${formatDate((item as any)._quotationDate)}` : '';
                              return `${quotationNum}${quotationDate}`;
                            })()
                          : "Pilih item penawaran sebelumnya"}
                      </span>
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[450px] p-0">
                    <Command>
                      <CommandInput placeholder="Cari no penawaran, kode item, nama, quantity, atau jenis kemasan..." />
                      <CommandList>
                        <CommandEmpty>Tidak ada item ditemukan.</CommandEmpty>
                        <CommandGroup>
                          {previousQuotationItems
                            .filter(item => item.kodeItemPenawaran && typeof item.kodeItemPenawaran === 'string' && item.kodeItemPenawaran.trim() !== '')
                            .slice(0, 100)
                            .map((item) => (
                              <CommandItem
                                key={(item as any)._uniqueKey || item.kodeItemPenawaran}
                                value={`${(item as any)._quotationNumber || item.kodeItemPenawaran} ${(item as any)._quotationDate || ''} ${item.itemName} ${item.jenisKemasan} ${item.quantity} ${item.kodeItemPenawaran}`}
                                onSelect={() => {
                                  selectPreviousItem(item.kodeItemPenawaran || '');
                                }}
                              >
                                <Check
                                  className={`mr-2 h-4 w-4 shrink-0 ${
                                    selectedPreviousItem === item.kodeItemPenawaran ? "opacity-100" : "opacity-0"
                                  }`}
                                />
                                <div className="flex flex-col flex-1 min-w-0">
                                  <span className="font-medium text-sm">
                                    {(item as any)._quotationNumber || item.kodeItemPenawaran}
                                    {(item as any)._quotationDate && ` - ${formatDate((item as any)._quotationDate)}`}
                                  </span>
                                  <span className="text-xs text-muted-foreground truncate">
                                    {item.itemName} - {item.quantity} {item.unit || 'Pcs'} - {item.jenisKemasan} ({item.kodeItemPenawaran})
                                  </span>
                                </div>
                              </CommandItem>
                            ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
                <Button type="button" variant="outline" size="sm" onClick={addItem}>
                  <Plus className="w-4 h-4 mr-2" />
                  Tambah Item
                </Button>
              </div>
            </div>

            {formData.items.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="text-left p-2 border">No</th>
                      <th className="text-left p-2 border">Nama Item</th>
                      <th className="text-left p-2 border">Jenis Kemasan</th>
                      <th className="text-right p-2 border">Qty</th>
                      <th className="text-left p-2 border">Satuan</th>
                      <th className="text-right p-2 border">Harga Satuan</th>
                      <th className="text-right p-2 border">Diskon</th>
                      <th className="text-center p-2 border">PPN</th>
                      <th className="text-right p-2 border">Total</th>
                      <th className="text-center p-2 border">Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {formData.items.map((item, index) => (
                      <tr key={index} className="hover:bg-muted/30">
                        <td className="p-2 border">{index + 1}</td>
                        <td className="p-2 border">{item.itemName}</td>
                        <td className="p-2 border">{item.jenisKemasan || '-'}</td>
                        <td className="p-2 border text-right">{item.quantity}</td>
                        <td className="p-2 border">{item.unit}</td>
                        <td className="p-2 border text-right">
                          {new Intl.NumberFormat('id-ID').format(item.unitPrice)}
                        </td>
                        <td className="p-2 border text-right">
                          {item.diskon > 0 ? (
                            item.diskonType === 'percentage'
                              ? `${item.diskon}%`
                              : new Intl.NumberFormat('id-ID').format(item.diskon)
                          ) : '-'}
                        </td>
                        <td className="p-2 border text-center">
                          {item.pajakPPN ? '✓' : '-'}
                        </td>
                        <td className="p-2 border text-right font-semibold">
                          {new Intl.NumberFormat('id-ID').format(item.totalPrice)}
                        </td>
                        <td className="p-2 border text-center">
                          <div className="flex gap-1 justify-center">
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => editItem(index)}
                              className="h-7 px-2"
                            >
                              Edit
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeItem(index)}
                              className="h-7 px-2 text-destructive hover:text-destructive"
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                Belum ada item. Klik "Tambah Item" untuk menambahkan.
              </div>
            )}

            {/* Grand Total */}
            <div className="mt-4 pt-4 border-t">
              <div className="flex justify-end">
                <div className="w-64">
                  <div className="flex justify-between items-center text-lg font-bold">
                    <span>Grand Total:</span>
                    <span className="text-green-700 dark:text-green-400">
                      {new Intl.NumberFormat('id-ID', {
                        style: 'currency',
                        currency: 'IDR',
                        minimumFractionDigits: 0,
                      }).format(calculateGrandTotal())}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* Submit Button */}
          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => navigate('/sales/quotations')}>
              Batal
            </Button>
            <Button type="submit" disabled={loading}>
              <Save className="w-4 h-4 mr-2" />
              {loading ? 'Menyimpan...' : isEdit ? 'Perbarui Penawaran' : 'Simpan Penawaran'}
            </Button>
          </div>
        </div>
      </form>

      {/* Item Modal */}
      <Dialog open={showItemModal} onOpenChange={(open) => {
        setShowItemModal(open);
        if (!open) {
          setShowItemSuggestions(false);
          setFilteredItems([]);
        }
      }}>
        <DialogContent className="!max-w-[70vw] w-[70vw]">
          <DialogHeader>
            <DialogTitle>{editingItemIndex !== null ? 'Edit Item' : 'Tambah Item'}</DialogTitle>
          </DialogHeader>

          <Tabs value={itemModalTab} onValueChange={setItemModalTab}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="info">Informasi Item</TabsTrigger>
              <TabsTrigger value="spec">Spesifikasi</TabsTrigger>
              <TabsTrigger value="bahan">Bahan</TabsTrigger>
            </TabsList>

            <TabsContent value="info" className="space-y-2 mt-4">
              {/* Row 1: Kode Item Penawaran | Tanggal */}
              <div className="grid grid-cols-2 gap-4">
                <div className="grid grid-cols-[140px_1fr] items-center gap-2">
                  <Label htmlFor="modal-kodeItemPenawaran">Kode Item Penawaran</Label>
                  <Input
                    id="modal-kodeItemPenawaran"
                    value={tempItem.kodeItemPenawaran || ''}
                    readOnly
                    className="bg-muted"
                  />
                </div>
                <div className="grid grid-cols-[100px_1fr] items-center gap-2">
                  <Label htmlFor="modal-tanggalItem">Tanggal</Label>
                  <Input
                    id="modal-tanggalItem"
                    value={tempItem.tanggalItem ? new Date(tempItem.tanggalItem).toLocaleDateString('id-ID') : ''}
                    readOnly
                    className="bg-muted"
                  />
                </div>
              </div>

              {/* Row 2: Nama Item | Kode Barang */}
              <div className="grid grid-cols-2 gap-4">
                <div className="grid grid-cols-[140px_1fr] items-center gap-2">
                  <Label htmlFor="modal-itemName">Nama Item *</Label>
                  <div className="relative">
                    <Input
                      id="modal-itemName"
                      value={tempItem.itemName}
                      onChange={(e) => updateTempItem('itemName', e.target.value)}
                      onFocus={() => {
                        if (tempItem.itemName && filteredItems.length > 0) {
                          setShowItemSuggestions(true);
                        }
                      }}
                      placeholder="Ketik untuk mencari atau isi manual"
                      autoComplete="off"
                    />
                    {showItemSuggestions && filteredItems.length > 0 && (
                      <div className="absolute z-50 w-full mt-1 bg-white border rounded-md shadow-lg max-h-60 overflow-auto">
                        {filteredItems.map((item) => (
                          <div
                            key={item.id}
                            className="px-3 py-2 hover:bg-muted cursor-pointer border-b last:border-b-0"
                            onClick={() => selectCustomItem(item)}
                          >
                            <div className="font-medium">{item.namaBarang}</div>
                            <div className="text-xs text-muted-foreground">
                              Kode: {item.kodeBarang} | Jenis: {item.jenisOrder} | Kemasan: {item.jenisKemasan} | Satuan: {item.satuan}
                              {(() => {
                                const bentuk = item.jenisBentuk?.toLowerCase();
                                if (bentuk === 'boks' && item.panjang && item.lebar && item.tinggi) {
                                  return ` | Ukuran: ${item.panjang} x ${item.lebar} x ${item.tinggi}`;
                                } else if (bentuk === 'gusset' && item.lebar && item.tinggi && item.lipatan) {
                                  return ` | Ukuran: ${item.lebar} x ${item.tinggi} x ${item.lipatan}`;
                                } else if (bentuk === 'roll' && item.lebar && item.panjang) {
                                  return ` | Ukuran: ${item.lebar} x ${item.panjang}`;
                                } else if (item.lebar && item.tinggi) {
                                  return ` | Ukuran: ${item.lebar} x ${item.tinggi}`;
                                }
                                return '';
                              })()}
                              {item.ziplock && ` | ${item.ziplock}`}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-[100px_1fr] items-center gap-2">
                  <Label htmlFor="modal-itemCode">Kode Barang</Label>
                  <Input
                    id="modal-itemCode"
                    value={tempItem.itemCode}
                    onChange={(e) => updateTempItem('itemCode', e.target.value)}
                    placeholder="Kode barang"
                  />
                </div>
              </div>

              {/* Row 3: Jenis Kemasan | Formula Harga */}
              <div className="grid grid-cols-2 gap-4">
                <div className="grid grid-cols-[140px_1fr] items-center gap-2">
                  <Label htmlFor="modal-jenisKemasan">Jenis Kemasan</Label>
                  <div className="relative">
                    <Input
                      id="modal-jenisKemasan"
                      value={tempItem.jenisKemasan}
                      onChange={(e) => updateTempItem('jenisKemasan', e.target.value)}
                      onFocus={() => setShowJenisKemasanSuggestions(true)}
                      placeholder="Ketik atau pilih jenis kemasan"
                      autoComplete="off"
                    />
                    {showJenisKemasanSuggestions && (
                      <div className="jenis-kemasan-dropdown absolute z-50 w-full mt-1 bg-white border rounded-md shadow-lg">
                        {['Flexibel', 'Boks', 'Roto', 'Polos']
                          .filter(jenis =>
                            jenis.toLowerCase().includes(tempItem.jenisKemasan?.toLowerCase() || '')
                          )
                          .map((jenis) => (
                            <div
                              key={jenis}
                              className="px-3 py-2 hover:bg-muted cursor-pointer border-b last:border-b-0"
                              onClick={() => {
                                updateTempItem('jenisKemasan', jenis);
                                setShowJenisKemasanSuggestions(false);
                              }}
                            >
                              <div className="font-medium">{jenis}</div>
                            </div>
                          ))}
                      </div>
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-[100px_1fr] items-center gap-2">
                  <Label htmlFor="modal-formulaHarga">Formula Harga</Label>
                  <Select
                    value={tempItem.formulaHarga}
                    onValueChange={(value) => selectPriceFormula(value)}
                  >
                    <SelectTrigger id="modal-formulaHarga">
                      <SelectValue placeholder="Pilih formula harga" />
                    </SelectTrigger>
                    <SelectContent>
                      {priceFormulas.length > 0 ? (
                        priceFormulas.filter(f => f.id && typeof f.id === 'string' && f.id.trim() !== '').map((formula) => (
                          <SelectItem key={formula.id} value={formula.id}>
                            <div className="flex flex-col">
                              <span className="font-medium">{formula.labelKode}</span>
                              <span className="text-xs text-muted-foreground">
                                {formula.namaBarang} - {formula.customer}
                                {formula.status && ` • ${formula.status.toUpperCase()}`}
                              </span>
                            </div>
                          </SelectItem>
                        ))
                      ) : (
                        <div className="px-2 py-1.5 text-sm text-muted-foreground">
                          Tidak ada formula tersedia untuk jenis kemasan ini
                        </div>
                      )}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Row 4: Quantity + Satuan | Opsi Harga */}
              <div className="grid grid-cols-2 gap-4">
                <div className="grid grid-cols-[140px_1fr_100px] items-center gap-2">
                  <Label htmlFor="modal-quantity">Quantity *</Label>
                  <Input
                    id="modal-quantity"
                    type="number"
                    value={tempItem.quantity}
                    onChange={(e) => updateTempItem('quantity', parseFloat(e.target.value) || 0)}
                    min="0"
                    step="0.01"
                  />
                  <Select
                    value={tempItem.unit}
                    onValueChange={(value) => updateTempItem('unit', value)}
                  >
                    <SelectTrigger id="modal-unit">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Pcs">Pcs</SelectItem>
                      <SelectItem value="Box">Box</SelectItem>
                      <SelectItem value="Kg">Kg</SelectItem>
                      <SelectItem value="Meter">Meter</SelectItem>
                      <SelectItem value="Roll">Roll</SelectItem>
                      <SelectItem value="Set">Set</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {tempItem.formulaHarga && (
                  <div className="grid grid-cols-[100px_1fr] items-center gap-2">
                    <Label htmlFor="modal-opsiHarga">Opsi Harga</Label>
                    <div className="relative">
                      <Input
                        id="modal-opsiHarga"
                        value={tempItem.opsiHarga || ''}
                        onChange={(e) => updateTempItem('opsiHarga', e.target.value)}
                        onFocus={() => setShowOpsiHargaSuggestions(true)}
                        placeholder="Ketik atau pilih opsi harga"
                        autoComplete="off"
                      />
                      {showOpsiHargaSuggestions && (
                        <div className="opsi-harga-dropdown absolute z-50 w-full mt-1 bg-white border rounded-md shadow-lg">
                          {['Opsi 1', 'Opsi 2', 'Opsi 3']
                            .filter(opsi =>
                              opsi.toLowerCase().includes(tempItem.opsiHarga?.toLowerCase() || '')
                            )
                            .map((opsi) => {
                              const formula = priceFormulas.find(f => f.id === tempItem.formulaHarga);
                              const opsiData = formula?.opsiHarga?.find(o => o.label === opsi);

                              return (
                                <div
                                  key={opsi}
                                  className="px-3 py-2 hover:bg-muted cursor-pointer border-b last:border-b-0"
                                  onClick={() => {
                                    selectOpsiHarga(opsi);
                                    setShowOpsiHargaSuggestions(false);
                                  }}
                                >
                                  <div className="font-medium">{opsi}</div>
                                  {opsiData && (
                                    <div className="text-xs text-muted-foreground">
                                      {new Intl.NumberFormat('id-ID', {
                                        style: 'currency',
                                        currency: 'IDR',
                                        minimumFractionDigits: 0,
                                      }).format(opsiData.harga)}
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Row 5: Harga Satuan | Diskon + %/Rp */}
              <div className="grid grid-cols-2 gap-4">
                <div className="grid grid-cols-[140px_1fr] items-center gap-2">
                  <Label htmlFor="modal-unitPrice">Harga Satuan *</Label>
                  <Input
                    id="modal-unitPrice"
                    type="number"
                    value={tempItem.unitPrice}
                    onChange={(e) => updateTempItem('unitPrice', parseFloat(e.target.value) || 0)}
                    min="0"
                    step="0.01"
                  />
                </div>
                <div className="grid grid-cols-[100px_1fr_100px] items-center gap-2">
                  <Label htmlFor="modal-diskon">Diskon</Label>
                  <Input
                    id="modal-diskon"
                    type="number"
                    value={tempItem.diskon}
                    onChange={(e) => updateTempItem('diskon', parseFloat(e.target.value) || 0)}
                    min="0"
                    step="0.01"
                    placeholder="Nilai diskon"
                  />
                  <Select
                    value={tempItem.diskonType}
                    onValueChange={(value) => updateTempItem('diskonType', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="percentage">%</SelectItem>
                      <SelectItem value="nominal">Rp</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Row 6: Pajak */}
              <div className="grid grid-cols-[140px_1fr] items-center gap-2">
                <Label>Pajak</Label>
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="modal-pajakPPN"
                    checked={tempItem.pajakPPN}
                    onCheckedChange={(checked) => updateTempItem('pajakPPN', checked as boolean)}
                  />
                  <Label htmlFor="modal-pajakPPN" className="text-sm font-normal cursor-pointer">
                    Pajak 12% PPN
                  </Label>
                </div>
              </div>

              {/* Row 7: Total Harga */}
              <div className="grid grid-cols-[140px_1fr] items-center gap-2">
                <Label>Total Harga</Label>
                <div className="text-2xl font-bold text-green-600">
                  {(() => {
                    const subtotal = tempItem.quantity * tempItem.unitPrice;
                    let total = subtotal;
                    if (tempItem.diskon > 0) {
                      if (tempItem.diskonType === 'percentage') {
                        total = subtotal - (subtotal * tempItem.diskon / 100);
                      } else {
                        total = subtotal - tempItem.diskon;
                      }
                    }
                    if (tempItem.pajakPPN) {
                      total = total + (total * 0.12);
                    }
                    return new Intl.NumberFormat('id-ID', {
                      style: 'currency',
                      currency: 'IDR',
                      minimumFractionDigits: 0,
                    }).format(total);
                  })()}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="spec" className="mt-4">
              {tempItem.jenisKemasan?.toLowerCase().includes('flexibel') && (
                <>
                  <div className="mb-2">
                    <h4 className="font-semibold text-sm mb-2">Spesifikasi Flexibel</h4>
                  </div>

                  <div className="grid grid-cols-4 gap-x-4 gap-y-1">
                    <div className="col-span-2 grid grid-cols-[120px_1fr] items-center gap-1">
                      <Label htmlFor="modal-jenisBentuk">Jenis Bentuk</Label>
                      <div className="relative">
                        <Input
                          id="modal-jenisBentuk"
                          value={tempItem.jenisBentuk || ''}
                          onChange={(e) => updateTempItem('jenisBentuk', e.target.value)}
                          onFocus={() => setShowJenisBentukSuggestions(true)}
                          placeholder="Ketik atau pilih jenis bentuk"
                          autoComplete="off"
                        />
                        {showJenisBentukSuggestions && (
                          <div className="jenis-bentuk-dropdown absolute z-50 w-full mt-1 bg-white border rounded-md shadow-lg max-h-60 overflow-auto">
                            {productTypes
                              .filter(type =>
                                type.name.toLowerCase().includes(tempItem.jenisBentuk?.toLowerCase() || '')
                              )
                              .map((type) => (
                                <div
                                  key={type.id}
                                  className="px-3 py-2 hover:bg-muted cursor-pointer border-b last:border-b-0"
                                  onClick={() => {
                                    updateTempItem('jenisBentuk', type.name);
                                    setShowJenisBentukSuggestions(false);
                                  }}
                                >
                                  <div className="font-medium">{type.name}</div>
                                </div>
                              ))}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="col-span-2 grid grid-cols-[120px_1fr] items-center gap-1">
                      <Label htmlFor="modal-toleransi">Toleransi (%)</Label>
                      <Select
                        value={tempItem.toleransi || '10'}
                        onValueChange={(value) => updateTempItem('toleransi', value)}
                      >
                        <SelectTrigger id="modal-toleransi">
                          <SelectValue placeholder="Pilih toleransi" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="5">5%</SelectItem>
                          <SelectItem value="10">10%</SelectItem>
                          <SelectItem value="20">20%</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="col-span-2 grid grid-cols-[120px_1fr] items-center gap-1">
                      <Label htmlFor="modal-statusDesign">Status Design</Label>
                      <Select
                        value={tempItem.statusDesign || ''}
                        onValueChange={(value) => updateTempItem('statusDesign', value)}
                      >
                        <SelectTrigger id="modal-statusDesign">
                          <SelectValue placeholder="Pilih status design" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Repeat Order">Repeat Order</SelectItem>
                          <SelectItem value="Baru">Baru</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="col-span-2 grid grid-cols-[120px_1fr] items-center gap-1">
                      <Label htmlFor="modal-tanggalStatusDesign">Tanggal Status Design</Label>
                      <DatePicker
                        value={tempItem.tanggalStatusDesign || undefined}
                        onChange={(date) => updateTempItem('tanggalStatusDesign', date || null)}
                        placeholder="Pilih tanggal"
                        className="w-full"
                      />
                    </div>

                    <div className="col-span-2 grid grid-cols-[120px_1fr] items-center gap-1">
                      <Label htmlFor="modal-acuanKonten">Acuan Konten</Label>
                      <Select
                        value={tempItem.acuanKonten || ''}
                        onValueChange={(value) => updateTempItem('acuanKonten', value)}
                      >
                        <SelectTrigger id="modal-acuanKonten">
                          <SelectValue placeholder="Pilih acuan konten" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Repeat Order">Repeat Order</SelectItem>
                          <SelectItem value="Baru">Baru</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="col-span-2 grid grid-cols-[120px_1fr] items-center gap-1">
                      <Label htmlFor="modal-tanggalAcuanKonten">Tanggal Acuan Konten</Label>
                      <DatePicker
                        value={tempItem.tanggalAcuanKonten || undefined}
                        onChange={(date) => updateTempItem('tanggalAcuanKonten', date || null)}
                        placeholder="Pilih tanggal"
                        className="w-full"
                      />
                    </div>

                    <div className="col-span-2 grid grid-cols-[120px_1fr] items-center gap-1">
                      <Label htmlFor="modal-acuanWarna">Acuan Warna</Label>
                      <Select
                        value={tempItem.acuanWarna || ''}
                        onValueChange={(value) => updateTempItem('acuanWarna', value)}
                      >
                        <SelectTrigger id="modal-acuanWarna">
                          <SelectValue placeholder="Pilih acuan warna" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Repeat Order">Repeat Order</SelectItem>
                          <SelectItem value="Baru">Baru</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="col-span-2 grid grid-cols-[120px_1fr] items-center gap-1">
                      <Label htmlFor="modal-tanggalAcuanWarna">Tanggal Acuan Warna</Label>
                      <DatePicker
                        value={tempItem.tanggalAcuanWarna || undefined}
                        onChange={(date) => updateTempItem('tanggalAcuanWarna', date || null)}
                        placeholder="Pilih tanggal"
                        className="w-full"
                      />
                    </div>

                    <Separator className="col-span-4 my-2" />

                    <div className="col-span-4 grid grid-cols-[120px_1fr_1fr_1fr] items-center gap-1">
                      <Label>
                        Ukuran
                      </Label>
                      {/* Boks: Panjang, Lebar, Tinggi */}
                      {tempItem.jenisBentuk?.toLowerCase() === 'boks' && (
                        <>
                          <Input
                            id="modal-panjang-boks"
                            value={tempItem.panjang || ''}
                            onChange={(e) => updateTempItem('panjang', e.target.value)}
                            placeholder="Panjang"
                          />
                          <Input
                            id="modal-lebar-boks"
                            value={tempItem.lebar || ''}
                            onChange={(e) => updateTempItem('lebar', e.target.value)}
                            placeholder="Lebar"
                          />
                          <Input
                            id="modal-tinggi-boks"
                            value={tempItem.tinggi || ''}
                            onChange={(e) => updateTempItem('tinggi', e.target.value)}
                            placeholder="Tinggi"
                          />
                        </>
                      )}
                      {/* Gusset: Lebar, Tinggi, Lipatan */}
                      {tempItem.jenisBentuk?.toLowerCase() === 'gusset' && (
                        <>
                          <Input
                            id="modal-lebar-gusset"
                            value={tempItem.lebar || ''}
                            onChange={(e) => updateTempItem('lebar', e.target.value)}
                            placeholder="Lebar"
                          />
                          <Input
                            id="modal-tinggi-gusset"
                            value={tempItem.tinggi || ''}
                            onChange={(e) => updateTempItem('tinggi', e.target.value)}
                            placeholder="Tinggi"
                          />
                          <Input
                            id="modal-lipatan-gusset"
                            value={tempItem.lipatan || ''}
                            onChange={(e) => updateTempItem('lipatan', e.target.value)}
                            placeholder="Lipatan"
                          />
                        </>
                      )}
                      {/* Roll: Lebar, Panjang */}
                      {tempItem.jenisBentuk?.toLowerCase() === 'roll' && (
                        <>
                          <Input
                            id="modal-lebar-roll"
                            value={tempItem.lebar || ''}
                            onChange={(e) => updateTempItem('lebar', e.target.value)}
                            placeholder="Lebar"
                          />
                          <Input
                            id="modal-panjang-roll"
                            value={tempItem.panjang || ''}
                            onChange={(e) => updateTempItem('panjang', e.target.value)}
                            placeholder="Panjang"
                          />
                          <div></div>
                        </>
                      )}
                      {/* Default: Lebar, Tinggi */}
                      {(!tempItem.jenisBentuk || (tempItem.jenisBentuk?.toLowerCase() !== 'boks' && tempItem.jenisBentuk?.toLowerCase() !== 'gusset' && tempItem.jenisBentuk?.toLowerCase() !== 'roll')) && (
                        <>
                          <Input
                            id="modal-lebar"
                            value={tempItem.lebar || ''}
                            onChange={(e) => updateTempItem('lebar', e.target.value)}
                            placeholder="Lebar"
                          />
                          <Input
                            id="modal-tinggi"
                            value={tempItem.tinggi || ''}
                            onChange={(e) => updateTempItem('tinggi', e.target.value)}
                            placeholder="Tinggi"
                          />
                          <div></div>
                        </>
                      )}
                    </div>

                    <div className="col-span-2 grid grid-cols-[120px_1fr] items-center gap-1">
                      <Label htmlFor="modal-vCut">V-Cut</Label>
                      <Select
                        value={tempItem.vCut || ''}
                        onValueChange={(value) => updateTempItem('vCut', value)}
                      >
                        <SelectTrigger id="modal-vCut">
                          <SelectValue placeholder="Pilih v-cut" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Kanan">Kanan</SelectItem>
                          <SelectItem value="Kiri">Kiri</SelectItem>
                          <SelectItem value="Kanan-Kiri">Kanan-Kiri</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="col-span-2 grid grid-cols-[120px_1fr] items-center gap-1">
                      <Label htmlFor="modal-sudut">Sudut</Label>
                      <Select
                        value={tempItem.sudut || ''}
                        onValueChange={(value) => updateTempItem('sudut', value)}
                      >
                        <SelectTrigger id="modal-sudut">
                          <SelectValue placeholder="Pilih sudut" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Lancip">Lancip</SelectItem>
                          <SelectItem value="Lengkung">Lengkung</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="col-span-2 grid grid-cols-[120px_1fr] items-center gap-1">
                      <Label htmlFor="modal-posisiVCut">Posisi V-Cut</Label>
                      <Select
                        value={tempItem.posisiVCut || ''}
                        onValueChange={(value) => updateTempItem('posisiVCut', value)}
                      >
                        <SelectTrigger id="modal-posisiVCut">
                          <SelectValue placeholder="Pilih posisi v-cut" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Sesuai desain">Sesuai desain</SelectItem>
                          <SelectItem value="Sesuai standar">Sesuai standar</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="col-span-2 grid grid-cols-[120px_1fr] items-center gap-1">
                      <Label htmlFor="modal-sisiBuka">Sisi Buka</Label>
                      <Select
                        value={tempItem.sisiBuka || ''}
                        onValueChange={(value) => updateTempItem('sisiBuka', value)}
                      >
                        <SelectTrigger id="modal-sisiBuka">
                          <SelectValue placeholder="Pilih sisi buka" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Atas">Atas</SelectItem>
                          <SelectItem value="Bawah">Bawah</SelectItem>
                          <SelectItem value="Kanan">Kanan</SelectItem>
                          <SelectItem value="Kiri">Kiri</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="col-span-2 grid grid-cols-[120px_1fr] items-center gap-1">
                      <Label htmlFor="modal-hole">Hole</Label>
                      <Select
                        value={tempItem.hole || ''}
                        onValueChange={(value) => updateTempItem('hole', value)}
                      >
                        <SelectTrigger id="modal-hole">
                          <SelectValue placeholder="Pilih hole" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Euro hole">Euro hole</SelectItem>
                          <SelectItem value="Hang hole">Hang hole</SelectItem>
                          <SelectItem value="Pin hole">Pin hole</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="col-span-2 grid grid-cols-[120px_1fr] items-center gap-1">
                      <Label htmlFor="modal-aksesoris">Aksesoris</Label>
                      <Input
                        id="modal-aksesoris"
                        value={tempItem.aksesoris || ''}
                        onChange={(e) => updateTempItem('aksesoris', e.target.value)}
                        placeholder="Aksesoris"
                      />
                    </div>
                  </div>
                </>
              )}

              {tempItem.jenisKemasan?.toLowerCase().includes('roto') && (
                <>
                  <div className="mb-2">
                    <h4 className="font-semibold text-sm mb-2">Spesifikasi Roto</h4>
                  </div>

                  <div className="grid grid-cols-4 gap-x-4 gap-y-1">
                    <div className="col-span-2 grid grid-cols-[120px_1fr] items-center gap-1">
                      <Label htmlFor="modal-jenisBentuk-roto">Jenis Bentuk</Label>
                      <div className="relative">
                        <Input
                          id="modal-jenisBentuk-roto"
                          value={tempItem.jenisBentuk || ''}
                          onChange={(e) => updateTempItem('jenisBentuk', e.target.value)}
                          onFocus={() => setShowJenisBentukSuggestions(true)}
                          placeholder="Ketik atau pilih jenis bentuk"
                          autoComplete="off"
                        />
                        {showJenisBentukSuggestions && (
                          <div className="jenis-bentuk-dropdown absolute z-50 w-full mt-1 bg-white border rounded-md shadow-lg max-h-60 overflow-auto">
                            {productTypes
                              .filter(type =>
                                type.name.toLowerCase().includes(tempItem.jenisBentuk?.toLowerCase() || '')
                              )
                              .map((type) => (
                                <div
                                  key={type.id}
                                  className="px-3 py-2 hover:bg-muted cursor-pointer border-b last:border-b-0"
                                  onClick={() => {
                                    updateTempItem('jenisBentuk', type.name);
                                    setShowJenisBentukSuggestions(false);
                                  }}
                                >
                                  <div className="font-medium">{type.name}</div>
                                </div>
                              ))}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="col-span-2 grid grid-cols-[120px_1fr] items-center gap-1">
                      <Label htmlFor="modal-toleransi-roto">Toleransi (%)</Label>
                      <Select
                        value={tempItem.toleransi || '10'}
                        onValueChange={(value) => updateTempItem('toleransi', value)}
                      >
                        <SelectTrigger id="modal-toleransi-roto">
                          <SelectValue placeholder="Pilih toleransi" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="5">5%</SelectItem>
                          <SelectItem value="10">10%</SelectItem>
                          <SelectItem value="20">20%</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="col-span-2 grid grid-cols-[120px_1fr] items-center gap-1">
                      <Label htmlFor="modal-statusDesign-roto">Status Design</Label>
                      <Select
                        value={tempItem.statusDesign || ''}
                        onValueChange={(value) => updateTempItem('statusDesign', value)}
                      >
                        <SelectTrigger id="modal-statusDesign-roto">
                          <SelectValue placeholder="Pilih status design" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Repeat Order">Repeat Order</SelectItem>
                          <SelectItem value="Baru">Baru</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="col-span-2 grid grid-cols-[120px_1fr] items-center gap-1">
                      <Label htmlFor="modal-tanggalStatusDesign-roto">Tanggal Status Design</Label>
                      <DatePicker
                        value={tempItem.tanggalStatusDesign || undefined}
                        onChange={(date) => updateTempItem('tanggalStatusDesign', date || null)}
                        placeholder="Pilih tanggal"
                        className="w-full"
                      />
                    </div>

                    <div className="col-span-2 grid grid-cols-[120px_1fr] items-center gap-1">
                      <Label htmlFor="modal-acuanKonten-roto">Acuan Konten</Label>
                      <Select
                        value={tempItem.acuanKonten || ''}
                        onValueChange={(value) => updateTempItem('acuanKonten', value)}
                      >
                        <SelectTrigger id="modal-acuanKonten-roto">
                          <SelectValue placeholder="Pilih acuan konten" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Repeat Order">Repeat Order</SelectItem>
                          <SelectItem value="Baru">Baru</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="col-span-2 grid grid-cols-[120px_1fr] items-center gap-1">
                      <Label htmlFor="modal-tanggalAcuanKonten-roto">Tanggal Acuan Konten</Label>
                      <DatePicker
                        value={tempItem.tanggalAcuanKonten || undefined}
                        onChange={(date) => updateTempItem('tanggalAcuanKonten', date || null)}
                        placeholder="Pilih tanggal"
                        className="w-full"
                      />
                    </div>

                    <div className="col-span-2 grid grid-cols-[120px_1fr] items-center gap-1">
                      <Label htmlFor="modal-acuanWarna-roto">Acuan Warna</Label>
                      <Select
                        value={tempItem.acuanWarna || ''}
                        onValueChange={(value) => updateTempItem('acuanWarna', value)}
                      >
                        <SelectTrigger id="modal-acuanWarna-roto">
                          <SelectValue placeholder="Pilih acuan warna" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Repeat Order">Repeat Order</SelectItem>
                          <SelectItem value="Baru">Baru</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="col-span-2 grid grid-cols-[120px_1fr] items-center gap-1">
                      <Label htmlFor="modal-tanggalAcuanWarna-roto">Tanggal Acuan Warna</Label>
                      <DatePicker
                        value={tempItem.tanggalAcuanWarna || undefined}
                        onChange={(date) => updateTempItem('tanggalAcuanWarna', date || null)}
                        placeholder="Pilih tanggal"
                        className="w-full"
                      />
                    </div>

                    <Separator className="col-span-4 my-2" />

                    <div className="col-span-4 grid grid-cols-[120px_1fr_1fr_1fr] items-center gap-1">
                      <Label>Ukuran</Label>
                      {/* Boks: Panjang, Lebar, Tinggi */}
                      {tempItem.jenisBentuk?.toLowerCase() === 'boks' && (
                        <>
                          <Input
                            id="modal-panjang-boks-roto"
                            value={tempItem.panjang || ''}
                            onChange={(e) => updateTempItem('panjang', e.target.value)}
                            placeholder="Panjang"
                          />
                          <Input
                            id="modal-lebar-boks-roto"
                            value={tempItem.lebar || ''}
                            onChange={(e) => updateTempItem('lebar', e.target.value)}
                            placeholder="Lebar"
                          />
                          <Input
                            id="modal-tinggi-boks-roto"
                            value={tempItem.tinggi || ''}
                            onChange={(e) => updateTempItem('tinggi', e.target.value)}
                            placeholder="Tinggi"
                          />
                        </>
                      )}
                      {/* Gusset: Lebar, Tinggi, Lipatan */}
                      {tempItem.jenisBentuk?.toLowerCase() === 'gusset' && (
                        <>
                          <Input
                            id="modal-lebar-gusset-roto"
                            value={tempItem.lebar || ''}
                            onChange={(e) => updateTempItem('lebar', e.target.value)}
                            placeholder="Lebar"
                          />
                          <Input
                            id="modal-tinggi-gusset-roto"
                            value={tempItem.tinggi || ''}
                            onChange={(e) => updateTempItem('tinggi', e.target.value)}
                            placeholder="Tinggi"
                          />
                          <Input
                            id="modal-lipatan-gusset-roto"
                            value={tempItem.lipatan || ''}
                            onChange={(e) => updateTempItem('lipatan', e.target.value)}
                            placeholder="Lipatan"
                          />
                        </>
                      )}
                      {/* Roll: Lebar, Panjang */}
                      {tempItem.jenisBentuk?.toLowerCase() === 'roll' && (
                        <>
                          <Input
                            id="modal-lebar-roll-roto"
                            value={tempItem.lebar || ''}
                            onChange={(e) => updateTempItem('lebar', e.target.value)}
                            placeholder="Lebar"
                          />
                          <Input
                            id="modal-panjang-roll-roto"
                            value={tempItem.panjang || ''}
                            onChange={(e) => updateTempItem('panjang', e.target.value)}
                            placeholder="Panjang"
                          />
                          <div></div>
                        </>
                      )}
                      {/* Default: Lebar, Tinggi */}
                      {(!tempItem.jenisBentuk || (tempItem.jenisBentuk?.toLowerCase() !== 'boks' && tempItem.jenisBentuk?.toLowerCase() !== 'gusset' && tempItem.jenisBentuk?.toLowerCase() !== 'roll')) && (
                        <>
                          <Input
                            id="modal-lebar-roto"
                            value={tempItem.lebar || ''}
                            onChange={(e) => updateTempItem('lebar', e.target.value)}
                            placeholder="Lebar"
                          />
                          <Input
                            id="modal-tinggi-roto"
                            value={tempItem.tinggi || ''}
                            onChange={(e) => updateTempItem('tinggi', e.target.value)}
                            placeholder="Tinggi"
                          />
                          <div></div>
                        </>
                      )}
                    </div>

                    <div className="col-span-2 grid grid-cols-[120px_1fr] items-center gap-1">
                      <Label htmlFor="modal-vCut-roto">V-Cut</Label>
                      <Select
                        value={tempItem.vCut || ''}
                        onValueChange={(value) => updateTempItem('vCut', value)}
                      >
                        <SelectTrigger id="modal-vCut-roto">
                          <SelectValue placeholder="Pilih v-cut" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Kanan">Kanan</SelectItem>
                          <SelectItem value="Kiri">Kiri</SelectItem>
                          <SelectItem value="Kanan-Kiri">Kanan-Kiri</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="col-span-2 grid grid-cols-[120px_1fr] items-center gap-1">
                      <Label htmlFor="modal-sudut-roto">Sudut</Label>
                      <Select
                        value={tempItem.sudut || ''}
                        onValueChange={(value) => updateTempItem('sudut', value)}
                      >
                        <SelectTrigger id="modal-sudut-roto">
                          <SelectValue placeholder="Pilih sudut" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Lancip">Lancip</SelectItem>
                          <SelectItem value="Lengkung">Lengkung</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="col-span-2 grid grid-cols-[120px_1fr] items-center gap-1">
                      <Label htmlFor="modal-posisiVCut-roto">Posisi V-Cut</Label>
                      <Select
                        value={tempItem.posisiVCut || ''}
                        onValueChange={(value) => updateTempItem('posisiVCut', value)}
                      >
                        <SelectTrigger id="modal-posisiVCut-roto">
                          <SelectValue placeholder="Pilih posisi v-cut" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Sesuai desain">Sesuai desain</SelectItem>
                          <SelectItem value="Sesuai standar">Sesuai standar</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="col-span-2 grid grid-cols-[120px_1fr] items-center gap-1">
                      <Label htmlFor="modal-sisiBuka-roto">Sisi Buka</Label>
                      <Select
                        value={tempItem.sisiBuka || ''}
                        onValueChange={(value) => updateTempItem('sisiBuka', value)}
                      >
                        <SelectTrigger id="modal-sisiBuka-roto">
                          <SelectValue placeholder="Pilih sisi buka" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Atas">Atas</SelectItem>
                          <SelectItem value="Bawah">Bawah</SelectItem>
                          <SelectItem value="Kanan">Kanan</SelectItem>
                          <SelectItem value="Kiri">Kiri</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="col-span-2 grid grid-cols-[120px_1fr] items-center gap-1">
                      <Label htmlFor="modal-hole-roto">Hole</Label>
                      <Select
                        value={tempItem.hole || ''}
                        onValueChange={(value) => updateTempItem('hole', value)}
                      >
                        <SelectTrigger id="modal-hole-roto">
                          <SelectValue placeholder="Pilih hole" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Euro hole">Euro hole</SelectItem>
                          <SelectItem value="Hang hole">Hang hole</SelectItem>
                          <SelectItem value="Pin hole">Pin hole</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="col-span-2 grid grid-cols-[120px_1fr] items-center gap-1">
                      <Label htmlFor="modal-aksesoris-roto">Aksesoris</Label>
                      <Input
                        id="modal-aksesoris-roto"
                        value={tempItem.aksesoris || ''}
                        onChange={(e) => updateTempItem('aksesoris', e.target.value)}
                        placeholder="Aksesoris"
                      />
                    </div>

                    <div className="col-span-2 grid grid-cols-[120px_1fr] items-center gap-1">
                      <Label htmlFor="modal-ukuran-roto">Ukuran</Label>
                      <Input
                        id="modal-ukuran-roto"
                        value={tempItem.ukuran || ''}
                        onChange={(e) => updateTempItem('ukuran', e.target.value)}
                        placeholder="Ukuran"
                      />
                    </div>
                  </div>
                </>
              )}

              {tempItem.jenisKemasan?.toLowerCase().includes('boks') && (
                <>
                  <div className="mb-2">
                    <h4 className="font-semibold text-sm mb-2">Spesifikasi Boks</h4>
                  </div>

                  <div className="grid grid-cols-4 gap-x-4 gap-y-1">
                    <div className="col-span-2 grid grid-cols-[120px_1fr] items-center gap-1">
                      <Label htmlFor="modal-jenisBentuk-boks">Jenis Bentuk</Label>
                      <div className="relative">
                        <Input
                          id="modal-jenisBentuk-boks"
                          value={tempItem.jenisBentuk || ''}
                          onChange={(e) => updateTempItem('jenisBentuk', e.target.value)}
                          onFocus={() => setShowJenisBentukSuggestions(true)}
                          placeholder="Ketik atau pilih jenis bentuk"
                          autoComplete="off"
                        />
                        {showJenisBentukSuggestions && (
                          <div className="jenis-bentuk-dropdown absolute z-50 w-full mt-1 bg-white border rounded-md shadow-lg max-h-60 overflow-auto">
                            {productTypes
                              .filter(type =>
                                type.name.toLowerCase().includes(tempItem.jenisBentuk?.toLowerCase() || '')
                              )
                              .map((type) => (
                                <div
                                  key={type.id}
                                  className="px-3 py-2 hover:bg-muted cursor-pointer border-b last:border-b-0"
                                  onClick={() => {
                                    updateTempItem('jenisBentuk', type.name);
                                    setShowJenisBentukSuggestions(false);
                                  }}
                                >
                                  <div className="font-medium">{type.name}</div>
                                </div>
                              ))}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="col-span-2 grid grid-cols-[120px_1fr] items-center gap-1">
                      <Label htmlFor="modal-toleransi-boks">Toleransi (%)</Label>
                      <Select
                        value={tempItem.toleransi || '10'}
                        onValueChange={(value) => updateTempItem('toleransi', value)}
                      >
                        <SelectTrigger id="modal-toleransi-boks">
                          <SelectValue placeholder="Pilih toleransi" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="5">5%</SelectItem>
                          <SelectItem value="10">10%</SelectItem>
                          <SelectItem value="20">20%</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="col-span-2 grid grid-cols-[120px_1fr] items-center gap-1">
                      <Label htmlFor="modal-statusDesign-boks">Status Design</Label>
                      <Select
                        value={tempItem.statusDesign || ''}
                        onValueChange={(value) => updateTempItem('statusDesign', value)}
                      >
                        <SelectTrigger id="modal-statusDesign-boks">
                          <SelectValue placeholder="Pilih status design" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Repeat Order">Repeat Order</SelectItem>
                          <SelectItem value="Baru">Baru</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="col-span-2 grid grid-cols-[120px_1fr] items-center gap-1">
                      <Label htmlFor="modal-tanggalStatusDesign-boks">Tanggal Status Design</Label>
                      <DatePicker
                        value={tempItem.tanggalStatusDesign || undefined}
                        onChange={(date) => updateTempItem('tanggalStatusDesign', date || null)}
                        placeholder="Pilih tanggal"
                        className="w-full"
                      />
                    </div>

                    <div className="col-span-2 grid grid-cols-[120px_1fr] items-center gap-1">
                      <Label htmlFor="modal-acuanKonten-boks">Acuan Konten</Label>
                      <Select
                        value={tempItem.acuanKonten || ''}
                        onValueChange={(value) => updateTempItem('acuanKonten', value)}
                      >
                        <SelectTrigger id="modal-acuanKonten-boks">
                          <SelectValue placeholder="Pilih acuan konten" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Repeat Order">Repeat Order</SelectItem>
                          <SelectItem value="Baru">Baru</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="col-span-2 grid grid-cols-[120px_1fr] items-center gap-1">
                      <Label htmlFor="modal-tanggalAcuanKonten-boks">Tanggal Acuan Konten</Label>
                      <DatePicker
                        value={tempItem.tanggalAcuanKonten || undefined}
                        onChange={(date) => updateTempItem('tanggalAcuanKonten', date || null)}
                        placeholder="Pilih tanggal"
                        className="w-full"
                      />
                    </div>

                    <div className="col-span-2 grid grid-cols-[120px_1fr] items-center gap-1">
                      <Label htmlFor="modal-acuanWarna-boks">Acuan Warna</Label>
                      <Select
                        value={tempItem.acuanWarna || ''}
                        onValueChange={(value) => updateTempItem('acuanWarna', value)}
                      >
                        <SelectTrigger id="modal-acuanWarna-boks">
                          <SelectValue placeholder="Pilih acuan warna" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Repeat Order">Repeat Order</SelectItem>
                          <SelectItem value="Baru">Baru</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="col-span-2 grid grid-cols-[120px_1fr] items-center gap-1">
                      <Label htmlFor="modal-tanggalAcuanWarna-boks">Tanggal Acuan Warna</Label>
                      <DatePicker
                        value={tempItem.tanggalAcuanWarna || undefined}
                        onChange={(date) => updateTempItem('tanggalAcuanWarna', date || null)}
                        placeholder="Pilih tanggal"
                        className="w-full"
                      />
                    </div>

                    <Separator className="col-span-4 my-2" />

                    <div className="col-span-4 grid grid-cols-[120px_1fr_1fr_1fr] items-center gap-1">
                      <Label>Ukuran (P x L x T)</Label>
                      <Input
                        id="modal-panjang-boks-spec"
                        value={tempItem.panjang || ''}
                        onChange={(e) => updateTempItem('panjang', e.target.value)}
                        placeholder="Panjang"
                      />
                      <Input
                        id="modal-lebar-boks-spec"
                        value={tempItem.lebar || ''}
                        onChange={(e) => updateTempItem('lebar', e.target.value)}
                        placeholder="Lebar"
                      />
                      <Input
                        id="modal-tinggi-boks-spec"
                        value={tempItem.tinggi || ''}
                        onChange={(e) => updateTempItem('tinggi', e.target.value)}
                        placeholder="Tinggi"
                      />
                    </div>

                    <div className="col-span-2 grid grid-cols-[120px_1fr] items-center gap-1">
                      <Label htmlFor="modal-pisau">Pisau</Label>
                      <Input
                        id="modal-pisau"
                        value={tempItem.pisau || ''}
                        onChange={(e) => updateTempItem('pisau', e.target.value)}
                        placeholder="Pisau/Die"
                      />
                    </div>

                    <div className="col-span-2 grid grid-cols-[120px_1fr] items-center gap-1">
                      <Label htmlFor="modal-lem">Lem</Label>
                      <Input
                        id="modal-lem"
                        value={tempItem.lem || ''}
                        onChange={(e) => updateTempItem('lem', e.target.value)}
                        placeholder="Lem"
                      />
                    </div>

                    {/* Row 1: Hotfoil | Emboss | Spot UV */}
                    <div className="col-span-4 grid grid-cols-3 gap-x-4 gap-y-1">
                      <div className="grid grid-cols-[120px_1fr] items-center gap-1">
                        <Label htmlFor="modal-hotfoil">Hotfoil</Label>
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="modal-hotfoil"
                            checked={tempItem.hotfoil === 'Ada'}
                            onCheckedChange={(checked) => updateTempItem('hotfoil', checked ? 'Ada' : 'Tidak Ada')}
                          />
                          <label
                            htmlFor="modal-hotfoil"
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                          >
                            Ada
                          </label>
                        </div>
                      </div>

                      <div className="grid grid-cols-[120px_1fr] items-center gap-1">
                        <Label htmlFor="modal-emboss">Emboss</Label>
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="modal-emboss"
                            checked={tempItem.emboss === 'Ada'}
                            onCheckedChange={(checked) => updateTempItem('emboss', checked ? 'Ada' : 'Tidak Ada')}
                          />
                          <label
                            htmlFor="modal-emboss"
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                          >
                            Ada
                          </label>
                        </div>
                      </div>

                      <div className="grid grid-cols-[120px_1fr] items-center gap-1">
                        <Label htmlFor="modal-spotUv">Spot UV</Label>
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="modal-spotUv"
                            checked={tempItem.spotUv === 'Ada'}
                            onCheckedChange={(checked) => updateTempItem('spotUv', checked ? 'Ada' : 'Tidak Ada')}
                          />
                          <label
                            htmlFor="modal-spotUv"
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                          >
                            Ada
                          </label>
                        </div>
                      </div>

                      {/* Row 2: Ukuran Hotfoil | Ukuran Emboss | Ukuran Spot UV */}
                      {tempItem.hotfoil === 'Ada' && (
                        <div className="grid grid-cols-[120px_1fr] items-center gap-1">
                          <Label htmlFor="modal-ukuranHotfoil">Ukuran Hotfoil</Label>
                          <Input
                            id="modal-ukuranHotfoil"
                            value={tempItem.ukuranHotfoil || ''}
                            onChange={(e) => updateTempItem('ukuranHotfoil', e.target.value)}
                            placeholder="Ukuran"
                          />
                        </div>
                      )}
                      {tempItem.hotfoil !== 'Ada' && <div></div>}

                      {tempItem.emboss === 'Ada' && (
                        <div className="grid grid-cols-[120px_1fr] items-center gap-1">
                          <Label htmlFor="modal-ukuranEmboss">Ukuran Emboss</Label>
                          <Input
                            id="modal-ukuranEmboss"
                            value={tempItem.ukuranEmboss || ''}
                            onChange={(e) => updateTempItem('ukuranEmboss', e.target.value)}
                            placeholder="Ukuran"
                          />
                        </div>
                      )}
                      {tempItem.emboss !== 'Ada' && <div></div>}

                      {tempItem.spotUv === 'Ada' && (
                        <div className="grid grid-cols-[120px_1fr] items-center gap-1">
                          <Label htmlFor="modal-ukuranSpotUv">Ukuran Spot UV</Label>
                          <Input
                            id="modal-ukuranSpotUv"
                            value={tempItem.ukuranSpotUv || ''}
                            onChange={(e) => updateTempItem('ukuranSpotUv', e.target.value)}
                            placeholder="Ukuran"
                          />
                        </div>
                      )}
                      {tempItem.spotUv !== 'Ada' && <div></div>}

                      {/* Row 3: Jml Titik Hotfoil | Jml Titik Emboss | Jml Titik Spot UV */}
                      {tempItem.hotfoil === 'Ada' && (
                        <div className="grid grid-cols-[120px_1fr] items-center gap-1">
                          <Label htmlFor="modal-jumlahTitikHotfoil">Jml Titik Hotfoil</Label>
                          <Input
                            id="modal-jumlahTitikHotfoil"
                            type="number"
                            value={tempItem.jumlahTitikHotfoil || ''}
                            onChange={(e) => updateTempItem('jumlahTitikHotfoil', e.target.value)}
                            placeholder="0"
                            min="0"
                          />
                        </div>
                      )}
                      {tempItem.hotfoil !== 'Ada' && <div></div>}

                      {tempItem.emboss === 'Ada' && (
                        <div className="grid grid-cols-[120px_1fr] items-center gap-1">
                          <Label htmlFor="modal-jumlahTitikEmboss">Jml Titik Emboss</Label>
                          <Input
                            id="modal-jumlahTitikEmboss"
                            type="number"
                            value={tempItem.jumlahTitikEmboss || ''}
                            onChange={(e) => updateTempItem('jumlahTitikEmboss', e.target.value)}
                            placeholder="0"
                            min="0"
                          />
                        </div>
                      )}
                      {tempItem.emboss !== 'Ada' && <div></div>}

                      {tempItem.spotUv === 'Ada' && (
                        <div className="grid grid-cols-[120px_1fr] items-center gap-1">
                          <Label htmlFor="modal-jumlahTitikSpotUv">Jml Titik Spot UV</Label>
                          <Input
                            id="modal-jumlahTitikSpotUv"
                            type="number"
                            value={tempItem.jumlahTitikSpotUv || ''}
                            onChange={(e) => updateTempItem('jumlahTitikSpotUv', e.target.value)}
                            placeholder="0"
                            min="0"
                          />
                        </div>
                      )}
                      {tempItem.spotUv !== 'Ada' && <div></div>}

                      {/* Row 4: Klise Hotfoil | Klise Emboss | Desain Spot UV */}
                      {tempItem.hotfoil === 'Ada' && (
                        <div className="grid grid-cols-[120px_1fr] items-center gap-1">
                          <Label htmlFor="modal-kliseHotfoil">Klise Hotfoil</Label>
                          <Input
                            id="modal-kliseHotfoil"
                            value={tempItem.kliseHotfoil || ''}
                            onChange={(e) => updateTempItem('kliseHotfoil', e.target.value)}
                            placeholder="Klise hotfoil"
                          />
                        </div>
                      )}
                      {tempItem.hotfoil !== 'Ada' && <div></div>}

                      {tempItem.emboss === 'Ada' && (
                        <div className="grid grid-cols-[120px_1fr] items-center gap-1">
                          <Label htmlFor="modal-kliseEmboss">Klise Emboss</Label>
                          <Input
                            id="modal-kliseEmboss"
                            value={tempItem.kliseEmboss || ''}
                            onChange={(e) => updateTempItem('kliseEmboss', e.target.value)}
                            placeholder="Klise emboss"
                          />
                        </div>
                      )}
                      {tempItem.emboss !== 'Ada' && <div></div>}

                      {tempItem.spotUv === 'Ada' && (
                        <div className="grid grid-cols-[120px_1fr] items-center gap-1">
                          <Label htmlFor="modal-desainSpotUv">Desain Spot UV</Label>
                          <Input
                            id="modal-desainSpotUv"
                            value={tempItem.desainSpotUv || ''}
                            onChange={(e) => updateTempItem('desainSpotUv', e.target.value)}
                            placeholder="Desain spot UV"
                          />
                        </div>
                      )}
                      {tempItem.spotUv !== 'Ada' && <div></div>}

                      {/* Row 5: Warna Hotfoil | (empty) | (empty) */}
                      {tempItem.hotfoil === 'Ada' && (
                        <div className="grid grid-cols-[120px_1fr] items-center gap-1">
                          <Label htmlFor="modal-warnaHotfoil">Warna Hotfoil</Label>
                          <Input
                            id="modal-warnaHotfoil"
                            value={tempItem.warnaHotfoil || ''}
                            onChange={(e) => updateTempItem('warnaHotfoil', e.target.value)}
                            placeholder="Warna hotfoil"
                          />
                        </div>
                      )}
                      {tempItem.hotfoil !== 'Ada' && <div></div>}

                      <div></div>
                      <div></div>
                    </div>

                    <div className="col-span-2 grid grid-cols-[120px_1fr] items-center gap-1">
                      <Label htmlFor="modal-aksesoris-boks">Aksesoris</Label>
                      <Input
                        id="modal-aksesoris-boks"
                        value={tempItem.aksesoris || ''}
                        onChange={(e) => updateTempItem('aksesoris', e.target.value)}
                        placeholder="Aksesoris"
                      />
                    </div>
                  </div>
                </>
              )}

              <div className="grid grid-cols-4 gap-x-4 gap-y-1 mt-2">
                <div className="col-span-4 grid grid-cols-[120px_1fr] items-start gap-1">
                  <Label htmlFor="modal-notes" className="pt-2">Catatan Spesifikasi</Label>
                  <Textarea
                    id="modal-notes"
                    value={tempItem.notes || ''}
                    onChange={(e) => updateTempItem('notes', e.target.value)}
                    placeholder="Catatan tambahan untuk spesifikasi item"
                    rows={3}
                  />
                </div>

                <div className="col-span-4 grid grid-cols-[120px_1fr] items-center gap-1">
                  <Label htmlFor="modal-description">Deskripsi</Label>
                  <Input
                    id="modal-description"
                    value={tempItem.description}
                    onChange={(e) => updateTempItem('description', e.target.value)}
                    placeholder="Deskripsi item"
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="bahan" className="mt-4">
              {tempItem.jenisKemasan?.toLowerCase().includes('flexibel') && (
                <>
                  <div className="mb-2">
                    <h4 className="font-semibold text-sm mb-2">Bahan Flexibel</h4>
                  </div>

                  <div className="space-y-1">
                    {/* Baris 1: Jml Mata | Input | Jml Potong | Input */}
                    <div className="grid grid-cols-[120px_1fr_120px_1fr] gap-1 items-center">
                      <Label htmlFor="modal-jmlMata-bahan">Jml Mata</Label>
                      <Input
                        id="modal-jmlMata-bahan"
                        type="number"
                        value={tempItem.jmlMata || ''}
                        onChange={(e) => updateTempItem('jmlMata', e.target.value)}
                        placeholder="Jumlah mata"
                        min="0"
                      />
                      <Label htmlFor="modal-jmlPotong-bahan">Jml Potong</Label>
                      <Input
                        id="modal-jmlPotong-bahan"
                        type="number"
                        value={tempItem.jmlPotong || ''}
                        onChange={(e) => updateTempItem('jmlPotong', e.target.value)}
                        placeholder="Jumlah potong"
                        min="0"
                      />
                    </div>

                    {/* Baris 2: Ukuran Kertas | Input | Ukuran Layout | Input Panjang & Input Lebar */}
                    <div className="grid grid-cols-[120px_1fr_120px_1fr] gap-1 items-center">
                      <Label htmlFor="modal-kertas-bahan">Ukuran Kertas</Label>
                      <Input
                        id="modal-kertas-bahan"
                        value={tempItem.kertas || ''}
                        onChange={(e) => updateTempItem('kertas', e.target.value)}
                        placeholder="Ukuran kertas"
                      />
                      <Label htmlFor="modal-ukuranLayoutPanjang-bahan">Ukuran Layout</Label>
                      <div className="flex gap-1">
                        <Input
                          id="modal-ukuranLayoutPanjang-bahan"
                          type="number"
                          value={tempItem.ukuranLayoutPanjang || ''}
                          onChange={(e) => updateTempItem('ukuranLayoutPanjang', e.target.value)}
                          placeholder="Panjang"
                          min="0"
                          step="0.01"
                        />
                        <Input
                          id="modal-ukuranLayoutLebar-bahan"
                          type="number"
                          value={tempItem.ukuranLayoutLebar || ''}
                          onChange={(e) => updateTempItem('ukuranLayoutLebar', e.target.value)}
                          placeholder="Lebar"
                          min="0"
                          step="0.01"
                        />
                      </div>
                    </div>

                    {/* Baris 3: Bahan | Input | Laminasi | Input */}
                    <div className="grid grid-cols-[120px_1fr_120px_1fr] gap-1 items-center">
                      <Label htmlFor="modal-bahan-flexibel">Bahan</Label>
                      <Select
                        value={tempItem.bahan || ''}
                        onValueChange={(value) => updateTempItem('bahan', value)}
                      >
                        <SelectTrigger id="modal-bahan-flexibel">
                          <SelectValue placeholder="Pilih bahan" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Papermetal">Papermetal</SelectItem>
                          <SelectItem value="Paperfoil">Paperfoil</SelectItem>
                          <SelectItem value="Papercpp">Papercpp</SelectItem>
                        </SelectContent>
                      </Select>
                      <Label htmlFor="modal-laminasi-flexibel">Laminasi</Label>
                      <Select
                        value={tempItem.laminasi || ''}
                        onValueChange={(value) => updateTempItem('laminasi', value)}
                      >
                        <SelectTrigger id="modal-laminasi-flexibel">
                          <SelectValue placeholder="Pilih laminasi" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Glossy">Glossy</SelectItem>
                          <SelectItem value="Doff">Doff</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Baris 4: Jenis Alas | Input | Ziplock | Input */}
                    <div className="grid grid-cols-[120px_1fr_120px_1fr] gap-1 items-center">
                      <Label htmlFor="modal-jenisAlas-bahan">Jenis Alas</Label>
                      <Select
                        value={tempItem.jenisAlas || ''}
                        onValueChange={(value) => updateTempItem('jenisAlas', value)}
                      >
                        <SelectTrigger id="modal-jenisAlas-bahan">
                          <SelectValue placeholder="Pilih jenis alas" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Polos">Polos</SelectItem>
                          <SelectItem value="Warna">Warna</SelectItem>
                          <SelectItem value="Putih">Putih</SelectItem>
                        </SelectContent>
                      </Select>
                      <Label htmlFor="modal-ziplock-bahan">Ziplock</Label>
                      <div className="relative">
                        <Input
                          id="modal-ziplock-bahan"
                          value={tempItem.ziplock || ''}
                          onChange={(e) => updateTempItem('ziplock', e.target.value)}
                          onFocus={() => setShowZiplockSuggestions(true)}
                          placeholder="Ketik atau pilih ziplock"
                          autoComplete="off"
                        />
                        {showZiplockSuggestions && (
                          <div className="ziplock-dropdown absolute z-50 w-full mt-1 bg-white border rounded-md shadow-lg">
                            {['Zipper', 'Non Zipper']
                              .filter(ziplock =>
                                ziplock.toLowerCase().includes(tempItem.ziplock?.toLowerCase() || '')
                              )
                              .map((ziplock) => (
                                <div
                                  key={ziplock}
                                  className="px-3 py-2 hover:bg-muted cursor-pointer border-b last:border-b-0"
                                  onClick={() => {
                                    updateTempItem('ziplock', ziplock);
                                    setShowZiplockSuggestions(false);
                                  }}
                                >
                                  <div className="font-medium">{ziplock}</div>
                                </div>
                              ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </>
              )}

              {tempItem.jenisKemasan?.toLowerCase().includes('roto') && (
                <>
                  <div className="mb-2">
                    <h4 className="font-semibold text-sm mb-2">Bahan Roto</h4>
                  </div>

                  <div className="space-y-1">
                    {/* Row 1: Up x Pitch | input UP | input Pitch | Uk. UP x Pitch | input ukuran UP | input ukuran pitch */}
                    <div className="grid grid-cols-[100px_1fr_1fr_100px_1fr_1fr] gap-1 items-center">
                      <Label>UP x Pitch</Label>
                      <Input
                        id="modal-jumlahUp-roto"
                        type="number"
                        value={tempItem.jumlahUp || ''}
                        onChange={(e) => updateTempItem('jumlahUp', e.target.value)}
                        placeholder="UP"
                        min="0"
                      />
                      <Input
                        id="modal-jumlahPitch-roto"
                        type="number"
                        value={tempItem.jumlahPitch || ''}
                        onChange={(e) => updateTempItem('jumlahPitch', e.target.value)}
                        placeholder="Pitch"
                        min="0"
                      />
                      <Label>Uk. UP x Pitch</Label>
                      <Input
                        id="modal-ukuranUp-roto"
                        value={tempItem.ukuranUp || ''}
                        onChange={(e) => updateTempItem('ukuranUp', e.target.value)}
                        placeholder="Ukuran UP"
                      />
                      <Input
                        id="modal-ukuranPitch-roto"
                        value={tempItem.ukuranPitch || ''}
                        onChange={(e) => updateTempItem('ukuranPitch', e.target.value)}
                        placeholder="Ukuran Pitch"
                      />
                    </div>

                    {/* Row 2: Posisi | input posisi | lebar image | input lebar image */}
                    <div className="grid grid-cols-[100px_1fr_100px_1fr] gap-1 items-center">
                      <Label htmlFor="modal-posisi-roto">Posisi</Label>
                      <Input
                        id="modal-posisi-roto"
                        value={tempItem.posisi || ''}
                        onChange={(e) => updateTempItem('posisi', e.target.value)}
                        placeholder="Posisi"
                      />
                      <Label htmlFor="modal-lebarImage-roto">Lebar Image</Label>
                      <Input
                        id="modal-lebarImage-roto"
                        value={tempItem.lebarImage || ''}
                        onChange={(e) => updateTempItem('lebarImage', e.target.value)}
                        placeholder="Lebar Image"
                      />
                    </div>

                    {/* Row 3: roll dry | input roll dry | lebar bahan | input lebar bahan */}
                    <div className="grid grid-cols-[100px_1fr_100px_1fr] gap-1 items-center">
                      <Label htmlFor="modal-rollDry-roto">Roll Dry</Label>
                      <Input
                        id="modal-rollDry-roto"
                        value={tempItem.rollDry || ''}
                        onChange={(e) => updateTempItem('rollDry', e.target.value)}
                        placeholder="Roll Dry"
                      />
                      <Label htmlFor="modal-lebarBahan-roto">Lebar Bahan</Label>
                      <Input
                        id="modal-lebarBahan-roto"
                        value={tempItem.lebarBahan || ''}
                        onChange={(e) => updateTempItem('lebarBahan', e.target.value)}
                        placeholder="Lebar Bahan"
                      />
                    </div>

                    {/* Row 4: Jenis alas | input jenis alas | ukuran alas | input ukuran alas */}
                    <div className="grid grid-cols-[100px_1fr_100px_1fr] gap-1 items-center">
                      <Label htmlFor="modal-jenisAlas-bahan-roto">Jenis Alas</Label>
                      <Select
                        value={tempItem.jenisAlas || ''}
                        onValueChange={(value) => updateTempItem('jenisAlas', value)}
                      >
                        <SelectTrigger id="modal-jenisAlas-bahan-roto">
                          <SelectValue placeholder="Pilih jenis alas" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Polos">Polos</SelectItem>
                          <SelectItem value="Warna">Warna</SelectItem>
                          <SelectItem value="Putih">Putih</SelectItem>
                        </SelectContent>
                      </Select>
                      <Label htmlFor="modal-ukuranAlas-roto">Ukuran Alas</Label>
                      <Input
                        id="modal-ukuranAlas-roto"
                        value={tempItem.ukuranAlas || ''}
                        onChange={(e) => updateTempItem('ukuranAlas', e.target.value)}
                        placeholder="Ukuran Alas"
                      />
                    </div>

                    {/* Row 5: ziplock | input ziplock | Adhesive | input adhesive */}
                    <div className="grid grid-cols-[100px_1fr_100px_1fr] gap-1 items-center">
                      <Label htmlFor="modal-ziplock-bahan-roto">Ziplock</Label>
                      <div className="relative">
                        <Input
                          id="modal-ziplock-bahan-roto"
                          value={tempItem.ziplock || ''}
                          onChange={(e) => updateTempItem('ziplock', e.target.value)}
                          onFocus={() => setShowZiplockSuggestions(true)}
                          placeholder="Ketik atau pilih ziplock"
                          autoComplete="off"
                        />
                        {showZiplockSuggestions && (
                          <div className="ziplock-dropdown absolute z-50 w-full mt-1 bg-white border rounded-md shadow-lg">
                            {['Zipper', 'Non Zipper']
                              .filter(ziplock =>
                                ziplock.toLowerCase().includes(tempItem.ziplock?.toLowerCase() || '')
                              )
                              .map((ziplock) => (
                                <div
                                  key={ziplock}
                                  className="px-3 py-2 hover:bg-muted cursor-pointer border-b last:border-b-0"
                                  onClick={() => {
                                    updateTempItem('ziplock', ziplock);
                                    setShowZiplockSuggestions(false);
                                  }}
                                >
                                  <div className="font-medium">{ziplock}</div>
                                </div>
                              ))}
                          </div>
                        )}
                      </div>
                      <Label htmlFor="modal-adhesive-roto">Adhesive</Label>
                      <Input
                        id="modal-adhesive-roto"
                        value={tempItem.adhesive || ''}
                        onChange={(e) => updateTempItem('adhesive', e.target.value)}
                        placeholder="Adhesive"
                      />
                    </div>

                    {/* Row 6: jumlah warna | input jumlah warna | cylinder | input cylinder */}
                    <div className="grid grid-cols-[100px_1fr_100px_1fr] gap-1 items-center">
                      <Label htmlFor="modal-jumlahWarna-roto">Jumlah Warna</Label>
                      <Input
                        id="modal-jumlahWarna-roto"
                        type="number"
                        value={tempItem.jumlahWarna || ''}
                        onChange={(e) => updateTempItem('jumlahWarna', e.target.value)}
                        placeholder="Jumlah Warna"
                        min="0"
                      />
                      <Label htmlFor="modal-cylinder-roto">Cylinder</Label>
                      <Input
                        id="modal-cylinder-roto"
                        value={tempItem.cylinder || ''}
                        onChange={(e) => updateTempItem('cylinder', e.target.value)}
                        placeholder="Cylinder"
                      />
                    </div>

                    {/* Row 7: jumlah layer | input jumlah layer */}
                    <div className="grid grid-cols-[100px_1fr] gap-1 items-center">
                      <Label htmlFor="modal-jumlahLayer-bahan">Jumlah Layer</Label>
                      <Select
                        value={tempItem.jumlahLayer || ''}
                        onValueChange={(value) => updateTempItem('jumlahLayer', value)}
                      >
                        <SelectTrigger id="modal-jumlahLayer-bahan">
                          <SelectValue placeholder="Pilih jumlah layer" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1">1</SelectItem>
                          <SelectItem value="2">2</SelectItem>
                          <SelectItem value="3">3</SelectItem>
                          <SelectItem value="4">4</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Row 8: layer 1 | input layer 1 | layer 2 | input layer 2 */}
                    {tempItem.jumlahLayer && parseInt(tempItem.jumlahLayer) >= 1 && (
                      <div className="grid grid-cols-[100px_1fr_100px_1fr] gap-1 items-center">
                        <Label htmlFor="modal-layer1-bahan">Layer 1</Label>
                        <Input
                          id="modal-layer1-bahan"
                          value={tempItem.layer1 || ''}
                          onChange={(e) => updateTempItem('layer1', e.target.value)}
                          placeholder="Layer 1"
                        />
                        {tempItem.jumlahLayer && parseInt(tempItem.jumlahLayer) >= 2 ? (
                          <>
                            <Label htmlFor="modal-layer2-bahan">Layer 2</Label>
                            <Input
                              id="modal-layer2-bahan"
                              value={tempItem.layer2 || ''}
                              onChange={(e) => updateTempItem('layer2', e.target.value)}
                              placeholder="Layer 2"
                            />
                          </>
                        ) : (
                          <>
                            <div></div>
                            <div></div>
                          </>
                        )}
                      </div>
                    )}

                    {/* Row 9: layer 3 | input layer 3 | layer 4 | input layer 4 */}
                    {tempItem.jumlahLayer && parseInt(tempItem.jumlahLayer) >= 3 && (
                      <div className="grid grid-cols-[100px_1fr_100px_1fr] gap-1 items-center">
                        <Label htmlFor="modal-layer3-bahan">Layer 3</Label>
                        <Input
                          id="modal-layer3-bahan"
                          value={tempItem.layer3 || ''}
                          onChange={(e) => updateTempItem('layer3', e.target.value)}
                          placeholder="Layer 3"
                        />
                        {tempItem.jumlahLayer && parseInt(tempItem.jumlahLayer) >= 4 ? (
                          <>
                            <Label htmlFor="modal-layer4-bahan">Layer 4</Label>
                            <Input
                              id="modal-layer4-bahan"
                              value={tempItem.layer4 || ''}
                              onChange={(e) => updateTempItem('layer4', e.target.value)}
                              placeholder="Layer 4"
                            />
                          </>
                        ) : (
                          <>
                            <div></div>
                            <div></div>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                </>
              )}
            </TabsContent>
          </Tabs>

          <DialogFooter>
            <div className="flex justify-between w-full">
              <Button type="button" variant="outline" onClick={() => setShowItemModal(false)}>
                Batal
              </Button>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={copyFromNameItem}
                  disabled={!tempItem.customItemId}
                >
                  Ambil dari Nama Item
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={copyFromFormula}
                  disabled={!tempItem.formulaHarga}
                >
                  Ambil dari Formula
                </Button>
                <Button type="button" onClick={saveItem}>
                  {editingItemIndex !== null ? 'Update Item' : 'Tambah Item'}
                </Button>
              </div>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}