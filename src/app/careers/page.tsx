"use client";

import Link from "next/link";
import { Header, Footer } from "@/components/ui";
import {
  ArrowRight,
  Heart,
  TrendingUp,
  Lightbulb,
  MapPin,
  HeartPulse,
  PieChart,
  UtensilsCrossed,
  Laptop,
  GraduationCap,
  PartyPopper,
  Briefcase,
  Mail,
} from "lucide-react";

const reasons = [
  {
    icon: Heart,
    title: "Mission-Driven",
    description:
      "We're on a mission to change how the world thinks about shelf-stable food. Every role at Aura directly contributes to making premium food accessible everywhere.",
  },
  {
    icon: Lightbulb,
    title: "Innovative Culture",
    description:
      "From proprietary preservation technology to AI-powered recommendations, we're pushing boundaries in food tech. You'll work on problems no one else is solving.",
  },
  {
    icon: TrendingUp,
    title: "Growing Fast",
    description:
      "We've grown from a founding idea to 10,000+ customers in under two years. Join early and grow with us — there's no shortage of opportunities.",
  },
  {
    icon: MapPin,
    title: "Austin-Based",
    description:
      "Headquartered in Austin, TX — one of the best cities in America for food, tech, and quality of life. Remote-friendly roles also available.",
  },
];

const perks = [
  {
    icon: HeartPulse,
    title: "Health & Wellness",
    description: "Comprehensive medical, dental, and vision coverage for you and your family.",
  },
  {
    icon: PieChart,
    title: "Equity",
    description: "Stock options so you benefit directly from the company's growth and success.",
  },
  {
    icon: UtensilsCrossed,
    title: "Free Aura Meals",
    description: "Monthly box of Aura meals on us. Try every new recipe before anyone else.",
  },
  {
    icon: Laptop,
    title: "Remote-Friendly",
    description: "Work from our Austin HQ or remotely. We trust our team to deliver from anywhere.",
  },
  {
    icon: GraduationCap,
    title: "Learning Budget",
    description: "$1,500 annual stipend for courses, conferences, books, and professional development.",
  },
  {
    icon: PartyPopper,
    title: "Team Events",
    description: "Quarterly team gatherings, annual retreat, and regular Austin food tours.",
  },
];

export default function CareersPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      {/* Hero */}
      <section className="bg-aura-hero py-24 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <span className="inline-block px-4 py-1.5 bg-white/10 backdrop-blur-sm rounded-full text-sm font-medium mb-6 border border-white/20">
            Careers at Aura
          </span>
          <h1 className="text-4xl lg:text-6xl font-bold mb-6 font-display">
            Join the Aura Team
          </h1>
          <p className="text-xl lg:text-2xl opacity-90 max-w-2xl mx-auto leading-relaxed">
            Help us reimagine how the world eats.
          </p>
        </div>
      </section>

      {/* Why Work at Aura */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 font-display">
              Why Work at Aura?
            </h2>
            <p className="mt-4 text-lg text-gray-600 max-w-2xl mx-auto">
              We're a small team doing big things. Here's what makes Aura a
              great place to build your career.
            </p>
          </div>
          <div className="grid md:grid-cols-2 gap-8">
            {reasons.map((reason) => {
              const Icon = reason.icon;
              return (
                <div
                  key={reason.title}
                  className="flex gap-5 p-6 rounded-2xl border border-gray-100 hover:border-aura-primary/30 hover:shadow-lg transition-all duration-300"
                >
                  <div className="w-14 h-14 rounded-xl bg-aura-light flex items-center justify-center shrink-0">
                    <Icon className="w-7 h-7 text-aura-primary" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      {reason.title}
                    </h3>
                    <p className="text-gray-600 leading-relaxed">
                      {reason.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Perks */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 font-display">
              Perks & Benefits
            </h2>
            <p className="mt-4 text-lg text-gray-600">
              We take care of our team so they can focus on great work.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {perks.map((perk) => {
              const Icon = perk.icon;
              return (
                <div
                  key={perk.title}
                  className="bg-white rounded-2xl p-6 border border-gray-100 hover:shadow-md transition-shadow"
                >
                  <div className="w-12 h-12 rounded-xl bg-aura-light flex items-center justify-center mb-4">
                    <Icon className="w-6 h-6 text-aura-primary" />
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2">
                    {perk.title}
                  </h3>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    {perk.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Open Positions */}
      <section className="py-20 bg-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="mb-10">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 font-display">
              Open Positions
            </h2>
          </div>
          <div className="bg-gray-50 rounded-2xl border border-gray-100 p-10">
            <Briefcase className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-3">
              No Open Positions Right Now
            </h3>
            <p className="text-gray-600 leading-relaxed max-w-md mx-auto mb-6">
              We're always looking for talented people who are passionate about
              food, technology, and making a difference. Don't see a role that
              fits? Reach out anyway.
            </p>
            <a
              href="mailto:careers@aura.com"
              className="inline-flex items-center gap-2 text-aura-primary font-semibold hover:text-aura-secondary transition-colors"
            >
              <Mail className="w-5 h-5" />
              careers@aura.com
            </a>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-aura-gradient text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl lg:text-4xl font-bold mb-4 font-display">
            Explore Our Products
          </h2>
          <p className="text-lg opacity-90 mb-8 max-w-xl mx-auto">
            Want to see what we're all about? Check out the meals our team works
            hard to create.
          </p>
          <Link
            href="/products"
            className="inline-flex items-center gap-2 bg-white text-aura-dark font-semibold px-8 py-4 rounded-xl hover:bg-gray-100 transition-all duration-200 hover:-translate-y-0.5 shadow-lg"
          >
            View Products
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
}
