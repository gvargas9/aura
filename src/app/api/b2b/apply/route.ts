import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { full_name, email, phone, organization_name, business_type, message } = body;

    if (!full_name || !email || !organization_name || !business_type) {
      return NextResponse.json(
        { error: "Missing required fields: full_name, email, organization_name, business_type" },
        { status: 400 }
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Invalid email address format" },
        { status: 400 }
      );
    }

    // Use service role client to bypass RLS for admin-level insert
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Check if a profile with this email already exists
    const { data: existingProfile } = await supabase
      .from("profiles")
      .select("id, role")
      .eq("email", email)
      .maybeSingle();

    if (existingProfile) {
      if (existingProfile.role === "dealer") {
        return NextResponse.json(
          { error: "An account with this email is already a dealer." },
          { status: 409 }
        );
      }

      // Store application metadata on existing profile for admin review
      await supabase
        .from("profiles")
        .update({
          address: {
            dealer_application: {
              organization_name,
              business_type,
              phone: phone || null,
              message: message || null,
              applied_at: new Date().toISOString(),
              status: "pending_review",
            },
          },
        })
        .eq("id", existingProfile.id);

      return NextResponse.json({
        success: true,
        message: "Application received. We will review your existing account.",
      });
    }

    // For new applicants, store application data in the omni_interaction_log
    // as a structured record for admin review
    await supabase.from("omni_interaction_log").insert({
      channel: "b2b_application",
      direction: "inbound",
      content: JSON.stringify({
        full_name,
        email,
        phone: phone || null,
        organization_name,
        business_type,
        message: message || null,
      }),
      metadata: {
        type: "dealer_application",
        status: "pending_review",
        applied_at: new Date().toISOString(),
      },
    });

    return NextResponse.json({
      success: true,
      message: "Application received successfully.",
    });
  } catch (err) {
    console.error("B2B application error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
