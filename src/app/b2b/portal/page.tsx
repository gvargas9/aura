"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/hooks";
import { Card, Button } from "@/components/ui";
import { formatCurrency, formatDate } from "@/lib/utils";
import {
  DollarSign,
  Package,
  TrendingUp,
  Clock,
  QrCode,
  Copy,
  Check,
  ExternalLink,
  ArrowUpRight,
  Loader2,
  LinkIcon,
  ShoppingBag,
  ShoppingCart,
  BarChart3,
  FileText,
  RefreshCw,
  Zap,
  Star,
  ChevronRight,
} from "lucide-react";
import Link from "next/link";
import type { Dealer, Organization, Order } from "@/types";

interface CommissionTransaction {
  id: string;
  dealer_id: string;
  order_id: string | null;
  amount: number;
  type: "earned" | "paid" | "adjustment";
  status: string;
  stripe_payout_id: string | null;
  notes: string | null;
  created_at: string;
}

const TIER_CONFIG: Record<
  string,
  { label: string; color: string; bg: string; border: string; nextTier: string | null; threshold: number }
> = {
  bronze: {
    label: "Bronze",
    color: "text-amber-700",
    bg: "bg-amber-50",
    border: "border-amber-200",
    nextTier: "Silver",
    threshold: 5000,
  },
  silver: {
    label: "Silver",
    color: "text-slate-600",
    bg: "bg-slate-100",
    border: "border-slate-300",
    nextTier: "Gold",
    threshold: 15000,
  },
  gold: {
    label: "Gold",
    color: "text-yellow-700",
    bg: "bg-yellow-50",
    border: "border-yellow-300",
    nextTier: "Platinum",
    threshold: 50000,
  },
  platinum: {
    label: "Platinum",
    color: "text-indigo-700",
    bg: "bg-indigo-50",
    border: "border-indigo-200",
    nextTier: null,
    threshold: 100000,
  },
};

