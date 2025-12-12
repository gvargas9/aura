"use client";

import Image from "next/image";
import { useState } from "react";
import { Plus, Minus, Check, Shield, Clock, Leaf } from "lucide-react";
import { cn, formatCurrency } from "@/lib/utils";
import type { Product } from "@/types";

interface NutritionalInfo {
  calories?: number;
  protein?: number;
  carbs?: number;
  fat?: number;
}

interface ProductHeroProps {
  product: Product;
  onAddToBox?: (product: Product, quantity: number) => void;
  isInBox?: boolean;
  maxQuantity?: number;
  className?: string;
}

export function ProductHero({
  product,
  onAddToBox,
  isInBox = false,
  maxQuantity = 10,
  className,
}: ProductHeroProps) {
  const [quantity, setQuantity] = useState(1);
  const [selectedSize, setSelectedSize] = useState<string>("regular");

  // Parse nutritional info from JSON field
  const nutritionalInfo = product.nutritional_info as NutritionalInfo | null;

  const sizes = [
    { id: "small", label: "Small", weight: "280g" },
    { id: "regular", label: "Regular", weight: "380g" },
    { id: "large", label: "Large", weight: "480g" },
  ];

  const handleQuantityChange = (delta: number) => {
    setQuantity((prev) => Math.max(1, Math.min(maxQuantity, prev + delta)));
  };

  const handleAddToBox = () => {
    if (onAddToBox) {
      onAddToBox(product, quantity);
    }
  };

  return (
    <div className={cn("grid lg:grid-cols-2 gap-8 lg:gap-12", className)}>
      {/* Product Image */}
      <div className="relative">
        <div className="product-image-container aspect-square lg:aspect-[4/3]">
          {product.image_url ? (
            <Image
              src={product.image_url}
              alt={product.name}
              fill
              className="object-cover"
              priority
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-aura-light to-emerald-100">
              <Shield className="w-24 h-24 text-aura-primary/30" />
            </div>
          )}
        </div>

        {/* Floating badges */}
        <div className="absolute top-4 left-4 flex flex-col gap-2">
          {product.is_bunker_safe && (
            <span className="badge badge-dark">
              <Shield className="w-3 h-3 mr-1" />
              Bunker Safe
            </span>
          )}
          {product.shelf_life_months && (
            <span className="badge bg-white text-gray-700 shadow-sm">
              <Clock className="w-3 h-3 mr-1" />
              {product.shelf_life_months}mo shelf life
            </span>
          )}
        </div>
      </div>

      {/* Product Info */}
      <div className="flex flex-col">
        <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-3">
          {product.name}
        </h1>

        <p className="text-gray-600 text-lg mb-6 leading-relaxed">
          {product.description || product.short_description}
        </p>

        {/* Size Selection */}
        <div className="mb-6">
          <label className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-3 block">
            Size
          </label>
          <div className="flex gap-2">
            {sizes.map((size) => (
              <button
                key={size.id}
                onClick={() => setSelectedSize(size.id)}
                className={cn(
                  "px-4 py-2 rounded-full text-sm font-medium transition-all",
                  selectedSize === size.id
                    ? "bg-aura-dark text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                )}
              >
                {size.weight}
              </button>
            ))}
          </div>
        </div>

        {/* Build Your Meal Section */}
        {product.tags && product.tags.length > 0 && (
          <div className="mb-6">
            <label className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-3 block">
              Ingredients
            </label>
            <div className="flex flex-wrap gap-2">
              {product.tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 px-3 py-1.5 bg-aura-light text-aura-primary text-sm rounded-lg"
                >
                  <Leaf className="w-3 h-3" />
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Nutritional Info */}
        {nutritionalInfo?.calories && (
          <div className="mb-6 p-4 bg-gray-50 rounded-xl">
            <div className="grid grid-cols-4 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {nutritionalInfo.calories}
                </p>
                <p className="text-xs text-gray-500 uppercase">Calories</p>
              </div>
              {nutritionalInfo.protein && (
                <div>
                  <p className="text-2xl font-bold text-gray-900">
                    {nutritionalInfo.protein}g
                  </p>
                  <p className="text-xs text-gray-500 uppercase">Protein</p>
                </div>
              )}
              {nutritionalInfo.carbs && (
                <div>
                  <p className="text-2xl font-bold text-gray-900">
                    {nutritionalInfo.carbs}g
                  </p>
                  <p className="text-xs text-gray-500 uppercase">Carbs</p>
                </div>
              )}
              {nutritionalInfo.fat && (
                <div>
                  <p className="text-2xl font-bold text-gray-900">
                    {nutritionalInfo.fat}g
                  </p>
                  <p className="text-xs text-gray-500 uppercase">Fat</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Add to Box Section */}
        <div className="mt-auto pt-6 border-t border-gray-100">
          <div className="flex items-center gap-4">
            {/* Quantity Control */}
            <div className="flex items-center gap-3 bg-gray-100 rounded-full px-2 py-1">
              <button
                onClick={() => handleQuantityChange(-1)}
                className="quantity-btn"
                disabled={quantity <= 1}
              >
                <Minus className="w-4 h-4" />
              </button>
              <span className="w-8 text-center font-semibold">{quantity}</span>
              <button
                onClick={() => handleQuantityChange(1)}
                className="quantity-btn"
                disabled={quantity >= maxQuantity}
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            {/* Add to Order Button */}
            <button
              onClick={handleAddToBox}
              disabled={isInBox}
              className={cn(
                "flex-1 py-3.5 rounded-full font-semibold text-lg flex items-center justify-center gap-3 transition-all",
                isInBox
                  ? "bg-aura-primary text-white"
                  : "bg-aura-dark text-white hover:bg-gray-800"
              )}
            >
              <span className="px-4 py-1 bg-white/20 rounded-full text-sm">
                {formatCurrency(product.price * quantity)}
              </span>
              {isInBox ? (
                <>
                  <Check className="w-5 h-5" />
                  Added to Box
                </>
              ) : (
                "Add to order"
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
