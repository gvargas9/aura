"use client";

import Image from "next/image";
import Link from "next/link";
import { Plus, Check, Shield, Clock, Package } from "lucide-react";
import { cn, formatCurrency, calculateDiscount } from "@/lib/utils";
import type { Product } from "@/types";

interface ProductCardProps {
  product: Product;
  onAddToBox?: (product: Product) => void;
  isInBox?: boolean;
  showAddButton?: boolean;
  variant?: "default" | "compact" | "minimal";
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

  // Minimal variant - like in the inspiration's recommended pairings
  if (variant === "minimal") {
    return (
      <div className="group relative bg-white rounded-2xl p-3 border border-gray-100 hover:border-aura-primary/30 hover:shadow-lg transition-all">
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
        <h4 className="font-medium text-gray-900 text-sm truncate">
          {product.name}
        </h4>
        <p className="text-xs text-gray-500 mb-2">{product.short_description || "380g"}</p>
        <div className="flex items-center justify-between">
          <span className="text-aura-accent font-semibold">
            {formatCurrency(product.price)}
          </span>
          {showAddButton && onAddToBox && (
            <button
              onClick={() => onAddToBox(product)}
              disabled={isInBox}
              className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center transition-all",
                isInBox
                  ? "bg-aura-primary text-white"
                  : "bg-aura-dark text-white hover:scale-110"
              )}
            >
              {isInBox ? <Check className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            </button>
          )}
        </div>
      </div>
    );
  }

  // Compact variant - for sidebar lists
  if (variant === "compact") {
    return (
      <div
        className={cn(
          "flex items-center gap-4 p-4 rounded-2xl border transition-all animate-scale",
          isInBox
            ? "border-aura-primary bg-aura-light/50"
            : "border-gray-100 hover:border-aura-primary/30 hover:shadow-md bg-white"
        )}
      >
        <div className="relative w-16 h-16 rounded-xl overflow-hidden bg-gray-50 flex-shrink-0">
          {product.image_url ? (
            <Image
              src={product.image_url}
              alt={product.name}
              fill
              className="object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-300">
              <Package className="w-6 h-6" />
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-gray-900 truncate">{product.name}</h4>
          <p className="text-sm text-gray-500 truncate">
            {product.short_description || "380g"}
          </p>
        </div>
        <div className="text-right flex flex-col items-end gap-2">
          <p className="font-semibold text-aura-accent">
            {formatCurrency(product.price)}
          </p>
          {showAddButton && onAddToBox && (
            <button
              onClick={() => onAddToBox(product)}
              disabled={isInBox}
              className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center transition-all",
                isInBox
                  ? "bg-aura-primary text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-aura-dark hover:text-white"
              )}
            >
              {isInBox ? <Check className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            </button>
          )}
        </div>
      </div>
    );
  }

  // Default variant - main product cards
  return (
    <div className="card-interactive group">
      {/* Image */}
      <Link href={`/products/${product.id}`}>
        <div className="relative aspect-square bg-gradient-to-br from-gray-50 to-gray-100 overflow-hidden">
          {product.image_url ? (
            <Image
              src={product.image_url}
              alt={product.name}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-500"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-300">
              <Package className="w-16 h-16" />
            </div>
          )}

          {/* Badges */}
          <div className="absolute top-3 left-3 flex flex-col gap-2">
            {discount > 0 && (
              <span className="badge badge-accent">
                {discount}% OFF
              </span>
            )}
            {product.is_bunker_safe && (
              <span className="badge badge-dark">
                <Shield className="w-3 h-3 mr-1" />
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
              disabled={isInBox}
              className={cn(
                "absolute bottom-3 right-3 w-11 h-11 rounded-full shadow-lg transition-all flex items-center justify-center",
                isInBox
                  ? "bg-aura-primary text-white"
                  : "bg-aura-dark text-white hover:scale-110 hover:shadow-xl"
              )}
            >
              {isInBox ? <Check className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
            </button>
          )}
        </div>
      </Link>

      {/* Content */}
      <div className="p-4">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-xs text-gray-500 uppercase tracking-wide font-medium">
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
          <h3 className="font-semibold text-gray-900 group-hover:text-aura-primary transition-colors mb-1 line-clamp-1">
            {product.name}
          </h3>
        </Link>

        <p className="text-sm text-gray-500 line-clamp-2 mb-3 min-h-[2.5rem]">
          {product.short_description}
        </p>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-lg font-bold text-aura-accent">
              {formatCurrency(product.price)}
            </span>
            {product.compare_at_price && (
              <span className="text-sm text-gray-400 line-through">
                {formatCurrency(product.compare_at_price)}
              </span>
            )}
          </div>
          {product.stock_level < 50 && product.stock_level > 0 && (
            <span className="text-xs text-amber-600 font-medium bg-amber-50 px-2 py-1 rounded-full">
              Low Stock
            </span>
          )}
          {product.stock_level === 0 && (
            <span className="text-xs text-red-600 font-medium bg-red-50 px-2 py-1 rounded-full">
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
                className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full"
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
