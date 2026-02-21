import type { 
  Order, 
  Cafeteria, 
  MenuCategory, 
  MenuItem, 
  LedgerEntry, 
  RechargeRequest, 
  PayoutRecord,
  WaiterSection,
  WaiterTable,
  KitchenCategory,
  Staff,
  WaiterSession,
  SecurityEvent,
  CommissionConfig,
  TrialConfig
} from '../../../lib/shared_mock_state';

import type { InMemoryOrdersRepo } from '../in_memory/InMemoryOrdersRepo';
import type { InMemoryStaffRepo } from '../in_memory/InMemoryStaffRepo';
import type { InMemoryCafeteriasRepo } from '../in_memory/InMemoryCafeteriasRepo';
import type { InMemoryLedgerRepo } from '../in_memory/InMemoryLedgerRepo';
import type { InMemoryConfigRepo } from '../in_memory/InMemoryConfigRepo';
import type { InMemorySecurityEventsRepo } from '../in_memory/InMemorySecurityEventsRepo';

const STORAGE_KEY = 'cafeteria_sandbox_state_v0.9';
const LEGACY_KEYS = ['cafeteria_sandbox_state_v0.8', 'cafeteria_sandbox_state_v0.6.3'];

interface PersistedState {
  orders: Order[];
  cafeterias: Cafeteria[];
  menuCategories: MenuCategory[];
  menuItems: MenuItem[];
  ledger: LedgerEntry[];
  rechargeRequests: RechargeRequest[];
  payoutRecords: PayoutRecord[];
  waiterSections: WaiterSection[];
  waiterTables: WaiterTable[];
  kitchenCategories: KitchenCategory[];
  staff: Staff[];
  waiterSessions: Record<string, WaiterSession>;
  commissionConfig: CommissionConfig;
  trialConfig: TrialConfig;
  securityEvents: SecurityEvent[];
}

/**
 * LocalStorage persistence adapter.
 * Handles saving and loading repository state to/from browser localStorage.
 */
export class LocalStoragePersistenceAdapter {
  private saveTimeout: NodeJS.Timeout | null = null;

  /**
   * Load state from localStorage and populate repositories.
   */
  load(repos: {
    orders: InMemoryOrdersRepo;
    staff: InMemoryStaffRepo;
    cafeterias: InMemoryCafeteriasRepo;
    ledger: InMemoryLedgerRepo;
    config: InMemoryConfigRepo;
    securityEvents: InMemorySecurityEventsRepo;
  }): boolean {
    if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
      return false;
    }

