"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Header, Footer, Button } from "@/components/ui";
import { Skeleton } from "@/components/ui/SkeletonLoader";
import Image from "next/image";
import Link from "next/link";
import {
  ChefHat,
  Timer,
  Users,
  Flame,
  Printer,
  Share2,
  Check,
  Clock,
  ArrowLeft,
  BookOpen,
  Package,
  ChevronRight,
  Star,
} from "lucide-react";
import { cn, formatCurrency } from "@/lib/utils";
import type { ProductRecipe, Product } from "@/types/database";

/* ================================================================
   CONSTANTS
   ================================================================ */

const DIFFICULTY_COLORS: Record<string, string> = {
  easy: "bg-green-100 text-green-700",
  medium: "bg-amber-100 text-amber-700",
  advanced: "bg-red-100 text-red-700",
};

/* ================================================================
   INGREDIENT CHECKBOX
   ================================================================ */

function IngredientItem({
  ingredient,
  index,
}: {
  ingredient: string;
  index: number;
}) {
  const [checked, setChecked] = useState(false);

  return (
    <label
      className={cn(
        "flex items-start gap-3 py-3 px-4 rounded-xl cursor-pointer transition-all group",
        checked ? "bg-aura-light/50" : "hover:bg-gray-50"
      )}
    >
      <div className="flex-shrink-0 mt-0.5">
        <input
          type="checkbox"
          checked={checked}
          onChange={() => setChecked(!checked)}
          className="sr-only"
          aria-label={`Mark ${ingredient} as gathered`}
        />
        <div
          className={cn(
            "w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all",
            checked
              ? "bg-aura-primary border-aura-primary"
              : "border-gray-300 group-hover:border-gray-400"
          )}
        >
          {checked && <Check className="w-3 h-3 text-white" />}
        </div>
      </div>
      <span
        className={cn(
          "text-base transition-all",
          checked ? "text-gray-400 line-through" : "text-gray-700"
        )}
      >
        {ingredient}
      </span>
    </label>
  );
}

/* ================================================================
   RELATED RECIPE CARD
   ================================================================ */

