"use client";

import { useState } from "react";
import Link from "next/link";
import { Header, Footer, Button, Input, Card } from "@/components/ui";
import {
  Building2,
  User,
  Mail,
  Phone,
  MessageSquare,
  Check,
  ArrowLeft,
  Loader2,
  AlertCircle,
} from "lucide-react";

const BUSINESS_TYPES = [
  { value: "", label: "Select business type..." },
  { value: "gym", label: "Gym / Fitness Center" },
  { value: "marina", label: "Marina / Yacht Club" },
  { value: "retail", label: "Retail Store" },
  { value: "food_truck", label: "Food Truck / Cart" },
  { value: "vending", label: "Vending Machine Operator" },
  { value: "aviation", label: "Aviation / FBO" },
  { value: "corporate", label: "Corporate Wellness" },
  { value: "outdoor", label: "Outdoor / Camping Retailer" },
  { value: "hospitality", label: "Hotel / Hospitality" },
  { value: "other", label: "Other" },
];

export default function DealerApplyPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    organizationName: "",
    businessType: "",
    message: "",
  });

  const updateField = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (
      !formData.fullName ||
      !formData.email ||
      !formData.organizationName ||
      !formData.businessType
    ) {
      setError("Please fill in all required fields.");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError("Please enter a valid email address.");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/b2b/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          full_name: formData.fullName,
          email: formData.email,
          phone: formData.phone || null,
          organization_name: formData.organizationName,
          business_type: formData.businessType,
          message: formData.message || null,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to submit application.");
      }

      setIsSubmitted(true);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Something went wrong. Please try again.";
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center px-4 py-20">
          <div className="max-w-md w-full text-center">
            <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-6">
              <Check className="w-10 h-10 text-emerald-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-3">
              Application Received!
            </h1>
            <p className="text-gray-600 mb-2">
              Thank you for your interest in partnering with Aura, <strong>{formData.fullName}</strong>.
            </p>
            <p className="text-gray-500 text-sm mb-8">
              Our partnerships team will review your application and get back to you within <strong>48 hours</strong>.
              Check your email at <strong>{formData.email}</strong> for updates.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link href="/b2b">
                <Button variant="primary">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to B2B
                </Button>
              </Link>
              <Link href="/">
                <Button variant="outline">Browse Products</Button>
              </Link>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 py-12 px-4">
        <div className="max-w-2xl mx-auto">
          {/* Back Link */}
          <Link
            href="/b2b"
            className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 mb-6 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back to B2B Program
          </Link>

          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Apply to Become a Dealer
            </h1>
            <p className="text-gray-600">
              Join our network of premium food distributors. Fill out the form below and
              our team will review your application.
            </p>
          </div>

          {/* Application Form */}
          <Card padding="lg" className="border border-gray-200 shadow-sm">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Personal Info */}
              <div>
                <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-4">
                  Contact Information
                </h2>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <Input
                      label="Full Name *"
                      value={formData.fullName}
                      onChange={(e) => updateField("fullName", e.target.value)}
                      placeholder="John Smith"
                      leftIcon={<User className="w-4 h-4" />}
                      required
                    />
                  </div>
                  <Input
                    label="Email Address *"
                    type="email"
                    value={formData.email}
                    onChange={(e) => updateField("email", e.target.value)}
                    placeholder="john@company.com"
                    leftIcon={<Mail className="w-4 h-4" />}
                    required
                  />
                  <Input
                    label="Phone Number"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => updateField("phone", e.target.value)}
                    placeholder="(555) 123-4567"
                    leftIcon={<Phone className="w-4 h-4" />}
                  />
                </div>
              </div>

              {/* Business Info */}
              <div>
                <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-4">
                  Business Information
                </h2>
                <div className="grid sm:grid-cols-2 gap-4">
                  <Input
                    label="Organization Name *"
                    value={formData.organizationName}
                    onChange={(e) => updateField("organizationName", e.target.value)}
                    placeholder="Acme Fitness LLC"
                    leftIcon={<Building2 className="w-4 h-4" />}
                    required
                  />
                  <div className="w-full">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Business Type *
                    </label>
                    <div className="relative">
                      <select
                        value={formData.businessType}
                        onChange={(e) => updateField("businessType", e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg transition-all duration-200 focus:ring-2 focus:ring-aura-primary focus:border-transparent outline-none appearance-none bg-white hover:border-gray-400"
                        required
                        aria-label="Business type"
                      >
                        {BUSINESS_TYPES.map((type) => (
                          <option key={type.value} value={type.value}>
                            {type.label}
                          </option>
                        ))}
                      </select>
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Message */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tell us about your business
                </label>
                <div className="relative">
                  <div className="absolute left-3 top-3 text-gray-400">
                    <MessageSquare className="w-4 h-4" />
                  </div>
                  <textarea
                    value={formData.message}
                    onChange={(e) => updateField("message", e.target.value)}
                    rows={4}
                    placeholder="Describe your business, current distribution channels, expected volume, and anything else you'd like us to know..."
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg transition-all duration-200 focus:ring-2 focus:ring-aura-primary focus:border-transparent outline-none resize-none hover:border-gray-400 placeholder:text-gray-400"
                  />
                </div>
              </div>

              {error && (
                <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 px-4 py-3 rounded-lg">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  {error}
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  className="flex-1"
                  isLoading={isSubmitting}
                >
                  Submit Application
                </Button>
              </div>

              <p className="text-xs text-gray-400 text-center">
                By submitting, you agree to be contacted by Aura&apos;s partnerships team
                regarding your application.
              </p>
            </form>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  );
}
