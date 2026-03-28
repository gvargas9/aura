"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/hooks";
import { Card, Button, Input } from "@/components/ui";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { DealerTier } from "@/types/database";
import {
  Search,
  Loader2,
  Plus,
  Edit2,
  X,
  Save,
  Handshake,
  Building,
  Users,
  ChevronDown,
  ChevronUp,
  ToggleLeft,
  ToggleRight,
  DollarSign,
} from "lucide-react";

interface OrganizationRow {
  id: string;
  name: string;
  logo_url: string | null;
  dealer_tier: DealerTier;
  commission_rate: number;
  contact_email: string;
  contact_phone: string | null;
  is_active?: boolean;
  created_at: string;
  dealer_count?: number;
}

interface DealerRow {
  id: string;
  profile_id: string;
  organization_id: string;
  referral_code: string;
  commission_earned: number;
  commission_paid: number;
  is_active: boolean;
  created_at: string;
  profile_name: string;
  profile_email: string;
  organization_name: string;
}

const TIERS: DealerTier[] = ["bronze", "silver", "gold", "platinum"];

function tierBadgeClass(tier: string): string {
  switch (tier) {
    case "platinum":
      return "bg-purple-100 text-purple-700";
    case "gold":
      return "bg-amber-100 text-amber-700";
    case "silver":
      return "bg-gray-200 text-gray-700";
    default:
      return "bg-orange-100 text-orange-700";
  }
}

type OrgFormData = {
  name: string;
  contact_email: string;
  contact_phone: string;
  dealer_tier: DealerTier;
  commission_rate: string;
  logo_url: string;
};

const emptyOrgForm: OrgFormData = {
  name: "",
  contact_email: "",
  contact_phone: "",
  dealer_tier: "bronze",
  commission_rate: "10",
  logo_url: "",
};

