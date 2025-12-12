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
  Pagination,
  EmptyState,
} from "@/components/ui";
import type { Inventory, Product } from "@/types";
import {
  Search,
  Edit2,
  Warehouse,
  Loader2,
  AlertTriangle,
  Package,
  Plus,
  TrendingDown,
  TrendingUp,
  RefreshCcw,
} from "lucide-react";
import Image from "next/image";

interface InventoryWithProduct extends Inventory {
  product?: Product;
}

export default function AdminInventoryPage() {
  const [inventory, setInventory] = useState<InventoryWithProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<string>("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [editingItem, setEditingItem] = useState<InventoryWithProduct | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const [formData, setFormData] = useState({
    quantity: "",
    reserved_quantity: "",
    safety_stock: "",
    reorder_point: "",
    warehouse_location: "",
  });

  const pageSize = 10;
  const supabase = createClient();

  const fetchInventory = async () => {
    setIsLoading(true);

    // Fetch all products first
    const { data: products } = await supabase
      .from("aura_products")
      .select("*")
      .eq("is_active", true);

    // Fetch inventory records
    let query = supabase
      .from("inventory")
      .select("*", { count: "exact" })
      .order("updated_at", { ascending: false });

    const from = (currentPage - 1) * pageSize;
    const to = from + pageSize - 1;
    query = query.range(from, to);

    const { data: inventoryData, count, error } = await query;

    if (!error && inventoryData && products) {
      // Merge inventory with product info
      const withProducts = inventoryData.map((inv) => ({
        ...inv,
        product: products.find((p) => p.id === inv.product_id),
      }));

      // Apply filters
      let filtered = withProducts;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        filtered = filtered.filter(
          (item) =>
            item.product?.name.toLowerCase().includes(q) ||
            item.product?.sku.toLowerCase().includes(q)
        );
      }
      if (filterType === "low") {
        filtered = filtered.filter((item) => item.quantity <= item.reorder_point);
      } else if (filterType === "out") {
        filtered = filtered.filter((item) => item.quantity === 0);
      }

      setInventory(filtered);
      setTotalItems(count || 0);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchInventory();
  }, [currentPage, searchQuery, filterType]);

  const handleEdit = (item: InventoryWithProduct) => {
    setEditingItem(item);
    setFormData({
      quantity: String(item.quantity),
      reserved_quantity: String(item.reserved_quantity),
      safety_stock: String(item.safety_stock),
      reorder_point: String(item.reorder_point),
      warehouse_location: item.warehouse_location,
    });
  };

  const handleSave = async () => {
    if (!editingItem) return;
    setIsSaving(true);

    await supabase
      .from("inventory")
      .update({
        quantity: parseInt(formData.quantity),
        reserved_quantity: parseInt(formData.reserved_quantity),
        safety_stock: parseInt(formData.safety_stock),
        reorder_point: parseInt(formData.reorder_point),
        warehouse_location: formData.warehouse_location,
      })
      .eq("id", editingItem.id);

    setIsSaving(false);
    setEditingItem(null);
    fetchInventory();
  };

  const totalPages = Math.ceil(totalItems / pageSize);

  // Calculate stats
  const lowStockCount = inventory.filter((i) => i.quantity <= i.reorder_point && i.quantity > 0).length;
  const outOfStockCount = inventory.filter((i) => i.quantity === 0).length;
  const totalValue = inventory.reduce((sum, i) => sum + i.quantity * (i.product?.price || 0), 0);

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Inventory</h1>
            <p className="text-gray-500">Monitor and manage stock levels</p>
          </div>
          <Button leftIcon={<RefreshCcw className="w-4 h-4" />} onClick={fetchInventory}>
            Refresh
          </Button>
        </div>

        {/* Alerts */}
        {(lowStockCount > 0 || outOfStockCount > 0) && (
          <div className="space-y-3">
            {outOfStockCount > 0 && (
              <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
                <AlertTriangle className="w-5 h-5 text-red-500" />
                <span className="text-red-800">
                  {outOfStockCount} product(s) are out of stock
                </span>
              </div>
            )}
            {lowStockCount > 0 && (
              <div className="flex items-center gap-3 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                <TrendingDown className="w-5 h-5 text-amber-500" />
                <span className="text-amber-800">
                  {lowStockCount} product(s) are running low on stock
                </span>
              </div>
            )}
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card padding="md">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Package className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{inventory.length}</p>
                <p className="text-sm text-gray-500">Total Products</p>
              </div>
            </div>
          </Card>
          <Card padding="md">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {inventory.reduce((sum, i) => sum + i.quantity, 0)}
                </p>
                <p className="text-sm text-gray-500">Total Units</p>
              </div>
            </div>
          </Card>
          <Card padding="md">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                <TrendingDown className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{lowStockCount}</p>
                <p className="text-sm text-gray-500">Low Stock</p>
              </div>
            </div>
          </Card>
          <Card padding="md">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{outOfStockCount}</p>
                <p className="text-sm text-gray-500">Out of Stock</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Filters */}
        <Card padding="md">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Input
                placeholder="Search by product name or SKU..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                leftIcon={<Search className="w-5 h-5" />}
              />
            </div>
            <Select
              options={[
                { value: "", label: "All Stock Levels" },
                { value: "low", label: "Low Stock" },
                { value: "out", label: "Out of Stock" },
              ]}
              value={filterType}
              onChange={(v) => {
                setFilterType(v);
                setCurrentPage(1);
              }}
              className="w-full sm:w-48"
            />
          </div>
        </Card>

        {/* Inventory Table */}
        <Card>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-aura-primary" />
            </div>
          ) : inventory.length === 0 ? (
            <EmptyState
              icon={Warehouse}
              title="No inventory records"
              description="Inventory will appear here once products are added"
            />
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead>SKU</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>In Stock</TableHead>
                    <TableHead>Reserved</TableHead>
                    <TableHead>Available</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {inventory.map((item) => {
                    const available = item.quantity - item.reserved_quantity;
                    const isLow = item.quantity <= item.reorder_point;
                    const isOut = item.quantity === 0;

                    return (
                      <TableRow key={item.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center overflow-hidden">
                              {item.product?.image_url ? (
                                <Image
                                  src={item.product.image_url}
                                  alt={item.product.name}
                                  width={40}
                                  height={40}
                                  className="object-cover"
                                />
                              ) : (
                                <Package className="w-5 h-5 text-gray-400" />
                              )}
                            </div>
                            <p className="font-medium">{item.product?.name || "Unknown"}</p>
                          </div>
                        </TableCell>
                        <TableCell className="font-mono text-sm">
                          {item.product?.sku || "-"}
                        </TableCell>
                        <TableCell>{item.warehouse_location}</TableCell>
                        <TableCell className="font-medium">{item.quantity}</TableCell>
                        <TableCell>{item.reserved_quantity}</TableCell>
                        <TableCell className="font-medium">{available}</TableCell>
                        <TableCell>
                          {isOut ? (
                            <Badge variant="error">Out of Stock</Badge>
                          ) : isLow ? (
                            <Badge variant="warning">Low Stock</Badge>
                          ) : (
                            <Badge variant="success">In Stock</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleEdit(item)}
                              className="p-2 text-gray-500 hover:text-aura-primary hover:bg-gray-100 rounded-lg"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
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

      {/* Edit Inventory Modal */}
      <Modal
        isOpen={!!editingItem}
        onClose={() => setEditingItem(null)}
        title="Update Inventory"
        size="md"
      >
        {editingItem && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
              <div className="w-12 h-12 rounded-lg bg-white flex items-center justify-center overflow-hidden">
                {editingItem.product?.image_url ? (
                  <Image
                    src={editingItem.product.image_url}
                    alt={editingItem.product.name}
                    width={48}
                    height={48}
                    className="object-cover"
                  />
                ) : (
                  <Package className="w-6 h-6 text-gray-400" />
                )}
              </div>
              <div>
                <p className="font-semibold">{editingItem.product?.name}</p>
                <p className="text-sm text-gray-500">{editingItem.product?.sku}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Quantity"
                type="number"
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
              />
              <Input
                label="Reserved"
                type="number"
                value={formData.reserved_quantity}
                onChange={(e) => setFormData({ ...formData, reserved_quantity: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Safety Stock"
                type="number"
                value={formData.safety_stock}
                onChange={(e) => setFormData({ ...formData, safety_stock: e.target.value })}
              />
              <Input
                label="Reorder Point"
                type="number"
                value={formData.reorder_point}
                onChange={(e) => setFormData({ ...formData, reorder_point: e.target.value })}
              />
            </div>

            <Input
              label="Warehouse Location"
              value={formData.warehouse_location}
              onChange={(e) => setFormData({ ...formData, warehouse_location: e.target.value })}
              placeholder="e.g., A1-B2"
            />

            <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
              <Button variant="outline" onClick={() => setEditingItem(null)}>
                Cancel
              </Button>
              <Button onClick={handleSave} isLoading={isSaving}>
                Save Changes
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </AdminLayout>
  );
}
