import { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';
import { Checkbox } from '../../components/ui/checkbox';
import { PageHeader } from '../../components/page-header';
import { DataTable } from '../../components/data-table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../../components/ui/dialog';
import { toast } from 'sonner';
import { api } from '../../lib/api';
import { formatDate } from '../../components/ui/utils';

interface ProductType {
  id: string;
  code: string;
  name: string;
  jenisOrder: string[];
  jenisKemasan: string[];
  notes: string;
  createdAt: string;
}

const JENIS_ORDER_OPTIONS = ['Offset', 'Rotogravure', 'Kantong Teh'];
const JENIS_KEMASAN_OPTIONS = ['Flexibel', 'Boks', 'Roto', 'Polos'];

export function ProductTypes() {
  const [data, setData] = useState<ProductType[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ProductType | null>(null);
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    jenisOrder: [] as string[],
    jenisKemasan: [] as string[],
    notes: '',
  });

  const columns = [
    { key: 'code', label: 'Kode Produk' },
    { key: 'name', label: 'Nama Jenis Produk' },
    {
      key: 'jenisOrder',
      label: 'Jenis Order',
      render: (value: string[]) => value && value.length > 0 ? value.join(', ') : '-',
    },
    {
      key: 'jenisKemasan',
      label: 'Jenis Kemasan',
      render: (value: string[]) => value && value.length > 0 ? value.join(', ') : '-',
    },
    { key: 'notes', label: 'Catatan', render: (value: string) => value || '-' },
    {
      key: 'createdAt',
      label: 'Tanggal Dibuat',
      render: (value: string) => formatDate(value),
    },
  ];

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const result = await api.getProductTypes();
      setData(result || []);
    } catch (error) {
      console.error('Error fetching product types:', error);
      toast.error('Gagal memuat data jenis produk');
    } finally {
      setLoading(false);
    }
  };

  const generateProductCode = () => {
    if (!data || data.length === 0) {
      return 'JP-001';
    }

    const existingCodes = data
      .map(item => item.code)
      .filter(code => code && code.startsWith('JP-'))
      .map(code => {
        const match = code.match(/JP-(\d+)/);
        return match ? parseInt(match[1], 10) : 0;
      });

    const maxNumber = existingCodes.length > 0 ? Math.max(...existingCodes) : 0;
    const nextNumber = maxNumber + 1;
    return `JP-${nextNumber.toString().padStart(3, '0')}`;
  };

  const handleAdd = () => {
    setEditingItem(null);
    setFormData({
      code: generateProductCode(),
      name: '',
      jenisOrder: [],
      jenisKemasan: [],
      notes: '',
    });
    setDialogOpen(true);
  };

  const handleEdit = (item: ProductType) => {
    setEditingItem(item);
    setFormData({
      code: item.code,
      name: item.name,
      jenisOrder: item.jenisOrder || [],
      jenisKemasan: item.jenisKemasan || [],
      notes: item.notes || '',
    });
    setDialogOpen(true);
  };

  const handleDelete = async (item: ProductType) => {
    if (!confirm('Apakah Anda yakin ingin menghapus jenis produk ini?')) return;

    try {
      await api.deleteProductType(item.id);
      toast.success('Jenis produk berhasil dihapus');
      fetchData();
    } catch (error) {
      console.error('Error deleting product type:', error);
      toast.error('Gagal menghapus jenis produk');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast.error('Nama jenis produk harus diisi');
      return;
    }

    try {
      if (editingItem) {
        await api.updateProductType(editingItem.id, formData);
        toast.success('Jenis produk berhasil diperbarui');
      } else {
        await api.createProductType(formData);
        toast.success('Jenis produk berhasil ditambahkan');
      }
      setDialogOpen(false);
      fetchData();
    } catch (error) {
      console.error('Error saving product type:', error);
      toast.error('Gagal menyimpan jenis produk');
    }
  };

  const toggleJenisOrder = (option: string) => {
    setFormData(prev => ({
      ...prev,
      jenisOrder: prev.jenisOrder.includes(option)
        ? prev.jenisOrder.filter(item => item !== option)
        : [...prev.jenisOrder, option]
    }));
  };

  const toggleJenisKemasan = (option: string) => {
    setFormData(prev => ({
      ...prev,
      jenisKemasan: prev.jenisKemasan.includes(option)
        ? prev.jenisKemasan.filter(item => item !== option)
        : [...prev.jenisKemasan, option]
    }));
  };

  return (
    <div className="space-y-4">
      <PageHeader
        title="Master Jenis Produk"
        description="Kelola data jenis produk"
        breadcrumbs={[
          { label: 'Dashboard', href: '/' },
          { label: 'Master' },
          { label: 'Jenis Produk' },
        ]}
        actions={
          <Button onClick={handleAdd}>
            <Plus className="w-4 h-4 mr-2" />
            Tambah Jenis Produk
          </Button>
        }
      />

      <DataTable
        columns={columns}
        data={data}
        loading={loading}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingItem ? 'Edit Jenis Produk' : 'Tambah Jenis Produk'}</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Kode Produk */}
            <div className="grid grid-cols-[180px_1fr] gap-4 items-center">
              <Label htmlFor="code" className="text-right">Kode Produk</Label>
              <Input
                id="code"
                value={formData.code}
                readOnly
                className="bg-muted"
              />
            </div>

            {/* Nama Jenis Produk */}
            <div className="grid grid-cols-[180px_1fr] gap-4 items-center">
              <Label htmlFor="name" className="text-right">Nama Jenis Produk *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Contoh: Stand Pouch"
                required
              />
            </div>

            {/* Jenis Order */}
            <div className="grid grid-cols-[180px_1fr] gap-4 items-start">
              <Label className="text-right pt-2">Jenis Order</Label>
              <div className="space-y-2">
                {JENIS_ORDER_OPTIONS.map((option) => (
                  <div key={option} className="flex items-center space-x-2">
                    <Checkbox
                      id={`order-${option}`}
                      checked={formData.jenisOrder.includes(option)}
                      onCheckedChange={() => toggleJenisOrder(option)}
                    />
                    <label
                      htmlFor={`order-${option}`}
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                    >
                      {option}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            {/* Jenis Kemasan */}
            <div className="grid grid-cols-[180px_1fr] gap-4 items-start">
              <Label className="text-right pt-2">Jenis Kemasan</Label>
              <div className="space-y-2">
                {JENIS_KEMASAN_OPTIONS.map((option) => (
                  <div key={option} className="flex items-center space-x-2">
                    <Checkbox
                      id={`kemasan-${option}`}
                      checked={formData.jenisKemasan.includes(option)}
                      onCheckedChange={() => toggleJenisKemasan(option)}
                    />
                    <label
                      htmlFor={`kemasan-${option}`}
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                    >
                      {option}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            {/* Catatan */}
            <div className="grid grid-cols-[180px_1fr] gap-4 items-start">
              <Label htmlFor="notes" className="text-right pt-2">Catatan</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Catatan tambahan (opsional)"
                rows={3}
              />
            </div>

            {/* Buttons */}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Batal
              </Button>
              <Button type="submit">
                {editingItem ? 'Update' : 'Simpan'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
