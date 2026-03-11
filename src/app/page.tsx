'use client';

import { useState } from 'react';
import { PageHeader } from '@/components/shared/page-header';
import { StatsCards, StatsCardsSkeleton } from '@/components/dashboard/stats-cards';
import { ActivityChart, ActivityChartSkeleton } from '@/components/dashboard/activity-chart';
import { useStats } from '@/hooks/use-stats';
import { useLogs } from '@/hooks/use-logs';
import { StatusBadge } from '@/components/logs/status-badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Inbox, Play, Loader2, Check, AlertCircle } from 'lucide-react';
import axios from 'axios';

export default function DashboardPage() {
  const { data: stats, isLoading: statsLoading, refetch: refetchStats } = useStats();
  const { data: logs, isLoading: logsLoading, refetch: refetchLogs } = useLogs({ limit: 10 });
  const [pushState, setPushState] = useState<'idle' | 'running' | 'done' | 'error'>('idle');
  const [pushResult, setPushResult] = useState<{ processed: number; succeeded: number; failed: number } | null>(null);

  async function handleManualPush() {
    setPushState('running');
    setPushResult(null);
    try {
      const { data } = await axios.post('/api/cron/process-webhooks');
      setPushResult(data);
      setPushState('done');
      refetchStats();
      refetchLogs();
      setTimeout(() => setPushState('idle'), 4000);
    } catch {
      setPushState('error');
      setTimeout(() => setPushState('idle'), 4000);
    }
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
      >
        <div className="flex items-center gap-2">
          {pushState === 'done' && pushResult && (
            <span className="text-xs text-muted-foreground">
              {pushResult.processed === 0
                ? 'No pending jobs'
                : `${pushResult.succeeded} pushed, ${pushResult.failed} failed`}
            </span>
          )}
          <Button
            size="sm"
            onClick={handleManualPush}
            disabled={pushState === 'running'}
          >
            {pushState === 'running' ? (
              <Loader2 className="h-4 w-4 animate-spin mr-1.5" />
            ) : pushState === 'done' ? (
              <Check className="h-4 w-4 mr-1.5" />
            ) : pushState === 'error' ? (
              <AlertCircle className="h-4 w-4 mr-1.5" />
            ) : (
              <Play className="h-4 w-4 mr-1.5" />
            )}
            {pushState === 'running' ? 'Processing...' : 'Push Now'}
          </Button>
        </div>
      </PageHeader>

      <div className="space-y-6">
        {statsLoading ? (
          <StatsCardsSkeleton />
        ) : (
          <StatsCards stats={stats ?? defaultStats} />
        )}

        <div className="grid gap-6 lg:grid-cols-2">
          {statsLoading ? (
            <ActivityChartSkeleton />
          ) : (
            <ActivityChart data={stats?.weeklyActivity ?? []} />
          )}

          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle>Recent Events</CardTitle>
              <CardDescription>Latest webhook activity</CardDescription>
            </CardHeader>
            <CardContent>
              {logsLoading ? (
                <div className="space-y-3">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="flex items-center justify-between py-2">
                      <div className="space-y-1.5">
                        <Skeleton className="h-4 w-28" />
                        <Skeleton className="h-3 w-40" />
                      </div>
                      <Skeleton className="h-5 w-16 rounded-full" />
                    </div>
                  ))}
                </div>
              ) : logs?.events && logs.events.length > 0 ? (
                <div className="space-y-0">
                  {logs.events.map((event) => (
                    <div
                      key={event.id}
                      className="flex items-center justify-between border-b py-3 last:border-0 last:pb-0 first:pt-0"
                    >
                      <div className="min-w-0 flex-1 pr-4">
                        <p className="text-sm font-medium truncate">
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
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted mb-3">
                    <Inbox className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <p className="text-sm font-medium">No events yet</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Configure an integration to get started
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
