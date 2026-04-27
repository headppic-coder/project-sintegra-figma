import { useState, useEffect } from 'react';
import { Plus, Building } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';
import { DataTable } from '../../components/data-table';
import { PageHeader } from '../../components/page-header';
import { ModalForm } from '../../components/modal-form';
import { toast } from 'sonner';
import { api } from '../../lib/api';

interface Company {
  id: string;
  companyName: string;
  address: string;
  phone?: string;
  email?: string;
  createdAt: string;
}

export function MasterCompanies() {
  const [data, setData] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<Company | null>(null);
  const [formData, setFormData] = useState({
    companyName: '',
    address: '',
    phone: '',
    email: '',
  });

  const fetchData = async () => {
    try {
      const result = await api.getCompanies();
      // Ensure all optional fields have default values
      const normalizedData = (result || []).map((item: any) => ({
        ...item,
        phone: item.phone || '',
        email: item.email || '',
      }));
      setData(normalizedData);
    } catch (error) {
      console.error('Error fetching companies:', error);
      toast.error('Gagal mengambil data perusahaan');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.companyName || !formData.address) {
      toast.error('Nama perusahaan dan alamat wajib diisi');
      return;
    }

    try {
      const payload = {
        companyName: formData.companyName,
        address: formData.address,
        phone: formData.phone,
        email: formData.email,
      };

      if (editingItem) {
        await api.update(editingItem.id, payload);
      } else {
        await api.createCompany(payload);
      }

      toast.success(editingItem ? 'Data berhasil diperbarui' : 'Data berhasil ditambahkan');
      setShowModal(false);
      resetForm();
      fetchData();
    } catch (error) {
      console.error('Error saving company:', error);
      toast.error('Gagal menyimpan data');
    }
  };

  const handleEdit = (item: Company) => {
    setEditingItem(item);
    setFormData({
      companyName: item.companyName,
      address: item.address,
      phone: item.phone || '',
      email: item.email || '',
    });
    setShowModal(true);
  };

  const handleView = (item: Company) => {
    handleEdit(item);
  };

  const handleDelete = async (item: Company) => {
    if (!confirm('Apakah Anda yakin ingin menghapus perusahaan ini?')) return;

    try {
      await api.delete(item.id);
      toast.success('Data berhasil dihapus');
      fetchData();
    } catch (error) {
      console.error('Error deleting company:', error);
      toast.error('Gagal menghapus data');
    }
  };

  const resetForm = () => {
    setFormData({
      companyName: '',
      address: '',
      phone: '',
      email: '',
    });
    setEditingItem(null);
  };

  const columns = [
    {
      key: 'companyName',
      label: 'Nama Perusahaan',
    },
    {
      key: 'address',
      label: 'Alamat',
      render: (value: any) => (
        <div className="max-w-md truncate">{value}</div>
      ),
    },
    {
      key: 'phone',
      label: 'Telepon',
      render: (value: any) => value || '-',
    },
    {
      key: 'email',
      label: 'Email',
      render: (value: any) => value || '-',
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Perusahaan"
        description="Kelola data perusahaan dalam grup atau holding company"
        icon={Building}
      />

      <div className="flex justify-between items-center">
        <div className="text-sm text-muted-foreground">
          Total: <span className="font-semibold text-foreground">{data.length}</span> perusahaan
        </div>
        <Button onClick={() => setShowModal(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Tambah Perusahaan
        </Button>
      </div>

      <DataTable
        data={data}
        columns={columns}
        loading={loading}
        onView={handleView}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />

      <ModalForm
        open={showModal}
        onOpenChange={(open) => {
          setShowModal(open);
          if (!open) resetForm();
        }}
        title={editingItem ? 'Edit Perusahaan' : 'Tambah Perusahaan'}
        maxWidth="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="companyName">Nama Perusahaan *</Label>
            <Input
              id="companyName"
              value={formData.companyName}
              onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
              placeholder="Contoh: PT ABC Manufacturing"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">Alamat *</Label>
            <Textarea
              id="address"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              placeholder="Alamat lengkap perusahaan"
              rows={3}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="phone">Telepon</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="021-12345678"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="info@company.com"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setShowModal(false);
                resetForm();
              }}
            >
              Batal
            </Button>
            <Button type="submit">
              {editingItem ? 'Perbarui' : 'Simpan'}
            </Button>
          </div>
        </form>
      </ModalForm>
    </div>
  );
}