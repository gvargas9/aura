"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  Search,
  X,
  ArrowRight,
  Clock,
  TrendingUp,
  Package,
  ChefHat,
  Tag,
  Loader2,
} from "lucide-react";
import { cn, formatCurrency } from "@/lib/utils";

interface ProductResult {
  id: string;
  name: string;
  price: number;
  compare_at_price: number | null;
  image_url: string | null;
  category: string;
  is_bunker_safe: boolean;
  short_description: string | null;
  dietary_labels: string[];
}

interface RecipeResult {
  id: string;
  product_id: string;
  title: string;
  description: string | null;
  chef_name: string;
  image_url: string | null;
  difficulty: string;
  prep_time_minutes: number | null;
  cook_time_minutes: number | null;
}

interface SearchResults {
  products: ProductResult[];
  recipes: RecipeResult[];
  categories: string[];
}

const POPULAR_SEARCHES = [
  "vegan meals",
  "high protein",
  "camping food",
  "bunker box",
];

const RECENT_SEARCHES_KEY = "aura-recent-searches";
const MAX_RECENT = 5;

function getRecentSearches(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const stored = localStorage.getItem(RECENT_SEARCHES_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function saveRecentSearch(query: string) {
  try {
    const recent = getRecentSearches();
    const updated = [query, ...recent.filter((s) => s !== query)].slice(
      0,
      MAX_RECENT
    );
    localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
  } catch {
    // localStorage not available
  }
}

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SearchModal({ isOpen, onClose }: SearchModalProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResults | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const backdropRef = useRef<HTMLDivElement>(null);

  // Total results count for keyboard nav
  const totalResults =
    (results?.products?.length || 0) +
    (results?.recipes?.length || 0) +
    (results?.categories?.length || 0);

  // Load recent searches on mount
  useEffect(() => {
    if (isOpen) {
      setRecentSearches(getRecentSearches());
      setQuery("");
      setResults(null);
      setSelectedIndex(-1);
      // Focus input on next frame
      requestAnimationFrame(() => {
        inputRef.current?.focus();
      });
    }
  }, [isOpen]);

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [isOpen, onClose]);

  // Debounced search
  const performSearch = useCallback(async (searchQuery: string) => {
    if (searchQuery.length < 2) {
      setResults(null);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    try {
      const res = await fetch(
        `/api/search?q=${encodeURIComponent(searchQuery)}`
      );
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setResults(data.data);
          setSelectedIndex(-1);
        }
      }
    } catch {
      // silently fail
    } finally {
      setIsSearching(false);
    }
  }, []);

  const handleInputChange = (value: string) => {
    setQuery(value);

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      performSearch(value);
    }, 300);
  };

  const navigateTo = (path: string, searchTerm?: string) => {
    if (searchTerm) {
      saveRecentSearch(searchTerm);
    }
    onClose();
    router.push(path);
  };

  // Build flat list of navigable results for keyboard
  const getNavigableItems = (): Array<{
    type: string;
    path: string;
    label: string;
  }> => {
    if (!results) return [];
    const items: Array<{ type: string; path: string; label: string }> = [];
    results.products.forEach((p) =>
      items.push({ type: "product", path: `/products/${p.id}`, label: p.name })
    );
    results.recipes.forEach((r) =>
      items.push({
        type: "recipe",
        path: `/products/${r.product_id}`,
        label: r.title,
      })
    );
    results.categories.forEach((c) =>
      items.push({
        type: "category",
        path: `/products?category=${encodeURIComponent(c)}`,
        label: c,
      })
    );
    return items;
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    const items = getNavigableItems();
    if (items.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < items.length - 1 ? prev + 1 : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : items.length - 1));
    } else if (e.key === "Enter" && selectedIndex >= 0) {
      e.preventDefault();
      const item = items[selectedIndex];
      navigateTo(item.path, query);
    }
  };

  if (!isOpen) return null;

  const navigableItems = getNavigableItems();
  let flatIndex = -1;

  return (
    <div className="fixed inset-0 z-[100]" role="dialog" aria-modal="true" aria-label="Search">
      {/* Backdrop */}
      <div
        ref={backdropRef}
        className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative flex flex-col items-center pt-[10vh] sm:pt-[15vh] px-4 pointer-events-none">
        <div
          className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden pointer-events-auto animate-in slide-in-from-top-4 fade-in duration-200"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Search Input */}
          <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100">
            <Search className="w-5 h-5 text-gray-400 shrink-0" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => handleInputChange(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Search products, recipes, categories..."
              className="flex-1 text-base sm:text-lg text-gray-900 placeholder:text-gray-400 outline-none bg-transparent"
              aria-label="Search"
              autoComplete="off"
            />
            {isSearching && (
              <Loader2 className="w-5 h-5 text-gray-400 animate-spin shrink-0" />
            )}
            {query && !isSearching && (
              <button
                onClick={() => {
                  setQuery("");
                  setResults(null);
                  inputRef.current?.focus();
                }}
                className="p-1 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors"
                aria-label="Clear search"
              >
                <X className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={onClose}
              className="hidden sm:flex text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded-md font-mono"
            >
              ESC
            </button>
          </div>

          {/* Content */}
          <div className="max-h-[60vh] overflow-y-auto">
            {/* No query — show recent and popular */}
            {!query && (
              <div className="p-5 space-y-6">
                {/* Recent Searches */}
                {recentSearches.length > 0 && (
                  <div>
                    <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                      Recent Searches
                    </h3>
                    <div className="space-y-1">
                      {recentSearches.map((term) => (
                        <button
                          key={term}
                          onClick={() => {
                            setQuery(term);
                            performSearch(term);
                          }}
                          className="flex items-center gap-3 w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors text-left"
                        >
                          <Clock className="w-4 h-4 text-gray-300 shrink-0" />
                          {term}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Popular Searches */}
                <div>
                  <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                    Popular Searches
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {POPULAR_SEARCHES.map((term) => (
                      <button
                        key={term}
                        onClick={() => {
                          setQuery(term);
                          performSearch(term);
                        }}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-600 bg-gray-50 hover:bg-gray-100 rounded-full transition-colors"
                      >
                        <TrendingUp className="w-3 h-3 text-gray-400" />
                        {term}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Search Results */}
            {query && results && (
              <div>
                {totalResults === 0 && !isSearching && (
                  <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                    <Search className="w-10 h-10 mb-3 text-gray-200" />
                    <p className="text-sm font-medium text-gray-500">
                      No results for &quot;{query}&quot;
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      Try a different search term
                    </p>
                  </div>
                )}

                {/* Products */}
                {results.products.length > 0 && (
                  <div className="p-3">
                    <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-2 mb-2 flex items-center gap-1.5">
                      <Package className="w-3.5 h-3.5" />
                      Products
                    </h3>
                    <div className="space-y-0.5">
                      {results.products.map((product) => {
                        flatIndex++;
                        const idx = flatIndex;
                        return (
                          <button
                            key={product.id}
                            onClick={() =>
                              navigateTo(`/products/${product.id}`, query)
                            }
                            className={cn(
                              "flex items-center gap-3 w-full px-3 py-2.5 rounded-xl transition-colors text-left",
                              selectedIndex === idx
                                ? "bg-aura-light"
                                : "hover:bg-gray-50"
                            )}
                          >
                            <div className="w-12 h-12 bg-gray-100 rounded-lg overflow-hidden shrink-0 relative">
                              {product.image_url ? (
                                <Image
                                  src={product.image_url}
                                  alt={product.name}
                                  fill
                                  className="object-cover"
                                  sizes="48px"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                  <Package className="w-5 h-5 text-gray-300" />
                                </div>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900 truncate">
                                {product.name}
                              </p>
                              <p className="text-xs text-gray-500 capitalize">
                                {product.category}
                              </p>
                            </div>
                            <span className="text-sm font-semibold text-gray-900 shrink-0">
                              {formatCurrency(product.price)}
                            </span>
                            <ArrowRight className="w-4 h-4 text-gray-300 shrink-0" />
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Recipes */}
                {results.recipes.length > 0 && (
                  <div className="p-3 border-t border-gray-50">
                    <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-2 mb-2 flex items-center gap-1.5">
                      <ChefHat className="w-3.5 h-3.5" />
                      Recipes
                    </h3>
                    <div className="space-y-0.5">
                      {results.recipes.map((recipe) => {
                        flatIndex++;
                        const idx = flatIndex;
                        return (
                          <button
                            key={recipe.id}
                            onClick={() =>
                              navigateTo(
                                `/products/${recipe.product_id}`,
                                query
                              )
                            }
                            className={cn(
                              "flex items-center gap-3 w-full px-3 py-2.5 rounded-xl transition-colors text-left",
                              selectedIndex === idx
                                ? "bg-aura-light"
                                : "hover:bg-gray-50"
                            )}
                          >
                            <div className="w-12 h-12 bg-amber-50 rounded-lg overflow-hidden shrink-0 flex items-center justify-center relative">
                              {recipe.image_url ? (
                                <Image
                                  src={recipe.image_url}
                                  alt={recipe.title}
                                  fill
                                  className="object-cover"
                                  sizes="48px"
                                />
                              ) : (
                                <ChefHat className="w-5 h-5 text-amber-400" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900 truncate">
                                {recipe.title}
                              </p>
                              <p className="text-xs text-gray-500">
                                by {recipe.chef_name}
                                {recipe.prep_time_minutes &&
                                  ` - ${recipe.prep_time_minutes}min`}
                              </p>
                            </div>
                            <span
                              className={cn(
                                "text-[10px] font-medium px-2 py-0.5 rounded-full capitalize",
                                recipe.difficulty === "easy"
                                  ? "bg-green-100 text-green-700"
                                  : recipe.difficulty === "medium"
                                    ? "bg-amber-100 text-amber-700"
                                    : "bg-red-100 text-red-700"
                              )}
                            >
                              {recipe.difficulty}
                            </span>
                            <ArrowRight className="w-4 h-4 text-gray-300 shrink-0" />
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Categories */}
                {results.categories.length > 0 && (
                  <div className="p-3 border-t border-gray-50">
                    <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-2 mb-2 flex items-center gap-1.5">
                      <Tag className="w-3.5 h-3.5" />
                      Categories
                    </h3>
                    <div className="flex flex-wrap gap-2 px-2">
                      {results.categories.map((category) => {
                        flatIndex++;
                        const idx = flatIndex;
                        return (
                          <button
                            key={category}
                            onClick={() =>
                              navigateTo(
                                `/products?category=${encodeURIComponent(category)}`,
                                query
                              )
                            }
                            className={cn(
                              "px-3 py-1.5 text-sm font-medium rounded-full transition-colors capitalize",
                              selectedIndex === idx
                                ? "bg-aura-dark text-white"
                                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                            )}
                          >
                            {category}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer hint */}
          <div className="px-5 py-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-400">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 bg-gray-100 rounded text-[10px] font-mono">
                  ↑↓
                </kbd>
                Navigate
              </span>
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 bg-gray-100 rounded text-[10px] font-mono">
                  ↵
                </kbd>
                Select
              </span>
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 bg-gray-100 rounded text-[10px] font-mono">
                  esc
                </kbd>
                Close
              </span>
            </div>
            {results && totalResults > 0 && (
              <span>
                {totalResults} result{totalResults !== 1 ? "s" : ""}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
