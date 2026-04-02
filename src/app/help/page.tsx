"use client";

import { useState } from "react";
import Link from "next/link";
import { Header, Footer } from "@/components/ui";
import {
  Search,
  ChevronDown,
  ChevronUp,
  Package,
  Truck,
  RefreshCw,
  ShoppingBag,
  User,
  Mail,
  Phone,
  HelpCircle,
  ArrowRight,
} from "lucide-react";

interface FAQItem {
  question: string;
  answer: string;
}

interface FAQCategory {
  title: string;
  icon: React.ReactNode;
  items: FAQItem[];
}

const faqCategories: FAQCategory[] = [
  {
    title: "Orders & Shipping",
    icon: <Truck className="w-5 h-5" />,
    items: [
      {
        question: "How do I track my order?",
        answer:
          "Once your order ships, you will receive a tracking email with a link to follow your package in real time. You can also view tracking details from your Orders page in your dashboard.",
      },
      {
        question: "How long does shipping take?",
        answer:
          "Orders are processed within 1-2 business days and typically arrive within 3-5 business days after shipment. All orders ship from our warehouse in El Paso, TX.",
      },
      {
        question: "Do you ship internationally?",
        answer:
          "Currently, we only ship within the United States. We are working on expanding to international markets and will announce availability when ready.",
      },
      {
        question: "Is shipping really free?",
        answer:
          "Yes! Free shipping is included on every box, whether it is a one-time purchase or a subscription. No minimum order required.",
      },
    ],
  },
  {
    title: "Subscriptions",
    icon: <RefreshCw className="w-5 h-5" />,
    items: [
      {
        question: "Can I cancel or pause my subscription?",
        answer:
          "Absolutely. You can cancel or pause your subscription at any time from your dashboard with no cancellation fees. Pausing lets you skip months without losing your subscription pricing.",
      },
      {
        question: "Can I change my box size?",
        answer:
          "Yes, you can upgrade or downgrade your box size at any time. Changes take effect on your next billing cycle. Simply visit your subscription settings in your dashboard.",
      },
      {
        question: "When am I billed?",
        answer:
          "Subscriptions are billed on the same date each month, based on when you first subscribed. You will receive an email reminder a few days before each billing date.",
      },
      {
        question: "Can I skip a month?",
        answer:
          "Yes! You can skip any upcoming shipment from your dashboard. Just make sure to skip before your next billing date. Your subscription will automatically resume the following month.",
      },
    ],
  },
  {
    title: "Products",
    icon: <ShoppingBag className="w-5 h-5" />,
    items: [
      {
        question: "What is the shelf life of your products?",
        answer:
          "All Aura products have a minimum 2-year shelf life. Our premium preservation process locks in freshness and nutrition without artificial preservatives.",
      },
      {
        question: "Are your products all-natural?",
        answer:
          "Yes. Every Aura product is made with all-natural ingredients. We never use artificial preservatives, colors, or flavors. Each product page lists the full ingredient breakdown.",
      },
      {
        question: "What about allergens?",
        answer:
          "Allergen information is clearly listed on every product page. You can also use our dietary filters when building your box to exclude products containing specific allergens.",
      },
    ],
  },
  {
    title: "Account",
    icon: <User className="w-5 h-5" />,
    items: [
      {
        question: "How do I reset my password?",
        answer:
          'Click "Forgot password" on the login page and enter your email address. You will receive a password reset link within a few minutes. Check your spam folder if you do not see it.',
      },
      {
        question: "How do I update my payment method?",
        answer:
          "Go to your Account settings in your dashboard and select Payment Methods. You can add a new card or remove an existing one. Your next payment will use the updated method.",
      },
    ],
  },
];

export default function HelpPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [openItems, setOpenItems] = useState<Record<string, boolean>>({});

  const toggleItem = (categoryIndex: number, itemIndex: number) => {
    const key = `${categoryIndex}-${itemIndex}`;
    setOpenItems((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const isOpen = (categoryIndex: number, itemIndex: number) => {
    return openItems[`${categoryIndex}-${itemIndex}`] || false;
  };

  return (
    <>
      <Header />
      <main className="min-h-screen bg-white">
        {/* Hero */}
        <section className="bg-gradient-to-br from-stone-900 via-stone-800 to-stone-900 text-white py-24 px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-4 tracking-tight">
              Help Center
            </h1>
            <p className="text-lg text-stone-300 mb-8">
              Find answers to common questions
            </p>

            {/* Search Bar */}
            <div className="max-w-xl mx-auto relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400" />
              <input
                type="text"
                placeholder="Search for answers..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-4 rounded-xl bg-white/10 border border-white/20 text-white placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-white/30 focus:border-transparent"
                aria-label="Search help articles"
              />
            </div>
          </div>
        </section>

        {/* FAQ Categories */}
        <section className="max-w-3xl mx-auto px-4 py-16">
          <div className="space-y-10">
            {faqCategories.map((category, catIndex) => (
              <div key={category.title}>
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex items-center justify-center w-10 h-10 bg-stone-100 rounded-xl text-stone-700">
                    {category.icon}
                  </div>
                  <h2 className="text-xl font-bold text-stone-900">
                    {category.title}
                  </h2>
                </div>

                <div className="space-y-2">
                  {category.items.map((item, itemIndex) => (
                    <div
                      key={itemIndex}
                      className="border border-stone-200 rounded-xl overflow-hidden"
                    >
                      <button
                        onClick={() => toggleItem(catIndex, itemIndex)}
                        className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-stone-50 transition"
                        aria-expanded={isOpen(catIndex, itemIndex)}
                      >
                        <span className="font-medium text-stone-900 pr-4">
                          {item.question}
                        </span>
                        {isOpen(catIndex, itemIndex) ? (
                          <ChevronUp className="w-5 h-5 text-stone-400 shrink-0" />
                        ) : (
                          <ChevronDown className="w-5 h-5 text-stone-400 shrink-0" />
                        )}
                      </button>
                      {isOpen(catIndex, itemIndex) && (
                        <div className="px-5 pb-4">
                          <p className="text-stone-600 text-sm leading-relaxed">
                            {item.answer}
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Contact Section */}
        <section className="bg-stone-50 py-16 px-4">
          <div className="max-w-3xl mx-auto text-center">
            <HelpCircle className="w-12 h-12 text-stone-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-stone-900 mb-2">
              Still need help?
            </h2>
            <p className="text-stone-500 mb-8">
              Our support team is here for you
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
              <a
                href="mailto:hello@aura.com"
                className="flex items-center gap-2 text-stone-700 hover:text-stone-900 transition"
              >
                <Mail className="w-5 h-5" />
                <span className="font-medium">hello@aura.com</span>
              </a>
              <a
                href="tel:1-800-AURA-NOW"
                className="flex items-center gap-2 text-stone-700 hover:text-stone-900 transition"
              >
                <Phone className="w-5 h-5" />
                <span className="font-medium">1-800-AURA-NOW</span>
              </a>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
