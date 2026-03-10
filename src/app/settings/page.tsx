'use client';

import { PageHeader } from '@/components/shared/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle } from 'lucide-react';

export default function SettingsPage() {
  return (
    <>
      <PageHeader
        title="Settings"
        description="Global platform configuration"
      />

      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>System Status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm">Database Connection</span>
              <Badge variant="outline" className="bg-green-100 text-green-800">
                <CheckCircle className="h-3 w-3 mr-1" />
                Connected
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Encryption Key</span>
              <Badge variant="outline" className="bg-green-100 text-green-800">
                <CheckCircle className="h-3 w-3 mr-1" />
                Configured
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Cron Job (every 2 min)</span>
              <Badge variant="outline" className="bg-green-100 text-green-800">
                <CheckCircle className="h-3 w-3 mr-1" />
                Active
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Environment</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p>
              <span className="text-muted-foreground">Platform:</span>{' '}
              MapTrack Integrator v0.1
            </p>
            <p>
              <span className="text-muted-foreground">Runtime:</span>{' '}
              Vercel Serverless
            </p>
            <p>
              <span className="text-muted-foreground">Database:</span>{' '}
              Neon PostgreSQL
            </p>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
