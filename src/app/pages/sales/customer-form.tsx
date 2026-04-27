import { useState, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router';
import { ChevronLeft, UserPlus, Trash2 } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Checkbox } from '../../components/ui/checkbox';
import { PageHeader } from '../../components/page-header';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { Card } from '../../components/ui/card';
import { PhoneInput } from '../../components/ui/phone-input';
import { CityCombobox } from '../../components/ui/city-combobox';
import { toast } from 'sonner';
import { api } from '../../lib/api';
import { normalizePhoneNumber } from '../../lib/phone-utils';

interface Contact {
  pic: string;
  position: string;  // Jabatan
  phone: string;
}

interface Address {
  label: string;
  fullAddress: string;
  district: string;
  city: string;
  province: string;
  country: string;
  postalCode: string;
}

interface Customer {
  id: string;
  customerCategory: string;
  customerName: string;
  industryCategory: string;
  leadSource: string;
  holding: string;
  companyPhone: string; // Nomor Telepon Perusahaan
  contacts: Contact[];
  billingAddress: Address;
  shippingAddress: Address;
  nikNumber: string;
  nikAddress: string;
  npwpNumber: string;
  npwpAddress: string;
  nitkuNumber: string;
  nitkuAddress: string;
  // Tax Information
  taxIncluded: boolean; // Checklist: Total faktur sudah termasuk pajak
  taxIdType: string; // NIK / NPWP
  taxNumber: string; // Nomor Wajib Pajak
  taxName: string; // Nama Wajib Pajak
  idTku: string; // ID TKU
  countryCode: string; // Kode Negara (default: IDN)
  transactionType: string; // Faktur Pajak, Digabungkan, Dokumen Tertentu, Ekspor
  transactionDetail: string; // Detail transaksi
  nppkp: string; // NPPKP
  taxAddress: string; // Alamat Pajak
  sameAsBillingAddress: boolean; // Checklist: sama dengan alamat penagihan
  createdAt: string;
}

interface LeadSource {
  id: string;
  name: string;
}

interface Region {
  id: string;
  kecamatan: string;
  kotaKabupaten: string;
  provinsi: string;
  negara: string;
  createdAt: string;
}

interface ProspectiveCustomer {
  id: string;
  customerName: string;
  phone: string;
  address: string;
  city: string;
  leadSource: string;
  salesPic: string;
  activityType: string;
  notes: string;
  createdAt: string;
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
  picSales: string;
  sumberLead: string;
  hasil: string;
  catatan: string;
  createdAt: string;
}

