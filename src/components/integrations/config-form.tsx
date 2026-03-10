'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { Save, Check } from 'lucide-react';
import type { Integration } from '@/hooks/use-integrations';

export function ConfigForm({ integration }: { integration: Integration }) {
  const queryClient = useQueryClient();
  const destConfig = (integration.destinationConfig ?? {}) as Record<string, string>;

  const [campaignId, setCampaignId] = useState(destConfig.campaign_id ?? '');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

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
      queryClient.invalidateQueries({ queryKey: ['integration', integration.slug] });
      queryClient.invalidateQueries({ queryKey: ['integrations'] });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (error) {
      console.error('Failed to save config:', error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Destination Configuration</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="campaign_id">JustCall Campaign ID</Label>
          <p className="text-xs text-muted-foreground">
            The JustCall Sales Dialer campaign to add contacts to. Find this in your JustCall dashboard under Sales Dialer &rarr; Campaigns.
          </p>
          <div className="flex gap-2">
            <Input
              id="campaign_id"
              placeholder="Enter JustCall campaign ID"
              value={campaignId}
              onChange={(e) => setCampaignId(e.target.value)}
            />
            <Button
              onClick={handleSave}
              disabled={saving}
              variant={saved ? 'outline' : 'default'}
            >
              {saved ? (
                <Check className="h-4 w-4 text-green-600" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              {saved ? 'Saved' : 'Save'}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
