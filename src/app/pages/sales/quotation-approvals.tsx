import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { CheckCircle, XCircle, Eye, FileText, Clock, AlertCircle } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { PageHeader } from '../../components/page-header';
import { StatCard } from '../../components/stat-card';
import { Card } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
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
import { useSimpleAuth } from '../../contexts/simple-auth-context';
import { CreateManagerHelper } from '../../components/create-manager-helper';
import { RoleCheckerAndFixer } from '../../components/role-checker-and-fixer';

interface Quotation {
  id: string;
  quotationNumber: string;
  tanggal: string;
  reference: string;
  customerName: string;
  alamatCustomer?: string;
  validUntil: string;
  totalAmount: number;
  status: 'Draft' | 'Pending' | 'Approved' | 'Rejected';
  salesPerson: string;
  submittedBy?: string;
  submittedAt?: string;
  submittedByRole?: string;
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

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

const getStatusBadgeClass = (status: string) => {
  const classes: Record<string, string> = {
    'Draft': 'bg-gray-100 text-gray-700 border-gray-300',
    'Pending': 'bg-yellow-100 text-yellow-700 border-yellow-300',
    'Approved': 'bg-green-100 text-green-700 border-green-300',
    'Rejected': 'bg-red-100 text-red-700 border-red-300',
  };
  return classes[status] || 'bg-gray-100 text-gray-700';
};

export default function QuotationApprovals() {
  const navigate = useNavigate();
  const { user } = useSimpleAuth();
  const [data, setData] = useState<Quotation[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'Pending' | 'Approved' | 'Rejected'>('all');
  const [showApproveDialog, setShowApproveDialog] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [selectedQuotation, setSelectedQuotation] = useState<Quotation | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [processingAction, setProcessingAction] = useState(false);

  // Check if user has approval permission
  const userRole = user?.role?.toLowerCase().replace(/\s+/g, '_').replace(/-/g, '_');
  const canApprove =
    userRole === 'manager_sales' ||
    userRole === 'sales_manager' ||
    userRole === 'direktur' ||
    userRole === 'director' ||
    userRole === 'admin' ||
    userRole === 'administrator' ||
    userRole === 'super_admin' ||
    userRole === 'superadmin';

  // Debug logging
  useEffect(() => {
    if (user) {
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('🔍 QUOTATION APPROVAL - Permission Check');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('User Object:', user);
      console.log('Current user role (raw):', user.role);
      console.log('Role type:', typeof user.role);
      console.log('Role length:', user.role?.length);
      console.log('Normalized role:', userRole);
      console.log('Can approve:', canApprove);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

      // Test each condition
      console.log('Checks:');
      console.log('  - userRole === manager_sales:', userRole === 'manager_sales');
      console.log('  - userRole === sales_manager:', userRole === 'sales_manager');
      console.log('  - userRole === direktur:', userRole === 'direktur');
      console.log('  - userRole === admin:', userRole === 'admin');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    }
  }, [user, userRole, canApprove]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const result = await api.getQuotations();
      // Filter to show quotations that need approval or have been processed
      const approvalQuotations = (result || []).filter(
        (q: Quotation) => q.status === 'Pending' || q.status === 'Approved' || q.status === 'Rejected'
      );
      setData(approvalQuotations);
    } catch (error) {
      console.error('Error loading quotations:', error);
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  // Calculate stats
  const stats = {
    total: data.length,
    pending: data.filter(d => d.status === 'Pending').length,
    approved: data.filter(d => d.status === 'Approved').length,
    rejected: data.filter(d => d.status === 'Rejected').length,
  };

  // Filter data
  const filteredData = data.filter(item => {
    const matchSearch =
      item.quotationNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.reference.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.submittedBy && item.submittedBy.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchStatus = statusFilter === 'all' || item.status === statusFilter;

    return matchSearch && matchStatus;
  });

  const handleView = (item: Quotation) => {
    navigate(`/sales/quotations/${item.id}/detail`);
  };

  const handleApprove = (item: Quotation) => {
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
      await api.approveQuotation(selectedQuotation.id, {
        approvedBy: user.nama_user,
        approvedAt: new Date().toISOString(),
      });

      toast.success(`Penawaran ${selectedQuotation.quotationNumber} telah disetujui`);
      setShowApproveDialog(false);
      setSelectedQuotation(null);
      loadData();
    } catch (error) {
      console.error('Error approving quotation:', error);
      toast.error('Gagal menyetujui penawaran');
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

  const columns = [
    {
      header: 'No. Penawaran',
      accessorKey: 'quotationNumber',
      cell: (row: Quotation) => (
        <div className="font-medium">{row.quotationNumber}</div>
      ),
    },
    {
      header: 'Tanggal',
      accessorKey: 'tanggal',
      cell: (row: Quotation) => formatDate(row.tanggal),
    },
    {
      header: 'Customer',
      accessorKey: 'customerName',
      cell: (row: Quotation) => (
        <div>
          <div className="font-medium">{row.customerName}</div>
          <div className="text-sm text-gray-500">{row.reference}</div>
        </div>
      ),
    },
    {
      header: 'Diajukan Oleh',
      accessorKey: 'submittedBy',
      cell: (row: Quotation) => (
        <div>
          <div>{row.submittedBy || row.salesPerson}</div>
          {row.submittedByRole && (
            <div className="text-xs text-gray-500">{row.submittedByRole}</div>
          )}
          {row.submittedAt && (
            <div className="text-xs text-gray-500">{formatDate(row.submittedAt)}</div>
          )}
        </div>
      ),
    },
    {
      header: 'Total',
      accessorKey: 'totalAmount',
      cell: (row: Quotation) => formatCurrency(row.totalAmount),
    },
    {
      header: 'Status',
      accessorKey: 'status',
      cell: (row: Quotation) => (
        <Badge className={getStatusBadgeClass(row.status)}>
          {row.status}
        </Badge>
      ),
    },
    {
      header: 'Diproses Oleh',
      accessorKey: 'processedBy',
      cell: (row: Quotation) => {
        if (row.status === 'Approved' && row.approvedBy) {
          return (
            <div>
              <div className="text-green-700">{row.approvedBy}</div>
              {row.approvedAt && (
                <div className="text-xs text-gray-500">{formatDate(row.approvedAt)}</div>
              )}
            </div>
          );
        }
        if (row.status === 'Rejected' && row.rejectedBy) {
          return (
            <div>
              <div className="text-red-700">{row.rejectedBy}</div>
              {row.rejectedAt && (
                <div className="text-xs text-gray-500">{formatDate(row.rejectedAt)}</div>
              )}
              {row.rejectionReason && (
                <div className="text-xs text-gray-600 mt-1">Alasan: {row.rejectionReason}</div>
              )}
            </div>
          );
        }
        return <span className="text-gray-400">-</span>;
      },
    },
    {
      header: 'Aksi',
      accessorKey: 'actions',
      cell: (row: Quotation) => (
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleView(row)}
          >
            <Eye className="h-4 w-4 mr-1" />
            Lihat
          </Button>
          {canApprove && row.status === 'Pending' && (
            <>
              <Button
                size="sm"
                variant="default"
                className="bg-green-600 hover:bg-green-700"
                onClick={() => handleApprove(row)}
              >
                <CheckCircle className="h-4 w-4 mr-1" />
                Setuju
              </Button>
              <Button
                size="sm"
                variant="destructive"
                onClick={() => handleReject(row)}
              >
                <XCircle className="h-4 w-4 mr-1" />
                Tolak
              </Button>
            </>
          )}
        </div>
      ),
    },
  ];

  if (!canApprove) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Persetujuan Penawaran"
          description="Kelola persetujuan penawaran penjualan"
        />
        <Card className="p-6">
          <div className="flex items-center gap-3 text-orange-600">
            <AlertCircle className="h-6 w-6" />
            <div>
              <h3 className="font-semibold">Akses Terbatas</h3>
              <p className="text-sm text-gray-600">
                Anda tidak memiliki izin untuk menyetujui penawaran. Hanya Manager Sales, Direktur, atau Admin yang dapat menyetujui penawaran.
              </p>
              <div className="mt-3 p-3 bg-gray-50 rounded text-xs">
                <p><strong>Informasi User:</strong></p>
                <p>Nama: {user?.nama_user || '-'}</p>
                <p>Username: {user?.username || '-'}</p>
                <p>Role: <span className="font-mono bg-yellow-100 px-2 py-1 rounded">{user?.role || 'Tidak ada role'}</span></p>
                <p className="mt-2 text-gray-500">
                  Jika role Anda sudah benar (manager_sales, direktur, atau admin), hubungi administrator untuk memperbaiki pengaturan role.
                </p>
              </div>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Persetujuan Penawaran Penjualan"
        description="Tinjau dan setujui penawaran penjualan yang diajukan"
      />

      {/* User Permission Status - Always Show for Debugging */}
      <Card className="p-4 bg-blue-50 border-blue-200">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className="text-sm font-semibold text-blue-900 mb-2">Status Akses Persetujuan:</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-xs text-blue-800">
              <div>
                <span className="font-semibold">User:</span> {user?.nama_user || 'Not logged in'}
              </div>
              <div>
                <span className="font-semibold">Role Asli:</span>{' '}
                <span className="font-mono bg-blue-100 px-2 py-1 rounded">
                  {user?.role || 'No role'}
                </span>
              </div>
              <div>
                <span className="font-semibold">Role Normalized:</span>{' '}
                <span className="font-mono bg-blue-100 px-2 py-1 rounded">
                  {userRole || 'No role'}
                </span>
              </div>
            </div>
            <div className="mt-2 text-xs text-blue-700">
              <span className="font-semibold">Role yang diterima:</span> manager_sales, sales_manager, direktur, director, admin, super_admin
            </div>
          </div>
          <div className="ml-4">
            <Badge className={canApprove ? 'bg-green-600 text-white' : 'bg-red-600 text-white'}>
              {canApprove ? '✓ Dapat Menyetujui' : '✗ Tidak Bisa Menyetujui'}
            </Badge>
          </div>
        </div>
      </Card>

      {/* Role Fixer - Show if user cannot approve */}
      {!canApprove && user && (
        <RoleCheckerAndFixer />
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard
          title="Total Penawaran"
          value={stats.total}
          icon={FileText}
        />
        <StatCard
          title="Menunggu Persetujuan"
          value={stats.pending}
          icon={Clock}
          variant="warning"
        />
        <StatCard
          title="Disetujui"
          value={stats.approved}
          icon={CheckCircle}
          variant="success"
        />
        <StatCard
          title="Ditolak"
          value={stats.rejected}
          icon={XCircle}
          variant="danger"
        />
      </div>

      {/* Helper to Create Manager Sales User - Only for Super Admin */}
      {(userRole === 'super_admin' || userRole === 'superadmin' || userRole === 'admin') && (
        <CreateManagerHelper onSuccess={loadData} />
      )}

      {/* Filters */}
      <Card className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Input
              placeholder="Cari no. penawaran, customer, atau diajukan oleh..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div>
            <Select value={statusFilter} onValueChange={(value: any) => setStatusFilter(value)}>
              <SelectTrigger>
                <SelectValue placeholder="Filter Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Status</SelectItem>
                <SelectItem value="Pending">Menunggu Persetujuan</SelectItem>
                <SelectItem value="Approved">Disetujui</SelectItem>
                <SelectItem value="Rejected">Ditolak</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>

      {/* Workflow Info */}
      <Card className="p-4 bg-blue-50 border-blue-200">
        <div className="flex items-start gap-3">
          <FileText className="h-5 w-5 text-blue-600 mt-0.5" />
          <div className="space-y-2 text-sm">
            <h3 className="font-semibold text-blue-900">Alur Kerja Penawaran Penjualan</h3>
            <div className="space-y-1 text-blue-800">
              <p><strong>Yang dapat mengajukan draft:</strong> Staff Sales, Manager Sales, Direktur, Admin</p>
              <p><strong>Yang dapat menyetujui/menolak:</strong> Manager Sales, Direktur, Admin</p>
              <p><strong>Penawaran yang dapat dipakai:</strong> Hanya yang sudah disetujui oleh Manager Sales, Direktur, atau Admin</p>
            </div>
          </div>
        </div>
      </Card>

      {/* Table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                {columns.map((col, idx) => (
                  <th key={idx} className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                    {col.header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y">
              {loading ? (
                <tr>
                  <td colSpan={columns.length} className="px-4 py-8 text-center text-gray-500">
                    Memuat data...
                  </td>
                </tr>
              ) : filteredData.length === 0 ? (
                <tr>
                  <td colSpan={columns.length} className="px-4 py-8 text-center text-gray-500">
                    Tidak ada data
                  </td>
                </tr>
              ) : (
                filteredData.map((row, idx) => (
                  <tr key={idx} className="hover:bg-gray-50">
                    {columns.map((col, colIdx) => (
                      <td key={colIdx} className="px-4 py-3 text-sm">
                        {col.cell(row)}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Approve Dialog */}
      <AlertDialog open={showApproveDialog} onOpenChange={setShowApproveDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Setujui Penawaran</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin menyetujui penawaran <strong>{selectedQuotation?.quotationNumber}</strong> untuk customer <strong>{selectedQuotation?.customerName}</strong>?
              <br /><br />
              Total nilai: <strong>{selectedQuotation && formatCurrency(selectedQuotation.totalAmount)}</strong>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={processingAction}>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmApprove}
              disabled={processingAction}
              className="bg-green-600 hover:bg-green-700"
            >
              {processingAction ? 'Memproses...' : 'Ya, Setujui'}
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
    </div>
  );
}
