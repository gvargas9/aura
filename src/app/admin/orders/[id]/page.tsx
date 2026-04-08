"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/hooks";
import { useLocale } from "@/hooks/useLocale";
import { Card, Button, Input } from "@/components/ui";
import { cn, formatDate } from "@/lib/utils";
import type { OrderStatus } from "@/types/database";
import type { Json } from "@/types/database";
import {
  ArrowLeft,
  Loader2,
  Package,
  Truck,
  MapPin,
  User,
  CreditCard,
  Save,
  Printer,
  ExternalLink,
  CheckCircle2,
  Circle,
  Clock,
  DollarSign,
  Tag,
  Handshake,
  RefreshCw,
} from "lucide-react";
import Link from "next/link";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ShipmentRate {
  id: string;
  carrier: string;
  service: string;
  rate: number;
  estimatedDays: number;
  deliveryDate?: string;
}

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

interface OrderWithProfile {
  id: string;
  order_number: string;
  user_id: string;
  subscription_id: string | null;
  organization_id: string | null;
  dealer_attribution_id: string | null;
  stripe_payment_intent_id: string | null;
  stripe_invoice_id: string | null;
  status: OrderStatus;
  subtotal: number;
  discount: number;
  shipping: number;
  tax: number;
  total: number;
  currency: string;
  items: Json;
  shipping_address: Json;
  billing_address: Json | null;
  tracking_number: string | null;
  tracking_url: string | null;
  shipped_at: string | null;
  delivered_at: string | null;
  notes: string | null;
  internal_notes: string | null;
  purchase_type: string;
  metadata: Json | null;
  created_at: string;
  updated_at: string;
  profiles: {
    full_name: string | null;
    email: string;
    phone: string | null;
  } | null;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const STATUS_OPTIONS: OrderStatus[] = [
  "pending",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
];

function statusBadgeClass(status: string): string {
  switch (status) {
    case "delivered":
      return "bg-green-100 text-green-700";
    case "shipped":
      return "bg-blue-100 text-blue-700";
    case "processing":
      return "bg-amber-100 text-amber-700";
    case "cancelled":
      return "bg-red-100 text-red-700";
    default:
      return "bg-gray-100 text-gray-700";
  }
}

function formatTimestamp(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
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

export default function AdminOrderDetailPage() {
  const router = useRouter();
  const params = useParams();
  const orderId = params.id as string;
  const { profile } = useAuth();
  const { t, formatPrice } = useLocale();
  const supabase = createClient();

  const [order, setOrder] = useState<OrderWithProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Status update
  const [editStatus, setEditStatus] = useState<OrderStatus>("pending");
  const [editInternalNotes, setEditInternalNotes] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");

  // Shipping rates
  const [rates, setRates] = useState<ShipmentRate[]>([]);
  const [ratesLoading, setRatesLoading] = useState(false);
  const [selectedRateId, setSelectedRateId] = useState<string | null>(null);
  const [labelCreating, setLabelCreating] = useState(false);
  const [labelMessage, setLabelMessage] = useState("");

  // Tracking
  const [tracking, setTracking] = useState<TrackingInfo | null>(null);
  const [trackingLoading, setTrackingLoading] = useState(false);

  // ---------------------------------------------------------------------------
  // Data fetching
  // ---------------------------------------------------------------------------

  const fetchOrder = useCallback(async () => {
    if (!profile || profile.role !== "admin") return;

    const { data, error } = await supabase
      .from("aura_orders")
      .select("*, profiles!aura_orders_user_id_fkey(full_name, email, phone)")
      .eq("id", orderId)
      .single();

    if (error) {
      // Fallback without FK hint
      const { data: fbData } = await supabase
        .from("aura_orders")
        .select("*, profiles(full_name, email, phone)")
        .eq("id", orderId)
        .single();

      if (fbData) {
        const typed = fbData as unknown as OrderWithProfile;
        setOrder(typed);
        setEditStatus(typed.status);
        setEditInternalNotes(typed.internal_notes ?? "");
      }
    } else if (data) {
      const typed = data as unknown as OrderWithProfile;
      setOrder(typed);
      setEditStatus(typed.status);
      setEditInternalNotes(typed.internal_notes ?? "");
    }

    setIsLoading(false);
  }, [profile, supabase, orderId]);

  useEffect(() => {
    fetchOrder();
  }, [fetchOrder]);

  // Fetch tracking when order has tracking number
  useEffect(() => {
    if (!order?.tracking_number) return;
    setTrackingLoading(true);

    fetch(`/api/shipping/track?orderId=${order.id}`)
      .then((res) => res.json())
      .then((json) => {
        if (json.success && json.data) setTracking(json.data);
      })
      .catch((err) => console.error("Tracking fetch error:", err))
      .finally(() => setTrackingLoading(false));
  }, [order?.id, order?.tracking_number]);

  // ---------------------------------------------------------------------------
  // Handlers
  // ---------------------------------------------------------------------------

  const handleSaveOrder = async () => {
    if (!order) return;
    setIsSaving(true);
    setSaveMessage("");

    const updates: Record<string, unknown> = {
      status: editStatus,
      internal_notes: editInternalNotes,
      updated_at: new Date().toISOString(),
    };

    if (editStatus === "delivered" && order.status !== "delivered") {
      updates.delivered_at = new Date().toISOString();
    }

    const { error } = await supabase
      .from("aura_orders")
      .update(updates)
      .eq("id", order.id);

    if (error) {
      setSaveMessage(`Error: ${error.message}`);
    } else {
      setSaveMessage("Order updated successfully");
      fetchOrder();
    }
    setIsSaving(false);
  };

  const handleGetRates = async () => {
    if (!order) return;
    setRatesLoading(true);
    setRates([]);
    setLabelMessage("");

    try {
      const res = await fetch("/api/shipping/rates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          shippingAddress: order.shipping_address,
        }),
      });
      const json = await res.json();
      if (json.success && json.data?.rates) {
        setRates(json.data.rates);
      } else {
        setLabelMessage(json.error ?? "Failed to fetch rates");
      }
    } catch (err) {
      console.error("Rates error:", err);
      setLabelMessage("Network error fetching rates");
    }

