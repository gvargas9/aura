"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { AdminLayout } from "@/components/admin";
import {
  Button,
  Input,
  Card,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  Badge,
  Modal,
  Select,
  Textarea,
  Pagination,
  EmptyState,
} from "@/components/ui";
import { formatCurrency } from "@/lib/utils";
import type { Product } from "@/types";
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  Package,
  Loader2,
  Upload,
  X,
  Filter,
} from "lucide-react";
import Image from "next/image";

const categories = [
  { value: "main", label: "Main Dishes" },
  { value: "vegan", label: "Vegan" },
  { value: "snacks", label: "Snacks" },
  { value: "desserts", label: "Desserts" },
  { value: "drinks", label: "Drinks" },
  { value: "breakfast", label: "Breakfast" },
];

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalProducts, setTotalProducts] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const pageSize = 10;
  const supabase = createClient();

  const [formData, setFormData] = useState({
    name: "",
    sku: "",
    description: "",
    short_description: "",
    price: "",
    compare_at_price: "",
    category: "main",
    stock_level: "100",
    is_bunker_safe: false,
    is_active: true,
    shelf_life_months: "24",
    weight_oz: "",
    image_url: "",
    ingredients: "",
    tags: "",
  });

  const fetchProducts = async () => {
    setIsLoading(true);
    let query = supabase
      .from("aura_products")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false });

    if (searchQuery) {
      query = query.or(`name.ilike.%${searchQuery}%,sku.ilike.%${searchQuery}%`);
    }
    if (categoryFilter) {
      query = query.eq("category", categoryFilter);
    }

    const from = (currentPage - 1) * pageSize;
    const to = from + pageSize - 1;
    query = query.range(from, to);

    const { data, count, error } = await query;

    if (!error && data) {
      setProducts(data);
      setTotalProducts(count || 0);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchProducts();
  }, [currentPage, searchQuery, categoryFilter]);

  const handleOpenModal = (product?: Product) => {
    if (product) {
      setEditingProduct(product);
      setFormData({
        name: product.name,
        sku: product.sku,
        description: product.description || "",
        short_description: product.short_description || "",
        price: String(product.price),
        compare_at_price: product.compare_at_price ? String(product.compare_at_price) : "",
        category: product.category,
        stock_level: String(product.stock_level),
        is_bunker_safe: product.is_bunker_safe,
        is_active: product.is_active,
        shelf_life_months: product.shelf_life_months ? String(product.shelf_life_months) : "",
        weight_oz: product.weight_oz ? String(product.weight_oz) : "",
        image_url: product.image_url || "",
        ingredients: product.ingredients || "",
        tags: product.tags?.join(", ") || "",
      });
    } else {
      setEditingProduct(null);
      setFormData({
        name: "",
        sku: "",
        description: "",
        short_description: "",
        price: "",
        compare_at_price: "",
        category: "main",
        stock_level: "100",
        is_bunker_safe: false,
        is_active: true,
        shelf_life_months: "24",
        weight_oz: "",
        image_url: "",
        ingredients: "",
        tags: "",
      });
    }
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    setIsSaving(true);
    const productData = {
      name: formData.name,
      sku: formData.sku,
      description: formData.description || null,
      short_description: formData.short_description || null,
      price: parseFloat(formData.price),
      compare_at_price: formData.compare_at_price ? parseFloat(formData.compare_at_price) : null,
      category: formData.category,
      stock_level: parseInt(formData.stock_level),
      is_bunker_safe: formData.is_bunker_safe,
      is_active: formData.is_active,
      shelf_life_months: formData.shelf_life_months ? parseInt(formData.shelf_life_months) : null,
      weight_oz: formData.weight_oz ? parseFloat(formData.weight_oz) : null,
      image_url: formData.image_url || null,
      ingredients: formData.ingredients || null,
      tags: formData.tags ? formData.tags.split(",").map((t) => t.trim()) : [],
    };

    if (editingProduct) {
      await supabase.from("aura_products").update(productData).eq("id", editingProduct.id);
    } else {
      await supabase.from("aura_products").insert(productData);
    }

    setIsSaving(false);
    setIsModalOpen(false);
    fetchProducts();
  };

  const handleDelete = async (id: string) => {
    await supabase.from("aura_products").delete().eq("id", id);
    setDeleteConfirm(null);
    fetchProducts();
  };

  const totalPages = Math.ceil(totalProducts / pageSize);

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Products</h1>
            <p className="text-gray-500">Manage your product catalog</p>
          </div>
          <Button leftIcon={<Plus className="w-4 h-4" />} onClick={() => handleOpenModal()}>
            Add Product
          </Button>
        </div>

        {/* Filters */}
        <Card padding="md">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Input
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                leftIcon={<Search className="w-5 h-5" />}
              />
            </div>
            <Select
              options={[{ value: "", label: "All Categories" }, ...categories]}
              value={categoryFilter}
              onChange={(v) => {
                setCategoryFilter(v);
                setCurrentPage(1);
              }}
              className="w-full sm:w-48"
            />
          </div>
        </Card>

        {/* Products Table */}
        <Card>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-aura-primary" />
            </div>
          ) : products.length === 0 ? (
            <EmptyState
              icon={Package}
              title="No products found"
              description="Add your first product to get started"
              actionLabel="Add Product"
              onAction={() => handleOpenModal()}
            />
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead>SKU</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Stock</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {products.map((product) => (
                    <TableRow key={product.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center overflow-hidden">
                            {product.image_url ? (
                              <Image
                                src={product.image_url}
                                alt={product.name}
                                width={48}
                                height={48}
                                className="object-cover"
                              />
                            ) : (
                              <Package className="w-6 h-6 text-gray-400" />
                            )}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{product.name}</p>
                            <p className="text-sm text-gray-500 line-clamp-1">
                              {product.short_description}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-sm">{product.sku}</TableCell>
                      <TableCell>
                        <Badge variant="default">{product.category}</Badge>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{formatCurrency(product.price)}</p>
                          {product.compare_at_price && (
                            <p className="text-sm text-gray-400 line-through">
                              {formatCurrency(product.compare_at_price)}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            product.stock_level > 50
                              ? "success"
                              : product.stock_level > 0
                              ? "warning"
                              : "error"
                          }
                        >
                          {product.stock_level}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={product.is_active ? "success" : "default"}>
                          {product.is_active ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleOpenModal(product)}
                            className="p-2 text-gray-500 hover:text-aura-primary hover:bg-gray-100 rounded-lg"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setDeleteConfirm(product.id)}
                            className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {totalPages > 1 && (
                <div className="p-4 border-t border-gray-100">
                  <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={setCurrentPage}
                  />
                </div>
              )}
            </>
          )}
        </Card>
      </div>

      {/* Add/Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingProduct ? "Edit Product" : "Add Product"}
        size="lg"
      >
        <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Product Name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., Premium Chicken Pasta"
              required
            />
            <Input
              label="SKU"
              value={formData.sku}
              onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
              placeholder="e.g., AURA-001"
              required
            />
          </div>

          <Textarea
            label="Description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Full product description..."
            rows={3}
          />

          <Input
            label="Short Description"
            value={formData.short_description}
            onChange={(e) => setFormData({ ...formData, short_description: e.target.value })}
            placeholder="Brief product summary"
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Price"
              type="number"
              step="0.01"
              value={formData.price}
              onChange={(e) => setFormData({ ...formData, price: e.target.value })}
              placeholder="0.00"
              required
            />
            <Input
              label="Compare at Price"
              type="number"
              step="0.01"
              value={formData.compare_at_price}
              onChange={(e) => setFormData({ ...formData, compare_at_price: e.target.value })}
              placeholder="0.00"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Category"
              options={categories}
              value={formData.category}
              onChange={(v) => setFormData({ ...formData, category: v })}
            />
            <Input
              label="Stock Level"
              type="number"
              value={formData.stock_level}
              onChange={(e) => setFormData({ ...formData, stock_level: e.target.value })}
              placeholder="0"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Shelf Life (months)"
              type="number"
              value={formData.shelf_life_months}
              onChange={(e) => setFormData({ ...formData, shelf_life_months: e.target.value })}
              placeholder="24"
            />
            <Input
              label="Weight (oz)"
              type="number"
              step="0.1"
              value={formData.weight_oz}
              onChange={(e) => setFormData({ ...formData, weight_oz: e.target.value })}
              placeholder="0.0"
            />
          </div>

          <Input
            label="Image URL"
            value={formData.image_url}
            onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
            placeholder="https://..."
          />

          <Textarea
            label="Ingredients"
            value={formData.ingredients}
            onChange={(e) => setFormData({ ...formData, ingredients: e.target.value })}
            placeholder="List ingredients..."
            rows={2}
          />

          <Input
            label="Tags (comma separated)"
            value={formData.tags}
            onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
            placeholder="organic, gluten-free, high-protein"
          />

          <div className="flex gap-6">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.is_bunker_safe}
                onChange={(e) => setFormData({ ...formData, is_bunker_safe: e.target.checked })}
                className="w-4 h-4 rounded border-gray-300 text-aura-primary focus:ring-aura-primary"
              />
              <span className="text-sm text-gray-700">Bunker Safe</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.is_active}
                onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                className="w-4 h-4 rounded border-gray-300 text-aura-primary focus:ring-aura-primary"
              />
              <span className="text-sm text-gray-700">Active</span>
            </label>
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-100">
          <Button variant="outline" onClick={() => setIsModalOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} isLoading={isSaving}>
            {editingProduct ? "Save Changes" : "Add Product"}
          </Button>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        title="Delete Product"
        size="sm"
      >
        <p className="text-gray-600 mb-6">
          Are you sure you want to delete this product? This action cannot be undone.
        </p>
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={() => setDeleteConfirm(null)}>
            Cancel
          </Button>
          <Button
            variant="primary"
            className="!bg-red-600 hover:!bg-red-700"
            onClick={() => deleteConfirm && handleDelete(deleteConfirm)}
          >
            Delete
          </Button>
        </div>
      </Modal>
    </AdminLayout>
  );
}
