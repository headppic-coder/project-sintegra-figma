import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router';
import { ChevronLeft } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { PageHeader } from '../../components/page-header';
import { Card } from '../../components/ui/card';
import { toast } from 'sonner';
import { api } from '../../lib/api';

interface Region {
  id: string;
  kecamatan: string;
  kotaKabupaten: string;
  provinsi: string;
  negara: string;
  createdAt: string;
}

export function RegionForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = !!id;

  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    kecamatan: '',
    kotaKabupaten: '',
    provinsi: '',
    negara: 'Indonesia',
  });

  useEffect(() => {
    if (isEdit && id) {
      fetchRegionData(id);
    }
  }, [id, isEdit]);

  const fetchRegionData = async (regionId: string) => {
    try {
      setLoading(true);
      const regions = await api.getRegions();
      const result = regions.find((r: Region) => r.id === regionId);

      if (result) {
        setFormData({
          kecamatan: result.kecamatan || '',
          kotaKabupaten: result.kotaKabupaten || '',
          provinsi: result.provinsi || '',
          negara: result.negara || 'Indonesia',
        });
      }
    } catch (error) {
      console.error('Error fetching region data:', error);
      toast.error('Gagal memuat data wilayah');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.kotaKabupaten || !formData.provinsi) {
      toast.error('Kota/Kabupaten dan Provinsi wajib diisi');
      return;
    }

    try {
      setLoading(true);

      if (isEdit && id) {
        await api.updateRegion(id, formData);
        toast.success('Wilayah berhasil diperbarui');
      } else {
        await api.createRegion(formData);
        toast.success('Wilayah berhasil ditambahkan');
      }

      navigate('/sales/regions');
    } catch (error) {
      console.error('Error saving region:', error);
      toast.error('Gagal menyimpan wilayah');
    } finally {
      setLoading(false);
    }
  };

  if (loading && isEdit) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="text-lg font-medium">Memuat data...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-4">
      <PageHeader
        title={isEdit ? 'Edit Wilayah' : 'Tambah Wilayah'}
        description={isEdit ? 'Perbarui data wilayah' : 'Tambahkan wilayah baru ke sistem'}
        breadcrumbs={[
          { label: 'Dashboard', href: '/' },
          { label: 'Sales' },
          { label: 'Master Wilayah', href: '/sales/regions' },
          { label: isEdit ? 'Edit' : 'Tambah' },
        ]}
        actions={
          <Button variant="outline" onClick={() => navigate('/sales/regions')}>
            <ChevronLeft className="w-4 h-4 mr-2" />
            Kembali
          </Button>
        }
      />

      <Card className="p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <h3 className="font-semibold text-base border-b pb-2">Informasi Wilayah</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="negara">Negara *</Label>
                <Input
                  id="negara"
                  value={formData.negara}
                  onChange={(e) => setFormData({ ...formData, negara: e.target.value })}
                  placeholder="Indonesia"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="provinsi">Provinsi *</Label>
                <Input
                  id="provinsi"
                  value={formData.provinsi}
                  onChange={(e) => setFormData({ ...formData, provinsi: e.target.value })}
                  placeholder="Contoh: Jawa Barat"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="kotaKabupaten">Kota / Kabupaten *</Label>
                <Input
                  id="kotaKabupaten"
                  value={formData.kotaKabupaten}
                  onChange={(e) => setFormData({ ...formData, kotaKabupaten: e.target.value })}
                  placeholder="Contoh: Bandung"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="kecamatan">Kecamatan</Label>
                <Input
                  id="kecamatan"
                  value={formData.kecamatan}
                  onChange={(e) => setFormData({ ...formData, kecamatan: e.target.value })}
                  placeholder="Contoh: Cimahi Selatan"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate('/sales/regions')}
            >
              Batal
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Menyimpan...' : (isEdit ? 'Perbarui' : 'Simpan')}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
