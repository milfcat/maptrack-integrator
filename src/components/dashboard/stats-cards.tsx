'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Plug, Activity, CheckCircle, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { DashboardStats } from '@/hooks/use-stats';

const cardDefs = [
  {
    key: 'active',
    title: 'Active Integrations',
    icon: Plug,
    color: 'text-blue-600 dark:text-blue-400',
    bg: 'bg-blue-50 dark:bg-blue-500/10',
    getValue: (s: DashboardStats) => s.activeIntegrations,
    getSub: (s: DashboardStats) => `${s.totalIntegrations} total`,
  },
  {
    key: 'events',
    title: 'Events Today',
    icon: Activity,
    color: 'text-violet-600 dark:text-violet-400',
    bg: 'bg-violet-50 dark:bg-violet-500/10',
    getValue: (s: DashboardStats) => s.eventsToday,
    getSub: (s: DashboardStats) => `${s.processingCount} processing`,
  },
  {
    key: 'success',
    title: 'Success Rate (24h)',
    icon: CheckCircle,
    color: 'text-emerald-600 dark:text-emerald-400',
    bg: 'bg-emerald-50 dark:bg-emerald-500/10',
    getValue: (s: DashboardStats) => `${s.successRate24h}%`,
    getSub: (s: DashboardStats) =>
      s.failedToday > 0 ? `${s.failedToday} failed` : 'All clear',
  },
  {
    key: 'failed',
    title: 'Failed Today',
    icon: AlertTriangle,
    color: 'text-red-600 dark:text-red-400',
    bg: 'bg-red-50 dark:bg-red-500/10',
    getValue: (s: DashboardStats) => s.failedToday,
    getSub: () => 'Requires attention',
  },
];

export function StatsCards({ stats }: { stats: DashboardStats }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {cardDefs.map((card) => (
        <Card key={card.key}>
          <CardContent className="pt-0">
            <div className="flex items-center gap-4">
              <div
                className={cn(
                  'flex h-10 w-10 shrink-0 items-center justify-center rounded-lg',
                  card.bg
                )}
              >
                <card.icon className={cn('h-5 w-5', card.color)} />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-medium text-muted-foreground truncate">
                  {card.title}
                </p>
                <p className="text-2xl font-semibold tracking-tight">
                  {card.getValue(stats)}
                </p>
                <p className="text-xs text-muted-foreground">
                  {card.getSub(stats)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export function StatsCardsSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <Card key={i}>
          <CardContent className="pt-0">
            <div className="flex items-center gap-4">
              <Skeleton className="h-10 w-10 rounded-lg shrink-0" />
              <div className="space-y-2 flex-1">
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-7 w-14" />
                <Skeleton className="h-3 w-16" />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
