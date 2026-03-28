"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  Bell,
  Mail,
  MessageSquare,
  Globe,
  Mic,
  Bot,
  Check,
  X,
  Wifi,
  WifiOff,
} from "lucide-react";
import { useAuth, useRealtimeNotifications } from "@/hooks";
import { cn } from "@/lib/utils";

interface Notification {
  id: string;
  channel: string;
  content: string;
  content_type: string;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

function getChannelIcon(channel: string) {
  switch (channel) {
    case "email":
      return <Mail className="w-4 h-4 text-blue-500 shrink-0" />;
    case "sms":
      return <MessageSquare className="w-4 h-4 text-green-500 shrink-0" />;
    case "web":
      return <Globe className="w-4 h-4 text-purple-500 shrink-0" />;
    case "voice":
      return <Mic className="w-4 h-4 text-orange-500 shrink-0" />;
    case "ai_bot":
      return <Bot className="w-4 h-4 text-cyan-500 shrink-0" />;
    default:
      return <Bell className="w-4 h-4 text-gray-500 shrink-0" />;
  }
}

function relativeTime(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diffSec = Math.floor((now - then) / 1000);

  if (diffSec < 60) return "just now";
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.floor(diffHr / 24);
  if (diffDay < 7) return `${diffDay}d ago`;
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

function truncateContent(content: string, maxLength: number = 80): string {
  if (content.length <= maxLength) return content;
  return content.slice(0, maxLength) + "...";
}

export function NotificationCenter() {
  const { user, isAuthenticated } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const {
    notifications,
    unreadCount,
    isConnected,
    markAllAsRead,
    refresh,
  } = useRealtimeNotifications(user?.id || "");

  // Close on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  if (!isAuthenticated) return null;

  const handleMarkAllRead = async () => {
    await markAllAsRead();
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => {
          setIsOpen(!isOpen);
          if (!isOpen) refresh();
        }}
        className="relative p-2.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors"
        aria-label={`Notifications${unreadCount > 0 ? `, ${unreadCount} unread` : ""}`}
      >
        <Bell className={cn("w-5 h-5", unreadCount > 0 && "animate-[wiggle_0.3s_ease-in-out]")} />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex items-center justify-center w-5 h-5 text-[10px] font-bold text-white bg-red-500 rounded-full animate-in zoom-in duration-200">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-white rounded-xl shadow-lg border border-gray-200 z-50 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-gray-900">
                Notifications
              </h3>
              {isConnected ? (
                <Wifi className="w-3 h-3 text-green-500" aria-label="Live updates active" />
              ) : (
                <WifiOff className="w-3 h-3 text-gray-300" aria-label="Live updates disconnected" />
              )}
            </div>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllRead}
                  className="text-xs text-aura-accent hover:underline flex items-center gap-1"
                >
                  <Check className="w-3 h-3" />
                  Mark all read
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 text-gray-400 hover:text-gray-600 rounded"
                aria-label="Close notifications"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Notification List */}
          <div className="max-h-[360px] overflow-y-auto">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="w-5 h-5 border-2 border-gray-300 border-t-aura-accent rounded-full animate-spin" />
              </div>
            ) : notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-gray-400">
                <Bell className="w-8 h-8 mb-2" />
                <p className="text-sm">No notifications yet</p>
              </div>
            ) : (
              notifications.map((notification) => {
                const isRead = !!notification.metadata?.read;
                return (
                  <div
                    key={notification.id}
                    className={cn(
                      "flex items-start gap-3 px-4 py-3 border-b border-gray-50 transition-colors hover:bg-gray-50",
                      !isRead && "bg-blue-50/40"
                    )}
                  >
                    <div className="mt-0.5">
                      {getChannelIcon(notification.channel)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p
                        className={cn(
                          "text-sm leading-snug",
                          isRead ? "text-gray-600" : "text-gray-900 font-medium"
                        )}
                      >
                        {truncateContent(notification.content)}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        {relativeTime(notification.created_at)}
                      </p>
                    </div>
                    {!isRead && (
                      <span className="w-2 h-2 bg-aura-accent rounded-full mt-2 shrink-0" />
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-gray-100 px-4 py-2.5">
            <Link
              href="/account/notifications"
              className="block text-center text-sm font-medium text-aura-accent hover:underline"
              onClick={() => setIsOpen(false)}
            >
              View all notifications
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
