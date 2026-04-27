import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { Plus, X, UserCheck } from 'lucide-react';
import { useSimpleAuth } from '../../contexts/simple-auth-context';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { PageHeader } from '../../components/page-header';
import { DataTable } from '../../components/data-table';
import { Badge } from '../../components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../../components/ui/dialog';
import { Textarea } from '../../components/ui/textarea';
import { DatePicker } from '../../components/ui/date-picker';
import { toast } from 'sonner';
import { api } from '../../lib/api';
import { formatDate } from '../../components/ui/utils';

interface Pipeline {
  id: string;
  tanggal: string;
  customer: string;
  customerId?: string; // ID customer yang sudah dilengkapi
  orderType: string; // New / Repeat Order
  stage: string;
  aktivitasSales: string;
  alamat: string;
  city?: string; // Kota customer
  nomorTelepon?: string; // Nomor telepon customer
  segmen: string;
  perkiraanJumlah: number;
  picSales: string; // PIC Sales
  sumberLead: string; // Sumber Lead
  hasil: string;
  catatan: string;
  createdAt: string;
}

interface Segment {
  id: string;
  name: string;
  description?: string;
  criteria?: string;
}

interface LeadSource {
  id: string;
  name: string;
}

const STAGE_COLORS: Record<string, string> = {
  'Lead': 'bg-gray-500',
  'Qualifikasi': 'bg-blue-500',
  'Presentasi': 'bg-indigo-500',
  'Proposal': 'bg-purple-500',
  'Negosiasi': 'bg-orange-500',
  'Closing': 'bg-green-500',
  'Lost': 'bg-red-500',
};

const STAGES = ['Lead', 'Qualifikasi', 'Presentasi', 'Proposal', 'Negosiasi', 'Closing', 'Lost'];

// Helper function untuk ekstrak kota dari alamat
const extractCity = (address: string): string => {
  if (!address) return '-';
  // Ambil bagian terakhir setelah koma terakhir
  const parts = address.split(',');
  return parts[parts.length - 1].trim() || '-';
};

interface PipelineFollowUp {
  id: string;
  pipelineId: string;
  tanggal: string;
  aktivitas: string;
  hasil: string;
  picSales?: string;
  quotationNumbers?: string[]; // Array of quotation numbers created from this follow-up
  createdAt: string;
}

