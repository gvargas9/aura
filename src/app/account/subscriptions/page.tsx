"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/hooks";
import { Header, Footer, Card, Button } from "@/components/ui";
import { formatCurrency, formatDate } from "@/lib/utils";
import { BOX_CONFIGS } from "@/types";
import {
  Box,
  Loader2,
  ArrowLeft,
  Calendar,
  Pause,
  Play,
  XCircle,
  Edit2,
  RefreshCcw,
  CheckCircle,
} from "lucide-react";
import type { Subscription, Product } from "@/types";

export default function SubscriptionsPage() {
  const router = useRouter();
  const { user, isLoading: authLoading, isAuthenticated } = useAuth();
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [products, setProducts] = useState<Record<string, Product>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const supabase = createClient();

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/auth/login?redirectTo=/account/subscriptions");
    }
  }, [authLoading, isAuthenticated, router]);

  useEffect(() => {
    const fetchSubscriptions = async () => {
      if (!user) return;

      setIsLoading(true);

      const { data: subs, error } = await supabase
        .from("aura_subscriptions")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (!error && subs) {
        setSubscriptions(subs);

        // Fetch products for box configs
        const allProductIds = subs.flatMap((s) => s.box_config || []);
        if (allProductIds.length > 0) {
          const { data: prods } = await supabase
            .from("aura_products")
            .select("*")
            .in("id", allProductIds);

          if (prods) {
            const prodMap: Record<string, Product> = {};
            prods.forEach((p) => {
              prodMap[p.id] = p;
            });
            setProducts(prodMap);
          }
        }
      }

      setIsLoading(false);
    };

    if (user) {
      fetchSubscriptions();
    }
  }, [user, supabase]);

  const handlePause = async (subscriptionId: string) => {
    setActionLoading(subscriptionId);

    const { error } = await supabase
      .from("aura_subscriptions")
      .update({
        status: "paused",
        pause_until: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      })
      .eq("id", subscriptionId);

    if (!error) {
      setSubscriptions((subs) =>
        subs.map((s) =>
          s.id === subscriptionId ? { ...s, status: "paused" } : s
        )
      );
    }

    setActionLoading(null);
  };

  const handleResume = async (subscriptionId: string) => {
    setActionLoading(subscriptionId);

    const { error } = await supabase
      .from("aura_subscriptions")
      .update({
        status: "active",
        pause_until: null,
      })
      .eq("id", subscriptionId);

    if (!error) {
      setSubscriptions((subs) =>
        subs.map((s) =>
          s.id === subscriptionId ? { ...s, status: "active" } : s
        )
      );
    }

    setActionLoading(null);
  };

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-aura-primary" />
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-700";
      case "paused":
        return "bg-amber-100 text-amber-700";
      case "cancelled":
        return "bg-red-100 text-red-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "active":
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case "paused":
        return <Pause className="w-5 h-5 text-amber-500" />;
      case "cancelled":
        return <XCircle className="w-5 h-5 text-red-500" />;
      default:
        return <RefreshCcw className="w-5 h-5 text-gray-500" />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />

      <main className="flex-1 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8">
            <Link
              href="/account"
              className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-4"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Account
            </Link>
            <h1 className="text-3xl font-bold text-gray-900">My Subscriptions</h1>
            <p className="text-gray-600">
              Manage your meal box subscriptions
            </p>
          </div>

          {/* Subscriptions List */}
          {subscriptions.length > 0 ? (
            <div className="space-y-6">
              {subscriptions.map((sub) => {
                const config = BOX_CONFIGS[sub.box_size] || {};
                const boxProducts = (sub.box_config || [])
                  .map((id: string) => products[id])
                  .filter(Boolean);

                return (
                  <Card key={sub.id} padding="lg">
                    <div className="flex items-start justify-between mb-6">
                      <div className="flex items-center gap-4">
                        <div className="w-14 h-14 bg-aura-primary/10 rounded-xl flex items-center justify-center">
                          <Box className="w-7 h-7 text-aura-primary" />
                        </div>
                        <div>
                          <h3 className="text-xl font-semibold capitalize">
                            {sub.box_size} Box
                          </h3>
                          <p className="text-gray-500">
                            {formatCurrency(sub.price)}/month • {config.slots || 12} items
                          </p>
                        </div>
                      </div>
                      <span
                        className={`px-3 py-1 rounded-full text-sm font-medium flex items-center gap-2 ${getStatusColor(sub.status)}`}
                      >
                        {getStatusIcon(sub.status)}
                        {sub.status}
                      </span>
                    </div>

                    {/* Next Delivery */}
                    {sub.status === "active" && sub.next_delivery_date && (
                      <div className="bg-gray-50 rounded-lg p-4 mb-6">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <Calendar className="w-5 h-5 text-aura-primary" />
                            <div>
                              <p className="text-sm text-gray-500">Next Delivery</p>
                              <p className="font-semibold">
                                {formatDate(sub.next_delivery_date)}
                              </p>
                            </div>
                          </div>
                          <Link href={`/build-box?edit=${sub.id}`}>
                            <Button variant="outline" size="sm">
                              <Edit2 className="w-4 h-4 mr-2" />
                              Edit Box
                            </Button>
                          </Link>
                        </div>
                      </div>
                    )}

                    {/* Box Contents Preview */}
                    {boxProducts.length > 0 && (
                      <div className="mb-6">
                        <p className="text-sm font-medium text-gray-700 mb-3">
                          Current Box Contents
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {boxProducts.slice(0, 6).map((product: Product) => (
                            <div
                              key={product.id}
                              className="flex items-center gap-2 bg-gray-100 rounded-lg px-3 py-2"
                            >
                              <span className="text-sm">{product.name}</span>
                            </div>
                          ))}
                          {boxProducts.length > 6 && (
                            <div className="flex items-center gap-2 bg-gray-100 rounded-lg px-3 py-2">
                              <span className="text-sm text-gray-500">
                                +{boxProducts.length - 6} more
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex flex-wrap gap-3 pt-4 border-t">
                      {sub.status === "active" && (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handlePause(sub.id)}
                            disabled={actionLoading === sub.id}
                          >
                            {actionLoading === sub.id ? (
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            ) : (
                              <Pause className="w-4 h-4 mr-2" />
                            )}
                            Pause Subscription
                          </Button>
                          <Link href={`/build-box?edit=${sub.id}`}>
                            <Button variant="secondary" size="sm">
                              <Edit2 className="w-4 h-4 mr-2" />
                              Change Box
                            </Button>
                          </Link>
                        </>
                      )}

                      {sub.status === "paused" && (
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => handleResume(sub.id)}
                          disabled={actionLoading === sub.id}
                        >
                          {actionLoading === sub.id ? (
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          ) : (
                            <Play className="w-4 h-4 mr-2" />
                          )}
                          Resume Subscription
                        </Button>
                      )}

                      {sub.status !== "cancelled" && (
                        <Button variant="ghost" size="sm" className="text-red-600">
                          <XCircle className="w-4 h-4 mr-2" />
                          Cancel
                        </Button>
                      )}
                    </div>
                  </Card>
                );
              })}
            </div>
          ) : (
            <Card padding="lg">
              <div className="text-center py-12">
                <RefreshCcw className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <h3 className="text-lg font-semibold mb-2">No subscriptions yet</h3>
                <p className="text-gray-500 mb-6">
                  Start a subscription to get regular deliveries of your favorite meals.
                </p>
                <Link href="/build-box">
                  <Button>Build Your First Box</Button>
                </Link>
              </div>
            </Card>
          )}

          {/* Start New Subscription */}
          {subscriptions.length > 0 && (
            <div className="mt-8 text-center">
              <Link href="/build-box">
                <Button variant="outline" size="lg">
                  <Box className="w-5 h-5 mr-2" />
                  Start Another Subscription
                </Button>
              </Link>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
