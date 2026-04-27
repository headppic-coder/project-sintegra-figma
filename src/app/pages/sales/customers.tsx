import { useState, useEffect, useRef } from 'react';
import { Plus, Building2, Search, FileText, Users, CreditCard, TrendingUp, Eye, Edit2, Trash2, MoreVertical, Download, Upload, FileSpreadsheet } from 'lucide-react';
import { useNavigate } from 'react-router';
import { Button } from '../../components/ui/button';
import { DataTable } from '../../components/data-table';
import { PageHeader } from '../../components/page-header';
import { StatCard } from '../../components/stat-card';
import { Card } from '../../components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../components/ui/dialog';
import { Label } from '../../components/ui/label';
import { Input } from '../../components/ui/input';
import { toast } from 'sonner';
import { api } from '../../lib/api';
import { formatDate } from '../../components/ui/utils';
import { displayPhoneNumber, normalizePhoneNumber } from '../../lib/phone-utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../../components/ui/dropdown-menu';

interface Contact {
  pic: string;
  position: string;  // Jabatan
  phone: string;
}

interface Address {
  label: string;
  fullAddress: string;
  district: string;
  city: string;
  province: string;
  country: string;
  postalCode: string;
}

interface Customer {
  id: string;
  customerCategory: string;
  customerName: string;
  industryCategory: string;
  leadSource: string;
  holding: string;
  companyPhone: string; // Nomor Telepon Perusahaan
  contacts: Contact[];
  billingAddress: Address;
  shippingAddress: Address;
  nikNumber: string;
  nikAddress: string;
  npwpNumber: string;
  npwpAddress: string;
  nitkuNumber: string;
  nitkuAddress: string;
  paymentTerms: string;
  taxType: string;
  prospectiveCustomerId?: string; // Link ke calon customer
  createdAt: string;
}

