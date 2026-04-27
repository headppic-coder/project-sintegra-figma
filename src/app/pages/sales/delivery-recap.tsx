import { PageHeader } from '../../components/page-header';

export default function DeliveryRecap() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Rekap Pengiriman"
        breadcrumbs={[
          { label: 'Dashboard', href: '/' },
          { label: 'Sales' },
          { label: 'Rekap Pengiriman' },
        ]}
      />
      <div className="bg-white rounded-lg shadow p-6">
        <p className="text-gray-500">Halaman Rekap Pengiriman akan segera hadir.</p>
      </div>
    </div>
  );
}
