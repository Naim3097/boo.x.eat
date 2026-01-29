-- =============================================
-- BOO.X.EAT STARTER TIER - DATABASE SCHEMA
-- =============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- VENDORS TABLE
-- Restaurant/F&B vendor profiles
-- =============================================
CREATE TABLE IF NOT EXISTS vendors (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  
  -- Basic Info
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL, -- URL slug: booxeat.com/[slug]
  description TEXT,
  cuisine_type VARCHAR(100), -- e.g., "Malaysian", "Western", "Japanese"
  
  -- Contact
  email VARCHAR(255),
  phone VARCHAR(50),
  whatsapp VARCHAR(50),
  
  -- Location
  address TEXT,
  city VARCHAR(100),
  state VARCHAR(100),
  postal_code VARCHAR(20),
  country VARCHAR(100) DEFAULT 'Malaysia',
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  
  -- Media
  logo_url TEXT,
  cover_image_url TEXT,
  gallery_urls TEXT[], -- Array of image URLs
  
  -- Business Hours (JSON format)
  business_hours JSONB DEFAULT '{
    "monday": {"open": "09:00", "close": "22:00", "closed": false},
    "tuesday": {"open": "09:00", "close": "22:00", "closed": false},
    "wednesday": {"open": "09:00", "close": "22:00", "closed": false},
    "thursday": {"open": "09:00", "close": "22:00", "closed": false},
    "friday": {"open": "09:00", "close": "22:00", "closed": false},
    "saturday": {"open": "09:00", "close": "22:00", "closed": false},
    "sunday": {"open": "09:00", "close": "22:00", "closed": true}
  }'::jsonb,
  
  -- Booking Settings
  max_party_size INT DEFAULT 20,
  min_party_size INT DEFAULT 1,
  booking_lead_time_hours INT DEFAULT 2, -- Minimum hours before booking
  booking_window_days INT DEFAULT 30, -- How far ahead can book
  slot_duration_minutes INT DEFAULT 60, -- Default booking slot duration
  tables_count INT DEFAULT 10,
  
  -- Payment Settings
  deposit_required BOOLEAN DEFAULT false,
  deposit_amount DECIMAL(10, 2),
  deposit_percentage INT, -- Alternative: percentage of total
  payment_methods JSONB DEFAULT '["cash", "card"]'::jsonb,
  stripe_account_id VARCHAR(255), -- For connected Stripe accounts
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  is_verified BOOLEAN DEFAULT false,
  subscription_tier VARCHAR(50) DEFAULT 'starter',
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- MENU CATEGORIES TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS menu_categories (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  vendor_id UUID REFERENCES vendors(id) ON DELETE CASCADE NOT NULL,
  
  name VARCHAR(255) NOT NULL,
  description TEXT,
  display_order INT DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- MENU ITEMS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS menu_items (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  vendor_id UUID REFERENCES vendors(id) ON DELETE CASCADE NOT NULL,
  category_id UUID REFERENCES menu_categories(id) ON DELETE SET NULL,
  
  name VARCHAR(255) NOT NULL,
  description TEXT,
  price DECIMAL(10, 2) NOT NULL,
  compare_price DECIMAL(10, 2), -- Original price for discounts
  
  image_url TEXT,
  
  -- Options
  is_available BOOLEAN DEFAULT true,
  is_featured BOOLEAN DEFAULT false,
  is_vegetarian BOOLEAN DEFAULT false,
  is_spicy BOOLEAN DEFAULT false,
  spicy_level INT DEFAULT 0, -- 0-3 scale
  
  -- Dietary tags
  dietary_tags TEXT[], -- e.g., ["halal", "gluten-free", "vegan"]
  
  -- Variants/Options (JSON)
  variants JSONB, -- e.g., [{"name": "Size", "options": [{"label": "Regular", "price": 0}, {"label": "Large", "price": 2}]}]
  
  display_order INT DEFAULT 0,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- PACKAGES TABLE
-- Special deals, set menus, event packages
-- =============================================
CREATE TABLE IF NOT EXISTS packages (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  vendor_id UUID REFERENCES vendors(id) ON DELETE CASCADE NOT NULL,
  
  name VARCHAR(255) NOT NULL,
  description TEXT,
  
  -- Pricing
  price DECIMAL(10, 2) NOT NULL,
  compare_price DECIMAL(10, 2), -- Original price
  price_per_pax BOOLEAN DEFAULT false, -- Is price per person?
  min_pax INT DEFAULT 1,
  max_pax INT,
  
  -- Contents
  includes TEXT[], -- List of what's included
  menu_items UUID[], -- References to menu_items
  
  -- Media
  image_url TEXT,
  gallery_urls TEXT[],
  
  -- Availability
  is_active BOOLEAN DEFAULT true,
  available_days TEXT[], -- e.g., ["monday", "tuesday", "wednesday"]
  available_start_time TIME,
  available_end_time TIME,
  valid_from DATE,
  valid_until DATE,
  
  -- Booking requirements
  advance_booking_days INT DEFAULT 1, -- Days in advance required
  
  display_order INT DEFAULT 0,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- TIME SLOTS TABLE
-- Available booking time slots
-- =============================================
CREATE TABLE IF NOT EXISTS time_slots (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  vendor_id UUID REFERENCES vendors(id) ON DELETE CASCADE NOT NULL,
  
  day_of_week INT NOT NULL, -- 0=Sunday, 1=Monday, etc.
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  
  max_bookings INT DEFAULT 5, -- Max concurrent bookings for this slot
  is_active BOOLEAN DEFAULT true,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- BLOCKED DATES TABLE
-- For holidays, closures, special events
-- =============================================
CREATE TABLE IF NOT EXISTS blocked_dates (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  vendor_id UUID REFERENCES vendors(id) ON DELETE CASCADE NOT NULL,
  
  date DATE NOT NULL,
  reason VARCHAR(255),
  is_full_day BOOLEAN DEFAULT true,
  blocked_start_time TIME,
  blocked_end_time TIME,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- BOOKINGS TABLE
-- Customer reservations
-- =============================================
CREATE TABLE IF NOT EXISTS bookings (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  vendor_id UUID REFERENCES vendors(id) ON DELETE CASCADE NOT NULL,
  
  -- Booking Reference
  booking_ref VARCHAR(20) UNIQUE NOT NULL, -- e.g., "BX-20260128-A1B2"
  
  -- Customer Info
  customer_name VARCHAR(255) NOT NULL,
  customer_email VARCHAR(255) NOT NULL,
  customer_phone VARCHAR(50) NOT NULL,
  
  -- Booking Details
  booking_date DATE NOT NULL,
  booking_time TIME NOT NULL,
  party_size INT NOT NULL,
  
  -- Package (optional)
  package_id UUID REFERENCES packages(id) ON DELETE SET NULL,
  
  -- Special Requests
  special_requests TEXT,
  occasion VARCHAR(100), -- e.g., "Birthday", "Anniversary"
  
  -- Pre-ordered Items (JSON)
  preorder_items JSONB, -- [{menu_item_id, quantity, variants, notes}]
  
  -- Pricing
  subtotal DECIMAL(10, 2) DEFAULT 0,
  deposit_amount DECIMAL(10, 2) DEFAULT 0,
  total_amount DECIMAL(10, 2) DEFAULT 0,
  
  -- Status
  status VARCHAR(50) DEFAULT 'pending', -- pending, confirmed, cancelled, completed, no_show
  payment_status VARCHAR(50) DEFAULT 'unpaid', -- unpaid, deposit_paid, fully_paid, refunded
  
  -- Payment Info
  payment_method VARCHAR(50),
  payment_intent_id VARCHAR(255), -- Stripe payment intent
  payment_date TIMESTAMP WITH TIME ZONE,
  
  -- Confirmation
  confirmed_at TIMESTAMP WITH TIME ZONE,
  confirmed_by UUID REFERENCES auth.users(id),
  
  -- Cancellation
  cancelled_at TIMESTAMP WITH TIME ZONE,
  cancellation_reason TEXT,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- BOOKING NOTIFICATIONS TABLE
-- Email/SMS notification logs
-- =============================================
CREATE TABLE IF NOT EXISTS booking_notifications (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  booking_id UUID REFERENCES bookings(id) ON DELETE CASCADE NOT NULL,
  
  type VARCHAR(50) NOT NULL, -- confirmation, reminder, cancellation
  channel VARCHAR(50) NOT NULL, -- email, sms, whatsapp
  recipient VARCHAR(255) NOT NULL,
  
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  status VARCHAR(50) DEFAULT 'sent', -- sent, failed, delivered
  error_message TEXT
);

-- =============================================
-- ANALYTICS EVENTS TABLE
-- For basic analytics tracking
-- =============================================
CREATE TABLE IF NOT EXISTS analytics_events (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  vendor_id UUID REFERENCES vendors(id) ON DELETE CASCADE NOT NULL,
  
  event_type VARCHAR(100) NOT NULL, -- page_view, booking_started, booking_completed, etc.
  event_data JSONB,
  
  -- Session info
  session_id VARCHAR(255),
  user_agent TEXT,
  ip_address INET,
  referrer TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- INDEXES FOR PERFORMANCE
-- =============================================
CREATE INDEX idx_vendors_slug ON vendors(slug);
CREATE INDEX idx_vendors_user_id ON vendors(user_id);
CREATE INDEX idx_vendors_is_active ON vendors(is_active);

CREATE INDEX idx_menu_items_vendor_id ON menu_items(vendor_id);
CREATE INDEX idx_menu_items_category_id ON menu_items(category_id);
CREATE INDEX idx_menu_items_is_available ON menu_items(is_available);

CREATE INDEX idx_packages_vendor_id ON packages(vendor_id);
CREATE INDEX idx_packages_is_active ON packages(is_active);

CREATE INDEX idx_bookings_vendor_id ON bookings(vendor_id);
CREATE INDEX idx_bookings_booking_ref ON bookings(booking_ref);
CREATE INDEX idx_bookings_booking_date ON bookings(booking_date);
CREATE INDEX idx_bookings_status ON bookings(status);
CREATE INDEX idx_bookings_customer_email ON bookings(customer_email);

CREATE INDEX idx_time_slots_vendor_id ON time_slots(vendor_id);
CREATE INDEX idx_blocked_dates_vendor_id ON blocked_dates(vendor_id);
CREATE INDEX idx_blocked_dates_date ON blocked_dates(date);

CREATE INDEX idx_analytics_vendor_id ON analytics_events(vendor_id);
CREATE INDEX idx_analytics_event_type ON analytics_events(event_type);
CREATE INDEX idx_analytics_created_at ON analytics_events(created_at);

-- =============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =============================================

-- Enable RLS on all tables
ALTER TABLE vendors ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE time_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE blocked_dates ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE booking_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;

-- Vendors: Users can only manage their own vendor profile
CREATE POLICY "Users can view their own vendor" ON vendors
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own vendor" ON vendors
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own vendor" ON vendors
  FOR UPDATE USING (auth.uid() = user_id);

-- Public can view active vendors
CREATE POLICY "Public can view active vendors" ON vendors
  FOR SELECT USING (is_active = true);

-- Menu Categories: Vendor owners can manage, public can view
CREATE POLICY "Vendors can manage their categories" ON menu_categories
  FOR ALL USING (vendor_id IN (SELECT id FROM vendors WHERE user_id = auth.uid()));

CREATE POLICY "Public can view active menu categories" ON menu_categories
  FOR SELECT USING (is_active = true);

-- Menu Items: Vendor owners can manage, public can view
CREATE POLICY "Vendors can manage their menu items" ON menu_items
  FOR ALL USING (vendor_id IN (SELECT id FROM vendors WHERE user_id = auth.uid()));

CREATE POLICY "Public can view available menu items" ON menu_items
  FOR SELECT USING (is_available = true);

-- Packages: Vendor owners can manage, public can view
CREATE POLICY "Vendors can manage their packages" ON packages
  FOR ALL USING (vendor_id IN (SELECT id FROM vendors WHERE user_id = auth.uid()));

CREATE POLICY "Public can view active packages" ON packages
  FOR SELECT USING (is_active = true);

-- Time Slots: Vendor owners can manage, public can view
CREATE POLICY "Vendors can manage their time slots" ON time_slots
  FOR ALL USING (vendor_id IN (SELECT id FROM vendors WHERE user_id = auth.uid()));

CREATE POLICY "Public can view active time slots" ON time_slots
  FOR SELECT USING (is_active = true);

-- Blocked Dates: Vendor owners can manage, public can view
CREATE POLICY "Vendors can manage their blocked dates" ON blocked_dates
  FOR ALL USING (vendor_id IN (SELECT id FROM vendors WHERE user_id = auth.uid()));

CREATE POLICY "Public can view blocked dates" ON blocked_dates
  FOR SELECT USING (true);

-- Bookings: Vendors can manage their bookings, customers can insert
CREATE POLICY "Vendors can view their bookings" ON bookings
  FOR SELECT USING (vendor_id IN (SELECT id FROM vendors WHERE user_id = auth.uid()));

CREATE POLICY "Vendors can update their bookings" ON bookings
  FOR UPDATE USING (vendor_id IN (SELECT id FROM vendors WHERE user_id = auth.uid()));

CREATE POLICY "Anyone can create a booking" ON bookings
  FOR INSERT WITH CHECK (true);

-- Customers can view their own bookings by email (for status check)
CREATE POLICY "Customers can view their bookings" ON bookings
  FOR SELECT USING (true); -- Will filter by booking_ref in application

-- Analytics: Vendors can view their analytics
CREATE POLICY "Vendors can view their analytics" ON analytics_events
  FOR SELECT USING (vendor_id IN (SELECT id FROM vendors WHERE user_id = auth.uid()));

CREATE POLICY "Anyone can insert analytics events" ON analytics_events
  FOR INSERT WITH CHECK (true);

-- =============================================
-- FUNCTIONS & TRIGGERS
-- =============================================

-- Function to generate booking reference
CREATE OR REPLACE FUNCTION generate_booking_ref()
RETURNS TRIGGER AS $$
DECLARE
  ref_date TEXT;
  random_part TEXT;
BEGIN
  ref_date := TO_CHAR(NEW.booking_date, 'YYYYMMDD');
  random_part := UPPER(SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 4));
  NEW.booking_ref := 'BX-' || ref_date || '-' || random_part;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_booking_ref
  BEFORE INSERT ON bookings
  FOR EACH ROW
  WHEN (NEW.booking_ref IS NULL)
  EXECUTE FUNCTION generate_booking_ref();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at trigger to relevant tables
CREATE TRIGGER update_vendors_updated_at
  BEFORE UPDATE ON vendors
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_menu_items_updated_at
  BEFORE UPDATE ON menu_items
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_packages_updated_at
  BEFORE UPDATE ON packages
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_bookings_updated_at
  BEFORE UPDATE ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_menu_categories_updated_at
  BEFORE UPDATE ON menu_categories
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- SAMPLE DATA (OPTIONAL - for development)
-- =============================================
-- Uncomment to insert sample vendor data

/*
INSERT INTO vendors (user_id, name, slug, description, cuisine_type, email, phone, address, city, state)
VALUES (
  'YOUR_USER_ID_HERE',
  'Kedai Kakros',
  'kedaikakros',
  'Authentic Malaysian cuisine with a modern twist. Family recipes passed down through generations.',
  'Malaysian',
  'hello@kedaikakros.com',
  '+60123456789',
  '123 Jalan Makan, Taman Sedap',
  'Kuala Lumpur',
  'Wilayah Persekutuan'
);
*/
