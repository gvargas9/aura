"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/hooks";
import { Header, Footer, Card, Button, Badge } from "@/components/ui";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { Order, Subscription } from "@/types";
import {
  Package,
  RefreshCcw,
  CreditCard,
  User,
  Settings,
  Loader2,
  ArrowRight,
  Truck,
  Calendar,
  Clock,
  CheckCircle,
  AlertCircle,
  Plus,
  Gift,
} from "lucide-react";

export default function DashboardPage() {
  const router = useRouter();
  const { profile, user, isLoading: authLoading, isAuthenticated } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const supabase = createClient();

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/auth/login?redirectTo=/dashboard");
    }
  }, [authLoading, isAuthenticated, router]);

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;

      const [ordersRes, subscriptionsRes] = await Promise.all([
        supabase
          .from("aura_orders")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(5),
        supabase
          .from("aura_subscriptions")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false }),
      ]);

      setOrders(ordersRes.data || []);
      setSubscriptions(subscriptionsRes.data || []);
      setIsLoading(false);
    };

    if (user) {
      fetchData();
    }
  }, [user, supabase]);

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-aura-primary" />
      </div>
    );
  }

  const activeSubscription = subscriptions.find((s) => s.status === "active");
  const totalSpent = orders.reduce((sum, o) => sum + o.total, 0);

  const quickActions = [
    { label: "Build a Box", href: "/build-box", icon: Package, primary: true },
    { label: "View Orders", href: "/orders", icon: Truck },
    { label: "Manage Subscription", href: "/subscription", icon: RefreshCcw },
    { label: "Account Settings", href: "/account", icon: Settings },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />

      <main className="flex-1 py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Welcome Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">
              Welcome back, {profile?.full_name?.split(" ")[0] || "there"}!
            </h1>
            <p className="text-gray-500 mt-1">
              Manage your subscriptions, orders, and account settings
            </p>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {quickActions.map((action) => (
              <Link key={action.href} href={action.href}>
                <Card
                  className={`p-4 h-full transition-all hover:-translate-y-1 ${
                    action.primary
                      ? "bg-aura-primary text-white hover:bg-aura-secondary"
                      : "hover:border-aura-primary/30"
                  }`}
                >
                  <div className="flex flex-col items-center text-center gap-3">
                    <div
                      className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                        action.primary ? "bg-white/20" : "bg-aura-light"
                      }`}
                    >
                      <action.icon
                        className={`w-6 h-6 ${
                          action.primary ? "text-white" : "text-aura-primary"
                        }`}
                      />
                    </div>
                    <span className={`font-medium ${action.primary ? "" : "text-gray-900"}`}>
                      {action.label}
                    </span>
                  </div>
                </Card>
              </Link>
            ))}
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Active Subscription */}
              <Card padding="lg">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold">Active Subscription</h2>
                  <Link href="/subscription">
                    <Button variant="ghost" size="sm">
                      Manage
                    </Button>
                  </Link>
                </div>

                {activeSubscription ? (
                  <div className="bg-gradient-to-br from-aura-light to-white p-6 rounded-2xl border border-aura-primary/20">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <Badge variant="success" size="md">
                          Active
                        </Badge>
                        <h3 className="text-2xl font-bold capitalize mt-2">
                          {activeSubscription.box_size} Box
                        </h3>
                        <p className="text-gray-600">
                          {activeSubscription.box_config?.length || 0} meals included
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-3xl font-bold text-aura-primary">
                          {formatCurrency(activeSubscription.price)}
                        </p>
                        <p className="text-gray-500">per month</p>
                      </div>
                    </div>

                    {activeSubscription.next_delivery_date && (
                      <div className="flex items-center gap-4 pt-4 border-t border-aura-primary/10">
                        <div className="flex items-center gap-2 text-gray-600">
                          <Calendar className="w-5 h-5 text-aura-primary" />
                          <span>Next delivery:</span>
                          <span className="font-medium text-gray-900">
                            {formatDate(activeSubscription.next_delivery_date)}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Package className="w-8 h-8 text-gray-400" />
                    </div>
                    <h3 className="font-semibold text-gray-900 mb-2">No Active Subscription</h3>
                    <p className="text-gray-500 mb-4">
                      Start your journey with a personalized box of premium meals
                    </p>
                    <Link href="/build-box">
                      <Button leftIcon={<Plus className="w-4 h-4" />}>Build Your First Box</Button>
                    </Link>
                  </div>
                )}
              </Card>

              {/* Recent Orders */}
              <Card padding="lg">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold">Recent Orders</h2>
                  <Link href="/orders">
                    <Button variant="ghost" size="sm">
                      View All
                    </Button>
                  </Link>
                </div>

                {orders.length > 0 ? (
                  <div className="space-y-3">
                    {orders.slice(0, 3).map((order) => (
                      <Link key={order.id} href={`/orders/${order.id}`}>
                        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center border border-gray-200">
                              <Package className="w-6 h-6 text-gray-400" />
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">
                                Order #{order.order_number || order.id.slice(0, 8)}
                              </p>
                              <p className="text-sm text-gray-500">
                                {formatDate(order.created_at)}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-medium">{formatCurrency(order.total)}</p>
                            <Badge
                              variant={
                                order.status === "delivered"
                                  ? "success"
                                  : order.status === "shipped"
                                  ? "info"
                                  : "warning"
                              }
                              size="sm"
                            >
                              {order.status}
                            </Badge>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Truck className="w-8 h-8 text-gray-400" />
                    </div>
                    <h3 className="font-semibold text-gray-900 mb-2">No Orders Yet</h3>
                    <p className="text-gray-500">
                      Your order history will appear here
                    </p>
                  </div>
                )}
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Account Overview */}
              <Card padding="lg">
                <h3 className="font-semibold mb-4">Account Overview</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500">Total Orders</span>
                    <span className="font-semibold">{orders.length}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500">Total Spent</span>
                    <span className="font-semibold">{formatCurrency(totalSpent)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500">Credits</span>
                    <span className="font-semibold">{profile?.credits || 0}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500">Member Since</span>
                    <span className="font-semibold">
                      {profile?.created_at ? formatDate(profile.created_at) : "-"}
                    </span>
                  </div>
                </div>
              </Card>

              {/* Referral Banner */}
              <Card className="bg-gradient-to-br from-aura-accent to-red-500 text-white p-6">
                <div className="flex items-center gap-3 mb-3">
                  <Gift className="w-6 h-6" />
                  <h3 className="font-semibold">Refer a Friend</h3>
                </div>
                <p className="text-white/80 text-sm mb-4">
                  Share Aura with friends and earn $10 credit for each referral!
                </p>
                <Button className="w-full bg-white text-aura-accent hover:bg-white/90">
                  Get Your Referral Link
                </Button>
              </Card>

              {/* Help Card */}
              <Card padding="lg">
                <h3 className="font-semibold mb-3">Need Help?</h3>
                <p className="text-gray-500 text-sm mb-4">
                  Our support team is here to help you with any questions.
                </p>
                <div className="space-y-2">
                  <Link
                    href="/help"
                    className="block p-3 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                  >
                    Help Center
                  </Link>
                  <Link
                    href="/contact"
                    className="block p-3 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                  >
                    Contact Support
                  </Link>
                  <Link
                    href="/faq"
                    className="block p-3 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                  >
                    FAQ
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
