"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Header, Footer, Button } from "@/components/ui";
import { Skeleton } from "@/components/ui/SkeletonLoader";
import Image from "next/image";
import Link from "next/link";
import {
  Star,
  Shield,
  Clock,
  Package,
  ChevronLeft,
  ChevronRight,
  Minus,
  Plus,
  Check,
  Heart,
  Share2,
  ThumbsUp,
  ChefHat,
  Users,
  Timer,
  Flame,
  AlertTriangle,
  Wheat,
  Milk,
  Egg,
  Fish,
  Shell,
  Nut,
  Leaf,
  Info,
  Printer,
  Globe,
  Thermometer,
  BookOpen,
} from "lucide-react";
import { cn, formatCurrency, formatDate } from "@/lib/utils";
import type {
  Product,
  ProductVariant,
  ProductReview,
  ProductNutrition,
  ProductRelationship,
  ProductRecipe,
  Profile,
  Json,
} from "@/types/database";

/* ================================================================
   CONSTANTS
   ================================================================ */

const DIETARY_COLORS: Record<string, string> = {
  vegan: "bg-green-100 text-green-700 border-green-200",
  vegetarian: "bg-emerald-100 text-emerald-700 border-emerald-200",
  keto: "bg-purple-100 text-purple-700 border-purple-200",
  paleo: "bg-amber-100 text-amber-700 border-amber-200",
  "gluten-free": "bg-blue-100 text-blue-700 border-blue-200",
  "high-protein": "bg-rose-100 text-rose-700 border-rose-200",
  "low-carb": "bg-orange-100 text-orange-700 border-orange-200",
  organic: "bg-lime-100 text-lime-700 border-lime-200",
  "dairy-free": "bg-sky-100 text-sky-700 border-sky-200",
};

const ALLERGEN_ICONS: Record<string, React.ReactNode> = {
  wheat: <Wheat className="w-4 h-4" />,
  gluten: <Wheat className="w-4 h-4" />,
  milk: <Milk className="w-4 h-4" />,
  dairy: <Milk className="w-4 h-4" />,
  eggs: <Egg className="w-4 h-4" />,
  egg: <Egg className="w-4 h-4" />,
  fish: <Fish className="w-4 h-4" />,
  shellfish: <Shell className="w-4 h-4" />,
  "tree nuts": <Nut className="w-4 h-4" />,
  peanuts: <Nut className="w-4 h-4" />,
  soy: <Leaf className="w-4 h-4" />,
  sesame: <Leaf className="w-4 h-4" />,
};

const DIFFICULTY_COLORS: Record<string, string> = {
  easy: "bg-green-100 text-green-700",
  medium: "bg-amber-100 text-amber-700",
  advanced: "bg-red-100 text-red-700",
};

/* ================================================================
   IMAGE GALLERY COMPONENT
   ================================================================ */

