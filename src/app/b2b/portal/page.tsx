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
} from "lucide-react";
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

export default function DealerPortalPage() {
  const { user, profile } = useAuth();
  const [dealer, setDealer] = useState<Dealer | null>(null);
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [commissionHistory, setCommissionHistory] = useState<CommissionTransaction[]>([]);
  const [totalOrders, setTotalOrders] = useState(0);
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

    // Fetch org, orders, commission count, and commission history in parallel
    const [orgResult, ordersResult, countResult, commissionResult] = await Promise.all([
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
    if (commissionResult.data) setCommissionHistory(commissionResult.data as CommissionTransaction[]);

    setIsLoading(false);
  }, [user, supabase]);

  useEffect(() => {
    if (user && profile?.role === "dealer") {
      fetchData();
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
      // Fallback for older browsers
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

  const commissionPaid = dealer?.commission_paid ?? 0;
  const commissionEarned = dealer?.commission_earned ?? 0;
  const commissionPending = commissionEarned - commissionPaid;

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
        <h2 className="text-xl font-semibold text-slate-900 mb-2">No Dealer Account Found</h2>
        <p className="text-slate-500 mb-6">
          Your dealer profile hasn&apos;t been set up yet. Please contact support.
        </p>
        <a href="mailto:partnerships@aura.com">
          <Button variant="primary" className="bg-blue-600 hover:bg-blue-700 focus:ring-blue-600">
            Contact Support
          </Button>
        </a>
      </div>
    );
  }

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

  const commissionTypeColor = (type: string) => {
    switch (type) {
      case "earned":
        return "text-emerald-600";
      case "paid":
        return "text-blue-600";
      case "adjustment":
        return "text-amber-600";
      default:
        return "text-slate-600";
    }
  };

  return (
    <div>
      {/* Welcome Header */}
      <div className="mb-8">
        <h1 className="text-2xl lg:text-3xl font-bold text-slate-900">
          Welcome back, {profile?.full_name?.split(" ")[0] || "Partner"}
        </h1>
        <p className="text-slate-500 mt-1">
          {organization ? `${organization.name} ` : ""}
          {organization && (
            <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-blue-100 text-blue-700 capitalize ml-1">
              {organization.dealer_tier}
            </span>
          )}
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card padding="md" className="border border-slate-200 shadow-sm hover:shadow-md">
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

        <Card padding="md" className="border border-slate-200 shadow-sm hover:shadow-md">
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

        <Card padding="md" className="border border-slate-200 shadow-sm hover:shadow-md">
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

        <Card padding="md" className="border border-slate-200 shadow-sm hover:shadow-md">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <Package className="w-5 h-5 text-purple-600" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-slate-500 font-medium">Referred Orders</p>
              <p className="text-lg lg:text-xl font-bold text-slate-900">
                {totalOrders}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Referral Link Section */}
      <Card padding="lg" className="border border-blue-200 bg-blue-50/50 shadow-sm mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="flex items-center gap-3 flex-shrink-0">
            <div className="w-11 h-11 rounded-lg bg-blue-600 flex items-center justify-center">
              <QrCode className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900">Your Referral Link</h3>
              <p className="text-sm text-slate-500">Share with customers to earn commissions</p>
            </div>
          </div>
          <div className="flex-1 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="flex-1 bg-white rounded-lg border border-slate-200 px-4 py-2.5 flex items-center gap-2 min-w-0">
              <LinkIcon className="w-4 h-4 text-slate-400 flex-shrink-0" />
              <code className="text-sm text-slate-700 truncate font-mono">{referralLink}</code>
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
              <span>Commission rate: {(organization.commission_rate * 100).toFixed(0)}%</span>
            </>
          )}
        </div>
      </Card>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Recent Referred Orders */}
        <div className="lg:col-span-2">
          <Card padding="lg" className="border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-semibold text-slate-900">Recent Referred Orders</h2>
              <a
                href="/b2b/portal/orders"
                className="text-sm font-medium text-blue-600 hover:text-blue-700 flex items-center gap-1"
              >
                View all
                <ArrowUpRight className="w-3.5 h-3.5" />
              </a>
            </div>

            {recentOrders.length > 0 ? (
              <div className="overflow-x-auto -mx-6">
                <table className="w-full min-w-[500px]">
                  <thead>
                    <tr className="border-b border-slate-100">
                      <th className="text-left py-3 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                        Order
                      </th>
                      <th className="text-left py-3 px-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="text-left py-3 px-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="text-right py-3 px-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                        Total
                      </th>
                      <th className="text-right py-3 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                        Commission
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {recentOrders.map((order) => (
                      <tr key={order.id} className="hover:bg-slate-50 transition-colors">
                        <td className="py-3 px-6 font-medium text-sm text-slate-900">
                          #{order.order_number || order.id.slice(0, 8)}
                        </td>
                        <td className="py-3 px-3 text-sm text-slate-500">
                          {formatDate(order.created_at)}
                        </td>
                        <td className="py-3 px-3">
                          <span
                            className={`px-2 py-1 rounded-md text-xs font-medium capitalize ${statusColor(order.status)}`}
                          >
                            {order.status}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-right text-sm text-slate-900">
                          {formatCurrency(order.total)}
                        </td>
                        <td className="py-3 px-6 text-right text-sm font-medium text-emerald-600">
                          {formatCurrency(
                            order.total * (organization?.commission_rate ?? 0.1)
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-12">
                <Package className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                <p className="text-sm text-slate-500">
                  No referred orders yet. Share your link to get started.
                </p>
              </div>
            )}
          </Card>
        </div>

        {/* Commission History */}
        <div>
          <Card padding="lg" className="border border-slate-200 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900 mb-5">Commission History</h2>

            {commissionHistory.length > 0 ? (
              <div className="space-y-3">
                {commissionHistory.map((tx) => (
                  <div
                    key={tx.id}
                    className="flex items-center justify-between py-2 border-b border-slate-50 last:border-0"
                  >
                    <div>
                      <p className="text-sm font-medium text-slate-900 capitalize">{tx.type}</p>
                      <p className="text-xs text-slate-500">
                        {formatDate(tx.created_at)}
                      </p>
                      {tx.notes && (
                        <p className="text-xs text-slate-400 mt-0.5 truncate max-w-[180px]">
                          {tx.notes}
                        </p>
                      )}
                    </div>
                    <span className={`text-sm font-semibold ${commissionTypeColor(tx.type)}`}>
                      {tx.type === "paid" ? "-" : "+"}
                      {formatCurrency(tx.amount)}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <DollarSign className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="text-sm text-slate-500">No commission activity yet.</p>
              </div>
            )}
          </Card>

          {/* Quick Links */}
          <Card padding="lg" className="border border-slate-200 shadow-sm mt-6">
            <h3 className="text-sm font-semibold text-slate-900 mb-3">Quick Actions</h3>
            <div className="space-y-1">
              <a
                href="/b2b/portal/products"
                className="flex items-center justify-between p-2.5 rounded-lg hover:bg-slate-50 transition-colors text-sm text-slate-700"
              >
                <span>Browse B2B Catalog</span>
                <ExternalLink className="w-4 h-4 text-slate-400" />
              </a>
              <a
                href="/b2b/portal/orders"
                className="flex items-center justify-between p-2.5 rounded-lg hover:bg-slate-50 transition-colors text-sm text-slate-700"
              >
                <span>Place Wholesale Order</span>
                <ExternalLink className="w-4 h-4 text-slate-400" />
              </a>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
