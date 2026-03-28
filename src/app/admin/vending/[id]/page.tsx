"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Card, Button, Input } from "@/components/ui";
import { formatCurrency, formatDate } from "@/lib/utils";
import {
  ArrowLeft,
  Wifi,
  WifiOff,
  Wrench,
  AlertTriangle,
  Package,
  DollarSign,
  Activity,
  Loader2,
  Hash,
  MapPin,
  Clock,
  Cpu,
  Edit2,
  RefreshCw,
  QrCode,
  ChevronLeft,
  ChevronRight,
  Save,
  X,
  Check,
  Settings,
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

interface QRRedemption {
  id: string;
  code: string;
  user_id: string | null;
  order_id: string | null;
  product_id: string | null;
  machine_id: string | null;
  status: "pending" | "redeemed" | "expired";
  expires_at: string | null;
  redeemed_at: string | null;
  created_at: string;
  aura_products?: { name: string } | null;
}

interface Product {
  id: string;
  name: string;
  image_url: string | null;
  price: number;
}

const STATUS_CONFIG: Record<
  MachineStatus,
  { label: string; color: string; bgColor: string; dotColor: string }
> = {
  online: {
    label: "Online",
    color: "text-emerald-400",
    bgColor: "bg-emerald-500/10 border-emerald-500/20",
    dotColor: "bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.5)]",
  },
  offline: {
    label: "Offline",
    color: "text-red-400",
    bgColor: "bg-red-500/10 border-red-500/20",
    dotColor: "bg-red-500",
  },
  maintenance: {
    label: "Maintenance",
    color: "text-yellow-400",
    bgColor: "bg-yellow-500/10 border-yellow-500/20",
    dotColor: "bg-yellow-500",
  },
  low_stock: {
    label: "Low Stock",
    color: "text-amber-400",
    bgColor: "bg-amber-500/10 border-amber-500/20",
    dotColor: "bg-amber-500",
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

function uptimeText(lastCheckin: string | null): string {
  if (!lastCheckin) return "Unknown";
  const date = new Date(lastCheckin);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 5) return "Active now";
  if (diffMins < 60) return `Last seen ${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `Last seen ${diffHours}h ago`;
  return `Last seen ${Math.floor(diffHours / 24)}d ago`;
}

const PAGE_SIZE = 25;

export default function VendingMachineDetailPage() {
  const params = useParams();
  const router = useRouter();
  const machineId = params.id as string;
  const supabase = createClient();

  const [machine, setMachine] = useState<VendingMachine | null>(null);
  const [inventory, setInventory] = useState<InventorySlot[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [qrRedemptions, setQrRedemptions] = useState<QRRedemption[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Transaction pagination
  const [txPage, setTxPage] = useState(1);
  const [txTotal, setTxTotal] = useState(0);

  // Slot editing
  const [editingSlot, setEditingSlot] = useState<string | null>(null);
  const [slotEditForm, setSlotEditForm] = useState({
    product_id: "",
    quantity: "",
    price: "",
  });

  // Config editing
  const [showConfigEditor, setShowConfigEditor] = useState(false);
  const [configJson, setConfigJson] = useState("");
  const [configError, setConfigError] = useState("");
  const [isSavingConfig, setIsSavingConfig] = useState(false);

  // Status update
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  const fetchMachine = useCallback(async () => {
    const { data } = await supabase
      .from("vending_machines")
      .select("*, organizations(id, name)")
      .eq("id", machineId)
      .single();

    if (data) {
      setMachine(data as unknown as VendingMachine);
      setConfigJson(JSON.stringify(data.config || {}, null, 2));
    }
  }, [supabase, machineId]);

  const fetchInventory = useCallback(async () => {
    const { data } = await supabase
      .from("vending_machine_inventory")
      .select("*, aura_products(id, name, image_url)")
      .eq("machine_id", machineId)
      .order("slot_number");

    setInventory((data as unknown as InventorySlot[]) || []);
  }, [supabase, machineId]);

  const fetchTransactions = useCallback(async () => {
    const offset = (txPage - 1) * PAGE_SIZE;

    const [txRes, countRes] = await Promise.all([
      supabase
        .from("vending_transactions")
        .select("*, aura_products(name)")
        .eq("machine_id", machineId)
        .order("created_at", { ascending: false })
        .range(offset, offset + PAGE_SIZE - 1),
      supabase
        .from("vending_transactions")
        .select("*", { count: "exact", head: true })
        .eq("machine_id", machineId),
    ]);

    setTransactions((txRes.data as unknown as Transaction[]) || []);
    setTxTotal(countRes.count || 0);
  }, [supabase, machineId, txPage]);

  const fetchQRRedemptions = useCallback(async () => {
    const { data } = await supabase
      .from("qr_redemptions")
      .select("*, aura_products(name)")
      .eq("machine_id", machineId)
      .order("created_at", { ascending: false })
      .limit(50);

    setQrRedemptions((data as unknown as QRRedemption[]) || []);
  }, [supabase, machineId]);

  const fetchProducts = useCallback(async () => {
    const { data } = await supabase
      .from("aura_products")
      .select("id, name, image_url, price")
      .order("name");

    setProducts((data as Product[]) || []);
  }, [supabase]);

  useEffect(() => {
    async function load() {
      setIsLoading(true);
      await Promise.all([
        fetchMachine(),
        fetchInventory(),
        fetchTransactions(),
        fetchQRRedemptions(),
        fetchProducts(),
      ]);
      setIsLoading(false);
    }
    load();
  }, [fetchMachine, fetchInventory, fetchTransactions, fetchQRRedemptions, fetchProducts]);

  useEffect(() => {
    fetchTransactions();
  }, [txPage, fetchTransactions]);

  const handleSetStatus = async (status: MachineStatus) => {
    setIsUpdatingStatus(true);
    await supabase
      .from("vending_machines")
      .update({ status, updated_at: new Date().toISOString() })
      .eq("id", machineId);
    await fetchMachine();
    setIsUpdatingStatus(false);
  };

  const handleRestockSlot = async (slotId: string, maxQty: number) => {
    await supabase
      .from("vending_machine_inventory")
      .update({
        quantity: maxQty,
        last_restocked: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", slotId);
    fetchInventory();
  };

  const handleRestockAll = async () => {
    const updates = inventory.map((slot) =>
      supabase
        .from("vending_machine_inventory")
        .update({
          quantity: slot.max_quantity,
          last_restocked: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", slot.id)
    );
    await Promise.all(updates);
    fetchInventory();
  };

  const handleEditSlot = (slot: InventorySlot) => {
    setEditingSlot(slot.id);
    setSlotEditForm({
      product_id: slot.product_id,
      quantity: String(slot.quantity),
      price: String(slot.price),
    });
  };

  const handleSaveSlot = async (slotId: string) => {
    await supabase
      .from("vending_machine_inventory")
      .update({
        product_id: slotEditForm.product_id,
        quantity: parseInt(slotEditForm.quantity, 10) || 0,
        price: parseFloat(slotEditForm.price) || 0,
        updated_at: new Date().toISOString(),
      })
      .eq("id", slotId);
    setEditingSlot(null);
    fetchInventory();
  };

  const handleSaveConfig = async () => {
    try {
      JSON.parse(configJson);
    } catch {
      setConfigError("Invalid JSON");
      return;
    }
    setIsSavingConfig(true);
    setConfigError("");
    await supabase
      .from("vending_machines")
      .update({
        config: JSON.parse(configJson),
        updated_at: new Date().toISOString(),
      })
      .eq("id", machineId);
    await fetchMachine();
    setIsSavingConfig(false);
    setShowConfigEditor(false);
  };

  function slotFillColor(quantity: number, maxQuantity: number): string {
    if (maxQuantity === 0 || quantity === 0) return "bg-gray-200";
    const ratio = quantity / maxQuantity;
    if (ratio > 0.5) return "bg-emerald-500";
    if (ratio > 0.25) return "bg-amber-500";
    return "bg-red-500";
  }

  function slotBorderColor(quantity: number, maxQuantity: number): string {
    if (maxQuantity === 0 || quantity === 0) return "border-gray-200";
    const ratio = quantity / maxQuantity;
    if (ratio > 0.5) return "border-emerald-200";
    if (ratio > 0.25) return "border-amber-200";
    return "border-red-200";
  }

  const txTotalPages = Math.ceil(txTotal / PAGE_SIZE);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-aura-primary" />
      </div>
    );
  }

  if (!machine) {
    return (
      <div className="text-center py-20">
        <h2 className="text-xl font-semibold text-gray-600 mb-2">
          Machine not found
        </h2>
        <Link href="/admin/vending">
          <Button variant="outline" leftIcon={<ArrowLeft className="w-4 h-4" />}>
            Back to Dashboard
          </Button>
        </Link>
      </div>
    );
  }

  const statusCfg = STATUS_CONFIG[machine.status];

  return (
    <div className="space-y-6">
      {/* Back + Header */}
      <div>
        <Link
          href="/admin/vending"
          className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-aura-primary transition-colors mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Vending Dashboard
        </Link>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div
              className={`w-4 h-4 rounded-full flex-shrink-0 ${statusCfg.dotColor}`}
            />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {machine.name}
              </h1>
              <div className="flex items-center gap-3 mt-1 text-sm text-gray-500">
                <span className="font-mono">{machine.machine_serial}</span>
                <span
                  className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${statusCfg.bgColor} ${statusCfg.color}`}
                >
                  {statusCfg.label}
                </span>
                {machine.organizations?.name && (
                  <span className="flex items-center gap-1">
                    <Package className="w-3.5 h-3.5" />
                    {machine.organizations.name}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Status Controls */}
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant={machine.status === "online" ? "primary" : "outline"}
              onClick={() => handleSetStatus("online")}
              isLoading={isUpdatingStatus}
              leftIcon={<Wifi className="w-3.5 h-3.5" />}
            >
              Online
            </Button>
            <Button
              size="sm"
              variant={machine.status === "offline" ? "danger" : "outline"}
              onClick={() => handleSetStatus("offline")}
              isLoading={isUpdatingStatus}
              leftIcon={<WifiOff className="w-3.5 h-3.5" />}
            >
              Offline
            </Button>
            <Button
              size="sm"
              variant={machine.status === "maintenance" ? "accent" : "outline"}
              onClick={() => handleSetStatus("maintenance")}
              isLoading={isUpdatingStatus}
              leftIcon={<Wrench className="w-3.5 h-3.5" />}
            >
              Maintenance
            </Button>
          </div>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="!bg-gray-900 !shadow-none border border-gray-800">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-500/10">
              <DollarSign className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wider">
                Total Sales
              </p>
              <p className="text-xl font-bold text-white">
                {formatCurrency(machine.total_sales || 0)}
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
                Transactions
              </p>
              <p className="text-xl font-bold text-white">
                {(machine.total_transactions || 0).toLocaleString()}
              </p>
            </div>
          </div>
        </Card>

        <Card className="!bg-gray-900 !shadow-none border border-gray-800">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-500/10">
              <Clock className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wider">
                Uptime
              </p>
              <p className="text-sm font-bold text-white">
                {uptimeText(machine.last_checkin)}
              </p>
            </div>
          </div>
        </Card>

        <Card className="!bg-gray-900 !shadow-none border border-gray-800">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gray-700">
              <Cpu className="w-5 h-5 text-gray-300" />
            </div>
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wider">
                Firmware
              </p>
              <p className="text-sm font-bold text-white">
                {machine.firmware_version || "N/A"}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Machine Info */}
      <Card>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-sm">
          <div>
            <p className="text-gray-400 text-xs mb-1 uppercase tracking-wider">
              Location
            </p>
            <p className="text-gray-700 flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-gray-400" />
              {machine.location || "Not set"}
            </p>
          </div>
          <div>
            <p className="text-gray-400 text-xs mb-1 uppercase tracking-wider">
              Coordinates
            </p>
            <p className="text-gray-700 font-mono text-xs">
              {machine.coordinates
                ? `${machine.coordinates.lat}, ${machine.coordinates.lng}`
                : "Not set"}
            </p>
          </div>
          <div>
            <p className="text-gray-400 text-xs mb-1 uppercase tracking-wider">
              Last Checkin
            </p>
            <p className="text-gray-700">
              {machine.last_checkin
                ? relativeTime(machine.last_checkin)
                : "Never"}
            </p>
          </div>
          <div>
            <p className="text-gray-400 text-xs mb-1 uppercase tracking-wider">
              Created
            </p>
            <p className="text-gray-700">{formatDate(machine.created_at)}</p>
          </div>
        </div>
      </Card>

      {/* Inventory Management */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-gray-900">
            Inventory Management
          </h2>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-3 text-xs text-gray-400">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500" /> &gt;50%
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-amber-500" /> 25-50%
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-red-500" /> &lt;25%
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-gray-300" /> Empty
              </span>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={handleRestockAll}
              leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
            >
              Restock All
            </Button>
          </div>
        </div>

        {inventory.length === 0 ? (
          <Card className="text-center py-12">
            <Package className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No inventory slots configured</p>
          </Card>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {inventory.map((slot) => {
              const isEditing = editingSlot === slot.id;

              return (
                <div
                  key={slot.id}
                  className={`rounded-xl border bg-white p-4 transition-all ${slotBorderColor(slot.quantity, slot.max_quantity)} ${isEditing ? "ring-2 ring-aura-primary" : ""}`}
                >
                  {isEditing ? (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-mono text-gray-400">
                          #{slot.slot_number}
                        </span>
                        <div className="flex gap-1">
                          <button
                            onClick={() => handleSaveSlot(slot.id)}
                            className="p-1 rounded hover:bg-emerald-50 text-emerald-600"
                            aria-label="Save"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setEditingSlot(null)}
                            className="p-1 rounded hover:bg-gray-100 text-gray-400"
                            aria-label="Cancel"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                      <select
                        value={slotEditForm.product_id}
                        onChange={(e) =>
                          setSlotEditForm({
                            ...slotEditForm,
                            product_id: e.target.value,
                          })
                        }
                        className="w-full text-xs border border-gray-200 rounded-lg px-2 py-1.5 bg-white"
                        aria-label="Select product"
                      >
                        <option value="">Select product</option>
                        {products.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name}
                          </option>
                        ))}
                      </select>
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="number"
                          placeholder="Qty"
                          value={slotEditForm.quantity}
                          onChange={(e) =>
                            setSlotEditForm({
                              ...slotEditForm,
                              quantity: e.target.value,
                            })
                          }
                          className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 w-full"
                          aria-label="Quantity"
                        />
                        <input
                          type="number"
                          step="0.01"
                          placeholder="Price"
                          value={slotEditForm.price}
                          onChange={(e) =>
                            setSlotEditForm({
                              ...slotEditForm,
                              price: e.target.value,
                            })
                          }
                          className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 w-full"
                          aria-label="Price"
                        />
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-mono text-gray-400">
                          #{slot.slot_number}
                        </span>
                        <div className="flex items-center gap-1">
                          <span className="text-xs font-semibold text-gray-700">
                            {formatCurrency(slot.price)}
                          </span>
                        </div>
                      </div>

                      {slot.aura_products?.image_url ? (
                        <img
                          src={slot.aura_products.image_url}
                          alt={slot.aura_products.name || "Product"}
                          className="w-full h-16 object-contain rounded-lg mb-2 bg-gray-50"
                        />
                      ) : (
                        <div className="w-full h-16 bg-gray-50 rounded-lg flex items-center justify-center mb-2">
                          <Package className="w-6 h-6 text-gray-300" />
                        </div>
                      )}

                      <p className="text-xs font-medium text-gray-700 truncate mb-2">
                        {slot.aura_products?.name || "Empty Slot"}
                      </p>

                      {/* Fill bar */}
                      <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden mb-1">
                        <div
                          className={`h-full rounded-full transition-all ${slotFillColor(slot.quantity, slot.max_quantity)}`}
                          style={{
                            width: `${slot.max_quantity > 0 ? (slot.quantity / slot.max_quantity) * 100 : 0}%`,
                          }}
                        />
                      </div>
                      <div className="flex items-center justify-between text-xs text-gray-400">
                        <span>
                          {slot.quantity}/{slot.max_quantity}
                        </span>
                        {slot.last_restocked && (
                          <span title={`Restocked: ${formatDate(slot.last_restocked)}`}>
                            {relativeTime(slot.last_restocked)}
                          </span>
                        )}
                      </div>

                      {/* Slot actions */}
                      <div className="flex items-center gap-1 mt-3 pt-2 border-t border-gray-100">
                        <button
                          onClick={() =>
                            handleRestockSlot(slot.id, slot.max_quantity)
                          }
                          className="flex-1 text-xs py-1 px-2 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors font-medium"
                        >
                          Restock
                        </button>
                        <button
                          onClick={() => handleEditSlot(slot)}
                          className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
                          aria-label="Edit slot"
                        >
                          <Edit2 className="w-3 h-3" />
                        </button>
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Transaction History */}
      <div>
        <h2 className="text-lg font-bold text-gray-900 mb-4">
          Transaction History
        </h2>
        {transactions.length === 0 ? (
          <Card className="text-center py-12">
            <Activity className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No transactions recorded</p>
          </Card>
        ) : (
          <Card padding="none">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-gray-400 border-b border-gray-100">
                    <th className="px-5 py-3">Product</th>
                    <th className="px-5 py-3">Slot</th>
                    <th className="px-5 py-3">Qty</th>
                    <th className="px-5 py-3">Price</th>
                    <th className="px-5 py-3">Payment</th>
                    <th className="px-5 py-3">Ref</th>
                    <th className="px-5 py-3">Time</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((tx) => (
                    <tr
                      key={tx.id}
                      className="border-b border-gray-50 last:border-0 hover:bg-gray-50"
                    >
                      <td className="px-5 py-3 text-gray-700 font-medium">
                        {tx.aura_products?.name || "Unknown"}
                      </td>
                      <td className="px-5 py-3 text-gray-500 font-mono">
                        #{tx.slot_number}
                      </td>
                      <td className="px-5 py-3 text-gray-500">{tx.quantity}</td>
                      <td className="px-5 py-3 text-gray-700 font-medium">
                        {formatCurrency(tx.price)}
                      </td>
                      <td className="px-5 py-3">
                        <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs capitalize">
                          {tx.payment_method || "N/A"}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-gray-400 font-mono text-xs truncate max-w-[120px]">
                        {tx.transaction_ref || "-"}
                      </td>
                      <td className="px-5 py-3 text-gray-400 text-xs whitespace-nowrap">
                        {relativeTime(tx.created_at)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {txTotalPages > 1 && (
              <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100">
                <p className="text-xs text-gray-500">
                  Showing {(txPage - 1) * PAGE_SIZE + 1}-
                  {Math.min(txPage * PAGE_SIZE, txTotal)} of {txTotal}
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setTxPage((p) => Math.max(1, p - 1))}
                    disabled={txPage === 1}
                    leftIcon={<ChevronLeft className="w-4 h-4" />}
                  >
                    Prev
                  </Button>
                  <span className="text-sm text-gray-600">
                    {txPage} / {txTotalPages}
                  </span>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      setTxPage((p) => Math.min(txTotalPages, p + 1))
                    }
                    disabled={txPage === txTotalPages}
                    rightIcon={<ChevronRight className="w-4 h-4" />}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </Card>
        )}
      </div>

      {/* QR Redemptions */}
      <div>
        <h2 className="text-lg font-bold text-gray-900 mb-4">
          QR Redemptions
        </h2>
        {qrRedemptions.length === 0 ? (
          <Card className="text-center py-12">
            <QrCode className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No QR redemptions for this machine</p>
          </Card>
        ) : (
          <Card padding="none">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-gray-400 border-b border-gray-100">
                    <th className="px-5 py-3">Code</th>
                    <th className="px-5 py-3">Product</th>
                    <th className="px-5 py-3">Status</th>
                    <th className="px-5 py-3">Expires</th>
                    <th className="px-5 py-3">Redeemed</th>
                    <th className="px-5 py-3">Created</th>
                  </tr>
                </thead>
                <tbody>
                  {qrRedemptions.map((qr) => (
                    <tr
                      key={qr.id}
                      className="border-b border-gray-50 last:border-0 hover:bg-gray-50"
                    >
                      <td className="px-5 py-3 font-mono text-xs text-gray-700">
                        {qr.code}
                      </td>
                      <td className="px-5 py-3 text-gray-700">
                        {qr.aura_products?.name || "-"}
                      </td>
                      <td className="px-5 py-3">
                        <span
                          className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                            qr.status === "redeemed"
                              ? "bg-emerald-100 text-emerald-700"
                              : qr.status === "pending"
                                ? "bg-blue-100 text-blue-700"
                                : "bg-gray-100 text-gray-500"
                          }`}
                        >
                          {qr.status}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-gray-400 text-xs">
                        {qr.expires_at ? relativeTime(qr.expires_at) : "-"}
                      </td>
                      <td className="px-5 py-3 text-gray-400 text-xs">
                        {qr.redeemed_at ? relativeTime(qr.redeemed_at) : "-"}
                      </td>
                      <td className="px-5 py-3 text-gray-400 text-xs">
                        {relativeTime(qr.created_at)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </div>

      {/* Machine Config */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-gray-900">
            Machine Configuration
          </h2>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setShowConfigEditor(!showConfigEditor)}
            leftIcon={<Settings className="w-3.5 h-3.5" />}
          >
            {showConfigEditor ? "Cancel" : "Edit Config"}
          </Button>
        </div>

        {showConfigEditor ? (
          <Card>
            <div className="space-y-3">
              {configError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
                  {configError}
                </div>
              )}
              <textarea
                value={configJson}
                onChange={(e) => {
                  setConfigJson(e.target.value);
                  setConfigError("");
                }}
                rows={12}
                className="w-full font-mono text-sm border border-gray-200 rounded-xl p-4 bg-gray-50 text-gray-800 focus:ring-2 focus:ring-aura-primary/20 focus:border-aura-primary outline-none resize-y"
                spellCheck={false}
              />
              <div className="flex justify-end">
                <Button
                  size="sm"
                  onClick={handleSaveConfig}
                  isLoading={isSavingConfig}
                  leftIcon={<Save className="w-3.5 h-3.5" />}
                >
                  Save Configuration
                </Button>
              </div>
            </div>
          </Card>
        ) : (
          <Card className="!bg-gray-900 !shadow-none border border-gray-800">
            <pre className="text-sm text-gray-300 font-mono overflow-x-auto whitespace-pre-wrap">
              {JSON.stringify(machine.config || {}, null, 2)}
            </pre>
          </Card>
        )}
      </div>
    </div>
  );
}
