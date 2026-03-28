import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireAuth, isAuthError } from "@/lib/api/auth";
import { getRates, isUsingMockProvider } from "@/lib/shipping/client";
import {
  WAREHOUSE_ADDRESS,
  getPackageWeight,
  getPackageDimensions,
} from "@/lib/shipping/warehouse";
import type { ShippingAddress, ShipmentRate } from "@/lib/shipping/types";
import type { ApiResponse } from "@/types";

// ---------------------------------------------------------------------------
// POST /api/shipping/rates
//
// Returns available carrier rates for a given destination address and
// optional package specification. Used in checkout to show shipping options.
// ---------------------------------------------------------------------------

interface RatesRequestBody {
  shippingAddress: {
    name?: string;
    firstName?: string;
    lastName?: string;
    address1?: string;
    street1?: string;
    address2?: string;
    street2?: string;
    city: string;
    state: string;
    zipCode?: string;
    zip?: string;
    country?: string;
    phone?: string;
    email?: string;
  };
  boxSize?: string;
  itemCount?: number;
  weight?: number;
}

function normalizeAddress(raw: RatesRequestBody["shippingAddress"]): ShippingAddress {
  const name =
    raw.name ?? ([raw.firstName, raw.lastName].filter(Boolean).join(" ") || "Customer");

  return {
    name,
    street1: raw.street1 ?? raw.address1 ?? "",
    street2: raw.street2 ?? raw.address2,
    city: raw.city,
    state: raw.state,
    zip: raw.zip ?? raw.zipCode ?? "",
    country: raw.country ?? "US",
    phone: raw.phone,
    email: raw.email,
  };
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const auth = await requireAuth(supabase);

    if (isAuthError(auth)) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: auth.error },
        { status: auth.status }
      );
    }

    const body: RatesRequestBody = await request.json();

    if (!body.shippingAddress || !body.shippingAddress.city || !body.shippingAddress.state) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "Shipping address with city and state is required" },
        { status: 400 }
      );
    }

    const zip = body.shippingAddress.zip ?? body.shippingAddress.zipCode;
    if (!zip) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "Zip code is required" },
        { status: 400 }
      );
    }

    const destination = normalizeAddress(body.shippingAddress);

    // Determine package weight and dimensions
    const boxSize = body.boxSize ?? "starter";
    const itemCount = body.itemCount ?? 8;
    const weight = body.weight ?? getPackageWeight(boxSize, itemCount);
    const dimensions = getPackageDimensions(boxSize);

    const rates = await getRates(WAREHOUSE_ADDRESS, destination, weight, dimensions);

    return NextResponse.json<ApiResponse<{ rates: ShipmentRate[]; mock: boolean }>>({
      success: true,
      data: {
        rates,
        mock: isUsingMockProvider(),
      },
    });
  } catch (error) {
    console.error("Shipping rates error:", error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: "Failed to fetch shipping rates" },
      { status: 500 }
    );
  }
}
