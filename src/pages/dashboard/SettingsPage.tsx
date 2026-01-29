import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Store,
  MapPin,
  Phone,
  Mail,
  Clock,
  Globe,
  Camera,
  Save,
  Loader2,
  Check,
  AlertCircle,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { Card, CardContent, Button, Badge } from '../../components/ui';
import { supabase } from '../../lib/supabase';
import type { VendorUpdate, BusinessHours } from '../../types/database';

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] as const;
const CUISINE_TYPES = [
  'Malaysian', 'Chinese', 'Indian', 'Japanese', 'Korean', 'Thai', 'Vietnamese',
  'Western', 'Italian', 'Mexican', 'Middle Eastern', 'Fusion', 'Cafe', 'Bakery', 'Other'
];

export const SettingsPage: React.FC = () => {
  const { vendor, refreshVendor } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'profile' | 'hours' | 'booking'>('profile');

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    cuisine_type: '',
    email: '',
    phone: '',
    whatsapp: '',
    address: '',
    city: '',
    state: '',
    postal_code: '',
  });

  const [businessHours, setBusinessHours] = useState<BusinessHours>({
    monday: { open: '09:00', close: '22:00', closed: false },
    tuesday: { open: '09:00', close: '22:00', closed: false },
    wednesday: { open: '09:00', close: '22:00', closed: false },
    thursday: { open: '09:00', close: '22:00', closed: false },
    friday: { open: '09:00', close: '22:00', closed: false },
    saturday: { open: '09:00', close: '22:00', closed: false },
    sunday: { open: '09:00', close: '22:00', closed: true },
  });

  const [bookingSettings, setBookingSettings] = useState({
    max_party_size: 20,
    min_party_size: 1,
    booking_lead_time_hours: 2,
    booking_window_days: 30,
    slot_duration_minutes: 60,
    tables_count: 10,
    deposit_required: false,
    deposit_amount: 0,
  });

  // Load vendor data
  useEffect(() => {
    if (vendor) {
      setFormData({
        name: vendor.name || '',
        slug: vendor.slug || '',
        description: vendor.description || '',
        cuisine_type: vendor.cuisine_type || '',
        email: vendor.email || '',
        phone: vendor.phone || '',
        whatsapp: vendor.whatsapp || '',
        address: vendor.address || '',
        city: vendor.city || '',
        state: vendor.state || '',
        postal_code: vendor.postal_code || '',
      });
      
      if (vendor.business_hours) {
        setBusinessHours(vendor.business_hours as unknown as BusinessHours);
      }
      
      setBookingSettings({
        max_party_size: vendor.max_party_size,
        min_party_size: vendor.min_party_size,
        booking_lead_time_hours: vendor.booking_lead_time_hours,
        booking_window_days: vendor.booking_window_days,
        slot_duration_minutes: vendor.slot_duration_minutes,
        tables_count: vendor.tables_count,
        deposit_required: vendor.deposit_required,
        deposit_amount: vendor.deposit_amount || 0,
      });
    }
  }, [vendor]);

  const handleSave = async () => {
    if (!vendor) {
      setError('No vendor profile found. Please refresh the page.');
      return;
    }
    
    setIsLoading(true);
    setError('');
    setIsSaved(false);

    try {
      const updateData: VendorUpdate = {
        ...formData,
        business_hours: businessHours as unknown as VendorUpdate['business_hours'],
        ...bookingSettings,
      };

      console.log('Saving vendor settings:', updateData);
      console.log('Vendor ID:', vendor.id);

      const { data, error: updateError } = await supabase
        .from('vendors')
        .update(updateData)
        .eq('id', vendor.id)
        .select();

      console.log('Update result:', { data, updateError });

      if (updateError) {
        console.error('Update error details:', updateError);
        throw updateError;
      }

      if (!data || data.length === 0) {
        throw new Error('Update failed - no rows returned. Please check permissions.');
      }

      await refreshVendor();
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to save settings');
    } finally {
      setIsLoading(false);
    }
  };

  const tabs = [
    { id: 'profile', label: 'Profile', icon: Store },
    { id: 'hours', label: 'Business Hours', icon: Clock },
    { id: 'booking', label: 'Booking Settings', icon: Globe },
  ] as const;

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-dark-900">Settings</h1>
            <p className="text-dark-500 mt-1">
              Manage your restaurant profile and booking preferences
            </p>
          </div>
          <Button
            variant="primary"
            onClick={handleSave}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : isSaved ? (
              <>
                <Check className="w-4 h-4 mr-2" />
                Saved!
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Save Changes
              </>
            )}
          </Button>
        </div>

        {/* Error Message */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl flex items-center gap-2"
          >
            <AlertCircle className="w-5 h-5" />
            {error}
          </motion.div>
        )}

        {/* Tabs */}
        <div className="flex gap-2 border-b border-gray-200 pb-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                activeTab === tab.id
                  ? 'bg-primary-50 text-primary-700 font-medium'
                  : 'text-dark-500 hover:bg-gray-100'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Profile Tab */}
        {activeTab === 'profile' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* Basic Info */}
            <Card variant="elevated" className="p-6">
              <h2 className="text-lg font-semibold text-dark-900 mb-4">Basic Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-dark-700 mb-2">
                    Restaurant Name *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="Kedai Kakros"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-dark-700 mb-2">
                    URL Slug *
                  </label>
                  <div className="flex items-center">
                    <span className="px-4 py-3 bg-gray-100 border border-r-0 border-gray-200 rounded-l-xl text-dark-400 text-sm">
                      booxeat.com/
                    </span>
                    <input
                      type="text"
                      value={formData.slug}
                      onChange={(e) => setFormData({ ...formData, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') })}
                      className="flex-1 px-4 py-3 border border-gray-200 rounded-r-xl focus:outline-none focus:ring-2 focus:ring-primary-500"
                      placeholder="kedaikakros"
                    />
                  </div>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-dark-700 mb-2">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="Tell customers about your restaurant..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-dark-700 mb-2">
                    Cuisine Type
                  </label>
                  <select
                    value={formData.cuisine_type}
                    onChange={(e) => setFormData({ ...formData, cuisine_type: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="">Select cuisine type</option>
                    {CUISINE_TYPES.map((type) => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>
              </div>
            </Card>

            {/* Contact Info */}
            <Card variant="elevated" className="p-6">
              <h2 className="text-lg font-semibold text-dark-900 mb-4">Contact Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-dark-700 mb-2">
                    <Mail className="w-4 h-4 inline mr-1" />
                    Email
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="hello@restaurant.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-dark-700 mb-2">
                    <Phone className="w-4 h-4 inline mr-1" />
                    Phone
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="+60 12-345 6789"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-dark-700 mb-2">
                    WhatsApp
                  </label>
                  <input
                    type="tel"
                    value={formData.whatsapp}
                    onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="+60 12-345 6789"
                  />
                </div>
              </div>
            </Card>

            {/* Address */}
            <Card variant="elevated" className="p-6">
              <h2 className="text-lg font-semibold text-dark-900 mb-4">
                <MapPin className="w-5 h-5 inline mr-2" />
                Location
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-dark-700 mb-2">
                    Address
                  </label>
                  <input
                    type="text"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="123 Jalan Makan, Taman Sedap"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-dark-700 mb-2">
                    City
                  </label>
                  <input
                    type="text"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="Kuala Lumpur"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-dark-700 mb-2">
                    State
                  </label>
                  <input
                    type="text"
                    value={formData.state}
                    onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="Wilayah Persekutuan"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-dark-700 mb-2">
                    Postal Code
                  </label>
                  <input
                    type="text"
                    value={formData.postal_code}
                    onChange={(e) => setFormData({ ...formData, postal_code: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="50000"
                  />
                </div>
              </div>
            </Card>
          </motion.div>
        )}

        {/* Business Hours Tab */}
        {activeTab === 'hours' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card variant="elevated" className="p-6">
              <h2 className="text-lg font-semibold text-dark-900 mb-4">Business Hours</h2>
              <div className="space-y-4">
                {DAYS.map((day) => (
                  <div
                    key={day}
                    className={`flex items-center gap-4 p-4 rounded-xl ${
                      businessHours[day].closed ? 'bg-gray-50' : 'bg-primary-50/30'
                    }`}
                  >
                    <div className="w-24">
                      <span className="font-medium text-dark-900 capitalize">{day}</span>
                    </div>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={!businessHours[day].closed}
                        onChange={(e) => setBusinessHours({
                          ...businessHours,
                          [day]: { ...businessHours[day], closed: !e.target.checked }
                        })}
                        className="w-5 h-5 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                      />
                      <span className="text-sm text-dark-500">Open</span>
                    </label>
                    {!businessHours[day].closed && (
                      <>
                        <input
                          type="time"
                          value={businessHours[day].open}
                          onChange={(e) => setBusinessHours({
                            ...businessHours,
                            [day]: { ...businessHours[day], open: e.target.value }
                          })}
                          className="px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                        />
                        <span className="text-dark-400">to</span>
                        <input
                          type="time"
                          value={businessHours[day].close}
                          onChange={(e) => setBusinessHours({
                            ...businessHours,
                            [day]: { ...businessHours[day], close: e.target.value }
                          })}
                          className="px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                        />
                      </>
                    )}
                    {businessHours[day].closed && (
                      <Badge variant="outline">Closed</Badge>
                    )}
                  </div>
                ))}
              </div>
            </Card>
          </motion.div>
        )}

        {/* Booking Settings Tab */}
        {activeTab === 'booking' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <Card variant="elevated" className="p-6">
              <h2 className="text-lg font-semibold text-dark-900 mb-4">Booking Preferences</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-dark-700 mb-2">
                    Minimum Party Size
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={bookingSettings.min_party_size}
                    onChange={(e) => setBookingSettings({ ...bookingSettings, min_party_size: parseInt(e.target.value) || 1 })}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-dark-700 mb-2">
                    Maximum Party Size
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={bookingSettings.max_party_size}
                    onChange={(e) => setBookingSettings({ ...bookingSettings, max_party_size: parseInt(e.target.value) || 20 })}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-dark-700 mb-2">
                    Booking Lead Time (hours)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={bookingSettings.booking_lead_time_hours}
                    onChange={(e) => setBookingSettings({ ...bookingSettings, booking_lead_time_hours: parseInt(e.target.value) || 0 })}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                  <p className="text-xs text-dark-400 mt-1">How far in advance customers must book</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-dark-700 mb-2">
                    Booking Window (days)
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={bookingSettings.booking_window_days}
                    onChange={(e) => setBookingSettings({ ...bookingSettings, booking_window_days: parseInt(e.target.value) || 30 })}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                  <p className="text-xs text-dark-400 mt-1">How far ahead customers can book</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-dark-700 mb-2">
                    Slot Duration (minutes)
                  </label>
                  <select
                    value={bookingSettings.slot_duration_minutes}
                    onChange={(e) => setBookingSettings({ ...bookingSettings, slot_duration_minutes: parseInt(e.target.value) })}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value={30}>30 minutes</option>
                    <option value={60}>1 hour</option>
                    <option value={90}>1.5 hours</option>
                    <option value={120}>2 hours</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-dark-700 mb-2">
                    Number of Tables
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={bookingSettings.tables_count}
                    onChange={(e) => setBookingSettings({ ...bookingSettings, tables_count: parseInt(e.target.value) || 10 })}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              </div>
            </Card>

            <Card variant="elevated" className="p-6">
              <h2 className="text-lg font-semibold text-dark-900 mb-4">Deposit Settings</h2>
              <div className="space-y-4">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={bookingSettings.deposit_required}
                    onChange={(e) => setBookingSettings({ ...bookingSettings, deposit_required: e.target.checked })}
                    className="w-5 h-5 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                  <div>
                    <span className="font-medium text-dark-900">Require deposit for bookings</span>
                    <p className="text-sm text-dark-400">Customers will pay a deposit when booking</p>
                  </div>
                </label>
                
                {bookingSettings.deposit_required && (
                  <div className="ml-8">
                    <label className="block text-sm font-medium text-dark-700 mb-2">
                      Deposit Amount (RM)
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={bookingSettings.deposit_amount}
                      onChange={(e) => setBookingSettings({ ...bookingSettings, deposit_amount: parseFloat(e.target.value) || 0 })}
                      className="w-48 px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500"
                      placeholder="50.00"
                    />
                  </div>
                )}
              </div>
            </Card>
          </motion.div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default SettingsPage;
