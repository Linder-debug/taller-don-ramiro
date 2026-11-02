import type { Order } from '@/types';

export function trackingUrl(order: Order) {
  const base = `${window.location.origin}${window.location.pathname}`;
  return `${base}#/seguimiento?orden=${encodeURIComponent(order.code)}&t=${encodeURIComponent(order.accessToken ?? '')}`;
}

export function openWhatsApp(order: Order) {
  const phone = (order.clientPhone ?? '').replace(/\D/g, '');
  if (!phone || !order.accessToken) return;
  const message = `Hola ${order.clientName}, aquí puedes consultar el estado de tu orden ${order.code}: ${trackingUrl(order)}`;
  window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, '_blank', 'noopener,noreferrer');
}
