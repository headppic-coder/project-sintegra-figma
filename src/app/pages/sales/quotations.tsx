import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router';
import { Plus, FileText, TrendingUp, Search, Send, CheckCircle, XCircle, Printer, MoreVertical, Edit, Trash2 } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { DatePicker } from '../../components/ui/date-picker';
import { PageHeader } from '../../components/page-header';
import { DataTable } from '../../components/data-table';
import { StatCard } from '../../components/stat-card';
import { Card } from '../../components/ui/card';
import { QuotationPrint } from '../../components/quotation-print';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../../components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../../components/ui/alert-dialog';
import { Textarea } from '../../components/ui/textarea';
import { toast } from 'sonner';
import { api } from '../../lib/api';
import { formatDate } from '../../components/ui/utils';
import { useSimpleAuth } from '../../contexts/simple-auth-context';

interface Quotation {
  id: string;
  quotationNumber: string;
  tanggal: string;
  reference: string;
  customerName: string;
  alamatCustomer?: string;
  validUntil: string;
  totalAmount: number;
  status: 'Draft' | 'Pending' | 'Accept' | 'Sent' | 'Approved' | 'Rejected';
  salesPerson: string;
  syaratPembayaran?: string;
  kenaPajak?: boolean;
  nomorPO?: string;
  submittedBy?: string;
  submittedAt?: string;
  submittedByRole?: string;
  acceptedBy?: string;
  acceptedAt?: string;
  sentBy?: string;
  sentAt?: string;
  approvedBy?: string;
  approvedAt?: string;
  rejectedBy?: string;
  rejectedAt?: string;
  rejectionReason?: string;
  items: QuotationItem[];
  notes: string;
  createdAt: string;
}

interface QuotationItem {
  itemName: string;
  description: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  diskon?: number;
  diskonType?: 'percentage' | 'nominal';
  totalPrice: number;
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
    'Pending': 'bg-yellow-100 text-yellow-700 border-yellow-300',
    'Accept': 'bg-blue-100 text-blue-700 border-blue-300',
    'Sent': 'bg-purple-100 text-purple-700 border-purple-300',
    'Approved': 'bg-green-100 text-green-700 border-green-300',
    'Rejected': 'bg-red-100 text-red-700 border-red-300',
  };
  return classes[status] || 'bg-gray-100 text-gray-700';
};

