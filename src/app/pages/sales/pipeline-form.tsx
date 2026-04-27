import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router';
import { ChevronLeft, Plus, UserPlus, X } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Checkbox } from '../../components/ui/checkbox';
import { DatePicker } from '../../components/ui/date-picker';
import { PageHeader } from '../../components/page-header';
import { Card } from '../../components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../components/ui/dialog';
import { PhoneInput } from '../../components/ui/phone-input';
import { CityCombobox } from '../../components/ui/city-combobox';
import { toast } from 'sonner';
import { api } from '../../lib/api';
import { Badge } from '../../components/ui/badge';
import { normalizePhoneNumber, displayPhoneNumber } from '../../lib/phone-utils';

interface Customer {
  id: string;
  customerName: string;
  customerCategory: string;
  leadSource: string;
  companyPhone: string;
  billingAddress: {
    fullAddress: string;
    city: string;
    province: string;
  };
}

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
  nomorTelepon: string;
  segmen: string;
  perkiraanJumlah: string;
  estimasiHarga: string;
  picSales: string; // PIC Sales yang handle pipeline ini
  sumberLead: string; // Sumber Lead
  hasil: string;
  catatan: string;
  productTypes?: string[]; // Array of product type IDs
  createdAt: string;
}

interface LeadSource {
  id: string;
  name: string;
}

interface Employee {
  id: string;
  full_name: string;
  username: string;
  department_code?: string;
  department_name?: string;
}

interface Department {
  id: string;
  code: string;
  name: string;
  parentCode: string | null;
  level?: number;
}

interface Segment {
  id: string;
  name: string;
  description?: string;
  criteria?: string;
}

interface ProspectiveCustomer {
  id: string;
  customerName: string;
  phone: string;
  address: string;
  city: string;
  leadSource: string;
  salesPic: string;
  notes: string;
  createdAt: string;
}

interface ProductType {
  id: string;
  code: string;
  name: string;
  notes?: string;
  createdAt: string;
}

interface Region {
  id: string;
  kecamatan: string;
  kotaKabupaten: string;
  provinsi: string;
  negara: string;
  createdAt: string;
}

