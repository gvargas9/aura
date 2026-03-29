"use client";

import { useState, useRef, useEffect } from "react";
import { Globe, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLocale } from "@/hooks/useLocale";
import {
  type Locale,
  type Currency,
  SUPPORTED_LOCALES,
  SUPPORTED_CURRENCIES,
} from "@/lib/i18n";

// ── Dropdown Wrapper ───────────────────────────────────────────────────

function Dropdown({
  trigger,
  children,
  align = "right",
}: {
  trigger: React.ReactNode;
  children: React.ReactNode;
  align?: "left" | "right";
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1 px-2 py-1.5 text-sm text-gray-600 hover:text-aura-dark hover:bg-gray-100 rounded-full transition-all duration-200"
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        {trigger}
        <ChevronDown
          className={cn(
            "w-3 h-3 transition-transform duration-200",
            open && "rotate-180"
          )}
        />
      </button>

      {open && (
        <div
          role="listbox"
          className={cn(
            "absolute top-full mt-1 z-50 min-w-[160px] bg-white rounded-xl shadow-lg border border-gray-200/60 py-1 animate-in fade-in slide-in-from-top-2 duration-150",
            align === "right" ? "right-0" : "left-0"
          )}
        >
          <div onClick={() => setOpen(false)}>{children}</div>
        </div>
      )}
    </div>
  );
}

// ── Option Item ────────────────────────────────────────────────────────

function Option({
  selected,
  onClick,
  children,
}: {
  selected: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      role="option"
      aria-selected={selected}
      onClick={onClick}
      className={cn(
        "flex items-center gap-2 w-full px-3 py-2 text-sm text-left transition-colors duration-150",
        selected
          ? "bg-aura-light text-aura-dark font-medium"
          : "text-gray-700 hover:bg-gray-50"
      )}
    >
      {children}
    </button>
  );
}

// ── Main Component ─────────────────────────────────────────────────────

interface LocaleSelectorProps {
  /** Render a compact version (icon only) for tight spaces. */
  compact?: boolean;
  className?: string;
}

export function LocaleSelector({ compact = false, className }: LocaleSelectorProps) {
  const { locale, currency, setLocale, setCurrency, hydrated } = useLocale();

  // Avoid flash of default values during SSR hydration.
  if (!hydrated) {
    return (
      <div className={cn("flex items-center gap-1", className)}>
        <div className="w-8 h-8 rounded-full bg-gray-100 animate-pulse" />
      </div>
    );
  }

  const currentConfig = SUPPORTED_LOCALES[locale];
  const currentCurrencyInfo = SUPPORTED_CURRENCIES.find(
    (c) => c.code === currency
  );

  return (
    <div className={cn("flex items-center gap-1", className)}>
      {/* Language Selector */}
      <Dropdown
        trigger={
          <>
            <Globe className="w-4 h-4" />
            {!compact && (
              <span className="hidden sm:inline text-xs font-medium">
                {currentConfig.flag} {currentConfig.label}
              </span>
            )}
          </>
        }
      >
        <div className="px-2 py-1.5">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 px-1">
            Language
          </span>
        </div>
        {(Object.keys(SUPPORTED_LOCALES) as Locale[]).map((loc) => {
          const cfg = SUPPORTED_LOCALES[loc];
          return (
            <Option
              key={loc}
              selected={loc === locale}
              onClick={() => setLocale(loc)}
            >
              <span className="text-base leading-none">{cfg.flag}</span>
              <span>{cfg.label}</span>
            </Option>
          );
        })}

        <div className="border-t border-gray-100 my-1" />

        <div className="px-2 py-1.5">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 px-1">
            Currency
          </span>
        </div>
        {SUPPORTED_CURRENCIES.map((cur) => (
          <Option
            key={cur.code}
            selected={cur.code === currency}
            onClick={() => setCurrency(cur.code)}
          >
            <span className="font-mono text-xs w-4 text-center">
              {cur.symbol}
            </span>
            <span>{cur.label}</span>
          </Option>
        ))}
      </Dropdown>
    </div>
  );
}

// ── Compact Inline Variant (for mobile / footer) ───────────────────────

export function LocaleSelectorInline({ className }: { className?: string }) {
  const { locale, currency, setLocale, setCurrency, hydrated } = useLocale();

  if (!hydrated) return null;

  return (
    <div className={cn("flex items-center gap-3", className)}>
      <select
        value={locale}
        onChange={(e) => setLocale(e.target.value as Locale)}
        className="text-sm bg-transparent border border-gray-300 rounded-lg px-2 py-1.5 text-gray-700 focus:outline-none focus:ring-2 focus:ring-aura-primary/30 focus:border-aura-primary"
        aria-label="Select language"
      >
        {(Object.keys(SUPPORTED_LOCALES) as Locale[]).map((loc) => {
          const cfg = SUPPORTED_LOCALES[loc];
          return (
            <option key={loc} value={loc}>
              {cfg.flag} {cfg.label}
            </option>
          );
        })}
      </select>

      <select
        value={currency}
        onChange={(e) => setCurrency(e.target.value as Currency)}
        className="text-sm bg-transparent border border-gray-300 rounded-lg px-2 py-1.5 text-gray-700 focus:outline-none focus:ring-2 focus:ring-aura-primary/30 focus:border-aura-primary"
        aria-label="Select currency"
      >
        {SUPPORTED_CURRENCIES.map((cur) => (
          <option key={cur.code} value={cur.code}>
            {cur.label}
          </option>
        ))}
      </select>
    </div>
  );
}
