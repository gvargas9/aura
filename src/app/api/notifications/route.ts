import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

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

    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const pageSize = Math.min(
      50,
      Math.max(1, parseInt(searchParams.get("pageSize") || "10", 10))
    );
    const offset = (page - 1) * pageSize;

    // Fetch notifications
    const { data: items, error: fetchError } = await supabase
      .from("omni_interaction_log")
      .select("*")
      .eq("user_id", user.id)
      .eq("direction", "outbound")
      .order("created_at", { ascending: false })
      .range(offset, offset + pageSize - 1);

    if (fetchError) {
      return NextResponse.json(
        { success: false, error: fetchError.message },
        { status: 500 }
      );
    }

    // Get total count
    const { count } = await supabase
      .from("omni_interaction_log")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("direction", "outbound");

    const total = count || 0;

    // Calculate unread count (metadata.read is not true)
    const unreadCount = (items || []).filter(
      (item) => !(item.metadata as Record<string, unknown> | null)?.read
    ).length;

    // For a more accurate global unread count, query all unread
    const { count: globalUnreadCount } = await supabase
      .from("omni_interaction_log")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("direction", "outbound")
      .or("metadata.is.null,metadata->>read.is.null,metadata->>read.neq.true");

    return NextResponse.json({
      success: true,
      data: {
        items: items || [],
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
        unreadCount: globalUnreadCount ?? unreadCount,
      },
    });
  } catch (error) {
    console.error("GET /api/notifications error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
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

    const body = await request.json();
    const { ids } = body as { ids: string[] };

    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(
        { success: false, error: "ids must be a non-empty array" },
        { status: 400 }
      );
    }

    // Fetch existing records to merge metadata
    const { data: existing, error: fetchError } = await supabase
      .from("omni_interaction_log")
      .select("id, metadata")
      .eq("user_id", user.id)
      .in("id", ids);

    if (fetchError) {
      return NextResponse.json(
        { success: false, error: fetchError.message },
        { status: 500 }
      );
    }

    // Update each record's metadata with read: true
    const updates = (existing || []).map((record) => {
      const currentMeta = (record.metadata as Record<string, unknown>) || {};
      return supabase
        .from("omni_interaction_log")
        .update({
          metadata: { ...currentMeta, read: true },
        })
        .eq("id", record.id)
        .eq("user_id", user.id);
    });

    await Promise.all(updates);

    return NextResponse.json({
      success: true,
      message: `Marked ${ids.length} notification(s) as read`,
    });
  } catch (error) {
    console.error("PUT /api/notifications error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
