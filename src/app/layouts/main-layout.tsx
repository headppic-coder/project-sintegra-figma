import { Outlet, Link, useLocation, useNavigate } from "react-router";
import { useState } from "react";
import { useSimpleAuth } from "../contexts/simple-auth-context";
import { 
  Home, ShoppingCart, Palette, Calendar, Factory, Package, 
  Users, ShoppingBag, Bell, User, Settings, UserPlus, UsersRound, Target, DollarSign,
  FileCheck, ClipboardCheck, List, Send, TruckIcon, Receipt,
  PenTool, Image, Layout, Layers,
  ListTodo, BarChart, Calendar as CalendarIcon, Activity, 
  PackageCheck, Eye, Wrench, Settings as SettingsIcon,
  Clock, TrendingUp, AlertCircle, Clock3, ShieldCheck, 
  Building, PackageOpen, PackagePlus, PackageMinus, PackageSearch,
  FileBox, Grid3x3, Boxes, ArchiveRestore, Tags, FolderKanban,
  Building2, Briefcase, Award, ShoppingCartIcon, UserCheck,
  FileTextIcon, FilePlus, Shield, FileCog, 
  Clipboard as ClipboardIcon, Store, ThumbsUp,
  RotateCcw, CreditCard, FileSpreadsheet, Warehouse, 
  FileImage, CheckSquare, MapPin, GitBranch, Clipboard, ChevronRight, ChevronDown, FileText, BookOpen, Network, Database
} from "lucide-react";
import { Button } from "../components/ui/button";
import { ScrollArea } from "../components/ui/scroll-area";
import { Card } from "../components/ui/card";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "../components/ui/dropdown-menu";
import { Popover, PopoverContent, PopoverTrigger } from "../components/ui/popover";
import { ThemeToggle } from "../components/theme-toggle";
import { StorageWarning } from "../components/storage-warning";

interface ChildMenuItem {
  label: string;
  path: string;
  icon: any;
}

interface MenuItem {
  label: string;
  icon: any;
  path?: string;
  children?: ChildMenuItem[];
}

