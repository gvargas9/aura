export * from "./database";

// Box configuration types
export interface BoxConfig {
  size: "starter" | "voyager" | "bunker";
  slots: number;
  price: number;
  description: string;
}

export const BOX_CONFIGS: Record<string, BoxConfig> = {
  starter: {
    size: "starter",
    slots: 8,
    price: 59.99,
    description: "Perfect for individuals - 8 premium meals",
  },
  voyager: {
    size: "voyager",
    slots: 12,
    price: 84.99,
    description: "Great for couples - 12 premium meals",
  },
  bunker: {
    size: "bunker",
    slots: 24,
    price: 149.99,
    description: "Family pack - 24 premium meals",
  },
};

// Cart types
export interface CartItem {
  productId: string;
  quantity: number;
  price: number;
  name: string;
  image?: string;
}

export interface Cart {
  items: CartItem[];
  subtotal: number;
  discount: number;
  shipping: number;
  tax: number;
  total: number;
}

// Address types
export interface Address {
  firstName: string;
  lastName: string;
  address1: string;
  address2?: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  phone?: string;
}

// API Response types
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Pagination types
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// Filter types
export interface ProductFilters {
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  isBunkerSafe?: boolean;
  inStock?: boolean;
  search?: string;
  sortBy?: "price_asc" | "price_desc" | "name" | "newest";
}

// Order item type
export interface OrderItem {
  productId: string;
  sku: string;
  name: string;
  quantity: number;
  price: number;
  image?: string;
}

// Checkout types
export interface CheckoutData {
  items: OrderItem[];
  shippingAddress: Address;
  billingAddress?: Address;
  useShippingAsBilling: boolean;
  promoCode?: string;
  giftCardCode?: string;
  notes?: string;
}

// Dealer dashboard stats
export interface DealerStats {
  totalOrders: number;
  totalRevenue: number;
  commissionEarned: number;
  commissionPending: number;
  activeReferrals: number;
  conversionRate: number;
}

// Admin dashboard stats
export interface AdminDashboardStats {
  totalRevenue: number;
  totalOrders: number;
  totalCustomers: number;
  totalProducts: number;
  activeSubscriptions: number;
  revenueByMonth: Array<{ month: string; revenue: number }>;
  ordersByStatus: Record<string, number>;
  topProducts: Array<{ id: string; name: string; sales: number }>;
}
