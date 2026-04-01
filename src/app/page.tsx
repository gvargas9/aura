"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { Header, Footer } from "@/components/ui";
import {
  Package,
  Truck,
  Leaf,
  Shield,
  Star,
  ArrowRight,
  CheckCircle,
  Sparkles,
  Award,
  Clock,
  Zap,
  Heart,
  ChevronRight,
  Building2,
  TrendingUp,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useLocale } from "@/hooks/useLocale";

/* ============================================================
   Animated Counter Hook
   ============================================================ */

function useCountUp(
  end: number,
  duration: number = 2000,
  startOnView: boolean = true
) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const started = useRef(false);

  useEffect(() => {
    if (!startOnView) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started.current) {
          started.current = true;
          const startTime = performance.now();
          const animate = (now: number) => {
            const elapsed = now - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            setCount(Math.round(eased * end));
            if (progress < 1) requestAnimationFrame(animate);
          };
          requestAnimationFrame(animate);
        }
      },
      { threshold: 0.3 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [end, duration, startOnView]);

  return { count, ref };
}

/* ============================================================
   Scroll Fade-in Hook
   ============================================================ */

function useScrollFadeIn() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("opacity-100", "translate-y-0");
            entry.target.classList.remove("opacity-0", "translate-y-8");
          }
        });
      },
      { threshold: 0.1, rootMargin: "0px 0px -50px 0px" }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return ref;
}

/* ============================================================
   Sub-components
   ============================================================ */

