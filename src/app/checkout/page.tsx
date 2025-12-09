"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { getStripe } from "@/lib/stripe/client";
import { Header, Footer, Button, Input, Card } from "@/components/ui";
import { useAuth } from "@/hooks";
import { BOX_CONFIGS } from "@/types";
import { formatCurrency } from "@/lib/utils";
import {
  CreditCard,
  Lock,
  Package,
  ArrowLeft,
  CheckCircle,
  Loader2,
} from "lucide-react";
import Link from "next/link";
import type { Product } from "@/types";

interface BoxConfig {
  size: string;
  products: string[];
  price: number;
  dealerCode?: string;
}

export default function CheckoutPage() {
  const router = useRouter();
  const { user, isLoading: authLoading, isAuthenticated } = useAuth();
  const [boxConfig, setBoxConfig] = useState<BoxConfig | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [dealerCode, setDealerCode] = useState("");
  const [error, setError] = useState<string | null>(null);

  const supabase = createClient();

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/auth/login?redirectTo=/checkout");
    }
  }, [authLoading, isAuthenticated, router]);

  // Load box configuration
  useEffect(() => {
    const loadBoxConfig = async () => {
      const stored = localStorage.getItem("aura_box_config");
      if (!stored) {
        router.push("/build-box");
        return;
      }

      const config = JSON.parse(stored) as BoxConfig;
      setBoxConfig(config);

      // Pre-fill dealer code if came from referral link
      if (config.dealerCode) {
        setDealerCode(config.dealerCode);
      }

      // Fetch product details
      const { data } = await supabase
        .from("aura_products")
        .select("*")
        .in("id", config.products);

      if (data) {
        setProducts(data);
      }
      setIsLoading(false);
    };

    if (isAuthenticated) {
      loadBoxConfig();
    }
  }, [isAuthenticated, router, supabase]);

  const handleCheckout = async () => {
    if (!boxConfig) return;

    setIsCheckingOut(true);
    setError(null);

    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          boxSize: boxConfig.size,
          productIds: boxConfig.products,
          dealerCode: dealerCode || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Checkout failed");
      }

      // Redirect to Stripe
      if (data.url) {
        window.location.href = data.url;
      } else {
        const stripe = await getStripe();
        await stripe?.redirectToCheckout({ sessionId: data.sessionId });
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

  if (!boxConfig) {
    return null;
  }

  const config = BOX_CONFIGS[boxConfig.size];

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Back Link */}
          <Link
            href="/build-box"
            className="inline-flex items-center text-gray-600 hover:text-aura-primary mb-6"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Box Builder
          </Link>

          <h1 className="text-3xl font-bold mb-8">Checkout</h1>

          {error && (
            <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-lg">
              {error}
            </div>
          )}

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Order Summary */}
            <div className="lg:col-span-2">
              <Card padding="lg">
                <h2 className="text-xl font-semibold mb-4">Order Summary</h2>

                {/* Box Info */}
                <div className="flex items-center gap-4 p-4 bg-aura-light rounded-lg mb-6">
                  <div className="w-16 h-16 bg-aura-primary rounded-lg flex items-center justify-center">
                    <Package className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold capitalize">
                      {boxConfig.size} Box Subscription
                    </h3>
                    <p className="text-gray-600">
                      {config.slots} premium meals delivered monthly
                    </p>
                  </div>
                </div>

                {/* Products List */}
                <h3 className="font-medium mb-3">Your Selected Meals</h3>
                <div className="space-y-2 mb-6">
                  {products.map((product, index) => (
                    <div
                      key={`${product.id}-${index}`}
                      className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0"
                    >
                      <div className="flex items-center gap-3">
                        <CheckCircle className="w-5 h-5 text-aura-primary" />
                        <span>{product.name}</span>
                      </div>
                      <span className="text-gray-500">
                        {formatCurrency(product.price)}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Referral Code */}
                <div className="pt-4 border-t">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Referral Code (Optional)
                  </label>
                  <Input
                    placeholder="Enter referral code"
                    value={dealerCode}
                    onChange={(e) => setDealerCode(e.target.value.toUpperCase())}
                    className="max-w-xs"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    If someone referred you, enter their code here
                  </p>
                </div>
              </Card>
            </div>

            {/* Payment Summary */}
            <div>
              <Card padding="lg" className="sticky top-24">
                <h2 className="text-xl font-semibold mb-4">Payment Summary</h2>

                <div className="space-y-3 mb-6">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Subscription</span>
                    <span>{formatCurrency(config.price)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Shipping</span>
                    <span className="text-green-600">FREE</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Tax</span>
                    <span className="text-gray-400">Calculated at checkout</span>
                  </div>
                  <div className="flex justify-between pt-3 border-t font-semibold text-lg">
                    <span>Total</span>
                    <span className="text-aura-primary">
                      {formatCurrency(config.price)}/mo
                    </span>
                  </div>
                </div>

                <Button
                  className="w-full"
                  size="lg"
                  onClick={handleCheckout}
                  isLoading={isCheckingOut}
                  leftIcon={<CreditCard className="w-5 h-5" />}
                >
                  Proceed to Payment
                </Button>

                <div className="mt-4 flex items-center justify-center gap-2 text-sm text-gray-500">
                  <Lock className="w-4 h-4" />
                  <span>Secure checkout powered by Stripe</span>
                </div>

                <div className="mt-6 text-xs text-gray-400 text-center">
                  By subscribing, you agree to our{" "}
                  <Link href="/terms" className="underline">
                    Terms
                  </Link>{" "}
                  and{" "}
                  <Link href="/privacy" className="underline">
                    Privacy Policy
                  </Link>
                  . Cancel anytime from your account settings.
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
