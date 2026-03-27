"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { useStore } from "@/hooks/use-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  Clock,
  ChefHat,
  CheckCircle2,
  XCircle,
  Loader2,
  ShoppingCart,
  RefreshCw,
  Eye,
  Ban,
  ChevronLeft,
  ChevronRight,
  Package,
  Truck,
  UtensilsCrossed,
} from "lucide-react";
import { playNotificationSound } from "@/lib/notification-sound";
import type { Order, OrderItem } from "@/types/database";

type OrderStatus = "pending" | "preparing" | "ready" | "completed" | "cancelled";
type OrderType = "dine_in" | "takeaway" | "delivery";

interface OrderWithItems extends Order {
  order_items: OrderItem[];
  tables: { table_number: string } | null;
}

const STATUS_CONFIG: Record<
  OrderStatus,
  { label: string; color: string; bg: string; icon: React.ElementType }
> = {
  pending: { label: "Pending", color: "text-yellow-700", bg: "bg-yellow-50 border-yellow-200", icon: Clock },
  preparing: { label: "Preparing", color: "text-blue-700", bg: "bg-blue-50 border-blue-200", icon: ChefHat },
  ready: { label: "Ready", color: "text-green-700", bg: "bg-green-50 border-green-200", icon: CheckCircle2 },
  completed: { label: "Completed", color: "text-gray-500", bg: "bg-gray-50 border-gray-200", icon: CheckCircle2 },
  cancelled: { label: "Cancelled", color: "text-red-500", bg: "bg-red-50 border-red-200", icon: XCircle },
};

const ORDER_TYPE_CONFIG: Record<OrderType, { label: string; icon: React.ElementType; color: string }> = {
  dine_in: { label: "Dine In", icon: UtensilsCrossed, color: "bg-blue-50 text-blue-700" },
  takeaway: { label: "Takeaway", icon: Package, color: "bg-orange-50 text-orange-700" },
  delivery: { label: "Delivery", icon: Truck, color: "bg-purple-50 text-purple-700" },
};

const STATUS_FLOW: OrderStatus[] = ["pending", "preparing", "ready", "completed"];
const PAGE_SIZE = 30;

