import Link from "next/link";
import Image from "next/image";
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
  Play,
  Users,
  Award,
  TrendingUp,
} from "lucide-react";

const features = [
  {
    icon: Leaf,
    title: "All-Natural Ingredients",
    description:
      "Premium, non-refrigerated meals made with 100% natural ingredients. No preservatives, no compromises.",
  },
  {
    icon: Clock,
    title: "2-Year Shelf Life",
    description:
      "Revolutionary preservation technology keeps your food fresh for years without refrigeration.",
  },
  {
    icon: Package,
    title: "Build Your Perfect Box",
    description:
      "Choose exactly what you want. Pick 8, 12, or 24 meals to create your personalized subscription.",
  },
  {
    icon: Truck,
    title: "Free Shipping",
    description:
      "Free delivery on all subscription boxes. Your premium meals delivered right to your door.",
  },
  {
    icon: Shield,
    title: "Satisfaction Guaranteed",
    description:
      "Love it or your money back. We stand behind every meal with our 100% satisfaction guarantee.",
  },
  {
    icon: Sparkles,
    title: "AI-Powered Recommendations",
    description:
      "Let Aura AI suggest the perfect box based on your taste preferences and dietary needs.",
  },
];

const boxOptions = [
  {
    name: "Starter",
    slots: 8,
    price: "$59.99",
    perMeal: "$7.50",
    description: "Perfect for individuals",
    popular: false,
    color: "bg-gray-50",
  },
  {
    name: "Voyager",
    slots: 12,
    price: "$84.99",
    perMeal: "$7.08",
    description: "Great for couples",
    popular: true,
    color: "bg-aura-dark",
  },
  {
    name: "Bunker",
    slots: 24,
    price: "$149.99",
    perMeal: "$6.25",
    description: "Family pack & long-term storage",
    popular: false,
    color: "bg-gray-50",
  },
];

const testimonials = [
  {
    name: "Sarah M.",
    role: "Yacht Chef",
    content:
      "Aura has transformed how I provision for charters. Premium quality that doesn't need refrigeration - it's a game changer for marine catering.",
    rating: 5,
    avatar: "SM",
  },
  {
    name: "David R.",
    role: "Gym Owner",
    content:
      "My members love having healthy, shelf-stable options. The B2B portal makes ordering a breeze, and the commission program is excellent.",
    rating: 5,
    avatar: "DR",
  },
  {
    name: "Jennifer K.",
    role: "Busy Mom",
    content:
      "Finally, emergency food that my kids actually want to eat! We keep a Bunker box in our pantry and take Starter boxes camping.",
    rating: 5,
    avatar: "JK",
  },
];