const menuItems: MenuItem[] = [
  { label: "Dashboard", icon: Home, path: "/" },
  {
    label: "Sales",
    icon: Users,
    children: [
      { label: "Calon Customer", path: "/sales/prospective-customers", icon: UserPlus },
      { label: "Customer", path: "/sales/customers", icon: UsersRound },
      { label: "Pipeline", path: "/sales/pipeline", icon: Target },
      { label: "Follow-Up Pipeline", path: "/sales/pipeline-followups", icon: Clipboard },
      { label: "Formula Harga", path: "/sales/price-formula", icon: DollarSign },
      { label: "Penawaran Penjualan", path: "/sales/quotations", icon: FileCheck },
      { label: "Pesanan Penjualan", path: "/sales/sales-orders", icon: ClipboardCheck },
      { label: "Daftar Pesanan", path: "/sales/sales-order-items", icon: List },
      { label: "Permintaan Kirim", path: "/sales/delivery-requests", icon: Send },
      { label: "Surat Jalan", path: "/sales/delivery-notes", icon: TruckIcon },
      { label: "Rekap Surat Jalan", path: "/sales/delivery-recap", icon: Receipt },
      { label: "Barang Custom", path: "/sales/custom-items", icon: PackageOpen },
    ],
  },
  {
    label: "Marketing",
    icon: BarChart,
    children: [
      { label: "Campaign Management", path: "/marketing/campaigns", icon: Target },
      { label: "Lead Generation", path: "/marketing/lead-generation", icon: UserPlus },
      { label: "Marketing Analytics", path: "/marketing/analytics", icon: BarChart },
    ],
  },
  {
    label: "Design",
    icon: Palette,
    children: [
      { label: "Permintaan Desain", path: "/design/design-requests", icon: PenTool },
      { label: "Proses Desain", path: "/design/design-process", icon: Activity },
      { label: "Perpustakaan Desain", path: "/design/design-library", icon: Image },
      { label: "Layout Desain", path: "/design/design-layout", icon: Layout },
      { label: "Joblist Layout Desain", path: "/design/layout-joblist", icon: ListTodo },
      { label: "Plat Registry", path: "/design/plate-registry", icon: Layers },
      { label: "Artwork Spesifikasi", path: "/design/artwork-specification", icon: FileImage },
      { label: "Prepress Checklist", path: "/design/prepress-checklist", icon: CheckSquare },
    ],
  },
  {
    label: "PPIC",
    icon: ClipboardCheck,
    children: [
      { label: "Tahapan Proses", path: "/ppic/process-stages", icon: ListTodo },
      { label: "Rencana Produksi", path: "/ppic/production-plans", icon: ClipboardCheck },
      { label: "Rencana Jadwal Produksi", path: "/ppic/production-schedule", icon: CalendarIcon },
      { label: "Kapasitas Perencanaan", path: "/ppic/planning-capacity", icon: BarChart },
      { label: "Monitoring Jadwal Produksi", path: "/ppic/schedule-monitoring", icon: Eye },
      { label: "Monitoring Material Produksi", path: "/ppic/material-monitoring", icon: Activity },
      { label: "Monitoring Pemakaian Material", path: "/ppic/material-usage-monitoring", icon: TrendingUp },
      { label: "Penyelesaian Produksi", path: "/ppic/production-completion", icon: PackageCheck },
      { label: "Daftar Penyelesaian Produksi", path: "/ppic/completion-list", icon: List },
    ],
  },
  {
    label: "Produksi",
    icon: Factory,
    children: [
      { label: "Unit Proses", path: "/production/process-units", icon: Building },
      { label: "Rencana Shift", path: "/production/shift-plan", icon: Clock },
      { label: "Jadwal Produksi Realisasi", path: "/production/production-realization", icon: CalendarIcon },
      { label: "Monitoring Jadwal Realisasi", path: "/production/realization-monitoring", icon: Eye },
      { label: "Produktivitas", path: "/production/productivity", icon: TrendingUp },
      { label: "Downtime", path: "/production/downtime", icon: AlertCircle },
      { label: "Produksi Real-time", path: "/production/production-realtime", icon: Activity },
      { label: "Mesin Produksi", path: "/production/machines", icon: SettingsIcon },
      { label: "Maintenance Mesin", path: "/production/machine-maintenance", icon: Wrench },
      { label: "Pengajuan Lembur Produksi", path: "/production/overtime-request", icon: Clock3 },
      { label: "Quality Control Proses", path: "/production/qc-process", icon: ShieldCheck },
      { label: "Quality Control Barang Datang", path: "/production/qc-incoming", icon: PackageCheck },
      { label: "Quality Control Barang Keluar", path: "/production/qc-outgoing", icon: PackageSearch },
    ],
  },
  {
    label: "Gudang",
    icon: Package,
    children: [
      { label: "Pengajuan Barang", path: "/warehouse/item-requests", icon: FilePlus },
      { label: "Penerimaan Barang", path: "/warehouse/item-receipts", icon: PackageCheck },
      { label: "Persiapan Bahan Baku", path: "/warehouse/material-preparation", icon: PackageOpen },
      { label: "Barang Keluar Produksi", path: "/warehouse/production-outgoing", icon: PackageMinus },
      { label: "Barang Masuk Produksi", path: "/warehouse/production-incoming", icon: PackagePlus },
      { label: "Daftar Barang", path: "/warehouse/items", icon: List },
      { label: "Kartu Stock", path: "/warehouse/stock-card", icon: FileBox },
      { label: "Mutasi Stock", path: "/warehouse/stock-movements", icon: ArchiveRestore },
      { label: "Penyesuaian Stock", path: "/warehouse/stock-adjustment", icon: ClipboardIcon },
      { label: "Min-Max Stock Barang", path: "/warehouse/min-max-stock", icon: BarChart },
      { label: "Laporan Stock Barang", path: "/warehouse/stock-report", icon: FileTextIcon },
    ],
  },
  {
    label: "Procurement",
    icon: ShoppingCart,
    children: [
      { label: "Pengajuan Vendor", path: "/procurement/vendor-registration", icon: UserPlus },
      { label: "Pembelian Barang", path: "/procurement/purchase-orders", icon: ShoppingCartIcon },
      { label: "Data Supplier", path: "/procurement/suppliers", icon: Store },
      { label: "Penilaian Supplier", path: "/procurement/supplier-evaluation", icon: ThumbsUp },
      { label: "Retur Pembelian", path: "/procurement/purchase-returns", icon: RotateCcw },
      { label: "Pelunasan Pembelian", path: "/procurement/purchase-payments", icon: CreditCard },
      { label: "Penawaran Supplier", path: "/procurement/supplier-quotations", icon: FileSpreadsheet },
    ],
  },
  {
    label: "HRGA",
    icon: Briefcase,
    children: [
      { label: "Karyawan", path: "/hrga/employees", icon: Users },
      { label: "Struktur Organisasi", path: "/hrga/organization-structure", icon: Grid3x3 },
      { label: "KPI", path: "/hrga/kpi", icon: BarChart },
      { label: "Rekruitmen", path: "/hrga/recruitment", icon: UserCheck },
      { label: "Surat Peringatan", path: "/hrga/warning-letters", icon: AlertCircle },
      { label: "Managemen Surat", path: "/hrga/document-management", icon: FileCog },
      { label: "Laporan Satpam", path: "/hrga/security-reports", icon: Shield },
      { label: "Laporan OB", path: "/hrga/janitor-reports", icon: ClipboardIcon },
      { label: "Asset", path: "/hrga/assets", icon: Boxes },
      { label: "Perbaikan Asset", path: "/hrga/asset-repair", icon: Wrench },
      { label: "Pengajuan ATK", path: "/hrga/office-supply-request", icon: FilePlus },
    ],
  },
  {
    label: "Master",
    icon: Database,
    children: [
      { label: "Database Schema", path: "/master/database-schema", icon: Database },
      { label: "Jenis Produk", path: "/master/product-types", icon: Boxes },
      { label: "Aktivitas Sales", path: "/sales/sales-activities", icon: Clipboard },
      { label: "Stage Pipeline", path: "/sales/pipeline-stages", icon: GitBranch },
      { label: "Sumber Lead", path: "/sales/lead-sources", icon: Target },
      { label: "Wilayah", path: "/sales/regions", icon: MapPin },
      { label: "Segmen", path: "/sales/segments", icon: Network },
      { label: "Kategori Barang", path: "/warehouse/item-categories", icon: FolderKanban },
      { label: "Tipe Barang", path: "/warehouse/item-types", icon: Tags },
      { label: "Gudang", path: "/warehouse/warehouses", icon: Warehouse },
      { label: "Alat Bantu", path: "/warehouse/tool-registry", icon: Wrench },
      { label: "Perusahaan", path: "/hrga/master-companies", icon: Building2 },
      { label: "Departemen", path: "/hrga/master-departments", icon: Briefcase },
      { label: "Jabatan", path: "/hrga/master-positions", icon: Award },
      { label: "Shift", path: "/hrga/master-shift", icon: Clock },
    ],
  },
  {
    label: "System",
    icon: Shield,
    children: [
      { label: "Pengaturan Akses", path: "/system/access-settings", icon: ShieldCheck },
      { label: "Statistik Database", path: "/system/database-stats", icon: Database },
    ],
  },
  {
    label: "Laporan",
    icon: FileText,
    children: [
      { label: "Laporan Penjualan", path: "/reports/sales", icon: BarChart },
      { label: "Laporan Produksi", path: "/reports/production", icon: Factory },
      { label: "Laporan Keuangan", path: "/reports/financial", icon: DollarSign },
      { label: "Laporan Inventory", path: "/reports/inventory", icon: Package },
    ],
  },
];

