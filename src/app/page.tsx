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
  },
  {
    name: "Voyager",
    slots: 12,
    price: "$84.99",
    perMeal: "$7.08",
    description: "Great for couples",
    popular: true,
  },
  {
    name: "Bunker",
    slots: 24,
    price: "$149.99",
    perMeal: "$6.25",
    description: "Family pack & long-term storage",
    popular: false,
  },
];

const testimonials = [
  {
    name: "Sarah M.",
    role: "Yacht Chef",
    content:
      "Aura has transformed how I provision for charters. Premium quality that doesn't need refrigeration - it's a game changer for marine catering.",
    rating: 5,
  },
  {
    name: "David R.",
    role: "Gym Owner",
    content:
      "My members love having healthy, shelf-stable options. The B2B portal makes ordering a breeze, and the commission program is excellent.",
    rating: 5,
  },
  {
    name: "Jennifer K.",
    role: "Busy Mom",
    content:
      "Finally, emergency food that my kids actually want to eat! We keep a Bunker box in our pantry and take Starter boxes camping.",
    rating: 5,
  },
];

export default function HomePage() {
  return (
    <div className="min-h-screen">
      <Header />

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-aura-light via-white to-aura-light">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-32">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="text-center lg:text-left">
              <span className="inline-block px-4 py-1 bg-aura-primary/10 text-aura-primary rounded-full text-sm font-medium mb-6">
                Premium Shelf-Stable Food
              </span>
              <h1 className="text-4xl lg:text-6xl font-bold text-gray-900 mb-6">
                <span className="gradient-text">Energy, Anywhere.</span>
                <br />
                Gourmet Food That Lasts.
              </h1>
              <p className="text-xl text-gray-600 mb-8 max-w-xl">
                Build your perfect box of premium, all-natural meals that live
                in your pantry for years but taste like they were cooked today.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <Link href="/build-box" className="btn-primary text-lg px-8 py-3">
                  Build Your Box
                  <ArrowRight className="inline ml-2 w-5 h-5" />
                </Link>
                <Link
                  href="/how-it-works"
                  className="btn-secondary text-lg px-8 py-3"
                >
                  How It Works
                </Link>
              </div>
              <div className="mt-8 flex items-center justify-center lg:justify-start gap-8 text-sm text-gray-500">
                <div className="flex items-center">
                  <CheckCircle className="w-5 h-5 text-aura-primary mr-2" />
                  Free Shipping
                </div>
                <div className="flex items-center">
                  <CheckCircle className="w-5 h-5 text-aura-primary mr-2" />
                  Cancel Anytime
                </div>
              </div>
            </div>
            <div className="relative">
              <div className="aspect-square bg-aura-gradient rounded-3xl shadow-2xl flex items-center justify-center animate-float">
                <div className="text-white text-center p-8">
                  <Package className="w-24 h-24 mx-auto mb-4 opacity-90" />
                  <p className="text-2xl font-semibold">Your Custom Box</p>
                  <p className="opacity-75">Delivered Monthly</p>
                </div>
              </div>
              <div className="absolute -bottom-4 -right-4 bg-white rounded-2xl shadow-lg p-4 animate-fade-in">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-aura-accent/10 rounded-full flex items-center justify-center">
                    <Star className="w-6 h-6 text-aura-accent" />
                  </div>
                  <div>
                    <p className="font-semibold">4.9/5 Rating</p>
                    <p className="text-sm text-gray-500">10,000+ Reviews</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Box Options Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
              Choose Your Box Size
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              From solo adventurers to families preparing for anything, we have
              the perfect box for you.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {boxOptions.map((box) => (
              <div
                key={box.name}
                className={`relative rounded-2xl p-8 transition-all duration-300 hover:scale-105 ${
                  box.popular
                    ? "bg-aura-gradient text-white shadow-xl"
                    : "bg-gray-50 border border-gray-200 hover:border-aura-primary"
                }`}
              >
                {box.popular && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-aura-accent text-white text-sm font-medium px-4 py-1 rounded-full">
                    Most Popular
                  </span>
                )}
                <div className="text-center">
                  <h3 className="text-2xl font-bold mb-2">{box.name}</h3>
                  <p
                    className={`mb-4 ${
                      box.popular ? "text-white/80" : "text-gray-500"
                    }`}
                  >
                    {box.description}
                  </p>
                  <div className="mb-6">
                    <span className="text-4xl font-bold">{box.price}</span>
                    <span
                      className={box.popular ? "text-white/80" : "text-gray-500"}
                    >
                      /month
                    </span>
                  </div>
                  <div
                    className={`mb-6 py-4 rounded-lg ${
                      box.popular ? "bg-white/20" : "bg-white"
                    }`}
                  >
                    <p className="text-3xl font-bold">{box.slots}</p>
                    <p
                      className={`text-sm ${
                        box.popular ? "text-white/80" : "text-gray-500"
                      }`}
                    >
                      Premium Meals
                    </p>
                    <p
                      className={`text-sm mt-2 ${
                        box.popular ? "text-white/60" : "text-gray-400"
                      }`}
                    >
                      {box.perMeal} per meal
                    </p>
                  </div>
                  <Link
                    href={`/build-box?size=${box.name.toLowerCase()}`}
                    className={`block w-full py-3 rounded-lg font-semibold transition-colors ${
                      box.popular
                        ? "bg-white text-aura-primary hover:bg-gray-100"
                        : "bg-aura-primary text-white hover:bg-aura-secondary"
                    }`}
                  >
                    Get Started
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
              Why Choose Aura?
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              We&apos;re not just selling food - we&apos;re delivering peace of
              mind, convenience, and exceptional taste.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="bg-white rounded-xl p-6 shadow-md hover:shadow-lg transition-shadow"
              >
                <div className="w-12 h-12 bg-aura-primary/10 rounded-lg flex items-center justify-center mb-4">
                  <feature.icon className="w-6 h-6 text-aura-primary" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {feature.title}
                </h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
              Loved by Thousands
            </h2>
            <p className="text-xl text-gray-600">
              See what our customers are saying about Aura
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial) => (
              <div
                key={testimonial.name}
                className="bg-gray-50 rounded-xl p-6 border border-gray-100"
              >
                <div className="flex mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star
                      key={i}
                      className="w-5 h-5 text-aura-accent fill-current"
                    />
                  ))}
                </div>
                <p className="text-gray-700 mb-4">&quot;{testimonial.content}&quot;</p>
                <div>
                  <p className="font-semibold text-gray-900">
                    {testimonial.name}
                  </p>
                  <p className="text-sm text-gray-500">{testimonial.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* B2B CTA Section */}
      <section className="py-20 bg-aura-dark">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <span className="inline-block px-4 py-1 bg-aura-primary/20 text-aura-primary rounded-full text-sm font-medium mb-6">
                For Business
              </span>
              <h2 className="text-3xl lg:text-4xl font-bold text-white mb-6">
                Become an Aura Dealer
              </h2>
              <p className="text-xl text-gray-300 mb-8">
                Join our Virtual Distributor network. Earn commissions by
                sharing Aura with your customers - no inventory required. Perfect
                for gyms, marinas, FBOs, and retailers.
              </p>
              <ul className="space-y-3 mb-8">
                {[
                  "Wholesale pricing tiers (Bronze to Platinum)",
                  "White-label portal with your branding",
                  "Automated commission payouts via Stripe",
                  "Real-time analytics dashboard",
                ].map((item) => (
                  <li key={item} className="flex items-center text-gray-300">
                    <CheckCircle className="w-5 h-5 text-aura-primary mr-3" />
                    {item}
                  </li>
                ))}
              </ul>
              <Link
                href="/b2b"
                className="btn-primary text-lg px-8 py-3 inline-flex items-center"
              >
                Learn More
                <ArrowRight className="ml-2 w-5 h-5" />
              </Link>
            </div>
            <div className="bg-white/10 rounded-2xl p-8 backdrop-blur-sm">
              <div className="text-center text-white">
                <p className="text-5xl font-bold mb-2">$500K+</p>
                <p className="text-gray-300 mb-6">
                  Paid to dealers this year
                </p>
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div>
                    <p className="text-3xl font-bold">250+</p>
                    <p className="text-sm text-gray-400">Active Dealers</p>
                  </div>
                  <div>
                    <p className="text-3xl font-bold">15%</p>
                    <p className="text-sm text-gray-400">Avg. Commission</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 bg-gradient-to-br from-aura-light to-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-6">
            Ready to Transform Your Pantry?
          </h2>
          <p className="text-xl text-gray-600 mb-8">
            Join thousands of satisfied customers who&apos;ve discovered the
            convenience of premium, shelf-stable food.
          </p>
          <Link
            href="/build-box"
            className="btn-primary text-lg px-12 py-4 inline-flex items-center"
          >
            Build Your First Box
            <ArrowRight className="ml-2 w-5 h-5" />
          </Link>
          <p className="mt-4 text-sm text-gray-500">
            Free shipping on all orders. Cancel anytime.
          </p>
        </div>
      </section>

      <Footer />
    </div>
  );
}
