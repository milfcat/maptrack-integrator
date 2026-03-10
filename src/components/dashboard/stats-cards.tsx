'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plug, Activity, CheckCircle, AlertTriangle } from 'lucide-react';
import type { DashboardStats } from '@/hooks/use-stats';

export function StatsCards({ stats }: { stats: DashboardStats }) {
  const cards = [
    {
      title: 'Active Integrations',
      value: stats.activeIntegrations,
      subtitle: `${stats.totalIntegrations} total`,
      icon: Plug,
    },
    {
      title: 'Events Today',
      value: stats.eventsToday,
      subtitle: `${stats.processingCount} processing`,
      icon: Activity,
    },
    {
      title: 'Success Rate (24h)',
      value: `${stats.successRate24h}%`,
      subtitle: `${stats.failedToday} failed`,
      icon: CheckCircle,
    },
    {
      title: 'Failed Today',
      value: stats.failedToday,
      subtitle: 'Requires attention',
      icon: AlertTriangle,
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => (
        <Card key={card.title}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
            <card.icon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{card.value}</div>
            <p className="text-xs text-muted-foreground">{card.subtitle}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
