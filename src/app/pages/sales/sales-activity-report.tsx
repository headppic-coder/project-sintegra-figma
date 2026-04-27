import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { Input } from '../../components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../components/ui/dialog';
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
  hasil: string;
  catatan: string;
  alamat: string;
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
  createdAt: string;
}

interface ActivityItem {
  id: string;
  pipelineId: string;
  tanggal: string;
  customer: string;
  picSales: string;
  aktivitas: string;
  hasil: string;
  catatan: string;
  alamat: string;
  source: 'pipeline' | 'followup';
}

interface ActivitySummary {
  [activityType: string]: number;
}

interface DailyActivityData {
  [salesPerson: string]: {
    total: number;
    activities: ActivitySummary;
    items: ActivityItem[];
  };
}

interface MonthlyData {
  [date: string]: DailyActivityData;
}

const ACTIVITY_COLORS: { [key: string]: string } = {
  'Chat WA': 'bg-green-500 text-white border-green-600',
  'Visit': 'bg-blue-500 text-white border-blue-600',
  'Call': 'bg-orange-500 text-white border-orange-600',
  'Joint Visit': 'bg-purple-500 text-white border-purple-600',
  'Canvass': 'bg-yellow-500 text-white border-yellow-600',
  'WA In': 'bg-teal-500 text-white border-teal-600',
  'Email': 'bg-pink-500 text-white border-pink-600',
  'Meeting': 'bg-indigo-500 text-white border-indigo-600',
  'Presentation': 'bg-cyan-500 text-white border-cyan-600',
  'Follow Up': 'bg-amber-500 text-white border-amber-600',
  'Survey': 'bg-lime-500 text-white border-lime-600',
  'Demo': 'bg-violet-500 text-white border-violet-600',
};

