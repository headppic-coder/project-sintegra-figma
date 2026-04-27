import { useState, useEffect } from 'react';
import { PageHeader } from '../../components/page-header';
import { Button } from '../../components/ui/button';
import { Card } from '../../components/ui/card';
import { api } from '../../lib/api';
import { Package, Plus, Pencil, Trash2, X } from 'lucide-react';
import { toast } from 'sonner';
import { DataTable } from '../../components/data-table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../../components/ui/dialog';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Textarea } from '../../components/ui/textarea';

export default function PriceFormulaPolos() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [editingItem, setEditingItem] = useState<any | null>(null);
  const [productTypes, setProductTypes] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    product_name: '',
    customer_name: '',
    package_type: '', // Jenis Kemasan - connected to product types
    length: '',
    width: '',
    material_name: '',
    material_thickness: '',
    quantity: '',
    notes: '',
    status: 'draft'
  });

  useEffect(() => {
    fetchData();
    fetchProductTypes();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const formulas = await api.getPriceFormulasPolos();
      setData(formulas);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Gagal memuat data');
    } finally {
      setLoading(false);
    }
  };

  const fetchProductTypes = async () => {
    try {
      const types = await api.getProductTypes();
      setProductTypes(types || []);
    } catch (error) {
      console.error('Error fetching product types:', error);
    }
  };

  const handleAdd = () => {
    setEditingItem(null);
    setFormData({
      product_name: '',
      customer_name: '',
      package_type: '',
      length: '',
      width: '',
      material_name: '',
      material_thickness: '',
      quantity: '',
      notes: '',
      status: 'draft'
    });
    setShowDialog(true);
  };

  const handleEdit = (item: any) => {
    setEditingItem(item);
    setFormData({
      product_name: item.product_name || '',
      customer_name: item.customer_name || '',
      package_type: item.package_type || '',
      length: item.length || '',
      width: item.width || '',
      material_name: item.material_name || '',
      material_thickness: item.material_thickness || '',
      quantity: item.quantity || '',
      notes: item.notes || '',
      status: item.status || 'draft'
    });
    setShowDialog(true);
  };

  const handleSave = async () => {
    try {
      if (!formData.product_name || !formData.package_type) {
        toast.error('Nama Produk dan Jenis Kemasan wajib diisi');
        return;
      }

      const dataToSave = {
        ...formData,
        length: formData.length ? parseFloat(formData.length) : 0,
        width: formData.width ? parseFloat(formData.width) : 0,
        material_thickness: formData.material_thickness ? parseFloat(formData.material_thickness) : 0,
        quantity: formData.quantity ? parseInt(formData.quantity) : 0,
      };

      if (editingItem) {
        await api.updatePriceFormulaPolos(editingItem.id, dataToSave);
        toast.success('Formula berhasil diperbarui');
      } else {
        await api.createPriceFormulaPolos(dataToSave);
        toast.success('Formula berhasil ditambahkan');
      }

      setShowDialog(false);
      fetchData();
    } catch (error) {
      console.error('Error saving formula:', error);
      toast.error('Gagal menyimpan formula');
    }
  };

  const handleDelete = async (item: any) => {
    if (!confirm('Apakah Anda yakin ingin menghapus formula ini?')) return;

    try {
      await api.deletePriceFormulaPolos(item.id);
      toast.success('Formula berhasil dihapus');
      fetchData();
    } catch (error) {
      console.error('Error deleting formula:', error);
      toast.error('Gagal menghapus formula');
    }
  };

  const columns = [
    {
      header: 'Kode',
      accessorKey: 'code',
      render: (value: string) => (
        <code className="text-xs bg-blue-50 px-2 py-1 rounded border border-blue-200">
          {value}
        </code>
      )
    },
    {
      header: 'Nama Produk',
      accessorKey: 'product_name',
      render: (value: string) => value || '-'
    },
    {
      header: 'Jenis Kemasan',
      accessorKey: 'package_type',
      render: (value: string) => value || '-'
    },
    {
      header: 'Customer',
      accessorKey: 'customer_name',
      render: (value: string) => value || '-'
    },
    {
      header: 'Ukuran (L x W)',
      accessorKey: 'dimensions',
      render: (_: any, row: any) => {
        if (row.length && row.width) {
          return `${row.length} x ${row.width} cm`;
        }
        return '-';
      }
    },
    {
      header: 'Material',
      accessorKey: 'material_name',
      render: (value: string) => value || '-'
    },
    {
      header: 'Ketebalan',
      accessorKey: 'material_thickness',
      render: (value: number) => value ? `${value} mikron` : '-'
    },
    {
      header: 'Quantity',
      accessorKey: 'quantity',
      render: (value: number) => value ? value.toLocaleString() : '-'
    },
    {
      header: 'Harga Jual',
      accessorKey: 'selling_price_per_pcs',
      render: (value: number) => {
        if (!value) return '-';
        return new Intl.NumberFormat('id-ID', {
          style: 'currency',
          currency: 'IDR',
          minimumFractionDigits: 0
        }).format(value);
      }
    },
    {
      header: 'Status',
      accessorKey: 'status',
      render: (value: string) => {
        const statusColors: Record<string, string> = {
          'draft': 'bg-gray-100 text-gray-700 border-gray-200',
          'pending_approval': 'bg-yellow-100 text-yellow-700 border-yellow-200',
          'approved': 'bg-green-100 text-green-700 border-green-200',
          'sent': 'bg-blue-100 text-blue-700 border-blue-200',
          'rejected': 'bg-red-100 text-red-700 border-red-200'
        };
        const color = statusColors[value] || 'bg-gray-100 text-gray-700';
        return (
          <span className={`text-xs px-2 py-1 rounded border ${color}`}>
            {value || 'Draft'}
          </span>
        );
      }
    },
    {
      header: 'Tanggal Dibuat',
      accessorKey: 'createdAt',
      render: (value: string) => {
        if (!value) return '-';
        return new Date(value).toLocaleDateString('id-ID', {
          day: '2-digit',
          month: 'short',
          year: 'numeric'
        });
      }
    }
  ];

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="Formula Harga Polos"
        description="Daftar formula perhitungan harga untuk kantong plastik polos (tanpa cetak atau cetak simple)"
        icon={Package}
        breadcrumbs={[
          { label: 'Dashboard', href: '/' },
          { label: 'Master' },
          { label: 'Formula Harga Polos' }
        ]}
      />

      {/* Info Banner */}
      <Card className="p-4 bg-blue-50 border-blue-200">
        <div className="flex items-start gap-3">
          <Package className="w-5 h-5 text-blue-600 mt-0.5" />
          <div>
            <h3 className="font-medium text-blue-900 mb-1">Formula Harga Polos</h3>
            <p className="text-sm text-blue-700">
              Digunakan untuk menghitung harga kantong plastik polos dengan atau tanpa cetak simple.
              Mencakup perhitungan material PE/PP/OPP, handle, finishing, dan biaya produksi.
            </p>
          </div>
        </div>
      </Card>

      {/* Stats Cards */}
      <div className="grid grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="text-sm text-gray-600 mb-1">Total Formula</div>
          <div className="text-2xl font-bold text-blue-600">{data.length}</div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-gray-600 mb-1">Draft</div>
          <div className="text-2xl font-bold text-gray-600">
            {data.filter(d => d.status === 'draft').length}
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-gray-600 mb-1">Approved</div>
          <div className="text-2xl font-bold text-green-600">
            {data.filter(d => d.status === 'approved').length}
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-gray-600 mb-1">Sent</div>
          <div className="text-2xl font-bold text-blue-600">
            {data.filter(d => d.status === 'sent').length}
          </div>
        </Card>
      </div>

      {/* Data Table */}
      <Card>
        <div className="p-4 border-b flex items-center justify-between">
          <h2 className="font-semibold">Daftar Formula Harga Polos</h2>
          <Button onClick={handleAdd} size="sm">
            <Plus className="w-4 h-4 mr-2" />
            Tambah Formula
          </Button>
        </div>
        <DataTable
          columns={columns}
          data={data}
          loading={loading}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      </Card>

      {/* Form Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingItem ? 'Edit Formula Harga Polos' : 'Tambah Formula Harga Polos'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Informasi Dasar */}
            <div className="space-y-3">
              <h3 className="font-medium text-sm border-b pb-2">Informasi Dasar</h3>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="product_name">Nama Produk *</Label>
                  <Input
                    id="product_name"
                    value={formData.product_name}
                    onChange={(e) => setFormData({ ...formData, product_name: e.target.value })}
                    placeholder="Contoh: Kantong Plastik HDPE"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="customer_name">Nama Customer</Label>
                  <Input
                    id="customer_name"
                    value={formData.customer_name}
                    onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })}
                    placeholder="Nama customer"
                  />
                </div>
              </div>
            </div>

            {/* Spesifikasi Produk */}
            <div className="space-y-3">
              <h3 className="font-medium text-sm border-b pb-2">Spesifikasi Produk</h3>

              <div className="space-y-2">
                <Label htmlFor="package_type">Jenis Kemasan *</Label>
                <Select
                  value={formData.package_type}
                  onValueChange={(value) => setFormData({ ...formData, package_type: value })}
                >
                  <SelectTrigger id="package_type">
                    <SelectValue placeholder="Pilih jenis kemasan" />
                  </SelectTrigger>
                  <SelectContent>
                    {productTypes.filter(t => t.name && typeof t.name === 'string' && t.name.trim() !== '').map((type) => (
                      <SelectItem key={type.id} value={type.name}>
                        {type.code} - {type.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="length">Panjang (cm)</Label>
                  <Input
                    id="length"
                    type="number"
                    step="0.1"
                    value={formData.length}
                    onChange={(e) => setFormData({ ...formData, length: e.target.value })}
                    placeholder="0"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="width">Lebar (cm)</Label>
                  <Input
                    id="width"
                    type="number"
                    step="0.1"
                    value={formData.width}
                    onChange={(e) => setFormData({ ...formData, width: e.target.value })}
                    placeholder="0"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="material_name">Nama Material</Label>
                  <Input
                    id="material_name"
                    value={formData.material_name}
                    onChange={(e) => setFormData({ ...formData, material_name: e.target.value })}
                    placeholder="Contoh: HDPE, LDPE, PP"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="material_thickness">Ketebalan (mikron)</Label>
                  <Input
                    id="material_thickness"
                    type="number"
                    step="0.1"
                    value={formData.material_thickness}
                    onChange={(e) => setFormData({ ...formData, material_thickness: e.target.value })}
                    placeholder="0"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="quantity">Quantity (pcs)</Label>
                <Input
                  id="quantity"
                  type="number"
                  value={formData.quantity}
                  onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                  placeholder="0"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Catatan</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Catatan tambahan"
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => setFormData({ ...formData, status: value })}
                >
                  <SelectTrigger id="status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="pending_approval">Pending Approval</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="sent">Sent</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>
              Batal
            </Button>
            <Button onClick={handleSave}>
              {editingItem ? 'Perbarui' : 'Simpan'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
