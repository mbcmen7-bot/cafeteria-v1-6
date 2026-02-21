import type { Staff, StaffRole, WaiterSession } from '../../../lib/shared_mock_state';

/**
 * Repository contract for Staff persistence operations.
 * Handles staff members and waiter session management.
 */
export interface IStaffRepo {
  /**
   * Retrieve all staff for a specific cafeteria.
   */
  getByCafeteriaId(cafeteriaId: string): Promise<Staff[]>;

  /**
   * Retrieve a single staff member by ID.
   */
  getById(staffId: string): Promise<Staff | undefined>;

  /**
   * Create a new staff member.
   */
  create(staff: Staff): Promise<Staff>;

  /**
   * Update staff member's active status.
   */
  updateStatus(staffId: string, isActive: boolean): Promise<Staff | undefined>;

  /**
   * Set a waiter's current session (section assignment).
   */
  setWaiterSession(waiterId: string, sectionId: string, cafeteriaId: string): Promise<void>;

  /**
   * Get a waiter's current session.
   */
  getWaiterSession(waiterId: string): Promise<WaiterSession | undefined>;
}
