import { useState } from 'react';
import {
  Wrench, Plus, ClipboardList, Users, AlertTriangle, CheckCircle2, X, Car,
  UserCog, FileText, Clock, Phone, Trash2, RefreshCw, MessageCircle,
} from 'lucide-react';
import type { Store } from '@/lib/store';
import type { Order, OrderStatus } from '@/types';
import { StatusBadge } from '@/components/StatusBadge';
import { QuoteCard } from '@/components/QuoteCard';
import { STATUS_CONFIG, statusIndex, STATUS_ORDER } from '@/lib/status';
import { formatDateTime, timeAgo, formatMoney, elapsedSince } from '@/lib/format';
import { openWhatsApp } from '@/lib/whatsapp';

export function AdminView({ store }: { store: Store }) {
  const [tab, setTab] = useState<'ordenes' | 'pendientes' | 'nueva'>('ordenes');
  const [active, setActive] = useState<Order | null>(null);

  if (active) {
    return <AdminOrderDetail order={active} store={store} onBack={() => setActive(null)} />;
  }

  const pending = store.data.orders.filter((o) => o.approvals.some((a) => a.status === 'pendiente'));

  return (
    <div className="min-h-screen bg-slate-100">
      <header className="bg-slate-900 px-5 pb-6 pt-8 text-white">
        <div className="mx-auto max-w-2xl">
          <div className="flex items-center gap-2 text-emerald-400">
            <Wrench className="h-5 w-5" />
            <span className="text-sm font-semibold uppercase tracking-wider">Taller Don Ramiro</span>
          </div>
          <h1 className="mt-2 text-3xl font-extrabold">Panel de administración</h1>
          <p className="mt-1 text-slate-300">Don Ramiro — gestiona órdenes, mecánicos y cotizaciones.</p>
        </div>
        <nav className="mx-auto mt-5 flex max-w-2xl gap-2">
          {([
            ['ordenes', 'Órdenes', ClipboardList],
            ['pendientes', `Aprobaciones${pending.length ? ` (${pending.length})` : ''}`, AlertTriangle],
            ['nueva', 'Nueva orden', Plus],
          ] as const).map(([key, label, Icon]) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2.5 text-sm font-bold transition ${
                tab === key ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              <Icon className="h-4 w-4" /> {label}
            </button>
          ))}
        </nav>
      </header>

      <main className="mx-auto max-w-2xl px-5 py-6">
        {tab === 'ordenes' && <AdminOrdersList orders={store.data.orders} onOpen={setActive} />}
        {tab === 'pendientes' && <AdminPending orders={pending} onOpen={setActive} />}
        {tab === 'nueva' && <NewOrderForm store={store} onCreated={(o) => { setActive(o); setTab('ordenes'); }} />}
      </main>
    </div>
  );
}

function AdminOrdersList({ orders, onOpen }: { orders: Order[]; onOpen: (o: Order) => void }) {
  return (
    <div className="space-y-3">
      {orders.map((o) => {
        const cfg = STATUS_CONFIG[o.status];
        const latest = o.history[o.history.length - 1];
        const hasPending = o.approvals.some((a) => a.status === 'pendiente');
        return (
          <div key={o.id} className="flex w-full items-center gap-3 rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-200 transition hover:ring-emerald-300">
            <button onClick={() => onOpen(o)} className="flex min-w-0 flex-1 items-center gap-3 text-left">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-xl">{cfg.emoji}</div>
              <div className="min-w-0 flex-1">
                <p className="font-bold text-slate-900">{o.vehicle.make} {o.vehicle.model} <span className="font-normal text-slate-400">· {o.vehicle.plate}</span></p>
                <p className="text-sm text-slate-500">{o.code} · {o.clientName} · {o.mechanicName ?? 'Sin asignar'}</p>
                <div className="mt-1.5 flex items-center gap-2"><StatusBadge status={o.status} size="sm" />{hasPending && <span className="rounded-full bg-orange-100 px-2 py-0.5 text-xs font-bold text-orange-700">Cotización pendiente</span>}</div>
              </div>
              {latest && <span className="hidden text-xs text-slate-400 sm:block">{elapsedSince(latest.at)}</span>}
            </button>
            <button onClick={() => openWhatsApp(o)} aria-label={`Escribir por WhatsApp a ${o.clientName}`} className="flex min-h-12 shrink-0 items-center gap-1.5 rounded-xl bg-green-600 px-3 text-sm font-bold text-white hover:bg-green-500"><MessageCircle className="h-4 w-4" /> <span className="hidden sm:inline">WhatsApp</span></button>
          </div>
        );
      })}
    </div>
  );
}

