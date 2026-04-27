import { useState, useEffect } from 'react';
import { Plus, Search, FileDown, TrendingUp } from 'lucide-react';
import { useNavigate } from 'react-router';
import { Button } from '../../components/ui/button';
import { DataTable } from '../../components/data-table';
import { PageHeader } from '../../components/page-header';
import { StatCard } from '../../components/stat-card';
import { Card } from '../../components/ui/card';
import { toast } from 'sonner';
import { api } from '../../lib/api';
import { Input } from '../../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { formatDate } from '../../components/ui/utils';

interface SalesOrder {
  id: string;
  orderNumber: string;
  orderDate: string;
  customerName: string;
  salesPerson: string;
  totalAmount: number;
  notes: string;
  itemQty: number;
  status: 'Draft' | 'Preparing' | 'On Progress' | 'Completed' | 'Cancelled';
  createdAt: string;
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

const getStatusBadgeClass = (status: string) => {
  const classes: Record<string, string> = {
    'Draft': 'bg-gray-100 text-gray-700 border-gray-300',
    'Preparing': 'bg-yellow-100 text-yellow-700 border-yellow-300',
    'On Progress': 'bg-blue-100 text-blue-700 border-blue-300',
    'Completed': 'bg-green-100 text-green-700 border-green-300',
    'Cancelled': 'bg-red-100 text-red-700 border-red-300',
  };
  return classes[status] || 'bg-gray-100 text-gray-700';
};

export function SalesOrders() {
  const navigate = useNavigate();
  const [data, setData] = useState<SalesOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [salesFilter, setSalesFilter] = useState('all');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const result = await api.getSalesOrders();
      setData(result || []);
    } catch (error) {
      console.error('Error loading sales orders:', error);
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  // Calculate stats
  const stats = {
    total: data.length,
    open: data.filter(d => d.status === 'Draft' || d.status === 'Preparing').length,
    onProgress: data.filter(d => d.status === 'On Progress').length,
    completed: data.filter(d => d.status === 'Completed').length,
  };

  // Filter data
  const filteredData = data.filter(item => {
    const matchSearch =
      item.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.salesPerson.toLowerCase().includes(searchQuery.toLowerCase());

    const matchStatus = statusFilter === 'all' || item.status === statusFilter;
    const matchSales = salesFilter === 'all' || item.salesPerson === salesFilter;

    return matchSearch && matchStatus && matchSales;
  });

  // Get unique sales persons for filter
  const salesPersons = Array.from(new Set(data.map(d => d.salesPerson)));

  const handleView = (order: SalesOrder) => {
    console.log('View detail:', order);
    toast.info(`Detail untuk order ${order.orderNumber}`);
    // TODO: Navigate to detail page
    // navigate(`/sales/sales-orders/detail/${order.id}`);
  };

  const handleEdit = (order: SalesOrder) => {
    console.log('Edit order:', order);
    toast.info(`Edit order ${order.orderNumber}`);
    // TODO: Navigate to edit page
    // navigate(`/sales/sales-orders/${order.id}/edit`);
  };

  const handleDelete = async (order: SalesOrder) => {
    if (!confirm(`Apakah Anda yakin ingin menghapus order ${order.orderNumber}?`)) {
      return;
    }

    try {
      await api.delete(order.id);
      toast.success('Order berhasil dihapus');
      loadData();
    } catch (error) {
      console.error('Error deleting order:', error);
      toast.error('Gagal menghapus order');
    }
  };

  const handleExport = () => {
    toast.success('Export data sedang diproses...');
  };

  const columns = [
    {
      key: 'orderNumber',
      label: 'No Order',
      render: (value: string) => (
        <span className="font-semibold text-blue-600 hover:text-blue-700 cursor-pointer">
          {value}
        </span>
      ),
    },
    {
      key: 'orderDate',
      label: 'Tgl Order',
      render: (value: string) => (
        <span className="text-sm">{formatDate(value)}</span>
      ),
    },
    {
      key: 'customerName',
      label: 'Nama Customer',
      render: (value: string) => (
        <span className="text-sm">{value}</span>
      ),
    },
    {
      key: 'salesPerson',
      label: 'Nama Sales',
      render: (value: string) => (
        <span className="text-sm">{value}</span>
      ),
    },
    {
      key: 'totalAmount',
      label: 'Total Order',
      render: (value: number) => (
        <span className="text-sm font-medium">{formatCurrency(value)}</span>
      ),
    },
    {
      key: 'notes',
      label: 'Notes',
      render: (value: string) => (
        <span className="text-sm text-muted-foreground truncate max-w-[200px] block">
          {value || '-'}
        </span>
      ),
    },
    {
      key: 'itemQty',
      label: 'Item Qty',
      render: (value: number) => (
        <span className="text-sm">{value}</span>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      render: (value: string) => (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusBadgeClass(value)}`}>
          {value}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Pesanan Penjualan"
        description="Kelola pesanan penjualan dari customer"
      />

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          key="total-orders"
          title="Total Pesanan"
          value={stats.total.toString()}
          icon={TrendingUp}
          color="blue"
          trend={{
            value: '+12%',
            icon: TrendingUp
          }}
        />
        <StatCard
          key="open-orders"
          title="Open"
          value={stats.open.toString()}
          icon={TrendingUp}
          color="blue"
        />
        <StatCard
          key="progress-orders"
          title="On Progress"
          value={stats.onProgress.toString()}
          icon={TrendingUp}
          color="orange"
        />
        <StatCard
          key="completed-orders"
          title="Completed"
          value={stats.completed.toString()}
          icon={TrendingUp}
          color="green"
        />
      </div>

      {/* Filters & Actions */}
      <Card className="p-4">
        <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
          <div className="flex flex-col sm:flex-row gap-3 flex-1 w-full lg:w-auto">
            {/* Search */}
            <div className="relative flex-1 lg:max-w-xs">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                type="text"
                placeholder="Cari pesanan..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Status Filter */}
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Semua Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem key="status-all" value="all">Semua Status</SelectItem>
                <SelectItem key="status-draft" value="Draft">Draft</SelectItem>
                <SelectItem key="status-preparing" value="Preparing">Preparing</SelectItem>
                <SelectItem key="status-progress" value="On Progress">On Progress</SelectItem>
                <SelectItem key="status-completed" value="Completed">Completed</SelectItem>
                <SelectItem key="status-cancelled" value="Cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>

            {/* Sales Filter */}
            <Select value={salesFilter} onValueChange={setSalesFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Semua Sales" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem key="sales-all" value="all">Semua Sales</SelectItem>
                {salesPersons.filter(p => p && typeof p === 'string' && p.trim() !== '').map((person) => (
                  <SelectItem key={`sales-${person}`} value={person}>
                    {person}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 w-full lg:w-auto">
            <Button
              variant="outline"
              onClick={handleExport}
              className="flex-1 lg:flex-none"
            >
              <FileDown className="w-4 h-4 mr-2" />
              Export
            </Button>
            <Button
              onClick={() => navigate('/sales/sales-orders/new')}
              className="flex-1 lg:flex-none"
            >
              <Plus className="w-4 h-4 mr-2" />
              Tambah Pesanan
            </Button>
          </div>
        </div>
      </Card>

      {/* Data Table */}
      <Card className="p-6">
        <DataTable
          columns={columns}
          data={filteredData}
          loading={loading}
          onView={handleView}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      </Card>
    </div>
  );
}
