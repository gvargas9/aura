"use client";

import Link from "next/link";
import { Header, Footer } from "@/components/ui";

export default function AccessibilityPage() {
  return (
    <>
      <Header />
      <main className="min-h-screen bg-white">
        <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
          <h1 className="text-4xl font-bold tracking-tight text-gray-900">
            Accessibility Statement
          </h1>
          <p className="mt-2 text-sm text-gray-500">
            Last updated: March 2026
          </p>

          <div className="mt-10 space-y-10 text-gray-700 leading-7">
            {/* Commitment */}
            <section>
              <h2 className="text-2xl font-semibold text-gray-900">
                Our Commitment
              </h2>
              <p className="mt-4">
                At Aura, operated by Inspiration AI LLC, we are committed to
                ensuring digital accessibility for people of all abilities. We
                believe that everyone deserves equal access to our products,
                services, and information. We continually work to improve the
                accessibility of our website at{" "}
                <Link
                  href="https://aura.com"
                  className="text-orange-600 underline hover:text-orange-700"
                >
                  aura.com
                </Link>{" "}
                to provide an inclusive experience for all users.
              </p>
            </section>

            {/* Standards */}
            <section>
              <h2 className="text-2xl font-semibold text-gray-900">
                Conformance Standards
              </h2>
              <p className="mt-4">
                We aim to conform to the Web Content Accessibility Guidelines
                (WCAG) 2.1 at Level AA. These guidelines are developed by the
                World Wide Web Consortium (W3C) and provide a framework for
                making web content more accessible to people with disabilities,
                including visual, auditory, motor, and cognitive impairments.
              </p>
              <p className="mt-4">
                While WCAG 2.1 Level AA is our target, we recognize
                accessibility is an ongoing effort and we are continuously
                working toward full conformance.
              </p>
            </section>

            {/* Features */}
            <section>
              <h2 className="text-2xl font-semibold text-gray-900">
                Accessibility Features
              </h2>
              <p className="mt-4">
                We have implemented the following features to support
                accessibility:
              </p>
              <ul className="mt-4 list-disc space-y-3 pl-6">
                <li>
                  <span className="font-medium">Keyboard Navigation:</span> All
                  interactive elements on our website can be accessed and
                  operated using a keyboard alone, without requiring a mouse.
                </li>
                <li>
                  <span className="font-medium">Screen Reader Support:</span>{" "}
                  Our pages use semantic HTML, ARIA labels, and landmark roles
                  to ensure compatibility with assistive technologies such as
                  screen readers.
                </li>
                <li>
                  <span className="font-medium">Color Contrast:</span> We
                  maintain sufficient color contrast ratios between text and
                  background colors to ensure readability for users with low
                  vision or color vision deficiencies.
                </li>
                <li>
                  <span className="font-medium">Alternative Text:</span> Images
                  on our website include descriptive alternative text to convey
                  information to users who cannot see them.
                </li>
                <li>
                  <span className="font-medium">Responsive Design:</span> Our
                  website is designed to work across a range of devices and
                  screen sizes, supporting users who rely on zoom or use mobile
                  assistive features.
                </li>
                <li>
                  <span className="font-medium">Focus Indicators:</span>{" "}
                  Visible focus indicators are provided for interactive elements
                  to help keyboard users track their position on the page.
                </li>
                <li>
                  <span className="font-medium">Form Labels:</span> All form
                  fields include descriptive labels and clear error messaging to
                  assist users in completing forms accurately.
                </li>
              </ul>
            </section>

            {/* Known Limitations */}
            <section>
              <h2 className="text-2xl font-semibold text-gray-900">
                Known Limitations
              </h2>
              <p className="mt-4">
                Despite our best efforts, some areas of our website may not yet
                be fully accessible. Known limitations include:
              </p>
              <ul className="mt-4 list-disc space-y-2 pl-6">
                <li>
                  Some older product images may lack descriptive alternative
                  text. We are working to update these.
                </li>
                <li>
                  Certain third-party integrations (such as payment processing
                  forms) may have accessibility limitations outside our direct
                  control.
                </li>
                <li>
                  Some dynamically generated content may not be immediately
                  announced to screen readers.
                </li>
              </ul>
              <p className="mt-4">
                We are actively working to address these limitations and improve
                accessibility across our entire platform.
              </p>
            </section>

            {/* Feedback */}
            <section>
              <h2 className="text-2xl font-semibold text-gray-900">
                Feedback &amp; Assistance
              </h2>
              <p className="mt-4">
                We welcome your feedback on the accessibility of our website. If
                you encounter any barriers or have suggestions for improvement,
                please contact us. We take all feedback seriously and will work
                to address your concerns promptly.
              </p>
              <p className="mt-4">
                When reporting an accessibility issue, please include:
              </p>
              <ul className="mt-4 list-disc space-y-2 pl-6">
                <li>A description of the issue you encountered</li>
                <li>The page URL where the issue occurred</li>
                <li>
                  The assistive technology you were using (if applicable)
                </li>
                <li>Your preferred method of contact for our response</li>
              </ul>
              <div className="mt-6 rounded-lg bg-gray-50 p-6">
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
              <p className="mt-4">
                We aim to respond to accessibility feedback within 5 business
                days.
              </p>
            </section>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
