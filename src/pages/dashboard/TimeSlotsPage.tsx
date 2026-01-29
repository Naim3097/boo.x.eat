import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Clock,
  Plus,
  Trash2,
  Save,
  Loader2,
  AlertCircle,
  Check,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { Card, Button, Badge } from '../../components/ui';
import { timeSlotsDb } from '../../lib/database';

interface TimeSlot {
  id: string;
  vendor_id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  max_bookings: number;
  is_active: boolean;
}

interface DaySlots {
  dayOfWeek: number;
  slots: { start: string; end: string; maxBookings: number }[];
}

const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

// Generate time options from 00:00 to 23:30 in 30-minute intervals
const timeOptions: string[] = [];
for (let h = 0; h < 24; h++) {
  for (let m = 0; m < 60; m += 30) {
    timeOptions.push(`${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`);
  }
}

export const TimeSlotsPage: React.FC = () => {
  const { vendor } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [daySlots, setDaySlots] = useState<DaySlots[]>(
    dayNames.map((_, idx) => ({ dayOfWeek: idx, slots: [] }))
  );

  // Fetch existing time slots
  useEffect(() => {
    if (vendor) {
      fetchTimeSlots();
    }
  }, [vendor]);

  const fetchTimeSlots = async () => {
    if (!vendor) return;
    
    setIsLoading(true);
    try {
      const { data } = await timeSlotsDb.getByVendor(vendor.id);
      
      if (data) {
        // Group slots by day
        const grouped: DaySlots[] = dayNames.map((_, idx) => ({
          dayOfWeek: idx,
          slots: [],
        }));
        
        (data as TimeSlot[]).forEach((slot) => {
          grouped[slot.day_of_week].slots.push({
            start: slot.start_time,
            end: slot.end_time,
            maxBookings: slot.max_bookings,
          });
        });
        
        setDaySlots(grouped);
      }
    } catch (error) {
      console.error('Error fetching time slots:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Add a slot to a day
  const addSlot = (dayOfWeek: number) => {
    setDaySlots((prev) =>
      prev.map((day) =>
        day.dayOfWeek === dayOfWeek
          ? {
              ...day,
              slots: [...day.slots, { start: '09:00', end: '10:00', maxBookings: 5 }],
            }
          : day
      )
    );
  };

  // Remove a slot from a day
  const removeSlot = (dayOfWeek: number, slotIndex: number) => {
    setDaySlots((prev) =>
      prev.map((day) =>
        day.dayOfWeek === dayOfWeek
          ? {
              ...day,
              slots: day.slots.filter((_, idx) => idx !== slotIndex),
            }
          : day
      )
    );
  };

  // Update a slot
  const updateSlot = (
    dayOfWeek: number,
    slotIndex: number,
    field: 'start' | 'end' | 'maxBookings',
    value: string | number
  ) => {
    setDaySlots((prev) =>
      prev.map((day) =>
        day.dayOfWeek === dayOfWeek
          ? {
              ...day,
              slots: day.slots.map((slot, idx) =>
                idx === slotIndex ? { ...slot, [field]: value } : slot
              ),
            }
          : day
      )
    );
  };

  // Copy slots from one day to another
  const copySlots = (fromDay: number, toDay: number) => {
    const sourceSlots = daySlots.find((d) => d.dayOfWeek === fromDay)?.slots || [];
    setDaySlots((prev) =>
      prev.map((day) =>
        day.dayOfWeek === toDay
          ? { ...day, slots: [...sourceSlots] }
          : day
      )
    );
  };

  // Apply slots to all weekdays
  const applyToWeekdays = (fromDay: number) => {
    const sourceSlots = daySlots.find((d) => d.dayOfWeek === fromDay)?.slots || [];
    setDaySlots((prev) =>
      prev.map((day) =>
        [1, 2, 3, 4, 5].includes(day.dayOfWeek)
          ? { ...day, slots: [...sourceSlots] }
          : day
      )
    );
  };

  // Save all time slots
  const saveTimeSlots = async () => {
    if (!vendor) return;
    
    setIsSaving(true);
    setSaveSuccess(false);
    
    try {
      // Delete all existing slots for this vendor
      for (let day = 0; day < 7; day++) {
        await timeSlotsDb.deleteByVendorAndDay(vendor.id, day);
      }
      
      // Insert new slots
      for (const day of daySlots) {
        for (const slot of day.slots) {
          await timeSlotsDb.create({
            vendor_id: vendor.id,
            day_of_week: day.dayOfWeek,
            start_time: slot.start,
            end_time: slot.end,
            max_bookings: slot.maxBookings,
            is_active: true,
          });
        }
      }
      
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (error) {
      console.error('Error saving time slots:', error);
    } finally {
      setIsSaving(false);
    }
  };

  // Format time for display
  const formatTime = (timeStr: string) => {
    const [hours, minutes] = timeStr.split(':');
    const h = parseInt(hours);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const hour = h % 12 || 12;
    return `${hour}:${minutes} ${ampm}`;
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-dark-900">Time Slots</h1>
            <p className="text-dark-500 mt-1">
              Configure your available booking times for each day
            </p>
          </div>
          <Button
            variant="primary"
            onClick={saveTimeSlots}
            disabled={isSaving}
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : saveSuccess ? (
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

        {/* Info Banner */}
        <Card variant="elevated" className="p-4 bg-blue-50 border-blue-200">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
            <div>
              <p className="text-sm text-blue-800">
                <strong>How it works:</strong> Customers will be able to select from these time slots when booking.
                Set the maximum number of bookings per slot to control capacity.
              </p>
            </div>
          </div>
        </Card>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
          </div>
        ) : (
          <div className="space-y-4">
            {daySlots.map((day) => (
              <Card key={day.dayOfWeek} variant="elevated" className="p-5">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <h3 className="text-lg font-semibold text-dark-900">
                      {dayNames[day.dayOfWeek]}
                    </h3>
                    <Badge variant={day.slots.length > 0 ? 'primary' : 'outline'}>
                      {day.slots.length} slot{day.slots.length !== 1 ? 's' : ''}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    {day.dayOfWeek > 0 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copySlots(day.dayOfWeek - 1, day.dayOfWeek)}
                        className="text-xs"
                      >
                        Copy from {dayNames[day.dayOfWeek - 1]}
                      </Button>
                    )}
                    {day.dayOfWeek >= 1 && day.dayOfWeek <= 5 && day.slots.length > 0 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => applyToWeekdays(day.dayOfWeek)}
                        className="text-xs"
                      >
                        Apply to Weekdays
                      </Button>
                    )}
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => addSlot(day.dayOfWeek)}
                    >
                      <Plus className="w-4 h-4 mr-1" />
                      Add Slot
                    </Button>
                  </div>
                </div>

                {day.slots.length === 0 ? (
                  <p className="text-dark-400 text-sm py-4 text-center">
                    No time slots configured. Click "Add Slot" to create booking times.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {day.slots.map((slot, slotIndex) => (
                      <motion.div
                        key={slotIndex}
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl"
                      >
                        <Clock className="w-5 h-5 text-dark-400" />
                        
                        <select
                          value={slot.start}
                          onChange={(e) => updateSlot(day.dayOfWeek, slotIndex, 'start', e.target.value)}
                          className="px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
                        >
                          {timeOptions.map((time) => (
                            <option key={time} value={time}>
                              {formatTime(time)}
                            </option>
                          ))}
                        </select>
                        
                        <span className="text-dark-500">to</span>
                        
                        <select
                          value={slot.end}
                          onChange={(e) => updateSlot(day.dayOfWeek, slotIndex, 'end', e.target.value)}
                          className="px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
                        >
                          {timeOptions.map((time) => (
                            <option key={time} value={time}>
                              {formatTime(time)}
                            </option>
                          ))}
                        </select>
                        
                        <div className="flex items-center gap-2 ml-4">
                          <span className="text-sm text-dark-500">Max bookings:</span>
                          <input
                            type="number"
                            min="1"
                            max="100"
                            value={slot.maxBookings}
                            onChange={(e) => updateSlot(day.dayOfWeek, slotIndex, 'maxBookings', parseInt(e.target.value) || 1)}
                            className="w-16 px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm text-center"
                          />
                        </div>
                        
                        <button
                          onClick={() => removeSlot(day.dayOfWeek, slotIndex)}
                          className="ml-auto p-2 text-dark-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </motion.div>
                    ))}
                  </div>
                )}
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default TimeSlotsPage;
