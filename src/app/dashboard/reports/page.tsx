"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { useStore } from "@/hooks/use-store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DollarSign,
  ShoppingCart,
  TrendingUp,
  Loader2,
  Calendar,
} from "lucide-react";
import type { Order } from "@/types/database";

interface DaySummary {
  date: string;
  orders: number;
  revenue: number;
}

interface TopItem {
  item_name: string;
  total_qty: number;
  total_revenue: number;
}

export default function ReportsPage() {
  const { outlet, loading: storeLoading } = useStore();
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<"today" | "7days" | "30days">("today");

  // Stats
  const [totalOrders, setTotalOrders] = useState(0);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [avgOrderValue, setAvgOrderValue] = useState(0);
  const [completedOrders, setCompletedOrders] = useState(0);

  // Top items
  const [topItems, setTopItems] = useState<TopItem[]>([]);

  // Daily breakdown
  const [dailyData, setDailyData] = useState<DaySummary[]>([]);

  const loadReport = useCallback(async () => {
    if (!outlet) return;
    setLoading(true);
    const supabase = createClient();

    // Calculate date range
    const now = new Date();
    let startDate: Date;
    if (period === "today") {
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    } else if (period === "7days") {
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    } else {
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    // Fetch orders in range
    const { data: orders } = await supabase
      .from("orders")
      .select("*")
      .eq("outlet_id", outlet.id)
      .gte("created_at", startDate.toISOString())
      .order("created_at", { ascending: true })
      .returns<Order[]>();

    if (!orders) {
      setLoading(false);
      return;
    }

    // Calculate stats
    const completed = orders.filter((o) => o.status === "completed");
    const validOrders = orders.filter((o) => o.status !== "cancelled");

    setTotalOrders(orders.length);
    setCompletedOrders(completed.length);

    const revenue = validOrders.reduce((sum, o) => sum + Number(o.total), 0);
    setTotalRevenue(revenue);
    setAvgOrderValue(validOrders.length > 0 ? revenue / validOrders.length : 0);

    // Daily breakdown
    const dailyMap = new Map<string, DaySummary>();
    for (const order of validOrders) {
      const date = new Date(order.created_at!).toLocaleDateString("en-MY", {
        month: "short",
        day: "numeric",
      });
      const existing = dailyMap.get(date) || { date, orders: 0, revenue: 0 };
      existing.orders++;
      existing.revenue += Number(order.total);
      dailyMap.set(date, existing);
    }
    setDailyData(Array.from(dailyMap.values()));

    // Top items - fetch order items for these orders
    if (validOrders.length > 0) {
      const orderIds = validOrders.map((o) => o.id);
      const { data: items } = await supabase
        .from("order_items")
        .select("item_name, quantity, subtotal")
        .in("order_id", orderIds);

      if (items) {
        const itemMap = new Map<string, TopItem>();
        for (const item of items) {
          const name = (item as { item_name: string }).item_name;
          const existing = itemMap.get(name) || { item_name: name, total_qty: 0, total_revenue: 0 };
          existing.total_qty += Number((item as { quantity: number }).quantity);
          existing.total_revenue += Number((item as { subtotal: number }).subtotal);
          itemMap.set(name, existing);
        }
        const sorted = Array.from(itemMap.values()).sort((a, b) => b.total_qty - a.total_qty);
        setTopItems(sorted.slice(0, 10));
      }
    } else {
      setTopItems([]);
    }

    setLoading(false);
  }, [outlet, period]);

  useEffect(() => {
    if (outlet) loadReport();
  }, [outlet, loadReport]);

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
          <h1 className="text-2xl font-bold tracking-tight">Reports</h1>
          <p className="text-sm text-muted-foreground">
            View sales reports and business analytics.
          </p>
        </div>
        <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
          {(["today", "7days", "30days"] as const).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                period === p ? "bg-white shadow text-gray-900" : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {p === "today" ? "Today" : p === "7days" ? "7 Days" : "30 Days"}
            </button>
          ))}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalOrders}</div>
            <p className="text-xs text-muted-foreground">
              {completedOrders} completed
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">RM {totalRevenue.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">Excluding cancelled</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Avg Order Value</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">RM {avgOrderValue.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">Per order</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {totalOrders > 0 ? Math.round((completedOrders / totalOrders) * 100) : 0}%
            </div>
            <p className="text-xs text-muted-foreground">Orders completed</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Daily Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            {dailyData.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">No data for this period</p>
            ) : (
              <div className="space-y-3">
                {dailyData.map((day) => {
                  const maxRevenue = Math.max(...dailyData.map((d) => d.revenue));
                  const pct = maxRevenue > 0 ? (day.revenue / maxRevenue) * 100 : 0;
                  return (
                    <div key={day.date}>
                      <div className="flex items-center justify-between text-sm mb-1">
                        <span className="font-medium text-gray-700">{day.date}</span>
                        <span className="text-gray-500">
                          {day.orders} orders · RM {day.revenue.toFixed(2)}
                        </span>
                      </div>
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-primary-600 to-primary-400 rounded-full transition-all"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Top Items */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Top Items</CardTitle>
          </CardHeader>
          <CardContent>
            {topItems.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">No data for this period</p>
            ) : (
              <div className="space-y-3">
                {topItems.map((item, i) => (
                  <div key={item.item_name} className="flex items-center gap-3">
                    <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                      i < 3 ? "bg-primary-100 text-primary-700" : "bg-gray-100 text-gray-500"
                    }`}>
                      {i + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{item.item_name}</p>
                      <p className="text-xs text-gray-400">
                        {item.total_qty} sold · RM {item.total_revenue.toFixed(2)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
