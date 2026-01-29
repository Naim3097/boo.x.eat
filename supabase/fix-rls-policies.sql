-- =============================================
-- FIX RLS POLICIES FOR BOO.X.EAT
-- Run this in Supabase SQL Editor
-- =============================================

-- First, drop all existing policies to start fresh
DO $$ 
DECLARE
    r RECORD;
BEGIN
    -- Drop all policies on vendors
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'vendors') LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON vendors';
    END LOOP;
    
    -- Drop all policies on bookings
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'bookings') LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON bookings';
    END LOOP;
    
    -- Drop all policies on menu_items
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'menu_items') LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON menu_items';
    END LOOP;
    
    -- Drop all policies on menu_categories
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'menu_categories') LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON menu_categories';
    END LOOP;
    
    -- Drop all policies on packages
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'packages') LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON packages';
    END LOOP;
    
    -- Drop all policies on time_slots
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'time_slots') LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON time_slots';
    END LOOP;
    
    -- Drop all policies on blocked_dates
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'blocked_dates') LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON blocked_dates';
    END LOOP;
END $$;

-- =============================================
-- VENDORS TABLE POLICIES
-- =============================================

-- Allow public to view active vendors (for public booking page)
CREATE POLICY "vendors_public_read" ON vendors
  FOR SELECT 
  TO anon, authenticated
  USING (is_active = true);

-- Allow authenticated users to read their own vendor (even if inactive)
CREATE POLICY "vendors_owner_read" ON vendors
  FOR SELECT 
  TO authenticated
  USING (auth.uid() = user_id);

-- Allow authenticated users to insert their own vendor
CREATE POLICY "vendors_owner_insert" ON vendors
  FOR INSERT 
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Allow authenticated users to update their own vendor
CREATE POLICY "vendors_owner_update" ON vendors
  FOR UPDATE 
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Allow authenticated users to delete their own vendor
CREATE POLICY "vendors_owner_delete" ON vendors
  FOR DELETE 
  TO authenticated
  USING (auth.uid() = user_id);

-- =============================================
-- BOOKINGS TABLE POLICIES
-- =============================================

-- Allow anyone (including anonymous) to INSERT bookings
CREATE POLICY "bookings_public_insert" ON bookings
  FOR INSERT 
  TO anon, authenticated
  WITH CHECK (true);

-- Allow public to view bookings (for checking booking status)
CREATE POLICY "bookings_public_read" ON bookings
  FOR SELECT 
  TO anon, authenticated
  USING (true);

-- Allow vendor owners to update their bookings
CREATE POLICY "bookings_vendor_update" ON bookings
  FOR UPDATE 
  TO authenticated
  USING (vendor_id IN (SELECT id FROM vendors WHERE user_id = auth.uid()));

-- Allow vendor owners to delete their bookings
CREATE POLICY "bookings_vendor_delete" ON bookings
  FOR DELETE 
  TO authenticated
  USING (vendor_id IN (SELECT id FROM vendors WHERE user_id = auth.uid()));

-- =============================================
-- MENU ITEMS TABLE POLICIES
-- =============================================

-- Public can view available menu items
CREATE POLICY "menu_items_public_read" ON menu_items
  FOR SELECT 
  TO anon, authenticated
  USING (is_available = true);

-- Vendor owners can manage all their menu items
CREATE POLICY "menu_items_vendor_all" ON menu_items
  FOR ALL 
  TO authenticated
  USING (vendor_id IN (SELECT id FROM vendors WHERE user_id = auth.uid()))
  WITH CHECK (vendor_id IN (SELECT id FROM vendors WHERE user_id = auth.uid()));

-- =============================================
-- MENU CATEGORIES TABLE POLICIES
-- =============================================

-- Public can view active categories
CREATE POLICY "menu_categories_public_read" ON menu_categories
  FOR SELECT 
  TO anon, authenticated
  USING (is_active = true);

-- Vendor owners can manage all their categories
CREATE POLICY "menu_categories_vendor_all" ON menu_categories
  FOR ALL 
  TO authenticated
  USING (vendor_id IN (SELECT id FROM vendors WHERE user_id = auth.uid()))
  WITH CHECK (vendor_id IN (SELECT id FROM vendors WHERE user_id = auth.uid()));

-- =============================================
-- PACKAGES TABLE POLICIES
-- =============================================

-- Public can view active packages
CREATE POLICY "packages_public_read" ON packages
  FOR SELECT 
  TO anon, authenticated
  USING (is_active = true);

-- Vendor owners can manage all their packages
CREATE POLICY "packages_vendor_all" ON packages
  FOR ALL 
  TO authenticated
  USING (vendor_id IN (SELECT id FROM vendors WHERE user_id = auth.uid()))
  WITH CHECK (vendor_id IN (SELECT id FROM vendors WHERE user_id = auth.uid()));

-- =============================================
-- TIME SLOTS TABLE POLICIES
-- =============================================

