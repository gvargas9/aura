"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/hooks";
import { Header, Footer, Card, Button } from "@/components/ui";
import { formatCurrency, formatDate } from "@/lib/utils";
import {
  BarChart3,
  DollarSign,
  Package,
  Users,
  TrendingUp,
  QrCode,
  Copy,
  Download,
  ArrowUpRight,
  Loader2,
  ExternalLink,
} from "lucide-react";
import type { Dealer, Order, DealerStats } from "@/types";

export default function DealerPortalPage() {
  const router = useRouter();
  const { user, profile, isLoading: authLoading, isAuthenticated } = useAuth();
  const [dealer, setDealer] = useState<Dealer | null>(null);
  const [stats, setStats] = useState<DealerStats | null>(null);
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  const supabase = createClient();

  // Check if user is a dealer
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/auth/login?redirectTo=/b2b/portal");
      return;
    }

    if (!authLoading && profile?.role !== "dealer") {
      router.push("/b2b");
      return;
    }
  }, [authLoading, isAuthenticated, profile, router]);

  // Fetch dealer data
  useEffect(() => {
    const fetchDealerData = async () => {
      if (!user) return;

      setIsLoading(true);

      // Get dealer record
      const { data: dealerData } = await supabase
        .from("dealers")
        .select("*, organizations(*)")
        .eq("profile_id", user.id)
        .single();

      if (dealerData) {
        setDealer(dealerData);

        // Get orders attributed to this dealer
        const { data: orders } = await supabase
          .from("aura_orders")
          .select("*")
          .eq("dealer_attribution_id", dealerData.id)
          .order("created_at", { ascending: false })
          .limit(10);

        if (orders) {
          setRecentOrders(orders);
        }

        // Calculate stats
        const { count: totalOrders } = await supabase
          .from("aura_orders")
          .select("*", { count: "exact", head: true })
          .eq("dealer_attribution_id", dealerData.id);

        const { data: revenueData } = await supabase
          .from("aura_orders")
          .select("total")
          .eq("dealer_attribution_id", dealerData.id);

        const totalRevenue =
          revenueData?.reduce((sum, o) => sum + o.total, 0) || 0;

        setStats({
          totalOrders: totalOrders || 0,
          totalRevenue,
          commissionEarned: dealerData.commission_earned,
          commissionPending: dealerData.commission_pending || 0,
          activeReferrals: totalOrders || 0,
          conversionRate: 0.12, // Would calculate from actual data
        });
      }

      setIsLoading(false);
    };

    if (user && profile?.role === "dealer") {
      fetchDealerData();
    }
  }, [user, profile, supabase]);

  const copyReferralLink = () => {
    if (dealer) {
      const link = `${window.location.origin}/v/${dealer.referral_code}`;
      navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-aura-primary" />
      </div>
    );
  }

  if (!dealer) {
    return null;
  }

  const referralLink = `${typeof window !== "undefined" ? window.location.origin : ""}/v/${dealer.referral_code}`;

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />

      <main className="flex-1 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Dealer Portal</h1>
            <p className="text-gray-600">
              Welcome back! Here&apos;s your business overview.
            </p>
          </div>

          {/* Stats Grid */}
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
                  <DollarSign className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Total Revenue</p>
                  <p className="text-2xl font-bold">
                    {formatCurrency(stats?.totalRevenue || 0)}
                  </p>
                </div>
              </div>
            </Card>

            <Card padding="md">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-aura-accent/10 rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-aura-accent" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Commission Earned</p>
                  <p className="text-2xl font-bold">
                    {formatCurrency(stats?.commissionEarned || 0)}
                  </p>
                </div>
              </div>
            </Card>

            <Card padding="md">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Users className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Pending Payout</p>
                  <p className="text-2xl font-bold">
                    {formatCurrency(stats?.commissionPending || 0)}
                  </p>
                </div>
              </div>
            </Card>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-8">
              {/* Recent Orders */}
              <Card padding="lg">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold">Recent Referral Orders</h2>
                  <Button variant="ghost" size="sm">
                    View All
                    <ArrowUpRight className="w-4 h-4 ml-1" />
                  </Button>
                </div>

                {recentOrders.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-3 px-2 text-sm font-medium text-gray-500">
                            Order
                          </th>
                          <th className="text-left py-3 px-2 text-sm font-medium text-gray-500">
                            Date
                          </th>
                          <th className="text-left py-3 px-2 text-sm font-medium text-gray-500">
                            Status
                          </th>
                          <th className="text-right py-3 px-2 text-sm font-medium text-gray-500">
                            Amount
                          </th>
                          <th className="text-right py-3 px-2 text-sm font-medium text-gray-500">
                            Commission
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {recentOrders.map((order) => (
                          <tr key={order.id} className="border-b last:border-0">
                            <td className="py-3 px-2 font-medium">
                              #{order.id.slice(0, 8)}
                            </td>
                            <td className="py-3 px-2 text-gray-500">
                              {formatDate(order.created_at)}
                            </td>
                            <td className="py-3 px-2">
                              <span
                                className={`px-2 py-1 rounded-full text-xs font-medium ${
                                  order.status === "delivered"
                                    ? "bg-green-100 text-green-700"
                                    : order.status === "shipped"
                                    ? "bg-blue-100 text-blue-700"
                                    : "bg-gray-100 text-gray-700"
                                }`}
                              >
                                {order.status}
                              </span>
                            </td>
                            <td className="py-3 px-2 text-right">
                              {formatCurrency(order.total)}
                            </td>
                            <td className="py-3 px-2 text-right text-aura-primary font-medium">
                              {formatCurrency(order.total * 0.1)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <Package className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>No orders yet. Share your referral link to get started!</p>
                  </div>
                )}
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Referral Code Card */}
              <Card padding="lg" variant="bordered">
                <div className="text-center">
                  <QrCode className="w-12 h-12 text-aura-primary mx-auto mb-4" />
                  <h3 className="font-semibold mb-2">Your Referral Code</h3>
                  <p className="text-3xl font-bold text-aura-primary mb-4">
                    {dealer.referral_code}
                  </p>

                  <div className="bg-gray-50 rounded-lg p-3 mb-4">
                    <p className="text-xs text-gray-500 mb-1">Your Link</p>
                    <p className="text-sm font-mono break-all">{referralLink}</p>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      className="flex-1"
                      onClick={copyReferralLink}
                    >
                      <Copy className="w-4 h-4 mr-1" />
                      {copied ? "Copied!" : "Copy"}
                    </Button>
                    <Button variant="outline" size="sm" className="flex-1">
                      <Download className="w-4 h-4 mr-1" />
                      QR Code
                    </Button>
                  </div>
                </div>
              </Card>

              {/* Quick Links */}
              <Card padding="lg">
                <h3 className="font-semibold mb-4">Quick Links</h3>
                <div className="space-y-2">
                  <a
                    href="/b2b/products"
                    className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <span>Product Catalog</span>
                    <ExternalLink className="w-4 h-4 text-gray-400" />
                  </a>
                  <a
                    href="/b2b/orders"
                    className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <span>Place Wholesale Order</span>
                    <ExternalLink className="w-4 h-4 text-gray-400" />
                  </a>
                  <a
                    href="/b2b/payouts"
                    className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <span>Payout History</span>
                    <ExternalLink className="w-4 h-4 text-gray-400" />
                  </a>
                  <a
                    href="/b2b/marketing"
                    className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <span>Marketing Materials</span>
                    <ExternalLink className="w-4 h-4 text-gray-400" />
                  </a>
                </div>
              </Card>

              {/* Support */}
              <Card padding="lg" variant="dark">
                <h3 className="font-semibold mb-2">Need Help?</h3>
                <p className="text-gray-300 text-sm mb-4">
                  Our dealer success team is here to help you grow.
                </p>
                <Button variant="secondary" size="sm" className="w-full">
                  Contact Support
                </Button>
              </Card>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
