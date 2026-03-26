import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

async function hashKey(key: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(key);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

// GET: API 키 목록
export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: team } = await supabase
    .from("teams")
    .select("id")
    .eq("owner_id", user.id)
    .maybeSingle();

  if (!team) return NextResponse.json({ keys: [] });

  const { data: keys } = await supabase
    .from("api_keys")
    .select("id, name, key_prefix, key_value, created_at, last_used_at")
    .eq("team_id", team.id)
    .order("created_at", { ascending: false });

  return NextResponse.json({ keys: keys ?? [] });
}

// POST: API 키 생성
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: team } = await supabase
    .from("teams")
    .select("id")
    .eq("owner_id", user.id)
    .maybeSingle();

  if (!team) return NextResponse.json({ error: "팀이 없습니다." }, { status: 404 });

  const { name } = await request.json();
  if (!name?.trim()) return NextResponse.json({ error: "키 이름을 입력하세요." }, { status: 400 });

  const rawKey = `ml_${crypto.randomUUID().replace(/-/g, "")}`;
  const keyPrefix = rawKey.slice(0, 12);
  const keyHash = await hashKey(rawKey);

  const { data: keyRow, error } = await supabase
    .from("api_keys")
    .insert({ team_id: team.id, name: name.trim(), key_prefix: keyPrefix, key_hash: keyHash, key_value: rawKey })
    .select("id, name, key_prefix, key_value, created_at")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ key: keyRow });
}
