"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import {
  TrendingUp,
  TrendingDown,
  Users,
  AlertTriangle,
  ShieldAlert,
  Package,
  RefreshCcw,
  ChevronDown,
  ChevronUp,
  Send,
  DollarSign,
  CreditCard,
  ShoppingCart,
  CalendarDays,
  Store,
  Repeat,
  Handshake,
  ArrowRightLeft,
  UserPlus,
  Share2,
  Building2,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ChurnUser {
  id: string;
  email: string;
  fullName: string | null;
  churnScore: number;
  riskLevel: string;
  subscription: {
    status: string;
    box_size: string;
    next_delivery_date: string | null;
  } | null;
}

interface ChurnSummary {
  total: number;
  low: number;
  medium: number;
  high: number;
  critical: number;
}

interface ChurnDetail {
  score: number;
  riskLevel: string;
  factors: {
    daysSinceLastOrder: number;
    orderFrequencyDecline: number;
    subscriptionPauseCount: number;
    supportTicketCount: number;
    missedSelectionDeadlines: number;
    averageOrderValue: number;
    orderValueTrend: number;
    engagementScore: number;
    subscriptionAge: number;
  };
  recommendations: string[];
}

interface DemandForecast {
  productId: string;
  productName: string;
  currentStock: number;
  safetyStock: number;
  averageDailyDemand: number;
  demandTrend: "increasing" | "stable" | "decreasing";
  daysUntilStockout: number;
  recommendedReorderDate: string;
  recommendedReorderQuantity: number;
  forecastedDemand30Days: number;
  forecastedDemand90Days: number;
  seasonalityFactor: number;
}

interface DemandSummary {
  total: number;
  belowSafetyStock: number;
  reorderSoon: number;
  stable: number;
  avgDaysToStockout: number;
}

interface ConversionData {
  signupToOrder: {
    totalSignups: number;
    usersWithOrders: number;
    rate: number;
  };
  subscriptionRetention: {
    totalSubscriptions: number;
    activeSubscriptions: number;
    rate: number;
  };
  referralPerformance: {
    totalReferrals: number;
    completedReferrals: number;
    rate: number;
  };
  b2bPipeline: {
    totalDealers: number;
    activeDealers: number;
    activeRate: number;
    orgsByTier: Record<string, number>;
  };
}

interface RevenueSummary {
  totalRevenue: number;
  mrr: number;
  averageOrderValue: number;
  ordersThisMonth: number;
}

interface RevenueByChannel {
  subscriptionRevenue: number;
  oneTimeRevenue: number;
  b2bRevenue: number;
  subscriptionCount: number;
  oneTimeCount: number;
  b2bCount: number;
}

interface TopProduct {
  name: string;
  unitsSold: number;
  revenue: number;
}

// ---------------------------------------------------------------------------
// Helper components
// ---------------------------------------------------------------------------

function StatCard({
  label,
  value,
  icon: Icon,
  color = "text-gray-600",
  bgColor = "bg-gray-50",
}: {
  label: string;
  value: string | number;
  icon: React.ElementType;
  color?: string;
  bgColor?: string;
}) {
  return (
    <Card padding="md" className="flex items-center gap-4">
      <div className={`p-3 rounded-lg ${bgColor}`}>
        <Icon className={`w-6 h-6 ${color}`} />
      </div>
      <div>
        <p className="text-sm text-gray-500">{label}</p>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
      </div>
    </Card>
  );
}

function RiskBadge({ level }: { level: string }) {
  const styles: Record<string, string> = {
    low: "bg-green-100 text-green-800",
    medium: "bg-yellow-100 text-yellow-800",
    high: "bg-orange-100 text-orange-800",
    critical: "bg-red-100 text-red-800",
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${styles[level] ?? styles.low}`}
    >
      {level}
    </span>
  );
}

function RiskDistributionBar({ summary }: { summary: ChurnSummary }) {
  const total = summary.total || 1;
  const segments = [
    { label: "Low", count: summary.low, color: "bg-green-500" },
    { label: "Medium", count: summary.medium, color: "bg-yellow-500" },
    { label: "High", count: summary.high, color: "bg-orange-500" },
    { label: "Critical", count: summary.critical, color: "bg-red-500" },
  ];

  return (
    <div className="space-y-2">
      <div className="flex h-6 rounded-full overflow-hidden bg-gray-100">
        {segments.map((seg) => {
          const pct = (seg.count / total) * 100;
          if (pct === 0) return null;
          return (
            <div
              key={seg.label}
              className={`${seg.color} transition-all duration-500`}
              style={{ width: `${pct}%` }}
              title={`${seg.label}: ${seg.count} (${Math.round(pct)}%)`}
            />
          );
        })}
      </div>
      <div className="flex justify-between text-xs text-gray-500">
        {segments.map((seg) => (
          <div key={seg.label} className="flex items-center gap-1">
            <div className={`w-2.5 h-2.5 rounded-full ${seg.color}`} />
            <span>
              {seg.label}: {seg.count}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function StockStatusColor(daysUntilStockout: number, currentStock: number, safetyStock: number) {
  if (currentStock <= safetyStock) return "bg-red-50 border-l-4 border-red-500";
  if (daysUntilStockout <= 30) return "bg-amber-50 border-l-4 border-amber-500";
  return "bg-green-50 border-l-4 border-green-500";
}

function TrendIcon({ trend }: { trend: string }) {
  if (trend === "increasing") return <TrendingUp className="w-4 h-4 text-green-600" />;
  if (trend === "decreasing") return <TrendingDown className="w-4 h-4 text-red-600" />;
  return <span className="text-gray-400 text-xs">--</span>;
}

function ConversionBar({
  label,
  numerator,
  denominator,
  icon: Icon,
}: {
  label: string;
  numerator: number;
  denominator: number;
  icon: React.ElementType;
}) {
  const rate = denominator > 0 ? (numerator / denominator) * 100 : 0;
  const color =
    rate >= 50
      ? "bg-green-500"
      : rate >= 25
        ? "bg-amber-500"
        : "bg-red-500";
  const textColor =
    rate >= 50
      ? "text-green-700"
      : rate >= 25
        ? "text-amber-700"
        : "text-red-700";

  return (
    <Card padding="md" className="space-y-3">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-gray-50">
          <Icon className="w-5 h-5 text-gray-600" />
        </div>
        <h4 className="text-sm font-medium text-gray-700">{label}</h4>
      </div>
      <div className="flex items-end justify-between">
        <p className={`text-3xl font-bold tabular-nums ${textColor}`}>
          {denominator > 0 ? `${rate.toFixed(1)}%` : "No data"}
        </p>
        <p className="text-sm text-gray-500">
          {numerator.toLocaleString()} / {denominator.toLocaleString()}
        </p>
      </div>
      <div className="w-full h-2.5 rounded-full bg-gray-100 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${color}`}
          style={{ width: `${Math.min(rate, 100)}%` }}
        />
      </div>
    </Card>
  );
}

