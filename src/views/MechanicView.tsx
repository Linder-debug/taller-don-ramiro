import { useState } from 'react';
import { Wrench, ChevronRight, ClipboardList, RefreshCw, Check, Search } from 'lucide-react';
import type { Store } from '@/lib/store';
import type { Order, OrderStatus } from '@/types';
import { STATUS_CONFIG, STATUS_ORDER, statusIndex } from '@/lib/status';
import { StatusBadge } from '@/components/StatusBadge';
import { StatusActions } from '@/components/StatusActions';
import { elapsedSince, formatTime } from '@/lib/format';

export function MechanicView({ store }: { store: Store }) {
  const [mechId, setMechId] = useState<string | null>(null);
  const [active, setActive] = useState<Order | null>(null);
  const [filter, setFilter] = useState<'mine' | 'all'>('mine');
  const [search, setSearch] = useState('');

  const mech = store.data.mechanics.find((m) => m.id === mechId);
  const currentActive = active ? store.data.orders.find((o) => o.id === active.id) ?? null : null;

  if (!mechId) {
    return <MechanicLogin mechanics={store.data.mechanics} onPick={setMechId} />;
  }

  if (currentActive) {
    return (
      <MechanicOrder
        order={currentActive}
        mechName={mech?.name ?? ''}
        onBack={() => setActive(null)}
        onStatus={(s, note) => {
          store.changeStatus(currentActive.id, s, note, mech?.name);
          setActive(null);
        }}
      />
    );
  }

  const orders = store.data.orders.filter((o) => {
    if (filter === 'mine' && o.mechanicId !== mechId) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        o.code.toLowerCase().includes(q) ||
        o.vehicle.plate.toLowerCase().includes(q) ||
        o.clientName.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const myActive = store.data.orders.filter(
    (o) => o.mechanicId === mechId && o.status !== 'entregado'
  ).length;

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <header className="sticky top-0 z-10 border-b border-slate-800 bg-slate-900/95 px-4 py-4 backdrop-blur">
        <div className="mx-auto max-w-md">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Wrench className="h-5 w-5 text-emerald-400" />
              <span className="text-sm font-bold uppercase tracking-wider text-emerald-400">Panel del mecánico</span>
            </div>
            <button
              onClick={() => setMechId(null)}
              className="text-sm font-medium text-slate-400 hover:text-white"
            >
              Cambiar
            </button>
          </div>
          <h1 className="mt-2 text-2xl font-extrabold">Hola, {mech?.name}</h1>
          <p className="text-sm text-slate-400">{myActive} orden{myActive === 1 ? '' : 'es'} activa{myActive === 1 ? '' : 's'} asignada{myActive === 1 ? '' : 's'} a ti</p>
        </div>
      </header>

      <main className="mx-auto max-w-md px-4 py-4">
        {/* Search + filter */}
        <div className="mb-4 flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar placa u orden"
              className="w-full rounded-xl border-2 border-slate-700 bg-slate-800 py-2.5 pl-10 pr-3 text-base font-medium text-white placeholder-slate-500 outline-none focus:border-emerald-500"
            />
          </div>
        </div>
        <div className="mb-4 flex gap-2">
          <button
            onClick={() => setFilter('mine')}
            className={`flex-1 rounded-lg py-2 text-sm font-bold ${filter === 'mine' ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-400'}`}
          >
            Mis órdenes
          </button>
          <button
            onClick={() => setFilter('all')}
            className={`flex-1 rounded-lg py-2 text-sm font-bold ${filter === 'all' ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-400'}`}
          >
            Todas
          </button>
        </div>

        {orders.length === 0 ? (
          <div className="rounded-xl bg-slate-900 p-8 text-center">
            <ClipboardList className="mx-auto h-10 w-10 text-slate-600" />
            <p className="mt-2 font-semibold text-slate-400">No hay órdenes para mostrar.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {orders.map((o) => (
              <MechanicOrderRow key={o.id} order={o} mine={o.mechanicId === mechId} onClick={() => setActive(o)} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

function MechanicLogin({
  mechanics,
  onPick,
}: {
  mechanics: Store['data']['mechanics'];
  onPick: (id: string) => void;
}) {
  return (
    <div className="min-h-screen bg-slate-950 px-5 py-12 text-white">
      <div className="mx-auto max-w-md">
        <div className="flex items-center gap-2 text-emerald-400">
          <Wrench className="h-6 w-6" />
          <span className="text-sm font-bold uppercase tracking-wider">Panel del mecánico</span>
        </div>
        <h1 className="mt-3 text-3xl font-extrabold">¿Quién eres?</h1>
        <p className="mt-2 text-slate-400">Selecciona tu nombre para ver tus órdenes asignadas.</p>
        <div className="mt-6 space-y-3">
          {mechanics.map((m) => (
            <button
              key={m.id}
              onClick={() => onPick(m.id)}
              className="flex w-full items-center gap-4 rounded-2xl bg-slate-800 px-5 py-5 text-left transition active:scale-[0.98] hover:bg-slate-700"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-600 text-lg font-extrabold">
                {m.name.charAt(0)}
              </div>
              <div className="flex-1">
                <p className="text-xl font-bold">{m.name}</p>
                <p className="text-sm text-slate-400">{m.specialty}</p>
              </div>
              <ChevronRight className="h-6 w-6 text-slate-500" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function MechanicOrderRow({ order, mine, onClick }: { order: Order; mine: boolean; onClick: () => void }) {
  const cfg = STATUS_CONFIG[order.status];
  const latest = order.history[order.history.length - 1];
  return (
    <button
      onClick={onClick}
      className="flex w-full items-center gap-3 rounded-2xl border border-slate-800 bg-slate-900 px-4 py-4 text-left transition active:scale-[0.98] hover:border-emerald-700"
    >
      <div className="flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-xl bg-slate-800 text-2xl">
        {cfg.emoji}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="truncate text-base font-bold text-white">{order.vehicle.make} {order.vehicle.model}</p>
        </div>
        <p className="truncate text-sm text-slate-400">
          {order.code} · {order.vehicle.plate}
        </p>
        <div className="mt-1 flex items-center gap-2">
          <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ${cfg.badge}`}>
            <span className={`h-1.5 w-1.5 rounded-full ${cfg.dot}`} />
            {cfg.short}
          </span>
          {latest && <span className="text-xs text-slate-500">hace {elapsedSince(latest.at)}</span>}
        </div>
      </div>
      {!mine && <span className="rounded bg-slate-700 px-1.5 py-0.5 text-[10px] font-bold uppercase text-slate-300">otro</span>}
      <ChevronRight className="h-5 w-5 text-slate-600" />
    </button>
  );
}

function MechanicOrder({
  order,
  mechName,
  onBack,
  onStatus,
}: {
  order: Order;
  mechName: string;
  onBack: () => void;
  onStatus: (s: OrderStatus, note?: string) => void;
}) {
  const cfg = STATUS_CONFIG[order.status];
  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <header className="border-b border-slate-800 bg-slate-900 px-4 py-4">
        <div className="mx-auto max-w-md">
          <button onClick={onBack} className="text-sm font-medium text-slate-400 hover:text-white">
            ← Volver a la lista
          </button>
          <div className="mt-3 flex items-center gap-3">
            <span className="text-3xl">{cfg.emoji}</span>
            <div>
              <p className="text-xl font-extrabold">{order.vehicle.make} {order.vehicle.model}</p>
              <p className="text-sm text-slate-400">{order.code} · {order.vehicle.plate}</p>
            </div>
          </div>
          <div className="mt-3">
            <StatusBadge status={order.status} size="lg" />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-md space-y-5 px-4 py-5">
        <section className="rounded-2xl bg-slate-900 p-4">
          <p className="text-xs font-semibold uppercase text-slate-500">Cliente</p>
          <p className="text-base font-bold text-white">{order.clientName}</p>
          <p className="mt-2 text-xs font-semibold uppercase text-slate-500">Motivo de ingreso</p>
          <p className="text-sm text-slate-300">{order.complaint}</p>
        </section>

        <section>
          <h2 className="mb-3 flex items-center gap-2 text-lg font-bold">
            <RefreshCw className="h-5 w-5 text-emerald-400" /> Cambiar estado
          </h2>
          <StatusActions status={order.status} onPick={(s) => onStatus(s)} />
        </section>

        <section className="rounded-2xl bg-slate-900 p-4">
          <h2 className="mb-3 text-sm font-bold uppercase text-slate-500">Historial reciente</h2>
          <ol className="space-y-2">
            {[...order.history].reverse().slice(0, 5).map((h, i) => {
              const hc = STATUS_CONFIG[h.status];
              return (
                <li key={i} className="flex gap-2 text-sm">
                  <span className={`mt-1 h-2 w-2 shrink-0 rounded-full ${hc.dot}`} />
                  <div>
                    <span className="font-semibold text-white">{hc.label}</span>
                    {h.note && <p className="text-slate-400">{h.note}</p>}
                    <p className="text-xs text-slate-500">{formatTime(h.at)} {h.actor ? `· ${h.actor}` : ''}</p>
                  </div>
                </li>
              );
            })}
          </ol>
        </section>
      </main>
    </div>
  );
}
