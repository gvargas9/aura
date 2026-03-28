"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/hooks";
import { Card, Button, Input } from "@/components/ui";
import {
  Search,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Warehouse,
  AlertTriangle,
  Package,
  AlertCircle,
  Check,
  Save,
} from "lucide-react";

interface InventoryRow {
  id: string;
  product_id: string;
  warehouse_location: string;
  quantity: number;
  reserved_quantity: number;
  safety_stock: number;
  reorder_point: number;
  last_restock_date: string | null;
  created_at: string;
  updated_at: string;
  product_name: string;
  product_sku: string;
  product_image_url: string | null;
}

const PAGE_SIZE = 20;

export default function AdminInventoryPage() {
  const { profile } = useAuth();
  const supabase = createClient();

  const [inventory, setInventory] = useState<InventoryRow[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [lowStockOnly, setLowStockOnly] = useState(false);

  // Summary stats
  const [totalSkus, setTotalSkus] = useState(0);
  const [totalUnits, setTotalUnits] = useState(0);
  const [lowStockCount, setLowStockCount] = useState(0);
  const [outOfStockCount, setOutOfStockCount] = useState(0);

  // Inline editing
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editQuantity, setEditQuantity] = useState("");
  const [editSafetyStock, setEditSafetyStock] = useState("");
  const [editReorderPoint, setEditReorderPoint] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  const fetchInventory = useCallback(async () => {
    if (!profile || profile.role !== "admin") return;
    setIsLoading(true);

    // Fetch inventory with product join
    const { data: rawData, error: fetchError } = await supabase
      .from("inventory")
      .select("*, aura_products(name, sku, image_url)");

    if (fetchError) {
      console.error("Error fetching inventory:", fetchError);
      setInventory([]);
      setTotalCount(0);
      setIsLoading(false);
      return;
    }

    // Transform joined data
    let items: InventoryRow[] = (rawData || []).map((row: Record<string, unknown>) => {
      const product = row.aura_products as { name: string; sku: string; image_url: string | null } | null;
      return {
        id: row.id as string,
        product_id: row.product_id as string,
        warehouse_location: row.warehouse_location as string,
        quantity: row.quantity as number,
        reserved_quantity: row.reserved_quantity as number,
        safety_stock: row.safety_stock as number,
        reorder_point: row.reorder_point as number,
        last_restock_date: row.last_restock_date as string | null,
        created_at: row.created_at as string,
        updated_at: row.updated_at as string,
        product_name: product?.name || "Unknown Product",
        product_sku: product?.sku || "N/A",
        product_image_url: product?.image_url || null,
      };
    });

    // Compute summary stats from full dataset
    setTotalSkus(items.length);
    setTotalUnits(items.reduce((sum, i) => sum + i.quantity, 0));
    setLowStockCount(items.filter((i) => i.quantity < i.reorder_point && i.quantity > 0).length);
    setOutOfStockCount(items.filter((i) => i.quantity === 0).length);

    // Apply filters
    if (search) {
      const s = search.toLowerCase();
      items = items.filter(
        (i) =>
          i.product_name.toLowerCase().includes(s) ||
          i.product_sku.toLowerCase().includes(s) ||
          i.warehouse_location.toLowerCase().includes(s)
      );
    }

    if (lowStockOnly) {
      items = items.filter((i) => i.quantity < i.reorder_point);
    }

    // Sort: out of stock first, then low stock, then by name
    items.sort((a, b) => {
      const aStatus = a.quantity === 0 ? 0 : a.quantity < a.safety_stock ? 1 : a.quantity < a.reorder_point ? 2 : 3;
      const bStatus = b.quantity === 0 ? 0 : b.quantity < b.safety_stock ? 1 : b.quantity < b.reorder_point ? 2 : 3;
      if (aStatus !== bStatus) return aStatus - bStatus;
      return a.product_name.localeCompare(b.product_name);
    });

    setTotalCount(items.length);

    // Paginate
    const from = (page - 1) * PAGE_SIZE;
    const to = from + PAGE_SIZE;
    setInventory(items.slice(from, to));
    setIsLoading(false);
  }, [profile, supabase, search, lowStockOnly, page]);

  useEffect(() => {
    fetchInventory();
  }, [fetchInventory]);

  useEffect(() => {
    setPage(1);
  }, [search, lowStockOnly]);

  // Read URL params
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("filter") === "low-stock") {
      setLowStockOnly(true);
    }
  }, []);

  const startEdit = (item: InventoryRow) => {
    setEditingId(item.id);
    setEditQuantity(String(item.quantity));
    setEditSafetyStock(String(item.safety_stock));
    setEditReorderPoint(String(item.reorder_point));
  };

  const cancelEdit = () => {
    setEditingId(null);
  };

  const saveEdit = async (itemId: string) => {
    setIsSaving(true);
    const { error: updateError } = await supabase
      .from("inventory")
      .update({
        quantity: parseInt(editQuantity) || 0,
        safety_stock: parseInt(editSafetyStock) || 0,
        reorder_point: parseInt(editReorderPoint) || 0,
      })
      .eq("id", itemId);

    if (updateError) {
      alert("Failed to update: " + updateError.message);
    } else {
      setEditingId(null);
      fetchInventory();
    }
    setIsSaving(false);
  };

  const getStatusIndicator = (item: InventoryRow) => {
    if (item.quantity === 0) {
      return { color: "text-red-600 bg-red-100", label: "Out of Stock", icon: AlertCircle };
    }
    if (item.quantity < item.safety_stock) {
      return { color: "text-red-600 bg-red-50", label: "Critical", icon: AlertTriangle };
    }
    if (item.quantity < item.reorder_point) {
      return { color: "text-amber-600 bg-amber-50", label: "Low Stock", icon: AlertTriangle };
    }
    return { color: "text-green-600 bg-green-50", label: "In Stock", icon: Check };
  };

  return (
    <>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Inventory</h1>
        <p className="text-gray-600">Track and manage warehouse stock levels</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card padding="md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total SKUs</p>
              <p className="text-2xl font-bold mt-1">{totalSkus}</p>
            </div>
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Package className="w-5 h-5 text-blue-600" />
            </div>
          </div>
        </Card>
        <Card padding="md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Units</p>
              <p className="text-2xl font-bold mt-1">{totalUnits.toLocaleString()}</p>
            </div>
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <Warehouse className="w-5 h-5 text-green-600" />
            </div>
          </div>
        </Card>
        <Card padding="md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Low Stock</p>
              <p className="text-2xl font-bold mt-1 text-amber-600">{lowStockCount}</p>
            </div>
            <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-amber-600" />
            </div>
          </div>
        </Card>
        <Card padding="md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Out of Stock</p>
              <p className="text-2xl font-bold mt-1 text-red-600">{outOfStockCount}</p>
            </div>
            <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
              <AlertCircle className="w-5 h-5 text-red-600" />
            </div>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <Card padding="md" className="mb-6">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
          <div className="flex-1">
            <Input
              placeholder="Search by product name, SKU, or location..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              leftIcon={<Search className="w-4 h-4" />}
            />
          </div>
          <label className="flex items-center gap-2 cursor-pointer whitespace-nowrap">
            <input
              type="checkbox"
              checked={lowStockOnly}
              onChange={(e) => setLowStockOnly(e.target.checked)}
              className="w-4 h-4 text-aura-primary border-gray-300 rounded focus:ring-aura-primary"
            />
            <span className="text-sm font-medium text-gray-700">Low Stock Only</span>
          </label>
        </div>
      </Card>

      {/* Inventory Table */}
      <Card padding="none">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-6 h-6 animate-spin text-aura-primary" />
          </div>
        ) : inventory.length === 0 ? (
          <div className="text-center py-20 text-gray-500">
            <Warehouse className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p className="font-medium">No inventory records found</p>
            <p className="text-sm mt-1">Try adjusting your search or filters.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b">
                  <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Product
                  </th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    SKU
                  </th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Location
                  </th>
                  <th className="text-right py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Quantity
                  </th>
                  <th className="text-right py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Reserved
                  </th>
                  <th className="text-right py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Available
                  </th>
                  <th className="text-right py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Safety Stock
                  </th>
                  <th className="text-right py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Reorder Pt.
                  </th>
                  <th className="text-center py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="text-right py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {inventory.map((item) => {
                  const status = getStatusIndicator(item);
                  const available = item.quantity - item.reserved_quantity;
                  const isEditing = editingId === item.id;

                  return (
                    <tr
                      key={item.id}
                      className={`hover:bg-gray-50 transition-colors ${
                        item.quantity < item.safety_stock ? "bg-red-50/30" : ""
                      }`}
                    >
                      <td className="py-3 px-4">
                        <span className="text-sm font-medium text-gray-900">
                          {item.product_name}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-500 font-mono">
                        {item.product_sku}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600">
                        {item.warehouse_location}
                      </td>
                      <td className="py-3 px-4 text-right">
                        {isEditing ? (
                          <input
                            type="number"
                            value={editQuantity}
                            onChange={(e) => setEditQuantity(e.target.value)}
                            className="w-20 px-2 py-1 border border-gray-300 rounded text-sm text-right focus:ring-2 focus:ring-aura-primary focus:border-transparent outline-none"
                          />
                        ) : (
                          <span
                            className={`text-sm font-medium ${
                              item.quantity === 0
                                ? "text-red-600"
                                : item.quantity < item.safety_stock
                                ? "text-red-600"
                                : item.quantity < item.reorder_point
                                ? "text-amber-600"
                                : "text-gray-900"
                            }`}
                          >
                            {item.quantity}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right text-sm text-gray-500">
                        {item.reserved_quantity}
                      </td>
                      <td className="py-3 px-4 text-right text-sm font-medium">
                        {available}
                      </td>
                      <td className="py-3 px-4 text-right">
                        {isEditing ? (
                          <input
                            type="number"
                            value={editSafetyStock}
                            onChange={(e) => setEditSafetyStock(e.target.value)}
                            className="w-20 px-2 py-1 border border-gray-300 rounded text-sm text-right focus:ring-2 focus:ring-aura-primary focus:border-transparent outline-none"
                          />
                        ) : (
                          <span className="text-sm text-gray-500">{item.safety_stock}</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right">
                        {isEditing ? (
                          <input
                            type="number"
                            value={editReorderPoint}
                            onChange={(e) => setEditReorderPoint(e.target.value)}
                            className="w-20 px-2 py-1 border border-gray-300 rounded text-sm text-right focus:ring-2 focus:ring-aura-primary focus:border-transparent outline-none"
                          />
                        ) : (
                          <span className="text-sm text-gray-500">{item.reorder_point}</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${status.color}`}
                        >
                          <status.icon className="w-3 h-3" />
                          {status.label}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        {isEditing ? (
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => saveEdit(item.id)}
                              disabled={isSaving}
                              className="p-1.5 text-green-600 hover:bg-green-50 rounded transition-colors disabled:opacity-50"
                              aria-label="Save"
                            >
                              {isSaving ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <Save className="w-4 h-4" />
                              )}
                            </button>
                            <button
                              onClick={cancelEdit}
                              className="p-1.5 text-gray-400 hover:bg-gray-100 rounded transition-colors"
                              aria-label="Cancel"
                            >
                              <span className="text-xs font-medium">Cancel</span>
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => startEdit(item)}
                            className="text-xs text-aura-primary hover:underline font-medium"
                          >
                            Edit
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t">
            <p className="text-sm text-gray-500">
              Showing {(page - 1) * PAGE_SIZE + 1} to{" "}
              {Math.min(page * PAGE_SIZE, totalCount)} of {totalCount} items
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
    </>
  );
}