export default function DealerPortalPage() {
  const { user, profile } = useAuth();
  const [dealer, setDealer] = useState<Dealer | null>(null);
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [commissionHistory, setCommissionHistory] = useState<CommissionTransaction[]>([]);
  const [totalOrders, setTotalOrders] = useState(0);
  const [monthlyEarnings, setMonthlyEarnings] = useState<{ month: string; amount: number }[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  const supabase = createClient();

  const fetchData = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);

    const { data: dealerData } = await supabase
      .from("dealers")
      .select("*")
      .eq("profile_id", user.id)
      .maybeSingle();

    if (!dealerData) {
      setIsLoading(false);
      return;
    }

    setDealer(dealerData as Dealer);

    const dealerId = dealerData.id;
    const orgId = dealerData.organization_id;

    const [orgResult, ordersResult, countResult, commissionResult] =
      await Promise.all([
        orgId
          ? supabase.from("organizations").select("*").eq("id", orgId).single()
          : Promise.resolve({ data: null }),
        supabase
          .from("aura_orders")
          .select("*")
          .eq("dealer_attribution_id", dealerId)
          .order("created_at", { ascending: false })
          .limit(5),
        supabase
          .from("aura_orders")
          .select("*", { count: "exact", head: true })
          .eq("dealer_attribution_id", dealerId),
        supabase
          .from("commission_transactions")
          .select("*")
          .eq("dealer_id", dealerId)
          .order("created_at", { ascending: false })
          .limit(10),
      ]);

    if (orgResult.data) setOrganization(orgResult.data as Organization);
    if (ordersResult.data) setRecentOrders(ordersResult.data as Order[]);
    if (countResult.count !== null) setTotalOrders(countResult.count);
    if (commissionResult.data)
      setCommissionHistory(commissionResult.data as CommissionTransaction[]);

    // Build monthly earnings from commission transactions (last 6 months)
    const allCommissions = commissionResult.data as CommissionTransaction[] || [];
    const monthMap = new Map<string, number>();
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = d.toLocaleDateString("en-US", { month: "short", year: "2-digit" });
      monthMap.set(key, 0);
    }
    allCommissions.forEach((tx) => {
      if (tx.type === "earned") {
        const d = new Date(tx.created_at);
        const key = d.toLocaleDateString("en-US", { month: "short", year: "2-digit" });
        if (monthMap.has(key)) {
          monthMap.set(key, (monthMap.get(key) || 0) + tx.amount);
        }
      }
    });
    setMonthlyEarnings(
      Array.from(monthMap.entries()).map(([month, amount]) => ({ month, amount }))
    );

    setIsLoading(false);
  }, [user, supabase]);

  useEffect(() => {
    if (user && (profile?.role === "dealer" || profile?.role === "admin")) {
      fetchData();
    } else if (user && profile) {
      setIsLoading(false);
    }
  }, [user, profile, fetchData]);

  const appUrl = typeof window !== "undefined" ? window.location.origin : "";
  const referralLink = dealer ? `${appUrl}/ref/${dealer.referral_code}` : "";

  const copyReferralLink = async () => {
    if (!referralLink) return;
    try {
      await navigator.clipboard.writeText(referralLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const textarea = document.createElement("textarea");
      textarea.value = referralLink;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleReorder = (order: Order) => {
    const items = order.items as unknown as Array<{
      productId: string;
      sku: string;
      name: string;
      quantity: number;
      price: number;
      retailPrice?: number;
      image?: string | null;
    }>;
    if (!items || items.length === 0) return;
    const cartItems = items.map((item) => ({
      productId: item.productId,
      sku: item.sku || "",
      name: item.name,
      quantity: item.quantity,
      price: item.price,
      retailPrice: item.retailPrice || item.price,
      image: item.image || null,
    }));
    localStorage.setItem("aura_b2b_cart", JSON.stringify(cartItems));
    window.location.href = "/b2b/portal/orders";
  };

  const commissionPaid = dealer?.commission_paid ?? 0;
  const commissionEarned = dealer?.commission_earned ?? 0;
  const commissionPending = dealer?.commission_pending ?? 0;
  const availableBalance = commissionEarned - commissionPaid;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!dealer) {
    return (
      <div className="text-center py-20">
        <ShoppingBag className="w-12 h-12 text-slate-300 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-slate-900 mb-2">
          No Dealer Account Found
        </h2>
        <p className="text-slate-500 mb-6">
          Your dealer profile hasn&apos;t been set up yet. Please contact
          support.
        </p>
        <a href="mailto:partnerships@aura.com">
          <Button
            variant="primary"
            className="bg-blue-600 hover:bg-blue-700 focus:ring-blue-600"
          >
            Contact Support
          </Button>
        </a>
      </div>
    );
  }

  const tier = organization?.dealer_tier || "bronze";
  const tierConfig = TIER_CONFIG[tier] || TIER_CONFIG.bronze;
  const maxEarning = Math.max(...monthlyEarnings.map((m) => m.amount), 1);

  const statusColor = (status: string) => {
    switch (status) {
      case "delivered":
        return "bg-emerald-100 text-emerald-700";
      case "shipped":
        return "bg-blue-100 text-blue-700";
      case "processing":
        return "bg-amber-100 text-amber-700";
      case "cancelled":
        return "bg-red-100 text-red-700";
      default:
        return "bg-slate-100 text-slate-700";
    }
  };

  return (
    <div>
      {/* Welcome Header with Tier Badge */}
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-slate-900">
              Welcome back, {profile?.full_name?.split(" ")[0] || "Partner"}
            </h1>
            <div className="flex items-center gap-2 mt-1.5">
              {organization && (
                <span className="text-slate-500">{organization.name}</span>
              )}
              {organization && (
                <span
                  className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold capitalize border ${tierConfig.color} ${tierConfig.bg} ${tierConfig.border}`}
                >
                  <Star className="w-3 h-3" />
                  {tierConfig.label}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Commission Stats — 4 cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card padding="md" className="border border-slate-200 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <DollarSign className="w-5 h-5 text-emerald-600" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-slate-500 font-medium">Total Earned</p>
              <p className="text-lg lg:text-xl font-bold text-slate-900 truncate">
                {formatCurrency(commissionEarned)}
              </p>
            </div>
          </div>
        </Card>

        <Card padding="md" className="border border-slate-200 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <Clock className="w-5 h-5 text-amber-600" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-slate-500 font-medium">Pending</p>
              <p className="text-lg lg:text-xl font-bold text-slate-900 truncate">
                {formatCurrency(commissionPending > 0 ? commissionPending : 0)}
              </p>
            </div>
          </div>
        </Card>

        <Card padding="md" className="border border-slate-200 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <TrendingUp className="w-5 h-5 text-blue-600" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-slate-500 font-medium">Paid Out</p>
              <p className="text-lg lg:text-xl font-bold text-slate-900 truncate">
                {formatCurrency(commissionPaid)}
              </p>
            </div>
          </div>
        </Card>

        <Card padding="md" className="border border-slate-200 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <Zap className="w-5 h-5 text-purple-600" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-slate-500 font-medium">Available Balance</p>
              <p className="text-lg lg:text-xl font-bold text-slate-900 truncate">
                {formatCurrency(availableBalance > 0 ? availableBalance : 0)}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Tier Progress Bar */}
      {organization && tierConfig.nextTier && (
        <Card padding="md" className="border border-slate-200 shadow-sm mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
            <div className="flex items-center gap-2">
              <span
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-bold capitalize border ${tierConfig.color} ${tierConfig.bg} ${tierConfig.border}`}
              >
                <Star className="w-3 h-3" />
                {tierConfig.label}
              </span>
              <ChevronRight className="w-4 h-4 text-slate-400" />
              <span className="text-sm font-medium text-slate-600">
                {tierConfig.nextTier}
              </span>
            </div>
            <p className="text-sm text-slate-500">
              {formatCurrency(commissionEarned)} / {formatCurrency(tierConfig.threshold)} to{" "}
              {tierConfig.nextTier}
            </p>
          </div>
          <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-blue-500 to-blue-600 transition-all duration-500"
              style={{
                width: `${Math.min(100, (commissionEarned / tierConfig.threshold) * 100)}%`,
              }}
            />
          </div>
          <p className="text-xs text-slate-400 mt-2">
            {formatCurrency(Math.max(0, tierConfig.threshold - commissionEarned))} more to
            unlock {tierConfig.nextTier} benefits
          </p>
        </Card>
      )}

      {/* Monthly Earnings Chart + Quick Reorder */}
      <div className="grid lg:grid-cols-2 gap-6 mb-8">
        {/* Monthly Earnings Chart (CSS only) */}
        <Card padding="lg" className="border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-semibold text-slate-900">
              Monthly Earnings
            </h2>
            <BarChart3 className="w-5 h-5 text-slate-400" />
          </div>
          <div className="flex items-end gap-2 h-40">
            {monthlyEarnings.map((item) => (
              <div
                key={item.month}
                className="flex-1 flex flex-col items-center gap-1"
              >
                <span className="text-xs font-medium text-slate-600 tabular-nums">
                  {item.amount > 0 ? `$${Math.round(item.amount)}` : ""}
                </span>
                <div
                  className="w-full rounded-t-md bg-gradient-to-t from-blue-600 to-blue-400 transition-all duration-500 min-h-[4px]"
                  style={{
                    height: `${Math.max(4, (item.amount / maxEarning) * 120)}px`,
                  }}
                />
                <span className="text-xs text-slate-400">{item.month}</span>
              </div>
            ))}
          </div>
        </Card>

        {/* Quick Reorder */}
        <Card padding="lg" className="border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-semibold text-slate-900">
              Quick Reorder
            </h2>
            <RefreshCw className="w-5 h-5 text-slate-400" />
          </div>
          {recentOrders.length > 0 ? (
            <div className="space-y-3">
              {recentOrders.slice(0, 3).map((order) => {
                const items =
                  (order.items as unknown as Array<{ name: string }>) || [];
                const itemCount = items.length;
                return (
                  <div
                    key={order.id}
                    className="flex items-center justify-between p-3 rounded-lg border border-slate-100 hover:border-slate-200 hover:bg-slate-50/50 transition-all"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-slate-900">
                        {order.order_number || `#${order.id.slice(0, 8)}`}
                      </p>
                      <p className="text-xs text-slate-500">
                        {itemCount} item{itemCount !== 1 ? "s" : ""} &middot;{" "}
                        {formatCurrency(order.total)} &middot;{" "}
                        {formatDate(order.created_at)}
                      </p>
                    </div>
                    <button
                      onClick={() => handleReorder(order)}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-blue-700 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors flex-shrink-0"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      Reorder
                    </button>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8">
              <Package className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="text-sm text-slate-500">No recent orders to reorder.</p>
            </div>
          )}
        </Card>
      </div>

      {/* Referral Link Section */}
      <Card
        padding="lg"
        className="border border-blue-200 bg-blue-50/50 shadow-sm mb-8"
      >
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="flex items-center gap-3 flex-shrink-0">
            <div className="w-11 h-11 rounded-lg bg-blue-600 flex items-center justify-center">
              <QrCode className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900">Your Referral Link</h3>
              <p className="text-sm text-slate-500">
                Share with customers to earn commissions
              </p>
            </div>
          </div>
          <div className="flex-1 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="flex-1 bg-white rounded-lg border border-slate-200 px-4 py-2.5 flex items-center gap-2 min-w-0">
              <LinkIcon className="w-4 h-4 text-slate-400 flex-shrink-0" />
              <code className="text-sm text-slate-700 truncate font-mono">
                {referralLink}
              </code>
            </div>
            <Button
              variant="primary"
              size="md"
              className="bg-blue-600 hover:bg-blue-700 focus:ring-blue-600 flex-shrink-0"
              onClick={copyReferralLink}
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 mr-1.5" />
                  Copied
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 mr-1.5" />
                  Copy Link
                </>
              )}
            </Button>
          </div>
        </div>
        <div className="mt-3 flex items-center gap-2 text-xs text-slate-500">
          <span className="font-medium">Referral Code:</span>
          <span className="font-mono bg-white px-2 py-0.5 rounded border border-slate-200">
            {dealer.referral_code}
          </span>
          {organization && (
            <>
              <span className="mx-1">|</span>
              <span>
                Commission rate:{" "}
                {(organization.commission_rate * 100).toFixed(0)}%
              </span>
            </>
          )}
        </div>
      </Card>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Recent Activity Feed */}
        <div className="lg:col-span-2">
          <Card padding="lg" className="border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-semibold text-slate-900">
                Recent Activity
              </h2>
              <Link
                href="/b2b/portal/orders"
                className="text-sm font-medium text-blue-600 hover:text-blue-700 flex items-center gap-1"
              >
                View all
                <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {recentOrders.length > 0 || commissionHistory.length > 0 ? (
              <div className="space-y-3">
                {/* Interleave orders and commissions by date */}
                {[
                  ...recentOrders.map((o) => ({
                    type: "order" as const,
                    date: o.created_at,
                    data: o,
                  })),
                  ...commissionHistory.slice(0, 5).map((c) => ({
                    type: "commission" as const,
                    date: c.created_at,
                    data: c,
                  })),
                ]
                  .sort(
                    (a, b) =>
                      new Date(b.date).getTime() - new Date(a.date).getTime()
                  )
                  .slice(0, 8)
                  .map((item, idx) => (
                    <div
                      key={`${item.type}-${idx}`}
                      className="flex items-center gap-3 py-2.5 border-b border-slate-50 last:border-0"
                    >
                      {item.type === "order" ? (
                        <>
                          <div
                            className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${statusColor(
                              (item.data as Order).status
                            )}`}
                          >
                            <Package className="w-4 h-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-slate-900">
                              Order{" "}
                              {(item.data as Order).order_number ||
                                `#${(item.data as Order).id.slice(0, 8)}`}
                            </p>
                            <p className="text-xs text-slate-500">
                              {formatDate((item.data as Order).created_at)}{" "}
                              &middot;{" "}
                              <span className="capitalize">
                                {(item.data as Order).status}
                              </span>
                            </p>
                          </div>
                          <span className="text-sm font-semibold text-slate-900">
                            {formatCurrency((item.data as Order).total)}
                          </span>
                        </>
                      ) : (
                        <>
                          <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 bg-emerald-100">
                            <DollarSign className="w-4 h-4 text-emerald-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-slate-900 capitalize">
                              Commission{" "}
                              {(item.data as CommissionTransaction).type}
                            </p>
                            <p className="text-xs text-slate-500">
                              {formatDate(
                                (item.data as CommissionTransaction).created_at
                              )}
                              {(item.data as CommissionTransaction).notes && (
                                <span>
                                  {" "}
                                  &middot;{" "}
                                  {(item.data as CommissionTransaction).notes}
                                </span>
                              )}
                            </p>
                          </div>
                          <span
                            className={`text-sm font-semibold ${
                              (item.data as CommissionTransaction).type ===
                              "paid"
                                ? "text-blue-600"
                                : "text-emerald-600"
                            }`}
                          >
                            {(item.data as CommissionTransaction).type ===
                            "paid"
                              ? "-"
                              : "+"}
                            {formatCurrency(
                              (item.data as CommissionTransaction).amount
                            )}
                          </span>
                        </>
                      )}
                    </div>
                  ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Package className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                <p className="text-sm text-slate-500">
                  No activity yet. Share your link to get started.
                </p>
              </div>
            )}
          </Card>
        </div>

        {/* Quick Actions */}
        <div>
          <Card padding="lg" className="border border-slate-200 shadow-sm">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">
              Quick Actions
            </h3>
            <div className="space-y-2">
              <Link
                href="/b2b/portal/orders"
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50 transition-colors border border-slate-100"
              >
                <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center">
                  <ShoppingCart className="w-4.5 h-4.5 text-blue-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-slate-900">
                    New Order
                  </p>
                  <p className="text-xs text-slate-500">
                    Place a wholesale order
                  </p>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </Link>

              <Link
                href="/b2b/portal/products"
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50 transition-colors border border-slate-100"
              >
                <div className="w-9 h-9 rounded-lg bg-emerald-50 flex items-center justify-center">
                  <Package className="w-4.5 h-4.5 text-emerald-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-slate-900">
                    View Products
                  </p>
                  <p className="text-xs text-slate-500">
                    Browse B2B catalog
                  </p>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </Link>

              <Link
                href="/b2b/portal/analytics"
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50 transition-colors border border-slate-100"
              >
                <div className="w-9 h-9 rounded-lg bg-purple-50 flex items-center justify-center">
                  <BarChart3 className="w-4.5 h-4.5 text-purple-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-slate-900">
                    Download Reports
                  </p>
                  <p className="text-xs text-slate-500">
                    Sales and commission data
                  </p>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </Link>

              <Link
                href="/b2b/portal/locations"
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50 transition-colors border border-slate-100"
              >
                <div className="w-9 h-9 rounded-lg bg-amber-50 flex items-center justify-center">
                  <FileText className="w-4.5 h-4.5 text-amber-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-slate-900">
                    Manage Locations
                  </p>
                  <p className="text-xs text-slate-500">
                    View and add locations
                  </p>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </Link>
            </div>
          </Card>

          {/* Referred Orders count */}
          <Card
            padding="md"
            className="border border-slate-200 shadow-sm mt-6"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <Package className="w-5 h-5 text-slate-600" />
              </div>
              <div>
                <p className="text-xs text-slate-500 font-medium">
                  Total Referred Orders
                </p>
                <p className="text-xl font-bold text-slate-900">
                  {totalOrders}
                </p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
