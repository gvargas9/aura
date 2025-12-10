"use client";

import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import {
  Menu,
  X,
  ShoppingCart,
  User,
  Package,
  Building2,
  Settings,
  LayoutDashboard,
  LogOut,
  ChevronDown,
  Box,
  RefreshCcw,
  QrCode,
  Users,
  BarChart3,
  Truck,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks";
import { createClient } from "@/lib/supabase/client";

interface NavItem {
  label: string;
  href: string;
  icon?: React.ReactNode;
}

const mainNav: NavItem[] = [
  { label: "Products", href: "/products" },
  { label: "Build Your Box", href: "/build-box" },
  { label: "How It Works", href: "/how-it-works" },
  { label: "For Business", href: "/b2b" },
];

const customerNav: NavItem[] = [
  { label: "My Account", href: "/account", icon: <User className="w-4 h-4" /> },
  { label: "Orders", href: "/account/orders", icon: <Package className="w-4 h-4" /> },
  { label: "Subscriptions", href: "/account/subscriptions", icon: <RefreshCcw className="w-4 h-4" /> },
  { label: "Settings", href: "/account/settings", icon: <Settings className="w-4 h-4" /> },
];

const dealerNav: NavItem[] = [
  { label: "Dealer Portal", href: "/b2b/portal", icon: <LayoutDashboard className="w-4 h-4" /> },
  { label: "My Referrals", href: "/b2b/portal", icon: <QrCode className="w-4 h-4" /> },
  { label: "Commission", href: "/b2b/portal", icon: <BarChart3 className="w-4 h-4" /> },
  { label: "Settings", href: "/account/settings", icon: <Settings className="w-4 h-4" /> },
];

const adminNav: NavItem[] = [
  { label: "Dashboard", href: "/admin", icon: <LayoutDashboard className="w-4 h-4" /> },
  { label: "Products", href: "/admin/products", icon: <Box className="w-4 h-4" /> },
  { label: "Orders", href: "/admin/orders", icon: <Package className="w-4 h-4" /> },
  { label: "Inventory", href: "/admin/inventory", icon: <Truck className="w-4 h-4" /> },
  { label: "Customers", href: "/admin/customers", icon: <Users className="w-4 h-4" /> },
  { label: "Dealers", href: "/admin/dealers", icon: <Building2 className="w-4 h-4" /> },
];

export function Header() {
  const [isOpen, setIsOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [cartCount] = useState(0);
  const { user, profile, isAuthenticated, isLoading } = useAuth();
  const userMenuRef = useRef<HTMLDivElement>(null);
  const supabase = createClient();

  // Close user menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    window.location.href = "/";
  };

  const getUserNav = () => {
    if (!profile) return customerNav;
    switch (profile.role) {
      case "admin":
        return adminNav;
      case "dealer":
        return dealerNav;
      default:
        return customerNav;
    }
  };

  const getRoleBadge = () => {
    if (!profile) return null;
    switch (profile.role) {
      case "admin":
        return <span className="ml-2 text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-medium">Admin</span>;
      case "dealer":
        return <span className="ml-2 text-xs bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full font-medium">Dealer</span>;
      default:
        return null;
    }
  };

  return (
    <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-xl border-b border-gray-100/50 shadow-sm">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2 group">
            <div className="w-9 h-9 bg-gradient-to-br from-aura-primary to-aura-secondary rounded-xl flex items-center justify-center shadow-lg shadow-aura-primary/25 group-hover:shadow-aura-primary/40 transition-shadow">
              <span className="text-white font-bold text-lg">A</span>
            </div>
            <span className="text-2xl font-bold gradient-text hidden sm:block">Aura</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center space-x-1">
            {mainNav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="px-4 py-2 text-gray-600 hover:text-aura-primary hover:bg-aura-light/50 rounded-xl transition-all duration-200 font-medium text-sm"
              >
                {item.label}
              </Link>
            ))}
          </div>

          {/* Actions */}
          <div className="flex items-center space-x-3">
            {/* Cart */}
            <Link
              href="/cart"
              className="relative p-2.5 text-gray-500 hover:text-aura-primary hover:bg-aura-light/50 rounded-xl transition-all duration-200"
            >
              <ShoppingCart className="w-5 h-5" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-aura-accent text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center animate-bounce-soft">
                  {cartCount}
                </span>
              )}
            </Link>

            {/* User Menu (Desktop) */}
            {!isLoading && (
              <div className="hidden md:flex items-center space-x-2">
                {isAuthenticated && user ? (
                  <div className="relative" ref={userMenuRef}>
                    <button
                      onClick={() => setUserMenuOpen(!userMenuOpen)}
                      className="flex items-center space-x-2 px-3 py-2 rounded-xl hover:bg-aura-light/50 transition-all duration-200"
                    >
                      <div className="w-8 h-8 bg-gradient-to-br from-aura-primary to-aura-secondary rounded-full flex items-center justify-center text-white font-medium text-sm shadow-md">
                        {profile?.full_name?.charAt(0) || user.email?.charAt(0).toUpperCase()}
                      </div>
                      <span className="text-sm font-medium text-gray-700 max-w-24 truncate">
                        {profile?.full_name?.split(" ")[0] || "Account"}
                      </span>
                      {getRoleBadge()}
                      <ChevronDown className={cn("w-4 h-4 text-gray-400 transition-transform", userMenuOpen && "rotate-180")} />
                    </button>

                    {/* Dropdown Menu */}
                    {userMenuOpen && (
                      <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-gray-100 py-2 animate-fade-in">
                        <div className="px-4 py-3 border-b border-gray-100">
                          <p className="text-sm font-medium text-gray-900">{profile?.full_name || "User"}</p>
                          <p className="text-xs text-gray-500 truncate">{user.email}</p>
                        </div>
                        <div className="py-2">
                          {getUserNav().map((item) => (
                            <Link
                              key={item.href}
                              href={item.href}
                              className="flex items-center space-x-3 px-4 py-2.5 text-sm text-gray-600 hover:bg-aura-light/50 hover:text-aura-primary transition-colors"
                              onClick={() => setUserMenuOpen(false)}
                            >
                              {item.icon}
                              <span>{item.label}</span>
                            </Link>
                          ))}
                        </div>
                        <div className="border-t border-gray-100 pt-2">
                          <button
                            onClick={handleSignOut}
                            className="flex items-center space-x-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 w-full transition-colors"
                          >
                            <LogOut className="w-4 h-4" />
                            <span>Sign Out</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <>
                    <Link href="/auth/login" className="btn-ghost text-sm">
                      Sign In
                    </Link>
                    <Link href="/build-box" className="btn-primary text-sm">
                      Get Started
                    </Link>
                  </>
                )}
              </div>
            )}

            {/* Mobile Menu Button */}
            <button
              className="lg:hidden p-2.5 text-gray-500 hover:text-aura-primary hover:bg-aura-light/50 rounded-xl transition-colors"
              onClick={() => setIsOpen(!isOpen)}
            >
              {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        <div
          className={cn(
            "lg:hidden transition-all duration-300 overflow-hidden",
            isOpen ? "max-h-screen pb-4" : "max-h-0"
          )}
        >
          <div className="flex flex-col space-y-1 pt-4">
            {mainNav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="px-4 py-3 text-gray-600 hover:bg-aura-light/50 hover:text-aura-primary rounded-xl transition-colors font-medium"
                onClick={() => setIsOpen(false)}
              >
                {item.label}
              </Link>
            ))}

            <hr className="my-3 border-gray-100" />

            {isAuthenticated && user ? (
              <>
                <div className="px-4 py-3 bg-gray-50 rounded-xl mb-2">
                  <p className="text-sm font-medium text-gray-900">{profile?.full_name || "User"}</p>
                  <p className="text-xs text-gray-500">{user.email}</p>
                </div>
                {getUserNav().map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="flex items-center space-x-3 px-4 py-3 text-gray-600 hover:bg-aura-light/50 hover:text-aura-primary rounded-xl transition-colors"
                    onClick={() => setIsOpen(false)}
                  >
                    {item.icon}
                    <span>{item.label}</span>
                  </Link>
                ))}
                <button
                  onClick={() => { handleSignOut(); setIsOpen(false); }}
                  className="flex items-center space-x-3 px-4 py-3 text-red-600 hover:bg-red-50 rounded-xl transition-colors w-full"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sign Out</span>
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/auth/login"
                  className="px-4 py-3 text-aura-primary font-medium hover:bg-aura-light/50 rounded-xl transition-colors"
                  onClick={() => setIsOpen(false)}
                >
                  Sign In
                </Link>
                <Link
                  href="/build-box"
                  className="mx-4 btn-primary text-center"
                  onClick={() => setIsOpen(false)}
                >
                  Get Started
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>
    </header>
  );
}
