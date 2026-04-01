"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/hooks";
import { useLocale } from "@/hooks/useLocale";
import { Card, Button } from "@/components/ui";
import {
  DollarSign,
  Package,
  Users,
  TrendingUp,
  ShoppingCart,
  AlertTriangle,
  RefreshCcw,
  ArrowUpRight,
  Loader2,
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
  const { t, formatPrice } = useLocale();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const supabase = createClient();

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (authLoading) return;
      if (!profile) return;

      try {
        const { count: totalOrders } = await supabase
          .from("aura_orders")
          .select("*", { count: "exact", head: true });

        const { data: revenueData } = await supabase
          .from("aura_orders")
          .select("total")
          .neq("status", "cancelled" as const);

        const totalRevenue =
          (revenueData as { total: number }[] | null)?.reduce(
            (sum, o) => sum + o.total,
            0
          ) || 0;

        const { count: totalCustomers } = await supabase
          .from("profiles")
          .select("*", { count: "exact", head: true })
          .eq("role", "customer");

        const { count: activeSubscriptions } = await supabase
          .from("aura_subscriptions")
          .select("*", { count: "exact", head: true })
          .eq("status", "active");

        const { count: pendingOrders } = await supabase
          .from("aura_orders")
          .select("*", { count: "exact", head: true })
          .eq("status", "pending");

        const { count: lowStockProducts } = await supabase
          .from("inventory")
          .select("*", { count: "exact", head: true })
          .lt("quantity", 100);

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

    fetchDashboardData();
  }, [profile, authLoading, supabase]);

  if (authLoading || isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-aura-primary" />
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="text-center py-20 text-gray-500">
        <p>{t("admin.unableToLoad")}</p>
      </div>
    );
  }

  return (
    <>
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">{t("admin.dashboard")}</h1>
        <p className="text-gray-600">
          {t("admin.dashboardSubtitle")}
        </p>
      </div>

      {/* Alerts */}
      {(stats.pendingOrders > 0 || stats.lowStockProducts > 0) && (
        <div className="mb-8 space-y-3">
          {stats.pendingOrders > 0 && (
            <div className="flex items-center gap-3 p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
              <span className="text-amber-800">
                {t("admin.pendingProcessing", { count: String(stats.pendingOrders) })}
              </span>
              <Link
                href="/admin/orders?status=pending"
                className="ml-auto text-amber-600 hover:text-amber-700 text-sm font-medium"
              >
                {t("admin.viewOrders")}
              </Link>
            </div>
          )}
          {stats.lowStockProducts > 0 && (
            <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-red-500" />
              <span className="text-red-800">
                {t("admin.lowStock", { count: String(stats.lowStockProducts) })}
              </span>
              <Link
                href="/admin/inventory?filter=low-stock"
                className="ml-auto text-red-600 hover:text-red-700 text-sm font-medium"
              >
                {t("admin.viewInventory")}
              </Link>
            </div>
          )}
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card padding="md">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-gray-500">{t("admin.totalRevenue")}</p>
              <p className="text-2xl font-bold mt-1">
                {formatPrice(stats.totalRevenue)}
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
            <span className="text-gray-500">{t("admin.vsLastMonth")}</span>
          </div>
        </Card>

        <Card padding="md">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-gray-500">{t("admin.totalOrders")}</p>
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
            <span className="text-gray-500">{t("admin.vsLastMonth")}</span>
          </div>
        </Card>

        <Card padding="md">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-gray-500">{t("admin.customers")}</p>
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
            <span className="text-gray-500">{t("admin.vsLastMonth")}</span>
          </div>
        </Card>

        <Card padding="md">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-gray-500">{t("admin.activeSubscriptions")}</p>
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
            <span className="text-gray-500">{t("admin.vsLastMonth")}</span>
          </div>
        </Card>
      </div>

      {/* Recent Orders */}
      <Card padding="lg">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold">{t("admin.recentOrders")}</h2>
          <Link href="/admin/orders">
            <Button variant="ghost" size="sm">
              {t("common.viewAll")}
            </Button>
          </Link>
        </div>

        {recentOrders.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 text-sm font-medium text-gray-500">
                    {t("admin.order")}
                  </th>
                  <th className="text-left py-3 text-sm font-medium text-gray-500">
                    {t("admin.status")}
                  </th>
                  <th className="text-right py-3 text-sm font-medium text-gray-500">
                    {t("admin.total")}
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
                        {order.order_number || order.id.slice(0, 8)}
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
                      {formatPrice(order.total)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">{t("admin.noOrdersYet")}</div>
        )}
      </Card>
    </>
  );
}
