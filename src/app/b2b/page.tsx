import Link from "next/link";
import { Header, Footer, Button } from "@/components/ui";
import {
  Building2,
  DollarSign,
  BarChart3,
  Package,
  QrCode,
  Truck,
  Award,
  ArrowRight,
  CheckCircle,
  Users,
  Globe,
} from "lucide-react";

const benefits = [
  {
    icon: DollarSign,
    title: "Competitive Wholesale Pricing",
    description:
      "Access tiered pricing from Bronze to Platinum based on your volume. The more you sell, the more you save.",
  },
  {
    icon: QrCode,
    title: "Virtual Distribution",
    description:
      "Earn commissions without holding inventory. Share your unique QR code and earn on every sale.",
  },
  {
    icon: BarChart3,
    title: "Real-Time Analytics",
    description:
      "Track sales, commissions, and customer activity in your personalized dealer dashboard.",
  },
  {
    icon: Package,
    title: "Drop-Ship Model",
    description:
      "Orders ship directly to your customers. No inventory management, no fulfillment hassles.",
  },
  {
    icon: Globe,
    title: "White-Label Portal",
    description:
      "Premium dealers get a custom-branded portal with your logo and domain.",
  },
  {
    icon: Truck,
    title: "Priority Fulfillment",
    description:
      "B2B orders get priority processing and expedited shipping options.",
  },
];

const tiers = [
  {
    name: "Bronze",
    volume: "0-500 units/month",
    discount: "10%",
    commission: "8%",
    features: ["Dealer dashboard", "QR code referrals", "Email support"],
  },
  {
    name: "Silver",
    volume: "500-2,000 units/month",
    discount: "15%",
    commission: "10%",
    features: [
      "All Bronze features",
      "Priority support",
      "Custom promo codes",
      "Monthly analytics reports",
    ],
  },
  {
    name: "Gold",
    volume: "2,000-5,000 units/month",
    discount: "20%",
    commission: "12%",
    features: [
      "All Silver features",
      "Dedicated account manager",
      "Co-branded marketing",
      "Net-30 invoicing",
    ],
    popular: true,
  },
  {
    name: "Platinum",
    volume: "5,000+ units/month",
    discount: "25%+",
    commission: "15%",
    features: [
      "All Gold features",
      "White-label portal",
      "Custom domain",
      "API access",
      "Custom pricing",
    ],
  },
];

const useCases = [
  {
    title: "Gyms & Fitness Centers",
    description:
      "Offer healthy, shelf-stable snacks and meals to your members. Perfect for gym vending or retail.",
    icon: Users,
  },
  {
    title: "Outdoor & Camping Retailers",
    description:
      "Stock lightweight, long-shelf-life meals ideal for hiking, camping, and adventure trips.",
    icon: Package,
  },
  {
    title: "Aviation & Marine",
    description:
      "Premium provisioning for FBOs, yacht charters, and private aviation without cold-chain complexity.",
    icon: Globe,
  },
  {
    title: "Corporate Wellness",
    description:
      "Supply offices with healthy pantry options for employee wellness programs.",
    icon: Building2,
  },
];

export default function B2BPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      {/* Hero */}
      <section className="bg-aura-gradient py-20 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <span className="inline-block px-4 py-1 bg-white/20 rounded-full text-sm font-medium mb-6">
              B2B Partner Program
            </span>
            <h1 className="text-4xl lg:text-5xl font-bold mb-6">
              Grow Your Business with Aura
            </h1>
            <p className="text-xl opacity-90 mb-8">
              Join our dealer network and offer premium, shelf-stable food to
              your customers. Wholesale pricing, drop-ship fulfillment, and
              industry-leading commissions.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link href="/b2b/apply">
                <Button
                  size="lg"
                  className="bg-white text-aura-primary hover:bg-gray-100"
                >
                  Apply to Become a Dealer
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
              <Link href="/b2b/login">
                <Button
                  variant="outline"
                  size="lg"
                  className="border-white text-white hover:bg-white/10"
                >
                  Existing Dealer? Log In
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Why Partner with Aura?</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              We&apos;ve built the most dealer-friendly program in the premium food
              industry
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {benefits.map((benefit) => (
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

      {/* Pricing Tiers */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Dealer Tiers</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Scale your benefits as your business grows
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {tiers.map((tier) => (
              <div
                key={tier.name}
                className={`rounded-xl p-6 ${
                  tier.popular
                    ? "bg-aura-gradient text-white ring-4 ring-aura-accent"
                    : "bg-white border border-gray-200"
                }`}
              >
                {tier.popular && (
                  <span className="inline-block px-3 py-1 bg-aura-accent text-white text-xs font-bold rounded-full mb-4">
                    Most Popular
                  </span>
                )}
                <h3 className="text-xl font-bold mb-1">{tier.name}</h3>
                <p
                  className={`text-sm mb-4 ${
                    tier.popular ? "text-white/80" : "text-gray-500"
                  }`}
                >
                  {tier.volume}
                </p>

                <div className="space-y-2 mb-6">
                  <div className="flex justify-between">
                    <span
                      className={tier.popular ? "text-white/80" : "text-gray-600"}
                    >
                      Wholesale Discount
                    </span>
                    <span className="font-bold">{tier.discount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span
                      className={tier.popular ? "text-white/80" : "text-gray-600"}
                    >
                      Referral Commission
                    </span>
                    <span className="font-bold">{tier.commission}</span>
                  </div>
                </div>

                <ul className="space-y-2">
                  {tier.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2 text-sm">
                      <CheckCircle
                        className={`w-4 h-4 flex-shrink-0 mt-0.5 ${
                          tier.popular ? "text-white" : "text-aura-primary"
                        }`}
                      />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Use Cases */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Perfect For</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Aura partners succeed across diverse industries
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {useCases.map((useCase) => (
              <div
                key={useCase.title}
                className="p-6 rounded-xl bg-gray-50 hover:bg-aura-light transition-colors"
              >
                <useCase.icon className="w-10 h-10 text-aura-primary mb-4" />
                <h3 className="font-semibold mb-2">{useCase.title}</h3>
                <p className="text-sm text-gray-600">{useCase.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-aura-dark">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <Award className="w-16 h-16 text-aura-primary mx-auto mb-6" />
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to Partner with Aura?
          </h2>
          <p className="text-xl text-gray-300 mb-8">
            Apply today and start earning within 48 hours
          </p>
          <Link href="/b2b/apply">
            <Button size="lg" className="px-12">
              Apply Now
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </Link>
          <p className="mt-4 text-gray-400 text-sm">
            Questions? Contact{" "}
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
