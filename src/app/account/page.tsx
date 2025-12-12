"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/hooks";
import {
  Header,
  Footer,
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Button,
  Input,
  Tabs,
  Avatar,
  Badge,
} from "@/components/ui";
import { formatDate } from "@/lib/utils";
import {
  User,
  Mail,
  Phone,
  MapPin,
  Shield,
  Bell,
  CreditCard,
  Key,
  Save,
  Loader2,
  CheckCircle,
  AlertTriangle,
  LogOut,
  Trash2,
} from "lucide-react";

export default function AccountPage() {
  const router = useRouter();
  const { profile, user, isLoading: authLoading, isAuthenticated, signOut, updateProfile } = useAuth();
  const [activeTab, setActiveTab] = useState("profile");
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [profileData, setProfileData] = useState({
    full_name: "",
    phone: "",
    address_line1: "",
    address_line2: "",
    city: "",
    state: "",
    zip_code: "",
    country: "US",
  });

  const [notifications, setNotifications] = useState({
    email_orders: true,
    email_shipping: true,
    email_marketing: false,
    email_reminders: true,
  });

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/auth/login?redirectTo=/account");
    }
  }, [authLoading, isAuthenticated, router]);

  useEffect(() => {
    if (profile) {
      const address = profile.address as {
        line1?: string;
        line2?: string;
        city?: string;
        state?: string;
        zip_code?: string;
        country?: string;
      } | null;

      setProfileData({
        full_name: profile.full_name || "",
        phone: profile.phone || "",
        address_line1: address?.line1 || "",
        address_line2: address?.line2 || "",
        city: address?.city || "",
        state: address?.state || "",
        zip_code: address?.zip_code || "",
        country: address?.country || "US",
      });
    }
  }, [profile]);

  const handleSaveProfile = async () => {
    setIsSaving(true);
    setError(null);
    setSaveSuccess(false);

    try {
      await updateProfile({
        full_name: profileData.full_name,
        phone: profileData.phone,
        address: {
          line1: profileData.address_line1,
          line2: profileData.address_line2,
          city: profileData.city,
          state: profileData.state,
          zip_code: profileData.zip_code,
          country: profileData.country,
        },
      });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save profile");
    }

    setIsSaving(false);
  };

  const handleSignOut = async () => {
    await signOut();
    router.push("/");
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-aura-primary" />
      </div>
    );
  }

  const tabs = [
    { id: "profile", label: "Profile" },
    { id: "security", label: "Security" },
    { id: "notifications", label: "Notifications" },
    { id: "billing", label: "Billing" },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />

      <main className="flex-1 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Page Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Account Settings</h1>
            <p className="text-gray-500 mt-1">Manage your profile and preferences</p>
          </div>

          {/* Profile Header Card */}
          <Card className="mb-6">
            <div className="p-6 flex items-center gap-4">
              <Avatar
                src={profile?.avatar_url}
                fallback={profile?.full_name || user?.email}
                size="xl"
              />
              <div className="flex-1">
                <h2 className="text-xl font-semibold">{profile?.full_name || "Set your name"}</h2>
                <p className="text-gray-500">{user?.email}</p>
                <div className="flex items-center gap-2 mt-2">
                  <Badge variant="primary">{profile?.role || "customer"}</Badge>
                  <span className="text-sm text-gray-400">
                    Member since {profile?.created_at ? formatDate(profile.created_at) : "-"}
                  </span>
                </div>
              </div>
              <Button variant="outline" leftIcon={<LogOut className="w-4 h-4" />} onClick={handleSignOut}>
                Sign Out
              </Button>
            </div>
          </Card>

          {/* Tabs */}
          <Tabs tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} className="mb-6" />

          {/* Success/Error Messages */}
          {saveSuccess && (
            <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-xl flex items-center gap-2 text-green-700">
              <CheckCircle className="w-5 h-5" />
              Your changes have been saved successfully.
            </div>
          )}
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-red-700">
              <AlertTriangle className="w-5 h-5" />
              {error}
            </div>
          )}

          {/* Profile Tab */}
          {activeTab === "profile" && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5" />
                  Personal Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="Full Name"
                    value={profileData.full_name}
                    onChange={(e) =>
                      setProfileData({ ...profileData, full_name: e.target.value })
                    }
                    placeholder="John Doe"
                  />
                  <Input
                    label="Phone Number"
                    value={profileData.phone}
                    onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                    placeholder="+1 (555) 123-4567"
                  />
                </div>

                <div className="pt-4 border-t">
                  <h4 className="font-medium mb-4 flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    Shipping Address
                  </h4>
                  <div className="space-y-4">
                    <Input
                      label="Address Line 1"
                      value={profileData.address_line1}
                      onChange={(e) =>
                        setProfileData({ ...profileData, address_line1: e.target.value })
                      }
                      placeholder="123 Main Street"
                    />
                    <Input
                      label="Address Line 2"
                      value={profileData.address_line2}
                      onChange={(e) =>
                        setProfileData({ ...profileData, address_line2: e.target.value })
                      }
                      placeholder="Apt 4B"
                    />
                    <div className="grid grid-cols-3 gap-4">
                      <Input
                        label="City"
                        value={profileData.city}
                        onChange={(e) =>
                          setProfileData({ ...profileData, city: e.target.value })
                        }
                        placeholder="San Francisco"
                      />
                      <Input
                        label="State"
                        value={profileData.state}
                        onChange={(e) =>
                          setProfileData({ ...profileData, state: e.target.value })
                        }
                        placeholder="CA"
                      />
                      <Input
                        label="ZIP Code"
                        value={profileData.zip_code}
                        onChange={(e) =>
                          setProfileData({ ...profileData, zip_code: e.target.value })
                        }
                        placeholder="94102"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end pt-4">
                  <Button
                    leftIcon={<Save className="w-4 h-4" />}
                    onClick={handleSaveProfile}
                    isLoading={isSaving}
                  >
                    Save Changes
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Security Tab */}
          {activeTab === "security" && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Key className="w-5 h-5" />
                    Password
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-500 mb-4">
                    To change your password, we'll send you a password reset email.
                  </p>
                  <Button variant="outline">Send Password Reset Email</Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="w-5 h-5" />
                    Two-Factor Authentication
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-500 mb-4">
                    Add an extra layer of security to your account by enabling two-factor authentication.
                  </p>
                  <Button variant="outline">Enable 2FA</Button>
                </CardContent>
              </Card>

              <Card className="border-red-200">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-red-600">
                    <Trash2 className="w-5 h-5" />
                    Delete Account
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-500 mb-4">
                    Permanently delete your account and all associated data. This action cannot be undone.
                  </p>
                  <Button variant="outline" className="!text-red-600 !border-red-200 hover:!bg-red-50">
                    Delete My Account
                  </Button>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Notifications Tab */}
          {activeTab === "notifications" && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="w-5 h-5" />
                  Email Preferences
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <label className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                  <div>
                    <p className="font-medium text-gray-900">Order Confirmations</p>
                    <p className="text-sm text-gray-500">Receive emails when you place an order</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={notifications.email_orders}
                    onChange={(e) =>
                      setNotifications({ ...notifications, email_orders: e.target.checked })
                    }
                    className="w-5 h-5 rounded border-gray-300 text-aura-primary focus:ring-aura-primary"
                  />
                </label>

                <label className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                  <div>
                    <p className="font-medium text-gray-900">Shipping Updates</p>
                    <p className="text-sm text-gray-500">Get notified when your order ships</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={notifications.email_shipping}
                    onChange={(e) =>
                      setNotifications({ ...notifications, email_shipping: e.target.checked })
                    }
                    className="w-5 h-5 rounded border-gray-300 text-aura-primary focus:ring-aura-primary"
                  />
                </label>

                <label className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                  <div>
                    <p className="font-medium text-gray-900">Subscription Reminders</p>
                    <p className="text-sm text-gray-500">Reminder emails before renewal</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={notifications.email_reminders}
                    onChange={(e) =>
                      setNotifications({ ...notifications, email_reminders: e.target.checked })
                    }
                    className="w-5 h-5 rounded border-gray-300 text-aura-primary focus:ring-aura-primary"
                  />
                </label>

                <label className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                  <div>
                    <p className="font-medium text-gray-900">Marketing Emails</p>
                    <p className="text-sm text-gray-500">News, promotions, and special offers</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={notifications.email_marketing}
                    onChange={(e) =>
                      setNotifications({ ...notifications, email_marketing: e.target.checked })
                    }
                    className="w-5 h-5 rounded border-gray-300 text-aura-primary focus:ring-aura-primary"
                  />
                </label>

                <div className="flex justify-end pt-4">
                  <Button leftIcon={<Save className="w-4 h-4" />}>Save Preferences</Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Billing Tab */}
          {activeTab === "billing" && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="w-5 h-5" />
                    Payment Methods
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-500 mb-4">
                    Payment methods are managed through Stripe. Click below to update your payment information.
                  </p>
                  <Button variant="outline">Manage Payment Methods</Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Billing History</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-500 mb-4">
                    View and download your past invoices.
                  </p>
                  <Button variant="outline">View Billing History</Button>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
