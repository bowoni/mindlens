import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { email, role = "contributor" } = await request.json();
  const validRoles = ["viewer", "contributor", "admin"];
  const assignedRole = validRoles.includes(role) ? role : "contributor";
  if (!email?.trim()) return NextResponse.json({ error: "이메일을 입력하세요." }, { status: 400 });

  const { data: team } = await supabase
    .from("teams")
    .select("id")
    .eq("owner_id", user.id)
    .maybeSingle();

  if (!team) return NextResponse.json({ error: "팀이 없습니다." }, { status: 404 });

  const { count } = await supabase
    .from("team_members")
    .select("*", { count: "exact", head: true })
    .eq("team_id", team.id)
    .eq("status", "active");

  if ((count ?? 0) >= 5) {
    return NextResponse.json({ error: "팀원은 최대 5명까지 가능합니다." }, { status: 400 });
  }

  const { data: existing } = await supabase
    .from("team_members")
    .select("id")
    .eq("team_id", team.id)
    .eq("user_email", email.trim().toLowerCase())
    .maybeSingle();

  if (existing) return NextResponse.json({ error: "이미 팀원입니다." }, { status: 400 });

  const serviceClient = createServiceClient();
  const { data: { users } } = await serviceClient.auth.admin.listUsers();
  const matchedUser = users.find((u) => u.email?.toLowerCase() === email.trim().toLowerCase());

  if (!matchedUser) {
    return NextResponse.json({ error: "가입되지 않은 이메일입니다. 먼저 MindLens에 가입해야 초대할 수 있습니다." }, { status: 404 });
  }

  await supabase.from("team_members").insert({
    team_id: team.id,
    user_email: email.trim().toLowerCase(),
    user_id: matchedUser.id,
    role: assignedRole,
    status: "active",
  });

  return NextResponse.json({ success: true });
}
