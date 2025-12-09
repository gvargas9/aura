"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/hooks";
import { Card, Button, Input } from "@/components/ui";
import { formatCurrency } from "@/lib/utils";
import {
  Package,
  Plus,
  Search,
  Edit2,
  Trash2,
  Loader2,
  ArrowLeft,
  Eye,
  EyeOff,
  AlertTriangle,
  Check,
  X,
} from "lucide-react";
import type { Product } from "@/types";

export default function AdminProductsPage() {
  const router = useRouter();
  const { profile, isLoading: authLoading, isAuthenticated } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [showInactive, setShowInactive] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const supabase = createClient();

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/auth/login?redirectTo=/admin/products");
      return;
    }

    if (!authLoading && profile?.role !== "admin") {
      router.push("/");
      return;
    }
  }, [authLoading, isAuthenticated, profile, router]);

  useEffect(() => {
    const fetchProducts = async () => {
      if (!profile || profile.role !== "admin") return;

      setIsLoading(true);

      let query = supabase
        .from("aura_products")
        .select("*")
        .order("sort_order", { ascending: true });

      if (!showInactive) {
        query = query.eq("is_active", true);
      }

      const { data, error } = await query;

      if (!error && data) {
        setProducts(data);
      }

      setIsLoading(false);
    };

    fetchProducts();
  }, [profile, showInactive, supabase]);

  const handleToggleActive = async (product: Product) => {
    const { error } = await supabase
      .from("aura_products")
      .update({ is_active: !product.is_active })
      .eq("id", product.id);

    if (!error) {
      setProducts((prev) =>
        prev.map((p) =>
          p.id === product.id ? { ...p, is_active: !p.is_active } : p
        )
      );
    }
  };

  const handleDelete = async (productId: string) => {
    const { error } = await supabase
      .from("aura_products")
      .delete()
      .eq("id", productId);

    if (!error) {
      setProducts((prev) => prev.filter((p) => p.id !== productId));
    }
    setDeleteConfirm(null);
  };

  const categories = [...new Set(products.map((p) => p.category))];

  const filteredProducts = products.filter((product) => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matches =
        product.name.toLowerCase().includes(query) ||
        product.sku.toLowerCase().includes(query) ||
        product.description?.toLowerCase().includes(query);
      if (!matches) return false;
    }
    if (categoryFilter !== "all" && product.category !== categoryFilter) {
      return false;
    }
    return true;
  });

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-8 h-8 animate-spin text-aura-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Admin Header */}
      <header className="bg-aura-dark text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/" className="text-2xl font-bold text-aura-primary">
                Aura
              </Link>
              <span className="px-2 py-0.5 bg-aura-primary/20 text-aura-primary text-xs rounded">
                Admin
              </span>
            </div>
            <Link href="/admin" className="text-sm text-gray-400 hover:text-white">
              Dashboard
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <Link
              href="/admin"
              className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-2"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Link>
            <h1 className="text-3xl font-bold text-gray-900">Products</h1>
            <p className="text-gray-600">Manage your product catalog</p>
          </div>
          <Button leftIcon={<Plus className="w-5 h-5" />}>
            Add Product
          </Button>
        </div>

        {/* Filters */}
        <Card padding="md" className="mb-6">
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex-1 min-w-64">
              <Input
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                leftIcon={<Search className="w-5 h-5" />}
              />
            </div>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-4 py-2 border rounded-lg bg-white"
            >
              <option value="all">All Categories</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={showInactive}
                onChange={(e) => setShowInactive(e.target.checked)}
                className="rounded"
              />
              <span className="text-sm">Show inactive</span>
            </label>
          </div>
        </Card>

        {/* Products Table */}
        <Card padding="none">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left py-4 px-6 font-medium text-gray-500">
                    Product
                  </th>
                  <th className="text-left py-4 px-6 font-medium text-gray-500">
                    SKU
                  </th>
                  <th className="text-left py-4 px-6 font-medium text-gray-500">
                    Category
                  </th>
                  <th className="text-right py-4 px-6 font-medium text-gray-500">
                    Price
                  </th>
                  <th className="text-right py-4 px-6 font-medium text-gray-500">
                    Stock
                  </th>
                  <th className="text-center py-4 px-6 font-medium text-gray-500">
                    Status
                  </th>
                  <th className="text-right py-4 px-6 font-medium text-gray-500">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map((product) => (
                  <tr key={product.id} className="border-b hover:bg-gray-50">
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-gray-100 rounded-lg overflow-hidden">
                          {product.image_url ? (
                            <img
                              src={product.image_url}
                              alt={product.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Package className="w-6 h-6 text-gray-400" />
                            </div>
                          )}
                        </div>
                        <div>
                          <p className="font-medium">{product.name}</p>
                          <p className="text-sm text-gray-500 truncate max-w-xs">
                            {product.short_description}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <span className="font-mono text-sm">{product.sku}</span>
                    </td>
                    <td className="py-4 px-6">
                      <span className="px-2 py-1 bg-gray-100 rounded text-sm capitalize">
                        {product.category}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <div>
                        <p className="font-medium">
                          {formatCurrency(product.price)}
                        </p>
                        {product.compare_at_price && (
                          <p className="text-sm text-gray-400 line-through">
                            {formatCurrency(product.compare_at_price)}
                          </p>
                        )}
                      </div>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <span
                        className={`font-medium ${
                          product.stock_level < 100
                            ? "text-red-600"
                            : product.stock_level < 200
                            ? "text-amber-600"
                            : "text-green-600"
                        }`}
                      >
                        {product.stock_level}
                      </span>
                      {product.stock_level < 100 && (
                        <AlertTriangle className="w-4 h-4 inline ml-1 text-red-500" />
                      )}
                    </td>
                    <td className="py-4 px-6 text-center">
                      <button
                        onClick={() => handleToggleActive(product)}
                        className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                          product.is_active
                            ? "bg-green-100 text-green-700 hover:bg-green-200"
                            : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                        }`}
                      >
                        {product.is_active ? (
                          <>
                            <Eye className="w-4 h-4" />
                            Active
                          </>
                        ) : (
                          <>
                            <EyeOff className="w-4 h-4" />
                            Hidden
                          </>
                        )}
                      </button>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center justify-end gap-2">
                        <Button variant="ghost" size="sm">
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        {deleteConfirm === product.id ? (
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(product.id)}
                              className="text-red-600"
                            >
                              <Check className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setDeleteConfirm(null)}
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                        ) : (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setDeleteConfirm(product.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredProducts.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              <Package className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No products found</p>
            </div>
          )}
        </Card>

        {/* Summary */}
        <div className="mt-6 text-sm text-gray-500">
          Showing {filteredProducts.length} of {products.length} products
        </div>
      </main>
    </div>
  );
}
