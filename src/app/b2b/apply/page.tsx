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
  ArrowRight,
  Loader2,
  AlertCircle,
  Dumbbell,
  Ship,
  Truck,
  Monitor,
  Store,
  Plane,
  Coffee,
  Trees,
  Hotel,
  HelpCircle,
  Upload,
  Globe,
  FileText,
  CheckCircle2,
  Circle,
  Clock,
} from "lucide-react";

const BUSINESS_TYPES = [
  { value: "gym", label: "Gym / Fitness Center", icon: Dumbbell, color: "text-blue-600 bg-blue-50 border-blue-200" },
  { value: "marina", label: "Marina / Yacht Club", icon: Ship, color: "text-cyan-600 bg-cyan-50 border-cyan-200" },
  { value: "retail", label: "Retail Store", icon: Store, color: "text-emerald-600 bg-emerald-50 border-emerald-200" },
  { value: "food_truck", label: "Food Truck / Cart", icon: Truck, color: "text-orange-600 bg-orange-50 border-orange-200" },
  { value: "vending", label: "Vending Operator", icon: Monitor, color: "text-purple-600 bg-purple-50 border-purple-200" },
  { value: "aviation", label: "Aviation / FBO", icon: Plane, color: "text-sky-600 bg-sky-50 border-sky-200" },
  { value: "corporate", label: "Corporate Wellness", icon: Coffee, color: "text-amber-600 bg-amber-50 border-amber-200" },
  { value: "outdoor", label: "Outdoor / Camping", icon: Trees, color: "text-green-600 bg-green-50 border-green-200" },
  { value: "hospitality", label: "Hotel / Hospitality", icon: Hotel, color: "text-rose-600 bg-rose-50 border-rose-200" },
  { value: "other", label: "Other", icon: HelpCircle, color: "text-slate-600 bg-slate-50 border-slate-200" },
];

const VOLUME_OPTIONS = [
  { value: "under_100", label: "Under 100 units/month" },
  { value: "100_500", label: "100-500 units/month" },
  { value: "500_2000", label: "500-2,000 units/month" },
  { value: "2000_5000", label: "2,000-5,000 units/month" },
  { value: "5000_plus", label: "5,000+ units/month" },
];

const STEPS = [
  { id: 1, label: "Contact" },
  { id: 2, label: "Business" },
  { id: 3, label: "Use Case" },
  { id: 4, label: "Review" },
];

const APPLICATION_STEPS = [
  { key: "submitted", label: "Application Submitted", description: "We received your application" },
  { key: "under_review", label: "Under Review", description: "Our team is reviewing your details" },
  { key: "approved", label: "Approved", description: "Welcome to the Aura partner program" },
];

