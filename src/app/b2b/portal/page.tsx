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
  ArrowDownRight,
  Loader2,
  ExternalLink,
  Check,
  Share2,
  Calendar,
  ChevronRight,
  Gift,
  Target,
  Wallet,
  Clock,
  Sparkles,
  Award,
  LineChart,
  Link2,
} from "lucide-react";
import Link from "next/link";
import type { Dealer, Order, DealerStats } from "@/types";

// Simple SVG Line Chart Component for Dealer Portal
function MiniLineChart({ data, color = "#10b981" }: { data: number[], color?: string }) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const height = 50;
  const width = 140;
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
        <linearGradient id={`dealer-gradient-${color.replace("#", "")}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={areaD} fill={`url(#dealer-gradient-${color.replace("#", "")})`} />
      <path d={pathD} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      {points.map((point, i) => (
        <circle
          key={i}
          cx={point.x}
          cy={point.y}
          r={i === points.length - 1 ? 4 : 0}
          fill={color}
        />
      ))}
    </svg>
  );
}

// Progress Ring Component
function ProgressRing({ progress, size = 80, color = "#10b981" }: { progress: number, size?: number, color?: string }) {
  const strokeWidth = 8;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (progress / 100) * circumference;

  return (
    <div className="relative">
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#e5e7eb"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-500"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-xl font-bold">{progress}%</span>
      </div>
    </div>
  );
}

