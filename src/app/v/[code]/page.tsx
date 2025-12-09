import { redirect } from "next/navigation";
import { createClient } from "@supabase/supabase-js";

interface Props {
  params: Promise<{ code: string }>;
}

// Create Supabase client for server-side
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default async function ReferralRedirectPage({ params }: Props) {
  const { code } = await params;

  // Look up the dealer by referral code
  const { data: dealer } = await supabase
    .from("dealers")
    .select("*, organizations(*)")
    .eq("referral_code", code)
    .eq("is_active", true)
    .single();

  if (!dealer) {
    // Invalid or inactive code, redirect to homepage
    redirect("/");
  }

  // Store dealer code in cookie/session and redirect to build-box
  // The dealer attribution will be applied at checkout
  redirect(`/build-box?ref=${code}`);
}

export async function generateMetadata({ params }: Props) {
  const { code } = await params;

  const { data: dealer } = await supabase
    .from("dealers")
    .select("*, organizations(name, logo_url)")
    .eq("referral_code", code)
    .eq("is_active", true)
    .single();

  if (!dealer) {
    return {
      title: "Aura - Premium Shelf-Stable Meals",
    };
  }

  const orgName = dealer.organizations?.name || "Aura Partner";

  return {
    title: `Shop with ${orgName} | Aura`,
    description: `Build your custom meal box through ${orgName}. Premium shelf-stable meals delivered to your door.`,
    openGraph: {
      title: `Shop with ${orgName} | Aura`,
      description: `Build your custom meal box through ${orgName}. Premium shelf-stable meals delivered to your door.`,
      images: dealer.organizations?.logo_url ? [dealer.organizations.logo_url] : [],
    },
  };
}
