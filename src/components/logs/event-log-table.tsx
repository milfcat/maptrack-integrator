'use client';

import { Fragment, useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { StatusBadge } from './status-badge';
import { ChevronDown, ChevronRight, Clock, ScrollText, Zap } from 'lucide-react';
import type { WebhookEvent } from '@/hooks/use-logs';

export function EventLogTable({ events }: { events: WebhookEvent[] }) {
  const [expanded, setExpanded] = useState<Set<number>>(new Set());

  const toggle = (id: number) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  if (events.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted mb-3">
          <ScrollText className="h-6 w-6 text-muted-foreground" />
        </div>
        <p className="text-sm font-medium">No events found</p>
        <p className="text-xs text-muted-foreground mt-1">
          Events will appear here once webhooks are received
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-8" />
            <TableHead>Event ID</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Source</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Received</TableHead>
            <TableHead>Processed</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {events.map((event) => (
            <Fragment key={event.id}>
              <TableRow
                className="cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => toggle(event.id)}
              >
                <TableCell className="pr-0">
                  <Button variant="ghost" size="icon-xs" className="text-muted-foreground">
                    {expanded.has(event.id) ? (
                      <ChevronDown className="h-3.5 w-3.5" />
                    ) : (
                      <ChevronRight className="h-3.5 w-3.5" />
                    )}
                  </Button>
                </TableCell>
                <TableCell className="font-mono text-xs text-muted-foreground">
                  #{event.id}
                </TableCell>
                <TableCell className="font-medium">{event.eventType}</TableCell>
                <TableCell className="text-muted-foreground">
                  {event.sourceService}
                </TableCell>
                <TableCell>
                  <StatusBadge status={event.status} />
                </TableCell>
                <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                  {new Date(event.receivedAt).toLocaleString('en-AU')}
                </TableCell>
                <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                  {event.processedAt
                    ? new Date(event.processedAt).toLocaleString('en-AU')
                    : <span className="text-muted-foreground/50">&mdash;</span>}
                </TableCell>
              </TableRow>

              {expanded.has(event.id) && (
                <TableRow>
                  <TableCell colSpan={7} className="bg-muted/30 p-4">
                    {event.error && (
                      <div className="mb-3 flex items-start gap-2 rounded-lg bg-red-50 dark:bg-red-500/10 p-3 text-sm text-red-800 dark:text-red-400">
                        <span className="font-medium shrink-0">Error:</span>
                        <span>{event.error}</span>
                      </div>
                    )}

                    {event.transfers.length > 0 ? (
                      <div className="space-y-2">
                        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-3">
                          Data Transfers
                        </p>
                        {event.transfers.map((t) => (
                          <div
                            key={t.id}
                            className="rounded-lg border bg-background p-3"
                          >
                            <div className="flex items-center gap-3 text-sm">
                              <Zap className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                              <span className="font-medium">{t.step}</span>
                              <StatusBadge status={t.status} />
                              <span className="text-xs text-muted-foreground">
                                {t.service}
                              </span>
                              {t.durationMs && (
                                <span className="inline-flex items-center gap-1 text-xs text-muted-foreground ml-auto">
                                  <Clock className="h-3 w-3" />
                                  {t.durationMs}ms
                                </span>
                              )}
                            </div>
                            {t.error && (
                              <p className="text-xs text-red-600 dark:text-red-400 mt-2 ml-7">
                                {t.error}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        No data transfers recorded yet
                      </p>
                    )}
                  </TableCell>
                </TableRow>
              )}
            </Fragment>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
