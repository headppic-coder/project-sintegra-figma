import { useState, useEffect } from 'react';
import { PageTemplate } from '../../components/page-template';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Card } from '../../components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '../../components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../../components/ui/alert-dialog';
import { supabase } from '../../lib/api';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2, Search } from 'lucide-react';
import { Switch } from '../../components/ui/switch';
import { Textarea } from '../../components/ui/textarea';

interface JenisBarang {
  id: string;
  code: string;
  name: string;
  has_stock: boolean;
  has_fifo: boolean;
  description: string;
  is_active: boolean;
  created_at: string;
}

export default function JenisBarangPage() {
  const [jenisBarang, setJenisBarang] = useState<JenisBarang[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<JenisBarang | null>(null);
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    has_stock: true,
    has_fifo: true,
    description: '',
    is_active: true,
  });

  useEffect(() => {
    loadJenisBarang();
  }, []);

  const loadJenisBarang = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('kv_store_6a7942bb')
        .select('value')
        .like('key', 'inventory_type:%')
        .neq('key', 'inventory_type:index');

      if (error) throw error;

      const items = data.map((d) => d.value as JenisBarang);
      setJenisBarang(items);
    } catch (error: any) {
      toast.error('Gagal memuat data: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (item?: JenisBarang) => {
    if (item) {
      setSelectedItem(item);
      setFormData({
        code: item.code,
        name: item.name,
        has_stock: item.has_stock,
        has_fifo: item.has_fifo,
        description: item.description,
        is_active: item.is_active,
      });
    } else {
      setSelectedItem(null);
      setFormData({
        code: '',
        name: '',
        has_stock: true,
        has_fifo: true,
        description: '',
        is_active: true,
      });
    }
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    try {
      if (!formData.code || !formData.name) {
        toast.error('Kode dan Nama harus diisi');
        return;
      }

      let id: string;

      if (selectedItem) {
        // Update existing
        id = selectedItem.id;
      } else {
        // Create new - get next ID
        const maxId = Math.max(
          0,
          ...jenisBarang.map((item) => parseInt(item.id) || 0)
        );
        id = String(maxId + 1);
      }

      const newData: JenisBarang = {
        id,
        code: formData.code,
        name: formData.name,
        has_stock: formData.has_stock,
        has_fifo: formData.has_fifo,
        description: formData.description,
        is_active: formData.is_active,
        created_at: selectedItem?.created_at || new Date().toISOString(),
      };

      // Upsert data
      const { error: upsertError } = await supabase
        .from('kv_store_6a7942bb')
        .upsert({
          key: `inventory_type:${id}`,
          value: newData,
        });

      if (upsertError) throw upsertError;

      // Update index if new item
      if (!selectedItem) {
        const { data: indexData, error: indexFetchError } = await supabase
          .from('kv_store_6a7942bb')
          .select('value')
          .eq('key', 'inventory_type:index')
          .single();

        if (indexFetchError) throw indexFetchError;

        const currentIds = indexData.value.ids || [];
        const updatedIds = [...currentIds, id];

        const { error: indexUpdateError } = await supabase
          .from('kv_store_6a7942bb')
          .update({
            value: {
              ids: updatedIds,
              updated_at: new Date().toISOString(),
            },
          })
          .eq('key', 'inventory_type:index');

        if (indexUpdateError) throw indexUpdateError;
      }

      toast.success(
        selectedItem
          ? 'Jenis barang berhasil diupdate'
          : 'Jenis barang berhasil ditambahkan'
      );

      setIsDialogOpen(false);
      loadJenisBarang();
    } catch (error: any) {
      toast.error('Gagal menyimpan data: ' + error.message);
    }
  };

  const handleDelete = async () => {
    if (!selectedItem) return;

    try {
      // Delete item
      const { error: deleteError } = await supabase
        .from('kv_store_6a7942bb')
        .delete()
        .eq('key', `inventory_type:${selectedItem.id}`);

      if (deleteError) throw deleteError;

      // Update index
      const { data: indexData, error: indexFetchError } = await supabase
        .from('kv_store_6a7942bb')
        .select('value')
        .eq('key', 'inventory_type:index')
        .single();

      if (indexFetchError) throw indexFetchError;

      const currentIds = indexData.value.ids || [];
      const updatedIds = currentIds.filter((id: string) => id !== selectedItem.id);

      const { error: indexUpdateError } = await supabase
        .from('kv_store_6a7942bb')
        .update({
          value: {
            ids: updatedIds,
            updated_at: new Date().toISOString(),
          },
        })
        .eq('key', 'inventory_type:index');

      if (indexUpdateError) throw indexUpdateError;

      toast.success('Jenis barang berhasil dihapus');
      setIsDeleteDialogOpen(false);
      loadJenisBarang();
    } catch (error: any) {
      toast.error('Gagal menghapus data: ' + error.message);
    }
  };

  const filteredData = jenisBarang.filter(
    (item) =>
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <PageTemplate
      title="Master Jenis Barang"
      description="Kelola jenis persediaan (Stock, Non-Stock, Jasa, dll)"
    >
      <div className="space-y-4">
        <div className="flex justify-between items-center gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Cari jenis barang..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button onClick={() => handleOpenDialog()}>
            <Plus className="h-4 w-4 mr-2" />
            Tambah Jenis Barang
          </Button>
        </div>

        <Card>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-800 border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Kode
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Nama
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ada Stock
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    FIFO
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Deskripsi
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Aksi
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-800">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-4 text-center text-gray-500">
                      Memuat data...
                    </td>
                  </tr>
                ) : filteredData.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-4 text-center text-gray-500">
                      Tidak ada data
                    </td>
                  </tr>
                ) : (
                  filteredData.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        {item.code}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {item.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {item.has_stock ? (
                          <span className="text-green-600">Ya</span>
                        ) : (
                          <span className="text-gray-400">Tidak</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {item.has_fifo ? (
                          <span className="text-green-600">Ya</span>
                        ) : (
                          <span className="text-gray-400">Tidak</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {item.description}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {item.is_active ? (
                          <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">
                            Aktif
                          </span>
                        ) : (
                          <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-800">
                            Tidak Aktif
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleOpenDialog(item)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedItem(item);
                              setIsDeleteDialogOpen(true);
                            }}
                          >
                            <Trash2 className="h-4 w-4 text-red-600" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Dialog Form */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>
                {selectedItem ? 'Edit Jenis Barang' : 'Tambah Jenis Barang'}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="code">Kode *</Label>
                <Input
                  id="code"
                  value={formData.code}
                  onChange={(e) =>
                    setFormData({ ...formData, code: e.target.value })
                  }
                  placeholder="Contoh: STOCK"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="name">Nama *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="Contoh: Barang dengan Stock"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Deskripsi</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  placeholder="Deskripsi jenis barang"
                  rows={3}
                />
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="has_stock"
                  checked={formData.has_stock}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, has_stock: checked })
                  }
                />
                <Label htmlFor="has_stock">Memiliki Persediaan Stock</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="has_fifo"
                  checked={formData.has_fifo}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, has_fifo: checked })
                  }
                />
                <Label htmlFor="has_fifo">Menggunakan Metode FIFO</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="is_active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, is_active: checked })
                  }
                />
                <Label htmlFor="is_active">Status Aktif</Label>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Batal
              </Button>
              <Button onClick={handleSave}>Simpan</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation */}
        <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Konfirmasi Hapus</AlertDialogTitle>
              <AlertDialogDescription>
                Apakah Anda yakin ingin menghapus jenis barang "
                {selectedItem?.name}"? Tindakan ini tidak dapat dibatalkan.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Batal</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete} className="bg-red-600">
                Hapus
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </PageTemplate>
  );
}