export function PipelineForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = !!id;

  const [loading, setLoading] = useState(false);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [leadSources, setLeadSources] = useState<LeadSource[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [segments, setSegments] = useState<Segment[]>([]);
  const [prospectiveCustomers, setProspectiveCustomers] = useState<ProspectiveCustomer[]>([]);
  const [productTypes, setProductTypes] = useState<ProductType[]>([]);
  const [regions, setRegions] = useState<Region[]>([]);
  const [salesActivities, setSalesActivities] = useState<any[]>([]);
  const [selectedProductTypes, setSelectedProductTypes] = useState<string[]>([]);
  const [showProspectModal, setShowProspectModal] = useState(false);
  const [originalStage, setOriginalStage] = useState('');
  const [selectedCustomerId, setSelectedCustomerId] = useState(''); // State untuk customer ID yang dipilih dari dropdown
  const [selectedProspectId, setSelectedProspectId] = useState(''); // State untuk prospect ID yang dipilih di modal
  const [allPipelines, setAllPipelines] = useState<Pipeline[]>([]); // State untuk menyimpan semua data pipeline

  // Form state untuk pipeline
  const [formData, setFormData] = useState({
    tanggal: new Date(),
    customer: '',
    orderType: '', // New / Repeat Order
    stage: 'Lead',
    aktivitasSales: '',
    alamat: '',
    city: '', // Kota customer
    nomorTelepon: '',
    segmen: '',
    perkiraanJumlah: '0',
    estimasiHarga: '',
    picSales: '', // PIC Sales yang handle pipeline ini
    sumberLead: '', // Sumber Lead
    hasil: '',
    catatan: '',
  });

  // Form state untuk calon customer (modal)
  const [prospectForm, setProspectForm] = useState({
    customerName: '',
    phone: '',
    address: '',
    city: '',
    leadSource: '',
    salesPic: '',
    notes: '',
  });

  useEffect(() => {
    fetchCustomers();
    fetchLeadSources();
    fetchEmployees();
    fetchDepartments();
    fetchSegments();
    fetchProspectiveCustomers();
    fetchProductTypes();
    fetchRegions();
    fetchSalesActivities();
    fetchAllPipelines();
    if (isEdit && id) {
      fetchPipelineData(id);
    }
  }, [id, isEdit]);

  const fetchCustomers = async () => {
    try {
      const result = await api.getCustomers();
      setCustomers(result || []);
    } catch (error) {
      console.error('Error fetching customers:', error);
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

  const fetchEmployees = async () => {
    try {
      // Fetch all departments to get hierarchy
      const departments: Department[] = await api.getDepartments() || [];
      
      // Simpan departments untuk digunakan saat filter
      setDepartments(departments);

      // Find Sales department (case-insensitive search)
      const salesDept = departments.find(dept => 
        dept.name && dept.name.toLowerCase().includes('sales')
      );

      if (!salesDept) {
        console.warn('Sales department not found. Showing all employees.');
        // Jika department Sales tidak ditemukan, tampilkan semua employees
        const allEmployees: Employee[] = await api.getEmployees() || [];
        setEmployees(allEmployees);
        return;
      }

      // Get all department codes that are Sales or children of Sales (recursively)
      const getSalesDepartmentCodes = (deptCode: string, allDepts: Department[]): string[] => {
        const codes = [deptCode];
        // Find children by parentCode
        const children = allDepts.filter(d => d.parentCode === deptCode);
        children.forEach(child => {
          codes.push(...getSalesDepartmentCodes(child.code, allDepts));
        });
        return codes;
      };

      const salesDeptCodes = getSalesDepartmentCodes(salesDept.code, departments);

      console.log('Sales Department Found:', salesDept.name, salesDept.code);
      console.log('Sales Department Codes (including children):', salesDeptCodes);

      // Fetch all employees
      const allEmployees: Employee[] = await api.getEmployees() || [];

      // Filter only employees from Sales department and its children
      const salesEmployees = allEmployees
        .filter(emp => {
          // Check if employee has department_code and it's in salesDeptCodes
          const hasValidDept = emp.department_code && salesDeptCodes.includes(emp.department_code);
          return hasValidDept;
        })
        .map(emp => {
          const dept = departments.find(d => d.code === emp.department_code);
          return {
            ...emp,
            department_name: dept?.name || emp.department_code,
          };
        });

      console.log('Filtered Sales Employees:', salesEmployees.length);
      setEmployees(salesEmployees);
    } catch (error) {
      console.error('Error fetching employees:', error);
    }
  };

  const fetchDepartments = async () => {
    try {
      const result = await api.getDepartments();
      setDepartments(result || []);
    } catch (error) {
      console.error('Error fetching departments:', error);
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

  const fetchSalesActivities = async () => {
    try {
      const result = await api.getSalesActivities();
      setSalesActivities(result || []);
    } catch (error) {
      console.error('Error fetching sales activities:', error);
    }
  };

  const fetchAllPipelines = async () => {
    try {
      const result = await api.getPipelines();
      setAllPipelines(result || []);
    } catch (error) {
      console.error('Error fetching all pipelines:', error);
    }
  };

  const fetchProspectiveCustomers = async () => {
    try {
      const result = await api.getProspectiveCustomers();
      setProspectiveCustomers(result || []);
    } catch (error) {
      console.error('Error fetching prospective customers:', error);
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

  const fetchRegions = async () => {
    try {
      const result = await api.getRegions();
      setRegions(result || []);
    } catch (error) {
      console.error('Error fetching regions:', error);
    }
  };

  const fetchPipelineData = async (pipelineId: string) => {
    try {
      setLoading(true);
      const pipelines = await api.getPipelines();
      const result = pipelines.find((p: Pipeline) => p.id === pipelineId);

      if (result) {
        setFormData({
          tanggal: result.tanggal ? new Date(result.tanggal) : new Date(),
          customer: result.customer || '',
          orderType: result.orderType || '',
          stage: result.stage || 'Lead',
          aktivitasSales: result.aktivitasSales || '',
          alamat: result.alamat || '',
          city: result.city || '', // Kota customer
          nomorTelepon: result.nomorTelepon || '',
          segmen: result.segmen || '',
          perkiraanJumlah: result.perkiraanJumlah || '0',
          estimasiHarga: result.estimasiHarga || '',
          picSales: result.picSales || '', // PIC Sales yang handle pipeline ini
          sumberLead: result.sumberLead || '', // Sumber Lead
          hasil: result.hasil || '',
          catatan: result.catatan || '',
        });
        setSelectedProductTypes(result.productTypes || []);
        setOriginalStage(result.stage || 'Lead');
      }
    } catch (error) {
      console.error('Error fetching pipeline data:', error);
      toast.error('Gagal memuat data pipeline');
    } finally {
      setLoading(false);
    }
  };

  const handleCustomerChange = (customerId: string) => {
    const customer = customers.find(c => c.id === customerId);
    if (customer) {
      // Cari pipeline terakhir untuk customer ini
      const customerPipelines = allPipelines.filter(
        p => p.customer && p.customer.toUpperCase() === customer.customerName.toUpperCase()
      );

      // Sort by createdAt descending untuk mendapatkan yang paling baru
      const latestPipeline = customerPipelines.sort((a, b) => {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      })[0];

      // Auto-populate catatan dari pipeline terakhir jika ada
      const catatanFromPipeline = latestPipeline?.catatan || '';

      setFormData({
        ...formData,
        customer: customer.customerName.toUpperCase(),
        orderType: 'Repeat Order', // Auto-set ke Repeat Order karena dari database
        stage: 'Qualifikasi', // Auto-set ke Qualifikasi karena customer sudah terdaftar di database
        alamat: `${customer.billingAddress.fullAddress}, ${customer.billingAddress.city}, ${customer.billingAddress.province}`,
        city: customer.billingAddress.city || '', // Auto-fill kota dari customer
        nomorTelepon: customer.companyPhone || '',
        sumberLead: customer.leadSource || '', // Auto-fill sumber lead dari data customer
        catatan: catatanFromPipeline, // Auto-fill catatan dari pipeline terakhir
      });
      setSelectedCustomerId(customerId);

      if (catatanFromPipeline) {
        toast.success('Data customer dan catatan dari pipeline terakhir berhasil dimuat');
      } else {
        toast.success('Stage otomatis diset ke Qualifikasi karena customer sudah terdaftar');
      }
    }
  };

  // Handler untuk input manual - set stage ke Lead
  const handleManualInput = () => {
    setFormData({
      ...formData,
      stage: 'Lead', // Auto-set ke Lead karena customer baru (manual input)
      orderType: 'New'
    });
    toast.info('Stage otomatis diset ke Lead untuk customer baru');
  };

  const handleSaveProspect = async () => {
    if (!prospectForm.customerName || !prospectForm.phone) {
      toast.error('Nama customer dan nomor telepon wajib diisi');
      return;
    }

    if (!prospectForm.leadSource) {
      toast.error('Sumber Lead wajib diisi');
      return;
    }

    if (!prospectForm.salesPic) {
      toast.error('PIC Sales wajib diisi');
      return;
    }

    try {
      // Jika ada selectedProspectId, berarti user menggunakan existing prospect
      if (selectedProspectId) {
        // Langsung gunakan data yang sudah dipilih, tidak perlu save lagi
        toast.success('Menggunakan data calon customer yang dipilih');
      } else {
        // Jika tidak ada, berarti input baru - validasi dan simpan dulu

        // Normalize phone number
        const normalizedPhone = normalizePhoneNumber(prospectForm.phone);
        const normalizedData = {
          ...prospectForm,
          phone: normalizedPhone
        };

        // Check for duplicates di calon customer
        const allProspects = await api.getProspectiveCustomers();

        const duplicateName = allProspects.find(
          (prospect: any) =>
            prospect.customerName.toLowerCase() === normalizedData.customerName.toLowerCase()
        );

        if (duplicateName) {
          toast.error(`Nama "${normalizedData.customerName}" sudah terdaftar sebagai calon customer`);
          return;
        }

        const duplicatePhone = allProspects.find(
          (prospect: any) =>
            prospect.phone === normalizedData.phone
        );

        if (duplicatePhone) {
          toast.error(`Nomor telepon "${displayPhoneNumber(normalizedData.phone)}" sudah terdaftar sebagai calon customer`);
          return;
        }

        // Check juga di data customer (cross-validation)
        const allCustomers = await api.getCustomers();

        const existingCustomerByName = allCustomers.find(
          (customer: any) =>
            customer.customerName.toLowerCase() === normalizedData.customerName.toLowerCase()
        );

        if (existingCustomerByName) {
          toast.error(`Nama "${normalizedData.customerName}" sudah terdaftar sebagai customer. Tidak dapat menambahkan ke calon customer.`);
          return;
        }

        const existingCustomerByPhone = allCustomers.find(
          (customer: any) =>
            customer.companyPhone === normalizedData.phone && normalizedData.phone
        );

        if (existingCustomerByPhone) {
          toast.error(`Nomor telepon "${displayPhoneNumber(normalizedData.phone)}" sudah terdaftar sebagai customer. Tidak dapat menambahkan ke calon customer.`);
          return;
        }

        // Simpan calon customer dengan data yang sudah dinormalisasi
        await api.createProspectiveCustomer(normalizedData);
        toast.success('Calon customer baru berhasil ditambahkan');
      }

      // Auto-fill form pipeline dengan SEMUA data calon customer
      const fullAddress = prospectForm.address && prospectForm.city
        ? `${prospectForm.address}, ${prospectForm.city}`
        : prospectForm.address || prospectForm.city || '';

      setFormData({
        ...formData,
        customer: prospectForm.customerName,
        alamat: fullAddress, // Auto-fill alamat customer (address + city)
        city: prospectForm.city || '', // Auto-fill kota dari calon customer
        nomorTelepon: normalizePhoneNumber(prospectForm.phone), // Auto-fill nomor telepon (normalized)
        picSales: prospectForm.salesPic || formData.picSales, // Auto-fill PIC Sales
        sumberLead: prospectForm.leadSource || formData.sumberLead, // Auto-fill sumber lead
        catatan: prospectForm.notes || formData.catatan, // Auto-fill catatan
        orderType: 'New', // Auto-set ke New karena dari calon customer
        stage: 'Lead', // Auto-set ke Lead karena customer baru dari calon customer
      });
      setSelectedCustomerId(''); // Reset selected customer ID

      // Reset modal form
      setProspectForm({
        customerName: '',
        phone: '',
        address: '',
        city: '',
        leadSource: '',
        salesPic: '',
        notes: '',
      });
      setSelectedProspectId(''); // Reset selected prospect ID

      setShowProspectModal(false);

      // Notifikasi sukses dengan detail field yang ter-auto-fill
      toast.success('Data calon customer berhasil digunakan untuk pipeline', {
        description: 'Nama, alamat, telepon, PIC Sales, dan catatan telah terisi otomatis'
      });
    } catch (error) {
      console.error('Error saving prospective customer:', error);
      toast.error('Gagal menyimpan calon customer');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Trim whitespace dari customer dan stage
    const trimmedCustomer = formData.customer?.trim();
    const trimmedStage = formData.stage?.trim();

    if (!trimmedCustomer || !trimmedStage) {
      toast.error('Customer dan Stage wajib diisi');
      return;
    }

    if (!formData.sumberLead) {
      toast.error('Sumber Lead wajib diisi');
      return;
    }

    try {
      setLoading(true);
      
      // Jika customer diinput manual, set orderType ke 'New'
      let finalOrderType = formData.orderType;
      if (!selectedCustomerId && trimmedCustomer && !finalOrderType) {
        finalOrderType = 'New';
      }

      const payload = {
        ...formData,
        tanggal: formData.tanggal instanceof Date ? formData.tanggal.toISOString().split('T')[0] : formData.tanggal,
        customer: trimmedCustomer,
        stage: trimmedStage,
        orderType: finalOrderType,
        nomorTelepon: normalizePhoneNumber(formData.nomorTelepon), // Normalize phone number
        productTypes: selectedProductTypes,
        createdAt: new Date().toISOString(),
      };

      if (isEdit && id) {
        // Get original data untuk comparison
        const pipelines = await api.getPipelines();
        const originalData = pipelines.find((p: Pipeline) => p.id === id);

        // Update pipeline
        await api.update(id, payload);

        // Create log histori untuk perubahan
        if (originalData) {
          const changes: string[] = [];

          // Cek setiap field yang berubah
          if (originalData.customer !== trimmedCustomer) {
            changes.push(`Nama Customer: "${originalData.customer}" → "${trimmedCustomer}"`);
          }
          if (originalData.orderType !== finalOrderType) {
            changes.push(`Jenis Customer: "${originalData.orderType}" → "${finalOrderType}"`);
          }
          if (originalData.stage !== trimmedStage) {
            changes.push(`Stage: "${originalData.stage}" → "${trimmedStage}"`);
          }
          if (originalData.aktivitasSales !== formData.aktivitasSales) {
            changes.push(`Aktivitas Sales: "${originalData.aktivitasSales || '-'}" → "${formData.aktivitasSales || '-'}"`);
          }
          if (originalData.alamat !== formData.alamat) {
            changes.push(`Alamat: "${originalData.alamat || '-'}" → "${formData.alamat || '-'}"`);
          }
          if (originalData.nomorTelepon !== formData.nomorTelepon) {
            changes.push(`Nomor Telepon: "${originalData.nomorTelepon || '-'}" → "${formData.nomorTelepon || '-'}"`);
          }
          if (originalData.segmen !== formData.segmen) {
            changes.push(`Segmen: "${originalData.segmen || '-'}" → "${formData.segmen || '-'}"`);
          }
          if (originalData.perkiraanJumlah !== formData.perkiraanJumlah) {
            changes.push(`Estimasi Nilai: "${originalData.perkiraanJumlah || '-'}" → "${formData.perkiraanJumlah || '-'}"`);
          }
          if (originalData.estimasiHarga !== formData.estimasiHarga) {
            changes.push(`Estimasi Harga: "${originalData.estimasiHarga || '-'}" → "${formData.estimasiHarga || '-'}"`);
          }
          if (originalData.picSales !== formData.picSales) {
            changes.push(`PIC Sales: "${originalData.picSales || '-'}" → "${formData.picSales || '-'}"`);
          }
          if (originalData.sumberLead !== formData.sumberLead) {
            changes.push(`Sumber Lead: "${originalData.sumberLead || '-'}" → "${formData.sumberLead || '-'}"`);
          }
          if (JSON.stringify(originalData.productTypes || []) !== JSON.stringify(selectedProductTypes)) {
            changes.push(`Jenis Produk diperbarui`);
          }
          if (originalData.catatan !== formData.catatan) {
            changes.push(`Catatan diperbarui`);
          }

          // Jika ada perubahan, create log
          if (changes.length > 0) {
            await api.createPipelineLog({
              pipelineId: id,
              action: 'Update',
              changes: changes,
              changedBy: formData.picSales || 'Admin',
              description: `Pipeline diperbarui dengan ${changes.length} perubahan`,
            });
          }
        }
        
        toast.success('Pipeline berhasil diperbarui');
      } else {
        // Validasi: Cek apakah sudah ada pipeline dengan customer + picSales yang sama
        const duplicatePipeline = allPipelines.find(p =>
          p.customer && p.customer.toLowerCase().trim() === trimmedCustomer.toLowerCase() &&
          p.picSales === formData.picSales
        );

        if (duplicatePipeline) {
          toast.error('Pipeline sudah ada!', {
            description: `Customer "${trimmedCustomer}" dengan PIC Sales "${formData.picSales}" sudah memiliki pipeline aktif. Silakan gunakan PIC Sales yang berbeda atau edit pipeline yang sudah ada.`
          });
          setLoading(false);
          return;
        }

        const result = await api.createPipeline(payload);

        // Create log histori untuk pipeline baru
        if (result.id) {
          await api.createPipelineLog({
            pipelineId: result.id,
            action: 'Create',
            changes: ['Pipeline baru dibuat'],
            changedBy: formData.picSales || 'Admin',
            description: `Pipeline baru untuk customer "${trimmedCustomer}" dengan stage "${trimmedStage}"`,
          });
        }

        toast.success('Pipeline berhasil ditambahkan');
      }

      navigate('/sales/pipeline');
    } catch (error) {
      console.error('Error saving pipeline:', error);
      toast.error('Gagal menyimpan pipeline');
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
    <div className="space-y-1 pb-4">
      <PageHeader
        title={isEdit ? 'Edit Pipeline' : 'Tambah Pipeline'}
        description={isEdit ? 'Perbarui data pipeline' : 'Tambahkan pipeline baru ke sistem'}
        breadcrumbs={[
          { label: 'Dashboard', href: '/' },
          { label: 'Sales' },
          { label: 'Pipeline', href: '/sales/pipeline' },
          { label: isEdit ? 'Edit' : 'Tambah' },
        ]}
        actions={
          <Button variant="outline" onClick={() => navigate('/sales/pipeline')}>
            <ChevronLeft className="w-4 h-4 mr-2" />
            Kembali
          </Button>
        }
      />

      <Card className="p-6">
        <form onSubmit={handleSubmit} className="space-y-1">
          {/* Customer Selection with Add Button */}
          <div className="space-y-1">
            <h3 className="font-semibold text-base border-b pb-2">Informasi Customer</h3>
            <div className="space-y-1">
              {/* Tanggal | Isian Tanggal | Tipe Order | Isian Tipe Order */}
              <div className="grid grid-cols-[120px_1fr_120px_1fr] items-center gap-1">
                <Label htmlFor="tanggal">Tanggal *</Label>
                <DatePicker
                  value={formData.tanggal instanceof Date ? formData.tanggal : new Date(formData.tanggal)}
                  onChange={(date) => setFormData({ ...formData, tanggal: date || new Date() })}
                  placeholder="Pilih tanggal"
                  className="w-full"
                />
                <Label htmlFor="orderType">Tipe Order</Label>
                <Input
                  id="orderType"
                  value={formData.orderType}
                  disabled
                  className="bg-muted cursor-not-allowed"
                  placeholder="Otomatis terisi"
                />
              </div>

              {/* Nama Customer | Isian Nama Customer | + */}
              <div className="grid grid-cols-[120px_1fr_auto] items-start gap-1">
                <Label htmlFor="customer" className="pt-2">Nama Customer *</Label>
                <div className="space-y-1">
                  {/* Tampilkan dropdown hanya jika belum ada input manual */}
                  {!formData.customer ? (
                    <Select
                      value={selectedCustomerId}
                      onValueChange={(value) => {
                        if (value === '_manual_') {
                          // User pilih input manual, set stage ke Lead
                          setSelectedCustomerId('');
                          handleManualInput();
                        } else {
                          handleCustomerChange(value);
                        }
                      }}
                    >
                      <SelectTrigger className="flex-1">
                        <SelectValue placeholder="Pilih customer dari database" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem key="customer-manual" value="_manual_">⌨️ Input Manual (Stage: Lead)</SelectItem>
                        {customers.filter(c => c.id && typeof c.id === 'string' && c.id.trim() !== '').map((customer) => (
                          <SelectItem key={customer.id} value={customer.id}>
                            {customer.customerName} ({customer.customerCategory})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    /* Tampilkan input dengan tombol X ketika ada customer terisi */
                    <div className="relative">
                      <Input
                        value={formData.customer}
                        onChange={(e) => setFormData({ ...formData, customer: e.target.value.toUpperCase() })}
                        placeholder="Nama customer"
                        className="pr-10"
                        style={{ textTransform: 'uppercase' }}
                      />
                      {!selectedCustomerId && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 p-0 hover:bg-transparent"
                          onClick={() => {
                            setFormData({ ...formData, customer: '', orderType: '' });
                            setSelectedCustomerId('');
                          }}
                          title="Hapus dan kembali ke dropdown"
                        >
                          <X className="w-4 h-4 text-muted-foreground hover:text-foreground" />
                        </Button>
                      )}
                    </div>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Pilih dari database, ketik manual, atau klik + untuk menambah calon customer dengan data lengkap
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => setShowProspectModal(true)}
                  title="Tambah Calon Customer Baru"
                  className="mt-0"
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>

              {/* Alamat Customer | Isian Alamat Customer */}
              <div className="grid grid-cols-[120px_1fr] items-start gap-1">
                <Label htmlFor="alamat" className="pt-2">Alamat Customer</Label>
                <Textarea
                  id="alamat"
                  value={formData.alamat}
                  onChange={(e) => setFormData({ ...formData, alamat: e.target.value.toUpperCase() })}
                  placeholder="Alamat lengkap customer"
                  rows={2}
                />
              </div>

              {/* Kota | Isian Kota | Nomor Telepon | Isian Nomor Telepon */}
              <div className="grid grid-cols-[120px_1fr_120px_1fr] items-center gap-1">
                <Label htmlFor="city">Kota</Label>
                <CityCombobox
                  value={formData.city}
                  onValueChange={(value) => setFormData({ ...formData, city: value })}
                  regions={regions}
                  placeholder="Cari kota..."
                />
                <Label>Nomor Telepon</Label>
                <PhoneInput
                  value={formData.nomorTelepon}
                  onChange={(value) => setFormData({ ...formData, nomorTelepon: value })}
                  showCountrySelector={true}
                />
              </div>
            </div>
          </div>

          {/* Pipeline Details */}
          <div className="space-y-1">
            <h3 className="font-semibold text-base border-b pb-2">Detail Pipeline</h3>
            <div className="space-y-1">
              {/* Stage Pipeline | Isian Stage Pipeline | Sumber Lead | Isian Sumber Lead */}
              <div className="grid grid-cols-[120px_1fr_120px_1fr] items-center gap-1">
                <Label htmlFor="stage">Stage Pipeline *</Label>
                <div className="px-3 py-2 border rounded-md bg-muted/30">
                  <span className="text-sm font-medium">{formData.stage}</span>
                </div>
                <Label htmlFor="sumberLead">Sumber Lead *</Label>
                <Select
                  value={formData.sumberLead}
                  onValueChange={(value) => setFormData({ ...formData, sumberLead: value })}
                  required
                >
                  <SelectTrigger id="sumberLead">
                    <SelectValue placeholder="Pilih sumber lead" />
                  </SelectTrigger>
                  <SelectContent>
                    {leadSources.filter(s => s.name && typeof s.name === 'string' && s.name.trim() !== '').map((source) => (
                      <SelectItem key={source.id} value={source.name}>
                        {source.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* PIC Sales | Isian PIC Sales | Aktivitas Sales | Isian Aktivitas Sales */}
              <div className="grid grid-cols-[120px_1fr_120px_1fr] items-center gap-1">
                <Label htmlFor="picSales">PIC Sales</Label>
                <Select
                  value={formData.picSales}
                  onValueChange={(value) => setFormData({ ...formData, picSales: value })}
                >
                  <SelectTrigger id="picSales">
                    <SelectValue placeholder="Pilih PIC Sales" />
                  </SelectTrigger>
                  <SelectContent>
                    {employees.filter(e => e.username && typeof e.username === 'string' && e.username.trim() !== '').map((employee) => (
                      <SelectItem key={employee.id} value={employee.username}>
                        {employee.username} - {employee.full_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Label htmlFor="aktivitasSales">Aktivitas Sales</Label>
                <Select
                  value={formData.aktivitasSales}
                  onValueChange={(value) => setFormData({ ...formData, aktivitasSales: value })}
                >
                  <SelectTrigger id="aktivitasSales">
                    <SelectValue placeholder="Pilih aktivitas" />
                  </SelectTrigger>
                  <SelectContent>
                    {salesActivities.filter(a => a.name && typeof a.name === 'string' && a.name.trim() !== '').map((activity) => (
                      <SelectItem key={activity.id} value={activity.name}>
                        {activity.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Segmen | Isian Segmen | Perkiraan Jumlah | Isian Perkiraan Jumlah */}
              <div className="grid grid-cols-[120px_1fr_120px_1fr] items-center gap-1">
                <Label htmlFor="segmen">Segmen</Label>
                <Select
                  value={formData.segmen}
                  onValueChange={(value) => setFormData({ ...formData, segmen: value })}
                >
                  <SelectTrigger id="segmen">
                    <SelectValue placeholder="Pilih segmen" />
                  </SelectTrigger>
                  <SelectContent>
                    {segments.filter(s => s.name && typeof s.name === 'string' && s.name.trim() !== '').map((segment) => (
                      <SelectItem key={segment.id} value={segment.name}>
                        {segment.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Label htmlFor="perkiraanJumlah">Perkiraan Jumlah</Label>
                <Select
                  value={formData.perkiraanJumlah}
                  onValueChange={(value) => setFormData({ ...formData, perkiraanJumlah: value })}
                >
                  <SelectTrigger id="perkiraanJumlah">
                    <SelectValue placeholder="Pilih range jumlah" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem key="range-1" value="<50">&lt;50</SelectItem>
                    <SelectItem key="range-2" value="50-100">50-100</SelectItem>
                    <SelectItem key="range-3" value="100-250">100-250</SelectItem>
                    <SelectItem key="range-4" value="250-500">250-500</SelectItem>
                    <SelectItem key="range-5" value="500-1000">500-1000</SelectItem>
                    <SelectItem key="range-6" value="1000-5000">1000-5000</SelectItem>
                    <SelectItem key="range-7" value="5000-10000">5000-10000</SelectItem>
                    <SelectItem key="range-8" value=">10000">&gt;10000</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Jenis Produk | Isian Produk | Estimasi Harga | Isian Estimasi Harga */}
              <div className="grid grid-cols-[120px_1fr_120px_1fr] items-start gap-1">
                <Label className="pt-2">Jenis Produk</Label>
                <div className="space-y-1">
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
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih jenis produk untuk ditambahkan" />
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
                    <div className="border rounded-lg p-0 m-0 bg-muted/30">
                      <div className="flex flex-wrap gap-0 m-0">
                        {selectedProductTypes.map((typeId) => {
                          const productType = productTypes.find(pt => pt.id === typeId);
                          if (!productType) return null;
                          return (
                            <Badge
                              key={typeId}
                              variant="secondary"
                              className="bg-blue-100 text-blue-700 hover:bg-blue-200 p-0 m-0 text-xs"
                            >
                              <span className="p-0 m-0">{productType.name}</span>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="h-auto w-auto p-0 m-0 hover:bg-transparent"
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
                    <div className="border border-dashed rounded-lg p-2 bg-muted/5">
                      <p className="text-xs text-muted-foreground/50 text-center">
                        {productTypes.length === 0 ? '-' : '-'}
                      </p>
                    </div>
                  )}
                </div>
                <Label htmlFor="estimasiHarga" className="pt-2">Estimasi Harga</Label>
                <Input
                  id="estimasiHarga"
                  value={formData.estimasiHarga}
                  onChange={(e) => setFormData({ ...formData, estimasiHarga: e.target.value })}
                  placeholder="Estimasi harga total"
                />
              </div>

              {/* Hasil | Isian Hasil */}
              <div className="grid grid-cols-[120px_1fr] items-center gap-1">
                <Label htmlFor="hasil">Hasil</Label>
                <Input
                  id="hasil"
                  value={formData.hasil}
                  onChange={(e) => setFormData({ ...formData, hasil: e.target.value })}
                  placeholder="Hasil negosiasi atau penutupan"
                />
              </div>

              {/* Catatan | Isian Catatan */}
              <div className="grid grid-cols-[120px_1fr] items-start gap-1">
                <Label htmlFor="catatan" className="pt-2">Catatan</Label>
                <Textarea
                  id="catatan"
                  value={formData.catatan}
                  onChange={(e) => setFormData({ ...formData, catatan: e.target.value })}
                  placeholder="Catatan tambahan tentang pipeline ini"
                  rows={3}
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-1 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate('/sales/pipeline')}
            >
              Batal
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Menyimpan...' : (isEdit ? 'Perbarui' : 'Simpan')}
            </Button>
          </div>
        </form>
      </Card>

      {/* Modal Tambah Calon Customer */}
      <Dialog open={showProspectModal} onOpenChange={setShowProspectModal}>
        <DialogContent className="w-[95vw] md:w-[70vw] max-w-[95vw] md:max-w-[70vw]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-1">
              <UserPlus className="w-5 h-5" />
              Tambah Calon Customer
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-1 py-4">
            {/* Pilihan: Pilih dari existing atau input baru */}
            <div className="border rounded-lg p-4 bg-blue-50/50 space-y-1">
              <Label htmlFor="selectProspect">Ambil dari Calon Customer yang Sudah Ada</Label>
              <Select
                value={selectedProspectId}
                onValueChange={(value) => {
                  if (value === '_new_') {
                    // Reset form untuk input baru
                    setSelectedProspectId('');
                    setProspectForm({
                      customerName: '',
                      phone: '',
                      address: '',
                      city: '',
                      leadSource: '',
                      salesPic: '',
                      notes: '',
                    });
                  } else {
                    // Auto-fill dari prospective customer
                    setSelectedProspectId(value);
                    const prospect = prospectiveCustomers.find(p => p.id === value);
                    if (prospect) {
                      setProspectForm({
                        customerName: (prospect.customerName || '').toUpperCase(),
                        phone: prospect.phone || '',
                        address: prospect.address || '',
                        city: prospect.city || '',
                        leadSource: prospect.leadSource || '',
                        salesPic: prospect.salesPic || '',
                        notes: prospect.notes || '',
                      });
                      toast.success('Data calon customer berhasil dimuat');
                    }
                  }
                }}
              >
                <SelectTrigger id="selectProspect">
                  <SelectValue placeholder="Pilih calon customer atau buat baru" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="_new_">✏️ Buat Baru (Input Manual)</SelectItem>
                  {prospectiveCustomers.filter(p => p.id && typeof p.id === 'string' && p.id.trim() !== '').map((prospect) => (
                    <SelectItem key={prospect.id} value={prospect.id}>
                      {prospect.customerName} - {prospect.phone}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                {selectedProspectId
                  ? '✅ Data calon customer terpilih. Klik "Simpan & Gunakan" untuk menggunakan.'
                  : '💡 Pilih calon customer yang sudah ada atau buat baru dengan input manual'
                }
              </p>
            </div>

            <div className="space-y-1">
              {/* Nama | Isian | Sumber Lead | Isian */}
              <div className="grid grid-cols-[120px_1fr_120px_1fr] items-center gap-1">
                <Label htmlFor="prospectName">Nama Customer *</Label>
                <Input
                  id="prospectName"
                  value={prospectForm.customerName}
                  onChange={(e) => setProspectForm({ ...prospectForm, customerName: e.target.value.toUpperCase() })}
                  placeholder="Nama perusahaan atau individu"
                  disabled={!!selectedProspectId}
                  className={selectedProspectId ? 'bg-muted' : ''}
                  style={{ textTransform: 'uppercase' }}
                />
                <Label htmlFor="prospectLeadSource">Sumber Lead *</Label>
                <Select
                  value={prospectForm.leadSource}
                  onValueChange={(value) => setProspectForm({ ...prospectForm, leadSource: value })}
                  disabled={!!selectedProspectId}
                  required
                >
                  <SelectTrigger id="prospectLeadSource" className={selectedProspectId ? 'bg-muted' : ''}>
                    <SelectValue placeholder="Pilih sumber lead" />
                  </SelectTrigger>
                  <SelectContent>
                    {leadSources.filter(s => s.name && typeof s.name === 'string' && s.name.trim() !== '').map((source) => (
                      <SelectItem key={source.id} value={source.name}>
                        {source.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Nomor Telepon | Isian | PIC Sales | Isian */}
              <div className="grid grid-cols-[120px_1fr_120px_1fr] items-center gap-1">
                <Label>No. Telepon *</Label>
                <PhoneInput
                  value={prospectForm.phone}
                  onChange={(value) => setProspectForm({ ...prospectForm, phone: value })}
                  required
                  showCountrySelector={true}
                  disabled={!!selectedProspectId}
                />
                <Label htmlFor="prospectSalesPic">PIC Sales *</Label>
                <Select
                  value={prospectForm.salesPic}
                  onValueChange={(value) => setProspectForm({ ...prospectForm, salesPic: value })}
                  disabled={!!selectedProspectId}
                  required
                >
                  <SelectTrigger id="prospectSalesPic" className={selectedProspectId ? 'bg-muted' : ''}>
                    <SelectValue placeholder="Pilih PIC Sales" />
                  </SelectTrigger>
                  <SelectContent>
                    {employees.filter(e => e.username && typeof e.username === 'string' && e.username.trim() !== '').map((employee) => (
                      <SelectItem key={employee.id} value={employee.username}>
                        {employee.username} - {employee.full_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Alamat | Isian | Kota | Isian */}
              <div className="grid grid-cols-[120px_1fr_120px_1fr] items-center gap-1">
                <Label htmlFor="prospectAddress">Alamat</Label>
                <Input
                  id="prospectAddress"
                  value={prospectForm.address}
                  onChange={(e) => setProspectForm({ ...prospectForm, address: e.target.value.toUpperCase() })}
                  placeholder="Alamat lengkap"
                  disabled={!!selectedProspectId}
                  className={selectedProspectId ? 'bg-muted' : ''}
                />
                <Label htmlFor="prospectCity">Kota</Label>
                <CityCombobox
                  value={prospectForm.city}
                  onValueChange={(value) => setProspectForm({ ...prospectForm, city: value })}
                  regions={regions}
                  placeholder="Cari kota..."
                  disabled={!!selectedProspectId}
                />
              </div>

              {/* Catatan | Isian */}
              <div className="grid grid-cols-[120px_1fr] items-start gap-1">
                <Label htmlFor="prospectNotes" className="pt-2">Catatan</Label>
                <Textarea
                  id="prospectNotes"
                  value={prospectForm.notes}
                  onChange={(e) => setProspectForm({ ...prospectForm, notes: e.target.value })}
                  placeholder="Catatan tentang calon customer"
                  rows={3}
                  disabled={!!selectedProspectId}
                  className={selectedProspectId ? 'bg-muted' : ''}
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-1 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setShowProspectModal(false);
                setProspectForm({
                  customerName: '',
                  phone: '',
                  address: '',
                  city: '',
                  leadSource: '',
                  salesPic: '',
                  notes: '',
                });
              }}
            >
              Batal
            </Button>
            <Button type="button" onClick={handleSaveProspect}>
              Simpan & Gunakan
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}