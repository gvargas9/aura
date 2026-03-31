"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { useDealerContext } from "../layout";
import { Card, Button, Input } from "@/components/ui";
import {
  Loader2,
  Package,
  Send,
  RotateCcw,
  X,
  CheckCircle,
  Clock,
  AlertTriangle,
  User,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

interface SampleAllocation {
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
  created_at: string;
  updated_at: string;
  aura_products: {
    name: string;
    sku: string;
    image_url: string | null;
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

export default function DealerSamplesPage() {
  const { dealer } = useDealerContext();
  const supabase = createClient();

  const [allocations, setAllocations] = useState<SampleAllocation[]>([]);
  const [events, setEvents] = useState<SampleEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Modals
  const [distributeModal, setDistributeModal] = useState<SampleAllocation | null>(null);
  const [returnModal, setReturnModal] = useState<SampleAllocation | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Distribute form
  const [distQty, setDistQty] = useState("1");
  const [distLeadName, setDistLeadName] = useState("");
  const [distLeadEmail, setDistLeadEmail] = useState("");
  const [distNotes, setDistNotes] = useState("");

  // Return form
  const [returnQty, setReturnQty] = useState("1");
  const [returnNotes, setReturnNotes] = useState("");

  const fetchData = useCallback(async () => {
    if (!dealer) return;
    setIsLoading(true);

    const { data: allocData } = await supabase
      .from("sample_allocations" as never)
      .select("*, aura_products(name, sku, image_url)")
      .eq("dealer_id", dealer.id)
      .order("created_at", { ascending: false });

    const allocs = (allocData ?? []) as unknown as SampleAllocation[];
    setAllocations(allocs);

    // Fetch events for all allocations
    if (allocs.length > 0) {
      const ids = allocs.map((a) => a.id);
      const { data: eventsData } = await supabase
        .from("sample_events" as never)
        .select("*")
        .in("allocation_id", ids)
        .order("created_at", { ascending: false });

      setEvents((eventsData ?? []) as unknown as SampleEvent[]);
    }

    setIsLoading(false);
  }, [dealer, supabase]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Summary stats
  const totalAllocated = allocations.reduce((s, a) => s + a.quantity_allocated, 0);
  const totalWithMe = allocations.reduce(
    (s, a) => s + (a.quantity_allocated - a.quantity_distributed - a.quantity_returned),
    0
  );
  const totalDistributed = allocations.reduce((s, a) => s + a.quantity_distributed, 0);
  const totalReturned = allocations.reduce((s, a) => s + a.quantity_returned, 0);

  const handleDistribute = async () => {
    if (!distributeModal) return;
    setIsSubmitting(true);

    try {
      const res = await fetch("/api/samples/distribute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          allocation_id: distributeModal.id,
          quantity: parseInt(distQty) || 1,
          lead_name: distLeadName,
          lead_email: distLeadEmail || undefined,
          notes: distNotes || undefined,
        }),
      });

      if (res.ok) {
        setDistributeModal(null);
        setDistQty("1");
        setDistLeadName("");
        setDistLeadEmail("");
        setDistNotes("");
        fetchData();
      } else {
        const err = await res.json();
        alert(err.error || "Failed to distribute samples");
      }
    } catch {
      alert("Failed to distribute samples");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReturn = async () => {
    if (!returnModal) return;
    setIsSubmitting(true);

    try {
      const res = await fetch("/api/samples/return", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          allocation_id: returnModal.id,
          quantity: parseInt(returnQty) || 1,
          notes: returnNotes || undefined,
        }),
      });

      if (res.ok) {
        setReturnModal(null);
        setReturnQty("1");
        setReturnNotes("");
        fetchData();
      } else {
        const err = await res.json();
        alert(err.error || "Failed to return samples");
      }
    } catch {
      alert("Failed to return samples");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const config: Record<string, { color: string; icon: typeof CheckCircle }> = {
      active: { color: "text-green-700 bg-green-50 border-green-200", icon: CheckCircle },
      fully_distributed: { color: "text-blue-700 bg-blue-50 border-blue-200", icon: Send },
      expired: { color: "text-amber-700 bg-amber-50 border-amber-200", icon: AlertTriangle },
      returned: { color: "text-slate-700 bg-slate-50 border-slate-200", icon: RotateCcw },
      cancelled: { color: "text-red-700 bg-red-50 border-red-200", icon: X },
    };
    const c = config[status] ?? config.active;
    const Icon = c.icon;
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${c.color}`}>
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Sample Management</h1>
        <p className="text-slate-600 mt-1">Track and distribute product samples to your leads</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card padding="md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">Total Allocated</p>
              <p className="text-2xl font-bold mt-1">{totalAllocated}</p>
            </div>
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Package className="w-5 h-5 text-blue-600" />
            </div>
          </div>
        </Card>
        <Card padding="md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">With Me</p>
              <p className="text-2xl font-bold mt-1 text-green-600">{totalWithMe}</p>
            </div>
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
          </div>
        </Card>
        <Card padding="md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">Distributed</p>
              <p className="text-2xl font-bold mt-1 text-blue-600">{totalDistributed}</p>
            </div>
            <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
              <Send className="w-5 h-5 text-indigo-600" />
            </div>
          </div>
        </Card>
        <Card padding="md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">Returned</p>
              <p className="text-2xl font-bold mt-1 text-amber-600">{totalReturned}</p>
            </div>
            <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
              <RotateCcw className="w-5 h-5 text-amber-600" />
            </div>
          </div>
        </Card>
      </div>

      {/* Allocations Table */}
      <Card padding="none">
        {allocations.length === 0 ? (
          <div className="text-center py-20 text-slate-500">
            <Package className="w-12 h-12 mx-auto mb-3 text-slate-300" />
            <p className="font-medium">No sample allocations yet</p>
            <p className="text-sm mt-1">Your admin will allocate samples to you.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Product</th>
                  <th className="text-right py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Allocated</th>
                  <th className="text-right py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Remaining</th>
                  <th className="text-center py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Lead</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Date</th>
                  <th className="text-right py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {allocations.map((alloc) => {
                  const remaining = alloc.quantity_allocated - alloc.quantity_distributed - alloc.quantity_returned;
                  const isExpanded = expandedId === alloc.id;
                  const allocEvents = events.filter((e) => e.allocation_id === alloc.id);

                  return (
                    <tr key={alloc.id} className="group">
                      <td className="py-3 px-4" colSpan={7}>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3 min-w-0">
                            <button
                              onClick={() => setExpandedId(isExpanded ? null : alloc.id)}
                              className="p-0.5 rounded hover:bg-slate-100 transition-colors"
                              aria-label={isExpanded ? "Collapse" : "Expand"}
                            >
                              {isExpanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                            </button>
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-slate-900 truncate">
                                {alloc.aura_products?.name ?? "Unknown Product"}
                              </p>
                              <p className="text-xs text-slate-400">{alloc.aura_products?.sku ?? ""}</p>
                            </div>
                          </div>

                          <div className="flex items-center gap-6 text-sm">
                            <div className="text-right">
                              <span className="text-slate-500">{alloc.quantity_allocated}</span>
                            </div>
                            <div className="text-right">
                              <span className={remaining > 0 ? "font-medium text-green-600" : "text-slate-400"}>{remaining}</span>
                            </div>
                            <div>{getStatusBadge(alloc.status)}</div>
                            <div className="w-28 truncate">
                              {alloc.lead_name ? (
                                <span className="flex items-center gap-1 text-slate-600">
                                  <User className="w-3 h-3" />
                                  {alloc.lead_name}
                                </span>
                              ) : (
                                <span className="text-slate-300">--</span>
                              )}
                            </div>
                            <div className="text-slate-500 text-xs">
                              {new Date(alloc.created_at).toLocaleDateString()}
                            </div>
                            <div className="flex items-center gap-1">
                              {alloc.status === "active" && remaining > 0 && (
                                <>
                                  <button
                                    onClick={() => {
                                      setDistributeModal(alloc);
                                      setDistQty("1");
                                    }}
                                    className="px-2.5 py-1.5 text-xs font-medium text-blue-700 bg-blue-50 rounded-md hover:bg-blue-100 transition-colors"
                                  >
                                    Give to Lead
                                  </button>
                                  <button
                                    onClick={() => {
                                      setReturnModal(alloc);
                                      setReturnQty("1");
                                    }}
                                    className="px-2.5 py-1.5 text-xs font-medium text-amber-700 bg-amber-50 rounded-md hover:bg-amber-100 transition-colors"
                                  >
                                    Return
                                  </button>
                                </>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Expanded event timeline */}
                        {isExpanded && allocEvents.length > 0 && (
                          <div className="mt-3 ml-8 pl-4 border-l-2 border-slate-200 space-y-2">
                            {allocEvents.map((evt) => (
                              <div key={evt.id} className="flex items-start gap-2 text-xs">
                                {getEventIcon(evt.event_type)}
                                <div>
                                  <span className="font-medium text-slate-700 capitalize">{evt.event_type}</span>
                                  {evt.quantity > 0 && <span className="text-slate-500"> ({evt.quantity} units)</span>}
                                  {evt.to_holder && <span className="text-slate-500"> to {evt.to_holder}</span>}
                                  {evt.notes && <span className="text-slate-400"> - {evt.notes}</span>}
                                  <span className="text-slate-300 ml-2">
                                    {new Date(evt.created_at).toLocaleString()}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Distribute Modal */}
      {distributeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setDistributeModal(null)} />
          <div className="relative bg-white rounded-xl shadow-xl w-full max-w-md mx-4 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-slate-900">Give Samples to Lead</h3>
              <button onClick={() => setDistributeModal(null)} className="p-1 rounded hover:bg-slate-100" aria-label="Close">
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>
            <p className="text-sm text-slate-500 mb-4">
              {distributeModal.aura_products?.name} &mdash;{" "}
              {distributeModal.quantity_allocated - distributeModal.quantity_distributed - distributeModal.quantity_returned} available
            </p>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Quantity</label>
                <input
                  type="number"
                  min="1"
                  max={distributeModal.quantity_allocated - distributeModal.quantity_distributed - distributeModal.quantity_returned}
                  value={distQty}
                  onChange={(e) => setDistQty(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Lead Name *</label>
                <input
                  type="text"
                  value={distLeadName}
                  onChange={(e) => setDistLeadName(e.target.value)}
                  placeholder="Contact name"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Lead Email</label>
                <input
                  type="email"
                  value={distLeadEmail}
                  onChange={(e) => setDistLeadEmail(e.target.value)}
                  placeholder="contact@example.com"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Notes</label>
                <textarea
                  value={distNotes}
                  onChange={(e) => setDistNotes(e.target.value)}
                  placeholder="Optional notes..."
                  rows={2}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-5">
              <Button variant="secondary" onClick={() => setDistributeModal(null)}>
                Cancel
              </Button>
              <Button
                onClick={handleDistribute}
                disabled={isSubmitting || !distLeadName.trim()}
              >
                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Send className="w-4 h-4 mr-1" />}
                Distribute
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Return Modal */}
      {returnModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setReturnModal(null)} />
          <div className="relative bg-white rounded-xl shadow-xl w-full max-w-md mx-4 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-slate-900">Return Samples</h3>
              <button onClick={() => setReturnModal(null)} className="p-1 rounded hover:bg-slate-100" aria-label="Close">
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>
            <p className="text-sm text-slate-500 mb-4">
              {returnModal.aura_products?.name} &mdash;{" "}
              {returnModal.quantity_allocated - returnModal.quantity_distributed - returnModal.quantity_returned} returnable
            </p>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Quantity</label>
                <input
                  type="number"
                  min="1"
                  max={returnModal.quantity_allocated - returnModal.quantity_distributed - returnModal.quantity_returned}
                  value={returnQty}
                  onChange={(e) => setReturnQty(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Notes</label>
                <textarea
                  value={returnNotes}
                  onChange={(e) => setReturnNotes(e.target.value)}
                  placeholder="Reason for return..."
                  rows={2}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-5">
              <Button variant="secondary" onClick={() => setReturnModal(null)}>
                Cancel
              </Button>
              <Button onClick={handleReturn} disabled={isSubmitting}>
                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <RotateCcw className="w-4 h-4 mr-1" />}
                Return
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
