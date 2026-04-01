"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Card } from "@/components/ui/Card";
import { useLocale } from "@/hooks/useLocale";
import { Loader2, Store, ArrowRight } from "lucide-react";

interface StorefrontListItem {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  theme: {
    primaryColor: string;
    accentColor: string;
    darkColor: string;
  };
  settings: {
    tagline?: string;
    targetAudience?: string;
  };
  is_active: boolean;
}

export default function StorefrontDirectoryPage() {
  const { t } = useLocale();
  const [storefronts, setStorefronts] = useState<StorefrontListItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStorefronts() {
      const supabase = createClient();
      const { data } = await supabase
        .from("storefronts")
        .select("id, name, slug, logo_url, theme, settings, is_active")
        .eq("is_active", true)
        .order("name", { ascending: true });

      setStorefronts((data as unknown as StorefrontListItem[]) || []);
      setLoading(false);
    }

    fetchStorefronts();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero */}
      <section className="bg-aura-dark">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
          <div className="text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-emerald-400 text-sm font-medium mb-4">
              <Store className="w-4 h-4" />
              {t("store.title")}
            </div>
            <h1 className="text-4xl sm:text-5xl font-extrabold text-white tracking-tight mb-4">
              {t("store.heading")}
            </h1>
            <p className="text-lg text-gray-400 max-w-2xl mx-auto">
              {t("store.subtitle")}
            </p>
          </div>
        </div>
      </section>

      {/* Store Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
          </div>
        ) : storefronts.length === 0 ? (
          <div className="text-center py-20">
            <Store className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">{t("store.noStores")}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {storefronts.map((sf) => (
              <Link key={sf.id} href={`/store/${sf.slug}`} className="group">
                <Card
                  variant="bordered"
                  padding="none"
                  className="overflow-hidden h-full"
                >
                  {/* Color Banner */}
                  <div
                    className="h-24 relative"
                    style={{
                      background: `linear-gradient(135deg, ${sf.theme.primaryColor || "#059669"}, ${sf.theme.darkColor || "#1f2937"})`,
                    }}
                  >
                    <div className="absolute bottom-0 left-6 translate-y-1/2">
                      {sf.logo_url ? (
                        <img
                          src={sf.logo_url}
                          alt={`${sf.name} logo`}
                          className="w-14 h-14 rounded-xl border-4 border-white object-cover shadow-md"
                        />
                      ) : (
                        <div
                          className="w-14 h-14 rounded-xl border-4 border-white flex items-center justify-center text-white font-bold text-xl shadow-md"
                          style={{
                            backgroundColor: sf.theme.primaryColor || "#059669",
                          }}
                        >
                          {sf.name.charAt(0)}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="pt-10 px-6 pb-6">
                    <h3 className="text-lg font-bold text-gray-900 mb-1 group-hover:text-emerald-700 transition-colors">
                      {sf.name}
                    </h3>
                    {sf.settings.tagline && (
                      <p className="text-sm text-gray-500 line-clamp-2 mb-4">
                        {sf.settings.tagline}
                      </p>
                    )}

                    {/* Theme Colors Preview */}
                    <div className="flex items-center gap-3 mb-4">
                      <div className="flex items-center gap-1.5">
                        <div
                          className="w-4 h-4 rounded-full border border-gray-200"
                          style={{
                            backgroundColor: sf.theme.primaryColor || "#059669",
                          }}
                          title="Primary"
                        />
                        <div
                          className="w-4 h-4 rounded-full border border-gray-200"
                          style={{
                            backgroundColor: sf.theme.accentColor || "#f59e0b",
                          }}
                          title="Accent"
                        />
                        <div
                          className="w-4 h-4 rounded-full border border-gray-200"
                          style={{
                            backgroundColor: sf.theme.darkColor || "#1f2937",
                          }}
                          title="Dark"
                        />
                      </div>
                      {sf.settings.targetAudience && (
                        <span className="text-xs text-gray-400 capitalize">
                          {sf.settings.targetAudience}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1 text-sm font-medium text-emerald-600 group-hover:text-emerald-700 transition-colors">
                      {t("store.visitStore")}
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
