"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks";
import { Loader2 } from "lucide-react";

export default function B2BLoginPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading, profile } = useAuth();

  useEffect(() => {
    if (isLoading) return;

    if (isAuthenticated && (profile?.role === "dealer" || profile?.role === "admin")) {
      router.push("/b2b/portal");
    } else if (isAuthenticated) {
      // Authenticated but not a dealer
      router.push("/b2b");
    } else {
      router.push("/auth/login?redirectTo=/b2b/portal");
    }
  }, [isAuthenticated, isLoading, profile, router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <Loader2 className="w-8 h-8 animate-spin text-aura-primary" />
    </div>
  );
}
