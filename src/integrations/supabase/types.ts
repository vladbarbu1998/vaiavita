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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      categories: {
        Row: {
          created_at: string
          description_en: string | null
          description_ro: string | null
          id: string
          image_url: string | null
          name_en: string
          name_ro: string
          parent_id: string | null
          slug: string
          sort_order: number | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          description_en?: string | null
          description_ro?: string | null
          id?: string
          image_url?: string | null
          name_en: string
          name_ro: string
          parent_id?: string | null
          slug: string
          sort_order?: number | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          description_en?: string | null
          description_ro?: string | null
          id?: string
          image_url?: string | null
          name_en?: string
          name_ro?: string
          parent_id?: string | null
          slug?: string
          sort_order?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "categories_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      contact_submissions: {
        Row: {
          admin_notes: string | null
          created_at: string
          email: string
          id: string
          ip_address: string | null
          is_read: boolean | null
          language: string
          message: string
          name: string
          phone: string | null
          replied_at: string | null
          source: string | null
          subject: string | null
          user_agent: string | null
        }
        Insert: {
          admin_notes?: string | null
          created_at?: string
          email: string
          id?: string
          ip_address?: string | null
          is_read?: boolean | null
          language?: string
          message: string
          name: string
          phone?: string | null
          replied_at?: string | null
          source?: string | null
          subject?: string | null
          user_agent?: string | null
        }
        Update: {
          admin_notes?: string | null
          created_at?: string
          email?: string
          id?: string
          ip_address?: string | null
          is_read?: boolean | null
          language?: string
          message?: string
          name?: string
          phone?: string | null
          replied_at?: string | null
          source?: string | null
          subject?: string | null
          user_agent?: string | null
        }
        Relationships: []
      }
      coupons: {
        Row: {
          allowed_email: string | null
          category_id: string | null
          code: string
          coupon_number: number
          created_at: string
          description: string | null
          discount_type: string
          discount_value: number
          id: string
          is_active: boolean | null
          max_uses: number | null
          min_order_value: number | null
          product_id: string | null
          product_ids: string[] | null
          review_id: string | null
          scope: string
          uses_count: number | null
          valid_from: string | null
          valid_until: string | null
        }
        Insert: {
          allowed_email?: string | null
          category_id?: string | null
          code: string
          coupon_number?: number
          created_at?: string
          description?: string | null
          discount_type: string
          discount_value: number
          id?: string
          is_active?: boolean | null
          max_uses?: number | null
          min_order_value?: number | null
          product_id?: string | null
          product_ids?: string[] | null
          review_id?: string | null
          scope?: string
          uses_count?: number | null
          valid_from?: string | null
          valid_until?: string | null
        }
        Update: {
          allowed_email?: string | null
          category_id?: string | null
          code?: string
          coupon_number?: number
          created_at?: string
          description?: string | null
          discount_type?: string
          discount_value?: number
          id?: string
          is_active?: boolean | null
          max_uses?: number | null
          min_order_value?: number | null
          product_id?: string | null
          product_ids?: string[] | null
          review_id?: string | null
          scope?: string
          uses_count?: number | null
          valid_from?: string | null
          valid_until?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "coupons_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "coupons_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "coupons_review_id_fkey"
            columns: ["review_id"]
            isOneToOne: false
            referencedRelation: "public_reviews"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "coupons_review_id_fkey"
            columns: ["review_id"]
            isOneToOne: false
            referencedRelation: "reviews"
            referencedColumns: ["id"]
          },
        ]
      }
      email_templates: {
        Row: {
          body_en: string
          body_ro: string
          created_at: string
          id: string
          name: string
          subject_en: string
          subject_ro: string
          updated_at: string
        }
        Insert: {
          body_en: string
          body_ro: string
          created_at?: string
          id?: string
          name: string
          subject_en: string
          subject_ro: string
          updated_at?: string
        }
        Update: {
          body_en?: string
          body_ro?: string
          created_at?: string
          id?: string
          name?: string
          subject_en?: string
          subject_ro?: string
          updated_at?: string
        }
        Relationships: []
      }
      order_items: {
        Row: {
          created_at: string
          id: string
          order_id: string
          product_id: string | null
          product_name: string
          product_sku: string | null
          quantity: number
          total_price: number
          unit_price: number
        }
        Insert: {
          created_at?: string
          id?: string
          order_id: string
          product_id?: string | null
          product_name: string
          product_sku?: string | null
          quantity: number
          total_price: number
          unit_price: number
        }
        Update: {
          created_at?: string
          id?: string
          order_id?: string
          product_id?: string | null
          product_name?: string
          product_sku?: string | null
          quantity?: number
          total_price?: number
          unit_price?: number
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
          admin_notes: string | null
          awb_number: string | null
          cancel_reason: string | null
          cancel_source: string | null
          cancelled_email_sent_at: string | null
          confirmation_email_sent_at: string | null
          coupon_code: string | null
          courier_name: string | null
          created_at: string
          customer_email: string
          customer_first_name: string
          customer_last_name: string
          customer_notes: string | null
          customer_phone: string
          delivery_method: Database["public"]["Enums"]["delivery_method"]
          discount: number | null
          ecolet_order_id: string | null
          ecolet_sync_error: string | null
          ecolet_synced: boolean | null
          id: string
          ip_address: string | null
          locker_address: string | null
          locker_city: string | null
          locker_id: string | null
          locker_lat: number | null
          locker_lng: number | null
          locker_locality_id: number | null
          locker_name: string | null
          locker_postal_code: string | null
          oblio_invoice_date: string | null
          oblio_invoice_link: string | null
          oblio_invoice_number: string | null
          oblio_series_name: string | null
          order_number: string
          payment_failed_email_sent_at: string | null
          payment_id: string | null
          payment_method: Database["public"]["Enums"]["payment_method"]
          payment_reminder_sent_at: string | null
          payment_status: string | null
          pickup_location: string | null
          review_tokens: string[] | null
          shipped_email_sent_at: string | null
          shipping_address: Json | null
          shipping_cost: number | null
          status: Database["public"]["Enums"]["order_status"]
          subtotal: number
          total: number
          tracking_url: string | null
          updated_at: string
          user_agent: string | null
        }
        Insert: {
          admin_notes?: string | null
          awb_number?: string | null
          cancel_reason?: string | null
          cancel_source?: string | null
          cancelled_email_sent_at?: string | null
          confirmation_email_sent_at?: string | null
          coupon_code?: string | null
          courier_name?: string | null
          created_at?: string
          customer_email: string
          customer_first_name: string
          customer_last_name: string
          customer_notes?: string | null
          customer_phone: string
          delivery_method: Database["public"]["Enums"]["delivery_method"]
          discount?: number | null
          ecolet_order_id?: string | null
          ecolet_sync_error?: string | null
          ecolet_synced?: boolean | null
          id?: string
          ip_address?: string | null
          locker_address?: string | null
          locker_city?: string | null
          locker_id?: string | null
          locker_lat?: number | null
          locker_lng?: number | null
          locker_locality_id?: number | null
          locker_name?: string | null
          locker_postal_code?: string | null
          oblio_invoice_date?: string | null
          oblio_invoice_link?: string | null
          oblio_invoice_number?: string | null
          oblio_series_name?: string | null
          order_number: string
          payment_failed_email_sent_at?: string | null
          payment_id?: string | null
          payment_method: Database["public"]["Enums"]["payment_method"]
          payment_reminder_sent_at?: string | null
          payment_status?: string | null
          pickup_location?: string | null
          review_tokens?: string[] | null
          shipped_email_sent_at?: string | null
          shipping_address?: Json | null
          shipping_cost?: number | null
          status?: Database["public"]["Enums"]["order_status"]
          subtotal: number
          total: number
          tracking_url?: string | null
          updated_at?: string
          user_agent?: string | null
        }
        Update: {
          admin_notes?: string | null
          awb_number?: string | null
          cancel_reason?: string | null
          cancel_source?: string | null
          cancelled_email_sent_at?: string | null
          confirmation_email_sent_at?: string | null
          coupon_code?: string | null
          courier_name?: string | null
          created_at?: string
          customer_email?: string
          customer_first_name?: string
          customer_last_name?: string
          customer_notes?: string | null
          customer_phone?: string
          delivery_method?: Database["public"]["Enums"]["delivery_method"]
          discount?: number | null
          ecolet_order_id?: string | null
          ecolet_sync_error?: string | null
          ecolet_synced?: boolean | null
          id?: string
          ip_address?: string | null
          locker_address?: string | null
          locker_city?: string | null
          locker_id?: string | null
          locker_lat?: number | null
          locker_lng?: number | null
          locker_locality_id?: number | null
          locker_name?: string | null
          locker_postal_code?: string | null
          oblio_invoice_date?: string | null
          oblio_invoice_link?: string | null
          oblio_invoice_number?: string | null
          oblio_series_name?: string | null
          order_number?: string
          payment_failed_email_sent_at?: string | null
          payment_id?: string | null
          payment_method?: Database["public"]["Enums"]["payment_method"]
          payment_reminder_sent_at?: string | null
          payment_status?: string | null
          pickup_location?: string | null
          review_tokens?: string[] | null
          shipped_email_sent_at?: string | null
          shipping_address?: Json | null
          shipping_cost?: number | null
          status?: Database["public"]["Enums"]["order_status"]
          subtotal?: number
          total?: number
          tracking_url?: string | null
          updated_at?: string
          user_agent?: string | null
        }
        Relationships: []
      }
      product_categories: {
        Row: {
          category_id: string
          created_at: string
          id: string
          product_id: string
        }
        Insert: {
          category_id: string
          created_at?: string
          id?: string
          product_id: string
        }
        Update: {
          category_id?: string
          created_at?: string
          id?: string
          product_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_categories_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_categories_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          card_description_en: string | null
          card_description_ro: string | null
          category_id: string | null
          compare_at_price: number | null
          created_at: string
          description_en: string | null
          description_ro: string | null
          featured: boolean | null
          id: string
          images: string[] | null
          meta_description_en: string | null
          meta_description_ro: string | null
          meta_title_en: string | null
          meta_title_ro: string | null
          name_en: string
          name_ro: string
          price: number
          product_number: number
          related_products: string[] | null
          short_description_en: string | null
          short_description_ro: string | null
          sku: string | null
          slug: string
          specifications: Json | null
          status: string
          stock: number
          tags: string[] | null
          updated_at: string
        }
        Insert: {
          card_description_en?: string | null
          card_description_ro?: string | null
          category_id?: string | null
          compare_at_price?: number | null
          created_at?: string
          description_en?: string | null
          description_ro?: string | null
          featured?: boolean | null
          id?: string
          images?: string[] | null
          meta_description_en?: string | null
          meta_description_ro?: string | null
          meta_title_en?: string | null
          meta_title_ro?: string | null
          name_en: string
          name_ro: string
          price: number
          product_number?: number
          related_products?: string[] | null
          short_description_en?: string | null
          short_description_ro?: string | null
          sku?: string | null
          slug: string
          specifications?: Json | null
          status?: string
          stock?: number
          tags?: string[] | null
          updated_at?: string
        }
        Update: {
          card_description_en?: string | null
          card_description_ro?: string | null
          category_id?: string | null
          compare_at_price?: number | null
          created_at?: string
          description_en?: string | null
          description_ro?: string | null
          featured?: boolean | null
          id?: string
          images?: string[] | null
          meta_description_en?: string | null
          meta_description_ro?: string | null
          meta_title_en?: string | null
          meta_title_ro?: string | null
          name_en?: string
          name_ro?: string
          price?: number
          product_number?: number
          related_products?: string[] | null
          short_description_en?: string | null
          short_description_ro?: string | null
          sku?: string | null
          slug?: string
          specifications?: Json | null
          status?: string
          stock?: number
          tags?: string[] | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      reviews: {
        Row: {
          content: string | null
          content_en: string | null
          content_ro: string | null
          created_at: string
          customer_email: string
          customer_name: string
          id: string
          images: string[] | null
          ip_address: string | null
          is_approved: boolean | null
          is_verified_purchase: boolean | null
          order_id: string | null
          product_id: string
          rating: number
          review_token: string | null
          title: string | null
          title_en: string | null
          title_ro: string | null
          user_agent: string | null
        }
        Insert: {
          content?: string | null
          content_en?: string | null
          content_ro?: string | null
          created_at?: string
          customer_email: string
          customer_name: string
          id?: string
          images?: string[] | null
          ip_address?: string | null
          is_approved?: boolean | null
          is_verified_purchase?: boolean | null
          order_id?: string | null
          product_id: string
          rating: number
          review_token?: string | null
          title?: string | null
          title_en?: string | null
          title_ro?: string | null
          user_agent?: string | null
        }
        Update: {
          content?: string | null
          content_en?: string | null
          content_ro?: string | null
          created_at?: string
          customer_email?: string
          customer_name?: string
          id?: string
          images?: string[] | null
          ip_address?: string | null
          is_approved?: boolean | null
          is_verified_purchase?: boolean | null
          order_id?: string | null
          product_id?: string
          rating?: number
          review_token?: string | null
          title?: string | null
          title_en?: string | null
          title_ro?: string | null
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reviews_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      settings: {
        Row: {
          id: string
          key: string
          updated_at: string
          value: Json
        }
        Insert: {
          id?: string
          key: string
          updated_at?: string
          value: Json
        }
        Update: {
          id?: string
          key?: string
          updated_at?: string
          value?: Json
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
          role: Database["public"]["Enums"]["app_role"]
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
    }
    Views: {
      public_reviews: {
        Row: {
          content: string | null
          content_en: string | null
          content_ro: string | null
          created_at: string | null
          customer_name: string | null
          id: string | null
          images: string[] | null
          is_approved: boolean | null
          is_verified_purchase: boolean | null
          order_id: string | null
          product_id: string | null
          rating: number | null
          review_token: string | null
          title: string | null
          title_en: string | null
          title_ro: string | null
        }
        Insert: {
          content?: string | null
          content_en?: string | null
          content_ro?: string | null
          created_at?: string | null
          customer_name?: string | null
          id?: string | null
          images?: string[] | null
          is_approved?: boolean | null
          is_verified_purchase?: boolean | null
          order_id?: string | null
          product_id?: string | null
          rating?: number | null
          review_token?: string | null
          title?: string | null
          title_en?: string | null
          title_ro?: string | null
        }
        Update: {
          content?: string | null
          content_en?: string | null
          content_ro?: string | null
          created_at?: string | null
          customer_name?: string | null
          id?: string | null
          images?: string[] | null
          is_approved?: boolean | null
          is_verified_purchase?: boolean | null
          order_id?: string | null
          product_id?: string | null
          rating?: number | null
          review_token?: string | null
          title?: string | null
          title_en?: string | null
          title_ro?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reviews_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin: { Args: { _user_id: string }; Returns: boolean }
    }
    Enums: {
      app_role: "admin" | "manager" | "support"
      delivery_method: "shipping" | "pickup" | "locker" | "postal"
      order_status:
        | "pending"
        | "processing"
        | "shipped"
        | "delivered"
        | "cancelled"
        | "pregatita_ridicare"
        | "card_paid"
      payment_method: "stripe" | "netopia" | "cash_on_delivery"
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
      app_role: ["admin", "manager", "support"],
      delivery_method: ["shipping", "pickup", "locker", "postal"],
      order_status: [
        "pending",
        "processing",
        "shipped",
        "delivered",
        "cancelled",
        "pregatita_ridicare",
        "card_paid",
      ],
      payment_method: ["stripe", "netopia", "cash_on_delivery"],
    },
  },
} as const
