import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  Edit2,
  Trash2,
  Package,
  Calendar,
  Users,
  Clock,
  DollarSign,
  Image as ImageIcon,
  Loader2,
  Search,
  X,
  Check,
  Tag,
  Star,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { Card, Button, Badge } from '../../components/ui';
import { supabase } from '../../lib/supabase';
import type { Package as PackageType, PackageInsert, MenuItem } from '../../types/database';

export const PackagesPage: React.FC = () => {
  const { vendor } = useAuth();
  const [packages, setPackages] = useState<PackageType[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPackage, setEditingPackage] = useState<PackageType | null>(null);
  
  // Form state
  const [form, setForm] = useState({
    name: '',
    description: '',
    price: '',
    compare_price: '',
    min_pax: '1',
    max_pax: '10',
    is_available: true,
    is_featured: false,
    included_items: [] as string[], // menu item IDs
    valid_days: [0, 1, 2, 3, 4, 5, 6] as number[], // 0 = Sunday
  });
  
  const [isSaving, setIsSaving] = useState(false);

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // Fetch data
  useEffect(() => {
    if (vendor) {
      fetchData();
    }
  }, [vendor]);

  const fetchData = async () => {
    if (!vendor) return;
    
    setIsLoading(true);
    try {
      const [packagesRes, itemsRes] = await Promise.all([
        supabase
          .from('packages')
          .select('*')
          .eq('vendor_id', vendor.id)
          .order('created_at', { ascending: false }),
        supabase
          .from('menu_items')
          .select('*')
          .eq('vendor_id', vendor.id)
          .eq('is_available', true)
          .order('name', { ascending: true }),
      ]);
      
      if (packagesRes.data) setPackages(packagesRes.data);
      if (itemsRes.data) setMenuItems(itemsRes.data);
    } catch (error) {
      console.error('Error fetching packages:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Filter packages
  const filteredPackages = packages.filter((pkg) =>
    pkg.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    pkg.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Helper to check if package is active (handles both is_active and is_available)
  const isPackageActive = (pkg: PackageType) => pkg.is_active ?? pkg.is_available ?? true;

  // Open modal for create/edit
  const openModal = (pkg?: PackageType) => {
    if (pkg) {
      setEditingPackage(pkg);
      setForm({
        name: pkg.name,
        description: pkg.description || '',
        price: pkg.price.toString(),
        compare_price: pkg.compare_price?.toString() || '',
        min_pax: pkg.min_pax.toString(),
        max_pax: pkg.max_pax.toString(),
        is_available: pkg.is_available,
        is_featured: pkg.is_featured,
        included_items: pkg.included_items || [],
        valid_days: pkg.valid_days || [0, 1, 2, 3, 4, 5, 6],
      });
    } else {
      setEditingPackage(null);
      setForm({
        name: '',
        description: '',
        price: '',
        compare_price: '',
        min_pax: '1',
        max_pax: '10',
        is_available: true,
        is_featured: false,
        included_items: [],
        valid_days: [0, 1, 2, 3, 4, 5, 6],
      });
    }
    setIsModalOpen(true);
  };

  // Save package
  const savePackage = async () => {
    if (!vendor || !form.name || !form.price) return;
    
    setIsSaving(true);
    try {
      const packageData: PackageInsert = {
        vendor_id: vendor.id,
        name: form.name,
        description: form.description || null,
        price: parseFloat(form.price),
        compare_price: form.compare_price ? parseFloat(form.compare_price) : null,
        min_pax: parseInt(form.min_pax) || 1,
        max_pax: parseInt(form.max_pax) || 10,
        is_available: form.is_available,
        is_featured: form.is_featured,
        included_items: form.included_items.length > 0 ? form.included_items : null,
        valid_days: form.valid_days,
      };

      if (editingPackage) {
        await supabase
          .from('packages')
          .update(packageData)
          .eq('id', editingPackage.id);
      } else {
        await supabase
          .from('packages')
          .insert(packageData);
      }
      
      await fetchData();
      setIsModalOpen(false);
    } catch (error) {
      console.error('Error saving package:', error);
    } finally {
      setIsSaving(false);
    }
  };

  // Delete package
  const deletePackage = async (id: string) => {
    if (!confirm('Are you sure you want to delete this package?')) return;
    
    try {
      await supabase.from('packages').delete().eq('id', id);
      await fetchData();
    } catch (error) {
      console.error('Error deleting package:', error);
    }
  };

  // Toggle package availability
  const toggleAvailability = async (pkg: PackageType) => {
    try {
      await supabase
        .from('packages')
        .update({ is_available: !pkg.is_available })
        .eq('id', pkg.id);
      await fetchData();
    } catch (error) {
      console.error('Error toggling availability:', error);
    }
  };

  // Toggle day in valid_days
  const toggleDay = (day: number) => {
    setForm(prev => ({
      ...prev,
      valid_days: prev.valid_days.includes(day)
        ? prev.valid_days.filter(d => d !== day)
        : [...prev.valid_days, day].sort(),
    }));
  };

  // Toggle menu item in included_items
  const toggleMenuItem = (itemId: string) => {
    setForm(prev => ({
      ...prev,
      included_items: prev.included_items.includes(itemId)
        ? prev.included_items.filter(id => id !== itemId)
        : [...prev.included_items, itemId],
    }));
  };

  // Get included items count for a package
  const getIncludedItemsDisplay = (pkg: PackageType) => {
    if (!pkg.included_items || pkg.included_items.length === 0) return null;
    return pkg.included_items.length;
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-dark-900">Packages</h1>
            <p className="text-dark-500 mt-1">
              Create special deals and set menus for your customers
            </p>
          </div>
          <Button variant="primary" onClick={() => openModal()}>
            <Plus className="w-4 h-4 mr-2" />
            Create Package
          </Button>
        </div>

        {/* Search */}
        <Card variant="elevated" className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search packages..."
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
        </Card>

        {/* Packages Grid */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
          </div>
        ) : filteredPackages.length === 0 ? (
          <Card variant="elevated" className="p-12 text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-primary-100 to-accent-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Package className="w-8 h-8 text-primary-600" />
            </div>
            <h3 className="text-lg font-semibold text-dark-900 mb-2">No packages yet</h3>
            <p className="text-dark-500 mb-4">
              Create your first package to offer special deals and set menus.
            </p>
            <Button variant="primary" onClick={() => openModal()}>
              <Plus className="w-4 h-4 mr-2" />
              Create First Package
            </Button>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredPackages.map((pkg) => (
              <motion.div
                key={pkg.id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <Card
                  variant="elevated"
                  className={`p-5 h-full flex flex-col ${!pkg.is_available ? 'opacity-60' : ''}`}
                >
                  {/* Header */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-accent-500 rounded-xl flex items-center justify-center">
                        <Package className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-dark-900">{pkg.name}</h3>
                        {pkg.is_featured && (
                          <Badge variant="primary" size="sm" className="mt-0.5">
                            <Star className="w-3 h-3 mr-1" />
                            Featured
                          </Badge>
                        )}
                      </div>
                    </div>
                    {!pkg.is_available && (
                      <Badge variant="outline" className="bg-white">
                        Unavailable
                      </Badge>
                    )}
                  </div>

                  {/* Description */}
                  {pkg.description && (
                    <p className="text-sm text-dark-500 mb-4 line-clamp-2">{pkg.description}</p>
                  )}

                  {/* Details */}
                  <div className="space-y-2 mb-4 flex-1">
                    <div className="flex items-center gap-2 text-sm">
                      <DollarSign className="w-4 h-4 text-dark-400" />
                      <span className="text-dark-700">
                        <span className="font-bold text-primary-600">RM {pkg.price.toFixed(2)}</span>
                        {pkg.compare_price && pkg.compare_price > pkg.price && (
                          <span className="text-dark-400 line-through ml-2">
                            RM {pkg.compare_price.toFixed(2)}
                          </span>
                        )}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Users className="w-4 h-4 text-dark-400" />
                      <span className="text-dark-700">
                        {pkg.min_pax} - {pkg.max_pax} pax
                      </span>
                    </div>
                    {getIncludedItemsDisplay(pkg) && (
                      <div className="flex items-center gap-2 text-sm">
                        <Tag className="w-4 h-4 text-dark-400" />
                        <span className="text-dark-700">
                          {getIncludedItemsDisplay(pkg)} items included
                        </span>
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="w-4 h-4 text-dark-400" />
                      <div className="flex gap-1">
                        {dayNames.map((day, idx) => (
                          <span
                            key={day}
                            className={`w-6 h-6 flex items-center justify-center text-xs rounded ${
                              pkg.valid_days?.includes(idx)
                                ? 'bg-primary-100 text-primary-700 font-medium'
                                : 'bg-gray-100 text-dark-400'
                            }`}
                          >
                            {day[0]}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 pt-4 border-t border-gray-100">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="flex-1"
                      onClick={() => toggleAvailability(pkg)}
                    >
                      {pkg.is_available ? 'Mark Unavailable' : 'Mark Available'}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openModal(pkg)}
                    >
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deletePackage(pkg.id)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Package Modal */}
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
              className="bg-white rounded-2xl shadow-xl max-w-xl w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white z-10">
                <h2 className="text-xl font-bold text-dark-900">
                  {editingPackage ? 'Edit Package' : 'Create New Package'}
                </h2>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  <X className="w-5 h-5 text-dark-500" />
                </button>
              </div>
              
              <div className="p-6 space-y-5">
                {/* Basic Info */}
                <div>
                  <label className="block text-sm font-medium text-dark-700 mb-2">
                    Package Name *
                  </label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="Family Feast Bundle"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-dark-700 mb-2">
                    Description
                  </label>
                  <textarea
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    rows={2}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="Perfect for family gatherings with a mix of our best dishes..."
                  />
                </div>
                
                {/* Pricing */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-dark-700 mb-2">
                      Price (RM) *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={form.price}
                      onChange={(e) => setForm({ ...form, price: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500"
                      placeholder="99.00"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-dark-700 mb-2">
                      Compare Price (RM)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={form.compare_price}
                      onChange={(e) => setForm({ ...form, compare_price: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500"
                      placeholder="120.00"
                    />
                  </div>
                </div>
                
                {/* Party Size */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-dark-700 mb-2">
                      Minimum Pax
                    </label>
                    <input
                      type="number"
                      value={form.min_pax}
                      onChange={(e) => setForm({ ...form, min_pax: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500"
                      placeholder="2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-dark-700 mb-2">
                      Maximum Pax
                    </label>
                    <input
                      type="number"
                      value={form.max_pax}
                      onChange={(e) => setForm({ ...form, max_pax: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500"
                      placeholder="10"
                    />
                  </div>
                </div>
                
                {/* Valid Days */}
                <div>
                  <label className="block text-sm font-medium text-dark-700 mb-2">
                    Available Days
                  </label>
                  <div className="flex gap-2">
                    {dayNames.map((day, idx) => (
                      <button
                        key={day}
                        type="button"
                        onClick={() => toggleDay(idx)}
                        className={`w-10 h-10 rounded-lg font-medium transition-colors ${
                          form.valid_days.includes(idx)
                            ? 'bg-primary-500 text-white'
                            : 'bg-gray-100 text-dark-500 hover:bg-gray-200'
                        }`}
                      >
                        {day}
                      </button>
                    ))}
                  </div>
                </div>
                
                {/* Included Items */}
                {menuItems.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-dark-700 mb-2">
                      Included Menu Items
                    </label>
                    <div className="max-h-48 overflow-y-auto border border-gray-200 rounded-xl p-2 space-y-1">
                      {menuItems.map((item) => (
                        <label
                          key={item.id}
                          className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors ${
                            form.included_items.includes(item.id)
                              ? 'bg-primary-50'
                              : 'hover:bg-gray-50'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={form.included_items.includes(item.id)}
                            onChange={() => toggleMenuItem(item.id)}
                            className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                          />
                          <span className="flex-1 text-dark-700">{item.name}</span>
                          <span className="text-sm text-dark-400">
                            RM {item.price.toFixed(2)}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Options */}
                <div className="space-y-3">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.is_available}
                      onChange={(e) => setForm({ ...form, is_available: e.target.checked })}
                      className="w-5 h-5 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                    />
                    <span className="text-dark-700">Available for booking</span>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.is_featured}
                      onChange={(e) => setForm({ ...form, is_featured: e.target.checked })}
                      className="w-5 h-5 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                    />
                    <span className="text-dark-700">Featured package</span>
                  </label>
                </div>
              </div>
              
              <div className="p-6 border-t border-gray-100 flex gap-3 sticky bottom-0 bg-white">
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
                  onClick={savePackage}
                  disabled={isSaving || !form.name || !form.price}
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4 mr-2" />
                      {editingPackage ? 'Update Package' : 'Create Package'}
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

export default PackagesPage;
