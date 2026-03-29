import { en } from "./translations/en";
import { es } from "./translations/es";
import { fr } from "./translations/fr";
import { pt } from "./translations/pt";
import { EXCHANGE_RATES, convertPrice } from "./rates";

// ── Types ──────────────────────────────────────────────────────────────

export type Locale = "en" | "es" | "fr" | "pt";
export type Currency = "USD" | "MXN" | "EUR" | "BRL";

export interface I18nConfig {
  locale: Locale;
  currency: Currency;
  currencySymbol: string;
  exchangeRate: number;
  dateFormat: string;
  numberFormat: { decimal: string; thousands: string };
  flag: string;
  label: string;
}

// ── Locale Configs ─────────────────────────────────────────────────────

export const SUPPORTED_LOCALES: Record<Locale, I18nConfig> = {
  en: {
    locale: "en",
    currency: "USD",
    currencySymbol: "$",
    exchangeRate: 1,
    dateFormat: "MM/DD/YYYY",
    numberFormat: { decimal: ".", thousands: "," },
    flag: "\u{1F1FA}\u{1F1F8}",
    label: "English",
  },
  es: {
    locale: "es",
    currency: "MXN",
    currencySymbol: "$",
    exchangeRate: 17.5,
    dateFormat: "DD/MM/YYYY",
    numberFormat: { decimal: ".", thousands: "," },
    flag: "\u{1F1F2}\u{1F1FD}",
    label: "Espa\u00f1ol",
  },
  fr: {
    locale: "fr",
    currency: "EUR",
    currencySymbol: "\u20ac",
    exchangeRate: 0.92,
    dateFormat: "DD/MM/YYYY",
    numberFormat: { decimal: ",", thousands: " " },
    flag: "\u{1F1EB}\u{1F1F7}",
    label: "Fran\u00e7ais",
  },
  pt: {
    locale: "pt",
    currency: "BRL",
    currencySymbol: "R$",
    exchangeRate: 5.1,
    dateFormat: "DD/MM/YYYY",
    numberFormat: { decimal: ",", thousands: "." },
    flag: "\u{1F1E7}\u{1F1F7}",
    label: "Portugu\u00eas",
  },
};

// ── Currency Metadata ──────────────────────────────────────────────────

export interface CurrencyInfo {
  code: Currency;
  symbol: string;
  label: string;
}

export const SUPPORTED_CURRENCIES: CurrencyInfo[] = [
  { code: "USD", symbol: "$", label: "USD ($)" },
  { code: "MXN", symbol: "$", label: "MXN ($)" },
  { code: "EUR", symbol: "\u20ac", label: "EUR (\u20ac)" },
  { code: "BRL", symbol: "R$", label: "BRL (R$)" },
];

// ── Translation Dictionaries ───────────────────────────────────────────

const dictionaries: Record<Locale, Record<string, string>> = {
  en,
  es,
  fr,
  pt,
};

// ── Default Locale ─────────────────────────────────────────────────────

export const DEFAULT_LOCALE: Locale = "en";
export const DEFAULT_CURRENCY: Currency = "USD";

// ── Translation Function ───────────────────────────────────────────────

/**
 * Translate a key to the given locale.
 *
 * Supports variable interpolation via `{{variable}}` syntax.
 * Falls back to English, then returns the raw key if not found.
 *
 * @example
 *   t("product.save", "es", { percent: "15" }) // "Ahorra 15%"
 */
export function t(
  key: string,
  locale: Locale = DEFAULT_LOCALE,
  variables?: Record<string, string>
): string {
  let value =
    dictionaries[locale]?.[key] ?? dictionaries[DEFAULT_LOCALE]?.[key] ?? key;

  if (variables) {
    for (const [varName, varValue] of Object.entries(variables)) {
      value = value.replace(new RegExp(`\\{\\{${varName}\\}\\}`, "g"), varValue);
    }
  }

  return value;
}

// ── Currency Formatting ────────────────────────────────────────────────

/**
 * Intl locale tags for each supported currency.
 */
const CURRENCY_LOCALE_MAP: Record<Currency, string> = {
  USD: "en-US",
  MXN: "es-MX",
  EUR: "fr-FR",
  BRL: "pt-BR",
};

/**
 * Format a monetary amount in the given currency.
 *
 * If the amount is in USD and the target currency differs, the value is
 * automatically converted using the static exchange rates.
 *
 * @param amount   The amount in the *target* currency (already converted).
 * @param currency The currency code to format for.
 */
export function formatLocalCurrency(
  amount: number,
  currency: Currency = DEFAULT_CURRENCY
): string {
  return new Intl.NumberFormat(CURRENCY_LOCALE_MAP[currency], {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

// ── Date Formatting ────────────────────────────────────────────────────

const DATE_LOCALE_MAP: Record<Locale, string> = {
  en: "en-US",
  es: "es-MX",
  fr: "fr-FR",
  pt: "pt-BR",
};

/**
 * Format a date according to the given locale.
 */
export function formatLocalDate(
  date: string | Date,
  locale: Locale = DEFAULT_LOCALE
): string {
  return new Intl.DateTimeFormat(DATE_LOCALE_MAP[locale], {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date(date));
}

// ── Locale Detection ───────────────────────────────────────────────────

/**
 * Detect the best locale from the browser's `navigator.languages` list.
 * Returns the closest supported locale, falling back to `en`.
 */
export function detectBrowserLocale(): Locale {
  if (typeof navigator === "undefined") return DEFAULT_LOCALE;

  const languages = navigator.languages ?? [navigator.language];

  for (const lang of languages) {
    const code = lang.split("-")[0].toLowerCase() as Locale;
    if (code in SUPPORTED_LOCALES) return code;
  }

  return DEFAULT_LOCALE;
}

/**
 * Detect a sensible default currency from a locale.
 */
export function defaultCurrencyForLocale(locale: Locale): Currency {
  return SUPPORTED_LOCALES[locale].currency;
}

// ── Re-exports ─────────────────────────────────────────────────────────

export { EXCHANGE_RATES, convertPrice } from "./rates";
