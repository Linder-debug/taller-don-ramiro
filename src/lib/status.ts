import type { OrderStatus } from '@/types';

export interface StatusConfig {
  key: OrderStatus;
  label: string;
  short: string;
  emoji: string;
  /** tailwind classes for badge */
  badge: string;
  /** solid dot color */
  dot: string;
}

export const STATUS_ORDER: OrderStatus[] = [
  'recibido',
  'diagnostico',
  'en_reparacion',
  'esperando_aprobacion',
  'reparacion_adicional',
  'listo_para_recoger',
  'entregado',
];

export const STATUS_CONFIG: Record<OrderStatus, StatusConfig> = {
  recibido: {
    key: 'recibido',
    label: 'Recibido',
    short: 'Recibido',
    emoji: '📥',
    badge: 'bg-slate-100 text-slate-700 ring-slate-200',
    dot: 'bg-slate-400',
  },
  diagnostico: {
    key: 'diagnostico',
    label: 'En diagnóstico',
    short: 'Diagnóstico',
    emoji: '🔍',
    badge: 'bg-blue-100 text-blue-700 ring-blue-200',
    dot: 'bg-blue-500',
  },
  en_reparacion: {
    key: 'en_reparacion',
    label: 'En reparación',
    short: 'En reparación',
    emoji: '🔧',
    badge: 'bg-amber-100 text-amber-800 ring-amber-200',
    dot: 'bg-amber-500',
  },
  esperando_aprobacion: {
    key: 'esperando_aprobacion',
    label: 'Esperando aprobación',
    short: 'Esperando aprob.',
    emoji: '⏳',
    badge: 'bg-orange-100 text-orange-800 ring-orange-200',
    dot: 'bg-orange-500',
  },
  reparacion_adicional: {
    key: 'reparacion_adicional',
    label: 'Reparación adicional',
    short: 'Repar. adicional',
    emoji: '🛠️',
    badge: 'bg-teal-100 text-teal-800 ring-teal-200',
    dot: 'bg-teal-500',
  },
  listo_para_recoger: {
    key: 'listo_para_recoger',
    label: 'Listo para recoger',
    short: 'Listo',
    emoji: '✅',
    badge: 'bg-emerald-100 text-emerald-800 ring-emerald-200',
    dot: 'bg-emerald-500',
  },
  entregado: {
    key: 'entregado',
    label: 'Entregado',
    short: 'Entregado',
    emoji: '🚗',
    badge: 'bg-slate-200 text-slate-700 ring-slate-300',
    dot: 'bg-slate-500',
  },
};

/** Statuses a mechanic can advance to from a given status (forward moves). */
export const NEXT_STATUS: Partial<Record<OrderStatus, OrderStatus[]>> = {
  recibido: ['diagnostico'],
  diagnostico: ['en_reparacion', 'esperando_aprobacion'],
  en_reparacion: ['listo_para_recoger', 'esperando_aprobacion'],
  esperando_aprobacion: ['reparacion_adicional', 'listo_para_recoger'],
  reparacion_adicional: ['listo_para_recoger', 'en_reparacion'],
  listo_para_recoger: ['entregado'],
};

export const statusIndex = (s: OrderStatus) => STATUS_ORDER.indexOf(s);

export const isFinal = (s: OrderStatus) => s === 'entregado';
