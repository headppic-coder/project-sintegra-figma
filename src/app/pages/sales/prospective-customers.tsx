import { useState, useEffect } from 'react';
import { Plus, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { DataTable } from '../../components/data-table';
import { PageHeader } from '../../components/page-header';
import { ModalForm } from '../../components/modal-form';
import { PhoneInput } from '../../components/ui/phone-input';
import { CityCombobox } from '../../components/ui/city-combobox';
import { toast } from 'sonner';
import { api } from '../../lib/api';
import { formatDate } from '../../components/ui/utils';
import { normalizePhoneNumber, displayPhoneNumber } from '../../lib/phone-utils';

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

interface Region {
  id: string;
  kecamatan: string;
  kotaKabupaten: string;
  provinsi: string;
  negara: string;
  createdAt: string;
}

export function ProspectiveCustomers() {
  const navigate = useNavigate();
  const [data, setData] = useState<ProspectiveCustomer[]>([]);
  const [leadSources, setLeadSources] = useState<LeadSource[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [regions, setRegions] = useState<Region[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [editingItem, setEditingItem] = useState<ProspectiveCustomer | null>(null);

  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [salesFilter, setSalesFilter] = useState<string>('all');
  const [cityFilter, setCityFilter] = useState<string>('all');
  const [sumberLeadFilter, setSumberLeadFilter] = useState<string>('all');
  const [salesPeople, setSalesPeople] = useState<string[]>([]);
  const [cities, setCities] = useState<string[]>([]);

  const [formData, setFormData] = useState({
    customerName: '',
    phone: '',
    address: '',
    city: '',
    leadSource: '',
    salesPic: '',
    notes: '',
  });

  const columns = [
    { key: 'customerName', label: 'Nama / Nomor' },
    {
      key: 'phone',
      label: 'No. Telepon',
      render: (value: string) => {
        if (!value) return '-';
        return (
          <span className="text-sm" title={value}>
            {displayPhoneNumber(value)}
          </span>
        );
      },
    },
    { key: 'address', label: 'Alamat' },
    { key: 'city', label: 'Kota' },
    { key: 'leadSource', label: 'Sumber Lead' },
    { key: 'salesPic', label: 'PIC Sales' },
    {
      key: 'notes',
      label: 'Catatan',
      render: (value: string) => {
        if (!value || value === '') return '-';
        const truncated = value.length > 30 ? value.substring(0, 30) + '...' : value;
        return (
          <span className="text-sm text-muted-foreground" title={value}>
            {truncated}
          </span>
        );
      },
    },
    {
      key: 'createdAt',
      label: 'Tanggal',
      render: (value: string) => formatDate(value),
    },
  ];

  useEffect(() => {
    fetchData();
    fetchLeadSources();
    fetchEmployees();
    fetchRegions();
  }, []);

  // Extract unique sales people and cities from data
  useEffect(() => {
    if (data.length > 0) {
      const uniqueSales = Array.from(new Set(data.map(d => d.salesPic).filter(Boolean)));
      const uniqueCities = Array.from(new Set(data.map(d => d.city).filter(Boolean)));
      setSalesPeople(uniqueSales.sort());
      setCities(uniqueCities.sort());
    }
  }, [data]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const result = await api.getProspectiveCustomers();
      setData(result || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Gagal memuat data calon customer');
    } finally {
      setLoading(false);
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
      
      // Simpan departments untuk digunakan saat auto-detect sales type
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
            department_name: dept?.name || '',
          };
        });

      console.log('Filtered Sales Employees:', salesEmployees.length, 'out of', allEmployees.length);

      setEmployees(salesEmployees);
    } catch (error) {
      console.error('Error fetching employees:', error);
      setEmployees([]);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validasi field wajib
    if (!formData.customerName || !formData.phone) {
      toast.error('Nama dan nomor telepon wajib diisi');
      return;
    }

    if (!formData.leadSource) {
      toast.error('Sumber Lead wajib diisi');
      return;
    }

    if (!formData.salesPic) {
      toast.error('PIC Sales wajib diisi');
      return;
    }

    try {
      // Normalize phone number before saving
      const normalizedData = {
        ...formData,
        phone: normalizePhoneNumber(formData.phone)
      };

      // Check for duplicates di calon customer (nama dan nomor telepon harus unik)
      const duplicateName = data.find(
        item =>
          item.customerName.toLowerCase() === normalizedData.customerName.toLowerCase() &&
          (!editingItem || item.id !== editingItem.id) // Skip check untuk record yang sedang di-edit
      );

      if (duplicateName) {
        toast.error(`Nama "${normalizedData.customerName}" sudah terdaftar sebagai calon customer`);
        return;
      }

      const duplicatePhone = data.find(
        item =>
          item.phone === normalizedData.phone &&
          (!editingItem || item.id !== editingItem.id) // Skip check untuk record yang sedang di-edit
      );

      if (duplicatePhone) {
        toast.error(`Nomor telepon "${displayPhoneNumber(normalizedData.phone)}" sudah terdaftar sebagai calon customer`);
        return;
      }

      // Check juga di data customer (jika sudah jadi customer, tidak boleh jadi calon customer)
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
          customer.companyPhone === normalizedData.phone &&
          normalizedData.phone // Only check if phone is not empty
      );

      if (existingCustomerByPhone) {
        toast.error(`Nomor telepon "${displayPhoneNumber(normalizedData.phone)}" sudah terdaftar sebagai customer. Tidak dapat menambahkan ke calon customer.`);
        return;
      }

      if (editingItem) {
        await api.updateProspectiveCustomer(editingItem.id, normalizedData);
      } else {
        await api.createProspectiveCustomer(normalizedData);
      }

      toast.success(editingItem ? 'Calon customer berhasil diperbarui' : 'Calon customer berhasil ditambahkan');
      setShowDialog(false);
      resetForm();
      fetchData();
    } catch (error) {
      console.error('Error saving data:', error);
      toast.error('Gagal menyimpan data');
    }
  };

  const handleEdit = (item: ProspectiveCustomer) => {
    setEditingItem(item);
    setFormData({
      customerName: item.customerName,
      phone: item.phone,
      address: item.address,
      city: item.city,
      leadSource: item.leadSource,
      salesPic: item.salesPic,
      notes: item.notes,
    });
    setShowDialog(true);
  };

  const handleDelete = async (item: ProspectiveCustomer) => {
    if (!confirm('Apakah Anda yakin ingin menghapus calon customer ini?')) return;

    try {
      await api.deleteProspectiveCustomer(item.id);
      toast.success('Calon customer berhasil dihapus');
      fetchData();
    } catch (error) {
      console.error('Error deleting data:', error);
      toast.error('Gagal menghapus data');
    }
  };

  const resetForm = () => {
    setFormData({
      customerName: '',
      phone: '',
      address: '',
      city: '',
      leadSource: '',
      salesPic: '',
      notes: '',
    });
    setEditingItem(null);
  };

  // Handler untuk konversi calon customer ke customer
  const handleConvertToCustomer = (item: ProspectiveCustomer) => {
    // Navigate ke form customer dengan query param untuk pre-fill
    navigate(`/sales/customers/add?from=prospective&id=${item.id}`);
    toast.success(`Membuka form customer untuk "${item.customerName}"`);
  };

  // Custom actions untuk DataTable
  const customActions = [
    {
      icon: <ArrowRight className="w-4 h-4" />,
      onClick: handleConvertToCustomer,
      variant: 'default' as const,
      className: 'bg-green-600 hover:bg-green-700 text-white',
    },
  ];

  // Filter data
  const filteredData = data.filter((item) => {
    const matchesSearch =
      item.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.phone.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.address.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesSales = salesFilter === 'all' || item.salesPic === salesFilter;
    const matchesCity = cityFilter === 'all' || item.city === cityFilter;
    const matchesSumberLead = sumberLeadFilter === 'all' || item.leadSource === sumberLeadFilter;

    return matchesSearch && matchesSales && matchesCity && matchesSumberLead;
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Calon Customer"
        breadcrumbs={[
          { label: 'Dashboard', href: '/' },
          { label: 'Sales' },
          { label: 'Calon Customer' },
        ]}
        actions={
          <Button onClick={() => setShowDialog(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Tambah Calon Customer
          </Button>
        }
      />

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <Input
          placeholder="Cari nama, telepon, atau alamat..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="max-w-xs"
        />
        <Select value={salesFilter} onValueChange={setSalesFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Semua Sales" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Sales</SelectItem>
            {salesPeople.filter(s => s && typeof s === 'string' && s.trim() !== '').map((sales) => (
              <SelectItem key={sales} value={sales}>
                {sales}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={cityFilter} onValueChange={setCityFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Semua Kota" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Kota</SelectItem>
            {cities.filter(c => c && typeof c === 'string' && c.trim() !== '').map((city) => (
              <SelectItem key={city} value={city}>
                {city}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={sumberLeadFilter} onValueChange={setSumberLeadFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Semua Sumber Lead" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Sumber Lead</SelectItem>
            {leadSources.filter(s => s.name && typeof s.name === 'string' && s.name.trim() !== '').map((source) => (
              <SelectItem key={source.id} value={source.name}>
                {source.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <DataTable
        columns={columns}
        data={filteredData}
        loading={loading}
        onEdit={handleEdit}
        onDelete={handleDelete}
        customActions={customActions}
      />

      <ModalForm
        open={showDialog}
        onOpenChange={(open) => {
          setShowDialog(open);
          if (!open) resetForm();
        }}
        title={editingItem ? 'Edit Calon Customer' : 'Tambah Calon Customer'}
        description={editingItem ? 'Ubah data calon customer' : 'Isi form di bawah untuk menambah calon customer baru'}
        maxWidth="70vw"
      >
        <form onSubmit={handleSubmit} className="space-y-1">
          <div className="space-y-1">
            {/* Nama | Isian | Sumber Lead | Isian */}
            <div className="grid grid-cols-[120px_1fr_120px_1fr] items-center gap-1">
              <Label htmlFor="customerName">Nama / Nomor *</Label>
              <Input
                id="customerName"
                value={formData.customerName}
                onChange={(e) => setFormData({ ...formData, customerName: e.target.value.toUpperCase() })}
                required
                placeholder="Masukkan nama customer atau nomor"
                style={{ textTransform: 'uppercase' }}
              />
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
                  {leadSources.map((source) => (
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
                value={formData.phone}
                onChange={(value) => setFormData({ ...formData, phone: value })}
                required
                showCountrySelector={true}
              />
              <Label htmlFor="salesPic">PIC Sales *</Label>
              <Select
                value={formData.salesPic}
                onValueChange={(value) => setFormData({ ...formData, salesPic: value })}
                required
              >
                <SelectTrigger id="salesPic">
                  <SelectValue placeholder="Pilih PIC sales" />
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
              <Label htmlFor="address">Alamat</Label>
              <Input
                id="address"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value.toUpperCase() })}
                placeholder="Masukkan alamat"
              />
              <Label htmlFor="city">Kota</Label>
              <CityCombobox
                value={formData.city}
                onValueChange={(value) => setFormData({ ...formData, city: value })}
                regions={regions}
                placeholder="Cari kota..."
              />
            </div>

            {/* Catatan | Isian */}
            <div className="grid grid-cols-[120px_1fr] items-start gap-1">
              <Label htmlFor="notes" className="pt-2">Catatan</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Catatan tambahan"
                rows={3}
              />
            </div>
          </div>

          <div className="flex justify-end gap-1 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setShowDialog(false);
                resetForm();
              }}
            >
              Batal
            </Button>
            <Button type="submit">Simpan</Button>
          </div>
        </form>
      </ModalForm>
    </div>
  );
}