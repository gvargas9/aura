"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/hooks";
import { Card, Button, Input } from "@/components/ui";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { OrderStatus } from "@/types/database";
import {
  Search,
  Loader2,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Package,
  Truck,
  Save,
  Filter,
} from "lucide-react";
import Link from "next/link";

interface OrderWithProfile {
  id: string;
  order_number: string | null;
  user_id: string;
  status: OrderStatus;
  subtotal: number;
  discount: number;
  shipping: number;
  tax: number;
  total: number;
  items: unknown;
  shipping_address: unknown;
  tracking_number: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  profiles: {
    full_name: string | null;
    email: string;
  } | null;
}

const STATUS_OPTIONS: OrderStatus[] = ["pending", "processing", "shipped", "delivered", "cancelled"];

const PAGE_SIZE = 20;

function statusBadgeClass(status: string): string {
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
}

export default function AdminOrdersPage() {
  const { profile } = useAuth();
  const supabase = createClient();

  const [orders, setOrders] = useState<OrderWithProfile[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");

  // Expanded order state
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editStatus, setEditStatus] = useState<OrderStatus | "">("");
  const [editTracking, setEditTracking] = useState("");
  const [editNotes, setEditNotes] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  const fetchOrders = useCallback(async () => {
    if (!profile || profile.role !== "admin") return;
    setIsLoading(true);

    const from = (page - 1) * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;

    let query = supabase
      .from("aura_orders")
      .select("*, profiles!aura_orders_user_id_fkey(full_name, email)", {
        count: "exact",
      });

    if (statusFilter) {
      query = query.eq("status", statusFilter as OrderStatus);
    }

    if (search) {
      query = query.or(
        `order_number.ilike.%${search}%`
      );
    }

    const { data, count, error: fetchError } = await query
      .order("created_at", { ascending: false })
      .range(from, to);

    if (fetchError) {
      console.error("Error fetching orders:", fetchError);
      // Fallback: try without the FK join hint
      const fallbackQuery = supabase
        .from("aura_orders")
        .select("*, profiles(full_name, email)", { count: "exact" });

      if (statusFilter) {
        fallbackQuery.eq("status", statusFilter as OrderStatus);
      }
      if (search) {
        fallbackQuery.or(`order_number.ilike.%${search}%`);
      }

      const { data: fbData, count: fbCount } = await fallbackQuery
        .order("created_at", { ascending: false })
        .range(from, to);

      setOrders((fbData as unknown as OrderWithProfile[]) || []);
      setTotalCount(fbCount || 0);
    } else {
      setOrders((data as unknown as OrderWithProfile[]) || []);
      setTotalCount(count || 0);
    }
    setIsLoading(false);
  }, [profile, supabase, page, statusFilter, search]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  useEffect(() => {
    setPage(1);
  }, [search, statusFilter]);

  // Read URL params for initial filters
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const s = params.get("status");
    if (s) setStatusFilter(s);
  }, []);

  const toggleExpand = (order: OrderWithProfile) => {
    if (expandedId === order.id) {
      setExpandedId(null);
    } else {
      setExpandedId(order.id);
      setEditStatus(order.status);
      setEditTracking(order.tracking_number || "");
      setEditNotes(order.notes || "");
    }
  };

  const handleUpdateOrder = async (orderId: string) => {
    setIsSaving(true);

    const updates: Record<string, unknown> = {};
    if (editStatus) updates.status = editStatus;
    if (editTracking) updates.tracking_number = editTracking;
    if (editNotes !== undefined) updates.notes = editNotes;

    const { error: updateError } = await supabase
      .from("aura_orders")
      .update(updates)
      .eq("id", orderId);

    if (updateError) {
      alert("Failed to update order: " + updateError.message);
    } else {
      fetchOrders();
    }
    setIsSaving(false);
  };

  const getItemsCount = (items: unknown): number => {
    if (Array.isArray(items)) return items.length;
    return 0;
  };

  const getCustomerName = (order: OrderWithProfile): string => {
    if (order.profiles?.full_name) return order.profiles.full_name;
    if (order.profiles?.email) return order.profiles.email;
    return "Unknown";
  };

  const getCustomerEmail = (order: OrderWithProfile): string => {
    return order.profiles?.email || "";
  };

  return (
    <>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Orders</h1>
        <p className="text-gray-600">Manage and track all customer orders</p>
      </div>

      {/* Filters */}
      <Card padding="md" className="mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <Input
              placeholder="Search by order number..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              leftIcon={<Search className="w-4 h-4" />}
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-aura-primary focus:border-transparent outline-none"
            aria-label="Filter by status"
          >
            <option value="">All Statuses</option>
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </option>
            ))}
          </select>
        </div>
      </Card>

      {/* Orders Table */}
      <Card padding="none">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-6 h-6 animate-spin text-aura-primary" />
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-20 text-gray-500">
            <Package className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p className="font-medium">No orders found</p>
            <p className="text-sm mt-1">Try adjusting your filters.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b">
                  <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Order
                  </th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="text-center py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="text-right py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Total
                  </th>
                  <th className="text-center py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Items
                  </th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="py-3 px-4 w-10"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {orders.map((order) => (
                  <>
                    <tr
                      key={order.id}
                      className="hover:bg-gray-50 transition-colors cursor-pointer"
                      onClick={() => toggleExpand(order)}
                    >
                      <td className="py-3 px-4">
                        <Link
                          href={`/admin/orders/${order.id}`}
                          className="font-medium text-aura-primary text-sm hover:underline"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {order.order_number || order.id.slice(0, 8)}
                        </Link>
                      </td>
                      <td className="py-3 px-4">
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {getCustomerName(order)}
                          </p>
                          <p className="text-xs text-gray-500">
                            {getCustomerEmail(order)}
                          </p>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusBadgeClass(
                            order.status
                          )}`}
                        >
                          {order.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right text-sm font-medium">
                        {formatCurrency(order.total)}
                      </td>
                      <td className="py-3 px-4 text-center text-sm text-gray-600">
                        {getItemsCount(order.items)}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600">
                        {formatDate(order.created_at)}
                      </td>
                      <td className="py-3 px-4">
                        {expandedId === order.id ? (
                          <ChevronUp className="w-4 h-4 text-gray-400" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-gray-400" />
                        )}
                      </td>
                    </tr>

                    {/* Expanded detail */}
                    {expandedId === order.id && (
                      <tr key={`${order.id}-detail`}>
                        <td colSpan={7} className="bg-gray-50 px-4 py-6">
                          <div className="grid md:grid-cols-3 gap-6">
                            {/* Order Items */}
                            <div>
                              <h4 className="text-sm font-semibold text-gray-700 mb-3">
                                Order Items
                              </h4>
                              {Array.isArray(order.items) ? (
                                <ul className="space-y-2">
                                  {(order.items as { name?: string; quantity?: number; price?: number }[]).map(
                                    (item, idx) => (
                                      <li
                                        key={idx}
                                        className="flex justify-between text-sm"
                                      >
                                        <span className="text-gray-700">
                                          {item.name || "Item"} x{item.quantity || 1}
                                        </span>
                                        <span className="text-gray-500">
                                          {item.price ? formatCurrency(item.price) : "-"}
                                        </span>
                                      </li>
                                    )
                                  )}
                                </ul>
                              ) : (
                                <p className="text-sm text-gray-500">No items data</p>
                              )}

                              <div className="mt-4 pt-3 border-t space-y-1 text-sm">
                                <div className="flex justify-between">
                                  <span className="text-gray-500">Subtotal</span>
                                  <span>{formatCurrency(order.subtotal)}</span>
                                </div>
                                {order.discount > 0 && (
                                  <div className="flex justify-between">
                                    <span className="text-gray-500">Discount</span>
                                    <span className="text-red-600">
                                      -{formatCurrency(order.discount)}
                                    </span>
                                  </div>
                                )}
                                <div className="flex justify-between">
                                  <span className="text-gray-500">Shipping</span>
                                  <span>{formatCurrency(order.shipping)}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-gray-500">Tax</span>
                                  <span>{formatCurrency(order.tax)}</span>
                                </div>
                                <div className="flex justify-between font-semibold pt-1 border-t">
                                  <span>Total</span>
                                  <span>{formatCurrency(order.total)}</span>
                                </div>
                              </div>
                            </div>

                            {/* Shipping Address */}
                            <div>
                              <h4 className="text-sm font-semibold text-gray-700 mb-3">
                                Shipping Address
                              </h4>
                              {order.shipping_address &&
                              typeof order.shipping_address === "object" ? (
                                <div className="text-sm text-gray-600 space-y-1">
                                  {(() => {
                                    const addr = order.shipping_address as Record<string, string>;
                                    return (
                                      <>
                                        {addr.firstName && addr.lastName && (
                                          <p className="font-medium text-gray-900">
                                            {addr.firstName} {addr.lastName}
                                          </p>
                                        )}
                                        {addr.address1 && <p>{addr.address1}</p>}
                                        {addr.address2 && <p>{addr.address2}</p>}
                                        {(addr.city || addr.state || addr.zipCode) && (
                                          <p>
                                            {addr.city}
                                            {addr.city && addr.state ? ", " : ""}
                                            {addr.state} {addr.zipCode}
                                          </p>
                                        )}
                                        {addr.country && <p>{addr.country}</p>}
                                        {addr.phone && (
                                          <p className="mt-2 text-gray-500">{addr.phone}</p>
                                        )}
                                      </>
                                    );
                                  })()}
                                </div>
                              ) : (
                                <p className="text-sm text-gray-500">No address data</p>
                              )}

                              {order.tracking_number && (
                                <div className="mt-4 pt-3 border-t">
                                  <p className="text-xs text-gray-500">Tracking Number</p>
                                  <p className="text-sm font-mono text-gray-800">
                                    {order.tracking_number}
                                  </p>
                                </div>
                              )}
                            </div>

                            {/* Update Order */}
                            <div>
                              <h4 className="text-sm font-semibold text-gray-700 mb-3">
                                Update Order
                              </h4>
                              <div className="space-y-3">
                                <div>
                                  <label className="block text-xs font-medium text-gray-500 mb-1">
                                    Status
                                  </label>
                                  <select
                                    value={editStatus}
                                    onChange={(e) =>
                                      setEditStatus(e.target.value as OrderStatus)
                                    }
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-aura-primary focus:border-transparent outline-none"
                                    aria-label="Order status"
                                  >
                                    {STATUS_OPTIONS.map((s) => (
                                      <option key={s} value={s}>
                                        {s.charAt(0).toUpperCase() + s.slice(1)}
                                      </option>
                                    ))}
                                  </select>
                                </div>

                                <Input
                                  label="Tracking Number"
                                  value={editTracking}
                                  onChange={(e) => setEditTracking(e.target.value)}
                                  placeholder="Enter tracking number"
                                />

                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Internal Notes
                                  </label>
                                  <textarea
                                    value={editNotes}
                                    onChange={(e) => setEditNotes(e.target.value)}
                                    rows={3}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-aura-primary focus:border-transparent outline-none resize-none"
                                    placeholder="Add internal notes..."
                                  />
                                </div>

                                <Button
                                  onClick={() => handleUpdateOrder(order.id)}
                                  isLoading={isSaving}
                                  size="sm"
                                  className="w-full"
                                  leftIcon={<Save className="w-4 h-4" />}
                                >
                                  Save Changes
                                </Button>
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
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
              {Math.min(page * PAGE_SIZE, totalCount)} of {totalCount} orders
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
