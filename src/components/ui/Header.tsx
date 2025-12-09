"use client";

import Link from "next/link";
import { useState } from "react";
import {
  Menu,
  X,
  ShoppingCart,
  User,
  Package,
  Building2,
  Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";

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
  const [cartCount] = useState(0); // TODO: Connect to cart state

  return (
    <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <span className="text-2xl font-bold gradient-text">Aura</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {mainNav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-gray-600 hover:text-aura-primary transition-colors font-medium"
              >
                {item.label}
              </Link>
            ))}
          </div>

          {/* Actions */}
          <div className="flex items-center space-x-4">
            {/* Cart */}
            <Link
              href="/cart"
              className="relative p-2 text-gray-600 hover:text-aura-primary transition-colors"
            >
              <ShoppingCart className="w-6 h-6" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-aura-accent text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </Link>

            {/* User Menu (Desktop) */}
            <div className="hidden md:flex items-center space-x-2">
              <Link href="/auth/login" className="btn-secondary text-sm py-1.5">
                Sign In
              </Link>
              <Link href="/build-box" className="btn-primary text-sm py-1.5">
                Get Started
              </Link>
            </div>

            {/* Mobile Menu Button */}
            <button
              className="md:hidden p-2 text-gray-600"
              onClick={() => setIsOpen(!isOpen)}
            >
              {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        <div
          className={cn(
            "md:hidden transition-all duration-300 overflow-hidden",
            isOpen ? "max-h-96 pb-4" : "max-h-0"
          )}
        >
          <div className="flex flex-col space-y-2 pt-4">
            {mainNav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="px-4 py-2 text-gray-600 hover:bg-aura-light rounded-lg transition-colors"
                onClick={() => setIsOpen(false)}
              >
                {item.label}
              </Link>
            ))}
            <hr className="my-2" />
            <Link
              href="/auth/login"
              className="px-4 py-2 text-aura-primary font-medium"
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
          </div>
        </div>
      </nav>
    </header>
  );
}
