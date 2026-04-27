import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router';
import { ChevronLeft, Edit, Printer, Send, CheckCircle, XCircle, FileText } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Card } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { PageHeader } from '../../components/page-header';
import { QuotationPrint } from '../../components/quotation-print';
import { toast } from 'sonner';
import { api } from '../../lib/api';
import { formatDate } from '../../components/ui/utils';

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

interface Quotation {
  id: string;
  quotationNumber: string;
  tanggal: string;
  reference: string;
  customerName: string;
  alamatCustomer?: string;
  validUntil: string;
  totalAmount: number;
  status: 'Draft' | 'Sent' | 'Approved' | 'Rejected' | 'Expired';
  salesPerson: string;
  syaratPembayaran?: string;
  kenaPajak?: boolean;
  items: QuotationItem[];
  notes: string;
  createdAt: string;
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
    'Sent': 'bg-blue-100 text-blue-700 border-blue-300',
    'Approved': 'bg-green-100 text-green-700 border-green-300',
    'Rejected': 'bg-red-100 text-red-700 border-red-300',
    'Expired': 'bg-orange-100 text-orange-700 border-orange-300',
  };
  return classes[status] || 'bg-gray-100 text-gray-700';
};

const getStatusIcon = (status: string) => {
  const icons: Record<string, JSX.Element> = {
    'Draft': <FileText className="w-4 h-4" />,
    'Sent': <Send className="w-4 h-4" />,
    'Approved': <CheckCircle className="w-4 h-4" />,
    'Rejected': <XCircle className="w-4 h-4" />,
    'Expired': <XCircle className="w-4 h-4" />,
  };
  return icons[status] || <FileText className="w-4 h-4" />;
};

