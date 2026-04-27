import { useState, useEffect } from 'react';
import { Input } from '../../components/ui/input';
import { Badge } from '../../components/ui/badge';
import { Card, CardContent } from '../../components/ui/card';
import { toast } from 'sonner';
import { api } from '../../lib/api';
import { formatDate } from '../../components/ui/utils';
import { History, Search, Calendar } from 'lucide-react';
import { DataTable } from '../../components/data-table';

interface PipelineLog {
  id: string;
  pipelineId: string;
  action: string;
  changes: string[];
  changedBy: string;
  description: string;
  createdAt: string;
}

interface Pipeline {
  id: string;
  customer: string;
}

export default function LogHistori() {
  const [logs, setLogs] = useState<PipelineLog[]>([]);
  const [pipelines, setPipelines] = useState<Pipeline[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateRange, setDateRange] = useState<string>('1'); // Default 1 hari

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [logsResult, pipelinesResult] = await Promise.all([
        api.getAllPipelineLogs(),
        api.getPipelines(),
      ]);
      setLogs(logsResult || []);
      setPipelines(pipelinesResult || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Gagal memuat data log histori');
    } finally {
      setLoading(false);
    }
  };

  const getPipelineCustomer = (pipelineId: string) => {
    const pipeline = pipelines.find(p => p.id === pipelineId);
    return pipeline?.customer || 'Pipeline tidak ditemukan';
  };

  const filteredLogs = logs
    .filter(log => {
      const customer = getPipelineCustomer(log.pipelineId);
      const matchesSearch =
        customer.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.changedBy.toLowerCase().includes(searchTerm.toLowerCase());

      if (dateRange === 'all') {
        return matchesSearch;
      }

      const logDate = new Date(log.createdAt);
      const today = new Date();
      const daysAgo = new Date();
      daysAgo.setDate(today.getDate() - parseInt(dateRange));

      const matchesDateRange = logDate >= daysAgo;

      return matchesSearch && matchesDateRange;
    })
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());


  const columns = [
    {
      key: 'createdAt',
      label: 'Tanggal & Waktu',
      render: (_: any, row: any) => (
        <div className="flex flex-col gap-1">
          <span className="font-medium">{formatDate(row.createdAt)}</span>
          <span className="text-xs text-muted-foreground">
            {new Date(row.createdAt).toLocaleTimeString('id-ID', {
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit',
            })}
          </span>
        </div>
      ),
    },
    {
      key: 'pipelineId',
      label: 'ID Pipeline',
      render: (_: any, row: any) => (
        <div className="font-mono text-xs bg-muted px-2 py-1 rounded inline-block">
          {row.pipelineId || '-'}
        </div>
      ),
    },
    {
      key: 'customer',
      label: 'Customer',
      render: (_: any, row: any) => (
        <div className="font-medium">{getPipelineCustomer(row.pipelineId)}</div>
      ),
    },
    {
      key: 'action',
      label: 'Aksi',
      render: (_: any, row: any) => (
        <Badge
          variant="outline"
          className={`${
            row.action === 'Create'
              ? 'bg-green-100 text-green-700 border-green-300'
              : row.action === 'Update'
              ? 'bg-blue-100 text-blue-700 border-blue-300'
              : 'bg-orange-100 text-orange-700 border-orange-300'
          }`}
        >
          {row.action === 'Create' ? '✨ Dibuat' : '✏️ ' + row.action}
        </Badge>
      ),
    },
    {
      key: 'description',
      label: 'Deskripsi',
      render: (_: any, row: any) => (
        <div className="max-w-md">
          <div className="text-sm">{row.description}</div>
          {row.changes && row.changes.length > 0 && (
            <div className="mt-2 space-y-1">
              {row.changes.map((change: string, idx: number) => (
                <div key={idx} className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
                  • {change}
                </div>
              ))}
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'changedBy',
      label: 'Diubah Oleh',
      render: (_: any, row: any) => (
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-medium">
            {row.changedBy.charAt(0).toUpperCase()}
          </div>
          <span className="text-sm">{row.changedBy}</span>
        </div>
      ),
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Memuat log histori...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center">
                <History className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Log</p>
                <p className="text-2xl font-bold">{logs.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg bg-green-100 text-green-700 flex items-center justify-center">
                <History className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Pipeline Dibuat</p>
                <p className="text-2xl font-bold">
                  {logs.filter(l => l.action === 'Create').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg bg-orange-100 text-orange-700 flex items-center justify-center">
                <History className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Perubahan</p>
                <p className="text-2xl font-bold">
                  {logs.filter(l => l.action !== 'Create').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Cari customer, aksi, deskripsi, atau user..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="w-full md:w-64">
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <select
                  value={dateRange}
                  onChange={(e) => setDateRange(e.target.value)}
                  className="w-full h-10 pl-10 pr-4 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="1">1 Hari Terakhir</option>
                  <option value="7">7 Hari Terakhir</option>
                  <option value="30">30 Hari Terakhir</option>
                  <option value="90">90 Hari Terakhir</option>
                  <option value="all">Semua Waktu</option>
                </select>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Data Table */}
      <Card>
        <CardContent className="pt-6">
          {filteredLogs.length > 0 ? (
            <DataTable
              columns={columns}
              data={filteredLogs}
            />
          ) : (
            <div className="text-center py-12">
              <History className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">Tidak ada log histori</h3>
              <p className="text-muted-foreground">
                {searchTerm || dateRange !== 'all'
                  ? 'Tidak ada log yang sesuai dengan filter'
                  : 'Belum ada perubahan yang tercatat'}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