export default function AdminDealersPage() {
  const { profile } = useAuth();
  const supabase = createClient();

  // Organizations
  const [organizations, setOrganizations] = useState<OrganizationRow[]>([]);
  const [orgsLoading, setOrgsLoading] = useState(true);
  const [orgSearch, setOrgSearch] = useState("");

  // Organization modal
  const [showOrgModal, setShowOrgModal] = useState(false);
  const [editingOrg, setEditingOrg] = useState<OrganizationRow | null>(null);
  const [orgForm, setOrgForm] = useState<OrgFormData>(emptyOrgForm);
  const [orgSaving, setOrgSaving] = useState(false);
  const [orgError, setOrgError] = useState("");

  // Dealers
  const [dealers, setDealers] = useState<DealerRow[]>([]);
  const [dealersLoading, setDealersLoading] = useState(true);
  const [dealerSearch, setDealerSearch] = useState("");

  // Expanded dealer
  const [expandedDealerId, setExpandedDealerId] = useState<string | null>(null);
  const [dealerOrders, setDealerOrders] = useState<{ count: number; total: number }>({ count: 0, total: 0 });
  const [dealerDetailLoading, setDealerDetailLoading] = useState(false);

  const fetchOrganizations = useCallback(async () => {
    if (!profile || profile.role !== "admin") return;
    setOrgsLoading(true);

    const { data: orgsData, error: orgsError } = await supabase
      .from("organizations")
      .select("*")
      .order("created_at", { ascending: false });

    if (orgsError) {
      console.error("Error fetching organizations:", orgsError);
      setOrganizations([]);
    } else {
      // Get dealer counts per org
      const { data: dealerCounts } = await supabase
        .from("dealers")
        .select("organization_id");

      const countMap: Record<string, number> = {};
      (dealerCounts || []).forEach((d: { organization_id: string }) => {
        countMap[d.organization_id] = (countMap[d.organization_id] || 0) + 1;
      });

      const orgs: OrganizationRow[] = (orgsData || []).map((org) => ({
        ...org,
        is_active: true,
        dealer_count: countMap[org.id] || 0,
      }));

      setOrganizations(orgs);
    }
    setOrgsLoading(false);
  }, [profile, supabase]);

  const fetchDealers = useCallback(async () => {
    if (!profile || profile.role !== "admin") return;
    setDealersLoading(true);

    const { data: dealersData, error: dealersError } = await supabase
      .from("dealers")
      .select("*, profiles(full_name, email), organizations(name)")
      .order("created_at", { ascending: false });

    if (dealersError) {
      console.error("Error fetching dealers:", dealersError);
      // Fallback without join hints
      const { data: fallbackData } = await supabase
        .from("dealers")
        .select("*")
        .order("created_at", { ascending: false });

      setDealers(
        (fallbackData || []).map((d) => ({
          ...d,
          profile_name: "Unknown",
          profile_email: "",
          organization_name: "",
          commission_paid: d.commission_paid || 0,
        }))
      );
    } else {
      setDealers(
        (dealersData || []).map((d: Record<string, unknown>) => {
          const prof = d.profiles as { full_name: string | null; email: string } | null;
          const org = d.organizations as { name: string } | null;
          return {
            id: d.id as string,
            profile_id: d.profile_id as string,
            organization_id: d.organization_id as string,
            referral_code: d.referral_code as string,
            commission_earned: d.commission_earned as number,
            commission_paid: d.commission_paid as number,
            is_active: d.is_active as boolean,
            created_at: d.created_at as string,
            profile_name: prof?.full_name || "No name",
            profile_email: prof?.email || "",
            organization_name: org?.name || "Unknown",
          };
        })
      );
    }
    setDealersLoading(false);
  }, [profile, supabase]);

  useEffect(() => {
    fetchOrganizations();
    fetchDealers();
  }, [fetchOrganizations, fetchDealers]);

  // Organization modal handlers
  const openCreateOrg = () => {
    setEditingOrg(null);
    setOrgForm(emptyOrgForm);
    setOrgError("");
    setShowOrgModal(true);
  };

  const openEditOrg = (org: OrganizationRow) => {
    setEditingOrg(org);
    setOrgForm({
      name: org.name,
      contact_email: org.contact_email,
      contact_phone: org.contact_phone || "",
      dealer_tier: org.dealer_tier,
      commission_rate: String(org.commission_rate),
      logo_url: org.logo_url || "",
    });
    setOrgError("");
    setShowOrgModal(true);
  };

  const handleSaveOrg = async () => {
    if (!orgForm.name || !orgForm.contact_email) {
      setOrgError("Name and contact email are required.");
      return;
    }

    setOrgSaving(true);
    setOrgError("");

    const payload = {
      name: orgForm.name,
      contact_email: orgForm.contact_email,
      contact_phone: orgForm.contact_phone || null,
      dealer_tier: orgForm.dealer_tier,
      commission_rate: parseFloat(orgForm.commission_rate) || 10,
      logo_url: orgForm.logo_url || null,
    };

    if (editingOrg) {
      const { error } = await supabase
        .from("organizations")
        .update(payload)
        .eq("id", editingOrg.id);

      if (error) {
        setOrgError(error.message);
        setOrgSaving(false);
        return;
      }
    } else {
      const { error } = await supabase
        .from("organizations")
        .insert(payload);

      if (error) {
        setOrgError(error.message);
        setOrgSaving(false);
        return;
      }
    }

    setOrgSaving(false);
    setShowOrgModal(false);
    fetchOrganizations();
  };

  // Dealer toggle
  const toggleDealerActive = async (dealer: DealerRow) => {
    const { error } = await supabase
      .from("dealers")
      .update({ is_active: !dealer.is_active })
      .eq("id", dealer.id);

    if (error) {
      alert("Failed to update dealer: " + error.message);
    } else {
      fetchDealers();
    }
  };

  // Expand dealer
  const toggleDealerExpand = async (dealer: DealerRow) => {
    if (expandedDealerId === dealer.id) {
      setExpandedDealerId(null);
      return;
    }

    setExpandedDealerId(dealer.id);
    setDealerDetailLoading(true);

    // Fetch orders attributed to this dealer
    const { data: orders, count } = await supabase
      .from("aura_orders")
      .select("total", { count: "exact" })
      .eq("dealer_attribution_id", dealer.id);

    const totalRevenue = (orders || []).reduce((sum, o: { total: number }) => sum + o.total, 0);
    setDealerOrders({ count: count || 0, total: totalRevenue });
    setDealerDetailLoading(false);
  };

  // Filter organizations
  const filteredOrgs = organizations.filter((org) => {
    if (!orgSearch) return true;
    const s = orgSearch.toLowerCase();
    return org.name.toLowerCase().includes(s) || org.contact_email.toLowerCase().includes(s);
  });

  // Filter dealers
  const filteredDealers = dealers.filter((d) => {
    if (!dealerSearch) return true;
    const s = dealerSearch.toLowerCase();
    return (
      d.profile_name.toLowerCase().includes(s) ||
      d.profile_email.toLowerCase().includes(s) ||
      d.referral_code.toLowerCase().includes(s) ||
      d.organization_name.toLowerCase().includes(s)
    );
  });

  return (
    <>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Dealers</h1>
        <p className="text-gray-600">Manage dealer organizations and individual dealers</p>
      </div>

      {/* Organizations Section */}
      <div className="mb-10">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
            <Building className="w-5 h-5 text-gray-400" />
            Organizations
          </h2>
          <Button size="sm" onClick={openCreateOrg} leftIcon={<Plus className="w-4 h-4" />}>
            Add Organization
          </Button>
        </div>

        <Card padding="none">
          <div className="p-4 border-b">
            <Input
              placeholder="Search organizations..."
              value={orgSearch}
              onChange={(e) => setOrgSearch(e.target.value)}
              leftIcon={<Search className="w-4 h-4" />}
            />
          </div>

          {orgsLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-aura-primary" />
            </div>
          ) : filteredOrgs.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Building className="w-10 h-10 mx-auto mb-2 text-gray-300" />
              <p className="font-medium">No organizations found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b">
                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Organization
                    </th>
                    <th className="text-center py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Tier
                    </th>
                    <th className="text-right py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Commission %
                    </th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Contact
                    </th>
                    <th className="text-center py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Dealers
                    </th>
                    <th className="text-right py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredOrgs.map((org) => (
                    <tr key={org.id} className="hover:bg-gray-50 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded bg-gray-100 flex items-center justify-center flex-shrink-0">
                            {org.logo_url ? (
                              <img
                                src={org.logo_url}
                                alt=""
                                className="w-full h-full object-cover rounded"
                              />
                            ) : (
                              <Building className="w-4 h-4 text-gray-400" />
                            )}
                          </div>
                          <span className="font-medium text-gray-900 text-sm">{org.name}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${tierBadgeClass(
                            org.dealer_tier
                          )}`}
                        >
                          {org.dealer_tier}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right text-sm font-medium">
                        {org.commission_rate}%
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600">
                        {org.contact_email}
                      </td>
                      <td className="py-3 px-4 text-center text-sm">
                        <span className="inline-flex items-center gap-1">
                          <Users className="w-3 h-3 text-gray-400" />
                          {org.dealer_count}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => openEditOrg(org)}
                          className="p-1.5 text-gray-400 hover:text-aura-primary hover:bg-aura-primary/10 rounded transition-colors"
                          aria-label={`Edit ${org.name}`}
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>

      {/* Dealers Section */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2 mb-4">
          <Handshake className="w-5 h-5 text-gray-400" />
          Individual Dealers
        </h2>

        <Card padding="none">
          <div className="p-4 border-b">
            <Input
              placeholder="Search dealers by name, email, referral code, or organization..."
              value={dealerSearch}
              onChange={(e) => setDealerSearch(e.target.value)}
              leftIcon={<Search className="w-4 h-4" />}
            />
          </div>

          {dealersLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-aura-primary" />
            </div>
          ) : filteredDealers.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Handshake className="w-10 h-10 mx-auto mb-2 text-gray-300" />
              <p className="font-medium">No dealers found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b">
                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Dealer
                    </th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Organization
                    </th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Referral Code
                    </th>
                    <th className="text-right py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Earned
                    </th>
                    <th className="text-right py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Paid
                    </th>
                    <th className="text-right py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Pending
                    </th>
                    <th className="text-center py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="py-3 px-4 w-10"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredDealers.map((dealer) => {
                    const pending = dealer.commission_earned - dealer.commission_paid;
                    return (
                      <>
                        <tr
                          key={dealer.id}
                          className="hover:bg-gray-50 transition-colors cursor-pointer"
                          onClick={() => toggleDealerExpand(dealer)}
                        >
                          <td className="py-3 px-4">
                            <div>
                              <p className="text-sm font-medium text-gray-900">
                                {dealer.profile_name}
                              </p>
                              <p className="text-xs text-gray-500">{dealer.profile_email}</p>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-sm text-gray-600">
                            {dealer.organization_name}
                          </td>
                          <td className="py-3 px-4">
                            <code className="text-sm font-mono bg-gray-100 px-2 py-0.5 rounded">
                              {dealer.referral_code}
                            </code>
                          </td>
                          <td className="py-3 px-4 text-right text-sm font-medium text-green-600">
                            {formatCurrency(dealer.commission_earned)}
                          </td>
                          <td className="py-3 px-4 text-right text-sm text-gray-600">
                            {formatCurrency(dealer.commission_paid)}
                          </td>
                          <td className="py-3 px-4 text-right text-sm font-medium">
                            <span className={pending > 0 ? "text-amber-600" : "text-gray-500"}>
                              {formatCurrency(pending)}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-center">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleDealerActive(dealer);
                              }}
                              className="inline-flex items-center gap-1"
                              aria-label={`${dealer.is_active ? "Deactivate" : "Activate"} dealer`}
                            >
                              {dealer.is_active ? (
                                <>
                                  <ToggleRight className="w-5 h-5 text-green-600" />
                                  <span className="text-xs text-green-600 font-medium">Active</span>
                                </>
                              ) : (
                                <>
                                  <ToggleLeft className="w-5 h-5 text-gray-400" />
                                  <span className="text-xs text-gray-500 font-medium">Inactive</span>
                                </>
                              )}
                            </button>
                          </td>
                          <td className="py-3 px-4">
                            {expandedDealerId === dealer.id ? (
                              <ChevronUp className="w-4 h-4 text-gray-400" />
                            ) : (
                              <ChevronDown className="w-4 h-4 text-gray-400" />
                            )}
                          </td>
                        </tr>

                        {/* Expanded dealer detail */}
                        {expandedDealerId === dealer.id && (
                          <tr key={`${dealer.id}-detail`}>
                            <td colSpan={8} className="bg-gray-50 px-6 py-4">
                              {dealerDetailLoading ? (
                                <div className="flex items-center justify-center py-6">
                                  <Loader2 className="w-5 h-5 animate-spin text-aura-primary" />
                                </div>
                              ) : (
                                <div className="grid sm:grid-cols-3 gap-4">
                                  <div className="bg-white p-4 rounded-lg">
                                    <p className="text-xs text-gray-500 mb-1">Referred Orders</p>
                                    <p className="text-2xl font-bold">{dealerOrders.count}</p>
                                  </div>
                                  <div className="bg-white p-4 rounded-lg">
                                    <p className="text-xs text-gray-500 mb-1">Total Revenue Generated</p>
                                    <p className="text-2xl font-bold">
                                      {formatCurrency(dealerOrders.total)}
                                    </p>
                                  </div>
                                  <div className="bg-white p-4 rounded-lg">
                                    <p className="text-xs text-gray-500 mb-1">Joined</p>
                                    <p className="text-lg font-semibold">
                                      {formatDate(dealer.created_at)}
                                    </p>
                                  </div>
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
      </div>

      {/* Organization Modal */}
      {showOrgModal && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-10 px-4">
          <div
            className="fixed inset-0 bg-black/50"
            onClick={() => setShowOrgModal(false)}
            aria-hidden="true"
          />
          <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-lg z-10">
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <h2 className="text-xl font-semibold">
                {editingOrg ? "Edit Organization" : "Add Organization"}
              </h2>
              <button
                onClick={() => setShowOrgModal(false)}
                className="p-1 hover:bg-gray-100 rounded"
                aria-label="Close modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {orgError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                  {orgError}
                </div>
              )}

              <Input
                label="Organization Name *"
                value={orgForm.name}
                onChange={(e) => setOrgForm({ ...orgForm, name: e.target.value })}
                placeholder="e.g., Premier Distribution"
              />

              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Contact Email *"
                  type="email"
                  value={orgForm.contact_email}
                  onChange={(e) => setOrgForm({ ...orgForm, contact_email: e.target.value })}
                  placeholder="email@example.com"
                />
                <Input
                  label="Contact Phone"
                  value={orgForm.contact_phone}
                  onChange={(e) => setOrgForm({ ...orgForm, contact_phone: e.target.value })}
                  placeholder="(555) 123-4567"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Dealer Tier
                  </label>
                  <select
                    value={orgForm.dealer_tier}
                    onChange={(e) =>
                      setOrgForm({ ...orgForm, dealer_tier: e.target.value as DealerTier })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-aura-primary focus:border-transparent outline-none"
                    aria-label="Dealer tier"
                  >
                    {TIERS.map((t) => (
                      <option key={t} value={t}>
                        {t.charAt(0).toUpperCase() + t.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>
                <Input
                  label="Commission Rate (%)"
                  type="number"
                  step="0.5"
                  value={orgForm.commission_rate}
                  onChange={(e) => setOrgForm({ ...orgForm, commission_rate: e.target.value })}
                  placeholder="10"
                />
              </div>

              <Input
                label="Logo URL"
                value={orgForm.logo_url}
                onChange={(e) => setOrgForm({ ...orgForm, logo_url: e.target.value })}
                placeholder="https://..."
              />
            </div>

            <div className="px-6 py-4 border-t flex justify-end gap-3">
              <Button variant="outline" onClick={() => setShowOrgModal(false)}>
                Cancel
              </Button>
              <Button onClick={handleSaveOrg} isLoading={orgSaving}>
                {editingOrg ? "Save Changes" : "Create Organization"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
