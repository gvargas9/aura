"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/hooks";
import { Card, Button, Input } from "@/components/ui";
import { formatDate, formatCurrency } from "@/lib/utils";
import {
  MapPin,
  Plus,
  Loader2,
  Building2,
  Dumbbell,
  Ship,
  Truck,
  Monitor,
  Store,
  ChevronDown,
  ChevronUp,
  ShoppingCart,
  Package,
  X,
  Check,
  AlertCircle,
  Edit3,
  Trash2,
} from "lucide-react";
import type { Dealer, Organization, Order, Json } from "@/types";

interface OrgLocation {
  id: string;
  organization_id: string;
  name: string;
  location_type: string;
  address: {
    address1?: string;
    address2?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    country?: string;
  } | null;
  contact_name: string | null;
  contact_phone: string | null;
  delivery_schedule: string | null;
  preferred_delivery_day: string | null;
  is_active: boolean;
  metadata: Json | null;
  created_at: string;
  updated_at: string;
}

const LOCATION_TYPES = [
  { value: "gym", label: "Gym / Fitness", icon: Dumbbell, color: "text-blue-600 bg-blue-100" },
  { value: "marina", label: "Marina", icon: Ship, color: "text-cyan-600 bg-cyan-100" },
  { value: "food_truck", label: "Food Truck", icon: Truck, color: "text-orange-600 bg-orange-100" },
  { value: "vending_zone", label: "Vending Zone", icon: Monitor, color: "text-purple-600 bg-purple-100" },
  { value: "retail", label: "Retail Store", icon: Store, color: "text-emerald-600 bg-emerald-100" },
  { value: "office", label: "Office", icon: Building2, color: "text-slate-600 bg-slate-100" },
  { value: "warehouse", label: "Warehouse", icon: Package, color: "text-amber-600 bg-amber-100" },
];

function getLocationType(type: string) {
  return LOCATION_TYPES.find((t) => t.value === type) || LOCATION_TYPES[5];
}

