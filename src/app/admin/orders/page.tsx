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
  Tabs,
  Pagination,
  EmptyState,
} from "@/components/ui";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { Order, OrderStatus } from "@/types";
import {
  Search,
  Eye,
  Package,
  Loader2,
  Truck,
  CheckCircle,
  XCircle,
  Clock,
  Download,
  RefreshCcw,
} from "lucide-react";

const statusOptions = [
  { value: "pending", label: "Pending" },
  { value: "processing", label: "Processing" },
  { value: "shipped", label: "Shipped" },
  { value: "delivered", label: "Delivered" },
  { value: "cancelled", label: "Cancelled" },
];

const statusConfig: Record<string, { variant: "default" | "success" | "warning" | "error" | "info"; icon: React.ReactNode }> = {
  pending: { variant: "warning", icon: <Clock className="w-3 h-3" /> },
  processing: { variant: "info", icon: <RefreshCcw className="w-3 h-3" /> },
  shipped: { variant: "info", icon: <Truck className="w-3 h-3" /> },
  delivered: { variant: "success", icon: <CheckCircle className="w-3 h-3" /> },
  cancelled: { variant: "error", icon: <XCircle className="w-3 h-3" /> },
};

const tabs = [
  { id: "all", label: "All Orders" },
  { id: "pending", label: "Pending", count: 0 },
  { id: "processing", label: "Processing", count: 0 },
  { id: "shipped", label: "Shipped", count: 0 },
  { id: "delivered", label: "Delivered", count: 0 },
];

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalOrders, setTotalOrders] = useState(0);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [tabCounts, setTabCounts] = useState<Record<string, number>>({});

  const pageSize = 10;
  const supabase = createClient();

  const fetchOrders = async () => {
    setIsLoading(true);
    let query = supabase
      .from("aura_orders")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false });

    if (searchQuery) {
      query = query.or(`order_number.ilike.%${searchQuery}%,id.ilike.%${searchQuery}%`);
    }
    if (activeTab !== "all") {
      query = query.eq("status", activeTab as OrderStatus);
    }

    const from = (currentPage - 1) * pageSize;
    const to = from + pageSize - 1;
    query = query.range(from, to);

    const { data, count, error } = await query;

    if (!error && data) {
      setOrders(data);
      setTotalOrders(count || 0);
    }
    setIsLoading(false);
  };

  const fetchCounts = async () => {
    const counts: Record<string, number> = {};
    const statuses: OrderStatus[] = ["pending", "processing", "shipped", "delivered"];
    for (const status of statuses) {
      const { count } = await supabase
        .from("aura_orders")
        .select("*", { count: "exact", head: true })
        .eq("status", status);
      counts[status] = count || 0;
    }
    setTabCounts(counts);
  };

  useEffect(() => {
    fetchOrders();
  }, [currentPage, searchQuery, activeTab]);

  useEffect(() => {
    fetchCounts();
  }, []);

  const handleUpdateStatus = async (orderId: string, newStatus: OrderStatus) => {
    setIsUpdating(true);
    await supabase.from("aura_orders").update({ status: newStatus }).eq("id", orderId);
    setIsUpdating(false);
    fetchOrders();
    fetchCounts();
    if (selectedOrder?.id === orderId) {
      setSelectedOrder({ ...selectedOrder, status: newStatus });
    }
  };

  const totalPages = Math.ceil(totalOrders / pageSize);

  const tabsWithCounts = tabs.map((tab) => ({
    ...tab,
    count: tab.id === "all" ? undefined : tabCounts[tab.id] || 0,
  }));

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Orders</h1>
            <p className="text-gray-500">Manage and track customer orders</p>
          </div>
          <Button variant="outline" leftIcon={<Download className="w-4 h-4" />}>
            Export Orders
          </Button>
        </div>

        {/* Tabs */}
        <Tabs
          tabs={tabsWithCounts}
          activeTab={activeTab}
          onTabChange={(tab) => {
            setActiveTab(tab);
            setCurrentPage(1);
          }}
        />

        {/* Search */}
        <Card padding="md">
          <Input
            placeholder="Search by order number..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            leftIcon={<Search className="w-5 h-5" />}
          />
        </Card>

        {/* Orders Table */}
        <Card>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-aura-primary" />
            </div>
          ) : orders.length === 0 ? (
            <EmptyState
              icon={Package}
              title="No orders found"
              description={searchQuery ? "Try a different search term" : "Orders will appear here once customers place them"}
            />
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Items</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orders.map((order) => {
                    const items = order.items as Array<{ name: string; quantity: number }>;
                    const shipping = order.shipping_address as { firstName?: string; lastName?: string; city?: string; state?: string } | null;
                    const config = statusConfig[order.status] || statusConfig.pending;

                    return (
                      <TableRow key={order.id}>
                        <TableCell>
                          <p className="font-medium text-aura-primary">
                            #{order.order_number || order.id.slice(0, 8)}
                          </p>
                        </TableCell>
                        <TableCell className="text-gray-500">
                          {formatDate(order.created_at)}
                        </TableCell>
                        <TableCell>
                          <p className="font-medium">
                            {shipping?.firstName} {shipping?.lastName}
                          </p>
                          <p className="text-sm text-gray-500">
                            {shipping?.city}, {shipping?.state}
                          </p>
                        </TableCell>
                        <TableCell>
                          <p className="text-sm text-gray-600">
                            {items?.length || 0} items
                          </p>
                        </TableCell>
                        <TableCell className="font-medium">
                          {formatCurrency(order.total)}
                        </TableCell>
                        <TableCell>
                          <Badge variant={config.variant}>
                            <span className="flex items-center gap-1">
                              {config.icon}
                              {order.status}
                            </span>
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => setSelectedOrder(order)}
                              className="p-2 text-gray-500 hover:text-aura-primary hover:bg-gray-100 rounded-lg"
                            >
                              <Eye className="w-4 h-4" />
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

      {/* Order Details Modal */}
      <Modal
        isOpen={!!selectedOrder}
        onClose={() => setSelectedOrder(null)}
        title={`Order #${selectedOrder?.order_number || selectedOrder?.id.slice(0, 8)}`}
        size="lg"
      >
        {selectedOrder && (
          <div className="space-y-6">
            {/* Status Update */}
            <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-700 mb-1">Order Status</p>
                <Select
                  options={statusOptions}
                  value={selectedOrder.status}
                  onChange={(v) => handleUpdateStatus(selectedOrder.id, v as OrderStatus)}
                />
              </div>
              {selectedOrder.tracking_number && (
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-1">Tracking</p>
                  <p className="text-sm text-gray-600">{selectedOrder.tracking_number}</p>
                </div>
              )}
            </div>

            {/* Order Items */}
            <div>
              <h3 className="font-semibold mb-3">Order Items</h3>
              <div className="border border-gray-200 rounded-xl divide-y divide-gray-100">
                {(selectedOrder.items as Array<{ name: string; quantity: number; price: number }>)?.map(
                  (item, index) => (
                    <div key={index} className="flex items-center justify-between p-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                          <Package className="w-5 h-5 text-gray-400" />
                        </div>
                        <div>
                          <p className="font-medium">{item.name}</p>
                          <p className="text-sm text-gray-500">Qty: {item.quantity}</p>
                        </div>
                      </div>
                      <p className="font-medium">{formatCurrency(item.price * item.quantity)}</p>
                    </div>
                  )
                )}
              </div>
            </div>

            {/* Order Summary */}
            <div className="grid grid-cols-2 gap-6">
              {/* Shipping Address */}
              <div>
                <h3 className="font-semibold mb-3">Shipping Address</h3>
                {(() => {
                  const addr = selectedOrder.shipping_address as {
                    firstName?: string;
                    lastName?: string;
                    address1?: string;
                    address2?: string;
                    city?: string;
                    state?: string;
                    zipCode?: string;
                  } | null;
                  return (
                    <div className="text-sm text-gray-600 space-y-1">
                      <p className="font-medium text-gray-900">
                        {addr?.firstName} {addr?.lastName}
                      </p>
                      <p>{addr?.address1}</p>
                      {addr?.address2 && <p>{addr?.address2}</p>}
                      <p>
                        {addr?.city}, {addr?.state} {addr?.zipCode}
                      </p>
                    </div>
                  );
                })()}
              </div>

              {/* Order Totals */}
              <div>
                <h3 className="font-semibold mb-3">Order Summary</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Subtotal</span>
                    <span>{formatCurrency(selectedOrder.subtotal)}</span>
                  </div>
                  {selectedOrder.discount > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>Discount</span>
                      <span>-{formatCurrency(selectedOrder.discount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-gray-500">Shipping</span>
                    <span>
                      {selectedOrder.shipping > 0 ? formatCurrency(selectedOrder.shipping) : "FREE"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Tax</span>
                    <span>{formatCurrency(selectedOrder.tax)}</span>
                  </div>
                  <div className="flex justify-between font-semibold text-base pt-2 border-t border-gray-200">
                    <span>Total</span>
                    <span>{formatCurrency(selectedOrder.total)}</span>
                  </div>
                </div>
              </div>
            </div>

            {selectedOrder.notes && (
              <div>
                <h3 className="font-semibold mb-2">Notes</h3>
                <p className="text-sm text-gray-600 p-3 bg-gray-50 rounded-lg">
                  {selectedOrder.notes}
                </p>
              </div>
            )}
          </div>
        )}
      </Modal>
    </AdminLayout>
  );
}
