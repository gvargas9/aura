"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/hooks";
import { Header, Footer, Card, Button, Badge } from "@/components/ui";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { Order } from "@/types";
import {
  Package,
  Loader2,
  Truck,
  CheckCircle,
  Clock,
  XCircle,
  ArrowLeft,
  Download,
  MapPin,
  CreditCard,
  RefreshCcw,
} from "lucide-react";

const statusConfig: Record<
  string,
  { variant: "default" | "success" | "warning" | "error" | "info"; icon: React.ReactNode; label: string }
> = {
  pending: { variant: "warning", icon: <Clock className="w-4 h-4" />, label: "Pending" },
  processing: { variant: "info", icon: <RefreshCcw className="w-4 h-4" />, label: "Processing" },
  shipped: { variant: "info", icon: <Truck className="w-4 h-4" />, label: "Shipped" },
  delivered: { variant: "success", icon: <CheckCircle className="w-4 h-4" />, label: "Delivered" },
  cancelled: { variant: "error", icon: <XCircle className="w-4 h-4" />, label: "Cancelled" },
};

const statusSteps = ["pending", "processing", "shipped", "delivered"];

export default function OrderDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { user, isLoading: authLoading, isAuthenticated } = useAuth();
  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const supabase = createClient();

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/auth/login?redirectTo=/orders");
    }
  }, [authLoading, isAuthenticated, router]);

  useEffect(() => {
    const fetchOrder = async () => {
      const orderId = Array.isArray(params.id) ? params.id[0] : params.id;
      if (!user || !orderId) return;

      const { data, error } = await supabase
        .from("aura_orders")
        .select("*")
        .eq("id", orderId)
        .eq("user_id", user.id)
        .single();

      if (error || !data) {
        router.push("/orders");
        return;
      }

      setOrder(data);
      setIsLoading(false);
    };

    if (user) {
      fetchOrder();
    }
  }, [user, params, supabase, router]);

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-aura-primary" />
      </div>
    );
  }

  if (!order) {
    return null;
  }

  const config = statusConfig[order.status] || statusConfig.pending;
  const items = order.items as Array<{ name: string; quantity: number; price: number; sku?: string }>;
  const shipping = order.shipping_address as {
    firstName?: string;
    lastName?: string;
    address1?: string;
    address2?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    country?: string;
  } | null;

  const currentStep = statusSteps.indexOf(order.status);

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />

      <main className="flex-1 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Back Link */}
          <Link
            href="/orders"
            className="inline-flex items-center text-gray-600 hover:text-aura-primary mb-6"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Orders
          </Link>

          {/* Order Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Order #{order.order_number || order.id.slice(0, 8)}
              </h1>
              <p className="text-gray-500 mt-1">Placed on {formatDate(order.created_at)}</p>
            </div>
            <Badge variant={config.variant} size="md">
              <span className="flex items-center gap-2">
                {config.icon}
                {config.label}
              </span>
            </Badge>
          </div>

          {/* Order Progress */}
          {order.status !== "cancelled" && (
            <Card padding="lg" className="mb-6">
              <h3 className="font-semibold mb-4">Order Progress</h3>
              <div className="relative">
                <div className="absolute top-4 left-0 right-0 h-1 bg-gray-200 rounded-full" />
                <div
                  className="absolute top-4 left-0 h-1 bg-aura-primary rounded-full transition-all"
                  style={{ width: `${(currentStep / (statusSteps.length - 1)) * 100}%` }}
                />
                <div className="relative flex justify-between">
                  {statusSteps.map((step, index) => {
                    const stepConfig = statusConfig[step];
                    const isCompleted = index <= currentStep;
                    const isCurrent = index === currentStep;

                    return (
                      <div key={step} className="flex flex-col items-center">
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center z-10 ${
                            isCompleted
                              ? "bg-aura-primary text-white"
                              : "bg-gray-200 text-gray-400"
                          } ${isCurrent ? "ring-4 ring-aura-primary/20" : ""}`}
                        >
                          {stepConfig.icon}
                        </div>
                        <span
                          className={`text-xs mt-2 font-medium ${
                            isCompleted ? "text-aura-primary" : "text-gray-400"
                          }`}
                        >
                          {stepConfig.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Tracking Info */}
              {order.tracking_number && (
                <div className="mt-6 pt-4 border-t border-gray-100">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Truck className="w-5 h-5 text-aura-primary" />
                      <span className="text-gray-600">Tracking Number:</span>
                      <code className="px-2 py-1 bg-gray-100 rounded font-mono">
                        {order.tracking_number}
                      </code>
                    </div>
                    <Button variant="outline" size="sm">
                      Track Package
                    </Button>
                  </div>
                </div>
              )}
            </Card>
          )}

          <div className="grid lg:grid-cols-3 gap-6">
            {/* Order Items */}
            <div className="lg:col-span-2">
              <Card padding="lg">
                <h3 className="font-semibold mb-4">Order Items</h3>
                <div className="space-y-4">
                  {items?.map((item, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-xl"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-16 h-16 bg-white rounded-lg flex items-center justify-center border border-gray-200">
                          <Package className="w-8 h-8 text-gray-300" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{item.name}</p>
                          {item.sku && (
                            <p className="text-sm text-gray-500">SKU: {item.sku}</p>
                          )}
                          <p className="text-sm text-gray-500">Qty: {item.quantity}</p>
                        </div>
                      </div>
                      <p className="font-semibold">
                        {formatCurrency(item.price * item.quantity)}
                      </p>
                    </div>
                  ))}
                </div>
              </Card>
            </div>

            {/* Order Summary Sidebar */}
            <div className="space-y-6">
              {/* Shipping Address */}
              <Card padding="lg">
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  Shipping Address
                </h3>
                {shipping && (
                  <div className="text-sm text-gray-600 space-y-1">
                    <p className="font-medium text-gray-900">
                      {shipping.firstName} {shipping.lastName}
                    </p>
                    <p>{shipping.address1}</p>
                    {shipping.address2 && <p>{shipping.address2}</p>}
                    <p>
                      {shipping.city}, {shipping.state} {shipping.zipCode}
                    </p>
                    <p>{shipping.country}</p>
                  </div>
                )}
              </Card>

              {/* Order Summary */}
              <Card padding="lg">
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <CreditCard className="w-4 h-4" />
                  Order Summary
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Subtotal</span>
                    <span>{formatCurrency(order.subtotal)}</span>
                  </div>
                  {order.discount > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>Discount</span>
                      <span>-{formatCurrency(order.discount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-gray-500">Shipping</span>
                    <span>
                      {order.shipping > 0 ? formatCurrency(order.shipping) : "FREE"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Tax</span>
                    <span>{formatCurrency(order.tax)}</span>
                  </div>
                  <div className="flex justify-between font-semibold text-lg pt-2 border-t border-gray-200">
                    <span>Total</span>
                    <span>{formatCurrency(order.total)}</span>
                  </div>
                </div>
              </Card>

              {/* Actions */}
              <Card padding="lg">
                <h3 className="font-semibold mb-3">Need Help?</h3>
                <div className="space-y-2">
                  <Button variant="outline" className="w-full" leftIcon={<Download className="w-4 h-4" />}>
                    Download Invoice
                  </Button>
                  <Link href="/contact">
                    <Button variant="ghost" className="w-full">
                      Contact Support
                    </Button>
                  </Link>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
