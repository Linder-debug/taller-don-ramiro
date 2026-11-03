import { useEffect, useState } from 'react';
import { Car, Wrench, Clock, CheckCircle2, AlertTriangle, Phone, ArrowLeft } from 'lucide-react';
import type { Store } from '@/lib/store';
import type { Order } from '@/types';
import { StatusBadge } from '@/components/StatusBadge';
import { StatusProgress } from '@/components/StatusProgress';
import { QuoteCard } from '@/components/QuoteCard';
import { STATUS_CONFIG } from '@/lib/status';
import { formatDateTime, timeAgo } from '@/lib/format';

function getTrackingParams() {
  const hashQuery = window.location.hash.includes('?') ? window.location.hash.split('?')[1] : '';
  const params = new URLSearchParams(hashQuery || window.location.search.slice(1));
  return { code: params.get('orden')?.trim() ?? '', token: params.get('t')?.trim() ?? '' };
}

export function ClientView({ store }: { store: Store }) {
  const initialLink = getTrackingParams();
  const [token, setToken] = useState(initialLink.token);
  const [found, setFound] = useState<Order | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(Boolean(initialLink.code || initialLink.token));
  const [deciding, setDeciding] = useState(false);

  const loadOrder = async (code: string, accessToken: string) => {
    setLoading(true);
    setError('');
    try {
      const order = await store.trackOrder(code.toUpperCase(), accessToken);
      if (!order) {
        setFound(null);
        setError('No encontramos una orden con ese enlace. Verifica la información e intenta de nuevo.');
        return;
      }
      setFound(order);
      setToken(accessToken);
    } catch (loadError) {
      setFound(null);
      setError(loadError instanceof Error ? loadError.message : 'No se pudo consultar la orden.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!initialLink.code && !initialLink.token) return;
    if (!initialLink.code || !initialLink.token) {
      setLoading(false);
      setError('Para consultar tu orden necesitas abrir el enlace completo enviado por el taller.');
      return;
    }
    void loadOrder(initialLink.code, initialLink.token);
  }, [store.trackOrder]);

  if (found) {
    return (
      <ClientOrderView
        order={found}
        busy={deciding}
        onDecide={async (decision) => {
          const approval = found.approvals.find((item) => item.status === 'pendiente');
          if (!approval || !token) return;
          setDeciding(true);
          try {
            await store.decideApproval(found.id, approval.id, decision, token);
            const updated = await store.trackOrder(found.code, token);
            if (updated) setFound(updated);
          } catch (decisionError) {
            setError(decisionError instanceof Error ? decisionError.message : 'No se pudo registrar la decisión.');
          } finally {
            setDeciding(false);
          }
        }}
        onBack={() => {
          setFound(null);
          setToken('');
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100">
      <header className="bg-slate-900 px-5 pb-8 pt-10 text-white">
        <div className="mx-auto max-w-md">
          <div className="flex items-center gap-2 text-emerald-400">
            <Wrench className="h-5 w-5" />
            <span className="text-sm font-semibold uppercase tracking-wider">Taller Don Ramiro</span>
          </div>
          <h1 className="mt-3 text-3xl font-extrabold leading-tight">Estado de tu vehículo</h1>
          <p className="mt-2 text-slate-300">Abre el enlace del taller para ver el estado y responder cotizaciones.</p>
        </div>
      </header>

      <main className="mx-auto -mt-4 max-w-md px-5">
        <div className="rounded-2xl bg-white p-4 shadow-lg ring-1 ring-slate-200">
          {loading && <p className="text-sm font-medium text-slate-500">Consultando tu orden…</p>}
          {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-700">{error}</p>}
          {!loading && (
            <div className={error ? 'mt-3' : ''}>
              <h2 className="text-base font-bold text-slate-900">¿Cómo consulto mi orden?</h2>
              <p className="mt-2 text-sm text-slate-600">
                Abre el enlace de seguimiento que el taller te envió por WhatsApp. Ese enlace ya incluye tu número de orden y un código privado, así que no necesitas buscar por placa ni por número de orden.
              </p>
              <p className="mt-2 text-sm text-slate-600">
                Si no encuentras el enlace, pídele al taller que te lo reenvíe.
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

function ClientOrderView({
  order,
  busy,
  onDecide,
  onBack,
}: {
  order: Order;
  busy: boolean;
  onDecide: (decision: 'aprobada' | 'rechazada') => Promise<void>;
  onBack: () => void;
}) {
  const cfg = STATUS_CONFIG[order.status];
  const pendingApproval = order.approvals.find((approval) => approval.status === 'pendiente');
  const needsAction = order.status === 'esperando_aprobacion' && Boolean(pendingApproval);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100">
      <header className={`px-5 pb-6 pt-8 text-white ${needsAction ? 'bg-orange-600' : 'bg-slate-900'}`}>
        <div className="mx-auto max-w-md">
          <button onClick={onBack} className="flex items-center gap-1 text-sm font-medium text-white/80 hover:text-white">
            <ArrowLeft className="h-4 w-4" /> Volver
          </button>
          {needsAction ? (
            <div className="mt-4">
              <div className="flex items-center gap-2 text-white"><AlertTriangle className="h-6 w-6" /><span className="text-sm font-bold uppercase tracking-wide">Acción requerida</span></div>
              <h1 className="mt-2 text-2xl font-extrabold">Tienes una cotización esperando tu aprobación</h1>
            </div>
          ) : (
            <div className="mt-4">
              <p className="text-sm font-medium text-slate-300">Tu carro está en:</p>
              <h1 className="mt-1 flex items-center gap-2 text-3xl font-extrabold"><span>{cfg.emoji}</span> {cfg.label}</h1>
            </div>
          )}
        </div>
      </header>

      <main className="mx-auto max-w-md space-y-5 px-5 py-6">
        <section className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100"><Car className="h-6 w-6 text-slate-600" /></div>
            <div className="flex-1">
              <p className="text-lg font-bold text-slate-900">{order.vehicle.make} {order.vehicle.model} {order.vehicle.year}</p>
              <p className="text-sm text-slate-500">Placa: <span className="font-semibold">{order.vehicle.plate}</span> · {order.vehicle.color}</p>
            </div>
          </div>
          <div className="mt-3 border-t border-slate-100 pt-3"><p className="text-xs font-semibold uppercase text-slate-400">Motivo de ingreso</p><p className="mt-1 text-sm text-slate-700">{order.complaint}</p></div>
          <div className="mt-3 grid grid-cols-2 gap-3 border-t border-slate-100 pt-3 text-sm"><div><p className="text-xs font-semibold uppercase text-slate-400">Orden</p><p className="font-bold text-slate-900">{order.code}</p></div><div><p className="text-xs font-semibold uppercase text-slate-400">Ingresó</p><p className="font-bold text-slate-900">{formatDateTime(order.createdAt)}</p></div></div>
        </section>

        {needsAction && pendingApproval && (
          <QuoteCard
            quote={{ id: pendingApproval.quoteId, detail: pendingApproval.quoteDetail, amount: pendingApproval.amount, createdAt: order.createdAt }}
            approval={pendingApproval}
            clientMode
            busy={busy}
            onDecide={onDecide}
          />
        )}

        {order.quotes.filter((quote) => order.approvals.some((approval) => approval.quoteId === quote.id && approval.status !== 'pendiente')).map((quote) => (
          <QuoteCard key={quote.id} quote={quote} approval={order.approvals.find((approval) => approval.quoteId === quote.id)} />
        ))}

        <section className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200"><h2 className="flex items-center gap-2 text-base font-bold text-slate-900"><CheckCircle2 className="h-5 w-5 text-emerald-500" /> Progreso de la reparación</h2><div className="mt-4"><StatusProgress current={order.status} /></div></section>
        <section className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200"><h2 className="flex items-center gap-2 text-base font-bold text-slate-900"><Clock className="h-5 w-5 text-slate-500" /> Historial</h2><ol className="mt-3 space-y-3">{[...order.history].reverse().map((history, index) => { const historyConfig = STATUS_CONFIG[history.status]; return <li key={`${history.at}-${index}`} className="flex gap-3"><span className={`mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ${historyConfig.dot}`} /><div><p className="text-sm font-semibold text-slate-800">{historyConfig.label}</p>{history.note && <p className="text-sm text-slate-600">{history.note}</p>}<p className="text-xs text-slate-400">{formatDateTime(history.at)} · {timeAgo(history.at)} {history.actor ? `· ${history.actor}` : ''}</p></div></li>; })}</ol></section>
        <section className="rounded-2xl bg-slate-900 p-4 text-white"><p className="text-sm text-slate-300">¿Tienes preguntas sobre tu carro?</p><a href="tel:8095550100" className="mt-2 flex items-center gap-2 text-lg font-bold text-emerald-400"><Phone className="h-5 w-5" /> Llamar al taller</a></section>
      </main>
    </div>
  );
}
