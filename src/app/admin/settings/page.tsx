"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, Button, Input } from "@/components/ui";
import { createClient } from "@/lib/supabase/client";
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
  Loader2,
  Save,
  X,
  Pencil,
} from "lucide-react";

interface AppSetting {
  key: string;
  value: unknown;
  category: string;
  description: string | null;
  updated_at: string;
}

interface ToggleSetting {
  key: string;
  label: string;
  description: string;
  enabled: boolean;
}

const NOTIFICATION_META: Record<string, { label: string; description: string }> = {
  notify_order_confirmation: {
    label: "Order Confirmation",
    description: "Send email when a new order is placed",
  },
  notify_shipping_updates: {
    label: "Shipping Updates",
    description: "Notify customers when their order ships",
  },
  notify_low_stock: {
    label: "Low Stock Alerts",
    description: "Alert admins when inventory falls below safety stock",
  },
};

const GENERAL_FIELDS = [
  { key: "store_name", label: "Store Name", description: "Public-facing store name", icon: Store },
  { key: "support_email", label: "Support Email", description: "Customer support contact", icon: Mail },
  { key: "store_timezone", label: "Store Timezone", description: "Used for scheduling and reports", icon: Clock },
];

const SHIPPING_FIELDS = [
  { key: "default_warehouse", label: "Default Warehouse", description: "Primary ship-from location", icon: MapPin },
  { key: "free_shipping_threshold", label: "Free Shipping Threshold", description: "Minimum order for free shipping", icon: DollarSign },
  { key: "carrier_preference", label: "Carrier Preference", description: "Default shipping carrier", icon: Package },
];

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<Record<string, unknown>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [editing, setEditing] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [error, setError] = useState<string | null>(null);

  const supabase = createClient();

  const fetchSettings = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("app_settings")
        .select("*")
        .order("category");

      if (error) throw error;

      const map: Record<string, unknown> = {};
      for (const row of data || []) {
        map[row.key] = row.value;
      }
      setSettings(map);
    } catch {
      // Table may not exist yet — use defaults
      setSettings({
        store_name: "Aura",
        support_email: "hello@aura.com",
        store_timezone: "America/Chicago",
        default_warehouse: "El Paso, TX",
        free_shipping_threshold: 0,
        carrier_preference: "EasyPost",
        notify_order_confirmation: true,
        notify_shipping_updates: true,
        notify_low_stock: true,
      });
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const updateSetting = async (key: string, value: unknown) => {
    setSaving(key);
    setError(null);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key, value }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to save");
      }

      setSettings((prev) => ({ ...prev, [key]: value }));
      setEditing(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save setting");
    } finally {
      setSaving(null);
    }
  };

  const toggleNotification = (key: string) => {
    const current = settings[key] as boolean;
    updateSetting(key, !current);
  };

  const startEditing = (key: string) => {
    setEditing(key);
    const val = settings[key];
    setEditValue(typeof val === "string" ? val : String(val ?? ""));
  };

  const saveEdit = () => {
    if (editing) {
      const val = editing === "free_shipping_threshold" ? Number(editValue) : editValue;
      updateSetting(editing, val);
    }
  };

  const cancelEdit = () => {
    setEditing(null);
    setEditValue("");
  };

  const formatValue = (key: string, value: unknown): string => {
    if (key === "free_shipping_threshold") {
      return Number(value) === 0 ? "$0 (all orders)" : `$${value}`;
    }
    return String(value ?? "");
  };

  const integrations = [
    { name: "Stripe", description: "Payment processing", connected: true },
    { name: "n8n", description: "Workflow automation", connected: true },
    { name: "Business Manager", description: "CRM integration", connected: true },
    { name: "Supabase", description: "Database & auth", connected: true },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-aura-primary" />
      </div>
    );
  }

  return (
    <>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-600">Manage application settings</p>
      </div>

      {error && (
        <div className="flex items-center gap-3 p-4 mb-6 rounded-xl bg-red-50 border border-red-200 text-red-800">
          <Info className="w-5 h-5 flex-shrink-0" />
          <p className="text-sm">{error}</p>
          <button onClick={() => setError(null)} className="ml-auto">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      <div className="space-y-6">
        {/* General Settings */}
        <Card padding="md">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-lg bg-aura-primary/10">
              <Store className="w-5 h-5 text-aura-primary" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">General Settings</h2>
              <p className="text-sm text-gray-500">Basic store configuration</p>
            </div>
          </div>
          <div className="space-y-4">
            {GENERAL_FIELDS.map((field, i) => (
              <div
                key={field.key}
                className={`flex items-center justify-between py-3 ${
                  i < GENERAL_FIELDS.length - 1 ? "border-b border-gray-100" : ""
                }`}
              >
                <div className="flex items-center gap-3">
                  <field.icon className="w-4 h-4 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">{field.label}</p>
                    <p className="text-xs text-gray-500">{field.description}</p>
                  </div>
                </div>
                {editing === field.key ? (
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-aura-primary/20 focus:border-aura-primary outline-none w-48"
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === "Enter") saveEdit();
                        if (e.key === "Escape") cancelEdit();
                      }}
                    />
                    <button
                      onClick={saveEdit}
                      disabled={saving === field.key}
                      className="p-1.5 text-aura-primary hover:bg-aura-primary/10 rounded-lg"
                    >
                      {saving === field.key ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Save className="w-4 h-4" />
                      )}
                    </button>
                    <button
                      onClick={cancelEdit}
                      className="p-1.5 text-gray-400 hover:bg-gray-100 rounded-lg"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-700 font-medium">
                      {formatValue(field.key, settings[field.key])}
                    </span>
                    <button
                      onClick={() => startEditing(field.key)}
                      className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            ))}
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
              <p className="text-sm text-gray-500">Shipping and fulfillment configuration</p>
            </div>
          </div>
          <div className="space-y-4">
            {SHIPPING_FIELDS.map((field, i) => (
              <div
                key={field.key}
                className={`flex items-center justify-between py-3 ${
                  i < SHIPPING_FIELDS.length - 1 ? "border-b border-gray-100" : ""
                }`}
              >
                <div className="flex items-center gap-3">
                  <field.icon className="w-4 h-4 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">{field.label}</p>
                    <p className="text-xs text-gray-500">{field.description}</p>
                  </div>
                </div>
                {editing === field.key ? (
                  <div className="flex items-center gap-2">
                    <input
                      type={field.key === "free_shipping_threshold" ? "number" : "text"}
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-aura-primary/20 focus:border-aura-primary outline-none w-48"
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === "Enter") saveEdit();
                        if (e.key === "Escape") cancelEdit();
                      }}
                    />
                    <button
                      onClick={saveEdit}
                      disabled={saving === field.key}
                      className="p-1.5 text-aura-primary hover:bg-aura-primary/10 rounded-lg"
                    >
                      {saving === field.key ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Save className="w-4 h-4" />
                      )}
                    </button>
                    <button
                      onClick={cancelEdit}
                      className="p-1.5 text-gray-400 hover:bg-gray-100 rounded-lg"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-700 font-medium">
                      {formatValue(field.key, settings[field.key])}
                    </span>
                    <button
                      onClick={() => startEditing(field.key)}
                      className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </Card>

        {/* Notifications */}
        <Card padding="md">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-lg bg-aura-primary/10">
              <Bell className="w-5 h-5 text-aura-primary" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Notifications</h2>
              <p className="text-sm text-gray-500">Email notification preferences</p>
            </div>
          </div>
          <div className="space-y-4">
            {Object.entries(NOTIFICATION_META).map(([key, meta]) => (
              <div
                key={key}
                className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0"
              >
                <div>
                  <p className="text-sm font-medium text-gray-900">{meta.label}</p>
                  <p className="text-xs text-gray-500">{meta.description}</p>
                </div>
                <button
                  onClick={() => toggleNotification(key)}
                  disabled={saving === key}
                  className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-aura-primary focus:ring-offset-2 ${
                    settings[key] ? "bg-aura-primary" : "bg-gray-200"
                  } ${saving === key ? "opacity-50" : ""}`}
                  role="switch"
                  aria-checked={Boolean(settings[key])}
                  aria-label={`Toggle ${meta.label}`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                      settings[key] ? "translate-x-5" : "translate-x-0"
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
              <h2 className="text-lg font-semibold text-gray-900">Integrations</h2>
              <p className="text-sm text-gray-500">Connected services and APIs</p>
            </div>
          </div>
          <div className="space-y-4">
            {integrations.map((integration) => (
              <div
                key={integration.name}
                className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0"
              >
                <div>
                  <p className="text-sm font-medium text-gray-900">{integration.name}</p>
                  <p className="text-xs text-gray-500">{integration.description}</p>
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
