import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/client";
import { checkRateLimit } from "@/lib/security/rate-limit";

type HistoryRow = {
  id: string;
  service: string;
  description: string;
  tone: string;
  platform: string;
  result: string;
  created_at: string;
};

type CreateHistoryBody = {
  service?: unknown;
  description?: unknown;
  tone?: unknown;
  platform?: unknown;
  result?: unknown;
};

type DeleteHistoryBody = {
  id?: unknown;
};

const TABLE = "copywriter_history";

function isBrowserOriginAllowed(request: Request) {
  const origin = request.headers.get("origin");
  const host = request.headers.get("host");

  if (!origin || !host) {
    return true;
  }

  try {
    const originUrl = new URL(origin);
    return originUrl.host === host;
  } catch {
    return false;
  }
}

export async function GET() {
  try {
    const supabase = createSupabaseAdminClient();
    const { data, error } = await supabase
      .from(TABLE)
      .select("id, service, description, tone, platform, result, created_at")
      .order("created_at", { ascending: false })
      .limit(5);

    if (error) {
      throw error;
    }

    const history = ((data ?? []) as HistoryRow[]).map((item) => ({
      id: item.id,
      service: item.service,
      description: item.description,
      tone: item.tone,
      platform: item.platform,
      result: item.result,
      createdAt: item.created_at,
    }));

    return NextResponse.json({ history });
  } catch (error) {
    console.error("Copywriter history GET error:", error);
    return NextResponse.json(
      { error: "Failed to load copywriter history." },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  if (!isBrowserOriginAllowed(request)) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  const rateLimit = checkRateLimit(request, "copywriter-history-post", 10, 60_000);

  if (!rateLimit.ok) {
    return NextResponse.json(
      { error: "請求過於頻繁，請稍後再試。" },
      {
        status: 429,
        headers: {
          "Retry-After": String(rateLimit.retryAfterSeconds ?? 60),
        },
      },
    );
  }

  let body: CreateHistoryBody;

  try {
    body = (await request.json()) as CreateHistoryBody;
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body." },
      { status: 400 },
    );
  }

  const service = typeof body.service === "string" ? body.service.trim() : "";
  const description = typeof body.description === "string" ? body.description.trim() : "";
  const tone = typeof body.tone === "string" ? body.tone.trim() : "";
  const platform = typeof body.platform === "string" ? body.platform.trim() : "";
  const result = typeof body.result === "string" ? body.result.trim() : "";

  if (!service || !description || !tone || !platform || !result) {
    return NextResponse.json(
      { error: "service, description, tone, platform, result are required." },
      { status: 400 },
    );
  }

  try {
    const supabase = createSupabaseAdminClient();

    const { error } = await supabase.from(TABLE).insert({
      service,
      description,
      tone,
      platform,
      result,
    });

    if (error) {
      throw error;
    }

    const { data, error: fetchError } = await supabase
      .from(TABLE)
      .select("id, service, description, tone, platform, result, created_at")
      .order("created_at", { ascending: false })
      .limit(5);

    if (fetchError) {
      throw fetchError;
    }

    const history = ((data ?? []) as HistoryRow[]).map((item) => ({
      id: item.id,
      service: item.service,
      description: item.description,
      tone: item.tone,
      platform: item.platform,
      result: item.result,
      createdAt: item.created_at,
    }));

    return NextResponse.json({ history });
  } catch (error) {
    console.error("Copywriter history POST error:", error);
    return NextResponse.json(
      { error: "Failed to save copywriter history." },
      { status: 500 },
    );
  }
}

export async function DELETE(request: Request) {
  if (!isBrowserOriginAllowed(request)) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  const rateLimit = checkRateLimit(request, "copywriter-history-delete", 10, 60_000);

  if (!rateLimit.ok) {
    return NextResponse.json(
      { error: "請求過於頻繁，請稍後再試。" },
      {
        status: 429,
        headers: {
          "Retry-After": String(rateLimit.retryAfterSeconds ?? 60),
        },
      },
    );
  }

  let body: DeleteHistoryBody;

  try {
    body = (await request.json()) as DeleteHistoryBody;
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body." },
      { status: 400 },
    );
  }

  const id = typeof body.id === "string" ? body.id.trim() : "";

  if (!id) {
    return NextResponse.json(
      { error: "id is required." },
      { status: 400 },
    );
  }

  try {
    const supabase = createSupabaseAdminClient();
    const { error } = await supabase.from(TABLE).delete().eq("id", id);

    if (error) {
      throw error;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Copywriter history DELETE error:", error);
    return NextResponse.json(
      { error: "Failed to delete copywriter history." },
      { status: 500 },
    );
  }
}
