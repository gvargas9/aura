"use client";

import { useEffect, useState, Suspense, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Header, Footer, Button, Card, Input } from "@/components/ui";
import { useAuth } from "@/hooks";
import { formatCurrency } from "@/lib/utils";
import {
  CheckCircle,
  Package,
  ArrowRight,
  Loader2,
  Gift,
  Users,
  Copy,
  Check,
  Sparkles,
  Truck,
  FileText,
  Heart,
  Share2,
} from "lucide-react";
import confetti from "canvas-confetti";

interface OrderDetails {
  orderNumber: string;
  total: number;
  items: Array<{
    name: string;
    quantity: number;
    price: number;
    image?: string;
  }>;
  status: string;
  purchaseType: string;
  boxSize: string;
}

function CheckoutSuccessContent() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id");
  const orderId = searchParams.get("order_id");
  const purchaseType = searchParams.get("type") || "subscription";

  const { user, profile } = useAuth();

  const [isLoading, setIsLoading] = useState(true);
  const [referralCopied, setReferralCopied] = useState(false);

  // Generate a referral link based on user
  const referralCode = user?.id?.slice(0, 8) || "";
  const referralLink = typeof window !== "undefined"
    ? `${window.location.origin}/?ref=${referralCode}`
    : "";

  useEffect(() => {
    // Clear box config from localStorage
    localStorage.removeItem("aura_box_config");

    // Celebrate with confetti
    const timer = setTimeout(() => {
      // First burst
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ["#10B981", "#059669", "#F59E0B", "#34D399", "#6EE7B7"],
      });

      // Second burst slightly delayed
      setTimeout(() => {
        confetti({
          particleCount: 50,
          angle: 60,
          spread: 55,
          origin: { x: 0 },
          colors: ["#10B981", "#059669", "#F59E0B"],
        });
        confetti({
          particleCount: 50,
          angle: 120,
          spread: 55,
          origin: { x: 1 },
          colors: ["#10B981", "#059669", "#F59E0B"],
        });
      }, 300);

      setIsLoading(false);
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  const handleCopyReferral = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(referralLink);
      setReferralCopied(true);
      setTimeout(() => setReferralCopied(false), 2500);
    } catch {
      const textarea = document.createElement("textarea");
      textarea.value = referralLink;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      setReferralCopied(true);
      setTimeout(() => setReferralCopied(false), 2500);
    }
  }, [referralLink]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-aura-primary" />
      </div>
    );
  }

  // Determine messaging based on purchase type
  const headlines: Record<string, { title: string; subtitle: string }> = {
    subscription: {
      title: "Welcome to Aura!",
      subtitle:
        "Your subscription is active. Your first box is being prepared and will ship within 2-3 business days.",
    },
    one_time: {
      title: "Order Confirmed!",
      subtitle:
        "Your box is being prepared and will ship within 2-3 business days.",
    },
    gift: {
      title: "Gift Sent Successfully!",
      subtitle:
        "Your recipient will be notified. The gift box will ship within 2-3 business days.",
    },
    invoice: {
      title: "Invoice Submitted!",
      subtitle:
        "Your order has been placed. An invoice will be sent to your organization for payment.",
    },
  };

  const content = headlines[purchaseType] || headlines.subscription;

  // Steps specific to purchase type
  const nextSteps: Record<string, Array<{ icon: React.ElementType; text: string }>> = {
    subscription: [
      { icon: CheckCircle, text: "You will receive an email confirmation with your order details" },
      { icon: Truck, text: "We will notify you when your box ships with tracking info" },
      { icon: Package, text: "Customize your next box anytime from your dashboard" },
      { icon: Sparkles, text: "Your box auto-renews monthly. Cancel or modify anytime." },
    ],
    one_time: [
      { icon: CheckCircle, text: "You will receive an email confirmation shortly" },
      { icon: Truck, text: "Your box will ship within 2-3 business days" },
      { icon: Package, text: "Track your order from the dashboard" },
    ],
    gift: [
      { icon: Gift, text: "Your recipient will receive a gift notification email" },
      { icon: Truck, text: "The gift box ships within 2-3 business days" },
      { icon: Heart, text: "They can track the delivery from the notification email" },
    ],
    invoice: [
      { icon: FileText, text: "An invoice has been generated for your organization" },
      { icon: CheckCircle, text: "Your order will be processed upon payment" },
      { icon: Package, text: "Track order status from your dealer dashboard" },
    ],
  };

  const steps = nextSteps[purchaseType] || nextSteps.subscription;

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 py-12 px-4 bg-gradient-to-b from-emerald-50/50 to-white">
        <div className="max-w-2xl mx-auto space-y-6">
          {/* Main Success Card */}
          <Card className="text-center p-8">
            <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-10 h-10 text-emerald-600" />
            </div>

            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {content.title}
            </h1>

            <p className="text-lg text-gray-600 mb-8">
              {content.subtitle}
            </p>

            {/* Order Reference */}
            {(sessionId || orderId) && (
              <div className="inline-flex items-center gap-2 bg-gray-50 rounded-lg px-4 py-2 mb-6 text-sm">
                <span className="text-gray-500">Reference:</span>
                <span className="font-mono font-medium text-gray-700">
                  {orderId || sessionId?.slice(0, 16)}
                </span>
              </div>
            )}

            {/* What's Next */}
            <div className="bg-gray-50 rounded-xl p-6 mb-6 text-left">
              <div className="flex items-center justify-center gap-3 mb-4">
                <Package className="w-6 h-6 text-aura-primary" />
                <span className="font-semibold">What Happens Next</span>
              </div>
              <ul className="space-y-3 text-gray-600">
                {steps.map((step, index) => {
                  const StepIcon = step.icon;
                  return (
                    <li key={index} className="flex items-start gap-3">
                      <StepIcon className="w-5 h-5 text-aura-primary flex-shrink-0 mt-0.5" />
                      <span>{step.text}</span>
                    </li>
                  );
                })}
              </ul>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              {purchaseType === "subscription" ? (
                <Link href="/dashboard">
                  <Button className="w-full" rightIcon={<ArrowRight className="w-5 h-5" />}>
                    Go to Dashboard
                  </Button>
                </Link>
              ) : (
                <Link href="/orders">
                  <Button className="w-full" rightIcon={<ArrowRight className="w-5 h-5" />}>
                    Track Your Order
                  </Button>
                </Link>
              )}
              <Link href="/build-box">
                <Button variant="secondary" className="w-full" leftIcon={<Package className="w-5 h-5" />}>
                  Build Another Box
                </Button>
              </Link>
            </div>
          </Card>

          {/* Referral Section */}
          <Card className="p-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-amber-50 rounded-xl flex items-center justify-center flex-shrink-0">
                <Users className="w-6 h-6 text-amber-600" />
              </div>
              <div className="flex-1">
                <h2 className="font-semibold text-lg mb-1">Share Aura, Get $10</h2>
                <p className="text-sm text-gray-500 mb-4">
                  Share your referral link with friends. When they subscribe, you both get $10 in credits.
                </p>

                <div className="flex gap-2">
                  <div className="flex-1 relative">
                    <input
                      readOnly
                      value={referralLink}
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-600 font-mono truncate pr-12"
                    />
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCopyReferral}
                    leftIcon={referralCopied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                    className={referralCopied ? "border-green-300 text-green-600" : ""}
                  >
                    {referralCopied ? "Copied" : "Copy"}
                  </Button>
                </div>

                {/* Social Share Buttons */}
                <div className="flex gap-2 mt-3">
                  <a
                    href={`https://twitter.com/intent/tweet?text=I just discovered Aura - premium meals delivered to your door! Use my link to get started:&url=${encodeURIComponent(referralLink)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-lg text-xs font-medium text-gray-600 transition-colors"
                  >
                    <Share2 className="w-3 h-3" />
                    Twitter
                  </a>
                  <a
                    href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(referralLink)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-lg text-xs font-medium text-gray-600 transition-colors"
                  >
                    <Share2 className="w-3 h-3" />
                    Facebook
                  </a>
                  <a
                    href={`mailto:?subject=Check out Aura!&body=I have been loving Aura premium meals. Use my link to get started: ${referralLink}`}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-lg text-xs font-medium text-gray-600 transition-colors"
                  >
                    <Share2 className="w-3 h-3" />
                    Email
                  </a>
                </div>
              </div>
            </div>
          </Card>

          {/* Help */}
          <p className="text-center text-sm text-gray-500">
            Questions? Contact us at{" "}
            <a href="mailto:support@aura.com" className="text-aura-primary hover:underline">
              support@aura.com
            </a>
          </p>
        </div>
      </main>

      <Footer />
    </div>
  );
}

export default function CheckoutSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-aura-primary" />
        </div>
      }
    >
      <CheckoutSuccessContent />
    </Suspense>
  );
}
