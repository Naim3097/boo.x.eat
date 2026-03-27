"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { useStore } from "@/hooks/use-store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  DollarSign,
  ShoppingCart,
  TrendingUp,
  Loader2,
  Calendar,
  Download,
  BarChart3,
  PieChart as PieIcon,
  Clock,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from "recharts";
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

interface HourlyData {
  hour: string;
  orders: number;
  revenue: number;
}

interface PaymentData {
  method: string;
  count: number;
  amount: number;
}

interface CategoryData {
  category: string;
  revenue: number;
  qty: number;
}

const CHART_COLORS = [
  "#7c3aed", "#06b6d4", "#f59e0b", "#10b981", "#ef4444",
  "#8b5cf6", "#14b8a6", "#f97316", "#22c55e", "#ec4899",
];

function downloadCSV(filename: string, headers: string[], rows: string[][]) {
  const csvContent = [
    headers.join(","),
    ...rows.map((row) =>
      row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")
    ),
  ].join("\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

type ReportTab = "overview" | "trends" | "items" | "payments";

export default function ReportsPage() {
  const { outlet, outlets, tierLimits, loading: storeLoading } = useStore();
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<"today" | "7days" | "30days">("today");
  const [activeTab, setActiveTab] = useState<ReportTab>("overview");

  const [totalOrders, setTotalOrders] = useState(0);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [avgOrderValue, setAvgOrderValue] = useState(0);
  const [completedOrders, setCompletedOrders] = useState(0);
  const [topItems, setTopItems] = useState<TopItem[]>([]);
  const [dailyData, setDailyData] = useState<DaySummary[]>([]);
  const [hourlyData, setHourlyData] = useState<HourlyData[]>([]);
  const [paymentData, setPaymentData] = useState<PaymentData[]>([]);
  const [categoryData, setCategoryData] = useState<CategoryData[]>([]);

  const isConsolidated = !outlet && outlets.length > 1;

  const loadReport = useCallback(async () => {
    if (!outlet && outlets.length === 0) return;
    setLoading(true);
    const supabase = createClient();

    const now = new Date();
    let startDate: Date;
    if (period === "today") {
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    } else if (period === "7days") {
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    } else {
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    // Build query - support consolidated view
    let query = supabase
      .from("orders")
      .select("*")
      .gte("created_at", startDate.toISOString())
      .order("created_at", { ascending: true });

    if (outlet) {
      query = query.eq("outlet_id", outlet.id);
    } else {
      const outletIds = outlets.map((o) => o.id);
      if (outletIds.length > 0) {
        query = query.in("outlet_id", outletIds);
      }
    }

    const { data: orders } = await query.returns<Order[]>();

    if (!orders) {
      setLoading(false);
      return;
    }

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

    // Hourly distribution
    const hourlyMap = new Map<number, HourlyData>();
    for (let h = 0; h < 24; h++) {
      const label = `${h.toString().padStart(2, "0")}:00`;
      hourlyMap.set(h, { hour: label, orders: 0, revenue: 0 });
    }
    for (const order of validOrders) {
      const h = new Date(order.created_at!).getHours();
      const existing = hourlyMap.get(h)!;
      existing.orders++;
      existing.revenue += Number(order.total);
    }
    // Filter to only hours with data or business hours (8-23)
    const hourlyArr = Array.from(hourlyMap.values()).filter(
      (h) => h.orders > 0 || (parseInt(h.hour) >= 8 && parseInt(h.hour) <= 23)
    );
    setHourlyData(hourlyArr);

    // Payment method breakdown
    const pmMap = new Map<string, PaymentData>();
    for (const order of validOrders) {
      const method = order.payment_method || "unknown";
      const label = method === "e_wallet" ? "E-Wallet" : method.charAt(0).toUpperCase() + method.slice(1);
      const existing = pmMap.get(label) || { method: label, count: 0, amount: 0 };
      existing.count++;
      existing.amount += Number(order.total);
      pmMap.set(label, existing);
    }
    setPaymentData(Array.from(pmMap.values()).sort((a, b) => b.amount - a.amount));

    // Fetch order items for top items + category breakdown
    if (validOrders.length > 0) {
      const orderIds = validOrders.map((o) => o.id);
      const { data: items } = await supabase
        .from("order_items")
        .select("item_name, quantity, subtotal, menu_item_id")
        .in("order_id", orderIds);

      // Fetch menu items for category mapping
      const { data: menuItems } = await supabase
        .from("menu_items")
        .select("id, category_id");
      const { data: cats } = await supabase
        .from("categories")
        .select("id, name_en");

      const catNameMap = new Map((cats || []).map((c: { id: string; name_en: string }) => [c.id, c.name_en]));
      const menuCatMap = new Map(
        (menuItems || []).map((m: { id: string; category_id: string | null }) => [
          m.id,
          m.category_id ? catNameMap.get(m.category_id) || "Uncategorized" : "Uncategorized",
        ])
      );

      if (items) {
        // Top items
        const itemMap = new Map<string, TopItem>();
        const catDataMap = new Map<string, CategoryData>();

        for (const item of items as { item_name: string; quantity: number; subtotal: number; menu_item_id: string | null }[]) {
          const name = item.item_name;
          const qty = Number(item.quantity);
          const sub = Number(item.subtotal);
          const cat = item.menu_item_id ? menuCatMap.get(item.menu_item_id) || "Uncategorized" : "Uncategorized";

          const existing = itemMap.get(name) || { item_name: name, total_qty: 0, total_revenue: 0 };
          existing.total_qty += qty;
          existing.total_revenue += sub;
          itemMap.set(name, existing);

          const catExisting = catDataMap.get(cat) || { category: cat, revenue: 0, qty: 0 };
          catExisting.revenue += sub;
          catExisting.qty += qty;
          catDataMap.set(cat, catExisting);
        }

        const sorted = Array.from(itemMap.values()).sort((a, b) => b.total_qty - a.total_qty);
        setTopItems(sorted.slice(0, 10));
        setCategoryData(Array.from(catDataMap.values()).sort((a, b) => b.revenue - a.revenue));
      }
    } else {
      setTopItems([]);
      setCategoryData([]);
    }

    setLoading(false);
  }, [outlet, outlets, period]);

  useEffect(() => {
    if (outlet || outlets.length > 0) loadReport();
  }, [outlet, outlets, loadReport]);

  // CSV exports
  function exportDailySummary() {
    const headers = ["Date", "Orders", "Revenue (RM)"];
    const rows = dailyData.map((d) => [d.date, String(d.orders), d.revenue.toFixed(2)]);
    downloadCSV(`daily-summary-${period}.csv`, headers, rows);
  }

  function exportSalesByItem() {
    const headers = ["Item Name", "Quantity Sold", "Revenue (RM)"];
    const rows = topItems.map((i) => [i.item_name, String(i.total_qty), i.total_revenue.toFixed(2)]);
    downloadCSV(`sales-by-item-${period}.csv`, headers, rows);
  }

  function exportHourlyData() {
    const headers = ["Hour", "Orders", "Revenue (RM)"];
    const rows = hourlyData.map((h) => [h.hour, String(h.orders), h.revenue.toFixed(2)]);
    downloadCSV(`hourly-distribution-${period}.csv`, headers, rows);
  }

  function exportPaymentData() {
    const headers = ["Payment Method", "Transactions", "Amount (RM)"];
    const rows = paymentData.map((p) => [p.method, String(p.count), p.amount.toFixed(2)]);
    downloadCSV(`payment-methods-${period}.csv`, headers, rows);
  }

  if (storeLoading || loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 animate-spin text-primary-600" />
      </div>
    );
  }

  const tabs: { key: ReportTab; label: string; icon: React.ReactNode }[] = [
    { key: "overview", label: "Overview", icon: <BarChart3 className="w-4 h-4" /> },
    { key: "trends", label: "Trends", icon: <TrendingUp className="w-4 h-4" /> },
    { key: "items", label: "Items", icon: <ShoppingCart className="w-4 h-4" /> },
    { key: "payments", label: "Payments", icon: <PieIcon className="w-4 h-4" /> },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Reports</h1>
          <p className="text-sm text-muted-foreground">
            {isConsolidated
              ? "Consolidated analytics across all outlets."
              : "View sales reports and business analytics."}
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
            <p className="text-xs text-muted-foreground">{completedOrders} completed</p>
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

      {/* Report Tabs */}
      {tierLimits.hasAdvancedReports && (
        <div className="flex gap-1 bg-gray-100 rounded-lg p-1 w-fit">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                activeTab === tab.key
                  ? "bg-white shadow text-gray-900"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>
      )}

      {/* Overview Tab */}
      {activeTab === "overview" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Daily Breakdown */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">Daily Breakdown</CardTitle>
              {dailyData.length > 0 && (
                <Button variant="outline" size="sm" onClick={exportDailySummary}>
                  <Download className="w-3.5 h-3.5 mr-1" />
                  CSV
                </Button>
              )}
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
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">Top Items</CardTitle>
              {topItems.length > 0 && (
                <Button variant="outline" size="sm" onClick={exportSalesByItem}>
                  <Download className="w-3.5 h-3.5 mr-1" />
                  CSV
                </Button>
              )}
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
      )}

      {/* Trends Tab */}
      {activeTab === "trends" && tierLimits.hasAdvancedReports && (
        <div className="space-y-6">
          {/* Revenue Trend Chart */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">Revenue Trend</CardTitle>
              {dailyData.length > 0 && (
                <Button variant="outline" size="sm" onClick={exportDailySummary}>
                  <Download className="w-3.5 h-3.5 mr-1" />
                  CSV
                </Button>
              )}
            </CardHeader>
            <CardContent>
              {dailyData.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">No data for this period</p>
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={dailyData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `RM${v}`} />
                    <Tooltip
                      // eslint-disable-next-line @typescript-eslint/no-explicit-any
                      formatter={(value: any) => [`RM ${Number(value).toFixed(2)}`, "Revenue"]}
                      labelStyle={{ fontWeight: "bold" }}
                    />
                    <Line
                      type="monotone"
                      dataKey="revenue"
                      stroke="#7c3aed"
                      strokeWidth={2}
                      dot={{ fill: "#7c3aed", r: 4 }}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          {/* Hourly Distribution */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-muted-foreground" />
                <CardTitle className="text-base">Hourly Distribution</CardTitle>
              </div>
              {hourlyData.length > 0 && (
                <Button variant="outline" size="sm" onClick={exportHourlyData}>
                  <Download className="w-3.5 h-3.5 mr-1" />
                  CSV
                </Button>
              )}
            </CardHeader>
            <CardContent>
              {hourlyData.every((h) => h.orders === 0) ? (
                <p className="text-sm text-muted-foreground text-center py-8">No data for this period</p>
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={hourlyData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="hour" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip
                      // eslint-disable-next-line @typescript-eslint/no-explicit-any
                      formatter={(value: any, name: any) => [
                        name === "revenue" ? `RM ${value.toFixed(2)}` : value,
                        name === "revenue" ? "Revenue" : "Orders",
                      ]}
                    />
                    <Bar dataKey="orders" fill="#7c3aed" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          {/* Orders per Day Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Orders per Day</CardTitle>
            </CardHeader>
            <CardContent>
              {dailyData.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">No data for this period</p>
              ) : (
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={dailyData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
                    <Tooltip />
                    <Bar dataKey="orders" fill="#06b6d4" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Items Tab */}
      {activeTab === "items" && tierLimits.hasAdvancedReports && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top Items Bar Chart */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">Top Items by Quantity</CardTitle>
              {topItems.length > 0 && (
                <Button variant="outline" size="sm" onClick={exportSalesByItem}>
                  <Download className="w-3.5 h-3.5 mr-1" />
                  CSV
                </Button>
              )}
            </CardHeader>
            <CardContent>
              {topItems.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">No data for this period</p>
              ) : (
                <ResponsiveContainer width="100%" height={350}>
                  <BarChart data={topItems.slice(0, 8)} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis type="number" tick={{ fontSize: 12 }} allowDecimals={false} />
                    <YAxis
                      dataKey="item_name"
                      type="category"
                      tick={{ fontSize: 11 }}
                      width={120}
                    />
                    <Tooltip
                      // eslint-disable-next-line @typescript-eslint/no-explicit-any
                      formatter={(value: any) => [value, "Qty Sold"]}
                    />
                    <Bar dataKey="total_qty" fill="#7c3aed" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          {/* Category Breakdown Pie Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Revenue by Category</CardTitle>
            </CardHeader>
            <CardContent>
              {categoryData.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">No data for this period</p>
              ) : (
                <div>
                  <ResponsiveContainer width="100%" height={280}>
                    <PieChart>
                      <Pie
                        data={categoryData}
                        dataKey="revenue"
                        nameKey="category"
                        cx="50%"
                        cy="50%"
                        outerRadius={100}
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        label={({ name, percent }: any) =>
                          `${name} (${((percent || 0) * 100).toFixed(0)}%)`
                        }
                        labelLine={{ strokeWidth: 1 }}
                      >
                        {categoryData.map((_, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={CHART_COLORS[index % CHART_COLORS.length]}
                          />
                        ))}
                      </Pie>
                      <Tooltip
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                      formatter={(value: any) => [`RM ${Number(value).toFixed(2)}`, "Revenue"]}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="flex flex-wrap gap-2 mt-2 justify-center">
                    {categoryData.map((cat, i) => (
                      <div key={cat.category} className="flex items-center gap-1.5 text-xs">
                        <div
                          className="w-2.5 h-2.5 rounded-full"
                          style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }}
                        />
                        <span className="text-gray-600">{cat.category}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Full Items Table */}
          <Card className="lg:col-span-2">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">All Items</CardTitle>
              {topItems.length > 0 && (
                <Button variant="outline" size="sm" onClick={exportSalesByItem}>
                  <Download className="w-3.5 h-3.5 mr-1" />
                  CSV
                </Button>
              )}
            </CardHeader>
            <CardContent>
              {topItems.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">No data for this period</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b text-left">
                        <th className="pb-2 font-medium text-gray-500">#</th>
                        <th className="pb-2 font-medium text-gray-500">Item</th>
                        <th className="pb-2 font-medium text-gray-500 text-right">Qty Sold</th>
                        <th className="pb-2 font-medium text-gray-500 text-right">Revenue</th>
                        <th className="pb-2 font-medium text-gray-500 text-right">Avg Price</th>
                      </tr>
                    </thead>
                    <tbody>
                      {topItems.map((item, i) => (
                        <tr key={item.item_name} className="border-b last:border-0">
                          <td className="py-2 text-gray-400">{i + 1}</td>
                          <td className="py-2 font-medium">{item.item_name}</td>
                          <td className="py-2 text-right">{item.total_qty}</td>
                          <td className="py-2 text-right">RM {item.total_revenue.toFixed(2)}</td>
                          <td className="py-2 text-right text-gray-500">
                            RM {item.total_qty > 0 ? (item.total_revenue / item.total_qty).toFixed(2) : "0.00"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Payments Tab */}
      {activeTab === "payments" && tierLimits.hasAdvancedReports && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Payment Method Pie Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Payment Methods</CardTitle>
            </CardHeader>
            <CardContent>
              {paymentData.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">No data for this period</p>
              ) : (
                <div>
                  <ResponsiveContainer width="100%" height={280}>
                    <PieChart>
                      <Pie
                        data={paymentData}
                        dataKey="amount"
                        nameKey="method"
                        cx="50%"
                        cy="50%"
                        outerRadius={100}
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        label={({ name, percent }: any) =>
                          `${name} (${((percent || 0) * 100).toFixed(0)}%)`
                        }
                        labelLine={{ strokeWidth: 1 }}
                      >
                        {paymentData.map((_, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={CHART_COLORS[index % CHART_COLORS.length]}
                          />
                        ))}
                      </Pie>
                      <Tooltip
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        formatter={(value: any) => [`RM ${Number(value).toFixed(2)}`, "Amount"]}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="flex flex-wrap gap-3 mt-2 justify-center">
                    {paymentData.map((pm, i) => (
                      <div key={pm.method} className="flex items-center gap-1.5 text-xs">
                        <div
                          className="w-2.5 h-2.5 rounded-full"
                          style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }}
                        />
                        <span className="text-gray-600">{pm.method}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Payment Reconciliation Table */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">Payment Reconciliation</CardTitle>
              {paymentData.length > 0 && (
                <Button variant="outline" size="sm" onClick={exportPaymentData}>
                  <Download className="w-3.5 h-3.5 mr-1" />
                  CSV
                </Button>
              )}
            </CardHeader>
            <CardContent>
              {paymentData.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">No data for this period</p>
              ) : (
                <div>
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b text-left">
                        <th className="pb-2 font-medium text-gray-500">Method</th>
                        <th className="pb-2 font-medium text-gray-500 text-right">Transactions</th>
                        <th className="pb-2 font-medium text-gray-500 text-right">Amount</th>
                        <th className="pb-2 font-medium text-gray-500 text-right">% of Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paymentData.map((pm) => (
                        <tr key={pm.method} className="border-b last:border-0">
                          <td className="py-2.5 font-medium">{pm.method}</td>
                          <td className="py-2.5 text-right">{pm.count}</td>
                          <td className="py-2.5 text-right">RM {pm.amount.toFixed(2)}</td>
                          <td className="py-2.5 text-right text-gray-500">
                            {totalRevenue > 0 ? ((pm.amount / totalRevenue) * 100).toFixed(1) : 0}%
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="border-t-2 font-bold">
                        <td className="pt-2.5">Total</td>
                        <td className="pt-2.5 text-right">
                          {paymentData.reduce((s, p) => s + p.count, 0)}
                        </td>
                        <td className="pt-2.5 text-right">RM {totalRevenue.toFixed(2)}</td>
                        <td className="pt-2.5 text-right">100%</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
