"use client";

import Link from "next/link";
import { Header, Footer } from "@/components/ui";
import {
  ArrowRight,
  ChefHat,
  Award,
  Users,
  Rocket,
  Sparkles,
  ShieldCheck,
  Leaf,
  Heart,
  MapPin,
} from "lucide-react";
import { cn } from "@/lib/utils";

const milestones = [
  {
    year: "2023",
    icon: Rocket,
    title: "Founded in Austin, TX",
    description:
      "Aura was born from a simple frustration: why does shelf-stable food have to taste terrible? We set out to prove it doesn't.",
  },
  {
    year: "2023",
    icon: ChefHat,
    title: "First 50 Recipes Developed",
    description:
      "Partnered with professional chefs to create a lineup of gourmet meals — from Thai basil chicken to wild mushroom risotto.",
  },
  {
    year: "2024",
    icon: Users,
    title: "Launched B2B Partner Program",
    description:
      "Opened our dealer network, bringing Aura meals to outdoor retailers, corporate wellness programs, and aviation catering.",
  },
  {
    year: "2025",
    icon: Award,
    title: "10,000 Customers Milestone",
    description:
      "Reached 10K happy customers across all 50 states. From everyday families to backcountry adventurers, Aura is everywhere.",
  },
];

const differences = [
  {
    icon: ChefHat,
    title: "Chef-Crafted Recipes",
    description:
      "Every recipe is developed by professional chefs, not a factory line. We taste-test obsessively until each meal is restaurant-worthy.",
  },
  {
    icon: Leaf,
    title: "Premium Ingredients",
    description:
      "We source the highest-quality, all-natural ingredients. No MSG, no artificial flavors, no preservatives — ever.",
  },
  {
    icon: Sparkles,
    title: "Proprietary Retort Process",
    description:
      "Our custom retort cooking method preserves flavor, texture, and nutrition for up to 2 years without refrigeration or chemicals.",
  },
];

