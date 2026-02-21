// localStorage persistence utility for cafeteria sandbox state
// Version: v0.6.2

const STORAGE_KEY = 'cafeteria_sandbox_state_v0.6.2';

export interface PersistedState {
  orders: any[];
  cafeterias: any[];
  menuCategories: any[];
  menuItems: any[];
  ledger: any[];
  rechargeRequests: any[];
  payoutRecords: any[];
  waiterSections: any[];
  waiterTables: any[];
  kitchenCategories: any[];
  staff: any[];
  waiterSessions: Record<string, any>;
  commissionConfig: any;
  trialConfig: any;
}

// Debounce helper
let saveTimeout: NodeJS.Timeout | null = null;

export function saveStateToLocalStorage(state: PersistedState): void {
  if (saveTimeout) {
    clearTimeout(saveTimeout);
  }
  
  saveTimeout = setTimeout(() => {
    try {
      const serialized = JSON.stringify(state);
      localStorage.setItem(STORAGE_KEY, serialized);
      console.log('[Persistence] State saved to localStorage');
    } catch (error) {
      console.error('[Persistence] Failed to save state:', error);
    }
  }, 300); // 300ms debounce
}

export function loadStateFromLocalStorage(): PersistedState | null {
  try {
    const serialized = localStorage.getItem(STORAGE_KEY);
    if (!serialized) {
      console.log('[Persistence] No saved state found');
      return null;
    }
    
    const parsed = JSON.parse(serialized);
    
    // Basic schema validation
    if (!parsed || typeof parsed !== 'object') {
      console.warn('[Persistence] Invalid state schema, using seed state');
      return null;
    }
    
    // Convert date strings back to Date objects
    if (parsed.orders) {
      parsed.orders = parsed.orders.map((order: any) => ({
        ...order,
        createdAt: new Date(order.createdAt)
      }));
    }
    
    if (parsed.ledger) {
      parsed.ledger = parsed.ledger.map((entry: any) => ({
        ...entry,
        timestamp: new Date(entry.timestamp)
      }));
    }
    
    if (parsed.rechargeRequests) {
      parsed.rechargeRequests = parsed.rechargeRequests.map((req: any) => ({
        ...req,
        createdAt: new Date(req.createdAt),
        processedAt: req.processedAt ? new Date(req.processedAt) : undefined
      }));
    }
    
    if (parsed.payoutRecords) {
      parsed.payoutRecords = parsed.payoutRecords.map((payout: any) => ({
        ...payout,
        createdAt: new Date(payout.createdAt)
      }));
    }
    
    if (parsed.staff) {
      parsed.staff = parsed.staff.map((s: any) => ({
        ...s,
        createdAt: new Date(s.createdAt)
      }));
    }
    
    console.log('[Persistence] State loaded from localStorage');
    return parsed as PersistedState;
  } catch (error) {
    console.error('[Persistence] Failed to load state:', error);
    return null;
  }
}

export function clearPersistedState(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
    console.log('[Persistence] Persisted state cleared');
  } catch (error) {
    console.error('[Persistence] Failed to clear state:', error);
  }
}
