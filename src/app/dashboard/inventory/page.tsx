"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { useStore } from "@/hooks/use-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
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
  Package,
  Loader2,
  ArrowDownToLine,
  ArrowUpFromLine,
  AlertTriangle,
  History,
  Link2,
} from "lucide-react";
import { UpgradePrompt } from "@/components/ui/upgrade-prompt";

interface InventoryItem {
  id: string;
  outlet_id: string;
  name: string;
  sku: string | null;
  unit: string;
  current_stock: number;
  low_stock_threshold: number;
  cost_per_unit: number;
  is_active: boolean;
  created_at: string;
}

interface InventoryTransaction {
  id: string;
  inventory_item_id: string;
  type: string;
  quantity: number;
  notes: string | null;
  created_at: string;
}

interface MenuItemIngredient {
  id: string;
  menu_item_id: string;
  inventory_item_id: string;
  quantity_used: number;
}

type StockFilter = "all" | "low" | "out";

export default function InventoryPage() {
  const { store, outlet, tierLimits, loading: storeLoading } = useStore();
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<StockFilter>("all");

  // Item dialog
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<InventoryItem | null>(null);
  const [itemName, setItemName] = useState("");
  const [itemSku, setItemSku] = useState("");
  const [itemUnit, setItemUnit] = useState("pcs");
  const [itemStock, setItemStock] = useState("0");
  const [itemThreshold, setItemThreshold] = useState("10");
  const [itemCost, setItemCost] = useState("0");
  const [saving, setSaving] = useState(false);

  // Restock/Adjust dialog
  const [stockDialogItem, setStockDialogItem] = useState<InventoryItem | null>(null);
  const [stockType, setStockType] = useState<"restock" | "adjustment" | "waste">("restock");
  const [stockQty, setStockQty] = useState("");
  const [stockNotes, setStockNotes] = useState("");
  const [stockSaving, setStockSaving] = useState(false);

  // Transaction history dialog
  const [historyItem, setHistoryItem] = useState<InventoryItem | null>(null);
  const [transactions, setTransactions] = useState<InventoryTransaction[]>([]);

  // Ingredient linking dialog
  const [ingredientItem, setIngredientItem] = useState<InventoryItem | null>(null);
  const [ingredients, setIngredients] = useState<MenuItemIngredient[]>([]);
  const [menuItemsForLink, setMenuItemsForLink] = useState<{ id: string; name_en: string }[]>([]);
  const [selectedMenuItemId, setSelectedMenuItemId] = useState("");
  const [ingredientQty, setIngredientQty] = useState("1");

  const loadData = useCallback(async () => {
    if (!outlet) return;
    const supabase = createClient();
    const { data } = await supabase
      .from("inventory_items")
      .select("*")
      .eq("outlet_id", outlet.id)
      .order("name", { ascending: true });
    if (data) setItems(data as InventoryItem[]);
    setLoading(false);
  }, [outlet]);

  useEffect(() => {
    if (outlet) loadData();
    else setLoading(false);
  }, [outlet, loadData]);

  if (!tierLimits.hasInventory) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Inventory</h1>
          <p className="text-sm text-muted-foreground">Track stock levels and manage ingredients.</p>
        </div>
        <UpgradePrompt
          feature="Inventory Tracking"
          requiredTier="growth"
          currentTier={store?.subscription_tier || "starter"}
        />
      </div>
    );
  }

  function openDialog(item?: InventoryItem) {
    if (item) {
      setEditing(item);
      setItemName(item.name);
      setItemSku(item.sku || "");
      setItemUnit(item.unit);
      setItemStock(String(item.current_stock));
      setItemThreshold(String(item.low_stock_threshold));
      setItemCost(String(item.cost_per_unit));
    } else {
      setEditing(null);
      setItemName("");
      setItemSku("");
      setItemUnit("pcs");
      setItemStock("0");
      setItemThreshold("10");
      setItemCost("0");
    }
    setDialogOpen(true);
  }

  async function saveItem() {
    if (!outlet || !itemName.trim()) return;
    setSaving(true);
    const supabase = createClient();

    const payload = {
      outlet_id: outlet.id,
      name: itemName.trim(),
      sku: itemSku.trim() || null,
      unit: itemUnit,
      current_stock: parseFloat(itemStock) || 0,
      low_stock_threshold: parseFloat(itemThreshold) || 10,
      cost_per_unit: parseFloat(itemCost) || 0,
    };

    if (editing) {
      const { error } = await supabase.from("inventory_items").update(payload).eq("id", editing.id);
      if (error) { toast.error(error.message); setSaving(false); return; }
      toast.success("Inventory item updated");
    } else {
      const { error } = await supabase.from("inventory_items").insert(payload);
      if (error) { toast.error(error.message); setSaving(false); return; }
      toast.success("Inventory item created");
    }

    setDialogOpen(false);
    setSaving(false);
    loadData();
  }

  async function deleteItem(id: string) {
    if (!confirm("Delete this inventory item?")) return;
    const supabase = createClient();
    const { error } = await supabase.from("inventory_items").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success("Item deleted");
    loadData();
  }

  async function adjustStock() {
    if (!stockDialogItem || !stockQty) return;
    setStockSaving(true);
    const supabase = createClient();
    const qty = parseFloat(stockQty);

    // Create transaction
    const { error: txError } = await supabase.from("inventory_transactions").insert({
      inventory_item_id: stockDialogItem.id,
      type: stockType,
      quantity: stockType === "waste" ? -Math.abs(qty) : qty,
      notes: stockNotes.trim() || null,
    });
    if (txError) { toast.error(txError.message); setStockSaving(false); return; }

    // Update stock
    const newStock = stockType === "waste"
      ? stockDialogItem.current_stock - Math.abs(qty)
      : stockDialogItem.current_stock + qty;

    const { error } = await supabase
      .from("inventory_items")
      .update({ current_stock: Math.max(0, newStock) })
      .eq("id", stockDialogItem.id);
    if (error) { toast.error(error.message); setStockSaving(false); return; }

    toast.success("Stock updated");
    setStockDialogItem(null);
    setStockQty("");
    setStockNotes("");
    setStockSaving(false);
    loadData();
  }

  async function loadHistory(item: InventoryItem) {
    setHistoryItem(item);
    const supabase = createClient();
    const { data } = await supabase
      .from("inventory_transactions")
      .select("*")
      .eq("inventory_item_id", item.id)
      .order("created_at", { ascending: false })
      .limit(50);
    if (data) setTransactions(data as InventoryTransaction[]);
  }

  async function openIngredientLink(item: InventoryItem) {
    setIngredientItem(item);
    const supabase = createClient();

    const [ingRes, menuRes] = await Promise.all([
      supabase.from("menu_item_ingredients").select("*").eq("inventory_item_id", item.id),
      supabase.from("menu_items").select("id, name_en").eq("store_id", store!.id).order("name_en"),
    ]);

    if (ingRes.data) setIngredients(ingRes.data as MenuItemIngredient[]);
    if (menuRes.data) setMenuItemsForLink(menuRes.data as { id: string; name_en: string }[]);
  }

  async function addIngredientLink() {
    if (!ingredientItem || !selectedMenuItemId) return;
    const supabase = createClient();
    const { error } = await supabase.from("menu_item_ingredients").insert({
      menu_item_id: selectedMenuItemId,
      inventory_item_id: ingredientItem.id,
      quantity_used: parseFloat(ingredientQty) || 1,
    });
    if (error) { toast.error(error.message); return; }
    toast.success("Ingredient linked");
    openIngredientLink(ingredientItem);
    setSelectedMenuItemId("");
    setIngredientQty("1");
  }

  async function removeIngredientLink(id: string) {
    const supabase = createClient();
    const { error } = await supabase.from("menu_item_ingredients").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success("Link removed");
    if (ingredientItem) openIngredientLink(ingredientItem);
  }

  function getStockColor(item: InventoryItem): string {
    if (item.current_stock <= 0) return "text-red-600 bg-red-50";
    if (item.current_stock <= item.low_stock_threshold) return "text-amber-600 bg-amber-50";
    return "text-green-600 bg-green-50";
  }

  const filteredItems = items.filter((item) => {
    if (filter === "low") return item.current_stock > 0 && item.current_stock <= item.low_stock_threshold;
    if (filter === "out") return item.current_stock <= 0;
    return true;
  });

  const lowStockCount = items.filter((i) => i.current_stock > 0 && i.current_stock <= i.low_stock_threshold).length;
  const outOfStockCount = items.filter((i) => i.current_stock <= 0).length;

  if (storeLoading || loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 animate-spin text-primary-600" />
      </div>
    );
  }

  if (!outlet) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Inventory</h1>
          <p className="text-sm text-muted-foreground">Select an outlet to manage inventory.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Inventory</h1>
          <p className="text-sm text-muted-foreground">
            Track stock levels for {outlet.name}.
          </p>
        </div>
        <Button
          onClick={() => openDialog()}
          className="bg-gradient-to-r from-primary-700 to-primary-500 hover:from-primary-600 hover:to-primary-400"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Item
        </Button>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2">
        {([
          { key: "all" as StockFilter, label: "All", count: items.length },
          { key: "low" as StockFilter, label: "Low Stock", count: lowStockCount },
          { key: "out" as StockFilter, label: "Out of Stock", count: outOfStockCount },
        ]).map((tab) => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
              filter === tab.key
                ? "bg-primary-600 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {tab.label}
            {tab.count > 0 && (
              <span className={`ml-1.5 ${filter === tab.key ? "text-primary-200" : "text-gray-400"}`}>
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Items Table */}
      {filteredItems.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Package className="w-12 h-12 text-gray-200 mb-4" />
            <p className="text-gray-500 mb-4">
              {filter === "all" ? "No inventory items yet" : `No ${filter === "low" ? "low stock" : "out of stock"} items`}
            </p>
            {filter === "all" && (
              <Button onClick={() => openDialog()} variant="outline">
                <Plus className="w-4 h-4 mr-2" />
                Add your first item
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="bg-white rounded-lg border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-left">
                  <th className="px-4 py-3 font-medium text-gray-500">Item</th>
                  <th className="px-4 py-3 font-medium text-gray-500">SKU</th>
                  <th className="px-4 py-3 font-medium text-gray-500">Stock</th>
                  <th className="px-4 py-3 font-medium text-gray-500">Unit</th>
                  <th className="px-4 py-3 font-medium text-gray-500">Cost</th>
                  <th className="px-4 py-3 font-medium text-gray-500 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredItems.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {item.current_stock <= item.low_stock_threshold && (
                          <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0" />
                        )}
                        <span className="font-medium text-gray-900">{item.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-500">{item.sku || "—"}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getStockColor(item)}`}>
                        {Number(item.current_stock).toFixed(1)}
                      </span>
                      <span className="text-xs text-gray-400 ml-1">/ {Number(item.low_stock_threshold)}</span>
                    </td>
                    <td className="px-4 py-3 text-gray-500">{item.unit}</td>
                    <td className="px-4 py-3 text-gray-500">RM {Number(item.cost_per_unit).toFixed(2)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => { setStockDialogItem(item); setStockType("restock"); }}
                          className="p-1.5 hover:bg-green-50 rounded text-green-600"
                          title="Restock"
                        >
                          <ArrowDownToLine className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => { setStockDialogItem(item); setStockType("waste"); }}
                          className="p-1.5 hover:bg-red-50 rounded text-red-500"
                          title="Record waste"
                        >
                          <ArrowUpFromLine className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => loadHistory(item)}
                          className="p-1.5 hover:bg-gray-100 rounded text-gray-400"
                          title="History"
                        >
                          <History className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => openIngredientLink(item)}
                          className="p-1.5 hover:bg-gray-100 rounded text-gray-400"
                          title="Link to menu items"
                        >
                          <Link2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => openDialog(item)}
                          className="p-1.5 hover:bg-gray-100 rounded text-gray-400"
                          title="Edit"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => deleteItem(item.id)}
                          className="p-1.5 hover:bg-red-50 rounded text-red-500"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add/Edit Item Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Inventory Item" : "New Inventory Item"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Item Name *</Label>
              <Input value={itemName} onChange={(e) => setItemName(e.target.value)} placeholder="e.g. Chicken Breast" autoFocus />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>SKU</Label>
                <Input value={itemSku} onChange={(e) => setItemSku(e.target.value)} placeholder="e.g. CHK-001" />
              </div>
              <div className="space-y-2">
                <Label>Unit</Label>
                <select
                  value={itemUnit}
                  onChange={(e) => setItemUnit(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="pcs">Pieces</option>
                  <option value="kg">Kilograms</option>
                  <option value="g">Grams</option>
                  <option value="L">Liters</option>
                  <option value="ml">Milliliters</option>
                  <option value="packs">Packs</option>
                  <option value="bottles">Bottles</option>
                  <option value="cans">Cans</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Current Stock</Label>
                <Input type="number" step="0.1" min="0" value={itemStock} onChange={(e) => setItemStock(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Low Stock At</Label>
                <Input type="number" step="0.1" min="0" value={itemThreshold} onChange={(e) => setItemThreshold(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Cost/Unit (RM)</Label>
                <Input type="number" step="0.01" min="0" value={itemCost} onChange={(e) => setItemCost(e.target.value)} />
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button onClick={saveItem} disabled={saving || !itemName.trim()}>
                {saving ? "Saving..." : "Save"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Stock Adjust Dialog */}
      <Dialog open={!!stockDialogItem} onOpenChange={() => setStockDialogItem(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>
              {stockType === "restock" ? "Restock" : stockType === "waste" ? "Record Waste" : "Adjust Stock"}
              {" — "}{stockDialogItem?.name}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-gray-500">
              Current stock: <span className="font-bold">{Number(stockDialogItem?.current_stock || 0).toFixed(1)} {stockDialogItem?.unit}</span>
            </p>
            <div className="space-y-2">
              <Label>Quantity</Label>
              <Input
                type="number"
                step="0.1"
                min="0"
                value={stockQty}
                onChange={(e) => setStockQty(e.target.value)}
                placeholder="Enter quantity"
                autoFocus
              />
            </div>
            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea
                value={stockNotes}
                onChange={(e) => setStockNotes(e.target.value)}
                placeholder="e.g. Supplier delivery, Expired items..."
                rows={2}
              />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setStockDialogItem(null)}>Cancel</Button>
              <Button
                className={`flex-1 ${stockType === "waste" ? "bg-red-600 hover:bg-red-700" : ""}`}
                onClick={adjustStock}
                disabled={stockSaving || !stockQty}
              >
                {stockSaving ? "Saving..." : stockType === "restock" ? "Add Stock" : "Record Waste"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Transaction History Dialog */}
      <Dialog open={!!historyItem} onOpenChange={() => setHistoryItem(null)}>
        <DialogContent className="max-w-md max-h-[70vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Stock History — {historyItem?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            {transactions.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-4">No transactions yet</p>
            ) : (
              transactions.map((tx) => (
                <div key={tx.id} className="flex items-center justify-between py-2 border-b last:border-0 text-sm">
                  <div>
                    <span className={`font-medium capitalize ${
                      tx.type === "restock" ? "text-green-600" :
                      tx.type === "deduction" ? "text-blue-600" :
                      tx.type === "waste" ? "text-red-600" : "text-gray-600"
                    }`}>
                      {tx.type}
                    </span>
                    {tx.notes && <p className="text-xs text-gray-400">{tx.notes}</p>}
                    <p className="text-xs text-gray-400">
                      {new Date(tx.created_at).toLocaleDateString("en-MY", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                  <span className={`font-mono font-bold ${Number(tx.quantity) >= 0 ? "text-green-600" : "text-red-600"}`}>
                    {Number(tx.quantity) >= 0 ? "+" : ""}{Number(tx.quantity).toFixed(1)}
                  </span>
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Ingredient Link Dialog */}
      <Dialog open={!!ingredientItem} onOpenChange={() => setIngredientItem(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Link to Menu Items — {ingredientItem?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-xs text-gray-400">
              When an order is completed, stock will be auto-deducted based on these links.
            </p>

            {/* Existing links */}
            {ingredients.length > 0 && (
              <div className="space-y-2">
                {ingredients.map((ing) => {
                  const menuItem = menuItemsForLink.find((m) => m.id === ing.menu_item_id);
                  return (
                    <div key={ing.id} className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2 text-sm">
                      <div>
                        <span className="font-medium">{menuItem?.name_en || "Unknown"}</span>
                        <span className="text-gray-400 ml-2">
                          uses {Number(ing.quantity_used)} {ingredientItem?.unit}
                        </span>
                      </div>
                      <button onClick={() => removeIngredientLink(ing.id)} className="p-1 hover:bg-red-100 rounded">
                        <Trash2 className="w-3 h-3 text-red-500" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Add new link */}
            <div className="flex gap-2">
              <select
                value={selectedMenuItemId}
                onChange={(e) => setSelectedMenuItemId(e.target.value)}
                className="flex-1 h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="">Select menu item...</option>
                {menuItemsForLink
                  .filter((m) => !ingredients.some((i) => i.menu_item_id === m.id))
                  .map((m) => (
                    <option key={m.id} value={m.id}>{m.name_en}</option>
                  ))}
              </select>
              <Input
                type="number"
                step="0.1"
                min="0.1"
                value={ingredientQty}
                onChange={(e) => setIngredientQty(e.target.value)}
                className="w-20"
                placeholder="Qty"
              />
              <Button onClick={addIngredientLink} disabled={!selectedMenuItemId} size="sm">
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
