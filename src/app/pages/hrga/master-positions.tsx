import { useState, useEffect } from 'react';
import { Plus, Briefcase } from 'lucide-react';
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

interface Position {
  id: string;
  code: string;
  name: string;
  departmentCode: string | null;
  departmentName?: string; // Tambahan untuk display
  parentCode: string | null; // Parent jabatan untuk hierarki
  parentName?: string; // Tambahan untuk display
  level: number;
  requirements: string;
  status: string;
  createdAt: string;
}

export function MasterPositions() {
  const [positions, setPositions] = useState<Position[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPos, setEditingPos] = useState<Position | null>(null);
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    departmentCode: 'none',
    parentCode: 'none',
    level: '1',
    requirements: '',
    status: 'Active',
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [positionsData, deptsData] = await Promise.all([
        api.getPositions(),
        api.getDepartments()
      ]);
      
      // Map position data dengan department name dan parent name
      const positionsWithNames = (positionsData || []).map((pos: Position) => {
        const dept = (deptsData || []).find((d: any) => d.code === pos.departmentCode);
        const parent = (positionsData || []).find((p: any) => p.code === pos.parentCode);
        return {
          ...pos,
          departmentName: dept?.name || pos.departmentCode || '-',
          parentName: parent?.name || pos.parentCode || '-'
        };
      });
      
      setPositions(positionsWithNames);
      setDepartments(deptsData || []);
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Gagal memuat data');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (pos?: Position) => {
    if (pos) {
      setEditingPos(pos);
      setFormData({
        code: pos.code,
        name: pos.name,
        departmentCode: pos.departmentCode || 'none',
        parentCode: pos.parentCode || 'none',
        level: pos.level.toString(),
        requirements: pos.requirements,
        status: pos.status,
      });
    } else {
      const newCode = generatePositionCode();
      setEditingPos(null);
      setFormData({
        code: newCode,
        name: '',
        departmentCode: 'none',
        parentCode: 'none',
        level: '1',
        requirements: '',
        status: 'Active',
      });
    }
    setIsModalOpen(true);
  };

  // Generate kode posisi otomatis dengan format POS-001, POS-002, dst
  const generatePositionCode = (): string => {
    if (positions.length === 0) {
      return 'POS-001';
    }

    // Ambil semua kode yang dimulai dengan POS-
    const posCodes = positions
      .map(p => p.code)
      .filter(code => code.startsWith('POS-'))
      .map(code => {
        const num = parseInt(code.replace('POS-', ''));
        return isNaN(num) ? 0 : num;
      });

    // Cari nomor terbesar
    const maxNum = posCodes.length > 0 ? Math.max(...posCodes) : 0;
    const nextNum = maxNum + 1;

    // Format dengan leading zeros (3 digit)
    return `POS-${nextNum.toString().padStart(3, '0')}`;
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingPos(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.code || !formData.name) {
      toast.error('Mohon lengkapi data yang wajib diisi');
      return;
    }

    try {
      const payload = {
        code: formData.code,
        name: formData.name,
        departmentCode: (formData.departmentCode && formData.departmentCode !== 'none') ? formData.departmentCode : null,
        parentCode: (formData.parentCode && formData.parentCode !== 'none') ? formData.parentCode : null,
        level: parseInt(formData.level),
        requirements: formData.requirements,
        status: formData.status,
      };

      if (editingPos) {
        await api.updatePosition(editingPos.id, payload);
        toast.success('Posisi berhasil diperbarui');
      } else {
        await api.createPosition(payload);
        toast.success('Posisi berhasil ditambahkan');
      }

      handleCloseModal();
      loadData();
    } catch (error) {
      console.error('Error saving position:', error);
      toast.error('Gagal menyimpan posisi');
    }
  };

  const handleDelete = async (pos: Position) => {
    if (!confirm(`Yakin ingin menghapus posisi "${pos.name}"?`)) {
      return;
    }

    try {
      await api.deletePosition(pos.id);
      toast.success('Posisi berhasil dihapus');
      loadData();
    } catch (error) {
      console.error('Error deleting position:', error);
      toast.error('Gagal menghapus posisi');
    }
  };

  const handleView = (pos: Position) => {
    handleOpenModal(pos);
  };

  const getStatusColor = (row: Position) => {
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
      label: 'Nama Posisi',
      render: (value: string) => <div className="font-medium">{value}</div>
    },
    {
      key: 'departmentName',
      label: 'Departemen',
      render: (value: string, row: Position) => {
        if (!row.departmentCode) return <div className="text-sm text-muted-foreground">-</div>;
        return (
          <div className="text-sm">
            <div className="font-mono text-xs text-muted-foreground">{row.departmentCode}</div>
            <div className="font-medium">{value}</div>
          </div>
        );
      }
    },
    {
      key: 'parentName',
      label: 'Parent Jabatan',
      render: (value: string, row: Position) => {
        if (!row.parentCode) return <div className="text-sm text-muted-foreground">-</div>;
        return (
          <div className="text-sm">
            <div className="font-mono text-xs text-muted-foreground">{row.parentCode}</div>
            <div className="font-medium">{value}</div>
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
      key: 'requirements',
      label: 'Persyaratan',
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
        title="Master Posisi/Jabatan"
        description="Kelola data posisi dan jabatan karyawan"
        breadcrumbs={[
          { label: 'Dashboard', href: '/' },
          { label: 'HRGA' },
          { label: 'Master Posisi/Jabatan' },
        ]}
        actions={
          <Button onClick={() => handleOpenModal()}>
            <Plus className="w-4 h-4 mr-2" />
            Tambah Posisi
          </Button>
        }
      />

      <Card>
        {loading ? (
          <div className="p-8 text-center">
            <p className="text-muted-foreground">Memuat data...</p>
          </div>
        ) : positions.length === 0 ? (
          <div className="p-8 text-center">
            <Briefcase className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
            <p className="text-muted-foreground mb-2">Belum ada posisi/jabatan</p>
            <p className="text-sm text-muted-foreground mb-4">Klik tombol di atas untuk menambah posisi</p>
          </div>
        ) : (
          <DataTable
            columns={columns}
            data={positions}
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
              {editingPos ? 'Edit Posisi/Jabatan' : 'Tambah Posisi/Jabatan'}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="code">
                  Kode Posisi <span className="text-destructive">*</span>
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
                  Nama Posisi <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Sales Manager"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="departmentCode">Departemen</Label>
                <Select
                  value={formData.departmentCode}
                  onValueChange={(value) => setFormData({ ...formData, departmentCode: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Tidak ada (General)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Tidak ada (General)</SelectItem>
                    {departments
                      .filter(d => d.code && typeof d.code === 'string' && d.code.trim() !== '')
                      .sort((a, b) => {
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
              </div>

              <div className="space-y-2">
                <Label htmlFor="parentCode">Parent Jabatan</Label>
                <Select
                  value={formData.parentCode}
                  onValueChange={(value) => setFormData({ ...formData, parentCode: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Tidak ada (Posisi Puncak)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Tidak ada (Posisi Puncak)</SelectItem>
                    {positions
                      .filter((p) => p.code && typeof p.code === 'string' && p.code.trim() !== '' && p.code !== formData.code) // Jangan tampilkan posisi yang sedang diedit
                      .sort((a, b) => {
                        if (a.level !== b.level) return a.level - b.level;
                        return a.code.localeCompare(b.code);
                      })
                      .map((pos) => (
                        <SelectItem key={pos.id} value={pos.code}>
                          <span className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground">L{pos.level}</span>
                            <span className="font-mono text-xs">{pos.code}</span>
                            <span>-</span>
                            <span>{pos.name}</span>
                          </span>
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Pilih jabatan atasan untuk membuat hierarki
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="level">Level Hierarki</Label>
                <Select
                  value={formData.level}
                  onValueChange={(value) => setFormData({ ...formData, level: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">Level 1 (C-Level/Direktur)</SelectItem>
                    <SelectItem value="2">Level 2 (Manager)</SelectItem>
                    <SelectItem value="3">Level 3 (Supervisor)</SelectItem>
                    <SelectItem value="4">Level 4 (Staff)</SelectItem>
                    <SelectItem value="5">Level 5 (Operator)</SelectItem>
                  </SelectContent>
                </Select>
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
              <Label htmlFor="requirements">Persyaratan</Label>
              <Textarea
                id="requirements"
                value={formData.requirements}
                onChange={(e) => setFormData({ ...formData, requirements: e.target.value })}
                placeholder="e.g. S1 Manajemen/Teknik, Min 5 tahun pengalaman di bidang sales, Mampu berbahasa Inggris aktif"
                rows={3}
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleCloseModal}>
                Batal
              </Button>
              <Button type="submit">
                {editingPos ? 'Simpan Perubahan' : 'Tambah Posisi'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}