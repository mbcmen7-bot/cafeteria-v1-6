import type { 
  Cafeteria, 
  MenuCategory, 
  MenuItem, 
  WaiterSection, 
  WaiterTable, 
  KitchenCategory,
  Staff
} from '../../../lib/shared_mock_state';

/**
 * Seed data initializer.
 * Provides default data for fresh installations.
 */
export class SeedDataInitializer {
  static getWaiterSections(): WaiterSection[] {
    return [
      { id: 'sec-001', cafeteriaId: '100101', name: 'A', description: 'Section A' },
      { id: 'sec-002', cafeteriaId: '100101', name: 'B', description: 'Section B' },
      { id: 'sec-003', cafeteriaId: '100101', name: 'C', description: 'Section C' },
    ];
  }

  static getKitchenCategories(): KitchenCategory[] {
    return [
      { id: 'kcat-001', cafeteriaId: '100101', name: 'Hot', description: 'Hot dishes' },
      { id: 'kcat-002', cafeteriaId: '100101', name: 'Cold', description: 'Cold dishes' },
      { id: 'kcat-003', cafeteriaId: '100101', name: 'Drinks', description: 'Beverages' },
      { id: 'kcat-004', cafeteriaId: '100101', name: 'Desserts', description: 'Desserts' },
    ];
  }

  static getStaff(): Staff[] {
    return [
      { id: 'staff-001', cafeteriaId: '100101', name: 'John', role: 'waiter', isActive: true, createdAt: new Date() },
      { id: 'staff-002', cafeteriaId: '100101', name: 'Jane', role: 'waiter', isActive: true, createdAt: new Date() },
      { id: 'staff-003', cafeteriaId: '100101', name: 'Chef Mike', role: 'kitchen', isActive: true, createdAt: new Date(), kitchenCategoryId: 'kcat-001' },
      { id: 'staff-004', cafeteriaId: '100101', name: 'Chef Sarah', role: 'kitchen', isActive: true, createdAt: new Date(), kitchenCategoryId: 'kcat-002' },
    ];
  }

  static getWaiterTables(): WaiterTable[] {
    return [
      { id: 'tbl-001', cafeteriaId: '100101', sectionId: 'sec-001', tableNumber: 'A-01', capacity: 2, referenceCode: '1001ABT01', is_active: true },
      { id: 'tbl-002', cafeteriaId: '100101', sectionId: 'sec-001', tableNumber: 'A-02', capacity: 4, referenceCode: '1001ABT02', is_active: true },
      { id: 'tbl-003', cafeteriaId: '100101', sectionId: 'sec-002', tableNumber: 'B-01', capacity: 2, referenceCode: '1001ABT03', is_active: true },
      { id: 'tbl-004', cafeteriaId: '100101', sectionId: 'sec-002', tableNumber: 'B-02', capacity: 6, referenceCode: '1001ABT04', is_active: true },
      { id: 'tbl-005', cafeteriaId: '100101', sectionId: 'sec-003', tableNumber: 'C-01', capacity: 4, referenceCode: '1001ABT05', is_active: true },
    ];
  }

  static getCafeterias(): Cafeteria[] {
    return [
      {
        id: '100101',
        name: 'Sandbox Cafeteria',
        description: 'A cozy cafeteria serving fresh breakfast and lunch',
        address: '123 Main Street, Downtown',
        phone: '+1 (555) 123-4567',
        rating: 4.5,
        reviewCount: 128,
        imageUrl: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=400',
        latitude: 40.7128,
        longitude: -74.0060,
        isOpen: true,
        openingHours: 'Mon-Fri: 7AM-8PM, Sat-Sun: 8AM-6PM',
        points: 100000,
        marketerId: '1001',
        isTrialExpired: false,
        code: '1001AB'
      },
      {
        id: '100102',
        name: 'City Center Cafe',
        description: 'Modern cafe with specialty coffee and pastries',
        address: '456 Park Avenue, Midtown',
        phone: '+1 (555) 234-5678',
        rating: 4.7,
        reviewCount: 256,
        imageUrl: 'https://images.unsplash.com/photo-1559925393-8be0ec4767c8?w=400',
        latitude: 40.7589,
        longitude: -73.9851,
        isOpen: true,
        openingHours: 'Mon-Sun: 6AM-10PM',
        points: 150000,
        marketerId: '1001',
        isTrialExpired: false,
        code: '1001AC'
      }
    ];
  }

  static getMenuCategories(): MenuCategory[] {
    return [
      { id: 'cat-001', name: 'Breakfast', description: 'Start your day right' },
      { id: 'cat-002', name: 'Lunch', description: 'Hearty midday meals' },
      { id: 'cat-003', name: 'Drinks', description: 'Hot and cold beverages' },
    ];
  }

  static getMenuItems(): MenuItem[] {
    return [
      { id: 'item-001', categoryId: 'cat-001', name: 'Classic Breakfast', description: 'Eggs, bacon, toast', price: 8.99, isAvailable: true, kitchenCategoryId: 'kcat-001' },
      { id: 'item-002', categoryId: 'cat-001', name: 'Pancake Stack', description: 'Three fluffy pancakes', price: 6.99, isAvailable: true, kitchenCategoryId: 'kcat-001' },
      { id: 'item-003', categoryId: 'cat-002', name: 'Cheeseburger', description: 'Beef patty with cheese', price: 11.99, isAvailable: true, kitchenCategoryId: 'kcat-001' },
      { id: 'item-004', categoryId: 'cat-002', name: 'Caesar Salad', description: 'Romaine lettuce, parmesan', price: 8.99, isAvailable: true, kitchenCategoryId: 'kcat-002' },
      { id: 'item-005', categoryId: 'cat-003', name: 'Coffee', description: 'Freshly brewed coffee', price: 2.99, isAvailable: true, kitchenCategoryId: 'kcat-003' },
      { id: 'item-006', categoryId: 'cat-003', name: 'Orange Juice', description: 'Freshly squeezed', price: 3.99, isAvailable: true, kitchenCategoryId: 'kcat-003' },
    ];
  }
}
