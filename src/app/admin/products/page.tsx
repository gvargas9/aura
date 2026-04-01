"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/hooks";
import { useLocale } from "@/hooks/useLocale";
import { Card, Button, Input } from "@/components/ui";
import { formatCurrency } from "@/lib/utils";
import type { Product } from "@/types";
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  X,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Shield,
  ImageIcon,
  Filter,
} from "lucide-react";

type ProductFormData = {
  name: string;
  sku: string;
  description: string;
  short_description: string;
  price: string;
  compare_at_price: string;
  category: string;
  is_bunker_safe: boolean;
  shelf_life_months: string;
  weight_oz: string;
  ingredients: string;
  tags: string;
  image_url: string;
  is_active: boolean;
  stock_level: string;
};

const emptyForm: ProductFormData = {
  name: "",
  sku: "",
  description: "",
  short_description: "",
  price: "",
  compare_at_price: "",
  category: "",
  is_bunker_safe: false,
  shelf_life_months: "",
  weight_oz: "",
  ingredients: "",
  tags: "",
  image_url: "",
  is_active: true,
  stock_level: "0",
};

const PAGE_SIZE = 20;

export default function AdminProductsPage() {
  const { profile } = useAuth();
  const { t } = useLocale();
  const supabase = createClient();

  const [products, setProducts] = useState<Product[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [activeFilter, setActiveFilter] = useState<"all" | "active" | "inactive">("all");
  const [categories, setCategories] = useState<string[]>([]);

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [form, setForm] = useState<ProductFormData>(emptyForm);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  const fetchProducts = useCallback(async () => {
    if (!profile || profile.role !== "admin") return;
    setIsLoading(true);

    let query = supabase
      .from("aura_products")
      .select("*", { count: "exact" });

    if (search) {
      query = query.or(`name.ilike.%${search}%,sku.ilike.%${search}%`);
    }
    if (categoryFilter) {
      query = query.eq("category", categoryFilter);
    }
    if (activeFilter === "active") {
      query = query.eq("is_active", true);
    } else if (activeFilter === "inactive") {
      query = query.eq("is_active", false);
    }

    const from = (page - 1) * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;

    const { data, count, error: fetchError } = await query
      .order("created_at", { ascending: false })
      .range(from, to);

    if (fetchError) {
      console.error("Error fetching products:", fetchError);
    } else {
      setProducts(data || []);
      setTotalCount(count || 0);
    }
    setIsLoading(false);
  }, [profile, supabase, search, categoryFilter, activeFilter, page]);

  const fetchCategories = useCallback(async () => {
    const { data } = await supabase
      .from("aura_products")
      .select("category");

    if (data) {
      const uniqueCategories = [...new Set(data.map((d) => d.category).filter(Boolean))];
      setCategories(uniqueCategories);
    }
  }, [supabase]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [search, categoryFilter, activeFilter]);

  const openCreateModal = () => {
    setEditingProduct(null);
    setForm(emptyForm);
    setError("");
    setShowModal(true);
  };

  const openEditModal = (product: Product) => {
    setEditingProduct(product);
    setForm({
      name: product.name,
      sku: product.sku,
      description: product.description || "",
      short_description: product.short_description || "",
      price: String(product.price),
      compare_at_price: product.compare_at_price ? String(product.compare_at_price) : "",
      category: product.category,
      is_bunker_safe: product.is_bunker_safe,
      shelf_life_months: product.shelf_life_months ? String(product.shelf_life_months) : "",
      weight_oz: product.weight_oz ? String(product.weight_oz) : "",
      ingredients: product.ingredients || "",
      tags: product.tags?.join(", ") || "",
      image_url: product.image_url || "",
      is_active: product.is_active,
      stock_level: String(product.stock_level),
    });
    setError("");
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.name || !form.sku || !form.price || !form.category) {
      setError("Name, SKU, price, and category are required.");
      return;
    }

    setIsSaving(true);
    setError("");

    const payload = {
      name: form.name,
      sku: form.sku,
      description: form.description || null,
      short_description: form.short_description || null,
      price: parseFloat(form.price),
      compare_at_price: form.compare_at_price ? parseFloat(form.compare_at_price) : null,
      category: form.category,
      is_bunker_safe: form.is_bunker_safe,
      shelf_life_months: form.shelf_life_months ? parseInt(form.shelf_life_months) : null,
      weight_oz: form.weight_oz ? parseFloat(form.weight_oz) : null,
      ingredients: form.ingredients || null,
      tags: form.tags ? form.tags.split(",").map((t) => t.trim()).filter(Boolean) : [],
      image_url: form.image_url || null,
      is_active: form.is_active,
      stock_level: parseInt(form.stock_level) || 0,
    };

    if (editingProduct) {
      const { error: updateError } = await supabase
        .from("aura_products")
        .update(payload)
        .eq("id", editingProduct.id);

      if (updateError) {
        setError(updateError.message);
        setIsSaving(false);
        return;
      }
    } else {
      const { error: insertError } = await supabase
        .from("aura_products")
        .insert(payload);

      if (insertError) {
        setError(insertError.message);
        setIsSaving(false);
        return;
      }
    }

    setIsSaving(false);
    setShowModal(false);
    fetchProducts();
    fetchCategories();
  };

  const handleDeactivate = async (product: Product) => {
    if (!confirm(`Are you sure you want to deactivate "${product.name}"?`)) return;

    const { error: updateError } = await supabase
      .from("aura_products")
      .update({ is_active: false })
      .eq("id", product.id);

    if (updateError) {
      alert("Failed to deactivate product: " + updateError.message);
      return;
    }
    fetchProducts();
  };

  const handleReactivate = async (product: Product) => {
    const { error: updateError } = await supabase
      .from("aura_products")
      .update({ is_active: true })
      .eq("id", product.id);

    if (updateError) {
      alert("Failed to reactivate product: " + updateError.message);
      return;
    }
    fetchProducts();
  };

  return (
    <>
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{t("admin.products")}</h1>
          <p className="text-gray-600">{t("admin.productsSubtitle")}</p>
        </div>
        <Button onClick={openCreateModal} leftIcon={<Plus className="w-4 h-4" />}>
          {t("admin.addProduct")}
        </Button>
      </div>

      {/* Filters */}
      <Card padding="md" className="mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <Input
              placeholder={t("admin.searchNameSku")}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              leftIcon={<Search className="w-4 h-4" />}
            />
          </div>
          <div className="flex gap-3">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-aura-primary focus:border-transparent outline-none"
              aria-label="Filter by category"
            >
              <option value="">{t("admin.allCategories")}</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
            <select
              value={activeFilter}
              onChange={(e) => setActiveFilter(e.target.value as "all" | "active" | "inactive")}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-aura-primary focus:border-transparent outline-none"
              aria-label="Filter by status"
            >
              <option value="all">{t("admin.allStatus")}</option>
              <option value="active">{t("admin.active")}</option>
              <option value="inactive">{t("admin.inactive")}</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Products Table */}
      <Card padding="none">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-6 h-6 animate-spin text-aura-primary" />
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-20 text-gray-500">
            <ImageIcon className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p className="font-medium">{t("admin.noProductsFound")}</p>
            <p className="text-sm mt-1">{t("admin.adjustFilters")}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b">
                  <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    {t("admin.product")}
                  </th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    {t("admin.sku")}
                  </th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    {t("admin.category")}
                  </th>
                  <th className="text-right py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    {t("admin.price")}
                  </th>
                  <th className="text-right py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    {t("admin.stock")}
                  </th>
                  <th className="text-center py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    {t("admin.bunkerSafe")}
                  </th>
                  <th className="text-center py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    {t("admin.status")}
                  </th>
                  <th className="text-right py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    {t("admin.actions")}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {products.map((product) => (
                  <tr key={product.id} className="hover:bg-gray-50 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-gray-100 overflow-hidden flex-shrink-0 flex items-center justify-center">
                          {product.image_url ? (
                            <img
                              src={product.image_url}
                              alt={product.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <ImageIcon className="w-5 h-5 text-gray-400" />
                          )}
                        </div>
                        <span className="font-medium text-gray-900 text-sm">
                          {product.name}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-500 font-mono">
                      {product.sku}
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-sm text-gray-600 bg-gray-100 px-2 py-0.5 rounded">
                        {product.category}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right text-sm font-medium">
                      {formatCurrency(product.price)}
                      {product.compare_at_price && (
                        <span className="block text-xs text-gray-400 line-through">
                          {formatCurrency(product.compare_at_price)}
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right text-sm">
                      <span
                        className={
                          product.stock_level === 0
                            ? "text-red-600 font-medium"
                            : product.stock_level < 50
                            ? "text-amber-600 font-medium"
                            : "text-gray-700"
                        }
                      >
                        {product.stock_level}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      {product.is_bunker_safe ? (
                        <Shield className="w-4 h-4 text-green-600 mx-auto" />
                      ) : (
                        <span className="text-gray-300">-</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          product.is_active
                            ? "bg-green-100 text-green-700"
                            : "bg-gray-100 text-gray-500"
                        }`}
                      >
                        {product.is_active ? t("admin.active") : t("admin.inactive")}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => openEditModal(product)}
                          className="p-1.5 text-gray-400 hover:text-aura-primary hover:bg-aura-primary/10 rounded transition-colors"
                          aria-label={`Edit ${product.name}`}
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        {product.is_active ? (
                          <button
                            onClick={() => handleDeactivate(product)}
                            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                            aria-label={`Deactivate ${product.name}`}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        ) : (
                          <button
                            onClick={() => handleReactivate(product)}
                            className="text-xs text-aura-primary hover:underline px-2"
                          >
                            {t("admin.activate")}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t">
            <p className="text-sm text-gray-500">
              Showing {(page - 1) * PAGE_SIZE + 1} to{" "}
              {Math.min(page * PAGE_SIZE, totalCount)} of {totalCount} products
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-1.5 rounded hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
                aria-label="Previous page"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum: number;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (page <= 3) {
                  pageNum = i + 1;
                } else if (page >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = page - 2 + i;
                }
                return (
                  <button
                    key={pageNum}
                    onClick={() => setPage(pageNum)}
                    className={`w-8 h-8 rounded text-sm font-medium ${
                      page === pageNum
                        ? "bg-aura-primary text-white"
                        : "hover:bg-gray-100 text-gray-700"
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="p-1.5 rounded hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
                aria-label="Next page"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}
      </Card>

      {/* Product Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-10 px-4">
          <div
            className="fixed inset-0 bg-black/50"
            onClick={() => setShowModal(false)}
            aria-hidden="true"
          />
          <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[85vh] overflow-y-auto z-10">
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between rounded-t-xl">
              <h2 className="text-xl font-semibold">
                {editingProduct ? t("admin.editProduct") : t("admin.addProduct")}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="p-1 hover:bg-gray-100 rounded"
                aria-label="Close modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                  {error}
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Product Name *"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g., Beef Stroganoff"
                />
                <Input
                  label="SKU *"
                  value={form.sku}
                  onChange={(e) => setForm({ ...form, sku: e.target.value })}
                  placeholder="e.g., AURA-BS-001"
                />
              </div>

              <Input
                label="Short Description"
                value={form.short_description}
                onChange={(e) => setForm({ ...form, short_description: e.target.value })}
                placeholder="Brief one-line description"
              />

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-aura-primary focus:border-transparent outline-none resize-none"
                  placeholder="Detailed product description"
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <Input
                  label="Price *"
                  type="number"
                  step="0.01"
                  value={form.price}
                  onChange={(e) => setForm({ ...form, price: e.target.value })}
                  placeholder="0.00"
                />
                <Input
                  label="Compare At Price"
                  type="number"
                  step="0.01"
                  value={form.compare_at_price}
                  onChange={(e) => setForm({ ...form, compare_at_price: e.target.value })}
                  placeholder="0.00"
                />
                <Input
                  label="Stock Level"
                  type="number"
                  value={form.stock_level}
                  onChange={(e) => setForm({ ...form, stock_level: e.target.value })}
                  placeholder="0"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Category *
                  </label>
                  <input
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                    list="category-options"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-aura-primary focus:border-transparent outline-none"
                    placeholder="Select or type..."
                  />
                  <datalist id="category-options">
                    {categories.map((cat) => (
                      <option key={cat} value={cat} />
                    ))}
                  </datalist>
                </div>
                <Input
                  label="Image URL"
                  value={form.image_url}
                  onChange={(e) => setForm({ ...form, image_url: e.target.value })}
                  placeholder="https://..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Shelf Life (months)"
                  type="number"
                  value={form.shelf_life_months}
                  onChange={(e) => setForm({ ...form, shelf_life_months: e.target.value })}
                  placeholder="e.g., 24"
                />
                <Input
                  label="Weight (oz)"
                  type="number"
                  step="0.1"
                  value={form.weight_oz}
                  onChange={(e) => setForm({ ...form, weight_oz: e.target.value })}
                  placeholder="e.g., 8.5"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Ingredients
                </label>
                <textarea
                  value={form.ingredients}
                  onChange={(e) => setForm({ ...form, ingredients: e.target.value })}
                  rows={2}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-aura-primary focus:border-transparent outline-none resize-none"
                  placeholder="Comma-separated ingredients list"
                />
              </div>

              <Input
                label="Tags"
                value={form.tags}
                onChange={(e) => setForm({ ...form, tags: e.target.value })}
                placeholder="Comma-separated tags (e.g., gluten-free, organic)"
                helperText="Separate tags with commas"
              />

              <div className="flex items-center gap-6 pt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.is_bunker_safe}
                    onChange={(e) => setForm({ ...form, is_bunker_safe: e.target.checked })}
                    className="w-4 h-4 text-aura-primary border-gray-300 rounded focus:ring-aura-primary"
                  />
                  <span className="text-sm font-medium text-gray-700">Bunker Safe</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.is_active}
                    onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
                    className="w-4 h-4 text-aura-primary border-gray-300 rounded focus:ring-aura-primary"
                  />
                  <span className="text-sm font-medium text-gray-700">Active</span>
                </label>
              </div>
            </div>

            <div className="sticky bottom-0 bg-white border-t px-6 py-4 flex justify-end gap-3 rounded-b-xl">
              <Button variant="outline" onClick={() => setShowModal(false)}>
                {t("common.cancel")}
              </Button>
              <Button onClick={handleSave} isLoading={isSaving}>
                {editingProduct ? t("admin.saveChanges") : t("admin.createProduct")}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
