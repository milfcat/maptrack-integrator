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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

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
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={formatted}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis dataKey="date" className="text-xs" />
            <YAxis className="text-xs" />
            <Tooltip />
            <Legend />
            <Bar
              dataKey="completed"
              fill="hsl(142, 76%, 36%)"
              name="Completed"
              radius={[2, 2, 0, 0]}
            />
            <Bar
              dataKey="failed"
              fill="hsl(0, 84%, 60%)"
              name="Failed"
              radius={[2, 2, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