function QuotationsContent() {
  const navigate = useNavigate();
  const { user } = useSimpleAuth();
  const [data, setData] = useState<Quotation[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [orderFilter, setOrderFilter] = useState('all');
  const [customerFilter, setCustomerFilter] = useState('all');
  const [salesFilter, setSalesFilter] = useState('all');
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [selectedQuotation, setSelectedQuotation] = useState<Quotation | null>(null);
  const [showApproveDialog, setShowApproveDialog] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [showSentDialog, setShowSentDialog] = useState(false);
  const [nomorPO, setNomorPO] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [processingAction, setProcessingAction] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);

  // Check user roles - with null safety
  const userRole = user?.role ? user.role.toLowerCase().replace(/\s+/g, '_').replace(/-/g, '_') : '';

  const isStaffSales =
    userRole === 'staff_sales' ||
    userRole === 'sales_staff' ||
    userRole === 'staff';

  const isSupervisorSales =
    userRole === 'supervisor_sales' ||
    userRole === 'sales_supervisor' ||
    userRole === 'spv_sales' ||
    userRole === 'spv';

  const isManagerSales =
    userRole === 'manager_sales' ||
    userRole === 'sales_manager';

  const isAdmin =
    userRole === 'admin' ||
    userRole === 'administrator' ||
    userRole === 'super_admin' ||
    userRole === 'superadmin';

  // Permission untuk Accept (approval pertama)
  const canAccept = isSupervisorSales || isManagerSales || isAdmin;

  // Permission untuk Approved (approval kedua)
  const canApprove = isManagerSales || isAdmin;

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const result = await api.getQuotations();
      console.log('📊 Quotations loaded:', result);
      setData(result || []);
    } catch (error) {
      console.error('❌ Error loading quotations:', error);
      setData([]);
      toast.error('Gagal memuat data penawaran');
    } finally {
      setLoading(false);
    }
  };

  // Calculate stats - with error handling
  const stats = (() => {
    try {
      return {
        total: data?.length || 0,
        draft: data?.filter(d => d?.status === 'Draft').length || 0,
        pending: data?.filter(d => d?.status === 'Pending').length || 0,
        accept: data?.filter(d => d?.status === 'Accept').length || 0,
        sent: data?.filter(d => d?.status === 'Sent').length || 0,
        approved: data?.filter(d => d?.status === 'Approved').length || 0,
        rejected: data?.filter(d => d?.status === 'Rejected').length || 0,
      };
    } catch (error) {
      console.error('Error calculating stats:', error);
      return { total: 0, draft: 0, pending: 0, accept: 0, sent: 0, approved: 0, rejected: 0 };
    }
  })();

  // Filter data - with null safety
  const filteredData = (data || []).filter(item => {
    if (!item) return false;

    const matchSearch =
      (item.quotationNumber || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.customerName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.reference || '').toLowerCase().includes(searchQuery.toLowerCase());

    const matchOrder = orderFilter === 'all' || item.quotationNumber === orderFilter;
    const matchCustomer = customerFilter === 'all' || item.customerName === customerFilter;
    const matchSales = salesFilter === 'all' || item.salesPerson === salesFilter;

    let matchDate = true;
    if (startDate && item.tanggal) {
      matchDate = matchDate && new Date(item.tanggal) >= startDate;
    }
    if (endDate && item.tanggal) {
      matchDate = matchDate && new Date(item.tanggal) <= endDate;
    }

    return matchSearch && matchOrder && matchCustomer && matchSales && matchDate;
  });

  // Get unique values for filters - with null safety
  const orderNumbers = Array.from(new Set((data || []).map(d => d?.quotationNumber).filter(Boolean)));
  const customers = Array.from(new Set((data || []).map(d => d?.customerName).filter(Boolean)));
  const salesPersons = Array.from(new Set((data || []).map(d => d?.salesPerson).filter(Boolean)));

  const handleView = (item: Quotation) => {
    navigate(`/sales/quotations/${item.id}/detail`);
  };

  const handleEdit = (item: Quotation) => {
    console.log('Edit quotation:', item);
    navigate(`/sales/quotations/${item.id}/edit`);
  };

  const handleDelete = async (item: Quotation) => {
    if (!confirm(`Apakah Anda yakin ingin menghapus penawaran ${item.quotationNumber}?`)) {
      return;
    }

    try {
      await api.deleteQuotation(item.id);
      toast.success('Penawaran berhasil dihapus');
      loadData();
    } catch (error) {
      console.error('Error deleting quotation:', error);
      toast.error('Gagal menghapus penawaran');
    }
  };

  const handleSend = async (item: Quotation) => {
    if (item.status !== 'Draft') {
      toast.error('Hanya penawaran dengan status Draft yang dapat diajukan');
      return;
    }

    try {
      // Get current user from auth context
      const currentUser = localStorage.getItem('currentUser');
      const user = currentUser ? JSON.parse(currentUser) : null;

      await api.submitQuotationForApproval(item.id, {
        submittedBy: user?.nama_user || item.salesPerson,
        submittedAt: new Date().toISOString(),
        submittedByRole: user?.role || 'staff_sales',
      });
      toast.success('Penawaran berhasil diajukan untuk persetujuan');
      loadData();
    } catch (error) {
      console.error('Error sending quotation:', error);
      toast.error('Gagal mengajukan penawaran');
    }
  };

  const handleAccept = (item: Quotation) => {
    if (!canAccept) {
      toast.error('Anda tidak memiliki izin untuk menerima penawaran');
      return;
    }
    setSelectedQuotation(item);
    setShowApproveDialog(true);
  };

  const handleSendWithPO = (item: Quotation) => {
    setSelectedQuotation(item);
    setNomorPO('');
    setShowSentDialog(true);
  };

  const handleApprove = (item: Quotation) => {
    if (!canApprove) {
      toast.error('Anda tidak memiliki izin untuk menyetujui penawaran');
      return;
    }
    setSelectedQuotation(item);
    setShowApproveDialog(true);
  };

  const handleReject = (item: Quotation) => {
    setSelectedQuotation(item);
    setRejectionReason('');
    setShowRejectDialog(true);
  };

  const confirmApprove = async () => {
    if (!selectedQuotation || !user) return;

    try {
      setProcessingAction(true);

      // Cek apakah ini Accept (dari Pending) atau Approved (dari Sent)
      if (selectedQuotation.status === 'Pending') {
        // Accept - approval pertama oleh Supervisor/Manager
        await api.acceptQuotation(selectedQuotation.id, {
          acceptedBy: user.nama_user,
          acceptedAt: new Date().toISOString(),
        });
        toast.success(`Penawaran ${selectedQuotation.quotationNumber} telah diterima`);
      } else if (selectedQuotation.status === 'Sent') {
        // Approved - approval kedua oleh Manager
        await api.approveQuotation(selectedQuotation.id, {
          approvedBy: user.nama_user,
          approvedAt: new Date().toISOString(),
        });
        toast.success(`Penawaran ${selectedQuotation.quotationNumber} telah disetujui`);
      }

      setShowApproveDialog(false);
      setSelectedQuotation(null);
      loadData();
    } catch (error) {
      console.error('Error approving quotation:', error);
      toast.error('Gagal memproses penawaran');
    } finally {
      setProcessingAction(false);
    }
  };

  const confirmSent = async () => {
    if (!selectedQuotation || !user) return;

    if (!nomorPO.trim()) {
      toast.error('Nomor PO harus diisi');
      return;
    }

    try {
      setProcessingAction(true);
      await api.sendQuotationWithPO(selectedQuotation.id, {
        sentBy: user.nama_user,
        sentAt: new Date().toISOString(),
        nomorPO: nomorPO,
      });

      toast.success(`Penawaran ${selectedQuotation.quotationNumber} telah dikirim dengan nomor PO: ${nomorPO}`);
      setShowSentDialog(false);
      setSelectedQuotation(null);
      setNomorPO('');
      loadData();
    } catch (error) {
      console.error('Error sending quotation with PO:', error);
      toast.error('Gagal mengirim penawaran');
    } finally {
      setProcessingAction(false);
    }
  };

  const confirmReject = async () => {
    if (!selectedQuotation || !user) return;

    if (!rejectionReason.trim()) {
      toast.error('Alasan penolakan harus diisi');
      return;
    }

    try {
      setProcessingAction(true);
      await api.rejectQuotation(selectedQuotation.id, {
        rejectedBy: user.nama_user,
        rejectedAt: new Date().toISOString(),
        rejectionReason: rejectionReason,
      });

      toast.success(`Penawaran ${selectedQuotation.quotationNumber} telah ditolak`);
      setShowRejectDialog(false);
      setSelectedQuotation(null);
      setRejectionReason('');
      loadData();
    } catch (error) {
      console.error('Error rejecting quotation:', error);
      toast.error('Gagal menolak penawaran');
    } finally {
      setProcessingAction(false);
    }
  };

  const handlePrint = (item: Quotation) => {
    setSelectedQuotation(item);

    // Wait for state update and DOM render
    setTimeout(() => {
      if (!printRef.current) {
        toast.error('Gagal memuat template cetak');
        return;
      }

      const printWindow = window.open('', '_blank');
      if (!printWindow) {
        toast.error('Gagal membuka window cetak. Pastikan popup tidak diblokir.');
        return;
      }

      const printContent = printRef.current.innerHTML;

      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Penawaran - ${item.quotationNumber}</title>
            <style>
              body {
                margin: 0;
                padding: 0;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
              }
              @page {
                size: A4;
                margin: 10mm;
              }
              @media print {
                body {
                  print-color-adjust: exact;
                  -webkit-print-color-adjust: exact;
                }
              }
            </style>
          </head>
          <body>
            ${printContent}
            <script>
              window.onload = function() {
                window.print();
                setTimeout(function() {
                  window.close();
                }, 100);
              };
            </script>
          </body>
        </html>
      `);

      printWindow.document.close();
    }, 100);
  };

  const columns = [
    {
      key: 'tanggal',
      label: 'Tanggal',
      render: (value: string) => (
        <span className="text-sm">{formatDate(value)}</span>
      ),
    },
    {
      key: 'quotationNumber',
      label: 'No. Penawaran',
      render: (value: string) => (
        <span className="text-sm font-semibold text-blue-600">{value}</span>
      ),
    },
    {
      key: 'reference',
      label: 'Referensi',
      render: (value: string) => (
        <span className="text-sm">{value || '-'}</span>
      ),
    },
    {
      key: 'validUntil',
      label: 'Tanggal Berakhir',
      render: (value: string) => {
        const isExpired = new Date(value) < new Date();
        return (
          <span className={`text-sm ${isExpired ? 'text-red-600 font-semibold' : ''}`}>
            {formatDate(value)}
          </span>
        );
      },
    },
    {
      key: 'salesPerson',
      label: 'Nama Sales',
      render: (value: string) => (
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
        title="Daftar Penawaran"
        description="Kelola penawaran penjualan kepada customer"
        actions={
          <Button onClick={() => navigate('/sales/quotations/new')}>
            <Plus className="w-4 h-4 mr-2" />
            Buat Penawaran
          </Button>
        }
      />

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
        <StatCard
          key="total-quotations"
          title="Total"
          value={stats.total.toString()}
          icon={FileText}
          color="blue"
        />
        <StatCard
          key="draft-quotations"
          title="Draft"
          value={stats.draft.toString()}
          icon={FileText}
          color="gray"
        />
        <StatCard
          key="pending-quotations"
          title="Pending"
          value={stats.pending.toString()}
          icon={FileText}
          color="yellow"
        />
        <StatCard
          key="accept-quotations"
          title="Accept"
          value={stats.accept.toString()}
          icon={FileText}
          color="blue"
        />
        <StatCard
          key="sent-quotations"
          title="Sent"
          value={stats.sent.toString()}
          icon={FileText}
          color="purple"
        />
        <StatCard
          key="approved-quotations"
          title="Approved"
          value={stats.approved.toString()}
          icon={FileText}
          color="green"
        />
        <StatCard
          key="rejected-quotations"
          title="Rejected"
          value={stats.rejected.toString()}
          icon={FileText}
          color="red"
        />
      </div>

      {/* Filters Section */}
      <Card className="p-6">
        <div className="space-y-4">
          {/* Section Title */}
          <div className="flex items-center justify-between">
            <h3 className="text-base font-semibold">Ringkasan Performa &amp; Top Sales</h3>
            <Button variant="link" className="text-blue-600 text-sm p-0 h-auto">
              Lihat Lebih Detail →
            </Button>
          </div>

          {/* Filter Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
            {/* Nomor Urutan */}
            <Select value={orderFilter} onValueChange={setOrderFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Nomor Urutan" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem key="order-all" value="all">Semua Nomor</SelectItem>
                {orderNumbers.filter(n => n && typeof n === 'string' && n.trim() !== '').map((num) => (
                  <SelectItem key={`order-${num}`} value={num}>
                    {num}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Customer */}
            <Select value={customerFilter} onValueChange={setCustomerFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Customer" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem key="customer-all" value="all">Semua Customer</SelectItem>
                {customers.filter(c => c && typeof c === 'string' && c.trim() !== '').map((customer) => (
                  <SelectItem key={`customer-${customer}`} value={customer}>
                    {customer}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Anotasi Sales */}
            <Select value={salesFilter} onValueChange={setSalesFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Anotasi Sales" />
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

            {/* Tanggal Mulai */}
            <DatePicker
              value={startDate}
              onChange={setStartDate}
              placeholder="Tanggal Mulai"
              className="w-full"
            />

            {/* Tanggal Selesai */}
            <DatePicker
              value={endDate}
              onChange={setEndDate}
              placeholder="Tanggal Selesai"
              className="w-full"
            />
          </div>
        </div>
      </Card>

      {/* Action Bar */}
      <Card className="p-4">
        <div className="flex items-center justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              type="text"
              placeholder="Cari penawaran..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
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
          getStatusColor={(row) => {
            if (row.status === 'Draft') return 'bg-gray-400';
            if (row.status === 'Pending') return 'bg-yellow-500';
            if (row.status === 'Accept') return 'bg-blue-500';
            if (row.status === 'Sent') return 'bg-purple-500';
            if (row.status === 'Approved') return 'bg-green-500';
            if (row.status === 'Rejected') return 'bg-red-500';
            return 'bg-gray-500';
          }}
          customActions={[
            // Draft -> Staff Sales dapat Ajukan, Edit, Hapus
            {
              icon: <Send className="w-4 h-4" />,
              onClick: (row) => handleSend(row),
              label: 'Ajukan',
              shouldShow: (row) => row.status === 'Draft',
            },
            {
              icon: <Edit className="w-4 h-4" />,
              onClick: (row) => handleEdit(row),
              label: 'Edit',
              shouldShow: (row) => row.status === 'Draft',
            },
            {
              icon: <Trash2 className="w-4 h-4" />,
              onClick: (row) => handleDelete(row),
              label: 'Hapus',
              variant: 'destructive',
              shouldShow: (row) => row.status === 'Draft',
            },
            // Pending -> Supervisor/Manager dapat Accept (Terima)
            {
              icon: <CheckCircle className="w-4 h-4" />,
              onClick: (row) => handleAccept(row),
              label: 'Terima',
              shouldShow: (row) => row.status === 'Pending' && canAccept,
            },
            {
              icon: <XCircle className="w-4 h-4" />,
              onClick: (row) => handleReject(row),
              label: 'Tolak',
              variant: 'destructive',
              shouldShow: (row) => row.status === 'Pending' && canAccept,
            },
            // Accept -> Staff Sales dapat Kirim dengan PO
            {
              icon: <Send className="w-4 h-4" />,
              onClick: (row) => handleSendWithPO(row),
              label: 'Kirim (+ PO)',
              shouldShow: (row) => row.status === 'Accept' && (isStaffSales || isAdmin),
            },
            {
              icon: <XCircle className="w-4 h-4" />,
              onClick: (row) => handleReject(row),
              label: 'Tolak',
              variant: 'destructive',
              shouldShow: (row) => row.status === 'Accept' && canAccept,
            },
            // Sent -> Manager dapat Approve (Setujui final)
            {
              icon: <CheckCircle className="w-4 h-4" />,
              onClick: (row) => handleApprove(row),
              label: 'Setujui',
              shouldShow: (row) => row.status === 'Sent' && canApprove,
            },
            {
              icon: <XCircle className="w-4 h-4" />,
              onClick: (row) => handleReject(row),
              label: 'Tolak',
              variant: 'destructive',
              shouldShow: (row) => row.status === 'Sent' && canApprove,
            },
            // Approved -> Semua dapat Cetak
            {
              icon: <Printer className="w-4 h-4" />,
              onClick: (row) => handlePrint(row),
              label: 'Cetak',
              shouldShow: (row) => row.status === 'Approved',
            },
          ]}
        />
      </Card>

      {/* Hidden Print Template */}
      {selectedQuotation && (
        <div style={{ position: 'absolute', left: '-9999px', top: 0, opacity: 0, pointerEvents: 'none' }}>
          <QuotationPrint ref={printRef} quotation={selectedQuotation} />
        </div>
      )}

      {/* Approve Dialog */}
      <AlertDialog open={showApproveDialog} onOpenChange={setShowApproveDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {selectedQuotation?.status === 'Pending' ? 'Terima Penawaran' : 'Setujui Penawaran'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {selectedQuotation?.status === 'Pending' ? (
                <>
                  Apakah Anda yakin ingin <strong>menerima</strong> penawaran <strong>{selectedQuotation?.quotationNumber}</strong>?
                  <br />
                  Setelah diterima, staff sales dapat mengirim penawaran dengan nomor PO.
                </>
              ) : (
                <>
                  Apakah Anda yakin ingin <strong>menyetujui final</strong> penawaran <strong>{selectedQuotation?.quotationNumber}</strong>?
                  <br />
                  Ini adalah persetujuan terakhir dari Manager Sales.
                </>
              )}
              <br /><br />
              Customer: <strong>{selectedQuotation?.customerName}</strong>
              <br />
              Total nilai: <strong>{selectedQuotation && formatCurrency(selectedQuotation.totalAmount)}</strong>
              {selectedQuotation?.nomorPO && (
                <>
                  <br />
                  Nomor PO: <strong>{selectedQuotation.nomorPO}</strong>
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={processingAction}>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmApprove}
              disabled={processingAction}
              className="bg-green-600 hover:bg-green-700"
            >
              {processingAction ? 'Memproses...' : (selectedQuotation?.status === 'Pending' ? 'Ya, Terima' : 'Ya, Setujui')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Reject Dialog */}
      <AlertDialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Tolak Penawaran</AlertDialogTitle>
            <AlertDialogDescription>
              Anda akan menolak penawaran <strong>{selectedQuotation?.quotationNumber}</strong>.
              Silakan berikan alasan penolakan:
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <Textarea
              placeholder="Masukkan alasan penolakan..."
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              rows={4}
              className="w-full"
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={processingAction}>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmReject}
              disabled={processingAction}
              className="bg-red-600 hover:bg-red-700"
            >
              {processingAction ? 'Memproses...' : 'Ya, Tolak'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Sent Dialog - Input Nomor PO */}
      <AlertDialog open={showSentDialog} onOpenChange={setShowSentDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Kirim Penawaran dengan Nomor PO</AlertDialogTitle>
            <AlertDialogDescription>
              Penawaran <strong>{selectedQuotation?.quotationNumber}</strong> akan dikirim.
              Silakan masukkan Nomor PO dari customer:
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <label className="text-sm font-medium mb-2 block">Nomor PO Customer</label>
            <Input
              placeholder="Masukkan nomor PO..."
              value={nomorPO}
              onChange={(e) => setNomorPO(e.target.value)}
              className="w-full"
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={processingAction}>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmSent}
              disabled={processingAction}
              className="bg-purple-600 hover:bg-purple-700"
            >
              {processingAction ? 'Memproses...' : 'Ya, Kirim'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// Error boundary wrapper
export default function Quotations() {
  try {
    return <QuotationsContent />;
  } catch (error) {
    console.error('❌ Quotations component error:', error);
    return (
      <div className="p-6">
        <Card className="p-6 bg-red-50 border-red-300">
          <h2 className="text-lg font-semibold text-red-900 mb-2">Error Loading Quotations</h2>
          <p className="text-sm text-red-800">
            Terjadi kesalahan saat memuat halaman penawaran. Silakan refresh halaman atau hubungi administrator.
          </p>
          <p className="text-xs text-red-700 mt-2 font-mono">
            {error instanceof Error ? error.message : 'Unknown error'}
          </p>
        </Card>
      </div>
    );
  }
}
