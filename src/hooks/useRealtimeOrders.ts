"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Order } from "@/types/database";
import type { RealtimeChannel } from "@supabase/supabase-js";

interface UseRealtimeOrdersReturn {
  orders: Order[];
  isConnected: boolean;
  lastUpdate: Date | null;
}

export function useRealtimeOrders(userId: string): UseRealtimeOrdersReturn {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const supabase = createClient();

  const fetchOrders = useCallback(async () => {
    if (!userId) return;
    const { data, error } = await supabase
      .from("aura_orders")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(20);

    if (!error && data) {
      setOrders(data as Order[]);
    }
  }, [userId, supabase]);

  useEffect(() => {
    if (!userId) return;

    fetchOrders();

    const channel = supabase
      .channel(`orders-${userId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "aura_orders",
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          setLastUpdate(new Date());

          if (payload.eventType === "INSERT") {
            const newOrder = payload.new as Order;
            setOrders((prev) => [newOrder, ...prev]);
          } else if (payload.eventType === "UPDATE") {
            const updatedOrder = payload.new as Order;
            setOrders((prev) =>
              prev.map((o) => (o.id === updatedOrder.id ? updatedOrder : o))
            );
          } else if (payload.eventType === "DELETE") {
            const deletedId = (payload.old as { id: string }).id;
            setOrders((prev) => prev.filter((o) => o.id !== deletedId));
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
  }, [userId, supabase, fetchOrders]);

  return { orders, isConnected, lastUpdate };
}
