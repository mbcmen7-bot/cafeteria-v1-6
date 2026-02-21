import type { SecurityEvent } from '../../../lib/shared_mock_state';

/**
 * Repository contract for Security Event logging operations.
 * Handles security event tracking and auditing.
 */
export interface ISecurityEventsRepo {
  /**
   * Log a new security event.
   */
  log(event: SecurityEvent): Promise<void>;

  /**
   * Retrieve all security events.
   */
  getAll(): Promise<SecurityEvent[]>;

  /**
   * Retrieve security events for a specific actor.
   */
  getByActorId(actorId: string): Promise<SecurityEvent[]>;
}
