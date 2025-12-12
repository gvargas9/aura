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
  Avatar,
} from "@/components/ui";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { Profile, Order, Subscription, UserRole } from "@/types";
import {
  Search,
  Eye,
  Users,
  Loader2,
  Mail,
  Phone,
  MapPin,
  Package,
  RefreshCcw,
  Download,
  UserPlus,
} from "lucide-react";

interface CustomerWithStats extends Profile {
  totalOrders?: number;
  totalSpent?: number;
  hasActiveSubscription?: boolean;
}

export default function AdminCustomersPage() {
  const [customers, setCustomers] = useState<CustomerWithStats[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCustomers, setTotalCustomers] = useState(0);
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerWithStats | null>(null);
  const [customerOrders, setCustomerOrders] = useState<Order[]>([]);
  const [customerSubscriptions, setCustomerSubscriptions] = useState<Subscription[]>([]);

  const pageSize = 10;
  const supabase = createClient();

  const fetchCustomers = async () => {
    setIsLoading(true);
    let query = supabase
      .from("profiles")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false });

    if (searchQuery) {
      query = query.or(`full_name.ilike.%${searchQuery}%,email.ilike.%${searchQuery}%`);
    }
    if (roleFilter) {
      query = query.eq("role", roleFilter as UserRole);
    }

    const from = (currentPage - 1) * pageSize;
    const to = from + pageSize - 1;
    query = query.range(from, to);

    const { data, count, error } = await query;

    if (!error && data) {
      // Fetch order stats for each customer
      const customersWithStats = await Promise.all(
        data.map(async (customer) => {
          const { data: orders } = await supabase
            .from("aura_orders")
            .select("total")
            .eq("user_id", customer.id);

          const { count: subCount } = await supabase
            .from("aura_subscriptions")
            .select("*", { count: "exact", head: true })
            .eq("user_id", customer.id)
            .eq("status", "active");

          return {
            ...customer,
            totalOrders: orders?.length || 0,
            totalSpent: orders?.reduce((sum, o) => sum + o.total, 0) || 0,
            hasActiveSubscription: (subCount || 0) > 0,
          };
        })
      );

      setCustomers(customersWithStats);
      setTotalCustomers(count || 0);
    }
    setIsLoading(false);
  };

  const fetchCustomerDetails = async (customerId: string) => {
    const { data: orders } = await supabase
      .from("aura_orders")
      .select("*")
      .eq("user_id", customerId)
      .order("created_at", { ascending: false })
      .limit(5);

    const { data: subscriptions } = await supabase
      .from("aura_subscriptions")
      .select("*")
      .eq("user_id", customerId);

    setCustomerOrders(orders || []);
    setCustomerSubscriptions(subscriptions || []);
  };

  useEffect(() => {
    fetchCustomers();
  }, [currentPage, searchQuery, roleFilter]);

  useEffect(() => {
    if (selectedCustomer) {
      fetchCustomerDetails(selectedCustomer.id);
    }
  }, [selectedCustomer]);

  const totalPages = Math.ceil(totalCustomers / pageSize);

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Customers</h1>
            <p className="text-gray-500">Manage your customer base</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" leftIcon={<Download className="w-4 h-4" />}>
              Export
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card padding="md">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Users className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totalCustomers}</p>
                <p className="text-sm text-gray-500">Total Customers</p>
              </div>
            </div>
          </Card>
          <Card padding="md">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <RefreshCcw className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {customers.filter((c) => c.hasActiveSubscription).length}
                </p>
                <p className="text-sm text-gray-500">Active Subscribers</p>
              </div>
            </div>
          </Card>
          <Card padding="md">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <UserPlus className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {customers.filter((c) => c.role === "dealer").length}
                </p>
                <p className="text-sm text-gray-500">Dealers</p>
              </div>
            </div>
          </Card>
          <Card padding="md">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                <Package className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {formatCurrency(customers.reduce((sum, c) => sum + (c.totalSpent || 0), 0))}
                </p>
                <p className="text-sm text-gray-500">Total Revenue</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Filters */}
        <Card padding="md">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Input
                placeholder="Search customers..."
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
                { value: "", label: "All Roles" },
                { value: "customer", label: "Customers" },
                { value: "dealer", label: "Dealers" },
                { value: "admin", label: "Admins" },
              ]}
              value={roleFilter}
              onChange={(v) => {
                setRoleFilter(v);
                setCurrentPage(1);
              }}
              className="w-full sm:w-40"
            />
          </div>
        </Card>

        {/* Customers Table */}
        <Card>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-aura-primary" />
            </div>
          ) : customers.length === 0 ? (
            <EmptyState
              icon={Users}
              title="No customers found"
              description={searchQuery ? "Try a different search term" : "Customers will appear here"}
            />
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Customer</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Orders</TableHead>
                    <TableHead>Total Spent</TableHead>
                    <TableHead>Subscription</TableHead>
                    <TableHead>Joined</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {customers.map((customer) => (
                    <TableRow key={customer.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar
                            src={customer.avatar_url}
                            fallback={customer.full_name || customer.email}
                            size="md"
                          />
                          <div>
                            <p className="font-medium text-gray-900">
                              {customer.full_name || "No name"}
                            </p>
                            <p className="text-sm text-gray-500">{customer.email}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            customer.role === "admin"
                              ? "error"
                              : customer.role === "dealer"
                              ? "info"
                              : "default"
                          }
                        >
                          {customer.role}
                        </Badge>
                      </TableCell>
                      <TableCell>{customer.totalOrders || 0}</TableCell>
                      <TableCell className="font-medium">
                        {formatCurrency(customer.totalSpent || 0)}
                      </TableCell>
                      <TableCell>
                        {customer.hasActiveSubscription ? (
                          <Badge variant="success">Active</Badge>
                        ) : (
                          <Badge variant="default">None</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-gray-500">
                        {formatDate(customer.created_at)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => setSelectedCustomer(customer)}
                            className="p-2 text-gray-500 hover:text-aura-primary hover:bg-gray-100 rounded-lg"
                          >
                            <Eye className="w-4 h-4" />
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

      {/* Customer Details Modal */}
      <Modal
        isOpen={!!selectedCustomer}
        onClose={() => setSelectedCustomer(null)}
        title="Customer Details"
        size="lg"
      >
        {selectedCustomer && (
          <div className="space-y-6">
            {/* Customer Info */}
            <div className="flex items-start gap-4">
              <Avatar
                src={selectedCustomer.avatar_url}
                fallback={selectedCustomer.full_name || selectedCustomer.email}
                size="xl"
              />
              <div className="flex-1">
                <h3 className="text-xl font-semibold">
                  {selectedCustomer.full_name || "No name"}
                </h3>
                <div className="space-y-1 mt-2 text-sm text-gray-600">
                  <p className="flex items-center gap-2">
                    <Mail className="w-4 h-4" />
                    {selectedCustomer.email}
                  </p>
                  {selectedCustomer.phone && (
                    <p className="flex items-center gap-2">
                      <Phone className="w-4 h-4" />
                      {selectedCustomer.phone}
                    </p>
                  )}
                </div>
              </div>
              <Badge
                variant={
                  selectedCustomer.role === "admin"
                    ? "error"
                    : selectedCustomer.role === "dealer"
                    ? "info"
                    : "default"
                }
                size="md"
              >
                {selectedCustomer.role}
              </Badge>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4">
              <div className="p-4 bg-gray-50 rounded-xl text-center">
                <p className="text-2xl font-bold">{selectedCustomer.totalOrders}</p>
                <p className="text-sm text-gray-500">Orders</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-xl text-center">
                <p className="text-2xl font-bold">
                  {formatCurrency(selectedCustomer.totalSpent || 0)}
                </p>
                <p className="text-sm text-gray-500">Total Spent</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-xl text-center">
                <p className="text-2xl font-bold">{selectedCustomer.credits}</p>
                <p className="text-sm text-gray-500">Credits</p>
              </div>
            </div>

            {/* Subscriptions */}
            {customerSubscriptions.length > 0 && (
              <div>
                <h4 className="font-semibold mb-3">Subscriptions</h4>
                <div className="space-y-2">
                  {customerSubscriptions.map((sub) => (
                    <div
                      key={sub.id}
                      className="flex items-center justify-between p-3 border border-gray-200 rounded-xl"
                    >
                      <div>
                        <p className="font-medium capitalize">{sub.box_size} Box</p>
                        <p className="text-sm text-gray-500">
                          {formatCurrency(sub.price)}/month
                        </p>
                      </div>
                      <Badge variant={sub.status === "active" ? "success" : "default"}>
                        {sub.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recent Orders */}
            {customerOrders.length > 0 && (
              <div>
                <h4 className="font-semibold mb-3">Recent Orders</h4>
                <div className="space-y-2">
                  {customerOrders.map((order) => (
                    <div
                      key={order.id}
                      className="flex items-center justify-between p-3 border border-gray-200 rounded-xl"
                    >
                      <div>
                        <p className="font-medium">
                          #{order.order_number || order.id.slice(0, 8)}
                        </p>
                        <p className="text-sm text-gray-500">{formatDate(order.created_at)}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{formatCurrency(order.total)}</p>
                        <Badge
                          variant={
                            order.status === "delivered"
                              ? "success"
                              : order.status === "shipped"
                              ? "info"
                              : "warning"
                          }
                          size="sm"
                        >
                          {order.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>
    </AdminLayout>
  );
}
