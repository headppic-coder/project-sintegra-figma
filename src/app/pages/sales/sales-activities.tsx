import { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { PageHeader } from '../../components/page-header';
import { DataTable } from '../../components/data-table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../components/ui/dialog';
import { toast } from 'sonner';
import { api } from '../../lib/api';

interface SalesActivity {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
}

export function SalesActivities() {
  const [activities, setActivities] = useState<SalesActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingActivity, setEditingActivity] = useState<SalesActivity | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
  });

  const columns = [
    {
      key: 'name',
      label: 'Nama Aktivitas',
    },
    {
      key: 'description',
      label: 'Deskripsi',
      render: (value: string) => value || '-',
    },
  ];

  useEffect(() => {
    fetchActivities();
  }, []);

  const fetchActivities = async () => {
    try {
      setLoading(true);
      const result = await api.getSalesActivities();
      setActivities(result || []);
    } catch (error) {
      console.error('Error fetching sales activities:', error);
      toast.error('Gagal memuat aktivitas sales');
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setEditingActivity(null);
    setFormData({
      name: '',
      description: '',
    });
    setDialogOpen(true);
  };

  const handleEdit = (activity: SalesActivity) => {
    setEditingActivity(activity);
    setFormData({
      name: activity.name,
      description: activity.description || '',
    });
    setDialogOpen(true);
  };

  const handleDelete = async (activity: SalesActivity) => {
    if (!confirm('Apakah Anda yakin ingin menghapus aktivitas sales ini?')) return;

    try {
      await api.deleteSalesActivity(activity.id);
      toast.success('Aktivitas sales berhasil dihapus');
      fetchActivities();
    } catch (error) {
      console.error('Error deleting sales activity:', error);
      toast.error('Gagal menghapus aktivitas sales');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast.error('Nama aktivitas harus diisi');
      return;
    }

    try {
      if (editingActivity) {
        await api.updateSalesActivity(editingActivity.id, formData);
        toast.success('Aktivitas sales berhasil diperbarui');
      } else {
        await api.createSalesActivity(formData);
        toast.success('Aktivitas sales berhasil ditambahkan');
      }
      setDialogOpen(false);
      fetchActivities();
    } catch (error) {
      console.error('Error saving sales activity:', error);
      toast.error('Gagal menyimpan aktivitas sales');
    }
  };

  return (
    <div className="space-y-4">
      <PageHeader
        title="Master Aktivitas Sales"
        description="Kelola jenis aktivitas sales"
        breadcrumbs={[
          { label: 'Dashboard', href: '/' },
          { label: 'Master' },
          { label: 'Aktivitas Sales' },
        ]}
        actions={
          <Button onClick={handleAdd}>
            <Plus className="w-4 h-4 mr-2" />
            Tambah Aktivitas
          </Button>
        }
      />

      <DataTable
        columns={columns}
        data={activities}
        loading={loading}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingActivity ? 'Edit Aktivitas Sales' : 'Tambah Aktivitas Sales'}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nama Aktivitas *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Contoh: Chat WA, Visit, Call"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Deskripsi</Label>
              <Input
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Deskripsi aktivitas (opsional)"
              />
            </div>

            <div className="flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Batal
              </Button>
              <Button type="submit">
                {editingActivity ? 'Simpan' : 'Tambah'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
