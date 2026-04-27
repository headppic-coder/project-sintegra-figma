import { useState, useEffect, useMemo } from "react";
import { useNavigate, useParams } from "react-router";
import { useSimpleAuth } from "../../contexts/simple-auth-context";
import {
  ChevronLeft,
  Edit,
  Trash2,
  Calendar,
  User,
  Building2,
  Target,
  Activity,
  MapPin,
  TrendingUp,
  FileText,
  MessageSquare,
  Clock,
  CheckCircle2,
  X,
  Package,
  History,
  Eye,
  Plus,
} from "lucide-react";
import { Button } from "../../components/ui/button";
import { PageHeader } from "../../components/page-header";
import { Card } from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import { DataTable } from "../../components/data-table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "../../components/ui/dialog";
import { Input } from "../../components/ui/input";
import { Textarea } from "../../components/ui/textarea";
import { Label } from "../../components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select";
import { DatePicker } from "../../components/ui/date-picker";
import { toast } from "sonner";
import { api } from "../../lib/api";
import { formatDate } from "../../components/ui/utils";
import { displayPhoneNumber } from "../../lib/phone-utils";

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
  segmen: string;
  perkiraanJumlah: string;
  picSales: string; // PIC Sales
  sumberLead: string; // Sumber Lead
  hasil: string;
  catatan: string;
  productTypes?: string[]; // Array of product type IDs
  createdAt: string;
  nomorTelepon?: string; // Nomor telepon customer
  estimasiHarga?: string; // Estimasi harga
}

interface PipelineFollowUp {
  id: string;
  pipelineId: string;
  tanggal: string;
  aktivitas: string;
  stage: string;
  alamat: string;
  hasil: string;
  catatan: string;
  nextFollowUp: string;
  perkiraanJumlah?: string;
  segmen?: string;
  estimasiHarga?: string;
  sumberLead?: string;
  picSales?: string;
  productTypes?: string[];
  quotationNumbers?: string[]; // Array of quotation numbers created from this follow-up
  createdAt: string;
}

interface ProductType {
  id: string;
  code: string;
  name: string;
  notes?: string;
  createdAt: string;
}

interface Customer {
  id: string;
  customerCategory: string;
  customerName: string;
  industryCategory: string;
  leadSource: string;
  holding: string;
  companyPhone: string;
  createdAt: string;
}

interface PipelineLog {
  id: string;
  pipelineId: string;
  action: string;
  changes: string[];
  changedBy: string;
  description: string;
  createdAt: string;
}

const STAGE_COLORS: Record<string, string> = {
  Lead: "bg-gray-500",
  Qualifikasi: "bg-blue-500",
  Presentasi: "bg-indigo-500",
  Proposal: "bg-purple-500",
  Negosiasi: "bg-orange-500",
  Closing: "bg-green-500",
  Lost: "bg-red-500",
};

