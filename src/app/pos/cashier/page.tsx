"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { usePOSSession } from "@/hooks/use-pos-session";
import { toast } from "sonner";
import {
  Loader2,
  LogOut,
  User,
  Plus,
  Minus,
  Trash2,
  ShoppingCart,
  CreditCard,
  Banknote,
  QrCode,
  X,
  PencilLine,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { Category, MenuItem } from "@/types/database";

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  menuItemId: string | null;
  notes: string;
}

type PaymentMethod = "cash" | "card" | "e_wallet";

export default function CashierPage() {
  const { session, loading: sessionLoading, logout } = usePOSSession();
  const [categories, setCategories] = useState<Category[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // Cart
  const [cart, setCart] = useState<CartItem[]>([]);

  // Custom item dialog
  const [customDialogOpen, setCustomDialogOpen] = useState(false);
  const [customName, setCustomName] = useState("");
  const [customPrice, setCustomPrice] = useState("");

  // Order type
  const [orderType, setOrderType] = useState<"dine_in" | "takeaway" | "delivery">("dine_in");
  const [selectedTable, setSelectedTable] = useState<string>("");
  const [tables, setTables] = useState<{ id: string; table_number: string }[]>([]);

  // Payment
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cash");
  const [submitting, setSubmitting] = useState(false);

  // Tax
  const [taxRate, setTaxRate] = useState(0);

  const loadData = useCallback(async () => {
    if (!session?.outlet || !session?.store) return;
    const supabase = createClient();

    const [catRes, itemRes, tableRes, storeRes] = await Promise.all([
      supabase
        .from("categories")
        .select("*")
        .eq("store_id", session.staff.store_id)
        .eq("is_active", true)
        .order("sort_order", { ascending: true }),
      supabase
        .from("menu_items")
        .select("*")
        .eq("store_id", session.staff.store_id)
        .eq("is_available", true)
        .order("sort_order", { ascending: true }),
      supabase
        .from("tables")
        .select("id, table_number")
        .eq("outlet_id", session.outlet.id)
        .order("table_number", { ascending: true }),
      supabase
        .from("stores")
        .select("tax_rate")
        .eq("id", session.staff.store_id)
        .single(),
    ]);

    if (catRes.data) setCategories(catRes.data as Category[]);
    if (itemRes.data) setMenuItems(itemRes.data as MenuItem[]);
    if (tableRes.data) setTables(tableRes.data as { id: string; table_number: string }[]);
    if (storeRes.data && (storeRes.data as { tax_rate: number | null }).tax_rate) {
      setTaxRate(Number((storeRes.data as { tax_rate: number | null }).tax_rate));
    }
    setLoading(false);
  }, [session]);

  useEffect(() => {
    if (session) loadData();
  }, [session, loadData]);

  // Cart calculations
  const cartSubtotal = useMemo(
    () => cart.reduce((sum, item) => sum + item.price * item.quantity, 0),
    [cart]
  );
  const cartTax = useMemo(() => cartSubtotal * (taxRate / 100), [cartSubtotal, taxRate]);
  const cartTotal = useMemo(() => cartSubtotal + cartTax, [cartSubtotal, cartTax]);

  function addMenuItem(item: MenuItem) {
    setCart((prev) => {
      const existing = prev.find((c) => c.menuItemId === item.id && !c.notes);
      if (existing) {
        return prev.map((c) =>
          c.id === existing.id ? { ...c, quantity: c.quantity + 1 } : c
        );
      }
      return [...prev, {
        id: `${item.id}-${Date.now()}`,
        name: item.name_en,
        price: Number(item.base_price),
        quantity: 1,
        menuItemId: item.id,
        notes: "",
      }];
    });
  }

  function addCustomItem() {
    if (!customName.trim() || !customPrice) return;
    setCart((prev) => [...prev, {
      id: `custom-${Date.now()}`,
      name: customName.trim(),
      price: parseFloat(customPrice),
      quantity: 1,
      menuItemId: null,
      notes: "",
    }]);
    setCustomDialogOpen(false);
    setCustomName("");
    setCustomPrice("");
  }

  function updateQty(id: string, delta: number) {
    setCart((prev) =>
      prev
        .map((c) => c.id === id ? { ...c, quantity: Math.max(0, c.quantity + delta) } : c)
        .filter((c) => c.quantity > 0)
    );
  }

  function removeItem(id: string) {
    setCart((prev) => prev.filter((c) => c.id !== id));
  }

  async function submitOrder() {
    if (!session?.outlet || cart.length === 0) return;
    setSubmitting(true);
    const supabase = createClient();

    const now = new Date();
    const orderNum = `${now.getHours().toString().padStart(2, "0")}${now.getMinutes().toString().padStart(2, "0")}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

    const { data: order, error: orderErr } = await supabase
      .from("orders")
      .insert({
        outlet_id: session.outlet.id,
        order_number: orderNum,
        order_type: orderType,
        status: "pending",
        subtotal: cartSubtotal,
        tax: cartTax > 0 ? cartTax : null,
        total: cartTotal,
        table_id: orderType === "dine_in" && selectedTable ? selectedTable : null,
        payment_method: paymentMethod,
        payment_status: "paid",
      })
      .select("id")
      .single();

    if (orderErr || !order) {
      toast.error("Failed to create order");
      setSubmitting(false);
      return;
    }

    const orderId = (order as { id: string }).id;

    const orderItems = cart.map((item) => ({
      order_id: orderId,
      menu_item_id: item.menuItemId,
      item_name: item.name,
      quantity: item.quantity,
      unit_price: item.price,
      subtotal: item.price * item.quantity,
      special_instructions: item.notes || null,
    }));

    const { error: itemsErr } = await supabase.from("order_items").insert(orderItems);
    if (itemsErr) {
      toast.error("Failed to save order items");
      setSubmitting(false);
      return;
    }

    toast.success(`Order #${orderNum} created!`);
    setCart([]);
    setPaymentDialogOpen(false);
    setSubmitting(false);
  }

  const filteredItems = selectedCategory
    ? menuItems.filter((i) => i.category_id === selectedCategory)
    : menuItems;

  if (sessionLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
      </div>
    );
  }

  if (!session) return null;

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      {/* Top Bar */}
      <div className="bg-white border-b px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-600 to-accent-500 flex items-center justify-center">
            <span className="text-white font-bold text-sm">bx</span>
          </div>
          <div>
            <h1 className="text-sm font-bold text-gray-900">Cashier</h1>
            <p className="text-xs text-gray-500">{session.outlet?.name}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <User className="w-4 h-4" />
            <span>{session.staff.name}</span>
          </div>
          <button onClick={logout} className="p-2 rounded-lg hover:bg-gray-100 text-gray-500">
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Left: Menu Grid */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Category tabs */}
          <div className="bg-white border-b px-4 py-2 flex gap-2 overflow-x-auto flex-shrink-0">
            <button
              onClick={() => setSelectedCategory(null)}
              className={`flex-shrink-0 px-3 py-1.5 rounded-full text-sm font-medium ${
                selectedCategory === null ? "bg-primary-600 text-white" : "bg-gray-100 text-gray-600"
              }`}
            >
              All
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`flex-shrink-0 px-3 py-1.5 rounded-full text-sm font-medium ${
                  selectedCategory === cat.id ? "bg-primary-600 text-white" : "bg-gray-100 text-gray-600"
                }`}
              >
                {cat.name_en}
              </button>
            ))}
          </div>

          {/* Menu items grid */}
          <div className="flex-1 overflow-y-auto p-4">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {/* Custom item button */}
              <button
                onClick={() => setCustomDialogOpen(true)}
                className="h-24 rounded-xl border-2 border-dashed border-primary-300 bg-primary-50 flex flex-col items-center justify-center gap-1 hover:bg-primary-100 transition-colors"
              >
                <PencilLine className="w-5 h-5 text-primary-600" />
                <span className="text-xs font-medium text-primary-700">Custom Item</span>
              </button>

              {filteredItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => addMenuItem(item)}
                  className="h-24 rounded-xl border bg-white shadow-sm hover:shadow-md hover:border-primary-300 transition-all flex flex-col items-center justify-center p-2 text-center"
                >
                  <span className="text-sm font-medium text-gray-900 line-clamp-2">{item.name_en}</span>
                  <span className="text-xs font-bold text-primary-700 mt-1">
                    RM {Number(item.base_price).toFixed(2)}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Cart */}
        <div className="w-80 lg:w-96 bg-white border-l flex flex-col">
          {/* Order type selector */}
          <div className="p-3 border-b">
            <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
              {(["dine_in", "takeaway", "delivery"] as const).map((type) => (
                <button
                  key={type}
                  onClick={() => setOrderType(type)}
                  className={`flex-1 py-1.5 rounded-md text-xs font-medium transition-colors ${
                    orderType === type ? "bg-white shadow text-gray-900" : "text-gray-500"
                  }`}
                >
                  {type === "dine_in" ? "Dine In" : type === "takeaway" ? "Takeaway" : "Delivery"}
                </button>
              ))}
            </div>
            {orderType === "dine_in" && tables.length > 0 && (
              <select
                value={selectedTable}
                onChange={(e) => setSelectedTable(e.target.value)}
                className="mt-2 w-full h-9 rounded-md border border-input bg-background px-3 text-sm"
              >
                <option value="">Select Table</option>
                {tables.map((t) => (
                  <option key={t.id} value={t.id}>Table {t.table_number}</option>
                ))}
              </select>
            )}
          </div>

          {/* Cart items */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {cart.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-400">
                <ShoppingCart className="w-10 h-10 mb-2 opacity-50" />
                <p className="text-sm">Cart is empty</p>
                <p className="text-xs">Tap items to add</p>
              </div>
            ) : (
              cart.map((item) => (
                <div key={item.id} className="flex items-center gap-2 bg-gray-50 rounded-lg p-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{item.name}</p>
                    <p className="text-xs text-gray-400">RM {item.price.toFixed(2)} each</p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => updateQty(item.id, -1)}
                      className="w-6 h-6 rounded-full border border-gray-300 flex items-center justify-center text-gray-500"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="text-sm font-bold w-5 text-center">{item.quantity}</span>
                    <button
                      onClick={() => updateQty(item.id, 1)}
                      className="w-6 h-6 rounded-full bg-primary-600 text-white flex items-center justify-center"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                  <div className="text-right ml-1">
                    <p className="text-sm font-bold">RM {(item.price * item.quantity).toFixed(2)}</p>
                    <button onClick={() => removeItem(item.id)} className="text-red-400 hover:text-red-600">
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Cart totals + Pay button */}
          <div className="border-t p-3 space-y-2">
            <div className="flex justify-between text-sm text-gray-500">
              <span>Subtotal</span>
              <span>RM {cartSubtotal.toFixed(2)}</span>
            </div>
            {taxRate > 0 && (
              <div className="flex justify-between text-sm text-gray-500">
                <span>Tax ({taxRate}%)</span>
                <span>RM {cartTax.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-lg">
              <span>Total</span>
              <span className="text-primary-700">RM {cartTotal.toFixed(2)}</span>
            </div>
            <Button
              onClick={() => setPaymentDialogOpen(true)}
              disabled={cart.length === 0}
              className="w-full h-12 text-base bg-gradient-to-r from-primary-700 to-primary-500 hover:from-primary-600 hover:to-primary-400"
            >
              <CreditCard className="w-5 h-5 mr-2" />
              Pay RM {cartTotal.toFixed(2)}
            </Button>
          </div>
        </div>
      </div>

      {/* Custom Item Dialog */}
      <Dialog open={customDialogOpen} onOpenChange={setCustomDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Add Custom Item</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Item Name</label>
              <Input
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                placeholder="e.g. Nasi Campur"
                autoFocus
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Price (RM)</label>
              <Input
                type="number"
                step="0.10"
                min="0"
                value={customPrice}
                onChange={(e) => setCustomPrice(e.target.value)}
                placeholder="0.00"
              />
            </div>
            <Button onClick={addCustomItem} disabled={!customName.trim() || !customPrice} className="w-full">
              <Plus className="w-4 h-4 mr-2" />
              Add to Cart
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Payment Dialog */}
      <Dialog open={paymentDialogOpen} onOpenChange={setPaymentDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Payment</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="text-center">
              <p className="text-sm text-gray-500">Total Amount</p>
              <p className="text-3xl font-bold text-primary-700">RM {cartTotal.toFixed(2)}</p>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Payment Method</label>
              <div className="grid grid-cols-3 gap-2">
                {([
                  { key: "cash" as PaymentMethod, label: "Cash", icon: Banknote },
                  { key: "card" as PaymentMethod, label: "Card", icon: CreditCard },
                  { key: "e_wallet" as PaymentMethod, label: "E-Wallet", icon: QrCode },
                ]).map(({ key, label, icon: Icon }) => (
                  <button
                    key={key}
                    onClick={() => setPaymentMethod(key)}
                    className={`flex flex-col items-center gap-1 py-3 rounded-lg border text-sm font-medium transition-colors ${
                      paymentMethod === key
                        ? "bg-primary-50 border-primary-500 text-primary-700"
                        : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    {label}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setPaymentDialogOpen(false)}>
                <X className="w-4 h-4 mr-1" />
                Cancel
              </Button>
              <Button
                className="flex-1 bg-gradient-to-r from-primary-700 to-primary-500"
                onClick={submitOrder}
                disabled={submitting}
              >
                {submitting ? (
                  <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                ) : (
                  <CreditCard className="w-4 h-4 mr-1" />
                )}
                Confirm
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
