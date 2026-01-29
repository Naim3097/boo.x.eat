import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Calendar,
  Clock,
  Users,
  MapPin,
  Phone,
  Mail,
  Globe,
  ChevronLeft,
  ChevronRight,
  Check,
  Loader2,
  Star,
  Package,
  UtensilsCrossed,
  ArrowRight,
  AlertCircle,
  Leaf,
  Flame,
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Card, Button, Badge } from '../components/ui';
import type { Vendor, MenuItem, Package as PackageType, TimeSlot, MenuCategory } from '../types/database';

type BookingStep = 'datetime' | 'details' | 'confirm';

export const PublicBookingPage: React.FC = () => {
  const { vendorSlug } = useParams<{ vendorSlug: string }>();
  const navigate = useNavigate();
  
  const [vendor, setVendor] = useState<Vendor | null>(null);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [menuCategories, setMenuCategories] = useState<MenuCategory[]>([]);
  const [packages, setPackages] = useState<PackageType[]>([]);
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [blockedDates, setBlockedDates] = useState<{ date: string; is_full_day: boolean; blocked_start_time: string | null; blocked_end_time: string | null }[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  
  // Booking flow state
  const [step, setStep] = useState<BookingStep>('datetime');
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [selectedPackage, setSelectedPackage] = useState<PackageType | null>(null);
  const [viewingMenu, setViewingMenu] = useState(false);
  
  // Form state
  const [form, setForm] = useState({
    customer_name: '',
    customer_email: '',
    customer_phone: '',
    party_size: 2,
    special_requests: '',
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [bookingRef, setBookingRef] = useState<string | null>(null);

  // Calendar state
  const [calendarMonth, setCalendarMonth] = useState(new Date());

  // Fetch vendor and related data
  useEffect(() => {
    if (vendorSlug) {
      fetchVendorData();
    }
  }, [vendorSlug]);

  const fetchVendorData = async () => {
    if (!vendorSlug) return;
    
    setIsLoading(true);
    try {
      // Fetch vendor by URL slug
      const { data: vendorData, error: vendorError } = await supabase
        .from('vendors')
        .select('*')
        .eq('slug', vendorSlug)
        .eq('is_active', true)
        .single();
      
      if (vendorError || !vendorData) {
        setNotFound(true);
        return;
      }
      
      setVendor(vendorData);
      
      // Fetch related data including blocked dates
      const [itemsRes, categoriesRes, packagesRes, slotsRes, blockedRes] = await Promise.all([
        supabase
          .from('menu_items')
          .select('*')
          .eq('vendor_id', vendorData.id)
          .eq('is_available', true)
          .order('display_order', { ascending: true }),
        supabase
          .from('menu_categories')
          .select('*')
          .eq('vendor_id', vendorData.id)
          .order('display_order', { ascending: true }),
        supabase
          .from('packages')
          .select('*')
          .eq('vendor_id', vendorData.id)
          .eq('is_active', true)
          .order('price', { ascending: true }),
        supabase
          .from('time_slots')
          .select('*')
          .eq('vendor_id', vendorData.id)
          .eq('is_active', true)
          .order('start_time', { ascending: true }),
        supabase
          .from('blocked_dates')
          .select('date, is_full_day, blocked_start_time, blocked_end_time')
          .eq('vendor_id', vendorData.id)
          .gte('date', new Date().toISOString().split('T')[0]),
      ]);
      
      if (itemsRes.data) setMenuItems(itemsRes.data);
      if (categoriesRes.data) setMenuCategories(categoriesRes.data);
      if (packagesRes.data) setPackages(packagesRes.data);
      if (slotsRes.data) setTimeSlots(slotsRes.data);
      if (blockedRes.data) setBlockedDates(blockedRes.data);
    } catch (error) {
      console.error('Error fetching vendor data:', error);
      setNotFound(true);
    } finally {
      setIsLoading(false);
    }
  };

  // Generate calendar days
  const generateCalendarDays = () => {
    const year = calendarMonth.getFullYear();
    const month = calendarMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDay = firstDay.getDay();
    const daysInMonth = lastDay.getDate();
    
    const days: (Date | null)[] = [];
    for (let i = 0; i < startDay; i++) days.push(null);
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i));
    }
    return days;
  };

  // Check if date is available
  const isDateAvailable = (date: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (date < today) return false;
    
    // Check booking window (how far ahead can book)
    if (vendor?.booking_window_days) {
      const maxDate = new Date(today);
      maxDate.setDate(maxDate.getDate() + vendor.booking_window_days);
      if (date > maxDate) return false;
    }
    
    // Check blocked dates (full day blocks)
    const dateStr = date.toISOString().split('T')[0];
    const blockedDate = blockedDates.find(b => b.date === dateStr);
    if (blockedDate?.is_full_day) return false;
    
    // Check if day is in business hours
    const businessHours = vendor?.business_hours as Record<string, { open: string; close: string; closed: boolean }> | null;
    if (businessHours) {
      const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
      const dayHours = businessHours[dayNames[date.getDay()]];
      if (dayHours?.closed) return false;
    }
    
    // Check if there are any time slots for this day
    const dayOfWeek = date.getDay();
    const hasSlots = timeSlots.some(slot => slot.day_of_week === dayOfWeek && slot.is_active);
    if (!hasSlots) return false;
    
    return true;
  };

  // Get available time slots for selected date
  const getAvailableTimeSlots = () => {
    if (!selectedDate || !vendor) return [];
    
    const dayOfWeek = selectedDate.getDay();
    return timeSlots.filter(slot => 
      slot.day_of_week === dayOfWeek && slot.is_active
    ).map(slot => slot.start_time);
  };

  // Format time for display
  const formatTime = (timeStr: string) => {
    const [hours, minutes] = timeStr.split(':');
    const h = parseInt(hours);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const hour = h % 12 || 12;
    return `${hour}:${minutes} ${ampm}`;
  };

  // Submit booking
  const submitBooking = async () => {
    if (!vendor || !selectedDate || !selectedTime) return;
    
    // Validate required fields
    if (!form.customer_name.trim()) {
      alert('Please enter your name');
      return;
    }
    if (!form.customer_email.trim()) {
      alert('Please enter your email');
      return;
    }
    if (!form.customer_phone.trim()) {
      alert('Please enter your phone number');
      return;
    }
    
    setIsSubmitting(true);
    try {
      // Build booking data - let database generate booking_ref via trigger
      const bookingData = {
        vendor_id: vendor.id,
        customer_name: form.customer_name.trim(),
        customer_email: form.customer_email.trim(),
        customer_phone: form.customer_phone.trim(),
        party_size: form.party_size,
        booking_date: selectedDate.toISOString().split('T')[0],
        booking_time: selectedTime,
        special_requests: form.special_requests?.trim() || null,
        package_id: selectedPackage?.id || null,
        status: 'pending',
        subtotal: 0,
        deposit_amount: 0,
        total_amount: 0,
        payment_status: 'unpaid', // matches database default
      };
      
      console.log('Creating booking with data:', bookingData);
      
      const { data, error } = await supabase
        .from('bookings')
        .insert(bookingData)
        .select('booking_ref')
        .single();
      
      if (error) {
        console.error('Booking error details:', error);
        throw error;
      }
      
      setBookingRef(data.booking_ref);
      setBookingSuccess(true);
    } catch (error: any) {
      console.error('Error creating booking:', error);
      // Show more detailed error message
      let errorMsg = 'Failed to create booking. Please try again.';
      if (error?.message) {
        errorMsg = error.message;
      }
      if (error?.code === '42501') {
        errorMsg = 'Permission denied. Please contact the restaurant.';
      }
      if (error?.code === '23502') {
        errorMsg = 'Missing required information. Please fill all fields.';
      }
      alert(errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
      </div>
    );
  }

  // Not found state
  if (notFound || !vendor) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-4">
        <div className="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center mb-4">
          <AlertCircle className="w-8 h-8 text-red-600" />
        </div>
        <h1 className="text-2xl font-bold text-dark-900 mb-2">Restaurant Not Found</h1>
        <p className="text-dark-500 mb-6 text-center">
          The restaurant you're looking for doesn't exist or may have been removed.
        </p>
        <Button variant="primary" onClick={() => navigate('/')}>
          Back to Home
        </Button>
      </div>
    );
  }

  // Success state
  if (bookingSuccess) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-primary-50 via-white to-accent-50 px-4">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="w-20 h-20 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center mb-6"
        >
          <Check className="w-10 h-10 text-white" />
        </motion.div>
        <h1 className="text-3xl font-bold text-dark-900 mb-2">Booking Confirmed!</h1>
        <p className="text-dark-500 mb-6 text-center max-w-md">
          Your booking at <span className="font-semibold text-dark-700">{vendor.name}</span> has been submitted.
        </p>
        {bookingRef && (
          <div className="bg-white px-6 py-4 rounded-xl shadow-md mb-6">
            <p className="text-sm text-dark-500 mb-1">Booking Reference</p>
            <p className="text-2xl font-bold font-mono text-primary-600">#{bookingRef}</p>
          </div>
        )}
        <div className="bg-white px-6 py-4 rounded-xl shadow-sm space-y-2 mb-6">
          <div className="flex items-center gap-2 text-dark-600">
            <Calendar className="w-5 h-5 text-dark-400" />
            <span>{selectedDate?.toLocaleDateString('en-MY', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</span>
          </div>
          <div className="flex items-center gap-2 text-dark-600">
            <Clock className="w-5 h-5 text-dark-400" />
            <span>{selectedTime && formatTime(selectedTime)}</span>
          </div>
          <div className="flex items-center gap-2 text-dark-600">
            <Users className="w-5 h-5 text-dark-400" />
            <span>{form.party_size} {form.party_size === 1 ? 'person' : 'people'}</span>
          </div>
        </div>
        <p className="text-sm text-dark-400 mb-4 text-center">
          You will receive a confirmation when the restaurant accepts your booking.
        </p>
        <Button variant="secondary" onClick={() => window.location.reload()}>
          Make Another Booking
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            {vendor.logo_url ? (
              <img
                src={vendor.logo_url}
                alt={vendor.name}
                className="w-12 h-12 rounded-xl object-cover"
              />
            ) : (
              <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-accent-500 rounded-xl flex items-center justify-center">
                <UtensilsCrossed className="w-6 h-6 text-white" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <h1 className="text-lg font-bold text-dark-900 truncate">{vendor.name}</h1>
              <p className="text-sm text-dark-500 truncate">{vendor.cuisine_type}</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setViewingMenu(!viewingMenu)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  viewingMenu
                    ? 'bg-primary-100 text-primary-700'
                    : 'bg-gray-100 text-dark-600 hover:bg-gray-200'
                }`}
              >
                Menu
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6">
        <AnimatePresence mode="wait">
          {viewingMenu ? (
            /* Menu View */
            <motion.div
              key="menu"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-dark-900">Our Menu</h2>
                <Button variant="secondary" onClick={() => setViewingMenu(false)}>
                  Back to Booking
                </Button>
              </div>

              {menuCategories.length > 0 ? (
                menuCategories.map((category) => {
                  const categoryItems = menuItems.filter(item => item.category_id === category.id);
                  if (categoryItems.length === 0) return null;
                  
                  return (
                    <div key={category.id}>
                      <h3 className="text-lg font-semibold text-dark-900 mb-3">{category.name}</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {categoryItems.map((item) => (
                          <Card key={item.id} variant="elevated" className="p-4 flex gap-4">
                            <div className="w-20 h-20 bg-gray-100 rounded-lg flex-shrink-0 flex items-center justify-center">
                              {item.image_url ? (
                                <img src={item.image_url} alt={item.name} className="w-full h-full object-cover rounded-lg" />
                              ) : (
                                <UtensilsCrossed className="w-8 h-8 text-dark-300" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <h4 className="font-semibold text-dark-900 truncate">{item.name}</h4>
                                {item.is_vegetarian && <Leaf className="w-4 h-4 text-green-500" />}
                                {item.is_spicy && <Flame className="w-4 h-4 text-red-500" />}
                              </div>
                              {item.description && (
                                <p className="text-sm text-dark-500 line-clamp-2 mb-2">{item.description}</p>
                              )}
                              <p className="font-bold text-primary-600">RM {item.price.toFixed(2)}</p>
                            </div>
                          </Card>
                        ))}
                      </div>
                    </div>
                  );
                })
              ) : menuItems.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {menuItems.map((item) => (
                    <Card key={item.id} variant="elevated" className="p-4 flex gap-4">
                      <div className="w-20 h-20 bg-gray-100 rounded-lg flex-shrink-0 flex items-center justify-center">
                        {item.image_url ? (
                          <img src={item.image_url} alt={item.name} className="w-full h-full object-cover rounded-lg" />
                        ) : (
                          <UtensilsCrossed className="w-8 h-8 text-dark-300" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-dark-900 mb-1">{item.name}</h4>
                        {item.description && (
                          <p className="text-sm text-dark-500 line-clamp-2 mb-2">{item.description}</p>
                        )}
                        <p className="font-bold text-primary-600">RM {item.price.toFixed(2)}</p>
                      </div>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card variant="elevated" className="p-8 text-center">
                  <UtensilsCrossed className="w-12 h-12 text-dark-300 mx-auto mb-3" />
                  <p className="text-dark-500">Menu coming soon</p>
                </Card>
              )}
            </motion.div>
          ) : (
            /* Booking Flow */
            <motion.div
              key="booking"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-6"
            >
              {/* Progress Steps */}
              <div className="flex items-center justify-center gap-2 mb-8">
                {[
                  { key: 'datetime', label: 'Date & Time' },
                  { key: 'details', label: 'Your Details' },
                  { key: 'confirm', label: 'Confirm' },
                ].map((s, idx) => (
                  <React.Fragment key={s.key}>
                    <div
                      className={`flex items-center gap-2 px-4 py-2 rounded-full ${
                        step === s.key
                          ? 'bg-primary-100 text-primary-700'
                          : 'text-dark-400'
                      }`}
                    >
                      <span className={`w-6 h-6 rounded-full flex items-center justify-center text-sm font-medium ${
                        step === s.key
                          ? 'bg-primary-500 text-white'
                          : 'bg-gray-200 text-dark-500'
                      }`}>
                        {idx + 1}
                      </span>
                      <span className="hidden sm:inline text-sm font-medium">{s.label}</span>
                    </div>
                    {idx < 2 && <ChevronRight className="w-4 h-4 text-dark-300" />}
                  </React.Fragment>
                ))}
              </div>

              {/* Step Content */}
              <AnimatePresence mode="wait">
                {step === 'datetime' && (
                  <motion.div
                    key="datetime"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="space-y-6"
                  >
                    {/* Date Selection */}
                    <Card variant="elevated" className="p-6">
                      <h3 className="text-lg font-semibold text-dark-900 mb-4">Select Date</h3>
                      
                      {/* Calendar Header */}
                      <div className="flex items-center justify-between mb-4">
                        <button
                          onClick={() => setCalendarMonth(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1))}
                          className="p-2 hover:bg-gray-100 rounded-lg"
                        >
                          <ChevronLeft className="w-5 h-5" />
                        </button>
                        <h4 className="font-medium text-dark-900">
                          {calendarMonth.toLocaleDateString('en-MY', { month: 'long', year: 'numeric' })}
                        </h4>
                        <button
                          onClick={() => setCalendarMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1))}
                          className="p-2 hover:bg-gray-100 rounded-lg"
                        >
                          <ChevronRight className="w-5 h-5" />
                        </button>
                      </div>
                      
                      {/* Calendar Grid */}
                      <div className="grid grid-cols-7 gap-1">
                        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                          <div key={day} className="text-center text-sm font-medium text-dark-500 py-2">
                            {day}
                          </div>
                        ))}
                        {generateCalendarDays().map((date, idx) => {
                          const isAvailable = date && isDateAvailable(date);
                          const isSelected = date && selectedDate?.toDateString() === date.toDateString();
                          
                          return (
                            <button
                              key={idx}
                              onClick={() => date && isAvailable && setSelectedDate(date)}
                              disabled={!date || !isAvailable}
                              className={`aspect-square rounded-lg text-sm font-medium transition-colors ${
                                !date
                                  ? 'invisible'
                                  : isSelected
                                    ? 'bg-primary-500 text-white'
                                    : isAvailable
                                      ? 'hover:bg-primary-50 text-dark-700'
                                      : 'text-dark-300 cursor-not-allowed'
                              }`}
                            >
                              {date?.getDate()}
                            </button>
                          );
                        })}
                      </div>
                    </Card>

                    {/* Time Selection */}
                    {selectedDate && (
                      <Card variant="elevated" className="p-6">
                        <h3 className="text-lg font-semibold text-dark-900 mb-4">Select Time</h3>
                        {getAvailableTimeSlots().length > 0 ? (
                          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                            {getAvailableTimeSlots().map((time) => (
                              <button
                                key={time}
                                onClick={() => setSelectedTime(time)}
                                className={`px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                                  selectedTime === time
                                    ? 'bg-primary-500 text-white'
                                    : 'bg-gray-100 text-dark-700 hover:bg-primary-50'
                                }`}
                              >
                                {formatTime(time)}
                              </button>
                            ))}
                          </div>
                        ) : (
                          <p className="text-dark-500 text-center py-4">
                            No time slots available for this date. Please try another date.
                          </p>
                        )}
                      </Card>
                    )}

                    {/* Party Size */}
                    {selectedTime && (
                      <Card variant="elevated" className="p-6">
                        <h3 className="text-lg font-semibold text-dark-900 mb-4">Party Size</h3>
                        <div className="flex items-center gap-4">
                          <button
                            onClick={() => setForm(prev => ({ ...prev, party_size: Math.max(1, prev.party_size - 1) }))}
                            className="w-12 h-12 rounded-full bg-gray-100 text-dark-700 font-bold text-xl hover:bg-gray-200"
                          >
                            -
                          </button>
                          <span className="text-2xl font-bold text-dark-900 w-16 text-center">
                            {form.party_size}
                          </span>
                          <button
                            onClick={() => setForm(prev => ({ ...prev, party_size: Math.min(20, prev.party_size + 1) }))}
                            className="w-12 h-12 rounded-full bg-gray-100 text-dark-700 font-bold text-xl hover:bg-gray-200"
                          >
                            +
                          </button>
                        </div>
                      </Card>
                    )}

                    {/* Packages */}
                    {packages.length > 0 && selectedTime && (
                      <Card variant="elevated" className="p-6">
                        <h3 className="text-lg font-semibold text-dark-900 mb-4">Special Packages (Optional)</h3>
                        <div className="space-y-3">
                          <button
                            onClick={() => setSelectedPackage(null)}
                            className={`w-full p-4 rounded-xl border-2 text-left transition-colors ${
                              !selectedPackage
                                ? 'border-primary-500 bg-primary-50'
                                : 'border-gray-200 hover:border-gray-300'
                            }`}
                          >
                            <span className="font-medium text-dark-900">No package - Standard booking</span>
                          </button>
                          {packages.map((pkg) => (
                            <button
                              key={pkg.id}
                              onClick={() => setSelectedPackage(pkg)}
                              className={`w-full p-4 rounded-xl border-2 text-left transition-colors ${
                                selectedPackage?.id === pkg.id
                                  ? 'border-primary-500 bg-primary-50'
                                  : 'border-gray-200 hover:border-gray-300'
                              }`}
                            >
                              <div className="flex items-start justify-between">
                                <div>
                                  <div className="flex items-center gap-2 mb-1">
                                    <Package className="w-5 h-5 text-primary-500" />
                                    <span className="font-semibold text-dark-900">{pkg.name}</span>
                                    {pkg.is_featured && (
                                      <Badge variant="primary" size="sm">
                                        <Star className="w-3 h-3 mr-1" />
                                        Popular
                                      </Badge>
                                    )}
                                  </div>
                                  {pkg.description && (
                                    <p className="text-sm text-dark-500 mb-2">{pkg.description}</p>
                                  )}
                                  <p className="text-xs text-dark-400">{pkg.min_pax}-{pkg.max_pax} pax</p>
                                </div>
                                <div className="text-right">
                                  <p className="font-bold text-primary-600">RM {pkg.price.toFixed(2)}</p>
                                  {pkg.compare_price && pkg.compare_price > pkg.price && (
                                    <p className="text-sm text-dark-400 line-through">RM {pkg.compare_price.toFixed(2)}</p>
                                  )}
                                </div>
                              </div>
                            </button>
                          ))}
                        </div>
                      </Card>
                    )}

                    {/* Continue Button */}
                    <Button
                      variant="primary"
                      className="w-full"
                      onClick={() => setStep('details')}
                      disabled={!selectedDate || !selectedTime}
                    >
                      Continue
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </motion.div>
                )}

                {step === 'details' && (
                  <motion.div
                    key="details"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="space-y-6"
                  >
                    <Card variant="elevated" className="p-6">
                      <h3 className="text-lg font-semibold text-dark-900 mb-4">Your Details</h3>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-dark-700 mb-2">
                            Full Name *
                          </label>
                          <input
                            type="text"
                            value={form.customer_name}
                            onChange={(e) => setForm({ ...form, customer_name: e.target.value })}
                            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500"
                            placeholder="John Doe"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-dark-700 mb-2">
                            Email *
                          </label>
                          <input
                            type="email"
                            value={form.customer_email}
                            onChange={(e) => setForm({ ...form, customer_email: e.target.value })}
                            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500"
                            placeholder="john@email.com"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-dark-700 mb-2">
                            Phone Number *
                          </label>
                          <input
                            type="tel"
                            value={form.customer_phone}
                            onChange={(e) => setForm({ ...form, customer_phone: e.target.value })}
                            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500"
                            placeholder="+60 12-345 6789"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-dark-700 mb-2">
                            Special Requests
                          </label>
                          <textarea
                            value={form.special_requests}
                            onChange={(e) => setForm({ ...form, special_requests: e.target.value })}
                            rows={3}
                            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500"
                            placeholder="Birthday celebration, dietary requirements, etc."
                          />
                        </div>
                      </div>
                    </Card>

                    <div className="flex gap-3">
                      <Button
                        variant="secondary"
                        className="flex-1"
                        onClick={() => setStep('datetime')}
                      >
                        <ChevronLeft className="w-4 h-4 mr-2" />
                        Back
                      </Button>
                      <Button
                        variant="primary"
                        className="flex-1"
                        onClick={() => setStep('confirm')}
                        disabled={!form.customer_name || !form.customer_email || !form.customer_phone}
                      >
                        Continue
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
                    </div>
                  </motion.div>
                )}

                {step === 'confirm' && (
                  <motion.div
                    key="confirm"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="space-y-6"
                  >
                    <Card variant="elevated" className="p-6">
                      <h3 className="text-lg font-semibold text-dark-900 mb-4">Review Your Booking</h3>
                      
                      <div className="space-y-4">
                        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                          <Calendar className="w-5 h-5 text-primary-500" />
                          <div>
                            <p className="text-sm text-dark-500">Date</p>
                            <p className="font-medium text-dark-900">
                              {selectedDate?.toLocaleDateString('en-MY', { 
                                weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' 
                              })}
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                          <Clock className="w-5 h-5 text-primary-500" />
                          <div>
                            <p className="text-sm text-dark-500">Time</p>
                            <p className="font-medium text-dark-900">{selectedTime && formatTime(selectedTime)}</p>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                          <Users className="w-5 h-5 text-primary-500" />
                          <div>
                            <p className="text-sm text-dark-500">Party Size</p>
                            <p className="font-medium text-dark-900">{form.party_size} {form.party_size === 1 ? 'person' : 'people'}</p>
                          </div>
                        </div>
                        
                        {selectedPackage && (
                          <div className="flex items-center gap-3 p-3 bg-primary-50 rounded-xl">
                            <Package className="w-5 h-5 text-primary-500" />
                            <div className="flex-1">
                              <p className="text-sm text-dark-500">Package</p>
                              <p className="font-medium text-dark-900">{selectedPackage.name}</p>
                            </div>
                            <p className="font-bold text-primary-600">RM {selectedPackage.price.toFixed(2)}</p>
                          </div>
                        )}
                        
                        <div className="border-t border-gray-100 pt-4">
                          <p className="font-medium text-dark-900 mb-2">{form.customer_name}</p>
                          {form.customer_email && (
                            <p className="text-sm text-dark-500">{form.customer_email}</p>
                          )}
                          {form.customer_phone && (
                            <p className="text-sm text-dark-500">{form.customer_phone}</p>
                          )}
                        </div>
                        
                        {form.special_requests && (
                          <div className="border-t border-gray-100 pt-4">
                            <p className="text-sm text-dark-500 mb-1">Special Requests</p>
                            <p className="text-dark-700">{form.special_requests}</p>
                          </div>
                        )}
                      </div>
                    </Card>

                    <div className="flex gap-3">
                      <Button
                        variant="secondary"
                        className="flex-1"
                        onClick={() => setStep('details')}
                      >
                        <ChevronLeft className="w-4 h-4 mr-2" />
                        Back
                      </Button>
                      <Button
                        variant="primary"
                        className="flex-1"
                        onClick={submitBooking}
                        disabled={isSubmitting}
                      >
                        {isSubmitting ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Booking...
                          </>
                        ) : (
                          <>
                            <Check className="w-4 h-4 mr-2" />
                            Confirm Booking
                          </>
                        )}
                      </Button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-100 mt-12">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="text-center md:text-left">
              {vendor.address && (
                <div className="flex items-center justify-center md:justify-start gap-2 text-dark-500 mb-1">
                  <MapPin className="w-4 h-4" />
                  <span className="text-sm">{vendor.address}</span>
                </div>
              )}
              {vendor.phone && (
                <div className="flex items-center justify-center md:justify-start gap-2 text-dark-500">
                  <Phone className="w-4 h-4" />
                  <a href={`tel:${vendor.phone}`} className="text-sm hover:text-primary-600">{vendor.phone}</a>
                </div>
              )}
            </div>
            <div className="text-sm text-dark-400">
              Powered by <span className="font-semibold text-primary-600">boo.x" eat</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default PublicBookingPage;
