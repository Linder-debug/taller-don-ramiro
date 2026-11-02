import type { OrderStatus } from '@/types';
import { NEXT_STATUS, STATUS_CONFIG } from '@/lib/status';

interface Props {
  status: OrderStatus;
  onPick: (s: OrderStatus) => void;
}

export function StatusActions({ status, onPick }: Props) {
  const next = NEXT_STATUS[status] ?? [];
  if (next.length === 0) {
    return <p className="text-sm font-medium text-slate-400">No hay cambios disponibles.</p>;
  }
  return (
    <div className="grid gap-3">
      {next.map((s) => {
        const cfg = STATUS_CONFIG[s];
        return (
          <button
            key={s}
            onClick={() => onPick(s)}
            className="group flex items-center gap-3 rounded-xl border-2 border-slate-700 bg-slate-800 px-4 py-5 text-left transition active:scale-[0.98] hover:border-emerald-500 hover:bg-slate-700/50"
          >
            <span className="text-2xl">{cfg.emoji}</span>
            <span className="flex-1">
              <span className="block text-lg font-bold text-white">Pasar a: {cfg.label}</span>
              <span className="text-sm text-slate-400">Toca para confirmar</span>
            </span>
            <span className="text-slate-500 transition group-hover:text-emerald-400">→</span>
          </button>
        );
      })}
    </div>
  );
}
