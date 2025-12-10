"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/hooks";
import { Card, Button } from "@/components/ui";
import { formatCurrency } from "@/lib/utils";
import {
  BarChart3,
  DollarSign,
  Package,
  Users,
  TrendingUp,
  ShoppingCart,
  AlertTriangle,
  RefreshCcw,
  ArrowUpRight,
  ArrowDownRight,
  Loader2,
  Settings,
  Box,
  Truck,
  CreditCard,
  Building2,
  ChevronRight,
  Calendar,
  Clock,
  Eye,
  MoreHorizontal,
  Activity,
  Zap,
  Target,
  PieChart,
} from "lucide-react";
import Link from "next/link";

interface DashboardStats {
  totalRevenue: number;
  revenueChange: number;
  totalOrders: number;
  ordersChange: number;
  totalCustomers: number;
  customersChange: number;
  activeSubscriptions: number;
  subscriptionsChange: number;
  pendingOrders: number;
  lowStockProducts: number;
  avgOrderValue: number;
  conversionRate: number;
}

interface RecentOrder {
  id: string;
  order_number: string;
  status: string;
  total: number;
  created_at: string;
  customer_name?: string;
}

// Simple SVG Bar Chart Component
function MiniBarChart({ data, color = "#10b981" }: { data: number[], color?: string }) {
  const max = Math.max(...data);
  const height = 40;
  const barWidth = 8;
  const gap = 4;

  return (
    <svg width={(barWidth + gap) * data.length} height={height} className="overflow-visible">
      {data.map((value, i) => (
        <rect
          key={i}
          x={i * (barWidth + gap)}
          y={height - (value / max) * height}
          width={barWidth}
          height={(value / max) * height}
          fill={color}
          rx={2}
          className="opacity-70 hover:opacity-100 transition-opacity"
        />
      ))}
    </svg>
  );
}

