"use client";

import Link from "next/link";
import { useState } from "react";
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
} from "lucide-react";
import { cn } from "@/lib/utils";

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

const userNav: NavItem[] = [
  { label: "Account", href: "/account", icon: <User className="w-4 h-4" /> },
  { label: "Orders", href: "/orders", icon: <Package className="w-4 h-4" /> },
  {
    label: "Subscription",
    href: "/subscription",
    icon: <Settings className="w-4 h-4" />,
  },
];

export function Header() {
  const [isOpen, setIsOpen] = useState(false);
  const [cartCount] = useState(3); // TODO: Connect to cart state

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
              href="/cart"
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
            <div className="hidden md:flex items-center space-x-2">
              <Link
                href="/auth/login"
                className="p-2.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors"
              >
                <User className="w-5 h-5" />
              </Link>
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
            isOpen ? "max-h-[500px] pb-4" : "max-h-0"
          )}
        >
          <div className="flex flex-col space-y-1 pt-4">
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
            <Link
              href="/auth/login"
              className="flex items-center gap-3 px-4 py-3 text-gray-600 hover:bg-gray-50 rounded-xl"
              onClick={() => setIsOpen(false)}
            >
              <User className="w-4 h-4" />
              Sign In
            </Link>
            <Link
              href="/build-box"
              className="mx-4 btn-accent text-center py-3"
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
