"use client";

import { useState } from "react";
import { Search, SlidersHorizontal, X, ChevronDown } from "lucide-react";
import { Input, Button } from "@/components/ui";
import { cn } from "@/lib/utils";
import type { ProductFilters as FilterType } from "@/types";

interface ProductFiltersProps {
  filters: FilterType;
  onFiltersChange: (filters: FilterType) => void;
  categories: string[];
  showMobileFilters?: boolean;
  onToggleMobileFilters?: () => void;
}

const sortOptions = [
  { value: "newest", label: "Newest" },
  { value: "price_asc", label: "Price: Low to High" },
  { value: "price_desc", label: "Price: High to Low" },
  { value: "name", label: "Name A-Z" },
];

export function ProductFilters({
  filters,
  onFiltersChange,
  categories,
  showMobileFilters = false,
  onToggleMobileFilters,
}: ProductFiltersProps) {
  const [isOpen, setIsOpen] = useState(false);

  const updateFilter = (key: keyof FilterType, value: unknown) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  const clearFilters = () => {
    onFiltersChange({});
  };

  const activeFiltersCount = Object.values(filters).filter(
    (v) => v !== undefined && v !== ""
  ).length;

  const FilterContent = () => (
    <div className="space-y-6">
      {/* Categories */}
      <div>
        <h4 className="font-medium text-gray-900 mb-3">Category</h4>
        <div className="space-y-2">
          <button
            onClick={() => updateFilter("category", undefined)}
            className={cn(
              "w-full text-left px-3 py-2 rounded-lg transition-colors",
              !filters.category
                ? "bg-aura-primary text-white"
                : "text-gray-600 hover:bg-gray-100"
            )}
          >
            All Products
          </button>
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => updateFilter("category", category)}
              className={cn(
                "w-full text-left px-3 py-2 rounded-lg transition-colors capitalize",
                filters.category === category
                  ? "bg-aura-primary text-white"
                  : "text-gray-600 hover:bg-gray-100"
              )}
            >
              {category}
            </button>
          ))}
        </div>
      </div>

      {/* Price Range */}
      <div>
        <h4 className="font-medium text-gray-900 mb-3">Price Range</h4>
        <div className="flex gap-2">
          <Input
            type="number"
            placeholder="Min"
            value={filters.minPrice || ""}
            onChange={(e) =>
              updateFilter(
                "minPrice",
                e.target.value ? Number(e.target.value) : undefined
              )
            }
            className="text-sm"
          />
          <Input
            type="number"
            placeholder="Max"
            value={filters.maxPrice || ""}
            onChange={(e) =>
              updateFilter(
                "maxPrice",
                e.target.value ? Number(e.target.value) : undefined
              )
            }
            className="text-sm"
          />
        </div>
      </div>

      {/* Bunker Safe */}
      <div>
        <h4 className="font-medium text-gray-900 mb-3">Features</h4>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={filters.isBunkerSafe || false}
            onChange={(e) => updateFilter("isBunkerSafe", e.target.checked || undefined)}
            className="rounded border-gray-300 text-aura-primary focus:ring-aura-primary"
          />
          <span className="text-gray-600">Bunker Safe (24+ months)</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer mt-2">
          <input
            type="checkbox"
            checked={filters.inStock || false}
            onChange={(e) => updateFilter("inStock", e.target.checked || undefined)}
            className="rounded border-gray-300 text-aura-primary focus:ring-aura-primary"
          />
          <span className="text-gray-600">In Stock Only</span>
        </label>
      </div>

      {/* Clear Filters */}
      {activeFiltersCount > 0 && (
        <Button variant="outline" onClick={clearFilters} className="w-full">
          Clear All Filters
        </Button>
      )}
    </div>
  );

  return (
    <>
      {/* Desktop Filters */}
      <div className="hidden lg:block">
        <FilterContent />
      </div>

      {/* Mobile Filter Toggle */}
      <div className="lg:hidden flex items-center gap-4 mb-4">
        <div className="flex-1">
          <Input
            placeholder="Search products..."
            value={filters.search || ""}
            onChange={(e) => updateFilter("search", e.target.value || undefined)}
            leftIcon={<Search className="w-5 h-5" />}
          />
        </div>
        <Button
          variant="outline"
          onClick={onToggleMobileFilters}
          className="relative"
        >
          <SlidersHorizontal className="w-5 h-5" />
          {activeFiltersCount > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-aura-primary text-white text-xs rounded-full flex items-center justify-center">
              {activeFiltersCount}
            </span>
          )}
        </Button>
      </div>

      {/* Mobile Filter Panel */}
      {showMobileFilters && (
        <div className="lg:hidden fixed inset-0 z-50 bg-black/50">
          <div className="absolute right-0 top-0 bottom-0 w-80 bg-white overflow-y-auto">
            <div className="p-4 border-b flex items-center justify-between">
              <h3 className="font-semibold">Filters</h3>
              <button onClick={onToggleMobileFilters}>
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4">
              <FilterContent />
            </div>
          </div>
        </div>
      )}

      {/* Sort Dropdown */}
      <div className="hidden lg:flex items-center gap-4 mb-6">
        <div className="flex-1">
          <Input
            placeholder="Search products..."
            value={filters.search || ""}
            onChange={(e) => updateFilter("search", e.target.value || undefined)}
            leftIcon={<Search className="w-5 h-5" />}
          />
        </div>
        <div className="relative">
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:border-aura-primary transition-colors"
          >
            <span className="text-gray-600">
              Sort:{" "}
              {sortOptions.find((o) => o.value === filters.sortBy)?.label ||
                "Newest"}
            </span>
            <ChevronDown className="w-4 h-4" />
          </button>
          {isOpen && (
            <div className="absolute right-0 top-full mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
              {sortOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => {
                    updateFilter("sortBy", option.value as FilterType["sortBy"]);
                    setIsOpen(false);
                  }}
                  className={cn(
                    "w-full text-left px-4 py-2 hover:bg-gray-50 transition-colors",
                    filters.sortBy === option.value
                      ? "text-aura-primary font-medium"
                      : "text-gray-600"
                  )}
                >
                  {option.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
