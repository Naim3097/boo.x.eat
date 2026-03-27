"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
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
  Clock,
  ChefHat,
  UtensilsCrossed,
  Globe,
  FileText,
  CreditCard,
} from "lucide-react";
import type { Category, MenuItem, Variant, Order } from "@/types/database";

type Lang = "en" | "ms";

interface SelectedVariant {
  group_name: string;
  variant_id: string;
  name_en: string;
  name_ms: string | null;
  price_adjustment: number;
}

interface CartItem {
  menuItem: MenuItem;
  quantity: number;
  notes: string;
  selectedVariants: SelectedVariant[];
  cartKey: string; // unique key combining item + variants
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

const STATUS_DISPLAY: Record<string, { label_en: string; label_ms: string; color: string; icon: React.ElementType }> = {
  pending: { label_en: "Received", label_ms: "Diterima", color: "text-yellow-600", icon: Clock },
  preparing: { label_en: "Preparing", label_ms: "Sedang Disediakan", color: "text-blue-600", icon: ChefHat },
  ready: { label_en: "Ready to Serve", label_ms: "Sedia untuk Dihidang", color: "text-green-600", icon: UtensilsCrossed },
  completed: { label_en: "Completed", label_ms: "Selesai", color: "text-gray-500", icon: Check },
};

export default function OrderPage() {
  const params = useParams();
  const outletId = params.outletId as string;
  const tableId = params.tableId as string;

  const [outlet, setOutlet] = useState<OutletInfo | null>(null);
  const [table, setTable] = useState<TableInfo | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [variants, setVariants] = useState<Variant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [taxRate, setTaxRate] = useState(0); // percentage e.g. 6

  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [ordering, setOrdering] = useState(false);

  // Order tracking state (B5)
  const [activeOrder, setActiveOrder] = useState<Order | null>(null);
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [orderNumber, setOrderNumber] = useState("");
  const [orderId, setOrderId] = useState<string | null>(null);

  // Bilingual support (B6)
  const [lang, setLang] = useState<Lang>("en");

  // Variant selection dialog (B2)
  const [variantItem, setVariantItem] = useState<MenuItem | null>(null);
  const [variantSelections, setVariantSelections] = useState<Record<string, string>>({});

  // Note input
  const [noteItemKey, setNoteItemKey] = useState<string | null>(null);
  const [noteText, setNoteText] = useState("");

  // Initialize language from localStorage (B6)
  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("booxeat-lang");
      if (saved === "ms" || saved === "en") setLang(saved);
    }
  }, []);

  function toggleLang() {
    const newLang = lang === "en" ? "ms" : "en";
    setLang(newLang);
    if (typeof window !== "undefined") {
      localStorage.setItem("booxeat-lang", newLang);
    }
  }

  // Helper to get bilingual text
  function t(en: string | null, ms: string | null): string {
    if (lang === "ms" && ms) return ms;
    return en || "";
  }

  useEffect(() => {
    async function loadData() {
      const supabase = createClient();

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

      // Fetch tax rate from store
      const { data: storeData } = await supabase
        .from("stores")
        .select("tax_rate")
        .eq("id", outletData.store_id)
        .single();
      if (storeData && (storeData as { tax_rate: number | null }).tax_rate) {
        setTaxRate(Number((storeData as { tax_rate: number | null }).tax_rate));
      }

      const [catRes, itemRes, varRes, overrideRes] = await Promise.all([
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
        supabase
          .from("variants")
          .select("*")
          .eq("is_available", true)
          .order("sort_order", { ascending: true })
          .returns<Variant[]>(),
        supabase
          .from("outlet_menu_overrides")
          .select("*")
          .eq("outlet_id", outletId),
      ]);

      if (catRes.data) setCategories(catRes.data);

      // Apply outlet overrides to menu items
      let items = itemRes.data || [];
      const overrides = (overrideRes.data || []) as { menu_item_id: string; is_available: boolean; price_override: number | null }[];
      if (overrides.length > 0) {
        const overrideMap = new Map(overrides.map((o) => [o.menu_item_id, o]));
        items = items
          .filter((item) => {
            const override = overrideMap.get(item.id);
            return !override || override.is_available;
          })
          .map((item) => {
            const override = overrideMap.get(item.id);
            if (override?.price_override != null) {
              return { ...item, base_price: override.price_override };
            }
            return item;
          });
      }
      setMenuItems(items);

      if (varRes.data) setVariants(varRes.data);

      // Check for existing active order for this table (B10)
      const { data: existingOrder } = await supabase
        .from("orders")
        .select("*")
        .eq("outlet_id", outletId)
        .eq("table_id", tableId)
        .in("status", ["pending", "preparing", "ready"])
        .eq("payment_status", "unpaid")
        .order("created_at", { ascending: false })
        .limit(1)
        .returns<Order[]>();

      if (existingOrder && existingOrder.length > 0) {
        const order = existingOrder[0];
        setActiveOrder(order);
        setOrderId(order.id);
        setOrderNumber(order.order_number);
        setOrderPlaced(true);
      }

      setLoading(false);
    }

    loadData();
  }, [outletId, tableId]);

  // Get variants for a menu item (B2)
  function getItemVariants(menuItemId: string): Map<string, Variant[]> {
    const itemVariants = variants.filter((v) => v.menu_item_id === menuItemId);
    const groups = new Map<string, Variant[]>();
    for (const v of itemVariants) {
      const existing = groups.get(v.group_name) || [];
      existing.push(v);
      groups.set(v.group_name, existing);
    }
    return groups;
  }

  // Cart helpers
  const cartCount = useMemo(
    () => cart.reduce((sum, item) => sum + item.quantity, 0),
    [cart]
  );

  const cartSubtotal = useMemo(
    () =>
      cart.reduce((sum, item) => {
        const variantAdj = item.selectedVariants.reduce((s, v) => s + v.price_adjustment, 0);
        return sum + (Number(item.menuItem.base_price) + variantAdj) * item.quantity;
      }, 0),
    [cart]
  );

  const cartTax = useMemo(() => cartSubtotal * (taxRate / 100), [cartSubtotal, taxRate]);
  const cartTotal = useMemo(() => cartSubtotal + cartTax, [cartSubtotal, cartTax]);

  function generateCartKey(menuItemId: string, selectedVariants: SelectedVariant[]): string {
    const variantIds = selectedVariants.map((v) => v.variant_id).sort().join(",");
    return `${menuItemId}:${variantIds}`;
  }

  function addToCart(menuItem: MenuItem, selectedVariants: SelectedVariant[] = []) {
    const cartKey = generateCartKey(menuItem.id, selectedVariants);
    setCart((prev) => {
      const existing = prev.find((c) => c.cartKey === cartKey);
      if (existing) {
        return prev.map((c) =>
          c.cartKey === cartKey ? { ...c, quantity: c.quantity + 1 } : c
        );
      }
      return [...prev, { menuItem, quantity: 1, notes: "", selectedVariants, cartKey }];
    });
  }

  function handleAddToCart(menuItem: MenuItem) {
    const itemVariantGroups = getItemVariants(menuItem.id);
    if (itemVariantGroups.size > 0) {
      // Open variant selection dialog (B2)
      setVariantItem(menuItem);
      // Pre-select defaults
      const defaults: Record<string, string> = {};
      Array.from(itemVariantGroups.entries()).forEach(([group, vars]) => {
        const defaultVar = vars.find((v: Variant) => v.is_default);
        if (defaultVar) defaults[group] = defaultVar.id;
      });
      setVariantSelections(defaults);
    } else {
      addToCart(menuItem);
    }
  }

  function confirmVariantSelection() {
    if (!variantItem) return;
    const selectedVariants: SelectedVariant[] = [];
    for (const [group, variantId] of Object.entries(variantSelections)) {
      const v = variants.find((vr) => vr.id === variantId);
      if (v) {
        selectedVariants.push({
          group_name: group,
          variant_id: v.id,
          name_en: v.name_en,
          name_ms: v.name_ms,
          price_adjustment: Number(v.price_adjustment) || 0,
        });
      }
    }
    addToCart(variantItem, selectedVariants);
    setVariantItem(null);
    setVariantSelections({});
  }

  function removeFromCart(cartKey: string) {
    setCart((prev) => {
      const existing = prev.find((c) => c.cartKey === cartKey);
      if (existing && existing.quantity > 1) {
        return prev.map((c) =>
          c.cartKey === cartKey ? { ...c, quantity: c.quantity - 1 } : c
        );
      }
      return prev.filter((c) => c.cartKey !== cartKey);
    });
  }

  function getCartQuantity(menuItemId: string): number {
    return cart
      .filter((c) => c.menuItem.id === menuItemId)
      .reduce((sum, c) => sum + c.quantity, 0);
  }

  function updateNote(cartKey: string, note: string) {
    setCart((prev) =>
      prev.map((c) =>
        c.cartKey === cartKey ? { ...c, notes: note } : c
      )
    );
  }

  const filteredItems = selectedCategory
    ? menuItems.filter((i) => i.category_id === selectedCategory)
    : menuItems;

  // Place order or add to existing order (B10)
  async function placeOrder() {
    if (cart.length === 0 || !outlet || !table) return;
    setOrdering(true);

    try {
      const supabase = createClient();

      let currentOrderId = orderId;
      let currentOrderNumber = orderNumber;

      if (activeOrder && currentOrderId) {
        // B10: Add items to existing order
        const orderItems = cart.map((item) => {
          const variantAdj = item.selectedVariants.reduce((s, v) => s + v.price_adjustment, 0);
          const unitPrice = Number(item.menuItem.base_price) + variantAdj;
          return {
            order_id: currentOrderId!,
            menu_item_id: item.menuItem.id,
            item_name: lang === "ms" && item.menuItem.name_ms ? item.menuItem.name_ms : item.menuItem.name_en,
            quantity: item.quantity,
            unit_price: unitPrice,
            subtotal: unitPrice * item.quantity,
            special_instructions: item.notes || null,
            variants_json: item.selectedVariants.length > 0
              ? item.selectedVariants.map((v) => ({ name: t(v.name_en, v.name_ms), price: v.price_adjustment }))
              : null,
          };
        });

        const { error: itemsErr } = await supabase.from("order_items").insert(orderItems);
        if (itemsErr) throw itemsErr;

        // Update order totals with tax recalculation
        const newSubtotal = Number(activeOrder.subtotal) + cartSubtotal;
        const newTax = newSubtotal * (taxRate / 100);
        const newTotal = newSubtotal + newTax;
        const { error: updateErr } = await supabase
          .from("orders")
          .update({
            subtotal: newSubtotal,
            tax: newTax > 0 ? newTax : null,
            total: newTotal,
            status: "pending", // Reset to pending since new items added
          })
          .eq("id", currentOrderId);

        if (updateErr) throw updateErr;

        setActiveOrder((prev) => prev ? { ...prev, subtotal: newSubtotal, tax: newTax > 0 ? newTax : null, total: newTotal, status: "pending" } : null);
        toast.success(lang === "ms" ? "Item ditambah ke pesanan!" : "Items added to your order!");
      } else {
        // Create new order
        const now = new Date();
        currentOrderNumber = `${now.getHours().toString().padStart(2, "0")}${now.getMinutes().toString().padStart(2, "0")}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

        const { data: order, error: orderErr } = await supabase
          .from("orders")
          .insert({
            outlet_id: outletId,
            table_id: tableId,
            order_number: currentOrderNumber,
            status: "pending",
            subtotal: cartSubtotal,
            tax: cartTax > 0 ? cartTax : null,
            total: cartTotal,
            order_type: "dine_in",
          })
          .select("id")
          .single();

        if (orderErr || !order) throw orderErr || new Error("Failed to create order");

        currentOrderId = (order as { id: string }).id;

        const orderItems = cart.map((item) => {
          const variantAdj = item.selectedVariants.reduce((s, v) => s + v.price_adjustment, 0);
          const unitPrice = Number(item.menuItem.base_price) + variantAdj;
          return {
            order_id: currentOrderId!,
            menu_item_id: item.menuItem.id,
            item_name: lang === "ms" && item.menuItem.name_ms ? item.menuItem.name_ms : item.menuItem.name_en,
            quantity: item.quantity,
            unit_price: unitPrice,
            subtotal: unitPrice * item.quantity,
            special_instructions: item.notes || null,
            variants_json: item.selectedVariants.length > 0
              ? item.selectedVariants.map((v) => ({ name: t(v.name_en, v.name_ms), price: v.price_adjustment }))
              : null,
          };
        });

        const { error: itemsErr } = await supabase.from("order_items").insert(orderItems);
        if (itemsErr) throw itemsErr;

        // Fetch the full order for tracking
        const { data: fullOrder } = await supabase
          .from("orders")
          .select("*")
          .eq("id", currentOrderId)
          .single();

        if (fullOrder) setActiveOrder(fullOrder as Order);
      }

      setOrderNumber(currentOrderNumber);
      setOrderId(currentOrderId);
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

  // Real-time order status tracking (B5)
  const trackOrder = useCallback(() => {
    if (!orderId) return;
    const supabase = createClient();

    const channel = supabase
      .channel(`order-${orderId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "orders",
          filter: `id=eq.${orderId}`,
        },
        (payload) => {
          const updated = payload.new as Order;
          setActiveOrder(updated);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [orderId]);

  useEffect(() => {
    const cleanup = trackOrder();
    return () => { if (cleanup) cleanup(); };
  }, [trackOrder]);

  // ========== LOADING / ERROR STATES ==========

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary-600 mx-auto mb-3" />
          <p className="text-sm text-gray-500">
            {lang === "ms" ? "Memuatkan menu..." : "Loading menu..."}
          </p>
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

  // ========== ORDER STATUS TRACKING (B5) ==========

  if (orderPlaced && activeOrder) {
    const status = activeOrder.status || "pending";
    const statusInfo = STATUS_DISPLAY[status];
    const StatusIcon = statusInfo?.icon || Clock;

    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-primary-50 px-4 py-8">
        <div className="max-w-sm mx-auto text-center">
          {/* Language toggle */}
          <div className="flex justify-end mb-4">
            <button
              onClick={toggleLang}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/80 text-sm font-medium text-gray-600 border"
            >
              <Globe className="w-3.5 h-3.5" />
              {lang === "en" ? "BM" : "EN"}
            </button>
          </div>

          {/* Status indicator */}
          <div className="w-20 h-20 rounded-full bg-white shadow-lg flex items-center justify-center mx-auto mb-6">
            <StatusIcon className={`w-10 h-10 ${statusInfo?.color || "text-gray-400"}`} />
          </div>

          <h1 className="text-2xl font-bold text-gray-900 mb-1">
            {lang === "ms" ? "Pesanan Dihantar!" : "Order Placed!"}
          </h1>
          <p className="text-gray-500 mb-2">
            {lang === "ms" ? "Nombor pesanan" : "Order number"}{" "}
            <span className="font-mono font-bold text-primary-700">#{orderNumber}</span>
          </p>

          {/* Live status */}
          <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white shadow-sm text-sm font-medium ${statusInfo?.color || "text-gray-500"} mb-6`}>
            <StatusIcon className="w-4 h-4" />
            {lang === "ms" ? statusInfo?.label_ms : statusInfo?.label_en}
          </div>

          {/* Status timeline */}
          <div className="bg-white rounded-xl p-4 mb-6 text-left">
            {(["pending", "preparing", "ready"] as const).map((s, i) => {
              const info = STATUS_DISPLAY[s];
              const Icon = info.icon;
              const isActive = s === status;
              const isDone = ["pending", "preparing", "ready", "completed"].indexOf(status) >
                ["pending", "preparing", "ready", "completed"].indexOf(s);
              return (
                <div key={s} className="flex items-center gap-3 py-2">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    isDone ? "bg-green-100" : isActive ? "bg-primary-100" : "bg-gray-100"
                  }`}>
                    {isDone ? (
                      <Check className="w-4 h-4 text-green-600" />
                    ) : (
                      <Icon className={`w-4 h-4 ${isActive ? info.color : "text-gray-300"}`} />
                    )}
                  </div>
                  <span className={`text-sm ${isActive ? "font-bold text-gray-900" : isDone ? "text-gray-500" : "text-gray-300"}`}>
                    {lang === "ms" ? info.label_ms : info.label_en}
                  </span>
                  {i < 2 && <div className="flex-1" />}
                </div>
              );
            })}
          </div>

          <p className="text-sm text-gray-400 mb-6">
            Table {table?.table_number} &middot; {outlet?.name}
          </p>

          <div className="flex gap-3">
            {/* Add More Items (B10) */}
            <Button
              onClick={() => {
                setOrderPlaced(false);
              }}
              className="flex-1 bg-gradient-to-r from-primary-700 to-primary-500"
            >
              <Plus className="w-4 h-4 mr-1" />
              {lang === "ms" ? "Tambah Lagi" : "Add More Items"}
            </Button>
            {/* Request Bill (B5) */}
            <Button
              variant="outline"
              onClick={() => {
                toast.info(lang === "ms" ? "Bil diminta. Sila tunggu." : "Bill requested. Please wait.");
              }}
              className="flex-1"
            >
              <CreditCard className="w-4 h-4 mr-1" />
              {lang === "ms" ? "Minta Bil" : "Request Bill"}
            </Button>
          </div>
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
            <div className="flex items-center gap-2">
              {/* Language toggle (B6) */}
              <button
                onClick={toggleLang}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-full bg-gray-100 text-xs font-medium text-gray-600"
              >
                <Globe className="w-3 h-3" />
                {lang === "en" ? "BM" : "EN"}
              </button>
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-600 to-accent-500 flex items-center justify-center">
                <span className="text-white font-bold text-sm">bx</span>
              </div>
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
              {lang === "ms" ? "Semua" : "All"}
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
                {t(cat.name_en, cat.name_ms)}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Active order banner (B10) */}
      {activeOrder && !orderPlaced && (
        <div className="bg-primary-50 border-b border-primary-200 px-4 py-2 flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-primary-700">
            <FileText className="w-4 h-4" />
            <span className="font-medium">
              {lang === "ms" ? "Pesanan aktif" : "Active order"} #{orderNumber}
            </span>
          </div>
          <button
            onClick={() => setOrderPlaced(true)}
            className="text-xs font-medium text-primary-600 hover:underline"
          >
            {lang === "ms" ? "Lihat status" : "View status"}
          </button>
        </div>
      )}

      {/* Menu Items */}
      <div className="px-4 py-4 space-y-3">
        {filteredItems.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <p>{lang === "ms" ? "Tiada item tersedia" : "No items available"}</p>
          </div>
        ) : (
          filteredItems.map((item) => {
            const qty = getCartQuantity(item.id);
            const itemVariantGroups = getItemVariants(item.id);
            const hasVariants = itemVariantGroups.size > 0;

            return (
              <div
                key={item.id}
                className="bg-white rounded-xl border shadow-sm flex overflow-hidden"
              >
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

                <div className="flex-1 p-3 flex flex-col justify-between min-w-0">
                  <div>
                    <h3 className="font-semibold text-gray-900 text-sm truncate">
                      {t(item.name_en, item.name_ms)}
                    </h3>
                    {lang === "en" && item.name_ms && (
                      <p className="text-xs text-gray-400 truncate">{item.name_ms}</p>
                    )}
                    {lang === "ms" && item.name_en && item.name_ms && (
                      <p className="text-xs text-gray-400 truncate">{item.name_en}</p>
                    )}
                    {t(item.description_en, item.description_ms) && (
                      <p className="text-xs text-gray-400 line-clamp-1 mt-0.5">
                        {t(item.description_en, item.description_ms)}
                      </p>
                    )}
                    {hasVariants && (
                      <p className="text-xs text-primary-500 mt-0.5">
                        {lang === "ms" ? "Pilihan tersedia" : "Options available"}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <span className="font-bold text-primary-700 text-sm">
                      RM {Number(item.base_price).toFixed(2)}
                    </span>
                    {qty === 0 ? (
                      <button
                        onClick={() => handleAddToCart(item)}
                        className="w-8 h-8 rounded-full bg-primary-600 text-white flex items-center justify-center hover:bg-primary-700 transition-colors"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    ) : (
                      <div className="flex items-center gap-2">
                        {!hasVariants && (
                          <button
                            onClick={() => removeFromCart(generateCartKey(item.id, []))}
                            className="w-7 h-7 rounded-full border-2 border-primary-600 text-primary-600 flex items-center justify-center"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                        )}
                        <span className="text-sm font-bold w-5 text-center">{qty}</span>
                        <button
                          onClick={() => handleAddToCart(item)}
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
              <span>{cartCount} {lang === "ms" ? "item" : "item"}{cartCount > 1 ? "s" : ""}</span>
            </div>
            <span className="font-bold">RM {cartTotal.toFixed(2)}</span>
          </button>
        </div>
      )}

      {/* Cart Drawer */}
      {cartOpen && (
        <div className="fixed inset-0 z-50">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setCartOpen(false)}
          />
          <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-2xl max-h-[85vh] flex flex-col animate-in slide-in-from-bottom">
            <div className="flex justify-center py-2">
              <div className="w-10 h-1 rounded-full bg-gray-300" />
            </div>

            <div className="flex items-center justify-between px-4 pb-3 border-b">
              <h2 className="text-lg font-bold text-gray-900">
                {lang === "ms" ? "Pesanan Anda" : "Your Order"}
              </h2>
              <button
                onClick={() => setCartOpen(false)}
                className="p-1.5 hover:bg-gray-100 rounded-full"
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
              {cart.map((cartItem) => {
                const variantAdj = cartItem.selectedVariants.reduce((s, v) => s + v.price_adjustment, 0);
                const itemPrice = Number(cartItem.menuItem.base_price) + variantAdj;

                return (
                  <div key={cartItem.cartKey} className="flex gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <div className="min-w-0">
                          <p className="font-medium text-gray-900 text-sm truncate">
                            {t(cartItem.menuItem.name_en, cartItem.menuItem.name_ms)}
                          </p>
                          {cartItem.selectedVariants.length > 0 && (
                            <p className="text-xs text-gray-400">
                              {cartItem.selectedVariants.map((v) => t(v.name_en, v.name_ms)).join(", ")}
                            </p>
                          )}
                          <p className="text-xs text-gray-400">
                            RM {itemPrice.toFixed(2)} {lang === "ms" ? "setiap" : "each"}
                          </p>
                        </div>
                        <p className="font-bold text-sm text-gray-900 ml-2">
                          RM {(itemPrice * cartItem.quantity).toFixed(2)}
                        </p>
                      </div>

                      {cartItem.notes && (
                        <p className="text-xs text-primary-600 mt-1">
                          {lang === "ms" ? "Nota" : "Note"}: {cartItem.notes}
                        </p>
                      )}

                      <div className="flex items-center justify-between mt-2">
                        <button
                          onClick={() => {
                            setNoteItemKey(
                              noteItemKey === cartItem.cartKey ? null : cartItem.cartKey
                            );
                            setNoteText(cartItem.notes);
                          }}
                          className="text-xs text-primary-600 hover:underline"
                        >
                          {cartItem.notes
                            ? (lang === "ms" ? "Edit nota" : "Edit note")
                            : (lang === "ms" ? "Tambah nota" : "Add note")}
                        </button>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => removeFromCart(cartItem.cartKey)}
                            className="w-7 h-7 rounded-full border-2 border-gray-300 text-gray-500 flex items-center justify-center"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="text-sm font-bold w-5 text-center">
                            {cartItem.quantity}
                          </span>
                          <button
                            onClick={() => addToCart(cartItem.menuItem, cartItem.selectedVariants)}
                            className="w-7 h-7 rounded-full bg-primary-600 text-white flex items-center justify-center"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                      </div>

                      {noteItemKey === cartItem.cartKey && (
                        <div className="mt-2 flex gap-2">
                          <input
                            type="text"
                            value={noteText}
                            onChange={(e) => setNoteText(e.target.value)}
                            placeholder={lang === "ms" ? "cth. Tanpa pedas" : "e.g. No spice, extra sambal"}
                            className="flex-1 text-sm border rounded-lg px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-primary-500"
                            autoFocus
                          />
                          <button
                            onClick={() => {
                              updateNote(cartItem.cartKey, noteText);
                              setNoteItemKey(null);
                            }}
                            className="px-3 py-1.5 bg-primary-600 text-white text-sm rounded-lg"
                          >
                            {lang === "ms" ? "Simpan" : "Save"}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="border-t px-4 py-4 space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">
                  {lang === "ms" ? "Jumlah kecil" : "Subtotal"}
                </span>
                <span className="text-gray-700">
                  RM {cartSubtotal.toFixed(2)}
                </span>
              </div>
              {taxRate > 0 && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">
                    {lang === "ms" ? "Cukai" : "Tax"} ({taxRate}%)
                  </span>
                  <span className="text-gray-700">
                    RM {cartTax.toFixed(2)}
                  </span>
                </div>
              )}
              <div className="flex items-center justify-between">
                <span className="text-gray-500 font-medium">
                  {lang === "ms" ? "Jumlah" : "Total"}
                </span>
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
                    {lang === "ms" ? "Menghantar..." : "Placing Order..."}
                  </>
                ) : activeOrder ? (
                  <>
                    <Plus className="w-4 h-4 mr-2" />
                    {lang === "ms" ? "Tambah ke Pesanan" : "Add to Order"}
                  </>
                ) : (
                  <>
                    <ShoppingCart className="w-4 h-4 mr-2" />
                    {lang === "ms" ? "Buat Pesanan" : "Place Order"}
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Variant Selection Dialog (B2) */}
      {variantItem && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/50" onClick={() => setVariantItem(null)} />
          <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-2xl max-h-[70vh] flex flex-col animate-in slide-in-from-bottom">
            <div className="flex justify-center py-2">
              <div className="w-10 h-1 rounded-full bg-gray-300" />
            </div>
            <div className="px-4 pb-3 border-b">
              <h3 className="text-lg font-bold text-gray-900">
                {t(variantItem.name_en, variantItem.name_ms)}
              </h3>
              <p className="text-sm text-gray-500">
                {lang === "ms" ? "Pilih pilihan anda" : "Choose your options"}
              </p>
            </div>
            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4">
              {Array.from(getItemVariants(variantItem.id).entries()).map(([groupName, groupVariants]) => (
                <div key={groupName}>
                  <p className="text-sm font-semibold text-gray-700 mb-2">{groupName}</p>
                  <div className="space-y-2">
                    {groupVariants.map((v) => (
                      <button
                        key={v.id}
                        onClick={() => setVariantSelections((prev) => ({ ...prev, [groupName]: v.id }))}
                        className={`w-full text-left px-3 py-2.5 rounded-lg border text-sm transition-colors ${
                          variantSelections[groupName] === v.id
                            ? "border-primary-500 bg-primary-50 text-primary-700"
                            : "border-gray-200 text-gray-700 hover:bg-gray-50"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span>{t(v.name_en, v.name_ms)}</span>
                          {Number(v.price_adjustment) > 0 && (
                            <span className="text-xs font-medium text-gray-400">
                              +RM {Number(v.price_adjustment).toFixed(2)}
                            </span>
                          )}
                          {Number(v.price_adjustment) < 0 && (
                            <span className="text-xs font-medium text-green-600">
                              -RM {Math.abs(Number(v.price_adjustment)).toFixed(2)}
                            </span>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <div className="border-t px-4 py-4">
              <Button
                onClick={confirmVariantSelection}
                className="w-full h-11 bg-gradient-to-r from-primary-700 to-primary-500"
              >
                <Plus className="w-4 h-4 mr-2" />
                {lang === "ms" ? "Tambah ke Troli" : "Add to Cart"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