// Icon color mapping based on menu
const getIconColor = (label: string) => {
  switch (label) {
    case "Dashboard":
      return "text-blue-400";
    case "Sales":
      return "text-blue-500";
    case "Marketing":
      return "text-purple-400";
    case "Design":
      return "text-pink-400";
    case "PPIC":
      return "text-blue-400";
    case "Produksi":
      return "text-orange-400";
    case "Gudang":
      return "text-green-400";
    case "Procurement":
      return "text-cyan-400";
    case "HRGA":
      return "text-red-400";
    case "Master":
      return "text-yellow-400";
    case "System":
      return "text-violet-400";
    case "Laporan":
      return "text-gray-400";
    default:
      return "text-gray-400";
  }
};

// Get icon background color for submenu cards
const getSubmenuIconBg = (index: number, parentLabel: string) => {
  const colors = [
    'bg-blue-500',
    'bg-purple-500', 
    'bg-indigo-500',
    'bg-blue-600',
    'bg-orange-500',
    'bg-cyan-500',
    'bg-teal-500',
    'bg-green-500',
    'bg-emerald-500',
    'bg-lime-600',
    'bg-cyan-600',
    'bg-orange-600',
    'bg-pink-500',
    'bg-rose-500',
    'bg-fuchsia-500',
  ];
  return colors[index % colors.length];
};

