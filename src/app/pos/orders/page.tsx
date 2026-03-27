"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { usePOSSession } from "@/hooks/use-pos-session";
import { toast } from "sonner";
import {
  Loader2,
  LogOut,
  Clock,
  ChefHat,
  CheckCircle2,
  XCircle,
  UtensilsCrossed,
  RefreshCw,
  User,
  Package,
  Truck,
  Plus,
  Phone,
  MapPin,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { playNotificationSound } from "@/lib/notification-sound";
import type { Order, OrderItem } from "@/types/database";

type StatusFilter = "all" | "pending" | "preparing" | "ready" | "completed" | "cancelled";
type OrderType = "dine_in" | "takeaway" | "delivery";

interface OrderWithItems extends Order {
  items: OrderItem[];
  table_number?: string;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bgColor: string; icon: React.ReactNode }> = {
  pending: { label: "Pending", color: "text-amber-700", bgColor: "bg-amber-50 border-amber-200", icon: <Clock className="w-4 h-4" /> },
  preparing: { label: "Preparing", color: "text-blue-700", bgColor: "bg-blue-50 border-blue-200", icon: <ChefHat className="w-4 h-4" /> },
  ready: { label: "Ready", color: "text-green-700", bgColor: "bg-green-50 border-green-200", icon: <UtensilsCrossed className="w-4 h-4" /> },
  completed: { label: "Completed", color: "text-gray-600", bgColor: "bg-gray-50 border-gray-200", icon: <CheckCircle2 className="w-4 h-4" /> },
  cancelled: { label: "Cancelled", color: "text-red-600", bgColor: "bg-red-50 border-red-200", icon: <XCircle className="w-4 h-4" /> },
};

const ORDER_TYPE_ICONS: Record<OrderType, React.ReactNode> = {
  dine_in: <UtensilsCrossed className="w-3 h-3" />,
  takeaway: <Package className="w-3 h-3" />,
  delivery: <Truck className="w-3 h-3" />,
};

export default function POSOrdersPage() {
  const { session, loading: sessionLoading, logout } = usePOSSession();
  const [orders, setOrders] = useState<OrderWithItems[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<StatusFilter>("all");
  const [selectedOrder, setSelectedOrder] = useState<OrderWithItems | null>(null);

  // Audio notification (B3)
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);

  // Cancel dialog (B4)
  const [cancelOrderId, setCancelOrderId] = useState<string | null>(null);
  const [cancelReason, setCancelReason] = useState("");

  // Manual order dialog (B8)
  const [manualOrderOpen, setManualOrderOpen] = useState(false);
  const [manualOrderType, setManualOrderType] = useState<OrderType>("takeaway");
  const [manualPhone, setManualPhone] = useState("");
  const [manualAddress, setManualAddress] = useState("");
  const [manualNotes, setManualNotes] = useState("");

  // Request notification permission (B3)
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

  const loadOrders = useCallback(async () => {
    if (!session?.outlet) return;
    const supabase = createClient();

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const { data: ordersData } = await supabase
      .from("orders")
      .select("*")
      .eq("outlet_id", session.outlet.id)
      .gte("created_at", today.toISOString())
      .order("created_at", { ascending: false })
      .returns<Order[]>();

    if (!ordersData || ordersData.length === 0) {
      setOrders([]);
      setLoading(false);
      return;
    }

    const orderIds = ordersData.map((o) => o.id);
    const { data: items } = await supabase
      .from("order_items")
      .select("*")
      .in("order_id", orderIds)
      .returns<OrderItem[]>();

    const tableIds = ordersData
      .map((o) => o.table_id)
      .filter((id): id is string => !!id);

    let tableMap: Record<string, string> = {};
    if (tableIds.length > 0) {
      const { data: tables } = await supabase
        .from("tables")
        .select("id, table_number")
        .in("id", tableIds);

      if (tables) {
        tableMap = Object.fromEntries(
          tables.map((t) => [(t as { id: string }).id, (t as { table_number: string }).table_number])
        );
      }
    }

    const ordersWithItems: OrderWithItems[] = ordersData.map((order) => ({
      ...order,
      items: (items || []).filter((item) => item.order_id === order.id),
      table_number: order.table_id ? tableMap[order.table_id] : undefined,
    }));

    setOrders(ordersWithItems);
    setLoading(false);
  }, [session]);

  useEffect(() => {
    if (session?.outlet) loadOrders();
  }, [session, loadOrders]);

  // Realtime subscription with sound (B3)
  useEffect(() => {
    if (!session?.outlet) return;
    const supabase = createClient();

    const channel = supabase
      .channel("pos-orders-realtime")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "orders",
          filter: `outlet_id=eq.${session.outlet.id}`,
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
  }, [session, loadOrders, notificationsEnabled]);

  async function updateOrderStatus(orderId: string, newStatus: string) {
    const supabase = createClient();
    const { error } = await supabase
      .from("orders")
      .update({ status: newStatus, updated_at: new Date().toISOString() })
      .eq("id", orderId);

    if (error) {
      toast.error("Failed to update order");
    } else {
      toast.success(`Order marked as ${newStatus}`);
      loadOrders();
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
    setSelectedOrder(null);
    loadOrders();
  }

  // Create manual order (B8)
  async function createManualOrder() {
    if (!session?.outlet) return;
    const supabase = createClient();

    const now = new Date();
    const orderNum = `${now.getHours().toString().padStart(2, "0")}${now.getMinutes().toString().padStart(2, "0")}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

    const { error } = await supabase.from("orders").insert({
      outlet_id: session.outlet.id,
      order_number: orderNum,
      order_type: manualOrderType,
      status: "pending",
      subtotal: 0,
      total: 0,
      notes: manualNotes || null,
      customer_phone: manualPhone || null,
      delivery_address: manualOrderType === "delivery" ? (manualAddress || null) : null,
    });

    if (error) {
      toast.error("Failed to create order");
      return;
    }

    toast.success(`${manualOrderType.replace("_", " ")} order created: #${orderNum}`);
    setManualOrderOpen(false);
    setManualPhone("");
    setManualAddress("");
    setManualNotes("");
    loadOrders();
  }

  function getNextStatus(currentStatus: string): string | null {
    const flow: Record<string, string> = { pending: "preparing", preparing: "ready", ready: "completed" };
    return flow[currentStatus] || null;
  }

  function getTimeAgo(dateStr: string): string {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "Just now";
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    return `${hours}h ${mins % 60}m ago`;
  }

  const filteredOrders = filter === "all" ? orders : orders.filter((o) => o.status === filter);

  const counts = {
    all: orders.length,
    pending: orders.filter((o) => o.status === "pending").length,
    preparing: orders.filter((o) => o.status === "preparing").length,
    ready: orders.filter((o) => o.status === "ready").length,
    completed: orders.filter((o) => o.status === "completed").length,
    cancelled: orders.filter((o) => o.status === "cancelled").length,
  };

  if (sessionLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
      </div>
    );
  }

  if (!session) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Bar */}
      <div className="bg-white border-b px-4 py-3 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-600 to-accent-500 flex items-center justify-center">
            <span className="text-white font-bold text-sm">bx</span>
          </div>
          <div>
            <h1 className="text-sm font-bold text-gray-900">POS Orders</h1>
            <p className="text-xs text-gray-500">
              {session.outlet?.name} &middot; {session.store?.name}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <User className="w-4 h-4" />
            <span>{session.staff.name}</span>
            <span className="px-2 py-0.5 rounded-full bg-primary-100 text-primary-700 text-xs font-medium capitalize">
              {session.staff.role}
            </span>
          </div>
          {/* New order button (B8) */}
          <button
            onClick={() => setManualOrderOpen(true)}
            className="p-2 rounded-lg hover:bg-gray-100 text-primary-600"
            title="New Order"
          >
            <Plus className="w-4 h-4" />
          </button>
          <button
            onClick={() => loadOrders()}
            className="p-2 rounded-lg hover:bg-gray-100 text-gray-500"
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={logout}
            className="p-2 rounded-lg hover:bg-gray-100 text-gray-500"
            title="Logout"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Status Filter Tabs */}
      <div className="bg-white border-b px-4 py-2 flex gap-2 overflow-x-auto">
        {(["all", "pending", "preparing", "ready", "completed", "cancelled"] as StatusFilter[]).map(
          (status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                filter === status
                  ? "bg-primary-600 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              <span className="capitalize">{status}</span>
              {counts[status] > 0 && (
                <span
                  className={`px-1.5 py-0.5 rounded-full text-xs ${
                    filter === status ? "bg-white/20 text-white" : "bg-gray-200 text-gray-700"
                  }`}
                >
                  {counts[status]}
                </span>
              )}
            </button>
          )
        )}
      </div>

      {/* Orders Grid */}
      <div className="p-4">
        {filteredOrders.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <UtensilsCrossed className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p className="text-lg font-medium">No orders</p>
            <p className="text-sm">
              {filter === "all" ? "No orders today yet" : `No ${filter} orders`}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredOrders.map((order) => {
              const statusConf = STATUS_CONFIG[order.status || "pending"];
              const nextStatus = getNextStatus(order.status || "pending");
              const isSelected = selectedOrder?.id === order.id;
              const orderType = (order.order_type || "dine_in") as OrderType;

              return (
                <div
                  key={order.id}
                  onClick={() => setSelectedOrder(isSelected ? null : order)}
                  className={`rounded-xl border-2 bg-white shadow-sm cursor-pointer transition-all hover:shadow-md ${
                    isSelected ? "border-primary-500 ring-2 ring-primary-200" : "border-gray-200"
                  }`}
                >
                  {/* Card Header */}
                  <div className="px-4 py-3 border-b flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-bold text-gray-900">
                        #{order.order_number}
                      </span>
                      {order.table_number && (
                        <span className="px-2 py-0.5 rounded bg-gray-100 text-xs font-medium text-gray-600">
                          Table {order.table_number}
                        </span>
                      )}
                      {/* Order type badge (B8) */}
                      {orderType !== "dine_in" && (
                        <span className={`flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${
                          orderType === "takeaway" ? "bg-orange-50 text-orange-700" : "bg-purple-50 text-purple-700"
                        }`}>
                          {ORDER_TYPE_ICONS[orderType]}
                          {orderType === "takeaway" ? "Takeaway" : "Delivery"}
                        </span>
                      )}
                    </div>
                    <div
                      className={`flex items-center gap-1 px-2 py-1 rounded-full border text-xs font-medium ${statusConf.bgColor} ${statusConf.color}`}
                    >
                      {statusConf.icon}
                      {statusConf.label}
                    </div>
                  </div>

                  {/* Items */}
                  <div className="px-4 py-3">
                    <div className="space-y-1.5">
                      {order.items.slice(0, 4).map((item) => (
                        <div key={item.id} className="flex items-start justify-between text-sm">
                          <div className="flex items-start gap-2 flex-1 min-w-0">
                            <span className="font-medium text-primary-700 bg-primary-50 px-1.5 rounded text-xs mt-0.5">
                              {item.quantity}x
                            </span>
                            <div className="min-w-0">
                              <p className="font-medium text-gray-800 truncate">{item.item_name}</p>
                              {item.special_instructions && (
                                <p className="text-xs text-gray-400 truncate">{item.special_instructions}</p>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                      {order.items.length > 4 && (
                        <p className="text-xs text-gray-400">+{order.items.length - 4} more items</p>
                      )}
                      {order.items.length === 0 && (
                        <p className="text-xs text-gray-400 italic">No items yet</p>
                      )}
                    </div>
                  </div>

                  {/* Card Footer */}
                  <div className="px-4 py-3 border-t bg-gray-50/50 flex items-center justify-between rounded-b-xl">
                    <div className="text-xs text-gray-400">
                      {order.created_at && getTimeAgo(order.created_at)}
                    </div>
                    <div className="text-sm font-bold text-gray-900">
                      RM {Number(order.total).toFixed(2)}
                    </div>
                  </div>

                  {/* Action Buttons (expanded) */}
                  {isSelected && (
                    <div className="px-4 py-3 border-t bg-gray-50 flex gap-2 rounded-b-xl">
                      {nextStatus && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            updateOrderStatus(order.id, nextStatus);
                            setSelectedOrder(null);
                          }}
                          className="flex-1 py-2 rounded-lg bg-primary-600 text-white text-sm font-medium hover:bg-primary-700 transition-colors"
                        >
                          Mark as {STATUS_CONFIG[nextStatus]?.label}
                        </button>
                      )}
                      {order.status !== "cancelled" && order.status !== "completed" && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setCancelOrderId(order.id);
                          }}
                          className="px-4 py-2 rounded-lg border border-red-200 text-red-600 text-sm font-medium hover:bg-red-50 transition-colors"
                        >
                          Cancel
                        </button>
                      )}
                      {(order.status === "completed" || order.status === "cancelled") &&
                        order.payment_status === "paid" && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            // Simple refund for POS
                            const supabase = createClient();
                            supabase.from("refunds").insert({
                              order_id: order.id,
                              amount: Number(order.total),
                              reason: "POS refund",
                              refund_type: "full",
                            }).then(() => {
                              supabase.from("orders").update({ payment_status: "refunded" }).eq("id", order.id).then(() => {
                                toast.success("Refund processed");
                                loadOrders();
                              });
                            });
                          }}
                          className="px-4 py-2 rounded-lg border border-red-200 text-red-600 text-sm font-medium hover:bg-red-50 transition-colors"
                        >
                          Refund
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Cancel Dialog (B4) */}
      <Dialog open={!!cancelOrderId} onOpenChange={() => { setCancelOrderId(null); setCancelReason(""); }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Cancel Order</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-gray-500">Provide a reason for cancellation (optional).</p>
            <Textarea
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="e.g. Customer requested, out of stock..."
              rows={3}
            />
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => { setCancelOrderId(null); setCancelReason(""); }}>
                Keep Order
              </Button>
              <Button className="flex-1 bg-red-600 hover:bg-red-700 text-white" onClick={cancelOrder}>
                Cancel Order
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Manual Order Dialog (B8) */}
      <Dialog open={manualOrderOpen} onOpenChange={setManualOrderOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>New Order</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Order Type</label>
              <div className="flex gap-2">
                {(["dine_in", "takeaway", "delivery"] as OrderType[]).map((type) => (
                  <button
                    key={type}
                    onClick={() => setManualOrderType(type)}
                    className={`flex-1 py-2 rounded-lg border text-sm font-medium transition-colors ${
                      manualOrderType === type
                        ? "bg-primary-600 text-white border-primary-600"
                        : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
                    }`}
                  >
                    <span className="capitalize">{type.replace("_", " ")}</span>
                  </button>
                ))}
              </div>
            </div>

            {(manualOrderType === "takeaway" || manualOrderType === "delivery") && (
              <div>
                <label className="text-sm font-medium mb-1 flex items-center gap-1">
                  <Phone className="w-3 h-3" /> Phone
                </label>
                <Input
                  value={manualPhone}
                  onChange={(e) => setManualPhone(e.target.value)}
                  placeholder="e.g. 012-345 6789"
                />
              </div>
            )}

            {manualOrderType === "delivery" && (
              <div>
                <label className="text-sm font-medium mb-1 flex items-center gap-1">
                  <MapPin className="w-3 h-3" /> Delivery Address
                </label>
                <Textarea
                  value={manualAddress}
                  onChange={(e) => setManualAddress(e.target.value)}
                  placeholder="Full delivery address"
                  rows={2}
                />
              </div>
            )}

            <div>
              <label className="text-sm font-medium mb-1 block">Notes</label>
              <Textarea
                value={manualNotes}
                onChange={(e) => setManualNotes(e.target.value)}
                placeholder="Any special notes..."
                rows={2}
              />
            </div>

            <Button
              className="w-full bg-gradient-to-r from-primary-700 to-primary-500"
              onClick={createManualOrder}
            >
              Create Order
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
