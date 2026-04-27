import { PageTemplate } from "../../components/page-template";
import { StatusBadge } from "../../components/status-badge";

export function ProcessStages() {
  return (
    <PageTemplate
      title="Tahapan Proses"
      breadcrumbs={[{ label: 'Dashboard', href: '/' }, { label: 'PPIC' }, { label: 'Tahapan Proses' }]}
      apiEndpoint="production-plans"
      fields={[
        { name: 'stageName', label: 'Nama Tahapan', required: true },
        { name: 'stageCode', label: 'Kode Tahapan', required: true },
        { name: 'sequence', label: 'Urutan', type: 'number' },
        { name: 'estimatedDuration', label: 'Durasi Estimasi (jam)', type: 'number' },
      ]}
      columns={[
        { key: 'stageCode', label: 'Kode' },
        { key: 'stageName', label: 'Nama Tahapan' },
        { key: 'sequence', label: 'Urutan' },
        { key: 'estimatedDuration', label: 'Durasi (jam)' },
      ]}
    />
  );
}

export function ProductionPlans() {
  return (
    <PageTemplate
      title="Rencana Produksi"
      breadcrumbs={[{ label: 'Dashboard', href: '/' }, { label: 'PPIC' }, { label: 'Rencana Produksi' }]}
      apiEndpoint="production-plans"
      fields={[
        { name: 'planNumber', label: 'No. Rencana', required: true },
        { name: 'orderNumber', label: 'No. Pesanan', required: true },
        { name: 'productName', label: 'Nama Produk', required: true },
        { name: 'quantity', label: 'Quantity', type: 'number', required: true },
        { name: 'startDate', label: 'Tanggal Mulai', type: 'date' },
        { name: 'endDate', label: 'Tanggal Selesai', type: 'date' },
      ]}
      columns={[
        { key: 'planNumber', label: 'No. Rencana' },
        { key: 'orderNumber', label: 'No. Pesanan' },
        { key: 'productName', label: 'Produk' },
        { key: 'quantity', label: 'Qty' },
        { key: 'status', label: 'Status', render: (v: string) => <StatusBadge status={v || 'Planned'} /> },
      ]}
    />
  );
}

export function ProductionSchedule() {
  return (
    <PageTemplate
      title="Rencana Jadwal Produksi"
      breadcrumbs={[{ label: 'Dashboard', href: '/' }, { label: 'PPIC' }, { label: 'Rencana Jadwal Produksi' }]}
      apiEndpoint="production-plans"
      fields={[
        { name: 'scheduleNumber', label: 'No. Jadwal', required: true },
        { name: 'planNumber', label: 'No. Rencana', required: true },
        { name: 'machineId', label: 'ID Mesin', required: true },
        { name: 'shift', label: 'Shift', required: true },
        { name: 'scheduledDate', label: 'Tanggal Jadwal', type: 'date' },
      ]}
      columns={[
        { key: 'scheduleNumber', label: 'No. Jadwal' },
        { key: 'planNumber', label: 'No. Rencana' },
        { key: 'machineId', label: 'Mesin' },
        { key: 'shift', label: 'Shift' },
        { key: 'scheduledDate', label: 'Tanggal' },
      ]}
    />
  );
}

export function PlanningCapacity() {
  return (
    <PageTemplate
      title="Kapasitas Perencanaan Produksi"
      breadcrumbs={[{ label: 'Dashboard', href: '/' }, { label: 'PPIC' }, { label: 'Kapasitas Perencanaan' }]}
      apiEndpoint="production-plans"
      fields={[
        { name: 'machineId', label: 'ID Mesin', required: true },
        { name: 'capacity', label: 'Kapasitas (pcs/jam)', type: 'number', required: true },
        { name: 'utilization', label: 'Utilisasi (%)', type: 'number' },
        { name: 'month', label: 'Bulan' },
      ]}
      columns={[
        { key: 'machineId', label: 'Mesin' },
        { key: 'capacity', label: 'Kapasitas' },
        { key: 'utilization', label: 'Utilisasi' },
        { key: 'month', label: 'Bulan' },
      ]}
    />
  );
}

