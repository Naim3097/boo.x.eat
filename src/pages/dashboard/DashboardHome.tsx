import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Calendar,
  TrendingUp,
  Users,
  DollarSign,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  CalendarCheck,
  AlertCircle,
  Copy,
  Check,
  ExternalLink,
  CalendarOff,
  Loader2,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { Card, CardContent, Button, Badge } from '../../components/ui';
import { supabase } from '../../lib/supabase';
import type { Booking } from '../../types/database';

interface StatCardProps {
  title: string;
  value: string;
  change: string;
  changeType: 'positive' | 'negative' | 'neutral';
  icon: React.ComponentType<{ className?: string }>;
  isLoading?: boolean;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, change, changeType, icon: Icon, isLoading }) => (
  <Card variant="elevated" className="p-6">
    <div className="flex items-start justify-between">
      <div>
        <p className="text-sm text-dark-500 mb-1">{title}</p>
        {isLoading ? (
          <div className="h-8 w-16 bg-gray-200 rounded animate-pulse" />
        ) : (
          <p className="text-2xl font-bold text-dark-900">{value}</p>
        )}
        <div className={`flex items-center gap-1 mt-2 text-sm ${
          changeType === 'positive' ? 'text-green-600' :
          changeType === 'negative' ? 'text-red-600' : 'text-dark-400'
        }`}>
          {changeType === 'positive' ? (
            <ArrowUpRight className="w-4 h-4" />
          ) : changeType === 'negative' ? (
            <ArrowDownRight className="w-4 h-4" />
          ) : null}
          {change}
        </div>
      </div>
      <div className="w-12 h-12 rounded-2xl bg-primary-50 flex items-center justify-center">
        <Icon className="w-6 h-6 text-primary-600" />
      </div>
    </div>
  </Card>
);

