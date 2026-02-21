import type { IConfigRepo } from '../contracts/IConfigRepo';
import type { CommissionConfig, TrialConfig } from '../../../lib/shared_mock_state';

/**
 * In-memory implementation of IConfigRepo.
 * Stores commission and trial configuration.
 */
export class InMemoryConfigRepo implements IConfigRepo {
  private commissionConfig: CommissionConfig = {
    rate_direct_parent_percent: 40,
    rate_grandparent_percent: 15,
    rate_owner_percent: 45
  };

  private trialConfig: TrialConfig = {
    globalTrialDays: 30
  };

  constructor(initial?: {
    commissionConfig?: CommissionConfig;
    trialConfig?: TrialConfig;
  }) {
    if (initial) {
      if (initial.commissionConfig) {
        this.commissionConfig = initial.commissionConfig;
      }
      if (initial.trialConfig) {
        this.trialConfig = initial.trialConfig;
      }
    }
  }

  async getCommissionConfig(): Promise<CommissionConfig> {
    return { ...this.commissionConfig };
  }

  async updateCommissionConfig(config: Partial<CommissionConfig>): Promise<void> {
    this.commissionConfig = { ...this.commissionConfig, ...config };
  }

  async getTrialConfig(): Promise<TrialConfig> {
    return { ...this.trialConfig };
  }

  async updateTrialConfig(config: Partial<TrialConfig>): Promise<void> {
    this.trialConfig = { ...this.trialConfig, ...config };
  }

  // Internal methods for persistence adapter
  _getBackingStore() {
    return {
      commissionConfig: this.commissionConfig,
      trialConfig: this.trialConfig
    };
  }

  _setBackingStore(data: {
    commissionConfig: CommissionConfig;
    trialConfig: TrialConfig;
  }): void {
    this.commissionConfig = data.commissionConfig;
    this.trialConfig = data.trialConfig;
  }
}
