"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/hooks";
import { Card, Button, Input } from "@/components/ui";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { Profile, UserRole } from "@/types/database";
import {
  Search,
  Loader2,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Users,
  Save,
  X,
  User,
  ShoppingCart,
  RefreshCcw,
  Building,
} from "lucide-react";

interface CustomerRow extends Profile {
  order_count?: number;
  subscription_status?: string;
  organization_name?: string;
}

interface CustomerOrder {
  id: string;
  order_number: string | null;
  status: string;
  total: number;
  created_at: string;
}

interface CustomerSubscription {
  id: string;
  box_size: string;
  status: string;
  price: number;
  next_delivery_date: string | null;
}

const ROLES: UserRole[] = ["customer", "dealer", "admin"];
const PAGE_SIZE = 20;

function roleBadgeClass(role: string): string {
  switch (role) {
    case "admin":
      return "bg-purple-100 text-purple-700";
    case "dealer":
      return "bg-blue-100 text-blue-700";
    default:
      return "bg-gray-100 text-gray-700";
  }
}

export default function AdminCustomersPage() {
  const { profile: adminProfile } = useAuth();
  const supabase = createClient();

  const [customers, setCustomers] = useState<CustomerRow[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");

  // Expanded customer
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [customerOrders, setCustomerOrders] = useState<CustomerOrder[]>([]);
  const [customerSubs, setCustomerSubs] = useState<CustomerSubscription[]>([]);
  const [detailLoading, setDetailLoading] = useState(false);

  // Edit state
  const [editRole, setEditRole] = useState<UserRole>("customer");
  const [editCredits, setEditCredits] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  const fetchCustomers = useCallback(async () => {
    if (!adminProfile || adminProfile.role !== "admin") return;
    setIsLoading(true);

    const from = (page - 1) * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;

    let query = supabase
      .from("profiles")
      .select("*", { count: "exact" });

    if (search) {
      query = query.or(`full_name.ilike.%${search}%,email.ilike.%${search}%`);
    }
    if (roleFilter) {
      query = query.eq("role", roleFilter as UserRole);
    }

    const { data, count, error: fetchError } = await query
      .order("created_at", { ascending: false })
      .range(from, to);

    if (fetchError) {
      console.error("Error fetching customers:", fetchError);
      setCustomers([]);
      setTotalCount(0);
    } else {
      setCustomers((data as CustomerRow[]) || []);
      setTotalCount(count || 0);
    }
    setIsLoading(false);
  }, [adminProfile, supabase, page, search, roleFilter]);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  useEffect(() => {
    setPage(1);
  }, [search, roleFilter]);

  const toggleExpand = async (customer: CustomerRow) => {
    if (expandedId === customer.id) {
      setExpandedId(null);
      return;
    }

    setExpandedId(customer.id);
    setEditRole(customer.role);
    setEditCredits(String(customer.credits));
    setDetailLoading(true);

    // Fetch orders and subscriptions in parallel
    const [ordersRes, subsRes] = await Promise.all([
      supabase
        .from("aura_orders")
        .select("id, order_number, status, total, created_at")
        .eq("user_id", customer.id)
        .order("created_at", { ascending: false })
        .limit(10),
      supabase
        .from("aura_subscriptions")
        .select("id, box_size, status, price, next_delivery_date")
        .eq("user_id", customer.id),
    ]);

    setCustomerOrders(ordersRes.data || []);
    setCustomerSubs(subsRes.data || []);
    setDetailLoading(false);
  };

  const handleUpdateCustomer = async (customerId: string) => {
    setIsSaving(true);

    const { error: updateError } = await supabase
      .from("profiles")
      .update({
        role: editRole,
        credits: parseFloat(editCredits) || 0,
      })
      .eq("id", customerId);

    if (updateError) {
      alert("Failed to update customer: " + updateError.message);
    } else {
      fetchCustomers();
    }
    setIsSaving(false);
  };

  return (
    <>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Customers</h1>
        <p className="text-gray-600">Manage customer accounts and profiles</p>
      </div>

      {/* Filters */}
      <Card padding="md" className="mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <Input
              placeholder="Search by name or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              leftIcon={<Search className="w-4 h-4" />}
            />
          </div>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-aura-primary focus:border-transparent outline-none"
            aria-label="Filter by role"
          >
            <option value="">All Roles</option>
            {ROLES.map((r) => (
              <option key={r} value={r}>
                {r.charAt(0).toUpperCase() + r.slice(1)}
              </option>
            ))}
          </select>
        </div>
      </Card>

      {/* Customers Table */}
      <Card padding="none">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-6 h-6 animate-spin text-aura-primary" />
          </div>
        ) : customers.length === 0 ? (
          <div className="text-center py-20 text-gray-500">
            <Users className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p className="font-medium">No customers found</p>
            <p className="text-sm mt-1">Try adjusting your search or filters.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b">
                  <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="text-center py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="text-right py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Credits
                  </th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Joined
                  </th>
                  <th className="py-3 px-4 w-10"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {customers.map((customer) => (
                  <>
                    <tr
                      key={customer.id}
                      className="hover:bg-gray-50 transition-colors cursor-pointer"
                      onClick={() => toggleExpand(customer)}
                    >
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0 overflow-hidden">
                            {customer.avatar_url ? (
                              <img
                                src={customer.avatar_url}
                                alt=""
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <User className="w-4 h-4 text-gray-500" />
                            )}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              {customer.full_name || "No name"}
                            </p>
                            <p className="text-xs text-gray-500">{customer.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`px-2 py-0.5 rounded-full text-xs font-medium ${roleBadgeClass(
                            customer.role
                          )}`}
                        >
                          {customer.role}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right text-sm">
                        {formatCurrency(customer.credits)}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600">
                        {formatDate(customer.created_at)}
                      </td>
                      <td className="py-3 px-4">
                        {expandedId === customer.id ? (
                          <ChevronUp className="w-4 h-4 text-gray-400" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-gray-400" />
                        )}
                      </td>
                    </tr>

                    {/* Expanded detail */}
                    {expandedId === customer.id && (
                      <tr key={`${customer.id}-detail`}>
                        <td colSpan={5} className="bg-gray-50 px-4 py-6">
                          {detailLoading ? (
                            <div className="flex items-center justify-center py-8">
                              <Loader2 className="w-5 h-5 animate-spin text-aura-primary" />
                            </div>
                          ) : (
                            <div className="grid md:grid-cols-3 gap-6">
                              {/* Profile Info & Actions */}
                              <div>
                                <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                                  <User className="w-4 h-4" />
                                  Profile & Actions
                                </h4>

                                <div className="space-y-2 text-sm mb-4">
                                  <div className="flex justify-between">
                                    <span className="text-gray-500">Email</span>
                                    <span className="text-gray-800">{customer.email}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-gray-500">Phone</span>
                                    <span className="text-gray-800">{customer.phone || "-"}</span>
                                  </div>
                                  {customer.organization_id && (
                                    <div className="flex justify-between">
                                      <span className="text-gray-500">Organization</span>
                                      <span className="text-gray-800 flex items-center gap-1">
                                        <Building className="w-3 h-3" />
                                        {customer.organization_id.slice(0, 8)}...
                                      </span>
                                    </div>
                                  )}
                                </div>

                                <div className="space-y-3 pt-3 border-t">
                                  <div>
                                    <label className="block text-xs font-medium text-gray-500 mb-1">
                                      Role
                                    </label>
                                    <select
                                      value={editRole}
                                      onChange={(e) => setEditRole(e.target.value as UserRole)}
                                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-aura-primary focus:border-transparent outline-none"
                                      aria-label="Customer role"
                                    >
                                      {ROLES.map((r) => (
                                        <option key={r} value={r}>
                                          {r.charAt(0).toUpperCase() + r.slice(1)}
                                        </option>
                                      ))}
                                    </select>
                                  </div>
                                  <Input
                                    label="Credits"
                                    type="number"
                                    step="0.01"
                                    value={editCredits}
                                    onChange={(e) => setEditCredits(e.target.value)}
                                  />
                                  <Button
                                    onClick={() => handleUpdateCustomer(customer.id)}
                                    isLoading={isSaving}
                                    size="sm"
                                    className="w-full"
                                    leftIcon={<Save className="w-4 h-4" />}
                                  >
                                    Save Changes
                                  </Button>
                                </div>
                              </div>

                              {/* Recent Orders */}
                              <div>
                                <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                                  <ShoppingCart className="w-4 h-4" />
                                  Recent Orders ({customerOrders.length})
                                </h4>
                                {customerOrders.length > 0 ? (
                                  <ul className="space-y-2">
                                    {customerOrders.map((order) => (
                                      <li
                                        key={order.id}
                                        className="flex items-center justify-between text-sm bg-white p-2 rounded-lg"
                                      >
                                        <div>
                                          <span className="font-medium text-gray-900">
                                            {order.order_number || order.id.slice(0, 8)}
                                          </span>
                                          <span
                                            className={`ml-2 px-1.5 py-0.5 rounded text-xs font-medium ${
                                              order.status === "delivered"
                                                ? "bg-green-100 text-green-700"
                                                : order.status === "shipped"
                                                ? "bg-blue-100 text-blue-700"
                                                : order.status === "processing"
                                                ? "bg-amber-100 text-amber-700"
                                                : order.status === "cancelled"
                                                ? "bg-red-100 text-red-700"
                                                : "bg-gray-100 text-gray-700"
                                            }`}
                                          >
                                            {order.status}
                                          </span>
                                        </div>
                                        <span className="text-gray-600 font-medium">
                                          {formatCurrency(order.total)}
                                        </span>
                                      </li>
                                    ))}
                                  </ul>
                                ) : (
                                  <p className="text-sm text-gray-500">No orders yet</p>
                                )}
                              </div>

                              {/* Subscriptions */}
                              <div>
                                <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                                  <RefreshCcw className="w-4 h-4" />
                                  Subscriptions ({customerSubs.length})
                                </h4>
                                {customerSubs.length > 0 ? (
                                  <ul className="space-y-2">
                                    {customerSubs.map((sub) => (
                                      <li
                                        key={sub.id}
                                        className="bg-white p-3 rounded-lg text-sm"
                                      >
                                        <div className="flex items-center justify-between mb-1">
                                          <span className="font-medium text-gray-900 capitalize">
                                            {sub.box_size} Box
                                          </span>
                                          <span
                                            className={`px-1.5 py-0.5 rounded text-xs font-medium ${
                                              sub.status === "active"
                                                ? "bg-green-100 text-green-700"
                                                : sub.status === "paused"
                                                ? "bg-amber-100 text-amber-700"
                                                : "bg-red-100 text-red-700"
                                            }`}
                                          >
                                            {sub.status}
                                          </span>
                                        </div>
                                        <div className="flex justify-between text-gray-500">
                                          <span>{formatCurrency(sub.price)}/mo</span>
                                          {sub.next_delivery_date && (
                                            <span>
                                              Next: {formatDate(sub.next_delivery_date)}
                                            </span>
                                          )}
                                        </div>
                                      </li>
                                    ))}
                                  </ul>
                                ) : (
                                  <p className="text-sm text-gray-500">No subscriptions</p>
                                )}
                              </div>
                            </div>
                          )}
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
              {Math.min(page * PAGE_SIZE, totalCount)} of {totalCount} customers
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
