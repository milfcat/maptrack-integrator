'use client';

import { PageHeader } from '@/components/shared/page-header';
import {
  IntegrationCard,
  IntegrationCardSkeleton,
} from '@/components/integrations/integration-card';
import { useIntegrations } from '@/hooks/use-integrations';
import { Plug } from 'lucide-react';

export default function IntegrationsPage() {
  const { data: integrations, isLoading } = useIntegrations();

  return (
    <>
      <PageHeader
        title="Integrations"
        description="Manage your integration connections"
      />

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <IntegrationCardSkeleton key={i} />
          ))}
        </div>
      ) : integrations && integrations.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {integrations.map((integration) => (
            <IntegrationCard
              key={integration.id}
              integration={integration}
            />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted mb-4">
            <Plug className="h-7 w-7 text-muted-foreground" />
          </div>
          <p className="text-base font-medium">No integrations configured</p>
          <p className="text-sm text-muted-foreground mt-1 max-w-sm">
            Create your first integration via the API or settings to start
            syncing data between services.
          </p>
        </div>
      )}
    </>
  );
}
