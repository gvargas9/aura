"use client";

import { useState, useEffect, createContext, useContext } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/hooks";
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
} from "lucide-react";
import type { Dealer, Organization } from "@/types";

interface DealerContextValue {
  dealer: Dealer | null;
  organization: Organization | null;
}

const DealerContext = createContext<DealerContextValue>({
  dealer: null,
  organization: null,
});

export function useDealerContext() {
  return useContext(DealerContext);
}

const navItems = [
  { href: "/b2b/portal", label: "Dashboard", icon: LayoutDashboard },
  { href: "/b2b/portal/products", label: "Products", icon: Package },
  { href: "/b2b/portal/orders", label: "Orders", icon: ShoppingCart },
  { href: "/account", label: "My Account", icon: User },
];

export default function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, profile, isLoading: authLoading, isAuthenticated, signOut } = useAuth();
  const [dealer, setDealer] = useState<Dealer | null>(null);
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const supabase = createClient();

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/auth/login?redirectTo=/b2b/portal");
      return;
    }

    if (!authLoading && profile && profile.role !== "dealer" && profile.role !== "admin") {
      router.push("/b2b");
      return;
    }
  }, [authLoading, isAuthenticated, profile, router]);

  useEffect(() => {
    const fetchDealerData = async () => {
      if (!user || !profile) return;

      const { data: dealerData } = await supabase
        .from("dealers")
        .select("*")
        .eq("profile_id", user.id)
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

      setIsLoading(false);
    };

    if (user && profile && (profile.role === "dealer" || profile.role === "admin")) {
      fetchDealerData();
    }
  }, [user, profile, supabase]);

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-3" />
          <p className="text-sm text-gray-500">Loading portal...</p>
        </div>
      </div>
    );
  }

  if (!profile || (profile.role !== "dealer" && profile.role !== "admin")) {
    return null;
  }

  const handleSignOut = async () => {
    await signOut();
    router.push("/b2b");
  };

  return (
    <DealerContext.Provider value={{ dealer, organization }}>
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
              <span className="font-semibold text-slate-900 text-sm">Aura Partner Portal</span>
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
                  <span className="font-semibold text-slate-900">Partner Portal</span>
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
                  const isActive = pathname === item.href;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setSidebarOpen(false)}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-lg mb-1 text-sm font-medium transition-colors ${
                        isActive
                          ? "bg-blue-50 text-blue-700"
                          : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                      }`}
                    >
                      <item.icon className="w-5 h-5" />
                      {item.label}
                      {isActive && <ChevronRight className="w-4 h-4 ml-auto" />}
                    </Link>
                  );
                })}
              </nav>
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
            <div className="flex items-center gap-3 p-5 border-b border-slate-200">
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
                <p className="text-sm font-semibold text-slate-900 truncate">Aura Partner Portal</p>
                {organization && (
                  <p className="text-xs text-slate-500 truncate">{organization.name}</p>
                )}
              </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 p-3 space-y-1">
              {navItems.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                      isActive
                        ? "bg-blue-50 text-blue-700"
                        : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                    }`}
                  >
                    <item.icon className="w-5 h-5" />
                    {item.label}
                    {isActive && <ChevronRight className="w-4 h-4 ml-auto" />}
                  </Link>
                );
              })}
            </nav>

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
                  <p className="text-xs text-slate-500 truncate">{profile?.email}</p>
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
