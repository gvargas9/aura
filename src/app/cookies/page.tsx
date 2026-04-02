"use client";

import Link from "next/link";
import { Header, Footer } from "@/components/ui";

export default function CookiesPage() {
  return (
    <>
      <Header />
      <main className="min-h-screen bg-white">
        <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
          <h1 className="text-4xl font-bold tracking-tight text-gray-900">
            Cookie Policy
          </h1>
          <p className="mt-2 text-sm text-gray-500">
            Last updated: March 2026
          </p>

          <div className="mt-10 space-y-10 text-gray-700 leading-7">
            {/* Introduction */}
            <section>
              <p>
                Aura, operated by Inspiration AI LLC, uses cookies and similar
                tracking technologies on our website at{" "}
                <Link
                  href="https://aura.com"
                  className="text-orange-600 underline hover:text-orange-700"
                >
                  aura.com
                </Link>
                . This Cookie Policy explains what cookies are, how we use them,
                and how you can manage your preferences.
              </p>
            </section>

            {/* What Are Cookies */}
            <section>
              <h2 className="text-2xl font-semibold text-gray-900">
                What Are Cookies
              </h2>
              <p className="mt-4">
                Cookies are small text files that are placed on your device when
                you visit a website. They are widely used to make websites work
                more efficiently, provide a better user experience, and supply
                information to website operators. Cookies can be
                &quot;persistent&quot; (remaining on your device until they
                expire or you delete them) or &quot;session&quot; (deleted when
                you close your browser).
              </p>
            </section>

            {/* Cookies We Use */}
            <section>
              <h2 className="text-2xl font-semibold text-gray-900">
                Cookies We Use
              </h2>

              <div className="mt-6 space-y-6">
                <div className="rounded-lg border border-gray-200 p-5">
                  <h3 className="text-lg font-medium text-gray-900">
                    Essential Cookies
                  </h3>
                  <p className="mt-2">
                    These cookies are strictly necessary for the website to
                    function. They enable core features such as session
                    management, authentication, and security. Without these
                    cookies, services you have requested cannot be provided.
                  </p>
                  <ul className="mt-3 list-disc space-y-1 pl-6 text-sm">
                    <li>Session identification and management</li>
                    <li>User authentication and login state</li>
                    <li>Shopping cart and checkout functionality</li>
                    <li>Security and fraud prevention</li>
                  </ul>
                </div>

                <div className="rounded-lg border border-gray-200 p-5">
                  <h3 className="text-lg font-medium text-gray-900">
                    Functional Cookies
                  </h3>
                  <p className="mt-2">
                    These cookies allow us to remember choices you make and
                    provide enhanced, personalized features. They may be set by
                    us or by third-party providers whose services we use.
                  </p>
                  <ul className="mt-3 list-disc space-y-1 pl-6 text-sm">
                    <li>Language and locale preferences</li>
                    <li>Currency display settings</li>
                    <li>Dietary preference filters</li>
                    <li>Theme and display preferences</li>
                  </ul>
                </div>

                <div className="rounded-lg border border-gray-200 p-5">
                  <h3 className="text-lg font-medium text-gray-900">
                    Analytics Cookies
                  </h3>
                  <p className="mt-2">
                    These cookies help us understand how visitors interact with
                    our website by collecting and reporting information
                    anonymously. This helps us improve our website and services.
                  </p>
                  <ul className="mt-3 list-disc space-y-1 pl-6 text-sm">
                    <li>Page views and navigation patterns</li>
                    <li>Feature usage and engagement metrics</li>
                    <li>Performance and error monitoring</li>
                  </ul>
                </div>

                <div className="rounded-lg border border-gray-200 p-5">
                  <h3 className="text-lg font-medium text-gray-900">
                    Marketing Cookies
                  </h3>
                  <p className="mt-2">
                    These cookies may be used to deliver relevant advertisements
                    and track the effectiveness of our marketing campaigns. We
                    use these sparingly and only when necessary.
                  </p>
                  <ul className="mt-3 list-disc space-y-1 pl-6 text-sm">
                    <li>Referral and campaign attribution</li>
                    <li>Ad performance measurement</li>
                  </ul>
                </div>
              </div>
            </section>

            {/* Third-Party Cookies */}
            <section>
              <h2 className="text-2xl font-semibold text-gray-900">
                Third-Party Cookies
              </h2>
              <p className="mt-4">
                Some cookies on our website are set by third-party services that
                we use. These providers have their own privacy policies governing
                the use of cookies:
              </p>
              <ul className="mt-4 list-disc space-y-2 pl-6">
                <li>
                  <span className="font-medium">Stripe:</span> Used for secure
                  payment processing. Stripe may set cookies to detect fraud and
                  process transactions.
                </li>
                <li>
                  <span className="font-medium">Supabase:</span> Used for
                  authentication and session management. Supabase sets cookies to
                  maintain your login state securely.
                </li>
                <li>
                  <span className="font-medium">Google Analytics:</span> Used to
                  collect anonymized usage data to help us understand how our
                  website is used and improve our services.
                </li>
              </ul>
            </section>

            {/* Managing Cookies */}
            <section>
              <h2 className="text-2xl font-semibold text-gray-900">
                Managing Cookies
              </h2>
              <p className="mt-4">
                Most web browsers allow you to control cookies through their
                settings. You can typically find these options in
                your browser&apos;s &quot;Settings,&quot;
                &quot;Preferences,&quot; or &quot;Privacy&quot; menu. You can
                choose to:
              </p>
              <ul className="mt-4 list-disc space-y-2 pl-6">
                <li>View what cookies are stored on your device</li>
                <li>Delete all or specific cookies</li>
                <li>Block all cookies or only third-party cookies</li>
                <li>
                  Set your browser to notify you when a cookie is being set
                </li>
              </ul>
              <p className="mt-4">
                Please note that blocking or deleting essential cookies may
                impair the functionality of our website. Some features, such as
                logging in or completing a purchase, require cookies to function
                properly.
              </p>
            </section>

            {/* Contact */}
            <section>
              <h2 className="text-2xl font-semibold text-gray-900">
                Contact Us
              </h2>
              <p className="mt-4">
                If you have questions about our use of cookies, please contact
                us:
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
