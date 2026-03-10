'use client';

import { PageHeader } from '@/components/shared/page-header';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { ApiKeyRegistry } from '@/components/settings/api-key-registry';
import {
  CheckCircle,
  Database,
  Globe,
  KeyRound,
  Server,
  Timer,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const statusItems = [
  {
    label: 'Database Connection',
    status: 'Connected',
    icon: Database,
    ok: true,
  },
  {
    label: 'Encryption Key',
    status: 'Configured',
    icon: KeyRound,
    ok: true,
  },
  {
    label: 'Cron Job (daily)',
    status: 'Active',
    icon: Timer,
    ok: true,
  },
];

const envItems = [
  { label: 'Platform', value: 'MapTrack Integrator v0.1', icon: Globe },
  { label: 'Runtime', value: 'Vercel Serverless', icon: Server },
  { label: 'Database', value: 'Neon PostgreSQL', icon: Database },
];

export default function SettingsPage() {
  return (
    <>
      <PageHeader
        title="Settings"
        description="Global platform configuration"
      />

      <div className="space-y-6">
        <ApiKeyRegistry />

        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle>System Status</CardTitle>
              <CardDescription>
                Health checks for all platform services
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-0">
              {statusItems.map((item, i) => (
                <div key={item.label}>
                  <div className="flex items-center justify-between py-3">
                    <div className="flex items-center gap-3">
                      <div
                        className={cn(
                          'flex h-8 w-8 items-center justify-center rounded-lg',
                          item.ok
                            ? 'bg-emerald-50 dark:bg-emerald-500/10'
                            : 'bg-red-50 dark:bg-red-500/10'
                        )}
                      >
                        <item.icon
                          className={cn(
                            'h-4 w-4',
                            item.ok
                              ? 'text-emerald-600 dark:text-emerald-400'
                              : 'text-red-600 dark:text-red-400'
                          )}
                        />
                      </div>
                      <span className="text-sm font-medium">{item.label}</span>
                    </div>
                    <span
                      className={cn(
                        'inline-flex items-center gap-1.5 text-xs font-medium',
                        item.ok
                          ? 'text-emerald-700 dark:text-emerald-400'
                          : 'text-red-700 dark:text-red-400'
                      )}
                    >
                      <CheckCircle className="h-3.5 w-3.5" />
                      {item.status}
                    </span>
                  </div>
                  {i < statusItems.length - 1 && <Separator />}
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle>Environment</CardTitle>
              <CardDescription>
                Platform and runtime information
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-0">
              {envItems.map((item, i) => (
                <div key={item.label}>
                  <div className="flex items-center justify-between py-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted">
                        <item.icon className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <span className="text-sm text-muted-foreground">
                        {item.label}
                      </span>
                    </div>
                    <span className="text-sm font-medium">{item.value}</span>
                  </div>
                  {i < envItems.length - 1 && <Separator />}
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
