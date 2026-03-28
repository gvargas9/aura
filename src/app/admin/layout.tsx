"use client";

import { useState, useEffect, createContext, useContext } from "react";
import { useRouter, usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import type { Profile } from "@/types";
import {
  LayoutDashboard,
  Box,
  Package,
  Users,
  RefreshCcw,
  Warehouse,
  Handshake,
  Bell,
  Settings,
  Menu,
  X,
  Loader2,
  ExternalLink,
  MonitorSmartphone,
  Mail,
  ChefHat,
  Store,
} from "lucide-react";

const navItems = [
  { label: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { label: "Products", href: "/admin/products", icon: Box },
  { label: "Orders", href: "/admin/orders", icon: Package },
  { label: "Customers", href: "/admin/customers", icon: Users },
  { label: "Subscriptions", href: "/admin/subscriptions", icon: RefreshCcw },
  { label: "Inventory", href: "/admin/inventory", icon: Warehouse },
  { label: "Dealers", href: "/admin/dealers", icon: Handshake },
  { label: "Storefronts", href: "/admin/storefronts", icon: Store },
  { label: "Vending", href: "/admin/vending", icon: MonitorSmartphone },
  { label: "Recipes", href: "/admin/recipes", icon: ChefHat },
  { label: "Notifications", href: "/admin/notifications", icon: Bell },
  { label: "Email Templates", href: "/admin/email-templates", icon: Mail },
  { label: "Settings", href: "/admin/settings", icon: Settings },
];

const AdminContext = createContext<{ profile: Profile | null }>({ profile: null });
export const useAdminProfile = () => useContext(AdminContext);

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const supabase = createClient();

    async function checkAuth() {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session?.user) {
        router.push("/auth/login?redirectTo=/admin");
        return;
      }

      const { data: profileData } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", session.user.id)
        .single();

      if (!profileData || profileData.role !== "admin") {
        router.push("/");
        return;
      }

      setProfile(profileData as Profile);
      setLoading(false);
    }

    checkAuth();
  }, [router]);

  // Close sidebar on route change (mobile)
  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-8 h-8 animate-spin text-aura-primary" />
      </div>
    );
  }

  if (!profile) {
    return null;
  }

  const isActive = (href: string) => {
    if (href === "/admin") return pathname === "/admin";
    return pathname.startsWith(href);
  };

  return (
    <AdminContext.Provider value={{ profile }}>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-aura-dark text-white sticky top-0 z-40">
          <div className="px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setSidebarOpen(!sidebarOpen)}
                  className="lg:hidden p-1 rounded hover:bg-white/10"
                  aria-label="Toggle sidebar"
                >
                  {sidebarOpen ? (
                    <X className="w-6 h-6" />
                  ) : (
                    <Menu className="w-6 h-6" />
                  )}
                </button>
                <Link href="/admin" className="text-2xl font-bold text-aura-primary">
                  Aura
                </Link>
                <span className="px-2 py-0.5 bg-aura-primary/20 text-aura-primary text-xs rounded font-medium">
                  Admin
                </span>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-sm text-gray-300 hidden sm:inline">
                  {profile.full_name || profile.email}
                </span>
                <Link
                  href="/"
                  className="text-sm text-gray-400 hover:text-white flex items-center gap-1"
                >
                  View Store
                  <ExternalLink className="w-3 h-3" />
                </Link>
              </div>
            </div>
          </div>
        </header>

        <div className="flex">
          {/* Sidebar overlay for mobile */}
          {sidebarOpen && (
            <div
              className="fixed inset-0 bg-black/50 z-30 lg:hidden"
              onClick={() => setSidebarOpen(false)}
              aria-hidden="true"
            />
          )}

          {/* Sidebar */}
          <aside
            className={`
              fixed lg:sticky top-[65px] left-0 z-30
              w-64 h-[calc(100vh-65px)] bg-white border-r border-gray-200
              overflow-y-auto transition-transform duration-200
              lg:translate-x-0
              ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
            `}
          >
            <nav className="p-4 space-y-1">
              {navItems.map((item) => {
                const active = isActive(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`
                      flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium
                      transition-colors duration-150
                      ${
                        active
                          ? "bg-aura-primary/10 text-aura-primary"
                          : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                      }
                    `}
                  >
                    <item.icon className={`w-5 h-5 ${active ? "text-aura-primary" : "text-gray-400"}`} />
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </aside>

          {/* Main content */}
          <main className="flex-1 min-w-0 lg:ml-0">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
              {children}
            </div>
          </main>
        </div>
      </div>
    </AdminContext.Provider>
  );
}
