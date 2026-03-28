import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";

function getServiceClient() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { amount } = body;

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      return NextResponse.json(
        { error: "Amount must be a positive number" },
        { status: 400 }
      );
    }

    const serviceClient = getServiceClient();

    // Get user's current credit balance
    const { data: profile, error: profileError } = await serviceClient
      .from("profiles")
      .select("credits")
      .eq("id", user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json(
        { error: "Failed to retrieve credit balance" },
        { status: 500 }
      );
    }

    const availableCredits = profile.credits || 0;

    if (availableCredits <= 0) {
      return NextResponse.json(
        { error: "You have no credits available" },
        { status: 400 }
      );
    }

    if (parsedAmount > availableCredits) {
      return NextResponse.json(
        {
          error: `Insufficient credits. You have ${availableCredits.toFixed(2)} credits available.`,
        },
        { status: 400 }
      );
    }

    // Return the validated amount and remaining balance
    // Actual deduction happens during checkout processing (in the checkout API or webhook)
    const applied = Math.min(parsedAmount, availableCredits);
    const remainingCredits = availableCredits - applied;

    return NextResponse.json({
      success: true,
      applied,
      remainingCredits,
    });
  } catch (error) {
    console.error("Apply credits error:", error);
    return NextResponse.json(
      { error: "Failed to apply credits" },
      { status: 500 }
    );
  }
}
