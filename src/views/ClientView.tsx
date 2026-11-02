import { useState } from 'react';
import { Search, Car, Wrench, Clock, CheckCircle2, AlertTriangle, Phone, ArrowLeft, FileText } from 'lucide-react';
import type { Store } from '@/lib/store';
import type { Order } from '@/types';
import { StatusBadge } from '@/components/StatusBadge';
import { StatusProgress } from '@/components/StatusProgress';
import { QuoteCard } from '@/components/QuoteCard';
import { STATUS_CONFIG, statusIndex } from '@/lib/status';
import { formatDateTime, timeAgo, elapsedSince, formatMoney } from '@/lib/format';

export function ClientView({ store }: { store: Store }) {
  const [query, setQuery] = useState('');
  const [found, setFound] = useState<Order | null>(null);
  const [error, setError] = useState('');

  const search = (e: React.FormEvent) => {
    e.preventDefault();
    const q = query.trim().toUpperCase();
    if (!q) return;
    const order = store.data.orders.find(
      (o) => o.code.toUpperCase() === q || o.vehicle.plate.toUpperCase() === q
    );
    if (order) {
      setFound(order);
      setError('');
    } else {
      setFound(null);
      setError('No encontramos una orden con ese código o placa. Verifica e intenta de nuevo.');
    }
  };

  const currentOrder = found ? store.data.orders.find((o) => o.id === found.id) ?? null : null;
  const pendingApproval = currentOrder?.approvals.find((a) => a.status === 'pendiente');

  if (currentOrder) {
    return (
      <ClientOrderView
        order={currentOrder}
        onDecide={(decision) => {
          const ap = currentOrder.approvals.find((a) => a.status === 'pendiente');
          if (ap) {
            store.decideApproval(currentOrder.id, ap.id, decision);
          }
        }}
        onBack={() => {
          setFound(null);
          setQuery('');
        }}
        pendingApprovalId={pendingApproval?.id}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100">
      <header className="bg-slate-900 px-5 pb-8 pt-10 text-white">
        <div className="mx-auto max-w-md">
          <div className="flex items-center gap-2 text-emerald-400">
            <Wrench className="h-5 w-5" />
            <span className="text-sm font-semibold uppercase tracking-wider">Taller de Don Ramiro</span>
          </div>
          <h1 className="mt-3 text-3xl font-extrabold leading-tight">Estado de tu vehículo</h1>
          <p className="mt-2 text-slate-300">Ingresa tu placa o número de orden para ver el estado en tiempo real.</p>
        </div>
      </header>

      <main className="mx-auto -mt-4 max-w-md px-5">
        <form onSubmit={search} className="rounded-2xl bg-white p-4 shadow-lg ring-1 ring-slate-200">
          <label className="block text-sm font-semibold text-slate-700">Placa o número de orden</label>
          <div className="mt-2 flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Ej: A123456 o TR-1043"
                className="w-full rounded-xl border-2 border-slate-200 py-3 pl-10 pr-3 text-lg font-medium text-slate-900 outline-none focus:border-emerald-500"
                autoCapitalize="characters"
              />
            </div>
            <button
              type="submit"
              className="rounded-xl bg-emerald-600 px-5 text-base font-bold text-white transition active:scale-95 hover:bg-emerald-500"
            >
              Buscar
            </button>
          </div>
          {error && <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-700">{error}</p>}
          <p className="mt-3 text-xs text-slate-400">
            Prueba: <strong>TR-1042</strong>, <strong>TR-1043</strong> o <strong>TR-1044</strong>
          </p>
        </form>

        <div className="mt-6 grid gap-3">
          {store.data.orders.slice(0, 3).map((o) => (
            <button
              key={o.id}
              onClick={() => setFound(o)}
              className="flex items-center justify-between rounded-xl bg-white px-4 py-3 text-left shadow-sm ring-1 ring-slate-200 transition hover:ring-emerald-300"
            >
              <div>
                <p className="font-bold text-slate-900">{o.code}</p>
                <p className="text-sm text-slate-500">{o.vehicle.make} {o.vehicle.model} · {o.vehicle.plate}</p>
              </div>
              <StatusBadge status={o.status} size="sm" />
            </button>
          ))}
        </div>
      </main>
    </div>
  );
}

function ClientOrderView({
  order,
  onDecide,
  onBack,
  pendingApprovalId,
}: {
  order: Order;
  onDecide: (d: 'aprobada' | 'rechazada') => void;
  onBack: () => void;
  pendingApprovalId?: string;
}) {
  const cfg = STATUS_CONFIG[order.status];
  const needsAction = order.status === 'esperando_aprobacion' && pendingApprovalId;

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100">
      <header className={`px-5 pb-6 pt-8 text-white ${needsAction ? 'bg-orange-600' : 'bg-slate-900'}`}>
        <div className="mx-auto max-w-md">
          <button onClick={onBack} className="flex items-center gap-1 text-sm font-medium text-white/80 hover:text-white">
            <ArrowLeft className="h-4 w-4" /> Volver
          </button>
          {needsAction ? (
            <div className="mt-4">
              <div className="flex items-center gap-2 text-white">
                <AlertTriangle className="h-6 w-6" />
                <span className="text-sm font-bold uppercase tracking-wide">Acción requerida</span>
              </div>
              <h1 className="mt-2 text-2xl font-extrabold">Tienes una cotización esperando tu aprobación</h1>
            </div>
          ) : (
            <div className="mt-4">
              <p className="text-sm font-medium text-slate-300">Tu carro está en:</p>
              <h1 className="mt-1 flex items-center gap-2 text-3xl font-extrabold">
                <span>{cfg.emoji}</span> {cfg.label}
              </h1>
            </div>
          )}
        </div>
      </header>

      <main className="mx-auto max-w-md space-y-5 px-5 py-6">
        {/* Vehicle card */}
        <section className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100">
              <Car className="h-6 w-6 text-slate-600" />
            </div>
            <div className="flex-1">
              <p className="text-lg font-bold text-slate-900">{order.vehicle.make} {order.vehicle.model} {order.vehicle.year}</p>
              <p className="text-sm text-slate-500">Placa: <span className="font-semibold">{order.vehicle.plate}</span> · {order.vehicle.color}</p>
            </div>
          </div>
          <div className="mt-3 border-t border-slate-100 pt-3">
            <p className="text-xs font-semibold uppercase text-slate-400">Motivo de ingreso</p>
            <p className="mt-1 text-sm text-slate-700">{order.complaint}</p>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-3 border-t border-slate-100 pt-3 text-sm">
            <div>
              <p className="text-xs font-semibold uppercase text-slate-400">Orden</p>
              <p className="font-bold text-slate-900">{order.code}</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase text-slate-400">Ingresó</p>
              <p className="font-bold text-slate-900">{formatDateTime(order.createdAt)}</p>
            </div>
          </div>
        </section>

        {/* Pending quote — prominent */}
        {needsAction &&
          order.quotes
            .filter((q) => order.approvals.find((a) => a.quoteId === q.id && a.status === 'pendiente'))
            .map((q) => {
              const ap = order.approvals.find((a) => a.quoteId === q.id);
              return (
                <QuoteCard key={q.id} quote={q} approval={ap} clientMode onDecide={onDecide} />
              );
            })}

        {/* Settled quotes */}
        {order.quotes
          .filter((q) => {
            const ap = order.approvals.find((a) => a.quoteId === q.id);
            return ap && ap.status !== 'pendiente';
          })
          .map((q) => {
            const ap = order.approvals.find((a) => a.quoteId === q.id);
            return <QuoteCard key={q.id} quote={q} approval={ap} />;
          })}

        {/* Status progress */}
        <section className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
          <h2 className="flex items-center gap-2 text-base font-bold text-slate-900">
            <CheckCircle2 className="h-5 w-5 text-emerald-500" /> Progreso de la reparación
          </h2>
          <div className="mt-4">
            <StatusProgress current={order.status} />
          </div>
        </section>

        {/* History timeline */}
        <section className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
          <h2 className="flex items-center gap-2 text-base font-bold text-slate-900">
            <Clock className="h-5 w-5 text-slate-500" /> Historial
          </h2>
          <ol className="mt-3 space-y-3">
            {[...order.history].reverse().map((h, i) => {
              const hc = STATUS_CONFIG[h.status];
              return (
                <li key={i} className="flex gap-3">
                  <span className={`mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ${hc.dot}`} />
                  <div>
                    <p className="text-sm font-semibold text-slate-800">{hc.label}</p>
                    {h.note && <p className="text-sm text-slate-600">{h.note}</p>}
                    <p className="text-xs text-slate-400">
                      {formatDateTime(h.at)} · {timeAgo(h.at)} {h.actor ? `· ${h.actor}` : ''}
                    </p>
                  </div>
                </li>
              );
            })}
          </ol>
        </section>

        {/* Contact */}
        <section className="rounded-2xl bg-slate-900 p-4 text-white">
          <p className="text-sm text-slate-300">¿Tienes preguntas sobre tu carro?</p>
          <a href="tel:8095550100" className="mt-2 flex items-center gap-2 text-lg font-bold text-emerald-400">
            <Phone className="h-5 w-5" /> Llamar al taller
          </a>
        </section>
      </main>
    </div>
  );
}
