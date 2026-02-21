import type { IOrdersRepo } from '../contracts/IOrdersRepo';
import type { Order, OrderStatus } from '../../../lib/shared_mock_state';

/**
 * Postgres implementation of IOrdersRepo.
 * This implementation will be used by the API Simulator (FastAPI) 
 * via Python, but we define the TS class for architectural consistency 
 * and potential future use in a Node.js backend.
 */
export class PostgresOrdersRepo implements IOrdersRepo {
  private apiUrl: string;

  constructor(apiUrl: string = '/api') {
    this.apiUrl = apiUrl;
  }

  async getAll(): Promise<Order[]> {
    const response = await fetch(`${this.apiUrl}/orders`);
    return response.json();
  }

  async getById(orderId: string): Promise<Order | undefined> {
    const response = await fetch(`${this.apiUrl}/orders/${orderId}`);
    if (response.status === 404) return undefined;
    return response.json();
  }

  async getByCafeteriaId(cafeteriaId: string): Promise<Order[]> {
    const response = await fetch(`${this.apiUrl}/orders?cafeteria_id=${cafeteriaId}`);
    return response.json();
  }

  async create(order: Order): Promise<Order> {
    const response = await fetch(`${this.apiUrl}/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(order)
    });
    return response.json();
  }

  async updateStatus(orderId: string, newStatus: OrderStatus): Promise<Order | undefined> {
    const response = await fetch(`${this.apiUrl}/orders/${orderId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus })
    });
    if (response.status === 404) return undefined;
    return response.json();
  }
}
