"use client";

import { cn } from "@/lib/utils";
import {
  Utensils,
  Salad,
  Fish,
  Soup,
  Beef,
  Flame,
  Leaf,
  Wheat,
  Coffee,
  IceCream,
  Wine,
  type LucideIcon,
} from "lucide-react";

interface Category {
  id: string;
  name: string;
  icon?: LucideIcon;
}

// Default food category icons mapping
const categoryIconMap: Record<string, LucideIcon> = {
  pasta: Utensils,
  salad: Salad,
  seafood: Fish,
  soups: Soup,
  "roasted meats": Beef,
  meats: Beef,
  "oven-baked": Flame,
  "plant-based": Leaf,
  vegan: Leaf,
  vegetarian: Leaf,
  rice: Wheat,
  grains: Wheat,
  breakfast: Coffee,
  desserts: IceCream,
  drinks: Wine,
  beverages: Wine,
  entrees: Utensils,
  sides: Salad,
  snacks: Coffee,
};

interface CategoryTabsProps {
  categories: string[];
  selectedCategory: string | null;
  onSelectCategory: (category: string | null) => void;
  showAll?: boolean;
  allLabel?: string;
  className?: string;
}

export function CategoryTabs({
  categories,
  selectedCategory,
  onSelectCategory,
  showAll = true,
  allLabel = "All",
  className,
}: CategoryTabsProps) {
  const getIcon = (category: string): LucideIcon => {
    const normalized = category.toLowerCase();
    return categoryIconMap[normalized] || Utensils;
  };

  return (
    <div
      className={cn(
        "flex gap-2 overflow-x-auto pb-2 scrollbar-hide",
        className
      )}
    >
      {showAll && (
        <button
          onClick={() => onSelectCategory(null)}
          className={cn(
            "category-pill flex items-center gap-2",
            !selectedCategory
              ? "category-pill-active"
              : "category-pill-inactive"
          )}
        >
          <Utensils className="w-4 h-4" />
          {allLabel}
        </button>
      )}
      {categories.map((category) => {
        const Icon = getIcon(category);
        const isActive = selectedCategory === category;

        return (
          <button
            key={category}
            onClick={() => onSelectCategory(category)}
            className={cn(
              "category-pill flex items-center gap-2 capitalize",
              isActive ? "category-pill-active" : "category-pill-inactive"
            )}
          >
            <Icon className="w-4 h-4" />
            {category}
          </button>
        );
      })}
    </div>
  );
}

// Horizontal scrolling navigation variant (like in the inspiration image)
interface NavTabsProps {
  items: Array<{
    id: string;
    label: string;
    icon?: LucideIcon;
  }>;
  activeId: string | null;
  onSelect: (id: string) => void;
  className?: string;
}

export function NavTabs({ items, activeId, onSelect, className }: NavTabsProps) {
  return (
    <nav
      className={cn(
        "flex items-center gap-1 overflow-x-auto scrollbar-hide",
        className
      )}
    >
      {items.map((item) => {
        const isActive = activeId === item.id;
        const Icon = item.icon;

        return (
          <button
            key={item.id}
            onClick={() => onSelect(item.id)}
            className={cn("nav-tab", isActive ? "nav-tab-active" : "nav-tab-inactive")}
          >
            {Icon && <Icon className="w-4 h-4" />}
            {item.label}
          </button>
        );
      })}
    </nav>
  );
}