    try {
      let serialized = localStorage.getItem(STORAGE_KEY);

      // Try legacy keys if current key not found
      if (!serialized) {
        for (const legacyKey of LEGACY_KEYS) {
          const legacyData = localStorage.getItem(legacyKey);
          if (legacyData) {
            serialized = legacyData;
            break;
          }
        }
      }

      if (!serialized) {
        return false;
      }

      const parsed: PersistedState = JSON.parse(serialized);

      if (!parsed || typeof parsed !== 'object') {
        throw new Error('Invalid state schema');
      }

      // Restore orders with date conversion
      const orders = (parsed.orders || []).map((o: any) => ({
        ...o,
        createdAt: new Date(o.createdAt)
      }));
      (repos.orders as any)._setBackingStore(orders);

      // Restore staff and sessions
      const staff = (parsed.staff || []).map((s: any) => ({
        ...s,
        createdAt: new Date(s.createdAt)
      }));
      const sessions = new Map(Object.entries(parsed.waiterSessions || {}));
      (repos.staff as any)._setBackingStore(staff, sessions);

      // Restore cafeterias and related entities
      const cafeteriasData = {
        cafeterias: parsed.cafeterias || [],
        menuCategories: parsed.menuCategories || [],
        menuItems: parsed.menuItems || [],
        waiterSections: parsed.waiterSections || [],
        waiterTables: (parsed.waiterTables || []).map((t: any) => ({
          ...t,
          is_active: t.is_active !== undefined ? t.is_active : true
        })),
        kitchenCategories: parsed.kitchenCategories || []
      };
      (repos.cafeterias as any)._setBackingStore(cafeteriasData);

      // Restore ledger with date conversion
      const ledgerData = {
        ledger: (parsed.ledger || []).map((e: any) => ({
          ...e,
          timestamp: new Date(e.timestamp)
        })),
        rechargeRequests: (parsed.rechargeRequests || []).map((r: any) => ({
          ...r,
          createdAt: new Date(r.createdAt),
          processedAt: r.processedAt ? new Date(r.processedAt) : undefined
        })),
        payoutRecords: (parsed.payoutRecords || []).map((p: any) => ({
          ...p,
          createdAt: new Date(p.createdAt)
        }))
      };
      (repos.ledger as any)._setBackingStore(ledgerData);

      // Restore config
      const configData = {
        commissionConfig: parsed.commissionConfig || {
          rate_direct_parent_percent: 40,
          rate_grandparent_percent: 15,
          rate_owner_percent: 45
        },
        trialConfig: parsed.trialConfig || {
          globalTrialDays: 30
        }
      };
      (repos.config as any)._setBackingStore(configData);

      // Restore security events with date conversion
      const securityEvents = (parsed.securityEvents || []).map((e: any) => ({
        ...e,
        timestamp: new Date(e.timestamp)
      }));
      (repos.securityEvents as any)._setBackingStore(securityEvents);

      return true;
    } catch (error) {
      console.error('[LocalStoragePersistenceAdapter] Failed to load from localStorage:', error);
      return false;
    }
  }

  /**
   * Save repository state to localStorage (debounced).
   */
  saveLater(repos: {
    orders: InMemoryOrdersRepo;
    staff: InMemoryStaffRepo;
    cafeterias: InMemoryCafeteriasRepo;
    ledger: InMemoryLedgerRepo;
    config: InMemoryConfigRepo;
    securityEvents: InMemorySecurityEventsRepo;
  }): void {
    if (this.saveTimeout) {
      clearTimeout(this.saveTimeout);
    }
    this.saveTimeout = setTimeout(() => {
      this.saveNow(repos);
    }, 300);
  }

  /**
   * Save repository state to localStorage immediately.
   */
  saveNow(repos: {
    orders: InMemoryOrdersRepo;
    staff: InMemoryStaffRepo;
    cafeterias: InMemoryCafeteriasRepo;
    ledger: InMemoryLedgerRepo;
    config: InMemoryConfigRepo;
    securityEvents: InMemorySecurityEventsRepo;
  }): void {
    if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
      return;
    }

    try {
      const ordersStore = (repos.orders as any)._getBackingStore();
      const staffStore = (repos.staff as any)._getBackingStore();
      const cafeteriasStore = (repos.cafeterias as any)._getBackingStore();
      const ledgerStore = (repos.ledger as any)._getBackingStore();
      const configStore = (repos.config as any)._getBackingStore();
      const securityEventsStore = (repos.securityEvents as any)._getBackingStore();

      const state: PersistedState = {
        orders: ordersStore,
        cafeterias: cafeteriasStore.cafeterias,
        menuCategories: cafeteriasStore.menuCategories,
        menuItems: cafeteriasStore.menuItems,
        ledger: ledgerStore.ledger,
        rechargeRequests: ledgerStore.rechargeRequests,
        payoutRecords: ledgerStore.payoutRecords,
        waiterSections: cafeteriasStore.waiterSections,
        waiterTables: cafeteriasStore.waiterTables,
        kitchenCategories: cafeteriasStore.kitchenCategories,
        staff: staffStore.staff,
        waiterSessions: Object.fromEntries(staffStore.sessions),
        commissionConfig: configStore.commissionConfig,
        trialConfig: configStore.trialConfig,
        securityEvents: securityEventsStore
      };

      const serialized = JSON.stringify(state);
      localStorage.setItem(STORAGE_KEY, serialized);
    } catch (error) {
      console.error('[LocalStoragePersistenceAdapter] Failed to save to localStorage:', error);
    }
  }

  /**
   * Clear all persisted state from localStorage.
   */
  clear(): void {
    if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
      return;
    }

    try {
      localStorage.removeItem(STORAGE_KEY);
      LEGACY_KEYS.forEach(key => localStorage.removeItem(key));
    } catch (error) {
      console.error('[LocalStoragePersistenceAdapter] Failed to clear persisted state:', error);
    }
  }
}
