import { PageTemplate } from "../../components/page-template";
import { StatusBadge } from "../../components/status-badge";

export function ProcessUnits() {
  return (
    <PageTemplate
      title="Unit Proses"
      breadcrumbs={[{ label: 'Dashboard', href: '/' }, { label: 'Produksi' }, { label: 'Unit Proses' }]}
      apiEndpoint="machines"
      fields={[
        { name: 'unitCode', label: 'Kode Unit', required: true },
        { name: 'unitName', label: 'Nama Unit', required: true },
        { name: 'processType', label: 'Jenis Proses', required: true },
        { name: 'capacity', label: 'Kapasitas', type: 'number' },
      ]}
      columns={[
        { key: 'unitCode', label: 'Kode' },
        { key: 'unitName', label: 'Nama Unit' },
        { key: 'processType', label: 'Jenis Proses' },
        { key: 'capacity', label: 'Kapasitas' },
      ]}
    />
  );
}

export function ShiftPlan() {
  return (
    <PageTemplate
      title="Rencana Shift dan Realisasinya"
      breadcrumbs={[{ label: 'Dashboard', href: '/' }, { label: 'Produksi' }, { label: 'Rencana Shift' }]}
      apiEndpoint="production-realizations"
      fields={[
        { name: 'shiftDate', label: 'Tanggal', type: 'date', required: true },
        { name: 'shiftNumber', label: 'Shift', required: true },
        { name: 'supervisor', label: 'Supervisor', required: true },
        { name: 'workers', label: 'Jumlah Pekerja', type: 'number' },
      ]}
      columns={[
        { key: 'shiftDate', label: 'Tanggal' },
        { key: 'shiftNumber', label: 'Shift' },
        { key: 'supervisor', label: 'Supervisor' },
        { key: 'workers', label: 'Pekerja' },
      ]}
    />
  );
}

export function ProductionRealization() {
  return (
    <PageTemplate
      title="Jadwal Produksi Realisasi"
      breadcrumbs={[{ label: 'Dashboard', href: '/' }, { label: 'Produksi' }, { label: 'Jadwal Produksi Realisasi' }]}
      apiEndpoint="production-realizations"
      fields={[
        { name: 'scheduleNumber', label: 'No. Jadwal', required: true },
        { name: 'machineId', label: 'ID Mesin', required: true },
        { name: 'actualOutput', label: 'Output Aktual', type: 'number' },
        { name: 'goodQty', label: 'Qty Baik', type: 'number' },
        { name: 'rejectQty', label: 'Qty Reject', type: 'number' },
      ]}
      columns={[
        { key: 'scheduleNumber', label: 'No. Jadwal' },
        { key: 'machineId', label: 'Mesin' },
        { key: 'actualOutput', label: 'Output' },
        { key: 'goodQty', label: 'Baik' },
        { key: 'rejectQty', label: 'Reject' },
      ]}
    />
  );
}

export function RealizationMonitoring() {
  return (
    <PageTemplate
      title="Monitoring Jadwal Produksi Realisasi"
      breadcrumbs={[{ label: 'Dashboard', href: '/' }, { label: 'Produksi' }, { label: 'Monitoring Realisasi' }]}
      apiEndpoint="production-realizations"
      fields={[
        { name: 'monitoringNumber', label: 'No. Monitoring', required: true },
        { name: 'scheduleNumber', label: 'No. Jadwal', required: true },
        { name: 'efficiency', label: 'Efisiensi (%)', type: 'number' },
        { name: 'status', label: 'Status' },
      ]}
      columns={[
        { key: 'monitoringNumber', label: 'No.' },
        { key: 'scheduleNumber', label: 'Jadwal' },
        { key: 'efficiency', label: 'Efisiensi' },
        { key: 'status', label: 'Status', render: (v: string) => <StatusBadge status={v || 'On Progress'} /> },
      ]}
    />
  );
}

export function Productivity() {
  return (
    <PageTemplate
      title="Produktivitas"
      breadcrumbs={[{ label: 'Dashboard', href: '/' }, { label: 'Produksi' }, { label: 'Produktivitas' }]}
      apiEndpoint="production-realizations"
      fields={[
        { name: 'date', label: 'Tanggal', type: 'date', required: true },
        { name: 'machineId', label: 'ID Mesin', required: true },
        { name: 'output', label: 'Output', type: 'number' },
        { name: 'target', label: 'Target', type: 'number' },
        { name: 'efficiency', label: 'Efisiensi (%)', type: 'number' },
      ]}
      columns={[
        { key: 'date', label: 'Tanggal' },
        { key: 'machineId', label: 'Mesin' },
        { key: 'output', label: 'Output' },
        { key: 'target', label: 'Target' },
        { key: 'efficiency', label: 'Efisiensi' },
      ]}
    />
  );
}

