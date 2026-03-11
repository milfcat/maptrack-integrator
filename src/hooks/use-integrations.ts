'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';

export interface Integration {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  sourceService: string;
  destinationService: string;
  sourceConfig: Record<string, unknown>;
  destinationConfig: Record<string, unknown>;
  enabled: boolean;
  createdAt: string;
  updatedAt: string | null;
  stats24h?: {
    total: number;
    completed: number;
    failed: number;
    successRate: number;
  };
}

export function useIntegrations() {
  return useQuery<Integration[]>({
    queryKey: ['integrations'],
    queryFn: async () => {
      const { data } = await axios.get('/api/integrations');
      return data;
    },
    staleTime: 30 * 1000,
  });
}

export function useIntegration(slug: string) {
  return useQuery<Integration>({
    queryKey: ['integration', slug],
    queryFn: async () => {
      const { data } = await axios.get(`/api/integrations/${slug}`);
      return data;
    },
    enabled: !!slug,
  });
}

export function useToggleIntegration() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      slug,
      enabled,
    }: {
      slug: string;
      enabled: boolean;
    }) => {
      const { data } = await axios.patch(`/api/integrations/${slug}`, {
        enabled,
      });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['integrations'] });
    },
  });
}

export interface Credential {
  id: number;
  service: string;
  credentialType: string;
  maskedValue: string;
  registryKeyId: number | null;
  registryLabel: string | null;
  createdAt: string;
  updatedAt: string | null;
}

export function useCredentials(slug: string) {
  return useQuery<Credential[]>({
    queryKey: ['credentials', slug],
    queryFn: async () => {
      const { data } = await axios.get(
        `/api/integrations/${slug}/credentials`
      );
      return data;
    },
    enabled: !!slug,
  });
}

export function useSaveCredential() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      slug,
      service,
      credentialType,
      value,
      registryKeyId,
    }: {
      slug: string;
      service: string;
      credentialType: string;
      value?: string;
      registryKeyId?: number;
    }) => {
      const { data } = await axios.post(
        `/api/integrations/${slug}/credentials`,
        { service, credentialType, value, registryKeyId }
      );
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['credentials', variables.slug],
      });
    },
  });
}

export interface JustCallCampaign {
  id: number;
  name: string;
}

export function useJustCallCampaigns(slug: string) {
  return useQuery<JustCallCampaign[]>({
    queryKey: ['justcall-campaigns', slug],
    queryFn: async () => {
      const { data } = await axios.get(
        `/api/integrations/${slug}/campaigns`
      );
      return data;
    },
    enabled: !!slug,
    staleTime: 5 * 60 * 1000,
  });
}

export interface SmartLeadCampaign {
  id: number;
  name: string;
  status: string;
}

export function useSmartLeadCampaigns(slug: string) {
  return useQuery<SmartLeadCampaign[]>({
    queryKey: ['smartlead-campaigns', slug],
    queryFn: async () => {
      const { data } = await axios.get(
        `/api/integrations/${slug}/campaigns?service=smartlead`
      );
      return data;
    },
    enabled: !!slug,
    staleTime: 5 * 60 * 1000,
  });
}

export interface CampaignMapping {
  id: number;
  integrationId: number;
  sourceCampaignId: string;
  sourceCampaignName: string | null;
  destinationCampaignId: string;
  destinationCampaignName: string | null;
  enabled: boolean;
  createdAt: string;
}

export function useCampaignMappings(slug: string) {
  return useQuery<CampaignMapping[]>({
    queryKey: ['campaign-mappings', slug],
    queryFn: async () => {
      const { data } = await axios.get(
        `/api/integrations/${slug}/campaign-mappings`
      );
      return data;
    },
    enabled: !!slug,
  });
}

export function useSaveCampaignMapping() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      slug,
      ...mapping
    }: {
      slug: string;
      sourceCampaignId: string;
      sourceCampaignName?: string;
      destinationCampaignId: string;
      destinationCampaignName?: string;
    }) => {
      const { data } = await axios.post(
        `/api/integrations/${slug}/campaign-mappings`,
        mapping
      );
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['campaign-mappings', variables.slug],
      });
    },
  });
}

export function useDeleteCampaignMapping() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ slug, id }: { slug: string; id: number }) => {
      const { data } = await axios.delete(
        `/api/integrations/${slug}/campaign-mappings`,
        { data: { id } }
      );
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['campaign-mappings', variables.slug],
      });
    },
  });
}

export interface FieldMappingData {
  id?: number;
  sourceField: string;
  destinationField: string;
  transform: string | null;
  isRequired: boolean;
  defaultValue: string | null;
}

export function useFieldMappings(slug: string) {
  return useQuery<FieldMappingData[]>({
    queryKey: ['fieldMappings', slug],
    queryFn: async () => {
      const { data } = await axios.get(
        `/api/integrations/${slug}/field-mappings`
      );
      return data;
    },
    enabled: !!slug,
  });
}
