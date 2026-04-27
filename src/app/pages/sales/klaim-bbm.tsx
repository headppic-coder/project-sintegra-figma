import { useState, useEffect } from 'react';
import { Input } from '../../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { toast } from 'sonner';
import { api } from '../../lib/api';
import { formatDate } from '../../components/ui/utils';

interface Pipeline {
  id: string;
  tanggal: string;
  customer: string;
  picSales: string;
  aktivitasSales: string;
  alamat: string;
  hasil: string;
  catatan: string;
  createdAt: string;
}

interface PipelineFollowUp {
  id: string;
  pipelineId: string;
  tanggal: string;
  aktivitas: string;
  alamat: string;
  hasil: string;
  catatan: string;
  createdAt: string;
}

interface KlaimItem {
  tanggal: string;
  sales: string;
  jenis: string;
  pipelineId: string;
  customer: string;
  alamat: string;
  hasil: string;
  catatan: string;
}

export default function KlaimBBM() {
  const currentDate = new Date();
  const [selectedMonth, setSelectedMonth] = useState<string>(
    `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`
  );
  const [selectedSales, setSelectedSales] = useState<string>('all');
  const [pipelines, setPipelines] = useState<Pipeline[]>([]);
  const [followUps, setFollowUps] = useState<PipelineFollowUp[]>([]);
  const [loading, setLoading] = useState(true);
  const [klaimData, setKlaimData] = useState<KlaimItem[]>([]);
  const [salesPeople, setSalesPeople] = useState<string[]>([]);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (pipelines.length > 0 || followUps.length > 0) {
      processData();
    }
  }, [pipelines, followUps, selectedMonth, selectedSales]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [pipelinesResult, followUpsResult] = await Promise.all([
        api.getPipelines(),
        api.getPipelineFollowUps(),
      ]);
      setPipelines(pipelinesResult || []);
      setFollowUps(followUpsResult || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Gagal memuat data');
    } finally {
      setLoading(false);
    }
  };

  const processData = () => {
    const [year, month] = selectedMonth.split('-');
    const klaimActivities = ['Canvas', 'Canvass', 'Visit'];

    // Combine pipelines and follow-ups
    const allItems: KlaimItem[] = [];
    const salesSet = new Set<string>();

    // Process pipelines
    pipelines.forEach((pipeline) => {
      const date = new Date(pipeline.tanggal);
      if (
        date.getFullYear() === parseInt(year) &&
        date.getMonth() + 1 === parseInt(month) &&
        klaimActivities.some(activity =>
          pipeline.aktivitasSales?.toLowerCase().includes(activity.toLowerCase())
        )
      ) {
        const sales = pipeline.picSales || 'Tidak Ada PIC';
        salesSet.add(sales);

        if (selectedSales === 'all' || sales === selectedSales) {
          allItems.push({
            tanggal: pipeline.tanggal,
            sales: sales,
            jenis: pipeline.aktivitasSales,
            pipelineId: pipeline.id,
            customer: pipeline.customer,
            alamat: pipeline.alamat,
            hasil: pipeline.hasil,
            catatan: pipeline.catatan,
          });
        }
      }
    });

    // Process follow-ups
    followUps.forEach((followUp) => {
      const date = new Date(followUp.tanggal);
      if (
        date.getFullYear() === parseInt(year) &&
        date.getMonth() + 1 === parseInt(month) &&
        klaimActivities.some(activity =>
          followUp.aktivitas?.toLowerCase().includes(activity.toLowerCase())
        )
      ) {
        const parentPipeline = pipelines.find((p) => p.id === followUp.pipelineId);
        if (parentPipeline) {
          const sales = parentPipeline.picSales || 'Tidak Ada PIC';
          salesSet.add(sales);

          if (selectedSales === 'all' || sales === selectedSales) {
            allItems.push({
              tanggal: followUp.tanggal,
              sales: sales,
              jenis: followUp.aktivitas,
              pipelineId: followUp.pipelineId,
              customer: parentPipeline.customer,
              alamat: followUp.alamat,
              hasil: followUp.hasil,
              catatan: followUp.catatan,
            });
          }
        }
      }
    });

    // Sort by date
    allItems.sort((a, b) => new Date(a.tanggal).getTime() - new Date(b.tanggal).getTime());

    setSalesPeople(Array.from(salesSet).sort());
    setKlaimData(allItems);
  };

  const getJenisCount = (jenis: string) => {
    return klaimData.filter(item =>
      item.jenis?.toLowerCase().includes(jenis.toLowerCase())
    ).length;
  };

  const handleDownloadPDF = () => {
    toast.info('Fitur download PDF sedang dalam pengembangan');
  };

  const getMonthYearLabel = () => {
    const [year, month] = selectedMonth.split('-');
    const monthNames = [
      'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
      'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
    ];
    return `${monthNames[parseInt(month) - 1]} ${year}`;
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex gap-4 items-end">
        <div className="flex-1 grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Bulan</label>
            <Input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="h-9"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Sales</label>
            <Select value={selectedSales} onValueChange={setSelectedSales}>
              <SelectTrigger className="h-9">
                <SelectValue placeholder="Pilih sales" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua</SelectItem>
                {salesPeople.filter(s => s && typeof s === 'string' && s.trim() !== '').map((sales) => (
                  <SelectItem key={sales} value={sales}>
                    {sales}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <Button variant="outline" onClick={handleDownloadPDF} className="h-9">
          Download PDF
        </Button>
      </div>

      {/* Heading */}
      <div>
        <h3 className="font-semibold text-lg">Klaim BBM — Aktivitas Visit/Canvas</h3>
        <p className="text-sm text-muted-foreground">Periode: {getMonthYearLabel()}</p>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        {loading ? (
          <div className="text-center py-6 text-sm text-muted-foreground">Memuat data...</div>
        ) : klaimData.length === 0 ? (
          <div className="text-center py-6 text-sm text-muted-foreground">
            Tidak ada data klaim BBM untuk periode yang dipilih
          </div>
        ) : (
          <>
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr>
                  <th className="border border-gray-300 bg-gray-100 px-3 py-2 text-center font-medium w-12">
                    #
                  </th>
                  <th className="border border-gray-300 bg-gray-100 px-3 py-2 text-left font-medium">
                    TANGGAL
                  </th>
                  <th className="border border-gray-300 bg-gray-100 px-3 py-2 text-left font-medium">
                    SALES
                  </th>
                  <th className="border border-gray-300 bg-gray-100 px-3 py-2 text-center font-medium">
                    JENIS
                  </th>
                  <th className="border border-gray-300 bg-gray-100 px-3 py-2 text-center font-medium">
                    PIPELINE
                  </th>
                  <th className="border border-gray-300 bg-gray-100 px-3 py-2 text-left font-medium">
                    CUSTOMER
                  </th>
                  <th className="border border-gray-300 bg-gray-100 px-3 py-2 text-left font-medium">
                    ALAMAT
                  </th>
                  <th className="border border-gray-300 bg-gray-100 px-3 py-2 text-left font-medium">
                    HASIL
                  </th>
                  <th className="border border-gray-300 bg-gray-100 px-3 py-2 text-left font-medium">
                    CATATAN TAMBAHAN
                  </th>
                </tr>
              </thead>
              <tbody>
                {klaimData.map((item, index) => (
                  <tr key={index}>
                    <td className="border border-gray-300 px-3 py-2 text-center">
                      {index + 1}
                    </td>
                    <td className="border border-gray-300 px-3 py-2">
                      {formatDate(item.tanggal)}
                    </td>
                    <td className="border border-gray-300 px-3 py-2 text-teal-700 font-medium">
                      {item.sales}
                    </td>
                    <td className="border border-gray-300 px-3 py-2 text-center">
                      <Badge
                        variant="outline"
                        className={`${
                          item.jenis?.toLowerCase().includes('canvas')
                            ? 'bg-yellow-500 text-white border-yellow-600'
                            : 'bg-blue-500 text-white border-blue-600'
                        } text-xs`}
                      >
                        {item.jenis}
                      </Badge>
                    </td>
                    <td className="border border-gray-300 px-3 py-2 text-center text-blue-600 font-medium">
                      #{item.pipelineId.split(':')[1]?.substring(0, 4)}
                    </td>
                    <td className="border border-gray-300 px-3 py-2">
                      {item.customer}
                    </td>
                    <td className="border border-gray-300 px-3 py-2">
                      {item.alamat || '-'}
                    </td>
                    <td className="border border-gray-300 px-3 py-2">
                      {item.hasil || '-'}
                    </td>
                    <td className="border border-gray-300 px-3 py-2">
                      {item.catatan || '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Footer Summary */}
            <div className="mt-4 flex items-center justify-between">
              <p className="text-xs text-muted-foreground">
                * Data hanya dari aktivitas canvas, visit
              </p>
              <div className="flex gap-4 items-center">
                <span className="text-sm font-medium">Total:</span>
                <Badge variant="outline" className="bg-yellow-100 text-yellow-700 border-yellow-300">
                  Canvas: {getJenisCount('canvas')}
                </Badge>
                <Badge variant="outline" className="bg-blue-100 text-blue-700 border-blue-300">
                  Visit: {getJenisCount('visit')}
                </Badge>
                <Badge variant="outline" className="bg-gray-100 text-gray-700 border-gray-300 font-bold">
                  Grand: {klaimData.length}
                </Badge>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
