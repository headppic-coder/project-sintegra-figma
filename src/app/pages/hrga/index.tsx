import { PageTemplate } from "../../components/page-template";
import { StatusBadge } from "../../components/status-badge";

// Export new master pages
export { Employees } from './employees';
export { MasterCompanies } from './master-companies';
export { MasterDepartments } from './master-departments';
export { MasterPositions } from './master-positions';
export { OrganizationStructure } from './organization-structure';

export function Divisions() {
  return (
    <PageTemplate
      title="Divisi"
      breadcrumbs={[{ label: 'Dashboard', href: '/' }, { label: 'HRGA' }, { label: 'Divisi' }]}
      apiEndpoint="divisions"
      fields={[
        { name: 'divisionCode', label: 'Kode Divisi', required: true },
        { name: 'divisionName', label: 'Nama Divisi', required: true },
        { name: 'head', label: 'Kepala Divisi' },
        { name: 'description', label: 'Deskripsi' },
      ]}
      columns={[
        { key: 'divisionCode', label: 'Kode' },
        { key: 'divisionName', label: 'Nama Divisi' },
        { key: 'head', label: 'Kepala Divisi' },
      ]}
    />
  );
}

export function SubDivisions() {
  return (
    <PageTemplate
      title="Sub-Divisi"
      breadcrumbs={[{ label: 'Dashboard', href: '/' }, { label: 'HRGA' }, { label: 'Sub-Divisi' }]}
      apiEndpoint="divisions"
      fields={[
        { name: 'subDivisionCode', label: 'Kode Sub-Divisi', required: true },
        { name: 'subDivisionName', label: 'Nama Sub-Divisi', required: true },
        { name: 'divisionCode', label: 'Kode Divisi', required: true },
        { name: 'head', label: 'Kepala Sub-Divisi' },
      ]}
      columns={[
        { key: 'subDivisionCode', label: 'Kode' },
        { key: 'subDivisionName', label: 'Nama Sub-Divisi' },
        { key: 'divisionCode', label: 'Divisi' },
      ]}
    />
  );
}

export function KPI() {
  return (
    <PageTemplate
      title="KPI"
      breadcrumbs={[{ label: 'Dashboard', href: '/' }, { label: 'HRGA' }, { label: 'KPI' }]}
      apiEndpoint="employees"
      fields={[
        { name: 'kpiCode', label: 'Kode KPI', required: true },
        { name: 'kpiName', label: 'Nama KPI', required: true },
        { name: 'divisionCode', label: 'Kode Divisi', required: true },
        { name: 'target', label: 'Target', type: 'number' },
        { name: 'weight', label: 'Bobot (%)', type: 'number' },
      ]}
      columns={[
        { key: 'kpiCode', label: 'Kode' },
        { key: 'kpiName', label: 'Nama KPI' },
        { key: 'divisionCode', label: 'Divisi' },
        { key: 'target', label: 'Target' },
      ]}
    />
  );
}

export function MasterShift() {
  return (
    <PageTemplate
      title="Master Shift"
      breadcrumbs={[{ label: 'Dashboard', href: '/' }, { label: 'HRGA' }, { label: 'Master Shift' }]}
      apiEndpoint="employees"
      fields={[
        { name: 'shiftCode', label: 'Kode Shift', required: true },
        { name: 'shiftName', label: 'Nama Shift', required: true },
        { name: 'startTime', label: 'Jam Mulai', required: true },
        { name: 'endTime', label: 'Jam Selesai', required: true },
      ]}
      columns={[
        { key: 'shiftCode', label: 'Kode' },
        { key: 'shiftName', label: 'Nama Shift' },
        { key: 'startTime', label: 'Mulai' },
        { key: 'endTime', label: 'Selesai' },
      ]}
    />
  );
}

export function Recruitment() {
  return (
    <PageTemplate
      title="Rekruitmen dan Screening Kandidat"
      breadcrumbs={[{ label: 'Dashboard', href: '/' }, { label: 'HRGA' }, { label: 'Rekruitmen' }]}
      apiEndpoint="employees"
      fields={[
        { name: 'applicantName', label: 'Nama Pelamar', required: true },
        { name: 'position', label: 'Posisi yang Dilamar', required: true },
        { name: 'email', label: 'Email', type: 'email' },
        { name: 'phone', label: 'No. Telepon', type: 'tel' },
        { name: 'applicationDate', label: 'Tanggal Melamar', type: 'date' },
        { name: 'interviewDate', label: 'Tanggal Interview', type: 'date' },
      ]}
      columns={[
        { key: 'applicantName', label: 'Nama' },
        { key: 'position', label: 'Posisi' },
        { key: 'phone', label: 'Telepon' },
        { key: 'applicationDate', label: 'Tgl Melamar' },
      ]}
    />
  );
}

export function WarningLetters() {
  return (
    <PageTemplate
      title="Surat Peringatan dan Teguran"
      breadcrumbs={[{ label: 'Dashboard', href: '/' }, { label: 'HRGA' }, { label: 'Surat Peringatan' }]}
      apiEndpoint="employees"
      fields={[
        { name: 'letterNumber', label: 'No. Surat', required: true },
        { name: 'employeeNumber', label: 'No. Karyawan', required: true },
        { name: 'warningType', label: 'Jenis Peringatan', required: true },
        { name: 'reason', label: 'Alasan', required: true },
        { name: 'issueDate', label: 'Tanggal Terbit', type: 'date' },
      ]}
      columns={[
        { key: 'letterNumber', label: 'No. Surat' },
        { key: 'employeeNumber', label: 'Karyawan' },
        { key: 'warningType', label: 'Jenis' },
        { key: 'issueDate', label: 'Tanggal' },
      ]}
    />
  );
}