export const DashboardHome: React.FC = () => {
  const { vendor } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [stats, setStats] = useState({
    totalBookings: 0,
    totalGuests: 0,
    avgPartySize: 0,
    pendingCount: 0,
  });
  const [linkCopied, setLinkCopied] = useState(false);

  // Fetch real data
  useEffect(() => {
    if (vendor) {
      fetchDashboardData();
    }
  }, [vendor]);

  const fetchDashboardData = async () => {
    if (!vendor) return;
    
    setIsLoading(true);
    try {
      // Fetch bookings for this month
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);
      
      const { data } = await supabase
        .from('bookings')
        .select('*')
        .eq('vendor_id', vendor.id)
        .gte('booking_date', startOfMonth.toISOString().split('T')[0])
        .order('booking_date', { ascending: true })
        .order('booking_time', { ascending: true });
      
      if (data) {
        setBookings(data);
        
        const totalGuests = data.reduce((sum, b) => sum + b.party_size, 0);
        setStats({
          totalBookings: data.length,
          totalGuests,
          avgPartySize: data.length > 0 ? totalGuests / data.length : 0,
          pendingCount: data.filter(b => b.status === 'pending').length,
        });
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Get upcoming bookings (today and tomorrow)
  const getUpcomingBookings = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dayAfter = new Date(tomorrow);
    dayAfter.setDate(dayAfter.getDate() + 1);
    
    return bookings
      .filter(b => {
        const bookingDate = new Date(b.booking_date);
        return bookingDate >= today && bookingDate < dayAfter && 
               (b.status === 'confirmed' || b.status === 'pending');
      })
      .slice(0, 5);
  };

  // Format time
  const formatTime = (timeStr: string) => {
    const [hours, minutes] = timeStr.split(':');
    const h = parseInt(hours);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const hour = h % 12 || 12;
    return `${hour}:${minutes} ${ampm}`;
  };

  // Get relative date label
  const getDateLabel = (dateStr: string) => {
    const date = new Date(dateStr);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    if (date.toDateString() === today.toDateString()) return 'Today';
    if (date.toDateString() === tomorrow.toDateString()) return 'Tomorrow';
    return date.toLocaleDateString('en-MY', { weekday: 'short', day: 'numeric', month: 'short' });
  };

  // Copy booking link
  const copyBookingLink = async () => {
    const link = `${window.location.origin}/${vendor?.slug || 'your-restaurant'}`;
    try {
      await navigator.clipboard.writeText(link);
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const upcomingBookings = getUpcomingBookings();
  const statsData = [
    { title: 'Total Bookings', value: stats.totalBookings.toString(), change: 'This month', changeType: 'neutral' as const, icon: Calendar },
    { title: 'Pending', value: stats.pendingCount.toString(), change: 'Needs attention', changeType: stats.pendingCount > 0 ? 'negative' as const : 'neutral' as const, icon: Clock },
    { title: 'Total Guests', value: stats.totalGuests.toString(), change: 'This month', changeType: 'neutral' as const, icon: Users },
    { title: 'Avg. Party Size', value: stats.avgPartySize.toFixed(1), change: 'Per booking', changeType: 'neutral' as const, icon: TrendingUp },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Welcome section */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-dark-900">
              Welcome back, {vendor?.name || 'there'}! 👋
            </h1>
            <p className="text-dark-500 mt-1">
              Here's what's happening with your restaurant today.
            </p>
          </div>
          <Button variant="primary" onClick={() => navigate('/dashboard/bookings')}>
            <Calendar className="w-4 h-4 mr-2" />
            View All Bookings
          </Button>
        </div>

        {/* Setup alert for new users */}
        {(!vendor?.description || !vendor?.phone) && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3"
          >
            <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-medium text-amber-800">Complete your profile</p>
              <p className="text-sm text-amber-700 mt-1">
                Add your restaurant details, menu, and business hours to start receiving bookings.
              </p>
              <Button 
                variant="ghost" 
                size="sm" 
                className="mt-2 text-amber-700 hover:text-amber-800"
                onClick={() => navigate('/dashboard/settings')}
              >
                Complete Setup →
              </Button>
            </div>
          </motion.div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {statsData.map((stat, index) => (
            <motion.div
              key={stat.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <StatCard {...stat} isLoading={isLoading} />
            </motion.div>
          ))}
        </div>

        {/* Main content grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Upcoming Bookings */}
          <div className="lg:col-span-2">
            <Card variant="elevated" className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-dark-900">Upcoming Bookings</h2>
                <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard/bookings')}>
                  View All
                </Button>
              </div>
              
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 text-primary-500 animate-spin" />
                </div>
              ) : (
                <div className="space-y-3">
                  {upcomingBookings.map((booking) => (
                    <div
                      key={booking.id}
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors cursor-pointer"
                      onClick={() => navigate('/dashboard/bookings')}
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center">
                          <span className="text-primary-700 font-semibold">
                            {booking.customer_name.charAt(0)}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium text-dark-900">{booking.customer_name}</p>
                          <p className="text-sm text-dark-400">
                            {booking.party_size} guests • {getDateLabel(booking.booking_date)} at {formatTime(booking.booking_time)}
                          </p>
                        </div>
                      </div>
                      <Badge variant={booking.status === 'confirmed' ? 'primary' : 'outline'}>
                        {booking.status === 'confirmed' ? (
                          <><CalendarCheck className="w-3 h-3 mr-1" /> Confirmed</>
                        ) : (
                          <><Clock className="w-3 h-3 mr-1" /> Pending</>
                        )}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}

              {!isLoading && upcomingBookings.length === 0 && (
                <div className="text-center py-12 text-dark-400">
                  <Calendar className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No upcoming bookings</p>
                  <Button 
                    variant="primary" 
                    size="sm" 
                    className="mt-4"
                    onClick={() => navigate('/dashboard/bookings')}
                  >
                    Create Booking
                  </Button>
                </div>
              )}
            </Card>
          </div>

          {/* Quick Actions & Plan Info Column */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <Card variant="elevated" className="p-6">
              <h2 className="text-lg font-semibold text-dark-900 mb-4">Quick Actions</h2>
              <div className="space-y-3">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full justify-start"
                  onClick={() => navigate('/dashboard/menu')}
                >
                  <DollarSign className="w-4 h-4 mr-2" />
                  Manage Menu
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full justify-start"
                  onClick={() => navigate('/dashboard/time-slots')}
                >
                  <Clock className="w-4 h-4 mr-2" />
                  Set Time Slots
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full justify-start"
                  onClick={() => navigate('/dashboard/blocked-dates')}
                >
                  <CalendarOff className="w-4 h-4 mr-2" />
                  Block Dates
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full justify-start"
                  onClick={copyBookingLink}
                >
                  {linkCopied ? (
                    <><Check className="w-4 h-4 mr-2 text-green-500" /> Copied!</>
                  ) : (
                    <><Copy className="w-4 h-4 mr-2" /> Copy Booking Link</>
                  )}
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full justify-start"
                  onClick={() => window.open(`/${vendor?.slug || ''}`, '_blank')}
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  View Public Page
                </Button>
              </div>
            </Card>

            {/* Plan Info */}
            <Card variant="elevated" className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-dark-900">Your Plan</h2>
                <Badge variant="primary">Starter</Badge>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-dark-500">Bookings this month</span>
                  <span className="font-medium text-dark-900">{stats.totalBookings} / 50</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-primary-500 h-2 rounded-full transition-all" 
                    style={{ width: `${Math.min((stats.totalBookings / 50) * 100, 100)}%` }} 
                  />
                </div>
                <p className="text-xs text-dark-400">
                  {Math.max(50 - stats.totalBookings, 0)} bookings remaining this month
                </p>
              </div>
              <Button 
                variant="accent" 
                size="sm" 
                className="w-full mt-4"
                onClick={() => window.open('https://booxeat.com/pricing', '_blank')}
              >
                Upgrade to Pro
              </Button>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default DashboardHome;
