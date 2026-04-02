"use client";

import Link from "next/link";
import { Header, Footer } from "@/components/ui";

export default function PrivacyPage() {
  return (
    <>
      <Header />
      <main className="min-h-screen bg-white">
        <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
          <h1 className="text-4xl font-bold tracking-tight text-gray-900">
            Privacy Policy
          </h1>
          <p className="mt-2 text-sm text-gray-500">
            Last updated: March 2026
          </p>

          <div className="mt-10 space-y-10 text-gray-700 leading-7">
            {/* Introduction */}
            <section>
              <p>
                Aura, operated by Inspiration AI LLC (&quot;we,&quot;
                &quot;us,&quot; or &quot;our&quot;), is committed to protecting
                your privacy. This Privacy Policy explains how we collect, use,
                disclose, and safeguard your information when you visit our
                website at{" "}
                <Link
                  href="https://aura.com"
                  className="text-orange-600 underline hover:text-orange-700"
                >
                  aura.com
                </Link>{" "}
                and use our services. Please read this policy carefully. By
                using our services, you consent to the practices described
                herein.
              </p>
            </section>

            {/* Information We Collect */}
            <section>
              <h2 className="text-2xl font-semibold text-gray-900">
                Information We Collect
              </h2>
              <div className="mt-4 space-y-4">
                <div>
                  <h3 className="text-lg font-medium text-gray-900">
                    Personal Information
                  </h3>
                  <p className="mt-1">
                    When you create an account, place an order, or contact us,
                    we may collect your name, email address, phone number,
                    shipping and billing address, payment information, and
                    dietary preferences.
                  </p>
                </div>
                <div>
                  <h3 className="text-lg font-medium text-gray-900">
                    Usage Data
                  </h3>
                  <p className="mt-1">
                    We automatically collect information about how you interact
                    with our website, including your IP address, browser type,
                    device information, pages visited, time spent on pages, and
                    referring URLs.
                  </p>
                </div>
                <div>
                  <h3 className="text-lg font-medium text-gray-900">
                    Cookies and Tracking Technologies
                  </h3>
                  <p className="mt-1">
                    We use cookies and similar technologies to enhance your
                    experience, analyze usage patterns, and deliver personalized
                    content. For more details, please see our{" "}
                    <Link
                      href="/cookies"
                      className="text-orange-600 underline hover:text-orange-700"
                    >
                      Cookie Policy
                    </Link>
                    .
                  </p>
                </div>
              </div>
            </section>

            {/* How We Use Information */}
            <section>
              <h2 className="text-2xl font-semibold text-gray-900">
                How We Use Your Information
              </h2>
              <ul className="mt-4 list-disc space-y-2 pl-6">
                <li>
                  <span className="font-medium">Order Processing:</span>{" "}
                  Fulfilling orders, processing payments, and managing
                  subscriptions.
                </li>
                <li>
                  <span className="font-medium">Communication:</span> Sending
                  order confirmations, shipping updates, subscription reminders,
                  and responding to inquiries.
                </li>
                <li>
                  <span className="font-medium">Personalization:</span>{" "}
                  Tailoring product recommendations based on your dietary
                  preferences and purchase history.
                </li>
                <li>
                  <span className="font-medium">Improvement:</span> Analyzing
                  usage data to improve our website, products, and services.
                </li>
                <li>
                  <span className="font-medium">Legal Compliance:</span>{" "}
                  Meeting our legal obligations and enforcing our terms.
                </li>
              </ul>
            </section>

            {/* Information Sharing */}
            <section>
              <h2 className="text-2xl font-semibold text-gray-900">
                Information Sharing
              </h2>
              <p className="mt-4">
                We do not sell, trade, or rent your personal information to third
                parties. We may share your information in the following
                circumstances:
              </p>
              <ul className="mt-4 list-disc space-y-2 pl-6">
                <li>
                  <span className="font-medium">Service Providers:</span> With
                  trusted third-party providers who assist us in operating our
                  platform, processing payments (Stripe), delivering orders, and
                  analyzing usage data.
                </li>
                <li>
                  <span className="font-medium">Legal Requirements:</span> When
                  required by law, regulation, legal process, or governmental
                  request.
                </li>
                <li>
                  <span className="font-medium">Business Transfers:</span> In
                  connection with a merger, acquisition, or sale of assets, your
                  information may be transferred as part of that transaction.
                </li>
              </ul>
            </section>

            {/* Data Security */}
            <section>
              <h2 className="text-2xl font-semibold text-gray-900">
                Data Security
              </h2>
              <p className="mt-4">
                We implement industry-standard security measures to protect your
                personal information, including encryption in transit (TLS/SSL),
                secure payment processing through Stripe, and access controls on
                our systems. However, no method of transmission over the
                internet or electronic storage is completely secure, and we
                cannot guarantee absolute security.
              </p>
            </section>

            {/* Your Rights */}
            <section>
              <h2 className="text-2xl font-semibold text-gray-900">
                Your Rights
              </h2>
              <p className="mt-4">
                Depending on your location, you may have the following rights
                regarding your personal information:
              </p>
              <ul className="mt-4 list-disc space-y-2 pl-6">
                <li>
                  <span className="font-medium">Access:</span> Request a copy of
                  the personal information we hold about you.
                </li>
                <li>
                  <span className="font-medium">Correction:</span> Request that
                  we correct inaccurate or incomplete information.
                </li>
                <li>
                  <span className="font-medium">Deletion:</span> Request that we
                  delete your personal information, subject to legal retention
                  requirements.
                </li>
                <li>
                  <span className="font-medium">Opt-Out:</span> Unsubscribe from
                  marketing communications at any time using the link in our
                  emails or by contacting us.
                </li>
              </ul>
              <p className="mt-4">
                To exercise any of these rights, please contact us at{" "}
                <a
                  href="mailto:hello@aura.com"
                  className="text-orange-600 underline hover:text-orange-700"
                >
                  hello@aura.com
                </a>
                .
              </p>
            </section>

            {/* Children's Privacy */}
            <section>
              <h2 className="text-2xl font-semibold text-gray-900">
                Children&apos;s Privacy
              </h2>
              <p className="mt-4">
                Our services are not directed at individuals under the age of 13.
                We do not knowingly collect personal information from children
                under 13. If we become aware that we have collected personal
                information from a child under 13, we will take steps to delete
                that information promptly.
              </p>
            </section>

            {/* Changes to Policy */}
            <section>
              <h2 className="text-2xl font-semibold text-gray-900">
                Changes to This Policy
              </h2>
              <p className="mt-4">
                We may update this Privacy Policy from time to time. When we do,
                we will revise the &quot;Last updated&quot; date at the top of
                this page. We encourage you to review this policy periodically.
                Your continued use of our services after any changes constitutes
                acceptance of the updated policy.
              </p>
            </section>

            {/* Contact */}
            <section>
              <h2 className="text-2xl font-semibold text-gray-900">
                Contact Us
              </h2>
              <p className="mt-4">
                If you have questions or concerns about this Privacy Policy,
                please contact us:
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
