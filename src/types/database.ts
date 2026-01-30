export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      categories: {
        Row: {
          created_at: string | null
          id: string
          is_active: boolean | null
          name_en: string
          name_ms: string | null
          outlet_id: string | null
          sort_order: number | null
          store_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name_en: string
          name_ms?: string | null
          outlet_id?: string | null
          sort_order?: number | null
          store_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name_en?: string
          name_ms?: string | null
          outlet_id?: string | null
          sort_order?: number | null
          store_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "categories_outlet_id_fkey"
            columns: ["outlet_id"]
            isOneToOne: false
            referencedRelation: "outlets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "categories_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      menu_items: {
        Row: {
          base_price: number
          category_id: string | null
          created_at: string | null
          description_en: string | null
          description_ms: string | null
          id: string
          image_url: string | null
          is_available: boolean | null
          name_en: string
          name_ms: string | null
          outlet_id: string | null
          sort_order: number | null
          store_id: string
          updated_at: string | null
        }
        Insert: {
          base_price: number
          category_id?: string | null
          created_at?: string | null
          description_en?: string | null
          description_ms?: string | null
          id?: string
          image_url?: string | null
          is_available?: boolean | null
          name_en: string
          name_ms?: string | null
          outlet_id?: string | null
          sort_order?: number | null
          store_id: string
          updated_at?: string | null
        }
        Update: {
          base_price?: number
          category_id?: string | null
          created_at?: string | null
          description_en?: string | null
          description_ms?: string | null
          id?: string
          image_url?: string | null
          is_available?: boolean | null
          name_en?: string
          name_ms?: string | null
          outlet_id?: string | null
          sort_order?: number | null
          store_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "menu_items_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "menu_items_outlet_id_fkey"
            columns: ["outlet_id"]
            isOneToOne: false
            referencedRelation: "outlets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "menu_items_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      order_items: {
        Row: {
          created_at: string | null
          id: string
          item_name: string
          menu_item_id: string | null
          order_id: string
          quantity: number
          special_instructions: string | null
          subtotal: number
          unit_price: number
          variants_json: Json | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          item_name: string
          menu_item_id?: string | null
          order_id: string
          quantity?: number
          special_instructions?: string | null
          subtotal: number
          unit_price: number
          variants_json?: Json | null
        }
        Update: {
          created_at?: string | null
          id?: string
          item_name?: string
          menu_item_id?: string | null
          order_id?: string
          quantity?: number
          special_instructions?: string | null
          subtotal?: number
          unit_price?: number
          variants_json?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "order_items_menu_item_id_fkey"
            columns: ["menu_item_id"]
            isOneToOne: false
            referencedRelation: "menu_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          created_at: string | null
          customer_phone: string | null
          id: string
          notes: string | null
          order_number: string
          order_type: string
          outlet_id: string
          payment_method: string | null
          payment_reference: string | null
          payment_status: string | null
          status: string | null
          subtotal: number
          table_id: string | null
          tax: number | null
          total: number
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          customer_phone?: string | null
          id?: string
          notes?: string | null
          order_number: string
          order_type: string
          outlet_id: string
          payment_method?: string | null
          payment_reference?: string | null
          payment_status?: string | null
          status?: string | null
          subtotal: number
          table_id?: string | null
          tax?: number | null
          total: number
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          customer_phone?: string | null
          id?: string
          notes?: string | null
          order_number?: string
          order_type?: string
          outlet_id?: string
          payment_method?: string | null
          payment_reference?: string | null
          payment_status?: string | null
          status?: string | null
          subtotal?: number
          table_id?: string | null
          tax?: number | null
          total?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "orders_outlet_id_fkey"
            columns: ["outlet_id"]
            isOneToOne: false
            referencedRelation: "outlets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_table_id_fkey"
            columns: ["table_id"]
            isOneToOne: false
            referencedRelation: "tables"
            referencedColumns: ["id"]
          },
        ]
      }
      outlets: {
        Row: {
          address: string | null
          created_at: string | null
          id: string
          is_active: boolean | null
          name: string
          operating_hours: Json | null
          phone: string | null
          store_id: string
          updated_at: string | null
        }
        Insert: {
          address?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          operating_hours?: Json | null
          phone?: string | null
          store_id: string
          updated_at?: string | null
        }
        Update: {
          address?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          operating_hours?: Json | null
          phone?: string | null
          store_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "outlets_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      stores: {
        Row: {
          business_model: string
          created_at: string | null
          default_language: string | null
          id: string
          logo_url: string | null
          name: string
          owner_id: string | null
          subscription_status: string | null
          subscription_tier: string | null
          updated_at: string | null
        }
        Insert: {
          business_model: string
          created_at?: string | null
          default_language?: string | null
          id?: string
          logo_url?: string | null
          name: string
          owner_id?: string | null
          subscription_status?: string | null
          subscription_tier?: string | null
          updated_at?: string | null
        }
        Update: {
          business_model?: string
          created_at?: string | null
          default_language?: string | null
          id?: string
          logo_url?: string | null
          name?: string
          owner_id?: string | null
          subscription_status?: string | null
          subscription_tier?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      tables: {
        Row: {
          capacity: number | null
          created_at: string | null
          id: string
          outlet_id: string
          qr_code_url: string | null
          status: string | null
          table_number: string
          updated_at: string | null
        }
        Insert: {
          capacity?: number | null
          created_at?: string | null
          id?: string
          outlet_id: string
          qr_code_url?: string | null
          status?: string | null
          table_number: string
          updated_at?: string | null
        }
        Update: {
          capacity?: number | null
          created_at?: string | null
          id?: string
          outlet_id?: string
          qr_code_url?: string | null
          status?: string | null
          table_number?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tables_outlet_id_fkey"
            columns: ["outlet_id"]
            isOneToOne: false
            referencedRelation: "outlets"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          auth_id: string | null
          created_at: string | null
          email: string | null
          id: string
          is_active: boolean | null
          name: string
          outlet_id: string | null
          pin_code: string
          role: string
          store_id: string
          updated_at: string | null
        }
        Insert: {
          auth_id?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          outlet_id?: string | null
          pin_code: string
          role: string
          store_id: string
          updated_at?: string | null
        }
        Update: {
          auth_id?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          outlet_id?: string | null
          pin_code?: string
          role?: string
          store_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "users_outlet_id_fkey"
            columns: ["outlet_id"]
            isOneToOne: false
            referencedRelation: "outlets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "users_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      variants: {
        Row: {
          created_at: string | null
          group_name: string
          id: string
          is_available: boolean | null
          is_default: boolean | null
          menu_item_id: string
          name_en: string
          name_ms: string | null
          price_adjustment: number | null
          sort_order: number | null
        }
        Insert: {
          created_at?: string | null
          group_name: string
          id?: string
          is_available?: boolean | null
          is_default?: boolean | null
          menu_item_id: string
          name_en: string
          name_ms?: string | null
          price_adjustment?: number | null
          sort_order?: number | null
        }
        Update: {
          created_at?: string | null
          group_name?: string
          id?: string
          is_available?: boolean | null
          is_default?: boolean | null
          menu_item_id?: string
          name_en?: string
          name_ms?: string | null
          price_adjustment?: number | null
          sort_order?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "variants_menu_item_id_fkey"
            columns: ["menu_item_id"]
            isOneToOne: false
            referencedRelation: "menu_items"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}

// Convenience type aliases
export type Store = Database["public"]["Tables"]["stores"]["Row"];
export type StoreInsert = Database["public"]["Tables"]["stores"]["Insert"];
export type StoreUpdate = Database["public"]["Tables"]["stores"]["Update"];

export type Outlet = Database["public"]["Tables"]["outlets"]["Row"];
export type OutletInsert = Database["public"]["Tables"]["outlets"]["Insert"];
export type OutletUpdate = Database["public"]["Tables"]["outlets"]["Update"];

export type StaffUser = Database["public"]["Tables"]["users"]["Row"];
export type StaffUserInsert = Database["public"]["Tables"]["users"]["Insert"];
export type StaffUserUpdate = Database["public"]["Tables"]["users"]["Update"];

export type Category = Database["public"]["Tables"]["categories"]["Row"];
export type CategoryInsert = Database["public"]["Tables"]["categories"]["Insert"];
export type CategoryUpdate = Database["public"]["Tables"]["categories"]["Update"];

export type MenuItem = Database["public"]["Tables"]["menu_items"]["Row"];
export type MenuItemInsert = Database["public"]["Tables"]["menu_items"]["Insert"];
export type MenuItemUpdate = Database["public"]["Tables"]["menu_items"]["Update"];

export type Variant = Database["public"]["Tables"]["variants"]["Row"];
export type VariantInsert = Database["public"]["Tables"]["variants"]["Insert"];
export type VariantUpdate = Database["public"]["Tables"]["variants"]["Update"];

export type Table = Database["public"]["Tables"]["tables"]["Row"];
export type TableInsert = Database["public"]["Tables"]["tables"]["Insert"];
export type TableUpdate = Database["public"]["Tables"]["tables"]["Update"];

export type Order = Database["public"]["Tables"]["orders"]["Row"];
export type OrderInsert = Database["public"]["Tables"]["orders"]["Insert"];
export type OrderUpdate = Database["public"]["Tables"]["orders"]["Update"];

export type OrderItem = Database["public"]["Tables"]["order_items"]["Row"];
export type OrderItemInsert = Database["public"]["Tables"]["order_items"]["Insert"];
export type OrderItemUpdate = Database["public"]["Tables"]["order_items"]["Update"];
