import { useState, useEffect } from 'react';
import { Plus, Upload, Download, ChevronDown } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { PageHeader } from '../../components/page-header';
import { DataTable } from '../../components/data-table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../../components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../../components/ui/dropdown-menu';
import { toast } from 'sonner';
import { api } from '../../lib/api';

interface CustomItem {
  id: string;
  kodeBarang: string;
  namaBarang: string;
  jenisOrder: string;
  jenisKemasan: string;
  jenisProses: string;
  bentuk: string;
  satuan: string;
  ziplock: string;
  dimensi: {
    lebar: string;
    tinggi: string;
    panjang: string;
    gusset: string;
  };
  createdAt: string;
}

export function CustomItems() {
  const [items, setItems] = useState<CustomItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<CustomItem | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [productTypes, setProductTypes] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    kodeBarang: '',
    namaBarang: '',
    jenisOrder: '',
    jenisKemasan: '',
    jenisProses: '',
    bentuk: '',
    satuan: '',
    ziplock: '',
    dimensi: {
      lebar: '',
      tinggi: '',
      panjang: '',
      gusset: '',
    },
  });

  const columns = [
    {
      key: 'kodeBarang',
      label: 'Kode Barang',
    },
    {
      key: 'namaBarang',
      label: 'Nama Barang',
    },
    {
      key: 'jenisOrder',
      label: 'Jenis Order',
    },
    {
      key: 'jenisKemasan',
      label: 'Jenis Kemasan',
    },
    {
      key: 'bentuk',
      label: 'Bentuk',
      render: (value: string) => value || '-',
    },
    {
      key: 'satuan',
      label: 'Satuan',
    },
    {
      key: 'ziplock',
      label: 'Ziplock',
    },
  ];

  useEffect(() => {
    fetchItems();
    fetchProductTypes();
  }, []);

  const fetchItems = async () => {
    try {
      setLoading(true);
      const result = await api.getCustomItems();
      setItems(result || []);
    } catch (error) {
      console.error('Error fetching custom items:', error);
      toast.error('Gagal memuat data barang custom');
    } finally {
      setLoading(false);
    }
  };

  const fetchProductTypes = async () => {
    try {
      const result = await api.getProductTypes();
      setProductTypes(result || []);
    } catch (error) {
      console.error('Error fetching product types:', error);
    }
  };

  const handleAdd = () => {
    setEditingItem(null);
    setFormData({
      kodeBarang: '',
      namaBarang: '',
      jenisOrder: '',
      jenisKemasan: '',
      jenisProses: '', // Keep for backward compatibility with existing data
      bentuk: '',
      satuan: '',
      ziplock: '',
      dimensi: {
        lebar: '',
        tinggi: '',
        panjang: '',
        gusset: '',
      },
    });
    setDialogOpen(true);
  };

  const handleEdit = (item: CustomItem) => {
    setEditingItem(item);
    setFormData({
      kodeBarang: item.kodeBarang,
      namaBarang: item.namaBarang,
      jenisOrder: item.jenisOrder,
      jenisKemasan: item.jenisKemasan,
      jenisProses: item.jenisProses || '', // Keep for backward compatibility
      bentuk: item.bentuk,
      satuan: item.satuan,
      ziplock: item.ziplock,
      dimensi: item.dimensi || {
        lebar: '',
        tinggi: '',
        panjang: '',
        gusset: '',
      },
    });
    setDialogOpen(true);
  };

  const handleDelete = async (item: CustomItem) => {
    if (!confirm('Apakah Anda yakin ingin menghapus barang custom ini?')) return;

    try {
      await api.deleteCustomItem(item.id);
      toast.success('Barang custom berhasil dihapus');
      fetchItems();
    } catch (error) {
      console.error('Error deleting custom item:', error);
      toast.error('Gagal menghapus barang custom');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validasi field wajib
    if (!formData.kodeBarang.trim()) {
      toast.error('Kode barang harus diisi');
      return;
    }
    if (!formData.namaBarang.trim()) {
      toast.error('Nama barang harus diisi');
      return;
    }
    if (!formData.jenisOrder) {
      toast.error('Jenis order harus dipilih');
      return;
    }
    if (!formData.jenisKemasan) {
      toast.error('Jenis kemasan harus dipilih');
      return;
    }
    if (!formData.bentuk) {
      toast.error('Bentuk harus dipilih');
      return;
    }
    if (!formData.satuan) {
      toast.error('Satuan harus dipilih');
      return;
    }
    if (!formData.ziplock) {
      toast.error('Ziplock harus dipilih');
      return;
    }
    if (!formData.dimensi.lebar.trim()) {
      toast.error('Lebar harus diisi');
      return;
    }
    if (!formData.dimensi.tinggi.trim()) {
      toast.error('Tinggi harus diisi');
      return;
    }

    try {
      const dataToSave = {
        ...formData,
        jenisProses: '', // Clear jenisProses as it's no longer used
      };

      if (editingItem) {
        await api.updateCustomItem(editingItem.id, dataToSave);
        toast.success('Barang custom berhasil diperbarui');
      } else {
        await api.createCustomItem(dataToSave);
        toast.success('Barang custom berhasil ditambahkan');
      }
      setDialogOpen(false);
      fetchItems();
    } catch (error) {
      console.error('Error saving custom item:', error);
      toast.error('Gagal menyimpan barang custom');
    }
  };

  const handleDownloadTemplate = () => {
    const headers = [
      'Kode Barang',
      'Nama Barang',
      'Jenis Order',
      'Jenis Kemasan',
      'Bentuk',
      'Satuan',
      'Ziplock',
      'Dimensi Lebar',
      'Dimensi Tinggi',
      'Dimensi Panjang',
      'Dimensi Gusset',
    ];

    const csvContent = headers.join(',') + '\n';
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'Template_Barang_Custom.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Template berhasil diunduh');
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadedFile(file);
  };

  const handleImportConfirm = async () => {
    if (!uploadedFile) {
      toast.error('Pilih file terlebih dahulu');
      return;
    }

    try {
      setLoading(true);
      const text = await uploadedFile.text();
      const lines = text.split('\n').filter(line => line.trim());

      if (lines.length < 2) {
        toast.error('File kosong atau tidak valid');
        return;
      }

      let successCount = 0;
      let errorCount = 0;
      const errors: string[] = [];

      // Skip header row
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        const columns = line.split(',').map(col => col.trim().replace(/^"|"$/g, ''));

        if (columns.length < 2) {
          errorCount++;
          errors.push(`Baris ${i + 1}: Data tidak lengkap`);
          continue;
        }

        const [
          kodeBarang,
          namaBarang,
          jenisOrder,
          jenisKemasan,
          bentuk,
          satuan,
          ziplock,
          dimensiLebar,
          dimensiTinggi,
          dimensiPanjang,
          dimensiGusset,
        ] = columns;

        // Validasi field wajib
        if (!kodeBarang || !namaBarang) {
          errorCount++;
          errors.push(`Baris ${i + 1}: Kode Barang dan Nama Barang harus diisi`);
          continue;
        }
        if (!jenisOrder) {
          errorCount++;
          errors.push(`Baris ${i + 1}: Jenis Order harus diisi`);
          continue;
        }
        if (!jenisKemasan) {
          errorCount++;
          errors.push(`Baris ${i + 1}: Jenis Kemasan harus diisi`);
          continue;
        }
        if (!bentuk) {
          errorCount++;
          errors.push(`Baris ${i + 1}: Bentuk harus diisi`);
          continue;
        }
        if (!satuan) {
          errorCount++;
          errors.push(`Baris ${i + 1}: Satuan harus diisi`);
          continue;
        }
        if (!ziplock) {
          errorCount++;
          errors.push(`Baris ${i + 1}: Ziplock harus diisi`);
          continue;
        }
        if (!dimensiLebar || !dimensiTinggi) {
          errorCount++;
          errors.push(`Baris ${i + 1}: Lebar dan Tinggi harus diisi`);
          continue;
        }

        // Check for duplicates in existing data
        const existingItem = items.find(
          item => item.kodeBarang.toLowerCase() === kodeBarang.toLowerCase()
        );

        if (existingItem) {
          errorCount++;
          errors.push(`Baris ${i + 1}: Kode Barang "${kodeBarang}" sudah ada`);
          continue;
        }

        try {
          await api.createCustomItem({
            kodeBarang,
            namaBarang,
            jenisOrder: jenisOrder || '',
            jenisKemasan: jenisKemasan || '',
            jenisProses: '',
            bentuk: bentuk || '',
            satuan: satuan || '',
            ziplock: ziplock || '',
            dimensi: {
              lebar: dimensiLebar || '',
              tinggi: dimensiTinggi || '',
              panjang: dimensiPanjang || '',
              gusset: dimensiGusset || '',
            },
          });
          successCount++;
        } catch (error) {
          errorCount++;
          errors.push(`Baris ${i + 1}: ${kodeBarang} - Gagal menyimpan`);
        }
      }

      if (errors.length > 0 && errors.length <= 5) {
        errors.forEach(err => toast.error(err));
      }

      toast.success(`Import selesai! Berhasil: ${successCount}, Gagal: ${errorCount}`);
      setImportDialogOpen(false);
      setUploadedFile(null);
      fetchItems();
    } catch (error) {
      console.error('Error importing data:', error);
      toast.error('Gagal mengimpor data');
    } finally {
      setLoading(false);
    }
  };

  // Filter data
  const filteredItems = items.filter((item) => {
    const matchesSearch =
      item.kodeBarang?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.namaBarang?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.jenisOrder?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.jenisKemasan?.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesSearch;
  });

  // Get dialog title
  const getDialogTitle = () => {
    if (!editingItem) return 'Tambah Barang Custom';
    const jenisOrder = formData.jenisOrder || editingItem.jenisOrder || 'CUSTOM';
    return `Edit Barang Custom — ${jenisOrder.toUpperCase()}`;
  };

  return (
    <div className="space-y-4">
      <PageHeader
        title="Barang Custom"
        description="Kelola data barang custom untuk pesanan khusus"
        breadcrumbs={[
          { label: 'Dashboard', href: '/' },
          { label: 'Sales' },
          { label: 'Barang Custom' },
        ]}
        actions={
          <div className="flex gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline">
                  <Upload className="w-4 h-4 mr-2" />
                  Import/Export
                  <ChevronDown className="w-4 h-4 ml-2" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleDownloadTemplate}>
                  <Download className="w-4 h-4 mr-2" />
                  Download Template
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setImportDialogOpen(true)}>
                  <Upload className="w-4 h-4 mr-2" />
                  Import Data
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button onClick={handleAdd}>
              <Plus className="w-4 h-4 mr-2" />
              Tambah Barang Custom
            </Button>
          </div>
        }
      />

      {/* Filters */}
      <div className="flex gap-3 items-center">
        <Input
          placeholder="Cari kode atau nama barang..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="max-w-xs"
        />
      </div>

      <DataTable
        columns={columns}
        data={filteredItems}
        loading={loading}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{getDialogTitle()}</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-3">
            {/* Kode Barang */}
            <div className="grid grid-cols-[180px_1fr] gap-4 items-center">
              <Label htmlFor="kodeBarang" className="text-right">Kode Barang *</Label>
              <Input
                id="kodeBarang"
                value={formData.kodeBarang}
                onChange={(e) => setFormData({ ...formData, kodeBarang: e.target.value })}
                placeholder="Contoh: 1SSPF005"
                required
              />
            </div>

            {/* Nama Barang */}
            <div className="grid grid-cols-[180px_1fr] gap-4 items-center">
              <Label htmlFor="namaBarang" className="text-right">Nama Barang *</Label>
              <Input
                id="namaBarang"
                value={formData.namaBarang}
                onChange={(e) => setFormData({ ...formData, namaBarang: e.target.value })}
                placeholder="Contoh: 1SS PF BOTANICAL"
                required
              />
            </div>

            {/* Jenis Order */}
            <div className="grid grid-cols-[180px_1fr] gap-4 items-center">
              <Label htmlFor="jenisOrder" className="text-right">Jenis Order *</Label>
              <Select
                value={formData.jenisOrder}
                onValueChange={(value) => setFormData({ ...formData, jenisOrder: value })}
                required
              >
                <SelectTrigger id="jenisOrder">
                  <SelectValue placeholder="- Pilih -" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Offset">Offset</SelectItem>
                  <SelectItem value="Rotogravure">Rotogravure</SelectItem>
                  <SelectItem value="Kantong Teh">Kantong Teh</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Jenis Kemasan */}
            <div className="grid grid-cols-[180px_1fr] gap-4 items-center">
              <Label htmlFor="jenisKemasan" className="text-right">Jenis Kemasan *</Label>
              <Select
                value={formData.jenisKemasan}
                onValueChange={(value) => setFormData({ ...formData, jenisKemasan: value })}
                required
              >
                <SelectTrigger id="jenisKemasan">
                  <SelectValue placeholder="- Pilih -" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Flexibel">Flexibel</SelectItem>
                  <SelectItem value="Boks">Boks</SelectItem>
                  <SelectItem value="Roto">Roto</SelectItem>
                  <SelectItem value="Polos">Polos</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Bentuk */}
            <div className="grid grid-cols-[180px_1fr] gap-4 items-center">
              <Label htmlFor="bentuk" className="text-right">Bentuk *</Label>
              <Select
                value={formData.bentuk}
                onValueChange={(value) => setFormData({ ...formData, bentuk: value })}
                required
              >
                <SelectTrigger id="bentuk">
                  <SelectValue placeholder="- Pilih -" />
                </SelectTrigger>
                <SelectContent>
                  {productTypes.length === 0 ? (
                    <SelectItem value="loading" disabled>Loading...</SelectItem>
                  ) : (
                    productTypes.filter(t => t.name && typeof t.name === 'string' && t.name.trim() !== '').map((type) => (
                      <SelectItem key={type.id} value={type.name}>
                        {type.name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            {/* Satuan */}
            <div className="grid grid-cols-[180px_1fr] gap-4 items-center">
              <Label htmlFor="satuan" className="text-right">Satuan *</Label>
              <Select
                value={formData.satuan}
                onValueChange={(value) => setFormData({ ...formData, satuan: value })}
                required
              >
                <SelectTrigger id="satuan">
                  <SelectValue placeholder="- Pilih -" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Pcs">Pcs</SelectItem>
                  <SelectItem value="Pack">Pack</SelectItem>
                  <SelectItem value="Box">Box</SelectItem>
                  <SelectItem value="Lusin">Lusin</SelectItem>
                  <SelectItem value="Kg">Kg</SelectItem>
                  <SelectItem value="Meter">Meter</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Ziplock */}
            <div className="grid grid-cols-[180px_1fr] gap-4 items-center">
              <Label htmlFor="ziplock" className="text-right">Ziplock *</Label>
              <Select
                value={formData.ziplock}
                onValueChange={(value) => setFormData({ ...formData, ziplock: value })}
                required
              >
                <SelectTrigger id="ziplock">
                  <SelectValue placeholder="- Pilih -" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Zipper">Zipper</SelectItem>
                  <SelectItem value="Non Zipper">Non Zipper</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Lebar x Tinggi */}
            <div className="grid grid-cols-[180px_1fr] gap-4 items-center">
              <Label className="text-right">Lebar x Tinggi (cm) *</Label>
              <div className="grid grid-cols-2 gap-3">
                <Input
                  placeholder="Lebar (cm)"
                  value={formData.dimensi.lebar}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      dimensi: { ...formData.dimensi, lebar: e.target.value },
                    })
                  }
                  required
                />
                <Input
                  placeholder="Tinggi (cm)"
                  value={formData.dimensi.tinggi}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      dimensi: { ...formData.dimensi, tinggi: e.target.value },
                    })
                  }
                  required
                />
              </div>
            </div>

            {/* Panjang x Gusset */}
            <div className="grid grid-cols-[180px_1fr] gap-4 items-center">
              <Label className="text-right">Panjang x Gusset (cm)</Label>
              <div className="grid grid-cols-2 gap-3">
                <Input
                  placeholder="Panjang (cm)"
                  value={formData.dimensi.panjang}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      dimensi: { ...formData.dimensi, panjang: e.target.value },
                    })
                  }
                />
                <Input
                  placeholder="Gusset (cm)"
                  value={formData.dimensi.gusset}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      dimensi: { ...formData.dimensi, gusset: e.target.value },
                    })
                  }
                />
              </div>
            </div>

            {/* Buttons */}
            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setDialogOpen(false)}
                className="flex-1"
              >
                Batal
              </Button>
              <Button type="submit" className="flex-1">
                {editingItem ? 'Update Data' : 'Simpan Data'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Import Dialog */}
      <Dialog open={importDialogOpen} onOpenChange={setImportDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Import Data Barang Custom</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="border-2 border-dashed rounded-lg p-6 text-center">
              <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <Label htmlFor="file-upload" className="cursor-pointer">
                <div className="text-sm font-medium mb-2">
                  {uploadedFile ? uploadedFile.name : 'Pilih file CSV atau Excel'}
                </div>
                <div className="text-xs text-muted-foreground mb-3">
                  Format: CSV dengan kolom sesuai template
                </div>
                <Input
                  id="file-upload"
                  type="file"
                  accept=".csv,.xlsx,.xls"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <Button type="button" variant="outline" size="sm" asChild>
                  <label htmlFor="file-upload" className="cursor-pointer">
                    Pilih File
                  </label>
                </Button>
              </Label>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex gap-2">
                <Download className="w-5 h-5 text-blue-600 flex-shrink-0" />
                <div className="text-sm">
                  <p className="font-medium text-blue-900 mb-1">Download Template</p>
                  <p className="text-blue-700 mb-2">
                    Download template Excel/CSV untuk memastikan format data sudah benar.
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleDownloadTemplate}
                    className="text-blue-700 border-blue-300"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Download Template
                  </Button>
                </div>
              </div>
            </div>

            <div className="text-xs text-muted-foreground space-y-1">
              <p className="font-medium">Kolom yang WAJIB diisi:</p>
              <ul className="list-disc list-inside space-y-0.5 ml-2">
                <li><strong>Kode Barang</strong> (wajib)</li>
                <li><strong>Nama Barang</strong> (wajib)</li>
                <li><strong>Jenis Order</strong>: Offset, Rotogravure, Kantong Teh (wajib)</li>
                <li><strong>Jenis Kemasan</strong>: Flexibel, Boks, Roto, Polos (wajib)</li>
                <li><strong>Bentuk</strong> (wajib)</li>
                <li><strong>Satuan</strong>: Pcs, Pack, Box, Lusin, Kg, Meter (wajib)</li>
                <li><strong>Ziplock</strong>: Zipper, Non Zipper (wajib)</li>
                <li><strong>Dimensi Lebar dan Tinggi</strong> (wajib)</li>
                <li>Dimensi Panjang dan Gusset (opsional)</li>
              </ul>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setImportDialogOpen(false);
                setUploadedFile(null);
              }}
            >
              Batal
            </Button>
            <Button onClick={handleImportConfirm} disabled={!uploadedFile}>
              <Upload className="w-4 h-4 mr-2" />
              Import Data
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
