"use client";

import Link from "next/link";
import { Header, Footer } from "@/components/ui";
import {
  ArrowRight,
  CheckCircle,
  Store,
  Palette,
  Users,
  Heart,
  TrendingUp,
  Megaphone,
  UserCheck,
  Handshake,
  Rocket,
  FileSearch,
  ClipboardCheck,
  Zap,
} from "lucide-react";

const partnershipTypes = [
  {
    icon: Store,
    title: "Retail Partners",
    description:
      "Stock Aura products in your physical or online store. Access wholesale pricing, merchandising support, and co-branded point-of-sale materials.",
    features: [
      "Wholesale pricing from day one",
      "Merchandising and display support",
      "Seasonal product drops",
      "Flexible minimum orders",
    ],
  },
  {
    icon: Palette,
    title: "Brand Collaborations",
    description:
      "Co-create limited edition products with Aura. Combine your brand identity with our premium food expertise for unique co-branded offerings.",
    features: [
      "Co-branded product development",
      "Joint marketing campaigns",
      "Shared distribution channels",
      "Revenue sharing model",
    ],
  },
  {
    icon: Users,
    title: "Affiliate Program",
    description:
      "Earn commissions on every referral. Share your unique link or QR code and get paid automatically via Stripe Connect when your audience buys.",
    features: [
      "Competitive commission rates",
      "Real-time tracking dashboard",
      "Custom referral codes",
      "Automated monthly payouts",
    ],
  },
  {
    icon: Heart,
    title: "Corporate Wellness",
    description:
      "Fuel your team with premium nutrition. Employee meal programs, office pantry stocking, and wellness initiative support tailored to your organization.",
    features: [
      "Bulk ordering discounts",
      "Dietary accommodation support",
      "Recurring delivery schedules",
      "Employee wellness reporting",
    ],
  },
];

const whyPartner = [
  {
    icon: TrendingUp,
    title: "Growing Brand",
    description:
      "Aura is expanding rapidly across B2C and B2B channels. Partner with a brand on the rise.",
  },
  {
    icon: CheckCircle,
    title: "Premium Product",
    description:
      "Chef-crafted, shelf-stable gourmet food with 2-year shelf life. Quality your customers will love.",
  },
  {
    icon: TrendingUp,
    title: "Strong Margins",
    description:
      "Competitive wholesale pricing and commission structures designed for partner profitability.",
  },
  {
    icon: Megaphone,
    title: "Marketing Support",
    description:
      "Co-branded assets, social media content, and campaign support to drive mutual growth.",
  },
  {
    icon: UserCheck,
    title: "Dedicated Account Manager",
    description:
      "A named partner success manager who understands your business and helps you grow.",
  },
  {
    icon: Handshake,
    title: "Flexible Terms",
    description:
      "Partnership agreements tailored to your business model, volume, and growth trajectory.",
  },
];

const processSteps = [
  {
    icon: FileSearch,
    step: "Apply",
    description:
      "Fill out our partnership application with details about your business, audience, and goals.",
  },
  {
    icon: ClipboardCheck,
    step: "Review",
    description:
      "Our partnerships team reviews your application within 1-2 business days and reaches out to discuss fit.",
  },
  {
    icon: Zap,
    step: "Onboard",
    description:
      "Get set up with your dealer account, branded portal, marketing assets, and dedicated account manager.",
  },
  {
    icon: Rocket,
    step: "Launch",
    description:
      "Start selling, earning commissions, and growing together. We support you every step of the way.",
  },
];

export default function PartnerPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      {/* Hero */}
      <section className="bg-aura-gradient py-20 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <span className="inline-block px-4 py-1 bg-white/20 rounded-full text-sm font-medium mb-6">
              Partnerships
            </span>
            <h1 className="text-4xl lg:text-5xl font-bold mb-6">
              Partner With Us
            </h1>
            <p className="text-xl opacity-90 mb-8">
              Let&apos;s grow together. Whether you&apos;re a retailer, brand,
              affiliate, or corporate buyer&mdash;there&apos;s a partnership
              model built for you.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                href="/b2b/apply"
                className="inline-flex items-center justify-center px-8 py-3 bg-white text-aura-primary font-semibold rounded-lg hover:bg-gray-100 transition-colors"
              >
                Apply for Partnership
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

      {/* Partnership Types */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Partnership Types</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Choose the model that fits your business
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {partnershipTypes.map((type) => (
              <div
                key={type.title}
                className="p-8 rounded-xl border border-gray-200 hover:border-aura-primary transition-colors"
              >
                <div className="flex items-start gap-4 mb-4">
                  <div className="w-12 h-12 bg-aura-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                    <type.icon className="w-6 h-6 text-aura-primary" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold mb-2">{type.title}</h3>
                    <p className="text-gray-600">{type.description}</p>
                  </div>
                </div>
                <ul className="space-y-2 mt-4 pl-16">
                  {type.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-2 text-sm">
                      <CheckCircle className="w-4 h-4 text-aura-primary flex-shrink-0" />
                      <span className="text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Partner */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Why Partner with Aura?</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              A partner program designed for mutual success
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {whyPartner.map((reason) => (
              <div
                key={reason.title}
                className="p-6 bg-white rounded-xl border border-gray-200 hover:border-aura-primary transition-colors"
              >
                <div className="w-12 h-12 bg-aura-primary/10 rounded-lg flex items-center justify-center mb-4">
                  <reason.icon className="w-6 h-6 text-aura-primary" />
                </div>
                <h3 className="text-lg font-semibold mb-2">{reason.title}</h3>
                <p className="text-gray-600">{reason.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Process */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">How It Works</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              From application to launch in four simple steps
            </p>
          </div>

          <div className="grid md:grid-cols-4 gap-8 max-w-5xl mx-auto">
            {processSteps.map((step, i) => (
              <div key={step.step} className="text-center relative">
                {i < processSteps.length - 1 && (
                  <div className="hidden md:block absolute top-8 left-[60%] w-[80%] border-t-2 border-dashed border-gray-300" />
                )}
                <div className="w-16 h-16 bg-aura-primary/10 rounded-full flex items-center justify-center mx-auto mb-4 relative z-10">
                  <step.icon className="w-7 h-7 text-aura-primary" />
                </div>
                <h3 className="text-lg font-semibold mb-2">{step.step}</h3>
                <p className="text-gray-600 text-sm">{step.description}</p>
                {step.step === "Review" && (
                  <p className="text-xs text-aura-primary font-medium mt-2">
                    1-2 business days
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-aura-dark">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <Handshake className="w-16 h-16 text-aura-primary mx-auto mb-6" />
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to Partner with Aura?
          </h2>
          <p className="text-xl text-gray-300 mb-8">
            Tell us about your business and we&apos;ll find the right
            partnership model for you.
          </p>
          <Link
            href="/b2b/apply"
            className="inline-flex items-center justify-center px-12 py-3 bg-aura-primary text-white font-semibold rounded-lg hover:bg-aura-primary/90 transition-colors text-lg"
          >
            Apply for Partnership
            <ArrowRight className="ml-2 w-5 h-5" />
          </Link>
          <p className="mt-6 text-gray-400 text-sm">
            Looking for wholesale pricing?{" "}
            <Link
              href="/wholesale"
              className="text-aura-primary hover:underline"
            >
              View our wholesale program
            </Link>
          </p>
        </div>
      </section>

      <Footer />
    </div>
  );
}

export { PartnerPage };
