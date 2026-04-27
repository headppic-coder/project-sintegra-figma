import { forwardRef } from 'react';
import { formatDate } from './ui/utils';

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
  status: string;
  salesPerson: string;
  items: QuotationItem[];
  notes: string;
  syaratPembayaran?: string;
  kenaPajak?: boolean;
  createdAt: string;
}

interface QuotationPrintProps {
  quotation: Quotation;
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

export const QuotationPrint = forwardRef<HTMLDivElement, QuotationPrintProps>(
  ({ quotation }, ref) => {
    const subtotal = quotation.items.reduce((sum, item) => sum + item.totalPrice, 0);

    // Calculate total discount from items
    const totalDiscount = quotation.items.reduce((sum, item) => {
      if (item.diskon) {
        return sum + item.diskon;
      }
      return sum;
    }, 0);

    const afterDiscount = subtotal - totalDiscount;
    const ppnAmount = quotation.kenaPajak ? (afterDiscount * 11) / 100 : 0; // PPN 11%
    const grandTotal = afterDiscount + ppnAmount;

    return (
      <div ref={ref} className="bg-white p-8 print-container">
        <style>{`
          @page {
            size: A4;
            margin: 10mm;
          }

          @media print {
            .print-container {
              width: 100%;
              max-width: 100%;
              padding: 0;
              margin: 0;
            }

            .no-print {
              display: none !important;
            }

            body {
              print-color-adjust: exact;
              -webkit-print-color-adjust: exact;
            }
          }

          @media screen {
            .print-container {
              max-width: 210mm;
              margin: 0 auto;
            }
          }

          .print-table {
            width: 100%;
            border-collapse: collapse;
            font-size: 10px;
          }

          .print-table th,
          .print-table td {
            border: 1px solid #333;
            padding: 6px 8px;
            text-align: left;
          }

          .print-table th {
            background-color: #f0f0f0;
            font-weight: 600;
          }

          .print-header {
            background: linear-gradient(135deg, #ec4899 0%, #f97316 100%);
            padding: 20px;
            border-radius: 8px 8px 0 0;
            color: white;
            margin-bottom: 0;
          }

          .company-name {
            font-size: 24px;
            font-weight: bold;
            letter-spacing: 1px;
          }

          .company-info {
            font-size: 9px;
            margin-top: 4px;
            line-height: 1.4;
          }
        `}</style>

        {/* Header with Company Info */}
        <div className="print-header">
          <div className="company-name">MAGENTA INDOPACK</div>
          <div className="company-info">
            Jl. Raya Narogong KM 16, Desa Limus Nunggal, Kec. Cileungsi, Kab. Bogor, Jawa Barat 16820<br />
            ✉ marketing@magentaindopack.com | 📧 sales@magentaindopack.com | 📞 0857-7471-5995
          </div>
        </div>

        {/* Document Title and Info */}
        <div style={{ marginTop: '20px', marginBottom: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            {/* Left: Recipient Info */}
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '11px', marginBottom: '8px' }}>
                <strong>Kepada:</strong>
              </div>
              <div style={{ fontSize: '11px', marginBottom: '4px' }}>
                <strong>{quotation.customerName}</strong>
              </div>
              {quotation.alamatCustomer && (
                <div style={{ fontSize: '10px', color: '#666', maxWidth: '300px' }}>
                  {quotation.alamatCustomer}
                </div>
              )}
            </div>

            {/* Center: Title */}
            <div style={{ flex: 1, textAlign: 'center' }}>
              <h1 style={{ fontSize: '20px', fontWeight: 'bold', margin: 0, marginBottom: '10px' }}>
                PENAWARAN
              </h1>
            </div>

            {/* Right: Document Info */}
            <div style={{ flex: 1, fontSize: '10px', textAlign: 'right' }}>
              <table style={{ marginLeft: 'auto', borderCollapse: 'collapse' }}>
                <tbody>
                  <tr>
                    <td style={{ padding: '3px 8px 3px 0', textAlign: 'right' }}><strong>Nomor SQ</strong></td>
                    <td style={{ padding: '3px 0' }}>: {quotation.quotationNumber}</td>
                  </tr>
                  <tr>
                    <td style={{ padding: '3px 8px 3px 0', textAlign: 'right' }}><strong>Tanggal</strong></td>
                    <td style={{ padding: '3px 0' }}>: {formatDate(quotation.tanggal)}</td>
                  </tr>
                  <tr>
                    <td style={{ padding: '3px 8px 3px 0', textAlign: 'right' }}><strong>Pembayaran</strong></td>
                    <td style={{ padding: '3px 0' }}>: {quotation.syaratPembayaran || 'net 30'}</td>
                  </tr>
                  <tr>
                    <td style={{ padding: '3px 8px 3px 0', textAlign: 'right' }}><strong>Berlaku Sampai</strong></td>
                    <td style={{ padding: '3px 0' }}>: {formatDate(quotation.validUntil)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Items Table */}
        <table className="print-table" style={{ marginBottom: '16px' }}>
          <thead>
            <tr>
              <th style={{ width: '30px', textAlign: 'center' }}>No</th>
              <th style={{ width: '180px' }}>Nama Barang</th>
              <th>Spesifikasi Barang</th>
              <th style={{ width: '70px', textAlign: 'center' }}>Kuantitas</th>
              <th style={{ width: '40px', textAlign: 'center' }}>Sat</th>
              <th style={{ width: '100px', textAlign: 'right' }}>Harga</th>
              <th style={{ width: '60px', textAlign: 'right' }}>Diskon</th>
              <th style={{ width: '120px', textAlign: 'right' }}>Total Harga</th>
            </tr>
          </thead>
          <tbody>
            {quotation.items.map((item, index) => (
              <tr key={index}>
                <td style={{ textAlign: 'center' }}>{index + 1}</td>
                <td style={{ fontWeight: '600' }}>{item.itemName}</td>
                <td style={{ fontSize: '9px', lineHeight: '1.3' }}>{item.description || '-'}</td>
                <td style={{ textAlign: 'center' }}>{item.quantity.toLocaleString('id-ID')}</td>
                <td style={{ textAlign: 'center' }}>{item.unit}</td>
                <td style={{ textAlign: 'right' }}>{formatCurrency(item.unitPrice)}</td>
                <td style={{ textAlign: 'right' }}>
                  {item.diskon
                    ? item.diskonType === 'percentage'
                      ? `${item.diskon}%`
                      : formatCurrency(item.diskon)
                    : '-'
                  }
                </td>
                <td style={{ textAlign: 'right', fontWeight: '600' }}>{formatCurrency(item.totalPrice)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Notes and Terms */}
        <div style={{ marginBottom: '16px' }}>
          <div style={{ fontSize: '9px', marginBottom: '8px' }}>
            <strong>Keterangan dan Pembatalan:</strong>
          </div>
          <ol style={{ fontSize: '9px', lineHeight: '1.5', margin: 0, paddingLeft: '18px' }}>
            <li>Pembatalan order setelah proses produksi berjalan, maka konsekuensi customer menanggung biaya produksi 50% dari harga yang telah disepakati</li>
            <li>Kesalahan desain yang disetujui, menjadi tanggung jawab customer</li>
            <li>Kesalahan produksi yang menjadi kelalaian pihak Magenta Indopack, akan kami ganti dengan produk yang baru tanpa dikenakan biaya tambahan</li>
            <li>Harga ini berlaku untuk Artwork dari file yang sudah jadi (siap produksi)</li>
            <li>Leadtime 2-3 minggu dari DP (Down Payment) dan Artwork final yang diterima dan telah disetujui customer</li>
          </ol>
        </div>

        <div style={{ marginBottom: '16px' }}>
          <div style={{ fontSize: '9px', marginBottom: '6px' }}>
            <strong>Disclaimer:</strong>
          </div>
          <ol style={{ fontSize: '9px', lineHeight: '1.5', margin: 0, paddingLeft: '18px' }}>
            <li>Harga belum termasuk ongkir/transport</li>
            <li>Harga untuk pemesanan full-color (CMYK) dan bahan Food Grade 220gr m, heat seal 100gr dan BOPP 40mic (antara BOPP dengan BOPP) di laminasi menggunakan Perekat (Adhesive 2GSM)</li>
            <li>Harga di atas belum termasuk PPN 11%, apabila diperlukan PPN akan dikenakan biaya tambahan sebesar 11% dari Harga Total</li>
            <li>Harga dapat berubah sewaktu-waktu, tergantung dari harga bahan baku yang tidak stabil</li>
            <li>Perbedaan warna pada monitor, hasil cetak proof/sample dan hasil akhir adalah hal yang wajar</li>
            <li>Laporan barang datang 3 bulan setelah barang jadi</li>
          </ol>
        </div>

        {/* Total Section */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '20px' }}>
          {/* Left: Signature */}
          <div style={{ width: '50%' }}>
            <div style={{ fontSize: '10px', marginBottom: '60px' }}>
              <strong>Hormat Kami,</strong>
            </div>
            <div style={{ borderTop: '1px solid #333', paddingTop: '4px', fontSize: '10px', maxWidth: '180px' }}>
              Sales PT. Magenta Indopack Indonesia
            </div>
          </div>

          {/* Right: Totals */}
          <div style={{ width: '280px', fontSize: '10px' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <tbody>
                <tr>
                  <td style={{ padding: '4px 0', textAlign: 'right', paddingRight: '12px' }}>Sub Total</td>
                  <td style={{ padding: '4px 0', textAlign: 'right', fontWeight: '600' }}>{formatCurrency(subtotal)}</td>
                </tr>
                {totalDiscount > 0 && (
                  <tr>
                    <td style={{ padding: '4px 0', textAlign: 'right', paddingRight: '12px' }}>Diskon</td>
                    <td style={{ padding: '4px 0', textAlign: 'right', fontWeight: '600', color: '#ef4444' }}>- {formatCurrency(totalDiscount)}</td>
                  </tr>
                )}
                <tr style={{ borderTop: '1px solid #e5e7eb' }}>
                  <td style={{ padding: '4px 0', textAlign: 'right', paddingRight: '12px' }}>Jumlah</td>
                  <td style={{ padding: '4px 0', textAlign: 'right', fontWeight: '600' }}>{formatCurrency(afterDiscount)}</td>
                </tr>
                {quotation.kenaPajak && ppnAmount > 0 && (
                  <tr>
                    <td style={{ padding: '4px 0', textAlign: 'right', paddingRight: '12px' }}>PPN 11%</td>
                    <td style={{ padding: '4px 0', textAlign: 'right', fontWeight: '600' }}>{formatCurrency(ppnAmount)}</td>
                  </tr>
                )}
                <tr style={{ borderTop: '2px solid #333', backgroundColor: '#f9fafb' }}>
                  <td style={{ padding: '8px 12px', textAlign: 'right', fontSize: '11px' }}><strong>Total Harga Bayar</strong></td>
                  <td style={{ padding: '8px 12px', textAlign: 'right', fontSize: '12px', fontWeight: 'bold', color: '#ec4899' }}>
                    {formatCurrency(grandTotal)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Additional Notes */}
        {quotation.notes && (
          <div style={{ marginTop: '20px', padding: '12px', backgroundColor: '#f9fafb', borderRadius: '4px', border: '1px solid #e5e7eb' }}>
            <div style={{ fontSize: '10px', fontWeight: '600', marginBottom: '6px' }}>Catatan Tambahan:</div>
            <div style={{ fontSize: '9px', lineHeight: '1.5', whiteSpace: 'pre-wrap' }}>{quotation.notes}</div>
          </div>
        )}
      </div>
    );
  }
);

QuotationPrint.displayName = 'QuotationPrint';
