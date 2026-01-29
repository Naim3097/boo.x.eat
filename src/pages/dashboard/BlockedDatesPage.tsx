import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Calendar,
  Plus,
  Trash2,
  X,
  Loader2,
  AlertCircle,
  CalendarOff,
  Check,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { Card, Button, Badge } from '../../components/ui';
import { blockedDatesDb } from '../../lib/database';

interface BlockedDate {
  id: string;
  vendor_id: string;
  date: string;
  reason: string | null;
  is_full_day: boolean;
  blocked_start_time: string | null;
  blocked_end_time: string | null;
  created_at: string;
}

export const BlockedDatesPage: React.FC = () => {
  const { vendor } = useAuth();
  const [blockedDates, setBlockedDates] = useState<BlockedDate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  // Form state
  const [form, setForm] = useState({
    date: '',
    reason: '',
    isFullDay: true,
    startTime: '09:00',
    endTime: '17:00',
  });

  // Fetch blocked dates
  useEffect(() => {
    if (vendor) {
      fetchBlockedDates();
    }
  }, [vendor]);

  const fetchBlockedDates = async () => {
    if (!vendor) return;
    
    setIsLoading(true);
    try {
      const { data } = await blockedDatesDb.getByVendor(vendor.id);
      if (data) {
        setBlockedDates(data as BlockedDate[]);
      }
    } catch (error) {
      console.error('Error fetching blocked dates:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Add blocked date
  const addBlockedDate = async () => {
    if (!vendor || !form.date) return;
    
    setIsSaving(true);
    try {
      await blockedDatesDb.create({
        vendor_id: vendor.id,
        date: form.date,
        reason: form.reason || null,
        is_full_day: form.isFullDay,
        blocked_start_time: form.isFullDay ? null : form.startTime,
        blocked_end_time: form.isFullDay ? null : form.endTime,
      });
      
      await fetchBlockedDates();
      setIsModalOpen(false);
      resetForm();
    } catch (error) {
      console.error('Error adding blocked date:', error);
    } finally {
      setIsSaving(false);
    }
  };

  // Delete blocked date
  const deleteBlockedDate = async (id: string) => {
    if (!confirm('Are you sure you want to remove this blocked date?')) return;
    
    try {
      await blockedDatesDb.delete(id);
      await fetchBlockedDates();
    } catch (error) {
      console.error('Error deleting blocked date:', error);
    }
  };

  const resetForm = () => {
    setForm({
      date: '',
      reason: '',
      isFullDay: true,
      startTime: '09:00',
      endTime: '17:00',
    });
  };

  // Format date for display
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-MY', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
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

  // Check if date is in the past
  const isPastDate = (dateStr: string) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return new Date(dateStr) < today;
  };

  // Separate upcoming and past blocked dates
  const upcomingDates = blockedDates.filter((d) => !isPastDate(d.date));
  const pastDates = blockedDates.filter((d) => isPastDate(d.date));

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-dark-900">Blocked Dates</h1>
            <p className="text-dark-500 mt-1">
              Block specific dates for holidays, closures, or private events
            </p>
          </div>
          <Button variant="primary" onClick={() => setIsModalOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Block Date
          </Button>
        </div>

        {/* Info Banner */}
        <Card variant="elevated" className="p-4 bg-amber-50 border-amber-200">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5" />
            <div>
              <p className="text-sm text-amber-800">
                <strong>Note:</strong> Blocked dates will not be available for customer bookings.
                Existing bookings on blocked dates will need to be handled manually.
              </p>
            </div>
          </div>
        </Card>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
          </div>
        ) : upcomingDates.length === 0 && pastDates.length === 0 ? (
          <Card variant="elevated" className="p-12 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <CalendarOff className="w-8 h-8 text-dark-400" />
            </div>
            <h3 className="text-lg font-semibold text-dark-900 mb-2">No blocked dates</h3>
            <p className="text-dark-500 mb-4">
              All dates are currently available for bookings.
            </p>
            <Button variant="primary" onClick={() => setIsModalOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Block a Date
            </Button>
          </Card>
        ) : (
          <div className="space-y-6">
            {/* Upcoming Blocked Dates */}
            {upcomingDates.length > 0 && (
              <Card variant="elevated" className="p-5">
                <h3 className="text-lg font-semibold text-dark-900 mb-4">
                  Upcoming Blocked Dates
                </h3>
                <div className="space-y-3">
                  {upcomingDates.map((blockedDate) => (
                    <motion.div
                      key={blockedDate.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex items-center gap-4 p-4 bg-red-50 border border-red-100 rounded-xl"
                    >
                      <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
                        <CalendarOff className="w-6 h-6 text-red-600" />
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-dark-900">
                          {formatDate(blockedDate.date)}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          {blockedDate.is_full_day ? (
                            <Badge variant="outline" className="bg-white">Full Day</Badge>
                          ) : (
                            <Badge variant="outline" className="bg-white">
                              {formatTime(blockedDate.blocked_start_time!)} - {formatTime(blockedDate.blocked_end_time!)}
                            </Badge>
                          )}
                          {blockedDate.reason && (
                            <span className="text-sm text-dark-500">{blockedDate.reason}</span>
                          )}
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteBlockedDate(blockedDate.id)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-100"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </motion.div>
                  ))}
                </div>
              </Card>
            )}

            {/* Past Blocked Dates */}
            {pastDates.length > 0 && (
              <Card variant="elevated" className="p-5">
                <h3 className="text-lg font-semibold text-dark-500 mb-4">
                  Past Blocked Dates
                </h3>
                <div className="space-y-2">
                  {pastDates.slice(0, 5).map((blockedDate) => (
                    <div
                      key={blockedDate.id}
                      className="flex items-center gap-4 p-3 bg-gray-50 rounded-xl opacity-60"
                    >
                      <CalendarOff className="w-5 h-5 text-dark-400" />
                      <div className="flex-1">
                        <p className="text-dark-700">{formatDate(blockedDate.date)}</p>
                        {blockedDate.reason && (
                          <p className="text-sm text-dark-400">{blockedDate.reason}</p>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteBlockedDate(blockedDate.id)}
                        className="text-dark-400 hover:text-red-600"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                  {pastDates.length > 5 && (
                    <p className="text-sm text-dark-400 text-center py-2">
                      And {pastDates.length - 5} more past dates...
                    </p>
                  )}
                </div>
              </Card>
            )}
          </div>
        )}
      </div>

      {/* Add Blocked Date Modal */}
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
              className="bg-white rounded-2xl shadow-xl max-w-md w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                <h2 className="text-xl font-bold text-dark-900">Block a Date</h2>
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
                    Date *
                  </label>
                  <input
                    type="date"
                    value={form.date}
                    onChange={(e) => setForm({ ...form, date: e.target.value })}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-dark-700 mb-2">
                    Reason (optional)
                  </label>
                  <input
                    type="text"
                    value={form.reason}
                    onChange={(e) => setForm({ ...form, reason: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="e.g., Public Holiday, Private Event"
                  />
                </div>
                
                <div>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.isFullDay}
                      onChange={(e) => setForm({ ...form, isFullDay: e.target.checked })}
                      className="w-5 h-5 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                    />
                    <span className="text-dark-700">Block entire day</span>
                  </label>
                </div>
                
                {!form.isFullDay && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-dark-700 mb-2">
                        Start Time
                      </label>
                      <input
                        type="time"
                        value={form.startTime}
                        onChange={(e) => setForm({ ...form, startTime: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-dark-700 mb-2">
                        End Time
                      </label>
                      <input
                        type="time"
                        value={form.endTime}
                        onChange={(e) => setForm({ ...form, endTime: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500"
                      />
                    </div>
                  </div>
                )}
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
                  onClick={addBlockedDate}
                  disabled={isSaving || !form.date}
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4 mr-2" />
                      Block Date
                    </>
                  )}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </DashboardLayout>
  );
};

export default BlockedDatesPage;
