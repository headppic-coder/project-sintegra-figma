import { useState, useEffect } from 'react';
import { Database, RefreshCw, HardDrive, Package, BarChart3, TrendingUp, Activity, Calendar } from 'lucide-react';
import { PageHeader } from '../../components/page-header';
import { Card, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { api } from '../../lib/api';
import { toast } from 'sonner';

interface CollectionStats {
  name: string;
  count: number;
  size: number;
  sizeFormatted: string;
}

interface DatabaseStats {
  totalRecords: number;
  collections: CollectionStats[];
  storageSize: number;
  storageSizeFormatted: string;
  error?: string;
}

const COLLECTION_LABELS: Record<string, { label: string; icon: string; color: string }> = {
  'customer': { label: 'Customer', icon: '👥', color: 'bg-blue-100 text-blue-700' },
  'prospective-customer': { label: 'Calon Customer', icon: '🎯', color: 'bg-purple-100 text-purple-700' },
  'pipeline': { label: 'Pipeline', icon: '📊', color: 'bg-green-100 text-green-700' },
  'pipeline-log': { label: 'Log Pipeline', icon: '📝', color: 'bg-slate-100 text-slate-700' },
  'quotation': { label: 'Penawaran', icon: '📄', color: 'bg-yellow-100 text-yellow-700' },
  'sales-order': { label: 'Sales Order', icon: '🛒', color: 'bg-blue-100 text-blue-700' },
  'delivery-note': { label: 'Surat Jalan', icon: '🚚', color: 'bg-green-100 text-green-700' },
  'region': { label: 'Wilayah', icon: '🗺️', color: 'bg-teal-100 text-teal-700' },
  'segment': { label: 'Segmen', icon: '🏷️', color: 'bg-pink-100 text-pink-700' },
  'lead-source': { label: 'Sumber Lead', icon: '📍', color: 'bg-orange-100 text-orange-700' },
  'sales-activity': { label: 'Aktivitas Sales', icon: '✅', color: 'bg-indigo-100 text-indigo-700' },
  'custom-item': { label: 'Barang Custom', icon: '📦', color: 'bg-cyan-100 text-cyan-700' },
  'price-formula': { label: 'Formula Harga', icon: '💰', color: 'bg-emerald-100 text-emerald-700' },
  'documentation': { label: 'Dokumentasi', icon: '📚', color: 'bg-gray-100 text-gray-700' },
  'user': { label: 'User', icon: '👤', color: 'bg-red-100 text-red-700' },
  'product-type': { label: 'Jenis Produk', icon: '🏭', color: 'bg-lime-100 text-lime-700' },
  'industry-category': { label: 'Kategori Industri', icon: '🏢', color: 'bg-violet-100 text-violet-700' },
  'pipeline-followup': { label: 'Follow Up Pipeline', icon: '📞', color: 'bg-fuchsia-100 text-fuchsia-700' },
  'pipeline-stage': { label: 'Tahapan Pipeline', icon: '🎯', color: 'bg-amber-100 text-amber-700' },
  'klaim-bbm': { label: 'Klaim BBM', icon: '⛽', color: 'bg-rose-100 text-rose-700' },
};

export function DatabaseStats() {
  const [stats, setStats] = useState<DatabaseStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const result = await api.getDatabaseStats();
      setStats(result);
      setLastRefresh(new Date());

      if (result.error) {
        toast.error('Gagal memuat statistik database');
      } else {
        toast.success('Statistik database berhasil diperbarui');
      }
    } catch (error) {
      console.error('Error fetching database stats:', error);
      toast.error('Gagal memuat statistik database');
    } finally {
      setLoading(false);
    }
  };

  const getCollectionLabel = (name: string) => {
    return COLLECTION_LABELS[name]?.label || name;
  };

  const getCollectionIcon = (name: string) => {
    return COLLECTION_LABELS[name]?.icon || '📁';
  };

  const getCollectionColor = (name: string) => {
    return COLLECTION_LABELS[name]?.color || 'bg-gray-100 text-gray-700';
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Statistik Database"
          description="Informasi penggunaan data di Supabase"
          breadcrumbs={[
            { label: 'Dashboard', href: '/' },
            { label: 'System' },
            { label: 'Statistik Database' },
          ]}
        />
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2 text-muted-foreground" />
            <div className="text-sm text-muted-foreground">Memuat statistik...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Statistik Database"
        description="Informasi penggunaan data di Supabase"
        breadcrumbs={[
          { label: 'Dashboard', href: '/' },
          { label: 'System' },
          { label: 'Statistik Database' },
        ]}
        actions={
          <div className="flex items-center gap-3">
            {lastRefresh && (
              <div className="text-sm text-muted-foreground flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                <span>
                  Terakhir diperbarui: {lastRefresh.toLocaleTimeString('id-ID', {
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                  })}
                </span>
              </div>
            )}
            <Button onClick={fetchStats} variant="outline" disabled={loading}>
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        }
      />

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Records</p>
                <p className="text-3xl font-bold mt-2">{stats?.totalRecords.toLocaleString('id-ID') || 0}</p>
                <div className="flex items-center gap-1 mt-2">
                  <TrendingUp className="w-3 h-3 text-green-600" />
                  <span className="text-xs text-green-600 font-medium">Aktif</span>
                </div>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Database className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Collections</p>
                <p className="text-3xl font-bold mt-2">{stats?.collections.length || 0}</p>
                <p className="text-xs text-muted-foreground mt-2">Tabel Database</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <Package className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Storage Used</p>
                <p className="text-3xl font-bold mt-2">{stats?.storageSizeFormatted || '0 Bytes'}</p>
                <p className="text-xs text-muted-foreground mt-2">Estimasi JSON</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <HardDrive className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Terbesar</p>
                <p className="text-2xl font-bold mt-2">
                  {stats?.collections && stats.collections.length > 0
                    ? getCollectionLabel(
                        stats.collections.reduce((max, col) =>
                          col.count > max.count ? col : max
                        ).name
                      )
                    : '-'}
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                  {stats?.collections && stats.collections.length > 0
                    ? `${stats.collections.reduce((max, col) =>
                        col.count > max.count ? col : max
                      ).count.toLocaleString('id-ID')} records`
                    : 'Tidak ada data'}
                </p>
              </div>
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <Activity className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Collections Detail */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-muted-foreground" />
              <h3 className="font-semibold text-lg">Detail Collections</h3>
            </div>
            <Badge variant="outline" className="text-xs">
              Diurutkan berdasarkan jumlah records
            </Badge>
          </div>

          {stats?.collections && stats.collections.length > 0 ? (
            <div className="space-y-2">
              {[...stats.collections]
                .sort((a, b) => b.count - a.count)
                .map((collection, index) => {
                  const percentage = stats.totalRecords > 0
                    ? (collection.count / stats.totalRecords) * 100
                    : 0;

                  return (
                    <div
                      key={collection.name}
                      className="group relative overflow-hidden border rounded-lg hover:shadow-md transition-all"
                    >
                      {/* Progress bar background */}
                      <div
                        className="absolute inset-0 bg-gradient-to-r from-blue-50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"
                        style={{ width: `${Math.min(percentage * 2, 100)}%` }}
                      />

                      <div className="relative flex items-center justify-between p-4">
                        <div className="flex items-center gap-4 flex-1">
                          <div className="flex items-center justify-center w-10 h-10 bg-muted rounded-lg text-xl">
                            {getCollectionIcon(collection.name)}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-medium text-base">
                                {getCollectionLabel(collection.name)}
                              </span>
                              <Badge variant="outline" className={`${getCollectionColor(collection.name)} text-xs`}>
                                {collection.count.toLocaleString('id-ID')}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-3 text-xs text-muted-foreground">
                              <code className="bg-muted px-2 py-0.5 rounded font-mono">
                                {collection.name}
                              </code>
                              <span>•</span>
                              <span className="font-medium">{percentage.toFixed(1)}% dari total</span>
                            </div>
                          </div>
                        </div>
                        <div className="text-right ml-4">
                          <p className="text-base font-semibold">{collection.sizeFormatted}</p>
                          <p className="text-xs text-muted-foreground">Storage</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <Database className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p className="text-sm">Tidak ada data di database</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Top Collections and Connection Info */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Top 5 Collections */}
        <Card>
          <CardContent className="p-6">
            <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-green-600" />
              Top 5 Collections
            </h3>
            <div className="space-y-3">
              {stats?.collections && stats.collections.length > 0 ? (
                [...stats.collections]
                  .sort((a, b) => b.count - a.count)
                  .slice(0, 5)
                  .map((collection, index) => (
                    <div key={collection.name} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center w-6 h-6 bg-muted rounded text-xs font-bold">
                          #{index + 1}
                        </div>
                        <span className="text-sm">{getCollectionIcon(collection.name)}</span>
                        <span className="text-sm font-medium">
                          {getCollectionLabel(collection.name)}
                        </span>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {collection.count.toLocaleString('id-ID')}
                      </Badge>
                    </div>
                  ))
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Tidak ada data
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Connection Info */}
        <Card>
          <CardContent className="p-6">
            <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
              <Database className="w-5 h-5 text-blue-600" />
              Informasi Koneksi
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between items-start">
                <span className="text-sm text-muted-foreground">Database Type</span>
                <span className="text-sm font-medium text-right">Supabase Cloud</span>
              </div>
              <div className="flex justify-between items-start">
                <span className="text-sm text-muted-foreground">Table Name</span>
                <code className="text-xs font-mono font-medium bg-muted px-2 py-1 rounded">
                  kv_store_6a7942bb
                </code>
              </div>
              <div className="flex justify-between items-start">
                <span className="text-sm text-muted-foreground">Project ID</span>
                <code className="text-xs font-mono font-medium bg-muted px-2 py-1 rounded">
                  xbzxxzwisotukyvwpqql
                </code>
              </div>
              <div className="flex justify-between items-start">
                <span className="text-sm text-muted-foreground">Storage Model</span>
                <span className="text-sm font-medium text-right">Key-Value Store (JSONB)</span>
              </div>
              <div className="flex justify-between items-start">
                <span className="text-sm text-muted-foreground">Region</span>
                <span className="text-sm font-medium text-right">Southeast Asia (Singapore)</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Notes and Information */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-5">
            <div className="flex gap-3">
              <Database className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm">
                <p className="font-semibold text-blue-900 mb-2">Informasi Penyimpanan</p>
                <ul className="space-y-1.5 text-blue-800">
                  <li className="flex items-start gap-2">
                    <span className="mt-1">•</span>
                    <span>Data tersimpan secara permanen di Supabase Cloud (Singapore)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="mt-1">•</span>
                    <span>Ukuran storage adalah estimasi berdasarkan JSON size</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="mt-1">•</span>
                    <span>Free tier Supabase: 500 MB storage limit</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="mt-1">•</span>
                    <span>Data tidak akan terhapus otomatis kecuali dihapus manual</span>
                  </li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-green-50 border-green-200">
          <CardContent className="p-5">
            <div className="flex gap-3">
              <Activity className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm">
                <p className="font-semibold text-green-900 mb-2">Performa & Keamanan</p>
                <ul className="space-y-1.5 text-green-800">
                  <li className="flex items-start gap-2">
                    <span className="mt-1">•</span>
                    <span>Backup otomatis setiap hari oleh Supabase</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="mt-1">•</span>
                    <span>Koneksi terenkripsi SSL/TLS untuk keamanan data</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="mt-1">•</span>
                    <span>Point-in-time recovery tersedia untuk disaster recovery</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="mt-1">•</span>
                    <span>Database dioptimasi untuk performa query tinggi</span>
                  </li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
