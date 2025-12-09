"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/hooks";
import { Card, Button, Input } from "@/components/ui";
import { formatCurrency, formatDate } from "@/lib/utils";
import {
  Package,
  Search,
  Loader2,
  ArrowLeft,
  Truck,
  CheckCircle,
  Clock,
  XCircle,
  ChevronRight,
  Filter,
  Download,
  Eye,
} from "lucide-react";
import type { Order } from "@/types";

interface OrderWithUser extends Order {
  profiles?: {
    email: string;
    full_name: string | null;
  };
}

export default function AdminOrdersPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialStatus = searchParams.get("status") || "all";

  const { profile, isLoading: authLoading, isAuthenticated } = useAuth();
  const [orders, setOrders] = useState<OrderWithUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState(initialStatus);
  const [selectedOrders, setSelectedOrders] = useState<string[]>([]);

  const supabase = createClient();

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/auth/login?redirectTo=/admin/orders");
      return;
    }

    if (!authLoading && profile?.role !== "admin") {
      router.push("/");
      return;
    }
  }, [authLoading, isAuthenticated, profile, router]);

  useEffect(() => {
    const fetchOrders = async () => {
      if (!profile || profile.role !== "admin") return;

      setIsLoading(true);

      let query = supabase
        .from("aura_orders")
        .select("*, profiles(email, full_name)")
        .order("created_at", { ascending: false });

      if (statusFilter !== "all") {
        query = query.eq("status", statusFilter);
      }

      const { data, error } = await query;

      if (!error && data) {
        setOrders(data);
      }

      setIsLoading(false);
    };

    fetchOrders();
  }, [profile, statusFilter, supabase]);

  const handleStatusUpdate = async (orderId: string, newStatus: string) => {
    const updates: Record<string, unknown> = {
      status: newStatus,
    };

    if (newStatus === "shipped") {
      updates.shipped_at = new Date().toISOString();
    } else if (newStatus === "delivered") {
      updates.delivered_at = new Date().toISOString();
    }

    const { error } = await supabase
      .from("aura_orders")
      .update(updates)
      .eq("id", orderId);

    if (!error) {
      setOrders((prev) =>
        prev.map((o) =>
          o.id === orderId ? { ...o, status: newStatus, ...updates } : o
        )
      );
    }
  };

  const handleBulkStatusUpdate = async (newStatus: string) => {
    for (const orderId of selectedOrders) {
      await handleStatusUpdate(orderId, newStatus);
    }
    setSelectedOrders([]);
  };

  const toggleSelectOrder = (orderId: string) => {
    setSelectedOrders((prev) =>
      prev.includes(orderId)
        ? prev.filter((id) => id !== orderId)
        : [...prev, orderId]
    );
  };

  const toggleSelectAll = () => {
    if (selectedOrders.length === filteredOrders.length) {
      setSelectedOrders([]);
    } else {
      setSelectedOrders(filteredOrders.map((o) => o.id));
    }
  };

  const filteredOrders = orders.filter((order) => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matches =
        order.order_number?.toLowerCase().includes(query) ||
        order.id.toLowerCase().includes(query) ||
        order.profiles?.email.toLowerCase().includes(query) ||
        order.profiles?.full_name?.toLowerCase().includes(query);
      if (!matches) return false;
    }
    return true;
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "delivered":
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case "shipped":
        return <Truck className="w-4 h-4 text-blue-500" />;
      case "processing":
        return <Clock className="w-4 h-4 text-amber-500" />;
      case "cancelled":
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Package className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "delivered":
        return "bg-green-100 text-green-700";
      case "shipped":
        return "bg-blue-100 text-blue-700";
      case "processing":
        return "bg-amber-100 text-amber-700";
      case "cancelled":
        return "bg-red-100 text-red-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const statusOptions = [
    { value: "all", label: "All Orders" },
    { value: "pending", label: "Pending" },
    { value: "processing", label: "Processing" },
    { value: "shipped", label: "Shipped" },
    { value: "delivered", label: "Delivered" },
    { value: "cancelled", label: "Cancelled" },
  ];

  const orderStats = {
    total: orders.length,
    pending: orders.filter((o) => o.status === "pending").length,
    processing: orders.filter((o) => o.status === "processing").length,
    shipped: orders.filter((o) => o.status === "shipped").length,
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
            <h1 className="text-3xl font-bold text-gray-900">Orders</h1>
            <p className="text-gray-600">Manage and fulfill customer orders</p>
          </div>
          <Button variant="secondary" leftIcon={<Download className="w-5 h-5" />}>
            Export Orders
          </Button>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <Card padding="md">
            <p className="text-sm text-gray-500">Total Orders</p>
            <p className="text-2xl font-bold">{orderStats.total}</p>
          </Card>
          <Card padding="md">
            <p className="text-sm text-gray-500">Pending</p>
            <p className="text-2xl font-bold text-gray-600">{orderStats.pending}</p>
          </Card>
          <Card padding="md">
            <p className="text-sm text-gray-500">Processing</p>
            <p className="text-2xl font-bold text-amber-600">{orderStats.processing}</p>
          </Card>
          <Card padding="md">
            <p className="text-sm text-gray-500">Shipped</p>
            <p className="text-2xl font-bold text-blue-600">{orderStats.shipped}</p>
          </Card>
        </div>

        {/* Filters */}
        <Card padding="md" className="mb-6">
          <div className="flex flex-wrap gap-4 items-center justify-between">
            <div className="flex gap-4 items-center">
              <div className="w-64">
                <Input
                  placeholder="Search orders..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  leftIcon={<Search className="w-5 h-5" />}
                />
              </div>
              <div className="flex gap-1">
                {statusOptions.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setStatusFilter(opt.value)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                      statusFilter === opt.value
                        ? "bg-aura-primary text-white"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {selectedOrders.length > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500">
                  {selectedOrders.length} selected
                </span>
                <select
                  onChange={(e) => {
                    if (e.target.value) {
                      handleBulkStatusUpdate(e.target.value);
                      e.target.value = "";
                    }
                  }}
                  className="px-3 py-1.5 border rounded-lg text-sm"
                  defaultValue=""
                >
                  <option value="" disabled>
                    Update status...
                  </option>
                  <option value="processing">Mark Processing</option>
                  <option value="shipped">Mark Shipped</option>
                  <option value="delivered">Mark Delivered</option>
                </select>
              </div>
            )}
          </div>
        </Card>

        {/* Orders Table */}
        <Card padding="none">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="py-4 px-6 text-left">
                    <input
                      type="checkbox"
                      checked={
                        selectedOrders.length === filteredOrders.length &&
                        filteredOrders.length > 0
                      }
                      onChange={toggleSelectAll}
                      className="rounded"
                    />
                  </th>
                  <th className="text-left py-4 px-6 font-medium text-gray-500">
                    Order
                  </th>
                  <th className="text-left py-4 px-6 font-medium text-gray-500">
                    Customer
                  </th>
                  <th className="text-left py-4 px-6 font-medium text-gray-500">
                    Date
                  </th>
                  <th className="text-center py-4 px-6 font-medium text-gray-500">
                    Status
                  </th>
                  <th className="text-right py-4 px-6 font-medium text-gray-500">
                    Total
                  </th>
                  <th className="text-right py-4 px-6 font-medium text-gray-500">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map((order) => (
                  <tr key={order.id} className="border-b hover:bg-gray-50">
                    <td className="py-4 px-6">
                      <input
                        type="checkbox"
                        checked={selectedOrders.includes(order.id)}
                        onChange={() => toggleSelectOrder(order.id)}
                        className="rounded"
                      />
                    </td>
                    <td className="py-4 px-6">
                      <p className="font-medium text-aura-primary">
                        {order.order_number || `#${order.id.slice(0, 8)}`}
                      </p>
                      <p className="text-xs text-gray-400">
                        {Array.isArray(order.items) ? order.items.length : 0} items
                      </p>
                    </td>
                    <td className="py-4 px-6">
                      <p className="font-medium">
                        {order.profiles?.full_name || "Guest"}
                      </p>
                      <p className="text-sm text-gray-500">
                        {order.profiles?.email}
                      </p>
                    </td>
                    <td className="py-4 px-6">
                      <p>{formatDate(order.created_at)}</p>
                      {order.tracking_number && (
                        <p className="text-xs text-gray-500">
                          Track: {order.tracking_number}
                        </p>
                      )}
                    </td>
                    <td className="py-4 px-6 text-center">
                      <span
                        className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(order.status)}`}
                      >
                        {getStatusIcon(order.status)}
                        {order.status}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right font-medium">
                      {formatCurrency(order.total)}
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center justify-end gap-2">
                        <select
                          value={order.status}
                          onChange={(e) =>
                            handleStatusUpdate(order.id, e.target.value)
                          }
                          className="px-2 py-1 border rounded text-sm"
                        >
                          <option value="pending">Pending</option>
                          <option value="processing">Processing</option>
                          <option value="shipped">Shipped</option>
                          <option value="delivered">Delivered</option>
                          <option value="cancelled">Cancelled</option>
                        </select>
                        <Link href={`/admin/orders/${order.id}`}>
                          <Button variant="ghost" size="sm">
                            <Eye className="w-4 h-4" />
                          </Button>
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredOrders.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              <Package className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No orders found</p>
            </div>
          )}
        </Card>

        {/* Summary */}
        <div className="mt-6 text-sm text-gray-500">
          Showing {filteredOrders.length} of {orders.length} orders
        </div>
      </main>
    </div>
  );
}
