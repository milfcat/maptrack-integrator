'use client';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

interface ActivityData {
  date: string;
  total: number;
  completed: number;
  failed: number;
}

export function ActivityChart({ data }: { data: ActivityData[] }) {
  const formatted = data.map((d) => ({
    ...d,
    date: new Date(d.date).toLocaleDateString('en-AU', {
      weekday: 'short',
      day: 'numeric',
    }),
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Weekly Activity</CardTitle>
        <CardDescription>Events processed over the last 7 days</CardDescription>
      </CardHeader>
      <CardContent>
        {formatted.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={formatted} barGap={2}>
              <CartesianGrid
                strokeDasharray="3 3"
                className="stroke-border"
                vertical={false}
              />
              <XAxis
                dataKey="date"
                className="text-xs"
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                className="text-xs"
                tickLine={false}
                axisLine={false}
                width={30}
              />
              <Tooltip
                contentStyle={{
                  borderRadius: '8px',
                  border: '1px solid var(--border)',
                  boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                  fontSize: '12px',
                }}
              />
              <Legend
                iconType="circle"
                iconSize={8}
                wrapperStyle={{ fontSize: '12px', paddingTop: '8px' }}
              />
              <Bar
                dataKey="completed"
                fill="oklch(0.65 0.18 155)"
                name="Completed"
                radius={[4, 4, 0, 0]}
              />
              <Bar
                dataKey="failed"
                fill="oklch(0.65 0.2 25)"
                name="Failed"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex h-[300px] items-center justify-center text-sm text-muted-foreground">
            No activity data available yet
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function ActivityChartSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-4 w-56" />
      </CardHeader>
      <CardContent>
        <div className="flex h-[300px] items-end gap-3 pb-6 pt-2">
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className="flex-1 flex flex-col gap-1 items-center">
              <Skeleton
                className="w-full rounded-t"
                style={{ height: `${40 + Math.random() * 60}%` }}
              />
              <Skeleton className="h-3 w-8 mt-2" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