function MiniRecipeCard({ recipe }: { recipe: ProductRecipe }) {
  const totalTime = (recipe.prep_time_minutes || 0) + (recipe.cook_time_minutes || 0);

  return (
    <Link
      href={`/academy/${recipe.id}`}
      className="group flex items-center gap-4 p-4 bg-white rounded-xl border border-gray-100 hover:shadow-md hover:border-aura-primary/20 transition-all"
    >
      <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-amber-50 to-orange-50 flex items-center justify-center flex-shrink-0 overflow-hidden">
        {recipe.image_url ? (
          <Image
            src={recipe.image_url}
            alt={recipe.title}
            width={64}
            height={64}
            className="object-cover w-full h-full"
          />
        ) : (
          <ChefHat className="w-6 h-6 text-amber-300" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <h4 className="font-semibold text-gray-900 text-sm group-hover:text-aura-primary transition-colors truncate">
          {recipe.title}
        </h4>
        <div className="flex items-center gap-3 text-xs text-gray-400 mt-1">
          <span className="flex items-center gap-1">
            <Timer className="w-3 h-3" />
            {totalTime} min
          </span>
          <span
            className={cn(
              "px-1.5 py-0.5 rounded-full text-[9px] font-bold uppercase",
              DIFFICULTY_COLORS[recipe.difficulty] || "bg-gray-100 text-gray-600"
            )}
          >
            {recipe.difficulty}
          </span>
        </div>
      </div>
      <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-aura-primary transition-colors flex-shrink-0" />
    </Link>
  );
}

/* ================================================================
   MAIN PAGE COMPONENT
   ================================================================ */

export default function RecipePage() {
  const params = useParams();
  const recipeId = params.recipeId as string;
  const supabase = createClient();

  const [recipe, setRecipe] = useState<ProductRecipe | null>(null);
  const [product, setProduct] = useState<Product | null>(null);
  const [relatedRecipes, setRelatedRecipes] = useState<ProductRecipe[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);

      const { data: recipeData, error: recipeError } = await supabase
        .from("product_recipes")
        .select("*")
        .eq("id", recipeId)
        .single();

      if (recipeError || !recipeData) {
        setError("Recipe not found");
        setIsLoading(false);
        return;
      }

      setRecipe(recipeData);

      // Fetch product and related recipes in parallel
      const [productRes, relatedRes] = await Promise.all([
        supabase
          .from("aura_products")
          .select("*")
          .eq("id", recipeData.product_id)
          .single(),
        supabase
          .from("product_recipes")
          .select("*")
          .eq("product_id", recipeData.product_id)
          .neq("id", recipeId)
          .order("sort_order")
          .limit(4),
      ]);

      if (productRes.data) setProduct(productRes.data);
      if (relatedRes.data) setRelatedRecipes(relatedRes.data);

      setIsLoading(false);
    };

    fetchData();
  }, [recipeId, supabase]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-white">
        <Header />
        <main className="flex-1 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
          <Skeleton className="h-64 w-full rounded-2xl mb-8" />
          <Skeleton className="h-8 w-3/4 mb-4" />
          <Skeleton className="h-4 w-1/2 mb-8" />
          <div className="grid md:grid-cols-2 gap-8">
            <div className="space-y-3">
              <Skeleton className="h-6 w-1/3" />
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
            <div className="space-y-3">
              <Skeleton className="h-6 w-1/3" />
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (error || !recipe) {
    return (
      <div className="min-h-screen flex flex-col bg-white">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <BookOpen className="w-16 h-16 text-gray-200 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Recipe Not Found
            </h2>
            <p className="text-gray-500 mb-6">
              The recipe you are looking for does not exist or has been removed.
            </p>
            <Link href="/academy">
              <Button variant="primary">Browse Recipes</Button>
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const ingredients = (recipe.ingredients as string[]) || [];
  const steps = (recipe.steps as string[]) || [];
  const totalTime = (recipe.prep_time_minutes || 0) + (recipe.cook_time_minutes || 0);

  const handlePrint = () => {
    window.print();
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: recipe.title,
          text: recipe.description || `Check out this recipe from Aura Academy`,
          url: window.location.href,
        });
      } catch {
        // User cancelled share
      }
    } else {
      navigator.clipboard.writeText(window.location.href);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Header />

      <main className="flex-1">
        {/* Hero Image */}
        <section className="relative">
          <div className="relative h-64 md:h-80 lg:h-96 bg-gradient-to-br from-amber-50 to-orange-50 overflow-hidden">
            {recipe.image_url ? (
              <Image
                src={recipe.image_url}
                alt={recipe.title}
                fill
                className="object-cover"
                priority
                sizes="100vw"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <ChefHat className="w-24 h-24 text-amber-200" />
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />

            {/* Back button */}
            <div className="absolute top-4 left-4">
              <Link
                href="/academy"
                className="flex items-center gap-2 bg-white/90 backdrop-blur-sm text-gray-700 px-4 py-2 rounded-full text-sm font-medium hover:bg-white transition-colors shadow-sm"
              >
                <ArrowLeft className="w-4 h-4" />
                All Recipes
              </Link>
            </div>

            {/* Title overlay */}
            <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8">
              <div className="max-w-4xl mx-auto">
                <div className="flex items-center gap-2 mb-3">
                  <span
                    className={cn(
                      "px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider shadow-sm",
                      DIFFICULTY_COLORS[recipe.difficulty] || "bg-gray-100 text-gray-600"
                    )}
                  >
                    {recipe.difficulty}
                  </span>
                  {recipe.is_featured && (
                    <span className="bg-aura-accent text-white text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1 shadow-sm">
                      <Star className="w-3 h-3 fill-current" />
                      Featured
                    </span>
                  )}
                </div>
                <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white tracking-tight">
                  {recipe.title}
                </h1>
              </div>
            </div>
          </div>
        </section>

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Chef info bar */}
          <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-aura-primary/20 to-aura-accent/20 flex items-center justify-center overflow-hidden">
                {recipe.chef_image_url ? (
                  <Image
                    src={recipe.chef_image_url}
                    alt={recipe.chef_name}
                    width={48}
                    height={48}
                    className="object-cover w-full h-full"
                  />
                ) : (
                  <ChefHat className="w-6 h-6 text-aura-primary" />
                )}
              </div>
              <div>
                <p className="font-semibold text-gray-900">{recipe.chef_name}</p>
                {recipe.chef_title && (
                  <p className="text-xs text-gray-500">{recipe.chef_title}</p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={handlePrint}
                className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-600 rounded-xl text-sm font-medium hover:bg-gray-200 transition-colors print:hidden"
                aria-label="Print recipe"
              >
                <Printer className="w-4 h-4" />
                Print
              </button>
              <button
                onClick={handleShare}
                className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-600 rounded-xl text-sm font-medium hover:bg-gray-200 transition-colors"
                aria-label="Share recipe"
              >
                <Share2 className="w-4 h-4" />
                Share
              </button>
            </div>
          </div>

          {/* Quick stats */}
          <div className="grid grid-cols-4 gap-4 py-6">
            <div className="text-center">
              <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center mx-auto mb-2">
                <Timer className="w-5 h-5 text-blue-500" />
              </div>
              <p className="text-xs text-gray-500">Prep Time</p>
              <p className="text-sm font-bold text-gray-900">
                {recipe.prep_time_minutes || 0} min
              </p>
            </div>
            <div className="text-center">
              <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center mx-auto mb-2">
                <Flame className="w-5 h-5 text-orange-500" />
              </div>
              <p className="text-xs text-gray-500">Cook Time</p>
              <p className="text-sm font-bold text-gray-900">
                {recipe.cook_time_minutes || 0} min
              </p>
            </div>
            <div className="text-center">
              <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center mx-auto mb-2">
                <Clock className="w-5 h-5 text-green-500" />
              </div>
              <p className="text-xs text-gray-500">Total</p>
              <p className="text-sm font-bold text-gray-900">{totalTime} min</p>
            </div>
            <div className="text-center">
              <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center mx-auto mb-2">
                <Users className="w-5 h-5 text-purple-500" />
              </div>
              <p className="text-xs text-gray-500">Servings</p>
              <p className="text-sm font-bold text-gray-900">{recipe.servings}</p>
            </div>
          </div>

          {/* Description */}
          {recipe.description && (
            <p className="text-gray-600 leading-relaxed text-lg mb-8">
              {recipe.description}
            </p>
          )}

          {/* Ingredients & Steps */}
          <div className="grid md:grid-cols-[1fr,1.5fr] gap-8 lg:gap-12">
            {/* Ingredients */}
            <div>
              <div className="sticky top-24">
                <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Package className="w-5 h-5 text-aura-primary" />
                  Ingredients
                </h2>
                <div className="bg-gray-50 rounded-2xl p-2 space-y-0.5">
                  {ingredients.map((ingredient, idx) => (
                    <IngredientItem
                      key={idx}
                      ingredient={ingredient}
                      index={idx}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Steps */}
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-aura-primary" />
                Instructions
              </h2>
              <ol className="space-y-6">
                {steps.map((step, idx) => (
                  <li key={idx} className="flex items-start gap-4">
                    <span className="w-8 h-8 rounded-full bg-aura-dark text-white flex items-center justify-center flex-shrink-0 text-sm font-bold mt-1">
                      {idx + 1}
                    </span>
                    <p className="text-gray-700 text-lg leading-relaxed pt-1">
                      {step}
                    </p>
                  </li>
                ))}
              </ol>
            </div>
          </div>

          {/* Chef's Tips */}
          {recipe.tips && recipe.tips.length > 0 && (
            <div className="mt-12 bg-gradient-to-br from-aura-warm to-amber-50 rounded-2xl p-6 lg:p-8">
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Flame className="w-5 h-5 text-aura-accent" />
                Chef&apos;s Tips
              </h2>
              <ul className="space-y-3">
                {recipe.tips.map((tip, idx) => (
                  <li
                    key={idx}
                    className="flex items-start gap-3 text-gray-700"
                  >
                    <div className="w-6 h-6 rounded-full bg-aura-accent/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Star className="w-3 h-3 text-aura-accent fill-current" />
                    </div>
                    <p className="leading-relaxed">{tip}</p>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Tags */}
          {recipe.tags && recipe.tags.length > 0 && (
            <div className="mt-8 flex flex-wrap gap-2">
              {recipe.tags.map((tag) => (
                <span
                  key={tag}
                  className="px-3 py-1.5 bg-gray-100 text-gray-500 rounded-full text-sm font-medium"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}

          {/* View Product Link */}
          {product && (
            <div className="mt-10 bg-white border border-gray-200 rounded-2xl p-6 flex items-center gap-6">
              <div className="w-20 h-20 rounded-xl bg-gradient-to-br from-gray-50 to-gray-100 flex-shrink-0 overflow-hidden relative">
                {product.image_url ? (
                  <Image
                    src={product.image_url}
                    alt={product.name}
                    fill
                    className="object-cover"
                    sizes="80px"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Package className="w-8 h-8 text-gray-200" />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">
                  Made With
                </p>
                <h3 className="font-semibold text-gray-900 mb-1">
                  {product.name}
                </h3>
                <p className="text-sm text-gray-500 line-clamp-1">
                  {product.short_description || product.description}
                </p>
              </div>
              <div className="flex-shrink-0 text-right">
                <p className="font-bold text-gray-900 mb-2">
                  {formatCurrency(product.price)}
                </p>
                <Link href={`/products/${product.id}`}>
                  <Button variant="primary" size="sm">
                    View Product
                  </Button>
                </Link>
              </div>
            </div>
          )}

          {/* Related Recipes */}
          {relatedRecipes.length > 0 && (
            <div className="mt-12">
              <h2 className="text-xl font-bold text-gray-900 mb-6">
                More Recipes with {product?.name || "This Product"}
              </h2>
              <div className="space-y-3">
                {relatedRecipes.map((r) => (
                  <MiniRecipeCard key={r.id} recipe={r} />
                ))}
              </div>
            </div>
          )}

          {/* Video */}
          {recipe.video_url && (
            <div className="mt-12">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                Watch the Tutorial
              </h2>
              <div className="relative aspect-video rounded-2xl overflow-hidden bg-gray-900">
                <iframe
                  src={recipe.video_url}
                  title={`${recipe.title} video tutorial`}
                  className="absolute inset-0 w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
