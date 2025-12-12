"use client";

import Link from "next/link";
import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks";
import {
  Menu,
  X,
  ShoppingCart,
  User,
  Package,
  Settings,
  Utensils,
  Leaf,
  IceCream,
  Wine,
  Search,
  LogOut,
  LayoutDashboard,
  RefreshCcw,
  ChevronDown,
  Shield,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Avatar } from "./Avatar";

interface NavItem {
  label: string;
  href: string;
  icon?: React.ReactNode;
  isActive?: boolean;
}

const mainNav: NavItem[] = [
  { label: "Main Dishes", href: "/build-box", icon: <Utensils className="w-4 h-4" />, isActive: true },
  { label: "Vegan", href: "/products?category=vegan", icon: <Leaf className="w-4 h-4" /> },
  { label: "Snacks", href: "/products?category=snacks", icon: <Package className="w-4 h-4" /> },
  { label: "Desserts", href: "/products?category=desserts", icon: <IceCream className="w-4 h-4" /> },
  { label: "Drinks", href: "/products?category=drinks", icon: <Wine className="w-4 h-4" /> },
];

export function Header() {
  const router = useRouter();
  const { user, profile, isAuthenticated, signOut, isLoading } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [cartCount] = useState(0);
  const userMenuRef = useRef<HTMLDivElement>(null);

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
    await signOut();
    setUserMenuOpen(false);
    router.push("/");
  };

  const userMenuItems = [
    { label: "Dashboard", href: "/dashboard", icon: <LayoutDashboard className="w-4 h-4" /> },
    { label: "My Orders", href: "/orders", icon: <Package className="w-4 h-4" /> },
    { label: "Subscription", href: "/subscription", icon: <RefreshCcw className="w-4 h-4" /> },
    { label: "Account Settings", href: "/account", icon: <Settings className="w-4 h-4" /> },
  ];

  if (profile?.role === "admin") {
    userMenuItems.unshift({
      label: "Admin Panel",
      href: "/admin",
      icon: <Shield className="w-4 h-4" />,
    });
  }

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-gray-100">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <span className="text-2xl font-bold text-aura-accent">Aura</span>
          </Link>

          {/* Desktop Navigation - Category Tabs */}
          <div className="hidden lg:flex items-center space-x-1">
            {mainNav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "nav-tab",
                  item.isActive ? "nav-tab-active" : "nav-tab-inactive"
                )}
              >
                {item.icon}
                {item.label}
              </Link>
            ))}
          </div>

          {/* Actions */}
          <div className="flex items-center space-x-3">
            {/* Search */}
            <button className="hidden sm:flex p-2.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors">
              <Search className="w-5 h-5" />
            </button>

            {/* Cart */}
            <Link
              href="/build-box"
              className={cn(
                "relative flex items-center gap-2 px-4 py-2 rounded-full transition-all",
                cartCount > 0
                  ? "bg-aura-accent text-white"
                  : "text-gray-600 hover:bg-gray-100"
              )}
            >
              <ShoppingCart className="w-5 h-5" />
              {cartCount > 0 && (
                <span className="text-sm font-semibold">Cart</span>
              )}
            </Link>

            {/* User Menu (Desktop) */}
            <div className="hidden md:block relative" ref={userMenuRef}>
              {isLoading ? (
                <div className="w-10 h-10 rounded-full bg-gray-100 animate-pulse" />
              ) : isAuthenticated ? (
                <>
                  <button
                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                    className="flex items-center gap-2 p-1.5 rounded-full hover:bg-gray-100 transition-colors"
                  >
                    <Avatar
                      src={profile?.avatar_url}
                      fallback={profile?.full_name || user?.email}
                      size="sm"
                    />
                    <ChevronDown
                      className={cn(
                        "w-4 h-4 text-gray-500 transition-transform",
                        userMenuOpen && "rotate-180"
                      )}
                    />
                  </button>

                  {/* Dropdown Menu */}
                  {userMenuOpen && (
                    <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
                      {/* User Info */}
                      <div className="p-4 border-b border-gray-100 bg-gray-50">
                        <p className="font-semibold text-gray-900 truncate">
                          {profile?.full_name || "Aura User"}
                        </p>
                        <p className="text-sm text-gray-500 truncate">{user?.email}</p>
                        {profile?.role === "admin" && (
                          <span className="inline-block mt-1 px-2 py-0.5 bg-aura-accent/10 text-aura-accent text-xs font-medium rounded-full">
                            Admin
                          </span>
                        )}
                      </div>

                      {/* Menu Items */}
                      <div className="p-2">
                        {userMenuItems.map((item) => (
                          <Link
                            key={item.href}
                            href={item.href}
                            onClick={() => setUserMenuOpen(false)}
                            className="flex items-center gap-3 px-3 py-2.5 text-gray-700 hover:bg-gray-100 rounded-xl transition-colors"
                          >
                            <span className="text-gray-400">{item.icon}</span>
                            {item.label}
                          </Link>
                        ))}
                      </div>

                      {/* Sign Out */}
                      <div className="p-2 border-t border-gray-100">
                        <button
                          onClick={handleSignOut}
                          className="flex items-center gap-3 w-full px-3 py-2.5 text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                        >
                          <LogOut className="w-4 h-4" />
                          Sign Out
                        </button>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <Link
                  href="/auth/login"
                  className="p-2.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <User className="w-5 h-5" />
                </Link>
              )}
            </div>

            {/* Mobile Menu Button */}
            <button
              className="lg:hidden p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
              onClick={() => setIsOpen(!isOpen)}
            >
              {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        <div
          className={cn(
            "lg:hidden transition-all duration-300 overflow-hidden",
            isOpen ? "max-h-[600px] pb-4" : "max-h-0"
          )}
        >
          <div className="flex flex-col space-y-1 pt-4">
            {/* User Info (Mobile) */}
            {isAuthenticated && (
              <div className="px-4 py-3 mb-2 bg-gray-50 rounded-xl">
                <div className="flex items-center gap-3">
                  <Avatar
                    src={profile?.avatar_url}
                    fallback={profile?.full_name || user?.email}
                    size="md"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 truncate">
                      {profile?.full_name || "Aura User"}
                    </p>
                    <p className="text-sm text-gray-500 truncate">{user?.email}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Navigation Links */}
            {mainNav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-xl transition-colors",
                  item.isActive
                    ? "bg-aura-warm text-aura-accent"
                    : "text-gray-600 hover:bg-gray-50"
                )}
                onClick={() => setIsOpen(false)}
              >
                {item.icon}
                {item.label}
              </Link>
            ))}

            <hr className="my-3 border-gray-100" />

            {/* User Menu Items (Mobile) */}
            {isAuthenticated ? (
              <>
                {userMenuItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="flex items-center gap-3 px-4 py-3 text-gray-600 hover:bg-gray-50 rounded-xl"
                    onClick={() => setIsOpen(false)}
                  >
                    {item.icon}
                    {item.label}
                  </Link>
                ))}
                <button
                  onClick={() => {
                    handleSignOut();
                    setIsOpen(false);
                  }}
                  className="flex items-center gap-3 px-4 py-3 text-red-600 hover:bg-red-50 rounded-xl w-full text-left"
                >
                  <LogOut className="w-4 h-4" />
                  Sign Out
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/auth/login"
                  className="flex items-center gap-3 px-4 py-3 text-gray-600 hover:bg-gray-50 rounded-xl"
                  onClick={() => setIsOpen(false)}
                >
                  <User className="w-4 h-4" />
                  Sign In
                </Link>
                <Link
                  href="/auth/signup"
                  className="mx-4 btn-accent text-center py-3"
                  onClick={() => setIsOpen(false)}
                >
                  Create Account
                </Link>
              </>
            )}

            {/* Build Box CTA */}
            <Link
              href="/build-box"
              className="mx-4 mt-2 btn-primary text-center py-3"
              onClick={() => setIsOpen(false)}
            >
              Build Your Box
            </Link>
          </div>
        </div>
      </nav>
    </header>
  );
}
