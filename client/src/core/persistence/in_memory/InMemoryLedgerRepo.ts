import type { ILedgerRepo } from '../contracts/ILedgerRepo';
import type { LedgerEntry, RechargeRequest, PayoutRecord } from '../../../lib/shared_mock_state';

/**
 * In-memory implementation of ILedgerRepo.
 * Stores ledger entries, recharge requests, and payout records in arrays.
 */
export class InMemoryLedgerRepo implements ILedgerRepo {
  private ledger: LedgerEntry[] = [];
  private rechargeRequests: RechargeRequest[] = [];
  private payoutRecords: PayoutRecord[] = [];

  constructor(initial?: {
    ledger?: LedgerEntry[];
    rechargeRequests?: RechargeRequest[];
    payoutRecords?: PayoutRecord[];
  }) {
    if (initial) {
      this.ledger = initial.ledger || [];
      this.rechargeRequests = initial.rechargeRequests || [];
      this.payoutRecords = initial.payoutRecords || [];
    }
  }

  // Ledger operations
  async addEntry(entry: LedgerEntry): Promise<LedgerEntry> {
    this.ledger.push(entry);
    return entry;
  }

  async getAllEntries(): Promise<LedgerEntry[]> {
    return [...this.ledger];
  }

  async getEntriesByMarketerId(marketerId: string): Promise<LedgerEntry[]> {
    return this.ledger.filter(e => e.marketerId === marketerId);
  }

  async getCommissionsByMarketerId(marketerId: string): Promise<LedgerEntry[]> {
    return this.ledger.filter(e => e.marketerId === marketerId && e.type === 'commission_credit');
  }

  // Recharge operations
  async getAllRechargeRequests(): Promise<RechargeRequest[]> {
    return [...this.rechargeRequests];
  }

  async getRechargeRequestsByCafeteriaId(cafeteriaId: string): Promise<RechargeRequest[]> {
    return this.rechargeRequests.filter(r => r.cafeteriaId === cafeteriaId);
  }

  async createRechargeRequest(request: RechargeRequest): Promise<RechargeRequest> {
    this.rechargeRequests.push(request);
    return request;
  }

  updateRechargeRequestStatus(
    requestId: string, 
    status: 'approved' | 'rejected', 
    processedAt: Date, 
    notes?: string
  ): RechargeRequest | undefined {
    const reqIndex = this.rechargeRequests.findIndex(r => r.id === requestId);
    if (reqIndex === -1) return undefined;

    this.rechargeRequests[reqIndex].status = status;
    this.rechargeRequests[reqIndex].processedAt = processedAt;
    this.rechargeRequests[reqIndex].notes = notes;
    return this.rechargeRequests[reqIndex];
  }

  // Payout operations
  async getAllPayoutRecords(): Promise<PayoutRecord[]> {
    return [...this.payoutRecords];
  }

  async getPayoutRecordsByMarketerId(marketerId: string): Promise<PayoutRecord[]> {
    return this.payoutRecords.filter(p => p.marketerId === marketerId);
  }

  async createPayoutRecord(record: PayoutRecord): Promise<PayoutRecord> {
    this.payoutRecords.push(record);
    return record;
  }

  // Internal methods for persistence adapter
  _getBackingStore() {
    return {
      ledger: this.ledger,
      rechargeRequests: this.rechargeRequests,
      payoutRecords: this.payoutRecords
    };
  }

  _setBackingStore(data: {
    ledger: LedgerEntry[];
    rechargeRequests: RechargeRequest[];
    payoutRecords: PayoutRecord[];
  }): void {
    this.ledger = data.ledger;
    this.rechargeRequests = data.rechargeRequests;
    this.payoutRecords = data.payoutRecords;
  }
}
