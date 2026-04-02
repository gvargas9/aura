"use client";

import { useState } from "react";
import Link from "next/link";
import { Header, Footer } from "@/components/ui";
import {
  Mail,
  Phone,
  MapPin,
  Clock,
  Send,
  Building2,
  ArrowRight,
} from "lucide-react";

const contactInfo = [
  {
    icon: <Mail className="w-6 h-6" />,
    title: "Email",
    value: "hello@aura.com",
    href: "mailto:hello@aura.com",
  },
  {
    icon: <Phone className="w-6 h-6" />,
    title: "Phone",
    value: "1-800-AURA-NOW",
    href: "tel:1-800-AURA-NOW",
  },
  {
    icon: <MapPin className="w-6 h-6" />,
    title: "Address",
    value: "Austin, Texas",
    href: null,
  },
];

const subjectOptions = [
  "General Inquiry",
  "Order Issue",
  "Partnership",
  "Press",
];

export default function ContactPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");

  return (
    <>
      <Header />
      <main className="min-h-screen bg-white">
        {/* Hero */}
        <section className="bg-gradient-to-br from-stone-900 via-stone-800 to-stone-900 text-white py-24 px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-4 tracking-tight">
              Contact Us
            </h1>
            <p className="text-lg text-stone-300">
              We&apos;d love to hear from you
            </p>
          </div>
        </section>

        {/* Contact Info Cards */}
        <section className="max-w-4xl mx-auto px-4 -mt-10 relative z-10">
          <div className="grid sm:grid-cols-3 gap-4">
            {contactInfo.map((info) => (
              <div
                key={info.title}
                className="bg-white rounded-2xl shadow-lg border border-stone-100 p-6 text-center"
              >
                <div className="inline-flex items-center justify-center w-12 h-12 bg-stone-100 rounded-xl text-stone-700 mb-3">
                  {info.icon}
                </div>
                <h3 className="font-semibold text-stone-900 mb-1">
                  {info.title}
                </h3>
                {info.href ? (
                  <a
                    href={info.href}
                    className="text-stone-600 hover:text-stone-900 transition text-sm"
                  >
                    {info.value}
                  </a>
                ) : (
                  <p className="text-stone-600 text-sm">{info.value}</p>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* Form + Hours */}
        <section className="max-w-4xl mx-auto px-4 py-16">
          <div className="grid md:grid-cols-3 gap-12">
            {/* Contact Form */}
            <div className="md:col-span-2">
              <h2 className="text-2xl font-bold text-stone-900 mb-6">
                Send us a message
              </h2>
              <form className="space-y-5">
                <div>
                  <label
                    htmlFor="contact-name"
                    className="block text-sm font-medium text-stone-700 mb-1"
                  >
                    Name
                  </label>
                  <input
                    id="contact-name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your name"
                    className="w-full px-4 py-3 rounded-xl border border-stone-200 text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-stone-300 focus:border-transparent"
                  />
                </div>
                <div>
                  <label
                    htmlFor="contact-email"
                    className="block text-sm font-medium text-stone-700 mb-1"
                  >
                    Email
                  </label>
                  <input
                    id="contact-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full px-4 py-3 rounded-xl border border-stone-200 text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-stone-300 focus:border-transparent"
                  />
                </div>
                <div>
                  <label
                    htmlFor="contact-subject"
                    className="block text-sm font-medium text-stone-700 mb-1"
                  >
                    Subject
                  </label>
                  <select
                    id="contact-subject"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-stone-200 text-stone-900 focus:outline-none focus:ring-2 focus:ring-stone-300 focus:border-transparent appearance-none bg-white"
                    aria-label="Subject"
                  >
                    <option value="" disabled>
                      Select a subject
                    </option>
                    {subjectOptions.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label
                    htmlFor="contact-message"
                    className="block text-sm font-medium text-stone-700 mb-1"
                  >
                    Message
                  </label>
                  <textarea
                    id="contact-message"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="How can we help?"
                    rows={5}
                    className="w-full px-4 py-3 rounded-xl border border-stone-200 text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-stone-300 focus:border-transparent resize-none"
                  />
                </div>
                <button
                  type="button"
                  className="inline-flex items-center gap-2 bg-stone-900 text-white font-semibold px-8 py-3 rounded-xl hover:bg-stone-800 transition"
                >
                  <Send className="w-4 h-4" />
                  Send Message
                </button>
              </form>
            </div>

            {/* Sidebar */}
            <div className="space-y-8">
              {/* Business Hours */}
              <div className="bg-stone-50 rounded-2xl p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Clock className="w-5 h-5 text-stone-600" />
                  <h3 className="font-semibold text-stone-900">
                    Business Hours
                  </h3>
                </div>
                <div className="space-y-2 text-sm text-stone-600">
                  <div className="flex justify-between">
                    <span>Monday - Friday</span>
                    <span className="font-medium text-stone-900">
                      9am - 6pm CT
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Saturday - Sunday</span>
                    <span className="text-stone-400">Closed</span>
                  </div>
                </div>
              </div>

              {/* B2B CTA */}
              <div className="bg-stone-900 rounded-2xl p-6 text-white">
                <Building2 className="w-8 h-8 mb-3 text-stone-400" />
                <h3 className="font-semibold mb-2">For B2B Inquiries</h3>
                <p className="text-sm text-stone-400 mb-4">
                  Interested in wholesale, dealer programs, or partnerships?
                </p>
                <Link
                  href="/b2b"
                  className="inline-flex items-center gap-1 text-sm font-medium text-white hover:text-stone-300 transition"
                >
                  Learn more
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
