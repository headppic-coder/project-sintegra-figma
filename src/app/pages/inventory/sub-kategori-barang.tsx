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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select';
import { supabase } from '../../lib/api';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2, Search } from 'lucide-react';
import { Switch } from '../../components/ui/switch';
import { Textarea } from '../../components/ui/textarea';

interface SubKategoriBarang {
  id: string;
  code: string;
  name: string;
  item_type_id: string;
  description: string;
  is_active: boolean;
  created_at: string;
}

interface ItemType {
  id: string;
  code: string;
  name: string;
}

export default function SubKategoriBarangPage() {
  const [subKategoriBarang, setSubKategoriBarang] = useState<SubKategoriBarang[]>([]);
  const [itemTypes, setItemTypes] = useState<ItemType[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterItemType, setFilterItemType] = useState('all');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<SubKategoriBarang | null>(null);
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    item_type_id: '',
    description: '',
    is_active: true,
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);

      // Load item types
      const { data: itemData, error: itemError } = await supabase
        .from('kv_store_6a7942bb')
        .select('value')
        .like('key', 'item_type:%')
        .neq('key', 'item_type:index');

      if (itemError) throw itemError;
      setItemTypes(itemData.map((d) => d.value as ItemType));

      // Load item subtypes
      const { data, error } = await supabase
        .from('kv_store_6a7942bb')
        .select('value')
        .like('key', 'item_subtype:%')
        .neq('key', 'item_subtype:index')
        .not('key', 'like', '%:by_item_type:%');

      if (error) throw error;

      const items = data.map((d) => d.value as SubKategoriBarang);
      setSubKategoriBarang(items);
    } catch (error: any) {
      toast.error('Gagal memuat data: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (item?: SubKategoriBarang) => {
    if (item) {
      setSelectedItem(item);
      setFormData({
        code: item.code,
        name: item.name,
        item_type_id: item.item_type_id,
        description: item.description,
        is_active: item.is_active,
      });
    } else {
      setSelectedItem(null);
      setFormData({
        code: '',
        name: '',
        item_type_id: '',
        description: '',
        is_active: true,
      });
    }
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    try {
      if (!formData.code || !formData.name || !formData.item_type_id) {
        toast.error('Kode, Nama, dan Kategori Barang harus diisi');
        return;
      }

      let id: string;

      if (selectedItem) {
        id = selectedItem.id;
      } else {
        const maxId = Math.max(
          0,
          ...subKategoriBarang.map((item) => parseInt(item.id) || 0)
        );
        id = String(maxId + 1);
      }

      const newData: SubKategoriBarang = {
        id,
        code: formData.code,
        name: formData.name,
        item_type_id: formData.item_type_id,
        description: formData.description,
        is_active: formData.is_active,
        created_at: selectedItem?.created_at || new Date().toISOString(),
      };

      const { error: upsertError } = await supabase
        .from('kv_store_6a7942bb')
        .upsert({
          key: `item_subtype:${id}`,
          value: newData,
        });

      if (upsertError) throw upsertError;

      if (!selectedItem) {
        // Update main index
        const { data: indexData, error: indexFetchError } = await supabase
          .from('kv_store_6a7942bb')
          .select('value')
          .eq('key', 'item_subtype:index')
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
          .eq('key', 'item_subtype:index');

        if (indexUpdateError) throw indexUpdateError;

        // Update by_item_type index
        const byItemTypeKey = `item_subtype:by_item_type:${formData.item_type_id}`;
        const { data: byItemTypeData, error: byItemTypeError } = await supabase
          .from('kv_store_6a7942bb')
          .select('value')
          .eq('key', byItemTypeKey)
          .maybeSingle();

        if (byItemTypeError) throw byItemTypeError;

        if (byItemTypeData) {
          const currentSubtypeIds = byItemTypeData.value.subtype_ids || [];
          const updatedSubtypeIds = [...currentSubtypeIds, id];

          const { error: updateError } = await supabase
            .from('kv_store_6a7942bb')
            .update({
              value: {
                item_type_id: formData.item_type_id,
                subtype_ids: updatedSubtypeIds,
                updated_at: new Date().toISOString(),
              },
            })
            .eq('key', byItemTypeKey);

          if (updateError) throw updateError;
        } else {
          const { error: insertError } = await supabase
            .from('kv_store_6a7942bb')
            .insert({
              key: byItemTypeKey,
              value: {
                item_type_id: formData.item_type_id,
                subtype_ids: [id],
                updated_at: new Date().toISOString(),
              },
            });

          if (insertError) throw insertError;
        }
      }

      toast.success(
        selectedItem
          ? 'Sub-kategori barang berhasil diupdate'
          : 'Sub-kategori barang berhasil ditambahkan'
      );

      setIsDialogOpen(false);
      loadData();
    } catch (error: any) {
      toast.error('Gagal menyimpan data: ' + error.message);
    }
  };

  const handleDelete = async () => {
    if (!selectedItem) return;

    try {
      const { error: deleteError } = await supabase
        .from('kv_store_6a7942bb')
        .delete()
        .eq('key', `item_subtype:${selectedItem.id}`);

      if (deleteError) throw deleteError;

      // Update main index
      const { data: indexData, error: indexFetchError } = await supabase
        .from('kv_store_6a7942bb')
        .select('value')
        .eq('key', 'item_subtype:index')
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
        .eq('key', 'item_subtype:index');

      if (indexUpdateError) throw indexUpdateError;

      // Update by_item_type index
      const byItemTypeKey = `item_subtype:by_item_type:${selectedItem.item_type_id}`;
      const { data: byItemTypeData, error: byItemTypeError } = await supabase
        .from('kv_store_6a7942bb')
        .select('value')
        .eq('key', byItemTypeKey)
        .maybeSingle();

      if (!byItemTypeError && byItemTypeData) {
        const currentSubtypeIds = byItemTypeData.value.subtype_ids || [];
        const updatedSubtypeIds = currentSubtypeIds.filter(
          (id: string) => id !== selectedItem.id
        );

        const { error: updateError } = await supabase
          .from('kv_store_6a7942bb')
          .update({
            value: {
              item_type_id: selectedItem.item_type_id,
              subtype_ids: updatedSubtypeIds,
              updated_at: new Date().toISOString(),
            },
          })
          .eq('key', byItemTypeKey);

        if (updateError) throw updateError;
      }

      toast.success('Sub-kategori barang berhasil dihapus');
      setIsDeleteDialogOpen(false);
      loadData();
    } catch (error: any) {
      toast.error('Gagal menghapus data: ' + error.message);
    }
  };

  const filteredData = subKategoriBarang.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.code.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = !filterItemType || filterItemType === 'all' || item.item_type_id === filterItemType;
    return matchesSearch && matchesFilter;
  });

  const getItemTypeName = (id: string) => {
    return itemTypes.find((t) => t.id === id)?.name || '-';
  };

  return (
    <PageTemplate
      title="Master Sub-Kategori Barang"
      description="Kelola sub-kategori barang (Kertas, Plastik, Mekanik, Elektrik, dll)"
    >
      <div className="space-y-4">
        <div className="flex justify-between items-center gap-4">
          <div className="flex gap-3 flex-1">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Cari sub-kategori barang..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={filterItemType} onValueChange={setFilterItemType}>
              <SelectTrigger className="w-[250px]">
                <SelectValue placeholder="Semua Kategori" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Kategori</SelectItem>
                {itemTypes.filter(t => t.id && typeof t.id === 'string' && t.id.trim() !== '').map((type) => (
                  <SelectItem key={type.id} value={type.id}>
                    {type.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button onClick={() => handleOpenDialog()}>
            <Plus className="h-4 w-4 mr-2" />
            Tambah Sub-Kategori
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
                    Kategori Barang
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
                    <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                      Memuat data...
                    </td>
                  </tr>
                ) : filteredData.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
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
                        {getItemTypeName(item.item_type_id)}
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
                {selectedItem
                  ? 'Edit Sub-Kategori Barang'
                  : 'Tambah Sub-Kategori Barang'}
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
                  placeholder="Contoh: RAW_PAPER"
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
                  placeholder="Contoh: Kertas"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="item_type_id">Kategori Barang *</Label>
                <Select
                  value={formData.item_type_id}
                  onValueChange={(value) =>
                    setFormData({ ...formData, item_type_id: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih kategori barang" />
                  </SelectTrigger>
                  <SelectContent>
                    {itemTypes.map((type) => (
                      <SelectItem key={type.id} value={type.id}>
                        {type.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Deskripsi</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  placeholder="Deskripsi sub-kategori barang"
                  rows={3}
                />
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
                Apakah Anda yakin ingin menghapus sub-kategori barang "
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
