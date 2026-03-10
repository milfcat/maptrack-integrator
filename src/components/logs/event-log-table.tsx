'use client';

import { useState } from 'react';
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
import { ChevronDown, ChevronRight } from 'lucide-react';
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
      <div className="text-center py-12 text-muted-foreground">
        No events found
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-8"></TableHead>
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
          <>
            <TableRow
              key={event.id}
              className="cursor-pointer hover:bg-muted/50"
              onClick={() => toggle(event.id)}
            >
              <TableCell>
                <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                  {expanded.has(event.id) ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                </Button>
              </TableCell>
              <TableCell className="font-mono text-xs">#{event.id}</TableCell>
              <TableCell>{event.eventType}</TableCell>
              <TableCell>{event.sourceService}</TableCell>
              <TableCell>
                <StatusBadge status={event.status} />
              </TableCell>
              <TableCell className="text-xs">
                {new Date(event.receivedAt).toLocaleString('en-AU')}
              </TableCell>
              <TableCell className="text-xs">
                {event.processedAt
                  ? new Date(event.processedAt).toLocaleString('en-AU')
                  : '-'}
              </TableCell>
            </TableRow>

            {expanded.has(event.id) && (
              <TableRow key={`${event.id}-detail`}>
                <TableCell colSpan={7} className="bg-muted/30 p-4">
                  {event.error && (
                    <div className="mb-3 rounded bg-red-50 p-3 text-sm text-red-800">
                      Error: {event.error}
                    </div>
                  )}

                  {event.transfers.length > 0 ? (
                    <div className="space-y-2">
                      <p className="text-sm font-medium">Data Transfers:</p>
                      {event.transfers.map((t) => (
                        <div
                          key={t.id}
                          className="rounded border bg-background p-3 text-xs"
                        >
                          <div className="flex items-center gap-3 mb-1">
                            <span className="font-medium">{t.step}</span>
                            <StatusBadge status={t.status} />
                            <span className="text-muted-foreground">
                              {t.service}
                            </span>
                            {t.durationMs && (
                              <span className="text-muted-foreground">
                                {t.durationMs}ms
                              </span>
                            )}
                          </div>
                          {t.error && (
                            <p className="text-red-600 mt-1">{t.error}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      No data transfers recorded yet
                    </p>
                  )}
                </TableCell>
              </TableRow>
            )}
          </>
        ))}
      </TableBody>
    </Table>
  );
}
