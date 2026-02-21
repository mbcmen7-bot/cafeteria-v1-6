import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase URL or Anon Key is missing. Check your environment variables.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type AppRole = 'owner' | 'marketer' | 'cafe_admin' | 'manager' | 'waiter' | 'kitchen' | 'customer';

export interface Profile {
  id: string;
  email: string;
  role: AppRole;
  cafeteria_id?: string;
  marketer_id?: string;
  created_at: string;
  updated_at: string;
}
