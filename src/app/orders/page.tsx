"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/hooks";
import {
  Card,
  Button,
  Header,
  Footer,
} from "@/components/ui";
import { cn, formatCurrency, formatDate } from "@/lib/utils";
import type { Order, OrderItem } from "@/types";
import type { Json } from "@/types/database";
import {
  Loader2,
  Package,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Truck,
  MapPin,
  Filter,
} from "lucide-react";

type StatusFilter = "all" | "pending" | "processing" | "shipped" | "delivered" | "cancelled";

const STATUS_BADGES: Record<string, string> = {
  delivered: "bg-green-100 text-green-700",
  shipped: "bg-blue-100 text-blue-700",
  processing: "bg-amber-100 text-amber-700",
  pending: "bg-gray-100 text-gray-700",
  cancelled: "bg-red-100 text-red-700",
};

const FILTER_OPTIONS: { value: StatusFilter; label: string }[] = [
  { value: "all", label: "All Orders" },
  { value: "pending", label: "Pending" },
  { value: "processing", label: "Processing" },
  { value: "shipped", label: "Shipped" },
  { value: "delivered", label: "Delivered" },
  { value: "cancelled", label: "Cancelled" },
];

function parseItems(items: Json): OrderItem[] {
  if (Array.isArray(items)) {
    return items as unknown as OrderItem[];
  }
  return [];
}

function parseAddress(
  address: Json
): { address1?: string; city?: string; state?: string; zipCode?: string } | null {
  if (address && typeof address === "object" && !Array.isArray(address)) {
    return address as { address1?: string; city?: string; state?: string; zipCode?: string };
  }
  return null;
}

