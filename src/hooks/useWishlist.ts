"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "./useAuth";

interface WishlistItem {
  id: string;
  user_id: string;
  product_id: string;
  created_at: string;
}

interface UseWishlistReturn {
  items: WishlistItem[];
  isLoading: boolean;
  toggle: (productId: string) => Promise<void>;
  isWishlisted: (productId: string) => boolean;
  remove: (productId: string) => Promise<void>;
}

export function useWishlist(): UseWishlistReturn {
  const { user, isAuthenticated } = useAuth();
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const wishlistSetRef = useRef<Set<string>>(new Set());
  const supabase = createClient();

  const fetchWishlist = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("wishlists")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (!error && data) {
        setItems(data as WishlistItem[]);
        wishlistSetRef.current = new Set(data.map((d) => d.product_id));
      }
    } catch {
      // silently fail
    } finally {
      setIsLoading(false);
    }
  }, [user, supabase]);

  useEffect(() => {
    if (isAuthenticated && user) {
      fetchWishlist();
    } else {
      setItems([]);
      wishlistSetRef.current = new Set();
    }
  }, [isAuthenticated, user, fetchWishlist]);

  const isWishlisted = useCallback((productId: string): boolean => {
    return wishlistSetRef.current.has(productId);
  }, []);

  const toggle = useCallback(
    async (productId: string) => {
      if (!user) return;

      const wasWishlisted = wishlistSetRef.current.has(productId);

      // Optimistic update
      if (wasWishlisted) {
        wishlistSetRef.current.delete(productId);
        setItems((prev) => prev.filter((i) => i.product_id !== productId));
      } else {
        const optimisticItem: WishlistItem = {
          id: crypto.randomUUID(),
          user_id: user.id,
          product_id: productId,
          created_at: new Date().toISOString(),
        };
        wishlistSetRef.current.add(productId);
        setItems((prev) => [optimisticItem, ...prev]);
      }

      try {
        if (wasWishlisted) {
          const { error } = await supabase
            .from("wishlists")
            .delete()
            .eq("user_id", user.id)
            .eq("product_id", productId);

          if (error) throw error;
        } else {
          const { data, error } = await supabase
            .from("wishlists")
            .insert({ user_id: user.id, product_id: productId })
            .select()
            .single();

          if (error) throw error;

          // Replace optimistic item with real one
          if (data) {
            setItems((prev) =>
              prev.map((i) =>
                i.product_id === productId ? (data as WishlistItem) : i
              )
            );
          }
        }
      } catch {
        // Revert optimistic update on error
        if (wasWishlisted) {
          wishlistSetRef.current.add(productId);
          fetchWishlist();
        } else {
          wishlistSetRef.current.delete(productId);
          setItems((prev) => prev.filter((i) => i.product_id !== productId));
        }
      }
    },
    [user, supabase, fetchWishlist]
  );

  const remove = useCallback(
    async (productId: string) => {
      if (!user) return;

      // Optimistic removal
      wishlistSetRef.current.delete(productId);
      setItems((prev) => prev.filter((i) => i.product_id !== productId));

      try {
        const { error } = await supabase
          .from("wishlists")
          .delete()
          .eq("user_id", user.id)
          .eq("product_id", productId);

        if (error) throw error;
      } catch {
        // Revert on error
        wishlistSetRef.current.add(productId);
        fetchWishlist();
      }
    },
    [user, supabase, fetchWishlist]
  );

  return { items, isLoading, toggle, isWishlisted, remove };
}
