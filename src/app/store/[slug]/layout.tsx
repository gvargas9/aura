"use client";

import { useState, useEffect, createContext, useContext } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import {
  Menu,
  X,
  ShoppingCart,
  BookOpen,
  Package,
  Loader2,
} from "lucide-react";

interface StorefrontTheme {
  primaryColor: string;
  accentColor: string;
  darkColor: string;
  fontFamily?: string;
  heroStyle?: string;
}

interface StorefrontSettings {
  tagline?: string;
  showB2BLink?: boolean;
  showAcademy?: boolean;
  featuredCategories?: string[];
  targetAudience?: string;
}

export interface Storefront {
  id: string;
  name: string;
  slug: string;
  domain: string | null;
  logo_url: string | null;
  theme: StorefrontTheme;
  settings: StorefrontSettings;
  organization_id: string | null;
  is_active: boolean;
}

const StorefrontContext = createContext<{ storefront: Storefront | null }>({
  storefront: null,
});

export function useStorefront() {
  return useContext(StorefrontContext);
}

export default function StorefrontLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const params = useParams();
  const slug = params.slug as string;
  const [storefront, setStorefront] = useState<Storefront | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    async function fetchStorefront() {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("storefronts")
        .select("*")
        .eq("slug", slug)
        .eq("is_active", true)
        .single();

      if (error || !data) {
        setNotFound(true);
      } else {
        setStorefront(data as unknown as Storefront);
      }
      setLoading(false);
    }

    fetchStorefront();
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (notFound || !storefront) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Store Not Found</h1>
          <p className="text-gray-500 mb-6">
            The store you are looking for does not exist or is no longer active.
          </p>
          <Link
            href="/store"
            className="inline-flex items-center px-4 py-2 rounded-lg bg-emerald-600 text-white font-medium hover:bg-emerald-700 transition-colors"
          >
            Browse All Stores
          </Link>
        </div>
      </div>
    );
  }

  const theme = storefront.theme;
  const settings = storefront.settings;

  const navLinks = [
    { href: `/store/${slug}`, label: "Home" },
    { href: `/store/${slug}/products`, label: "Products", icon: Package },
    { href: `/store/${slug}/build-box`, label: "Build Box", icon: ShoppingCart },
  ];

  if (settings.showAcademy) {
    navLinks.push({ href: `/store/${slug}/academy`, label: "Academy", icon: BookOpen });
  }

  return (
    <StorefrontContext.Provider value={{ storefront }}>
      <div
        className="min-h-screen flex flex-col"
        style={
          {
            "--sf-primary": theme.primaryColor || "#059669",
            "--sf-accent": theme.accentColor || "#f59e0b",
            "--sf-dark": theme.darkColor || "#1f2937",
          } as React.CSSProperties
        }
      >
        {/* Header */}
        <header
          className="sticky top-0 z-40 border-b border-white/10"
          style={{ backgroundColor: "var(--sf-dark)" }}
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  className="md:hidden p-1.5 rounded-lg hover:bg-white/10 transition-colors"
                  aria-label="Toggle menu"
                >
                  {mobileMenuOpen ? (
                    <X className="w-5 h-5 text-white" />
                  ) : (
                    <Menu className="w-5 h-5 text-white" />
                  )}
                </button>
                <Link href={`/store/${slug}`} className="flex items-center gap-2">
                  {storefront.logo_url ? (
                    <img
                      src={storefront.logo_url}
                      alt={`${storefront.name} logo`}
                      className="w-8 h-8 rounded-lg object-cover"
                    />
                  ) : (
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-sm"
                      style={{ backgroundColor: "var(--sf-primary)" }}
                    >
                      {storefront.name.charAt(0)}
                    </div>
                  )}
                  <span className="text-lg font-bold text-white">
                    {storefront.name}
                  </span>
                </Link>
              </div>

              {/* Desktop Nav */}
              <nav className="hidden md:flex items-center gap-1">
                {navLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="px-3 py-2 rounded-lg text-sm font-medium text-gray-300 hover:text-white hover:bg-white/10 transition-colors"
                  >
                    {link.label}
                  </Link>
                ))}
              </nav>

              <div className="flex items-center gap-3">
                {settings.showB2BLink && (
                  <Link
                    href="/b2b"
                    className="hidden sm:inline-flex text-xs text-gray-400 hover:text-white transition-colors"
                  >
                    B2B Portal
                  </Link>
                )}
                <Link
                  href={`/store/${slug}/build-box`}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold text-white transition-colors"
                  style={{ backgroundColor: "var(--sf-primary)" }}
                >
                  <ShoppingCart className="w-4 h-4" />
                  <span className="hidden sm:inline">Build Box</span>
                </Link>
              </div>
            </div>
          </div>

          {/* Mobile Nav */}
          {mobileMenuOpen && (
            <div className="md:hidden border-t border-white/10 bg-black/20">
              <nav className="px-4 py-3 space-y-1">
                {navLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-gray-300 hover:text-white hover:bg-white/10 transition-colors"
                  >
                    {link.icon && <link.icon className="w-4 h-4" />}
                    {link.label}
                  </Link>
                ))}
              </nav>
            </div>
          )}
        </header>

        {/* Main Content */}
        <main className="flex-1">{children}</main>

        {/* Footer */}
        <footer
          className="border-t"
          style={{
            backgroundColor: "var(--sf-dark)",
            borderColor: "rgba(255,255,255,0.1)",
          }}
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div>
                <div className="flex items-center gap-2 mb-3">
                  {storefront.logo_url ? (
                    <img
                      src={storefront.logo_url}
                      alt={`${storefront.name} logo`}
                      className="w-7 h-7 rounded-lg object-cover"
                    />
                  ) : (
                    <div
                      className="w-7 h-7 rounded-lg flex items-center justify-center text-white font-bold text-xs"
                      style={{ backgroundColor: "var(--sf-primary)" }}
                    >
                      {storefront.name.charAt(0)}
                    </div>
                  )}
                  <span className="text-white font-semibold">
                    {storefront.name}
                  </span>
                </div>
                {settings.tagline && (
                  <p className="text-gray-400 text-sm">{settings.tagline}</p>
                )}
              </div>
              <div>
                <h4 className="text-white font-semibold text-sm mb-3">
                  Quick Links
                </h4>
                <ul className="space-y-2">
                  {navLinks.map((link) => (
                    <li key={link.href}>
                      <Link
                        href={link.href}
                        className="text-gray-400 text-sm hover:text-white transition-colors"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h4 className="text-white font-semibold text-sm mb-3">
                  Powered by Aura
                </h4>
                <p className="text-gray-400 text-sm">
                  Premium freeze-dried meals for every adventure.
                </p>
                <Link
                  href="/store"
                  className="text-gray-400 text-sm hover:text-white transition-colors mt-2 inline-block"
                >
                  Explore all stores
                </Link>
              </div>
            </div>
            <div className="mt-8 pt-6 border-t border-white/10 text-center">
              <p className="text-gray-500 text-xs">
                &copy; {new Date().getFullYear()} {storefront.name}. Powered by
                Aura. All rights reserved.
              </p>
            </div>
          </div>
        </footer>
      </div>
    </StorefrontContext.Provider>
  );
}