-- Public can view active time slots
CREATE POLICY "time_slots_public_read" ON time_slots
  FOR SELECT 
  TO anon, authenticated
  USING (is_active = true);

-- Vendor owners can manage all their time slots
CREATE POLICY "time_slots_vendor_all" ON time_slots
  FOR ALL 
  TO authenticated
  USING (vendor_id IN (SELECT id FROM vendors WHERE user_id = auth.uid()))
  WITH CHECK (vendor_id IN (SELECT id FROM vendors WHERE user_id = auth.uid()));

-- =============================================
-- BLOCKED DATES TABLE POLICIES
-- =============================================

-- Public can view blocked dates
CREATE POLICY "blocked_dates_public_read" ON blocked_dates
  FOR SELECT 
  TO anon, authenticated
  USING (true);

-- Vendor owners can manage all their blocked dates
CREATE POLICY "blocked_dates_vendor_all" ON blocked_dates
  FOR ALL 
  TO authenticated
  USING (vendor_id IN (SELECT id FROM vendors WHERE user_id = auth.uid()))
  WITH CHECK (vendor_id IN (SELECT id FROM vendors WHERE user_id = auth.uid()));

-- =============================================
-- BOOKING NOTIFICATIONS TABLE POLICIES
-- =============================================

-- Vendor owners can view their notifications
CREATE POLICY "booking_notifications_vendor_read" ON booking_notifications
  FOR SELECT 
  TO authenticated
  USING (booking_id IN (
    SELECT b.id FROM bookings b 
    JOIN vendors v ON b.vendor_id = v.id 
    WHERE v.user_id = auth.uid()
  ));

-- =============================================
-- ANALYTICS EVENTS TABLE POLICIES
-- =============================================

-- Anyone can insert analytics events
CREATE POLICY "analytics_public_insert" ON analytics_events
  FOR INSERT 
  TO anon, authenticated
  WITH CHECK (true);

-- Vendor owners can view their analytics
CREATE POLICY "analytics_vendor_read" ON analytics_events
  FOR SELECT 
  TO authenticated
  USING (vendor_id IN (SELECT id FROM vendors WHERE user_id = auth.uid()));

-- =============================================
-- ENSURE RLS IS ENABLED
-- =============================================

ALTER TABLE vendors ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE time_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE blocked_dates ENABLE ROW LEVEL SECURITY;
ALTER TABLE booking_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;

-- =============================================
-- FIX BOOKING REF TRIGGER
-- =============================================

-- Drop and recreate the trigger to ensure it works
DROP TRIGGER IF EXISTS set_booking_ref ON bookings;

CREATE OR REPLACE FUNCTION generate_booking_ref()
RETURNS TRIGGER AS $$
DECLARE
  ref_date TEXT;
  random_part TEXT;
  new_ref TEXT;
  ref_exists BOOLEAN;
BEGIN
  -- Generate unique booking reference
  LOOP
    ref_date := TO_CHAR(COALESCE(NEW.booking_date, CURRENT_DATE), 'YYYYMMDD');
    random_part := UPPER(SUBSTRING(MD5(RANDOM()::TEXT || CLOCK_TIMESTAMP()::TEXT) FROM 1 FOR 4));
    new_ref := 'BX-' || ref_date || '-' || random_part;
    
    -- Check if this ref already exists
    SELECT EXISTS(SELECT 1 FROM bookings WHERE booking_ref = new_ref) INTO ref_exists;
    
    IF NOT ref_exists THEN
      NEW.booking_ref := new_ref;
      EXIT;
    END IF;
  END LOOP;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER set_booking_ref
  BEFORE INSERT ON bookings
  FOR EACH ROW
  WHEN (NEW.booking_ref IS NULL OR NEW.booking_ref = '')
  EXECUTE FUNCTION generate_booking_ref();

-- =============================================
-- GRANT PERMISSIONS
-- =============================================

-- Grant usage on schema
GRANT USAGE ON SCHEMA public TO anon;
GRANT USAGE ON SCHEMA public TO authenticated;

-- Grant permissions on tables
GRANT SELECT ON vendors TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON vendors TO authenticated;

GRANT SELECT, INSERT ON bookings TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON bookings TO authenticated;

GRANT SELECT ON menu_items TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON menu_items TO authenticated;

GRANT SELECT ON menu_categories TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON menu_categories TO authenticated;

GRANT SELECT ON packages TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON packages TO authenticated;

GRANT SELECT ON time_slots TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON time_slots TO authenticated;

GRANT SELECT ON blocked_dates TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON blocked_dates TO authenticated;

GRANT INSERT ON analytics_events TO anon;
GRANT SELECT, INSERT ON analytics_events TO authenticated;

GRANT SELECT ON booking_notifications TO authenticated;

-- =============================================
-- DONE! Test the following:
-- 1. Public booking page should create bookings
-- 2. Dashboard settings should save
-- 3. Dashboard booking creation should work
-- =============================================
