"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/hooks";
import { Card, Button, Input } from "@/components/ui";
import {
  Package,
  Search,
  Loader2,
  ArrowLeft,
  AlertTriangle,
  TrendingDown,
  RefreshCcw,
  Plus,
  History,
  Warehouse,
  Check,
  X,
} from "lucide-react";
import type { Product } from "@/types";

interface InventoryItem {
  id: string;
  product_id: string;
  warehouse_location: string;
  quantity: number;
  reserved_quantity: number;
  safety_stock: number;
  reorder_point: number;
  reorder_quantity: number;
  last_restock_date: string | null;
  aura_products: Product;
}

export default function AdminInventoryPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialFilter = searchParams.get("filter") || "all";

  const { profile, isLoading: authLoading, isAuthenticated } = useAuth();
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState(initialFilter);
  const [restockModal, setRestockModal] = useState<InventoryItem | null>(null);
  const [restockQuantity, setRestockQuantity] = useState("");
  const [isRestocking, setIsRestocking] = useState(false);

  const supabase = createClient();

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/auth/login?redirectTo=/admin/inventory");
      return;
    }

    if (!authLoading && profile?.role !== "admin") {
      router.push("/");
      return;
    }
  }, [authLoading, isAuthenticated, profile, router]);

  useEffect(() => {
    const fetchInventory = async () => {
      if (!profile || profile.role !== "admin") return;

      setIsLoading(true);

      const { data, error } = await supabase
        .from("inventory")
        .select(`
          *,
          aura_products(*)
        `)
        .order("quantity", { ascending: true });

      if (!error && data) {
        setInventory(data);
      }

      setIsLoading(false);
    };

    fetchInventory();
  }, [profile, supabase]);

  const handleRestock = async () => {
    if (!restockModal || !restockQuantity) return;

    setIsRestocking(true);

    try {
      const response = await fetch("/api/inventory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: restockModal.product_id,
          quantity: parseInt(restockQuantity),
          warehouse: restockModal.warehouse_location,
          notes: `Manual restock via admin panel`,
        }),
      });

      if (response.ok) {
        // Update local state
        setInventory((prev) =>
          prev.map((item) =>
            item.id === restockModal.id
              ? {
                  ...item,
                  quantity: item.quantity + parseInt(restockQuantity),
                  last_restock_date: new Date().toISOString(),
                }
              : item
          )
        );
        setRestockModal(null);
        setRestockQuantity("");
      }
    } catch (error) {
      console.error("Restock failed:", error);
    }

    setIsRestocking(false);
  };

  const filteredInventory = inventory.filter((item) => {
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matches =
        item.aura_products?.name.toLowerCase().includes(query) ||
        item.aura_products?.sku.toLowerCase().includes(query);
      if (!matches) return false;
    }

    // Status filter
    if (filter === "low-stock") {
      return item.quantity <= item.reorder_point;
    }
    if (filter === "out-of-stock") {
      return item.quantity === 0;
    }
    if (filter === "healthy") {
      return item.quantity > item.reorder_point;
    }

    return true;
  });

  const stats = {
    total: inventory.length,
    lowStock: inventory.filter((i) => i.quantity <= i.reorder_point && i.quantity > 0).length,
    outOfStock: inventory.filter((i) => i.quantity === 0).length,
    healthy: inventory.filter((i) => i.quantity > i.reorder_point).length,
    totalUnits: inventory.reduce((sum, i) => sum + i.quantity, 0),
  };

  const getStockStatus = (item: InventoryItem) => {
    if (item.quantity === 0) {
      return { label: "Out of Stock", color: "bg-red-100 text-red-700", icon: X };
    }
    if (item.quantity <= item.safety_stock) {
      return { label: "Critical", color: "bg-red-100 text-red-700", icon: AlertTriangle };
    }
    if (item.quantity <= item.reorder_point) {
      return { label: "Low Stock", color: "bg-amber-100 text-amber-700", icon: TrendingDown };
    }
    return { label: "In Stock", color: "bg-green-100 text-green-700", icon: Check };
  };

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
            <h1 className="text-3xl font-bold text-gray-900">Inventory</h1>
            <p className="text-gray-600">Monitor and manage stock levels</p>
          </div>
          <div className="flex gap-3">
            <Button variant="secondary" leftIcon={<History className="w-5 h-5" />}>
              View History
            </Button>
            <Button leftIcon={<RefreshCcw className="w-5 h-5" />}>
              Sync Inventory
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-5 gap-4 mb-6">
          <Card padding="md">
            <div className="flex items-center gap-3">
              <Warehouse className="w-8 h-8 text-gray-400" />
              <div>
                <p className="text-sm text-gray-500">Total SKUs</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
            </div>
          </Card>
          <Card padding="md">
            <div className="flex items-center gap-3">
              <Package className="w-8 h-8 text-blue-500" />
              <div>
                <p className="text-sm text-gray-500">Total Units</p>
                <p className="text-2xl font-bold">{stats.totalUnits.toLocaleString()}</p>
              </div>
            </div>
          </Card>
          <Card padding="md" className={stats.outOfStock > 0 ? "border-red-200 bg-red-50" : ""}>
            <div className="flex items-center gap-3">
              <X className={`w-8 h-8 ${stats.outOfStock > 0 ? "text-red-500" : "text-gray-400"}`} />
              <div>
                <p className="text-sm text-gray-500">Out of Stock</p>
                <p className={`text-2xl font-bold ${stats.outOfStock > 0 ? "text-red-600" : ""}`}>
                  {stats.outOfStock}
                </p>
              </div>
            </div>
          </Card>
          <Card padding="md" className={stats.lowStock > 0 ? "border-amber-200 bg-amber-50" : ""}>
            <div className="flex items-center gap-3">
              <AlertTriangle className={`w-8 h-8 ${stats.lowStock > 0 ? "text-amber-500" : "text-gray-400"}`} />
              <div>
                <p className="text-sm text-gray-500">Low Stock</p>
                <p className={`text-2xl font-bold ${stats.lowStock > 0 ? "text-amber-600" : ""}`}>
                  {stats.lowStock}
                </p>
              </div>
            </div>
          </Card>
          <Card padding="md">
            <div className="flex items-center gap-3">
              <Check className="w-8 h-8 text-green-500" />
              <div>
                <p className="text-sm text-gray-500">Healthy</p>
                <p className="text-2xl font-bold text-green-600">{stats.healthy}</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Filters */}
        <Card padding="md" className="mb-6">
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex-1 min-w-64">
              <Input
                placeholder="Search by product name or SKU..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                leftIcon={<Search className="w-5 h-5" />}
              />
            </div>
            <div className="flex gap-1">
              {[
                { value: "all", label: "All" },
                { value: "out-of-stock", label: "Out of Stock" },
                { value: "low-stock", label: "Low Stock" },
                { value: "healthy", label: "Healthy" },
              ].map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setFilter(opt.value)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    filter === opt.value
                      ? "bg-aura-primary text-white"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </Card>

        {/* Inventory Table */}
        <Card padding="none">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left py-4 px-6 font-medium text-gray-500">Product</th>
                  <th className="text-left py-4 px-6 font-medium text-gray-500">SKU</th>
                  <th className="text-right py-4 px-6 font-medium text-gray-500">Quantity</th>
                  <th className="text-right py-4 px-6 font-medium text-gray-500">Reserved</th>
                  <th className="text-right py-4 px-6 font-medium text-gray-500">Available</th>
                  <th className="text-right py-4 px-6 font-medium text-gray-500">Reorder Point</th>
                  <th className="text-center py-4 px-6 font-medium text-gray-500">Status</th>
                  <th className="text-right py-4 px-6 font-medium text-gray-500">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredInventory.map((item) => {
                  const status = getStockStatus(item);
                  const available = item.quantity - item.reserved_quantity;
                  const StatusIcon = status.icon;

                  return (
                    <tr key={item.id} className="border-b hover:bg-gray-50">
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gray-100 rounded-lg overflow-hidden">
                            {item.aura_products?.image_url ? (
                              <img
                                src={item.aura_products.image_url}
                                alt={item.aura_products.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <Package className="w-5 h-5 text-gray-400" />
                              </div>
                            )}
                          </div>
                          <span className="font-medium">{item.aura_products?.name}</span>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <span className="font-mono text-sm">{item.aura_products?.sku}</span>
                      </td>
                      <td className="py-4 px-6 text-right font-medium">
                        {item.quantity.toLocaleString()}
                      </td>
                      <td className="py-4 px-6 text-right text-gray-500">
                        {item.reserved_quantity}
                      </td>
                      <td className="py-4 px-6 text-right font-medium">
                        <span className={available <= 0 ? "text-red-600" : ""}>
                          {available.toLocaleString()}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-right text-gray-500">
                        {item.reorder_point}
                      </td>
                      <td className="py-4 px-6 text-center">
                        <span
                          className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${status.color}`}
                        >
                          <StatusIcon className="w-4 h-4" />
                          {status.label}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setRestockModal(item)}
                          leftIcon={<Plus className="w-4 h-4" />}
                        >
                          Restock
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {filteredInventory.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              <Package className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No inventory items found</p>
            </div>
          )}
        </Card>
      </main>

      {/* Restock Modal */}
      {restockModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card padding="lg" className="w-full max-w-md">
            <h3 className="text-xl font-semibold mb-4">Restock Product</h3>
            <div className="mb-4">
              <p className="font-medium">{restockModal.aura_products?.name}</p>
              <p className="text-sm text-gray-500">
                Current stock: {restockModal.quantity} units
              </p>
              <p className="text-sm text-gray-500">
                Suggested reorder: {restockModal.reorder_quantity} units
              </p>
            </div>
            <div className="mb-6">
              <label className="block text-sm font-medium mb-2">
                Quantity to Add
              </label>
              <Input
                type="number"
                placeholder="Enter quantity"
                value={restockQuantity}
                onChange={(e) => setRestockQuantity(e.target.value)}
                min={1}
              />
            </div>
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => {
                  setRestockModal(null);
                  setRestockQuantity("");
                }}
              >
                Cancel
              </Button>
              <Button
                className="flex-1"
                onClick={handleRestock}
                isLoading={isRestocking}
                disabled={!restockQuantity || parseInt(restockQuantity) <= 0}
              >
                Restock
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
