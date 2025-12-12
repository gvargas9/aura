"use client";

import Image from "next/image";
import { Plus, Package } from "lucide-react";
import { cn, formatCurrency } from "@/lib/utils";
import type { Product } from "@/types";

interface RecommendedPairingsProps {
  products: Product[];
  onAddToBox?: (product: Product) => void;
  isProductInBox?: (productId: string) => boolean;
  title?: string;
  className?: string;
}

export function RecommendedPairings({
  products,
  onAddToBox,
  isProductInBox,
  title = "RECOMMENDED PAIRINGS",
  className,
}: RecommendedPairingsProps) {
  if (products.length === 0) return null;

  return (
    <div className={cn("", className)}>
      <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-4">
        {title}
      </h3>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {products.map((product) => (
          <RecommendedCard
            key={product.id}
            product={product}
            onAdd={onAddToBox}
            isInBox={isProductInBox?.(product.id)}
          />
        ))}
      </div>
    </div>
  );
}

interface RecommendedCardProps {
  product: Product;
  onAdd?: (product: Product) => void;
  isInBox?: boolean;
}

function RecommendedCard({ product, onAdd, isInBox }: RecommendedCardProps) {
  return (
    <div className="group relative bg-white rounded-2xl p-3 border border-gray-100 hover:border-aura-primary/30 hover:shadow-md transition-all">
      {/* Product Image */}
      <div className="relative aspect-square rounded-xl overflow-hidden bg-gray-50 mb-3">
        {product.image_url ? (
          <Image
            src={product.image_url}
            alt={product.name}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Package className="w-8 h-8 text-gray-300" />
          </div>
        )}
      </div>

      {/* Product Info */}
      <h4 className="font-medium text-gray-900 text-sm truncate">
        {product.name}
      </h4>
      <p className="text-xs text-gray-500 mb-2">
        {product.short_description || "380g"}
      </p>

      {/* Price and Add Button */}
      <div className="flex items-center justify-between">
        <span className="text-aura-accent font-semibold">
          {formatCurrency(product.price)}
        </span>

        {onAdd && (
          <button
            onClick={() => onAdd(product)}
            disabled={isInBox}
            className={cn(
              "w-8 h-8 rounded-full flex items-center justify-center transition-all",
              isInBox
                ? "bg-aura-primary text-white"
                : "bg-aura-dark text-white hover:scale-110"
            )}
          >
            <Plus className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}

// Horizontal scrolling variant
interface HorizontalPairingsProps {
  products: Product[];
  onAddToBox?: (product: Product) => void;
  isProductInBox?: (productId: string) => boolean;
  title?: string;
  className?: string;
}

export function HorizontalPairings({
  products,
  onAddToBox,
  isProductInBox,
  title = "You might also like",
  className,
}: HorizontalPairingsProps) {
  if (products.length === 0) return null;

  return (
    <div className={cn("", className)}>
      <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>

      <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide -mx-4 px-4">
        {products.map((product) => (
          <div
            key={product.id}
            className="flex-shrink-0 w-40 group"
          >
            <div className="relative aspect-square rounded-2xl overflow-hidden bg-gray-50 mb-3 shadow-sm group-hover:shadow-md transition-shadow">
              {product.image_url ? (
                <Image
                  src={product.image_url}
                  alt={product.name}
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Package className="w-8 h-8 text-gray-300" />
                </div>
              )}

              {/* Quick Add Button */}
              {onAddToBox && (
                <button
                  onClick={() => onAddToBox(product)}
                  disabled={isProductInBox?.(product.id)}
                  className={cn(
                    "absolute bottom-2 right-2 w-8 h-8 rounded-full flex items-center justify-center shadow-lg transition-all",
                    isProductInBox?.(product.id)
                      ? "bg-aura-primary text-white"
                      : "bg-aura-dark text-white hover:scale-110"
                  )}
                >
                  <Plus className="w-4 h-4" />
                </button>
              )}
            </div>

            <h4 className="font-medium text-gray-900 text-sm truncate">
              {product.name}
            </h4>
            <div className="flex items-center justify-between mt-1">
              <span className="text-xs text-gray-500">
                {product.short_description || "380g"}
              </span>
              <span className="text-aura-accent font-semibold text-sm">
                {formatCurrency(product.price)}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