export default function DealerApplyPage() {
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    organizationName: "",
    businessType: "",
    website: "",
    taxId: "",
    expectedVolume: "",
    locations: "1",
    useCase: "",
    message: "",
    hasBusinessLicense: false,
    licenseFile: null as File | null,
  });

  const updateField = (field: string, value: string | boolean | File | null) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return formData.fullName && formData.email && formData.organizationName;
      case 2:
        return formData.businessType;
      case 3:
        return true;
      case 4:
        return true;
      default:
        return false;
    }
  };

  const handleNext = () => {
    setError("");
    if (currentStep === 1) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) {
        setError("Please enter a valid email address.");
        return;
      }
    }
    if (canProceed() && currentStep < 4) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      setError("");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!formData.fullName || !formData.email || !formData.organizationName || !formData.businessType) {
      setError("Please fill in all required fields.");
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
          website_url: formData.website || null,
          tax_id: formData.taxId || null,
          expected_volume: formData.expectedVolume || null,
          locations_count: formData.locations,
          use_case: formData.useCase || null,
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
        err instanceof Error
          ? err.message
          : "Something went wrong. Please try again.";
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // After submission: show tracking page
  if (isSubmitted) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 py-16 px-4">
          <div className="max-w-xl mx-auto">
            {/* Success header */}
            <div className="text-center mb-10">
              <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
                <Check className="w-8 h-8 text-emerald-600" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                Application Received!
              </h1>
              <p className="text-gray-600">
                Thank you, <strong>{formData.fullName}</strong>. Our partnerships
                team will review your application within{" "}
                <strong>48 hours</strong>.
              </p>
              <p className="text-sm text-gray-500 mt-2">
                Check <strong>{formData.email}</strong> for updates.
              </p>
            </div>

            {/* Application Tracking */}
            <Card padding="lg" className="border border-gray-200 shadow-sm mb-8">
              <h2 className="text-lg font-semibold text-gray-900 mb-6">
                Application Status
              </h2>
              <div className="space-y-0">
                {APPLICATION_STEPS.map((step, idx) => {
                  const isCompleted = idx === 0; // Only first step completed
                  const isCurrent = idx === 1; // Under review is current
                  return (
                    <div key={step.key} className="flex gap-4">
                      {/* Timeline line */}
                      <div className="flex flex-col items-center">
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                            isCompleted
                              ? "bg-emerald-100 text-emerald-600"
                              : isCurrent
                                ? "bg-blue-100 text-blue-600 ring-2 ring-blue-200"
                                : "bg-slate-100 text-slate-400"
                          }`}
                        >
                          {isCompleted ? (
                            <CheckCircle2 className="w-5 h-5" />
                          ) : isCurrent ? (
                            <Clock className="w-5 h-5" />
                          ) : (
                            <Circle className="w-5 h-5" />
                          )}
                        </div>
                        {idx < APPLICATION_STEPS.length - 1 && (
                          <div
                            className={`w-0.5 h-12 ${
                              isCompleted ? "bg-emerald-300" : "bg-slate-200"
                            }`}
                          />
                        )}
                      </div>
                      {/* Step content */}
                      <div className="pb-8">
                        <p
                          className={`text-sm font-semibold ${
                            isCompleted
                              ? "text-emerald-700"
                              : isCurrent
                                ? "text-blue-700"
                                : "text-slate-400"
                          }`}
                        >
                          {step.label}
                        </p>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {step.description}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>

            {/* Summary of what they submitted */}
            <Card padding="lg" className="border border-gray-200 shadow-sm mb-8">
              <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-3">
                Application Summary
              </h3>
              <dl className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <dt className="text-slate-500">Organization</dt>
                  <dd className="text-slate-900 font-medium">{formData.organizationName}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-slate-500">Business Type</dt>
                  <dd className="text-slate-900 font-medium capitalize">
                    {formData.businessType.replace("_", " ")}
                  </dd>
                </div>
                {formData.expectedVolume && (
                  <div className="flex justify-between">
                    <dt className="text-slate-500">Expected Volume</dt>
                    <dd className="text-slate-900 font-medium">
                      {VOLUME_OPTIONS.find((v) => v.value === formData.expectedVolume)?.label}
                    </dd>
                  </div>
                )}
                <div className="flex justify-between">
                  <dt className="text-slate-500">Contact</dt>
                  <dd className="text-slate-900 font-medium">{formData.email}</dd>
                </div>
              </dl>
            </Card>

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
              Join our network of premium food distributors. Complete the form
              below and our team will review your application.
            </p>
          </div>

          {/* Progress Steps */}
          <div className="flex items-center justify-between mb-8">
            {STEPS.map((step, idx) => {
              const isCompleted = currentStep > step.id;
              const isCurrent = currentStep === step.id;
              return (
                <div key={step.id} className="flex items-center flex-1">
                  <div className="flex flex-col items-center">
                    <div
                      className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                        isCompleted
                          ? "bg-blue-600 text-white"
                          : isCurrent
                            ? "bg-blue-600 text-white ring-4 ring-blue-100"
                            : "bg-slate-200 text-slate-500"
                      }`}
                    >
                      {isCompleted ? (
                        <Check className="w-4 h-4" />
                      ) : (
                        step.id
                      )}
                    </div>
                    <span
                      className={`text-xs mt-1.5 font-medium ${
                        isCurrent || isCompleted
                          ? "text-blue-700"
                          : "text-slate-400"
                      }`}
                    >
                      {step.label}
                    </span>
                  </div>
                  {idx < STEPS.length - 1 && (
                    <div
                      className={`flex-1 h-0.5 mx-2 rounded ${
                        isCompleted ? "bg-blue-600" : "bg-slate-200"
                      }`}
                    />
                  )}
                </div>
              );
            })}
          </div>

          {/* Application Form */}
          <Card padding="lg" className="border border-gray-200 shadow-sm">
            <form onSubmit={handleSubmit}>
              {/* Step 1: Contact Information */}
              {currentStep === 1 && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900 mb-1">
                      Contact Information
                    </h2>
                    <p className="text-sm text-gray-500">
                      Tell us how to reach you.
                    </p>
                  </div>
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
                    <div className="sm:col-span-2">
                      <Input
                        label="Organization Name *"
                        value={formData.organizationName}
                        onChange={(e) =>
                          updateField("organizationName", e.target.value)
                        }
                        placeholder="Acme Fitness LLC"
                        leftIcon={<Building2 className="w-4 h-4" />}
                        required
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Step 2: Business Information */}
              {currentStep === 2 && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900 mb-1">
                      Business Information
                    </h2>
                    <p className="text-sm text-gray-500">
                      Help us understand your business.
                    </p>
                  </div>

                  {/* Business Type with Icons */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      Business Type *
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {BUSINESS_TYPES.map((type) => {
                        const isSelected = formData.businessType === type.value;
                        const TypeIcon = type.icon;
                        return (
                          <button
                            key={type.value}
                            type="button"
                            onClick={() => updateField("businessType", type.value)}
                            className={`flex items-center gap-2.5 p-3 rounded-lg border-2 transition-all text-left ${
                              isSelected
                                ? "border-blue-600 bg-blue-50"
                                : "border-slate-200 hover:border-slate-300 bg-white"
                            }`}
                          >
                            <div
                              className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${type.color}`}
                            >
                              <TypeIcon className="w-4 h-4" />
                            </div>
                            <span
                              className={`text-sm font-medium ${
                                isSelected
                                  ? "text-blue-700"
                                  : "text-slate-700"
                              }`}
                            >
                              {type.label}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-4">
                    <Input
                      label="Website"
                      value={formData.website}
                      onChange={(e) => updateField("website", e.target.value)}
                      placeholder="https://yoursite.com"
                      leftIcon={<Globe className="w-4 h-4" />}
                    />
                    <Input
                      label="Tax ID / EIN"
                      value={formData.taxId}
                      onChange={(e) => updateField("taxId", e.target.value)}
                      placeholder="XX-XXXXXXX"
                      leftIcon={<FileText className="w-4 h-4" />}
                    />
                  </div>
                </div>
              )}

              {/* Step 3: Use Case */}
              {currentStep === 3 && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900 mb-1">
                      Your Use Case
                    </h2>
                    <p className="text-sm text-gray-500">
                      Tell us how you plan to distribute Aura products.
                    </p>
                  </div>

                  {/* Expected Volume */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Expected Monthly Volume
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {VOLUME_OPTIONS.map((option) => {
                        const isSelected = formData.expectedVolume === option.value;
                        return (
                          <button
                            key={option.value}
                            type="button"
                            onClick={() =>
                              updateField("expectedVolume", option.value)
                            }
                            className={`px-4 py-2.5 rounded-lg border-2 text-sm font-medium text-left transition-all ${
                              isSelected
                                ? "border-blue-600 bg-blue-50 text-blue-700"
                                : "border-slate-200 text-slate-700 hover:border-slate-300"
                            }`}
                          >
                            {option.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Number of locations */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Number of Locations
                    </label>
                    <select
                      value={formData.locations}
                      onChange={(e) => updateField("locations", e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none appearance-none"
                    >
                      <option value="1">1 location</option>
                      <option value="2-5">2-5 locations</option>
                      <option value="6-10">6-10 locations</option>
                      <option value="11-25">11-25 locations</option>
                      <option value="25+">25+ locations</option>
                    </select>
                  </div>

                  {/* Business license upload */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Business License (optional)
                    </label>
                    <div className="border-2 border-dashed border-slate-200 rounded-lg p-6 text-center hover:border-slate-300 transition-colors">
                      <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                      <p className="text-sm text-slate-600 mb-1">
                        Drop your business license here, or{" "}
                        <label className="text-blue-600 font-medium cursor-pointer hover:underline">
                          browse
                          <input
                            type="file"
                            accept=".pdf,.jpg,.jpeg,.png"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0] || null;
                              updateField("licenseFile", file);
                            }}
                          />
                        </label>
                      </p>
                      <p className="text-xs text-slate-400">
                        PDF, JPG, or PNG up to 10MB
                      </p>
                      {formData.licenseFile && (
                        <p className="mt-2 text-sm text-emerald-600 font-medium">
                          {formData.licenseFile.name}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Message */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Tell us about your business
                    </label>
                    <textarea
                      value={formData.message}
                      onChange={(e) => updateField("message", e.target.value)}
                      rows={4}
                      placeholder="Describe your distribution channels, customer base, and how Aura products would fit..."
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none resize-none hover:border-gray-400 placeholder:text-gray-400"
                    />
                  </div>
                </div>
              )}

              {/* Step 4: Review */}
              {currentStep === 4 && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900 mb-1">
                      Review Your Application
                    </h2>
                    <p className="text-sm text-gray-500">
                      Confirm your details before submitting.
                    </p>
                  </div>

                  <div className="space-y-4">
                    {/* Contact Section */}
                    <div className="p-4 rounded-lg bg-slate-50 border border-slate-200">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-sm font-semibold text-slate-700">
                          Contact Information
                        </h3>
                        <button
                          type="button"
                          onClick={() => setCurrentStep(1)}
                          className="text-xs text-blue-600 font-medium hover:underline"
                        >
                          Edit
                        </button>
                      </div>
                      <dl className="grid sm:grid-cols-2 gap-2 text-sm">
                        <div>
                          <dt className="text-slate-500">Name</dt>
                          <dd className="text-slate-900 font-medium">
                            {formData.fullName}
                          </dd>
                        </div>
                        <div>
                          <dt className="text-slate-500">Email</dt>
                          <dd className="text-slate-900 font-medium">
                            {formData.email}
                          </dd>
                        </div>
                        {formData.phone && (
                          <div>
                            <dt className="text-slate-500">Phone</dt>
                            <dd className="text-slate-900 font-medium">
                              {formData.phone}
                            </dd>
                          </div>
                        )}
                        <div>
                          <dt className="text-slate-500">Organization</dt>
                          <dd className="text-slate-900 font-medium">
                            {formData.organizationName}
                          </dd>
                        </div>
                      </dl>
                    </div>

                    {/* Business Section */}
                    <div className="p-4 rounded-lg bg-slate-50 border border-slate-200">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-sm font-semibold text-slate-700">
                          Business Details
                        </h3>
                        <button
                          type="button"
                          onClick={() => setCurrentStep(2)}
                          className="text-xs text-blue-600 font-medium hover:underline"
                        >
                          Edit
                        </button>
                      </div>
                      <dl className="grid sm:grid-cols-2 gap-2 text-sm">
                        <div>
                          <dt className="text-slate-500">Type</dt>
                          <dd className="text-slate-900 font-medium capitalize">
                            {BUSINESS_TYPES.find(
                              (b) => b.value === formData.businessType
                            )?.label || formData.businessType}
                          </dd>
                        </div>
                        {formData.website && (
                          <div>
                            <dt className="text-slate-500">Website</dt>
                            <dd className="text-slate-900 font-medium truncate">
                              {formData.website}
                            </dd>
                          </div>
                        )}
                        {formData.taxId && (
                          <div>
                            <dt className="text-slate-500">Tax ID</dt>
                            <dd className="text-slate-900 font-medium">
                              {formData.taxId}
                            </dd>
                          </div>
                        )}
                      </dl>
                    </div>

                    {/* Use Case Section */}
                    <div className="p-4 rounded-lg bg-slate-50 border border-slate-200">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-sm font-semibold text-slate-700">
                          Use Case
                        </h3>
                        <button
                          type="button"
                          onClick={() => setCurrentStep(3)}
                          className="text-xs text-blue-600 font-medium hover:underline"
                        >
                          Edit
                        </button>
                      </div>
                      <dl className="grid sm:grid-cols-2 gap-2 text-sm">
                        {formData.expectedVolume && (
                          <div>
                            <dt className="text-slate-500">Expected Volume</dt>
                            <dd className="text-slate-900 font-medium">
                              {VOLUME_OPTIONS.find(
                                (v) => v.value === formData.expectedVolume
                              )?.label}
                            </dd>
                          </div>
                        )}
                        <div>
                          <dt className="text-slate-500">Locations</dt>
                          <dd className="text-slate-900 font-medium">
                            {formData.locations}
                          </dd>
                        </div>
                        {formData.licenseFile && (
                          <div>
                            <dt className="text-slate-500">License</dt>
                            <dd className="text-slate-900 font-medium truncate">
                              {formData.licenseFile.name}
                            </dd>
                          </div>
                        )}
                      </dl>
                      {formData.message && (
                        <div className="mt-2 text-sm">
                          <dt className="text-slate-500 mb-0.5">Message</dt>
                          <dd className="text-slate-900">{formData.message}</dd>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {error && (
                <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 px-4 py-3 rounded-lg mt-6">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  {error}
                </div>
              )}

              {/* Navigation Buttons */}
              <div className="flex justify-between mt-8 pt-6 border-t border-gray-200">
                {currentStep > 1 ? (
                  <Button type="button" variant="outline" onClick={handleBack}>
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back
                  </Button>
                ) : (
                  <div />
                )}

                {currentStep < 4 ? (
                  <Button
                    type="button"
                    variant="primary"
                    onClick={handleNext}
                    disabled={!canProceed()}
                  >
                    Next
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                ) : (
                  <Button
                    type="submit"
                    variant="primary"
                    size="lg"
                    isLoading={isSubmitting}
                  >
                    Submit Application
                  </Button>
                )}
              </div>

              <p className="text-xs text-gray-400 text-center mt-4">
                By submitting, you agree to be contacted by Aura&apos;s
                partnerships team regarding your application.
              </p>
            </form>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  );
}
