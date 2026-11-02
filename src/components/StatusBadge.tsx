import type { OrderStatus } from '@/types';
import { STATUS_CONFIG } from '@/lib/status';

export function StatusBadge({ status, size = 'md' }: { status: OrderStatus; size?: 'sm' | 'md' | 'lg' }) {
  const cfg = STATUS_CONFIG[status];
  const pad = size === 'lg' ? 'px-4 py-2 text-base' : size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-sm';
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full font-semibold ring-1 ${cfg.badge} ${pad}`}>
      <span className={`h-2 w-2 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
}
