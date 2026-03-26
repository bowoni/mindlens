import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: ownedTeam } = await supabase
    .from("teams")
    .select("*, team_members(*)")
    .eq("owner_id", user.id)
    .maybeSingle();

  if (ownedTeam) return NextResponse.json({ team: ownedTeam, role: "owner" });

  const { data: membership } = await supabase
    .from("team_members")
    .select("team_id, role, teams(*, team_members(*))")
    .eq("user_id", user.id)
    .eq("status", "active")
    .maybeSingle();

  if (membership) return NextResponse.json({ team: membership.teams, role: membership.role });

  return NextResponse.json({ team: null });
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: sub } = await supabase
    .from("subscriptions")
    .select("plan")
    .eq("user_id", user.id)
    .eq("status", "active")
    .maybeSingle();

  if (sub?.plan !== "team") {
    return NextResponse.json({ error: "Team 플랜이 필요합니다." }, { status: 403 });
  }

  const { data: existing } = await supabase
    .from("teams")
    .select("id")
    .eq("owner_id", user.id)
    .maybeSingle();

  if (existing) return NextResponse.json({ error: "이미 팀이 있습니다." }, { status: 400 });

  const { name } = await request.json();
  if (!name?.trim()) return NextResponse.json({ error: "팀 이름을 입력하세요." }, { status: 400 });

  const { data: team, error } = await supabase
    .from("teams")
    .insert({ name: name.trim(), owner_id: user.id })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await supabase.from("team_members").insert({
    team_id: team.id,
    user_email: user.email,
    user_id: user.id,
    role: "owner",
    status: "active",
  });

  return NextResponse.json({ team });
}

export async function DELETE() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: team } = await supabase
    .from("teams")
    .select("id")
    .eq("owner_id", user.id)
    .maybeSingle();

  if (!team) return NextResponse.json({ error: "팀이 없습니다." }, { status: 404 });

  // FK 의존 순서로 삭제
  await supabase.from("team_analyses").delete().eq("team_id", team.id);
  await supabase.from("team_members").delete().eq("team_id", team.id);
  await supabase.from("teams").delete().eq("id", team.id);

  return NextResponse.json({ success: true });
}
