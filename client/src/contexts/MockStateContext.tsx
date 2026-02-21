import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { 
  mockState, 
  type Order, 
  type Cafeteria, 
  type MenuCategory, 
  type MenuItem, 
  type LedgerEntry,
  type OrderItem,
  type OrderStatus,
  type CommissionConfig,
  type RechargeRequest,
  type PayoutRecord,
  type TrialConfig,
  type WaiterSection,
  type WaiterTable,
  type KitchenCategory,
  type WaiterSession,
  type Staff,
  type StaffRole,
  type SecurityEvent
} from '../lib/shared_mock_state';

interface MockStateContextType {
  orders: Order[];
  cafeterias: Cafeteria[];
  menuCategories: MenuCategory[];
  menuItems: MenuItem[];
  ledgerEntries: LedgerEntry[];
  commissionConfig: CommissionConfig | null;
  rechargeRequests: RechargeRequest[];
  payoutRecords: PayoutRecord[];
  trialConfig: TrialConfig | null;
  waiterSections: WaiterSection[];
  waiterTables: WaiterTable[];
  kitchenCategories: KitchenCategory[];
  staff: Staff[];
  isLoading: boolean;
  // Methods
  getWaiterSections: (cafeteriaId: string) => Promise<WaiterSection[]>;
  addWaiterSection: (cafeteriaId: string, name: string, description?: string) => Promise<WaiterSection>;
  getWaiterTables: (cafeteriaId: string, sectionId?: string) => Promise<WaiterTable[]>;
  addWaiterTable: (cafeteriaId: string, sectionId: string, tableNumber: string, capacity: number) => Promise<WaiterTable>;
  getKitchenCategories: (cafeteriaId: string) => Promise<KitchenCategory[]>;
  addKitchenCategory: (cafeteriaId: string, name: string, description?: string) => Promise<KitchenCategory>;
  setWaiterSession: (waiterId: string, sectionId: string, cafeteriaId: string) => Promise<void>;
  getWaiterSession: (waiterId: string) => Promise<WaiterSession | undefined>;
  updateMenuItemKitchenCategory: (itemId: string, kitchenCategoryId: string) => Promise<MenuItem | undefined>;
  getMenuItemsByKitchenCategory: (kitchenCategoryId: string) => Promise<MenuItem[]>;
  getStaff: (cafeteriaId: string) => Promise<Staff[]>;
  getStaffById: (staffId: string) => Promise<Staff | undefined>;
  addStaff: (cafeteriaId: string, name: string, role: StaffRole) => Promise<Staff>;
  updateStaffStatus: (staffId: string, isActive: boolean) => Promise<Staff | undefined>;
  updateWaiterTableStatus: (tableId: string, isActive: boolean) => Promise<WaiterTable | undefined>;
  getOrders: () => Promise<Order[]>;
  getOrderById: (orderId: string) => Promise<Order | undefined>;
  getOrdersByCafeteriaId: (cafeteriaId: string) => Promise<Order[]>;
  createOrder: (sessionId: string, cafeteriaId: string, items: OrderItem[], payload: { cafeteria_code: string, table_code: string, table_number_display: string, version: string }) => Promise<Order>;
  updateOrderStatus: (orderId: string, newStatus: OrderStatus, actorId?: string, actorRole?: StaffRole) => Promise<Order | undefined>;
  getCafeterias: () => Promise<Cafeteria[]>;
  getCafeteriaById: (cafeteriaId: string) => Promise<Cafeteria | undefined>;
  updateCafeteriaPoints: (cafeteriaId: string, pointsChange: number) => Promise<Cafeteria | undefined>;
  getMenuCategories: () => Promise<MenuCategory[]>;
  addMenuCategory: (name: string, description?: string) => Promise<MenuCategory>;
  getMenuItemsByCategoryId: (categoryId: string) => Promise<MenuItem[]>;
  getMenuItemById: (itemId: string) => Promise<MenuItem | undefined>;
  addMenuItem: (categoryId: string, name: string, description: string, price: number) => Promise<MenuItem>;
  addLedgerEntry: (entry: Omit<LedgerEntry, 'id' | 'timestamp'>) => Promise<LedgerEntry>;
  getLedgerEntries: () => Promise<LedgerEntry[]>;
  getCommissionConfig: () => Promise<CommissionConfig>;
  updateCommissionConfig: (config: Partial<CommissionConfig>) => Promise<void>;
  getRechargeRequests: () => Promise<RechargeRequest[]>;
  getRechargeRequestsByCafeteriaId: (cafeteriaId: string) => Promise<RechargeRequest[]>;
  createRechargeRequest: (cafeteriaId: string, amount: number, proofImageUrl: string) => Promise<RechargeRequest>;
  processRechargeRequest: (requestId: string, status: 'approved' | 'rejected', notes?: string) => Promise<RechargeRequest | undefined>;
  createPayout: (marketerId: string, amount: number, note?: string, createdBy?: string) => Promise<PayoutRecord>;
  getPayoutRecords: () => Promise<PayoutRecord[]>;
  getPayoutRecordsByMarketerId: (marketerId: string) => Promise<PayoutRecord[]>;
  getMarketerBalance: (marketerId: string) => Promise<number>;
  getMarketerCommissionHistory: (marketerId: string) => Promise<LedgerEntry[]>;
  getAllMarketerIds: () => Promise<string[]>;
  getTrialConfig: () => Promise<TrialConfig>;
  updateTrialConfig: (config: Partial<TrialConfig>) => Promise<void>;
  updateCafeteriaTrialOverride: (cafeteriaId: string, trialDays?: number) => Promise<Cafeteria | undefined>;
  getSecurityEvents: () => Promise<SecurityEvent[]>;
  getSecurityEventsByActorId: (actorId: string) => Promise<SecurityEvent[]>;
  resetMockState: () => void;
  subscribe: (callback: () => void) => () => void;
}

