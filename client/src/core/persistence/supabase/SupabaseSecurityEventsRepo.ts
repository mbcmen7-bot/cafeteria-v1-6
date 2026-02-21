import { supabase } from '@/lib/supabase';
import type { ISecurityEventsRepo } from '../contracts/ISecurityEventsRepo';
import type { SecurityEvent } from '../../../lib/shared_mock_state';

export class SupabaseSecurityEventsRepo implements ISecurityEventsRepo {
  async log(event: SecurityEvent): Promise<void> {
    const { error } = await supabase
      .from('security_events')
      .insert({
        id: event.id,
        actor_id: event.actorId,
        actor_role: event.role,
        event_type: event.attemptedAction,
        target_id: event.targetId,
        description: event.reason || 'Security event',
        metadata: { blocked: event.blocked }
      });
    
    if (error) throw error;
  }

  async getAll(): Promise<SecurityEvent[]> {
    const { data, error } = await supabase
      .from('security_events')
      .select('*')
      .order('timestamp', { ascending: false });
    
    if (error) throw error;
    return (data || []).map(this.mapToSecurityEvent);
  }

  async getByActorId(actorId: string): Promise<SecurityEvent[]> {
    const { data, error } = await supabase
      .from('security_events')
      .select('*')
      .eq('actor_id', actorId)
      .order('timestamp', { ascending: false });
    
    if (error) throw error;
    return (data || []).map(this.mapToSecurityEvent);
  }

  private mapToSecurityEvent(data: any): SecurityEvent {
    return {
      id: data.id,
      actorId: data.actor_id,
      role: data.actor_role,
      attemptedAction: data.event_type,
      targetId: data.target_id,
      timestamp: new Date(data.timestamp),
      blocked: data.metadata?.blocked || false,
      reason: data.description
    };
  }
}
