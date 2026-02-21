import type { IOrdersRepo } from '../contracts/IOrdersRepo';
import type { Order, OrderStatus } from '../../../lib/shared_mock_state';

/**
 * In-memory implementation of IOrdersRepo.
 * Stores orders in a simple array.
 */
export class InMemoryOrdersRepo implements IOrdersRepo {
  private orders: Order[] = [];

  constructor(initialOrders: Order[] = []) {
    this.orders = initialOrders;
  }

  async getAll(): Promise<Order[]> {
    return [...this.orders];
  }

  async getById(orderId: string): Promise<Order | undefined> {
    return this.orders.find(o => o.id === orderId);
  }

  async getByCafeteriaId(cafeteriaId: string): Promise<Order[]> {
    return this.orders.filter(o => o.cafeteriaId === cafeteriaId);
  }

  async create(order: Order): Promise<Order> {
    this.orders.push(order);
    return order;
  }

  async updateStatus(orderId: string, newStatus: OrderStatus): Promise<Order | undefined> {
    const orderIndex = this.orders.findIndex(o => o.id === orderId);
    if (orderIndex === -1) return undefined;

    this.orders[orderIndex].status = newStatus;
    return this.orders[orderIndex];
  }

  // Internal method for persistence adapter
  _getBackingStore(): Order[] {
    return this.orders;
  }

  _setBackingStore(orders: Order[]): void {
    this.orders = orders;
  }
}
