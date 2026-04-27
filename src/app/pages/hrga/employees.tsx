import { useState, useEffect } from 'react';
import { Plus, Users, User, UserPlus, Shield } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { DatePicker } from '../../components/ui/date-picker';
import { DataTable } from '../../components/data-table';
import { PageHeader } from '../../components/page-header';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../../components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { Card } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { PhoneInput } from '../../components/ui/phone-input';
import { toast } from 'sonner';
import { api } from '../../lib/api';
import { normalizePhoneNumber, displayPhoneNumber } from '../../lib/phone-utils';

interface Employee {
  id: string;
  // Informasi Pribadi
  employee_code: string;
  full_name: string;
  username: string;
  id_number?: string;
  date_of_birth?: string;
  place_of_birth?: string;
  gender?: string;
  religion?: string;
  marital_status?: string;
  address?: string;
  phone?: string;
  email?: string;
  // Informasi Pekerjaan
  company_id?: string; // ID company (sama dengan companyCode di department)
  company_name?: string;
  department_code?: string; // Code department
  department_name?: string;
  position_code?: string; // Code position
  position_name?: string;
  join_date?: string;
  employment_status?: string;
  created_at: string;
}

interface Company {
  id: string;
  companyName: string;
}

interface Department {
  id: string;
  code: string;
  name: string;
  companyCode: string;
  level?: number;
}

interface Position {
  id: string;
  code: string;
  name: string;
}

interface Role {
  id: string;
  name: string;
  display_name: string;
  permissions: string[];
}

interface UserAccount {
  id: string;
  username: string;
  employee_id: string;
}

