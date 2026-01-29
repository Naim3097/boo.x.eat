// =============================================
// DATABASE HELPER FUNCTIONS
// Type-safe wrappers for Supabase operations
// =============================================

import { supabase } from './supabase';

// Generic types for flexibility
type AnyRecord = Record<string, unknown>;

// =============================================
// VENDORS
// =============================================
export const vendorsDb = {
  async getByUserId(userId: string) {
    const { data, error } = await supabase
      .from('vendors')
      .select('*')
      .eq('user_id', userId)
      .single();
    return { data, error };
  },

  async getBySlug(slug: string) {
    const { data, error } = await supabase
      .from('vendors')
      .select('*')
      .eq('slug', slug)
      .single();
    return { data, error };
  },

  async create(vendor: AnyRecord) {
    const { data, error } = await supabase
      .from('vendors')
      .insert(vendor as never)
      .select()
      .single();
    return { data, error };
  },

  async update(id: string, updates: AnyRecord) {
    const { data, error } = await supabase
      .from('vendors')
      .update(updates as never)
      .eq('id', id)
      .select()
      .single();
    return { data, error };
  },
};

// =============================================
// MENU CATEGORIES
// =============================================
export const menuCategoriesDb = {
  async getByVendor(vendorId: string) {
    const { data, error } = await supabase
      .from('menu_categories')
      .select('*')
      .eq('vendor_id', vendorId)
      .order('display_order', { ascending: true });
    return { data, error };
  },

  async create(category: AnyRecord) {
    const { data, error } = await supabase
      .from('menu_categories')
      .insert(category as never)
      .select()
      .single();
    return { data, error };
  },

  async update(id: string, updates: AnyRecord) {
    const { data, error } = await supabase
      .from('menu_categories')
      .update(updates as never)
      .eq('id', id)
      .select()
      .single();
    return { data, error };
  },

  async delete(id: string) {
    const { error } = await supabase
      .from('menu_categories')
      .delete()
      .eq('id', id);
    return { error };
  },
};

// =============================================
// MENU ITEMS
// =============================================
export const menuItemsDb = {
  async getByVendor(vendorId: string) {
    const { data, error } = await supabase
      .from('menu_items')
      .select('*')
      .eq('vendor_id', vendorId)
      .order('display_order', { ascending: true });
    return { data, error };
  },

  async getAvailableByVendor(vendorId: string) {
    const { data, error } = await supabase
      .from('menu_items')
      .select('*')
      .eq('vendor_id', vendorId)
      .eq('is_available', true)
      .order('display_order', { ascending: true });
    return { data, error };
  },

  async create(item: AnyRecord) {
    const { data, error } = await supabase
      .from('menu_items')
      .insert(item as never)
      .select()
      .single();
    return { data, error };
  },

  async update(id: string, updates: AnyRecord) {
    const { data, error } = await supabase
      .from('menu_items')
      .update(updates as never)
      .eq('id', id)
      .select()
      .single();
    return { data, error };
  },

  async delete(id: string) {
    const { error } = await supabase
      .from('menu_items')
      .delete()
      .eq('id', id);
    return { error };
  },
};

// =============================================
// PACKAGES
// =============================================
export const packagesDb = {
  async getByVendor(vendorId: string) {
    const { data, error } = await supabase
      .from('packages')
      .select('*')
      .eq('vendor_id', vendorId)
      .order('display_order', { ascending: true });
    return { data, error };
  },

  async getActiveByVendor(vendorId: string) {
    const { data, error } = await supabase
      .from('packages')
      .select('*')
      .eq('vendor_id', vendorId)
      .eq('is_active', true)
      .order('price', { ascending: true });
    return { data, error };
  },

  async create(pkg: AnyRecord) {
    const { data, error } = await supabase
      .from('packages')
      .insert(pkg as never)
      .select()
      .single();
    return { data, error };
  },

  async update(id: string, updates: AnyRecord) {
    const { data, error } = await supabase
      .from('packages')
      .update(updates as never)
      .eq('id', id)
      .select()
      .single();
    return { data, error };
  },

  async delete(id: string) {
    const { error } = await supabase
      .from('packages')
      .delete()
      .eq('id', id);
    return { error };
  },
};

