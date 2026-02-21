import { OrderStatus } from '../../lib/shared_mock_state';

export const VALID_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  'pending': ['confirmed', 'cancelled'],
  'confirmed': ['preparing', 'cancelled'],
  'preparing': ['ready', 'cancelled'],
  'ready': ['served'],
  'served': ['paid'],
  'paid': [],
  'cancelled': []
};

// Compatibility for old status names if they appear
const STATUS_MAP: Record<string, OrderStatus> = {
  'created': 'pending',
  'sent_to_kitchen': 'confirmed'
};

export function isValidStatusTransition(oldStatus: OrderStatus, newStatus: OrderStatus): boolean {
  const normalizedOld = STATUS_MAP[oldStatus] || oldStatus;
  const normalizedNew = STATUS_MAP[newStatus] || newStatus;
  
  if (!VALID_TRANSITIONS[normalizedOld]) return false;
  return VALID_TRANSITIONS[normalizedOld].includes(normalizedNew);
}

export function isOrderImmutable(status: OrderStatus): boolean {
  return status === 'paid' || status === 'cancelled';
}
