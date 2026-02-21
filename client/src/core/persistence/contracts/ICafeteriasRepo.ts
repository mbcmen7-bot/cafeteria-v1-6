import type { 
  Cafeteria, 
  MenuCategory, 
  MenuItem, 
  WaiterSection, 
  WaiterTable, 
  KitchenCategory 
} from '../../../lib/shared_mock_state';

/**
 * Repository contract for Cafeteria and related entities.
 * Handles cafeterias, menus, sections, tables, and kitchen categories.
 */
export interface ICafeteriasRepo {
  // Cafeteria operations
  getAll(): Promise<Cafeteria[]>;
  getById(cafeteriaId: string): Promise<Cafeteria | undefined>;
  updatePoints(cafeteriaId: string, pointsChange: number): Promise<Cafeteria | undefined>;
  updateTrialOverride(cafeteriaId: string, trialDays?: number): Promise<Cafeteria | undefined>;

  // Menu operations
  getMenuCategories(): Promise<MenuCategory[]>;
  addMenuCategory(category: MenuCategory): Promise<MenuCategory>;
  getMenuItemsByCategoryId(categoryId: string): Promise<MenuItem[]>;
  getMenuItemById(itemId: string): Promise<MenuItem | undefined>;
  addMenuItem(item: MenuItem): Promise<MenuItem>;
  updateMenuItemKitchenCategory(itemId: string, kitchenCategoryId: string): Promise<MenuItem | undefined>;
  getMenuItemsByKitchenCategory(kitchenCategoryId: string): Promise<MenuItem[]>;

  // Waiter section operations
  getWaiterSections(cafeteriaId: string): Promise<WaiterSection[]>;
  addWaiterSection(section: WaiterSection): Promise<WaiterSection>;

  // Waiter table operations
  getWaiterTables(cafeteriaId: string, sectionId?: string): Promise<WaiterTable[]>;
  addWaiterTable(table: WaiterTable): Promise<WaiterTable>;
  updateWaiterTableStatus(tableId: string, isActive: boolean): Promise<WaiterTable | undefined>;

  // Kitchen category operations
  getKitchenCategories(cafeteriaId: string): Promise<KitchenCategory[]>;
  addKitchenCategory(category: KitchenCategory): Promise<KitchenCategory>;
}
