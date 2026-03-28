"use client";

import { useState, useEffect, createContext, useContext } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  User,
  Menu,
  X,
  LogOut,
  Building2,
  Loader2,
  ChevronRight,
  BarChart3,
  MapPin,
  FileText,
  BookmarkCheck,
  CreditCard,
  Palette,
} from "lucide-react";
import type { Dealer, Organization, Profile } from "@/types";

interface DealerContextValue {
  dealer: Dealer | null;
  organization: Organization | null;
  profile: Profile | null;
}

const DealerContext = createContext<DealerContextValue>({
  dealer: null,
  organization: null,
  profile: null,
});

export function useDealerContext() {
  return useContext(DealerContext);
}

const TIER_CONFIG: Record<string, { color: string; bg: string; border: string }> = {
  bronze: { color: "text-amber-700", bg: "bg-amber-50", border: "border-amber-200" },
  silver: { color: "text-slate-600", bg: "bg-slate-100", border: "border-slate-300" },
  gold: { color: "text-yellow-700", bg: "bg-yellow-50", border: "border-yellow-300" },
  platinum: { color: "text-indigo-700", bg: "bg-indigo-50", border: "border-indigo-200" },
};

const navItems = [
  { href: "/b2b/portal", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/b2b/portal/products", label: "Products", icon: Package },
  { href: "/b2b/portal/orders", label: "Orders", icon: ShoppingCart },
  { href: "/b2b/portal/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/b2b/portal/locations", label: "Locations", icon: MapPin },
  { href: "/b2b/portal/branding", label: "Branding", icon: Palette },
  { href: "/account", label: "My Account", icon: User },
];

function TierBadge({ tier }: { tier: string }) {
  const config = TIER_CONFIG[tier] || TIER_CONFIG.bronze;
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold capitalize border ${config.color} ${config.bg} ${config.border}`}
    >
      {tier}
    </span>
  );
}

export default function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [dealer, setDealer] = useState<Dealer | null>(null);
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const supabase = createClient();

    async function checkAuthAndLoadData() {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.user) {
        router.push("/auth/login?redirectTo=/b2b/portal");
        return;
      }

      const { data: profileData } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", session.user.id)
        .single();

      if (
        !profileData ||
        (profileData.role !== "dealer" && profileData.role !== "admin")
      ) {
        router.push("/b2b");
        return;
      }

      setProfile(profileData as Profile);

      const { data: dealerData } = await supabase
        .from("dealers")
        .select("*")
        .eq("profile_id", session.user.id)
        .maybeSingle();

      if (dealerData) {
        setDealer(dealerData as Dealer);

        if (dealerData.organization_id) {
          const { data: orgData } = await supabase
            .from("organizations")
            .select("*")
            .eq("id", dealerData.organization_id)
            .single();

          if (orgData) {
            setOrganization(orgData as Organization);
          }
        }
      }

      setLoading(false);
    }

    checkAuthAndLoadData();
  }, [router]);

  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-3" />
          <p className="text-sm text-gray-500">Loading portal...</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return null;
  }

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/b2b");
  };

  const isActive = (href: string, exact?: boolean) => {
    if (exact) return pathname === href;
    return pathname === href || pathname.startsWith(href + "/");
  };

  const availableCredit = organization
    ? organization.credit_limit - organization.current_balance
    : 0;

  return (
    <DealerContext.Provider value={{ dealer, organization, profile }}>
      <div className="min-h-screen bg-slate-50">
        {/* Mobile Header */}
        <header className="lg:hidden sticky top-0 z-50 bg-white border-b border-slate-200">
          <div className="flex items-center justify-between px-4 h-16">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 -ml-2 rounded-lg hover:bg-slate-100 transition-colors"
              aria-label="Open navigation menu"
            >
              <Menu className="w-5 h-5 text-slate-700" />
            </button>
            <div className="flex items-center gap-2">
              {organization?.logo_url ? (
                <img
                  src={organization.logo_url}
                  alt={`${organization.name} logo`}
                  className="w-7 h-7 rounded-lg object-cover"
                />
              ) : (
                <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center">
                  <Building2 className="w-4 h-4 text-white" />
                </div>
              )}
              <span className="font-semibold text-slate-900 text-sm">
                Aura Partner Portal
              </span>
            </div>
            <div className="w-9" />
          </div>
        </header>

        {/* Mobile Sidebar Overlay */}
        {sidebarOpen && (
          <div className="lg:hidden fixed inset-0 z-50">
            <div
              className="absolute inset-0 bg-black/40"
              onClick={() => setSidebarOpen(false)}
            />
            <aside className="absolute left-0 top-0 bottom-0 w-72 bg-white shadow-xl animate-slide-in">
              <div className="flex items-center justify-between p-4 border-b border-slate-200">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
                    <Building2 className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <span className="font-semibold text-slate-900 text-sm block">
                      Partner Portal
                    </span>
                    {organization && (
                      <TierBadge tier={organization.dealer_tier} />
                    )}
                  </div>
                </div>
                <button
                  onClick={() => setSidebarOpen(false)}
                  className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
                  aria-label="Close navigation menu"
                >
                  <X className="w-5 h-5 text-slate-500" />
                </button>
              </div>
              <nav className="p-3">
                {navItems.map((item) => {
                  const active = isActive(item.href, item.exact);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setSidebarOpen(false)}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-lg mb-1 text-sm font-medium transition-colors ${
                        active
                          ? "bg-blue-50 text-blue-700"
                          : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                      }`}
                    >
                      <item.icon className="w-5 h-5" />
                      {item.label}
                      {active && (
                        <ChevronRight className="w-4 h-4 ml-auto" />
                      )}
                    </Link>
                  );
                })}
              </nav>
              {/* Credit info in mobile sidebar */}
              {organization && organization.credit_limit > 0 && (
                <div className="px-4 py-3 mx-3 rounded-lg bg-slate-50 border border-slate-200">
                  <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
                    <CreditCard className="w-3.5 h-3.5" />
                    Available Credit
                  </div>
                  <p className="text-sm font-semibold text-slate-900">
                    ${availableCredit.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Terms: {organization.payment_terms.replace("_", " ").replace("net", "Net-")}
                  </p>
                </div>
              )}
              <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-slate-200">
                <button
                  onClick={handleSignOut}
                  className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
                >
                  <LogOut className="w-5 h-5" />
                  Sign Out
                </button>
              </div>
            </aside>
          </div>
        )}

        <div className="flex">
          {/* Desktop Sidebar */}
          <aside className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 bg-white border-r border-slate-200">
            {/* Org Header */}
            <div className="p-5 border-b border-slate-200">
              <div className="flex items-center gap-3">
                {organization?.logo_url ? (
                  <img
                    src={organization.logo_url}
                    alt={`${organization.name} logo`}
                    className="w-9 h-9 rounded-lg object-cover"
                  />
                ) : (
                  <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center">
                    <Building2 className="w-5 h-5 text-white" />
                  </div>
                )}
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-slate-900 truncate">
                    Aura Partner Portal
                  </p>
                  {organization && (
                    <div className="flex items-center gap-2 mt-0.5">
                      <p className="text-xs text-slate-500 truncate">
                        {organization.name}
                      </p>
                      <TierBadge tier={organization.dealer_tier} />
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 p-3 space-y-1">
              {navItems.map((item) => {
                const active = isActive(item.href, item.exact);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                      active
                        ? "bg-blue-50 text-blue-700"
                        : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                    }`}
                  >
                    <item.icon className="w-5 h-5" />
                    {item.label}
                    {active && (
                      <ChevronRight className="w-4 h-4 ml-auto" />
                    )}
                  </Link>
                );
              })}
            </nav>

            {/* Credit Balance Footer */}
            {organization && organization.credit_limit > 0 && (
              <div className="px-4 py-3 mx-3 mb-3 rounded-lg bg-slate-50 border border-slate-200">
                <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
                  <CreditCard className="w-3.5 h-3.5" />
                  Available Credit
                </div>
                <p className="text-sm font-semibold text-slate-900">
                  ${availableCredit.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                </p>
                <div className="mt-1.5 w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-600 rounded-full transition-all"
                    style={{
                      width: `${Math.min(100, organization.credit_limit > 0 ? (organization.current_balance / organization.credit_limit) * 100 : 0)}%`,
                    }}
                  />
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  {organization.payment_terms === "immediate"
                    ? "Pay on order"
                    : organization.payment_terms.replace("_", " ").replace("net", "Net-")}
                </p>
              </div>
            )}

            {/* User Footer */}
            <div className="p-4 border-t border-slate-200">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                  <span className="text-sm font-semibold text-blue-700">
                    {profile?.full_name?.charAt(0)?.toUpperCase() || "D"}
                  </span>
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-slate-900 truncate">
                    {profile?.full_name || "Dealer"}
                  </p>
                  <p className="text-xs text-slate-500 truncate">
                    {profile?.email}
                  </p>
                </div>
              </div>
              <button
                onClick={handleSignOut}
                className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-sm text-slate-600 hover:bg-slate-100 hover:text-red-600 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </button>
            </div>
          </aside>

          {/* Main Content */}
          <main className="flex-1 lg:ml-64 min-h-screen">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
              {children}
            </div>
          </main>
        </div>
      </div>
    </DealerContext.Provider>
  );
}
