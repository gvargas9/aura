"use client";

import Link from "next/link";
import { Header, Footer } from "@/components/ui";
import {
  ArrowRight,
  CheckCircle,
  TrendingUp,
  Shield,
  BarChart3,
  CreditCard,
  Store,
  Dumbbell,
  Ship,
  Plane,
  Building2,
  Trees,
  ShoppingBag,
  Layers,
  Percent,
  Zap,
} from "lucide-react";

const dealerTiers = [
  {
    name: "Bronze",
    discount: "5%",
    color: "from-amber-700 to-amber-600",
    border: "border-amber-300",
    bg: "bg-amber-50",
    text: "text-amber-800",
    description: "Getting started",
    perks: [
      "Dealer dashboard access",
      "Referral QR codes",
      "Email support",
      "Monthly statements",
    ],
  },
  {
    name: "Silver",
    discount: "10%",
    color: "from-gray-400 to-gray-500",
    border: "border-gray-300",
    bg: "bg-gray-50",
    text: "text-gray-700",
    description: "Growing volume",
    perks: [
      "All Bronze benefits",
      "Custom promo codes",
      "Priority support",
      "Bi-weekly payouts",
    ],
  },
  {
    name: "Gold",
    discount: "15%",
    color: "from-yellow-500 to-amber-500",
    border: "border-yellow-400",
    bg: "bg-yellow-50",
    text: "text-yellow-800",
    description: "High performer",
    popular: true,
    perks: [
      "All Silver benefits",
      "Dedicated account manager",
      "Co-branded marketing materials",
      "Net-30 invoicing",
      "Weekly payouts",
    ],
  },
  {
    name: "Platinum",
    discount: "20%",
    color: "from-slate-700 to-slate-900",
    border: "border-slate-400",
    bg: "bg-slate-50",
    text: "text-slate-800",
    description: "Enterprise partner",
    perks: [
      "All Gold benefits",
      "White-label storefront",
      "Custom domain",
      "API access",
      "Custom pricing agreements",
      "Daily payouts",
    ],
  },
];

const benefits = [
  {
    icon: Shield,
    title: "No Inventory Risk",
    description:
      "Virtual distribution means you never hold stock. Orders ship directly from our warehouse to your customers.",
  },
  {
    icon: Store,
    title: "White-Label Storefront",
    description:
      "Premium dealers get a custom-branded portal with your logo, colors, and domain. Your brand, our fulfillment.",
  },
  {
    icon: CreditCard,
    title: "Automated Commission Payouts",
    description:
      "Commissions paid automatically via Stripe Connect. No invoicing, no chasing payments.",
  },
  {
    icon: BarChart3,
    title: "Real-Time Analytics",
    description:
      "Track sales, commissions, customer activity, and inventory levels in your personalized dealer dashboard.",
  },
  {
    icon: Zap,
    title: "Same-Day Processing",
    description:
      "Orders placed before 2pm ship the same day. Priority fulfillment for all dealer orders.",
  },
  {
    icon: Layers,
    title: "Volume Pricing Tiers",
    description:
      "The more you sell, the more you save. Monthly order volume automatically unlocks better pricing.",
  },
];

const idealFor = [
  { icon: Dumbbell, label: "Gyms & Fitness Centers" },
  { icon: Ship, label: "Marinas & Yacht Clubs" },
  { icon: Plane, label: "FBOs & Aviation" },
  { icon: ShoppingBag, label: "Retail Stores" },
  { icon: Building2, label: "Corporate Offices" },
  { icon: Trees, label: "Outdoor Retailers" },
];

const volumePricing = [
  { range: "1-100 units/mo", discount: "Base wholesale pricing", tier: "Bronze" },
  { range: "101-500 units/mo", discount: "Additional 5% off wholesale", tier: "Silver" },
  { range: "501-2,000 units/mo", discount: "Additional 10% off wholesale", tier: "Gold" },
  { range: "2,000+ units/mo", discount: "Custom pricing available", tier: "Platinum" },
];

