export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type UserRole = "customer" | "dealer" | "admin";
export type OrderStatus = "pending" | "processing" | "shipped" | "delivered" | "cancelled";
export type SubscriptionStatus = "active" | "paused" | "cancelled";
export type BoxSize = "starter" | "voyager" | "bunker";
export type DealerTier = "bronze" | "silver" | "gold" | "platinum";

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          full_name: string | null;
          avatar_url: string | null;
          role: UserRole;
          phone: string | null;
          address: Json | null;
          credits: number;
          organization_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          full_name?: string | null;
          avatar_url?: string | null;
          role?: UserRole;
          phone?: string | null;
          address?: Json | null;
          credits?: number;
          organization_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          full_name?: string | null;
          avatar_url?: string | null;
          role?: UserRole;
          phone?: string | null;
          address?: Json | null;
          credits?: number;
          organization_id?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      organizations: {
        Row: {
          id: string;
          name: string;
          logo_url: string | null;
          custom_domain: string | null;
          dealer_tier: DealerTier;
          stripe_connect_id: string | null;
          commission_rate: number;
          contact_email: string;
          contact_phone: string | null;
          address: Json | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          logo_url?: string | null;
          custom_domain?: string | null;
          dealer_tier?: DealerTier;
          stripe_connect_id?: string | null;
          commission_rate?: number;
          contact_email: string;
          contact_phone?: string | null;
          address?: Json | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          name?: string;
          logo_url?: string | null;
          custom_domain?: string | null;
          dealer_tier?: DealerTier;
          stripe_connect_id?: string | null;
          commission_rate?: number;
          contact_email?: string;
          contact_phone?: string | null;
          address?: Json | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      aura_products: {
        Row: {
          id: string;
          sku: string;
          name: string;
          description: string | null;
          short_description: string | null;
          price: number;
          compare_at_price: number | null;
          image_url: string | null;
          images: string[];
          stock_level: number;
          is_bunker_safe: boolean;
          shelf_life_months: number | null;
          weight_oz: number | null;
          nutritional_info: Json | null;
          ingredients: string | null;
          category: string;
          tags: string[];
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          sku: string;
          name: string;
          description?: string | null;
          short_description?: string | null;
          price: number;
          compare_at_price?: number | null;
          image_url?: string | null;
          images?: string[];
          stock_level?: number;
          is_bunker_safe?: boolean;
          shelf_life_months?: number | null;
          weight_oz?: number | null;
          nutritional_info?: Json | null;
          ingredients?: string | null;
          category: string;
          tags?: string[];
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          sku?: string;
          name?: string;
          description?: string | null;
          short_description?: string | null;
          price?: number;
          compare_at_price?: number | null;
          image_url?: string | null;
          images?: string[];
          stock_level?: number;
          is_bunker_safe?: boolean;
          shelf_life_months?: number | null;
          weight_oz?: number | null;
          nutritional_info?: Json | null;
          ingredients?: string | null;
          category?: string;
          tags?: string[];
          is_active?: boolean;
          updated_at?: string;
        };
        Relationships: [];
      };
      aura_subscriptions: {
        Row: {
          id: string;
          user_id: string;
          stripe_subscription_id: string | null;
          box_size: BoxSize;
          box_config: string[];
          status: SubscriptionStatus;
          price: number;
          next_delivery_date: string | null;
          delivery_frequency_days: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          stripe_subscription_id?: string | null;
          box_size: BoxSize;
          box_config?: string[];
          status?: SubscriptionStatus;
          price: number;
          next_delivery_date?: string | null;
          delivery_frequency_days?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          stripe_subscription_id?: string | null;
          box_size?: BoxSize;
          box_config?: string[];
          status?: SubscriptionStatus;
          price?: number;
          next_delivery_date?: string | null;
          delivery_frequency_days?: number;
          updated_at?: string;
        };
        Relationships: [];
      };
      aura_orders: {
        Row: {
          id: string;
          order_number: string | null;
          user_id: string;
          subscription_id: string | null;
          organization_id: string | null;
          dealer_attribution_id: string | null;
          stripe_payment_intent_id: string | null;
          status: OrderStatus;
          subtotal: number;
          discount: number;
          shipping: number;
          tax: number;
          total: number;
          items: Json;
          shipping_address: Json;
          billing_address: Json | null;
          tracking_number: string | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          order_number?: string | null;
          user_id: string;
          subscription_id?: string | null;
          organization_id?: string | null;
          dealer_attribution_id?: string | null;
          stripe_payment_intent_id?: string | null;
          status?: OrderStatus;
          subtotal: number;
          discount?: number;
          shipping?: number;
          tax?: number;
          total: number;
          items: Json;
          shipping_address: Json;
          billing_address?: Json | null;
          tracking_number?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          order_number?: string | null;
          subscription_id?: string | null;
          organization_id?: string | null;
          dealer_attribution_id?: string | null;
          stripe_payment_intent_id?: string | null;
          status?: OrderStatus;
          subtotal?: number;
          discount?: number;
          shipping?: number;
          tax?: number;
          total?: number;
          items?: Json;
          shipping_address?: Json;
          billing_address?: Json | null;
          tracking_number?: string | null;
          notes?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      dealers: {
        Row: {
          id: string;
          profile_id: string;
          organization_id: string;
          qr_code_url: string | null;
          referral_code: string;
          commission_earned: number;
          commission_paid: number;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          profile_id: string;
          organization_id: string;
          qr_code_url?: string | null;
          referral_code: string;
          commission_earned?: number;
          commission_paid?: number;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          qr_code_url?: string | null;
          referral_code?: string;
          commission_earned?: number;
          commission_paid?: number;
          is_active?: boolean;
          updated_at?: string;
        };
        Relationships: [];
      };
      inventory: {
        Row: {
          id: string;
          product_id: string;
          warehouse_location: string;
          quantity: number;
          reserved_quantity: number;
          safety_stock: number;
          reorder_point: number;
          last_restock_date: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          product_id: string;
          warehouse_location?: string;
          quantity?: number;
          reserved_quantity?: number;
          safety_stock?: number;
          reorder_point?: number;
          last_restock_date?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          warehouse_location?: string;
          quantity?: number;
          reserved_quantity?: number;
          safety_stock?: number;
          reorder_point?: number;
          last_restock_date?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      gift_cards: {
        Row: {
          id: string;
          code: string;
          initial_balance: number;
          current_balance: number;
          purchased_by: string | null;
          recipient_email: string | null;
          is_active: boolean;
          expires_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          code: string;
          initial_balance: number;
          current_balance: number;
          purchased_by?: string | null;
          recipient_email?: string | null;
          is_active?: boolean;
          expires_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          current_balance?: number;
          recipient_email?: string | null;
          is_active?: boolean;
          expires_at?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      omni_interaction_log: {
        Row: {
          id: string;
          user_id: string | null;
          channel: string;
          direction: string;
          content: string;
          metadata: Json | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          channel: string;
          direction: string;
          content: string;
          metadata?: Json | null;
          created_at?: string;
        };
        Update: {
          user_id?: string | null;
          channel?: string;
          direction?: string;
          content?: string;
          metadata?: Json | null;
        };
        Relationships: [];
      };
      vending_machines: {
        Row: {
          id: string;
          organization_id: string;
          name: string;
          location: string;
          coordinates: Json | null;
          status: string;
          last_checkin: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          name: string;
          location: string;
          coordinates?: Json | null;
          status?: string;
          last_checkin?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          name?: string;
          location?: string;
          coordinates?: Json | null;
          status?: string;
          last_checkin?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      vending_machine_inventory: {
        Row: {
          id: string;
          machine_id: string;
          product_id: string;
          slot_number: number;
          quantity: number;
          max_quantity: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          machine_id: string;
          product_id: string;
          slot_number: number;
          quantity?: number;
          max_quantity?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          slot_number?: number;
          quantity?: number;
          max_quantity?: number;
          updated_at?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      user_role: UserRole;
      order_status: OrderStatus;
      subscription_status: SubscriptionStatus;
      box_size: BoxSize;
      dealer_tier: DealerTier;
    };
  };
}

// Helper types for easier access
export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type Organization = Database["public"]["Tables"]["organizations"]["Row"];
export type Product = Database["public"]["Tables"]["aura_products"]["Row"];
export type Subscription = Database["public"]["Tables"]["aura_subscriptions"]["Row"];
export type Order = Database["public"]["Tables"]["aura_orders"]["Row"];
export type Dealer = Database["public"]["Tables"]["dealers"]["Row"];
export type Inventory = Database["public"]["Tables"]["inventory"]["Row"];
export type GiftCard = Database["public"]["Tables"]["gift_cards"]["Row"];
export type InteractionLog = Database["public"]["Tables"]["omni_interaction_log"]["Row"];
export type VendingMachine = Database["public"]["Tables"]["vending_machines"]["Row"];
export type VendingMachineInventory = Database["public"]["Tables"]["vending_machine_inventory"]["Row"];
