"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/hooks";
import { Card, Button, Header, Footer } from "@/components/ui";
import { cn, formatCurrency, formatDate } from "@/lib/utils";
import type { Order, OrderItem } from "@/types";
import type { Json } from "@/types/database";
import {
  Loader2,
  Package,
  Truck,
  MapPin,
  ExternalLink,
  CheckCircle2,
  Circle,
  Clock,
  ArrowLeft,
  Phone,
  Mail,
  Copy,
  Check,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface TrackingEvent {
  status: string;
  message: string;
  location?: string;
  timestamp: string;
}

interface TrackingInfo {
  trackingNumber: string;
  carrier: string;
  status: string;
  estimatedDelivery?: string;
  events: TrackingEvent[];
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function parseItems(items: Json): OrderItem[] {
  if (Array.isArray(items)) return items as unknown as OrderItem[];
  return [];
}

function parseAddress(
  address: Json
): Record<string, string> | null {
  if (address && typeof address === "object" && !Array.isArray(address)) {
    return address as Record<string, string>;
  }
  return null;
}

function statusLabel(status: string): string {
  const labels: Record<string, string> = {
    pre_transit: "Label Created",
    in_transit: "In Transit",
    out_for_delivery: "Out for Delivery",
    delivered: "Delivered",
    pending: "Pending",
    processing: "Processing",
    shipped: "Shipped",
    cancelled: "Cancelled",
  };
  return labels[status] ?? status.charAt(0).toUpperCase() + status.slice(1).replace(/_/g, " ");
}

function statusColor(status: string): string {
  switch (status) {
    case "delivered":
      return "bg-green-100 text-green-700 border-green-200";
    case "shipped":
    case "in_transit":
    case "out_for_delivery":
      return "bg-blue-100 text-blue-700 border-blue-200";
    case "processing":
      return "bg-amber-100 text-amber-700 border-amber-200";
    case "cancelled":
      return "bg-red-100 text-red-700 border-red-200";
    default:
      return "bg-gray-100 text-gray-700 border-gray-200";
  }
}

function eventDotColor(status: string): string {
  switch (status) {
    case "delivered":
      return "bg-green-500";
    case "out_for_delivery":
      return "bg-blue-500";
    case "in_transit":
      return "bg-blue-400";
    case "pre_transit":
      return "bg-gray-400";
    default:
      return "bg-gray-300";
  }
}

function eventIcon(status: string) {
  switch (status) {
    case "delivered":
      return <CheckCircle2 className="w-5 h-5 text-green-500" />;
    case "out_for_delivery":
      return <Truck className="w-5 h-5 text-blue-500" />;
    case "in_transit":
      return <Package className="w-5 h-5 text-blue-400" />;
    default:
      return <Circle className="w-5 h-5 text-gray-400" />;
  }
}

function formatTimestamp(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function OrderTrackingPage() {
  const router = useRouter();
  const params = useParams();
  const orderId = params.id as string;
  const { profile, isLoading: authLoading, isAuthenticated } = useAuth();

  const [order, setOrder] = useState<Order | null>(null);
  const [tracking, setTracking] = useState<TrackingInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [trackingLoading, setTrackingLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const supabase = createClient();

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push(`/auth/login?redirectTo=/orders/${orderId}`);
    }
  }, [authLoading, isAuthenticated, router, orderId]);

  // Fetch order
  useEffect(() => {
    const fetchOrder = async () => {
      if (!profile) return;

      const { data, error } = await supabase
        .from("aura_orders")
        .select("*")
        .eq("id", orderId)
        .single();

      if (error || !data) {
        console.error("Failed to fetch order:", error);
        setIsLoading(false);
        return;
      }

      // Verify ownership (client-side guard)
      if (data.user_id !== profile.id && profile.role !== "admin") {
        router.push("/orders");
        return;
      }

      setOrder(data as Order);
      setIsLoading(false);
    };

    if (profile) fetchOrder();
  }, [profile, supabase, orderId, router]);

  // Fetch tracking
  useEffect(() => {
    const fetchTracking = async () => {
      if (!order?.tracking_number) return;
      setTrackingLoading(true);

      try {
        const res = await fetch(`/api/shipping/track?orderId=${order.id}`);
        const json = await res.json();
        if (json.success && json.data) {
          setTracking(json.data);
        }
      } catch (err) {
        console.error("Failed to fetch tracking:", err);
      }

      setTrackingLoading(false);
    };

    if (order) fetchTracking();
  }, [order]);

  const copyTrackingNumber = () => {
    if (!order?.tracking_number) return;
    navigator.clipboard.writeText(order.tracking_number);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Loading state
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

  // Not found
  if (!order) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 bg-gray-50">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 py-16 text-center">
            <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Order Not Found
            </h1>
            <p className="text-gray-500 mb-6">
              We could not find this order. It may have been removed or you do
              not have access.
            </p>
            <Button variant="primary" onClick={() => router.push("/orders")}>
              Back to Orders
            </Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const items = parseItems(order.items);
  const address = parseAddress(order.shipping_address);
  const metadata = order.metadata as Record<string, Json> | null;
  const carrier = (metadata?.carrier as string) ?? null;
  const service = (metadata?.service as string) ?? null;
  const labelUrl = (metadata?.labelUrl as string) ?? null;
  const isShipped = ["shipped", "delivered"].includes(order.status);
  const isDelivered = order.status === "delivered";

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />

      <main className="flex-1">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Back link */}
          <button
            onClick={() => router.push("/orders")}
            className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 mb-6 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Orders
          </button>

          {/* Order Header */}
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-8">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
                Order {order.order_number}
              </h1>
              <p className="text-gray-500 mt-1">
                Placed on {formatDate(order.created_at)}
              </p>
            </div>
            <span
              className={cn(
                "inline-flex items-center px-3 py-1.5 rounded-full text-sm font-semibold border self-start",
                statusColor(order.status)
              )}
            >
              {statusLabel(order.status)}
            </span>
          </div>

          {/* Shipping Progress Bar (for shipped orders) */}
          {isShipped && (
            <Card padding="lg" className="mb-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div
                    className={cn(
                      "w-10 h-10 rounded-full flex items-center justify-center",
                      isDelivered ? "bg-green-100" : "bg-blue-100"
                    )}
                  >
                    {isDelivered ? (
                      <CheckCircle2 className="w-5 h-5 text-green-600" />
                    ) : (
                      <Truck className="w-5 h-5 text-blue-600" />
                    )}
                  </div>
                  <div>
                    <h2 className="font-semibold text-gray-900">
                      {isDelivered
                        ? "Delivered"
                        : tracking?.status === "out_for_delivery"
                          ? "Out for Delivery"
                          : "In Transit"}
                    </h2>
                    {tracking?.estimatedDelivery && !isDelivered && (
                      <p className="text-sm text-gray-500">
                        Estimated delivery:{" "}
                        {formatDate(tracking.estimatedDelivery)}
                      </p>
                    )}
                    {order.delivered_at && isDelivered && (
                      <p className="text-sm text-gray-500">
                        Delivered on {formatDate(order.delivered_at)}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Progress steps */}
              <div className="relative">
                <div className="flex items-center justify-between">
                  {["Label Created", "Shipped", "In Transit", "Delivered"].map(
                    (step, idx) => {
                      const progressMap: Record<string, number> = {
                        pre_transit: 0,
                        in_transit: 2,
                        out_for_delivery: 2,
                        shipped: 1,
                        delivered: 3,
                      };
                      const currentStep = progressMap[tracking?.status ?? order.status] ?? 1;
                      const isComplete = idx <= currentStep;
                      const isCurrent = idx === currentStep;

                      return (
                        <div
                          key={step}
                          className="flex flex-col items-center flex-1"
                        >
                          <div
                            className={cn(
                              "w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold z-10 transition-colors",
                              isComplete
                                ? isCurrent
                                  ? "bg-blue-500 text-white ring-4 ring-blue-100"
                                  : "bg-green-500 text-white"
                                : "bg-gray-200 text-gray-500"
                            )}
                          >
                            {isComplete && !isCurrent ? (
                              <Check className="w-4 h-4" />
                            ) : (
                              idx + 1
                            )}
                          </div>
                          <span
                            className={cn(
                              "text-xs mt-2 font-medium text-center",
                              isComplete ? "text-gray-900" : "text-gray-400"
                            )}
                          >
                            {step}
                          </span>
                        </div>
                      );
                    }
                  )}
                </div>
                {/* Connector line */}
                <div className="absolute top-4 left-0 right-0 h-0.5 bg-gray-200 -z-0 mx-12" />
                <div
                  className="absolute top-4 left-0 h-0.5 bg-green-500 -z-0 mx-12 transition-all duration-500"
                  style={{
                    width: (() => {
                      const progressMap: Record<string, number> = {
                        pre_transit: 0,
                        in_transit: 66,
                        out_for_delivery: 66,
                        shipped: 33,
                        delivered: 100,
                      };
                      return `${progressMap[tracking?.status ?? order.status] ?? 33}%`;
                    })(),
                  }}
                />
              </div>
            </Card>
          )}

          <div className="grid lg:grid-cols-3 gap-6">
            {/* Left column: Tracking + Items */}
            <div className="lg:col-span-2 space-y-6">
              {/* Tracking Details Card */}
              {order.tracking_number && (
                <Card padding="lg">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Shipment Details
                  </h3>

                  <div className="grid sm:grid-cols-2 gap-4 mb-6">
                    <div>
                      <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
                        Tracking Number
                      </p>
                      <div className="flex items-center gap-2">
                        <code className="text-sm font-mono text-gray-900 bg-gray-50 px-2 py-1 rounded">
                          {order.tracking_number}
                        </code>
                        <button
                          onClick={copyTrackingNumber}
                          className="p-1 rounded hover:bg-gray-100 transition-colors"
                          aria-label="Copy tracking number"
                        >
                          {copied ? (
                            <Check className="w-4 h-4 text-green-500" />
                          ) : (
                            <Copy className="w-4 h-4 text-gray-400" />
                          )}
                        </button>
                      </div>
                    </div>

                    {carrier && (
                      <div>
                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
                          Carrier & Service
                        </p>
                        <p className="text-sm text-gray-900 font-medium">
                          {carrier}
                          {service && ` - ${service}`}
                        </p>
                      </div>
                    )}
                  </div>

                  {order.tracking_url && (
                    <a
                      href={order.tracking_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-sm font-medium text-aura-primary hover:underline mb-6"
                    >
                      Track on {carrier ?? "carrier"} website
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  )}

                  {/* Tracking Timeline */}
                  {trackingLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
                      <span className="ml-2 text-sm text-gray-500">
                        Loading tracking events...
                      </span>
                    </div>
                  ) : tracking && tracking.events.length > 0 ? (
                    <div className="relative pl-6 border-l-2 border-gray-200 space-y-6">
                      {tracking.events.map((event, idx) => (
                        <div key={idx} className="relative">
                          {/* Timeline dot */}
                          <div
                            className={cn(
                              "absolute -left-[25px] w-3 h-3 rounded-full border-2 border-white",
                              idx === 0
                                ? eventDotColor(event.status)
                                : "bg-gray-300"
                            )}
                          />

                          <div className="flex items-start gap-3">
                            <div className="flex-shrink-0 mt-0.5">
                              {idx === 0
                                ? eventIcon(event.status)
                                : <Circle className="w-5 h-5 text-gray-300" />}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p
                                className={cn(
                                  "text-sm font-medium",
                                  idx === 0 ? "text-gray-900" : "text-gray-600"
                                )}
                              >
                                {event.message}
                              </p>
                              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1">
                                {event.location && (
                                  <span className="text-xs text-gray-500 flex items-center gap-1">
                                    <MapPin className="w-3 h-3" />
                                    {event.location}
                                  </span>
                                )}
                                <span className="text-xs text-gray-400 flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  {formatTimestamp(event.timestamp)}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    !trackingLoading && (
                      <p className="text-sm text-gray-500 py-4">
                        No tracking events available yet. Check back soon.
                      </p>
                    )
                  )}
                </Card>
              )}

              {/* Route Summary */}
              {isShipped && (
                <Card padding="lg">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Shipment Route
                  </h3>
                  <div className="flex items-center gap-4">
                    <div className="flex-1 text-center">
                      <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-2">
                        <Package className="w-6 h-6 text-blue-600" />
                      </div>
                      <p className="text-sm font-semibold text-gray-900">
                        El Paso, TX
                      </p>
                      <p className="text-xs text-gray-500">Origin</p>
                    </div>

                    <div className="flex-1 flex items-center justify-center">
                      <div className="w-full border-t-2 border-dashed border-gray-300 relative">
                        <Truck className="w-5 h-5 text-blue-500 absolute -top-2.5 left-1/2 -translate-x-1/2 bg-white" />
                      </div>
                    </div>

                    <div className="flex-1 text-center">
                      <div className="w-12 h-12 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-2">
                        <MapPin className="w-6 h-6 text-green-600" />
                      </div>
                      <p className="text-sm font-semibold text-gray-900">
                        {address
                          ? `${address.city ?? ""}${address.city && address.state ? ", " : ""}${address.state ?? ""}`
                          : "Destination"}
                      </p>
                      <p className="text-xs text-gray-500">Destination</p>
                    </div>
                  </div>
                </Card>
              )}

              {/* Order Items */}
              <Card padding="lg">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Order Items
                </h3>
                {items.length > 0 ? (
                  <div className="divide-y divide-gray-100">
                    {items.map((item, idx) => (
                      <div
                        key={idx}
                        className="flex items-center gap-4 py-3 first:pt-0 last:pb-0"
                      >
                        {item.image ? (
                          <img
                            src={item.image}
                            alt={item.name}
                            className="w-14 h-14 rounded-lg object-cover bg-gray-100"
                          />
                        ) : (
                          <div className="w-14 h-14 rounded-lg bg-gray-100 flex items-center justify-center">
                            <Package className="w-6 h-6 text-gray-300" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {item.name}
                          </p>
                          <p className="text-xs text-gray-500">
                            Qty: {item.quantity}
                          </p>
                        </div>
                        <p className="text-sm font-medium text-gray-900">
                          {formatCurrency(item.price * item.quantity)}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">
                    Item details are not available.
                  </p>
                )}

                {/* Totals */}
                <div className="mt-4 pt-4 border-t border-gray-100 space-y-2 text-sm">
                  <div className="flex justify-between text-gray-500">
                    <span>Subtotal</span>
                    <span>{formatCurrency(order.subtotal)}</span>
                  </div>
                  {order.discount > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>Discount</span>
                      <span>-{formatCurrency(order.discount)}</span>
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
                  <div className="flex justify-between font-semibold text-gray-900 pt-2 border-t border-gray-100">
                    <span>Total</span>
                    <span>{formatCurrency(order.total)}</span>
                  </div>
                </div>
              </Card>
            </div>

            {/* Right column: Shipping Address + Support */}
            <div className="space-y-6">
              {/* Shipping Address */}
              {address && (
                <Card padding="lg">
                  <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-gray-500" />
                    Shipping Address
                  </h3>
                  <div className="text-sm text-gray-600 space-y-0.5">
                    {(address.firstName || address.lastName) && (
                      <p className="font-medium text-gray-900">
                        {[address.firstName, address.lastName]
                          .filter(Boolean)
                          .join(" ")}
                      </p>
                    )}
                    {address.name && !address.firstName && (
                      <p className="font-medium text-gray-900">{address.name}</p>
                    )}
                    {(address.address1 || address.street1) && (
                      <p>{address.address1 ?? address.street1}</p>
                    )}
                    {(address.address2 || address.street2) && (
                      <p>{address.address2 ?? address.street2}</p>
                    )}
                    <p>
                      {[address.city, address.state, address.zipCode ?? address.zip]
                        .filter(Boolean)
                        .join(", ")}
                    </p>
                    {address.country && address.country !== "US" && (
                      <p>{address.country}</p>
                    )}
                  </div>
                </Card>
              )}

              {/* Label download (if available, for admins) */}
              {labelUrl && (
                <Card padding="lg">
                  <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <Truck className="w-4 h-4 text-gray-500" />
                    Shipping Label
                  </h3>
                  <a
                    href={labelUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-sm font-medium text-aura-primary hover:underline"
                  >
                    Download Label (PDF)
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </Card>
              )}

              {/* Need Help */}
              <Card padding="lg">
                <h3 className="text-sm font-semibold text-gray-900 mb-3">
                  Need Help?
                </h3>
                <p className="text-sm text-gray-500 mb-4">
                  Having an issue with your order? Our support team is here for
                  you.
                </p>
                <div className="space-y-3">
                  <a
                    href="mailto:support@aura.com"
                    className="flex items-center gap-2 text-sm text-gray-700 hover:text-aura-primary transition-colors"
                  >
                    <Mail className="w-4 h-4 text-gray-400" />
                    support@aura.com
                  </a>
                  <a
                    href="tel:1-800-287-2669"
                    className="flex items-center gap-2 text-sm text-gray-700 hover:text-aura-primary transition-colors"
                  >
                    <Phone className="w-4 h-4 text-gray-400" />
                    1-800-AURA-NOW
                  </a>
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
