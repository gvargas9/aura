"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/hooks";
import { Header, Footer, Card, Button } from "@/components/ui";
import { formatCurrency, formatDate } from "@/lib/utils";
import {
  Package,
  RefreshCcw,
  CreditCard,
  Settings,
  User,
  MapPin,
  Loader2,
  ChevronRight,
  Box,
  Calendar,
  Edit2,
} from "lucide-react";
import type { Order, Subscription } from "@/types";

interface DashboardStats {
  totalOrders: number;
  totalSpent: number;
  activeSubscriptions: number;
  credits: number;
  lastOrderDate: string | null;
}

export default function AccountDashboardPage() {
  const router = useRouter();
  const { user, profile, isLoading: authLoading, isAuthenticated } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const supabase = createClient();

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/auth/login?redirectTo=/account");
    }
  }, [authLoading, isAuthenticated, router]);

  useEffect(() => {
    const fetchAccountData = async () => {
      if (!user) return;

      setIsLoading(true);

      try {
        // Get user stats using RPC or manual queries
        const { data: orders } = await supabase
          .from("aura_orders")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false });

        const { data: subs } = await supabase
          .from("aura_subscriptions")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false });

        if (orders) {
          setRecentOrders(orders.slice(0, 5));
          const totalSpent = orders
            .filter((o) => o.status !== "cancelled")
            .reduce((sum, o) => sum + o.total, 0);

          setStats({
            totalOrders: orders.length,
            totalSpent,
            activeSubscriptions: subs?.filter((s) => s.status === "active").length || 0,
            credits: profile?.credits || 0,
            lastOrderDate: orders[0]?.created_at || null,
          });
        }

        if (subs) {
          setSubscriptions(subs);
        }
      } catch (error) {
        console.error("Failed to fetch account data:", error);
      }

      setIsLoading(false);
    };

    if (user) {
      fetchAccountData();
    }
  }, [user, profile, supabase]);

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-aura-primary" />
      </div>
    );
  }

  if (!user || !profile) {
    return null;
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "delivered":
        return "bg-green-100 text-green-700";
      case "shipped":
        return "bg-blue-100 text-blue-700";
      case "processing":
        return "bg-amber-100 text-amber-700";
      case "active":
        return "bg-green-100 text-green-700";
      case "paused":
        return "bg-amber-100 text-amber-700";
      case "cancelled":
        return "bg-red-100 text-red-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />

      <main className="flex-1 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">My Account</h1>
            <p className="text-gray-600">
              Welcome back, {profile.full_name || profile.email}!
            </p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <Card padding="md">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-aura-primary/10 rounded-lg flex items-center justify-center">
                  <Package className="w-5 h-5 text-aura-primary" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Total Orders</p>
                  <p className="text-2xl font-bold">{stats?.totalOrders || 0}</p>
                </div>
              </div>
            </Card>

            <Card padding="md">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <CreditCard className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Total Spent</p>
                  <p className="text-2xl font-bold">
                    {formatCurrency(stats?.totalSpent || 0)}
                  </p>
                </div>
              </div>
            </Card>

            <Card padding="md">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <RefreshCcw className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Active Subscriptions</p>
                  <p className="text-2xl font-bold">
                    {stats?.activeSubscriptions || 0}
                  </p>
                </div>
              </div>
            </Card>

            <Card padding="md">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Box className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Credits</p>
                  <p className="text-2xl font-bold">{stats?.credits || 0}</p>
                </div>
              </div>
            </Card>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-8">
              {/* Active Subscriptions */}
              {subscriptions.filter((s) => s.status === "active").length > 0 && (
                <Card padding="lg">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-semibold">Active Subscriptions</h2>
                    <Link href="/account/subscriptions">
                      <Button variant="ghost" size="sm">
                        Manage <ChevronRight className="w-4 h-4 ml-1" />
                      </Button>
                    </Link>
                  </div>

                  <div className="space-y-4">
                    {subscriptions
                      .filter((s) => s.status === "active")
                      .map((sub) => (
                        <div
                          key={sub.id}
                          className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                        >
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-aura-primary/10 rounded-lg flex items-center justify-center">
                              <Box className="w-6 h-6 text-aura-primary" />
                            </div>
                            <div>
                              <p className="font-semibold capitalize">
                                {sub.box_size} Box
                              </p>
                              <p className="text-sm text-gray-500">
                                {formatCurrency(sub.price)}/month
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-sm text-gray-500">Next delivery</p>
                            <p className="font-medium flex items-center gap-1">
                              <Calendar className="w-4 h-4" />
                              {sub.next_delivery_date
                                ? formatDate(sub.next_delivery_date)
                                : "Not scheduled"}
                            </p>
                          </div>
                        </div>
                      ))}
                  </div>
                </Card>
              )}

              {/* Recent Orders */}
              <Card padding="lg">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold">Recent Orders</h2>
                  <Link href="/account/orders">
                    <Button variant="ghost" size="sm">
                      View All <ChevronRight className="w-4 h-4 ml-1" />
                    </Button>
                  </Link>
                </div>

                {recentOrders.length > 0 ? (
                  <div className="space-y-4">
                    {recentOrders.map((order) => (
                      <Link
                        key={order.id}
                        href={`/account/orders/${order.id}`}
                        className="flex items-center justify-between p-4 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                            <Package className="w-6 h-6 text-gray-500" />
                          </div>
                          <div>
                            <p className="font-semibold">
                              {order.order_number || `#${order.id.slice(0, 8)}`}
                            </p>
                            <p className="text-sm text-gray-500">
                              {formatDate(order.created_at)}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}
                          >
                            {order.status}
                          </span>
                          <span className="font-semibold">
                            {formatCurrency(order.total)}
                          </span>
                          <ChevronRight className="w-5 h-5 text-gray-400" />
                        </div>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Package className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    <p className="text-gray-500 mb-4">No orders yet</p>
                    <Link href="/build-box">
                      <Button>Build Your First Box</Button>
                    </Link>
                  </div>
                )}
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Profile Card */}
              <Card padding="lg">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold">Profile</h3>
                  <Link href="/account/settings">
                    <Button variant="ghost" size="sm">
                      <Edit2 className="w-4 h-4" />
                    </Button>
                  </Link>
                </div>

                <div className="flex items-center gap-4 mb-4">
                  <div className="w-16 h-16 bg-aura-primary/10 rounded-full flex items-center justify-center">
                    {profile.avatar_url ? (
                      <img
                        src={profile.avatar_url}
                        alt="Avatar"
                        className="w-16 h-16 rounded-full object-cover"
                      />
                    ) : (
                      <User className="w-8 h-8 text-aura-primary" />
                    )}
                  </div>
                  <div>
                    <p className="font-semibold">{profile.full_name || "Guest"}</p>
                    <p className="text-sm text-gray-500">{profile.email}</p>
                  </div>
                </div>

                {profile.phone && (
                  <p className="text-sm text-gray-600 mb-2">📱 {profile.phone}</p>
                )}
              </Card>

              {/* Quick Links */}
              <Card padding="lg">
                <h3 className="font-semibold mb-4">Quick Links</h3>
                <div className="space-y-1">
                  <Link
                    href="/account/orders"
                    className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <Package className="w-5 h-5 text-gray-400" />
                      <span>Order History</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-400" />
                  </Link>
                  <Link
                    href="/account/subscriptions"
                    className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <RefreshCcw className="w-5 h-5 text-gray-400" />
                      <span>Subscriptions</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-400" />
                  </Link>
                  <Link
                    href="/account/addresses"
                    className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <MapPin className="w-5 h-5 text-gray-400" />
                      <span>Addresses</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-400" />
                  </Link>
                  <Link
                    href="/account/settings"
                    className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <Settings className="w-5 h-5 text-gray-400" />
                      <span>Account Settings</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-400" />
                  </Link>
                </div>
              </Card>

              {/* CTA */}
              <Card padding="lg" variant="dark">
                <h3 className="font-semibold mb-2">Need More Meals?</h3>
                <p className="text-gray-300 text-sm mb-4">
                  Build a custom box or upgrade your subscription.
                </p>
                <Link href="/build-box">
                  <Button variant="primary" className="w-full">
                    Build a Box
                  </Button>
                </Link>
              </Card>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
