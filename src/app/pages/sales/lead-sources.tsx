import { PageTemplate } from "../../components/page-template";
import { formatDate } from "../../components/ui/utils";

export function LeadSources() {
  return (
    <PageTemplate
      title="Master Sumber Lead"
      breadcrumbs={[
        { label: 'Dashboard', href: '/' },
        { label: 'Sales' },
        { label: 'Master Sumber Lead' },
      ]}
      apiEndpoint="lead-sources"
      fields={[
        { name: 'name', label: 'Nama Sumber Lead', required: true },
        { name: 'description', label: 'Deskripsi' },
      ]}
      columns={[
        { key: 'name', label: 'Nama Sumber Lead' },
        { key: 'description', label: 'Deskripsi' },
        {
          key: 'createdAt',
          label: 'Tanggal Dibuat',
          render: (value: string) => formatDate(value),
        },
      ]}
    />
  );
}