    setRatesLoading(false);
  };

  const handleCreateLabel = async () => {
    if (!order || !selectedRateId) return;
    setLabelCreating(true);
    setLabelMessage("");

    try {
      const res = await fetch("/api/shipping/label", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: order.id,
          rateId: selectedRateId,
        }),
      });
      const json = await res.json();
      if (json.success) {
        setLabelMessage("Label created and order marked as shipped");
        setRates([]);
        setSelectedRateId(null);
        fetchOrder();
      } else {
        setLabelMessage(json.error ?? "Failed to create label");
      }
    } catch (err) {
      console.error("Label creation error:", err);
      setLabelMessage("Network error creating label");
    }

    setLabelCreating(false);
  };

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-aura-primary" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="text-center py-20">
        <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
        <p className="text-gray-500 font-medium">{t("admin.orderNotFound")}</p>
        <Link
          href="/admin/orders"
          className="text-sm text-aura-primary hover:underline mt-2 inline-block"
        >
          {t("admin.backToOrders")}
        </Link>
      </div>
    );
  }

  const items = Array.isArray(order.items)
    ? (order.items as { name?: string; quantity?: number; price?: number; image?: string; sku?: string }[])
    : [];
  const address =
    order.shipping_address && typeof order.shipping_address === "object"
      ? (order.shipping_address as Record<string, string>)
      : null;
  const metadata = order.metadata as Record<string, Json> | null;
  const carrier = (metadata?.carrier as string) ?? null;
  const service = (metadata?.service as string) ?? null;
  const labelUrl = (metadata?.labelUrl as string) ?? null;
  const hasLabel = !!order.tracking_number;

  return (
    <>
      {/* Header */}
      <div className="mb-8">
        <Link
          href="/admin/orders"
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 mb-4 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          {t("admin.backToOrders")}
        </Link>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {t("admin.orderDetail")} {order.order_number}
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Created {formatDate(order.created_at)}
              {order.shipped_at &&
                ` | Shipped ${formatDate(order.shipped_at)}`}
              {order.delivered_at &&
                ` | Delivered ${formatDate(order.delivered_at)}`}
            </p>
          </div>
          <span
            className={cn(
              "px-3 py-1 rounded-full text-sm font-semibold self-start",
              statusBadgeClass(order.status)
            )}
          >
            {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
          </span>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Customer Info */}
          <Card padding="lg">
            <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <User className="w-4 h-4 text-gray-500" />
              {t("admin.customer")}
            </h3>
            <div className="grid sm:grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">
                  {t("admin.name")}
                </p>
                <p className="font-medium text-gray-900">
                  {order.profiles?.full_name ?? "N/A"}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">
                  {t("admin.email")}
                </p>
                <p className="font-medium text-gray-900">
                  {order.profiles?.email ?? "N/A"}
                </p>
              </div>
              {order.profiles?.phone && (
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">
                    {t("admin.phone")}
                  </p>
                  <p className="font-medium text-gray-900">
                    {order.profiles.phone}
                  </p>
                </div>
              )}
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">
                  {t("admin.userId")}
                </p>
                <p className="font-mono text-xs text-gray-600">
                  {order.user_id}
                </p>
              </div>
            </div>
          </Card>

          {/* Order Items */}
          <Card padding="lg">
            <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Package className="w-4 h-4 text-gray-500" />
              {t("admin.orderItems")} ({items.length})
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
                        alt={item.name ?? "Product"}
                        className="w-12 h-12 rounded-lg object-cover bg-gray-100"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center">
                        <Package className="w-5 h-5 text-gray-300" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {item.name ?? "Item"}
                      </p>
                      {item.sku && (
                        <p className="text-xs text-gray-400 font-mono">
                          {item.sku}
                        </p>
                      )}
                    </div>
                    <p className="text-sm text-gray-500">
                      x{item.quantity ?? 1}
                    </p>
                    <p className="text-sm font-medium text-gray-900 w-20 text-right">
                      {item.price
                        ? formatPrice(item.price * (item.quantity ?? 1))
                        : "-"}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500">{t("admin.noItemData")}</p>
            )}

            {/* Totals */}
            <div className="mt-4 pt-4 border-t border-gray-100 space-y-2 text-sm">
              <div className="flex justify-between text-gray-500">
                <span>{t("admin.subtotal")}</span>
                <span>{formatPrice(order.subtotal)}</span>
              </div>
              {order.discount > 0 && (
                <div className="flex justify-between text-red-600">
                  <span>{t("admin.discount")}</span>
                  <span>-{formatPrice(order.discount)}</span>
                </div>
              )}
              <div className="flex justify-between text-gray-500">
                <span>{t("admin.shipping")}</span>
                <span>
                  {order.shipping > 0
                    ? formatPrice(order.shipping)
                    : t("admin.free")}
                </span>
              </div>
              <div className="flex justify-between text-gray-500">
                <span>{t("admin.tax")}</span>
                <span>{formatPrice(order.tax)}</span>
              </div>
              <div className="flex justify-between font-semibold text-gray-900 pt-2 border-t border-gray-100">
                <span>{t("admin.total")}</span>
                <span>{formatPrice(order.total)}</span>
              </div>
            </div>
          </Card>

          {/* Shipping Section */}
          <Card padding="lg">
            <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Truck className="w-4 h-4 text-gray-500" />
              {t("admin.shippingSection")}
            </h3>

            {!hasLabel ? (
              /* ---------- NOT YET SHIPPED ---------- */
              <div>
                <p className="text-sm text-gray-500 mb-4">
                  {t("admin.notShippedYet")}
                </p>

                <Button
                  onClick={handleGetRates}
                  isLoading={ratesLoading}
                  size="sm"
                  variant="outline"
                  leftIcon={<RefreshCw className="w-4 h-4" />}
                >
                  {t("admin.getShippingRates")}
                </Button>

                {/* Rates list */}
                {rates.length > 0 && (
                  <div className="mt-4 space-y-2">
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t("admin.availableRates")}
                    </p>
                    <div className="max-h-80 overflow-y-auto space-y-2">
                      {rates.map((rate) => (
                        <label
                          key={rate.id}
                          className={cn(
                            "flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors",
                            selectedRateId === rate.id
                              ? "border-aura-primary bg-aura-primary/5"
                              : "border-gray-200 hover:border-gray-300"
                          )}
                        >
                          <input
                            type="radio"
                            name="shipping-rate"
                            value={rate.id}
                            checked={selectedRateId === rate.id}
                            onChange={() => setSelectedRateId(rate.id)}
                            className="accent-aura-primary"
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900">
                              {rate.carrier} {rate.service}
                            </p>
                            <p className="text-xs text-gray-500">
                              {rate.estimatedDays} business day
                              {rate.estimatedDays !== 1 ? "s" : ""}
                              {rate.deliveryDate &&
                                ` (est. ${formatDate(rate.deliveryDate)})`}
                            </p>
                          </div>
                          <span className="text-sm font-semibold text-gray-900">
                            {formatPrice(rate.rate)}
                          </span>
                        </label>
                      ))}
                    </div>

                    <Button
                      onClick={handleCreateLabel}
                      isLoading={labelCreating}
                      disabled={!selectedRateId}
                      size="sm"
                      className="mt-3"
                      leftIcon={<Printer className="w-4 h-4" />}
                    >
                      {t("admin.createShippingLabel")}
                    </Button>
                  </div>
                )}

                {labelMessage && (
                  <p
                    className={cn(
                      "text-sm mt-3",
                      labelMessage.startsWith("Error") ||
                        labelMessage.startsWith("Network") ||
                        labelMessage.startsWith("Failed")
                        ? "text-red-600"
                        : "text-green-600"
                    )}
                  >
                    {labelMessage}
                  </p>
                )}
              </div>
            ) : (
              /* ---------- SHIPPED ---------- */
              <div>
                <div className="grid sm:grid-cols-2 gap-4 mb-4">
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">
                      {t("admin.trackingNumber")}
                    </p>
                    <code className="text-sm font-mono text-gray-900 bg-gray-50 px-2 py-1 rounded">
                      {order.tracking_number}
                    </code>
                  </div>
                  {carrier && (
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">
                        {t("admin.carrierService")}
                      </p>
                      <p className="text-sm text-gray-900">
                        {carrier}
                        {service && ` - ${service}`}
                      </p>
                    </div>
                  )}
                </div>

                <div className="flex flex-wrap gap-3 mb-4">
                  {order.tracking_url && (
                    <a
                      href={order.tracking_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-sm font-medium text-aura-primary hover:underline"
                    >
                      {t("admin.trackPackage")}
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  )}
                  {labelUrl && (
                    <a
                      href={labelUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-sm font-medium text-aura-primary hover:underline"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      {t("admin.downloadLabel")}
                    </a>
                  )}
                </div>

                {/* Tracking Timeline */}
                {trackingLoading ? (
                  <div className="flex items-center py-4">
                    <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
                    <span className="ml-2 text-sm text-gray-500">
                      {t("admin.loadingTracking")}
                    </span>
                  </div>
                ) : tracking && tracking.events.length > 0 ? (
                  <div className="relative pl-5 border-l-2 border-gray-200 space-y-4 mt-4">
                    {tracking.events.map((event, idx) => (
                      <div key={idx} className="relative">
                        <div
                          className={cn(
                            "absolute -left-[21px] w-2.5 h-2.5 rounded-full border-2 border-white",
                            idx === 0
                              ? event.status === "delivered"
                                ? "bg-green-500"
                                : "bg-blue-500"
                              : "bg-gray-300"
                          )}
                        />
                        <div>
                          <p
                            className={cn(
                              "text-sm",
                              idx === 0
                                ? "font-medium text-gray-900"
                                : "text-gray-600"
                            )}
                          >
                            {event.message}
                          </p>
                          <div className="flex items-center gap-3 text-xs text-gray-400 mt-0.5">
                            {event.location && (
                              <span className="flex items-center gap-0.5">
                                <MapPin className="w-3 h-3" />
                                {event.location}
                              </span>
                            )}
                            <span className="flex items-center gap-0.5">
                              <Clock className="w-3 h-3" />
                              {formatTimestamp(event.timestamp)}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : null}
              </div>
            )}
          </Card>
        </div>

        {/* Right sidebar */}
        <div className="space-y-6">
          {/* Shipping Address */}
          {address && (
            <Card padding="lg">
              <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-gray-500" />
                {t("admin.shippingAddress")}
              </h3>
              <div className="text-sm text-gray-600 space-y-0.5">
                {(address.firstName || address.lastName) && (
                  <p className="font-medium text-gray-900">
                    {[address.firstName, address.lastName]
                      .filter(Boolean)
                      .join(" ")}
                  </p>
                )}
                {(address.address1 || address.street1) && (
                  <p>{address.address1 ?? address.street1}</p>
                )}
                {(address.address2 || address.street2) && (
                  <p>{address.address2 ?? address.street2}</p>
                )}
                <p>
                  {[
                    address.city,
                    address.state,
                    address.zipCode ?? address.zip,
                  ]
                    .filter(Boolean)
                    .join(", ")}
                </p>
                {address.country && <p>{address.country}</p>}
                {address.phone && (
                  <p className="mt-2 text-gray-500">{address.phone}</p>
                )}
              </div>
            </Card>
          )}

          {/* Update Order */}
          <Card padding="lg">
            <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Save className="w-4 h-4 text-gray-500" />
              {t("admin.updateOrder")}
            </h3>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">
                  {t("admin.status")}
                </label>
                <select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value as OrderStatus)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-aura-primary focus:border-transparent outline-none"
                  aria-label="Order status"
                >
                  {STATUS_OPTIONS.map((s) => (
                    <option key={s} value={s}>
                      {s.charAt(0).toUpperCase() + s.slice(1)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">
                  {t("admin.internalNotes")}
                </label>
                <textarea
                  value={editInternalNotes}
                  onChange={(e) => setEditInternalNotes(e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-aura-primary focus:border-transparent outline-none resize-none"
                  placeholder={t("admin.internalNotesPlaceholder")}
                />
              </div>

              <Button
                onClick={handleSaveOrder}
                isLoading={isSaving}
                size="sm"
                className="w-full"
                leftIcon={<Save className="w-4 h-4" />}
              >
                {t("admin.saveChanges")}
              </Button>

              {saveMessage && (
                <p
                  className={cn(
                    "text-sm",
                    saveMessage.startsWith("Error")
                      ? "text-red-600"
                      : "text-green-600"
                  )}
                >
                  {saveMessage}
                </p>
              )}
            </div>
          </Card>

          {/* Payment Info */}
          <Card padding="lg">
            <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-gray-500" />
              {t("admin.payment")}
            </h3>
            <div className="text-sm space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-500">{t("admin.currency")}</span>
                <span className="font-medium text-gray-900 uppercase">
                  {order.currency}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">{t("admin.purchaseType")}</span>
                <span className="font-medium text-gray-900">
                  {order.purchase_type}
                </span>
              </div>
              {order.stripe_payment_intent_id && (
                <div>
                  <p className="text-xs text-gray-500 mt-2">
                    Stripe Payment Intent
                  </p>
                  <p className="font-mono text-xs text-gray-600 break-all">
                    {order.stripe_payment_intent_id}
                  </p>
                </div>
              )}
              {order.stripe_invoice_id && (
                <div>
                  <p className="text-xs text-gray-500 mt-2">Stripe Invoice</p>
                  <p className="font-mono text-xs text-gray-600 break-all">
                    {order.stripe_invoice_id}
                  </p>
                </div>
              )}
            </div>
          </Card>

          {/* Dealer Attribution */}
          {order.dealer_attribution_id && (
            <Card padding="lg">
              <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <Handshake className="w-4 h-4 text-gray-500" />
                {t("admin.dealerAttribution")}
              </h3>
              <div className="text-sm">
                <p className="text-xs text-gray-500">Dealer ID</p>
                <p className="font-mono text-xs text-gray-600 break-all">
                  {order.dealer_attribution_id}
                </p>
              </div>
              {order.organization_id && (
                <div className="mt-2 text-sm">
                  <p className="text-xs text-gray-500">Organization ID</p>
                  <p className="font-mono text-xs text-gray-600 break-all">
                    {order.organization_id}
                  </p>
                </div>
              )}
            </Card>
          )}

          {/* Subscription Link */}
          {order.subscription_id && (
            <Card padding="lg">
              <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <Tag className="w-4 h-4 text-gray-500" />
                {t("admin.linkedSubscription")}
              </h3>
              <p className="font-mono text-xs text-gray-600 break-all">
                {order.subscription_id}
              </p>
            </Card>
          )}
        </div>
      </div>
    </>
  );
}
