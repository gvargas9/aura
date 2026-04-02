"use client";

import { useState } from "react";
import Link from "next/link";
import { Header, Footer } from "@/components/ui";
import {
  Package,
  Truck,
  RefreshCw,
  Sparkles,
  CheckCircle,
  ArrowRight,
  Star,
  Zap,
  Shield,
  Crown,
} from "lucide-react";

const tiers = [
  {
    name: "Starter",
    slots: 8,
    subPrice: 59.99,
    oneTimePrice: 69.99,
    savings: 14,
    badge: null,
    description: "Perfect for trying premium shelf-stable meals",
    color: "from-amber-500 to-orange-500",
    borderColor: "border-amber-200",
    bgColor: "bg-amber-50",
  },
  {
    name: "Voyager",
    slots: 12,
    subPrice: 84.99,
    oneTimePrice: 99.99,
    savings: 15,
    badge: "Most Popular",
    description: "Our most popular box for everyday adventurers",
    color: "from-violet-500 to-purple-600",
    borderColor: "border-violet-200",
    bgColor: "bg-violet-50",
  },
  {
    name: "Bunker",
    slots: 24,
    subPrice: 149.99,
    oneTimePrice: 179.99,
    savings: 17,
    badge: "Best Value",
    description: "Maximum value for serious meal preppers",
    color: "from-emerald-500 to-teal-600",
    borderColor: "border-emerald-200",
    bgColor: "bg-emerald-50",
  },
];

const benefits = [
  {
    icon: <Truck className="w-6 h-6" />,
    title: "Free Shipping",
    description: "Every box ships free, every time",
  },
  {
    icon: <Shield className="w-6 h-6" />,
    title: "Cancel Anytime",
    description: "No commitments, no cancellation fees",
  },
  {
    icon: <RefreshCw className="w-6 h-6" />,
    title: "Swap Meals Each Month",
    description: "Customize your box before every shipment",
  },
  {
    icon: <Sparkles className="w-6 h-6" />,
    title: "AI Recommendations",
    description: "Personalized picks based on your preferences",
  },
];

const steps = [
  {
    step: 1,
    title: "Choose Your Box",
    description: "Pick the size that fits your lifestyle — 8, 12, or 24 meals.",
  },
  {
    step: 2,
    title: "Fill Your Slots",
    description:
      "Browse our gourmet catalog and select your favorite shelf-stable meals.",
  },
  {
    step: 3,
    title: "Enjoy Monthly Deliveries",
    description:
      "Your curated box arrives at your door every month with free shipping.",
  },
];

