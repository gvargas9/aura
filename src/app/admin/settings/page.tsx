"use client";

import { useState } from "react";
import { Card } from "@/components/ui";
import {
  Settings,
  Store,
  Truck,
  Bell,
  Plug,
  Info,
  CheckCircle,
  MapPin,
  Mail,
  Clock,
  Package,
  DollarSign,
} from "lucide-react";

interface ToggleSetting {
  key: string;
  label: string;
  description: string;
  enabled: boolean;
}

export default function AdminSettingsPage() {
  const [notifications, setNotifications] = useState<ToggleSetting[]>([
    {
      key: "order_confirmation",
      label: "Order Confirmation",
      description: "Send email when a new order is placed",
      enabled: true,
    },
    {
      key: "shipping_updates",
      label: "Shipping Updates",
      description: "Notify customers when their order ships",
      enabled: true,
    },
    {
      key: "low_stock_alerts",
      label: "Low Stock Alerts",
      description: "Alert admins when inventory falls below safety stock",
      enabled: true,
    },
  ]);

  const toggleNotification = (key: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.key === key ? { ...n, enabled: !n.enabled } : n))
    );
  };

  const integrations = [
    { name: "Stripe", description: "Payment processing", connected: true },
    { name: "n8n", description: "Workflow automation", connected: true },
    {
      name: "Business Manager",
      description: "CRM integration",
      connected: true,
    },
    { name: "Supabase", description: "Database & auth", connected: true },
  ];

  return (
    <>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-600">Manage application settings</p>
      </div>

      {/* Info Banner */}
      <div className="flex items-center gap-3 p-4 mb-6 rounded-xl bg-blue-50 border border-blue-200 text-blue-800">
        <Info className="w-5 h-5 flex-shrink-0" />
        <p className="text-sm">
          Settings are read-only in this version. Configuration changes will be
          available in a future update.
        </p>
      </div>

      <div className="space-y-6">
        {/* General Settings */}
        <Card padding="md">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-lg bg-aura-primary/10">
              <Store className="w-5 h-5 text-aura-primary" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                General Settings
              </h2>
              <p className="text-sm text-gray-500">
                Basic store configuration
              </p>
            </div>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between py-3 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <Store className="w-4 h-4 text-gray-400" />
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    Store Name
                  </p>
                  <p className="text-xs text-gray-500">
                    Public-facing store name
                  </p>
                </div>
              </div>
              <span className="text-sm text-gray-700 font-medium">Aura</span>
            </div>
            <div className="flex items-center justify-between py-3 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <Mail className="w-4 h-4 text-gray-400" />
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    Support Email
                  </p>
                  <p className="text-xs text-gray-500">
                    Customer support contact
                  </p>
                </div>
              </div>
              <span className="text-sm text-gray-700 font-medium">
                hello@aura.com
              </span>
            </div>
            <div className="flex items-center justify-between py-3">
              <div className="flex items-center gap-3">
                <Clock className="w-4 h-4 text-gray-400" />
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    Store Timezone
                  </p>
                  <p className="text-xs text-gray-500">
                    Used for scheduling and reports
                  </p>
                </div>
              </div>
              <span className="text-sm text-gray-700 font-medium">
                America/Chicago
              </span>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-gray-100">
            <button
              disabled
              className="px-4 py-2 text-sm font-medium rounded-lg bg-gray-100 text-gray-400 cursor-not-allowed"
            >
              Edit Settings
            </button>
          </div>
        </Card>

        {/* Shipping */}
        <Card padding="md">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-lg bg-aura-primary/10">
              <Truck className="w-5 h-5 text-aura-primary" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Shipping</h2>
              <p className="text-sm text-gray-500">
                Shipping and fulfillment configuration
              </p>
            </div>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between py-3 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <MapPin className="w-4 h-4 text-gray-400" />
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    Default Warehouse
                  </p>
                  <p className="text-xs text-gray-500">Primary ship-from location</p>
                </div>
              </div>
              <span className="text-sm text-gray-700 font-medium">
                El Paso, TX
              </span>
            </div>
            <div className="flex items-center justify-between py-3 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <DollarSign className="w-4 h-4 text-gray-400" />
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    Free Shipping Threshold
                  </p>
                  <p className="text-xs text-gray-500">
                    Minimum order for free shipping
                  </p>
                </div>
              </div>
              <span className="text-sm text-gray-700 font-medium">
                $0 (all orders)
              </span>
            </div>
            <div className="flex items-center justify-between py-3">
              <div className="flex items-center gap-3">
                <Package className="w-4 h-4 text-gray-400" />
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    Carrier Preference
                  </p>
                  <p className="text-xs text-gray-500">
                    Default shipping carrier
                  </p>
                </div>
              </div>
              <span className="text-sm text-gray-700 font-medium">
                EasyPost
              </span>
            </div>
          </div>
        </Card>

        {/* Notifications */}
        <Card padding="md">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-lg bg-aura-primary/10">
              <Bell className="w-5 h-5 text-aura-primary" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                Notifications
              </h2>
              <p className="text-sm text-gray-500">
                Email notification preferences
              </p>
            </div>
          </div>
          <div className="space-y-4">
            {notifications.map((notification) => (
              <div
                key={notification.key}
                className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0"
              >
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {notification.label}
                  </p>
                  <p className="text-xs text-gray-500">
                    {notification.description}
                  </p>
                </div>
                <button
                  onClick={() => toggleNotification(notification.key)}
                  className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-aura-primary focus:ring-offset-2 ${
                    notification.enabled ? "bg-aura-primary" : "bg-gray-200"
                  }`}
                  role="switch"
                  aria-checked={notification.enabled}
                  aria-label={`Toggle ${notification.label}`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                      notification.enabled ? "translate-x-5" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>
            ))}
          </div>
        </Card>

        {/* Integrations */}
        <Card padding="md">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-lg bg-aura-primary/10">
              <Plug className="w-5 h-5 text-aura-primary" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                Integrations
              </h2>
              <p className="text-sm text-gray-500">
                Connected services and APIs
              </p>
            </div>
          </div>
          <div className="space-y-4">
            {integrations.map((integration) => (
              <div
                key={integration.name}
                className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0"
              >
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {integration.name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {integration.description}
                  </p>
                </div>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-700">
                  <CheckCircle className="w-3 h-3" />
                  Connected
                </span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </>
  );
}