export default function OrdersPage() {
  const router = useRouter();
  const { profile, isLoading: authLoading, isAuthenticated } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);

  const supabase = createClient();

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/auth/login?redirectTo=/orders");
    }
  }, [authLoading, isAuthenticated, router]);

  useEffect(() => {
    const fetchOrders = async () => {
      if (!profile) return;

      setIsLoading(true);

      try {
        let query = supabase
          .from("aura_orders")
          .select("*")
          .eq("user_id", profile.id)
          .order("created_at", { ascending: false });

        if (statusFilter !== "all") {
          query = query.eq("status", statusFilter);
        }

        const { data } = await query;
        setOrders((data as Order[]) || []);
      } catch (error) {
        console.error("Failed to fetch orders:", error);
      }

      setIsLoading(false);
    };

    if (profile) {
      fetchOrders();
    }
  }, [profile, supabase, statusFilter]);

  const toggleExpand = (orderId: string) => {
    setExpandedOrder((prev) => (prev === orderId ? null : orderId));
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <div className="flex-1 flex items-center justify-center bg-gray-50">
          <Loader2 className="w-8 h-8 animate-spin text-aura-primary" />
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Page Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8 gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Order History</h1>
              <p className="text-gray-600 mt-1">
                Track and manage all your Aura orders.
              </p>
            </div>
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-2">
            <Filter className="w-4 h-4 text-gray-400 shrink-0" />
            {FILTER_OPTIONS.map((option) => (
              <button
                key={option.value}
                onClick={() => setStatusFilter(option.value)}
                className={cn(
                  "px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors",
                  statusFilter === option.value
                    ? "bg-aura-primary text-white"
                    : "bg-white text-gray-600 hover:bg-gray-100 border border-gray-200"
                )}
              >
                {option.label}
              </button>
            ))}
          </div>

          {/* Orders List */}
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-8 h-8 animate-spin text-aura-primary" />
            </div>
          ) : orders.length > 0 ? (
            <div className="space-y-4">
              {orders.map((order) => {
                const isExpanded = expandedOrder === order.id;
                const items = parseItems(order.items);
                const address = parseAddress(order.shipping_address);

                return (
                  <Card key={order.id} padding="none">
                    {/* Order Row */}
                    <button
                      onClick={() => toggleExpand(order.id)}
                      className="w-full px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-left hover:bg-gray-50 transition-colors"
                      aria-expanded={isExpanded}
                      aria-label={`Order ${order.order_number || order.id.slice(0, 8)}`}
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center shrink-0">
                          <Package className="w-5 h-5 text-gray-500" />
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">
                            {order.order_number || order.id.slice(0, 8)}
                          </p>
                          <p className="text-sm text-gray-500">
                            {formatDate(order.created_at)}
                            {items.length > 0 && (
                              <span>
                                {" "}
                                &middot; {items.length} item
                                {items.length !== 1 ? "s" : ""}
                              </span>
                            )}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 sm:gap-6">
                        <span
                          className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                            STATUS_BADGES[order.status] ||
                            "bg-gray-100 text-gray-700"
                          }`}
                        >
                          {order.status}
                        </span>
                        <span className="font-semibold text-gray-900 min-w-[80px] text-right">
                          {formatCurrency(order.total)}
                        </span>
                        {isExpanded ? (
                          <ChevronUp className="w-5 h-5 text-gray-400" />
                        ) : (
                          <ChevronDown className="w-5 h-5 text-gray-400" />
                        )}
                      </div>
                    </button>

                    {/* Expanded Details */}
                    {isExpanded && (
                      <div className="px-6 pb-6 border-t border-gray-100">
                        <div className="grid sm:grid-cols-2 gap-6 pt-4">
                          {/* Items */}
                          <div>
                            <h4 className="text-sm font-semibold text-gray-900 mb-3">
                              Items
                            </h4>
                            {items.length > 0 ? (
                              <div className="space-y-2">
                                {items.map((item, idx) => (
                                  <div
                                    key={idx}
                                    className="flex items-center justify-between text-sm"
                                  >
                                    <span className="text-gray-700">
                                      {item.name}{" "}
                                      <span className="text-gray-400">
                                        x{item.quantity}
                                      </span>
                                    </span>
                                    <span className="text-gray-900 font-medium">
                                      {formatCurrency(
                                        item.price * item.quantity
                                      )}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className="text-sm text-gray-500">
                                Item details not available.
                              </p>
                            )}

                            {/* Order Totals */}
                            <div className="mt-4 pt-3 border-t border-gray-100 space-y-1 text-sm">
                              <div className="flex justify-between text-gray-500">
                                <span>Subtotal</span>
                                <span>{formatCurrency(order.subtotal)}</span>
                              </div>
                              {order.discount > 0 && (
                                <div className="flex justify-between text-green-600">
                                  <span>Discount</span>
                                  <span>
                                    -{formatCurrency(order.discount)}
                                  </span>
                                </div>
                              )}
                              <div className="flex justify-between text-gray-500">
                                <span>Shipping</span>
                                <span>
                                  {order.shipping > 0
                                    ? formatCurrency(order.shipping)
                                    : "Free"}
                                </span>
                              </div>
                              <div className="flex justify-between text-gray-500">
                                <span>Tax</span>
                                <span>{formatCurrency(order.tax)}</span>
                              </div>
                              <div className="flex justify-between font-semibold text-gray-900 pt-1">
                                <span>Total</span>
                                <span>{formatCurrency(order.total)}</span>
                              </div>
                            </div>
                          </div>

                          {/* Shipping & Tracking */}
                          <div className="space-y-4">
                            {address && (
                              <div>
                                <h4 className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-1.5">
                                  <MapPin className="w-4 h-4" />
                                  Shipping Address
                                </h4>
                                <div className="text-sm text-gray-600 bg-gray-50 rounded-lg p-3">
                                  {address.address1 && (
                                    <p>{address.address1}</p>
                                  )}
                                  {(address.city ||
                                    address.state ||
                                    address.zipCode) && (
                                    <p>
                                      {[
                                        address.city,
                                        address.state,
                                        address.zipCode,
                                      ]
                                        .filter(Boolean)
                                        .join(", ")}
                                    </p>
                                  )}
                                </div>
                              </div>
                            )}

                            {order.tracking_number && (
                              <div>
                                <h4 className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-1.5">
                                  <Truck className="w-4 h-4" />
                                  Tracking
                                </h4>
                                <div className="bg-gray-50 rounded-lg p-3">
                                  <p className="text-sm font-mono text-gray-700">
                                    {order.tracking_number}
                                  </p>
                                  {order.notes && (
                                    <a
                                      href={order.notes}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="inline-flex items-center gap-1 text-sm text-aura-primary hover:underline mt-2"
                                    >
                                      Track Package
                                      <ExternalLink className="w-3.5 h-3.5" />
                                    </a>
                                  )}
                                </div>
                              </div>
                            )}

                            {order.notes && !order.tracking_number && (
                              <div>
                                <h4 className="text-sm font-semibold text-gray-900 mb-2">
                                  Notes
                                </h4>
                                <p className="text-sm text-gray-600 bg-gray-50 rounded-lg p-3">
                                  {order.notes}
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </Card>
                );
              })}
            </div>
          ) : (
            <Card padding="lg">
              <div className="text-center py-12">
                <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  No orders found
                </h3>
                <p className="text-gray-500 mb-6">
                  {statusFilter !== "all"
                    ? `You don't have any ${statusFilter} orders.`
                    : "You haven't placed any orders yet. Start by building your first box."}
                </p>
                {statusFilter !== "all" ? (
                  <Button
                    variant="outline"
                    onClick={() => setStatusFilter("all")}
                  >
                    View All Orders
                  </Button>
                ) : (
                  <a href="/build-box">
                    <Button variant="primary">Build Your First Box</Button>
                  </a>
                )}
              </div>
            </Card>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
