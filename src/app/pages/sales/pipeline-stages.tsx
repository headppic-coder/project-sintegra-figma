import { useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { PageHeader } from '../../components/page-header';
import { Card } from '../../components/ui/card';

export function PipelineStages() {
  return (
    <div className="space-y-6 pb-4">
      <PageHeader
        title="Master Stage Pipeline"
        description="Kelola tahapan pipeline sales"
        breadcrumbs={[
          { label: 'Dashboard', href: '/' },
          { label: 'Sales' },
          { label: 'Master Stage Pipeline' },
        ]}
        actions={
          <Button disabled>
            <Plus className="w-4 h-4 mr-2" />
            Tambah Stage
          </Button>
        }
      />

      <Card className="p-6">
        <div className="text-center py-12">
          <p className="text-muted-foreground mb-2">Master Stage Pipeline</p>
          <p className="text-sm text-muted-foreground">Fitur ini sedang dalam pengembangan</p>
        </div>
      </Card>
    </div>
  );
}
