import { createClient } from "@/lib/supabase/server";
import DashboardGrid from "@/components/dashboard-grid";
import NewAnalysisButton from "@/components/new-analysis-button";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const month = new Date().toISOString().slice(0, 7);
  const freeLimit = Number(process.env.FREE_ANALYSIS_LIMIT ?? 5);

  const [{ data: analyses }, { data: usage }, { data: teamMembership }, { data: ownedTeam }, { data: subscription }] = await Promise.all([
    supabase
      .from("analyses")
      .select("id, type, title, domain, is_starred, created_at")
      .eq("user_id", user!.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("usage")
      .select("count")
      .eq("user_id", user!.id)
      .eq("month", month)
      .single(),
    supabase
      .from("team_members")
      .select("role, team_id, teams(name)")
      .eq("user_id", user!.id)
      .eq("status", "active")
      .maybeSingle(),
    supabase
      .from("teams")
      .select("id, name")
      .eq("owner_id", user!.id)
      .maybeSingle(),
    supabase
      .from("subscriptions")
      .select("plan, cancel_at_period_end, current_period_end")
      .eq("user_id", user!.id)
      .eq("status", "active")
      .maybeSingle(),
  ]);

  const isOwner = !!ownedTeam;
  const teamId = ownedTeam?.id ?? teamMembership?.team_id ?? null;
  const teamRole = isOwner ? "owner" : (teamMembership?.role ?? null);
  let teamAddedIds: string[] = [];
  if (teamId) {
    const { data: ta } = await supabase
      .from("team_analyses")
      .select("analysis_id")
      .eq("team_id", teamId);
    teamAddedIds = (ta ?? []).map((r) => r.analysis_id);
  }

  const isExpired =
    subscription?.cancel_at_period_end &&
    subscription.current_period_end &&
    new Date(subscription.current_period_end) <= new Date();
  const plan = isExpired ? "free" : (subscription?.plan ?? "free");
  const isFree = plan === "free";

  const sevenDaysAgo = new Date(new Date().getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const list = (analyses ?? []).filter((a) =>
    isFree ? a.created_at >= sevenDaysAgo : true
  );
  const usedCount = usage?.count ?? 0;

  const stats = [
    { label: "전체 분석", value: list.length },
    { label: "문서", value: list.filter((a) => a.type === "document").length },
    { label: "영상", value: list.filter((a) => a.type === "video").length },
    { label: "이번 달 사용", value: isFree ? `${usedCount} / ${freeLimit}` : String(usedCount) },
  ];

  const teamName = ownedTeam?.name ?? (teamMembership?.teams as unknown as { name: string } | null)?.name ?? null;

  return (
    <div className="max-w-5xl mx-auto px-6 py-10">
      {/* 팀 초대 알림 */}
      {teamName && teamRole !== "owner" && (
        <Link
          href="/team"
          className="flex items-center justify-between mb-6 px-4 py-3 rounded-xl border border-accent/30 bg-(--accent-subtle) hover:border-accent/60 transition-colors"
        >
          <div className="flex items-center gap-3">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
            </svg>
            <span className="text-sm text-accent font-medium">
              <strong>{teamName}</strong> 팀에 초대되었습니다. 팀 대시보드 보기 →
            </span>
          </div>
        </Link>
      )}

      {/* 헤더 */}
      <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-foreground tracking-tight">대시보드</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{user?.email}</p>
        </div>
        <NewAnalysisButton />
      </div>

      {/* 통계 */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
        {stats.map((s) => (
          <div key={s.label} className="rounded-xl border border-border bg-card px-4 py-3">
            <p className="text-xs text-muted-foreground mb-1">{s.label}</p>
            <p className="text-xl font-semibold text-foreground">{s.value}</p>
          </div>
        ))}
      </div>

      {/* 분석 목록 */}
      <DashboardGrid
        analyses={list}
        teamContext={teamRole ? { role: teamRole, addedIds: teamAddedIds } : undefined}
      />
    </div>
  );
}