export function QuotationDetail() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [quotation, setQuotation] = useState<Quotation | null>(null);
  const [loading, setLoading] = useState(true);
  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (id) {
      fetchQuotationData(id);
    }
  }, [id]);

  const fetchQuotationData = async (quotationId: string) => {
    try {
      setLoading(true);
      const quotations = await api.getQuotations();
      const result = quotations.find((q: Quotation) => q.id === quotationId);

      if (result) {
        setQuotation(result);
      } else {
        toast.error('Penawaran tidak ditemukan');
        navigate('/sales/quotations');
      }
    } catch (error) {
      console.error('Error fetching quotation data:', error);
      toast.error('Gagal memuat data penawaran');
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    if (!printRef.current || !quotation) {
      toast.error('Data penawaran belum tersedia');
      return;
    }

    // Create a new window for printing
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast.error('Gagal membuka window cetak. Pastikan popup tidak diblokir.');
      return;
    }

    // Get the HTML content
    const printContent = printRef.current.innerHTML;

    // Write to the new window
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Penawaran - ${quotation.quotationNumber}</title>
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
  };

  const handleSend = async () => {
    if (!quotation) return;

    if (quotation.status === 'Sent') {
      toast.info('Penawaran sudah dikirim sebelumnya');
      return;
    }

    try {
      await api.updateQuotation(quotation.id, { ...quotation, status: 'Sent' });
      toast.success('Penawaran berhasil dikirim');
      fetchQuotationData(quotation.id);
    } catch (error) {
      console.error('Error sending quotation:', error);
      toast.error('Gagal mengirim penawaran');
    }
  };

  const handleApprove = async () => {
    if (!quotation) return;

    try {
      await api.updateQuotation(quotation.id, { ...quotation, status: 'Approved' });
      toast.success('Penawaran berhasil di-approve');
      fetchQuotationData(quotation.id);
    } catch (error) {
      console.error('Error approving quotation:', error);
      toast.error('Gagal approve penawaran');
    }
  };

  const handleReject = async () => {
    if (!quotation) return;

    if (!confirm('Apakah Anda yakin ingin menolak penawaran ini?')) return;

    try {
      await api.updateQuotation(quotation.id, { ...quotation, status: 'Rejected' });
      toast.success('Penawaran berhasil ditolak');
      fetchQuotationData(quotation.id);
    } catch (error) {
      console.error('Error rejecting quotation:', error);
      toast.error('Gagal menolak penawaran');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="text-lg font-medium">Memuat data...</div>
        </div>
      </div>
    );
  }

  if (!quotation) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="text-lg font-medium">Penawaran tidak ditemukan</div>
        </div>
      </div>
    );
  }

  const isExpired = new Date(quotation.validUntil) < new Date();
  const subtotal = quotation.items.reduce((sum, item) => sum + item.totalPrice, 0);

  return (
    <div className="space-y-4 pb-4">
      <PageHeader
        title="Detail Penawaran Penjualan"
        description={`No. Penawaran: ${quotation.quotationNumber}`}
        breadcrumbs={[
          { label: 'Dashboard', href: '/' },
          { label: 'Sales' },
          { label: 'Penawaran', href: '/sales/quotations' },
          { label: 'Detail' },
        ]}
        actions={
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => navigate('/sales/quotations')}>
              <ChevronLeft className="w-4 h-4 mr-2" />
              Kembali
            </Button>
            <Button variant="outline" onClick={handlePrint}>
              <Printer className="w-4 h-4 mr-2" />
              Cetak
            </Button>
            {quotation.status === 'Draft' && (
              <>
                <Button variant="outline" onClick={handleSend}>
                  <Send className="w-4 h-4 mr-2" />
                  Kirim
                </Button>
                <Button onClick={() => navigate(`/sales/quotations/${quotation.id}/edit`)}>
                  <Edit className="w-4 h-4 mr-2" />
                  Edit
                </Button>
              </>
            )}
            {quotation.status === 'Sent' && (
              <>
                <Button variant="outline" className="bg-red-50 hover:bg-red-100" onClick={handleReject}>
                  <XCircle className="w-4 h-4 mr-2" />
                  Tolak
                </Button>
                <Button variant="default" className="bg-green-600 hover:bg-green-700" onClick={handleApprove}>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Approve
                </Button>
              </>
            )}
          </div>
        }
      />

      {/* Header Information */}
      <Card className="p-6">
        <div className="grid grid-cols-2 gap-6">
          {/* Left Column */}
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-semibold text-muted-foreground mb-3">Informasi Penawaran</h3>
              <div className="space-y-2">
                <div className="grid grid-cols-[140px_1fr] gap-2">
                  <span className="text-sm text-muted-foreground">No. Penawaran:</span>
                  <span className="text-sm font-semibold text-blue-600">{quotation.quotationNumber}</span>
                </div>
                <div className="grid grid-cols-[140px_1fr] gap-2">
                  <span className="text-sm text-muted-foreground">Tanggal:</span>
                  <span className="text-sm font-medium">{formatDate(quotation.tanggal)}</span>
                </div>
                <div className="grid grid-cols-[140px_1fr] gap-2">
                  <span className="text-sm text-muted-foreground">Berlaku Sampai:</span>
                  <span className={`text-sm font-medium ${isExpired ? 'text-red-600' : ''}`}>
                    {formatDate(quotation.validUntil)}
                    {isExpired && <span className="ml-2 text-xs">(Kadaluarsa)</span>}
                  </span>
                </div>
                <div className="grid grid-cols-[140px_1fr] gap-2">
                  <span className="text-sm text-muted-foreground">Referensi:</span>
                  <span className="text-sm">{quotation.reference || '-'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-semibold text-muted-foreground mb-3">Informasi Customer</h3>
              <div className="space-y-2">
                <div className="grid grid-cols-[140px_1fr] gap-2">
                  <span className="text-sm text-muted-foreground">Nama Customer:</span>
                  <span className="text-sm font-semibold">{quotation.customerName}</span>
                </div>
                {quotation.alamatCustomer && (
                  <div className="grid grid-cols-[140px_1fr] gap-2">
                    <span className="text-sm text-muted-foreground">Alamat Customer:</span>
                    <span className="text-sm">{quotation.alamatCustomer}</span>
                  </div>
                )}
                <div className="grid grid-cols-[140px_1fr] gap-2">
                  <span className="text-sm text-muted-foreground">Sales Person:</span>
                  <span className="text-sm">{quotation.salesPerson}</span>
                </div>
                {quotation.syaratPembayaran && (
                  <div className="grid grid-cols-[140px_1fr] gap-2">
                    <span className="text-sm text-muted-foreground">Syarat Pembayaran:</span>
                    <span className="text-sm">{quotation.syaratPembayaran}</span>
                  </div>
                )}
                <div className="grid grid-cols-[140px_1fr] gap-2">
                  <span className="text-sm text-muted-foreground">Status:</span>
                  <Badge className={`inline-flex items-center gap-1 ${getStatusBadgeClass(quotation.status)} w-fit`}>
                    {getStatusIcon(quotation.status)}
                    {quotation.status}
                  </Badge>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Items Table */}
      <Card className="p-6">
        <h3 className="text-base font-semibold mb-4">Detail Item Penawaran</h3>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b-2 border-gray-300">
                <th className="text-left p-3 text-sm font-semibold bg-muted/50">No</th>
                <th className="text-left p-3 text-sm font-semibold bg-muted/50">Nama Item</th>
                <th className="text-left p-3 text-sm font-semibold bg-muted/50">Deskripsi</th>
                <th className="text-center p-3 text-sm font-semibold bg-muted/50">Qty</th>
                <th className="text-center p-3 text-sm font-semibold bg-muted/50">Unit</th>
                <th className="text-right p-3 text-sm font-semibold bg-muted/50">Harga Satuan</th>
                <th className="text-right p-3 text-sm font-semibold bg-muted/50">Diskon</th>
                <th className="text-right p-3 text-sm font-semibold bg-muted/50">Total</th>
              </tr>
            </thead>
            <tbody>
              {quotation.items.map((item, index) => (
                <tr key={index} className="border-b hover:bg-muted/20">
                  <td className="p-3 text-sm">{index + 1}</td>
                  <td className="p-3 text-sm font-medium">{item.itemName}</td>
                  <td className="p-3 text-sm text-muted-foreground">{item.description || '-'}</td>
                  <td className="p-3 text-sm text-center">{item.quantity.toLocaleString('id-ID')}</td>
                  <td className="p-3 text-sm text-center">{item.unit}</td>
                  <td className="p-3 text-sm text-right font-medium">{formatCurrency(item.unitPrice)}</td>
                  <td className="p-3 text-sm text-right">
                    {item.diskon
                      ? item.diskonType === 'percentage'
                        ? `${item.diskon}%`
                        : formatCurrency(item.diskon)
                      : '-'
                    }
                  </td>
                  <td className="p-3 text-sm text-right font-semibold">{formatCurrency(item.totalPrice)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-gray-300">
                <td colSpan={7} className="p-3 text-right text-sm font-semibold">Subtotal:</td>
                <td className="p-3 text-right text-sm font-bold text-blue-600">{formatCurrency(subtotal)}</td>
              </tr>
              {quotation.kenaPajak && (
                <tr>
                  <td colSpan={7} className="p-3 text-right text-sm font-semibold">PPN 11%:</td>
                  <td className="p-3 text-right text-sm font-semibold text-blue-600">
                    {formatCurrency((subtotal * 11) / 100)}
                  </td>
                </tr>
              )}
              <tr className="bg-blue-50">
                <td colSpan={7} className="p-3 text-right text-base font-bold">Total:</td>
                <td className="p-3 text-right text-base font-bold text-blue-600">{formatCurrency(quotation.totalAmount)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </Card>

      {/* Notes */}
      {quotation.notes && (
        <Card className="p-6">
          <h3 className="text-base font-semibold mb-3">Catatan</h3>
          <div className="bg-muted/30 p-4 rounded-lg">
            <p className="text-sm whitespace-pre-wrap">{quotation.notes}</p>
          </div>
        </Card>
      )}

      {/* Additional Information */}
      <Card className="p-6">
        <h3 className="text-base font-semibold mb-3">Informasi Tambahan</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="grid grid-cols-[140px_1fr] gap-2">
            <span className="text-sm text-muted-foreground">Dibuat Tanggal:</span>
            <span className="text-sm">{formatDate(quotation.createdAt)}</span>
          </div>
          <div className="grid grid-cols-[140px_1fr] gap-2">
            <span className="text-sm text-muted-foreground">Total Item:</span>
            <span className="text-sm font-medium">{quotation.items.length} item</span>
          </div>
        </div>
      </Card>

      {/* Hidden Print Template */}
      <div style={{ position: 'absolute', left: '-9999px', top: 0, opacity: 0, pointerEvents: 'none' }}>
        {quotation && <QuotationPrint ref={printRef} quotation={quotation} />}
      </div>
    </div>
  );
}
