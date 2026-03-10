'use client';

import { useState } from 'react';
import { PageHeader } from '@/components/shared/page-header';
import { EventLogTable } from '@/components/logs/event-log-table';
import { useLogs } from '@/hooks/use-logs';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function LogsPage() {
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<string | undefined>();

  const { data, isLoading } = useLogs({
    page,
    limit: 25,
    status,
  });

  return (
    <>
      <PageHeader
        title="Event Logs"
        description="View all webhook events and data transfers"
      />

      <div className="flex items-center gap-4 mb-4">
        <Select
          value={status ?? 'all'}
          onValueChange={(v) => {
            setStatus(v === 'all' ? undefined : (v ?? undefined));
            setPage(1);
          }}
        >
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="received">Received</SelectItem>
            <SelectItem value="processing">Processing</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="failed">Failed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Events</span>
            {data?.pagination && (
              <span className="text-sm font-normal text-muted-foreground">
                {data.pagination.total} total events
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-muted-foreground py-8 text-center">
              Loading events...
            </p>
          ) : (
            <>
              <EventLogTable events={data?.events ?? []} />

              {data?.pagination && data.pagination.totalPages > 1 && (
                <div className="flex items-center justify-center gap-4 mt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page <= 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    Page {page} of {data.pagination.totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => p + 1)}
                    disabled={page >= data.pagination.totalPages}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </>
  );
}