function AnimatedSection({
  children,
  className,
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  const ref = useScrollFadeIn();
  return (
    <div
      ref={ref}
      className={cn(
        "opacity-0 translate-y-8 transition-all duration-700 ease-out",
        className
      )}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}

function ProductShowcase({ t }: { t: (key: string, vars?: Record<string, string>) => string }) {
  const [products, setProducts] = useState([
    { name: "Herb Roasted Chicken", image_url: "", color: "from-orange-400 to-red-500" },
    { name: "Beef Stew Classic", image_url: "", color: "from-amber-400 to-orange-500" },
    { name: "Vegetable Curry", image_url: "", color: "from-red-700 to-red-900" },
    { name: "Salmon Teriyaki", image_url: "", color: "from-emerald-400 to-green-600" },
    { name: "Quinoa Pilaf", image_url: "", color: "from-yellow-400 to-orange-400" },
    { name: "Energy Bites", image_url: "", color: "from-lime-400 to-emerald-500" },
  ]);

  useEffect(() => {
    const supabase = createClient();
    supabase
      .from("aura_products")
      .select("name, image_url")
      .eq("is_active", true)
      .order("sort_order", { ascending: true })
      .limit(6)
      .then(({ data }) => {
        if (data && data.length > 0) {
          setProducts(
            data.map((p, i) => ({
              name: p.name,
              image_url: p.image_url || "",
              color: products[i]?.color || "from-gray-400 to-gray-600",
            }))
          );
        }
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="relative w-full max-w-lg mx-auto">
      {/* Main showcase card */}
      <div className="relative z-10">
        {/* Glowing backdrop */}
        <div className="absolute -inset-4 bg-gradient-to-r from-aura-primary/20 via-emerald-500/10 to-aura-accent/20 rounded-[2rem] blur-2xl" />

        <div className="relative bg-white/10 backdrop-blur-xl rounded-3xl border border-white/20 p-6 shadow-2xl">
          {/* Box label */}
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-aura-accent/20 flex items-center justify-center">
                <Package className="w-4 h-4 text-aura-accent" />
              </div>
              <span className="text-white/90 text-sm font-medium">
                {t("home.hero.voyagerBox")}
              </span>
            </div>
            <span className="text-xs text-white/50 bg-white/10 px-3 py-1 rounded-full">
              {t("home.hero.mealsCount")}
            </span>
          </div>

          {/* Product mini-grid */}
          <div className="grid grid-cols-3 gap-3 mb-5">
            {products.map((product, i) => (
              <div
                key={product.name}
                className="group relative aspect-square rounded-2xl overflow-hidden cursor-pointer"
                style={{ animationDelay: `${i * 100}ms` }}
              >
                {product.image_url ? (
                  <Image
                    src={product.image_url}
                    alt={product.name}
                    fill
                    className="object-cover group-hover:scale-110 transition-transform duration-500"
                    sizes="(max-width: 768px) 80px, 120px"
                  />
                ) : (
                  <div
                    className={cn(
                      "absolute inset-0 bg-gradient-to-br opacity-90",
                      product.color
                    )}
                  />
                )}
                {/* Name overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-2">
                  <span className="text-white text-[9px] font-medium text-center leading-tight drop-shadow-lg block">
                    {product.name}
                  </span>
                </div>
                {/* Shine effect */}
                <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/20 to-white/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              </div>
            ))}
          </div>

          {/* Price */}
          <div className="flex items-end justify-between">
            <div>
              <p className="text-white/50 text-xs">{t("home.hero.startingAt")}</p>
              <p className="text-white text-2xl font-bold">
                $6.25
                <span className="text-sm font-normal text-white/60">
                  {t("home.tiers.perMeal")}
                </span>
              </p>
            </div>
            <div className="flex items-center gap-1">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className="w-3.5 h-3.5 text-aura-accent fill-current"
                />
              ))}
              <span className="text-white/60 text-xs ml-1">4.9</span>
            </div>
          </div>
        </div>
      </div>

      {/* Floating elements */}
      <div className="absolute -top-6 -right-6 bg-white rounded-2xl shadow-xl p-3 border border-gray-100 animate-float z-20">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center">
            <Truck className="w-4 h-4 text-aura-primary" />
          </div>
          <div>
            <p className="text-xs font-bold text-gray-900">{t("home.hero.freeShipping")}</p>
            <p className="text-[10px] text-gray-500">{t("home.hero.onAllBoxes")}</p>
          </div>
        </div>
      </div>

      <div className="absolute -bottom-4 -left-6 bg-white rounded-2xl shadow-xl p-3 border border-gray-100 animate-float-delayed z-20">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center">
            <Clock className="w-4 h-4 text-aura-accent" />
          </div>
          <div>
            <p className="text-xs font-bold text-gray-900">{t("home.hero.shelfLife")}</p>
            <p className="text-[10px] text-gray-500">{t("home.hero.noRefrigeration")}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   Pricing Toggle
   ============================================================ */

function PricingToggle({
  isSubscription,
  onToggle,
  t,
}: {
  isSubscription: boolean;
  onToggle: () => void;
  t: (key: string, vars?: Record<string, string>) => string;
}) {
  return (
    <div className="flex items-center justify-center gap-3 mb-12">
      <span
        className={cn(
          "text-sm font-medium transition-colors",
          !isSubscription ? "text-gray-900" : "text-gray-400"
        )}
      >
        {t("home.tiers.oneTime")}
      </span>
      <button
        onClick={onToggle}
        className={cn(
          "relative w-14 h-7 rounded-full transition-colors duration-300",
          isSubscription ? "bg-aura-primary" : "bg-gray-300"
        )}
        role="switch"
        aria-checked={isSubscription}
        aria-label="Toggle subscription pricing"
      >
        <span
          className={cn(
            "absolute top-0.5 w-6 h-6 bg-white rounded-full shadow-md transition-transform duration-300",
            isSubscription ? "translate-x-7.5" : "translate-x-0.5"
          )}
        />
      </button>
      <span
        className={cn(
          "text-sm font-medium transition-colors",
          isSubscription ? "text-gray-900" : "text-gray-400"
        )}
      >
        {t("home.tiers.subscribeAndSave")}
      </span>
      {isSubscription && (
        <span className="text-xs font-semibold text-aura-primary bg-aura-light px-2 py-0.5 rounded-full">
          {t("home.tiers.save15")}
        </span>
      )}
    </div>
  );
}

/* ============================================================
   Static Data (translation keys only — no rendered strings)
   ============================================================ */

const boxOptions = [
  {
    nameKey: "tier.starter",
    slots: 8,
    price: 59.99,
    descriptionKey: "tier.starter.description",
    popular: false,
    badgeKey: null as string | null,
    slug: "starter",
  },
  {
    nameKey: "tier.voyager",
    slots: 12,
    price: 84.99,
    descriptionKey: "tier.voyager.description",
    popular: true,
    badgeKey: "home.tiers.mostPopular",
    slug: "voyager",
  },
  {
    nameKey: "tier.bunker",
    slots: 24,
    price: 149.99,
    descriptionKey: "tier.bunker.description",
    popular: false,
    badgeKey: "home.tiers.bestValue",
    slug: "bunker",
  },
];

const howItWorksSteps = [
  { step: "01", titleKey: "home.howItWorks.step1.title", descriptionKey: "home.howItWorks.step1.description", icon: Package },
  { step: "02", titleKey: "home.howItWorks.step2.title", descriptionKey: "home.howItWorks.step2.description", icon: Sparkles },
  { step: "03", titleKey: "home.howItWorks.step3.title", descriptionKey: "home.howItWorks.step3.description", icon: Truck },
];

const testimonials = [
  { name: "Sarah Mitchell", roleKey: "home.testimonials.role1", location: "Miami, FL", contentKey: "home.testimonials.review1", rating: 5, avatar: "SM" },
  { name: "David Rodriguez", roleKey: "home.testimonials.role2", location: "Austin, TX", contentKey: "home.testimonials.review2", rating: 5, avatar: "DR" },
  { name: "Jennifer Kim", roleKey: "home.testimonials.role3", location: "Denver, CO", contentKey: "home.testimonials.review3", rating: 5, avatar: "JK" },
  { name: "Marcus Thompson", roleKey: "home.testimonials.role4", location: "Scottsdale, AZ", contentKey: "home.testimonials.review4", rating: 5, avatar: "MT" },
];

const pressLogos = ["Forbes", "TechCrunch", "Men's Health", "Bon Appetit", "Outside"];

const whyAuraFeatures = [
  { icon: Leaf, titleKey: "home.whyAura.natural.title", descriptionKey: "home.whyAura.natural.description", accent: "from-emerald-500 to-green-600" },
  { icon: Clock, titleKey: "home.whyAura.shelfLife.title", descriptionKey: "home.whyAura.shelfLife.description", accent: "from-amber-500 to-orange-500" },
  { icon: Package, titleKey: "home.whyAura.buildBox.title", descriptionKey: "home.whyAura.buildBox.description", accent: "from-blue-500 to-indigo-500" },
  { icon: Truck, titleKey: "home.whyAura.shipping.title", descriptionKey: "home.whyAura.shipping.description", accent: "from-violet-500 to-purple-600" },
  { icon: Shield, titleKey: "home.whyAura.guarantee.title", descriptionKey: "home.whyAura.guarantee.description", accent: "from-rose-500 to-pink-600" },
  { icon: Sparkles, titleKey: "home.whyAura.ai.title", descriptionKey: "home.whyAura.ai.description", accent: "from-aura-primary to-aura-secondary" },
];

/* ============================================================
   Main Page
   ============================================================ */

export default function HomePage() {
  const [isSubscription, setIsSubscription] = useState(true);
  const { t } = useLocale();

  const stat1 = useCountUp(10000);
  const stat2 = useCountUp(49);
  const stat3 = useCountUp(50);

  const b2bFeatures = [
    t("home.b2b.feature1"),
    t("home.b2b.feature2"),
    t("home.b2b.feature3"),
    t("home.b2b.feature4"),
  ];

  return (
    <div className="min-h-screen bg-white">
      <Header />

      {/* ========== HERO ========== */}
      <section className="relative overflow-hidden bg-gradient-to-br from-aura-dark via-aura-darker to-black">
        {/* Background decoration */}
        <div className="absolute inset-0 bg-grid opacity-30" />
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-aura-primary/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-aura-accent/5 rounded-full blur-[100px]" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-20 lg:pt-24 lg:pb-28">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            {/* Left - Copy */}
            <div className="text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-white/10 backdrop-blur-sm text-white/90 rounded-full text-sm font-medium mb-8 border border-white/10">
                <Sparkles className="w-3.5 h-3.5 text-aura-accent" />
                {t("hero.badge")}
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-bold text-white mb-6 leading-[1.1] tracking-tight">
                {t("hero.title")}
                <br />
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-aura-primary via-emerald-400 to-aura-accent">
                  {t("hero.titleHighlight")}
                </span>
              </h1>

              <p className="text-lg lg:text-xl text-white/60 mb-8 max-w-xl mx-auto lg:mx-0 leading-relaxed">
                {t("hero.subtitle")}
              </p>

              {/* Price callout */}
              <div className="inline-flex items-center gap-4 bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl px-6 py-3 mb-8">
                <div>
                  <p className="text-3xl font-bold text-white">
                    $6.25
                    <span className="text-base font-normal text-white/50">
                      {t("home.tiers.perMeal")}
                    </span>
                  </p>
                </div>
                <div className="w-px h-10 bg-white/10" />
                <div>
                  <p className="text-sm text-white/40">{t("hero.startingAt")}</p>
                  <p className="text-lg font-semibold text-white">
                    $59.99
                    <span className="text-sm font-normal text-white/50">
                      {t("hero.perMonth")}
                    </span>
                  </p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-start mb-10">
                <Link
                  href="/build-box"
                  className="group inline-flex items-center justify-center gap-2 bg-aura-accent hover:bg-aura-accent-hover text-white text-lg font-semibold px-8 py-4 rounded-full shadow-lg shadow-aura-accent/30 hover:shadow-xl hover:shadow-aura-accent/40 hover:-translate-y-0.5 transition-all duration-300"
                >
                  {t("hero.buildBox")}
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Link>
                <Link
                  href="/products"
                  className="inline-flex items-center justify-center gap-2 bg-white/10 backdrop-blur-sm text-white text-lg font-medium px-8 py-4 rounded-full border border-white/20 hover:bg-white/20 transition-all duration-300"
                >
                  {t("hero.browseProducts")}
                </Link>
              </div>

              {/* Trust indicators */}
              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-x-6 gap-y-2 text-sm text-white/50">
                {[
                  t("home.hero.freeShipping"),
                  t("home.hero.cancelAnytime"),
                  t("home.hero.shelfLife"),
                ].map((item) => (
                  <div key={item} className="flex items-center gap-1.5">
                    <CheckCircle className="w-3.5 h-3.5 text-aura-primary" />
                    {item}
                  </div>
                ))}
              </div>
            </div>

            {/* Right - Product showcase */}
            <div className="hidden md:block">
              <ProductShowcase t={t} />
            </div>
          </div>
        </div>

        {/* "Featured in" press bar */}
        <div className="relative border-t border-white/10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex items-center justify-center gap-8 lg:gap-16 flex-wrap">
              <span className="text-xs uppercase tracking-widest text-white/30 font-medium">
                {t("home.hero.featuredIn")}
              </span>
              {pressLogos.map((logo) => (
                <span
                  key={logo}
                  className="text-white/20 text-sm font-semibold tracking-wide hover:text-white/40 transition-colors cursor-default"
                >
                  {logo}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ========== STATS BAR ========== */}
      <section className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center" ref={stat1.ref}>
              <p className="text-3xl lg:text-4xl font-bold text-gray-900">
                {stat1.count.toLocaleString()}+
              </p>
              <p className="text-sm text-gray-500 mt-1">{t("home.stats.boxesShipped")}</p>
            </div>
            <div className="text-center" ref={stat2.ref}>
              <div className="flex items-center justify-center gap-1">
                <p className="text-3xl lg:text-4xl font-bold text-gray-900">
                  {(stat2.count / 10).toFixed(1)}
                </p>
                <Star className="w-6 h-6 text-aura-accent fill-current mt-1" />
              </div>
              <p className="text-sm text-gray-500 mt-1">{t("home.stats.averageRating")}</p>
            </div>
            <div className="text-center" ref={stat3.ref}>
              <p className="text-3xl lg:text-4xl font-bold text-gray-900">
                {stat3.count}+
              </p>
              <p className="text-sm text-gray-500 mt-1">{t("home.stats.premiumMeals")}</p>
            </div>
            <div className="text-center">
              <p className="text-3xl lg:text-4xl font-bold text-aura-primary">
                {t("home.stats.freeShipping")}
              </p>
              <p className="text-sm text-gray-500 mt-1">{t("home.stats.shippingAlways")}</p>
            </div>
          </div>
        </div>
      </section>

      {/* ========== HOW IT WORKS ========== */}
      <section className="py-20 lg:py-28 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <AnimatedSection className="text-center mb-16">
            <span className="inline-flex items-center gap-2 px-4 py-1.5 bg-aura-light text-aura-dark rounded-full text-sm font-medium mb-4">
              <Zap className="w-3.5 h-3.5" />
              {t("home.howItWorks.badge")}
            </span>
            <h2 className="text-3xl lg:text-5xl font-bold text-gray-900 mb-4">
              {t("home.howItWorks.title")}
            </h2>
            <p className="text-lg text-gray-500 max-w-2xl mx-auto">
              {t("home.howItWorks.subtitle")}
            </p>
          </AnimatedSection>

          <div className="grid md:grid-cols-3 gap-8 lg:gap-12 relative">
            {/* Connecting line (desktop) */}
            <div className="hidden md:block absolute top-16 left-[20%] right-[20%] h-px bg-gradient-to-r from-aura-primary/20 via-aura-primary/40 to-aura-primary/20" />

            {howItWorksSteps.map((step, i) => (
              <AnimatedSection key={step.step} delay={i * 150}>
                <div className="relative text-center group">
                  {/* Step number circle */}
                  <div className="relative inline-flex items-center justify-center w-20 h-20 mb-6">
                    <div className="absolute inset-0 bg-aura-light rounded-2xl group-hover:bg-aura-primary/10 transition-colors duration-300" />
                    <div className="relative flex items-center justify-center w-12 h-12 bg-white rounded-xl shadow-sm group-hover:shadow-md transition-shadow duration-300">
                      <step.icon className="w-6 h-6 text-aura-primary" />
                    </div>
                    <span className="absolute -top-2 -right-2 w-7 h-7 bg-aura-dark text-white text-xs font-bold rounded-lg flex items-center justify-center shadow-sm">
                      {step.step}
                    </span>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">
                    {t(step.titleKey)}
                  </h3>
                  <p className="text-gray-500 leading-relaxed max-w-xs mx-auto">
                    {t(step.descriptionKey)}
                  </p>
                </div>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* ========== BOX TIERS ========== */}
      <section className="py-20 lg:py-28 bg-gray-50/50 relative overflow-hidden">
        <div className="absolute inset-0 bg-pattern-light" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <AnimatedSection className="text-center mb-8">
            <span className="inline-flex items-center gap-2 px-4 py-1.5 bg-aura-accent/10 text-aura-accent rounded-full text-sm font-medium mb-4">
              <Package className="w-3.5 h-3.5" />
              {t("home.tiers.badge")}
            </span>
            <h2 className="text-3xl lg:text-5xl font-bold text-gray-900 mb-4">
              {t("home.tiers.title")}
            </h2>
            <p className="text-lg text-gray-500 max-w-2xl mx-auto">
              {t("home.tiers.subtitle")}
            </p>
          </AnimatedSection>

          <PricingToggle
            isSubscription={isSubscription}
            onToggle={() => setIsSubscription(!isSubscription)}
            t={t}
          />

          <div className="grid md:grid-cols-3 gap-6 lg:gap-8 max-w-5xl mx-auto">
            {boxOptions.map((box, index) => {
              const displayPrice = isSubscription
                ? box.price
                : Math.round(box.price * 1.15 * 100) / 100;
              const perMealNum = displayPrice / box.slots;

              return (
                <AnimatedSection key={box.slug} delay={index * 100}>
                  <div
                    className={cn(
                      "relative rounded-3xl transition-all duration-500 hover:-translate-y-2",
                      box.popular
                        ? "bg-gradient-to-b from-aura-dark to-aura-darker text-white shadow-2xl shadow-aura-dark/20 ring-2 ring-aura-primary/30 z-10 scale-[1.02] lg:scale-105"
                        : "bg-white text-gray-900 border border-gray-200 hover:border-aura-primary/30 hover:shadow-xl"
                    )}
                  >
                    {/* Badge */}
                    {box.badgeKey && (
                      <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                        <span
                          className={cn(
                            "inline-flex items-center gap-1.5 text-xs font-semibold px-4 py-1.5 rounded-full shadow-md",
                            box.popular
                              ? "bg-aura-accent text-white shadow-aura-accent/30"
                              : "bg-aura-primary text-white shadow-aura-primary/30"
                          )}
                        >
                          {box.popular && <Sparkles className="w-3 h-3" />}
                          {t(box.badgeKey)}
                        </span>
                      </div>
                    )}

                    <div className="p-8 text-center">
                      {/* Plan name */}
                      <h3
                        className={cn(
                          "text-lg font-semibold mb-1",
                          box.popular ? "text-white/80" : "text-gray-500"
                        )}
                      >
                        {t(box.nameKey)}
                      </h3>
                      <p
                        className={cn(
                          "text-sm mb-6",
                          box.popular ? "text-white/50" : "text-gray-400"
                        )}
                      >
                        {t(box.descriptionKey)}
                      </p>

                      {/* Per-meal price (prominent) */}
                      <div className="mb-2">
                        <span
                          className={cn(
                            "text-5xl font-bold",
                            box.popular ? "text-white" : "text-gray-900"
                          )}
                        >
                          ${perMealNum.toFixed(2)}
                        </span>
                        <span
                          className={cn(
                            "text-base ml-1",
                            box.popular ? "text-white/50" : "text-gray-400"
                          )}
                        >
                          {t("home.tiers.perMeal")}
                        </span>
                      </div>

                      {/* Monthly price */}
                      <p
                        className={cn(
                          "text-sm mb-8",
                          box.popular ? "text-white/40" : "text-gray-400"
                        )}
                      >
                        ${displayPrice.toFixed(2)}{t("hero.perMonth")} &middot; {box.slots}{" "}
                        {t("home.tiers.meals")}
                      </p>

                      {/* Slots visual */}
                      <div
                        className={cn(
                          "rounded-2xl p-5 mb-8",
                          box.popular ? "bg-white/5" : "bg-gray-50"
                        )}
                      >
                        <div className="flex flex-wrap justify-center gap-1.5">
                          {[...Array(box.slots)].map((_, i) => (
                            <div
                              key={i}
                              className={cn(
                                "w-5 h-5 rounded-md",
                                box.popular
                                  ? "bg-aura-primary/30"
                                  : "bg-aura-primary/15"
                              )}
                            />
                          ))}
                        </div>
                        <p
                          className={cn(
                            "text-xs mt-3",
                            box.popular ? "text-white/40" : "text-gray-400"
                          )}
                        >
                          {t("home.tiers.slotsToFill", { count: String(box.slots) })}
                        </p>
                      </div>

                      {/* Features */}
                      <ul className="space-y-3 text-left mb-8">
                        {[
                          t("home.tiers.freeShipping"),
                          t("home.tiers.shelfLife"),
                          t("home.tiers.cancelAnytime"),
                          box.slots >= 24
                            ? t("home.tiers.bunkerSafe")
                            : t("home.tiers.aiRecommendations"),
                        ].map((feature) => (
                          <li key={feature} className="flex items-center gap-2.5">
                            <CheckCircle
                              className="w-4 h-4 flex-shrink-0 text-aura-primary"
                            />
                            <span
                              className={cn(
                                "text-sm",
                                box.popular ? "text-white/70" : "text-gray-600"
                              )}
                            >
                              {feature}
                            </span>
                          </li>
                        ))}
                      </ul>

                      {/* CTA */}
                      <Link
                        href={`/build-box?size=${box.slug}`}
                        className={cn(
                          "group block w-full py-3.5 rounded-xl font-semibold text-center transition-all duration-300",
                          box.popular
                            ? "bg-aura-accent text-white hover:bg-aura-accent-hover shadow-lg shadow-aura-accent/20"
                            : "bg-aura-dark text-white hover:bg-aura-darker"
                        )}
                      >
                        <span className="inline-flex items-center gap-2">
                          {t("common.getStarted")}
                          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        </span>
                      </Link>
                    </div>
                  </div>
                </AnimatedSection>
              );
            })}
          </div>
        </div>
      </section>

      {/* ========== WHY AURA ========== */}
      <section className="py-20 lg:py-28 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <AnimatedSection className="text-center mb-16">
            <span className="inline-flex items-center gap-2 px-4 py-1.5 bg-aura-light text-aura-dark rounded-full text-sm font-medium mb-4">
              <Award className="w-3.5 h-3.5" />
              {t("home.whyAura.badge")}
            </span>
            <h2 className="text-3xl lg:text-5xl font-bold text-gray-900 mb-4">
              {t("home.whyAura.title")}
            </h2>
            <p className="text-lg text-gray-500 max-w-2xl mx-auto">
              {t("home.whyAura.subtitle")}
            </p>
          </AnimatedSection>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {whyAuraFeatures.map((feature, i) => (
              <AnimatedSection key={feature.titleKey} delay={i * 80}>
                <div className="group relative bg-white rounded-2xl p-8 border border-gray-100 hover:border-transparent hover:shadow-xl transition-all duration-300 hover:-translate-y-1 h-full">
                  <div
                    className={cn(
                      "w-12 h-12 rounded-2xl bg-gradient-to-br flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-300 shadow-sm",
                      feature.accent
                    )}
                  >
                    <feature.icon className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">
                    {t(feature.titleKey)}
                  </h3>
                  <p className="text-gray-500 text-sm leading-relaxed">
                    {t(feature.descriptionKey)}
                  </p>
                  {/* Bottom accent line */}
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-aura-primary/40 to-transparent rounded-b-2xl transform scale-x-0 group-hover:scale-x-100 transition-transform origin-center duration-500" />
                </div>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* ========== TESTIMONIALS ========== */}
      <section className="py-20 lg:py-28 bg-aura-dark relative overflow-hidden">
        <div className="absolute inset-0 bg-pattern" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-aura-primary/5 rounded-full blur-[100px]" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-aura-accent/5 rounded-full blur-[100px]" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <AnimatedSection className="text-center mb-16">
            <span className="inline-flex items-center gap-2 px-4 py-1.5 bg-white/10 text-white/80 rounded-full text-sm font-medium mb-4 backdrop-blur-sm">
              <Heart className="w-3.5 h-3.5 text-aura-accent" />
              {t("home.testimonials.badge")}
            </span>
            <h2 className="text-3xl lg:text-5xl font-bold text-white mb-4">
              {t("home.testimonials.title")}
            </h2>
            <p className="text-lg text-white/40">
              {t("home.testimonials.subtitle")}
            </p>
          </AnimatedSection>

          <div className="grid md:grid-cols-2 gap-6 max-w-5xl mx-auto">
            {testimonials.map((testimonial, i) => (
              <AnimatedSection key={testimonial.name} delay={i * 100}>
                <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-8 border border-white/10 hover:bg-white/[0.08] transition-all duration-300 h-full flex flex-col">
                  {/* Stars */}
                  <div className="flex gap-1 mb-5">
                    {[...Array(testimonial.rating)].map((_, idx) => (
                      <Star
                        key={idx}
                        className="w-4 h-4 text-aura-accent fill-current"
                      />
                    ))}
                  </div>

                  {/* Quote */}
                  <p className="text-white/70 leading-relaxed mb-6 flex-1 text-[15px]">
                    &ldquo;{t(testimonial.contentKey)}&rdquo;
                  </p>

                  {/* Author */}
                  <div className="flex items-center gap-3 pt-5 border-t border-white/10">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-aura-primary to-aura-accent flex items-center justify-center text-white text-sm font-bold">
                      {testimonial.avatar}
                    </div>
                    <div>
                      <p className="text-white font-semibold text-sm">
                        {testimonial.name}
                      </p>
                      <p className="text-white/40 text-xs">
                        {t(testimonial.roleKey)} &middot; {testimonial.location}
                      </p>
                    </div>
                  </div>
                </div>
              </AnimatedSection>
            ))}
          </div>

          {/* Trust stats */}
          <AnimatedSection delay={400}>
            <div className="mt-16 flex flex-wrap justify-center gap-12 lg:gap-16 items-center">
              <div className="text-center">
                <p className="text-3xl font-bold text-white mb-1">4.9/5</p>
                <div className="flex gap-0.5 justify-center mb-1">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className="w-3.5 h-3.5 text-aura-accent fill-current"
                    />
                  ))}
                </div>
                <p className="text-xs text-white/30">{t("home.testimonials.averageRating")}</p>
              </div>
              <div className="w-px h-12 bg-white/10 hidden sm:block" />
              <div className="text-center">
                <p className="text-3xl font-bold text-white mb-1">10K+</p>
                <p className="text-xs text-white/30">{t("home.testimonials.happyCustomers")}</p>
              </div>
              <div className="w-px h-12 bg-white/10 hidden sm:block" />
              <div className="text-center">
                <p className="text-3xl font-bold text-white mb-1">99%</p>
                <p className="text-xs text-white/30">{t("home.testimonials.wouldRecommend")}</p>
              </div>
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* ========== B2B CTA ========== */}
      <section className="py-20 lg:py-28 bg-white relative overflow-hidden">
        <div className="absolute inset-0 bg-pattern-light" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            <AnimatedSection>
              <span className="inline-flex items-center gap-2 px-4 py-1.5 bg-aura-accent/10 text-aura-accent rounded-full text-sm font-medium mb-6">
                <Building2 className="w-3.5 h-3.5" />
                {t("home.b2b.badge")}
              </span>
              <h2 className="text-3xl lg:text-5xl font-bold text-gray-900 mb-6 leading-tight">
                {t("home.b2b.heading")}{" "}
                <span className="gradient-text-accent">{t("home.b2b.headingHighlight")}</span>
              </h2>
              <p className="text-lg text-gray-500 mb-8 leading-relaxed">
                {t("home.b2b.description")}
              </p>
              <ul className="space-y-3 mb-8">
                {b2bFeatures.map((item) => (
                  <li
                    key={item}
                    className="flex items-start gap-2.5 text-gray-600"
                  >
                    <CheckCircle className="w-4 h-4 text-aura-primary mt-0.5 flex-shrink-0" />
                    <span className="text-sm">{item}</span>
                  </li>
                ))}
              </ul>
              <Link
                href="/b2b"
                className="group inline-flex items-center gap-2 bg-aura-dark text-white font-semibold px-6 py-3.5 rounded-full hover:bg-aura-darker transition-all duration-300 hover:-translate-y-0.5 shadow-sm hover:shadow-md"
              >
                {t("home.b2b.cta")}
                <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </AnimatedSection>

            <AnimatedSection delay={200}>
              <div className="relative">
                <div className="absolute -inset-4 bg-gradient-to-br from-aura-primary/10 to-aura-accent/10 rounded-[2rem] blur-2xl" />
                <div className="relative bg-aura-dark rounded-3xl p-8 lg:p-10 shadow-2xl overflow-hidden">
                  <div className="absolute top-0 right-0 w-40 h-40 bg-aura-primary/10 rounded-full blur-3xl" />
                  <div className="relative">
                    <div className="text-center text-white mb-8">
                      <p className="text-5xl lg:text-6xl font-bold mb-2">$500K+</p>
                      <p className="text-white/40">{t("home.b2b.paidToDealers")}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-5 text-center border border-white/10">
                        <p className="text-3xl font-bold text-white mb-1">250+</p>
                        <p className="text-xs text-white/40">{t("home.b2b.activeDealers")}</p>
                      </div>
                      <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-5 text-center border border-white/10">
                        <p className="text-3xl font-bold text-aura-accent mb-1">
                          15%
                        </p>
                        <p className="text-xs text-white/40">{t("home.b2b.avgCommission")}</p>
                      </div>
                    </div>
                  </div>
                  {/* Floating element */}
                  <div className="absolute -bottom-3 -right-3 bg-white rounded-2xl shadow-lg p-3 border border-gray-100 animate-float">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center">
                        <TrendingUp className="w-4 h-4 text-aura-primary" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-gray-900">
                          {t("home.b2b.growth")}
                        </p>
                        <p className="text-[10px] text-gray-400">{t("home.b2b.thisQuarter")}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </AnimatedSection>
          </div>
        </div>
      </section>

      {/* ========== FINAL CTA ========== */}
      <section className="relative overflow-hidden bg-gradient-to-br from-aura-dark via-aura-darker to-black py-24 lg:py-32">
        <div className="absolute inset-0 bg-grid opacity-20" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-to-r from-aura-primary/10 to-aura-accent/10 rounded-full blur-[150px]" />

        <div className="relative max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <AnimatedSection>
            <span className="inline-flex items-center gap-2 px-4 py-1.5 bg-white/10 text-white/80 rounded-full text-sm font-medium mb-8 backdrop-blur-sm border border-white/10">
              <Sparkles className="w-3.5 h-3.5 text-aura-accent" />
              {t("home.cta.badge")}
            </span>
            <h2 className="text-3xl lg:text-5xl xl:text-6xl font-bold text-white mb-6 leading-tight">
              {t("home.cta.title")}
              <br />
              {t("home.cta.titleLine2")}
            </h2>
            <p className="text-lg lg:text-xl text-white/50 mb-10 max-w-xl mx-auto leading-relaxed">
              {t("home.cta.subtitle")}
            </p>
            <Link
              href="/build-box"
              className="group inline-flex items-center gap-2 bg-aura-accent hover:bg-aura-accent-hover text-white text-lg font-semibold px-10 py-5 rounded-full shadow-xl shadow-aura-accent/30 hover:shadow-2xl hover:shadow-aura-accent/40 hover:-translate-y-1 transition-all duration-300"
            >
              {t("home.cta.button")}
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            <div className="mt-8 flex flex-wrap justify-center gap-6 text-sm text-white/40">
              {[
                t("home.hero.freeShipping"),
                t("home.hero.cancelAnytime"),
                t("home.cta.satisfaction"),
              ].map(
                (item) => (
                  <div key={item} className="flex items-center gap-1.5">
                    <CheckCircle className="w-3.5 h-3.5 text-aura-primary" />
                    {item}
                  </div>
                )
              )}
            </div>
          </AnimatedSection>
        </div>
      </section>

      <Footer />
    </div>
  );
}
