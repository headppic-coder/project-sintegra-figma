import { PageHeader } from '../../components/page-header';

export default function DeliveryRequests() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Pengajuan Kirim"
        breadcrumbs={[
          { label: 'Dashboard', href: '/' },
          { label: 'Sales' },
          { label: 'Pengajuan Kirim' },
        ]}
      />
      <div className="bg-white rounded-lg shadow p-6">
        <p className="text-gray-500">Halaman Pengajuan Kirim akan segera hadir.</p>
      </div>
    </div>
  );
}
