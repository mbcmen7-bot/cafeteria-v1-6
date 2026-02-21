import { 
  mockState, 
  type Cafeteria, 
  type MenuCategory, 
  type MenuItem, 
  type Order, 
  type OrderItem, 
  type OrderStatus 
} from "./shared_mock_state";

export type { Cafeteria, MenuCategory, MenuItem, Order, OrderItem, OrderStatus };

// Generate a random session ID
export function generateSessionId(): string {
  return `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// Get cafeteria by ID
export async function getCafeteriaById(id: string): Promise<Cafeteria | undefined> {
  return await mockState.getCafeteriaById(id);
}

// Get all cafeterias
export async function getCafeterias(): Promise<Cafeteria[]> {
  return await mockState.getCafeterias();
}

// Get menu for a cafeteria
export async function getMenuForCafeteria(cafeteriaId: string): Promise<{ categories: MenuCategory[], items: MenuItem[] }> {
  const categories = await mockState.getMenuCategories();
  const items = (await Promise.all(categories.map(cat => mockState.getMenuItemsByCategoryId(cat.id)))).flat();
  return {
    categories,
    items
  };
}

// Create a new order
export async function createOrder(sessionId: string, cafeteriaId: string, items: OrderItem[], payload: { cafeteria_code: string, table_code: string, table_number_display: string, version: string }): Promise<Order> {
  return await mockState.createOrder(sessionId, cafeteriaId, items, payload);
}

// Get order by session ID
export async function getOrderBySession(sessionId: string): Promise<Order | undefined> {
  const orders = await mockState.getOrders();
  return orders.find(o => o.sessionId === sessionId);
}

// Update order status
export async function updateOrderStatus(orderId: string, status: OrderStatus, actorId?: string, actorRole?: string): Promise<Order | undefined> {
  return await mockState.updateOrderStatus(orderId, status, actorId, actorRole as any);
}

// Get all orders
export async function getAllOrders(): Promise<Order[]> {
  return await mockState.getOrders();
}

// Clear all orders (for testing)
export function clearOrders(): void {
  mockState.reset();
}
