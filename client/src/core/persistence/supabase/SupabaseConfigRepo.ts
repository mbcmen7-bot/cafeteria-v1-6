import { supabase } from '@/lib/supabase';
import type { IConfigRepo } from '../contracts/IConfigRepo';
import type { CommissionConfig, TrialConfig } from '../../../lib/shared_mock_state';

export class SupabaseConfigRepo implements IConfigRepo {
  async getCommissionConfig(): Promise<CommissionConfig> {
    const { data, error } = await supabase
      .from('configs')
      .select('value')
      .eq('key', 'commission_config')
      .single();
    
    if (error || !data) {
      return {
        rate_direct_parent_percent: 40,
        rate_grandparent_percent: 15,
        rate_owner_percent: 45
      };
    }
    return data.value as CommissionConfig;
  }

  async updateCommissionConfig(config: Partial<CommissionConfig>): Promise<void> {
    const current = await this.getCommissionConfig();
    const updated = { ...current, ...config };
    
    const { error } = await supabase
      .from('configs')
      .upsert({
        key: 'commission_config',
        value: updated
      });
    
    if (error) throw error;
  }

  async getTrialConfig(): Promise<TrialConfig> {
    const { data, error } = await supabase
      .from('configs')
      .select('value')
      .eq('key', 'trial_config')
      .single();
    
    if (error || !data) {
      return {
        globalTrialDays: 30
      };
    }
    return data.value as TrialConfig;
  }

  async updateTrialConfig(config: Partial<TrialConfig>): Promise<void> {
    const current = await this.getTrialConfig();
    const updated = { ...current, ...config };
    
    const { error } = await supabase
      .from('configs')
      .upsert({
        key: 'trial_config',
        value: updated
      });
    
    if (error) throw error;
  }
}
