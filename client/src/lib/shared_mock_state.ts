
import { isValidStatusTransition, isOrderImmutable } from '../core/domain/order_rules';
import { calculatePointsToDeduct, calculateCommissions } from '../core/ledger/financial_engine';
import { checkStaffActive, checkWaiterSection, checkKitchenCategory } from '../core/security/guards';

// Repository imports
import { InMemoryOrdersRepo } from '../core/persistence/in_memory/InMemoryOrdersRepo';
import { InMemoryStaffRepo } from '../core/persistence/in_memory/InMemoryStaffRepo';
import { InMemoryCafeteriasRepo } from '../core/persistence/in_memory/InMemoryCafeteriasRepo';
import { InMemoryLedgerRepo } from '../core/persistence/in_memory/InMemoryLedgerRepo';
import { InMemoryConfigRepo } from '../core/persistence/in_memory/InMemoryConfigRepo';
import { InMemorySecurityEventsRepo } from '../core/persistence/in_memory/InMemorySecurityEventsRepo';

import { 
  SupabaseOrdersRepo, 
  SupabaseCafeteriasRepo, 
  SupabaseStaffRepo, 
  SupabaseLedgerRepo, 
  SupabaseConfigRepo, 
  SupabaseSecurityEventsRepo 
} from '../core/persistence/supabase';

import { LocalStoragePersistenceAdapter, SeedDataInitializer } from '../core/persistence/adapters';
import { supabase } from './supabase';

// API Toggle Flag
const USE_SUPABASE = import.meta.env.VITE_USE_SUPABASE === 'true';

export type OrderStatus = 'created' | 'sent_to_kitchen' | 'preparing' | 'ready' | 'served' | 'paid' | 'cancelled';

export interface OrderItem {
  menuItemId: string;
  name: string;
  price: number;
  quantity: number;
  notes?: string;
}

export interface Order {
  id: string;
  sessionId: string;
  cafeteriaId: string;
  items: OrderItem[];
  status: OrderStatus;
  total: number;
  createdAt: Date;
  tableNumber?: string;
  cafeteria_code?: string;
  table_code?: string;
  table_number_display?: string;
}

export interface Cafeteria {
  id: string;
  name: string;
  description: string;
  address: string;
  phone: string;
  rating: number;
  reviewCount: number;
  imageUrl: string;
  latitude: number;
  longitude: number;
  isOpen: boolean;
  openingHours: string;
  points: number;
  marketerId?: string;
  isTrialExpired?: boolean;
  trialDaysOverride?: number;
  code?: string;
}

export interface MenuCategory {
  id: string;
  name: string;
  description?: string;
}

export interface MenuItem {
  id: string;
  categoryId: string;
  name: string;
  description: string;
  price: number;
  imageUrl?: string;
  isAvailable: boolean;
  kitchenCategoryId?: string;
}

export interface WaiterSection {
  id: string;
  cafeteriaId: string;
  name: string;
  description?: string;
}

export interface WaiterTable {
  id: string;
  cafeteriaId: string;
  sectionId: string;
  tableNumber: string;
  capacity: number;
  referenceCode: string;
  is_active: boolean;
}

export interface KitchenCategory {
  id: string;
  cafeteriaId: string;
  name: string;
  description?: string;
}

export type LedgerEntryType = 'order_debit' | 'commission_credit' | 'recharge_credit' | 'payout_debit' | 'manual_adjustment' | 'order_payment';

export interface LedgerEntry {
  id: string;
  type: LedgerEntryType;
  amount: number;
  orderId?: string;
  cafeteriaId?: string;
  marketerId?: string;
  timestamp: Date;
  description?: string;
}

export interface CommissionConfig {
  rate_direct_parent_percent: number;
  rate_grandparent_percent: number;
  rate_owner_percent: number;
}

export type RechargeStatus = 'pending' | 'approved' | 'rejected';

export interface RechargeRequest {
  id: string;
  cafeteriaId: string;
  amount: number;
  proofImageUrl: string;
  status: RechargeStatus;
  createdAt: Date;
  processedAt?: Date;
  notes?: string;
}

export interface PayoutRecord {
  id: string;
  marketerId: string;
  amount: number;
  note?: string;
  createdAt: Date;
  createdBy: string;
}

export interface TrialConfig {
  globalTrialDays: number;
}

export interface WaiterSession {
  waiterId: string;
  sectionId: string;
  cafeteriaId: string;
}

export type StaffRole = 'waiter' | 'kitchen';

export interface Staff {
  id: string;
  cafeteriaId: string;
  name: string;
  role: StaffRole;
  isActive: boolean;
  createdAt: Date;
  kitchenCategoryId?: string;
}

