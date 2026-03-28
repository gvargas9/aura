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
export type InteractionChannel = "web" | "voice" | "sms" | "email" | "ai_bot";
export type MachineStatus = "online" | "offline" | "maintenance" | "low_stock";

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
          churn_risk_score: number | null;
          taste_preferences: Json | null;
          dietary_restrictions: string[] | null;
          metadata: Json | null;
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
          churn_risk_score?: number | null;
          taste_preferences?: Json | null;
          dietary_restrictions?: string[] | null;
          metadata?: Json | null;
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
          churn_risk_score?: number | null;
          taste_preferences?: Json | null;
          dietary_restrictions?: string[] | null;
          metadata?: Json | null;
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
          metadata: Json | null;
          is_active: boolean;
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
          metadata?: Json | null;
          is_active?: boolean;
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
          metadata?: Json | null;
          is_active?: boolean;
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
          cost_price: number | null;
          image_url: string | null;
          images: string[];
          stock_level: number;
          is_bunker_safe: boolean;
          shelf_life_months: number | null;
          weight_oz: number | null;
          nutritional_info: Json | null;
          ingredients: string | null;
          allergens: string[] | null;
          category: string;
          tags: string[];
          is_active: boolean;
          sort_order: number;
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
          cost_price?: number | null;
          image_url?: string | null;
          images?: string[];
          stock_level?: number;
          is_bunker_safe?: boolean;
          shelf_life_months?: number | null;
          weight_oz?: number | null;
          nutritional_info?: Json | null;
          ingredients?: string | null;
          allergens?: string[] | null;
          category: string;
          tags?: string[];
          is_active?: boolean;
          sort_order?: number;
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
          cost_price?: number | null;
          image_url?: string | null;
          images?: string[];
          stock_level?: number;
          is_bunker_safe?: boolean;
          shelf_life_months?: number | null;
          weight_oz?: number | null;
          nutritional_info?: Json | null;
          ingredients?: string | null;
          allergens?: string[] | null;
          category?: string;
          tags?: string[];
          is_active?: boolean;
          sort_order?: number;
          updated_at?: string;
        };
        Relationships: [];
      };
      categories: {
        Row: {
          id: string;
          name: string;
          slug: string;
          description: string | null;
          image_url: string | null;
          parent_id: string | null;
          sort_order: number;
          is_active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          description?: string | null;
          image_url?: string | null;
          parent_id?: string | null;
          sort_order?: number;
          is_active?: boolean;
          created_at?: string;
        };
        Update: {
          name?: string;
          slug?: string;
          description?: string | null;
          image_url?: string | null;
          parent_id?: string | null;
          sort_order?: number;
          is_active?: boolean;
        };
        Relationships: [];
      };
      organization_price_rules: {
        Row: {
          id: string;
          organization_id: string;
          product_id: string | null;
          category: string | null;
          discount_percentage: number | null;
          fixed_price: number | null;
          min_quantity: number | null;
          is_active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          product_id?: string | null;
          category?: string | null;
          discount_percentage?: number | null;
          fixed_price?: number | null;
          min_quantity?: number | null;
          is_active?: boolean;
          created_at?: string;
        };
        Update: {
          organization_id?: string;
          product_id?: string | null;
          category?: string | null;
          discount_percentage?: number | null;
          fixed_price?: number | null;
          min_quantity?: number | null;
          is_active?: boolean;
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
          shipping_address: Json;
          auto_fill_enabled: boolean;
          pause_until: string | null;
          cancelled_at: string | null;
          cancellation_reason: string | null;
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
          shipping_address: Json;
          auto_fill_enabled?: boolean;
          pause_until?: string | null;
          cancelled_at?: string | null;
          cancellation_reason?: string | null;
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
          shipping_address?: Json;
          auto_fill_enabled?: boolean;
          pause_until?: string | null;
          cancelled_at?: string | null;
          cancellation_reason?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      subscription_selections: {
        Row: {
          id: string;
          subscription_id: string;
          delivery_date: string;
          product_ids: string[];
          is_confirmed: boolean;
          confirmed_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          subscription_id: string;
          delivery_date: string;
          product_ids: string[];
          is_confirmed?: boolean;
          confirmed_at?: string | null;
          created_at?: string;
        };
        Update: {
          subscription_id?: string;
          delivery_date?: string;
          product_ids?: string[];
          is_confirmed?: boolean;
          confirmed_at?: string | null;
        };
        Relationships: [];
      };
      aura_orders: {
        Row: {
          id: string;
          order_number: string;
          user_id: string;
          subscription_id: string | null;
          organization_id: string | null;
          dealer_attribution_id: string | null;
          stripe_payment_intent_id: string | null;
          stripe_invoice_id: string | null;
          status: OrderStatus;
          subtotal: number;
          discount: number;
          shipping: number;
          tax: number;
          total: number;
          currency: string;
          items: Json;
          shipping_address: Json;
          billing_address: Json | null;
          tracking_number: string | null;
          tracking_url: string | null;
          shipped_at: string | null;
          delivered_at: string | null;
          notes: string | null;
          internal_notes: string | null;
          metadata: Json | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          order_number: string;
          user_id: string;
          subscription_id?: string | null;
          organization_id?: string | null;
          dealer_attribution_id?: string | null;
          stripe_payment_intent_id?: string | null;
          stripe_invoice_id?: string | null;
          status?: OrderStatus;
          subtotal: number;
          discount?: number;
          shipping?: number;
          tax?: number;
          total: number;
          currency?: string;
          items: Json;
          shipping_address: Json;
          billing_address?: Json | null;
          tracking_number?: string | null;
          tracking_url?: string | null;
          shipped_at?: string | null;
          delivered_at?: string | null;
          notes?: string | null;
          internal_notes?: string | null;
          metadata?: Json | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          order_number?: string;
          subscription_id?: string | null;
          organization_id?: string | null;
          dealer_attribution_id?: string | null;
          stripe_payment_intent_id?: string | null;
          stripe_invoice_id?: string | null;
          status?: OrderStatus;
          subtotal?: number;
          discount?: number;
          shipping?: number;
          tax?: number;
          total?: number;
          currency?: string;
          items?: Json;
          shipping_address?: Json;
          billing_address?: Json | null;
          tracking_number?: string | null;
          tracking_url?: string | null;
          shipped_at?: string | null;
          delivered_at?: string | null;
          notes?: string | null;
          internal_notes?: string | null;
          metadata?: Json | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      order_items: {
        Row: {
          id: string;
          order_id: string;
          product_id: string;
          sku: string;
          name: string;
          quantity: number;
          unit_price: number;
          total_price: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          order_id: string;
          product_id: string;
          sku: string;
          name: string;
          quantity: number;
          unit_price: number;
          total_price: number;
          created_at?: string;
        };
        Update: {
          order_id?: string;
          product_id?: string;
          sku?: string;
          name?: string;
          quantity?: number;
          unit_price?: number;
          total_price?: number;
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
          commission_pending: number;
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
          commission_pending?: number;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          qr_code_url?: string | null;
          referral_code?: string;
          commission_earned?: number;
          commission_paid?: number;
          commission_pending?: number;
          is_active?: boolean;
          updated_at?: string;
        };
        Relationships: [];
      };
      commission_transactions: {
        Row: {
          id: string;
          dealer_id: string;
          order_id: string | null;
          amount: number;
          type: string;
          status: string;
          stripe_payout_id: string | null;
          notes: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          dealer_id: string;
          order_id?: string | null;
          amount: number;
          type: string;
          status?: string;
          stripe_payout_id?: string | null;
          notes?: string | null;
          created_at?: string;
        };
        Update: {
          dealer_id?: string;
          order_id?: string | null;
          amount?: number;
          type?: string;
          status?: string;
          stripe_payout_id?: string | null;
          notes?: string | null;
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
          reorder_quantity: number;
          last_restock_date: string | null;
          next_restock_date: string | null;
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
          reorder_quantity?: number;
          last_restock_date?: string | null;
          next_restock_date?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          warehouse_location?: string;
          quantity?: number;
          reserved_quantity?: number;
          safety_stock?: number;
          reorder_point?: number;
          reorder_quantity?: number;
          last_restock_date?: string | null;
          next_restock_date?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      inventory_transactions: {
        Row: {
          id: string;
          product_id: string;
          warehouse_location: string;
          quantity_change: number;
          type: string;
          reference_id: string | null;
          reference_type: string | null;
          notes: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          product_id: string;
          warehouse_location: string;
          quantity_change: number;
          type: string;
          reference_id?: string | null;
          reference_type?: string | null;
          notes?: string | null;
          created_at?: string;
        };
        Update: {
          product_id?: string;
          warehouse_location?: string;
          quantity_change?: number;
          type?: string;
          reference_id?: string | null;
          reference_type?: string | null;
          notes?: string | null;
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
          recipient_name: string | null;
          message: string | null;
          is_active: boolean;
          expires_at: string | null;
          redeemed_by: string | null;
          redeemed_at: string | null;
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
          recipient_name?: string | null;
          message?: string | null;
          is_active?: boolean;
          expires_at?: string | null;
          redeemed_by?: string | null;
          redeemed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          current_balance?: number;
          recipient_email?: string | null;
          recipient_name?: string | null;
          message?: string | null;
          is_active?: boolean;
          expires_at?: string | null;
          redeemed_by?: string | null;
          redeemed_at?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      gift_card_transactions: {
        Row: {
          id: string;
          gift_card_id: string;
          order_id: string | null;
          amount: number;
          balance_after: number;
          type: string;
          notes: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          gift_card_id: string;
          order_id?: string | null;
          amount: number;
          balance_after: number;
          type: string;
          notes?: string | null;
          created_at?: string;
        };
        Update: {
          gift_card_id?: string;
          order_id?: string | null;
          amount?: number;
          balance_after?: number;
          type?: string;
          notes?: string | null;
        };
        Relationships: [];
      };
      omni_interaction_log: {
        Row: {
          id: string;
          user_id: string | null;
          session_id: string | null;
          channel: string;
          direction: string;
          content: string;
          content_type: string;
          sentiment_score: number | null;
          intent: string | null;
          metadata: Json | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          session_id?: string | null;
          channel: string;
          direction: string;
          content: string;
          content_type?: string;
          sentiment_score?: number | null;
          intent?: string | null;
          metadata?: Json | null;
          created_at?: string;
        };
        Update: {
          user_id?: string | null;
          session_id?: string | null;
          channel?: string;
          direction?: string;
          content?: string;
          content_type?: string;
          sentiment_score?: number | null;
          intent?: string | null;
          metadata?: Json | null;
        };
        Relationships: [];
      };
      tickets: {
        Row: {
          id: string;
          ticket_number: string;
          user_id: string | null;
          order_id: string | null;
          subject: string;
          description: string;
          status: string;
          priority: string;
          category: string | null;
          assigned_to: string | null;
          resolved_at: string | null;
          resolution: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          ticket_number: string;
          user_id?: string | null;
          order_id?: string | null;
          subject: string;
          description: string;
          status?: string;
          priority?: string;
          category?: string | null;
          assigned_to?: string | null;
          resolved_at?: string | null;
          resolution?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          ticket_number?: string;
          user_id?: string | null;
          order_id?: string | null;
          subject?: string;
          description?: string;
          status?: string;
          priority?: string;
          category?: string | null;
          assigned_to?: string | null;
          resolved_at?: string | null;
          resolution?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      ticket_comments: {
        Row: {
          id: string;
          ticket_id: string;
          user_id: string | null;
          content: string;
          is_internal: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          ticket_id: string;
          user_id?: string | null;
          content: string;
          is_internal?: boolean;
          created_at?: string;
        };
        Update: {
          ticket_id?: string;
          user_id?: string | null;
          content?: string;
          is_internal?: boolean;
        };
        Relationships: [];
      };
      vending_machines: {
        Row: {
          id: string;
          machine_serial: string;
          organization_id: string;
          name: string;
          location: string;
          coordinates: Json | null;
          status: string;
          last_checkin: string | null;
          firmware_version: string | null;
          config: Json | null;
          total_sales: number;
          total_transactions: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          machine_serial: string;
          organization_id: string;
          name: string;
          location: string;
          coordinates?: Json | null;
          status?: string;
          last_checkin?: string | null;
          firmware_version?: string | null;
          config?: Json | null;
          total_sales?: number;
          total_transactions?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          machine_serial?: string;
          name?: string;
          location?: string;
          coordinates?: Json | null;
          status?: string;
          last_checkin?: string | null;
          firmware_version?: string | null;
          config?: Json | null;
          total_sales?: number;
          total_transactions?: number;
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
          price: number;
          last_restocked: string | null;
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
          price: number;
          last_restocked?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          slot_number?: number;
          quantity?: number;
          max_quantity?: number;
          price?: number;
          last_restocked?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      vending_transactions: {
        Row: {
          id: string;
          machine_id: string;
          product_id: string;
          slot_number: number;
          quantity: number;
          price: number;
          payment_method: string | null;
          transaction_ref: string | null;
          qr_redemption_code: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          machine_id: string;
          product_id: string;
          slot_number: number;
          quantity?: number;
          price: number;
          payment_method?: string | null;
          transaction_ref?: string | null;
          qr_redemption_code?: string | null;
          created_at?: string;
        };
        Update: {
          machine_id?: string;
          product_id?: string;
          slot_number?: number;
          quantity?: number;
          price?: number;
          payment_method?: string | null;
          transaction_ref?: string | null;
          qr_redemption_code?: string | null;
        };
        Relationships: [];
      };
      qr_redemptions: {
        Row: {
          id: string;
          code: string;
          user_id: string;
          order_id: string | null;
          product_id: string;
          machine_id: string | null;
          status: string;
          expires_at: string;
          redeemed_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          code: string;
          user_id: string;
          order_id?: string | null;
          product_id: string;
          machine_id?: string | null;
          status?: string;
          expires_at: string;
          redeemed_at?: string | null;
          created_at?: string;
        };
        Update: {
          code?: string;
          user_id?: string;
          order_id?: string | null;
          product_id?: string;
          machine_id?: string | null;
          status?: string;
          expires_at?: string;
          redeemed_at?: string | null;
        };
        Relationships: [];
      };
      storefronts: {
        Row: {
          id: string;
          name: string;
          slug: string;
          domain: string | null;
          logo_url: string | null;
          theme: Json | null;
          settings: Json | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          domain?: string | null;
          logo_url?: string | null;
          theme?: Json | null;
          settings?: Json | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          name?: string;
          slug?: string;
          domain?: string | null;
          logo_url?: string | null;
          theme?: Json | null;
          settings?: Json | null;
          is_active?: boolean;
          updated_at?: string;
        };
        Relationships: [];
      };
      promo_codes: {
        Row: {
          id: string;
          code: string;
          description: string | null;
          discount_type: string;
          discount_value: number;
          min_order_amount: number | null;
          max_discount: number | null;
          usage_limit: number | null;
          usage_count: number;
          per_user_limit: number | null;
          valid_from: string;
          valid_until: string | null;
          applicable_products: string[] | null;
          applicable_categories: string[] | null;
          is_active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          code: string;
          description?: string | null;
          discount_type: string;
          discount_value: number;
          min_order_amount?: number | null;
          max_discount?: number | null;
          usage_limit?: number | null;
          usage_count?: number;
          per_user_limit?: number | null;
          valid_from?: string;
          valid_until?: string | null;
          applicable_products?: string[] | null;
          applicable_categories?: string[] | null;
          is_active?: boolean;
          created_at?: string;
        };
        Update: {
          code?: string;
          description?: string | null;
          discount_type?: string;
          discount_value?: number;
          min_order_amount?: number | null;
          max_discount?: number | null;
          usage_limit?: number | null;
          usage_count?: number;
          per_user_limit?: number | null;
          valid_from?: string;
          valid_until?: string | null;
          applicable_products?: string[] | null;
          applicable_categories?: string[] | null;
          is_active?: boolean;
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
      interaction_channel: InteractionChannel;
      machine_status: MachineStatus;
    };
  };
}

// Helper types for easier access
export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type Organization = Database["public"]["Tables"]["organizations"]["Row"];
export type Product = Database["public"]["Tables"]["aura_products"]["Row"];
export type Category = Database["public"]["Tables"]["categories"]["Row"];
export type Subscription = Database["public"]["Tables"]["aura_subscriptions"]["Row"];
export type SubscriptionSelection = Database["public"]["Tables"]["subscription_selections"]["Row"];
export type Order = Database["public"]["Tables"]["aura_orders"]["Row"];
export type OrderItemRow = Database["public"]["Tables"]["order_items"]["Row"];
export type Dealer = Database["public"]["Tables"]["dealers"]["Row"];
export type CommissionTransaction = Database["public"]["Tables"]["commission_transactions"]["Row"];
export type Inventory = Database["public"]["Tables"]["inventory"]["Row"];
export type InventoryTransaction = Database["public"]["Tables"]["inventory_transactions"]["Row"];
export type GiftCard = Database["public"]["Tables"]["gift_cards"]["Row"];
export type GiftCardTransaction = Database["public"]["Tables"]["gift_card_transactions"]["Row"];
export type InteractionLog = Database["public"]["Tables"]["omni_interaction_log"]["Row"];
export type Ticket = Database["public"]["Tables"]["tickets"]["Row"];
export type TicketComment = Database["public"]["Tables"]["ticket_comments"]["Row"];
export type VendingMachine = Database["public"]["Tables"]["vending_machines"]["Row"];
export type VendingMachineInventory = Database["public"]["Tables"]["vending_machine_inventory"]["Row"];
export type VendingTransaction = Database["public"]["Tables"]["vending_transactions"]["Row"];
export type QrRedemption = Database["public"]["Tables"]["qr_redemptions"]["Row"];
export type Storefront = Database["public"]["Tables"]["storefronts"]["Row"];
export type PromoCode = Database["public"]["Tables"]["promo_codes"]["Row"];
export type OrganizationPriceRule = Database["public"]["Tables"]["organization_price_rules"]["Row"];