// =============================================
// TIME SLOTS
// =============================================
export const timeSlotsDb = {
  async getByVendor(vendorId: string) {
    const { data, error } = await supabase
      .from('time_slots')
      .select('*')
      .eq('vendor_id', vendorId)
      .order('day_of_week', { ascending: true })
      .order('start_time', { ascending: true });
    return { data, error };
  },

  async getActiveByVendor(vendorId: string) {
    const { data, error } = await supabase
      .from('time_slots')
      .select('*')
      .eq('vendor_id', vendorId)
      .eq('is_active', true)
      .order('start_time', { ascending: true });
    return { data, error };
  },

  async create(slot: AnyRecord) {
    const { data, error } = await supabase
      .from('time_slots')
      .insert(slot as never)
      .select()
      .single();
    return { data, error };
  },

  async update(id: string, updates: AnyRecord) {
    const { data, error } = await supabase
      .from('time_slots')
      .update(updates as never)
      .eq('id', id)
      .select()
      .single();
    return { data, error };
  },

  async delete(id: string) {
    const { error } = await supabase
      .from('time_slots')
      .delete()
      .eq('id', id);
    return { error };
  },

  async deleteByVendorAndDay(vendorId: string, dayOfWeek: number) {
    const { error } = await supabase
      .from('time_slots')
      .delete()
      .eq('vendor_id', vendorId)
      .eq('day_of_week', dayOfWeek);
    return { error };
  },
};

// =============================================
// BLOCKED DATES
// =============================================
export const blockedDatesDb = {
  async getByVendor(vendorId: string) {
    const { data, error } = await supabase
      .from('blocked_dates')
      .select('*')
      .eq('vendor_id', vendorId)
      .order('date', { ascending: true });
    return { data, error };
  },

  async create(blockedDate: AnyRecord) {
    const { data, error } = await supabase
      .from('blocked_dates')
      .insert(blockedDate as never)
      .select()
      .single();
    return { data, error };
  },

  async delete(id: string) {
    const { error } = await supabase
      .from('blocked_dates')
      .delete()
      .eq('id', id);
    return { error };
  },
};

// =============================================
// BOOKINGS
// =============================================
export const bookingsDb = {
  async getByVendor(vendorId: string) {
    const { data, error } = await supabase
      .from('bookings')
      .select('*')
      .eq('vendor_id', vendorId)
      .order('booking_date', { ascending: true })
      .order('booking_time', { ascending: true });
    return { data, error };
  },

  async getByRef(bookingRef: string) {
    const { data, error } = await supabase
      .from('bookings')
      .select('*')
      .eq('booking_ref', bookingRef)
      .single();
    return { data, error };
  },

  async create(booking: AnyRecord) {
    const { data, error } = await supabase
      .from('bookings')
      .insert(booking as never)
      .select()
      .single();
    return { data, error };
  },

  async updateStatus(id: string, status: string) {
    const { data, error } = await supabase
      .from('bookings')
      .update({ status } as never)
      .eq('id', id)
      .select()
      .single();
    return { data, error };
  },

  async update(id: string, updates: AnyRecord) {
    const { data, error } = await supabase
      .from('bookings')
      .update(updates as never)
      .eq('id', id)
      .select()
      .single();
    return { data, error };
  },
};

// =============================================
// ANALYTICS
// =============================================
export const analyticsDb = {
  async trackEvent(vendorId: string, eventType: string, eventData?: AnyRecord) {
    const { error } = await supabase
      .from('analytics_events')
      .insert({
        vendor_id: vendorId,
        event_type: eventType,
        event_data: eventData || null,
      } as never);
    return { error };
  },

  async getByVendor(vendorId: string, startDate?: string) {
    let query = supabase
      .from('analytics_events')
      .select('*')
      .eq('vendor_id', vendorId)
      .order('created_at', { ascending: false });

    if (startDate) {
      query = query.gte('created_at', startDate);
    }

    const { data, error } = await query;
    return { data, error };
  },
};