export interface SecurityEvent {
  id: string;
  actorId: string;
  role: StaffRole | 'system' | 'customer' | 'owner' | 'marketer' | 'cafe_admin' | 'manager';
  attemptedAction: string;
  targetId: string;
  timestamp: Date;
  blocked: boolean;
  reason?: string;
}

class MockState {
  private ordersRepo: any;
  private staffRepo: any;
  private cafeteriasRepo: any;
  private ledgerRepo: any;
  private configRepo: any;
  private securityEventsRepo: any;
  
  private persistenceAdapter: LocalStoragePersistenceAdapter;
  private subscribers: Set<() => void> = new Set();

  constructor() {
    if (USE_SUPABASE) {
      this.ordersRepo = new SupabaseOrdersRepo();
      this.staffRepo = new SupabaseStaffRepo();
      this.cafeteriasRepo = new SupabaseCafeteriasRepo();
      this.ledgerRepo = new SupabaseLedgerRepo();
      this.configRepo = new SupabaseConfigRepo();
      this.securityEventsRepo = new SupabaseSecurityEventsRepo();
    } else {
      this.ordersRepo = new InMemoryOrdersRepo();
      this.staffRepo = new InMemoryStaffRepo();
      this.cafeteriasRepo = new InMemoryCafeteriasRepo();
      this.ledgerRepo = new InMemoryLedgerRepo();
      this.configRepo = new InMemoryConfigRepo();
      this.securityEventsRepo = new InMemorySecurityEventsRepo();
    }
    
    this.persistenceAdapter = new LocalStoragePersistenceAdapter();
    
    if (!USE_SUPABASE) {
      this.loadFromLocalStorage();
    }
  }

  private loadFromLocalStorage() {
    const loaded = this.persistenceAdapter.load({
      orders: this.ordersRepo,
      staff: this.staffRepo,
      cafeterias: this.cafeteriasRepo,
      ledger: this.ledgerRepo,
      config: this.configRepo,
      securityEvents: this.securityEventsRepo
    });

    if (!loaded) {
      this.initializeData();
    }
  }

  private initializeData() {
    const sections = SeedDataInitializer.getWaiterSections();
    sections.forEach(s => this.cafeteriasRepo.addWaiterSection(s));

    const kitchenCategories = SeedDataInitializer.getKitchenCategories();
    kitchenCategories.forEach(k => this.cafeteriasRepo.addKitchenCategory(k));

    const staff = SeedDataInitializer.getStaff();
    staff.forEach(s => this.staffRepo.create(s));

    const tables = SeedDataInitializer.getWaiterTables();
    tables.forEach(t => this.cafeteriasRepo.addWaiterTable(t));

    const cafeterias = SeedDataInitializer.getCafeterias();
    cafeterias.forEach(c => (this.cafeteriasRepo as any)._getBackingStore().cafeterias.push(c));

    const menuCategories = SeedDataInitializer.getMenuCategories();
    menuCategories.forEach(mc => this.cafeteriasRepo.addMenuCategory(mc));

    const menuItems = SeedDataInitializer.getMenuItems();
    menuItems.forEach(mi => this.cafeteriasRepo.addMenuItem(mi));
  }

  subscribe(callback: () => void) {
    this.subscribers.add(callback);
    return () => this.subscribers.delete(callback);
  }

  private notifySubscribers() {
    this.subscribers.forEach(callback => callback());
    if (!USE_SUPABASE) {
      this.persistenceAdapter.saveLater({
        orders: this.ordersRepo,
        staff: this.staffRepo,
        cafeterias: this.cafeteriasRepo,
        ledger: this.ledgerRepo,
        config: this.configRepo,
        securityEvents: this.securityEventsRepo
      });
    }
  }

  async getCommissionConfig(): Promise<CommissionConfig> {
    return await this.configRepo.getCommissionConfig();
  }

  async updateCommissionConfig(config: Partial<CommissionConfig>) {
    await this.configRepo.updateCommissionConfig(config);
    this.notifySubscribers();
  }

  async getTrialConfig(): Promise<TrialConfig> {
    return await this.configRepo.getTrialConfig();
  }

  async updateTrialConfig(config: Partial<TrialConfig>) {
    await this.configRepo.updateTrialConfig(config);
    this.notifySubscribers();
  }

  async getOrders(): Promise<Order[]> {
    return await this.ordersRepo.getAll();
  }

  async getOrderById(orderId: string): Promise<Order | undefined> {
    return await this.ordersRepo.getById(orderId);
  }

