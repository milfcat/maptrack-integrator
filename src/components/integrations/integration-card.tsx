'use client';

import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { ArrowRight } from 'lucide-react';
import type { Integration } from '@/hooks/use-integrations';
import { useToggleIntegration } from '@/hooks/use-integrations';

export function IntegrationCard({
  integration,
}: {
  integration: Integration;
}) {
  const toggleMutation = useToggleIntegration();

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="flex flex-row items-start justify-between space-y-0">
        <Link href={`/integrations/${integration.slug}`} className="flex-1">
          <CardTitle className="text-base">{integration.name}</CardTitle>
          <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
            <Badge variant="outline">{integration.sourceService}</Badge>
            <ArrowRight className="h-3 w-3" />
            <Badge variant="outline">{integration.destinationService}</Badge>
          </div>
        </Link>
        <Switch
          checked={integration.enabled}
          onCheckedChange={(enabled) =>
            toggleMutation.mutate({ slug: integration.slug, enabled })
          }
        />
      </CardHeader>
      <CardContent>
        {integration.description && (
          <p className="text-sm text-muted-foreground mb-3">
            {integration.description}
          </p>
        )}
        {integration.stats24h && (
          <div className="flex gap-4 text-xs text-muted-foreground">
            <span>{integration.stats24h.total} events (24h)</span>
            <span>{integration.stats24h.successRate}% success</span>
            {integration.stats24h.failed > 0 && (
              <span className="text-red-600">
                {integration.stats24h.failed} failed
              </span>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