export function PipelineDetail() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { user } = useSimpleAuth();
  const [pipeline, setPipeline] = useState<Pipeline | null>(
    null,
  );
  const [followUps, setFollowUps] = useState<
    PipelineFollowUp[]
  >([]);
  const [productTypes, setProductTypes] = useState<
    ProductType[]
  >([]);
  const [segments, setSegments] = useState<any[]>([]);
  const [leadSources, setLeadSources] = useState<any[]>([]);
  const [salesActivities, setSalesActivities] = useState<any[]>(
    [],
  );
  const [salesEmployees, setSalesEmployees] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [employeesLoaded, setEmployeesLoaded] = useState(false);
  const [customer, setCustomer] = useState<Customer | null>(
    null,
  );
  const [logs, setLogs] = useState<PipelineLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [showFollowUpModal, setShowFollowUpModal] =
    useState(false);
  const [showFollowUpDetailModal, setShowFollowUpDetailModal] =
    useState(false);
  const [showLogModal, setShowLogModal] = useState(false);
  const [selectedFollowUp, setSelectedFollowUp] =
    useState<PipelineFollowUp | null>(null);
  const [selectedProductTypes, setSelectedProductTypes] =
    useState<string[]>([]);
  const [quotationNumbers, setQuotationNumbers] = useState<
    string[]
  >([]);
  const [followUpForm, setFollowUpForm] = useState<{
    tanggal: string;
    aktivitas: string;
    stage: string;
    alamat: string;
    hasil: string;
    catatan: string;
    nextFollowUp: string;
    perkiraanJumlah: string;
    segmen: string;
    estimasiHarga: string;
    sumberLead: string;
    picSales: string;
    pic: string;
  }>({
    tanggal: new Date().toISOString().split("T")[0],
    aktivitas: "",
    stage: "",
    alamat: "",
    hasil: "",
    catatan: "",
    nextFollowUp: "",
    perkiraanJumlah: "",
    segmen: "",
    estimasiHarga: "",
    sumberLead: "",
    picSales: "",
    pic: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [editingFollowUpId, setEditingFollowUpId] = useState<
    string | null
  >(null);

  useEffect(() => {
    if (id) {
      fetchPipelineData(id);
    }
  }, [id]);

  useEffect(() => {
    // Fetch sales employees immediately on mount
    fetchSalesEmployees();
  }, []);

  useEffect(() => {
    console.log('salesEmployees state changed:', salesEmployees);
  }, [salesEmployees]);

  // Check for returning from quotation form - run after data is loaded
  useEffect(() => {
    if (loading || !pipeline) {
      console.log('⏳ Still loading, skipping localStorage check');
      return;
    }

    console.log('🔍 Checking localStorage for return from quotation...');
    const newQuotation = localStorage.getItem('newQuotationNumber');
    const pendingFollowUpState = localStorage.getItem('pendingFollowUpState');

    console.log('📦 LocalStorage values:', { newQuotation, pendingFollowUpState });

    if (newQuotation && pendingFollowUpState) {
      try {
        const state = JSON.parse(pendingFollowUpState);
        console.log('📋 Parsed state:', state);

        // Verify this is for the current pipeline
        if (state.pipelineId !== id) {
          console.warn('⚠️ Pipeline ID mismatch, clearing localStorage');
          localStorage.removeItem('newQuotationNumber');
          localStorage.removeItem('pendingFollowUpState');
          return;
        }

        // Restore follow-up state
        console.log('♻️ Restoring follow-up state...');
        setFollowUpForm(state.followUpForm);
        setSelectedProductTypes(state.selectedProductTypes || []);
        setEditingFollowUpId(state.editingFollowUpId);

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
  }, [loading, pipeline, id]);

  const salesEmployeeItems = useMemo(() => {
    console.log('Creating salesEmployeeItems from salesEmployees:', salesEmployees);
    const items = salesEmployees
      .filter((emp: any) => emp.name && typeof emp.name === 'string' && emp.name.trim() !== '')
      .map((emp: any, index: number) => {
        console.log(`Mapping employee ${index}:`, emp.name);
        return {
          id: `se-${index}-${Math.random().toString(36).substr(2, 9)}`,
          name: emp.name.trim(),
        };
      });
    console.log('Final salesEmployeeItems:', items);
    return items;
  }, [salesEmployees]);

  const fetchPipelineData = async (pipelineId: string) => {
    try {
      setLoading(true);
      const pipelines = await api.getPipelines();
      const result = pipelines.find(
        (p: Pipeline) => p.id === pipelineId,
      );

      if (result) {
        setPipeline(result);
        fetchFollowUpData(result.id);
        fetchProductTypes();
        fetchSegments();
        fetchLeadSources();
        fetchSalesActivities();
        fetchSalesEmployees();
        if (result.customerId) {
          fetchCustomerData(result.customerId);
        }
        fetchLogsData(result.id);
      } else {
        toast.error("Pipeline tidak ditemukan");
        navigate("/sales/pipeline");
      }
    } catch (error) {
      console.error("Error fetching pipeline data:", error);
      toast.error("Gagal memuat data pipeline");
      navigate("/sales/pipeline");
    } finally {
      setLoading(false);
    }
  };

  const fetchFollowUpData = async (pipelineId: string) => {
    try {
      const allFollowUps = await api.getPipelineFollowUps();
      // Filter follow-ups untuk pipeline ini saja
      const filteredFollowUps = allFollowUps.filter(
        (f: PipelineFollowUp) => f.pipelineId === pipelineId,
      );
      // Sort by date descending (newest first), then by createdAt for same date
      filteredFollowUps.sort(
        (a: PipelineFollowUp, b: PipelineFollowUp) => {
          const dateCompare =
            new Date(b.tanggal).getTime() -
            new Date(a.tanggal).getTime();
          if (dateCompare !== 0) return dateCompare;
          // If same date, sort by createdAt (newest first)
          return (
            new Date(b.createdAt).getTime() -
            new Date(a.createdAt).getTime()
          );
        },
      );
      setFollowUps(filteredFollowUps);
    } catch (error) {
      console.error("Error fetching follow-up data:", error);
      // Don't show error toast for empty data
      setFollowUps([]);
    }
  };

  const fetchProductTypes = async () => {
    try {
      const allProductTypes = await api.getProductTypes();
      setProductTypes(allProductTypes);
    } catch (error) {
      console.error("Error fetching product types:", error);
      // Don't show error toast for empty data
      setProductTypes([]);
    }
  };

  const fetchSegments = async () => {
    try {
      const allSegments = await api.getSegments();
      setSegments(allSegments || []);
    } catch (error) {
      console.error("Error fetching segments:", error);
      setSegments([]);
    }
  };

  const fetchLeadSources = async () => {
    try {
      const allLeadSources = await api.getLeadSources();
      setLeadSources(allLeadSources || []);
    } catch (error) {
      console.error("Error fetching lead sources:", error);
      setLeadSources([]);
    }
  };

  const fetchSalesActivities = async () => {
    try {
      const result = await api.getSalesActivities();
      setSalesActivities(result || []);
    } catch (error) {
      console.error("Error fetching sales activities:", error);
      setSalesActivities([]);
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
      // Fetch all employees directly
      const allEmployees = await api.getEmployees() || [];

      // Simply set all employees - kita tidak filter berdasarkan department dulu
      // Karena fetching departments tampaknya bermasalah
      console.log('Fetched employees:', allEmployees.length);
      setSalesEmployees(allEmployees);
      setEmployeesLoaded(true);
    } catch (error) {
      console.error("Error fetching sales employees:", error);
      setSalesEmployees([]);
    }
  };

  const fetchCustomerData = async (customerId: string) => {
    try {
      const allCustomers = await api.getCustomers();
      const result = allCustomers.find(
        (c: Customer) => c.id === customerId,
      );

      if (result) {
        setCustomer(result);
      } else {
        toast.error("Customer tidak ditemukan");
      }
    } catch (error) {
      console.error("Error fetching customer data:", error);
      toast.error("Gagal memuat data customer");
    }
  };

  const fetchLogsData = async (pipelineId: string) => {
    try {
      const filteredLogs =
        await api.getPipelineLogs(pipelineId);
      setLogs(filteredLogs);
    } catch (error) {
      console.error("Error fetching logs data:", error);
      // Don't show error toast for empty data
      setLogs([]);
    }
  };

  const handleDelete = async () => {
    if (!id) return;

    if (
      !confirm(
        "Apakah Anda yakin ingin menghapus pipeline ini?",
      )
    )
      return;

    try {
      await api.delete(id);
      toast.success("Pipeline berhasil dihapus");
      navigate("/sales/pipeline");
    } catch (error) {
      console.error("Error deleting pipeline:", error);
      toast.error("Gagal menghapus pipeline");
    }
  };

  const handleOpenFollowUpModal = () => {
    // Validasi: Jika stage sudah Closing, tidak boleh tambah follow-up
    if (pipeline?.stage === 'Closing') {
      toast.error('Tidak dapat menambah follow-up', {
        description: 'Pipeline dengan stage "Closing" tidak dapat ditambahkan follow-up baru.'
      });
      return;
    }

    const picSalesValue = user?.name || pipeline?.picSales || "";
    const picValue = user?.name || "";
    console.log('=== Opening Follow-Up Modal (Detail) ===');
    console.log('User object:', user);
    console.log('User name:', user?.name);
    console.log('Pipeline PIC Sales:', pipeline?.picSales);
    console.log('Selected PIC Sales value:', picSalesValue);
    console.log('Selected PIC value:', picValue);
    console.log('Sales employees available:', salesEmployees.length);
    console.log('Sales employees names:', salesEmployees.map((e: any) => e.name));

    setEditingFollowUpId(null);
    setFollowUpForm({
      tanggal: new Date().toISOString().split("T")[0],
      aktivitas: "",
      stage: pipeline?.stage || "Lead",
      alamat: pipeline?.alamat || "",
      hasil: "",
      catatan: "",
      nextFollowUp: "",
      perkiraanJumlah: pipeline?.perkiraanJumlah || "",
      segmen: pipeline?.segmen || "",
      estimasiHarga: pipeline?.estimasiHarga || "",
      sumberLead: pipeline?.sumberLead || "",
      picSales: picSalesValue,
      pic: picValue,
    });
    setSelectedProductTypes(pipeline?.productTypes || []);
    setQuotationNumbers([]);
    setShowFollowUpModal(true);
  };

  const handleEditFollowUp = (followUp: PipelineFollowUp) => {
    // Validasi: Jika stage sudah Closing, tidak boleh edit follow-up
    if (pipeline?.stage === 'Closing') {
      toast.error('Tidak dapat mengedit follow-up', {
        description: 'Pipeline dengan stage "Closing" tidak dapat diedit follow-up nya.'
      });
      return;
    }

    setEditingFollowUpId(followUp.id);
    setFollowUpForm({
      tanggal: followUp.tanggal,
      aktivitas: followUp.aktivitas,
      stage: followUp.stage || pipeline?.stage || "Lead",
      alamat: followUp.alamat || pipeline?.alamat || "",
      hasil: followUp.hasil || "",
      catatan: followUp.catatan || "",
      nextFollowUp: followUp.nextFollowUp || "",
      perkiraanJumlah:
        followUp.perkiraanJumlah ||
        pipeline?.perkiraanJumlah ||
        "",
      segmen: followUp.segmen || pipeline?.segmen || "",
      estimasiHarga:
        followUp.estimasiHarga || pipeline?.estimasiHarga || "",
      sumberLead:
        followUp.sumberLead || pipeline?.sumberLead || "",
      picSales:
        followUp.picSales || pipeline?.picSales || "",
      pic: followUp.pic || "",
    });
    setSelectedProductTypes(
      followUp.productTypes || pipeline?.productTypes || [],
    );
    setQuotationNumbers(followUp.quotationNumbers || []);
    setShowFollowUpModal(true);
  };

  const handleViewFollowUp = (followUp: PipelineFollowUp) => {
    setSelectedFollowUp(followUp);
    setShowFollowUpDetailModal(true);
  };

  const handleDeleteFollowUp = async (
    followUp: PipelineFollowUp,
  ) => {
    // Validasi: Jika stage sudah Closing, tidak boleh hapus follow-up
    if (pipeline?.stage === 'Closing') {
      toast.error('Tidak dapat menghapus follow-up', {
        description: 'Pipeline dengan stage "Closing" tidak dapat dihapus follow-up nya.'
      });
      return;
    }

    if (
      !confirm(
        "Apakah Anda yakin ingin menghapus follow-up ini?",
      )
    )
      return;

    try {
      await api.deletePipelineFollowUp(followUp.id);
      toast.success("Follow-up berhasil dihapus");
      if (id) fetchFollowUpData(id);
    } catch (error) {
      console.error("Error deleting follow-up:", error);
      toast.error("Gagal menghapus follow-up");
    }
  };

  const handleCloseFollowUpModal = () => {
    setShowFollowUpModal(false);
    setEditingFollowUpId(null);
    setFollowUpForm({
      tanggal: new Date().toISOString().split("T")[0],
      aktivitas: "",
      stage: "",
      alamat: "",
      hasil: "",
      catatan: "",
      nextFollowUp: "",
      perkiraanJumlah: "",
      segmen: "",
      estimasiHarga: "",
      sumberLead: "",
      picSales: "",
      pic: "",
    });
    setSelectedProductTypes([]);
    setQuotationNumbers([]);
  };

  const handleSubmitFollowUp = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!id) {
      toast.error("Pipeline ID tidak ditemukan");
      return;
    }

    if (
      !followUpForm.tanggal ||
      !followUpForm.aktivitas ||
      !followUpForm.hasil
    ) {
      toast.error("Tanggal, Aktivitas, dan Hasil harus diisi");
      return;
    }

    try {
      setSubmitting(true);

      const followUpData = {
        pipelineId: id,
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

      // Create or update follow-up
      if (editingFollowUpId) {
        await api.updatePipelineFollowUp(
          editingFollowUpId,
          followUpData,
        );
        toast.success("Follow-up berhasil diperbarui");
      } else {
        await api.createPipelineFollowUp(followUpData);

        // Update pipeline with new data from follow-up (only for new follow-ups)
        const changes: string[] = [];

        // Check for changes and build log
        if (
          pipeline.stage !== followUpForm.stage &&
          followUpForm.stage
        ) {
          changes.push(
            `Stage: "${pipeline.stage}" → "${followUpForm.stage}"`,
          );
        }
        if (
          pipeline.perkiraanJumlah !==
            followUpForm.perkiraanJumlah &&
          followUpForm.perkiraanJumlah
        ) {
          changes.push(
            `Perkiraan Jumlah: "${pipeline.perkiraanJumlah || "-"}" → "${followUpForm.perkiraanJumlah}"`,
          );
        }
        if (
          pipeline.segmen !== followUpForm.segmen &&
          followUpForm.segmen
        ) {
          changes.push(
            `Segmen: "${pipeline.segmen || "-"}" → "${followUpForm.segmen}"`,
          );
        }
        if (
          pipeline.estimasiHarga !==
            followUpForm.estimasiHarga &&
          followUpForm.estimasiHarga
        ) {
          changes.push(
            `Estimasi Harga: "${pipeline.estimasiHarga || "-"}" → "${followUpForm.estimasiHarga}"`,
          );
        }
        if (
          pipeline.sumberLead !== followUpForm.sumberLead &&
          followUpForm.sumberLead
        ) {
          changes.push(
            `Sumber Lead: "${pipeline.sumberLead || "-"}" → "${followUpForm.sumberLead}"`,
          );
        }
        if (
          pipeline.picSales !== followUpForm.picSales &&
          followUpForm.picSales
        ) {
          changes.push(
            `PIC Sales: "${pipeline.picSales || "-"}" → "${followUpForm.picSales}"`,
          );
        }
        if (
          JSON.stringify(pipeline.productTypes || []) !==
            JSON.stringify(selectedProductTypes) &&
          selectedProductTypes.length > 0
        ) {
          changes.push(`Jenis Produk diperbarui`);
        }

        console.log("🔍 Checking for changes:", {
          pipeline: {
            stage: pipeline.stage,
            perkiraanJumlah: pipeline.perkiraanJumlah,
            segmen: pipeline.segmen,
            estimasiHarga: pipeline.estimasiHarga,
            sumberLead: pipeline.sumberLead,
            productTypes: pipeline.productTypes,
          },
          followUp: {
            stage: followUpForm.stage,
            perkiraanJumlah: followUpForm.perkiraanJumlah,
            segmen: followUpForm.segmen,
            estimasiHarga: followUpForm.estimasiHarga,
            sumberLead: followUpForm.sumberLead,
            productTypes: selectedProductTypes,
          },
          changes: changes,
        });

        // Update pipeline jika ada perubahan
        if (changes.length > 0) {
          const updatedPipelineData = {
            ...pipeline,
            stage: followUpForm.stage || pipeline.stage,
            perkiraanJumlah:
              followUpForm.perkiraanJumlah ||
              pipeline.perkiraanJumlah,
            segmen: followUpForm.segmen || pipeline.segmen,
            estimasiHarga:
              followUpForm.estimasiHarga ||
              pipeline.estimasiHarga,
            sumberLead:
              followUpForm.sumberLead || pipeline.sumberLead,
            picSales:
              followUpForm.picSales || pipeline.picSales,
            productTypes:
              selectedProductTypes.length > 0
                ? selectedProductTypes
                : pipeline.productTypes,
          };

          await api.update(id, updatedPipelineData);

          // Create log entry
          const logResult = await api.createPipelineLog({
            pipelineId: id,
            action: "Update dari Follow-Up",
            description: `Data pipeline diperbarui dari follow-up (${changes.length} perubahan)`,
            changes: changes,
            changedBy: "Admin", // TODO: Get from auth context
          });

          console.log(
            "✅ Log histori berhasil dibuat:",
            logResult,
          );
          toast.success(
            "Follow-up berhasil ditambahkan dan pipeline diperbarui",
          );
        } else {
          toast.success("Follow-up berhasil ditambahkan");
        }
      }

      handleCloseFollowUpModal();

      // Refresh data
      if (id) {
        fetchPipelineData(id);
        fetchFollowUpData(id);
        fetchLogsData(id);
      }
    } catch (error) {
      console.error("Error saving follow-up:", error);
      toast.error(
        editingFollowUpId
          ? "Gagal memperbarui follow-up"
          : "Gagal menambahkan follow-up",
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="text-lg font-medium">
            Memuat data...
          </div>
        </div>
      </div>
    );
  }

  if (!pipeline) {
    return null;
  }

  const getCity = (address: string) => {
    const cityMatch = address.match(/, ([\w\s]+),/);
    return cityMatch ? cityMatch[1] : "-";
  };

  const renderProductTypes = () => {
    if (
      pipeline.productTypes &&
      pipeline.productTypes.length > 0
    ) {
      return (
        <div className="flex flex-wrap gap-2">
          {pipeline.productTypes.map((typeId) => {
            const productType = productTypes.find(
              (pt) => pt.id === typeId,
            );
            if (!productType) return null;
            return (
              <Badge
                key={typeId}
                variant="secondary"
                className="bg-blue-100 text-blue-700 hover:bg-blue-100 text-xs"
              >
                <Package className="w-3 h-3 mr-1" />
                {productType.name}
              </Badge>
            );
          })}
        </div>
      );
    } else {
      return (
        <span className="text-sm text-muted-foreground">
          Belum ada jenis produk dipilih
        </span>
      );
    }
  };

  return (
    <div className="space-y-6 pb-4">
      <PageHeader
        title="Detail Informasi Pipeline"
        breadcrumbs={[
          { label: "Dashboard", href: "/" },
          { label: "Sales" },
          { label: "Pipeline", href: "/sales/pipeline" },
          { label: "Detail" },
        ]}
        actions={
          <div className="flex gap-2">
            <Button
              className="bg-green-600 hover:bg-green-700 text-white"
              onClick={() => navigate(`/sales/pipeline/${id}`)}
            >
              <Edit className="w-4 h-4 mr-2" />
              Edit Pipeline
            </Button>
            <Button
              className="bg-yellow-500 hover:bg-yellow-600 text-white"
              onClick={() => {
                if (pipeline.customerId) {
                  navigate(
                    `/sales/customers/${pipeline.customerId}/edit?from=pipeline&id=${id}`,
                  );
                } else {
                  navigate(
                    `/sales/customers/add?from=pipeline&id=${id}`,
                  );
                }
              }}
            >
              Lengkapi Data Customer
            </Button>
            <Button
              variant="outline"
              onClick={() => navigate("/sales/pipeline")}
            >
              Kembali
            </Button>
          </div>
        }
      />

      {/* Section 1 - Detail Informasi Pipeline */}
      <Card className="p-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-8 gap-y-0">
          {/* Left Column */}
          <div className="space-y-0">
            <div className="grid grid-cols-3 gap-1 py-1">
              <div className="text-sm font-medium text-muted-foreground">
                Nama
              </div>
              <div className="col-span-2 text-sm">
                <span className="font-semibold">
                  {pipeline.customer}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-1 py-1">
              <div className="text-sm font-medium text-muted-foreground">
                Industri
              </div>
              <div className="col-span-2 text-sm">
                {customer?.industryCategory || "-"}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-1 py-1">
              <div className="text-sm font-medium text-muted-foreground">
                Jenis Customer
              </div>
              <div className="col-span-2">
                <Badge
                  variant="default"
                  className="bg-green-600 text-white text-xs"
                >
                  {pipeline.orderType === "New"
                    ? "Baru"
                    : "Repeat Order"}
                </Badge>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-1 py-1">
              <div className="text-sm font-medium text-muted-foreground">
                Status
              </div>
              <div className="col-span-2">
                <Badge
                  className={`${STAGE_COLORS[pipeline.stage]} text-white text-xs`}
                >
                  {pipeline.stage}
                </Badge>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-1 py-1">
              <div className="text-sm font-medium text-muted-foreground">
                Catatan
              </div>
              <div className="col-span-2 text-sm">
                {pipeline.catatan || "-"}
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-0">
            <div className="grid grid-cols-3 gap-1 py-1">
              <div className="text-sm font-medium text-muted-foreground">
                Kontak Customer
              </div>
              <div className="col-span-2 text-sm">
                {pipeline.nomorTelepon ? (
                  <div className="flex items-center gap-2">
                    <span className="text-red-600">📞</span>
                    <span>
                      {displayPhoneNumber(
                        pipeline.nomorTelepon,
                      )}
                    </span>
                  </div>
                ) : (
                  "-"
                )}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-1 py-1">
              <div className="text-sm font-medium text-muted-foreground">
                Alamat Customer
              </div>
              <div className="col-span-2 text-sm">
                {pipeline.alamat || "-"}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-1 py-1">
              <div className="text-sm font-medium text-muted-foreground">
                Kota
              </div>
              <div className="col-span-2 text-sm">
                {getCity(pipeline.alamat)}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-1 py-1">
              <div className="text-sm font-medium text-muted-foreground">
                PIC Sales
              </div>
              <div className="col-span-2 text-sm">
                {pipeline.picSales || "-"}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-1 py-1">
              <div className="text-sm font-medium text-muted-foreground">
                Kategori Customer
              </div>
              <div className="col-span-2">
                {customer?.customerCategory ? (
                  <Badge
                    variant="outline"
                    className={`${
                      customer.customerCategory === "Perusahaan"
                        ? "border-blue-300 bg-blue-50 text-blue-700"
                        : "border-purple-300 bg-purple-50 text-purple-700"
                    } text-xs`}
                  >
                    {customer.customerCategory}
                  </Badge>
                ) : (
                  <span className="text-sm text-muted-foreground">
                    -
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Section 2 - Kebutuhan Awal Customer */}
      <Card className="p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-base">
            Kebutuhan Customer
          </h3>
          <div className="flex items-center gap-1">
            <Button
              size="sm"
              variant="outline"
              className="border-orange-200 text-orange-700 hover:bg-orange-50 hover:text-orange-800"
              onClick={() => setShowLogModal(true)}
            >
              <History className="w-4 h-4 mr-2" />
              Log Histori
            </Button>
            <div className="text-xs text-muted-foreground">
              Dibuat: {formatDate(pipeline.createdAt)}{" "}
              {new Date(pipeline.createdAt).toLocaleTimeString(
                "id-ID",
                {
                  hour: "2-digit",
                  minute: "2-digit",
                },
              )}{" "}
              - oleh {pipeline.picSales || "Admin"}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-8 gap-y-0">
          {/* Left Column */}
          <div className="space-y-0">
            <div className="grid grid-cols-3 gap-1 py-1">
              <div className="text-sm font-medium text-muted-foreground">
                Jumlah
              </div>
              <div className="col-span-2">
                <Badge
                  variant="default"
                  className="bg-blue-600 text-white text-xs"
                >
                  {pipeline.perkiraanJumlah || "-"}
                </Badge>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-1 py-1">
              <div className="text-sm font-medium text-muted-foreground">
                Segmen
              </div>
              <div className="col-span-2">
                {pipeline.segmen ? (
                  <Badge
                    variant="secondary"
                    className="bg-gray-600 text-white text-xs"
                  >
                    {pipeline.segmen}
                  </Badge>
                ) : (
                  <span className="text-sm">-</span>
                )}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-1 py-1">
              <div className="text-sm font-medium text-muted-foreground">
                Estimasi Harga
              </div>
              <div className="col-span-2 text-sm font-semibold text-green-700">
                {pipeline.estimasiHarga ? (
                  `Rp ${parseInt(pipeline.estimasiHarga).toLocaleString("id-ID")}`
                ) : (
                  <span className="text-muted-foreground font-normal">
                    -
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-0">
            <div className="grid grid-cols-3 gap-1 py-1">
              <div className="text-sm font-medium text-muted-foreground">
                Sumber Lead
              </div>
              <div className="col-span-2">
                {pipeline.sumberLead ? (
                  <Badge
                    variant="outline"
                    className="bg-purple-100 text-purple-700 border-purple-300 text-xs"
                  >
                    {pipeline.sumberLead}
                  </Badge>
                ) : (
                  <span className="text-sm">-</span>
                )}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-1 py-1">
              <div className="text-sm font-medium text-muted-foreground">
                Jenis Produk
              </div>
              <div className="col-span-2">
                {renderProductTypes()}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-1 py-1">
              <div className="text-sm font-medium text-muted-foreground">
                Hasil
              </div>
              <div className="col-span-2 text-sm">
                {followUps.length > 0
                  ? followUps[0].hasil || "-"
                  : pipeline.hasil || "-"}
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Section 3 - Follow-Up */}
      <Card className="p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-base">Follow-Up</h3>
          <Button
            size="sm"
            className={pipeline?.stage === 'Closing' ? "bg-gray-400 text-white cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700 text-white"}
            onClick={handleOpenFollowUpModal}
            disabled={pipeline?.stage === 'Closing'}
            title={pipeline?.stage === 'Closing' ? 'Pipeline sudah closing, tidak dapat menambah follow-up' : 'Tambah follow-up baru'}
          >
            + Follow Up
          </Button>
        </div>

        {followUps.length > 0 ? (
          <DataTable
            columns={[
              {
                key: "tanggal",
                label: "Tanggal",
                render: (value) => (
                  <div className="text-sm font-medium">
                    {formatDate(value)}
                  </div>
                ),
              },
              {
                key: "aktivitas",
                label: "Aktivitas Sales",
                render: (value) => (
                  <div className="text-sm">{value || "-"}</div>
                ),
              },
              {
                key: "stage",
                label: "Stage Pipeline",
                render: (value, row) => {
                  const stageValue = value || pipeline.stage;
                  return (
                    <Badge
                      className={`${STAGE_COLORS[stageValue]} text-white text-xs`}
                    >
                      {stageValue}
                    </Badge>
                  );
                },
              },
              {
                key: "hasil",
                label: "Hasil",
                render: (value) => (
                  <div
                    className="text-sm max-w-xs truncate"
                    title={value || "-"}
                  >
                    {value || "-"}
                  </div>
                ),
              },
              {
                key: "catatan",
                label: "Catatan",
                render: (value) => (
                  <div
                    className="text-sm max-w-xs truncate"
                    title={value || "-"}
                  >
                    {value || "-"}
                  </div>
                ),
              },
              {
                key: "quotationNumbers",
                label: "Penawaran",
                render: (value: string[] | undefined) => {
                  if (!value || value.length === 0) {
                    return <div className="text-xs text-muted-foreground">-</div>;
                  }

                  return (
                    <div className="flex flex-wrap gap-1">
                      {value.map((quotationNum, index) => (
                        <Badge
                          key={index}
                          variant="default"
                          className="bg-purple-600 text-white text-xs cursor-pointer hover:bg-purple-700"
                          onClick={() => {
                            // Navigate to quotation detail or list
                            navigate(`/sales/quotations`);
                          }}
                          title="Klik untuk lihat penawaran"
                        >
                          {quotationNum}
                        </Badge>
                      ))}
                    </div>
                  );
                },
              },
            ]}
            data={followUps}
            onView={handleViewFollowUp}
            onEdit={pipeline?.stage === 'Closing' ? undefined : handleEditFollowUp}
            onDelete={pipeline?.stage === 'Closing' ? undefined : handleDeleteFollowUp}
          />
        ) : (
          <div className="text-center text-sm text-muted-foreground py-12 border-2 border-dashed border-muted rounded-lg">
            <Clock className="w-12 h-12 mx-auto mb-3 text-muted-foreground/50" />
            <p>Belum ada follow up</p>
          </div>
        )}
      </Card>

      {/* Follow-Up Modal */}
      <Dialog
        open={showFollowUpModal}
        onOpenChange={handleCloseFollowUpModal}
      >
        <DialogContent className="w-[95vw] md:w-[85vw] lg:w-[70vw] !max-w-none max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-base">
              {editingFollowUpId
                ? "Edit Follow-Up"
                : "Tambah Follow-Up"}
            </DialogTitle>
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
                    onValueChange={(value) =>
                      setFollowUpForm({
                        ...followUpForm,
                        stage: value,
                      })
                    }
                  >
                    <SelectTrigger id="stage" className="w-full">
                      <SelectValue placeholder="Pilih stage" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Lead">Lead</SelectItem>
                      <SelectItem value="Qualifikasi">
                        Qualifikasi
                      </SelectItem>
                      <SelectItem value="Presentasi">
                        Presentasi
                      </SelectItem>
                      <SelectItem value="Proposal">
                        Proposal
                      </SelectItem>
                      <SelectItem value="Negosiasi">
                        Negosiasi
                      </SelectItem>
                      <SelectItem value="Closing">
                        Closing
                      </SelectItem>
                      <SelectItem value="Lost">Lost</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="col-span-2 text-sm font-medium text-muted-foreground">
                  Tanggal <span className="text-red-500">*</span>
                </div>
                <div className="col-span-4">
                  <DatePicker
                    value={followUpForm.tanggal}
                    onChange={(date) =>
                      setFollowUpForm({
                        ...followUpForm,
                        tanggal: date || new Date(),
                      })
                    }
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
                    onValueChange={(value) =>
                      setFollowUpForm({
                        ...followUpForm,
                        aktivitas: value,
                      })
                    }
                  >
                    <SelectTrigger id="aktivitas" className="w-full">
                      <SelectValue placeholder="Pilih aktivitas" />
                    </SelectTrigger>
                    <SelectContent>
                      {salesActivities.map((activity) => (
                        <SelectItem
                          key={activity.id}
                          value={activity.name}
                        >
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
                    onValueChange={(value) =>
                      setFollowUpForm({
                        ...followUpForm,
                        sumberLead: value,
                      })
                    }
                  >
                    <SelectTrigger id="sumberLead" className="w-full">
                      <SelectValue placeholder="Pilih sumber lead" />
                    </SelectTrigger>
                    <SelectContent>
                      {leadSources.map((source) => (
                        <SelectItem
                          key={source.id}
                          value={source.name}
                        >
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
                    onChange={(e) =>
                      setFollowUpForm({
                        ...followUpForm,
                        alamat: e.target.value,
                      })
                    }
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
                    onValueChange={(value) =>
                      setFollowUpForm({
                        ...followUpForm,
                        perkiraanJumlah: value,
                      })
                    }
                  >
                    <SelectTrigger id="perkiraanJumlah" className="w-full">
                      <SelectValue placeholder="Pilih range jumlah" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="<50">
                        &lt;50
                      </SelectItem>
                      <SelectItem value="50-100">
                        50-100
                      </SelectItem>
                      <SelectItem value="100-250">
                        100-250
                      </SelectItem>
                      <SelectItem value="250-500">
                        250-500
                      </SelectItem>
                      <SelectItem value="500-1000">
                        500-1000
                      </SelectItem>
                      <SelectItem value="1000-5000">
                        1000-5000
                      </SelectItem>
                      <SelectItem value="5000-10000">
                        5000-10000
                      </SelectItem>
                      <SelectItem value=">10000">
                        &gt;10000
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="col-span-2 text-sm font-medium text-muted-foreground">Segmen</div>
                <div className="col-span-4">
                  <Select
                    value={followUpForm.segmen}
                    onValueChange={(value) =>
                      setFollowUpForm({
                        ...followUpForm,
                        segmen: value,
                      })
                    }
                  >
                    <SelectTrigger id="segmen" className="w-full">
                      <SelectValue placeholder="Pilih segmen" />
                    </SelectTrigger>
                    <SelectContent>
                      {segments.map((segment) => (
                        <SelectItem
                          key={segment.id}
                          value={segment.name}
                        >
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
                          if (
                            value &&
                            !selectedProductTypes.includes(
                              value,
                            )
                          ) {
                            setSelectedProductTypes([
                              ...selectedProductTypes,
                              value,
                            ]);
                          }
                        }}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Pilih jenis produk" />
                        </SelectTrigger>
                        <SelectContent>
                          {productTypes
                            .filter(
                              (pt) =>
                                !selectedProductTypes.includes(
                                  pt.id,
                                ),
                            )
                            .map((productType) => (
                              <SelectItem
                                key={productType.id}
                                value={productType.id}
                              >
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
                          {selectedProductTypes.map(
                            (typeId) => {
                              const productType =
                                productTypes.find(
                                  (pt) => pt.id === typeId,
                                );
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
                                      setSelectedProductTypes(
                                        selectedProductTypes.filter(
                                          (id) => id !== typeId,
                                        ),
                                      );
                                    }}
                                  >
                                    <X className="w-3 h-3 hover:text-red-600" />
                                  </Button>
                                </Badge>
                              );
                            },
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="border-2 border-dashed rounded-lg p-2 bg-muted/10 text-center">
                        <p className="text-xs text-muted-foreground">
                          {productTypes.length === 0
                            ? "Belum ada jenis produk tersedia"
                            : "Belum ada jenis produk dipilih"}
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
                    onChange={(e) =>
                      setFollowUpForm({
                        ...followUpForm,
                        estimasiHarga: e.target.value,
                      })
                    }
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
                    placeholder="Hasil dari aktivitas follow-up"
                    value={followUpForm.hasil}
                    onChange={(e) =>
                      setFollowUpForm({
                        ...followUpForm,
                        hasil: e.target.value,
                      })
                    }
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
                    placeholder="Catatan tambahan"
                    value={followUpForm.catatan}
                    onChange={(e) =>
                      setFollowUpForm({
                        ...followUpForm,
                        catatan: e.target.value,
                      })
                    }
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
                        // Simpan state follow-up ke localStorage untuk retrieve setelah quotation dibuat
                        const followUpState = {
                          pipelineId: pipeline?.id,
                          followUpForm,
                          selectedProductTypes,
                          quotationNumbers,
                          editingFollowUpId,
                        };

                        console.log('💾 Saving follow-up state to localStorage:', followUpState);
                        localStorage.setItem('pendingFollowUpState', JSON.stringify(followUpState));

                        // Verify localStorage was saved
                        const saved = localStorage.getItem('pendingFollowUpState');
                        console.log('✔️ Verified saved state:', saved);

                        // Navigate ke quotation form dengan parameter
                        const navUrl = `/sales/quotations/new?pipelineId=${pipeline?.id}&returnToFollowUp=true`;
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
                                    quotationNumbers.filter(
                                      (_, i) => i !== index
                                    )
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
              <Button
                type="button"
                variant="outline"
                onClick={handleCloseFollowUpModal}
                disabled={submitting}
              >
                Batal
              </Button>
              <Button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 text-white"
                disabled={submitting}
              >
                {submitting
                  ? "Menyimpan..."
                  : editingFollowUpId
                    ? "Perbarui Follow-Up"
                    : "Simpan Follow-Up"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Log Histori Modal */}
      <Dialog
        open={showLogModal}
        onOpenChange={setShowLogModal}
      >
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <History className="w-5 h-5 text-orange-600" />
              Log Histori Pipeline - {pipeline.customer}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {logs.length > 0 ? (
              <div className="space-y-3">
                {logs.map((log, index) => (
                  <div
                    key={log.id}
                    className="border rounded-lg p-4 bg-card hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Badge
                          variant="outline"
                          className={`${
                            log.action === "Create"
                              ? "bg-green-100 text-green-700 border-green-300"
                              : "bg-blue-100 text-blue-700 border-blue-300"
                          } text-xs`}
                        >
                          {log.action === "Create"
                            ? "✨ Dibuat"
                            : "✏️ Diperbarui"}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {formatDate(log.createdAt)}{" "}
                          {new Date(
                            log.createdAt,
                          ).toLocaleTimeString("id-ID", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                      <Badge
                        variant="secondary"
                        className="text-xs"
                      >
                        <User className="w-3 h-3 mr-1" />
                        {log.changedBy}
                      </Badge>
                    </div>

                    <div className="mb-2">
                      <p className="text-sm font-medium text-foreground">
                        {log.description}
                      </p>
                    </div>

                    {log.changes && log.changes.length > 0 && (
                      <div className="mt-3 space-y-2 bg-muted/30 rounded-md p-3">
                        <p className="text-xs font-semibold text-foreground mb-2">
                          Detail Perubahan:
                        </p>
                        {log.changes.map((change, idx) => {
                          // Parse change string to extract field, old value, and new value
                          const match = change.match(
                            /^(.+?):\s*"(.+?)"\s*→\s*"(.+?)"$/,
                          );
                          if (match) {
                            const [
                              _,
                              field,
                              oldValue,
                              newValue,
                            ] = match;
                            return (
                              <div
                                key={idx}
                                className="bg-white rounded border p-2"
                              >
                                <div className="text-xs font-medium text-foreground mb-1">
                                  {field}
                                </div>
                                <div className="flex items-center gap-2 text-xs">
                                  <div className="flex-1 bg-red-50 border border-red-200 rounded px-2 py-1">
                                    <span className="text-red-700 font-medium">
                                      Sebelum:{" "}
                                    </span>
                                    <span className="text-red-600">
                                      {oldValue}
                                    </span>
                                  </div>
                                  <span className="text-muted-foreground">
                                    →
                                  </span>
                                  <div className="flex-1 bg-green-50 border border-green-200 rounded px-2 py-1">
                                    <span className="text-green-700 font-medium">
                                      Sesudah:{" "}
                                    </span>
                                    <span className="text-green-600">
                                      {newValue}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            );
                          } else {
                            // For changes that don't match the pattern (like "Jenis Produk diperbarui")
                            return (
                              <div
                                key={idx}
                                className="bg-white rounded border p-2"
                              >
                                <div className="flex items-start gap-2 text-xs">
                                  <span className="text-blue-500 mt-0.5">
                                    •
                                  </span>
                                  <span className="text-foreground">
                                    {change}
                                  </span>
                                </div>
                              </div>
                            );
                          }
                        })}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 border-2 border-dashed border-muted rounded-lg">
                <History className="w-12 h-12 mx-auto mb-3 text-muted-foreground/50" />
                <p className="text-sm text-muted-foreground">
                  Belum ada log histori
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Perubahan data pipeline akan tercatat di sini
                </p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowLogModal(false)}
            >
              Tutup
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Follow-Up Detail Modal */}
      <Dialog
        open={showFollowUpDetailModal}
        onOpenChange={setShowFollowUpDetailModal}
      >
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detail Follow-Up</DialogTitle>
          </DialogHeader>

          {selectedFollowUp && (
            <div className="space-y-0">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-1 py-1">
                <div className="text-sm font-medium text-muted-foreground">
                  Tanggal
                </div>
                <div className="col-span-2 text-sm font-medium">
                  {formatDate(selectedFollowUp.tanggal)}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-1 py-1">
                <div className="text-sm font-medium text-muted-foreground">
                  Aktivitas Sales
                </div>
                <div className="col-span-2 text-sm">
                  {selectedFollowUp.aktivitas || "-"}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-1 py-1">
                <div className="text-sm font-medium text-muted-foreground">
                  Stage Pipeline
                </div>
                <div className="col-span-1 md:col-span-2">
                  <Badge
                    className={`${STAGE_COLORS[selectedFollowUp.stage || pipeline?.stage || "Lead"]} text-white text-xs`}
                  >
                    {selectedFollowUp.stage ||
                      pipeline?.stage ||
                      "Lead"}
                  </Badge>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-1 py-1">
                <div className="text-sm font-medium text-muted-foreground">
                  Alamat Customer
                </div>
                <div className="col-span-2 text-sm">
                  {selectedFollowUp.alamat ||
                    pipeline?.alamat ||
                    "-"}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-1 py-1">
                <div className="text-sm font-medium text-muted-foreground">
                  Perkiraan Jumlah
                </div>
                <div className="col-span-1 md:col-span-2">
                  {selectedFollowUp.perkiraanJumlah ? (
                    <Badge
                      variant="default"
                      className="bg-blue-600 text-white text-xs"
                    >
                      {selectedFollowUp.perkiraanJumlah}
                    </Badge>
                  ) : (
                    <span className="text-sm text-muted-foreground">
                      -
                    </span>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-1 py-1">
                <div className="text-sm font-medium text-muted-foreground">
                  Segmen
                </div>
                <div className="col-span-1 md:col-span-2">
                  {selectedFollowUp.segmen ? (
                    <Badge
                      variant="secondary"
                      className="bg-gray-600 text-white text-xs"
                    >
                      {selectedFollowUp.segmen}
                    </Badge>
                  ) : (
                    <span className="text-sm text-muted-foreground">
                      -
                    </span>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-1 py-1">
                <div className="text-sm font-medium text-muted-foreground">
                  Estimasi Harga
                </div>
                <div className="col-span-2 text-sm font-semibold text-green-700">
                  {selectedFollowUp.estimasiHarga ? (
                    `Rp ${parseInt(selectedFollowUp.estimasiHarga).toLocaleString("id-ID")}`
                  ) : (
                    <span className="text-muted-foreground font-normal">
                      -
                    </span>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-1 py-1">
                <div className="text-sm font-medium text-muted-foreground">
                  Sumber Lead
                </div>
                <div className="col-span-1 md:col-span-2">
                  {selectedFollowUp.sumberLead ? (
                    <Badge
                      variant="outline"
                      className="bg-purple-100 text-purple-700 border-purple-300 text-xs"
                    >
                      {selectedFollowUp.sumberLead}
                    </Badge>
                  ) : (
                    <span className="text-sm text-muted-foreground">
                      -
                    </span>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-1 py-1">
                <div className="text-sm font-medium text-muted-foreground">
                  Jenis Produk
                </div>
                <div className="col-span-1 md:col-span-2">
                  {selectedFollowUp.productTypes &&
                  selectedFollowUp.productTypes.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {selectedFollowUp.productTypes.map(
                        (typeId) => {
                          const productType = productTypes.find(
                            (pt) => pt.id === typeId,
                          );
                          return productType ? (
                            <Badge
                              key={typeId}
                              variant="secondary"
                              className="bg-blue-100 text-blue-700 hover:bg-blue-100 text-xs"
                            >
                              <Package className="w-3 h-3 mr-1" />
                              {productType.name}
                            </Badge>
                          ) : null;
                        },
                      )}
                    </div>
                  ) : (
                    <span className="text-sm text-muted-foreground">
                      -
                    </span>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-1 py-1">
                <div className="text-sm font-medium text-muted-foreground">
                  Hasil
                </div>
                <div className="col-span-2 text-sm whitespace-pre-wrap">
                  {selectedFollowUp.hasil || "-"}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-1 py-1">
                <div className="text-sm font-medium text-muted-foreground">
                  Catatan
                </div>
                <div className="col-span-2 text-sm whitespace-pre-wrap">
                  {selectedFollowUp.catatan || "-"}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-1 py-1">
                <div className="text-sm font-medium text-muted-foreground">
                  Next Follow-Up
                </div>
                <div className="col-span-2 text-sm">
                  {selectedFollowUp.nextFollowUp || "-"}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-1 py-1">
                <div className="text-sm font-medium text-muted-foreground">
                  Penawaran Dibuat
                </div>
                <div className="col-span-1 md:col-span-2">
                  {selectedFollowUp.quotationNumbers && selectedFollowUp.quotationNumbers.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {selectedFollowUp.quotationNumbers.map((quotationNum, index) => (
                        <Badge
                          key={index}
                          variant="default"
                          className="bg-purple-600 text-white text-xs cursor-pointer hover:bg-purple-700"
                          onClick={() => {
                            navigate(`/sales/quotations`);
                          }}
                          title="Klik untuk lihat penawaran"
                        >
                          {quotationNum}
                        </Badge>
                      ))}
                    </div>
                  ) : (
                    <span className="text-sm text-muted-foreground">
                      Belum ada penawaran
                    </span>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-1 py-1 pt-2 border-t">
                <div className="text-sm font-medium text-muted-foreground">
                  Dibuat Pada
                </div>
                <div className="col-span-2 text-xs text-muted-foreground">
                  {formatDate(selectedFollowUp.createdAt)}{" "}
                  {new Date(
                    selectedFollowUp.createdAt,
                  ).toLocaleTimeString("id-ID", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowFollowUpDetailModal(false)}
            >
              Tutup
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}