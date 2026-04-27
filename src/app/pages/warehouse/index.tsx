import { PageTemplate } from "../../components/page-template";
import { StatusBadge } from "../../components/status-badge";

export function ItemRequests() {
  return (
    <PageTemplate
      title="Pengajuan Barang"
      breadcrumbs={[{ label: 'Dashboard', href: '/' }, { label: 'Gudang' }, { label: 'Pengajuan Barang' }]}
      apiEndpoint="items"
      fields={[
        { name: 'requestNumber', label: 'No. Pengajuan', required: true },
        { name: 'requestedBy', label: 'Pengaju', required: true },
        { name: 'itemCode', label: 'Kode Barang', required: true },
        { name: 'quantity', label: 'Quantity', type: 'number', required: true },
        { name: 'requestDate', label: 'Tanggal', type: 'date' },
        { name: 'purpose', label: 'Keperluan' },
      ]}
      columns={[
        { key: 'requestNumber', label: 'No. Pengajuan' },
        { key: 'requestedBy', label: 'Pengaju' },
        { key: 'itemCode', label: 'Kode Barang' },
        { key: 'quantity', label: 'Qty' },
        { key: 'requestDate', label: 'Tanggal' },
      ]}
    />
  );
}

export function ItemReceipts() {
  return (
    <PageTemplate
      title="Penerimaan Barang"
      breadcrumbs={[{ label: 'Dashboard', href: '/' }, { label: 'Gudang' }, { label: 'Penerimaan Barang' }]}
      apiEndpoint="items"
      fields={[
        { name: 'receiptNumber', label: 'No. Penerimaan', required: true },
        { name: 'poNumber', label: 'No. PO', required: true },
        { name: 'supplierName', label: 'Nama Supplier', required: true },
        { name: 'receiptDate', label: 'Tanggal Terima', type: 'date' },
        { name: 'receivedBy', label: 'Diterima Oleh' },
      ]}
      columns={[
        { key: 'receiptNumber', label: 'No. Penerimaan' },
        { key: 'poNumber', label: 'No. PO' },
        { key: 'supplierName', label: 'Supplier' },
        { key: 'receiptDate', label: 'Tanggal' },
      ]}
    />
  );
}

export function MaterialPreparation() {
  return (
    <PageTemplate
      title="Persiapan Bahan Baku"
      breadcrumbs={[{ label: 'Dashboard', href: '/' }, { label: 'Gudang' }, { label: 'Persiapan Bahan Baku' }]}
      apiEndpoint="stock-movements"
      fields={[
        { name: 'preparationNumber', label: 'No. Persiapan', required: true },
        { name: 'productionPlanNumber', label: 'No. Rencana Produksi', required: true },
        { name: 'materialCode', label: 'Kode Material', required: true },
        { name: 'quantity', label: 'Quantity', type: 'number', required: true },
        { name: 'preparedBy', label: 'Disiapkan Oleh' },
      ]}
      columns={[
        { key: 'preparationNumber', label: 'No. Persiapan' },
        { key: 'productionPlanNumber', label: 'No. Rencana' },
        { key: 'materialCode', label: 'Material' },
        { key: 'quantity', label: 'Qty' },
      ]}
    />
  );
}

export function ProductionOutgoing() {
  return (
    <PageTemplate
      title="Barang Keluar Produksi"
      breadcrumbs={[{ label: 'Dashboard', href: '/' }, { label: 'Gudang' }, { label: 'Barang Keluar Produksi' }]}
      apiEndpoint="stock-movements"
      fields={[
        { name: 'outgoingNumber', label: 'No. Barang Keluar', required: true },
        { name: 'productionPlanNumber', label: 'No. Rencana Produksi', required: true },
        { name: 'itemCode', label: 'Kode Barang', required: true },
        { name: 'quantity', label: 'Quantity', type: 'number', required: true },
        { name: 'outgoingDate', label: 'Tanggal Keluar', type: 'date' },
      ]}
      columns={[
        { key: 'outgoingNumber', label: 'No.' },
        { key: 'productionPlanNumber', label: 'No. Rencana' },
        { key: 'itemCode', label: 'Barang' },
        { key: 'quantity', label: 'Qty' },
      ]}
    />
  );
}

export function ProductionIncoming() {
  return (
    <PageTemplate
      title="Barang Masuk Produksi"
      breadcrumbs={[{ label: 'Dashboard', href: '/' }, { label: 'Gudang' }, { label: 'Barang Masuk Produksi' }]}
      apiEndpoint="stock-movements"
      fields={[
        { name: 'incomingNumber', label: 'No. Barang Masuk', required: true },
        { name: 'productionNumber', label: 'No. Produksi', required: true },
        { name: 'itemCode', label: 'Kode Barang', required: true },
        { name: 'quantity', label: 'Quantity', type: 'number', required: true },
        { name: 'incomingDate', label: 'Tanggal Masuk', type: 'date' },
      ]}
      columns={[
        { key: 'incomingNumber', label: 'No.' },
        { key: 'productionNumber', label: 'No. Produksi' },
        { key: 'itemCode', label: 'Barang' },
        { key: 'quantity', label: 'Qty' },
      ]}
    />
  );
}

