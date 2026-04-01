"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Bell,
  Mail,
  MessageSquare,
  Globe,
  Mic,
  Bot,
  Send,
  Search,
  Filter,
  Loader2,
  ChevronLeft,
  ChevronRight,
  BarChart3,
} from "lucide-react";
import { useAuth } from "@/hooks";
import { useLocale } from "@/hooks/useLocale";
import { createClient } from "@/lib/supabase/client";
import { cn, formatDate } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";

type ChannelFilter = "all" | "email" | "sms" | "web" | "voice" | "ai_bot";

interface NotificationRecord {
  id: string;
  user_id: string | null;
  channel: string;
  direction: string;
  content: string;
  content_type: string;
  intent: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

interface ChannelStats {
  total: number;
  email: number;
  sms: number;
  web: number;
  voice: number;
  ai_bot: number;
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

const CHANNEL_OPTIONS: ChannelFilter[] = [
  "all",
  "email",
  "sms",
  "web",
  "voice",
  "ai_bot",
];

export default function AdminNotificationsPage() {
  const { profile } = useAuth();
  const { t } = useLocale();
  const supabase = createClient();

  const [notifications, setNotifications] = useState<NotificationRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [channelFilter, setChannelFilter] = useState<ChannelFilter>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [stats, setStats] = useState<ChannelStats>({
    total: 0,
    email: 0,
    sms: 0,
    web: 0,
    voice: 0,
    ai_bot: 0,
  });

  // Send form state
  const [sendEmail, setSendEmail] = useState("");
  const [sendChannel, setSendChannel] = useState<string>("email");
  const [sendSubject, setSendSubject] = useState("");
  const [sendMessage, setSendMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [sendSuccess, setSendSuccess] = useState(false);
  const [sendError, setSendError] = useState("");

  const pageSize = 20;

  const fetchStats = useCallback(async () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayISO = today.toISOString();

    const { count: totalCount } = await supabase
      .from("omni_interaction_log")
      .select("*", { count: "exact", head: true })
      .eq("direction", "outbound")
      .gte("created_at", todayISO);

    const channels = ["email", "sms", "web", "voice", "ai_bot"] as const;
    const channelCounts: Record<string, number> = {};

    await Promise.all(
      channels.map(async (ch) => {
        const { count } = await supabase
          .from("omni_interaction_log")
          .select("*", { count: "exact", head: true })
          .eq("direction", "outbound")
          .eq("channel", ch)
          .gte("created_at", todayISO);
        channelCounts[ch] = count || 0;
      })
    );

    setStats({
      total: totalCount || 0,
      email: channelCounts.email || 0,
      sms: channelCounts.sms || 0,
      web: channelCounts.web || 0,
      voice: channelCounts.voice || 0,
      ai_bot: channelCounts.ai_bot || 0,
    });
  }, [supabase]);

  const fetchNotifications = useCallback(async () => {
    setIsLoading(true);
    try {
      let query = supabase
        .from("omni_interaction_log")
        .select("*", { count: "exact" })
        .eq("direction", "outbound")
        .order("created_at", { ascending: false })
        .range((page - 1) * pageSize, page * pageSize - 1);

      if (channelFilter !== "all") {
        query = query.eq("channel", channelFilter);
      }

      if (searchQuery.trim()) {
        query = query.ilike("content", `%${searchQuery.trim()}%`);
      }

      const { data, count, error } = await query;

      if (error) {
        console.error("Fetch notifications error:", error);
        return;
      }

      setNotifications((data as NotificationRecord[]) || []);
      setTotalPages(Math.ceil((count || 0) / pageSize));
    } finally {
      setIsLoading(false);
    }
  }, [supabase, page, channelFilter, searchQuery, pageSize]);

  useEffect(() => {
    fetchStats();
    fetchNotifications();
  }, [fetchStats, fetchNotifications]);

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [channelFilter, searchQuery]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    setSendError("");
    setSendSuccess(false);

    if (!sendEmail.trim() || !sendMessage.trim()) {
      setSendError("Email and message are required.");
      return;
    }

    setIsSending(true);
    try {
      // Look up user by email
      const { data: targetProfile } = await supabase
        .from("profiles")
        .select("id, email")
        .eq("email", sendEmail.trim())
        .single();

      if (!targetProfile) {
        setSendError("User not found with that email address.");
        setIsSending(false);
        return;
      }

      const { error } = await supabase.from("omni_interaction_log").insert({
        user_id: targetProfile.id,
        channel: sendChannel,
        direction: "outbound",
        content: sendSubject
          ? `${sendSubject}: ${sendMessage}`
          : sendMessage,
        content_type: "notification",
        intent: "admin_notification",
        metadata: {
          sent_by: profile?.id,
          sent_by_name: profile?.full_name || profile?.email,
          subject: sendSubject || null,
        },
      });

      if (error) {
        setSendError(error.message);
        return;
      }

      setSendSuccess(true);
      setSendEmail("");
      setSendSubject("");
      setSendMessage("");
      setTimeout(() => setSendSuccess(false), 3000);
      fetchNotifications();
      fetchStats();
    } catch {
      setSendError("Failed to send notification.");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">{t("admin.notifications")}</h1>
        <p className="text-gray-500 text-sm mt-1">
          {t("admin.notificationsSubtitle")}
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-2 mb-1">
            <BarChart3 className="w-4 h-4 text-gray-400" />
            <span className="text-xs text-gray-500 uppercase tracking-wide">
              {t("admin.today")}
            </span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
        </div>
        {(["email", "sms", "web", "voice", "ai_bot"] as const).map((ch) => (
          <div
            key={ch}
            className="bg-white rounded-xl border border-gray-200 p-4"
          >
            <div className="flex items-center gap-2 mb-1">
              {getChannelIcon(ch)}
              <span className="text-xs text-gray-500 uppercase tracking-wide">
                {getChannelLabel(ch)}
              </span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{stats[ch]}</p>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Notification List */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <CardTitle className="text-lg">{t("admin.recentNotifications")}</CardTitle>
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder={t("admin.searchByContent")}
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9 pr-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-aura-accent focus:border-transparent w-48"
                    />
                  </div>
                  <div className="relative">
                    <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <select
                      value={channelFilter}
                      onChange={(e) =>
                        setChannelFilter(e.target.value as ChannelFilter)
                      }
                      className="pl-9 pr-8 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-aura-accent focus:border-transparent appearance-none bg-white"
                    >
                      {CHANNEL_OPTIONS.map((opt) => (
                        <option key={opt} value={opt}>
                          {opt === "all"
                            ? t("admin.allChannels")
                            : getChannelLabel(opt)}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-5 h-5 animate-spin text-aura-accent" />
                </div>
              ) : notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                  <Bell className="w-10 h-10 mb-3" />
                  <p className="text-sm">{t("admin.noNotificationsFound")}</p>
                </div>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-gray-100">
                          <th className="text-left py-2 pr-3 text-xs font-medium text-gray-500 uppercase">
                            {t("admin.channel")}
                          </th>
                          <th className="text-left py-2 pr-3 text-xs font-medium text-gray-500 uppercase">
                            {t("admin.content")}
                          </th>
                          <th className="text-left py-2 pr-3 text-xs font-medium text-gray-500 uppercase hidden sm:table-cell">
                            {t("admin.user")}
                          </th>
                          <th className="text-left py-2 text-xs font-medium text-gray-500 uppercase">
                            {t("admin.date")}
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {notifications.map((n) => (
                          <tr key={n.id} className="hover:bg-gray-50">
                            <td className="py-2.5 pr-3">
                              <div className="flex items-center gap-1.5">
                                {getChannelIcon(n.channel)}
                                <span className="text-xs text-gray-600">
                                  {getChannelLabel(n.channel)}
                                </span>
                              </div>
                            </td>
                            <td className="py-2.5 pr-3">
                              <p className="text-gray-900 truncate max-w-[280px]">
                                {n.content}
                              </p>
                            </td>
                            <td className="py-2.5 pr-3 hidden sm:table-cell">
                              <span className="text-xs text-gray-500 font-mono">
                                {n.user_id
                                  ? n.user_id.slice(0, 8) + "..."
                                  : "System"}
                              </span>
                            </td>
                            <td className="py-2.5">
                              <span className="text-xs text-gray-500 whitespace-nowrap">
                                {formatDate(n.created_at)}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {totalPages > 1 && (
                    <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
                      <button
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                        disabled={page <= 1}
                        className="flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900 disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        <ChevronLeft className="w-4 h-4" />
                        {t("admin.previous")}
                      </button>
                      <span className="text-sm text-gray-500">
                        {t("admin.pageOf", { page: String(page), total: String(totalPages) })}
                      </span>
                      <button
                        onClick={() =>
                          setPage((p) => Math.min(totalPages, p + 1))
                        }
                        disabled={page >= totalPages}
                        className="flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900 disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        {t("admin.next")}
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Send Notification Form */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Send className="w-4 h-4" />
                {t("admin.sendNotification")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSend} className="space-y-4">
                <div>
                  <label
                    htmlFor="send-email"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    {t("admin.userEmail")}
                  </label>
                  <Input
                    id="send-email"
                    type="email"
                    placeholder="user@example.com"
                    value={sendEmail}
                    onChange={(e) => setSendEmail(e.target.value)}
                    required
                  />
                </div>

                <div>
                  <label
                    htmlFor="send-channel"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    {t("admin.channel")}
                  </label>
                  <select
                    id="send-channel"
                    value={sendChannel}
                    onChange={(e) => setSendChannel(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-aura-accent focus:border-transparent bg-white"
                  >
                    <option value="email">Email</option>
                    <option value="sms">SMS</option>
                    <option value="web">Web</option>
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="send-subject"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    {t("admin.subject")}{" "}
                    <span className="text-gray-400 font-normal">
                      ({t("admin.optional")})
                    </span>
                  </label>
                  <Input
                    id="send-subject"
                    type="text"
                    placeholder="Notification subject"
                    value={sendSubject}
                    onChange={(e) => setSendSubject(e.target.value)}
                  />
                </div>

                <div>
                  <label
                    htmlFor="send-message"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    {t("admin.message")}
                  </label>
                  <textarea
                    id="send-message"
                    rows={4}
                    placeholder="Type your notification message..."
                    value={sendMessage}
                    onChange={(e) => setSendMessage(e.target.value)}
                    required
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-aura-accent focus:border-transparent resize-none"
                  />
                </div>

                {sendError && (
                  <p className="text-sm text-red-600">{sendError}</p>
                )}
                {sendSuccess && (
                  <p className="text-sm text-green-600">
                    {t("admin.notificationSent")}
                  </p>
                )}

                <Button
                  type="submit"
                  disabled={isSending}
                  className="w-full"
                >
                  {isSending ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : (
                    <Send className="w-4 h-4 mr-2" />
                  )}
                  {t("admin.sendNotification")}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
