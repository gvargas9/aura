"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Inventory } from "@/types/database";
import type { RealtimeChannel } from "@supabase/supabase-js";

interface InventoryWithHighlight extends Inventory {
  _justChanged?: boolean;
  _belowSafety?: boolean;
}

interface UseRealtimeInventoryReturn {
  inventory: InventoryWithHighlight[];
  isConnected: boolean;
  lowStockAlerts: InventoryWithHighlight[];
  lastUpdate: Date | null;
}

export function useRealtimeInventory(): UseRealtimeInventoryReturn {
  const [inventory, setInventory] = useState<InventoryWithHighlight[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [lowStockAlerts, setLowStockAlerts] = useState<InventoryWithHighlight[]>([]);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const highlightTimeouts = useRef<Map<string, NodeJS.Timeout>>(new Map());
  const supabase = createClient();

  const checkLowStock = useCallback((items: InventoryWithHighlight[]) => {
    const alerts = items.filter(
      (item) => item.quantity <= (item.safety_stock ?? 0)
    );
    setLowStockAlerts(alerts);
  }, []);

  const fetchInventory = useCallback(async () => {
    const { data, error } = await supabase
      .from("inventory")
      .select("*")
      .order("updated_at", { ascending: false });

    if (!error && data) {
      const items = (data as Inventory[]).map((item) => ({
        ...item,
        _justChanged: false,
        _belowSafety: item.quantity <= (item.safety_stock ?? 0),
      }));
      setInventory(items);
      checkLowStock(items);
    }
  }, [supabase, checkLowStock]);

  useEffect(() => {
    fetchInventory();

    const channel = supabase
      .channel("inventory-realtime")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "inventory",
        },
        (payload) => {
          setLastUpdate(new Date());

          if (payload.eventType === "INSERT") {
            const newItem = payload.new as Inventory;
            const highlighted: InventoryWithHighlight = {
              ...newItem,
              _justChanged: true,
              _belowSafety: newItem.quantity <= (newItem.safety_stock ?? 0),
            };
            setInventory((prev) => {
              const updated = [highlighted, ...prev];
              checkLowStock(updated);
              return updated;
            });
            clearHighlightAfterDelay(newItem.id);
          } else if (payload.eventType === "UPDATE") {
            const updatedItem = payload.new as Inventory;
            const highlighted: InventoryWithHighlight = {
              ...updatedItem,
              _justChanged: true,
              _belowSafety: updatedItem.quantity <= (updatedItem.safety_stock ?? 0),
            };
            setInventory((prev) => {
              const updated = prev.map((item) =>
                item.id === updatedItem.id ? highlighted : item
              );
              checkLowStock(updated);
              return updated;
            });
            clearHighlightAfterDelay(updatedItem.id);
          } else if (payload.eventType === "DELETE") {
            const deletedId = (payload.old as { id: string }).id;
            setInventory((prev) => {
              const updated = prev.filter((item) => item.id !== deletedId);
              checkLowStock(updated);
              return updated;
            });
          }
        }
      )
      .subscribe((status) => {
        setIsConnected(status === "SUBSCRIBED");
      });

    channelRef.current = channel;

    return () => {
      highlightTimeouts.current.forEach((timeout) => clearTimeout(timeout));
      highlightTimeouts.current.clear();
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [supabase, fetchInventory, checkLowStock]);

  function clearHighlightAfterDelay(itemId: string) {
    const existing = highlightTimeouts.current.get(itemId);
    if (existing) clearTimeout(existing);

    const timeout = setTimeout(() => {
      setInventory((prev) =>
        prev.map((item) =>
          item.id === itemId ? { ...item, _justChanged: false } : item
        )
      );
      highlightTimeouts.current.delete(itemId);
    }, 3000);

    highlightTimeouts.current.set(itemId, timeout);
  }

  return { inventory, isConnected, lowStockAlerts, lastUpdate };
}
