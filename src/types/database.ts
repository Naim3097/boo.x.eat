// =============================================
// SUPABASE DATABASE TYPES
// Auto-generated types for TypeScript
// =============================================

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      vendors: {
        Row: {
          id: string
          user_id: string
          name: string
          slug: string
          description: string | null
          cuisine_type: string | null
          email: string | null
          phone: string | null
          whatsapp: string | null
          address: string | null
          city: string | null
          state: string | null
          postal_code: string | null
          country: string
          latitude: number | null
          longitude: number | null
          logo_url: string | null
          cover_image_url: string | null
          gallery_urls: string[] | null
          business_hours: Json
          max_party_size: number
          min_party_size: number
          booking_lead_time_hours: number
          booking_window_days: number
          slot_duration_minutes: number
          tables_count: number
          deposit_required: boolean
          deposit_amount: number | null
          deposit_percentage: number | null
          payment_methods: Json
          stripe_account_id: string | null
          is_active: boolean
          is_verified: boolean
          subscription_tier: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          slug: string
          description?: string | null
          cuisine_type?: string | null
          email?: string | null
          phone?: string | null
          whatsapp?: string | null
          address?: string | null
          city?: string | null
          state?: string | null
          postal_code?: string | null
          country?: string
          latitude?: number | null
          longitude?: number | null
          logo_url?: string | null
          cover_image_url?: string | null
          gallery_urls?: string[] | null
          business_hours?: Json
          max_party_size?: number
          min_party_size?: number
          booking_lead_time_hours?: number
          booking_window_days?: number
          slot_duration_minutes?: number
          tables_count?: number
          deposit_required?: boolean
          deposit_amount?: number | null
          deposit_percentage?: number | null
          payment_methods?: Json
          stripe_account_id?: string | null
          is_active?: boolean
          is_verified?: boolean
          subscription_tier?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          slug?: string
          description?: string | null
          cuisine_type?: string | null
          email?: string | null
          phone?: string | null
          whatsapp?: string | null
          address?: string | null
          city?: string | null
          state?: string | null
          postal_code?: string | null
          country?: string
          latitude?: number | null
          longitude?: number | null
          logo_url?: string | null
          cover_image_url?: string | null
          gallery_urls?: string[] | null
          business_hours?: Json
          max_party_size?: number
          min_party_size?: number
          booking_lead_time_hours?: number
          booking_window_days?: number
          slot_duration_minutes?: number
          tables_count?: number
          deposit_required?: boolean
          deposit_amount?: number | null
          deposit_percentage?: number | null
          payment_methods?: Json
          stripe_account_id?: string | null
          is_active?: boolean
          is_verified?: boolean
          subscription_tier?: string
          created_at?: string
          updated_at?: string
        }
      }
      menu_categories: {
        Row: {
          id: string
          vendor_id: string
          name: string
          description: string | null
          display_order: number
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          vendor_id: string
          name: string
          description?: string | null
          display_order?: number
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          vendor_id?: string
          name?: string
          description?: string | null
          display_order?: number
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      menu_items: {
        Row: {
          id: string
          vendor_id: string
          category_id: string | null
          name: string
          description: string | null
          price: number
          compare_price: number | null
          image_url: string | null
          is_available: boolean
          is_featured: boolean
          is_vegetarian: boolean
          is_spicy: boolean
          spicy_level: number
          dietary_tags: string[] | null
          variants: Json | null
          display_order: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          vendor_id: string
          category_id?: string | null
          name: string
          description?: string | null
          price: number
          compare_price?: number | null
          image_url?: string | null
          is_available?: boolean
          is_featured?: boolean
          is_vegetarian?: boolean
          is_spicy?: boolean
          spicy_level?: number
          dietary_tags?: string[] | null
          variants?: Json | null
          display_order?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          vendor_id?: string
          category_id?: string | null
          name?: string
          description?: string | null
          price?: number
          compare_price?: number | null
          image_url?: string | null
          is_available?: boolean
          is_featured?: boolean
          is_vegetarian?: boolean
          is_spicy?: boolean
          spicy_level?: number
          dietary_tags?: string[] | null
          variants?: Json | null
          display_order?: number
          created_at?: string
          updated_at?: string
        }
      }
      packages: {
        Row: {
          id: string
          vendor_id: string
          name: string
          description: string | null
          price: number
          compare_price: number | null
          price_per_pax: boolean
          min_pax: number
          max_pax: number
          includes: string[] | null
          included_items: string[] | null
          menu_items: string[] | null
          image_url: string | null
          gallery_urls: string[] | null
          is_available: boolean
          is_featured: boolean
          is_active: boolean
          valid_days: number[] | null
          available_days: string[] | null
          available_start_time: string | null
          available_end_time: string | null
          valid_from: string | null
          valid_until: string | null
          advance_booking_days: number
          display_order: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          vendor_id: string
          name: string
          description?: string | null
          price: number
          compare_price?: number | null
          price_per_pax?: boolean
          min_pax?: number
          max_pax?: number
          includes?: string[] | null
          included_items?: string[] | null
          menu_items?: string[] | null
          image_url?: string | null
          gallery_urls?: string[] | null
          is_available?: boolean
          is_featured?: boolean
          is_active?: boolean
          valid_days?: number[] | null
          available_days?: string[] | null
          available_start_time?: string | null
          available_end_time?: string | null
          valid_from?: string | null
          valid_until?: string | null
          advance_booking_days?: number
          display_order?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          vendor_id?: string
          name?: string
          description?: string | null
          price?: number
          compare_price?: number | null
          price_per_pax?: boolean
          min_pax?: number
          max_pax?: number
          includes?: string[] | null
          included_items?: string[] | null
          menu_items?: string[] | null
          image_url?: string | null
          gallery_urls?: string[] | null
          is_available?: boolean
          is_featured?: boolean
          is_active?: boolean
          valid_days?: number[] | null
          available_days?: string[] | null
          available_start_time?: string | null
          available_end_time?: string | null
          valid_from?: string | null
          valid_until?: string | null
          advance_booking_days?: number
          display_order?: number
          created_at?: string
          updated_at?: string
        }
      }
      time_slots: {
        Row: {
          id: string
          vendor_id: string
          day_of_week: number
          start_time: string
          end_time: string
          max_bookings: number
          is_active: boolean
          created_at: string
        }
        Insert: {
          id?: string
          vendor_id: string
          day_of_week: number
          start_time: string
          end_time: string
          max_bookings?: number
          is_active?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          vendor_id?: string
          day_of_week?: number
          start_time?: string
          end_time?: string
          max_bookings?: number
          is_active?: boolean
          created_at?: string
        }
      }
      blocked_dates: {
        Row: {
          id: string
          vendor_id: string
          date: string
          reason: string | null
          is_full_day: boolean
          blocked_start_time: string | null
          blocked_end_time: string | null
          created_at: string
        }
        Insert: {
          id?: string
          vendor_id: string
          date: string
          reason?: string | null
          is_full_day?: boolean
          blocked_start_time?: string | null
          blocked_end_time?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          vendor_id?: string
          date?: string
          reason?: string | null
          is_full_day?: boolean
          blocked_start_time?: string | null
          blocked_end_time?: string | null
          created_at?: string
        }
      }
      bookings: {
        Row: {
          id: string
          vendor_id: string
          booking_ref: string
          customer_name: string
          customer_email: string
          customer_phone: string
          booking_date: string
          booking_time: string
          party_size: number
          package_id: string | null
          special_requests: string | null
          occasion: string | null
          preorder_items: Json | null
          subtotal: number
          deposit_amount: number
          total_amount: number
          status: string
          payment_status: string
          payment_method: string | null
          payment_intent_id: string | null
          payment_date: string | null
          confirmed_at: string | null
          confirmed_by: string | null
          cancelled_at: string | null
          cancellation_reason: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          vendor_id: string
          booking_ref?: string
          customer_name: string
          customer_email: string
          customer_phone: string
          booking_date: string
          booking_time: string
          party_size: number
          package_id?: string | null
          special_requests?: string | null
          occasion?: string | null
          preorder_items?: Json | null
          subtotal?: number
          deposit_amount?: number
          total_amount?: number
          status?: string
          payment_status?: string
          payment_method?: string | null
          payment_intent_id?: string | null
          payment_date?: string | null
          confirmed_at?: string | null
          confirmed_by?: string | null
          cancelled_at?: string | null
          cancellation_reason?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          vendor_id?: string
          booking_ref?: string
          customer_name?: string
          customer_email?: string
          customer_phone?: string
          booking_date?: string
          booking_time?: string
          party_size?: number
          package_id?: string | null
          special_requests?: string | null
          occasion?: string | null
          preorder_items?: Json | null
          subtotal?: number
          deposit_amount?: number
          total_amount?: number
          status?: string
          payment_status?: string
          payment_method?: string | null
          payment_intent_id?: string | null
          payment_date?: string | null
          confirmed_at?: string | null
          confirmed_by?: string | null
          cancelled_at?: string | null
          cancellation_reason?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      analytics_events: {
        Row: {
          id: string
          vendor_id: string
          event_type: string
          event_data: Json | null
          session_id: string | null
          user_agent: string | null
          ip_address: string | null
          referrer: string | null
          created_at: string
        }
        Insert: {
          id?: string
          vendor_id: string
          event_type: string
          event_data?: Json | null
          session_id?: string | null
          user_agent?: string | null
          ip_address?: string | null
          referrer?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          vendor_id?: string
          event_type?: string
          event_data?: Json | null
          session_id?: string | null
          user_agent?: string | null
          ip_address?: string | null
          referrer?: string | null
          created_at?: string
        }
      }
    }
  }
}

// =============================================
// HELPER TYPES
// =============================================

export type Vendor = Database['public']['Tables']['vendors']['Row']
export type VendorInsert = Database['public']['Tables']['vendors']['Insert']
export type VendorUpdate = Database['public']['Tables']['vendors']['Update']

export type MenuCategory = Database['public']['Tables']['menu_categories']['Row']
export type MenuCategoryInsert = Database['public']['Tables']['menu_categories']['Insert']
export type MenuCategoryUpdate = Database['public']['Tables']['menu_categories']['Update']

export type MenuItem = Database['public']['Tables']['menu_items']['Row']
export type MenuItemInsert = Database['public']['Tables']['menu_items']['Insert']
export type MenuItemUpdate = Database['public']['Tables']['menu_items']['Update']

export type Package = Database['public']['Tables']['packages']['Row']
export type PackageInsert = Database['public']['Tables']['packages']['Insert']
export type PackageUpdate = Database['public']['Tables']['packages']['Update']

export type TimeSlot = Database['public']['Tables']['time_slots']['Row']
export type TimeSlotInsert = Database['public']['Tables']['time_slots']['Insert']
export type TimeSlotUpdate = Database['public']['Tables']['time_slots']['Update']

export type BlockedDate = Database['public']['Tables']['blocked_dates']['Row']
export type BlockedDateInsert = Database['public']['Tables']['blocked_dates']['Insert']
export type BlockedDateUpdate = Database['public']['Tables']['blocked_dates']['Update']

export type Booking = Database['public']['Tables']['bookings']['Row']
export type BookingInsert = Database['public']['Tables']['bookings']['Insert']
export type BookingUpdate = Database['public']['Tables']['bookings']['Update']

export type AnalyticsEvent = Database['public']['Tables']['analytics_events']['Row']
export type AnalyticsEventInsert = Database['public']['Tables']['analytics_events']['Insert']

// =============================================
// BUSINESS HOURS TYPE
// =============================================
export interface BusinessHours {
  monday: DayHours
  tuesday: DayHours
  wednesday: DayHours
  thursday: DayHours
  friday: DayHours
  saturday: DayHours
  sunday: DayHours
}

export interface DayHours {
  open: string
  close: string
  closed: boolean
}

// =============================================
// BOOKING STATUS ENUM
// =============================================
export type BookingStatus = 'pending' | 'confirmed' | 'cancelled' | 'completed' | 'no-show'
export type PaymentStatus = 'unpaid' | 'deposit_paid' | 'fully_paid' | 'refunded'

// =============================================
// MENU VARIANT TYPE
// =============================================
export interface MenuVariant {
  name: string
  options: MenuVariantOption[]
}

export interface MenuVariantOption {
  label: string
  price: number
}

// =============================================
// PREORDER ITEM TYPE
// =============================================
export interface PreorderItem {
  menu_item_id: string
  quantity: number
  variants?: Record<string, string>
  notes?: string
}
