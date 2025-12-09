"use client";

import Image from "next/image";
import Link from "next/link";
import { Plus, Star, Shield, Clock } from "lucide-react";
import { cn, formatCurrency, calculateDiscount } from "@/lib/utils";
import type { Product } from "@/types";

interface ProductCardProps {
  product: Product;
  onAddToBox?: (product: Product) => void;
  isInBox?: boolean;
  showAddButton?: boolean;
  variant?: "default" | "compact";
}

export function ProductCard({
  product,
  onAddToBox,
  isInBox = false,
  showAddButton = true,
  variant = "default",
}: ProductCardProps) {
  const discount = product.compare_at_price
    ? calculateDiscount(product.compare_at_price, product.price)
    : 0;

  if (variant === "compact") {
    return (
      <div
        className={cn(
          "flex items-center gap-4 p-4 rounded-xl border transition-all",
          isInBox
            ? "border-aura-primary bg-aura-light"
            : "border-gray-200 hover:border-aura-primary bg-white"
        )}
      >
        <div className="relative w-16 h-16 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
          {product.image_url ? (
            <Image
              src={product.image_url}
              alt={product.name}
              fill
              className="object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400">
              <Shield className="w-8 h-8" />
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-gray-900 truncate">{product.name}</h4>
          <p className="text-sm text-gray-500 truncate">
            {product.short_description}
          </p>
        </div>
        <div className="text-right">
          <p className="font-semibold text-aura-primary">
            {formatCurrency(product.price)}
          </p>
          {showAddButton && onAddToBox && (
            <button
              onClick={() => onAddToBox(product)}
              className={cn(
                "mt-1 p-1.5 rounded-full transition-colors",
                isInBox
                  ? "bg-aura-primary text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-aura-primary hover:text-white"
              )}
            >
              <Plus className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="card group">
      {/* Image */}
      <Link href={`/products/${product.id}`}>
        <div className="relative aspect-square bg-gray-100 overflow-hidden">
          {product.image_url ? (
            <Image
              src={product.image_url}
              alt={product.name}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-300">
              <Shield className="w-16 h-16" />
            </div>
          )}

          {/* Badges */}
          <div className="absolute top-3 left-3 flex flex-col gap-2">
            {discount > 0 && (
              <span className="bg-aura-accent text-white text-xs font-bold px-2 py-1 rounded">
                {discount}% OFF
              </span>
            )}
            {product.is_bunker_safe && (
              <span className="bg-aura-dark text-white text-xs font-medium px-2 py-1 rounded flex items-center gap-1">
                <Shield className="w-3 h-3" />
                Bunker Safe
              </span>
            )}
          </div>

          {/* Quick Add Button */}
          {showAddButton && onAddToBox && (
            <button
              onClick={(e) => {
                e.preventDefault();
                onAddToBox(product);
              }}
              className={cn(
                "absolute bottom-3 right-3 p-3 rounded-full shadow-lg transition-all",
                isInBox
                  ? "bg-aura-primary text-white"
                  : "bg-white text-aura-primary hover:bg-aura-primary hover:text-white"
              )}
            >
              <Plus className="w-5 h-5" />
            </button>
          )}
        </div>
      </Link>

      {/* Content */}
      <div className="p-4">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-xs text-gray-500 uppercase tracking-wide">
            {product.category}
          </span>
          {product.shelf_life_months && (
            <span className="text-xs text-gray-400 flex items-center">
              <Clock className="w-3 h-3 mr-1" />
              {product.shelf_life_months}mo
            </span>
          )}
        </div>

        <Link href={`/products/${product.id}`}>
          <h3 className="font-semibold text-gray-900 group-hover:text-aura-primary transition-colors mb-1">
            {product.name}
          </h3>
        </Link>

        <p className="text-sm text-gray-500 line-clamp-2 mb-3">
          {product.short_description}
        </p>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-lg font-bold text-aura-primary">
              {formatCurrency(product.price)}
            </span>
            {product.compare_at_price && (
              <span className="text-sm text-gray-400 line-through">
                {formatCurrency(product.compare_at_price)}
              </span>
            )}
          </div>
          {product.stock_level < 50 && product.stock_level > 0 && (
            <span className="text-xs text-amber-600 font-medium">
              Low Stock
            </span>
          )}
          {product.stock_level === 0 && (
            <span className="text-xs text-red-600 font-medium">
              Out of Stock
            </span>
          )}
        </div>

        {/* Tags */}
        {product.tags && product.tags.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1">
            {product.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
