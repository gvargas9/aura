"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useAuth, useRealtimeOrders, useLocale } from "@/hooks";
import {
  Card,
  Button,
  Header,
  Footer,
} from "@/components/ui";
import { cn, formatCurrency, formatDate } from "@/lib/utils";
import { BOX_CONFIGS } from "@/types";
import type { Order, Subscription } from "@/types";
import {
  Loader2,
  Package,
  RefreshCcw,
  CreditCard,
  Box,
  ShoppingCart,
  Settings,
  ArrowRight,
  Calendar,
  ChevronRight,
  Wifi,
  Heart,
} from "lucide-react";

interface DashboardData {
  totalOrders: number;
  activeSubscriptions: number;
  credits: number;
  subscriptions: Subscription[];
  recentOrders: Order[];
}

const STATUS_BADGES: Record<string, string> = {
  delivered: "bg-green-100 text-green-700",
  active: "bg-green-100 text-green-700",
  shipped: "bg-blue-100 text-blue-700",
  processing: "bg-amber-100 text-amber-700",
  paused: "bg-amber-100 text-amber-700",
  pending: "bg-gray-100 text-gray-700",
  cancelled: "bg-red-100 text-red-700",
};

export default function DashboardPage() {
  const router = useRouter();
  const { profile, isLoading: authLoading, isAuthenticated } = useAuth();
  const { t } = useLocale();
  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const supabase = createClient();

  // Realtime order updates
  const {
    orders: realtimeOrders,
    isConnected: ordersConnected,
    lastUpdate: ordersLastUpdate,
  } = useRealtimeOrders(profile?.id || "");

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/auth/login?redirectTo=/dashboard");
    }
  }, [authLoading, isAuthenticated, router]);

  useEffect(() => {
    const fetchData = async () => {
      if (!profile) return;

      setIsLoading(true);

      try {
        const [ordersCountRes, subscriptionsRes, recentOrdersRes] =
          await Promise.all([
            supabase
              .from("aura_orders")
              .select("*", { count: "exact", head: true })
              .eq("user_id", profile.id),
            supabase
              .from("aura_subscriptions")
              .select("*")
              .eq("user_id", profile.id)
              .neq("status", "cancelled"),
            supabase
              .from("aura_orders")
              .select("*")
              .eq("user_id", profile.id)
              .order("created_at", { ascending: false })
              .limit(5),
          ]);

        const activeSubCount = (subscriptionsRes.data || []).filter(
          (s) => s.status === "active"
        ).length;

        setData({
          totalOrders: ordersCountRes.count || 0,
          activeSubscriptions: activeSubCount,
          credits: profile.credits || 0,
          subscriptions: (subscriptionsRes.data as Subscription[]) || [],
          recentOrders: (recentOrdersRes.data as Order[]) || [],
        });
      } catch (error) {
        console.error("Failed to fetch dashboard data:", error);
      }

      setIsLoading(false);
    };

    if (profile) {
      fetchData();
    }
  }, [profile, supabase]);

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <div className="flex-1 flex items-center justify-center bg-gray-50">
          <Loader2 className="w-8 h-8 animate-spin text-aura-primary" />
        </div>
        <Footer />
      </div>
    );
  }

  if (!profile || !data) {
    return null;
  }

  const firstName = profile.full_name?.split(" ")[0] || "there";

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Welcome Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">
              {t("dashboard.welcome", { name: firstName })}
            </h1>
            <p className="text-gray-600 mt-1">
              {t("dashboard.overview")}
            </p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
            <Card padding="md">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-gray-500">{t("dashboard.totalOrders")}</p>
                  <p className="text-2xl font-bold mt-1">{data.totalOrders}</p>
                </div>
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <ShoppingCart className="w-5 h-5 text-blue-600" />
                </div>
              </div>
            </Card>

            <Card padding="md">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-gray-500">{t("dashboard.activeSubscriptions")}</p>
                  <p className="text-2xl font-bold mt-1">
                    {data.activeSubscriptions}
                  </p>
                </div>
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <RefreshCcw className="w-5 h-5 text-green-600" />
                </div>
              </div>
            </Card>

            <Card padding="md">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-gray-500">{t("dashboard.creditsBalance")}</p>
                  <p className="text-2xl font-bold mt-1">
                    {formatCurrency(data.credits)}
                  </p>
                </div>
                <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                  <CreditCard className="w-5 h-5 text-amber-600" />
                </div>
              </div>
            </Card>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Left Column: Subscriptions + Recent Orders */}
            <div className="lg:col-span-2 space-y-8">
              {/* Active Subscriptions */}
              <Card padding="lg">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold text-gray-900">
                    {t("dashboard.activeSubscriptions")}
                  </h2>
                  <Link href="/dashboard/subscriptions">
                    <Button variant="ghost" size="sm">
                      {t("subscriptions.manage")}
                      <ChevronRight className="w-4 h-4 ml-1" />
                    </Button>
                  </Link>
                </div>

                {data.subscriptions.length > 0 ? (
                  <div className="space-y-4">
                    {data.subscriptions.map((sub) => {
                      const boxConfig = BOX_CONFIGS[sub.box_size];
                      return (
                        <div
                          key={sub.id}
                          className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-gray-50 rounded-lg gap-4"
                        >
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-aura-primary/10 rounded-lg flex items-center justify-center">
                              <Box className="w-6 h-6 text-aura-primary" />
                            </div>
                            <div>
                              <p className="font-semibold text-gray-900 capitalize">
                                {sub.box_size} Box
                              </p>
                              <p className="text-sm text-gray-500">
                                {boxConfig?.slots || 0} items &middot;{" "}
                                {formatCurrency(sub.price)}/mo
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-4 sm:gap-6">
                            <div className="text-sm">
                              <span
                                className={`px-2 py-1 rounded-full text-xs font-medium ${
                                  STATUS_BADGES[sub.status] ||
                                  "bg-gray-100 text-gray-700"
                                }`}
                              >
                                {sub.status}
                              </span>
                            </div>
                            {sub.next_delivery_date && (
                              <div className="flex items-center gap-1.5 text-sm text-gray-500">
                                <Calendar className="w-4 h-4" />
                                <span>
                                  {formatDate(sub.next_delivery_date)}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Box className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500 mb-4">
                      {t("dashboard.noSubscriptions")}
                    </p>
                    <Link href="/build-box">
                      <Button variant="primary" size="sm">
                        {t("dashboard.buildFirstBox")}
                      </Button>
                    </Link>
                  </div>
                )}
              </Card>

              {/* Recent Orders - Realtime */}
              <Card padding="lg">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl font-semibold text-gray-900">
                      {t("dashboard.recentOrders")}
                    </h2>
                    {ordersConnected && (
                      <span className="flex items-center gap-1 text-[10px] text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
                        <Wifi className="w-3 h-3" />
                        {t("dashboard.live")}
                      </span>
                    )}
                  </div>
                  <Link href="/orders">
                    <Button variant="ghost" size="sm">
                      {t("dashboard.viewAll")}
                      <ChevronRight className="w-4 h-4 ml-1" />
                    </Button>
                  </Link>
                </div>

                {(() => {
                  const displayOrders = realtimeOrders.length > 0 ? realtimeOrders.slice(0, 5) : data.recentOrders;
                  return displayOrders.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-3 text-sm font-medium text-gray-500">
                            {t("common.order")}
                          </th>
                          <th className="text-left py-3 text-sm font-medium text-gray-500">
                            {t("common.status")}
                          </th>
                          <th className="text-left py-3 text-sm font-medium text-gray-500 hidden sm:table-cell">
                            {t("common.date")}
                          </th>
                          <th className="text-right py-3 text-sm font-medium text-gray-500">
                            {t("common.total")}
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {displayOrders.map((order) => {
                          const isRecentlyUpdated = ordersLastUpdate &&
                            new Date(order.updated_at || order.created_at).getTime() > (ordersLastUpdate.getTime() - 5000);
                          return (
                          <tr
                            key={order.id}
                            className={cn(
                              "border-b last:border-0 transition-colors duration-1000",
                              isRecentlyUpdated && "bg-aura-light/50"
                            )}
                          >
                            <td className="py-3">
                              <span className="font-medium text-gray-900">
                                {order.order_number || order.id.slice(0, 8)}
                              </span>
                            </td>
                            <td className="py-3">
                              <span
                                className={cn(
                                  "px-2 py-1 rounded-full text-xs font-medium transition-all",
                                  STATUS_BADGES[order.status] ||
                                  "bg-gray-100 text-gray-700",
                                  isRecentlyUpdated && "ring-2 ring-aura-primary/30"
                                )}
                              >
                                {order.status}
                              </span>
                            </td>
                            <td className="py-3 text-sm text-gray-500 hidden sm:table-cell">
                              {formatDate(order.created_at)}
                            </td>
                            <td className="py-3 text-right font-medium">
                              {formatCurrency(order.total)}
                            </td>
                          </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500">{t("dashboard.noOrders")}</p>
                  </div>
                );
                })()}
              </Card>
            </div>

            {/* Right Column: Quick Actions */}
            <div className="space-y-6">
              <Card padding="lg">
                <h2 className="text-xl font-semibold mb-4 text-gray-900">
                  {t("dashboard.quickActions")}
                </h2>
                <div className="space-y-3">
                  <Link href="/build-box" className="block">
                    <Button
                      className="w-full justify-between"
                      variant="primary"
                      rightIcon={<ArrowRight className="w-4 h-4" />}
                    >
                      {t("dashboard.buildBox")}
                    </Button>
                  </Link>
                  <Link href="/orders" className="block">
                    <Button
                      className="w-full justify-between"
                      variant="secondary"
                      rightIcon={<ArrowRight className="w-4 h-4" />}
                    >
                      {t("dashboard.viewOrders")}
                    </Button>
                  </Link>
                  <Link href="/dashboard/subscriptions" className="block">
                    <Button
                      className="w-full justify-between"
                      variant="outline"
                      rightIcon={<ArrowRight className="w-4 h-4" />}
                    >
                      {t("dashboard.manageSubscription")}
                    </Button>
                  </Link>
                  <Link href="/dashboard/wishlist" className="block">
                    <Button
                      className="w-full justify-between"
                      variant="outline"
                      leftIcon={<Heart className="w-4 h-4" />}
                      rightIcon={<ArrowRight className="w-4 h-4" />}
                    >
                      {t("dashboard.myWishlist")}
                    </Button>
                  </Link>
                </div>
              </Card>

              <Card padding="lg">
                <h2 className="text-xl font-semibold mb-4 text-gray-900">
                  {t("dashboard.account")}
                </h2>
                <div className="space-y-3">
                  <div className="flex items-center justify-between py-2">
                    <span className="text-sm text-gray-500">{t("dashboard.email")}</span>
                    <span className="text-sm font-medium text-gray-900 truncate ml-4">
                      {profile.email}
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-2">
                    <span className="text-sm text-gray-500">{t("dashboard.role")}</span>
                    <span className="text-sm font-medium text-gray-900 capitalize">
                      {profile.role}
                    </span>
                  </div>
                  <Link href="/account" className="block pt-2">
                    <Button
                      className="w-full"
                      variant="ghost"
                      size="sm"
                      leftIcon={<Settings className="w-4 h-4" />}
                    >
                      {t("dashboard.accountSettings")}
                    </Button>
                  </Link>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
