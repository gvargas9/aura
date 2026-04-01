"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useAuth, useLocale } from "@/hooks";
import {
  Card,
  Button,
  Header,
  Footer,
} from "@/components/ui";
import { formatCurrency, formatDate } from "@/lib/utils";
import { BOX_CONFIGS } from "@/types";
import type { Subscription, Product, Order } from "@/types";
import {
  Loader2,
  Box,
  Pause,
  Play,
  Package,
  Calendar,
  RefreshCcw,
  ArrowLeft,
  Edit,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  CheckCircle,
} from "lucide-react";

const STATUS_BADGES: Record<string, string> = {
  active: "bg-green-100 text-green-700",
  paused: "bg-amber-100 text-amber-700",
  cancelled: "bg-red-100 text-red-700",
};

const ORDER_STATUS_BADGES: Record<string, string> = {
  delivered: "bg-green-100 text-green-700",
  shipped: "bg-blue-100 text-blue-700",
  processing: "bg-amber-100 text-amber-700",
  pending: "bg-gray-100 text-gray-700",
  cancelled: "bg-red-100 text-red-700",
};

interface Toast {
  type: "success" | "error";
  message: string;
}

export default function SubscriptionsPage() {
  const router = useRouter();
  const { profile, isLoading: authLoading, isAuthenticated } = useAuth();
  const { t } = useLocale();
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [productMap, setProductMap] = useState<Record<string, Product>>({});
  const [ordersBySubscription, setOrdersBySubscription] = useState<
    Record<string, Order[]>
  >({});
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [expandedHistory, setExpandedHistory] = useState<string | null>(null);
  const [toast, setToast] = useState<Toast | null>(null);

  const supabase = createClient();

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/auth/login?redirectTo=/dashboard/subscriptions");
    }
  }, [authLoading, isAuthenticated, router]);

  const showToast = useCallback((type: "success" | "error", message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      if (!profile) return;

      setIsLoading(true);

      try {
        // Fetch subscriptions
        const { data: subs } = await supabase
          .from("aura_subscriptions")
          .select("*")
          .eq("user_id", profile.id)
          .order("created_at", { ascending: false });

        const subscriptionData = (subs as Subscription[]) || [];
        setSubscriptions(subscriptionData);

        // Collect all product IDs from box_config arrays
        const productIds = new Set<string>();
        subscriptionData.forEach((sub) => {
          if (sub.box_config && Array.isArray(sub.box_config)) {
            sub.box_config.forEach((id) => productIds.add(id));
          }
        });

        // Fetch products if there are product IDs
        if (productIds.size > 0) {
          const { data: products } = await supabase
            .from("aura_products")
            .select("*")
            .in("id", Array.from(productIds));

          const map: Record<string, Product> = {};
          (products || []).forEach((p) => {
            map[p.id] = p as Product;
          });
          setProductMap(map);
        }

        // Fetch orders per subscription
        const subIds = subscriptionData.map((s) => s.id);
        if (subIds.length > 0) {
          const { data: orders } = await supabase
            .from("aura_orders")
            .select("*")
            .in("subscription_id", subIds)
            .order("created_at", { ascending: false });

          const ordersMap: Record<string, Order[]> = {};
          (orders || []).forEach((o) => {
            const order = o as Order;
            if (order.subscription_id) {
              if (!ordersMap[order.subscription_id]) {
                ordersMap[order.subscription_id] = [];
              }
              ordersMap[order.subscription_id].push(order);
            }
          });
          setOrdersBySubscription(ordersMap);
        }
      } catch (error) {
        console.error("Failed to fetch subscription data:", error);
      }

      setIsLoading(false);
    };

    if (profile) {
      fetchData();
    }
  }, [profile, supabase]);

  const handlePauseResume = async (sub: Subscription) => {
    setActionLoading(sub.id);

    try {
      const newStatus = sub.status === "active" ? "paused" : "active";
      const { error } = await supabase
        .from("aura_subscriptions")
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq("id", sub.id);

      if (error) throw error;

      setSubscriptions((prev) =>
        prev.map((s) => (s.id === sub.id ? { ...s, status: newStatus } : s))
      );

      showToast(
        "success",
        newStatus === "paused" ? t("subscriptions.pauseSuccess") : t("subscriptions.resumeSuccess")
      );
    } catch (error) {
      console.error("Failed to update subscription:", error);
      showToast("error", t("subscriptions.updateError"));
    }

    setActionLoading(null);
  };

  if (authLoading || isLoading) {
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
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Toast */}
          {toast && (
            <div
              className={`fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-lg shadow-lg text-sm font-medium transition-all ${
                toast.type === "success"
                  ? "bg-green-50 text-green-800 border border-green-200"
                  : "bg-red-50 text-red-800 border border-red-200"
              }`}
            >
              {toast.type === "success" ? (
                <CheckCircle className="w-4 h-4" />
              ) : (
                <AlertCircle className="w-4 h-4" />
              )}
              {toast.message}
            </div>
          )}

          {/* Page Header */}
          <div className="mb-8">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-4"
            >
              <ArrowLeft className="w-4 h-4" />
              {t("subscriptions.backToDashboard")}
            </Link>
            <h1 className="text-3xl font-bold text-gray-900">
              {t("subscriptions.title")}
            </h1>
            <p className="text-gray-600 mt-1">
              {t("subscriptions.subtitle")}
            </p>
          </div>

          {/* Subscriptions */}
          {subscriptions.length > 0 ? (
            <div className="space-y-6">
              {subscriptions.map((sub) => {
                const boxConfig = BOX_CONFIGS[sub.box_size];
                const products = (sub.box_config || [])
                  .map((id) => productMap[id])
                  .filter(Boolean);
                const subOrders = ordersBySubscription[sub.id] || [];
                const isHistoryExpanded = expandedHistory === sub.id;

                return (
                  <Card key={sub.id} padding="none">
                    {/* Subscription Header */}
                    <div className="px-6 py-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex items-center gap-4">
                        <div className="w-14 h-14 bg-aura-primary/10 rounded-xl flex items-center justify-center">
                          <Box className="w-7 h-7 text-aura-primary" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="text-lg font-semibold text-gray-900 capitalize">
                              {sub.box_size} Box
                            </h3>
                            <span
                              className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                STATUS_BADGES[sub.status] ||
                                "bg-gray-100 text-gray-700"
                              }`}
                            >
                              {sub.status}
                            </span>
                          </div>
                          <p className="text-sm text-gray-500 mt-0.5">
                            {boxConfig?.slots || 0} items &middot;{" "}
                            {formatCurrency(sub.price)}/mo &middot; Every{" "}
                            {sub.delivery_frequency_days} days
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {sub.status !== "cancelled" && (
                          <>
                            <Button
                              variant={
                                sub.status === "active" ? "outline" : "primary"
                              }
                              size="sm"
                              isLoading={actionLoading === sub.id}
                              onClick={() => handlePauseResume(sub)}
                              leftIcon={
                                sub.status === "active" ? (
                                  <Pause className="w-4 h-4" />
                                ) : (
                                  <Play className="w-4 h-4" />
                                )
                              }
                            >
                              {sub.status === "active" ? t("subscriptions.pause") : t("subscriptions.resume")}
                            </Button>
                            <Link href="/build-box">
                              <Button
                                variant="ghost"
                                size="sm"
                                leftIcon={<Edit className="w-4 h-4" />}
                              >
                                {t("subscriptions.modifyBox")}
                              </Button>
                            </Link>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Next Delivery */}
                    {sub.next_delivery_date && sub.status === "active" && (
                      <div className="mx-6 px-4 py-3 bg-green-50 border border-green-100 rounded-lg flex items-center gap-2 text-sm">
                        <Calendar className="w-4 h-4 text-green-600" />
                        <span className="text-green-800">
                          {t("subscriptions.nextDelivery")}{" "}
                          <span className="font-medium">
                            {formatDate(sub.next_delivery_date)}
                          </span>
                        </span>
                      </div>
                    )}

                    {sub.status === "paused" && (
                      <div className="mx-6 px-4 py-3 bg-amber-50 border border-amber-100 rounded-lg flex items-center gap-2 text-sm">
                        <Pause className="w-4 h-4 text-amber-600" />
                        <span className="text-amber-800">
                          {t("subscriptions.pausedMessage")}
                        </span>
                      </div>
                    )}

                    {/* Box Contents */}
                    <div className="px-6 py-5 border-t border-gray-100">
                      <h4 className="text-sm font-semibold text-gray-900 mb-3">
                        {t("subscriptions.boxContents")} ({t("subscriptions.slotsFilled", { filled: String(products.length), total: String(boxConfig?.slots || 0) })})
                      </h4>
                      {products.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {products.map((product, idx) => (
                            <div
                              key={`${product.id}-${idx}`}
                              className="flex items-center gap-3 p-2 rounded-lg bg-gray-50"
                            >
                              {product.image_url ? (
                                <img
                                  src={product.image_url}
                                  alt={product.name}
                                  className="w-10 h-10 rounded-lg object-cover"
                                />
                              ) : (
                                <div className="w-10 h-10 bg-gray-200 rounded-lg flex items-center justify-center">
                                  <Package className="w-5 h-5 text-gray-400" />
                                </div>
                              )}
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-900 truncate">
                                  {product.name}
                                </p>
                                <p className="text-xs text-gray-500">
                                  {product.category}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-gray-500">
                          {t("subscriptions.noProducts")}
                        </p>
                      )}
                    </div>

                    {/* Delivery History */}
                    {subOrders.length > 0 && (
                      <div className="border-t border-gray-100">
                        <button
                          onClick={() =>
                            setExpandedHistory((prev) =>
                              prev === sub.id ? null : sub.id
                            )
                          }
                          className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-gray-50 transition-colors"
                          aria-expanded={isHistoryExpanded}
                        >
                          <div className="flex items-center gap-2">
                            <RefreshCcw className="w-4 h-4 text-gray-400" />
                            <span className="text-sm font-semibold text-gray-900">
                              {t("subscriptions.deliveryHistory")} ({subOrders.length})
                            </span>
                          </div>
                          {isHistoryExpanded ? (
                            <ChevronUp className="w-4 h-4 text-gray-400" />
                          ) : (
                            <ChevronDown className="w-4 h-4 text-gray-400" />
                          )}
                        </button>

                        {isHistoryExpanded && (
                          <div className="px-6 pb-4">
                            <div className="space-y-2">
                              {subOrders.map((order) => (
                                <div
                                  key={order.id}
                                  className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-lg text-sm"
                                >
                                  <div className="flex items-center gap-3">
                                    <span className="font-medium text-gray-900">
                                      {order.order_number ||
                                        order.id.slice(0, 8)}
                                    </span>
                                    <span
                                      className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                                        ORDER_STATUS_BADGES[order.status] ||
                                        "bg-gray-100 text-gray-700"
                                      }`}
                                    >
                                      {order.status}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-4 text-gray-500">
                                    <span>{formatDate(order.created_at)}</span>
                                    <span className="font-medium text-gray-900">
                                      {formatCurrency(order.total)}
                                    </span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </Card>
                );
              })}
            </div>
          ) : (
            <Card padding="lg">
              <div className="text-center py-12">
                <Box className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {t("subscriptions.empty")}
                </h3>
                <p className="text-gray-500 mb-6">
                  {t("subscriptions.emptyMessage")}
                </p>
                <Link href="/build-box">
                  <Button variant="primary">{t("subscriptions.buildFirstBox")}</Button>
                </Link>
              </div>
            </Card>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