export default function LocationsPage() {
  const { user, profile } = useAuth();
  const [dealer, setDealer] = useState<Dealer | null>(null);
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [locations, setLocations] = useState<OrgLocation[]>([]);
  const [locationOrders, setLocationOrders] = useState<Record<string, Order[]>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [expandedLocation, setExpandedLocation] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    locationType: "gym",
    address1: "",
    address2: "",
    city: "",
    state: "",
    zipCode: "",
    country: "US",
    contactName: "",
    contactPhone: "",
    deliverySchedule: "",
    preferredDay: "",
  });

  const supabase = createClient();

  const fetchData = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);

    const { data: dealerData } = await supabase
      .from("dealers")
      .select("*")
      .eq("profile_id", user.id)
      .maybeSingle();

    if (!dealerData) {
      setIsLoading(false);
      return;
    }

    setDealer(dealerData as Dealer);
    const orgId = dealerData.organization_id;

    if (!orgId) {
      setIsLoading(false);
      return;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabaseAny = supabase as any;

    const [orgResult, locationsResult] = await Promise.all([
      supabase.from("organizations").select("*").eq("id", orgId).single(),
      supabaseAny
        .from("organization_locations")
        .select("*")
        .eq("organization_id", orgId)
        .order("created_at", { ascending: false }),
    ]);

    if (orgResult.data) setOrganization(orgResult.data as Organization);

    if (locationsResult.data) {
      const locs = locationsResult.data as OrgLocation[];
      setLocations(locs);

      // Fetch orders for each location
      if (locs.length > 0) {
        const orderMap: Record<string, Order[]> = {};
        const { data: allOrders } = await supabase
          .from("aura_orders")
          .select("*")
          .eq("organization_id", orgId)
          .order("created_at", { ascending: false })
          .limit(100);

        if (allOrders) {
          // Group orders by shipping address matching location addresses
          locs.forEach((loc) => {
            orderMap[loc.id] = (allOrders as Order[]).filter((o) => {
              const addr = o.shipping_address as Record<string, string> | null;
              if (!addr || !loc.address) return false;
              return (
                addr.city?.toLowerCase() === loc.address.city?.toLowerCase() &&
                addr.state?.toLowerCase() === loc.address.state?.toLowerCase()
              );
            });
          });
        }
        setLocationOrders(orderMap);
      }
    }

    setIsLoading(false);
  }, [user, supabase]);

  useEffect(() => {
    if (user && (profile?.role === "dealer" || profile?.role === "admin")) {
      fetchData();
    } else if (user && profile) {
      setIsLoading(false);
    }
  }, [user, profile, fetchData]);

  const handleAddLocation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dealer?.organization_id) return;

    if (!formData.name || !formData.city || !formData.state) {
      setSubmitError("Please fill in the location name, city, and state.");
      return;
    }

    setIsSubmitting(true);
    setSubmitError("");

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any)
      .from("organization_locations")
      .insert({
        organization_id: dealer.organization_id,
        name: formData.name,
        location_type: formData.locationType,
        address: {
          address1: formData.address1,
          address2: formData.address2,
          city: formData.city,
          state: formData.state,
          zipCode: formData.zipCode,
          country: formData.country,
        },
        contact_name: formData.contactName || null,
        contact_phone: formData.contactPhone || null,
        delivery_schedule: formData.deliverySchedule || null,
        preferred_delivery_day: formData.preferredDay || null,
        is_active: true,
      })
      .select()
      .single();

    if (error) {
      setSubmitError("Failed to add location. Please try again.");
      setIsSubmitting(false);
      return;
    }

    if (data) {
      setLocations((prev) => [data as unknown as OrgLocation, ...prev]);
    }

    setSubmitSuccess(true);
    setIsSubmitting(false);

    setTimeout(() => {
      setShowAddForm(false);
      setSubmitSuccess(false);
      setFormData({
        name: "",
        locationType: "gym",
        address1: "",
        address2: "",
        city: "",
        state: "",
        zipCode: "",
        country: "US",
        contactName: "",
        contactPhone: "",
        deliverySchedule: "",
        preferredDay: "",
      });
    }, 1500);
  };

  const handleOrderForLocation = (location: OrgLocation) => {
    if (!location.address) return;
    // Pre-fill cart shipping address with location data and redirect to orders
    const addrData = {
      firstName: location.contact_name?.split(" ")[0] || "",
      lastName: location.contact_name?.split(" ").slice(1).join(" ") || "",
      address1: location.address.address1 || "",
      address2: location.address.address2 || "",
      city: location.address.city || "",
      state: location.address.state || "",
      zipCode: location.address.zipCode || "",
      country: location.address.country || "US",
      phone: location.contact_phone || "",
    };
    localStorage.setItem("aura_b2b_ship_to", JSON.stringify(addrData));
    window.location.href = "/b2b/portal/products";
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8 gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-slate-900">
            Locations
          </h1>
          <p className="text-slate-500 mt-1">
            Manage your delivery locations and order per site
          </p>
        </div>
        <Button
          variant="primary"
          className="bg-blue-600 hover:bg-blue-700 focus:ring-blue-600 flex-shrink-0"
          onClick={() => setShowAddForm(!showAddForm)}
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Location
        </Button>
      </div>

      {/* Add Location Form */}
      {showAddForm && (
        <Card padding="lg" className="border border-blue-200 bg-blue-50/30 shadow-sm mb-8">
          {submitSuccess ? (
            <div className="text-center py-6">
              <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-3">
                <Check className="w-6 h-6 text-emerald-600" />
              </div>
              <p className="text-sm font-medium text-slate-900">
                Location added successfully
              </p>
            </div>
          ) : (
            <form onSubmit={handleAddLocation}>
              <h2 className="text-lg font-semibold text-slate-900 mb-5">
                Add New Location
              </h2>

              {/* Location Type Selection */}
              <div className="mb-5">
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Location Type
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
                  {LOCATION_TYPES.map((type) => {
                    const isSelected = formData.locationType === type.value;
                    return (
                      <button
                        key={type.value}
                        type="button"
                        onClick={() =>
                          setFormData((p) => ({ ...p, locationType: type.value }))
                        }
                        className={`flex flex-col items-center gap-1.5 p-3 rounded-lg border-2 transition-all text-sm ${
                          isSelected
                            ? "border-blue-600 bg-blue-50"
                            : "border-slate-200 hover:border-slate-300 bg-white"
                        }`}
                      >
                        <div
                          className={`w-8 h-8 rounded-lg flex items-center justify-center ${type.color}`}
                        >
                          <type.icon className="w-4 h-4" />
                        </div>
                        <span
                          className={`text-xs font-medium ${
                            isSelected ? "text-blue-700" : "text-slate-600"
                          }`}
                        >
                          {type.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4 mb-5">
                <Input
                  label="Location Name *"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData((p) => ({ ...p, name: e.target.value }))
                  }
                  placeholder="e.g. Downtown Gym, Marina Pier 7"
                  required
                  className="focus:ring-blue-600"
                />
                <Input
                  label="Contact Name"
                  value={formData.contactName}
                  onChange={(e) =>
                    setFormData((p) => ({ ...p, contactName: e.target.value }))
                  }
                  placeholder="Site manager name"
                  className="focus:ring-blue-600"
                />
              </div>

              <div className="grid sm:grid-cols-2 gap-4 mb-5">
                <div className="sm:col-span-2">
                  <Input
                    label="Street Address"
                    value={formData.address1}
                    onChange={(e) =>
                      setFormData((p) => ({ ...p, address1: e.target.value }))
                    }
                    placeholder="123 Main St"
                    className="focus:ring-blue-600"
                  />
                </div>
                <Input
                  label="City *"
                  value={formData.city}
                  onChange={(e) =>
                    setFormData((p) => ({ ...p, city: e.target.value }))
                  }
                  required
                  className="focus:ring-blue-600"
                />
                <Input
                  label="State *"
                  value={formData.state}
                  onChange={(e) =>
                    setFormData((p) => ({ ...p, state: e.target.value }))
                  }
                  required
                  className="focus:ring-blue-600"
                />
                <Input
                  label="ZIP Code"
                  value={formData.zipCode}
                  onChange={(e) =>
                    setFormData((p) => ({ ...p, zipCode: e.target.value }))
                  }
                  className="focus:ring-blue-600"
                />
                <Input
                  label="Contact Phone"
                  value={formData.contactPhone}
                  onChange={(e) =>
                    setFormData((p) => ({ ...p, contactPhone: e.target.value }))
                  }
                  type="tel"
                  placeholder="(555) 123-4567"
                  className="focus:ring-blue-600"
                />
              </div>

              <div className="grid sm:grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Delivery Schedule
                  </label>
                  <select
                    value={formData.deliverySchedule}
                    onChange={(e) =>
                      setFormData((p) => ({
                        ...p,
                        deliverySchedule: e.target.value,
                      }))
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none appearance-none"
                  >
                    <option value="">Select schedule...</option>
                    <option value="weekly">Weekly</option>
                    <option value="bi-weekly">Bi-Weekly</option>
                    <option value="monthly">Monthly</option>
                    <option value="on-demand">On Demand</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Preferred Delivery Day
                  </label>
                  <select
                    value={formData.preferredDay}
                    onChange={(e) =>
                      setFormData((p) => ({
                        ...p,
                        preferredDay: e.target.value,
                      }))
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none appearance-none"
                  >
                    <option value="">Any day</option>
                    <option value="monday">Monday</option>
                    <option value="tuesday">Tuesday</option>
                    <option value="wednesday">Wednesday</option>
                    <option value="thursday">Thursday</option>
                    <option value="friday">Friday</option>
                  </select>
                </div>
              </div>

              {submitError && (
                <div className="flex items-center gap-2 text-red-600 text-sm mb-4">
                  <AlertCircle className="w-4 h-4" />
                  {submitError}
                </div>
              )}

              <div className="flex gap-3">
                <Button
                  type="submit"
                  variant="primary"
                  className="bg-blue-600 hover:bg-blue-700 focus:ring-blue-600"
                  isLoading={isSubmitting}
                >
                  Add Location
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowAddForm(false)}
                >
                  Cancel
                </Button>
              </div>
            </form>
          )}
        </Card>
      )}

      {/* Locations List */}
      {locations.length > 0 ? (
        <div className="space-y-4">
          {locations.map((location) => {
            const typeConfig = getLocationType(location.location_type);
            const TypeIcon = typeConfig.icon;
            const isExpanded = expandedLocation === location.id;
            const locOrders = locationOrders[location.id] || [];
            const locRevenue = locOrders.reduce((s, o) => s + o.total, 0);

            return (
              <Card
                key={location.id}
                padding="none"
                className="border border-slate-200 shadow-sm overflow-hidden"
              >
                <button
                  onClick={() =>
                    setExpandedLocation(isExpanded ? null : location.id)
                  }
                  className="w-full flex items-center gap-4 p-4 text-left hover:bg-slate-50 transition-colors"
                  aria-expanded={isExpanded}
                >
                  <div
                    className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${typeConfig.color}`}
                  >
                    <TypeIcon className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-slate-900">
                        {location.name}
                      </p>
                      {!location.is_active && (
                        <span className="text-xs bg-red-100 text-red-600 px-1.5 py-0.5 rounded">
                          Inactive
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500">
                      {location.address
                        ? [
                            location.address.address1,
                            location.address.city,
                            location.address.state,
                            location.address.zipCode,
                          ]
                            .filter(Boolean)
                            .join(", ")
                        : "No address set"}
                      {location.delivery_schedule &&
                        ` | ${location.delivery_schedule}`}
                    </p>
                  </div>
                  <div className="hidden sm:block text-right mr-2">
                    <p className="text-sm font-medium text-slate-900">
                      {locOrders.length} orders
                    </p>
                    <p className="text-xs text-slate-500">
                      {formatCurrency(locRevenue)} revenue
                    </p>
                  </div>
                  {isExpanded ? (
                    <ChevronUp className="w-4 h-4 text-slate-400 flex-shrink-0" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-slate-400 flex-shrink-0" />
                  )}
                </button>

                {isExpanded && (
                  <div className="border-t border-slate-100 bg-slate-50 p-4">
                    {/* Location details */}
                    <div className="grid sm:grid-cols-3 gap-4 mb-4">
                      <div>
                        <p className="text-xs text-slate-500 font-medium">
                          Type
                        </p>
                        <p className="text-sm text-slate-900 capitalize">
                          {location.location_type.replace("_", " ")}
                        </p>
                      </div>
                      {location.contact_name && (
                        <div>
                          <p className="text-xs text-slate-500 font-medium">
                            Contact
                          </p>
                          <p className="text-sm text-slate-900">
                            {location.contact_name}
                          </p>
                        </div>
                      )}
                      {location.contact_phone && (
                        <div>
                          <p className="text-xs text-slate-500 font-medium">
                            Phone
                          </p>
                          <p className="text-sm text-slate-900">
                            {location.contact_phone}
                          </p>
                        </div>
                      )}
                      {location.delivery_schedule && (
                        <div>
                          <p className="text-xs text-slate-500 font-medium">
                            Delivery Schedule
                          </p>
                          <p className="text-sm text-slate-900 capitalize">
                            {location.delivery_schedule}
                            {location.preferred_delivery_day &&
                              ` (${location.preferred_delivery_day})`}
                          </p>
                        </div>
                      )}
                      <div>
                        <p className="text-xs text-slate-500 font-medium">
                          Added
                        </p>
                        <p className="text-sm text-slate-900">
                          {formatDate(location.created_at)}
                        </p>
                      </div>
                    </div>

                    {/* Location order history */}
                    {locOrders.length > 0 && (
                      <div className="mb-4">
                        <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                          Recent Orders
                        </h4>
                        <div className="bg-white rounded-lg border border-slate-200 divide-y divide-slate-50">
                          {locOrders.slice(0, 5).map((order) => (
                            <div
                              key={order.id}
                              className="px-3 py-2 flex items-center justify-between text-sm"
                            >
                              <div>
                                <span className="font-medium text-slate-900">
                                  {order.order_number ||
                                    `#${order.id.slice(0, 8)}`}
                                </span>
                                <span className="text-slate-500 ml-2">
                                  {formatDate(order.created_at)}
                                </span>
                              </div>
                              <span className="font-medium text-slate-900">
                                {formatCurrency(order.total)}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleOrderForLocation(location)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-blue-700 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors border border-blue-100"
                      >
                        <ShoppingCart className="w-3.5 h-3.5" />
                        Order for this Location
                      </button>
                    </div>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      ) : (
        <Card padding="lg" className="border border-slate-200 shadow-sm">
          <div className="text-center py-12">
            <MapPin className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-slate-900 mb-1">
              No Locations Yet
            </h3>
            <p className="text-sm text-slate-500 mb-4">
              Add your delivery locations to streamline ordering for multiple
              sites.
            </p>
            <Button
              variant="primary"
              className="bg-blue-600 hover:bg-blue-700 focus:ring-blue-600"
              onClick={() => setShowAddForm(true)}
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Your First Location
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}
