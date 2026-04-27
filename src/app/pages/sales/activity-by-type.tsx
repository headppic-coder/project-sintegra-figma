import { useState, useEffect } from 'react';
import { Input } from '../../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { toast } from 'sonner';
import { api } from '../../lib/api';

interface Pipeline {
  id: string;
  tanggal: string;
  picSales: string;
  aktivitasSales: string;
  createdAt: string;
}

interface PipelineFollowUp {
  id: string;
  pipelineId: string;
  tanggal: string;
  aktivitas: string;
  createdAt: string;
}

interface ActivityItem {
  tanggal: string;
  picSales: string;
  aktivitas: string;
}

interface PivotData {
  [salesPerson: string]: {
    [activity: string]: number;
  };
}

export default function ActivityByType() {
  const currentDate = new Date();
  const [selectedMonth, setSelectedMonth] = useState<string>(
    `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`
  );
  const [selectedSales, setSelectedSales] = useState<string>('all');
  const [pipelines, setPipelines] = useState<Pipeline[]>([]);
  const [followUps, setFollowUps] = useState<PipelineFollowUp[]>([]);
  const [loading, setLoading] = useState(true);
  const [pivotData, setPivotData] = useState<PivotData>({});
  const [salesPeople, setSalesPeople] = useState<string[]>([]);
  const [activities, setActivities] = useState<string[]>([]);

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

    // Combine pipelines and follow-ups into ActivityItems
    const allActivities: ActivityItem[] = [];

    // Add activities from pipelines
    pipelines.forEach((pipeline) => {
      const date = new Date(pipeline.tanggal);
      if (
        date.getFullYear() === parseInt(year) &&
        date.getMonth() + 1 === parseInt(month)
      ) {
        allActivities.push({
          tanggal: pipeline.tanggal,
          picSales: pipeline.picSales,
          aktivitas: pipeline.aktivitasSales,
        });
      }
    });

    // Add activities from follow-ups
    followUps.forEach((followUp) => {
      const date = new Date(followUp.tanggal);
      if (
        date.getFullYear() === parseInt(year) &&
        date.getMonth() + 1 === parseInt(month)
      ) {
        // Find the parent pipeline to get picSales
        const parentPipeline = pipelines.find((p) => p.id === followUp.pipelineId);
        if (parentPipeline) {
          allActivities.push({
            tanggal: followUp.tanggal,
            picSales: parentPipeline.picSales,
            aktivitas: followUp.aktivitas,
          });
        }
      }
    });

    // Build pivot data
    const pivot: PivotData = {};
    const salesSet = new Set<string>();
    const activitySet = new Set<string>();

    allActivities.forEach((item) => {
      const sales = item.picSales || 'Tidak Ada PIC';
      const activity = item.aktivitas || 'Tidak Ada Aktivitas';

      salesSet.add(sales);
      activitySet.add(activity);

      if (!pivot[sales]) {
        pivot[sales] = {};
      }

      if (!pivot[sales][activity]) {
        pivot[sales][activity] = 0;
      }

      pivot[sales][activity]++;
    });

    // Sort sales people and activities alphabetically
    const sortedSales = Array.from(salesSet).sort();
    const sortedActivities = Array.from(activitySet).sort();

    setSalesPeople(sortedSales);
    setActivities(sortedActivities);
    setPivotData(pivot);
  };

  // Calculate totals
  const getRowTotal = (salesPerson: string) => {
    let total = 0;
    activities.forEach((activity) => {
      total += pivotData[salesPerson]?.[activity] || 0;
    });
    return total;
  };

  const getColumnTotal = (activity: string) => {
    let total = 0;
    salesPeople.forEach((salesPerson) => {
      total += pivotData[salesPerson]?.[activity] || 0;
    });
    return total;
  };

  const getGrandTotal = () => {
    let total = 0;
    salesPeople.forEach((salesPerson) => {
      total += getRowTotal(salesPerson);
    });
    return total;
  };

  const getPercentage = (activity: string) => {
    const total = getGrandTotal();
    if (total === 0) return '0%';
    const columnTotal = getColumnTotal(activity);
    return ((columnTotal / total) * 100).toFixed(1) + '%';
  };

  // Filter sales people based on selected sales filter
  const filteredSalesPeople = selectedSales === 'all'
    ? salesPeople
    : salesPeople.filter((sales) => sales === selectedSales);

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="grid grid-cols-2 gap-4">
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

      {/* Heading */}
      <h3 className="text-center font-semibold text-lg">Laporan Aktivitas per Jenis</h3>

      {/* Pivot Table */}
      <div className="overflow-x-auto">
        {loading ? (
          <div className="text-center py-6 text-sm text-muted-foreground">Memuat data...</div>
        ) : filteredSalesPeople.length === 0 ? (
          <div className="text-center py-6 text-sm text-muted-foreground">
            Tidak ada data untuk bulan yang dipilih
          </div>
        ) : (
          <>
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr>
                  <th className="border border-gray-300 bg-gray-100 px-3 py-2 text-left font-medium uppercase">
                    Sales
                  </th>
                  {activities.map((activity) => (
                    <th
                      key={activity}
                      className="border border-gray-300 bg-gray-100 px-3 py-2 text-center font-medium uppercase"
                    >
                      {activity}
                    </th>
                  ))}
                  <th className="border border-gray-300 bg-gray-100 px-3 py-2 text-center font-medium uppercase">
                    Total
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredSalesPeople.map((salesPerson) => (
                  <tr key={salesPerson}>
                    <td className="border border-gray-300 bg-gray-50 px-3 py-2 font-medium">
                      {salesPerson}
                    </td>
                    {activities.map((activity) => (
                      <td
                        key={activity}
                        className="border border-gray-300 px-3 py-2 text-center"
                      >
                        {pivotData[salesPerson]?.[activity] || 0}
                      </td>
                    ))}
                    <td className="border border-gray-300 px-3 py-2 text-center font-medium">
                      {getRowTotal(salesPerson)}
                    </td>
                  </tr>
                ))}

                {/* Total per Jenis Row */}
                {selectedSales === 'all' && (
                  <>
                    <tr>
                      <td className="border border-gray-300 bg-gray-100 px-3 py-2 font-medium text-right">
                        Total per Jenis
                      </td>
                      {activities.map((activity) => (
                        <td
                          key={activity}
                          className="border border-gray-300 bg-gray-50 px-3 py-2 text-center font-medium"
                        >
                          {getColumnTotal(activity)}
                        </td>
                      ))}
                      <td className="border border-gray-300 bg-gray-50 px-3 py-2 text-center font-bold">
                        {getGrandTotal()}
                      </td>
                    </tr>

                    {/* Persentase Row */}
                    <tr>
                      <td className="border border-gray-300 bg-gray-100 px-3 py-2 font-medium text-right">
                        Persentase
                      </td>
                      {activities.map((activity) => (
                        <td
                          key={activity}
                          className="border border-gray-300 bg-gray-50 px-3 py-2 text-center font-medium"
                        >
                          {getPercentage(activity)}
                        </td>
                      ))}
                      <td className="border border-gray-300 bg-gray-50 px-3 py-2 text-center font-medium">
                        100%
                      </td>
                    </tr>
                  </>
                )}
              </tbody>
            </table>

            {/* Footnote */}
            {selectedSales === 'all' && (
              <p className="text-xs text-muted-foreground mt-2">
                * Persentase = total jenis ÷ total seluruh aktivitas pada bulan terpilih.
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
}
