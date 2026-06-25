export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      app_settings: {
        Row: {
          id: string
          key: string
          value: string
          created_at: string
        }
        Insert: {
          id?: string
          key: string
          value: string
          created_at?: string
        }
        Update: {
          id?: string
          key?: string
          value?: string
          created_at?: string
        }
        Relationships: []
      }
      cart_items: {
        Row: {
          cart_id: string
          created_at: string
          id: string
          product_id: string
          quantity: number
          updated_at: string
        }
        Insert: {
          cart_id: string
          created_at?: string
          id?: string
          product_id: string
          quantity?: number
          updated_at?: string
        }
        Update: {
          cart_id?: string
          created_at?: string
          id?: string
          product_id?: string
          quantity?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "cart_items_cart_id_fkey"
            columns: ["cart_id"]
            isOneToOne: false
            referencedRelation: "carts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cart_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      carts: {
        Row: {
          created_at: string
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      addresses: {
        Row: {
          id: string
          user_id: string
          full_name: string
          phone: string
          address_line: string
          mandal: string
          district: string
          pincode: string
          lat: number
          lng: number
          label: string
          is_default: boolean
          area_name: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          full_name: string
          phone: string
          address_line: string
          mandal: string
          district: string
          pincode: string
          lat: number
          lng: number
          label?: string
          is_default?: boolean
          area_name?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          full_name?: string
          phone?: string
          address_line?: string
          mandal?: string
          district?: string
          pincode?: string
          lat?: number
          lng?: number
          label?: string
          is_default?: boolean
          area_name?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "addresses_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          }
        ]
      }
      order_items: {
        Row: {
          created_at: string
          id: string
          order_id: string
          price_at_order: number
          product_id: string
          product_name: string
          quantity: number
          selected_weight: number | null
          unit_type: string | null
          variant_label: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          order_id: string
          price_at_order: number
          product_id: string
          product_name: string
          quantity: number
          selected_weight?: number | null
          unit_type?: string | null
          variant_label?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          order_id?: string
          price_at_order?: number
          product_id?: string
          product_name?: string
          quantity?: number
          selected_weight?: number | null
          unit_type?: string | null
          variant_label?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          created_at: string
          delivery_type: string
          id: string
          payment_intent_id: string | null
          payment_method: string
          phone: string
          shipping_address: string
          status: Database["public"]["Enums"]["order_status"]
          stripe_session_id: string | null
          total_amount: number
          updated_at: string
          user_id: string | null
          shipping_lat: number | null
          shipping_lng: number | null
          shipping_fee: number | null
          order_delivery_days: number | null
          expected_delivery_date: string | null
          whatsapp_opt_in: boolean | null
          reminder_sent: boolean | null
          retry_count: number | null
          user_name: string | null
          razorpay_order_id: string | null
        }
        Insert: {
          created_at?: string
          delivery_type?: string
          id?: string
          payment_intent_id?: string | null
          payment_method?: string
          phone: string
          shipping_address: string
          status?: Database["public"]["Enums"]["order_status"]
          stripe_session_id?: string | null
          total_amount: number
          updated_at?: string
          user_id?: string | null
          shipping_lat?: number | null
          shipping_lng?: number | null
          shipping_fee?: number | null
          order_delivery_days?: number | null
          expected_delivery_date?: string | null
          whatsapp_opt_in?: boolean | null
          reminder_sent?: boolean | null
          retry_count?: number | null
          user_name?: string | null
          razorpay_order_id?: string | null
        }
        Update: {
          created_at?: string
          delivery_type?: string
          id?: string
          payment_intent_id?: string | null
          payment_method?: string
          phone?: string
          shipping_address?: string
          status?: Database["public"]["Enums"]["order_status"]
          stripe_session_id?: string | null
          total_amount?: number
          updated_at?: string
          user_id?: string | null
          shipping_lat?: number | null
          shipping_lng?: number | null
          shipping_fee?: number | null
          order_delivery_days?: number | null
          expected_delivery_date?: string | null
          whatsapp_opt_in?: boolean | null
          reminder_sent?: boolean | null
          retry_count?: number | null
          user_name?: string | null
          razorpay_order_id?: string | null
        }
        Relationships: []
      }
      products: {
        Row: {
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          is_active: boolean
          name: string
          price: number
          stock: number
          unit: string
          updated_at: string
          original_price: number | null
          base_price_per_kg: number | null
          available_weights: number[] | null
          unit_type: string | null
          rating: number | null
          review_count: number | null
          tags: string[] | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          name: string
          price: number
          stock?: number
          unit?: string
          updated_at?: string
          original_price?: number | null
          base_price_per_kg?: number | null
          available_weights?: number[] | null
          unit_type?: string | null
          rating?: number | null
          review_count?: number | null
          tags?: string[] | null
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          name?: string
          price?: number
          stock?: number
          unit?: string
          updated_at?: string
          original_price?: number | null
          base_price_per_kg?: number | null
          available_weights?: number[] | null
          unit_type?: string | null
          rating?: number | null
          review_count?: number | null
          tags?: string[] | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          address: string
          created_at: string
          full_name: string
          id: string
          phone: string
          updated_at: string
          user_id: string
        }
        Insert: {
          address: string
          created_at?: string
          full_name: string
          id?: string
          phone: string
          updated_at?: string
          user_id: string
        }
        Update: {
          address?: string
          created_at?: string
          full_name?: string
          id?: string
          phone?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      promo_codes: {
        Row: {
          id: string
          code: string
          description: string | null
          discount_type: "percentage" | "fixed"
          discount_value: number
          is_active: boolean
          created_at: string
        }
        Insert: {
          id?: string
          code: string
          description?: string | null
          discount_type: "percentage" | "fixed"
          discount_value: number
          is_active?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          code?: string
          description?: string | null
          discount_type?: "percentage" | "fixed"
          discount_value?: number
          is_active?: boolean
          created_at?: string
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          id: string
          user_id: string
          address: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          address: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          address?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          }
        ]
      }
      subscription_items: {
        Row: {
          id: string
          subscription_id: string
          product_id: string
          quantity: number
          plan_type: "daily" | "alternate" | "weekly" | "monthly"
          delivery_time: "morning" | "evening"
          start_date: string
          end_date: string | null
          next_delivery_date: string
          status: "active" | "paused" | "cancelled"
          pause_from: string | null
          pause_to: string | null
          price_per_unit: number
          payment_status: "paid" | "pending"
          created_at: string
        }
        Insert: {
          id?: string
          subscription_id: string
          product_id: string
          quantity: number
          plan_type: "daily" | "alternate" | "weekly" | "monthly"
          delivery_time: "morning" | "evening"
          start_date: string
          end_date?: string | null
          next_delivery_date: string
          status?: "active" | "paused" | "cancelled"
          pause_from?: string | null
          pause_to?: string | null
          price_per_unit: number
          payment_status?: "paid" | "pending"
          created_at?: string
        }
        Update: {
          id?: string
          subscription_id?: string
          product_id?: string
          quantity?: number
          plan_type?: "daily" | "alternate" | "weekly" | "monthly"
          delivery_time?: "morning" | "evening"
          start_date?: string
          end_date?: string | null
          next_delivery_date?: string
          status?: "active" | "paused" | "cancelled"
          pause_from?: string | null
          pause_to?: string | null
          price_per_unit?: number
          payment_status?: "paid" | "pending"
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscription_items_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "subscriptions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscription_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          }
        ]
      }
      deliveries: {
        Row: {
          id: string
          subscription_item_id: string
          delivery_date: string
          status: "pending" | "delivered" | "skipped"
          notes: string | null
          is_subscription: boolean | null
          delivery_boy_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          subscription_item_id: string
          delivery_date: string
          status?: "pending" | "delivered" | "skipped"
          notes?: string | null
          is_subscription?: boolean | null
          delivery_boy_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          subscription_item_id?: string
          delivery_date?: string
          status?: "pending" | "delivered" | "skipped"
          notes?: string | null
          is_subscription?: boolean | null
          delivery_boy_id?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "deliveries_subscription_item_id_fkey"
            columns: ["subscription_item_id"]
            isOneToOne: false
            referencedRelation: "subscription_items"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "staff" | "customer"
      order_status:
      | "pending"
      | "paid"
      | "processing"
      | "shipped"
      | "delivered"
      | "cancelled"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
  | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
  | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
  ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
    DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
  : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
    DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
  ? R
  : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
    DefaultSchema["Views"])
  ? (DefaultSchema["Tables"] &
    DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
      Row: infer R
    }
  ? R
  : never
  : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
  | keyof DefaultSchema["Tables"]
  | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
  ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
  : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
    Insert: infer I
  }
  ? I
  : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
  ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
    Insert: infer I
  }
  ? I
  : never
  : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
  | keyof DefaultSchema["Tables"]
  | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
  ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
  : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
    Update: infer U
  }
  ? U
  : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
  ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
    Update: infer U
  }
  ? U
  : never
  : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
  | keyof DefaultSchema["Enums"]
  | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
  ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
  : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
  ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
  : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
  | keyof DefaultSchema["CompositeTypes"]
  | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
  ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
  : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
  ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
  : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "customer"],
      order_status: [
        "pending",
        "paid",
        "processing",
        "shipped",
        "delivered",
        "cancelled",
      ],
    },
  },
} as const
