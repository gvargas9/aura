"use client";

import { Plus, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

interface QuantityControlProps {
  quantity: number;
  onQuantityChange: (quantity: number) => void;
  min?: number;
  max?: number;
  size?: "sm" | "md" | "lg";
  variant?: "default" | "dark" | "outlined";
  className?: string;
}

export function QuantityControl({
  quantity,
  onQuantityChange,
  min = 1,
  max = 99,
  size = "md",
  variant = "default",
  className,
}: QuantityControlProps) {
  const handleDecrement = () => {
    if (quantity > min) {
      onQuantityChange(quantity - 1);
    }
  };

  const handleIncrement = () => {
    if (quantity < max) {
      onQuantityChange(quantity + 1);
    }
  };

  const sizes = {
    sm: {
      button: "w-6 h-6",
      icon: "w-3 h-3",
      text: "w-6 text-sm",
      container: "gap-1 px-1 py-0.5",
    },
    md: {
      button: "w-8 h-8",
      icon: "w-4 h-4",
      text: "w-8 text-base",
      container: "gap-2 px-2 py-1",
    },
    lg: {
      button: "w-10 h-10",
      icon: "w-5 h-5",
      text: "w-10 text-lg",
      container: "gap-3 px-3 py-1.5",
    },
  };

  const variants = {
    default: {
      container: "bg-gray-100 rounded-full",
      button: "text-gray-500 hover:text-gray-700 hover:bg-gray-200 rounded-full",
      text: "text-gray-900",
    },
    dark: {
      container: "bg-aura-dark rounded-lg",
      button: "text-white hover:bg-gray-700 rounded-lg",
      text: "text-white",
    },
    outlined: {
      container: "border border-gray-200 rounded-full bg-white",
      button: "text-gray-500 hover:text-gray-700 hover:bg-gray-50 rounded-full",
      text: "text-gray-900",
    },
  };

  const sizeConfig = sizes[size];
  const variantConfig = variants[variant];

  return (
    <div
      className={cn(
        "inline-flex items-center",
        variantConfig.container,
        sizeConfig.container,
        className
      )}
    >
      <button
        type="button"
        onClick={handleDecrement}
        disabled={quantity <= min}
        className={cn(
          "flex items-center justify-center transition-colors disabled:opacity-40 disabled:cursor-not-allowed",
          sizeConfig.button,
          variantConfig.button
        )}
        aria-label="Decrease quantity"
      >
        <Minus className={sizeConfig.icon} />
      </button>

      <span
        className={cn(
          "text-center font-semibold select-none",
          sizeConfig.text,
          variantConfig.text
        )}
      >
        {quantity}
      </span>

      <button
        type="button"
        onClick={handleIncrement}
        disabled={quantity >= max}
        className={cn(
          "flex items-center justify-center transition-colors disabled:opacity-40 disabled:cursor-not-allowed",
          sizeConfig.button,
          variantConfig.button
        )}
        aria-label="Increase quantity"
      >
        <Plus className={sizeConfig.icon} />
      </button>
    </div>
  );
}