export function MainLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut } = useSimpleAuth();
  const [openPopover, setOpenPopover] = useState<string | null>(null);

  const toggleMenu = (label: string) => {
    setOpenPopover(prev =>
      prev === label ? null : label
    );
  };

  const handleLogout = async () => {
    signOut();
    navigate('/login');
  };

  return (
    <div className="flex h-screen bg-background">
      <StorageWarning />
      
      {/* Sidebar - Compact */}
      <aside className="w-48 bg-[#2C3E50] dark:bg-slate-800 flex-shrink-0 flex flex-col border-r border-transparent dark:border-slate-700">
        {/* Logo Header */}
        <div className="px-2.5 py-2 border-b border-[#34495E] dark:border-slate-700">
          <div className="flex items-center gap-1.5">
            <div className="w-7 h-7 bg-[#5B21B6] dark:bg-blue-600 rounded flex items-center justify-center flex-shrink-0">
              <Factory className="w-3.5 h-3.5 text-white" />
            </div>
            <div>
              <h1 className="text-white font-semibold text-[11px] leading-tight">ERP Manufaktur</h1>
              <p className="text-gray-400 dark:text-slate-400 text-[9px] leading-tight">Kemasan Plastik</p>
            </div>
          </div>
        </div>

        {/* Navigation Menu */}
        <ScrollArea className="flex-1">
          <nav className="py-0.5">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isExpanded = openPopover === item.label;
              const isActive = item.path ? location.pathname === item.path : 
                item.children?.some(child => location.pathname === child.path);
              const iconColor = getIconColor(item.label);

              if (item.children) {
                return (
                  <Popover
                    key={item.label}
                    open={openPopover === item.label}
                    onOpenChange={(open) => setOpenPopover(open ? item.label : null)}
                  >
                    <PopoverTrigger asChild>
                      <button
                        className={`w-full px-2.5 py-1.5 flex items-center justify-between hover:bg-[#34495E] dark:hover:bg-slate-700 transition-colors ${isActive ? 'bg-[#34495E] dark:bg-slate-700' : ''}`}
                      >
                        <div className="flex items-center gap-2">
                          <Icon className={`w-3.5 h-3.5 ${iconColor} flex-shrink-0`} />
                          <span className="text-white text-[11px] font-medium">{item.label}</span>
                        </div>
                        <ChevronRight className="w-3 h-3 text-gray-400 dark:text-slate-400 flex-shrink-0" />
                      </button>
                    </PopoverTrigger>
                    <PopoverContent
                      side="right"
                      align="start"
                      className="w-[300px] p-0 ml-0"
                      onInteractOutside={() => setOpenPopover(null)}
                    >
                      <div className="p-0">
                        <div className="flex items-center gap-2 px-3 py-2 border-b border-gray-200 dark:border-slate-600 bg-gray-50 dark:bg-slate-800">
                          <Icon className={`w-4 h-4 ${iconColor}`} />
                          <h3 className="font-semibold text-xs text-gray-900 dark:text-gray-100">{item.label}</h3>
                        </div>
                        <div className="grid grid-cols-3">
                          {item.children.map((child, index) => {
                            const ChildIcon = child.icon;
                            const isChildActive = location.pathname === child.path;
                            const iconBgColor = getSubmenuIconBg(index, item.label);
                            return (
                              <Link
                                key={child.path}
                                to={child.path}
                                onClick={() => setOpenPopover(null)}
                              >
                                <div className={`px-1 py-2 h-[100px] hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-all cursor-pointer flex flex-col items-center justify-center gap-1.5 border-r border-b border-gray-100 dark:border-slate-600 ${isChildActive ? 'bg-blue-50 dark:bg-blue-900/30' : ''}`}>
                                  <div className={`w-7 h-7 ${iconBgColor} rounded flex items-center justify-center flex-shrink-0`}>
                                    {ChildIcon && <ChildIcon className="w-3.5 h-3.5 text-white" />}
                                  </div>
                                  <span className={`text-[10px] font-medium text-center leading-tight px-1 ${isChildActive ? 'text-blue-700 dark:text-blue-300' : 'text-gray-700 dark:text-gray-300'}`}>
                                    {child.label}
                                  </span>
                                </div>
                              </Link>
                            );
                          })}
                        </div>
                      </div>
                    </PopoverContent>
                  </Popover>
                );
              }

              return (
                <Link
                  key={item.path}
                  to={item.path || '#'}
                  className={`block px-2.5 py-1.5 flex items-center gap-2 hover:bg-[#34495E] dark:hover:bg-slate-700 transition-colors ${location.pathname === item.path ? 'bg-[#34495E] dark:bg-slate-700' : ''}`}
                >
                  <Icon className={`w-3.5 h-3.5 ${iconColor} flex-shrink-0`} />
                  <span className="text-white text-[11px] font-medium">{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </ScrollArea>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Topbar */}
        <header className="h-11 border-b border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 flex items-center justify-between px-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div>
              <h3 className="text-xs font-semibold text-gray-900 dark:text-gray-100">Dashboard</h3>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" className="relative hover:bg-gray-100 dark:hover:bg-slate-700 h-7 w-7 p-0">
              <Bell className="w-3.5 h-3.5 text-gray-600 dark:text-gray-400" />
              <span className="absolute top-0 right-0 w-1.5 h-1.5 bg-red-500 rounded-full"></span>
            </Button>
            <ThemeToggle />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="flex items-center gap-1.5 hover:bg-gray-100 dark:hover:bg-slate-700 h-7 px-1.5">
                  <div className="w-6 h-6 bg-[#5B21B6] dark:bg-blue-600 rounded-full flex items-center justify-center">
                    <User className="w-3 h-3 text-white" />
                  </div>
                  <div className="text-left hidden md:block">
                    <p className="text-[11px] font-semibold text-gray-900 dark:text-gray-100">
                      {user?.nama_user || user?.username || 'User'}
                    </p>
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="text-xs">
                  <div className="flex flex-col space-y-1">
                    <p className="font-semibold">{user?.nama_user || user?.username || 'User'}</p>
                    <p className="text-[10px] font-normal text-slate-500 dark:text-slate-400">{user?.email}</p>
                    {user?.role && (
                      <p className="text-[10px] font-normal text-slate-500 dark:text-slate-400">
                        Role: {user.role}
                      </p>
                    )}
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-xs">
                  <User className="w-3.5 h-3.5 mr-2" />
                  Profil
                </DropdownMenuItem>
                <DropdownMenuItem className="text-xs">
                  <Settings className="w-3.5 h-3.5 mr-2" />
                  Pengaturan
                </DropdownMenuItem>
                <DropdownMenuItem className="text-xs" asChild>
                  <Link to="/documentation">
                    <BookOpen className="w-3.5 h-3.5 mr-2" />
                    Dokumentasi Sistem
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-destructive text-xs cursor-pointer"
                  onClick={handleLogout}
                >
                  Keluar
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto p-3 bg-gray-50 dark:bg-[#0F172A]">
          <Outlet />
        </main>
      </div>
    </div>
  );
}