"use client";

import { Sparkles, ArrowRight, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui";
import { cn, formatCurrency } from "@/lib/utils";
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
  const config = BOX_CONFIGS[boxSize];
  const isComplete = selectedProducts.length === config.slots;
  const remainingSlots = config.slots - selectedProducts.length;

  // Calculate totals
  const itemsTotal = selectedProducts.reduce((sum, p) => sum + p.price, 0);
  const boxPrice = config.price;
  const savings = itemsTotal > boxPrice ? itemsTotal - boxPrice : 0;

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm sticky top-24">
      <h3 className="font-semibold text-lg mb-4">Order Summary</h3>

      {/* Box Type */}
      <div className="flex items-center justify-between py-3 border-b">
        <span className="text-gray-600 capitalize">{boxSize} Box</span>
        <span className="font-medium">{config.slots} items</span>
      </div>

      {/* Items Value */}
      {selectedProducts.length > 0 && (
        <div className="flex items-center justify-between py-3 border-b">
          <span className="text-gray-600">Items Value</span>
          <span className="font-medium">{formatCurrency(itemsTotal)}</span>
        </div>
      )}

      {/* Box Subscription Price */}
      <div className="flex items-center justify-between py-3 border-b">
        <span className="text-gray-600">Subscription Price</span>
        <span className="font-semibold text-aura-primary">
          {formatCurrency(boxPrice)}
        </span>
      </div>

      {/* Savings */}
      {savings > 0 && (
        <div className="flex items-center justify-between py-3 border-b text-green-600">
          <span>You Save</span>
          <span className="font-medium">{formatCurrency(savings)}</span>
        </div>
      )}

      {/* Shipping */}
      <div className="flex items-center justify-between py-3 border-b">
        <span className="text-gray-600">Shipping</span>
        <span className="font-medium text-green-600">FREE</span>
      </div>

      {/* Total */}
      <div className="flex items-center justify-between py-4">
        <span className="font-semibold text-lg">Monthly Total</span>
        <span className="font-bold text-xl text-aura-primary">
          {formatCurrency(boxPrice)}
        </span>
      </div>

      {/* Status Message */}
      {!isComplete && (
        <div className="mb-4 p-3 bg-amber-50 rounded-lg flex items-start gap-2">
          <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-amber-700">
            Add {remainingSlots} more {remainingSlots === 1 ? "item" : "items"}{" "}
            to complete your box
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
          Let Aura Fill My Box
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
        {isComplete ? "Continue to Checkout" : "Complete Your Box First"}
      </Button>

      <p className="text-xs text-gray-400 text-center mt-4">
        Cancel or modify anytime. Free shipping on all boxes.
      </p>
    </div>
  );
}
