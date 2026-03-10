'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useSaveCredential, useCredentials } from '@/hooks/use-integrations';
import { Eye, EyeOff, Save } from 'lucide-react';

interface CredentialField {
  service: string;
  credentialType: string;
  label: string;
}

const SMARTLEAD_JUSTCALL_FIELDS: CredentialField[] = [
  { service: 'smartlead', credentialType: 'api_key', label: 'SmartLead API Key' },
  { service: 'smartlead', credentialType: 'webhook_secret', label: 'SmartLead Webhook Secret' },
  { service: 'justcall', credentialType: 'api_key', label: 'JustCall API Key' },
  { service: 'justcall', credentialType: 'api_secret', label: 'JustCall API Secret' },
];

export function CredentialForm({ slug }: { slug: string }) {
  const { data: credentials } = useCredentials(slug);
  const saveMutation = useSaveCredential();
  const [values, setValues] = useState<Record<string, string>>({});
  const [showValues, setShowValues] = useState<Record<string, boolean>>({});

  const fields = SMARTLEAD_JUSTCALL_FIELDS;

  const getMasked = (service: string, type: string) => {
    const cred = credentials?.find(
      (c) => c.service === service && c.credentialType === type
    );
    return cred?.maskedValue ?? '';
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
        },
      }
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>API Credentials</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {fields.map((field) => {
          const key = `${field.service}-${field.credentialType}`;
          const masked = getMasked(field.service, field.credentialType);

          return (
            <div key={key} className="space-y-2">
              <Label>{field.label}</Label>
              {masked && (
                <p className="text-xs text-muted-foreground font-mono">
                  Current: {masked}
                </p>
              )}
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Input
                    type={showValues[key] ? 'text' : 'password'}
                    placeholder={masked ? 'Enter new value to update' : 'Enter value'}
                    value={values[key] ?? ''}
                    onChange={(e) =>
                      setValues((prev) => ({ ...prev, [key]: e.target.value }))
                    }
                  />
                  <button
                    type="button"
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
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
                </div>
                <Button
                  size="sm"
                  onClick={() => handleSave(field)}
                  disabled={!values[key] || saveMutation.isPending}
                >
                  <Save className="h-4 w-4" />
                </Button>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