// Simple SVG Line Chart Component
function MiniLineChart({ data, color = "#10b981" }: { data: number[], color?: string }) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const height = 40;
  const width = 120;
  const padding = 2;
  const range = max - min || 1;

  const points = data.map((value, i) => ({
    x: padding + (i / (data.length - 1)) * (width - padding * 2),
    y: height - padding - ((value - min) / range) * (height - padding * 2),
  }));

  const pathD = points
    .map((point, i) => `${i === 0 ? "M" : "L"} ${point.x} ${point.y}`)
    .join(" ");

  const areaD = `${pathD} L ${points[points.length - 1].x} ${height} L ${points[0].x} ${height} Z`;

  return (
    <svg width={width} height={height} className="overflow-visible">
      <defs>
        <linearGradient id={`gradient-${color.replace("#", "")}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={areaD} fill={`url(#gradient-${color.replace("#", "")})`} />
      <path d={pathD} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      {points.map((point, i) => (
        <circle
          key={i}
          cx={point.x}
          cy={point.y}
          r={i === points.length - 1 ? 4 : 0}
          fill={color}
          className="transition-all"
        />
      ))}
    </svg>
  );
}

// Donut Chart Component
function DonutChart({ data, colors }: { data: { label: string, value: number }[], colors: string[] }) {
  const total = data.reduce((sum, d) => sum + d.value, 0);
  const size = 120;
  const strokeWidth = 16;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  let currentOffset = 0;

  return (
    <div className="relative">
      <svg width={size} height={size} className="-rotate-90">
        {data.map((d, i) => {
          const percentage = d.value / total;
          const strokeDasharray = `${percentage * circumference} ${circumference}`;
          const strokeDashoffset = -currentOffset * circumference;
          currentOffset += percentage;

          return (
            <circle
              key={i}
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke={colors[i]}
              strokeWidth={strokeWidth}
              strokeDasharray={strokeDasharray}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              className="transition-all duration-500"
            />
          );
        })}
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-center">
          <p className="text-2xl font-bold text-gray-900">{total}</p>
          <p className="text-xs text-gray-500">Total</p>
        </div>
      </div>
    </div>
  );
}

export default function AdminDashboardPage() {
  const router = useRouter();
  const { profile, isLoading: authLoading, isAuthenticated } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState("7d");

  const supabase = createClient();

  // Mock chart data (in production, this would come from your analytics)
  const revenueData = [4200, 5100, 4800, 6200, 5800, 7100, 6800, 8200, 7500, 9100, 8800, 10200];
  const ordersData = [12, 15, 14, 18, 16, 21, 19, 24, 22, 28, 26, 31];
  const customersData = [45, 52, 48, 61, 58, 72, 68, 85, 79, 95, 91, 108];

  const orderStatusData = [
    { label: "Delivered", value: 124 },
    { label: "Shipped", value: 45 },
    { label: "Processing", value: 23 },
    { label: "Pending", value: 12 },
  ];

  // Check admin access
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/auth/login?redirectTo=/admin");
      return;
    }

    if (!authLoading && profile?.role !== "admin") {
      router.push("/");
      return;
    }
  }, [authLoading, isAuthenticated, profile, router]);

  // Fetch dashboard data
  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!profile || profile.role !== "admin") return;

      setIsLoading(true);

      try {
        // Get order stats
        const { count: totalOrders } = await supabase
          .from("aura_orders")
          .select("*", { count: "exact", head: true });

        const { data: revenueDataDb } = await supabase
          .from("aura_orders")
          .select("total")
          .neq("status", "cancelled");

        const totalRevenue = revenueDataDb?.reduce((sum, o) => sum + o.total, 0) || 0;
        const avgOrderValue = totalOrders ? totalRevenue / totalOrders : 0;

        // Get customer count
        const { count: totalCustomers } = await supabase
          .from("profiles")
          .select("*", { count: "exact", head: true })
          .eq("role", "customer");

        // Get active subscriptions
        const { count: activeSubscriptions } = await supabase
          .from("aura_subscriptions")
          .select("*", { count: "exact", head: true })
          .eq("status", "active");

        // Get pending orders
        const { count: pendingOrders } = await supabase
          .from("aura_orders")
          .select("*", { count: "exact", head: true })
          .eq("status", "pending");

        // Get low stock products
        const { count: lowStockProducts } = await supabase
          .from("inventory")
          .select("*", { count: "exact", head: true })
          .lt("quantity", 100);

        // Get recent orders with customer info
        const { data: orders } = await supabase
          .from("aura_orders")
          .select("id, order_number, status, total, created_at")
          .order("created_at", { ascending: false })
          .limit(5);

        setStats({
          totalRevenue,
          revenueChange: 12.5,
          totalOrders: totalOrders || 0,
          ordersChange: 8.2,
          totalCustomers: totalCustomers || 0,
          customersChange: 15.3,
          activeSubscriptions: activeSubscriptions || 0,
          subscriptionsChange: 5.7,
          pendingOrders: pendingOrders || 0,
          lowStockProducts: lowStockProducts || 0,
          avgOrderValue,
          conversionRate: 3.2,
        });

        setRecentOrders(orders || []);
      } catch (error) {
        console.error("Failed to fetch dashboard data:", error);
      }

      setIsLoading(false);
    };

    if (profile?.role === "admin") {
      fetchDashboardData();
    }
  }, [profile, supabase]);

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="w-10 h-10 animate-spin text-aura-primary mx-auto mb-4" />
          <p className="text-gray-500">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (!stats) {
    return null;
  }

  const quickLinks = [
    { label: "Products", href: "/admin/products", icon: Box, color: "bg-violet-500" },
    { label: "Orders", href: "/admin/orders", icon: Package, color: "bg-blue-500" },
    { label: "Customers", href: "/admin/customers", icon: Users, color: "bg-emerald-500" },
    { label: "Inventory", href: "/admin/inventory", icon: Truck, color: "bg-amber-500" },
    { label: "Dealers", href: "/admin/dealers", icon: Building2, color: "bg-rose-500" },
    { label: "Settings", href: "/admin/settings", icon: Settings, color: "bg-gray-500" },
  ];

  const statCards = [
    {
      title: "Total Revenue",
      value: formatCurrency(stats.totalRevenue),
      change: stats.revenueChange,
      icon: DollarSign,
      color: "emerald",
      chart: revenueData,
    },
    {
      title: "Total Orders",
      value: stats.totalOrders.toString(),
      change: stats.ordersChange,
      icon: ShoppingCart,
      color: "blue",
      chart: ordersData,
    },
    {
      title: "Customers",
      value: stats.totalCustomers.toString(),
      change: stats.customersChange,
      icon: Users,
      color: "violet",
      chart: customersData,
    },
    {
      title: "Active Subscriptions",
      value: stats.activeSubscriptions.toString(),
      change: stats.subscriptionsChange,
      icon: RefreshCcw,
      color: "amber",
      chart: [8, 12, 10, 15, 13, 18, 16, 20, 19, 24, 22, 28],
    },
  ];

  const colorMap: Record<string, { bg: string, icon: string, chart: string }> = {
    emerald: { bg: "bg-emerald-100", icon: "text-emerald-600", chart: "#10b981" },
    blue: { bg: "bg-blue-100", icon: "text-blue-600", chart: "#3b82f6" },
    violet: { bg: "bg-violet-100", icon: "text-violet-600", chart: "#8b5cf6" },
    amber: { bg: "bg-amber-100", icon: "text-amber-600", chart: "#f59e0b" },
  };

  const statusColors = ["#10b981", "#3b82f6", "#f59e0b", "#ef4444"];

  return (
    <div className="min-h-screen bg-gray-50/50">
      {/* Admin Header */}
      <header className="bg-gradient-to-r from-aura-dark via-emerald-900 to-aura-dark text-white sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/" className="flex items-center gap-2">
                <div className="w-9 h-9 bg-gradient-to-br from-aura-primary to-emerald-400 rounded-xl flex items-center justify-center shadow-lg">
                  <span className="text-white font-bold">A</span>
                </div>
                <span className="text-xl font-bold">Aura</span>
              </Link>
              <span className="px-3 py-1 bg-white/10 backdrop-blur-sm text-aura-primary text-xs rounded-full font-medium border border-aura-primary/20">
                Admin Portal
              </span>
            </div>
            <div className="flex items-center gap-6">
              <nav className="hidden md:flex items-center gap-1">
                {["Dashboard", "Products", "Orders", "Customers"].map((item, i) => (
                  <Link
                    key={item}
                    href={i === 0 ? "/admin" : `/admin/${item.toLowerCase()}`}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      i === 0 ? "bg-white/10 text-white" : "text-gray-300 hover:text-white hover:bg-white/5"
                    }`}
                  >
                    {item}
                  </Link>
                ))}
              </nav>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gradient-to-br from-aura-primary to-emerald-400 rounded-full flex items-center justify-center text-white font-medium text-sm">
                  {profile?.full_name?.charAt(0) || "A"}
                </div>
                <div className="hidden sm:block">
                  <p className="text-sm font-medium">{profile?.full_name || "Admin"}</p>
                  <p className="text-xs text-gray-400">Administrator</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-gray-500 mt-1">
              Welcome back! Here&apos;s what&apos;s happening with your store.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center bg-white rounded-xl border border-gray-200 p-1">
              {["24h", "7d", "30d", "90d"].map((period) => (
                <button
                  key={period}
                  onClick={() => setSelectedPeriod(period)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    selectedPeriod === period
                      ? "bg-aura-primary text-white shadow-sm"
                      : "text-gray-600 hover:text-aura-primary"
                  }`}
                >
                  {period}
                </button>
              ))}
            </div>
            <Button variant="outline" size="sm">
              <Calendar className="w-4 h-4 mr-2" />
              Custom
            </Button>
          </div>
        </div>

        {/* Alerts */}
        {(stats.pendingOrders > 0 || stats.lowStockProducts > 0) && (
          <div className="mb-8 grid md:grid-cols-2 gap-4">
            {stats.pendingOrders > 0 && (
              <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-amber-50 to-amber-100/50 border border-amber-200 rounded-2xl">
                <div className="w-12 h-12 bg-amber-500 rounded-xl flex items-center justify-center">
                  <Clock className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-amber-800">{stats.pendingOrders} pending orders</p>
                  <p className="text-sm text-amber-600">Require processing</p>
                </div>
                <Link href="/admin/orders?status=pending">
                  <Button size="sm" className="bg-amber-500 hover:bg-amber-600">
                    View <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </Link>
              </div>
            )}
            {stats.lowStockProducts > 0 && (
              <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-red-50 to-red-100/50 border border-red-200 rounded-2xl">
                <div className="w-12 h-12 bg-red-500 rounded-xl flex items-center justify-center">
                  <AlertTriangle className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-red-800">{stats.lowStockProducts} low stock items</p>
                  <p className="text-sm text-red-600">Need restocking</p>
                </div>
                <Link href="/admin/inventory?filter=low-stock">
                  <Button size="sm" className="bg-red-500 hover:bg-red-600">
                    View <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </Link>
              </div>
            )}
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {statCards.map((stat) => {
            const colors = colorMap[stat.color];
            return (
              <div
                key={stat.title}
                className="bg-white rounded-2xl p-6 border border-gray-100 hover:shadow-lg hover:border-transparent transition-all duration-300"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className={`w-12 h-12 ${colors.bg} rounded-xl flex items-center justify-center`}>
                    <stat.icon className={`w-6 h-6 ${colors.icon}`} />
                  </div>
                  <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                    stat.change >= 0 ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                  }`}>
                    {stat.change >= 0 ? (
                      <ArrowUpRight className="w-3 h-3" />
                    ) : (
                      <ArrowDownRight className="w-3 h-3" />
                    )}
                    {Math.abs(stat.change)}%
                  </div>
                </div>
                <p className="text-sm text-gray-500 mb-1">{stat.title}</p>
                <p className="text-2xl font-bold text-gray-900 mb-4">{stat.value}</p>
                <MiniLineChart data={stat.chart} color={colors.chart} />
              </div>
            );
          })}
        </div>

        {/* Main Content Grid */}
        <div className="grid lg:grid-cols-3 gap-8 mb-8">
          {/* Revenue Chart */}
          <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-gray-100">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Revenue Overview</h2>
                <p className="text-sm text-gray-500">Monthly revenue performance</p>
              </div>
              <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <MoreHorizontal className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            {/* Simple Bar Chart */}
            <div className="h-64 flex items-end justify-between gap-2 px-4">
              {revenueData.map((value, i) => {
                const maxValue = Math.max(...revenueData);
                const height = (value / maxValue) * 100;
                const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
                return (
                  <div key={i} className="flex-1 flex flex-col items-center gap-2">
                    <div
                      className="w-full bg-gradient-to-t from-aura-primary to-emerald-400 rounded-t-lg transition-all duration-500 hover:from-aura-secondary hover:to-emerald-300"
                      style={{ height: `${height}%` }}
                    />
                    <span className="text-xs text-gray-400">{months[i]}</span>
                  </div>
                );
              })}
            </div>

            {/* Legend */}
            <div className="flex items-center justify-center gap-8 mt-6 pt-6 border-t border-gray-100">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-aura-primary rounded-full" />
                <span className="text-sm text-gray-600">Revenue</span>
              </div>
              <div className="text-sm text-gray-500">
                Total: <span className="font-semibold text-gray-900">{formatCurrency(revenueData.reduce((a, b) => a + b, 0))}</span>
              </div>
            </div>
          </div>

          {/* Order Status */}
          <div className="bg-white rounded-2xl p-6 border border-gray-100">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">Order Status</h2>
              <Link href="/admin/orders" className="text-sm text-aura-primary hover:underline">
                View all
              </Link>
            </div>

            <div className="flex justify-center mb-6">
              <DonutChart data={orderStatusData} colors={statusColors} />
            </div>

            <div className="space-y-3">
              {orderStatusData.map((status, i) => (
                <div key={status.label} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: statusColors[i] }}
                    />
                    <span className="text-sm text-gray-600">{status.label}</span>
                  </div>
                  <span className="text-sm font-semibold text-gray-900">{status.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Recent Orders */}
          <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-gray-100">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">Recent Orders</h2>
              <Link href="/admin/orders">
                <Button variant="ghost" size="sm">
                  View All <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </Link>
            </div>

            {recentOrders.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-100">
                      <th className="text-left py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                        Order
                      </th>
                      <th className="text-left py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="text-left py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="text-right py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                        Total
                      </th>
                      <th className="py-3"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentOrders.map((order) => (
                      <tr key={order.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50 transition-colors">
                        <td className="py-4">
                          <div className="font-medium text-gray-900">
                            #{order.order_number || order.id.slice(0, 8)}
                          </div>
                        </td>
                        <td className="py-4">
                          <div className="text-sm text-gray-500">
                            {new Date(order.created_at).toLocaleDateString()}
                          </div>
                        </td>
                        <td className="py-4">
                          <span
                            className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                              order.status === "delivered"
                                ? "bg-green-100 text-green-700"
                                : order.status === "shipped"
                                ? "bg-blue-100 text-blue-700"
                                : order.status === "processing"
                                ? "bg-amber-100 text-amber-700"
                                : "bg-gray-100 text-gray-700"
                            }`}
                          >
                            {order.status}
                          </span>
                        </td>
                        <td className="py-4 text-right">
                          <span className="font-semibold text-gray-900">
                            {formatCurrency(order.total)}
                          </span>
                        </td>
                        <td className="py-4 text-right">
                          <Link href={`/admin/orders/${order.id}`}>
                            <Button variant="ghost" size="sm">
                              <Eye className="w-4 h-4" />
                            </Button>
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-12">
                <Package className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">No orders yet</p>
              </div>
            )}
          </div>

          {/* Quick Actions & Links */}
          <div className="space-y-6">
            {/* Quick Links */}
            <div className="bg-white rounded-2xl p-6 border border-gray-100">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Quick Links</h2>
              <div className="grid grid-cols-2 gap-3">
                {quickLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="group flex flex-col items-center gap-2 p-4 rounded-xl hover:bg-gray-50 transition-all duration-200"
                  >
                    <div className={`w-10 h-10 ${link.color} rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform`}>
                      <link.icon className="w-5 h-5 text-white" />
                    </div>
                    <span className="text-sm font-medium text-gray-700">{link.label}</span>
                  </Link>
                ))}
              </div>
            </div>

            {/* Performance Metrics */}
            <div className="bg-white rounded-2xl p-6 border border-gray-100">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Key Metrics</h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                      <Target className="w-5 h-5 text-emerald-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Avg. Order Value</p>
                      <p className="font-semibold">{formatCurrency(stats.avgOrderValue)}</p>
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Activity className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Conversion Rate</p>
                      <p className="font-semibold">{stats.conversionRate}%</p>
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-violet-100 rounded-lg flex items-center justify-center">
                      <Zap className="w-5 h-5 text-violet-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Sub. Growth</p>
                      <p className="font-semibold">+{stats.subscriptionsChange}%</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
