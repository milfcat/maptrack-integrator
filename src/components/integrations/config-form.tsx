'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from '@/components/ui/select';
import { useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { Save, Check, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Integration } from '@/hooks/use-integrations';
import { useJustCallCampaigns } from '@/hooks/use-integrations';

export function ConfigForm({ integration }: { integration: Integration }) {
  const queryClient = useQueryClient();
  const destConfig = (integration.destinationConfig ?? {}) as Record<
    string,
    string
  >;

  const [campaignId, setCampaignId] = useState(destConfig.campaign_id ?? '');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const {
    data: campaigns,
    isLoading: campaignsLoading,
    error: campaignsError,
  } = useJustCallCampaigns(integration.slug);

  useEffect(() => {
    setCampaignId(destConfig.campaign_id ?? '');
  }, [destConfig.campaign_id]);

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);
    try {
      await axios.patch(`/api/integrations/${integration.slug}`, {
        destinationConfig: {
          ...destConfig,
          campaign_id: campaignId,
        },
      });
      queryClient.invalidateQueries({
        queryKey: ['integration', integration.slug],
      });
      queryClient.invalidateQueries({ queryKey: ['integrations'] });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (error) {
      console.error('Failed to save config:', error);
    } finally {
      setSaving(false);
    }
  };

  const selectedCampaign = campaigns?.find(
    (c) => String(c.id) === campaignId
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Destination Configuration</CardTitle>
        <CardDescription>
          Configure how data is sent to the destination service
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3">
          <div>
            <Label>JustCall Campaign</Label>
            <p className="text-xs text-muted-foreground mt-1">
              Select the JustCall Sales Dialer campaign to add contacts to.
            </p>
          </div>
          {campaignsLoading ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground py-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading campaigns...
            </div>
          ) : campaignsError ? (
            <div className="rounded-lg bg-red-50 dark:bg-red-500/10 p-3 text-sm text-red-800 dark:text-red-400">
              Failed to load campaigns. Ensure JustCall credentials are
              configured in the Credentials tab.
            </div>
          ) : campaigns && campaigns.length === 0 ? (
            <div className="rounded-lg bg-muted p-3 text-sm text-muted-foreground">
              No campaigns found in JustCall Sales Dialer.
            </div>
          ) : (
            <div className="flex gap-2">
              <Select
                value={campaignId}
                onValueChange={(v) => setCampaignId(v ?? '')}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a campaign">
                    {selectedCampaign
                      ? selectedCampaign.name
                      : campaignId || 'Select a campaign'}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {campaigns?.map((campaign) => (
                    <SelectItem key={campaign.id} value={String(campaign.id)}>
                      {campaign.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                onClick={handleSave}
                disabled={saving || !campaignId}
                variant={saved ? 'outline' : 'default'}
                className={cn(saved && 'text-emerald-600')}
              >
                {saved ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                {saved ? 'Saved' : 'Save'}
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
