"use client";

import Image from "next/image";
import { X, Package } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Product } from "@/types";

interface BoxSlotsProps {
  totalSlots: number;
  selectedProducts: Product[];
  onRemoveProduct: (index: number) => void;
  className?: string;
}

export function BoxSlots({
  totalSlots,
  selectedProducts,
  onRemoveProduct,
  className,
}: BoxSlotsProps) {
  const slots = Array.from({ length: totalSlots }, (_, i) => ({
    index: i,
    product: selectedProducts[i] || null,
  }));

  const filledCount = selectedProducts.length;
  const percentage = Math.round((filledCount / totalSlots) * 100);

  return (
    <div className={cn("bg-white rounded-xl p-6 shadow-sm", className)}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-lg">Your Box</h3>
        <span
          className={cn(
            "text-sm font-medium px-3 py-1 rounded-full",
            filledCount === totalSlots
              ? "bg-aura-primary text-white"
              : "bg-gray-100 text-gray-600"
          )}
        >
          {filledCount}/{totalSlots} Items
        </span>
      </div>

      {/* Progress Bar */}
      <div className="mb-6">
        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
          <div
            className={cn(
              "h-full transition-all duration-300 rounded-full",
              filledCount === totalSlots
                ? "bg-aura-primary"
                : "bg-aura-accent"
            )}
            style={{ width: `${percentage}%` }}
          />
        </div>
        <p className="text-sm text-gray-500 mt-2">
          {filledCount === totalSlots
            ? "Your box is complete! Ready to checkout."
            : `Add ${totalSlots - filledCount} more items to complete your box`}
        </p>
      </div>

      {/* Slots Grid */}
      <div className="grid grid-cols-4 gap-3">
        {slots.map((slot) => (
          <div
            key={slot.index}
            className={cn(
              "relative aspect-square rounded-xl transition-all",
              slot.product
                ? "bg-aura-light border-2 border-aura-primary"
                : "bg-gray-50 border-2 border-dashed border-gray-200"
            )}
          >
            {slot.product ? (
              <>
                {slot.product.image_url ? (
                  <Image
                    src={slot.product.image_url}
                    alt={slot.product.name}
                    fill
                    className="object-cover rounded-lg p-1"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Package className="w-8 h-8 text-aura-primary" />
                  </div>
                )}
                <button
                  onClick={() => onRemoveProduct(slot.index)}
                  className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors shadow-sm"
                >
                  <X className="w-4 h-4" />
                </button>
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-1 rounded-b-lg">
                  <p className="text-white text-xs truncate font-medium">
                    {slot.product.name}
                  </p>
                </div>
              </>
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <span className="text-gray-300 font-bold text-lg">
                  {slot.index + 1}
                </span>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
