"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useDealerContext } from "../layout";
import { useLocale } from "@/hooks/useLocale";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import {
  Palette,
  Save,
  Check,
  AlertCircle,
  Loader2,
  Lock,
  ArrowRight,
  Eye,
} from "lucide-react";

export default function BrandingPage() {
  const { dealer, organization, profile } = useDealerContext();
  const { t } = useLocale();

  const [logoUrl, setLogoUrl] = useState("");
  const [primaryColor, setPrimaryColor] = useState("#059669");
  const [tagline, setTagline] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const isEligible =
    organization &&
    (organization.dealer_tier === "gold" ||
      organization.dealer_tier === "platinum");

  useEffect(() => {
    if (organization?.metadata) {
      const meta = organization.metadata as Record<string, unknown>;
      const branding = meta.branding as Record<string, string> | undefined;
      if (branding) {
        setLogoUrl(branding.logo_url || "");
        setPrimaryColor(branding.primary_color || "#059669");
        setTagline(branding.tagline || "");
      }
    }
    setLoading(false);
  }, [organization]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!organization) return;

    setSaving(true);
    setError(null);
    setSaved(false);

    const supabase = createClient();
    const existingMeta = (organization.metadata as Record<string, unknown>) || {};

    const { error: dbError } = await supabase
      .from("organizations")
      .update({
        metadata: {
          ...existingMeta,
          branding: {
            logo_url: logoUrl || undefined,
            primary_color: primaryColor,
            tagline: tagline || undefined,
          },
        },
      })
      .eq("id", organization.id);

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
        <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
      </div>
    );
  }

  // Not eligible - show upgrade prompt
  if (!isEligible) {
    return (
      <div>
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-slate-900">
            {t("b2b.branding.title")}
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            {t("b2b.branding.subtitleLocked")}
          </p>
        </div>

        <Card variant="bordered" padding="lg" className="max-w-lg mx-auto text-center">
          <div className="w-16 h-16 rounded-2xl bg-amber-50 flex items-center justify-center mx-auto mb-4">
            <Lock className="w-8 h-8 text-amber-500" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">
            {t("b2b.branding.upgradeTitle")}
          </h2>
          <p className="text-slate-500 text-sm mb-6">
            {t("b2b.branding.upgradeDesc")}
          </p>
          <div className="flex flex-col items-center gap-3">
            <div className="flex items-center gap-4 text-sm text-slate-600">
              <span className="flex items-center gap-1.5">
                <Check className="w-4 h-4 text-amber-500" />
                {t("b2b.branding.customLogo")}
              </span>
              <span className="flex items-center gap-1.5">
                <Check className="w-4 h-4 text-amber-500" />
                {t("b2b.branding.brandColors")}
              </span>
              <span className="flex items-center gap-1.5">
                <Check className="w-4 h-4 text-amber-500" />
                {t("b2b.branding.customTagline")}
              </span>
            </div>
            <p className="text-xs text-slate-400">
              {t("b2b.branding.currentTier")}{" "}
              <span className="font-semibold capitalize">
                {organization?.dealer_tier || "bronze"}
              </span>
            </p>
          </div>
        </Card>
      </div>
    );
  }

  const referralCode = dealer?.referral_code || "YOUR-CODE";

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">
          {t("b2b.branding.title")}
        </h1>
        <p className="text-slate-500 text-sm mt-1">
          {t("b2b.branding.subtitle")}
        </p>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 text-red-700 text-sm mb-6">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Form */}
        <div>
          <form onSubmit={handleSave} className="space-y-6">
            <Card variant="bordered" padding="lg">
              <h2 className="text-base font-semibold text-slate-900 mb-4 flex items-center gap-2">
                <Palette className="w-5 h-5 text-blue-600" />
                {t("b2b.branding.settings")}
              </h2>

              <div className="space-y-4">
                <Input
                  label={t("b2b.branding.logoUrl")}
                  value={logoUrl}
                  onChange={(e) => setLogoUrl(e.target.value)}
                  placeholder="https://your-domain.com/logo.png"
                  helperText={t("b2b.branding.logoHelper")}
                />

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    {t("b2b.branding.primaryColor")}
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={primaryColor}
                      onChange={(e) => setPrimaryColor(e.target.value)}
                      className="w-12 h-12 rounded-xl border border-gray-200 cursor-pointer"
                    />
                    <div className="flex-1">
                      <input
                        type="text"
                        value={primaryColor}
                        onChange={(e) => setPrimaryColor(e.target.value)}
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm font-mono bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                        placeholder="#059669"
                      />
                    </div>
                  </div>
                </div>

                <Input
                  label={t("b2b.branding.tagline")}
                  value={tagline}
                  onChange={(e) => setTagline(e.target.value)}
                  placeholder="Your adventure starts here"
                  helperText={t("b2b.branding.taglineHelper")}
                />
              </div>
            </Card>

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
              {saving
                ? t("b2b.branding.saving")
                : saved
                  ? t("b2b.branding.saved")
                  : t("b2b.branding.saveBranding")}
            </Button>
          </form>
        </div>

        {/* Preview */}
        <div>
          <Card variant="bordered" padding="none" className="overflow-hidden">
            <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center gap-2">
              <Eye className="w-4 h-4 text-slate-400" />
              <span className="text-sm font-medium text-slate-600">
                {t("b2b.branding.preview")}
              </span>
            </div>

            <div className="p-0">
              {/* Mini browser frame */}
              <div className="border-b border-gray-100 px-4 py-2 bg-gray-50 flex items-center gap-2">
                <div className="flex gap-1">
                  <div className="w-2.5 h-2.5 rounded-full bg-red-300" />
                  <div className="w-2.5 h-2.5 rounded-full bg-amber-300" />
                  <div className="w-2.5 h-2.5 rounded-full bg-green-300" />
                </div>
                <div className="flex-1 px-3 py-1 bg-white rounded text-[10px] text-gray-400 font-mono truncate">
                  aura.com/ref/{referralCode}
                </div>
              </div>

              {/* Preview content */}
              <div>
                {/* Header */}
                <div
                  className="px-4 py-3 flex items-center gap-2"
                  style={{
                    backgroundColor: primaryColor || "#059669",
                  }}
                >
                  {logoUrl ? (
                    <img
                      src={logoUrl}
                      alt="Brand logo"
                      className="w-6 h-6 rounded object-cover"
                    />
                  ) : (
                    <div className="w-6 h-6 rounded bg-white/20 flex items-center justify-center text-white text-[10px] font-bold">
                      {organization?.name?.charAt(0) || "B"}
                    </div>
                  )}
                  <span className="text-white font-semibold text-xs">
                    {organization?.name || "Your Brand"}
                  </span>
                </div>

                {/* Hero */}
                <div className="px-6 py-8 bg-white text-center">
                  <h3 className="text-base font-bold text-gray-900 mb-1">
                    {t("b2b.branding.premiumMeals")}
                  </h3>
                  {tagline && (
                    <p
                      className="text-xs font-medium mb-3"
                      style={{ color: primaryColor || "#059669" }}
                    >
                      {tagline}
                    </p>
                  )}
                  <p className="text-[11px] text-gray-500 mb-4">
                    {t("b2b.branding.referredBy")} {profile?.full_name || "Your Name"}
                  </p>
                  <div
                    className="inline-flex items-center gap-1 px-4 py-2 rounded-lg text-white text-xs font-semibold"
                    style={{
                      backgroundColor: primaryColor || "#059669",
                    }}
                  >
                    {t("b2b.branding.buildYourBox")}
                    <ArrowRight className="w-3 h-3" />
                  </div>
                </div>

                {/* Footer */}
                <div className="px-4 py-2 bg-gray-50 border-t border-gray-100">
                  <p className="text-[9px] text-gray-400 text-center">
                    {t("b2b.branding.poweredBy")}
                  </p>
                </div>
              </div>
            </div>
          </Card>

          <p className="text-xs text-slate-400 mt-3 text-center">
            {t("b2b.branding.referralLink")}{" "}
            <code className="bg-slate-100 px-1.5 py-0.5 rounded text-slate-600">
              aura.com/ref/{referralCode}
            </code>
          </p>
        </div>
      </div>
    </div>
  );
}
