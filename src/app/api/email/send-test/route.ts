import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { renderEmailPreview } from "@/lib/email/renderer";
import { NOTIFICATION_TEMPLATES } from "@/lib/notifications/templates";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Verify admin role
    const { data: profile } = await supabase
      .from("profiles")
      .select("role, email")
      .eq("id", user.id)
      .single();

    if (!profile || profile.role !== "admin") {
      return NextResponse.json(
        { success: false, error: "Forbidden" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { template, recipientEmail } = body as {
      template: string;
      recipientEmail?: string;
    };

    if (!template || !NOTIFICATION_TEMPLATES[template]) {
      return NextResponse.json(
        {
          success: false,
          error: `Invalid template key. Available: ${Object.keys(NOTIFICATION_TEMPLATES).join(", ")}`,
        },
        { status: 400 }
      );
    }

    const rendered = renderEmailPreview(template);
    const recipient = recipientEmail || profile.email;

    // Log the test email to omni_interaction_log
    const { error: logError } = await supabase
      .from("omni_interaction_log")
      .insert({
        user_id: user.id,
        channel: "email",
        direction: "outbound",
        content: `[TEST] ${rendered.subject}\n\n${rendered.text}`,
        metadata: {
          template_key: template,
          is_test: true,
          recipient,
          subject: rendered.subject,
        },
      });

    if (logError) {
      console.error("Failed to log test email:", logError);
      return NextResponse.json(
        { success: false, error: "Failed to log test email" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Test email logged for template "${template}" to ${recipient}`,
      data: rendered,
    });
  } catch (error) {
    console.error("POST /api/email/send-test error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
