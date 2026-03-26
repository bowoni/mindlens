import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { NextRequest, NextResponse } from "next/server";

// GET: 팀 대시보드 분석 목록
export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: membership } = await supabase
    .from("team_members")
    .select("team_id, role")
    .eq("user_id", user.id)
    .eq("status", "active")
    .maybeSingle();

  if (!membership) return NextResponse.json({ analyses: [], role: null, teamId: null });

  const service = createServiceClient();
  const { data } = await service
    .from("team_analyses")
    .select("id, analysis_id, added_by, created_at, is_starred, analyses(id, type, title, domain, created_at)")
    .eq("team_id", membership.team_id)
    .order("is_starred", { ascending: false })
    .order("created_at", { ascending: false });

  return NextResponse.json({
    analyses: data ?? [],
    role: membership.role,
    teamId: membership.team_id,
  });
}

// POST: 팀 대시보드에 분석 추가
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { analysisId } = await request.json();
  if (!analysisId) return NextResponse.json({ error: "분석 ID가 필요합니다." }, { status: 400 });

  const { data: membership } = await supabase
    .from("team_members")
    .select("team_id, role")
    .eq("user_id", user.id)
    .eq("status", "active")
    .maybeSingle();

  if (!membership) return NextResponse.json({ error: "팀 멤버가 아닙니다." }, { status: 403 });
  if (!["owner", "admin", "contributor"].includes(membership.role)) {
    return NextResponse.json({ error: "추가 권한이 없습니다. (contributor 이상 필요)" }, { status: 403 });
  }

  const { error } = await supabase.from("team_analyses").insert({
    team_id: membership.team_id,
    analysis_id: analysisId,
    added_by: user.id,
  });

  if (error?.code === "23505") return NextResponse.json({ error: "이미 추가된 분석입니다." }, { status: 409 });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true });
}

// PATCH: 즐겨찾기 토글
export async function PATCH(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { teamAnalysisId, starred } = await request.json();

  const { data: membership } = await supabase
    .from("team_members")
    .select("team_id")
    .eq("user_id", user.id)
    .eq("status", "active")
    .maybeSingle();

  if (!membership) return NextResponse.json({ error: "팀 멤버가 아닙니다." }, { status: 403 });

  await supabase
    .from("team_analyses")
    .update({ is_starred: starred })
    .eq("id", teamAnalysisId)
    .eq("team_id", membership.team_id);

  return NextResponse.json({ success: true });
}

// DELETE: 팀 대시보드에서 분석 제거
export async function DELETE(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const analysisId = request.nextUrl.searchParams.get("analysisId");
  if (!analysisId) return NextResponse.json({ error: "분석 ID가 필요합니다." }, { status: 400 });

  const { data: membership } = await supabase
    .from("team_members")
    .select("team_id, role")
    .eq("user_id", user.id)
    .eq("status", "active")
    .maybeSingle();

  if (!membership) return NextResponse.json({ error: "팀 멤버가 아닙니다." }, { status: 403 });
  if (!["owner", "admin"].includes(membership.role)) {
    return NextResponse.json({ error: "삭제 권한이 없습니다. (admin 이상 필요)" }, { status: 403 });
  }

  await supabase
    .from("team_analyses")
    .delete()
    .eq("team_id", membership.team_id)
    .eq("analysis_id", analysisId);

  return NextResponse.json({ success: true });
}
