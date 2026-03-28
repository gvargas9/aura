import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { renderEmailPreview } from "@/lib/email/renderer";
import { NOTIFICATION_TEMPLATES } from "@/lib/notifications/templates";

export async function GET(request: NextRequest) {
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
      .select("role")
      .eq("id", user.id)
      .single();

    if (!profile || profile.role !== "admin") {
      return NextResponse.json(
        { success: false, error: "Forbidden" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const template = searchParams.get("template");

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

    // If ?format=html, return raw HTML for iframe rendering
    const format = searchParams.get("format");
    if (format === "html") {
      return new NextResponse(rendered.html, {
        headers: { "Content-Type": "text/html; charset=utf-8" },
      });
    }

    return NextResponse.json({
      success: true,
      data: rendered,
    });
  } catch (error) {
    console.error("GET /api/email/preview error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