export function Employees() {
  const [data, setData] = useState<Employee[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [positions, setPositions] = useState<Position[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [users, setUsers] = useState<UserAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<Employee | null>(null);
  const [activeTab, setActiveTab] = useState('personal');

  // Create User Account state
  const [showCreateUserModal, setShowCreateUserModal] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [userForm, setUserForm] = useState({
    username: '',
    email: '',
    password: '',
    role: 'staff'
  });
  const [formData, setFormData] = useState<{
    employee_code: string;
    full_name: string;
    username: string;
    id_number: string;
    date_of_birth: Date | undefined;
    place_of_birth: string;
    gender: string;
    religion: string;
    marital_status: string;
    address: string;
    phone: string;
    email: string;
    company_id: string;
    department_code: string;
    position_code: string;
    join_date: Date | undefined;
    employment_status: string;
  }>({
    employee_code: '',
    full_name: '',
    username: '',
    id_number: '',
    date_of_birth: undefined,
    place_of_birth: '',
    gender: '',
    religion: '',
    marital_status: '',
    address: '',
    phone: '',
    email: '',
    company_id: '',
    department_code: '',
    position_code: '',
    join_date: undefined,
    employment_status: '',
  });

  const fetchMasterData = async () => {
    try {
      const [companiesData, departmentsData, positionsData, rolesData, usersData] = await Promise.all([
        api.getCompanies(),
        api.getDepartments(),
        api.getPositions(),
        api.getRoles(),
        api.getUsers(),
      ]);

      // Filter dan set dengan safe checks
      const validCompanies = (companiesData || []).filter((c: any) => c && c.id && c.id.trim() !== '');
      const validDepartments = (departmentsData || []).filter((d: any) => d && d.id && d.id.trim() !== '');
      const validPositions = (positionsData || []).filter((p: any) => p && p.id && p.id.trim() !== '');

      setCompanies(validCompanies);
      setDepartments(validDepartments);
      setPositions(validPositions);
      setRoles(rolesData || []);
      setUsers(usersData || []);
    } catch (error) {
      console.error('Error fetching master data:', error);
      toast.error('Gagal memuat data master');
      // Set empty arrays on error
      setCompanies([]);
      setDepartments([]);
      setPositions([]);
      setRoles([]);
      setUsers([]);
    }
  };

  const fetchData = async () => {
    try {
      const result = await api.getEmployees();
      
      // Pastikan master data sudah loaded, jika belum skip enrichment
      if (!result || result.length === 0) {
        setData([]);
        setLoading(false);
        return;
      }
      
      // Enrich with related names and ensure all optional fields have default values
      const enrichedData = result.map((emp: any) => {
        // Safely lookup dengan fallback dan null checks
        const company = companies.find(c => c && c.id && emp.company_id && c.id === emp.company_id);
        const department = departments.find(d => d && d.code && emp.department_code && d.code === emp.department_code);
        const position = positions.find(p => p && p.code && emp.position_code && p.code === emp.position_code);
        
        return {
          id: emp.id || '',
          employee_code: emp.employee_code || '',
          full_name: emp.full_name || '',
          username: emp.username || '',
          id_number: emp.id_number || '',
          date_of_birth: emp.date_of_birth || '',
          place_of_birth: emp.place_of_birth || '',
          gender: emp.gender || '',
          religion: emp.religion || '',
          marital_status: emp.marital_status || '',
          address: emp.address || '',
          phone: emp.phone || '',
          email: emp.email || '',
          company_id: emp.company_id || '',
          company_name: company?.companyName || '-',
          department_code: emp.department_code || '',
          department_name: department?.name || '-',
          position_code: emp.position_code || '',
          position_name: position?.name || '-',
          join_date: emp.join_date || '',
          employment_status: emp.employment_status || '',
          created_at: emp.created_at || '',
        };
      });
      
      setData(enrichedData || []);
    } catch (error) {
      console.error('Error fetching employees:', error);
      toast.error('Gagal memuat data karyawan');
      setData([]); // Set empty array on error
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const loadAllData = async () => {
      setLoading(true);
      await fetchMasterData();
      // fetchData akan dipanggil oleh useEffect berikutnya setelah master data loaded
    };
    loadAllData();
  }, []);

  useEffect(() => {
    // Fetch employees setelah master data loaded (triggered by state changes)
    // Hanya run sekali setelah initial mount atau saat explicitly refresh
    if (companies.length > 0 || departments.length > 0 || positions.length > 0) {
      fetchData();
    } else if (!loading) {
      // Jika tidak ada master data sama sekali, tetap fetch employees
      fetchData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [companies.length, departments.length, positions.length]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validasi hanya field wajib: kode, nama lengkap, nama user
    if (!formData.employee_code || !formData.full_name || !formData.username) {
      toast.error('Field wajib harus diisi: Kode Karyawan, Nama Lengkap, dan Nama User');
      return;
    }

    try {
      const payload = {
        ...formData,
        date_of_birth: formData.date_of_birth instanceof Date ? formData.date_of_birth.toISOString().split('T')[0] : formData.date_of_birth || '',
        join_date: formData.join_date instanceof Date ? formData.join_date.toISOString().split('T')[0] : formData.join_date || '',
        phone: normalizePhoneNumber(formData.phone), // Normalize phone number
      };

      if (editingItem) {
        await api.updateEmployee(editingItem.id, payload);
        toast.success('Data karyawan berhasil diperbarui');
      } else {
        await api.createEmployee(payload);
        toast.success('Data karyawan berhasil ditambahkan');
      }

      setShowModal(false);
      resetForm();
      fetchData();
    } catch (error) {
      console.error('Error saving employee:', error);
      toast.error('Gagal menyimpan data karyawan');
    }
  };

  const handleEdit = (item: Employee) => {
    setEditingItem(item);
    setFormData({
      employee_code: item.employee_code || '',
      full_name: item.full_name || '',
      username: item.username || '',
      id_number: item.id_number || '',
      date_of_birth: item.date_of_birth ? new Date(item.date_of_birth) : undefined,
      place_of_birth: item.place_of_birth || '',
      gender: item.gender || '',
      religion: item.religion || '',
      marital_status: item.marital_status || '',
      address: item.address || '',
      phone: item.phone || '',
      email: item.email || '',
      company_id: item.company_id || '',
      department_code: item.department_code || '',
      position_code: item.position_code || '',
      join_date: item.join_date ? new Date(item.join_date) : undefined,
      employment_status: item.employment_status || '',
    });
    setShowModal(true);
  };

  const handleDelete = async (item: Employee) => {
    if (!confirm('Apakah Anda yakin ingin menghapus karyawan ini?')) return;

    try {
      await api.delete(item.id);
      toast.success('Data berhasil dihapus');
      fetchData();
    } catch (error) {
      console.error('Error deleting employee:', error);
      toast.error('Gagal menghapus data');
    }
  };

  const handleCreateUserAccount = (employee: Employee) => {
    setSelectedEmployee(employee);
    setUserForm({
      username: employee.username || '',
      email: employee.email || '',
      password: '',
      role: 'staff'
    });
    setShowCreateUserModal(true);
  };

  const handleSaveUserAccount = async () => {
    if (!selectedEmployee) return;

    if (!userForm.username || !userForm.email || !userForm.password) {
      toast.error('Username, email, dan password wajib diisi');
      return;
    }

    if (userForm.password.length < 6) {
      toast.error('Password minimal 6 karakter');
      return;
    }

    try {
      // Create user account
      const result = await api.createSimpleUser({
        username: userForm.username,
        email: userForm.email,
        password: userForm.password,
        nama_user: selectedEmployee.full_name,
        employee_id: selectedEmployee.id,
        role: userForm.role
      });

      if (result.success) {
        toast.success('User account berhasil dibuat');
        setShowCreateUserModal(false);
        setSelectedEmployee(null);
        setUserForm({ username: '', email: '', password: '', role: 'staff' });

        // Refresh data
        fetchMasterData();
        fetchData();
      }
    } catch (error: any) {
      console.error('Error creating user account:', error);
      toast.error(error.message || 'Gagal membuat user account');
    }
  };

  const hasUserAccount = (employeeId: string) => {
    return users.some((u: any) => u.employee_id === employeeId);
  };

  const resetForm = () => {
    setFormData({
      employee_code: '',
      full_name: '',
      username: '',
      id_number: '',
      date_of_birth: undefined,
      place_of_birth: '',
      gender: '',
      religion: '',
      marital_status: '',
      address: '',
      phone: '',
      email: '',
      company_id: '',
      department_code: '',
      position_code: '',
      join_date: undefined,
      employment_status: '',
    });
    setEditingItem(null);
    setActiveTab('personal');
  };

  const columns = [
    {
      key: 'employee_code',
      label: 'NIK',
      render: (value: any) => (
        <span className="font-mono text-sm font-medium">{value}</span>
      ),
    },
    {
      key: 'full_name',
      label: 'Nama Lengkap',
      render: (value: any) => (
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
            <User className="w-4 h-4 text-primary" />
          </div>
          <span className="font-medium">{value}</span>
        </div>
      ),
    },
    {
      key: 'username',
      label: 'Username',
      render: (value: any) => (
        <span className="text-sm text-muted-foreground">{value || '-'}</span>
      ),
    },
    {
      key: 'company_name',
      label: 'Perusahaan',
    },
    {
      key: 'department_name',
      label: 'Departemen',
    },
    {
      key: 'position_name',
      label: 'Jabatan',
    },
    {
      key: 'employment_status',
      label: 'Status Kerja',
      render: (value: any) => {
        if (!value) return <span className="text-xs text-muted-foreground">-</span>;
        const colors: Record<string, string> = {
          'Tetap': 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
          'Kontrak': 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
          'Probation': 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
          'Magang': 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
        };
        return (
          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${colors[value] || 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'}`}>
            {value}
          </span>
        );
      },
    },
    {
      key: 'id',
      label: 'User Account',
      render: (value: any, row: Employee) => {
        const hasAccount = hasUserAccount(row.id);
        return hasAccount ? (
          <Badge variant="default" className="bg-green-600">
            <Shield className="w-3 h-3 mr-1" />
            Has Account
          </Badge>
        ) : (
          <Badge variant="secondary" className="bg-gray-400 text-gray-700">
            No Account
          </Badge>
        );
      },
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Data Karyawan"
        description="Kelola data karyawan dengan informasi pribadi dan pekerjaan"
        icon={Users}
      />

      <div className="grid grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="text-sm text-muted-foreground mb-1">Total Karyawan</div>
          <div className="text-2xl font-bold text-foreground">{data.length}</div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-muted-foreground mb-1">Karyawan Tetap</div>
          <div className="text-2xl font-bold text-green-600">
            {data.filter(e => e.employment_status === 'Tetap').length}
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-muted-foreground mb-1">Karyawan Kontrak</div>
          <div className="text-2xl font-bold text-blue-600">
            {data.filter(e => e.employment_status === 'Kontrak').length}
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-muted-foreground mb-1">Probation</div>
          <div className="text-2xl font-bold text-yellow-600">
            {data.filter(e => e.employment_status === 'Probation').length}
          </div>
        </Card>
      </div>

      <div className="flex justify-end">
        <Button onClick={() => setShowModal(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Tambah Karyawan
        </Button>
      </div>

      <DataTable
        data={data}
        columns={columns}
        loading={loading}
        onEdit={handleEdit}
        onDelete={handleDelete}
        customActions={[
          {
            icon: <UserPlus className="w-4 h-4" />,
            onClick: handleCreateUserAccount,
            label: 'Buat User',
            variant: 'default',
            className: 'bg-blue-600 hover:bg-blue-700 text-white',
            // Only show if employee doesn't have user account yet
            shouldShow: (row: Employee) => !hasUserAccount(row.id)
          }
        ] as any}
        getStatusColor={(row) => {
          try {
            // Custom status color untuk employees berdasarkan employment_status
            if (!row || !row.employment_status) return 'text-blue-600';
            const statusValue = row.employment_status;
            const status = typeof statusValue === 'string' ? statusValue.toLowerCase() : '';
            if (!status) return 'text-blue-600'; // default
            if (status === 'tetap') return 'text-green-600';
            if (status === 'kontrak') return 'text-blue-600';
            if (status === 'probation') return 'text-yellow-600';
            if (status === 'magang') return 'text-purple-600';
            return 'text-blue-600'; // default
          } catch (error) {
            console.error('Error in getStatusColor:', error, row);
            return 'text-blue-600'; // safe fallback
          }
        }}
      />

      <Dialog open={showModal} onOpenChange={(open) => {
        setShowModal(open);
        if (!open) resetForm();
      }}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">{editingItem ? 'Edit Karyawan' : 'Tambah Karyawan'}</DialogTitle>
            <p className="text-sm text-muted-foreground mt-1">
              {editingItem ? 'Perbarui informasi karyawan' : 'Lengkapi data karyawan baru. Field dengan tanda (*) wajib diisi.'}
            </p>
          </DialogHeader>

          <form onSubmit={handleSubmit}>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="personal" className="text-base">Informasi Pribadi</TabsTrigger>
                <TabsTrigger value="employment" className="text-base">Informasi Pekerjaan</TabsTrigger>
              </TabsList>

              <TabsContent value="personal" className="space-y-6 mt-4">
                {/* Row 1: NIK & Nama Lengkap */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="employee_code" className="text-sm font-semibold">NIK / No. Karyawan *</Label>
                    <Input
                      id="employee_code"
                      value={formData.employee_code}
                      onChange={(e) => setFormData({ ...formData, employee_code: e.target.value })}
                      placeholder="Contoh: EMP001"
                      required
                      className="h-11"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="full_name" className="text-sm font-semibold">Nama Lengkap *</Label>
                    <Input
                      id="full_name"
                      value={formData.full_name}
                      onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                      placeholder="Nama lengkap sesuai KTP"
                      required
                      className="h-11"
                    />
                  </div>
                </div>

                {/* Row 2: Username & No. KTP */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="username" className="text-sm font-semibold">Nama User *</Label>
                    <Input
                      id="username"
                      value={formData.username}
                      onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                      placeholder="Username untuk login"
                      required
                      className="h-11"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="id_number" className="text-sm font-semibold">No. KTP</Label>
                    <Input
                      id="id_number"
                      value={formData.id_number}
                      onChange={(e) => setFormData({ ...formData, id_number: e.target.value })}
                      placeholder="16 digit nomor KTP"
                      maxLength={16}
                      className="h-11"
                    />
                  </div>
                </div>

                {/* Row 3: Jenis Kelamin & Agama */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="gender" className="text-sm font-semibold">Jenis Kelamin</Label>
                    <Select
                      value={formData.gender}
                      onValueChange={(value) => setFormData({ ...formData, gender: value })}
                    >
                      <SelectTrigger className="h-11">
                        <SelectValue placeholder="Pilih jenis kelamin" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Laki-laki">Laki-laki</SelectItem>
                        <SelectItem value="Perempuan">Perempuan</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="religion" className="text-sm font-semibold">Agama</Label>
                    <Select
                      value={formData.religion}
                      onValueChange={(value) => setFormData({ ...formData, religion: value })}
                    >
                      <SelectTrigger className="h-11">
                        <SelectValue placeholder="Pilih agama" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Islam">Islam</SelectItem>
                        <SelectItem value="Kristen">Kristen</SelectItem>
                        <SelectItem value="Katolik">Katolik</SelectItem>
                        <SelectItem value="Hindu">Hindu</SelectItem>
                        <SelectItem value="Buddha">Buddha</SelectItem>
                        <SelectItem value="Konghucu">Konghucu</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Row 4: Tempat Lahir & Tanggal Lahir */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="place_of_birth" className="text-sm font-semibold">Tempat Lahir</Label>
                    <Input
                      id="place_of_birth"
                      value={formData.place_of_birth}
                      onChange={(e) => setFormData({ ...formData, place_of_birth: e.target.value })}
                      placeholder="Kota tempat lahir"
                      className="h-11"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="date_of_birth" className="text-sm font-semibold">Tanggal Lahir</Label>
                    <DatePicker
                      value={formData.date_of_birth}
                      onChange={(date) => setFormData({ ...formData, date_of_birth: date })}
                      placeholder="Pilih tanggal lahir"
                      className="h-11 w-full"
                    />
                  </div>
                </div>

                {/* Row 5: Status Pernikahan */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="marital_status" className="text-sm font-semibold">Status Pernikahan</Label>
                    <Select
                      value={formData.marital_status}
                      onValueChange={(value) => setFormData({ ...formData, marital_status: value })}
                    >
                      <SelectTrigger className="h-11">
                        <SelectValue placeholder="Pilih status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Belum Menikah">Belum Menikah</SelectItem>
                        <SelectItem value="Menikah">Menikah</SelectItem>
                        <SelectItem value="Cerai">Cerai</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Divider */}
                <div className="border-t pt-6">
                  <h3 className="text-sm font-semibold text-foreground mb-4">Informasi Kontak</h3>
                  
                  {/* Row 6: No. Telepon & Email */}
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <PhoneInput
                      value={formData.phone}
                      onChange={(value) => setFormData({ ...formData, phone: value })}
                      label="No. Telepon"
                      showCountrySelector={true}
                    />

                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-sm font-semibold">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder="email@example.com"
                        className="h-11"
                      />
                    </div>
                  </div>

                  {/* Row 7: Alamat (Full Width) */}
                  <div className="space-y-2">
                    <Label htmlFor="address" className="text-sm font-semibold">Alamat Lengkap</Label>
                    <Input
                      id="address"
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      placeholder="Alamat lengkap sesuai KTP"
                      className="h-11"
                    />
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="employment" className="space-y-6 mt-4">
                {/* Row 1: Perusahaan & Departemen */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="company_id" className="text-sm font-semibold">Perusahaan</Label>
                    <Select
                      value={formData.company_id}
                      onValueChange={(value) => setFormData({ ...formData, company_id: value })}
                    >
                      <SelectTrigger className="h-11">
                        <SelectValue placeholder="Pilih perusahaan" />
                      </SelectTrigger>
                      <SelectContent>
                        {companies.filter(c => c.id && typeof c.id === 'string' && c.id.trim() !== '').map((company) => (
                          <SelectItem key={company.id} value={company.id}>
                            {company.companyName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="department_code" className="text-sm font-semibold">Departemen</Label>
                    <Select
                      value={formData.department_code}
                      onValueChange={(value) => setFormData({ ...formData, department_code: value })}
                    >
                      <SelectTrigger className="h-11">
                        <SelectValue placeholder="Pilih departemen" />
                      </SelectTrigger>
                      <SelectContent>
                        {departments.filter(d => d.code && typeof d.code === 'string' && d.code.trim() !== '').map((dept) => (
                          <SelectItem key={dept.id} value={dept.code}>
                            {dept.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Row 2: Jabatan & Status Kepegawaian */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="position_code" className="text-sm font-semibold">Jabatan</Label>
                    <Select
                      value={formData.position_code}
                      onValueChange={(value) => setFormData({ ...formData, position_code: value })}
                    >
                      <SelectTrigger className="h-11">
                        <SelectValue placeholder="Pilih jabatan" />
                      </SelectTrigger>
                      <SelectContent>
                        {positions.filter(p => p.code && typeof p.code === 'string' && p.code.trim() !== '').map((position) => (
                          <SelectItem key={position.id} value={position.code}>
                            {position.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="employment_status" className="text-sm font-semibold">Status Kepegawaian</Label>
                    <Select
                      value={formData.employment_status}
                      onValueChange={(value) => setFormData({ ...formData, employment_status: value })}
                    >
                      <SelectTrigger className="h-11">
                        <SelectValue placeholder="Pilih status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Tetap">Tetap</SelectItem>
                        <SelectItem value="Kontrak">Kontrak</SelectItem>
                        <SelectItem value="Probation">Probation</SelectItem>
                        <SelectItem value="Magang">Magang</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Row 3: Tanggal Bergabung */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="join_date" className="text-sm font-semibold">Tanggal Bergabung</Label>
                    <DatePicker
                      value={formData.join_date}
                      onChange={(date) => setFormData({ ...formData, join_date: date })}
                      placeholder="Pilih tanggal bergabung"
                      className="h-11 w-full"
                    />
                  </div>
                </div>

                {/* Spacer untuk menyamakan tinggi dengan tab pribadi */}
                <div className="space-y-6">
                  <div className="h-11"></div>
                  <div className="h-11"></div>
                </div>

                {/* Info helper untuk tab pekerjaan */}
                <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-white text-xs font-bold">i</span>
                    </div>
                    <div className="text-sm text-blue-900 dark:text-blue-100">
                      <p className="font-semibold mb-1">Informasi Pekerjaan</p>
                      <p className="text-blue-700 dark:text-blue-300">
                        Data perusahaan, departemen, dan jabatan bersifat opsional. 
                        Anda dapat mengisi field ini nanti atau membiarkannya kosong jika karyawan belum memiliki penempatan tetap.
                      </p>
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>

            <div className="flex justify-end gap-3 pt-6 border-t mt-8">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowModal(false);
                  resetForm();
                }}
                className="px-6"
              >
                Batal
              </Button>
              <Button type="submit" className="px-6">
                {editingItem ? 'Perbarui Data' : 'Simpan Data'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Create User Account Dialog */}
      <Dialog open={showCreateUserModal} onOpenChange={setShowCreateUserModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="w-5 h-5" />
              Buat User Account
            </DialogTitle>
          </DialogHeader>

          {selectedEmployee && (
            <div className="space-y-4 py-4">
              <div className="bg-muted p-3 rounded-lg">
                <div className="text-sm text-muted-foreground mb-1">Karyawan</div>
                <div className="font-semibold">{selectedEmployee.full_name}</div>
                <div className="text-sm text-muted-foreground">NIK: {selectedEmployee.employee_code}</div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="username">Username *</Label>
                <Input
                  id="username"
                  value={userForm.username}
                  onChange={(e) => setUserForm({ ...userForm, username: e.target.value })}
                  placeholder="username"
                />
                <p className="text-xs text-muted-foreground">
                  Username untuk login ke sistem
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={userForm.email}
                  onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
                  placeholder="email@example.com"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password *</Label>
                <Input
                  id="password"
                  type="password"
                  value={userForm.password}
                  onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
                  placeholder="Minimal 6 karakter"
                />
                <p className="text-xs text-muted-foreground">
                  Minimal 6 karakter
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="role">Role *</Label>
                <Select
                  value={userForm.role}
                  onValueChange={(value) => setUserForm({ ...userForm, role: value })}
                >
                  <SelectTrigger id="role">
                    <SelectValue placeholder="Pilih role..." />
                  </SelectTrigger>
                  <SelectContent>
                    {roles.filter(r => r.name && typeof r.name === 'string' && r.name.trim() !== '').map((role) => (
                      <SelectItem key={role.name} value={role.name}>
                        {role.display_name}
                        <span className="text-xs text-muted-foreground ml-2">
                          ({role.permissions?.length || 0} permissions)
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Role menentukan hak akses user di sistem
                </p>
              </div>

              <div className="bg-yellow-50 dark:bg-yellow-950/30 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3">
                <div className="flex items-start gap-2">
                  <div className="w-4 h-4 rounded-full bg-yellow-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-white text-xs font-bold">!</span>
                  </div>
                  <div className="text-xs text-yellow-800 dark:text-yellow-200">
                    <p className="font-medium mb-1">Penting:</p>
                    <ul className="list-disc list-inside space-y-0.5">
                      <li>Username harus unik (tidak boleh sama dengan user lain)</li>
                      <li>Email harus unik dan valid</li>
                      <li>Password akan disimpan dalam bentuk plain text</li>
                      <li>User dapat langsung login setelah dibuat</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowCreateUserModal(false);
                setSelectedEmployee(null);
                setUserForm({ username: '', email: '', password: '', role: 'staff' });
              }}
            >
              Batal
            </Button>
            <Button onClick={handleSaveUserAccount} className="bg-blue-600 hover:bg-blue-700">
              <UserPlus className="w-4 h-4 mr-2" />
              Buat User Account
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}