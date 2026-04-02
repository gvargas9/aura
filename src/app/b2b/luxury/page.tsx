"use client";

import Link from "next/link";
import { Header, Footer } from "@/components/ui";
import {
  ArrowRight,
  CheckCircle,
  Plane,
  Ship,
  Thermometer,
  Clock,
  ChefHat,
  ShieldCheck,
  Package,
  Star,
  Quote,
  Anchor,
  CircleDot,
} from "lucide-react";

const aviationBenefits = [
  {
    icon: Clock,
    title: "2-Year Shelf Life",
    description:
      "Eliminates spoilage concerns for provisioning. Stock once, serve for months without waste.",
  },
  {
    icon: Thermometer,
    title: "No Refrigeration Needed",
    description:
      "Saves precious galley space. No cold chain logistics, no temperature monitoring.",
  },
  {
    icon: ChefHat,
    title: "Gourmet Quality",
    description:
      "Premium ingredients and chef-crafted recipes that meet the expectations of discerning clients.",
  },
  {
    icon: Package,
    title: "Easy Reordering",
    description:
      "Reorder through your branded dealer portal in seconds. Set up auto-replenishment schedules.",
  },
  {
    icon: ShieldCheck,
    title: "Consistent Quality",
    description:
      "Every meal, every time. No variability from batch to batch means reliable client experiences.",
  },
  {
    icon: Star,
    title: "Premium Presentation",
    description:
      "Elegant packaging designed for high-end environments. Your clients notice the difference.",
  },
];

const aviationUseCases = [
  "FBO lounges and pilot shops",
  "Private jet catering and provisioning",
  "Charter flight meal service",
  "Airport executive lounges",
  "Flight school break rooms",
];

const marineUseCases = [
  "Yacht provisioning and galley stocking",
  "Marina ship stores and retail",
  "Charter yacht meal planning",
  "Cruise provisioning for small vessels",
  "Sailing club pantry programs",
];

const testimonials = [
  {
    quote:
      "Our FBO clients expect premium everything. Aura lets us stock gourmet meals without the cold storage headaches. The 2-year shelf life means zero waste, and our pilots love grabbing a quality meal before wheels-up.",
    name: "Marcus Thompson",
    title: "FBO Manager",
    location: "Scottsdale, AZ",
    icon: Plane,
  },
  {
    quote:
      "Galley space on a yacht is precious real estate. Aura meals don't need refrigeration, taste incredible, and my charter guests can't tell they're shelf-stable. It's changed how I provision for multi-day trips.",
    name: "Sarah Mitchell",
    title: "Yacht Chef",
    location: "Miami, FL",
    icon: Anchor,
  },
];

const howItWorks = [
  {
    step: "01",
    title: "Become a Dealer",
    description:
      "Apply for a dealer account and get approved within 1-2 business days. No minimum order requirements to start.",
  },
  {
    step: "02",
    title: "Get Wholesale Pricing",
    description:
      "Access tiered wholesale pricing from 5% to 20% off retail. Volume automatically unlocks better tiers.",
  },
  {
    step: "03",
    title: "Order Through Your Portal",
    description:
      "Use your branded dealer portal to browse, order, and track inventory. Set up recurring orders for effortless restocking.",
  },
];

