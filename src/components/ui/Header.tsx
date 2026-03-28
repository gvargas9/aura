"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import {
  Search,
  ShoppingCart,
  User,
  Home,
  Package,
  LayoutGrid,
  ClipboardList,
  Leaf,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks";
import { NotificationCenter } from "./NotificationCenter";
import { SearchModal } from "./SearchModal";

interface NavItem {
  label: string;
  href: string;
  icon?: React.ReactNode;
}

const desktopNav: NavItem[] = [
  { label: "Products", href: "/products" },
  { label: "Build a Box", href: "/build-box" },
  { label: "How It Works", href: "/how-it-works" },
  { label: "For Business", href: "/b2b" },
];

const mobileTabNav = [
  { label: "Home", href: "/", icon: Home },
  { label: "Products", href: "/products", icon: LayoutGrid },
  { label: "Build Box", href: "/build-box", icon: Package },
  { label: "Orders", href: "/orders", icon: ClipboardList },
  { label: "Account", href: "/account", icon: User },
];

export function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [cartCount] = useState(0);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const { isAuthenticated } = useAuth();
  const pathname = usePathname();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Cmd+K / Ctrl+K to open search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setIsSearchOpen(true);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  return (
    <>
      {/* Desktop / Tablet Header */}
      <header
        className={cn(
          "sticky top-0 z-50 transition-all duration-300",
          scrolled
            ? "bg-white/80 backdrop-blur-lg shadow-sm border-b border-gray-100/50"
            : "bg-white/95 backdrop-blur-sm"
        )}
      >
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8" aria-label="Main navigation">
          <div className="flex justify-between items-center h-16 lg:h-18">
            {/* Logo */}
            <Link
              href="/"
              className="flex items-center gap-2 group"
              aria-label="Aura home"
            >
              <div className="w-8 h-8 bg-gradient-to-br from-aura-primary to-aura-secondary rounded-lg flex items-center justify-center shadow-md shadow-aura-primary/20 group-hover:shadow-lg group-hover:shadow-aura-primary/30 transition-shadow duration-300">
                <Leaf className="w-4 h-4 text-white" />
              </div>
              <span className="text-xl font-bold text-aura-dark tracking-tight">
                Aura
              </span>
            </Link>

            {/* Desktop Navigation Links */}
            <div className="hidden lg:flex items-center gap-1">
              {desktopNav.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "relative px-4 py-2 text-sm font-medium rounded-full transition-all duration-200",
                    isActive(item.href)
                      ? "text-aura-dark bg-aura-light"
                      : "text-gray-600 hover:text-aura-dark hover:bg-gray-50"
                  )}
                >
                  {item.label}
                  {isActive(item.href) && (
                    <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1 h-1 bg-aura-primary rounded-full" />
                  )}
                </Link>
              ))}
            </div>

            {/* Right Actions */}
            <div className="flex items-center gap-2">
              {/* Search */}
              <button
                onClick={() => setIsSearchOpen(true)}
                className="hidden sm:flex items-center justify-center w-10 h-10 text-gray-500 hover:text-aura-dark hover:bg-gray-100 rounded-full transition-all duration-200"
                aria-label="Search products"
              >
                <Search className="w-[18px] h-[18px]" />
              </button>

              {/* Notifications */}
              {isAuthenticated && <NotificationCenter />}

              {/* Cart */}
              <Link
                href="/build-box"
                className={cn(
                  "relative flex items-center gap-2 px-3 py-2 rounded-full transition-all duration-200",
                  cartCount > 0
                    ? "bg-aura-dark text-white hover:bg-aura-darker"
                    : "text-gray-600 hover:bg-gray-100 hover:text-aura-dark"
                )}
                aria-label={`Shopping cart with ${cartCount} items`}
              >
                <ShoppingCart className="w-[18px] h-[18px]" />
                {cartCount > 0 && (
                  <>
                    <span className="text-sm font-semibold">{cartCount}</span>
                    <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-aura-accent rounded-full border-2 border-white" />
                  </>
                )}
              </Link>

              {/* User / Sign In */}
              <div className="hidden md:flex items-center gap-2">
                {isAuthenticated ? (
                  <Link
                    href="/account"
                    className="flex items-center justify-center w-10 h-10 rounded-full bg-aura-light text-aura-dark hover:bg-aura-primary/20 transition-all duration-200"
                    aria-label="Account"
                  >
                    <User className="w-[18px] h-[18px]" />
                  </Link>
                ) : (
                  <Link
                    href="/auth/login"
                    className="text-sm font-medium text-gray-600 hover:text-aura-dark px-4 py-2 rounded-full hover:bg-gray-50 transition-all duration-200"
                  >
                    Sign In
                  </Link>
                )}
              </div>

              {/* CTA Button - Desktop */}
              <Link
                href="/build-box"
                className="hidden lg:inline-flex items-center gap-2 bg-aura-dark text-white text-sm font-semibold px-5 py-2.5 rounded-full hover:bg-aura-darker transition-all duration-200 hover:-translate-y-0.5 shadow-sm hover:shadow-md"
              >
                Build Your Box
              </Link>
            </div>
          </div>
        </nav>
      </header>

      {/* Mobile Bottom Tab Bar */}
      <nav
        className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-lg border-t border-gray-200/50 safe-area-bottom"
        aria-label="Mobile navigation"
      >
        <div className="flex items-center justify-around px-2 h-16">
          {mobileTabNav.map((tab) => {
            const active = isActive(tab.href);
            const Icon = tab.icon;
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={cn(
                  "flex flex-col items-center justify-center gap-0.5 w-16 py-1 rounded-xl transition-all duration-200",
                  active
                    ? "text-aura-primary"
                    : "text-gray-400 hover:text-gray-600"
                )}
                aria-label={tab.label}
                aria-current={active ? "page" : undefined}
              >
                <div
                  className={cn(
                    "relative flex items-center justify-center w-8 h-8 rounded-xl transition-all duration-200",
                    active && "bg-aura-light"
                  )}
                >
                  <Icon className={cn("w-5 h-5", active && "text-aura-primary")} />
                  {active && (
                    <span className="absolute -top-0.5 left-1/2 -translate-x-1/2 w-4 h-0.5 bg-aura-primary rounded-full" />
                  )}
                </div>
                <span
                  className={cn(
                    "text-[10px] font-medium leading-tight",
                    active ? "text-aura-primary" : "text-gray-400"
                  )}
                >
                  {tab.label}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Spacer for mobile bottom nav */}
      <div className="lg:hidden h-16" />

      {/* Search Modal */}
      <SearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
    </>
  );
}