export function Pipeline() {
  const navigate = useNavigate();
  const { user } = useSimpleAuth();
  const [pipelines, setPipelines] = useState<Pipeline[]>([]);
  const [followUps, setFollowUps] = useState<PipelineFollowUp[]>([]);
  const [segments, setSegments] = useState<Segment[]>([]);
  const [leadSources, setLeadSources] = useState<LeadSource[]>([]);
  const [salesPeople, setSalesPeople] = useState<string[]>([]);
  const [salesEmployees, setSalesEmployees] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [stageFilter, setStageFilter] = useState<string>('all');
  const [salesFilter, setSalesFilter] = useState<string>('all');
  const [sumberLeadFilter, setSumberLeadFilter] = useState<string>('all');
  const [followUpDateFrom, setFollowUpDateFrom] = useState<string>('');
  const [followUpDateTo, setFollowUpDateTo] = useState<string>('');
  
  // Modal follow-up states
  const [showFollowUpModal, setShowFollowUpModal] = useState(false);
  const [selectedPipeline, setSelectedPipeline] = useState<Pipeline | null>(null);
  const [salesActivities, setSalesActivities] = useState<any[]>([]);
  const [productTypes, setProductTypes] = useState<any[]>([]);
  const [followUpForm, setFollowUpForm] = useState({
    tanggal: new Date().toISOString().split('T')[0],
    aktivitas: '',
    stage: '',
    alamat: '',
    hasil: '',
    catatan: '',
    nextFollowUp: '',
    perkiraanJumlah: '',
    segmen: '',
    estimasiHarga: '',
    sumberLead: '',
    picSales: '',
    pic: '',
  });
  const [selectedProductTypes, setSelectedProductTypes] = useState<string[]>([]);
  const [quotationNumbers, setQuotationNumbers] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  // Helper functions untuk followup data
  const getFollowUpCount = (pipelineId: string) => {
    return followUps.filter(f => f.pipelineId === pipelineId).length;
  };

  const getLastFollowUpDate = (pipelineId: string) => {
    const pipelineFollowUps = followUps.filter(f => f.pipelineId === pipelineId);
    if (pipelineFollowUps.length === 0) return null;

    const sorted = pipelineFollowUps.sort((a, b) => {
      // Sort by tanggal descending (newest first)
      const dateCompare = new Date(b.tanggal).getTime() - new Date(a.tanggal).getTime();
      if (dateCompare !== 0) return dateCompare;
      // If same date, sort by createdAt (newest first)
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
    return sorted[0].tanggal;
  };

  // Helper untuk mendapatkan timestamp terbaru (tanggal follow-up atau createdAt pipeline)
  const getLatestTimestamp = (pipeline: Pipeline) => {
    const pipelineFollowUps = followUps.filter(f => f.pipelineId === pipeline.id);
    if (pipelineFollowUps.length > 0) {
      // Jika ada follow-up, cari yang paling baru berdasarkan tanggal + createdAt
      const sorted = pipelineFollowUps.sort((a, b) => {
        const dateCompare = new Date(b.tanggal).getTime() - new Date(a.tanggal).getTime();
        if (dateCompare !== 0) return dateCompare;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
      // Gunakan kombinasi tanggal + createdAt untuk sorting yang akurat
      const latestFollowUp = sorted[0];
      // Combine tanggal with milliseconds from createdAt for sub-second precision
      const tanggalTime = new Date(latestFollowUp.tanggal).getTime();
      const createdTime = new Date(latestFollowUp.createdAt).getTime();
      // Return tanggal timestamp plus microseconds from createdAt to ensure proper ordering
      // of followups with same tanggal
      return tanggalTime + (createdTime % 1000);
    }
    // Jika tidak ada follow-up, gunakan timestamp 0 (paling lama) agar muncul di bawah
    return 0;
  };

  const getLastFollowUpResult = (pipelineId: string) => {
    const pipelineFollowUps = followUps.filter(f => f.pipelineId === pipelineId);
    if (pipelineFollowUps.length === 0) return null;

    const sorted = pipelineFollowUps.sort((a, b) => {
      // Sort by tanggal descending (newest first)
      const dateCompare = new Date(b.tanggal).getTime() - new Date(a.tanggal).getTime();
      if (dateCompare !== 0) return dateCompare;
      // If same date, sort by createdAt (newest first)
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
    return sorted[0].hasil;
  };

  const getLastFollowUpPicSales = (pipelineId: string) => {
    const pipelineFollowUps = followUps.filter(f => f.pipelineId === pipelineId);
    if (pipelineFollowUps.length === 0) return null;

    const sorted = pipelineFollowUps.sort((a, b) => {
      // Sort by tanggal descending (newest first)
      const dateCompare = new Date(b.tanggal).getTime() - new Date(a.tanggal).getTime();
      if (dateCompare !== 0) return dateCompare;
      // If same date, sort by createdAt (newest first)
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
    return sorted[0].picSales;
  };

  const columns = [
    {
      key: 'customer',
      label: 'Customer',
      width: 'w-48',
      render: (_: any, row: Pipeline) => (
        <div className="min-w-0">
          <div className="text-xs font-medium truncate" title={row.customer}>
            {row.customer}
          </div>
          <div className="text-xs text-muted-foreground truncate" title={row.picSales || '-'}>
            {row.picSales || '-'}
          </div>
        </div>
      ),
    },
    {
      key: 'stage',
      label: 'Stage',
      width: 'w-28',
      render: (value: string) => (
        <Badge className={`${STAGE_COLORS[value]} text-white text-xs whitespace-nowrap`}>
          {value}
        </Badge>
      ),
    },
    {
      key: 'sumberLead',
      label: 'Sumber Lead',
      width: 'w-36',
      render: (value: string) => (
        <div className="min-w-0">
          {value ? (
            <Badge variant="outline" className="bg-purple-100 text-purple-700 border-purple-300 text-xs max-w-full truncate" title={value}>
              {value}
            </Badge>
          ) : (
            <span className="text-xs text-muted-foreground">-</span>
          )}
        </div>
      )
    },
    {
      key: 'followUpCount',
      label: 'Jml F/U',
      width: 'w-20',
      render: (_: any, row: Pipeline) => {
        const count = getFollowUpCount(row.id);
        const isClosing = row.stage === 'Closing';
        return (
          <div className="text-center">
            <button
              onClick={() => handleOpenFollowUpModal(row)}
              disabled={isClosing}
              className={`transition-transform ${isClosing ? 'cursor-not-allowed opacity-50' : 'hover:scale-110 cursor-pointer'}`}
              title={isClosing ? 'Pipeline sudah closing, tidak dapat menambah follow-up' : 'Klik untuk menambah follow-up'}
            >
              <Badge
                variant="default"
                className={`text-white text-xs ${isClosing ? 'bg-gray-400' : 'bg-blue-600 hover:bg-blue-700'}`}
              >
                {count}
              </Badge>
            </button>
          </div>
        );
      }
    },
    {
      key: 'lastFollowUpDate',
      label: 'Terakhir F/U',
      width: 'w-28',
      render: (_: any, row: Pipeline) => {
        const lastDate = getLastFollowUpDate(row.id);
        return (
          <div className="text-xs font-medium whitespace-nowrap">
            {lastDate ? formatDate(lastDate) : <span className="text-muted-foreground">-</span>}
          </div>
        );
      }
    },
    {
      key: 'picSalesFollowUp',
      label: 'PIC Sales',
      width: 'w-32',
      render: (_: any, row: Pipeline) => {
        const lastPicSales = getLastFollowUpPicSales(row.id);
        const displayPicSales = lastPicSales || row.picSales;
        return (
          <div className="text-xs truncate min-w-0" title={displayPicSales || '-'}>
            {displayPicSales || <span className="text-muted-foreground">-</span>}
          </div>
        );
      }
    },
    {
      key: 'hasil',
      label: 'Hasil',
      width: 'w-64',
      render: (_: any, row: Pipeline) => {
        const lastResult = getLastFollowUpResult(row.id);
        const displayResult = lastResult || row.hasil;
        return (
          <div className="text-xs truncate min-w-0" title={displayResult || '-'}>
            {displayResult || <span className="text-muted-foreground">-</span>}
          </div>
        );
      }
    },
  ];

  useEffect(() => {
    fetchPipelines();
    fetchFollowUps();
    fetchSegments();
    fetchLeadSources();
    fetchSalesActivities();
    fetchProductTypes();
    fetchSalesEmployees();
  }, []);

  // Extract unique sales people from pipelines
  useEffect(() => {
    if (pipelines.length > 0) {
      const uniqueSales = Array.from(new Set(pipelines.map(p => p.picSales).filter(Boolean)));
      setSalesPeople(uniqueSales.sort());
    }
  }, [pipelines]);

  // Check for returning from quotation form - run after data is loaded
  useEffect(() => {
    if (loading) {
      console.log('⏳ Still loading, skipping localStorage check (Pipeline List)');
      return;
    }

    console.log('🔍 Checking localStorage for return from quotation (Pipeline List)...');
    const newQuotation = localStorage.getItem('newQuotationNumber');
    const pendingFollowUpState = localStorage.getItem('pendingFollowUpState');

    console.log('📦 LocalStorage values:', { newQuotation, pendingFollowUpState });

    if (newQuotation && pendingFollowUpState) {
      try {
        const state = JSON.parse(pendingFollowUpState);
        console.log('📋 Parsed state:', state);

        // Find the pipeline
        const pipeline = pipelines.find(p => p.id === state.pipelineId);
        if (!pipeline) {
          console.warn('⚠️ Pipeline not found, clearing localStorage');
          localStorage.removeItem('newQuotationNumber');
          localStorage.removeItem('pendingFollowUpState');
          return;
        }

        // Restore follow-up state
        console.log('♻️ Restoring follow-up state...');
        setSelectedPipeline(pipeline);
        setFollowUpForm(state.followUpForm);
        setSelectedProductTypes(state.selectedProductTypes || []);

        // Add new quotation number to the list
        const updatedQuotations = [...(state.quotationNumbers || []), newQuotation];
        console.log('📝 Updated quotation numbers:', updatedQuotations);
        setQuotationNumbers(updatedQuotations);

        // Show follow-up modal again
        console.log('✅ Opening follow-up modal...');
        setShowFollowUpModal(true);

        // Clear localStorage
        localStorage.removeItem('newQuotationNumber');
        localStorage.removeItem('pendingFollowUpState');
        console.log('🧹 Cleared localStorage');

        toast.success(`Penawaran ${newQuotation} berhasil dibuat dan ditambahkan ke follow-up`);
      } catch (error) {
        console.error('❌ Error restoring follow-up state:', error);
        // Clear corrupted data
        localStorage.removeItem('newQuotationNumber');
        localStorage.removeItem('pendingFollowUpState');
      }
    } else {
      console.log('ℹ️ No pending follow-up state found');
    }
  }, [loading, pipelines]);

  const fetchPipelines = async () => {
    try {
      setLoading(true);
      const result = await api.getPipelines();
      setPipelines(result || []);
    } catch (error) {
      console.error('Error fetching pipelines:', error);
      toast.error('Gagal memuat data pipeline');
    } finally {
      setLoading(false);
    }
  };

  const fetchFollowUps = async () => {
    try {
      const result = await api.getPipelineFollowUps();
      setFollowUps(result || []);
    } catch (error) {
      console.error('Error fetching follow-ups:', error);
    }
  };

  const fetchSegments = async () => {
    try {
      const result = await api.getSegments();
      setSegments(result || []);
    } catch (error) {
      console.error('Error fetching segments:', error);
    }
  };

  const fetchLeadSources = async () => {
    try {
      const result = await api.getLeadSources();
      setLeadSources(result || []);
    } catch (error) {
      console.error('Error fetching lead sources:', error);
    }
  };

  const fetchSalesActivities = async () => {
    try {
      const result = await api.getSalesActivities();
      setSalesActivities(result || []);
    } catch (error) {
      console.error('Error fetching sales activities:', error);
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

  const fetchDepartments = async () => {
    try {
      const result = await api.getDepartments();
      setDepartments(result || []);
      return result || [];
    } catch (error) {
      console.error("Error fetching departments:", error);
      setDepartments([]);
      return [];
    }
  };

  const fetchSalesEmployees = async () => {
    try {
      // Fetch departments first
      const depts = await fetchDepartments();

      // Find the Sales department - lebih fleksibel
      const salesDept = depts.find((d: any) =>
        d.name?.toLowerCase().includes('sales') ||
        d.code?.toLowerCase().includes('sales')
      );

      if (!salesDept) {
        console.warn('Sales department not found, showing all employees');
        const allEmployees = await api.getEmployees() || [];
        setSalesEmployees(allEmployees);
        return;
      }

      // Get all department codes that are Sales or children of Sales (recursively)
      const getSalesDepartmentCodes = (deptCode: string, allDepts: any[]): string[] => {
        const codes = [deptCode];
        const children = allDepts.filter((d: any) => d.parent_code === deptCode);
        children.forEach((child: any) => {
          codes.push(...getSalesDepartmentCodes(child.code, allDepts));
        });
        return codes;
      };

      const salesDeptCodes = getSalesDepartmentCodes(salesDept.code, depts);

      // Fetch all employees
      const allEmployees = await api.getEmployees() || [];

      // Filter employees by sales department codes
      const salesOnly = allEmployees.filter((emp: any) => {
        const hasValidDept = emp.department_code && salesDeptCodes.includes(emp.department_code);
        return hasValidDept;
      });

      setSalesEmployees(salesOnly);
    } catch (error) {
      console.error("Error fetching sales employees:", error);
      setSalesEmployees([]);
    }
  };

  const handleOpenFollowUpModal = (pipeline: Pipeline) => {
    // Validasi: Jika stage sudah Closing, tidak boleh tambah follow-up
    if (pipeline.stage === 'Closing') {
      toast.error('Tidak dapat menambah follow-up', {
        description: 'Pipeline dengan stage "Closing" tidak dapat ditambahkan follow-up baru.'
      });
      return;
    }

    const picSalesValue = user?.name || pipeline.picSales || '';
    const picValue = user?.name || '';
    console.log('=== Opening Follow-Up Modal ===');
    console.log('User object:', user);
    console.log('User name:', user?.name);
    console.log('Pipeline PIC Sales:', pipeline.picSales);
    console.log('Selected PIC Sales value:', picSalesValue);
    console.log('Selected PIC value:', picValue);
    console.log('Sales employees available:', salesEmployees.length);
    console.log('Sales employees names:', salesEmployees.map((e: any) => e.name));

    setSelectedPipeline(pipeline);
    setFollowUpForm({
      tanggal: new Date().toISOString().split('T')[0],
      aktivitas: '',
      stage: pipeline.stage || 'Lead',
      alamat: pipeline.alamat || '',
      hasil: '',
      catatan: '',
      nextFollowUp: '',
      perkiraanJumlah: pipeline.perkiraanJumlah?.toString() || '',
      segmen: pipeline.segmen || '',
      estimasiHarga: '',
      sumberLead: pipeline.sumberLead || '',
      picSales: picSalesValue,
      pic: picValue,
    });
    setSelectedProductTypes(pipeline.productTypes || []);
    setQuotationNumbers([]);
    setShowFollowUpModal(true);
  };

  const handleCloseFollowUpModal = () => {
    setShowFollowUpModal(false);
    setSelectedPipeline(null);
    setFollowUpForm({
      tanggal: new Date().toISOString().split('T')[0],
      aktivitas: '',
      stage: '',
      alamat: '',
      hasil: '',
      catatan: '',
      nextFollowUp: '',
      perkiraanJumlah: '',
      segmen: '',
      estimasiHarga: '',
      sumberLead: '',
      picSales: '',
      pic: '',
    });
    setSelectedProductTypes([]);
    setQuotationNumbers([]);
  };

  const handleSubmitFollowUp = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedPipeline) return;

    if (!followUpForm.tanggal || !followUpForm.aktivitas || !followUpForm.hasil) {
      toast.error('Tanggal, Aktivitas, dan Hasil harus diisi');
      return;
    }

    setSubmitting(true);
    try {
      const followUpData = {
        pipelineId: selectedPipeline.id,
        tanggal: followUpForm.tanggal,
        aktivitas: followUpForm.aktivitas,
        stage: followUpForm.stage,
        alamat: followUpForm.alamat,
        hasil: followUpForm.hasil,
        catatan: followUpForm.catatan,
        nextFollowUp: followUpForm.nextFollowUp,
        perkiraanJumlah: followUpForm.perkiraanJumlah,
        segmen: followUpForm.segmen,
        estimasiHarga: followUpForm.estimasiHarga,
        sumberLead: followUpForm.sumberLead,
        picSales: followUpForm.picSales,
        pic: followUpForm.pic,
        productTypes: selectedProductTypes,
        quotationNumbers: quotationNumbers,
      };

      await api.createPipelineFollowUp(followUpData);

      // Update pipeline dengan data terbaru dari follow-up
      // PENTING: Preserve semua data pipeline yang ada, hanya update field yang berubah
      const updateData: any = {
        ...selectedPipeline, // Preserve semua data existing
        stage: followUpForm.stage,
        hasil: followUpForm.hasil,
        alamat: followUpForm.alamat,
        perkiraanJumlah: followUpForm.perkiraanJumlah ? parseFloat(followUpForm.perkiraanJumlah) : selectedPipeline.perkiraanJumlah,
        segmen: followUpForm.segmen,
        sumberLead: followUpForm.sumberLead,
        picSales: followUpForm.picSales,
        productTypes: selectedProductTypes,
      };

      if (followUpForm.estimasiHarga) {
        updateData.estimasiHarga = followUpForm.estimasiHarga;
      }

      await api.updatePipeline(selectedPipeline.id, updateData);
      
      toast.success('Follow-up berhasil ditambahkan');
      handleCloseFollowUpModal();
      fetchFollowUps();
      fetchPipelines();
    } catch (error) {
      console.error('Error submitting follow-up:', error);
      toast.error('Gagal menambahkan follow-up');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (item: Pipeline) => {
    if (!confirm('Apakah Anda yakin ingin menghapus pipeline ini?')) return;

    try {
      await api.deletePipeline(item.id);
      toast.success('Pipeline berhasil dihapus');
      fetchPipelines();
    } catch (error) {
      console.error('Error deleting pipeline:', error);
      toast.error('Gagal menghapus pipeline');
    }
  };

  const handleDetail = (item: Pipeline) => {
    navigate(`/sales/pipeline/detail/${item.id}`);
  };

  const handleEdit = (item: Pipeline) => {
    navigate(`/sales/pipeline/${item.id}`);
  };

  const handleCompleteCustomer = (item: Pipeline) => {
    navigate(`/sales/customers/add?from=pipeline&id=${item.id}`);
  };

  // Filter dan sort data
  const filteredPipelines = pipelines.filter((pipeline) => {
    const matchesSearch =
      (pipeline.customer || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (pipeline.alamat || '').toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStage = stageFilter === 'all' || pipeline.stage === stageFilter;
    const matchesSales = salesFilter === 'all' || pipeline.picSales === salesFilter;
    const matchesSumberLead = sumberLeadFilter === 'all' || pipeline.sumberLead === sumberLeadFilter;

    // Filter tanggal terakhir follow-up
    let matchesFollowUpDate = true;
    if (followUpDateFrom || followUpDateTo) {
      const lastFollowUpDate = getLastFollowUpDate(pipeline.id);
      if (!lastFollowUpDate) {
        matchesFollowUpDate = false; // Tidak ada follow-up, tidak cocok dengan filter tanggal
      } else {
        const lastDate = new Date(lastFollowUpDate);
        if (followUpDateFrom) {
          const fromDate = new Date(followUpDateFrom);
          if (lastDate < fromDate) matchesFollowUpDate = false;
        }
        if (followUpDateTo) {
          const toDate = new Date(followUpDateTo);
          if (lastDate > toDate) matchesFollowUpDate = false;
        }
      }
    }

    return matchesSearch && matchesStage && matchesSales && matchesSumberLead && matchesFollowUpDate;
  }).sort((a, b) => {
    // Urutkan berdasarkan tanggal terakhir follow-up (terbaru di atas)
    const followUpsA = followUps.filter(f => f.pipelineId === a.id);
    const followUpsB = followUps.filter(f => f.pipelineId === b.id);

    // Get latest followup for each pipeline
    let latestA = null;
    let latestB = null;

    if (followUpsA.length > 0) {
      const sortedA = [...followUpsA].sort((x, y) => {
        // Parse tanggal - descending (terbaru di atas)
        const dateX = new Date(x.tanggal);
        const dateY = new Date(y.tanggal);
        const dateCompare = dateY.getTime() - dateX.getTime(); // Y > X = Y di atas
        if (dateCompare !== 0 && !isNaN(dateCompare)) return dateCompare;
        // Fallback to createdAt - descending
        const createdX = new Date(x.createdAt);
        const createdY = new Date(y.createdAt);
        return createdY.getTime() - createdX.getTime(); // Y > X = Y di atas
      });
      latestA = sortedA[0];
    }

    if (followUpsB.length > 0) {
      const sortedB = [...followUpsB].sort((x, y) => {
        // Parse tanggal - descending (terbaru di atas)
        const dateX = new Date(x.tanggal);
        const dateY = new Date(y.tanggal);
        const dateCompare = dateY.getTime() - dateX.getTime(); // Y > X = Y di atas
        if (dateCompare !== 0 && !isNaN(dateCompare)) return dateCompare;
        // Fallback to createdAt - descending
        const createdX = new Date(x.createdAt);
        const createdY = new Date(y.createdAt);
        return createdY.getTime() - createdX.getTime(); // Y > X = Y di atas
      });
      latestB = sortedB[0];
    }

    // Compare: pipelines without followups go to bottom
    if (!latestA && !latestB) return 0;
    if (!latestA) return 1; // A goes to bottom
    if (!latestB) return -1; // B goes to bottom

    // Compare tanggal first - parse dates properly
    const dateA = new Date(latestA.tanggal);
    const dateB = new Date(latestB.tanggal);

    // Check if dates are valid
    if (!isNaN(dateB.getTime()) && !isNaN(dateA.getTime())) {
      // Sort descending: tanggal terbaru di atas (dateB - dateA)
      // Jika dateB > dateA (B lebih baru), return positif agar B di atas
      const dateCompare = dateB.getTime() - dateA.getTime();
      if (dateCompare !== 0) return dateCompare;
    }

    // If same tanggal or invalid dates, compare by createdAt (terbaru di atas)
    const createdA = new Date(latestA.createdAt);
    const createdB = new Date(latestB.createdAt);
    return createdB.getTime() - createdA.getTime(); // B > A = B di atas
  });

  return (
    <div className="space-y-4">
      <PageHeader
        title="Pipeline Sales"
        actions={
          <Button onClick={() => navigate('/sales/pipeline/new')}>
            <Plus className="w-4 h-4 mr-2" />
            Tambah Pipeline
          </Button>
        }
      />

      {/* Filters */}
      <div className="flex gap-2 items-center">
        <Input
          placeholder="Cari customer atau alamat..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-64"
        />
        <Select value={stageFilter} onValueChange={setStageFilter}>
          <SelectTrigger className="w-36">
            <SelectValue placeholder="Stage" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Stage</SelectItem>
            {STAGES.map((stage) => (
              <SelectItem key={stage} value={stage}>
                {stage}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={salesFilter} onValueChange={setSalesFilter}>
          <SelectTrigger className="w-36">
            <SelectValue placeholder="PIC Sales" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Sales</SelectItem>
            {salesPeople.map((sales) => (
              <SelectItem key={sales} value={sales}>
                {sales}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={sumberLeadFilter} onValueChange={setSumberLeadFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Sumber Lead" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Sumber</SelectItem>
            {leadSources.map((source) => (
              <SelectItem key={source.id} value={source.name}>
                {source.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <DatePicker
          value={followUpDateFrom}
          onChange={(date) => setFollowUpDateFrom(date || '')}
          placeholder="F/U Dari"
          className="w-36"
        />
        <DatePicker
          value={followUpDateTo}
          onChange={(date) => setFollowUpDateTo(date || '')}
          placeholder="F/U Sampai"
          className="w-36"
        />
        {(followUpDateFrom || followUpDateTo) && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setFollowUpDateFrom('');
              setFollowUpDateTo('');
            }}
            className="h-10 px-2"
          >
            <X className="w-4 h-4" />
          </Button>
        )}
      </div>

      {/* Data Table */}
      <DataTable
        columns={columns}
        data={filteredPipelines}
        loading={loading}
        onView={handleDetail}
        onEdit={handleEdit}
        onDelete={handleDelete}
        getStatusColor={(row) => STAGE_COLORS[row.stage] || 'bg-gray-500'}
        customActions={[
          {
            icon: <UserCheck className="w-4 h-4" />,
            onClick: handleCompleteCustomer,
            label: 'Lengkapi Customer',
            variant: 'default',
            className: 'bg-green-600 hover:bg-green-700 text-white',
            shouldShow: (row) => !row.customerId, // Hanya tampil jika belum ada customerId
          },
        ]}
      />

      {/* Modal Follow-Up */}
      <Dialog open={showFollowUpModal} onOpenChange={handleCloseFollowUpModal}>
        <DialogContent className="w-[95vw] md:w-[85vw] lg:w-[70vw] !max-w-none max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-base">Tambah Follow-Up Sales</DialogTitle>
            {selectedPipeline && (
              <div className="text-sm text-muted-foreground mt-1">
                Customer: <span className="font-medium text-foreground">{selectedPipeline.customer}</span>
              </div>
            )}
          </DialogHeader>

          <form onSubmit={handleSubmitFollowUp}>
            <div className="space-y-3">
              {/* Hidden fields for PIC Sales and PIC - auto-filled with logged-in user */}
              <input type="hidden" value={followUpForm.picSales} />
              <input type="hidden" value={followUpForm.pic} />

              {/* Row 1: Stage Pipeline | Tanggal */}
              <div className="grid grid-cols-12 gap-1 items-center">
                <div className="col-span-2 text-sm font-medium text-muted-foreground">Stage Pipeline</div>
                <div className="col-span-4">
                  <Select
                    value={followUpForm.stage}
                    onValueChange={(value) => setFollowUpForm({ ...followUpForm, stage: value })}
                  >
                    <SelectTrigger id="stage" className="w-full">
                      <SelectValue placeholder="Pilih stage" />
                    </SelectTrigger>
                    <SelectContent>
                      {STAGES.map((stage) => (
                        <SelectItem key={stage} value={stage}>
                          {stage}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="col-span-2 text-sm font-medium text-muted-foreground">
                  Tanggal <span className="text-red-500">*</span>
                </div>
                <div className="col-span-4">
                  <DatePicker
                    value={followUpForm.tanggal}
                    onChange={(date) => setFollowUpForm({ ...followUpForm, tanggal: date || new Date().toISOString().split('T')[0] })}
                    placeholder="Pilih tanggal"
                    className="w-full"
                  />
                </div>
              </div>

              {/* Row 2: Aktivitas Sales | Sumber Lead */}
              <div className="grid grid-cols-12 gap-1 items-center">
                <div className="col-span-2 text-sm font-medium text-muted-foreground">
                  Aktivitas Sales <span className="text-red-500">*</span>
                </div>
                <div className="col-span-4">
                  <Select
                    value={followUpForm.aktivitas}
                    onValueChange={(value) => setFollowUpForm({ ...followUpForm, aktivitas: value })}
                  >
                    <SelectTrigger id="aktivitas" className="w-full">
                      <SelectValue placeholder="Pilih aktivitas" />
                    </SelectTrigger>
                    <SelectContent>
                      {salesActivities.map((activity) => (
                        <SelectItem key={activity.id} value={activity.name}>
                          {activity.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="col-span-2 text-sm font-medium text-muted-foreground">Sumber Lead</div>
                <div className="col-span-4">
                  <Select
                    value={followUpForm.sumberLead}
                    onValueChange={(value) => setFollowUpForm({ ...followUpForm, sumberLead: value })}
                  >
                    <SelectTrigger id="sumberLead" className="w-full">
                      <SelectValue placeholder="Pilih sumber lead" />
                    </SelectTrigger>
                    <SelectContent>
                      {leadSources.map((source) => (
                        <SelectItem key={source.id} value={source.name}>
                          {source.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Row 3: Alamat Customer (full width) */}
              <div className="grid grid-cols-12 gap-1 items-center">
                <div className="col-span-2 text-sm font-medium text-muted-foreground">Alamat Customer</div>
                <div className="col-span-10">
                  <Input
                    id="alamat"
                    type="text"
                    placeholder="Alamat customer"
                    value={followUpForm.alamat}
                    onChange={(e) => setFollowUpForm({ ...followUpForm, alamat: e.target.value })}
                    className="w-full"
                  />
                </div>
              </div>

              {/* Row 4: Perkiraan Jumlah | Segmen */}
              <div className="grid grid-cols-12 gap-1 items-center">
                <div className="col-span-2 text-sm font-medium text-muted-foreground">Perkiraan Jumlah</div>
                <div className="col-span-4">
                  <Select
                    value={followUpForm.perkiraanJumlah}
                    onValueChange={(value) => setFollowUpForm({ ...followUpForm, perkiraanJumlah: value })}
                  >
                    <SelectTrigger id="perkiraanJumlah" className="w-full">
                      <SelectValue placeholder="Pilih range jumlah" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="<50">&lt;50</SelectItem>
                      <SelectItem value="50-100">50-100</SelectItem>
                      <SelectItem value="100-250">100-250</SelectItem>
                      <SelectItem value="250-500">250-500</SelectItem>
                      <SelectItem value="500-1000">500-1000</SelectItem>
                      <SelectItem value="1000-5000">1000-5000</SelectItem>
                      <SelectItem value="5000-10000">5000-10000</SelectItem>
                      <SelectItem value=">10000">&gt;10000</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="col-span-2 text-sm font-medium text-muted-foreground">Segmen</div>
                <div className="col-span-4">
                  <Select
                    value={followUpForm.segmen}
                    onValueChange={(value) => setFollowUpForm({ ...followUpForm, segmen: value })}
                  >
                    <SelectTrigger id="segmen" className="w-full">
                      <SelectValue placeholder="Pilih segmen" />
                    </SelectTrigger>
                    <SelectContent>
                      {segments.map((segment) => (
                        <SelectItem key={segment.id} value={segment.name}>
                          {segment.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Row 5: Jenis Produk | Estimasi Harga */}
              <div className="grid grid-cols-12 gap-1 items-start">
                <div className="col-span-2 text-sm font-medium text-muted-foreground pt-2">Jenis Produk</div>
                <div className="col-span-4">
                  <div className="space-y-2">
                    {/* Dropdown untuk memilih jenis produk */}
                    {productTypes.length > 0 && (
                      <Select
                        value=""
                        onValueChange={(value) => {
                          if (value && !selectedProductTypes.includes(value)) {
                            setSelectedProductTypes([...selectedProductTypes, value]);
                          }
                        }}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Pilih jenis produk" />
                        </SelectTrigger>
                        <SelectContent>
                          {productTypes
                            .filter(pt => pt.id && typeof pt.id === 'string' && pt.id.trim() !== '' && !selectedProductTypes.includes(pt.id))
                            .map((productType) => (
                              <SelectItem key={productType.id} value={productType.id}>
                                {productType.name}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    )}

                    {/* Display selected product types sebagai badge */}
                    {selectedProductTypes.length > 0 ? (
                      <div className="border rounded-lg p-2 bg-muted/30 min-h-[50px]">
                        <div className="flex flex-wrap gap-1.5">
                          {selectedProductTypes.map((typeId) => {
                            const productType = productTypes.find(pt => pt.id === typeId);
                            if (!productType) return null;
                            return (
                              <Badge
                                key={typeId}
                                variant="secondary"
                                className="bg-blue-100 text-blue-700 hover:bg-blue-200 pl-2 pr-1 py-0.5 text-xs"
                              >
                                {productType.name}
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  className="h-auto w-auto p-0 ml-1.5 hover:bg-transparent"
                                  onClick={() => {
                                    setSelectedProductTypes(selectedProductTypes.filter(id => id !== typeId));
                                  }}
                                >
                                  <X className="w-3 h-3 hover:text-red-600" />
                                </Button>
                              </Badge>
                            );
                          })}
                        </div>
                      </div>
                    ) : (
                      <div className="border-2 border-dashed rounded-lg p-2 bg-muted/10 text-center">
                        <p className="text-xs text-muted-foreground">
                          {productTypes.length === 0
                            ? 'Belum ada jenis produk tersedia'
                            : 'Belum ada jenis produk dipilih'}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
                <div className="col-span-2 text-sm font-medium text-muted-foreground pt-2">Estimasi Harga</div>
                <div className="col-span-4">
                  <Input
                    id="estimasiHarga"
                    type="number"
                    placeholder="0"
                    value={followUpForm.estimasiHarga}
                    onChange={(e) => setFollowUpForm({ ...followUpForm, estimasiHarga: e.target.value })}
                    className="w-full"
                  />
                </div>
              </div>

              {/* Row 6: Hasil | Catatan */}
              <div className="grid grid-cols-12 gap-1 items-start">
                <div className="col-span-2 text-sm font-medium text-muted-foreground pt-2">
                  Hasil <span className="text-red-500">*</span>
                </div>
                <div className="col-span-4">
                  <Textarea
                    id="hasil"
                    value={followUpForm.hasil}
                    onChange={(e) => setFollowUpForm({ ...followUpForm, hasil: e.target.value })}
                    placeholder="Hasil dari aktivitas follow-up"
                    rows={3}
                    className="w-full"
                  />
                </div>
                <div className="col-span-2 text-sm font-medium text-muted-foreground pt-2">
                  Catatan
                </div>
                <div className="col-span-4">
                  <Textarea
                    id="catatan"
                    value={followUpForm.catatan}
                    onChange={(e) => setFollowUpForm({ ...followUpForm, catatan: e.target.value })}
                    placeholder="Catatan tambahan"
                    rows={3}
                    className="w-full"
                  />
                </div>
              </div>

              {/* Row 7: Tambah Penawaran */}
              <div className="grid grid-cols-12 gap-1 items-start">
                <div className="col-span-2 text-sm font-medium text-muted-foreground pt-2">
                  Tambah Penawaran
                </div>
                <div className="col-span-10">
                  <div className="space-y-2">
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full border-dashed border-2 border-blue-300 text-blue-600 hover:bg-blue-50 hover:text-blue-700"
                      onClick={() => {
                        if (!selectedPipeline?.id) return;

                        // Simpan state follow-up ke localStorage
                        const followUpState = {
                          pipelineId: selectedPipeline.id,
                          followUpForm,
                          selectedProductTypes,
                          quotationNumbers,
                          editingFollowUpId: null,
                        };

                        console.log('💾 Saving follow-up state to localStorage (Pipeline List):', followUpState);
                        localStorage.setItem('pendingFollowUpState', JSON.stringify(followUpState));

                        // Verify localStorage was saved
                        const saved = localStorage.getItem('pendingFollowUpState');
                        console.log('✔️ Verified saved state:', saved);

                        // Navigate ke quotation form dengan parameter
                        const navUrl = `/sales/quotations/new?pipelineId=${selectedPipeline.id}&returnToFollowUp=true`;
                        console.log('🔀 Navigating to:', navUrl);
                        navigate(navUrl);
                      }}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Buat Penawaran untuk Pipeline Ini
                    </Button>

                    {/* Display quotation numbers yang sudah dibuat */}
                    {quotationNumbers.length > 0 ? (
                      <div className="border rounded-lg p-2 bg-green-50 border-green-200">
                        <div className="text-xs font-medium text-green-800 mb-2">
                          Penawaran yang sudah dibuat:
                        </div>
                        <div className="space-y-1">
                          {quotationNumbers.map((quotationNum, index) => (
                            <div
                              key={index}
                              className="flex items-center justify-between bg-white rounded px-2 py-1 border border-green-300"
                            >
                              <span className="text-sm font-medium text-green-700">
                                {quotationNum}
                              </span>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="h-auto w-auto p-0 hover:bg-transparent"
                                onClick={() => {
                                  setQuotationNumbers(
                                    quotationNumbers.filter((_, i) => i !== index)
                                  );
                                }}
                              >
                                <X className="w-4 h-4 text-red-600 hover:text-red-700" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="border-2 border-dashed rounded-lg p-2 bg-muted/10 text-center">
                        <p className="text-xs text-muted-foreground">
                          Belum ada penawaran dibuat
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <DialogFooter className="mt-4">
              <Button type="button" variant="outline" onClick={handleCloseFollowUpModal} disabled={submitting}>
                Batal
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? 'Menyimpan...' : 'Simpan Follow-Up'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}