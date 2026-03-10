'use client';

import { useQuery } from '@tanstack/react-query';
import axios from 'axios';

export interface DashboardStats {
  totalIntegrations: number;
  activeIntegrations: number;
  eventsToday: number;
  successRate24h: number;
  processingCount: number;
  failedToday: number;
  weeklyActivity: Array<{
    date: string;
    total: number;
    completed: number;
    failed: number;
  }>;
}

export function useStats() {
  return useQuery<DashboardStats>({
    queryKey: ['stats'],
    queryFn: async () => {
      const { data } = await axios.get('/api/stats');
      return data;
    },
    refetchInterval: 30 * 1000,
  });
}
