import { useState, useEffect } from 'react';
import { PageHeader } from '../../components/page-header';
import { Button } from '../../components/ui/button';
import { Card } from '../../components/ui/card';
import { api } from '../../lib/api';
import { FileText, Plus, Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { DataTable } from '../../components/data-table';

export default function PriceFormulaRoto() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const formulas = await api.getPriceFormulasRoto();
      setData(formulas);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Gagal memuat data');
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    toast.info('Fitur tambah formula akan segera tersedia');
  };

  const handleEdit = (item: any) => {
    toast.info('Fitur edit formula akan segera tersedia');
  };

  const handleDelete = async (item: any) => {
    if (!confirm('Apakah Anda yakin ingin menghapus formula ini?')) return;

    try {
      await api.deletePriceFormulaRoto(item.id);
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
        <code className="text-xs bg-purple-50 px-2 py-1 rounded border border-purple-200">
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
      header: 'Customer',
      accessorKey: 'customer_name',
      render: (value: string) => value || '-'
    },
    {
      header: 'Ukuran (Width)',
      accessorKey: 'width',
      render: (value: number) => value ? `${value} cm` : '-'
    },
    {
      header: 'Material',
      accessorKey: 'material_name',
      render: (value: string) => value || '-'
    },
    {
      header: 'Printing',
      accessorKey: 'printing_colors',
      render: (value: number, row: any) => {
        if (!value) return '-';
        return `${value} warna (${row.printing_method || 'Rotogravure'})`;
      }
    },
    {
      header: 'Roll Length',
      accessorKey: 'roll_length',
      render: (value: number) => value ? `${value} m` : '-'
    },
    {
      header: 'Qty (Rolls)',
      accessorKey: 'quantity_rolls',
      render: (value: number) => value ? value.toLocaleString() : '-'
    },
    {
      header: 'Harga/Roll',
      accessorKey: 'selling_price_per_roll',
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
        title="Formula Harga Roto"
        description="Daftar formula perhitungan harga untuk produk rotogravure/flexo roll"
        icon={FileText}
        breadcrumbs={[
          { label: 'Dashboard', href: '/' },
          { label: 'Master' },
          { label: 'Formula Harga Roto' }
        ]}
      />

      {/* Info Banner */}
      <Card className="p-4 bg-purple-50 border-purple-200">
        <div className="flex items-start gap-3">
          <FileText className="w-5 h-5 text-purple-600 mt-0.5" />
          <div>
            <h3 className="font-medium text-purple-900 mb-1">Formula Harga Roto</h3>
            <p className="text-sm text-purple-700">
              Digunakan untuk menghitung harga produk rotogravure/flexo roll (PE, PP, PET, BOPP multi-layer).
              Mencakup biaya material film, tinta, solvent, cylinder, printing, laminating, dan slitting.
            </p>
          </div>
        </div>
      </Card>

      {/* Stats Cards */}
      <div className="grid grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="text-sm text-gray-600 mb-1">Total Formula</div>
          <div className="text-2xl font-bold text-purple-600">{data.length}</div>
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
          <h2 className="font-semibold">Daftar Formula Harga Roto</h2>
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
    </div>
  );
}
