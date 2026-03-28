"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Loader2 } from "lucide-react";

export default function ReferralPage() {
  const params = useParams();
  const router = useRouter();
  const [error, setError] = useState(false);
  const code = params.code as string;

  useEffect(() => {
    if (!code) {
      router.push("/");
      return;
    }

    const processReferral = async () => {
      const supabase = createClient();

      // Validate the referral code exists
      const { data: dealerData } = await supabase
        .from("dealers")
        .select("id, organization_id, referral_code")
        .eq("referral_code", code)
        .eq("is_active", true)
        .maybeSingle();

      if (!dealerData) {
        setError(true);
        // Still redirect to build-box after a delay, just without referral
        setTimeout(() => router.push("/build-box"), 2000);
        return;
      }

      // Fetch organization name for the banner
      let orgName = "";
      if (dealerData.organization_id) {
        const { data: orgData } = await supabase
          .from("organizations")
          .select("name")
          .eq("id", dealerData.organization_id)
          .single();

        if (orgData) {
          orgName = orgData.name;
        }
      }

      // Store referral info in localStorage
      localStorage.setItem("aura_referral_code", code);
      localStorage.setItem("aura_referral_dealer_id", dealerData.id);
      if (orgName) {
        localStorage.setItem("aura_referral_org_name", orgName);
      }

      // Redirect to build-box
      router.push("/build-box");
    };

    processReferral();
  }, [code, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-white to-aura-light">
      <div className="text-center px-4">
        {error ? (
          <>
            <p className="text-gray-500 mb-2">Invalid or expired referral code.</p>
            <p className="text-sm text-gray-400">Redirecting you to our store...</p>
          </>
        ) : (
          <>
            <Loader2 className="w-8 h-8 animate-spin text-aura-primary mx-auto mb-4" />
            <p className="text-gray-600 font-medium">Processing your referral...</p>
            <p className="text-sm text-gray-400 mt-1">You&apos;ll be redirected shortly</p>
          </>
        )}
      </div>
    </div>
  );
}
