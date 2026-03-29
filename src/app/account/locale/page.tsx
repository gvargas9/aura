"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Check, Globe, DollarSign, Calendar, Hash } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLocale } from "@/hooks/useLocale";
import {
  type Locale,
  type Currency,
  SUPPORTED_LOCALES,
  SUPPORTED_CURRENCIES,
  formatLocalDate,
  formatLocalCurrency,
  convertPrice,
} from "@/lib/i18n";

export default function LocaleSettingsPage() {
  const { locale, currency, setLocale, setCurrency, hydrated, t } = useLocale();
  const [saved, setSaved] = useState(false);

  // Flash a "saved" message whenever locale or currency changes.
  useEffect(() => {
    if (!hydrated) return;
    setSaved(true);
    const timer = setTimeout(() => setSaved(false), 2000);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locale, currency]);

  if (!hydrated) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12 animate-pulse">
        <div className="h-8 w-48 bg-gray-200 rounded mb-8" />
        <div className="space-y-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 bg-gray-100 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  const sampleDate = new Date();
  const sampleAmount = 59.99;

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 sm:py-12">
      {/* Back link */}
      <Link
        href="/account"
        className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-aura-dark mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>{t("nav.account")}</span>
      </Link>

      {/* Title */}
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-aura-dark">
          {t("locale.title")}
        </h1>
        {saved && (
          <span className="inline-flex items-center gap-1 text-sm text-green-600 animate-in fade-in duration-300">
            <Check className="w-4 h-4" />
            {t("locale.saved")}
          </span>
        )}
      </div>

      <div className="space-y-8">
        {/* ── Language ─────────────────────────────────────────────── */}
        <section>
          <div className="flex items-center gap-2 mb-3">
            <Globe className="w-4 h-4 text-gray-400" />
            <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">
              {t("locale.language")}
            </h2>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {(Object.keys(SUPPORTED_LOCALES) as Locale[]).map((loc) => {
              const cfg = SUPPORTED_LOCALES[loc];
              const isActive = loc === locale;
              return (
                <button
                  key={loc}
                  type="button"
                  onClick={() => setLocale(loc)}
                  className={cn(
                    "flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all duration-200",
                    isActive
                      ? "border-aura-primary bg-aura-light shadow-sm"
                      : "border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm"
                  )}
                >
                  <span className="text-2xl">{cfg.flag}</span>
                  <span
                    className={cn(
                      "text-sm font-medium",
                      isActive ? "text-aura-dark" : "text-gray-700"
                    )}
                  >
                    {cfg.label}
                  </span>
                  {isActive && (
                    <Check className="w-4 h-4 text-aura-primary" />
                  )}
                </button>
              );
            })}
          </div>
        </section>

        {/* ── Currency ────────────────────────────────────────────── */}
        <section>
          <div className="flex items-center gap-2 mb-3">
            <DollarSign className="w-4 h-4 text-gray-400" />
            <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">
              {t("locale.currency")}
            </h2>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {SUPPORTED_CURRENCIES.map((cur) => {
              const isActive = cur.code === currency;
              return (
                <button
                  key={cur.code}
                  type="button"
                  onClick={() => setCurrency(cur.code)}
                  className={cn(
                    "flex flex-col items-center gap-1.5 p-4 rounded-xl border-2 transition-all duration-200",
                    isActive
                      ? "border-aura-primary bg-aura-light shadow-sm"
                      : "border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm"
                  )}
                >
                  <span className="text-xl font-bold text-gray-700">
                    {cur.symbol}
                  </span>
                  <span
                    className={cn(
                      "text-sm font-medium",
                      isActive ? "text-aura-dark" : "text-gray-600"
                    )}
                  >
                    {cur.code}
                  </span>
                  {isActive && (
                    <Check className="w-4 h-4 text-aura-primary" />
                  )}
                </button>
              );
            })}
          </div>
        </section>

        {/* ── Preview ─────────────────────────────────────────────── */}
        <section>
          <div className="flex items-center gap-2 mb-3">
            <Hash className="w-4 h-4 text-gray-400" />
            <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">
              {t("locale.preview")}
            </h2>
          </div>

          <div className="bg-gray-50 rounded-xl p-5 space-y-4 border border-gray-200/60">
            {/* Date preview */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Calendar className="w-4 h-4" />
                <span>{t("locale.datePreview")}</span>
              </div>
              <span className="text-sm font-medium text-gray-800">
                {formatLocalDate(sampleDate, locale)}
              </span>
            </div>

            {/* Price preview */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <DollarSign className="w-4 h-4" />
                <span>{t("locale.pricePreview")}</span>
              </div>
              <span className="text-sm font-medium text-gray-800">
                {formatLocalCurrency(
                  convertPrice(sampleAmount, currency),
                  currency
                )}
              </span>
            </div>

            {/* Number preview */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Hash className="w-4 h-4" />
                <span>{t("locale.numberPreview")}</span>
              </div>
              <span className="text-sm font-medium text-gray-800">
                {new Intl.NumberFormat(
                  locale === "en"
                    ? "en-US"
                    : locale === "es"
                      ? "es-MX"
                      : locale === "fr"
                        ? "fr-FR"
                        : "pt-BR"
                ).format(1234567.89)}
              </span>
            </div>
          </div>
        </section>

        {/* Info note */}
        <p className="text-xs text-gray-400 leading-relaxed">
          Currency conversion is for display purposes only. All payments are
          processed in USD through Stripe. Exchange rates are approximate and
          updated periodically.
        </p>
      </div>
    </div>
  );
}
