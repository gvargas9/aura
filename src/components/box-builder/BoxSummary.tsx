"use client";

import { Sparkles, ArrowRight, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui";
import { useLocale } from "@/hooks/useLocale";
import { BOX_CONFIGS } from "@/types";
import type { Product } from "@/types";

interface BoxSummaryProps {
  boxSize: string;
  selectedProducts: Product[];
  onAuraFill: () => void;
  onCheckout: () => void;
  isLoading?: boolean;
}

export function BoxSummary({
  boxSize,
  selectedProducts,
  onAuraFill,
  onCheckout,
  isLoading = false,
}: BoxSummaryProps) {
  const { t, formatPrice } = useLocale();
  const config = BOX_CONFIGS[boxSize];
  const isComplete = selectedProducts.length === config.slots;
  const remainingSlots = config.slots - selectedProducts.length;

  // Calculate totals
  const itemsTotal = selectedProducts.reduce((sum, p) => sum + p.price, 0);
  const boxPrice = config.price;
  const savings = itemsTotal > boxPrice ? itemsTotal - boxPrice : 0;
  const tierKey = `tier.${boxSize}`;

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm sticky top-24">
      <h3 className="font-semibold text-lg mb-4">{t("box.orderSummary")}</h3>

      {/* Box Type */}
      <div className="flex items-center justify-between py-3 border-b">
        <span className="text-gray-600">{t("box.boxType", { size: t(tierKey) })}</span>
        <span className="font-medium">{config.slots} {t("box.items")}</span>
      </div>

      {/* Items Value */}
      {selectedProducts.length > 0 && (
        <div className="flex items-center justify-between py-3 border-b">
          <span className="text-gray-600">{t("box.itemsValue")}</span>
          <span className="font-medium">{formatPrice(itemsTotal)}</span>
        </div>
      )}

      {/* Box Subscription Price */}
      <div className="flex items-center justify-between py-3 border-b">
        <span className="text-gray-600">{t("box.subscriptionPrice")}</span>
        <span className="font-semibold text-aura-primary">
          {formatPrice(boxPrice)}
        </span>
      </div>

      {/* Savings */}
      {savings > 0 && (
        <div className="flex items-center justify-between py-3 border-b text-green-600">
          <span>{t("box.youSave")}</span>
          <span className="font-medium">{formatPrice(savings)}</span>
        </div>
      )}

      {/* Shipping */}
      <div className="flex items-center justify-between py-3 border-b">
        <span className="text-gray-600">{t("box.shipping")}</span>
        <span className="font-medium text-green-600">{t("box.free")}</span>
      </div>

      {/* Total */}
      <div className="flex items-center justify-between py-4">
        <span className="font-semibold text-lg">{t("box.monthlyTotal")}</span>
        <span className="font-bold text-xl text-aura-primary">
          {formatPrice(boxPrice)}
        </span>
      </div>

      {/* Status Message */}
      {!isComplete && (
        <div className="mb-4 p-3 bg-amber-50 rounded-lg flex items-start gap-2">
          <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-amber-700">
            {t("box.completeBox", {
              count: String(remainingSlots),
              items: remainingSlots === 1 ? t("box.item") : t("box.items"),
            })}
          </p>
        </div>
      )}

      {/* Aura Fill Button */}
      {!isComplete && (
        <Button
          variant="secondary"
          className="w-full mb-3"
          onClick={onAuraFill}
          leftIcon={<Sparkles className="w-5 h-5" />}
        >
          {t("box.auraFill")}
        </Button>
      )}

      {/* Checkout Button */}
      <Button
        className="w-full"
        disabled={!isComplete}
        onClick={onCheckout}
        isLoading={isLoading}
        rightIcon={<ArrowRight className="w-5 h-5" />}
      >
        {isComplete ? t("box.continueCheckout") : t("box.completeFirst")}
      </Button>

      <p className="text-xs text-gray-400 text-center mt-4">
        {t("box.cancelAnytime")}
      </p>
    </div>
  );
}
