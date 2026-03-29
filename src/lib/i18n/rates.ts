import type { Currency } from "./index";

/**
 * Static exchange rates relative to USD.
 * These are approximate rates for display purposes only.
 * Stripe still charges in USD -- currency conversion is cosmetic.
 * Update periodically or replace with a live API later.
 */
export const EXCHANGE_RATES: Record<Currency, number> = {
  USD: 1,
  MXN: 17.5,
  EUR: 0.92,
  BRL: 5.1,
};

/**
 * Convert a USD amount to the target currency.
 * Rounds to two decimal places.
 */
export function convertPrice(usdAmount: number, toCurrency: Currency): number {
  const rate = EXCHANGE_RATES[toCurrency];
  return Math.round(usdAmount * rate * 100) / 100;
}