export default function StoryPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      {/* Hero */}
      <section className="bg-aura-hero py-24 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <span className="inline-block px-4 py-1.5 bg-white/10 backdrop-blur-sm rounded-full text-sm font-medium mb-6 border border-white/20">
            <MapPin className="w-3.5 h-3.5 inline-block mr-1.5 -mt-0.5" />
            Austin, Texas
          </span>
          <h1 className="text-4xl lg:text-6xl font-bold mb-6 font-display">
            Our Story
          </h1>
          <p className="text-xl lg:text-2xl opacity-90 max-w-3xl mx-auto leading-relaxed">
            How a passion for great food led to a revolution in shelf-stable
            meals.
          </p>
        </div>
      </section>

      {/* Origin Story */}
      <section className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="prose prose-lg max-w-none">
            <h2 className="text-3xl font-bold text-gray-900 font-display mb-6">
              It Started With a Bad MRE
            </h2>
            <div className="space-y-5 text-gray-600 leading-relaxed text-lg">
              <p>
                It was a weekend backpacking trip in Big Bend National Park. Three
                days of incredible views, rugged trails — and terrible food. The
                freeze-dried meals were bland. The emergency rations were worse.
                And the energy bars had all melted together in the Texas heat.
              </p>
              <p>
                That's when the question hit:{" "}
                <span className="text-gray-900 font-medium">
                  Why can't shelf-stable food taste as good as a home-cooked meal?
                </span>
              </p>
              <p>
                Back in Austin, we started researching retort technology — the
                same preservation method used by premium food manufacturers
                worldwide. We discovered that with the right ingredients, the
                right recipes, and the right process, shelf-stable meals could be
                genuinely delicious. Not "good for camping food" — actually good.
              </p>
              <p>
                Aura was founded on that belief. We partnered with professional
                chefs, sourced premium all-natural ingredients, and developed a
                proprietary retort process that locks in flavor and nutrition for
                up to two years. No artificial preservatives. No compromises.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Timeline */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 font-display">
              Our Journey
            </h2>
            <p className="mt-4 text-lg text-gray-600">
              Key milestones on the road to reimagining shelf-stable food.
            </p>
          </div>
          <div className="relative">
            {/* Vertical line */}
            <div className="absolute left-8 lg:left-1/2 lg:-translate-x-px top-0 bottom-0 w-0.5 bg-gradient-to-b from-aura-primary via-aura-secondary to-aura-dark" />

            <div className="space-y-12">
              {milestones.map((milestone, index) => {
                const Icon = milestone.icon;
                return (
                  <div
                    key={milestone.title}
                    className={cn(
                      "relative flex items-start gap-8",
                      "lg:gap-0",
                      index % 2 === 0
                        ? "lg:flex-row"
                        : "lg:flex-row-reverse"
                    )}
                  >
                    {/* Dot */}
                    <div className="absolute left-8 lg:left-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-aura-primary border-4 border-white shadow-md z-10" />

                    {/* Content */}
                    <div
                      className={cn(
                        "ml-16 lg:ml-0 lg:w-1/2",
                        index % 2 === 0
                          ? "lg:pr-12 lg:text-right"
                          : "lg:pl-12"
                      )}
                    >
                      <div
                        className={cn(
                          "bg-white rounded-2xl p-6 border border-gray-100 shadow-sm",
                          "hover:shadow-md transition-shadow"
                        )}
                      >
                        <div
                          className={cn(
                            "flex items-center gap-3 mb-3",
                            index % 2 === 0 && "lg:justify-end"
                          )}
                        >
                          <span className="text-sm font-bold text-aura-primary uppercase tracking-widest">
                            {milestone.year}
                          </span>
                          <div className="w-8 h-8 rounded-lg bg-aura-light flex items-center justify-center">
                            <Icon className="w-4 h-4 text-aura-primary" />
                          </div>
                        </div>
                        <h3 className="text-lg font-bold text-gray-900 mb-2">
                          {milestone.title}
                        </h3>
                        <p className="text-gray-600 text-sm leading-relaxed">
                          {milestone.description}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* The Aura Difference */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 font-display">
              The Aura Difference
            </h2>
            <p className="mt-4 text-lg text-gray-600 max-w-2xl mx-auto">
              What sets us apart from every other shelf-stable food company.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {differences.map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.title}
                  className="text-center p-8 rounded-2xl border border-gray-100 hover:border-aura-primary/30 hover:shadow-lg transition-all duration-300"
                >
                  <div className="w-16 h-16 rounded-2xl bg-aura-light flex items-center justify-center mx-auto mb-5">
                    <Icon className="w-8 h-8 text-aura-primary" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">
                    {item.title}
                  </h3>
                  <p className="text-gray-600 leading-relaxed">
                    {item.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Our Promise */}
      <section className="py-20 bg-aura-light">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <Heart className="w-10 h-10 text-aura-primary mx-auto mb-6" />
          <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 font-display mb-6">
            Our Promise
          </h2>
          <div className="grid sm:grid-cols-3 gap-6 mt-10">
            {[
              {
                icon: Leaf,
                title: "All-Natural",
                description: "100% natural ingredients in every meal",
              },
              {
                icon: ShieldCheck,
                title: "No Preservatives",
                description: "Zero artificial additives or chemicals",
              },
              {
                icon: Award,
                title: "Satisfaction Guaranteed",
                description: "Love it or we'll make it right",
              },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.title} className="bg-white rounded-2xl p-6 shadow-sm">
                  <Icon className="w-8 h-8 text-aura-primary mx-auto mb-3" />
                  <h3 className="font-semibold text-gray-900 mb-1">
                    {item.title}
                  </h3>
                  <p className="text-sm text-gray-600">{item.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-aura-gradient text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl lg:text-4xl font-bold mb-4 font-display">
            Taste the Difference
          </h2>
          <p className="text-lg opacity-90 mb-8 max-w-xl mx-auto">
            Try Aura for yourself and discover what shelf-stable food was always
            meant to be.
          </p>
          <Link
            href="/products"
            className="inline-flex items-center gap-2 bg-white text-aura-dark font-semibold px-8 py-4 rounded-xl hover:bg-gray-100 transition-all duration-200 hover:-translate-y-0.5 shadow-lg"
          >
            Explore Our Products
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
}
