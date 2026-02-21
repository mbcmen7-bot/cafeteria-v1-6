import { supabase } from '@/lib/supabase';
import type { IOrdersRepo } from '../contracts/IOrdersRepo';
import type { Order, OrderStatus } from '../../../lib/shared_mock_state';

export class SupabaseOrdersRepo implements IOrdersRepo {
  async getAll(): Promise<Order[]> {
    const { data, error } = await supabase
      .from('orders')
      .select('*, order_items(*)');
    
    if (error) throw error;
    return (data || []).map(this.mapToOrder);
  }

  async getById(orderId: string): Promise<Order | undefined> {
    const { data, error } = await supabase
      .from('orders')
      .select('*, order_items(*)')
      .eq('id', orderId)
      .single();
    
    if (error) return undefined;
    return this.mapToOrder(data);
  }

  async getByCafeteriaId(cafeteriaId: string): Promise<Order[]> {
    const { data, error } = await supabase
      .from('orders')
      .select('*, order_items(*)')
      .eq('cafeteria_id', cafeteriaId);
    
    if (error) throw error;
    return (data || []).map(this.mapToOrder);
  }

  async create(order: Order): Promise<Order> {
    const { items, ...orderData } = order;
    
    // Insert order
    const { data: orderResult, error: orderError } = await supabase
      .from('orders')
      .insert({
        id: orderData.id,
        session_id: orderData.sessionId,
        cafeteria_id: orderData.cafeteriaId,
        status: orderData.status,
        total_amount: orderData.total,
        table_code: orderData.table_code,
        table_number_display: orderData.table_number_display,
        qr_payload: orderData.qr_payload ? JSON.stringify(orderData.qr_payload) : null
      })
      .select()
      .single();

    if (orderError) throw orderError;

    // Insert order items
    const orderItems = items.map(item => ({
      id: 'item_' + Math.random().toString(36).substr(2, 9),
      order_id: orderData.id,
      menu_item_id: item.menuItemId,
      name: item.name,
      price: item.price,
      quantity: item.quantity,
      notes: item.notes
    }));

    const { error: itemsError } = await supabase
      .from('order_items')
      .insert(orderItems);

    if (itemsError) throw itemsError;

    return order;
  }

  async updateStatus(orderId: string, newStatus: OrderStatus): Promise<Order | undefined> {
    const { data, error } = await supabase
      .from('orders')
      .update({ status: newStatus })
      .eq('id', orderId)
      .select('*, order_items(*)')
      .single();

    if (error) return undefined;
    return this.mapToOrder(data);
  }

  private mapToOrder(data: any): Order {
    return {
      id: data.id,
      sessionId: data.session_id,
      cafeteriaId: data.cafeteria_id,
      status: data.status,
      total: Number(data.total_amount),
      createdAt: new Date(data.created_at),

      table_code: data.table_code,
      table_number_display: data.table_number_display,
      items: (data.order_items || []).map((item: any) => ({
        menuItemId: item.menu_item_id,
        name: item.name,
        price: Number(item.price),
        quantity: item.quantity,
        notes: item.notes
      }))
    };
  }
}