export default function LuxuryPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      {/* Hero */}
      <section className="bg-aura-gradient py-20 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <span className="inline-block px-4 py-1 bg-white/20 rounded-full text-sm font-medium mb-6">
              Aviation &amp; Marine
            </span>
            <h1 className="text-4xl lg:text-5xl font-bold mb-6">
              Aviation &amp; Marine
            </h1>
            <p className="text-xl opacity-90 mb-8">
              Premium provisioning for discerning clients. Gourmet shelf-stable
              meals that meet the highest standards&mdash;without the cold chain
              complexity.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                href="/b2b/apply"
                className="inline-flex items-center justify-center px-8 py-3 bg-white text-aura-primary font-semibold rounded-lg hover:bg-gray-100 transition-colors"
              >
                Become a Dealer
                <ArrowRight className="ml-2 w-5 h-5" />
              </Link>
              <Link
                href="/wholesale"
                className="inline-flex items-center justify-center px-8 py-3 border-2 border-white text-white font-semibold rounded-lg hover:bg-white/10 transition-colors"
              >
                View Wholesale Pricing
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Why Aura */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">
              Why Aura for Aviation &amp; Marine?
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Purpose-built for environments where quality matters and space is
              at a premium
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {aviationBenefits.map((benefit) => (
              <div
                key={benefit.title}
                className="p-6 rounded-xl border border-gray-200 hover:border-aura-primary transition-colors"
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

      {/* Use Cases Split */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12">
            {/* Aviation */}
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-sky-100 rounded-lg flex items-center justify-center">
                  <Plane className="w-6 h-6 text-sky-600" />
                </div>
                <h3 className="text-2xl font-bold">Aviation</h3>
              </div>
              <p className="text-gray-600 mb-6">
                From FBO lounges to private jet catering, Aura delivers gourmet
                meals that are easy to stock, simple to serve, and impressive to
                every passenger.
              </p>
              <ul className="space-y-3">
                {aviationUseCases.map((useCase) => (
                  <li key={useCase} className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-aura-primary flex-shrink-0" />
                    <span className="text-gray-700">{useCase}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Marine */}
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-cyan-100 rounded-lg flex items-center justify-center">
                  <Ship className="w-6 h-6 text-cyan-600" />
                </div>
                <h3 className="text-2xl font-bold">Marine</h3>
              </div>
              <p className="text-gray-600 mb-6">
                Galley space is precious. Aura meals store without refrigeration,
                taste exceptional, and simplify provisioning for any voyage
                length.
              </p>
              <ul className="space-y-3">
                {marineUseCases.map((useCase) => (
                  <li key={useCase} className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-aura-primary flex-shrink-0" />
                    <span className="text-gray-700">{useCase}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">
              Trusted by Industry Professionals
            </h2>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {testimonials.map((testimonial) => (
              <div
                key={testimonial.name}
                className="p-8 bg-gray-50 rounded-xl relative"
              >
                <Quote className="w-10 h-10 text-aura-primary/20 absolute top-6 right-6" />
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-aura-primary/10 rounded-full flex items-center justify-center">
                    <testimonial.icon className="w-5 h-5 text-aura-primary" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">
                      {testimonial.name}
                    </p>
                    <p className="text-sm text-gray-500">
                      {testimonial.title}, {testimonial.location}
                    </p>
                  </div>
                </div>
                <p className="text-gray-700 leading-relaxed italic">
                  &ldquo;{testimonial.quote}&rdquo;
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">
              How It Works for Aviation &amp; Marine
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Three simple steps to premium provisioning
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {howItWorks.map((step) => (
              <div key={step.step} className="text-center">
                <div className="w-16 h-16 bg-aura-primary text-white rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">
                  {step.step}
                </div>
                <h3 className="text-lg font-semibold mb-2">{step.title}</h3>
                <p className="text-gray-600 text-sm">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-aura-dark">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="flex items-center justify-center gap-4 mb-6">
            <Plane className="w-12 h-12 text-aura-primary" />
            <CircleDot className="w-4 h-4 text-gray-500" />
            <Ship className="w-12 h-12 text-aura-primary" />
          </div>
          <h2 className="text-3xl font-bold text-white mb-4">
            Elevate Your Provisioning
          </h2>
          <p className="text-xl text-gray-300 mb-8">
            Join the growing network of aviation and marine professionals who
            trust Aura for premium, hassle-free provisioning.
          </p>
          <Link
            href="/b2b/apply"
            className="inline-flex items-center justify-center px-12 py-3 bg-aura-primary text-white font-semibold rounded-lg hover:bg-aura-primary/90 transition-colors text-lg"
          >
            Become a Dealer
            <ArrowRight className="ml-2 w-5 h-5" />
          </Link>
          <p className="mt-4 text-gray-400 text-sm">
            Questions?{" "}
            <a
              href="mailto:partnerships@aura.com"
              className="text-aura-primary hover:underline"
            >
              partnerships@aura.com
            </a>
          </p>
        </div>
      </section>

      <Footer />
    </div>
  );
}

export { LuxuryPage };
