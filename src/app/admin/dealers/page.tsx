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
import type { Dealer, Profile, Organization } from "@/types";
import {
  Search,
  Eye,
  Users,
  Loader2,
  UserCheck,
  DollarSign,
  TrendingUp,
  Copy,
  Download,
  CheckCircle,
} from "lucide-react";

interface DealerWithDetails extends Dealer {
  profile?: Profile | null;
  organization?: Organization | null;
}

export default function AdminDealersPage() {
  const [dealers, setDealers] = useState<DealerWithDetails[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [tierFilter, setTierFilter] = useState<string>("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalDealers, setTotalDealers] = useState(0);
  const [selectedDealer, setSelectedDealer] = useState<DealerWithDetails | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const pageSize = 10;
  const supabase = createClient();

  const fetchDealers = async () => {
    setIsLoading(true);
    let query = supabase
      .from("dealers")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false });

    const from = (currentPage - 1) * pageSize;
    const to = from + pageSize - 1;
    query = query.range(from, to);

    const { data, count, error } = await query;

    if (!error && data) {
      // Fetch profile and organization for each dealer
      const withDetails = await Promise.all(
        data.map(async (dealer) => {
          const { data: profile } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", dealer.profile_id)
            .single();

          const { data: organization } = await supabase
            .from("organizations")
            .select("*")
            .eq("id", dealer.organization_id)
            .single();

          return { ...dealer, profile, organization };
        })
      );

      // Apply search filter
      let filtered = withDetails;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        filtered = filtered.filter(
          (d) =>
            d.profile?.full_name?.toLowerCase().includes(q) ||
            d.profile?.email?.toLowerCase().includes(q) ||
            d.organization?.name?.toLowerCase().includes(q) ||
            d.referral_code.toLowerCase().includes(q)
        );
      }
      if (tierFilter) {
        filtered = filtered.filter((d) => d.organization?.dealer_tier === tierFilter);
      }

      setDealers(filtered);
      setTotalDealers(count || 0);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchDealers();
  }, [currentPage, searchQuery, tierFilter]);

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const totalPages = Math.ceil(totalDealers / pageSize);

  // Calculate stats
  const totalCommissionEarned = dealers.reduce((sum, d) => sum + d.commission_earned, 0);
  const totalCommissionPaid = dealers.reduce((sum, d) => sum + d.commission_paid, 0);
  const activeDealers = dealers.filter((d) => d.is_active).length;

  const tierColors: Record<string, "default" | "success" | "warning" | "error" | "info" | "primary" | "secondary"> = {
    bronze: "default",
    silver: "info",
    gold: "warning",
    platinum: "secondary",
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Dealers</h1>
            <p className="text-gray-500">Manage your dealer network</p>
          </div>
          <Button variant="outline" leftIcon={<Download className="w-4 h-4" />}>
            Export
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card padding="md">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <UserCheck className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totalDealers}</p>
                <p className="text-sm text-gray-500">Total Dealers</p>
              </div>
            </div>
          </Card>
          <Card padding="md">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{activeDealers}</p>
                <p className="text-sm text-gray-500">Active</p>
              </div>
            </div>
          </Card>
          <Card padding="md">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{formatCurrency(totalCommissionEarned)}</p>
                <p className="text-sm text-gray-500">Total Earned</p>
              </div>
            </div>
          </Card>
          <Card padding="md">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-aura-primary/10 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-aura-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{formatCurrency(totalCommissionPaid)}</p>
                <p className="text-sm text-gray-500">Total Paid</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Filters */}
        <Card padding="md">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Input
                placeholder="Search by name, email, or referral code..."
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
                { value: "", label: "All Tiers" },
                { value: "bronze", label: "Bronze" },
                { value: "silver", label: "Silver" },
                { value: "gold", label: "Gold" },
                { value: "platinum", label: "Platinum" },
              ]}
              value={tierFilter}
              onChange={(v) => {
                setTierFilter(v);
                setCurrentPage(1);
              }}
              className="w-full sm:w-40"
            />
          </div>
        </Card>

        {/* Dealers Table */}
        <Card>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-aura-primary" />
            </div>
          ) : dealers.length === 0 ? (
            <EmptyState
              icon={Users}
              title="No dealers found"
              description="Dealers will appear here once they sign up"
            />
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Dealer</TableHead>
                    <TableHead>Organization</TableHead>
                    <TableHead>Tier</TableHead>
                    <TableHead>Referral Code</TableHead>
                    <TableHead>Commission Earned</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {dealers.map((dealer) => (
                    <TableRow key={dealer.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar
                            src={dealer.profile?.avatar_url}
                            fallback={dealer.profile?.full_name || dealer.profile?.email}
                            size="md"
                          />
                          <div>
                            <p className="font-medium text-gray-900">
                              {dealer.profile?.full_name || "No name"}
                            </p>
                            <p className="text-sm text-gray-500">{dealer.profile?.email}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <p className="font-medium">{dealer.organization?.name || "-"}</p>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={tierColors[dealer.organization?.dealer_tier || "bronze"]}
                          size="md"
                        >
                          <span className="capitalize">
                            {dealer.organization?.dealer_tier || "bronze"}
                          </span>
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <code className="px-2 py-1 bg-gray-100 rounded text-sm">
                            {dealer.referral_code}
                          </code>
                          <button
                            onClick={() => copyCode(dealer.referral_code)}
                            className="p-1 text-gray-400 hover:text-gray-600"
                          >
                            {copiedCode === dealer.referral_code ? (
                              <CheckCircle className="w-4 h-4 text-green-500" />
                            ) : (
                              <Copy className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">
                        {formatCurrency(dealer.commission_earned)}
                      </TableCell>
                      <TableCell>
                        <Badge variant={dealer.is_active ? "success" : "default"}>
                          {dealer.is_active ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => setSelectedDealer(dealer)}
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

      {/* Dealer Details Modal */}
      <Modal
        isOpen={!!selectedDealer}
        onClose={() => setSelectedDealer(null)}
        title="Dealer Details"
        size="lg"
      >
        {selectedDealer && (
          <div className="space-y-6">
            {/* Dealer Info */}
            <div className="flex items-start gap-4">
              <Avatar
                src={selectedDealer.profile?.avatar_url}
                fallback={selectedDealer.profile?.full_name || selectedDealer.profile?.email}
                size="xl"
              />
              <div className="flex-1">
                <h3 className="text-xl font-semibold">
                  {selectedDealer.profile?.full_name || "No name"}
                </h3>
                <p className="text-gray-500">{selectedDealer.profile?.email}</p>
                <div className="flex items-center gap-2 mt-2">
                  <Badge
                    variant={tierColors[selectedDealer.organization?.dealer_tier || "bronze"]}
                  >
                    <span className="capitalize">
                      {selectedDealer.organization?.dealer_tier} Tier
                    </span>
                  </Badge>
                  <Badge variant={selectedDealer.is_active ? "success" : "default"}>
                    {selectedDealer.is_active ? "Active" : "Inactive"}
                  </Badge>
                </div>
              </div>
            </div>

            {/* Organization */}
            {selectedDealer.organization && (
              <div className="p-4 bg-gray-50 rounded-xl">
                <h4 className="font-semibold mb-2">Organization</h4>
                <p className="font-medium">{selectedDealer.organization.name}</p>
                <p className="text-sm text-gray-500">{selectedDealer.organization.contact_email}</p>
                <p className="text-sm text-gray-500 mt-1">
                  Commission Rate: {(selectedDealer.organization.commission_rate * 100).toFixed(0)}%
                </p>
              </div>
            )}

            {/* Stats */}
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 border border-gray-200 rounded-xl text-center">
                <p className="text-2xl font-bold">
                  {formatCurrency(selectedDealer.commission_earned)}
                </p>
                <p className="text-sm text-gray-500">Total Earned</p>
              </div>
              <div className="p-4 border border-gray-200 rounded-xl text-center">
                <p className="text-2xl font-bold">
                  {formatCurrency(selectedDealer.commission_paid)}
                </p>
                <p className="text-sm text-gray-500">Total Paid</p>
              </div>
              <div className="p-4 border border-gray-200 rounded-xl text-center">
                <p className="text-2xl font-bold">
                  {formatCurrency(selectedDealer.commission_earned - selectedDealer.commission_paid)}
                </p>
                <p className="text-sm text-gray-500">Pending Payout</p>
              </div>
              <div className="p-4 border border-gray-200 rounded-xl text-center">
                <p className="text-2xl font-bold">{formatDate(selectedDealer.created_at)}</p>
                <p className="text-sm text-gray-500">Member Since</p>
              </div>
            </div>

            {/* Referral Code */}
            <div>
              <h4 className="font-semibold mb-2">Referral Code</h4>
              <div className="flex items-center gap-3">
                <code className="flex-1 px-4 py-3 bg-gray-100 rounded-xl text-lg font-mono">
                  {selectedDealer.referral_code}
                </code>
                <Button
                  variant="outline"
                  onClick={() => copyCode(selectedDealer.referral_code)}
                  leftIcon={
                    copiedCode === selectedDealer.referral_code ? (
                      <CheckCircle className="w-4 h-4" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )
                  }
                >
                  {copiedCode === selectedDealer.referral_code ? "Copied!" : "Copy"}
                </Button>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </AdminLayout>
  );
}
