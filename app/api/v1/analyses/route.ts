import { createServiceClient } from "@/lib/supabase/service";
import { NextRequest, NextResponse } from "next/server";

async function hashKey(key: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(key);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export async function GET(request: NextRequest) {
  const auth = request.headers.get("Authorization") ?? "";
  const rawKey = auth.startsWith("Bearer ") ? auth.slice(7).trim() : null;

  if (!rawKey) {
    return NextResponse.json({ error: "API 키가 필요합니다." }, { status: 401 });
  }

  const keyHash = await hashKey(rawKey);
  const supabase = createServiceClient();

  // API 키 검증
  const { data: keyRow } = await supabase
    .from("api_keys")
    .select("id, team_id")
    .eq("key_hash", keyHash)
    .maybeSingle();

  if (!keyRow) {
    return NextResponse.json({ error: "유효하지 않은 API 키입니다." }, { status: 401 });
  }

  // last_used_at 갱신
  await supabase
    .from("api_keys")
    .update({ last_used_at: new Date().toISOString() })
    .eq("id", keyRow.id);

  // 팀 멤버 user_id 목록
  const { data: members } = await supabase
    .from("team_members")
    .select("user_id")
    .eq("team_id", keyRow.team_id)
    .eq("status", "active")
    .not("user_id", "is", null);

  const userIds = (members ?? []).map((m) => m.user_id).filter(Boolean);

  // 검색 파라미터
  const url = request.nextUrl;
  const type = url.searchParams.get("type");
  const limit = Math.min(Number(url.searchParams.get("limit") ?? 20), 100);
  const offset = Number(url.searchParams.get("offset") ?? 0);

  let query = supabase
    .from("analyses")
    .select("id, type, title, domain, created_at, user_id")
    .in("user_id", userIds)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (type) query = query.eq("type", type);

  const { data: analyses, error } = await query;

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ analyses: analyses ?? [], total: analyses?.length ?? 0 });
}
