"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Header, Footer, Button, Card } from "@/components/ui";
import { CheckCircle, Package, ArrowRight, Loader2 } from "lucide-react";
import confetti from "canvas-confetti";

export default function CheckoutSuccessPage() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Clear box config from localStorage
    localStorage.removeItem("aura_box_config");

    // Celebrate with confetti
    const timer = setTimeout(() => {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ["#10B981", "#059669", "#F59E0B"],
      });
      setIsLoading(false);
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-aura-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 flex items-center justify-center py-12 px-4 bg-gradient-to-b from-aura-light to-white">
        <Card className="max-w-lg w-full text-center p-8">
          <div className="w-20 h-20 bg-aura-primary/10 rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse">
            <CheckCircle className="w-10 h-10 text-aura-primary" />
          </div>

          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome to Aura!
          </h1>

          <p className="text-lg text-gray-600 mb-6">
            Your subscription is now active. Your first box is being prepared and
            will ship within 2-3 business days.
          </p>

          {/* Order Info */}
          <div className="bg-gray-50 rounded-lg p-6 mb-6">
            <div className="flex items-center justify-center gap-3 mb-4">
              <Package className="w-6 h-6 text-aura-primary" />
              <span className="font-semibold">What&apos;s Next?</span>
            </div>
            <ul className="text-left space-y-3 text-gray-600">
              <li className="flex items-start gap-2">
                <CheckCircle className="w-5 h-5 text-aura-primary flex-shrink-0 mt-0.5" />
                <span>
                  You&apos;ll receive an email confirmation with your order details
                </span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-5 h-5 text-aura-primary flex-shrink-0 mt-0.5" />
                <span>
                  We&apos;ll notify you when your box ships with tracking info
                </span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-5 h-5 text-aura-primary flex-shrink-0 mt-0.5" />
                <span>
                  Customize your next box anytime from your dashboard
                </span>
              </li>
            </ul>
          </div>

          <div className="space-y-3">
            <Link href="/dashboard">
              <Button className="w-full" rightIcon={<ArrowRight className="w-5 h-5" />}>
                Go to Dashboard
              </Button>
            </Link>
            <Link href="/products">
              <Button variant="secondary" className="w-full">
                Browse More Products
              </Button>
            </Link>
          </div>

          <p className="mt-6 text-sm text-gray-500">
            Questions? Contact us at{" "}
            <a href="mailto:support@aura.com" className="text-aura-primary">
              support@aura.com
            </a>
          </p>
        </Card>
      </main>

      <Footer />
    </div>
  );
}
