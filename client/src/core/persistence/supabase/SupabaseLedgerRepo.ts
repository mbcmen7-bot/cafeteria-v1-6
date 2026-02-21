import { supabase } from '@/lib/supabase';
import type { ILedgerRepo } from '../contracts/ILedgerRepo';
import type { LedgerEntry, RechargeRequest, PayoutRecord } from '../../../lib/shared_mock_state';

export class SupabaseLedgerRepo implements ILedgerRepo {
  async addEntry(entry: LedgerEntry): Promise<LedgerEntry> {
    const { data, error } = await supabase
      .from('ledger_entries')
      .insert({
        id: entry.id,
        type: entry.type,
        amount: entry.amount,
        order_id: entry.orderId,
        cafeteria_id: entry.cafeteriaId,
        marketer_id: entry.marketerId,
        description: entry.description
      })
      .select()
      .single();
    if (error) throw error;
    return this.mapToLedgerEntry(data);
  }

  async getAllEntries(): Promise<LedgerEntry[]> {
    const { data, error } = await supabase
      .from('ledger_entries')
      .select('*')
      .order('timestamp', { ascending: false });
    if (error) throw error;
    return (data || []).map(this.mapToLedgerEntry);
  }

  async getEntriesByMarketerId(marketerId: string): Promise<LedgerEntry[]> {
    const { data, error } = await supabase
      .from('ledger_entries')
      .select('*')
      .eq('marketer_id', marketerId)
      .order('timestamp', { ascending: false });
    if (error) throw error;
    return (data || []).map(this.mapToLedgerEntry);
  }

  async getCommissionsByMarketerId(marketerId: string): Promise<LedgerEntry[]> {
    const { data, error } = await supabase
      .from('ledger_entries')
      .select('*')
      .eq('marketer_id', marketerId)
      .eq('type', 'commission_credit')
      .order('timestamp', { ascending: false });
    if (error) throw error;
    return (data || []).map(this.mapToLedgerEntry);
  }

  // Recharge operations
  async getAllRechargeRequests(): Promise<RechargeRequest[]> {
    const { data, error } = await supabase
      .from('recharge_requests')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data || []).map(this.mapToRechargeRequest);
  }

  async getRechargeRequestsByCafeteriaId(cafeteriaId: string): Promise<RechargeRequest[]> {
    const { data, error } = await supabase
      .from('recharge_requests')
      .select('*')
      .eq('cafeteria_id', cafeteriaId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data || []).map(this.mapToRechargeRequest);
  }

  async createRechargeRequest(request: RechargeRequest): Promise<RechargeRequest> {
    const { data, error } = await supabase
      .from('recharge_requests')
      .insert({
        id: request.id,
        cafeteria_id: request.cafeteriaId,
        amount: request.amount,
        proof_image_url: request.proofImageUrl,
        status: request.status,
        notes: request.notes
      })
      .select()
      .single();
    if (error) throw error;
    return this.mapToRechargeRequest(data);
  }

  async updateRechargeRequestStatus(
    requestId: string, 
    status: 'approved' | 'rejected', 
    processedAt: Date, 
    notes?: string
  ): Promise<RechargeRequest | undefined> {
    const { data, error } = await supabase
      .from('recharge_requests')
      .update({
        status: status,
        processed_at: processedAt.toISOString(),
        notes: notes
      })
      .eq('id', requestId)
      .select()
      .single();
    if (error) throw error;
    return this.mapToRechargeRequest(data);
  }

  // Payout operations
  async getAllPayoutRecords(): Promise<PayoutRecord[]> {
    const { data, error } = await supabase
      .from('payout_records')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data || []).map(this.mapToPayoutRecord);
  }

  async getPayoutRecordsByMarketerId(marketerId: string): Promise<PayoutRecord[]> {
    const { data, error } = await supabase
      .from('payout_records')
      .select('*')
      .eq('marketer_id', marketerId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data || []).map(this.mapToPayoutRecord);
  }

  async createPayoutRecord(record: PayoutRecord): Promise<PayoutRecord> {
    const { data, error } = await supabase
      .from('payout_records')
      .insert({
        id: record.id,
        marketer_id: record.marketerId,
        amount: record.amount,
        note: record.note,
        created_by: record.createdBy
      })
      .select()
      .single();
    if (error) throw error;
    return this.mapToPayoutRecord(data);
  }

  private mapToLedgerEntry(data: any): LedgerEntry {
    return {
      id: data.id,
      type: data.type,
      amount: Number(data.amount),
      orderId: data.order_id,
      cafeteriaId: data.cafeteria_id,
      marketerId: data.marketer_id,
      timestamp: new Date(data.timestamp),
      description: data.description
    };
  }

  private mapToRechargeRequest(data: any): RechargeRequest {
    return {
      id: data.id,
      cafeteriaId: data.cafeteria_id,
      amount: Number(data.amount),
      proofImageUrl: data.proof_image_url,
      status: data.status,
      createdAt: new Date(data.created_at),
      processedAt: data.processed_at ? new Date(data.processed_at) : undefined,
      notes: data.notes
    };
  }

  private mapToPayoutRecord(data: any): PayoutRecord {
    return {
      id: data.id,
      marketerId: data.marketer_id,
      amount: Number(data.amount),
      note: data.note,
      createdAt: new Date(data.created_at),
      createdBy: data.created_by
    };
  }
}