export function Downtime() {
  return (
    <PageTemplate
      title="Downtime"
      breadcrumbs={[{ label: 'Dashboard', href: '/' }, { label: 'Produksi' }, { label: 'Downtime' }]}
      apiEndpoint="machines"
      fields={[
        { name: 'downtimeNumber', label: 'No. Downtime', required: true },
        { name: 'machineId', label: 'ID Mesin', required: true },
        { name: 'reason', label: 'Alasan', required: true },
        { name: 'duration', label: 'Durasi (menit)', type: 'number' },
        { name: 'startTime', label: 'Waktu Mulai', type: 'date' },
      ]}
      columns={[
        { key: 'downtimeNumber', label: 'No.' },
        { key: 'machineId', label: 'Mesin' },
        { key: 'reason', label: 'Alasan' },
        { key: 'duration', label: 'Durasi (menit)' },
      ]}
    />
  );
}

export function ProductionRealtime() {
  return (
    <PageTemplate
      title="Produksi Real-time"
      breadcrumbs={[{ label: 'Dashboard', href: '/' }, { label: 'Produksi' }, { label: 'Produksi Real-time' }]}
      apiEndpoint="production-realizations"
      fields={[
        { name: 'machineId', label: 'ID Mesin', required: true },
        { name: 'currentOutput', label: 'Output Saat Ini', type: 'number' },
        { name: 'targetOutput', label: 'Target Output', type: 'number' },
        { name: 'speed', label: 'Kecepatan (pcs/jam)', type: 'number' },
      ]}
      columns={[
        { key: 'machineId', label: 'Mesin' },
        { key: 'currentOutput', label: 'Output' },
        { key: 'targetOutput', label: 'Target' },
        { key: 'speed', label: 'Kecepatan' },
      ]}
    />
  );
}

export function Machines() {
  return (
    <PageTemplate
      title="Mesin Produksi"
      breadcrumbs={[{ label: 'Dashboard', href: '/' }, { label: 'Produksi' }, { label: 'Mesin Produksi' }]}
      apiEndpoint="machines"
      fields={[
        { name: 'machineId', label: 'ID Mesin', required: true },
        { name: 'machineName', label: 'Nama Mesin', required: true },
        { name: 'machineType', label: 'Jenis Mesin', required: true },
        { name: 'capacity', label: 'Kapasitas (pcs/jam)', type: 'number' },
        { name: 'manufacturer', label: 'Produsen' },
        { name: 'yearInstalled', label: 'Tahun Instalasi', type: 'number' },
      ]}
      columns={[
        { key: 'machineId', label: 'ID Mesin' },
        { key: 'machineName', label: 'Nama Mesin' },
        { key: 'machineType', label: 'Jenis' },
        { key: 'capacity', label: 'Kapasitas' },
        { key: 'status', label: 'Status', render: (v: string) => <StatusBadge status={v || 'Active'} /> },
      ]}
    />
  );
}

export function MachineMaintenance() {
  return (
    <PageTemplate
      title="Maintenance Mesin Produksi"
      breadcrumbs={[{ label: 'Dashboard', href: '/' }, { label: 'Produksi' }, { label: 'Maintenance Mesin' }]}
      apiEndpoint="machines"
      fields={[
        { name: 'maintenanceNumber', label: 'No. Maintenance', required: true },
        { name: 'machineId', label: 'ID Mesin', required: true },
        { name: 'maintenanceType', label: 'Jenis Maintenance', required: true },
        { name: 'scheduledDate', label: 'Tanggal Jadwal', type: 'date' },
        { name: 'technician', label: 'Teknisi' },
        { name: 'notes', label: 'Catatan' },
      ]}
      columns={[
        { key: 'maintenanceNumber', label: 'No.' },
        { key: 'machineId', label: 'Mesin' },
        { key: 'maintenanceType', label: 'Jenis' },
        { key: 'scheduledDate', label: 'Tanggal' },
        { key: 'technician', label: 'Teknisi' },
      ]}
    />
  );
}