function ImageGallery({
  images,
  mainImage,
  productName,
}: {
  images: string[];
  mainImage: string | null;
  productName: string;
}) {
  const allImages = mainImage
    ? [mainImage, ...images.filter((img) => img !== mainImage)]
    : images;
  const [selectedIndex, setSelectedIndex] = useState(0);

  if (allImages.length === 0) {
    return (
      <div className="aspect-square bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl flex items-center justify-center">
        <Package className="w-24 h-24 text-gray-200" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="relative aspect-square bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl overflow-hidden group">
        <Image
          src={allImages[selectedIndex]}
          alt={`${productName} - Image ${selectedIndex + 1}`}
          fill
          className="object-cover"
          priority
          sizes="(max-width: 768px) 100vw, 50vw"
        />
        {allImages.length > 1 && (
          <>
            <button
              onClick={() =>
                setSelectedIndex((i) =>
                  i === 0 ? allImages.length - 1 : i - 1
                )
              }
              className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/90 backdrop-blur-sm shadow-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white"
              aria-label="Previous image"
            >
              <ChevronLeft className="w-5 h-5 text-gray-700" />
            </button>
            <button
              onClick={() =>
                setSelectedIndex((i) =>
                  i === allImages.length - 1 ? 0 : i + 1
                )
              }
              className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/90 backdrop-blur-sm shadow-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white"
              aria-label="Next image"
            >
              <ChevronRight className="w-5 h-5 text-gray-700" />
            </button>
          </>
        )}
      </div>
      {allImages.length > 1 && (
        <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-1">
          {allImages.map((img, idx) => (
            <button
              key={idx}
              onClick={() => setSelectedIndex(idx)}
              className={cn(
                "relative w-20 h-20 flex-shrink-0 rounded-xl overflow-hidden border-2 transition-all",
                idx === selectedIndex
                  ? "border-aura-primary ring-2 ring-aura-primary/20"
                  : "border-transparent opacity-60 hover:opacity-100"
              )}
              aria-label={`View image ${idx + 1}`}
            >
              <Image
                src={img}
                alt={`${productName} thumbnail ${idx + 1}`}
                fill
                className="object-cover"
                sizes="80px"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ================================================================
   STAR RATING COMPONENT
   ================================================================ */

function StarRating({
  rating,
  size = "sm",
  interactive = false,
  onChange,
}: {
  rating: number;
  size?: "sm" | "md" | "lg";
  interactive?: boolean;
  onChange?: (rating: number) => void;
}) {
  const sizeMap = { sm: "w-4 h-4", md: "w-5 h-5", lg: "w-6 h-6" };
  const iconSize = sizeMap[size];

  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type={interactive ? "button" : undefined}
          onClick={() => interactive && onChange?.(star)}
          className={cn(
            interactive && "cursor-pointer hover:scale-110 transition-transform"
          )}
          disabled={!interactive}
          aria-label={`${star} star${star > 1 ? "s" : ""}`}
        >
          <Star
            className={cn(
              iconSize,
              star <= Math.floor(rating)
                ? "text-aura-accent fill-current"
                : star <= rating
                ? "text-aura-accent fill-current opacity-50"
                : "text-gray-200 fill-current"
            )}
          />
        </button>
      ))}
    </div>
  );
}

/* ================================================================
   NUTRITION LABEL COMPONENT
   ================================================================ */

function NutritionLabel({ nutrition }: { nutrition: ProductNutrition }) {
  const row = (
    label: string,
    value: number | null,
    unit: string,
    bold = false,
    indent = false,
    dv?: number | null
  ) => {
    if (value === null && value === undefined) return null;
    return (
      <div
        className={cn(
          "flex items-center justify-between py-1",
          bold ? "border-t border-gray-900" : "border-t border-gray-300",
          indent && "pl-6"
        )}
      >
        <span className={cn("text-sm", bold && "font-bold", indent && "text-gray-600")}>
          {label}{" "}
          <span className="font-normal">
            {value !== null ? `${value}${unit}` : "—"}
          </span>
        </span>
        {dv !== null && dv !== undefined && (
          <span className="text-sm font-bold">{dv}%</span>
        )}
      </div>
    );
  };

  return (
    <div className="bg-white border-4 border-black rounded-lg p-4 max-w-sm">
      <h3 className="text-3xl font-black tracking-tight mb-0.5">
        Nutrition Facts
      </h3>
      {nutrition.servings_per_container && (
        <p className="text-sm text-gray-700">
          {nutrition.servings_per_container} servings per container
        </p>
      )}
      <div className="flex items-center justify-between border-b-8 border-black pb-1 mt-1">
        <div>
          <p className="text-sm font-bold">Serving size</p>
        </div>
        <p className="text-sm font-bold">{nutrition.serving_size || "1 serving"}</p>
      </div>

      <div className="border-b-4 border-black pb-1 mt-2">
        <p className="text-xs font-bold">Amount per serving</p>
        <div className="flex items-center justify-between">
          <span className="text-2xl font-black">Calories</span>
          <span className="text-3xl font-black">{nutrition.calories ?? "—"}</span>
        </div>
      </div>

      <div className="text-right border-b border-gray-300 py-0.5">
        <span className="text-xs font-bold">% Daily Value*</span>
      </div>

      {row("Total Fat", nutrition.total_fat_g, "g", true, false, nutrition.total_fat_g ? Math.round((nutrition.total_fat_g / 78) * 100) : null)}
      {row("Saturated Fat", nutrition.saturated_fat_g, "g", false, true, nutrition.saturated_fat_g ? Math.round((nutrition.saturated_fat_g / 20) * 100) : null)}
      {row("Trans Fat", nutrition.trans_fat_g, "g", false, true)}
      {row("Cholesterol", nutrition.cholesterol_mg, "mg", true, false, nutrition.cholesterol_mg ? Math.round((nutrition.cholesterol_mg / 300) * 100) : null)}
      {row("Sodium", nutrition.sodium_mg, "mg", true, false, nutrition.sodium_mg ? Math.round((nutrition.sodium_mg / 2300) * 100) : null)}
      {row("Total Carbohydrate", nutrition.total_carbohydrate_g, "g", true, false, nutrition.total_carbohydrate_g ? Math.round((nutrition.total_carbohydrate_g / 275) * 100) : null)}
      {row("Dietary Fiber", nutrition.dietary_fiber_g, "g", false, true, nutrition.dietary_fiber_g ? Math.round((nutrition.dietary_fiber_g / 28) * 100) : null)}
      {row("Total Sugars", nutrition.total_sugars_g, "g", false, true)}
      {nutrition.added_sugars_g !== null && (
        <div className="flex items-center justify-between py-1 border-t border-gray-300 pl-10">
          <span className="text-sm text-gray-600">
            Includes {nutrition.added_sugars_g}g Added Sugars
          </span>
          <span className="text-sm font-bold">
            {Math.round((nutrition.added_sugars_g! / 50) * 100)}%
          </span>
        </div>
      )}
      {row("Protein", nutrition.protein_g, "g", true)}

      <div className="border-t-8 border-black mt-1 pt-1">
        {row("Vitamin D", nutrition.vitamin_d_mcg, "mcg", false, false, nutrition.vitamin_d_mcg ? Math.round((nutrition.vitamin_d_mcg / 20) * 100) : null)}
        {row("Calcium", nutrition.calcium_mg, "mg", false, false, nutrition.calcium_mg ? Math.round((nutrition.calcium_mg / 1300) * 100) : null)}
        {row("Iron", nutrition.iron_mg, "mg", false, false, nutrition.iron_mg ? Math.round((nutrition.iron_mg / 18) * 100) : null)}
        {row("Potassium", nutrition.potassium_mg, "mg", false, false, nutrition.potassium_mg ? Math.round((nutrition.potassium_mg / 4700) * 100) : null)}
      </div>

      <p className="text-[10px] text-gray-500 mt-2 border-t border-gray-300 pt-2">
        * The % Daily Value (DV) tells you how much a nutrient in a serving of
        food contributes to a daily diet. 2,000 calories a day is used for
        general nutrition advice.
      </p>
    </div>
  );
}

/* ================================================================
   RECIPE CARD COMPONENT
   ================================================================ */

function RecipeCard({
  recipe,
  expanded,
  onToggle,
}: {
  recipe: ProductRecipe;
  expanded: boolean;
  onToggle: () => void;
}) {
  const ingredients = (recipe.ingredients as string[]) || [];
  const steps = (recipe.steps as string[]) || [];
  const totalTime = (recipe.prep_time_minutes || 0) + (recipe.cook_time_minutes || 0);

  return (
    <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden hover:shadow-lg transition-shadow">
      <button
        onClick={onToggle}
        className="w-full text-left p-6 flex items-start gap-4"
      >
        <div className="w-14 h-14 rounded-full bg-gradient-to-br from-aura-primary/20 to-aura-accent/20 flex items-center justify-center flex-shrink-0">
          <ChefHat className="w-7 h-7 text-aura-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span
              className={cn(
                "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider",
                DIFFICULTY_COLORS[recipe.difficulty] || "bg-gray-100 text-gray-600"
              )}
            >
              {recipe.difficulty}
            </span>
            {recipe.is_featured && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-aura-accent/10 text-aura-accent">
                Featured
              </span>
            )}
          </div>
          <h4 className="font-semibold text-gray-900 text-lg">{recipe.title}</h4>
          <p className="text-sm text-gray-500 mt-1 line-clamp-2">
            {recipe.description}
          </p>
          <div className="flex items-center gap-4 mt-3 text-xs text-gray-400">
            <span className="flex items-center gap-1">
              <ChefHat className="w-3.5 h-3.5" />
              {recipe.chef_name}
            </span>
            <span className="flex items-center gap-1">
              <Timer className="w-3.5 h-3.5" />
              {totalTime} min
            </span>
            <span className="flex items-center gap-1">
              <Users className="w-3.5 h-3.5" />
              {recipe.servings} serving{recipe.servings !== 1 ? "s" : ""}
            </span>
          </div>
        </div>
        <ChevronRight
          className={cn(
            "w-5 h-5 text-gray-400 flex-shrink-0 transition-transform mt-2",
            expanded && "rotate-90"
          )}
        />
      </button>

      {expanded && (
        <div className="px-6 pb-6 border-t border-gray-100 pt-4 animate-scale">
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h5 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <Package className="w-4 h-4 text-aura-primary" />
                Ingredients
              </h5>
              <ul className="space-y-2">
                {ingredients.map((ingredient, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-sm text-gray-600">
                    <span className="w-5 h-5 rounded-full bg-aura-light text-aura-primary flex items-center justify-center flex-shrink-0 text-xs font-bold mt-0.5">
                      {idx + 1}
                    </span>
                    {ingredient}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h5 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-aura-primary" />
                Instructions
              </h5>
              <ol className="space-y-3">
                {steps.map((step, idx) => (
                  <li key={idx} className="flex items-start gap-3 text-sm text-gray-600">
                    <span className="w-6 h-6 rounded-full bg-aura-dark text-white flex items-center justify-center flex-shrink-0 text-xs font-bold mt-0.5">
                      {idx + 1}
                    </span>
                    <span className="pt-0.5">{step}</span>
                  </li>
                ))}
              </ol>
            </div>
          </div>

          {recipe.tips && recipe.tips.length > 0 && (
            <div className="mt-6 bg-aura-warm rounded-xl p-4">
              <h5 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                <Flame className="w-4 h-4 text-aura-accent" />
                Chef&apos;s Tips
              </h5>
              <ul className="space-y-1.5">
                {recipe.tips.map((tip, idx) => (
                  <li key={idx} className="text-sm text-gray-600 flex items-start gap-2">
                    <span className="text-aura-accent mt-0.5">&#8226;</span>
                    {tip}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="mt-4 flex justify-end">
            <Link
              href={`/academy/${recipe.id}`}
              className="text-sm font-medium text-aura-primary hover:text-aura-secondary flex items-center gap-1 transition-colors"
            >
              View full recipe page
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

/* ================================================================
   REVIEW CARD COMPONENT
   ================================================================ */

function ReviewCard({
  review,
  profile,
}: {
  review: ProductReview;
  profile: { full_name: string | null; avatar_url: string | null } | null;
}) {
  return (
    <div className="border-b border-gray-100 py-6 last:border-0">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-aura-primary/20 to-aura-accent/20 flex items-center justify-center text-sm font-bold text-aura-dark">
            {profile?.full_name?.charAt(0)?.toUpperCase() || "?"}
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900">
              {profile?.full_name || "Aura Customer"}
              {review.is_verified_purchase && (
                <span className="ml-2 inline-flex items-center gap-1 text-[10px] font-medium text-green-600 bg-green-50 px-1.5 py-0.5 rounded-full">
                  <Check className="w-2.5 h-2.5" />
                  Verified Purchase
                </span>
              )}
            </p>
            <p className="text-xs text-gray-400">
              {formatDate(review.created_at)}
            </p>
          </div>
        </div>
        <StarRating rating={review.rating} size="sm" />
      </div>

      {review.title && (
        <h4 className="font-semibold text-gray-900 mb-1">{review.title}</h4>
      )}
      {review.body && <p className="text-sm text-gray-600 mb-3">{review.body}</p>}

      {(review.taste_rating || review.value_rating || review.preparation_ease) && (
        <div className="flex flex-wrap gap-4 mb-3">
          {review.taste_rating && (
            <div className="text-xs text-gray-500">
              <span className="font-medium">Taste:</span>{" "}
              <span className="text-aura-accent font-bold">{review.taste_rating}/5</span>
            </div>
          )}
          {review.value_rating && (
            <div className="text-xs text-gray-500">
              <span className="font-medium">Value:</span>{" "}
              <span className="text-aura-accent font-bold">{review.value_rating}/5</span>
            </div>
          )}
          {review.preparation_ease && (
            <div className="text-xs text-gray-500">
              <span className="font-medium">Prep Ease:</span>{" "}
              <span className="text-aura-accent font-bold">{review.preparation_ease}/5</span>
            </div>
          )}
        </div>
      )}

      {review.admin_response && (
        <div className="bg-aura-light rounded-xl p-3 mt-3">
          <p className="text-xs font-semibold text-aura-dark mb-1">
            Aura Team Response
          </p>
          <p className="text-sm text-gray-600">{review.admin_response}</p>
        </div>
      )}

      <div className="mt-3">
        <button className="text-xs text-gray-400 hover:text-gray-600 flex items-center gap-1 transition-colors">
          <ThumbsUp className="w-3 h-3" />
          Helpful ({review.helpful_count})
        </button>
      </div>
    </div>
  );
}

/* ================================================================
   RELATED PRODUCT CARD
   ================================================================ */

function RelatedProductCard({ product }: { product: Product }) {
  return (
    <Link
      href={`/products/${product.id}`}
      className="group bg-white rounded-2xl border border-gray-100 hover:border-aura-primary/20 overflow-hidden transition-all hover:shadow-lg hover:-translate-y-1"
    >
      <div className="relative aspect-square bg-gradient-to-br from-gray-50 to-gray-100 overflow-hidden">
        {product.image_url ? (
          <Image
            src={product.image_url}
            alt={product.name}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-500"
            sizes="(max-width: 768px) 50vw, 25vw"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Package className="w-12 h-12 text-gray-200" />
          </div>
        )}
      </div>
      <div className="p-4">
        <h4 className="font-semibold text-gray-900 text-sm mb-1 line-clamp-1">
          {product.name}
        </h4>
        <p className="text-sm font-bold text-gray-900">{formatCurrency(product.price)}</p>
      </div>
    </Link>
  );
}

/* ================================================================
   RATING DISTRIBUTION CHART
   ================================================================ */

function RatingDistribution({
  reviews,
}: {
  reviews: ProductReview[];
}) {
  const total = reviews.length;
  const distribution = [5, 4, 3, 2, 1].map((star) => ({
    star,
    count: reviews.filter((r) => r.rating === star).length,
    percentage: total > 0 ? (reviews.filter((r) => r.rating === star).length / total) * 100 : 0,
  }));

  const average =
    total > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / total
      : 0;

  return (
    <div className="flex items-start gap-8">
      <div className="text-center">
        <p className="text-5xl font-bold text-gray-900">{average.toFixed(1)}</p>
        <StarRating rating={average} size="md" />
        <p className="text-sm text-gray-500 mt-1">
          {total} review{total !== 1 ? "s" : ""}
        </p>
      </div>
      <div className="flex-1 space-y-1.5">
        {distribution.map(({ star, count, percentage }) => (
          <div key={star} className="flex items-center gap-2 text-sm">
            <span className="w-3 text-gray-500 text-right">{star}</span>
            <Star className="w-3.5 h-3.5 text-aura-accent fill-current" />
            <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-aura-accent rounded-full transition-all duration-500"
                style={{ width: `${percentage}%` }}
              />
            </div>
            <span className="w-8 text-xs text-gray-400 text-right">{count}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ================================================================
   WRITE REVIEW FORM
   ================================================================ */

function WriteReviewForm({
  productId,
  onSubmit,
}: {
  productId: string;
  onSubmit: () => void;
}) {
  const { user } = useAuth();
  const [rating, setRating] = useState(0);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [tasteRating, setTasteRating] = useState(0);
  const [valueRating, setValueRating] = useState(0);
  const [prepEase, setPrepEase] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  if (!user) {
    return (
      <div className="text-center py-8 bg-gray-50 rounded-xl">
        <p className="text-gray-500 mb-3">Sign in to leave a review</p>
        <Link href="/auth/login">
          <Button variant="primary" size="sm">
            Sign In
          </Button>
        </Link>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) {
      setError("Please select an overall rating");
      return;
    }

    setIsSubmitting(true);
    setError("");

    const supabase = createClient();
    const { error: submitError } = await supabase.from("product_reviews").insert({
      product_id: productId,
      user_id: user.id,
      rating,
      title: title || null,
      body: body || null,
      taste_rating: tasteRating || null,
      value_rating: valueRating || null,
      preparation_ease: prepEase || null,
    });

    if (submitError) {
      setError("Failed to submit review. Please try again.");
    } else {
      setRating(0);
      setTitle("");
      setBody("");
      setTasteRating(0);
      setValueRating(0);
      setPrepEase(0);
      onSubmit();
    }
    setIsSubmitting(false);
  };

  return (
    <form onSubmit={handleSubmit} className="bg-gray-50 rounded-xl p-6 space-y-4">
      <h4 className="font-semibold text-gray-900">Write a Review</h4>

      <div>
        <label className="text-sm text-gray-600 block mb-1">Overall Rating *</label>
        <StarRating rating={rating} size="lg" interactive onChange={setRating} />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className="text-sm text-gray-600 block mb-1">Taste</label>
          <StarRating rating={tasteRating} size="sm" interactive onChange={setTasteRating} />
        </div>
        <div>
          <label className="text-sm text-gray-600 block mb-1">Value</label>
          <StarRating rating={valueRating} size="sm" interactive onChange={setValueRating} />
        </div>
        <div>
          <label className="text-sm text-gray-600 block mb-1">Prep Ease</label>
          <StarRating rating={prepEase} size="sm" interactive onChange={setPrepEase} />
        </div>
      </div>

      <div>
        <label htmlFor="review-title" className="text-sm text-gray-600 block mb-1">
          Title
        </label>
        <input
          id="review-title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Summarize your experience"
          className="input-field"
        />
      </div>

      <div>
        <label htmlFor="review-body" className="text-sm text-gray-600 block mb-1">
          Review
        </label>
        <textarea
          id="review-body"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={4}
          placeholder="Share your thoughts..."
          className="input-field resize-none"
        />
      </div>

      {error && (
        <p className="text-sm text-red-500 flex items-center gap-1">
          <AlertTriangle className="w-4 h-4" />
          {error}
        </p>
      )}

      <Button type="submit" isLoading={isSubmitting} size="md">
        Submit Review
      </Button>
    </form>
  );
}

/* ================================================================
   MAIN PAGE COMPONENT
   ================================================================ */

export default function ProductDetailPage() {
  const params = useParams();
  const productId = params.id as string;
  const supabase = createClient();

  const [product, setProduct] = useState<Product | null>(null);
  const [variants, setVariants] = useState<ProductVariant[]>([]);
  const [nutrition, setNutrition] = useState<ProductNutrition | null>(null);
  const [reviews, setReviews] = useState<ProductReview[]>([]);
  const [reviewProfiles, setReviewProfiles] = useState<
    Record<string, { full_name: string | null; avatar_url: string | null }>
  >({});
  const [recipes, setRecipes] = useState<ProductRecipe[]>([]);
  const [relatedPairsWith, setRelatedPairsWith] = useState<Product[]>([]);
  const [relatedAlsoBought, setRelatedAlsoBought] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // UI state
  const [activeTab, setActiveTab] = useState<"description" | "nutrition" | "academy" | "reviews">("description");
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [isSubscription, setIsSubscription] = useState(true);
  const [expandedRecipe, setExpandedRecipe] = useState<string | null>(null);
  const [isLiked, setIsLiked] = useState(false);

  const fetchData = useCallback(async () => {
    setIsLoading(true);

    // Fetch product
    const { data: productData, error: productError } = await supabase
      .from("aura_products")
      .select("*")
      .eq("id", productId)
      .single();

    if (productError || !productData) {
      setError("Product not found");
      setIsLoading(false);
      return;
    }

    setProduct(productData);

    // Fetch remaining data in parallel
    const [variantsRes, nutritionRes, reviewsRes, recipesRes, relationshipsRes] = await Promise.all([
      supabase
        .from("product_variants")
        .select("*")
        .eq("product_id", productId)
        .eq("is_active", true)
        .order("sort_order"),
      supabase
        .from("product_nutrition")
        .select("*")
        .eq("product_id", productId)
        .limit(1)
        .single(),
      supabase
        .from("product_reviews")
        .select("*")
        .eq("product_id", productId)
        .eq("status", "approved")
        .order("created_at", { ascending: false }),
      supabase
        .from("product_recipes")
        .select("*")
        .eq("product_id", productId)
        .order("sort_order"),
      supabase
        .from("product_relationships")
        .select("*")
        .eq("source_product_id", productId),
    ]);

    if (variantsRes.data) setVariants(variantsRes.data);
    if (nutritionRes.data) setNutrition(nutritionRes.data);
    if (reviewsRes.data) {
      setReviews(reviewsRes.data);
      // Fetch reviewer profiles
      const userIds = [...new Set(reviewsRes.data.map((r) => r.user_id))];
      if (userIds.length > 0) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, full_name, avatar_url")
          .in("id", userIds);
        if (profiles) {
          const profileMap: Record<string, { full_name: string | null; avatar_url: string | null }> = {};
          profiles.forEach((p) => {
            profileMap[p.id] = { full_name: p.full_name, avatar_url: p.avatar_url };
          });
          setReviewProfiles(profileMap);
        }
      }
    }
    if (recipesRes.data) setRecipes(recipesRes.data);

    // Fetch related products
    if (relationshipsRes.data && relationshipsRes.data.length > 0) {
      const pairsWithIds = relationshipsRes.data
        .filter((r) => r.relationship_type === "pairs_with")
        .map((r) => r.target_product_id);
      const alsoBoughtIds = relationshipsRes.data
        .filter((r) => r.relationship_type === "also_bought")
        .map((r) => r.target_product_id);

      const allRelatedIds = [...new Set([...pairsWithIds, ...alsoBoughtIds])];
      if (allRelatedIds.length > 0) {
        const { data: relatedProducts } = await supabase
          .from("aura_products")
          .select("*")
          .in("id", allRelatedIds)
          .eq("is_active", true);

        if (relatedProducts) {
          setRelatedPairsWith(
            relatedProducts.filter((p) => pairsWithIds.includes(p.id))
          );
          setRelatedAlsoBought(
            relatedProducts.filter((p) => alsoBoughtIds.includes(p.id))
          );
        }
      }
    }

    setIsLoading(false);
  }, [productId, supabase]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Price calculations
  const activePrice = selectedVariant ? selectedVariant.price : product?.price || 0;
  const comparePrice = selectedVariant
    ? selectedVariant.compare_at_price
    : product?.compare_at_price;
  const subscriptionPrice = activePrice * 0.85; // 15% off for subscription
  const displayPrice = isSubscription ? subscriptionPrice : activePrice;
  const savingsPercent = 15;

  // Sizes & flavors from variants
  const sizes = [...new Set(variants.filter((v) => v.size).map((v) => v.size))];
  const flavors = [...new Set(variants.filter((v) => v.flavor).map((v) => v.flavor))];

  const tabs = [
    { id: "description" as const, label: "Description" },
    { id: "nutrition" as const, label: "Nutrition Facts" },
    { id: "academy" as const, label: `Aura Academy${recipes.length > 0 ? ` (${recipes.length})` : ""}` },
    { id: "reviews" as const, label: `Reviews${reviews.length > 0 ? ` (${reviews.length})` : ""}` },
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-white">
        <Header />
        <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
          <div className="grid lg:grid-cols-2 gap-12">
            <Skeleton className="aspect-square w-full rounded-2xl" />
            <div className="space-y-4">
              <Skeleton className="h-8 w-3/4" />
              <Skeleton className="h-4 w-1/4" />
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-12 w-1/2" />
              <Skeleton className="h-12 w-full" />
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen flex flex-col bg-white">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <Package className="w-16 h-16 text-gray-200 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Product Not Found
            </h2>
            <p className="text-gray-500 mb-6">
              The product you are looking for does not exist or has been removed.
            </p>
            <Link href="/products">
              <Button variant="primary">Browse Products</Button>
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const dietaryLabels = product.dietary_labels || [];
  const allergens = product.allergens_enum || [];
  const ingredientsList = product.ingredients;

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Header />

      <main className="flex-1">
        {/* Breadcrumb */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <nav className="flex items-center gap-2 text-sm text-gray-400" aria-label="Breadcrumb">
            <Link href="/" className="hover:text-gray-600 transition-colors">Home</Link>
            <span>/</span>
            <Link href="/products" className="hover:text-gray-600 transition-colors">Products</Link>
            <span>/</span>
            <span className="text-gray-700 font-medium truncate">{product.name}</span>
          </nav>
        </div>

        {/* Hero Section */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12">
            {/* Image Gallery */}
            <ImageGallery
              images={product.images || []}
              mainImage={product.image_url}
              productName={product.name}
            />

            {/* Product Info */}
            <div className="space-y-6">
              {/* Brand */}
              {product.brand && (
                <p className="text-sm font-medium text-aura-primary uppercase tracking-wider">
                  {product.brand}
                </p>
              )}

              {/* Name */}
              <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 leading-tight">
                {product.name}
              </h1>

              {/* Rating */}
              {reviews.length > 0 && (
                <div className="flex items-center gap-3">
                  <StarRating
                    rating={
                      reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
                    }
                    size="md"
                  />
                  <button
                    onClick={() => setActiveTab("reviews")}
                    className="text-sm text-gray-500 hover:text-aura-primary transition-colors"
                  >
                    {reviews.length} review{reviews.length !== 1 ? "s" : ""}
                  </button>
                </div>
              )}

              {/* Short description */}
              {product.short_description && (
                <p className="text-gray-600 leading-relaxed">
                  {product.short_description}
                </p>
              )}

              {/* Dietary badges */}
              {dietaryLabels.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {dietaryLabels.map((label) => (
                    <span
                      key={label}
                      className={cn(
                        "px-3 py-1 rounded-full text-xs font-semibold border",
                        DIETARY_COLORS[label.toLowerCase()] || "bg-gray-100 text-gray-600 border-gray-200"
                      )}
                    >
                      {label}
                    </span>
                  ))}
                </div>
              )}

              {/* Bunker safe & shelf life badges */}
              <div className="flex items-center gap-3">
                {product.is_bunker_safe && (
                  <div className="flex items-center gap-2 bg-aura-dark text-white px-3 py-1.5 rounded-full text-xs font-bold">
                    <Shield className="w-3.5 h-3.5" />
                    Bunker Safe
                  </div>
                )}
                {product.shelf_life_months && (
                  <div className="flex items-center gap-2 bg-gray-100 text-gray-700 px-3 py-1.5 rounded-full text-xs font-medium">
                    <Clock className="w-3.5 h-3.5" />
                    {product.shelf_life_months} Month Shelf Life
                  </div>
                )}
              </div>

              {/* Variant Selectors */}
              {sizes.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">Size</p>
                  <div className="flex flex-wrap gap-2">
                    {sizes.map((size) => {
                      const variant = variants.find((v) => v.size === size);
                      const isSelected = selectedVariant?.size === size;
                      return (
                        <button
                          key={size}
                          onClick={() =>
                            setSelectedVariant(isSelected ? null : variant || null)
                          }
                          className={cn(
                            "px-4 py-2 rounded-xl text-sm font-medium border-2 transition-all",
                            isSelected
                              ? "border-aura-primary bg-aura-light text-aura-dark"
                              : "border-gray-200 hover:border-gray-300 text-gray-600"
                          )}
                        >
                          {size}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {flavors.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">Flavor</p>
                  <div className="flex flex-wrap gap-2">
                    {flavors.map((flavor) => {
                      const variant = variants.find((v) => v.flavor === flavor);
                      const isSelected = selectedVariant?.flavor === flavor;
                      return (
                        <button
                          key={flavor}
                          onClick={() =>
                            setSelectedVariant(isSelected ? null : variant || null)
                          }
                          className={cn(
                            "px-4 py-2 rounded-xl text-sm font-medium border-2 transition-all",
                            isSelected
                              ? "border-aura-primary bg-aura-light text-aura-dark"
                              : "border-gray-200 hover:border-gray-300 text-gray-600"
                          )}
                        >
                          {flavor}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Pricing Section */}
              <div className="bg-gray-50 rounded-2xl p-6 space-y-4">
                {/* Subscribe toggle */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setIsSubscription(!isSubscription)}
                      className={cn(
                        "relative w-12 h-6 rounded-full transition-colors",
                        isSubscription ? "bg-aura-primary" : "bg-gray-300"
                      )}
                      role="switch"
                      aria-checked={isSubscription}
                      aria-label="Toggle subscription pricing"
                    >
                      <span
                        className={cn(
                          "absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform",
                          isSubscription ? "left-6" : "left-0.5"
                        )}
                      />
                    </button>
                    <span className="text-sm font-medium text-gray-700">
                      Subscribe & Save
                    </span>
                  </div>
                  {isSubscription && (
                    <span className="text-sm font-bold text-aura-primary bg-aura-light px-3 py-1 rounded-full">
                      Save {savingsPercent}%
                    </span>
                  )}
                </div>

                {/* Price display */}
                <div className="flex items-baseline gap-3">
                  <span className="text-3xl font-bold text-gray-900">
                    {formatCurrency(displayPrice)}
                  </span>
                  {(comparePrice || (!isSubscription && false)) && (
                    <>
                      {isSubscription && (
                        <span className="text-lg text-gray-400 line-through">
                          {formatCurrency(activePrice)}
                        </span>
                      )}
                      {comparePrice && comparePrice > activePrice && (
                        <span className="text-lg text-gray-400 line-through">
                          {formatCurrency(comparePrice)}
                        </span>
                      )}
                    </>
                  )}
                  <span className="text-sm text-gray-500">
                    {isSubscription ? "/delivery" : "one-time"}
                  </span>
                </div>

                {/* Quantity & Actions */}
                <div className="flex items-center gap-3">
                  {/* Quantity selector */}
                  <div className="flex items-center border border-gray-200 rounded-xl overflow-hidden bg-white">
                    <button
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="px-3 py-2.5 hover:bg-gray-50 transition-colors"
                      aria-label="Decrease quantity"
                    >
                      <Minus className="w-4 h-4 text-gray-600" />
                    </button>
                    <span className="px-4 py-2.5 text-sm font-semibold text-gray-900 min-w-[40px] text-center">
                      {quantity}
                    </span>
                    <button
                      onClick={() => setQuantity(quantity + 1)}
                      className="px-3 py-2.5 hover:bg-gray-50 transition-colors"
                      aria-label="Increase quantity"
                    >
                      <Plus className="w-4 h-4 text-gray-600" />
                    </button>
                  </div>

                  <Button variant="primary" size="lg" className="flex-1">
                    Add to Box
                  </Button>
                </div>

                <Button variant="accent" size="lg" className="w-full">
                  Buy Now
                </Button>
              </div>

              {/* Quick actions */}
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setIsLiked(!isLiked)}
                  className={cn(
                    "flex items-center gap-2 text-sm font-medium transition-colors",
                    isLiked ? "text-red-500" : "text-gray-400 hover:text-gray-600"
                  )}
                  aria-label={isLiked ? "Remove from wishlist" : "Add to wishlist"}
                >
                  <Heart className={cn("w-5 h-5", isLiked && "fill-current")} />
                  {isLiked ? "Saved" : "Save"}
                </button>
                <button
                  className="flex items-center gap-2 text-sm font-medium text-gray-400 hover:text-gray-600 transition-colors"
                  aria-label="Share product"
                >
                  <Share2 className="w-5 h-5" />
                  Share
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Tabs Section */}
        <section className="border-t border-gray-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Tab navigation */}
            <div className="flex overflow-x-auto scrollbar-hide border-b border-gray-200 -mb-px">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "px-6 py-4 text-sm font-medium whitespace-nowrap border-b-2 transition-colors",
                    activeTab === tab.id
                      ? "border-aura-primary text-aura-primary"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  )}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Tab content */}
            <div className="py-8">
              {/* Description Tab */}
              {activeTab === "description" && (
                <div className="max-w-3xl space-y-8">
                  {product.description && (
                    <div className="prose prose-gray max-w-none">
                      <p className="text-gray-600 leading-relaxed text-lg">
                        {product.description}
                      </p>
                    </div>
                  )}

                  {/* Ingredients */}
                  {ingredientsList && (
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">
                        Ingredients
                      </h3>
                      <p className="text-gray-600 leading-relaxed">
                        {ingredientsList}
                      </p>
                    </div>
                  )}

                  {/* Allergens */}
                  {allergens.length > 0 && (
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                        <AlertTriangle className="w-5 h-5 text-amber-500" />
                        Allergen Information
                      </h3>
                      <div className="flex flex-wrap gap-3">
                        {allergens.map((allergen) => (
                          <div
                            key={allergen}
                            className="flex items-center gap-2 px-3 py-2 bg-amber-50 text-amber-700 rounded-xl text-sm font-medium border border-amber-200"
                          >
                            {ALLERGEN_ICONS[allergen.toLowerCase()] || (
                              <AlertTriangle className="w-4 h-4" />
                            )}
                            <span className="capitalize">{allergen}</span>
                          </div>
                        ))}
                      </div>
                      <p className="text-xs text-gray-400 mt-2">
                        Manufactured in a facility that may process other allergens.
                      </p>
                    </div>
                  )}

                  {/* Storage & Preparation */}
                  <div className="grid md:grid-cols-2 gap-6">
                    {product.storage_instructions && (
                      <div className="bg-gray-50 rounded-xl p-5">
                        <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                          <Thermometer className="w-4 h-4 text-blue-500" />
                          Storage Instructions
                        </h4>
                        <p className="text-sm text-gray-600">
                          {product.storage_instructions}
                        </p>
                      </div>
                    )}
                    {product.preparation_instructions && (
                      <div className="bg-gray-50 rounded-xl p-5">
                        <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                          <Flame className="w-4 h-4 text-orange-500" />
                          Preparation Instructions
                        </h4>
                        <p className="text-sm text-gray-600">
                          {product.preparation_instructions}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Country of origin */}
                  {product.country_of_origin && (
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <Globe className="w-4 h-4" />
                      Country of Origin: {product.country_of_origin}
                    </div>
                  )}
                </div>
              )}

              {/* Nutrition Tab */}
              {activeTab === "nutrition" && (
                <div>
                  {nutrition ? (
                    <NutritionLabel nutrition={nutrition} />
                  ) : (
                    <div className="text-center py-12">
                      <Info className="w-12 h-12 text-gray-200 mx-auto mb-4" />
                      <p className="text-gray-500">
                        Nutrition information is not yet available for this product.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Academy Tab */}
              {activeTab === "academy" && (
                <div>
                  {recipes.length > 0 ? (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between mb-6">
                        <div>
                          <h3 className="text-xl font-bold text-gray-900">
                            Aura Academy Recipes
                          </h3>
                          <p className="text-sm text-gray-500 mt-1">
                            Chef-crafted recipes to elevate your meals
                          </p>
                        </div>
                        <Link
                          href="/academy"
                          className="text-sm font-medium text-aura-primary hover:text-aura-secondary transition-colors"
                        >
                          View All Recipes
                        </Link>
                      </div>
                      {recipes.map((recipe) => (
                        <RecipeCard
                          key={recipe.id}
                          recipe={recipe}
                          expanded={expandedRecipe === recipe.id}
                          onToggle={() =>
                            setExpandedRecipe(
                              expandedRecipe === recipe.id ? null : recipe.id
                            )
                          }
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <ChefHat className="w-12 h-12 text-gray-200 mx-auto mb-4" />
                      <p className="text-gray-500 mb-2">
                        No recipes available yet for this product.
                      </p>
                      <Link
                        href="/academy"
                        className="text-sm font-medium text-aura-primary hover:text-aura-secondary transition-colors"
                      >
                        Browse all Aura Academy recipes
                      </Link>
                    </div>
                  )}
                </div>
              )}

              {/* Reviews Tab */}
              {activeTab === "reviews" && (
                <div className="space-y-8">
                  {reviews.length > 0 && (
                    <RatingDistribution reviews={reviews} />
                  )}

                  <WriteReviewForm
                    productId={productId}
                    onSubmit={fetchData}
                  />

                  {reviews.length > 0 ? (
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-4">
                        Customer Reviews
                      </h3>
                      {reviews.map((review) => (
                        <ReviewCard
                          key={review.id}
                          review={review}
                          profile={reviewProfiles[review.user_id] || null}
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Star className="w-12 h-12 text-gray-200 mx-auto mb-4" />
                      <p className="text-gray-500">
                        No reviews yet. Be the first to share your experience!
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Cross-sells Section */}
        {(relatedPairsWith.length > 0 || relatedAlsoBought.length > 0) && (
          <section className="border-t border-gray-100 py-12 bg-gray-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
              {relatedPairsWith.length > 0 && (
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-6">
                    Pairs Well With
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {relatedPairsWith.map((p) => (
                      <RelatedProductCard key={p.id} product={p} />
                    ))}
                  </div>
                </div>
              )}

              {relatedAlsoBought.length > 0 && (
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-6">
                    Customers Also Bought
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {relatedAlsoBought.map((p) => (
                      <RelatedProductCard key={p.id} product={p} />
                    ))}
                  </div>
                </div>
              )}
            </div>
          </section>
        )}

        {/* Storage Info Section */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid md:grid-cols-3 gap-6">
            {product.shelf_life_months && (
              <div className="flex items-start gap-4 p-5 bg-white rounded-xl border border-gray-100">
                <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0">
                  <Clock className="w-5 h-5 text-blue-500" />
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-1">Shelf Life</h4>
                  <p className="text-sm text-gray-600">
                    {product.shelf_life_months} months from production date
                  </p>
                </div>
              </div>
            )}
            {product.storage_instructions && (
              <div className="flex items-start gap-4 p-5 bg-white rounded-xl border border-gray-100">
                <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center flex-shrink-0">
                  <Thermometer className="w-5 h-5 text-purple-500" />
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-1">Storage</h4>
                  <p className="text-sm text-gray-600">
                    {product.storage_instructions}
                  </p>
                </div>
              </div>
            )}
            {product.country_of_origin && (
              <div className="flex items-start gap-4 p-5 bg-white rounded-xl border border-gray-100">
                <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center flex-shrink-0">
                  <Globe className="w-5 h-5 text-green-500" />
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-1">Origin</h4>
                  <p className="text-sm text-gray-600">
                    Made in {product.country_of_origin}
                  </p>
                </div>
              </div>
            )}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
