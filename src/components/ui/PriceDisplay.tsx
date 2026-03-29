"use client";

import { cn } from "@/lib/utils";
import { useLocale } from "@/hooks/useLocale";

interface PriceDisplayProps {
  /** Base price in USD. */
  price: number;
  /** Original / compare-at price in USD (shown with strikethrough). */
  compareAt?: number;
  /** Subscription price in USD (shown as the savings option). */
  subscriptionPrice?: number;
  /** Display a savings badge when both price and subscriptionPrice are set. */
  showSavings?: boolean;
  /** Additional class names for the root element. */
  className?: string;
  /** Size variant. */
  size?: "sm" | "md" | "lg";
}

export function PriceDisplay({
  price,
  compareAt,
  subscriptionPrice,
  showSavings = false,
  className,
  size = "md",
}: PriceDisplayProps) {
  const { formatPrice, hydrated } = useLocale();

  // Avoid layout shift during hydration.
  if (!hydrated) {
    return (
      <div className={cn("animate-pulse", className)}>
        <div
          className={cn(
            "bg-gray-200 rounded",
            size === "sm" && "h-4 w-14",
            size === "md" && "h-6 w-20",
            size === "lg" && "h-8 w-24"
          )}
        />
      </div>
    );
  }

  const formattedPrice = formatPrice(price);
  const formattedCompareAt = compareAt ? formatPrice(compareAt) : null;
  const formattedSubscription = subscriptionPrice
    ? formatPrice(subscriptionPrice)
    : null;

  const savingsPercent =
    showSavings && subscriptionPrice
      ? Math.round(((price - subscriptionPrice) / price) * 100)
      : 0;

  const textSize = {
    sm: "text-sm",
    md: "text-lg",
    lg: "text-2xl",
  }[size];

  const compareSize = {
    sm: "text-xs",
    md: "text-sm",
    lg: "text-base",
  }[size];

  return (
    <div className={cn("flex flex-col gap-0.5", className)}>
      {/* Main price row */}
      <div className="flex items-baseline gap-2 flex-wrap">
        <span className={cn("font-bold text-aura-dark", textSize)}>
          {formattedSubscription ?? formattedPrice}
        </span>

        {formattedCompareAt && compareAt !== price && (
          <span
            className={cn(
              "line-through text-gray-400 font-medium",
              compareSize
            )}
          >
            {formattedCompareAt}
          </span>
        )}

        {showSavings && savingsPercent > 0 && (
          <span className="inline-flex items-center px-1.5 py-0.5 rounded-full bg-green-100 text-green-700 text-[11px] font-semibold leading-none">
            -{savingsPercent}%
          </span>
        )}
      </div>

      {/* Subscription vs one-time line */}
      {formattedSubscription && (
        <span className={cn("text-gray-500", compareSize)}>
          {formattedPrice}{" "}
          <span className="text-gray-400">one-time</span>
        </span>
      )}
    </div>
  );
}
