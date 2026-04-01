"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useLocale } from "@/hooks/useLocale";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import {
  Store,
  Plus,
  Pencil,
  Trash2,
  ExternalLink,
  Loader2,
  X,
  Check,
  AlertCircle,
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

export default function AdminStorefrontsPage() {
  const { t } = useLocale();
  const [storefronts, setStorefronts] = useState<Storefront[]>([]);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    domain: "",
    organization_id: "",
    tagline: "",
    targetAudience: "",
    primaryColor: "#059669",
    accentColor: "#f59e0b",
    darkColor: "#1f2937",
    featuredCategories: [] as string[],
    showB2BLink: false,
    showAcademy: false,
  });

  const fetchData = useCallback(async () => {
    const supabase = createClient();

    const [sfResult, orgResult] = await Promise.all([
      supabase
        .from("storefronts")
        .select("*")
        .order("name", { ascending: true }),
      supabase
        .from("organizations")
        .select("id, name")
        .eq("is_active", true)
        .order("name", { ascending: true }),
    ]);

    setStorefronts((sfResult.data as unknown as Storefront[]) || []);
    setOrganizations((orgResult.data as Organization[]) || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  function resetForm() {
    setFormData({
      name: "",
      slug: "",
      domain: "",
      organization_id: "",
      tagline: "",
      targetAudience: "",
      primaryColor: "#059669",
      accentColor: "#f59e0b",
      darkColor: "#1f2937",
      featuredCategories: [],
      showB2BLink: false,
      showAcademy: false,
    });
    setShowForm(false);
    setError(null);
  }

  function generateSlug(name: string) {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!formData.name || !formData.slug) {
      setError("Name and slug are required.");
      return;
    }

    setSaving(true);
    setError(null);

    const supabase = createClient();
    const { error: dbError } = await supabase.from("storefronts").insert({
      name: formData.name,
      slug: formData.slug,
      domain: formData.domain || null,
      organization_id: formData.organization_id || null,
      logo_url: null,
      is_active: true,
      theme: {
        primaryColor: formData.primaryColor,
        accentColor: formData.accentColor,
        darkColor: formData.darkColor,
      },
      settings: {
        tagline: formData.tagline || undefined,
        targetAudience: formData.targetAudience || undefined,
        showB2BLink: formData.showB2BLink,
        showAcademy: formData.showAcademy,
        featuredCategories: formData.featuredCategories,
      },
    });

    if (dbError) {
      setError(dbError.message);
      setSaving(false);
      return;
    }

    setSaving(false);
    resetForm();
    fetchData();
  }

  async function toggleActive(id: string, currentState: boolean) {
    const supabase = createClient();
    await supabase
      .from("storefronts")
      .update({ is_active: !currentState })
      .eq("id", id);
    fetchData();
  }

  async function handleDelete(id: string) {
    if (!confirm("Are you sure you want to delete this storefront?")) return;
    setDeletingId(id);
    const supabase = createClient();
    await supabase.from("storefronts").delete().eq("id", id);
    setDeletingId(null);
    fetchData();
  }

  function toggleCategory(cat: string) {
    setFormData((prev) => ({
      ...prev,
      featuredCategories: prev.featuredCategories.includes(cat)
        ? prev.featuredCategories.filter((c) => c !== cat)
        : [...prev.featuredCategories, cat],
    }));
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-aura-primary" />
      </div>
    );
  }

  return (
    <div>
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t("admin.storefronts")}</h1>
          <p className="text-gray-500 text-sm mt-1">
            {t("admin.storefrontsSubtitle")}
          </p>
        </div>
        <Button
          onClick={() => setShowForm(!showForm)}
          leftIcon={showForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          variant={showForm ? "outline" : "primary"}
        >
          {showForm ? t("common.cancel") : t("admin.addStorefront")}
        </Button>
      </div>

      {/* Add Form */}
      {showForm && (
        <Card variant="bordered" padding="lg" className="mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            {t("admin.newStorefront")}
          </h2>
          {error && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 text-red-700 text-sm mb-4">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {error}
            </div>
          )}
          <form onSubmit={handleCreate} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label={t("admin.storeName")}
                value={formData.name}
                onChange={(e) => {
                  const name = e.target.value;
                  setFormData((prev) => ({
                    ...prev,
                    name,
                    slug: prev.slug || generateSlug(name),
                  }));
                }}
                placeholder="Aura Camping"
                required
              />
              <Input
                label={t("admin.slug")}
                value={formData.slug}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""),
                  }))
                }
                placeholder="camping"
                helperText="URL-friendly identifier"
                required
              />
              <Input
                label={t("admin.customDomain")}
                value={formData.domain}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, domain: e.target.value }))
                }
                placeholder="camping.aura.com"
              />
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  {t("admin.organization")}
                </label>
                <select
                  value={formData.organization_id}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      organization_id: e.target.value,
                    }))
                  }
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
                label={t("admin.tagline")}
                value={formData.tagline}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, tagline: e.target.value }))
                }
                placeholder="Fuel your next adventure"
              />
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  {t("admin.targetAudience")}
                </label>
                <select
                  value={formData.targetAudience}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      targetAudience: e.target.value,
                    }))
                  }
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm bg-white focus:ring-2 focus:ring-aura-primary/20 focus:border-aura-primary outline-none"
                >
                  <option value="">Default</option>
                  <option value="camping">Camping</option>
                  <option value="marine">Marine</option>
                  <option value="prep">Emergency Prep</option>
                </select>
              </div>
            </div>

            {/* Theme Colors */}
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-3">
                {t("admin.themeColors")}
              </h3>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">
                    Primary
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={formData.primaryColor}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          primaryColor: e.target.value,
                        }))
                      }
                      className="w-10 h-10 rounded-lg border border-gray-200 cursor-pointer"
                    />
                    <span className="text-sm text-gray-500 font-mono">
                      {formData.primaryColor}
                    </span>
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">
                    Accent
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={formData.accentColor}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          accentColor: e.target.value,
                        }))
                      }
                      className="w-10 h-10 rounded-lg border border-gray-200 cursor-pointer"
                    />
                    <span className="text-sm text-gray-500 font-mono">
                      {formData.accentColor}
                    </span>
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">
                    Dark
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={formData.darkColor}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          darkColor: e.target.value,
                        }))
                      }
                      className="w-10 h-10 rounded-lg border border-gray-200 cursor-pointer"
                    />
                    <span className="text-sm text-gray-500 font-mono">
                      {formData.darkColor}
                    </span>
                  </div>
                </div>
              </div>
              {/* Preview */}
              <div
                className="mt-3 p-4 rounded-xl flex items-center gap-3"
                style={{ backgroundColor: formData.darkColor }}
              >
                <div
                  className="w-8 h-8 rounded-lg"
                  style={{ backgroundColor: formData.primaryColor }}
                />
                <span className="text-white font-semibold text-sm">
                  {formData.name || "Store Preview"}
                </span>
                <div
                  className="ml-auto px-3 py-1 rounded-lg text-white text-xs font-medium"
                  style={{ backgroundColor: formData.accentColor }}
                >
                  Accent
                </div>
              </div>
            </div>

            {/* Featured Categories */}
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-3">
                {t("admin.featuredCategories")}
              </h3>
              <div className="flex flex-wrap gap-2">
                {ALL_CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => toggleCategory(cat)}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium capitalize transition-colors ${
                      formData.featuredCategories.includes(cat)
                        ? "bg-aura-primary text-white"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}
                  >
                    {formData.featuredCategories.includes(cat) && (
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
                  checked={formData.showB2BLink}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      showB2BLink: e.target.checked,
                    }))
                  }
                  className="w-4 h-4 rounded border-gray-300 text-aura-primary focus:ring-aura-primary"
                />
                <span className="text-sm text-gray-700">{t("admin.showB2BLink")}</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.showAcademy}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      showAcademy: e.target.checked,
                    }))
                  }
                  className="w-4 h-4 rounded border-gray-300 text-aura-primary focus:ring-aura-primary"
                />
                <span className="text-sm text-gray-700">{t("admin.showAcademy")}</span>
              </label>
            </div>

            <div className="flex gap-3">
              <Button type="submit" isLoading={saving}>
                {t("admin.createStorefront")}
              </Button>
              <Button type="button" variant="ghost" onClick={resetForm}>
                {t("common.cancel")}
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* Storefronts Table */}
      <Card variant="bordered" padding="none">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/50">
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide px-6 py-3">
                  {t("admin.store")}
                </th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide px-6 py-3 hidden md:table-cell">
                  {t("admin.slug")}
                </th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide px-6 py-3 hidden lg:table-cell">
                  {t("admin.domain")}
                </th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide px-6 py-3 hidden md:table-cell">
                  {t("admin.organization")}
                </th>
                <th className="text-center text-xs font-semibold text-gray-500 uppercase tracking-wide px-6 py-3">
                  {t("admin.active")}
                </th>
                <th className="text-right text-xs font-semibold text-gray-500 uppercase tracking-wide px-6 py-3">
                  {t("admin.actions")}
                </th>
              </tr>
            </thead>
            <tbody>
              {storefronts.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-6 py-16 text-center text-gray-400"
                  >
                    <Store className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                    {t("admin.noStorefrontsYet")}
                  </td>
                </tr>
              ) : (
                storefronts.map((sf) => {
                  const orgName = organizations.find(
                    (o) => o.id === sf.organization_id
                  )?.name;

                  return (
                    <tr
                      key={sf.id}
                      className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-8 h-8 rounded-lg shrink-0 flex items-center justify-center text-white text-xs font-bold"
                            style={{
                              backgroundColor:
                                sf.theme?.primaryColor || "#059669",
                            }}
                          >
                            {sf.name.charAt(0)}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900 text-sm">
                              {sf.name}
                            </p>
                            {sf.settings?.tagline && (
                              <p className="text-xs text-gray-400 truncate max-w-[200px]">
                                {sf.settings.tagline}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 hidden md:table-cell">
                        <code className="text-sm text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                          {sf.slug}
                        </code>
                      </td>
                      <td className="px-6 py-4 hidden lg:table-cell">
                        <span className="text-sm text-gray-500">
                          {sf.domain || "---"}
                        </span>
                      </td>
                      <td className="px-6 py-4 hidden md:table-cell">
                        <span className="text-sm text-gray-500">
                          {orgName || "---"}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <button
                          onClick={() => toggleActive(sf.id, sf.is_active)}
                          className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold transition-colors ${
                            sf.is_active
                              ? "bg-green-50 text-green-700 hover:bg-green-100"
                              : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                          }`}
                        >
                          {sf.is_active ? t("admin.active") : t("admin.inactive")}
                        </button>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-1">
                          <Link
                            href={`/store/${sf.slug}`}
                            target="_blank"
                            className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
                            title="View live"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </Link>
                          <Link
                            href={`/admin/storefronts/${sf.id}`}
                            className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
                            title="Edit"
                          >
                            <Pencil className="w-4 h-4" />
                          </Link>
                          <button
                            onClick={() => handleDelete(sf.id)}
                            disabled={deletingId === sf.id}
                            className="p-2 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-600 transition-colors disabled:opacity-50"
                            title="Delete"
                          >
                            {deletingId === sf.id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Trash2 className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
