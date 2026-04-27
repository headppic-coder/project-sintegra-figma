import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { Eye, Clock } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { PageHeader } from '../../components/page-header';
import { DataTable } from '../../components/data-table';
import { Badge } from '../../components/ui/badge';
import { Input } from '../../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { toast } from 'sonner';
import { api } from '../../lib/api';
import { formatDate } from '../../components/ui/utils';

interface Pipeline {
  id: string;
  customer: string;
  stage: string;
  picSales: string;
  createdAt: string;
}

interface PipelineFollowUp {
  id: string;
  pipelineId: string;
  tanggal: string;
  aktivitas: string;
  stage: string;
  alamat: string;
  hasil: string;
  catatan: string;
  nextFollowUp: string;
  perkiraanJumlah?: string;
  segmen?: string;
  estimasiHarga?: string;
  sumberLead?: string;
  productTypes?: string[];
  quotationNumbers?: string[]; // Array of quotation numbers created from this follow-up
  createdAt: string;
}

interface ProductType {
  id: string;
  code: string;
  name: string;
}

const STAGE_COLORS: Record<string, string> = {
  'Lead': 'bg-gray-500',
  'Qualifikasi': 'bg-blue-500',
  'Presentasi': 'bg-indigo-500',
  'Proposal': 'bg-purple-500',
  'Negosiasi': 'bg-orange-500',
  'Closing': 'bg-green-500',
  'Lost': 'bg-red-500',
};

