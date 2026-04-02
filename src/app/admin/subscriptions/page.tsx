"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/hooks";
import { Card, Input } from "@/components/ui";
import { formatDate } from "@/lib/utils";
import {
  Search,
  Loader2,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  Eye,
  Pause,
  XCircle,
} from "lucide-react";

interface SubscriptionWithProfile {
  id: string;
  user_id: string;
  stripe_subscription_id: string | null;
  box_tier: string | null;
  status: string;
  box_config: unknown;
  created_at: string;
  current_period_end: string | null;
  profiles: {
    full_name: string | null;
    email: string;
  } | null;
}

type StatusFilter = "all" | "active" | "paused" | "cancelled";

const STATUS_FILTERS: { value: StatusFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "active", label: "Active" },
  { value: "paused", label: "Paused" },
  { value: "cancelled", label: "Cancelled" },
];

const PAGE_SIZE = 20;

function statusBadgeClass(status: string): string {
  switch (status) {
    case "active":
      return "bg-green-100 text-green-700";
    case "paused":
      return "bg-yellow-100 text-yellow-700";
    case "cancelled":
      return "bg-red-100 text-red-700";
    default:
      return "bg-gray-100 text-gray-700";
  }
}

function formatTier(tier: string | null): string {
  if (!tier) return "—";
  return tier.charAt(0).toUpperCase() + tier.slice(1);
}

export default function AdminSubscriptionsPage() {
  const { profile } = useAuth();
  const supabase = createClient();

  const [subscriptions, setSubscriptions] = useState<SubscriptionWithProfile[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  const fetchSubscriptions = useCallback(async () => {
    if (!profile || profile.role !== "admin") return;
    setIsLoading(true);

    const from = (page - 1) * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;

    let query = supabase
      .from("aura_subscriptions")
      .select("*, profiles!aura_subscriptions_user_id_fkey(full_name, email)", {
        count: "exact",
      });

    if (statusFilter !== "all") {
      query = query.eq("status", statusFilter);
    }

    if (search) {
      query = query.or(
        `profiles.full_name.ilike.%${search}%,profiles.email.ilike.%${search}%`
      );
    }

    const { data, count, error: fetchError } = await query
      .order("created_at", { ascending: false })
      .range(from, to);

    if (fetchError) {
      console.error("Error fetching subscriptions:", fetchError);
      // Fallback: try without the FK join hint
      const fallbackQuery = supabase
        .from("aura_subscriptions")
        .select("*, profiles(full_name, email)", { count: "exact" });

      if (statusFilter !== "all") {
        fallbackQuery.eq("status", statusFilter);
      }

      const { data: fbData, count: fbCount } = await fallbackQuery
        .order("created_at", { ascending: false })
        .range(from, to);

      setSubscriptions((fbData as unknown as SubscriptionWithProfile[]) || []);
      setTotalCount(fbCount || 0);
    } else {
      setSubscriptions((data as unknown as SubscriptionWithProfile[]) || []);
      setTotalCount(count || 0);
    }
    setIsLoading(false);
  }, [profile, supabase, page, statusFilter, search]);

  useEffect(() => {
    fetchSubscriptions();
  }, [fetchSubscriptions]);

  useEffect(() => {
    setPage(1);
  }, [search, statusFilter]);

  return (
    <>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Subscriptions</h1>
        <p className="text-gray-600">Manage customer subscriptions</p>
      </div>

      {/* Filters */}
      <Card padding="md" className="mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <Input
              placeholder="Search by customer name or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              leftIcon={<Search className="w-4 h-4" />}
            />
          </div>
          <div className="flex gap-2">
            {STATUS_FILTERS.map((sf) => (
              <button
                key={sf.value}
                onClick={() => setStatusFilter(sf.value)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  statusFilter === sf.value
                    ? "bg-aura-primary text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                {sf.label}
              </button>
            ))}
          </div>
        </div>
      </Card>

      {/* Subscriptions Table */}
      <Card padding="none">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-6 h-6 animate-spin text-aura-primary" />
          </div>
        ) : subscriptions.length === 0 ? (
          <div className="text-center py-20 text-gray-500">
            <CreditCard className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p className="font-medium">No subscriptions found</p>
            <p className="text-sm mt-1">Try adjusting your filters.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b">
                  <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Plan
                  </th>
                  <th className="text-center py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Started
                  </th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Next Billing
                  </th>
                  <th className="text-center py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {subscriptions.map((sub) => (
                  <tr
                    key={sub.id}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="py-3 px-4">
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {sub.profiles?.full_name || "Unknown"}
                        </p>
                        <p className="text-xs text-gray-500">
                          {sub.profiles?.email || "—"}
                        </p>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-sm font-medium text-gray-900">
                        {formatTier(sub.box_tier)}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize ${statusBadgeClass(
                          sub.status
                        )}`}
                      >
                        {sub.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600">
                      {formatDate(sub.created_at)}
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600">
                      {sub.current_period_end
                        ? formatDate(sub.current_period_end)
                        : "—"}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          className="p-1.5 rounded hover:bg-gray-100 text-gray-500 hover:text-aura-primary"
                          title="View details"
                          aria-label="View subscription details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {sub.status === "active" && (
                          <button
                            className="p-1.5 rounded hover:bg-gray-100 text-gray-500 hover:text-yellow-600"
                            title="Pause subscription"
                            aria-label="Pause subscription"
                          >
                            <Pause className="w-4 h-4" />
                          </button>
                        )}
                        {sub.status !== "cancelled" && (
                          <button
                            className="p-1.5 rounded hover:bg-gray-100 text-gray-500 hover:text-red-600"
                            title="Cancel subscription"
                            aria-label="Cancel subscription"
                          >
                            <XCircle className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t">
            <p className="text-sm text-gray-500">
              Showing {(page - 1) * PAGE_SIZE + 1} to{" "}
              {Math.min(page * PAGE_SIZE, totalCount)} of {totalCount}{" "}
              subscriptions
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-1.5 rounded hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
                aria-label="Previous page"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum: number;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (page <= 3) {
                  pageNum = i + 1;
                } else if (page >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = page - 2 + i;
                }
                return (
                  <button
                    key={pageNum}
                    onClick={() => setPage(pageNum)}
                    className={`w-8 h-8 rounded text-sm font-medium ${
                      page === pageNum
                        ? "bg-aura-primary text-white"
                        : "hover:bg-gray-100 text-gray-700"
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="p-1.5 rounded hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
                aria-label="Next page"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}
      </Card>
    </>
  );
}
