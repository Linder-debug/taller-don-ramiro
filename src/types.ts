export type OrderStatus =
  | 'recibido'
  | 'diagnostico'
  | 'en_reparacion'
  | 'esperando_aprobacion'
  | 'reparacion_adicional'
  | 'listo_para_recoger'
  | 'entregado';

export interface Client {
  id: string;
  name: string;
  phone: string;
}

export interface Vehicle {
  make: string;
  model: string;
  year: number;
  plate: string;
  color: string;
}

export interface Mechanic {
  id: string;
  name: string;
  specialty: string;
}

export interface Quote {
  id: string;
  detail: string;
  amount: number;
  photoUrl?: string;
  createdAt: string;
}

export type ApprovalStatus = 'pendiente' | 'aprobada' | 'rechazada';

export interface Approval {
  id: string;
  quoteId: string;
  quoteDetail: string;
  amount: number;
  clientName: string;
  status: ApprovalStatus;
  decidedAt?: string;
}

export interface StatusHistoryEntry {
  status: OrderStatus;
  at: string;
  note?: string;
  actor?: string;
}

export interface Order {
  id: string;
  code: string;
  clientId: string;
  clientName: string;
  vehicle: Vehicle;
  mechanicId: string | null;
  mechanicName: string | null;
  status: OrderStatus;
  complaint: string;
  createdAt: string;
  quotes: Quote[];
  approvals: Approval[];
  history: StatusHistoryEntry[];
}

export interface AppData {
  clients: Client[];
  mechanics: Mechanic[];
  orders: Order[];
}