const MockStateContext = createContext<MockStateContextType | undefined>(undefined);

export const MockStateProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [state, setState] = useState<{
    orders: Order[];
    cafeterias: Cafeteria[];
    menuCategories: MenuCategory[];
    menuItems: MenuItem[];
    ledgerEntries: LedgerEntry[];
    commissionConfig: CommissionConfig | null;
    rechargeRequests: RechargeRequest[];
    payoutRecords: PayoutRecord[];
    trialConfig: TrialConfig | null;
    waiterSections: WaiterSection[];
    waiterTables: WaiterTable[];
    kitchenCategories: KitchenCategory[];
    staff: Staff[];
  }>({
    orders: [],
    cafeterias: [],
    menuCategories: [],
    menuItems: [],
    ledgerEntries: [],
    commissionConfig: null,
    rechargeRequests: [],
    payoutRecords: [],
    trialConfig: null,
    waiterSections: [],
    waiterTables: [],
    kitchenCategories: [],
    staff: [],
  });

  const refreshState = async () => {
    try {
      const [
        orders, cafeterias, menuCategories, ledgerEntries, 
        commissionConfig, rechargeRequests, payoutRecords, trialConfig
      ] = await Promise.all([
        mockState.getOrders(),
        mockState.getCafeterias(),
        mockState.getMenuCategories(),
        mockState.getLedgerEntries(),
        mockState.getCommissionConfig(),
        mockState.getRechargeRequests(),
        mockState.getPayoutRecords(),
        mockState.getTrialConfig()
      ]);

      // Get items for all categories
      const menuItems = (await Promise.all(
        menuCategories.map(cat => mockState.getMenuItemsByCategoryId(cat.id))
      )).flat();

      // For pilot, we use a default cafeteria ID if none specified
      const defaultCafeId = cafeterias[0]?.id || '100101';
      
      const [waiterSections, waiterTables, kitchenCategories, staff] = await Promise.all([
        mockState.getWaiterSections(defaultCafeId),
        mockState.getWaiterTables(defaultCafeId),
        mockState.getKitchenCategories(defaultCafeId),
        mockState.getStaff(defaultCafeId)
      ]);

      setState({
        orders,
        cafeterias,
        menuCategories,
        menuItems,
        ledgerEntries,
        commissionConfig,
        rechargeRequests,
        payoutRecords,
        trialConfig,
        waiterSections,
        waiterTables,
        kitchenCategories,
        staff
      });
    } catch (error) {
      console.error("Error refreshing state:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshState();
    const unsubscribe = mockState.subscribe(() => {
      refreshState();
    });
    return () => unsubscribe();
  }, []);

  const contextValue: MockStateContextType = {
    ...state,
    isLoading,
    getWaiterSections: mockState.getWaiterSections.bind(mockState),
    addWaiterSection: mockState.addWaiterSection.bind(mockState),
    getWaiterTables: mockState.getWaiterTables.bind(mockState),
    addWaiterTable: mockState.addWaiterTable.bind(mockState),
    getKitchenCategories: mockState.getKitchenCategories.bind(mockState),
    addKitchenCategory: mockState.addKitchenCategory.bind(mockState),
    setWaiterSession: mockState.setWaiterSession.bind(mockState),
    getWaiterSession: mockState.getWaiterSession.bind(mockState),
    updateMenuItemKitchenCategory: mockState.updateMenuItemKitchenCategory.bind(mockState),
    getMenuItemsByKitchenCategory: mockState.getMenuItemsByKitchenCategory.bind(mockState),
    getStaff: mockState.getStaff.bind(mockState),
    getStaffById: mockState.getStaffById.bind(mockState),
    addStaff: mockState.addStaff.bind(mockState),
    updateStaffStatus: mockState.updateStaffStatus.bind(mockState),
    updateWaiterTableStatus: mockState.updateWaiterTableStatus.bind(mockState),
    getOrders: mockState.getOrders.bind(mockState),
    getOrderById: mockState.getOrderById.bind(mockState),
    getOrdersByCafeteriaId: mockState.getOrdersByCafeteriaId.bind(mockState),
    createOrder: mockState.createOrder.bind(mockState),
    updateOrderStatus: mockState.updateOrderStatus.bind(mockState),
    getCafeterias: mockState.getCafeterias.bind(mockState),
    getCafeteriaById: mockState.getCafeteriaById.bind(mockState),
    updateCafeteriaPoints: mockState.updateCafeteriaPoints.bind(mockState),
    getMenuCategories: mockState.getMenuCategories.bind(mockState),
    addMenuCategory: mockState.addMenuCategory.bind(mockState),
    getMenuItemsByCategoryId: mockState.getMenuItemsByCategoryId.bind(mockState),
    getMenuItemById: mockState.getMenuItemById.bind(mockState),
    addMenuItem: mockState.addMenuItem.bind(mockState),
    addLedgerEntry: mockState.addLedgerEntry.bind(mockState),
    getLedgerEntries: mockState.getLedgerEntries.bind(mockState),
    getCommissionConfig: mockState.getCommissionConfig.bind(mockState),
    updateCommissionConfig: mockState.updateCommissionConfig.bind(mockState),
    getRechargeRequests: mockState.getRechargeRequests.bind(mockState),
    getRechargeRequestsByCafeteriaId: mockState.getRechargeRequestsByCafeteriaId.bind(mockState),
    createRechargeRequest: mockState.createRechargeRequest.bind(mockState),
    processRechargeRequest: mockState.processRechargeRequest.bind(mockState),
    createPayout: mockState.createPayout.bind(mockState),
    getPayoutRecords: mockState.getPayoutRecords.bind(mockState),
    getPayoutRecordsByMarketerId: mockState.getPayoutRecordsByMarketerId.bind(mockState),
    getMarketerBalance: mockState.getMarketerBalance.bind(mockState),
    getMarketerCommissionHistory: mockState.getMarketerCommissionHistory.bind(mockState),
    getAllMarketerIds: mockState.getAllMarketerIds.bind(mockState),
    getTrialConfig: mockState.getTrialConfig.bind(mockState),
    updateTrialConfig: mockState.updateTrialConfig.bind(mockState),
    updateCafeteriaTrialOverride: mockState.updateCafeteriaTrialOverride.bind(mockState),
    getSecurityEvents: mockState.getSecurityEvents.bind(mockState),
    getSecurityEventsByActorId: mockState.getSecurityEventsByActorId.bind(mockState),
    resetMockState: mockState.reset.bind(mockState),
    subscribe: mockState.subscribe.bind(mockState),
  };

  return (
    <MockStateContext.Provider value={contextValue}>
      {children}
    </MockStateContext.Provider>
  );
};

export const useMockState = () => {
  const context = useContext(MockStateContext);
  if (context === undefined) {
    throw new Error('useMockState must be used within a MockStateProvider');
  }
  return context;
};

export type { WaiterSection, WaiterTable, KitchenCategory, WaiterSession, Staff, StaffRole };