const stats = [
  { label: "Happy Customers", value: "10,000+", icon: Users },
  { label: "Meals Delivered", value: "500K+", icon: Package },
  { label: "Satisfaction Rate", value: "99%", icon: Award },
  { label: "Monthly Growth", value: "30%", icon: TrendingUp },
];

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white">
      <Header />

      {/* Hero Section - Modern Clean Design */}
      <section className="relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-pattern-light opacity-50" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            {/* Left Content */}
            <div className="text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-aura-accent/10 text-aura-accent rounded-full text-sm font-medium mb-6">
                <Sparkles className="w-4 h-4" />
                Premium Shelf-Stable Food
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-6 leading-tight">
                <span className="gradient-text-accent">Energy, Anywhere.</span>
                <br />
                <span className="text-gray-900">Gourmet Food</span>
                <br />
                <span className="text-gray-500">That Lasts.</span>
              </h1>

              <p className="text-lg text-gray-600 mb-8 max-w-lg mx-auto lg:mx-0">
                Build your perfect box of premium, all-natural meals that live
                in your pantry for years but taste like they were cooked today.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start mb-8">
                <Link
                  href="/build-box"
                  className="btn-accent text-lg px-8 py-4 inline-flex items-center justify-center gap-2"
                >
                  Build Your Box
                  <ArrowRight className="w-5 h-5" />
                </Link>
                <Link
                  href="/how-it-works"
                  className="btn-secondary text-lg px-8 py-4 inline-flex items-center justify-center gap-2"
                >
                  <Play className="w-5 h-5" />
                  Watch Video
                </Link>
              </div>

              <div className="flex items-center justify-center lg:justify-start gap-6 text-sm">
                <div className="flex items-center gap-2 text-gray-600">
                  <div className="w-5 h-5 rounded-full bg-aura-primary/10 flex items-center justify-center">
                    <CheckCircle className="w-3 h-3 text-aura-primary" />
                  </div>
                  Free Shipping
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                  <div className="w-5 h-5 rounded-full bg-aura-primary/10 flex items-center justify-center">
                    <CheckCircle className="w-3 h-3 text-aura-primary" />
                  </div>
                  Cancel Anytime
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                  <div className="w-5 h-5 rounded-full bg-aura-primary/10 flex items-center justify-center">
                    <CheckCircle className="w-3 h-3 text-aura-primary" />
                  </div>
                  2-Year Shelf Life
                </div>
              </div>
            </div>

            {/* Right - Hero Image/Visual */}
            <div className="relative">
              <div className="relative aspect-square max-w-lg mx-auto">
                {/* Main Hero Box */}
                <div className="absolute inset-0 bg-gradient-to-br from-aura-primary to-aura-secondary rounded-3xl shadow-2xl shadow-aura-primary/20 transform rotate-3 transition-transform hover:rotate-0 duration-500" />
                <div className="relative h-full bg-white rounded-3xl shadow-xl p-8 flex flex-col items-center justify-center">
                  <div className="w-32 h-32 bg-gradient-to-br from-aura-light to-white rounded-2xl flex items-center justify-center mb-6 shadow-inner">
                    <Package className="w-16 h-16 text-aura-primary" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">Your Custom Box</h3>
                  <p className="text-gray-500 mb-6">Delivered Monthly</p>
                  <div className="flex items-center gap-2 px-4 py-2 bg-aura-light rounded-full">
                    <span className="text-sm font-medium text-aura-primary">Starting at $59.99/mo</span>
                  </div>
                </div>

                {/* Floating Card - Rating */}
                <div className="absolute -bottom-4 -right-4 bg-white rounded-2xl shadow-lg p-4 border border-gray-100 animate-float">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-aura-accent/10 rounded-xl flex items-center justify-center">
                      <Star className="w-5 h-5 text-aura-accent fill-current" />
                    </div>
                    <div>
                      <p className="font-bold text-gray-900">4.9/5 Rating</p>
                      <p className="text-xs text-gray-500">10,000+ Reviews</p>
                    </div>
                  </div>
                </div>

                {/* Floating Card - Delivery */}
                <div className="absolute -top-4 -left-4 bg-white rounded-2xl shadow-lg p-4 border border-gray-100 animate-float" style={{ animationDelay: "0.5s" }}>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-aura-primary/10 rounded-xl flex items-center justify-center">
                      <Truck className="w-5 h-5 text-aura-primary" />
                    </div>
                    <div>
                      <p className="font-bold text-gray-900">Free Delivery</p>
                      <p className="text-xs text-gray-500">On all orders</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Bar */}
      <section className="border-y border-gray-100 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-aura-light rounded-xl mb-3">
                  <stat.icon className="w-6 h-6 text-aura-primary" />
                </div>
                <p className="text-2xl lg:text-3xl font-bold text-gray-900">{stat.value}</p>
                <p className="text-sm text-gray-500">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Box Options Section */}
      <section className="py-20 bg-white relative overflow-hidden">
        <div className="absolute inset-0 bg-pattern-light opacity-30" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-aura-light text-aura-primary rounded-full text-sm font-medium mb-4">
              <Package className="w-4 h-4" />
              Subscription Plans
            </div>
            <h2 className="text-3xl lg:text-5xl font-bold text-gray-900 mb-4">
              Choose Your Box Size
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              From solo adventurers to families preparing for anything, we have
              the perfect box for you.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 lg:gap-8">
            {boxOptions.map((box, index) => (
              <div
                key={box.name}
                className={`relative rounded-3xl p-8 transition-all duration-500 hover:-translate-y-2 ${
                  box.popular
                    ? "bg-aura-dark text-white shadow-2xl shadow-aura-dark/30 scale-105 z-10"
                    : "bg-white border-2 border-gray-100 hover:border-aura-primary/30 hover:shadow-xl"
                }`}
                style={{ animationDelay: `${index * 100}ms` }}
              >
                {box.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <span className="inline-flex items-center gap-1 bg-aura-accent text-white text-sm font-semibold px-5 py-1.5 rounded-full shadow-lg shadow-aura-accent/30">
                      <Sparkles className="w-4 h-4" />
                      Most Popular
                    </span>
                  </div>
                )}
                <div className="text-center">
                  <div className={`inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-6 ${
                    box.popular ? "bg-white/10" : "bg-aura-light"
                  }`}>
                    <Package className={`w-8 h-8 ${box.popular ? "text-white" : "text-aura-primary"}`} />
                  </div>
                  <h3 className="text-2xl font-bold mb-2">{box.name}</h3>
                  <p className={`mb-6 ${box.popular ? "text-white/70" : "text-gray-500"}`}>
                    {box.description}
                  </p>
                  <div className="mb-6">
                    <span className="text-5xl font-bold">{box.price}</span>
                    <span className={`text-lg ${box.popular ? "text-white/70" : "text-gray-500"}`}>
                      /mo
                    </span>
                  </div>
                  <div className={`mb-8 py-6 rounded-2xl ${
                    box.popular ? "bg-white/10" : "bg-gray-50"
                  }`}>
                    <p className="text-4xl font-bold mb-1">{box.slots}</p>
                    <p className={`text-sm font-medium ${box.popular ? "text-white/80" : "text-gray-600"}`}>
                      Premium Meals
                    </p>
                    <div className={`mt-3 pt-3 border-t ${box.popular ? "border-white/10" : "border-gray-200"}`}>
                      <p className={`text-sm ${box.popular ? "text-white/60" : "text-gray-400"}`}>
                        Only {box.perMeal} per meal
                      </p>
                    </div>
                  </div>
                  <Link
                    href={`/build-box?size=${box.name.toLowerCase()}`}
                    className={`group block w-full py-4 rounded-xl font-semibold transition-all duration-300 ${
                      box.popular
                        ? "bg-aura-accent text-white hover:bg-aura-accent/90 shadow-lg shadow-aura-accent/30"
                        : "bg-aura-dark text-white hover:bg-gray-800"
                    }`}
                  >
                    <span className="inline-flex items-center gap-2">
                      Get Started
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </span>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-aura-accent/10 text-aura-accent rounded-full text-sm font-medium mb-4">
              <Award className="w-4 h-4" />
              Why Aura
            </div>
            <h2 className="text-3xl lg:text-5xl font-bold text-gray-900 mb-4">
              Why Choose Aura?
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              We&apos;re not just selling food - we&apos;re delivering peace of
              mind, convenience, and exceptional taste.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <div
                key={feature.title}
                className="group relative bg-white rounded-2xl p-8 border border-gray-100 hover:border-aura-primary/30 hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className="w-14 h-14 bg-gradient-to-br from-aura-light to-aura-primary/10 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                  <feature.icon className="w-7 h-7 text-aura-primary" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">
                  {feature.title}
                </h3>
                <p className="text-gray-600 leading-relaxed">{feature.description}</p>
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-aura-primary to-aura-accent rounded-b-2xl transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-24 bg-aura-dark relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-pattern opacity-5" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-aura-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-aura-accent/10 rounded-full blur-3xl" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 text-white rounded-full text-sm font-medium mb-4 backdrop-blur-sm">
              <Star className="w-4 h-4 text-aura-accent" />
              Testimonials
            </div>
            <h2 className="text-3xl lg:text-5xl font-bold text-white mb-4">
              Loved by Thousands
            </h2>
            <p className="text-lg text-gray-400">
              See what our customers are saying about Aura
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((testimonial, index) => (
              <div
                key={testimonial.name}
                className="group bg-white/5 backdrop-blur-sm rounded-2xl p-8 border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all duration-300"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="flex gap-1 mb-6">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star
                      key={i}
                      className="w-5 h-5 text-aura-accent fill-current"
                    />
                  ))}
                </div>
                <p className="text-gray-300 mb-8 leading-relaxed text-lg">&quot;{testimonial.content}&quot;</p>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-aura-primary to-aura-accent flex items-center justify-center text-white font-bold">
                    {testimonial.avatar}
                  </div>
                  <div>
                    <p className="font-semibold text-white">
                      {testimonial.name}
                    </p>
                    <p className="text-sm text-gray-500">{testimonial.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Trust Badges */}
          <div className="mt-16 flex flex-wrap justify-center gap-8 items-center">
            <div className="text-center">
              <p className="text-4xl font-bold text-white mb-1">4.9</p>
              <div className="flex gap-1 justify-center mb-1">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 text-aura-accent fill-current" />
                ))}
              </div>
              <p className="text-sm text-gray-500">Average Rating</p>
            </div>
            <div className="w-px h-16 bg-white/10 hidden sm:block" />
            <div className="text-center">
              <p className="text-4xl font-bold text-white mb-1">10K+</p>
              <p className="text-sm text-gray-500">Happy Customers</p>
            </div>
            <div className="w-px h-16 bg-white/10 hidden sm:block" />
            <div className="text-center">
              <p className="text-4xl font-bold text-white mb-1">99%</p>
              <p className="text-sm text-gray-500">Would Recommend</p>
            </div>
          </div>
        </div>
      </section>

      {/* B2B CTA Section */}
      <section className="py-24 bg-gradient-to-br from-aura-light via-white to-aura-warm relative overflow-hidden">
        <div className="absolute inset-0 bg-pattern-light opacity-50" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-aura-accent/10 text-aura-accent rounded-full text-sm font-medium mb-6">
                <Users className="w-4 h-4" />
                For Business
              </div>
              <h2 className="text-3xl lg:text-5xl font-bold text-gray-900 mb-6">
                Become an <span className="gradient-text-accent">Aura Dealer</span>
              </h2>
              <p className="text-lg text-gray-600 mb-8">
                Join our Virtual Distributor network. Earn commissions by
                sharing Aura with your customers - no inventory required. Perfect
                for gyms, marinas, FBOs, and retailers.
              </p>
              <ul className="space-y-4 mb-8">
                {[
                  "Wholesale pricing tiers (Bronze to Platinum)",
                  "White-label portal with your branding",
                  "Automated commission payouts via Stripe",
                  "Real-time analytics dashboard",
                ].map((item) => (
                  <li key={item} className="flex items-center gap-3 text-gray-700">
                    <div className="w-6 h-6 rounded-full bg-aura-primary/10 flex items-center justify-center flex-shrink-0">
                      <CheckCircle className="w-4 h-4 text-aura-primary" />
                    </div>
                    {item}
                  </li>
                ))}
              </ul>
              <Link
                href="/b2b"
                className="group btn-accent text-lg px-8 py-4 inline-flex items-center"
              >
                Become a Dealer
                <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>

            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-aura-primary to-aura-accent rounded-3xl transform rotate-3" />
              <div className="relative bg-aura-dark rounded-3xl p-10 shadow-2xl">
                <div className="text-center text-white mb-8">
                  <p className="text-6xl font-bold mb-2">$500K+</p>
                  <p className="text-gray-400">
                    Paid to dealers this year
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-6">
                  <div className="bg-white/5 rounded-2xl p-6 text-center backdrop-blur-sm border border-white/10">
                    <p className="text-4xl font-bold text-white mb-1">250+</p>
                    <p className="text-sm text-gray-400">Active Dealers</p>
                  </div>
                  <div className="bg-white/5 rounded-2xl p-6 text-center backdrop-blur-sm border border-white/10">
                    <p className="text-4xl font-bold text-aura-accent mb-1">15%</p>
                    <p className="text-sm text-gray-400">Avg. Commission</p>
                  </div>
                </div>
                {/* Floating Element */}
                <div className="absolute -bottom-4 -right-4 bg-white rounded-2xl shadow-lg p-4 border border-gray-100 animate-float">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-aura-primary/10 rounded-xl flex items-center justify-center">
                      <TrendingUp className="w-5 h-5 text-aura-primary" />
                    </div>
                    <div>
                      <p className="font-bold text-gray-900">30% Growth</p>
                      <p className="text-xs text-gray-500">This Quarter</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-24 bg-aura-dark relative overflow-hidden">
        {/* Background Elements */}
        <div className="absolute inset-0 bg-pattern opacity-5" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-to-r from-aura-primary/20 to-aura-accent/20 rounded-full blur-3xl" />

        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 text-white rounded-full text-sm font-medium mb-6 backdrop-blur-sm">
            <Sparkles className="w-4 h-4 text-aura-accent" />
            Start Today
          </div>
          <h2 className="text-3xl lg:text-5xl font-bold text-white mb-6">
            Ready to Transform Your Pantry?
          </h2>
          <p className="text-xl text-gray-400 mb-10 max-w-2xl mx-auto">
            Join thousands of satisfied customers who&apos;ve discovered the
            convenience of premium, shelf-stable food.
          </p>
          <Link
            href="/build-box"
            className="group btn-accent text-lg px-12 py-5 inline-flex items-center shadow-xl shadow-aura-accent/30 hover:shadow-2xl hover:shadow-aura-accent/40 transition-all"
          >
            Build Your First Box
            <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Link>
          <div className="mt-8 flex flex-wrap justify-center gap-6 text-sm text-gray-500">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-aura-primary" />
              Free Shipping
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-aura-primary" />
              Cancel Anytime
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-aura-primary" />
              100% Satisfaction Guarantee
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
