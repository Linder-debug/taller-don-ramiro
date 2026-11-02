import { useCallback, useEffect, useState } from 'react';
import type { AppData, Order, OrderStatus, Quote, Approval } from '@/types';
import { seedData } from '@/data/mockData';
import { STATUS_CONFIG } from '@/lib/status';

const STORAGE_KEY = 'taller_don_ramiro_v1';

function load(): AppData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as AppData;
  } catch {
    /* ignore */
  }
  return structuredClone(seedData);
}

function persist(data: AppData) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    /* ignore */
  }
}

const uid = (prefix: string) => `${prefix}_${Math.random().toString(36).slice(2, 8)}`;
const newCode = (orders: Order[]) => {
  const max = orders.reduce((m, o) => {
    const n = parseInt(o.code.replace(/\D/g, ''), 10);
    return Number.isFinite(n) ? Math.max(m, n) : m;
  }, 1040);
  return `TR-${max + 1}`;
};

export function useStore() {
  const [data, setData] = useState<AppData>(() => load());

  useEffect(() => {
    persist(data);
  }, [data]);

  const updateOrder = useCallback((orderId: string, patch: (o: Order) => Order) => {
    setData((d) => ({ ...d, orders: d.orders.map((o) => (o.id === orderId ? patch(o) : o)) }));
  }, []);

  const changeStatus = useCallback(
    (orderId: string, status: OrderStatus, note?: string, actor?: string) => {
      updateOrder(orderId, (o) => ({
        ...o,
        status,
        history: [
          ...o.history,
          { status, at: new Date().toISOString(), note, actor },
        ],
      }));
    },
    [updateOrder]
  );

  const assignMechanic = useCallback(
    (orderId: string, mechanicId: string | null) => {
      updateOrder(orderId, (o) => {
        const mech = data.mechanics.find((m) => m.id === mechanicId);
        return { ...o, mechanicId, mechanicName: mech?.name ?? null };
      });
    },
    [updateOrder, data.mechanics]
  );

  const addQuote = useCallback(
    (orderId: string, quote: Omit<Quote, 'id' | 'createdAt'>, actor?: string) => {
      updateOrder(orderId, (o) => {
        const q: Quote = { ...quote, id: uid('q'), createdAt: new Date().toISOString() };
        const ap: Approval = {
          id: uid('a'),
          quoteId: q.id,
          quoteDetail: q.detail,
          amount: q.amount,
          clientName: o.clientName,
          status: 'pendiente',
        };
        return {
          ...o,
          quotes: [...o.quotes, q],
          approvals: [...o.approvals, ap],
          status: 'esperando_aprobacion',
          history: [
            ...o.history,
            {
              status: 'esperando_aprobacion',
              at: new Date().toISOString(),
              note: `Nueva cotización: ${q.detail.slice(0, 60)}…`,
              actor,
            },
          ],
        };
      });
    },
    [updateOrder]
  );

  const decideApproval = useCallback(
    (orderId: string, approvalId: string, decision: 'aprobada' | 'rechazada') => {
      updateOrder(orderId, (o) => {
        const ap = o.approvals.find((a) => a.id === approvalId);
        if (!ap || ap.status !== 'pendiente') return o;

        const decidedAt = new Date().toISOString();
        const approvals = o.approvals.map((a) =>
          a.id === approvalId ? { ...a, status: decision, decidedAt, clientName: o.clientName } : a
        );
        const nextStatus: OrderStatus = decision === 'aprobada' ? 'reparacion_adicional' : 'en_reparacion';
        const status = o.status === 'esperando_aprobacion' ? nextStatus : o.status;
        const note =
          decision === 'aprobada'
            ? `Cotización aprobada por el cliente (${ap.amount} DOP).`
            : 'Cotización rechazada por el cliente.';

        return {
          ...o,
          approvals,
          status,
          history: [...o.history, { status, at: decidedAt, note, actor: o.clientName }],
        };
      });
    },
    [updateOrder]
  );

  const createOrder = useCallback(
    (input: {
      clientName: string;
      clientPhone: string;
      vehicle: Order['vehicle'];
      complaint: string;
      mechanicId: string | null;
    }) => {
      let created: Order | null = null;
      setData((d) => {
        const clientId = uid('c');
        const orderId = uid('o');
        const mech = d.mechanics.find((m) => m.id === input.mechanicId);
        const order: Order = {
          id: orderId,
          code: newCode(d.orders),
          clientId,
          clientName: input.clientName,
          vehicle: input.vehicle,
          mechanicId: input.mechanicId,
          mechanicName: mech?.name ?? null,
          status: 'recibido',
          complaint: input.complaint,
          createdAt: new Date().toISOString(),
          quotes: [],
          approvals: [],
          history: [{ status: 'recibido', at: new Date().toISOString(), actor: 'Don Ramiro' }],
        };
        created = order;
        const client = { id: clientId, name: input.clientName, phone: input.clientPhone };
        return { ...d, clients: [...d.clients, client], orders: [order, ...d.orders] };
      });
      return created;
    },
    []
  );

  const resetData = useCallback(() => {
    const fresh = structuredClone(seedData);
    setData(fresh);
  }, []);

  return {
    data,
    changeStatus,
    assignMechanic,
    addQuote,
    decideApproval,
    createOrder,
    resetData,
  };
}

export type Store = ReturnType<typeof useStore>;

export { STATUS_CONFIG };
