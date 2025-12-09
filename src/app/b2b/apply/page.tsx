"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Header, Footer, Card, Button, Input } from "@/components/ui";
import {
  Building2,
  ArrowLeft,
  ArrowRight,
  CheckCircle,
  User,
  Mail,
  Phone,
  Globe,
  MapPin,
  Briefcase,
  Loader2,
} from "lucide-react";

type FormStep = "business" | "contact" | "details" | "review";

interface ApplicationData {
  // Business Info
  businessName: string;
  businessType: string;
  website: string;
  taxId: string;
  // Contact Info
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  contactRole: string;
  // Business Details
  address: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  // Additional Info
  expectedVolume: string;
  howDidYouHear: string;
  additionalNotes: string;
}

const businessTypes = [
  "Retail Store",
  "Gym / Fitness Center",
  "Vending Operator",
  "Marina / FBO",
  "Online Retailer",
  "Corporate Wellness",
  "Food Service",
  "Other",
];

const volumeOptions = [
  "Less than 100 units/month",
  "100-500 units/month",
  "500-2,000 units/month",
  "2,000-5,000 units/month",
  "5,000+ units/month",
];

const hearOptions = [
  "Search Engine",
  "Social Media",
  "Trade Show",
  "Referral",
  "Industry Publication",
  "Other",
];

