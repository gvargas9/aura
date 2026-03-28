"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/hooks";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Button,
  Input,
  Header,
  Footer,
} from "@/components/ui";
import { formatCurrency } from "@/lib/utils";
import type { Address } from "@/types";
import type { Json } from "@/types/database";
import {
  Loader2,
  User,
  MapPin,
  Mail,
  Shield,
  CreditCard,
  ArrowLeft,
  Save,
  CheckCircle,
  AlertCircle,
} from "lucide-react";

interface Toast {
  type: "success" | "error";
  message: string;
}

function parseAddress(json: Json | null): Address {
  const empty: Address = {
    firstName: "",
    lastName: "",
    address1: "",
    address2: "",
    city: "",
    state: "",
    zipCode: "",
    country: "US",
    phone: "",
  };

  if (!json || typeof json !== "object" || Array.isArray(json)) {
    return empty;
  }

  const obj = json as Record<string, unknown>;
  return {
    firstName: (obj.firstName as string) || "",
    lastName: (obj.lastName as string) || "",
    address1: (obj.address1 as string) || "",
    address2: (obj.address2 as string) || "",
    city: (obj.city as string) || "",
    state: (obj.state as string) || "",
    zipCode: (obj.zipCode as string) || "",
    country: (obj.country as string) || "US",
    phone: (obj.phone as string) || "",
  };
}

export default function AccountPage() {
  const router = useRouter();
  const {
    profile,
    user,
    isLoading: authLoading,
    isAuthenticated,
    updateProfile,
  } = useAuth();

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [address, setAddress] = useState<Address>({
    firstName: "",
    lastName: "",
    address1: "",
    address2: "",
    city: "",
    state: "",
    zipCode: "",
    country: "US",
    phone: "",
  });
  const [isSaving, setIsSaving] = useState(false);
  const [toast, setToast] = useState<Toast | null>(null);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/auth/login?redirectTo=/account");
    }
  }, [authLoading, isAuthenticated, router]);

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || "");
      setPhone(profile.phone || "");
      setAvatarUrl(profile.avatar_url || "");
      setAddress(parseAddress(profile.address));
    }
  }, [profile]);

  const showToast = (type: "success" | "error", message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  };

  const handleSave = async () => {
    setIsSaving(true);

    try {
      await updateProfile({
        full_name: fullName || null,
        phone: phone || null,
        avatar_url: avatarUrl || null,
        address: address as unknown as Json,
      });

      showToast("success", "Profile updated successfully.");
    } catch (error) {
      console.error("Failed to update profile:", error);
      showToast("error", "Failed to update profile. Please try again.");
    }

    setIsSaving(false);
  };

  const updateAddress = (field: keyof Address, value: string) => {
    setAddress((prev) => ({ ...prev, [field]: value }));
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <div className="flex-1 flex items-center justify-center bg-gray-50">
          <Loader2 className="w-8 h-8 animate-spin text-aura-primary" />
        </div>
        <Footer />
      </div>
    );
  }

  if (!profile) {
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 bg-gray-50">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Toast */}
          {toast && (
            <div
              className={`fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-lg shadow-lg text-sm font-medium transition-all ${
                toast.type === "success"
                  ? "bg-green-50 text-green-800 border border-green-200"
                  : "bg-red-50 text-red-800 border border-red-200"
              }`}
            >
              {toast.type === "success" ? (
                <CheckCircle className="w-4 h-4" />
              ) : (
                <AlertCircle className="w-4 h-4" />
              )}
              {toast.message}
            </div>
          )}

          {/* Page Header */}
          <div className="mb-8">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-4"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Dashboard
            </Link>
            <h1 className="text-3xl font-bold text-gray-900">
              Account Settings
            </h1>
            <p className="text-gray-600 mt-1">
              Manage your personal information and preferences.
            </p>
          </div>

          <div className="space-y-6">
            {/* Profile Section */}
            <Card padding="lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5 text-gray-400" />
                  Profile Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <Input
                    label="Full Name"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Enter your full name"
                  />
                  <Input
                    label="Phone Number"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="(555) 123-4567"
                  />
                  <Input
                    label="Avatar URL"
                    type="url"
                    value={avatarUrl}
                    onChange={(e) => setAvatarUrl(e.target.value)}
                    placeholder="https://example.com/avatar.jpg"
                    helperText="Enter a URL for your profile photo"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Email & Role (Read-only) */}
            <Card padding="lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="w-5 h-5 text-gray-400" />
                  Account Details
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email Address
                    </label>
                    <div className="flex items-center gap-2 px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-700">
                      <Mail className="w-4 h-4 text-gray-400" />
                      <span>{user?.email || profile.email}</span>
                    </div>
                    <p className="mt-1 text-sm text-gray-500">
                      Email cannot be changed here. Contact support for
                      assistance.
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Account Role
                      </label>
                      <div className="flex items-center gap-2 px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-700">
                        <Shield className="w-4 h-4 text-gray-400" />
                        <span className="capitalize">{profile.role}</span>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Credits Balance
                      </label>
                      <div className="flex items-center gap-2 px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-700">
                        <CreditCard className="w-4 h-4 text-gray-400" />
                        <span className="font-semibold">
                          {formatCurrency(profile.credits || 0)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Shipping Address */}
            <Card padding="lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-gray-400" />
                  Shipping Address
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Input
                      label="First Name"
                      value={address.firstName}
                      onChange={(e) =>
                        updateAddress("firstName", e.target.value)
                      }
                      placeholder="First name"
                    />
                    <Input
                      label="Last Name"
                      value={address.lastName}
                      onChange={(e) =>
                        updateAddress("lastName", e.target.value)
                      }
                      placeholder="Last name"
                    />
                  </div>

                  <Input
                    label="Address Line 1"
                    value={address.address1}
                    onChange={(e) => updateAddress("address1", e.target.value)}
                    placeholder="123 Main Street"
                  />

                  <Input
                    label="Address Line 2"
                    value={address.address2 || ""}
                    onChange={(e) => updateAddress("address2", e.target.value)}
                    placeholder="Apt, Suite, Unit (optional)"
                  />

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    <Input
                      label="City"
                      value={address.city}
                      onChange={(e) => updateAddress("city", e.target.value)}
                      placeholder="City"
                    />
                    <Input
                      label="State"
                      value={address.state}
                      onChange={(e) => updateAddress("state", e.target.value)}
                      placeholder="TX"
                    />
                    <Input
                      label="ZIP Code"
                      value={address.zipCode}
                      onChange={(e) => updateAddress("zipCode", e.target.value)}
                      placeholder="12345"
                    />
                  </div>

                  <Input
                    label="Phone"
                    type="tel"
                    value={address.phone || ""}
                    onChange={(e) => updateAddress("phone", e.target.value)}
                    placeholder="(555) 123-4567"
                    helperText="Used for delivery notifications"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Save Button */}
            <div className="flex justify-end gap-3 pb-4">
              <Link href="/dashboard">
                <Button variant="outline">Cancel</Button>
              </Link>
              <Button
                variant="primary"
                onClick={handleSave}
                isLoading={isSaving}
                leftIcon={<Save className="w-4 h-4" />}
              >
                Save Changes
              </Button>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
