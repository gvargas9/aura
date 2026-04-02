"use client";

import Link from "next/link";
import { Header, Footer } from "@/components/ui";
import {
  Leaf,
  Lightbulb,
  Recycle,
  Globe,
  UtensilsCrossed,
  Users,
  CalendarClock,
  Truck,
  ArrowRight,
  MapPin,
} from "lucide-react";
import { cn } from "@/lib/utils";

const stats = [
  { label: "Premium Meals", value: "50+", icon: UtensilsCrossed },
  { label: "Happy Customers", value: "10K+", icon: Users },
  { label: "Shelf Life", value: "2 Years", icon: CalendarClock },
  { label: "On Orders $75+", value: "Free Shipping", icon: Truck },
];

const values = [
  {
    icon: Leaf,
    title: "Quality First",
    description:
      "Every meal is made with all-natural ingredients. No artificial preservatives, no fillers, no compromises. Just real food that tastes incredible.",
  },
  {
    icon: Lightbulb,
    title: "Innovation",
    description:
      "Our proprietary retort preservation process locks in flavor and nutrition for up to two years — without refrigeration or chemical additives.",
  },
  {
    icon: Recycle,
    title: "Sustainability",
    description:
      "Shelf-stable meals drastically reduce food waste. No cold chain means lower carbon emissions from farm to table.",
  },
  {
    icon: Globe,
    title: "Accessibility",
    description:
      "Premium food for everyone, everywhere. Whether you're stocking your pantry, heading off-grid, or preparing for the unexpected.",
  },
];

export default function AboutPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      {/* Hero */}
      <section className="bg-aura-hero py-24 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <span className="inline-block px-4 py-1.5 bg-white/10 backdrop-blur-sm rounded-full text-sm font-medium mb-6 border border-white/20">
            Our Story
          </span>
          <h1 className="text-4xl lg:text-6xl font-bold mb-6 font-display">
            About Aura
          </h1>
          <p className="text-xl lg:text-2xl opacity-90 max-w-3xl mx-auto leading-relaxed">
            A premium shelf-stable food company founded on the belief that great
            food shouldn't require refrigeration.
          </p>
        </div>
      </section>

      {/* Mission */}
      <section className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-sm font-semibold text-aura-primary uppercase tracking-widest mb-4">
            Our Mission
          </h2>
          <p className="text-2xl lg:text-3xl font-display text-gray-900 leading-snug">
            "Our mission is to make premium, all-natural meals accessible
            anywhere — from your kitchen pantry to remote adventures."
          </p>
          <div className="mt-8 w-24 h-1 bg-aura-gradient rounded-full mx-auto" />
        </div>
      </section>

      {/* Stats */}
      <section className="py-16 bg-aura-light">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {stats.map((stat) => {
              const Icon = stat.icon;
              return (
                <div
                  key={stat.label}
                  className="bg-white rounded-2xl p-6 text-center shadow-sm border border-gray-100"
                >
                  <Icon className="w-8 h-8 text-aura-primary mx-auto mb-3" />
                  <p className="text-3xl font-bold text-gray-900 mb-1">
                    {stat.value}
                  </p>
                  <p className="text-sm text-gray-500">{stat.label}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 font-display">
              What We Stand For
            </h2>
            <p className="mt-4 text-lg text-gray-600 max-w-2xl mx-auto">
              Every decision we make is guided by four core values.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {values.map((value) => {
              const Icon = value.icon;
              return (
                <div
                  key={value.title}
                  className="group p-6 rounded-2xl border border-gray-100 hover:border-aura-primary/30 hover:shadow-lg transition-all duration-300"
                >
                  <div className="w-14 h-14 rounded-xl bg-aura-light flex items-center justify-center mb-5 group-hover:bg-aura-primary/10 transition-colors">
                    <Icon className="w-7 h-7 text-aura-primary" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {value.title}
                  </h3>
                  <p className="text-gray-600 text-sm leading-relaxed">
                    {value.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Team / Founded */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 text-aura-primary mb-6">
            <MapPin className="w-5 h-5" />
            <span className="text-sm font-semibold uppercase tracking-widest">
              Austin, Texas
            </span>
          </div>
          <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 font-display mb-6">
            Founded in Austin, Texas
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed">
            From the heart of Texas, our team of food scientists, chefs, and
            outdoor enthusiasts is reimagining what shelf-stable food can be. We
            believe the best meals bring people together — no matter where they
            are.
          </p>
          <div className="mt-10 grid grid-cols-3 gap-4 max-w-md mx-auto">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="aspect-square rounded-2xl bg-gradient-to-br from-aura-light to-emerald-100 flex items-center justify-center"
              >
                <Users className="w-8 h-8 text-aura-primary/40" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-aura-gradient text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl lg:text-4xl font-bold mb-4 font-display">
            Ready to Try Aura?
          </h2>
          <p className="text-lg opacity-90 mb-8 max-w-xl mx-auto">
            Build your custom box of premium shelf-stable meals and taste the
            difference for yourself.
          </p>
          <Link
            href="/build-box"
            className="inline-flex items-center gap-2 bg-white text-aura-dark font-semibold px-8 py-4 rounded-xl hover:bg-gray-100 transition-all duration-200 hover:-translate-y-0.5 shadow-lg"
          >
            Build Your Box
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
}
