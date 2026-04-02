"use client";

import Link from "next/link";
import { Header, Footer } from "@/components/ui";
import {
  Package,
  UtensilsCrossed,
  Truck,
  ArrowRight,
  ShieldCheck,
  Repeat,
  Zap,
  Leaf,
  ChevronDown,
  Timer,
  Sparkles,
  CheckCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";

const steps = [
  {
    number: "01",
    icon: Package,
    title: "Choose Your Box",
    description:
      "Pick the size that fits your lifestyle. Each tier is designed for different needs — from weekly meals to full pantry stocking.",
    details: [
      { label: "Starter", info: "8 meals — perfect for trying Aura" },
      { label: "Voyager", info: "12 meals — our most popular option" },
      { label: "Bunker", info: "24 meals — full pantry preparedness" },
    ],
  },
  {
    number: "02",
    icon: UtensilsCrossed,
    title: "Fill With Favorites",
    description:
      "Browse our catalog of 50+ premium meals. Filter by dietary needs — keto, vegan, gluten-free, and more. Or let Aura AI smart-fill your box.",
    details: [
      { label: "Browse", info: "50+ premium shelf-stable meals" },
      { label: "Filter", info: "Dietary preferences and allergens" },
      { label: "AI Smart-Fill", info: "Let us curate the perfect box" },
    ],
  },
  {
    number: "03",
    icon: Truck,
    title: "Delivered Monthly",
    description:
      "Free shipping on every subscription order. Your meals arrive at your door, ready to eat. Pause, swap, or cancel anytime.",
    details: [
      { label: "Free Shipping", info: "On all subscription orders" },
      { label: "Flexible", info: "Pause, swap, or cancel anytime" },
      { label: "Track", info: "Real-time delivery tracking" },
    ],
  },
];

const faqs = [
  {
    question: "How long do Aura meals really last?",
    answer:
      "Every Aura meal has a minimum 2-year shelf life from the date of production. Our retort preservation process locks in freshness without artificial preservatives. Most customers receive meals with 20+ months of shelf life remaining.",
  },
  {
    question: "Are there any artificial preservatives?",
    answer:
      "Absolutely not. Aura meals are 100% all-natural. We use a proprietary retort cooking process — the same technology used by premium food manufacturers — to achieve long shelf life through heat treatment, not chemicals.",
  },
  {
    question: "Can I customize my box each month?",
    answer:
      "Yes! Subscribers can swap out any meals before their next shipment. You'll receive a reminder email 5 days before your box ships, giving you time to make changes in your dashboard.",
  },
  {
    question: "What if I don't like a meal?",
    answer:
      "We offer a satisfaction guarantee. If you're not happy with a meal, reach out to our team and we'll make it right — whether that's a credit, replacement, or refund.",
  },
  {
    question: "Do I need to heat the meals?",
    answer:
      "Most Aura meals can be enjoyed heated or at room temperature. Simply tear open the pouch and heat in a microwave for 60-90 seconds, or warm in boiling water for 3-5 minutes. Perfect for home, office, or outdoors.",
  },
];

function FAQItem({
  question,
  answer,
}: {
  question: string;
  answer: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="border-b border-gray-200 last:border-0">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between py-5 text-left gap-4"
        aria-expanded={open}
      >
        <span className="text-lg font-medium text-gray-900">{question}</span>
        <ChevronDown
          className={cn(
            "w-5 h-5 text-gray-400 shrink-0 transition-transform duration-200",
            open && "rotate-180"
          )}
        />
      </button>
      <div
        className={cn(
          "overflow-hidden transition-all duration-300",
          open ? "max-h-96 pb-5" : "max-h-0"
        )}
      >
        <p className="text-gray-600 leading-relaxed">{answer}</p>
      </div>
    </div>
  );
}

export default function HowItWorksPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      {/* Hero */}
      <section className="bg-aura-hero py-24 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <span className="inline-block px-4 py-1.5 bg-white/10 backdrop-blur-sm rounded-full text-sm font-medium mb-6 border border-white/20">
            Simple as 1-2-3
          </span>
          <h1 className="text-4xl lg:text-6xl font-bold mb-6 font-display">
            How Aura Works
          </h1>
          <p className="text-xl lg:text-2xl opacity-90 max-w-2xl mx-auto leading-relaxed">
            Premium meals, delivered to your door in 3 simple steps.
          </p>
        </div>
      </section>

      {/* Steps */}
      <section className="py-20 bg-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="space-y-16">
            {steps.map((step, index) => {
              const Icon = step.icon;
              return (
                <div
                  key={step.number}
                  className={cn(
                    "flex flex-col lg:flex-row items-center gap-10",
                    index % 2 === 1 && "lg:flex-row-reverse"
                  )}
                >
                  {/* Visual */}
                  <div className="flex-1 w-full">
                    <div className="bg-gradient-to-br from-aura-light to-emerald-50 rounded-3xl p-10 relative overflow-hidden">
                      <span className="absolute top-4 right-4 text-8xl font-bold text-aura-primary/10 font-display">
                        {step.number}
                      </span>
                      <Icon className="w-16 h-16 text-aura-primary mb-6" />
                      <div className="space-y-3">
                        {step.details.map((detail) => (
                          <div
                            key={detail.label}
                            className="flex items-center gap-3 bg-white/80 rounded-xl px-4 py-3"
                          >
                            <CheckCircle className="w-5 h-5 text-aura-primary shrink-0" />
                            <div>
                              <span className="font-semibold text-gray-900">
                                {detail.label}
                              </span>
                              <span className="text-gray-500"> — {detail.info}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Text */}
                  <div className="flex-1">
                    <span className="text-aura-primary font-bold text-sm uppercase tracking-widest">
                      Step {step.number}
                    </span>
                    <h3 className="text-3xl font-bold text-gray-900 mt-2 mb-4 font-display">
                      {step.title}
                    </h3>
                    <p className="text-lg text-gray-600 leading-relaxed">
                      {step.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Why Shelf-Stable */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 font-display">
              Why Shelf-Stable?
            </h2>
            <p className="mt-4 text-lg text-gray-600 max-w-2xl mx-auto">
              Modern preservation technology meets premium ingredients.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                icon: Timer,
                title: "2-Year Shelf Life",
                description:
                  "No refrigeration needed. Store at room temperature for up to 24 months.",
              },
              {
                icon: Leaf,
                title: "No Preservatives",
                description:
                  "All-natural ingredients only. Our retort process replaces chemical additives.",
              },
              {
                icon: Zap,
                title: "Retort Technology",
                description:
                  "Commercial-grade heat processing seals in flavor, nutrients, and freshness.",
              },
              {
                icon: ShieldCheck,
                title: "Safety Guaranteed",
                description:
                  "FDA-compliant processing in certified facilities. Tested for quality at every step.",
              },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.title}
                  className="bg-white rounded-2xl p-6 border border-gray-100 hover:shadow-md transition-shadow"
                >
                  <div className="w-12 h-12 rounded-xl bg-aura-light flex items-center justify-center mb-4">
                    <Icon className="w-6 h-6 text-aura-primary" />
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2">
                    {item.title}
                  </h3>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    {item.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Subscription vs One-Time */}
      <section className="py-20 bg-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 font-display">
              Subscription vs. One-Time
            </h2>
            <p className="mt-4 text-lg text-gray-600">
              Subscribe and save up to 17% on every order.
            </p>
          </div>
          <div className="grid md:grid-cols-2 gap-8">
            {/* Subscription */}
            <div className="relative rounded-2xl border-2 border-aura-primary p-8 bg-aura-light/30">
              <span className="absolute -top-3 left-6 bg-aura-primary text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wide">
                Best Value
              </span>
              <div className="flex items-center gap-3 mb-4">
                <Repeat className="w-6 h-6 text-aura-primary" />
                <h3 className="text-xl font-bold text-gray-900">
                  Monthly Subscription
                </h3>
              </div>
              <ul className="space-y-3 text-gray-700">
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-aura-primary shrink-0 mt-0.5" />
                  <span>Save 14-17% compared to one-time pricing</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-aura-primary shrink-0 mt-0.5" />
                  <span>Free shipping on every delivery</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-aura-primary shrink-0 mt-0.5" />
                  <span>Swap meals, pause, or cancel anytime</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-aura-primary shrink-0 mt-0.5" />
                  <span>Auto-renews monthly — no effort required</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-aura-primary shrink-0 mt-0.5" />
                  <span>Priority customer support</span>
                </li>
              </ul>
              <p className="mt-6 text-sm text-gray-500">
                Starting at{" "}
                <span className="font-bold text-gray-900 text-lg">
                  $59.99/mo
                </span>
              </p>
            </div>

            {/* One-Time */}
            <div className="rounded-2xl border border-gray-200 p-8">
              <div className="flex items-center gap-3 mb-4">
                <Package className="w-6 h-6 text-gray-500" />
                <h3 className="text-xl font-bold text-gray-900">
                  One-Time Purchase
                </h3>
              </div>
              <ul className="space-y-3 text-gray-700">
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-gray-400 shrink-0 mt-0.5" />
                  <span>No commitment — order when you want</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-gray-400 shrink-0 mt-0.5" />
                  <span>Same premium quality meals</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-gray-400 shrink-0 mt-0.5" />
                  <span>Great for gifts or first-time buyers</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-gray-400 shrink-0 mt-0.5" />
                  <span>Free shipping on orders over $75</span>
                </li>
              </ul>
              <p className="mt-6 text-sm text-gray-500">
                Starting at{" "}
                <span className="font-bold text-gray-900 text-lg">$69.99</span>
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 font-display">
              Frequently Asked Questions
            </h2>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 divide-y divide-gray-100 px-6">
            {faqs.map((faq) => (
              <FAQItem
                key={faq.question}
                question={faq.question}
                answer={faq.answer}
              />
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-aura-gradient text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <Sparkles className="w-10 h-10 mx-auto mb-4 opacity-80" />
          <h2 className="text-3xl lg:text-4xl font-bold mb-4 font-display">
            Build Your First Box
          </h2>
          <p className="text-lg opacity-90 mb-8 max-w-xl mx-auto">
            Pick your size, fill it with meals you love, and we'll handle the
            rest. It takes less than 2 minutes.
          </p>
          <Link
            href="/build-box"
            className="inline-flex items-center gap-2 bg-white text-aura-dark font-semibold px-8 py-4 rounded-xl hover:bg-gray-100 transition-all duration-200 hover:-translate-y-0.5 shadow-lg"
          >
            Get Started
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
}
