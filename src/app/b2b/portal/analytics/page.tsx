"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/hooks";
import { Card, Button } from "@/components/ui";
import { formatCurrency } from "@/lib/utils";
import {
  Loader2,
  BarChart3,
  TrendingUp,
  DollarSign,
  Package,
  ShoppingCart,
  Users,
  Download,
  Calendar,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import type { Dealer, Organization, Order } from "@/types";

interface CommissionTransaction {
  id: string;
  dealer_id: string;
  order_id: string | null;
  amount: number;
  type: "earned" | "paid" | "adjustment";
  status: string;
  created_at: string;
}

export default function AnalyticsPage() {
  const { user, profile } = useAuth();
  const [dealer, setDealer] = useState<Dealer | null>(null);
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [commissions, setCommissions] = useState<CommissionTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);

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
    const orgId = dealerData.organization_id;

    const [orgResult, ordersResult, commissionsResult] = await Promise.all([
      orgId
        ? supabase.from("organizations").select("*").eq("id", orgId).single()
        : Promise.resolve({ data: null }),
      supabase
        .from("aura_orders")
        .select("*")
        .eq("dealer_attribution_id", dealerData.id)
        .order("created_at", { ascending: false }),
      supabase
        .from("commission_transactions")
        .select("*")
        .eq("dealer_id", dealerData.id)
        .order("created_at", { ascending: false }),
    ]);

    if (orgResult.data) setOrganization(orgResult.data as Organization);
    if (ordersResult.data) setOrders(ordersResult.data as Order[]);
    if (commissionsResult.data)
      setCommissions(commissionsResult.data as CommissionTransaction[]);

    setIsLoading(false);
  }, [user, supabase]);

  useEffect(() => {
    if (user && (profile?.role === "dealer" || profile?.role === "admin")) {
      fetchData();
    } else if (user && profile) {
      setIsLoading(false);
    }
  }, [user, profile, fetchData]);

  // Revenue over time (last 6 months)
  const revenueByMonth = useMemo(() => {
    const monthMap = new Map<string, number>();
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = d.toLocaleDateString("en-US", {
        month: "short",
        year: "2-digit",
      });
      monthMap.set(key, 0);
    }
    orders.forEach((o) => {
      const d = new Date(o.created_at);
      const key = d.toLocaleDateString("en-US", {
        month: "short",
        year: "2-digit",
      });
      if (monthMap.has(key)) {
        monthMap.set(key, (monthMap.get(key) || 0) + o.total);
      }
    });
    return Array.from(monthMap.entries()).map(([month, amount]) => ({
      month,
      amount,
    }));
  }, [orders]);

  // Commission by month
  const commissionByMonth = useMemo(() => {
    const monthMap = new Map<string, number>();
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = d.toLocaleDateString("en-US", {
        month: "short",
        year: "2-digit",
      });
      monthMap.set(key, 0);
    }
    commissions.forEach((c) => {
      if (c.type === "earned") {
        const d = new Date(c.created_at);
        const key = d.toLocaleDateString("en-US", {
          month: "short",
          year: "2-digit",
        });
        if (monthMap.has(key)) {
          monthMap.set(key, (monthMap.get(key) || 0) + c.amount);
        }
      }
    });
    return Array.from(monthMap.entries()).map(([month, amount]) => ({
      month,
      amount,
    }));
  }, [commissions]);

  // Top selling products
  const topProducts = useMemo(() => {
    const productMap = new Map<
      string,
      { name: string; revenue: number; quantity: number }
    >();
    orders.forEach((o) => {
      const items =
        (o.items as unknown as Array<{
          name: string;
          quantity: number;
          price: number;
        }>) || [];
      items.forEach((item) => {
        const existing = productMap.get(item.name) || {
          name: item.name,
          revenue: 0,
          quantity: 0,
        };
        existing.revenue += item.price * item.quantity;
        existing.quantity += item.quantity;
        productMap.set(item.name, existing);
      });
    });
    return Array.from(productMap.values())
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 8);
  }, [orders]);

  // Summary stats
  const totalRevenue = orders.reduce((sum, o) => sum + o.total, 0);
  const totalOrderCount = orders.length;
  const avgOrderValue = totalOrderCount > 0 ? totalRevenue / totalOrderCount : 0;
  const thisMonthOrders = orders.filter((o) => {
    const d = new Date(o.created_at);
    const now = new Date();
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  });
  const lastMonthOrders = orders.filter((o) => {
    const d = new Date(o.created_at);
    const now = new Date();
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    return d.getMonth() === lastMonth.getMonth() && d.getFullYear() === lastMonth.getFullYear();
  });
  const thisMonthRevenue = thisMonthOrders.reduce((s, o) => s + o.total, 0);
  const lastMonthRevenue = lastMonthOrders.reduce((s, o) => s + o.total, 0);
  const revenueGrowth =
    lastMonthRevenue > 0
      ? ((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100
      : thisMonthRevenue > 0
        ? 100
        : 0;

  // Referral stats
  const referralCount = orders.filter(
    (o) => o.purchase_type === "referral" || o.dealer_attribution_id
  ).length;

  const maxRevenue = Math.max(...revenueByMonth.map((m) => m.amount), 1);
  const maxCommission = Math.max(...commissionByMonth.map((m) => m.amount), 1);
  const maxProductRevenue =
    topProducts.length > 0 ? topProducts[0].revenue : 1;

  const handleDownloadReport = () => {
    const rows = [
      ["Month", "Revenue", "Commission"],
      ...revenueByMonth.map((r, i) => [
        r.month,
        r.amount.toFixed(2),
        commissionByMonth[i]?.amount.toFixed(2) || "0.00",
      ]),
    ];
    const csv = rows.map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "aura-b2b-report.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8 gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-slate-900">
            Analytics
          </h1>
          <p className="text-slate-500 mt-1">
            Track your performance and revenue metrics
          </p>
        </div>
        <Button
          variant="outline"
          onClick={handleDownloadReport}
          className="flex-shrink-0"
        >
          <Download className="w-4 h-4 mr-2" />
          Download Report
        </Button>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card padding="md" className="border border-slate-200 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <DollarSign className="w-5 h-5 text-blue-600" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-slate-500 font-medium">
                Total Revenue
              </p>
              <p className="text-lg font-bold text-slate-900 truncate">
                {formatCurrency(totalRevenue)}
              </p>
            </div>
          </div>
        </Card>

        <Card padding="md" className="border border-slate-200 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <ShoppingCart className="w-5 h-5 text-emerald-600" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-slate-500 font-medium">
                Total Orders
              </p>
              <p className="text-lg font-bold text-slate-900">
                {totalOrderCount}
              </p>
            </div>
          </div>
        </Card>

        <Card padding="md" className="border border-slate-200 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <TrendingUp className="w-5 h-5 text-purple-600" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-slate-500 font-medium">
                Avg Order Value
              </p>
              <p className="text-lg font-bold text-slate-900 truncate">
                {formatCurrency(avgOrderValue)}
              </p>
            </div>
          </div>
        </Card>

        <Card padding="md" className="border border-slate-200 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <Calendar className="w-5 h-5 text-amber-600" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-slate-500 font-medium">
                This Month
              </p>
              <div className="flex items-center gap-1.5">
                <p className="text-lg font-bold text-slate-900 truncate">
                  {formatCurrency(thisMonthRevenue)}
                </p>
                {revenueGrowth !== 0 && (
                  <span
                    className={`inline-flex items-center text-xs font-medium ${
                      revenueGrowth > 0
                        ? "text-emerald-600"
                        : "text-red-600"
                    }`}
                  >
                    {revenueGrowth > 0 ? (
                      <ArrowUp className="w-3 h-3" />
                    ) : (
                      <ArrowDown className="w-3 h-3" />
                    )}
                    {Math.abs(revenueGrowth).toFixed(0)}%
                  </span>
                )}
              </div>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-6 mb-8">
        {/* Revenue Chart */}
        <Card padding="lg" className="border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-semibold text-slate-900">
              Revenue Over Time
            </h2>
            <BarChart3 className="w-5 h-5 text-slate-400" />
          </div>
          <div className="flex items-end gap-3 h-48">
            {revenueByMonth.map((item) => (
              <div
                key={item.month}
                className="flex-1 flex flex-col items-center gap-1"
              >
                <span className="text-xs font-medium text-slate-600 tabular-nums">
                  {item.amount > 0
                    ? `$${(item.amount / 1000).toFixed(1)}k`
                    : ""}
                </span>
                <div
                  className="w-full rounded-t-md bg-gradient-to-t from-blue-600 to-blue-400 transition-all duration-500 min-h-[4px]"
                  style={{
                    height: `${Math.max(4, (item.amount / maxRevenue) * 140)}px`,
                  }}
                />
                <span className="text-xs text-slate-400">{item.month}</span>
              </div>
            ))}
          </div>
          {totalRevenue === 0 && (
            <p className="text-center text-sm text-slate-400 mt-4">
              Revenue data will appear as orders come in
            </p>
          )}
        </Card>

        {/* Commission Chart */}
        <Card padding="lg" className="border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-semibold text-slate-900">
              Commission Breakdown
            </h2>
            <DollarSign className="w-5 h-5 text-slate-400" />
          </div>
          <div className="flex items-end gap-3 h-48">
            {commissionByMonth.map((item) => (
              <div
                key={item.month}
                className="flex-1 flex flex-col items-center gap-1"
              >
                <span className="text-xs font-medium text-emerald-600 tabular-nums">
                  {item.amount > 0 ? `$${Math.round(item.amount)}` : ""}
                </span>
                <div
                  className="w-full rounded-t-md bg-gradient-to-t from-emerald-600 to-emerald-400 transition-all duration-500 min-h-[4px]"
                  style={{
                    height: `${Math.max(4, (item.amount / maxCommission) * 140)}px`,
                  }}
                />
                <span className="text-xs text-slate-400">{item.month}</span>
              </div>
            ))}
          </div>
          <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-100">
            <span className="text-sm text-slate-500">Total Earned</span>
            <span className="text-sm font-bold text-slate-900">
              {formatCurrency(dealer?.commission_earned || 0)}
            </span>
          </div>
        </Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-6 mb-8">
        {/* Top Selling Products (Horizontal Bar Chart) */}
        <Card padding="lg" className="border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-semibold text-slate-900">
              Top Selling Products
            </h2>
            <Package className="w-5 h-5 text-slate-400" />
          </div>
          {topProducts.length > 0 ? (
            <div className="space-y-3">
              {topProducts.map((product, idx) => (
                <div key={product.name}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-slate-700 truncate max-w-[60%]">
                      {idx + 1}. {product.name}
                    </span>
                    <span className="text-sm font-medium text-slate-900 tabular-nums">
                      {formatCurrency(product.revenue)}
                    </span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full bg-blue-500 transition-all duration-500"
                      style={{
                        width: `${(product.revenue / maxProductRevenue) * 100}%`,
                      }}
                    />
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {product.quantity} units sold
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Package className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="text-sm text-slate-500">
                Product data will appear after orders
              </p>
            </div>
          )}
        </Card>

        {/* Order Frequency & Referral Stats */}
        <Card padding="lg" className="border border-slate-200 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900 mb-5">
            Order & Referral Stats
          </h2>

          <div className="space-y-4">
            {/* Order frequency */}
            <div className="p-4 rounded-lg bg-slate-50 border border-slate-100">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                  <ShoppingCart className="w-4 h-4 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-900">
                    Order Frequency
                  </p>
                  <p className="text-xs text-slate-500">
                    Based on your order history
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3 mt-3">
                <div className="text-center">
                  <p className="text-lg font-bold text-slate-900">
                    {thisMonthOrders.length}
                  </p>
                  <p className="text-xs text-slate-500">This Month</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-bold text-slate-900">
                    {lastMonthOrders.length}
                  </p>
                  <p className="text-xs text-slate-500">Last Month</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-bold text-slate-900">
                    {totalOrderCount}
                  </p>
                  <p className="text-xs text-slate-500">All Time</p>
                </div>
              </div>
            </div>

            {/* Referral stats */}
            <div className="p-4 rounded-lg bg-slate-50 border border-slate-100">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center">
                  <Users className="w-4 h-4 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-900">
                    Customer Referrals
                  </p>
                  <p className="text-xs text-slate-500">
                    Tracked through your referral code
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 mt-3">
                <div className="text-center">
                  <p className="text-lg font-bold text-slate-900">
                    {referralCount}
                  </p>
                  <p className="text-xs text-slate-500">Referred Orders</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-bold text-slate-900">
                    {formatCurrency(
                      orders
                        .filter((o) => o.dealer_attribution_id)
                        .reduce((s, o) => s + o.total, 0)
                    )}
                  </p>
                  <p className="text-xs text-slate-500">Referral Revenue</p>
                </div>
              </div>
            </div>

            {/* Commission summary */}
            <div className="p-4 rounded-lg bg-emerald-50 border border-emerald-100">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center">
                  <DollarSign className="w-4 h-4 text-emerald-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-900">
                    Commission Rate
                  </p>
                  <p className="text-2xl font-bold text-emerald-700">
                    {((organization?.commission_rate || 0.1) * 100).toFixed(0)}%
                  </p>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
