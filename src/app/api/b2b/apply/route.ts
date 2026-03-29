import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { applyRateLimit, rateLimiters } from "@/lib/api/rate-limit";
import { validateEmail, validatePhone, sanitizeString, enforceMaxLength } from "@/lib/api/validation";
import { safeError } from "@/lib/api/safe-error";

export async function POST(request: NextRequest) {
  try {
    // Rate limit: 3 requests/minute (B2B applications are infrequent)
    const rateLimitResponse = await applyRateLimit(request, rateLimiters.b2bApply);
    if (rateLimitResponse) return rateLimitResponse;

    const body = await request.json();
    const { full_name, email, phone, organization_name, business_type, message } = body;

    if (!full_name || !email || !organization_name || !business_type) {
      return NextResponse.json(
        { error: "Missing required fields: full_name, email, organization_name, business_type" },
        { status: 400 }
      );
    }

    // Validate email using robust validation
    if (!validateEmail(email)) {
      return NextResponse.json(
        { error: "Invalid email address format" },
        { status: 400 }
      );
    }

    // Validate phone if provided
    if (phone && !validatePhone(phone)) {
      return NextResponse.json(
        { error: "Invalid phone number format" },
        { status: 400 }
      );
    }

    // Sanitize all text inputs
    const sanitizedName = sanitizeString(enforceMaxLength(full_name, 200));
    const sanitizedOrgName = sanitizeString(enforceMaxLength(organization_name, 300));
    const sanitizedBusinessType = sanitizeString(enforceMaxLength(business_type, 100));
    const sanitizedMessage = message ? sanitizeString(enforceMaxLength(message, 2000)) : null;
    const sanitizedPhone = phone ? sanitizeString(phone) : null;

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
              organization_name: sanitizedOrgName,
              business_type: sanitizedBusinessType,
              phone: sanitizedPhone,
              message: sanitizedMessage,
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
        full_name: sanitizedName,
        email: email.trim().toLowerCase(),
        phone: sanitizedPhone,
        organization_name: sanitizedOrgName,
        business_type: sanitizedBusinessType,
        message: sanitizedMessage,
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
      safeError(err, "Internal server error"),
      { status: 500 }
    );
  }
}
