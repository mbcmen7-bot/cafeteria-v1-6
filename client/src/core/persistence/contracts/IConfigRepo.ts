import type { CommissionConfig, TrialConfig } from '../../../lib/shared_mock_state';

/**
 * Repository contract for Configuration operations.
 * Handles commission configuration and trial configuration.
 */
export interface IConfigRepo {
  // Commission configuration
  getCommissionConfig(): Promise<CommissionConfig>;
  updateCommissionConfig(config: Partial<CommissionConfig>): Promise<void>;

  // Trial configuration
  getTrialConfig(): Promise<TrialConfig>;
  updateTrialConfig(config: Partial<TrialConfig>): Promise<void>;
}
