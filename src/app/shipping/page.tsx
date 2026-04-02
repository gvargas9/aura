"use client";

import Link from "next/link";
import { Header, Footer } from "@/components/ui";
import {
  Truck,
  Clock,
  MapPin,
  PackageCheck,
  Leaf,
  ThermometerSun,
  Box,
  CalendarClock,
  Home,
  ArrowRight,
  CheckCircle,
  Info,
} from "lucide-react";

const highlights = [
  {
    icon: <Truck className="w-6 h-6" />,
    title: "Free Shipping",
    description: "On every order, no minimum",
  },
  {
    icon: <Clock className="w-6 h-6" />,
    title: "3-5 Business Days",
    description: "Standard delivery time",
  },
  {
    icon: <MapPin className="w-6 h-6" />,
    title: "Ships from El Paso, TX",
    description: "Our central US warehouse",
  },
  {
    icon: <PackageCheck className="w-6 h-6" />,
    title: "Tracking Included",
    description: "Real-time updates via email",
  },
];

export default function ShippingPage() {
  return (
    <>
      <Header />
      <main className="min-h-screen bg-white">
        {/* Hero */}
        <section className="bg-gradient-to-br from-stone-900 via-stone-800 to-stone-900 text-white py-24 px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-4 tracking-tight">
              Shipping Information
            </h1>
            <p className="text-lg text-stone-300">
              Free shipping on every box
            </p>
          </div>
        </section>

        {/* Highlight Cards */}
        <section className="max-w-5xl mx-auto px-4 -mt-10 relative z-10">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {highlights.map((item) => (
              <div
                key={item.title}
                className="bg-white rounded-2xl shadow-lg border border-stone-100 p-6 text-center"
              >
                <div className="inline-flex items-center justify-center w-12 h-12 bg-stone-100 rounded-xl text-stone-700 mb-3">
                  {item.icon}
                </div>
                <h3 className="font-semibold text-stone-900 text-sm mb-1">
                  {item.title}
                </h3>
                <p className="text-stone-500 text-xs">{item.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Shipping Details */}
        <section className="max-w-3xl mx-auto px-4 py-16">
          <div className="space-y-12">
            {/* Delivery */}
            <div>
              <h2 className="text-2xl font-bold text-stone-900 mb-4">
                Delivery Details
              </h2>
              <div className="bg-stone-50 rounded-2xl p-6 space-y-4">
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-emerald-500 mt-0.5 shrink-0" />
                  <p className="text-stone-700 text-sm">
                    We ship via major carriers including USPS, UPS, and FedEx to
                    ensure fast and reliable delivery across the United States.
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-emerald-500 mt-0.5 shrink-0" />
                  <p className="text-stone-700 text-sm">
                    A tracking number is emailed to you as soon as your order
                    ships. You can also track your order from your dashboard.
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-emerald-500 mt-0.5 shrink-0" />
                  <p className="text-stone-700 text-sm">
                    Signature is not required for delivery. Packages will be
                    left at your door or in a safe location.
                  </p>
                </div>
              </div>
            </div>

            {/* Packaging */}
            <div>
              <div className="flex items-center gap-3 mb-4">
                <Box className="w-6 h-6 text-stone-700" />
                <h2 className="text-2xl font-bold text-stone-900">
                  Packaging
                </h2>
              </div>
              <div className="grid sm:grid-cols-3 gap-4">
                <div className="bg-stone-50 rounded-xl p-5 text-center">
                  <ThermometerSun className="w-8 h-8 text-amber-500 mx-auto mb-3" />
                  <h3 className="font-semibold text-stone-900 text-sm mb-1">
                    Shelf-Stable
                  </h3>
                  <p className="text-stone-500 text-xs">
                    No cold chain needed. Products stay fresh at room
                    temperature for up to 2 years.
                  </p>
                </div>
                <div className="bg-stone-50 rounded-xl p-5 text-center">
                  <Box className="w-8 h-8 text-stone-600 mx-auto mb-3" />
                  <h3 className="font-semibold text-stone-900 text-sm mb-1">
                    Insulated Boxes
                  </h3>
                  <p className="text-stone-500 text-xs">
                    Durable, insulated packaging protects your meals during
                    transit.
                  </p>
                </div>
                <div className="bg-stone-50 rounded-xl p-5 text-center">
                  <Leaf className="w-8 h-8 text-emerald-500 mx-auto mb-3" />
                  <h3 className="font-semibold text-stone-900 text-sm mb-1">
                    Eco-Friendly
                  </h3>
                  <p className="text-stone-500 text-xs">
                    Made with recyclable and eco-friendly materials wherever
                    possible.
                  </p>
                </div>
              </div>
            </div>

            {/* Can't Receive */}
            <div>
              <div className="flex items-center gap-3 mb-4">
                <CalendarClock className="w-6 h-6 text-stone-700" />
                <h2 className="text-2xl font-bold text-stone-900">
                  Can&apos;t Receive Your Box?
                </h2>
              </div>
              <div className="bg-stone-50 rounded-2xl p-6 space-y-4">
                <div className="flex items-start gap-3">
                  <Home className="w-5 h-5 text-stone-500 mt-0.5 shrink-0" />
                  <div>
                    <h3 className="font-medium text-stone-900 text-sm">
                      Reschedule delivery
                    </h3>
                    <p className="text-stone-500 text-xs mt-1">
                      Contact us before your shipment date and we can adjust
                      your delivery window.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CalendarClock className="w-5 h-5 text-stone-500 mt-0.5 shrink-0" />
                  <div>
                    <h3 className="font-medium text-stone-900 text-sm">
                      Hold your shipment
                    </h3>
                    <p className="text-stone-500 text-xs mt-1">
                      Subscribers can skip a month or pause their subscription
                      from the dashboard.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-stone-500 mt-0.5 shrink-0" />
                  <div>
                    <h3 className="font-medium text-stone-900 text-sm">
                      Change your address
                    </h3>
                    <p className="text-stone-500 text-xs mt-1">
                      Update your shipping address in your account settings
                      before your next billing date.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* US Only Note */}
            <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl p-5">
              <Info className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" />
              <div>
                <h3 className="font-medium text-amber-900 text-sm">
                  Shipping availability
                </h3>
                <p className="text-amber-700 text-xs mt-1">
                  We currently ship within the United States only. International
                  shipping is coming soon.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
