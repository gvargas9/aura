"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import {
  type Locale,
  type Currency,
  DEFAULT_LOCALE,
  DEFAULT_CURRENCY,
  SUPPORTED_LOCALES,
  detectBrowserLocale,
  defaultCurrencyForLocale,
  t as translate,
  formatLocalCurrency,
  formatLocalDate,
  convertPrice,
} from "@/lib/i18n";

// ── Storage Keys ───────────────────────────────────────────────────────

const LOCALE_KEY = "aura_locale";
const CURRENCY_KEY = "aura_currency";

// ── Helpers ────────────────────────────────────────────────────────────

function readStorage<T extends string>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const stored = localStorage.getItem(key);
    return (stored as T) ?? fallback;
  } catch {
    return fallback;
  }
}

function writeStorage(key: string, value: string): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(key, value);
  } catch {
    // Storage full or blocked -- silently ignore.
  }
}

// ── Custom Event for Cross-Component Sync ──────────────────────────────

const LOCALE_CHANGE_EVENT = "aura:locale-change";

function dispatchLocaleChange() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(LOCALE_CHANGE_EVENT));
  }
}

// ── Hook ───────────────────────────────────────────────────────────────

export function useLocale() {
  const [locale, setLocaleState] = useState<Locale>(DEFAULT_LOCALE);
  const [currency, setCurrencyState] = useState<Currency>(DEFAULT_CURRENCY);
  const [hydrated, setHydrated] = useState(false);

  // Hydrate from localStorage / browser detection on mount.
  useEffect(() => {
    const storedLocale = readStorage<Locale>(LOCALE_KEY, "" as Locale);
    const storedCurrency = readStorage<Currency>(CURRENCY_KEY, "" as Currency);

    const resolvedLocale =
      storedLocale && storedLocale in SUPPORTED_LOCALES
        ? storedLocale
        : detectBrowserLocale();

    const resolvedCurrency =
      storedCurrency && ["USD", "MXN", "EUR", "BRL"].includes(storedCurrency)
        ? storedCurrency
        : defaultCurrencyForLocale(resolvedLocale);

    setLocaleState(resolvedLocale);
    setCurrencyState(resolvedCurrency);
    setHydrated(true);
  }, []);

  // Listen for cross-component sync events.
  useEffect(() => {
    const handler = () => {
      const l = readStorage<Locale>(LOCALE_KEY, DEFAULT_LOCALE);
      const c = readStorage<Currency>(CURRENCY_KEY, DEFAULT_CURRENCY);
      setLocaleState(l);
      setCurrencyState(c);
    };

    window.addEventListener(LOCALE_CHANGE_EVENT, handler);
    return () => window.removeEventListener(LOCALE_CHANGE_EVENT, handler);
  }, []);

  // ── Setters ────────────────────────────────────────────────────────

  const setLocale = useCallback((newLocale: Locale) => {
    setLocaleState(newLocale);
    writeStorage(LOCALE_KEY, newLocale);
    dispatchLocaleChange();
  }, []);

  const setCurrency = useCallback((newCurrency: Currency) => {
    setCurrencyState(newCurrency);
    writeStorage(CURRENCY_KEY, newCurrency);
    dispatchLocaleChange();
  }, []);

  // ── Bound Helpers ──────────────────────────────────────────────────

  const t = useCallback(
    (key: string, variables?: Record<string, string>) =>
      translate(key, locale, variables),
    [locale]
  );

  const formatPrice = useCallback(
    (usdAmount: number) => {
      const converted = convertPrice(usdAmount, currency);
      return formatLocalCurrency(converted, currency);
    },
    [currency]
  );

  const formatDate = useCallback(
    (date: string | Date) => formatLocalDate(date, locale),
    [locale]
  );

  const config = useMemo(() => SUPPORTED_LOCALES[locale], [locale]);

  return {
    /** Current active locale. */
    locale,
    /** Current active currency code. */
    currency,
    /** Full config object for the active locale. */
    config,
    /** Whether the hook has finished reading from localStorage. */
    hydrated,
    /** Change the locale and persist to localStorage. */
    setLocale,
    /** Change the currency and persist to localStorage. */
    setCurrency,
    /** Translate a key using the active locale. */
    t,
    /** Format a USD amount in the active currency. */
    formatPrice,
    /** Format a date in the active locale. */
    formatDate,
  };
}
