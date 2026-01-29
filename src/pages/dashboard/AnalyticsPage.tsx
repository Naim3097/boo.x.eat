import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  TrendingUp,
  TrendingDown,
  Users,
  Calendar,
  DollarSign,
  Clock,
  BarChart3,
  PieChart,
  ArrowUpRight,
  ArrowDownRight,
  Loader2,
  CalendarDays,
  UserCheck,
  XCircle,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { Card, Badge } from '../../components/ui';
import { supabase } from '../../lib/supabase';
import type { Booking } from '../../types/database';

type DateRange = '7d' | '30d' | '90d' | 'all';

interface Stats {
  totalBookings: number;
  confirmedBookings: number;
  cancelledBookings: number;
  noShowBookings: number;
  totalGuests: number;
  avgPartySize: number;
  bookingsByDay: { day: string; count: number }[];
  bookingsByStatus: { status: string; count: number }[];
  topTimeSlots: { time: string; count: number }[];
}

export const AnalyticsPage: React.FC = () => {
  const { vendor } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [dateRange, setDateRange] = useState<DateRange>('30d');
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    if (vendor) {
      fetchAnalytics();
    }
  }, [vendor, dateRange]);

  const fetchAnalytics = async () => {
    if (!vendor) return;
    
    setIsLoading(true);
    try {
      let query = supabase
        .from('bookings')
        .select('*')
        .eq('vendor_id', vendor.id);
      
      // Apply date filter
      if (dateRange !== 'all') {
        const days = dateRange === '7d' ? 7 : dateRange === '30d' ? 30 : 90;
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);
        query = query.gte('created_at', startDate.toISOString());
      }
      
      const { data } = await query;
      
      if (data) {
        calculateStats(data);
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const calculateStats = (data: Booking[]) => {
    const totalBookings = data.length;
    const confirmedBookings = data.filter(b => b.status === 'confirmed' || b.status === 'completed').length;
    const cancelledBookings = data.filter(b => b.status === 'cancelled').length;
    const noShowBookings = data.filter(b => b.status === 'no-show').length;
    const totalGuests = data.reduce((sum, b) => sum + b.party_size, 0);
    const avgPartySize = totalBookings > 0 ? totalGuests / totalBookings : 0;
    
    // Bookings by day of week
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const bookingsByDayMap = new Map<number, number>();
    data.forEach(b => {
      const day = new Date(b.booking_date).getDay();
      bookingsByDayMap.set(day, (bookingsByDayMap.get(day) || 0) + 1);
    });
    const bookingsByDay = dayNames.map((name, idx) => ({
      day: name,
      count: bookingsByDayMap.get(idx) || 0,
    }));
    
    // Bookings by status
    const statusCounts = new Map<string, number>();
    data.forEach(b => {
      statusCounts.set(b.status, (statusCounts.get(b.status) || 0) + 1);
    });
    const bookingsByStatus = Array.from(statusCounts.entries()).map(([status, count]) => ({
      status,
      count,
    }));
    
    // Top time slots
    const timeCounts = new Map<string, number>();
    data.forEach(b => {
      timeCounts.set(b.booking_time, (timeCounts.get(b.booking_time) || 0) + 1);
    });
    const topTimeSlots = Array.from(timeCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([time, count]) => ({ time, count }));
    
    setStats({
      totalBookings,
      confirmedBookings,
      cancelledBookings,
      noShowBookings,
      totalGuests,
      avgPartySize,
      bookingsByDay,
      bookingsByStatus,
      topTimeSlots,
    });
  };

  const formatTime = (timeStr: string) => {
    const [hours, minutes] = timeStr.split(':');
    const h = parseInt(hours);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const hour = h % 12 || 12;
    return `${hour}:${minutes} ${ampm}`;
  };

  const statusColors: Record<string, string> = {
    pending: 'bg-amber-500',
    confirmed: 'bg-blue-500',
    completed: 'bg-green-500',
    cancelled: 'bg-red-500',
    'no-show': 'bg-gray-500',
  };

  const getMaxBookingCount = () => {
    if (!stats) return 0;
    return Math.max(...stats.bookingsByDay.map(d => d.count), 1);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-dark-900">Analytics</h1>
            <p className="text-dark-500 mt-1">
              Track your booking performance and trends
            </p>
          </div>
          <div className="flex gap-2">
            {(['7d', '30d', '90d', 'all'] as DateRange[]).map((range) => (
              <button
                key={range}
                onClick={() => setDateRange(range)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  dateRange === range
                    ? 'bg-primary-100 text-primary-700'
                    : 'bg-gray-100 text-dark-600 hover:bg-gray-200'
                }`}
              >
                {range === '7d' ? '7 Days' : range === '30d' ? '30 Days' : range === '90d' ? '90 Days' : 'All Time'}
              </button>
            ))}
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
          </div>
        ) : !stats || stats.totalBookings === 0 ? (
          <Card variant="elevated" className="p-12 text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-primary-100 to-accent-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <BarChart3 className="w-8 h-8 text-primary-600" />
            </div>
            <h3 className="text-lg font-semibold text-dark-900 mb-2">No data yet</h3>
            <p className="text-dark-500">
              Your analytics will appear here once you start receiving bookings.
            </p>
          </Card>
        ) : (
          <>
            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <Card variant="elevated" className="p-5">
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-10 h-10 bg-primary-100 rounded-xl flex items-center justify-center">
                      <CalendarDays className="w-5 h-5 text-primary-600" />
                    </div>
                    <Badge variant="primary" size="sm">
                      <TrendingUp className="w-3 h-3 mr-1" />
                      Total
                    </Badge>
                  </div>
                  <p className="text-2xl font-bold text-dark-900">{stats.totalBookings}</p>
                  <p className="text-sm text-dark-500">Total Bookings</p>
                </Card>
              </motion.div>
              
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <Card variant="elevated" className="p-5">
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
                      <UserCheck className="w-5 h-5 text-green-600" />
                    </div>
                    <span className="text-sm font-medium text-green-600">
                      {stats.totalBookings > 0 
                        ? Math.round((stats.confirmedBookings / stats.totalBookings) * 100) 
                        : 0}%
                    </span>
                  </div>
                  <p className="text-2xl font-bold text-dark-900">{stats.confirmedBookings}</p>
                  <p className="text-sm text-dark-500">Confirmed/Completed</p>
                </Card>
              </motion.div>
              
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <Card variant="elevated" className="p-5">
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-10 h-10 bg-accent-100 rounded-xl flex items-center justify-center">
                      <Users className="w-5 h-5 text-accent-600" />
                    </div>
                  </div>
                  <p className="text-2xl font-bold text-dark-900">{stats.totalGuests}</p>
                  <p className="text-sm text-dark-500">Total Guests</p>
                </Card>
              </motion.div>
              
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                <Card variant="elevated" className="p-5">
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center">
                      <Users className="w-5 h-5 text-orange-600" />
                    </div>
                  </div>
                  <p className="text-2xl font-bold text-dark-900">{stats.avgPartySize.toFixed(1)}</p>
                  <p className="text-sm text-dark-500">Avg Party Size</p>
                </Card>
              </motion.div>
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Bookings by Day */}
              <Card variant="elevated" className="p-6">
                <h3 className="text-lg font-semibold text-dark-900 mb-4">Bookings by Day</h3>
                <div className="flex items-end justify-between h-48 gap-2">
                  {stats.bookingsByDay.map((item) => (
                    <div key={item.day} className="flex flex-col items-center flex-1">
                      <div
                        className="w-full bg-gradient-to-t from-primary-500 to-primary-400 rounded-t-lg transition-all duration-500"
                        style={{
                          height: `${(item.count / getMaxBookingCount()) * 100}%`,
                          minHeight: item.count > 0 ? '20px' : '4px',
                        }}
                      />
                      <span className="text-xs text-dark-500 mt-2 font-medium">{item.day}</span>
                      <span className="text-xs text-dark-400">{item.count}</span>
                    </div>
                  ))}
                </div>
              </Card>

              {/* Status Distribution */}
              <Card variant="elevated" className="p-6">
                <h3 className="text-lg font-semibold text-dark-900 mb-4">Booking Status</h3>
                <div className="space-y-4">
                  {stats.bookingsByStatus.map((item) => {
                    const percentage = Math.round((item.count / stats.totalBookings) * 100);
                    return (
                      <div key={item.status}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium text-dark-700 capitalize">
                            {item.status === 'no-show' ? 'No Show' : item.status}
                          </span>
                          <span className="text-sm text-dark-500">{item.count} ({percentage}%)</span>
                        </div>
                        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${percentage}%` }}
                            transition={{ duration: 0.5, delay: 0.2 }}
                            className={`h-full ${statusColors[item.status]} rounded-full`}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </Card>
            </div>

            {/* Additional Stats */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Popular Time Slots */}
              <Card variant="elevated" className="p-6">
                <h3 className="text-lg font-semibold text-dark-900 mb-4">Popular Time Slots</h3>
                {stats.topTimeSlots.length > 0 ? (
                  <div className="space-y-3">
                    {stats.topTimeSlots.map((slot, idx) => (
                      <div
                        key={slot.time}
                        className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl"
                      >
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm ${
                          idx === 0 ? 'bg-primary-500 text-white' :
                          idx === 1 ? 'bg-primary-100 text-primary-700' :
                          'bg-gray-200 text-dark-600'
                        }`}>
                          {idx + 1}
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-dark-900">{formatTime(slot.time)}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-dark-900">{slot.count}</p>
                          <p className="text-xs text-dark-400">bookings</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-dark-500 text-center py-8">No time slot data available</p>
                )}
              </Card>

              {/* Quick Stats */}
              <Card variant="elevated" className="p-6">
                <h3 className="text-lg font-semibold text-dark-900 mb-4">Performance Overview</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-green-50 rounded-xl">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                        <UserCheck className="w-5 h-5 text-green-600" />
                      </div>
                      <div>
                        <p className="text-sm text-dark-500">Completion Rate</p>
                        <p className="text-lg font-bold text-dark-900">
                          {stats.totalBookings > 0 
                            ? Math.round((stats.confirmedBookings / stats.totalBookings) * 100) 
                            : 0}%
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between p-4 bg-red-50 rounded-xl">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                        <XCircle className="w-5 h-5 text-red-600" />
                      </div>
                      <div>
                        <p className="text-sm text-dark-500">Cancellation Rate</p>
                        <p className="text-lg font-bold text-dark-900">
                          {stats.totalBookings > 0 
                            ? Math.round((stats.cancelledBookings / stats.totalBookings) * 100) 
                            : 0}%
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gray-200 rounded-lg flex items-center justify-center">
                        <Clock className="w-5 h-5 text-gray-600" />
                      </div>
                      <div>
                        <p className="text-sm text-dark-500">No-Show Rate</p>
                        <p className="text-lg font-bold text-dark-900">
                          {stats.totalBookings > 0 
                            ? Math.round((stats.noShowBookings / stats.totalBookings) * 100) 
                            : 0}%
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
};

export default AnalyticsPage;
