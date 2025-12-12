"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/hooks";
import { AdminLayout } from "@/components/admin";
import { Card, Button } from "@/components/ui";
import { formatCurrency } from "@/lib/utils";
import {
  BarChart3,
  DollarSign,
  Package,
  Users,
  ShoppingCart,
  AlertTriangle,
  RefreshCcw,
  ArrowUpRight,
  Loader2,
  Settings,
  Box,
  Truck,
  CreditCard,
  Plus,
  Download,
  FileText,
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
}

interface RecentOrder {
  id: string;
  order_number: string | null;
  status: string;
  total: number;
  created_at: string;
}

export default function AdminDashboardPage() {
  const { profile, isLoading: authLoading } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const supabase = createClient();

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

        const { data: revenueData } = await supabase
          .from("aura_orders")
          .select("total")
          .neq("status", "cancelled" as const);

        const totalRevenue = (revenueData as { total: number }[] | null)?.reduce((sum, o) => sum + o.total, 0) || 0;

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

        // Get recent orders
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

  const quickLinks = [
    { label: "Products", href: "/admin/products", icon: Box },
    { label: "Orders", href: "/admin/orders", icon: Package },
    { label: "Customers", href: "/admin/customers", icon: Users },
    { label: "Subscriptions", href: "/admin/subscriptions", icon: RefreshCcw },
    { label: "Inventory", href: "/admin/inventory", icon: Truck },
    { label: "Dealers", href: "/admin/dealers", icon: BarChart3 },
    { label: "Settings", href: "/admin/settings", icon: Settings },
  ];

  // Show loading in AdminLayout (which handles auth)
  if (authLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-aura-primary" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-gray-500">Overview of your Aura platform performance</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" leftIcon={<Download className="w-4 h-4" />}>
              Export Report
            </Button>
            <Link href="/admin/products">
              <Button leftIcon={<Plus className="w-4 h-4" />}>Add Product</Button>
            </Link>
          </div>
        </div>

        {/* Alerts */}
        {stats && (stats.pendingOrders > 0 || stats.lowStockProducts > 0) && (
          <div className="space-y-3">
            {stats.pendingOrders > 0 && (
              <div className="flex items-center gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl">
                <AlertTriangle className="w-5 h-5 text-amber-500" />
                <span className="text-amber-800">
                  {stats.pendingOrders} orders pending processing
                </span>
                <Link
                  href="/admin/orders?status=pending"
                  className="ml-auto text-amber-600 hover:text-amber-700 text-sm font-medium"
                >
                  View Orders →
                </Link>
              </div>
            )}
            {stats.lowStockProducts > 0 && (
              <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-xl">
                <AlertTriangle className="w-5 h-5 text-red-500" />
                <span className="text-red-800">
                  {stats.lowStockProducts} products low on stock
                </span>
                <Link
                  href="/admin/inventory?filter=low-stock"
                  className="ml-auto text-red-600 hover:text-red-700 text-sm font-medium"
                >
                  View Inventory →
                </Link>
              </div>
            )}
          </div>
        )}

        {/* Stats Grid */}
        {isLoading ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <Card key={i} padding="md">
                <div className="animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-24 mb-2"></div>
                  <div className="h-8 bg-gray-200 rounded w-20"></div>
                </div>
              </Card>
            ))}
          </div>
        ) : stats ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Card padding="md">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-gray-500">Total Revenue</p>
                  <p className="text-2xl font-bold mt-1">
                    {formatCurrency(stats.totalRevenue)}
                  </p>
                </div>
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <DollarSign className="w-5 h-5 text-green-600" />
                </div>
              </div>
              <div className="flex items-center gap-1 mt-2 text-sm">
                <ArrowUpRight className="w-4 h-4 text-green-500" />
                <span className="text-green-600 font-medium">
                  +{stats.revenueChange}%
                </span>
                <span className="text-gray-500">vs last month</span>
              </div>
            </Card>

            <Card padding="md">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-gray-500">Total Orders</p>
                  <p className="text-2xl font-bold mt-1">{stats.totalOrders}</p>
                </div>
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <ShoppingCart className="w-5 h-5 text-blue-600" />
                </div>
              </div>
              <div className="flex items-center gap-1 mt-2 text-sm">
                <ArrowUpRight className="w-4 h-4 text-green-500" />
                <span className="text-green-600 font-medium">
                  +{stats.ordersChange}%
                </span>
                <span className="text-gray-500">vs last month</span>
              </div>
            </Card>

            <Card padding="md">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-gray-500">Customers</p>
                  <p className="text-2xl font-bold mt-1">{stats.totalCustomers}</p>
                </div>
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Users className="w-5 h-5 text-purple-600" />
                </div>
              </div>
              <div className="flex items-center gap-1 mt-2 text-sm">
                <ArrowUpRight className="w-4 h-4 text-green-500" />
                <span className="text-green-600 font-medium">
                  +{stats.customersChange}%
                </span>
                <span className="text-gray-500">vs last month</span>
              </div>
            </Card>

            <Card padding="md">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-gray-500">Active Subscriptions</p>
                  <p className="text-2xl font-bold mt-1">
                    {stats.activeSubscriptions}
                  </p>
                </div>
                <div className="w-10 h-10 bg-aura-primary/10 rounded-lg flex items-center justify-center">
                  <RefreshCcw className="w-5 h-5 text-aura-primary" />
                </div>
              </div>
              <div className="flex items-center gap-1 mt-2 text-sm">
                <ArrowUpRight className="w-4 h-4 text-green-500" />
                <span className="text-green-600 font-medium">
                  +{stats.subscriptionsChange}%
                </span>
                <span className="text-gray-500">vs last month</span>
              </div>
            </Card>
          </div>
        ) : null}

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Recent Orders */}
          <div className="lg:col-span-2">
            <Card padding="lg">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold">Recent Orders</h2>
                <Link href="/admin/orders">
                  <Button variant="ghost" size="sm">
                    View All
                  </Button>
                </Link>
              </div>

              {isLoading ? (
                <div className="space-y-3">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="animate-pulse flex items-center justify-between py-3">
                      <div className="h-4 bg-gray-200 rounded w-24"></div>
                      <div className="h-4 bg-gray-200 rounded w-16"></div>
                    </div>
                  ))}
                </div>
              ) : recentOrders.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 text-sm font-medium text-gray-500">
                          Order
                        </th>
                        <th className="text-left py-3 text-sm font-medium text-gray-500">
                          Status
                        </th>
                        <th className="text-right py-3 text-sm font-medium text-gray-500">
                          Total
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentOrders.map((order) => (
                        <tr key={order.id} className="border-b last:border-0">
                          <td className="py-3">
                            <Link
                              href={`/admin/orders/${order.id}`}
                              className="font-medium text-aura-primary hover:underline"
                            >
                              #{order.order_number || order.id.slice(0, 8)}
                            </Link>
                          </td>
                          <td className="py-3">
                            <span
                              className={`px-2 py-1 rounded-full text-xs font-medium ${
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
                          <td className="py-3 text-right font-medium">
                            {formatCurrency(order.total)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  No orders yet
                </div>
              )}
            </Card>
          </div>

          {/* Quick Links */}
          <div className="space-y-6">
            <Card padding="lg">
              <h2 className="text-lg font-semibold mb-4">Quick Links</h2>
              <div className="grid grid-cols-2 gap-2">
                {quickLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="flex items-center gap-2 p-3 rounded-xl hover:bg-gray-50 transition-colors"
                  >
                    <link.icon className="w-5 h-5 text-gray-400" />
                    <span className="text-sm font-medium">{link.label}</span>
                  </Link>
                ))}
              </div>
            </Card>

            {/* Quick Actions */}
            <Card padding="lg">
              <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
              <div className="space-y-2">
                <Link href="/admin/products" className="block">
                  <Button className="w-full" variant="primary" leftIcon={<Plus className="w-4 h-4" />}>
                    Add New Product
                  </Button>
                </Link>
                <Button className="w-full" variant="secondary" leftIcon={<Download className="w-4 h-4" />}>
                  Export Orders
                </Button>
                <Button className="w-full" variant="outline" leftIcon={<FileText className="w-4 h-4" />}>
                  View Reports
                </Button>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
