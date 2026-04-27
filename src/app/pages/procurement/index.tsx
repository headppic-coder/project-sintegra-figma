import { PageTemplate } from "../../components/page-template";
import { StatusBadge } from "../../components/status-badge";

export function VendorRegistration() {
  return (
    <PageTemplate
      title="Pengajuan Vendor"
      breadcrumbs={[{ label: 'Dashboard', href: '/' }, { label: 'Procurement' }, { label: 'Pengajuan Vendor' }]}
      apiEndpoint="suppliers"
      fields={[
        { name: 'vendorName', label: 'Nama Vendor', required: true },
        { name: 'contactPerson', label: 'Kontak Person', required: true },
        { name: 'phone', label: 'No. Telepon', type: 'tel', required: true },
        { name: 'email', label: 'Email', type: 'email' },
        { name: 'address', label: 'Alamat', required: true },
        { name: 'businessField', label: 'Bidang Usaha' },
      ]}
      columns={[
        { key: 'vendorName', label: 'Nama Vendor' },
        { key: 'contactPerson', label: 'Kontak' },
        { key: 'phone', label: 'Telepon' },
        { key: 'businessField', label: 'Bidang Usaha' },
      ]}
    />
  );
}

export function PurchaseOrders() {
  return (
    <PageTemplate
      title="Pembelian Barang"
      breadcrumbs={[{ label: 'Dashboard', href: '/' }, { label: 'Procurement' }, { label: 'Pembelian Barang' }]}
      apiEndpoint="purchase-orders"
      fields={[
        { name: 'poNumber', label: 'No. PO', required: true },
        { name: 'supplierCode', label: 'Kode Supplier', required: true },
        { name: 'orderDate', label: 'Tanggal Order', type: 'date', required: true },
        { name: 'deliveryDate', label: 'Tanggal Pengiriman', type: 'date' },
        { name: 'totalAmount', label: 'Total', type: 'number' },
        { name: 'notes', label: 'Catatan' },
      ]}
      columns={[
        { key: 'poNumber', label: 'No. PO' },
        { key: 'supplierCode', label: 'Supplier' },
        { key: 'orderDate', label: 'Tgl Order' },
        { key: 'deliveryDate', label: 'Tgl Kirim' },
        { key: 'status', label: 'Status', render: (v: string) => <StatusBadge status={v || 'Draft'} /> },
      ]}
    />
  );
}

export function Suppliers() {
  return (
    <PageTemplate
      title="Data Supplier"
      breadcrumbs={[{ label: 'Dashboard', href: '/' }, { label: 'Procurement' }, { label: 'Data Supplier' }]}
      apiEndpoint="suppliers"
      fields={[
        { name: 'supplierCode', label: 'Kode Supplier', required: true },
        { name: 'supplierName', label: 'Nama Supplier', required: true },
        { name: 'contactPerson', label: 'Kontak Person', required: true },
        { name: 'phone', label: 'No. Telepon', type: 'tel', required: true },
        { name: 'email', label: 'Email', type: 'email' },
        { name: 'address', label: 'Alamat', required: true },
        { name: 'paymentTerm', label: 'Term Pembayaran' },
      ]}
      columns={[
        { key: 'supplierCode', label: 'Kode' },
        { key: 'supplierName', label: 'Nama Supplier' },
        { key: 'contactPerson', label: 'Kontak' },
        { key: 'phone', label: 'Telepon' },
        { key: 'status', label: 'Status', render: (v: string) => <StatusBadge status={v || 'Active'} /> },
      ]}
    />
  );
}