function AdminPending({ orders, onOpen }: { orders: Order[]; onOpen: (o: Order) => void }) {
  if (orders.length === 0) {
    return (
      <div className="rounded-xl bg-white p-10 text-center shadow-sm ring-1 ring-slate-200">
        <CheckCircle2 className="mx-auto h-10 w-10 text-emerald-500" />
        <p className="mt-2 font-bold text-slate-700">No hay cotizaciones pendientes.</p>
        <p className="text-sm text-slate-400">Todo al día.</p>
      </div>
    );
  }
  return (
    <div className="space-y-3">
      {orders.map((o) => {
        const ap = o.approvals.find((a) => a.status === 'pendiente');
        return (
          <div key={o.id} className="flex w-full items-center gap-3 rounded-xl border-2 border-orange-200 bg-orange-50 p-4 transition hover:border-orange-400">
            <button onClick={() => onOpen(o)} className="flex min-w-0 flex-1 items-center gap-3 text-left">
              <AlertTriangle className="h-6 w-6 shrink-0 text-orange-500" />
              <div className="min-w-0 flex-1"><p className="font-bold text-slate-900">{o.vehicle.make} {o.vehicle.model} · {o.vehicle.plate}</p><p className="text-sm text-slate-600">{o.code} · {o.clientName}</p>{ap && <p className="mt-1 text-sm font-semibold text-orange-800">Cotización: {formatMoney(ap.amount)}</p>}</div>
            </button>
            <button onClick={() => openWhatsApp(o)} aria-label={`Escribir por WhatsApp a ${o.clientName}`} className="flex min-h-12 shrink-0 items-center gap-1.5 rounded-xl bg-green-600 px-3 text-sm font-bold text-white hover:bg-green-500"><MessageCircle className="h-4 w-4" /><span className="hidden sm:inline">WhatsApp</span></button>
          </div>
        );
      })}
    </div>
  );
}

function NewOrderForm({ store, onCreated }: { store: Store; onCreated: (o: Order) => void }) {
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [make, setMake] = useState('');
  const [model, setModel] = useState('');
  const [year, setYear] = useState('');
  const [plate, setPlate] = useState('');
  const [color, setColor] = useState('');
  const [complaint, setComplaint] = useState('');
  const [mechanicId, setMechanicId] = useState<string>('');
  const [err, setErr] = useState('');
  const [saving, setSaving] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientName || !make || !model || !plate || !complaint) {
      setErr('Completa cliente, vehículo (marca, modelo, placa) y motivo.');
      return;
    }
    setSaving(true);
    try {
      const order = await store.createOrder({
        clientName,
        clientPhone,
        vehicle: { make, model, year: parseInt(year) || new Date().getFullYear(), plate, color: color || 'N/A' },
        complaint,
        mechanicId: mechanicId || null,
      });
      onCreated(order);
    } catch (createError) {
      setErr(createError instanceof Error ? createError.message : 'No se pudo crear la orden.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-5 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
      <h2 className="text-lg font-bold text-slate-900">Datos del cliente</h2>
      <Field label="Nombre del cliente" value={clientName} onChange={setClientName} placeholder="Ej: María Fernández" />
      <Field label="Teléfono" value={clientPhone} onChange={setClientPhone} placeholder="809-555-0000" />

      <h2 className="pt-2 text-lg font-bold text-slate-900">Datos del vehículo</h2>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Marca" value={make} onChange={setMake} placeholder="Toyota" />
        <Field label="Modelo" value={model} onChange={setModel} placeholder="Corolla" />
        <Field label="Año" value={year} onChange={setYear} placeholder="2018" />
        <Field label="Color" value={color} onChange={setColor} placeholder="Plateado" />
      </div>
      <Field label="Placa" value={plate} onChange={setPlate} placeholder="A123456" autoCapitalize="characters" />

      <h2 className="pt-2 text-lg font-bold text-slate-900">Reparación</h2>
      <div>
        <label className="block text-sm font-semibold text-slate-700">Motivo de ingreso</label>
        <textarea
          value={complaint}
          onChange={(e) => setComplaint(e.target.value)}
          rows={3}
          placeholder="Describe el problema reportado por el cliente"
          className="mt-1 w-full rounded-xl border-2 border-slate-200 p-3 text-base outline-none focus:border-emerald-500"
        />
      </div>
      <div>
        <label className="block text-sm font-semibold text-slate-700">Asignar mecánico (opcional)</label>
        <select
          value={mechanicId}
          onChange={(e) => setMechanicId(e.target.value)}
          className="mt-1 w-full rounded-xl border-2 border-slate-200 p-3 text-base outline-none focus:border-emerald-500"
        >
          <option value="">Sin asignar</option>
          {store.data.mechanics.map((m) => (
            <option key={m.id} value={m.id}>{m.name} — {m.specialty}</option>
          ))}
        </select>
      </div>

      {err && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-700">{err}</p>}

      <button
        type="submit"
        disabled={saving}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 py-4 text-lg font-bold text-white transition active:scale-95 hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-60"
      >
        <Plus className="h-5 w-5" /> Crear orden
      </button>
    </form>
  );
}

function Field({
  label, value, onChange, placeholder, autoCapitalize,
}: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string; autoCapitalize?: string;
}) {
  return (
    <div>
      <label className="block text-sm font-semibold text-slate-700">{label}</label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoCapitalize={autoCapitalize as React.HTMLAttributes<HTMLInputElement>['autoCapitalize']}
        className="mt-1 w-full rounded-xl border-2 border-slate-200 p-3 text-base outline-none focus:border-emerald-500"
      />
    </div>
  );
}

