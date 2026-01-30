"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { useStore } from "@/hooks/use-store";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
} from "lucide-react";
import type { Order, OrderItem } from "@/types/database";

type OrderStatus = "pending" | "preparing" | "ready" | "completed" | "cancelled";

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

const STATUS_FLOW: OrderStatus[] = ["pending", "preparing", "ready", "completed"];

export default function OrdersPage() {
  const { outlet, loading: storeLoading } = useStore();
  const [orders, setOrders] = useState<OrderWithItems[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<OrderStatus | "all">("all");
  const [detailOrder, setDetailOrder] = useState<OrderWithItems | null>(null);

  const loadOrders = useCallback(async () => {
    if (!outlet) return;
    const supabase = createClient();

    const { data, error } = await supabase
      .from("orders")
      .select("*, order_items(*), tables(table_number)")
      .eq("outlet_id", outlet.id)
      .order("created_at", { ascending: false })
      .limit(100);

    if (error) {
      toast.error("Failed to load orders");
      setLoading(false);
      return;
    }

    setOrders((data as unknown as OrderWithItems[]) || []);
    setLoading(false);
  }, [outlet]);

  useEffect(() => {
    if (outlet) loadOrders();
  }, [outlet, loadOrders]);

  // Real-time subscription
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
        () => {
          // Reload orders on any change
          loadOrders();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [outlet, loadOrders]);

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

    // Update detail view if open
    if (detailOrder?.id === orderId) {
      setDetailOrder((prev) => prev ? { ...prev, status: newStatus } : null);
    }
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

  // Filter orders
  const filteredOrders = filterStatus === "all"
    ? orders
    : orders.filter((o) => o.status === filterStatus);

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

      {/* Filter Tabs */}
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
                      <p className="text-xs text-gray-500 mt-0.5">
                        {order.tables
                          ? `Table ${(order.tables as { table_number: string }).table_number}`
                          : order.order_type}
                        {" · "}
                        {formatTime(order.created_at)}
                        {" · "}
                        <span className="font-medium">{timeAgo(order.created_at)}</span>
                      </p>
                    </div>
                    <span className="font-bold text-primary-700">
                      RM {Number(order.total).toFixed(2)}
                    </span>
                  </div>

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
                    {status !== "cancelled" && status !== "completed" && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => updateOrderStatus(order.id, "cancelled")}
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
              </div>

              {/* Items */}
              <div>
                <p className="text-xs text-gray-400 mb-2">Items</p>
                <div className="space-y-2">
                  {detailOrder.order_items.map((item) => (
                    <div key={item.id} className="flex justify-between text-sm">
                      <div>
                        <span className="font-medium">{item.quantity}x</span>{" "}
                        {item.item_name}
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
              {(() => {
                const s = (detailOrder.status || "pending") as OrderStatus;
                const next = getNextStatus(s);
                if (!next && s !== "cancelled") return null;
                return (
                  <div className="flex gap-2">
                    {s !== "cancelled" && s !== "completed" && (
                      <Button
                        variant="outline"
                        className="flex-1 text-red-500 border-red-200 hover:bg-red-50"
                        onClick={() => {
                          updateOrderStatus(detailOrder.id, "cancelled");
                          setDetailOrder(null);
                        }}
                      >
                        Cancel Order
                      </Button>
                    )}
                    {next && (
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
                    )}
                  </div>
                );
              })()}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
