import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // 내 팀의 멤버인지 확인
  const { data: member } = await supabase
    .from("team_members")
    .select("id, role, teams(owner_id)")
    .eq("id", id)
    .maybeSingle();

  if (!member) return NextResponse.json({ error: "멤버를 찾을 수 없습니다." }, { status: 404 });

  const team = member.teams as { owner_id: string } | null;
  if (team?.owner_id !== user.id) {
    return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });
  }

  if (member.role === "owner") {
    return NextResponse.json({ error: "팀 소유자는 삭제할 수 없습니다." }, { status: 400 });
  }

  await supabase.from("team_members").delete().eq("id", id);

  return NextResponse.json({ success: true });
}
