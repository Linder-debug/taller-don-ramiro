import { STATUS_ORDER, STATUS_CONFIG, statusIndex, isFinal } from '@/lib/status';
import type { OrderStatus } from '@/types';

export function StatusProgress({ current }: { current: OrderStatus }) {
  const idx = statusIndex(current);
  return (
    <ol className="relative space-y-0">
      {STATUS_ORDER.map((s, i) => {
        const done = i <= idx;
        const isCur = i === idx;
        const cfg = STATUS_CONFIG[s];
        return (
          <li key={s} className="flex gap-3 pb-3 last:pb-0">
            <div className="flex flex-col items-center">
              <span
                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                  done ? 'text-white' : 'bg-slate-100 text-slate-400'
                }`}
                style={done ? { backgroundColor: 'currentColor' } : undefined}
              >
                <span className={`block h-3.5 w-3.5 rounded-full ${done ? cfg.dot : 'bg-slate-200'}`} />
              </span>
              {i < STATUS_ORDER.length - 1 && (
                <span className={`mt-0.5 h-full w-0.5 ${i < idx ? cfg.dot : 'bg-slate-200'}`} style={{ minHeight: 14 }} />
              )}
            </div>
            <div className="pt-0.5">
              <p className={`text-sm font-semibold ${isCur ? 'text-slate-900' : done ? 'text-slate-700' : 'text-slate-400'}`}>
                {cfg.label}
                {isCur && <span className="ml-2 text-xs font-normal text-slate-500">(actual)</span>}
              </p>
            </div>
          </li>
        );
      })}
      {isFinal(current) && (
        <li className="pt-1 text-xs font-medium text-emerald-600">Orden cerrada.</li>
      )}
    </ol>
  );
}