export function PipelineFollowUps() {
  const navigate = useNavigate();
  const [followUps, setFollowUps] = useState<PipelineFollowUp[]>([]);
  const [pipelines, setPipelines] = useState<Pipeline[]>([]);
  const [productTypes, setProductTypes] = useState<ProductType[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [stageFilter, setStageFilter] = useState('all');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [followUpsData, pipelinesData, productTypesData] = await Promise.all([
        api.getPipelineFollowUps(),
        api.getPipelines(),
        api.getProductTypes()
      ]);

      // Sort by date descending (newest first)
      followUpsData.sort((a: PipelineFollowUp, b: PipelineFollowUp) =>
        new Date(b.tanggal).getTime() - new Date(a.tanggal).getTime()
      );

      setFollowUps(followUpsData);
      setPipelines(pipelinesData);
      setProductTypes(productTypesData);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Gagal memuat data');
    } finally {
      setLoading(false);
    }
  };

  const getPipelineInfo = (pipelineId: string) => {
    return pipelines.find(p => p.id === pipelineId);
  };

  const getProductTypesDisplay = (productTypeIds?: string[]) => {
    if (!productTypeIds || productTypeIds.length === 0) return '-';

    const names = productTypeIds
      .map(id => productTypes.find(pt => pt.id === id)?.name)
      .filter(Boolean);

    return names.join(', ') || '-';
  };

  // Filter data
  const filteredData = followUps.filter(followUp => {
    const pipeline = getPipelineInfo(followUp.pipelineId);

    // Filter by search term
    const matchesSearch = !searchTerm ||
      pipeline?.customer?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      followUp.aktivitas?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      followUp.hasil?.toLowerCase().includes(searchTerm.toLowerCase());

    // Filter by stage
    const matchesStage = stageFilter === 'all' || followUp.stage === stageFilter;

    return matchesSearch && matchesStage;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="text-lg font-medium">Memuat data...</div>
        </div>
      </div>
    );
  }

  const handleView = (followUp: PipelineFollowUp) => {
    navigate(`/sales/pipeline/detail/${followUp.pipelineId}`);
  };

  const columns = [
    {
      key: 'tanggal',
      label: 'Tanggal',
      render: (value: string) => (
        <div className="text-xs font-medium">
          {formatDate(value)}
        </div>
      )
    },
    {
      key: 'customer',
      label: 'Customer',
      render: (_: any, row: PipelineFollowUp) => {
        const pipeline = getPipelineInfo(row.pipelineId);
        return (
          <div>
            <div className="text-sm font-semibold">{pipeline?.customer || '-'}</div>
            <div className="text-xs text-muted-foreground">{pipeline?.picSales || '-'}</div>
          </div>
        );
      }
    },
    {
      key: 'aktivitas',
      label: 'Aktivitas Sales',
      render: (value: string) => <div className="text-sm">{value || '-'}</div>
    },
    {
      key: 'stage',
      label: 'Stage Pipeline',
      render: (value: string) => (
        <Badge className={`${STAGE_COLORS[value]} text-white text-xs`}>
          {value}
        </Badge>
      ),
    },
    {
      key: 'perkiraanJumlah',
      label: 'Perkiraan Jumlah',
      render: (value: string) => (
        <div className="text-sm">
          {value ? (
            <Badge variant="default" className="bg-blue-600 text-white text-xs">
              {value}
            </Badge>
          ) : '-'}
        </div>
      )
    },
    {
      key: 'segmen',
      label: 'Segmen',
      render: (value: string) => (
        <div className="text-sm">
          {value ? (
            <Badge variant="secondary" className="bg-gray-600 text-white text-xs">
              {value}
            </Badge>
          ) : '-'}
        </div>
      )
    },
    {
      key: 'estimasiHarga',
      label: 'Estimasi Harga',
      render: (value: string) => (
        <div className="text-sm text-green-700 font-semibold">
          {value ? `Rp ${parseInt(value).toLocaleString('id-ID')}` : '-'}
        </div>
      )
    },
    {
      key: 'hasil',
      label: 'Hasil',
      render: (value: string) => (
        <div className="text-sm max-w-xs truncate" title={value}>
          {value || '-'}
        </div>
      ),
    },
    {
      key: 'quotationNumbers',
      label: 'Penawaran',
      render: (value: string[] | undefined, row: PipelineFollowUp) => {
        if (!value || value.length === 0) return <div className="text-xs text-muted-foreground">-</div>;

        return (
          <div className="flex flex-wrap gap-1">
            {value.map((quotationNum, index) => (
              <Badge
                key={index}
                variant="default"
                className="bg-purple-600 text-white text-xs"
              >
                {quotationNum}
              </Badge>
            ))}
          </div>
        );
      },
    },
  ];

  return (
    <div className="space-y-4">
      <PageHeader
        title="Follow-Up Pipeline"
        breadcrumbs={[
          { label: 'Dashboard', href: '/' },
          { label: 'Sales' },
          { label: 'Follow-Up Pipeline' },
        ]}
      />

      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <div className="bg-gradient-to-br from-slate-500 to-slate-600 p-3 rounded-lg border border-slate-600 shadow-sm">
          <div className="text-xs text-white/80 mb-1">Total Follow-Up</div>
          <div className="text-xl font-bold text-white">{filteredData.length}</div>
        </div>
        <div className="bg-gradient-to-br from-gray-500 to-gray-600 p-3 rounded-lg border border-gray-600 shadow-sm">
          <div className="text-xs text-white/80 mb-1">Lead</div>
          <div className="text-xl font-bold text-white">
            {filteredData.filter(f => f.stage === 'Lead').length}
          </div>
        </div>
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-3 rounded-lg border border-blue-600 shadow-sm">
          <div className="text-xs text-white/80 mb-1">Qualifikasi</div>
          <div className="text-xl font-bold text-white">
            {filteredData.filter(f => f.stage === 'Qualifikasi').length}
          </div>
        </div>
        <div className="bg-gradient-to-br from-green-500 to-green-600 p-3 rounded-lg border border-green-600 shadow-sm">
          <div className="text-xs text-white/80 mb-1">Closing</div>
          <div className="text-xl font-bold text-white">
            {filteredData.filter(f => f.stage === 'Closing').length}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <Input
          placeholder="Cari customer, aktivitas, atau hasil..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-xs"
        />
        <Select value={stageFilter} onValueChange={setStageFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Semua Stage" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Stage</SelectItem>
            <SelectItem value="Lead">Lead</SelectItem>
            <SelectItem value="Qualifikasi">Qualifikasi</SelectItem>
            <SelectItem value="Presentasi">Presentasi</SelectItem>
            <SelectItem value="Proposal">Proposal</SelectItem>
            <SelectItem value="Negosiasi">Negosiasi</SelectItem>
            <SelectItem value="Closing">Closing</SelectItem>
            <SelectItem value="Lost">Lost</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <DataTable
        columns={columns}
        data={filteredData}
        loading={loading}
        onView={handleView}
        emptyState={
          <div className="text-center text-sm text-muted-foreground py-12">
            <Clock className="w-12 h-12 mx-auto mb-3 text-muted-foreground/50" />
            <p>Belum ada follow-up pipeline</p>
            {(searchTerm || stageFilter !== 'all') && (
              <p className="mt-2 text-xs">Coba ubah filter pencarian</p>
            )}
          </div>
        }
      />
    </div>
  );
}
