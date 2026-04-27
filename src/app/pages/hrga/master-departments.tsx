import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Building2 } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { PageHeader } from '../../components/page-header';
import { Card } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Textarea } from '../../components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../../components/ui/dialog';
import { DataTable } from '../../components/data-table';
import { Badge } from '../../components/ui/badge';
import { toast } from 'sonner';
import { api } from '../../lib/api';

interface Department {
  id: string;
  code: string;
  name: string;
  companyCode: string;
  companyName?: string; // Tambahan untuk display
  parentCode: string | null;
  level: number;
  notes: string;
  status: string;
  createdAt: string;
}

interface Company {
  id: string;
  companyName: string;
  address: string;
  phone?: string;
  email?: string;
}

export function MasterDepartments() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDept, setEditingDept] = useState<Department | null>(null);
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    companyCode: '',
    parentCode: 'none',
    level: '1',
    notes: '',
    status: 'Active',
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [deptsData, companiesData] = await Promise.all([
        api.getDepartments(),
        api.getCompanies()
      ]);
      
      // Map department data dengan company name
      const deptsWithCompanyName = (deptsData || []).map((dept: Department) => {
        const company = (companiesData || []).find((c: Company) => c.id === dept.companyCode);
        return {
          ...dept,
          companyName: company?.companyName || dept.companyCode
        };
      });
      
      setDepartments(deptsWithCompanyName);
      setCompanies(companiesData || []);
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Gagal memuat data');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (dept?: Department) => {
    if (dept) {
      setEditingDept(dept);
      setFormData({
        code: dept.code,
        name: dept.name,
        companyCode: dept.companyCode,
        parentCode: dept.parentCode || 'none',
        level: dept.level.toString(),
        notes: dept.notes,
        status: dept.status,
      });
    } else {
      // Generate kode otomatis untuk departemen baru
      const newCode = generateDepartmentCode();
      setEditingDept(null);
      setFormData({
        code: newCode,
        name: '',
        companyCode: '',
        parentCode: 'none',
        level: '1',
        notes: '',
        status: 'Active',
      });
    }
    setIsModalOpen(true);
  };

  // Generate kode departemen otomatis dengan format DEP-001, DEP-002, dst
  const generateDepartmentCode = (): string => {
    if (departments.length === 0) {
      return 'DEP-001';
    }

    // Ambil semua kode yang dimulai dengan DEP-
    const depCodes = departments
      .map(d => d.code)
      .filter(code => code.startsWith('DEP-'))
      .map(code => {
        const num = parseInt(code.replace('DEP-', ''));
        return isNaN(num) ? 0 : num;
      });

    // Cari nomor terbesar
    const maxNum = depCodes.length > 0 ? Math.max(...depCodes) : 0;
    const nextNum = maxNum + 1;

    // Format dengan leading zeros (3 digit)
    return `DEP-${nextNum.toString().padStart(3, '0')}`;
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingDept(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.code || !formData.name || !formData.companyCode) {
      toast.error('Mohon lengkapi data yang wajib diisi');
      return;
    }

    try {
      const payload = {
        code: formData.code,
        name: formData.name,
        companyCode: formData.companyCode,
        parentCode: (formData.parentCode && formData.parentCode !== 'none') ? formData.parentCode : null,
        level: parseInt(formData.level),
        notes: formData.notes,
        status: formData.status,
      };

      if (editingDept) {
        await api.update(editingDept.id, payload);
        toast.success('Departemen berhasil diperbarui');
      } else {
        await api.createDepartment(payload);
        toast.success('Departemen berhasil ditambahkan');
      }

      handleCloseModal();
      loadData();
    } catch (error) {
      console.error('Error saving department:', error);
      toast.error('Gagal menyimpan departemen');
    }
  };

  const handleDelete = async (dept: Department) => {
    if (!confirm(`Yakin ingin menghapus departemen "${dept.name}"?`)) {
      return;
    }

    try {
      await api.delete(dept.id);
      toast.success('Departemen berhasil dihapus');
      loadData();
    } catch (error) {
      console.error('Error deleting department:', error);
      toast.error('Gagal menghapus departemen');
    }
  };

  // Get available parent departments
  // Tampilkan semua departemen yang bisa jadi parent
  const getAvailableParents = () => {
    return departments.filter(d => {
      // Jika sedang edit, jangan tampilkan diri sendiri
      if (editingDept && d.code === editingDept.code) return false;
      
      // Filter berdasarkan perusahaan yang sama (jika sudah pilih perusahaan)
      if (formData.companyCode && d.companyCode !== formData.companyCode) return false;
      
      // Jangan tampilkan departemen yang memiliki current dept sebagai parent
      // (untuk mencegah circular reference saat edit)
      if (editingDept && d.parentCode === editingDept.code) return false;
      
      return true;
    });
  };

  // Auto-calculate level based on parent selection
  const handleParentChange = (value: string) => {
    let newLevel = '1';
    if (value !== 'none') {
      const parent = departments.find(d => d.code === value);
      if (parent) {
        newLevel = (parent.level + 1).toString();
      }
    }
    setFormData({ ...formData, parentCode: value, level: newLevel });
  };

  const handleView = (dept: Department) => {
    handleOpenModal(dept);
  };

  const getStatusColor = (row: Department) => {
    if (row.status === 'Active') return 'text-green-600';
    if (row.status === 'Inactive') return 'text-gray-400';
    return 'text-blue-600';
  };

  const columns = [
    {
      key: 'code',
      label: 'Kode',
      render: (value: string) => <div className="font-mono text-sm">{value}</div>
    },
    {
      key: 'name',
      label: 'Nama Departemen',
      render: (value: string) => <div className="font-medium">{value}</div>
    },
    {
      key: 'companyName',
      label: 'Perusahaan',
      render: (value: string) => <div className="text-sm">{value}</div>
    },
    {
      key: 'parentCode',
      label: 'Parent',
      render: (value: string | null, row: Department) => {
        if (!value) return <div className="text-sm text-muted-foreground">-</div>;
        const parent = departments.find(d => d.code === value);
        return (
          <div className="text-sm">
            <div className="font-mono text-xs text-muted-foreground">{value}</div>
            <div className="font-medium">{parent?.name || '-'}</div>
          </div>
        );
      }
    },
    {
      key: 'level',
      label: 'Level',
      render: (value: number) => <Badge variant="outline">Level {value}</Badge>
    },
    {
      key: 'notes',
      label: 'Catatan',
      render: (value: string) => <div className="text-sm text-muted-foreground max-w-xs truncate">{value || '-'}</div>
    },
    {
      key: 'status',
      label: 'Status',
      render: (value: string) => <Badge variant={value === 'Active' ? 'default' : 'secondary'}>{value}</Badge>
    },
  ];

  return (
    <div className="space-y-4 pb-4">
      <PageHeader
        title="Master Departemen"
        description="Kelola data departemen organisasi"
        breadcrumbs={[
          { label: 'Dashboard', href: '/' },
          { label: 'HRGA' },
          { label: 'Master Departemen' },
        ]}
        actions={
          <Button onClick={() => handleOpenModal()}>
            <Plus className="w-4 h-4 mr-2" />
            Tambah Departemen
          </Button>
        }
      />

      <Card>
        {loading ? (
          <div className="p-8 text-center">
            <p className="text-muted-foreground">Memuat data...</p>
          </div>
        ) : departments.length === 0 ? (
          <div className="p-8 text-center">
            <Building2 className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
            <p className="text-muted-foreground mb-2">Belum ada departemen</p>
            <p className="text-sm text-muted-foreground mb-4">Klik tombol di atas untuk menambah departemen</p>
          </div>
        ) : (
          <DataTable
            columns={columns}
            data={departments}
            loading={loading}
            onView={handleView}
            onEdit={handleOpenModal}
            onDelete={handleDelete}
            getStatusColor={getStatusColor}
          />
        )}
      </Card>

      {/* Form Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingDept ? 'Edit Departemen' : 'Tambah Departemen'}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="code">
                  Kode Departemen <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="code"
                  value={formData.code}
                  disabled
                  className="bg-muted font-mono"
                />
                <p className="text-xs text-muted-foreground">
                  Kode otomatis: {formData.code}
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="name">
                  Nama Departemen <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Sales & Marketing"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="companyCode">
                  Perusahaan <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={formData.companyCode}
                  onValueChange={(value) => setFormData({ ...formData, companyCode: value })}
                >
                  <SelectTrigger>
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
                <Label htmlFor="parentCode">Parent Departemen</Label>
                <Select
                  value={formData.parentCode}
                  onValueChange={handleParentChange}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Tidak ada (Level 1)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Tidak ada (Level 1)</SelectItem>
                    {getAvailableParents()
                      .filter(d => d.code && typeof d.code === 'string' && d.code.trim() !== '')
                      .sort((a, b) => {
                        // Sort by level first, then by code
                        if (a.level !== b.level) return a.level - b.level;
                        return a.code.localeCompare(b.code);
                      })
                      .map((dept) => (
                        <SelectItem key={dept.id} value={dept.code}>
                          <span className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground">L{dept.level}</span>
                            <span className="font-mono text-xs">{dept.code}</span>
                            <span>-</span>
                            <span>{dept.name}</span>
                          </span>
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  {formData.companyCode 
                    ? `${getAvailableParents().length} departemen tersedia`
                    : 'Pilih perusahaan terlebih dahulu'}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="level">Level (otomatis)</Label>
                <Input
                  id="level"
                  value={`Level ${formData.level}`}
                  disabled
                  className="bg-muted"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => setFormData({ ...formData, status: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Active">Active</SelectItem>
                    <SelectItem value="Inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Catatan</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Catatan tambahan tentang departemen"
                rows={3}
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleCloseModal}>
                Batal
              </Button>
              <Button type="submit">
                {editingDept ? 'Simpan Perubahan' : 'Tambah Departemen'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}