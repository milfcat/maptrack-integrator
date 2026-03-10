'use client';

import { use, useState } from 'react';
import Link from 'next/link';
import { PageHeader } from '@/components/shared/page-header';
import { useIntegration } from '@/hooks/use-integrations';
import { useLogs } from '@/hooks/use-logs';
import { CredentialForm } from '@/components/integrations/credential-form';
import { ConfigForm } from '@/components/integrations/config-form';
import { EventLogTable } from '@/components/logs/event-log-table';
import { StatusBadge } from '@/components/logs/status-badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Copy,
  Globe,
  KeyRound,
  ScrollText,
  Settings2,
  Unplug,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function IntegrationDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  const { data: integration, isLoading } = useIntegration(slug);
  const { data: logs } = useLogs({
    integrationId: integration?.id,
    limit: 20,
  });
  const [copied, setCopied] = useState(false);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-8 w-64" />
          <div className="flex items-center gap-2">
            <Skeleton className="h-5 w-20 rounded-full" />
            <Skeleton className="h-3 w-3" />
            <Skeleton className="h-5 w-20 rounded-full" />
          </div>
        </div>
        <Skeleton className="h-9 w-96" />
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    );
  }

  if (!integration) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted mb-4">
          <Unplug className="h-7 w-7 text-muted-foreground" />
        </div>
        <p className="text-base font-medium">Integration not found</p>
        <p className="text-sm text-muted-foreground mt-1">
          This integration may have been removed.
        </p>
        <Button
          variant="outline"
          size="sm"
          className="mt-4"
          render={<Link href="/integrations" />}
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to integrations
        </Button>
      </div>
    );
  }

  const webhookUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}/api/webhooks/${slug}`
      : `/api/webhooks/${slug}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(webhookUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <>
      {/* Breadcrumb */}
      <div className="mb-4">
        <Link
          href="/integrations"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Integrations
        </Link>
      </div>

      <PageHeader title={integration.name}>
        <Badge
          variant={integration.enabled ? 'default' : 'outline'}
          className={
            integration.enabled
              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-400'
              : ''
          }
        >
          {integration.enabled ? 'Active' : 'Inactive'}
        </Badge>
      </PageHeader>

      <div className="flex items-center gap-2 -mt-4 mb-6 text-sm text-muted-foreground">
        <Badge variant="secondary">{integration.sourceService}</Badge>
        <ArrowRight className="h-3 w-3" />
        <Badge variant="secondary">{integration.destinationService}</Badge>
      </div>

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview" className="gap-1.5">
            <Globe className="h-3.5 w-3.5" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="credentials" className="gap-1.5">
            <KeyRound className="h-3.5 w-3.5" />
            Credentials
          </TabsTrigger>
          <TabsTrigger value="config" className="gap-1.5">
            <Settings2 className="h-3.5 w-3.5" />
            Configuration
          </TabsTrigger>
          <TabsTrigger value="logs" className="gap-1.5">
            <ScrollText className="h-3.5 w-3.5" />
            Logs
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Webhook URL</CardTitle>
              <CardDescription>
                Configure this URL in your {integration.sourceService} webhook
                settings
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <code className="flex-1 rounded-lg bg-muted p-3 text-sm font-mono break-all">
                  {webhookUrl}
                </code>
                <Button variant="outline" size="sm" onClick={handleCopy}>
                  {copied ? (
                    <Check className="h-4 w-4 text-emerald-600" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          {integration.description && (
            <Card>
              <CardHeader>
                <CardTitle>Description</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm leading-relaxed">
                  {integration.description}
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="credentials" className="mt-6">
          <CredentialForm slug={slug} />
        </TabsContent>

        <TabsContent value="config" className="mt-6">
          <ConfigForm integration={integration} />
        </TabsContent>

        <TabsContent value="logs" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Recent Events</CardTitle>
              <CardDescription>
                Last 20 webhook events for this integration
              </CardDescription>
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
