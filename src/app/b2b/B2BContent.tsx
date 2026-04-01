"use client";

import Link from "next/link";
import { Header, Footer, Button } from "@/components/ui";
import { useLocale } from "@/hooks/useLocale";
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

const benefitKeys = [
  { icon: DollarSign, titleKey: "b2b.benefit.wholesalePricing", descKey: "b2b.benefit.wholesalePricingDesc" },
  { icon: QrCode, titleKey: "b2b.benefit.virtualDistribution", descKey: "b2b.benefit.virtualDistributionDesc" },
  { icon: BarChart3, titleKey: "b2b.benefit.analytics", descKey: "b2b.benefit.analyticsDesc" },
  { icon: Package, titleKey: "b2b.benefit.dropShip", descKey: "b2b.benefit.dropShipDesc" },
  { icon: Globe, titleKey: "b2b.benefit.whiteLabel", descKey: "b2b.benefit.whiteLabelDesc" },
  { icon: Truck, titleKey: "b2b.benefit.priorityFulfillment", descKey: "b2b.benefit.priorityFulfillmentDesc" },
];

const tierData = [
  {
    name: "Bronze",
    volume: "0-500 units/month",
    discount: "10%",
    commission: "8%",
    featureKeys: ["b2b.tier.dealerDashboard", "b2b.tier.qrCodeReferrals", "b2b.tier.emailSupport"],
  },
  {
    name: "Silver",
    volume: "500-2,000 units/month",
    discount: "15%",
    commission: "10%",
    featureKeys: ["b2b.tier.allBronze", "b2b.tier.prioritySupport", "b2b.tier.customPromoCodes", "b2b.tier.monthlyReports"],
  },
  {
    name: "Gold",
    volume: "2,000-5,000 units/month",
    discount: "20%",
    commission: "12%",
    featureKeys: ["b2b.tier.allSilver", "b2b.tier.dedicatedManager", "b2b.tier.coBrandedMarketing", "b2b.tier.net30"],
    popular: true,
  },
  {
    name: "Platinum",
    volume: "5,000+ units/month",
    discount: "25%+",
    commission: "15%",
    featureKeys: ["b2b.tier.allGold", "b2b.tier.whiteLabelPortal", "b2b.tier.customDomain", "b2b.tier.apiAccess", "b2b.tier.customPricing"],
  },
];

const useCaseKeys = [
  { titleKey: "b2b.useCase.gyms", descKey: "b2b.useCase.gymsDesc", icon: Users },
  { titleKey: "b2b.useCase.outdoor", descKey: "b2b.useCase.outdoorDesc", icon: Package },
  { titleKey: "b2b.useCase.aviation", descKey: "b2b.useCase.aviationDesc", icon: Globe },
  { titleKey: "b2b.useCase.corporate", descKey: "b2b.useCase.corporateDesc", icon: Building2 },
];

export default function B2BContent() {
  const { t } = useLocale();

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      {/* Hero */}
      <section className="bg-aura-gradient py-20 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <span className="inline-block px-4 py-1 bg-white/20 rounded-full text-sm font-medium mb-6">
              {t("b2b.badge")}
            </span>
            <h1 className="text-4xl lg:text-5xl font-bold mb-6">
              {t("b2b.title")}
            </h1>
            <p className="text-xl opacity-90 mb-8">
              {t("b2b.subtitle")}
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link href="/b2b/apply">
                <Button
                  size="lg"
                  className="bg-white text-aura-primary hover:bg-gray-100"
                >
                  {t("b2b.applyDealer")}
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
              <Link href="/b2b/login">
                <Button
                  variant="outline"
                  size="lg"
                  className="border-white text-white hover:bg-white/10"
                >
                  {t("b2b.existingDealer")}
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
            <h2 className="text-3xl font-bold mb-4">{t("b2b.whyPartner")}</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              {t("b2b.whyPartnerSubtitle")}
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {benefitKeys.map((benefit) => (
              <div
                key={benefit.titleKey}
                className="p-6 rounded-xl border border-gray-200 hover:border-aura-primary transition-colors"
              >
                <div className="w-12 h-12 bg-aura-primary/10 rounded-lg flex items-center justify-center mb-4">
                  <benefit.icon className="w-6 h-6 text-aura-primary" />
                </div>
                <h3 className="text-lg font-semibold mb-2">{t(benefit.titleKey)}</h3>
                <p className="text-gray-600">{t(benefit.descKey)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Tiers */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">{t("b2b.dealerTiers")}</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              {t("b2b.dealerTiersSubtitle")}
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {tierData.map((tier) => (
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
                    {t("b2b.mostPopular")}
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
                      {t("b2b.wholesaleDiscount")}
                    </span>
                    <span className="font-bold">{tier.discount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span
                      className={tier.popular ? "text-white/80" : "text-gray-600"}
                    >
                      {t("b2b.referralCommission")}
                    </span>
                    <span className="font-bold">{tier.commission}</span>
                  </div>
                </div>

                <ul className="space-y-2">
                  {tier.featureKeys.map((featureKey) => (
                    <li key={featureKey} className="flex items-start gap-2 text-sm">
                      <CheckCircle
                        className={`w-4 h-4 flex-shrink-0 mt-0.5 ${
                          tier.popular ? "text-white" : "text-aura-primary"
                        }`}
                      />
                      <span>{t(featureKey)}</span>
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
            <h2 className="text-3xl font-bold mb-4">{t("b2b.perfectFor")}</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              {t("b2b.perfectForSubtitle")}
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {useCaseKeys.map((useCase) => (
              <div
                key={useCase.titleKey}
                className="p-6 rounded-xl bg-gray-50 hover:bg-aura-light transition-colors"
              >
                <useCase.icon className="w-10 h-10 text-aura-primary mb-4" />
                <h3 className="font-semibold mb-2">{t(useCase.titleKey)}</h3>
                <p className="text-sm text-gray-600">{t(useCase.descKey)}</p>
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
            {t("b2b.readyToPartner")}
          </h2>
          <p className="text-xl text-gray-300 mb-8">
            {t("b2b.readyToPartnerSubtitle")}
          </p>
          <Link href="/b2b/apply">
            <Button size="lg" className="px-12">
              {t("b2b.applyNow")}
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </Link>
          <p className="mt-4 text-gray-400 text-sm">
            {t("b2b.contactQuestions")}{" "}
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
