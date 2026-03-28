"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import type { InteractionLog } from "@/types/database";
import type { RealtimeChannel } from "@supabase/supabase-js";

interface Notification {
  id: string;
  channel: string;
  content: string;
  content_type: string;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

interface UseRealtimeNotificationsReturn {
  notifications: Notification[];
  unreadCount: number;
  isConnected: boolean;
  markAsRead: (ids: string[]) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  refresh: () => Promise<void>;
}

export function useRealtimeNotifications(
  userId: string
): UseRealtimeNotificationsReturn {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isConnected, setIsConnected] = useState(false);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const supabase = createClient();

  const fetchNotifications = useCallback(async () => {
    if (!userId) return;
    try {
      const res = await fetch("/api/notifications?page=1&pageSize=20");
      if (!res.ok) return;
      const data = await res.json();
      if (data.success) {
        setNotifications(data.data.items);
        setUnreadCount(data.data.unreadCount);
      }
    } catch {
      // silently fail
    }
  }, [userId]);

  const markAsRead = useCallback(
    async (ids: string[]) => {
      if (ids.length === 0) return;
      try {
        const res = await fetch("/api/notifications", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ids }),
        });
        if (res.ok) {
          setNotifications((prev) =>
            prev.map((n) =>
              ids.includes(n.id)
                ? { ...n, metadata: { ...n.metadata, read: true } }
                : n
            )
          );
          setUnreadCount((prev) => Math.max(0, prev - ids.length));
        }
      } catch {
        // silently fail
      }
    },
    []
  );

  const markAllAsRead = useCallback(async () => {
    const unreadIds = notifications
      .filter((n) => !n.metadata?.read)
      .map((n) => n.id);
    await markAsRead(unreadIds);
  }, [notifications, markAsRead]);

  useEffect(() => {
    if (!userId) return;

    fetchNotifications();

    const channel = supabase
      .channel(`notifications-${userId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "omni_interaction_log",
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          const newEntry = payload.new as InteractionLog;
          const notification: Notification = {
            id: newEntry.id,
            channel: newEntry.channel,
            content: newEntry.content,
            content_type: newEntry.content_type,
            metadata: newEntry.metadata as Record<string, unknown> | null,
            created_at: newEntry.created_at,
          };

          setNotifications((prev) => [notification, ...prev.slice(0, 19)]);
          setUnreadCount((prev) => prev + 1);

          // Attempt subtle vibration on mobile
          if (typeof navigator !== "undefined" && navigator.vibrate) {
            navigator.vibrate(100);
          }

          // Play subtle notification sound
          try {
            const audioCtx = new AudioContext();
            const oscillator = audioCtx.createOscillator();
            const gainNode = audioCtx.createGain();
            oscillator.connect(gainNode);
            gainNode.connect(audioCtx.destination);
            oscillator.frequency.value = 800;
            oscillator.type = "sine";
            gainNode.gain.value = 0.05;
            gainNode.gain.exponentialRampToValueAtTime(
              0.001,
              audioCtx.currentTime + 0.3
            );
            oscillator.start();
            oscillator.stop(audioCtx.currentTime + 0.3);
          } catch {
            // Audio not supported or blocked
          }
        }
      )
      .subscribe((status) => {
        setIsConnected(status === "SUBSCRIBED");
      });

    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [userId, supabase, fetchNotifications]);

  return {
    notifications,
    unreadCount,
    isConnected,
    markAsRead,
    markAllAsRead,
    refresh: fetchNotifications,
  };
}
