import { PageHeader } from '../../components/page-header';

export default function DeliveryNotes() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Surat Jalan"
        breadcrumbs={[
          { label: 'Dashboard', href: '/' },
          { label: 'Sales' },
          { label: 'Surat Jalan' },
        ]}
      />
      <div className="bg-white rounded-lg shadow p-6">
        <p className="text-gray-500">Halaman Surat Jalan akan segera hadir.</p>
      </div>
    </div>
  );
}