function TierBadge({ tier, count }: { tier: string; count: number }) {
  const styles: Record<string, string> = {
    bronze: "bg-orange-100 text-orange-800",
    silver: "bg-gray-100 text-gray-800",
    gold: "bg-yellow-100 text-yellow-800",
    platinum: "bg-purple-100 text-purple-800",
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium ${styles[tier.toLowerCase()] ?? "bg-gray-100 text-gray-800"}`}
    >
      {tier}
      <span className="font-bold">{count}</span>
    </span>
  );
}

// ---------------------------------------------------------------------------
// Main Page
// ---------------------------------------------------------------------------

export default function AnalyticsPage() {
  const [activeTab, setActiveTab] = useState<"churn" | "demand" | "revenue" | "conversions">("churn");

  // Churn state
  const [churnSummary, setChurnSummary] = useState<ChurnSummary | null>(null);
  const [churnUsers, setChurnUsers] = useState<ChurnUser[]>([]);
  const [churnLoading, setChurnLoading] = useState(true);
  const [recalculating, setRecalculating] = useState(false);
  const [expandedUserId, setExpandedUserId] = useState<string | null>(null);
  const [churnDetail, setChurnDetail] = useState<ChurnDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // Demand state
  const [demandSummary, setDemandSummary] = useState<DemandSummary | null>(null);
  const [forecasts, setForecasts] = useState<DemandForecast[]>([]);
  const [demandLoading, setDemandLoading] = useState(true);
  const [reportGenerating, setReportGenerating] = useState(false);
  const [reportResult, setReportResult] = useState<{
    urgentCount: number;
    totalEstimatedCost: number;
    n8nTriggered: boolean;
  } | null>(null);

  // Revenue state
  const [revenueSummary, setRevenueSummary] = useState<RevenueSummary | null>(null);
  const [revenueByChannel, setRevenueByChannel] = useState<RevenueByChannel | null>(null);
  const [topProducts, setTopProducts] = useState<TopProduct[]>([]);
  const [revenueLoading, setRevenueLoading] = useState(true);

  // Conversions state
  const [conversionData, setConversionData] = useState<ConversionData | null>(null);
  const [conversionLoading, setConversionLoading] = useState(true);

  // ---------------------------------------------------------------------------
  // Data fetching
  // ---------------------------------------------------------------------------

  const fetchChurnData = useCallback(async () => {
    setChurnLoading(true);
    try {
      const res = await fetch("/api/analytics/churn?limit=50");
      if (res.ok) {
        const data = await res.json();
        setChurnSummary(data.summary);
        setChurnUsers(data.users);
      }
    } catch (error) {
      console.error("Failed to fetch churn data:", error);
    } finally {
      setChurnLoading(false);
    }
  }, []);

  const fetchDemandData = useCallback(async () => {
    setDemandLoading(true);
    try {
      const res = await fetch("/api/analytics/demand");
      if (res.ok) {
        const data = await res.json();
        setDemandSummary(data.summary);
        setForecasts(data.forecasts);
      }
    } catch (error) {
      console.error("Failed to fetch demand data:", error);
    } finally {
      setDemandLoading(false);
    }
  }, []);

  const fetchRevenueData = useCallback(async () => {
    setRevenueLoading(true);
    try {
      const supabase = createClient();

      // Fetch all non-cancelled orders
      const { data: orders, error: ordersError } = await supabase
        .from("aura_orders")
        .select("total, purchase_type, dealer_attribution_id, created_at, items")
        .neq("status", "cancelled");

      if (ordersError) throw ordersError;

      const allOrders = orders ?? [];

      // Total revenue
      const totalRevenue = allOrders.reduce((sum, o) => sum + (o.total ?? 0), 0);
      const orderCount = allOrders.length;
      const averageOrderValue = orderCount > 0 ? totalRevenue / orderCount : 0;

      // Orders this month
      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      const ordersThisMonth = allOrders.filter(
        (o) => o.created_at >= monthStart
      ).length;

      // Active subscriptions for MRR
      const { count: activeSubCount } = await supabase
        .from("aura_subscriptions")
        .select("*", { count: "exact", head: true })
        .eq("status", "active");

      // Average subscription price from BOX_CONFIGS: (59.99 + 84.99 + 149.99) / 3 ≈ 98.32
      // More accurate: use actual subscription orders average
      const subOrders = allOrders.filter((o) => o.purchase_type === "subscription");
      const avgSubPrice =
        subOrders.length > 0
          ? subOrders.reduce((s, o) => s + (o.total ?? 0), 0) / subOrders.length
          : 98.32;
      const mrr = (activeSubCount ?? 0) * avgSubPrice;

      setRevenueSummary({ totalRevenue, mrr, averageOrderValue, ordersThisMonth });

      // Revenue by channel
      const subscriptionOrders = allOrders.filter((o) => o.purchase_type === "subscription" && !o.dealer_attribution_id);
      const oneTimeOrders = allOrders.filter((o) => o.purchase_type === "one_time" && !o.dealer_attribution_id);
      const b2bOrders = allOrders.filter((o) => o.dealer_attribution_id != null);

      setRevenueByChannel({
        subscriptionRevenue: subscriptionOrders.reduce((s, o) => s + (o.total ?? 0), 0),
        oneTimeRevenue: oneTimeOrders.reduce((s, o) => s + (o.total ?? 0), 0),
        b2bRevenue: b2bOrders.reduce((s, o) => s + (o.total ?? 0), 0),
        subscriptionCount: subscriptionOrders.length,
        oneTimeCount: oneTimeOrders.length,
        b2bCount: b2bOrders.length,
      });

      // Top products by revenue — parse order items JSON
      const productMap = new Map<string, { name: string; unitsSold: number; revenue: number }>();
      for (const order of allOrders) {
        if (!order.items || !Array.isArray(order.items)) continue;
        for (const item of order.items as Array<{ name?: string; product_name?: string; quantity?: number; price?: number; total?: number }>) {
          const name = item.name || item.product_name || "Unknown Product";
          const qty = item.quantity ?? 1;
          const rev = item.total ?? (item.price ?? 0) * qty;
          const existing = productMap.get(name);
          if (existing) {
            existing.unitsSold += qty;
            existing.revenue += rev;
          } else {
            productMap.set(name, { name, unitsSold: qty, revenue: rev });
          }
        }
      }

      const sorted = Array.from(productMap.values())
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 10);
      setTopProducts(sorted);
    } catch (error) {
      console.error("Failed to fetch revenue data:", error);
    } finally {
      setRevenueLoading(false);
    }
  }, []);

  const fetchConversionData = useCallback(async () => {
    setConversionLoading(true);
    try {
      const supabase = createClient();

      // Run all queries in parallel
      const [
        profilesRes,
        ordersUsersRes,
        totalSubsRes,
        activeSubsRes,
        totalReferralsRes,
        completedReferralsRes,
        totalDealersRes,
        activeDealersRes,
        orgsRes,
      ] = await Promise.all([
        supabase.from("profiles").select("id", { count: "exact", head: true }),
        supabase.from("aura_orders").select("user_id", { count: "exact", head: false }),
        supabase.from("aura_subscriptions").select("id", { count: "exact", head: true }),
        supabase.from("aura_subscriptions").select("id", { count: "exact", head: true }).eq("status", "active"),
        supabase.from("referrals").select("id", { count: "exact", head: true }),
        supabase.from("referrals").select("id", { count: "exact", head: true }).in("status", ["converted", "rewarded"]),
        supabase.from("dealers").select("id", { count: "exact", head: true }),
        supabase.from("dealers").select("id", { count: "exact", head: true }).eq("is_active", true),
        supabase.from("organizations").select("dealer_tier"),
      ]);

      // Count unique users with orders
      const uniqueOrderUsers = new Set(
        (ordersUsersRes.data ?? []).map((o: { user_id: string }) => o.user_id)
      ).size;

      // Count orgs by tier
      const orgsByTier: Record<string, number> = {};
      for (const org of orgsRes.data ?? []) {
        const tier = (org.dealer_tier as string) ?? "Unknown";
        orgsByTier[tier] = (orgsByTier[tier] ?? 0) + 1;
      }

      const totalSignups = profilesRes.count ?? 0;
      const totalSubs = totalSubsRes.count ?? 0;
      const activeSubs = activeSubsRes.count ?? 0;
      const totalRefs = totalReferralsRes.count ?? 0;
      const completedRefs = completedReferralsRes.count ?? 0;
      const totalD = totalDealersRes.count ?? 0;
      const activeD = activeDealersRes.count ?? 0;

      setConversionData({
        signupToOrder: {
          totalSignups,
          usersWithOrders: uniqueOrderUsers,
          rate: totalSignups > 0 ? (uniqueOrderUsers / totalSignups) * 100 : 0,
        },
        subscriptionRetention: {
          totalSubscriptions: totalSubs,
          activeSubscriptions: activeSubs,
          rate: totalSubs > 0 ? (activeSubs / totalSubs) * 100 : 0,
        },
        referralPerformance: {
          totalReferrals: totalRefs,
          completedReferrals: completedRefs,
          rate: totalRefs > 0 ? (completedRefs / totalRefs) * 100 : 0,
        },
        b2bPipeline: {
          totalDealers: totalD,
          activeDealers: activeD,
          activeRate: totalD > 0 ? (activeD / totalD) * 100 : 0,
          orgsByTier,
        },
      });
    } catch (error) {
      console.error("Failed to fetch conversion data:", error);
    } finally {
      setConversionLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchChurnData();
    fetchDemandData();
    fetchRevenueData();
    fetchConversionData();
  }, [fetchChurnData, fetchDemandData, fetchRevenueData, fetchConversionData]);

  // ---------------------------------------------------------------------------
  // Churn detail fetch
  // ---------------------------------------------------------------------------

  async function handleExpandUser(userId: string) {
    if (expandedUserId === userId) {
      setExpandedUserId(null);
      setChurnDetail(null);
      return;
    }

    setExpandedUserId(userId);
    setDetailLoading(true);
    setChurnDetail(null);

    try {
      // Use the churn engine directly via an inline fetch to get detailed factors
      // We create a lightweight endpoint call approach: re-use existing data
      // and compute factors client-side from the score
      const supabase = createClient();

      // Fetch recent orders for this user
      const { data: orders } = await supabase
        .from("aura_orders")
        .select("created_at, total")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(10);

      const { data: subs } = await supabase
        .from("aura_subscriptions")
        .select("status, created_at, pause_until, auto_fill_enabled, box_config")
        .eq("user_id", userId);

      const user = churnUsers.find((u) => u.id === userId);
      const score = user?.churnScore ?? 0;

      // Reconstruct approximate factors from available data
      const now = new Date();
      let daysSinceLastOrder = 0;
      if (orders && orders.length > 0) {
        daysSinceLastOrder = Math.floor(
          (now.getTime() - new Date(orders[0].created_at).getTime()) / (1000 * 60 * 60 * 24)
        );
      }

      const pauseCount = (subs ?? []).filter(
        (s) => s.status === "paused" || s.pause_until !== null
      ).length;

      const avgOrderValue =
        orders && orders.length > 0
          ? orders.reduce((s, o) => s + o.total, 0) / orders.length
          : 0;

      const subscriptionAge =
        subs && subs.length > 0
          ? Math.floor(
              (now.getTime() - new Date(subs[0].created_at).getTime()) / (1000 * 60 * 60 * 24)
            )
          : 0;

      const detail: ChurnDetail = {
        score,
        riskLevel: user?.riskLevel ?? "low",
        factors: {
          daysSinceLastOrder,
          orderFrequencyDecline: 0,
          subscriptionPauseCount: pauseCount,
          supportTicketCount: 0,
          missedSelectionDeadlines: 0,
          averageOrderValue: Math.round(avgOrderValue * 100) / 100,
          orderValueTrend: 0,
          engagementScore: 0,
          subscriptionAge,
        },
        recommendations: getQuickRecommendations(score, user?.riskLevel ?? "low"),
      };

      setChurnDetail(detail);
    } catch (error) {
      console.error("Failed to fetch churn detail:", error);
    } finally {
      setDetailLoading(false);
    }
  }

  function getQuickRecommendations(score: number, riskLevel: string): string[] {
    if (riskLevel === "critical") {
      return [
        "Immediately reach out with a personal phone call and loyalty discount.",
        "Offer a complimentary box upgrade for the next delivery.",
        "Assign a dedicated account manager for personalized attention.",
      ];
    }
    if (riskLevel === "high") {
      return [
        "Send a re-engagement email with a 15% discount code.",
        "Suggest new products based on their taste profile.",
        "Offer flexible delivery schedule options.",
      ];
    }
    if (riskLevel === "medium") {
      return [
        "Send a personalized product recommendation email.",
        "Offer early access to seasonal items.",
        "Invite them to provide feedback through a brief survey.",
      ];
    }
    return ["Continue monitoring engagement levels."];
  }

  // ---------------------------------------------------------------------------
  // Actions
  // ---------------------------------------------------------------------------

  async function handleRecalculate() {
    setRecalculating(true);
    try {
      const res = await fetch("/api/analytics/churn", { method: "POST" });
      if (res.ok) {
        await fetchChurnData();
      }
    } catch (error) {
      console.error("Recalculation failed:", error);
    } finally {
      setRecalculating(false);
    }
  }

  async function handleGenerateReport() {
    setReportGenerating(true);
    setReportResult(null);
    try {
      const res = await fetch("/api/analytics/demand", { method: "POST" });
      if (res.ok) {
        const data = await res.json();
        setReportResult({
          urgentCount: data.report?.urgentReorders?.length ?? 0,
          totalEstimatedCost: data.report?.totalEstimatedCost ?? 0,
          n8nTriggered: data.n8nTriggered ?? false,
        });
      }
    } catch (error) {
      console.error("Report generation failed:", error);
    } finally {
      setReportGenerating(false);
    }
  }

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
          <p className="text-gray-500 mt-1">Revenue, churn prediction, demand forecasting &amp; conversion funnels</p>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-lg w-fit">
        <button
          onClick={() => setActiveTab("churn")}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            activeTab === "churn"
              ? "bg-white text-aura-primary shadow-sm"
              : "text-gray-600 hover:text-gray-900"
          }`}
        >
          Churn Risk
        </button>
        <button
          onClick={() => setActiveTab("revenue")}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            activeTab === "revenue"
              ? "bg-white text-aura-primary shadow-sm"
              : "text-gray-600 hover:text-gray-900"
          }`}
        >
          Revenue
        </button>
        <button
          onClick={() => setActiveTab("demand")}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            activeTab === "demand"
              ? "bg-white text-aura-primary shadow-sm"
              : "text-gray-600 hover:text-gray-900"
          }`}
        >
          Demand Forecast
        </button>
        <button
          onClick={() => setActiveTab("conversions")}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            activeTab === "conversions"
              ? "bg-white text-aura-primary shadow-sm"
              : "text-gray-600 hover:text-gray-900"
          }`}
        >
          Conversions
        </button>
      </div>

      {/* ================================================================= */}
      {/* CHURN RISK SECTION                                                 */}
      {/* ================================================================= */}
      {activeTab === "churn" && (
        <div className="space-y-6">
          {churnLoading ? (
            <div className="flex justify-center py-12">
              <RefreshCcw className="w-6 h-6 animate-spin text-gray-400" />
            </div>
          ) : (
            <>
              {/* Summary Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                <StatCard
                  label="Total Subscribers"
                  value={churnSummary?.total ?? 0}
                  icon={Users}
                  color="text-blue-600"
                  bgColor="bg-blue-50"
                />
                <StatCard
                  label="Low Risk"
                  value={churnSummary?.low ?? 0}
                  icon={TrendingUp}
                  color="text-green-600"
                  bgColor="bg-green-50"
                />
                <StatCard
                  label="Medium Risk"
                  value={churnSummary?.medium ?? 0}
                  icon={TrendingDown}
                  color="text-yellow-600"
                  bgColor="bg-yellow-50"
                />
                <StatCard
                  label="High Risk"
                  value={churnSummary?.high ?? 0}
                  icon={AlertTriangle}
                  color="text-orange-600"
                  bgColor="bg-orange-50"
                />
                <StatCard
                  label="Critical Risk"
                  value={churnSummary?.critical ?? 0}
                  icon={ShieldAlert}
                  color="text-red-600"
                  bgColor="bg-red-50"
                />
              </div>

              {/* Risk Distribution */}
              {churnSummary && (
                <Card padding="md">
                  <h3 className="text-sm font-medium text-gray-700 mb-3">
                    Risk Distribution
                  </h3>
                  <RiskDistributionBar summary={churnSummary} />
                </Card>
              )}

              {/* Actions */}
              <div className="flex justify-end">
                <Button
                  onClick={handleRecalculate}
                  isLoading={recalculating}
                  variant="outline"
                  size="sm"
                  leftIcon={<RefreshCcw className="w-4 h-4" />}
                >
                  Recalculate Scores
                </Button>
              </div>

              {/* At-Risk Customer Table */}
              <Card padding="none">
                <div className="px-6 py-4 border-b border-gray-100">
                  <h3 className="text-lg font-semibold text-gray-900">
                    At-Risk Subscribers
                  </h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50 text-left text-gray-500">
                        <th className="px-6 py-3 font-medium">Customer</th>
                        <th className="px-6 py-3 font-medium">Score</th>
                        <th className="px-6 py-3 font-medium">Risk Level</th>
                        <th className="px-6 py-3 font-medium">Subscription</th>
                        <th className="px-6 py-3 font-medium">Next Delivery</th>
                        <th className="px-6 py-3 font-medium w-10" />
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {churnUsers.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="px-6 py-8 text-center text-gray-400">
                            No churn data available. Click &quot;Recalculate Scores&quot; to generate.
                          </td>
                        </tr>
                      ) : (
                        churnUsers.map((user) => (
                          <ChurnUserRow
                            key={user.id}
                            user={user}
                            isExpanded={expandedUserId === user.id}
                            detail={expandedUserId === user.id ? churnDetail : null}
                            detailLoading={expandedUserId === user.id && detailLoading}
                            onToggle={() => handleExpandUser(user.id)}
                          />
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </Card>
            </>
          )}
        </div>
      )}

      {/* ================================================================= */}
      {/* REVENUE SECTION                                                    */}
      {/* ================================================================= */}
      {activeTab === "revenue" && (
        <div className="space-y-6">
          {revenueLoading ? (
            <div className="flex justify-center py-12">
              <RefreshCcw className="w-6 h-6 animate-spin text-gray-400" />
            </div>
          ) : (
            <>
              {/* Summary Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                  label="Total Revenue"
                  value={`$${(revenueSummary?.totalRevenue ?? 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                  icon={DollarSign}
                  color="text-green-600"
                  bgColor="bg-green-50"
                />
                <StatCard
                  label="Monthly Recurring Revenue"
                  value={`$${(revenueSummary?.mrr ?? 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                  icon={CreditCard}
                  color="text-blue-600"
                  bgColor="bg-blue-50"
                />
                <StatCard
                  label="Avg Order Value"
                  value={`$${(revenueSummary?.averageOrderValue ?? 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                  icon={ShoppingCart}
                  color="text-purple-600"
                  bgColor="bg-purple-50"
                />
                <StatCard
                  label="Orders This Month"
                  value={revenueSummary?.ordersThisMonth ?? 0}
                  icon={CalendarDays}
                  color="text-amber-600"
                  bgColor="bg-amber-50"
                />
              </div>

              {/* Revenue by Channel */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Revenue by Channel</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <Card padding="md" className="space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 rounded-lg bg-indigo-50">
                        <Repeat className="w-5 h-5 text-indigo-600" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">B2C Subscription</p>
                        <p className="text-xl font-bold text-gray-900">
                          ${(revenueByChannel?.subscriptionRevenue ?? 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </p>
                      </div>
                    </div>
                    <p className="text-xs text-gray-500">
                      {revenueByChannel?.subscriptionCount ?? 0} orders
                    </p>
                  </Card>

                  <Card padding="md" className="space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 rounded-lg bg-emerald-50">
                        <Store className="w-5 h-5 text-emerald-600" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">B2C One-Time</p>
                        <p className="text-xl font-bold text-gray-900">
                          ${(revenueByChannel?.oneTimeRevenue ?? 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </p>
                      </div>
                    </div>
                    <p className="text-xs text-gray-500">
                      {revenueByChannel?.oneTimeCount ?? 0} orders
                    </p>
                  </Card>

                  <Card padding="md" className="space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 rounded-lg bg-orange-50">
                        <Handshake className="w-5 h-5 text-orange-600" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">B2B / Dealer</p>
                        <p className="text-xl font-bold text-gray-900">
                          ${(revenueByChannel?.b2bRevenue ?? 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </p>
                      </div>
                    </div>
                    <p className="text-xs text-gray-500">
                      {revenueByChannel?.b2bCount ?? 0} orders
                    </p>
                  </Card>
                </div>
              </div>

              {/* Revenue Breakdown Bar */}
              {revenueByChannel && (revenueSummary?.totalRevenue ?? 0) > 0 && (
                <Card padding="md">
                  <h3 className="text-sm font-medium text-gray-700 mb-3">
                    Revenue Distribution
                  </h3>
                  <div className="space-y-2">
                    <div className="flex h-6 rounded-full overflow-hidden bg-gray-100">
                      {[
                        { label: "Subscription", value: revenueByChannel.subscriptionRevenue, color: "bg-indigo-500" },
                        { label: "One-Time", value: revenueByChannel.oneTimeRevenue, color: "bg-emerald-500" },
                        { label: "B2B", value: revenueByChannel.b2bRevenue, color: "bg-orange-500" },
                      ].map((seg) => {
                        const pct = (seg.value / (revenueSummary?.totalRevenue ?? 1)) * 100;
                        if (pct === 0) return null;
                        return (
                          <div
                            key={seg.label}
                            className={`${seg.color} transition-all duration-500`}
                            style={{ width: `${pct}%` }}
                            title={`${seg.label}: $${seg.value.toLocaleString("en-US", { minimumFractionDigits: 2 })} (${Math.round(pct)}%)`}
                          />
                        );
                      })}
                    </div>
                    <div className="flex justify-between text-xs text-gray-500">
                      {[
                        { label: "Subscription", color: "bg-indigo-500", value: revenueByChannel.subscriptionRevenue },
                        { label: "One-Time", color: "bg-emerald-500", value: revenueByChannel.oneTimeRevenue },
                        { label: "B2B", color: "bg-orange-500", value: revenueByChannel.b2bRevenue },
                      ].map((seg) => (
                        <div key={seg.label} className="flex items-center gap-1">
                          <div className={`w-2.5 h-2.5 rounded-full ${seg.color}`} />
                          <span>
                            {seg.label}: {Math.round((seg.value / (revenueSummary?.totalRevenue ?? 1)) * 100)}%
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </Card>
              )}

              {/* Top Products Table */}
              <Card padding="none">
                <div className="px-6 py-4 border-b border-gray-100">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Top Products by Revenue
                  </h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50 text-left text-gray-500">
                        <th className="px-6 py-3 font-medium">#</th>
                        <th className="px-6 py-3 font-medium">Product</th>
                        <th className="px-6 py-3 font-medium text-right">Units Sold</th>
                        <th className="px-6 py-3 font-medium text-right">Revenue</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {topProducts.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="px-6 py-8 text-center text-gray-400">
                            No product revenue data available.
                          </td>
                        </tr>
                      ) : (
                        topProducts.map((product, idx) => (
                          <tr key={product.name} className="hover:bg-gray-50 transition-colors">
                            <td className="px-6 py-3 text-gray-400 tabular-nums">{idx + 1}</td>
                            <td className="px-6 py-3 font-medium text-gray-900">{product.name}</td>
                            <td className="px-6 py-3 text-right tabular-nums text-gray-700">
                              {product.unitsSold.toLocaleString()}
                            </td>
                            <td className="px-6 py-3 text-right tabular-nums font-medium text-gray-900">
                              ${product.revenue.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </Card>
            </>
          )}
        </div>
      )}

      {/* ================================================================= */}
      {/* DEMAND FORECAST SECTION                                            */}
      {/* ================================================================= */}
      {activeTab === "demand" && (
        <div className="space-y-6">
          {demandLoading ? (
            <div className="flex justify-center py-12">
              <RefreshCcw className="w-6 h-6 animate-spin text-gray-400" />
            </div>
          ) : (
            <>
              {/* Summary Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                  label="Below Safety Stock"
                  value={demandSummary?.belowSafetyStock ?? 0}
                  icon={ShieldAlert}
                  color="text-red-600"
                  bgColor="bg-red-50"
                />
                <StatCard
                  label="Reorder Soon"
                  value={demandSummary?.reorderSoon ?? 0}
                  icon={AlertTriangle}
                  color="text-amber-600"
                  bgColor="bg-amber-50"
                />
                <StatCard
                  label="Stable"
                  value={demandSummary?.stable ?? 0}
                  icon={Package}
                  color="text-green-600"
                  bgColor="bg-green-50"
                />
                <StatCard
                  label="Avg Days to Stockout"
                  value={
                    demandSummary
                      ? demandSummary.avgDaysToStockout > 999
                        ? "999+"
                        : demandSummary.avgDaysToStockout
                      : 0
                  }
                  icon={TrendingUp}
                  color="text-blue-600"
                  bgColor="bg-blue-50"
                />
              </div>

              {/* Actions */}
              <div className="flex gap-3 justify-end">
                <Button
                  onClick={handleGenerateReport}
                  isLoading={reportGenerating}
                  variant="outline"
                  size="sm"
                  leftIcon={<RefreshCcw className="w-4 h-4" />}
                >
                  Generate Reorder Report
                </Button>
                {reportResult && reportResult.urgentCount > 0 && (
                  <Button
                    onClick={handleGenerateReport}
                    variant="primary"
                    size="sm"
                    leftIcon={<Send className="w-4 h-4" />}
                  >
                    Send to Suzazon
                  </Button>
                )}
              </div>

              {/* Report Preview */}
              {reportResult && (
                <Card padding="md" className="border border-blue-200 bg-blue-50">
                  <h4 className="text-sm font-medium text-blue-900 mb-2">
                    Reorder Report Generated
                  </h4>
                  <div className="text-sm text-blue-800 space-y-1">
                    <p>
                      Urgent items: <strong>{reportResult.urgentCount}</strong>
                    </p>
                    <p>
                      Estimated cost:{" "}
                      <strong>
                        ${reportResult.totalEstimatedCost.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                      </strong>
                    </p>
                    <p>
                      n8n workflow triggered:{" "}
                      <strong>{reportResult.n8nTriggered ? "Yes" : "No"}</strong>
                    </p>
                  </div>
                </Card>
              )}

              {/* Forecast Table */}
              <Card padding="none">
                <div className="px-6 py-4 border-b border-gray-100">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Product Demand Forecast
                  </h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50 text-left text-gray-500">
                        <th className="px-6 py-3 font-medium">Product</th>
                        <th className="px-6 py-3 font-medium text-right">Stock</th>
                        <th className="px-6 py-3 font-medium text-right">Safety</th>
                        <th className="px-6 py-3 font-medium text-right">Daily Demand</th>
                        <th className="px-6 py-3 font-medium text-center">Trend</th>
                        <th className="px-6 py-3 font-medium text-right">Days to Stockout</th>
                        <th className="px-6 py-3 font-medium">Reorder By</th>
                        <th className="px-6 py-3 font-medium text-right">Reorder Qty</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {forecasts.length === 0 ? (
                        <tr>
                          <td colSpan={8} className="px-6 py-8 text-center text-gray-400">
                            No forecast data available.
                          </td>
                        </tr>
                      ) : (
                        forecasts.map((f) => (
                          <tr
                            key={f.productId}
                            className={StockStatusColor(
                              f.daysUntilStockout,
                              f.currentStock,
                              f.safetyStock
                            )}
                          >
                            <td className="px-6 py-3 font-medium text-gray-900">
                              {f.productName}
                            </td>
                            <td className="px-6 py-3 text-right tabular-nums">
                              {f.currentStock}
                            </td>
                            <td className="px-6 py-3 text-right tabular-nums text-gray-500">
                              {f.safetyStock}
                            </td>
                            <td className="px-6 py-3 text-right tabular-nums">
                              {f.averageDailyDemand.toFixed(1)}
                            </td>
                            <td className="px-6 py-3 text-center">
                              <TrendIcon trend={f.demandTrend} />
                            </td>
                            <td className="px-6 py-3 text-right tabular-nums">
                              <span
                                className={
                                  f.daysUntilStockout <= 7
                                    ? "text-red-700 font-bold"
                                    : f.daysUntilStockout <= 30
                                      ? "text-amber-700 font-medium"
                                      : "text-gray-700"
                                }
                              >
                                {f.daysUntilStockout > 9998 ? "999+" : f.daysUntilStockout}
                              </span>
                            </td>
                            <td className="px-6 py-3 text-gray-600">
                              {f.recommendedReorderDate}
                            </td>
                            <td className="px-6 py-3 text-right tabular-nums font-medium">
                              {f.recommendedReorderQuantity}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </Card>
            </>
          )}
        </div>
      )}

      {/* ================================================================= */}
      {/* CONVERSIONS SECTION                                                */}
      {/* ================================================================= */}
      {activeTab === "conversions" && (
        <div className="space-y-6">
          {conversionLoading ? (
            <div className="flex justify-center py-12">
              <RefreshCcw className="w-6 h-6 animate-spin text-gray-400" />
            </div>
          ) : conversionData ? (
            <>
              {/* Summary Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                  label="Total Signups"
                  value={conversionData.signupToOrder.totalSignups.toLocaleString()}
                  icon={UserPlus}
                  color="text-blue-600"
                  bgColor="bg-blue-50"
                />
                <StatCard
                  label="Users with Orders"
                  value={conversionData.signupToOrder.usersWithOrders.toLocaleString()}
                  icon={ArrowRightLeft}
                  color="text-green-600"
                  bgColor="bg-green-50"
                />
                <StatCard
                  label="Active Subscriptions"
                  value={conversionData.subscriptionRetention.activeSubscriptions.toLocaleString()}
                  icon={Repeat}
                  color="text-purple-600"
                  bgColor="bg-purple-50"
                />
                <StatCard
                  label="Active Dealers"
                  value={conversionData.b2bPipeline.activeDealers.toLocaleString()}
                  icon={Building2}
                  color="text-indigo-600"
                  bgColor="bg-indigo-50"
                />
              </div>

              {/* Conversion Funnels */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <ConversionBar
                  label="Signup → First Order"
                  numerator={conversionData.signupToOrder.usersWithOrders}
                  denominator={conversionData.signupToOrder.totalSignups}
                  icon={UserPlus}
                />
                <ConversionBar
                  label="Subscription Retention"
                  numerator={conversionData.subscriptionRetention.activeSubscriptions}
                  denominator={conversionData.subscriptionRetention.totalSubscriptions}
                  icon={Repeat}
                />
                <ConversionBar
                  label="Referral Conversion"
                  numerator={conversionData.referralPerformance.completedReferrals}
                  denominator={conversionData.referralPerformance.totalReferrals}
                  icon={Share2}
                />
                <ConversionBar
                  label="Dealer Activation"
                  numerator={conversionData.b2bPipeline.activeDealers}
                  denominator={conversionData.b2bPipeline.totalDealers}
                  icon={Building2}
                />
              </div>

              {/* B2B Organizations by Tier */}
              <Card padding="md">
                <h3 className="text-sm font-medium text-gray-700 mb-4">
                  Organizations by Tier
                </h3>
                {Object.keys(conversionData.b2bPipeline.orgsByTier).length === 0 ? (
                  <p className="text-sm text-gray-400">No organizations yet.</p>
                ) : (
                  <div className="flex flex-wrap gap-3">
                    {Object.entries(conversionData.b2bPipeline.orgsByTier)
                      .sort(([a], [b]) => {
                        const order = ["Platinum", "Gold", "Silver", "Bronze"];
                        return (order.indexOf(a) === -1 ? 99 : order.indexOf(a)) -
                               (order.indexOf(b) === -1 ? 99 : order.indexOf(b));
                      })
                      .map(([tier, count]) => (
                        <TierBadge key={tier} tier={tier} count={count} />
                      ))}
                  </div>
                )}
              </Card>

              {/* Refresh */}
              <div className="flex justify-end">
                <Button
                  onClick={fetchConversionData}
                  variant="outline"
                  size="sm"
                  leftIcon={<RefreshCcw className="w-4 h-4" />}
                >
                  Refresh Data
                </Button>
              </div>
            </>
          ) : (
            <Card padding="md">
              <p className="text-center text-gray-400 py-8">
                Failed to load conversion data. Please try again.
              </p>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Churn User Row (with expandable detail)
// ---------------------------------------------------------------------------

function ChurnUserRow({
  user,
  isExpanded,
  detail,
  detailLoading,
  onToggle,
}: {
  user: ChurnUser;
  isExpanded: boolean;
  detail: ChurnDetail | null;
  detailLoading: boolean;
  onToggle: () => void;
}) {
  return (
    <>
      <tr
        className="hover:bg-gray-50 cursor-pointer transition-colors"
        onClick={onToggle}
      >
        <td className="px-6 py-3">
          <div>
            <p className="font-medium text-gray-900">
              {user.fullName ?? "No Name"}
            </p>
            <p className="text-xs text-gray-500">{user.email}</p>
          </div>
        </td>
        <td className="px-6 py-3 tabular-nums font-mono text-sm">
          {user.churnScore.toFixed(2)}
        </td>
        <td className="px-6 py-3">
          <RiskBadge level={user.riskLevel} />
        </td>
        <td className="px-6 py-3 text-gray-600">
          {user.subscription
            ? `${user.subscription.box_size} (${user.subscription.status})`
            : "--"}
        </td>
        <td className="px-6 py-3 text-gray-600">
          {user.subscription?.next_delivery_date
            ? new Date(user.subscription.next_delivery_date).toLocaleDateString()
            : "--"}
        </td>
        <td className="px-6 py-3">
          {isExpanded ? (
            <ChevronUp className="w-4 h-4 text-gray-400" />
          ) : (
            <ChevronDown className="w-4 h-4 text-gray-400" />
          )}
        </td>
      </tr>
      {isExpanded && (
        <tr>
          <td colSpan={6} className="bg-gray-50 px-6 py-4">
            {detailLoading ? (
              <div className="flex items-center gap-2 text-gray-400 text-sm">
                <RefreshCcw className="w-4 h-4 animate-spin" />
                Loading details...
              </div>
            ) : detail ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Factors */}
                <div>
                  <h4 className="text-sm font-semibold text-gray-700 mb-3">
                    Risk Factors
                  </h4>
                  <dl className="space-y-2 text-sm">
                    <FactorRow
                      label="Days since last order"
                      value={detail.factors.daysSinceLastOrder.toString()}
                    />
                    <FactorRow
                      label="Order frequency decline"
                      value={`${detail.factors.orderFrequencyDecline}%`}
                    />
                    <FactorRow
                      label="Subscription pauses"
                      value={detail.factors.subscriptionPauseCount.toString()}
                    />
                    <FactorRow
                      label="Support tickets (30d)"
                      value={detail.factors.supportTicketCount.toString()}
                    />
                    <FactorRow
                      label="Missed deadlines"
                      value={detail.factors.missedSelectionDeadlines.toString()}
                    />
                    <FactorRow
                      label="Avg order value"
                      value={`$${detail.factors.averageOrderValue.toFixed(2)}`}
                    />
                    <FactorRow
                      label="Order value trend"
                      value={`${detail.factors.orderValueTrend > 0 ? "+" : ""}${detail.factors.orderValueTrend}%`}
                    />
                    <FactorRow
                      label="Engagement score"
                      value={detail.factors.engagementScore.toFixed(2)}
                    />
                    <FactorRow
                      label="Subscription age"
                      value={`${detail.factors.subscriptionAge} days`}
                    />
                  </dl>
                </div>

                {/* Recommendations */}
                <div>
                  <h4 className="text-sm font-semibold text-gray-700 mb-3">
                    Recommended Actions
                  </h4>
                  <ul className="space-y-2">
                    {detail.recommendations.map((rec, i) => (
                      <li
                        key={i}
                        className="flex gap-2 text-sm text-gray-700 bg-white p-3 rounded-lg border border-gray-200"
                      >
                        <span className="text-aura-primary font-bold shrink-0">
                          {i + 1}.
                        </span>
                        {rec}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ) : (
              <p className="text-sm text-gray-400">No detail available.</p>
            )}
          </td>
        </tr>
      )}
    </>
  );
}

function FactorRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <dt className="text-gray-500">{label}</dt>
      <dd className="font-medium text-gray-900">{value}</dd>
    </div>
  );
}
