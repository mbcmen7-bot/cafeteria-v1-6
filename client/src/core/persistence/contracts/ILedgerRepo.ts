import type { LedgerEntry, RechargeRequest, PayoutRecord, RechargeStatus } from '../../../lib/shared_mock_state';

/**
 * Repository contract for Ledger and financial transaction operations.
 * Handles ledger entries, recharge requests, and payout records.
 */
export interface ILedgerRepo {
  // Ledger operations
  addEntry(entry: LedgerEntry): Promise<LedgerEntry>;
  getAllEntries(): Promise<LedgerEntry[]>;
  getEntriesByMarketerId(marketerId: string): Promise<LedgerEntry[]>;
  getCommissionsByMarketerId(marketerId: string): Promise<LedgerEntry[]>;

  // Recharge operations
  getAllRechargeRequests(): Promise<RechargeRequest[]>;
  getRechargeRequestsByCafeteriaId(cafeteriaId: string): Promise<RechargeRequest[]>;
  createRechargeRequest(request: RechargeRequest): Promise<RechargeRequest>;
  updateRechargeRequestStatus(
    requestId: string, 
    status: 'approved' | 'rejected', 
    processedAt: Date, 
    notes?: string
  ): Promise<RechargeRequest | undefined>;

  // Payout operations
  getAllPayoutRecords(): Promise<PayoutRecord[]>;
  getPayoutRecordsByMarketerId(marketerId: string): Promise<PayoutRecord[]>;
  createPayoutRecord(record: PayoutRecord): Promise<PayoutRecord>;
}
