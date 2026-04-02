"use client";

import Link from "next/link";
import { Header, Footer } from "@/components/ui";

export default function TermsPage() {
  return (
    <>
      <Header />
      <main className="min-h-screen bg-white">
        <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
          <h1 className="text-4xl font-bold tracking-tight text-gray-900">
            Terms of Service
          </h1>
          <p className="mt-2 text-sm text-gray-500">
            Last updated: March 2026
          </p>

          <div className="mt-10 space-y-10 text-gray-700 leading-7">
            {/* Acceptance */}
            <section>
              <h2 className="text-2xl font-semibold text-gray-900">
                Acceptance of Terms
              </h2>
              <p className="mt-4">
                Welcome to Aura, operated by Inspiration AI LLC. By accessing or
                using our website at{" "}
                <Link
                  href="https://aura.com"
                  className="text-orange-600 underline hover:text-orange-700"
                >
                  aura.com
                </Link>{" "}
                and our services, you agree to be bound by these Terms of
                Service. If you do not agree to these terms, please do not use
                our services.
              </p>
            </section>

            {/* Account Registration */}
            <section>
              <h2 className="text-2xl font-semibold text-gray-900">
                Account Registration
              </h2>
              <p className="mt-4">
                To access certain features of our platform, you must create an
                account. You agree to provide accurate, current, and complete
                information during registration and to keep your account
                information updated. You are responsible for maintaining the
                confidentiality of your account credentials and for all
                activities that occur under your account.
              </p>
            </section>

            {/* Products & Pricing */}
            <section>
              <h2 className="text-2xl font-semibold text-gray-900">
                Products &amp; Pricing
              </h2>
              <p className="mt-4">
                All product descriptions, images, and specifications are
                provided for informational purposes and are subject to change
                without notice. Prices are listed in United States Dollars (USD)
                and are subject to change. We reserve the right to modify
                pricing at any time, though changes will not affect orders that
                have already been confirmed.
              </p>
              <p className="mt-4">
                We make every effort to ensure accuracy in our product listings.
                In the event of a pricing error, we reserve the right to cancel
                any orders placed at the incorrect price.
              </p>
            </section>

            {/* Orders & Payment */}
            <section>
              <h2 className="text-2xl font-semibold text-gray-900">
                Orders &amp; Payment
              </h2>
              <p className="mt-4">
                All payments are processed securely through Stripe. By placing
                an order, you represent that you are authorized to use the
                payment method provided. We reserve the right to refuse or
                cancel any order for any reason, including suspected fraud or
                unauthorized transactions.
              </p>
              <p className="mt-4">
                An order confirmation does not constitute acceptance of your
                order. Your order is accepted when we ship the products to you.
              </p>
            </section>

            {/* Subscriptions */}
            <section>
              <h2 className="text-2xl font-semibold text-gray-900">
                Subscriptions
              </h2>
              <p className="mt-4">
                Aura offers subscription-based services for recurring deliveries
                of curated food boxes. By subscribing, you authorize us to
                charge your payment method on a recurring basis at the
                applicable subscription rate.
              </p>
              <ul className="mt-4 list-disc space-y-2 pl-6">
                <li>
                  <span className="font-medium">Auto-Renewal:</span>{" "}
                  Subscriptions automatically renew at the end of each billing
                  cycle unless you cancel before the renewal date.
                </li>
                <li>
                  <span className="font-medium">Cancellation:</span> You may
                  cancel your subscription at any time through your account
                  dashboard. Cancellation takes effect at the end of the current
                  billing period. No refunds are issued for partial billing
                  periods.
                </li>
                <li>
                  <span className="font-medium">Price Changes:</span> We may
                  adjust subscription pricing with at least 30 days&apos; notice
                  before your next billing cycle.
                </li>
              </ul>
            </section>

            {/* Shipping & Delivery */}
            <section>
              <h2 className="text-2xl font-semibold text-gray-900">
                Shipping &amp; Delivery
              </h2>
              <p className="mt-4">
                We ship to addresses within the United States. Estimated
                delivery times are provided for reference and are not
                guaranteed. We are not liable for delays caused by carriers,
                weather, or other circumstances beyond our control. Risk of loss
                and title for items purchased pass to you upon delivery to the
                carrier.
              </p>
            </section>

            {/* Returns & Refunds */}
            <section>
              <h2 className="text-2xl font-semibold text-gray-900">
                Returns &amp; Refunds
              </h2>
              <p className="mt-4">
                Due to the perishable nature of our products, returns are handled
                on a case-by-case basis. If you receive damaged, defective, or
                incorrect items, please contact us within 48 hours of delivery.
                For full details, please see our{" "}
                <Link
                  href="/returns"
                  className="text-orange-600 underline hover:text-orange-700"
                >
                  Returns &amp; Refunds Policy
                </Link>
                .
              </p>
            </section>

            {/* Intellectual Property */}
            <section>
              <h2 className="text-2xl font-semibold text-gray-900">
                Intellectual Property
              </h2>
              <p className="mt-4">
                All content on our website, including text, graphics, logos,
                images, and software, is the property of Inspiration AI LLC or
                its licensors and is protected by United States and international
                intellectual property laws. You may not reproduce, distribute,
                modify, or create derivative works from any content without our
                prior written consent.
              </p>
            </section>

            {/* Limitation of Liability */}
            <section>
              <h2 className="text-2xl font-semibold text-gray-900">
                Limitation of Liability
              </h2>
              <p className="mt-4">
                To the fullest extent permitted by law, Inspiration AI LLC and
                its officers, directors, employees, and agents shall not be
                liable for any indirect, incidental, special, consequential, or
                punitive damages arising out of or related to your use of our
                services. Our total liability for any claim arising from these
                terms shall not exceed the amount you paid to us in the twelve
                (12) months preceding the claim.
              </p>
            </section>

            {/* Governing Law */}
            <section>
              <h2 className="text-2xl font-semibold text-gray-900">
                Governing Law
              </h2>
              <p className="mt-4">
                These Terms of Service shall be governed by and construed in
                accordance with the laws of the State of Texas, without regard
                to its conflict of law principles. Any disputes arising under
                these terms shall be resolved in the state or federal courts
                located in Travis County, Texas.
              </p>
            </section>

            {/* Contact */}
            <section>
              <h2 className="text-2xl font-semibold text-gray-900">
                Contact Us
              </h2>
              <p className="mt-4">
                If you have questions about these Terms of Service, please
                contact us:
              </p>
              <div className="mt-4 rounded-lg bg-gray-50 p-6">
                <p className="font-medium text-gray-900">Inspiration AI LLC</p>
                <p>Austin, Texas</p>
                <p>
                  Email:{" "}
                  <a
                    href="mailto:hello@aura.com"
                    className="text-orange-600 underline hover:text-orange-700"
                  >
                    hello@aura.com
                  </a>
                </p>
              </div>
            </section>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