export function Items() {
  return (
    <PageTemplate
      title="Daftar Barang"
      breadcrumbs={[{ label: 'Dashboard', href: '/' }, { label: 'Gudang' }, { label: 'Daftar Barang' }]}
      apiEndpoint="items"
      fields={[
        { name: 'itemCode', label: 'Kode Barang', required: true },
        { name: 'itemName', label: 'Nama Barang', required: true },
        { name: 'category', label: 'Kategori', required: true },
        { name: 'unit', label: 'Satuan', required: true },
        { name: 'minStock', label: 'Stock Minimum', type: 'number' },
        { name: 'maxStock', label: 'Stock Maximum', type: 'number' },
      ]}
      columns={[
        { key: 'itemCode', label: 'Kode' },
        { key: 'itemName', label: 'Nama Barang' },
        { key: 'category', label: 'Kategori' },
        { key: 'unit', label: 'Satuan' },
        { key: 'minStock', label: 'Min Stock' },
      ]}
    />
  );
}

export function ItemCategories() {
  return (
    <PageTemplate
      title="Kategori Barang"
      breadcrumbs={[{ label: 'Dashboard', href: '/' }, { label: 'Gudang' }, { label: 'Kategori Barang' }]}
      apiEndpoint="items"
      fields={[
        { name: 'categoryCode', label: 'Kode Kategori', required: true },
        { name: 'categoryName', label: 'Nama Kategori', required: true },
        { name: 'description', label: 'Deskripsi' },
      ]}
      columns={[
        { key: 'categoryCode', label: 'Kode' },
        { key: 'categoryName', label: 'Nama Kategori' },
        { key: 'description', label: 'Deskripsi' },
      ]}
    />
  );
}

export function ItemTypes() {
  return (
    <PageTemplate
      title="Tipe Barang"
      breadcrumbs={[{ label: 'Dashboard', href: '/' }, { label: 'Gudang' }, { label: 'Tipe Barang' }]}
      apiEndpoint="items"
      fields={[
        { name: 'typeCode', label: 'Kode Tipe', required: true },
        { name: 'typeName', label: 'Nama Tipe', required: true },
        { name: 'description', label: 'Deskripsi' },
      ]}
      columns={[
        { key: 'typeCode', label: 'Kode' },
        { key: 'typeName', label: 'Nama Tipe' },
        { key: 'description', label: 'Deskripsi' },
      ]}
    />
  );
}

export function Warehouses() {
  return (
    <PageTemplate
      title="Gudang"
      breadcrumbs={[{ label: 'Dashboard', href: '/' }, { label: 'Gudang' }, { label: 'Gudang' }]}
      apiEndpoint="items"
      fields={[
        { name: 'warehouseCode', label: 'Kode Gudang', required: true },
        { name: 'warehouseName', label: 'Nama Gudang', required: true },
        { name: 'location', label: 'Lokasi', required: true },
        { name: 'capacity', label: 'Kapasitas', type: 'number' },
        { name: 'inCharge', label: 'Penanggung Jawab' },
      ]}
      columns={[
        { key: 'warehouseCode', label: 'Kode' },
        { key: 'warehouseName', label: 'Nama Gudang' },
        { key: 'location', label: 'Lokasi' },
        { key: 'capacity', label: 'Kapasitas' },
      ]}
    />
  );
}

export function StockCard() {
  return (
    <PageTemplate
      title="Kartu Stock"
      breadcrumbs={[{ label: 'Dashboard', href: '/' }, { label: 'Gudang' }, { label: 'Kartu Stock' }]}
      apiEndpoint="stock-movements"
      fields={[
        { name: 'itemCode', label: 'Kode Barang', required: true },
        { name: 'warehouseCode', label: 'Kode Gudang', required: true },
        { name: 'currentStock', label: 'Stock Saat Ini', type: 'number' },
        { name: 'unit', label: 'Satuan' },
      ]}
      columns={[
        { key: 'itemCode', label: 'Kode Barang' },
        { key: 'warehouseCode', label: 'Gudang' },
        { key: 'currentStock', label: 'Stock' },
        { key: 'unit', label: 'Satuan' },
      ]}
    />
  );
}

