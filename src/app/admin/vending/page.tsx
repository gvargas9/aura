"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { useLocale } from "@/hooks/useLocale";
import { Card, Button, Input } from "@/components/ui";
import { formatCurrency } from "@/lib/utils";
import {
  MonitorSmartphone,
  Search,
  Filter,
  Wifi,
  WifiOff,
  Wrench,
  AlertTriangle,
  Package,
  DollarSign,
  Activity,
  ChevronDown,
  ChevronUp,
  Plus,
  X,
  Loader2,
  MapPin,
  Clock,
  Hash,
  ArrowRight,
  RefreshCw,
} from "lucide-react";
import Link from "next/link";

type MachineStatus = "online" | "offline" | "maintenance" | "low_stock";

interface VendingMachine {
  id: string;
  machine_serial: string;
  organization_id: string | null;
  name: string;
  location: string | null;
  coordinates: { lat: number; lng: number } | null;
  status: MachineStatus;
  last_checkin: string | null;
  firmware_version: string | null;
  config: Record<string, unknown> | null;
  total_sales: number;
  total_transactions: number;
  created_at: string;
  updated_at: string;
  organizations?: { id: string; name: string } | null;
}

interface Organization {
  id: string;
  name: string;
}

interface InventorySlot {
  id: string;
  machine_id: string;
  product_id: string;
  slot_number: number;
  quantity: number;
  max_quantity: number;
  price: number;
  last_restocked: string | null;
  aura_products: {
    id: string;
    name: string;
    image_url: string | null;
  } | null;
}

interface Transaction {
  id: string;
  machine_id: string;
  product_id: string;
  slot_number: number;
  quantity: number;
  price: number;
  payment_method: string | null;
  transaction_ref: string | null;
  created_at: string;
  aura_products: { name: string } | null;
}

const STATUS_CONFIG: Record<
  MachineStatus,
  { label: string; color: string; bgColor: string; icon: React.ElementType }
> = {
  online: {
    label: "Online",
    color: "text-emerald-400",
    bgColor: "bg-emerald-500/10 border-emerald-500/20",
    icon: Wifi,
  },
  offline: {
    label: "Offline",
    color: "text-red-400",
    bgColor: "bg-red-500/10 border-red-500/20",
    icon: WifiOff,
  },
  maintenance: {
    label: "Maintenance",
    color: "text-yellow-400",
    bgColor: "bg-yellow-500/10 border-yellow-500/20",
    icon: Wrench,
  },
  low_stock: {
    label: "Low Stock",
    color: "text-amber-400",
    bgColor: "bg-amber-500/10 border-amber-500/20",
    icon: AlertTriangle,
  },
};

function relativeTime(dateStr: string | null): string {
  if (!dateStr) return "Never";
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 30) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

