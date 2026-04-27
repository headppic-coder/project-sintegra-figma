import { PageTemplate } from "../../components/page-template";
import { formatDate } from "../../components/ui/utils";

export function Segments() {
  return (
    <PageTemplate
      title="Master Segmen"
      breadcrumbs={[
        { label: 'Dashboard', href: '/' },
        { label: 'Sales' },
        { label: 'Master Segmen' },
      ]}
      apiEndpoint="segments"
      fields={[
        { name: 'name', label: 'Nama Segmen', required: true },
        { name: 'description', label: 'Deskripsi' },
        { name: 'criteria', label: 'Kriteria Segmen' },
      ]}
      columns={[
        { key: 'name', label: 'Nama Segmen' },
        { key: 'description', label: 'Deskripsi' },
        { key: 'criteria', label: 'Kriteria' },
        {
          key: 'createdAt',
          label: 'Tanggal Dibuat',
          render: (value: string) => formatDate(value),
        },
      ]}
    />
  );
}
