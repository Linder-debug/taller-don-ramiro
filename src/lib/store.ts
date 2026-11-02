import { useCallback, useState } from 'react';
import type { AppData, Approval, Order, OrderStatus, Quote } from '@/types';
import { STATUS_CONFIG } from '@/lib/status';
import { supabase } from '@/lib/supabase';

interface DbOrder {
  id: string;
  code: string;
  client_id: string;
  client_name: string;
  vehicle_make: string;
  vehicle_model: string;
  vehicle_year: number;
  vehicle_plate: string;
  vehicle_color: string;
  mechanic_id: string | null;
  mechanic_name: string | null;
  status: string;
  complaint: string;
  access_token: string;
  created_at: string;
}

interface DbClient { id: string; name: string; phone: string }
interface DbMechanic { id: string; name: string; specialty: string }
interface DbQuote { id: string; order_id: string; detail: string; amount: number; photo_url?: string | null; created_at: string }
interface DbApproval {
  id: string;
  quote_id: string;
  order_id: string;
  quote_detail: string;
  amount: number;
  client_name: string;
  status: Approval['status'];
  decided_at: string | null;
}
interface DbEvent { id: number; order_id: string; status: string; at: string; note?: string | null; actor?: string | null }
interface TrackingPayload { order?: DbOrder; quotes?: DbQuote[]; approvals?: DbApproval[]; events?: DbEvent[] }

const uid = (prefix: string) => `${prefix}_${Math.random().toString(36).slice(2, 8)}`;

function getTrackingPayload(value: unknown): TrackingPayload {
  const raw = Array.isArray(value) ? value[0] : value;
  if (!raw || typeof raw !== 'object') return {};
  const record = raw as Record<string, unknown>;
  return {
    order: (record.order ?? raw) as DbOrder,
    quotes: (record.quotes ?? []) as DbQuote[],
    approvals: (record.approvals ?? []) as DbApproval[],
    events: (record.events ?? []) as DbEvent[],
  };
}

function mapOrder(
  row: DbOrder,
  clients: DbClient[],
  quotes: DbQuote[],
  approvals: DbApproval[],
  events: DbEvent[],
): Order {
  const client = clients.find((item) => item.id === row.client_id);
  const orderQuotes = quotes.filter((quote) => quote.order_id === row.id).map((quote) => ({
    id: quote.id,
    detail: quote.detail,
    amount: Number(quote.amount),
    photoUrl: quote.photo_url ?? undefined,
    createdAt: quote.created_at,
  }));
  const orderApprovals = approvals.filter((approval) => approval.order_id === row.id).map((approval) => ({
    id: approval.id,
    quoteId: approval.quote_id,
    quoteDetail: approval.quote_detail,
    amount: Number(approval.amount),
    clientName: approval.client_name,
    status: approval.status,
    decidedAt: approval.decided_at ?? undefined,
  }));
  const history = events.filter((event) => event.order_id === row.id).sort((a, b) => a.at.localeCompare(b.at)).map((event) => ({
    status: event.status as OrderStatus,
    at: event.at,
    note: event.note ?? undefined,
    actor: event.actor ?? undefined,
  }));

  return {
    id: row.id,
    code: row.code,
    clientId: row.client_id,
    clientName: row.client_name,
    clientPhone: client?.phone,
    accessToken: row.access_token,
    vehicle: {
      make: row.vehicle_make,
      model: row.vehicle_model,
      year: row.vehicle_year,
      plate: row.vehicle_plate,
      color: row.vehicle_color,
    },
    mechanicId: row.mechanic_id,
    mechanicName: row.mechanic_name,
    status: row.status as OrderStatus,
    complaint: row.complaint,
    createdAt: row.created_at,
    quotes: orderQuotes,
    approvals: orderApprovals,
    history,
  };
}

async function readError<T>(result: { data: T; error: { message: string } | null }): Promise<T> {
  if (result.error) throw new Error(result.error.message);
  return result.data;
}

