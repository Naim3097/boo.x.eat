import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  Edit2,
  Trash2,
  MoreVertical,
  GripVertical,
  Image as ImageIcon,
  Loader2,
  Search,
  Filter,
  ChevronDown,
  X,
  Check,
  Flame,
  Leaf,
  AlertCircle,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { Card, Button, Badge } from '../../components/ui';
import { supabase } from '../../lib/supabase';
import type { MenuItem, MenuCategory, MenuItemInsert, MenuCategoryInsert } from '../../types/database';

export const MenuPage: React.FC = () => {
  const { vendor } = useAuth();
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  
  // Modal states
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [editingCategory, setEditingCategory] = useState<MenuCategory | null>(null);
  
  // Form state
  const [itemForm, setItemForm] = useState({
    name: '',
    description: '',
    price: '',
    compare_price: '',
    category_id: '',
    is_available: true,
    is_featured: false,
    is_vegetarian: false,
    is_spicy: false,
    spicy_level: 0,
    dietary_tags: [] as string[],
  });
  
  const [categoryForm, setCategoryForm] = useState({
    name: '',
    description: '',
  });
  
  const [isSaving, setIsSaving] = useState(false);

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
      const [categoriesRes, itemsRes] = await Promise.all([
        supabase
          .from('menu_categories')
          .select('*')
          .eq('vendor_id', vendor.id)
          .order('display_order', { ascending: true }),
        supabase
          .from('menu_items')
          .select('*')
          .eq('vendor_id', vendor.id)
          .order('display_order', { ascending: true }),
      ]);
      
      if (categoriesRes.data) setCategories(categoriesRes.data);
      if (itemsRes.data) setMenuItems(itemsRes.data);
    } catch (error) {
      console.error('Error fetching menu data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Filter items
  const filteredItems = menuItems.filter((item) => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = !selectedCategory || item.category_id === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Open item modal for create/edit
  const openItemModal = (item?: MenuItem) => {
    if (item) {
      setEditingItem(item);
      setItemForm({
        name: item.name,
        description: item.description || '',
        price: item.price.toString(),
        compare_price: item.compare_price?.toString() || '',
        category_id: item.category_id || '',
        is_available: item.is_available,
        is_featured: item.is_featured,
        is_vegetarian: item.is_vegetarian,
        is_spicy: item.is_spicy,
        spicy_level: item.spicy_level,
        dietary_tags: item.dietary_tags || [],
      });
    } else {
      setEditingItem(null);
      setItemForm({
        name: '',
        description: '',
        price: '',
        compare_price: '',
        category_id: categories[0]?.id || '',
        is_available: true,
        is_featured: false,
        is_vegetarian: false,
        is_spicy: false,
        spicy_level: 0,
        dietary_tags: [],
      });
    }
    setIsItemModalOpen(true);
  };

  // Open category modal for create/edit
  const openCategoryModal = (category?: MenuCategory) => {
    if (category) {
      setEditingCategory(category);
      setCategoryForm({
        name: category.name,
        description: category.description || '',
      });
    } else {
      setEditingCategory(null);
      setCategoryForm({ name: '', description: '' });
    }
    setIsCategoryModalOpen(true);
  };

  // Save menu item
  const saveItem = async () => {
    if (!vendor || !itemForm.name || !itemForm.price) return;
    
    setIsSaving(true);
    try {
      const itemData: MenuItemInsert = {
        vendor_id: vendor.id,
        name: itemForm.name,
        description: itemForm.description || null,
        price: parseFloat(itemForm.price),
        compare_price: itemForm.compare_price ? parseFloat(itemForm.compare_price) : null,
        category_id: itemForm.category_id || null,
        is_available: itemForm.is_available,
        is_featured: itemForm.is_featured,
        is_vegetarian: itemForm.is_vegetarian,
        is_spicy: itemForm.is_spicy,
        spicy_level: itemForm.spicy_level,
        dietary_tags: itemForm.dietary_tags.length > 0 ? itemForm.dietary_tags : null,
      };

      if (editingItem) {
        await supabase
          .from('menu_items')
          .update(itemData)
          .eq('id', editingItem.id);
      } else {
        await supabase
          .from('menu_items')
          .insert(itemData);
      }
      
      await fetchData();
      setIsItemModalOpen(false);
    } catch (error) {
      console.error('Error saving item:', error);
    } finally {
      setIsSaving(false);
    }
  };

  // Save category
  const saveCategory = async () => {
    if (!vendor || !categoryForm.name) return;
    
    setIsSaving(true);
    try {
      const categoryData: MenuCategoryInsert = {
        vendor_id: vendor.id,
        name: categoryForm.name,
        description: categoryForm.description || null,
      };

      if (editingCategory) {
        await supabase
          .from('menu_categories')
          .update(categoryData)
          .eq('id', editingCategory.id);
      } else {
        await supabase
          .from('menu_categories')
          .insert(categoryData);
      }
      
      await fetchData();
      setIsCategoryModalOpen(false);
    } catch (error) {
      console.error('Error saving category:', error);
    } finally {
      setIsSaving(false);
    }
  };

  // Delete item
  const deleteItem = async (id: string) => {
    if (!confirm('Are you sure you want to delete this item?')) return;
    
    try {
      await supabase.from('menu_items').delete().eq('id', id);
      await fetchData();
    } catch (error) {
      console.error('Error deleting item:', error);
    }
  };

  // Delete category
  const deleteCategory = async (id: string) => {
    if (!confirm('Are you sure you want to delete this category? Items in this category will become uncategorized.')) return;
    
    try {
      await supabase.from('menu_categories').delete().eq('id', id);
      await fetchData();
    } catch (error) {
      console.error('Error deleting category:', error);
    }
  };

  // Toggle item availability
  const toggleAvailability = async (item: MenuItem) => {
    try {
      await supabase
        .from('menu_items')
        .update({ is_available: !item.is_available })
        .eq('id', item.id);
      await fetchData();
    } catch (error) {
      console.error('Error toggling availability:', error);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-dark-900">Menu</h1>
            <p className="text-dark-500 mt-1">
              Manage your menu items and categories
            </p>
          </div>
          <div className="flex gap-3">
            <Button variant="secondary" onClick={() => openCategoryModal()}>
              <Plus className="w-4 h-4 mr-2" />
              Add Category
            </Button>
            <Button variant="primary" onClick={() => openItemModal()}>
              <Plus className="w-4 h-4 mr-2" />
              Add Item
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
                placeholder="Search menu items..."
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0">
              <button
                onClick={() => setSelectedCategory(null)}
                className={`px-4 py-2 rounded-lg whitespace-nowrap transition-colors ${
                  !selectedCategory
                    ? 'bg-primary-100 text-primary-700 font-medium'
                    : 'bg-gray-100 text-dark-600 hover:bg-gray-200'
                }`}
              >
                All Items
              </button>
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-4 py-2 rounded-lg whitespace-nowrap transition-colors ${
                    selectedCategory === cat.id
                      ? 'bg-primary-100 text-primary-700 font-medium'
                      : 'bg-gray-100 text-dark-600 hover:bg-gray-200'
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </div>
        </Card>

        {/* Categories Management */}
        {categories.length > 0 && (
          <Card variant="elevated" className="p-4">
            <h3 className="font-semibold text-dark-900 mb-3">Categories</h3>
            <div className="flex flex-wrap gap-2">
              {categories.map((cat) => (
                <div
                  key={cat.id}
                  className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-lg group"
                >
                  <span className="text-sm font-medium text-dark-700">{cat.name}</span>
                  <span className="text-xs text-dark-400">
                    ({menuItems.filter(i => i.category_id === cat.id).length} items)
                  </span>
                  <button
                    onClick={() => openCategoryModal(cat)}
                    className="p-1 text-dark-400 hover:text-primary-600 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Edit2 className="w-3 h-3" />
                  </button>
                  <button
                    onClick={() => deleteCategory(cat.id)}
                    className="p-1 text-dark-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Menu Items Grid */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
          </div>
        ) : filteredItems.length === 0 ? (
          <Card variant="elevated" className="p-12 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <ImageIcon className="w-8 h-8 text-dark-400" />
            </div>
            <h3 className="text-lg font-semibold text-dark-900 mb-2">No menu items yet</h3>
            <p className="text-dark-500 mb-4">
              Start by adding your first menu item to display on your booking page.
            </p>
            <Button variant="primary" onClick={() => openItemModal()}>
              <Plus className="w-4 h-4 mr-2" />
              Add First Item
            </Button>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredItems.map((item) => (
              <motion.div
                key={item.id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <Card
                  variant="elevated"
                  className={`p-4 ${!item.is_available ? 'opacity-60' : ''}`}
                >
                  {/* Item Image Placeholder */}
                  <div className="w-full h-32 bg-gradient-to-br from-gray-100 to-gray-50 rounded-xl mb-4 flex items-center justify-center relative overflow-hidden">
                    {item.image_url ? (
                      <img
                        src={item.image_url}
                        alt={item.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <ImageIcon className="w-10 h-10 text-dark-300" />
                    )}
                    {item.is_featured && (
                      <Badge variant="primary" className="absolute top-2 left-2">
                        Featured
                      </Badge>
                    )}
                    {!item.is_available && (
                      <Badge variant="outline" className="absolute top-2 right-2 bg-white">
                        Unavailable
                      </Badge>
                    )}
                  </div>

                  {/* Item Info */}
                  <div className="space-y-2">
                    <div className="flex items-start justify-between">
                      <h3 className="font-semibold text-dark-900">{item.name}</h3>
                      <div className="flex items-center gap-1">
                        {item.is_vegetarian && (
                          <Leaf className="w-4 h-4 text-green-500" />
                        )}
                        {item.is_spicy && (
                          <Flame className="w-4 h-4 text-red-500" />
                        )}
                      </div>
                    </div>
                    
                    {item.description && (
                      <p className="text-sm text-dark-500 line-clamp-2">{item.description}</p>
                    )}
                    
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-bold text-primary-600">
                        RM {item.price.toFixed(2)}
                      </span>
                      {item.compare_price && item.compare_price > item.price && (
                        <span className="text-sm text-dark-400 line-through">
                          RM {item.compare_price.toFixed(2)}
                        </span>
                      )}
                    </div>

                    {/* Category Badge */}
                    {item.category_id && (
                      <Badge variant="outline" className="text-xs">
                        {categories.find(c => c.id === item.category_id)?.name || 'Uncategorized'}
                      </Badge>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 mt-4 pt-4 border-t border-gray-100">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="flex-1"
                      onClick={() => toggleAvailability(item)}
                    >
                      {item.is_available ? 'Mark Unavailable' : 'Mark Available'}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openItemModal(item)}
                    >
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteItem(item.id)}
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

      {/* Item Modal */}
      <AnimatePresence>
        {isItemModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={() => setIsItemModalOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                <h2 className="text-xl font-bold text-dark-900">
                  {editingItem ? 'Edit Item' : 'Add New Item'}
                </h2>
                <button
                  onClick={() => setIsItemModalOpen(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  <X className="w-5 h-5 text-dark-500" />
                </button>
              </div>
              
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-dark-700 mb-2">
                    Item Name *
                  </label>
                  <input
                    type="text"
                    value={itemForm.name}
                    onChange={(e) => setItemForm({ ...itemForm, name: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="Nasi Lemak Special"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-dark-700 mb-2">
                    Description
                  </label>
                  <textarea
                    value={itemForm.description}
                    onChange={(e) => setItemForm({ ...itemForm, description: e.target.value })}
                    rows={2}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="Fragrant coconut rice with sambal..."
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-dark-700 mb-2">
                      Price (RM) *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={itemForm.price}
                      onChange={(e) => setItemForm({ ...itemForm, price: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500"
                      placeholder="12.00"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-dark-700 mb-2">
                      Compare Price (RM)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={itemForm.compare_price}
                      onChange={(e) => setItemForm({ ...itemForm, compare_price: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500"
                      placeholder="15.00"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-dark-700 mb-2">
                    Category
                  </label>
                  <select
                    value={itemForm.category_id}
                    onChange={(e) => setItemForm({ ...itemForm, category_id: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="">No Category</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>
                
                <div className="space-y-3">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={itemForm.is_available}
                      onChange={(e) => setItemForm({ ...itemForm, is_available: e.target.checked })}
                      className="w-5 h-5 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                    />
                    <span className="text-dark-700">Available for ordering</span>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={itemForm.is_featured}
                      onChange={(e) => setItemForm({ ...itemForm, is_featured: e.target.checked })}
                      className="w-5 h-5 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                    />
                    <span className="text-dark-700">Featured item</span>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={itemForm.is_vegetarian}
                      onChange={(e) => setItemForm({ ...itemForm, is_vegetarian: e.target.checked })}
                      className="w-5 h-5 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                    />
                    <span className="text-dark-700">Vegetarian</span>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={itemForm.is_spicy}
                      onChange={(e) => setItemForm({ ...itemForm, is_spicy: e.target.checked })}
                      className="w-5 h-5 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                    />
                    <span className="text-dark-700">Spicy</span>
                  </label>
                </div>
              </div>
              
              <div className="p-6 border-t border-gray-100 flex gap-3">
                <Button
                  variant="secondary"
                  className="flex-1"
                  onClick={() => setIsItemModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  className="flex-1"
                  onClick={saveItem}
                  disabled={isSaving || !itemForm.name || !itemForm.price}
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4 mr-2" />
                      {editingItem ? 'Update Item' : 'Add Item'}
                    </>
                  )}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Category Modal */}
      <AnimatePresence>
        {isCategoryModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={() => setIsCategoryModalOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl shadow-xl max-w-md w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                <h2 className="text-xl font-bold text-dark-900">
                  {editingCategory ? 'Edit Category' : 'Add New Category'}
                </h2>
                <button
                  onClick={() => setIsCategoryModalOpen(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  <X className="w-5 h-5 text-dark-500" />
                </button>
              </div>
              
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-dark-700 mb-2">
                    Category Name *
                  </label>
                  <input
                    type="text"
                    value={categoryForm.name}
                    onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="Main Dishes"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-dark-700 mb-2">
                    Description
                  </label>
                  <input
                    type="text"
                    value={categoryForm.description}
                    onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="Our signature main courses"
                  />
                </div>
              </div>
              
              <div className="p-6 border-t border-gray-100 flex gap-3">
                <Button
                  variant="secondary"
                  className="flex-1"
                  onClick={() => setIsCategoryModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  className="flex-1"
                  onClick={saveCategory}
                  disabled={isSaving || !categoryForm.name}
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4 mr-2" />
                      {editingCategory ? 'Update' : 'Add Category'}
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

export default MenuPage;