function AdminOrderDetail({ order, store, onBack }: { order: Order; store: Store; onBack: () => void }) {
  const [showQuote, setShowQuote] = useState(false);
  const current = store.data.orders.find((o) => o.id === order.id) ?? order;

  return (
    <div className="min-h-screen bg-slate-100">
      <header className="bg-slate-900 px-5 pb-5 pt-6 text-white">
        <div className="mx-auto max-w-2xl">
          <button onClick={onBack} className="text-sm font-medium text-slate-400 hover:text-white">← Volver</button>
          <div className="mt-3 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-800 text-xl">
              {STATUS_CONFIG[current.status].emoji}
            </div>
            <div>
              <h1 className="text-2xl font-extrabold">{current.vehicle.make} {current.vehicle.model}</h1>
              <p className="text-sm text-slate-300">{current.code} · {current.vehicle.plate} · {current.vehicle.year}</p>
            </div>
          </div>
          <div className="mt-3 flex items-center justify-between gap-3">
            <StatusBadge status={current.status} size="lg" />
            <button onClick={() => openWhatsApp(current)} className="flex min-h-12 items-center gap-2 rounded-xl bg-green-600 px-4 text-sm font-bold text-white hover:bg-green-500">
              <MessageCircle className="h-5 w-5" /> WhatsApp
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-2xl space-y-5 px-5 py-6">
        {/* Info grid */}
        <section className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <Info icon={Car} label="Vehículo" value={`${current.vehicle.make} ${current.vehicle.model} ${current.vehicle.year}`} />
            <Info icon={FileText} label="Color" value={current.vehicle.color} />
            <Info icon={Users} label="Cliente" value={current.clientName} />
            <Info icon={Phone} label="Teléfono" value={current.clientPhone ?? 'No registrado'} />
          </div>
          <div className="mt-3 border-t border-slate-100 pt-3">
            <p className="text-xs font-semibold uppercase text-slate-400">Motivo de ingreso</p>
            <p className="mt-1 text-sm text-slate-700">{current.complaint}</p>
          </div>
        </section>

        {/* Mechanic assignment */}
        <section className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
          <h2 className="flex items-center gap-2 text-base font-bold text-slate-900">
            <UserCog className="h-5 w-5 text-slate-500" /> Mecánico asignado
          </h2>
          <select
            value={current.mechanicId ?? ''}
            onChange={(e) => { void store.assignMechanic(current.id, e.target.value || null); }}
            className="mt-3 w-full rounded-xl border-2 border-slate-200 p-3 text-base outline-none focus:border-emerald-500"
          >
            <option value="">Sin asignar</option>
            {store.data.mechanics.map((m) => (
              <option key={m.id} value={m.id}>{m.name} — {m.specialty}</option>
            ))}
          </select>
        </section>

        {/* Quick status changer */}
        <section className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
          <h2 className="flex items-center gap-2 text-base font-bold text-slate-900">
            <RefreshCw className="h-5 w-5 text-slate-500" /> Cambiar estado manualmente
          </h2>
          <div className="mt-3 flex flex-wrap gap-2">
            {STATUS_ORDER.map((s) => (
              <button
                key={s}
                onClick={() => { void store.changeStatus(current.id, s, 'Cambio manual', 'Don Ramiro'); }}
                className={`rounded-lg px-3 py-1.5 text-sm font-semibold transition ${
                  current.status === s
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {STATUS_CONFIG[s].label}
              </button>
            ))}
          </div>
        </section>

        {/* Quotes */}
        <section className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
          <div className="flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-base font-bold text-slate-900">
              <FileText className="h-5 w-5 text-slate-500" /> Cotizaciones
            </h2>
            <button
              onClick={() => setShowQuote(true)}
              className="flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-1.5 text-sm font-bold text-white hover:bg-emerald-500"
            >
              <Plus className="h-4 w-4" /> Nueva cotización
            </button>
          </div>
          <div className="mt-3 space-y-3">
            {current.quotes.length === 0 && <p className="text-sm text-slate-400">Sin cotizaciones.</p>}
            {current.quotes.map((q) => {
              const ap = current.approvals.find((a) => a.quoteId === q.id);
              return <QuoteCard key={q.id} quote={q} approval={ap} />;
            })}
          </div>
        </section>

        {/* History */}
        <section className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
          <h2 className="flex items-center gap-2 text-base font-bold text-slate-900">
            <Clock className="h-5 w-5 text-slate-500" /> Historial completo
          </h2>
          <ol className="mt-3 space-y-3">
            {[...current.history].reverse().map((h, i) => {
              const hc = STATUS_CONFIG[h.status];
              return (
                <li key={i} className="flex gap-3">
                  <span className={`mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ${hc.dot}`} />
                  <div>
                    <p className="text-sm font-semibold text-slate-800">{hc.label}</p>
                    {h.note && <p className="text-sm text-slate-600">{h.note}</p>}
                    <p className="text-xs text-slate-400">{formatDateTime(h.at)} · {timeAgo(h.at)} {h.actor ? `· ${h.actor}` : ''}</p>
                  </div>
                </li>
              );
            })}
          </ol>
        </section>

        <div className="flex justify-center pt-2">
          <button
            onClick={() => { void store.resetData(); }}
            className="flex items-center gap-1.5 text-xs font-medium text-slate-400 hover:text-red-500"
          >
            <Trash2 className="h-3.5 w-3.5" /> Restablecer datos de ejemplo
          </button>
        </div>
      </main>

      {showQuote && (
        <NewQuoteModal
          onClose={() => setShowQuote(false)}
          onSubmit={async (detail, amount) => {
            await store.addQuote(current.id, { detail, amount }, 'Don Ramiro');
            setShowQuote(false);
          }}
        />
      )}
    </div>
  );
}

function Info({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
  return (
    <div>
      <p className="flex items-center gap-1 text-xs font-semibold uppercase text-slate-400">
        <Icon className="h-3.5 w-3.5" /> {label}
      </p>
      <p className="mt-0.5 font-semibold text-slate-800">{value}</p>
    </div>
  );
}

function NewQuoteModal({ onClose, onSubmit }: { onClose: () => void; onSubmit: (detail: string, amount: number) => Promise<void> }) {
  const [detail, setDetail] = useState('');
  const [amount, setAmount] = useState('');
  const [err, setErr] = useState('');

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(amount);
    if (!detail || !amt || amt <= 0) {
      setErr('Describe la reparación y un monto válido.');
      return;
    }
    await onSubmit(detail, amt);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-0 sm:items-center sm:p-4" onClick={onClose}>
      <div
        className="w-full max-w-md rounded-t-2xl bg-white p-5 shadow-xl sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-slate-900">Nueva cotización</h3>
          <button onClick={onClose} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100"><X className="h-5 w-5" /></button>
        </div>
        <form onSubmit={submit} className="mt-4 space-y-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700">Detalle de la reparación</label>
            <textarea
              value={detail}
              onChange={(e) => setDetail(e.target.value)}
              rows={4}
              placeholder="Ej: Pastillas de freno delanteras gastadas. Cambiar ambas pastillas y rectificar discos."
              className="mt-1 w-full rounded-xl border-2 border-slate-200 p-3 text-base outline-none focus:border-emerald-500"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700">Monto (DOP)</label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="8500"
              className="mt-1 w-full rounded-xl border-2 border-slate-200 p-3 text-base outline-none focus:border-emerald-500"
            />
          </div>
          {err && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-700">{err}</p>}
          <button
            type="submit"
            className="w-full rounded-xl bg-emerald-600 py-3.5 text-base font-bold text-white transition active:scale-95 hover:bg-emerald-500"
          >
            Enviar cotización al cliente
          </button>
        </form>
      </div>
    </div>
  );
}
