import { useState, useEffect } from 'react';
import { Plus, Factory, Search, Edit2, Trash2, Save, X } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { DataTable } from '../../components/data-table';
import { PageHeader } from '../../components/page-header';
import { Card } from '../../components/ui/card';
import { toast } from 'sonner';
import { api } from '../../lib/api';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '../../components/ui/dialog';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';

interface IndustryCategory {
  id: string;
  code: string;
  name: string;
  description?: string;
  createdAt: string;
}

export function IndustryCategories() {
  const [data, setData] = useState<IndustryCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<IndustryCategory | null>(null);
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    description: '',
  });

  const columns = [
    {
      key: 'code',
      label: 'Kode',
      render: (value: string) => (
        <span className="font-mono font-semibold text-primary">{value}</span>
      ),
    },
    {
      key: 'name',
      label: 'Nama Kategori Industri',
      render: (value: string) => (
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
            <Factory className="w-4 h-4 text-blue-600" />
          </div>
          <span className="font-medium">{value}</span>
        </div>
      ),
    },
    {
      key: 'description',
      label: 'Deskripsi',
      render: (value: string) => (
        <span className="text-sm text-muted-foreground">{value || '-'}</span>
      ),
    },
    {
      key: 'actions',
      label: 'Aksi',
      render: (_: any, row: IndustryCategory) => (
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleEdit(row)}
          >
            <Edit2 className="w-4 h-4 mr-1" />
            Edit
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleDelete(row.id)}
            className="text-red-600 hover:text-red-700"
          >
            <Trash2 className="w-4 h-4 mr-1" />
            Hapus
          </Button>
        </div>
      ),
    },
  ];

  const loadData = async () => {
    try {
      setLoading(true);
      const result = await api.getIndustryCategories();
      setData(result);
    } catch (error) {
      console.error('Error loading industry categories:', error);
      toast.error('Gagal memuat data kategori industri');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAdd = () => {
    setEditingItem(null);
    setFormData({
      code: '',
      name: '',
      description: '',
    });
    setIsDialogOpen(true);
  };

  const handleEdit = (item: IndustryCategory) => {
    setEditingItem(item);
    setFormData({
      code: item.code,
      name: item.name,
      description: item.description || '',
    });
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.code || !formData.name) {
      toast.error('Kode dan Nama wajib diisi');
      return;
    }

    try {
      if (editingItem) {
        await api.updateIndustryCategory(editingItem.id, formData);
        toast.success('Kategori industri berhasil diupdate');
      } else {
        await api.createIndustryCategory(formData);
        toast.success('Kategori industri berhasil ditambahkan');
      }
      setIsDialogOpen(false);
      loadData();
    } catch (error) {
      console.error('Error saving industry category:', error);
      toast.error('Gagal menyimpan kategori industri');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus kategori industri ini?')) {
      return;
    }

    try {
      await api.deleteIndustryCategory(id);
      toast.success('Kategori industri berhasil dihapus');
      loadData();
    } catch (error) {
      console.error('Error deleting industry category:', error);
      toast.error('Gagal menghapus kategori industri');
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Master Kategori Industri"
        description="Kelola kategori industri untuk customer"
      />

      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <input
                type="text"
                placeholder="Cari kategori..."
                className="pl-10 pr-4 py-2 border rounded-lg w-64 text-sm"
              />
            </div>
          </div>
          <Button onClick={handleAdd}>
            <Plus className="w-4 h-4 mr-2" />
            Tambah Kategori Industri
          </Button>
        </div>

        <DataTable
          columns={columns}
          data={data}
          loading={loading}
        />
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingItem ? 'Edit Kategori Industri' : 'Tambah Kategori Industri'}
            </DialogTitle>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="code">
                  Kode <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="code"
                  placeholder="Contoh: IND-001"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="name">
                  Nama Kategori <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="name"
                  placeholder="Contoh: Makanan & Minuman"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Deskripsi</Label>
              <Textarea
                id="description"
                placeholder="Deskripsi kategori industri..."
                rows={3}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              <X className="w-4 h-4 mr-2" />
              Batal
            </Button>
            <Button onClick={handleSave}>
              <Save className="w-4 h-4 mr-2" />
              Simpan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
