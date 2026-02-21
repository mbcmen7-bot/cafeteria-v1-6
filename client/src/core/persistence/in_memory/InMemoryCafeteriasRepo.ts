import type { ICafeteriasRepo } from '../contracts/ICafeteriasRepo';
import type { 
  Cafeteria, 
  MenuCategory, 
  MenuItem, 
  WaiterSection, 
  WaiterTable, 
  KitchenCategory 
} from '../../../lib/shared_mock_state';

/**
 * In-memory implementation of ICafeteriasRepo.
 * Stores all cafeteria-related entities in arrays.
 */
export class InMemoryCafeteriasRepo implements ICafeteriasRepo {
  private cafeterias: Cafeteria[] = [];
  private menuCategories: MenuCategory[] = [];
  private menuItems: MenuItem[] = [];
  private waiterSections: WaiterSection[] = [];
  private waiterTables: WaiterTable[] = [];
  private kitchenCategories: KitchenCategory[] = [];

  constructor(initial?: {
    cafeterias?: Cafeteria[];
    menuCategories?: MenuCategory[];
    menuItems?: MenuItem[];
    waiterSections?: WaiterSection[];
    waiterTables?: WaiterTable[];
    kitchenCategories?: KitchenCategory[];
  }) {
    if (initial) {
      this.cafeterias = initial.cafeterias || [];
      this.menuCategories = initial.menuCategories || [];
      this.menuItems = initial.menuItems || [];
      this.waiterSections = initial.waiterSections || [];
      this.waiterTables = initial.waiterTables || [];
      this.kitchenCategories = initial.kitchenCategories || [];
    }
  }

  // Cafeteria operations
  async getAll(): Promise<Cafeteria[]> {
    return [...this.cafeterias];
  }

  async getById(cafeteriaId: string): Promise<Cafeteria | undefined> {
    return this.cafeterias.find(c => c.id === cafeteriaId);
  }

  async updatePoints(cafeteriaId: string, pointsChange: number): Promise<Cafeteria | undefined> {
    const cafeIndex = this.cafeterias.findIndex(c => c.id === cafeteriaId);
    if (cafeIndex === -1) return undefined;

    this.cafeterias[cafeIndex].points += pointsChange;
    return this.cafeterias[cafeIndex];
  }

  async updateTrialOverride(cafeteriaId: string, trialDays?: number): Promise<Cafeteria | undefined> {
    const cafeIndex = this.cafeterias.findIndex(c => c.id === cafeteriaId);
    if (cafeIndex === -1) return undefined;

    this.cafeterias[cafeIndex].trialDaysOverride = trialDays;
    return this.cafeterias[cafeIndex];
  }

  // Menu operations
  async getMenuCategories(): Promise<MenuCategory[]> {
    return [...this.menuCategories];
  }

  async addMenuCategory(category: MenuCategory): Promise<MenuCategory> {
    this.menuCategories.push(category);
    return category;
  }

  async getMenuItemsByCategoryId(categoryId: string): Promise<MenuItem[]> {
    return this.menuItems.filter(item => item.categoryId === categoryId);
  }

  async getMenuItemById(itemId: string): Promise<MenuItem | undefined> {
    return this.menuItems.find(item => item.id === itemId);
  }

  async addMenuItem(item: MenuItem): Promise<MenuItem> {
    this.menuItems.push(item);
    return item;
  }

  async updateMenuItemKitchenCategory(itemId: string, kitchenCategoryId: string): Promise<MenuItem | undefined> {
    const itemIndex = this.menuItems.findIndex(i => i.id === itemId);
    if (itemIndex === -1) return undefined;

    this.menuItems[itemIndex].kitchenCategoryId = kitchenCategoryId;
    return this.menuItems[itemIndex];
  }

  async getMenuItemsByKitchenCategory(kitchenCategoryId: string): Promise<MenuItem[]> {
    return this.menuItems.filter(item => item.kitchenCategoryId === kitchenCategoryId);
  }

  // Waiter section operations
  async getWaiterSections(cafeteriaId: string): Promise<WaiterSection[]> {
    return this.waiterSections.filter(s => s.cafeteriaId === cafeteriaId);
  }

  async addWaiterSection(section: WaiterSection): Promise<WaiterSection> {
    this.waiterSections.push(section);
    return section;
  }

  // Waiter table operations
  async getWaiterTables(cafeteriaId: string, sectionId?: string): Promise<WaiterTable[]> {
    let tables = this.waiterTables.filter(t => t.cafeteriaId === cafeteriaId);
    if (sectionId) {
      tables = tables.filter(t => t.sectionId === sectionId);
    }
    return tables;
  }

  async addWaiterTable(table: WaiterTable): Promise<WaiterTable> {
    this.waiterTables.push(table);
    return table;
  }

  async updateWaiterTableStatus(tableId: string, isActive: boolean): Promise<WaiterTable | undefined> {
    const tableIndex = this.waiterTables.findIndex(t => t.id === tableId);
    if (tableIndex === -1) return undefined;

    this.waiterTables[tableIndex].is_active = isActive;
    return this.waiterTables[tableIndex];
  }

  // Kitchen category operations
  async getKitchenCategories(cafeteriaId: string): Promise<KitchenCategory[]> {
    return this.kitchenCategories.filter(k => k.cafeteriaId === cafeteriaId);
  }

  async addKitchenCategory(category: KitchenCategory): Promise<KitchenCategory> {
    this.kitchenCategories.push(category);
    return category;
  }

  // Internal methods for persistence adapter
  _getBackingStore() {
    return {
      cafeterias: this.cafeterias,
      menuCategories: this.menuCategories,
      menuItems: this.menuItems,
      waiterSections: this.waiterSections,
      waiterTables: this.waiterTables,
      kitchenCategories: this.kitchenCategories
    };
  }

  _setBackingStore(data: {
    cafeterias: Cafeteria[];
    menuCategories: MenuCategory[];
    menuItems: MenuItem[];
    waiterSections: WaiterSection[];
    waiterTables: WaiterTable[];
    kitchenCategories: KitchenCategory[];
  }): void {
    this.cafeterias = data.cafeterias;
    this.menuCategories = data.menuCategories;
    this.menuItems = data.menuItems;
    this.waiterSections = data.waiterSections;
    this.waiterTables = data.waiterTables;
    this.kitchenCategories = data.kitchenCategories;
  }
}
