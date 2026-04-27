import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { Package, Factory, Users, ShoppingCart, TrendingUp, TrendingDown, Clock, AlertTriangle, Target, Palette, ClipboardCheck, Briefcase, ExternalLink } from "lucide-react";
import { StatusBadge } from "../components/status-badge";
import { Progress } from "../components/ui/progress";
import { StatCard } from "../components/stat-card";
import { useState } from "react";
import { Tabs, TabsList, TabsTrigger } from "../components/ui/tabs";

// Production Data
const productionData = [
  { name: 'Sen', target: 4000, actual: 3800 },
  { name: 'Sel', target: 4200, actual: 4100 },
  { name: 'Rab', target: 4000, actual: 3900 },
  { name: 'Kam', target: 4500, actual: 4400 },
  { name: 'Jum', target: 4300, actual: 4200 },
  { name: 'Sab', target: 3800, actual: 3600 },
];

// Order Status Data
const orderStatusData = [
  { name: 'Selesai', value: 45, color: '#10B981' },
  { name: 'Proses', value: 30, color: '#F59E0B' },
  { name: 'Tertunda', value: 15, color: '#DC2626' },
  { name: 'Draft', value: 10, color: '#3B82F6' },
];

// Machine Status
const machineStatus = [
  { id: 'M001', name: 'Rotogravure 1', status: 'Active', efficiency: 92 },
  { id: 'M002', name: 'Rotogravure 2', status: 'Active', efficiency: 88 },
  { id: 'M003', name: 'Offset 1', status: 'Maintenance', efficiency: 0 },
  { id: 'M004', name: 'Laminating 1', status: 'Active', efficiency: 95 },
  { id: 'M005', name: 'Slitting 1', status: 'Active', efficiency: 90 },
];

// Recent Orders
const recentOrders = [
  { id: 'SO-001', customer: 'PT Indofood', item: 'Kemasan Snack', qty: '5000 pcs', status: 'Proses', deadline: '15 Apr 2026' },
  { id: 'SO-002', customer: 'PT Unilever', item: 'Kemasan Sabun', qty: '10000 pcs', status: 'Approved', deadline: '20 Apr 2026' },
  { id: 'SO-003', customer: 'PT Mayora', item: 'Kemasan Biskuit', qty: '7500 pcs', status: 'Draft', deadline: '25 Apr 2026' },
  { id: 'SO-004', customer: 'PT Wings', item: 'Kemasan Detergen', qty: '12000 pcs', status: 'Proses', deadline: '18 Apr 2026' },
];

// Sales Pipeline Data
const salesPipelineData = [
  { stage: 'Lead', count: 34, value: 1250000000, color: '#3B82F6' },
  { stage: 'Qualification', count: 28, value: 980000000, color: '#3B82F6' },
  { stage: 'Proposal', count: 18, value: 650000000, color: '#3B82F6' },
  { stage: 'Negotiation', count: 12, value: 420000000, color: '#3B82F6' },
  { stage: 'Won', count: 54, value: 2100000000, color: '#10B981' },
];

// Top Customers Data
const topCustomers = [
  { name: 'PT Indofood CBP', revenue: 850000000, orders: 24 },
  { name: 'PT Unilever Indonesia', revenue: 720000000, orders: 18 },
  { name: 'PT Mayora Indah', revenue: 680000000, orders: 21 },
  { name: 'PT Wings Group', revenue: 620000000, orders: 16 },
  { name: 'PT Nestle Indonesia', revenue: 580000000, orders: 14 },
];

// Format currency
const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

