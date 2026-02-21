import { supabase } from '@/lib/supabase';
import type { IStaffRepo } from '../contracts/IStaffRepo';
import type { Staff, WaiterSession } from '../../../lib/shared_mock_state';

export class SupabaseStaffRepo implements IStaffRepo {
  async getByCafeteriaId(cafeteriaId: string): Promise<Staff[]> {
    const { data, error } = await supabase
      .from('staff')
      .select('*')
      .eq('cafeteria_id', cafeteriaId);
    if (error) throw error;
    return (data || []).map(this.mapToStaff);
  }

  async getById(staffId: string): Promise<Staff | undefined> {
    const { data, error } = await supabase
      .from('staff')
      .select('*')
      .eq('id', staffId)
      .single();
    if (error) return undefined;
    return this.mapToStaff(data);
  }

  async create(staff: Staff): Promise<Staff> {
    const { data, error } = await supabase
      .from('staff')
      .insert({
        id: staff.id,
        cafeteria_id: staff.cafeteriaId,
        name: staff.name,
        role: staff.role,
        is_active: staff.isActive,
        kitchen_category_id: staff.kitchenCategoryId
      })
      .select()
      .single();
    if (error) throw error;
    return this.mapToStaff(data);
  }

  async updateStatus(staffId: string, isActive: boolean): Promise<Staff | undefined> {
    const { data, error } = await supabase
      .from('staff')
      .update({ is_active: isActive })
      .eq('id', staffId)
      .select()
      .single();
    if (error) throw error;
    return this.mapToStaff(data);
  }

  async setWaiterSession(waiterId: string, sectionId: string, cafeteriaId: string): Promise<void> {
    const { error } = await supabase
      .from('waiter_sessions')
      .upsert({
        waiter_id: waiterId,
        section_id: sectionId,
        cafeteria_id: cafeteriaId
      });
    if (error) throw error;
  }

  async getWaiterSession(waiterId: string): Promise<WaiterSession | undefined> {
    const { data, error } = await supabase
      .from('waiter_sessions')
      .select('*')
      .eq('waiter_id', waiterId)
      .single();
    if (error) return undefined;
    return {
      waiterId: data.waiter_id,
      sectionId: data.section_id,
      cafeteriaId: data.cafeteria_id
    };
  }

  private mapToStaff(data: any): Staff {
    return {
      id: data.id,
      cafeteriaId: data.cafeteria_id,
      name: data.name,
      role: data.role,
      isActive: data.is_active,
      createdAt: new Date(data.created_at),
      kitchenCategoryId: data.kitchen_category_id
    };
  }
}
