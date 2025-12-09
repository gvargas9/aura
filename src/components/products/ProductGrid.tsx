"use client";

import { ProductCard } from "./ProductCard";
import type { Product } from "@/types";

interface ProductGridProps {
  products: Product[];
  onAddToBox?: (product: Product) => void;
  selectedProductIds?: string[];
  showAddButton?: boolean;
  columns?: 2 | 3 | 4;
  emptyMessage?: string;
}

export function ProductGrid({
  products,
  onAddToBox,
  selectedProductIds = [],
  showAddButton = true,
  columns = 4,
  emptyMessage = "No products found",
}: ProductGridProps) {
  if (products.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">{emptyMessage}</p>
      </div>
    );
  }

  const gridCols = {
    2: "grid-cols-1 sm:grid-cols-2",
    3: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
    4: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4",
  };

  return (
    <div className={`grid ${gridCols[columns]} gap-6`}>
      {products.map((product) => (
        <ProductCard
          key={product.id}
          product={product}
          onAddToBox={onAddToBox}
          isInBox={selectedProductIds.includes(product.id)}
          showAddButton={showAddButton}
        />
      ))}
    </div>
  );
}
