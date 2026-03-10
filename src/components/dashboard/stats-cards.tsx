'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Plug, Activity, CheckCircle, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { DashboardStats } from '@/hooks/use-stats';

const cardDefs = [
  {
    key: 'active',
    title: 'ACTIVE INTEGRATIONS',
    icon: Plug,
    color: 'text-blue-600',
    bg: 'bg-blue-100 dark:bg-blue-500/15',
    darkColor: 'dark:text-blue-400',
    getValue: (s: DashboardStats) => s.activeIntegrations,
    getSub: (s: DashboardStats) => `${s.totalIntegrations} total`,
  },
  {
    key: 'events',
    title: 'EVENTS TODAY',
    icon: Activity,
    color: 'text-emerald-600',
    bg: 'bg-emerald-100 dark:bg-emerald-500/15',
    darkColor: 'dark:text-emerald-400',
    getValue: (s: DashboardStats) => s.eventsToday,
    getSub: (s: DashboardStats) => `${s.processingCount} processing`,
  },
  {
    key: 'success',
    title: 'SUCCESS RATE (24H)',
    icon: CheckCircle,
    color: 'text-violet-600',
    bg: 'bg-violet-100 dark:bg-violet-500/15',
    darkColor: 'dark:text-violet-400',
    getValue: (s: DashboardStats) => `${s.successRate24h}%`,
    getSub: (s: DashboardStats) =>
      s.failedToday > 0 ? `${s.failedToday} failed` : 'All clear',
  },
  {
    key: 'failed',
    title: 'FAILED TODAY',
    icon: AlertTriangle,
    color: 'text-red-600',
    bg: 'bg-red-100 dark:bg-red-500/15',
    darkColor: 'dark:text-red-400',
    getValue: (s: DashboardStats) => s.failedToday,
    getSub: () => 'Requires attention',
  },
];

export function StatsCards({ stats }: { stats: DashboardStats }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {cardDefs.map((card) => (
        <Card key={card.key} className="shadow-sm">
          <CardContent className="py-5 px-5">
            <div className="flex items-center gap-4">
              <div
                className={cn(
                  'flex h-11 w-11 shrink-0 items-center justify-center rounded-full',
                  card.bg
                )}
              >
                <card.icon className={cn('h-5 w-5', card.color, card.darkColor)} />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-semibold tracking-wider text-muted-foreground">
                  {card.title}
                </p>
                <p className="text-2xl font-bold tracking-tight leading-tight mt-0.5">
                  {card.getValue(stats)}
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
        <Card key={i} className="shadow-sm">
          <CardContent className="py-5 px-5">
            <div className="flex items-center gap-4">
              <Skeleton className="h-11 w-11 rounded-full shrink-0" />
              <div className="space-y-2 flex-1">
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-7 w-14" />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
