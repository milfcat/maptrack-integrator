'use client';

import { useState } from 'react';
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
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  useRegistryKeys,
  useCreateRegistryKey,
  useUpdateRegistryKey,
  useDeleteRegistryKey,
} from '@/hooks/use-registry';
import { Plus, Eye, EyeOff, Pencil, Trash2, Key, KeyRound } from 'lucide-react';

const SERVICE_OPTIONS = [
  { value: 'smartlead', label: 'SmartLead' },
  { value: 'justcall', label: 'JustCall' },
];

const CREDENTIAL_TYPE_OPTIONS: Record<
  string,
  { value: string; label: string }[]
> = {
  smartlead: [
    { value: 'api_key', label: 'API Key' },
    { value: 'webhook_secret', label: 'Webhook Secret' },
  ],
  justcall: [
    { value: 'api_key', label: 'API Key' },
    { value: 'api_secret', label: 'API Secret' },
  ],
};

export function ApiKeyRegistry() {
  const { data: keys, isLoading } = useRegistryKeys();
  const createMutation = useCreateRegistryKey();
  const updateMutation = useUpdateRegistryKey();
  const deleteMutation = useDeleteRegistryKey();

  const [addOpen, setAddOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState({
    label: '',
    service: '',
    credentialType: '',
    value: '',
  });
  const [editForm, setEditForm] = useState({ label: '', value: '' });
  const [showValue, setShowValue] = useState(false);
  const [showEditValue, setShowEditValue] = useState(false);

  const resetForm = () => {
    setForm({ label: '', service: '', credentialType: '', value: '' });
    setShowValue(false);
  };

  const handleCreate = () => {
    createMutation.mutate(form, {
      onSuccess: () => {
        resetForm();
        setAddOpen(false);
      },
    });
  };

  const handleUpdate = () => {
    if (editId === null) return;
    const payload: { id: number; label?: string; value?: string } = {
      id: editId,
    };
    if (editForm.label) payload.label = editForm.label;
    if (editForm.value) payload.value = editForm.value;

    updateMutation.mutate(payload, {
      onSuccess: () => {
        setEditId(null);
        setEditForm({ label: '', value: '' });
        setShowEditValue(false);
      },
    });
  };

  const handleDelete = (id: number) => {
    deleteMutation.mutate(id);
  };

  const serviceLabel = (service: string) =>
    SERVICE_OPTIONS.find((s) => s.value === service)?.label ?? service;

  const typeLabel = (service: string, type: string) =>
    CREDENTIAL_TYPE_OPTIONS[service]?.find((t) => t.value === type)?.label ??
    type;

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between">
        <div>
          <CardTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            API Key Registry
          </CardTitle>
          <CardDescription className="mt-1">
            Store API keys centrally and link them to multiple integrations
          </CardDescription>
        </div>
        <Dialog
          open={addOpen}
          onOpenChange={(open) => {
            setAddOpen(open);
            if (!open) resetForm();
          }}
        >
          <DialogTrigger render={<Button size="sm" />}>
            <Plus className="h-4 w-4 mr-1" />
            Add Key
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add API Key to Registry</DialogTitle>
              <DialogDescription>
                Store a key once and reuse it across integrations.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3">
              <div>
                <Label>Label</Label>
                <Input
                  placeholder="e.g. Production JustCall"
                  value={form.label}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, label: e.target.value }))
                  }
                />
              </div>
              <div>
                <Label>Service</Label>
                <select
                  className="flex h-8 w-full rounded-lg border border-input bg-transparent px-2.5 py-1.5 text-sm"
                  value={form.service}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      service: e.target.value,
                      credentialType: '',
                    }))
                  }
                >
                  <option value="">Select service...</option>
                  {SERVICE_OPTIONS.map((s) => (
                    <option key={s.value} value={s.value}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </div>
              {form.service && (
                <div>
                  <Label>Credential Type</Label>
                  <select
                    className="flex h-8 w-full rounded-lg border border-input bg-transparent px-2.5 py-1.5 text-sm"
                    value={form.credentialType}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        credentialType: e.target.value,
                      }))
                    }
                  >
                    <option value="">Select type...</option>
                    {(CREDENTIAL_TYPE_OPTIONS[form.service] ?? []).map((t) => (
                      <option key={t.value} value={t.value}>
                        {t.label}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              <div>
                <Label>Value</Label>
                <div className="relative">
                  <Input
                    type={showValue ? 'text' : 'password'}
                    placeholder="Enter API key value"
                    value={form.value}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, value: e.target.value }))
                    }
                  />
                  <button
                    type="button"
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    onClick={() => setShowValue((v) => !v)}
                  >
                    {showValue ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button
                onClick={handleCreate}
                disabled={
                  !form.label ||
                  !form.service ||
                  !form.credentialType ||
                  !form.value ||
                  createMutation.isPending
                }
              >
                {createMutation.isPending ? 'Saving...' : 'Save Key'}
              </Button>
            </DialogFooter>
            {createMutation.isError && (
              <p className="text-sm text-destructive">
                {(createMutation.error as Error)?.message ??
                  'Failed to save key'}
              </p>
            )}
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="flex items-center justify-between rounded-lg border p-3">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-8 w-8 rounded-lg" />
                  <div className="space-y-1.5">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                </div>
                <Skeleton className="h-7 w-16" />
              </div>
            ))}
          </div>
        ) : !keys?.length ? (
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted mb-3">
              <KeyRound className="h-6 w-6 text-muted-foreground" />
            </div>
            <p className="text-sm font-medium">No keys registered</p>
            <p className="text-xs text-muted-foreground mt-1">
              Add an API key to get started
            </p>
          </div>
        ) : (
          <div className="space-y-0">
            {keys.map((key, i) => (
              <div key={key.id}>
                <div className="flex items-center justify-between py-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted">
                      <KeyRound className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">{key.label}</span>
                        <Badge variant="secondary" className="text-xs">
                          {serviceLabel(key.service)}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {typeLabel(key.service, key.credentialType)}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground font-mono">
                        {key.maskedValue}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Dialog
                      open={editId === key.id}
                      onOpenChange={(open) => {
                        if (open) {
                          setEditId(key.id);
                          setEditForm({ label: key.label, value: '' });
                          setShowEditValue(false);
                        } else {
                          setEditId(null);
                        }
                      }}
                    >
                      <DialogTrigger
                        render={<Button variant="ghost" size="icon-sm" />}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Update Registry Key</DialogTitle>
                          <DialogDescription>
                            Update the label or value for this key.
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-3">
                          <div>
                            <Label>Label</Label>
                            <Input
                              value={editForm.label}
                              onChange={(e) =>
                                setEditForm((f) => ({
                                  ...f,
                                  label: e.target.value,
                                }))
                              }
                            />
                          </div>
                          <div>
                            <Label>
                              New Value (leave blank to keep current)
                            </Label>
                            <div className="relative">
                              <Input
                                type={showEditValue ? 'text' : 'password'}
                                placeholder="Enter new value"
                                value={editForm.value}
                                onChange={(e) =>
                                  setEditForm((f) => ({
                                    ...f,
                                    value: e.target.value,
                                  }))
                                }
                              />
                              <button
                                type="button"
                                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                                onClick={() => setShowEditValue((v) => !v)}
                              >
                                {showEditValue ? (
                                  <EyeOff className="h-4 w-4" />
                                ) : (
                                  <Eye className="h-4 w-4" />
                                )}
                              </button>
                            </div>
                          </div>
                        </div>
                        <DialogFooter>
                          <Button
                            onClick={handleUpdate}
                            disabled={
                              (!editForm.label && !editForm.value) ||
                              updateMutation.isPending
                            }
                          >
                            {updateMutation.isPending ? 'Saving...' : 'Update'}
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => handleDelete(key.id)}
                      disabled={deleteMutation.isPending}
                    >
                      <Trash2 className="h-3.5 w-3.5 text-destructive" />
                    </Button>
                  </div>
                </div>
                {i < keys.length - 1 && <Separator />}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
