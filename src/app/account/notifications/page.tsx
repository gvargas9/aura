"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Bell,
  Mail,
  MessageSquare,
  Globe,
  Mic,
  Bot,
  Save,
  Loader2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useAuth } from "@/hooks";
import { cn, formatDate } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import Link from "next/link";

interface NotificationPreferences {
  order_updates_email: boolean;
  shipping_email: boolean;
  shipping_sms: boolean;
  subscription_reminders_email: boolean;
  promotions_email: boolean;
  delivery_sms: boolean;
}

const DEFAULT_PREFERENCES: NotificationPreferences = {
  order_updates_email: true,
  shipping_email: true,
  shipping_sms: false,
  subscription_reminders_email: true,
  promotions_email: true,
  delivery_sms: true,
};

interface Notification {
  id: string;
  channel: string;
  content: string;
  content_type: string;
  intent: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

function getChannelIcon(channel: string) {
  switch (channel) {
    case "email":
      return <Mail className="w-4 h-4 text-blue-500" />;
    case "sms":
      return <MessageSquare className="w-4 h-4 text-green-500" />;
    case "web":
      return <Globe className="w-4 h-4 text-purple-500" />;
    case "voice":
      return <Mic className="w-4 h-4 text-orange-500" />;
    case "ai_bot":
      return <Bot className="w-4 h-4 text-cyan-500" />;
    default:
      return <Bell className="w-4 h-4 text-gray-500" />;
  }
}

function getChannelLabel(channel: string) {
  switch (channel) {
    case "email":
      return "Email";
    case "sms":
      return "SMS";
    case "web":
      return "Web";
    case "voice":
      return "Voice";
    case "ai_bot":
      return "AI Bot";
    default:
      return channel;
  }
}

function ToggleSwitch({
  checked,
  onChange,
  label,
  description,
}: {
  checked: boolean;
  onChange: (val: boolean) => void;
  label: string;
  description: string;
}) {
  return (
    <div className="flex items-center justify-between py-3">
      <div>
        <p className="text-sm font-medium text-gray-900">{label}</p>
        <p className="text-xs text-gray-500">{description}</p>
      </div>
      <button
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={cn(
          "relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-aura-accent focus:ring-offset-2",
          checked ? "bg-aura-accent" : "bg-gray-200"
        )}
      >
        <span
          className={cn(
            "inline-block h-4 w-4 transform rounded-full bg-white transition-transform",
            checked ? "translate-x-6" : "translate-x-1"
          )}
        />
      </button>
    </div>
  );
}

export default function NotificationsPage() {
  const { profile, updateProfile, isLoading: authLoading } = useAuth();
  const [preferences, setPreferences] =
    useState<NotificationPreferences>(DEFAULT_PREFERENCES);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  // Load preferences from profile metadata
  useEffect(() => {
    if (profile?.metadata) {
      const meta = profile.metadata as Record<string, unknown>;
      const saved = meta.notification_preferences as
        | Partial<NotificationPreferences>
        | undefined;
      if (saved) {
        setPreferences({ ...DEFAULT_PREFERENCES, ...saved });
      }
    }
  }, [profile]);

  const fetchHistory = useCallback(async (pageNum: number) => {
    setIsLoadingHistory(true);
    try {
      const res = await fetch(
        `/api/notifications?page=${pageNum}&pageSize=15`
      );
      if (!res.ok) return;
      const data = await res.json();
      if (data.success) {
        setNotifications(data.data.items);
        setTotalPages(data.data.totalPages);
      }
    } catch {
      // silently fail
    } finally {
      setIsLoadingHistory(false);
    }
  }, []);

  useEffect(() => {
    if (!authLoading && profile) {
      fetchHistory(page);
    }
  }, [authLoading, profile, page, fetchHistory]);

  const handleSave = async () => {
    setIsSaving(true);
    setSaveSuccess(false);
    try {
      const currentMeta =
        (profile?.metadata as Record<string, unknown>) || {};
      await updateProfile({
        metadata: {
          ...currentMeta,
          notification_preferences: preferences,
        } as unknown as import("@/types/database").Json,
      });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch {
      // handle error
    } finally {
      setIsSaving(false);
    }
  };

  const updatePref = (key: keyof NotificationPreferences, val: boolean) => {
    setPreferences((prev) => ({ ...prev, [key]: val }));
  };

  if (authLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-aura-accent" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="mb-6">
        <Link
          href="/account"
          className="text-sm text-gray-500 hover:text-gray-700 mb-2 inline-block"
        >
          &larr; Back to Account
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
        <p className="text-gray-500 text-sm mt-1">
          Manage your notification preferences and view history.
        </p>
      </div>

      {/* Preferences */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="text-lg">Notification Preferences</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="divide-y divide-gray-100">
            <ToggleSwitch
              checked={preferences.order_updates_email}
              onChange={(val) => updatePref("order_updates_email", val)}
              label="Order updates"
              description="Email notifications for order confirmations and status changes"
            />
            <ToggleSwitch
              checked={preferences.shipping_email}
              onChange={(val) => updatePref("shipping_email", val)}
              label="Shipping notifications (Email)"
              description="Email alerts when your order ships and tracking updates"
            />
            <ToggleSwitch
              checked={preferences.shipping_sms}
              onChange={(val) => updatePref("shipping_sms", val)}
              label="Shipping notifications (SMS)"
              description="Text messages for shipping and tracking updates"
            />
            <ToggleSwitch
              checked={preferences.subscription_reminders_email}
              onChange={(val) =>
                updatePref("subscription_reminders_email", val)
              }
              label="Subscription reminders"
              description="Email reminders to customize your box before the cutoff date"
            />
            <ToggleSwitch
              checked={preferences.promotions_email}
              onChange={(val) => updatePref("promotions_email", val)}
              label="Promotions"
              description="Email about new products, deals, and special offers"
            />
            <ToggleSwitch
              checked={preferences.delivery_sms}
              onChange={(val) => updatePref("delivery_sms", val)}
              label="Delivery confirmations (SMS)"
              description="Text message when your box has been delivered"
            />
          </div>

          <div className="flex items-center gap-3 mt-6 pt-4 border-t border-gray-100">
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <Save className="w-4 h-4 mr-2" />
              )}
              Save Preferences
            </Button>
            {saveSuccess && (
              <span className="text-sm text-green-600 font-medium">
                Preferences saved!
              </span>
            )}
          </div>
        </CardContent>
      </Card>

      {/* History */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Notification History</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoadingHistory ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-5 h-5 animate-spin text-aura-accent" />
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-gray-400">
              <Bell className="w-10 h-10 mb-3" />
              <p className="text-sm">No notifications yet</p>
            </div>
          ) : (
            <>
              <div className="divide-y divide-gray-100">
                {notifications.map((n) => {
                  const isRead = !!(n.metadata as Record<string, unknown>)
                    ?.read;
                  return (
                    <div
                      key={n.id}
                      className={cn(
                        "flex items-start gap-3 py-3",
                        !isRead && "bg-blue-50/30 -mx-4 px-4 rounded-lg"
                      )}
                    >
                      <div className="mt-0.5">
                        {getChannelIcon(n.channel)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p
                          className={cn(
                            "text-sm",
                            isRead
                              ? "text-gray-600"
                              : "text-gray-900 font-medium"
                          )}
                        >
                          {n.content}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs text-gray-400">
                            {formatDate(n.created_at)}
                          </span>
                          <span className="text-xs text-gray-300">
                            &middot;
                          </span>
                          <span className="text-xs text-gray-400">
                            {getChannelLabel(n.channel)}
                          </span>
                          {n.intent && (
                            <>
                              <span className="text-xs text-gray-300">
                                &middot;
                              </span>
                              <span className="text-xs text-gray-400 capitalize">
                                {n.intent.replace(/_/g, " ")}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                      {!isRead && (
                        <span className="w-2 h-2 bg-aura-accent rounded-full mt-2 shrink-0" />
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-100">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page <= 1}
                    className="flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    Previous
                  </button>
                  <span className="text-sm text-gray-500">
                    Page {page} of {totalPages}
                  </span>
                  <button
                    onClick={() =>
                      setPage((p) => Math.min(totalPages, p + 1))
                    }
                    disabled={page >= totalPages}
                    className="flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    Next
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