export function OvertimeRequest() {
  return (
    <PageTemplate
      title="Pengajuan Lembur Produksi"
      breadcrumbs={[{ label: 'Dashboard', href: '/' }, { label: 'Produksi' }, { label: 'Pengajuan Lembur' }]}
      apiEndpoint="production-realizations"
      fields={[
        { name: 'requestNumber', label: 'No. Pengajuan', required: true },
        { name: 'requestedBy', label: 'Diajukan Oleh', required: true },
        { name: 'overtimeDate', label: 'Tanggal Lembur', type: 'date', required: true },
        { name: 'duration', label: 'Durasi (jam)', type: 'number', required: true },
        { name: 'reason', label: 'Alasan', required: true },
        { name: 'target', label: 'Target Output', type: 'number' },
      ]}
      columns={[
        { key: 'requestNumber', label: 'No. Pengajuan' },
        { key: 'requestedBy', label: 'Pengaju' },
        { key: 'overtimeDate', label: 'Tanggal' },
        { key: 'duration', label: 'Durasi (jam)' },
        { key: 'target', label: 'Target' },
      ]}
    />
  );
}

export function QCProcess() {
  return (
    <PageTemplate
      title="Quality Control Proses"
      breadcrumbs={[{ label: 'Dashboard', href: '/' }, { label: 'Produksi' }, { label: 'QC Proses' }]}
      apiEndpoint="production-realizations"
      fields={[
        { name: 'qcNumber', label: 'No. QC', required: true },
        { name: 'processStage', label: 'Tahap Proses', required: true },
        { name: 'inspector', label: 'Pemeriksa', required: true },
        { name: 'checkedQty', label: 'Qty Diperiksa', type: 'number' },
        { name: 'passQty', label: 'Qty Lulus', type: 'number' },
        { name: 'rejectQty', label: 'Qty Reject', type: 'number' },
      ]}
      columns={[
        { key: 'qcNumber', label: 'No. QC' },
        { key: 'processStage', label: 'Tahap' },
        { key: 'inspector', label: 'Pemeriksa' },
        { key: 'checkedQty', label: 'Diperiksa' },
        { key: 'passQty', label: 'Lulus' },
        { key: 'rejectQty', label: 'Reject' },
      ]}
    />
  );
}

export function QCIncoming() {
  return (
    <PageTemplate
      title="Quality Control Barang Datang"
      breadcrumbs={[{ label: 'Dashboard', href: '/' }, { label: 'Produksi' }, { label: 'QC Barang Datang' }]}
      apiEndpoint="production-realizations"
      fields={[
        { name: 'qcNumber', label: 'No. QC', required: true },
        { name: 'poNumber', label: 'No. PO', required: true },
        { name: 'materialName', label: 'Nama Material', required: true },
        { name: 'receivedQty', label: 'Qty Diterima', type: 'number' },
        { name: 'acceptedQty', label: 'Qty Diterima', type: 'number' },
        { name: 'rejectedQty', label: 'Qty Ditolak', type: 'number' },
      ]}
      columns={[
        { key: 'qcNumber', label: 'No. QC' },
        { key: 'poNumber', label: 'No. PO' },
        { key: 'materialName', label: 'Material' },
        { key: 'receivedQty', label: 'Diterima' },
        { key: 'acceptedQty', label: 'Diterima' },
        { key: 'rejectedQty', label: 'Ditolak' },
      ]}
    />
  );
}

export function QCOutgoing() {
  return (
    <PageTemplate
      title="Quality Control Barang Keluar"
      breadcrumbs={[{ label: 'Dashboard', href: '/' }, { label: 'Produksi' }, { label: 'QC Barang Keluar' }]}
      apiEndpoint="production-realizations"
      fields={[
        { name: 'qcNumber', label: 'No. QC', required: true },
        { name: 'deliveryNumber', label: 'No. Surat Jalan', required: true },
        { name: 'productName', label: 'Nama Produk', required: true },
        { name: 'inspectedQty', label: 'Qty Diperiksa', type: 'number' },
        { name: 'passedQty', label: 'Qty Lulus', type: 'number' },
      ]}
      columns={[
        { key: 'qcNumber', label: 'No. QC' },
        { key: 'deliveryNumber', label: 'No. Surat Jalan' },
        { key: 'productName', label: 'Produk' },
        { key: 'inspectedQty', label: 'Diperiksa' },
        { key: 'passedQty', label: 'Lulus' },
      ]}
    />
  );
}