export function DocumentManagement() {
  return (
    <PageTemplate
      title="Managemen Surat"
      breadcrumbs={[{ label: 'Dashboard', href: '/' }, { label: 'HRGA' }, { label: 'Managemen Surat' }]}
      apiEndpoint="employees"
      fields={[
        { name: 'documentNumber', label: 'No. Surat', required: true },
        { name: 'documentType', label: 'Jenis Surat', required: true },
        { name: 'subject', label: 'Perihal', required: true },
        { name: 'sender', label: 'Pengirim' },
        { name: 'receiver', label: 'Penerima' },
        { name: 'documentDate', label: 'Tanggal Surat', type: 'date' },
      ]}
      columns={[
        { key: 'documentNumber', label: 'No. Surat' },
        { key: 'documentType', label: 'Jenis' },
        { key: 'subject', label: 'Perihal' },
        { key: 'documentDate', label: 'Tanggal' },
      ]}
    />
  );
}

export function SecurityReports() {
  return (
    <PageTemplate
      title="Laporan Satpam"
      breadcrumbs={[{ label: 'Dashboard', href: '/' }, { label: 'HRGA' }, { label: 'Laporan Satpam' }]}
      apiEndpoint="employees"
      fields={[
        { name: 'reportNumber', label: 'No. Laporan', required: true },
        { name: 'reportDate', label: 'Tanggal Laporan', type: 'date', required: true },
        { name: 'shift', label: 'Shift', required: true },
        { name: 'guardName', label: 'Nama Satpam', required: true },
        { name: 'incident', label: 'Kejadian' },
        { name: 'action', label: 'Tindakan' },
      ]}
      columns={[
        { key: 'reportNumber', label: 'No. Laporan' },
        { key: 'reportDate', label: 'Tanggal' },
        { key: 'shift', label: 'Shift' },
        { key: 'guardName', label: 'Satpam' },
      ]}
    />
  );
}

export function JanitorReports() {
  return (
    <PageTemplate
      title="Laporan OB"
      breadcrumbs={[{ label: 'Dashboard', href: '/' }, { label: 'HRGA' }, { label: 'Laporan OB' }]}
      apiEndpoint="employees"
      fields={[
        { name: 'reportNumber', label: 'No. Laporan', required: true },
        { name: 'reportDate', label: 'Tanggal Laporan', type: 'date', required: true },
        { name: 'janitorName', label: 'Nama OB', required: true },
        { name: 'area', label: 'Area', required: true },
        { name: 'tasks', label: 'Tugas yang Dilakukan' },
      ]}
      columns={[
        { key: 'reportNumber', label: 'No. Laporan' },
        { key: 'reportDate', label: 'Tanggal' },
        { key: 'janitorName', label: 'OB' },
        { key: 'area', label: 'Area' },
      ]}
    />
  );
}

export function Assets() {
  return (
    <PageTemplate
      title="Asset"
      breadcrumbs={[{ label: 'Dashboard', href: '/' }, { label: 'HRGA' }, { label: 'Asset' }]}
      apiEndpoint="employees"
      fields={[
        { name: 'assetCode', label: 'Kode Asset', required: true },
        { name: 'assetName', label: 'Nama Asset', required: true },
        { name: 'category', label: 'Kategori', required: true },
        { name: 'purchaseDate', label: 'Tanggal Pembelian', type: 'date' },
        { name: 'purchaseValue', label: 'Nilai Pembelian', type: 'number' },
        { name: 'condition', label: 'Kondisi' },
      ]}
      columns={[
        { key: 'assetCode', label: 'Kode' },
        { key: 'assetName', label: 'Nama Asset' },
        { key: 'category', label: 'Kategori' },
        { key: 'condition', label: 'Kondisi' },
      ]}
    />
  );
}

export function AssetRepair() {
  return (
    <PageTemplate
      title="Perbaikan Asset"
      breadcrumbs={[{ label: 'Dashboard', href: '/' }, { label: 'HRGA' }, { label: 'Perbaikan Asset' }]}
      apiEndpoint="employees"
      fields={[
        { name: 'repairNumber', label: 'No. Perbaikan', required: true },
        { name: 'assetCode', label: 'Kode Asset', required: true },
        { name: 'repairDate', label: 'Tanggal Perbaikan', type: 'date' },
        { name: 'problem', label: 'Masalah', required: true },
        { name: 'action', label: 'Tindakan', required: true },
        { name: 'cost', label: 'Biaya', type: 'number' },
      ]}
      columns={[
        { key: 'repairNumber', label: 'No.' },
        { key: 'assetCode', label: 'Asset' },
        { key: 'repairDate', label: 'Tanggal' },
        { key: 'cost', label: 'Biaya' },
      ]}
    />
  );
}

export function OfficeSupplyRequest() {
  return (
    <PageTemplate
      title="Pengajuan ATK dan Reguler"
      breadcrumbs={[{ label: 'Dashboard', href: '/' }, { label: 'HRGA' }, { label: 'Pengajuan ATK' }]}
      apiEndpoint="employees"
      fields={[
        { name: 'requestNumber', label: 'No. Pengajuan', required: true },
        { name: 'requestedBy', label: 'Pengaju', required: true },
        { name: 'itemName', label: 'Nama Barang', required: true },
        { name: 'quantity', label: 'Quantity', type: 'number', required: true },
        { name: 'requestDate', label: 'Tanggal Pengajuan', type: 'date' },
        { name: 'purpose', label: 'Keperluan' },
      ]}
      columns={[
        { key: 'requestNumber', label: 'No. Pengajuan' },
        { key: 'requestedBy', label: 'Pengaju' },
        { key: 'itemName', label: 'Barang' },
        { key: 'quantity', label: 'Qty' },
      ]}
    />
  );
}