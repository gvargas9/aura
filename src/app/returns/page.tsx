"use client";

import Link from "next/link";
import { Header, Footer } from "@/components/ui";
import {
  ShieldCheck,
  Mail,
  Clock,
  Camera,
  FileText,
  Ban,
  RefreshCw,
  ArrowRight,
  CheckCircle,
  HelpCircle,
  AlertTriangle,
} from "lucide-react";

const timeline = [
  {
    step: 1,
    icon: <Mail className="w-5 h-5" />,
    title: "Contact Us",
    description:
      "Email hello@aura.com with your order number and a description of the issue.",
  },
  {
    step: 2,
    icon: <Camera className="w-5 h-5" />,
    title: "Provide Details",
    description:
      "Include a photo of any damage if applicable. This helps us process your request quickly.",
  },
  {
    step: 3,
    icon: <FileText className="w-5 h-5" />,
    title: "We Review",
    description:
      "Our team will review your request and respond within 1-2 business days.",
  },
  {
    step: 4,
    icon: <Clock className="w-5 h-5" />,
    title: "Refund Issued",
    description:
      "Approved refunds are processed within 5-7 business days to your original payment method.",
  },
];

export default function ReturnsPage() {
  return (
    <>
      <Header />
      <main className="min-h-screen bg-white">
        {/* Hero */}
        <section className="bg-gradient-to-br from-stone-900 via-stone-800 to-stone-900 text-white py-24 px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-4 tracking-tight">
              Returns & Refunds
            </h1>
            <p className="text-lg text-stone-300">
              Your satisfaction is guaranteed
            </p>
          </div>
        </section>

        <section className="max-w-3xl mx-auto px-4 py-16">
          <div className="space-y-12">
            {/* Satisfaction Guarantee */}
            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-8 text-center">
              <ShieldCheck className="w-12 h-12 text-emerald-600 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-stone-900 mb-2">
                100% Satisfaction Guarantee
              </h2>
              <p className="text-stone-600 max-w-lg mx-auto">
                We stand behind the quality of every Aura product. If you are
                not completely satisfied with your first box, we will make it
                right.
              </p>
            </div>

            {/* Return Policy */}
            <div>
              <h2 className="text-2xl font-bold text-stone-900 mb-4">
                Return Policy
              </h2>
              <div className="space-y-4">
                <div className="flex items-start gap-3 bg-stone-50 rounded-xl p-5">
                  <Ban className="w-5 h-5 text-stone-500 mt-0.5 shrink-0" />
                  <div>
                    <h3 className="font-medium text-stone-900 text-sm">
                      Opened products
                    </h3>
                    <p className="text-stone-500 text-xs mt-1">
                      Due to food safety regulations, we cannot accept returns
                      of opened or consumed products.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3 bg-stone-50 rounded-xl p-5">
                  <CheckCircle className="w-5 h-5 text-emerald-500 mt-0.5 shrink-0" />
                  <div>
                    <h3 className="font-medium text-stone-900 text-sm">
                      Damaged or defective items
                    </h3>
                    <p className="text-stone-500 text-xs mt-1">
                      If your products arrive damaged or defective, we will
                      replace them or issue a full refund at no additional cost
                      to you.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3 bg-stone-50 rounded-xl p-5">
                  <AlertTriangle className="w-5 h-5 text-amber-500 mt-0.5 shrink-0" />
                  <div>
                    <h3 className="font-medium text-stone-900 text-sm">
                      Wrong items received
                    </h3>
                    <p className="text-stone-500 text-xs mt-1">
                      If you received the wrong products, contact us and we will
                      ship the correct items right away.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* How to Request */}
            <div>
              <h2 className="text-2xl font-bold text-stone-900 mb-6">
                How to Request a Refund
              </h2>
              <div className="space-y-4">
                {timeline.map((item) => (
                  <div
                    key={item.step}
                    className="flex items-start gap-4"
                  >
                    <div className="flex items-center justify-center w-10 h-10 bg-stone-900 text-white rounded-full shrink-0 text-sm font-bold">
                      {item.step}
                    </div>
                    <div className="pt-1">
                      <h3 className="font-semibold text-stone-900 text-sm">
                        {item.title}
                      </h3>
                      <p className="text-stone-500 text-xs mt-1">
                        {item.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Refund Timeline */}
            <div className="bg-stone-50 rounded-2xl p-6">
              <div className="flex items-center gap-2 mb-3">
                <Clock className="w-5 h-5 text-stone-600" />
                <h3 className="font-semibold text-stone-900">
                  Refund Timeline
                </h3>
              </div>
              <p className="text-stone-600 text-sm">
                Once your refund is approved, it will be processed within{" "}
                <span className="font-semibold text-stone-900">
                  5-7 business days
                </span>{" "}
                to your original payment method. You will receive a confirmation
                email when the refund has been issued.
              </p>
            </div>

            {/* Subscription Cancellation */}
            <div>
              <div className="flex items-center gap-3 mb-4">
                <RefreshCw className="w-6 h-6 text-stone-700" />
                <h2 className="text-2xl font-bold text-stone-900">
                  Subscription Cancellation
                </h2>
              </div>
              <div className="bg-stone-50 rounded-2xl p-6 space-y-3">
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-emerald-500 mt-0.5 shrink-0" />
                  <p className="text-stone-700 text-sm">
                    Cancel your subscription anytime from your dashboard — no
                    cancellation fees, no questions asked.
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-emerald-500 mt-0.5 shrink-0" />
                  <p className="text-stone-700 text-sm">
                    Your current billing period will be honored. You will
                    continue to receive any boxes already paid for.
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-emerald-500 mt-0.5 shrink-0" />
                  <p className="text-stone-700 text-sm">
                    You can also pause your subscription to skip a month without
                    losing your pricing.
                  </p>
                </div>
              </div>
            </div>

            {/* CTA */}
            <div className="text-center bg-stone-900 rounded-2xl p-8">
              <HelpCircle className="w-10 h-10 text-stone-400 mx-auto mb-3" />
              <h2 className="text-xl font-bold text-white mb-2">Need help?</h2>
              <p className="text-stone-400 text-sm mb-6">
                Our support team is ready to assist you with any questions.
              </p>
              <Link
                href="/help"
                className="inline-flex items-center gap-2 bg-white text-stone-900 font-semibold px-6 py-3 rounded-xl hover:bg-stone-100 transition"
              >
                Visit Help Center
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
