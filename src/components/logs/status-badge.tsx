import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

const statusConfig: Record<string, { label: string; variant: string }> = {
  received: { label: 'Received', variant: 'bg-blue-100 text-blue-800' },
  processing: { label: 'Processing', variant: 'bg-yellow-100 text-yellow-800' },
  completed: { label: 'Completed', variant: 'bg-green-100 text-green-800' },
  failed: { label: 'Failed', variant: 'bg-red-100 text-red-800' },
  pending: { label: 'Pending', variant: 'bg-gray-100 text-gray-800' },
  success: { label: 'Success', variant: 'bg-green-100 text-green-800' },
};

export function StatusBadge({ status }: { status: string }) {
  const config = statusConfig[status] ?? {
    label: status,
    variant: 'bg-gray-100 text-gray-800',
  };

  return (
    <Badge variant="outline" className={cn('font-medium', config.variant)}>
      {config.label}
    </Badge>
  );
}
