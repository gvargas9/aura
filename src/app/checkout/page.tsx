"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Header, Footer, Button, Input, Card } from "@/components/ui";
import { useAuth } from "@/hooks";
import { BOX_CONFIGS } from "@/types";
import { formatCurrency } from "@/lib/utils";
import {
  CreditCard,
  Lock,
  Package,
  ArrowLeft,
  ArrowRight,
  CheckCircle,
  Loader2,
  Tag,
  Gift,
  MapPin,
  ShieldCheck,
  Wallet,
  FileText,
  Percent,
  X,
  Check,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import type { Product, Address } from "@/types";

interface BoxConfig {
  size: string;
  products: string[];
  price: number;
}

type PurchaseType = "subscription" | "one_time" | "gift";
type PaymentMethod = "card" | "credits" | "invoice";

interface PromoValidation {
  valid: boolean;
  promotionId?: string;
  promotionName?: string;
  discountType?: string;
  discountValue?: number;
  discountAmount?: number;
  error?: string;
}

interface GiftCardValidation {
  valid: boolean;
  balance?: number;
  expiresAt?: string | null;
  error?: string;
}

interface GiftInfo {
  recipientName: string;
  recipientEmail: string;
  giftMessage: string;
}

const US_STATES = [
  "AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA","HI","ID","IL","IN","IA",
  "KS","KY","LA","ME","MD","MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ",
  "NM","NY","NC","ND","OH","OK","OR","PA","RI","SC","SD","TN","TX","UT","VT",
  "VA","WA","WV","WI","WY",
];

const STEPS = [
  { id: 1, label: "Review Order", icon: Package },
  { id: 2, label: "Discounts", icon: Tag },
  { id: 3, label: "Shipping", icon: MapPin },
  { id: 4, label: "Payment", icon: CreditCard },
];

export default function CheckoutPage() {
  const router = useRouter();
  const { user, profile, isLoading: authLoading, isAuthenticated } = useAuth();
  const supabase = createClient();

  const [boxConfig, setBoxConfig] = useState<BoxConfig | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState(1);

  // Purchase type
  const [purchaseType, setPurchaseType] = useState<PurchaseType>("subscription");

  // Gift info
  const [giftInfo, setGiftInfo] = useState<GiftInfo>({
    recipientName: "",
    recipientEmail: "",
    giftMessage: "",
  });

  // Promo & Gift Cards
  const [promoCode, setPromoCode] = useState("");
  const [promoValidation, setPromoValidation] = useState<PromoValidation | null>(null);
  const [isValidatingPromo, setIsValidatingPromo] = useState(false);
  const [giftCardCode, setGiftCardCode] = useState("");
  const [giftCardValidation, setGiftCardValidation] = useState<GiftCardValidation | null>(null);
  const [isValidatingGiftCard, setIsValidatingGiftCard] = useState(false);
  const [giftCardApplyAmount, setGiftCardApplyAmount] = useState(0);

  // Credits
  const [creditsToApply, setCreditsToApply] = useState(0);
  const [availableCredits, setAvailableCredits] = useState(0);

  // Shipping
  const [shippingAddress, setShippingAddress] = useState<Address>({
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

  // Payment
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("card");
  const [poNumber, setPoNumber] = useState("");
  const [dealerCode, setDealerCode] = useState("");

  // B2B context
  const isDealer = profile?.role === "dealer";
  const [organization, setOrganization] = useState<{
    id: string;
    name: string;
    payment_terms: string;
  } | null>(null);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/auth/login?redirectTo=/checkout");
    }
  }, [authLoading, isAuthenticated, router]);

  // Load box configuration and user data
  useEffect(() => {
    const loadData = async () => {
      const stored = localStorage.getItem("aura_box_config");
      if (!stored) {
        router.push("/build-box");
        return;
      }

      const config = JSON.parse(stored) as BoxConfig;
      setBoxConfig(config);

      // Fetch product details
      const { data: productData } = await supabase
        .from("aura_products")
        .select("*")
        .in("id", config.products);

      if (productData) {
        setProducts(productData);
      }

      // Fetch user credits
      if (profile) {
        setAvailableCredits(profile.credits || 0);

        // Load saved address from profile
        if (profile.address) {
          const addr = profile.address as Record<string, string>;
          setShippingAddress((prev) => ({
            ...prev,
            firstName: profile.full_name?.split(" ")[0] || "",
            lastName: profile.full_name?.split(" ").slice(1).join(" ") || "",
            address1: addr.address1 || "",
            address2: addr.address2 || "",
            city: addr.city || "",
            state: addr.state || "",
            zipCode: addr.zipCode || addr.zip_code || "",
            phone: profile.phone || "",
          }));
        }

        // Load organization for dealers
        if (profile.organization_id) {
          const { data: org } = await supabase
            .from("organizations")
            .select("id, name, payment_terms")
            .eq("id", profile.organization_id)
            .single();

          if (org) {
            setOrganization(org);
          }
        }
      }

      setIsLoading(false);
    };

    if (isAuthenticated) {
      loadData();
    }
  }, [isAuthenticated, router, supabase, profile]);

  // Price calculations
  const config = boxConfig ? BOX_CONFIGS[boxConfig.size] : null;

  const basePrice = config
    ? purchaseType === "subscription"
      ? config.price
      : config.oneTimePrice
    : 0;

  const promoDiscount = promoValidation?.valid && promoValidation.discountAmount
    ? promoValidation.discountAmount
    : 0;

  const giftCardDiscount = giftCardValidation?.valid ? giftCardApplyAmount : 0;
  const creditsDiscount = creditsToApply;
  const shipping = purchaseType === "subscription" ? 0 : 9.99;
  const subtotalAfterDiscounts = Math.max(0, basePrice - promoDiscount - giftCardDiscount - creditsDiscount);
  const taxRate = 0.0825;
  const tax = subtotalAfterDiscounts * taxRate;
  const total = subtotalAfterDiscounts + shipping + tax;

  // Validate promo code
  const validatePromo = useCallback(async () => {
    if (!promoCode.trim()) return;
    setIsValidatingPromo(true);
    setPromoValidation(null);

    try {
      const { data: promo, error: promoError } = await supabase
        .from("promotions")
        .select("*")
        .eq("coupon_code", promoCode.toUpperCase())
        .eq("is_active", true)
        .eq("trigger_type", "coupon_code")
        .single();

      if (promoError || !promo) {
        setPromoValidation({ valid: false, error: "Invalid promo code" });
        return;
      }

      const now = new Date().toISOString();
      if (promo.starts_at && promo.starts_at > now) {
        setPromoValidation({ valid: false, error: "This promotion has not started yet" });
        return;
      }
      if (promo.ends_at && promo.ends_at < now) {
        setPromoValidation({ valid: false, error: "This promotion has expired" });
        return;
      }
      if (promo.usage_limit && promo.usage_count >= promo.usage_limit) {
        setPromoValidation({ valid: false, error: "This promotion has reached its usage limit" });
        return;
      }
      if (promo.subscription_only && purchaseType !== "subscription") {
        setPromoValidation({ valid: false, error: "This promotion is valid for subscriptions only" });
        return;
      }
      if (promo.min_order_amount && basePrice < promo.min_order_amount) {
        setPromoValidation({
          valid: false,
          error: `Minimum order amount of ${formatCurrency(promo.min_order_amount)} required`,
        });
        return;
      }

      let discountAmount = 0;
      if (promo.discount_type === "percentage") {
        discountAmount = basePrice * (promo.discount_value / 100);
        if (promo.max_discount_amount) {
          discountAmount = Math.min(discountAmount, promo.max_discount_amount);
        }
      } else if (promo.discount_type === "fixed_amount") {
        discountAmount = promo.discount_value;
      }

      setPromoValidation({
        valid: true,
        promotionId: promo.id,
        promotionName: promo.name,
        discountType: promo.discount_type,
        discountValue: promo.discount_value,
        discountAmount: Math.min(discountAmount, basePrice),
      });
    } catch {
      setPromoValidation({ valid: false, error: "Failed to validate promo code" });
    } finally {
      setIsValidatingPromo(false);
    }
  }, [promoCode, supabase, purchaseType, basePrice]);

  // Validate gift card
  const validateGiftCard = useCallback(async () => {
    if (!giftCardCode.trim()) return;
    setIsValidatingGiftCard(true);
    setGiftCardValidation(null);

    try {
      const response = await fetch("/api/checkout/gift-card-balance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: giftCardCode.toUpperCase() }),
      });

      const data = await response.json();

      if (data.valid) {
        setGiftCardValidation({
          valid: true,
          balance: data.balance,
          expiresAt: data.expiresAt,
        });
        // Auto-apply max possible amount
        const remaining = basePrice - promoDiscount;
        setGiftCardApplyAmount(Math.min(data.balance, Math.max(0, remaining)));
      } else {
        setGiftCardValidation({ valid: false, error: data.error });
      }
    } catch {
      setGiftCardValidation({ valid: false, error: "Failed to validate gift card" });
    } finally {
      setIsValidatingGiftCard(false);
    }
  }, [giftCardCode, basePrice, promoDiscount]);

  // Clear promo
  const clearPromo = () => {
    setPromoCode("");
    setPromoValidation(null);
  };

  // Clear gift card
  const clearGiftCard = () => {
    setGiftCardCode("");
    setGiftCardValidation(null);
    setGiftCardApplyAmount(0);
  };

  // Handle credits change
  const handleCreditsChange = (value: string) => {
    const num = parseFloat(value) || 0;
    const maxCreditsUsable = Math.max(0, basePrice - promoDiscount - giftCardDiscount);
    setCreditsToApply(Math.min(num, availableCredits, maxCreditsUsable));
  };

  // Shipping address update helper
  const updateAddress = (field: keyof Address, value: string) => {
    setShippingAddress((prev) => ({ ...prev, [field]: value }));
  };

  // Validate current step
  const canProceed = (): boolean => {
    switch (currentStep) {
      case 1:
        if (purchaseType === "gift") {
          return !!(giftInfo.recipientName.trim() && giftInfo.recipientEmail.trim());
        }
        return true;
      case 2:
        return true;
      case 3:
        return !!(
          shippingAddress.firstName.trim() &&
          shippingAddress.lastName.trim() &&
          shippingAddress.address1.trim() &&
          shippingAddress.city.trim() &&
          shippingAddress.state.trim() &&
          shippingAddress.zipCode.trim()
        );
      case 4:
        if (paymentMethod === "invoice" && !poNumber.trim()) return false;
        return true;
      default:
        return true;
    }
  };

  const handleCheckout = async () => {
    if (!boxConfig || !config) return;

    setIsCheckingOut(true);
    setError(null);

    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          boxSize: boxConfig.size,
          productIds: boxConfig.products,
          purchaseType,
          dealerCode: dealerCode || undefined,
          shippingAddress,
          // Promo
          promoCode: promoValidation?.valid ? promoCode.toUpperCase() : undefined,
          promotionId: promoValidation?.valid ? promoValidation.promotionId : undefined,
          promoDiscount: promoValidation?.valid ? promoDiscount : 0,
          // Gift card
          giftCardCode: giftCardValidation?.valid ? giftCardCode.toUpperCase() : undefined,
          giftCardAmount: giftCardValidation?.valid ? giftCardApplyAmount : 0,
          // Credits
          creditsToApply: creditsToApply > 0 ? creditsToApply : 0,
          // Gift
          ...(purchaseType === "gift" ? {
            recipientName: giftInfo.recipientName,
            recipientEmail: giftInfo.recipientEmail,
            giftMessage: giftInfo.giftMessage,
          } : {}),
          // B2B Invoice
          ...(paymentMethod === "invoice" ? {
            paymentMethod: "invoice",
            poNumber,
            organizationId: organization?.id,
          } : {}),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Checkout failed");
      }

      if (data.invoiceCreated) {
        // B2B invoice flow: redirect to success
        router.push(`/checkout/success?order_id=${data.orderId}&type=invoice`);
      } else if (data.zeroDollar) {
        // Fully covered by credits/gift card
        router.push(`/checkout/success?order_id=${data.orderId}&type=${purchaseType}`);
      } else if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error("No checkout URL received");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Checkout failed");
      setIsCheckingOut(false);
    }
  };

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-aura-primary" />
      </div>
    );
  }

  if (!boxConfig || !config) return null;

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />

      <main className="flex-1 py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Back Link */}
          <Link
            href="/build-box"
            className="inline-flex items-center text-gray-600 hover:text-aura-primary mb-6 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Box Builder
          </Link>

          <h1 className="text-3xl font-bold mb-2">Checkout</h1>
          <p className="text-gray-500 mb-8">Complete your order securely</p>

          {/* Step Indicator */}
          <nav className="mb-8" aria-label="Checkout steps">
            <ol className="flex items-center gap-2 sm:gap-4">
              {STEPS.map((step) => {
                const StepIcon = step.icon;
                const isActive = currentStep === step.id;
                const isCompleted = currentStep > step.id;
                return (
                  <li key={step.id} className="flex-1">
                    <button
                      onClick={() => {
                        if (isCompleted) setCurrentStep(step.id);
                      }}
                      disabled={!isCompleted}
                      className={`w-full flex items-center gap-2 p-3 rounded-lg border-2 transition-all ${
                        isActive
                          ? "border-aura-primary bg-aura-primary/5 text-aura-primary"
                          : isCompleted
                          ? "border-green-500 bg-green-50 text-green-700 cursor-pointer hover:bg-green-100"
                          : "border-gray-200 bg-white text-gray-400"
                      }`}
                    >
                      <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                        isCompleted ? "bg-green-500 text-white" : isActive ? "bg-aura-primary text-white" : "bg-gray-100"
                      }`}>
                        {isCompleted ? (
                          <Check className="w-4 h-4" />
                        ) : (
                          <StepIcon className="w-4 h-4" />
                        )}
                      </div>
                      <span className="hidden sm:block text-sm font-medium">{step.label}</span>
                    </button>
                  </li>
                );
              })}
            </ol>
          </nav>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-600 rounded-lg flex items-center gap-2">
              <X className="w-5 h-5 flex-shrink-0" />
              {error}
            </div>
          )}

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Step 1: Order Review */}
              {currentStep === 1 && (
                <Card padding="lg">
                  <h2 className="text-xl font-semibold mb-6">Review Your Order</h2>

                  {/* Purchase Type Toggle */}
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      How would you like to purchase?
                    </label>
                    <div className="grid grid-cols-3 gap-3">
                      {[
                        { value: "subscription" as const, label: "Subscribe", desc: "Save " + config.subscriptionSavings + "%", icon: Sparkles },
                        { value: "one_time" as const, label: "One-Time", desc: "No commitment", icon: Package },
                        { value: "gift" as const, label: "Gift", desc: "Send to someone", icon: Gift },
                      ].map((option) => {
                        const Icon = option.icon;
                        return (
                          <button
                            key={option.value}
                            onClick={() => setPurchaseType(option.value)}
                            className={`relative p-4 rounded-xl border-2 transition-all text-left ${
                              purchaseType === option.value
                                ? "border-aura-primary bg-aura-primary/5"
                                : "border-gray-200 hover:border-gray-300"
                            }`}
                          >
                            <Icon className={`w-5 h-5 mb-2 ${purchaseType === option.value ? "text-aura-primary" : "text-gray-400"}`} />
                            <p className="font-medium text-sm">{option.label}</p>
                            <p className={`text-xs ${purchaseType === option.value ? "text-aura-primary" : "text-gray-500"}`}>
                              {option.desc}
                            </p>
                            {option.value === "subscription" && (
                              <span className="absolute -top-2 -right-2 bg-aura-accent text-white text-xs font-bold px-2 py-0.5 rounded-full">
                                BEST
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                    {purchaseType === "subscription" && (
                      <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2 text-sm text-green-700">
                        <Percent className="w-4 h-4 flex-shrink-0" />
                        Subscribe and save {formatCurrency(config.oneTimePrice - config.price)} per box. Free shipping on every delivery.
                      </div>
                    )}
                  </div>

                  {/* Box Info */}
                  <div className="flex items-center gap-4 p-4 bg-aura-light rounded-lg mb-6">
                    <div className="w-16 h-16 bg-aura-primary rounded-lg flex items-center justify-center flex-shrink-0">
                      <Package className="w-8 h-8 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold capitalize">
                        {boxConfig.size} Box {purchaseType === "subscription" ? "Subscription" : ""}
                      </h3>
                      <p className="text-gray-600 text-sm">
                        {config.slots} premium meals {purchaseType === "subscription" ? "delivered monthly" : ""}
                      </p>
                      <p className="text-aura-primary font-semibold mt-1">
                        {formatCurrency(basePrice)}
                        {purchaseType === "subscription" ? "/mo" : ""}
                        {purchaseType !== "subscription" && (
                          <span className="ml-2 text-gray-400 line-through text-sm">
                            {formatCurrency(config.compareAtPrice)}
                          </span>
                        )}
                      </p>
                    </div>
                  </div>

                  {/* Products List */}
                  <h3 className="font-medium mb-3">Selected Meals ({products.length})</h3>
                  <div className="space-y-2 mb-6 max-h-64 overflow-y-auto">
                    {products.map((product, index) => (
                      <div
                        key={`${product.id}-${index}`}
                        className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0"
                      >
                        <div className="flex items-center gap-3">
                          <CheckCircle className="w-4 h-4 text-aura-primary flex-shrink-0" />
                          <span className="text-sm">{product.name}</span>
                        </div>
                        <span className="text-sm text-gray-500">
                          {formatCurrency(product.price)}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Gift Info (conditional) */}
                  {purchaseType === "gift" && (
                    <div className="border-t pt-6 space-y-4">
                      <h3 className="font-medium flex items-center gap-2">
                        <Gift className="w-5 h-5 text-aura-primary" />
                        Gift Details
                      </h3>
                      <div className="grid sm:grid-cols-2 gap-4">
                        <Input
                          label="Recipient Name *"
                          placeholder="Their name"
                          value={giftInfo.recipientName}
                          onChange={(e) => setGiftInfo((p) => ({ ...p, recipientName: e.target.value }))}
                        />
                        <Input
                          label="Recipient Email *"
                          type="email"
                          placeholder="their@email.com"
                          value={giftInfo.recipientEmail}
                          onChange={(e) => setGiftInfo((p) => ({ ...p, recipientEmail: e.target.value }))}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Gift Message</label>
                        <textarea
                          className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-aura-primary/20 focus:border-aura-primary outline-none resize-none"
                          rows={3}
                          placeholder="Add a personal message..."
                          value={giftInfo.giftMessage}
                          onChange={(e) => setGiftInfo((p) => ({ ...p, giftMessage: e.target.value }))}
                          maxLength={500}
                        />
                        <p className="text-xs text-gray-400 mt-1">{giftInfo.giftMessage.length}/500 characters</p>
                      </div>
                    </div>
                  )}

                  {/* Referral Code */}
                  <div className="border-t pt-4">
                    <Input
                      label="Referral Code (Optional)"
                      placeholder="Enter referral code"
                      value={dealerCode}
                      onChange={(e) => setDealerCode(e.target.value.toUpperCase())}
                      className="max-w-xs"
                      helperText="If someone referred you, enter their code here"
                    />
                  </div>
                </Card>
              )}

              {/* Step 2: Promo & Gift Cards */}
              {currentStep === 2 && (
                <Card padding="lg">
                  <h2 className="text-xl font-semibold mb-6">Discounts & Gift Cards</h2>

                  {/* Promo Code */}
                  <div className="mb-8">
                    <h3 className="font-medium mb-3 flex items-center gap-2">
                      <Tag className="w-5 h-5 text-aura-primary" />
                      Promo Code
                    </h3>
                    {promoValidation?.valid ? (
                      <div className="flex items-center justify-between p-4 bg-green-50 border border-green-200 rounded-lg">
                        <div className="flex items-center gap-3">
                          <CheckCircle className="w-5 h-5 text-green-600" />
                          <div>
                            <p className="font-medium text-green-700">{promoValidation.promotionName}</p>
                            <p className="text-sm text-green-600">
                              Saving {formatCurrency(promoDiscount)}
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={clearPromo}
                          className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                          aria-label="Remove promo code"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex gap-3">
                        <Input
                          placeholder="Enter promo code"
                          value={promoCode}
                          onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                          error={promoValidation?.valid === false ? promoValidation.error : undefined}
                          className="flex-1"
                        />
                        <Button
                          variant="outline"
                          onClick={validatePromo}
                          isLoading={isValidatingPromo}
                          disabled={!promoCode.trim()}
                        >
                          Apply
                        </Button>
                      </div>
                    )}
                  </div>

                  {/* Gift Card */}
                  <div className="mb-8">
                    <h3 className="font-medium mb-3 flex items-center gap-2">
                      <Gift className="w-5 h-5 text-aura-primary" />
                      Gift Card
                    </h3>
                    {giftCardValidation?.valid ? (
                      <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <CheckCircle className="w-5 h-5 text-green-600" />
                            <div>
                              <p className="font-medium text-green-700">Gift card applied</p>
                              <p className="text-sm text-green-600">
                                Balance: {formatCurrency(giftCardValidation.balance || 0)}
                              </p>
                            </div>
                          </div>
                          <button
                            onClick={clearGiftCard}
                            className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                            aria-label="Remove gift card"
                          >
                            <X className="w-5 h-5" />
                          </button>
                        </div>
                        <div>
                          <label className="text-sm text-gray-600 mb-1 block">
                            Amount to apply (max {formatCurrency(giftCardValidation.balance || 0)})
                          </label>
                          <Input
                            type="number"
                            min={0}
                            max={giftCardValidation.balance || 0}
                            step={0.01}
                            value={giftCardApplyAmount || ""}
                            onChange={(e) => {
                              const val = parseFloat(e.target.value) || 0;
                              const remaining = basePrice - promoDiscount;
                              setGiftCardApplyAmount(
                                Math.min(val, giftCardValidation.balance || 0, Math.max(0, remaining))
                              );
                            }}
                            className="max-w-xs"
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="flex gap-3">
                        <Input
                          placeholder="Enter gift card code"
                          value={giftCardCode}
                          onChange={(e) => setGiftCardCode(e.target.value.toUpperCase())}
                          error={giftCardValidation?.valid === false ? giftCardValidation.error : undefined}
                          className="flex-1"
                        />
                        <Button
                          variant="outline"
                          onClick={validateGiftCard}
                          isLoading={isValidatingGiftCard}
                          disabled={!giftCardCode.trim()}
                        >
                          Check
                        </Button>
                      </div>
                    )}
                  </div>

                  {/* Loyalty Credits */}
                  {availableCredits > 0 && (
                    <div>
                      <h3 className="font-medium mb-3 flex items-center gap-2">
                        <Wallet className="w-5 h-5 text-aura-primary" />
                        Loyalty Credits
                      </h3>
                      <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                        <p className="text-sm text-amber-700 mb-3">
                          You have {formatCurrency(availableCredits)} in loyalty credits available
                        </p>
                        <div className="flex items-center gap-3">
                          <Input
                            type="number"
                            min={0}
                            max={Math.min(availableCredits, basePrice - promoDiscount - giftCardDiscount)}
                            step={0.01}
                            value={creditsToApply || ""}
                            onChange={(e) => handleCreditsChange(e.target.value)}
                            placeholder="Amount to apply"
                            className="max-w-xs"
                          />
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              const max = Math.max(0, basePrice - promoDiscount - giftCardDiscount);
                              setCreditsToApply(Math.min(availableCredits, max));
                            }}
                          >
                            Use Max
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </Card>
              )}

              {/* Step 3: Shipping Address */}
              {currentStep === 3 && (
                <Card padding="lg">
                  <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-aura-primary" />
                    Shipping Address
                  </h2>

                  <div className="space-y-4">
                    <div className="grid sm:grid-cols-2 gap-4">
                      <Input
                        label="First Name *"
                        placeholder="First name"
                        value={shippingAddress.firstName}
                        onChange={(e) => updateAddress("firstName", e.target.value)}
                      />
                      <Input
                        label="Last Name *"
                        placeholder="Last name"
                        value={shippingAddress.lastName}
                        onChange={(e) => updateAddress("lastName", e.target.value)}
                      />
                    </div>
                    <Input
                      label="Address Line 1 *"
                      placeholder="Street address"
                      value={shippingAddress.address1}
                      onChange={(e) => updateAddress("address1", e.target.value)}
                    />
                    <Input
                      label="Address Line 2"
                      placeholder="Apartment, suite, unit, etc."
                      value={shippingAddress.address2}
                      onChange={(e) => updateAddress("address2", e.target.value)}
                    />
                    <div className="grid sm:grid-cols-3 gap-4">
                      <Input
                        label="City *"
                        placeholder="City"
                        value={shippingAddress.city}
                        onChange={(e) => updateAddress("city", e.target.value)}
                      />
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">State *</label>
                        <select
                          className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-aura-primary/20 focus:border-aura-primary outline-none bg-white"
                          value={shippingAddress.state}
                          onChange={(e) => updateAddress("state", e.target.value)}
                        >
                          <option value="">Select</option>
                          {US_STATES.map((s) => (
                            <option key={s} value={s}>{s}</option>
                          ))}
                        </select>
                      </div>
                      <Input
                        label="ZIP Code *"
                        placeholder="12345"
                        value={shippingAddress.zipCode}
                        onChange={(e) => updateAddress("zipCode", e.target.value)}
                        maxLength={10}
                      />
                    </div>
                    <Input
                      label="Phone (optional)"
                      type="tel"
                      placeholder="(555) 123-4567"
                      value={shippingAddress.phone}
                      onChange={(e) => updateAddress("phone", e.target.value)}
                      helperText="For delivery updates"
                    />
                  </div>
                </Card>
              )}

              {/* Step 4: Payment Method */}
              {currentStep === 4 && (
                <Card padding="lg">
                  <h2 className="text-xl font-semibold mb-6">Payment Method</h2>

                  <div className="space-y-4">
                    {/* Card */}
                    <button
                      onClick={() => setPaymentMethod("card")}
                      className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all text-left ${
                        paymentMethod === "card"
                          ? "border-aura-primary bg-aura-primary/5"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        paymentMethod === "card" ? "bg-aura-primary text-white" : "bg-gray-100 text-gray-400"
                      }`}>
                        <CreditCard className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="font-medium">Pay with Card</p>
                        <p className="text-sm text-gray-500">Secure payment via Stripe</p>
                      </div>
                    </button>

                    {/* Credits Only (if credits cover full amount) */}
                    {creditsToApply > 0 && total <= 0.01 && (
                      <button
                        onClick={() => setPaymentMethod("credits")}
                        className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all text-left ${
                          paymentMethod === "credits"
                            ? "border-aura-primary bg-aura-primary/5"
                            : "border-gray-200 hover:border-gray-300"
                        }`}
                      >
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          paymentMethod === "credits" ? "bg-aura-primary text-white" : "bg-gray-100 text-gray-400"
                        }`}>
                          <Wallet className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="font-medium">Pay with Credits</p>
                          <p className="text-sm text-gray-500">
                            Your credits and gift card balance cover this order
                          </p>
                        </div>
                      </button>
                    )}

                    {/* B2B Invoice */}
                    {isDealer && organization && (
                      <button
                        onClick={() => setPaymentMethod("invoice")}
                        className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all text-left ${
                          paymentMethod === "invoice"
                            ? "border-aura-primary bg-aura-primary/5"
                            : "border-gray-200 hover:border-gray-300"
                        }`}
                      >
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          paymentMethod === "invoice" ? "bg-aura-primary text-white" : "bg-gray-100 text-gray-400"
                        }`}>
                          <FileText className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="font-medium">Request Invoice</p>
                          <p className="text-sm text-gray-500">
                            {organization.name} - Payment terms: {organization.payment_terms.replace("_", " ")}
                          </p>
                        </div>
                      </button>
                    )}

                    {/* PO Number for Invoice */}
                    {paymentMethod === "invoice" && (
                      <div className="ml-14">
                        <Input
                          label="PO Number *"
                          placeholder="Enter your purchase order number"
                          value={poNumber}
                          onChange={(e) => setPoNumber(e.target.value)}
                        />
                      </div>
                    )}
                  </div>

                  {/* Trust Badges */}
                  <div className="mt-8 pt-6 border-t">
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div className="flex flex-col items-center gap-2">
                        <ShieldCheck className="w-6 h-6 text-green-600" />
                        <span className="text-xs text-gray-500">SSL Encrypted</span>
                      </div>
                      <div className="flex flex-col items-center gap-2">
                        <Lock className="w-6 h-6 text-green-600" />
                        <span className="text-xs text-gray-500">Secure Payment</span>
                      </div>
                      <div className="flex flex-col items-center gap-2">
                        <CheckCircle className="w-6 h-6 text-green-600" />
                        <span className="text-xs text-gray-500">Money-Back Guarantee</span>
                      </div>
                    </div>
                  </div>
                </Card>
              )}

              {/* Navigation Buttons */}
              <div className="flex justify-between">
                {currentStep > 1 && (
                  <Button
                    variant="outline"
                    onClick={() => setCurrentStep((s) => s - 1)}
                    leftIcon={<ArrowLeft className="w-4 h-4" />}
                  >
                    Back
                  </Button>
                )}
                <div className="ml-auto">
                  {currentStep < 4 ? (
                    <Button
                      onClick={() => setCurrentStep((s) => s + 1)}
                      disabled={!canProceed()}
                      rightIcon={<ArrowRight className="w-4 h-4" />}
                    >
                      Continue
                    </Button>
                  ) : (
                    <Button
                      size="lg"
                      onClick={handleCheckout}
                      isLoading={isCheckingOut}
                      disabled={!canProceed()}
                      leftIcon={paymentMethod === "invoice" ? <FileText className="w-5 h-5" /> : <Lock className="w-5 h-5" />}
                    >
                      {paymentMethod === "invoice"
                        ? "Submit Order"
                        : total <= 0.01
                        ? "Place Order"
                        : `Pay ${formatCurrency(total)}`}
                    </Button>
                  )}
                </div>
              </div>
            </div>

            {/* Order Summary Sidebar */}
            <div className="lg:col-span-1">
              <Card padding="lg" className="sticky top-24">
                <h2 className="text-lg font-semibold mb-4">Order Summary</h2>

                {/* Box Info Compact */}
                <div className="flex items-center gap-3 pb-4 border-b">
                  <div className="w-12 h-12 bg-aura-primary rounded-lg flex items-center justify-center flex-shrink-0">
                    <Package className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="font-medium capitalize text-sm">{boxConfig.size} Box</p>
                    <p className="text-xs text-gray-500">
                      {config.slots} items
                      {purchaseType === "subscription" ? " / month" : ""}
                    </p>
                  </div>
                </div>

                <div className="space-y-3 py-4 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Subtotal</span>
                    <span>{formatCurrency(basePrice)}</span>
                  </div>

                  {promoDiscount > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>Promo ({promoValidation?.promotionName})</span>
                      <span>-{formatCurrency(promoDiscount)}</span>
                    </div>
                  )}

                  {giftCardDiscount > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>Gift Card</span>
                      <span>-{formatCurrency(giftCardDiscount)}</span>
                    </div>
                  )}

                  {creditsDiscount > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>Credits Applied</span>
                      <span>-{formatCurrency(creditsDiscount)}</span>
                    </div>
                  )}

                  <div className="flex justify-between">
                    <span className="text-gray-600">Shipping</span>
                    <span className={shipping === 0 ? "text-green-600 font-medium" : ""}>
                      {shipping === 0 ? "FREE" : formatCurrency(shipping)}
                    </span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-gray-600">Estimated Tax</span>
                    <span>{formatCurrency(tax)}</span>
                  </div>

                  <div className="flex justify-between pt-3 border-t font-semibold text-base">
                    <span>Total</span>
                    <span className="text-aura-primary">
                      {formatCurrency(total)}
                      {purchaseType === "subscription" ? "/mo" : ""}
                    </span>
                  </div>
                </div>

                {/* Savings callout */}
                {(promoDiscount > 0 || giftCardDiscount > 0 || creditsDiscount > 0 || purchaseType === "subscription") && (
                  <div className="p-3 bg-green-50 rounded-lg text-sm text-green-700 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 flex-shrink-0" />
                    <span>
                      You are saving{" "}
                      {formatCurrency(
                        promoDiscount +
                        giftCardDiscount +
                        creditsDiscount +
                        (purchaseType === "subscription" ? config.oneTimePrice - config.price : 0) +
                        (purchaseType === "subscription" ? 9.99 : 0)
                      )}
                      {purchaseType === "subscription" ? " per order" : " on this order"}
                    </span>
                  </div>
                )}

                {/* Secure checkout badge */}
                <div className="mt-4 flex items-center justify-center gap-2 text-xs text-gray-400">
                  <Lock className="w-3 h-3" />
                  <span>Secure checkout powered by Stripe</span>
                </div>

                <div className="mt-4 text-xs text-gray-400 text-center">
                  By placing your order, you agree to our{" "}
                  <Link href="/terms" className="underline hover:text-gray-600">Terms</Link>{" "}
                  and{" "}
                  <Link href="/privacy" className="underline hover:text-gray-600">Privacy Policy</Link>
                  {purchaseType === "subscription" && ". Cancel anytime from your account settings."}
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