export default function WholesalePage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      {/* Hero */}
      <section className="bg-aura-gradient py-20 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <span className="inline-block px-4 py-1 bg-white/20 rounded-full text-sm font-medium mb-6">
              Wholesale Program
            </span>
            <h1 className="text-4xl lg:text-5xl font-bold mb-6">
              Wholesale Pricing
            </h1>
            <p className="text-xl opacity-90 mb-8">
              Premium margins on premium food. Access tiered wholesale pricing,
              automated payouts, and zero inventory risk with Aura&apos;s dealer
              program.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                href="/b2b/apply"
                className="inline-flex items-center justify-center px-8 py-3 bg-white text-aura-primary font-semibold rounded-lg hover:bg-gray-100 transition-colors"
              >
                Apply to Become a Dealer
                <ArrowRight className="ml-2 w-5 h-5" />
              </Link>
              <Link
                href="/b2b/portal"
                className="inline-flex items-center justify-center px-8 py-3 border-2 border-white text-white font-semibold rounded-lg hover:bg-white/10 transition-colors"
              >
                Already a Dealer? Log In
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Dealer Tiers */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Dealer Tier System</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Unlock better pricing and perks as your volume grows
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {dealerTiers.map((tier) => (
              <div
                key={tier.name}
                className={`rounded-xl overflow-hidden ${
                  tier.popular
                    ? "ring-4 ring-aura-accent shadow-lg"
                    : "border border-gray-200"
                }`}
              >
                <div
                  className={`bg-gradient-to-r ${tier.color} px-6 py-4 text-white`}
                >
                  {tier.popular && (
                    <span className="inline-block px-3 py-0.5 bg-aura-accent text-white text-xs font-bold rounded-full mb-2">
                      Most Popular
                    </span>
                  )}
                  <h3 className="text-xl font-bold">{tier.name}</h3>
                  <p className="text-white/80 text-sm">{tier.description}</p>
                </div>
                <div className="p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <Percent className={`w-5 h-5 ${tier.text}`} />
                    <span className="text-2xl font-bold">{tier.discount}</span>
                    <span className="text-gray-500 text-sm">wholesale discount</span>
                  </div>
                  <ul className="space-y-2">
                    {tier.perks.map((perk) => (
                      <li key={perk} className="flex items-start gap-2 text-sm">
                        <CheckCircle className="w-4 h-4 text-aura-primary flex-shrink-0 mt-0.5" />
                        <span className="text-gray-700">{perk}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Why Go Wholesale with Aura?</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Built for modern dealers who want premium products without the
              traditional wholesale headaches
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {benefits.map((benefit) => (
              <div
                key={benefit.title}
                className="p-6 bg-white rounded-xl border border-gray-200 hover:border-aura-primary transition-colors"
              >
                <div className="w-12 h-12 bg-aura-primary/10 rounded-lg flex items-center justify-center mb-4">
                  <benefit.icon className="w-6 h-6 text-aura-primary" />
                </div>
                <h3 className="text-lg font-semibold mb-2">{benefit.title}</h3>
                <p className="text-gray-600">{benefit.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Volume Pricing */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Volume Pricing</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Tiered pricing based on your monthly order volume
            </p>
          </div>

          <div className="max-w-3xl mx-auto">
            <div className="bg-gray-50 rounded-xl overflow-hidden">
              <div className="grid grid-cols-3 gap-4 px-6 py-3 bg-gray-100 text-sm font-semibold text-gray-700">
                <span>Monthly Volume</span>
                <span>Pricing</span>
                <span>Tier</span>
              </div>
              {volumePricing.map((row, i) => (
                <div
                  key={row.range}
                  className={`grid grid-cols-3 gap-4 px-6 py-4 text-sm ${
                    i < volumePricing.length - 1 ? "border-b border-gray-200" : ""
                  }`}
                >
                  <span className="font-medium text-gray-900">{row.range}</span>
                  <span className="text-gray-600">{row.discount}</span>
                  <span className="text-aura-primary font-medium">{row.tier}</span>
                </div>
              ))}
            </div>
            <p className="text-center text-sm text-gray-500 mt-4">
              Volume is calculated on a rolling 30-day basis and tiers adjust
              automatically.
            </p>
          </div>
        </div>
      </section>

      {/* Ideal For */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Ideal For</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Aura wholesale partners thrive across diverse industries
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {idealFor.map((item) => (
              <div
                key={item.label}
                className="flex flex-col items-center p-6 bg-white rounded-xl border border-gray-200 hover:border-aura-primary hover:shadow-md transition-all"
              >
                <item.icon className="w-10 h-10 text-aura-primary mb-3" />
                <span className="text-sm font-medium text-gray-700 text-center">
                  {item.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-aura-dark">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <TrendingUp className="w-16 h-16 text-aura-primary mx-auto mb-6" />
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to Access Wholesale Pricing?
          </h2>
          <p className="text-xl text-gray-300 mb-8">
            Apply today and start selling within 48 hours. No inventory required.
          </p>
          <Link
            href="/b2b/apply"
            className="inline-flex items-center justify-center px-12 py-3 bg-aura-primary text-white font-semibold rounded-lg hover:bg-aura-primary/90 transition-colors text-lg"
          >
            Apply to Become a Dealer
            <ArrowRight className="ml-2 w-5 h-5" />
          </Link>
          <p className="mt-6 text-gray-400 text-sm">
            Already a dealer?{" "}
            <Link
              href="/b2b/portal"
              className="text-aura-primary hover:underline"
            >
              Go to your dealer portal
            </Link>
          </p>
        </div>
      </section>

      <Footer />
    </div>
  );
}

export { WholesalePage };
