'use client';

import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowRight, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Integration } from '@/hooks/use-integrations';
import { useToggleIntegration } from '@/hooks/use-integrations';

export function IntegrationCard({
  integration,
}: {
  integration: Integration;
}) {
  const toggleMutation = useToggleIntegration();

  return (
    <Card className="group relative hover:ring-2 hover:ring-primary/20 transition-all duration-200">
      <CardHeader className="flex flex-row items-start justify-between space-y-0">
        <Link
          href={`/integrations/${integration.slug}`}
          className="flex-1 min-w-0"
        >
          <CardTitle className="text-base group-hover:text-primary transition-colors">
            {integration.name}
          </CardTitle>
          <div className="flex items-center gap-2 mt-2.5">
            <Badge variant="secondary" className="text-xs">
              {integration.sourceService}
            </Badge>
            <ArrowRight className="h-3 w-3 text-muted-foreground shrink-0" />
            <Badge variant="secondary" className="text-xs">
              {integration.destinationService}
            </Badge>
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
          <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
            {integration.description}
          </p>
        )}
        {integration.stats24h && (
          <div className="flex items-center gap-3 text-xs">
            <span className="text-muted-foreground">
              {integration.stats24h.total} events (24h)
            </span>
            <span className="text-muted-foreground">&middot;</span>
            <span
              className={cn(
                integration.stats24h.successRate >= 90
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : 'text-amber-600 dark:text-amber-400'
              )}
            >
              {integration.stats24h.successRate}% success
            </span>
            {integration.stats24h.failed > 0 && (
              <>
                <span className="text-muted-foreground">&middot;</span>
                <span className="text-red-600 dark:text-red-400">
                  {integration.stats24h.failed} failed
                </span>
              </>
            )}
          </div>
        )}
        <Link
          href={`/integrations/${integration.slug}`}
          className="inline-flex items-center gap-1 text-xs font-medium text-primary mt-3 opacity-0 group-hover:opacity-100 transition-opacity"
        >
          View details
          <ChevronRight className="h-3 w-3" />
        </Link>
      </CardContent>
    </Card>
  );
}

export function IntegrationCardSkeleton() {
  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between space-y-0">
        <div className="space-y-2 flex-1">
          <Skeleton className="h-5 w-40" />
          <div className="flex items-center gap-2">
            <Skeleton className="h-5 w-20 rounded-full" />
            <Skeleton className="h-3 w-3" />
            <Skeleton className="h-5 w-20 rounded-full" />
          </div>
        </div>
        <Skeleton className="h-5 w-9 rounded-full" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-4 w-full mb-2" />
        <Skeleton className="h-3 w-48" />
      </CardContent>
    </Card>
  );
}
