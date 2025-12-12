"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/hooks";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  RefreshCcw,
  Warehouse,
  UserCheck,
  Settings,
  LogOut,
  Menu,
  X,
  ChevronLeft,
  Bell,
  Search,
} from "lucide-react";
import { useState, useEffect } from "react";

interface AdminLayoutProps {
  children: React.ReactNode;
}

const sidebarLinks = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/products", label: "Products", icon: Package },
  { href: "/admin/orders", label: "Orders", icon: ShoppingCart },
  { href: "/admin/customers", label: "Customers", icon: Users },
  { href: "/admin/subscriptions", label: "Subscriptions", icon: RefreshCcw },
  { href: "/admin/inventory", label: "Inventory", icon: Warehouse },
  { href: "/admin/dealers", label: "Dealers", icon: UserCheck },
  { href: "/admin/settings", label: "Settings", icon: Settings },
];

export function AdminLayout({ children }: AdminLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { profile, isLoading, isAuthenticated, signOut } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  // Check admin access
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/auth/login?redirectTo=/admin");
      return;
    }

    if (!isLoading && profile?.role !== "admin") {
      router.push("/");
      return;
    }
  }, [isLoading, isAuthenticated, profile, router]);

  const handleSignOut = async () => {
    await signOut();
    router.push("/");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-aura-primary"></div>
      </div>
    );
  }

  if (!isAuthenticated || profile?.role !== "admin") {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed top-0 left-0 z-50 h-full bg-aura-dark text-white transition-all duration-300",
          collapsed ? "w-20" : "w-64",
          sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        {/* Logo */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-white/10">
          <Link href="/admin" className="flex items-center gap-3">
            <div className="w-8 h-8 bg-aura-primary rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">A</span>
            </div>
            {!collapsed && (
              <span className="text-xl font-bold">Aura Admin</span>
            )}
          </Link>
          <button
            className="lg:hidden text-white/60 hover:text-white"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="p-4 space-y-1">
          {sidebarLinks.map((link) => {
            const isActive = pathname === link.href ||
              (link.href !== "/admin" && pathname.startsWith(link.href));
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors",
                  isActive
                    ? "bg-aura-primary text-white"
                    : "text-white/60 hover:text-white hover:bg-white/10"
                )}
              >
                <link.icon className="w-5 h-5 flex-shrink-0" />
                {!collapsed && <span className="text-sm font-medium">{link.label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Collapse Toggle (Desktop) */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="hidden lg:flex absolute bottom-20 left-0 right-0 mx-4 items-center justify-center gap-2 py-2 text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
        >
          <ChevronLeft className={cn("w-5 h-5 transition-transform", collapsed && "rotate-180")} />
          {!collapsed && <span className="text-sm">Collapse</span>}
        </button>

        {/* User Section */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-white/10">
          <div className={cn("flex items-center gap-3", collapsed && "justify-center")}>
            <div className="w-10 h-10 rounded-full bg-aura-primary/20 flex items-center justify-center flex-shrink-0">
              <span className="text-aura-primary font-semibold">
                {profile?.full_name?.charAt(0) || profile?.email?.charAt(0) || "A"}
              </span>
            </div>
            {!collapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">
                  {profile?.full_name || "Admin"}
                </p>
                <p className="text-xs text-white/60 truncate">{profile?.email}</p>
              </div>
            )}
            {!collapsed && (
              <button
                onClick={handleSignOut}
                className="p-2 text-white/60 hover:text-white hover:bg-white/10 rounded-lg"
                title="Sign out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className={cn("transition-all duration-300", collapsed ? "lg:pl-20" : "lg:pl-64")}>
        {/* Top Header */}
        <header className="sticky top-0 z-30 h-16 bg-white border-b border-gray-200">
          <div className="h-full px-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                className="lg:hidden p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                onClick={() => setSidebarOpen(true)}
              >
                <Menu className="w-5 h-5" />
              </button>
              <div className="hidden sm:flex items-center gap-2 px-3 py-2 bg-gray-100 rounded-lg">
                <Search className="w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search..."
                  className="bg-transparent border-none outline-none text-sm w-48"
                />
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button className="relative p-2 text-gray-600 hover:bg-gray-100 rounded-lg">
                <Bell className="w-5 h-5" />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-aura-accent rounded-full" />
              </button>
              <Link
                href="/"
                className="text-sm text-gray-600 hover:text-aura-primary"
              >
                View Store
              </Link>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-6">{children}</main>
      </div>
    </div>
  );
}
