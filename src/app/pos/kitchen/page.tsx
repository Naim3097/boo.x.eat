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
  Bell,
  RefreshCw,
  User,
  AlertTriangle,
} from "lucide-react";
import type { Order, OrderItem } from "@/types/database";

interface KitchenOrder {
  id: string;
  order_number: string;
  status: string;
  table_number?: string;
  order_type: string;
  created_at: string;
  items: OrderItem[];
  elapsed_minutes: number;
}

export default function POSKitchenPage() {
  const { session, loading: sessionLoading, logout } = usePOSSession();
  const [orders, setOrders] = useState<KitchenOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [now, setNow] = useState(Date.now());

  // Update elapsed time every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(interval);
  }, []);

  const loadOrders = useCallback(async () => {
    if (!session?.outlet) return;
    const supabase = createClient();

    // Get today's active orders (pending + preparing only)
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const { data: ordersData } = await supabase
      .from("orders")
      .select("*")
      .eq("outlet_id", session.outlet.id)
      .in("status", ["pending", "preparing"])
      .gte("created_at", today.toISOString())
      .order("created_at", { ascending: true })
      .returns<Order[]>();

    if (!ordersData || ordersData.length === 0) {
      setOrders([]);
      setLoading(false);
      return;
    }

    // Get all order items
    const orderIds = ordersData.map((o) => o.id);
    const { data: items } = await supabase
      .from("order_items")
      .select("*")
      .in("order_id", orderIds)
      .returns<OrderItem[]>();

    // Get table info
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

    const kitchenOrders: KitchenOrder[] = ordersData.map((order) => {
      const elapsed = Math.floor(
        (Date.now() - new Date(order.created_at!).getTime()) / 60000
      );
      return {
        id: order.id,
        order_number: order.order_number,
        status: order.status || "pending",
        table_number: order.table_id ? tableMap[order.table_id] : undefined,
        order_type: order.order_type,
        created_at: order.created_at!,
        items: (items || []).filter((item) => item.order_id === order.id),
        elapsed_minutes: elapsed,
      };
    });

    setOrders(kitchenOrders);
    setLoading(false);
  }, [session]);

  // Initial load
  useEffect(() => {
    if (session?.outlet) {
      loadOrders();
    }
  }, [session, loadOrders]);

  // Realtime subscription
  useEffect(() => {
    if (!session?.outlet) return;
    const supabase = createClient();

    const channel = supabase
      .channel("kitchen-orders-realtime")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "orders",
          filter: `outlet_id=eq.${session.outlet.id}`,
        },
        (payload) => {
          // Play sound for new orders
          if (payload.eventType === "INSERT") {
            try {
              const audio = new Audio("/notification.mp3");
              audio.play().catch(() => {});
            } catch {
              // ignore
            }
          }
          loadOrders();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [session, loadOrders]);

  async function markPreparing(orderId: string) {
    const supabase = createClient();
    const { error } = await supabase
      .from("orders")
      .update({ status: "preparing", updated_at: new Date().toISOString() })
      .eq("id", orderId);

    if (error) {
      toast.error("Failed to update order");
    } else {
      toast.success("Order started");
      loadOrders();
    }
  }

  async function markReady(orderId: string) {
    const supabase = createClient();
    const { error } = await supabase
      .from("orders")
      .update({ status: "ready", updated_at: new Date().toISOString() })
      .eq("id", orderId);

    if (error) {
      toast.error("Failed to update order");
    } else {
      toast.success("Order ready for pickup");
      loadOrders();
    }
  }

  function getElapsedColor(minutes: number): string {
    if (minutes >= 20) return "text-red-600 bg-red-50";
    if (minutes >= 10) return "text-amber-600 bg-amber-50";
    return "text-green-600 bg-green-50";
  }

  // Recalculate elapsed using `now`
  const ordersWithElapsed = orders.map((o) => ({
    ...o,
    elapsed_minutes: Math.floor((now - new Date(o.created_at).getTime()) / 60000),
  }));

  const pendingOrders = ordersWithElapsed.filter((o) => o.status === "pending");
  const preparingOrders = ordersWithElapsed.filter((o) => o.status === "preparing");

  if (sessionLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary-400" />
      </div>
    );
  }

  if (!session) return null;

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Top Bar */}
      <div className="bg-gray-800 border-b border-gray-700 px-4 py-3 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <ChefHat className="w-6 h-6 text-primary-400" />
          <div>
            <h1 className="text-sm font-bold">Kitchen Display</h1>
            <p className="text-xs text-gray-400">
              {session.outlet?.name} &middot; {pendingOrders.length + preparingOrders.length} active orders
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <User className="w-4 h-4" />
            <span>{session.staff.name}</span>
          </div>
          <button
            onClick={() => loadOrders()}
            className="p-2 rounded-lg hover:bg-gray-700 text-gray-400"
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={logout}
            className="p-2 rounded-lg hover:bg-gray-700 text-gray-400"
            title="Logout"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Two-column Layout: Pending | Preparing */}
      <div className="flex h-[calc(100vh-56px)]">
        {/* Pending Column */}
        <div className="flex-1 border-r border-gray-700 overflow-y-auto">
          <div className="px-4 py-3 bg-amber-900/30 border-b border-gray-700 sticky top-0">
            <div className="flex items-center gap-2">
              <Bell className="w-5 h-5 text-amber-400" />
              <h2 className="font-bold text-amber-300">
                New Orders ({pendingOrders.length})
              </h2>
            </div>
          </div>

          <div className="p-4 space-y-4">
            {pendingOrders.length === 0 ? (
              <div className="text-center py-16 text-gray-500">
                <Clock className="w-10 h-10 mx-auto mb-2 opacity-50" />
                <p>No pending orders</p>
              </div>
            ) : (
              pendingOrders.map((order) => (
                <div
                  key={order.id}
                  className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden"
                >
                  {/* Order Header */}
                  <div className="px-4 py-3 bg-gray-800 border-b border-gray-700 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-xl font-bold text-white">
                        #{order.order_number}
                      </span>
                      {order.table_number && (
                        <span className="px-2 py-0.5 rounded bg-gray-700 text-sm text-gray-300">
                          Table {order.table_number}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-2 py-1 rounded-lg text-sm font-medium ${getElapsedColor(
                          order.elapsed_minutes
                        )}`}
                      >
                        {order.elapsed_minutes >= 20 && (
                          <AlertTriangle className="w-3 h-3 inline mr-1" />
                        )}
                        {order.elapsed_minutes}m
                      </span>
                    </div>
                  </div>

                  {/* Items */}
                  <div className="px-4 py-3 space-y-2">
                    {order.items.map((item) => (
                      <div key={item.id} className="flex items-start gap-3">
                        <span className="text-lg font-bold text-primary-400 min-w-[2rem]">
                          {item.quantity}x
                        </span>
                        <div>
                          <p className="font-medium text-white text-lg">
                            {item.item_name}
                          </p>
                          {item.special_instructions && (
                            <p className="text-sm text-amber-400 mt-0.5">
                              ⚠ {item.special_instructions}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Action */}
                  <div className="px-4 py-3 border-t border-gray-700">
                    <button
                      onClick={() => markPreparing(order.id)}
                      className="w-full py-3 rounded-lg bg-blue-600 text-white font-bold text-lg hover:bg-blue-500 transition-colors flex items-center justify-center gap-2"
                    >
                      <ChefHat className="w-5 h-5" />
                      Start Preparing
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Preparing Column */}
        <div className="flex-1 overflow-y-auto">
          <div className="px-4 py-3 bg-blue-900/30 border-b border-gray-700 sticky top-0">
            <div className="flex items-center gap-2">
              <ChefHat className="w-5 h-5 text-blue-400" />
              <h2 className="font-bold text-blue-300">
                Preparing ({preparingOrders.length})
              </h2>
            </div>
          </div>

          <div className="p-4 space-y-4">
            {preparingOrders.length === 0 ? (
              <div className="text-center py-16 text-gray-500">
                <ChefHat className="w-10 h-10 mx-auto mb-2 opacity-50" />
                <p>No orders being prepared</p>
              </div>
            ) : (
              preparingOrders.map((order) => (
                <div
                  key={order.id}
                  className="bg-gray-800 rounded-xl border border-blue-800/50 overflow-hidden"
                >
                  {/* Order Header */}
                  <div className="px-4 py-3 bg-blue-900/20 border-b border-gray-700 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-xl font-bold text-white">
                        #{order.order_number}
                      </span>
                      {order.table_number && (
                        <span className="px-2 py-0.5 rounded bg-gray-700 text-sm text-gray-300">
                          Table {order.table_number}
                        </span>
                      )}
                    </div>
                    <span
                      className={`px-2 py-1 rounded-lg text-sm font-medium ${getElapsedColor(
                        order.elapsed_minutes
                      )}`}
                    >
                      {order.elapsed_minutes >= 20 && (
                        <AlertTriangle className="w-3 h-3 inline mr-1" />
                      )}
                      {order.elapsed_minutes}m
                    </span>
                  </div>

                  {/* Items */}
                  <div className="px-4 py-3 space-y-2">
                    {order.items.map((item) => (
                      <div key={item.id} className="flex items-start gap-3">
                        <span className="text-lg font-bold text-primary-400 min-w-[2rem]">
                          {item.quantity}x
                        </span>
                        <div>
                          <p className="font-medium text-white text-lg">
                            {item.item_name}
                          </p>
                          {item.special_instructions && (
                            <p className="text-sm text-amber-400 mt-0.5">
                              ⚠ {item.special_instructions}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Action */}
                  <div className="px-4 py-3 border-t border-gray-700">
                    <button
                      onClick={() => markReady(order.id)}
                      className="w-full py-3 rounded-lg bg-green-600 text-white font-bold text-lg hover:bg-green-500 transition-colors flex items-center justify-center gap-2"
                    >
                      <CheckCircle2 className="w-5 h-5" />
                      Mark Ready
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
