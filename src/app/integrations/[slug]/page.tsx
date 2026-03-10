'use client';

import { use } from 'react';
import { PageHeader } from '@/components/shared/page-header';
import { useIntegration } from '@/hooks/use-integrations';
import { useLogs } from '@/hooks/use-logs';
import { CredentialForm } from '@/components/integrations/credential-form';
import { ConfigForm } from '@/components/integrations/config-form';
import { EventLogTable } from '@/components/logs/event-log-table';
import { StatusBadge } from '@/components/logs/status-badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function IntegrationDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  const { data: integration, isLoading } = useIntegration(slug);
  const { data: logs } = useLogs({ integrationId: integration?.id, limit: 20 });

  if (isLoading) {
    return <p className="text-muted-foreground">Loading...</p>;
  }

  if (!integration) {
    return <p className="text-muted-foreground">Integration not found</p>;
  }

  const webhookUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}/api/webhooks/${slug}`
      : `/api/webhooks/${slug}`;

  return (
    <>
      <PageHeader title={integration.name}>
        <StatusBadge status={integration.enabled ? 'completed' : 'failed'} />
      </PageHeader>

      <div className="flex items-center gap-2 mb-6 text-sm text-muted-foreground">
        <Badge variant="outline">{integration.sourceService}</Badge>
        <ArrowRight className="h-3 w-3" />
        <Badge variant="outline">{integration.destinationService}</Badge>
      </div>

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="credentials">Credentials</TabsTrigger>
          <TabsTrigger value="config">Configuration</TabsTrigger>
          <TabsTrigger value="logs">Logs</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Webhook URL</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <code className="flex-1 rounded bg-muted p-3 text-sm font-mono">
                  {webhookUrl}
                </code>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigator.clipboard.writeText(webhookUrl)}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Configure this URL in your {integration.sourceService} webhook settings.
              </p>
            </CardContent>
          </Card>

          {integration.description && (
            <Card>
              <CardHeader>
                <CardTitle>Description</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm">{integration.description}</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="credentials" className="mt-4">
          <CredentialForm slug={slug} />
        </TabsContent>

        <TabsContent value="config" className="mt-4">
          <ConfigForm integration={integration} />
        </TabsContent>

        <TabsContent value="logs" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Events</CardTitle>
            </CardHeader>
            <CardContent>
              <EventLogTable events={logs?.events ?? []} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </>
  );
}
