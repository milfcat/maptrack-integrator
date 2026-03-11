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
import { Separator } from '@/components/ui/separator';
import { useSaveCredential, useCredentials } from '@/hooks/use-integrations';
import { useRegistryKeys } from '@/hooks/use-registry';
import { Check, Eye, EyeOff, KeyRound, Link, Save } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CredentialField {
  service: string;
  credentialType: string;
  label: string;
  multiline?: boolean;
}

const CREDENTIAL_FIELDS_MAP: Record<string, CredentialField[]> = {
  'smartlead-justcall': [
    {
      service: 'smartlead',
      credentialType: 'api_key',
      label: 'SmartLead API Key',
    },
    {
      service: 'smartlead',
      credentialType: 'webhook_secret',
      label: 'SmartLead Webhook Secret',
    },
    {
      service: 'justcall',
      credentialType: 'api_key',
      label: 'JustCall API Key',
    },
    {
      service: 'justcall',
      credentialType: 'api_secret',
      label: 'JustCall API Secret',
    },
  ],
  'justcall-googlesheets': [
    {
      service: 'justcall',
      credentialType: 'api_key',
      label: 'JustCall API Key',
    },
    {
      service: 'justcall',
      credentialType: 'api_secret',
      label: 'JustCall API Secret',
    },
    {
      service: 'googlesheets',
      credentialType: 'service_account_json',
      label: 'Google Service Account JSON',
      multiline: true,
    },
  ],
};

export function CredentialForm({ slug }: { slug: string }) {
  const { data: credentials } = useCredentials(slug);
  const { data: registryKeys } = useRegistryKeys();
  const saveMutation = useSaveCredential();
  const [values, setValues] = useState<Record<string, string>>({});
  const [showValues, setShowValues] = useState<Record<string, boolean>>({});
  const [savedKeys, setSavedKeys] = useState<Set<string>>(new Set());

  const fields = CREDENTIAL_FIELDS_MAP[slug] ?? CREDENTIAL_FIELDS_MAP['smartlead-justcall'];

  const getCredential = (service: string, type: string) => {
    return credentials?.find(
      (c) => c.service === service && c.credentialType === type
    );
  };

  const getMatchingRegistryKeys = (service: string, credentialType: string) => {
    return (
      registryKeys?.filter(
        (k) => k.service === service && k.credentialType === credentialType
      ) ?? []
    );
  };

  const handleSave = (field: CredentialField) => {
    const key = `${field.service}-${field.credentialType}`;
    const value = values[key];
    if (!value) return;

    saveMutation.mutate(
      {
        slug,
        service: field.service,
        credentialType: field.credentialType,
        value,
      },
      {
        onSuccess: () => {
          setValues((prev) => ({ ...prev, [key]: '' }));
          setSavedKeys((prev) => new Set(prev).add(key));
          setTimeout(() => {
            setSavedKeys((prev) => {
              const next = new Set(prev);
              next.delete(key);
              return next;
            });
          }, 2000);
        },
      }
    );
  };

  const handleLinkRegistry = (field: CredentialField, registryKeyId: number) => {
    const key = `${field.service}-${field.credentialType}`;

    saveMutation.mutate(
      {
        slug,
        service: field.service,
        credentialType: field.credentialType,
        registryKeyId,
      },
      {
        onSuccess: () => {
          setValues((prev) => ({ ...prev, [key]: '' }));
          setSavedKeys((prev) => new Set(prev).add(key));
          setTimeout(() => {
            setSavedKeys((prev) => {
              const next = new Set(prev);
              next.delete(key);
              return next;
            });
          }, 2000);
        },
      }
    );
  };

  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle>API Credentials</CardTitle>
        <CardDescription>
          Securely store API keys and secrets for connected services. Use the
          registry to link shared keys.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-0">
        {fields.map((field, i) => {
          const key = `${field.service}-${field.credentialType}`;
          const cred = getCredential(field.service, field.credentialType);
          const masked = cred?.maskedValue ?? '';
          const isLinked = !!cred?.registryKeyId;
          const isSaved = savedKeys.has(key);
          const matchingKeys = getMatchingRegistryKeys(
            field.service,
            field.credentialType
          );

          return (
            <div key={key}>
              <div className="py-4 first:pt-0">
                <div className="flex items-start gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted mt-0.5">
                    <KeyRound className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="flex-1 space-y-2">
                    <div>
                      <Label className="text-sm font-medium">
                        {field.label}
                      </Label>
                      {masked && (
                        <div className="flex items-center gap-2 mt-0.5">
                          <p className="text-xs text-muted-foreground font-mono">
                            Current: {masked}
                          </p>
                          {isLinked && (
                            <Badge
                              variant="secondary"
                              className="text-[10px] gap-1 h-4 px-1.5"
                            >
                              <Link className="h-2.5 w-2.5" />
                              {cred?.registryLabel ?? 'Registry'}
                            </Badge>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Registry key linking */}
                    {matchingKeys.length > 0 && !isLinked && (
                      <select
                        className="flex h-7 w-full rounded-md border border-input bg-transparent px-2 text-xs text-muted-foreground"
                        defaultValue=""
                        onChange={(e) => {
                          const regId = parseInt(e.target.value, 10);
                          if (regId) handleLinkRegistry(field, regId);
                          e.target.value = '';
                        }}
                      >
                        <option value="">Link from registry...</option>
                        {matchingKeys.map((rk) => (
                          <option key={rk.id} value={rk.id}>
                            {rk.label} ({rk.maskedValue})
                          </option>
                        ))}
                      </select>
                    )}

                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        {field.multiline ? (
                          <textarea
                            className="flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring font-mono"
                            placeholder={
                              isLinked
                                ? 'Paste JSON to override registry link'
                                : masked
                                  ? 'Paste new JSON to update'
                                  : 'Paste service account JSON here'
                            }
                            value={values[key] ?? ''}
                            onChange={(e) =>
                              setValues((prev) => ({
                                ...prev,
                                [key]: e.target.value,
                              }))
                            }
                          />
                        ) : (
                          <>
                            <Input
                              type={showValues[key] ? 'text' : 'password'}
                              placeholder={
                                isLinked
                                  ? 'Enter value to override registry link'
                                  : masked
                                    ? 'Enter new value to update'
                                    : 'Enter value'
                              }
                              value={values[key] ?? ''}
                              onChange={(e) =>
                                setValues((prev) => ({
                                  ...prev,
                                  [key]: e.target.value,
                                }))
                              }
                            />
                            <button
                              type="button"
                              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                              onClick={() =>
                                setShowValues((prev) => ({
                                  ...prev,
                                  [key]: !prev[key],
                                }))
                              }
                            >
                              {showValues[key] ? (
                                <EyeOff className="h-4 w-4" />
                              ) : (
                                <Eye className="h-4 w-4" />
                              )}
                            </button>
                          </>
                        )}
                      </div>
                      <Button
                        size="sm"
                        variant={isSaved ? 'outline' : 'default'}
                        onClick={() => handleSave(field)}
                        disabled={
                          !values[key] || saveMutation.isPending || isSaved
                        }
                        className={cn(isSaved && 'text-emerald-600')}
                      >
                        {isSaved ? (
                          <Check className="h-4 w-4" />
                        ) : (
                          <Save className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
              {i < fields.length - 1 && <Separator />}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