export default function DealerApplyPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState<FormStep>("business");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<ApplicationData>({
    businessName: "",
    businessType: "",
    website: "",
    taxId: "",
    contactName: "",
    contactEmail: "",
    contactPhone: "",
    contactRole: "",
    address: "",
    city: "",
    state: "",
    zipCode: "",
    country: "United States",
    expectedVolume: "",
    howDidYouHear: "",
    additionalNotes: "",
  });

  const supabase = createClient();

  const updateForm = (field: keyof ApplicationData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const steps: { key: FormStep; label: string }[] = [
    { key: "business", label: "Business Info" },
    { key: "contact", label: "Contact" },
    { key: "details", label: "Details" },
    { key: "review", label: "Review" },
  ];

  const currentStepIndex = steps.findIndex((s) => s.key === currentStep);

  const canProceed = () => {
    switch (currentStep) {
      case "business":
        return formData.businessName && formData.businessType;
      case "contact":
        return formData.contactName && formData.contactEmail && formData.contactPhone;
      case "details":
        return formData.address && formData.city && formData.state && formData.zipCode;
      case "review":
        return true;
      default:
        return false;
    }
  };

  const handleNext = () => {
    const nextIndex = currentStepIndex + 1;
    if (nextIndex < steps.length) {
      setCurrentStep(steps[nextIndex].key);
    }
  };

  const handleBack = () => {
    const prevIndex = currentStepIndex - 1;
    if (prevIndex >= 0) {
      setCurrentStep(steps[prevIndex].key);
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setError(null);

    try {
      // First, create an account for the user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.contactEmail,
        password: Math.random().toString(36).slice(-12) + "Aa1!", // Temporary password
        options: {
          data: {
            full_name: formData.contactName,
            role: "dealer",
          },
        },
      });

      if (authError) {
        // If email already exists, try to just create application
        if (!authError.message.includes("already registered")) {
          throw authError;
        }
      }

      // Create organization
      const { data: org, error: orgError } = await supabase
        .from("organizations")
        .insert({
          name: formData.businessName,
          contact_email: formData.contactEmail,
          contact_phone: formData.contactPhone,
          address: {
            street: formData.address,
            city: formData.city,
            state: formData.state,
            zip: formData.zipCode,
            country: formData.country,
          },
          metadata: {
            website: formData.website,
            tax_id: formData.taxId,
            business_type: formData.businessType,
            expected_volume: formData.expectedVolume,
            how_heard: formData.howDidYouHear,
            notes: formData.additionalNotes,
            contact_role: formData.contactRole,
            application_date: new Date().toISOString(),
            status: "pending_approval",
          },
          dealer_tier: "bronze",
          is_active: false, // Will be activated after approval
        })
        .select()
        .single();

      if (orgError) throw orgError;

      // If we have a user, create dealer record
      if (authData?.user) {
        // Generate referral code
        const referralCode = `${formData.businessName
          .substring(0, 3)
          .toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

        await supabase.from("dealers").insert({
          profile_id: authData.user.id,
          organization_id: org.id,
          referral_code: referralCode,
          is_active: false, // Will be activated after approval
        });

        // Update profile role
        await supabase
          .from("profiles")
          .update({ role: "dealer", organization_id: org.id })
          .eq("id", authData.user.id);
      }

      // Redirect to success page
      router.push("/b2b/apply/success");
    } catch (err) {
      console.error("Application error:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Failed to submit application. Please try again."
      );
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />

      <main className="flex-1 py-12">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Back Link */}
          <Link
            href="/b2b"
            className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-8"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Partner Program
          </Link>

          {/* Header */}
          <div className="text-center mb-8">
            <Building2 className="w-12 h-12 text-aura-primary mx-auto mb-4" />
            <h1 className="text-3xl font-bold mb-2">Dealer Application</h1>
            <p className="text-gray-600">
              Join the Aura partner network and grow your business
            </p>
          </div>

          {/* Progress Steps */}
          <div className="flex items-center justify-between mb-8">
            {steps.map((step, index) => (
              <div key={step.key} className="flex items-center">
                <div
                  className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium ${
                    index <= currentStepIndex
                      ? "bg-aura-primary text-white"
                      : "bg-gray-200 text-gray-500"
                  }`}
                >
                  {index < currentStepIndex ? (
                    <CheckCircle className="w-5 h-5" />
                  ) : (
                    index + 1
                  )}
                </div>
                <span
                  className={`ml-2 text-sm ${
                    index <= currentStepIndex ? "text-gray-900" : "text-gray-500"
                  }`}
                >
                  {step.label}
                </span>
                {index < steps.length - 1 && (
                  <div
                    className={`w-12 h-0.5 mx-4 ${
                      index < currentStepIndex ? "bg-aura-primary" : "bg-gray-200"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-lg">
              {error}
            </div>
          )}

          <Card padding="lg">
            {/* Step 1: Business Info */}
            {currentStep === "business" && (
              <div className="space-y-6">
                <h2 className="text-xl font-semibold mb-4">Business Information</h2>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Business Name *
                  </label>
                  <Input
                    placeholder="Your company name"
                    value={formData.businessName}
                    onChange={(e) => updateForm("businessName", e.target.value)}
                    leftIcon={<Building2 className="w-5 h-5" />}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Business Type *
                  </label>
                  <select
                    value={formData.businessType}
                    onChange={(e) => updateForm("businessType", e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-aura-primary focus:border-transparent"
                  >
                    <option value="">Select business type</option>
                    {businessTypes.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Website (Optional)
                  </label>
                  <Input
                    placeholder="https://www.example.com"
                    value={formData.website}
                    onChange={(e) => updateForm("website", e.target.value)}
                    leftIcon={<Globe className="w-5 h-5" />}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Tax ID / EIN (Optional)
                  </label>
                  <Input
                    placeholder="XX-XXXXXXX"
                    value={formData.taxId}
                    onChange={(e) => updateForm("taxId", e.target.value)}
                  />
                </div>
              </div>
            )}

            {/* Step 2: Contact Info */}
            {currentStep === "contact" && (
              <div className="space-y-6">
                <h2 className="text-xl font-semibold mb-4">Contact Information</h2>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Full Name *
                  </label>
                  <Input
                    placeholder="John Doe"
                    value={formData.contactName}
                    onChange={(e) => updateForm("contactName", e.target.value)}
                    leftIcon={<User className="w-5 h-5" />}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Email *</label>
                  <Input
                    type="email"
                    placeholder="john@company.com"
                    value={formData.contactEmail}
                    onChange={(e) => updateForm("contactEmail", e.target.value)}
                    leftIcon={<Mail className="w-5 h-5" />}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Phone *</label>
                  <Input
                    type="tel"
                    placeholder="(555) 123-4567"
                    value={formData.contactPhone}
                    onChange={(e) => updateForm("contactPhone", e.target.value)}
                    leftIcon={<Phone className="w-5 h-5" />}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Your Role
                  </label>
                  <Input
                    placeholder="Owner, Manager, etc."
                    value={formData.contactRole}
                    onChange={(e) => updateForm("contactRole", e.target.value)}
                    leftIcon={<Briefcase className="w-5 h-5" />}
                  />
                </div>
              </div>
            )}

            {/* Step 3: Business Details */}
            {currentStep === "details" && (
              <div className="space-y-6">
                <h2 className="text-xl font-semibold mb-4">Business Details</h2>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Street Address *
                  </label>
                  <Input
                    placeholder="123 Business St"
                    value={formData.address}
                    onChange={(e) => updateForm("address", e.target.value)}
                    leftIcon={<MapPin className="w-5 h-5" />}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">City *</label>
                    <Input
                      placeholder="City"
                      value={formData.city}
                      onChange={(e) => updateForm("city", e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      State *
                    </label>
                    <Input
                      placeholder="State"
                      value={formData.state}
                      onChange={(e) => updateForm("state", e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      ZIP Code *
                    </label>
                    <Input
                      placeholder="12345"
                      value={formData.zipCode}
                      onChange={(e) => updateForm("zipCode", e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Country
                    </label>
                    <Input
                      placeholder="Country"
                      value={formData.country}
                      onChange={(e) => updateForm("country", e.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Expected Monthly Volume
                  </label>
                  <select
                    value={formData.expectedVolume}
                    onChange={(e) => updateForm("expectedVolume", e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-aura-primary focus:border-transparent"
                  >
                    <option value="">Select expected volume</option>
                    {volumeOptions.map((vol) => (
                      <option key={vol} value={vol}>
                        {vol}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    How did you hear about us?
                  </label>
                  <select
                    value={formData.howDidYouHear}
                    onChange={(e) => updateForm("howDidYouHear", e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-aura-primary focus:border-transparent"
                  >
                    <option value="">Select option</option>
                    {hearOptions.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Additional Notes
                  </label>
                  <textarea
                    placeholder="Tell us more about your business and how you plan to sell Aura products..."
                    value={formData.additionalNotes}
                    onChange={(e) => updateForm("additionalNotes", e.target.value)}
                    rows={4}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-aura-primary focus:border-transparent"
                  />
                </div>
              </div>
            )}

            {/* Step 4: Review */}
            {currentStep === "review" && (
              <div className="space-y-6">
                <h2 className="text-xl font-semibold mb-4">Review Your Application</h2>

                <div className="space-y-6">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="font-medium mb-3">Business Information</h3>
                    <div className="space-y-2 text-sm">
                      <p>
                        <span className="text-gray-500">Business Name:</span>{" "}
                        {formData.businessName}
                      </p>
                      <p>
                        <span className="text-gray-500">Type:</span>{" "}
                        {formData.businessType}
                      </p>
                      {formData.website && (
                        <p>
                          <span className="text-gray-500">Website:</span>{" "}
                          {formData.website}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="font-medium mb-3">Contact Information</h3>
                    <div className="space-y-2 text-sm">
                      <p>
                        <span className="text-gray-500">Name:</span>{" "}
                        {formData.contactName}
                      </p>
                      <p>
                        <span className="text-gray-500">Email:</span>{" "}
                        {formData.contactEmail}
                      </p>
                      <p>
                        <span className="text-gray-500">Phone:</span>{" "}
                        {formData.contactPhone}
                      </p>
                      {formData.contactRole && (
                        <p>
                          <span className="text-gray-500">Role:</span>{" "}
                          {formData.contactRole}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="font-medium mb-3">Business Address</h3>
                    <div className="text-sm">
                      <p>{formData.address}</p>
                      <p>
                        {formData.city}, {formData.state} {formData.zipCode}
                      </p>
                      <p>{formData.country}</p>
                    </div>
                  </div>

                  {formData.expectedVolume && (
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h3 className="font-medium mb-3">Additional Details</h3>
                      <div className="space-y-2 text-sm">
                        <p>
                          <span className="text-gray-500">Expected Volume:</span>{" "}
                          {formData.expectedVolume}
                        </p>
                        {formData.howDidYouHear && (
                          <p>
                            <span className="text-gray-500">Referral Source:</span>{" "}
                            {formData.howDidYouHear}
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                <div className="bg-aura-light rounded-lg p-4">
                  <p className="text-sm text-gray-600">
                    By submitting this application, you agree to Aura&apos;s{" "}
                    <Link href="/terms" className="text-aura-primary hover:underline">
                      Terms of Service
                    </Link>{" "}
                    and{" "}
                    <Link href="/privacy" className="text-aura-primary hover:underline">
                      Privacy Policy
                    </Link>
                    . We&apos;ll review your application and get back to you within
                    48 hours.
                  </p>
                </div>
              </div>
            )}

            {/* Navigation */}
            <div className="flex justify-between mt-8 pt-6 border-t">
              {currentStepIndex > 0 ? (
                <Button variant="outline" onClick={handleBack}>
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </Button>
              ) : (
                <div />
              )}

              {currentStep === "review" ? (
                <Button
                  onClick={handleSubmit}
                  isLoading={isSubmitting}
                  disabled={!canProceed()}
                >
                  Submit Application
                </Button>
              ) : (
                <Button onClick={handleNext} disabled={!canProceed()}>
                  Continue
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              )}
            </div>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  );
}
