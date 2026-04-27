import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { Plus, Database } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { PageHeader } from '../../components/page-header';
import { DataTable } from '../../components/data-table';
import { toast } from 'sonner';
import { api } from '../../lib/api';
import { indonesiaRegions } from '../../../data/indonesia-regions';

interface Region {
  id: string;
  kecamatan: string;
  kotaKabupaten: string;
  provinsi: string;
  negara: string;
  createdAt: string;
}

export function Regions() {
  const navigate = useNavigate();
  const [regions, setRegions] = useState<Region[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const columns = [
    {
      key: 'kecamatan',
      label: 'Kecamatan',
    },
    {
      key: 'kotaKabupaten',
      label: 'Kota / Kabupaten',
    },
    {
      key: 'provinsi',
      label: 'Provinsi',
    },
    {
      key: 'negara',
      label: 'Negara',
    },
  ];

  useEffect(() => {
    fetchRegions();
  }, []);

  const fetchRegions = async () => {
    try {
      setLoading(true);
      const result = await api.getRegions();
      setRegions(result || []);
    } catch (error) {
      console.error('Error fetching regions:', error);
      toast.error('Gagal memuat data wilayah');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (item: Region) => {
    if (!confirm('Apakah Anda yakin ingin menghapus wilayah ini?')) return;

    try {
      await api.deleteRegion(item.id);
      toast.success('Wilayah berhasil dihapus');
      fetchRegions();
    } catch (error) {
      console.error('Error deleting region:', error);
      toast.error('Gagal menghapus wilayah');
    }
  };

  const handleEdit = (item: Region) => {
    navigate(`/sales/regions/${item.id}`);
  };

  const handleImportIndonesiaRegions = async () => {
    if (!confirm(`Apakah Anda yakin ingin mengimpor ${indonesiaRegions.length} wilayah Indonesia? Proses ini mungkin memakan waktu beberapa menit.`)) return;

    try {
      setLoading(true);
      toast.info('Memulai proses import wilayah Indonesia...');

      let successCount = 0;
      let errorCount = 0;

      // Import in batches to avoid overwhelming the system
      for (const region of indonesiaRegions) {
        try {
          await api.createRegion(region);
          successCount++;

          // Show progress every 50 regions
          if (successCount % 50 === 0) {
            toast.info(`Progress: ${successCount}/${indonesiaRegions.length} wilayah...`);
          }
        } catch (error) {
          console.error('Error importing region:', region, error);
          errorCount++;
        }
      }

      toast.success(`Import selesai! Berhasil: ${successCount}, Gagal: ${errorCount}`);
      fetchRegions();
    } catch (error) {
      console.error('Error importing regions:', error);
      toast.error('Gagal mengimpor wilayah');
    } finally {
      setLoading(false);
    }
  };

  const handleConvertToUppercase = async () => {
    if (regions.length === 0) {
      toast.error('Tidak ada data wilayah untuk dikonversi');
      return;
    }

    if (!confirm(`Apakah Anda yakin ingin mengubah semua ${regions.length} wilayah menjadi huruf besar? Proses ini tidak dapat dibatalkan.`)) return;

    try {
      setLoading(true);
      toast.info('Memulai konversi data wilayah ke huruf besar...');

      let successCount = 0;
      let errorCount = 0;

      for (const region of regions) {
        try {
          const uppercasedData = {
            kecamatan: region.kecamatan?.toUpperCase() || '',
            kotaKabupaten: region.kotaKabupaten?.toUpperCase() || '',
            provinsi: region.provinsi?.toUpperCase() || '',
            negara: region.negara?.toUpperCase() || '',
          };

          await api.updateRegion(region.id, uppercasedData);
          successCount++;

          // Show progress every 50 regions
          if (successCount % 50 === 0) {
            toast.info(`Progress: ${successCount}/${regions.length} wilayah...`);
          }
        } catch (error) {
          console.error('Error updating region:', region, error);
          errorCount++;
        }
      }

      toast.success(`Konversi selesai! Berhasil: ${successCount}, Gagal: ${errorCount}`);
      fetchRegions();
    } catch (error) {
      console.error('Error converting regions:', error);
      toast.error('Gagal mengkonversi wilayah');
    } finally {
      setLoading(false);
    }
  };

  // Filter data
  const filteredRegions = regions.filter((region) => {
    const matchesSearch = 
      region.kecamatan?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      region.kotaKabupaten?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      region.provinsi?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      region.negara?.toLowerCase().includes(searchQuery.toLowerCase());
    
    return matchesSearch;
  });

  return (
    <div className="space-y-4">
      <PageHeader
        title="Master Wilayah"
        description="Kelola data wilayah (kecamatan, kota/kabupaten, provinsi, negara)"
        breadcrumbs={[
          { label: 'Dashboard', href: '/' },
          { label: 'Sales' },
          { label: 'Master Wilayah' },
        ]}
        actions={
          <div className="flex gap-2">
            <Button
              onClick={handleImportIndonesiaRegions}
              variant="outline"
              disabled={loading}
            >
              <Database className="w-4 h-4 mr-2" />
              Import Wilayah Indonesia
            </Button>
            <Button
              onClick={handleConvertToUppercase}
              variant="outline"
              disabled={loading || regions.length === 0}
            >
              Konversi ke Huruf Besar
            </Button>
            <Button onClick={() => navigate('/sales/regions/new')}>
              <Plus className="w-4 h-4 mr-2" />
              Tambah Wilayah
            </Button>
          </div>
        }
      />

      {/* Info Banner */}
      {regions.length === 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <Database className="w-5 h-5 text-blue-600 mt-0.5" />
            <div>
              <h3 className="font-medium text-blue-900 mb-1">Data Wilayah Belum Terisi</h3>
              <p className="text-sm text-blue-700 mb-3">
                Klik tombol <strong>"Import Wilayah Indonesia"</strong> untuk mengisi {indonesiaRegions.length} wilayah Indonesia
                (38 provinsi dan kota/kabupaten di seluruh Indonesia).
              </p>
              <p className="text-xs text-blue-600">
                Proses import membutuhkan waktu beberapa menit. Pastikan koneksi internet stabil.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-3 items-center">
        <Input
          placeholder="Cari wilayah..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="max-w-xs"
        />
        {regions.length > 0 && (
          <div className="text-sm text-muted-foreground">
            Total: {regions.length} wilayah
          </div>
        )}
      </div>

      {/* Data Table */}
      <DataTable
        columns={columns}
        data={filteredRegions}
        loading={loading}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />
    </div>
  );
}
