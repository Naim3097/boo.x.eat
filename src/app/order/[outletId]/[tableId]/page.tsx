"use client";

import { useEffect, useState, useMemo } from "react";
import { useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  ShoppingCart,
  Plus,
  Minus,
  Loader2,
  ImageIcon,
  Check,
  X,
} from "lucide-react";
import type { Category, MenuItem } from "@/types/database";

interface CartItem {
  menuItem: MenuItem;
  quantity: number;
  notes: string;
}

interface OutletInfo {
  id: string;
  name: string;
  store_id: string;
  stores: { name: string; business_model: string } | null;
}

interface TableInfo {
  id: string;
  table_number: string;
}

export default function OrderPage() {
  const params = useParams();
  const outletId = params.outletId as string;
  const tableId = params.tableId as string;

  const [outlet, setOutlet] = useState<OutletInfo | null>(null);
  const [table, setTable] = useState<TableInfo | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [ordering, setOrdering] = useState(false);
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [orderNumber, setOrderNumber] = useState("");

  // Note input for specific item
  const [noteItemId, setNoteItemId] = useState<string | null>(null);
  const [noteText, setNoteText] = useState("");

  useEffect(() => {
    async function loadData() {
      const supabase = createClient();

      // Fetch outlet with store info
      const { data: outletData, error: outletErr } = await supabase
        .from("outlets")
        .select("id, name, store_id, stores(name, business_model)")
        .eq("id", outletId)
        .single();

      if (outletErr || !outletData) {
        setError("Restaurant not found");
        setLoading(false);
        return;
      }

      // Fetch table
      const { data: tableData, error: tableErr } = await supabase
        .from("tables")
        .select("id, table_number")
        .eq("id", tableId)
        .eq("outlet_id", outletId)
        .single();

      if (tableErr || !tableData) {
        setError("Table not found");
        setLoading(false);
        return;
      }

      setOutlet(outletData as unknown as OutletInfo);
      setTable(tableData as unknown as TableInfo);

      // Fetch categories and menu items
      const [catRes, itemRes] = await Promise.all([
        supabase
          .from("categories")
          .select("*")
          .eq("store_id", outletData.store_id)
          .eq("is_active", true)
          .order("sort_order", { ascending: true })
          .returns<Category[]>(),
        supabase
          .from("menu_items")
          .select("*")
          .eq("store_id", outletData.store_id)
          .eq("is_available", true)
          .order("sort_order", { ascending: true })
          .returns<MenuItem[]>(),
      ]);

      if (catRes.data) setCategories(catRes.data);
      if (itemRes.data) setMenuItems(itemRes.data);
      setLoading(false);
    }

    loadData();
  }, [outletId, tableId]);

  // Cart helpers
  const cartCount = useMemo(
    () => cart.reduce((sum, item) => sum + item.quantity, 0),
    [cart]
  );

  const cartTotal = useMemo(
    () => cart.reduce((sum, item) => sum + Number(item.menuItem.base_price) * item.quantity, 0),
    [cart]
  );

  function addToCart(menuItem: MenuItem) {
    setCart((prev) => {
      const existing = prev.find((c) => c.menuItem.id === menuItem.id);
      if (existing) {
        return prev.map((c) =>
          c.menuItem.id === menuItem.id ? { ...c, quantity: c.quantity + 1 } : c
        );
      }
      return [...prev, { menuItem, quantity: 1, notes: "" }];
    });
  }

  function removeFromCart(menuItemId: string) {
    setCart((prev) => {
      const existing = prev.find((c) => c.menuItem.id === menuItemId);
      if (existing && existing.quantity > 1) {
        return prev.map((c) =>
          c.menuItem.id === menuItemId ? { ...c, quantity: c.quantity - 1 } : c
        );
      }
      return prev.filter((c) => c.menuItem.id !== menuItemId);
    });
  }

  function getCartQuantity(menuItemId: string): number {
    return cart.find((c) => c.menuItem.id === menuItemId)?.quantity || 0;
  }

  function updateNote(menuItemId: string, note: string) {
    setCart((prev) =>
      prev.map((c) =>
        c.menuItem.id === menuItemId ? { ...c, notes: note } : c
      )
    );
  }

  // Filter items by category
  const filteredItems = selectedCategory
    ? menuItems.filter((i) => i.category_id === selectedCategory)
    : menuItems;

  // Place order
  async function placeOrder() {
    if (cart.length === 0 || !outlet || !table) return;
    setOrdering(true);

    try {
      const supabase = createClient();

      // Generate order number (timestamp-based)
      const now = new Date();
      const orderNum = `${now.getHours().toString().padStart(2, "0")}${now.getMinutes().toString().padStart(2, "0")}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

      // Create order
      const { data: order, error: orderErr } = await supabase
        .from("orders")
        .insert({
          outlet_id: outletId,
          table_id: tableId,
          order_number: orderNum,
          status: "pending",
          subtotal: cartTotal,
          total: cartTotal,
          order_type: "dine_in",
        })
        .select("id")
        .single();

      if (orderErr || !order) throw orderErr || new Error("Failed to create order");

      // Create order items
      const orderItems = cart.map((item) => ({
        order_id: (order as { id: string }).id,
        menu_item_id: item.menuItem.id,
        item_name: item.menuItem.name_en,
        quantity: item.quantity,
        unit_price: Number(item.menuItem.base_price),
        subtotal: Number(item.menuItem.base_price) * item.quantity,
        special_instructions: item.notes || null,
      }));

      const { error: itemsErr } = await supabase
        .from("order_items")
        .insert(orderItems);

      if (itemsErr) throw itemsErr;

      setOrderNumber(orderNum);
      setOrderPlaced(true);
      setCart([]);
      setCartOpen(false);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to place order";
      toast.error(message);
    } finally {
      setOrdering(false);
    }
  }

  // ========== LOADING / ERROR STATES ==========

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary-600 mx-auto mb-3" />
          <p className="text-sm text-gray-500">Loading menu...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white px-4">
        <div className="text-center">
          <p className="text-lg font-semibold text-gray-900 mb-2">Oops!</p>
          <p className="text-gray-500">{error}</p>
        </div>
      </div>
    );
  }

  // ========== ORDER SUCCESS ==========

  if (orderPlaced) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-primary-50 px-4">
        <div className="text-center max-w-sm">
          <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6">
            <Check className="w-10 h-10 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Order Placed!</h1>
          <p className="text-gray-500 mb-4">
            Your order <span className="font-mono font-bold text-primary-700">#{orderNumber}</span> has been sent to the kitchen.
          </p>
          <p className="text-sm text-gray-400 mb-8">
            Table {table?.table_number} &middot; {outlet?.name}
          </p>
          <Button
            onClick={() => {
              setOrderPlaced(false);
              setOrderNumber("");
            }}
            className="bg-gradient-to-r from-primary-700 to-primary-500"
          >
            Order More
          </Button>
        </div>
      </div>
    );
  }

  // ========== MAIN ORDERING UI ==========

  const storeName = (outlet?.stores as { name: string } | null)?.name || outlet?.name || "Restaurant";

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-white border-b shadow-sm">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="font-bold text-gray-900 text-lg">{storeName}</h1>
              <p className="text-xs text-gray-500">
                Table {table?.table_number} &middot; {outlet?.name}
              </p>
            </div>
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-600 to-accent-500 flex items-center justify-center">
              <span className="text-white font-bold text-sm">bx</span>
            </div>
          </div>
        </div>

        {/* Category tabs */}
        {categories.length > 0 && (
          <div className="flex overflow-x-auto gap-2 px-4 pb-3 scrollbar-hide">
            <button
              onClick={() => setSelectedCategory(null)}
              className={`flex-shrink-0 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                selectedCategory === null
                  ? "bg-primary-600 text-white"
                  : "bg-gray-100 text-gray-600"
              }`}
            >
              All
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`flex-shrink-0 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  selectedCategory === cat.id
                    ? "bg-primary-600 text-white"
                    : "bg-gray-100 text-gray-600"
                }`}
              >
                {cat.name_en}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Menu Items */}
      <div className="px-4 py-4 space-y-3">
        {filteredItems.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <p>No items available</p>
          </div>
        ) : (
          filteredItems.map((item) => {
            const qty = getCartQuantity(item.id);
            return (
              <div
                key={item.id}
                className="bg-white rounded-xl border shadow-sm flex overflow-hidden"
              >
                {/* Image */}
                {item.image_url ? (
                  <div className="w-28 h-28 flex-shrink-0">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={item.image_url}
                      alt={item.name_en}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="w-28 h-28 flex-shrink-0 bg-gray-100 flex items-center justify-center">
                    <ImageIcon className="w-8 h-8 text-gray-300" />
                  </div>
                )}

                {/* Info */}
                <div className="flex-1 p-3 flex flex-col justify-between min-w-0">
                  <div>
                    <h3 className="font-semibold text-gray-900 text-sm truncate">
                      {item.name_en}
                    </h3>
                    {item.name_ms && (
                      <p className="text-xs text-gray-400 truncate">{item.name_ms}</p>
                    )}
                    {item.description_en && (
                      <p className="text-xs text-gray-400 line-clamp-1 mt-0.5">
                        {item.description_en}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <span className="font-bold text-primary-700 text-sm">
                      RM {Number(item.base_price).toFixed(2)}
                    </span>
                    {qty === 0 ? (
                      <button
                        onClick={() => addToCart(item)}
                        className="w-8 h-8 rounded-full bg-primary-600 text-white flex items-center justify-center hover:bg-primary-700 transition-colors"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    ) : (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => removeFromCart(item.id)}
                          className="w-7 h-7 rounded-full border-2 border-primary-600 text-primary-600 flex items-center justify-center"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="text-sm font-bold w-5 text-center">{qty}</span>
                        <button
                          onClick={() => addToCart(item)}
                          className="w-7 h-7 rounded-full bg-primary-600 text-white flex items-center justify-center"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Cart Footer Bar */}
      {cartCount > 0 && !cartOpen && (
        <div className="fixed bottom-0 left-0 right-0 z-50 p-4 bg-white border-t shadow-lg">
          <button
            onClick={() => setCartOpen(true)}
            className="w-full bg-gradient-to-r from-primary-700 to-primary-500 text-white rounded-xl py-3 px-4 flex items-center justify-between font-medium"
          >
            <div className="flex items-center gap-2">
              <ShoppingCart className="w-5 h-5" />
              <span>{cartCount} item{cartCount > 1 ? "s" : ""}</span>
            </div>
            <span className="font-bold">RM {cartTotal.toFixed(2)}</span>
          </button>
        </div>
      )}

      {/* Cart Drawer */}
      {cartOpen && (
        <div className="fixed inset-0 z-50">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setCartOpen(false)}
          />
          {/* Drawer */}
          <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-2xl max-h-[85vh] flex flex-col animate-in slide-in-from-bottom">
            {/* Handle */}
            <div className="flex justify-center py-2">
              <div className="w-10 h-1 rounded-full bg-gray-300" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-4 pb-3 border-b">
              <h2 className="text-lg font-bold text-gray-900">Your Order</h2>
              <button
                onClick={() => setCartOpen(false)}
                className="p-1.5 hover:bg-gray-100 rounded-full"
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            {/* Items */}
            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
              {cart.map((cartItem) => (
                <div key={cartItem.menuItem.id} className="flex gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <div className="min-w-0">
                        <p className="font-medium text-gray-900 text-sm truncate">
                          {cartItem.menuItem.name_en}
                        </p>
                        <p className="text-xs text-gray-400">
                          RM {Number(cartItem.menuItem.base_price).toFixed(2)} each
                        </p>
                      </div>
                      <p className="font-bold text-sm text-gray-900 ml-2">
                        RM {(Number(cartItem.menuItem.base_price) * cartItem.quantity).toFixed(2)}
                      </p>
                    </div>

                    {/* Notes */}
                    {cartItem.notes && (
                      <p className="text-xs text-primary-600 mt-1">
                        Note: {cartItem.notes}
                      </p>
                    )}

                    <div className="flex items-center justify-between mt-2">
                      <button
                        onClick={() => {
                          setNoteItemId(
                            noteItemId === cartItem.menuItem.id ? null : cartItem.menuItem.id
                          );
                          setNoteText(cartItem.notes);
                        }}
                        className="text-xs text-primary-600 hover:underline"
                      >
                        {cartItem.notes ? "Edit note" : "Add note"}
                      </button>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => removeFromCart(cartItem.menuItem.id)}
                          className="w-7 h-7 rounded-full border-2 border-gray-300 text-gray-500 flex items-center justify-center"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="text-sm font-bold w-5 text-center">
                          {cartItem.quantity}
                        </span>
                        <button
                          onClick={() => addToCart(cartItem.menuItem)}
                          className="w-7 h-7 rounded-full bg-primary-600 text-white flex items-center justify-center"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                    </div>

                    {/* Note input */}
                    {noteItemId === cartItem.menuItem.id && (
                      <div className="mt-2 flex gap-2">
                        <input
                          type="text"
                          value={noteText}
                          onChange={(e) => setNoteText(e.target.value)}
                          placeholder="e.g. No spice, extra sambal"
                          className="flex-1 text-sm border rounded-lg px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-primary-500"
                          autoFocus
                        />
                        <button
                          onClick={() => {
                            updateNote(cartItem.menuItem.id, noteText);
                            setNoteItemId(null);
                          }}
                          className="px-3 py-1.5 bg-primary-600 text-white text-sm rounded-lg"
                        >
                          Save
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Total + Place Order */}
            <div className="border-t px-4 py-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-gray-500">Total</span>
                <span className="text-xl font-bold text-gray-900">
                  RM {cartTotal.toFixed(2)}
                </span>
              </div>
              <Button
                onClick={placeOrder}
                disabled={ordering}
                className="w-full h-12 text-base bg-gradient-to-r from-primary-700 to-primary-500 hover:from-primary-600 hover:to-primary-400"
              >
                {ordering ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Placing Order...
                  </>
                ) : (
                  <>
                    <ShoppingCart className="w-4 h-4 mr-2" />
                    Place Order
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
