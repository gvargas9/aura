"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import {
  ArrowLeft,
  ExternalLink,
  Loader2,
  Save,
  Check,
  AlertCircle,
  Store,
} from "lucide-react";

interface Storefront {
  id: string;
  name: string;
  slug: string;
  domain: string | null;
  logo_url: string | null;
  theme: {
    primaryColor: string;
    accentColor: string;
    darkColor: string;
    fontFamily?: string;
  };
  settings: {
    tagline?: string;
    showB2BLink?: boolean;
    showAcademy?: boolean;
    featuredCategories?: string[];
    targetAudience?: string;
  };
  organization_id: string | null;
  is_active: boolean;
}

interface Organization {
  id: string;
  name: string;
}

const ALL_CATEGORIES = [
  "entrees",
  "breakfast",
  "sides",
  "snacks",
  "desserts",
  "drinks",
  "fruits",
  "vegetables",
  "proteins",
  "grains",
  "soups",
  "emergency",
];

export default function AdminStorefrontEditPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [storefront, setStorefront] = useState<Storefront | null>(null);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form fields
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [domain, setDomain] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [organizationId, setOrganizationId] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [tagline, setTagline] = useState("");
  const [targetAudience, setTargetAudience] = useState("");
  const [primaryColor, setPrimaryColor] = useState("#059669");
  const [accentColor, setAccentColor] = useState("#f59e0b");
  const [darkColor, setDarkColor] = useState("#1f2937");
  const [fontFamily, setFontFamily] = useState("");
  const [featuredCategories, setFeaturedCategories] = useState<string[]>([]);
  const [showB2BLink, setShowB2BLink] = useState(false);
  const [showAcademy, setShowAcademy] = useState(false);

  const fetchData = useCallback(async () => {
    const supabase = createClient();

    const [sfResult, orgResult] = await Promise.all([
      supabase.from("storefronts").select("*").eq("id", id).single(),
      supabase
        .from("organizations")
        .select("id, name")
        .eq("is_active", true)
        .order("name", { ascending: true }),
    ]);

    if (sfResult.error || !sfResult.data) {
      setError("Storefront not found.");
      setLoading(false);
      return;
    }

    const sf = sfResult.data as unknown as Storefront;
    setStorefront(sf);
    setOrganizations((orgResult.data as Organization[]) || []);

    // Populate form
    setName(sf.name);
    setSlug(sf.slug);
    setDomain(sf.domain || "");
    setLogoUrl(sf.logo_url || "");
    setOrganizationId(sf.organization_id || "");
    setIsActive(sf.is_active);
    setTagline(sf.settings?.tagline || "");
    setTargetAudience(sf.settings?.targetAudience || "");
    setPrimaryColor(sf.theme?.primaryColor || "#059669");
    setAccentColor(sf.theme?.accentColor || "#f59e0b");
    setDarkColor(sf.theme?.darkColor || "#1f2937");
    setFontFamily(sf.theme?.fontFamily || "");
    setFeaturedCategories(sf.settings?.featuredCategories || []);
    setShowB2BLink(sf.settings?.showB2BLink || false);
    setShowAcademy(sf.settings?.showAcademy || false);

    setLoading(false);
  }, [id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  function toggleCategory(cat: string) {
    setFeaturedCategories((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    );
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!name || !slug) {
      setError("Name and slug are required.");
      return;
    }

    setSaving(true);
    setError(null);
    setSaved(false);

    const supabase = createClient();
    const { error: dbError } = await supabase
      .from("storefronts")
      .update({
        name,
        slug,
        domain: domain || null,
        logo_url: logoUrl || null,
        organization_id: organizationId || null,
        is_active: isActive,
        theme: {
          primaryColor,
          accentColor,
          darkColor,
          fontFamily: fontFamily || undefined,
        },
        settings: {
          tagline: tagline || undefined,
          targetAudience: targetAudience || undefined,
          showB2BLink,
          showAcademy,
          featuredCategories,
        },
      })
      .eq("id", id);

    if (dbError) {
      setError(dbError.message);
      setSaving(false);
      return;
    }

    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-aura-primary" />
      </div>
    );
  }

  if (!storefront) {
    return (
      <div className="text-center py-20">
        <Store className="w-12 h-12 text-gray-300 mx-auto mb-3" />
        <p className="text-gray-500">Storefront not found.</p>
        <Link
          href="/admin/storefronts"
          className="text-aura-primary hover:underline text-sm mt-2 inline-block"
        >
          Back to storefronts
        </Link>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-4">
          <Link
            href="/admin/storefronts"
            className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Edit: {storefront.name}
            </h1>
            <p className="text-gray-500 text-sm mt-0.5">
              Storefront configuration and theming
            </p>
          </div>
        </div>
        <Link
          href={`/store/${storefront.slug}`}
          target="_blank"
          className="inline-flex items-center gap-1.5 text-sm text-aura-primary hover:underline"
        >
          View Live Store
          <ExternalLink className="w-3.5 h-3.5" />
        </Link>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 text-red-700 text-sm mb-6">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {error}
        </div>
      )}

      <form onSubmit={handleSave}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left column: Form fields */}
          <div className="lg:col-span-2 space-y-6">
            {/* General */}
            <Card variant="bordered" padding="lg">
              <h2 className="text-base font-semibold text-gray-900 mb-4">
                General
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Store Name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
                <Input
                  label="Slug"
                  value={slug}
                  onChange={(e) =>
                    setSlug(
                      e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "")
                    )
                  }
                  required
                />
                <Input
                  label="Custom Domain"
                  value={domain}
                  onChange={(e) => setDomain(e.target.value)}
                  placeholder="store.example.com"
                />
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Organization
                  </label>
                  <select
                    value={organizationId}
                    onChange={(e) => setOrganizationId(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm bg-white focus:ring-2 focus:ring-aura-primary/20 focus:border-aura-primary outline-none"
                  >
                    <option value="">None</option>
                    {organizations.map((org) => (
                      <option key={org.id} value={org.id}>
                        {org.name}
                      </option>
                    ))}
                  </select>
                </div>
                <Input
                  label="Logo URL"
                  value={logoUrl}
                  onChange={(e) => setLogoUrl(e.target.value)}
                  placeholder="https://..."
                />
                <div className="flex items-end">
                  <label className="flex items-center gap-2 cursor-pointer py-3">
                    <input
                      type="checkbox"
                      checked={isActive}
                      onChange={(e) => setIsActive(e.target.checked)}
                      className="w-4 h-4 rounded border-gray-300 text-aura-primary focus:ring-aura-primary"
                    />
                    <span className="text-sm font-medium text-gray-700">
                      Active
                    </span>
                  </label>
                </div>
              </div>
            </Card>

            {/* Settings */}
            <Card variant="bordered" padding="lg">
              <h2 className="text-base font-semibold text-gray-900 mb-4">
                Settings
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <Input
                  label="Tagline"
                  value={tagline}
                  onChange={(e) => setTagline(e.target.value)}
                  placeholder="Fuel your next adventure"
                />
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Target Audience
                  </label>
                  <select
                    value={targetAudience}
                    onChange={(e) => setTargetAudience(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm bg-white focus:ring-2 focus:ring-aura-primary/20 focus:border-aura-primary outline-none"
                  >
                    <option value="">Default</option>
                    <option value="camping">Camping</option>
                    <option value="marine">Marine</option>
                    <option value="prep">Emergency Prep</option>
                  </select>
                </div>
              </div>

              {/* Categories */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Featured Categories
                </label>
                <div className="flex flex-wrap gap-2">
                  {ALL_CATEGORIES.map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => toggleCategory(cat)}
                      className={`px-3 py-1.5 rounded-full text-sm font-medium capitalize transition-colors ${
                        featuredCategories.includes(cat)
                          ? "bg-aura-primary text-white"
                          : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                      }`}
                    >
                      {featuredCategories.includes(cat) && (
                        <Check className="w-3 h-3 inline mr-1" />
                      )}
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Toggles */}
              <div className="flex flex-wrap gap-6">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showB2BLink}
                    onChange={(e) => setShowB2BLink(e.target.checked)}
                    className="w-4 h-4 rounded border-gray-300 text-aura-primary focus:ring-aura-primary"
                  />
                  <span className="text-sm text-gray-700">Show B2B Link</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showAcademy}
                    onChange={(e) => setShowAcademy(e.target.checked)}
                    className="w-4 h-4 rounded border-gray-300 text-aura-primary focus:ring-aura-primary"
                  />
                  <span className="text-sm text-gray-700">Show Academy</span>
                </label>
              </div>
            </Card>

            {/* Theme */}
            <Card variant="bordered" padding="lg">
              <h2 className="text-base font-semibold text-gray-900 mb-4">
                Theme
              </h2>
              <div className="grid grid-cols-3 gap-4 mb-4">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">
                    Primary Color
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={primaryColor}
                      onChange={(e) => setPrimaryColor(e.target.value)}
                      className="w-10 h-10 rounded-lg border border-gray-200 cursor-pointer"
                    />
                    <input
                      type="text"
                      value={primaryColor}
                      onChange={(e) => setPrimaryColor(e.target.value)}
                      className="w-full px-2 py-1.5 border border-gray-200 rounded-lg text-xs font-mono"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">
                    Accent Color
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={accentColor}
                      onChange={(e) => setAccentColor(e.target.value)}
                      className="w-10 h-10 rounded-lg border border-gray-200 cursor-pointer"
                    />
                    <input
                      type="text"
                      value={accentColor}
                      onChange={(e) => setAccentColor(e.target.value)}
                      className="w-full px-2 py-1.5 border border-gray-200 rounded-lg text-xs font-mono"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">
                    Dark Color
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={darkColor}
                      onChange={(e) => setDarkColor(e.target.value)}
                      className="w-10 h-10 rounded-lg border border-gray-200 cursor-pointer"
                    />
                    <input
                      type="text"
                      value={darkColor}
                      onChange={(e) => setDarkColor(e.target.value)}
                      className="w-full px-2 py-1.5 border border-gray-200 rounded-lg text-xs font-mono"
                    />
                  </div>
                </div>
              </div>
              <Input
                label="Font Family (optional)"
                value={fontFamily}
                onChange={(e) => setFontFamily(e.target.value)}
                placeholder="Inter, system-ui, sans-serif"
              />
            </Card>
          </div>

          {/* Right column: Preview + Save */}
          <div className="lg:col-span-1">
            <div className="sticky top-20 space-y-6">
              {/* Theme Preview */}
              <Card variant="bordered" padding="none" className="overflow-hidden">
                <div
                  className="p-4"
                  style={{ backgroundColor: darkColor }}
                >
                  <div className="flex items-center gap-2 mb-3">
                    {logoUrl ? (
                      <img
                        src={logoUrl}
                        alt="Logo preview"
                        className="w-8 h-8 rounded-lg object-cover"
                      />
                    ) : (
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-sm"
                        style={{ backgroundColor: primaryColor }}
                      >
                        {name.charAt(0) || "S"}
                      </div>
                    )}
                    <span className="text-white font-semibold text-sm">
                      {name || "Store Name"}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <div
                      className="px-3 py-1.5 rounded-lg text-white text-xs font-medium"
                      style={{ backgroundColor: primaryColor }}
                    >
                      Primary Button
                    </div>
                    <div
                      className="px-3 py-1.5 rounded-lg text-white text-xs font-medium"
                      style={{ backgroundColor: accentColor }}
                    >
                      Accent
                    </div>
                  </div>
                </div>
                <div className="p-4 bg-gray-50">
                  <p className="text-xs text-gray-500 mb-2">
                    Live at:{" "}
                    <Link
                      href={`/store/${slug}`}
                      target="_blank"
                      className="text-aura-primary hover:underline"
                    >
                      /store/{slug}
                    </Link>
                  </p>
                  {domain && (
                    <p className="text-xs text-gray-400">
                      Custom domain: {domain}
                    </p>
                  )}
                </div>
              </Card>

              {/* Save Button */}
              <Button
                type="submit"
                className="w-full"
                isLoading={saving}
                leftIcon={
                  saved ? (
                    <Check className="w-4 h-4" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )
                }
                variant={saved ? "accent" : "primary"}
              >
                {saving ? "Saving..." : saved ? "Saved" : "Save Changes"}
              </Button>

              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={() => router.push("/admin/storefronts")}
              >
                Back to Storefronts
              </Button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
