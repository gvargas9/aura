"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/hooks";
import {
  Header,
  Footer,
  Card,
  Button,
  Badge,
  Tabs,
  EmptyState,
  Pagination,
} from "@/components/ui";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { Order, OrderStatus } from "@/types";
import {
  Package,
  Loader2,
  Truck,
  CheckCircle,
  Clock,
  XCircle,
  ChevronRight,
  Eye,
  Download,
} from "lucide-react";

const statusConfig: Record<
  string,
  { variant: "default" | "success" | "warning" | "error" | "info"; icon: React.ReactNode; label: string }
> = {
  pending: { variant: "warning", icon: <Clock className="w-3 h-3" />, label: "Pending" },
  processing: { variant: "info", icon: <Package className="w-3 h-3" />, label: "Processing" },
  shipped: { variant: "info", icon: <Truck className="w-3 h-3" />, label: "Shipped" },
  delivered: { variant: "success", icon: <CheckCircle className="w-3 h-3" />, label: "Delivered" },
  cancelled: { variant: "error", icon: <XCircle className="w-3 h-3" />, label: "Cancelled" },
};

export default function OrdersPage() {
  const router = useRouter();
  const { user, isLoading: authLoading, isAuthenticated } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalOrders, setTotalOrders] = useState(0);
  const [tabCounts, setTabCounts] = useState<Record<string, number>>({});

  const pageSize = 10;
  const supabase = createClient();

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/auth/login?redirectTo=/orders");
    }
  }, [authLoading, isAuthenticated, router]);

  const fetchOrders = async () => {
    if (!user) return;
    setIsLoading(true);

    let query = supabase
      .from("aura_orders")
      .select("*", { count: "exact" })
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (activeTab !== "all") {
      query = query.eq("status", activeTab as OrderStatus);
    }

    const from = (currentPage - 1) * pageSize;
    const to = from + pageSize - 1;
    query = query.range(from, to);

    const { data, count, error } = await query;

    if (!error && data) {
      setOrders(data);
      setTotalOrders(count || 0);
    }
    setIsLoading(false);
  };

  const fetchCounts = async () => {
    if (!user) return;

    const counts: Record<string, number> = {};
    const statuses: OrderStatus[] = ["pending", "processing", "shipped", "delivered"];
    for (const status of statuses) {
      const { count } = await supabase
        .from("aura_orders")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("status", status);
      counts[status] = count || 0;
    }
    setTabCounts(counts);
  };

  useEffect(() => {
    if (user) {
      fetchOrders();
    }
  }, [user, currentPage, activeTab]);

  useEffect(() => {
    if (user) {
      fetchCounts();
    }
  }, [user]);

  const totalPages = Math.ceil(totalOrders / pageSize);

  const tabs = [
    { id: "all", label: "All Orders" },
    { id: "pending", label: "Pending", count: tabCounts.pending || 0 },
    { id: "processing", label: "Processing", count: tabCounts.processing || 0 },
    { id: "shipped", label: "Shipped", count: tabCounts.shipped || 0 },
    { id: "delivered", label: "Delivered", count: tabCounts.delivered || 0 },
  ];

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-aura-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />

      <main className="flex-1 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Page Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">My Orders</h1>
              <p className="text-gray-500 mt-1">Track and manage your orders</p>
            </div>
          </div>

          {/* Tabs */}
          <Tabs
            tabs={tabs}
            activeTab={activeTab}
            onTabChange={(tab) => {
              setActiveTab(tab);
              setCurrentPage(1);
            }}
            className="mb-6"
          />

          {/* Orders List */}
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-aura-primary" />
            </div>
          ) : orders.length === 0 ? (
            <Card>
              <EmptyState
                icon={Package}
                title="No orders found"
                description={
                  activeTab === "all"
                    ? "You haven't placed any orders yet. Start shopping to see your orders here."
                    : `No ${activeTab} orders found.`
                }
                actionLabel="Start Shopping"
                onAction={() => router.push("/build-box")}
              />
            </Card>
          ) : (
            <div className="space-y-4">
              {orders.map((order) => {
                const config = statusConfig[order.status] || statusConfig.pending;
                const items = order.items as Array<{ name: string; quantity: number; price: number }>;
                const shipping = order.shipping_address as {
                  city?: string;
                  state?: string;
                } | null;

                return (
                  <Card key={order.id} padding="lg" className="hover:shadow-md transition-shadow">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-semibold text-lg">
                            Order #{order.order_number || order.id.slice(0, 8)}
                          </h3>
                          <Badge variant={config.variant}>
                            <span className="flex items-center gap-1">
                              {config.icon}
                              {config.label}
                            </span>
                          </Badge>
                        </div>
                        <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                          <span>Placed on {formatDate(order.created_at)}</span>
                          <span>{items?.length || 0} items</span>
                          {shipping?.city && (
                            <span>
                              Shipping to {shipping.city}, {shipping.state}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="text-2xl font-bold">{formatCurrency(order.total)}</p>
                        </div>
                        <Link href={`/orders/${order.id}`}>
                          <Button variant="outline" size="sm" rightIcon={<ChevronRight className="w-4 h-4" />}>
                            Details
                          </Button>
                        </Link>
                      </div>
                    </div>

                    {/* Order Items Preview */}
                    {items && items.length > 0 && (
                      <div className="mt-4 pt-4 border-t border-gray-100">
                        <div className="flex flex-wrap gap-2">
                          {items.slice(0, 4).map((item, index) => (
                            <div
                              key={index}
                              className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 rounded-full text-sm"
                            >
                              <Package className="w-4 h-4 text-gray-400" />
                              <span>{item.name}</span>
                              <span className="text-gray-400">x{item.quantity}</span>
                            </div>
                          ))}
                          {items.length > 4 && (
                            <span className="px-3 py-1.5 text-sm text-gray-500">
                              +{items.length - 4} more
                            </span>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Tracking Info */}
                    {order.tracking_number && order.status === "shipped" && (
                      <div className="mt-4 pt-4 border-t border-gray-100">
                        <div className="flex items-center gap-2 text-sm">
                          <Truck className="w-4 h-4 text-aura-primary" />
                          <span className="text-gray-600">Tracking:</span>
                          <code className="px-2 py-0.5 bg-gray-100 rounded text-gray-900">
                            {order.tracking_number}
                          </code>
                        </div>
                      </div>
                    )}
                  </Card>
                );
              })}

              {/* Pagination */}
              {totalPages > 1 && (
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={setCurrentPage}
                  className="mt-6"
                />
              )}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