export default function DealerPortalPage() {
  const router = useRouter();
  const { user, profile, isLoading: authLoading, isAuthenticated } = useAuth();
  const [dealer, setDealer] = useState<Dealer | null>(null);
  const [stats, setStats] = useState<DealerStats | null>(null);
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState("30d");

  const supabase = createClient();

  // Mock chart data
  const revenueData = [1200, 1500, 1300, 1800, 2100, 1900, 2400, 2200, 2800, 3100, 2900, 3500];
  const ordersData = [4, 6, 5, 8, 9, 7, 11, 10, 13, 15, 14, 18];
  const commissionData = [120, 150, 130, 180, 210, 190, 240, 220, 280, 310, 290, 350];

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

        const { data: revenueDbData } = await supabase
          .from("aura_orders")
          .select("total")
          .eq("dealer_attribution_id", dealerData.id);

        const totalRevenue =
          revenueDbData?.reduce((sum, o) => sum + o.total, 0) || 0;

        setStats({
          totalOrders: totalOrders || 0,
          totalRevenue,
          commissionEarned: dealerData.commission_earned,
          commissionPending: dealerData.commission_pending || 0,
          activeReferrals: totalOrders || 0,
          conversionRate: 12,
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
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="w-10 h-10 animate-spin text-aura-primary mx-auto mb-4" />
          <p className="text-gray-500">Loading your portal...</p>
        </div>
      </div>
    );
  }

  if (!dealer) {
    return null;
  }

  const referralLink = `${typeof window !== "undefined" ? window.location.origin : ""}/v/${dealer.referral_code}`;

  const commissionRate = dealer.commission_rate || 10;
  const tierProgress = Math.min((stats?.totalRevenue || 0) / 10000 * 100, 100);
  const nextTier = tierProgress >= 100 ? "Platinum" : tierProgress >= 75 ? "Gold" : tierProgress >= 50 ? "Silver" : "Bronze";

  const statCards = [
    {
      title: "Total Revenue",
      value: formatCurrency(stats?.totalRevenue || 0),
      change: 23.5,
      icon: DollarSign,
      color: "emerald",
      chartData: revenueData,
      chartColor: "#10b981",
    },
    {
      title: "Total Orders",
      value: stats?.totalOrders?.toString() || "0",
      change: 15.2,
      icon: Package,
      color: "blue",
      chartData: ordersData,
      chartColor: "#3b82f6",
    },
    {
      title: "Commission Earned",
      value: formatCurrency(stats?.commissionEarned || 0),
      change: 18.7,
      icon: TrendingUp,
      color: "violet",
      chartData: commissionData,
      chartColor: "#8b5cf6",
    },
    {
      title: "Pending Payout",
      value: formatCurrency(stats?.commissionPending || 0),
      change: 0,
      icon: Wallet,
      color: "amber",
      chartData: [0, 100, 50, 150, 120, 200, 180, 250, 220, 300, 280, 350],
      chartColor: "#f59e0b",
    },
  ];

  const colorMap: Record<string, { bg: string, icon: string }> = {
    emerald: { bg: "bg-emerald-100", icon: "text-emerald-600" },
    blue: { bg: "bg-blue-100", icon: "text-blue-600" },
    violet: { bg: "bg-violet-100", icon: "text-violet-600" },
    amber: { bg: "bg-amber-100", icon: "text-amber-600" },
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50/50">
      {/* Custom Dealer Header */}
      <header className="bg-gradient-to-r from-blue-900 via-indigo-900 to-blue-900 text-white sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/" className="flex items-center gap-2">
                <div className="w-9 h-9 bg-gradient-to-br from-aura-primary to-emerald-400 rounded-xl flex items-center justify-center shadow-lg">
                  <span className="text-white font-bold">A</span>
                </div>
                <span className="text-xl font-bold">Aura</span>
              </Link>
              <span className="px-3 py-1 bg-white/10 backdrop-blur-sm text-blue-300 text-xs rounded-full font-medium border border-blue-400/20">
                Dealer Portal
              </span>
            </div>
            <div className="flex items-center gap-6">
              <nav className="hidden md:flex items-center gap-1">
                {["Dashboard", "Orders", "Payouts", "Marketing"].map((item, i) => (
                  <Link
                    key={item}
                    href={i === 0 ? "/b2b/portal" : `/b2b/${item.toLowerCase()}`}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      i === 0 ? "bg-white/10 text-white" : "text-gray-300 hover:text-white hover:bg-white/5"
                    }`}
                  >
                    {item}
                  </Link>
                ))}
              </nav>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-full flex items-center justify-center text-white font-medium text-sm">
                  {profile?.full_name?.charAt(0) || "D"}
                </div>
                <div className="hidden sm:block">
                  <p className="text-sm font-medium">{profile?.full_name || "Dealer"}</p>
                  <p className="text-xs text-gray-400">{dealer.tier || "Bronze"} Tier</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Page Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Welcome back, {profile?.full_name?.split(" ")[0] || "Partner"}!</h1>
              <p className="text-gray-500 mt-1">
                Here&apos;s how your referral business is performing
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center bg-white rounded-xl border border-gray-200 p-1">
                {["7d", "30d", "90d", "1y"].map((period) => (
                  <button
                    key={period}
                    onClick={() => setSelectedPeriod(period)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      selectedPeriod === period
                        ? "bg-blue-600 text-white shadow-sm"
                        : "text-gray-600 hover:text-blue-600"
                    }`}
                  >
                    {period}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Referral Link Banner */}
          <div className="mb-8 bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 rounded-2xl p-6 text-white relative overflow-hidden">
            <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl" />

            <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-white/10 backdrop-blur-sm rounded-2xl flex items-center justify-center border border-white/20">
                  <Link2 className="w-8 h-8" />
                </div>
                <div>
                  <p className="text-blue-200 text-sm font-medium mb-1">Your Referral Link</p>
                  <p className="font-mono text-lg">{referralLink}</p>
                </div>
              </div>
              <div className="flex gap-3">
                <Button
                  variant="secondary"
                  onClick={copyReferralLink}
                  className="bg-white text-blue-600 hover:bg-gray-100"
                >
                  {copied ? <Check className="w-4 h-4 mr-2" /> : <Copy className="w-4 h-4 mr-2" />}
                  {copied ? "Copied!" : "Copy Link"}
                </Button>
                <Button variant="outline" className="border-white/30 text-white hover:bg-white/10">
                  <Share2 className="w-4 h-4 mr-2" />
                  Share
                </Button>
                <Button variant="outline" className="border-white/30 text-white hover:bg-white/10">
                  <QrCode className="w-4 h-4 mr-2" />
                  QR Code
                </Button>
              </div>
            </div>
          </div>

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
                    {stat.change !== 0 && (
                      <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                        stat.change > 0 ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                      }`}>
                        {stat.change > 0 ? (
                          <ArrowUpRight className="w-3 h-3" />
                        ) : (
                          <ArrowDownRight className="w-3 h-3" />
                        )}
                        {Math.abs(stat.change)}%
                      </div>
                    )}
                  </div>
                  <p className="text-sm text-gray-500 mb-1">{stat.title}</p>
                  <p className="text-2xl font-bold text-gray-900 mb-4">{stat.value}</p>
                  <MiniLineChart data={stat.chartData} color={stat.chartColor} />
                </div>
              );
            })}
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-8">
              {/* Recent Orders */}
              <div className="bg-white rounded-2xl p-6 border border-gray-100">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">Recent Referral Orders</h2>
                    <p className="text-sm text-gray-500">Orders from customers who used your link</p>
                  </div>
                  <Link href="/b2b/orders">
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
                          <th className="text-left py-3 px-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                            Order
                          </th>
                          <th className="text-left py-3 px-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                            Date
                          </th>
                          <th className="text-left py-3 px-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                            Status
                          </th>
                          <th className="text-right py-3 px-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                            Amount
                          </th>
                          <th className="text-right py-3 px-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                            Commission
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {recentOrders.map((order) => (
                          <tr key={order.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50 transition-colors">
                            <td className="py-4 px-2">
                              <span className="font-medium text-gray-900">
                                #{order.id.slice(0, 8)}
                              </span>
                            </td>
                            <td className="py-4 px-2 text-gray-500">
                              {formatDate(order.created_at)}
                            </td>
                            <td className="py-4 px-2">
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
                            <td className="py-4 px-2 text-right font-medium text-gray-900">
                              {formatCurrency(order.total)}
                            </td>
                            <td className="py-4 px-2 text-right">
                              <span className="font-semibold text-emerald-600">
                                +{formatCurrency(order.total * (commissionRate / 100))}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <Package className="w-8 h-8 text-gray-400" />
                    </div>
                    <p className="text-gray-500 mb-2">No orders yet</p>
                    <p className="text-sm text-gray-400">Share your referral link to start earning commissions!</p>
                  </div>
                )}
              </div>

              {/* Performance Chart Placeholder */}
              <div className="bg-white rounded-2xl p-6 border border-gray-100">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">Performance Overview</h2>
                    <p className="text-sm text-gray-500">Your commission earnings over time</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-blue-500 rounded-full" />
                      <span className="text-sm text-gray-500">Revenue</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-emerald-500 rounded-full" />
                      <span className="text-sm text-gray-500">Commission</span>
                    </div>
                  </div>
                </div>

                <div className="h-64 flex items-end justify-between gap-2 px-4">
                  {revenueData.map((value, i) => {
                    const maxValue = Math.max(...revenueData);
                    const height = (value / maxValue) * 100;
                    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
                    return (
                      <div key={i} className="flex-1 flex flex-col items-center gap-2">
                        <div className="w-full flex flex-col gap-1">
                          <div
                            className="w-full bg-gradient-to-t from-blue-500 to-blue-400 rounded-t-md transition-all duration-500 hover:opacity-80"
                            style={{ height: `${height}%` }}
                          />
                        </div>
                        <span className="text-xs text-gray-400">{months[i]}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Tier Progress */}
              <div className="bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 rounded-2xl p-6 text-white relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl" />

                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <p className="text-white/80 text-sm">Current Tier</p>
                      <p className="text-2xl font-bold">{dealer.tier || "Bronze"}</p>
                    </div>
                    <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                      <Award className="w-7 h-7" />
                    </div>
                  </div>

                  <div className="mb-4">
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-white/80">Progress to {nextTier}</span>
                      <span className="font-medium">{Math.round(tierProgress)}%</span>
                    </div>
                    <div className="h-2 bg-white/20 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-white rounded-full transition-all duration-500"
                        style={{ width: `${tierProgress}%` }}
                      />
                    </div>
                  </div>

                  <p className="text-sm text-white/70">
                    {formatCurrency(10000 - (stats?.totalRevenue || 0))} more to reach {nextTier}
                  </p>
                </div>
              </div>

              {/* Commission Rate */}
              <div className="bg-white rounded-2xl p-6 border border-gray-100">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
                    <Target className="w-6 h-6 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Your Commission Rate</p>
                    <p className="text-3xl font-bold text-emerald-600">{commissionRate}%</p>
                  </div>
                </div>
                <p className="text-sm text-gray-500">
                  Earn {commissionRate}% on every order made through your referral link
                </p>
              </div>

              {/* Quick Actions */}
              <div className="bg-white rounded-2xl p-6 border border-gray-100">
                <h3 className="font-bold text-gray-900 mb-4">Quick Actions</h3>
                <div className="space-y-2">
                  <Link
                    href="/b2b/marketing"
                    className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 transition-colors group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-violet-100 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Sparkles className="w-5 h-5 text-violet-600" />
                      </div>
                      <span className="font-medium">Marketing Materials</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-400" />
                  </Link>
                  <Link
                    href="/b2b/payouts"
                    className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 transition-colors group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Wallet className="w-5 h-5 text-amber-600" />
                      </div>
                      <span className="font-medium">Payout History</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-400" />
                  </Link>
                  <Link
                    href="/products"
                    className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 transition-colors group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Package className="w-5 h-5 text-blue-600" />
                      </div>
                      <span className="font-medium">Product Catalog</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-400" />
                  </Link>
                </div>
              </div>

              {/* Support Card */}
              <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-6 text-white">
                <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center mb-4">
                  <Gift className="w-6 h-6" />
                </div>
                <h3 className="font-bold mb-2">Need Help Growing?</h3>
                <p className="text-gray-400 text-sm mb-4">
                  Our dealer success team is here to help you maximize your earnings.
                </p>
                <Button variant="secondary" size="sm" className="w-full bg-white text-gray-900 hover:bg-gray-100">
                  Contact Support
                </Button>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
