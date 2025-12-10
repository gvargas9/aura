"use client";

import Link from "next/link";
import { Header, Footer } from "@/components/ui";
import {
  Package,
  Truck,
  Leaf,
  Shield,
  Clock,
  Star,
  ArrowRight,
  CheckCircle,
  Sparkles,
  Zap,
  Mountain,
  Ship,
  Plane,
  Home,
  Heart,
  Users,
  Award,
  TrendingUp,
  Play,
} from "lucide-react";
import { useState } from "react";

const features = [
  {
    icon: Leaf,
    title: "All-Natural Ingredients",
    description:
      "Premium meals made with 100% natural ingredients. No preservatives, no compromises.",
    gradient: "from-emerald-500 to-teal-500",
  },
  {
    icon: Clock,
    title: "2-Year Shelf Life",
    description:
      "Revolutionary preservation keeps food fresh for years without refrigeration.",
    gradient: "from-blue-500 to-cyan-500",
  },
  {
    icon: Package,
    title: "Build Your Perfect Box",
    description:
      "Choose exactly what you want. Pick 8, 12, or 24 meals for your personalized box.",
    gradient: "from-violet-500 to-purple-500",
  },
  {
    icon: Truck,
    title: "Free Shipping Always",
    description:
      "Free delivery on all subscription boxes, straight to your door.",
    gradient: "from-orange-500 to-amber-500",
  },
  {
    icon: Shield,
    title: "100% Satisfaction",
    description:
      "Love it or your money back. We stand behind every single meal.",
    gradient: "from-rose-500 to-pink-500",
  },
  {
    icon: Sparkles,
    title: "AI-Powered Picks",
    description:
      "Let Aura AI suggest the perfect box based on your preferences.",
    gradient: "from-indigo-500 to-blue-500",
  },
];

const boxOptions = [
  {
    name: "Starter",
    slots: 8,
    price: 59.99,
    perMeal: 7.50,
    description: "Perfect for individuals",
    popular: false,
    icon: Zap,
    color: "emerald",
  },
  {
    name: "Voyager",
    slots: 12,
    price: 84.99,
    perMeal: 7.08,
    description: "Great for couples",
    popular: true,
    icon: Ship,
    color: "aura",
  },
  {
    name: "Bunker",
    slots: 24,
    price: 149.99,
    perMeal: 6.25,
    description: "Family & emergency prep",
    popular: false,
    icon: Shield,
    color: "slate",
  },
];

const useCases = [
  { icon: Ship, label: "Boating & Marine", color: "text-blue-500" },
  { icon: Mountain, label: "Outdoor Adventures", color: "text-emerald-500" },
  { icon: Plane, label: "Aviation & FBOs", color: "text-sky-500" },
  { icon: Home, label: "Emergency Prep", color: "text-amber-500" },
  { icon: Heart, label: "Busy Families", color: "text-rose-500" },
  { icon: Users, label: "Gyms & Fitness", color: "text-violet-500" },
];

const testimonials = [
  {
    name: "Sarah M.",
    role: "Yacht Chef",
    content:
      "Aura has transformed how I provision for charters. Premium quality that doesn't need refrigeration - it's a game changer for marine catering.",
    rating: 5,
    avatar: "S",
  },
  {
    name: "David R.",
    role: "Gym Owner & Dealer",
    content:
      "My members love having healthy, shelf-stable options. The B2B portal is seamless, and I've earned over $5k in commissions!",
    rating: 5,
    avatar: "D",
  },
  {
    name: "Jennifer K.",
    role: "Busy Mom of 3",
    content:
      "Finally, emergency food that my kids actually want to eat! We keep a Bunker box in our pantry and take Starter boxes camping.",
    rating: 5,
    avatar: "J",
  },
];

const stats = [
  { value: "50K+", label: "Happy Customers" },
  { value: "2M+", label: "Meals Delivered" },
  { value: "4.9", label: "Star Rating", icon: Star },
  { value: "250+", label: "Dealer Partners" },
];