export default function SubscriptionsPage() {
  const [showComparison, setShowComparison] = useState(false);

  return (
    <>
      <Header />
      <main className="min-h-screen bg-white">
        {/* Hero */}
        <section className="relative bg-gradient-to-br from-stone-900 via-stone-800 to-stone-900 text-white py-24 px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-4 tracking-tight">
              Aura Subscriptions
            </h1>
            <p className="text-lg md:text-xl text-stone-300 max-w-2xl mx-auto">
              Premium meals delivered monthly. Save up to 17%.
            </p>
          </div>
        </section>

        {/* Tier Cards */}
        <section className="max-w-6xl mx-auto px-4 -mt-12 relative z-10">
          <div className="grid md:grid-cols-3 gap-6">
            {tiers.map((tier) => (
              <div
                key={tier.name}
                className={`relative bg-white rounded-2xl shadow-lg border-2 ${tier.borderColor} p-8 flex flex-col transition-transform hover:-translate-y-1 hover:shadow-xl`}
              >
                {tier.badge && (
                  <span
                    className={`absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r ${tier.color} text-white text-xs font-semibold px-4 py-1 rounded-full`}
                  >
                    {tier.badge}
                  </span>
                )}
                <div className={`${tier.bgColor} rounded-xl p-4 mb-6`}>
                  <h3 className="text-2xl font-bold text-stone-900">
                    {tier.name}
                  </h3>
                  <p className="text-stone-600 text-sm mt-1">
                    {tier.description}
                  </p>
                </div>
                <div className="mb-6">
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-bold text-stone-900">
                      ${tier.subPrice}
                    </span>
                    <span className="text-stone-500">/mo</span>
                  </div>
                  <p className="text-sm text-stone-500 mt-1">
                    {tier.slots} meals per box
                  </p>
                </div>
                <ul className="space-y-3 mb-8 flex-1">
                  <li className="flex items-center gap-2 text-sm text-stone-700">
                    <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
                    {tier.slots} premium shelf-stable meals
                  </li>
                  <li className="flex items-center gap-2 text-sm text-stone-700">
                    <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
                    Free shipping included
                  </li>
                  <li className="flex items-center gap-2 text-sm text-stone-700">
                    <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
                    Save {tier.savings}% vs one-time
                  </li>
                  <li className="flex items-center gap-2 text-sm text-stone-700">
                    <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
                    Cancel or pause anytime
                  </li>
                </ul>
                <Link
                  href="/build-box"
                  className={`block w-full text-center bg-gradient-to-r ${tier.color} text-white font-semibold py-3 rounded-xl hover:opacity-90 transition`}
                >
                  Build Your Box
                </Link>
              </div>
            ))}
          </div>
        </section>

        {/* Benefits */}
        <section className="max-w-6xl mx-auto px-4 py-20">
          <h2 className="text-3xl font-bold text-center text-stone-900 mb-12">
            Why Subscribe?
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {benefits.map((benefit) => (
              <div key={benefit.title} className="text-center">
                <div className="inline-flex items-center justify-center w-14 h-14 bg-stone-100 rounded-2xl text-stone-700 mb-4">
                  {benefit.icon}
                </div>
                <h3 className="font-semibold text-stone-900 mb-1">
                  {benefit.title}
                </h3>
                <p className="text-sm text-stone-500">{benefit.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Comparison Table */}
        <section className="max-w-4xl mx-auto px-4 pb-20">
          <div className="bg-stone-50 rounded-2xl p-8">
            <h2 className="text-2xl font-bold text-stone-900 mb-2 text-center">
              Subscription vs One-Time
            </h2>
            <p className="text-stone-500 text-center mb-8">
              See how much you save with a subscription
            </p>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-stone-200">
                    <th className="py-3 pr-4 text-sm font-semibold text-stone-700">
                      Box
                    </th>
                    <th className="py-3 px-4 text-sm font-semibold text-stone-700">
                      Subscription
                    </th>
                    <th className="py-3 px-4 text-sm font-semibold text-stone-700">
                      One-Time
                    </th>
                    <th className="py-3 pl-4 text-sm font-semibold text-emerald-600">
                      You Save
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {tiers.map((tier) => (
                    <tr
                      key={tier.name}
                      className="border-b border-stone-100 last:border-0"
                    >
                      <td className="py-4 pr-4">
                        <span className="font-semibold text-stone-900">
                          {tier.name}
                        </span>
                        <span className="text-stone-400 text-sm ml-2">
                          ({tier.slots} meals)
                        </span>
                      </td>
                      <td className="py-4 px-4 font-semibold text-stone-900">
                        ${tier.subPrice}/mo
                      </td>
                      <td className="py-4 px-4 text-stone-500 line-through">
                        ${tier.oneTimePrice}
                      </td>
                      <td className="py-4 pl-4">
                        <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-700 text-sm font-semibold px-3 py-1 rounded-full">
                          <Zap className="w-3 h-3" />
                          {tier.savings}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section className="bg-stone-900 text-white py-20 px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-12">
              How It Works
            </h2>
            <div className="grid md:grid-cols-3 gap-8">
              {steps.map((step) => (
                <div key={step.step} className="text-center">
                  <div className="inline-flex items-center justify-center w-12 h-12 bg-white/10 rounded-full text-white font-bold text-xl mb-4">
                    {step.step}
                  </div>
                  <h3 className="font-semibold text-lg mb-2">{step.title}</h3>
                  <p className="text-stone-400 text-sm">{step.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-20 px-4 text-center">
          <h2 className="text-3xl font-bold text-stone-900 mb-4">
            Ready to get started?
          </h2>
          <p className="text-stone-500 mb-8 max-w-lg mx-auto">
            Build your custom box of premium shelf-stable meals and start saving
            today.
          </p>
          <Link
            href="/build-box"
            className="inline-flex items-center gap-2 bg-stone-900 text-white font-semibold px-8 py-4 rounded-xl hover:bg-stone-800 transition"
          >
            Build Your Box
            <ArrowRight className="w-5 h-5" />
          </Link>
        </section>
      </main>
      <Footer />
    </>
  );
}