export function StockMovements() {
  return (
    <PageTemplate
      title="Mutasi Stock"
      breadcrumbs={[{ label: 'Dashboard', href: '/' }, { label: 'Gudang' }, { label: 'Mutasi Stock' }]}
      apiEndpoint="stock-movements"
      fields={[
        { name: 'movementNumber', label: 'No. Mutasi', required: true },
        { name: 'itemCode', label: 'Kode Barang', required: true },
        { name: 'movementType', label: 'Jenis Mutasi', required: true },
        { name: 'quantity', label: 'Quantity', type: 'number', required: true },
        { name: 'movementDate', label: 'Tanggal', type: 'date' },
      ]}
      columns={[
        { key: 'movementNumber', label: 'No. Mutasi' },
        { key: 'itemCode', label: 'Barang' },
        { key: 'movementType', label: 'Jenis' },
        { key: 'quantity', label: 'Qty' },
        { key: 'movementDate', label: 'Tanggal' },
      ]}
    />
  );
}

export function StockAdjustment() {
  return (
    <PageTemplate
      title="Penyesuaian Stock"
      breadcrumbs={[{ label: 'Dashboard', href: '/' }, { label: 'Gudang' }, { label: 'Penyesuaian Stock' }]}
      apiEndpoint="stock-movements"
      fields={[
        { name: 'adjustmentNumber', label: 'No. Penyesuaian', required: true },
        { name: 'itemCode', label: 'Kode Barang', required: true },
        { name: 'systemStock', label: 'Stock Sistem', type: 'number' },
        { name: 'actualStock', label: 'Stock Aktual', type: 'number' },
        { name: 'difference', label: 'Selisih', type: 'number' },
        { name: 'reason', label: 'Alasan' },
      ]}
      columns={[
        { key: 'adjustmentNumber', label: 'No.' },
        { key: 'itemCode', label: 'Barang' },
        { key: 'systemStock', label: 'Stock Sistem' },
        { key: 'actualStock', label: 'Stock Aktual' },
        { key: 'difference', label: 'Selisih' },
      ]}
    />
  );
}

export function ToolRegistry() {
  return (
    <PageTemplate
      title="Alat Bantu Registry"
      breadcrumbs={[{ label: 'Dashboard', href: '/' }, { label: 'Gudang' }, { label: 'Alat Bantu Registry' }]}
      apiEndpoint="items"
      fields={[
        { name: 'toolCode', label: 'Kode Alat', required: true },
        { name: 'toolName', label: 'Nama Alat', required: true },
        { name: 'category', label: 'Kategori' },
        { name: 'condition', label: 'Kondisi' },
        { name: 'location', label: 'Lokasi' },
      ]}
      columns={[
        { key: 'toolCode', label: 'Kode' },
        { key: 'toolName', label: 'Nama Alat' },
        { key: 'category', label: 'Kategori' },
        { key: 'condition', label: 'Kondisi' },
      ]}
    />
  );
}

export function MinMaxStock() {
  return (
    <PageTemplate
      title="Min-Max Stock Barang"
      breadcrumbs={[{ label: 'Dashboard', href: '/' }, { label: 'Gudang' }, { label: 'Min-Max Stock' }]}
      apiEndpoint="items"
      fields={[
        { name: 'itemCode', label: 'Kode Barang', required: true },
        { name: 'minStock', label: 'Stock Minimum', type: 'number', required: true },
        { name: 'maxStock', label: 'Stock Maximum', type: 'number', required: true },
        { name: 'reorderPoint', label: 'Titik Reorder', type: 'number' },
      ]}
      columns={[
        { key: 'itemCode', label: 'Kode Barang' },
        { key: 'minStock', label: 'Min Stock' },
        { key: 'maxStock', label: 'Max Stock' },
        { key: 'reorderPoint', label: 'Reorder Point' },
      ]}
    />
  );
}

export function StockReport() {
  return (
    <PageTemplate
      title="Laporan Stock Barang"
      breadcrumbs={[{ label: 'Dashboard', href: '/' }, { label: 'Gudang' }, { label: 'Laporan Stock' }]}
      apiEndpoint="items"
      fields={[
        { name: 'reportDate', label: 'Tanggal Laporan', type: 'date', required: true },
        { name: 'itemCode', label: 'Kode Barang', required: true },
        { name: 'openingStock', label: 'Stock Awal', type: 'number' },
        { name: 'incomingStock', label: 'Stock Masuk', type: 'number' },
        { name: 'outgoingStock', label: 'Stock Keluar', type: 'number' },
        { name: 'closingStock', label: 'Stock Akhir', type: 'number' },
      ]}
      columns={[
        { key: 'reportDate', label: 'Tanggal' },
        { key: 'itemCode', label: 'Barang' },
        { key: 'openingStock', label: 'Awal' },
        { key: 'incomingStock', label: 'Masuk' },
        { key: 'outgoingStock', label: 'Keluar' },
        { key: 'closingStock', label: 'Akhir' },
      ]}
    />
  );
}
