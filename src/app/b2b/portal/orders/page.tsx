"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/hooks";
import { Card, Button, Input } from "@/components/ui";
import { formatCurrency, formatDate } from "@/lib/utils";
import {
  Package,
  FileText,
  Loader2,
  Check,
  AlertCircle,
  Truck,
  Clock,
  ChevronDown,
  ChevronUp,
  ShoppingCart,
  X,
} from "lucide-react";
import type { Order, Dealer, Organization, Json } from "@/types";

interface B2BCartStoredItem {
  productId: string;
  sku: string;
  name: string;
  quantity: number;
  price: number;
  retailPrice: number;
  image: string | null;
}

export default function B2BOrdersPage() {
  const { user, profile } = useAuth();
  const [dealer, setDealer] = useState<Dealer | null>(null);
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [cartItems, setCartItems] = useState<B2BCartStoredItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [showOrderForm, setShowOrderForm] = useState(false);
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);

  // Form state
  const [poNumber, setPoNumber] = useState("");
  const [notes, setNotes] = useState("");
  const [shippingAddress, setShippingAddress] = useState({
    firstName: "",
    lastName: "",
    address1: "",
    address2: "",
    city: "",
    state: "",
    zipCode: "",
    country: "US",
    phone: "",
  });

  const supabase = createClient();

  const fetchData = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);

    const { data: dealerData } = await supabase
      .from("dealers")
      .select("*")
      .eq("profile_id", user.id)
      .maybeSingle();

    if (!dealerData) {
      setIsLoading(false);
      return;
    }

    setDealer(dealerData as Dealer);
    const orgId = dealerData.organization_id;

    const [orgResult, ordersResult] = await Promise.all([
      orgId
        ? supabase.from("organizations").select("*").eq("id", orgId).single()
        : Promise.resolve({ data: null }),
      orgId
        ? supabase
            .from("aura_orders")
            .select("*")
            .eq("organization_id", orgId)
            .order("created_at", { ascending: false })
        : Promise.resolve({ data: [] }),
    ]);

    if (orgResult.data) setOrganization(orgResult.data as Organization);
    if (ordersResult.data) setOrders(ordersResult.data as Order[]);

    setIsLoading(false);
  }, [user, supabase]);

  useEffect(() => {
    if (user && profile?.role === "dealer") {
      fetchData();
    }
  }, [user, profile, fetchData]);

  // Load cart from localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("aura_b2b_cart");
      if (stored) {
        try {
          const items = JSON.parse(stored) as B2BCartStoredItem[];
          if (items.length > 0) {
            setCartItems(items);
            setShowOrderForm(true);
          }
        } catch {
          // Invalid JSON, ignore
        }
      }
    }
  }, []);

  const cartTotal = cartItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  const removeCartItem = (productId: string) => {
    const updated = cartItems.filter((item) => item.productId !== productId);
    setCartItems(updated);
    localStorage.setItem("aura_b2b_cart", JSON.stringify(updated));
    if (updated.length === 0) setShowOrderForm(false);
  };

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !dealer || cartItems.length === 0) return;

    // Validate required fields
    if (
      !shippingAddress.firstName ||
      !shippingAddress.lastName ||
      !shippingAddress.address1 ||
      !shippingAddress.city ||
      !shippingAddress.state ||
      !shippingAddress.zipCode
    ) {
      setSubmitError("Please fill in all required shipping address fields.");
      return;
    }

    setIsSubmitting(true);
    setSubmitError("");

    const orderItems = cartItems.map((item) => ({
      productId: item.productId,
      sku: item.sku,
      name: item.name,
      quantity: item.quantity,
      price: item.price,
      retailPrice: item.retailPrice,
      image: item.image,
    }));

    const orderNotes = [poNumber ? `PO#: ${poNumber}` : "", notes]
      .filter(Boolean)
      .join(" | ");

    const orderNumber = `B2B-${Date.now().toString(36).toUpperCase()}`;

    const { data, error } = await supabase.from("aura_orders").insert({
      user_id: user.id,
      organization_id: dealer.organization_id,
      order_number: orderNumber,
      status: "pending" as const,
      subtotal: cartTotal,
      discount: 0,
      shipping: 0,
      tax: 0,
      total: cartTotal,
      items: orderItems as unknown as Json,
      shipping_address: shippingAddress as unknown as Json,
      notes: orderNotes || null,
    }).select().single();

    if (error) {
      setSubmitError("Failed to submit order. Please try again.");
      setIsSubmitting(false);
      return;
    }

    // Clear cart
    localStorage.removeItem("aura_b2b_cart");
    setCartItems([]);
    setSubmitSuccess(true);
    setIsSubmitting(false);

    // Add new order to the list
    if (data) {
      setOrders((prev) => [data as Order, ...prev]);
    }

    // Reset form after delay
    setTimeout(() => {
      setShowOrderForm(false);
      setSubmitSuccess(false);
      setPoNumber("");
      setNotes("");
      setShippingAddress({
        firstName: "",
        lastName: "",
        address1: "",
        address2: "",
        city: "",
        state: "",
        zipCode: "",
        country: "US",
        phone: "",
      });
    }, 3000);
  };

  const statusColor = (status: string) => {
    switch (status) {
      case "delivered":
        return "bg-emerald-100 text-emerald-700";
      case "shipped":
        return "bg-blue-100 text-blue-700";
      case "processing":
        return "bg-amber-100 text-amber-700";
      case "cancelled":
        return "bg-red-100 text-red-700";
      default:
        return "bg-slate-100 text-slate-700";
    }
  };

  const statusIcon = (status: string) => {
    switch (status) {
      case "delivered":
        return <Check className="w-4 h-4" />;
      case "shipped":
        return <Truck className="w-4 h-4" />;
      case "processing":
        return <Clock className="w-4 h-4" />;
      default:
        return <Package className="w-4 h-4" />;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div>
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-slate-900">Orders</h1>
          <p className="text-slate-500 mt-1">
            {organization ? `${organization.name} wholesale orders` : "Manage your B2B orders"}
          </p>
        </div>
        {cartItems.length === 0 && !showOrderForm && (
          <a href="/b2b/portal/products">
            <Button
              variant="primary"
              className="bg-blue-600 hover:bg-blue-700 focus:ring-blue-600"
            >
              <ShoppingCart className="w-4 h-4 mr-2" />
              Browse Products
            </Button>
          </a>
        )}
      </div>

      {/* Order Submission Form */}
      {showOrderForm && (
        <Card padding="lg" className="border border-blue-200 bg-blue-50/30 shadow-sm mb-8">
          {submitSuccess ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
                <Check className="w-8 h-8 text-emerald-600" />
              </div>
              <h2 className="text-xl font-semibold text-slate-900 mb-2">Order Submitted</h2>
              <p className="text-slate-500">
                Your purchase order has been received and is pending approval.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmitOrder}>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-lg bg-blue-600 flex items-center justify-center">
                  <FileText className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">
                    New Purchase Order
                  </h2>
                  <p className="text-sm text-slate-500">
                    {cartItems.length} item{cartItems.length !== 1 ? "s" : ""} in cart
                  </p>
                </div>
              </div>

              {/* Cart Items Review */}
              <div className="bg-white rounded-lg border border-slate-200 mb-6">
                <div className="px-4 py-3 border-b border-slate-100">
                  <h3 className="text-sm font-semibold text-slate-700">Order Items</h3>
                </div>
                <div className="divide-y divide-slate-100">
                  {cartItems.map((item) => (
                    <div
                      key={item.productId}
                      className="px-4 py-3 flex items-center gap-3"
                    >
                      <div className="w-10 h-10 rounded-lg bg-slate-100 flex-shrink-0 overflow-hidden">
                        {item.image ? (
                          <img
                            src={item.image}
                            alt={item.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Package className="w-4 h-4 text-slate-300" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-900 truncate">
                          {item.name}
                        </p>
                        <p className="text-xs text-slate-500">
                          {item.quantity} x {formatCurrency(item.price)}
                        </p>
                      </div>
                      <p className="text-sm font-semibold text-slate-900">
                        {formatCurrency(item.price * item.quantity)}
                      </p>
                      <button
                        type="button"
                        onClick={() => removeCartItem(item.productId)}
                        className="p-1 text-slate-400 hover:text-red-500 transition-colors"
                        aria-label={`Remove ${item.name}`}
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
                <div className="px-4 py-3 border-t border-slate-200 flex justify-between">
                  <span className="font-semibold text-slate-900">Order Total</span>
                  <span className="font-bold text-lg text-slate-900">
                    {formatCurrency(cartTotal)}
                  </span>
                </div>
              </div>

              {/* PO Number and Notes */}
              <div className="grid sm:grid-cols-2 gap-4 mb-6">
                <Input
                  label="PO Number (optional)"
                  value={poNumber}
                  onChange={(e) => setPoNumber(e.target.value)}
                  placeholder="e.g. PO-2026-001"
                  className="focus:ring-blue-600"
                />
                <Input
                  label="Notes (optional)"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Special instructions..."
                  className="focus:ring-blue-600"
                />
              </div>

              {/* Shipping Address */}
              <h3 className="text-sm font-semibold text-slate-700 mb-3">
                Shipping Address
              </h3>
              <div className="grid sm:grid-cols-2 gap-4 mb-6">
                <Input
                  label="First Name *"
                  value={shippingAddress.firstName}
                  onChange={(e) =>
                    setShippingAddress((prev) => ({
                      ...prev,
                      firstName: e.target.value,
                    }))
                  }
                  required
                  className="focus:ring-blue-600"
                />
                <Input
                  label="Last Name *"
                  value={shippingAddress.lastName}
                  onChange={(e) =>
                    setShippingAddress((prev) => ({
                      ...prev,
                      lastName: e.target.value,
                    }))
                  }
                  required
                  className="focus:ring-blue-600"
                />
                <div className="sm:col-span-2">
                  <Input
                    label="Street Address *"
                    value={shippingAddress.address1}
                    onChange={(e) =>
                      setShippingAddress((prev) => ({
                        ...prev,
                        address1: e.target.value,
                      }))
                    }
                    required
                    className="focus:ring-blue-600"
                  />
                </div>
                <div className="sm:col-span-2">
                  <Input
                    label="Address Line 2"
                    value={shippingAddress.address2}
                    onChange={(e) =>
                      setShippingAddress((prev) => ({
                        ...prev,
                        address2: e.target.value,
                      }))
                    }
                    placeholder="Suite, unit, etc."
                    className="focus:ring-blue-600"
                  />
                </div>
                <Input
                  label="City *"
                  value={shippingAddress.city}
                  onChange={(e) =>
                    setShippingAddress((prev) => ({
                      ...prev,
                      city: e.target.value,
                    }))
                  }
                  required
                  className="focus:ring-blue-600"
                />
                <Input
                  label="State *"
                  value={shippingAddress.state}
                  onChange={(e) =>
                    setShippingAddress((prev) => ({
                      ...prev,
                      state: e.target.value,
                    }))
                  }
                  required
                  className="focus:ring-blue-600"
                />
                <Input
                  label="ZIP Code *"
                  value={shippingAddress.zipCode}
                  onChange={(e) =>
                    setShippingAddress((prev) => ({
                      ...prev,
                      zipCode: e.target.value,
                    }))
                  }
                  required
                  className="focus:ring-blue-600"
                />
                <Input
                  label="Phone"
                  value={shippingAddress.phone}
                  onChange={(e) =>
                    setShippingAddress((prev) => ({
                      ...prev,
                      phone: e.target.value,
                    }))
                  }
                  type="tel"
                  placeholder="(555) 123-4567"
                  className="focus:ring-blue-600"
                />
              </div>

              {submitError && (
                <div className="flex items-center gap-2 text-red-600 text-sm mb-4">
                  <AlertCircle className="w-4 h-4" />
                  {submitError}
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  className="bg-blue-600 hover:bg-blue-700 focus:ring-blue-600"
                  isLoading={isSubmitting}
                  disabled={cartItems.length === 0}
                >
                  Submit Purchase Order
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="lg"
                  onClick={() => {
                    setShowOrderForm(false);
                    setCartItems([]);
                    localStorage.removeItem("aura_b2b_cart");
                  }}
                >
                  Cancel
                </Button>
              </div>
            </form>
          )}
        </Card>
      )}

      {/* Order History */}
      <Card padding="lg" className="border border-slate-200 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900 mb-5">Order History</h2>

        {orders.length > 0 ? (
          <div className="space-y-3">
            {orders.map((order) => {
              const isExpanded = expandedOrder === order.id;
              const items = (order.items as unknown as B2BCartStoredItem[]) || [];

              return (
                <div
                  key={order.id}
                  className="border border-slate-200 rounded-lg overflow-hidden"
                >
                  <button
                    onClick={() =>
                      setExpandedOrder(isExpanded ? null : order.id)
                    }
                    className="w-full flex items-center gap-4 p-4 text-left hover:bg-slate-50 transition-colors"
                    aria-expanded={isExpanded}
                    aria-controls={`order-details-${order.id}`}
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div
                        className={`w-8 h-8 rounded-lg flex items-center justify-center ${statusColor(order.status)}`}
                      >
                        {statusIcon(order.status)}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-slate-900">
                          {order.order_number || `#${order.id.slice(0, 8)}`}
                        </p>
                        <p className="text-xs text-slate-500">
                          {formatDate(order.created_at)}
                        </p>
                      </div>
                    </div>
                    <span
                      className={`px-2.5 py-1 rounded-md text-xs font-medium capitalize hidden sm:inline-block ${statusColor(order.status)}`}
                    >
                      {order.status}
                    </span>
                    <span className="text-sm font-semibold text-slate-900">
                      {formatCurrency(order.total)}
                    </span>
                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4 text-slate-400 flex-shrink-0" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-slate-400 flex-shrink-0" />
                    )}
                  </button>

                  {isExpanded && (
                    <div
                      id={`order-details-${order.id}`}
                      className="border-t border-slate-100 bg-slate-50 p-4"
                    >
                      {order.notes && (
                        <p className="text-sm text-slate-600 mb-3">
                          <span className="font-medium">Notes:</span> {order.notes}
                        </p>
                      )}
                      {order.tracking_number && (
                        <p className="text-sm text-slate-600 mb-3">
                          <span className="font-medium">Tracking:</span>{" "}
                          <span className="font-mono">{order.tracking_number}</span>
                        </p>
                      )}
                      {items.length > 0 && (
                        <div className="bg-white rounded-lg border border-slate-200">
                          <div className="px-3 py-2 border-b border-slate-100 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                            Items
                          </div>
                          <div className="divide-y divide-slate-50">
                            {items.map((item, idx) => (
                              <div
                                key={idx}
                                className="px-3 py-2 flex items-center justify-between text-sm"
                              >
                                <span className="text-slate-700">{item.name}</span>
                                <div className="flex items-center gap-4 text-slate-500">
                                  <span>x{item.quantity}</span>
                                  <span className="font-medium text-slate-900">
                                    {formatCurrency(item.price * item.quantity)}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-12">
            <Package className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <p className="text-sm text-slate-500">
              No orders yet. Browse products to place your first wholesale order.
            </p>
          </div>
        )}
      </Card>
    </div>
  );
}
