import type { Order, OrderItem, OrderStatus } from '../../../lib/shared_mock_state';

/**
 * Repository contract for Order persistence operations.
 * Defines the minimal interface required for order data access.
 */
export interface IOrdersRepo {
  /**
   * Retrieve all orders.
   */
  getAll(): Promise<Order[]>;

  /**
   * Retrieve a single order by ID.
   */
  getById(orderId: string): Promise<Order | undefined>;

  /**
   * Retrieve all orders for a specific cafeteria.
   */
  getByCafeteriaId(cafeteriaId: string): Promise<Order[]>;

  /**
   * Create a new order.
   */
  create(order: Order): Promise<Order>;

  /**
   * Update an existing order's status.
   */
  updateStatus(orderId: string, newStatus: OrderStatus): Promise<Order | undefined>;
}
