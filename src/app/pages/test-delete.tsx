import { useState, useEffect } from 'react';
import { PageHeader } from '../components/page-header';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { api } from '../lib/api';
import { toast } from 'sonner';
import { Trash2, RefreshCw } from 'lucide-react';

export function TestDelete() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [regions, setRegions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [customerData, regionData] = await Promise.all([
        api.getCustomers(),
        api.getRegions()
      ]);
      setCustomers(customerData || []);
      setRegions(regionData || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCustomer = async (id: string, name: string) => {
    if (!confirm(`Hapus customer "${name}"?`)) return;

    try {
      console.log('=== START DELETE CUSTOMER ===');
      console.log('ID:', id);
      console.log('Name:', name);

      await api.delete(id);

      console.log('=== DELETE SUCCESS ===');
      toast.success('Customer berhasil dihapus');
      fetchData();
    } catch (error: any) {
      console.error('=== DELETE ERROR ===', error);
      toast.error(`Gagal menghapus: ${error.message}`);
    }
  };

  const handleDeleteRegion = async (id: string, name: string) => {
    if (!confirm(`Hapus wilayah "${name}"?`)) return;

    try {
      console.log('=== START DELETE REGION ===');
      console.log('ID:', id);
      console.log('Name:', name);

      await api.deleteRegion(id);

      console.log('=== DELETE SUCCESS ===');
      toast.success('Wilayah berhasil dihapus');
      fetchData();
    } catch (error: any) {
      console.error('=== DELETE ERROR ===', error);
      toast.error(`Gagal menghapus: ${error.message}`);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="Test Delete Functionality"
        description="Halaman untuk testing fungsi delete"
        breadcrumbs={[
          { label: 'Dashboard', href: '/' },
          { label: 'Test Delete' }
        ]}
      />

      <div className="flex gap-2">
        <Button onClick={fetchData} variant="outline" disabled={loading}>
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh Data
        </Button>
      </div>

      {/* Test Delete Customer */}
      <Card className="p-6">
        <h3 className="font-semibold mb-4">Test Delete Customer ({customers.length} records)</h3>
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {customers.slice(0, 10).map((customer) => (
            <div key={customer.id} className="flex items-center justify-between p-3 bg-gray-50 rounded border">
              <div>
                <div className="font-medium">{customer.customerName}</div>
                <div className="text-xs text-gray-600">ID: {customer.id}</div>
              </div>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => handleDeleteCustomer(customer.id, customer.customerName)}
              >
                <Trash2 className="w-4 h-4 mr-1" />
                Delete
              </Button>
            </div>
          ))}
          {customers.length === 0 && (
            <div className="text-center text-gray-500 py-8">Tidak ada data customer</div>
          )}
        </div>
      </Card>

      {/* Test Delete Region */}
      <Card className="p-6">
        <h3 className="font-semibold mb-4">Test Delete Region ({regions.length} records)</h3>
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {regions.slice(0, 10).map((region) => (
            <div key={region.id} className="flex items-center justify-between p-3 bg-gray-50 rounded border">
              <div>
                <div className="font-medium">{region.kotaKabupaten}, {region.provinsi}</div>
                <div className="text-xs text-gray-600">ID: {region.id}</div>
              </div>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => handleDeleteRegion(region.id, region.kotaKabupaten)}
              >
                <Trash2 className="w-4 h-4 mr-1" />
                Delete
              </Button>
            </div>
          ))}
          {regions.length === 0 && (
            <div className="text-center text-gray-500 py-8">Tidak ada data wilayah</div>
          )}
        </div>
      </Card>

      {/* Console Info */}
      <Card className="p-6 bg-blue-50 border-blue-200">
        <h3 className="font-semibold mb-2">Debug Info</h3>
        <p className="text-sm text-blue-900">
          Buka Developer Tools (F12) → Console tab untuk melihat detail proses delete.
        </p>
        <p className="text-sm text-blue-900 mt-2">
          Setiap delete akan menampilkan log lengkap di console.
        </p>
      </Card>
    </div>
  );
}
