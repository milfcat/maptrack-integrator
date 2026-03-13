'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import { Save, Check, Loader2, Plus, Trash2, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Integration } from '@/hooks/use-integrations';
import {
  useJustCallCampaigns,
  useSmartLeadCampaigns,
  useCampaignMappings,
  useSaveCampaignMapping,
  useDeleteCampaignMapping,
} from '@/hooks/use-integrations';

function SmartleadJustcallConfig({ integration }: { integration: Integration }) {
  const queryClient = useQueryClient();
  const destConfig = (integration.destinationConfig ?? {}) as Record<
    string,
    string
  >;

  // Default campaign (fallback when no mapping matches)
  const [defaultCampaignId, setDefaultCampaignId] = useState(
    destConfig.campaign_id ?? ''
  );
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // New mapping form state
  const [newSourceId, setNewSourceId] = useState('');
  const [newDestId, setNewDestId] = useState('');

  const {
    data: justcallCampaigns,
    isLoading: jcLoading,
    error: jcError,
  } = useJustCallCampaigns(integration.slug);

  const {
    data: smartleadCampaigns,
    isLoading: slLoading,
    error: slError,
  } = useSmartLeadCampaigns(integration.slug);

  const { data: mappings, isLoading: mappingsLoading } = useCampaignMappings(
    integration.slug
  );

  const saveMapping = useSaveCampaignMapping();
  const deleteMapping = useDeleteCampaignMapping();

  useEffect(() => {
    setDefaultCampaignId(destConfig.campaign_id ?? '');
  }, [destConfig.campaign_id]);

  const handleSaveDefault = async () => {
    setSaving(true);
    setSaved(false);
    try {
      await axios.patch(`/api/integrations/${integration.slug}`, {
        destinationConfig: {
          ...destConfig,
          campaign_id: defaultCampaignId,
        },
      });
      queryClient.invalidateQueries({
        queryKey: ['integration', integration.slug],
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (error) {
      console.error('Failed to save config:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleAddMapping = async () => {
    if (!newSourceId || !newDestId) return;

    const slCampaign = smartleadCampaigns?.find(
      (c) => String(c.id) === newSourceId
    );
    const jcCampaign = justcallCampaigns?.find(
      (c) => String(c.id) === newDestId
    );

    await saveMapping.mutateAsync({
      slug: integration.slug,
      sourceCampaignId: newSourceId,
      sourceCampaignName: slCampaign?.name,
      destinationCampaignId: newDestId,
      destinationCampaignName: jcCampaign?.name,
    });

    setNewSourceId('');
    setNewDestId('');
  };

  const handleDeleteMapping = async (id: number) => {
    await deleteMapping.mutateAsync({ slug: integration.slug, id });
  };

  const campaignsLoading = jcLoading || slLoading;
  const campaignsError = jcError || slError;

  const selectedDefaultCampaign = justcallCampaigns?.find(
    (c) => String(c.id) === defaultCampaignId
  );

  return (
    <div className="space-y-6">
      {/* Campaign Mappings */}
      <div className="space-y-3">
        <div>
          <Label className="text-base font-semibold">Campaign Mappings</Label>
          <p className="text-xs text-muted-foreground mt-1">
            Map each SmartLead campaign to a JustCall Sales Dialer campaign.
            When a webhook arrives, the SmartLead campaign ID is used to route
            contacts to the correct JustCall campaign.
          </p>
        </div>

        {campaignsLoading || mappingsLoading ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground py-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading campaigns...
          </div>
        ) : campaignsError ? (
          <div className="rounded-lg bg-red-50 dark:bg-red-500/10 p-3 text-sm text-red-800 dark:text-red-400">
            Failed to load campaigns. Ensure both SmartLead and JustCall
            credentials are configured in the Credentials tab.
          </div>
        ) : (
          <>
            {/* Existing mappings */}
            {mappings && mappings.length > 0 && (
              <div className="space-y-2">
                {mappings.map((mapping) => (
                  <div
                    key={mapping.id}
                    className="flex items-center gap-2 rounded-lg border bg-muted/30 px-3 py-2"
                  >
                    <div className="flex-1 min-w-0">
                      <span className="text-sm font-medium truncate block">
                        {mapping.sourceCampaignName ||
                          `Campaign ${mapping.sourceCampaignId}`}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        SmartLead #{mapping.sourceCampaignId}
                      </span>
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />
                    <div className="flex-1 min-w-0">
                      <span className="text-sm font-medium truncate block">
                        {mapping.destinationCampaignName ||
                          `Campaign ${mapping.destinationCampaignId}`}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        JustCall #{mapping.destinationCampaignId}
                      </span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 text-muted-foreground hover:text-red-600"
                      onClick={() => handleDeleteMapping(mapping.id)}
                      disabled={deleteMapping.isPending}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}

            {/* Add new mapping */}
            <div className="flex items-end gap-2">
              <div className="flex-1 space-y-1">
                <Label className="text-xs">SmartLead Campaign</Label>
                <Select
                  value={newSourceId}
                  onValueChange={(v) => setNewSourceId(v ?? '')}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select source..." />
                  </SelectTrigger>
                  <SelectContent>
                    {smartleadCampaigns?.map((c) => (
                      <SelectItem key={c.id} value={String(c.id)}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0 mb-2.5" />
              <div className="flex-1 space-y-1">
                <Label className="text-xs">JustCall Campaign</Label>
                <Select
                  value={newDestId}
                  onValueChange={(v) => setNewDestId(v ?? '')}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select destination..." />
                  </SelectTrigger>
                  <SelectContent>
                    {justcallCampaigns?.map((c) => (
                      <SelectItem key={c.id} value={String(c.id)}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button
                onClick={handleAddMapping}
                disabled={
                  !newSourceId || !newDestId || saveMapping.isPending
                }
                size="sm"
                className="shrink-0"
              >
                {saveMapping.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Plus className="h-4 w-4" />
                )}
                Add
              </Button>
            </div>
          </>
        )}
      </div>

      {/* Default / Fallback Campaign */}
      <div className="space-y-3 border-t pt-4">
        <div>
          <Label>Default JustCall Campaign</Label>
          <p className="text-xs text-muted-foreground mt-1">
            Fallback campaign used when no mapping matches the incoming
            SmartLead campaign.
          </p>
        </div>
        {!jcLoading && justcallCampaigns && (
          <div className="flex gap-2">
            <Select
              value={defaultCampaignId}
              onValueChange={(v) => setDefaultCampaignId(v ?? '')}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select a default campaign">
                  {selectedDefaultCampaign
                    ? selectedDefaultCampaign.name
                    : defaultCampaignId || 'Select a default campaign'}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {justcallCampaigns?.map((campaign) => (
                  <SelectItem key={campaign.id} value={String(campaign.id)}>
                    {campaign.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              onClick={handleSaveDefault}
              disabled={saving || !defaultCampaignId}
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
    </div>
  );
}

function GoogleSheetsConfig({ integration }: { integration: Integration }) {
  const queryClient = useQueryClient();
  const destConfig = (integration.destinationConfig ?? {}) as Record<
    string,
    string
  >;

  const [spreadsheetId, setSpreadsheetId] = useState(
    destConfig.spreadsheet_id ?? ''
  );
  const [sheetName, setSheetName] = useState(
    destConfig.sheet_name ?? 'Sheet1'
  );
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setSpreadsheetId(destConfig.spreadsheet_id ?? '');
    setSheetName(destConfig.sheet_name ?? 'Sheet1');
  }, [destConfig.spreadsheet_id, destConfig.sheet_name]);

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);
    try {
      await axios.patch(`/api/integrations/${integration.slug}`, {
        destinationConfig: {
          ...destConfig,
          spreadsheet_id: spreadsheetId,
          sheet_name: sheetName,
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

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Spreadsheet ID</Label>
        <p className="text-xs text-muted-foreground">
          The ID from your Google Sheets URL:
          https://docs.google.com/spreadsheets/d/<strong>SPREADSHEET_ID</strong>/edit
        </p>
        <Input
          placeholder="e.g. 1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgVE2upms"
          value={spreadsheetId}
          onChange={(e) => setSpreadsheetId(e.target.value)}
        />
      </div>
      <div className="space-y-2">
        <Label>Sheet Name</Label>
        <p className="text-xs text-muted-foreground">
          The name of the tab within the spreadsheet. Defaults to
          &quot;Sheet1&quot;.
        </p>
        <Input
          placeholder="Sheet1"
          value={sheetName}
          onChange={(e) => setSheetName(e.target.value)}
        />
      </div>
      <Button
        onClick={handleSave}
        disabled={saving || !spreadsheetId}
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
  );
}

function SmartleadHubspotConfig() {
  return (
    <div className="text-sm text-muted-foreground">
      <p>
        SmartLead contacts are automatically created or updated in HubSpot
        based on email address. No additional configuration is required.
      </p>
      <p className="mt-2">
        Ensure you have set your HubSpot Private App Token in the Credentials
        tab. The token needs the <strong>crm.objects.contacts.write</strong> and{' '}
        <strong>crm.objects.contacts.read</strong> scopes.
      </p>
    </div>
  );
}

export function ConfigForm({ integration }: { integration: Integration }) {
  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle>Destination Configuration</CardTitle>
        <CardDescription>
          Configure how data is sent to the destination service
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {integration.slug === 'justcall-googlesheets' ? (
          <GoogleSheetsConfig integration={integration} />
        ) : integration.slug === 'smartlead-hubspot' ? (
          <SmartleadHubspotConfig />
        ) : (
          <SmartleadJustcallConfig integration={integration} />
        )}
      </CardContent>
    </Card>
  );
}
