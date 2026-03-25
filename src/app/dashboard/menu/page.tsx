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
  ChevronUp,
  ChevronDown,
  ImageIcon,
  ToggleLeft,
  ToggleRight,
  FolderOpen,
  Loader2,
  Settings2,
} from "lucide-react";
import type { Category, MenuItem, Variant } from "@/types/database";

export default function MenuPage() {
  const { store, loading: storeLoading } = useStore();
  const [categories, setCategories] = useState<Category[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [variants, setVariants] = useState<Variant[]>([]);
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

  // Variant management dialog (B2)
  const [variantItemId, setVariantItemId] = useState<string | null>(null);
  const [variantDialogOpen, setVariantDialogOpen] = useState(false);
  const [varGroupName, setVarGroupName] = useState("");
  const [varNameEn, setVarNameEn] = useState("");
  const [varNameMs, setVarNameMs] = useState("");
  const [varPrice, setVarPrice] = useState("0");
  const [varIsDefault, setVarIsDefault] = useState(false);
  const [editingVariant, setEditingVariant] = useState<Variant | null>(null);
  const [varSaving, setVarSaving] = useState(false);

  const loadData = useCallback(async () => {
    if (!store) return;
    const supabase = createClient();

    const [catRes, itemRes, varRes] = await Promise.all([
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
      supabase
        .from("variants")
        .select("*")
        .order("sort_order", { ascending: true })
        .returns<Variant[]>(),
    ]);

    if (catRes.data) setCategories(catRes.data);
    if (itemRes.data) setMenuItems(itemRes.data);
    if (varRes.data) setVariants(varRes.data);
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

  // ========== CATEGORY REORDER ==========

  async function moveCategoryUp(index: number) {
    if (index <= 0) return;
    const supabase = createClient();
    const current = categories[index];
    const prev = categories[index - 1];
    const currentSort = current.sort_order ?? index;
    const prevSort = prev.sort_order ?? (index - 1);

    await Promise.all([
      supabase.from("categories").update({ sort_order: prevSort }).eq("id", current.id),
      supabase.from("categories").update({ sort_order: currentSort }).eq("id", prev.id),
    ]);
    loadData();
  }

  async function moveCategoryDown(index: number) {
    if (index >= categories.length - 1) return;
    const supabase = createClient();
    const current = categories[index];
    const next = categories[index + 1];
    const currentSort = current.sort_order ?? index;
    const nextSort = next.sort_order ?? (index + 1);

    await Promise.all([
      supabase.from("categories").update({ sort_order: nextSort }).eq("id", current.id),
      supabase.from("categories").update({ sort_order: currentSort }).eq("id", next.id),
    ]);
    loadData();
  }

  // ========== MENU ITEM REORDER ==========

  async function moveItemUp(item: MenuItem) {
    const sameCatItems = menuItems
      .filter((i) => i.category_id === item.category_id)
      .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
    const index = sameCatItems.findIndex((i) => i.id === item.id);
    if (index <= 0) return;

    const supabase = createClient();
    const current = sameCatItems[index];
    const prev = sameCatItems[index - 1];
    const currentSort = current.sort_order ?? index;
    const prevSort = prev.sort_order ?? (index - 1);

    await Promise.all([
      supabase.from("menu_items").update({ sort_order: prevSort }).eq("id", current.id),
      supabase.from("menu_items").update({ sort_order: currentSort }).eq("id", prev.id),
    ]);
    loadData();
  }

  async function moveItemDown(item: MenuItem) {
    const sameCatItems = menuItems
      .filter((i) => i.category_id === item.category_id)
      .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
    const index = sameCatItems.findIndex((i) => i.id === item.id);
    if (index < 0 || index >= sameCatItems.length - 1) return;

    const supabase = createClient();
    const current = sameCatItems[index];
    const next = sameCatItems[index + 1];
    const currentSort = current.sort_order ?? index;
    const nextSort = next.sort_order ?? (index + 1);

    await Promise.all([
      supabase.from("menu_items").update({ sort_order: nextSort }).eq("id", current.id),
      supabase.from("menu_items").update({ sort_order: currentSort }).eq("id", next.id),
    ]);
    loadData();
  }

  // ========== IMAGE CLEANUP ==========

  async function deleteStorageImage(imageUrl: string) {
    if (!imageUrl) return;
    try {
      // Extract path from public URL: .../storage/v1/object/public/menu-images/STORE_ID/FILE
      const match = imageUrl.match(/menu-images\/(.+)$/);
      if (!match) return;
      const path = match[1];
      const supabase = createClient();
      await supabase.storage.from("menu-images").remove([path]);
    } catch {
      // Non-critical; ignore cleanup errors
    }
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
    const oldImageUrl = editingItem?.image_url || "";
    if (itemImage) {
      const uploaded = await uploadImage(itemImage);
      if (uploaded) {
        imageUrl = uploaded;
        // Delete old image from storage if it was replaced
        if (oldImageUrl) {
          await deleteStorageImage(oldImageUrl);
        }
      }
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
    // Delete image from storage first
    const item = menuItems.find((i) => i.id === id);
    if (item?.image_url) {
      await deleteStorageImage(item.image_url);
    }
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

  // ========== VARIANT CRUD (B2) ==========

  function getItemVariants(menuItemId: string): Variant[] {
    return variants.filter((v) => v.menu_item_id === menuItemId);
  }

  function getVariantGroups(menuItemId: string): Map<string, Variant[]> {
    const itemVars = getItemVariants(menuItemId);
    const groups = new Map<string, Variant[]>();
    for (const v of itemVars) {
      const arr = groups.get(v.group_name) || [];
      arr.push(v);
      groups.set(v.group_name, arr);
    }
    return groups;
  }

  function openVariantDialog(variant?: Variant) {
    if (variant) {
      setEditingVariant(variant);
      setVarGroupName(variant.group_name);
      setVarNameEn(variant.name_en);
      setVarNameMs(variant.name_ms || "");
      setVarPrice(String(variant.price_adjustment || 0));
      setVarIsDefault(variant.is_default || false);
    } else {
      setEditingVariant(null);
      setVarGroupName("");
      setVarNameEn("");
      setVarNameMs("");
      setVarPrice("0");
      setVarIsDefault(false);
    }
    setVariantDialogOpen(true);
  }

  async function saveVariant() {
    if (!variantItemId || !varGroupName.trim() || !varNameEn.trim()) return;
    setVarSaving(true);
    const supabase = createClient();

    const payload = {
      menu_item_id: variantItemId,
      group_name: varGroupName.trim(),
      name_en: varNameEn.trim(),
      name_ms: varNameMs.trim() || null,
      price_adjustment: parseFloat(varPrice) || 0,
      is_default: varIsDefault,
    };

    if (editingVariant) {
      const { error } = await supabase
        .from("variants")
        .update(payload)
        .eq("id", editingVariant.id);
      if (error) { toast.error(error.message); setVarSaving(false); return; }
      toast.success("Variant updated");
    } else {
      const { error } = await supabase
        .from("variants")
        .insert({ ...payload, sort_order: getItemVariants(variantItemId).length });
      if (error) { toast.error(error.message); setVarSaving(false); return; }
      toast.success("Variant created");
    }

    setVariantDialogOpen(false);
    setVarSaving(false);
    loadData();
  }

  async function deleteVariant(id: string) {
    if (!confirm("Delete this variant?")) return;
    const supabase = createClient();
    const { error } = await supabase.from("variants").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success("Variant deleted");
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
            Manage categories, menu items, and variants for your restaurant.
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
            {categories.map((cat, catIndex) => {
              const count = menuItems.filter((i) => i.category_id === cat.id).length;
              return (
                <div key={cat.id} className="flex items-center group">
                  <div className="flex flex-col mr-1">
                    <button
                      onClick={() => moveCategoryUp(catIndex)}
                      disabled={catIndex === 0}
                      className="p-0.5 hover:bg-gray-200 rounded disabled:opacity-20"
                    >
                      <ChevronUp className="w-3 h-3 text-dark-400" />
                    </button>
                    <button
                      onClick={() => moveCategoryDown(catIndex)}
                      disabled={catIndex === categories.length - 1}
                      className="p-0.5 hover:bg-gray-200 rounded disabled:opacity-20"
                    >
                      <ChevronDown className="w-3 h-3 text-dark-400" />
                    </button>
                  </div>
                  <button
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`flex-1 text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      selectedCategory === cat.id
                        ? "bg-primary-50 text-primary-700"
                        : "text-dark-500 hover:bg-gray-100"
                    }`}
                  >
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
              {filteredItems.map((item) => {
                const itemVarCount = getItemVariants(item.id).length;
                return (
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
                      {/* Variant count badge (B2) */}
                      {itemVarCount > 0 && (
                        <p className="text-xs text-primary-600 mb-2">
                          {itemVarCount} variant{itemVarCount > 1 ? "s" : ""}
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
                            onClick={() => moveItemUp(item)}
                            className="p-1.5 hover:bg-gray-100 rounded"
                            title="Move up"
                          >
                            <ChevronUp className="w-3.5 h-3.5 text-dark-400" />
                          </button>
                          <button
                            onClick={() => moveItemDown(item)}
                            className="p-1.5 hover:bg-gray-100 rounded"
                            title="Move down"
                          >
                            <ChevronDown className="w-3.5 h-3.5 text-dark-400" />
                          </button>
                          {/* Variants button (B2) */}
                          <button
                            onClick={() => setVariantItemId(item.id)}
                            className="p-1.5 hover:bg-gray-100 rounded"
                            title="Manage variants"
                          >
                            <Settings2 className="w-3.5 h-3.5 text-dark-400" />
                          </button>
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
                );
              })}
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

      {/* Variant Management Panel (B2) */}
      <Dialog open={!!variantItemId} onOpenChange={() => setVariantItemId(null)}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Manage Variants - {menuItems.find((i) => i.id === variantItemId)?.name_en}
            </DialogTitle>
          </DialogHeader>
          {variantItemId && (
            <div className="space-y-4">
              {/* Existing variant groups */}
              {Array.from(getVariantGroups(variantItemId).entries()).map(([groupName, groupVars]) => (
                <div key={groupName} className="border rounded-lg p-3">
                  <h4 className="text-sm font-semibold text-gray-700 mb-2">{groupName}</h4>
                  <div className="space-y-1">
                    {groupVars.map((v) => (
                      <div key={v.id} className="flex items-center justify-between text-sm bg-gray-50 rounded px-2 py-1.5">
                        <div className="flex items-center gap-2">
                          <span>{v.name_en}</span>
                          {v.name_ms && <span className="text-gray-400">({v.name_ms})</span>}
                          {v.is_default && (
                            <span className="text-xs bg-primary-100 text-primary-700 px-1.5 py-0.5 rounded">Default</span>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-500">
                            {Number(v.price_adjustment) > 0 ? `+RM ${Number(v.price_adjustment).toFixed(2)}` :
                             Number(v.price_adjustment) < 0 ? `-RM ${Math.abs(Number(v.price_adjustment)).toFixed(2)}` :
                             "RM 0.00"}
                          </span>
                          <button onClick={() => openVariantDialog(v)} className="p-1 hover:bg-gray-200 rounded">
                            <Pencil className="w-3 h-3 text-gray-400" />
                          </button>
                          <button onClick={() => deleteVariant(v.id)} className="p-1 hover:bg-red-100 rounded">
                            <Trash2 className="w-3 h-3 text-red-500" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}

              {getItemVariants(variantItemId).length === 0 && (
                <p className="text-sm text-gray-400 text-center py-4">
                  No variants yet. Add variants like sizes, add-ons, or customizations.
                </p>
              )}

              <Button variant="outline" className="w-full" onClick={() => openVariantDialog()}>
                <Plus className="w-4 h-4 mr-2" />
                Add Variant
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Variant Edit Dialog (B2) */}
      <Dialog open={variantDialogOpen} onOpenChange={setVariantDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingVariant ? "Edit Variant" : "New Variant"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Group Name *</Label>
              <Input
                value={varGroupName}
                onChange={(e) => setVarGroupName(e.target.value)}
                placeholder="e.g. Size, Spice Level, Add-ons"
                autoFocus
              />
              <p className="text-xs text-gray-400">Variants with the same group name are grouped together</p>
            </div>
            <div className="space-y-2">
              <Label>Option Name (English) *</Label>
              <Input
                value={varNameEn}
                onChange={(e) => setVarNameEn(e.target.value)}
                placeholder="e.g. Large, Extra Spicy, Add Egg"
              />
            </div>
            <div className="space-y-2">
              <Label>Option Name (Bahasa Malaysia)</Label>
              <Input
                value={varNameMs}
                onChange={(e) => setVarNameMs(e.target.value)}
                placeholder="e.g. Besar, Pedas Tambahan"
              />
            </div>
            <div className="space-y-2">
              <Label>Price Adjustment (RM)</Label>
              <Input
                type="number"
                step="0.10"
                value={varPrice}
                onChange={(e) => setVarPrice(e.target.value)}
                placeholder="0.00"
              />
              <p className="text-xs text-gray-400">Use negative values for discounts, 0 for no change</p>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="varDefault"
                checked={varIsDefault}
                onChange={(e) => setVarIsDefault(e.target.checked)}
                className="rounded border-gray-300"
              />
              <Label htmlFor="varDefault" className="text-sm">Default option (pre-selected)</Label>
            </div>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setVariantDialogOpen(false)}>Cancel</Button>
              <Button
                onClick={saveVariant}
                disabled={varSaving || !varGroupName.trim() || !varNameEn.trim()}
              >
                {varSaving ? "Saving..." : "Save"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
