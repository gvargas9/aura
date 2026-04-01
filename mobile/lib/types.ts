export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  image_url: string | null;
  category: string;
  dietary_labels: string[];
  allergens: string[];
  shelf_life_days: number | null;
  in_stock: boolean;
  created_at: string;
}

export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  role: 'customer' | 'dealer' | 'admin';
  credits: number;
  dietary_preferences: string[];
  avatar_url: string | null;
}

export interface Order {
  id: string;
  user_id: string;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  total: number;
  purchase_type: 'one_time' | 'subscription';
  created_at: string;
  items: OrderItem[];
}

export interface OrderItem {
  id: string;
  product_id: string;
  product_name: string;
  quantity: number;
  unit_price: number;
}

export interface BoxConfig {
  tier: BoxTier;
  products: string[]; // product IDs
}

export type BoxTier = 'starter' | 'voyager' | 'bunker';

export interface BoxTierConfig {
  name: string;
  slots: number;
  subscriptionPrice: number;
  oneTimePrice: number;
  savings: string;
}

export const BOX_TIERS: Record<BoxTier, BoxTierConfig> = {
  starter: {
    name: 'Starter',
    slots: 8,
    subscriptionPrice: 59.99,
    oneTimePrice: 69.99,
    savings: '14%',
  },
  voyager: {
    name: 'Voyager',
    slots: 12,
    subscriptionPrice: 84.99,
    oneTimePrice: 99.99,
    savings: '15%',
  },
  bunker: {
    name: 'Bunker',
    slots: 24,
    subscriptionPrice: 149.99,
    oneTimePrice: 179.99,
    savings: '17%',
  },
};