export function CustomerForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const isEdit = !!id;

  const [loading, setLoading] = useState(false);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [leadSources, setLeadSources] = useState<LeadSource[]>([]);
  const [regions, setRegions] = useState<Region[]>([]);
  const [prospectiveCustomers, setProspectiveCustomers] = useState<ProspectiveCustomer[]>([]);
  const [pipelines, setPipelines] = useState<Pipeline[]>([]);
  const [activeTab, setActiveTab] = useState('info');
  const [inputMode, setInputMode] = useState<'manual' | 'prospective' | 'pipeline'>('manual');
  const [selectedProspective, setSelectedProspective] = useState<string>('');
  const [selectedPipeline, setSelectedPipeline] = useState<string>('');

  const [formData, setFormData] = useState({
    customerCategory: 'Perusahaan',
    customerName: '',
    industryCategory: '',
    leadSource: '',
    holding: '',
    companyPhone: '',
    contacts: [{ pic: '', position: '', phone: '' }] as Contact[],
    billingAddress: {
      label: '',
      fullAddress: '',
      district: '',
      city: '',
      province: '',
      country: '',
      postalCode: '',
    } as Address,
    shippingAddress: {
      label: '',
      fullAddress: '',
      district: '',
      city: '',
      province: '',
      country: '',
      postalCode: '',
    } as Address,
    nikNumber: '',
    nikAddress: '',
    npwpNumber: '',
    npwpAddress: '',
    nitkuNumber: '',
    nitkuAddress: '',
    // Tax Information
    taxIncluded: false, // Checklist: Total faktur sudah termasuk pajak
    taxIdType: '', // NIK / NPWP
    taxNumber: '', // Nomor Wajib Pajak
    taxName: '', // Nama Wajib Pajak
    idTku: '', // ID TKU
    countryCode: 'IDN', // Kode Negara (default: IDN)
    transactionType: '', // Faktur Pajak, Digabungkan, Dokumen Tertentu, Ekspor
    transactionDetail: '', // Detail transaksi
    nppkp: '', // NPPKP
    taxAddress: '', // Alamat Pajak
    sameAsBillingAddress: true, // Checklist: sama dengan alamat penagihan
    prospectiveCustomerId: '', // Link ke calon customer
  });

  useEffect(() => {
    fetchCustomers();
    fetchLeadSources();
    fetchRegions();
    fetchProspectiveCustomers();
    fetchPipelines();
    if (isEdit && id) {
      fetchCustomerData(id);
    }
  }, [id, isEdit]);

  // Handle query params untuk auto-fill dari calon customer atau pipeline
  useEffect(() => {
    const from = searchParams.get('from');
    const sourceId = searchParams.get('id');

    if (from === 'prospective' && sourceId && prospectiveCustomers.length > 0) {
      // Set mode ke prospective
      setInputMode('prospective');
      setSelectedProspective(sourceId);

      // Auto-fill data dari calon customer
      const prospect = prospectiveCustomers.find(p => p.id === sourceId);
      if (prospect) {
        // Map semua field yang relevan dari calon customer ke customer
        setFormData({
          ...formData,
          // Basic info
          customerName: prospect.customerName || '',
          leadSource: prospect.leadSource || '',
          companyPhone: prospect.phone || '', // Nomor telepon perusahaan dari calon customer
          prospectiveCustomerId: sourceId,

          // Contact info - gunakan phone dari calon customer sebagai kontak pertama
          contacts: [
            {
              pic: '',  // PIC kosong, akan diisi manual oleh user
              position: '',  // Position kosong, akan diisi manual oleh user
              phone: prospect.phone || '',   // Phone dari calon customer
            }
          ],

          // Billing address - gunakan address dan city dari calon customer
          billingAddress: {
            ...formData.billingAddress,
            fullAddress: prospect.address || '',
            city: prospect.city || '',
            label: 'Alamat Utama',  // Default label
          },
        });

        toast.success(
          `✅ Data dari calon customer "${prospect.customerName}" berhasil dimuat!\n` +
          `📋 Silakan lengkapi informasi tambahan yang diperlukan.`
        );
      }
    } else if (from === 'pipeline' && sourceId && pipelines.length > 0) {
      // Set mode ke pipeline
      setInputMode('pipeline');
      setSelectedPipeline(sourceId);

      // Auto-fill data dari pipeline
      const pipeline = pipelines.find(p => p.id === sourceId);
      if (pipeline) {
        setFormData({
          ...formData,
          // Basic info
          customerName: pipeline.customer || '',
          leadSource: pipeline.sumberLead || '',
          customerCategory: pipeline.orderType === 'New' ? 'Perorangan' : 'Perusahaan',
          companyPhone: pipeline.nomorTelepon || '', // Nomor telepon perusahaan dari pipeline

          // Contact info - gunakan nomor telepon dari pipeline sebagai kontak pertama
          contacts: [
            {
              pic: '',  // PIC kosong, akan diisi manual oleh user
              position: '',  // Position kosong, akan diisi manual oleh user
              phone: pipeline.nomorTelepon || '',   // Phone dari pipeline
            }
          ],

          // Billing address - gunakan alamat dari pipeline
          billingAddress: {
            ...formData.billingAddress,
            fullAddress: pipeline.alamat || '',
            city: pipeline.city || '', // Kota dari pipeline
            label: 'Alamat Utama',
          },
        });

        toast.success(
          `✅ Data dari pipeline "${pipeline.customer}" berhasil dimuat!\n` +
          `📋 Silakan lengkapi informasi customer yang diperlukan.`
        );
      }
    }
  }, [searchParams, prospectiveCustomers, pipelines]);

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

  const fetchRegions = async () => {
    try {
      const result = await api.getRegions();
      setRegions(result || []);
    } catch (error) {
      console.error('Error fetching regions:', error);
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

  const fetchPipelines = async () => {
    try {
      const result = await api.getPipelines();
      setPipelines(result || []);
    } catch (error) {
      console.error('Error fetching pipelines:', error);
    }
  };

  const fetchCustomerData = async (customerId: string) => {
    try {
      setLoading(true);
      const customers = await api.getCustomers();
      const result = customers.find((c: Customer) => c.id === customerId);
      
      if (result) {
        setFormData({
          customerCategory: result.customerCategory || '',
          customerName: result.customerName || '',
          industryCategory: result.industryCategory || '',
          leadSource: result.leadSource || '',
          holding: result.holding || '',
          companyPhone: result.companyPhone || '',
          contacts: result.contacts && result.contacts.length > 0 ? result.contacts : [{ pic: '', position: '', phone: '' }],
          billingAddress: result.billingAddress || {
            label: '',
            fullAddress: '',
            district: '',
            city: '',
            province: '',
            country: '',
            postalCode: '',
          },
          shippingAddress: result.shippingAddress || {
            label: '',
            fullAddress: '',
            district: '',
            city: '',
            province: '',
            country: '',
            postalCode: '',
          },
          nikNumber: result.nikNumber || '',
          nikAddress: result.nikAddress || '',
          npwpNumber: result.npwpNumber || '',
          npwpAddress: result.npwpAddress || '',
          nitkuNumber: result.nitkuNumber || '',
          nitkuAddress: result.nitkuAddress || '',
          // Tax Information
          taxIncluded: result.taxIncluded || false,
          taxIdType: result.taxIdType || '',
          taxNumber: result.taxNumber || '',
          taxName: result.taxName || '',
          idTku: result.idTku || '',
          countryCode: result.countryCode || 'IDN',
          transactionType: result.transactionType || '',
          transactionDetail: result.transactionDetail || '',
          nppkp: result.nppkp || '',
          taxAddress: result.taxAddress || '',
          sameAsBillingAddress: result.sameAsBillingAddress || true,
          prospectiveCustomerId: result.prospectiveCustomerId || '',
        });
      }
    } catch (error) {
      console.error('Error fetching customer data:', error);
      toast.error('Gagal memuat data customer');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validasi
    if (!formData.customerCategory || !formData.customerName) {
      toast.error('Kategori Customer dan Nama Customer wajib diisi');
      return;
    }

    if (!formData.leadSource) {
      toast.error('Sumber Lead wajib diisi');
      return;
    }

    try {
      setLoading(true);

      // Normalize phone numbers before saving
      const normalizedContacts = formData.contacts.map(contact => ({
        ...contact,
        phone: normalizePhoneNumber(contact.phone)
      }));

      const payload = {
        ...formData,
        companyPhone: normalizePhoneNumber(formData.companyPhone),
        contacts: normalizedContacts,
        createdAt: new Date().toISOString(),
      };

      // Check for duplicates (nama dan nomor telepon harus unik)
      const allCustomers = await api.getCustomers();

      const duplicateName = allCustomers.find(
        (customer: any) =>
          customer.customerName.toLowerCase() === payload.customerName.toLowerCase() &&
          (!isEdit || customer.id !== id) // Skip check untuk record yang sedang di-edit
      );

      if (duplicateName) {
        toast.error(`Nama customer "${payload.customerName}" sudah terdaftar`);
        setLoading(false);
        return;
      }

      const duplicatePhone = allCustomers.find(
        (customer: any) =>
          customer.companyPhone === payload.companyPhone &&
          payload.companyPhone && // Only check if phone is not empty
          (!isEdit || customer.id !== id) // Skip check untuk record yang sedang di-edit
      );

      if (duplicatePhone) {
        toast.error(`Nomor telepon perusahaan "${payload.companyPhone}" sudah terdaftar`);
        setLoading(false);
        return;
      }

      let newCustomer;
      if (isEdit && id) {
        await api.updateCustomer(id, payload);
        newCustomer = { id, ...payload };

        // Auto-sync: Update semua pipeline yang terhubung dengan customer ini
        try {
          console.log('🔄 Auto-sync customer ke pipeline terkait...', { customerId: id });
          const syncResult = await api.syncCustomerToPipelines(id, payload);
          if (syncResult.syncedCount > 0) {
            toast.success(`Customer dan ${syncResult.syncedCount} pipeline terkait berhasil diperbarui`);
          } else {
            toast.success('Customer berhasil diperbarui');
          }
        } catch (error) {
          console.error('Error syncing to pipelines:', error);
          toast.success('Customer berhasil diperbarui');
        }
      } else {
        newCustomer = await api.createCustomer(payload);
        toast.success('Customer berhasil ditambahkan');
      }

      // Jika customer dibuat dari pipeline, update pipeline dengan customer ID
      const from = searchParams.get('from');
      const pipelineId = searchParams.get('id');

      if (from === 'pipeline' && pipelineId && newCustomer) {
        try {
          console.log('🔄 Auto-sync dimulai...', { from, pipelineId, customerId: newCustomer.id });
          
          // Update pipeline dengan customer ID
          const pipelines = await api.getPipelines();
          const pipeline = pipelines.find((p: Pipeline) => p.id === pipelineId);

          if (pipeline) {
            console.log('📊 Data sebelum sync:', {
              orderType: pipeline.orderType,
              nomorTelepon: pipeline.nomorTelepon,
              alamat: pipeline.alamat,
              segmen: pipeline.segmen,
            });
            
            console.log('📊 Data customer baru:', {
              customerCategory: formData.customerCategory,
              companyPhone: formData.companyPhone,
              billingAddress: formData.billingAddress?.fullAddress,
              industryCategory: formData.industryCategory,
            });
            
            // Cek apakah perlu update stage dari Lead ke Qualifikasi
            let newStage = pipeline.stage;
            let stageUpdated = false;

            // Kondisi 3: Jika pipeline stage = Lead dan customer memiliki kategori industri, ubah stage ke Qualifikasi
            if (pipeline.stage === 'Lead' && formData.industryCategory) {
              newStage = 'Qualifikasi';
              stageUpdated = true;
            }

            // Update orderType berdasarkan customerCategory
            // Perorangan → New, Perusahaan → Repeat
            let newOrderType = pipeline.orderType;
            if (formData.customerCategory === 'Perusahaan') {
              newOrderType = 'Repeat';
            } else if (formData.customerCategory === 'Perorangan') {
              newOrderType = 'New';
            }

            const updatedPipeline = {
              ...pipeline,
              customerId: newCustomer.id,
              // Update juga nama customer jika berbeda
              customer: formData.customerName,
              // Update stage jika berubah
              stage: newStage,
              // Update orderType berdasarkan customerCategory
              orderType: newOrderType,
              // Update data customer di pipeline
              nomorTelepon: formData.companyPhone || pipeline.nomorTelepon,
              alamat: formData.billingAddress?.fullAddress || pipeline.alamat,
              segmen: formData.industryCategory || pipeline.segmen,
            };
            
            console.log('📊 Data setelah sync:', {
              orderType: updatedPipeline.orderType,
              nomorTelepon: updatedPipeline.nomorTelepon,
              alamat: updatedPipeline.alamat,
              segmen: updatedPipeline.segmen,
            });

            await api.updatePipeline(pipelineId, updatedPipeline);

            console.log('✅ Auto-sync berhasil!');
            
            if (stageUpdated) {
              toast.success('✅ Pipeline berhasil dihubungkan dengan customer dan data berhasil disinkronkan');
            } else {
              toast.success('✅ Pipeline berhasil dihubungkan dengan customer dan data berhasil disinkronkan');
            }
          } else {
            console.log('❌ Pipeline tidak ditemukan:', pipelineId);
          }
        } catch (error) {
          console.error('Error updating pipeline:', error);
          toast.error('Customer tersimpan, namun gagal menghubungkan ke pipeline');
        }
      } else {
        console.log('ℹ️ Auto-sync tidak dijalankan:', { from, pipelineId, hasCustomer: !!newCustomer });
      }

      // Navigate berdasarkan dari mana form diakses
      if (from === 'pipeline' && pipelineId) {
        navigate(`/sales/pipeline/${pipelineId}`);
      } else {
        navigate('/sales/customers');
      }
    } catch (error) {
      console.error('Error saving customer:', error);
      toast.error('Gagal menyimpan data');
    } finally {
      setLoading(false);
    }
  };

  // Contact handlers
  const addContact = () => {
    setFormData({
      ...formData,
      contacts: [...formData.contacts, { pic: '', position: '', phone: '' }],
    });
  };

  const removeContact = (index: number) => {
    if (formData.contacts.length === 1) {
      toast.error('Minimal harus ada 1 kontak');
      return;
    }
    const newContacts = formData.contacts.filter((_, i) => i !== index);
    setFormData({ ...formData, contacts: newContacts });
  };

  const updateContact = (index: number, field: keyof Contact, value: string) => {
    const newContacts = [...formData.contacts];
    newContacts[index][field] = value;
    setFormData({ ...formData, contacts: newContacts });
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
        title={isEdit ? 'Edit Customer' : 'Tambah Customer'}
        description={isEdit ? 'Perbarui data customer' : 'Tambahkan customer baru ke sistem'}
        breadcrumbs={[
          { label: 'Dashboard', href: '/' },
          { label: 'Sales' },
          { label: 'Customer', href: '/sales/customers' },
          { label: isEdit ? 'Edit' : 'Tambah' },
        ]}
        actions={
          <Button variant="outline" onClick={() => navigate('/sales/customers')}>
            <ChevronLeft className="w-4 h-4 mr-2" />
            Kembali
          </Button>
        }
      />

      <Card className="p-6">
        <form onSubmit={handleSubmit}>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="info">Informasi Umum</TabsTrigger>
              <TabsTrigger value="tax">Informasi Pajak</TabsTrigger>
            </TabsList>

            {/* Tab 1: Informasi Umum */}
            <TabsContent value="info" className="space-y-6 mt-4">
              {/* Mode Input */}
              {!isEdit && (
                <div className="border rounded-lg p-4 bg-blue-50/50 space-y-3">
                  <h3 className="font-semibold text-base">Sumber Data</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="inputMode">Ambil Data Dari</Label>
                      <Select
                        value={inputMode}
                        onValueChange={(value: 'manual' | 'prospective' | 'pipeline') => {
                          setInputMode(value);
                          if (value === 'manual') {
                            setSelectedProspective('');
                            setSelectedPipeline('');
                            // Reset form ke kosong untuk input manual (kecuali kategori customer yang tetap default "Perusahaan")
                            setFormData({
                              ...formData,
                              customerCategory: 'Perusahaan',
                              customerName: '',
                              leadSource: '',
                              holding: '',
                              companyPhone: '',
                              contacts: [{ pic: '', position: '', phone: '' }],
                              prospectiveCustomerId: '',
                            });
                          }
                        }}
                      >
                        <SelectTrigger id="inputMode">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem key="input-manual" value="manual">Input Manual</SelectItem>
                          <SelectItem key="input-prospective" value="prospective">Ambil dari Calon Customer</SelectItem>
                          <SelectItem key="input-pipeline" value="pipeline">Ambil dari Pipeline</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {inputMode === 'prospective' && (
                      <div className="space-y-2">
                        <Label htmlFor="prospectiveCustomer">Pilih Calon Customer</Label>
                        <Select
                          value={selectedProspective}
                          onValueChange={(value) => {
                            setSelectedProspective(value);
                            const prospect = prospectiveCustomers.find(p => p.id === value);
                            if (prospect) {
                              setFormData({
                                ...formData,
                                customerName: prospect.customerName.toUpperCase(),
                                leadSource: prospect.leadSource,
                                companyPhone: prospect.phone || '',
                                prospectiveCustomerId: value,
                              });
                            }
                          }}
                        >
                          <SelectTrigger id="prospectiveCustomer">
                            <SelectValue placeholder="Pilih calon customer" />
                          </SelectTrigger>
                          <SelectContent>
                            {prospectiveCustomers.filter(p => p.id && typeof p.id === 'string' && p.id.trim() !== '').map((prospect) => (
                              <SelectItem key={prospect.id} value={prospect.id}>
                                {prospect.customerName}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}

                    {inputMode === 'pipeline' && (
                      <div className="space-y-2">
                        <Label htmlFor="pipelineSelect">Pilih Pipeline</Label>
                        <Select
                          value={selectedPipeline}
                          onValueChange={(value) => {
                            setSelectedPipeline(value);
                            const pipeline = pipelines.find(p => p.id === value);
                            if (pipeline) {
                              setFormData({
                                ...formData,
                                customerName: pipeline.customer.toUpperCase(),
                                leadSource: pipeline.sumberLead || '',
                                customerCategory: pipeline.orderType === 'New' ? 'Perorangan' : 'Perusahaan',
                                companyPhone: pipeline.nomorTelepon || '',
                                contacts: [
                                  {
                                    pic: pipeline.picSales || '',
                                    position: 'PIC',
                                    phone: pipeline.nomorTelepon || '',
                                  }
                                ],
                                billingAddress: {
                                  ...formData.billingAddress,
                                  fullAddress: pipeline.alamat || '',
                                  city: pipeline.alamat || '',
                                  label: 'Alamat Utama',
                                },
                              });
                            }
                          }}
                        >
                          <SelectTrigger id="pipelineSelect">
                            <SelectValue placeholder="Pilih pipeline" />
                          </SelectTrigger>
                          <SelectContent>
                            {pipelines.filter(p => p.id && typeof p.id === 'string' && p.id.trim() !== '').map((pipeline) => (
                              <SelectItem key={pipeline.id} value={pipeline.id}>
                                {pipeline.customer} - {pipeline.stage}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {inputMode === 'manual'
                      ? '✏️ Isi form secara manual untuk menambah customer baru'
                      : inputMode === 'prospective'
                      ? '📋 Pilih calon customer untuk mengisi otomatis nama dan sumber lead'
                      : '🔄 Pilih pipeline untuk melengkapi data customer dari pipeline'
                    }
                  </p>
                </div>
              )}

              {/* Informasi Customer */}
              <div className="space-y-1">
                <h3 className="font-semibold text-base border-b pb-2">Data Customer</h3>
                <div className="space-y-1">
                  {/* Kategori Customer | Isian | Nama Customer | Isian */}
                  <div className="grid grid-cols-[120px_1fr_120px_1fr] items-center gap-1">
                    <Label htmlFor="customerCategory">Kategori Customer *</Label>
                    <Select
                      value={formData.customerCategory}
                      onValueChange={(value) => setFormData({ ...formData, customerCategory: value })}
                      required
                    >
                      <SelectTrigger id="customerCategory">
                        <SelectValue placeholder="Pilih kategori" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem key="cat-perusahaan" value="Perusahaan">Perusahaan</SelectItem>
                        <SelectItem key="cat-perorangan" value="Perorangan">Perorangan</SelectItem>
                      </SelectContent>
                    </Select>
                    <Label htmlFor="customerName">Nama Customer *</Label>
                    <Input
                      id="customerName"
                      value={formData.customerName}
                      onChange={(e) => {
                        setFormData({
                          ...formData,
                          customerName: e.target.value.toUpperCase()
                        });
                      }}
                      placeholder="Masukkan nama customer"
                      style={{ textTransform: 'uppercase' }}
                      required
                    />
                  </div>

                  {/* Kategori Industri | Isian | Sumber Lead | Isian */}
                  <div className="grid grid-cols-[120px_1fr_120px_1fr] items-center gap-1">
                    <Label htmlFor="industryCategory">Kategori Industri</Label>
                    <Select
                      value={formData.industryCategory}
                      onValueChange={(value) => setFormData({ ...formData, industryCategory: value })}
                    >
                      <SelectTrigger id="industryCategory">
                        <SelectValue placeholder="Pilih kategori industri" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem key="ind-food" value="Food & Beverage">Food & Beverage</SelectItem>
                        <SelectItem key="ind-farmasi" value="Farmasi">Farmasi</SelectItem>
                        <SelectItem key="ind-kosmetik" value="Kosmetik">Kosmetik</SelectItem>
                        <SelectItem key="ind-retail" value="Retail">Retail</SelectItem>
                        <SelectItem key="ind-fmcg" value="FMCG">FMCG</SelectItem>
                        <SelectItem key="ind-elektronik" value="Elektronik">Elektronik</SelectItem>
                        <SelectItem key="ind-otomotif" value="Otomotif">Otomotif</SelectItem>
                        <SelectItem key="ind-tekstil" value="Tekstil">Tekstil</SelectItem>
                        <SelectItem key="ind-agrikultur" value="Agrikultur">Agrikultur</SelectItem>
                        <SelectItem key="ind-lainnya" value="Lainnya">Lainnya</SelectItem>
                      </SelectContent>
                    </Select>
                    <Label htmlFor="leadSource">Sumber Lead *</Label>
                    <Select
                      value={formData.leadSource}
                      onValueChange={(value) => setFormData({ ...formData, leadSource: value })}
                      required
                    >
                      <SelectTrigger id="leadSource">
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

                  {/* Holding | Isian | Nomor Telepon | Isian */}
                  <div className="grid grid-cols-[120px_1fr_120px_1fr] items-center gap-1">
                    <Label htmlFor="holding">Induk (Holding)</Label>
                    <Select
                      value={formData.holding}
                      onValueChange={(value) => setFormData({ ...formData, holding: value })}
                    >
                      <SelectTrigger id="holding">
                        <SelectValue placeholder={formData.customerName || "Pilih induk perusahaan"} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem key="holding-self" value="_self">
                          {formData.customerName || "Perusahaan Sendiri"}
                        </SelectItem>
                        {customers
                          .filter(c => c.id && typeof c.id === 'string' && c.id.trim() !== '' && c.customerName !== formData.customerName)
                          .map((customer) => (
                            <SelectItem key={customer.id} value={customer.id}>
                              {customer.customerName}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                    <Label>Nomor Telepon</Label>
                    <PhoneInput
                      value={formData.companyPhone}
                      onChange={(value) => setFormData({ ...formData, companyPhone: value })}
                      placeholder="81234567890"
                      showCountrySelector={true}
                    />
                  </div>
                </div>
              </div>

              {/* Kontak */}
              <div className="space-y-1">
                <div className="flex justify-between items-center border-b pb-2">
                  <h3 className="font-semibold text-base">Kontak</h3>
                  <Button type="button" variant="outline" size="sm" onClick={addContact}>
                    <UserPlus className="w-4 h-4 mr-2" />
                    Tambah Kontak
                  </Button>
                </div>

                <div className="grid grid-cols-1 gap-1">
                  {formData.contacts.map((contact, index) => (
                    <div key={index} className="border rounded-lg p-2 bg-muted/30">
                      <div className="flex items-start justify-between mb-1">
                        <span className="text-sm font-medium text-muted-foreground">Kontak {index + 1}</span>
                        {formData.contacts.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeContact(index)}
                          >
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        )}
                      </div>
                      <div className="grid grid-cols-[120px_1fr_120px_1fr_120px_1fr] items-center gap-1">
                        <Label htmlFor={`contact-pic-${index}`}>PIC / Nama</Label>
                        <Input
                          id={`contact-pic-${index}`}
                          value={contact.pic}
                          onChange={(e) => updateContact(index, 'pic', e.target.value)}
                          placeholder="Nama PIC"
                        />
                        <Label htmlFor={`contact-position-${index}`}>Jabatan</Label>
                        <Input
                          id={`contact-position-${index}`}
                          value={contact.position}
                          onChange={(e) => updateContact(index, 'position', e.target.value)}
                          placeholder="Jabatan"
                        />
                        <Label>No. Telepon</Label>
                        <PhoneInput
                          value={contact.phone}
                          onChange={(value) => updateContact(index, 'phone', value)}
                          placeholder="81234567890"
                          showCountrySelector={false}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Alamat Penagihan */}
              <div className="space-y-1">
                <h3 className="font-semibold text-base border-b pb-2">Alamat Penagihan *</h3>
                <div className="border rounded-lg p-2 bg-orange-50/30 space-y-1">
                  {/* Label Alamat */}
                  <div className="grid grid-cols-[120px_1fr] items-center gap-1">
                    <Label htmlFor="billingLabel">Label Alamat</Label>
                    <Input
                      id="billingLabel"
                      value={formData.billingAddress.label}
                      onChange={(e) => setFormData({
                        ...formData,
                        billingAddress: { ...formData.billingAddress, label: e.target.value }
                      })}
                      placeholder="Contoh: Kantor Pusat"
                    />
                  </div>

                  {/* Alamat Lengkap */}
                  <div className="grid grid-cols-[120px_1fr] items-start gap-1">
                    <Label htmlFor="billingAddress" className="pt-2">Alamat Lengkap *</Label>
                    <Textarea
                      id="billingAddress"
                      value={formData.billingAddress.fullAddress}
                      onChange={(e) => setFormData({
                        ...formData,
                        billingAddress: { ...formData.billingAddress, fullAddress: e.target.value.toUpperCase() }
                      })}
                      placeholder="Jalan, Nomor, RT/RW, Kelurahan"
                      rows={2}
                      required
                    />
                  </div>

                  {/* Kota | Kecamatan */}
                  <div className="grid grid-cols-[120px_1fr_120px_1fr] items-center gap-1">
                    <Label htmlFor="billingCity">Kota / Kabupaten *</Label>
                    <CityCombobox
                      value={formData.billingAddress.city}
                      onValueChange={(value) => {
                        const selectedRegion = regions.find(r => r.kotaKabupaten === value);
                        if (selectedRegion) {
                          setFormData({
                            ...formData,
                            billingAddress: {
                              ...formData.billingAddress,
                              city: selectedRegion.kotaKabupaten,
                              province: selectedRegion.provinsi,
                              country: selectedRegion.negara,
                            }
                          });
                        }
                      }}
                      regions={regions}
                      placeholder="Cari kota/kabupaten..."
                    />
                    <Label htmlFor="billingDistrict">Kecamatan</Label>
                    <Input
                      id="billingDistrict"
                      value={formData.billingAddress.district}
                      onChange={(e) => setFormData({
                        ...formData,
                        billingAddress: { ...formData.billingAddress, district: e.target.value.toUpperCase() }
                      })}
                      placeholder="Nama kecamatan"
                    />
                  </div>

                  {/* Provinsi | Negara */}
                  <div className="grid grid-cols-[120px_1fr_120px_1fr] items-center gap-1">
                    <Label htmlFor="billingProvince">Provinsi *</Label>
                    <Input
                      id="billingProvince"
                      value={formData.billingAddress.province}
                      onChange={(e) => setFormData({
                        ...formData,
                        billingAddress: { ...formData.billingAddress, province: e.target.value }
                      })}
                      placeholder="Nama provinsi"
                      required
                      readOnly
                      className="bg-muted"
                    />
                    <Label htmlFor="billingCountry">Negara *</Label>
                    <Input
                      id="billingCountry"
                      value={formData.billingAddress.country}
                      onChange={(e) => setFormData({
                        ...formData,
                        billingAddress: { ...formData.billingAddress, country: e.target.value }
                      })}
                      placeholder="Indonesia"
                      required
                      readOnly
                      className="bg-muted"
                    />
                  </div>

                  {/* Kode Pos */}
                  <div className="grid grid-cols-[120px_1fr] items-center gap-1">
                    <Label htmlFor="billingPostalCode">Kode Pos</Label>
                    <Input
                      id="billingPostalCode"
                      value={formData.billingAddress.postalCode}
                      onChange={(e) => setFormData({
                        ...formData,
                        billingAddress: { ...formData.billingAddress, postalCode: e.target.value }
                      })}
                      placeholder="12345"
                      maxLength={5}
                    />
                  </div>
                </div>
              </div>

              {/* Alamat Kirim */}
              <div className="space-y-1">
                <h3 className="font-semibold text-base border-b pb-2">Alamat Kirim (Opsional)</h3>
                <div className="border rounded-lg p-2 bg-muted/20 space-y-1">
                  {/* Checkbox: Sama dengan alamat utama */}
                  <div className="flex items-center space-x-2 pb-1">
                    <Checkbox
                      id="sameAsMainAddress"
                      checked={
                        formData.shippingAddress.fullAddress === formData.billingAddress.fullAddress &&
                        formData.shippingAddress.city === formData.billingAddress.city &&
                        formData.shippingAddress.district === formData.billingAddress.district &&
                        formData.shippingAddress.province === formData.billingAddress.province &&
                        formData.shippingAddress.country === formData.billingAddress.country &&
                        formData.shippingAddress.postalCode === formData.billingAddress.postalCode
                      }
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setFormData({
                            ...formData,
                            shippingAddress: {
                              ...formData.billingAddress,
                              label: formData.billingAddress.label || 'Alamat Kirim',
                            }
                          });
                        } else {
                          setFormData({
                            ...formData,
                            shippingAddress: {
                              label: '',
                              fullAddress: '',
                              district: '',
                              city: '',
                              province: '',
                              country: '',
                              postalCode: '',
                            }
                          });
                        }
                      }}
                    />
                    <Label htmlFor="sameAsMainAddress" className="cursor-pointer font-medium">
                      Sama dengan alamat utama
                    </Label>
                  </div>

                  {/* Label Alamat */}
                  <div className="grid grid-cols-[120px_1fr] items-center gap-1">
                    <Label htmlFor="shippingLabel">Label Alamat</Label>
                    <Input
                      id="shippingLabel"
                      value={formData.shippingAddress.label}
                      onChange={(e) => setFormData({
                        ...formData,
                        shippingAddress: { ...formData.shippingAddress, label: e.target.value }
                      })}
                      placeholder="Contoh: Gudang, Pabrik"
                    />
                  </div>

                  {/* Alamat Lengkap */}
                  <div className="grid grid-cols-[120px_1fr] items-start gap-1">
                    <Label htmlFor="shippingAddress" className="pt-2">Alamat Lengkap</Label>
                    <Textarea
                      id="shippingAddress"
                      value={formData.shippingAddress.fullAddress}
                      onChange={(e) => setFormData({
                        ...formData,
                        shippingAddress: { ...formData.shippingAddress, fullAddress: e.target.value.toUpperCase() }
                      })}
                      placeholder="Jalan, Nomor, RT/RW, Kelurahan"
                      rows={2}
                    />
                  </div>

                  {/* Kota | Kecamatan */}
                  <div className="grid grid-cols-[120px_1fr_120px_1fr] items-center gap-1">
                    <Label htmlFor="shippingCity">Kota / Kabupaten</Label>
                    <CityCombobox
                      value={formData.shippingAddress.city}
                      onValueChange={(value) => {
                        const selectedRegion = regions.find(r => r.kotaKabupaten === value);
                        if (selectedRegion) {
                          setFormData({
                            ...formData,
                            shippingAddress: {
                              ...formData.shippingAddress,
                              city: selectedRegion.kotaKabupaten,
                              province: selectedRegion.provinsi,
                              country: selectedRegion.negara,
                            }
                          });
                        }
                      }}
                      regions={regions}
                      placeholder="Cari kota/kabupaten..."
                    />
                    <Label htmlFor="shippingDistrict">Kecamatan</Label>
                    <Input
                      id="shippingDistrict"
                      value={formData.shippingAddress.district}
                      onChange={(e) => setFormData({
                        ...formData,
                        shippingAddress: { ...formData.shippingAddress, district: e.target.value.toUpperCase() }
                      })}
                      placeholder="Nama kecamatan"
                    />
                  </div>

                  {/* Provinsi | Negara */}
                  <div className="grid grid-cols-[120px_1fr_120px_1fr] items-center gap-1">
                    <Label htmlFor="shippingProvince">Provinsi</Label>
                    <Input
                      id="shippingProvince"
                      value={formData.shippingAddress.province}
                      onChange={(e) => setFormData({
                        ...formData,
                        shippingAddress: { ...formData.shippingAddress, province: e.target.value }
                      })}
                      placeholder="Nama provinsi"
                      readOnly
                      className="bg-muted"
                    />
                    <Label htmlFor="shippingCountry">Negara</Label>
                    <Input
                      id="shippingCountry"
                      value={formData.shippingAddress.country}
                      onChange={(e) => setFormData({
                        ...formData,
                        shippingAddress: { ...formData.shippingAddress, country: e.target.value }
                      })}
                      placeholder="Indonesia"
                      readOnly
                      className="bg-muted"
                    />
                  </div>

                  {/* Kode Pos */}
                  <div className="grid grid-cols-[120px_1fr] items-center gap-1">
                    <Label htmlFor="shippingPostalCode">Kode Pos</Label>
                    <Input
                      id="shippingPostalCode"
                      value={formData.shippingAddress.postalCode}
                      onChange={(e) => setFormData({
                        ...formData,
                        shippingAddress: { ...formData.shippingAddress, postalCode: e.target.value }
                      })}
                      placeholder="12345"
                      maxLength={5}
                    />
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* Tab 2: Informasi Pajak */}
            <TabsContent value="tax" className="space-y-1 mt-4">
              <div className="space-y-1">
                {/* Checklist Pajak */}
                <div className="border rounded-lg p-2 space-y-1 bg-blue-50/30">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="taxIncluded"
                      checked={formData.taxIncluded}
                      onCheckedChange={(checked) =>
                        setFormData({ ...formData, taxIncluded: checked as boolean })
                      }
                    />
                    <Label htmlFor="taxIncluded" className="cursor-pointer font-medium">
                      Total faktur sudah termasuk pajak
                    </Label>
                  </div>
                </div>

                {/* ID Pajak & Wajib Pajak */}
                <div className="border rounded-lg p-2 space-y-1">
                  <h4 className="font-medium text-sm border-b pb-1">Identitas Pajak</h4>

                  {/* Tipe ID Pajak | Nomor Wajib Pajak */}
                  <div className="grid grid-cols-[120px_1fr_120px_1fr] items-center gap-1">
                    <Label htmlFor="taxIdType">Tipe ID Pajak</Label>
                    <Select
                      value={formData.taxIdType}
                      onValueChange={(value) => setFormData({ ...formData, taxIdType: value })}
                    >
                      <SelectTrigger id="taxIdType">
                        <SelectValue placeholder="Pilih tipe ID pajak" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem key="tax-nik" value="NIK">NIK</SelectItem>
                        <SelectItem key="tax-npwp" value="NPWP">NPWP</SelectItem>
                      </SelectContent>
                    </Select>
                    <Label htmlFor="taxNumber">Nomor Wajib Pajak</Label>
                    <Input
                      id="taxNumber"
                      value={formData.taxNumber}
                      onChange={(e) => setFormData({ ...formData, taxNumber: e.target.value })}
                      placeholder={formData.taxIdType === 'NIK' ? '16 digit NIK' : 'XX.XXX.XXX.X-XXX.XXX'}
                    />
                  </div>

                  {/* Nama Wajib Pajak */}
                  <div className="grid grid-cols-[120px_1fr] items-center gap-1">
                    <Label htmlFor="taxName">Nama Wajib Pajak</Label>
                    <Input
                      id="taxName"
                      value={formData.taxName}
                      onChange={(e) => setFormData({ ...formData, taxName: e.target.value })}
                      placeholder="Nama sesuai dokumen pajak"
                    />
                  </div>

                  {/* ID TKU | Kode Negara */}
                  <div className="grid grid-cols-[120px_1fr_120px_1fr] items-center gap-1">
                    <Label htmlFor="idTku">ID TKU</Label>
                    <Input
                      id="idTku"
                      value={formData.idTku}
                      onChange={(e) => setFormData({ ...formData, idTku: e.target.value })}
                      placeholder="Nomor ID TKU"
                    />
                    <Label htmlFor="countryCode">Kode Negara</Label>
                    <Input
                      id="countryCode"
                      value={formData.countryCode}
                      onChange={(e) => setFormData({ ...formData, countryCode: e.target.value })}
                      placeholder="IDN"
                      maxLength={3}
                    />
                  </div>
                </div>

                {/* Tipe Transaksi */}
                <div className="border rounded-lg p-2 space-y-1">
                  <h4 className="font-medium text-sm border-b pb-1">Detail Transaksi Pajak</h4>

                  {/* Tipe Transaksi | NPPKP */}
                  <div className="grid grid-cols-[120px_1fr_120px_1fr] items-center gap-1">
                    <Label htmlFor="transactionType">Tipe Transaksi</Label>
                    <Select
                      value={formData.transactionType}
                      onValueChange={(value) => setFormData({ ...formData, transactionType: value })}
                    >
                      <SelectTrigger id="transactionType">
                        <SelectValue placeholder="Pilih tipe transaksi" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem key="trans-faktur" value="Faktur Pajak">Faktur Pajak</SelectItem>
                        <SelectItem key="trans-gabung" value="Digabungkan">Digabungkan</SelectItem>
                        <SelectItem key="trans-dokumen" value="Dokumen Tertentu">Dokumen Tertentu</SelectItem>
                        <SelectItem key="trans-ekspor" value="Ekspor">Ekspor</SelectItem>
                      </SelectContent>
                    </Select>
                    <Label htmlFor="nppkp">NPPKP</Label>
                    <Input
                      id="nppkp"
                      value={formData.nppkp}
                      onChange={(e) => setFormData({ ...formData, nppkp: e.target.value })}
                      placeholder="Nomor Pengukuhan PKP"
                    />
                  </div>

                  {/* Detail Transaksi */}
                  <div className="grid grid-cols-[120px_1fr] items-start gap-1">
                    <Label htmlFor="transactionDetail" className="pt-2">Detail Transaksi</Label>
                    <Textarea
                      id="transactionDetail"
                      value={formData.transactionDetail}
                      onChange={(e) => setFormData({ ...formData, transactionDetail: e.target.value })}
                      placeholder="Keterangan detail transaksi pajak"
                      rows={3}
                    />
                  </div>
                </div>

                {/* Alamat Pajak */}
                <div className="border rounded-lg p-2 space-y-1 bg-orange-50/30">
                  <h4 className="font-medium text-sm border-b pb-1">Alamat Pajak</h4>

                  {/* Checkbox sama dengan alamat penagihan */}
                  <div className="flex items-center space-x-2 pb-1">
                    <Checkbox
                      id="sameAsBillingAddress"
                      checked={formData.sameAsBillingAddress}
                      onCheckedChange={(checked) => {
                        const isChecked = checked as boolean;
                        setFormData({
                          ...formData,
                          sameAsBillingAddress: isChecked,
                          taxAddress: isChecked
                            ? `${formData.billingAddress.fullAddress}, ${formData.billingAddress.district}, ${formData.billingAddress.city}, ${formData.billingAddress.province}, ${formData.billingAddress.country}${formData.billingAddress.postalCode ? ' ' + formData.billingAddress.postalCode : ''}`
                            : formData.taxAddress
                        });
                      }}
                    />
                    <Label htmlFor="sameAsBillingAddress" className="cursor-pointer">
                      Sama dengan alamat penagihan
                    </Label>
                  </div>

                  {/* Alamat Lengkap Pajak */}
                  <div className="grid grid-cols-[120px_1fr] items-start gap-1">
                    <Label htmlFor="taxAddress" className="pt-2">Alamat Lengkap Pajak</Label>
                    <Textarea
                      id="taxAddress"
                      value={formData.taxAddress}
                      onChange={(e) => setFormData({ ...formData, taxAddress: e.target.value, sameAsBillingAddress: false })}
                      placeholder="Alamat sesuai dokumen pajak"
                      rows={3}
                      disabled={formData.sameAsBillingAddress}
                      className={formData.sameAsBillingAddress ? 'bg-muted cursor-not-allowed' : ''}
                    />
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>

          <div className="flex justify-end gap-2 pt-6 mt-6 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate('/sales/customers')}
            >
              Batal
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Menyimpan...' : (isEdit ? 'Perbarui' : 'Simpan')}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}