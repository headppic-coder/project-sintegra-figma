import { PageTemplate } from "../../components/page-template";
import { StatusBadge } from "../../components/status-badge";

export function DesignRequests() {
  return (
    <PageTemplate
      title="Permintaan Desain"
      breadcrumbs={[{ label: 'Dashboard', href: '/' }, { label: 'Design' }, { label: 'Permintaan Desain' }]}
      apiEndpoint="design-requests"
      fields={[
        { name: 'requestNumber', label: 'No. Permintaan', required: true },
        { name: 'customerName', label: 'Customer', required: true },
        { name: 'productName', label: 'Nama Produk', required: true },
        { name: 'designType', label: 'Jenis Desain', required: true },
        { name: 'deadline', label: 'Deadline', type: 'date', required: true },
        { name: 'description', label: 'Deskripsi' },
      ]}
      columns={[
        { key: 'requestNumber', label: 'No. Permintaan' },
        { key: 'customerName', label: 'Customer' },
        { key: 'productName', label: 'Produk' },
        { key: 'designType', label: 'Jenis' },
        { key: 'status', label: 'Status', render: (v: string) => <StatusBadge status={v || 'On Progress'} /> },
        { key: 'deadline', label: 'Deadline' },
      ]}
    />
  );
}

export function DesignProcess() {
  return (
    <PageTemplate
      title="Proses Desain"
      breadcrumbs={[{ label: 'Dashboard', href: '/' }, { label: 'Design' }, { label: 'Proses Desain' }]}
      apiEndpoint="design-requests"
      fields={[
        { name: 'designNumber', label: 'No. Desain', required: true },
        { name: 'designerName', label: 'Nama Designer', required: true },
        { name: 'revisionNumber', label: 'Revisi Ke', type: 'number' },
        { name: 'notes', label: 'Catatan' },
      ]}
      columns={[
        { key: 'designNumber', label: 'No. Desain' },
        { key: 'designerName', label: 'Designer' },
        { key: 'revisionNumber', label: 'Revisi' },
        { key: 'status', label: 'Status', render: (v: string) => <StatusBadge status={v || 'On Progress'} /> },
      ]}
    />
  );
}

export function DesignLibrary() {
  return (
    <PageTemplate
      title="Perpustakaan Desain"
      breadcrumbs={[{ label: 'Dashboard', href: '/' }, { label: 'Design' }, { label: 'Perpustakaan Desain' }]}
      apiEndpoint="design-requests"
      fields={[
        { name: 'designCode', label: 'Kode Desain', required: true },
        { name: 'designName', label: 'Nama Desain', required: true },
        { name: 'category', label: 'Kategori' },
        { name: 'customerName', label: 'Customer' },
      ]}
      columns={[
        { key: 'designCode', label: 'Kode' },
        { key: 'designName', label: 'Nama Desain' },
        { key: 'category', label: 'Kategori' },
        { key: 'customerName', label: 'Customer' },
      ]}
    />
  );
}

export function DesignLayout() {
  return (
    <PageTemplate
      title="Layout Desain"
      breadcrumbs={[{ label: 'Dashboard', href: '/' }, { label: 'Design' }, { label: 'Layout Desain' }]}
      apiEndpoint="design-requests"
      fields={[
        { name: 'layoutNumber', label: 'No. Layout', required: true },
        { name: 'designCode', label: 'Kode Desain', required: true },
        { name: 'dimensions', label: 'Dimensi', required: true },
        { name: 'colorCount', label: 'Jumlah Warna', type: 'number' },
      ]}
      columns={[
        { key: 'layoutNumber', label: 'No. Layout' },
        { key: 'designCode', label: 'Kode Desain' },
        { key: 'dimensions', label: 'Dimensi' },
        { key: 'colorCount', label: 'Warna' },
      ]}
    />
  );
}

