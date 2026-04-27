import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { ChevronDown, ChevronUp, Eye, X } from 'lucide-react';
import { Input } from '../../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Badge } from '../../components/ui/badge';
import { Card } from '../../components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../components/ui/dialog';
import { api } from '../../lib/api';
import { formatDate } from '../../components/ui/utils';
import { toast } from 'sonner';

interface Pipeline {
  id: string;
  tanggal: string;
  customer: string;
  customerId?: string;
  orderType: string;
  stage: string;
  aktivitasSales: string;
  alamat: string;
  city?: string;
  nomorTelepon?: string;
  segmen: string;
  perkiraanJumlah: number;
  picSales: string;
  sumberLead: string;
  hasil: string;
  catatan: string;
  createdAt: string;
}

interface PipelineFollowUp {
  id: string;
  pipelineId: string;
  tanggal: string;
  aktivitas: string;
  hasil: string;
  createdAt: string;
}

interface CustomerGroup {
  customerName: string;
  pipelines: Pipeline[];
  totalPipelines: number;
  totalFollowUps: number;
  latestStage: string;
  latestPicSales: string;
  alamat: string;
  nomorTelepon: string;
  segmen: string;
  sumberLead: string;
  isCustomer: boolean; // true = Customer, false = Calon Customer
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

export default function CustomerPipeline() {
  const navigate = useNavigate();
  const [pipelines, setPipelines] = useState<Pipeline[]>([]);
  const [followUps, setFollowUps] = useState<PipelineFollowUp[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [prospectiveCustomers, setProspectiveCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [salesFilter, setSalesFilter] = useState<string>('all');
  const [segmenFilter, setSegmenFilter] = useState<string>('all');
  const [salesPeople, setSalesPeople] = useState<string[]>([]);
  const [segments, setSegments] = useState<string[]>([]);
  const [expandedCustomers, setExpandedCustomers] = useState<Set<string>>(new Set());
  const [followUpModalOpen, setFollowUpModalOpen] = useState(false);
  const [selectedPipeline, setSelectedPipeline] = useState<Pipeline | null>(null);

  useEffect(() => {
    fetchPipelines();
    fetchFollowUps();
    fetchCustomers();
    fetchProspectiveCustomers();
  }, []);

  useEffect(() => {
    if (pipelines.length > 0) {
      const uniqueSales = Array.from(new Set(pipelines.map(p => p.picSales).filter(Boolean)));
      setSalesPeople(uniqueSales.sort());

      const uniqueSegments = Array.from(new Set(pipelines.map(p => p.segmen).filter(Boolean)));
      setSegments(uniqueSegments.sort());
    }
  }, [pipelines]);

  const fetchPipelines = async () => {
    try {
      setLoading(true);
      const result = await api.getPipelines();
      setPipelines(result || []);
    } catch (error) {
      console.error('Error fetching pipelines:', error);
      toast.error('Gagal memuat data pipeline');
    } finally {
      setLoading(false);
    }
  };

  const fetchFollowUps = async () => {
    try {
      const result = await api.getPipelineFollowUps();
      setFollowUps(result || []);
    } catch (error) {
      console.error('Error fetching followups:', error);
    }
  };

  const fetchCustomers = async () => {
    try {
      const result = await api.getCustomers();
      setCustomers(result || []);
    } catch (error) {
      console.error('Error fetching customers:', error);
    }
  };

  const fetchProspectiveCustomers = async () => {
    try {
      const result = await api.getProspectiveCustomers();
      setProspectiveCustomers(result || []);
    } catch (error) {
      console.error('Error fetching prospective customers:', error);
    }
  };

  const getFollowUpCount = (pipelineId: string) => {
    return followUps.filter(f => f.pipelineId === pipelineId).length;
  };

  const getLastFollowUpDate = (pipelineId: string) => {
    const pipelineFollowUps = followUps.filter(f => f.pipelineId === pipelineId);
    if (pipelineFollowUps.length === 0) return null;

    const sorted = pipelineFollowUps.sort((a, b) => {
      const dateCompare = new Date(b.tanggal).getTime() - new Date(a.tanggal).getTime();
      if (dateCompare !== 0) return dateCompare;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
    return sorted[0].tanggal;
  };

  const getLastFollowUpResult = (pipelineId: string) => {
    const pipelineFollowUps = followUps.filter(f => f.pipelineId === pipelineId);
    if (pipelineFollowUps.length === 0) return null;

    const sorted = pipelineFollowUps.sort((a, b) => {
      const dateCompare = new Date(b.tanggal).getTime() - new Date(a.tanggal).getTime();
      if (dateCompare !== 0) return dateCompare;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
    return sorted[0].hasil;
  };

  const toggleCustomer = (customerName: string) => {
    const newExpanded = new Set(expandedCustomers);
    if (newExpanded.has(customerName)) {
      newExpanded.delete(customerName);
    } else {
      newExpanded.add(customerName);
    }
    setExpandedCustomers(newExpanded);
  };

  const handleViewDetail = (pipelineId: string) => {
    navigate(`/sales/pipeline/detail/${pipelineId}`);
  };

  const handleViewFollowUps = (pipeline: Pipeline) => {
    setSelectedPipeline(pipeline);
    setFollowUpModalOpen(true);
  };

  const getPipelineFollowUps = (pipelineId: string) => {
    return followUps
      .filter(f => f.pipelineId === pipelineId)
      .sort((a, b) => {
        const dateCompare = new Date(b.tanggal).getTime() - new Date(a.tanggal).getTime();
        if (dateCompare !== 0) return dateCompare;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
  };

  const checkIsCustomer = (customerId?: string): boolean => {
    if (!customerId) return false;
    // Check if customerId exists in Customer table (not in Prospective Customer)
    return customers.some(c => c.id === customerId);
  };

  // Group pipelines by customer
  const customerGroups: CustomerGroup[] = Object.values(
    pipelines.reduce((acc, pipeline) => {
      const key = pipeline.customer?.toLowerCase() || 'unknown';
      if (!acc[key]) {
        acc[key] = {
          customerName: pipeline.customer || 'Unknown',
          pipelines: [],
          totalPipelines: 0,
          totalFollowUps: 0,
          latestStage: '',
          latestPicSales: '',
          alamat: pipeline.alamat || '',
          nomorTelepon: pipeline.nomorTelepon || '',
          segmen: pipeline.segmen || '',
          sumberLead: pipeline.sumberLead || '',
          isCustomer: checkIsCustomer(pipeline.customerId),
        };
      }
      acc[key].pipelines.push(pipeline);
      return acc;
    }, {} as Record<string, CustomerGroup>)
  ).map(group => {
    // Sort pipelines by date (newest first)
    const sortedPipelines = group.pipelines.sort((a, b) =>
      new Date(b.tanggal).getTime() - new Date(a.tanggal).getTime()
    );

    const totalFollowUps = group.pipelines.reduce((sum, p) => sum + getFollowUpCount(p.id), 0);
    const latestPipeline = sortedPipelines[0];

    return {
      ...group,
      pipelines: sortedPipelines,
      totalPipelines: group.pipelines.length,
      totalFollowUps,
      latestStage: latestPipeline?.stage || '',
      latestPicSales: latestPipeline?.picSales || '',
    };
  }).sort((a, b) => {
    // Sort by customer name alphabetically (A-Z)
    return a.customerName.localeCompare(b.customerName, 'id', { sensitivity: 'base' });
  });

  // Filter customers
  const filteredCustomers = customerGroups.filter((group) => {
    const matchesSearch =
      group.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      group.alamat.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesSales = salesFilter === 'all' || group.latestPicSales === salesFilter;
    const matchesSegmen = segmenFilter === 'all' || group.segmen === segmenFilter;

    return matchesSearch && matchesSales && matchesSegmen;
  });

  return (
    <div className="space-y-2">
      <div className="mb-2">
        <h2 className="text-lg font-semibold">Customer Pipeline</h2>
        <p className="text-xs text-muted-foreground">Histori perjalanan pipeline per customer</p>
      </div>

      {/* Filters */}
      <Card className="p-2">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
          <div>
            <Input
              placeholder="Cari customer atau alamat..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-8 text-xs"
            />
          </div>

          <div>
            <Select value={salesFilter} onValueChange={setSalesFilter}>
              <SelectTrigger className="h-8 text-xs">
                <SelectValue placeholder="Pilih PIC Sales" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Sales</SelectItem>
                {salesPeople.filter(s => s && typeof s === 'string' && s.trim() !== '').map((sales) => (
                  <SelectItem key={sales} value={sales}>
                    {sales}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Select value={segmenFilter} onValueChange={setSegmenFilter}>
              <SelectTrigger className="h-8 text-xs">
                <SelectValue placeholder="Pilih Segmen" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Segmen</SelectItem>
                {segments.filter(s => s && typeof s === 'string' && s.trim() !== '').map((segment) => (
                  <SelectItem key={segment} value={segment}>
                    {segment}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center">
            <div className="text-xs text-muted-foreground">
              Total: <span className="font-semibold text-foreground">{filteredCustomers.length}</span> customer
            </div>
          </div>
        </div>
      </Card>

      {/* Customer List */}
      {loading ? (
        <Card className="p-4 text-center text-muted-foreground text-xs">
          Memuat data...
        </Card>
      ) : filteredCustomers.length === 0 ? (
        <Card className="p-4 text-center text-muted-foreground text-xs">
          Tidak ada data customer
        </Card>
      ) : (
        <div className="space-y-1">
          {filteredCustomers.map((group) => {
            const isExpanded = expandedCustomers.has(group.customerName);

            return (
              <Card key={group.customerName} className="overflow-hidden">
                {/* Customer Header - Clickable */}
                <div
                  className="p-2 cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => toggleCustomer(group.customerName)}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <div className="flex-shrink-0">
                        {isExpanded ? (
                          <ChevronUp className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <ChevronDown className="h-4 w-4 text-muted-foreground" />
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <div className="font-semibold text-xs">{group.customerName}</div>
                          <Badge
                            variant="outline"
                            className={`${
                              group.isCustomer
                                ? 'bg-green-100 text-green-700 border-green-300'
                                : 'bg-blue-100 text-blue-700 border-blue-300'
                            } text-[10px] px-1.5 py-0`}
                          >
                            {group.isCustomer ? 'Customer' : 'Calon Customer'}
                          </Badge>
                        </div>
                        <div className="text-[10px] text-muted-foreground truncate">{group.alamat}</div>
                      </div>

                      <div className="flex items-center gap-3 flex-shrink-0">
                        <div className="text-center">
                          <div className="text-[10px] text-muted-foreground">Pipeline</div>
                          <div className="text-xs font-semibold">{group.totalPipelines}</div>
                        </div>

                        <div className="text-center">
                          <div className="text-[10px] text-muted-foreground">F/U</div>
                          <div className="text-xs font-semibold">{group.totalFollowUps}</div>
                        </div>

                        <div>
                          <Badge className={`${STAGE_COLORS[group.latestStage]} text-white text-[10px] px-2 py-0`}>
                            {group.latestStage}
                          </Badge>
                        </div>

                        <div className="text-[10px] text-muted-foreground min-w-[100px]">
                          PIC: {group.latestPicSales || '-'}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Pipeline Breakdown - Expandable */}
                {isExpanded && (
                  <div className="border-t bg-muted/20">
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse">
                        <thead className="bg-muted/50">
                          <tr className="border-b">
                            <th className="text-center p-1 text-[10px] font-medium text-muted-foreground border w-12">Aksi</th>
                            <th className="text-left p-1 text-[10px] font-medium text-muted-foreground border">Stage</th>
                            <th className="text-left p-1 text-[10px] font-medium text-muted-foreground border">Tipe Aktivitas</th>
                            <th className="text-center p-1 text-[10px] font-medium text-muted-foreground border">Jml F/U</th>
                            <th className="text-left p-1 text-[10px] font-medium text-muted-foreground border">Terakhir F/U</th>
                            <th className="text-left p-1 text-[10px] font-medium text-muted-foreground border">PIC Sales</th>
                            <th className="text-left p-1 text-[10px] font-medium text-muted-foreground border">Hasil</th>
                          </tr>
                        </thead>
                        <tbody>
                          {group.pipelines.map((pipeline) => {
                            const lastFollowUpDate = getLastFollowUpDate(pipeline.id);
                            const lastResult = getLastFollowUpResult(pipeline.id);
                            const displayResult = lastResult || pipeline.hasil;

                            return (
                              <tr key={pipeline.id} className="hover:bg-muted/30">
                                <td className="p-1 border text-center">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleViewDetail(pipeline.id);
                                    }}
                                    className={`inline-flex items-center justify-center w-6 h-6 rounded transition-colors ${STAGE_COLORS[pipeline.stage]}`}
                                    title="Lihat Detail"
                                  >
                                    <Eye className="h-3 w-3 text-white" />
                                  </button>
                                </td>
                                <td className="p-1 border">
                                  <Badge variant="outline" className={`${STAGE_COLORS[pipeline.stage]} text-white text-[10px] px-1.5 py-0`}>
                                    {pipeline.stage}
                                  </Badge>
                                </td>
                                <td className="p-1 text-[10px] border">{pipeline.aktivitasSales || '-'}</td>
                                <td className="p-1 text-[10px] text-center font-medium border">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleViewFollowUps(pipeline);
                                    }}
                                    className={`inline-flex items-center justify-center px-2 py-0.5 rounded transition-colors ${
                                      getFollowUpCount(pipeline.id) > 0
                                        ? 'bg-blue-100 text-blue-700 hover:bg-blue-200 cursor-pointer'
                                        : 'text-muted-foreground cursor-default'
                                    }`}
                                    disabled={getFollowUpCount(pipeline.id) === 0}
                                    title={getFollowUpCount(pipeline.id) > 0 ? 'Lihat daftar follow-up' : 'Tidak ada follow-up'}
                                  >
                                    {getFollowUpCount(pipeline.id)}
                                  </button>
                                </td>
                                <td className="p-1 text-[10px] whitespace-nowrap border">
                                  {lastFollowUpDate ? formatDate(lastFollowUpDate) : <span className="text-muted-foreground">-</span>}
                                </td>
                                <td className="p-1 text-[10px] border">{pipeline.picSales || '-'}</td>
                                <td className="p-1 text-[10px] max-w-xs truncate border" title={displayResult || '-'}>
                                  {displayResult || '-'}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}

      {/* Follow-Up Modal */}
      <Dialog open={followUpModalOpen} onOpenChange={setFollowUpModalOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <div className="flex-1">
                <div className="text-base font-semibold">Daftar Follow-Up</div>
                {selectedPipeline && (
                  <div className="flex flex-wrap items-center gap-2 mt-2">
                    <span className="text-sm font-normal text-muted-foreground">
                      Customer: <span className="font-medium text-foreground">{selectedPipeline.customer}</span>
                    </span>
                    <span className="text-muted-foreground">•</span>
                    <Badge variant="outline" className={`${STAGE_COLORS[selectedPipeline.stage]} text-white text-xs`}>
                      {selectedPipeline.stage}
                    </Badge>
                    <span className="text-muted-foreground">•</span>
                    <span className="text-sm text-muted-foreground">
                      PIC: <span className="font-medium text-foreground">{selectedPipeline.picSales || '-'}</span>
                    </span>
                  </div>
                )}
              </div>
              <button
                onClick={() => setFollowUpModalOpen(false)}
                className="rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 ml-4"
              >
                <X className="h-4 w-4" />
              </button>
            </DialogTitle>
          </DialogHeader>

          <div className="mt-4">
            {selectedPipeline && getPipelineFollowUps(selectedPipeline.id).length > 0 ? (
              <div className="space-y-3">
                {getPipelineFollowUps(selectedPipeline.id).map((followUp, index) => (
                  <Card key={followUp.id} className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0">
                        <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-semibold text-sm">
                          {index + 1}
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-3 flex-wrap">
                          <Badge variant="outline" className="text-xs">
                            {formatDate(followUp.tanggal)}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {new Date(followUp.createdAt).toLocaleTimeString('id-ID', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                          {selectedPipeline && (
                            <>
                              <span className="text-muted-foreground">•</span>
                              <Badge variant="outline" className={`${STAGE_COLORS[selectedPipeline.stage]} text-white text-[10px]`}>
                                {selectedPipeline.stage}
                              </Badge>
                              <span className="text-muted-foreground">•</span>
                              <span className="text-xs text-muted-foreground">
                                PIC: <span className="font-medium">{selectedPipeline.picSales || '-'}</span>
                              </span>
                            </>
                          )}
                        </div>
                        <div className="mb-2">
                          <div className="text-xs text-muted-foreground mb-1">Aktivitas:</div>
                          <div className="text-sm font-medium">{followUp.aktivitas}</div>
                        </div>
                        <div>
                          <div className="text-xs text-muted-foreground mb-1">Hasil:</div>
                          <div className="text-sm bg-muted/50 p-2 rounded">
                            {followUp.hasil || '-'}
                          </div>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <div className="text-sm">Tidak ada follow-up untuk pipeline ini</div>
              </div>
            )}
          </div>

          <div className="mt-4 flex justify-end">
            <button
              onClick={() => setFollowUpModalOpen(false)}
              className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
            >
              Tutup
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
