"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/hooks";
import { Card, Button, Input } from "@/components/ui";
import {
  Loader2,
  Package,
  Send,
  RotateCcw,
  Plus,
  X,
  ChevronDown,
  ChevronUp,
  Search,
  Clock,
  CheckCircle,
  AlertTriangle,
} from "lucide-react";

interface Allocation {
  id: string;
  product_id: string;
  dealer_id: string;
  quantity_allocated: number;
  quantity_distributed: number;
  quantity_returned: number;
  status: string;
  lead_name: string | null;
  lead_email: string | null;
  notes: string | null;
  expires_at: string | null;
  allocated_by: string | null;
  created_at: string;
  updated_at: string;
  aura_products: { name: string; sku: string; image_url: string | null } | null;
  dealers: {
    business_name: string;
    profile_id: string;
    profiles: { full_name: string; email: string } | null;
  } | null;
}

interface SampleEvent {
  id: string;
  allocation_id: string;
  event_type: string;
  quantity: number;
  from_holder: string | null;
  to_holder: string | null;
  notes: string | null;
  created_at: string;
}

interface ProductOption {
  id: string;
  name: string;
  sku: string;
}

interface DealerOption {
  id: string;
  business_name: string;
  profiles: { full_name: string; email: string } | null;
}

export default function AdminSamplesPage() {
  const { profile } = useAuth();
  const supabase = createClient();

  const [allocations, setAllocations] = useState<Allocation[]>([]);
  const [allEvents, setAllEvents] = useState<SampleEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Allocation form
  const [showForm, setShowForm] = useState(false);
  const [products, setProducts] = useState<ProductOption[]>([]);
  const [dealers, setDealers] = useState<DealerOption[]>([]);
  const [formProductId, setFormProductId] = useState("");
  const [formDealerId, setFormDealerId] = useState("");
  const [formQty, setFormQty] = useState("5");
  const [formExpiry, setFormExpiry] = useState("");
  const [formNotes, setFormNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchAllocations = useCallback(async () => {
    if (!profile || profile.role !== "admin") return;
    setIsLoading(true);

    try {
      const res = await fetch("/api/samples");
      if (res.ok) {
        const json = await res.json();
        setAllocations(json.allocations ?? []);

        // Fetch events for all allocations
        const ids = (json.allocations ?? []).map((a: Allocation) => a.id);
        if (ids.length > 0) {
          const { data: eventsData } = await supabase
            .from("sample_events" as never)
            .select("*")
            .in("allocation_id", ids)
            .order("created_at", { ascending: false });
          setAllEvents((eventsData ?? []) as unknown as SampleEvent[]);
        }
      }
    } catch (error) {
      console.error("Failed to fetch allocations:", error);
    }

    setIsLoading(false);
  }, [profile, supabase]);

  const fetchFormOptions = useCallback(async () => {
    const { data: productsData } = await supabase
      .from("aura_products")
      .select("id, name, sku")
      .eq("is_active", true)
      .order("name");

    setProducts((productsData ?? []) as ProductOption[]);

    const { data: dealersData } = await supabase
      .from("dealers")
      .select("id, business_name, profiles(full_name, email)")
      .eq("is_active", true)
      .order("business_name");

    setDealers((dealersData ?? []) as unknown as DealerOption[]);
  }, [supabase]);

  useEffect(() => {
    fetchAllocations();
    fetchFormOptions();
  }, [fetchAllocations, fetchFormOptions]);

  // Summary stats
  const totalAllocations = allocations.length;
  const activeCount = allocations.filter((a) => a.status === "active").length;
  const totalSamples = allocations.reduce((s, a) => s + a.quantity_allocated, 0);
  const totalDistributed = allocations.reduce((s, a) => s + a.quantity_distributed, 0);

  const handleAllocate = async () => {
    setIsSubmitting(true);

    try {
      const res = await fetch("/api/samples", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          product_id: formProductId,
          dealer_id: formDealerId,
          quantity: parseInt(formQty) || 5,
          expires_at: formExpiry || undefined,
          notes: formNotes || undefined,
        }),
      });

      if (res.ok) {
        setShowForm(false);
        setFormProductId("");
        setFormDealerId("");
        setFormQty("5");
        setFormExpiry("");
        setFormNotes("");
        fetchAllocations();
      } else {
        const err = await res.json();
        alert(err.error || "Failed to allocate samples");
      }
    } catch {
      alert("Failed to allocate samples");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const config: Record<string, { color: string; icon: typeof CheckCircle }> = {
      active: { color: "text-green-700 bg-green-50", icon: CheckCircle },
      fully_distributed: { color: "text-blue-700 bg-blue-50", icon: Send },
      expired: { color: "text-amber-700 bg-amber-50", icon: AlertTriangle },
      returned: { color: "text-slate-700 bg-slate-50", icon: RotateCcw },
      cancelled: { color: "text-red-700 bg-red-50", icon: X },
    };
    const c = config[status] ?? config.active;
    const Icon = c.icon;
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${c.color}`}>
        <Icon className="w-3 h-3" />
        {status.replace("_", " ")}
      </span>
    );
  };

  const getEventIcon = (type: string) => {
    switch (type) {
      case "allocated": return <Package className="w-3.5 h-3.5 text-blue-500" />;
      case "distributed": return <Send className="w-3.5 h-3.5 text-green-500" />;
      case "returned": return <RotateCcw className="w-3.5 h-3.5 text-amber-500" />;
      default: return <Clock className="w-3.5 h-3.5 text-slate-400" />;
    }
  };

  // Filter allocations
  const filtered = search
    ? allocations.filter((a) => {
        const s = search.toLowerCase();
        return (
          (a.aura_products?.name ?? "").toLowerCase().includes(s) ||
          (a.dealers?.business_name ?? "").toLowerCase().includes(s) ||
          (a.lead_name ?? "").toLowerCase().includes(s)
        );
      })
    : allocations;

  return (
    <>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Samples</h1>
          <p className="text-gray-600">Allocate and track product samples for dealers</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)}>
          {showForm ? <X className="w-4 h-4 mr-1" /> : <Plus className="w-4 h-4 mr-1" />}
          {showForm ? "Cancel" : "Allocate Samples"}
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card padding="md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Allocations</p>
              <p className="text-2xl font-bold mt-1">{totalAllocations}</p>
            </div>
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Package className="w-5 h-5 text-blue-600" />
            </div>
          </div>
        </Card>
        <Card padding="md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Active</p>
              <p className="text-2xl font-bold mt-1 text-green-600">{activeCount}</p>
            </div>
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
          </div>
        </Card>
        <Card padding="md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Samples</p>
              <p className="text-2xl font-bold mt-1">{totalSamples}</p>
            </div>
            <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
              <Package className="w-5 h-5 text-indigo-600" />
            </div>
          </div>
        </Card>
        <Card padding="md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Distributed</p>
              <p className="text-2xl font-bold mt-1 text-blue-600">{totalDistributed}</p>
            </div>
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <Send className="w-5 h-5 text-purple-600" />
            </div>
          </div>
        </Card>
      </div>

      {/* Allocation Form */}
      {showForm && (
        <Card padding="md" className="mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">New Sample Allocation</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Product *</label>
              <select
                value={formProductId}
                onChange={(e) => setFormProductId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-aura-primary focus:border-transparent outline-none"
              >
                <option value="">Select product...</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.sku})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Dealer *</label>
              <select
                value={formDealerId}
                onChange={(e) => setFormDealerId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-aura-primary focus:border-transparent outline-none"
              >
                <option value="">Select dealer...</option>
                {dealers.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.business_name} ({d.profiles?.full_name ?? d.profiles?.email ?? ""})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Quantity *</label>
              <input
                type="number"
                min="1"
                value={formQty}
                onChange={(e) => setFormQty(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-aura-primary focus:border-transparent outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Expiry Date</label>
              <input
                type="date"
                value={formExpiry}
                onChange={(e) => setFormExpiry(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-aura-primary focus:border-transparent outline-none"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
              <input
                type="text"
                value={formNotes}
                onChange={(e) => setFormNotes(e.target.value)}
                placeholder="Optional notes..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-aura-primary focus:border-transparent outline-none"
              />
            </div>
          </div>
          <div className="flex justify-end mt-4">
            <Button
              onClick={handleAllocate}
              disabled={isSubmitting || !formProductId || !formDealerId}
            >
              {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Plus className="w-4 h-4 mr-1" />}
              Allocate
            </Button>
          </div>
        </Card>
      )}

      {/* Search */}
      <Card padding="md" className="mb-6">
        <Input
          placeholder="Search by product, dealer, or lead name..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          leftIcon={<Search className="w-4 h-4" />}
        />
      </Card>

      {/* Allocations Table */}
      <Card padding="none">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-6 h-6 animate-spin text-aura-primary" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 text-gray-500">
            <Package className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p className="font-medium">No sample allocations found</p>
            <p className="text-sm mt-1">Click &quot;Allocate Samples&quot; to create one.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b">
                  <th className="w-8 py-3 px-2"></th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Product</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Dealer</th>
                  <th className="text-right py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Alloc</th>
                  <th className="text-right py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Dist</th>
                  <th className="text-right py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Ret</th>
                  <th className="text-right py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Rem</th>
                  <th className="text-center py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map((alloc) => {
                  const remaining = alloc.quantity_allocated - alloc.quantity_distributed - alloc.quantity_returned;
                  const isExpanded = expandedId === alloc.id;
                  const allocEvents = allEvents.filter((e) => e.allocation_id === alloc.id);

                  return (
                    <>
                      <tr key={alloc.id} className="hover:bg-gray-50 transition-colors">
                        <td className="py-3 px-2">
                          <button
                            onClick={() => setExpandedId(isExpanded ? null : alloc.id)}
                            className="p-0.5 rounded hover:bg-gray-200 transition-colors"
                            aria-label={isExpanded ? "Collapse" : "Expand"}
                          >
                            {isExpanded ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                          </button>
                        </td>
                        <td className="py-3 px-4">
                          <p className="text-sm font-medium text-gray-900">{alloc.aura_products?.name ?? "Unknown"}</p>
                          <p className="text-xs text-gray-400">{alloc.aura_products?.sku ?? ""}</p>
                        </td>
                        <td className="py-3 px-4">
                          <p className="text-sm text-gray-900">{alloc.dealers?.business_name ?? "Unknown"}</p>
                          <p className="text-xs text-gray-400">{alloc.dealers?.profiles?.full_name ?? ""}</p>
                        </td>
                        <td className="py-3 px-4 text-right text-sm font-medium">{alloc.quantity_allocated}</td>
                        <td className="py-3 px-4 text-right text-sm text-blue-600">{alloc.quantity_distributed}</td>
                        <td className="py-3 px-4 text-right text-sm text-amber-600">{alloc.quantity_returned}</td>
                        <td className="py-3 px-4 text-right text-sm font-medium">
                          <span className={remaining > 0 ? "text-green-600" : "text-gray-400"}>{remaining}</span>
                        </td>
                        <td className="py-3 px-4 text-center">{getStatusBadge(alloc.status)}</td>
                        <td className="py-3 px-4 text-sm text-gray-500">
                          {new Date(alloc.created_at).toLocaleDateString()}
                        </td>
                      </tr>
                      {isExpanded && (
                        <tr key={`${alloc.id}-events`}>
                          <td colSpan={9} className="bg-gray-50 px-8 py-4">
                            <div className="text-sm font-medium text-gray-700 mb-2">Event History</div>
                            {allocEvents.length === 0 ? (
                              <p className="text-xs text-gray-400">No events recorded.</p>
                            ) : (
                              <div className="space-y-2 pl-2 border-l-2 border-gray-200">
                                {allocEvents.map((evt) => (
                                  <div key={evt.id} className="flex items-start gap-2 text-xs">
                                    {getEventIcon(evt.event_type)}
                                    <div>
                                      <span className="font-medium text-gray-700 capitalize">{evt.event_type}</span>
                                      {evt.quantity > 0 && <span className="text-gray-500"> ({evt.quantity} units)</span>}
                                      {evt.to_holder && <span className="text-gray-500"> to {evt.to_holder}</span>}
                                      {evt.notes && <span className="text-gray-400"> - {evt.notes}</span>}
                                      <span className="text-gray-300 ml-2">{new Date(evt.created_at).toLocaleString()}</span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                            {alloc.notes && (
                              <div className="mt-3 text-xs text-gray-500">
                                <span className="font-medium">Notes:</span> {alloc.notes}
                              </div>
                            )}
                          </td>
                        </tr>
                      )}
                    </>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </>
  );
}
