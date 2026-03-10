'use client';

import { PageHeader } from '@/components/shared/page-header';
import { IntegrationCard } from '@/components/integrations/integration-card';
import { useIntegrations } from '@/hooks/use-integrations';

export default function IntegrationsPage() {
  const { data: integrations, isLoading } = useIntegrations();

  return (
    <>
      <PageHeader
        title="Integrations"
        description="Manage your integration connections"
      />

      {isLoading ? (
        <p className="text-muted-foreground">Loading integrations...</p>
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
        <div className="text-center py-12">
          <p className="text-muted-foreground">
            No integrations configured yet.
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            Create your first integration via the API or settings.
          </p>
        </div>
      )}
    </>
  );
}
