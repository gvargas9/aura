import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Service-role client for direct DB access (bypasses RLS)
function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export interface VendingAuthResult {
  machine_id: string;
  machine_serial: string;
}

interface VendingAuthError {
  response: NextResponse;
}

/**
 * Validates X-Vending-API-Key header against vending_machines.api_key.
 * Uses service role client (RLS bypass).
 *
 * Migration note: Requires `api_key` TEXT UNIQUE column on `vending_machines`.
 * See supabase/migrations/007_vending_api_key.sql
 */
export async function requireVendingAuth(
  request: NextRequest
): Promise<VendingAuthResult | VendingAuthError> {
  const apiKey = request.headers.get("X-Vending-API-Key");

  if (!apiKey) {
    return {
      response: NextResponse.json(
        { success: false, error: "Missing X-Vending-API-Key header" },
        { status: 401 }
      ),
    };
  }

  const supabaseAdmin = getServiceClient();

  const { data: machine, error } = await supabaseAdmin
    .from("vending_machines")
    .select("id, serial_number, status")
    .eq("api_key", apiKey)
    .neq("status", "decommissioned")
    .single();

  if (error || !machine) {
    return {
      response: NextResponse.json(
        { success: false, error: "Invalid or inactive API key" },
        { status: 401 }
      ),
    };
  }

  return {
    machine_id: machine.id,
    machine_serial: machine.serial_number,
  };
}

export function isVendingAuthError(
  result: VendingAuthResult | VendingAuthError
): result is VendingAuthError {
  return "response" in result;
}