export function Dashboard() {
  const [selectedDivision, setSelectedDivision] = useState('sales');

  return (
    <div className="space-y-3">
      {/* Division Selector Tabs */}
      <div className="bg-white dark:bg-slate-900 rounded-lg p-3 shadow-sm border border-gray-200 dark:border-slate-700">
        <p className="text-[11px] text-muted-foreground mb-2">Pilih Divisi</p>
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setSelectedDivision('sales')}
            className={`flex flex-col items-center justify-center w-[90px] h-[72px] rounded-lg border-2 transition-all ${
              selectedDivision === 'sales'
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-950'
                : 'border-gray-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-800'
            }`}
          >
            <BarChart className={`w-6 h-6 mb-1 ${selectedDivision === 'sales' ? 'text-blue-500' : 'text-gray-400'}`} />
            <span className={`text-[11px] font-medium ${selectedDivision === 'sales' ? 'text-blue-700 dark:text-blue-300' : 'text-gray-600 dark:text-gray-400'}`}>
              Sales
            </span>
          </button>
          
          <button
            onClick={() => setSelectedDivision('marketing')}
            className={`flex flex-col items-center justify-center w-[90px] h-[72px] rounded-lg border-2 transition-all ${
              selectedDivision === 'marketing'
                ? 'border-orange-500 bg-orange-50 dark:bg-orange-950'
                : 'border-gray-200 dark:border-slate-700 hover:border-orange-300 dark:hover:border-orange-800'
            }`}
          >
            <Target className={`w-6 h-6 mb-1 ${selectedDivision === 'marketing' ? 'text-orange-500' : 'text-gray-400'}`} />
            <span className={`text-[11px] font-medium ${selectedDivision === 'marketing' ? 'text-orange-700 dark:text-orange-300' : 'text-gray-600 dark:text-gray-400'}`}>
              Marketing
            </span>
          </button>
          
          <button
            onClick={() => setSelectedDivision('design')}
            className={`flex flex-col items-center justify-center w-[90px] h-[72px] rounded-lg border-2 transition-all ${
              selectedDivision === 'design'
                ? 'border-pink-500 bg-pink-50 dark:bg-pink-950'
                : 'border-gray-200 dark:border-slate-700 hover:border-pink-300 dark:hover:border-pink-800'
            }`}
          >
            <Palette className={`w-6 h-6 mb-1 ${selectedDivision === 'design' ? 'text-pink-500' : 'text-gray-400'}`} />
            <span className={`text-[11px] font-medium ${selectedDivision === 'design' ? 'text-pink-700 dark:text-pink-300' : 'text-gray-600 dark:text-gray-400'}`}>
              Design
            </span>
          </button>
          
          <button
            onClick={() => setSelectedDivision('ppic')}
            className={`flex flex-col items-center justify-center w-[90px] h-[72px] rounded-lg border-2 transition-all ${
              selectedDivision === 'ppic'
                ? 'border-green-500 bg-green-50 dark:bg-green-950'
                : 'border-gray-200 dark:border-slate-700 hover:border-green-300 dark:hover:border-green-800'
            }`}
          >
            <ClipboardCheck className={`w-6 h-6 mb-1 ${selectedDivision === 'ppic' ? 'text-green-500' : 'text-gray-400'}`} />
            <span className={`text-[11px] font-medium ${selectedDivision === 'ppic' ? 'text-green-700 dark:text-green-300' : 'text-gray-600 dark:text-gray-400'}`}>
              PPIC
            </span>
          </button>
          
          <button
            onClick={() => setSelectedDivision('production')}
            className={`flex flex-col items-center justify-center w-[90px] h-[72px] rounded-lg border-2 transition-all ${
              selectedDivision === 'production'
                ? 'border-orange-500 bg-orange-50 dark:bg-orange-950'
                : 'border-gray-200 dark:border-slate-700 hover:border-orange-300 dark:hover:border-orange-800'
            }`}
          >
            <Factory className={`w-6 h-6 mb-1 ${selectedDivision === 'production' ? 'text-orange-500' : 'text-gray-400'}`} />
            <span className={`text-[11px] font-medium ${selectedDivision === 'production' ? 'text-orange-700 dark:text-orange-300' : 'text-gray-600 dark:text-gray-400'}`}>
              Produksi
            </span>
          </button>
          
          <button
            onClick={() => setSelectedDivision('warehouse')}
            className={`flex flex-col items-center justify-center w-[90px] h-[72px] rounded-lg border-2 transition-all ${
              selectedDivision === 'warehouse'
                ? 'border-cyan-500 bg-cyan-50 dark:bg-cyan-950'
                : 'border-gray-200 dark:border-slate-700 hover:border-cyan-300 dark:hover:border-cyan-800'
            }`}
          >
            <Package className={`w-6 h-6 mb-1 ${selectedDivision === 'warehouse' ? 'text-cyan-500' : 'text-gray-400'}`} />
            <span className={`text-[11px] font-medium ${selectedDivision === 'warehouse' ? 'text-cyan-700 dark:text-cyan-300' : 'text-gray-600 dark:text-gray-400'}`}>
              Gudang
            </span>
          </button>
          
          <button
            onClick={() => setSelectedDivision('procurement')}
            className={`flex flex-col items-center justify-center w-[90px] h-[72px] rounded-lg border-2 transition-all ${
              selectedDivision === 'procurement'
                ? 'border-purple-500 bg-purple-50 dark:bg-purple-950'
                : 'border-gray-200 dark:border-slate-700 hover:border-purple-300 dark:hover:border-purple-800'
            }`}
          >
            <ShoppingCart className={`w-6 h-6 mb-1 ${selectedDivision === 'procurement' ? 'text-purple-500' : 'text-gray-400'}`} />
            <span className={`text-[11px] font-medium ${selectedDivision === 'procurement' ? 'text-purple-700 dark:text-purple-300' : 'text-gray-600 dark:text-gray-400'}`}>
              Procurement
            </span>
          </button>
          
          <button
            onClick={() => setSelectedDivision('hrga')}
            className={`flex flex-col items-center justify-center w-[90px] h-[72px] rounded-lg border-2 transition-all ${
              selectedDivision === 'hrga'
                ? 'border-red-500 bg-red-50 dark:bg-red-950'
                : 'border-gray-200 dark:border-slate-700 hover:border-red-300 dark:hover:border-red-800'
            }`}
          >
            <Briefcase className={`w-6 h-6 mb-1 ${selectedDivision === 'hrga' ? 'text-red-500' : 'text-gray-400'}`} />
            <span className={`text-[11px] font-medium ${selectedDivision === 'hrga' ? 'text-red-700 dark:text-red-300' : 'text-gray-600 dark:text-gray-400'}`}>
              HRGA
            </span>
          </button>
        </div>
      </div>

      {/* KPI Cards - Colored */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2.5">
        <StatCard
          title="Total Customers"
          value="145"
          subtitle="+12 bulan ini"
          icon={Users}
          color="blue"
        />

        <StatCard
          title="Total Orders"
          value="342"
          subtitle="23 pending"
          icon={ShoppingCart}
          color="green"
        />

        <StatCard
          title="Total Revenue"
          value="Rp 8.75M"
          icon={TrendingUp}
          color="purple"
          trend={{
            value: '+15.3%',
            icon: TrendingUp
          }}
        />

        <StatCard
          title="Conversion"
          value="62.1%"
          subtitle="54/87 quotations"
          icon={Target}
          color="orange"
        />
      </div>

      {/* Sales Pipeline */}
      <Card className="shadow-sm border-gray-200 dark:border-slate-700">
        <CardHeader className="px-4 pt-4 pb-3 flex flex-row items-center justify-between">
          <CardTitle className="text-base font-semibold">Sales Pipeline</CardTitle>
          <BarChart className="w-4 h-4 text-muted-foreground" />
        </CardHeader>
        <CardContent className="px-4 pb-4">
          <div className="space-y-4">
            {salesPipelineData.map((stage, index) => (
              <div key={stage.stage} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-foreground">{stage.stage}</span>
                    <span className="text-xs text-muted-foreground">({stage.count})</span>
                  </div>
                  <span className="text-sm font-semibold" style={{ color: stage.color }}>
                    {formatCurrency(stage.value)}
                  </span>
                </div>
                <Progress 
                  value={(stage.value / salesPipelineData[0].value) * 100} 
                  className="h-2 bg-gray-200 dark:bg-gray-700"
                  indicatorStyle={{
                    backgroundColor: stage.color
                  }}
                />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recent Orders and Top Customers */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {/* Recent Orders */}
        <Card className="shadow-sm border-gray-200 dark:border-slate-700">
          <CardHeader className="px-4 pt-4 pb-3 flex flex-row items-center justify-between">
            <CardTitle className="text-base font-semibold">Recent Orders</CardTitle>
            <ExternalLink className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="space-y-3">
              {recentOrders.map((order) => (
                <div key={order.id} className="flex items-start justify-between pb-3 border-b border-border last:border-0 last:pb-0">
                  <div className="flex-1">
                    <p className="font-semibold text-sm text-foreground">{order.id}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{order.customer}</p>
                    <p className="text-xs text-muted-foreground">{order.item} - {order.qty}</p>
                    <p className="text-[10px] text-muted-foreground mt-1">Deadline: {order.deadline}</p>
                  </div>
                  <StatusBadge status={order.status} />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Top Customers */}
        <Card className="shadow-sm border-gray-200 dark:border-slate-700">
          <CardHeader className="px-4 pt-4 pb-3 flex flex-row items-center justify-between">
            <CardTitle className="text-base font-semibold">Top Customers</CardTitle>
            <Users className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="space-y-3">
              {topCustomers.map((customer, index) => (
                <div key={customer.name} className="flex items-center justify-between pb-3 border-b border-border last:border-0 last:pb-0">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white font-semibold text-xs">
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-semibold text-sm text-foreground">{customer.name}</p>
                      <p className="text-xs text-muted-foreground">{customer.orders} orders</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-sm text-foreground">{formatCurrency(customer.revenue)}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}