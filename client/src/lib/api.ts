/**
 * Supabase Edge Functions API Client
 * Handles all API calls to the Supabase Edge Functions
 */

const API_BASE_URL = import.meta.env.VITE_SUPABASE_FUNCTIONS_URL || "";
const ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || "";

interface ApiRequestOptions {
  method?: "GET" | "POST" | "PATCH" | "DELETE";
  body?: Record<string, any>;
  headers?: Record<string, string>;
  authToken?: string;
}

async function apiRequest(
  endpoint: string,
  options: ApiRequestOptions = {}
) {
  const {
    method = "GET",
    body,
    headers = {},
    authToken,
  } = options;

  const url = `${API_BASE_URL}${endpoint}`;
  const defaultHeaders: Record<string, string> = {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${authToken || ANON_KEY}`,
  };

  const response = await fetch(url, {
    method,
    headers: { ...defaultHeaders, ...headers },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error || `API Error: ${response.statusText}`);
  }

  return response.json();
}

// ============================================================================
// PUBLIC CAFETERIA APIs
// ============================================================================

export interface Cafeteria {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  category: string;
  avg_rating: number | null;
  reviews_count: number;
  open_now: boolean;
  distance: number | null;
  address?: string;
  phone_number?: string;
  opening_hours?: any[];
  menu_images?: string[];
}

export async function getNearCafeterias(
  lat: number,
  lng: number,
  radius: number,
  authToken?: string
): Promise<Cafeteria[]> {
  return apiRequest(
    `/public-cafeterias/cafeterias?lat=${lat}&lng=${lng}&radius=${radius}`,
    { authToken }
  );
}

export async function getCafeteriaDetails(
  id: string,
  authToken?: string
): Promise<Cafeteria> {
  return apiRequest(`/public-cafeterias/cafeterias/${id}`, { authToken });
}

// ============================================================================
// AUTH APIs
// ============================================================================

export interface AuthResponse {
  message: string;
  user?: {
    id: string;
    email: string;
  };
  session?: {
    access_token: string;
    refresh_token: string;
    expires_in: number;
  };
}

export async function signUp(
  email: string,
  password: string
): Promise<AuthResponse> {
  return apiRequest("/auth/signup", {
    method: "POST",
    body: { email, password },
  });
}

export async function login(
  email: string,
  password: string
): Promise<AuthResponse> {
  return apiRequest("/auth/login", {
    method: "POST",
    body: { email, password },
  });
}

// ============================================================================
// TABLE SESSIONS APIs
// ============================================================================

export interface TableSessionResponse {
  message: string;
  cafeteria_id: string;
  table_id: string;
  table_reference_id: string;
  customer_id: string | null;
}

export async function createTableSession(
  tableRef: string,
  authToken?: string
): Promise<TableSessionResponse> {
  return apiRequest(`/table-sessions-orders/tables/${tableRef}/session`, {
    method: "POST",
    authToken,
  });
}

export async function getTableSession(
  tableRef: string,
  authToken?: string
): Promise<TableSessionResponse> {
  return apiRequest(`/table-sessions-orders/tables/${tableRef}/session`, {
    authToken,
  });
}

// ============================================================================
// ORDERS APIs
// ============================================================================

export interface OrderItem {
  menu_item_id: string;
  quantity: number;
  unit_price: number;
  notes?: string;
}

export interface Order {
  id: string;
  cafeteria_id: string;
  table_id: string;
  total_amount: number;
  currency_code: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export async function createOrder(
  cafeteriaId: string,
  tableId: string,
  totalAmount: number,
  currencyCode: string,
  orderItems: OrderItem[],
  guestSessionId?: string,
  authToken?: string
): Promise<{ message: string; order: Order }> {
  return apiRequest("/table-sessions-orders/orders", {
    method: "POST",
    body: {
      cafeteria_id: cafeteriaId,
      table_id: tableId,
      total_amount: totalAmount,
      currency_code: currencyCode,
      order_items: orderItems,
      guest_session_id: guestSessionId,
    },
    authToken,
  });
}

export async function updateOrderStatus(
  orderId: string,
  status: string,
  authToken?: string
): Promise<{ message: string; order: Order }> {
  return apiRequest(`/table-sessions-orders/orders/${orderId}/status`, {
    method: "PATCH",
    body: { status },
    authToken,
  });
}

// ============================================================================
// REVIEWS APIs
// ============================================================================

export interface Review {
  id: string;
  customer_id: string;
  cafeteria_id: string;
  order_id: string;
  rating: number;
  comment?: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export async function submitReview(
  cafeteriaId: string,
  orderId: string,
  rating: number,
  comment?: string,
  authToken?: string
): Promise<{ message: string; review: Review }> {
  return apiRequest("/reviews/reviews", {
    method: "POST",
    body: {
      cafeteria_id: cafeteriaId,
      order_id: orderId,
      rating,
      comment,
    },
    authToken,
  });
}

export async function adminApproveReview(
  reviewId: string,
  authToken?: string
): Promise<{ message: string; review: Review }> {
  return apiRequest(`/reviews/reviews/${reviewId}/admin-approve`, {
    method: "PATCH",
    authToken,
  });
}

export async function ownerApproveReview(
  reviewId: string,
  authToken?: string
): Promise<{ message: string; review: Review }> {
  return apiRequest(`/reviews/reviews/${reviewId}/owner-approve`, {
    method: "PATCH",
    authToken,
  });
}
