import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Calendar,
  Clock,
  Users,
  Phone,
  Mail,
  MessageSquare,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  Plus,
  Check,
  X,
  MoreVertical,
  Loader2,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Clock4,
  CalendarDays,
  User,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { Card, Button, Badge } from '../../components/ui';
import { supabase } from '../../lib/supabase';
import type { Booking, BookingStatus, BookingInsert } from '../../types/database';

type ViewMode = 'list' | 'calendar';
type FilterStatus = 'all' | BookingStatus;

const statusConfig: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  pending: { label: 'Pending', color: 'bg-amber-100 text-amber-700', icon: Clock4 },
  confirmed: { label: 'Confirmed', color: 'bg-blue-100 text-blue-700', icon: CheckCircle2 },
  completed: { label: 'Completed', color: 'bg-green-100 text-green-700', icon: Check },
  cancelled: { label: 'Cancelled', color: 'bg-red-100 text-red-700', icon: XCircle },
  'no-show': { label: 'No Show', color: 'bg-gray-100 text-gray-700', icon: AlertCircle },
};

export const BookingsPage: React.FC = () => {
  const { vendor } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date());
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  
  // New booking form
  const [form, setForm] = useState({
    customer_name: '',
    customer_email: '',
    customer_phone: '',
    party_size: '2',
    booking_date: '',
    booking_time: '',
    special_requests: '',
  });

  // Fetch bookings
  useEffect(() => {
    if (vendor) {
      fetchBookings();
    }
  }, [vendor]);

  const fetchBookings = async () => {
    if (!vendor) return;
    
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('bookings')
        .select('*')
        .eq('vendor_id', vendor.id)
        .order('booking_date', { ascending: true })
        .order('booking_time', { ascending: true });
      
      if (data) setBookings(data);
    } catch (error) {
      console.error('Error fetching bookings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Filter bookings
  const filteredBookings = bookings.filter((booking) => {
    const matchesSearch = 
      booking.customer_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      booking.customer_email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      booking.customer_phone?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      booking.booking_ref?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = filterStatus === 'all' || booking.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  // Get bookings for a specific date (calendar view)
  const getBookingsForDate = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    return filteredBookings.filter(b => b.booking_date === dateStr);
  };

  // Calendar navigation
  const navigateMonth = (direction: 'prev' | 'next') => {
    setSelectedDate(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(newDate.getMonth() + (direction === 'next' ? 1 : -1));
      return newDate;
    });
  };

  // Generate calendar days
  const generateCalendarDays = () => {
    const year = selectedDate.getFullYear();
    const month = selectedDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDay = firstDay.getDay();
    const daysInMonth = lastDay.getDate();
    
    const days: (Date | null)[] = [];
    
    // Add empty cells for days before the first day
    for (let i = 0; i < startDay; i++) {
      days.push(null);
    }
    
    // Add days of the month
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i));
    }
    
    return days;
  };

  // Update booking status
  const updateBookingStatus = async (bookingId: string, status: BookingStatus) => {
    try {
      await supabase
        .from('bookings')
        .update({ status })
        .eq('id', bookingId);
      await fetchBookings();
      setIsDetailModalOpen(false);
    } catch (error) {
      console.error('Error updating booking status:', error);
    }
  };

  // Create new booking
  const createBooking = async () => {
    if (!vendor || !form.customer_name || !form.booking_date || !form.booking_time) {
      alert('Please fill in name, date, and time');
      return;
    }
    
    if (!form.customer_email) {
      alert('Please enter customer email');
      return;
    }
    
    if (!form.customer_phone) {
      alert('Please enter customer phone');
      return;
    }
    
    setIsSaving(true);
    try {
      // Build booking data - let database generate booking_ref via trigger
      const bookingData = {
        vendor_id: vendor.id,
        customer_name: form.customer_name.trim(),
        customer_email: form.customer_email.trim(),
        customer_phone: form.customer_phone.trim(),
        party_size: parseInt(form.party_size) || 2,
        booking_date: form.booking_date,
        booking_time: form.booking_time,
        special_requests: form.special_requests?.trim() || null,
        status: 'confirmed',
        subtotal: 0,
        deposit_amount: 0,
        total_amount: 0,
        payment_status: 'unpaid', // matches database default
      };
      
      console.log('Creating booking with data:', bookingData);
      
      const { error } = await supabase.from('bookings').insert(bookingData);

      if (error) {
        console.error('Error creating booking:', error);
        alert('Failed to create booking: ' + (error.message || 'Unknown error'));
        return;
      }

      await fetchBookings();
      setIsModalOpen(false);
      resetForm();
    } catch (error: any) {
      console.error('Error creating booking:', error);
      alert(error?.message || 'Failed to create booking');
    } finally {
      setIsSaving(false);
    }
  };

  const resetForm = () => {
    setForm({
      customer_name: '',
      customer_email: '',
      customer_phone: '',
      party_size: '2',
      booking_date: '',
      booking_time: '',
      special_requests: '',
    });
  };

  // Open booking detail
  const openBookingDetail = (booking: Booking) => {
    setSelectedBooking(booking);
    setIsDetailModalOpen(true);
  };

  // Format date for display
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-MY', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  // Format time for display
  const formatTime = (timeStr: string) => {
    const [hours, minutes] = timeStr.split(':');
    const h = parseInt(hours);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const hour = h % 12 || 12;
    return `${hour}:${minutes} ${ampm}`;
  };

  // Check if date is today
  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  // Get upcoming bookings count
  const upcomingCount = bookings.filter(b => 
    b.status === 'confirmed' && new Date(b.booking_date) >= new Date()
  ).length;

  const pendingCount = bookings.filter(b => b.status === 'pending').length;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-dark-900">Bookings</h1>
            <p className="text-dark-500 mt-1">
              {upcomingCount} upcoming • {pendingCount} pending approval
            </p>
          </div>
          <div className="flex gap-3">
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setViewMode('list')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  viewMode === 'list'
                    ? 'bg-white text-dark-900 shadow-sm'
                    : 'text-dark-500 hover:text-dark-700'
                }`}
              >
                List
              </button>
              <button
                onClick={() => setViewMode('calendar')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  viewMode === 'calendar'
                    ? 'bg-white text-dark-900 shadow-sm'
                    : 'text-dark-500 hover:text-dark-700'
                }`}
              >
                Calendar
              </button>
            </div>
            <Button variant="primary" onClick={() => setIsModalOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              New Booking
            </Button>
          </div>
        </div>

        {/* Search and Filters */}
        <Card variant="elevated" className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by name, email, phone, or booking ref..."
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0">
              {(['all', 'pending', 'confirmed', 'completed', 'cancelled', 'no-show'] as FilterStatus[]).map((status) => (
                <button
                  key={status}
                  onClick={() => setFilterStatus(status)}
                  className={`px-4 py-2 rounded-lg whitespace-nowrap transition-colors ${
                    filterStatus === status
                      ? 'bg-primary-100 text-primary-700 font-medium'
                      : 'bg-gray-100 text-dark-600 hover:bg-gray-200'
                  }`}
                >
                  {status === 'all' ? 'All' : statusConfig[status].label}
                </button>
              ))}
            </div>
          </div>
        </Card>

        {/* Content */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
          </div>
        ) : viewMode === 'list' ? (
          /* List View */
          filteredBookings.length === 0 ? (
            <Card variant="elevated" className="p-12 text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-primary-100 to-accent-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <CalendarDays className="w-8 h-8 text-primary-600" />
              </div>
              <h3 className="text-lg font-semibold text-dark-900 mb-2">No bookings found</h3>
              <p className="text-dark-500 mb-4">
                {searchQuery || filterStatus !== 'all'
                  ? 'Try adjusting your filters'
                  : 'Your bookings will appear here'}
              </p>
              <Button variant="primary" onClick={() => setIsModalOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Create Booking
              </Button>
            </Card>
          ) : (
            <div className="space-y-3">
              {filteredBookings.map((booking) => {
                const StatusIcon = statusConfig[booking.status].icon;
                return (
                  <motion.div
                    key={booking.id}
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <Card
                      variant="elevated"
                      className="p-4 hover:shadow-md transition-shadow cursor-pointer"
                      onClick={() => openBookingDetail(booking)}
                    >
                      <div className="flex items-center gap-4">
                        {/* Avatar/Initial */}
                        <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-accent-500 rounded-xl flex items-center justify-center flex-shrink-0">
                          <span className="text-white font-bold text-lg">
                            {booking.customer_name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        
                        {/* Main Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold text-dark-900 truncate">
                              {booking.customer_name}
                            </h3>
                            {booking.booking_ref && (
                              <span className="text-xs text-dark-400 font-mono">
                                #{booking.booking_ref}
                              </span>
                            )}
                          </div>
                          <div className="flex flex-wrap items-center gap-3 text-sm text-dark-500">
                            <span className="flex items-center gap-1">
                              <Calendar className="w-4 h-4" />
                              {formatDate(booking.booking_date)}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="w-4 h-4" />
                              {formatTime(booking.booking_time)}
                            </span>
                            <span className="flex items-center gap-1">
                              <Users className="w-4 h-4" />
                              {booking.party_size} pax
                            </span>
                          </div>
                        </div>
                        
                        {/* Status Badge */}
                        <div className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 ${statusConfig[booking.status].color}`}>
                          <StatusIcon className="w-4 h-4" />
                          <span className="text-sm font-medium">{statusConfig[booking.status].label}</span>
                        </div>
                      </div>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          )
        ) : (
          /* Calendar View */
          <Card variant="elevated" className="p-6">
            {/* Calendar Header */}
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-dark-900">
                {selectedDate.toLocaleDateString('en-MY', { month: 'long', year: 'numeric' })}
              </h2>
              <div className="flex gap-2">
                <button
                  onClick={() => navigateMonth('prev')}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  <ChevronLeft className="w-5 h-5 text-dark-600" />
                </button>
                <button
                  onClick={() => setSelectedDate(new Date())}
                  className="px-3 py-1 text-sm font-medium text-primary-600 hover:bg-primary-50 rounded-lg"
                >
                  Today
                </button>
                <button
                  onClick={() => navigateMonth('next')}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  <ChevronRight className="w-5 h-5 text-dark-600" />
                </button>
              </div>
            </div>
            
            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-px bg-gray-200 rounded-xl overflow-hidden">
              {/* Day Headers */}
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                <div
                  key={day}
                  className="bg-gray-50 px-2 py-3 text-center text-sm font-medium text-dark-500"
                >
                  {day}
                </div>
              ))}
              
              {/* Calendar Days */}
              {generateCalendarDays().map((date, idx) => {
                const dayBookings = date ? getBookingsForDate(date) : [];
                const isCurrentDay = date && isToday(date);
                
                return (
                  <div
                    key={idx}
                    className={`bg-white min-h-[100px] p-2 ${!date ? 'bg-gray-50' : ''}`}
                  >
                    {date && (
                      <>
                        <div
                          className={`w-7 h-7 rounded-full flex items-center justify-center text-sm mb-1 ${
                            isCurrentDay
                              ? 'bg-primary-500 text-white font-bold'
                              : 'text-dark-700'
                          }`}
                        >
                          {date.getDate()}
                        </div>
                        <div className="space-y-1">
                          {dayBookings.slice(0, 3).map((booking) => (
                            <div
                              key={booking.id}
                              onClick={() => openBookingDetail(booking)}
                              className={`text-xs px-2 py-1 rounded cursor-pointer truncate ${statusConfig[booking.status].color}`}
                            >
                              {formatTime(booking.booking_time)} - {booking.customer_name}
                            </div>
                          ))}
                          {dayBookings.length > 3 && (
                            <div className="text-xs text-dark-400 px-2">
                              +{dayBookings.length - 3} more
                            </div>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </Card>
        )}
      </div>

      {/* New Booking Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={() => setIsModalOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                <h2 className="text-xl font-bold text-dark-900">Create New Booking</h2>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  <X className="w-5 h-5 text-dark-500" />
                </button>
              </div>
              
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-dark-700 mb-2">
                    Customer Name *
                  </label>
                  <input
                    type="text"
                    value={form.customer_name}
                    onChange={(e) => setForm({ ...form, customer_name: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="John Doe"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
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
                      Phone *
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
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-dark-700 mb-2">
                      Date *
                    </label>
                    <input
                      type="date"
                      value={form.booking_date}
                      onChange={(e) => setForm({ ...form, booking_date: e.target.value })}
                      min={new Date().toISOString().split('T')[0]}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-dark-700 mb-2">
                      Time *
                    </label>
                    <input
                      type="time"
                      value={form.booking_time}
                      onChange={(e) => setForm({ ...form, booking_time: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-dark-700 mb-2">
                    Party Size
                  </label>
                  <select
                    value={form.party_size}
                    onChange={(e) => setForm({ ...form, party_size: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    {Array.from({ length: 20 }, (_, i) => i + 1).map((num) => (
                      <option key={num} value={num}>{num} {num === 1 ? 'person' : 'people'}</option>
                    ))}
                  </select>
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
                    placeholder="Any special requirements or notes..."
                  />
                </div>
              </div>
              
              <div className="p-6 border-t border-gray-100 flex gap-3">
                <Button
                  variant="secondary"
                  className="flex-1"
                  onClick={() => setIsModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  className="flex-1"
                  onClick={createBooking}
                  disabled={isSaving || !form.customer_name || !form.booking_date || !form.booking_time}
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4 mr-2" />
                      Create Booking
                    </>
                  )}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Booking Detail Modal */}
      <AnimatePresence>
        {isDetailModalOpen && selectedBooking && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={() => setIsDetailModalOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl shadow-xl max-w-lg w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-dark-900">Booking Details</h2>
                  {selectedBooking.booking_ref && (
                    <p className="text-sm text-dark-500 font-mono">#{selectedBooking.booking_ref}</p>
                  )}
                </div>
                <button
                  onClick={() => setIsDetailModalOpen(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  <X className="w-5 h-5 text-dark-500" />
                </button>
              </div>
              
              <div className="p-6 space-y-4">
                {/* Status Badge */}
                <div className="flex items-center justify-between">
                  <span className="text-sm text-dark-500">Status</span>
                  <div className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 ${statusConfig[selectedBooking.status].color}`}>
                    {React.createElement(statusConfig[selectedBooking.status].icon, { className: 'w-4 h-4' })}
                    <span className="text-sm font-medium">{statusConfig[selectedBooking.status].label}</span>
                  </div>
                </div>
                
                {/* Customer Info */}
                <div className="space-y-3 pt-4 border-t border-gray-100">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-accent-500 rounded-xl flex items-center justify-center">
                      <User className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="font-semibold text-dark-900">{selectedBooking.customer_name}</p>
                      <p className="text-sm text-dark-500">{selectedBooking.party_size} pax</p>
                    </div>
                  </div>
                  
                  {selectedBooking.customer_email && (
                    <div className="flex items-center gap-3 text-dark-600">
                      <Mail className="w-5 h-5 text-dark-400" />
                      <a href={`mailto:${selectedBooking.customer_email}`} className="hover:text-primary-600">
                        {selectedBooking.customer_email}
                      </a>
                    </div>
                  )}
                  
                  {selectedBooking.customer_phone && (
                    <div className="flex items-center gap-3 text-dark-600">
                      <Phone className="w-5 h-5 text-dark-400" />
                      <a href={`tel:${selectedBooking.customer_phone}`} className="hover:text-primary-600">
                        {selectedBooking.customer_phone}
                      </a>
                    </div>
                  )}
                </div>
                
                {/* Booking Info */}
                <div className="space-y-3 pt-4 border-t border-gray-100">
                  <div className="flex items-center gap-3 text-dark-600">
                    <Calendar className="w-5 h-5 text-dark-400" />
                    <span>{formatDate(selectedBooking.booking_date)}</span>
                  </div>
                  <div className="flex items-center gap-3 text-dark-600">
                    <Clock className="w-5 h-5 text-dark-400" />
                    <span>{formatTime(selectedBooking.booking_time)}</span>
                  </div>
                </div>
                
                {/* Special Requests */}
                {selectedBooking.special_requests && (
                  <div className="pt-4 border-t border-gray-100">
                    <div className="flex items-start gap-3">
                      <MessageSquare className="w-5 h-5 text-dark-400 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-dark-700 mb-1">Special Requests</p>
                        <p className="text-dark-600">{selectedBooking.special_requests}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Actions */}
              <div className="p-6 border-t border-gray-100 space-y-3">
                {selectedBooking.status === 'pending' && (
                  <div className="flex gap-3">
                    <Button
                      variant="secondary"
                      className="flex-1 border-red-200 text-red-600 hover:bg-red-50"
                      onClick={() => updateBookingStatus(selectedBooking.id, 'cancelled')}
                    >
                      <XCircle className="w-4 h-4 mr-2" />
                      Decline
                    </Button>
                    <Button
                      variant="primary"
                      className="flex-1"
                      onClick={() => updateBookingStatus(selectedBooking.id, 'confirmed')}
                    >
                      <CheckCircle2 className="w-4 h-4 mr-2" />
                      Confirm
                    </Button>
                  </div>
                )}
                
                {selectedBooking.status === 'confirmed' && (
                  <div className="flex gap-3">
                    <Button
                      variant="secondary"
                      className="flex-1"
                      onClick={() => updateBookingStatus(selectedBooking.id, 'no-show')}
                    >
                      <AlertCircle className="w-4 h-4 mr-2" />
                      No Show
                    </Button>
                    <Button
                      variant="primary"
                      className="flex-1"
                      onClick={() => updateBookingStatus(selectedBooking.id, 'completed')}
                    >
                      <Check className="w-4 h-4 mr-2" />
                      Complete
                    </Button>
                  </div>
                )}
                
                {(selectedBooking.status === 'completed' || 
                  selectedBooking.status === 'cancelled' || 
                  selectedBooking.status === 'no-show') && (
                  <p className="text-center text-sm text-dark-400">
                    This booking has been {selectedBooking.status === 'no-show' ? 'marked as no-show' : selectedBooking.status}
                  </p>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </DashboardLayout>
  );
};

export default BookingsPage;
