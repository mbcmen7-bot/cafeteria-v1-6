import type { ISecurityEventsRepo } from '../contracts/ISecurityEventsRepo';
import type { SecurityEvent } from '../../../lib/shared_mock_state';

/**
 * In-memory implementation of ISecurityEventsRepo.
 * Stores security events in an array with automatic size limiting.
 */
export class InMemorySecurityEventsRepo implements ISecurityEventsRepo {
  private securityEvents: SecurityEvent[] = [];
  private readonly maxEvents = 1000;

  constructor(initialEvents: SecurityEvent[] = []) {
    this.securityEvents = initialEvents;
  }

  async log(event: SecurityEvent): Promise<void> {
    this.securityEvents.push(event);
    
    // Keep only the most recent events
    if (this.securityEvents.length > this.maxEvents) {
      this.securityEvents = this.securityEvents.slice(-this.maxEvents);
    }
  }

  async getAll(): Promise<SecurityEvent[]> {
    return [...this.securityEvents];
  }

  async getByActorId(actorId: string): Promise<SecurityEvent[]> {
    return this.securityEvents.filter(e => e.actorId === actorId);
  }

  // Internal methods for persistence adapter
  _getBackingStore(): SecurityEvent[] {
    return this.securityEvents;
  }

  _setBackingStore(events: SecurityEvent[]): void {
    this.securityEvents = events;
  }
}