export function ScheduleMonitoring() {
  return (
    <PageTemplate
      title="Monitoring Jadwal Produksi"
      breadcrumbs={[{ label: 'Dashboard', href: '/' }, { label: 'PPIC' }, { label: 'Monitoring Jadwal' }]}
      apiEndpoint="production-plans"
      fields={[
        { name: 'scheduleNumber', label: 'No. Jadwal', required: true },
        { name: 'actualStart', label: 'Mulai Aktual', type: 'date' },
        { name: 'actualEnd', label: 'Selesai Aktual', type: 'date' },
        { name: 'progress', label: 'Progress (%)', type: 'number' },
      ]}
      columns={[
        { key: 'scheduleNumber', label: 'No. Jadwal' },
        { key: 'actualStart', label: 'Mulai' },
        { key: 'actualEnd', label: 'Selesai' },
        { key: 'progress', label: 'Progress' },
      ]}
    />
  );
}

export function MaterialMonitoring() {
  return (
    <PageTemplate
      title="Monitoring Material Produksi"
      breadcrumbs={[{ label: 'Dashboard', href: '/' }, { label: 'PPIC' }, { label: 'Monitoring Material' }]}
      apiEndpoint="production-plans"
      fields={[
        { name: 'planNumber', label: 'No. Rencana', required: true },
        { name: 'materialCode', label: 'Kode Material', required: true },
        { name: 'requiredQty', label: 'Qty Dibutuhkan', type: 'number' },
        { name: 'availableQty', label: 'Qty Tersedia', type: 'number' },
      ]}
      columns={[
        { key: 'planNumber', label: 'No. Rencana' },
        { key: 'materialCode', label: 'Material' },
        { key: 'requiredQty', label: 'Dibutuhkan' },
        { key: 'availableQty', label: 'Tersedia' },
      ]}
    />
  );
}

export function MaterialUsageMonitoring() {
  return (
    <PageTemplate
      title="Monitoring Pemakaian Material Produksi"
      breadcrumbs={[{ label: 'Dashboard', href: '/' }, { label: 'PPIC' }, { label: 'Monitoring Pemakaian Material' }]}
      apiEndpoint="production-plans"
      fields={[
        { name: 'usageNumber', label: 'No. Pemakaian', required: true },
        { name: 'materialCode', label: 'Kode Material', required: true },
        { name: 'usedQty', label: 'Qty Dipakai', type: 'number' },
        { name: 'wasteQty', label: 'Qty Waste', type: 'number' },
      ]}
      columns={[
        { key: 'usageNumber', label: 'No. Pemakaian' },
        { key: 'materialCode', label: 'Material' },
        { key: 'usedQty', label: 'Dipakai' },
        { key: 'wasteQty', label: 'Waste' },
      ]}
    />
  );
}

export function ProductionCompletion() {
  return (
    <PageTemplate
      title="Penyelesaian Produksi"
      breadcrumbs={[{ label: 'Dashboard', href: '/' }, { label: 'PPIC' }, { label: 'Penyelesaian Produksi' }]}
      apiEndpoint="production-plans"
      fields={[
        { name: 'completionNumber', label: 'No. Penyelesaian', required: true },
        { name: 'planNumber', label: 'No. Rencana', required: true },
        { name: 'completedQty', label: 'Qty Selesai', type: 'number', required: true },
        { name: 'completionDate', label: 'Tanggal Selesai', type: 'date' },
      ]}
      columns={[
        { key: 'completionNumber', label: 'No. Penyelesaian' },
        { key: 'planNumber', label: 'No. Rencana' },
        { key: 'completedQty', label: 'Qty Selesai' },
        { key: 'completionDate', label: 'Tanggal' },
      ]}
    />
  );
}

export function CompletionList() {
  return (
    <PageTemplate
      title="Daftar Penyelesaian Produksi"
      breadcrumbs={[{ label: 'Dashboard', href: '/' }, { label: 'PPIC' }, { label: 'Daftar Penyelesaian' }]}
      apiEndpoint="production-plans"
      fields={[
        { name: 'completionNumber', label: 'No. Penyelesaian', required: true },
        { name: 'productName', label: 'Nama Produk', required: true },
        { name: 'completedQty', label: 'Qty', type: 'number' },
      ]}
      columns={[
        { key: 'completionNumber', label: 'No.' },
        { key: 'productName', label: 'Produk' },
        { key: 'completedQty', label: 'Qty' },
      ]}
    />
  );
}
