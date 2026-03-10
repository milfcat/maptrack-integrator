'use client';

import { useQuery } from '@tanstack/react-query';
import axios from 'axios';

export interface DataTransfer {
  id: number;
  webhookEventId: number;
  integrationId: number;
  step: string;
  direction: string;
  service: string;
  requestUrl: string | null;
  requestMethod: string | null;
  requestBody: Record<string, unknown> | null;
  responseStatus: number | null;
  responseBody: Record<string, unknown> | null;
  status: string;
  error: string | null;
  durationMs: number | null;
  createdAt: string;
}

export interface WebhookEvent {
  id: number;
  integrationId: number;
  eventType: string;
  sourceService: string;
  rawPayload: Record<string, unknown>;
  status: string;
  error: string | null;
  deduplicationKey: string | null;
  receivedAt: string;
  processedAt: string | null;
  transfers: DataTransfer[];
}

export interface LogsResponse {
  events: WebhookEvent[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export function useLogs(params?: {
  page?: number;
  limit?: number;
  integrationId?: number;
  status?: string;
}) {
  const searchParams = new URLSearchParams();
  if (params?.page) searchParams.set('page', params.page.toString());
  if (params?.limit) searchParams.set('limit', params.limit.toString());
  if (params?.integrationId)
    searchParams.set('integrationId', params.integrationId.toString());
  if (params?.status) searchParams.set('status', params.status);

  return useQuery<LogsResponse>({
    queryKey: ['logs', params],
    queryFn: async () => {
      const { data } = await axios.get(`/api/logs?${searchParams.toString()}`);
      return data;
    },
    refetchInterval: 10 * 1000,
  });
}