export function useStore() {
  const [data, setData] = useState<AppData>({ clients: [], mechanics: [], orders: [] });
  const [loading, setLoading] = useState(false);

  const loadWorkshopData = useCallback(async () => {
    setLoading(true);
    try {
      const [clientsResult, mechanicsResult, ordersResult, quotesResult, approvalsResult, eventsResult] = await Promise.all([
        supabase.from('clients').select('*'),
        supabase.from('mechanics').select('*'),
        supabase.from('orders').select('*').order('created_at', { ascending: false }),
        supabase.from('quotes').select('*').order('created_at', { ascending: true }),
        supabase.from('approvals').select('*'),
        supabase.from('order_events').select('*').order('at', { ascending: true }),
      ]);
      const clients = await readError(clientsResult) as DbClient[];
      const mechanics = await readError(mechanicsResult) as DbMechanic[];
      const orders = await readError(ordersResult) as DbOrder[];
      const quotes = await readError(quotesResult) as DbQuote[];
      const approvals = await readError(approvalsResult) as DbApproval[];
      const events = await readError(eventsResult) as DbEvent[];
      setData({
        clients,
        mechanics,
        orders: orders.map((order) => mapOrder(order, clients, quotes, approvals, events)),
      });
    } finally {
      setLoading(false);
    }
  }, []);

  const trackOrder = useCallback(async (code: string, token: string): Promise<Order | null> => {
    const result = await supabase.rpc('get_order_by_code_token', { p_code: code, p_token: token });
    const payload = getTrackingPayload(await readError(result));
    if (!payload.order?.id) return null;
    return mapOrder(payload.order, [], payload.quotes ?? [], payload.approvals ?? [], payload.events ?? []);
  }, []);

  const changeStatus = useCallback(async (orderId: string, status: OrderStatus, note?: string, actor?: string) => {
    const at = new Date().toISOString();
    await readError(await supabase.from('orders').update({ status }).eq('id', orderId));
    await readError(await supabase.from('order_events').insert({ order_id: orderId, status, at, note: note ?? null, actor: actor ?? null }));
    await loadWorkshopData();
  }, [loadWorkshopData]);

  const assignMechanic = useCallback(async (orderId: string, mechanicId: string | null) => {
    const mechanic = data.mechanics.find((item) => item.id === mechanicId);
    await readError(await supabase.from('orders').update({ mechanic_id: mechanicId, mechanic_name: mechanic?.name ?? null }).eq('id', orderId));
    await loadWorkshopData();
  }, [data.mechanics, loadWorkshopData]);

  const addQuote = useCallback(async (orderId: string, quote: Omit<Quote, 'id' | 'createdAt'>, actor?: string) => {
    const current = data.orders.find((order) => order.id === orderId);
    if (!current) throw new Error('No encontramos la orden.');
    const quoteId = uid('q');
    const approvalId = uid('a');
    const createdAt = new Date().toISOString();
    await readError(await supabase.from('quotes').insert({
      id: quoteId,
      order_id: orderId,
      detail: quote.detail,
      amount: quote.amount,
      photo_url: quote.photoUrl ?? null,
      created_at: createdAt,
    }));
    await readError(await supabase.from('approvals').insert({
      id: approvalId,
      quote_id: quoteId,
      order_id: orderId,
      quote_detail: quote.detail,
      amount: quote.amount,
      client_name: current.clientName,
      status: 'pendiente',
    }));
    await readError(await supabase.from('orders').update({ status: 'esperando_aprobacion' }).eq('id', orderId));
    await readError(await supabase.from('order_events').insert({
      order_id: orderId,
      status: 'esperando_aprobacion',
      at: createdAt,
      note: `Nueva cotización: ${quote.detail.slice(0, 60)}…`,
      actor: actor ?? null,
    }));
    await loadWorkshopData();
  }, [data.orders, loadWorkshopData]);

  const decideApproval = useCallback(async (_orderId: string, approvalId: string, decision: 'aprobada' | 'rechazada', token?: string) => {
    if (!token) throw new Error('El enlace de seguimiento no es válido.');
    await readError(await supabase.rpc('submit_approval_decision', {
      p_token: token,
      p_approval_id: approvalId,
      p_decision: decision,
    }));
  }, []);

  const createOrder = useCallback(async (input: {
    clientName: string;
    clientPhone: string;
    vehicle: Order['vehicle'];
    complaint: string;
    mechanicId: string | null;
  }): Promise<Order> => {
    const mechanic = data.mechanics.find((item) => item.id === input.mechanicId);
    const clientId = uid('c');
    const orderId = uid('o');
    const codeNumber = data.orders.reduce((max, order) => {
      const number = Number.parseInt(order.code.replace(/\D/g, ''), 10);
      return Number.isFinite(number) ? Math.max(max, number) : max;
    }, 1040) + 1;
    const code = `TR-${codeNumber}`;
    const accessToken = crypto.randomUUID();
    const createdAt = new Date().toISOString();

    await readError(await supabase.from('clients').insert({ id: clientId, name: input.clientName, phone: input.clientPhone }));
    const orderRow = await readError(await supabase.from('orders').insert({
      id: orderId,
      code,
      client_id: clientId,
      client_name: input.clientName,
      vehicle_make: input.vehicle.make,
      vehicle_model: input.vehicle.model,
      vehicle_year: input.vehicle.year,
      vehicle_plate: input.vehicle.plate,
      vehicle_color: input.vehicle.color,
      mechanic_id: input.mechanicId,
      mechanic_name: mechanic?.name ?? null,
      status: 'recibido',
      complaint: input.complaint,
      access_token: accessToken,
      created_at: createdAt,
    }).select().maybeSingle()) as DbOrder | null;
    if (!orderRow) throw new Error('No se pudo crear la orden.');
    await readError(await supabase.from('order_events').insert({ order_id: orderId, status: 'recibido', at: createdAt, actor: 'Don Ramiro' }));
    await loadWorkshopData();
    return mapOrder(orderRow, [{ id: clientId, name: input.clientName, phone: input.clientPhone }], [], [], []);
  }, [data.mechanics, data.orders, loadWorkshopData]);

  const resetData = useCallback(async () => {
    await loadWorkshopData();
  }, [loadWorkshopData]);

  return {
    data,
    loading,
    loadWorkshopData,
    trackOrder,
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
