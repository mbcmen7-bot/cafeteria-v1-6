import { supabase } from '@/lib/supabase';
import type { ICafeteriasRepo } from '../contracts/ICafeteriasRepo';
import type { 
  Cafeteria, 
  MenuCategory, 
  MenuItem, 
  WaiterSection, 
  WaiterTable, 
  KitchenCategory 
} from '../../../lib/shared_mock_state';

export class SupabaseCafeteriasRepo implements ICafeteriasRepo {
  async getAll(): Promise<Cafeteria[]> {
    const { data, error } = await supabase.from('cafeterias').select('*');
    if (error) throw error;
    return (data || []).map(this.mapToCafeteria);
  }

  async getById(cafeteriaId: string): Promise<Cafeteria | undefined> {
    const { data, error } = await supabase
      .from('cafeterias')
      .select('*')
      .eq('id', cafeteriaId)
      .single();
    if (error) return undefined;
    return this.mapToCafeteria(data);
  }

  async updatePoints(cafeteriaId: string, pointsChange: number): Promise<Cafeteria | undefined> {
    const { data: current, error: fetchError } = await supabase
      .from('cafeterias')
      .select('points')
      .eq('id', cafeteriaId)
      .single();
    
    if (fetchError) throw fetchError;

    const newPoints = Number(current.points) + pointsChange;

    const { data, error } = await supabase
      .from('cafeterias')
      .update({ points: newPoints })
      .eq('id', cafeteriaId)
      .select()
      .single();

    if (error) throw error;
    return this.mapToCafeteria(data);
  }

  async updateTrialOverride(cafeteriaId: string, trialDays?: number): Promise<Cafeteria | undefined> {
    const { data, error } = await supabase
      .from('cafeterias')
      .update({ trial_days_override: trialDays })
      .eq('id', cafeteriaId)
      .select()
      .single();

    if (error) throw error;
    return this.mapToCafeteria(data);
  }

  // Menu operations
  async getMenuCategories(): Promise<MenuCategory[]> {
    const { data, error } = await supabase.from('menu_categories').select('*');
    if (error) throw error;
    return data || [];
  }