  async getOrdersByCafeteriaId(cafeteriaId: string): Promise<Order[]> {
    return await this.ordersRepo.getByCafeteriaId(cafeteriaId);
  }

  async createOrder(sessionId: string, cafeteriaId: string, items: OrderItem[], payload: { cafeteria_code: string, table_code: string, table_number_display: string, version: string }): Promise<Order> {
    const cafe = await this.cafeteriasRepo.getById(cafeteriaId);
    
    if (cafe) {
      if (cafe.points <= 0) {
        throw new Error("Cafeteria has insufficient points to create orders.");
      }
      if (cafe.isTrialExpired) {
        throw new Error("Cafeteria trial has expired. Cannot create orders.");
      }
    }

    const { cafeteria_code, table_code, table_number_display } = payload;
    if (!table_code) throw new Error("Cannot create order without a valid table_code.");

    const cafeteria = await this.cafeteriasRepo.getById(cafeteriaId);
    if (!cafeteria || cafeteria.code !== cafeteria_code) {
      throw new Error("Invalid cafeteria_code or cafeteria not found.");
    }

    const allTables = await this.cafeteriasRepo.getWaiterTables(cafeteriaId);
    const table = allTables.find((t: any) => t.referenceCode === table_code);
    if (!table) throw new Error("Table not found or does not belong to this cafeteria.");
    if (!table.is_active) throw new Error("Table is currently inactive.");

    const newOrder: Order = {
      id: `order-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      sessionId,
      cafeteriaId,
      items,
      status: 'created',
      total: items.reduce((sum, item) => sum + item.price * item.quantity, 0),
      createdAt: new Date(),
      cafeteria_code,
      table_code,
      table_number_display,
    };

    const result = await this.ordersRepo.create(newOrder);
    this.notifySubscribers();
    return result;
  }

  async updateOrderStatus(orderId: string, newStatus: OrderStatus, actorId?: string, actorRole?: StaffRole): Promise<Order | undefined> {
    const order = await this.ordersRepo.getById(orderId);
    if (!order) return undefined;

    if (!isValidStatusTransition(order.status, newStatus)) {
      if (actorId && actorRole) {
        await this.logSecurityEvent({
          id: `sec-${Date.now()}`,
          actorId,
          role: actorRole,
          attemptedAction: `Invalid transition: ${order.status} -> ${newStatus}`,
          targetId: orderId,
          timestamp: new Date(),
          blocked: true,
          reason: "Invalid status transition"
        });
      }
      throw new Error(`Invalid status transition from ${order.status} to ${newStatus}`);
    }

    if (newStatus === 'paid') {
      if (USE_SUPABASE) {
        const { data, error } = await supabase.rpc('process_order_payment', {
          p_order_id: orderId,
          p_payment_method: 'points'
        });
        if (error) throw error;
        if (data && !data.success) throw new Error(data.error || "Payment failed");
        
        // Refresh order to get updated status from DB
        return await this.ordersRepo.getById(orderId);
      } else {
        const pointsToDeduct = calculatePointsToDeduct(order.total);
        const cafe = await this.cafeteriasRepo.getById(order.cafeteriaId);
        if (!cafe || cafe.points < pointsToDeduct) {
          throw new Error("Insufficient points in cafeteria.");
        }
        await this.cafeteriasRepo.updatePoints(order.cafeteriaId, -pointsToDeduct);
        await this.ledgerRepo.addEntry({
          id: `led-${Date.now()}`,
          type: 'order_payment',
          amount: pointsToDeduct,
          orderId,
          cafeteriaId: order.cafeteriaId,
          timestamp: new Date(),
          description: `Payment for order ${orderId}`
        });
      }
    }

    const updatedOrder = await this.ordersRepo.updateStatus(orderId, newStatus);
    this.notifySubscribers();
    return updatedOrder;
  }

  async getCafeterias(): Promise<Cafeteria[]> {
    return await this.cafeteriasRepo.getAll();
  }

  async getCafeteriaById(cafeteriaId: string): Promise<Cafeteria | undefined> {
    return await this.cafeteriasRepo.getById(cafeteriaId);
  }

  async updateCafeteriaPoints(cafeteriaId: string, pointsChange: number): Promise<Cafeteria | undefined> {
    const result = await this.cafeteriasRepo.updatePoints(cafeteriaId, pointsChange);
    this.notifySubscribers();
    return result;
  }

  async getMenuCategories(): Promise<MenuCategory[]> {
    return await this.cafeteriasRepo.getMenuCategories();
  }

  async addMenuCategory(name: string, description?: string): Promise<MenuCategory> {
    const result = await this.cafeteriasRepo.addMenuCategory({
      id: `cat-${Date.now()}`,
      name,
      description
    });
    this.notifySubscribers();
    return result;
  }

  async getMenuItemsByCategoryId(categoryId: string): Promise<MenuItem[]> {
    return await this.cafeteriasRepo.getMenuItemsByCategoryId(categoryId);
  }

  async getMenuItemById(itemId: string): Promise<MenuItem | undefined> {
    return await this.cafeteriasRepo.getMenuItemById(itemId);
  }

  async addMenuItem(categoryId: string, name: string, description: string, price: number): Promise<MenuItem> {
    const result = await this.cafeteriasRepo.addMenuItem({
      id: `item-${Date.now()}`,
      categoryId,
      name,
      description,
      price,
      isAvailable: true
    });
    this.notifySubscribers();
    return result;
  }

  async addLedgerEntry(entry: Omit<LedgerEntry, 'id' | 'timestamp'>): Promise<LedgerEntry> {
    const result = await this.ledgerRepo.addEntry({
      ...entry,
      id: `led-${Date.now()}`,
      timestamp: new Date()
    });
    this.notifySubscribers();
    return result;
  }

  async getLedgerEntries(): Promise<LedgerEntry[]> {
    return await this.ledgerRepo.getAllEntries();
  }

  async getRechargeRequests(): Promise<RechargeRequest[]> {
    return await this.ledgerRepo.getAllRechargeRequests();
  }

  async getRechargeRequestsByCafeteriaId(cafeteriaId: string): Promise<RechargeRequest[]> {
    return await this.ledgerRepo.getRechargeRequestsByCafeteriaId(cafeteriaId);
  }

  async createRechargeRequest(cafeteriaId: string, amount: number, proofImageUrl: string): Promise<RechargeRequest> {
    const result = await this.ledgerRepo.createRechargeRequest({
      id: `req-${Date.now()}`,
      cafeteriaId,
      amount,
      proofImageUrl,
      status: 'pending',
      createdAt: new Date()
    });
    this.notifySubscribers();
    return result;
  }

  async processRechargeRequest(requestId: string, status: 'approved' | 'rejected', notes?: string): Promise<RechargeRequest | undefined> {
    const result = await this.ledgerRepo.updateRechargeRequestStatus(requestId, status, new Date(), notes);
    if (result && status === 'approved') {
      await this.cafeteriasRepo.updatePoints(result.cafeteriaId, result.amount);
      await this.ledgerRepo.addEntry({
        id: `led-${Date.now()}`,
        type: 'recharge_credit',
        amount: result.amount,
        cafeteriaId: result.cafeteriaId,
        timestamp: new Date(),
        description: `Recharge approved for request ${requestId}`
      });
    }
    this.notifySubscribers();
    return result;
  }

  async getStaff(): Promise<Staff[]> {
    return await this.staffRepo.getAll();
  }

  async getStaffByCafeteriaId(cafeteriaId: string): Promise<Staff[]> {
    return await this.staffRepo.getByCafeteriaId(cafeteriaId);
  }

  async updateStaffStatus(staffId: string, isActive: boolean): Promise<Staff | undefined> {
    const result = await this.staffRepo.updateStatus(staffId, isActive);
    this.notifySubscribers();
    return result;
  }

  async logSecurityEvent(event: SecurityEvent): Promise<void> {
    await this.securityEventsRepo.log(event);
    this.notifySubscribers();
  }

  async getSecurityEvents(): Promise<SecurityEvent[]> {
    return await this.securityEventsRepo.getAll();
  }

  async reset() {
    if (!USE_SUPABASE) {
      this.ordersRepo = new InMemoryOrdersRepo();
      this.staffRepo = new InMemoryStaffRepo();
      this.cafeteriasRepo = new InMemoryCafeteriasRepo();
      this.ledgerRepo = new InMemoryLedgerRepo();
      this.configRepo = new InMemoryConfigRepo();
      this.securityEventsRepo = new InMemorySecurityEventsRepo();
      this.initializeData();
      this.notifySubscribers();
    }
  }

  async getWaiterSections(cafeteriaId: string): Promise<WaiterSection[]> {
    return await this.cafeteriasRepo.getWaiterSections(cafeteriaId);
  }

  async getWaiterTables(cafeteriaId: string): Promise<WaiterTable[]> {
    return await this.cafeteriasRepo.getWaiterTables(cafeteriaId);
  }

  async getKitchenCategories(cafeteriaId: string): Promise<KitchenCategory[]> {
    return await this.cafeteriasRepo.getKitchenCategories(cafeteriaId);
  }
}

export const mockState = new MockState();
