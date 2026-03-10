'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';

export interface RegistryKey {
  id: number;
  label: string;
  service: string;
  credentialType: string;
  maskedValue: string;
  createdAt: string;
  updatedAt: string | null;
}

export function useRegistryKeys() {
  return useQuery<RegistryKey[]>({
    queryKey: ['registry-keys'],
    queryFn: async () => {
      const { data } = await axios.get('/api/registry');
      return data;
    },
    staleTime: 30 * 1000,
  });
}

export function useCreateRegistryKey() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: {
      label: string;
      service: string;
      credentialType: string;
      value: string;
    }) => {
      const { data } = await axios.post('/api/registry', payload);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['registry-keys'] });
    },
  });
}

export function useUpdateRegistryKey() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      label,
      value,
    }: {
      id: number;
      label?: string;
      value?: string;
    }) => {
      const { data } = await axios.put(`/api/registry/${id}`, { label, value });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['registry-keys'] });
    },
  });
}

export function useDeleteRegistryKey() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      const { data } = await axios.delete(`/api/registry/${id}`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['registry-keys'] });
    },
  });
}