  async addMenuCategory(category: MenuCategory): Promise<MenuCategory> {
    const { data, error } = await supabase
      .from('menu_categories')
      .insert(category)
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  async getMenuItemsByCategoryId(categoryId: string): Promise<MenuItem[]> {
    const { data, error } = await supabase
      .from('menu_items')
      .select('*')
      .eq('category_id', categoryId);
    if (error) throw error;
    return (data || []).map(this.mapToMenuItem);
  }

  async getMenuItemById(itemId: string): Promise<MenuItem | undefined> {
    const { data, error } = await supabase
      .from('menu_items')
      .select('*')
      .eq('id', itemId)
      .single();
    if (error) return undefined;
    return this.mapToMenuItem(data);
  }

  async addMenuItem(item: MenuItem): Promise<MenuItem> {
    const { data, error } = await supabase
      .from('menu_items')
      .insert({
        id: item.id,
        category_id: item.categoryId,
        name: item.name,
        description: item.description,
        price: item.price,
        image_url: item.imageUrl,
        is_available: item.isAvailable,
        kitchen_category_id: item.kitchenCategoryId
      })
      .select()
      .single();
    if (error) throw error;
    return this.mapToMenuItem(data);
  }

  async updateMenuItemKitchenCategory(itemId: string, kitchenCategoryId: string): Promise<MenuItem | undefined> {
    const { data, error } = await supabase
      .from('menu_items')
      .update({ kitchen_category_id: kitchenCategoryId })
      .eq('id', itemId)
      .select()
      .single();
    if (error) throw error;
    return this.mapToMenuItem(data);
  }

  async getMenuItemsByKitchenCategory(kitchenCategoryId: string): Promise<MenuItem[]> {
    const { data, error } = await supabase
      .from('menu_items')
      .select('*')
      .eq('kitchen_category_id', kitchenCategoryId);
    if (error) throw error;
    return (data || []).map(this.mapToMenuItem);
  }

  // Waiter section operations
  async getWaiterSections(cafeteriaId: string): Promise<WaiterSection[]> {
    const { data, error } = await supabase
      .from('waiter_sections')
      .select('*')
      .eq('cafeteria_id', cafeteriaId);
    if (error) throw error;
    return (data || []).map(d => ({
      id: d.id,
      cafeteriaId: d.cafeteria_id,
      name: d.name,
      description: d.description
    }));
  }

  async addWaiterSection(section: WaiterSection): Promise<WaiterSection> {
    const { data, error } = await supabase
      .from('waiter_sections')
      .insert({
        id: section.id,
        cafeteria_id: section.cafeteriaId,
        name: section.name,
        description: section.description
      })
      .select()
      .single();
    if (error) throw error;
    return {
      id: data.id,
      cafeteriaId: data.cafeteria_id,
      name: data.name,
      description: data.description
    };
  }

  // Waiter table operations
  async getWaiterTables(cafeteriaId: string, sectionId?: string): Promise<WaiterTable[]> {
    let query = supabase
      .from('waiter_tables')
      .select('*')
      .eq('cafeteria_id', cafeteriaId);
    
    if (sectionId) {
      query = query.eq('section_id', sectionId);
    }

    const { data, error } = await query;
    if (error) throw error;
    return (data || []).map(d => ({
      id: d.id,
      cafeteriaId: d.cafeteria_id,
      sectionId: d.section_id,
      tableNumber: d.table_number,
      capacity: d.capacity,
      referenceCode: d.reference_code,
      is_active: d.is_active
    }));
  }

  async addWaiterTable(table: WaiterTable): Promise<WaiterTable> {
    const { data, error } = await supabase
      .from('waiter_tables')
      .insert({
        id: table.id,
        cafeteria_id: table.cafeteriaId,
        section_id: table.sectionId,
        table_number: table.tableNumber,
        capacity: table.capacity,
        reference_code: table.referenceCode,
        is_active: table.is_active
      })
      .select()
      .single();
    if (error) throw error;
    return {
      id: data.id,
      cafeteriaId: data.cafeteria_id,
      sectionId: data.section_id,
      tableNumber: data.table_number,
      capacity: data.capacity,
      referenceCode: data.reference_code,
      is_active: data.is_active
    };
  }

  async updateWaiterTableStatus(tableId: string, isActive: boolean): Promise<WaiterTable | undefined> {
    const { data, error } = await supabase
      .from('waiter_tables')
      .update({ is_active: isActive })
      .eq('id', tableId)
      .select()
      .single();
    if (error) throw error;
    return {
      id: data.id,
      cafeteriaId: data.cafeteria_id,
      sectionId: data.section_id,
      tableNumber: data.table_number,
      capacity: data.capacity,
      referenceCode: data.reference_code,
      is_active: data.is_active
    };
  }

  // Kitchen category operations
  async getKitchenCategories(cafeteriaId: string): Promise<KitchenCategory[]> {
    const { data, error } = await supabase
      .from('kitchen_categories')
      .select('*')
      .eq('cafeteria_id', cafeteriaId);
    if (error) throw error;
    return (data || []).map(d => ({
      id: d.id,
      cafeteriaId: d.cafeteria_id,
      name: d.name,
      description: d.description
    }));
  }

  async addKitchenCategory(category: KitchenCategory): Promise<KitchenCategory> {
    const { data, error } = await supabase
      .from('kitchen_categories')
      .insert({
        id: category.id,
        cafeteria_id: category.cafeteriaId,
        name: category.name,
        description: category.description
      })
      .select()
      .single();
    if (error) throw error;
    return {
      id: data.id,
      cafeteriaId: data.cafeteria_id,
      name: data.name,
      description: data.description
    };
  }

  private mapToCafeteria(data: any): Cafeteria {
    return {
      id: data.id,
      name: data.name,
      description: data.description,
      address: data.address,
      phone: data.phone,
      rating: Number(data.rating),
      reviewCount: data.review_count,
      imageUrl: data.image_url,
      latitude: Number(data.latitude),
      longitude: Number(data.longitude),
      isOpen: data.is_open,
      openingHours: data.opening_hours,
      points: Number(data.points),
      marketerId: data.marketer_id,
      isTrialExpired: data.is_trial_expired,
      trialDaysOverride: data.trial_days_override,
      code: data.code
    };
  }

  private mapToMenuItem(data: any): MenuItem {
    return {
      id: data.id,
      categoryId: data.category_id,
      name: data.name,
      description: data.description,
      price: Number(data.price),
      imageUrl: data.image_url,
      isAvailable: data.is_available,
      kitchenCategoryId: data.kitchen_category_id
    };
  }
}
