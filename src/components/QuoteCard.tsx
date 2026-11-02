import type { Quote, Approval } from '@/types';
import { formatMoney, formatDateTime } from '@/lib/format';

interface Props {
  quote: Quote;
  approval?: Approval;
  /** client mode shows big approve/reject buttons */
  clientMode?: boolean;
  onDecide?: (decision: 'aprobada' | 'rechazada') => void | Promise<void>;
  busy?: boolean;
}

export function QuoteCard({ quote, approval, clientMode, onDecide, busy = false }: Props) {
  const status = approval?.status ?? 'pendiente';
  const pending = status === 'pendiente';

  return (
    <div className="overflow-hidden rounded-2xl border-2 border-orange-300 bg-orange-50">
      <div className="border-b border-orange-200 bg-orange-100 px-4 py-3">
        <p className="text-sm font-bold uppercase tracking-wide text-orange-800">
          Cotización de reparación adicional
        </p>
      </div>
      <div className="p-4">
        <p className="text-base text-slate-800">{quote.detail}</p>

        {quote.photoUrl && (
          <img
            src={quote.photoUrl}
            alt="Foto de la reparación"
            className="mt-3 w-full rounded-xl object-cover"
          />
        )}

        <div className="mt-4 flex items-baseline justify-between">
          <span className="text-sm font-medium text-slate-500">Monto</span>
          <span className="text-2xl font-extrabold text-slate-900">{formatMoney(quote.amount)}</span>
        </div>

        <div className="mt-3">
          {status === 'pendiente' && !clientMode && (
            <div className="rounded-lg bg-orange-100 px-3 py-2 text-sm font-semibold text-orange-800">
              Esperando respuesta del cliente…
            </div>
          )}

          {status === 'pendiente' && clientMode && onDecide && (
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => onDecide('aprobada')}
                disabled={busy}
                className="min-h-12 rounded-xl bg-emerald-600 px-4 py-4 text-lg font-bold text-white shadow-sm transition active:scale-95 hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Aprobar
              </button>
              <button
                onClick={() => onDecide('rechazada')}
                disabled={busy}
                className="min-h-12 rounded-xl bg-red-600 px-4 py-4 text-lg font-bold text-white shadow-sm transition active:scale-95 hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Rechazar
              </button>
            </div>
          )}

          {status === 'aprobada' && (
            <div className="rounded-lg bg-emerald-100 px-3 py-2 text-sm font-semibold text-emerald-800">
              Aprobada por {approval?.clientName} · {approval?.decidedAt ? formatDateTime(approval.decidedAt) : ''}
            </div>
          )}

          {status === 'rechazada' && (
            <div className="rounded-lg bg-red-100 px-3 py-2 text-sm font-semibold text-red-800">
              Rechazada por {approval?.clientName} · {approval?.decidedAt ? formatDateTime(approval.decidedAt) : ''}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