export default function VendingDashboardPage() {
  const supabase = createClient();
  const { t } = useLocale();

  const [machines, setMachines] = useState<VendingMachine[]>([]);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<MachineStatus | "all">(
    "all"
  );
  const [orgFilter, setOrgFilter] = useState<string>("all");
  const [expandedMachine, setExpandedMachine] = useState<string | null>(null);
  const [expandedInventory, setExpandedInventory] = useState<InventorySlot[]>(
    []
  );
  const [expandedTransactions, setExpandedTransactions] = useState<
    Transaction[]
  >([]);
  const [expandedLoading, setExpandedLoading] = useState(false);

  // Add machine modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [addForm, setAddForm] = useState({
    name: "",
    machine_serial: "",
    organization_id: "",
    location: "",
    lat: "",
    lng: "",
  });
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  const fetchMachines = useCallback(async () => {
    setIsLoading(true);
    let query = supabase
      .from("vending_machines")
      .select("*, organizations(id, name)")
      .order("created_at", { ascending: false });

    if (statusFilter !== "all") {
      query = query.eq("status", statusFilter);
    }
    if (orgFilter !== "all") {
      query = query.eq("organization_id", orgFilter);
    }
    if (search) {
      query = query.or(
        `name.ilike.%${search}%,machine_serial.ilike.%${search}%,location.ilike.%${search}%`
      );
    }

    const { data, error: fetchError } = await query;
    if (fetchError) {
      console.error("Failed to fetch machines:", fetchError);
    } else {
      setMachines((data as unknown as VendingMachine[]) || []);
    }
    setIsLoading(false);
  }, [supabase, statusFilter, orgFilter, search]);

  const fetchOrganizations = useCallback(async () => {
    const { data } = await supabase
      .from("organizations")
      .select("id, name")
      .order("name");
    if (data) setOrganizations(data);
  }, [supabase]);

  useEffect(() => {
    fetchMachines();
    fetchOrganizations();
  }, [fetchMachines, fetchOrganizations]);

  const handleExpandMachine = async (machineId: string) => {
    if (expandedMachine === machineId) {
      setExpandedMachine(null);
      return;
    }
    setExpandedMachine(machineId);
    setExpandedLoading(true);

    const [inventoryRes, transactionsRes] = await Promise.all([
      supabase
        .from("vending_machine_inventory")
        .select("*, aura_products(id, name, image_url)")
        .eq("machine_id", machineId)
        .order("slot_number"),
      supabase
        .from("vending_transactions")
        .select("*, aura_products(name)")
        .eq("machine_id", machineId)
        .order("created_at", { ascending: false })
        .limit(20),
    ]);

    setExpandedInventory(
      (inventoryRes.data as unknown as InventorySlot[]) || []
    );
    setExpandedTransactions(
      (transactionsRes.data as unknown as Transaction[]) || []
    );
    setExpandedLoading(false);
  };

  const handleAddMachine = async () => {
    if (!addForm.name.trim() || !addForm.machine_serial.trim()) {
      setError("Name and serial number are required.");
      return;
    }
    setIsSaving(true);
    setError("");

    const coordinates =
      addForm.lat && addForm.lng
        ? { lat: parseFloat(addForm.lat), lng: parseFloat(addForm.lng) }
        : null;

    const { error: insertError } = await supabase
      .from("vending_machines")
      .insert({
        name: addForm.name.trim(),
        machine_serial: addForm.machine_serial.trim(),
        organization_id: addForm.organization_id || "",
        location: addForm.location.trim() || "",
        coordinates,
        status: "offline",
        total_sales: 0,
        total_transactions: 0,
      });

    if (insertError) {
      setError(insertError.message);
    } else {
      setShowAddModal(false);
      setAddForm({
        name: "",
        machine_serial: "",
        organization_id: "",
        location: "",
        lat: "",
        lng: "",
      });
      fetchMachines();
    }
    setIsSaving(false);
  };

  const handleMarkMaintenance = async (machineId: string) => {
    await supabase
      .from("vending_machines")
      .update({ status: "maintenance", updated_at: new Date().toISOString() })
      .eq("id", machineId);
    fetchMachines();
  };

  // Stats
  const totalMachines = machines.length;
  const onlineMachines = machines.filter((m) => m.status === "online").length;
  const offlineMaintenance = machines.filter(
    (m) => m.status === "offline" || m.status === "maintenance"
  ).length;
  const lowStockMachines = machines.filter(
    (m) => m.status === "low_stock"
  ).length;
  const totalRevenue = machines.reduce((sum, m) => sum + (m.total_sales || 0), 0);
  const totalTransactions = machines.reduce(
    (sum, m) => sum + (m.total_transactions || 0),
    0
  );

  function slotFillColor(quantity: number, maxQuantity: number): string {
    if (maxQuantity === 0 || quantity === 0) return "bg-gray-200";
    const ratio = quantity / maxQuantity;
    if (ratio > 0.5) return "bg-emerald-500";
    if (ratio > 0.25) return "bg-amber-500";
    return "bg-red-500";
  }

  function slotFillBorder(quantity: number, maxQuantity: number): string {
    if (maxQuantity === 0 || quantity === 0) return "border-gray-300";
    const ratio = quantity / maxQuantity;
    if (ratio > 0.5) return "border-emerald-500/30";
    if (ratio > 0.25) return "border-amber-500/30";
    return "border-red-500/30";
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {t("admin.vending")}
          </h1>
          <p className="text-gray-500 mt-1">
            {t("admin.vendingSubtitle")}
          </p>
        </div>
        <Button
          onClick={() => setShowAddModal(true)}
          leftIcon={<Plus className="w-4 h-4" />}
        >
          {t("admin.addMachine")}
        </Button>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
        <Card className="!bg-gray-900 !shadow-none border border-gray-800">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gray-800">
              <MonitorSmartphone className="w-5 h-5 text-gray-300" />
            </div>
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wider">
                {t("admin.totalMachines")}
              </p>
              <p className="text-xl font-bold text-white">{totalMachines}</p>
            </div>
          </div>
        </Card>

        <Card className="!bg-gray-900 !shadow-none border border-gray-800">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-500/10">
              <Wifi className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wider">
                {t("admin.online")}
              </p>
              <p className="text-xl font-bold text-emerald-400">
                {onlineMachines}
              </p>
            </div>
          </div>
        </Card>

        <Card className="!bg-gray-900 !shadow-none border border-gray-800">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-red-500/10">
              <WifiOff className="w-5 h-5 text-red-400" />
            </div>
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wider">
                {t("admin.down")}
              </p>
              <p className="text-xl font-bold text-red-400">
                {offlineMaintenance}
              </p>
            </div>
          </div>
        </Card>

        <Card className="!bg-gray-900 !shadow-none border border-gray-800">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-amber-500/10">
              <AlertTriangle className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wider">
                {t("admin.lowStockLabel")}
              </p>
              <p className="text-xl font-bold text-amber-400">
                {lowStockMachines}
              </p>
            </div>
          </div>
        </Card>

        <Card className="!bg-gray-900 !shadow-none border border-gray-800">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-500/10">
              <DollarSign className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wider">
                {t("admin.revenue")}
              </p>
              <p className="text-xl font-bold text-blue-400">
                {formatCurrency(totalRevenue)}
              </p>
            </div>
          </div>
        </Card>

        <Card className="!bg-gray-900 !shadow-none border border-gray-800">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-purple-500/10">
              <Activity className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wider">
                {t("admin.transactions")}
              </p>
              <p className="text-xl font-bold text-purple-400">
                {totalTransactions.toLocaleString()}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1">
          <Input
            placeholder={t("admin.searchMachines")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            leftIcon={<Search className="w-4 h-4" />}
          />
        </div>
        <div className="flex gap-3">
          <div className="relative">
            <select
              value={statusFilter}
              onChange={(e) =>
                setStatusFilter(e.target.value as MachineStatus | "all")
              }
              className="appearance-none bg-white border border-gray-200 rounded-xl px-4 py-3 pr-10 text-sm text-gray-700 focus:ring-2 focus:ring-aura-primary/20 focus:border-aura-primary outline-none"
              aria-label="Filter by status"
            >
              <option value="all">{t("admin.allStatuses")}</option>
              <option value="online">{t("admin.online")}</option>
              <option value="offline">{t("admin.offline")}</option>
              <option value="maintenance">{t("admin.maintenance")}</option>
              <option value="low_stock">{t("admin.lowStockLabel")}</option>
            </select>
            <Filter className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          </div>
          <div className="relative">
            <select
              value={orgFilter}
              onChange={(e) => setOrgFilter(e.target.value)}
              className="appearance-none bg-white border border-gray-200 rounded-xl px-4 py-3 pr-10 text-sm text-gray-700 focus:ring-2 focus:ring-aura-primary/20 focus:border-aura-primary outline-none"
              aria-label="Filter by organization"
            >
              <option value="all">{t("admin.allOrganizations")}</option>
              {organizations.map((org) => (
                <option key={org.id} value={org.id}>
                  {org.name}
                </option>
              ))}
            </select>
            <Filter className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Machine List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-aura-primary" />
        </div>
      ) : machines.length === 0 ? (
        <Card className="text-center py-16">
          <MonitorSmartphone className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-600 mb-2">
            {t("admin.noMachinesFound")}
          </h3>
          <p className="text-gray-400 mb-4">
            {search || statusFilter !== "all" || orgFilter !== "all"
              ? t("admin.adjustMachineFilters")
              : t("admin.addFirstMachine")}
          </p>
          {!search && statusFilter === "all" && orgFilter === "all" && (
            <Button onClick={() => setShowAddModal(true)} size="sm">
              {t("admin.addMachine")}
            </Button>
          )}
        </Card>
      ) : (
        <div className="space-y-3">
          {machines.map((machine) => {
            const config = STATUS_CONFIG[machine.status];
            const StatusIcon = config.icon;
            const isExpanded = expandedMachine === machine.id;

            return (
              <div key={machine.id} className="rounded-xl border border-gray-200 bg-white overflow-hidden">
                {/* Machine Row */}
                <button
                  onClick={() => handleExpandMachine(machine.id)}
                  className="w-full flex items-center gap-4 px-5 py-4 text-left hover:bg-gray-50 transition-colors"
                  aria-expanded={isExpanded}
                >
                  {/* Status Dot */}
                  <div
                    className={`w-3 h-3 rounded-full flex-shrink-0 ${
                      machine.status === "online"
                        ? "bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.5)]"
                        : machine.status === "offline"
                          ? "bg-red-500"
                          : machine.status === "maintenance"
                            ? "bg-yellow-500"
                            : "bg-amber-500"
                    }`}
                  />

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-gray-900 truncate">
                        {machine.name}
                      </span>
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${config.bgColor} ${config.color}`}
                      >
                        <StatusIcon className="w-3 h-3" />
                        {config.label}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 mt-1 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <Hash className="w-3 h-3" />
                        {machine.machine_serial}
                      </span>
                      {machine.organizations?.name && (
                        <span className="flex items-center gap-1">
                          <Package className="w-3 h-3" />
                          {machine.organizations.name}
                        </span>
                      )}
                      {machine.location && (
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {machine.location}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="hidden md:flex items-center gap-6 text-sm">
                    <div className="text-right">
                      <p className="text-gray-400 text-xs">{t("admin.sales")}</p>
                      <p className="font-semibold text-gray-900">
                        {formatCurrency(machine.total_sales || 0)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-gray-400 text-xs">{t("admin.lastCheckin")}</p>
                      <p className="font-medium text-gray-600">
                        {relativeTime(machine.last_checkin)}
                      </p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/admin/vending/${machine.id}`}
                      onClick={(e) => e.stopPropagation()}
                      className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-aura-primary transition-colors"
                      aria-label="View machine details"
                    >
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4 text-gray-400" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-gray-400" />
                    )}
                  </div>
                </button>

                {/* Expanded Detail */}
                {isExpanded && (
                  <div className="border-t border-gray-100 bg-gray-50 px-5 py-5">
                    {expandedLoading ? (
                      <div className="flex items-center justify-center py-8">
                        <Loader2 className="w-6 h-6 animate-spin text-aura-primary" />
                      </div>
                    ) : (
                      <div className="space-y-6">
                        {/* Machine Info */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <p className="text-gray-400 text-xs mb-1">
                              Serial
                            </p>
                            <p className="font-mono text-gray-700">
                              {machine.machine_serial}
                            </p>
                          </div>
                          <div>
                            <p className="text-gray-400 text-xs mb-1">
                              Firmware
                            </p>
                            <p className="text-gray-700">
                              {machine.firmware_version || "N/A"}
                            </p>
                          </div>
                          <div>
                            <p className="text-gray-400 text-xs mb-1">
                              Coordinates
                            </p>
                            <p className="text-gray-700 font-mono text-xs">
                              {machine.coordinates
                                ? `${machine.coordinates.lat}, ${machine.coordinates.lng}`
                                : "N/A"}
                            </p>
                          </div>
                          <div>
                            <p className="text-gray-400 text-xs mb-1">
                              Transactions
                            </p>
                            <p className="text-gray-700">
                              {(machine.total_transactions || 0).toLocaleString()}
                            </p>
                          </div>
                        </div>

                        {/* Inventory Grid */}
                        <div>
                          <div className="flex items-center justify-between mb-3">
                            <h4 className="text-sm font-semibold text-gray-700">
                              {t("admin.inventorySlots")}
                            </h4>
                            <div className="flex items-center gap-3 text-xs text-gray-400">
                              <span className="flex items-center gap-1">
                                <span className="w-2 h-2 rounded-full bg-emerald-500" />{" "}
                                &gt;50%
                              </span>
                              <span className="flex items-center gap-1">
                                <span className="w-2 h-2 rounded-full bg-amber-500" />{" "}
                                25-50%
                              </span>
                              <span className="flex items-center gap-1">
                                <span className="w-2 h-2 rounded-full bg-red-500" />{" "}
                                &lt;25%
                              </span>
                              <span className="flex items-center gap-1">
                                <span className="w-2 h-2 rounded-full bg-gray-300" />{" "}
                                Empty
                              </span>
                            </div>
                          </div>
                          {expandedInventory.length === 0 ? (
                            <p className="text-sm text-gray-400">
                              {t("admin.noInventorySlots")}
                            </p>
                          ) : (
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                              {expandedInventory.map((slot) => (
                                <div
                                  key={slot.id}
                                  className={`rounded-lg border p-3 bg-white ${slotFillBorder(slot.quantity, slot.max_quantity)}`}
                                >
                                  <div className="flex items-center justify-between mb-2">
                                    <span className="text-xs font-mono text-gray-400">
                                      #{slot.slot_number}
                                    </span>
                                    <span className="text-xs font-semibold text-gray-700">
                                      {formatCurrency(slot.price)}
                                    </span>
                                  </div>
                                  {slot.aura_products?.image_url ? (
                                    <img
                                      src={slot.aura_products.image_url}
                                      alt={slot.aura_products.name || "Product"}
                                      className="w-full h-12 object-contain rounded mb-2"
                                    />
                                  ) : (
                                    <div className="w-full h-12 bg-gray-100 rounded flex items-center justify-center mb-2">
                                      <Package className="w-5 h-5 text-gray-300" />
                                    </div>
                                  )}
                                  <p className="text-xs font-medium text-gray-700 truncate mb-1">
                                    {slot.aura_products?.name || "Unknown"}
                                  </p>
                                  {/* Fill bar */}
                                  <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
                                    <div
                                      className={`h-full rounded-full transition-all ${slotFillColor(slot.quantity, slot.max_quantity)}`}
                                      style={{
                                        width: `${slot.max_quantity > 0 ? (slot.quantity / slot.max_quantity) * 100 : 0}%`,
                                      }}
                                    />
                                  </div>
                                  <p className="text-xs text-gray-400 mt-1">
                                    {slot.quantity}/{slot.max_quantity}
                                  </p>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Recent Transactions */}
                        <div>
                          <h4 className="text-sm font-semibold text-gray-700 mb-3">
                            {t("admin.recentTransactions")}
                          </h4>
                          {expandedTransactions.length === 0 ? (
                            <p className="text-sm text-gray-400">
                              {t("admin.noTransactions")}
                            </p>
                          ) : (
                            <div className="overflow-x-auto">
                              <table className="w-full text-sm">
                                <thead>
                                  <tr className="text-left text-xs text-gray-400 border-b border-gray-200">
                                    <th className="pb-2 pr-4">Product</th>
                                    <th className="pb-2 pr-4">Slot</th>
                                    <th className="pb-2 pr-4">Qty</th>
                                    <th className="pb-2 pr-4">Price</th>
                                    <th className="pb-2 pr-4">Payment</th>
                                    <th className="pb-2">Time</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {expandedTransactions.map((tx) => (
                                    <tr
                                      key={tx.id}
                                      className="border-b border-gray-100 last:border-0"
                                    >
                                      <td className="py-2 pr-4 text-gray-700">
                                        {tx.aura_products?.name || "Unknown"}
                                      </td>
                                      <td className="py-2 pr-4 text-gray-500 font-mono">
                                        #{tx.slot_number}
                                      </td>
                                      <td className="py-2 pr-4 text-gray-500">
                                        {tx.quantity}
                                      </td>
                                      <td className="py-2 pr-4 text-gray-700 font-medium">
                                        {formatCurrency(tx.price)}
                                      </td>
                                      <td className="py-2 pr-4">
                                        <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs capitalize">
                                          {tx.payment_method || "N/A"}
                                        </span>
                                      </td>
                                      <td className="py-2 text-gray-400 text-xs">
                                        {relativeTime(tx.created_at)}
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          )}
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-3">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleMarkMaintenance(machine.id)}
                            leftIcon={<Wrench className="w-3.5 h-3.5" />}
                          >
                            {t("admin.markMaintenance")}
                          </Button>
                          <Link href={`/admin/vending/${machine.id}`}>
                            <Button
                              size="sm"
                              leftIcon={<ArrowRight className="w-3.5 h-3.5" />}
                            >
                              {t("admin.fullDetails")}
                            </Button>
                          </Link>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Add Machine Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-900">
                {t("admin.addVendingMachine")}
              </h2>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setError("");
                }}
                className="p-1 rounded-lg hover:bg-gray-100"
                aria-label="Close"
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            <div className="px-6 py-5 space-y-4">
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
                  {error}
                </div>
              )}
              <Input
                label={t("admin.machineName")}
                placeholder="Downtown Office Lobby"
                value={addForm.name}
                onChange={(e) =>
                  setAddForm({ ...addForm, name: e.target.value })
                }
              />
              <Input
                label={t("admin.serialNumber")}
                placeholder="VM-2026-001"
                value={addForm.machine_serial}
                onChange={(e) =>
                  setAddForm({ ...addForm, machine_serial: e.target.value })
                }
              />
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  {t("admin.organization")}
                </label>
                <select
                  value={addForm.organization_id}
                  onChange={(e) =>
                    setAddForm({ ...addForm, organization_id: e.target.value })
                  }
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-gray-700 bg-white focus:ring-2 focus:ring-aura-primary/20 focus:border-aura-primary outline-none"
                >
                  <option value="">{t("admin.noOrganization")}</option>
                  {organizations.map((org) => (
                    <option key={org.id} value={org.id}>
                      {org.name}
                    </option>
                  ))}
                </select>
              </div>
              <Input
                label={t("admin.location")}
                placeholder="123 Main St, Building A"
                value={addForm.location}
                onChange={(e) =>
                  setAddForm({ ...addForm, location: e.target.value })
                }
                leftIcon={<MapPin className="w-4 h-4" />}
              />
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label={t("admin.latitude")}
                  placeholder="30.2672"
                  type="number"
                  step="any"
                  value={addForm.lat}
                  onChange={(e) =>
                    setAddForm({ ...addForm, lat: e.target.value })
                  }
                />
                <Input
                  label={t("admin.longitude")}
                  placeholder="-97.7431"
                  type="number"
                  step="any"
                  value={addForm.lng}
                  onChange={(e) =>
                    setAddForm({ ...addForm, lng: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 px-6 py-4 bg-gray-50 border-t border-gray-100">
              <Button
                variant="outline"
                onClick={() => {
                  setShowAddModal(false);
                  setError("");
                }}
              >
                {t("common.cancel")}
              </Button>
              <Button onClick={handleAddMachine} isLoading={isSaving}>
                {t("admin.addMachine")}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