export default function HomePage() {
  const [hoveredBox, setHoveredBox] = useState<string | null>(null);

  return (
    <div className="min-h-screen">
      <Header />

      {/* Hero Section - Modern mesh gradient with floating elements */}
      <section className="relative overflow-hidden bg-mesh min-h-[90vh] flex items-center">
        {/* Decorative background elements */}
        <div className="absolute inset-0 bg-dots opacity-30" />
        <div className="absolute top-20 left-10 w-72 h-72 bg-aura-primary/10 rounded-full blur-3xl animate-pulse-slow" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-aura-accent/10 rounded-full blur-3xl animate-pulse-slow" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-32 relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="text-center lg:text-left">
              {/* Floating badges */}
              <div className="flex flex-wrap gap-3 justify-center lg:justify-start mb-6">
                <span className="inline-flex items-center px-4 py-1.5 bg-white/80 backdrop-blur-sm text-aura-primary rounded-full text-sm font-medium shadow-lg shadow-aura-primary/10 border border-aura-primary/20">
                  <Leaf className="w-4 h-4 mr-2" />
                  100% Natural
                </span>
                <span className="inline-flex items-center px-4 py-1.5 bg-white/80 backdrop-blur-sm text-amber-600 rounded-full text-sm font-medium shadow-lg shadow-amber-500/10 border border-amber-500/20">
                  <Clock className="w-4 h-4 mr-2" />
                  2-Year Shelf Life
                </span>
              </div>

              <h1 className="text-5xl lg:text-7xl font-bold text-gray-900 mb-6 tracking-tight">
                <span className="gradient-text">Premium Food</span>
                <br />
                <span className="text-gray-800">That Goes Anywhere</span>
              </h1>

              <p className="text-xl text-gray-600 mb-8 max-w-xl leading-relaxed">
                Build your perfect box of gourmet, shelf-stable meals. No refrigeration needed.
                Ready when you are — from your pantry to the peak.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <Link
                  href="/build-box"
                  className="group btn-primary text-lg px-8 py-4 inline-flex items-center justify-center"
                >
                  Build Your Box
                  <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Link>
                <button className="btn-ghost text-lg px-8 py-4 inline-flex items-center justify-center hover:bg-white/50">
                  <Play className="w-5 h-5 mr-2" />
                  Watch Video
                </button>
              </div>

              {/* Trust indicators */}
              <div className="mt-10 flex flex-wrap items-center justify-center lg:justify-start gap-6 text-sm text-gray-500">
                <div className="flex items-center">
                  <CheckCircle className="w-5 h-5 text-aura-primary mr-2" />
                  Free Shipping
                </div>
                <div className="flex items-center">
                  <CheckCircle className="w-5 h-5 text-aura-primary mr-2" />
                  Cancel Anytime
                </div>
                <div className="flex items-center">
                  <CheckCircle className="w-5 h-5 text-aura-primary mr-2" />
                  Money-Back Guarantee
                </div>
              </div>
            </div>

            {/* Hero Visual */}
            <div className="relative">
              <div className="relative aspect-square max-w-lg mx-auto">
                {/* Main product showcase */}
                <div className="absolute inset-0 bg-gradient-to-br from-aura-primary via-aura-secondary to-emerald-600 rounded-3xl shadow-2xl shadow-aura-primary/30 animate-float">
                  <div className="absolute inset-0 bg-black/10 rounded-3xl" />
                  <div className="absolute inset-4 border-2 border-white/20 rounded-2xl" />
                  <div className="flex flex-col items-center justify-center h-full text-white p-8">
                    <Package className="w-20 h-20 mb-4 opacity-90" />
                    <p className="text-2xl font-bold mb-1">Your Custom Box</p>
                    <p className="text-white/70">8, 12, or 24 meals</p>
                    <div className="mt-6 flex -space-x-2">
                      {[1, 2, 3, 4, 5].map((i) => (
                        <div key={i} className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm border-2 border-white/30" />
                      ))}
                    </div>
                    <p className="text-sm text-white/60 mt-2">Mix any meals you want</p>
                  </div>
                </div>

                {/* Floating stat cards */}
                <div className="absolute -bottom-4 -left-4 bg-white rounded-2xl shadow-xl p-4 animate-bounce-soft">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-amber-400 to-orange-500 rounded-xl flex items-center justify-center">
                      <Star className="w-6 h-6 text-white fill-white" />
                    </div>
                    <div>
                      <p className="font-bold text-gray-900">4.9/5</p>
                      <p className="text-xs text-gray-500">10,000+ reviews</p>
                    </div>
                  </div>
                </div>

                <div className="absolute -top-4 -right-4 bg-white rounded-2xl shadow-xl p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-xl flex items-center justify-center">
                      <TrendingUp className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <p className="font-bold text-gray-900">2M+</p>
                      <p className="text-xs text-gray-500">Meals delivered</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Bar */}
      <section className="bg-white border-y border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="flex items-center justify-center gap-2">
                  <p className="text-3xl lg:text-4xl font-bold gradient-text">{stat.value}</p>
                  {stat.icon && <stat.icon className="w-6 h-6 text-amber-400 fill-amber-400" />}
                </div>
                <p className="text-sm text-gray-500 mt-1">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Use Cases Bar */}
      <section className="bg-gray-50 py-8 border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-center text-sm text-gray-500 mb-6 uppercase tracking-wider font-medium">
            Perfect For
          </p>
          <div className="flex flex-wrap justify-center gap-4 lg:gap-8">
            {useCases.map((useCase) => (
              <div key={useCase.label} className="flex items-center gap-2 px-4 py-2 bg-white rounded-full shadow-sm border border-gray-100 hover:shadow-md hover:border-aura-primary/30 transition-all cursor-pointer">
                <useCase.icon className={`w-5 h-5 ${useCase.color}`} />
                <span className="text-sm font-medium text-gray-700">{useCase.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Box Options Section - Enhanced with modern cards */}
      <section className="py-24 bg-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-aura-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-16">
            <span className="inline-block px-4 py-1 bg-aura-primary/10 text-aura-primary rounded-full text-sm font-medium mb-4">
              Choose Your Size
            </span>
            <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
              Build Your Perfect Box
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              From solo adventurers to families, we have the perfect box for every lifestyle.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 lg:gap-10">
            {boxOptions.map((box) => (
              <div
                key={box.name}
                className={`relative rounded-3xl transition-all duration-500 ${
                  box.popular
                    ? "bg-gradient-to-br from-aura-primary via-aura-secondary to-emerald-600 text-white shadow-2xl shadow-aura-primary/30 scale-105 z-10"
                    : "bg-white border-2 border-gray-100 hover:border-aura-primary/30 hover:shadow-xl"
                }`}
                onMouseEnter={() => setHoveredBox(box.name)}
                onMouseLeave={() => setHoveredBox(null)}
              >
                {box.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <span className="bg-gradient-to-r from-amber-400 to-orange-500 text-white text-sm font-bold px-6 py-2 rounded-full shadow-lg inline-flex items-center gap-2">
                      <Award className="w-4 h-4" />
                      Most Popular
                    </span>
                  </div>
                )}

                <div className="p-8 lg:p-10">
                  {/* Icon */}
                  <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-6 ${
                    box.popular ? "bg-white/20" : "bg-gradient-to-br from-aura-primary/10 to-emerald-500/10"
                  }`}>
                    <box.icon className={`w-8 h-8 ${box.popular ? "text-white" : "text-aura-primary"}`} />
                  </div>

                  <h3 className="text-2xl font-bold mb-2">{box.name}</h3>
                  <p className={`mb-6 ${box.popular ? "text-white/80" : "text-gray-500"}`}>
                    {box.description}
                  </p>

                  {/* Price */}
                  <div className="mb-6">
                    <span className="text-5xl font-bold">${box.price.toFixed(0)}</span>
                    <span className={box.popular ? "text-white/70" : "text-gray-400"}>/month</span>
                  </div>

                  {/* Meal count */}
                  <div className={`rounded-2xl p-6 mb-6 ${box.popular ? "bg-white/10" : "bg-gray-50"}`}>
                    <div className="flex items-center justify-between mb-2">
                      <span className={box.popular ? "text-white/80" : "text-gray-500"}>Meals per box</span>
                      <span className="text-2xl font-bold">{box.slots}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className={box.popular ? "text-white/80" : "text-gray-500"}>Price per meal</span>
                      <span className="font-semibold">${box.perMeal.toFixed(2)}</span>
                    </div>
                  </div>

                  {/* Features */}
                  <ul className="space-y-3 mb-8">
                    {["Mix any meals you want", "Free shipping included", "Skip or cancel anytime"].map((feature) => (
                      <li key={feature} className="flex items-center gap-3">
                        <CheckCircle className={`w-5 h-5 ${box.popular ? "text-white" : "text-aura-primary"}`} />
                        <span className={box.popular ? "text-white/90" : "text-gray-600"}>{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <Link
                    href={`/build-box?size=${box.name.toLowerCase()}`}
                    className={`block w-full py-4 rounded-xl font-semibold text-center transition-all duration-300 ${
                      box.popular
                        ? "bg-white text-aura-primary hover:bg-gray-50 shadow-lg"
                        : "bg-aura-primary text-white hover:bg-aura-secondary hover:shadow-lg hover:shadow-aura-primary/25"
                    }`}
                  >
                    Get Started
                    <ArrowRight className="inline ml-2 w-4 h-4" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section - Modern grid with gradient icons */}
      <section className="py-24 bg-gray-50 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="inline-block px-4 py-1 bg-aura-primary/10 text-aura-primary rounded-full text-sm font-medium mb-4">
              Why Aura
            </span>
            <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
              Food That Fits Your Life
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              We&apos;re not just selling food — we&apos;re delivering peace of mind,
              convenience, and exceptional taste.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="group bg-white rounded-2xl p-8 shadow-sm hover:shadow-xl border border-gray-100 hover:border-transparent transition-all duration-300 hover:-translate-y-1"
              >
                <div className={`w-14 h-14 bg-gradient-to-br ${feature.gradient} rounded-2xl flex items-center justify-center mb-6 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                  <feature.icon className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">
                  {feature.title}
                </h3>
                <p className="text-gray-600 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section - Modern cards */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="inline-block px-4 py-1 bg-amber-500/10 text-amber-600 rounded-full text-sm font-medium mb-4">
              Customer Love
            </span>
            <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
              Trusted by Thousands
            </h2>
            <p className="text-xl text-gray-600">
              Real stories from real customers who love Aura
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial) => (
              <div
                key={testimonial.name}
                className="group relative bg-gradient-to-br from-gray-50 to-white rounded-2xl p-8 border border-gray-100 hover:border-aura-primary/20 hover:shadow-xl transition-all duration-300"
              >
                {/* Quote mark */}
                <div className="absolute top-6 right-6 text-6xl font-serif text-aura-primary/10 leading-none">
                  &quot;
                </div>

                {/* Stars */}
                <div className="flex gap-1 mb-6">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star
                      key={i}
                      className="w-5 h-5 text-amber-400 fill-amber-400"
                    />
                  ))}
                </div>

                <p className="text-gray-700 mb-8 leading-relaxed relative z-10">
                  &quot;{testimonial.content}&quot;
                </p>

                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-aura-primary to-aura-secondary rounded-full flex items-center justify-center text-white font-bold shadow-lg">
                    {testimonial.avatar}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">{testimonial.name}</p>
                    <p className="text-sm text-gray-500">{testimonial.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* B2B CTA Section - Enhanced */}
      <section className="py-24 bg-gradient-to-br from-aura-dark via-emerald-900 to-aura-dark relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-aura-primary/20 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <span className="inline-flex items-center px-4 py-1.5 bg-aura-primary/20 text-aura-primary rounded-full text-sm font-medium mb-6">
                <TrendingUp className="w-4 h-4 mr-2" />
                For Business
              </span>
              <h2 className="text-4xl lg:text-5xl font-bold text-white mb-6">
                Become an Aura Dealer
              </h2>
              <p className="text-xl text-gray-300 mb-8 leading-relaxed">
                Join our Virtual Distributor network. Earn commissions by sharing Aura
                with your customers — no inventory required. Perfect for gyms, marinas,
                FBOs, and retailers.
              </p>

              <ul className="space-y-4 mb-10">
                {[
                  "Wholesale pricing tiers (Bronze to Platinum)",
                  "White-label portal with your branding",
                  "Automated commission payouts via Stripe",
                  "Real-time analytics dashboard",
                ].map((item) => (
                  <li key={item} className="flex items-center text-gray-300">
                    <div className="w-6 h-6 rounded-full bg-aura-primary/20 flex items-center justify-center mr-3">
                      <CheckCircle className="w-4 h-4 text-aura-primary" />
                    </div>
                    {item}
                  </li>
                ))}
              </ul>

              <div className="flex flex-col sm:flex-row gap-4">
                <Link
                  href="/b2b/apply"
                  className="btn-primary text-lg px-8 py-4 inline-flex items-center justify-center"
                >
                  Apply Now
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Link>
                <Link
                  href="/b2b"
                  className="btn-ghost text-white hover:bg-white/10 text-lg px-8 py-4 inline-flex items-center justify-center"
                >
                  Learn More
                </Link>
              </div>
            </div>

            {/* Stats card */}
            <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-8 lg:p-10 border border-white/20">
              <div className="text-center mb-8">
                <p className="text-6xl font-bold text-white mb-2">$500K+</p>
                <p className="text-gray-300">Paid to dealers this year</p>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="bg-white/10 rounded-2xl p-6 text-center">
                  <p className="text-4xl font-bold text-white mb-1">250+</p>
                  <p className="text-sm text-gray-400">Active Dealers</p>
                </div>
                <div className="bg-white/10 rounded-2xl p-6 text-center">
                  <p className="text-4xl font-bold text-white mb-1">15%</p>
                  <p className="text-sm text-gray-400">Avg. Commission</p>
                </div>
                <div className="bg-white/10 rounded-2xl p-6 text-center">
                  <p className="text-4xl font-bold text-white mb-1">$2K</p>
                  <p className="text-sm text-gray-400">Avg. Monthly Earnings</p>
                </div>
                <div className="bg-white/10 rounded-2xl p-6 text-center">
                  <p className="text-4xl font-bold text-white mb-1">24h</p>
                  <p className="text-sm text-gray-400">Approval Time</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA - Enhanced */}
      <section className="py-24 bg-mesh relative overflow-hidden">
        <div className="absolute inset-0 bg-dots opacity-20" />

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <span className="inline-flex items-center px-4 py-1.5 bg-aura-primary/10 text-aura-primary rounded-full text-sm font-medium mb-6">
            <Sparkles className="w-4 h-4 mr-2" />
            Start Today
          </span>

          <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
            Ready to Transform Your Pantry?
          </h2>
          <p className="text-xl text-gray-600 mb-10 max-w-2xl mx-auto">
            Join thousands of satisfied customers who&apos;ve discovered the
            convenience of premium, shelf-stable food.
          </p>

          <Link
            href="/build-box"
            className="btn-primary text-lg px-12 py-5 inline-flex items-center shadow-2xl shadow-aura-primary/30 hover:shadow-aura-primary/40"
          >
            Build Your First Box
            <ArrowRight className="ml-2 w-5 h-5" />
          </Link>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-6 text-sm text-gray-500">
            <div className="flex items-center">
              <CheckCircle className="w-5 h-5 text-aura-primary mr-2" />
              Free shipping on all orders
            </div>
            <div className="flex items-center">
              <CheckCircle className="w-5 h-5 text-aura-primary mr-2" />
              Cancel anytime
            </div>
            <div className="flex items-center">
              <CheckCircle className="w-5 h-5 text-aura-primary mr-2" />
              100% satisfaction guarantee
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
