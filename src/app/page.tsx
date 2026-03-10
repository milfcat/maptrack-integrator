'use client';

import { PageHeader } from '@/components/shared/page-header';
import { StatsCards } from '@/components/dashboard/stats-cards';
import { ActivityChart } from '@/components/dashboard/activity-chart';
import { useStats } from '@/hooks/use-stats';
import { useLogs } from '@/hooks/use-logs';
import { StatusBadge } from '@/components/logs/status-badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function DashboardPage() {
  const { data: stats, isLoading: statsLoading } = useStats();
  const { data: logs, isLoading: logsLoading } = useLogs({ limit: 10 });

  if (statsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Loading dashboard...</p>
      </div>
    );
  }

  const defaultStats = {
    totalIntegrations: 0,
    activeIntegrations: 0,
    eventsToday: 0,
    successRate24h: 100,
    processingCount: 0,
    failedToday: 0,
    weeklyActivity: [],
  };

  return (
    <>
      <PageHeader
        title="Dashboard"
        description="Overview of all integration activity"
      />

      <div className="space-y-6">
        <StatsCards stats={stats ?? defaultStats} />

        <div className="grid gap-6 lg:grid-cols-2">
          <ActivityChart data={stats?.weeklyActivity ?? []} />

          <Card>
            <CardHeader>
              <CardTitle>Recent Events</CardTitle>
            </CardHeader>
            <CardContent>
              {logsLoading ? (
                <p className="text-sm text-muted-foreground">Loading...</p>
              ) : logs?.events && logs.events.length > 0 ? (
                <div className="space-y-3">
                  {logs.events.map((event) => (
                    <div
                      key={event.id}
                      className="flex items-center justify-between border-b pb-2 last:border-0"
                    >
                      <div>
                        <p className="text-sm font-medium">
                          {event.eventType}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {event.sourceService} &middot;{' '}
                          {new Date(event.receivedAt).toLocaleString('en-AU')}
                        </p>
                      </div>
                      <StatusBadge status={event.status} />
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No events yet. Configure an integration to get started.
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