export function SupplierEvaluation() {
  return (
    <PageTemplate
      title="Penilaian Supplier"
      breadcrumbs={[{ label: 'Dashboard', href: '/' }, { label: 'Procurement' }, { label: 'Penilaian Supplier' }]}
      apiEndpoint="suppliers"
      fields={[
        { name: 'evaluationNumber', label: 'No. Evaluasi', required: true },
        { name: 'supplierCode', label: 'Kode Supplier', required: true },
        { name: 'evaluationDate', label: 'Tanggal Evaluasi', type: 'date' },
        { name: 'qualityScore', label: 'Nilai Kualitas', type: 'number' },
        { name: 'deliveryScore', label: 'Nilai Pengiriman', type: 'number' },
        { name: 'priceScore', label: 'Nilai Harga', type: 'number' },
        { name: 'serviceScore', label: 'Nilai Pelayanan', type: 'number' },
      ]}
      columns={[
        { key: 'evaluationNumber', label: 'No. Evaluasi' },
        { key: 'supplierCode', label: 'Supplier' },
        { key: 'evaluationDate', label: 'Tanggal' },
        { key: 'qualityScore', label: 'Nilai Kualitas' },
        { key: 'deliveryScore', label: 'Nilai Pengiriman' },
      ]}
    />
  );
}

export function PurchaseReturns() {
  return (
    <PageTemplate
      title="Retur Pembelian"
      breadcrumbs={[{ label: 'Dashboard', href: '/' }, { label: 'Procurement' }, { label: 'Retur Pembelian' }]}
      apiEndpoint="purchase-orders"
      fields={[
        { name: 'returnNumber', label: 'No. Retur', required: true },
        { name: 'poNumber', label: 'No. PO', required: true },
        { name: 'supplierCode', label: 'Kode Supplier', required: true },
        { name: 'returnDate', label: 'Tanggal Retur', type: 'date', required: true },
        { name: 'reason', label: 'Alasan Retur', required: true },
        { name: 'returnQty', label: 'Qty Retur', type: 'number' },
      ]}
      columns={[
        { key: 'returnNumber', label: 'No. Retur' },
        { key: 'poNumber', label: 'No. PO' },
        { key: 'supplierCode', label: 'Supplier' },
        { key: 'returnDate', label: 'Tanggal' },
        { key: 'returnQty', label: 'Qty' },
      ]}
    />
  );
}

export function PurchasePayments() {
  return (
    <PageTemplate
      title="Pelunasan Pembelian"
      breadcrumbs={[{ label: 'Dashboard', href: '/' }, { label: 'Procurement' }, { label: 'Pelunasan Pembelian' }]}
      apiEndpoint="purchase-orders"
      fields={[
        { name: 'paymentNumber', label: 'No. Pembayaran', required: true },
        { name: 'poNumber', label: 'No. PO', required: true },
        { name: 'supplierCode', label: 'Kode Supplier', required: true },
        { name: 'paymentDate', label: 'Tanggal Bayar', type: 'date', required: true },
        { name: 'paymentAmount', label: 'Jumlah Bayar', type: 'number', required: true },
        { name: 'paymentMethod', label: 'Metode Pembayaran' },
      ]}
      columns={[
        { key: 'paymentNumber', label: 'No. Pembayaran' },
        { key: 'poNumber', label: 'No. PO' },
        { key: 'supplierCode', label: 'Supplier' },
        { key: 'paymentDate', label: 'Tanggal' },
        { key: 'paymentAmount', label: 'Jumlah' },
      ]}
    />
  );
}

export function SupplierQuotations() {
  return (
    <PageTemplate
      title="Daftar Calon Penawaran Supplier"
      breadcrumbs={[{ label: 'Dashboard', href: '/' }, { label: 'Procurement' }, { label: 'Penawaran Supplier' }]}
      apiEndpoint="suppliers"
      fields={[
        { name: 'quotationNumber', label: 'No. Penawaran', required: true },
        { name: 'supplierCode', label: 'Kode Supplier', required: true },
        { name: 'itemName', label: 'Nama Barang', required: true },
        { name: 'quantity', label: 'Quantity', type: 'number' },
        { name: 'unitPrice', label: 'Harga Satuan', type: 'number' },
        { name: 'quotationDate', label: 'Tanggal Penawaran', type: 'date' },
        { name: 'validUntil', label: 'Berlaku Sampai', type: 'date' },
      ]}
      columns={[
        { key: 'quotationNumber', label: 'No. Penawaran' },
        { key: 'supplierCode', label: 'Supplier' },
        { key: 'itemName', label: 'Barang' },
        { key: 'quantity', label: 'Qty' },
        { key: 'unitPrice', label: 'Harga' },
      ]}
    />
  );
}
