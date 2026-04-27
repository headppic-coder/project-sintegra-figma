import { PageHeader } from '../../components/page-header';

export default function SalesOrderItems() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Item Sales Order"
        breadcrumbs={[
          { label: 'Dashboard', href: '/' },
          { label: 'Sales' },
          { label: 'Item Sales Order' },
        ]}
      />
      <div className="bg-white rounded-lg shadow p-6">
        <p className="text-gray-500">Halaman Item Sales Order akan segera hadir.</p>
      </div>
    </div>
  );
}
