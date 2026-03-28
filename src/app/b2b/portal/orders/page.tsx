"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
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
  RefreshCw,
  BookmarkPlus,
  Calendar,
  CreditCard,
  Download,
  CheckCircle2,
  Circle,
  ArrowRight,
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

type OrderTab = "all" | "pending" | "processing" | "completed";

const PO_STATUS_STEPS = [
  { key: "submitted", label: "Submitted" },
  { key: "approved", label: "Approved" },
  { key: "invoiced", label: "Invoiced" },
  { key: "shipped", label: "Shipped" },
  { key: "delivered", label: "Delivered" },
];

function getStepIndex(status: string): number {
  const map: Record<string, number> = {
    pending: 0,
    submitted: 0,
    processing: 1,
    approved: 1,
    invoiced: 2,
    shipped: 3,
    delivered: 4,
    cancelled: -1,
  };
  return map[status] ?? 0;
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
  const [activeTab, setActiveTab] = useState<OrderTab>("all");
  const [savedTemplateSuccess, setSavedTemplateSuccess] = useState(false);

  // Form state
  const [poNumber, setPoNumber] = useState("");
  const [notes, setNotes] = useState("");
  const [requestedDeliveryDate, setRequestedDeliveryDate] = useState("");
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
    if (user && (profile?.role === "dealer" || profile?.role === "admin")) {
      fetchData();
    } else if (user && profile) {
      setIsLoading(false);
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
          // Invalid JSON
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

  const handleReorder = (order: Order) => {
    const items = order.items as unknown as B2BCartStoredItem[];
    if (!items || items.length === 0) return;
    const restored = items.map((item) => ({
      productId: item.productId,
      sku: item.sku || "",
      name: item.name,
      quantity: item.quantity,
      price: item.price,
      retailPrice: item.retailPrice || item.price,
      image: item.image || null,
    }));
    setCartItems(restored);
    localStorage.setItem("aura_b2b_cart", JSON.stringify(restored));
    setShowOrderForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSaveAsTemplate = async (order: Order) => {
    const items = order.items as unknown as B2BCartStoredItem[];
    if (!items || items.length === 0) return;
    // Save template to localStorage (would be DB in production)
    const templates = JSON.parse(
      localStorage.getItem("aura_b2b_templates") || "[]"
    );
    templates.push({
      id: crypto.randomUUID(),
      name: `Template from ${order.order_number || order.id.slice(0, 8)}`,
      items: items,
      createdAt: new Date().toISOString(),
    });
    localStorage.setItem("aura_b2b_templates", JSON.stringify(templates));
    setSavedTemplateSuccess(true);
    setTimeout(() => setSavedTemplateSuccess(false), 2000);
  };

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !dealer || cartItems.length === 0) return;

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

    const orderNotes = [
      poNumber ? `PO#: ${poNumber}` : "",
      requestedDeliveryDate ? `Requested Delivery: ${requestedDeliveryDate}` : "",
      notes,
    ]
      .filter(Boolean)
      .join(" | ");

    const orderNumber = `B2B-${Date.now().toString(36).toUpperCase()}`;

    const { data, error } = await supabase
      .from("aura_orders")
      .insert({
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
        purchase_type: "b2b_wholesale",
      })
      .select()
      .single();

    if (error) {
      setSubmitError("Failed to submit order. Please try again.");
      setIsSubmitting(false);
      return;
    }

    localStorage.removeItem("aura_b2b_cart");
    setCartItems([]);
    setSubmitSuccess(true);
    setIsSubmitting(false);

    if (data) {
      setOrders((prev) => [data as Order, ...prev]);
    }

    setTimeout(() => {
      setShowOrderForm(false);
      setSubmitSuccess(false);
      setPoNumber("");
      setNotes("");
      setRequestedDeliveryDate("");
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

  const filteredOrders = useMemo(() => {
    switch (activeTab) {
      case "pending":
        return orders.filter((o) => o.status === "pending");
      case "processing":
        return orders.filter(
          (o) => o.status === "processing" || o.status === "shipped"
        );
      case "completed":
        return orders.filter(
          (o) => o.status === "delivered" || o.status === "cancelled"
        );
      default:
        return orders;
    }
  }, [orders, activeTab]);

  const tabCounts = useMemo(() => {
    return {
      all: orders.length,
      pending: orders.filter((o) => o.status === "pending").length,
      processing: orders.filter(
        (o) => o.status === "processing" || o.status === "shipped"
      ).length,
      completed: orders.filter(
        (o) => o.status === "delivered" || o.status === "cancelled"
      ).length,
    };
  }, [orders]);

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
          <h1 className="text-2xl lg:text-3xl font-bold text-slate-900">
            Orders
          </h1>
          <p className="text-slate-500 mt-1">
            {organization
              ? `${organization.name} wholesale orders`
              : "Manage your B2B orders"}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {organization && organization.payment_terms !== "immediate" && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-blue-50 text-blue-700 border border-blue-100">
              <CreditCard className="w-3.5 h-3.5" />
              {organization.payment_terms
                .replace("_", " ")
                .replace("net", "Net-")}
            </span>
          )}
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
      </div>

      {/* Order Submission Form */}
      {showOrderForm && (
        <Card
          padding="lg"
          className="border border-blue-200 bg-blue-50/30 shadow-sm mb-8"
        >
          {submitSuccess ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
                <Check className="w-8 h-8 text-emerald-600" />
              </div>
              <h2 className="text-xl font-semibold text-slate-900 mb-2">
                Order Submitted
              </h2>
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
                    {cartItems.length} item
                    {cartItems.length !== 1 ? "s" : ""} in cart
                  </p>
                </div>
              </div>

              {/* Cart Items Review */}
              <div className="bg-white rounded-lg border border-slate-200 mb-6">
                <div className="px-4 py-3 border-b border-slate-100">
                  <h3 className="text-sm font-semibold text-slate-700">
                    Order Items
                  </h3>
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
                  <span className="font-semibold text-slate-900">
                    Order Total
                  </span>
                  <span className="font-bold text-lg text-slate-900">
                    {formatCurrency(cartTotal)}
                  </span>
                </div>
              </div>

              {/* PO Number, Notes, and Delivery Date */}
              <div className="grid sm:grid-cols-3 gap-4 mb-6">
                <Input
                  label="PO Number (optional)"
                  value={poNumber}
                  onChange={(e) => setPoNumber(e.target.value)}
                  placeholder="e.g. PO-2026-001"
                  className="focus:ring-blue-600"
                />
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Requested Delivery Date
                  </label>
                  <input
                    type="date"
                    value={requestedDeliveryDate}
                    onChange={(e) => setRequestedDeliveryDate(e.target.value)}
                    min={new Date().toISOString().split("T")[0]}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none"
                  />
                </div>
                <Input
                  label="Delivery Notes"
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

      {/* Order Tabs */}
      <div className="flex items-center gap-1 mb-6 border-b border-slate-200 overflow-x-auto">
        {(
          [
            { key: "all", label: "All Orders" },
            { key: "pending", label: "Pending Approval" },
            { key: "processing", label: "In Progress" },
            { key: "completed", label: "Completed" },
          ] as { key: OrderTab; label: string }[]
        ).map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
              activeTab === tab.key
                ? "border-blue-600 text-blue-700"
                : "border-transparent text-slate-500 hover:text-slate-700"
            }`}
          >
            {tab.label}
            {tabCounts[tab.key] > 0 && (
              <span
                className={`ml-1.5 px-1.5 py-0.5 text-xs rounded-full ${
                  activeTab === tab.key
                    ? "bg-blue-100 text-blue-700"
                    : "bg-slate-100 text-slate-600"
                }`}
              >
                {tabCounts[tab.key]}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Template saved notification */}
      {savedTemplateSuccess && (
        <div className="mb-4 flex items-center gap-2 px-4 py-3 bg-emerald-50 text-emerald-700 rounded-lg text-sm font-medium border border-emerald-200">
          <Check className="w-4 h-4" />
          Order saved as template
        </div>
      )}

      {/* Order History */}
      <Card padding="lg" className="border border-slate-200 shadow-sm">
        {filteredOrders.length > 0 ? (
          <div className="space-y-3">
            {filteredOrders.map((order) => {
              const isExpanded = expandedOrder === order.id;
              const items =
                (order.items as unknown as B2BCartStoredItem[]) || [];
              const currentStep = getStepIndex(order.status);
              const poMatch = order.notes?.match(/PO#:\s*([^\s|]+)/);
              const poNum = poMatch ? poMatch[1] : null;

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
                        className={`w-8 h-8 rounded-lg flex items-center justify-center ${statusColor(
                          order.status
                        )}`}
                      >
                        {statusIcon(order.status)}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-slate-900">
                          {order.order_number ||
                            `#${order.id.slice(0, 8)}`}
                        </p>
                        <p className="text-xs text-slate-500">
                          {formatDate(order.created_at)}
                          {poNum && (
                            <span className="ml-2 font-mono text-blue-600">
                              PO: {poNum}
                            </span>
                          )}
                        </p>
                      </div>
                    </div>
                    <span
                      className={`px-2.5 py-1 rounded-md text-xs font-medium capitalize hidden sm:inline-block ${statusColor(
                        order.status
                      )}`}
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
                      {/* PO Status Timeline */}
                      {order.status !== "cancelled" && (
                        <div className="mb-5">
                          <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
                            Order Progress
                          </h4>
                          <div className="flex items-center justify-between">
                            {PO_STATUS_STEPS.map((step, idx) => {
                              const isCompleted = idx <= currentStep;
                              const isCurrent = idx === currentStep;
                              return (
                                <div
                                  key={step.key}
                                  className="flex-1 flex flex-col items-center relative"
                                >
                                  {idx > 0 && (
                                    <div
                                      className={`absolute top-3 right-1/2 w-full h-0.5 -translate-y-1/2 ${
                                        idx <= currentStep
                                          ? "bg-blue-600"
                                          : "bg-slate-200"
                                      }`}
                                      style={{ left: "-50%" }}
                                    />
                                  )}
                                  <div
                                    className={`relative z-10 w-6 h-6 rounded-full flex items-center justify-center ${
                                      isCompleted
                                        ? "bg-blue-600 text-white"
                                        : "bg-slate-200 text-slate-400"
                                    } ${
                                      isCurrent
                                        ? "ring-2 ring-blue-200"
                                        : ""
                                    }`}
                                  >
                                    {isCompleted ? (
                                      <CheckCircle2 className="w-4 h-4" />
                                    ) : (
                                      <Circle className="w-4 h-4" />
                                    )}
                                  </div>
                                  <span
                                    className={`text-xs mt-1.5 font-medium ${
                                      isCompleted
                                        ? "text-blue-700"
                                        : "text-slate-400"
                                    }`}
                                  >
                                    {step.label}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Order Details */}
                      <div className="grid sm:grid-cols-2 gap-4 mb-4">
                        {order.notes && (
                          <p className="text-sm text-slate-600">
                            <span className="font-medium">Notes:</span>{" "}
                            {order.notes}
                          </p>
                        )}
                        {order.tracking_number && (
                          <p className="text-sm text-slate-600">
                            <span className="font-medium">Tracking:</span>{" "}
                            <span className="font-mono">
                              {order.tracking_number}
                            </span>
                          </p>
                        )}
                      </div>

                      {/* Line Items */}
                      {items.length > 0 && (
                        <div className="bg-white rounded-lg border border-slate-200 mb-4">
                          <div className="px-3 py-2 border-b border-slate-100 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                            Items
                          </div>
                          <div className="divide-y divide-slate-50">
                            {items.map((item, idx) => (
                              <div
                                key={idx}
                                className="px-3 py-2 flex items-center justify-between text-sm"
                              >
                                <span className="text-slate-700">
                                  {item.name}
                                </span>
                                <div className="flex items-center gap-4 text-slate-500">
                                  <span>x{item.quantity}</span>
                                  <span className="font-medium text-slate-900">
                                    {formatCurrency(
                                      item.price * item.quantity
                                    )}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Action Buttons */}
                      <div className="flex flex-wrap gap-2">
                        <button
                          onClick={() => handleReorder(order)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-blue-700 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors border border-blue-100"
                        >
                          <RefreshCw className="w-3.5 h-3.5" />
                          Quick Reorder
                        </button>
                        <button
                          onClick={() => handleSaveAsTemplate(order)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-slate-700 bg-white rounded-lg hover:bg-slate-50 transition-colors border border-slate-200"
                        >
                          <BookmarkPlus className="w-3.5 h-3.5" />
                          Save as Template
                        </button>
                        <button className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-slate-700 bg-white rounded-lg hover:bg-slate-50 transition-colors border border-slate-200">
                          <Download className="w-3.5 h-3.5" />
                          Invoice
                        </button>
                      </div>
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
              {activeTab === "all"
                ? "No orders yet. Browse products to place your first wholesale order."
                : `No ${activeTab} orders.`}
            </p>
          </div>
        )}
      </Card>
    </div>
  );
}
