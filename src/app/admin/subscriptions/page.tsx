"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { AdminLayout } from "@/components/admin";
import {
  Button,
  Input,
  Card,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  Badge,
  Modal,
  Select,
  Tabs,
  Pagination,
  EmptyState,
} from "@/components/ui";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { Subscription, Profile, SubscriptionStatus } from "@/types";
import {
  Search,
  Eye,
  RefreshCcw,
  Loader2,
  Play,
  Pause,
  XCircle,
  Calendar,
  Package,
  Download,
} from "lucide-react";

interface SubscriptionWithCustomer extends Subscription {
  customer?: Profile | null;
}

const statusConfig: Record<string, { variant: "default" | "success" | "warning" | "error"; icon: React.ReactNode }> = {
  active: { variant: "success", icon: <Play className="w-3 h-3" /> },
  paused: { variant: "warning", icon: <Pause className="w-3 h-3" /> },
  cancelled: { variant: "error", icon: <XCircle className="w-3 h-3" /> },
};

const tabs = [
  { id: "all", label: "All" },
  { id: "active", label: "Active", count: 0 },
  { id: "paused", label: "Paused", count: 0 },
  { id: "cancelled", label: "Cancelled", count: 0 },
];

export default function AdminSubscriptionsPage() {
  const [subscriptions, setSubscriptions] = useState<SubscriptionWithCustomer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalSubscriptions, setTotalSubscriptions] = useState(0);
  const [selectedSubscription, setSelectedSubscription] = useState<SubscriptionWithCustomer | null>(null);
  const [tabCounts, setTabCounts] = useState<Record<string, number>>({});

  const pageSize = 10;
  const supabase = createClient();

  const fetchSubscriptions = async () => {
    setIsLoading(true);
    let query = supabase
      .from("aura_subscriptions")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false });

    if (activeTab !== "all") {
      query = query.eq("status", activeTab as SubscriptionStatus);
    }

    const from = (currentPage - 1) * pageSize;
    const to = from + pageSize - 1;
    query = query.range(from, to);

    const { data, count, error } = await query;

    if (!error && data) {
      // Fetch customer info for each subscription
      const withCustomers = await Promise.all(
        data.map(async (sub) => {
          const { data: profile } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", sub.user_id)
            .single();
          return { ...sub, customer: profile };
        })
      );

      // Filter by search query if present
      let filtered = withCustomers;
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        filtered = withCustomers.filter(
          (sub) =>
            sub.customer?.email?.toLowerCase().includes(query) ||
            sub.customer?.full_name?.toLowerCase().includes(query)
        );
      }

      setSubscriptions(filtered);
      setTotalSubscriptions(count || 0);
    }
    setIsLoading(false);
  };

  const fetchCounts = async () => {
    const counts: Record<string, number> = {};
    const statuses: SubscriptionStatus[] = ["active", "paused", "cancelled"];
    for (const status of statuses) {
      const { count } = await supabase
        .from("aura_subscriptions")
        .select("*", { count: "exact", head: true })
        .eq("status", status);
      counts[status] = count || 0;
    }
    setTabCounts(counts);
  };

  useEffect(() => {
    fetchSubscriptions();
  }, [currentPage, activeTab, searchQuery]);

  useEffect(() => {
    fetchCounts();
  }, []);

  const handleUpdateStatus = async (subId: string, newStatus: SubscriptionStatus) => {
    await supabase.from("aura_subscriptions").update({ status: newStatus }).eq("id", subId);
    fetchSubscriptions();
    fetchCounts();
    if (selectedSubscription?.id === subId) {
      setSelectedSubscription({ ...selectedSubscription, status: newStatus });
    }
  };

  const totalPages = Math.ceil(totalSubscriptions / pageSize);

  const tabsWithCounts = tabs.map((tab) => ({
    ...tab,
    count: tab.id === "all" ? undefined : tabCounts[tab.id] || 0,
  }));

  // Revenue calculations
  const monthlyRevenue = subscriptions
    .filter((s) => s.status === "active")
    .reduce((sum, s) => sum + s.price, 0);

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Subscriptions</h1>
            <p className="text-gray-500">Manage recurring subscription boxes</p>
          </div>
          <Button variant="outline" leftIcon={<Download className="w-4 h-4" />}>
            Export
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card padding="md">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <Play className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{tabCounts.active || 0}</p>
                <p className="text-sm text-gray-500">Active</p>
              </div>
            </div>
          </Card>
          <Card padding="md">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                <Pause className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{tabCounts.paused || 0}</p>
                <p className="text-sm text-gray-500">Paused</p>
              </div>
            </div>
          </Card>
          <Card padding="md">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                <XCircle className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{tabCounts.cancelled || 0}</p>
                <p className="text-sm text-gray-500">Cancelled</p>
              </div>
            </div>
          </Card>
          <Card padding="md">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-aura-primary/10 rounded-lg flex items-center justify-center">
                <RefreshCcw className="w-5 h-5 text-aura-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{formatCurrency(monthlyRevenue)}</p>
                <p className="text-sm text-gray-500">Monthly Revenue</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs
          tabs={tabsWithCounts}
          activeTab={activeTab}
          onTabChange={(tab) => {
            setActiveTab(tab);
            setCurrentPage(1);
          }}
        />

        {/* Search */}
        <Card padding="md">
          <Input
            placeholder="Search by customer name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            leftIcon={<Search className="w-5 h-5" />}
          />
        </Card>

        {/* Subscriptions Table */}
        <Card>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-aura-primary" />
            </div>
          ) : subscriptions.length === 0 ? (
            <EmptyState
              icon={RefreshCcw}
              title="No subscriptions found"
              description="Subscriptions will appear here"
            />
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Customer</TableHead>
                    <TableHead>Box Size</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Next Delivery</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Started</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {subscriptions.map((subscription) => {
                    const config = statusConfig[subscription.status] || statusConfig.active;
                    return (
                      <TableRow key={subscription.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium text-gray-900">
                              {subscription.customer?.full_name || "No name"}
                            </p>
                            <p className="text-sm text-gray-500">
                              {subscription.customer?.email}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="primary" size="md">
                            <span className="capitalize">{subscription.box_size}</span>
                          </Badge>
                        </TableCell>
                        <TableCell className="font-medium">
                          {formatCurrency(subscription.price)}/mo
                        </TableCell>
                        <TableCell>
                          {subscription.next_delivery_date ? (
                            <div className="flex items-center gap-2 text-sm">
                              <Calendar className="w-4 h-4 text-gray-400" />
                              {formatDate(subscription.next_delivery_date)}
                            </div>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant={config.variant}>
                            <span className="flex items-center gap-1">
                              {config.icon}
                              {subscription.status}
                            </span>
                          </Badge>
                        </TableCell>
                        <TableCell className="text-gray-500">
                          {formatDate(subscription.created_at)}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => setSelectedSubscription(subscription)}
                              className="p-2 text-gray-500 hover:text-aura-primary hover:bg-gray-100 rounded-lg"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>

              {totalPages > 1 && (
                <div className="p-4 border-t border-gray-100">
                  <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={setCurrentPage}
                  />
                </div>
              )}
            </>
          )}
        </Card>
      </div>

      {/* Subscription Details Modal */}
      <Modal
        isOpen={!!selectedSubscription}
        onClose={() => setSelectedSubscription(null)}
        title="Subscription Details"
        size="lg"
      >
        {selectedSubscription && (
          <div className="space-y-6">
            {/* Customer Info */}
            <div className="p-4 bg-gray-50 rounded-xl">
              <h4 className="font-semibold mb-2">Customer</h4>
              <p className="font-medium">{selectedSubscription.customer?.full_name}</p>
              <p className="text-sm text-gray-500">{selectedSubscription.customer?.email}</p>
            </div>

            {/* Subscription Details */}
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 border border-gray-200 rounded-xl">
                <p className="text-sm text-gray-500 mb-1">Box Size</p>
                <p className="font-semibold capitalize">{selectedSubscription.box_size}</p>
              </div>
              <div className="p-4 border border-gray-200 rounded-xl">
                <p className="text-sm text-gray-500 mb-1">Monthly Price</p>
                <p className="font-semibold">{formatCurrency(selectedSubscription.price)}</p>
              </div>
              <div className="p-4 border border-gray-200 rounded-xl">
                <p className="text-sm text-gray-500 mb-1">Delivery Frequency</p>
                <p className="font-semibold">{selectedSubscription.delivery_frequency_days} days</p>
              </div>
              <div className="p-4 border border-gray-200 rounded-xl">
                <p className="text-sm text-gray-500 mb-1">Next Delivery</p>
                <p className="font-semibold">
                  {selectedSubscription.next_delivery_date
                    ? formatDate(selectedSubscription.next_delivery_date)
                    : "Not scheduled"}
                </p>
              </div>
            </div>

            {/* Box Contents */}
            {selectedSubscription.box_config && selectedSubscription.box_config.length > 0 && (
              <div>
                <h4 className="font-semibold mb-3">Box Contents ({selectedSubscription.box_config.length} items)</h4>
                <div className="p-4 bg-gray-50 rounded-xl">
                  <p className="text-sm text-gray-500">
                    Product IDs: {selectedSubscription.box_config.join(", ")}
                  </p>
                </div>
              </div>
            )}

            {/* Status Management */}
            <div>
              <h4 className="font-semibold mb-3">Manage Status</h4>
              <div className="flex gap-2">
                {selectedSubscription.status !== "active" && (
                  <Button
                    size="sm"
                    onClick={() => handleUpdateStatus(selectedSubscription.id, "active")}
                    leftIcon={<Play className="w-4 h-4" />}
                  >
                    Activate
                  </Button>
                )}
                {selectedSubscription.status !== "paused" && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleUpdateStatus(selectedSubscription.id, "paused")}
                    leftIcon={<Pause className="w-4 h-4" />}
                  >
                    Pause
                  </Button>
                )}
                {selectedSubscription.status !== "cancelled" && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="!text-red-600 !border-red-200 hover:!bg-red-50"
                    onClick={() => handleUpdateStatus(selectedSubscription.id, "cancelled")}
                    leftIcon={<XCircle className="w-4 h-4" />}
                  >
                    Cancel
                  </Button>
                )}
              </div>
            </div>
          </div>
        )}
      </Modal>
    </AdminLayout>
  );
}
