"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/hooks";
import { Header, Footer, Card, Button, Badge, Modal } from "@/components/ui";
import { formatCurrency, formatDate } from "@/lib/utils";
import { BOX_CONFIGS } from "@/types";
import type { Subscription, Product } from "@/types";
import {
  Package,
  Loader2,
  Calendar,
  RefreshCcw,
  Play,
  Pause,
  XCircle,
  Edit,
  Plus,
  ArrowRight,
  CheckCircle,
  AlertTriangle,
  CreditCard,
  Truck,
} from "lucide-react";

export default function SubscriptionPage() {
  const router = useRouter();
  const { user, isLoading: authLoading, isAuthenticated } = useAuth();
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedSubscription, setSelectedSubscription] = useState<Subscription | null>(null);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showPauseModal, setShowPauseModal] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  const supabase = createClient();

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/auth/login?redirectTo=/subscription");
    }
  }, [authLoading, isAuthenticated, router]);

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;

      const [subsRes, prodsRes] = await Promise.all([
        supabase
          .from("aura_subscriptions")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false }),
        supabase.from("aura_products").select("*").eq("is_active", true),
      ]);

      setSubscriptions(subsRes.data || []);
      setProducts(prodsRes.data || []);
      setIsLoading(false);
    };

    if (user) {
      fetchData();
    }
  }, [user, supabase]);

  const handlePause = async () => {
    if (!selectedSubscription) return;
    setIsUpdating(true);

    await supabase
      .from("aura_subscriptions")
      .update({ status: "paused" })
      .eq("id", selectedSubscription.id);

    setSubscriptions((prev) =>
      prev.map((s) =>
        s.id === selectedSubscription.id ? { ...s, status: "paused" } : s
      )
    );
    setShowPauseModal(false);
    setSelectedSubscription(null);
    setIsUpdating(false);
  };

  const handleResume = async (subscriptionId: string) => {
    setIsUpdating(true);

    await supabase
      .from("aura_subscriptions")
      .update({ status: "active" })
      .eq("id", subscriptionId);

    setSubscriptions((prev) =>
      prev.map((s) =>
        s.id === subscriptionId ? { ...s, status: "active" } : s
      )
    );
    setIsUpdating(false);
  };

  const handleCancel = async () => {
    if (!selectedSubscription) return;
    setIsUpdating(true);

    await supabase
      .from("aura_subscriptions")
      .update({ status: "cancelled" })
      .eq("id", selectedSubscription.id);

    setSubscriptions((prev) =>
      prev.map((s) =>
        s.id === selectedSubscription.id ? { ...s, status: "cancelled" } : s
      )
    );
    setShowCancelModal(false);
    setSelectedSubscription(null);
    setIsUpdating(false);
  };

  const getProductNames = (productIds: string[]) => {
    return productIds
      .map((id) => products.find((p) => p.id === id)?.name || "Unknown")
      .slice(0, 3);
  };

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-aura-primary" />
      </div>
    );
  }

  const activeSubscription = subscriptions.find((s) => s.status === "active");
  const pausedSubscriptions = subscriptions.filter((s) => s.status === "paused");
  const pastSubscriptions = subscriptions.filter((s) => s.status === "cancelled");

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />

      <main className="flex-1 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Page Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">My Subscription</h1>
              <p className="text-gray-500 mt-1">Manage your recurring box deliveries</p>
            </div>
            {!activeSubscription && (
              <Link href="/build-box">
                <Button leftIcon={<Plus className="w-4 h-4" />}>Start Subscription</Button>
              </Link>
            )}
          </div>

          {/* Active Subscription */}
          {activeSubscription ? (
            <Card className="mb-8 overflow-hidden">
              <div className="bg-gradient-to-r from-aura-primary to-aura-secondary p-6 text-white">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                      <Package className="w-6 h-6" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold capitalize">
                        {activeSubscription.box_size} Box
                      </h2>
                      <p className="text-white/80">
                        {BOX_CONFIGS[activeSubscription.box_size]?.slots || 0} meals per delivery
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-3xl font-bold">
                      {formatCurrency(activeSubscription.price)}
                    </p>
                    <p className="text-white/80">per month</p>
                  </div>
                </div>
              </div>

              <div className="p-6">
                <div className="grid sm:grid-cols-3 gap-6 mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-aura-light rounded-lg flex items-center justify-center">
                      <Calendar className="w-5 h-5 text-aura-primary" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Next Delivery</p>
                      <p className="font-semibold">
                        {activeSubscription.next_delivery_date
                          ? formatDate(activeSubscription.next_delivery_date)
                          : "Not scheduled"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-aura-light rounded-lg flex items-center justify-center">
                      <RefreshCcw className="w-5 h-5 text-aura-primary" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Frequency</p>
                      <p className="font-semibold">
                        Every {activeSubscription.delivery_frequency_days} days
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Status</p>
                      <p className="font-semibold text-green-600">Active</p>
                    </div>
                  </div>
                </div>

                {/* Box Contents */}
                {activeSubscription.box_config && activeSubscription.box_config.length > 0 && (
                  <div className="mb-6 p-4 bg-gray-50 rounded-xl">
                    <h4 className="font-medium mb-3">Your Box Contents</h4>
                    <div className="flex flex-wrap gap-2">
                      {getProductNames(activeSubscription.box_config).map((name, index) => (
                        <span
                          key={index}
                          className="px-3 py-1.5 bg-white border border-gray-200 rounded-full text-sm"
                        >
                          {name}
                        </span>
                      ))}
                      {activeSubscription.box_config.length > 3 && (
                        <span className="px-3 py-1.5 text-sm text-gray-500">
                          +{activeSubscription.box_config.length - 3} more
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex flex-wrap gap-3">
                  <Link href="/build-box">
                    <Button variant="outline" leftIcon={<Edit className="w-4 h-4" />}>
                      Edit Box Contents
                    </Button>
                  </Link>
                  <Button
                    variant="outline"
                    leftIcon={<Pause className="w-4 h-4" />}
                    onClick={() => {
                      setSelectedSubscription(activeSubscription);
                      setShowPauseModal(true);
                    }}
                  >
                    Pause Subscription
                  </Button>
                  <Button
                    variant="outline"
                    className="!text-red-600 !border-red-200 hover:!bg-red-50"
                    leftIcon={<XCircle className="w-4 h-4" />}
                    onClick={() => {
                      setSelectedSubscription(activeSubscription);
                      setShowCancelModal(true);
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </Card>
          ) : (
            <Card className="mb-8 p-8 text-center">
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Package className="w-10 h-10 text-gray-400" />
              </div>
              <h2 className="text-xl font-semibold mb-2">No Active Subscription</h2>
              <p className="text-gray-500 mb-6 max-w-md mx-auto">
                Start your subscription today and get premium, shelf-stable meals delivered to
                your door every month.
              </p>
              <Link href="/build-box">
                <Button size="lg" rightIcon={<ArrowRight className="w-5 h-5" />}>
                  Build Your First Box
                </Button>
              </Link>
            </Card>
          )}

          {/* Paused Subscriptions */}
          {pausedSubscriptions.length > 0 && (
            <div className="mb-8">
              <h3 className="text-lg font-semibold mb-4">Paused Subscriptions</h3>
              <div className="space-y-4">
                {pausedSubscriptions.map((sub) => (
                  <Card key={sub.id} padding="lg">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center">
                          <Pause className="w-6 h-6 text-amber-600" />
                        </div>
                        <div>
                          <h4 className="font-semibold capitalize">{sub.box_size} Box</h4>
                          <p className="text-sm text-gray-500">
                            {formatCurrency(sub.price)}/month - Paused
                          </p>
                        </div>
                      </div>
                      <Button
                        leftIcon={<Play className="w-4 h-4" />}
                        onClick={() => handleResume(sub.id)}
                        isLoading={isUpdating}
                      >
                        Resume
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Subscription Benefits */}
          <Card padding="lg" className="mb-8">
            <h3 className="text-lg font-semibold mb-4">Subscription Benefits</h3>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-aura-light rounded-lg flex items-center justify-center flex-shrink-0">
                  <Truck className="w-5 h-5 text-aura-primary" />
                </div>
                <div>
                  <p className="font-medium">Free Shipping</p>
                  <p className="text-sm text-gray-500">
                    All subscription orders ship free
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-aura-light rounded-lg flex items-center justify-center flex-shrink-0">
                  <RefreshCcw className="w-5 h-5 text-aura-primary" />
                </div>
                <div>
                  <p className="font-medium">Flexible Schedule</p>
                  <p className="text-sm text-gray-500">
                    Pause, skip, or cancel anytime
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-aura-light rounded-lg flex items-center justify-center flex-shrink-0">
                  <Edit className="w-5 h-5 text-aura-primary" />
                </div>
                <div>
                  <p className="font-medium">Customize Your Box</p>
                  <p className="text-sm text-gray-500">
                    Change your meals before each delivery
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-aura-light rounded-lg flex items-center justify-center flex-shrink-0">
                  <CreditCard className="w-5 h-5 text-aura-primary" />
                </div>
                <div>
                  <p className="font-medium">Save Money</p>
                  <p className="text-sm text-gray-500">
                    Subscribers save up to 15% per meal
                  </p>
                </div>
              </div>
            </div>
          </Card>

          {/* Past Subscriptions */}
          {pastSubscriptions.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-4">Past Subscriptions</h3>
              <div className="space-y-4">
                {pastSubscriptions.map((sub) => (
                  <Card key={sub.id} padding="md" className="bg-gray-50">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium capitalize">{sub.box_size} Box</h4>
                        <p className="text-sm text-gray-500">
                          Cancelled on {formatDate(sub.updated_at)}
                        </p>
                      </div>
                      <Badge variant="default">Cancelled</Badge>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>

      <Footer />

      {/* Pause Modal */}
      <Modal
        isOpen={showPauseModal}
        onClose={() => {
          setShowPauseModal(false);
          setSelectedSubscription(null);
        }}
        title="Pause Subscription"
        size="sm"
      >
        <div className="text-center">
          <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Pause className="w-8 h-8 text-amber-600" />
          </div>
          <p className="text-gray-600 mb-6">
            Are you sure you want to pause your subscription? You can resume anytime.
          </p>
          <div className="flex gap-3">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => {
                setShowPauseModal(false);
                setSelectedSubscription(null);
              }}
            >
              Keep Active
            </Button>
            <Button className="flex-1" onClick={handlePause} isLoading={isUpdating}>
              Pause Subscription
            </Button>
          </div>
        </div>
      </Modal>

      {/* Cancel Modal */}
      <Modal
        isOpen={showCancelModal}
        onClose={() => {
          setShowCancelModal(false);
          setSelectedSubscription(null);
        }}
        title="Cancel Subscription"
        size="sm"
      >
        <div className="text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-8 h-8 text-red-600" />
          </div>
          <p className="text-gray-600 mb-6">
            Are you sure you want to cancel? You'll lose access to subscriber benefits and
            your box won't renew.
          </p>
          <div className="flex gap-3">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => {
                setShowCancelModal(false);
                setSelectedSubscription(null);
              }}
            >
              Keep Subscription
            </Button>
            <Button
              className="flex-1 !bg-red-600 hover:!bg-red-700"
              onClick={handleCancel}
              isLoading={isUpdating}
            >
              Cancel Subscription
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
