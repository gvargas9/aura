"use client";

import { Package, Check } from "lucide-react";
import { cn, formatCurrency } from "@/lib/utils";
import { BOX_CONFIGS, type BoxConfig } from "@/types";

interface BoxSizeSelectorProps {
  selectedSize: string;
  onSelectSize: (size: string) => void;
}

export function BoxSizeSelector({
  selectedSize,
  onSelectSize,
}: BoxSizeSelectorProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {Object.values(BOX_CONFIGS).map((config: BoxConfig) => {
        const isSelected = selectedSize === config.size;
        return (
          <button
            key={config.size}
            onClick={() => onSelectSize(config.size)}
            className={cn(
              "relative p-6 rounded-xl border-2 transition-all text-left",
              isSelected
                ? "border-aura-primary bg-aura-light"
                : "border-gray-200 bg-white hover:border-aura-primary/50"
            )}
          >
            {isSelected && (
              <div className="absolute top-3 right-3 w-6 h-6 bg-aura-primary rounded-full flex items-center justify-center">
                <Check className="w-4 h-4 text-white" />
              </div>
            )}

            <div className="flex items-center gap-3 mb-3">
              <div
                className={cn(
                  "w-12 h-12 rounded-lg flex items-center justify-center",
                  isSelected ? "bg-aura-primary" : "bg-gray-100"
                )}
              >
                <Package
                  className={cn(
                    "w-6 h-6",
                    isSelected ? "text-white" : "text-gray-500"
                  )}
                />
              </div>
              <div>
                <h4 className="font-semibold capitalize">{config.size}</h4>
                <p className="text-sm text-gray-500">{config.slots} meals</p>
              </div>
            </div>

            <p className="text-sm text-gray-600 mb-3">{config.description}</p>

            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-bold text-aura-primary">
                {formatCurrency(config.price)}
              </span>
              <span className="text-gray-500">/month</span>
            </div>

            <p className="text-xs text-gray-400 mt-1">
              {formatCurrency(config.price / config.slots)} per meal
            </p>
          </button>
        );
      })}
    </div>
  );
}