export default function SalesActivityReport() {
  const navigate = useNavigate();
  const currentDate = new Date();
  const [selectedMonth, setSelectedMonth] = useState<string>(
    `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`
  );
  const [pipelines, setPipelines] = useState<Pipeline[]>([]);
  const [followUps, setFollowUps] = useState<PipelineFollowUp[]>([]);
  const [loading, setLoading] = useState(true);
  const [monthlyData, setMonthlyData] = useState<MonthlyData>({});
  const [salesPeople, setSalesPeople] = useState<string[]>([]);
  const [dates, setDates] = useState<string[]>([]);

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedSales, setSelectedSales] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedActivityType, setSelectedActivityType] = useState<string>('');
  const [selectedItems, setSelectedItems] = useState<ActivityItem[]>([]);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (pipelines.length > 0 || followUps.length > 0) {
      processData();
    }
  }, [pipelines, followUps, selectedMonth]);

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
          id: pipeline.id,
          pipelineId: pipeline.id,
          tanggal: pipeline.tanggal,
          customer: pipeline.customer,
          picSales: pipeline.picSales,
          aktivitas: pipeline.aktivitasSales,
          hasil: pipeline.hasil,
          catatan: pipeline.catatan,
          alamat: pipeline.alamat,
          source: 'pipeline',
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
        // Find the parent pipeline to get customer and picSales
        const parentPipeline = pipelines.find((p) => p.id === followUp.pipelineId);
        if (parentPipeline) {
          allActivities.push({
            id: followUp.id,
            pipelineId: followUp.pipelineId,
            tanggal: followUp.tanggal,
            customer: parentPipeline.customer,
            picSales: parentPipeline.picSales,
            aktivitas: followUp.aktivitas,
            hasil: followUp.hasil,
            catatan: followUp.catatan,
            alamat: followUp.alamat,
            source: 'followup',
          });
        }
      }
    });

    // Build data structure
    const data: MonthlyData = {};
    const salesSet = new Set<string>();
    const dateSet = new Set<string>();

    allActivities.forEach((item) => {
      const date = item.tanggal;
      const sales = item.picSales || 'Tidak Ada PIC';
      const activity = item.aktivitas || 'Tidak Ada Aktivitas';

      dateSet.add(date);
      salesSet.add(sales);

      if (!data[date]) {
        data[date] = {};
      }

      if (!data[date][sales]) {
        data[date][sales] = {
          total: 0,
          activities: {},
          items: [],
        };
      }

      data[date][sales].total++;
      data[date][sales].activities[activity] = (data[date][sales].activities[activity] || 0) + 1;
      data[date][sales].items.push(item);
    });

    // Sort dates and sales
    const sortedDates = Array.from(dateSet).sort();
    const sortedSales = Array.from(salesSet).sort();

    setDates(sortedDates);
    setSalesPeople(sortedSales);
    setMonthlyData(data);
  };

  const handleCellClick = (date: string, sales: string, activityType?: string) => {
    const cellData = monthlyData[date]?.[sales];
    if (!cellData || cellData.total === 0) return;

    setSelectedSales(sales);
    setSelectedDate(date);
    setSelectedActivityType(activityType || '');

    // Filter items by activity type if specified
    const filteredItems = activityType
      ? cellData.items.filter((item) => item.aktivitas === activityType)
      : cellData.items;

    setSelectedItems(filteredItems);
    setDialogOpen(true);
  };

  const getActivitySummary = () => {
    const summary: ActivitySummary = {};
    selectedItems.forEach((item) => {
      const activity = item.aktivitas || 'Tidak Ada Aktivitas';
      summary[activity] = (summary[activity] || 0) + 1;
    });
    return summary;
  };

  // Calculate totals
  const getTotalPerSales = (sales: string) => {
    let total = 0;
    dates.forEach((date) => {
      total += monthlyData[date]?.[sales]?.total || 0;
    });
    return total;
  };

  const getTotalPerDate = (date: string) => {
    let total = 0;
    salesPeople.forEach((sales) => {
      total += monthlyData[date]?.[sales]?.total || 0;
    });
    return total;
  };

  const getGrandTotal = () => {
    let total = 0;
    dates.forEach((date) => {
      total += getTotalPerDate(date);
    });
    return total;
  };

  const getAveragePerSales = (sales: string) => {
    const total = getTotalPerSales(sales);
    const activeDays = dates.filter((date) => monthlyData[date]?.[sales]?.total > 0).length;
    return activeDays > 0 ? (total / activeDays).toFixed(2) : '0';
  };

  const getActivityColor = (activity: string) => {
    return ACTIVITY_COLORS[activity] || 'bg-gray-100 text-gray-700 border-gray-300';
  };

  return (
    <div className="space-y-3">
      {/* Filters */}
      <div className="flex gap-3 items-center">
        <label className="text-sm">Pilih Bulan:</label>
        <Input
          type="month"
          value={selectedMonth}
          onChange={(e) => setSelectedMonth(e.target.value)}
          className="w-[180px] h-8"
        />
      </div>

      <h3 className="text-center font-semibold">Laporan Jumlah Aktivitas (Follow Up) Sales</h3>

      {/* Table */}
      <div className="overflow-x-auto">
        {loading ? (
          <div className="text-center py-6 text-sm text-muted-foreground">Memuat data...</div>
        ) : dates.length === 0 ? (
          <div className="text-center py-6 text-sm text-muted-foreground">
            Tidak ada data untuk bulan yang dipilih
          </div>
        ) : (
          <table className="w-full border-collapse text-xs">
            <thead>
              <tr>
                <th className="border border-gray-300 bg-gray-100 px-2 py-1 text-center font-medium sticky left-0 z-10">
                  TANGGAL
                </th>
                {salesPeople.map((sales) => (
                  <th
                    key={sales}
                    className="border border-gray-300 bg-gray-100 px-2 py-1 text-center font-medium min-w-[120px]"
                  >
                    {sales}
                  </th>
                ))}
                <th className="border border-gray-300 bg-blue-100 px-2 py-1 text-center font-medium">
                  TOTAL
                </th>
              </tr>
            </thead>
            <tbody>
              {dates.map((date) => (
                <tr key={date}>
                  <td className="border border-gray-300 bg-gray-50 px-2 py-1 font-medium text-center sticky left-0 z-10">
                    {formatDate(date)}
                  </td>
                  {salesPeople.map((sales) => {
                    const cellData = monthlyData[date]?.[sales];
                    const total = cellData?.total || 0;
                    const activities = cellData?.activities || {};

                    return (
                      <td
                        key={sales}
                        className="border border-gray-300 px-1 py-1 text-center"
                      >
                        {total > 0 && (
                          <div className="space-y-0.5">
                            <div className="font-bold">{total}</div>
                            <div className="flex flex-col gap-0.5">
                              {Object.entries(activities).map(([activity, count]) => (
                                <button
                                  key={activity}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleCellClick(date, sales, activity);
                                  }}
                                  className={`${getActivityColor(activity)} text-[10px] px-1 py-0.5 rounded text-center font-medium hover:opacity-80 transition-opacity cursor-pointer w-full`}
                                >
                                  {activity}: {count}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </td>
                    );
                  })}
                  <td className="border border-gray-300 bg-blue-50 px-2 py-1 text-center font-bold">
                    {getTotalPerDate(date)}
                  </td>
                </tr>
              ))}

              {/* Total per Sales */}
              <tr>
                <td className="border border-gray-300 bg-blue-100 px-2 py-1 font-medium text-center">
                  Total per Sales
                </td>
                {salesPeople.map((sales) => (
                  <td
                    key={sales}
                    className="border border-gray-300 bg-blue-50 px-2 py-1 text-center font-bold"
                  >
                    {getTotalPerSales(sales)}
                  </td>
                ))}
                <td className="border border-gray-300 bg-blue-100 px-2 py-1 text-center font-bold">
                  {getGrandTotal()}
                </td>
              </tr>

              {/* Hari Aktif */}
              <tr>
                <td className="border border-gray-300 bg-gray-100 px-2 py-1 font-medium text-center">
                  Hari Aktif (&gt;1 aktivitas)
                </td>
                {salesPeople.map((sales) => {
                  const activeDays = dates.filter((date) => monthlyData[date]?.[sales]?.total > 0).length;
                  return (
                    <td
                      key={sales}
                      className="border border-gray-300 px-2 py-1 text-center"
                    >
                      {activeDays}
                    </td>
                  );
                })}
                <td className="border border-gray-300 px-2 py-1 text-center">—</td>
              </tr>

              {/* Rata-rata per Hari Aktif */}
              <tr>
                <td className="border border-gray-300 bg-gray-100 px-2 py-1 font-medium text-center">
                  Rata-rata / Hari Aktif
                </td>
                {salesPeople.map((sales) => (
                  <td
                    key={sales}
                    className="border border-gray-300 px-2 py-1 text-center"
                  >
                    {getAveragePerSales(sales)}
                  </td>
                ))}
                <td className="border border-gray-300 px-2 py-1 text-center">—</td>
              </tr>
            </tbody>
          </table>
        )}
      </div>

      {/* Detail Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-7xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Detail Aktivitas{selectedActivityType ? `: ${selectedActivityType}` : ''} — {selectedSales} — {formatDate(selectedDate)}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Summary */}
            <div>
              <h4 className="font-medium text-sm mb-2">Ringkasan per Jenis</h4>
              <div className="flex gap-2 flex-wrap">
                {Object.entries(getActivitySummary()).map(([activity, count]) => (
                  <div
                    key={activity}
                    className={`${getActivityColor(activity)} text-sm px-3 py-1.5 rounded font-medium`}
                  >
                    {activity}: {count}
                  </div>
                ))}
                <div className="bg-gray-600 text-white text-sm px-3 py-1.5 rounded font-medium">
                  Total: {selectedItems.length}
                </div>
              </div>
            </div>

            {/* Detail Table */}
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-xs">
                <thead>
                  <tr>
                    <th className="border border-gray-300 bg-gray-100 px-2 py-1 text-left font-medium">
                      PIPELINEID
                    </th>
                    <th className="border border-gray-300 bg-gray-100 px-2 py-1 text-left font-medium">
                      JENIS
                    </th>
                    <th className="border border-gray-300 bg-gray-100 px-2 py-1 text-left font-medium">
                      CUSTOMER
                    </th>
                    <th className="border border-gray-300 bg-gray-100 px-2 py-1 text-left font-medium">
                      HASIL
                    </th>
                    <th className="border border-gray-300 bg-gray-100 px-2 py-1 text-left font-medium">
                      CATATAN
                    </th>
                    <th className="border border-gray-300 bg-gray-100 px-2 py-1 text-left font-medium">
                      ALAMAT
                    </th>
                    <th className="border border-gray-300 bg-gray-100 px-2 py-1 text-left font-medium">
                      SOURCE
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {selectedItems.map((item) => (
                    <tr key={item.id}>
                      <td className="border border-gray-300 px-2 py-1">
                        <button
                          onClick={() => {
                            navigate(`/sales/pipeline/detail/${item.pipelineId}`);
                            setDialogOpen(false);
                          }}
                          className="text-blue-600 hover:text-blue-800 hover:underline font-medium"
                        >
                          #{item.pipelineId.split(':')[1]?.substring(0, 4)}
                        </button>
                      </td>
                      <td className="border border-gray-300 px-2 py-1">
                        <div className={`${getActivityColor(item.aktivitas)} text-xs px-2 py-1 rounded inline-block font-medium`}>
                          {item.aktivitas}
                        </div>
                      </td>
                      <td className="border border-gray-300 px-2 py-1">
                        {item.customer}
                      </td>
                      <td className="border border-gray-300 px-2 py-1">
                        {item.hasil || '-'}
                      </td>
                      <td className="border border-gray-300 px-2 py-1">
                        {item.catatan || '-'}
                      </td>
                      <td className="border border-gray-300 px-2 py-1">
                        {item.alamat || '-'}
                      </td>
                      <td className="border border-gray-300 px-2 py-1">
                        <div className={`text-xs px-2 py-1 rounded inline-block font-medium ${
                            item.source === 'pipeline'
                              ? 'bg-blue-500 text-white'
                              : 'bg-purple-500 text-white'
                          }`}
                        >
                          {item.source === 'pipeline' ? 'Pipeline' : 'Follow-Up'}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex justify-end">
              <Button onClick={() => setDialogOpen(false)}>Tutup</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