export function LayoutJoblist() {
  return (
    <PageTemplate
      title="Joblist Layout Desain"
      breadcrumbs={[{ label: 'Dashboard', href: '/' }, { label: 'Design' }, { label: 'Joblist Layout' }]}
      apiEndpoint="design-requests"
      fields={[
        { name: 'jobNumber', label: 'No. Job', required: true },
        { name: 'orderNumber', label: 'No. Pesanan', required: true },
        { name: 'assignedTo', label: 'Ditugaskan Ke', required: true },
        { name: 'deadline', label: 'Deadline', type: 'date' },
      ]}
      columns={[
        { key: 'jobNumber', label: 'No. Job' },
        { key: 'orderNumber', label: 'No. Pesanan' },
        { key: 'assignedTo', label: 'Petugas' },
        { key: 'deadline', label: 'Deadline' },
      ]}
    />
  );
}

export function CylinderRegistry() {
  return (
    <PageTemplate
      title="Cylinder Registry"
      breadcrumbs={[{ label: 'Dashboard', href: '/' }, { label: 'Design' }, { label: 'Cylinder Registry' }]}
      apiEndpoint="design-requests"
      fields={[
        { name: 'cylinderNumber', label: 'No. Cylinder', required: true },
        { name: 'designCode', label: 'Kode Desain', required: true },
        { name: 'diameter', label: 'Diameter (mm)', type: 'number' },
        { name: 'width', label: 'Lebar (mm)', type: 'number' },
        { name: 'condition', label: 'Kondisi' },
      ]}
      columns={[
        { key: 'cylinderNumber', label: 'No. Cylinder' },
        { key: 'designCode', label: 'Kode Desain' },
        { key: 'diameter', label: 'Diameter' },
        { key: 'width', label: 'Lebar' },
        { key: 'condition', label: 'Kondisi' },
      ]}
    />
  );
}

export function PlateRegistry() {
  return (
    <PageTemplate
      title="Plat Registry"
      breadcrumbs={[{ label: 'Dashboard', href: '/' }, { label: 'Design' }, { label: 'Plat Registry' }]}
      apiEndpoint="design-requests"
      fields={[
        { name: 'plateNumber', label: 'No. Plat', required: true },
        { name: 'designCode', label: 'Kode Desain', required: true },
        { name: 'size', label: 'Ukuran', required: true },
        { name: 'thickness', label: 'Ketebalan (mm)', type: 'number' },
      ]}
      columns={[
        { key: 'plateNumber', label: 'No. Plat' },
        { key: 'designCode', label: 'Kode Desain' },
        { key: 'size', label: 'Ukuran' },
        { key: 'thickness', label: 'Ketebalan' },
      ]}
    />
  );
}

export function ArtworkSpecification() {
  return (
    <PageTemplate
      title="Artwork Spesifikasi"
      breadcrumbs={[{ label: 'Dashboard', href: '/' }, { label: 'Design' }, { label: 'Artwork Spesifikasi' }]}
      apiEndpoint="design-requests"
      fields={[
        { name: 'artworkCode', label: 'Kode Artwork', required: true },
        { name: 'colorProfile', label: 'Color Profile', required: true },
        { name: 'resolution', label: 'Resolusi (DPI)', type: 'number' },
        { name: 'fileFormat', label: 'Format File' },
      ]}
      columns={[
        { key: 'artworkCode', label: 'Kode' },
        { key: 'colorProfile', label: 'Color Profile' },
        { key: 'resolution', label: 'Resolusi' },
        { key: 'fileFormat', label: 'Format' },
      ]}
    />
  );
}

export function PrepressChecklist() {
  return (
    <PageTemplate
      title="Prepress Checklist"
      breadcrumbs={[{ label: 'Dashboard', href: '/' }, { label: 'Design' }, { label: 'Prepress Checklist' }]}
      apiEndpoint="design-requests"
      fields={[
        { name: 'checklistNumber', label: 'No. Checklist', required: true },
        { name: 'designCode', label: 'Kode Desain', required: true },
        { name: 'inspector', label: 'Pemeriksa', required: true },
        { name: 'checkDate', label: 'Tanggal Pemeriksaan', type: 'date' },
      ]}
      columns={[
        { key: 'checklistNumber', label: 'No. Checklist' },
        { key: 'designCode', label: 'Kode Desain' },
        { key: 'inspector', label: 'Pemeriksa' },
        { key: 'checkDate', label: 'Tanggal' },
      ]}
    />
  );
}