export default function OrdersPage() {
  const { outlet, outlets, loading: storeLoading } = useStore();
  const [orders, setOrders] = useState<OrderWithItems[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<OrderStatus | "all">("all");
  const [filterType, setFilterType] = useState<OrderType | "all">("all");
  const [detailOrder, setDetailOrder] = useState<OrderWithItems | null>(null);

  // Date range filter (B7)
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  // Pagination (B7)
  const [page, setPage] = useState(0);

  // Cancel dialog (B4)
  const [cancelOrderId, setCancelOrderId] = useState<string | null>(null);
  const [cancelReason, setCancelReason] = useState("");

  // Refund dialog (enhanced)
  const [refundOrder, setRefundOrder] = useState<OrderWithItems | null>(null);
  const [refundType, setRefundType] = useState<"full" | "partial">("full");
  const [refundReason, setRefundReason] = useState("");
  const [refundSelectedItems, setRefundSelectedItems] = useState<Set<string>>(new Set());
  const [_refundOrderId, _setRefundOrderId] = useState<string | null>(null);

  // Audio notification (B3)
  const prevOrderCountRef = useRef<number>(0);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);

  // Request notification permission on mount (B3)
  useEffect(() => {
    if (typeof window !== "undefined" && "Notification" in window) {
      if (Notification.permission === "granted") {
        setNotificationsEnabled(true);
      } else if (Notification.permission !== "denied") {
        Notification.requestPermission().then((p) => {
          if (p === "granted") setNotificationsEnabled(true);
        });
      }
    }
  }, []);

  const outletNameMap = new Map(outlets.map((o) => [o.id, o.name]));
  const isConsolidated = !outlet && outlets.length > 1;

  const loadOrders = useCallback(async () => {
    if (!outlet && outlets.length === 0) return;
    const supabase = createClient();

    let query = supabase
      .from("orders")
      .select("*, order_items(*), tables(table_number)")
      .order("created_at", { ascending: false });

    if (outlet) {
      query = query.eq("outlet_id", outlet.id);
    } else {
      const outletIds = outlets.map((o) => o.id);
      if (outletIds.length > 0) query = query.in("outlet_id", outletIds);
    }

    // Date range filter
    if (dateFrom) {
      query = query.gte("created_at", new Date(dateFrom).toISOString());
    }
    if (dateTo) {
      const end = new Date(dateTo);
      end.setHours(23, 59, 59, 999);
      query = query.lte("created_at", end.toISOString());
    }

    const { data, error } = await query.range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);

    if (error) {
      toast.error("Failed to load orders");
      setLoading(false);
      return;
    }

    const newOrders = (data as unknown as OrderWithItems[]) || [];

    // Check for new orders and play sound (B3)
    if (prevOrderCountRef.current > 0 && newOrders.length > prevOrderCountRef.current) {
      playNotificationSound();

      if (notificationsEnabled) {
        try {
          new Notification("New Order!", {
            body: `Order #${newOrders[0]?.order_number} received`,
            icon: "/favicon.ico",
          });
        } catch { /* ignore */ }
      }
    }
    prevOrderCountRef.current = newOrders.length;

    setOrders(newOrders);
    setLoading(false);
  }, [outlet, outlets, dateFrom, dateTo, page, notificationsEnabled]);

  useEffect(() => {
    if (outlet || outlets.length > 0) loadOrders();
  }, [outlet, outlets, loadOrders]);

  // Real-time subscription (B3 - with sound)
  useEffect(() => {
    if (!outlet) return;
    const supabase = createClient();

    const channel = supabase
      .channel("orders-realtime")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "orders",
          filter: `outlet_id=eq.${outlet.id}`,
        },
        (payload) => {
          if (payload.eventType === "INSERT") {
            playNotificationSound();

            if (notificationsEnabled) {
              try {
                const newOrder = payload.new as Order;
                new Notification("New Order!", {
                  body: `Order #${newOrder.order_number} received`,
                  icon: "/favicon.ico",
                });
              } catch { /* ignore */ }
            }
          }
          loadOrders();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [outlet, loadOrders, notificationsEnabled]);

  async function updateOrderStatus(orderId: string, newStatus: OrderStatus) {
    const supabase = createClient();
    const { error } = await supabase
      .from("orders")
      .update({ status: newStatus })
      .eq("id", orderId);

    if (error) {
      toast.error("Failed to update status");
      return;
    }

    toast.success(`Order ${newStatus}`);
    loadOrders();

    if (detailOrder?.id === orderId) {
      setDetailOrder((prev) => prev ? { ...prev, status: newStatus } : null);
    }
  }

  // Cancel with reason (B4)
  async function cancelOrder() {
    if (!cancelOrderId) return;
    const supabase = createClient();
    const { error } = await supabase
      .from("orders")
      .update({
        status: "cancelled",
        notes: cancelReason ? `Cancelled: ${cancelReason}` : "Cancelled",
      })
      .eq("id", cancelOrderId);

    if (error) {
      toast.error("Failed to cancel order");
      return;
    }

    toast.success("Order cancelled");
    setCancelOrderId(null);
    setCancelReason("");
    loadOrders();

    if (detailOrder?.id === cancelOrderId) {
      setDetailOrder(null);
    }
  }

  // Enhanced Refund
  function openRefundDialog(order: OrderWithItems) {
    setRefundOrder(order);
    setRefundType("full");
    setRefundReason("");
    setRefundSelectedItems(new Set());
  }

  function getRefundAmount(): number {
    if (!refundOrder) return 0;
    if (refundType === "full") return Number(refundOrder.total);
    return refundOrder.order_items
      .filter((item) => refundSelectedItems.has(item.id))
      .reduce((sum, item) => sum + Number(item.subtotal), 0);
  }

  async function processRefund() {
    if (!refundOrder || !refundReason.trim()) {
      toast.error("Please provide a reason");
      return;
    }
    const amount = getRefundAmount();
    if (amount <= 0) {
      toast.error("Refund amount must be greater than 0");
      return;
    }

    const supabase = createClient();

    // Create refund record
    const refundPayload = {
      order_id: refundOrder.id,
      amount,
      reason: refundReason.trim(),
      refund_type: refundType,
      refunded_items: refundType === "partial"
        ? refundOrder.order_items
            .filter((item) => refundSelectedItems.has(item.id))
            .map((item) => ({ id: item.id, name: item.item_name, qty: item.quantity, amount: Number(item.subtotal) }))
        : null,
    };

    const { error: refundErr } = await supabase.from("refunds").insert(refundPayload);
    if (refundErr) { toast.error(refundErr.message); return; }

    // Update order payment status
    const { error } = await supabase
      .from("orders")
      .update({ payment_status: "refunded" })
      .eq("id", refundOrder.id);
    if (error) { toast.error(error.message); return; }

    toast.success(`Refund of RM ${amount.toFixed(2)} processed`);
    setRefundOrder(null);
    loadOrders();
  }

  function getNextStatus(current: OrderStatus): OrderStatus | null {
    const idx = STATUS_FLOW.indexOf(current);
    if (idx === -1 || idx >= STATUS_FLOW.length - 1) return null;
    return STATUS_FLOW[idx + 1];
  }

  function formatTime(dateStr: string | null): string {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    return d.toLocaleTimeString("en-MY", { hour: "2-digit", minute: "2-digit" });
  }

  function timeAgo(dateStr: string | null): string {
    if (!dateStr) return "";
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "Just now";
    if (mins < 60) return `${mins}m ago`;
    return `${Math.floor(mins / 60)}h ${mins % 60}m ago`;
  }

  // Filter orders by status and type
  let filteredOrders = orders;
  if (filterStatus !== "all") {
    filteredOrders = filteredOrders.filter((o) => o.status === filterStatus);
  }
  if (filterType !== "all") {
    filteredOrders = filteredOrders.filter((o) => o.order_type === filterType);
  }

  // Count by status
  const counts: Record<string, number> = { all: orders.length };
  for (const o of orders) {
    const s = o.status || "pending";
    counts[s] = (counts[s] || 0) + 1;
  }

  if (storeLoading || loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 animate-spin text-primary-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Orders</h1>
          <p className="text-sm text-muted-foreground">
            Manage incoming orders in real-time. Orders update automatically.
          </p>
        </div>
        <Button variant="outline" onClick={loadOrders}>
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Filters Row (B7 + B8) */}
      <div className="flex flex-wrap gap-3 items-end">
        <div>
          <label className="text-xs text-gray-500 mb-1 block">From</label>
          <Input
            type="date"
            value={dateFrom}
            onChange={(e) => { setDateFrom(e.target.value); setPage(0); }}
            className="w-40"
          />
        </div>
        <div>
          <label className="text-xs text-gray-500 mb-1 block">To</label>
          <Input
            type="date"
            value={dateTo}
            onChange={(e) => { setDateTo(e.target.value); setPage(0); }}
            className="w-40"
          />
        </div>
        <div>
          <label className="text-xs text-gray-500 mb-1 block">Order Type</label>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as OrderType | "all")}
            className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <option value="all">All Types</option>
            <option value="dine_in">Dine In</option>
            <option value="takeaway">Takeaway</option>
            <option value="delivery">Delivery</option>
          </select>
        </div>
        {(dateFrom || dateTo) && (
          <Button variant="ghost" size="sm" onClick={() => { setDateFrom(""); setDateTo(""); setPage(0); }}>
            Clear dates
          </Button>
        )}
      </div>

      {/* Status Filter Tabs */}
      <div className="flex gap-2 overflow-x-auto">
        {(["all", "pending", "preparing", "ready", "completed", "cancelled"] as const).map(
          (status) => {
            const count = counts[status] || 0;
            const isActive = filterStatus === status;
            return (
              <button
                key={status}
                onClick={() => setFilterStatus(status)}
                className={`flex-shrink-0 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-primary-600 text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {status === "all" ? "All" : STATUS_CONFIG[status].label}
                {count > 0 && (
                  <span className={`ml-1.5 ${isActive ? "text-primary-200" : "text-gray-400"}`}>
                    {count}
                  </span>
                )}
              </button>
            );
          }
        )}
      </div>

      {/* Orders List */}
      {filteredOrders.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <ShoppingCart className="w-12 h-12 text-gray-200 mb-4" />
            <p className="text-gray-500">
              {filterStatus === "all"
                ? "No orders yet. Orders will appear here when customers place them."
                : `No ${filterStatus} orders`}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredOrders.map((order) => {
            const status = (order.status || "pending") as OrderStatus;
            const config = STATUS_CONFIG[status];
            const StatusIcon = config.icon;
            const nextStatus = getNextStatus(status);
            const orderType = (order.order_type || "dine_in") as OrderType;
            const typeConfig = ORDER_TYPE_CONFIG[orderType];
            const TypeIcon = typeConfig?.icon || UtensilsCrossed;

            return (
              <Card key={order.id} className={`border-2 ${config.bg}`}>
                <CardContent className="p-4">
                  {/* Order header */}
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-lg">
                          #{order.order_number}
                        </span>
                        <span className={`flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${config.color} bg-white/60`}>
                          <StatusIcon className="w-3 h-3" />
                          {config.label}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <p className="text-xs text-gray-500">
                          {order.tables
                            ? `Table ${(order.tables as { table_number: string }).table_number}`
                            : order.order_type?.replace("_", " ")}
                          {" · "}
                          {formatTime(order.created_at)}
                          {" · "}
                          <span className="font-medium">{timeAgo(order.created_at)}</span>
                        </p>
                        {/* Order type badge */}
                        {orderType !== "dine_in" && typeConfig && (
                          <span className={`flex items-center gap-1 text-xs font-medium px-1.5 py-0.5 rounded ${typeConfig.color}`}>
                            <TypeIcon className="w-3 h-3" />
                            {typeConfig.label}
                          </span>
                        )}
                        {/* Outlet badge in consolidated view */}
                        {isConsolidated && outletNameMap.get(order.outlet_id) && (
                          <span className="text-xs font-medium px-1.5 py-0.5 rounded bg-gray-100 text-gray-600">
                            {outletNameMap.get(order.outlet_id)}
                          </span>
                        )}
                      </div>
                    </div>
                    <span className="font-bold text-primary-700">
                      RM {Number(order.total).toFixed(2)}
                    </span>
                  </div>

                  {/* Payment status badge */}
                  {order.payment_status === "refunded" && (
                    <span className="inline-block text-xs font-medium px-2 py-0.5 rounded-full bg-red-100 text-red-700 mb-2">
                      Refunded
                    </span>
                  )}
                  {order.payment_status === "paid" && (
                    <span className="inline-block text-xs font-medium px-2 py-0.5 rounded-full bg-green-100 text-green-700 mb-2">
                      Paid
                    </span>
                  )}

                  {/* Order items preview */}
                  <div className="space-y-1 mb-3">
                    {order.order_items.slice(0, 4).map((item) => (
                      <div key={item.id} className="flex items-center justify-between text-sm">
                        <span className="text-gray-700">
                          <span className="font-medium">{item.quantity}x</span>{" "}
                          {item.item_name}
                        </span>
                        <span className="text-gray-500 text-xs">
                          RM {Number(item.subtotal).toFixed(2)}
                        </span>
                      </div>
                    ))}
                    {order.order_items.length > 4 && (
                      <p className="text-xs text-gray-400">
                        +{order.order_items.length - 4} more items
                      </p>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 pt-2 border-t border-black/5">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setDetailOrder(order)}
                      className="text-xs"
                    >
                      <Eye className="w-3.5 h-3.5 mr-1" />
                      Details
                    </Button>
                    <div className="flex-1" />
                    {(status === "completed" || status === "cancelled") &&
                      order.payment_status !== "refunded" && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openRefundDialog(order)}
                        className="text-xs text-red-500 hover:text-red-700 hover:bg-red-50"
                      >
                        <Ban className="w-3.5 h-3.5 mr-1" />
                        Refund
                      </Button>
                    )}
                    {status !== "cancelled" && status !== "completed" && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setCancelOrderId(order.id)}
                        className="text-xs text-red-500 hover:text-red-700 hover:bg-red-50"
                      >
                        Cancel
                      </Button>
                    )}
                    {nextStatus && (
                      <Button
                        size="sm"
                        onClick={() => updateOrderStatus(order.id, nextStatus)}
                        className="text-xs bg-gradient-to-r from-primary-700 to-primary-500 hover:from-primary-600 hover:to-primary-400"
                      >
                        {nextStatus === "preparing" && "Start Preparing"}
                        {nextStatus === "ready" && "Mark Ready"}
                        {nextStatus === "completed" && "Complete"}
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Pagination (B7) */}
      {orders.length > 0 && (
        <div className="flex items-center justify-center gap-4">
          <Button
            variant="outline"
            size="sm"
            disabled={page === 0}
            onClick={() => setPage((p) => Math.max(0, p - 1))}
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            Previous
          </Button>
          <span className="text-sm text-gray-500">Page {page + 1}</span>
          <Button
            variant="outline"
            size="sm"
            disabled={orders.length < PAGE_SIZE}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
            <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
      )}

      {/* Order Detail Dialog */}
      <Dialog open={!!detailOrder} onOpenChange={() => setDetailOrder(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              Order #{detailOrder?.order_number}
            </DialogTitle>
          </DialogHeader>
          {detailOrder && (
            <div className="space-y-4">
              {/* Status */}
              <div className="flex items-center gap-2">
                {(() => {
                  const s = (detailOrder.status || "pending") as OrderStatus;
                  const c = STATUS_CONFIG[s];
                  const Icon = c.icon;
                  return (
                    <span className={`flex items-center gap-1.5 text-sm font-medium px-3 py-1 rounded-full ${c.color} ${c.bg}`}>
                      <Icon className="w-4 h-4" />
                      {c.label}
                    </span>
                  );
                })()}
                {detailOrder.payment_status === "refunded" && (
                  <span className="text-xs font-medium px-2 py-1 rounded-full bg-red-100 text-red-700">Refunded</span>
                )}
              </div>

              {/* Info */}
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-gray-400 text-xs">Table</p>
                  <p className="font-medium">
                    {detailOrder.tables
                      ? `Table ${(detailOrder.tables as { table_number: string }).table_number}`
                      : "N/A"}
                  </p>
                </div>
                <div>
                  <p className="text-gray-400 text-xs">Type</p>
                  <p className="font-medium capitalize">{detailOrder.order_type.replace("_", " ")}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-xs">Time</p>
                  <p className="font-medium">{formatTime(detailOrder.created_at)}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-xs">Total</p>
                  <p className="font-bold text-primary-700">RM {Number(detailOrder.total).toFixed(2)}</p>
                </div>
                {detailOrder.customer_phone && (
                  <div>
                    <p className="text-gray-400 text-xs">Phone</p>
                    <p className="font-medium">{detailOrder.customer_phone}</p>
                  </div>
                )}
                {detailOrder.delivery_address && (
                  <div className="col-span-2">
                    <p className="text-gray-400 text-xs">Delivery Address</p>
                    <p className="font-medium">{detailOrder.delivery_address}</p>
                  </div>
                )}
              </div>

              {/* Notes / cancel reason */}
              {detailOrder.notes && (
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs text-gray-400 mb-1">Notes</p>
                  <p className="text-sm">{detailOrder.notes}</p>
                </div>
              )}

              {/* Items */}
              <div>
                <p className="text-xs text-gray-400 mb-2">Items</p>
                <div className="space-y-2">
                  {detailOrder.order_items.map((item) => (
                    <div key={item.id} className="flex justify-between text-sm">
                      <div>
                        <span className="font-medium">{item.quantity}x</span>{" "}
                        {item.item_name}
                        {item.variants_json && (
                          <p className="text-xs text-gray-400">
                            {(Array.isArray(item.variants_json) ? item.variants_json as Array<Record<string, unknown>> : [])
                              .map((v) => String(v.name || ""))
                              .filter(Boolean)
                              .join(", ")}
                          </p>
                        )}
                        {item.special_instructions && (
                          <p className="text-xs text-primary-600">
                            Note: {item.special_instructions}
                          </p>
                        )}
                      </div>
                      <span className="font-medium">
                        RM {Number(item.subtotal).toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Summary */}
              <div className="border-t pt-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Subtotal</span>
                  <span>RM {Number(detailOrder.subtotal).toFixed(2)}</span>
                </div>
                {detailOrder.tax && Number(detailOrder.tax) > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Tax</span>
                    <span>RM {Number(detailOrder.tax).toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold mt-1">
                  <span>Total</span>
                  <span className="text-primary-700">RM {Number(detailOrder.total).toFixed(2)}</span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                {(detailOrder.status === "completed" || detailOrder.status === "cancelled") &&
                  detailOrder.payment_status !== "refunded" && (
                  <Button
                    variant="outline"
                    className="flex-1 text-red-500 border-red-200 hover:bg-red-50"
                    onClick={() => {
                      openRefundDialog(detailOrder);
                      setDetailOrder(null);
                    }}
                  >
                    <Ban className="w-4 h-4 mr-1" />
                    Refund
                  </Button>
                )}
                {detailOrder.status !== "cancelled" && detailOrder.status !== "completed" && (
                  <Button
                    variant="outline"
                    className="flex-1 text-red-500 border-red-200 hover:bg-red-50"
                    onClick={() => {
                      setCancelOrderId(detailOrder.id);
                      setDetailOrder(null);
                    }}
                  >
                    Cancel Order
                  </Button>
                )}
                {(() => {
                  const s = (detailOrder.status || "pending") as OrderStatus;
                  const next = getNextStatus(s);
                  if (!next) return null;
                  return (
                    <Button
                      className="flex-1 bg-gradient-to-r from-primary-700 to-primary-500"
                      onClick={() => {
                        updateOrderStatus(detailOrder.id, next);
                        setDetailOrder(null);
                      }}
                    >
                      {next === "preparing" && "Start Preparing"}
                      {next === "ready" && "Mark Ready"}
                      {next === "completed" && "Complete Order"}
                    </Button>
                  );
                })()}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Cancel Order Dialog (B4) */}
      <Dialog open={!!cancelOrderId} onOpenChange={() => { setCancelOrderId(null); setCancelReason(""); }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Cancel Order</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-gray-500">Please provide a reason for cancellation (optional).</p>
            <Textarea
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="e.g. Customer requested, out of stock..."
              rows={3}
            />
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => { setCancelOrderId(null); setCancelReason(""); }}
              >
                Keep Order
              </Button>
              <Button
                className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                onClick={cancelOrder}
              >
                Cancel Order
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Enhanced Refund Dialog */}
      <Dialog open={!!refundOrder} onOpenChange={() => setRefundOrder(null)}>
        <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Process Refund — Order #{refundOrder?.order_number}</DialogTitle>
          </DialogHeader>
          {refundOrder && (
            <div className="space-y-4">
              {/* Refund Type Toggle */}
              <div className="flex gap-2">
                <button
                  onClick={() => setRefundType("full")}
                  className={`flex-1 py-2 rounded-lg border text-sm font-medium transition-colors ${
                    refundType === "full"
                      ? "bg-red-50 border-red-300 text-red-700"
                      : "bg-white border-gray-200 text-gray-600"
                  }`}
                >
                  Full Refund
                </button>
                <button
                  onClick={() => setRefundType("partial")}
                  className={`flex-1 py-2 rounded-lg border text-sm font-medium transition-colors ${
                    refundType === "partial"
                      ? "bg-red-50 border-red-300 text-red-700"
                      : "bg-white border-gray-200 text-gray-600"
                  }`}
                >
                  Partial Refund
                </button>
              </div>

              {/* Item selection for partial refund */}
              {refundType === "partial" && (
                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-700">Select items to refund:</p>
                  {refundOrder.order_items.map((item) => (
                    <label key={item.id} className="flex items-center gap-3 bg-gray-50 rounded-lg p-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={refundSelectedItems.has(item.id)}
                        onChange={(e) => {
                          const newSet = new Set(refundSelectedItems);
                          if (e.target.checked) newSet.add(item.id);
                          else newSet.delete(item.id);
                          setRefundSelectedItems(newSet);
                        }}
                        className="rounded border-gray-300"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">{item.quantity}x {item.item_name}</p>
                      </div>
                      <span className="text-sm font-bold">RM {Number(item.subtotal).toFixed(2)}</span>
                    </label>
                  ))}
                </div>
              )}

              {/* Refund amount */}
              <div className="bg-red-50 rounded-lg p-3 text-center">
                <p className="text-xs text-red-600">Refund Amount</p>
                <p className="text-2xl font-bold text-red-700">RM {getRefundAmount().toFixed(2)}</p>
              </div>

              {/* Reason */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Reason *</label>
                <Textarea
                  value={refundReason}
                  onChange={(e) => setRefundReason(e.target.value)}
                  placeholder="e.g. Wrong order, food quality issue..."
                  rows={2}
                />
              </div>

              <div className="flex gap-2">
                <Button variant="outline" className="flex-1" onClick={() => setRefundOrder(null)}>
                  Cancel
                </Button>
                <Button
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                  onClick={processRefund}
                  disabled={!refundReason.trim() || getRefundAmount() <= 0}
                >
                  Process Refund
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
