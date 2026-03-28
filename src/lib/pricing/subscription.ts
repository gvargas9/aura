import type { BoxPricing } from "@/types";

/**
 * Subscribe & Save pricing configuration.
 * Subscription pricing offers a discount compared to one-time purchase.
 */
export const SUBSCRIPTION_DISCOUNTS: Record<
  string,
  {
    subscriptionPrice: number;
    oneTimePrice: number;
    savingsPercent: number;
  }
> = {
  starter: { subscriptionPrice: 59.99, oneTimePrice: 69.99, savingsPercent: 14 },
  voyager: { subscriptionPrice: 84.99, oneTimePrice: 99.99, savingsPercent: 15 },
  bunker: { subscriptionPrice: 149.99, oneTimePrice: 179.99, savingsPercent: 17 },
};

const BOX_SLOTS: Record<string, number> = {
  starter: 8,
  voyager: 12,
  bunker: 24,
};

const BOX_DESCRIPTIONS: Record<string, string> = {
  starter: "Perfect for individuals - 8 premium meals",
  voyager: "Great for couples - 12 premium meals",
  bunker: "Family pack - 24 premium meals",
};

/**
 * Get the full pricing breakdown for a box size and purchase type.
 */
export function getBoxPricing(
  boxSize: string,
  purchaseType: "subscription" | "one_time"
): BoxPricing {
  const normalizedSize = boxSize.toLowerCase();
  const discount = SUBSCRIPTION_DISCOUNTS[normalizedSize];

  if (!discount) {
    throw new Error(`Invalid box size: ${boxSize}. Must be starter, voyager, or bunker.`);
  }

  const slots = BOX_SLOTS[normalizedSize];
  const description = BOX_DESCRIPTIONS[normalizedSize];

  const price =
    purchaseType === "subscription"
      ? discount.subscriptionPrice
      : discount.oneTimePrice;

  const savings =
    purchaseType === "subscription"
      ? roundPrice(discount.oneTimePrice - discount.subscriptionPrice)
      : 0;

  return {
    size: normalizedSize as BoxPricing["size"],
    slots,
    subscriptionPrice: discount.subscriptionPrice,
    oneTimePrice: discount.oneTimePrice,
    compareAtPrice: discount.oneTimePrice,
    subscriptionSavings: savings,
    savingsPercent:
      purchaseType === "subscription" ? discount.savingsPercent : 0,
    description,
  };
}

/**
 * Get pricing for all box sizes for a given purchase type.
 */
export function getAllBoxPricing(
  purchaseType: "subscription" | "one_time"
): BoxPricing[] {
  return ["starter", "voyager", "bunker"].map((size) =>
    getBoxPricing(size, purchaseType)
  );
}

function roundPrice(amount: number): number {
  return Math.round(amount * 100) / 100;
}
