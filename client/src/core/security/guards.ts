import { Staff, Order, WaiterSession, MenuItem } from '../../lib/shared_mock_state';

export function checkStaffActive(staff: Staff | undefined): { allowed: boolean; reason?: string } {
  if (staff && !staff.isActive) {
    return { allowed: false, reason: 'Staff account is disabled' };
  }
  return { allowed: true };
}

export function checkWaiterSection(
  order: Order, 
  waiterSession: WaiterSession | undefined,
  tableSectionId: string | undefined
): { allowed: boolean; reason?: string } {
  if (waiterSession && tableSectionId && tableSectionId !== waiterSession.sectionId) {
    return { 
      allowed: false, 
      reason: `Waiter can only update orders in their assigned section (${waiterSession.sectionId})` 
    };
  }
  return { allowed: true };
}

export function checkKitchenCategory(
  order: Order,
  staff: Staff | undefined,
  menuItems: MenuItem[]
): { allowed: boolean; reason?: string } {
  if (staff && staff.role === 'kitchen' && staff.kitchenCategoryId) {
    const hasItemInCategory = order.items.some(item => {
      const menuItem = menuItems.find(mi => mi.id === item.menuItemId);
      return menuItem?.kitchenCategoryId === staff.kitchenCategoryId;
    });
    
    if (!hasItemInCategory) {
      return { 
        allowed: false, 
        reason: `Kitchen staff can only update orders containing items from their assigned category (${staff.kitchenCategoryId})` 
      };
    }
  }
  return { allowed: true };
}
