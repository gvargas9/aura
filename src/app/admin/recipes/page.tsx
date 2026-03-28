"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui";
import { TableSkeleton } from "@/components/ui/SkeletonLoader";
import {
  Plus,
  Pencil,
  Trash2,
  Eye,
  ChefHat,
  Star,
  GripVertical,
  X,
  Save,
  ArrowUp,
  ArrowDown,
  Search,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { ProductRecipe, Product, Json } from "@/types/database";

/* ================================================================
   RECIPE FORM
   ================================================================ */

interface RecipeFormData {
  product_id: string;
  title: string;
  description: string;
  chef_name: string;
  chef_title: string;
  chef_image_url: string;
  difficulty: "easy" | "medium" | "advanced";
  prep_time_minutes: number;
  cook_time_minutes: number;
  servings: number;
  ingredients: string[];
  steps: string[];
  tips: string[];
  tags: string[];
  video_url: string;
  image_url: string;
  is_featured: boolean;
  sort_order: number;
}

const EMPTY_FORM: RecipeFormData = {
  product_id: "",
  title: "",
  description: "",
  chef_name: "",
  chef_title: "",
  chef_image_url: "",
  difficulty: "easy",
  prep_time_minutes: 0,
  cook_time_minutes: 0,
  servings: 1,
  ingredients: [""],
  steps: [""],
  tips: [""],
  tags: [],
  video_url: "",
  image_url: "",
  is_featured: false,
  sort_order: 0,
};

function RecipeForm({
  initialData,
  products,
  onSave,
  onCancel,
  isPreview,
  onTogglePreview,
}: {
  initialData: RecipeFormData;
  products: Product[];
  onSave: (data: RecipeFormData) => Promise<void>;
  onCancel: () => void;
  isPreview: boolean;
  onTogglePreview: () => void;
}) {
  const [form, setForm] = useState<RecipeFormData>(initialData);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [tagInput, setTagInput] = useState("");

  const updateField = <K extends keyof RecipeFormData>(
    key: K,
    value: RecipeFormData[K]
  ) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const addListItem = (key: "ingredients" | "steps" | "tips") => {
    setForm((prev) => ({ ...prev, [key]: [...prev[key], ""] }));
  };

  const removeListItem = (key: "ingredients" | "steps" | "tips", index: number) => {
    setForm((prev) => ({
      ...prev,
      [key]: prev[key].filter((_, i) => i !== index),
    }));
  };

  const updateListItem = (
    key: "ingredients" | "steps" | "tips",
    index: number,
    value: string
  ) => {
    setForm((prev) => ({
      ...prev,
      [key]: prev[key].map((item, i) => (i === index ? value : item)),
    }));
  };

  const moveListItem = (
    key: "ingredients" | "steps" | "tips",
    index: number,
    direction: "up" | "down"
  ) => {
    const newIndex = direction === "up" ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= form[key].length) return;
    setForm((prev) => {
      const items = [...prev[key]];
      [items[index], items[newIndex]] = [items[newIndex], items[index]];
      return { ...prev, [key]: items };
    });
  };

  const addTag = () => {
    const tag = tagInput.trim().toLowerCase();
    if (tag && !form.tags.includes(tag)) {
      updateField("tags", [...form.tags, tag]);
    }
    setTagInput("");
  };

  const removeTag = (tag: string) => {
    updateField(
      "tags",
      form.tags.filter((t) => t !== tag)
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.product_id) {
      setError("Please select a product");
      return;
    }
    if (!form.title) {
      setError("Title is required");
      return;
    }
    if (!form.chef_name) {
      setError("Chef name is required");
      return;
    }

    setIsSaving(true);
    setError("");
    try {
      await onSave(form);
    } catch {
      setError("Failed to save recipe. Please try again.");
    }
    setIsSaving(false);
  };

  if (isPreview) {
    const totalTime = form.prep_time_minutes + form.cook_time_minutes;
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Preview</h3>
          <Button variant="outline" size="sm" onClick={onTogglePreview}>
            Back to Edit
          </Button>
        </div>

        <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
          <div className="bg-gradient-to-br from-amber-50 to-orange-50 p-8 text-center">
            <ChefHat className="w-12 h-12 text-amber-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900">{form.title || "Untitled Recipe"}</h2>
            <p className="text-gray-500 mt-2">{form.description}</p>
          </div>

          <div className="p-6 space-y-6">
            <div className="flex items-center gap-4 text-sm text-gray-500">
              <span>Chef: {form.chef_name}</span>
              <span>Difficulty: {form.difficulty}</span>
              <span>Time: {totalTime} min</span>
              <span>Servings: {form.servings}</span>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold mb-3">Ingredients</h4>
                <ul className="space-y-1.5">
                  {form.ingredients.filter(Boolean).map((item, i) => (
                    <li key={i} className="text-sm text-gray-600 flex gap-2">
                      <span className="text-aura-primary font-bold">{i + 1}.</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-3">Steps</h4>
                <ol className="space-y-2">
                  {form.steps.filter(Boolean).map((step, i) => (
                    <li key={i} className="text-sm text-gray-600 flex gap-2">
                      <span className="w-5 h-5 rounded-full bg-aura-dark text-white flex items-center justify-center text-xs flex-shrink-0">
                        {i + 1}
                      </span>
                      {step}
                    </li>
                  ))}
                </ol>
              </div>
            </div>

            {form.tips.filter(Boolean).length > 0 && (
              <div className="bg-amber-50 rounded-xl p-4">
                <h4 className="font-semibold mb-2">Tips</h4>
                <ul className="space-y-1">
                  {form.tips.filter(Boolean).map((tip, i) => (
                    <li key={i} className="text-sm text-gray-600">
                      &#8226; {tip}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {form.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {form.tags.map((tag) => (
                  <span key={tag} className="px-2 py-1 bg-gray-100 text-gray-500 rounded-full text-xs">
                    #{tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Product selector */}
      <div>
        <label htmlFor="product" className="block text-sm font-medium text-gray-700 mb-1.5">
          Product *
        </label>
        <select
          id="product"
          value={form.product_id}
          onChange={(e) => updateField("product_id", e.target.value)}
          className="input-field"
        >
          <option value="">Select a product...</option>
          {products.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name} ({p.sku})
            </option>
          ))}
        </select>
      </div>

      {/* Title & Description */}
      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1.5">
            Title *
          </label>
          <input
            id="title"
            type="text"
            value={form.title}
            onChange={(e) => updateField("title", e.target.value)}
            className="input-field"
            placeholder="Mediterranean Herb Chicken Bowl"
          />
        </div>
        <div>
          <label htmlFor="image_url" className="block text-sm font-medium text-gray-700 mb-1.5">
            Image URL
          </label>
          <input
            id="image_url"
            type="url"
            value={form.image_url}
            onChange={(e) => updateField("image_url", e.target.value)}
            className="input-field"
            placeholder="https://..."
          />
        </div>
      </div>

      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1.5">
          Description
        </label>
        <textarea
          id="description"
          value={form.description}
          onChange={(e) => updateField("description", e.target.value)}
          rows={3}
          className="input-field resize-none"
          placeholder="A brief description of the recipe..."
        />
      </div>

      {/* Chef info */}
      <div className="grid md:grid-cols-3 gap-4">
        <div>
          <label htmlFor="chef_name" className="block text-sm font-medium text-gray-700 mb-1.5">
            Chef Name *
          </label>
          <input
            id="chef_name"
            type="text"
            value={form.chef_name}
            onChange={(e) => updateField("chef_name", e.target.value)}
            className="input-field"
            placeholder="Chef Maria Santos"
          />
        </div>
        <div>
          <label htmlFor="chef_title" className="block text-sm font-medium text-gray-700 mb-1.5">
            Chef Title
          </label>
          <input
            id="chef_title"
            type="text"
            value={form.chef_title}
            onChange={(e) => updateField("chef_title", e.target.value)}
            className="input-field"
            placeholder="Head Chef, Aura Kitchen"
          />
        </div>
        <div>
          <label htmlFor="chef_image" className="block text-sm font-medium text-gray-700 mb-1.5">
            Chef Image URL
          </label>
          <input
            id="chef_image"
            type="url"
            value={form.chef_image_url}
            onChange={(e) => updateField("chef_image_url", e.target.value)}
            className="input-field"
            placeholder="https://..."
          />
        </div>
      </div>

      {/* Difficulty, times, servings */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div>
          <label htmlFor="difficulty" className="block text-sm font-medium text-gray-700 mb-1.5">
            Difficulty
          </label>
          <select
            id="difficulty"
            value={form.difficulty}
            onChange={(e) =>
              updateField("difficulty", e.target.value as RecipeFormData["difficulty"])
            }
            className="input-field"
          >
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="advanced">Advanced</option>
          </select>
        </div>
        <div>
          <label htmlFor="prep_time" className="block text-sm font-medium text-gray-700 mb-1.5">
            Prep (min)
          </label>
          <input
            id="prep_time"
            type="number"
            min={0}
            value={form.prep_time_minutes}
            onChange={(e) => updateField("prep_time_minutes", Number(e.target.value))}
            className="input-field"
          />
        </div>
        <div>
          <label htmlFor="cook_time" className="block text-sm font-medium text-gray-700 mb-1.5">
            Cook (min)
          </label>
          <input
            id="cook_time"
            type="number"
            min={0}
            value={form.cook_time_minutes}
            onChange={(e) => updateField("cook_time_minutes", Number(e.target.value))}
            className="input-field"
          />
        </div>
        <div>
          <label htmlFor="servings" className="block text-sm font-medium text-gray-700 mb-1.5">
            Servings
          </label>
          <input
            id="servings"
            type="number"
            min={1}
            value={form.servings}
            onChange={(e) => updateField("servings", Number(e.target.value))}
            className="input-field"
          />
        </div>
        <div>
          <label htmlFor="sort_order" className="block text-sm font-medium text-gray-700 mb-1.5">
            Sort Order
          </label>
          <input
            id="sort_order"
            type="number"
            value={form.sort_order}
            onChange={(e) => updateField("sort_order", Number(e.target.value))}
            className="input-field"
          />
        </div>
      </div>

      {/* Featured toggle */}
      <label className="flex items-center gap-3 cursor-pointer">
        <input
          type="checkbox"
          checked={form.is_featured}
          onChange={(e) => updateField("is_featured", e.target.checked)}
          className="w-4 h-4 rounded border-gray-300 text-aura-primary focus:ring-aura-primary/20"
        />
        <span className="text-sm font-medium text-gray-700">Featured Recipe</span>
      </label>

      {/* Ingredients editor */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="block text-sm font-medium text-gray-700">
            Ingredients ({form.ingredients.filter(Boolean).length})
          </label>
          <button
            type="button"
            onClick={() => addListItem("ingredients")}
            className="text-xs text-aura-primary hover:text-aura-secondary font-medium flex items-center gap-1"
          >
            <Plus className="w-3 h-3" />
            Add
          </button>
        </div>
        <div className="space-y-2">
          {form.ingredients.map((item, idx) => (
            <div key={idx} className="flex items-center gap-2">
              <div className="flex flex-col gap-0.5">
                <button
                  type="button"
                  onClick={() => moveListItem("ingredients", idx, "up")}
                  disabled={idx === 0}
                  className="text-gray-400 hover:text-gray-600 disabled:opacity-30"
                  aria-label="Move up"
                >
                  <ArrowUp className="w-3 h-3" />
                </button>
                <button
                  type="button"
                  onClick={() => moveListItem("ingredients", idx, "down")}
                  disabled={idx === form.ingredients.length - 1}
                  className="text-gray-400 hover:text-gray-600 disabled:opacity-30"
                  aria-label="Move down"
                >
                  <ArrowDown className="w-3 h-3" />
                </button>
              </div>
              <span className="text-xs text-gray-400 w-4">{idx + 1}</span>
              <input
                type="text"
                value={item}
                onChange={(e) => updateListItem("ingredients", idx, e.target.value)}
                className="input-field flex-1"
                placeholder="1 cup cooked rice"
              />
              <button
                type="button"
                onClick={() => removeListItem("ingredients", idx)}
                className="text-gray-400 hover:text-red-500 p-1"
                aria-label="Remove ingredient"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Steps editor */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="block text-sm font-medium text-gray-700">
            Steps ({form.steps.filter(Boolean).length})
          </label>
          <button
            type="button"
            onClick={() => addListItem("steps")}
            className="text-xs text-aura-primary hover:text-aura-secondary font-medium flex items-center gap-1"
          >
            <Plus className="w-3 h-3" />
            Add
          </button>
        </div>
        <div className="space-y-2">
          {form.steps.map((step, idx) => (
            <div key={idx} className="flex items-start gap-2">
              <div className="flex flex-col gap-0.5 mt-3">
                <button
                  type="button"
                  onClick={() => moveListItem("steps", idx, "up")}
                  disabled={idx === 0}
                  className="text-gray-400 hover:text-gray-600 disabled:opacity-30"
                  aria-label="Move up"
                >
                  <ArrowUp className="w-3 h-3" />
                </button>
                <button
                  type="button"
                  onClick={() => moveListItem("steps", idx, "down")}
                  disabled={idx === form.steps.length - 1}
                  className="text-gray-400 hover:text-gray-600 disabled:opacity-30"
                  aria-label="Move down"
                >
                  <ArrowDown className="w-3 h-3" />
                </button>
              </div>
              <span className="w-6 h-6 rounded-full bg-aura-dark text-white flex items-center justify-center text-xs font-bold flex-shrink-0 mt-3">
                {idx + 1}
              </span>
              <textarea
                value={step}
                onChange={(e) => updateListItem("steps", idx, e.target.value)}
                className="input-field flex-1 resize-none"
                rows={2}
                placeholder="Describe this step..."
              />
              <button
                type="button"
                onClick={() => removeListItem("steps", idx)}
                className="text-gray-400 hover:text-red-500 p-1 mt-3"
                aria-label="Remove step"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Tips editor */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="block text-sm font-medium text-gray-700">
            Tips ({form.tips.filter(Boolean).length})
          </label>
          <button
            type="button"
            onClick={() => addListItem("tips")}
            className="text-xs text-aura-primary hover:text-aura-secondary font-medium flex items-center gap-1"
          >
            <Plus className="w-3 h-3" />
            Add
          </button>
        </div>
        <div className="space-y-2">
          {form.tips.map((tip, idx) => (
            <div key={idx} className="flex items-center gap-2">
              <input
                type="text"
                value={tip}
                onChange={(e) => updateListItem("tips", idx, e.target.value)}
                className="input-field flex-1"
                placeholder="Add a helpful tip..."
              />
              <button
                type="button"
                onClick={() => removeListItem("tips", idx)}
                className="text-gray-400 hover:text-red-500 p-1"
                aria-label="Remove tip"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Tags */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">Tags</label>
        <div className="flex flex-wrap gap-2 mb-2">
          {form.tags.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center gap-1 px-2.5 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-medium"
            >
              #{tag}
              <button
                type="button"
                onClick={() => removeTag(tag)}
                className="text-gray-400 hover:text-red-500"
                aria-label={`Remove tag ${tag}`}
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addTag();
              }
            }}
            className="input-field flex-1"
            placeholder="Type a tag and press Enter"
          />
          <Button type="button" variant="outline" size="sm" onClick={addTag}>
            Add
          </Button>
        </div>
      </div>

      {/* Video URL */}
      <div>
        <label htmlFor="video_url" className="block text-sm font-medium text-gray-700 mb-1.5">
          Video URL
        </label>
        <input
          id="video_url"
          type="url"
          value={form.video_url}
          onChange={(e) => updateField("video_url", e.target.value)}
          className="input-field"
          placeholder="https://youtube.com/embed/..."
        />
      </div>

      {/* Error */}
      {error && (
        <p className="text-sm text-red-500">{error}</p>
      )}

      {/* Actions */}
      <div className="flex items-center gap-3 pt-4 border-t border-gray-200">
        <Button type="submit" isLoading={isSaving}>
          <Save className="w-4 h-4 mr-2" />
          Save Recipe
        </Button>
        <Button type="button" variant="outline" onClick={onTogglePreview}>
          <Eye className="w-4 h-4 mr-2" />
          Preview
        </Button>
        <Button type="button" variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  );
}

/* ================================================================
   MAIN ADMIN PAGE
   ================================================================ */

export default function AdminRecipesPage() {
  const supabase = createClient();

  const [recipes, setRecipes] = useState<ProductRecipe[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [productMap, setProductMap] = useState<Record<string, Product>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  // Form state
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isPreview, setIsPreview] = useState(false);
  const [formData, setFormData] = useState<RecipeFormData>(EMPTY_FORM);

  const fetchData = useCallback(async () => {
    setIsLoading(true);

    const [recipesRes, productsRes] = await Promise.all([
      supabase
        .from("product_recipes")
        .select("*")
        .order("created_at", { ascending: false }),
      supabase
        .from("aura_products")
        .select("*")
        .eq("is_active", true)
        .order("name"),
    ]);

    if (recipesRes.data) setRecipes(recipesRes.data);
    if (productsRes.data) {
      setProducts(productsRes.data);
      const map: Record<string, Product> = {};
      productsRes.data.forEach((p) => {
        map[p.id] = p;
      });
      setProductMap(map);
    }

    setIsLoading(false);
  }, [supabase]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleCreate = () => {
    setEditingId(null);
    setFormData(EMPTY_FORM);
    setIsPreview(false);
    setShowForm(true);
  };

  const handleEdit = (recipe: ProductRecipe) => {
    setEditingId(recipe.id);
    setFormData({
      product_id: recipe.product_id,
      title: recipe.title,
      description: recipe.description || "",
      chef_name: recipe.chef_name,
      chef_title: recipe.chef_title || "",
      chef_image_url: recipe.chef_image_url || "",
      difficulty: recipe.difficulty,
      prep_time_minutes: recipe.prep_time_minutes || 0,
      cook_time_minutes: recipe.cook_time_minutes || 0,
      servings: recipe.servings,
      ingredients: (recipe.ingredients as string[]) || [""],
      steps: (recipe.steps as string[]) || [""],
      tips: recipe.tips || [""],
      tags: recipe.tags || [],
      video_url: recipe.video_url || "",
      image_url: recipe.image_url || "",
      is_featured: recipe.is_featured,
      sort_order: recipe.sort_order,
    });
    setIsPreview(false);
    setShowForm(true);
  };

  const handleSave = async (data: RecipeFormData) => {
    const cleanIngredients = data.ingredients.filter(Boolean);
    const cleanSteps = data.steps.filter(Boolean);
    const cleanTips = data.tips.filter(Boolean);

    const payload = {
      product_id: data.product_id,
      title: data.title,
      description: data.description || null,
      chef_name: data.chef_name,
      chef_title: data.chef_title || null,
      chef_image_url: data.chef_image_url || null,
      difficulty: data.difficulty,
      prep_time_minutes: data.prep_time_minutes || null,
      cook_time_minutes: data.cook_time_minutes || null,
      servings: data.servings,
      ingredients: cleanIngredients as unknown as Json,
      steps: cleanSteps as unknown as Json,
      tips: cleanTips.length > 0 ? cleanTips : null,
      tags: data.tags,
      video_url: data.video_url || null,
      image_url: data.image_url || null,
      is_featured: data.is_featured,
      sort_order: data.sort_order,
      updated_at: new Date().toISOString(),
    };

    if (editingId) {
      const { error } = await supabase
        .from("product_recipes")
        .update(payload)
        .eq("id", editingId);
      if (error) throw error;
    } else {
      const { error } = await supabase.from("product_recipes").insert(payload);
      if (error) throw error;
    }

    setShowForm(false);
    setEditingId(null);
    fetchData();
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this recipe?")) return;

    await supabase.from("product_recipes").delete().eq("id", id);
    fetchData();
  };

  const handleToggleFeatured = async (id: string, current: boolean) => {
    await supabase
      .from("product_recipes")
      .update({ is_featured: !current, updated_at: new Date().toISOString() })
      .eq("id", id);
    fetchData();
  };

  const filteredRecipes = recipes.filter((r) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      r.title.toLowerCase().includes(q) ||
      r.chef_name.toLowerCase().includes(q) ||
      productMap[r.product_id]?.name.toLowerCase().includes(q)
    );
  });

  const DIFFICULTY_BADGE: Record<string, string> = {
    easy: "bg-green-100 text-green-700",
    medium: "bg-amber-100 text-amber-700",
    advanced: "bg-red-100 text-red-700",
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
            <ChefHat className="w-7 h-7 text-aura-primary" />
            Recipe Management
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage Aura Academy recipes for your products
          </p>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="w-4 h-4 mr-2" />
          Add Recipe
        </Button>
      </div>

      {/* Form */}
      {showForm && (
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            {editingId ? "Edit Recipe" : "New Recipe"}
          </h2>
          <RecipeForm
            initialData={formData}
            products={products}
            onSave={handleSave}
            onCancel={() => {
              setShowForm(false);
              setEditingId(null);
            }}
            isPreview={isPreview}
            onTogglePreview={() => setIsPreview(!isPreview)}
          />
        </div>
      )}

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search recipes..."
          className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-aura-primary/20 focus:border-aura-primary outline-none transition-all bg-white"
          aria-label="Search recipes"
        />
      </div>

      {/* Table */}
      {isLoading ? (
        <TableSkeleton rows={5} columns={6} />
      ) : filteredRecipes.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-2xl border border-gray-100">
          <ChefHat className="w-12 h-12 text-gray-200 mx-auto mb-4" />
          <p className="text-gray-500">
            {searchQuery ? "No recipes match your search" : "No recipes yet. Create your first one!"}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/50">
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Recipe</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Product</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Chef</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Difficulty</th>
                  <th className="text-center px-4 py-3 font-semibold text-gray-600">Featured</th>
                  <th className="text-right px-4 py-3 font-semibold text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredRecipes.map((recipe) => {
                  const product = productMap[recipe.product_id];
                  const totalTime = (recipe.prep_time_minutes || 0) + (recipe.cook_time_minutes || 0);

                  return (
                    <tr
                      key={recipe.id}
                      className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50 transition-colors"
                    >
                      <td className="px-4 py-3">
                        <div>
                          <p className="font-medium text-gray-900">{recipe.title}</p>
                          <p className="text-xs text-gray-400 mt-0.5">
                            {totalTime} min | {recipe.servings} serving{recipe.servings !== 1 ? "s" : ""}
                          </p>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-gray-600">
                          {product?.name || "Unknown"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-gray-600">{recipe.chef_name}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={cn(
                            "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider",
                            DIFFICULTY_BADGE[recipe.difficulty] || "bg-gray-100 text-gray-600"
                          )}
                        >
                          {recipe.difficulty}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => handleToggleFeatured(recipe.id, recipe.is_featured)}
                          className={cn(
                            "w-8 h-8 rounded-full flex items-center justify-center transition-colors mx-auto",
                            recipe.is_featured
                              ? "bg-aura-accent/10 text-aura-accent"
                              : "bg-gray-100 text-gray-400 hover:text-aura-accent"
                          )}
                          aria-label={recipe.is_featured ? "Remove from featured" : "Mark as featured"}
                        >
                          <Star
                            className={cn(
                              "w-4 h-4",
                              recipe.is_featured && "fill-current"
                            )}
                          />
                        </button>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handleEdit(recipe)}
                            className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
                            aria-label="Edit recipe"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <a
                            href={`/academy/${recipe.id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
                            aria-label="View recipe"
                          >
                            <Eye className="w-4 h-4" />
                          </a>
                          <button
                            onClick={() => handleDelete(recipe.id)}
                            className="p-2 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"
                            aria-label="Delete recipe"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
