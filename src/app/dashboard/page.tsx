"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { useStore } from "@/hooks/use-store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ShoppingCart, DollarSign, Users, TrendingUp, Loader2, Clock, AlertTriangle, Package } from "lucide-react";
import type { Order } from "@/types/database";

interface LowStockItem {
  id: string;
  name: string;
  current_stock: number;
  low_stock_threshold: number;
  unit: string;
}

export default function DashboardPage() {
  const { store, outlet, outlets, tierLimits, loading: storeLoading } = useStore();
  const [loading, setLoading] = useState(true);
  const [todayOrders, setTodayOrders] = useState(0);
  const [todayRevenue, setTodayRevenue] = useState(0);
  const [activeTables, setActiveTables] = useState(0);
  const [avgOrderValue, setAvgOrderValue] = useState(0);
  const [recentOrders, setRecentOrders] = useState<(Order & { tables: { table_number: string } | null })[]>([]);
  const [lowStockItems, setLowStockItems] = useState<LowStockItem[]>([]);

  const loadDashboard = useCallback(async () => {
    if (!store) return;
    const supabase = createClient();

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Build query based on whether viewing single outlet or all
    let ordersQuery = supabase
      .from("orders")
      .select("*, tables(table_number)")
      .gte("created_at", today.toISOString())
      .order("created_at", { ascending: false });

    let tablesQuery = supabase
      .from("tables")
      .select("id, status")
      .eq("status", "occupied");

    if (outlet) {
      ordersQuery = ordersQuery.eq("outlet_id", outlet.id);
      tablesQuery = tablesQuery.eq("outlet_id", outlet.id);
    } else {
      // All outlets for this store
      const outletIds = outlets.map((o) => o.id);
      if (outletIds.length > 0) {
        ordersQuery = ordersQuery.in("outlet_id", outletIds);
        tablesQuery = tablesQuery.in("outlet_id", outletIds);
      }
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const queries: any[] = [ordersQuery, tablesQuery];

    // Load low stock items if inventory feature is available
    if (tierLimits.hasInventory) {
      let invQuery = supabase
        .from("inventory_items")
        .select("id, name, current_stock, low_stock_threshold, unit");
      if (outlet) {
        invQuery = invQuery.eq("outlet_id", outlet.id);
      } else {
        const outletIds = outlets.map((o) => o.id);
        if (outletIds.length > 0) invQuery = invQuery.in("outlet_id", outletIds);
      }
      queries.push(invQuery);
    }

    const results = await Promise.all(queries);
    const [ordersRes, tablesRes] = results as [
      { data: (Order & { tables: { table_number: string } | null })[] | null },
      { data: { id: string; status: string }[] | null },
    ];

    const orders = (ordersRes.data || []) as (Order & { tables: { table_number: string } | null })[];
    const validOrders = orders.filter((o) => o.status !== "cancelled");
    const revenue = validOrders.reduce((sum, o) => sum + Number(o.total), 0);

    setTodayOrders(orders.length);
    setTodayRevenue(revenue);
    setAvgOrderValue(validOrders.length > 0 ? revenue / validOrders.length : 0);
    setActiveTables(tablesRes.data?.length || 0);
    setRecentOrders(orders.slice(0, 5));

    // Low stock items
    if (tierLimits.hasInventory && results[2]) {
      const invRes = results[2] as { data: LowStockItem[] | null };
      const allItems = invRes.data || [];
      setLowStockItems(allItems.filter((i) => Number(i.current_stock) <= Number(i.low_stock_threshold)));
    }

    setLoading(false);
  }, [store, outlet, outlets, tierLimits]);

  useEffect(() => {
    if (store) loadDashboard();
  }, [store, loadDashboard]);

  // Real-time updates
  useEffect(() => {
    if (!store) return;
    const supabase = createClient();
    const channelFilter = outlet
      ? `outlet_id=eq.${outlet.id}`
      : undefined;

    let channel = supabase.channel("dashboard-realtime");
    if (channelFilter) {
      channel = channel.on("postgres_changes", {
        event: "*",
        schema: "public",
        table: "orders",
        filter: channelFilter,
      }, () => { loadDashboard(); });
    } else {
      channel = channel.on("postgres_changes", {
        event: "*",
        schema: "public",
        table: "orders",
      }, () => { loadDashboard(); });
    }
    channel.subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [store, outlet, loadDashboard]);

  const _isConsolidated = !outlet && outlets.length > 1;
  const _outletNameMap = new Map(outlets.map((o) => [o.id, o.name]));

  if (storeLoading || loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 animate-spin text-primary-600" />
      </div>
    );
  }

  function formatTime(dateStr: string | null): string {
    if (!dateStr) return "";
    return new Date(dateStr).toLocaleTimeString("en-MY", { hour: "2-digit", minute: "2-digit" });
  }

  function timeAgo(dateStr: string | null): string {
    if (!dateStr) return "";
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "Just now";
    if (mins < 60) return `${mins}m ago`;
    return `${Math.floor(mins / 60)}h ${mins % 60}m ago`;
  }

  const STATUS_COLORS: Record<string, string> = {
    pending: "bg-yellow-100 text-yellow-700",
    preparing: "bg-blue-100 text-blue-700",
    ready: "bg-green-100 text-green-700",
    completed: "bg-gray-100 text-gray-600",
    cancelled: "bg-red-100 text-red-600",
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome to your boo.x.eat dashboard. Here&apos;s an overview of your business.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Today&apos;s Orders</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{todayOrders}</div>
            <p className="text-xs text-muted-foreground">
              {todayOrders === 0 ? "No orders yet" : "orders today"}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Today&apos;s Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">RM {todayRevenue.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              {todayRevenue === 0 ? "No revenue yet" : "excluding cancelled"}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Active Tables</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeTables}</div>
            <p className="text-xs text-muted-foreground">
              {activeTables === 0 ? "No active tables" : "currently occupied"}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Avg Order Value</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">RM {avgOrderValue.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              {avgOrderValue === 0 ? "No data yet" : "per order"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Low Stock Alerts */}
      {lowStockItems.length > 0 && (
        <Card className="border-amber-200 bg-amber-50/50">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
              <CardTitle className="text-base">Low Stock Alerts</CardTitle>
              <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium">
                {lowStockItems.length} item{lowStockItems.length > 1 ? "s" : ""}
              </span>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {lowStockItems.slice(0, 5).map((item) => (
                <div key={item.id} className="flex items-center justify-between py-1.5">
                  <div className="flex items-center gap-2">
                    <Package className="w-4 h-4 text-amber-500" />
                    <span className="text-sm font-medium text-gray-900">{item.name}</span>
                  </div>
                  <span className={`text-sm font-bold ${Number(item.current_stock) <= 0 ? "text-red-600" : "text-amber-600"}`}>
                    {Number(item.current_stock).toFixed(1)} {item.unit}
                  </span>
                </div>
              ))}
              {lowStockItems.length > 5 && (
                <p className="text-xs text-amber-600">+{lowStockItems.length - 5} more items</p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Orders */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Orders</CardTitle>
        </CardHeader>
        <CardContent>
          {recentOrders.length === 0 ? (
            <div className="flex items-center justify-center h-32 text-muted-foreground">
              No orders yet. Orders will appear here once customers start ordering.
            </div>
          ) : (
            <div className="space-y-3">
              {recentOrders.map((order) => (
                <div key={order.id} className="flex items-center justify-between py-2 border-b last:border-0">
                  <div className="flex items-center gap-3">
                    <Clock className="w-4 h-4 text-gray-400" />
                    <div>
                      <p className="text-sm font-medium">
                        Order #{order.order_number}
                        {order.tables && (
                          <span className="text-gray-400 font-normal"> - Table {(order.tables as { table_number: string }).table_number}</span>
                        )}
                      </p>
                      <p className="text-xs text-gray-400">
                        {formatTime(order.created_at)} &middot; {timeAgo(order.created_at)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full capitalize ${STATUS_COLORS[order.status || "pending"]}`}>
                      {order.status || "pending"}
                    </span>
                    <span className="font-bold text-sm">RM {Number(order.total).toFixed(2)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
