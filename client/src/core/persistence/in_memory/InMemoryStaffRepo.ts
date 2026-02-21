import type { IStaffRepo } from '../contracts/IStaffRepo';
import type { Staff, WaiterSession } from '../../../lib/shared_mock_state';

/**
 * In-memory implementation of IStaffRepo.
 * Stores staff members in an array and waiter sessions in a Map.
 */
export class InMemoryStaffRepo implements IStaffRepo {
  private staff: Staff[] = [];
  private waiterSessions: Map<string, WaiterSession> = new Map();

  constructor(initialStaff: Staff[] = [], initialSessions: Map<string, WaiterSession> = new Map()) {
    this.staff = initialStaff;
    this.waiterSessions = initialSessions;
  }

  async getByCafeteriaId(cafeteriaId: string): Promise<Staff[]> {
    return this.staff.filter(s => s.cafeteriaId === cafeteriaId);
  }

  async getById(staffId: string): Promise<Staff | undefined> {
    return this.staff.find(s => s.id === staffId);
  }

  async create(staff: Staff): Promise<Staff> {
    this.staff.push(staff);
    return staff;
  }

  async updateStatus(staffId: string, isActive: boolean): Promise<Staff | undefined> {
    const staffIndex = this.staff.findIndex(s => s.id === staffId);
    if (staffIndex === -1) return undefined;

    this.staff[staffIndex].isActive = isActive;
    return this.staff[staffIndex];
  }

  async setWaiterSession(waiterId: string, sectionId: string, cafeteriaId: string): Promise<void> {
    this.waiterSessions.set(waiterId, { waiterId, sectionId, cafeteriaId });
  }

  async getWaiterSession(waiterId: string): Promise<WaiterSession | undefined> {
    return this.waiterSessions.get(waiterId);
  }

  // Internal methods for persistence adapter
  _getBackingStore(): { staff: Staff[]; sessions: Map<string, WaiterSession> } {
    return {
      staff: this.staff,
      sessions: this.waiterSessions
    };
  }

  _setBackingStore(staff: Staff[], sessions: Map<string, WaiterSession>): void {
    this.staff = staff;
    this.waiterSessions = sessions;
  }
}
