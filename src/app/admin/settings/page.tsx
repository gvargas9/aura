"use client";

import { useState } from "react";
import { AdminLayout } from "@/components/admin";
import {
  Button,
  Input,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  Tabs,
  Textarea,
  Select,
} from "@/components/ui";
import {
  Settings,
  Store,
  CreditCard,
  Bell,
  Mail,
  Truck,
  Shield,
  Save,
  Globe,
} from "lucide-react";

export default function AdminSettingsPage() {
  const [activeTab, setActiveTab] = useState("general");
  const [isSaving, setIsSaving] = useState(false);

  // General Settings
  const [generalSettings, setGeneralSettings] = useState({
    storeName: "Aura",
    storeEmail: "support@aura.com",
    storePhone: "+1 (555) 123-4567",
    storeAddress: "123 Food Street, San Francisco, CA 94102",
    currency: "USD",
    timezone: "America/Los_Angeles",
  });

  // Shipping Settings
  const [shippingSettings, setShippingSettings] = useState({
    freeShippingThreshold: "0",
    defaultShippingRate: "0",
    estimatedDeliveryDays: "5-7",
    enableInternational: false,
  });

  // Email Settings
  const [emailSettings, setEmailSettings] = useState({
    orderConfirmation: true,
    shippingNotification: true,
    deliveryConfirmation: true,
    subscriptionReminder: true,
    marketingEmails: true,
    reminderDays: "7",
  });

  // Notification Settings
  const [notificationSettings, setNotificationSettings] = useState({
    newOrders: true,
    lowStock: true,
    newCustomers: true,
    newDealers: true,
    lowStockThreshold: "50",
  });

  const handleSave = async () => {
    setIsSaving(true);
    // Simulate save
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setIsSaving(false);
  };

  const tabs = [
    { id: "general", label: "General" },
    { id: "shipping", label: "Shipping" },
    { id: "email", label: "Email" },
    { id: "notifications", label: "Notifications" },
    { id: "security", label: "Security" },
  ];

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
            <p className="text-gray-500">Manage your store configuration</p>
          </div>
          <Button leftIcon={<Save className="w-4 h-4" />} onClick={handleSave} isLoading={isSaving}>
            Save Changes
          </Button>
        </div>

        {/* Tabs */}
        <Tabs tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} />

        {/* General Settings */}
        {activeTab === "general" && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Store className="w-5 h-5" />
                General Settings
              </CardTitle>
              <CardDescription>Basic store information and configuration</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Store Name"
                  value={generalSettings.storeName}
                  onChange={(e) =>
                    setGeneralSettings({ ...generalSettings, storeName: e.target.value })
                  }
                />
                <Input
                  label="Contact Email"
                  type="email"
                  value={generalSettings.storeEmail}
                  onChange={(e) =>
                    setGeneralSettings({ ...generalSettings, storeEmail: e.target.value })
                  }
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Phone Number"
                  value={generalSettings.storePhone}
                  onChange={(e) =>
                    setGeneralSettings({ ...generalSettings, storePhone: e.target.value })
                  }
                />
                <Select
                  label="Currency"
                  options={[
                    { value: "USD", label: "USD ($)" },
                    { value: "EUR", label: "EUR (€)" },
                    { value: "GBP", label: "GBP (£)" },
                  ]}
                  value={generalSettings.currency}
                  onChange={(v) => setGeneralSettings({ ...generalSettings, currency: v })}
                />
              </div>
              <Input
                label="Store Address"
                value={generalSettings.storeAddress}
                onChange={(e) =>
                  setGeneralSettings({ ...generalSettings, storeAddress: e.target.value })
                }
              />
              <Select
                label="Timezone"
                options={[
                  { value: "America/Los_Angeles", label: "Pacific Time (PT)" },
                  { value: "America/Denver", label: "Mountain Time (MT)" },
                  { value: "America/Chicago", label: "Central Time (CT)" },
                  { value: "America/New_York", label: "Eastern Time (ET)" },
                ]}
                value={generalSettings.timezone}
                onChange={(v) => setGeneralSettings({ ...generalSettings, timezone: v })}
              />
            </CardContent>
          </Card>
        )}

        {/* Shipping Settings */}
        {activeTab === "shipping" && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Truck className="w-5 h-5" />
                Shipping Settings
              </CardTitle>
              <CardDescription>Configure shipping rates and options</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Free Shipping Threshold ($)"
                  type="number"
                  value={shippingSettings.freeShippingThreshold}
                  onChange={(e) =>
                    setShippingSettings({
                      ...shippingSettings,
                      freeShippingThreshold: e.target.value,
                    })
                  }
                  helperText="Set to 0 for always free shipping"
                />
                <Input
                  label="Default Shipping Rate ($)"
                  type="number"
                  value={shippingSettings.defaultShippingRate}
                  onChange={(e) =>
                    setShippingSettings({
                      ...shippingSettings,
                      defaultShippingRate: e.target.value,
                    })
                  }
                />
              </div>
              <Input
                label="Estimated Delivery Time"
                value={shippingSettings.estimatedDeliveryDays}
                onChange={(e) =>
                  setShippingSettings({
                    ...shippingSettings,
                    estimatedDeliveryDays: e.target.value,
                  })
                }
                placeholder="e.g., 5-7 business days"
              />
              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={shippingSettings.enableInternational}
                  onChange={(e) =>
                    setShippingSettings({
                      ...shippingSettings,
                      enableInternational: e.target.checked,
                    })
                  }
                  className="w-4 h-4 rounded border-gray-300 text-aura-primary focus:ring-aura-primary"
                />
                <div>
                  <p className="font-medium text-gray-900">Enable International Shipping</p>
                  <p className="text-sm text-gray-500">Allow orders from outside the US</p>
                </div>
              </label>
            </CardContent>
          </Card>
        )}

        {/* Email Settings */}
        {activeTab === "email" && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="w-5 h-5" />
                Email Settings
              </CardTitle>
              <CardDescription>Configure automated email notifications</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <label className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                  <div>
                    <p className="font-medium text-gray-900">Order Confirmation</p>
                    <p className="text-sm text-gray-500">Send email when order is placed</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={emailSettings.orderConfirmation}
                    onChange={(e) =>
                      setEmailSettings({ ...emailSettings, orderConfirmation: e.target.checked })
                    }
                    className="w-5 h-5 rounded border-gray-300 text-aura-primary focus:ring-aura-primary"
                  />
                </label>
                <label className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                  <div>
                    <p className="font-medium text-gray-900">Shipping Notification</p>
                    <p className="text-sm text-gray-500">Send email when order ships</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={emailSettings.shippingNotification}
                    onChange={(e) =>
                      setEmailSettings({ ...emailSettings, shippingNotification: e.target.checked })
                    }
                    className="w-5 h-5 rounded border-gray-300 text-aura-primary focus:ring-aura-primary"
                  />
                </label>
                <label className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                  <div>
                    <p className="font-medium text-gray-900">Delivery Confirmation</p>
                    <p className="text-sm text-gray-500">Send email when order is delivered</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={emailSettings.deliveryConfirmation}
                    onChange={(e) =>
                      setEmailSettings({ ...emailSettings, deliveryConfirmation: e.target.checked })
                    }
                    className="w-5 h-5 rounded border-gray-300 text-aura-primary focus:ring-aura-primary"
                  />
                </label>
                <label className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                  <div>
                    <p className="font-medium text-gray-900">Subscription Reminder</p>
                    <p className="text-sm text-gray-500">Remind customers before renewal</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={emailSettings.subscriptionReminder}
                    onChange={(e) =>
                      setEmailSettings({ ...emailSettings, subscriptionReminder: e.target.checked })
                    }
                    className="w-5 h-5 rounded border-gray-300 text-aura-primary focus:ring-aura-primary"
                  />
                </label>
              </div>
              <Input
                label="Reminder Days Before Renewal"
                type="number"
                value={emailSettings.reminderDays}
                onChange={(e) =>
                  setEmailSettings({ ...emailSettings, reminderDays: e.target.value })
                }
              />
            </CardContent>
          </Card>
        )}

        {/* Notification Settings */}
        {activeTab === "notifications" && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="w-5 h-5" />
                Admin Notifications
              </CardTitle>
              <CardDescription>Configure alerts for admin dashboard</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <label className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                  <div>
                    <p className="font-medium text-gray-900">New Orders</p>
                    <p className="text-sm text-gray-500">Alert when new orders come in</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={notificationSettings.newOrders}
                    onChange={(e) =>
                      setNotificationSettings({
                        ...notificationSettings,
                        newOrders: e.target.checked,
                      })
                    }
                    className="w-5 h-5 rounded border-gray-300 text-aura-primary focus:ring-aura-primary"
                  />
                </label>
                <label className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                  <div>
                    <p className="font-medium text-gray-900">Low Stock Alerts</p>
                    <p className="text-sm text-gray-500">Alert when inventory is low</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={notificationSettings.lowStock}
                    onChange={(e) =>
                      setNotificationSettings({
                        ...notificationSettings,
                        lowStock: e.target.checked,
                      })
                    }
                    className="w-5 h-5 rounded border-gray-300 text-aura-primary focus:ring-aura-primary"
                  />
                </label>
                <label className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                  <div>
                    <p className="font-medium text-gray-900">New Customers</p>
                    <p className="text-sm text-gray-500">Alert when customers sign up</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={notificationSettings.newCustomers}
                    onChange={(e) =>
                      setNotificationSettings({
                        ...notificationSettings,
                        newCustomers: e.target.checked,
                      })
                    }
                    className="w-5 h-5 rounded border-gray-300 text-aura-primary focus:ring-aura-primary"
                  />
                </label>
                <label className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                  <div>
                    <p className="font-medium text-gray-900">New Dealers</p>
                    <p className="text-sm text-gray-500">Alert when dealers register</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={notificationSettings.newDealers}
                    onChange={(e) =>
                      setNotificationSettings({
                        ...notificationSettings,
                        newDealers: e.target.checked,
                      })
                    }
                    className="w-5 h-5 rounded border-gray-300 text-aura-primary focus:ring-aura-primary"
                  />
                </label>
              </div>
              <Input
                label="Low Stock Threshold"
                type="number"
                value={notificationSettings.lowStockThreshold}
                onChange={(e) =>
                  setNotificationSettings({
                    ...notificationSettings,
                    lowStockThreshold: e.target.value,
                  })
                }
                helperText="Alert when stock falls below this number"
              />
            </CardContent>
          </Card>
        )}

        {/* Security Settings */}
        {activeTab === "security" && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5" />
                Security Settings
              </CardTitle>
              <CardDescription>Configure security and access controls</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl">
                <p className="text-amber-800 font-medium">Two-Factor Authentication</p>
                <p className="text-sm text-amber-700 mt-1">
                  We recommend enabling 2FA for all admin accounts. Configure this in your Supabase
                  dashboard.
                </p>
              </div>

              <div className="space-y-4">
                <h4 className="font-medium">Session Management</h4>
                <div className="p-4 border border-gray-200 rounded-xl">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Current Session</p>
                      <p className="text-sm text-gray-500">Active now</p>
                    </div>
                    <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">
                      Active
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-medium">API Access</h4>
                <p className="text-sm text-gray-500">
                  API keys and webhooks are managed through your Stripe and Supabase dashboards.
                </p>
                <div className="flex gap-3">
                  <Button variant="outline" size="sm" leftIcon={<Globe className="w-4 h-4" />}>
                    Supabase Dashboard
                  </Button>
                  <Button variant="outline" size="sm" leftIcon={<CreditCard className="w-4 h-4" />}>
                    Stripe Dashboard
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </AdminLayout>
  );
}