export function Customers() {
  const navigate = useNavigate();
  const [data, setData] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [importLoading, setImportLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const columns = [
    {
      key: 'customerName',
      label: 'Nama Customer',
      render: (value: any, row: Customer) => (
        <div>
          <div className="text-xs">{value}</div>
          <div className="text-xs text-muted-foreground flex items-center gap-1">
            {row.customerCategory}
            {row.prospectiveCustomerId && (
              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] bg-blue-100 text-blue-700 ml-1">
                📋 Dari Calon Customer
              </span>
            )}
          </div>
        </div>
      ),
    },
    {
      key: 'industryCategory',
      label: 'Industri',
      render: (value: string) => value || '-',
    },
    {
      key: 'companyPhone',
      label: 'Nomor Telepon Perusahaan',
      render: (value: string) => {
        if (!value) return '-';
        return (
          <span className="text-sm" title={value}>
            {displayPhoneNumber(value)}
          </span>
        );
      },
    },
    {
      key: 'contacts',
      label: 'Kontak Utama',
      render: (value: Contact[]) => {
        const mainContact = value && value.length > 0 ? value[0] : null;
        return mainContact ? (
          <div>
            <div className="text-sm font-medium">{mainContact.pic}</div>
            {mainContact.position && (
              <div className="text-xs text-muted-foreground">{mainContact.position}</div>
            )}
            {mainContact.phone && (
              <div className="text-xs text-muted-foreground">
                {displayPhoneNumber(mainContact.phone)}
              </div>
            )}
          </div>
        ) : '-';
      },
    },
    {
      key: 'billingAddress',
      label: 'Alamat Penagihan',
      render: (value: Address) => {
        return value ? (
          <div className="max-w-xs">
            <div className="text-xs font-medium text-primary">{value.label}</div>
            <div className="text-sm truncate">{value.fullAddress}</div>
            <div className="text-xs text-muted-foreground">
              {value.city && value.province ? `${value.city}, ${value.province}` : ''}
            </div>
          </div>
        ) : '-';
      },
    },
    {
      key: 'npwpNumber',
      label: 'NPWP',
      render: (value: any) => value || '-',
    },
    {
      key: 'paymentTerms',
      label: 'Syarat Pembayaran',
      render: (value: any) => {
        const colors: Record<string, string> = {
          'Ditanggung': 'bg-green-100 text-green-700',
          'Kena Pajak': 'bg-blue-100 text-blue-700',
        };
        return value ? (
          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${colors[value] || 'bg-gray-100 text-gray-700'}`}>
            {value}
          </span>
        ) : '-';
      },
    },
    {
      key: 'createdAt',
      label: 'Tanggal Daftar',
      render: (value: string) => formatDate(value),
    },
  ];

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const result = await api.getCustomers();
      setData(result || []);
    } catch (error) {
      toast.error('Gagal memuat data customer');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (item: Customer) => {
    navigate(`/sales/customers/${item.id}/edit`);
  };

  const handleView = (item: Customer) => {
    // Untuk sekarang, view akan mengarah ke halaman edit (bisa diganti ke detail page nanti)
    navigate(`/sales/customers/${item.id}/edit`);
  };

  const handlePipeline = (item: Customer) => {
    navigate(`/sales/pipeline/customer-pipeline?customer=${encodeURIComponent(item.customerName)}`);
  };

  const handleDelete = async (item: Customer) => {
    if (!confirm('Apakah Anda yakin ingin menghapus customer ini?')) return;

    try {
      console.log('Deleting customer:', item.id);
      await api.delete(item.id);
      toast.success('Customer berhasil dihapus');
      fetchData();
    } catch (error: any) {
      console.error('Delete error:', error);
      toast.error(`Gagal menghapus data: ${error.message || 'Unknown error'}`);
    }
  };

  // Function untuk menentukan warna mata berdasarkan status payment terms
  const getStatusColor = (row: Customer) => {
    if (row.paymentTerms === 'Kena Pajak') return 'text-blue-600';
    if (row.paymentTerms === 'Ditanggung') return 'text-green-600';
    return 'text-gray-600';
  };

  // Download template CSV
  const handleDownloadTemplate = () => {
    const headers = [
      'Kategori Customer (Perusahaan/Perorangan)*',
      'Nama Customer*',
      'Kategori Industri',
      'Sumber Lead*',
      'Induk Perusahaan',
      'No. Telepon Perusahaan',
      'PIC Nama',
      'PIC Jabatan',
      'PIC Telepon',
      'Alamat Penagihan Label',
      'Alamat Penagihan Lengkap*',
      'Alamat Penagihan Kecamatan',
      'Alamat Penagihan Kota*',
      'Alamat Penagihan Provinsi*',
      'Alamat Penagihan Negara*',
      'Alamat Penagihan Kode Pos',
      'Alamat Kirim Label',
      'Alamat Kirim Lengkap',
      'Alamat Kirim Kecamatan',
      'Alamat Kirim Kota',
      'Alamat Kirim Provinsi',
      'Alamat Kirim Negara',
      'Alamat Kirim Kode Pos',
      'NIK Number',
      'NIK Address',
      'NPWP Number',
      'NPWP Address',
      'NITKU Number',
      'NITKU Address',
    ];

    const example = [
      'Perusahaan',
      'PT CONTOH INDUSTRI',
      'Food & Beverage',
      'Referensi',
      'PT CONTOH INDUSTRI',
      '081234567890',
      'Budi Santoso',
      'Purchasing Manager',
      '081234567891',
      'Kantor Pusat',
      'Jl. Contoh No. 123, RT 01/RW 02',
      'KEBAYORAN BARU',
      'JAKARTA SELATAN',
      'DKI JAKARTA',
      'INDONESIA',
      '12345',
      'Gudang',
      'Jl. Gudang No. 456',
      'CIKARANG',
      'BEKASI',
      'JAWA BARAT',
      'INDONESIA',
      '17530',
      '',
      '',
      '01.234.567.8-901.000',
      'Jl. Contoh No. 123',
      '',
      '',
    ];

    const csvContent = [
      headers.join(','),
      example.join(','),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `Template_Import_Customer_${new Date().getTime()}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.success('Template berhasil diunduh');
  };

  // Import from CSV/Excel
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const validTypes = ['text/csv', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'];
    if (!validTypes.includes(file.type) && !file.name.endsWith('.csv')) {
      toast.error('Format file tidak valid. Gunakan CSV atau Excel (.xlsx)');
      return;
    }

    setImportLoading(true);

    try {
      const text = await file.text();
      const rows = text.split('\n').map(row => {
        // Handle CSV with commas inside quotes
        const regex = /,(?=(?:(?:[^"]*"){2})*[^"]*$)/;
        return row.split(regex).map(cell => cell.trim().replace(/^"|"$/g, ''));
      });

      // Skip header row
      const dataRows = rows.slice(1).filter(row => row.length > 1 && row[0]);

      let successCount = 0;
      let errorCount = 0;
      const errors: string[] = [];

      for (let i = 0; i < dataRows.length; i++) {
        const row = dataRows[i];
        const rowNum = i + 2; // +2 karena header dan 0-index

        try {
          // Validasi required fields
          if (!row[0] || !row[1] || !row[3] || !row[10] || !row[12] || !row[13] || !row[14]) {
            errors.push(`Baris ${rowNum}: Field wajib tidak lengkap`);
            errorCount++;
            continue;
          }

          const customerData = {
            customerCategory: row[0],
            customerName: row[1].toUpperCase(),
            industryCategory: row[2] || '',
            leadSource: row[3],
            holding: row[4] || row[1], // Default ke nama customer sendiri
            companyPhone: normalizePhoneNumber(row[5] || ''),
            contacts: [{
              pic: row[6] || '',
              position: row[7] || '',
              phone: normalizePhoneNumber(row[8] || ''),
            }],
            billingAddress: {
              label: row[9] || 'Alamat Utama',
              fullAddress: row[10].toUpperCase(),
              district: row[11].toUpperCase(),
              city: row[12].toUpperCase(),
              province: row[13].toUpperCase(),
              country: row[14].toUpperCase(),
              postalCode: row[15] || '',
            },
            shippingAddress: {
              label: row[16] || '',
              fullAddress: row[17] ? row[17].toUpperCase() : '',
              district: row[18] ? row[18].toUpperCase() : '',
              city: row[19] ? row[19].toUpperCase() : '',
              province: row[20] ? row[20].toUpperCase() : '',
              country: row[21] ? row[21].toUpperCase() : '',
              postalCode: row[22] || '',
            },
            nikNumber: row[23] || '',
            nikAddress: row[24] || '',
            npwpNumber: row[25] || '',
            npwpAddress: row[26] || '',
            nitkuNumber: row[27] || '',
            nitkuAddress: row[28] || '',
            taxIncluded: false,
            taxIdType: '',
            taxNumber: '',
            taxName: '',
            idTku: '',
            countryCode: 'IDN',
            transactionType: '',
            transactionDetail: '',
            nppkp: '',
            taxAddress: '',
            sameAsBillingAddress: true,
          };

          // Check for duplicates
          const allCustomers = await api.getCustomers();
          const duplicateName = allCustomers.find(
            (customer: any) => customer.customerName.toLowerCase() === customerData.customerName.toLowerCase()
          );

          if (duplicateName) {
            errors.push(`Baris ${rowNum}: Customer "${customerData.customerName}" sudah terdaftar`);
            errorCount++;
            continue;
          }

          const duplicatePhone = allCustomers.find(
            (customer: any) => customer.companyPhone === customerData.companyPhone && customerData.companyPhone
          );

          if (duplicatePhone) {
            errors.push(`Baris ${rowNum}: No. Telepon "${customerData.companyPhone}" sudah terdaftar`);
            errorCount++;
            continue;
          }

          await api.createCustomer(customerData);
          successCount++;
        } catch (error: any) {
          errors.push(`Baris ${rowNum}: ${error.message || 'Error tidak diketahui'}`);
          errorCount++;
        }
      }

      // Show results
      if (successCount > 0) {
        toast.success(`Berhasil import ${successCount} customer`);
        fetchData();
      }

      if (errorCount > 0) {
        toast.error(`${errorCount} customer gagal diimport. Periksa console untuk detail.`);
        console.error('Import errors:', errors);
      }

      setImportDialogOpen(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error: any) {
      console.error('Import error:', error);
      toast.error('Gagal membaca file: ' + error.message);
    } finally {
      setImportLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Customer"
        description="Kelola data customer dengan informasi lengkap"
        breadcrumbs={[
          { label: 'Dashboard', href: '/' },
          { label: 'Sales' },
          { label: 'Customer' },
        ]}
        actions={
          <div className="flex gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline">
                  <FileSpreadsheet className="w-4 h-4 mr-2" />
                  Import / Export
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleDownloadTemplate}>
                  <Download className="w-4 h-4 mr-2" />
                  Download Template CSV
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setImportDialogOpen(true)}>
                  <Upload className="w-4 h-4 mr-2" />
                  Import dari CSV/Excel
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button onClick={() => navigate('/sales/customers/add')}>
              <Plus className="w-4 h-4 mr-2" />
              Tambah Customer
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-4 gap-4">
        <StatCard
          title="Total Customer"
          value={data.length.toString()}
          icon={Users}
          color="blue"
        />
        
        <StatCard
          title="Customer Perusahaan"
          value={data.filter(c => c.customerCategory === 'Perusahaan').length.toString()}
          icon={Building2}
          color="green"
        />
        
        <StatCard
          title="Customer Perorangan"
          value={data.filter(c => c.customerCategory === 'Perorangan').length.toString()}
          icon={Users}
          color="purple"
        />
        
        <StatCard
          title="Kena Pajak"
          value={data.filter(c => c.paymentTerms === 'Kena Pajak').length.toString()}
          icon={CreditCard}
          color="orange"
        />
      </div>

      <DataTable
        columns={columns}
        data={data}
        loading={loading}
        onView={handleView}
        onEdit={handleEdit}
        onDelete={handleDelete}
        customActions={[
          {
            icon: <TrendingUp className="w-4 h-4" />,
            onClick: handlePipeline,
            label: 'Lihat Pipeline',
          }
        ]}
      />

      {/* Import Dialog */}
      <Dialog open={importDialogOpen} onOpenChange={setImportDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Upload className="w-5 h-5" />
              Import Customer dari CSV/Excel
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="border rounded-lg p-4 bg-blue-50/50 space-y-2">
              <h4 className="font-medium text-sm">Petunjuk Import:</h4>
              <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
                <li>Download template CSV terlebih dahulu</li>
                <li>Isi data customer sesuai format template</li>
                <li>Field yang wajib diisi ditandai dengan (*)</li>
                <li>Gunakan format CSV atau Excel (.xlsx)</li>
                <li>Upload file yang sudah diisi</li>
              </ol>
            </div>

            <div className="space-y-2">
              <Label htmlFor="fileUpload">Pilih File CSV/Excel</Label>
              <Input
                id="fileUpload"
                ref={fileInputRef}
                type="file"
                accept=".csv,.xlsx,.xls"
                onChange={handleFileUpload}
                disabled={importLoading}
              />
              <p className="text-xs text-muted-foreground">
                Format yang didukung: CSV, Excel (.xlsx, .xls)
              </p>
            </div>

            {importLoading && (
              <div className="border rounded-lg p-4 bg-yellow-50/50">
                <p className="text-sm font-medium text-yellow-800">
                  ⏳ Sedang mengimport data... Mohon tunggu.
                </p>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setImportDialogOpen(false);
                if (fileInputRef.current) {
                  fileInputRef.current.value = '';
                }
              }}
              disabled={importLoading}
            >
              Tutup
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}