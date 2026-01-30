"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { useStore } from "@/hooks/use-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import {
  Plus,
  Pencil,
  Trash2,
  GripVertical,
  ImageIcon,
  ToggleLeft,
  ToggleRight,
  FolderOpen,
  Loader2,
} from "lucide-react";
import type { Category, MenuItem } from "@/types/database";

export default function MenuPage() {
  const { store, loading: storeLoading } = useStore();
  const [categories, setCategories] = useState<Category[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // Category dialog state
  const [catDialogOpen, setCatDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [catNameEn, setCatNameEn] = useState("");
  const [catNameMs, setCatNameMs] = useState("");
  const [catSaving, setCatSaving] = useState(false);

  // Menu item dialog state
  const [itemDialogOpen, setItemDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [itemNameEn, setItemNameEn] = useState("");
  const [itemNameMs, setItemNameMs] = useState("");
  const [itemDescEn, setItemDescEn] = useState("");
  const [itemDescMs, setItemDescMs] = useState("");
  const [itemPrice, setItemPrice] = useState("");
  const [itemImage, setItemImage] = useState<File | null>(null);
  const [itemImageUrl, setItemImageUrl] = useState("");
  const [itemCategoryId, setItemCategoryId] = useState<string>("");
  const [itemSaving, setItemSaving] = useState(false);

  const loadData = useCallback(async () => {
    if (!store) return;
    const supabase = createClient();

    const [catRes, itemRes] = await Promise.all([
      supabase
        .from("categories")
        .select("*")
        .eq("store_id", store.id)
        .order("sort_order", { ascending: true })
        .returns<Category[]>(),
      supabase
        .from("menu_items")
        .select("*")
        .eq("store_id", store.id)
        .order("sort_order", { ascending: true })
        .returns<MenuItem[]>(),
    ]);

    if (catRes.data) setCategories(catRes.data);
    if (itemRes.data) setMenuItems(itemRes.data);
    setLoading(false);
  }, [store]);

  useEffect(() => {
    if (store) loadData();
  }, [store, loadData]);

  // ========== CATEGORY CRUD ==========

  function openCategoryDialog(cat?: Category) {
    if (cat) {
      setEditingCategory(cat);
      setCatNameEn(cat.name_en);
      setCatNameMs(cat.name_ms || "");
    } else {
      setEditingCategory(null);
      setCatNameEn("");
      setCatNameMs("");
    }
    setCatDialogOpen(true);
  }

  async function saveCategory() {
    if (!store || !catNameEn.trim()) return;
    setCatSaving(true);
    const supabase = createClient();

    if (editingCategory) {
      const { error } = await supabase
        .from("categories")
        .update({ name_en: catNameEn.trim(), name_ms: catNameMs.trim() || null })
        .eq("id", editingCategory.id);
      if (error) { toast.error(error.message); setCatSaving(false); return; }
      toast.success("Category updated");
    } else {
      const { error } = await supabase
        .from("categories")
        .insert({
          store_id: store.id,
          name_en: catNameEn.trim(),
          name_ms: catNameMs.trim() || null,
          sort_order: categories.length,
        });
      if (error) { toast.error(error.message); setCatSaving(false); return; }
      toast.success("Category created");
    }

    setCatDialogOpen(false);
    setCatSaving(false);
    loadData();
  }

  async function deleteCategory(id: string) {
    if (!confirm("Delete this category? Items in it will become uncategorized.")) return;
    const supabase = createClient();
    const { error } = await supabase.from("categories").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    if (selectedCategory === id) setSelectedCategory(null);
    toast.success("Category deleted");
    loadData();
  }

  // ========== MENU ITEM CRUD ==========

  function openItemDialog(item?: MenuItem) {
    if (item) {
      setEditingItem(item);
      setItemNameEn(item.name_en);
      setItemNameMs(item.name_ms || "");
      setItemDescEn(item.description_en || "");
      setItemDescMs(item.description_ms || "");
      setItemPrice(String(item.base_price));
      setItemImageUrl(item.image_url || "");
      setItemCategoryId(item.category_id || "");
    } else {
      setEditingItem(null);
      setItemNameEn("");
      setItemNameMs("");
      setItemDescEn("");
      setItemDescMs("");
      setItemPrice("");
      setItemImageUrl("");
      setItemCategoryId(selectedCategory || "");
    }
    setItemImage(null);
    setItemDialogOpen(true);
  }

  async function uploadImage(file: File): Promise<string | null> {
    const supabase = createClient();
    const ext = file.name.split(".").pop();
    const path = `${store!.id}/${Date.now()}.${ext}`;

    const { error } = await supabase.storage
      .from("menu-images")
      .upload(path, file);

    if (error) { toast.error("Image upload failed: " + error.message); return null; }

    const { data: { publicUrl } } = supabase.storage
      .from("menu-images")
      .getPublicUrl(path);

    return publicUrl;
  }

  async function saveItem() {
    if (!store || !itemNameEn.trim() || !itemPrice) return;
    setItemSaving(true);

    let imageUrl = itemImageUrl;
    if (itemImage) {
      const uploaded = await uploadImage(itemImage);
      if (uploaded) imageUrl = uploaded;
    }

    const supabase = createClient();
    const payload = {
      store_id: store.id,
      name_en: itemNameEn.trim(),
      name_ms: itemNameMs.trim() || null,
      description_en: itemDescEn.trim() || null,
      description_ms: itemDescMs.trim() || null,
      base_price: parseFloat(itemPrice),
      image_url: imageUrl || null,
      category_id: itemCategoryId || null,
    };

    if (editingItem) {
      const { error } = await supabase
        .from("menu_items")
        .update(payload)
        .eq("id", editingItem.id);
      if (error) { toast.error(error.message); setItemSaving(false); return; }
      toast.success("Item updated");
    } else {
      const { error } = await supabase
        .from("menu_items")
        .insert({ ...payload, sort_order: menuItems.length });
      if (error) { toast.error(error.message); setItemSaving(false); return; }
      toast.success("Item created");
    }

    setItemDialogOpen(false);
    setItemSaving(false);
    loadData();
  }

  async function deleteItem(id: string) {
    if (!confirm("Delete this menu item?")) return;
    const supabase = createClient();
    const { error } = await supabase.from("menu_items").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success("Item deleted");
    loadData();
  }

  async function toggleAvailability(item: MenuItem) {
    const supabase = createClient();
    const { error } = await supabase
      .from("menu_items")
      .update({ is_available: !item.is_available })
      .eq("id", item.id);
    if (error) { toast.error(error.message); return; }
    loadData();
  }

  // Filter items by selected category
  const filteredItems = selectedCategory
    ? menuItems.filter((i) => i.category_id === selectedCategory)
    : menuItems;

  if (storeLoading || loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 animate-spin text-primary-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Menu Management</h1>
          <p className="text-sm text-muted-foreground">
            Manage categories and menu items for your restaurant.
          </p>
        </div>
        <Button
          onClick={() => openItemDialog()}
          className="bg-gradient-to-r from-primary-700 to-primary-500 hover:from-primary-600 hover:to-primary-400"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Item
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Categories Sidebar */}
        <Card className="lg:col-span-1">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Categories</CardTitle>
              <Button variant="ghost" size="sm" onClick={() => openCategoryDialog()}>
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-1">
            <button
              onClick={() => setSelectedCategory(null)}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                selectedCategory === null
                  ? "bg-primary-50 text-primary-700"
                  : "text-dark-500 hover:bg-gray-100"
              }`}
            >
              All Items ({menuItems.length})
            </button>
            {categories.map((cat) => {
              const count = menuItems.filter((i) => i.category_id === cat.id).length;
              return (
                <div key={cat.id} className="flex items-center group">
                  <button
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`flex-1 text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      selectedCategory === cat.id
                        ? "bg-primary-50 text-primary-700"
                        : "text-dark-500 hover:bg-gray-100"
                    }`}
                  >
                    <GripVertical className="w-3 h-3 inline mr-1 opacity-30" />
                    {cat.name_en} ({count})
                  </button>
                  <div className="hidden group-hover:flex items-center gap-1 pr-1">
                    <button
                      onClick={() => openCategoryDialog(cat)}
                      className="p-1 hover:bg-gray-200 rounded"
                    >
                      <Pencil className="w-3 h-3 text-dark-400" />
                    </button>
                    <button
                      onClick={() => deleteCategory(cat.id)}
                      className="p-1 hover:bg-red-100 rounded"
                    >
                      <Trash2 className="w-3 h-3 text-red-500" />
                    </button>
                  </div>
                </div>
              );
            })}
            {categories.length === 0 && (
              <div className="text-center py-4 text-sm text-dark-400">
                <FolderOpen className="w-8 h-8 mx-auto mb-2 opacity-30" />
                No categories yet
              </div>
            )}
          </CardContent>
        </Card>

        {/* Menu Items Grid */}
        <div className="lg:col-span-3">
          {filteredItems.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-16">
                <FolderOpen className="w-12 h-12 text-dark-200 mb-4" />
                <p className="text-dark-500 mb-4">No menu items yet</p>
                <Button onClick={() => openItemDialog()} variant="outline">
                  <Plus className="w-4 h-4 mr-2" />
                  Add your first item
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {filteredItems.map((item) => (
                <Card key={item.id} className={`overflow-hidden ${!item.is_available ? "opacity-60" : ""}`}>
                  {item.image_url ? (
                    <div className="h-40 bg-gray-100">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={item.image_url}
                        alt={item.name_en}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="h-40 bg-gray-100 flex items-center justify-center">
                      <ImageIcon className="w-10 h-10 text-gray-300" />
                    </div>
                  )}
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-1">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-dark-900 truncate">{item.name_en}</h3>
                        {item.name_ms && (
                          <p className="text-xs text-dark-400 truncate">{item.name_ms}</p>
                        )}
                      </div>
                      <span className="font-bold text-primary-700 ml-2 whitespace-nowrap">
                        RM {Number(item.base_price).toFixed(2)}
                      </span>
                    </div>
                    {item.description_en && (
                      <p className="text-xs text-dark-400 line-clamp-2 mb-3">
                        {item.description_en}
                      </p>
                    )}
                    <div className="flex items-center justify-between pt-2 border-t">
                      <button
                        onClick={() => toggleAvailability(item)}
                        className={`flex items-center gap-1.5 text-xs font-medium ${
                          item.is_available ? "text-green-600" : "text-red-500"
                        }`}
                      >
                        {item.is_available ? (
                          <><ToggleRight className="w-4 h-4" /> Available</>
                        ) : (
                          <><ToggleLeft className="w-4 h-4" /> Unavailable</>
                        )}
                      </button>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => openItemDialog(item)}
                          className="p-1.5 hover:bg-gray-100 rounded"
                        >
                          <Pencil className="w-3.5 h-3.5 text-dark-400" />
                        </button>
                        <button
                          onClick={() => deleteItem(item.id)}
                          className="p-1.5 hover:bg-red-50 rounded"
                        >
                          <Trash2 className="w-3.5 h-3.5 text-red-500" />
                        </button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Category Dialog */}
      <Dialog open={catDialogOpen} onOpenChange={setCatDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingCategory ? "Edit Category" : "New Category"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Name (English)</Label>
              <Input
                value={catNameEn}
                onChange={(e) => setCatNameEn(e.target.value)}
                placeholder="e.g. Main Course"
                autoFocus
              />
            </div>
            <div className="space-y-2">
              <Label>Name (Bahasa Malaysia)</Label>
              <Input
                value={catNameMs}
                onChange={(e) => setCatNameMs(e.target.value)}
                placeholder="e.g. Hidangan Utama"
              />
            </div>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setCatDialogOpen(false)}>Cancel</Button>
              <Button onClick={saveCategory} disabled={catSaving || !catNameEn.trim()}>
                {catSaving ? "Saving..." : "Save"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Menu Item Dialog */}
      <Dialog open={itemDialogOpen} onOpenChange={setItemDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingItem ? "Edit Menu Item" : "New Menu Item"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Name (English) *</Label>
              <Input
                value={itemNameEn}
                onChange={(e) => setItemNameEn(e.target.value)}
                placeholder="e.g. Nasi Lemak Special"
                autoFocus
              />
            </div>
            <div className="space-y-2">
              <Label>Name (Bahasa Malaysia)</Label>
              <Input
                value={itemNameMs}
                onChange={(e) => setItemNameMs(e.target.value)}
                placeholder="e.g. Nasi Lemak Istimewa"
              />
            </div>
            <div className="space-y-2">
              <Label>Description (English)</Label>
              <Textarea
                value={itemDescEn}
                onChange={(e) => setItemDescEn(e.target.value)}
                placeholder="Brief description of the item"
                rows={2}
              />
            </div>
            <div className="space-y-2">
              <Label>Description (Bahasa Malaysia)</Label>
              <Textarea
                value={itemDescMs}
                onChange={(e) => setItemDescMs(e.target.value)}
                placeholder="Penerangan ringkas"
                rows={2}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Price (RM) *</Label>
                <Input
                  type="number"
                  step="0.10"
                  min="0"
                  value={itemPrice}
                  onChange={(e) => setItemPrice(e.target.value)}
                  placeholder="12.90"
                />
              </div>
              <div className="space-y-2">
                <Label>Category</Label>
                <select
                  value={itemCategoryId}
                  onChange={(e) => setItemCategoryId(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <option value="">No Category</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>{cat.name_en}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Image</Label>
              {(itemImageUrl && !itemImage) && (
                <div className="h-32 rounded-lg overflow-hidden bg-gray-100 mb-2">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={itemImageUrl} alt="" className="w-full h-full object-cover" />
                </div>
              )}
              <Input
                type="file"
                accept="image/*"
                onChange={(e) => setItemImage(e.target.files?.[0] || null)}
              />
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <Button variant="outline" onClick={() => setItemDialogOpen(false)}>Cancel</Button>
              <Button
                onClick={saveItem}
                disabled={itemSaving || !itemNameEn.trim() || !itemPrice}
              >
                {itemSaving ? "Saving..." : "Save"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
